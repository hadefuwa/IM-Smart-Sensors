# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

Industrial HMI dashboard for monitoring IFM IO-Link Master devices (AL1100/AL1300/AL1350). Displays real-time sensor data via MQTT push, supports full IODD-based parameter read/write for all connected sensors via IO-Link ISDU, and includes interactive training worksheets. Runs locally, on Raspberry Pi (kiosk on WaveShare 1024×600 touchscreen), or as a static GitHub Pages deployment (UI only).

## Commands

### Frontend
```bash
npm install
npm run dev       # Dev server at http://localhost:5173
npm run build     # Production build to dist/
npm run preview   # Preview dist/ build
```

### Backend
```bash
cd backend
pip install -r requirements.txt
python run_io_link_fastapi.py   # API at http://0.0.0.0:8000, docs at /docs
```

### Raspberry Pi Deployment

**IMPORTANT: nginx serves from `/var/www/im-sensors/`, not `dist/`.** Always deploy built files there.

```bash
# Build locally then SCP to Pi (Vite uses content-hashed filenames — copy both assets AND index.html)
pscp -pw <password> dist\assets\index-*.js   hamed@iolink.local:/var/www/im-sensors/assets/
pscp -pw <password> dist\assets\index-*.css  hamed@iolink.local:/var/www/im-sensors/assets/
pscp -pw <password> dist\index.html           hamed@iolink.local:/var/www/im-sensors/

bash scripts/pi/post_deploy_health.sh   # Post-deploy health checks
```

Pi credentials and network details are in `docs/PI_SSH.md`.

### Backend-only deploy (Python files, no frontend rebuild needed)

```powershell
# Copy changed backend files
& "C:\Program Files\PuTTY\pscp.exe" -pw ummah123 -hostkey "SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc" backend\al1350_client.py backend\io_link_fastapi.py backend\device_parameters.py hamed@iolink.local:/home/hamed/IM-Smart-Sensors/backend/
# Restart service and confirm active
& "C:\Program Files\PuTTY\plink.exe" -pw ummah123 -hostkey "SHA256:Gyckco2TVF3FhcbSzy9vVDS6Sg0pS54p+gxLo+tuFNc" -batch hamed@iolink.local "sudo systemctl restart im-sensors-backend.service && systemctl is-active im-sensors-backend.service"
```

## Architecture

**Split frontend/backend SPA:**

- `src/` — Vite + vanilla JS (ES6 modules), Tailwind CSS + DaisyUI, Chart.js. No framework or router library. Pages are functions returning HTML strings; navigation swaps `<main>` innerHTML. WebSocket auto-reconnects on drop. Theme persists via `localStorage` key `matrix-theme`.
- `backend/` — FastAPI + httpx async client. WebSocket at `/ws` pushes real-time JSON. REST endpoints under `/api/io-link/`.
- `public/` — Static assets (logos, PDFs, images).
- `scripts/pi/` — Bash deployment helpers for Raspberry Pi (systemd service management).
- `.github/workflows/` — GitHub Actions builds frontend with `VITE_BASE_PATH=/IM-Smart-Sensors/` for Pages deployment.

**Key source files:**

| File | Role |
|------|------|
| `src/main.js` | App entry, page routing, Chart.js init, IO-Link logo theme switching |
| `src/home-page.js` | HMI dashboard — gauges, charts, IODD parameter cards per sensor |
| `src/io-link-page.js` | IO-Link port table, supervision charts, per-port parameter panels |
| `src/worksheets-page.js` | Interactive training worksheets with live ISDU read/write controls |
| `src/cp0001-page.js` | Course Package 1 — sensor fundamentals (photoelectric, capacitive, temperature, LED) |
| `src/cp0002-page.js` | Course Package 2 — IO-Link deep-dive worksheets |
| `src/settings-page.js` | Theme selector and IO-Link connection config UI |
| `src/admin-page.js` | Connection Diagnostics — IO-Link latency graph, circuit breaker, log viewer |
| `src/edge-device-page.js` | Edge Device page — Pi CPU/memory charts, service status, Chromium health |
| `src/components/mimic-components.js` | Reusable industrial UI components (temp gauge, capacitive indicator, LED, counters) |
| `src/components/terminal-log.js` | Datastream terminal with CSV export |
| `backend/io_link_fastapi.py` | Main FastAPI app — all routes + WebSocket handler + ISDU endpoints |
| `backend/al1350_client.py` | AL1350 HTTP client with circuit breaker, retry/jitter, adaptive polling, ISDU read/write |
| `backend/device_parameters.py` | IODD-derived parameter registry + ISDU encode/decode helpers |
| `backend/decoder.py` | CL50 LED decoder + sensor PDin/PDout parsers (temperature, photoelectric, capacitive, proximity) |
| `backend/config.json` | Runtime config — master IP, port, poll intervals, port labels, timeout |

