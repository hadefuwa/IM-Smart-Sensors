# MQTT Migration Plan

## Why

The AL1350 HTTP `getdatamulti` service reads data points **sequentially inside firmware** — every path adds latency. On a busy 4-port master, a single call takes 200–400 ms before network overhead. A sustained poll rate below ~1 s triggers a known firmware crash bug (documented by United Manufacturing Hub / IFM community). The HTTP API is fundamentally the wrong transport for low-latency event detection.

The AL1350 supports native MQTT push via its subscribe service (`timer[1]/counter/datachanged/subscribe`). The device publishes all subscribed data points directly to an MQTT broker at a configurable interval (minimum 500 ms, firmware-enforced). This eliminates HTTP polling overhead entirely — the device does the work, not our poll loop.

**Target:** replace the HTTP `getdatamulti` polling loop with MQTT push from the AL1350 at 500 ms intervals.

---

## Architecture: Before vs After

### Before (HTTP polling)
```
AL1350 ←─── HTTP POST getdatamulti ───── Pi FastAPI backend
        ───────── JSON response ─────────>
        (sequential internal reads, 200-400ms latency, crash risk)
```

### After (MQTT push)
```
AL1350 ──── MQTT publish every 500ms ──> Mosquitto (Pi) ──> FastAPI backend
                                                         ──> WebSocket clients
```

---

## Components

| Component | Detail |
|-----------|--------|
| MQTT broker | Mosquitto, running on Pi as a systemd service on port 1883 |
| AL1350 publisher | AL1350 configured via `subscribe` service to publish pdin + supervision data to `iolink/<port>/data` topics |
| Backend subscriber | `aiomqtt` async Python client in FastAPI, replaces the `poll_io_link_master` background task |
| Topic scheme | `iolink/port/1/pdin`, `iolink/port/2/pdin`, ..., `iolink/supervision` |
| Fallback | HTTP polling retained as fallback if MQTT broker is unreachable |

---

## Implementation Steps

### Step 1 — Install and configure Mosquitto on the Pi
- `sudo apt install mosquitto mosquitto-clients`
- Configure `/etc/mosquitto/mosquitto.conf`: listener on 1883, allow anonymous (LAN-only, no auth needed)
- Enable and start: `sudo systemctl enable --now mosquitto`
- Verify: `mosquitto_sub -t '#' -v` should show nothing (broker running, no publishers yet)

### Step 2 — Configure AL1350 to publish via subscribe service
The AL1350 subscribe service is called once at backend startup (or on reconnect). It registers a list of data points and a callback URL/MQTT broker address.

AL1350 MQTT callback format (from IFM docs):
```json
{
  "code": "request",
  "cid": 1,
  "adr": "/timer[1]/counter/datachanged/subscribe",
  "data": {
    "callback": "mqtt://192.168.7.2:1883",
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

Timer interval (500 ms minimum):
```json
{
  "code": "request",
  "cid": 2,
  "adr": "/timer[1]/interval/setdata",
  "data": { "newvalue": 500 }
}
```

> **Note:** The AL1350 publishes to MQTT topics derived from the data-point paths. Verify actual topic names by running `mosquitto_sub -t '#' -v` after setup.

### Step 3 — Add `aiomqtt` to backend dependencies
```
aiomqtt>=2.0
```
Add to `backend/requirements.txt`.

### Step 4 — Implement MQTT subscriber in `al1350_client.py`
- Add `ensure_mqtt_subscription(broker_ip, broker_port, interval_ms)` method
  - Calls the AL1350 subscribe service to register the data points
  - Sets `timer[1]/interval`
  - Idempotent — safe to call on reconnect
- Add `connect_mqtt_broker(broker_host, broker_port)` async context
  - Uses `aiomqtt.Client`
  - Parses incoming messages, updates `system_state` the same way the HTTP poll loop does
  - Handles reconnect with backoff

### Step 5 — Replace `poll_io_link_master` in `io_link_fastapi.py`
- Rename existing function to `poll_io_link_master_http` (keep as fallback)
- Add `run_mqtt_listener` task that:
  1. Calls `ensure_mqtt_subscription()` on the AL1350
  2. Subscribes to all `iolink/#` topics on the Mosquitto broker
  3. On each message: enriches port data (same `_enrich_port` path), updates `system_state`, broadcasts WebSocket
  4. On MQTT disconnect: falls back to `poll_io_link_master_http` until reconnected
- Update `start_background_polling` startup event to launch `run_mqtt_listener` instead

### Step 6 — Update config
Add to `backend/config.json`:
```json
"mqtt": {
  "broker_host": "127.0.0.1",
  "broker_port": 1883,
  "publish_interval_ms": 500,
  "enabled": true
}
```

### Step 7 — Update diagnostics
- Add MQTT connection state (`connected`/`disconnected`/`fallback`) to the diagnostics snapshot
- Show MQTT status in the admin page alongside the existing circuit breaker / latency graph

### Step 8 — Test and validate
- Trigger fast capacitive sensor events, verify they appear within 500–600 ms in the UI
- Confirm detection counter delta aligns with MQTT-observed state changes
- Simulate Mosquitto crash — verify HTTP fallback kicks in
- Simulate AL1350 restart — verify subscription is re-established

---

## Files Changing

| File | Change |
|------|--------|
| `backend/requirements.txt` | Add `aiomqtt>=2.0` |
| `backend/config.json` | Add `mqtt` block |
| `backend/al1350_client.py` | Add `ensure_mqtt_subscription`, `read_mqtt_message` parser |
| `backend/io_link_fastapi.py` | Replace poll loop with MQTT listener + HTTP fallback |
| `src/admin-page.js` | Show MQTT connection status in diagnostics panel |
| `scripts/pi/` | Mosquitto install + config script |

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| AL1350 MQTT callback topic format undocumented (manual only shows HTTP callback) | Test with `mosquitto_sub -t '#' -v` first; may need to adjust topic parsing |
| AL1350 firmware doesn't support `mqtt://` callback scheme (some firmware versions only support HTTP) | Verify firmware version; fallback is HTTP callback endpoint on our FastAPI |
| Mosquitto not running when AL1350 tries to publish | Backend retries `ensure_subscription` on reconnect; HTTP fallback covers the gap |
| MQTT adds a new infrastructure dependency | Mosquitto is lightweight (~2 MB RAM on Pi); HTTP polling kept as fallback |

---

## Rollback

Tag `v1.4-pre-mqtt` is the last known-good HTTP polling baseline. To revert:
```bash
git checkout v1.4-pre-mqtt
```
