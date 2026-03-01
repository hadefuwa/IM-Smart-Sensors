#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:-/home/hamed/io-link}"
BRANCH="${2:-main}"

cd "${APP_DIR}"

echo "[deploy] fetching latest ${BRANCH}"
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"

echo "[deploy] building frontend"
npm ci
npm run build

echo "[deploy] restarting backend service"
# Replace with your real unit if different.
sudo systemctl restart io-link-backend.service
sleep 2
sudo systemctl --no-pager --full status io-link-backend.service | head -n 25 || true

echo "[deploy] running smoke checks"
curl -fsS http://127.0.0.1:8000/health | sed -e 's/^/[health] /'
curl -fsS http://127.0.0.1:8000/api/io-link/diagnostics | sed -e 's/^/[diag] /' | head -c 300; echo

echo "[deploy] complete"