## Backend Reliability Patterns

`al1350_client.py` implements several patterns that are critical to understand before modifying the polling/request logic:

- **Circuit breaker:** Opens after 5 consecutive failures; recovers after 15 s timeout. Do not bypass.
- **Connection pooling:** Shared `AsyncClient` capped at 3 concurrent connections (AL1350 hardware limit). Do not increase.
- **Retry with jitter:** Exponential backoff with random jitter on transient failures. The jitter is intentional — removing it causes thundering herd on reconnect.
- **Protocol fallback chain:** `getdatamulti` → individual GETs per endpoint. `degraded_mode=True` means getdatamulti is failing and per-request GETs are being used instead.
- **Adaptive per-port polling:** `poll_ports()` tracks `_port_next_poll_ts` per port. Connected ports (`io-link`/`digital_in`/`digital_out`) are polled every `poll_interval_sec` (default 1 s). Inactive/error ports are polled every `disconnected_poll_interval_sec` (default 5 s). Skipped ports return cached data. The outer loop and supervision polling still run every 1 s.
- **MQTT push (primary data path):** `ensure_mqtt_subscription()` registers the AL1350's push subscription on every backend startup (subscriptions are lost on AL1350 power cycle). The AL1350 publishes pdin + supervision to Mosquitto every 500 ms. The backend subscribes via `aiomqtt` and broadcasts to WebSocket clients immediately. HTTP polling runs in parallel as fallback and for ISDU counter reads.
- **Device tree cache:** `/gettree` response is cached for 5 minutes to reduce load on the AL1350.

## AL1350 IoT Core API

The operating manual is at `docs/Operating Manual.txt`. Critical protocol details:

- **GET:** `http://<ip>/datapoint/getdata` — response: `{"code":200,"data":{"value": val}}`
- **POST (service calls):** POST to `http://<ip>/` with body `{"code":"request","cid":-1,"adr":"servicename","data":{...}}`
- **getdatamulti `datatosend` paths** must NOT include the `/getdata` suffix (data-point paths only, e.g. `/iolinkmaster/port[1]/mode` not `/iolinkmaster/port[1]/mode/getdata`).
- **getdatamulti response** keys have no leading slash; value is at `entry["data"]` not `entry["value"]`: `{"data":{"iolinkmaster/port[1]/mode":{"code":200,"data":3}}}`
- **Supervision data** lives at `processdatamaster/temperature` (°C), `processdatamaster/voltage` (V), `processdatamaster/current` (A), `processdatamaster/supervisionstatus`. Polled each cycle via `AL1350ClientManager.get_supervision()`.
- **poll_snapshot** returns a 3-tuple `(ports, device_info, supervision)` — update all call sites if the signature changes.

## IODD / ISDU Parameter System

`backend/device_parameters.py` is the single source of truth for all device parameter metadata. Understand it before touching parameter read/write logic.

### Device Registry

Keyed by `(vendor_id_int, device_id_int)`. Three devices registered:

| Key | Device | Label |
|-----|--------|-------|
| `(310, 733)` | IFM TV7105 | Temperature sensor — SP1/SP2 setpoints (index 583/593, int16, scale 0.1), teach commands, calibration offset |
| `(1586, 1052673)` or `(896, 1069056)` | Carlo Gavazzi / RS PRO capacitive M18 | SSC1 SP1 (index 60/sub1, int16), QoT (75), QoR (76), teach start/stop/cancel commands |
| `(342, 131842)` | Contrinex LTR-M18PA-PMS-603 photoelectric | SSC1 SP1 (index 0x3C/sub1, uint32), output logic (0x3D/sub1), sensor mode (0x40/sub2), teach/cancel/reset commands |

The Carlo Gavazzi IDs `(1586, 1052673)` are an RS PRO OEM branding — both entries point to the same `_CAPACITIVE_PARAMS`.

### ISDU Protocol

AL1350 service call for acyclic read:
```
POST http://<ip>/
{"code":"request","cid":-1,"adr":"/iolinkmaster/port[N]/iolinkdevice/iolreadacyclic","data":{"index":60,"subindex":1}}
→ {"code":200,"data":{"value":"hex-string"}}
```

For write, use `iolwriteacyclic` with `{"index":60,"subindex":1,"value":"03E8"}`.

Commands are written as uint8 to index 2, subindex 0: e.g. teach SP1 for TV7105 = write `0xAC` (172) to index 2.

### ISDU API Endpoints

