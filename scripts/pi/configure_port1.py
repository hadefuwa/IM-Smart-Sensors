#!/usr/bin/env python3
"""Configure AL1350 port 1 for IO-Link mode and report sensor status."""
import urllib.request
import json
import time

BASE = "http://192.168.7.4"

def get(path):
    try:
        url = f"{BASE}/{path}/getdata"
        with urllib.request.urlopen(url, timeout=5) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}

def setdata(path, value):
    url = f"{BASE}/"
    body = json.dumps({"code": "request", "cid": -1, "adr": f"{path}/setdata", "data": {"newvalue": value}}).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}

def service(path, data=None):
    url = f"{BASE}/"
    body = json.dumps({"code": "request", "cid": -1, "adr": path, "data": data or {}}).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}

print("=== AL1350 Port 1 Configuration ===\n")

# Step 1: Read current state
print("--- Current state ---")
print("mode:", get("iolinkmaster/port[1]/mode"))
print("validation_datastorage_mode:", get("iolinkmaster/port[1]/validation_datastorage_mode"))

# Step 2: Clear validation (no device ID check)
print("\n--- Setting validation_datastorage_mode = 0 (No check and clear) ---")
r = setdata("iolinkmaster/port[1]/validation_datastorage_mode", 0)
print("Result:", r)

# Step 3: Set port to IO-Link mode (3)
print("\n--- Setting port mode = 3 (IO-Link) ---")
r = setdata("iolinkmaster/port[1]/mode", 3)
print("Result:", r)

# Step 4: Accept the connected device via service
print("\n--- Calling validation_useconnecteddevice service ---")
r = service("iolinkmaster/port[1]/validation_useconnecteddevice")
print("Result:", r)

# Wait for IO-Link negotiation
print("\nWaiting 3 seconds for IO-Link negotiation...")
time.sleep(3)

# Step 5: Read status
print("\n--- Post-configuration status ---")
status = get("iolinkmaster/port[1]/iolinkdevice/status")
print("iolinkdevice/status:", status)

status_map = {0: "not connected", 1: "preoperate", 2: "operate", 3: "communication error"}
if "data" in status:
    code = status["data"].get("value", status["data"])
    print("  ->", status_map.get(code, f"unknown ({code})"))

print("vendorid:", get("iolinkmaster/port[1]/iolinkdevice/vendorid"))
print("deviceid:", get("iolinkmaster/port[1]/iolinkdevice/deviceid"))
print("productname:", get("iolinkmaster/port[1]/iolinkdevice/productname"))
print("pdin:", get("iolinkmaster/port[1]/iolinkdevice/pdin"))
print("iolinkevent:", get("iolinkmaster/port[1]/iolinkdevice/iolinkevent"))
print("portevent:", get("iolinkmaster/port[1]/portevent"))

# Wait more and re-check if still negotiating
status2 = get("iolinkmaster/port[1]/iolinkdevice/status")
if "data" in status2:
    code2 = status2["data"].get("value", status2["data"])
    if code2 == 1:  # preoperate - still negotiating
        print("\nStill in preoperate, waiting 5 more seconds...")
        time.sleep(5)
        print("Final status:", get("iolinkmaster/port[1]/iolinkdevice/status"))
        print("Final vendorid:", get("iolinkmaster/port[1]/iolinkdevice/vendorid"))
        print("Final deviceid:", get("iolinkmaster/port[1]/iolinkdevice/deviceid"))
        print("Final pdin:", get("iolinkmaster/port[1]/iolinkdevice/pdin"))

print("\n=== Done ===")
