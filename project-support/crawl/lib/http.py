from __future__ import annotations

import re
import time
from collections.abc import Iterable
from urllib.parse import urljoin, urlparse

import requests

DEFAULT_CONTENT_TYPES = (
    "application/atom+xml",
    "application/json",
    "application/rss+xml",
    "application/xml",
    "image/",
    "text/html",
    "text/xml",
)
CHALLENGE_PATTERNS = (
    r"<title[^>]*>[^<]*(?:captcha|verify you are human|security verification|访问验证|验证码)",
    r"(?:class|id)=[\"'][^\"']*(?:g-recaptcha|h-captcha|cf-chl|captcha-container)",
    r"(?:verify you are human|security verification|登录后继续|访问验证|请输入验证码)",
)
CHARSET_PATTERN = re.compile(
    rb"(?:charset\s*=\s*[\"']?|encoding\s*=\s*[\"'])([a-zA-Z0-9._-]+)", re.IGNORECASE
)


class HttpError(RuntimeError):
    pass


class ChallengeError(HttpError):
    pass


def assert_allowed_url(value: str, allowed_hostnames: Iterable[str]) -> str:
    parsed = urlparse(value)
    hosts = {hostname.lower() for hostname in allowed_hostnames}
    if parsed.scheme != "https":
        raise HttpError("collector URL must use HTTPS")
    if parsed.username or parsed.password:
        raise HttpError("collector URL must not contain credentials")
    if not parsed.hostname or parsed.hostname.lower() not in hosts:
        raise HttpError("collector URL hostname is not allowed")
    return value


def looks_like_challenge(text: str) -> bool:
    sample = text[:200_000].lower()
    return any(re.search(pattern, sample, re.IGNORECASE) for pattern in CHALLENGE_PATTERNS)


def decode_response(response: requests.Response, default: str = "utf-8") -> str:
    content_type = response.headers.get("Content-Type", "")
    header_match = re.search(r"charset\s*=\s*([a-zA-Z0-9._-]+)", content_type, re.IGNORECASE)
    body_match = CHARSET_PATTERN.search(response.content[:4096])
    declared = header_match.group(1) if header_match else None
    if not declared and body_match:
        declared = body_match.group(1).decode("ascii", "ignore")
    candidates = [declared, default, "gb18030"]
    for encoding in dict.fromkeys(value for value in candidates if value):
        try:
            return response.content.decode(encoding)
        except (LookupError, UnicodeDecodeError):
            continue
    raise HttpError("response text could not be decoded with a declared or supported encoding")


class HttpClient:
    def __init__(
        self,
        *,
        allowed_hostnames: Iterable[str],
        max_bytes: int = 2_000_000,
        retries: int = 2,
        timeout: tuple[float, float] = (5, 20),
        session: requests.Session | None = None,
        user_agent: str = "lptff.github.io collector/1.0",
    ) -> None:
        self.allowed_hostnames = tuple(allowed_hostnames)
        self._allowed_hostname_set = {hostname.lower() for hostname in self.allowed_hostnames}
        self.max_bytes = max_bytes
        self.retries = retries
        self.timeout = timeout
        self.session = session or requests.Session()
        self.user_agent = user_agent

    def request(
        self,
        method: str,
        url: str,
        *,
        expected_content_types: Iterable[str] = DEFAULT_CONTENT_TYPES,
        headers: dict[str, str] | None = None,
        fallback_urls: Iterable[str] = (),
        **kwargs: object,
    ) -> requests.Response:
        urls = (url, *fallback_urls)
        for request_url in urls:
            assert_allowed_url(request_url, self.allowed_hostnames)
        request_headers = {"User-Agent": self.user_agent, **(headers or {})}
        last_error: Exception | None = None

        for request_url in urls:
            for attempt in range(self.retries + 1):
                try:
                    response = self.session.request(
                        method,
                        request_url,
                        headers=request_headers,
                        timeout=self.timeout,
                        **kwargs,
                    )
                    for redirect in response.history:
                        assert_allowed_url(redirect.url, self._allowed_hostname_set)
                        location = redirect.headers.get("Location")
                        if location:
                            assert_allowed_url(
                                urljoin(redirect.url, location), self._allowed_hostname_set
                            )
                    assert_allowed_url(response.url, self._allowed_hostname_set)
                    if response.status_code == 429 or 500 <= response.status_code < 600:
                        if attempt < self.retries:
                            time.sleep(0.25 * (2**attempt))
                            continue
                    response.raise_for_status()
                    content_type = response.headers.get("Content-Type", "").split(";", 1)[0].lower()
                    if expected_content_types and not any(
                        content_type.startswith(expected.lower()) for expected in expected_content_types
                    ):
                        raise HttpError(f"unexpected Content-Type: {content_type or 'missing'}")
                    if len(response.content) > self.max_bytes:
                        raise HttpError("response exceeds configured size limit")
                    if content_type.startswith("text/") and looks_like_challenge(response.text):
                        raise ChallengeError("source returned a login or challenge page")
                    return response
                except (requests.RequestException, HttpError) as error:
                    last_error = error
                    if isinstance(error, ChallengeError) or attempt >= self.retries:
                        break
                    time.sleep(0.25 * (2**attempt))
            if isinstance(last_error, ChallengeError):
                break

        if isinstance(last_error, HttpError):
            raise last_error
        raise HttpError(f"request failed: {type(last_error).__name__}") from last_error

    def get(self, url: str, **kwargs: object) -> requests.Response:
        return self.request("GET", url, **kwargs)

    def post(self, url: str, **kwargs: object) -> requests.Response:
        return self.request("POST", url, **kwargs)
