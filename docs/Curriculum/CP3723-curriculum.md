# CP3723 — Maintenance of IO-Link Systems: Smart Sensors
### Student Curriculum | IM4330 Training Kit

---

## Course Overview

| | |
|---|---|
| **Course Code** | CP3723 |
| **Title** | Maintenance of IO-Link Systems: Smart Sensors |
| **Level** | Level 3 |
| **Total Time** | 8–10 hours |
| **Worksheets** | 8 |
| **Assessment** | WS8 — Final Practical Assessment |

### What You Will Learn

By the end of this course you will be able to:

- Identify and describe the function of each device in an IO-Link sensor system
- Explain the difference between basic (on/off), analogue, and IO-Link smart sensors
- Read and interpret live process data from proximity, capacitive, temperature, and light stack devices
- Use the IO-Link Master HMI dashboard to monitor port status and sensor values in real time
- Perform acyclic service data (ISDU) reads and writes to inspect and change sensor parameters
- Diagnose and correct common sensor faults: inverted output logic (NC), calibration drift, and incorrect PDout state
- Describe the role of each component in the system — sensor, master, edge device, and dashboard
- Decode basic IO-Link hex values to engineering units

### System Overview

```
Sensors (Ports 1–4)          IO-Link Master         Edge Device         HMI Screen
─────────────────────        ──────────────         ───────────         ──────────
Proximity (Port 1)  ─M12──►  IFM AL1350     ─Eth──► Raspberry Pi ─HDMI──► Dashboard
Capacitive (Port 2) ─M12──►  (192.168.7.4)          (192.168.7.2)       (This screen)
Temperature (Port 3)─M12──►
Light Stack (Port 4)─M12──►
```

**Data flows left to right:** sensors send process data to the master every 500 ms, the master publishes it over MQTT to the Raspberry Pi, the Pi decodes it and pushes it to this browser via WebSocket.

### Equipment on the Bench

| Port | Device | Model | What It Does |
|------|--------|-------|--------------|
| 1 | Proximity Sensor | Omron E2E-X16MB1T12 | Detects metal objects — no contact, no beam |
| 2 | Capacitive Sensor | RS Pro / Carlo Gavazzi M18 | Detects liquid, powder, plastic through a wall |
| 3 | Temperature Sensor | IFM TV7105 | Reads temperature in °C — live value + alarms |
| 4 | Light Stack | Banner CL50 Pro | Colour/animation tower — PDout controlled |
| — | IO-Link Master | IFM AL1350 | Hub — all sensors plug in here |
| — | Edge Device | Raspberry Pi 4 | Runs the backend and serves this dashboard |

### Power Supply

- One **24V DC SELV** power supply feeds everything (safety extra-low voltage — safe to touch)
- The Raspberry Pi runs at 5V, supplied via an internal DC-to-DC converter from the 24V rail
- Do not connect anything to a mains socket other than the supplied power adapter

---

## WS1 — Meet Your Kit

**Estimated time:** 45–60 minutes | **Dashboard:** All Ports

### Why This Matters

Before you can maintain a system, you must be able to name every part, find it on the bench, and confirm it is working. This worksheet takes you from zero to confident — you will identify all five devices, see their live data on screen, and complete a hands-on challenge.

### Learning Objectives

- Identify all components in the IM4330 kit by name, location, and function
- Confirm each sensor is live on the dashboard
- Observe the difference between on/off switching and continuous analogue data
- Navigate the HMI dashboard to view port status

### Task 1 — Kit Identification Checklist

Find each item on the bench. Tick it off when you can see it and match it to the screen.

- [ ] **IO-Link Master (IFM AL1350)** — the orange box with numbered ports along the side. This is the hub. Everything else plugs into it.
- [ ] **Port 1 — Proximity Sensor (Omron E2E-X16MB1T12)** — the M18 barrel with a flat sensing face. Creates an electromagnetic field; detects metal objects with no contact and no light beam.
- [ ] **Port 2 — Capacitive Sensor** — the larger white M18 cylinder. Detects materials like liquid, powder, or plastic — even through a container wall.
- [ ] **Port 3 — Temperature Sensor (IFM TV7105)** — reads the temperature and sends back a live number in °C.
- [ ] **Port 4 — Light Stack (Banner CL50 Pro)** — the tall tower with coloured lights. Shows machine status at a glance from across the factory.
- [ ] **Edge Device (Raspberry Pi 4)** — small green circuit board in a case. Collects sensor data, runs the communications, and serves this dashboard.
- [ ] **This screen** — the live HMI dashboard. Everything the sensors say ends up here.

### Task 2 — Live Check

Open the Dashboard page. Confirm all four sensor ports show a green "connected" badge. The temperature sensor should display a value close to room temperature (~20–25 °C). The proximity sensor OUT1 should be 0 (no metal in front of it).

If any port shows offline — check the M12 cable connector is locked and tell your trainer.

### Task 3 — The Challenge

