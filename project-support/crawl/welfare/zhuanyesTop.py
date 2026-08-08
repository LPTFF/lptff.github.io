from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from crawl.lib.welfare_sources import parse_zhuanyes, run_source


if __name__ == "__main__":
    raise SystemExit(
        run_source(
            name="zhuanyesTop",
            output="welfare/zhuanyesTop.json",
            url="https://www.zhuanyes.com/xianbao-day.html",
            hostname="www.zhuanyes.com",
            parser=parse_zhuanyes,
            top=True,
        )
    )
