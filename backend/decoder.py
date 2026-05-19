"""
CL50 LED Decoder Module
Decodes Process Data Out (PDout) bytes from CL50 PRO SELECT LED devices.
Also: device-type detection, photo electric / temperature / proximity PDin decoders,
and IO-Link event code lookup.
"""

# Device type constants
DEVICE_TYPE_STATUS_LED = 'status_led'
DEVICE_TYPE_PHOTO_ELECTRIC = 'photo_electric'
DEVICE_TYPE_TEMPERATURE = 'temperature'
DEVICE_TYPE_PROXIMITY = 'proximity'
DEVICE_TYPE_CAPACITIVE = 'capacitive'
DEVICE_TYPE_UNKNOWN = 'unknown'

# Fallback: (vendor_id, device_id, type) — used when product name is generic/numeric.
# vendor_id and device_id are compared as strings (after stripping 0x, uppercasing).
DEVICE_ID_FALLBACK = [
    # Carlo Gavazzi / RS PRO capacitive sensor M18, model 2377240
    # (vendorID 1586 / 0x0632, deviceID 1052673 / 0x101001, productname '2377240')
    (1586, 1052673, DEVICE_TYPE_CAPACITIVE),
    # Contrinex LTR-M18PA-PMx-603 photoelectric sensor M18 diffuse (port 1; sold as RS PRO 0360240)
    # vendorID 342 / 0x156, deviceID 131842 / 0x20302, productname returns "unknown" from AL1350
    (342, 131842, DEVICE_TYPE_PHOTO_ELECTRIC),
    # IFM TV7105 temperature sensor (port 3)
    # vendorID 310 / 0x136, deviceID 733 / 0x2DD, productname "TV7105"
    (310, 733, DEVICE_TYPE_TEMPERATURE),
]

# Common IO-Link event codes (hex) -> human-readable label (for maintenance training)
IO_LINK_EVENT_CODES = {
    0x01: 'Wire break',
    0x02: 'Short circuit',
    0x03: 'Overload',
    0x04: 'Overheating',
    0x05: 'Data storage error',
    0x06: 'Configuration error',
    0x07: 'Maintenance required',
    0x08: 'Lens dirty',
    0x09: 'Sensor fault',
    0x0A: 'Communication error',
}


def get_device_type(vendor_id, device_id, name):
    """
    Determine device type from product name (preferred) or fallback (vendor_id, device_id).
    Name-based rules make the trainer future-proof when swapping sensor models.
    """
    name_upper = (name or '').upper()
    name_lower = (name or '').lower()

    # Name substring rules (check name first)
    if any(x in name_upper for x in ('O5D', 'O5E', 'O2D', 'O3D')) or 'PHOTO' in name_upper or 'DISTANCE' in name_upper:
        return DEVICE_TYPE_PHOTO_ELECTRIC
    if any(x in name_upper for x in ('TV7', 'TN', 'TR')) or 'TEMP' in name_upper or 'TEMPERATURE' in name_lower:
        return DEVICE_TYPE_TEMPERATURE
    if any(x in name_upper for x in ('LED', 'CL50', 'LIGHT', 'STACK', 'TOWER')):
        return DEVICE_TYPE_STATUS_LED
    if any(x in name_lower for x in ('capacitive', 'ki', 'kq', 'kc')) or '23772' in name_upper:
        return DEVICE_TYPE_CAPACITIVE
    if any(x in name_lower for x in ('proximity', 'inductive', 'prox')):
        return DEVICE_TYPE_PROXIMITY

    # Fallback table — compare as integers if possible, else as strings
    try:
        v_int = int(str(vendor_id or '').strip(), 0)
        d_int = int(str(device_id or '').strip(), 0)
        for vid, did, dtype in DEVICE_ID_FALLBACK:
            if int(str(vid), 0) == v_int and int(str(did), 0) == d_int:
                return dtype
    except (ValueError, TypeError):
        pass

    return DEVICE_TYPE_UNKNOWN


