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
| `src/io-link-page.js` | IO-Link Master page — port cards, connection KPIs, supervision charts, parameter panels |
| `src/io-link-vendors.js` | IO-Link vendor registry — 260+ manufacturers from IO-Link Community XML v252; `resolveVendorName(id)` and `resolveDeviceName(vendorId, deviceId, rawName)` |
| `src/worksheets-page.js` | CP0001 interactive worksheets — live ISDU controls, canvas signal animations, randomised fault-diagnosis scenario |
| `src/progress-page.js` | Student Progress page — session-based visit tracking for CP0001 and CP0002; JSON export and reset |
| `src/learn-page.js` | CP0001 — 8 chapters: sensor fundamentals through device identity |
| `src/cp0002-page.js` | CP0002 — 8 engineering worksheets: IO-Link deep-dive and maintenance scenarios |
| `src/settings-page.js` | Theme selector and IO-Link connection config UI |
| `src/admin-page.js` | Connection Diagnostics — IO-Link latency graph, circuit breaker, log viewer |
| `src/edge-device-page.js` | Edge Device page — Pi CPU/memory charts, service status, Chromium health |
| `src/components/mimic-components.js` | Reusable industrial UI components (temp gauge, capacitive indicator, LED, counters) |
| `src/components/terminal-log.js` | Datastream terminal with CSV export |
| `backend/io_link_fastapi.py` | Main FastAPI app — all routes + WebSocket handler + ISDU endpoints |
| `backend/al1350_client.py` | AL1350 HTTP client with circuit breaker, retry/jitter, adaptive polling, ISDU read/write |
| `backend/device_parameters.py` | IODD-derived parameter registry + ISDU encode/decode helpers |
| `backend/decoder.py` | CL50 LED decoder + sensor PDin/PDout parsers (temperature, photoelectric, capacitive, proximity). **Omron E2E byte order is non-obvious — see "Omron E2E Proximity Sensor" section.** |
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
| `(310, 733)` | IFM TV7105 | Temperature sensor — SP1 (583), RP1 (584), SP2 (593), RP2 (594) all int16 scale 0.1; calibration offset (681); teach commands. SP must always be above its own RP — no cross-constraint between SP1 and SP2. |
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
- `POST /api/io-link/port/{n}/mode` — body: `{mode: 'io-link'|'digital_in'|'digital_out'|'inactive'}` — writes port mode to AL1350 via `/iolinkmaster/port[N]/mode/setdata` and forces immediate re-poll. Returns `{success, port, mode}`

### Frontend ISDU Helpers (home-page.js and worksheets-page.js)

Both pages define the same async pattern:
- `_hmiIsduRead(portNum, index, subindex, dtype, scale)` → value or null
- `_hmiIsduWrite(portNum, index, subindex, value, dtype, scale, statusElId)` → bool
- `_hmiIsduCommand(portNum, cmdName, statusElId)` → bool

Parameter panels auto-load on first WebSocket message from each sensor. Port number is tracked in `_sectionPortNum['cap-port-num']` / `['temp-port-num']` / `['detection-port-num']` (populated by `_setPortBadge` in the WS handler).

## IO-Link Master Page — Key Data Flow Notes

The IO-Link Master page (`src/io-link-page.js`) has two data sources that must stay in sync:

- **WebSocket** (`/ws`) — MQTT-sourced push at 500 ms. Carries `ports[].pdin`, `ports[].mode`, `supervision`, `source`, `master_ip`, `device_name`, `software`. The `success`, `degraded_mode`, `master_ip` and `software` fields are merged into `system_state` by the HTTP poll loop and then re-broadcast via MQTT spread.
- **`/api/io-link/diagnostics`** — polled every 15 s. Returns `{success, stats: {...}}`. **All KPI fields live under `.stats`**, not at the top level. Keys: `stats.circuit_state`, `stats.consecutive_failures`, `stats.uptime_pct_1h`, `stats.drops_1h`, `stats.request_rtt_p50_ms`, `stats.request_rtt_p95_ms`, `stats.request_success_rate_pct`, `stats.mqtt_connected`, `stats.port_freshness_age_sec`.

