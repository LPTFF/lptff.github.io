from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from crawl.lib.output import DATA_ROOT, REPOSITORY_ROOT
from crawl.lib.status import CollectorResult
from crawl.lib.validate import UNIQUE_KEYS, existing_snapshot_is_valid
from crawl.leetCode import validate_existing_release


@dataclass(frozen=True)
class CollectorSpec:
    name: str
    script: str
    output: str
    kind: str
    min_items: int = 1
    timeout: int = 120
    optional: bool = False
    group: str = "core"


COLLECTORS = (
    CollectorSpec("welfare", "welfare.py", "welfare.json", "welfare", 3, optional=True),
    CollectorSpec("infzm", "infzm.py", "infzm.json", "article", 3),
    CollectorSpec("juejin", "juejin.py", "juejin.json", "article", 3, group="archived"),
    CollectorSpec("weibo", "weibo.py", "weibo.json", "article", 5),
    CollectorSpec("githubTrending", "githubTrending.py", "githubTrending.json", "article", 3, group="archived"),
    CollectorSpec("52pojie", "52pojie.py", "52pojie.json", "article", 3),
    CollectorSpec("meituanTech", "meituanTech.py", "techForum/meituanTech.json", "article", 3, group="archived"),
    CollectorSpec("v2ex", "v2ex.py", "v2ex.json", "article", 3, optional=True, group="archived"),
    CollectorSpec("0818tuan", "welfare/0818tuan.py", "welfare/0818tuan.json", "welfare", 3, optional=True),
    CollectorSpec("0818tuanTop", "welfare/0818tuanTop.py", "welfare/0818tuanTop.json", "welfare", optional=True),
    CollectorSpec("zhuanyes", "welfare/zhuanyes.py", "welfare/zhuanyes.json", "welfare"),
    CollectorSpec("zhuanyesTop", "welfare/zhuanyesTop.py", "welfare/zhuanyesTop.json", "welfare", optional=True),
    CollectorSpec("daydayzhuan", "welfare/daydayzhuan.py", "welfare/daydayzhuan.json", "welfare", optional=True),
    CollectorSpec("daydayzhuanTop", "welfare/daydayzhuanTop.py", "welfare/daydayzhuanTop.json", "welfare", optional=True),
    CollectorSpec("zhujiceping", "welfare/zhujiceping.py", "welfare/zhujiceping.json", "welfare", optional=True),
    CollectorSpec("douban", "douban.py", "movie.json", "movie", 10, 180, group="full"),
    CollectorSpec("leetCode", "leetCode.py", "leetCode", "leetcode", 1, 960, group="archived"),
    CollectorSpec("zhipin", "zhipin.py", "zhipin.json", "job", 3, 180, group="archived"),
    CollectorSpec("kuaishou", "kuaishou.py", "kuaishouData.json", "video", 1, 120, True),
    CollectorSpec("tiktok", "tiktokData.py", "tiktok.json", "video", 1, 180, True, "full"),
)


def digest_path(path: Path) -> str | None:
    if not path.exists():
        return None
    digest = hashlib.sha256()
    paths = [path] if path.is_file() else sorted(item for item in path.rglob("*") if item.is_file())
    for item in paths:
        digest.update(item.relative_to(path.parent).as_posix().encode("utf-8"))
        digest.update(item.read_bytes())
    return digest.hexdigest()


def valid_count(spec: CollectorSpec) -> int:
    path = DATA_ROOT / spec.output
    if spec.kind == "leetcode":
        return validate_existing_release(path)
    return existing_snapshot_is_valid(
        path,
        kind=spec.kind,
        min_items=spec.min_items,
        require_unique=UNIQUE_KEYS.get(spec.kind),
    )


def snapshot_metrics(path: Path, kind: str) -> dict[str, object]:
    if not path.is_file() or kind == "leetcode":
        return {"keys": set(), "maxTimestamp": None}
    try:
        items = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return {"keys": set(), "maxTimestamp": None}
    if not isinstance(items, list):
        return {"keys": set(), "maxTimestamp": None}
    unique_key = UNIQUE_KEYS.get(kind)
    keys = {
        str(item[unique_key])
        for item in items
        if unique_key and isinstance(item, dict) and item.get(unique_key)
    }
    timestamps = [
        int(item["timestamp"])
        for item in items
        if isinstance(item, dict) and isinstance(item.get("timestamp"), (int, float))
    ]
    return {"keys": keys, "maxTimestamp": max(timestamps, default=None)}


def is_fresh_candidate(
    *,
    state: str,
    changed: bool,
    kind: str,
    new_item_count: int,
    timestamp_advanced: bool,
) -> bool:
    if state != "success" or not changed:
        return False
    if kind in {"article", "welfare", "video", "job"}:
        return new_item_count > 0 and timestamp_advanced
    return True


