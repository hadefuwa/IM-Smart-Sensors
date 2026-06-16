# CP0001 & CP0002 — All Questions with Correct Answers

Updated: 2026-06-16 (post-reshuffle — all answer letters reflect current code)  
Source: `src/worksheets-page.js` (CP0001) and `src/cp0002-page.js` (CP0002)

---

## CP0001 — Interactive Worksheets

---

### WS1 — Meet Your Kit

**Q1.** What colour is the IO-Link Master, and what is it sometimes called?

- **A: Orange — it is called the hub** ✓
- B: Blue — it is called the controller
- C: Green — it is called the gateway

---

**Q2.** Which sensor detects metal objects using an electromagnetic field?

- A: The capacitive sensor on Port 2
- B: The temperature sensor on Port 3
- **C: The proximity sensor on Port 1** ✓

---

**Q3.** What can the capacitive sensor detect that the proximity sensor cannot?

- A: Objects moving faster than 1 m/s
- **B: Materials like liquid or powder — even through a container wall** ✓
- C: The exact temperature of an object

---

**Q4.** What is the Raspberry Pi's job in this system?

- **A: It collects the sensor data, runs the comms, and serves up this dashboard** ✓
- B: It powers the IO-Link Master via USB
- C: It directly controls the light stack colours

---

**Q5.** During the challenge, what did you notice about the capacitive sensor?

- A: It only ever shows two states — on or off — same as a normal sensor
- B: It measured the exact distance between your hand and the sensor in millimetres
- **C: It showed a live level rising as your hand got close, before it fully triggered** ✓

---

### WS2 — What is a Smart Sensor?

**Q1.** A basic digital (on/off) proximity sensor fails and its output goes silent. What diagnostic information can a technician retrieve from it?

- **A: Nothing — the sensor just goes silent, you have to go and test it manually** ✓
- B: The exact fault code and which internal component has failed
- C: The last reading before it failed, stored in its internal log

---

**Q2.** A pressure transmitter outputs 12 mA on a 4–20 mA loop calibrated 0–100 bar. What is the pressure?

- A: 12 bar — the mA value equals the bar reading directly
- B: 0 bar — the sensor is in fault because 12 mA is below the normal 16 mA minimum
- **C: 50 bar — 12 mA is the midpoint of the 4–20 mA range, which maps to 50% of 100 bar** ✓

---

**Q3.** An IO-Link sensor still has OUT1 active. What does the IO-Link channel add on top?

- **A: Process data, fault codes, device identity, and remote parameter writes — all over the same 3-wire cable without interrupting OUT1** ✓
- B: It replaces OUT1 entirely — you only get the data stream, not a switching output
- C: A higher voltage signal so the PLC can tell it is an IO-Link device

---

**Q4.** Why choose an analogue sensor over a digital sensor for tank level monitoring?

- A: Analogue sensors are cheaper and easier to wire than digital sensors
- B: Analogue sensors send fault codes that digital sensors cannot
- **C: An analogue signal gives a continuous level reading — you see exactly how full the tank is, not just "full" or "empty"** ✓

---

**Q5.** In the IO-Link wire animation, what does the square wave at the bottom of the cable represent?

- A: The IO-Link data packets being encoded onto the wire
- **B: The standard switching output (OUT1) — still present and working exactly as a normal digital sensor, while the data stream runs above it** ✓
- C: The power supply waveform showing 24V DC to the sensor

---

**Fault Diagnosis Scenario** — Randomised fault each run; 5 possible faults. Answer revealed through the debug console hints and the answer option selected. No single correct letter — the correct option depends on which fault was injected that run.

---

### WS3 — The Proximity Sensor

**Q1.** What does the OUT1 chart do when metal is detected?

- **A: The line jumps from 0 to 1, then drops back to 0 when the metal moves away** ✓
- B: The line stays flat at 0 the whole time
- C: The line drops below zero when metal is detected

---

