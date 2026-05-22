"""
IODD-derived device parameter registry for known IO-Link sensors.

Sources:
  IFM TV7105  — ifm-TV7105-20170308-IODD1.1.xml (HTW Dresden / IFM)
  RS PRO 2377240 / Carlo Gavazzi CA18FAF08BPxxIO — CGI-CA18FAF08BPxxIO_1-20200302-IODD1.1.xml
  RS PRO 0360240 photoelectric (Contrinex OEM) — standard Smart Sensor Profile only (IODD not public)
  IFM CL50PKQ LED stack — PDout write only; no IODD retrieved
"""

T_UINT8  = 'uint8'
T_INT16  = 'int16'
T_UINT16 = 'uint16'
T_INT32  = 'int32'
T_UINT32 = 'uint32'
T_STRING = 'string'
T_BOOL   = 'bool'

G_IDENTITY    = 'identity'
G_CONFIG      = 'config'
G_DIAGNOSTICS = 'diagnostics'


def _p(index, subindex, name, dtype, access='ro', group=G_IDENTITY, **kw):
    d = {'index': index, 'subindex': subindex, 'name': name, 'dtype': dtype,
         'access': access, 'group': group}
    d.update(kw)
    return d


_TV7105_PARAMS = {
    'label': 'IFM TV7105 Temperature Sensor',
    'pdo_write': False,
    'commands': {
        'teach_sp1':    {'value': 172, 'label': 'Teach SP1 — sets SP1 to current temperature'},
        'teach_sp2':    {'value': 240, 'label': 'Teach SP2 — sets SP2 to current temperature'},
        'factory_reset': {'value': 130, 'label': 'Factory reset (restores all defaults)'},
    },
    'parameters': [
        # ── Identity ──────────────────────────────────────────────────────────
        _p(18, 0, 'Product Name',      T_STRING, group=G_IDENTITY),
        _p(21, 0, 'Serial Number',     T_STRING, group=G_IDENTITY),
        _p(22, 0, 'Hardware Rev',      T_STRING, group=G_IDENTITY),
        _p(23, 0, 'Firmware Rev',      T_STRING, group=G_IDENTITY),
        _p(24, 0, 'Application Tag',   T_STRING, access='rw', group=G_IDENTITY,
           desc='User-editable label stored in the sensor', max_len=32),
        # ── Status ────────────────────────────────────────────────────────────
        _p(36, 0, 'Device Status', T_UINT8, group=G_DIAGNOSTICS,
           enum={0: 'OK', 1: 'Maintenance required', 2: 'Out-of-specification',
                 3: 'Functional check', 4: 'Failure'}),
        _p(560, 0, 'Max Temp (memory)', T_INT16, group=G_DIAGNOSTICS, scale=0.1, unit='°C'),
        _p(561, 0, 'Min Temp (memory)', T_INT16, group=G_DIAGNOSTICS, scale=0.1, unit='°C'),
        # ── Configuration — OUT1 ──────────────────────────────────────────────
        _p(551, 0, 'Temperature Unit', T_UINT8, access='rw', group=G_CONFIG,
           enum={0: '°C', 1: '°F'}),
        _p(580, 0, 'OUT1 Function', T_UINT8, access='rw', group=G_CONFIG,
           enum={3: 'Hno — hysteresis, NO', 4: 'Hnc — hysteresis, NC',
                 5: 'Fno — window, NO',    6: 'Fnc — window, NC'},
           desc='Output 1 switching logic'),
        _p(583, 0, 'SP1 — Switch Point 1', T_INT16, access='rw', group=G_CONFIG,
           scale=0.1, unit='°C', min=-49.8, max=150.0, default=60.0,
           desc='Alarm trigger point for OUT1'),
        _p(584, 0, 'RP1 — Reset Point 1', T_INT16, access='rw', group=G_CONFIG,
           scale=0.1, unit='°C', min=-50.0, max=149.8, default=50.0,
           desc='Hysteresis reset point for OUT1'),
        _p(581, 0, 'Switch-On Delay 1',  T_UINT16, access='rw', group=G_CONFIG,
           unit='ms', min=0, max=500, default=0),
        _p(582, 0, 'Switch-Off Delay 1', T_UINT16, access='rw', group=G_CONFIG,
           unit='ms', min=0, max=500, default=0),
        # ── Configuration — OUT2 ──────────────────────────────────────────────
        _p(590, 0, 'OUT2 Function', T_UINT8, access='rw', group=G_CONFIG,
           enum={3: 'Hno — hysteresis, NO', 4: 'Hnc — hysteresis, NC',
                 5: 'Fno — window, NO',    6: 'Fnc — window, NC'}),
        _p(593, 0, 'SP2 — Switch Point 2', T_INT16, access='rw', group=G_CONFIG,
           scale=0.1, unit='°C', min=-49.8, max=150.0, default=120.0),
        _p(594, 0, 'RP2 — Reset Point 2', T_INT16, access='rw', group=G_CONFIG,
           scale=0.1, unit='°C', min=-50.0, max=149.8, default=100.0),
        _p(591, 0, 'Switch-On Delay 2',  T_UINT16, access='rw', group=G_CONFIG,
           unit='ms', min=0, max=500, default=0),
        _p(592, 0, 'Switch-Off Delay 2', T_UINT16, access='rw', group=G_CONFIG,
           unit='ms', min=0, max=500, default=0),
        # ── Calibration ───────────────────────────────────────────────────────
        _p(681, 0, 'Calibration Offset', T_INT16, access='rw', group=G_CONFIG,
           scale=0.1, unit='°C', min=-10.0, max=10.0, default=0.0,
           desc='Fine-trim for installation offset'),
    ]
}

