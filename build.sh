#!/usr/bin/env bash

set -euo pipefail

python --version
python -m unittest discover -s src/crawl/tests -v
python -m compileall -q src/crawl
python src/crawl/run_collectors.py "$@"
