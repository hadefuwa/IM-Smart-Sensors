# IM-Smart-Sensors

Web dashboard for monitoring **IFM IO-Link Master** devices (e.g. AL1100/AL1300). Real-time status, port data, supervision trends, and optional CL50 LED decoding.

**Repository:** [github.com/hadefuwa/IM-Smart-Sensors](https://github.com/hadefuwa/IM-Smart-Sensors)

---

## Features

- **Real-time updates** via WebSocket (no polling from the browser)
- **Port status** – mode, vendor/device ID, process data (PDin/PDout)
- **Supervision trends** – current, voltage, temperature over time
- **Active port details** – per-port process data and optional CL50 LED decode
- **Connection indicator** – green when connected, red when disconnected
- **Two frontends** – simple HTML or Matrix-style UI (Tailwind + DaisyUI)
- **Change Master IP from the UI** – no need to edit config files

---

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Backend  | Python 3, FastAPI, WebSockets, httpx |
| Frontend | HTML/JS (Bootstrap) or Vite + Tailwind + DaisyUI (Matrix template) |
| API      | REST + WebSocket `/ws` |

---

## Quick Start

### 1. Configure IO-Link Master

Edit `backend/config.json` and set your master’s IP:

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

### 3. Open the dashboard

**Option A – Simple frontend (same origin)**  
With the backend running, open:

- **http://localhost:8000/**  
  Serves `frontend/io-link.html` with WebSocket to the same host.

**Option B – Matrix template UI (Vite)**  
Separate dev server for the Matrix-style UI:

```bash
cd matrix-template/ui
npm install
npm run dev
```

Then open the URL shown (e.g. http://localhost:5173). Set the API base if needed, e.g. `window.IO_LINK_API_BASE = 'http://localhost:8000'` (default when backend is on 8000).

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
   - **http://\<pi-ip\>:8000/** – backend serves the simple frontend.
   - Or use the [GitHub Pages](https://hadefuwa.github.io/IM-Smart-Sensors/) UI and set the API base to `http://<pi-ip>:8000` (e.g. in browser console: `window.IO_LINK_API_BASE = 'http://192.168.7.10:8000'` then refresh).

3. **Optional:** Put the Pi’s IP in `config.json` as `master_ip` if the IO-Link Master is at a different IP, or change it from the dashboard’s “IO-Link Master address” section.

---

## GitHub Pages (UI only)

The repo includes a built version of the Matrix template for [GitHub Pages](https://hadefuwa.github.io/IM-Smart-Sensors/). That site is **static** – it cannot run the backend. To see live data, run the backend (on your PC or a Pi) and open **http://\<backend-host\>:8000/** or point the Pages UI at your backend as above.

---

## Project Layout

```
├── backend/
│   ├── io_link_fastapi.py   # FastAPI app, WebSocket, polling
│   ├── run_io_link_fastapi.py
│   ├── decoder.py           # CL50 LED decoder
│   ├── config.json
│   └── requirements.txt
├── frontend/
│   ├── io-link.html         # Simple dashboard
│   └── assets/
│       └── img/
│           └── AL1300.png
├── matrix-template/         # Matrix-style UI (from Matrix-Template-App)
│   └── ui/                  # Vite + Tailwind + DaisyUI
│       ├── src/
│       │   ├── main.js
│       │   └── io-link-page.js   # IO-Link Master page + WebSocket
│       └── public/
│           └── assets/img/AL1300.png
├── Plan.md
└── README.md
```

---

## API Summary

| Endpoint | Description |
|----------|-------------|
| `GET /` | Serves the Matrix template dashboard (or simple frontend) |
| `GET /api/io-link/config` | Get IO-Link Master IP/port config |
| `PUT /api/io-link/config` | Update Master IP/port (saved to config.json) |
| `GET /api/io-link/status` | Full status (ports, supervision, software) |
| `GET /api/io-link/port/<port_num>` | Detailed port data (e.g. PDin/PDout decoded) |
| `GET /api/io-link/supervision-history` | Time-series for charts |
| `WS /ws` | Real-time JSON pushes (same shape as status) |

---

## Troubleshooting

- **“Connection” shows red / errors**  
  Check: master powered and on network, correct IP in `config.json`, and that you can reach it (e.g. `ping 192.168.7.4`).

- **Port 8000 in use**  
  Change the port in `run_io_link_fastapi.py` (e.g. `port=8001`) and in the frontend (e.g. `IO_LINK_API_BASE` or backend URL).

- **Matrix UI can’t reach API**  
  If the UI runs on another port (e.g. 5173), ensure `IO_LINK_API_BASE` points to the backend (e.g. `http://localhost:8000`).

---

## License

Use and adapt as needed for your IO-Link / smart sensor projects.
