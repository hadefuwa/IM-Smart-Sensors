# CP7395 — Industry 4.0 IO-Link
### Student Curriculum | IM4330 Training Kit

---

## Course Overview

| | |
|---|---|
| **Course Code** | CP7395 |
| **Title** | Industry 4.0 IO-Link |
| **Level** | Level 3 |
| **Total Time** | 10–12 hours |
| **Worksheets** | 11 |
| **Prerequisites** | CP3723 recommended — Worksheets 1–3 may run in parallel |

### What You Will Learn

By the end of this course you will be able to:

- Describe the full hardware and software architecture of an Industry 4.0 sensor system
- Trace the data path from IO-Link sensor through MQTT edge gateway to a browser-based HMI
- Decode raw IO-Link process data (PDin) hex values into engineering units using data types and scale factors
- Classify IO-Link data as process, service, or event and explain where each type is routed
- Quantify the maintenance MTTR reduction from IO-Link and calculate the financial saving
- Map IO-Link data into PLC architectures and identify the equivalent layers in this app
- Identify any connected sensor from its Vendor ID and Device ID without physical inspection
- Decode and encode the Banner CL50 Pro 3-byte PDout command word from first principles
- Explain the PT100 resistance curve and decode temperature sensor PDin including negative values
- Apply calibration offset engineering to correct sensor drift via ISDU

### System Overview

```
Sensors (Ports 1–4)          IO-Link Master         Edge Device         HMI Screen
─────────────────────        ──────────────         ───────────         ──────────
Proximity (Port 1)  ─M12──►  IFM AL1350     ─Eth──► Raspberry Pi ─HDMI──► Dashboard
Capacitive (Port 2) ─M12──►  (192.168.7.4)   MQTT   (192.168.7.2)       (This screen)
Temperature (Port 3)─M12──►                  HTTP◄──
Light Stack (Port 4)─M12──►
```

**Data flows left to right (primary path):** the AL1350 publishes sensor process data to Mosquitto via MQTT every 500 ms. The Raspberry Pi subscribes, decodes the PDin payloads, and pushes the result to connected browsers via WebSocket. HTTP polling runs in parallel for ISDU reads, device-tree information, and as a fallback.

**Data flows right to left (ISDU):** the browser sends parameter read/write requests through the FastAPI backend to the AL1350 HTTP service endpoint. ISDU commands travel from browser → WebSocket → FastAPI → HTTP → AL1350 → sensor.

### Equipment on the Bench

| Port | Device | Model | Technical Notes |
|------|--------|-------|-----------------|
| 1 | Proximity Sensor | Omron E2E-X16MB1T12 | IO-Link V1.1 COM3 (230.4 kbps). PDin: 2 bytes. Bit 0 = OUT1; bit 4 = instability alarm; bit 5 = over-approach alarm. Full ISDU access. |
| 2 | Capacitive Sensor | RS Pro / Carlo Gavazzi M18 | IO-Link 1.1. PDin: bit 0 = output state; detection count in extended bytes. ISDU writable: SP1 (threshold), teach commands. |
| 3 | Temperature Sensor | IFM TV7105 | IO-Link 1.1. PDin: 4 bytes. Bytes 0–1 = signed int16 × 0.1 = °C. Bytes 2–3 = SP1/SP2 flags. ±0.1 °C resolution. |
| 4 | Light Stack | Banner CL50 Pro | PDout-only. 3-byte command word controls colour, animation, intensity, and speed. No PDin. Write via AL1350 pdout/setdata service call. |
| — | IO-Link Master | IFM AL1350 | 8 IO-Link/digital ports. IP: 192.168.7.4. Publishes MQTT every 500 ms; responds to HTTP service calls (ISDU). |
| — | Edge Device | Raspberry Pi 4 | FastAPI + uvicorn on 127.0.0.1:8000. Mosquitto MQTT broker. eth0: 192.168.7.2 (IO-Link subnet). wlan0: building LAN (DHCP). Bridges the two isolated networks. |

### Network Topology

```
AL1350  192.168.7.4  ──────────────────────────────────────────
  │  IO-Link subnet: 192.168.7.x                               │
  ├─ MQTT publish → port 1883 → Mosquitto on Pi (every 500 ms) │
  └─ HTTP ← Pi polls for ISDU, device tree, supervision        │
                                                               │
Raspberry Pi  192.168.7.2 (eth0) / DHCP (wlan0)               │
  │  Runs: FastAPI · uvicorn · Mosquitto · decoder.py           │
  └─ WebSocket /ws → browser (this app) — pushes JSON every tick│
                                                               │
Browser (this screen)                                          │
  Receives merged MQTT + HTTP data as JSON over WebSocket ──────
```

---

## WS1 — Your System: A Technical Brief

**Estimated time:** 45 minutes | **Dashboard:** Edge Device page, Admin / Connection Diagnostics

### Why This Matters

Every engineering project starts with a system brief. Before writing code or interpreting data you need to know what hardware is on the bench, how it is networked, and what each component's role is in the overall architecture. This worksheet walks through the complete hardware inventory, confirms everything is live, and tests your technical understanding of the system.

### Learning Objectives

- Identify all components in the IM4330 kit by name, IP address, and technical role
- Describe the network topology — IO-Link subnet, edge gateway, building LAN
- Confirm system health using the Connection Diagnostics and Edge Device pages
- Understand how MQTT publish interval relates to WebSocket message rate

### Background — Communication Paths

| Protocol | Direction | Rate | What it carries |
|----------|-----------|------|----------------|
| IO-Link | Sensor → AL1350 | Per port (every scan cycle) | PDin process data + ISDU acyclic data |
| MQTT | AL1350 → Pi | Every 500 ms | PDin from all ports + supervision data |
| HTTP | Pi → AL1350 | On demand | ISDU reads/writes, device tree, supervision |
| WebSocket | Pi → Browser | Every MQTT tick | Merged sensor data as JSON |

### Task 1 — Hardware Checklist

Locate each component on the bench. Tick it when you can match it to the screen and confirm its IP address or function.

- [ ] **IO-Link Master (IFM AL1350)** — the orange box with numbered M12 ports. IP address: **192.168.7.4**. All sensors connect here. Publishes MQTT every 500 ms and responds to HTTP service calls for ISDU reads and writes.
- [ ] **Port 1 — Omron E2E-X16MB1T12** — M18 inductive proximity. IO-Link V1.1 COM3 (230.4 kbps). Full ISDU access. Output logic, timer mode, and diagnosis mode are all configurable remotely.
- [ ] **Port 2 — Capacitive Sensor** — M18 cylinder. IO-Link 1.1. Detects material by dielectric field change. SP1 threshold and teach commands are writable via ISDU.
- [ ] **Port 3 — IFM TV7105** — IO-Link temperature sensor, ±0.1 °C. PDin bytes 0–1 = signed int16 (raw ÷ 10 = °C). Two independent switching outputs (SP1, SP2) with configurable setpoints.
- [ ] **Port 4 — Banner CL50 Pro** — multi-colour status light stack. PDout-only — receives commands, sends no measurements. A 3-byte command controls every aspect of the display.
- [ ] **Edge Gateway (Raspberry Pi 4)** — runs FastAPI + uvicorn + Mosquitto. eth0: 192.168.7.2 on the IO-Link subnet; wlan0 on the building LAN. Bridges the two isolated networks — the classic edge gateway pattern.
- [ ] **This dashboard** — a Vite SPA receiving WebSocket JSON from the Pi's FastAPI backend. Decodes MQTT PDin into live charts. Never communicates directly with the AL1350.

