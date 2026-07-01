**Name**: Maintenance of IO-Link Systems: Smart Sensors

**Product Range**: Industrial Maintenance

**Product Code**: IM4330

**Curriculum Code:** CP7395 & CP3723

**Power Supply**: 24V

|     |     |     |
| --- | --- | --- |
| **Unit weight** |     | **Packed Specifications** |
| **Weight**: TBC |     | Volume: TBC |
| **Length**: TBC |     | Gross Weight: TBC |

**Width**: TBC

**Height**: TBC

---

# Educational Purpose

The **Maintenance of IO-Link Systems: Smart Sensors (IM4330)** teaches the dynamics of **industrial IO-Link sensor networks** in a live, hands-on training environment. Rather than simulating sensor behaviour, every interaction — reading a process value, writing a setpoint, diagnosing a fault — takes place on real industrial hardware connected over a live IO-Link bus.

The kit bridges the gap between classroom theory and workplace practice. Learners build the skills demanded by modern industrial maintenance roles: commissioning IO-Link sensors from scratch, reading and writing ISDU parameters without interrupting the live data stream, diagnosing faults through device identity checks and event flags, and using a real HMI dashboard to guide maintenance decisions.

Every fault scenario injects a real misconfiguration into the live sensor — inverted output logic, calibration drift, wrong setpoints — and the student must observe the anomaly, diagnose the root cause via ISDU reads, and write a corrective value, exactly as a field engineer would.

---

# Learning Outcomes

The kit delivers **two structured curriculum units** totalling **19 guided hands-on modules** across two progressive courses.

**CP3723 — Maintenance on Smart Sensors (9 modules)**
Students are introduced to each device in the kit, interact with live process data, and work through commissioning and fault-diagnosis exercises. By the end of CP3723 a learner can identify IO-Link components, commission sensors, adjust setpoints and calibration via ISDU, diagnose and correct sensor faults, and interpret the HMI dashboard to guide a maintenance action.

**CP7395 — Industry 4.0 IO-Link (11 modules)**
A technically deeper second tier for learners pursuing engineering-level understanding. Worksheets decode the IO-Link protocol internals, map the data pipeline from sensor byte to HMI value, and build the commercial argument for IO-Link vs conventional wiring. By the end of CP7395 a learner can decode raw PDin hex payloads, map IO-Link data to PLC addresses, quantify the maintenance cost advantage of IO-Link, and encode PDout control words for an LED light stack.

---

# Product Description

The IO-Link for Industrial Maintenance training system (Model IM4330) is a hands-on industrial training solution designed to teach smart sensor technology, condition monitoring, data analysis and fault diagnosis within an Industry 4.0 maintenance environment.

The system incorporates an IO-Link master with a selection of industrial IO-Link sensors and output devices. These may include temperature, pressure, proximity and vibration sensors, together with a signal tower and other representative industrial components. Learners can configure devices, monitor process values, view diagnostic information and investigate the effect of simulated sensor, wiring and communication faults.

Sensor data and diagnostic information are accessed through PC-based IO-Link software, allowing learners to observe live values, device parameters, warning messages and historical data. This enables practical activities covering sensor commissioning, parameter configuration, performance measurement, fault isolation and predictive maintenance.

The product is supplied with a structured curriculum comprising CP7395 – Industry 4.0 IO-Link and CP3723 – Maintenance on Smart Sensors. The guided worksheets focus on IO-Link communication, smart sensor configuration, real-time data monitoring, troubleshooting techniques and maintenance decision-making.

---

# How the Product Functions in Practice

The system operates as a **live industrial HMI**, not a simulation. All sensor data originates from real hardware on a real IO-Link bus.

## Data Flow

1. The **IFM AL1350 IO-Link Master** polls its four sensor ports every 1–5 ms and buffers the latest process data.
2. Every **500 ms** the master publishes a structured payload to a **Mosquitto MQTT broker** running on the Raspberry Pi.
3. The **FastAPI Python backend** subscribes to the MQTT broker and instantly broadcasts data over a **WebSocket** to any connected browser.
4. The **Chromium kiosk** (on the 1024×600 WaveShare touchscreen) renders live gauges, charts, and status indicators that update without page refresh.
5. Students interact with sensors via **ISDU read/write controls** on the HMI — every write travels from the browser → FastAPI → AL1350 → sensor in under 200 ms.

## ISDU Parameter Access

