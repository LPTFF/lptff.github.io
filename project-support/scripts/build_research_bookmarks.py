#!/usr/bin/env python3
"""Build public research-bookmark snapshots from structured GitHub Issues.

The issue body is untrusted input. Only marker-delimited schemaVersion 1 payloads
created by the repository owner are accepted. An invalid owner payload stops the
build so an incomplete snapshot cannot replace the published list.
"""

from __future__ import annotations

import argparse
import ipaddress
import json
import os
import re
import sys
import tempfile
import time
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


START_MARKER = "<!-- research-bookmarks:start -->"
END_MARKER = "<!-- research-bookmarks:end -->"
STATUSES = {"inbox", "researching", "done"}
STATUS_LABELS = {"inbox": "待研究", "researching": "研究中", "done": "已完成"}
PAYLOAD_FIELDS = {"schemaVersion", "bookmarks"}
BOOKMARK_FIELDS = {"url", "title", "researchGoal", "tags", "status"}
MAX_ISSUES = 2_000
MAX_BOOKMARKS_PER_ISSUE = 10
MAX_URL_LENGTH = 4_096
MAX_TITLE_LENGTH = 160
MAX_GOAL_LENGTH = 600
MAX_TAGS = 12
MAX_TAG_LENGTH = 24
CONTROL_CHARACTERS = re.compile(r"[\x00-\x1f\x7f]")
SURROGATE_CHARACTERS = re.compile(r"[\ud800-\udfff]")
SENSITIVE_PARAMETER = re.compile(
    r"(?:^|[_-])(?:access[_-]?token|id[_-]?token|token|api[_-]?key|secret|"
    r"client[_-]?secret|signature|credential|authorization|password|passwd)(?:$|[_-])",
    re.IGNORECASE,
)
SENSITIVE_PARAMETER_EXACT = {
    "key",
    "sig",
    "auth",
    "jwt",
    "awsaccesskeyid",
    "x-amz-signature",
    "x-amz-credential",
    "x-goog-signature",
    "x-goog-credential",
    "key-pair-id",
}
TRACKING_PARAMETERS = {"fbclid", "gclid", "dclid", "msclkid", "mc_cid", "mc_eid"}


class BookmarkValidationError(ValueError):
    pass


def warning(message: str) -> None:
    print(f"warning: {message}", file=sys.stderr)


