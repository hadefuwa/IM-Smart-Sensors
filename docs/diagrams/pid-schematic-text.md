# P&ID Schematic — Text Diagram

Plain-text data-flow diagrams for the IM4330 system. Two versions are provided:

1. **Generic-label version** — for checklist item *"Draw all sensors and actuators connected as a basic system diagram / Label all components with generic labels"*.
2. **Real-device version** — same topology, with actual sensor models and system components named, for internal engineering/reference use.

See also: [pid-schematic.html](pid-schematic.html) and [IM4330 PID Schematic.docx](IM4330%20PID%20Schematic.docx) for the drawn (graphical) versions and component tag register.

---

## 1. Generic-Label Version

```
════════════════════════════════════════════════════════════════════════════
  P&ID SCHEMATIC — DATA FLOW DIAGRAM (Generic Labels)
════════════════════════════════════════════════════════════════════════════

  FIELD DEVICES (Sensors/Actuators)              IO-LINK MASTER
  ┌─────────────────────────────┐                ┌───────────────────────┐
  │                             │                │                       │
  │  [S1] Proximity Sensor      │──── IO-Link ──▶│                       │
  │       (Port 1)              │◀── (PDin) ─────│                       │
  │                             │                │                       │
  │  [S2] Capacitive Sensor     │──── IO-Link ──▶│    IO-LINK MASTER     │
  │       (Port 2)              │◀── (PDin) ─────│    (4-port hub)       │
  │                             │                │                       │
  │  [S3] Temperature Sensor    │──── IO-Link ──▶│    - Aggregates all   │
  │       (Port 3)              │◀── (PDin) ─────│      port data        │
  │                             │                │    - ISDU read/write  │
  │  [A1] Indicator/Light Stack │◀─── PDout ──────│      per-port          │
  │       (Port 4, actuator)    │    (control)    │    - Supervision:      │
  │                             │                │      temp/voltage/    │
  └─────────────────────────────┘                │      current           │
                                                   └───────────┬───────────┘
                                                               │
                                                    Ethernet (TCP/IP)
                                                    HTTP REST  +  MQTT publish
                                                    (push every 500 ms)
                                                               │
                                                               ▼
                                        ┌──────────────────────────────────┐
                                        │      RASPBERRY PI (Edge Device)   │
                                        │                                    │
                                        │   ┌────────────────────────┐      │
                                        │   │  MQTT broker            │      │
                                        │   └───────────┬────────────┘      │
                                        │               │ subscribe          │
                                        │               ▼                    │
                                        │   ┌────────────────────────┐      │
                                        │   │  Backend service         │      │
                                        │   │  - polling loop          │      │
                                        │   │  - parameter read/write  │      │
                                        │   │  - decode sensor data    │      │
                                        │   │  - fault handling        │      │
                                        │   └───────────┬────────────┘      │
                                        │               │ live push          │
                                        │               │ (WebSocket)         │
                                        └───────────────┼────────────────────┘
                                                         │
                                              Local network (loopback)
                                                         │
                                                         ▼
                                        ┌──────────────────────────────────┐
                                        │   HMI SCREEN (Touchscreen Display) │
                                        │                                    │
                                        │   - Live gauges / indicators       │
                                        │   - Parameter read/write controls  │
                                        │   - Operator commands ──┐          │
                                        └──────────────────────────┼──────────┘
                                                                    │
                                                    Command / write-back path
                                                    (parameter write, actuator
                                                     control)
                                                                    │
                                                                    ▼
                                        (routed back through Pi → IO-Link
                                         Master → Field Device, closing the
                                         control loop)

════════════════════════════════════════════════════════════════════════════
  LEGEND
════════════════════════════════════════════════════════════════════════════
  ──▶   One-way data flow (sensor → system)
  ◀──   One-way command flow (system → actuator)
  S1–S3  Sensors (input devices)
  A1     Actuator (output device)

  Data path (forward):   Sensor → IO-Link Master → Raspberry Pi → HMI Screen
  Command path (return): HMI Screen → Raspberry Pi → IO-Link Master → Actuator
════════════════════════════════════════════════════════════════════════════
```

---

## 2. Real-Device Version