Students write setpoints, calibration offsets, and output logic values directly to running sensors without stopping the live data stream. A circuit-breaker in the backend protects the AL1350 from overload; adaptive polling reduces traffic to ports without a connected device.

## Fault Scenario Injection

Worksheets include guided fault scenarios where a real misconfiguration is written to the live sensor via ISDU (e.g. inverting proximity output logic to NC, injecting a +3 °C calibration offset, setting wrong setpoints). Students observe the anomaly on the HMI, diagnose the root cause, and write a corrective value. Auto-restore logic ensures sensors return to a safe state when the student navigates away, even if the exercise is not completed.

## Light Stack Control

The Banner CL50 Pro on Port 4 is controlled in real time via 3-byte PDout commands. The HMI provides a colour picker, animation selector, live hex preview, and a server-side intensity sweep effect. Worksheets include a full PDout encoding exercise where students build the hex control word from first principles.

## Logging and Progress Tracking

Student progress (worksheets visited, MCQ answers) is tracked per session in browser storage and can be exported as a JSON file at any time from the Progress page.

---

# System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                FACTORY NETWORK — 192.168.7.0/24                │
└──────────────┬─────────────────────────────────┬───────────────┘
               │ Ethernet                        │ Ethernet
               │                                 │
┌──────────────▼──────────┐           ┌───────────▼─────────────────┐
│  IFM AL1350              │           │  Raspberry Pi 4              │
│  IO-Link Master          │           │  ──────────────────────────  │
│  IP: 192.168.7.4         │ ← MQTT → │  Mosquitto MQTT Broker       │
│  4 × IO-Link ports       │           │  FastAPI + uvicorn (8000)    │
│  REST + MQTT API         │           │  nginx reverse proxy (80)    │
└──────────┬───────────────┘           │  Chromium kiosk (1024×600)  │
           │ IO-Link (M12, 3-wire)     └─────────────────────────────┘
    ┌──────┴──────────────────────────┐
    │        │          │             │
  Port 1   Port 2     Port 3        Port 4
    │        │          │             │
 ┌──▼───┐ ┌──▼───┐ ┌───▼───┐ ┌──────▼───┐
 │Photo │ │Prox. │ │Cap.   │ │Temp.     │
 │elect.│ │Sensor│ │Sensor │ │Sensor    │
 │      │ │      │ │       │ │          │
 └──────┘ └──────┘ └───────┘ └──────────┘
   PDin    PDin     PDin      PDin/PDout
