#!/usr/bin/env bash
set -euo pipefail

EXPECTED_HOSTNAME="${1:-iolink}"
BACKEND_URL="${2:-http://127.0.0.1:8000/health}"
MASTER_IP="${3:-192.168.7.4}"

fail=0

echo "[boot-check] expected hostname: ${EXPECTED_HOSTNAME}"
current_hostname="$(hostnamectl --static || hostname)"
if [[ "${current_hostname}" != "${EXPECTED_HOSTNAME}" ]]; then
  echo "[FAIL] hostname is '${current_hostname}'"
  fail=1
else
  echo "[OK] hostname is '${current_hostname}'"
fi

echo "[boot-check] backend health: ${BACKEND_URL}"
if curl -fsS --max-time 4 "${BACKEND_URL}" >/dev/null; then
  echo "[OK] backend responds"
else
  echo "[FAIL] backend did not respond"
  fail=1
fi

echo "[boot-check] route to AL1350: ${MASTER_IP}"
if ip route get "${MASTER_IP}" >/dev/null 2>&1; then
  echo "[OK] route to master exists"
else
  echo "[FAIL] route to master missing"
  fail=1
fi

if [[ "${fail}" -ne 0 ]]; then
  echo "[boot-check] FAILED"
  exit 1
fi

echo "[boot-check] PASSED"