```
════════════════════════════════════════════════════════════════════════════
  P&ID SCHEMATIC — DATA FLOW DIAGRAM (IM4330, actual components)
════════════════════════════════════════════════════════════════════════════

  FIELD DEVICES (M12, 3-wire IO-Link)             IFM AL1350
  ┌───────────────────────────────┐               ┌───────────────────────┐
  │                               │               │                       │
  │  Omron E2E-X16MB1T12          │──── IO-Link ─▶│                       │
  │  Inductive Proximity Sensor   │◀── (PDin) ────│                       │
  │  Port 1                       │               │                       │
  │                               │               │                       │
  │  Carlo Gavazzi / RS PRO M18   │──── IO-Link ─▶│   IFM AL1350           │
  │  Capacitive Sensor            │◀── (PDin) ────│   IO-LINK MASTER       │
  │  Port 2                       │               │   (4-port IoT Core)   │
  │                               │               │                       │
  │  IFM TV7105                   │──── IO-Link ─▶│   - getdatamulti /     │
  │  PT100 Temperature Sensor     │◀── (PDin) ────│     per-port GET       │
  │  Port 3 (SP1/RP1, SP2/RP2)    │               │   - iolreadacyclic /   │
  │                               │               │     iolwriteacyclic    │
  │  Banner CL50 Pro               │◀─── PDout ────│     (ISDU)             │
  │  RGB LED Column Light         │   (colour/     │   - processdatamaster/ │
  │  Port 4 (PDout-only)          │    animation)  │     temperature,       │
  │                               │               │     voltage, current    │
  └───────────────────────────────┘               └───────────┬───────────┘
                                                                │
                                                     Ethernet (TCP/IP)
                                                     HTTP REST (fallback) +
                                                     MQTT publish (primary,
                                                     500 ms, via Mosquitto)
                                                                │
                                                                ▼
                                        ┌───────────────────────────────────┐
                                        │      RASPBERRY PI (kiosk host)     │
                                        │                                     │
                                        │   ┌────────────────────────┐       │
                                        │   │  Mosquitto MQTT broker  │       │
                                        │   └───────────┬────────────┘       │
                                        │               │ aiomqtt subscribe   │
                                        │               ▼                     │
                                        │   ┌────────────────────────┐       │
                                        │   │  FastAPI backend         │       │
                                        │   │  io_link_fastapi.py      │       │
                                        │   │  al1350_client.py:       │       │
                                        │   │   - circuit breaker      │       │
                                        │   │   - retry + jitter       │       │
                                        │   │   - adaptive polling     │       │
                                        │   │  decoder.py (PDin/PDout) │       │
                                        │   │  device_parameters.py    │       │
                                        │   │   (IODD/ISDU registry)   │       │
                                        │   └───────────┬────────────┘       │
                                        │               │ WebSocket /ws        │
                                        │               │ JSON push, 500 ms    │
                                        └───────────────┼─────────────────────┘
                                                         │
                                              nginx (localhost proxy)
                                                         │
                                                         ▼
                                        ┌───────────────────────────────────┐
                                        │  HMI SCREEN — Chromium Kiosk        │
                                        │  WaveShare 1024×600 Touchscreen     │
                                        │                                     │
                                        │  - Home page: gauges/mimics per      │
                                        │    sensor (src/home-page.js)         │
                                        │  - IO-Link Master page: port cards,  │
                                        │    supervision charts                │
                                        │  - Parameter read/write panels       │
                                        │    (ISDU controls) ──┐               │
                                        └────────────────────────┼─────────────┘
                                                                  │
                                                    ISDU write / PDout write
                                                    (browser → FastAPI →
                                                     AL1350 → sensor/actuator,
                                                     <200 ms round trip)
                                                                  │
                                                                  ▼
                                        (closes the loop back to the field
                                         device via the AL1350)

════════════════════════════════════════════════════════════════════════════
  LEGEND
════════════════════════════════════════════════════════════════════════════
  ──▶   One-way data flow (sensor → system)
  ◀──   One-way command flow (system → actuator)

  Forward (live data): Sensor → AL1350 → MQTT/HTTP → FastAPI (Pi) → WebSocket → HMI
  Return (commands):   HMI → FastAPI (Pi) → AL1350 (ISDU/PDout) → Sensor/Actuator
════════════════════════════════════════════════════════════════════════════
```
