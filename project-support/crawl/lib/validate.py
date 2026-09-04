from __future__ import annotations

import json
import re
from collections.abc import Iterable, Mapping, Sequence
from urllib.parse import urlparse

SENSITIVE_KEY_PATTERN = re.compile(r"(?:access[_-]?token|authorization|cookie|password|secret|session)", re.I)
UNIQUE_KEYS: dict[str, str] = {
    "article": "url",
    "welfare": "link",
    "video": "videoUrl",
    "movie": "url",
    "job": "job_detail",
    "leetcode": "problemsUrl",
}


class ValidationError(ValueError):
    pass


SCHEMAS: dict[str, tuple[str, ...]] = {
    "article": ("title", "url", "time", "timestamp", "website"),
    "welfare": ("title", "link", "time", "timestamp", "website"),
    "video": ("videoUrl", "timestamp", "time", "website"),
    "movie": ("url", "title", "is_new", "rate", "index", "cover", "id"),
    "job": ("bossTitle", "brandName", "job_detail", "salaryDesc"),
    "leetcode": (
        "problemsName",
        "hardRate",
        "passRate",
        "problemsUrl",
        "solutionsUrl",
        "problemsDesc",
        "isPlus",
    ),
}


def _has_valid_url(
    value: object,
    allow_data_url: bool = False,
    allowed_http_hostnames: Iterable[str] = (),
) -> bool:
    if not isinstance(value, str) or not value.strip():
        return False
    if allow_data_url and value.startswith("data:image/"):
        return True
    parsed = urlparse(value)
    if parsed.username or parsed.password or not parsed.netloc:
        return False
    if parsed.scheme == "https":
        return True
    allowed_http_hosts = {hostname.lower() for hostname in allowed_http_hostnames}
    return parsed.scheme == "http" and (parsed.hostname or "").lower() in allowed_http_hosts


def validate_items(
    items: object,
    *,
    kind: str,
    min_items: int = 1,
    max_items: int = 100_000,
    require_unique: str | None = None,
    allowed_http_hostnames: Iterable[str] = (),
) -> list[dict[str, object]]:
    if not isinstance(items, list):
        raise ValidationError("dataset must be a JSON array")
    if len(items) < min_items:
        raise ValidationError(f"dataset contains fewer than {min_items} items")
    if len(items) > max_items:
        raise ValidationError(f"dataset contains more than {max_items} items")
    required = SCHEMAS.get(kind)
    if not required:
        raise ValidationError(f"unknown dataset kind: {kind}")

    seen: set[object] = set()
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            raise ValidationError(f"item {index} must be an object")
        missing = [key for key in required if item.get(key) in (None, "")]
        if missing:
            raise ValidationError(f"item {index} misses required fields: {', '.join(missing)}")
        for key in item:
            if SENSITIVE_KEY_PATTERN.search(key):
                raise ValidationError(f"item {index} contains a sensitive field")
        timestamp = item.get("timestamp")
        if timestamp is not None and (not isinstance(timestamp, (int, float)) or timestamp <= 0):
            raise ValidationError(f"item {index} has an invalid timestamp")
        link_key = "link" if kind == "welfare" else "url"
        if kind in {"article", "welfare"} and not _has_valid_url(
            item.get(link_key), allowed_http_hostnames=allowed_http_hostnames
        ):
            raise ValidationError(f"item {index} has an invalid URL")
        if kind == "video" and not _has_valid_url(item.get("videoUrl")):
            raise ValidationError(f"item {index} has an invalid video URL")
        if kind == "movie" and not _has_valid_url(item.get("url")):
            raise ValidationError(f"item {index} has an invalid movie URL")
        if kind == "job" and not _has_valid_url(item.get("job_detail")):
            raise ValidationError(f"item {index} has an invalid job URL")
        if kind == "leetcode":
            if not _has_valid_url(item.get("problemsUrl")) or not _has_valid_url(
                item.get("solutionsUrl")
            ):
                raise ValidationError(f"item {index} has an invalid LeetCode URL")
        if require_unique:
            value = item.get(require_unique)
            if value in seen:
                raise ValidationError(f"item {index} duplicates {require_unique}")
            seen.add(value)
    return items


def validate_json_bytes(data: bytes, *, max_bytes: int = 5_000_000) -> object:
    if len(data) > max_bytes:
        raise ValidationError("serialized dataset exceeds configured size limit")
    return json.loads(data.decode("utf-8"))


def existing_snapshot_is_valid(
    path: object,
    *,
    kind: str,
    min_items: int = 1,
    require_unique: str | None = None,
    allowed_http_hostnames: Iterable[str] = (),
) -> int:
    from pathlib import Path

    file_path = Path(path)
    if not file_path.is_file():
        return 0
    try:
        items = json.loads(file_path.read_text(encoding="utf-8"))
        return len(
            validate_items(
                items,
                kind=kind,
                min_items=min_items,
                require_unique=require_unique or UNIQUE_KEYS.get(kind),
                allowed_http_hostnames=allowed_http_hostnames,
            )
        )
    except (OSError, json.JSONDecodeError, ValidationError, UnicodeDecodeError):
        return 0
