from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from src.crawl.lib.welfare_sources import parse_daydayzhuan, run_source


if __name__ == "__main__":
    raise SystemExit(
        run_source(
            name="daydayzhuan",
            output="welfare/daydayzhuan.json",
            url="https://www.daydayzhuan.com/yangmao",
            hostname="www.daydayzhuan.com",
            parser=parse_daydayzhuan,
            top=False,
        )
    )
