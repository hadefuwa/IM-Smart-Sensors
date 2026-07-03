# User Manual
## Maintenance of IO-Link Systems: Smart Sensors
### Model IM4330

**Issue:** 1.0  
**Date:** 2026-06-26  
**Supplier:** Matrix Technology Solutions Ltd — development@matrixtsl.com  
**Curriculum Codes:** CP3723 · CP7395

---

> **Read this manual before operating the system. Follow all safety notices. Retain this document for the life of the equipment.**

---

## Contents

1. [Safety Notices](#1-safety-notices)
2. [Technical Specifications](#2-technical-specifications)
3. [System Overview](#3-system-overview)
4. [Startup Instructions](#4-startup-instructions)
5. [Operating Procedures and System Flow](#5-operating-procedures-and-system-flow)
6. [Software Section](#6-software-section)
7. [HMI and User Interface](#7-hmi-and-user-interface)
8. [Emergency Procedures](#8-emergency-procedures)
9. [Maintenance Instructions](#9-maintenance-instructions)
10. [Critical Spares List](#10-critical-spares-list)

---

## 1. Safety Notices

### 1.1 Electrical Safety

> ⚠️ **WARNING — LOW VOLTAGE SYSTEM**  
> The system operates from a single **24 V DC** supply. The Raspberry Pi receives 5 V via an internal DC-to-DC converter on the panel — there is no separate Pi power supply.  
> **Do not connect any component directly to mains voltage (230 V AC / 110 V AC).** Doing so will cause permanent damage and void the warranty.

> ⚠️ **WARNING — POWER ISOLATION**  
> Always switch off and unplug the power supply before disconnecting or reconnecting any sensor, cable, or module.

- Use only the supplied power adapter. It is CE-marked with overvoltage, undervoltage, and short-circuit protection.
- Do not bypass the internal circuit protection of the 24 V supply.
- Do not modify the wiring without first consulting the system schematic and isolating all power.
- Inspect cables and M12 connectors before each use. Do not use damaged cables.
- Only qualified personnel should open the panel enclosure or service internal wiring.

### 1.2 Mechanical Safety

- The training panel is a bench-top unit. Place it on a stable, level surface before operation.
- Do not place heavy objects on top of the panel or the display stand.
- M18 sensor bodies are metallic and may present sharp edges if mishandled. Handle sensors by the cable, not the body, when reconnecting.
- The Banner CL50 column light is top-heavy when mounted — ensure the mounting bracket is secure before powering on.
- Keep cables clear of the work area edge to prevent the panel being pulled off the bench.

### 1.3 Thermal Safety

- The IFM TV7105 temperature sensor body may become warm during extended operation in high-ambient environments. Allow it to cool before handling.
- Do not cover the Raspberry Pi or block its ventilation slots. Sustained CPU load (~97% under kiosk operation) generates moderate heat.
- The 24 V DC power supply enclosure will be warm during operation — this is normal. Ensure at least 50 mm clearance around all sides.
- Do not operate the system in ambient temperatures above **+50 °C** or below **0 °C**.

### 1.4 Optical Safety

- The Banner CL50 Pro RGB light stack contains high-intensity LEDs. Avoid prolonged direct eye contact at close range, especially at **High** intensity setting.

### 1.5 Simulated Faults — Safe to Use

All training fault scenarios are **software-injected** via IO-Link ISDU writes to the sensor's internal parameter registers. They do not affect electrical safety, do not cause physical damage, and are automatically reversed when the student navigates away from the worksheet. No physical wiring changes are involved.

---

## 2. Technical Specifications

### 2.1 Power Supply

| Rail | Voltage | Max Current | Connector | Purpose |
|------|---------|-------------|-----------|---------|
| System supply | 24 V DC ± 10% | 2 A | IEC C13 inlet → terminal block | AL1350 master + all sensors + Raspberry Pi (via DC-to-DC converter) |

- The Raspberry Pi receives 5 V from an internal DC-to-DC converter on the panel board — powered from the 24 V rail. There is no separate USB-C supply.
- The 24 V rail is SELV (Safety Extra-Low Voltage) per IEC 61140.
- Global plug adapters included: UK (Type G), EU (Type C/E), US (Type A/B).
- Total system power consumption: approximately **25–30 W** under normal kiosk operation.

### 2.2 Component Electrical Ratings

| Component | Supply Voltage | Typical Current | Max Current |
|-----------|---------------|-----------------|-------------|
| IFM AL1350 IO-Link Master | 24 V DC | ~150 mA (idle) | 500 mA |
| Omron E2E-X16MB1T12 (Port 1) | 24 V DC (via AL1350) | ~25 mA | 100 mA |
| Carlo Gavazzi / RS PRO M18 (Port 2) | 24 V DC (via AL1350) | ~30 mA | 100 mA |
| IFM TV7105 (Port 3) | 24 V DC (via AL1350) | ~30 mA | 100 mA |
| Banner CL50 Pro (Port 4) | 24 V DC (via AL1350) | ~50 mA | 200 mA |
| Raspberry Pi 4 (2 GB) | 5 V DC (via panel DC-to-DC from 24 V rail) | ~600 mA (idle) | 3 A |
| WaveShare 1024×600 display | 5 V DC (via Pi GPIO/USB) | ~350 mA | 500 mA |

### 2.3 IP Ratings

| Component | IP Rating | Notes |
|-----------|-----------|-------|
| IFM AL1350 | IP67 | Dust-tight, immersion to 1 m |
| Omron E2E-X16MB1T12 | IP67 | |
| Carlo Gavazzi / RS PRO M18 | IP67 | |
| IFM TV7105 | IP67 | |
| Banner CL50 Pro | IP65 | Dust-tight, jet-proof |
| Raspberry Pi (in stand) | IP0 | Housed — do not expose to moisture |
| WaveShare display (front face) | IP54 | Splash-resistant front; rear unprotected |

### 2.4 Environmental Ratings

| Parameter | Specification |
|-----------|---------------|
| Operating temperature (sensors/master) | −25 °C to +70 °C |
| Operating temperature (Raspberry Pi) | 0 °C to +50 °C |
| Storage temperature | −20 °C to +60 °C |
| Relative humidity | 10–90% RH, non-condensing |
| Altitude | Up to 2000 m |

### 2.5 IO-Link Specifications

| Property | Value |
|----------|-------|
| Standard | IEC 61131-9 |
| Physical layer | 3-wire unshielded M12 cable |
| Max cable length | 20 m per port |
| Communication speeds | COM2 (38.4 kbaud), COM3 (230.4 kbaud) |
| Number of ports | 4 × Class A on AL1350 |
| ISDU access | Acyclic read/write via AL1350 HTTP service call |

---

## 3. System Overview

The IM4330 is a self-contained, bench-top industrial training system built around a live 4-port IO-Link sensor network. All sensor data is real — there is no simulation layer.

### 3.1 System Block Diagram

```
24 V DC Power Supply
       │
       ▼
IFM AL1350 IO-Link Master  ◄──── M12 IO-Link cables (up to 20 m)
  ├── Port 1 ── Omron E2E-X16MB1T12  (Proximity)
  ├── Port 2 ── Carlo Gavazzi M18    (Capacitive)
  ├── Port 3 ── IFM TV7105           (Temperature)
  └── Port 4 ── Banner CL50 Pro      (Light Stack / PDout)
       │
       │ Ethernet (192.168.7.x)
       ▼
  Network Switch
       │
       ▼
Raspberry Pi 4  (IP: 192.168.7.2)
  ├── Mosquitto MQTT Broker      ← receives 500 ms push from AL1350
  ├── FastAPI Backend (port 8000) ← decodes PDin, handles ISDU, WebSocket
  └── nginx reverse proxy (port 80) → serves HMI + /api/ + /ws

       │ HDMI / DSI
       ▼
WaveShare 1024×600 Touchscreen
  └── Chromium kiosk (full-screen HMI dashboard)
```

### 3.2 Data Flow Summary

1. The AL1350 polls all sensor ports every 1–5 ms and publishes a JSON payload to Mosquitto every 500 ms via MQTT.
2. The FastAPI backend subscribes to MQTT, decodes raw PDin hex bytes to engineering values, and broadcasts the result over WebSocket to all connected browsers.
3. The Chromium kiosk subscribes to the WebSocket and updates gauges, charts, and status indicators on every push — no page refresh required.
4. When a student writes a parameter (e.g. a setpoint), the browser sends a REST request to FastAPI, which issues an ISDU write via the AL1350's HTTP service call to the sensor.
5. If MQTT is unavailable, the backend falls back to HTTP polling at 1 Hz per connected port automatically.

### 3.3 Network Addressing

| Device | IP Address | Hostname |
|--------|-----------|----------|
| IFM AL1350 IO-Link Master | 192.168.7.4 | — |
| Raspberry Pi | 192.168.7.2 | iolink.local |
| HMI Dashboard | http://192.168.7.2 or http://iolink.local | — |
| FastAPI backend | http://192.168.7.2/api/ | — |
| WebSocket | ws://192.168.7.2/ws | — |

---

## 4. Startup Instructions

### 4.1 Pre-Start Checks

Before powering on, verify the following:

- [ ] Training panel is on a stable, level bench surface
- [ ] All M12 IO-Link cables are fully seated and finger-tight at both sensor and master ends
- [ ] Ethernet patch cable connects the AL1350 to the network switch
- [ ] Ethernet patch cable connects the Raspberry Pi to the network switch
- [ ] 24 V DC power supply cable is connected to the panel terminal block
- [ ] WaveShare display cable is connected to the Raspberry Pi
- [ ] No cables are draped over the bench edge or pinched under the panel

### 4.2 Power-On Sequence

Follow this order to ensure clean startup:

1. **Plug in the 24 V DC supply** — the AL1350 will illuminate its status LEDs and the Raspberry Pi will begin booting simultaneously. The display will show the Matrix boot screen.
3. **Wait approximately 45–60 seconds** for the Pi to complete boot and the Chromium kiosk to launch.
4. The HMI dashboard will appear on the touchscreen. The WebSocket status indicator (top bar) will show **Connected** once the backend has established the MQTT subscription.
5. Within 2–3 seconds of the WebSocket connecting, live sensor data will begin appearing on the Home page gauges and charts.

> **Note:** If the WebSocket shows **Disconnected** after 60 seconds, see [Section 8.3 — WebSocket Fault Recovery](#83-websocket-fault-recovery).

### 4.3 Verifying Correct Operation

Once the HMI is live, confirm the following:

| Check | Expected Result |
|-------|----------------|
| Home page temperature gauge | Shows ambient room temperature (typically 18–28 °C) |
| Proximity sensor indicator | Shows **NO OBJECT** with monitor output value ~80 in free air |
| Capacitive sensor indicator | Shows **NO OBJECT** with no target present |
| Light stack | Banner CL50 shows steady green |
| IO-Link Master page | All four ports show correct device names and **IO-Link** mode |
| WebSocket status bar | Shows **Connected** and a timestamp updating every 500 ms |

---

## 5. Operating Procedures and System Flow

### 5.1 Normal Operation Flow

```
Power on → Boot (45–60 s) → HMI loads → WebSocket connects
    → Live sensor data appears → Navigate to worksheet
    → Complete tasks / interact with sensors
    → Navigate away → Fault scenarios auto-restore
    → Power off when done
```

### 5.2 Navigating the System

- Use the **sidebar** (left panel) to navigate between pages. On the kiosk, tap the ☰ icon to open the drawer sidebar.
- The sidebar sections are: **Home** (live HMI) · **IO-Link Master** · **Learn** (CP0001 theory) · **Worksheets** (CP3723 hands-on) · **CP7395** (engineering modules) · **Progress** · **Edge Device** · **Settings** · **Admin / Diagnostics**.

### 5.3 Conducting a Worksheet Session

1. Navigate to **Worksheets** (CP3723) or **CP7395** from the sidebar.
2. Select a worksheet from the index. The worksheet will load with its theory content, live data panels, and task sections.
3. Work through the worksheet top to bottom. Live sensor panels update automatically every 500 ms.
4. For ISDU tasks, use the read/write controls within the worksheet. Confirm each action by observing the live value update.
5. MCQ questions appear at the end of each worksheet. Select an answer and submit.
6. Navigate to the next worksheet using the arrow buttons at the top or bottom of the page, or return to the index.
7. The **Progress** page shows which worksheets have been completed in the current session.

### 5.4 Fault Scenario Procedure

1. Open the relevant worksheet (e.g. WS4 for proximity, WS6 for temperature calibration).
2. Scroll to the **Scenario** section and click **Start Scenario**.
3. The system writes a live misconfiguration to the sensor via ISDU. Observe the change on the live data panel.
4. Follow the guided steps: observe the anomaly → diagnose via ISDU read → write the fix → verify.
5. On completion, the sensor is confirmed restored. A sign-off checklist appears.
6. **If navigating away before completing the fix**, the system auto-restores the sensor automatically. No manual intervention is required.

### 5.5 CL50 Light Stack Control

1. On the **Home** page, locate the Port 4 card (Light Stack).
2. Use the quick-colour buttons for instant colour changes, or click **Configure** to open the full control modal.
3. In the modal: select Colour 1, Animation, Speed, and Intensity. The hex preview updates live.
4. Click **Write** to send the PDout command to the CL50. The light will change within 500 ms.
5. To start an intensity sweep (breathing effect), select **Intensity Sweep** from the Animation dropdown and click **Write**.

### 5.6 Power-Off Procedure

1. Ensure no fault scenarios are in progress (navigate away from any active worksheet scenario first — this triggers auto-restore).
2. On the Pi, the kiosk runs in a locked-down mode. A normal shutdown is not required for training use — simply removing power is safe. For a clean shutdown, SSH in and run `sudo shutdown -h now`.
3. Unplug the **24 V DC supply** — this removes power from all components simultaneously.
4. Disconnect M12 sensor cables if storing the kit.
5. Coil cables loosely and store in the supplied box.

---

## 6. Software Section

### 6.1 Software Components

| Component | Technology | Location on Pi |
|-----------|-----------|----------------|
| HMI Frontend | Vite + Vanilla JS + Tailwind CSS + Chart.js | `/var/www/im-sensors/` |
| Backend API | Python FastAPI + uvicorn | `/home/hamed/IM-Smart-Sensors/backend/` |
| MQTT Broker | Mosquitto | System service — `mosquitto.service` |
| Reverse Proxy | nginx | System service — `nginx.service` |
| Backend Service | systemd | `im-sensors-backend.service` |
| Kiosk | Chromium on Openbox/X11 | `/home/pi/kiosk.sh` |

### 6.2 Backend Service Management

SSH into the Pi (credentials in `docs/manuals/PI_SSH.md`) and use the following commands:

```bash
# Check backend status
sudo systemctl status im-sensors-backend.service

# Restart backend
sudo systemctl restart im-sensors-backend.service

# Check MQTT broker
sudo systemctl status mosquitto

# Restart MQTT broker
sudo systemctl restart mosquitto

# Check nginx
sudo systemctl status nginx
```

### 6.3 Restarting the Kiosk

If the Chromium kiosk freezes or needs to be refreshed after a software update:

```bash
# SSH into the Pi then run:
nohup sudo -u pi DISPLAY=:0 XAUTHORITY=/home/pi/.Xauthority bash /home/pi/kiosk.sh </dev/null >/tmp/kiosk.log 2>&1 &
```

The script kills any existing Chromium instance before relaunching. The display will go blank for 2–3 seconds then reload.

### 6.4 Backend Configuration

The file `/home/hamed/IM-Smart-Sensors/backend/config.json` controls runtime behaviour:

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
  }
}
```

- To change the AL1350 IP address, edit `master_ip` and restart the backend service.
- To adjust poll rate, edit `poll_interval_sec` (minimum 0.5 s recommended).
- Changes take effect after a backend restart.

### 6.5 Software Update Procedure

1. Build the updated frontend on a development machine: `npm run build`
2. Copy the built files to the Pi via SCP (see `docs/manuals/PI_SSH.md` for full commands).
3. SSH into the Pi and restart the backend service.
4. Restart the Chromium kiosk to load the new frontend.

### 6.6 Accessing the API Documentation

With the backend running, open a browser on the local network and navigate to:

```
http://iolink.local/docs
```

This opens the FastAPI automatic documentation (Swagger UI) where all REST endpoints can be browsed and tested interactively.

### 6.7 Viewing Backend Logs

```bash
# Live log stream
sudo journalctl -u im-sensors-backend.service -f

# Last 100 lines
sudo journalctl -u im-sensors-backend.service -n 100
```

---

## 7. HMI and User Interface

### 7.1 Screen Layout

```
┌─────────────────────────────────────────────────────┐
│  [☰]  IM Smart Sensors              [●] Connected   │  ← Top bar
├──────┬──────────────────────────────────────────────┤
│      │                                              │
│  S   │           MAIN CONTENT AREA                 │
│  I   │    (page-specific: gauges, charts,           │
│  D   │     worksheets, parameter cards)             │
│  E   │                                              │
│  B   │                                              │
│  A   │                                              │
│  R   │                                              │
└──────┴──────────────────────────────────────────────┘
```

- **Top bar:** hamburger menu (kiosk), app name, WebSocket connection status dot (green = connected, red = disconnected), and theme icon.
- **Sidebar:** navigation links grouped by section. On the 1024×600 kiosk, tap ☰ to open as a drawer overlay.
- **Main content area:** swaps on navigation without page reload.

### 7.2 Pages and Their Purpose

| Page | Sidebar Label | Purpose |
|------|--------------|---------|
| Home | Home | Live HMI — gauges, charts, per-sensor IODD parameter cards, CL50 control |
| IO-Link Master | IO-Link Master | Port cards, connection KPIs, supervision charts, device parameter panels |
| Learn | Learn (CP0001) | 8 theory chapters — sensor fundamentals through device identity |
| Worksheets | Worksheets | CP3723 — 9 interactive hands-on worksheets |
| CP7395 | CP7395 | 11 engineering-level worksheets |
| Progress | Progress | Session progress rings + JSON export |
| Edge Device | Edge Device | Pi CPU/memory charts, service status, Chromium health |
| Settings | Settings | Theme selector, IO-Link connection config, global display zoom |
| Admin / Diagnostics | Admin | IO-Link latency graph, circuit-breaker state, log viewer |

### 7.3 Live Sensor Indicators

**Proximity LED (Omron E2E — Port 1)**
- Large LED indicator: grey = no object, green = object detected.
- Secondary indicators for Instability Alarm and Over-Approach Alarm.
- Monitor output amplitude (0–255) shown as a numeric value.

**Capacitive Indicator (RS PRO M18 — Port 2)**
- Vertical bar showing raw process value (0–4095).
- Turns red when SSC1 output is active (object detected).
- Detection counter (cumulative ISDU read) shown below the bar.

**Temperature Gauge (TV7105 — Port 3)**
- Circular arc gauge showing temperature in °C.
- Colour changes from green → amber → red as temperature approaches SP1.
- SP1 and RP1 markers shown on the gauge arc.

**Light Stack Mimic (CL50 Pro — Port 4)**
- On-screen representation of the CL50 current colour and animation state.
- Updates within 500 ms of any PDout write.

### 7.4 WebSocket Status Indicator

The coloured dot in the top bar shows real-time connection health:

| Colour | Meaning |
|--------|---------|
| Green | WebSocket connected; live data flowing |
| Amber | WebSocket reconnecting (transient drop) |
| Red | WebSocket disconnected; displaying last cached values |

If the dot stays red for more than 30 seconds, see [Section 8.3](#83-websocket-fault-recovery).

### 7.5 Changing the Theme

1. Go to **Settings** in the sidebar.
2. Under **Theme**, select from the available options (Light, Dark, Industrial, etc.).
3. The theme applies immediately and persists across sessions.

### 7.6 Adjusting Display Zoom (Kiosk Only)

1. Go to **Settings**.
2. Under **Display Zoom**, drag the slider (50–150%).
3. The page rescales immediately. Use this if text appears too small or the layout overflows on the 1024×600 screen.

---

## 8. Emergency Procedures

### 8.1 Emergency Power Isolation

There is no physical E-stop button on the IM4330 training system (it is a low-voltage educational kit with no mechanical actuators). In the event of an emergency:

1. **Immediately unplug the 24 V DC power supply** from the wall socket. This removes power from all components simultaneously (AL1350, sensors, and Raspberry Pi via the panel DC-to-DC converter).
2. Do not attempt to reconnect until the cause of the emergency has been identified and resolved.

> ⚠️ If any component is producing smoke, unusual heat, or a burning smell — isolate power immediately, clear the area, and do not reconnect until a qualified engineer has inspected the equipment.

### 8.2 Sensor Fault Recovery

If a sensor is displaying unexpected behaviour (permanently triggered, wrong values, or not responding):

1. Check the **Admin / Diagnostics** page — the circuit-breaker state and log will show recent errors.
2. Check the **IO-Link Master** page — confirm the affected port shows **IO-Link** mode and the correct device name.
3. If a worksheet fault scenario was in progress, navigate away from the worksheet. The auto-restore mechanism will write the correct parameters back to the sensor.
4. If the sensor still behaves incorrectly after auto-restore, use the ISDU parameter card on the **Home** page to manually read the affected parameter (e.g. output logic index 61 for the proximity sensor) and write the correct value.
5. If the sensor does not appear on the IO-Link Master page at all, check the M12 cable connection at both the sensor and the AL1350.

**Proximity sensor stuck ON (most common fault after scenario):**
- Navigate to the Home page → Port 1 parameter card → Read index 61, subindex 1.
- If value = 1 (NC), write value 0 (NO) to restore normal operation.

**Temperature sensor reading too high (calibration offset not restored):**
- Navigate to the Home page → Port 3 parameter card → Read index 681, subindex 0.
- If value ≠ 0.0, write 0.0 to clear the calibration offset.

### 8.3 WebSocket Fault Recovery

If the HMI shows a red **Disconnected** status for more than 30 seconds:

1. **Wait 60 seconds.** The WebSocket client reconnects automatically with exponential back-off. Most drops recover without intervention.
2. If still disconnected, SSH into the Pi and check the backend service:
   ```bash
   sudo systemctl status im-sensors-backend.service
   ```
3. If the service is inactive or failed, restart it:
   ```bash
   sudo systemctl restart im-sensors-backend.service
   ```
4. If the backend is running but WebSocket still fails, restart the kiosk:
   ```bash
   nohup sudo -u pi DISPLAY=:0 XAUTHORITY=/home/pi/.Xauthority bash /home/pi/kiosk.sh </dev/null >/tmp/kiosk.log 2>&1 &
   ```
5. If the issue persists, check MQTT broker status:
   ```bash
   sudo systemctl status mosquitto
   sudo systemctl restart mosquitto
   ```

### 8.4 AL1350 Master Not Responding

If the IO-Link Master page shows no data and the backend log shows repeated connection errors:

1. Check the Ethernet cable from the AL1350 to the network switch — reseat both ends.
2. Ping the master from the Pi:
   ```bash
   ping 192.168.7.4
   ```
3. If no ping response, power-cycle the AL1350 by unplugging the 24 V supply for 10 seconds and reconnecting.
4. After power-cycle, the backend will automatically re-register the MQTT subscription within 15 seconds of the master coming online.
5. If ping is successful but data is still not flowing, restart the backend service (see above).

### 8.5 Circuit Breaker Open

The backend circuit-breaker opens after 5 consecutive communication failures with the AL1350. When open, the HMI will show stale data and the **Admin** page will show **Circuit State: OPEN**.

- The circuit-breaker **recovers automatically** after a 15-second timeout — no manual action required.
- If the breaker keeps reopening, check the Ethernet connection and the AL1350 status LEDs.

### 8.6 Complete System Reset

If the system is in an unknown state and all other recovery steps have failed:

1. Unplug the 24 V DC power supply.
2. Wait 30 seconds.
3. Reconnect the 24 V supply.
4. Allow 60 seconds for full boot.
5. The system will return to default state — all sensors will be polled fresh, MQTT subscription re-registered, and the HMI will reconnect automatically.

---

## 9. Maintenance Instructions

### 9.1 Maintenance Schedule

| Interval | Task |
|----------|------|
| Before each use | Visual inspection — cables, connectors, panel mounting, display |
| After each use | Return all sensors to default state (navigate away from any active scenario) |
| Weekly (active use) | Wipe sensor faces with a dry lint-free cloth; check M12 cable locks |
| Monthly | Inspect all M12 cable jackets for abrasion or kinking; check power supply cables |
| Termly (or 3 months) | Verify all four IO-Link devices appear on the IO-Link Master page; run each worksheet scenario start-to-finish to confirm auto-restore |
| Annually | Full system test against acceptance criteria (Section 4.3); check Raspberry Pi SD card health; update software if a release is available |

### 9.2 Sensor Face Cleaning

- Wipe sensor faces (the flat or domed front surface) with a **dry, lint-free cloth**.
- For stubborn deposits, use a cloth lightly dampened with isopropyl alcohol (IPA ≥70%). Do not apply liquid directly to the sensor body.
- Do not use abrasive materials or solvents that attack PBT plastic.
- The Omron E2E inductive sensor is sensitive to metallic contamination on its face — keep metal swarf clear.

### 9.3 M12 Cable Inspection

- Inspect the PUR jacket along the full cable length for cuts, kinking, or flattening.
- Check the M12 connector locking ring at both ends — it should rotate freely and click to the locked position.
- If a cable shows damage, replace it before the next use. Do not use tape as a repair.

### 9.4 Raspberry Pi SD Card Health

The Pi boots from a microSD card. Check health annually or if the Pi fails to boot:

```bash
# SSH into the Pi, then:
sudo dmesg | grep -i "mmcblk\|sd card\|error"
df -h /
```

If the root partition shows >80% usage or dmesg shows I/O errors, replace the SD card using the image backup held by your institution or Matrix TSL.

### 9.5 Software Updates

Check for software updates at the start of each academic year:

1. Visit the Matrix Learning Centre for the latest firmware/software package.
2. Follow the update procedure in [Section 6.5](#65-software-update-procedure).
3. After updating, run the acceptance checks in [Section 4.3](#43-verifying-correct-operation) to confirm correct operation.

### 9.6 Restoring Sensor Default Parameters

If a sensor has been misconfigured outside of a guided worksheet scenario and does not auto-restore, use these reference defaults:

| Sensor | Parameter | Index | Subindex | Default Value |
|--------|-----------|-------|----------|---------------|
| Omron E2E (Port 1) | Output logic OUT1 | 61 | 1 | 0 (NO — normal open) |
| IFM TV7105 (Port 3) | Calibration offset | 681 | 0 | 0.0 °C |
| IFM TV7105 (Port 3) | SP1 | 583 | 0 | 60.0 °C |
| IFM TV7105 (Port 3) | RP1 | 584 | 0 | 55.0 °C |
| IFM TV7105 (Port 3) | SP2 | 593 | 0 | 65.0 °C |
| IFM TV7105 (Port 3) | RP2 | 594 | 0 | 60.0 °C |

Write these values using the ISDU parameter card on the **Home** page or via the worksheet ISDU controls.

---

## 10. Critical Spares List

The following items are recommended to be held as critical spares for uninterrupted training delivery. Part numbers are for reference — consult your supplier for current availability.

### 10.1 Consumables and Wear Items

| Item | Quantity Recommended | Notes |
|------|---------------------|-------|
| M12 5-pin IO-Link cable, 2 m | 2 | One per sensor type; replace if jacket damaged |
| Raspberry Pi microSD card (32 GB, Class 10 / A1) | 1 | Pre-imaged backup of the Pi system |
| DC-to-DC converter module (24 V → 5 V, ≥3 A) | 1 | Panel board Pi power converter — replace if Pi fails to power on when 24 V supply is good |

### 10.2 Sensor Spares

| Item | Part / Model | Quantity | Notes |
|------|-------------|----------|-------|
| Proximity sensor | Omron E2E-X16MB1T12 | 1 | Standard M18 inductive IO-Link |
| Capacitive sensor | Carlo Gavazzi CA18FAF08BP (RS PRO equivalent) | 1 | M18 capacitive IO-Link |
| Temperature sensor | IFM TV7105 | 1 | PT100 IO-Link — high value; replace only on failure |
| Light stack | Banner CL50 Pro (CL50PKQ or equivalent) | 1 | PDout RGB IO-Link; check firmware version on replacement |

### 10.3 Infrastructure Spares

| Item | Quantity | Notes |
|------|----------|-------|
| Ethernet patch cable, Cat5e 1 m | 2 | Master-to-switch and Pi-to-switch |
| Unmanaged 4-port Ethernet switch | 1 | Replace if port fails |
| 24 V DC DIN-rail PSU, 2 A minimum | 1 | Replace if supply fails; confirm voltage before connecting |

### 10.4 Documentation and Software

| Item | Location | Notes |
|------|----------|-------|
| System software image (Pi SD card backup) | Institution server or Matrix TSL | Restore to new SD card if original fails |
| This user manual | `docs/manuals/User Manual/user-manual.md` in project repo | Keep a printed copy in the kit storage box |
| PI_SSH.md (credentials and network reference) | `docs/manuals/PI_SSH.md` in project repo | Do not leave accessible to students |
| Sensor datasheets | `docs/datasheets/` folder in project repo | TV7105.pdf, E2E IODD zip, etc. |

---

*End of User Manual — IM4330 Issue 1.0*

*Matrix Technology Solutions Ltd — development@matrixtsl.com*
