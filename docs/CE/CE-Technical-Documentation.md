# CE Technical Document

## EU Declaration of Conformity

**Manufacturer:**
Matrix Technology Solutions Ltd
The Factory
33 Gibbet Street, Halifax
West Yorkshire, HX1 5BA
United Kingdom

**Product Description:**
IO-Link Smart Sensors Training & Demonstration Kit
Model: `[TBC]`

**Comprising:**
IFM AL1350 IO-Link Master, IFM TV7105 IO-Link temperature sensor, Carlo Gavazzi/RS PRO capacitive M18 proximity sensor, Omron E2E-X16MB1T12 inductive proximity sensor, Banner CL50 Pro RGB status light, Raspberry Pi–based HMI dashboard with touchscreen, enclosure, cabling and 24 V DC power supply. The system is a benchtop/panel-mounted training rig designed for educational environments to teach IO-Link communication, IODD-based sensor parameterisation, and industrial HMI monitoring.

**Serial Numbers / Batch Numbers:** `[TBC]`

We hereby declare under our sole responsibility that the above-mentioned product conforms to the following applicable EU Directives:

- Machinery Directive (2006/42/EC) — **not applicable**: the standard configuration contains no hazardous moving parts (see [Protection Against Mechanical Hazards](#protection-against-mechanical-hazards)); re-assess if a motorised demonstration target variant is introduced
- Low Voltage Directive (2014/35/EU) — **out of scope by voltage** on the field side (SELV/PELV, 20–30 V DC per the AL1350 and sensor manuals); the mains-connected power supply unit is to be separately assessed against LVD as a component — see [Technical Information](#technical-information)
- Electromagnetic Compatibility (EMC) Directive (2014/30/EU) — applies
- RoHS Directive (2011/65/EU as amended by 2015/863) — applies

**Applied Harmonised Standards:**

- EN ISO 12100:2010 — Safety of machinery, risk assessment principles (applied as the assessment methodology throughout this document)
- EN 61010-1:2010 — Safety requirements for electrical equipment for measurement, control, and laboratory use
- EN IEC 61326-1:2021 — EMC requirements for electrical equipment for measurement, control, and laboratory use
- EN 50178 — Electronic equipment for use in power installations (SELV/PELV, referenced directly by the AL1350 and TV7105 manufacturer manuals)
- EN 60204-1:2018 — Electrical equipment of machines — not applied; product falls outside Machinery Directive scope in its standard configuration

**Technical Documentation Includes:**

- Product description and intended educational/training use
- Hazard analysis and risk assessment
- Electrical/communications architecture (IO-Link, MQTT, HTTP/WebSocket) and port configuration
- Software version and configuration record
- Manufacturer's component declarations and CE certificates (AL1350, TV7105, capacitive/photoelectric/proximity sensors, CL50 Pro)
- Maintenance schedule and instructions
- Trainer/user safety instructions embedded in the CP0001/CP0002 training worksheets

**Important Note:**
The HMI parameter-write functions (IO-Link ISDU read/write, port mode switching, command execution) carry no authentication layer in the current build and are intended solely for supervised classroom/lab use on an isolated network. The product is **not** intended for unsupervised deployment, for connection to an uncontrolled network, or for any safety-related industrial control function. Users must ensure the kit remains on a segregated lab subnet as described in the Installation Instructions.

This declaration is made in accordance with the above Directives and is valid only when the product is installed, maintained, and used according to the accompanying documentation.

**Technical File Contact:**
`[TBC — Name]`
`[TBC — email]@matrixtsl.com`

**Authorised Signatory:**
Name: `[TBC]`
Position: `[TBC]`
Place of Issue: Halifax, UK
Date of Issue: `[TBC]`
Signature: `[TBC]`

---

## Revision Control

| Rev | Issue Details | Date of Issue | Author |
|---|---|---|---|
| A | Initial release | 2026-07-03 | `[TBC]` |
| | | | |

---

## Verification & Validation

| Stage | Conducted By | Signature (Hardcopy) | Date |
|---|---|---|---|
| Compiled | `[TBC]` | n/a | 2026-07-03 |
| Reviewed | | | |
| Approved | | | |
| Released | | | |

---

## General Information

**Product Name:**
IO-Link Smart Sensors Training & Demonstration Kit

**Model:** `[TBC]`

**Manufacturer:**
Matrix Technology Solutions Ltd
The Factory, 33 Gibbet Street, Halifax, HX1 5BA, UK
Phone: +44 (0) 1422 252 380
Website: www.matrixtsl.com

**Contact (Technical File):**
`[TBC — Name]`
Email: `[TBC]`@matrixtsl.com

### General Description

The IO-Link Smart Sensors Training & Demonstration Kit is an educational training rig specifically designed for technical and vocational colleges, providing practical skills in IO-Link Master/Device communication, IODD-based sensor parameterisation, and industrial HMI monitoring.

It comprises an IFM AL1350 IO-Link Master (4 ports) connected to a set of industrial IO-Link sensors — an Omron E2E-X16MB1T12 inductive proximity sensor, a Carlo Gavazzi/RS PRO capacitive M18 proximity sensor, and an IFM TV7105 temperature sensor — together with a Banner CL50 Pro RGB status light on the fourth port. A Raspberry Pi–based HMI dashboard, running the software in this repository, displays live sensor data pushed via MQTT and provides full parameter read/write access via IO-Link ISDU for hands-on training. The kit also hosts a set of interactive training worksheets (CP0001, CP0002) covering sensor fundamentals through fault-diagnosis and calibration-drift scenarios, replicating real-world maintenance situations for enhanced learning outcomes.

### System Composition

| Component | Role |
|---|---|
| IFM AL1350 | IO-Link Master, 4 ports, Class A |
| Omron E2E-X16MB1T12 | IO-Link inductive proximity sensor (Port 1) |
| Carlo Gavazzi/RS PRO capacitive M18 | IO-Link capacitive proximity sensor (Port 2) |
| IFM TV7105 | IO-Link temperature sensor (Port 3) |
| Banner CL50 Pro | RGB status light, PDout-only (Port 4) |
| Raspberry Pi 4 + WaveShare 1024×600 touchscreen | HMI host, kiosk-mode dashboard |
| Enclosure, M12 cabling, 24 V DC power supply | Mechanical/electrical infrastructure |

### Machinery Directive Applicability (Annex I / Annex IV)

The standard configuration of this training rig contains no powered moving parts, actuators, or hazardous mechanical motion — all sensor demonstrations use hand-presented test targets. It therefore does not fall within the scope of Annex I of the Machinery Directive 2006/42/EC and is not listed under Annex IV (high-risk machinery). This conclusion is re-examined in full in [Protection Against Mechanical Hazards](#protection-against-mechanical-hazards) and must be revisited if a motorised or pneumatically actuated variant is introduced.

---

## Hazard Analysis Report

**Method:** Hazard identification carried out per EN ISO 12100 (Safety of machinery — General principles for risk assessment and risk reduction), adapted for a low-voltage electronic training kit.

This section identifies foreseeable hazards associated with the design, construction, and use of the IO-Link Smart Sensors Training & Demonstration Kit. The purpose of this analysis is to ensure that all potential sources of harm have been considered, including electrical, thermal, mechanical, control-system, and human-factors hazards. This forms the basis for the subsequent risk assessment and supports compliance with the essential health and safety requirements (EHSRs) relevant to this class of equipment.

| Hazard ID | Hazard category | Hazard description | Source / location | Who is exposed |
|---|---|---|---|---|
| H1 | Electrical | Contact with live 24 V DC conductors or mains supply to the PSU | Enclosure, PSU, terminal blocks | Trainer during maintenance, student during misuse |
| H2 | Mechanical | Entrapment/pinch on moving target/actuator used to trigger sensors (only if a motorised variant is fitted) | Proximity/photoelectric demo target | Student during hands-on exercises |
| H3 | Mechanical (sharp edges) | Cuts from enclosure edges, sensor mounting brackets | Panel/frame | Trainer/student during setup or transport |
| H4 | Thermal | Contact burn from TV7105 sensor tip if used with a heated element for demonstration | TV7105 sensing face | Student during heat-source exercises |
| H5 | Electromagnetic | Interference between AL1350/sensors and nearby equipment, or susceptibility to external EMI affecting sensor readings | Whole system | Facility / co-located equipment |
| H6 | Ergonomic/visual | Prolonged screen use, glare from HMI touchscreen | HMI display | Student/trainer |
| H7 | Software/control | Incorrect sensor parameterisation (ISDU write) leading to unexpected output behaviour during a training scenario | HMI parameter write path | Student — training-only, no physical actuation consequence in current build |
| H8 | Data/network | Unauthorised access to HMI/API exposing sensor configuration writes | Backend API, WebSocket | Facility network |
| H9 | Fire | Overheating/short circuit in PSU or wiring due to overload or damaged cable | PSU, cabling | All |

**Life-cycle phases considered for each hazard:**

| Phase | Relevant hazards | Notes |
|---|---|---|
| Transport / unpacking | H3, H9 | Enclosure/cable handling, PSU inspection before first power-up |
| Installation / setup | H1, H3, H5 | Wiring, mounting, network configuration |
| Normal training operation | H4, H6, H7, H8 | Student-facing worksheet exercises, prolonged screen use |
| Maintenance / sensor replacement | H1, H3, H9 | Power isolation required before opening enclosure |
| Decommissioning | H9, materials | WEEE disposal — see Maintenance |

**Conclusion:** the dominant residual hazards for this training kit are electrical (H1, extra-low voltage but still hazardous under fault conditions) and fire from wiring/PSU faults (H9). Because the standard configuration has no powered moving parts, mechanical hazard exposure is limited to sharp edges (H3). Hazards H7/H8 are software-only and do not currently drive physical actuation — the worst case of an incorrect ISDU write is a mis-reporting sensor, not an unsafe physical output — but must be re-assessed if the kit is extended to control real actuators or safety-relevant outputs.

> `[TBC]` — trainer/engineer to confirm whether any variant of this kit includes a powered moving target, conveyor, or pneumatic actuator. If yes, expand H2 and complete a full mechanical risk assessment per [Protection Against Mechanical Hazards](#protection-against-mechanical-hazards) and [Guards & Protective Devices](#guards--protective-devices). For the standard configuration documented here, H2 is treated as **not applicable**.

---

## Risk Assessment Process

Risk assessment follows the iterative process defined in **EN ISO 12100:2010**:

1. **Determine limits of the equipment** — intended use, reasonably foreseeable misuse, life-cycle phases (transport, setup, operation, training use, maintenance, decommissioning).
2. **Identify hazards** — per the Hazard Analysis Report above, for each life-cycle phase.
3. **Estimate risk** — for each hazard, using the risk matrix below.
4. **Evaluate risk** — is the risk acceptable, or does it require reduction?
5. **Reduce risk** — apply the hierarchy of controls (inherently safe design → safeguarding/protective devices → information for use/warnings).
6. **Re-assess** — repeat steps 3–5 after each mitigation until residual risk is acceptable or no further reasonably practicable reduction is possible.
7. **Document** — record all of the above in the Full Risk Assessment below.

**Risk estimation parameters used:**

| Parameter | Levels |
|---|---|
| Severity (S) | 1 = Minor (first aid) · 2 = Moderate (medical treatment) · 3 = Serious (major injury) · 4 = Catastrophic (fatality/permanent disability) |
| Probability of occurrence (P) | 1 = Rare · 2 = Unlikely · 3 = Possible · 4 = Likely |
| Exposure/frequency (E) | 1 = Rarely · 2 = Occasionally · 3 = Frequently · 4 = Continuously |

**Risk = S × (P + E)**, categorised as:

| Score | Rating | Action required |
|---|---|---|
| ≤4 | Low | Acceptable — no further action, monitor |
| 5–9 | Medium | Reduce where reasonably practicable |
| ≥10 | High | Must be reduced before use; re-assess after mitigation |

---

## Full Risk Assessment

Assessment performed against the hazards identified in the Hazard Analysis Report. `[TBC]` cells to be completed/verified by the responsible engineer before this document is used to support a Declaration of Conformity.

| Hazard ID | S | P | E | Score | Rating | Existing/planned mitigation | Residual score | Residual rating |
|---|---|---|---|---|---|---|---|---|
| H1 – Electrical contact | 3 | 2 | 3 | 15 | High | Enclosure IP-rated, fused 24 V DC supply, no user access to mains wiring, PSU double-insulated/Class II, warning labels | `[TBC]` | `[TBC]` |
| H2 – Mechanical entrapment (moving target) | 3 | 2 | 2 | 12 | High | Guarding per Guards & Protective Devices if fitted, E-stop `[TBC]`, low-force/low-speed actuator selection | `[TBC]` | `[TBC]` |
| H3 – Sharp edges | 1 | 2 | 2 | 4 | Low | Deburred edges, edge trim on enclosure cut-outs | 4 | Low |
| H4 – Thermal (heat source demo) | 2 | 2 | 2 | 8 | Medium | Instructor-supervised only, warning label near heat-source exercises, cool-down guidance in worksheet | `[TBC]` | `[TBC]` |
| H5 – EMC interference | 2 | 1 | 3 | 8 | Medium | Shielded IO-Link cabling, ferrite suppression where required, EMC testing per Technical Information | `[TBC]` | `[TBC]` |
| H6 – Ergonomic/visual | 1 | 2 | 3 | 5 | Medium | Adjustable mounting angle, matte touchscreen, zoom setting in HMI Settings page | 5 | Medium |
| H7 – Incorrect ISDU parameterisation | 2 | 3 | 3 | 12 | High | Training-only scope (no physical actuator control), auto-restore-on-navigation cleanup for fault-injection scenarios, circuit breaker prevents runaway writes | `[TBC]` | `[TBC]` |
| H8 – Unauthorised network/API access | 2 | 2 | 2 | 8 | Medium | Kit intended for isolated/local lab network; recommend network segregation and no public exposure of `/api` or `/ws` | `[TBC]` | `[TBC]` |
| H9 – Fire (PSU/wiring fault) | 4 | 1 | 3 | 16 | High | Fused supply, correctly rated cabling, PSU with over-current/over-temperature protection, periodic inspection per Maintenance | `[TBC]` | `[TBC]` |

**Sign-off:**

| Role | Name | Date |
|---|---|---|
| Assessor | `[TBC]` | `[TBC]` |
| Reviewer/approver | `[TBC]` | `[TBC]` |

---

## Essential Health & Safety Requirements

Cross-reference to Annex I of 2006/42/EC (where applicable) and the general LVD/EMC essential requirements. `[TBC]` = compliance evidence to be attached/referenced.

| EHSR ref | Requirement | How addressed | Evidence |
|---|---|---|---|
| 1.1.2 | Principles of safety integration (eliminate/reduce risk at design stage) | Sensors and AL1350 are pre-certified industrial components (IFM, Omron, Carlo Gavazzi, Banner); enclosure design avoids live-part access | `[TBC]` — component datasheets in `docs/` |
| 1.1.3 | Materials and products | Enclosure/mounting materials selected for indoor lab use, non-toxic, RoHS compliant | `[TBC]` — supplier declarations |
| 1.3.7 | Risks related to moving parts | Not applicable — no moving parts in the standard configuration | See Protection Against Mechanical Hazards |
| 1.5.1 | Electricity supply | Field-side supply is SELV/PELV by design: AL1350 rated 20–30 V DC, Protection Class III; TV7105 supply "to EN 50178, SELV, PELV". Mains-to-24V PSU isolation and fusing on the primary side is the remaining item to document. | `[TBC]` — PSU datasheet + electrical schematic |
| 1.5.2 | Static electricity | ESD precautions during sensor handling (per manufacturer datasheets) | Manufacturer datasheets |
| 1.5.6 | Fire | Fused supply, flame-retardant enclosure materials where applicable | `[TBC]` |
| 1.5.9 | Mucous membranes/skin (sharp edges) | Deburred edges, edge trim (H3 mitigation) | Visual inspection record |
| 1.6.1 | Maintenance | Documented in Maintenance | This document |
| 1.7.1–1.7.4 | Information, warning devices, marking, instructions | Documented in Information, Instructions & Warnings | This document, worksheet materials |
| LVD Annex I | Protection against hazards from electrical equipment | Enclosure IP rating, correct cable sizing, PSU compliance | `[TBC]` |
| EMC essential requirements | Equipment does not cause / is not unduly affected by EMI | EMC test report | `[TBC]` — Technical Information |

---

## Control Systems

| Item | Description |
|---|---|
| Control architecture | Distributed, monitoring-and-parameterisation only: sensors (IO-Link Devices, COM2/COM3) → AL1350 (IO-Link Master, Class A, 4 ports) → dual data path (MQTT push, 500 ms + HTTP poll fallback, 1 s) → FastAPI backend → WebSocket (`/ws`) → HMI frontend. No safety-rated control functions are implemented by this system, and no field output is actuated as a consequence of any HMI action beyond writing device parameters back to the same non-safety sensor (ISDU write / mode write). |
| Control voltage | 20–30 V DC field-side at the AL1350 (SELV/PELV, Protection Class III); 10–30 V DC at individual IO-Link sensors; host computer/Pi on standard low-voltage DC supply |
| Software control layer | FastAPI backend with REST + WebSocket routes; a dedicated client module implements circuit breaker, retry/jitter, and adaptive per-port polling. Device parameter metadata and ISDU encode/decode logic is centralised in a single registry module. |
| Reliability/robustness patterns relevant to safety of function | **Circuit breaker** — opens after 5 consecutive AL1350 request failures, recovers after a 15 s timeout, preventing runaway retry storms. **Connection pooling** — capped at 3 concurrent connections (AL1350 hardware limit), preventing overload of the master. **Retry with jitter** — exponential backoff with randomised jitter avoids thundering-herd reconnection after a network blip. **Protocol fallback chain** — batch reads fall back to individual per-endpoint reads if the batch call degrades. These patterns exist for data-integrity/availability, not functional safety, and must not be bypassed. |
| Safety-related control functions | None implemented — this is a monitoring/parameterisation training system, not a safety PLC and not SIL/PL-rated. Fault-injection training scenarios write to non-safety ISDU parameters only, and each scenario auto-restores the sensor to its default configuration on navigation away from the worksheet. The one documented limitation is that force-closing the browser tab bypasses this cleanup — the trainer must revisit the worksheet and reset, or re-run/complete the scenario, to restore the sensor. |
| Emergency stop | Not fitted / not required in the standard configuration — no hazardous motion is present (see Protection Against Mechanical Hazards). If a future variant adds a powered actuator, an E-stop conforming to EN ISO 13850, wired to hard-cut the actuator's power (not merely a software stop), must be added and this row updated with device type, category, and reset behaviour. |
| Fail-safe behaviour | On communication loss, the circuit breaker opens after 5 consecutive failures and the HMI displays a degraded/disconnected status rather than stale data being presented as live. No field outputs are actuated as a result of comms loss because the system does not drive any safety-relevant output — worst case is loss of monitoring visibility, not an unsafe action. |
| Access control | The HMI parameter-write functions carry no authentication layer in the current build — the kit is designed for supervised classroom use on an isolated lab network, not for public or unsupervised deployment. `[TBC]` — confirm this remains the intended deployment model, or add authentication before any network-exposed deployment. |
| Network isolation | The IO-Link master and MQTT broker sit on a dedicated subnet, separate from any general-purpose network. Recommended: keep this subnet air-gapped or firewalled from the internet; do not expose the API or WebSocket externally. |

---

## Protection Against Mechanical Hazards

**Assessment for the standard configuration:**

| Item | Description |
|---|---|
| Moving parts present? | **No.** The AL1350 master, all IO-Link sensors, the CL50 light stack, and the HMI host are static devices with no motors, actuators, or powered linkages. |
| How sensors are triggered during training | By hand: the student presents a test target (metal plate/washer for the inductive proximity and capacitive sensors, an opaque object for the photoelectric sensor, a heat source or ambient drift for the TV7105) directly to the sensing face. No mechanised presentation system is part of the standard kit. |
| Trapping/shearing/crushing points | None identified — no in-running nips, no closing gaps, no powered linkages exist in the standard configuration. |
| Ejection hazards | None — no stored mechanical energy (springs, pneumatics, flywheels) is present. |
| Residual mechanical hazard | Limited to H3 (sharp edges on enclosure/mounting brackets) and incidental contact with sensor mounting hardware during setup/adjustment. |
| Sensing-face proximity hazard | The M18 barrel sensors and the TV7105 process-connection sensor have exposed metal/plastic sensing faces; these present a minor pinch/scrape risk during manual presentation of test targets, not a mechanical hazard requiring guarding. |

**Conclusion:** the standard IO-Link Smart Sensors kit contains no powered moving parts and does not fall within the scope of Annex I mechanical-hazard provisions of the Machinery Directive. This conclusion must be re-verified (`[TBC]`) for any variant that introduces a motorised or pneumatically actuated demonstration target — in that case, this section and Guards & Protective Devices must be re-opened in full, including a speed/force assessment and safety-distance calculation per EN ISO 13857.

---

## Guards & Protective Devices

**Assessment for the standard configuration:**

Per Protection Against Mechanical Hazards above, the standard kit has no accessible moving parts under normal or reasonably foreseeable use, and therefore **no guards or protective devices are required**. The only physical protective measures applied are:

| Item | Description |
|---|---|
| Sharp-edge mitigation | Deburred enclosure edges and edge trim on panel cut-outs (H3) |
| Electrical enclosure | Sensor terminals, AL1350 power terminals, and any mains-side PSU wiring are enclosed/shrouded so that only the extra-low-voltage M12 sensor connectors and the touchscreen are user-accessible during normal training use |
| Hot-surface consideration | Where the TV7105 heat-source exercise is used, no guard is fitted — mitigation is procedural (instructor supervision, worked-through cool-down guidance in the worksheet) rather than physical, since the heat source itself is external to the kit and outside its scope of supply |

**If a future variant introduces powered motion:** a guard conforming to EN ISO 14120, an interlock per EN ISO 14119 where access is required during operation, a safety-distance calculation per EN ISO 13857, and an E-stop per EN ISO 13850 (see Control Systems) must all be specified here before that variant can be placed on the market.

---

## Risks Due To Other Hazards

Hazards outside the mechanical/electrical categories already covered, per EN ISO 12100 Annex B guidance.

| Hazard | Description | Mitigation |
|---|---|---|
| Noise | Negligible — no motors/pneumatics in the base configuration; `[TBC]` if actuators are added | N/A / `[TBC]` |
| Vibration | Negligible for a benchtop unit | N/A |
| Radiation (EMC/RF) | IO-Link and MQTT communications operate within standard industrial EMC limits; no intentional RF transmitters | EMC compliance per Technical Information |
| Materials/substances | RoHS-compliant components; no hazardous substances handled during normal operation | Supplier RoHS declarations |
| Ergonomics | Touchscreen height/angle adjustable; HMI zoom setting accommodates different users | Documented in Settings page |
| Combination of hazards | Simultaneous exposure to H1 (electrical) + H4 (thermal) during heated-object sensor demos | Instructor supervision required for all heat-source exercises; both hazards flagged together in worksheet safety notes |
| Human error / training misuse | Incorrect ISDU writes during training could put a sensor into an unexpected state | Reset/verify steps built into each fault-injection worksheet; auto-restore-on-navigation logic; "Reset" controls provided in HMI |
| Trip hazard (cabling) | Benchtop/desk cabling underfoot | Cable management, fixed mounting frame recommended |

---

## Maintenance

| Item | Description |
|---|---|
| Maintenance schedule | **Before each teaching session (trainer, visual only):** cabling/connector condition, enclosure integrity, no exposed conductors, touchscreen responsive. **Monthly (trainer or technician):** confirm AL1350 supervision readings (temperature, voltage, current) are within normal range via the IO-Link Master diagnostics page — abnormal voltage/current is an early indicator of a wiring or PSU fault. **Quarterly (competent person):** electrical safety check — insulation/continuity of mains-side PSU wiring, fuse rating verification, earth continuity if applicable. **Annually (competent person):** full inspection including opening the enclosure, torque-check of M18/process-connection sensor mountings, firmware version audit. |
| Routine checks | Enclosure integrity, M12 cable/connector condition, sensor mounting security (recommended tightening torque for the TV7105 process connection: G¼ = 35 Nm, G½ = 45 Nm), PSU fuse status, touchscreen calibration, AL1350 supervision status not flagging undervoltage/overcurrent |
| Sensor replacement | See `docs/PHOTOELECTRIC-SENSOR-REPLACEMENT.md` for the current photoelectric sensor's ISDU limitations and approved replacement parts. Any sensor substitution must be checked against the device registry (keyed by vendor ID/device ID) — an unregistered replacement will read/write parameters incorrectly, not just fail to display. |
| Software/firmware updates | Backend and frontend deployed per the documented Pi deployment procedure (build → deploy → restart backend service → relaunch kiosk). AL1350 firmware updates per the manufacturer operating manual — firmware changes should be followed by a full regression check of the ISDU parameter panels before returning the kit to classroom use. |
| Calibration | TV7105 temperature offset calibration (±10 °C range, 0.1 °C scale) is demonstrated live in a dedicated worksheet scenario and is reset to 0.0 °C on scenario completion or navigation away. For units used as a genuine measurement reference (rather than purely a training demo), verify the as-shipped offset against a calibrated reference thermometer at commissioning, and re-verify annually or after any firmware update. |
| Who may perform maintenance | Electrical work (PSU, mains wiring, terminal access) — competent/qualified electrician only, per the TV7105 manual's explicit instruction ("the unit must be connected by a qualified electrician"). Routine visual checks and the monthly supervision-reading check may be performed by trainers without electrical qualification. |
| Spare parts | Approved replacements: IFM TV7105 (temperature), Carlo Gavazzi/RS PRO capacitive M18 or direct equivalent, Omron E2E-X16MB1T12, Banner CL50 Pro. `[TBC]` — confirm approved supplier/part-number list and lead times. |
| Decommissioning/disposal | WEEE-compliant disposal of all electronic components (AL1350, sensors, Pi, PSU, CL50) at end of life — do not dispose of as general waste. `[TBC]` — confirm the disposal/recycling route used. |
| Maintenance records | `[TBC]` — record location/format for logging inspections and repairs; recommended: a simple dated log (paper or spreadsheet) per unit, cross-referenced to this document's retention requirement. |

---

## Information, Instructions & Warnings

| Item | Location / description |
|---|---|
| User manual | This repository's `docs/` folder (IO-Link comms guide, port configuration, operating manual) plus the in-app CP0001/CP0002 training worksheets |
| Warning labels | `[TBC]` — physical labels required on the enclosure: electrical hazard (H1), hot surface (H4, if heat-source exercises are performed), and any moving-part warning (H2) if fitted |
| Language(s) | `[TBC]` — confirm which languages the Declaration of Conformity, warnings, and instructions must be provided in for target markets |
| Rating plate | `[TBC]` — must show manufacturer name/address, model, serial number, year of construction, supply voltage/current, IP rating |
| Safety instructions in training material | Each fault-injection worksheet includes an explicit "observe → diagnose → fix → verify" flow so trainees never leave a sensor mis-configured; auto-restore-on-navigation prevents an abandoned session from leaving equipment in an unsafe state |
| Instructions for use | Provided via the in-app worksheet UI (step-by-step, live sensor feedback) rather than a static paper manual — supplemented by the `docs/README.md` index |
| Foreseeable misuse warnings | `[TBC]` — e.g. do not expose sensors to conditions outside their rated IP/temperature range; do not bypass guarding if fitted; instructor supervision required for heat-source exercises |
| Emergency contact / support | `[TBC]` |

---

## Technical Information

| Category | Detail |
|---|---|
| Harmonised standards applied | `[TBC]` for final selection/citation, but the following are expected to apply and should be confirmed against current OJEU/UKCA designated-standards lists at the time of assessment: **EN 61010-1** (safety of electrical equipment for measurement, control, and laboratory use); **EN IEC 61326-1** (EMC requirements for electrical equipment for measurement, control, and laboratory use); **EN ISO 12100** (safety of machinery — general principles for risk assessment and risk reduction, used as the assessment methodology in this document regardless of Machinery Directive applicability); **EN 60204-1** (electrical equipment of machines) — only if a future variant is assessed as machinery; **EN 50178** — referenced directly by the TV7105 manual for its SELV/PELV supply requirement |
| Component certifications | IFM AL1350, IFM TV7105, Omron E2E-X16MB1T12, Carlo Gavazzi/RS PRO capacitive sensor, Banner CL50 Pro — each is independently CE-marked by its manufacturer as an industrial component. Retain copies of each component's manufacturer Declaration of Conformity in Appendix B. |
| Test reports | `[TBC]` — EMC test report, electrical safety test report, if the assembled system (rather than each component individually) is independently tested. Given all active components carry their own component-level CE marking and the assembly introduces no new emission/immunity-relevant circuitry beyond standard wiring, a documented technical justification for relying on component-level certification (rather than a full system EMC test) is an acceptable alternative — record that justification here once agreed with a compliance reviewer. |
| Electrical schematics | `[TBC]` — wiring diagram for 20–30 V DC distribution from PSU → AL1350 → sensor M12 drops, plus AL1350 port assignments (Port 1 = Proximity, Port 2 = Capacitive, Port 3 = IFM TV7105, Port 4 = Light Stack), PSU rating, and fusing/protection devices |
| Software version / configuration under test | Record the git commit hash / release tag of this repository at the time of conformity assessment, plus the exact runtime configuration in force (MQTT broker host/port, AL1350 IP, poll interval, port labels) — the software configuration is part of the assessed system since it governs polling behaviour, ISDU write scope, and fail-safe display of degraded status |
| IP rating | AL1350 master and TV7105: enclosure/housing IP rating per manufacturer datasheet — `[TBC]`. Omron E2E-X16MB1T12 proximity sensor: **IP67**. Assembled panel/enclosure IP rating: `[TBC]` — not yet assessed; recommend a minimum of IP20 for an indoor touch-safe enclosure. |
| Operating environment ratings | AL1350: **-25 °C to +60 °C** ambient. Omron E2E-X16MB1T12 proximity sensor: `[TBC]` — confirm against manufacturer datasheet. The kit's overall rated operating envelope is bounded by the narrowest component figure — record the governing limit as **-25 °C to +60 °C**, indoor use only, non-condensing, no altitude derating assessed (`[TBC]` if used above 2000 m) |
| Bill of materials | `[TBC]` — full BOM with manufacturer part numbers; core items known: IFM AL1350, IFM TV7105, Carlo Gavazzi/RS PRO capacitive M18, Omron E2E-X16MB1T12, Banner CL50 Pro, Raspberry Pi 4 + WaveShare 1024×600 touchscreen, 24 V DC PSU (`[TBC]` model/rating), enclosure and M12 cabling (`[TBC]` supplier) |
| Drawings | `[TBC]` — enclosure/mounting general arrangement drawing, panel layout showing sensor port positions and cable routing |

---

## Appendices

### Appendix A — Example of CE Mark Label

`[TBC]` — insert the final rating-plate/CE-mark label artwork here once the design in Information, Instructions & Warnings has been finalised. The label must show: CE mark, manufacturer name/address, model, serial number, year of construction, supply voltage/current, and IP rating.

### Appendix B — Technical Documentation Register

Master index of all documents forming this Technical Construction File. Update this table whenever a document is added, revised, or superseded.

| # | Document | Location | Revision | Date | Status |
|---|---|---|---|---|---|
| 1 | EU Declaration of Conformity | This file — EU Declaration of Conformity | `[TBC]` | `[TBC]` | Draft |
| 2 | Revision Control | This file — Revision Control | 1.0 | 2026-07-03 | Draft |
| 3 | Verification & Validation | This file — Verification & Validation | 1.0 | 2026-07-03 | Draft |
| 4 | General Information | This file — General Information | 1.0 | 2026-07-03 | Draft |
| 5 | Hazard Analysis Report | This file — Hazard Analysis Report | 1.0 | 2026-07-03 | Draft |
| 6 | Risk Assessment Process | This file — Risk Assessment Process | 1.0 | 2026-07-03 | Draft |
| 7 | Full Risk Assessment | This file — Full Risk Assessment | 1.0 | 2026-07-03 | Draft — residual risk scores pending sign-off |
| 8 | Essential Health & Safety Requirements | This file — Essential Health & Safety Requirements | 1.0 | 2026-07-03 | Draft |
| 9 | Control Systems | This file — Control Systems | 1.0 | 2026-07-03 | Draft |
| 10 | Protection Against Mechanical Hazards | This file — Protection Against Mechanical Hazards | 1.0 | 2026-07-03 | Draft — pending confirmation of moving parts |
| 11 | Guards & Protective Devices | This file — Guards & Protective Devices | 1.0 | 2026-07-03 | Draft |
| 12 | Risks Due To Other Hazards | This file — Risks Due To Other Hazards | 1.0 | 2026-07-03 | Draft |
| 13 | Maintenance | This file — Maintenance | 1.0 | 2026-07-03 | Draft |
| 14 | Information, Instructions & Warnings | This file — Information, Instructions & Warnings | 1.0 | 2026-07-03 | Draft |
| 15 | Technical Information | This file — Technical Information | 1.0 | 2026-07-03 | Draft |
| 16 | IO-Link Comms & MQTT Architecture Guide | `docs/IO-LINK-COMMS-GUIDE.md` | — | — | Existing |
| 17 | AL1350 Operating Manual | `docs/Operating Manual.txt` / `.pdf` | — | — | Existing (manufacturer document) |
| 18 | Sensor datasheets (TV7105, Capacitive, Photoelectric) | `docs/README.md` index | — | — | Existing (manufacturer documents) |
| 19 | Component CE Declarations (AL1350, TV7105, capacitive, photoelectric/proximity, CL50 Pro) | Appendix — to be collected | `[TBC]` | `[TBC]` | Outstanding |
| 20 | Electrical schematics / BOM / GA drawings | Appendix — to be produced | `[TBC]` | `[TBC]` | Outstanding |
| 21 | EMC / electrical safety test reports | Appendix — to be commissioned | `[TBC]` | `[TBC]` | Outstanding |
| 22 | Maintenance & inspection log template | Appendix — to be produced | `[TBC]` | `[TBC]` | Outstanding |

**Retention requirement:** this Technical Documentation File and all referenced records must be retained for **10 years** from the date the last unit of this product is manufactured/placed on the market, and made available to market surveillance authorities on request.

#### Outstanding actions before this file can support a signed Declaration of Conformity

1. Confirm whether any kit variant includes powered moving parts — completes Hazard Analysis Report (H2), Protection Against Mechanical Hazards, and Guards & Protective Devices.
2. Complete all `[TBC]` risk assessment residual scores and obtain assessor/reviewer sign-off (Full Risk Assessment).
3. Collect component-level CE Declarations of Conformity for AL1350, TV7105, capacitive sensor, photoelectric/proximity sensor, and CL50 Pro (Appendix B, item 19).
4. Produce electrical schematic, BOM, and general arrangement drawing (Technical Information; Appendix B, item 20).
5. Commission EMC and electrical safety test reports for the assembled system, or justify reliance on component-level certification alone (Technical Information; Appendix B, item 21).
6. Finalise and print physical warning/rating labels (Information, Instructions & Warnings; Appendix A).
7. Fill in manufacturer contact, model designation, serial number range, and authorised signatory on the EU Declaration of Conformity.
8. Have the completed file reviewed by a competent CE/UKCA compliance professional before use — this document provides a structural starting point, not a substitute for that review.