def decode_photo_electric_pdin(bytes_data):
    """
    Decode Process Data In for photoelectric sensors (RS PRO M18 diffuse, vendor 342).
    Byte 0: bit 0 = OUT1 (object detected), bit 1 = OUT2 (complementary output), bit 7 = error/fault.
    Byte 1 (optional): signal quality 0-100%.
    """
    decoded = {
        'object_detected': False,
        'out2': False,
        'error': False,
        'signal_quality_percent': None,
        'raw_hex': '',
        'description': 'No data'
    }
    if not bytes_data or len(bytes_data) < 1:
        return decoded
    if isinstance(bytes_data, bytearray):
        bytes_data = list(bytes_data)
    decoded['raw_hex'] = ''.join(f'{b:02X}' for b in bytes_data)
    decoded['object_detected'] = bool(bytes_data[0] & 0x01)
    decoded['out2']            = bool(bytes_data[0] & 0x02)
    decoded['error']           = bool(bytes_data[0] & 0x80)
    decoded['description'] = 'Object present' if decoded['object_detected'] else 'Object absent'
    if decoded['error']:
        decoded['description'] += ' [FAULT]'
    if len(bytes_data) >= 2:
        decoded['signal_quality_percent'] = min(100, max(0, bytes_data[1]))
        decoded['description'] += f', Signal {decoded["signal_quality_percent"]}%'
    return decoded


def decode_temperature_pdin(bytes_data):
    """
    Decode Process Data In for IFM TV7xxx temperature sensors.
    Bytes 0-1: 16-bit big-endian signed, 0.1 °C resolution.
    Byte 2:    manufacturer-specific / reserved (0xFF = unused on TV7105).
    Byte 3:    status — bit 0 = OUT1 (switching output 1), bit 1 = OUT2 (switching output 2).
    """
    decoded = {
        'temperature_c': None,
        'out1': None,
        'out2': None,
        'raw_hex': '',
        'description': 'No data'
    }
    if not bytes_data or len(bytes_data) < 2:
        return decoded
    if isinstance(bytes_data, bytearray):
        bytes_data = list(bytes_data)
    decoded['raw_hex'] = ''.join(f'{b:02X}' for b in bytes_data)
    raw = (bytes_data[0] << 8) | bytes_data[1]
    if raw >= 0x8000:
        raw = raw - 0x10000
    decoded['temperature_c'] = round(raw * 0.1, 1)
    decoded['description'] = f"{decoded['temperature_c']} °C"
    if len(bytes_data) >= 4:
        status = bytes_data[3]
        decoded['out1'] = bool(status & 0x01)
        decoded['out2'] = bool(status & 0x02)
    return decoded


def decode_proximity_pdin(bytes_data):
    """
    Decode Process Data In for proximity sensors.
    Often 1 byte (present/absent) or 2 bytes (distance in mm).
    """
    decoded = {
        'object_present': False,
        'distance_mm': None,
        'raw_hex': '',
        'description': 'No data'
    }
    if not bytes_data or len(bytes_data) < 1:
        return decoded
    if isinstance(bytes_data, bytearray):
        bytes_data = list(bytes_data)
    decoded['raw_hex'] = ''.join(f'{b:02X}' for b in bytes_data)
    decoded['object_present'] = bool(bytes_data[0] & 0x01)
    decoded['description'] = 'Object present' if decoded['object_present'] else 'Object absent'
    if len(bytes_data) >= 2:
        decoded['distance_mm'] = bytes_data[0] | (bytes_data[1] << 8)
        decoded['description'] += f', {decoded["distance_mm"]} mm'
    return decoded


