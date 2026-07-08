#!/usr/bin/env bash
set -euo pipefail

# Creates the standard "matrix" SSH login used on every IM4330 Pi unit.
# Idempotent — safe to re-run on a Pi that already has the account.
#
# Usage (run on the Pi itself, or piped over SSH):
#   bash scripts/pi/create_matrix_user.sh
#   bash scripts/pi/create_matrix_user.sh <username> <password>

MATRIX_USER="${1:-matrix}"
MATRIX_PASSWORD="${2:-matrix123}"

if id "${MATRIX_USER}" &>/dev/null; then
  echo "[matrix-user] '${MATRIX_USER}' already exists — skipping useradd"
else
  echo "[matrix-user] creating user '${MATRIX_USER}'"
  sudo useradd -m -s /bin/bash "${MATRIX_USER}"
fi

echo "[matrix-user] setting password"
echo "${MATRIX_USER}:${MATRIX_PASSWORD}" | sudo chpasswd

echo "[matrix-user] done: $(id "${MATRIX_USER}")"
