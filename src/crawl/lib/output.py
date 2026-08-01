from __future__ import annotations

import json
import os
import tempfile
from collections.abc import Callable
from pathlib import Path
from typing import TypeVar

T = TypeVar("T")

CRAWL_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = CRAWL_ROOT.parents[1]
DATA_ROOT = REPOSITORY_ROOT / "src" / "public" / "data"


def data_path(relative_path: str) -> Path:
    return DATA_ROOT / relative_path


def write_json_atomically(
    path: str | Path,
    value: T,
    *,
    validate: Callable[[T], object],
) -> None:
    target = Path(path)
    validate(value)
    serialized = (json.dumps(value, ensure_ascii=False, indent=4) + "\n").encode("utf-8")
    target.parent.mkdir(parents=True, exist_ok=True)
    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="wb", prefix=f".{target.name}.", suffix=".tmp", dir=target.parent, delete=False
        ) as handle:
            temp_path = Path(handle.name)
            handle.write(serialized)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_path, target)
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink()