**MQTT / HTTP merge:** Static port metadata (`vendor_id`, `device_id`, `name`) comes from the HTTP poll (via `get_port_info` with `include_static=True`, run every 6 cycles). The MQTT message parser initialises ports from `system_state.ports`, so once the HTTP poll has populated those fields they are preserved across MQTT updates. The HTTP poll also explicitly merges them back via the `if mqtt_connected:` block in `poll_loop`.

**`software` keys are capitalized:** The AL1350 returns `{"Bootloader": "AL1xxx_bl_f7_v2.4.1"}` — keys start with uppercase. The frontend must check `software['Bootloader']`, not `software.bootloader`.

**Port 4 (Light Stack / CL50):** Always keep in IO-Link mode. The "Switch to IO-Link" button in the port card is suppressed for `device_type === 'status_led'` ports.

## Vendor / Device Identity

`src/io-link-vendors.js` exports `resolveVendorName(vendorId)` and `resolveDeviceName(vendorId, deviceId, rawName)`.

- `VENDOR_NAMES` — 260+ entries from IO-Link Community `Vendor_ID_Table.xml` v252 (May 2026). IDs above 1260 are not in the official XML; add them manually with a comment.
- `DEVICE_NAMES` — keyed `'vendorId/deviceId'`; overrides the raw product name string for devices where the name needs a friendlier label. Current entries cover the four sensors in this kit.

Known vendor IDs in this kit: 310 (ifm), 342 (Contrinex), 612 (OMRON), 1586 (RS Pro).

## Omron E2E Proximity Sensor — PDin Byte Layout

**Critical:** The IODD uses `bitOffset` counted from the **LSB of the 16-bit record** (big-endian, byte 0 transmitted first). This means byte 0 and byte 1 are NOT in the intuitive order:

| Byte | Content |
|------|---------|
| Byte 0 | Monitor Output — oscillation amplitude (uint8, ~80 in free air) |
| Byte 1 bit 0 | OUT1 — object detected |
| Byte 1 bit 4 | Instability Detection Alarm |
| Byte 1 bit 5 | Over-Approach Alarm |
| Byte 1 bit 6 | Warning flag |
| Byte 1 bit 7 | Error flag |

In free air, a typical PDin is `5100`: byte 0 = `0x51` (monitor output ≈ 81), byte 1 = `0x00` (all flags clear). **Do not be misled** — the `0x5x` byte is NOT a status byte. Early versions of the decoder incorrectly read byte 0 as flags, causing permanent false "instability alarm" and false detections as the monitor amplitude LSB flickered between `0x50`/`0x51`.

The decoder fix is in `backend/decoder.py` — `decode_proximity_pdin()` now reads flags from `bytes_data[1]` and monitor output from `bytes_data[0]`.

## CP0001 Worksheet 2 — Signal Type Animations

WS2 ("What is a Smart Sensor?") contains three `<canvas>` animations that run via `requestAnimationFrame` loops managed by `initSensorTypeAnimations(container)` in `worksheets-page.js`.

**Canvas animation lifecycle — critical pattern:**
- Canvas animations use a separate `_canvasAnimCancellers` array (not `stopLiveData`). This is intentional: `stopLiveData` is called on every WebSocket reconnect and must not cancel animations. `_canvasAnimCancellers` is only cleared in `showWorksheet` and `showIndex` (navigation events).
- `ctx.roundRect` is NOT used — the Pi's Chromium is too old. Use the local `rrect(ctx, x, y, w, h, r)` helper instead.
- RAF loops are wrapped in try/catch so a single bad frame doesn't kill the loop permanently.
- Canvas width is resolved on the first RAF frame (`el.offsetWidth || 300`) — not at init time — because layout hasn't run yet when `initWorksheetInteractivity` is called synchronously after `innerHTML =`.