_CAPACITIVE_PARAMS = {
    'label': 'RS PRO / Carlo Gavazzi Capacitive Sensor (M18)',
    'pdo_write': False,
    'commands': {
        'teach_sp1_start': {'value': 71,  'label': 'Start SP1 teach (place target at trigger point)'},
        'teach_sp1_stop':  {'value': 72,  'label': 'Stop SP1 teach (target in position)'},
        'teach_cancel':    {'value': 79,  'label': 'Cancel teach'},
        'factory_reset':   {'value': 130, 'label': 'Factory reset'},
    },
    'parameters': [
        # ── Identity ──────────────────────────────────────────────────────────
        _p(18, 0, 'Product Name',  T_STRING, group=G_IDENTITY),
        _p(21, 0, 'Serial Number', T_STRING, group=G_IDENTITY),
        _p(24, 0, 'Application Tag', T_STRING, access='rw', group=G_IDENTITY,
           desc='User-editable name', max_len=32),
        # ── Diagnostics ───────────────────────────────────────────────────────
        _p(36, 0, 'Device Status', T_UINT8, group=G_DIAGNOSTICS,
           enum={0: 'OK', 1: 'Maintenance required', 2: 'Out-of-specification',
                 3: 'Functional check', 4: 'Failure'}),
        _p(75, 0, 'Quality of Teach (QoT)', T_UINT8, group=G_DIAGNOSTICS,
           min=0, max=255,
           desc='0=no teach; 1–80=poor; 81–200=good; 201–255=excellent'),
        _p(76, 0, 'Quality of Run (QoR)', T_UINT8, group=G_DIAGNOSTICS,
           min=0, max=255,
           desc='Signal margin above threshold. >100 = reliable detection.'),
        _p(201, 0, 'Operating Hours',    T_INT32, group=G_DIAGNOSTICS, unit='h'),
        _p(210, 0, 'Detection Counter',  T_INT32, group=G_DIAGNOSTICS,
           desc='Cumulative SSC1 activations'),
        # ── Configuration — SSC1 (primary channel) ────────────────────────────
        _p(60, 1, 'SSC1 SP1 — Sensitivity Threshold', T_INT16, access='rw', group=G_CONFIG,
           min=10, max=10000, default=1000,
           desc='Primary detection threshold. Lower value = more sensitive.'),
        _p(60, 2, 'SSC1 SP2 — Upper Window Limit', T_INT16, access='rw', group=G_CONFIG,
           min=10, max=10000, default=10000,
           desc='Upper bound for window mode; ignored in single-point mode.'),
        _p(61, 1, 'SSC1 Logic', T_UINT8, access='rw', group=G_CONFIG,
           enum={0: 'High active (object → output ON)',
                 1: 'Low active (object → output OFF)'}),
        _p(61, 2, 'SSC1 Mode', T_UINT8, access='rw', group=G_CONFIG,
           enum={0: 'Disabled', 1: 'Single Point', 2: 'Window Mode', 3: 'Two Point Mode'}),
        _p(61, 3, 'SSC1 Hysteresis', T_UINT16, access='rw', group=G_CONFIG,
           unit='%', min=1, max=100, default=6,
           desc='Dead-band around SP1. Higher % = less chattering on borderline targets.'),
        # ── Configuration — general ───────────────────────────────────────────
        _p(77, 0, 'Filter Scaler', T_UINT8, access='rw', group=G_CONFIG,
           min=1, max=255, default=1,
           desc='1 = fastest response; 255 = maximum noise damping'),
        _p(71, 0, 'Application Preset', T_UINT8, access='rw', group=G_CONFIG,
           enum={0: 'Full Scale', 1: 'Liquid Level', 2: 'Plastic Pellets'}),
    ]
}

