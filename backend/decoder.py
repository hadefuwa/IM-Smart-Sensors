"""
CL50 LED Decoder Module
Decodes Process Data Out (PDout) bytes from CL50 PRO SELECT LED devices
"""


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
