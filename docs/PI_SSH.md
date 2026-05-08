# Raspberry Pi SSH Connection

## Device Info

| Field | Value |
|-------|-------|
| Hostname | `iolink` |
| mDNS address | `iolink.local` |
| Static IP (eth0) | `192.168.7.2` — IO-Link Master network only, not visible on home LAN |
| SSH user | `hamed` |
| SSH password | `ummah123` |
| Project path | `/home/hamed/IM-Smart-Sensors` |
| Backend service | `im-sensors-backend.service` |

## Connecting

The Pi does **not** appear in a 192.168.0.x network scan because its ethernet adapter has a static IP on the 192.168.7.x subnet (for the IO-Link Master). Connect via mDNS hostname instead:

```bash
ssh hamed@iolink.local
```

From Windows terminal, or using PuTTY:

```
Host: iolink.local
User: hamed
Password: ummah123
```

PuTTY host key fingerprint: `SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc`

## Common Commands on the Pi

```bash
# Restart backend
sudo systemctl restart im-sensors-backend.service

# Check backend status / logs
systemctl status im-sensors-backend.service
journalctl -u im-sensors-backend.service -f

# Rebuild frontend
cd /home/hamed/IM-Smart-Sensors
npm run build

# Check network interfaces
ip addr
```

## Transferring Files to the Pi

The Pi has no internet access — copy files directly from this PC via SCP. Use PuTTY's `pscp` from a Windows terminal.

### Single file

```powershell
& "C:\Program Files\PuTTY\pscp.exe" -pw ummah123 -hostkey "SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc" src\my-file.js hamed@iolink.local:/home/hamed/IM-Smart-Sensors/src/
```

### Multiple files (space-separated)

```powershell
& "C:\Program Files\PuTTY\pscp.exe" -pw ummah123 -hostkey "SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc" backend\al1350_client.py backend\io_link_fastapi.py hamed@iolink.local:/home/hamed/IM-Smart-Sensors/backend/
```

### Entire folder (recursive)

```powershell
& "C:\Program Files\PuTTY\pscp.exe" -pw ummah123 -hostkey "SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc" -r src\ hamed@iolink.local:/home/hamed/IM-Smart-Sensors/src/
```

### Frontend build (Vite uses content-hashed filenames — copy assets AND index.html)

Nginx serves from `/var/www/im-sensors/`, not the project `dist/`. Always deploy there:

```powershell
# After npm run build locally:
& "C:\Program Files\PuTTY\pscp.exe" -pw ummah123 -hostkey "SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc" dist\assets\index-*.js  hamed@iolink.local:/var/www/im-sensors/assets/
& "C:\Program Files\PuTTY\pscp.exe" -pw ummah123 -hostkey "SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc" dist\assets\index-*.css hamed@iolink.local:/var/www/im-sensors/assets/
& "C:\Program Files\PuTTY\pscp.exe" -pw ummah123 -hostkey "SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc" dist\index.html          hamed@iolink.local:/var/www/im-sensors/
```

> Vite generates new hashed filenames on every build. After deploying, delete stale old hashed files so the browser doesn't cache the wrong version:
> ```bash
> # SSH in and clean up old assets:
> ls /var/www/im-sensors/assets/index-*   # spot old hashes
> rm /var/www/im-sensors/assets/index-OldHash.js
> rm /var/www/im-sensors/assets/index-OldHash.css
> ```

### Backend-only deploy (Python files, no frontend rebuild needed)

```powershell
& "C:\Program Files\PuTTY\pscp.exe" -pw ummah123 -hostkey "SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc" backend\al1350_client.py backend\io_link_fastapi.py hamed@iolink.local:/home/hamed/IM-Smart-Sensors/backend/
# Then restart the service:
& "C:\Program Files\PuTTY\plink.exe" -pw ummah123 -hostkey "SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc" -batch hamed@iolink.local "sudo systemctl restart im-sensors-backend.service && systemctl is-active im-sensors-backend.service"
```

### Reload the kiosk browser after a frontend deploy

```powershell
# Restart Chromium kiosk (runs as user pi):
& "C:\Program Files\PuTTY\plink.exe" -pw ummah123 -hostkey "SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc" -batch hamed@iolink.local "nohup sudo -u pi DISPLAY=:0 XAUTHORITY=/home/pi/.Xauthority bash /home/pi/kiosk.sh </dev/null >/tmp/kiosk.log 2>&1 &"
```

> `pkill chromium` will kill the browser first if it's already running. plink may exit with code 1 when pkill finds no process — that's harmless.

## Network Layout

```
Windows PC (192.168.0.95)
    └── Home LAN (192.168.0.x)

Raspberry Pi
    ├── eth0: 192.168.7.2  ← IO-Link Master network (static)
    └── wlan0: (configurable via app Settings → Wi-Fi)

IFM AL1350 IO-Link Master: 192.168.7.4
```

## Notes

- If the build fails with `EACCES` on `dist/assets/`, the dist directory was built as root. Fix with:
  ```bash
  sudo chown -R hamed:hamed /home/hamed/IM-Smart-Sensors/dist/
  ```
- `hamed` is in the `netdev` group (required for the in-app Wi-Fi configuration panel to work via `nmcli`).