def decode_capacitive_pdin(bytes_data):
    """
    Decode Process Data In for Carlo Gavazzi / RS PRO capacitive sensors (23772xx series).
    4-byte process data layout:
      Bytes 0-1: 16-bit analogue dielectric value (big-endian). Requires sensor teach-in to be non-zero.
      Byte 2:    bit 0 = SSC1, bit 1 = SSC2 (secondary switching channels, normally inactive).
      Byte 3:    bit 0 = SO1,  bit 1 = SO2  (primary switching outputs — SO1=main, SO2=window comparator).
    Note: SO2 (bit 1 of byte 3) can be active independently of SO1 when target is in the window range.
    """
    decoded = {
        'object_detected': False,
        'so1': False,
        'so2': False,
        'ssc1': False,
        'ssc2': False,
        'analogue_value': None,
        'raw_hex': '',
        'description': 'No data'
    }
    if not bytes_data or len(bytes_data) < 1:
        return decoded
    if isinstance(bytes_data, bytearray):
        bytes_data = list(bytes_data)
    decoded['raw_hex'] = ''.join(f'{b:02X}' for b in bytes_data)

    if len(bytes_data) >= 4:
        analogue = (bytes_data[0] << 8) | bytes_data[1]
        decoded['analogue_value'] = analogue
        decoded['ssc1'] = bool(bytes_data[2] & 0x01)
        decoded['ssc2'] = bool(bytes_data[2] & 0x02)
        decoded['so1']  = bool(bytes_data[3] & 0x01)
        decoded['so2']  = bool(bytes_data[3] & 0x02)
        decoded['object_detected'] = decoded['so1']
        outputs = []
        if decoded['so1']:  outputs.append('SO1')
        if decoded['so2']:  outputs.append('SO2')
        if decoded['ssc1']: outputs.append('SSC1')
        if decoded['ssc2']: outputs.append('SSC2')
        state = f"Active: {', '.join(outputs)}" if outputs else 'No object'
        decoded['description'] = f'{state} | Analogue: {analogue}'
    else:
        last = bytes_data[-1]
        decoded['so1'] = bool(last & 0x01)
        decoded['so2'] = bool(last & 0x02)
        decoded['object_detected'] = decoded['so1']
        decoded['description'] = 'Object detected' if decoded['object_detected'] else 'No object'
    return decoded


def decode_io_link_events(status_byte_or_bytes):
    """
    Decode IO-Link event/status bytes into a list of { code, label } for maintenance.
    status_byte_or_bytes: single int (e.g. 0x02) or list of bytes to check.
    """
    events = []
    if status_byte_or_bytes is None:
        return events
    if isinstance(status_byte_or_bytes, (list, bytearray)):
        for b in status_byte_or_bytes:
            if b in IO_LINK_EVENT_CODES:
                events.append({
                    'code': f'0x{b:02X}',
                    'label': IO_LINK_EVENT_CODES[b]
                })
    else:
        b = int(status_byte_or_bytes)
        if b in IO_LINK_EVENT_CODES:
            events.append({'code': f'0x{b:02X}', 'label': IO_LINK_EVENT_CODES[b]})
    return events


