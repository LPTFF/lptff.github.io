#!/usr/bin/env bash

set -euo pipefail

python --version
python -B project-support/crawl/run_collectors.py "$@"
