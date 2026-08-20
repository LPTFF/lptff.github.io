#!/usr/bin/env bash

set -euo pipefail

python --version
python -m compileall -q project-support/crawl
python project-support/crawl/run_collectors.py "$@"
