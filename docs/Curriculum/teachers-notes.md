# Teacher's Notes
## Maintenance of IO-Link Systems: Smart Sensors — IM4330
### CP3723 · CP7395

**Issue:** 1.0  
**Date:** 2026-06-26  
**Supplier:** Matrix Technology Solutions Ltd — development@matrixtsl.com

---

> These notes are for the teacher or trainer only. Do not distribute to students.

---

## Contents

1. [Standards Alignment](#1-standards-alignment)
2. [Teaching Strategy](#2-teaching-strategy)
3. [Suggested Delivery Schedule](#3-suggested-delivery-schedule)
4. [Safety Briefing](#4-safety-briefing)
5. [Worksheet Answers — CP3723](#5-worksheet-answers--cp3723)
6. [Worksheet Answers — CP7395](#6-worksheet-answers--cp7395)

---

## 1. Standards Alignment

### 1.1 T-Level Technical Qualification in Engineering, Manufacturing & Processing

**Pathway: Maintenance, Installation & Repair of Engineering Systems**

| IM4330 Learning Activity | T-Level Core Component |
|--------------------------|------------------------|
| IO-Link communication, MQTT, ISDU parameter access | K1 — Engineering principles and systems theory |
| Sensor commissioning, setpoint and calibration write | K2 — Installation and commissioning of systems |
| Fault scenario diagnosis and corrective ISDU write | K3 — Maintenance, inspection and fault diagnosis |
| HMI dashboard operation, live data interpretation | K4 — Digital tools and monitoring systems |
| CP7395 WS4 — Benefits for Maintenance cost study | K5 — Commercial and business awareness |
| CP7395 WS7 — PLC and HMI Integration | K6 — Control systems and automation |
| CP7395 WS8 — Standard vs IO-Link: The Numbers | S1 — Problem-solving using data and analysis |
| All fault scenarios (observe → diagnose → fix → verify) | S2 — Systematic fault diagnosis methodology |

**Industry Placement Relevance:** The skills practised on this kit — reading live process data, writing ISDU parameters, diagnosing sensor faults, and interpreting a maintenance HMI — map directly to competencies expected during T-Level industry placements in automated manufacturing, utilities, and process industries.

---

### 1.2 NVQ / Level 3 Diploma in Engineering Maintenance

| Unit | IM4330 Coverage |
|------|----------------|
| Maintaining and Restoring Mechanical Systems | CP3723 WS7 — Fault Finding and Replacement (sensor swap procedure) |
| Maintaining Electrical/Electronic Equipment | CP3723 WS3–WS6 — sensor commissioning and ISDU configuration |
| Carrying Out Planned Maintenance | CP3723 WS5 — calibration offset scenario; maintenance schedule |
| Diagnosing and Correcting Faults | CP3723 WS7, WS8 — end-to-end fault diagnosis assessment |
| Using and Interpreting Engineering Data | CP7395 WS5 — PDin hex decode; WS10 — PT100 resistance curve |

---

### 1.3 BTEC Level 3 National Extended Certificate in Engineering

| Unit | IM4330 Coverage |
|------|----------------|
| Unit 1 — Engineering Principles | Sensor operating principles (CP3723 WS2–WS6) |
| Unit 3 — Engineering Product Design and Manufacture | System architecture (CP7395 WS1, WS2) |
| Unit 7 — Calculus to Solve Engineering Problems | 4–20 mA calculations (CP3723 WS2 Q2), hex decode (CP7395 WS5, WS10) |
| Unit 19 — Electronic Devices and Circuits | IO-Link physical layer, PDin bit structure (CP7395 WS3) |
| Unit 21 — Electronic Measurement and Testing | Live ISDU read, connection diagnostics latency (CP7395 WS6) |

---

### 1.4 IEC 61131-9 — IO-Link Standard

All hardware and communication used in this kit operates to **IEC 61131-9** (Single-drop digital communication interface for small sensors and actuators — IO-Link). Students work directly with the standard's concepts throughout both courses:

| Standard Concept | Where Covered |
|-----------------|---------------|
| Cyclic process data (PDin/PDout) | CP3723 WS3–WS6; CP7395 WS3, WS5 |
| Acyclic service data (ISDU) | CP3723 WS3–WS6; CP7395 WS3 |
| Event data (fault/warning flags) | CP7395 WS6 |
| Device identity (Vendor ID, Device ID) | CP7395 WS9 |
| IODD (IO-Link Device Description) | CP7395 WS3, WS9 |
| COM2/COM3 speed classes | CP7395 WS1 |

---

### 1.5 Industry 4.0 / Smart Manufacturing Alignment

CP7395 maps to the **Industry 4.0 pillars** commonly referenced in engineering apprenticeship and HNC/HND frameworks:

| I4.0 Pillar | CP7395 Coverage |
|-------------|----------------|
| Industrial IoT | WS1, WS2 — MQTT, WebSocket, Pi as edge device |
| Big Data / Analytics | WS5, WS10 — data decode; WS6 — diagnostics data |
| Smart Sensors | WS3, WS9 — protocol-level sensor operation |
| Predictive Maintenance | WS4, WS8 — maintenance economics and event data |
| Connectivity | WS7 — PLC/HMI integration; WS2 — network architecture |

---

## 2. Teaching Strategy

### 2.1 Overview

The curriculum uses three overlapping pedagogical modes. Most worksheets blend all three in sequence:

| Mode | Description | Where Used |
|------|-------------|-----------|
| **Guided** | Teacher or worksheet leads the student step-by-step with a defined outcome | WS1 (kit introduction), WS3–WS6 (sensor labs) |
| **Fault-Led** | A real fault is injected; the student must diagnose and fix it without knowing the answer | WS3 NC logic scenario, WS5 calibration scenario, WS7 maintenance scenario |
| **Discovery-Based** | Open-ended exploration; student observes and draws conclusions | WS1 challenge, WS2 signal animations, WS4 counter task |

### 2.2 Recommended Approach by Worksheet Type

**Introductory worksheets (WS1–WS2)**
Start here for all students regardless of prior knowledge. WS1's hands-on challenge (approaching the capacitive sensor, triggering the proximity sensor) creates an immediate physical connection to the hardware before any theory is introduced. Resist the temptation to explain everything upfront — let the MCQ at the end reveal gaps, then address them.

**Sensor labs (WS3–WS6)**
Each follows the same three-part structure: operating principle → live observation → fault scenario. The fault scenarios are the most valuable part. Do not preview the fault or hint at the diagnosis — students should experience genuine uncertainty. The debug console in WS2 and the ISDU reads in WS3/WS5 provide all the information needed.

**Fault finding (WS7)**
This worksheet uses the light stack as a first clue before the student looks at the sensor — mirroring real industrial practice where a visual indicator is the first sign of a problem. Encourage students to work through the CL50 state before jumping to the IO-Link Master page.

**Final assessment (WS8)**
This is an individual assessment activity. Students should not receive teacher support during Tasks 2A (hex decode), 3 (PDout colour), and 4 (knowledge check MCQ). Task 1 (device identification on the IO-Link Master page) is observational and can be supported.

**CP7395 engineering worksheets**
These are best delivered after CP3723 is complete, though WS1–WS4 can be used in parallel with CP3723 WS3–WS6 for mixed-ability groups. WS5 (Decoding IO-Link Data) requires prior exposure to hexadecimal — check this prerequisite before assigning it independently.

### 2.3 Grouping and Differentiation

- **Pairs** are the recommended grouping for CP3723. One student operates the HMI while the other handles the physical sensors; they swap for each worksheet.
- **Individual work** is appropriate for CP7395 (engineering theory and calculation exercises) and WS8 (final assessment).
- **Extension tasks:** Fast-finishing students can be directed to the Admin / Diagnostics page to explore the latency graph, or to the IO-Link Master page IODD parameter cards to read raw hex values and decode them manually.
- **Support:** The progress page tracks worksheet completion. Use it to identify students who have not visited certain worksheets and prompt them.

### 2.4 Common Misconceptions to Address

| Misconception | Correction |
|---------------|-----------|
| "IO-Link replaces OUT1" | IO-Link runs alongside OUT1 on the same cable — the switching output still works normally. (WS2 Q3) |
| "The mA value equals the engineering value" | 4–20 mA is a scaled range — 12 mA is the midpoint, not 12 bar / 12 °C. (WS2 Q2) |
| "NC means the sensor is broken" | NC (Normal Closed) is a valid configuration — output ON when nothing is present. It must be intentional. (WS3 scenario, WS7) |
| "Replace the sensor if the reading drifts" | Calibration offset (ISDU index 681) corrects drift in the field without replacement. (WS5 scenario, WS8 Q3) |
| "The instability alarm means the sensor has failed" | Instability means the target is near the edge of sensing range — reposition before it causes a fault. (WS3 Q2, WS8 Q1) |
| "500 ms publish interval means 500 messages per second" | 500 ms is the period — that is 2 messages per second. (CP7395 WS1 Q2) |

---

## 3. Suggested Delivery Schedule

### 3.1 CP3723 — Maintenance on Smart Sensors

Recommended for a **block delivery of 8–10 hours** or spread across **4–5 weekly 2-hour sessions**.

| Session | Worksheets | Suggested Time | Notes |
|---------|-----------|----------------|-------|
| 1 | WS1 — Meet Your Kit | 60–75 min | Allow extra time for the capacitive challenge — students often spend longer than expected. Debrief MCQ as a class. |
| 1 | WS2 — What is a Smart Sensor? | 45–60 min | Watch the three signal animations together before students attempt the fault diagnosis scenario. |
| 2 | WS3 — The Proximity Sensor | 60–75 min | The NC scenario is the first real fault injection — give students time to be confused before intervening. |
| 2 | WS4 — The Capacitive Sensor | 45–60 min | The detection counter is a quick win — useful for confirming ISDU access is working. |
| 3 | WS5 — The Temperature Sensor | 75–90 min | Longest worksheet. The calibration drift scenario (CAL-0189) requires reading, verifying, and a 3-second hold — allow time. |
| 3 | WS6 — The Light Stack | 60 min | Students enjoy the colour control. Use this to explain PDout before the hex decode in WS8. |
| 4 | WS7 — Fault Finding and Replacement | 60–75 min | Run as a semi-independent task. Resist prompting the diagnosis. |
| 4/5 | WS8 — Final Practical Assessment | 45–60 min | Individual assessment. Tasks 2A, 3, and 4 are unaided. |

**Total guided time:** approximately 8–10 hours

---

### 3.2 CP7395 — Industry 4.0 IO-Link

Recommended for a **block delivery of 10–12 hours** or spread across **5–6 weekly 2-hour sessions**. CP3723 should be complete before starting CP7395, or run in parallel from WS3 onwards.

| Session | Worksheets | Suggested Time | Notes |
|---------|-----------|----------------|-------|
| 1 | WS1 — Your System: A Technical Brief | 45 min | Good revision of CP3723 hardware from a technical perspective. |
| 1 | WS2 — How This App Works | 60 min | The Admin / Diagnostics page latency graph is a useful live demonstration. |
| 2 | WS3 — How Each Sensor Works (Protocol Level) | 75 min | Requires hexadecimal knowledge. Pre-check or introduce hex briefly first. |
| 2 | WS4 — Benefits for Maintenance | 45 min | The dropdown classification exercise (process / event / service) is the key activity. |
| 3 | WS5 — Decoding IO-Link Data | 60 min | Work through the first decode exercise together as a class before students attempt independently. |
| 3 | WS6 — Diagnostics: Process, Service, and Event Data | 45 min | Use alongside the live Admin page. |
| 4 | WS7 — PLC and HMI Integration | 60 min | No PLC is required — the concepts are illustrated via the HMI data flow. |
| 4 | WS8 — Case Study: Standard vs IO-Link | 45 min | The financial calculation (18 h × £5,000 = £90,000) benefits from a worked example on the board first. |
| 5 | WS9 — Device Identity | 45 min | Vendor ID lookup on the IO-Link Master page is a live activity — ensure the kit is running. |
| 5 | WS10 — PT100 Temperature Sensors | 60 min | The two's complement exercises need care — work through the −10.0 °C example as a class. |
| 6 | WS11 — CL50 Pro PDout Encoding | 60 min | The encode exercises (build the hex from scratch) are the most challenging task in CP7395. |

**Total guided time:** approximately 10–12 hours

---

## 4. Safety Briefing

Deliver this briefing to students before their first session. It should take approximately 5 minutes.

---

### Trainer Script

*"Before we start, a few important points about working with this kit safely."*

**Voltages**

*"The kit runs at 24 volts DC — the same voltage used on real factory floors. That's about the same as a car battery. It will not give you a dangerous shock under normal use, but you should treat it with respect. The Raspberry Pi also runs from this supply — there's an internal DC-to-DC converter on the panel that steps the 24 volts down to 5 volts for it."*

*"There is no mains voltage anywhere on this panel. Do not connect anything to a mains socket other than the supplied power adapter."*

**Cables and Connectors**

*"The sensors connect using M12 connectors — the round connectors with a locking ring. If you need to swap a sensor, turn off the 24-volt supply first, then twist the locking ring anticlockwise and pull. Don't yank the cable."*

*"If you see a damaged cable — cut jacket, bent connector, anything like that — tell me before using it. Don't patch it with tape."*

**Faults**

*"Some worksheets will ask you to start a fault scenario. This writes a software change to the sensor over IO-Link. It does not change any wiring. The sensor will behave differently — that's the point — but it is completely safe. When you navigate away from the worksheet, the sensor restores itself automatically."*

*"If for any reason you think something has gone wrong and the sensor isn't restoring, tell me. Don't try to fix it by unplugging sensors while the power is on."*

**Light Stack**

*"The Banner light stack on Port 4 contains bright LEDs. Don't stare directly into it at close range, especially when it's set to high intensity."*

*"The photoelectric sensor emits an infrared beam. You can't see it, but don't look directly into the sensor face."*

**If Something Goes Wrong**

*"If you smell burning, see smoke, or anything looks obviously wrong — don't touch anything. Just tell me. The only thing you should do yourself is unplug the power supply from the wall, which will cut all power to the kit immediately."*

*"Any questions before we start?"*

---

### Pre-Session Checklist (Trainer)

Before each session, verify:

- [ ] All M12 cable connectors are seated and locked
- [ ] No cables are kinked, pinched, or damaged
- [ ] The power supply is on and the HMI kiosk has loaded
- [ ] The IO-Link Master page shows all five devices connected
- [ ] The temperature sensor (Port 4) shows a plausible ambient reading (not −40 °C)
- [ ] The CL50 light stack shows steady green (default startup state)

---

## 5. Worksheet Answers — CP3723

---

### WS1 — Meet Your Kit

| Question | Answer | Explanation |
|----------|--------|-------------|
| Q1 | **A** | The IO-Link Master is orange and is sometimes called the hub. |
| Q2 | **C** | The proximity sensor on Port 1 detects metal using an electromagnetic field. |
| Q3 | **B** | The capacitive sensor can detect liquids and powders through a container wall. |
| Q4 | **A** | The Raspberry Pi collects sensor data, runs the communications, and serves the dashboard. |
| Q5 | **C** | The capacitive sensor showed a live rising level before fully triggering — not just on/off. |

---

### WS2 — What is a Smart Sensor?

| Question | Answer | Explanation |
|----------|--------|-------------|
| Q1 | **A** | A basic digital sensor goes silent on failure — no diagnostic information is available. |
| Q2 | **C** | 12 mA is the midpoint of the 4–20 mA range (8 mA span ÷ 2 = 4 mA above floor = 50%). 50% of 100 bar = 50 bar. |
| Q3 | **A** | IO-Link carries process data, fault codes, device identity, and remote parameter writes over the same 3-wire cable without interrupting OUT1. |
| Q4 | **C** | An analogue signal gives a continuous level reading, not just full/empty. |
| Q5 | **B** | The square wave at the bottom of the cable animation represents OUT1 — still present and working while the IO-Link data stream runs above it. |

**Fault Diagnosis Scenario**

This scenario is randomised on each run. Five possible faults are available:

| Fault | Clue in Debug Console |
|-------|-----------------------|
| 1 | Temperature sensor reading above SP1 setpoint — repeated `[WARN] Port3: Process value exceeds SP1` |
| 2 | Proximity OUT1 stuck HIGH — `[WARN] Port1: OUT1 asserted with no metal target in field` |
| 3 | Wrong device on Port 2 (temperature sensor instead of capacitive) — `[WARN] Port2: Device identity mismatch` |
| 4 | IO-Link comms loss on Port 3 — `[WARN] Port3: IO-Link connection dropped` |
| 5 | Master supply undervoltage — `[WARN] Supervision: Supply voltage below threshold` |

The correct answer option corresponds to whichever fault was injected. Hints cycle every 8–10 debug lines as amber `[WARN]` entries.

---

### WS3 — The Proximity Sensor

| Question | Answer | Explanation |
|----------|--------|-------------|
| Q1 | **A** | The OUT1 chart line jumps from 0 to 1 when metal is detected, then drops back to 0 on removal. |
| Q2 | **C** | The instability alarm means the target is near the edge of the sensing range — detection may be unreliable. |
| Q3 | **A** | Increase the standoff distance between the sensor face and the target to clear the over-approach alarm. |

**Maintenance Scenario — Diagnosis Step**

Correct answer: **"Output logic parameter changed from NO to NC — inverts the switching behaviour"**

The scenario writes value `1` (NC) to ISDU index 61, subindex 1 on the Omron E2E. The correct fix is to write value `0` (NO) to the same address. The verify step requires the student to confirm OUT1 is OFF with no metal present and ON with metal present for 3 continuous seconds.

> **Trainer note:** If a student navigates away before completing the fix, the system automatically restores NC→NO. If for any reason the auto-restore does not fire, manually write `0` to index 61/sub1 on Port 1 via the Home page IODD parameter card.

---

### WS4 — The Capacitive Sensor

| Question | Answer | Explanation |
|----------|--------|-------------|
| Q1 | **C** | A new count is triggered the moment detection goes from OFF to ON — one touch = one count regardless of hold time. |
| Q2 | **A** | Capacitive sensors can detect water and powder through container walls — proximity sensors cannot. |
| Q3 | **A** | Always-ON output with no target nearby indicates sensitivity is too high — it is detecting the container wall or nearby objects. Lower SP1 via ISDU. |

---

### WS5 — The Temperature Sensor

| Question | Answer | Explanation |
|----------|--------|-------------|
| Q1 | **C** | With IO-Link you see the actual live temperature in °C, can trend it over time, and receive early warning before the trip point is reached. |
| Q2 | **B** | The alarm state turns red and shows "ABOVE THRESHOLD" once the temperature crosses the slider value. |
| Q3 | **A** | −40 °C is the bottom of the TV7105 measurement range and appears when the sensing element is open-circuit — the most likely cause is a broken or disconnected sensor. |

**Calibration Drift Scenario (CAL-0189) — Diagnosis Step**

Correct answer: **"Write 0.0 °C — restore factory default (no offset)"**

The scenario writes `+3.0 °C` to ISDU index 681, subindex 0 (int16, scale 0.1 — raw value 30). The correct fix is to write `0.0 °C` (raw value 0). The verify step requires the student to confirm the reading returns to within ±1.5 °C of the pre-inject baseline for 3 continuous seconds.

> **Trainer note:** Auto-restore fires on navigation away from WS5. If manual restoration is needed, write `0` to index 681/sub0 on Port 4 via the Home page IODD parameter card.

**Dynamic Setpoints (set from live temperature on worksheet load)**

Setpoints are calculated relative to the live temperature reading when WS5 first loads:

```
base = ceil(current_temp)
SP2  = base + 1     (OUT2 pre-warning, ~1°C above ambient)
SP1  = base + 3     (OUT1 main alarm, ~3°C above ambient)
RP1  = base         (OUT1 resets at ambient)
RP2  = current_temp (OUT2 resets at exact room temp at load time)
```

Example at 27.3 °C ambient: SP2 = 29, SP1 = 31, RP1 = 28, RP2 = 27.3

---

### WS6 — The Light Stack (Status LED)

| Question | Answer | Explanation |
|----------|--------|-------------|
| Q1 | **A** | PDout-only means the master sends a command value TO the light — no measurement data comes back. |
| Q2 | **C** | Hex `180101`: Octet2 = `0x01`; low nibble = 1 = Red. |
| Q3 | **A** | Flashing red won't turn off because the PLC is still sending the "red on" PDout command — the fault state is held in the controller, not in the light itself. |
| Q4 | **C** | Full control of colour, animation, intensity, and speed over a single 3-pin cable, plus the HMI can read back the exact state without a separate feedback wire. |

**Maintenance Scenario (LST-0312) — Diagnosis Step**

Correct answer: **C** — The PLC output register is still holding the pre-maintenance fault PDout value (`184203` — Amber Flash). The normal-run value (`000100` — Green Steady) was never sent after the PLC restarted.

---

### WS7 — Fault Finding and Replacement

**Maintenance Scenario — Diagnosis Step**

Correct answer: **C** — The sensor output logic is set to NC (Normal Closed). In NC mode OUT1 is ON when nothing is detected and turns OFF when an object is present. This is the inverse of the correct NO (Normal Open) setting and causes the controller to see a permanent "object present" signal.

> **Key teaching point:** The light stack is the first clue in this scenario — the CL50 shows the fault colour before the student looks at the sensor. Encourage students to use the light stack state as their starting point, as a real maintenance engineer would.

---

### WS8 — Final Practical Assessment

**Task 1 — Device Identification** (observational, no fixed answer — student reads from live IO-Link Master page)

Expected findings:
- Port 1: Contrinex / RS PRO photoelectric sensor (or Omron proximity, depending on configuration)
- Port 2: Omron E2E-X16MB1T12 (or capacitive, depending on port assignment)
- Port 3: Carlo Gavazzi / RS PRO capacitive
- Port 4: IFM TV7105 temperature
- Port 5: Banner CL50 Pro light stack

**Task 2A — Hex Decode**

> Index 583 (SP1) returns `01 F4` (int16, scale ×0.1). What is the setpoint?

**Answer: 50.0 °C**

Working: `0x01F4` = 500 decimal → 500 × 0.1 = **50.0 °C**

**Task 3 — PDout Colour**

> PDout value `000109` is sent to the CL50. What colour will it show?

**Answer: Blue**

Working: Octet2 = `0x09` → low nibble = 9 → Colour index 9 = Blue

**Task 4 — Knowledge Check MCQ**

| Question | Answer | Explanation |
|----------|--------|-------------|
| Q1 | **C** | Instability alarm = target at edge of sensing range. Investigate and reposition — do not ignore or replace immediately. |
| Q2 | **A** | Output logic is NC — write value 0 (NO) via ISDU to correct the inverted output. |
| Q3 | **B** | Write −3.0 °C calibration offset to index 681 via ISDU. Replacing the sensor is unnecessary; adjusting SP1 doesn't fix the reading. |
| Q4 | **C** | All colours, animation, intensity, and speed are set by a single 3-byte PDout value. Conventional wiring needs a separate wire per segment. |

---

## 6. Worksheet Answers — CP7395

---

### WS1 — Your System: A Technical Brief

| Question | Answer | Explanation |
|----------|--------|-------------|
| Q1 | **A** | The AL1350 IO-Link Master IP address is 192.168.7.4. |
| Q2 | **B** | 500 ms publish interval = 2 messages per second (not 500). 500 ms is the period, not the frequency. |
| Q3 | **C** | eth0 and wlan0 allow the Pi to bridge the isolated IO-Link subnet (eth0) to the building LAN (wlan0). |
| Q4 | **A** | All four ports (1–4) have a sensor connected. Port 5 has the CL50 light stack. |

---

### WS2 — How This App Works

| Question | Answer | Explanation |
|----------|--------|-------------|
| Q1 | **A** | MQTT uses publish/subscribe — the AL1350 pushes data when ready. HTTP polling requires the Pi to request each cycle. |
| Q2 | **C** | `ensure_mqtt_subscription()` is called on every backend startup, re-registering the push subscription automatically after an AL1350 power-cycle. |
| Q3 | **A** | If the FastAPI backend crashed, live data would stop and the WebSocket would disconnect. |
| Q4 | **B** | Consistently high round-trip latency indicates the AL1350 is under load or there is congestion on the IO-Link subnet. |

---

### WS3 — How Each Sensor Works (Protocol Level)

| Question | Answer | Explanation |
|----------|--------|-------------|
| Q1 | **A** | PDin `0x01` — bit 0 is set = object detected. |
| Q2 | **C** | A running detection count tracks container fills without a separate counter sensor. |
| Q3 | **C** | `0x02EE` = 750 decimal; 750 ÷ 10 = **75.0 °C**. |
| Q4 | **A** | PDout requires packing multiple fields (colour, animation, intensity, speed) into specific bit positions across 3 bytes — one wrong bit changes everything. |

---

### WS4 — Benefits for Maintenance

**Dropdown Classification Exercise**

| Scenario | Correct Answer |
|----------|----------------|
| Temperature value 23.5 °C arriving every 500 ms | **process** |
| Device replacement detected on Port 2 | **event** |
| Parameter read — filter time = 10 ms | **service** |
| Object present flag (switching output state) | **process** |
| Short circuit fault reported | **event** |

| Question | Answer |
|----------|--------|
| Q2 | **A** — Process data + event data merged into a single JSON payload per WebSocket push |

---

### WS5 — Decoding IO-Link Data

**Calculation Exercises**

| Hex Value | Type | Scale | Answer |
|-----------|------|-------|--------|
| `00 E6` | int16 | × 0.1 | **23.0 °C** (RP1) — 0x00E6 = 230; 230 × 0.1 = 23.0 |
| `00 64` | uint16 | none | **100 counts** — 0x0064 = 100 |
| `01 F4` | int16 | × 0.1 | **50.0 °C** (SP1) — 0x01F4 = 500; 500 × 0.1 = 50.0 |

> **Trainer note:** For students new to hexadecimal, provide the conversion reference before assigning this worksheet. Two's complement (negative values) is explained in WS10 — refer to that if students encounter `FF xx` values here.

---

### WS6 — Diagnostics: Process, Service, and Event Data

**Dropdown Classification Exercise**

| Data Item | Correct Answer |
|-----------|----------------|
| Temperature 23.5 °C arriving every 500 ms | **process** |
| Device replacement detected on Port 2 | **event** |
| Parameter read — filter time = 10 ms | **service** |
| Object present flag | **process** |
| Short circuit fault | **event** |

---

### WS7 — PLC and HMI Integration

**Backend Component Matching**

| Function | Correct Answer |
|----------|----------------|
| Subscribing to AL1350 MQTT topics | `io_link_fastapi.py` |
| Decoding raw PDin into °C / object state / CL50 colour | `decoder.py` |
| Pushing decoded data to the browser | `io_link_fastapi.py` |

| Question | Answer | Explanation |
|----------|--------|-------------|
| Q1 | **C** | The IO-Link master maps each port's PDin into its process image; the PLC reads this via a fieldbus on every scan cycle. |
| Q3 | **C** | Faster fault identification, multi-machine monitoring, and historical trends without a site visit. |
| Q4 | **A** | A spike in the latency graph indicates high load on the IO-Link subnet or the AL1350 being overloaded. |

---

### WS8 — Case Study: Standard vs IO-Link — The Numbers

| Question | Answer | Explanation |
|----------|--------|-------------|
| Q1 | **A** | Annual downtime saving = 18 hours. Standard: 40 × 35 min = 1,400 min = 23.3 h. IO-Link: 40 × 8 min = 320 min = 5.3 h. Saving = 18 h. |
| Q2 | **C** | £90,000. 18 h × £5,000/h = £90,000. |
| Q3 | **B** | Automatic parameter restore on sensor swap and remote diagnostics via HMI are the primary TCO drivers beyond MTTR. |
| Q4 | **A** | Event data (faults and warnings) are the triggers for maintenance work orders to be raised in a CMMS. |

---

### WS9 — Device Identity: Vendor ID, Device ID & PDin

| Question | Answer | Explanation |
|----------|--------|-------------|
| Q1 | **A** | Port 1 (Omron E2E) reports Vendor ID 612. |
| Q2 | **B** | Vendor ID 612 = OMRON Corporation. |
| Q3 | **C** | Device ID uniquely identifies the exact model for ordering, and allows the master to restore parameters automatically after a swap. |
| Q4 | **A** | PDin byte 1 bit 4 = instability alarm — check alignment, the target is likely at the sensing range edge. |
| Q5 | **C** | Vendor ID 1586, Device ID 1052673 = RS Pro M18 capacitive sensor (Carlo Gavazzi OEM). |

---

### WS10 — PT100 Temperature Sensors

**Hex Decode Exercises**

| PDin Hex | Calculation | Answer |
|----------|-------------|--------|
| `01 2C FF 00` | 0x012C = 300; 300 ÷ 10 | **30.0 °C** |
| `01 96 FF 00` | 0x0196 = 406; 406 ÷ 10 | **40.6 °C** |
| `FF 9C FF 00` | 0xFF9C = −100 (int16 two's complement); −100 ÷ 10 | **−10.0 °C** |
| `FE 70 00 00` | 0xFE70 = −400 (int16 two's complement); −400 ÷ 10 | **−40.0 °C** *(open-circuit default)* |

> **Two's complement working for −10.0 °C:**  
> `0xFF9C` in binary = `1111 1111 1001 1100`  
> Invert all bits: `0000 0000 0110 0011` = 0x0063 = 99  
> Add 1: 99 + 1 = 100  
> Apply sign: −100 → −100 × 0.1 = **−10.0 °C**

---

### WS11 — CL50 Pro PDout Encoding Deep-Dive

**Decode Exercises**

| PDout Hex | Decoded Meaning |
|-----------|----------------|
| `000100` | Green · Steady · Medium speed · High intensity — AL1350 startup default |
| `004312` | Orange/Red · Two Colour Flash · Fast · High intensity |
| `198205` | Lime Green · Flashing · Slow · Low intensity |

**PDout byte structure reminder:**

```
Octet0: [7:6] Audible  [5:3] C2I (Colour 2 Intensity)  [2:0] C1I (Colour 1 Intensity)
Octet1: [7:6] Speed    [5:3] Pulse Pattern              [2:0] Animation
Octet2: [7:4] Colour 2 index                            [3:0] Colour 1 index
```

**Intensity values:** 0 = High · 1 = Low · 2 = Medium · 3 = Off · 4 = Custom  
**Animation values:** 0 = Off · 1 = Steady · 2 = Flash · 3 = Two Colour Flash · 4 = Intensity Sweep  
**Speed values:** 0 = Medium · 1 = Fast · 2 = Slow  
**Colour indices:** 0 = Green · 1 = Red · 2 = Orange · 3 = Amber · 4 = Yellow · 5 = Lime · 6 = Spring Green · 7 = Cyan · 8 = Sky Blue · 9 = Blue · 10 = Violet · 11 = Magenta · 12 = Rose · 13 = White

**Encode Exercises**

| Specification | Working | Correct Hex |
|--------------|---------|-------------|
| Blue · Steady · Medium speed · High intensity | Octet0: Audible=0, C2I=0, C1I=0 → `00`. Octet1: Speed=0, Pattern=0, Anim=1 → `01`. Octet2: C2=0, C1=9 (Blue) → `09`. | **`000109`** |
| Cyan/Magenta · Two Colour Flash · Fast · High intensity | Octet0: `00`. Octet1: Speed=1(Fast), Pattern=0, Anim=3(TwoColour) → `43`. Octet2: C2=11(Magenta), C1=7(Cyan) → `B7`. | **`0043B7`** |

---

## 7. Quick Reference Answer Key

One-page summary for use during live sessions. All full explanations are in Sections 5 and 6.

---

### CP3723 — MCQ Answers

| Worksheet | Q1 | Q2 | Q3 | Q4 | Q5 |
|-----------|----|----|----|----|-----|
| WS1 — Meet Your Kit | A | C | B | A | C |
| WS2 — What is a Smart Sensor? | A | C | A | C | B |
| WS3 — The Proximity Sensor | A | C | A | — | — |
| WS4 — The Capacitive Sensor | C | A | A | — | — |
| WS5 — The Temperature Sensor | C | B | A | — | — |
| WS6 — The Light Stack | A | C | A | C | — |
| WS7 — Fault Finding | *scenario only* | — | — | — | — |
| WS8 — Final Assessment (Task 4) | C | A | B | C | — |

---

### CP3723 — Scenario Answers

**WS2 — Fault Diagnosis (randomised — 5 possible faults)**

| Fault injected | Correct answer option |
|----------------|-----------------------|
| Temperature over SP1 (Port 3) | Option describing high temperature / SP1 exceeded |
| Proximity OUT1 stuck HIGH (Port 1) | Option describing output stuck / no metal in field |
| Wrong device identity on Port 2 | Option describing device identity mismatch |
| IO-Link comms loss on Port 3 | Option describing communication loss / port offline |
| Master supply undervoltage | Option describing supply voltage below threshold |

*The correct option always matches the fault. Hints appear in the debug console as amber `[WARN]` lines every 8–10 entries.*

---

**WS3 — Proximity Sensor: NC Logic Scenario**

| Step | Student action | Expected result |
|------|----------------|-----------------|
| Start Scenario | Click "Start Scenario" | OUT1 shows ON with nothing present |
| Observe | Click "I have observed the anomaly" | Diagnosis options appear |
| Diagnose | Select "Output logic changed from NO to NC" | ISDU read step unlocks |
| Read | ISDU read index 61 / sub 1 | Returns value 1 (NC) |
| Fix | ISDU write index 61 / sub 1, value **0** (NO) | Verify step appears |
| Verify | Hold metal target near sensor for 3 s | OUT1 ON with metal, OFF without — pass |
| Sign-off | Tick all 3 checkboxes | Close button enables |

*Auto-restore: navigating away at any step writes value 0 back to index 61/sub1 automatically.*

---

**WS5 — Temperature Sensor: Calibration Drift Scenario (CAL-0189)**

| Step | Student action | Expected result |
|------|----------------|-----------------|
| Start Scenario | Click "Start Scenario" | Reading rises ~3 °C above ambient |
| Observe | Click "I have observed the drift" | Diagnosis options appear |
| Diagnose | Select "Write 0.0 °C — restore factory default" | ISDU read step unlocks |
| Read | ISDU read index 681 / sub 0 | Returns value 3.0 (offset +3.0 °C) |
| Fix | ISDU write index 681 / sub 0, value **0.0** | Verify step appears |
| Verify | Reading stays within ±1.5 °C of pre-inject baseline for 3 s | Pass |
| Sign-off | Tick all 3 checkboxes | Close button enables |

*Correct diagnosis: second option — "Write 0.0 °C". Wrong options: "Write +3.0 °C" and "Write −6.0 °C".*  
*Auto-restore: navigating away writes 0.0 back to index 681/sub0 automatically.*

---

**WS6 — Light Stack: Maintenance Scenario (LST-0312)**

| Step | Student action | Expected result |
|------|----------------|-----------------|
| Observe | CL50 shows Amber Flash; work order says fault is cleared | Contradiction noted |
| Diagnose | Select option C | Correct — PLC still holding fault PDout value |

*Correct diagnosis: **C** — PLC output register still holding `184203` (Amber Flash). Normal-run value `000100` (Green Steady) was never sent after PLC restart.*

---

**WS7 — Fault Finding: NC Proximity + Light Stack**

| Step | Student action | Expected result |
|------|----------------|-----------------|
| Observe CL50 | Light stack colour indicates fault | First clue before touching sensor |
| Check IO-Link Master | Port 1 OUT1 shows ON with no metal target | Confirms sensor abnormality |
| Diagnose | Select option **C** | NC logic identified |
| Fix | ISDU write index 61 / sub 1, value **0** (NO) | Sensor restored |

*Correct diagnosis: **C** — output logic set to NC. OUT1 is ON when nothing is present and OFF when metal is detected — inverse of correct NO behaviour.*

---

**WS8 — Final Assessment: Free-Response Tasks**

| Task | Answer | Working |
|------|--------|---------|
| Task 2A — Hex decode SP1 `01 F4` | **50.0 °C** | 0x01F4 = 500 decimal; 500 × 0.1 = 50.0 |
| Task 3 — PDout `000109` colour | **Blue** | Octet2 = 0x09; low nibble = 9 = Blue |

---

### CP7395 — MCQ Answers

| Worksheet | Q1 | Q2 | Q3 | Q4 | Q5 |
|-----------|----|----|----|----|-----|
| WS1 — Technical Brief | A | B | C | A | — |
| WS2 — How This App Works | A | C | A | B | — |
| WS3 — Sensor Protocol Level | A | C | C | A | — |
| WS4 — Benefits for Maintenance (Q2) | — | A | — | — | — |
| WS7 — PLC & HMI Integration | C | — | C | A | — |
| WS8 — Case Study | A | C | B | A | — |
| WS9 — Device Identity | A | B | C | A | C |

---

### CP7395 — Classification & Calculation Answers

**WS4 & WS6 — Process / Event / Service Classification**

| Scenario | Answer |
|----------|--------|
| Temperature 23.5 °C arriving every 500 ms | **process** |
| Device replacement detected on Port 2 | **event** |
| Parameter read — filter time = 10 ms | **service** |
| Object present flag (OUT1 state) | **process** |
| Short circuit fault reported | **event** |

---

**WS5 — Hex Decode Calculations**

| Hex | Type | Scale | Answer |
|-----|------|-------|--------|
| `00 E6` | int16 | × 0.1 | **23.0 °C** |
| `00 64` | uint16 | none | **100 counts** |
| `01 F4` | int16 | × 0.1 | **50.0 °C** |

---

**WS7 — Backend Component Matching**

| Function | Answer |
|----------|--------|
| Subscribing to AL1350 MQTT topics | `io_link_fastapi.py` |
| Decoding raw PDin into engineering values | `decoder.py` |
| Pushing decoded data to the browser | `io_link_fastapi.py` |

---

**WS8 — Case Study Calculations**

| Question | Working | Answer |
|----------|---------|--------|
| Annual downtime saving | Standard: 40 × 35 min = 1,400 min. IO-Link: 40 × 8 min = 320 min. Saving = 1,080 min = **18 hours** | **A — 18 hours** |
| Annual financial saving | 18 h × £5,000/h | **C — £90,000** |

---

**WS10 — PT100 Hex Decode**

| PDin Hex | Answer |
|----------|--------|
| `01 2C FF 00` | **30.0 °C** (0x012C = 300; ÷10) |
| `01 96 FF 00` | **40.6 °C** (0x0196 = 406; ÷10) |
| `FF 9C FF 00` | **−10.0 °C** (0xFF9C = −100 two's complement; ÷10) |
| `FE 70 00 00` | **−40.0 °C** (0xFE70 = −400; ÷10 — open-circuit default) |

---

**WS11 — CL50 PDout Decode & Encode**

*Decode:*

| Hex | Answer |
|-----|--------|
| `000100` | Green · Steady · Medium · High intensity |
| `004312` | Orange/Red · Two Colour Flash · Fast · High |
| `198205` | Lime Green · Flashing · Slow · Low intensity |

*Encode:*

| Specification | Answer |
|--------------|--------|
| Blue · Steady · Medium · High | **`000109`** |
| Cyan/Magenta · Two Colour Flash · Fast · High | **`0043B7`** |

---

*End of Teacher's Notes — IM4330 Issue 1.0*

*Not for student distribution.*
