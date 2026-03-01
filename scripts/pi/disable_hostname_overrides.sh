#!/usr/bin/env bash
set -euo pipefail

# Disable services that may overwrite hostname.
# Usage:
#   bash scripts/pi/disable_hostname_overrides.sh mycloud.service
#   bash scripts/pi/disable_hostname_overrides.sh cloud-init.service

if [[ "$#" -eq 0 ]]; then
  echo "No explicit service names passed."
  echo "Candidates to review:"
  systemctl list-unit-files --type=service | awk '{print $1}' | grep -Ei 'mycloud|nextcloud|cloud-init|hostname' || true
  exit 0
fi

for svc in "$@"; do
  echo "[disable] ${svc}"
  sudo systemctl disable --now "${svc}" || true
done

echo "[done] verify hostname remains stable after reboot."
