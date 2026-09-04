from __future__ import annotations

from collections.abc import Callable, Iterable
from pathlib import Path

import requests

from .http import ChallengeError, HttpError
from .output import data_path, write_json_atomically
from .status import CollectorResult
from .validate import ValidationError, existing_snapshot_is_valid, validate_items


def publish_items(
    *,
    name: str,
    output: str | Path,
    items: list[dict[str, object]],
    kind: str,
    min_items: int = 1,
    unique_by: str | None = None,
    allowed_http_hostnames: Iterable[str] = (),
) -> CollectorResult:
    path = Path(output)
    if not path.is_absolute():
        path = data_path(str(path))

    def validate(candidate: list[dict[str, object]]) -> object:
        return validate_items(
            candidate,
            kind=kind,
            min_items=min_items,
            require_unique=unique_by,
            allowed_http_hostnames=allowed_http_hostnames,
        )

    write_json_atomically(path, items, validate=validate)
    return CollectorResult(name, "success", len(items), str(path))


def _failure_reason(error: Exception) -> str:
    if isinstance(error, ChallengeError):
        category = "challenge"
    elif isinstance(error, (requests.exceptions.ConnectTimeout, requests.exceptions.ReadTimeout)):
        category = "timeout"
    elif isinstance(error, requests.exceptions.SSLError):
        category = "tls"
    elif isinstance(error, requests.exceptions.ConnectionError):
        category = "connection"
    elif isinstance(error, ValidationError):
        category = "invalid-candidate"
    elif isinstance(error, HttpError):
        message = str(error).lower()
        category = next(
            (
                value
                for marker, value in (
                    ("timeout", "timeout"),
                    ("ssl", "tls"),
                    ("certificate", "tls"),
                    ("content-type", "invalid-response"),
                    ("size limit", "invalid-response"),
                )
                if marker in message
            ),
            "http",
        )
    else:
        category = "collector"
    return f"{type(error).__name__}: {category}"


def preserve_or_fail(
    *,
    name: str,
    output: str | Path,
    kind: str,
    reason: str,
    min_items: int = 1,
    optional: bool = False,
    missing_configuration: bool = False,
    unique_by: str | None = None,
    allowed_http_hostnames: Iterable[str] = (),
) -> CollectorResult:
    path = Path(output)
    if not path.is_absolute():
        path = data_path(str(path))
    count = existing_snapshot_is_valid(
        path,
        kind=kind,
        min_items=min_items,
        require_unique=unique_by,
        allowed_http_hostnames=allowed_http_hostnames,
    )
    if count:
        state = "skipped" if optional and missing_configuration else "preserved"
        return CollectorResult(name, state, count, str(path), reason)
    return CollectorResult(name, "failed", 0, str(path), reason)


def run_guarded(
    collect: Callable[[], list[dict[str, object]]],
    *,
    name: str,
    output: str | Path,
    kind: str,
    min_items: int = 1,
    unique_by: str | None = None,
    optional: bool = False,
    allowed_http_hostnames: Iterable[str] = (),
) -> CollectorResult:
    try:
        items = collect()
        return publish_items(
            name=name,
            output=output,
            items=items,
            kind=kind,
            min_items=min_items,
            unique_by=unique_by,
            allowed_http_hostnames=allowed_http_hostnames,
        )
    except Exception as error:
        reason = _failure_reason(error)
        return preserve_or_fail(
            name=name,
            output=output,
            kind=kind,
            min_items=min_items,
            reason=reason,
            optional=optional,
            unique_by=unique_by,
            allowed_http_hostnames=allowed_http_hostnames,
        )