**Three animations:**
- **Digital** — LED indicator panel (left) + scrolling square wave (right). LED glows green with `shadowBlur` when ON.
- **Analogue** — Oscilloscope with Y-axis mA labels (4–20 mA), scrolling sine wave, gradient fill, live value box.
- **IO-Link** — Dark canvas: sensor box (left) → 3-wire cable → master box (right). Coloured data-packet pills (`OUT1`, `Temp`, `Fault`, `Model`, `SP1`, `S/N`) spawn at the sensor and travel to the master; a traveling glow follows each packet along the cable. A square wave below the cable shows the switching output is still present. A decoded values panel at the bottom flashes each field when its packet arrives.

## CP0001 Worksheet 2 — Fault Diagnosis Scenario

`initLiveWs2Smart` wires up a randomised maintenance scenario at the bottom of WS2. On each "Start Scenario" click a fault is picked at random from 5 options:

1. Temperature sensor over SP1 setpoint (Port 3)
2. Proximity sensor OUT1 stuck HIGH (Port 1)
3. Wrong device identity on Port 2 (temperature sensor instead of capacitive)
4. IO-Link communication loss on Port 3
5. Master supply voltage undervoltage

A debug console streams lines every 300 ms. ~90% are realistic backend spam (`[INFO]`/`[DEBUG]`); hints appear every 8–10 lines as `[WARN]` lines in amber. Each fault has 4 unique hints that cycle. Answer options are shuffled on each run. The interval is tracked via `_canvasAnimCancellers` token so it is cleaned up on navigation.

## CP0001 Worksheet 3 — Proximity ISDU Misconfiguration Scenario

`initLiveWs2` (note: naming offset — WS3 is driven by `initLiveWs2`) wires up a hands-on ISDU parameter misconfiguration scenario at the bottom of WS3. The sensor is the Omron E2E-X16MB1T12 on Port 1.

**Scenario:** "Start Scenario" clicks `isduWrite(1, 61, 1, 1, 'uint8', 1, null)` to set Switchpoint Logic OUT1 (index 61 / sub 1) to **NC (value 1)**. This inverts output behaviour — the sensor output is ON when nothing is present and OFF when metal is detected. The student must notice the anomaly, diagnose via ISDU read, write the fix (value 0 = NO), and verify the corrected output.

**State machine — `_msStep`:**

| Value | Meaning |
|-------|---------|
| 0 | Idle — "Start Scenario" not yet clicked |
| 1 | Fault injected — sensor set to NC, observe step visible |
| 2 | Student clicked "I have observed the anomaly" |
| 3 | Correct diagnosis selected (NC logic) |
| 4 | ISDU read performed and confirmed NC |
| 5 | Fix written (value 0 = NO) — verify step visible |
| 6 | Verify passed (3-second hold) — sign-off visible |

**Auto-restore on navigation — `_ws3FaultCleanup`:**

```js
let _ws3FaultCleanup = null; // module-level
```

- Set to `() => isduWrite(1, 61, 1, 0, 'uint8', 1, null)` immediately after a successful inject.
- Cleared to `null` after a successful fix write (Step 4 → 5).
- `stopLiveData()` calls and clears it — fires on any in-page navigation away from WS3.
- **Limitation:** force-closing the browser tab bypasses cleanup. Trainer must navigate back to WS3 and click Reset, or re-run the scenario, to restore NO if the tab was closed mid-fault.

**Three parallel live value panels (all updated in one WS callback loop):**

| Panel prefix | When visible |
|-------------|-------------|
| `ws3-hmi-*` | Always — HMI panel at the top of the challenge box |
| `ws3-obs-*` | Step 1 (observe step) |
| `ws3-vfy-*` | Step 5 (verify step) |

