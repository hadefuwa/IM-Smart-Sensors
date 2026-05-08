# Raspberry Pi Operations

Deterministic workflow for Local → GitHub → Pi.

## Source of Truth

- Primary branch: `master`
- Release format: `v<major>.<minor>.<patch>` (GitHub releases) or `rpi-vYYYYMMDD-HHMM` (lightweight deploy tags)
- Pi project path: `/home/hamed/IM-Smart-Sensors`
- Backend service: `im-sensors-backend.service`
- nginx root: `/var/www/im-sensors/`

## Local → GitHub → Tag

```bash
git add <files>
git commit -m "feat: ..."
git push origin master
git tag v1.x.x
git push origin v1.x.x
```

Or use a timestamped deploy tag:

```bash
git tag rpi-v20260508-1200
git push origin rpi-v20260508-1200
```

## Deploy Backend Files to Pi (no frontend rebuild)

```powershell
& "C:\Program Files\PuTTY\pscp.exe" -pw ummah123 -hostkey "SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc" backend\al1350_client.py backend\io_link_fastapi.py backend\decoder.py hamed@iolink.local:/home/hamed/IM-Smart-Sensors/backend/
& "C:\Program Files\PuTTY\plink.exe" -pw ummah123 -hostkey "SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc" -batch hamed@iolink.local "sudo systemctl restart im-sensors-backend.service && systemctl is-active im-sensors-backend.service"
```

## Deploy Frontend Build to Pi

```powershell
# Build locally first
npm run build

# Copy hashed assets and index.html
& "C:\Program Files\PuTTY\pscp.exe" -pw ummah123 -hostkey "SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc" dist\assets\index-*.js  hamed@iolink.local:/var/www/im-sensors/assets/
& "C:\Program Files\PuTTY\pscp.exe" -pw ummah123 -hostkey "SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc" dist\assets\index-*.css hamed@iolink.local:/var/www/im-sensors/assets/
& "C:\Program Files\PuTTY\pscp.exe" -pw ummah123 -hostkey "SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc" dist\index.html          hamed@iolink.local:/var/www/im-sensors/

# Remove stale hashed files from previous build (check first):
# ls /var/www/im-sensors/assets/index-*
# rm /var/www/im-sensors/assets/index-OldHash.js
```

## Reload Kiosk Browser

```powershell
& "C:\Program Files\PuTTY\plink.exe" -pw ummah123 -hostkey "SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc" -batch hamed@iolink.local "nohup sudo -u pi DISPLAY=:0 XAUTHORITY=/home/pi/.Xauthority bash /home/pi/kiosk.sh </dev/null >/tmp/kiosk.log 2>&1 &"
```

## Post-Deploy Health Check

```powershell
& "C:\Program Files\PuTTY\plink.exe" -pw ummah123 -hostkey "SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc" -batch hamed@iolink.local "systemctl is-active im-sensors-backend.service && curl -s http://127.0.0.1:8000/api/system/health | python3 -m json.tool"
```

## Rollback

```powershell
# SSH in, then:
# git fetch --tags
# git checkout v1.x.x
# Then redeploy backend + rebuild frontend
```

## View Backend Logs on Pi

```bash
# SSH in first: ssh hamed@iolink.local

# Live log tail
journalctl -u im-sensors-backend.service -f

# Rotating file log
tail -f /home/hamed/IM-Smart-Sensors/logs/app.log

# Or check the in-app Diagnostics page (Admin → Diagnostics)
```

## Network Layout

```
Windows PC (192.168.0.95)
    └── Home LAN (192.168.0.x)

Raspberry Pi (iolink.local)
    ├── eth0: 192.168.7.2  ← IO-Link Master network (static)
    └── wlan0: home LAN (DHCP, configurable via app Settings → Wi-Fi)

IFM AL1350 IO-Link Master: 192.168.7.4
```