**Goal:** trigger the proximity sensor (Port 1) with a metal object (screwdriver, spanner) — but **do not** trigger the capacitive sensor (Port 2).

**Rules:**
- The proximity sensor must show OUT1 = 1 (DETECTED) for at least one second
- The capacitive sensor raw value must stay below the tolerance threshold (default: 30)
- If the capacitive value exceeds the threshold, the challenge fails — click Reset and try again
- You can adjust the tolerance slider (0–10,000) to make the challenge easier or harder

**What to notice:** the capacitive sensor shows a live rising value as your hand gets close — this is continuous process data. A basic on/off sensor would show nothing until the threshold was crossed.

### Knowledge Check

**Q1.** What colour is the IO-Link Master, and what is it sometimes called?

- A: Orange — it is called the hub
- B: Blue — it is called the controller
- C: Green — it is called the gateway

**Q2.** Which sensor on this kit detects metal objects using an electromagnetic field?

- A: The capacitive sensor on Port 2
- B: The temperature sensor on Port 3
- C: The proximity sensor on Port 1

**Q3.** What can the capacitive sensor detect that the proximity sensor cannot?

- A: Objects moving faster than 1 m/s
- B: Materials like liquid or powder — even through a container wall
- C: The exact temperature of an object

**Q4.** What is the Raspberry Pi's job in this system?

- A: It collects the sensor data, runs the comms, and serves up this dashboard
- B: It powers the IO-Link Master via USB
- C: It directly controls the light stack colours

**Q5.** During the challenge, what did you notice about the capacitive sensor that a normal on/off sensor wouldn't show you?

- A: It only ever shows two states — on or off — same as a normal sensor
- B: It measured the exact distance between your hand and the sensor in millimetres
- C: It showed a live level rising as your hand got close, before it fully triggered

---

## WS2 — What is a Smart Sensor?

**Estimated time:** 45–60 minutes | **Dashboard:** All Ports

### Why This Matters

Most sensors on a factory floor are simple on/off switches. Smart sensors send back far more — a live measured value, a fault code when something goes wrong, and a device identity that the system can read automatically. This worksheet explains the three sensor types and shows you what IO-Link adds on top of a standard digital output.

### Learning Objectives

- Distinguish between digital (on/off), analogue (4–20 mA), and IO-Link smart sensors
- Explain what IO-Link adds to a standard digital switching output
- Read and interpret sensor process data and fault flags on the live dashboard
- Understand the basics of MQTT and WebSocket data delivery

### Background — Three Types of Sensor Signal

| Type | Signal | What you get | What you lose |
|------|--------|-------------|---------------|
| Digital (on/off) | 24V / 0V switching | Simple and cheap | No value, no fault info |
| Analogue | 4–20 mA current loop | Continuous level reading | Slow, no identity, no faults |
| IO-Link | Serial digital over 3-wire cable | Process data + faults + identity + remote config | Requires IO-Link master |

**4–20 mA explained:** a transmitter at 4 mA means 0% of range, at 20 mA means 100% of range. The midpoint (12 mA) is always 50%. This lets the receiver detect a broken cable (0 mA, below the live range).

**What IO-Link adds on top of a switching output:**
- The standard OUT1 switching output still works exactly as normal
- On top of that, the IO-Link channel carries: live process value, fault codes, device identity (vendor, model, serial), and allows remote parameter reads and writes
- All over the same 3-wire M12 cable — no extra wires

### Task 1 — Signal Animations

Open WS2 and observe the three signal type animations:

- **Digital:** watch the LED indicator and square wave. The signal is either 0 or 24V — nothing in between
- **Analogue:** watch the oscilloscope. The mA value rises and falls smoothly — a continuous level
- **IO-Link:** watch the data packets (OUT1, Temp, Fault, Model, SP1, S/N) travel from the sensor to the master. Notice the square wave at the bottom — that is OUT1, still present, unchanged

**Key observation:** in the IO-Link animation the square wave (OUT1) continues while data packets travel above it. IO-Link does not replace the switching output — it runs alongside it.

### Task 2 — Live Sensor Observation

From the Dashboard page, observe the four sensors in real time. For each sensor, note:

| Sensor | What the live value shows | Is this process data or just on/off? |
|--------|--------------------------|--------------------------------------|
| Proximity (Port 1) | | |
| Capacitive (Port 2) | | |
| Temperature (Port 3) | | |
| Light Stack (Port 4) | | |

### Task 3 — Fault Diagnosis Scenario

Click **Start Scenario**. A fault is injected into the live system — one of five possible faults. Your job is to:

1. Watch the debug console — realistic status messages stream every 300 ms
2. Look for **amber [WARN] lines** — these appear every 8–10 entries and contain clues
3. Use the clues to select the correct fault from the options provided

The five possible faults are:
1. Temperature sensor reading exceeds SP1 setpoint (Port 3)
2. Proximity sensor OUT1 stuck HIGH — on with no metal present (Port 1)
3. Wrong device identity reported on Port 2 — temperature sensor instead of capacitive
4. IO-Link communication loss on Port 3
5. Master supply voltage drops below threshold (undervoltage)

