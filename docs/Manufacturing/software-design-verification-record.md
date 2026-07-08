# Software Design & Verification Record
## IM4330 — IO-Link Smart Sensor Training System

| | |
|---|---|
| **Document No.** | `[TBC]` |
| **Title** | Software Design & Verification Record — IM4330 |
| **Applies To** | IM4330 HMI dashboard software (frontend + backend), Curriculum Codes CP3723 · CP7395 |
| **Issue** | 1.1 |
| **Date** | 2026-07-08 |
| **Classification** | Internal — Design History / Development Record |
| **Supplier** | Matrix Technology Solutions Ltd — development@matrixtsl.com |

---

> This document is item **6 — Software** of the IM4330 product development record. It captures the design and development evidence for the four software checklist items: main functional logic, the GUI/HMI, fault handling, and alarm/alert logic. It is a design/verification record, not a per-unit production test — for production test steps see `docs/Manufacturing/LD0013-electrical-test-procedure.md`.

---

## Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [Referenced Documents](#2-referenced-documents)
3. [Software Architecture Overview](#3-software-architecture-overview)
4. [6.1 — Software Logic for Main Functionality](#41-software-logic-for-main-functionality)
5. [6.2 — User Interface (GUI / HMI) Design and Test](#42-user-interface-gui--hmi-design-and-test)
6. [6.3 — Fault Handling Logic](#43-fault-handling-logic)
7. [6.4 — Alarm Logic (Alerts to User)](#44-alarm-logic-alerts-to-user)
8. [Sign-Off](#5-sign-off)
9. [Revision History](#6-revision-history)

---

## 1. Purpose and Scope

This record demonstrates that the IM4330 software (Raspberry Pi HMI dashboard, frontend and backend) has been designed, implemented, and verified against the following development checklist:

- Write and test software logic for main functionality
- Design and test user interface (GUI / HMI)
- Add and verify fault handling logic (communications failure, etc.)
- Add and verify alarm logic (alerts to user)

It covers the software running on the Raspberry Pi (`src/` frontend, `backend/` FastAPI service) that drives the IM4330 HMI, and the interaction between that software and the IFM AL1350 IO-Link master and its four connected devices.

**Not covered here:** AL1350 firmware (supplied and validated by IFM), electrical/production test (see LD0013), and curriculum/worksheet educational content (see `docs/Curriculum/`).

## 2. Referenced Documents

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` (project root) | Authoritative architecture reference — reliability patterns, ISDU protocol, page-by-page behaviour |
| `docs/dev-notes/IO-LINK-COMMS-GUIDE.md` | Full IO-Link + MQTT architecture guide |
| `docs/Manufacturing/LD0013-electrical-test-procedure.md` | Production test evidence for Test 7 (network loss) and Test 8 (fail-safe behaviour), which exercise the same fault-handling logic described here |
| `docs/manuals/User Manual/user-manual.md` | Operator-facing description of startup, status indicators, and fault scenarios |
| `docs/manuals/PI_OPERATIONS.md` | Deploy, rollback, and health-check workflow |
| `backend/al1350_client.py` | Circuit breaker, retry/jitter, protocol fallback, adaptive polling implementation |
| `backend/io_link_fastapi.py` | REST/WebSocket routes, MQTT subscription lifecycle, sweep task |
| `backend/decoder.py` | PDin decode logic (alarm/status flags per sensor) |
| `backend/alarm_logger.py` | Structured, persistent alarm/event log (`logs/alarms.jsonl`) — closes the gap identified in Issue 1.0 review (see Revision History) |
| `src/main.js`, `src/io-link-page.js`, `src/admin-page.js` | Frontend routing, connection status UI, diagnostics page |
| `src/edge-device-page.js` | Pi CPU/memory charts, systemd service status, Chromium kiosk health |

## 3. Software Architecture Overview

```
Sensor (PDin/PDout) → IFM AL1350 (IO-Link master) → MQTT (Mosquitto, 500 ms) → FastAPI backend
                                                                                   │
                                                              WebSocket push ◄─────┘
                                                                   │
                                                       Chromium kiosk HMI (frontend SPA)
```

- **Backend:** Python, FastAPI + `httpx` async client, `aiomqtt` subscriber, WebSocket broadcaster. Single source of truth for device state (`system_state`).
- **Frontend:** Vite + vanilla JS (ES6 modules), no framework/router library — pages are functions that render into `<main>`. Chart.js for time-series, DaisyUI/Tailwind for styling.
- **Transport:** MQTT push is the primary live-data path; HTTP polling runs in parallel as an automatic fallback and for ISDU (acyclic) reads/writes.

---

## 4.1 Software Logic for Main Functionality

**Objective:** confirm the core application logic — reading live sensor data, decoding it to engineering values, and writing device parameters — is implemented and functionally verified.

| Area | Implementation | Verification Evidence |
|------|-----------------|------------------------|
| Live data ingest | `al1350_client.py` polls `/gettree`, `getdatamulti`, and per-port endpoints; `ensure_mqtt_subscription()` registers the AL1350's MQTT push on every backend startup | LD0013 Test 2 (power-up) and Test 4 (I/O test) confirm live values reach the HMI within 500 ms of a sensor state change |
| PDin decode | `decoder.py` — per-sensor decode functions for temperature (PT100 scale), photoelectric, capacitive, and proximity (Omron E2E byte-order fix documented in `CLAUDE.md`) | LD0013 Test 5 (sensor simulation) cross-checks raw hex against the decoded engineering value for each sensor type |
| ISDU parameter read/write | `device_parameters.py` (registry, keyed by vendor/device ID) + `iolreadacyclic` / `iolwriteacyclic` service calls in `al1350_client.py`; REST endpoints `GET/POST /api/io-link/port/{n}/parameter/*` | LD0013 Test 4, Step "ISDU service call" — confirms full round trip browser → FastAPI → AL1350 → sensor |
| Port mode control | `POST /api/io-link/port/{n}/mode` writes `/iolinkmaster/port[N]/mode/setdata` and forces an immediate re-poll | Exercised via IO-Link Master page; port list updates without a full page reload |
| PDout control (Light Stack) | `write_pdout()` service call, 3-byte encode per Banner CL50 datasheet; software intensity-sweep task (`_run_sweep_loop`) as a firmware-bug workaround for animation=4 | LD0013 Test 4/5 — quick-colour buttons and full config modal verified against physical light output |
| Data flow signature stability | `poll_snapshot()` returns a fixed 3-tuple `(ports, device_info, supervision)`; all call sites updated together when the signature changes | Regression-checked on every backend change per project convention (`CLAUDE.md`) |

**Testing method:** manual functional exercise of every HMI control against live hardware (no simulated/mocked device layer is used in this project — see `[[../../CLAUDE.md]]` reliability patterns), cross-referenced against LD0013 Tests 2, 4, and 5.

**Status:** ☐ Complete — evidence attached above  ☐ Outstanding — details below

_______________________________________________________________

---

## 4.2 User Interface (GUI / HMI) Design and Test

**Objective:** confirm the touch HMI dashboard is designed for its target environment (1024×600 kiosk touchscreen, and secondary desktop-browser use) and has been tested across both.

| Area | Implementation | Verification Evidence |
|------|-----------------|------------------------|
| Page structure | `src/main.js` — page routing, no router library; pages swap `<main>` innerHTML | Manual navigation test across all pages (Home, IO-Link Master, Worksheets, Progress, Settings, Admin, Edge Device) |
| Kiosk layout | `isTouchKioskLayout()` (≤1280×900) switches sidebar to drawer mode; `<aside>` kept `display:flex` at all sizes per the documented sidebar scroll fix (`docs/manuals/SIDEBAR_SCROLL_FIX.md`) | Verified on the physical WaveShare 1024×600 panel — sidebar drawer opens/closes and scrolls correctly |
| Touch input | Drag-to-scroll implemented via `mousedown`/`mousemove`/`mouseup` (X11 emulates touch as mouse events on this platform — no native `touchstart`) | Verified on-device; scroll and tap targets confirmed usable at the kiosk's physical size |
| Live component rendering | `src/components/mimic-components.js` — temperature gauge, capacitive indicator, proximity LED, counters, light-stack mimic; dirty-key guard skips re-render when values are unchanged | LD0013 Test 4/5 — visual state matches physical sensor state within 500 ms |
| Global display zoom | `applySavedZoom()` — `html{zoom}` + `screen.width`/`screen.height`-based compensation (viewport/body-height fixes documented in `CLAUDE.md`) | Verified at multiple zoom levels (50–150%) with no white-space clipping on the kiosk panel |
| Theming | DaisyUI theme selector, persisted via `localStorage` key `matrix-theme` | Verified across light/dark/industrial themes |
| Charting | Chart.js, buffers capped at 50 points/series, redraw throttled to once per 2 s | Verified CPU load remains acceptable on Pi 4 (~97% renderer, per `CLAUDE.md` Pi Performance Optimisations) |
| Cross-platform access | Dashboard also usable from any desktop browser on the same LAN, and a UI-only static build for GitHub Pages | Verified in Chrome/Edge desktop during development |
| IO-Link Diagnostics page | `src/admin-page.js` — latency graph, circuit-breaker state, MQTT status, log viewer; data pulled from `/api/io-link/diagnostics` every 15 s | Verified all fields update correctly during induced link loss and recovery (cross-ref LD0013 Test 7) |
| Edge Device page | `src/edge-device-page.js` — Raspberry Pi CPU/memory charts, `im-sensors-backend.service` status, Chromium kiosk health, all independent of the sensor/MQTT data path | Verified readings track actual Pi load (cross-checked against `top`/`systemctl status` over SSH) and update live without a page refresh |

**Testing method:** functional walkthrough of every page and interactive control on the physical kiosk hardware, plus desktop-browser spot checks. The `/verify` project skill (see `.claude` skill config) is used to exercise UI changes end-to-end before sign-off, not just type-check/build.

**Status:** ☐ Complete — evidence attached above  ☐ Outstanding — details below

_______________________________________________________________

---

## 4.3 Fault Handling Logic

**Objective:** confirm the software detects and handles communications and device failures gracefully, without operator intervention, and without crashing or hanging the HMI.

> **Note on scope:** the IM4330 does not use USB for its live sensor communications path — the AL1350 ↔ Raspberry Pi link is Ethernet/MQTT, and the AL1350 ↔ sensor link is IO-Link (M12, 3-wire). USB on this system is limited to keyboard/mouse during setup and is not part of the live data path (see `CLAUDE.md`, Communication Interfaces). The fault-handling logic below addresses the equivalent — and in this system, primary — risk: loss of network/IO-Link communication.

| Failure mode | Handling logic | Verification Evidence |
|--------------|-----------------|------------------------|
| AL1350 ↔ Pi Ethernet link loss | WebSocket auto-reconnects with exponential back-off + jitter; last known-good values remain displayed rather than blanking | LD0013 Test 7, Steps 7.1–7.2 |
| Repeated request failures (5 consecutive) | Circuit breaker opens in `al1350_client.py`; recovers automatically after a 15 s timeout — deliberately not bypassed elsewhere in the codebase | LD0013 Test 7, Step 7.3 (`Circuit State: OPEN` visible on Admin/Diagnostics page) |
| Transient request failure | Retry with exponential backoff and randomised jitter (intentional — prevents thundering-herd reconnect storms against the AL1350) | Code review + Admin/Diagnostics `request_success_rate_pct` / RTT metrics during induced link loss |
| `getdatamulti` unavailable | Protocol fallback chain drops to individual per-endpoint GETs (`degraded_mode=True`) | Verified via backend log during simulated AL1350 API degradation |
| MQTT subscription lost (e.g. AL1350 power cycle) | `ensure_mqtt_subscription()` re-registers the push subscription on every backend startup; HTTP polling continues in parallel as a fallback data path throughout | LD0013 Test 7, Step 7.5; LD0013 Test 8, Step 8.8 |
| Backend process restart | systemd service (`im-sensors-backend.service`) auto-restarts; light stack and polling loop return to documented defaults on startup | LD0013 Test 8, Steps 8.5–8.6 |
| Disconnected/inactive IO-Link port | Adaptive polling reduces poll rate to the port (5 s vs 1 s) rather than continuously retrying at full rate; cached data returned for skipped ports | Code review of `poll_ports()` / `_port_next_poll_ts` |
| Sensor-level ISDU misconfiguration left mid-exercise | Auto-restore cleanup (`_ws3FaultCleanup`, `_ws5CalCleanup` patterns) writes the safe default back to the sensor on navigation away, even if the student does not complete the exercise | LD0013 Test 8, Steps 8.1–8.4 |
| Full power loss / power cycle | System returns to the same known-good state with no residual fault state carried over (no persistent fault flags held outside sensor ISDU state) | LD0013 Test 8, Step 8.6–8.7 |
| HMI kiosk process | Chromium is force-killed and relaunched cleanly by `kiosk.sh` on every deploy/restart, preventing instance accumulation after a crash | Verified as part of the standard deploy procedure (`CLAUDE.md`, Raspberry Pi Deployment) |
| Edge compute failure (backend service crash / resource exhaustion) | Edge Device page polls systemd service status and Pi CPU/memory independently of the sensor/MQTT data path, so a backend crash or resource exhaustion remains visible even when cached sensor data still looks normal | Verified by manually stopping `im-sensors-backend.service` and confirming the Edge Device page shows the service as inactive without needing an SSH session |
| No durable record of past fault events (historic gap) | Every fault-handling transition in this table (circuit breaker, degraded mode, link loss) is now additionally written to the persistent alarm log (`backend/alarm_logger.py`) — see [4.4](#44-alarm-logic-alerts-to-user) | Confirmed a circuit-breaker OPEN event, logged during this record's own verification, was still readable via `GET /api/io-link/alarms` after a full backend restart |

**Testing method:** induced-fault testing — physically disconnecting the Ethernet link, power-cycling the AL1350, and killing the backend service — cross-referenced against LD0013 Tests 7 and 8, which exercise this logic as part of production test. Circuit-breaker and retry/jitter behaviour additionally verified by code review, as they are explicitly documented as "do not bypass" / "do not remove" patterns in `CLAUDE.md`.

**Status:** ☐ Complete — evidence attached above  ☐ Outstanding — details below

_______________________________________________________________

---

## 4.4 Alarm Logic (Alerts to User)

**Objective:** confirm the software surfaces device and system-level alarm/warning conditions clearly to the operator, using consistent, unambiguous indicators.

| Alarm / Alert | Source | User-Facing Indication |
|----------------|--------|--------------------------|
| WebSocket connection state | Frontend WS handler | Status dot in the HMI top bar: green (Connected) / amber (Reconnecting) / red (Disconnected) |
| Circuit breaker state | `al1350_client.py` → `/api/io-link/diagnostics` (`stats.circuit_state`) | Admin/Diagnostics page — circuit state, consecutive failures, uptime %, drop count, RTT p50/p95 |
| Degraded protocol mode | `degraded_mode` flag in `system_state` | Surfaced on the Admin/Diagnostics log viewer |
| Proximity sensor Instability / Over-Approach alarms | Decoded from PDin byte 1, bits 5–6 (`decode_proximity_pdin()`) | Live status indicator on the Home page proximity card, and on the WS3 (CP0001) fault-diagnosis live panel |
| Proximity sensor Warning / Error flags | PDin byte 1, bits 6–7 | Live status indicator, same panel as above |
| Temperature over/under setpoint | SP1/RP1/SP2/RP2 comparison against live PDin value | OUT1/OUT2 state shown on the Home page temperature card; used directly in the WS2 randomised fault scenario ("Temperature sensor over SP1 setpoint") |
| Supply supervision (voltage/current/temperature) | `processdatamaster/*` — `AL1350ClientManager.get_supervision()` | Supervision charts on the IO-Link Master page; "Master supply voltage undervoltage" is one of the 5 randomised WS2 fault scenarios |
| Wrong device identity on a port | Vendor ID / Device ID mismatch against the expected registry entry | IO-Link Master page port card; "Wrong device identity" is one of the 5 randomised WS2 fault scenarios |
| IO-Link communication loss (per port) | Port mode/state polling | Port card shows disconnected state; one of the 5 randomised WS2 fault scenarios |
| Guided fault-scenario hints | `initLiveWs2Smart` debug console | Amber `[WARN]` lines surfaced every 8–10 lines among realistic `[INFO]`/`[DEBUG]` spam, cycling through 4 unique hints per fault |
| CL50 light stack as a status alert channel | PDout colour/animation control (`_cl50WritePdout`, `_cl50StartSweep`) | Physical, panel-visible colour/animation change — usable as a system-status beacon independent of the screen |
| Consolidated fault dashboard | IO-Link Diagnostics page, `/api/io-link/diagnostics` (`stats.*`), polled every 15 s | Single page surfaces uptime %, drop count, RTT p50/p95, and MQTT connection state — an early-warning view distinct from the per-sensor cards, intended for the trainer/technician rather than the student |
| Edge-compute resource/service alarm | Edge Device page — Pi CPU/memory thresholds and `im-sensors-backend.service` status | Visual warning when the backend service is not active or Pi resource load is abnormally high — flags an edge-compute problem distinct from a sensor or network fault |
| **Persistent alarm/event log** | `backend/alarm_logger.py` — structured JSON-lines record (`logs/alarms.jsonl`, rotated at 2 MB × 5 backups) of circuit-breaker trips, degraded-mode transitions, link connect/disconnect, proximity instability/over-approach/warning/error, temperature OUT1/OUT2 transitions, supply under/overvoltage, and ISDU writes. Surfaced on the IO-Link Diagnostics page as a filterable "Alarm Log" panel (`GET /api/io-link/alarms`) with a one-click export (`GET /api/io-link/alarms/export`) | Verified the log survives a full backend restart (in-memory ring buffer is pre-loaded from the on-disk file on startup — confirmed by writing test events, restarting `im-sensors-backend.service`, and re-reading `/api/io-link/alarms`); confirmed export downloads the complete `.jsonl` file for offline review |

**Testing method:** each alarm condition above is deliberately triggered (via ISDU write, physical target presentation, or induced comms loss) and the corresponding HMI indication is confirmed to appear within the expected update window (typically ≤ 500 ms for live data, ≤ 15 s for diagnostics polling). The five randomised WS2 fault scenarios (CP0001) double as a repeatable alarm-logic regression check, since each exercises a distinct alert path end-to-end. The persistent alarm log additionally lets each of these conditions be verified *after the fact* — a gap identified in Issue 1.0 of this record, where alarm state was live-only and left no trace once cleared.

**Status:** ☐ Complete — evidence attached above  ☐ Outstanding — details below

_______________________________________________________________

---

## 5. Sign-Off

| Checklist Item | Result | Evidence Section |
|-----------------|:---:|---|
| Write and test software logic for main functionality | ☐ | [4.1](#41-software-logic-for-main-functionality) |
| Design and test user interface (GUI / HMI) | ☐ | [4.2](#42-user-interface-gui--hmi-design-and-test) |
| Add and verify fault handling logic (comms failure, etc.) | ☐ | [4.3](#43-fault-handling-logic) |
| Add and verify alarm logic (alerts to user) | ☐ | [4.4](#44-alarm-logic-alerts-to-user) |

**Overall Result:** ☐ COMPLETE  ☐ OUTSTANDING ITEMS (details below)

Outstanding item details (if any):

_______________________________________________________________

**Compiled by:** ______________________  **Signature:** ______________________  **Date:** __________

**Reviewed by:** ______________________  **Signature:** ______________________  **Date:** __________

**Approved by:** ______________________  **Signature:** ______________________  **Date:** __________

---

## 6. Revision History

| Issue | Date | Change | Author |
|-------|------|--------|--------|
| 1.0 | 2026-07-07 | First issue | Matrix Technology Solutions Ltd |
| 1.1 | 2026-07-08 | Added IO-Link Diagnostics and Edge Device page evidence to 4.2–4.4. Closed the persistent-alarm-log gap identified during review: added `backend/alarm_logger.py`, `/api/io-link/alarms` + `/api/io-link/alarms/export`, and the Alarm Log panel on the Diagnostics page | Matrix Technology Solutions Ltd |

---

*Software Design & Verification Record — IM4330 Issue 1.1*
*Matrix Technology Solutions Ltd — development@matrixtsl.com*
