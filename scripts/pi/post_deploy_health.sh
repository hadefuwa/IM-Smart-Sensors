#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:8000}"
fail=0

check() {
  local name="$1"
  local url="$2"
  if curl -fsS --max-time 5 "${url}" >/dev/null; then
    echo "[PASS] ${name}"
  else
    echo "[FAIL] ${name}"
    fail=1
  fi
}

check "backend health" "${BASE_URL}/health"
check "io-link status" "${BASE_URL}/api/io-link/status"
check "diagnostics" "${BASE_URL}/api/io-link/diagnostics"
check "system health" "${BASE_URL}/api/system/health"

if [[ "${fail}" -ne 0 ]]; then
  echo "POST-DEPLOY CHECK FAILED"
  exit 1
fi

echo "POST-DEPLOY CHECK PASSED"
