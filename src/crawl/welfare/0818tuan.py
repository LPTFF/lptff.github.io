from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from src.crawl.lib.welfare_sources import parse_0818, run_source


if __name__ == "__main__":
    raise SystemExit(
        run_source(
            name="0818tuan",
            output="welfare/0818tuan.json",
            url="https://www.0818tuan.com/list-1-0.html",
            hostname="www.0818tuan.com",
            parser=parse_0818,
            top=False,
        )
    )