- `GET /api/io-link/port/{n}/parameters` — reads ALL parameters for a port using the registry; resolves device from system_state vendor_id/device_id
- `POST /api/io-link/port/{n}/parameter/read` — body: `{index, subindex, dtype, scale}` → `{success, raw_hex, value}`
- `POST /api/io-link/port/{n}/parameter/write` — body: `{index, subindex, value, dtype, scale}` → `{success}`
- `POST /api/io-link/port/{n}/command` — body: `{command}` (name key from registry `commands` dict) → `{success}`

### Frontend ISDU Helpers (home-page.js and worksheets-page.js)

Both pages define the same async pattern:
- `_hmiIsduRead(portNum, index, subindex, dtype, scale)` → value or null
- `_hmiIsduWrite(portNum, index, subindex, value, dtype, scale, statusElId)` → bool
- `_hmiIsduCommand(portNum, cmdName, statusElId)` → bool

Parameter panels auto-load on first WebSocket message from each sensor. Port number is tracked in `_sectionPortNum['cap-port-num']` / `['temp-port-num']` / `['detection-port-num']` (populated by `_setPortBadge` in the WS handler).

## Frontend Conventions

- Chart series buffers are capped at 50 data points — do not increase without profiling memory on the Pi.
- `window.IO_LINK_API_BASE` overrides the API base URL at runtime (set in browser console for testing against a remote backend).
- The `VITE_BASE_PATH` env var must be set to `/IM-Smart-Sensors/` for GitHub Pages builds and `/` for local/Pi builds. The GitHub Actions workflow handles this automatically.
- Port mode values from the AL1350 come as integers (0–3) and are normalized to strings (`inactive`, `digital_in`, `digital_out`, `io-link`) in the backend before reaching the frontend.

### Kiosk / Touchscreen Layout

At 1024×600 (Pi WaveShare screen), `isTouchKioskLayout()` returns true (≤1280 wide, ≤900 tall). The sidebar is in drawer mode — it slides in over the content rather than sitting beside it.

**Sidebar flex constraint rule:** The sidebar `<aside>` must stay `display: flex` at all viewport sizes. Do **not** add `md:block` or any Tailwind responsive `block` override to it — this silently breaks the inner scroll container by removing the flex column constraint, causing `overflow-y` to never activate. See `docs/SIDEBAR_SCROLL_FIX.md` for the full diagnosis.

Touch events on X11 (WaveShare on Debian/Openbox) are emulated as mouse events — real `touchstart`/`touchmove` events do not fire. Drag-to-scroll in the sidebar is implemented via `mousedown`/`mousemove`/`mouseup` listeners in `src/main.js`.

## Configuration

`backend/config.json` fields that matter:

```json
{
  "mqtt": {
    "broker_host": "192.168.7.2",
    "broker_port": 1883,
    "publish_interval_ms": 500,
    "enabled": true
  },
  "io_link": {
    "master_ip": "192.168.7.4",
    "port": 80,
    "poll_interval_sec": 1,
    "timeout_sec": 3,
    "use_https": false
  },
  "port_labels": {
    "1": {"label": "Photoelectric",  "device_type_hint": "photo_electric"},
    "2": {"label": "Capacitive",     "device_type_hint": "capacitive"},
    "3": {"label": "IFM TV7105",     "device_type_hint": "temperature"},
    "4": {"label": "Light Stack",    "device_type_hint": "status_led"}
  }
}
```

- `mqtt.broker_host` — IP of the Mosquitto broker (the Pi's eth0 address on the IO-Link subnet).
- `mqtt.publish_interval_ms` — how often the AL1350 pushes data (500 ms minimum, firmware-enforced).
- `poll_interval_sec` — how often the HTTP fallback polls connected ports (minimum 0.5 s). Also controls ISDU counter read rate.
- `port_labels` — display label and device-type hint per port number. The label overrides the raw device product name in the UI; the hint fills in when auto-detection returns `unknown`.

The Settings page UI writes `io_link` fields via `PUT /api/io-link/config`. `port_labels` and `mqtt` must be edited in the file directly.

## Pi Infrastructure

| Component | Detail |
|-----------|--------|
| Web server | nginx on port 80, root `/var/www/im-sensors/` |
| API server | uvicorn/FastAPI on `127.0.0.1:8000`, proxied via nginx `/api/` and `/ws` |
| Kiosk | Chromium launched by `/home/pi/kiosk.sh` via Openbox autostart, runs as user `pi`. Script kills any existing Chromium before launching to prevent instance accumulation. |
| Remote debug | `--remote-debugging-port=9222` always enabled in kiosk.sh |
| Display | X11 + Openbox on `:0`, 1024×600 WaveShare capacitive touchscreen |

To restart the kiosk after a deploy (run as `hamed` over SSH):
```bash
echo <password> | sudo -S -u pi DISPLAY=:0 XAUTHORITY=/home/pi/.Xauthority bash /home/pi/kiosk.sh &
```
