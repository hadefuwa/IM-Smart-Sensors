# IM-Smart-Sensors

Web dashboard for monitoring **IFM IO-Link Master** devices (AL1100/AL1300/AL1350). Real-time port status, supervision trends, industrial HMI homepage, CL50 LED decoding, and full diagnostics.

**Repository:** [github.com/hadefuwa/IM-Smart-Sensors](https://github.com/hadefuwa/IM-Smart-Sensors) · **Live app:** [hadefuwa.github.io/IM-Smart-Sensors](https://hadefuwa.github.io/IM-Smart-Sensors/)

---

## Features

- **Industrial HMI Dashboard** – Mimic-style homepage with real-time sensor status (Temperature, Capacitive, Photoelectric, Status LED), condition monitoring charts, and live datastream terminal log
- **Real-time updates** via WebSocket — no browser polling
- **IO-Link page** – Compact port table; blank columns auto-hidden; per-port supervision, software, and process-data detail cards with dielectric value bar for capacitive sensors
- **Supervision trends** – current, voltage, temperature time-series charts
- **Connection Diagnostics** – Timeline chart, poll latency graph, recent events table, live backend log viewer, uptime counter, and time-since-last-drop stat (IO-Link Master only)
- **Edge Device page** – Raspberry Pi runtime stats: CPU/memory rolling charts, CPU temperature, load average, service health, and Chromium kiosk process count
- **Adaptive polling** – Connected ports polled every 1 s; inactive/disconnected ports polled every 5 s to reduce AL1350 load without slowing live sensor response
- **Port labels & device hints** – Display names and device-type overrides configurable per port in `config.json`; disconnected labelled ports shown as greyed-out with a Disconnected badge
- **Wi-Fi configuration panel** – Connect the Pi to a new network from the browser Settings page (via `nmcli`)
- **IO-Link port auto-configure** – Backend detects port mode and device type on first connect; supports mode set via the AL1350 IoT Core API
- **Device type decoding** – Photoelectric, temperature, capacitive (Carlo Gavazzi 4-byte format with 16-bit analogue dielectric value), proximity, and CL50 LED PDin/PDout decoded in every WebSocket push
- **File logging** – Rotating log at `logs/app.log` (10 MB × 5 files); in-memory ring buffer served at `/api/logs`
- **Circuit breaker** – 5-failure open, 15 s recovery; transitions logged with context
- **Change Master IP from UI** – No config file edits needed
- **Light & dark theme** – Theme-aware IO-Link logo, persisted in `localStorage`

---

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Backend  | Python 3, FastAPI, WebSockets, httpx |
| Frontend | Vite, Tailwind CSS, DaisyUI, Chart.js |
| API      | REST + WebSocket `/ws` |

---

## Quick Start

### 1. Configure IO-Link Master

Edit `backend/config.json` and set your master's IP (or change it later from the dashboard Settings):

```json
{
  "io_link": {
    "master_ip": "192.168.7.4",
    "port": 80,
    "poll_interval_sec": 1,
    "disconnected_poll_interval_sec": 5,
    "timeout_sec": 3
  },
  "port_labels": {
    "1": {"label": "Temperature Sensor",                 "device_type_hint": "temperature"},
    "2": {"label": "Capacitive Sensor (RS PRO 2377240)", "device_type_hint": "capacitive"},
    "3": {"label": "Photoelectric Sensor (Contrinex LTR-M18PA-PMx-603)", "device_type_hint": "photo_electric"},
    "4": {"label": "Light Stack",                        "device_type_hint": "status_led"}
  }
}
```

`poll_interval_sec` controls how often connected ports are queried. `disconnected_poll_interval_sec` controls how often inactive ports are re-checked (saves AL1350 requests when sensors are unplugged). `port_labels` sets the display name and device-type hint per port; the label overrides the raw product name from the device tree.

### 2. Install and run the backend

```bash
cd backend
pip install -r requirements.txt
python run_io_link_fastapi.py
```

Server runs at **http://0.0.0.0:8000** (docs at `/docs`).

### 3. Install and run the frontend

```bash
npm install
npm run dev
```

Open the URL shown (e.g. **http://localhost:5173**). To target a different backend host, set `window.IO_LINK_API_BASE = 'http://<host>:8000'` in the browser console and refresh.

---

## HMI Dashboard

The default homepage provides:

- **Current State Overview** – Clickable mimic components for IO-Link Master, Temperature, Capacitive (with live dielectric value bar), Photoelectric, and Status LED (CL50). Click any component to open its configuration modal.
- **Condition Monitoring** – Temperature trend chart, signal quality bar, and cycle counter with alerts.
- **Datastream Terminal** – Live PDin/PDout bytes and decoded values with port filter and CSV export.
- **Health & Heartbeat** – Diagnostic status table and recent events log.

---

## Running on Raspberry Pi

The project runs as a kiosk on a Raspberry Pi with a WaveShare 1024×600 capacitive touchscreen. nginx serves the frontend from `/var/www/im-sensors/`; the FastAPI backend runs on `127.0.0.1:8000` via a systemd service.

See [docs/PI_SSH.md](docs/PI_SSH.md) for SSH/SCP connection details, deploy commands, and network layout.

---

## GitHub Pages (UI only)

The repo builds and deploys the UI to [GitHub Pages](https://hadefuwa.github.io/IM-Smart-Sensors/). That site is **static** — it cannot run the backend. To see live data, run the backend on your PC or Pi and point the Pages UI at it (`window.IO_LINK_API_BASE = 'http://<backend-host>:8000'`).

**White screen on Pages?** Go to **Settings → Pages → Build and deployment** and set Source to **GitHub Actions** (not "Deploy from a branch"). The workflow runs `npm run build` and deploys `dist/`.

---

## Project Layout

```
├── backend/                     # FastAPI IO-Link API & WebSocket
│   ├── io_link_fastapi.py        # Main app — all routes + WebSocket handler
│   ├── al1350_client.py          # AL1350 HTTP client — circuit breaker, retry, pooling
│   ├── decoder.py                # PDin/PDout decoders + device-type detection
│   ├── run_io_link_fastapi.py
│   ├── config.json
│   └── requirements.txt
├── docs/                        # Documentation
│   ├── PI_SSH.md                 # Pi SSH/SCP reference, deploy commands, network layout
│   ├── PI_OPERATIONS.md          # Git → Pi workflow, rollback, health checks
│   ├── port-config.md            # IO-Link port mode troubleshooting
│   ├── SIDEBAR_SCROLL_FIX.md     # Sidebar flex constraint diagnosis
│   └── README.md                 # Docs index
├── public/                      # Static assets (logos, favicons, images)
├── scripts/pi/                  # Bash deploy helpers for Raspberry Pi
├── src/                         # Vite app source
│   ├── main.js                   # App entry, routing, sidebar, logo theme switching
│   ├── home-page.js              # HMI dashboard
│   ├── io-link-page.js           # IO-Link port table + supervision charts
│   ├── admin-page.js             # Connection Diagnostics — latency, circuit breaker, log viewer
│   ├── edge-device-page.js       # Edge Device — Pi CPU/memory charts, service status
│   ├── settings-page.js          # Theme selector + IO-Link config + Wi-Fi panel
│   ├── style.css
│   └── components/
│       ├── mimic-components.js   # Industrial UI components (gauges, capacitive indicator, LEDs, counters)
│       └── terminal-log.js       # Datastream terminal with CSV export
├── index.html
├── package.json
├── vite.config.js
└── CLAUDE.md                    # Project guidance for Claude Code
```

---

## API Summary

| Endpoint | Description |
|----------|-------------|
| `GET /api/io-link/config` | Get IO-Link Master IP/port config |
| `PUT /api/io-link/config` | Update Master IP/port (saved to config.json) |
| `GET /api/io-link/status` | Full status (ports, supervision, software) |
| `GET /api/io-link/port/<port_num>` | Detailed port data with decoded PDin/PDout |
| `GET /api/io-link/supervision-history` | Time-series for supervision charts |
| `GET /api/io-link/diagnostics` | Connection events, latency history, circuit state |
| `GET /api/logs?n=200` | Last N backend log entries (in-memory ring buffer) |
| `GET /api/system/health` | Pi runtime stats (CPU, memory, temp, load) |
| `WS /ws` | Real-time JSON push — ports, supervision, connection state |

---

## Backend Reliability

`al1350_client.py` implements several patterns critical to understand before modifying polling logic:

- **Circuit breaker** — Opens after 5 consecutive failures; recovers after 15 s. Do not bypass.
- **Connection pooling** — Shared `AsyncClient` capped at 3 concurrent connections (AL1350 hardware limit).
- **Retry with jitter** — Exponential backoff with random jitter. Removing it causes thundering herd on reconnect.
- **Protocol fallback** — `getdatamulti` → individual GETs per endpoint. `degraded_mode=True` means getdatamulti is failing.
- **Adaptive per-port polling** — Connected ports polled every `poll_interval_sec` (1 s); inactive/error ports polled every `disconnected_poll_interval_sec` (5 s). Skipped ports return cached data. Reduces AL1350 requests by ~3× when sensors are unplugged.

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/PI_SSH.md](docs/PI_SSH.md) | Pi SSH/SCP reference, deploy commands, network layout |
| [docs/PI_OPERATIONS.md](docs/PI_OPERATIONS.md) | Git → Pi workflow, rollback, health checks |
| [docs/port-config.md](docs/port-config.md) | IO-Link port mode troubleshooting and AL1350 API examples |
| [docs/SIDEBAR_SCROLL_FIX.md](docs/SIDEBAR_SCROLL_FIX.md) | Sidebar flex constraint diagnosis |
| [CLAUDE.md](CLAUDE.md) | Project guidance for Claude Code |

---

## Troubleshooting

- **Connection shows red** — Check: master powered and on network, correct IP in `config.json` (or Settings), reachable via `ping 192.168.7.4` from the Pi.
- **Port shows orange light on AL1350** — Port may be in Disabled or DI mode. See [docs/port-config.md](docs/port-config.md) for how to set IO-Link mode via the API.
- **Port 8000 in use** — Change the port in `run_io_link_fastapi.py` and set `window.IO_LINK_API_BASE` to the new URL.
- **Frontend can't reach API** — Set `window.IO_LINK_API_BASE = 'http://localhost:8000'` in the browser console.

---

## License

Use and adapt as needed for your IO-Link / smart sensor projects.
