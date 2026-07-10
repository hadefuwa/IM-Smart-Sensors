/**
 * Simulated IO-Link master data source — GitHub Pages demo only.
 *
 * Pure state/data module (no DOM, no network). Mirrors the shapes produced by
 * backend/io_link_fastapi.py, backend/al1350_client.py, backend/decoder.py and
 * backend/device_parameters.py for the fixed 4-sensor training kit, so the
 * existing frontend page handlers (which only ever read these JSON shapes)
 * work unmodified against a fake feed.
 */

// ── Device registry (JS mirror of backend/device_parameters.py) ─────────────
// Only fields the frontend reads: index, subindex, name, dtype, access, group,
// scale, unit, enum, default, min, max, desc.

const G_IDENTITY = 'identity';
const G_CONFIG = 'config';
const G_DIAGNOSTICS = 'diagnostics';

function p(index, subindex, name, dtype, extra = {}) {
  return { index, subindex, name, dtype, access: 'ro', group: G_IDENTITY, ...extra };
}

const TV7105_PARAMS = {
  label: 'IFM TV7105 Temperature Sensor',
  pdo_write: false,
  commands: {
    teach_sp1: { value: 172, label: 'Teach SP1 — sets SP1 to current temperature' },
    teach_sp2: { value: 240, label: 'Teach SP2 — sets SP2 to current temperature' },
    factory_reset: { value: 130, label: 'Factory reset (restores all defaults)' },
  },
  parameters: [
    p(18, 0, 'Product Name', 'string'),
    p(21, 0, 'Serial Number', 'string'),
    p(22, 0, 'Hardware Rev', 'string'),
    p(23, 0, 'Firmware Rev', 'string'),
    p(24, 0, 'Application Tag', 'string', { access: 'rw', max_len: 32 }),
    p(36, 0, 'Device Status', 'uint8', { group: G_DIAGNOSTICS, enum: { 0: 'OK', 1: 'Maintenance required', 2: 'Out-of-specification', 3: 'Functional check', 4: 'Failure' } }),
    p(560, 0, 'Max Temp (memory)', 'int16', { group: G_DIAGNOSTICS, scale: 0.1, unit: '°C' }),
    p(561, 0, 'Min Temp (memory)', 'int16', { group: G_DIAGNOSTICS, scale: 0.1, unit: '°C' }),
    p(551, 0, 'Temperature Unit', 'uint8', { access: 'rw', group: G_CONFIG, enum: { 0: '°C', 1: '°F' } }),
    p(580, 0, 'OUT1 Function', 'uint8', { access: 'rw', group: G_CONFIG, enum: { 3: 'Hno — hysteresis, NO', 4: 'Hnc — hysteresis, NC', 5: 'Fno — window, NO', 6: 'Fnc — window, NC' } }),
    p(583, 0, 'SP1 — Switch Point 1', 'int16', { access: 'rw', group: G_CONFIG, scale: 0.1, unit: '°C', min: -49.8, max: 150.0, default: 60.0 }),
    p(584, 0, 'RP1 — Reset Point 1', 'int16', { access: 'rw', group: G_CONFIG, scale: 0.1, unit: '°C', min: -50.0, max: 149.8, default: 50.0 }),
    p(581, 0, 'Switch-On Delay 1', 'uint16', { access: 'rw', group: G_CONFIG, unit: 'ms', min: 0, max: 500, default: 0 }),
    p(582, 0, 'Switch-Off Delay 1', 'uint16', { access: 'rw', group: G_CONFIG, unit: 'ms', min: 0, max: 500, default: 0 }),
    p(590, 0, 'OUT2 Function', 'uint8', { access: 'rw', group: G_CONFIG, enum: { 3: 'Hno — hysteresis, NO', 4: 'Hnc — hysteresis, NC', 5: 'Fno — window, NO', 6: 'Fnc — window, NC' } }),
    p(593, 0, 'SP2 — Switch Point 2', 'int16', { access: 'rw', group: G_CONFIG, scale: 0.1, unit: '°C', min: -49.8, max: 150.0, default: 120.0 }),
    p(594, 0, 'RP2 — Reset Point 2', 'int16', { access: 'rw', group: G_CONFIG, scale: 0.1, unit: '°C', min: -50.0, max: 149.8, default: 100.0 }),
    p(591, 0, 'Switch-On Delay 2', 'uint16', { access: 'rw', group: G_CONFIG, unit: 'ms', min: 0, max: 500, default: 0 }),
    p(592, 0, 'Switch-Off Delay 2', 'uint16', { access: 'rw', group: G_CONFIG, unit: 'ms', min: 0, max: 500, default: 0 }),
    p(681, 0, 'Calibration Offset', 'int16', { access: 'rw', group: G_CONFIG, scale: 0.1, unit: '°C', min: -10.0, max: 10.0, default: 0.0 }),
  ],
};

