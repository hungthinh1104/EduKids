#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

if ! command -v rg >/dev/null 2>&1; then
  echo "[secret-scan] ripgrep (rg) is required but not installed."
  echo "Install it and run again."
  exit 2
fi

echo "[secret-scan] scanning workspace for potential hardcoded secrets..."

RESULTS="$(rg -n --hidden \
  --glob '!.git' \
  --glob '!**/node_modules/**' \
  --glob '!**/.next/**' \
  --glob '!**/dist/**' \
  --glob '!**/build/**' \
  --glob '!**/coverage/**' \
  --glob '!**/*.lock' \
  --glob '!**/*.png' \
  --glob '!**/*.jpg' \
  --glob '!**/*.jpeg' \
  --glob '!**/*.gif' \
  --glob '!**/*.svg' \
  --glob '!**/*.md' \
  --glob '!**/*.spec.ts' \
  --glob '!**/*.test.ts' \
  --glob '!**/.env.example' \
  --glob '!**/.env.sample' \
  -e '(?i)(api[_-]?key|secret[_-]?key|access[_-]?token|refresh[_-]?token|private[_-]?key|client[_-]?secret|password)\s*[:=]\s*["\x27][^"\x27]{8,}["\x27]' \
  -e 'AKIA[0-9A-Z]{16}' \
  -e 'AIza[0-9A-Za-z\-_]{35}' \
  -e 'sk_(live|test)_[0-9a-zA-Z]{16,}' \
  -e 'xox[baprs]-[0-9A-Za-z-]{10,}' \
  -e 'ghp_[0-9A-Za-z]{36}' \
  -e '-----BEGIN (RSA|EC|OPENSSH|DSA|PRIVATE) KEY-----' \
  . || true)"

if [[ -n "$RESULTS" ]]; then
  echo "[secret-scan] potential secrets detected:"
  echo "$RESULTS"
  echo
  echo "[secret-scan] commit blocked. Move secrets to env/Key Vault and retry."
  exit 1
fi

echo "[secret-scan] no obvious hardcoded secrets found."