```

*Note: Port 5 (if present on AL1350 variant) carries the Banner CL50 Pro light stack (PDout only).*

## Component Roles

| Component | Role |
|-----------|------|
| **IFM AL1350 IO-Link Master** | Bridge between IO-Link sensor bus and Ethernet. Handles IO-Link protocol, buffers PDin/PDout, exposes REST API and MQTT publish at 500 ms. |
| **Mosquitto MQTT Broker** | Lightweight pub/sub message broker on the Raspberry Pi. Receives 500 ms pushes from the AL1350 and decouples the backend from the master. |
| **FastAPI Backend (Python)** | Subscribes to MQTT, decodes sensor PDin payloads, manages ISDU read/write, forwards live data over WebSocket to the browser. Includes circuit-breaker and HTTP polling fallback. |
| **Chromium HMI Kiosk** | Full-screen dashboard on the WaveShare touchscreen. Renders live gauges, charts, and IODD parameter cards. No external framework dependency. |
| **Contrinex LTR-M18PA-PMS-603 (Port 1)** | Diffuse photoelectric sensor, M18, IO-Link. SSC1 switching output with configurable switch point and output logic. |
| **Omron E2E-X16MB1T12 (Port 2)** | Inductive proximity sensor, M18, IO-Link COM2. PDin: monitor output amplitude + OUT1/diagnostic flags (instability, over-approach). |
| **Carlo Gavazzi / RS PRO M18 (Port 3)** | Capacitive proximity sensor, IO-Link. Detects metal, liquid, and non-metallic materials. SSC1 setpoint + quality-of-target configurable via ISDU. |
| **IFM TV7105 (Port 4)** | PT100 IO-Link temperature sensor. Two independent switching outputs (SP1/RP1, SP2/RP2). Calibration offset via ISDU, range ±10 °C. |
| **Banner CL50 Pro (Port 5)** | 50 mm programmable RGB LED column light. PDout-only. Colour, animation, intensity, and audible control via 3-byte PDout word. |
| **WaveShare 1024×600 Touchscreen** | Capacitive touchscreen display attached to the Raspberry Pi. Kiosk mode via Chromium on Openbox/X11. |

---

# Target Audience

This curriculum is designed for 16 to 18-year-old engineering students in further education colleges, as well as apprentices beginning careers in industrial maintenance, automation, and related engineering fields. It is ideally suited for learners pursuing T-Levels, BTECs, or similar vocational qualifications, and for those aiming to develop practical skills in diagnosing, maintaining, and troubleshooting real-world automated systems. Whether preparing for a role in manufacturing, utilities, or process industries, this program provides a strong foundation in industrial control systems and maintenance best practices.

---

# Key Features

## System Hardware & Design

- IFM AL1350 IO-Link master (IoT Core) with four configurable IO-Link ports
- Five live IO-Link devices pre-mounted and wired on a compact training panel:
    - Contrinex LTR-M18PA-PMS-603 photoelectric sensor
    - Omron E2E-X16MB1T12 inductive proximity sensor
    - Carlo Gavazzi / RS PRO M18 capacitive sensor
    - IFM TV7105 PT100 temperature sensor
    - Banner CL50 Pro RGB light stack (signal tower)
- Raspberry Pi running a touch HMI dashboard on a WaveShare 1024×600 capacitive touchscreen
- Real-time data delivered by MQTT push (500 ms) with HTTP polling fallback
- Self-contained — no PC or internet connection required for normal operation
- Modular, bench-top design optimised for classroom or training-bench use
- CE/RoHS compliant components and finger-safe, low-voltage (24 V DC) wiring

## Curriculum & Learning Outcomes

- Covers IO-Link communication theory and Industry 4.0 smart-sensor concepts in a real industrial context.
- Teaches device commissioning, IODD parameter configuration, and ISDU read/write.
- Builds skills in fault detection, diagnostics, and root-cause analysis on a live network.
- Focuses on interpreting live process, service, and event data to guide maintenance decisions.
- Develops hands-on troubleshooting ability using the HMI dashboard, diagnostics page, and device parameters.

## Fault Simulation & Troubleshooting

- Built-in software-injected faults written live to the sensors via ISDU (e.g. proximity logic inversion, temperature calibration drift, wrong setpoints).
- Randomised fault-diagnosis scenarios drawn from a pool covering sensor, identity, and communication faults.
- Faults include inverted output logic, calibration offset, ISDU misconfiguration, IO-Link communication loss, and supply undervoltage.
- Auto-restore on navigation ensures sensors are returned to a known-good state after each scenario.
- Fault diagnosis via the HMI dashboard, connection-diagnostics page, and device status LEDs / light stack.

## Practical Exercises & Support

- Two structured curriculums with 19 guided worksheets covering every device and fault type.
- "Over to You" sections to encourage independent problem-solving.
- Structured fault scenarios reflecting real-world maintenance situations.
- Live diagnostics, latency graphs, and circuit-breaker state for connection troubleshooting.
- Built-in student-progress tracking with JSON export for assessment.

## Educational Focus

- Aligned to UK T-Level & BTEC qualifications (Maintenance, Installation & Repair).
- Designed for Further Education students and apprentices aged 16–18.
- Teaches smart-sensor system integration: IO-Link master, sensors, network, and HMI.
- Suitable for classroom teaching, self-guided labs, and assessment.

---

# Learning Objectives

By the end of this curriculum, learners will be able to:

- **Explain the Function of IO-Link Systems**
    Demonstrate a clear understanding of how IO-Link point-to-point communication operates, including the role of the master, devices, IODD files, and process/service/event data.
- **Identify and Describe Smart Sensors and Components**
    Accurately identify a range of IO-Link devices and their working principles, including photoelectric, inductive, capacitive, and temperature sensors and signal-tower outputs.
- **Interpret System Behaviour and Diagnose Faults**
    Analyse live sensor data to identify abnormal conditions, isolate faults, and determine appropriate corrective actions using a structured fault-finding approach.
- **Configure and Maintain Smart Sensors**
    Read and write device parameters via ISDU, set switch points and reset points, calibrate sensors, and verify corrected behaviour against the process data.
- **Apply Practical Maintenance and Troubleshooting Skills**
    Gain hands-on experience with simulated real-world scenarios, using diagnostic tools, interpreting device feedback, and applying safe, effective maintenance practices.
- **Develop Confidence in Industrial Maintenance Tasks**
    Build competence and confidence in commissioning devices, interpreting visual indicators and status LEDs, and using the HMI dashboard to guide maintenance decision-making.

---

# Worksheets

**CP3723 – Maintenance on Smart Sensors**

- Worksheet 1 – Meet Your Kit
- Worksheet 2 – What is a Smart Sensor?
- Worksheet 3 – The Photoelectric Sensor
- Worksheet 4 – The Proximity Sensor
- Worksheet 5 – The Capacitive Sensor
- Worksheet 6 – The Temperature Sensor
- Worksheet 7 – The Light Stack (Status LED)
- Worksheet 8 – Fault Finding and Replacement
- Worksheet 9 – Final Practical Assessment

**CP7395 – Industry 4.0 IO-Link**

- Worksheet 1 – Your System — A Technical Brief
- Worksheet 2 – How This App Works
- Worksheet 3 – How Each Sensor Works (Protocol Level)
- Worksheet 4 – Benefits for Maintenance
- Worksheet 5 – Decoding IO-Link Data
- Worksheet 6 – Diagnostics: Process, Service, and Event Data
- Worksheet 7 – PLC and HMI Integration
- Worksheet 8 – Case Study — Standard vs IO-Link: The Numbers
- Worksheet 9 – Device Identity — Vendor ID, Device ID & PDin
- Worksheet 10 – PT100 Temperature Sensors — From Resistance to Process Data
- Worksheet 11 – CL50 Pro — PDout Encoding Deep-Dive

---

# Curriculum Front Page

---

## IO-Link Smart Sensor Training Kit — IM4330

**Courses:** CP3723 · CP7395  
**Level:** Introductory (CP3723) / Engineering (CP7395)  
**Format:** Self-paced, live hardware, browser-based HMI  
**Audience:** FE students and apprentices aged 16–18; T-Level / BTEC engineering programmes  
**Prerequisites:** Basic electrical knowledge. No IO-Link or programming experience required.

---

This training kit puts you in front of a real, running IO-Link sensor network. You will not watch a simulation — you will read live data from real sensors, write parameters that change how they behave, and fix faults you have injected yourself.

**CP3723 — Maintenance on Smart Sensors** walks you through each device in the kit: a photoelectric sensor, a proximity sensor, a capacitive sensor, a temperature sensor, and a programmable LED light stack. Nine guided worksheets take you from first contact with the hardware through commissioning, fault diagnosis, and a final practical assessment.

**CP7395 — Industry 4.0 IO-Link** goes beneath the surface. Eleven engineering worksheets decode the IO-Link protocol, map the data pipeline from sensor byte to HMI value, and build the commercial argument for IO-Link over conventional wiring.

**What you will use:**

| Hardware | Software |
|----------|----------|
| IFM AL1350 IO-Link Master | Raspberry Pi HMI Dashboard |
| Contrinex Photoelectric Sensor | FastAPI Backend + MQTT |
| Omron Proximity Sensor | Browser-based Worksheets |
| RS PRO Capacitive Sensor | Live ISDU Read/Write Controls |
| IFM TV7105 Temperature Sensor | Progress Tracking + JSON Export |
| Banner CL50 Pro LED Light Stack | |

---

# Packing List

Essentially the product will be sold as almost one complete tested unit.

Contents;

- IM4330: Training panel with the IFM AL1350 IO-Link master and all five IO-Link devices pre-mounted and wired.
- Raspberry Pi with WaveShare 1024×600 capacitive touchscreen, pre-loaded with the HMI dashboard software.
- 24 V DC power supply with UK, EU, and US plug adapters — feeds the IO-Link master, all sensors, and the Raspberry Pi (via an internal DC-to-DC converter on the panel).
- Patch cables and accessories for connecting the master, Pi, and network.

---

# Curriculum(s)

This product comes with two curriculums;

|     |     |
| --- | --- |
| **CP7395 – Industry 4.0 IO-Link** | **CP3723 – Maintenance on Smart Sensors** |
|     |     |

Click [here](https://www.matrixtsl.com/learning/) to download curriculum from our Learning Centre

---

# Main Components

Main Module

<div class="joplin-table-wrapper"><table><tbody><tr><td><p><strong>IO-Link Master – IFM AL1350</strong></p><ul><li><strong>Purpose:</strong> Central IO-Link master connecting all field devices to the network and HMI dashboard</li><li><strong>Key Features:</strong><ul><li>Four configurable IO-Link / digital-I/O ports</li><li>IoT Core REST + MQTT interface for live data push (500 ms)</li><li>Acyclic ISDU read/write for full device parameter access</li><li>On-board supervision: port voltage, current, and temperature</li></ul></li></ul></td><td><p><img alt="IFM AL1350 IO-Link Master" src=""></p></td></tr><tr><td><p><strong>Photoelectric Sensor – Contrinex LTR-M18PA-PMS-603</strong></p><ul><li><strong>Purpose:</strong> Detects objects optically; demonstrates light-based sensing over IO-Link</li><li><strong>Key Features:</strong><ul><li>M18 housing, IO-Link switch signal channel (SSC1)</li><li>Configurable switch point and output logic via ISDU</li><li>Teach-in, cancel, and factory-reset commands</li></ul></li></ul></td><td><p><img alt="Contrinex LTR-M18PA-PMS-603 Photoelectric Sensor" src=""></p></td></tr><tr><td><p><strong>Proximity Sensor – Omron E2E-X16MB1T12</strong></p><ul><li><strong>Purpose:</strong> Detects metal objects inductively; demonstrates discrete sensing and alarm flags</li><li><strong>Key Features:</strong><ul><li>OUT1 object-detected flag plus instability and over-approach alarms</li><li>Monitor-output amplitude value in process data</li><li>Switchpoint logic (NO/NC) configurable via ISDU</li></ul></li></ul></td><td><p><img alt="Omron E2E-X16MB1T12 Inductive Proximity Sensor" src=""></p></td></tr><tr><td><p><strong>Capacitive Sensor – Carlo Gavazzi / RS PRO M18</strong></p><ul><li><strong>Purpose:</strong> Detects presence of materials through non-metallic barriers</li><li><strong>Key Features:</strong><ul><li>M18 capacitive switch with IO-Link SSC1 channel</li><li>Switch point, quality-of-teach and quality-of-run parameters</li><li>Teach start / stop / cancel commands via ISDU</li></ul></li></ul></td><td><p><img alt="Carlo Gavazzi / RS PRO M18 Capacitive Sensor" src=""></p></td></tr><tr><td><p><strong>Temperature Sensor – IFM TV7105 (PT100)</strong></p><ul><li><strong>Purpose:</strong> Measures process temperature and demonstrates analogue-to-IO-Link conversion</li><li><strong>Key Features:</strong><ul><li>PT100 RTD element with IO-Link transmitter</li><li>Two independent switching outputs, each with switch point (SP) and reset point (RP) and hysteresis</li><li>Calibration offset adjustable via ISDU (±10 °C)</li></ul></li></ul></td><td><p><img alt="IFM TV7105 Temperature Sensor" src=""></p></td></tr><tr><td><p><strong>Light Stack – Banner CL50 Pro RGB</strong></p><ul><li><strong>Purpose:</strong> Multi-colour signal tower for visual system-state indication</li><li><strong>Key Features:</strong><ul><li>PDout-only IO-Link device controlled directly from the dashboard</li><li>16-colour palette, intensity, animation, and audible options</li><li>Software "breathing" intensity-sweep effect for status display</li></ul></li></ul></td><td><p><img alt="Banner CL50 Pro RGB Light Stack" src=""></p></td></tr><tr><td><p><strong>HMI – Raspberry Pi + WaveShare Touchscreen</strong></p><ul><li><strong>Purpose:</strong> Runs the touch HMI dashboard and hosts the data/MQTT services</li><li><strong>Key Features:</strong><ul><li>1024×600 capacitive touchscreen in kiosk mode</li><li>Real-time gauges, charts, and per-sensor IODD parameter cards</li><li>Connection diagnostics, latency graphs, and interactive worksheets</li></ul></li></ul></td><td><p><img alt="Raspberry Pi with WaveShare 1024x600 Touchscreen" src=""></p></td></tr></tbody></table></div>

---

# Frequently asked questions

**What software is needed to run the system?**

None. The system runs entirely self-contained — the included Raspberry Pi hosts the HMI dashboard and data services and boots straight into the touchscreen interface.

Optionally, the dashboard can be opened in any modern web browser on the same network, and a UI-only version is available online via GitHub Pages for demonstration.

**Does the kit come with curriculum materials?**

Yes. A full curriculum is included, complete with guided student worksheets and detailed teacher notes, available through the Matrix Learning Centre.

**What age group is this kit aimed at?**

It's designed for further and higher education students aged 16–20 studying engineering, automation, or maintenance.

**How many students can use the kit at once?**

It's ideal for 1 or 2 students working collaboratively. Two learners can comfortably work side-by-side during practical sessions.

**How is the system powered?**

Everything runs from a single 24 V DC supply. The Raspberry Pi receives 5 V via an internal DC-to-DC converter on the panel — there is no separate Pi supply. One adapter is included with UK, EU, and US plug heads. No mains wiring is required.

**Do the sensors need any special media or targets?**

No. The sensors detect ordinary objects placed in front of them — metal for the proximity sensor, general materials for the photoelectric and capacitive sensors — and ambient/applied temperature for the temperature sensor. No fluids or consumables are required.

**Is post-use maintenance required?**

Very little. Occasionally wipe the sensor faces and check cable connections.

**Can I change the sensor parameters?**

Yes. Every device parameter is readable and writable live from the dashboard via IO-Link ISDU, including switch points, output logic, and calibration. The worksheets guide students through safe parameter changes, and scenarios auto-restore the sensors afterwards.

**Does the system simulate faults?**

Yes. It includes software-injected faults written live to the sensors (e.g. inverted output logic, calibration drift, ISDU misconfiguration) and randomised fault-diagnosis scenarios to simulate real-world troubleshooting.

**How is the system stored?**

The entire kit, including the touchscreen, cables, and accessories, can be stored safely on a shelf or under a workbench. For long-term storage or transport, the kit can be placed back into its original shipping box for added protection.

**Is the system portable?**

Yes. The system is manageable by one person and designed for easy transport between classrooms or benches.

**Do I need a PC to operate it?**

No PC is needed for normal operation. The Raspberry Pi and touchscreen provide all necessary monitoring, configuration, and diagnostics.

**Is technical training required to use the kit?**

No prior experience is needed. The worksheets walk students through IO-Link operation, sensor configuration, faults, and diagnostics step-by-step.

**What is the warranty or support included?**

The product includes a standard 12-month warranty with full technical support from Matrix TSL.

---

# Tender Specification

Matrix Technology Solutions Ltd shall supply the **Maintenance of IO-Link Systems: Smart Sensors training system (Model IM4330)** with the following features, capabilities, and performance assurances:

**Hardware Specification**

- The system shall be constructed as a **compact bench-top training panel** with all devices pre-mounted and wired, suitable for desk-based educational environments.
- The system shall include an **IFM AL1350 IO-Link master** (IoT Core) providing four configurable IO-Link / digital-I/O ports with acyclic ISDU read/write.
- The system shall feature **finger-safe, low-voltage (24 V DC) wiring** and push-in connectors to allow easy maintenance and compact storage.
- The system shall include the following IO-Link device set:
    - A Contrinex LTR-M18PA-PMS-603 photoelectric sensor
    - An Omron E2E-X16MB1T12 inductive proximity sensor
    - A Carlo Gavazzi / RS PRO M18 capacitive sensor
    - An IFM TV7105 PT100 temperature sensor with dual switching outputs
    - A Banner CL50 Pro RGB light stack (signal tower)
- The system shall include a **Raspberry Pi with a 1024×600 capacitive touchscreen** running the HMI dashboard in kiosk mode.

**Control & Communication Features**

- The system shall communicate with field devices over **IO-Link** (IEC 61131-9) via the AL1350 master.
- The system shall deliver **real-time data by MQTT push at 500 ms**, with HTTP polling as an automatic fallback.
- The system shall provide a **web-based HMI dashboard** with live gauges, charts, per-sensor IODD parameter cards, and connection diagnostics.
- The system shall support the following communication interfaces:
    - **Ethernet** between the IO-Link master, MQTT broker, and Raspberry Pi
    - **Wi-Fi / LAN** for browser access to the dashboard from other devices on the network
- The system shall operate from a single **24 V DC power supply**, provided with global plug adapters for UK, EU, and US regions. The Raspberry Pi shall be powered at 5 V via an internal DC-to-DC converter on the panel board from the 24 V rail.

**Performance Expectations**

- The system shall display **real-time sensor values and device parameters** on the HMI dashboard and allow live ISDU read/write of all registered parameters.
- The system shall support **software-injected faults** written live to the sensors (e.g. inverted output logic, calibration drift, ISDU misconfiguration) and **randomised fault-diagnosis scenarios**.
- The system shall **auto-restore** sensors to a known-good state when a scenario is exited.
- The system shall issue **visual fault indicators** via the HMI dashboard, connection-diagnostics page, and status light stack.

**Software & Curriculum**

- The system shall be delivered with the **HMI dashboard software preloaded** on the Raspberry Pi for immediate training use.
- The system shall be accompanied by **two curriculums and 19+ guided worksheets**, aligned with UK T-Level and BTEC qualifications, covering:
    - IO-Link communication and Industry 4.0 concepts
    - Photoelectric, proximity, capacitive, and temperature sensing
    - Device commissioning and IODD parameter configuration
    - Process, service, and event data decoding
    - Status LED / light-stack interpretation
    - Fault diagnosis, sensor replacement, and maintenance decision-making
- The system shall include detailed **teacher notes** with expected learner outcomes and troubleshooting hints.
- The system shall provide **ongoing access** to digital curriculum updates and technical support via the Matrix Learning Centre.

**Quantity & Scope of Delivery**

- The system shall be delivered as a **fully assembled training panel**, including:
    - IFM AL1350 IO-Link master and all five IO-Link devices preinstalled
    - Raspberry Pi and touchscreen preloaded with the HMI dashboard
    - Cables and accessories
    - Global 24 V DC power supply (with internal DC-to-DC for Pi)
- Each kit shall be suitable for use by **1–2 students simultaneously**.
- The system shall be **factory tested and ready to operate** out of the box.

---

# Hardware Features

## Panel and Mounting

- **Bench-top training panel** — all components pre-mounted and wired; no assembly required.
- Panel dimensions: TBC (target ≤ 500 × 400 mm footprint).
- **M18 sensors** mounted on threaded bosses with locking nuts; quick-change via standard M12 5-pin quick-disconnect IO-Link cables — no tools required for sensor swap.
- **IFM AL1350** mounted on a DIN-rail section within the panel enclosure.
- **Banner CL50 Pro** column light mounted upright for clear visual indication across the bench.
- **Raspberry Pi and WaveShare display** mounted on a tilt-adjustable stand or integrated into the panel rear.
- Cable management via spiral wrap; all cables labelled.

## Materials

| Component | Material |
|-----------|----------|
| Sensor bodies (M18) | Nickel-plated brass |
| Sensor faces | PBT (polybutylene terephthalate), chemical-resistant |
| IO-Link Master housing | Glass-fibre reinforced PA (IFM AL1350 standard) |
| M12 cable jacket | PUR (polyurethane), oil-resistant, rated to 70 °C |
| Panel baseplate | Powder-coated mild steel or ABS, RAL 7035 light grey |
| Display bezel | ABS plastic |

## IP Ratings

| Component | IP Rating |
|-----------|-----------|
| IFM AL1350 | IP67 |
| Omron E2E Sensor | IP67 |
| RS PRO Capacitive Sensor | IP67 |
| IFM TV7105 | IP67 |
| Banner CL50 Pro | IP65 |
| Raspberry Pi (in stand) | IP0 — enclosed in stand |
| WaveShare Display (front) | IP54 |

---

# Control and Communication Capabilities

## HMI Interface

- **Browser-based dashboard** — runs in Chromium on the Pi kiosk, or in any modern desktop browser on the same network.
- Responsive layout: full sidebar at large screen widths; drawer sidebar in kiosk mode (1024×600).
- **Global display zoom** (50–150%) with kiosk white-space compensation; persists across sessions.
- **Multiple themes** (light / dark / industrial) via DaisyUI theme selector.
- **Touch-capable**: large hit targets, drag-to-scroll sidebar, designed for classroom touchscreen use.
- Per-sensor **IODD parameter cards** on the home dashboard — read and write setpoints, output logic, and calibration directly from the HMI.
- **Connection diagnostics page** — IO-Link latency graph, circuit-breaker state, MQTT status, log viewer.

## Communication Interfaces

| Interface | Specification |
|-----------|---------------|
| IO-Link | IEC 61131-9, COM2 / COM3; standard M12 3-wire cable, max 20 m |
| Ethernet | 10/100 Base-T between AL1350, switch, and Raspberry Pi |
| MQTT | MQTT 3.1.1; Mosquitto broker on Pi; 500 ms publish interval |
| WebSocket | ws:// on port 80, proxied by nginx — live HMI push |
| REST API | HTTP on port 80 at /api/ — ISDU read/write, config, diagnostics |
| Wi-Fi | Raspberry Pi 4 built-in 802.11ac — dashboard accessible from any device on the local network |
| LAN | Fixed IP or mDNS (iolink.local) for browser and SSH access |

## USB

- Raspberry Pi USB-A ports available for keyboard / mouse during setup.
- Progress JSON export can be saved to a USB drive via standard browser download.

## Remote Access

- **SSH**: standard OpenSSH server on Pi; accessible at `hamed@iolink.local` on the local network.
- **Remote Chromium debug**: port 9222 always open in kiosk mode for developer inspection.
- **Web dashboard**: accessible from any browser on the local network at `http://iolink.local`.