After selecting the correct answer the scenario ends. The system restores itself automatically.

### Knowledge Check

**Q1.** A basic digital (on/off) proximity sensor fails and its output goes silent. What diagnostic information can a technician retrieve from it?

- A: Nothing — the sensor just goes silent, you have to go and test it manually
- B: The exact fault code and which internal component has failed
- C: The last reading before it failed, stored in its internal log

**Q2.** A pressure transmitter outputs 12 mA on a 4–20 mA loop calibrated 0–100 bar. What is the pressure?

- A: 12 bar — the mA value equals the bar reading directly
- B: 0 bar — the sensor is in fault because 12 mA is below the normal 16 mA minimum
- C: 50 bar — 12 mA is the midpoint of the 4–20 mA range, which maps to 50% of 100 bar

**Q3.** An IO-Link sensor still has OUT1 active. What does the IO-Link channel add on top?

- A: Process data, fault codes, device identity, and remote parameter writes — all over the same 3-wire cable without interrupting OUT1
- B: It replaces OUT1 entirely — you only get the data stream, not a switching output
- C: A higher voltage signal so the PLC can tell it is an IO-Link device

**Q4.** Why choose an analogue sensor over a digital sensor for tank level monitoring?

- A: Analogue sensors are cheaper and easier to wire than digital sensors
- B: Analogue sensors send fault codes that digital sensors cannot
- C: An analogue signal gives a continuous level reading — you see exactly how full the tank is, not just "full" or "empty"

**Q5.** In the IO-Link wire animation, what does the square wave at the bottom of the cable represent?

- A: The IO-Link data packets being encoded onto the wire
- B: The standard switching output (OUT1) — still present and working exactly as a normal digital sensor, while the data stream runs above it
- C: The power supply waveform showing 24V DC to the sensor

---

## WS3 — The Proximity Sensor

**Estimated time:** 60–75 minutes | **Dashboard:** Port 1 | **Sensor:** Omron E2E-X16MB1T12

### Why This Matters

The proximity sensor is the most common sensor type in a factory. It counts parts, confirms a door is closed, detects a robot arm reaching position. When it misbehaves — staying ON when there is nothing present, or flickering at the edge of its range — you need to be able to diagnose why without replacing it. This worksheet shows you what the sensor tells you via IO-Link, and uses ISDU to diagnose and fix a real fault.

### Learning Objectives

- Read live OUT1, monitor output, instability alarm, and over-approach alarm from the dashboard
- Understand what the monitor output (amplitude) represents and what it means for sensing reliability
- Identify the Instability Alarm and Over-Approach Alarm conditions and their correct responses
- Use ISDU read to inspect the output logic parameter (index 61 / sub 1)
- Use ISDU write to correct an inverted NC output logic fault

### Background — How an Inductive Proximity Sensor Works

The sensor face contains a coil that creates an oscillating electromagnetic field. When a metal target enters that field, eddy currents are induced in the metal, which damp the oscillation. The sensor electronics detect this damping and switch OUT1.

**Process Data from the Omron E2E via IO-Link:**

| Field | Meaning | Normal value (free air) |
|-------|---------|------------------------|
| OUT1 | Object detected | 0 (no object) |
| Monitor output | Oscillation amplitude — how strong the field is | ~80 (uint8) |
| Instability Alarm | Target near the edge of sensing range | 0 (clear) |
| Over-Approach Alarm | Target too close — sensor face contact risk | 0 (clear) |

**Output Logic — NO vs NC:**

| Parameter | Value | Behaviour |
|-----------|-------|-----------|
| NO (Normal Open) | 0 | OUT1 = 1 when object detected (default, correct) |
| NC (Normal Closed) | 1 | OUT1 = 1 when NO object detected (inverted) |

Output logic is stored as ISDU parameter: **index 61, subindex 1, dtype uint8**.

### Task 1 — Live Observation

Open WS3 and observe the proximity sensor live panel. Use a metal object (screwdriver or spanner) and:

1. Note the OUT1 state changes — what happens when metal enters the field?
2. Bring the metal very close to the sensor face — does the Instability Alarm or Over-Approach Alarm trigger?
3. What does the monitor output value do as the metal gets closer?
4. Remove the metal — does OUT1 return to 0 immediately?

### Task 2 — Knowledge Check (Part A)

**Q1.** What does the OUT1 chart do when metal is detected?

- A: The line jumps from 0 to 1, then drops back to 0 when the metal moves away
- B: The line stays flat at 0 the whole time
- C: The line drops below zero when metal is detected

**Q2.** The Instability Alarm fires while OUT1 is ON. What does this tell you?

- A: The sensor has detected two metal objects at the same time
- B: The sensor cable has a loose connection
- C: The target is near the edge of the sensing range — detection may be unreliable