const CAPACITIVE_PARAMS = {
  label: 'RS PRO / Carlo Gavazzi Capacitive Sensor (M18)',
  pdo_write: false,
  commands: {
    teach_sp1_start: { value: 71, label: 'Start SP1 teach (place target at trigger point)' },
    teach_sp1_stop: { value: 72, label: 'Stop SP1 teach (target in position)' },
    teach_cancel: { value: 79, label: 'Cancel teach' },
    factory_reset: { value: 130, label: 'Factory reset' },
  },
  parameters: [
    p(18, 0, 'Product Name', 'string'),
    p(21, 0, 'Serial Number', 'string'),
    p(24, 0, 'Application Tag', 'string', { access: 'rw', max_len: 32 }),
    p(36, 0, 'Device Status', 'uint8', { group: G_DIAGNOSTICS, enum: { 0: 'OK', 1: 'Maintenance required', 2: 'Out-of-specification', 3: 'Functional check', 4: 'Failure' } }),
    p(75, 0, 'Quality of Teach (QoT)', 'uint8', { group: G_DIAGNOSTICS, min: 0, max: 255 }),
    p(76, 0, 'Quality of Run (QoR)', 'uint8', { group: G_DIAGNOSTICS, min: 0, max: 255 }),
    p(201, 0, 'Operating Hours', 'int32', { group: G_DIAGNOSTICS, unit: 'h' }),
    p(210, 0, 'Detection Counter', 'int32', { group: G_DIAGNOSTICS }),
    p(60, 1, 'SSC1 SP1 — Sensitivity Threshold', 'int16', { access: 'rw', group: G_CONFIG, min: 10, max: 10000, default: 1000 }),
    p(60, 2, 'SSC1 SP2 — Upper Window Limit', 'int16', { access: 'rw', group: G_CONFIG, min: 10, max: 10000, default: 10000 }),
    p(61, 1, 'SSC1 Logic', 'uint8', { access: 'rw', group: G_CONFIG, enum: { 0: 'High active (object → output ON)', 1: 'Low active (object → output OFF)' } }),
    p(61, 2, 'SSC1 Mode', 'uint8', { access: 'rw', group: G_CONFIG, enum: { 0: 'Disabled', 1: 'Single Point', 2: 'Window Mode', 3: 'Two Point Mode' } }),
    p(61, 3, 'SSC1 Hysteresis', 'uint16', { access: 'rw', group: G_CONFIG, unit: '%', min: 1, max: 100, default: 6 }),
    p(77, 0, 'Filter Scaler', 'uint8', { access: 'rw', group: G_CONFIG, min: 1, max: 255, default: 1 }),
    p(71, 0, 'Application Preset', 'uint8', { access: 'rw', group: G_CONFIG, enum: { 0: 'Full Scale', 1: 'Liquid Level', 2: 'Plastic Pellets' } }),
  ],
};