_PHOTOELECTRIC_PARAMS = {
    'label': 'Contrinex LTR-M18PA-PMS-603 Diffuse Photoelectric (IO-Link 1.0 — identity only)',
    'isdu_limited': True,  # only pages 0 and 1 respond; no configurable params accessible over IO-Link
    'pdo_write': False,
    'commands': {
        'teach_sp1':       {'value': 0x41, 'label': 'Single Value Teach SP1 — teach detection threshold to current target distance'},
        'teach_sp2':       {'value': 0x42, 'label': 'Single Value Teach SP2 — teach second threshold'},
        'teach_dyn_start': {'value': 0x47, 'label': 'Dynamic Teach SP1 Start — begin dynamic range capture'},
        'teach_dyn_stop':  {'value': 0x48, 'label': 'Dynamic Teach SP1 Stop — end dynamic range capture'},
        'teach_cancel':    {'value': 0x4F, 'label': 'Cancel / abort teach sequence'},
        'factory_reset':   {'value': 0x80, 'label': 'Device Reset — restores all factory defaults'},
    },
    'parameters': [
        # ── Identity ──────────────────────────────────────────────────────────
        _p(0x12, 0, 'Product Name',      T_STRING, group=G_IDENTITY),
        _p(0x15, 0, 'Serial Number',     T_STRING, group=G_IDENTITY),
        _p(0x16, 0, 'Hardware Rev',      T_STRING, group=G_IDENTITY),
        _p(0x17, 0, 'Firmware Rev',      T_STRING, group=G_IDENTITY),
        _p(0x18, 0, 'Application Tag',   T_STRING, access='rw', group=G_IDENTITY,
           desc='User-editable label stored in the sensor', max_len=32),
        # ── Diagnostics ───────────────────────────────────────────────────────
        _p(0x24, 0, 'Device Status', T_UINT8, group=G_DIAGNOSTICS,
           enum={0: 'OK', 1: 'Maintenance required', 2: 'Out-of-specification',
                 3: 'Functional check', 4: 'Failure'}),
        _p(0x46, 1, 'Current Temperature',     T_UINT16, group=G_DIAGNOSTICS, scale=0.1, unit='°C',
           desc='Internal sensor temperature (divide by 10)'),
        _p(0x46, 2, 'Max Lifetime Temp',        T_UINT16, group=G_DIAGNOSTICS, scale=0.1, unit='°C'),
        _p(0x46, 5, 'Operating Hours',           T_UINT32, group=G_DIAGNOSTICS, unit='h'),
        _p(0x46, 8, 'Event Flags',               T_UINT8,  group=G_DIAGNOSTICS,
           desc='Bit0=short-circuit, Bit1=EMC, Bit2=receiver disturbance, Bit3=LED limit, Bit4=undervoltage'),
        # ── SSC1 — primary switching channel ──────────────────────────────────
        _p(0x3C, 1, 'SSC1 SP1 — Setpoint 1', T_UINT32, access='rw', group=G_CONFIG,
           min=2234, max=14894, default=14894,
           desc='Detection threshold. Lower = triggers closer. Range maps ~15%–100% of max sensing distance.'),
        _p(0x3C, 2, 'SSC1 SP2 — Setpoint 2', T_UINT32, access='rw', group=G_CONFIG,
           min=2234, max=14894, default=2234,
           desc='Second threshold (window lower bound or two-point TP2). Ignored in single-point mode.'),
        _p(0x3D, 1, 'SSC1 Logic', T_UINT8, access='rw', group=G_CONFIG,
           enum={0: 'High active (Light-ON)', 1: 'Low active (Dark-ON)'}),
        _p(0x3D, 2, 'SSC1 Mode', T_UINT8, access='rw', group=G_CONFIG,
           enum={0: 'Deactivated', 1: 'Single Point', 2: 'Window Mode', 3: 'Two Points'}),
        _p(0x3D, 3, 'SSC1 Hysteresis Width', T_UINT32, access='rw', group=G_CONFIG,
           min=0, max=16383, desc='Dead-band around SP1 to prevent output chatter'),
        # ── SSC2 — secondary switching channel ────────────────────────────────
        _p(0x3E, 1, 'SSC2 SP1 — Setpoint 1', T_UINT32, access='rw', group=G_CONFIG,
           min=2234, max=14894, default=11936),
        _p(0x3E, 2, 'SSC2 SP2 — Setpoint 2', T_UINT32, access='rw', group=G_CONFIG,
           min=2234, max=14894, default=2234),
        _p(0x3F, 1, 'SSC2 Logic', T_UINT8, access='rw', group=G_CONFIG,
           enum={0: 'High active (Light-ON)', 1: 'Low active (Dark-ON)'}),
        _p(0x3F, 2, 'SSC2 Mode', T_UINT8, access='rw', group=G_CONFIG,
           enum={0: 'Deactivated', 1: 'Single Point', 2: 'Window Mode', 3: 'Two Points'}),
        # ── Sensor general config ─────────────────────────────────────────────
        _p(0x40, 2, 'Sensor Mode', T_UINT8, access='rw', group=G_CONFIG,
           enum={0: 'Fast', 2: 'Medium (Normal)', 0x24: 'Fine'},
           desc='Response speed vs. noise immunity trade-off'),
        # ── Output timing ─────────────────────────────────────────────────────
        _p(0x43, 1, 'Timer Mode', T_UINT8, access='rw', group=G_CONFIG,
           enum={0: 'No Timer', 1: 'Stretch ON', 2: 'Delay ON', 3: 'Delay + Stretch ON', 4: 'One Shot'}),
        _p(0x43, 2, 'Timer Value', T_UINT16, access='rw', group=G_CONFIG, unit='ms', min=0, max=65535),
    ]
}