**Q3.** The Over-Approach Alarm fires. What is the correct response?

- A: Increase the standoff distance between the sensor face and the target
- B: Replace the sensor immediately — the over-approach alarm means it has failed
- C: Reduce sensitivity using the teach button

### Task 3 — NC Logic Maintenance Scenario

A maintenance work order has been raised: *"Proximity sensor on Port 1 is detecting objects where none are present."*

Click **Start Scenario**. The system injects a fault by writing output logic NC (value 1) to index 61 / subindex 1 via ISDU. The sensor output will now be ON when nothing is present, and OFF when metal is detected.

Work through each step:

**Step 1 — Observe the anomaly.** Watch the OUT1 indicator. Is the sensor behaving correctly? Click *"I have observed the anomaly"* when ready.

**Step 2 — Diagnose the fault.** Select the correct diagnosis from the three options:
- "Output logic parameter changed from NO to NC — inverts the switching behaviour"
- "Sensor coil is damaged — mechanical impact during removal reversed the output"
- "IO-Link cable polarity swapped at the master connector — wiring error"

**Step 3 — Verify via ISDU read.** Click the ISDU Read button (index 61 / sub 1). Confirm the value returned is 1 (NC).

**Step 4 — Fix via ISDU write.** Write value **0** (NO) to index 61 / sub 1.

**Step 5 — Verify.** Hold a metal target near the sensor for 3 seconds. Confirm OUT1 is ON with metal present and OFF with nothing present.

**Step 6 — Sign off.** Tick all three checkboxes to confirm:
- [ ] I identified the fault correctly via ISDU read
- [ ] I corrected it via ISDU write
- [ ] Sensor output is now behaving correctly

> **Note:** if you navigate away at any point before completing the fix, the scenario auto-restores the sensor to NO (value 0) automatically.

---

## WS4 — The Capacitive Sensor

**Estimated time:** 45–60 minutes | **Dashboard:** Port 2 | **Sensor:** RS Pro M18 Capacitive

### Why This Matters

Capacitive sensors appear on filling lines, bin detectors, and anywhere a machine needs to sense a non-metallic material without contact. They are more sensitive than proximity sensors and easier to misadjust — a sensitivity setting that is too high will detect the container wall rather than the liquid inside. This worksheet shows you how to use IO-Link to check and correct sensitivity without physically adjusting the sensor.

### Learning Objectives

- Read live detection state and raw process value from the capacitive sensor
- Understand how SP1 (Switch Point 1) controls the detection threshold
- Use the detection counter to count discrete events
- Read and write SP1 via ISDU to set the correct detection threshold
- Issue a Teach command via ISDU to set SP1 from a reference target

### Background — How a Capacitive Sensor Works

The sensor measures the change in capacitance near its face. Any material with a different permittivity to air — water, oil, grain, plastic, glass — causes a measurable change. The sensor compares the live capacitance value to **SP1 (Switch Point 1)**: if the value exceeds SP1, OUT1 turns ON.

**Key parameters (RS Pro M18 Capacitive):**

| Parameter | ISDU Index | Subindex | dtype | What it does |
|-----------|-----------|---------|-------|-------------|
| SP1 (Switch Point 1) | 60 | 1 | int16 | Detection threshold — lower = more sensitive |
| QoT (Quality of Teach) | 75 | 0 | uint8 | Confidence of last teach operation (0–100%) |
| QoR (Quality of Reference) | 76 | 0 | uint8 | Confidence of reference measurement |
| Teach SP1 | Command | — | — | Sets SP1 from current target |

### Task 1 — Live Detection and Counter

Open WS4. Observe the capacitive sensor live panel:

1. Note the raw process value in free air (nothing near the sensor face)
2. Bring your hand or a container of water near the sensor face — watch the raw value change
3. Cross the SP1 threshold — OUT1 turns ON, the detection counter increments by 1
4. Remove your hand — OUT1 returns to 0, counter holds its value

**What triggers a count?** A count is triggered on the OFF→ON transition (rising edge). If you hold your hand in the detection zone, you get one count regardless of how long you hold it. Remove and re-present to get a second count.

### Task 2 — ISDU: Read SP1

Using the ISDU Read panel on WS4:
1. Read SP1: index 60, subindex 1, dtype int16
2. Note the current value
3. Compare it to the raw free-air value — is there a clear gap?

### Task 3 — ISDU: Adjust SP1

Try adjusting SP1 to make detection:
- **More sensitive:** write a lower value to SP1 (closer to the free-air value)
- **Less sensitive:** write a higher value to SP1 (further from the free-air value)

**Practical scenario:** a container with powder inside is not triggering detection reliably. What do you do? Lower SP1 to increase sensitivity — but not so low that the sensor detects the empty container wall.

### Knowledge Check

**Q1.** What triggers a new count?

- A: Every second while your hand is touching
- B: Only when you pull your hand away
- C: The moment detection goes from off to on — one touch = one count, no matter how long you hold it