def parse_timestamp(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise BookmarkValidationError(f"{field} 缺失")
    raw = value.strip()
    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError as exc:
        raise BookmarkValidationError(f"{field} 不是 ISO 8601 时间") from exc
    if parsed.tzinfo is None:
        raise BookmarkValidationError(f"{field} 必须包含时区")
    return parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def sensitive_parameter_name(query_or_fragment: str) -> str | None:
    for name, _value in urllib.parse.parse_qsl(query_or_fragment, keep_blank_values=True):
        lowered = name.strip().lower()
        if lowered in SENSITIVE_PARAMETER_EXACT or SENSITIVE_PARAMETER.search(lowered):
            return name
    return None


def is_private_hostname(raw_hostname: str) -> bool:
    hostname = raw_hostname.lower().strip("[]").rstrip(".")
    if not hostname:
        return True
    if hostname == "localhost" or hostname.endswith((".localhost", ".local")):
        return True
    try:
        address = ipaddress.ip_address(hostname)
        return (
            not address.is_global
            or address.is_multicast
            or address.is_unspecified
            or address.is_loopback
            or address.is_link_local
            or address.is_private
            or address.is_reserved
        )
    except ValueError:
        # A public DNS name has at least one dot. Single-label names and IPv6
        # zone identifiers are local-network forms and cannot help a sandbox.
        numeric_labels = hostname.split(".")
        return (
            all(re.fullmatch(r"(?:0x[0-9a-f]+|[0-9]+)", label, re.IGNORECASE) for label in numeric_labels)
            or ":" in hostname
            or "." not in hostname
            or "%" in hostname
        )


def normalize_url(raw_value: Any) -> tuple[str, str]:
    if not isinstance(raw_value, str):
        raise BookmarkValidationError("url 必须是字符串")
    value = raw_value.strip()
    if not value:
        raise BookmarkValidationError("url 不能为空")
    if len(value) > MAX_URL_LENGTH:
        raise BookmarkValidationError("url 过长")
    if CONTROL_CHARACTERS.search(value):
        raise BookmarkValidationError("url 包含控制字符")
    if SURROGATE_CHARACTERS.search(value):
        raise BookmarkValidationError("url 包含无效 Unicode 字符")

    try:
        parsed = urllib.parse.urlsplit(value)
        port = parsed.port
    except ValueError as exc:
        raise BookmarkValidationError("url 格式无效") from exc

    scheme = parsed.scheme.lower()
    if scheme not in {"http", "https"} or not parsed.hostname:
        raise BookmarkValidationError("url 只允许完整的 http/https 地址")
    if parsed.username or parsed.password:
        raise BookmarkValidationError("url 不能包含账号或密码")

    try:
        host = parsed.hostname.rstrip(".").encode("idna").decode("ascii").lower()
    except UnicodeError as exc:
        raise BookmarkValidationError("url 主机名无效") from exc
    if is_private_hostname(host):
        raise BookmarkValidationError("url 必须指向公开网站")

    sensitive = sensitive_parameter_name(parsed.query)
    if sensitive is None and "=" in parsed.fragment:
        sensitive = sensitive_parameter_name(parsed.fragment)
    if sensitive:
        raise BookmarkValidationError(f"url 包含疑似凭据参数 {sensitive}")

    if ":" in host and not host.startswith("["):
        host = f"[{host}]"
    default_port = (scheme == "http" and port == 80) or (scheme == "https" and port == 443)
    netloc = host if port is None or default_port else f"{host}:{port}"

    retained_query: list[tuple[str, str]] = []
    for name, item_value in urllib.parse.parse_qsl(parsed.query, keep_blank_values=True):
        lowered = name.lower()
        if lowered.startswith("utm_") or lowered in TRACKING_PARAMETERS:
            continue
        retained_query.append((name, item_value))
    query = urllib.parse.urlencode(retained_query, doseq=True)
    path = parsed.path or "/"
    normalized = urllib.parse.urlunsplit((scheme, netloc, path, query, parsed.fragment))

    # Keep fragments in the identity: two bookmarked sections may represent
    # different research targets even when they share the same document URL.
    canonical_key = normalized[:-1] if normalized.endswith("/") and not query and not parsed.fragment else normalized
    return normalized, canonical_key


def normalize_tags(value: Any) -> list[str]:
    if not isinstance(value, list):
        raise BookmarkValidationError("tags 必须是数组")
    tags: list[str] = []
    seen: set[str] = set()
    for raw_tag in value:
        if not isinstance(raw_tag, str):
            raise BookmarkValidationError("tags 只能包含字符串")
        tag = " ".join(raw_tag.split())
        if SURROGATE_CHARACTERS.search(tag):
            raise BookmarkValidationError("标签包含无效 Unicode 字符")
        if not tag:
            continue
        if len(tag) > MAX_TAG_LENGTH:
            raise BookmarkValidationError("单个标签过长")
        key = tag.casefold()
        if key not in seen:
            seen.add(key)
            tags.append(tag)
    if len(tags) > MAX_TAGS:
        raise BookmarkValidationError("标签数量过多")
    return tags


def validate_bookmark(value: Any, issue_created: str, issue_updated: str) -> tuple[dict[str, Any], str]:
    if not isinstance(value, dict):
        raise BookmarkValidationError("收藏条目必须是对象")
    if set(value) != BOOKMARK_FIELDS:
        missing = sorted(BOOKMARK_FIELDS - set(value))
        unknown = sorted(set(value) - BOOKMARK_FIELDS)
        detail = "、".join([*(f"缺少 {name}" for name in missing), *(f"未知 {name}" for name in unknown)])
        raise BookmarkValidationError(f"收藏条目字段不匹配：{detail}")
    url, canonical_key = normalize_url(value.get("url"))
    bookmark_id = str(uuid.uuid5(uuid.NAMESPACE_URL, canonical_key))

    title_value = value.get("title", "")
    goal_value = value.get("researchGoal", "")
    if not isinstance(title_value, str) or len(title_value.strip()) > MAX_TITLE_LENGTH:
        raise BookmarkValidationError("title 类型无效或过长")
    if not isinstance(goal_value, str) or len(goal_value.strip()) > MAX_GOAL_LENGTH:
        raise BookmarkValidationError("researchGoal 类型无效或过长")
    if SURROGATE_CHARACTERS.search(title_value) or SURROGATE_CHARACTERS.search(goal_value):
        raise BookmarkValidationError("title 或 researchGoal 包含无效 Unicode 字符")
    status = value.get("status")
    if status not in STATUSES:
        raise BookmarkValidationError("status 无效")

    hostname = urllib.parse.urlsplit(url).hostname or url
    bookmark = {
        "id": bookmark_id,
        "url": url,
        "title": title_value.strip() or hostname.removeprefix("www."),
        "researchGoal": goal_value.strip(),
        "tags": normalize_tags(value.get("tags", [])),
        "status": status,
        "createdAt": issue_created,
        "updatedAt": issue_updated,
    }
    return bookmark, canonical_key


def payload_from_issue(issue: dict[str, Any]) -> dict[str, Any] | None:
    body = issue.get("body")
    if not isinstance(body, str):
        return None
    # GitHub text uses LF/CRLF. Splitting only on LF keeps Unicode separators
    # inside JSON strings instead of accidentally turning them into markers.
    lines = body.split("\n")
    start_lines = [index for index, line in enumerate(lines) if line.strip() == START_MARKER]
    end_lines = [index for index, line in enumerate(lines) if line.strip() == END_MARKER]
    if not start_lines:
        return None
    if len(start_lines) != 1 or len(end_lines) != 1:
        raise BookmarkValidationError("同步标记必须各出现一次并独占一行")
    start, end = start_lines[0], end_lines[0]
    if end <= start:
        raise BookmarkValidationError("缺少结束标记")
    raw_payload = "\n".join(lines[start + 1 : end]).strip()
    try:
        payload = json.loads(raw_payload)
    except json.JSONDecodeError as exc:
        raise BookmarkValidationError(f"标记区不是有效 JSON：{exc.msg}") from exc
    if not isinstance(payload, dict) or set(payload) != PAYLOAD_FIELDS:
        raise BookmarkValidationError("顶层字段必须且只能包含 schemaVersion 与 bookmarks")
    if type(payload.get("schemaVersion")) is not int or payload["schemaVersion"] != 1:
        raise BookmarkValidationError("仅支持 schemaVersion 1")
    bookmarks = payload.get("bookmarks")
    if not isinstance(bookmarks, list) or not bookmarks:
        raise BookmarkValidationError("bookmarks 必须是非空数组")
    if len(bookmarks) > MAX_BOOKMARKS_PER_ISSUE:
        raise BookmarkValidationError(f"单个 Issue 最多 {MAX_BOOKMARKS_PER_ISSUE} 条")
    return payload


def load_fixture(path: Path) -> list[dict[str, Any]]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(value, dict):
        value = value.get("items")
    if not isinstance(value, list):
        raise ValueError("fixture 必须是 Issue 数组或带 items 数组的对象")
    return [item for item in value if isinstance(item, dict)]


def fetch_issues(repo: str, token: str | None) -> list[dict[str, Any]]:
    issues: list[dict[str, Any]] = []
    page = 1
    while True:
        query = urllib.parse.urlencode(
            {"state": "all", "per_page": 100, "page": page, "sort": "created", "direction": "asc"}
        )
        request = urllib.request.Request(
            f"https://api.github.com/repos/{repo}/issues?{query}",
            headers={
                "Accept": "application/vnd.github+json",
                "User-Agent": "lptff-research-bookmarks-builder",
                "X-GitHub-Api-Version": "2022-11-28",
                **({"Authorization": f"Bearer {token}"} if token else {}),
            },
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            page_items = json.load(response)
        if not isinstance(page_items, list):
            raise RuntimeError("GitHub Issues API 返回了非数组结果")
        issues.extend(item for item in page_items if isinstance(item, dict))
        if len(issues) > MAX_ISSUES:
            raise RuntimeError(f"Issue 数超过安全上限 {MAX_ISSUES}，停止发布以免生成截断清单")
        if len(page_items) < 100:
            break
        page += 1
    return issues


def timestamp_rank(value: str) -> float:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()


def build_document(issues: list[dict[str, Any]], allowed_author: str, generated_at: str) -> dict[str, Any]:
    chosen: dict[str, tuple[tuple[int, float], dict[str, Any]]] = {}
    earliest_created: dict[str, str] = {}
    accepted_issues = 0
    invalid_issues: list[str] = []

    for issue in issues:
        if "pull_request" in issue:
            continue
        user = issue.get("user")
        login = user.get("login") if isinstance(user, dict) else None
        if not isinstance(login, str) or login.casefold() != allowed_author.casefold():
            continue
        try:
            payload = payload_from_issue(issue)
            if payload is None:
                continue
            issue_updated = parse_timestamp(issue.get("updated_at"), "issue.updated_at")
            issue_created = parse_timestamp(issue.get("created_at") or issue_updated, "issue.created_at")
            issue_number = int(issue.get("number", 0))
            validated_entries: list[tuple[dict[str, Any], str, tuple[int, float]]] = []
            for raw_bookmark in payload["bookmarks"]:
                bookmark, canonical_key = validate_bookmark(raw_bookmark, issue_created, issue_updated)
                # The page creates a new Issue for each sync. Issue numbers are
                # monotonic, so editing an old Issue cannot roll back a newer one.
                rank = (issue_number, timestamp_rank(issue_updated))
                validated_entries.append((bookmark, canonical_key, rank))
            for bookmark, canonical_key, rank in validated_entries:
                previous_created = earliest_created.get(canonical_key)
                if previous_created is None or timestamp_rank(bookmark["createdAt"]) < timestamp_rank(previous_created):
                    earliest_created[canonical_key] = bookmark["createdAt"]
                previous = chosen.get(canonical_key)
                if previous is None or rank >= previous[0]:
                    chosen[canonical_key] = (rank, bookmark)
            accepted_issues += 1
        except (BookmarkValidationError, TypeError, ValueError) as exc:
            invalid_issues.append(f"#{issue.get('number', '?')}：{exc}")
            warning(f"Issue #{issue.get('number', '?')} 无效：{exc}")

    if invalid_issues:
        raise RuntimeError(f"{len(invalid_issues)} 个研究资料 Issue 格式无效，停止发布以保留线上清单")

    ranked_bookmarks = sorted(
        (
            (rank, {**bookmark, "createdAt": earliest_created[canonical_key]})
            for canonical_key, (rank, bookmark) in chosen.items()
        ),
        key=lambda entry: entry[0],
        reverse=True,
    )
    bookmarks: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    for _rank, bookmark in ranked_bookmarks:
        if bookmark["id"] in seen_ids:
            warning(f"跳过重复 id：{bookmark['id']}")
            continue
        seen_ids.add(bookmark["id"])
        bookmarks.append(bookmark)
    print(f"research bookmarks: {len(bookmarks)} items from {accepted_issues} issues")
    return {"schemaVersion": 1, "updatedAt": generated_at, "bookmarks": bookmarks}


def markdown_escape(value: str) -> str:
    compact = " ".join(value.split())
    return re.sub(r"([\\`*_{}\[\]<>])", r"\\\1", compact)


def render_markdown(document: dict[str, Any]) -> str:
    bookmarks = document["bookmarks"]
    lines = [
        "# 在线研究资料收藏",
        "",
        f"- 更新时间：{document['updatedAt']}",
        f"- 当前条目：{len(bookmarks)}",
        "- JSON 数据：https://lptff.github.io/data/research-bookmarks.json",
        "",
        "该清单来自站主提交的公开研究资料，链接内容与可访问性请以原站为准。",
        "",
    ]
    if not bookmarks:
        lines.extend(["暂无已发布资料。", ""])
    for status in ("inbox", "researching", "done"):
        items = [item for item in bookmarks if item["status"] == status]
        if not items:
            continue
        lines.extend([f"## {STATUS_LABELS[status]}（{len(items)}）", ""])
        for item in items:
            lines.append(f"- [{markdown_escape(item['title'])}](<{item['url']}>)")
            if item["tags"]:
                lines.append(f"  - 标签：{'、'.join(markdown_escape(tag) for tag in item['tags'])}")
            if item["researchGoal"]:
                lines.append(f"  - 研究目标：{markdown_escape(item['researchGoal'])}")
            lines.append(f"  - 更新时间：{item['updatedAt']}")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def atomic_write(path: Path, content: str, *, encoding: str = "utf-8") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding=encoding, newline="\n", dir=path.parent, delete=False) as handle:
        handle.write(content)
        temporary = Path(handle.name)
    try:
        for attempt in range(5):
            try:
                temporary.replace(path)
                return
            except PermissionError:
                if attempt == 4:
                    raise
                time.sleep(0.1 * (attempt + 1))
    finally:
        temporary.unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", default=os.environ.get("GITHUB_REPOSITORY", "LPTFF/lptff.github.io"))
    parser.add_argument("--allowed-author")
    parser.add_argument("--issues-file", type=Path)
    parser.add_argument("--output-json", type=Path, default=Path("project-support/public/data/research-bookmarks.json"))
    parser.add_argument("--output-markdown", type=Path, default=Path("project-support/public/data/research-bookmarks.md"))
    parser.add_argument("--generated-at")
    args = parser.parse_args()

    repo_parts = args.repo.split("/", 1)
    if len(repo_parts) != 2 or not all(repo_parts):
        parser.error("--repo 必须为 OWNER/REPO")
    allowed_author = args.allowed_author or repo_parts[0]
    generated_at = args.generated_at or datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    generated_at = parse_timestamp(generated_at, "generatedAt")

    issues = load_fixture(args.issues_file) if args.issues_file else fetch_issues(
        args.repo, os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    )

    document = build_document(issues, allowed_author, generated_at)
    # Direct browser navigation needs a UTF-8 BOM when the static host omits charset.
    atomic_write(args.output_markdown, render_markdown(document), encoding="utf-8-sig")
    atomic_write(args.output_json, json.dumps(document, ensure_ascii=False, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
