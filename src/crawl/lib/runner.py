from __future__ import annotations

from collections.abc import Callable
from pathlib import Path

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
        )

    write_json_atomically(path, items, validate=validate)
    return CollectorResult(name, "success", len(items), str(path))


def preserve_or_fail(
    *,
    name: str,
    output: str | Path,
    kind: str,
    reason: str,
    min_items: int = 1,
    optional: bool = False,
    missing_configuration: bool = False,
) -> CollectorResult:
    path = Path(output)
    if not path.is_absolute():
        path = data_path(str(path))
    count = existing_snapshot_is_valid(path, kind=kind, min_items=min_items)
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
        )
    except Exception as error:
        reason = f"{type(error).__name__}: collector did not publish a candidate"
        return preserve_or_fail(
            name=name,
            output=output,
            kind=kind,
            min_items=min_items,
            reason=reason,
            optional=optional,
        )
