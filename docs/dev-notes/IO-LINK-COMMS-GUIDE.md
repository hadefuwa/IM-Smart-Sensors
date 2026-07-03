# IO-Link Communication Guide
### A Practical Introduction for Aspiring Controls Engineers

---

> **Who is this for?**
> This guide is written for students learning industrial automation. No prior knowledge of IO-Link or MQTT is assumed — just a basic understanding of computers and networks. By the end, you will understand how a modern industrial system uses push messaging to receive real-time sensor data, why this is better than polling, and how every component in our stack connects together.

> **Note:** An earlier version of this guide ([IO-LINK-COMMS-GUIDE-ARCHIVED-http-polling.md](IO-LINK-COMMS-GUIDE-ARCHIVED-http-polling.md)) covers the previous HTTP polling architecture. Read that first if you want to understand why we changed — knowing the problem makes the solution easier to understand.

---

## Table of Contents

1. [What is IO-Link?](#1-what-is-io-link)
2. [The Hardware Stack](#2-the-hardware-stack)
3. [Why We Moved Away from HTTP Polling](#3-why-we-moved-away-from-http-polling)
4. [What is MQTT?](#4-what-is-mqtt)
5. [The New Architecture — Push, Not Pull](#5-the-new-architecture--push-not-pull)
6. [The AL1350 Subscribe Service](#6-the-al1350-subscribe-service)
7. [The MQTT Message Format](#7-the-mqtt-message-format)
8. [Mosquitto — The Message Broker](#8-mosquitto--the-message-broker)
9. [The Python MQTT Listener](#9-the-python-mqtt-listener)
10. [Parsing the Push Message](#10-parsing-the-push-message)
11. [Understanding Port Modes and Process Data](#11-understanding-port-modes-and-process-data)
12. [Decoding Sensor Data](#12-decoding-sensor-data)
13. [The Capacitive Sensor Detection Counter (ISDU)](#13-the-capacitive-sensor-detection-counter-isdu)
14. [The Dual-Track Architecture — MQTT + HTTP Fallback](#14-the-dual-track-architecture--mqtt--http-fallback)
15. [Supervision Data in the Push Payload](#15-supervision-data-in-the-push-payload)
16. [Reliability in Real Systems](#16-reliability-in-real-systems)
17. [How Our HMI Puts It All Together](#17-how-our-hmi-puts-it-all-together)
18. [Quick Reference](#18-quick-reference)
19. [Student Exercises](#19-student-exercises)

---

## 1. What is IO-Link?

IO-Link (standardised as IEC 61131-9) is a short-range, point-to-point digital communication protocol between a smart sensor or actuator and a device called an **IO-Link Master**. Before IO-Link, sensors were wired directly to PLCs using plain analogue signals (0–10 V or 4–20 mA). A single voltage level told the PLC one number — temperature, pressure, or whether something was present. There was no way to read diagnostics, identify the device type, or change its configuration remotely.

IO-Link replaces that single analogue value with a rich digital packet: a structured message that carries measurement data, status flags, fault codes, and configuration parameters — all down the same standard 3-wire M12 cable.

### Key facts about IO-Link

| Property | Value |
|---|---|
| Physical layer | Standard 3-wire unshielded cable (max 20 m) |
| Speed | COM1: 4.8 kbaud, COM2: 38.4 kbaud, COM3: 230.4 kbaud |
| Cable | Same M12 cables already used in factories |
| Direction | Full duplex — master talks to device AND device talks to master |
| Standard | IEC 61131-9 |

Think of IO-Link as a tiny industrial Ethernet for your sensors. The physical wire is simple, but the protocol on top of it is rich and intelligent.

---

## 2. The Hardware Stack

Before writing a single line of code, you need to understand what physical hardware is involved.

```
┌───────────────────────────────────────────────────────────────────┐
│                    FACTORY NETWORK (Ethernet)                      │
│                     e.g. 192.168.7.0/24                            │
└──────┬──────────────────────────────────────────────┬─────────────┘
       │ Ethernet                                     │ Ethernet
       │                                              │
┌──────▼──────┐                             ┌─────────▼─────────┐
│  IFM AL1350  │   ← IO-Link MASTER          │  Raspberry Pi      │
│  IP:192.168. │     4 x IO-Link ports       │  IP:192.168.7.2    │
│  7.4         │                             │  Mosquitto broker  │
└──────┬───────┘                             │  FastAPI backend   │
       │ IO-Link (M12 cables)                │  Chromium kiosk    │
  ┌────┴──────────────────────┐              └───────────────────┘
  │    │           │          │
Port1 Port2      Port3      Port4
  │    │           │          │
┌─▼──┐ ┌─▼──┐  ┌──▼──┐  ┌───▼──┐
│Temp│ │Cap.│  │Photo│  │ LED  │
│Sen │ │Sen │  │Sen  │  │Stack │
└────┘ └────┘  └─────┘  └──────┘
 PDin   PDin    PDin      PDout
```

### The AL1350 is the bridge

The **IFM AL1350** does two jobs simultaneously:

1. **Speaks IO-Link** to the sensors on its 4 ports (the custom IO-Link serial protocol), cycling every 1–5 ms.
2. **Speaks Ethernet / HTTP / MQTT** to the rest of the world.

Your software never directly touches the sensors. You talk to the master over Ethernet, and the master handles the IO-Link protocol for you. The master buffers the latest sensor values — whatever rate you read at, the value you get is always the most recent reading.

---

## 3. Why We Moved Away from HTTP Polling

The previous architecture had the Python backend **polling** the AL1350 every second — sending an HTTP request and waiting for a reply. This worked, but it had serious limitations that became apparent when we needed fast sensor event detection.

### The getdatamulti problem

The AL1350's `getdatamulti` API call — which reads many data points in a single HTTP request — processes each data point **sequentially inside the firmware**. The manual states explicitly:

> *"The service sequentially reads the values of several data points and provides them."*

Requesting 16 data points (4 ports × mode + pdin + vendorid + deviceid) means 16 sequential IO-Link bus reads inside the device before a single HTTP response comes back. On a constrained embedded CPU with IO-Link bus round-trips of 1–5 ms per port, a fully-loaded call takes 200–400 ms to return.

### The hardware connection limit

The AL1350 can only handle **3 simultaneous HTTP connections**. Exceed this and the device starts refusing or silently dropping requests — requests that then look like mysterious timeouts to the caller.

### The crash bug

The United Manufacturing Hub project — which integrates many IFM devices — has publicly documented a firmware bug in the AL1350:

> *"The current ifm firmware has a software bug, that will cause the IO-Link master to crash if it receives too many requests."*

The only fix is a power cycle or experimental firmware from IFM. Sustained polling faster than approximately 1 request per second risks triggering this.

### What this means in practice

| Limitation | Effect |
|---|---|
| Sequential getdatamulti | Round-trip time is 200–400 ms minimum, not just network latency |
| 3 connection cap | You cannot parallelise HTTP requests to reduce latency |
| Firmware crash bug | You cannot safely poll faster than ~1 second |
| Poll-then-sleep loop | Actual update interval = poll time + sleep time = up to 1.5 s |

For a capacitive sensor that responds in under 10 ms, or a photoelectric sensor that can switch at up to 5 kHz, a 1.5 s detection window means events are routinely missed entirely. An object could pass in front of a sensor, trigger it, and release before the next poll ever fires.

The solution is to stop pulling data and let the AL1350 **push** it to us instead.

---

## 4. What is MQTT?

**MQTT** (Message Queuing Telemetry Transport) is a lightweight messaging protocol designed specifically for constrained devices and unreliable networks. It is the de-facto standard for IoT communication and is used everywhere from industrial automation to home smart devices.

### The Publish / Subscribe model

HTTP is a **request/response** protocol: you ask, the server answers. MQTT is a **publish/subscribe** protocol: devices send messages when they have something to say, and any subscriber that cares about that topic receives it automatically.

```
           HTTP (old way):                    MQTT (new way):
                                     
  Client ──── "give me data" ────> Server     AL1350 ──── data ────> Broker ──> Client
  Client <─── data ─────────────── Server                                (whenever data changes)
  (repeat every second)                        (broker stores & routes messages)
```

Three roles exist in MQTT:

- **Publisher:** A device that produces data and sends it to the broker. In our system: the AL1350.
- **Broker:** A server that receives all messages and routes them to subscribers. In our system: **Mosquitto**, running on the Raspberry Pi.
- **Subscriber:** A client that registers interest in a topic and receives all matching messages. In our system: the Python FastAPI backend.

### Topics

Every MQTT message is tagged with a **topic** — a string that looks like a path:

```
iolink
sensors/temperature
factory/line1/conveyor/speed
```

Topics are completely free-form strings. Publishers choose what topics to use, and subscribers choose which topics to watch. In our system the AL1350 publishes everything to a single topic: `iolink`.

### Why MQTT is better here

- The AL1350 pushes data to the broker the moment the timer fires — no waiting for a poll request.
- The broker handles routing. The backend just subscribes and receives.
- MQTT has very low overhead: messages are binary frames, not HTTP headers + JSON wrappers.
- If the backend is temporarily disconnected, the broker can buffer messages.
- Multiple clients can subscribe to the same topic simultaneously with no extra load on the AL1350.

---

## 5. The New Architecture — Push, Not Pull

```
┌─────────────────────────────────────────────────────────────────┐
│                  Browser (HMI Dashboard)                         │
│                                                                  │
│  JavaScript ← WebSocket messages (JSON) ← FastAPI backend        │
│  Chart.js renders gauges, trends                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │ WebSocket  ws://iolink.local/ws
┌────────────────────────▼────────────────────────────────────────┐
│              Python Backend (FastAPI + aiomqtt)                  │
│                                                                  │
│  MQTT listener task (primary):                                   │
│    1. Receive MQTT push from broker every 500 ms                 │
│    2. Parse pdin, mode, supervision from payload                 │
│    3. Decode sensor bytes → engineering values                   │
│    4. Broadcast JSON to all WebSocket clients immediately        │
│                                                                  │
│  HTTP poll task (secondary / fallback):                          │
│    1. Refresh static metadata every 6 cycles (vendor, name...)   │
│    2. Read capacitive detection counter via ISDU each cycle      │
│    3. Full fallback if MQTT broker is unreachable                │
└──────┬───────────────────────────────┬───────────────────────────┘
       │ aiomqtt subscribe             │ HTTP REST (metadata only)
       │ topic: "iolink"               │
┌──────▼──────────────┐     ┌──────────▼────────────────────────┐
│  Mosquitto Broker    │     │   IFM AL1350 IO-Link Master        │
│  127.0.0.1:1883      │<────│   192.168.7.4                     │
│  (on Raspberry Pi)   │MQTT │                                   │
└─────────────────────┘push  │  Ports 1-4: cyclic IO-Link (1-5ms)│
                             └───────────────────────────────────┘
```

The AL1350 does the work. It polls its own sensors every 1–5 ms over IO-Link, buffers the latest value, and fires an MQTT publish every 500 ms to the Mosquitto broker on the Pi. The backend is a passive subscriber — it receives data without asking for it.

The end result: sensor state changes reach the HMI dashboard within **500–600 ms** from the moment the AL1350 detects them, versus the previous **1–1.5 s** with additive HTTP latency. More importantly, the AL1350 is no longer under constant HTTP polling pressure, which eliminates the crash risk.

---

## 6. The AL1350 Subscribe Service

The AL1350 has a built-in subscription system described in the manual as section 9.2.12. You configure it once (or on each backend restart), and the device handles the rest automatically.

### How it works

The subscription system uses a **timer** object on the device (`timer[1]`). When the timer fires, the AL1350 reads the current value of every subscribed data point and publishes them all to the configured callback address in a single message.

You configure it with two service calls:

**Step 1 — Register the data points and callback address:**

```
POST http://192.168.7.4/
Body:
{
  "code": "request",
  "cid": -1,
  "adr": "/timer[1]/counter/datachanged/subscribe",
  "data": {
    "callback": "mqtt://192.168.7.2:1883/iolink",
    "datatosend": [
      "/iolinkmaster/port[1]/iolinkdevice/pdin",
      "/iolinkmaster/port[2]/iolinkdevice/pdin",
      "/iolinkmaster/port[3]/iolinkdevice/pdin",
      "/iolinkmaster/port[4]/iolinkdevice/pdin",
      "/iolinkmaster/port[1]/mode",
      "/iolinkmaster/port[2]/mode",
      "/iolinkmaster/port[3]/mode",
      "/iolinkmaster/port[4]/mode",
      "/processdatamaster/temperature",
      "/processdatamaster/voltage",
      "/processdatamaster/current",
      "/processdatamaster/supervisionstatus"
    ]
  }
}
```

**Step 2 — Set the timer interval (minimum 500 ms):**

```
POST http://192.168.7.4/
Body:
{
  "code": "request",
  "cid": -1,
  "adr": "/timer[1]/interval/setdata",
  "data": { "newvalue": 500 }
}
```

Both calls return `{ "code": 200 }` on success.

### The callback URL format

The callback URL tells the AL1350 **where** to send its push messages. It supports two forms:

| Format | Example | When to use |
|---|---|---|
| MQTT broker | `mqtt://192.168.7.2:1883/iolink` | Push to MQTT broker, topic `iolink` |
| HTTP callback | `http://192.168.7.2:8000/api/push` | POST to an HTTP endpoint on the client |

We use the MQTT form. The URL structure is `mqtt://<broker-host>:<port>/<topic>`. The topic segment (`iolink`) is where all messages will be published.

### Important: subscriptions do not survive power cycles

When the AL1350 is powered off or rebooted, **all subscriptions are lost**. The device does not persist them to flash memory. Our backend calls `ensure_mqtt_subscription()` on every startup to re-register. This is why you will see "MQTT subscription active" in the backend logs each time the service starts.

### The 500 ms floor

The firmware enforces a **minimum timer interval of 500 ms**. You cannot set it lower. This is the fundamental limit of the push mechanism — the fastest you can receive data is twice per second. This is still a significant improvement over the previous ~1.5 s HTTP polling cycle.

---

## 7. The MQTT Message Format

When the AL1350 fires its timer, it publishes a single JSON message to the `iolink` topic. Here is a real example captured from our system:

```json
{
  "code": "event",
  "cid": -1,
  "adr": "/iolink",
  "data": {
    "eventno": 47,
    "srcurl": "00-02-01-AA-26-64/timer[1]/counter/datachanged",
    "payload": {
      "/timer[1]/counter": { "code": 200, "data": 47 },
      "/iolinkmaster/port[1]/iolinkdevice/pdin": { "code": 200, "data": "00EB" },
      "/iolinkmaster/port[2]/iolinkdevice/pdin": { "code": 200, "data": "0A8C0001" },
      "/iolinkmaster/port[3]/iolinkdevice/pdin": { "code": 200, "data": "0164" },
      "/iolinkmaster/port[4]/iolinkdevice/pdin": { "code": 503 },
      "/iolinkmaster/port[1]/mode": { "code": 200, "data": 3 },
      "/iolinkmaster/port[2]/mode": { "code": 200, "data": 3 },
      "/iolinkmaster/port[3]/mode": { "code": 200, "data": 3 },
      "/iolinkmaster/port[4]/mode": { "code": 200, "data": 3 },
      "/processdatamaster/temperature": { "code": 200, "data": 42 },
      "/processdatamaster/voltage": { "code": 200, "data": 24.1 },
      "/processdatamaster/current": { "code": 200, "data": 0.35 },
      "/processdatamaster/supervisionstatus": { "code": 200, "data": 0 }
    }
  }
}
```

### Anatomy of the message

| Field | What it contains |
|---|---|
| `code` | Always `"event"` for push messages |
| `data.eventno` | Incrementing counter — useful to detect missed messages |
| `data.srcurl` | The device MAC address and which timer fired |
| `data.payload` | Dictionary of all subscribed data points and their current values |

### Reading values from the payload

Each entry in `payload` is a mini-response in the same format as a direct HTTP GET:

```json
"/iolinkmaster/port[1]/iolinkdevice/pdin": { "code": 200, "data": "00EB" }
```

- `"code": 200` means the device returned a valid value.
- `"code": 503` means the device on that port is not connected or not responding.
- The actual value is always at `"data"` (not `"value"` — this differs from the direct GET API).

### Checking for missed messages

The `eventno` field increments by 1 on every message. If you receive event 47, then 49 (skipping 48), a message was dropped somewhere between the AL1350 and your subscriber. This can happen if the broker was briefly unreachable or the subscriber was processing a previous message too slowly.

In practice on a local LAN, dropped MQTT messages are extremely rare. But you should be aware the counter exists — if you ever see gaps in the diagnostics panel, check event numbers.

---

## 8. Mosquitto — The Message Broker

**Mosquitto** is an open-source MQTT broker maintained by the Eclipse Foundation. It is the most widely used MQTT broker in the world — lightweight (runs in ~2 MB of RAM), battle-tested, and available on Raspberry Pi OS via `apt`.

### What the broker does

The broker is the central post office of the MQTT system. It:

1. Accepts incoming connections from publishers (the AL1350) and subscribers (the Python backend).
2. Receives published messages and stores them temporarily.
3. Routes each message to every subscriber whose topic filter matches.

The broker does **not** care about the content of the messages — it just routes them based on topic strings.

### Our Mosquitto configuration

Mosquitto runs as a systemd service on the Pi. Its configuration is at `/etc/mosquitto/conf.d/iolink.conf`:

```
listener 1883 0.0.0.0
allow_anonymous true
```

- `listener 1883 0.0.0.0` — listen on port 1883 on all network interfaces (so the AL1350, which is on the same LAN, can publish to it).
- `allow_anonymous true` — no username/password required. This is acceptable on an isolated factory LAN. In a production deployment with untrusted network access, you would add password authentication.

### Checking the broker

To see all messages flowing through the broker in real time, run from the Pi terminal:

```bash
mosquitto_sub -h 127.0.0.1 -p 1883 -t '#' -v
```

The `#` is an MQTT wildcard meaning "all topics". The `-v` flag shows the topic name alongside the message. You will see the AL1350's push messages arrive every 500 ms.

### The broker as a reliability buffer

If the Python backend restarts (for example during a code deploy), the Mosquitto broker keeps running. The AL1350 continues publishing to it without interruption. When the backend reconnects, it immediately starts receiving the latest values. There is no gap in the data from the sensors' perspective — only the browser display is briefly interrupted.

---

## 9. The Python MQTT Listener

The backend uses **`aiomqtt`** — an asynchronous Python MQTT client built on top of the well-established `paho-mqtt` library. The `async` design is critical: the MQTT listener runs as a background task alongside the HTTP polling loop and the WebSocket server, all on the same Python event loop, without blocking each other.

### The listener task

The `run_mqtt_listener()` function in [io_link_fastapi.py](../backend/io_link_fastapi.py) is started at application startup alongside the HTTP polling task:

```python
async def run_mqtt_listener():
    reconnect_delay = 5.0
    while True:
        try:
            # 1. Register the subscription with the AL1350
            ok = await al1350.ensure_mqtt_subscription(
                broker_host, broker_port, interval_ms
            )

            # 2. Connect to Mosquitto and subscribe to the "iolink" topic
            async with aiomqtt.Client(broker_host, port=broker_port) as client:
                await client.subscribe("iolink")

                # 3. Process messages as they arrive
                async for message in client.messages:
                    _parse_mqtt_message(bytes(message.payload))
                    await broadcast_to_clients(system_state)

        except Exception as e:
            # 4. On any error, wait and retry
            await asyncio.sleep(reconnect_delay)
            reconnect_delay = min(reconnect_delay * 2, 60.0)
```

There are four distinct phases worth understanding:

**Phase 1 — Subscribe registration:** Before connecting to the broker, the backend calls `ensure_mqtt_subscription()` on the AL1350 via HTTP. This tells the AL1350 which data points to include in its push messages and where to send them. This is the only HTTP call made at startup for MQTT purposes.

**Phase 2 — Broker connection:** `aiomqtt.Client` opens a TCP connection to Mosquitto on `127.0.0.1:1883`. This is a loopback connection — the broker is on the same Pi, so it is essentially instant and never congested.

**Phase 3 — Message loop:** `async for message in client.messages` is an asynchronous generator that yields a new message object each time the broker delivers one. The `await` here yields control to the event loop between messages, allowing WebSocket broadcasts and HTTP polls to run concurrently.

**Phase 4 — Reconnect with backoff:** If anything goes wrong — Mosquitto crashes, the network blips, or the broker refuses the connection — the `except` block catches it, logs a warning, and waits before retrying. The delay doubles on each failure (5 s, 10 s, 20 s, up to 60 s maximum) to avoid hammering a broker that is struggling to come back up.

---

## 10. Parsing the Push Message

When a message arrives from the broker, `_parse_mqtt_message()` in [io_link_fastapi.py](../backend/io_link_fastapi.py) extracts all the values and merges them into the global `system_state` dictionary that the WebSocket server broadcasts to browsers.

### The merge strategy

The push message contains **pdin, mode, and supervision** — but not the static metadata that rarely changes (vendor ID, device ID, product name, serial number). Those are fetched by the HTTP polling loop and cached. When a push message arrives, the parser:

1. Takes the existing `system_state["ports"]` (which has the static metadata already populated by HTTP).
2. Overwrites just the `pdin` and `mode` fields with the fresh values from the MQTT payload.
3. Re-runs `_enrich_port()` to decode the raw hex PDin bytes into engineering values.
4. Updates the supervision fields (temperature, voltage, current) from the payload.

This is called a **merge** strategy — the push message provides the fast-changing fields, HTTP provides the slow-changing fields, and the result is a complete picture.

### Code path

```python
def _parse_mqtt_message(raw: bytes) -> None:
    msg = json.loads(raw)
    payload = msg["data"]["payload"]

    for port_num in range(1, 5):
        pdin_entry = payload.get(f"/iolinkmaster/port[{port_num}]/iolinkdevice/pdin", {})
        mode_entry = payload.get(f"/iolinkmaster/port[{port_num}]/mode", {})

        if pdin_entry.get("code") == 200:
            port["pdin"] = pdin_entry["data"]     # raw hex string
        if mode_entry.get("code") == 200:
            port["mode"] = MODE_MAP[mode_entry["data"]]  # int → "io-link" etc.

        _enrich_port(port, port_labels=port_labels)  # decode PDin bytes
```

The `_enrich_port()` function is shared between both the MQTT path and the HTTP polling path — decoding logic lives in one place ([decoder.py](../backend/decoder.py)).

### What happens when a port returns code 503

If `"code": 503` appears for a port's pdin (meaning the IO-Link device is not connected), the parser **does not overwrite** the existing cached value — the port keeps its last known state and the mode field drives the "disconnected" display in the UI.

---

## 11. Understanding Port Modes and Process Data

These concepts are unchanged from the HTTP polling era. They are fundamental to IO-Link regardless of whether data arrives via MQTT or HTTP polling.

### Port modes

Each of the master's 4 ports can operate in one of 4 modes. The master returns these as integers:

| Integer | String name | Meaning |
|---|---|---|
| `0` | `inactive` | Port is disabled or nothing connected |
| `1` | `digital_in` | Classic digital input (0 V or 24 V) |
| `2` | `digital_out` | Classic digital output |
| `3` | `io-link` | Full IO-Link mode — smart sensor/actuator connected |

Only mode `3` gives you rich process data and device identification.

### PDin — Process Data Input

**PDin** flows from the sensor to the master. It arrives in the MQTT push payload as a **hexadecimal string** — for example `"0A8C0001"`. That is raw bytes encoded in hex. What those bytes mean depends entirely on the sensor type.

The master cycles PDin with every connected IO-Link device every 1–5 ms. When the MQTT timer fires at 500 ms, the master reads the latest buffered PDin for all ports and includes them in the push message. You are always getting the most recent value.

### PDout — Process Data Output

**PDout** flows from the master to actuators (the reverse direction). It carries commands — for example, telling an LED light stack what colour to display. PDout is not included in the MQTT push payload because it does not change unless we write to it. It is still read via HTTP when needed.

---

## 12. Decoding Sensor Data

Raw hex bytes need to be interpreted. The `_enrich_port()` function calls the appropriate decoder from [decoder.py](../backend/decoder.py) based on the detected device type. Here is how each sensor on this system is decoded.

### Temperature Sensor (IFM TV7 series) — Port 1

PDin: **2 bytes, big-endian, signed 16-bit integer, 0.1 °C resolution**

```
Raw PDin from MQTT: "00EB"
Bytes: [0x00, 0xEB] = [0, 235]
16-bit value: (0 << 8) | 235 = 235
Temperature = 235 × 0.1 = 23.5 °C
```

If the 16-bit value is ≥ 32768 (0x8000), it is a negative number — subtract 65536 for the signed result (standard two's complement).

### Capacitive Sensor (RS PRO 2377240 / Carlo Gavazzi) — Port 2

PDin: **4 bytes**

```
Raw PDin from MQTT: "0A8C0001"
Bytes: [0x0A, 0x8C, 0x00, 0x01]

Bytes 0–1 (big-endian): (0x0A << 8) | 0x8C = 2700  → Analogue dielectric value
Byte 2:  0x00  → SSC1/SSC2 switching channel flags (both inactive)
Byte 3:  0x01  → bit 0 = 1 → Switching output 1 active → Object detected
```

The analogue value represents the strength of the dielectric effect — higher means more material detected. The switching output bit is the simple yes/no answer. The analogue value is useful for level sensing (e.g., gradually rising liquid) because it gives a continuous reading, not just a threshold.

### Photoelectric Sensor (Contrinex LTR-M18PA-PMx-603, sold as RS PRO 0360240) — Port 3

PDin: **1–2 bytes**

```
Raw PDin from MQTT: "01"
Byte 0: 0x01 → bit 0 = 1 → Object detected (beam reflected back)

Raw PDin from MQTT: "0064"
Byte 0: 0x00 → No object detected
Byte 1: 0x64 = 100 → Signal quality: 100%
```

The first bit of the first byte is the switching output. Additional bytes carry signal quality — a value that drops before total failure, giving early warning to clean the lens or adjust alignment.

### LED Light Stack (IFM CL50 PRO SELECT) — Port 4

The LED uses **PDout** (we send commands *to* it). It expects **3 bytes**:

```
Byte 0: [AudibleState (2 bits)] [Color2 Intensity (3 bits)] [Color1 Intensity (3 bits)]
Byte 1: [Speed (2 bits)] [Pulse Pattern (3 bits)] [Animation (3 bits)]
Byte 2: [Color 2 (4 bits)] [Color 1 (4 bits)]
```

Example — solid green at high intensity, no sound:

```
Byte 2: Color1 = 0 (Green), Color2 = 0 (Green) → 0x00
Byte 1: Animation = 1 (Steady), Pulse = 0, Speed = 0 → 0x01
Byte 0: Color1 Intensity = 0 (High), Color2 Intensity = 3 (Off), Audible = 0 → 0x18

PDout = "180100"
```

Port 4 returns `"code": 503` in the MQTT PDin payload because the LED stack has no PDin — it only has PDout. This is normal and expected.

---

## 13. The Capacitive Sensor Detection Counter (ISDU)

The MQTT push mechanism delivers the current PDin state at 500 ms intervals. But what about events that happen and complete *between* two push messages? An object touching the capacitive sensor for 100 ms would never appear in any push message — it arrived and left in the gap.

The RS PRO 2377240 capacitive sensor has a hardware solution for exactly this problem: a built-in **Detection Counter**.

### What it is

The sensor has an internal counter that increments every time **SSC1 changes state** — every single detection event, regardless of duration. This counter is stored in the sensor's own non-volatile memory (saved to flash once per hour to protect against power loss) but updates in the sensor's live memory on every state change.

| Counter property | Value |
|---|---|
| ISDU index | 210 (0xD2), subindex 0 |
| Data type | 32-bit signed integer |
| Range | 0 to 2,147,483,647 |
| Updated | On every SSC1 state change (real-time in memory) |
| Persisted to flash | Once per hour |

### What is ISDU?

**ISDU** (Indexed Service Data Unit) is IO-Link's mechanism for reading and writing a device's **parameter memory** — data that is not part of the fast cyclic PDin/PDout exchange. Think of it as a slow, acyclic read that goes directly to the sensor's internal registers.

Reading an ISDU parameter is done via the AL1350's `iolreadacyclic` service:

```
POST http://192.168.7.4/
Body:
{
  "code": "request",
  "cid": -1,
  "adr": "/iolinkmaster/port[2]/iolinkdevice/iolreadacyclic",
  "data": { "index": 210, "subindex": 0 }
}

Response:
{
  "cid": -1,
  "code": 200,
  "data": { "value": "000003E8" }
}
```

The `value` is the raw data as a **hex string** and must be decoded. For the detection counter (32-bit signed integer, big-endian):

```
Hex: "000003E8"
Raw integer: 0x000003E8 = 1000
Detection counter = 1000 activations
```

### How we use it

The HTTP polling loop (which still runs every 1 s alongside MQTT) reads the detection counter each cycle for any capacitive port in IO-Link mode. The current value is compared to the previous value to compute a **delta** — the number of detections that occurred in the last poll interval, regardless of whether any MQTT push message captured a state change.

```python
prev = _cap_counter_prev.get(port_num)          # e.g. 1000
current = await al1350.read_isdu_int32(port, 210, 0)  # e.g. 1003

delta = current - prev   # 3 detections occurred since last poll
_cap_counter_prev[port_num] = current
```

This `detection_counter_delta` field appears in the IO-Link page's port detail panel. A delta of 3 when the switching output shows "No object" means the capacitive sensor triggered and released 3 times between polls — something that would be completely invisible from PDin alone.

### Why ISDU and not MQTT?

The detection counter is not a cyclic PDin data point — it is an acyclic parameter in the sensor's internal memory. The AL1350 subscription system only supports cyclic data points (those accessible via `getdatamulti`). ISDU reads require a separate explicit request to the AL1350, so they must remain as HTTP calls. This is expected — ISDU reads are relatively infrequent and the counter changes slowly enough that 1 Hz reading is more than adequate.

---

## 14. The Dual-Track Architecture — MQTT + HTTP Fallback

The system runs two data paths simultaneously. This is not redundancy for reliability — it is a deliberate separation of concerns:

```
┌────────────────────────────────────────────────────────────┐
│                   Data Source Split                         │
│                                                            │
│  MQTT push (500 ms)      │  HTTP poll (1 s)                │
│  ─────────────────────── │  ────────────────────────       │
│  pdin (all 4 ports)      │  vendor_id, device_id           │
│  mode (all 4 ports)      │  product name, serial number    │
│  supervision data        │  ISDU detection counter         │
│                          │  Full fallback if MQTT down     │
└────────────────────────────────────────────────────────────┘
```

### Why keep HTTP at all?

**Static metadata** — the device's vendor ID, product name, and serial number — never changes while the sensor is connected. Fetching it via MQTT every 500 ms would be wasteful. The HTTP poll fetches it once and caches it.

**ISDU reads** — as explained in section 13, the detection counter must be read via a direct HTTP service call.

**Fallback** — if Mosquitto crashes or the broker is unrestarted after a Pi reboot, the MQTT listener fails to connect. The HTTP polling loop continues running at 1 s intervals, providing all data including pdin, at the old polling rate. The UI continues functioning. The MQTT listener retries with exponential backoff until the broker comes back.

### Data source tagging

Every port data object in the WebSocket broadcast carries a `"source"` field:

| Value | Meaning |
|---|---|
| `"mqtt"` | This pdin value came from an MQTT push message |
| `"getdatamulti"` | This pdin value came from an HTTP getdatamulti response |
| `"fallback"` | HTTP was used because getdatamulti failed; individual GETs were used |

The admin page diagnostics panel shows whether MQTT is connected (`mqtt_connected: true/false`), making it easy to tell at a glance which data path is active.

---

## 15. Supervision Data in the Push Payload

The AL1350 reports its own health alongside the sensor data in each MQTT push message. This is called **supervision data** and covers the master device itself:

| MQTT payload path | What it tells you | Example |
|---|---|---|
| `/processdatamaster/temperature` | Master CPU temperature (°C) | `42` |
| `/processdatamaster/voltage` | Supply voltage to all sensors (V) | `24.1` |
| `/processdatamaster/current` | Total current drawn by all sensors (A) | `0.35` |
| `/processdatamaster/supervisionstatus` | Fault bitmask — `0` = all OK | `0` |

These arrive in every MQTT message at no extra cost. The parser extracts them and stores them in `system_state["supervision"]`, which is displayed on the IO-Link page supervision table and graphed as a trend in the supervision charts.

If the voltage drops below 18 V or temperature rises above 70 °C, the `supervisionstatus` bitmask will set fault bits. Monitoring this lets you detect power supply problems before they cause mysterious sensor failures.

---

## 16. Reliability in Real Systems

This section explains the engineering patterns that appear in the backend code. Industrial networks are not perfect — cables get knocked, Mosquitto may restart, the AL1350 may need to be power-cycled. A naive MQTT listener that crashes on the first error is unusable in the field.

### MQTT reconnect with exponential backoff

If the connection to Mosquitto drops (or was never established), `run_mqtt_listener()` catches the exception, logs a warning, and sleeps before retrying. The sleep time doubles on each consecutive failure:

```
Attempt 1 fails → wait 5 s
Attempt 2 fails → wait 10 s
Attempt 3 fails → wait 20 s
Attempt 4 fails → wait 40 s
Attempt 5+ fails → wait 60 s (capped)
```

The cap at 60 s means the system will always recover within a minute of the broker returning, without hammering it constantly if it is struggling.

### Re-subscribing after reconnect

Each time the MQTT listener successfully reconnects, it calls `ensure_mqtt_subscription()` again before subscribing to the broker topic. This is because the AL1350 may have been power-cycled while the broker was down — meaning its subscription registration was lost. Re-registering on every connect ensures the AL1350 always knows where to push data.

### HTTP fallback

The HTTP polling task runs continuously, independent of the MQTT listener. It uses the same circuit breaker, retry-with-jitter, and connection pooling patterns as before. If MQTT is working correctly, the HTTP poll's pdin data is overwritten by the more recent MQTT data on each WebSocket broadcast. If MQTT fails, the HTTP poll's pdin data is the only source and takes over seamlessly.

### Circuit breaker (HTTP path)

The HTTP client implements a circuit breaker pattern for calls to the AL1350:

```
CLOSED (normal) ──5 failures──> OPEN (blocking)
                                     │
                                  15 seconds
                                     │
                              HALF-OPEN (testing)
                                  │       │
                              success   failure
                                 │         │
                              CLOSED      OPEN
```

The MQTT path does not use a circuit breaker because MQTT failure is handled by the broker connection retry loop — if the broker is unreachable, `aiomqtt.Client` raises an exception and the backoff loop handles it.

### Adaptive polling (HTTP path)

The HTTP poll still uses adaptive intervals for ports. Connected IO-Link ports are polled every 1 second (needed for ISDU counter reads). Inactive or error ports are polled every 5 seconds (no sensor data to read).

---

## 17. How Our HMI Puts It All Together

Three layers — sensor hardware, backend, and browser — connect through two protocols: MQTT and WebSocket.

```
MQTT push path (500 ms):
    AL1350 ──MQTT──> Mosquitto ──aiomqtt──> FastAPI ──WebSocket──> Browser
    
HTTP metadata path (6 s cycle):
    AL1350 <──HTTP GET/POST──> FastAPI ──(merged into system_state)──> Browser

ISDU counter path (1 s cycle):
    AL1350 <──HTTP POST iolreadacyclic──> FastAPI ──(merged)──> Browser
```

### What happens from power-on to live dashboard

1. **Pi boots.** Mosquitto starts automatically as a systemd service.
2. **FastAPI starts.** The startup event fires:
   - Calls `refresh_gettree()` on the AL1350 over HTTP (warms the device tree cache).
   - Starts the HTTP polling task (handles static metadata and ISDU counter).
   - Starts the MQTT listener task.
3. **MQTT listener registers subscription.** Calls `ensure_mqtt_subscription()` on the AL1350 via HTTP — tells it to push all pdin, mode, and supervision data to `mqtt://127.0.0.1:1883/iolink` every 500 ms.
4. **AL1350 begins publishing.** Every 500 ms, it reads all subscribed data points and sends a JSON message to Mosquitto.
5. **FastAPI receives messages.** The `async for message in client.messages` loop fires. Each message is parsed, decoded, and merged into `system_state`.
6. **Browser connects.** Chromium opens, connects to the WebSocket at `ws://localhost/ws`. The FastAPI server sends the current `system_state` immediately.
7. **Live updates flow.** Every 500 ms, the MQTT push triggers a WebSocket broadcast. The browser redraws gauges and charts in real time.

### The role of each file

| File | Role |
|---|---|
| [io_link_fastapi.py](../backend/io_link_fastapi.py) | MQTT listener, message parser, WebSocket server, HTTP fallback |
| [al1350_client.py](../backend/al1350_client.py) | HTTP client with circuit breaker; `ensure_mqtt_subscription()` |
| [decoder.py](../backend/decoder.py) | PDin hex byte decoding for all sensor types |
| [config.json](../backend/config.json) | MQTT broker address, poll intervals, port labels |

---

## 18. Quick Reference

### MQTT subscription paths (what the AL1350 pushes)

| Data | Payload path |
|---|---|
| Port N process data in | `/iolinkmaster/port[N]/iolinkdevice/pdin` |
| Port N operating mode | `/iolinkmaster/port[N]/mode` |
| Master temperature (°C) | `/processdatamaster/temperature` |
| Master supply voltage (V) | `/processdatamaster/voltage` |
| Total sensor current (A) | `/processdatamaster/current` |
| Fault bitmask | `/processdatamaster/supervisionstatus` |

### HTTP paths still used (static metadata + ISDU)

| Data | Method | Path |
|---|---|---|
| Vendor ID | GET/multi | `iolinkmaster/port[N]/iolinkdevice/vendorid` |
| Device ID | GET/multi | `iolinkmaster/port[N]/iolinkdevice/deviceid` |
| Product name | GET/multi | `iolinkmaster/port[N]/iolinkdevice/productname` |
| Serial number | GET/multi | `iolinkmaster/port[N]/iolinkdevice/serialnumber` |
| Capacitive detection counter | POST iolreadacyclic | index 210, subindex 0 on port 2 |

### AL1350 subscribe service calls

| Service | Address (`adr`) |
|---|---|
| Register subscription | `/timer[1]/counter/datachanged/subscribe` |
| Set push interval | `/timer[1]/interval/setdata` |
| Read current interval | `/timer[1]/interval/getdata` |

### MQTT broker (Mosquitto on Pi)

| Setting | Value |
|---|---|
| Host | `127.0.0.1` (loopback from FastAPI) / `192.168.7.2` (from AL1350) |
| Port | `1883` |
| Topic subscribed by AL1350 | `iolink` |
| Config file | `/etc/mosquitto/conf.d/iolink.conf` |
| Systemd service | `mosquitto.service` |

### Port mode integers

| Integer | String | Meaning |
|---|---|---|
| `0` | `inactive` | Nothing connected |
| `1` | `digital_in` | Classic 24 V digital input |
| `2` | `digital_out` | Classic 24 V digital output |
| `3` | `io-link` | Smart IO-Link device |

---

## 19. Student Exercises

Work through these to test and deepen your understanding.

### Exercise 1 — Watch the raw MQTT stream
From the Pi terminal, run:
```bash
mosquitto_sub -h 127.0.0.1 -p 1883 -t '#' -v
```
Watch the messages arrive every 500 ms. Notice the `eventno` counter incrementing. What happens to it if you disconnect and reconnect the subscriber?

### Exercise 2 — Identify the temperature
Find the PDin value for port 1 in a raw MQTT message. Apply the formula from section 12 to convert the hex bytes to °C. Then compare it with the value displayed in the HMI dashboard — do they match?

### Exercise 3 — Simulate a missed event
Hold an object in front of the capacitive sensor on port 2, then quickly pull it away before the next MQTT message fires. Watch the IO-Link page port detail panel — does the `detection_counter_delta` show that an event occurred even though the pdin switching output never showed "Object detected" in the UI?

### Exercise 4 — Trace the subscription registration
Look at the `ensure_mqtt_subscription()` method in [al1350_client.py](../backend/al1350_client.py). How many HTTP calls does it make? What happens if the first one succeeds but the second one (setting the timer interval) fails? Is the system in a safe state?

### Exercise 5 — Understand eventno gaps
The MQTT message includes an `eventno` counter. Write pseudocode for a monitor that tracks this counter and logs a warning whenever it detects a gap (i.e., a skipped event number). What would cause a gap, and under what conditions on a local LAN would you expect to see one?

### Exercise 6 — MQTT vs HTTP latency thought experiment
The AL1350 pushes data every 500 ms. The HTTP poll runs every 1 s with deadline-based sleep. If a sensor state changes at time T = 0:
- What is the **worst case** time for the MQTT path to deliver this to the browser?
- What is the **worst case** for the HTTP poll path?
- Draw a timeline diagram showing both paths.

### Exercise 7 — Detection counter arithmetic
The detection counter for the capacitive sensor reads `1247` at t=0, and `1251` at t=1 s. How many SSC1 state changes occurred? Is that 4 detections or 2 detections? (Think carefully: what counts as one "state change"?)

### Exercise 8 — Design challenge: adding MQTT support for a new data point
You want to add the `mastercycletime_actual` value for port 2 to the MQTT push payload (this is the live IO-Link cycle time between the master and the capacitive sensor, in microseconds).

- What would you add to the `datatosend` list in `ensure_mqtt_subscription()`?
- What key would you look for in `_parse_mqtt_message()`?
- Where in the `port` dict would you store it?
- What existing code path is responsible for calling `_enrich_port()` after the merge?

---

## Glossary

| Term | Definition |
|---|---|
| **IO-Link** | IEC 61131-9 standard for smart sensor/actuator communication |
| **IO-Link Master** | The device that bridges IO-Link ports to Ethernet |
| **AL1350** | IFM's 4-port IO-Link Master used in this system |
| **PDin** | Process Data Input — data from sensor to master (cyclic) |
| **PDout** | Process Data Output — data from master to actuator (cyclic) |
| **ISDU** | Indexed Service Data Unit — IO-Link acyclic parameter access |
| **MQTT** | Message Queuing Telemetry Transport — lightweight IoT messaging protocol |
| **Publish/Subscribe** | Messaging pattern where producers and consumers are decoupled via a broker |
| **Topic** | An MQTT string label used to route messages from publishers to subscribers |
| **Broker** | The MQTT server that receives and routes messages (Mosquitto in our system) |
| **Publisher** | A device that sends MQTT messages (the AL1350 in our system) |
| **Subscriber** | A client that receives messages on a topic (the FastAPI backend) |
| **Mosquitto** | Open-source MQTT broker running on the Raspberry Pi |
| **aiomqtt** | Async Python MQTT client library used in the FastAPI backend |
| **Subscribe service** | AL1350 API feature (§9.2.12) that configures the device to push data |
| **timer[1]** | The AL1350's internal timer object that controls push interval |
| **eventno** | Incrementing counter in each MQTT message; gaps indicate dropped messages |
| **Detection counter** | Onboard SSC1 state-change counter in the capacitive sensor (ISDU index 210) |
| **getdatamulti** | AL1350 HTTP API service that reads multiple data points in one sequential request |
| **Circuit breaker** | Software pattern that stops retrying a clearly-failed HTTP connection |
| **Exponential backoff** | Reconnect strategy that doubles the wait time on each consecutive failure |
| **WebSocket** | Protocol for persistent two-way browser-server communication |
| **FastAPI** | Python web framework used for the backend API, MQTT listener, and WebSocket server |
| **HMI** | Human-Machine Interface — the dashboard the operator uses |
| **Semaphore** | Concurrency primitive that limits how many HTTP operations run simultaneously |

---

*This guide was written alongside real working code. Cross-reference with [al1350_client.py](../backend/al1350_client.py), [decoder.py](../backend/decoder.py), and [io_link_fastapi.py](../backend/io_link_fastapi.py) to see every concept implemented. The archived HTTP polling guide is at [IO-LINK-COMMS-GUIDE-ARCHIVED-http-polling.md](IO-LINK-COMMS-GUIDE-ARCHIVED-http-polling.md).*
