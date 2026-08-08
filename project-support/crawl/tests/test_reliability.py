from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

import requests

from crawl.lib.http import (
    ChallengeError,
    HttpClient,
    HttpError,
    assert_allowed_url,
    decode_response,
    looks_like_challenge,
)
from crawl.lib.output import write_json_atomically
from crawl.lib.runner import _failure_reason, preserve_or_fail, publish_items
from crawl.lib.validate import ValidationError, validate_items


class FakeResponse:
    def __init__(
        self,
        status=200,
        content=b"{}",
        content_type="application/json",
        url="https://example.com/data",
        history=None,
        headers=None,
    ):
        self.status_code = status
        self.content = content
        self.url = url
        self.history = history or []
        self.headers = {"Content-Type": content_type, **(headers or {})}

    @property
    def text(self):
        return self.content.decode("utf-8")

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"status {self.status_code}")


class HttpTests(unittest.TestCase):
    def test_failure_reason_is_bounded_and_sanitized(self):
        reason = _failure_reason(HttpError("request failed for https://user:secret@example.com/?token=x"))
        self.assertEqual(reason, "HttpError: http")
        self.assertNotIn("secret", reason)
        self.assertNotIn("token", reason)
        self.assertEqual(_failure_reason(ChallengeError("sensitive page body")), "ChallengeError: challenge")
        self.assertEqual(_failure_reason(requests.exceptions.ConnectTimeout("private URL")), "ConnectTimeout: timeout")

    def test_rejects_non_https_and_credentials(self):
        with self.assertRaises(HttpError):
            assert_allowed_url("http://example.com/data", ["example.com"])
        with self.assertRaises(HttpError):
            assert_allowed_url("https://user:pass@example.com/data", ["example.com"])

    @patch("crawl.lib.http.time.sleep")
    def test_retries_transient_status(self, sleep):
        session = Mock()
        session.request.side_effect = [FakeResponse(503), FakeResponse()]
        response = HttpClient(allowed_hostnames=["example.com"], session=session).get(
            "https://example.com/data"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(session.request.call_count, 2)
        sleep.assert_called_once()

    @patch("crawl.lib.http.time.sleep")
    def test_uses_allowlisted_fallback_after_primary_retries(self, sleep):
        session = Mock()
        session.request.side_effect = [
            requests.ConnectTimeout(),
            requests.ConnectTimeout(),
            FakeResponse(content=b'[{"ok": true}]', url="https://fallback.example.com/data"),
        ]
        response = HttpClient(
            allowed_hostnames=["primary.example.com", "fallback.example.com"],
            session=session,
            retries=1,
        ).get(
            "https://primary.example.com/data",
            fallback_urls=["https://fallback.example.com/data"],
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(session.request.call_args.args[1], "https://fallback.example.com/data")
        self.assertEqual(session.request.call_count, 3)

    def test_rejects_redirects_outside_https_allowlist(self):
        session = Mock()
        redirect = FakeResponse(
            status=302,
            url="https://example.com/data",
            headers={"Location": "http://example.com/final"},
        )
        session.request.return_value = FakeResponse(
            url="http://example.com/final",
            history=[redirect],
        )
        with self.assertRaises(HttpError):
            HttpClient(allowed_hostnames=["example.com"], session=session, retries=0).get(
                "https://example.com/data"
            )

        redirect.headers["Location"] = "https://other.example.com/final"
        session.request.return_value = FakeResponse(
            url="https://other.example.com/final",
            history=[redirect],
        )
        with self.assertRaises(HttpError):
            HttpClient(allowed_hostnames=["example.com"], session=session, retries=0).get(
                "https://example.com/data"
            )

    def test_accepts_redirects_within_https_allowlist(self):
        session = Mock()
        redirect = FakeResponse(
            status=302,
            url="https://example.com/data",
            headers={"Location": "/final"},
        )
        session.request.return_value = FakeResponse(
            url="https://example.com/final",
            history=[redirect],
        )
        response = HttpClient(
            allowed_hostnames=["example.com"], session=session, retries=0
        ).get("https://example.com/data")
        self.assertEqual(response.url, "https://example.com/final")

    def test_challenge_detection_requires_page_level_evidence(self):
        self.assertFalse(looks_like_challenge("A project supports captcha integrations."))
        self.assertTrue(looks_like_challenge("<title>Verify you are human</title>"))
        self.assertTrue(looks_like_challenge('<div class="g-recaptcha"></div>'))

    def test_decodes_declared_xml_encoding_before_fallback(self):
        response = FakeResponse(
            content='<?xml version="1.0" encoding="UTF-8"?><title>美团技术</title>'.encode("utf-8"),
            content_type="application/xml",
        )
        self.assertIn("美团技术", decode_response(response))

    def test_rejects_challenge_and_oversized_response(self):
        session = Mock()
        session.request.return_value = FakeResponse(
            content=b"<title>Verify you are human</title>", content_type="text/html"
        )
        with self.assertRaises(ChallengeError):
            HttpClient(allowed_hostnames=["example.com"], session=session, retries=0).get(
                "https://example.com/data"
            )
        session.request.return_value = FakeResponse(content=b"x" * 10)
        with self.assertRaises(HttpError):
            HttpClient(
                allowed_hostnames=["example.com"], session=session, max_bytes=5, retries=0
            ).get("https://example.com/data")


class ValidationAndOutputTests(unittest.TestCase):
    def article(self):
        return {
            "title": "Title",
            "url": "https://example.com/item",
            "time": "2026-08-01 00:00:00",
            "timestamp": 1_754_006_400_000,
            "website": "example",
        }

    def test_rejects_empty_duplicate_and_sensitive_fields(self):
        with self.assertRaises(ValidationError):
            validate_items([], kind="article")
        duplicate = [self.article(), self.article()]
        with self.assertRaises(ValidationError):
            validate_items(duplicate, kind="article", require_unique="url")
        sensitive = self.article() | {"access_token": "redacted"}
        with self.assertRaises(ValidationError):
            validate_items([sensitive], kind="article")

    def test_atomic_write_preserves_old_file_when_validation_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "data.json"
            path.write_text('[{"old": true}]\n', encoding="utf-8")
            before = path.read_bytes()
            with self.assertRaises(ValidationError):
                write_json_atomically(
                    path,
                    [],
                    validate=lambda items: validate_items(items, kind="article"),
                )
            self.assertEqual(path.read_bytes(), before)
            self.assertEqual(list(path.parent.glob("*.tmp")), [])

    def test_preserve_rejects_duplicate_existing_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "data.json"
            path.write_text(json.dumps([self.article(), self.article()]), encoding="utf-8")
            result = preserve_or_fail(
                name="example",
                output=path,
                kind="article",
                reason="source failed",
                unique_by="url",
            )
            self.assertEqual(result.state, "failed")

    def test_publish_and_preserve_states(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "data.json"
            result = publish_items(
                name="example", output=path, items=[self.article()], kind="article"
            )
            self.assertEqual(result.state, "success")
            preserved = preserve_or_fail(
                name="example", output=path, kind="article", reason="source failed"
            )
            self.assertEqual(preserved.state, "preserved")
            path.write_text("[]\n", encoding="utf-8")
            failed = preserve_or_fail(
                name="example", output=path, kind="article", reason="source failed"
            )
            self.assertEqual(failed.state, "failed")


if __name__ == "__main__":
    unittest.main()
