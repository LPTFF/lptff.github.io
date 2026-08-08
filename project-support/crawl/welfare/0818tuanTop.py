from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from crawl.lib.welfare_sources import run_0818_source


if __name__ == "__main__":
    raise SystemExit(
        run_0818_source(
            name="0818tuanTop",
            output="welfare/0818tuanTop.json",
            top=True,
        )
    )