**Q2.** Which materials can a capacitive sensor detect that a proximity sensor cannot?

- A: Water and powder — even through a container wall
- B: Sound and light
- C: Heat and pressure

**Q3.** The capacitive sensor output is always ON even when nothing is near it. Most likely cause?

- A: Sensitivity too high — it is detecting the container wall or nearby objects
- B: The sensor needs replacing immediately
- C: The cable is the wrong colour

---

## WS5 — The Temperature Sensor

**Estimated time:** 75–90 minutes | **Dashboard:** Port 3 | **Sensor:** IFM TV7105

### Why This Matters

Temperature is the most common process measurement in manufacturing. Overheating destroys motors, drives, and bearings. An IO-Link temperature sensor does more than a simple thermostat — it sends back a live °C value, supports two independent alarm outputs, and stores a calibration offset that can correct sensor drift in the field without replacement. This worksheet covers all three.

### Learning Objectives

- Read live temperature in °C and observe it as a trend
- Understand the TV7105 setpoint and reset point system (SP1, RP1, SP2, RP2)
- Adjust SP1 via slider and observe the alarm state change in real time
- Read and write SP1, RP1, SP2, RP2 via ISDU
- Diagnose and correct a calibration offset fault via ISDU write to index 681

### Background — TV7105 Setpoints and Reset Points

The TV7105 has two independent switching outputs (OUT1 and OUT2), each with its own Switch Point (SP) and Reset Point (RP):

| Index | Parameter | dtype | Scale | Role |
|-------|-----------|-------|-------|------|
| 583 | SP1 | int16 | × 0.1 | OUT1 switches ON when temperature rises above SP1 |
| 584 | RP1 | int16 | × 0.1 | OUT1 switches OFF when temperature falls below RP1 |
| 593 | SP2 | int16 | × 0.1 | OUT2 switches ON when temperature rises above SP2 |
| 594 | RP2 | int16 | × 0.1 | OUT2 switches OFF when temperature falls below RP2 |
| 681 | Calibration Offset | int16 | × 0.1 | Adds/subtracts a fixed offset to the displayed temperature (range ±10 °C) |

**Hysteresis — why SP and RP are different:**
If SP1 and RP1 were the same value, the output would chatter (switch on/off rapidly) when temperature hovers near the setpoint. The gap between SP and RP (the **deadband**) prevents this:

```
Temperature rising  →  crosses SP1  →  OUT1 turns ON
Temperature falling →  must fall below RP1 (not just SP1)  →  OUT1 turns OFF
```

**Constraint:** SP must always be above its own RP (same output). The sensor will silently reject an ISDU write that violates this. Always write RP before SP.

**Calibration Offset (index 681):**
After years in service, sensor elements can drift slightly. Rather than replacing the sensor, you write a correction value directly to the sensor via ISDU. If the sensor reads 3.0 °C too high, write −3.0 (value −30 at scale 0.1) to index 681. The correction is stored in the sensor and survives power cycles.

### Task 1 — Live Temperature and Alarms

Open WS5. Observe the live temperature panel:

1. Note the current temperature reading in °C
2. The worksheet auto-loads dynamic setpoints based on your live temperature:
   - SP2 = ambient + 1°C (pre-warning)
   - SP1 = ambient + 3°C (main alarm)
   - RP1 = ambient (OUT1 reset point)
   - RP2 = exact live temperature when the worksheet opened
3. Hold the sensor in your hand to warm it up — observe:
   - Does OUT2 alarm activate first (at SP2)?
   - Does OUT1 alarm activate next (at SP1)?
   - When you release the sensor, does OUT1 wait until temperature drops below RP1 before resetting?

### Task 2 — ISDU: Read and Write Setpoints

Using the ISDU panels in WS5:
1. Read SP1 (index 583, sub 0, int16, scale 0.1) — note the current value
2. Read RP1 (index 584, sub 0, int16, scale 0.1)
3. Adjust SP1 to 5°C above current temperature using the slider — confirm OUT1 alarm activates when you warm the sensor
4. Write a new RP1 value that provides at least 2°C of hysteresis below SP1

> **Write order matters:** always write RP first, then SP. Writing SP below the current RP is rejected by the sensor silently.

### Task 3 — Calibration Drift Scenario (Work Order CAL-0189)

*"Port 3 temperature sensor reads approximately 3 °C above reference thermometer. No other system changes made in the past month."*

Click **Start Scenario**. The system writes a +3.0 °C calibration offset to index 681 to simulate the reported fault.

Work through each step:

**Step 1 — Observe the drift.** The temperature reading should now appear ~3 °C above actual ambient. Click *"I have observed the drift"* when ready.

**Step 2 — Diagnose the cause.** Select the correct fix from three options:
- "Write +3.0 °C — add 3 degrees to the existing offset"
- "Write 0.0 °C — restore factory default (no offset)"
- "Write −6.0 °C — apply a negative 6-degree correction"