---

# Performance Expectations

## Real-Time Data

- HMI sensor values update every **500 ms** via MQTT push — no page refresh required.
- ISDU read/write response time: **< 200 ms** typical (browser → FastAPI → AL1350 → sensor → response).
- HTTP polling fallback rate: **1 Hz** per connected port; **0.2 Hz** per disconnected port.
- Circuit-breaker recovery time: **15 seconds** after 5 consecutive failures.
- WebSocket reconnects automatically on drop, with exponential back-off and jitter.

## Digital Control

- PDout writes to the CL50 light stack acknowledged within **< 200 ms** of HMI button press.
- Server-side intensity sweep cycles brightness at configurable step intervals (40 / 100 / 250 ms).
- ISDU parameter writes take effect at the **next IO-Link cycle** — typically < 5 ms after the AL1350 receives the command.

## Data Logging

- Chart series buffers: **50 data points** per series (memory-optimised for Raspberry Pi).
- Chart redraws: **once per 2 seconds** (flush-throttled to reduce CPU load).
- Student progress: **session-persistent** (browser sessionStorage); JSON export available at any time.
- Device tree (AL1350 /gettree): **5-minute cache** to reduce master load.

## System Load (Raspberry Pi 4)

- Chromium renderer CPU: approximately **97%** under normal kiosk operation.
- Python backend CPU: approximately **5%** (adaptive polling + MQTT subscription).
- Chart.js updates throttled; mimic components skip re-render when values unchanged.