const PROXIMITY_OMRON_PARAMS = {
  label: 'OMRON E2E-X NEXT M18 Inductive Proximity Sensor (IO-Link V1.1)',
  pdo_write: false,
  commands: {
    factory_reset: { value: 130, label: 'Restore factory settings (all parameters → default)' },
  },
  parameters: [
    p(18, 0, 'Product Name', 'string'),
    p(19, 0, 'Product ID', 'string'),
    p(21, 0, 'Serial Number', 'string'),
    p(22, 0, 'Hardware Rev', 'string'),
    p(23, 0, 'Firmware Rev', 'string'),
    p(24, 0, 'Application Tag', 'string', { access: 'rw', max_len: 32 }),
    p(36, 0, 'Device Status', 'uint8', { group: G_DIAGNOSTICS, enum: { 0: 'OK', 1: 'Maintenance required', 2: 'Out-of-specification', 3: 'Functional check', 4: 'Failure' } }),
    p(160, 1, 'Operating Hours', 'uint32', { group: G_DIAGNOSTICS, unit: 'h' }),
    p(165, 0, 'Internal Temp (Present)', 'uint16', { group: G_DIAGNOSTICS }),
    p(166, 0, 'Internal Temp (Max)', 'uint16', { group: G_DIAGNOSTICS }),
    p(167, 0, 'Internal Temp (Min)', 'uint16', { group: G_DIAGNOSTICS }),
    p(61, 1, 'Switchpoint Logic OUT1', 'uint8', { access: 'rw', group: G_CONFIG, enum: { 0: 'NO — Normally Open (object → output ON)', 1: 'NC — Normally Closed (object → output OFF)' } }),
    p(65, 1, 'Timer Mode', 'uint8', { access: 'rw', group: G_CONFIG, enum: { 0: 'Disabled', 1: 'ON Delay', 2: 'OFF Delay', 3: 'One Shot' }, default: 0 }),
    p(65, 2, 'Timer Time', 'uint16', { access: 'rw', group: G_CONFIG, unit: 'ms', min: 0, max: 16383, default: 5 }),
    p(161, 0, 'Instability Alarm Delay', 'uint8', { access: 'rw', group: G_CONFIG, enum: { 0: 'No delay', 1: '10 ms', 2: '50 ms', 3: '100 ms', 4: '300 ms', 5: '500 ms', 6: '1000 ms' }, default: 4 }),
    p(163, 0, 'Diagnosis Mode', 'uint8', { access: 'rw', group: G_CONFIG, enum: { 0: 'Disabled', 1: 'Mode 1 — Instability + Over-Approach alarms', 2: 'Mode 2 — Instability alarm only', 3: 'Mode 3 — Over-Approach alarm only' }, default: 1 }),
    p(164, 0, 'Excessive Proximity Distance', 'uint8', { access: 'rw', group: G_CONFIG, enum: { 0: 'Iron 10%', 1: 'Iron 20%', 2: 'Iron 30%', 3: 'SUS 10%', 4: 'SUS 20%', 5: 'SUS 30%', 6: 'Aluminium 10%', 7: 'Aluminium 20%' }, default: 1 }),
  ],
};

const CL50_BANNER_PARAMS = {
  label: 'Banner CL50 Pro RGB Column Light (IO-Link V1.1)',
  pdo_write: true,
  commands: {
    factory_reset: { value: 130, label: 'Restore factory settings (all parameters → default)' },
  },
  parameters: [
    p(18, 0, 'Product Name', 'string'),
    p(19, 0, 'Product ID', 'string'),
    p(21, 0, 'Serial Number', 'string'),
    p(22, 0, 'Hardware Rev', 'string'),
    p(23, 0, 'Firmware Rev', 'string'),
    p(24, 0, 'Application Tag', 'string', { access: 'rw', max_len: 32 }),
    p(36, 0, 'Device Status', 'uint8', { group: G_DIAGNOSTICS, enum: { 0: 'OK', 1: 'Maintenance required', 2: 'Out-of-specification', 3: 'Functional check', 4: 'Failure' } }),
    p(75, 1, 'Custom Intensity', 'uint8', { access: 'rw', group: G_CONFIG, min: 0, max: 100, default: 100, unit: '%' }),
    p(75, 2, 'Custom Flash Rate', 'uint8', { access: 'rw', group: G_CONFIG, min: 1, max: 20, default: 15 }),
    p(75, 4, 'Restrict To Gamut', 'bool', { access: 'rw', group: G_CONFIG, enum: { 0: 'Off — allow out-of-gamut RGB values', 1: 'On — clamp to device colour gamut' } }),
    p(76, 1, 'Custom 1 — Red', 'uint8', { access: 'rw', group: G_CONFIG, min: 0, max: 255, default: 255 }),
    p(76, 2, 'Custom 1 — Green', 'uint8', { access: 'rw', group: G_CONFIG, min: 0, max: 255, default: 255 }),
    p(76, 3, 'Custom 1 — Blue', 'uint8', { access: 'rw', group: G_CONFIG, min: 0, max: 255, default: 255 }),
    p(77, 1, 'Custom 2 — Red', 'uint8', { access: 'rw', group: G_CONFIG, min: 0, max: 255, default: 255 }),
    p(77, 2, 'Custom 2 — Green', 'uint8', { access: 'rw', group: G_CONFIG, min: 0, max: 255, default: 255 }),
    p(77, 3, 'Custom 2 — Blue', 'uint8', { access: 'rw', group: G_CONFIG, min: 0, max: 255, default: 255 }),
  ],
};