### Task 2 — System Health Check

Open the **Connection Diagnostics** page and the **Edge Device** page. Confirm all four items:

- [ ] The circuit breaker on Connection Diagnostics is **closed** (healthy)
- [ ] The latency graph on Connection Diagnostics is showing live readings (not flat-lined)
- [ ] The backend service is shown as **active** on the Edge Device page
- [ ] The WebSocket message counter is incrementing at approximately **2 messages per second**

### Knowledge Check

**Q1.** What is the IP address of the IFM AL1350 IO-Link Master?

- A: 192.168.7.4
- B: 192.168.7.2
- C: 192.168.1.1

**Q2.** The AL1350 pushes data to Mosquitto every 500 ms. Approximately how many WebSocket messages should arrive at the browser each second?

- A: 20 messages per second
- B: 2 messages per second — 500 ms is the period, so 1000 ÷ 500 = 2 per second
- C: 500 messages per second — 500 ms equals 500 per second

**Q3.** The Raspberry Pi has two network interfaces (eth0 and wlan0). Why does this matter for the system architecture?

- A: It allows two IO-Link masters to be connected simultaneously
- B: It doubles bandwidth by bonding eth0 and wlan0 together for MQTT traffic
- C: It bridges the isolated IO-Link subnet (192.168.7.x) to the building LAN — the Pi is the edge gateway

**Q4.** According to the hardware table, how many IO-Link ports have a sensor connected in this system?

- A: 4 — Ports 1 through 4 each have a device connected
- B: 8 — every port on the AL1350 is populated
- C: 2 — only the proximity and capacitive sensors

---

## WS2 — How This App Works

**Estimated time:** 60 minutes | **Dashboard:** Edge Device page, Admin / Connection Diagnostics

### Why This Matters

Understanding the full data path — from IO-Link sensor through the edge device to your browser — is the foundation of any Industry 4.0 integration. The same architecture pattern (sensor → MQTT broker → edge gateway → WebSocket → HMI) is used in industrial IoT platforms at scale, from individual machine cells to cloud-connected factories.

### Learning Objectives

- Explain why MQTT is preferred over HTTP polling for 500 ms sensor data
- Describe the Pi's role as an edge gateway bridging two isolated networks
- Trace the data path: AL1350 → Mosquitto → FastAPI → decoder.py → WebSocket → browser
- Understand how the backend handles AL1350 power cycles and maintains subscription

### Background — Two Communication Protocols, One Architecture

**Why MQTT (primary)?**
The AL1350 publishes sensor data every 500 ms without being asked. Mosquitto, the MQTT broker on the Pi, receives this push and the FastAPI backend subscribes to it. This is low-latency and efficient — no polling overhead, no request–response cycle. MQTT uses a pub/sub model: the AL1350 publishes to a topic, and any subscriber (the Pi, future SCADA systems) receives it.

**Why HTTP (fallback + extras)?**
HTTP polling runs in parallel for data MQTT doesn't carry: ISDU parameter reads/writes, the device tree (/gettree, cached for 5 minutes), and as a fallback if MQTT is unavailable. The backend implements a circuit breaker: if 5 consecutive HTTP requests fail, it pauses for 15 seconds before retrying.

**Why does the backend re-subscribe on every startup?**
The AL1350 loses its MQTT subscriptions when it power-cycles. The backend calls `ensure_mqtt_subscription()` on every startup to re-register the push subscription automatically — a maintenance technician who power-cycles the AL1350 does not need to restart the Pi.

**The edge gateway pattern:**
The AL1350 lives on a private 192.168.7.x subnet isolated from the main LAN. The Pi bridges the two — eth0 on the IO-Link subnet, wlan0 on the building network. The browser never talks directly to the AL1350; it only talks to the Pi's FastAPI backend. The Pi is the edge gateway.

### Task 1 — Trace the Data Path

Using the app, trace each step of the data path and confirm it is live:

1. **AL1350 → Mosquitto (MQTT, 500 ms):** confirm the WS message counter on WS1 is incrementing at ~2 per second. This is MQTT-sourced data flowing through the Pi to your browser.
2. **FastAPI backend:** open the **Edge Device** page. Confirm both `im-sensors-backend` and `mosquitto` are shown as active services.
3. **Circuit breaker (HTTP path):** open **Connection Diagnostics**. Confirm the circuit breaker is closed (green) and the latency graph is live. This is the HTTP fallback path being measured.
4. **WebSocket:** the round-trip latency on Connection Diagnostics should be below 200 ms under normal conditions. Consistently higher values indicate AL1350 load or IO-Link subnet congestion.

### Task 2 — Live Verification Checklist

- [ ] The WebSocket message counter is incrementing at approximately 2 messages per second
- [ ] **Mosquitto** is shown as active on the Edge Device page
- [ ] The circuit breaker on Connection Diagnostics is **closed** (green)
- [ ] Round-trip latency is below **200 ms** on the Connection Diagnostics latency graph

### Knowledge Check

**Q1.** Why is MQTT better suited than HTTP polling for delivering sensor data every 500 ms?

- A: MQTT uses publish/subscribe — the AL1350 pushes data the moment it is ready, without the Pi having to request each cycle
- B: HTTP is push-based and uses persistent connections; MQTT requires a new TCP request each cycle
- C: MQTT guarantees delivery of every message in all network conditions by queuing until the subscriber acknowledges

**Q2.** The AL1350 loses its MQTT subscriptions when it power-cycles. How does the backend handle this?

- A: It waits for the user to manually re-subscribe via the Settings page
- B: It switches permanently to HTTP polling after any AL1350 restart
- C: It calls `ensure_mqtt_subscription()` on every backend startup, re-registering the push subscription automatically

**Q3.** If the FastAPI backend service on the Pi crashed, what would you expect to observe?

- A: Live data would stop and the WebSocket would disconnect — the browser shows "OFFLINE"
- B: The WebSocket message counter would continue to increment at the normal rate
- C: The AL1350 would automatically restart the backend service via its own built-in watchdog

**Q4.** What does a consistently high round-trip latency value on the Connection Diagnostics page indicate?

