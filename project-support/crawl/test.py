from __future__ import annotations

import json
import os

import requests

URL = "https://fund.eastmoney.com/data/rankhandler.aspx"


def main() -> int:
    headers = {
        "Referer": "https://fund.eastmoney.com/data/fundranking.html",
        "User-Agent": "lptff.github.io collector diagnostic/1.0",
    }
    cookie = os.environ.get("EASTMONEY_COOKIE", "").strip()
    if cookie:
        headers["Cookie"] = cookie
    try:
        response = requests.get(
            URL,
            params={
                "op": "ph",
                "dt": "kf",
                "ft": "all",
                "sc": "rzdf",
                "st": "desc",
                "pi": "1",
                "pn": "50",
                "dx": "1",
            },
            headers=headers,
            timeout=(5, 20),
        )
        response.raise_for_status()
        print(json.dumps({"state": "success", "bytes": len(response.content)}))
        return 0
    except Exception as error:
        print(json.dumps({"state": "failed", "reason": type(error).__name__}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