// Port number → fixed device identity for this training kit (matches backend/config.json port_labels)
const PORT_DEVICES = {
  1: { vendor_id: 612, device_id: 131094, name: 'E2E-X16MB1T18 2M', device_type: 'proximity', registry: PROXIMITY_OMRON_PARAMS, label: 'Proximity' },
  2: { vendor_id: 1586, device_id: 1052673, name: '2377240', device_type: 'capacitive', registry: CAPACITIVE_PARAMS, label: 'Capacitive' },
  3: { vendor_id: 310, device_id: 733, name: 'TV7105', device_type: 'temperature', registry: TV7105_PARAMS, label: 'IFM TV7105' },
  4: { vendor_id: 451, device_id: 393229, name: 'CL50PKQ', device_type: 'status_led', registry: CL50_BANNER_PARAMS, label: 'Light Stack' },
};

const SERIALS = { 1: 'SIM-P1-00001', 2: 'SIM-P2-00002', 3: 'SIM-P3-00003', 4: 'SIM-P4-00004' };

// Static plausible per-index values for the ISDU parameter read/read-all endpoints.
// Read-only: writes never mutate this table (per the accepted sim-mode limitation).
function defaultParamValue(param) {
  if (param.name === 'Product Name') return null; // filled from PORT_DEVICES at call site
  if (param.name === 'Serial Number') return null; // filled from SERIALS at call site
  if (param.name === 'Product ID') return null;
  if (param.name === 'Hardware Rev') return 'HW1.0';
  if (param.name === 'Firmware Rev') return 'FW1.2';
  if (param.name === 'Application Tag') return '';
  if (typeof param.default === 'number') return param.default;
  if (param.dtype === 'string') return '';
  if (param.enum) return Object.keys(param.enum).map(Number)[0] ?? 0;
  return 0;
}

// ── Live drift state ─────────────────────────────────────────────────────────

let tickCount = 0;
let proxObjectPresent = false;
let proxNextToggleAt = 6; // ticks (500ms each) until next toggle
let proxAlarmUntil = 0;
let capValue = 400; // baseline analogue value, below threshold

// CL50 PDout state (stateful — mutated by /pdout writes)
let cl50PdoutHex = '000100'; // Green, Steady, High — matches real startup default
let cl50Sweep = null; // { color1, color2, speed, timer } when a software sweep is active

function rand(min, max) { return min + Math.random() * (max - min); }
function noise(amount) { return rand(-amount, amount); }

function decodeCl50Hex(hex) {
  const b = [parseInt(hex.slice(0, 2), 16) || 0, parseInt(hex.slice(2, 4), 16) || 0, parseInt(hex.slice(4, 6), 16) || 0];
  const colorMap = ['Green', 'Red', 'Orange', 'Amber', 'Yellow', 'Lime Green', 'Spring Green', 'Cyan', 'Sky Blue', 'Blue', 'Violet', 'Magenta', 'Rose', 'White', 'Custom 1', 'Custom 2'];
  const animMap = ['Off', 'Steady', 'Flash', 'Two Color Flash', 'Intensity Sweep'];
  const pulseMap = ['Normal', 'Strobe', 'Three Pulse', 'SOS', 'Random'];
  const speedMap = ['Medium', 'Fast', 'Slow'];
  const intensityMap = ['High', 'Low', 'Medium', 'Off', 'Custom'];
  const audibleMap = ['Off', 'On', 'Pulsed', 'SOS Pulse'];
  const color1Code = b[2] & 0x0f, color2Code = (b[2] >> 4) & 0x0f;
  const animCode = b[1] & 0x07, pulseCode = (b[1] >> 3) & 0x07, speedCode = (b[1] >> 6) & 0x03;
  const c1iCode = b[0] & 0x07, c2iCode = (b[0] >> 3) & 0x07, audCode = (b[0] >> 6) & 0x03;
  return {
    color1: colorMap[color1Code] || 'Green', color2: colorMap[color2Code] || 'Green',
    color1_intensity: intensityMap[c1iCode] || 'High', color2_intensity: intensityMap[c2iCode] || 'High',
    animation: animMap[animCode] || 'Off', pulse_pattern: pulseMap[pulseCode] || 'Normal', speed: speedMap[speedCode] || 'Medium',
    audible_state: audibleMap[audCode] || 'Off',
    led_on: (animMap[animCode] || 'Off') !== 'Off' && (intensityMap[c1iCode] || 'High') !== 'Off',
    raw_hex: hex.toUpperCase(),
  };
}

