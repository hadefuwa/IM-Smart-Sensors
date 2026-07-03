# Electrical Test Procedure
## IM4330 — IO-Link Smart Sensor Training System

| | |
|---|---|
| **Document No.** | LD0013 |
| **Title** | Electrical Test Procedure — IM4330 |
| **Applies To** | IM4330 production build (Curriculum Codes CP3723 · CP7395) |
| **Issue** | 1.0 |
| **Date** | 2026-07-03 |
| **Classification** | Internal — Production Test Record |
| **Supplier** | Matrix Technology Solutions Ltd — development@matrixtsl.com |

---

> **This procedure must be completed and signed off for every IM4330 unit before it is released from production.** A completed copy of this document (or its digital equivalent) forms part of the unit's build record and must be retained.

---

## Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [Referenced Documents](#2-referenced-documents)
3. [Safety Precautions](#3-safety-precautions)
4. [Test Equipment Required](#4-test-equipment-required)
5. [Unit Under Test — Identification](#5-unit-under-test--identification)
6. [Test 1 — Continuity Checks](#6-test-1--continuity-checks)
7. [Test 2 — Power-Up Sequence and Logic Verification](#7-test-2--power-up-sequence-and-logic-verification)
8. [Test 3 — Emergency Stop Test](#8-test-3--emergency-stop-test)
9. [Test 4 — Input/Output Test](#9-test-4--inputoutput-test)
10. [Test 5 — Sensor Simulation and Verification](#10-test-5--sensor-simulation-and-verification)
11. [Test 6 — Overload and Short-Circuit Protection Test](#11-test-6--overload-and-short-circuit-protection-test)
12. [Test 7 — Network Communication Loss Test](#12-test-7--network-communication-loss-test)
13. [Test 8 — Fail-Safe Behaviour Validation](#13-test-8--fail-safe-behaviour-validation)
14. [Final Sign-Off](#14-final-sign-off)
15. [Revision History](#15-revision-history)

---

## 1. Purpose and Scope

This procedure defines the mandatory electrical tests to be performed on every IM4330 IO-Link Smart Sensor Training System before it is dispatched to a customer. It confirms that:

- All power and signal wiring is correctly connected and free from shorts or opens
- The system powers up cleanly, in the correct sequence, and reaches a known-good operating state
- Every sensor input and actuator output on the panel is functional and correctly mapped to its port
- The 24 V DC supply's built-in protection responds correctly to an overload or short-circuit condition
- The system degrades safely and recovers automatically when network communication is interrupted
- The system returns to a safe, known default state after a fault, a communication loss, or a power cycle

This procedure applies to the standard 4-port IM4330 build (Proximity, Capacitive, Temperature, Light Stack). It does not cover software functional testing of individual worksheets — see the CP3723 and CP7395 curriculum documents for that.

> ℹ️ **Note on sensor fit:** `docs/manuals/PHOTOELECTRIC-SENSOR-REPLACEMENT.md` discusses an optional 5th photoelectric sensor position used on some earlier or customised builds. The standard production configuration validated by this procedure is the 4-port build listed in Section 5. If the unit under test has a photoelectric sensor fitted, confirm its port assignment against the works order before starting, and add an extra row to the port tables in Sections 6, 9, and 10.

## 2. Referenced Documents

| Document | Purpose |
|----------|---------|
| `docs/manuals/User Manual/user-manual.md` | Full technical specifications, safety notices, and acceptance checks (Section 4.3 reused here) |
| `docs/diagrams/IM4330 PID Schematic.docx` | Component register and wiring reference (tag numbers ZS-101, LS-201, TT-301, XAL-401, PSU-001, IL-001, EDG-001, HMI-001) |
| `docs/datasheets/Operating Manual.pdf` / `.txt` | IFM AL1350 manufacturer's manual — LED indicator definitions (Section 7.2) |
| `docs/manuals/port-config.md` | AL1350 port mode values and troubleshooting reference |
| `docs/manuals/PI_SSH.md` | Raspberry Pi SSH credentials for backend/log verification during test |
| CLAUDE.md (project root) | Current port assignment, device registry, and default startup behaviour |

## 3. Safety Precautions

> ⚠️ **The system operates from a single 24 V DC SELV supply (IEC 61140). There is no mains voltage present anywhere on the panel or its cabling under normal test conditions.** Do not connect any panel component directly to mains (230 V AC / 110 V AC).

- Switch off and disconnect the 24 V DC supply before making or breaking any wiring connection, including sensor M12 connectors and terminal block wiring.
- Handle the Raspberry Pi and AL1350 electronics with basic ESD precautions (antistatic wrist strap or mat) when the enclosure is open.
- The Banner CL50 Pro contains high-intensity LEDs — avoid prolonged direct eye contact at close range during Test 5 and Test 4, particularly at **High** intensity.
- The Contrinex/photoelectric position (if fitted) emits an infrared beam — do not look directly into the sensor face.
- Only personnel trained on this procedure and familiar with the IM4330 schematic should perform Test 6 (short-circuit test). Never short-circuit the 24 V rail directly across a live, connected sensor — use the designated test points described in Section 11.
- If any component shows smoke, unusual heat, or a burning smell at any point during this procedure, isolate power immediately, do not reconnect, and escalate to a supervisor before continuing.

## 4. Test Equipment Required

| Equipment | Purpose | Minimum Spec |
|-----------|---------|--------------|
| Digital multimeter (DMM) | Continuity, voltage, resistance | CAT II, 0.1 Ω / 0.01 V resolution |
| DC clamp meter or in-line multimeter | Current measurement | 0–3 A range, 1 mA resolution |
| RJ45 cable tester (optional) | Ethernet patch cable verification | Wiremap / continuity |
| Laptop/PC with SSH client | Backend log and service verification | Access to `docs/manuals/PI_SSH.md` credentials |
| Network switch / spare Ethernet cable | Simulating a link loss at a known point | — |
| Metal target (screwdriver or similar) | Triggering the proximity sensor | — |
| Non-metallic container of water or similar dielectric | Triggering the capacitive sensor | — |
| Stopwatch or timer | Timing power-up, reconnect, and recovery windows | — |

## 5. Unit Under Test — Identification

| Field | Value |
|-------|-------|
| Serial Number | ______________________ |
| Build Date | ______________________ |
| Software / Image Version | ______________________ |
| Tester Name | ______________________ |
| Test Date | ______________________ |

**Standard port configuration (confirm against the works order before starting):**

| Port | Tag No. | Device | Model |
|------|---------|--------|-------|
| 1 | ZS-101 | Proximity Sensor | Omron E2E-X16MB1T12 |
| 2 | LS-201 | Capacitive Sensor | RS Pro / Carlo Gavazzi M18 |
| 3 | TT-301 | Temperature Sensor | IFM TV7105 |
| 4 | XAL-401 | Light Stack (PDout only) | Banner CL50 Pro |
| — | IL-001 | IO-Link Master | IFM AL1350 (192.168.7.4) |
| — | EDG-001 | Edge Device | Raspberry Pi 4 (192.168.7.2) |
| — | PSU-001 | 24 V DC Power Supply | 24 V DC SELV, min 1.5 A |

**M12 connector pin assignment (all IO-Link ports, 4-pin A-coded):**

| Pin | Signal |
|-----|--------|
| 1 | +24 V supply |
| 2 | Digital input / secondary output (port-dependent) |
| 3 | 0 V (GND) |
| 4 | IO-Link C/Q |

---

## 6. Test 1 — Continuity Checks

**Objective:** confirm all power and signal wiring is correctly connected, with no shorts or unintended opens, before power is applied.

**Precondition:** 24 V DC supply switched OFF and disconnected from the mains/bench supply. All sensor M12 connectors, Ethernet cables, and the HDMI/DSI cable fitted and finger-tight.

| Step | Action | Expected Result | Pass / Fail |
|------|--------|-----------------|:---:|
| 1.1 | DMM continuity check: PSU-001 output (+24 V) to AL1350 power input terminal (X31, pin 1) | Continuity, < 1 Ω | ☐ |
| 1.2 | DMM continuity check: PSU-001 output (0 V) to AL1350 power input terminal (X31, pin 3) | Continuity, < 1 Ω | ☐ |
| 1.3 | DMM continuity check: +24 V (pin 1) at each populated M12 port (1–4) back to the terminal block | Continuity present at every port | ☐ |
| 1.4 | DMM continuity check: 0 V (pin 3) at each populated M12 port (1–4) back to the terminal block | Continuity present at every port | ☐ |
| 1.5 | DMM resistance check: +24 V to 0 V at each M12 port, sensor disconnected | No continuity (open circuit / > 1 MΩ) — confirms no short before power-up | ☐ |
| 1.6 | DMM resistance check: +24 V and 0 V to panel chassis / earth stud (if fitted) | No continuity — confirms rail isolation from chassis | ☐ |
| 1.7 | Inspect / continuity-test the Ethernet patch cable, AL1350 (IL-001) to network switch | Wiremap correct, all 8 conductors continuous | ☐ |
| 1.8 | Inspect / continuity-test the Ethernet patch cable, Raspberry Pi (EDG-001) to network switch | Wiremap correct, all 8 conductors continuous | ☐ |
| 1.9 | Visually confirm HDMI/DSI cable is fully seated between Raspberry Pi and WaveShare display | Connector fully seated, no visible damage | ☐ |
| 1.10 | Visually inspect all M12 connector locking rings | Rotate freely, click to locked position, no cross-threading | ☐ |

**Notes:**

---

## 7. Test 2 — Power-Up Sequence and Logic Verification

**Objective:** confirm the system energises correctly, in the correct sequence, and reaches a known-good operating state within the documented time window.

**Precondition:** Test 1 passed. All connections confirmed.

| Step | Action | Expected Result | Pass / Fail |
|------|--------|-----------------|:---:|
| 2.1 | Apply 24 V DC supply | US LED on AL1350 (voltage supply interface) illuminates green | ☐ |
| 2.2 | Measure voltage at PSU-001 output terminals | 24 V DC ± 10% (21.6–26.4 V) | ☐ |
| 2.3 | Measure voltage at AL1350 power input terminal (X31) | Within 0.5 V of PSU-001 output (cable drop check) | ☐ |
| 2.4 | Observe AL1350 RDY LED | Goes from device-reboot (off) → steady green ("Gateway functions properly") within ~10 s | ☐ |
| 2.5 | Observe AL1350 L/A LED on the port connected to the network switch | Steady/flashing green — Ethernet link established | ☐ |
| 2.6 | Confirm Raspberry Pi begins boot immediately on power application (per Section 4.2 of the User Manual, both the AL1350 and Pi power up simultaneously from the same 24 V rail via the panel's internal DC-DC converter) | Pi boot activity LED active; display shows the Matrix boot screen | ☐ |
| 2.7 | Time the boot sequence from power-on to HMI dashboard appearing | ≤ 60 s | ☐ |
| 2.8 | Observe WebSocket status indicator (top bar of HMI) | Shows **Connected** (green dot) within 2–3 s of the dashboard appearing | ☐ |
| 2.9 | Confirm each populated IO-Link port's IOL LED | Steady green — "Port configured as IO-Link: OPERATE state" | ☐ |
| 2.10 | On the IO-Link Master page, confirm all 4 ports show the correct device name and **IO-Link** mode | Matches Section 5 port table | ☐ |
| 2.11 | Home page temperature gauge reading | Shows ambient room temperature (typically 18–28 °C) | ☐ |
| 2.12 | Proximity sensor indicator (no target present) | **NO OBJECT**, monitor output ≈ 80 (free-air baseline) | ☐ |
| 2.13 | Capacitive sensor indicator (no target present) | **NO OBJECT** | ☐ |
| 2.14 | Light Stack (Banner CL50) at startup | Steady **green** (default PDout `000100`, written automatically on backend startup) | ☐ |

**Notes:**

---

## 8. Test 3 — Emergency Stop Test

**Objective:** confirm the correct emergency power-isolation behaviour for this product.

**Applicability — Not Applicable (by design).** The IM4330 is a low-voltage (24 V DC SELV) educational training system with no mechanical actuators, motors, or moving parts, and it has **no physical Emergency Stop button or circuit fitted**. This is confirmed in `docs/manuals/User Manual/user-manual.md`, Section 8.1 ("Emergency Power Isolation"). Emergency isolation on this product is achieved solely by removing the 24 V DC supply.

In place of a physical E-stop test, perform the following power-isolation check instead:

| Step | Action | Expected Result | Pass / Fail |
|------|--------|-----------------|:---:|
| 3.1 | With the system fully powered and running (post Test 2), unplug the 24 V DC supply | All components (AL1350, all sensors, Raspberry Pi, HMI display) lose power simultaneously — no component remains powered from a secondary source | ☐ |
| 3.2 | Confirm no smoke, arcing, unusual heat, or burning smell during isolation | None observed | ☐ |
| 3.3 | Reconnect the 24 V DC supply and confirm the system re-powers cleanly (repeat relevant checks from Test 2) | System boots normally, no residual fault state | ☐ |

**Notes:** if a future build variant is fitted with a physical E-stop, replace this section with a functional E-stop test (NC contact verification, monitored input state, and confirmation that release requires a deliberate reset action) before use.

---

## 9. Test 4 — Input/Output Test

**Objective:** confirm every sensor input and the light-stack output are correctly wired to their assigned port and respond through the full signal chain (sensor → AL1350 → backend → HMI).

**Precondition:** Test 2 passed.

| Port | Device | I/O Direction | Test Action | Expected Result | Pass / Fail |
|------|--------|---------------|-------------|-----------------|:---:|
| 1 | Proximity (Omron E2E) | Input (PDin) | Present a metal target to the sensor face, then remove it | OUT1 transitions 0→1 while present, 1→0 when removed; monitor output amplitude changes; HMI updates within 500 ms | ☐ |
| 2 | Capacitive (RS Pro/Carlo Gavazzi) | Input (PDin) | Present a non-metallic dielectric target (e.g. water container), then remove it | Detection output transitions 0→1 while present, 1→0 when removed; HMI updates within 500 ms | ☐ |
| 3 | Temperature (TV7105) | Input (PDin) | Warm the sensor body briefly by hand | Live °C reading rises smoothly and falls back after release; no dropout | ☐ |
| 4 | Light Stack (CL50 Pro) | Output (PDout) | From the Home page, write each quick-colour button (Red, Amber, Green) in turn | Light stack physically changes colour to match each command within 500 ms | ☐ |
| 4 | Light Stack (CL50 Pro) | Output (PDout) | Open the LED Config modal, select a non-default colour/animation/intensity combination, click Write | Hex preview matches the physical light output; light returns to default Green/Steady when re-selected | ☐ |
| — | AL1350 → Pi | Data path | Confirm the WebSocket message counter (Admin/Diagnostics page or WS1 of CP7395) increments at ≈ 2 messages/second | Matches the AL1350's 500 ms MQTT publish interval | ☐ |
| — | All ports | ISDU service call | From the Home page parameter card for any one sensor, issue an ISDU read (e.g. Proximity index 61/sub 1) | Read returns successfully with a valid value, confirming the acyclic service-data path (browser → FastAPI → HTTP → AL1350 → sensor) | ☐ |

**Notes:**

---

## 10. Test 5 — Sensor Simulation and Verification

**Objective:** exercise each sensor through a realistic trigger/release cycle and confirm the full decode chain (raw PDin hex → engineering value) is correct, not just that a value changes.

**Precondition:** Test 4 passed.

| Step | Action | Expected Result | Pass / Fail |
|------|--------|-----------------|:---:|
| 5.1 | Proximity: bring a metal target slowly toward the sensor face | Monitor output amplitude decreases smoothly as the target approaches (or increases, per sensor characteristic); OUT1 sets at the rated switching distance | ☐ |
| 5.2 | Proximity: bring the target very close to the sensor face | Instability Alarm and/or Over-Approach Alarm flags set correctly, matching the live indicator on the HMI | ☐ |
| 5.3 | Capacitive: present a target and observe the raw process value | Raw value rises smoothly as the target approaches — confirms continuous process data, not just a switched output | ☐ |
| 5.4 | Capacitive: trigger the sensor 3 times in succession | Detection counter (cumulative ISDU read) increments by exactly 1 per OFF→ON transition | ☐ |
| 5.5 | Temperature: compare the HMI reading to a calibrated reference thermometer at ambient | Within ± 1 °C of reference (TV7105 rated ± 0.1 °C resolution; allow for probe placement) | ☐ |
| 5.6 | Temperature: on the IO-Link Master page, perform a live ISDU read of SP1 (index 583) and RP1 (index 584) | Returned values match the defaults in Section 9.6 of the User Manual (SP1 = 60.0 °C, RP1 = 55.0 °C) unless the unit has been intentionally reconfigured | ☐ |
| 5.7 | Light Stack: command Amber/Flash, then Green/Steady | Physical colour and animation match the command in both cases; no residual flashing after the Green/Steady command | ☐ |
| 5.8 | Cross-check: on the IO-Link Master page, confirm each sensor reports the correct Vendor ID and Device ID | Matches the Device Registry in CLAUDE.md — confirms the correct physical sensor is fitted at each port, not a substitute | ☐ |

**Notes:**

---

## 11. Test 6 — Overload and Short-Circuit Protection Test

**Objective:** confirm the 24 V DC supply's built-in current-limit/short-circuit protection responds correctly, that the AL1350 correctly flags the affected port, and that the system recovers automatically once the fault is cleared. This product has **no separate fuse or breaker** — protection is provided entirely by the PSU's own current-limiting/foldback characteristic (per `docs/manuals/User Manual/user-manual.md` Section 1.1: "CE-marked with overvoltage, undervoltage, and short-circuit protection").

> ⚠️ **Do not create a short circuit directly across a live, connected sensor's M12 pins.** Use a spare/unused port, or a dedicated test lead across the terminal block test points, so that only the protection circuit — not a sensor — is exposed to the fault.

**Precondition:** Test 2 passed. Identify a safe test point (spare port pigtail, or terminal block test points) before starting.

| Step | Action | Expected Result | Pass / Fail |
|------|--------|-----------------|:---:|
| 6.1 | With the clamp meter/in-line multimeter on the 24 V feed, measure total system current draw under normal operation (all sensors connected, light stack steady) | Approximately 1.0–1.3 A (≈ 25–30 W ÷ 24 V per User Manual Section 2.1), well within the PSU's minimum 1.5 A rating | ☐ |
| 6.2 | Momentarily short +24 V to 0 V at the designated test point (brief contact only) | PSU output current-limits or shuts down; no damage to the supply or panel wiring | ☐ |
| 6.3 | Observe the IOL LED on the affected port (if the short was applied at a port pigtail) | Red, flashing 2 Hz — "Port configuration error or short circuit or overload" (per AL1350 Operating Manual, Section 7.2.3) | ☐ |
| 6.4 | Observe the remaining, unaffected ports during the short | Continue to operate normally — confirms per-port fault isolation | ☐ |
| 6.5 | Remove the short circuit | PSU output recovers to 24 V DC without manual reset; affected port's IOL LED returns to steady/flashing green within a few seconds | ☐ |
| 6.6 | Confirm on the HMI (Admin/Diagnostics or IO-Link Master page) that the affected sensor reconnects automatically with no manual intervention | Sensor re-appears with correct device name and live data resumes | ☐ |
| 6.7 | Re-measure total system current draw post-recovery | Matches the baseline recorded in Step 6.1, confirming no residual damage or leakage | ☐ |

**Notes:**

---

## 12. Test 7 — Network Communication Loss Test

**Objective:** confirm the system detects and reports loss of the Ethernet link between the AL1350 and the Raspberry Pi, and recovers automatically without manual intervention when the link is restored.

**Precondition:** Test 2 passed.

| Step | Action | Expected Result | Pass / Fail |
|------|--------|-----------------|:---:|
| 7.1 | With the system running normally, disconnect the Ethernet patch cable between the AL1350 (IL-001) and the network switch | AL1350's L/A LED goes off; HMI WebSocket status indicator turns amber (reconnecting), then red (disconnected) if the loss persists | ☐ |
| 7.2 | Time to red/disconnected state | Amber (transient) then red within the WebSocket reconnect back-off window; last known-good values remain displayed (not blank) | ☐ |
| 7.3 | Wait for 5 consecutive failed communication attempts | Backend circuit breaker opens — confirm via Admin/Diagnostics page ("Circuit State: OPEN") or backend log (`journalctl -u im-sensors-backend.service`) | ☐ |
| 7.4 | Reconnect the Ethernet patch cable | AL1350 L/A LED re-illuminates; circuit breaker recovers automatically after its 15 s timeout — no manual restart required | ☐ |
| 7.5 | Confirm MQTT subscription re-registers automatically (`ensure_mqtt_subscription()` on backend, or observe live data resuming) | Live sensor data resumes on the HMI within ~15–20 s of reconnection | ☐ |
| 7.6 | WebSocket status indicator | Returns to green (Connected) | ☐ |
| 7.7 | Repeat Steps 7.1–7.6 for the Raspberry Pi (EDG-001) ↔ network switch link, where the network switch also carries the AL1350 connection | Same graceful degradation and automatic recovery observed | ☐ |
| 7.8 | Confirm the kiosk HMI remains fully operational (menus, worksheet navigation) throughout the communication loss, with only live sensor data affected | HMI does not freeze or crash during the outage | ☐ |

**Notes:**

---

## 13. Test 8 — Fail-Safe Behaviour Validation

**Objective:** confirm the system always returns to a safe, known-default state after a fault condition, a communication loss, or a power cycle — with no manual sensor reconfiguration required.

**Precondition:** Tests 2, 6, and 7 passed.

| Step | Action | Expected Result | Pass / Fail |
|------|--------|-----------------|:---:|
| 8.1 | On the HMI, open any CP3723 worksheet with a live fault-injection scenario (e.g. WS3 — Proximity NC logic fault) and click **Start Scenario** | Fault is injected via ISDU write; anomaly is visible on the live panel | ☐ |
| 8.2 | Before completing the guided fix, navigate away from the worksheet | Auto-restore mechanism writes the correct default parameter back to the sensor automatically (per User Manual Section 5.4, Step 6) | ☐ |
| 8.3 | Confirm the sensor's output logic parameter (Proximity, index 61/sub 1) reads back to its default | Value = 0 (NO — Normal Open) | ☐ |
| 8.4 | Repeat Steps 8.1–8.3 for the Temperature calibration-offset scenario (index 681/sub 0) | Value returns to 0.0 °C | ☐ |
| 8.5 | Confirm the Light Stack (CL50) returns to its default state after a full backend restart (`sudo systemctl restart im-sensors-backend.service`) | Steady Green (PDout `000100`) — written automatically on every backend startup | ☐ |
| 8.6 | Perform a complete power cycle: unplug the 24 V supply, wait 30 s, reconnect | System reaches the same known-good state as Test 2, with no residual fault state carried over from before the power loss | ☐ |
| 8.7 | Confirm all sensor parameters listed in Section 9.6 of the User Manual (SP1/RP1/SP2/RP2, calibration offset, output logic) read back to their documented defaults after the power cycle | All match the reference defaults table | ☐ |
| 8.8 | Confirm the AL1350 automatically re-registers its MQTT subscription after the power cycle, with no manual action required | Live data resumes without SSH intervention | ☐ |

**Notes:**

---

## 14. Final Sign-Off

| Test | Result (Pass / Fail / N-A) |
|------|:---:|
| 1 — Continuity Checks | ☐ |
| 2 — Power-Up Sequence and Logic Verification | ☐ |
| 3 — Emergency Stop Test (N/A by design — see Section 8) | N/A |
| 4 — Input/Output Test | ☐ |
| 5 — Sensor Simulation and Verification | ☐ |
| 6 — Overload and Short-Circuit Protection Test | ☐ |
| 7 — Network Communication Loss Test | ☐ |
| 8 — Fail-Safe Behaviour Validation | ☐ |

**Overall Result:** ☐ PASS  ☐ FAIL  ☐ PASS WITH CONCESSION (details below)

Concession / deviation details (if any):

_______________________________________________________________

**Tested by:** ______________________  **Signature:** ______________________  **Date:** __________

**QA Reviewed by:** ______________________  **Signature:** ______________________  **Date:** __________

---

## 15. Revision History

| Issue | Date | Change | Author |
|-------|------|--------|--------|
| 1.0 | 2026-07-03 | First issue | Matrix Technology Solutions Ltd |

---

*LD0013 — Electrical Test Procedure, IM4330 Issue 1.0*
*Matrix Technology Solutions Ltd — development@matrixtsl.com*
