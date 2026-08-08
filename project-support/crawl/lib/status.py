from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Literal

CollectorState = Literal["success", "preserved", "skipped", "failed"]


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
