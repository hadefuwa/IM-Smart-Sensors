#!/usr/bin/env python3
import urllib.request, json

def get(path):
    try:
        with urllib.request.urlopen(f"http://192.168.7.4/{path}/getdata", timeout=5) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}

port = 3
print(f"=== TV7105 on port {port} - raw PDin probe ===\n")

pdin = get(f"iolinkmaster/port[{port}]/iolinkdevice/pdin")
print("pdin raw response:", pdin)

raw_hex = pdin.get("data", {}).get("value", "")
print("pdin hex string:", repr(raw_hex))

if raw_hex:
    clean = raw_hex.replace(" ","").replace("0x","")
    bdata = [int(clean[i:i+2], 16) for i in range(0, len(clean), 2)]
    print("bytes:", [f"0x{b:02X}" for b in bdata])
    print("len:", len(bdata))

    if len(bdata) >= 2:
        # Try all common interpretations
        le16 = bdata[0] | (bdata[1] << 8)
        be16 = (bdata[0] << 8) | bdata[1]
        le16_s = le16 - 65536 if le16 >= 0x8000 else le16
        be16_s = be16 - 65536 if be16 >= 0x8000 else be16

        print(f"\nInterpretation as 16-bit signed:")
        print(f"  little-endian raw={le16:#06x} ({le16_s})  -> x0.1 = {le16_s*0.1:.1f} C  | x0.01 = {le16_s*0.01:.2f} C")
        print(f"  big-endian    raw={be16:#06x} ({be16_s})  -> x0.1 = {be16_s*0.1:.1f} C  | x0.01 = {be16_s*0.01:.2f} C")

    if len(bdata) >= 4:
        le32 = bdata[0] | (bdata[1]<<8) | (bdata[2]<<16) | (bdata[3]<<24)
        be32 = (bdata[0]<<24) | (bdata[1]<<16) | (bdata[2]<<8) | bdata[3]
        le32_s = le32 - 2**32 if le32 >= 2**31 else le32
        be32_s = be32 - 2**32 if be32 >= 2**31 else be32
        print(f"\nInterpretation as 32-bit signed:")
        print(f"  little-endian raw={le32_s} -> x0.1 = {le32_s*0.1:.1f} C")
        print(f"  big-endian    raw={be32_s} -> x0.1 = {be32_s*0.1:.1f} C")

# Also check vendor/device id to confirm it's the TV7105
print("\nvendorid:", get(f"iolinkmaster/port[{port}]/iolinkdevice/vendorid"))
print("deviceid:", get(f"iolinkmaster/port[{port}]/iolinkdevice/deviceid"))
print("productname:", get(f"iolinkmaster/port[{port}]/iolinkdevice/productname"))
print("status:", get(f"iolinkmaster/port[{port}]/iolinkdevice/status"))