function generatePort1() {
  tickCount % 1 === 0 && proxNextToggleAt--;
  if (proxNextToggleAt <= 0) {
    proxObjectPresent = !proxObjectPresent;
    proxNextToggleAt = Math.round(rand(8, 16)); // ~4-8s at 500ms/tick
  }
  let instability = false, overApproach = false, warning = false, error = false;
  if (tickCount > proxAlarmUntil && Math.random() < 0.01) {
    proxAlarmUntil = tickCount + 2; // brief ~1s blip
  }
  if (tickCount <= proxAlarmUntil) instability = true;
  const monitor = Math.round((proxObjectPresent ? 40 : 80) + noise(3));
  const pdin_decoded = {
    object_present: proxObjectPresent,
    instability_alarm: instability,
    over_approach_alarm: overApproach,
    warning, error,
    monitor_output: monitor,
    description: proxObjectPresent ? 'Object present' : 'Object absent',
  };
  const b1 = (pdin_decoded.object_present ? 0x01 : 0) | (instability ? 0x10 : 0) | (overApproach ? 0x20 : 0) | (warning ? 0x40 : 0) | (error ? 0x80 : 0);
  const hex = `${monitor.toString(16).padStart(2, '0')}${b1.toString(16).padStart(2, '0')}`.toUpperCase();
  pdin_decoded.raw_hex = hex;
  return { pdin_hex: hex, pdin_decoded };
}

function generatePort2() {
  capValue = Math.max(0, capValue + noise(15) + Math.sin(tickCount / 40) * 8);
  const threshold = 1000;
  const so1 = capValue > threshold;
  const so2 = capValue > threshold * 1.3;
  const bytes = [(Math.round(capValue) >> 8) & 0xff, Math.round(capValue) & 0xff, (so1 ? 0x01 : 0), (so1 ? 0x01 : 0) | (so2 ? 0x02 : 0)];
  const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return {
    pdin_hex: hex,
    pdin_decoded: {
      object_detected: so1, so1, so2, ssc1: so1, ssc2: false,
      analogue_value: Math.round(capValue),
      description: so1 ? 'Active: SO1' : 'No object',
    },
  };
}

function generatePort3() {
  const temp = 26 + Math.sin(tickCount / 80) * 2 + noise(0.15);
  const out1 = temp > 31, out2 = temp > 29;
  const raw = Math.round(temp * 10);
  const rawBytes = raw < 0 ? raw + 0x10000 : raw;
  const status = (out1 ? 0x01 : 0) | (out2 ? 0x02 : 0);
  const hex = `${((rawBytes >> 8) & 0xff).toString(16).padStart(2, '0')}${(rawBytes & 0xff).toString(16).padStart(2, '0')}FF${status.toString(16).padStart(2, '0')}`.toUpperCase();
  return {
    pdin_hex: hex,
    pdin_decoded: {
      temperature_c: Math.round(temp * 10) / 10,
      out1, out2,
      description: `${Math.round(temp * 10) / 10} °C`,
    },
  };
}

