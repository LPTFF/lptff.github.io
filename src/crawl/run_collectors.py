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
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.crawl.lib.output import DATA_ROOT, REPOSITORY_ROOT
from src.crawl.lib.status import CollectorResult
from src.crawl.lib.validate import existing_snapshot_is_valid
from src.crawl.leetCode import validate_existing_release


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
    CollectorSpec("juejin", "juejin.py", "juejin.json", "article", 3),
    CollectorSpec("weibo", "weibo.py", "weibo.json", "article", 5),
    CollectorSpec("v2ex", "v2ex.py", "v2ex.json", "article", 3),
    CollectorSpec("githubTrending", "githubTrending.py", "githubTrending.json", "article", 3),
    CollectorSpec("52pojie", "52pojie.py", "52pojie.json", "article", 3),
    CollectorSpec("meituanTech", "meituanTech.py", "techForum/meituanTech.json", "article", 3),
    CollectorSpec("0818tuan", "welfare/0818tuan.py", "welfare/0818tuan.json", "welfare", optional=True),
    CollectorSpec("0818tuanTop", "welfare/0818tuanTop.py", "welfare/0818tuanTop.json", "welfare", optional=True),
    CollectorSpec("zhuanyes", "welfare/zhuanyes.py", "welfare/zhuanyes.json", "welfare"),
    CollectorSpec("zhuanyesTop", "welfare/zhuanyesTop.py", "welfare/zhuanyesTop.json", "welfare", optional=True),
    CollectorSpec("daydayzhuan", "welfare/daydayzhuan.py", "welfare/daydayzhuan.json", "welfare", optional=True),
    CollectorSpec("daydayzhuanTop", "welfare/daydayzhuanTop.py", "welfare/daydayzhuanTop.json", "welfare", optional=True),
    CollectorSpec("douban", "douban.py", "movie.json", "movie", 10, 180, group="full"),
    CollectorSpec("leetCode", "leetCode.py", "leetCode", "leetcode", 1, 960, group="full"),
    CollectorSpec("zhipin", "zhipin.py", "zhipin.json", "job", 3, 180, group="full"),
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
    return existing_snapshot_is_valid(path, kind=spec.kind, min_items=spec.min_items)


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
    started = time.monotonic()
    timed_out = False
    return_code: int | None = None
    stdout = ""
    stderr = ""
    try:
        completed = subprocess.run(
            [sys.executable, str(REPOSITORY_ROOT / "src" / "crawl" / spec.script)],
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

    return {
        "name": spec.name,
        "state": state,
        "required": not spec.optional,
        "durationSeconds": round(time.monotonic() - started, 2),
        "itemCount": after_count,
        "changed": before_digest != digest_path(path),
        "previousItemCount": before_count,
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
        if (not only and (include_full or spec.group == "core"))
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
        "version": 1,
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
