# IO-Link Port Configuration

## Problem

An IFM TV7105 temperature sensor connected to port 3 of the AL1350 showed no IOL LED activity and no data in the app. The port and cable were confirmed working with another IO-Link sensor (a photoelectric sensor).

## Root Cause

Port 3 was in **Digital Input (DI)** mode (`value: 1`). The TV7105 only communicates via IO-Link — it has no digital output fallback. The photoelectric sensor appeared to work because it was toggling a digital signal on pin 4 (C/Q), which DI mode reads fine. But DI mode never initiates IO-Link communication, so the TV7105 was silent.

## Fix

Set the port mode to **IO-Link** (`value: 3`) using the AL1350's ifm IoT Core API.

### Verify current port mode

```bash
curl -sg 'http://192.168.7.4/iolinkmaster/port[3]/mode/getdata'
# {"cid":-1,"data":{"value":1},"code":200}  ← 1 = DI, should be 3 = IO-Link
```

### Set port to IO-Link mode

```bash
curl -sg -X POST 'http://192.168.7.4/' \
  -H 'Content-Type: application/json' \
  -d '{"code":"request","cid":1,"adr":"/iolinkmaster/port[3]/mode/setdata","data":{"newvalue":3}}'
# {"cid":1,"code":200}  ← success
```

### Confirm device detected

```bash
curl -sg 'http://192.168.7.4/iolinkmaster/port[3]/iolinkdevice/productname/getdata'
# {"cid":-1,"data":{"value":"TV7105"},"code":200}
```

## Port Mode Values

| Value | Mode | Description |
|-------|------|-------------|
| 0 | inactive | Port disabled |
| 1 | digital_in | Digital input on pin 4 (C/Q) |
| 2 | digital_out | Digital output on pin 4 (C/Q) |
| 3 | io-link | IO-Link communication on pin 4 (C/Q) |

## Notes

- Run these curl commands from the Raspberry Pi (SSH in first), since `192.168.7.4` is on the IO-Link subnet not accessible from the home LAN.
- The AL1350's ifm IoT Core API uses `"newvalue"` (not `"newval"`) as the key for setdata requests.
- After changing the mode, allow 2–3 seconds for the sensor to reach OPERATE state (solid green IOL LED).
- This setting persists across power cycles — you only need to set it once per port.