- A: The browser's chart rendering pipeline cannot keep up with the WebSocket update rate
- B: The AL1350 is under load or there is congestion on the IO-Link subnet
- C: The Pi's Wi-Fi interface is saturated by other traffic on the building network

---

## WS3 — How Each Sensor Works (Protocol Level)

**Estimated time:** 75 minutes | **Dashboard:** Dashboard — Active Port Details (Raw PDin)

### Why This Matters

Every IO-Link sensor sends a raw binary process data (PDin) payload. The master delivers it as a hex string; the backend's `decoder.py` parses each device type differently based on its IODD specification. Understanding this decode layer is essential for integrating sensors into PLCs, historians, and digital twin platforms — and for fault-finding when a raw value looks wrong.

### Learning Objectives

- Describe the PDin decode pipeline: raw hex → decoder.py → engineering value
- Identify the bit fields in the proximity sensor PDin (OUT1, instability alarm, over-approach alarm)
- Explain what the capacitive detection count represents and why it is useful
- Decode a temperature sensor PDin hex value using int16 and scale 0.1
- Explain why CL50 PDout requires more care to build than a simple PDin decode

### Background — PDin Decode Pipeline

Each device sends its process data as a byte string. The backend reads each byte or bit according to the sensor's IODD file:

**Port 1 — Proximity Sensor (Omron E2E-X16MB1T12)**

PDin is 2 bytes (16 bits). The critical fields are in byte 0:

| Bit | Field | Meaning |
|-----|-------|---------|
| Bit 0 | OUT1 (switching output) | 1 = object detected, 0 = no object |
| Bit 4 | Instability Alarm | 1 = target near edge of sensing range |
| Bit 5 | Over-Approach Alarm | 1 = target too close to sensor face |
| Byte 1 | Monitor output | Oscillation amplitude uint8 (~80 in free air) |

**Port 2 — Capacitive Sensor**

PDin carries the switching output (bit 0) and optionally a detection count in the extended bytes. The backend accumulates a session counter displayed on the Dashboard. A count is incremented on each rising edge (OFF→ON transition).

**Port 3 — Temperature Sensor (IFM TV7105)**

PDin is 4 bytes. Bytes 0–1 carry the temperature as a signed 16-bit integer (int16) with a scale factor of ×0.1:

```
raw = 0x00F5  →  245  →  245 ÷ 10  =  24.5 °C
```

Bytes 2–3 carry the SP1 and SP2 switching output states and alarm flags.

**Port 4 — CL50 Light Stack (PDout-only)**

The CL50 receives commands rather than sending sensor data. A 3-byte PDout payload controls colour, animation, intensity, and speed, with each field packed into specific bit positions. One incorrect bit changes the entire visual output. This is covered in detail in WS11.

### Task — Live PDin Observation

Open the **Dashboard** and expand the Active Port Details for each sensor. For each one:

1. Note the current raw PDin hex value for Port 3 (temperature sensor) and manually calculate the temperature: extract bytes 0–1, interpret as int16, divide by 10
2. Hold a **metal object** (screwdriver or spanner) near Port 1 (proximity sensor) and confirm the switching state (OUT1) changes on the Dashboard. Note: proximity sensors only detect metal — your hand will not trigger it
3. Trigger the Port 2 (capacitive sensor) by bringing your hand close — confirm the detection count increments
4. Identify the current CL50 colour state from the Dashboard and match it to what you can see on the light stack

### Knowledge Check

**Q1.** If the Omron E2E proximity sensor returns raw PDin hex `0x01`, what is the switching output state?

- A: Object detected — bit 0 is set to 1
- B: No object detected — the sensor is clear
- C: Sensor fault — 0x01 indicates an internal error code

**Q2.** Why is a detection count more useful than just the current switching state for a capacitive level sensor on a filling line?

- A: It gives a continuous analogue level reading rather than a binary on/off output
- B: It prevents false positives caused by water or foam near the sensor face
- C: A running count tracks how many containers have been filled without needing a separate counter sensor

**Q3.** A raw PDin value of `0x02EE` is received from the TV7105 (int16, ÷10). What is the temperature? (0x02EE = 750 decimal)

- A: 7.5 °C
- B: 750.0 °C
- C: 75.0 °C — 750 ÷ 10 = 75.0

**Q4.** Why does building a PDout command for the CL50 require more care than reading the proximity sensor's PDin?

- A: Multiple fields — colour, animation, intensity, and speed — must be packed into specific bit positions across 3 bytes. One wrong bit changes the entire behaviour
- B: The CL50 uses a completely different IO-Link variant that the standard binary decoder cannot process
- C: The CL50 PDin arrives as a plain text string rather than binary bytes

---

## WS4 — Benefits for Maintenance

**Estimated time:** 45 minutes | **Dashboard:** Dashboard — Port status, IO-Link Master page

### Why This Matters

Mapping IO-Link features to real maintenance problems is how you make the return-on-investment case for an Industry 4.0 upgrade. Turning raw protocol capabilities into tangible operational outcomes — shorter downtime, faster root-cause identification, automatic sensor re-commissioning — is the skill that bridges engineering and management.

### Learning Objectives

- Match IO-Link capabilities to specific maintenance problems
- Compare mean-time-to-repair (MTTR) for standard sensors versus IO-Link sensors
- Identify where process data, event data, and service data appear in the live system
- Locate device identity, parameter panels, and event logs in the HMI

### Background — Standard vs IO-Link Maintenance Response

When a standard sensor fails, the maintenance engineer walks to the machine, identifies the failed sensor visually, replaces it, re-adjusts it manually, and signs off — typically 35 minutes.

When an IO-Link sensor fails:
1. **HMI alerts** — port number and fault code are on screen in seconds (~1 min)
2. **Part ordered** — device identity (vendor + model) is known before you leave the office (~2 min)
3. **Sensor swapped** — parameters restore automatically from the master (~4 min)
4. **HMI confirms** — port shows healthy, process value normal (~1 min)

**Total: ~8 minutes.** A saving of 27 minutes per fault event.

### Task — Match Maintenance Problems to IO-Link Features

For each maintenance problem below, select the IO-Link feature that addresses it:

| Maintenance problem | IO-Link feature |
|--------------------|----------------|
| Sensor fails without warning | |
| Replacing a sensor loses its configuration | |
| Unknown which sensor on the line has failed | |
| Planning when to replace a sensor | |

**Available options:**
- **Diagnostic events** — fault codes and warnings transmitted by the sensor (e.g. lens dirty, wire break) alert before complete failure
- **Parameter storage and automatic device replacement** — parameters stored in the master restore automatically when the Device ID of the new sensor matches
- **Device identity and event codes per port** — vendor ID, device ID, and per-port event codes on the HMI identify the exact failed sensor and model
- **Cycle count and diagnostic trends** — usage data accessible via ISDU enables predictive maintenance planning