---

# Electrical Safety Information

The **Maintenance of IO-Link Systems: Smart Sensors training system (Model IM4330)** is designed with safety in mind and complies with relevant low-voltage and EMC standards. Users must adhere to the following safety guidance to ensure safe and correct operation.

**Key Safety Notes**

- **Low Voltage Operation**:
    The system operates from a single **24 V DC** supply. The Raspberry Pi receives **5 V DC** via an internal DC-to-DC converter on the panel — there is no separate Pi power supply. The system does **not** require or tolerate direct connection to mains voltage. Doing so will result in damage and void the warranty.
- **Power Supply**:
    Use only the **supplied power adapter** with approved plug heads (UK, EU, US). It is a CE-marked unit with overvoltage and short-circuit protection.
- **Enclosure and Wiring**:
    All devices are mounted on a panel with finger-safe terminals and connectors. No exposed live connections are present under normal use.
- **Circuit Protection**:
    The 24 V supply is internally protected against overload and short-circuit. Do not bypass any protective device.

**Maintenance and Inspection**

- Only qualified personnel should service or inspect internal wiring.
- Regularly inspect external cables and sensor connectors for damage or wear.
- Do **not** modify wiring without referring to the system schematic and isolating power first.
- Always isolate power before disconnecting or reconnecting any device.