Fields per panel: `det` (DETECTED / NO OBJECT), `instab` (ACTIVE / CLEAR), `overapp` (ACTIVE / CLEAR), `mon` (monitor output uint8).

**Verify step:** 3-second continuous hold — `det === true && instab === false`. Progress bar `ws3-ms-vfy-bar/pct/tbar/timer` tracks elapsed time. Timer resets if condition breaks before 3 s.

**Sign-off:** 3 checkboxes (`ws3-ms-ck1/ck2/ck3`) — all must be ticked before "Close" button enables.

**Key ISDU parameter — Omron Switchpoint Logic OUT1:**

| Field | Value |
|-------|-------|
| Index | 61 (0x3D) |
| Subindex | 1 |
| dtype | uint8 |
| 0 = NO | Normal open — output ON when object detected (default) |
| 1 = NC | Normal closed — output ON when NO object detected (inverted) |

Registered in `backend/device_parameters.py` at key `(612, 131094)` under `output_logic`.

## CP0001 Worksheet 5 — Temperature Sensor (IFM TV7105)

Driven by `initLiveWs4` (naming offset — WS5 is `initLiveWs4`, WS4 is `initLiveWs3`, etc.).

### TV7105 Setpoint / Reset Point System

The TV7105 has two independent switching outputs. Each has its own Switch Point (SP) and Reset Point (RP):

| Index | Param | dtype | scale | Role |
|-------|-------|-------|-------|------|
| 583 | SP1 | int16 | 0.1 | OUT1 switches ON when temp rises above SP1 |
| 584 | RP1 | int16 | 0.1 | OUT1 switches OFF when temp falls below RP1 |
| 593 | SP2 | int16 | 0.1 | OUT2 switches ON when temp rises above SP2 |
| 594 | RP2 | int16 | 0.1 | OUT2 switches OFF when temp falls below RP2 |

**SP1 and SP2 are completely independent** — there is no ordering constraint between them at the hardware level. Each output can be at any temperature. The only enforced constraint is **SP must be above its own RP** (same output). The sensor will silently reject an ISDU write that violates SP > RP.

**Hysteresis:** the gap between SP and RP prevents chattering when temperature hovers near the setpoint. The worksheet includes an explanation card with a three-column diagram (Below RP → holds OFF | RP→SP zone → holds state | Above SP → ON).

### Demo Setpoints — Auto-Reset on Load

`_WS5_DEFAULTS = { sp1: 31, rp1: 28, sp2: 29, rp2: 26 }` — chosen for ambient ~27°C, max finger-warmth ~32°C:

- **SP2=29°C** — pre-warning fires at +2°C above ambient, easy first trigger
- **SP1=31°C** — main alarm fires near the limit of finger warmth
- **RP1=28°C** — resets in the middle zone, clearly demonstrates hysteresis
- **RP2=26°C** — resets well below ambient so OUT2 clears quickly

On every WS5 load, `initLiveWs4` writes these values in the correct order: RP1 and RP2 first (parallel), then SP1 and SP2 (parallel). This ensures students always start from a known state regardless of what the previous student changed.

**Write order is critical** — always lower the RP before lowering the SP. Writing SP below the current RP will be rejected by the sensor.

### Calibration Drift Scenario (work order CAL-0189)

State machine — `_ws5CalStep`:

| Value | Meaning |
|-------|---------|
| 0 | Idle |
| 1 | Fault injected — calibration offset +3.0°C written to index 681 |
| 2 | Student observed the drift |
| 3 | Correct diagnosis selected |
| 4 | ISDU read confirmed offset value |
| 5 | Fix written (offset → 0.0°C) — verify step visible |
| 6 | Verified (3-second hold within ±1.5°C of pre-inject reading) — sign-off |

`_ws5CalCleanup` — set to `() => isduWrite(3, 681, 0, 0.0, 'int16', 0.1, null)` on inject, cleared after student fix write. Called in `stopLiveData()` so navigating away mid-scenario always restores the sensor.