def decode_cl50_led(bytes_data):
    """
    Decode CL50 PRO SELECT LED status from process data bytes (3 bytes)
    Based on IFM CL50 PRO SELECT IO-Link documentation
    
    Byte 0 (Octet 0): Audible State (2 bits) | Color 2 Intensity (3 bits) | Color 1 Intensity (3 bits)
    Byte 1 (Octet 1): Speed (2 bits) | Pulse Pattern (3 bits) | Animation (3 bits)
    Byte 2 (Octet 2): Color 2 (4 bits) | Color 1 (4 bits)
    
    Args:
        bytes_data: List of integers (bytes) or bytearray, must be at least 3 bytes
        
    Returns:
        Dictionary with decoded LED status information
    """
    # Initialize default decoded result
    decoded = {
        'color1': 'off',
        'color2': 'off',
        'color1_intensity': 'off',
        'color2_intensity': 'off',
        'animation': 'off',
        'pulse_pattern': 'normal',
        'speed': 'medium',
        'audible_state': 'off',
        'led_on': False,
        'raw_bytes': bytes_data if bytes_data else [],
        'raw_hex': ''
    }
    
    # Check if we have enough bytes
    if not bytes_data or len(bytes_data) < 3:
        return decoded
    
    # Convert to list if it's a bytearray
    if isinstance(bytes_data, bytearray):
        bytes_data = list(bytes_data)
    
    # Create hex string representation
    decoded['raw_hex'] = ''.join(f'{b:02X}' for b in bytes_data)
    
    # Byte 2 (Octet 2) - Colors
    byte2 = bytes_data[2]
    color1_code = byte2 & 0x0F  # Lower 4 bits
    color2_code = (byte2 >> 4) & 0x0F  # Upper 4 bits
    
    color_map = {
        0: 'Green', 1: 'Red', 2: 'Orange', 3: 'Amber', 4: 'Yellow',
        5: 'Lime Green', 6: 'Spring Green', 7: 'Cyan', 8: 'Sky Blue',
        9: 'Blue', 10: 'Violet', 11: 'Magenta', 12: 'Rose',
        13: 'White', 14: 'Custom 1', 15: 'Custom 2'
    }
    decoded['color1'] = color_map.get(color1_code, f'Unknown ({color1_code})')
    decoded['color2'] = color_map.get(color2_code, f'Unknown ({color2_code})')
    
    # Byte 1 (Octet 1) - Animation, Pulse Pattern, Speed
    byte1 = bytes_data[1]
    animation_code = byte1 & 0x07  # Bits 0-2
    pulse_pattern_code = (byte1 >> 3) & 0x07  # Bits 3-5
    speed_code = (byte1 >> 6) & 0x03  # Bits 6-7
    
    animation_map = {
        0: 'Off', 1: 'Steady', 2: 'Flash', 3: 'Two Color Flash', 4: 'Intensity Sweep'
    }
    decoded['animation'] = animation_map.get(animation_code, f'Unknown ({animation_code})')
    
    pulse_pattern_map = {
        0: 'Normal', 1: 'Strobe', 2: 'Three Pulse', 3: 'SOS', 4: 'Random'
    }
    decoded['pulse_pattern'] = pulse_pattern_map.get(pulse_pattern_code, f'Unknown ({pulse_pattern_code})')
    
    speed_map = {
        0: 'Medium', 1: 'Fast', 2: 'Slow'
    }
    decoded['speed'] = speed_map.get(speed_code, f'Unknown ({speed_code})')
    
    # Byte 0 (Octet 0) - Intensities and Audible State
    byte0 = bytes_data[0]
    color1_intensity_code = byte0 & 0x07  # Bits 0-2
    color2_intensity_code = (byte0 >> 3) & 0x07  # Bits 3-5
    audible_state_code = (byte0 >> 6) & 0x03  # Bits 6-7
    
    intensity_map = {
        0: 'High', 1: 'Low', 2: 'Medium', 3: 'Off', 4: 'Custom'
    }
    decoded['color1_intensity'] = intensity_map.get(color1_intensity_code, f'Unknown ({color1_intensity_code})')
    decoded['color2_intensity'] = intensity_map.get(color2_intensity_code, f'Unknown ({color2_intensity_code})')
    
    audible_map = {
        0: 'Off', 1: 'On', 2: 'Pulsed', 3: 'SOS Pulse'
    }
    decoded['audible_state'] = audible_map.get(audible_state_code, f'Unknown ({audible_state_code})')
    
    # Determine if LED is effectively "on"
    decoded['led_on'] = decoded['animation'] != 'Off' and decoded['color1_intensity'] != 'Off'
    
    return decoded


def parse_hex_to_bytes(hex_string):
    """
    Parse a hex string to a list of bytes
    
    Args:
        hex_string: Hex string like "010A00" or "0x01 0x0A 0x00"
        
    Returns:
        List of integers (bytes)
    """
    if not hex_string:
        return []
    
    # Clean up the hex string
    hex_clean = hex_string.replace(' ', '').replace('0x', '').replace('0X', '')
    
    # Convert to bytes
    try:
        bytes_list = [int(hex_clean[i:i+2], 16) for i in range(0, len(hex_clean), 2)]
        return bytes_list
    except ValueError:
        return []