**Fault Handling**

- **Simulated Faults:**
    All training faults are software-injected via IO-Link ISDU or applied by changing what the sensors detect. They are for educational and simulation purposes only and do not affect electrical safety.
- **Recommended Power Isolation:**
    To fully isolate the system, switch off or unplug the 24 V DC supply. This cuts power to all components simultaneously.
- **Fault Indication:**
    The status light stack and HMI dashboard indicate fault or alarm states. Resolve any reported issue before continuing a training exercise.

---

# Standards Compliance

This system is designed for **educational and training use** and incorporates industrial-grade components and wiring practices. While it follows best practices in system layout and electrical safety, it is not intended for use in operational industrial environments.

The system aligns with the following standards **where applicable**:

- **IEC 61131-9** – Single-drop digital communication interface for small sensors and actuators (IO-Link) — the communication standard used throughout the system
- **EN 61010-1** – Safety requirements for electrical equipment for measurement, control, and laboratory use
- **Low Voltage Directive 2014/35/EU** – Applicable to included power supplies and components
- **RoHS Directive 2011/65/EU** – Restriction of hazardous substances compliance for electronic components

**Note**: This product is intended for educational use only and does not fall under the full scope of the **Machinery Directive 2006/42/EC**. It contains no actuators, moving parts, or safety-rated control functions and must not be relied upon for industrial safety purposes.