**Step 3 — ISDU read to confirm.** Read index 681, subindex 0. Confirm the value is 3.0 (offset = +3.0 °C).

**Step 4 — Fix via ISDU write.** Write value **0.0** to index 681 / subindex 0. This removes the offset and restores the factory default.

**Step 5 — Verify.** The reading must stay within ±1.5 °C of the pre-inject baseline for 3 continuous seconds.

**Step 6 — Sign off.** Tick all three checkboxes to complete.

> **Note:** navigating away at any point before completing the fix will auto-restore the calibration offset to 0.0 °C.

### Knowledge Check

**Q1.** What extra can you do with an IO-Link temperature sensor compared to a basic switch?

- A: Nothing extra — it works exactly the same as a switch
- B: It only works at high temperatures above 100 °C
- C: See the actual live temperature in °C, trend it over time, and get early warning before the trip point is reached

**Q2.** Move SP1 just above current temperature and hold the sensor. What should happen?

- A: Nothing changes — the alarm only activates from the main dashboard
- B: The alarm state turns red and shows "ABOVE THRESHOLD" once the temperature crosses your slider value
- C: The sensor turns itself off to prevent overheating

**Q3.** Temperature reading suddenly drops to −40 °C in a room-temperature lab. Most likely cause?

- A: Broken or disconnected sensor — −40 °C is the bottom of the TV7105 measurement range and appears when the sensing element is open-circuit
- B: The lab is very cold
- C: The setpoint has been changed

---

## WS6 — The Light Stack

**Estimated time:** 60 minutes | **Dashboard:** Port 4 | **Device:** Banner CL50 Pro

### Why This Matters

Every production cell has a light stack (also called a stack light or andon light). Conventionally, each colour segment needs its own wire from the controller. An IO-Link light stack like the Banner CL50 Pro replaces all those wires with a single 3-byte command over one M12 cable — colour, animation, speed, and intensity in one write. This worksheet shows you how that command works and what happens when the controller gets it wrong.

### Learning Objectives

- Understand PDout-only operation — the CL50 receives commands, it does not send measurements back
- Decode the 3-byte (6-hex-digit) PDout control word
- Write PDout commands to change colour, animation, intensity, and speed
- Diagnose a light stack showing the wrong state after a maintenance restart
- Understand that the light stack displays whatever the controller last sent — it cannot correct a wrong command itself

### Background — CL50 PDout Control Word

The entire light stack is controlled by a 3-byte (6 hex character) value written to PDout. There is no PDin — no measurement data comes back.

**PDout byte structure:**

| Byte | Bits | Field | Values |
|------|------|-------|--------|
| Octet 0 | [7:6] | Audible | 0=Off, 1=On, 2=Pulsed, 3=SOS |
| Octet 0 | [5:3] | Colour 2 Intensity | 0=High, 1=Low, 2=Medium, 3=Off |
| Octet 0 | [2:0] | Colour 1 Intensity | 0=High, 1=Low, 2=Medium, 3=Off |
| Octet 1 | [7:6] | Speed | 0=Medium, 1=Fast, 2=Slow |
| Octet 1 | [5:3] | Pulse Pattern | 0=Normal, 1=Strobe, 2=Three Pulse, 3=SOS, 4=Random |
| Octet 1 | [2:0] | Animation | 0=Off, 1=Steady, 2=Flash, 3=Two Colour Flash, 4=Intensity Sweep |
| Octet 2 | [7:4] | Colour 2 index | 0=Green, 1=Red, 2=Orange … 9=Blue … 13=White |
| Octet 2 | [3:0] | Colour 1 index | 0=Green, 1=Red, 2=Orange … 9=Blue … 13=White |

**Default startup state:** `000100` — Green, Steady, High intensity. This is written automatically when the system starts.

### Task 1 — Quick Colour Buttons

Open WS6 and use the colour buttons in the Port 4 card to:
1. Set the light stack to Red, Steady
2. Set it to Amber, Flash
3. Set it back to Green, Steady (the default safe state)

### Task 2 — Full Control Grid

Open the CL50 configuration modal. Try:
1. Setting Colour 1 = Blue, Animation = Two Colour Flash, Colour 2 = White, Speed = Slow
2. Observe the live hex preview in the modal — it shows the exact 6-character PDout value that will be written
3. Click Save and watch the light stack change

**Decode exercise:** what does `180101` mean?
- Octet 0 = `0x18` → Colour 1 Intensity bits [2:0] = 0 (High), Colour 2 bits [5:3] = 3 (Off) → 000 011 00 = 0x18
- Octet 1 = `0x01` → Animation bits [2:0] = 1 (Steady), Speed = Medium
- Octet 2 = `0x01` → Colour 1 low nibble = 1 (Red)
- **Answer: Red, Steady, High intensity**

### Task 3 — Maintenance Scenario LST-0312

*Work order LST-0312: "Light stack on production cell 4 is showing amber flash. Maintenance team has cleared the fault and confirmed the machine is running normally. Light stack will not return to green."*

