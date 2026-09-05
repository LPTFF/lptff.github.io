from __future__ import annotations

from dataclasses import asdict, dataclass
import json
from pathlib import Path
from typing import Literal

CollectorState = Literal["success", "preserved", "skipped", "failed"]


def report_result(result: dict[str, object], summary_path: Path | None = None) -> None:
    """本轮状态供日志与合并告警共用；不包含原始数据或凭据。"""
    serialized = json.dumps(result, ensure_ascii=False)
    if summary_path is not None:
        summary_path.parent.mkdir(parents=True, exist_ok=True)
        summary_path.write_text(serialized + "\n", encoding="utf-8")
    print(serialized, flush=True)


@dataclass(frozen=True)
class CollectorResult:
    name: str
    state: CollectorState
    item_count: int = 0
    output: str | None = None
    reason: str | None = None

    @property
    def is_usable(self) -> bool:
        return self.state in {"success", "preserved", "skipped"}

    def to_dict(self) -> dict[str, object]:
        return {key: value for key, value in asdict(self).items() if value is not None}