# ── Registry keyed by (vendor_id_int, device_id_int) ─────────────────────────
DEVICE_REGISTRY = {
    (310,  733):       _TV7105_PARAMS,
    (1586, 1052673):   _CAPACITIVE_PARAMS,
    (896,  1069056):   _CAPACITIVE_PARAMS,   # Carlo Gavazzi official IDs
    (342,  131842):    _PHOTOELECTRIC_PARAMS,
}


def get_device_params(vendor_id, device_id) -> dict | None:
    """Return the parameter registry entry for a device, or None if unknown."""
    try:
        v = int(str(vendor_id or '').strip(), 0)
        d = int(str(device_id or '').strip(), 0)
        return DEVICE_REGISTRY.get((v, d))
    except (ValueError, TypeError):
        return None


# ── ISDU encode / decode helpers ─────────────────────────────────────────────

def decode_isdu_hex(hex_val: str, dtype: str, scale: float = 1.0):
    """Convert a hex string from iolreadacyclic to a Python value."""
    if not hex_val:
        return None
    try:
        raw = bytes.fromhex(hex_val)
    except ValueError:
        return None
    if dtype == T_UINT8:
        v = raw[0] if raw else 0
        return round(v * scale, 3) if scale != 1.0 else int(v)
    if dtype == T_INT16:
        v = int.from_bytes(raw[:2], 'big', signed=True)
        return round(v * scale, 2) if scale != 1.0 else int(v)
    if dtype == T_UINT16:
        v = int.from_bytes(raw[:2], 'big', signed=False)
        return round(v * scale, 2) if scale != 1.0 else int(v)
    if dtype == T_INT32:
        v = int.from_bytes(raw[:4], 'big', signed=True)
        return round(v * scale, 2) if scale != 1.0 else int(v)
    if dtype == T_UINT32:
        v = int.from_bytes(raw[:4], 'big', signed=False)
        return round(v * scale, 2) if scale != 1.0 else int(v)
    if dtype == T_STRING:
        return raw.rstrip(b'\x00').decode('ascii', errors='replace')
    if dtype == T_BOOL:
        return bool(raw[0] & 0x01) if raw else False
    return hex_val


def encode_isdu_value(value, dtype: str, scale: float = 1.0) -> str:
    """Convert a Python value to a hex string for iolwriteacyclic."""
    if dtype == T_UINT8:
        v = int(round(float(value) / scale)) if scale != 1.0 else int(value)
        return f'{max(0, min(255, v)):02X}'
    if dtype == T_INT16:
        v = int(round(float(value) / scale)) if scale != 1.0 else int(value)
        return v.to_bytes(2, byteorder='big', signed=True).hex().upper()
    if dtype == T_UINT16:
        v = int(round(float(value) / scale)) if scale != 1.0 else int(value)
        return v.to_bytes(2, byteorder='big', signed=False).hex().upper()
    if dtype == T_INT32:
        v = int(round(float(value) / scale)) if scale != 1.0 else int(value)
        return v.to_bytes(4, byteorder='big', signed=True).hex().upper()
    if dtype == T_UINT32:
        v = int(round(float(value) / scale)) if scale != 1.0 else int(value)
        return v.to_bytes(4, byteorder='big', signed=False).hex().upper()
    if dtype == T_STRING:
        return str(value).encode('ascii', errors='replace').hex().upper()
    return f'{int(value):02X}'