Open the scenario. Observe the CL50 — it is showing Amber Flash. The fault has been cleared. Select the correct diagnosis:

- A: The CL50 hardware is malfunctioning — the amber segment is stuck and cannot be cleared by software
- B: IO-Link comms to Port 4 have dropped — the light is locked to its last received command and cannot be updated
- C: The PLC output register is still holding the pre-maintenance fault PDout value (`184203` — Amber Flash). The normal-run value (`000100` — Green Steady) was never sent after the PLC restarted

### Knowledge Check

**Q1.** The CL50 is "PDout-only". What does that mean?

- A: The master sends a command value to the light — no measurement data comes back from the device to the master
- B: It only works with certain IO-Link masters
- C: It uses a separate digital output wire for each colour segment

**Q2.** The hex value `180101` is sent to the CL50. Which colour will it show?

- A: Green — Octet 2 low nibble = 0x00
- B: Amber — 0x18 in Octet 0 indicates Amber
- C: Red — Octet 2 low nibble = 0x01 = Red (index 1)

**Q3.** Flashing red will not turn off after a fault is cleared. Most likely cause?

- A: The PLC is still sending a "red on" PDout command — the fault state is held in the controller, not the light itself
- B: The light stack hardware is broken
- C: IO-Link has lost connection to the light stack

**Q4.** Why is IO-Link PDout better than a traditional 3-wire digital light stack?

- A: It is always cheaper per unit due to IO-Link certification reducing manufacturing costs
- B: The colour cannot be changed once wired — it is safer
- C: Full control of colour, animation, intensity, and speed over a single 3-pin cable — plus the HMI can read back the exact state without a separate feedback wire

---

## WS7 — Fault Finding and Replacement

**Estimated time:** 60–75 minutes | **Dashboard:** All Ports

### Why This Matters

This worksheet is the closest thing to a real fault-finding call-out. A fault has been reported — the light stack gives you the first clue before you check anything else. You work through the system logically: check the light stack state, check the IO-Link Master page, identify the affected port, diagnose via ISDU, and write the fix. No answer is given — you must work it out.

### Learning Objectives

- Use the light stack as a first diagnostic indicator before examining individual sensors
- Navigate the IO-Link Master page to identify abnormal port behaviour
- Apply ISDU read and write to diagnose and correct an output logic fault
- Follow a systematic fault-finding process: observe → isolate → diagnose → fix → verify

### Background — Recall

Before starting:

> IO-Link sensors use **NO (Normal Open)** or **NC (Normal Closed)** output logic, stored at ISDU index 61 / subindex 1:
> - **NO (value 0):** OUT1 = 1 when an object is detected (default, correct behaviour)
> - **NC (value 1):** OUT1 = 1 when NO object is detected (inverted — looks like a permanent fault)

### The Scenario

A work order has been raised: *"Production cell: object presence sensor on conveyor is showing an object present at all times, even when the conveyor is empty."*

No other information is given.

**Step 1 — Check the light stack first.** Open the dashboard and look at Port 4. What state is the CL50 currently showing? Does it indicate a fault condition? This is how a maintenance technician would start — the andon light tells you something is wrong before you check individual sensors.

**Step 2 — Open the IO-Link Master page.** Check each port. Which port is showing an unexpected state? What does OUT1 show with no metal object in front of the sensor?

**Step 3 — Diagnose.** Select the correct fault from three options:
- A: IO-Link communication to Port 1 has dropped — the master is frozen on the last reported output state
- B: The inductive sensor hardware has failed — the output transistor is shorted and permanently conducting
- C: The sensor output logic is set to NC — OUT1 is ON when nothing is detected, and turns OFF when an object is present (inverse of correct NO behaviour)

**Step 4 — Fix.** Write the correct value to ISDU index 61 / subindex 1 to restore normal NO operation.

**Step 5 — Verify.** Confirm OUT1 is 0 with no metal present, and 1 when a metal object is brought close. The light stack should also return to its normal run state.

> There is no MCQ in this worksheet — the scenario IS the assessment. Work through it systematically.

---

## WS8 — Final Practical Assessment

**Estimated time:** 45–60 minutes | **Individual — no trainer support for Tasks 2A, 3, and 4**

### Overview

This is your individual assessment for CP3723. You will identify devices, decode sensor data, determine light stack colour from a PDout value, and answer four knowledge check questions. Tasks 2A, 3, and 4 are completed without support — they test what you have learned across WS1–WS7.

### Quick Reference

> **ISDU hex decode:**
> Raw hex → decimal → multiply by scale factor = engineering value
> Example: `01 F4` hex → 500 decimal → × 0.1 = **50.0 °C**
>
> *int16 values above 32767 (0x7FFF) are negative — use two's complement*
>
> **CL50 Colour Index (Octet 2 low nibble):**
> 0=Green, 1=Red, 2=Orange, 3=Amber, 4=Yellow, 5=Lime, 6=Spring Green,
> 7=Cyan, 8=Sky Blue, **9=Blue**, 10=Violet, 11=Magenta, 12=Rose, 13=White

