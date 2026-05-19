# IO-Link Communication Guide
### A Practical Introduction for Aspiring Controls Engineers

---

> **Who is this for?**
> This guide is written for students learning industrial automation. No prior knowledge of IO-Link is assumed — just a basic understanding of computers and networks. By the end, you will understand how a software system talks to real industrial sensors over a network and why each step is done the way it is.

---

## Table of Contents

1. [What is IO-Link?](#1-what-is-io-link)
2. [The Hardware Stack](#2-the-hardware-stack)
3. [How the AL1350 Talks to the Outside World](#3-how-the-al1350-talks-to-the-outside-world)
4. [Finding and Connecting to the Master](#4-finding-and-connecting-to-the-master)
5. [The API: How You Ask the Master Questions](#5-the-api-how-you-ask-the-master-questions)
6. [Reading a Single Data Point](#6-reading-a-single-data-point)
7. [Reading Many Data Points at Once (getdatamulti)](#7-reading-many-data-points-at-once-getdatamulti)
8. [Exploring the Device Tree (gettree)](#8-exploring-the-device-tree-gettree)
9. [Understanding Port Modes](#9-understanding-port-modes)
10. [Process Data — PDin and PDout](#10-process-data--pdin-and-pdout)
11. [Decoding Sensor Data](#11-decoding-sensor-data)
12. [Writing to a Port — Controlling Actuators](#12-writing-to-a-port--controlling-actuators)
13. [Configuring a Port](#13-configuring-a-port)
14. [Supervision Data — Monitoring the Master Itself](#14-supervision-data--monitoring-the-master-itself)
15. [Reliability in Real Systems](#15-reliability-in-real-systems)
16. [How Our HMI Puts It All Together](#16-how-our-hmi-puts-it-all-together)
17. [Quick Reference: All the Key Paths](#17-quick-reference-all-the-key-paths)
18. [Student Exercises](#18-student-exercises)

---

## 1. What is IO-Link?

Before factories became computerised, sensors and actuators were wired directly to a PLC (Programmable Logic Controller) using plain analogue signals — a wire carrying 0–10 V or 4–20 mA. The voltage level told the PLC how hot something was, or whether a door was open. This worked, but it had serious limits:

- You could only send one value per wire.
- You could not tell the PLC *what type* of sensor was connected.
- There was no way to send diagnostics or faults back.
- Calibration meant physically adjusting a potentiometer on the sensor body.

**IO-Link** (standardised as IEC 61131-9) solves all of this. It is a short-range, point-to-point digital communication protocol between a sensor/actuator and a device called an **IO-Link Master**. Instead of a voltage level, the sensor sends a digital packet of data — a structured message that can carry many values at once, including measurement data, status flags, fault codes, and configuration parameters.

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
┌──────────────────────────────────────────────────────────────┐
│                        FACTORY NETWORK (Ethernet)             │
│                        e.g. 192.168.7.0/24                    │
└────────────────────┬─────────────────────────────────────────┘
                     │  Ethernet cable
                     │
            ┌────────▼────────┐
            │  IFM AL1350      │   ← IO-Link MASTER
            │  IO-Link Master  │     IP: 192.168.7.4
            │                  │     4 x IO-Link ports
            └────────┬─────────┘
           ┌─────────┼───────────┐
     Port 1│   Port 2│     Port 3│     Port 4│
           │         │           │           │
     ┌─────▼─┐  ┌────▼──┐  ┌────▼──┐  ┌────▼──┐
     │ Temp  │  │ Cap.  │  │Photo  │  │ LED   │
     │Sensor │  │Sensor │  │Sensor │  │ Stack │
     └───────┘  └───────┘  └───────┘  └───────┘
       PDin        PDin       PDin      PDout
    (reading)   (reading)  (reading) (writing)
```

### The AL1350 is the bridge

The **IFM AL1350** (or similar AL1100/AL1300) is the star of the show. It does two jobs simultaneously:

1. **Speaks IO-Link** to the sensors on its 4 ports (the custom IO-Link serial protocol).
2. **Speaks Ethernet / HTTP** to the rest of the world (a standard web API).

Your software never directly touches the sensors. You talk to the master over Ethernet, and the master handles the IO-Link protocol for you.

---

## 3. How the AL1350 Talks to the Outside World

The AL1350 exposes its data through a **REST HTTP API** — exactly like a web server. This means you can communicate with it using any programming language, a web browser, or even a command-line tool like `curl`.

The API uses two mechanisms:

| Mechanism | When to use | HTTP verb |
|---|---|---|
| **GET data point** | Read one value from the device | `GET` |
| **Service call** | Complex operations (read many at once, subscribe, configure) | `POST` |

Both mechanisms use **JSON** (JavaScript Object Notation) for data — a simple, human-readable format that looks like a Python dictionary or a JavaScript object.

---

## 4. Finding and Connecting to the Master

### Network setup

The AL1350 must have an IP address on your local network. In this project:

- **Master IP:** `192.168.7.4`
- **Port:** `80` (standard HTTP)

There is no authentication required by default — you simply send HTTP requests to that address. In a real factory, the master would be behind a firewall or on an isolated automation network.

### Verifying the connection

The simplest way to check if the master is alive is to make a GET request to any data point. If you get a JSON response with `"code": 200`, you have a connection:

```
GET http://192.168.7.4/iolinkmaster/port[1]/mode/getdata
```

Response:
```json
{ "code": 200, "data": { "value": 3 } }
```

If you get a timeout or a connection refused error, the master is not reachable.

---

## 5. The API: How You Ask the Master Questions

### Two types of request

#### Type 1 — Simple GET (reading a single data point)

The URL itself encodes the path to the data you want:

```
GET http://192.168.7.4/<path>/getdata
```

Every successful response looks like this:

```json
{ "code": 200, "data": { "value": <the value you asked for> } }
```

If the path does not exist or the device is disconnected, `"code"` will not be 200.

#### Type 2 — Service call (POST to root)

For more complex operations, you POST a JSON "service request" to the root URL:

```
POST http://192.168.7.4/
Body: {
  "code": "request",
  "cid": -1,
  "adr": "<service name>",
  "data": { ... }
}
```

The `"adr"` field names the service you want. The `"cid"` field is a correlation ID — use `-1` and the master ignores it (it is designed for multi-request sequencing that we do not use here).

This pattern will become very familiar. Let us now walk through the specific services one by one.

---

## 6. Reading a Single Data Point

### The path system

The AL1350 organises its data in a **hierarchical tree of paths** — similar to a file system. Every piece of information has a path.

Here are some examples:

| What you want | Path |
|---|---|
| Port 1 mode (active/inactive) | `/iolinkmaster/port[1]/mode` |
| Port 1 IO-Link device process data in | `/iolinkmaster/port[1]/iolinkdevice/pdin` |
| Port 1 device vendor ID | `/iolinkmaster/port[1]/iolinkdevice/vendorid` |
| Master supply voltage | `/processdatamaster/voltage` |
| Device application tag (name) | `/devicetag/applicationtag` |

To **read** any of these, append `/getdata` and make a GET request:

```
GET http://192.168.7.4/iolinkmaster/port[2]/mode/getdata
```

Response:
```json
{ "code": 200, "data": { "value": 3 } }
```

The value `3` means IO-Link mode — we will decode these numbers shortly.

### What can go wrong

- **`"code": 400`** — Bad path or unsupported parameter.
- **`"code": 503`** — Device on that port is not connected or not responding.
- **No response / timeout** — The master itself is unreachable.

---

## 7. Reading Many Data Points at Once (getdatamulti)

Imagine you have 4 ports and need mode, process data, vendor ID, and device ID for each. That is 16 separate HTTP requests per polling cycle. At 1 second per cycle, that is 16 requests per second — more than the AL1350 hardware can comfortably handle (it caps at 3 concurrent connections).

The solution is **`getdatamulti`** — a single POST that asks for many data points in one round trip.

```
POST http://192.168.7.4/
Body:
{
  "code": "request",
  "cid": -1,
  "adr": "getdatamulti",
  "data": {
    "datatosend": [
      "iolinkmaster/port[1]/mode",
      "iolinkmaster/port[1]/iolinkdevice/pdin",
      "iolinkmaster/port[2]/mode",
      "iolinkmaster/port[2]/iolinkdevice/pdin"
    ]
  }
}
```

> **Important:** The paths inside `datatosend` must **not** end in `/getdata`. They are data-point paths, not service paths. This is a common mistake — if you include `/getdata` in the list, the master will ignore those entries.

The response bundles all the values together:

```json
{
  "code": 200,
  "data": {
    "iolinkmaster/port[1]/mode": { "code": 200, "data": 3 },
    "iolinkmaster/port[1]/iolinkdevice/pdin": { "code": 200, "data": "01A4" },
    "iolinkmaster/port[2]/mode": { "code": 200, "data": 0 },
    "iolinkmaster/port[2]/iolinkdevice/pdin": { "code": 503, "data": null }
  }
}
```

Notice that each entry in the response has its own `"code"` — port 2 returned 503 because nothing is connected there, but this did not prevent the other ports from returning valid data.

### Response key format

The response keys have **no leading slash**, even though the request paths may have one. In code you need to strip the leading `/` when looking up a result by path.

---

## 8. Exploring the Device Tree (gettree)

When you first connect to a master, you may not know exactly what data is available. The `gettree` service returns the full hierarchy of available data points:

```
POST http://192.168.7.4/
Body: { "code": "request", "cid": -1, "adr": "gettree" }
```

The response is a large nested JSON structure describing every readable and writeable path on the device. This is very useful during development to discover new data points without reading the manual.

Because the tree almost never changes, our system caches it for **5 minutes** after the first fetch. Calling gettree on every poll cycle would be wasteful — the hardware has limited CPU.

---

## 9. Understanding Port Modes

Each of the master's 4 ports can operate in one of 4 modes. The master returns these as integers:

| Integer value | String name | Meaning |
|---|---|---|
| `0` | `inactive` | Port is disabled or nothing connected |
| `1` | `digital_in` | Classic digital input (0 V or 24 V) |
| `2` | `digital_out` | Classic digital output |
| `3` | `io-link` | Full IO-Link mode — smart sensor/actuator connected |

Only mode `3` (IO-Link) gives you access to rich process data, device identification, and parameter configuration. Modes 1 and 2 are the old-fashioned way — you only get a single 1 or 0.

The mode is configured either via the AL1350 web interface or via a `setdata` service call (covered in section 13).

---

## 10. Process Data — PDin and PDout

This is the heart of IO-Link. **Process data** is the cyclically exchanged payload between the master and a sensor/actuator — the actual measurement values and control signals.

### PDin — Process Data Input

**PDin** flows **from the sensor to the master** (and ultimately to your software). It contains the sensor's measurement.

- A temperature sensor puts its current temperature reading in PDin.
- A photoelectric sensor puts a detection flag (object present/absent) in PDin.
- A capacitive sensor puts a detection flag plus an analogue dielectric value.

The master gives you PDin as a **hexadecimal string**. For example: `"01A4"`.

That is raw bytes encoded in hex. `01A4` means two bytes: `0x01` and `0xA4`, or in decimal: `1` and `164`.

What those bytes *mean* depends entirely on the sensor's IODD (IO-Link Device Description) file — a standardised XML document that every IO-Link device manufacturer publishes. Your job as a programmer is to decode those bytes according to the IODD.

### PDout — Process Data Output

**PDout** flows **from the master to the actuator** (the reverse direction). It contains commands.

- An LED light stack receives colour, animation, and intensity settings in PDout.
- A valve actuator would receive open/close commands in PDout.

Not all devices have both PDin and PDout. A pure sensor typically has only PDin. A pure actuator typically has only PDout. Some devices have both.

### Timing

The master exchanges process data with every connected IO-Link device in its **cycle time** — typically 1–5 ms per port. Your software polls much more slowly (1–5 seconds). That is fine: the master buffers the latest value and your poll reads it.

---

## 11. Decoding Sensor Data

Raw hex bytes need to be interpreted. Here is how the real sensors on this system are decoded.

### Temperature Sensor (IFM TV7 series)

PDin: **2 bytes, big-endian, signed 16-bit integer, 0.1 °C resolution**

```
Raw PDin: "00EB"
Bytes: [0x00, 0xEB] = [0, 235]
16-bit value: (0 << 8) | 235 = 235
Temperature = 235 × 0.1 = 23.5 °C
```

The formula is simply: `(byte0 << 8) | byte1`, then multiply by 0.1. If the result is ≥ 32768 (0x8000), it is a negative number — subtract 65536 to get the signed value (standard two's complement).

### Photoelectric Sensor

PDin: **1–2 bytes**

```
Raw PDin: "01"
Byte 0: 0x01
Bit 0 of byte 0: 1 → Object detected

Raw PDin: "0064"
Byte 0: 0x00 → No object
Byte 1: 0x64 = 100 → Signal quality: 100%
```

The first bit of the first byte is the switching output — the answer to "is something in front of the sensor?" Any additional bytes carry signal quality or distance information depending on the device model.

### Capacitive Sensor (RS PRO 2377240 / Carlo Gavazzi)

PDin: **4 bytes**

```
Raw PDin: "0A8C0001"
Bytes: [0x0A, 0x8C, 0x00, 0x01]

Bytes 0-1 (big-endian): (0x0A << 8) | 0x8C = 2700  → Analogue dielectric value
Byte 2:  0x00  → SSC1/SSC2 flags (both inactive)
Byte 3:  0x01  → bit 0 = 1 → Switching output 1 active → Object detected
```

The analogue value represents the strength of the dielectric effect — higher means more material detected. The switching output bit is the simple yes/no answer.

### LED Light Stack (IFM CL50 PRO SELECT)

The LED uses **PDout** (we send commands *to* it). It expects **3 bytes**:

```
Byte 0:  [AudibleState (2 bits)] [Color2 Intensity (3 bits)] [Color1 Intensity (3 bits)]
Byte 1:  [Speed (2 bits)] [Pulse Pattern (3 bits)] [Animation (3 bits)]
Byte 2:  [Color 2 (4 bits)] [Color 1 (4 bits)]
```

Example — solid green at high intensity, no sound:

```
Byte 2: Color1 = 0 (Green), Color2 = 0 (Green) → 0x00
Byte 1: Animation = 1 (Steady), Pulse = 0, Speed = 0 → 0x01
Byte 0: Color1 Intensity = 0 (High), Color2 Intensity = 3 (Off), Audible = 0 → 0x18

PDout = "180100"  (bytes 0, 1, 2 concatenated as hex)
```

Reading this back via the master's PDout data point tells you what the LED is currently commanded to display.

---

## 12. Writing to a Port — Controlling Actuators

Reading is done with GET. **Writing** to a device is done with a `setdata` service call.

### Writing PDout

To command the LED light stack (on port 4) to show red:

```
POST http://192.168.7.4/
Body:
{
  "code": "request",
  "cid": -1,
  "adr": "/iolinkmaster/port[4]/iolinkdevice/pdout/setdata",
  "data": { "newvalue": "010109" }
}
```

The `"newvalue"` is the hex-encoded byte string you want to write. The master sends it to the device as PDout in the next IO-Link cycle.

> **Safety note:** In real automation, writing to actuators requires careful interlocking — you should only send commands when you are sure it is safe to do so. Never write to a port without understanding what the actuator will do.

### Writing a parameter to a sensor

IO-Link devices also have **parameters** — settings you can read and change, such as the detection threshold of a capacitive sensor, or the measuring range of a temperature sensor. These are stored in the device's parameter memory (ISDU — Indexed Service Data Unit).

Writing a parameter looks like this:

```
POST http://192.168.7.4/
Body:
{
  "code": "request",
  "cid": -1,
  "adr": "/iolinkmaster/port[2]/iolinkdevice/parameter/index/1/subindex/0/setdata",
  "data": { "newvalue": "0A" }
}
```

- **Index** refers to the parameter number in the device's IODD file.
- **Subindex** is used for structured parameters with sub-fields.

Finding the right index requires reading the sensor's IODD or datasheet.

---

## 13. Configuring a Port

You can also change how the master itself behaves on each port — for example, switching a port from digital input mode to IO-Link mode.

```
POST http://192.168.7.4/
Body:
{
  "code": "request",
  "cid": -1,
  "adr": "/iolinkmaster/port[1]/mode/setdata",
  "data": { "newvalue": 3 }
}
```

Setting mode to `3` enables IO-Link on port 1. The master will immediately begin the IO-Link startup handshake with whatever device is plugged in.

### The IO-Link startup handshake

When the master switches a port to IO-Link mode, the following sequence happens automatically inside the master hardware:

```
Master                          Sensor
  │                               │
  │── Wakeup pulse (DC signal) ──>│
  │<── Sensor wakes up ───────────│
  │                               │
  │── COM speed negotiation ─────>│
  │<── Speed agreed ──────────────│
  │                               │
  │── Request device identity ───>│
  │<── VendorID, DeviceID ────────│
  │<── ProductName, SerialNum ────│
  │                               │
  │── Begin cyclic data exchange >│
  │<── PDin (sensor data) ────────│  } every 1-5 ms
  │── PDout (commands) ──────────>│  }
```

This entire handshake takes roughly 0.5–2 seconds. Your software will see the port mode change from `inactive` to `io-link` and the device identity fields (vendor ID, device ID, name, serial) will populate. Only then will valid PDin data start appearing.

---

## 14. Supervision Data — Monitoring the Master Itself

The AL1350 does not only give you sensor data — it also reports its own health. This is called **supervision data** and lives under the `processdatamaster` path.

| Path | What it tells you | Example value |
|---|---|---|
| `/processdatamaster/temperature` | Master CPU temperature (°C) | `42` |
| `/processdatamaster/voltage` | Supply voltage (V) | `24.1` |
| `/processdatamaster/current` | Total current drawn by all sensors (A) | `0.35` |
| `/processdatamaster/supervisionstatus` | Bitmask of fault flags | `0` = all OK |

These are polled with `getdatamulti` on every cycle:

```
POST http://192.168.7.4/
Body:
{
  "code": "request",
  "cid": -1,
  "adr": "getdatamulti",
  "data": {
    "datatosend": [
      "processdatamaster/temperature",
      "processdatamaster/voltage",
      "processdatamaster/current",
      "processdatamaster/supervisionstatus"
    ]
  }
}
```

If the voltage drops below 18 V or temperature rises above 70 °C, the `supervisionstatus` bitmask will reflect a fault. Monitoring this lets you detect power supply problems before they cause mysterious sensor failures.

---

## 15. Reliability in Real Systems

This section explains some important engineering patterns that appear in the backend code. They exist because **industrial networks are not perfect** — cables get knocked, power blips, and the master has limited resources. A naive polling loop that just sends requests and assumes they succeed will break badly in the field.

### Circuit Breaker

A **circuit breaker** is a software pattern borrowed from electrical engineering. Just like a physical circuit breaker trips when too much current flows (protecting the wiring), a software circuit breaker "trips" when too many requests fail in a row — protecting the system from being overwhelmed by constant retries to a device that is clearly not responding.

Our circuit breaker has three states:

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

- **Closed:** Everything is fine. Requests go through.
- **Open:** Too many failures. All requests are immediately rejected without even trying — this prevents the system from hammering a dead device.
- **Half-open:** After 15 seconds, the breaker tries one request. If it succeeds, the breaker closes again. If it fails, it goes back to open.

### Retry with Jitter

When a single request fails (network glitch, timeout), it is worth trying again — but not immediately. Our code waits a short, **randomly varied** delay (jitter) before retrying. The randomness is critical: if 100 systems all retry at exactly the same time, they can overwhelm a device that is just recovering. Random delays spread the load.

The delay grows exponentially: 0.2 s, then ~0.4 s, then ~0.8 s — capped at 1.5 s.

### Connection Pooling

The AL1350 hardware can only handle **3 simultaneous HTTP connections**. If you open more, it starts refusing or silently dropping them. Our code uses a semaphore — a concurrency limit — to ensure no more than 3 requests run at the same time, even if the software wants to fire 16 at once.

### Adaptive Polling

Not all ports need polling at the same rate. A port with nothing connected does not change every second — checking it every 5 seconds is sufficient. Our system tracks when each port last changed mode and adjusts its polling interval:

- **Connected ports** (IO-Link, digital): polled every **1 second**
- **Inactive/error ports**: polled every **5 seconds**

This reduces unnecessary load on the master by about 40% in a typical 4-port setup.

---

## 16. How Our HMI Puts It All Together

This project has three layers that work together to display live sensor data on screen.

```
┌─────────────────────────────────────────────┐
│              Browser (HMI Dashboard)         │
│                                              │
│  JavaScript ← WebSocket messages (JSON)      │
│  Chart.js renders gauges, trends             │
└─────────────────┬───────────────────────────┘
                  │ WebSocket  ws://localhost/ws
┌─────────────────▼───────────────────────────┐
│              Python Backend (FastAPI)         │
│                                              │
│  Background loop (1 second):                 │
│    1. Call getdatamulti → get all port data  │
│    2. Decode PDin for each sensor type       │
│    3. Append to supervision history          │
│    4. Broadcast JSON to all WS clients       │
└─────────────────┬───────────────────────────┘
                  │ HTTP REST (getdatamulti, GETs)
┌─────────────────▼───────────────────────────┐
│          IFM AL1350 IO-Link Master            │
│                                              │
│  Ports 1-4: cyclic IO-Link exchange           │
│  getdatamulti returns all port data at once  │
└─────────────────────────────────────────────┘
```

### The polling loop in plain English

Every second, the backend Python code:

1. Checks if any port is due to be polled (adaptive intervals).
2. Builds a list of data-point paths for those ports.
3. Sends ONE `getdatamulti` request to the AL1350 with all paths at once.
4. Receives all the values back in one response.
5. For each port, looks up the sensor type (temperature? photoelectric? capacitive?).
6. Decodes the raw PDin hex bytes into meaningful engineering values.
7. Updates the supervision data (voltage, current, temperature of the master).
8. Pushes the complete JSON state to every connected browser over WebSocket.

The browser receives this update and redraws the gauges and charts without the user having to refresh the page.

### Why WebSocket?

The browser cannot receive data unless it asks for it (that is how HTTP works). WebSocket is different — it keeps a persistent two-way connection open. Once connected, the server can **push** data to the browser at any time. This gives the dashboard its live, real-time feel.

---

## 17. Quick Reference: All the Key Paths

### Port data paths (replace `[N]` with port number 1–4)

| What | Path |
|---|---|
| Port mode (0–3) | `iolinkmaster/port[N]/mode` |
| Communication code | `iolinkmaster/port[N]/comcode` |
| Master cycle time | `iolinkmaster/port[N]/mastercycle` |
| Process Data In (sensor reading) | `iolinkmaster/port[N]/iolinkdevice/pdin` |
| Process Data Out (commands) | `iolinkmaster/port[N]/iolinkdevice/pdout` |
| Vendor ID | `iolinkmaster/port[N]/iolinkdevice/vendorid` |
| Device ID | `iolinkmaster/port[N]/iolinkdevice/deviceid` |
| Product name | `iolinkmaster/port[N]/iolinkdevice/productname` |
| Serial number | `iolinkmaster/port[N]/iolinkdevice/serialnumber` |
| Parameter read | `iolinkmaster/port[N]/iolinkdevice/parameter/index/<i>/subindex/<s>` |

### Supervision paths

| What | Path |
|---|---|
| Master temperature (°C) | `processdatamaster/temperature` |
| Supply voltage (V) | `processdatamaster/voltage` |
| Supply current (A) | `processdatamaster/current` |
| Fault status bitmask | `processdatamaster/supervisionstatus` |

### Device info paths

| What | Path |
|---|---|
| Application tag (name) | `devicetag/applicationtag` |
| Firmware version | `deviceinfo/software` |
| Device icon URL | `deviceinfo/deviceicon` |

### Service names (used as `"adr"` in POST requests)

| Service | What it does |
|---|---|
| `gettree` | Returns full data-point tree |
| `getdatamulti` | Read many data points in one request |
| `<path>/setdata` | Write a value to a data point |
| `iotsetup/network/setblock` | Configure network settings (IP, DHCP, gateway) |

---

## 18. Student Exercises

Work through these to test and deepen your understanding.

### Exercise 1 — First contact
Using a browser or `curl`, make a GET request to:
```
http://192.168.7.4/iolinkmaster/port[1]/mode/getdata
```
What integer value do you see? What does it mean?

### Exercise 2 — Read the temperature sensor
Port 1 is connected to a temperature sensor. Read its PDin:
```
GET http://192.168.7.4/iolinkmaster/port[1]/iolinkdevice/pdin/getdata
```
You will receive a hex string. Convert those 2 bytes to a temperature in °C using the formula from section 11.

### Exercise 3 — Batch read with getdatamulti
Write a `getdatamulti` POST request that reads both the temperature PDin AND the master supply voltage in a single request. Compare the response structure to a single GET.

### Exercise 4 — Identify all connected devices
For each of the 4 ports, read `vendorid`, `deviceid`, and `productname` using one `getdatamulti` call. Look up the vendor ID numbers online — what manufacturers are they?

### Exercise 5 — Trace the circuit breaker
Without touching the hardware, look at the backend code in [al1350_client.py](../backend/al1350_client.py) and find the `CircuitBreaker` class. Draw a state diagram on paper. Under what exact conditions does it move from closed → open? From open → half-open?

### Exercise 6 — Decode a PDout manually
The LED stack on port 4 is sending the following PDout: `"180100"`.
- Split into bytes: `[0x18, 0x01, 0x00]`
- Using the bit layout from section 11, decode:
  - What colour is Color 1?
  - What is the animation mode?
  - Is the audible buzzer on?

### Exercise 7 — Research question
Look up the IO-Link standard IEC 61131-9. What is the maximum cable length between a master port and a device? Why do you think this limit exists (hint: think about signal quality and propagation delay at 230 kbaud)?

### Exercise 8 — Design challenge
Imagine you are adding a new sensor to port 3: a pressure sensor with 2-byte PDin where bytes 0–1 form a 16-bit unsigned integer representing pressure in millibar.

- Write the pseudocode for a `decode_pressure_pdin(bytes_data)` function.
- What would you add to the device type detection logic to recognise this sensor?

---

## Glossary

| Term | Definition |
|---|---|
| **IO-Link** | IEC 61131-9 standard for smart sensor/actuator communication |
| **IO-Link Master** | The device that bridges IO-Link ports to Ethernet |
| **AL1350** | IFM's 4-port IO-Link Master used in this system |
| **PDin** | Process Data Input — data from sensor to master |
| **PDout** | Process Data Output — data from master to actuator |
| **IODD** | IO-Link Device Description — XML file describing a device's data |
| **ISDU** | Indexed Service Data Unit — IO-Link parameter access mechanism |
| **getdatamulti** | AL1350 API service to read many data points in one request |
| **gettree** | AL1350 API service returning full data-point hierarchy |
| **Circuit breaker** | Software pattern that stops retrying a clearly-failed connection |
| **Jitter** | Random delay added to retries to prevent thundering-herd problems |
| **WebSocket** | Protocol for persistent two-way browser-server communication |
| **FastAPI** | Python web framework used for the backend API and WebSocket server |
| **HMI** | Human-Machine Interface — the dashboard the operator uses |
| **PLC** | Programmable Logic Controller — the industrial computer that runs automation logic |
| **Semaphore** | Concurrency primitive that limits how many operations run simultaneously |
| **COM speed** | IO-Link communication speed: COM1 = 4.8 kbaud, COM2 = 38.4 kbaud, COM3 = 230.4 kbaud |

---

*This guide was written alongside real working code. Cross-reference with [al1350_client.py](../backend/al1350_client.py), [decoder.py](../backend/decoder.py), and [io_link_fastapi.py](../backend/io_link_fastapi.py) to see every concept implemented.*
