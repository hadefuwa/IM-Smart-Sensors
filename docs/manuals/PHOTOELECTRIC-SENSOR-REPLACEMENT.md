# Photoelectric Sensor Replacement — ISDU Limitation

## Current Sensor

| Property | Value |
|----------|-------|
| Model | Contrinex LTR-M18PA-PMS-603 |
| RS Stock No. | 284-9794 |
| Mfr. Part No. | 1202540116 |
| IO-Link Version | 1.0 |
| Form Factor | M18 cylindrical, diffuse |
| Detection Range | 3–1200 mm |

## Problem

This sensor's IO-Link 1.0 firmware **only exposes the mandatory identification pages** (indices 0 and 1) over ISDU. All other parameter indices return error `8011` (ISDU not supported).

This was confirmed by a live scan of all 256 ISDU indices directly against the AL1350:

```
Index 0: SUCCESS — identification block (vendor ID 0x0156, device ID 0x020302)
Index 1: SUCCESS — cycle time / PDin length
Indices 2–255: ALL return {"error":"8011","code":531}
```

**What this means:**
- Sensitivity threshold (SSC1 SP1) — cannot be read or written over IO-Link
- Output logic (Light-ON / Dark-ON) — cannot be changed over IO-Link
- Sensor mode (Fast / Medium / Fine) — cannot be changed over IO-Link
- Teach sequences — cannot be triggered over IO-Link
- Factory reset — cannot be triggered over IO-Link

**The only adjustment available is physical** — the two potentiometers on the back of the sensor body.

## Required Capability

The replacement sensor must:

- IO-Link version **1.1** (or 1.0 with full parameter server — M-Sequence Type ≥ 1)
- Implement the **AdSS (Advanced Switching Sensor) Smart Sensor Profile**
- Expose **SSC1 setpoints** at ISDU index `0x3C` (subindex 1/2)
- Expose **SSC1 configuration** (logic, mode, hysteresis) at index `0x3D`
- Support **system commands** (teach, factory reset) written to index `0x02`
- Same physical form factor: **M18 cylindrical, diffuse, PNP, M12 4-pin**

## Recommended Replacements (Contrinex, same vendor)

These are from the same Contrinex family, same M18 form factor, and are confirmed to implement the full AdSS ISDU profile:

### Option 1 — Contrinex ISHR-M18PA-PMS-603 (Background Suppression)

| Property | Value |
|----------|-------|
| Detection Range | 20–300 mm (background suppression) |
| IO-Link | 1.1, COM2 |
| Profile | AdSS + DMSS (full parameter access) |
| Output | PNP, M12 4-pin |
| Suitable for | Precise distance-based detection, rejects background |

### Option 2 — Contrinex IDDR-M18PA-PMS-603 (Diffuse, same family as current)

| Property | Value |
|----------|-------|
| Detection Range | 20–300 mm |
| IO-Link | 1.1, COM2 |
| Profile | AdSS (full parameter access) |
| Output | PNP, M12 4-pin |
| Suitable for | Direct replacement for current sensor with full IO-Link configurability |

### What you get with the replacement

Once swapped, the HMI dashboard and IO-Link page will unlock:

- **SSC1 SP1 slider** — set detection threshold from the browser
- **Output Logic toggle** — switch Light-ON / Dark-ON without touching the sensor
- **Sensor Mode selector** — Fast / Medium / Fine response speed
- **Teach SP1 button** — teach threshold to current target in one tap
- **Factory Reset** — restore defaults remotely

The backend `device_parameters.py` already has the full Contrinex AdSS parameter registry ready to go — it will auto-detect the new sensor by vendor/device ID and activate all controls immediately on first connection.

## Wiring

No wiring changes needed. Same M12 4-pin A-coded connector, same pin assignments:

| Pin | Signal |
|-----|--------|
| 1 | +24 V supply |
| 3 | GND |
| 4 | IO-Link C/Q |
| 2 | Secondary output / teach input (if used) |

## Backend Registry Entry to Add

Once you have the new sensor's vendor ID and device ID (visible in the HMI passport strip on first connection), add an entry to `backend/device_parameters.py`:

```python
DEVICE_REGISTRY = {
    ...
    (342, <new_device_id>): _PHOTOELECTRIC_PARAMS,   # Contrinex ISHR/IDDR replacement
}
```

The `_PHOTOELECTRIC_PARAMS` entry already contains the full AdSS parameter table and just needs the correct device ID mapping.