---

### Task 1 — Device Identification

Open the IO-Link Master page. For each port, record:

| Port | Device name (from dashboard) | Vendor ID | Device type |
|------|------------------------------|-----------|-------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |

---

### Task 2A — ISDU Hex Decode

The temperature sensor on Port 3 returns the following value when SP1 (index 583, subindex 0) is read via ISDU:

**Raw hex value: `01 F4`**

The parameter dtype is **int16** and the scale factor is **× 0.1**.

**What is the setpoint in °C? Show your working.**

Working:

Answer: _____ °C

---

### Task 3 — PDout Colour Identification

The following PDout value is written to the CL50 light stack on Port 4:

**PDout: `000109`**

**What colour will the light stack show? Show your working using the Octet 2 colour table.**

Working:

Answer: _____

---

### Task 4 — Knowledge Check

Answer all four questions individually without support.

**Q1.** The Omron E2E instability alarm fires but OUT1 is still switching correctly. What is the right course of action?

- A: Ignore it — the output is working so there is no problem
- B: Replace the sensor immediately
- C: Investigate — instability means the target is at the edge of sensing range. Small vibrations will cause intermittent output. Reposition the target or adjust the sensing distance before it causes a fault

**Q2.** After replacing the capacitive sensor on Port 2, its output is ON even with nothing near it. Re-teaching did not fix it. What is the most likely cause?

- A: Output logic is set to NC — the sensor output is inverted so it is ON when nothing is present. Read the output logic parameter via ISDU to confirm, then write NO (0) to correct it
- B: The IO-Link cable polarity is reversed — swap Pin 2 and Pin 4 at the master connector
- C: SP1 is set correctly — the container wall is triggering the output and this is expected behaviour for a capacitive sensor

**Q3.** A temperature sensor reading drifts 3 °C high after months in service. No other system changes were made. What is the correct IO-Link field action?

- A: Replace the sensor — drift always indicates a faulty unit
- B: Write a −3.0 °C calibration offset to the sensor via ISDU (index 681) to correct the reading in the field, verified against a reference thermometer
- C: Adjust SP1 down by 3 °C to compensate for the drift

**Q4.** What is the key advantage of the IO-Link light stack over a conventionally wired one?

- A: IO-Link light stacks use less power
- B: IO-Link light stacks can display more colours than conventional ones
- C: All colours, animation patterns, and intensity levels are set by a single 3-byte PDout value over one standard cable. Conventional wiring needs a separate signal wire per segment

---

## Further Study

The **Further Study** section (accessible from the sidebar) provides eight self-paced chapters with interactive games, simulations, and knowledge checks. These extend the practical skills developed in CP3723 with background theory.

| Chapter | Title | Key Takeaway |
|---------|-------|-------------|
| 1 | Industry 4.0 & IoT | Less guessing, more data — use sensor data to plan repairs before failure |
| 2 | Smart Sensors & IO-Link | One cable: process data, parameters, diagnostics, and identity |
| 3 | 4–20 mA Analogue Signals | 12 mA = 50% of range — the mA value is not the engineering value |
| 4 | IO-Link in Depth | ISDU = acyclic service data; PDin/PDout = cyclic process data |
| 5 | Sensor Types and Selection | Proximity vs. capacitive vs. optical vs. ultrasonic — when to use each |
| 6 | Temperature Measurement | PT100 resistance curve, thermocouple vs. RTD, calibration drift |
| 7 | Electromagnetics | How inductive sensors generate and detect field disturbance |
| 8 | Device Identity | Vendor ID, Device ID, IODD — how the master auto-identifies a sensor |

---

## Assessment Summary

| Task | Format | Weighting | Notes |
|------|--------|-----------|-------|
| WS1–WS6 MCQs | Multiple choice (in-worksheet) | Formative | Immediate feedback on screen |
| WS3 NC Logic Scenario | Step-by-step ISDU task | Formative | Auto-restore on navigation |
| WS5 Calibration Scenario | Step-by-step ISDU task | Formative | Auto-restore on navigation |
| WS6 LST-0312 Scenario | Diagnosis selection | Formative | |
| WS7 Fault Finding | Full scenario — no hints | Formative | Semi-independent |
| WS8 Task 1 | Device identification | Summative | Trainer observes |
| WS8 Task 2A | Hex decode — free response | Summative | Individual, unaided |
| WS8 Task 3 | PDout colour — free response | Summative | Individual, unaided |
| WS8 Task 4 | 4-question MCQ | Summative | Individual, unaided |

Your progress through all worksheets is tracked on the **Student Progress** page (sidebar). You can export a JSON record of your session for your portfolio.

---

*CP3723 — Maintenance of IO-Link Systems: Smart Sensors*
*IM4330 Issue 1.0 | Matrix Technology Solutions Ltd | development@matrixtsl.com*
