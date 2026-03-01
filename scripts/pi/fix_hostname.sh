#!/usr/bin/env bash
set -euo pipefail

TARGET_HOSTNAME="${1:-iolink}"

echo "[hostname] setting hostname to: ${TARGET_HOSTNAME}"
sudo hostnamectl set-hostname "${TARGET_HOSTNAME}"
echo "${TARGET_HOSTNAME}" | sudo tee /etc/hostname >/dev/null

if grep -qE '^127\.0\.1\.1\s+' /etc/hosts; then
  sudo sed -i -E "s/^127\.0\.1\.1\s+.*/127.0.1.1\t${TARGET_HOSTNAME}/" /etc/hosts
else
  echo -e "127.0.1.1\t${TARGET_HOSTNAME}" | sudo tee -a /etc/hosts >/dev/null
fi

echo "[hostname] active: $(hostnamectl --static)"
echo "[hostname] /etc/hostname: $(cat /etc/hostname)"

echo "[hostname] auditing services that may overwrite hostname"
systemctl list-unit-files --type=service | awk '{print $1}' | grep -Ei 'mycloud|nextcloud|hostname|cloud-init' || true