def parse_result(stdout: str, spec: CollectorSpec) -> CollectorResult | None:
    for line in reversed(stdout.splitlines()):
        try:
            payload = json.loads(line)
        except json.JSONDecodeError:
            continue
        if not isinstance(payload, dict) or payload.get("state") not in {
            "success",
            "preserved",
            "skipped",
            "failed",
        }:
            continue
        return CollectorResult(
            spec.name,
            payload["state"],
            int(payload.get("item_count") or payload.get("itemCount") or 0),
            payload.get("output"),
            payload.get("reason"),
        )
    return None


def run_collector(spec: CollectorSpec) -> dict[str, object]:
    path = DATA_ROOT / spec.output
    before_digest = digest_path(path)
    before_count = valid_count(spec)
    before_metrics = snapshot_metrics(path, spec.kind)
    started = time.monotonic()
    timed_out = False
    return_code: int | None = None
    stdout = ""
    stderr = ""
    try:
        completed = subprocess.run(
            [sys.executable, str(REPOSITORY_ROOT / "project-support" / "crawl" / spec.script)],
            cwd=REPOSITORY_ROOT,
            env={**os.environ, "PYTHONUTF8": "1"},
            text=True,
            encoding="utf-8",
            errors="replace",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=spec.timeout,
            check=False,
        )
        return_code = completed.returncode
        stdout = completed.stdout
        stderr = completed.stderr
    except subprocess.TimeoutExpired as error:
        timed_out = True
        stdout = error.stdout or ""
        stderr = error.stderr or ""
        if isinstance(stdout, bytes):
            stdout = stdout.decode("utf-8", "replace")
        if isinstance(stderr, bytes):
            stderr = stderr.decode("utf-8", "replace")

    after_count = valid_count(spec)
    after_metrics = snapshot_metrics(path, spec.kind)
    parsed = parse_result(stdout, spec)
    if timed_out:
        state = "preserved" if after_count else "failed"
        reason = "collector exceeded its configured timeout"
    elif return_code == 0 and after_count:
        state = parsed.state if parsed else "success"
        reason = parsed.reason if parsed else None
    elif spec.optional:
        state = "preserved" if after_count else "skipped"
        reason = parsed.reason if parsed else "optional collector has no usable new or existing snapshot"
    elif after_count:
        state = "preserved"
        reason = parsed.reason if parsed else "collector failed; existing valid snapshot remains"
    else:
        state = "failed"
        reason = parsed.reason if parsed else "collector failed and no valid snapshot remains"

    changed = before_digest != digest_path(path)
    new_item_count = len(after_metrics["keys"] - before_metrics["keys"])
    timestamp_advanced = (
        after_metrics["maxTimestamp"] is not None
        and (
            before_metrics["maxTimestamp"] is None
            or after_metrics["maxTimestamp"] > before_metrics["maxTimestamp"]
        )
    )
    fresh_candidate = is_fresh_candidate(
        state=state,
        changed=changed,
        kind=spec.kind,
        new_item_count=new_item_count,
        timestamp_advanced=timestamp_advanced,
    )

    return {
        "name": spec.name,
        "state": state,
        "required": not spec.optional,
        "durationSeconds": round(time.monotonic() - started, 2),
        "itemCount": after_count,
        "changed": changed,
        "freshCandidate": fresh_candidate,
        "newItemCount": new_item_count,
        "previousItemCount": before_count,
        "previousMaxTimestamp": before_metrics["maxTimestamp"],
        "maxTimestamp": after_metrics["maxTimestamp"],
        "timestampAdvanced": timestamp_advanced,
        "exitCode": return_code,
        "timedOut": timed_out,
        "stdoutBytes": len(stdout.encode("utf-8")),
        "stderrBytes": len(stderr.encode("utf-8")),
        **({"reason": reason} if reason else {}),
    }


def select_collectors(*, include_full: bool, only: list[str]) -> list[CollectorSpec]:
    return [
        spec
        for spec in COLLECTORS
        if (not only and (spec.group == "core" or (include_full and spec.group == "full")))
        or (only and spec.name in only)
    ]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--full", action="store_true", help="include long-running collectors")
    parser.add_argument("--only", action="append", default=[])
    parser.add_argument("--summary", type=Path)
    args = parser.parse_args()
    selected = select_collectors(include_full=args.full, only=args.only)
    unknown = set(args.only) - {spec.name for spec in COLLECTORS}
    if unknown:
        parser.error(f"unknown collector: {', '.join(sorted(unknown))}")

    results = []
    for spec in selected:
        result = run_collector(spec)
        results.append(result)
        print(json.dumps(result, ensure_ascii=False), flush=True)
    summary = {
        "version": 2,
        "collectors": results,
        "counts": {
            state: sum(item["state"] == state for item in results)
            for state in ("success", "preserved", "skipped", "failed")
        },
    }
    if args.summary:
        args.summary.parent.mkdir(parents=True, exist_ok=True)
        args.summary.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    required_failed = any(item["required"] and item["state"] == "failed" for item in results)
    return 1 if required_failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