**Q2.** The Instability Alarm fires while OUT1 is ON. What does this tell you?

- A: The sensor has detected two metal objects at the same time
- B: The sensor cable has a loose connection
- **C: The target is near the edge of the sensing range — detection may be unreliable** ✓

---

**Q3.** The Over-Approach Alarm fires. What is the correct response?

- **A: Increase the standoff distance between the sensor face and the target** ✓
- B: Replace the sensor immediately — the over-approach alarm means it has failed
- C: Reduce sensitivity using the teach button

---

**Maintenance Scenario — Step 2 Diagnosis** (uses `data-ans` buttons, not A/B/C radio):

- **"Output logic parameter changed from NO to NC — inverts the switching behaviour"** ✓ (`data-ans="nc"`)
- "Sensor coil is damaged — mechanical impact during removal reversed the output" (`data-ans="hw"`)
- "IO-Link cable polarity swapped at the master connector — wiring error" (`data-ans="cable"`)

> *The correct diagnosis button is the first option in the list. JS checks `data-ans === 'nc'`.*

---

### WS4 — The Capacitive Sensor

**Q1.** What triggers a new count?

- A: Every second while your hand is touching
- B: Only when you pull your hand away
- **C: The moment detection goes from off to on — one touch = one count, no matter how long you hold it** ✓

---

**Q2.** Which materials can a capacitive sensor detect that a proximity sensor cannot?

- **A: Water and powder — even through a container wall** ✓
- B: Sound and light
- C: Heat and pressure

---

**Q3.** The capacitive sensor output is always ON even when nothing is near it. Most likely cause?

- **A: Sensitivity too high — it is detecting the container wall or nearby objects** ✓
- B: The sensor needs replacing immediately
- C: The cable is the wrong colour

---

### WS5 — The Temperature Sensor

**Q1.** What extra can you do with an IO-Link temperature sensor vs. a basic switch?

- A: Nothing extra — it works exactly the same as a switch
- B: It only works at high temperatures above 100 °C
- **C: See the actual live temperature in °C, trend it over time, and get early warning before the trip point is reached** ✓

---

**Q2.** Move SP1 just above current temperature and hold the sensor. What should happen?

- A: Nothing changes — the alarm only activates from the main dashboard
- **B: The alarm state turns red and shows "ABOVE THRESHOLD" once the temperature crosses your slider value** ✓
- C: The sensor turns itself off to prevent overheating

---

**Q3.** Temperature reading suddenly drops to −40 °C in a room-temperature lab. Most likely cause?

- **A: Broken or disconnected sensor — −40 °C is the bottom of the TV7105 measurement range and appears when the sensing element is open-circuit** ✓
- B: The lab is very cold
- C: The setpoint has been changed

---

**Calibration Scenario — Step 2 Diagnosis** (uses `data-ans` buttons):

- "Write +3.0 °C — add 3 degrees to the existing offset" (`data-ans="wrong-add"`)
- **"Write 0.0 °C — restore factory default (no offset)"** ✓ (`data-ans="correct"`)
- "Write −6.0 °C — apply a negative 6-degree correction" (`data-ans="wrong-neg"`)

> *The correct button is the second option. JS checks `data-ans === 'correct'`.*

---

### WS6 — The Light Stack

**Q1.** The CL50 is "PDout-only". What does that mean?

- **A: The master sends a command value TO the light — no measurement data comes back from the device to the master** ✓
- B: It only works with certain IO-Link masters
- C: It uses a separate digital output wire for each colour segment

---

**Q2.** The hex value `180101` is sent to the CL50. Which colour will it show?

- A: Green — Octet2 low nibble = 0x00
- B: Amber — 0x18 in Octet0 indicates Amber
- **C: Red — Octet2 low nibble = 0x01 = Red (index 1)** ✓

---

**Q3.** Flashing red will not turn off after the fault is cleared. Most likely cause?