function generatePort4() {
  if (cl50Sweep) {
    cl50Sweep.timer -= 1;
    if (cl50Sweep.timer <= 0) {
      const seq = [[1, 2], [2, 2], [0, 4], [2, 2], [1, 2]];
      cl50Sweep.step = (cl50Sweep.step + 1) % seq.length;
      const [c1i, holds] = seq[cl50Sweep.step];
      cl50Sweep.timer = holds;
      const b0 = c1i & 0x07; // steady, high-ish intensity sweep on color1
      const b1 = 0x01; // animation = Steady
      const b2 = parseInt(cl50PdoutHex.slice(4, 6), 16) || 0;
      cl50PdoutHex = `${b0.toString(16).padStart(2, '0')}${b1.toString(16).padStart(2, '0')}${b2.toString(16).padStart(2, '0')}`.toUpperCase();
    }
  }
  return { pdin_hex: null, pdout_hex: cl50PdoutHex, pdout_decoded: decodeCl50Hex(cl50PdoutHex) };
}

export function writePort4Pdout(hex) {
  cl50Sweep = null;
  cl50PdoutHex = hex.toUpperCase();
  return { success: true, port: 4, value: cl50PdoutHex };
}

export function startPort4Sweep(color1 = 0, color2 = 0, speed = 'medium') {
  cl50Sweep = { color1, color2, speed, step: 0, timer: 1 };
  return { success: true };
}

export function stopPort4Sweep() {
  cl50Sweep = null;
  return { success: true };
}

const PORT_GENERATORS = { 1: generatePort1, 2: generatePort2, 3: generatePort3, 4: generatePort4 };

export function tick() {
  tickCount += 1;
  const ports = [1, 2, 3, 4].map(n => {
    const dev = PORT_DEVICES[n];
    const dyn = PORT_GENERATORS[n]();
    return {
      port: n,
      mode: 'io-link',
      comm_mode: 'COM2',
      master_cycle_time: 8,
      vendor_id: dev.vendor_id,
      device_id: dev.device_id,
      name: dev.name,
      serial: SERIALS[n],
      device_type: dev.device_type,
      label: dev.label,
      source: 'simulated',
      pdout: null,
      ...dyn,
    };
  });

  const supervision = {
    voltage: Math.round((24 + noise(0.3)) * 100) / 100,
    current: Math.round((0.15 + noise(0.05)) * 1000) / 1000,
    temperature: Math.round((35 + noise(2)) * 10) / 10,
    supervisionstatus: 0,
  };

  return {
    device_name: 'AL1350 (Simulated)',
    master_ip: '192.168.7.4 (SIM)',
    ports,
    supervision,
    software: { Bootloader: 'AL1xxx_bl_f7_v2.4.1 (sim)', Firmware: 'v2.4.1-sim' },
    device_icon_url: null,
    product_image_url: null,
    timestamp: tickCount,
    source: 'simulated',
    degraded_mode: false,
    degraded_reason: null,
    last_good_data_ts: tickCount,
    error: null,
    success: true,
  };
}

export function getPortDevice(portNum) {
  return PORT_DEVICES[portNum] || null;
}

export function getParameterRegistry(portNum) {
  const dev = PORT_DEVICES[portNum];
  return dev ? dev.registry : null;
}

export function readParameterValue(portNum, index, subindex, dtype, scale = 1.0) {
  const dev = PORT_DEVICES[portNum];
  if (!dev) return null;
  const param = dev.registry.parameters.find(pp => pp.index === index && pp.subindex === subindex);
  if (param) {
    if (param.name === 'Product Name') return dev.name;
    if (param.name === 'Product ID') return String(dev.device_id);
    if (param.name === 'Serial Number') return SERIALS[portNum];
    return defaultParamValue(param);
  }
  // Unregistered index (e.g. a worksheet probing a raw index) — plausible zero.
  return dtype === 'string' ? '' : 0;
}

export function getParametersWithValues(portNum) {
  const dev = PORT_DEVICES[portNum];
  if (!dev) return null;
  const parameters = dev.registry.parameters.map(param => {
    const value = readParameterValue(portNum, param.index, param.subindex, param.dtype, param.scale || 1.0);
    const entry = { ...param, raw_hex: '', value };
    if (value !== null && param.enum) {
      entry.value_label = param.enum[value] ?? String(value);
    }
    return entry;
  });
  return { label: dev.registry.label, commands: dev.registry.commands, parameters };
}
