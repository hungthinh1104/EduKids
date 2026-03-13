#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit scripts/scan-secrets.sh

echo "Git hooks enabled: core.hooksPath=.githooks"
echo "Pre-commit secret scan is now active."