- **A: The PLC is still sending a "red on" PDout command — the fault state is held in the controller, not the light itself** ✓
- B: The light stack hardware is broken
- C: IO-Link has lost connection to the light stack

---

**Q4.** Why is IO-Link PDout better than a traditional 3-wire digital light stack?

- A: It is always cheaper per unit due to IO-Link certification reducing manufacturing costs
- B: The colour cannot be changed once wired — it is safer
- **C: Full control of colour, animation, intensity, and speed over a single 3-pin cable — plus the HMI can read back the exact state without a separate feedback wire** ✓

---

**Maintenance Scenario (LST-0312) — Step 2 Diagnosis** (radio buttons, JS checks `sel.value === 'c'`):

- A: The CL50 hardware is malfunctioning — the amber segment is stuck and cannot be cleared by software
- B: IO-Link comms to Port 4 have dropped — the light is locked to its last received command and cannot be updated
- **C: The PLC output register is still holding the pre-maintenance fault PDout value (`184203` — Amber Flash). The normal-run value (`000100` — Green Steady) was never sent after the PLC restarted** ✓

---

### WS7 — Fault Finding and Replacement

> **Recall callout before scenario:**  
> IO-Link sensors use **NO (Normal Open, value 0)** or **NC (Normal Closed, value 1)** output logic via ISDU index 61 / sub 1.  
> NO: output ON when object detected. NC: output ON when nothing is detected (inverted).

**Maintenance Scenario — Step 2 Diagnosis** (radio buttons, JS checks `sel.value === 'c'`):

- A: IO-Link communication to Port 1 has dropped — the master is frozen on the last reported output state and cannot be updated
- B: The inductive sensor hardware has failed — the output transistor is shorted and permanently conducting regardless of whether an object is present
- **C: The sensor output logic is set to NC (Normal Closed) — in NC mode OUT1 is ON when nothing is detected and turns OFF when an object is present. This is the inverse of the correct NO (Normal Open) setting and causes the controller to see a permanent "object present" signal** ✓

---

### WS8 — Final Practical Assessment