### Task 2 — Live System Identification

Using the **Dashboard** and the **IO-Link Master page**, confirm each capability is visible on the live system:

- [ ] Find the **device identity** (vendor name, product name) for Port 3 on the IO-Link Master page
- [ ] Locate where **process data** (live sensor values) appears on the Dashboard
- [ ] Find where **event / diagnostic data** (faults and warnings) would appear on the IO-Link Master page if a fault occurred
- [ ] Navigate to the **parameter read/write panel** for a sensor and identify at least one writable parameter

### Knowledge Check

**Q2.** In this app, which data type does the WebSocket stream deliver to the browser on every tick?

- A: Process data (sensor values) + event data (faults/warnings) merged into a single JSON payload
- B: Service data only — parameters and ISDU values
- C: Raw binary PDin only, without decoding

---

## WS5 — Decoding IO-Link Data

**Estimated time:** 60 minutes | **Dashboard:** Dashboard — IODD parameter panels

### Why This Matters

Every ISDU read returns raw hexadecimal bytes. Without knowing the data type and scale factor, the number is meaningless. This worksheet teaches the conversion from hex to decimal to engineering value — the skill that makes parameter access useful, not just possible. It also prepares you for WS10 where negative (two's complement) values appear.

### Learning Objectives

- Convert hexadecimal values to decimal using positional notation
- Apply data types (uint8, uint16, int16, int32) to raw byte values
- Apply scale factors to produce engineering values with correct units
- Complete three decode exercises using ISDU parameter values from this kit

### Background — Three Components of Any ISDU Decode

Every ISDU parameter decode requires three pieces of information from the IODD file:

| Component | What it tells you | Example |
|-----------|------------------|---------|
| **Raw hex** | The bytes the device returned | `01 F4` |
| **Data type** | How many bytes and whether signed | int16 (2 bytes, can be negative) |
| **Scale factor** | Multiplier to reach engineering units | × 0.1 (to get °C) |

**Step 1 — Hex digits:** Hexadecimal uses 16 symbols: 0–9, then A=10, B=11, C=12, D=13, E=14, F=15. One byte is always two hex digits.

**Step 2 — One-byte conversion:** left digit × 16 + right digit.
> Example: `F4` → 15 × 16 + 4 = 240 + 4 = **244**

**Step 3 — Two-byte (16-bit) values:** positional weights are ×4096, ×256, ×16, ×1.
> Example: `01 F4` → (0×4096) + (1×256) + (15×16) + 4 = 0 + 256 + 240 + 4 = **500**

**Step 4 — Apply scale:** 500 × 0.1 = **50.0 °C**

### Background — Data Types in This Kit

| Type | Bytes | Range | Typical use |
|------|-------|-------|-------------|
| uint8 | 1 | 0–255 | Output logic (NO=0, NC=1), teach commands |
| uint16 | 2 | 0–65 535 | Capacitive SP1 (raw count, always positive) |
| int16 | 2 | −32 768 to +32 767 | Temperature SP1/RP1 and calibration offset |
| int32 | 4 | ±2 billion | Photoelectric SP1 (wide sensing range) |

Negative int16 values use **two's complement** encoding — covered in full in WS10 alongside the PT100 sensor.

### Scale Factors in This Kit

| Parameter | Index | Type | Scale | Example |
|-----------|-------|------|-------|---------|
| TV7105 SP1 | 583 | int16 | × 0.1 | Raw `0118` = 280 → 28.0 °C |
| TV7105 RP1 | 584 | int16 | × 0.1 | Raw `00FA` = 250 → 25.0 °C |
| TV7105 Cal. Offset | 681 | int16 | × 0.1 | Raw `FFD0` = −48 (signed) → −4.8 °C |
| Capacitive SP1 | 60/sub1 | int16 | × 1 | Raw `0064` = 100 counts |
| Proximity output logic | 61/sub1 | uint8 | × 1 | Raw `00` = NO, `01` = NC |

### Practice Exercises

Work through these three exercises using the conversion method above. Show your working.

**Q1 — ISDU read of TV7105 RP1 (Index 584, Sub 0) returns `00 E6`. dtype = int16, scale = ×0.1. What is RP1 in °C?**

> Hint: E = 14 in decimal.

Working: ___________________

Answer: _____ °C

**Q2 — A capacitive sensor returns `00 64` for SP1 (uint16, no scale). What is the setpoint count?**

> Hint: 6 × 16 + 4 = ?

Working: ___________________

Answer: _____ counts

**Q3 — The TV7105 SP1 returns `01 F4` (int16, scale ×0.1). Show your full working to find the setpoint in °C.**

Working:

Answer: _____ °C

---

## WS6 — Diagnostics: Process, Service, and Event Data

**Estimated time:** 45 minutes | **Dashboard:** Dashboard — Port Details, IO-Link Master page

### Why This Matters

Routing the right data to the right destination — PLC scan cycle, historian, CMMS — is a core system integration task. Misclassifying data types leads to missed faults (events sent to the wrong queue), overloaded controllers (service data polled every cycle), or stale dashboards (process data rate not matched to publish interval).

### Learning Objectives

- Classify IO-Link data as process, service, or event
- Explain where each data type is routed in an industrial control system
- Identify which type the WebSocket stream delivers on each tick
- Locate process data, service data access, and event data in this app

### Background — Three IO-Link Data Types

| Type | Description | Rate | Destination |
|------|-------------|------|-------------|
| **Process data** | Cyclic sensor values — temperature, switching state, detection count | Every master scan (500 ms in this system) | PLC scan cycle, HMI live display, historian |
| **Service data** | Acyclic parameter reads and writes (ISDU) — SP1, calibration offset, output logic | On demand only — initiated by controller or HMI | Commissioning tool, parameterisation software, ISDU panel in this app |
| **Event data** | Diagnostic events triggered by a condition — device replacement, wire break, short circuit, sensor fault flag | On event trigger — not periodic | CMMS work order system, alarm management system |

**In this app:** the WebSocket `/ws` stream delivers **process data + event data** merged into a single JSON payload on every tick. Service data (ISDU reads/writes) is only accessed on demand via separate REST API calls.

### Task — Classification Exercise

For each item below, classify it as **process**, **service**, or **event**:

| Data item | Your classification |
|-----------|---------------------|
| Temperature value 23.5 °C arriving every 500 ms | |
| Device replacement detected on Port 2 | |
| Parameter read — filter time = 10 ms | |
| Object present flag (switching output, 1 or 0) | |
| Short circuit fault reported | |

### Task 2 — Live Data Classification

Explore the **Dashboard** and the **IO-Link Master page**. Identify an example of each data type in the live system:

- [ ] Name **three process data values** visible on the Dashboard (e.g. temperature in °C, detected state, detection count)
- [ ] Identify which page in this app provides access to **service data** (parameter read/write via ISDU panels)
- [ ] Locate where **event data** (faults and warnings) would appear on the IO-Link Master page
- [ ] Confirm the WebSocket stream is delivering **merged process + event data** — not service data — on every tick

### Knowledge Check

**Q2.** In this app, which data type does the WebSocket stream deliver to the browser on every tick?

- A: Process data (sensor values) + event data (faults/warnings) merged into a single JSON payload per push
- B: Service data only (ISDU parameters) on every tick
- C: Raw binary PDin only, without decoding

---

## WS7 — PLC and HMI Integration

**Estimated time:** 60 minutes | **Dashboard:** Dashboard — Port Status, Connection Diagnostics

### Why This Matters

IO-Link data does not automatically appear in a PLC — it must be mapped through the master's process data image into the fieldbus. Understanding this mapping is essential for commissioning a sensor into an existing control system, for designing HMI alarm screens, and for explaining the data flow to a controls engineer who has never seen IO-Link before.

### Learning Objectives

- Describe how an IO-Link master maps PDin into a PLC's process image via fieldbus
- Identify the equivalent layers in this app (FastAPI replaces the PLC; WebSocket replaces the fieldbus)
- Match each backend component to its function in the data decode chain
- Explain the benefits of remote diagnostics over a traditional HMI architecture

### Background — Traditional PLC Path vs This App

In a traditional PLC system the data path is:

```
Sensor → IO-Link cable → IO-Link Master → Fieldbus (PROFINET/EtherNet/IP) → PLC scan cycle → HMI display
```

In this app the equivalent path is:

```
Sensor → IO-Link cable → AL1350 → MQTT (Mosquitto) → FastAPI (decoder.py) → WebSocket → Browser (HMI)
```

The layers correspond directly:

| PLC layer | This app equivalent |
|-----------|---------------------|
| IO-Link Master (process image) | AL1350 — maps PDin into MQTT payload |
| Fieldbus | MQTT + FastAPI WebSocket `/ws` |
| PLC | FastAPI + decoder.py |
| HMI display | This browser dashboard |
| ISDU commissioning tool | IODD parameter panels in this app |

**How the PLC reads IO-Link data:**
The IO-Link master maps each port's PDin into its process data image. The PLC reads this via fieldbus on every scan cycle — the same way it reads a conventional digital or analogue input. IO-Link adds ISDU access and event data on top of this cyclic mapping, but the process value still arrives via the normal I/O image.

### Task — Backend Component Matching

For each function below, identify which backend file performs it:

| Function | Backend file |
|----------|-------------|
| Subscribing to AL1350 MQTT topics | |
| Decoding raw PDin into °C / object state / CL50 colour | |
| Pushing decoded data to the browser via WebSocket | |

**Available files:** `io_link_fastapi.py`, `decoder.py`, `al1350_client.py`

### Task 2 — Live Data Path Trace

Using the **Dashboard**, **Connection Diagnostics**, and **Edge Device** pages:

- [ ] Note the current temperature reading on Port 3 from the Dashboard
- [ ] Confirm the data path is live: **AL1350 → Mosquitto → FastAPI → decoder.py → WebSocket → Browser** — each layer is visible in this app
- [ ] Confirm the **HTTP fallback path** is also live via the Connection Diagnostics latency graph
- [ ] On the Edge Device page, confirm both **FastAPI** and **Mosquitto** are shown as active services

### Knowledge Check

**Q1.** In a traditional PLC architecture, how does the IO-Link master deliver a sensor's current state to the PLC?

- A: The sensor publishes its state directly over Ethernet to the PLC's IP address
- B: The PLC polls the IO-Link master on demand when it needs the current value
- C: The IO-Link master maps the port's PDin into its process image; the PLC reads this via fieldbus on every scan cycle

**Q2.** Match each function to the correct backend component:

Fill in the matching exercise above (see Task section).

**Q3.** What are the three main benefits of remote HMI-based diagnostics over a traditional on-site inspection model?

- A: HMI dashboards require more skilled operators than traditional panel-based systems
- B: Remote access reduces licensing costs for SCADA systems
- C: Faster fault identification, monitoring of multiple machines from one screen, and historical trend data without a site visit

**Q4.** A spike appears in the latency graph on Connection Diagnostics. What does this most likely indicate?

- A: High load on the IO-Link subnet or the AL1350 being overloaded with requests
- B: The browser's JavaScript rendering engine has stalled
- C: A Wi-Fi channel collision has momentarily saturated the building LAN

---

## WS8 — Case Study: Standard vs IO-Link — The Numbers

**Estimated time:** 45 minutes | **Dashboard:** Dashboard — Active Port Details

### Why This Matters

Quantifying the MTTR reduction and uptime gain is how you justify IO-Link investment to management. This worksheet walks through a realistic financial calculation. The ability to turn protocol features into business numbers is a competency valued by maintenance engineers and engineering managers alike.

### Learning Objectives

- Calculate annual downtime in hours for both standard and IO-Link sensor systems
- Compute the financial saving from a reduced MTTR
- Identify the two non-MTTR features that most reduce total cost of ownership
- Explain which data type triggers CMMS maintenance work orders

### Background — The Scenario

**A production line has 40 sensors. On average, each sensor causes one fault per year.**

| Metric | Standard sensors | IO-Link sensors |
|--------|-----------------|----------------|
| Fault identification | Walk to machine, test manually | HMI shows port + fault code |
| Part ordering | Physical label inspection | Device identity known from dashboard |
| Replacement | Manual adjustment and re-commissioning | Parameters restore automatically |
| Verification | Check with reference instrument | HMI confirms port healthy |
| **MTTR per fault** | **~35 minutes** | **~8 minutes** |

### Task — Complete the Calculation Table

Fill in the calculation table:

| Metric | Standard sensors | IO-Link sensors |
|--------|-----------------|----------------|
| MTTR per fault (min) | 35 | 8 |
| Faults per year (40 sensors, 1 each) | 40 | 40 |
| Total downtime per year (minutes) | | |
| Total downtime per year (hours) | | |

**Annual saving in hours:** _____ h

**At £5,000/hour production value, annual financial saving:** £_____

### Task 2 — Scale-Up Calculation

A larger facility has 200 sensors with the same fault rate. Calculate:
- Annual hours saved with IO-Link vs standard: _____ h (200 × 1 fault × 27 min saving ÷ 60)
- Financial saving at £5,000/hour: £_____

### Knowledge Check

**Q1.** Using the scenario figures above, what is the annual downtime saving when switching to IO-Link?

- A: 18 hours per year — Standard: 40 × 35 min = 1,400 min = 23.3 h; IO-Link: 40 × 8 min = 320 min = 5.3 h; Saving = 18 h
- B: 5.3 hours per year — the IO-Link total downtime
- C: 23.3 hours per year — the standard sensor total downtime

**Q2.** If the production line generates £5,000 of value per hour, what is the annual financial saving from IO-Link?

- A: £175,000
- B: £26,500
- C: £90,000 — 18 hours × £5,000/hour

**Q3.** Beyond MTTR, which pair of benefits contributes most to lower total cost of ownership for IO-Link sensors?

- A: Built-in wireless backup channel and automatic IP address provisioning for all sensors
- B: Automatic parameter restore on sensor swap and remote diagnostics via the HMI — both eliminate manual site visits
- C: Lower per-unit sensor cost due to IO-Link certification subsidising manufacturing overheads

**Q4.** In this app's architecture, which data type would you export to a CMMS to automate maintenance work orders?

- A: Event data — faults and warnings are the triggers for maintenance actions
- B: Process data only — the live sensor values
- C: Service data only — ISDU parameters

---

## WS9 — Device Identity: Vendor ID, Device ID & PDin

**Estimated time:** 45 minutes | **Dashboard:** IO-Link Master page — Port Status cards

### Why This Matters

Physical labels wear off. Maintenance records go missing. The Vendor ID and Device ID embedded in every IO-Link sensor mean you can always confirm what is connected, order the exact right spare, and decode PDin correctly — without leaving the dashboard. This worksheet uses a real worn-label scenario to practise positive identification from IO-Link identity fields alone.

### Learning Objectives

- Read Vendor ID and Device ID from the IO-Link Master page
- Resolve a Vendor ID to a manufacturer name using the IO-Link Community registry
- Explain why the Device ID is critical for ordering and for automatic parameter restore
- Decode key bit fields from the proximity sensor PDin hex
- Identify the RS Pro capacitive sensor from its Vendor ID and Device ID pair

### Background — What the Master Reads at Connection

When a sensor is first connected, the AL1350 automatically reads its identity:

| Field | Where it comes from | What it tells you |
|-------|--------------------|--------------------|
| Vendor ID | Read from sensor EEPROM at connection | Which manufacturer made this sensor |
| Device ID | Read from sensor EEPROM at connection | The exact model — used for ordering and parameter restore |
| PDin hex | Delivered every MQTT cycle | Live process data — decode according to device type |

**Known Vendor IDs in this kit:**

| Vendor ID | Manufacturer |
|-----------|-------------|
| 310 | ifm electronic |
| 342 | Contrinex |
| 612 | OMRON Corporation |
| 1586 | RS Pro (Carlo Gavazzi OEM) |
| 451 | Banner Engineering |

### Scenario

During a planned shutdown, a technician discovers that the physical label on the sensor connected to Port 1 has completely worn away. There is no maintenance record for this port. Before ordering a spare and signing off the job, you must positively identify the device using the app — without touching the physical unit.

### Task — Positive Identification Exercise

Open the **IO-Link Master page**. For each active port, record:

| Port | Vendor ID | Manufacturer name (resolved) | Device ID | Model name | PDin example |
|------|-----------|------------------------------|-----------|------------|--------------|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

### PDin Quick Reference — Sensors in This Kit

| Port | Sensor | PDin example | Key bytes |
|------|--------|-------------|-----------|
| 1 | Omron E2E-X16MB1T12 | `5000` | Byte 0 bit 0 = OUT1; bit 4 = instability alarm; bit 5 = over-approach alarm |
| 2 | RS Pro Capacitive | `000A0002` | Bytes 0–1 = 16-bit analogue value; byte 3 bit 1 = switching output |
| 3 | IFM TV7105 Temperature | `00FEFF00` | Bytes 0–1 = int16 raw × 0.1 = °C; bytes 2–3 = SP1/SP2 flags |

### Task 2 — Live Identification Checklist

- [ ] Note the **Vendor ID and resolved company name** for Port 1, Port 2, and Port 3 on the IO-Link Master page
- [ ] Confirm the **Device ID and model name** for each port — verify they match the hardware on the bench
- [ ] Read the live **PDin hex** for Port 3 and decode the first two bytes into a °C value (int16 ÷ 10)
- [ ] Check Port 1's PDin first byte — if bit 4 is set, **investigate sensor alignment** before signing off
- [ ] Record Vendor ID, Device ID, and current PDin for each port as a maintenance log entry

### Knowledge Check

**Q1.** Open the IO-Link Master page. What Vendor ID does Port 1 report?

- A: 612
- B: 310
- C: 1586

**Q2.** The IO-Link Master page resolves the Vendor ID to a company name. Which manufacturer does Vendor ID 612 identify?

- A: ifm electronic
- B: OMRON Corporation
- C: Balluff

**Q3.** Port 1 reports Device ID 131090, which the app resolves to E2E-X16MB1T12 Proximity. Why does knowing the Device ID matter when ordering a spare?

- A: The master uses it to set the sensor's IP address on the IO-Link network
- B: It shows the sensor's remaining service life in hours
- C: It uniquely identifies the exact model — you order the right part first time and the master can restore parameters automatically after the swap

**Q4.** Port 1 currently shows PDin hex `5000`. The first byte is `50` (binary 0101 0000). Bit 4 being set indicates the instability alarm is active. What is the correct maintenance response?

- A: Check sensor alignment — the target is likely at the edge of the sensing range
- B: No action — an instability alarm means the sensor passed its self-test
- C: Replace the sensor immediately — bit 4 means a permanent hardware fault

**Q5.** A sensor with a worn label is found on Port 2. The app shows Vendor ID 1586 and Device ID 1052673. Which spare should you order?

- A: IFM TV7105 temperature sensor
- B: OMRON E2E-X16MB1T12 proximity sensor
- C: RS Pro M18 capacitive sensor (Carlo Gavazzi OEM)

---

## WS10 — PT100 Temperature Sensors

**Estimated time:** 60 minutes | **Dashboard:** CP3723 Worksheet 5 — Temperature Sensor

### Why This Matters

Understanding how the PT100 element works — and how the sensor encodes its reading into IO-Link PDin — lets you decode raw data without a datasheet, calculate expected resistance values to fault-find wiring problems, and properly engineer calibration offset corrections rather than guessing. The two's complement encoding for negative temperatures also appears in any signed parameter value in this kit.

### Learning Objectives

- Calculate the expected PT100 resistance at a given temperature using the simplified linear equation
- Decode TV7105 PDin hex values into °C, including negative values using two's complement
- Explain what the −40 °C reading on the dashboard means and what to investigate
- Engineer a calibration offset correction value for a drifted sensor
- Explain how SP1, SP2, and calibration offset are stored and restored by the IO-Link system

### Background — The PT100 Resistance Curve

The IFM TV7105 on Port 3 is built around a PT100 resistance temperature detector. The "PT" means platinum; the "100" means its resistance is exactly 100 Ω at 0 °C. Platinum's resistance changes predictably with temperature — described by the **Callendar–Van Dusen equation**. For the industrial working range a simplified linear equation is accurate enough:

```
R(T) = 100 × (1 + α × T)     where α = 0.00385 °C⁻¹  (IEC 60751)
```

For every 1 °C rise, resistance increases by approximately **0.385 Ω**.

**Resistance reference table:**

| Temperature | Calculation | Resistance |
|------------|-------------|-----------|
| −40 °C | 100 × (1 + 0.00385 × −40) | 84.6 Ω |
| 0 °C | 100 × (1 + 0.00385 × 0) | 100.0 Ω |
| 25 °C | 100 × (1 + 0.00385 × 25) | 109.6 Ω |
| 60 °C | 100 × (1 + 0.00385 × 60) | 123.1 Ω |
| 100 °C | 100 × (1 + 0.00385 × 100) | 138.5 Ω |
| 150 °C | 100 × (1 + 0.00385 × 150) | 157.8 Ω |

**Fault-finding with resistance:** If you suspect a wiring fault rather than a sensor fault, measure the element resistance with a multimeter and use the formula to verify it matches the expected temperature. A reading of 0 Ω is a short circuit. An open circuit (∞ Ω) reports as **−40 °C** on the IO-Link dashboard — the classic broken-element diagnostic. If your lab reads 20 °C ambient and the sensor shows −40 °C, it is almost certainly disconnected or the element is broken.

### Background — IEC 60751 Accuracy Classes

| Class | Tolerance formula | At 0 °C | At 100 °C |
|-------|-------------------|---------|----------|
| AA | ±(0.10 + 0.0017·\|T\|) | ±0.10 °C | ±0.27 °C |
| A | ±(0.15 + 0.0020·\|T\|) | ±0.15 °C | ±0.35 °C |
| **B ✓** | **±(0.30 + 0.0050·\|T\|)** | **±0.30 °C** | **±0.80 °C** |

The TV7105 achieves **Class B** — the most common industrial grade. The calibration offset (Index 681) can compensate for element tolerance and installation-induced error.

### Background — PDin Encoding: How °C Becomes Bytes

The TV7105 PDin is 4 bytes. Bytes 0–1 carry temperature as a **signed 16-bit integer (int16)** at scale ×0.1. Bytes 2–3 carry SP1/SP2 flags.

**Encoding steps (positive temperature):**
1. Take temperature in °C, multiply by 10: 25.4 °C → **254**
2. Store as 16-bit big-endian integer: 254 decimal = **0x00FE**
3. Bytes 0–1 of PDin = `00 FE`

**Negative temperatures — two's complement:**
For values below 0 °C, the int16 wraps into two's complement. Rule: if the 16-bit value exceeds 32767 (0x7FFF), subtract 65536 to get the signed decimal.

> −10.0 °C → raw = −100 → two's complement: 65536 − 100 = 65436 = **0xFF9C**
>
> To decode 0xFF9C: 65436 − 65536 = **−100** → −100 ÷ 10 = **−10.0 °C**

### Hex Decode Exercises

For each PDin hex value, extract bytes 0–1, interpret as signed int16, then divide by 10. **Show your working.**

| Exercise | PDin hex | Bytes 0–1 | int16 decimal | Temperature |
|----------|---------|-----------|---------------|-------------|
| 1 | `01 2C FF 00` | `01 2C` | | |
| 2 | `01 96 FF 00` | `01 96` | | |
| 3 | `FF 9C FF 00` | `FF 9C` | | |
| 4 | `FE 70 00 00` | `FE 70` | | |

> **Hint for Exercise 3 and 4:** 0xFF9C = 65436 unsigned; 65436 > 32767 so apply two's complement: 65436 − 65536 = **−100**

### Background — Calibration Offset Engineering (Index 681)

The calibration offset (ISDU Index 681, Sub 0, int16, ×0.1) adds a signed trim value to the sensor's decoded temperature before it is reported. Range: −10.0 to +10.0 °C. Default: 0.0 °C (raw 0x0000). The correction survives power-off and is stored in the sensor EEPROM.

**When to use it:**

| Situation | Action |
|-----------|--------|
| Reference thermometer reads 24.1 °C; sensor reads 24.7 °C | Write −0.6 °C to Index 681 |
| Sensor in hot enclosure reading +2 °C high from self-heating | Write −2.0 °C to Index 681 |
| Class B element drift of +3 °C confirmed against calibrated reference | Write −3.0 °C to Index 681 |

**Encoding a negative correction:**
−3.0 °C → −3.0 × 10 = −30 → two's complement: 65536 − 30 = 65506 = **0xFFE2**
ISDU write: Index 681, Sub 0, int16, raw value −30, transmitted as `FFE2`.

### Background — SP1 & SP2 Engineering Notes

- SP1 (Index 583) and SP2 (Index 593) are stored in sensor EEPROM — they survive power-off, master replacement, and firmware updates
- SP1 is typically the warning threshold; SP2 is the critical/shutdown threshold
- Without hysteresis (RP1/RP2), output would chatter at the setpoint — always set RP at least 2–3 °C below SP
- **Parameter restore on sensor swap:** the IO-Link master writes SP1, SP2, and calibration offset back to a replacement sensor automatically if the Device ID matches — no manual re-configuration needed

---

## WS11 — CL50 Pro PDout Encoding Deep-Dive

**Estimated time:** 60 minutes | **Dashboard:** CP3723 Worksheet 6 — CL50 Light Stack (required prerequisite)

### Why This Matters

The CL50 exposes all its state in 24 bits. Once you can read and write those bits directly you can control any IO-Link output device — the PDout encoding pattern repeats across all PDout-capable devices. It also prepares you for PLC integration, where you write these values in ladder logic or structured text rather than through a UI. Encoding from a specification is the hardest practical skill in CP7395.

### Learning Objectives

- Explain the difference between PDin (sensor to master) and PDout (master to device)
- Use the 24-bit PDout field map to decode a CL50 hex string into its component states
- Build a correct 6-character PDout hex string from a written specification
- Understand the Intensity Sweep firmware limitation and why the software sweep workaround exists

### Background — PDout vs PDin

IO-Link process data flows in two directions:

- **PDin** — device sends data to the master (sensor readings, status flags)
- **PDout** — master sends commands to the device (setpoints, colour commands)

The CL50 has no PDin. It is PDout-only. Every 500 ms the AL1350 writes a 3-byte (6 hex character) value to Port 4 and the CL50 executes it immediately. The startup default is `000100` — Green, Steady, High intensity.

### Background — The Complete 24-Bit PDout Map

| Octet | Bits | Field | Values |
|-------|------|-------|--------|
| 0 | [7:6] | Audible alarm | 0=Off · 1=On · 2=Pulsed · 3=SOS |
| 0 | [5:3] | Colour 2 intensity (C2I) | 0=High · 1=Low · 2=Med · 3=Off · 4=Custom |
| 0 | [2:0] | Colour 1 intensity (C1I) | 0=High · 1=Low · 2=Med · 3=Off · 4=Custom |
| 1 | [7:6] | Speed | 0=Medium · 1=Fast · 2=Slow |
| 1 | [5:3] | Pulse pattern | 0=Normal · 1=Strobe · 2=Three Pulse · 3=SOS · 4=Random |
| 1 | [2:0] | Animation mode | 0=Off · 1=Steady · 2=Flash · 3=Two Colour Flash · 4=Intensity Sweep ⚠ |
| 2 | [7:4] | Colour 2 index | 4-bit index 0–15 |
| 2 | [3:0] | Colour 1 index | 4-bit index 0–15 |

**Colour index table:**

| Index | Colour | Index | Colour | Index | Colour | Index | Colour |
|-------|--------|-------|--------|-------|--------|-------|--------|
| 0 | Green | 4 | Yellow | 8 | Sky Blue | 12 | Rose |
| 1 | Red | 5 | Lime | 9 | Blue | 13 | White |
| 2 | Orange | 6 | Spring Green | 10 | Violet | 14 | Custom 1 |
| 3 | Amber | 7 | Cyan | 11 | Magenta | 15 | Custom 2 |

**Best practice:** Set C2I = 3 (Off) in Octet 0 whenever you are not using Two Colour Flash animation — this prevents the Colour 2 slot from showing if animation mode changes unexpectedly.

### Background — Intensity Sweep Firmware Bug (v1.0.2)

**CL50 firmware v1.0.2 does not execute animation=4 (Intensity Sweep) from PDout.** The AL1350 accepts the write (returns code 200) but the light shows a static colour at the specified intensity — it does not cycle. All other animation values (0–3) work correctly.

The backend implements a **software sweep workaround** (`_run_sweep_loop` in `io_link_fastapi.py`) that cycles C1I through Low→Medium→High→Medium→Low using animation=Steady at configurable intervals, producing a visible breathing effect.

### Task 1 — Worked Decode Example

Decode the hex value `184203` by splitting it into octets:

| Octet | Hex | Decimal | Binary | Fields |
|-------|-----|---------|--------|--------|
| 0 | `18` | 24 | 0001 1000 | [7:6]=00=Audible Off; [5:3]=011=C2I=3=Off; [2:0]=000=C1I=0=High |
| 1 | `42` | 66 | 0100 0010 | [7:6]=01=Speed=Fast; [5:3]=000=Pattern=Normal; [2:0]=010=Anim=Flash |
| 2 | `03` | 3 | 0000 0011 | [7:4]=0000=Colour2=0=Green(Off); [3:0]=0011=Colour1=3=Amber |

**Decoded result:** Amber, Flash animation, Fast speed, High intensity (Colour 2 Off)

This is the LST-0312 fault state from CP3723 WS6 — the "Amber Flash" that the PLC was still holding after the maintenance restart.

### Task 2 — Decode Exercises

Decode each hex value using the PDout field map. Show your working in the table below.

**`000100`**

| Octet | Hex | Fields decoded |
|-------|-----|---------------|
| 0 | `00` | |
| 1 | `01` | |
| 2 | `00` | |

Result: _______________________

**`004312`**

| Octet | Hex | Fields decoded |
|-------|-----|---------------|
| 0 | `00` | |
| 1 | `43` | |
| 2 | `12` | |

Result: _______________________

**`198205`**

| Octet | Hex | Fields decoded |
|-------|-----|---------------|
| 0 | `19` | |
| 1 | `82` | |
| 2 | `05` | |

Result: _______________________

### Task 3 — Encode Exercises

Build the correct 6-character PDout hex string from each specification. **Work octet by octet.**

**Specification A: Blue · Steady · Medium speed · High intensity**

| Octet | Fields | Binary | Hex |
|-------|--------|--------|-----|
| 0 | Audible=Off(0), C2I=Off(3)=011, C1I=High(0)=000 | 0001 1000 | |
| 1 | Speed=Medium(0)=00, Pattern=Normal(0)=000, Anim=Steady(1)=001 | 0000 0001 | |
| 2 | Colour2=0=0000, Colour1=Blue(9)=1001 | 0000 1001 | |

Answer: ______

**Specification B: Cyan / Magenta · Two Colour Flash · Fast speed · High intensity**

| Octet | Fields | Binary | Hex |
|-------|--------|--------|-----|
| 0 | Audible=Off(0), C2I=High(0)=000, C1I=High(0)=000 | | |
| 1 | Speed=Fast(1)=01, Pattern=Normal(0)=000, Anim=TwoColour(3)=011 | | |
| 2 | Colour2=Magenta(11)=1011, Colour1=Cyan(7)=0111 | | |

Answer: ______

---

## Assessment Summary

| Task | Format | Weighting | Notes |
|------|--------|-----------|-------|
| WS1–WS3 MCQs | Multiple choice (in-worksheet) | Formative | Immediate feedback on screen |
| WS1–WS2 Verification checklists | Live system observation | Formative | Confirm system health before proceeding |
| WS3 PDin challenge | Live sensor observation | Formative | Manual hex-to-°C calculation |
| WS4 Matching exercise | Maintenance problem → feature | Formative | App-checked (Check answers button) |
| WS5 Decode exercises Q1–Q3 | Free-response calculation | Formative | Self-checked via "Show answers" |
| WS6 Classification exercise | Process/Service/Event | Formative | App-checked |
| WS7 Backend matching | Component → function | Formative | Self-checked via "Show answers" |
| WS8 Calculation table | Downtime + financial calculation | Formative | Self-checked; scale-up extension task |
| WS9 Identification task | Vendor ID/Device ID lookup + PDin | Formative | Live system observation |
| WS10 Hex decode exercises | Four decode calculations | Formative | Self-checked via "Show calculation reference" |
| WS11 Decode + encode exercises | Three decodes + two encodes | Formative | Self-checked via comparison with decode tables |

Your progress through all worksheets is tracked on the **Student Progress** page (sidebar). You can export a JSON record of your session for your portfolio.

---

## Quick Reference — PDout Decode Answers

These are provided for self-checking WS11 decode exercises.

| Hex | Decoded Meaning |
|-----|----------------|
| `000100` | Green · Steady · Medium speed · High intensity — AL1350 startup default |
| `004312` | Orange/Red · Two Colour Flash · Fast speed · High intensity |
| `198205` | Lime Green · Flashing · Slow speed · Low intensity |

**Encode exercise answers:**

| Specification | Correct Hex |
|--------------|-------------|
| Blue · Steady · Medium · High | `000109` |
| Cyan/Magenta · Two Colour Flash · Fast · High | `0043B7` |

---

*CP7395 — Industry 4.0 IO-Link*
*IM4330 Issue 1.0 | Matrix Technology Solutions Ltd | development@matrixtsl.com*
