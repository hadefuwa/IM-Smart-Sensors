# Raspberry Pi Operations

Deterministic workflow for Local -> GitHub -> Pi.

## Source of Truth

- Primary branch: `main`
- Release format: lightweight tags like `rpi-vYYYYMMDD-HHMM`

## Local to GitHub

```bash
git checkout main
git pull --ff-only origin main
git add .
git commit -m "feat: ..."
git push origin main
git tag rpi-v20260301-2200
git push origin rpi-v20260301-2200
```

## Pi Pull + Build + Restart

```bash
cd /home/hamed/io-link
bash scripts/pi/deploy_pull_build_restart.sh /home/hamed/io-link main
```

## Post-Deploy Smoke Test

```bash
cd /home/hamed/io-link
bash scripts/pi/post_deploy_health.sh http://127.0.0.1:8000
```

## Hostname Persistence

```bash
cd /home/hamed/io-link
bash scripts/pi/fix_hostname.sh iolink
bash scripts/pi/disable_hostname_overrides.sh mycloud.service
bash scripts/pi/boot_verify.sh iolink http://127.0.0.1:8000/health 192.168.7.4
```

## Rollback

```bash
cd /home/hamed/io-link
git fetch --tags
git checkout rpi-v20260301-2200
npm ci && npm run build
sudo systemctl restart io-link-backend.service
```