> **Quick Reference (expandable callout in WS8):**  
> ISDU decode: raw decimal × scale factor = engineering value  
> Example: `01 F4` hex → 500 decimal → × 0.1 = **50.0 °C**  
> *int16 values above 32767 are negative (two's complement)*  
>  
> CL50 Colour Index (Octet2 low nibble):  
> 0=Green, 1=Red, 2=Orange, 3=Amber, 4=Yellow, 5=Lime, 6=Spring Green,  
> 7=Cyan, 8=Sky Blue, **9=Blue**, 10=Violet, 11=Magenta, 12=Rose, 13=White

---

**Task 2A — Hex Decode** (free-response; no radio buttons):

Index 583 (SP1) returns `01 F4` (int16, scale ×0.1). What is the setpoint?

**Answer: 50.0 °C** (0x01F4 = 500; 500 × 0.1 = 50.0)

---

**Task 3 — PDout Colour** (free-response; no radio buttons):

PDout value `000109` is sent to the CL50. What colour will it show?

**Answer: Blue** (Octet2 = 0x09; low nibble = 9 = Blue)

---

**Task 4 — Knowledge Check** (radio buttons; ANSWERS dict: `{ q1:'c', q2:'a', q3:'b', q4:'c' }`)

**Q1.** The Omron E2E instability alarm fires but OUT1 is still switching correctly. What is the right course of action?

- A: Ignore it — the output is working so there is no problem
- B: Replace the sensor immediately
- **C: Investigate — instability means the target is at the edge of sensing range. Small vibrations will cause intermittent output. Reposition the target or adjust the sensing distance before it causes a fault** ✓

---

**Q2.** After replacing the capacitive sensor on Port 2, its output is ON even with nothing near it. Re-teaching did not fix it. What is the most likely cause?

- **A: Output logic is set to NC — the sensor output is inverted so it is ON when nothing is present. Read the output logic parameter via ISDU to confirm, then write NO (0) to correct it** ✓
- B: The IO-Link cable polarity is reversed — swap Pin 2 and Pin 4 at the master connector
- C: SP1 is set correctly — the container wall is triggering the output and this is expected behaviour for a capacitive sensor

---

**Q3.** A temperature sensor reading drifts 3 °C high after months in service. No other system changes were made. What is the correct IO-Link field action?

- A: Replace the sensor — drift always indicates a faulty unit
- **B: Write a −3.0 °C calibration offset to the sensor via ISDU (index 681) to correct the reading in the field, verified against a reference thermometer** ✓
- C: Adjust SP1 down by 3 °C to compensate for the drift

---

**Q4.** What is the key advantage of the IO-Link light stack over a conventionally wired one?

- A: IO-Link light stacks use less power
- B: IO-Link light stacks can display more colours than conventional ones
- **C: All colours, animation patterns, and intensity levels are set by a single 3-byte PDout value over one standard cable. Conventional wiring needs a separate signal wire per segment** ✓

---

---

## CP0002 — Engineering Worksheets

---

### WS1 — Your System: A Technical Brief

**Q1.** What is the IP address of the AL1350 IO-Link Master?

- **A: 192.168.7.4** ✓
- B: 192.168.7.2
- C: 192.168.1.1

---

**Q2.** The AL1350 pushes data every 500 ms. How many WebSocket messages per second does the browser receive?

- A: 20 messages per second
- **B: 2 messages per second** ✓
- C: 500 messages per second — 500 ms equals 500 per second

> *Distractor C is the classic confusion between the period (500 ms) and the frequency (500 Hz).*

---

**Q3.** The Raspberry Pi has eth0 and wlan0. Why does this matter for the kit?

- A: It allows two IO-Link masters to be connected simultaneously
- B: It doubles bandwidth by bonding both interfaces for MQTT traffic
- **C: It bridges the isolated IO-Link subnet to the building LAN** ✓

---

**Q4.** How many IO-Link ports have a sensor connected in this kit?

- **A: 4 — Ports 1 through 4 each have a sensor** ✓
- B: 8 — every port on the AL1350 is populated
- C: 2 — only the photoelectric and capacitive sensors

---

### WS2 — How This App Works

**Q1.** Why is MQTT better suited than HTTP polling for 500 ms sensor delivery?

- **A: MQTT uses publish/subscribe so the AL1350 pushes data the moment it is ready, without the Pi having to request each cycle** ✓
- B: HTTP is push-based and uses persistent connections that the broker manages
- C: MQTT guarantees delivery of every message by queuing until the subscriber acknowledges receipt

---

**Q2.** The AL1350 loses its MQTT subscriptions on power-cycle. How does the backend handle this?

- A: It waits for the user to manually re-subscribe
- B: It switches permanently to HTTP polling
- **C: It calls `ensure_mqtt_subscription()` on every backend startup, re-registering the push subscription automatically** ✓

---

**Q3.** If the FastAPI backend crashed, what would you observe on this page?

- **A: Live data would stop and the WebSocket would disconnect** ✓
- B: The WebSocket message counter would continue to increment at the normal rate
- C: The AL1350 would automatically restart the backend service via its own built-in watchdog

---

**Q4.** What does consistently high round-trip latency on Connection Diagnostics indicate?

- A: The browser's chart rendering pipeline cannot keep up with the WebSocket update rate
- **B: The AL1350 is under load or there is congestion on the IO-Link subnet** ✓
- C: The Pi's Wi-Fi interface is saturated by other traffic on the building network

---

### WS3 — How Each Sensor Works (Protocol Level)

**Q1 (Port 1 — Proximity).** Raw PDin hex `0x01` — what is the switching output state?

- **A: Object detected (bit 0 = 1)** ✓
- B: No object detected
- C: Sensor fault

---

**Q2 (Port 2 — Capacitive).** Why is a detection count more useful than just the switching state?

- A: It gives a continuous analogue level reading rather than a binary on/off output
- B: It prevents false positives caused by water or foam near the sensor face
- **C: A running count tracks how many containers have been filled without a separate counter sensor** ✓

---

**Q3 (Port 3 — Temperature).** Raw PDin `0x02EE` decodes to what temperature?

- A: 7.5 °C — wrong scale factor (÷100 instead of ÷10)
- B: 750.0 °C — no scaling applied (raw decimal value)
- **C: 75.0 °C** ✓ (0x02EE = 750; 750 ÷ 10 = 75.0)

---

**Q4 (Port 4 — CL50).** Why does building a PDout command for the CL50 require more care than reading a proximity sensor's PDin?

- **A: Multiple fields — colour, animation, intensity, and speed — must be packed into specific bit positions across 3 bytes. One wrong bit changes the entire behaviour** ✓
- B: It uses a completely different IO-Link variant that the standard binary decoder cannot process
- C: The CL50 PDin arrives as a plain text string rather than binary bytes

---

### WS4 — Benefits for Maintenance

**Dropdown matching table** (classify each scenario as process / event / service):

| Scenario | Correct |
|----------|---------|
| Temperature value 23.5 °C arriving every 500 ms | **process** |
| Device replacement detected on Port 2 | **event** |
| Parameter read — filter time = 10 ms | **service** |
| Object present flag (switching output state) | **process** |
| Short circuit fault reported | **event** |

---

**Q2.** Which data type does the WebSocket push to the browser on every tick?

- **A: Process data (sensor values) + event data (faults/warnings) merged into a single JSON payload** ✓
- B: Service data only (parameters)
- C: Raw binary PDin only

---

### WS5 — Decoding IO-Link Data

**Calculation hover-to-reveal exercises:**

| Hex value | Type | Scale | Answer |
|-----------|------|-------|--------|
| `00 E6` | int16 | ×0.1 | **23.0 °C** (RP1) |
| `00 64` | uint16 | none | **100 counts** (SP1 capacitive) |
| `01 F4` | int16 | ×0.1 | **50.0 °C** (SP1 temperature) |

---

### WS6 — Diagnostics: Process, Service, and Event Data

**Dropdown classification:**

| Data item | Correct |
|-----------|---------|
| Temperature 23.5 °C arriving every 500 ms | **process** |
| Device replacement detected on Port 2 | **event** |
| Parameter read — filter time = 10 ms | **service** |
| Object present flag | **process** |
| Short circuit fault | **event** |

---

### WS7 — PLC and HMI Integration

**Q1.** How does IO-Link process data reach a PLC I/O scan cycle?

- A: The sensor connects directly to a PLC input card; the master acts only as a power supply
- B: The sensor transmits binary frames over Wi-Fi directly to the PLC's memory address
- **C: The IO-Link master maps each port's PDin into its process image; the PLC reads this via a fieldbus on every scan cycle** ✓

---

**Backend component matching (dropdown):**

| Function | Correct |
|----------|---------|
| Subscribing to AL1350 MQTT topics | **io_link_fastapi.py** |
| Decoding raw PDin into °C / object state / CL50 colour | **decoder.py** |
| Pushing decoded data to the browser | **io_link_fastapi.py** |

---

**Q3.** What is the key advantage of a web HMI over walking to the machine?

- A: Walking to the machine is always preferred because it provides a physical inspection opportunity
- B: A web HMI only functions when the machine has a stable internet connection
- **C: Faster fault identification, multi-machine monitoring, and historical trends without a site visit** ✓

---

**Q4.** What does a spike in the Connection Diagnostics latency graph tell you?

- **A: High latency on the IO-Link subnet or the AL1350 being overloaded** ✓
- B: The dashboard browser tab is consuming too much memory and slowing chart rendering
- C: The Pi's MQTT broker has stopped forwarding messages and is queueing them internally

---

### WS8 — Case Study: Standard vs IO-Link — The Numbers

**Q1.** What is the annual downtime saving when switching to IO-Link?
*(Standard: 40 faults × 35 min = 1,400 min = 23.3 h; IO-Link: 40 × 8 min = 320 min = 5.3 h)*

- **A: 18 hours per year** ✓
- B: 5.3 hours per year
- C: 23.3 hours per year

---

**Q2.** At £5,000/hour production value, what is the annual financial saving?

- A: £175,000
- B: £26,500
- **C: £90,000** ✓ (18 h × £5,000 = £90,000)

---

**Q3.** Beyond MTTR, which pair of benefits contributes most to lower total cost of ownership?

- A: Built-in wireless backup channel and automatic IP provisioning for all sensors
- **B: Automatic parameter restore on sensor swap and remote diagnostics via the HMI** ✓
- C: Lower per-unit sensor cost due to IO-Link certification subsidising manufacturing

---

**Q4.** Which data type would you export to a CMMS to automate maintenance work orders?

- **A: Event data (faults and warnings) — these are the triggers for maintenance actions** ✓
- B: Only process data (sensor values)
- C: Service data only (parameters)

---

### WS9 — Device Identity: Vendor ID, Device ID & PDin

**Q1.** What Vendor ID does Port 1 (Omron proximity) report?

- **A: 612** ✓
- B: 310
- C: 1586

---

**Q2.** Which manufacturer does Vendor ID 612 identify?

- A: ifm electronic
- **B: OMRON Corporation** ✓
- C: Balluff

---

**Q3.** Why does knowing the Device ID matter when ordering a spare?

- A: The master uses it to set the sensor's IP address on the IO-Link network
- B: It shows the sensor's remaining service life in hours
- **C: It uniquely identifies the exact model, so you order the right part first time and the master can restore parameters automatically after swap** ✓

---

**Q4.** Port 1 shows PDin byte 1 bit 4 set (instability alarm). Correct maintenance response?

- **A: Check sensor alignment — the target is likely at the edge of the sensing range** ✓
- B: No action — an instability alarm means the sensor passed its self-test
- C: Replace the sensor immediately — bit 4 means a permanent hardware fault

---

**Q5.** Port 2 shows Vendor ID 1586, Device ID 1052673. Which spare should you order?

- A: IFM TV7105 temperature sensor
- B: OMRON E2E-X16MB1T12 proximity sensor
- **C: RS Pro M18 capacitive sensor (Carlo Gavazzi OEM, product code 2377240)** ✓

---

### WS10 — PT100 Temperature Sensors

**Hex decode hover-to-reveal exercises:**

| PDin hex | Calculation | Answer |
|----------|-------------|--------|
| `01 2C FF 00` | 0x012C = 300; ÷10 | **30.0 °C** |
| `01 96 FF 00` | 0x0196 = 406; ÷10 | **40.6 °C** |
| `FF 9C FF 00` | 0xFF9C = −100 (int16 two's complement); ÷10 | **−10.0 °C** |
| `FE 70 00 00` | 0xFE70 = −400 (int16); ÷10 | **−40.0 °C** *(open-circuit default)* |

---

### WS11 — CL50 Pro PDout Encoding Deep-Dive

**Decode exercises (show-answers button):**

| PDout hex | Decoded meaning |
|-----------|----------------|
| `000100` | Green · Steady · Medium speed · High intensity — AL1350 startup default |
| `004312` | Orange/Red · Two Colour Flash · Fast · High intensity |
| `198205` | Lime Green · Flashing · Slow · Low intensity |

**Encode exercises:**

| Specification | Correct hex |
|--------------|-------------|
| Blue · Steady · Medium speed · High intensity | **180109** |
| Cyan/Magenta · Two Colour Flash · Fast · High intensity | **0043B7** |

---

*End of document.*
