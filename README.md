# IM-Smart-Sensors

Web dashboard for monitoring **IFM IO-Link Master** devices (e.g. AL1100/AL1300). Real-time status, port data, supervision trends, industrial HMI-style homepage, and optional CL50 LED decoding.

**Repository:** [github.com/hadefuwa/IM-Smart-Sensors](https://github.com/hadefuwa/IM-Smart-Sensors) · **Live app:** [hadefuwa.github.io/IM-Smart-Sensors](https://hadefuwa.github.io/IM-Smart-Sensors/)

---

## Features

- **Industrial HMI Dashboard** – Mimic-style homepage with real-time sensor status (Temperature, Photoelectric, Proximity, Status LED), condition monitoring charts, and live datastream terminal log
- **Real-time updates** via WebSocket (no polling from the browser)
- **Port status** – mode, vendor/device ID, process data (PDin/PDout)
- **Supervision trends** – current, voltage, temperature over time
- **Active port details** – per-port process data and optional CL50 LED decode
- **Connection indicator** – green when connected, red when disconnected
- **Light & dark theme** – theme-aware styling for all components and chart axes
- **Change Master IP from the UI** – no need to edit config files
- **Worksheets & Further Study** – training content and learning resources

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

Edit `backend/config.json` and set your master’s IP (or change it later from the dashboard Settings):

```json
{
  "io_link": {
    "master_ip": "192.168.7.4",
    "port": 80,
    "poll_interval_sec": 1,
    "timeout_sec": 10
  }
}
```

### 2. Install and run the backend

```bash
cd backend
pip install -r requirements.txt
python run_io_link_fastapi.py
```

Server runs at **http://localhost:8000** (API docs at http://localhost:8000/docs).

### 3. Install and run the frontend

```bash
npm install
npm run dev
```

Then open the URL shown (e.g. **http://localhost:5173**). The **HMI Dashboard** loads as the default page. The frontend connects to the backend at `http://localhost:8000` by default; to use a different host set `window.IO_LINK_API_BASE` before loading (e.g. in browser console or in your build).

---

## HMI Dashboard

The default homepage provides:

- **Current State Overview** – Clickable mimic components for IO-Link Master, Temperature (PT100), Photoelectric, Proximity, and Status LED (CL50). Click any component to open its configuration modal.
- **Condition Monitoring** – Temperature trend chart, signal quality bar, and cycle counter with alerts (e.g. “Clean lens”, “Service due”).
- **Datastream Terminal** – Command-line style log showing live PDin/PDout bytes and decoded values, with filtering by port and CSV export.
- **Health & Heartbeat** – Diagnostic status table and recent events log.

See the [docs/](docs/) folder for detailed guides.

---

## Running on Raspberry Pi

You can run the backend on a Raspberry Pi on your network so the dashboard is always available and can reach the IO-Link Master.

1. **On the Pi** (Raspberry Pi OS or similar):
   ```bash
   cd backend
   pip install -r requirements.txt
   python run_io_link_fastapi.py
   ```
   Or run in the background (e.g. with `nohup`, `screen`, or a systemd service).

2. **Open the dashboard** from any device on the same network:
   - Run the frontend locally and set the API base to `http://<pi-ip>:8000` (e.g. in browser console: `window.IO_LINK_API_BASE = 'http://192.168.7.10:8000'` then refresh).
   - Or use [GitHub Pages](https://hadefuwa.github.io/IM-Smart-Sensors/) and set the API base to your Pi’s backend URL.

3. **Optional:** Put the Pi’s IP in `config.json` as `master_ip` if the IO-Link Master is at a different IP, or change it from the dashboard Settings.

---

## GitHub Pages (UI only)

The repo includes a built version of the UI for [GitHub Pages](https://hadefuwa.github.io/IM-Smart-Sensors/). That site is **static** – it cannot run the backend. To see live data, run the backend (on your PC or a Pi) and point the Pages UI at your backend (e.g. set `window.IO_LINK_API_BASE = 'http://<backend-host>:8000'` then refresh).

---

## Project Layout

```
├── backend/           # FastAPI IO-Link API & WebSocket
│   ├── io_link_fastapi.py
│   ├── run_io_link_fastapi.py
│   ├── decoder.py
│   ├── config.json
│   └── requirements.txt
├── docs/              # Documentation
│   ├── README.md
│   ├── QUICK_START.md
│   ├── TESTING.md
│   ├── IMPLEMENTATION_SUMMARY.md
│   ├── THEME_UPDATES.md
│   └── Plan.md
├── frontend/          # Simple HTML dashboard (optional)
│   ├── io-link.html
│   └── assets/
├── public/            # Static assets (logos, favicons, images)
│   ├── matrix.svg
│   ├── matrix2.png
│   └── assets/img/
├── src/               # Vite app source
│   ├── main.js
│   ├── home-page.js
│   ├── io-link-page.js
│   ├── worksheets-page.js
│   ├── learn-page.js
│   ├── settings-page.js
│   ├── style.css
│   └── components/
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## API Summary

| Endpoint | Description |
|----------|-------------|
| `GET /api/io-link/config` | Get IO-Link Master IP/port config |
| `PUT /api/io-link/config` | Update Master IP/port (saved to config.json) |
| `GET /api/io-link/status` | Full status (ports, supervision, software) |
| `GET /api/io-link/port/<port_num>` | Detailed port data (e.g. PDin/PDout decoded) |
| `GET /api/io-link/supervision-history` | Time-series for charts |
| `WS /ws` | Real-time JSON pushes (same shape as status) |

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/README.md](docs/README.md) | Index of all documentation |
| [docs/QUICK_START.md](docs/QUICK_START.md) | Get started in 3 steps |
| [docs/TESTING.md](docs/TESTING.md) | Test scenarios for the HMI dashboard |
| [docs/IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md) | Feature list and implementation details |
| [docs/THEME_UPDATES.md](docs/THEME_UPDATES.md) | Light/dark theme behaviour |

---

## Troubleshooting

- **“Connection” shows red / errors**  
  Check: master powered and on network, correct IP in `config.json` (or Settings), and that you can reach it (e.g. `ping 192.168.7.4`).

- **Port 8000 in use**  
  Change the port in `run_io_link_fastapi.py` (e.g. `port=8001`) and point the frontend at the new URL (e.g. `IO_LINK_API_BASE`).

- **Frontend can’t reach API**  
  If the UI runs on another port (e.g. 5173), ensure `IO_LINK_API_BASE` points to the backend (e.g. `http://localhost:8000`). Check CORS if you see cross-origin errors.

---

## License

Use and adapt as needed for your IO-Link / smart sensor projects.