Calibration offset: index 681, subindex 0, int16, scale 0.1, range ±10°C. Index 583 default for SP1 in device_parameters.py is 60.0°C.

### CP0002 Worksheet 9 — PT100 Technical Deep-Dive

Technical PT100 content (resistance curve, IEC 60751 accuracy, PDin hex decode exercises, two's complement) lives in `src/cp0002-page.js` as worksheet index 9. The live panel `#cp2-ws9-live-panel` is wired by `initLiveCp2Ws9()` — called from `initWorksheetInteractivity` when the panel element is present.

## CP0001 Worksheet 1 — Capacitive Challenge Tolerance

The WS1 challenge (trigger proximity, keep capacitive clean) uses `_chCapTolerance` (default 30) as the raw capacitive value threshold before failure, instead of `> 0`. A slider below the challenge box lets the student adjust from 0–10000. The slider is wired in `initLiveIntro` and resets to 30 on each page load.

## Student Progress Page

`src/progress-page.js` — registered as `data-page="progress"` in the sidebar under Study.

- **Tracking:** CP0001 and CP0002 visited worksheet indices are stored in `sessionStorage` keys `progress_cp0001_visited` and `progress_cp0002_visited`. `markVisited(courseKey, index)` is called from `showWorksheet()` in both `worksheets-page.js` and `cp0002-page.js`.
- **Session reset:** Clears both sessionStorage keys. Further Study (learn page) is intentionally NOT tracked here.
- **JSON export:** Downloads a snapshot of both courses via `Blob` + `URL.createObjectURL`. Session start timestamp is included.
- **Rings:** SVG progress rings per course — green at 100%, amber at ≥50%, red below.

## IO-Link Master Page — Port Details Stability Fix

`_lastPortDetailKey` tracks a string of `port:mode` pairs. `loadActivePortDetails` is only called when that key changes (i.e., a sensor is plugged in or its mode changes). This prevents the IODD parameter panel from collapsing and re-expanding on every 500 ms WebSocket push.

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

## Banner CL50 Pro (Port 4) — PDout Control

The CL50 Pro RGB is a PDout-only device (`device_type = 'status_led'`, vendor_id=451, device_id=393229). It has no PDin; control is write-only via the AL1350 pdout/setdata service call.

**PDout 3-byte layout** (from official Banner CL50PKQ datasheet):

| Byte | Bits | Field |
|------|------|-------|
| Octet0 | [7:6] | Audible (0=Off, 1=On, 2=Pulsed, 3=SOS) |
| Octet0 | [5:3] | Color 2 Intensity (C2I) |
| Octet0 | [2:0] | Color 1 Intensity (C1I) |
| Octet1 | [7:6] | Speed (0=Medium, 1=Fast, 2=Slow) |
| Octet1 | [5:3] | Pulse Pattern (0=Normal, 1=Strobe, 2=Three Pulse, 3=SOS, 4=Random) |
| Octet1 | [2:0] | Animation (0=Off, 1=Steady, 2=Flash, 3=Two Color Flash, 4=Intensity Sweep) |
| Octet2 | [7:4] | Color 2 index |
| Octet2 | [3:0] | Color 1 index |

**Intensity values:** 0=High, 1=Low, 2=Medium, 3=Off, 4=Custom.
**Color indices:** 0=Green, 1=Red, 2=Orange, 3=Amber, 4=Yellow, 5=Lime, 6=Spring Green, 7=Cyan, 8=Sky Blue, 9=Blue, 10=Violet, 11=Magenta, 12=Rose, 13=White, 14=Custom1, 15=Custom2.

**Startup default:** `write_pdout(4, "000100")` — Green, Steady, High intensity. Written in `start_background_polling()`.

**AL1350 write endpoint:** POST `http://<ip>/` with `{"code":"request","cid":-1,"adr":"/iolinkmaster/port[4]/iolinkdevice/pdout/setdata","data":{"newvalue":"hex"}}`.

**Frontend:** `_cl50WritePdout(hex, statusElId)` and `_cl50StartSweep(color1, color2, speed, statusElId)` in `src/home-page.js`. The Port 4 card contains quick-colour buttons and a full control grid. The CL50 config modal (`#modal-led-config`) shows all fields and a live hex preview (`#led-modal-hex-preview`) that updates on every dropdown change.

### Intensity Sweep — Firmware Bug (v1.0.2)

**CL50 firmware 1.0.2 does not execute animation=4 (Intensity Sweep) from PDout.** The AL1350 accepts the write (returns code 200), but the light shows a static colour at the specified C1I intensity — it does not cycle. All other animation values (0–3) work correctly.

Attempted workarounds that did NOT fix it:
- Setting C1I=Off(3) while sending animation=4 — light simply turned off.
- Writing sweep configuration to ISDU preset indices 0x40–0x44 — writes accepted but had no effect on PDout behaviour.
- Issuing animation=4 directly via AL1350 HTTP bypassing the backend — same static result.

**Software sweep workaround:** `io_link_fastapi.py` runs a background asyncio task (`_run_sweep_loop`) that cycles C1I through Low→Medium→High→Medium→Low at configurable intervals using animation=Steady. This produces a visible breathing effect.

Sweep step sequence (never reaches Off so the light stays dimly lit at the bottom):
```python
SEQ = [
    (1, 2),  # Low    — 2 holds (dim floor)
    (2, 2),  # Medium — 2 holds (ramp up)
    (0, 4),  # High   — 4 holds (linger at peak)
    (2, 2),  # Medium — 2 holds (ramp down)
    (1, 2),  # Low    — 2 holds (dim floor)
]
# step_ms: 40 = fast, 100 = medium, 250 = slow
```

**Backend sweep endpoints:**

| Endpoint | Method | Body | Action |
|----------|--------|------|--------|
| `/api/io-link/port/{n}/pdout/sweep` | POST | `{color1, color2, speed}` | Start software sweep task |
| `/api/io-link/port/{n}/pdout/sweep/stop` | POST | — | Cancel sweep task |

Any write to `/api/io-link/port/{n}/pdout` also cancels the running sweep first (via `_stop_sweep(port_num)` at the top of `write_port_pdout`).

**Frontend routing:** In `_initCl50Controls()` and the modal save handler, if `animation === 4` the write button calls `_cl50StartSweep()` instead of `_cl50WritePdout()`. Any other animation write stops the sweep implicitly via the backend's `_stop_sweep` call in `write_port_pdout`.

### CL50 Modal Improvements

- **No auto-close:** Modal no longer closes after Write. The DaisyUI `<form method="dialog">` was triggering an implicit submit — Save button was moved outside the form and the `setTimeout close()` was removed.
- **Live hex preview:** `_modalHexPreview()` recalculates and updates `#led-modal-hex-preview` whenever any of the 6 modal selects change. Shows the exact 6-character hex that will be written (or displays "sweep" label if animation=4).

## Pi Performance Optimisations

Renderer CPU typically ~97% after these changes (was ~119% before).

**Chart.js flush throttle:** Chart `update()` is throttled to once per 2 seconds via a `_chartFlushPending` dirty flag in the WebSocket handler. Data points are still appended every push but redraws are batched.

**Mimic component dirty-key guards (`src/components/mimic-components.js`):** All 5 components (temp gauge, capacitive indicator, proximity LED, counter, light stack) compare a stringified dirty key before calling `innerHTML =` or canvas draw. Components skip re-render when sensor values haven't changed between 500 ms pushes.

**Chromium kiosk flags (`/home/pi/kiosk.sh`):**
```
--disable-accelerated-2d-canvas
--num-raster-threads=2
--disable-gpu-compositing
```
These reduce CPU overhead from GPU-acceleration paths that don't benefit on the Pi's framebuffer configuration.

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
