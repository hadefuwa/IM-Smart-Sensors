/**
 * Industrial HMI Homepage
 * Real-time monitoring dashboard for IO-Link Master and connected sensors
 */

import {
  createTemperatureGauge,
  createLEDIndicator,
  createCounterDisplay,
  createCapacitiveIndicator,
  createMasterStatusDisplay
} from './components/mimic-components.js';
import Chart from 'chart.js/auto';

// WebSocket connection
let socket = null;
let reconnectTimer = null;
let isHomePageActive = false;
let mimicComponents = {};
let charts = {};
let themeObserver = null;

// Historical data buffers
let temperatureHistory = [];
let tempMin = null, tempMax = null, tempSum = 0, tempCount = 0;

let detectionHistory = [];
let detectionCycleCount = 0;
let _lastDetectedState = false;

let signalQualityHistory = [];

let capDetectionHistory = [];
let capAnalogueHistory = [];
let capDetectionCycleCount = 0;
let _lastCapDetectedState = false;

let ledStateLog = [];
let _lastLedState = null;

// Per-port live connection metadata (tracked in frontend)
// Keys: 'temp', 'photo', 'cap', 'led'
let portMeta = {};

const MAX_HISTORY_POINTS = 50;
const MAX_LED_LOG = 20;
const RATE_WINDOW_SEC = 10; // window for update-rate calc

// API/WebSocket base
const API_BASE = window.IO_LINK_API_BASE || window.location.origin;
const WS_BASE = API_BASE.replace(/^http/, 'ws');

// ─────────────────────────────────────────────────────────────────────────────
// Port Passport helpers
// ─────────────────────────────────────────────────────────────────────────────

function initPortMeta(key) {
  if (!portMeta[key]) {
    portMeta[key] = {
      onlineSince: null,       // Date when mode first became 'io-link'
      lastReadTs: null,        // epoch ms of last data
      updateTimes: [],         // rolling window of epoch-ms timestamps for rate calc
    };
  }
}

function recordPortRead(key) {
  const m = portMeta[key];
  if (!m) return;
  const now = Date.now();
  m.lastReadTs = now;
  m.updateTimes.push(now);
  // Keep only the RATE_WINDOW_SEC window
  const cutoff = now - RATE_WINDOW_SEC * 1000;
  while (m.updateTimes.length > 1 && m.updateTimes[0] < cutoff) m.updateTimes.shift();
}

function getUpdateRateHz(key) {
  const m = portMeta[key];
  if (!m || m.updateTimes.length < 2) return null;
  const span = (m.updateTimes[m.updateTimes.length - 1] - m.updateTimes[0]) / 1000;
  if (span < 0.1) return null;
  return ((m.updateTimes.length - 1) / span).toFixed(1);
}

function fmtAgo(ts) {
  if (!ts) return 'Waiting…';
  const secs = Math.round((Date.now() - ts) / 1000);
  if (secs < 2) return 'Just now';
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return new Date(ts).toLocaleTimeString();
}

function fmtCycleTime(raw) {
  if (!raw && raw !== 0) return '—';
  const us = parseInt(raw, 10);
  if (isNaN(us) || us === 0) return '—';
  if (us >= 1000) return `${(us / 1000).toFixed(1)} ms`;
  return `${us} µs`;
}

function fmtId(val) {
  if (!val && val !== 0) return '—';
  const n = parseInt(val, 10);
  if (isNaN(n)) return String(val);
  return `${n} (0x${n.toString(16).toUpperCase()})`;
}

/**
 * Render an IO-Link Device Passport panel for a given port key.
 * All live fields use IDs like pp-{key}-{field} and are updated by updatePortPassport().
 */
function renderPassport(key) {
  return `
    <div class="card bg-base-200 shadow-xl">
      <div class="card-body p-4">
        <div class="flex items-center gap-2 mb-2">
          <h3 class="card-title text-base-content text-base">IO-Link Device Passport</h3>
          <span class="badge badge-success badge-xs gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Auto-identified
          </span>
          <span id="pp-${key}-live" class="badge badge-ghost badge-xs opacity-40">Waiting</span>
        </div>
        <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
          <!-- Identity — read from device EEPROM over IO-Link -->
          <div class="col-span-2 text-xs font-semibold opacity-40 uppercase tracking-widest mt-1 mb-0.5">Device Identity</div>
          <div class="flex items-center gap-1">
            <span class="opacity-50">Product</span>
            <span class="badge badge-info badge-xs ml-1">EEPROM</span>
          </div>
          <div class="font-mono font-bold" id="pp-${key}-name">—</div>

          <div class="opacity-50">Vendor ID</div>
          <div class="font-mono" id="pp-${key}-vendor">—</div>

          <div class="opacity-50">Device ID</div>
          <div class="font-mono" id="pp-${key}-device">—</div>

          <div class="flex items-center gap-1">
            <span class="opacity-50">Serial</span>
            <span class="badge badge-info badge-xs ml-1">EEPROM</span>
          </div>
          <div class="font-mono" id="pp-${key}-serial">—</div>

          <!-- Communication — IO-Link bus parameters -->
          <div class="col-span-2 text-xs font-semibold opacity-40 uppercase tracking-widest mt-2 mb-0.5">Communication</div>
          <div class="opacity-50">Cycle Time</div>
          <div class="font-mono" id="pp-${key}-cycle">—</div>

          <div class="opacity-50">Update Rate</div>
          <div class="font-mono" id="pp-${key}-rate">—</div>

          <div class="opacity-50">Data Source</div>
          <div class="font-mono" id="pp-${key}-source">—</div>

          <!-- Timestamps — live connection health -->
          <div class="col-span-2 text-xs font-semibold opacity-40 uppercase tracking-widest mt-2 mb-0.5">Connection Health</div>
          <div class="opacity-50">Online Since</div>
          <div class="font-mono" id="pp-${key}-online">—</div>

          <div class="opacity-50">Last Read</div>
          <div class="font-mono" id="pp-${key}-lastread">Waiting…</div>

          <!-- Raw process data -->
          <div class="col-span-2 text-xs font-semibold opacity-40 uppercase tracking-widest mt-2 mb-0.5">Raw Process Data (PDin)</div>
          <div class="col-span-2 font-mono bg-base-300 rounded px-2 py-1 text-xs tracking-widest" id="pp-${key}-pdin">—</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Update the passport panel live fields for a port.
 */
function updatePortPassport(key, port) {
  initPortMeta(key);
  const m = portMeta[key];

  // Mark online since first time we see io-link mode
  if (port.mode === 'io-link' && !m.onlineSince) {
    m.onlineSince = new Date();
  }
  recordPortRead(key);

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? '—';
  };

  // Live badge
  const liveEl = document.getElementById(`pp-${key}-live`);
  if (liveEl) {
    liveEl.textContent = 'Live';
    liveEl.className = 'badge badge-success badge-xs';
  }

  // Identity
  set(`pp-${key}-name`,   port.name || port.label || '—');
  set(`pp-${key}-vendor`, fmtId(port.vendor_id));
  set(`pp-${key}-device`, fmtId(port.device_id));
  set(`pp-${key}-serial`, port.serial || '—');

  // Communication
  set(`pp-${key}-cycle`,  fmtCycleTime(port.master_cycle_time));
  const hz = getUpdateRateHz(key);
  set(`pp-${key}-rate`,   hz ? `${hz} Hz` : '—');
  set(`pp-${key}-source`, port.source || '—');

  // Connection health
  set(`pp-${key}-online`,    m.onlineSince ? m.onlineSince.toLocaleTimeString() : '—');
  set(`pp-${key}-lastread`,  fmtAgo(m.lastReadTs));

  // Raw PDin
  const pdinHex = port.pdin_hex || port.pdin || '';
  const formatted = pdinHex
    ? pdinHex.replace(/(.{2})/g, '$1 ').trim().toUpperCase()
    : '—';
  set(`pp-${key}-pdin`, formatted);
}

// ─────────────────────────────────────────────────────────────────────────────
// Page HTML
// ─────────────────────────────────────────────────────────────────────────────

export function renderHomePage() {
  return `
    <div class="hmi-homepage space-y-4">
      <!-- IO-Link Master Status — thin full-width bar -->
      <div id="mimic-master" class="mimic-component"></div>

      <!-- Sensor Cards — 4 columns -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div id="mimic-temperature" class="mimic-component"></div>
        <div id="mimic-capacitive" class="mimic-component"></div>
        <div id="mimic-photoelectric" class="mimic-component"></div>
        <div id="mimic-led" class="mimic-component"></div>
      </div>

      <!-- Condition Monitoring -->
      <div class="space-y-6">

        <!-- ── PORT 3: Temperature ── -->
        <div class="space-y-2">
          <div class="flex items-center gap-3 px-1">
            <span class="badge badge-outline font-mono font-bold text-xs tracking-widest" id="temp-port-num">PORT —</span>
            <span class="text-sm font-semibold opacity-60" id="temp-port-label">Temperature Sensor</span>
            <div class="flex-1 h-px bg-base-300"></div>
          </div>

          ${renderPassport('temp')}

          <!-- Min/Max/Avg stat chips -->
          <div class="flex gap-3 px-1 flex-wrap">
            <div class="stat bg-base-200 rounded-box px-4 py-2 flex flex-col items-center min-w-[80px]">
              <div class="stat-title text-xs opacity-60">Min</div>
              <div class="stat-value text-sm font-bold" id="temp-stat-min">—</div>
            </div>
            <div class="stat bg-base-200 rounded-box px-4 py-2 flex flex-col items-center min-w-[80px]">
              <div class="stat-title text-xs opacity-60">Max</div>
              <div class="stat-value text-sm font-bold" id="temp-stat-max">—</div>
            </div>
            <div class="stat bg-base-200 rounded-box px-4 py-2 flex flex-col items-center min-w-[80px]">
              <div class="stat-title text-xs opacity-60">Avg</div>
              <div class="stat-value text-sm font-bold" id="temp-stat-avg">—</div>
            </div>
          </div>

          <div class="card bg-base-200 shadow-xl">
            <div class="card-body">
              <h3 class="card-title text-base-content text-lg">Temperature Trend</h3>
              <div class="h-48">
                <canvas id="chart-temperature-trend"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- ── PORT 1: Photoelectric ── -->
        <div class="space-y-2">
          <div class="flex items-center gap-3 px-1">
            <span class="badge badge-outline font-mono font-bold text-xs tracking-widest" id="detection-port-num">PORT —</span>
            <span class="text-sm font-semibold opacity-60" id="detection-port-label">Photoelectric Sensor</span>
            <div class="flex-1 h-px bg-base-300"></div>
          </div>

          ${renderPassport('photo')}

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body">
                <h3 class="card-title text-base-content text-lg">Detection History</h3>
                <div class="h-32">
                  <canvas id="chart-detection-history"></canvas>
                </div>
              </div>
            </div>
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body">
                <h3 class="card-title text-base-content text-lg">Cycle Counter</h3>
                <div class="flex flex-col justify-center h-32">
                  <div class="text-center mb-2">
                    <div class="text-3xl font-bold" id="cycle-count-display">0</div>
                    <div class="text-sm opacity-60">/ 1,000,000 cycles</div>
                  </div>
                  <progress id="cycle-progress" class="progress progress-success w-full" value="0" max="1000000"></progress>
                </div>
                <div id="cycle-service-alert" class="hidden mt-2 alert alert-info">
                  <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Service due soon</span>
                </div>
              </div>
            </div>
          </div>
          <div class="card bg-base-200 shadow-xl">
            <div class="card-body">
              <h3 class="card-title text-base-content text-lg">Signal Quality Trend</h3>
              <div class="h-32">
                <canvas id="chart-signal-quality"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- ── PORT 2: Capacitive ── -->
        <div class="space-y-2">
          <div class="flex items-center gap-3 px-1">
            <span class="badge badge-outline font-mono font-bold text-xs tracking-widest" id="cap-port-num">PORT —</span>
            <span class="text-sm font-semibold opacity-60" id="cap-port-label">Capacitive Sensor</span>
            <div class="flex-1 h-px bg-base-300"></div>
          </div>

          ${renderPassport('cap')}

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body">
                <h3 class="card-title text-base-content text-lg">Detection History</h3>
                <div class="h-32">
                  <canvas id="chart-cap-detection"></canvas>
                </div>
              </div>
            </div>
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body">
                <h3 class="card-title text-base-content text-lg">Detection Counter</h3>
                <div class="flex flex-col justify-center h-32">
                  <div class="text-center mb-2">
                    <div class="text-3xl font-bold" id="cap-cycle-count-display">0</div>
                    <div class="text-sm opacity-60">detections</div>
                  </div>
                  <progress id="cap-cycle-progress" class="progress progress-info w-full" value="0" max="1000000"></progress>
                </div>
              </div>
            </div>
          </div>
          <div class="card bg-base-200 shadow-xl">
            <div class="card-body">
              <h3 class="card-title text-base-content text-lg">Dielectric Value Trend <span class="text-xs font-normal opacity-50 ml-1">(raw 16-bit)</span></h3>
              <div class="h-32">
                <canvas id="chart-cap-analogue"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- ── PORT 4: Light Stack ── -->
        <div class="space-y-2">
          <div class="flex items-center gap-3 px-1">
            <span class="badge badge-outline font-mono font-bold text-xs tracking-widest" id="led-port-num">PORT —</span>
            <span class="text-sm font-semibold opacity-60" id="led-port-label">Light Stack</span>
            <div class="flex-1 h-px bg-base-300"></div>
          </div>

          ${renderPassport('led')}

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Current State -->
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body">
                <h3 class="card-title text-base-content text-lg">Current State</h3>
                <div class="flex flex-col gap-2 h-32 justify-center">
                  <div class="flex items-center gap-3">
                    <div id="led-color-dot" class="w-5 h-5 rounded-full border-2 border-base-content/30 flex-shrink-0" style="background:#6b7280"></div>
                    <div class="flex flex-col">
                      <span class="text-xs opacity-50 uppercase tracking-widest">Colour</span>
                      <span class="font-mono font-bold" id="led-state-color">—</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-xs opacity-50 uppercase tracking-widest">Animation</span>
                      <span class="font-mono font-bold" id="led-state-animation">—</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707"/></svg>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-xs opacity-50 uppercase tracking-widest">Intensity</span>
                      <span class="font-mono font-bold" id="led-state-intensity">—</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- State Change Log -->
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body p-4">
                <h3 class="card-title text-base-content text-lg">State Changes</h3>
                <div class="overflow-y-auto h-32" id="led-state-log">
                  <table class="table table-xs w-full">
                    <thead>
                      <tr>
                        <th class="opacity-50">Time</th>
                        <th class="opacity-50">Colour</th>
                        <th class="opacity-50">Mode</th>
                      </tr>
                    </thead>
                    <tbody id="led-state-log-body">
                      <tr><td colspan="3" class="text-center opacity-40 text-xs">Waiting for data…</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Configuration Modals -->
      ${renderConfigModals()}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Config modals
// ─────────────────────────────────────────────────────────────────────────────

function renderConfigModals() {
  return `
    <dialog id="modal-temp-config" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Temperature Sensor Configuration</h3>
        <div class="py-4 space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">High Alarm Threshold (°C)</span></label>
            <input type="number" id="temp-high-alarm" class="input input-bordered" value="90" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Low Alarm Threshold (°C)</span></label>
            <input type="number" id="temp-low-alarm" class="input input-bordered" value="10" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Calibration Offset (°C)</span></label>
            <input type="number" id="temp-offset" class="input input-bordered" value="0" step="0.1" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Display Units</span></label>
            <select id="temp-units" class="select select-bordered">
              <option value="C">Celsius (°C)</option>
              <option value="F">Fahrenheit (°F)</option>
            </select>
          </div>
        </div>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm btn-ghost">Cancel</button>
            <button class="btn btn-sm btn-primary">Save</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <dialog id="modal-photo-config" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Photoelectric Sensor Configuration</h3>
        <div class="py-4 space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Counter Value</span></label>
            <div class="flex gap-2">
              <input type="number" id="photo-counter" class="input input-bordered flex-1" value="0" readonly />
              <button id="photo-reset-counter" class="btn btn-error">Reset</button>
            </div>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Detection Mode</span></label>
            <select id="photo-mode" class="select select-bordered">
              <option value="light-on">Light-On</option>
              <option value="dark-on">Dark-On</option>
            </select>
          </div>
        </div>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm btn-ghost">Cancel</button>
            <button class="btn btn-sm btn-primary">Save</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <dialog id="modal-capacitive-config" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Capacitive Sensor Configuration</h3>
        <div class="py-4 space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Sensing Range (mm)</span></label>
            <input type="number" id="cap-range" class="input input-bordered" value="12" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Output Mode</span></label>
            <select id="cap-output" class="select select-bordered">
              <option value="NO">Normally Open (NO)</option>
              <option value="NC">Normally Closed (NC)</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Maintenance Cycle Limit</span></label>
            <input type="number" id="cap-cycle-limit" class="input input-bordered" value="1000000" />
          </div>
        </div>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm btn-ghost">Cancel</button>
            <button class="btn btn-sm btn-primary">Save</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <dialog id="modal-led-config" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Status LED Configuration</h3>
        <div class="py-4 space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Color</span></label>
            <select id="led-color" class="select select-bordered">
              <option value="Green">Green</option>
              <option value="Red">Red</option>
              <option value="Orange">Orange</option>
              <option value="Amber">Amber</option>
              <option value="Yellow">Yellow</option>
              <option value="Blue">Blue</option>
              <option value="White">White</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Animation Mode</span></label>
            <select id="led-animation" class="select select-bordered">
              <option value="Steady">Steady</option>
              <option value="Flash">Flash</option>
              <option value="Two Color Flash">Two Color Flash</option>
              <option value="Intensity Sweep">Intensity Sweep</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Intensity</span></label>
            <select id="led-intensity" class="select select-bordered">
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div class="form-control">
            <button id="led-test-mode" class="btn btn-outline btn-sm">Test Mode (Cycle All States)</button>
          </div>
        </div>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm btn-ghost">Cancel</button>
            <button class="btn btn-sm btn-primary">Save</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <dialog id="modal-master-config" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">IO-Link Master Configuration</h3>
        <div class="py-4 space-y-4">
          <div class="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>For IP address and port configuration, please visit the Settings page.</span>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Poll Interval (seconds)</span></label>
            <input type="number" id="master-poll-interval" class="input input-bordered" value="1" min="1" max="10" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Timeout (seconds)</span></label>
            <input type="number" id="master-timeout" class="input input-bordered" value="2" min="1" max="10" />
          </div>
        </div>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm btn-ghost">Cancel</button>
            <button class="btn btn-sm btn-primary">Save</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart helpers
// ─────────────────────────────────────────────────────────────────────────────

function updateChartColors() {
  const colors = getChartColors();
  const toUpdate = [
    charts.temperature,
    charts.detectionHistory,
    charts.signalQuality,
    charts.capDetection,
    charts.capAnalogue,
  ];
  toUpdate.forEach(chart => {
    if (!chart) return;
    chart.options.scales.y.grid.color = colors.gridColor;
    chart.options.scales.y.ticks.color = colors.tickColor;
    chart.options.scales.x.grid.color = colors.gridColor;
    chart.options.scales.x.ticks.color = colors.tickColor;
    chart.update('none');
  });
}

function getChartColors() {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const isDark = theme === 'dark';
  return {
    gridColor:        isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    tickColor:        isDark ? '#ffffff' : '#000000',
    borderColor:      '#22c55e',
    backgroundColor:  'rgba(34,197,94,0.1)',
    blueBorder:       '#3b82f6',
    blueBackground:   'rgba(59,130,246,0.1)',
    amberBorder:      '#f59e0b',
    amberBackground:  'rgba(245,158,11,0.1)',
  };
}

function makeLineOptions(colors, extraY = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: false, grid: { color: colors.gridColor }, ticks: { color: colors.tickColor }, ...extraY },
      x: { grid: { color: colors.gridColor }, ticks: { color: colors.tickColor, maxTicksLimit: 8 } },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Init / destroy
// ─────────────────────────────────────────────────────────────────────────────

export function initHomePage() {
  console.log('Initializing HMI Homepage...');
  isHomePageActive = true;

  const saved = sessionStorage.getItem('photoDetectionCycles');
  if (saved) detectionCycleCount = parseInt(saved, 10) || 0;
  const savedCap = sessionStorage.getItem('capDetectionCycles');
  if (savedCap) capDetectionCycleCount = parseInt(savedCap, 10) || 0;

  initializeMimicComponents();
  initializeCharts();
  setupConfigModalHandlers();

  if (detectionCycleCount > 0) updateCycleCounter(detectionCycleCount);
  if (capDetectionCycleCount > 0) updateCapCycleCounter(capDetectionCycleCount);

  if (themeObserver) themeObserver.disconnect();
  themeObserver = new MutationObserver(mutations => {
    mutations.forEach(m => {
      if (m.type === 'attributes' && m.attributeName === 'data-theme') updateChartColors();
    });
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  connectWebSocket();
}

function initializeMimicComponents() {
  mimicComponents.master       = createMasterStatusDisplay('mimic-master', {});
  mimicComponents.temperature  = createTemperatureGauge('mimic-temperature', 0);
  mimicComponents.photoelectric = createCounterDisplay('mimic-photoelectric', {});
  mimicComponents.capacitive   = createCapacitiveIndicator('mimic-capacitive', {});
  mimicComponents.led          = createLEDIndicator('mimic-led', {});
}

function initializeCharts() {
  const colors = getChartColors();

  const tempCtx = document.getElementById('chart-temperature-trend');
  if (tempCtx) {
    charts.temperature = new Chart(tempCtx, {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Temperature (°C)', data: [], borderColor: colors.borderColor, backgroundColor: colors.backgroundColor, tension: 0.4, fill: true }] },
      options: makeLineOptions(colors),
    });
  }

  const detectionCtx = document.getElementById('chart-detection-history');
  if (detectionCtx) {
    charts.detectionHistory = new Chart(detectionCtx, {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Detected', data: [], borderColor: colors.borderColor, backgroundColor: colors.backgroundColor, stepped: 'before', fill: true, pointRadius: 0, tension: 0 }] },
      options: makeLineOptions(colors, { min: -0.1, max: 1.2, ticks: { color: colors.tickColor, stepSize: 1, callback: v => v === 1 ? 'ON' : v === 0 ? 'OFF' : '' } }),
    });
  }

  const sqCtx = document.getElementById('chart-signal-quality');
  if (sqCtx) {
    charts.signalQuality = new Chart(sqCtx, {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Signal Quality (%)', data: [], borderColor: colors.amberBorder, backgroundColor: colors.amberBackground, tension: 0.4, fill: true, pointRadius: 0 }] },
      options: makeLineOptions(colors, { min: 0, max: 100, ticks: { color: colors.tickColor, callback: v => `${v}%` } }),
    });
  }

  const capDetCtx = document.getElementById('chart-cap-detection');
  if (capDetCtx) {
    charts.capDetection = new Chart(capDetCtx, {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Detected', data: [], borderColor: colors.blueBorder, backgroundColor: colors.blueBackground, stepped: 'before', fill: true, pointRadius: 0, tension: 0 }] },
      options: makeLineOptions(colors, { min: -0.1, max: 1.2, ticks: { color: colors.tickColor, stepSize: 1, callback: v => v === 1 ? 'ON' : v === 0 ? 'OFF' : '' } }),
    });
  }

  const capAnaCtx = document.getElementById('chart-cap-analogue');
  if (capAnaCtx) {
    charts.capAnalogue = new Chart(capAnaCtx, {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Dielectric Value', data: [], borderColor: colors.blueBorder, backgroundColor: colors.blueBackground, tension: 0.3, fill: true, pointRadius: 0 }] },
      options: makeLineOptions(colors, { min: 0 }),
    });
  }
}

function setupConfigModalHandlers() {
  [
    ['mimic-temperature',   'modal-temp-config'],
    ['mimic-photoelectric', 'modal-photo-config'],
    ['mimic-capacitive',    'modal-capacitive-config'],
    ['mimic-led',           'modal-led-config'],
    ['mimic-master',        'modal-master-config'],
  ].forEach(([elId, modalId]) => {
    const el = document.getElementById(elId);
    if (el) el.addEventListener('click', () => document.getElementById(modalId)?.showModal());
  });

  const resetBtn = document.getElementById('photo-reset-counter');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      detectionCycleCount = 0;
      _lastDetectedState = false;
      sessionStorage.setItem('photoDetectionCycles', '0');
      updateCycleCounter(0);
    });
  }
}

export function destroyHomePage() {
  console.log('Destroying HMI Homepage...');
  isHomePageActive = false;

  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (socket) { socket.close(); socket = null; }
  if (themeObserver) { themeObserver.disconnect(); themeObserver = null; }

  Object.values(charts).forEach(c => { if (c) c.destroy(); });
  charts = {};
  mimicComponents = {};

  temperatureHistory = [];
  tempMin = null; tempMax = null; tempSum = 0; tempCount = 0;
  detectionHistory = [];
  signalQualityHistory = [];
  capDetectionHistory = [];
  capAnalogueHistory = [];
  ledStateLog = [];
  _lastLedState = null;
  portMeta = {};
}

// ─────────────────────────────────────────────────────────────────────────────
// WebSocket + data handling
// ─────────────────────────────────────────────────────────────────────────────

function connectWebSocket() {
  if (!isHomePageActive) return;
  socket = new WebSocket(`${WS_BASE}/ws`);

  socket.onmessage = event => {
    try { updateDashboard(JSON.parse(event.data)); }
    catch (e) { console.error('WS parse error:', e); }
  };

  socket.onclose = () => {
    if (!isHomePageActive) return;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connectWebSocket, 5000);
  };
}

function setComponentConnected(containerId, connected) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.classList.toggle('opacity-40', !connected);
  el.classList.toggle('grayscale', !connected);
}

function updateDashboard(data) {
  if (mimicComponents.master) mimicComponents.master.update(data);
  const masterConnected = data.success || false;

  if (!masterConnected) {
    ['mimic-temperature', 'mimic-capacitive', 'mimic-photoelectric', 'mimic-led']
      .forEach(id => setComponentConnected(id, false));
  }

  if (Array.isArray(data.ports)) {
    data.ports.forEach(port => processPortData(port, masterConnected));
  }
}

function processPortData(port, masterConnected = true) {
  const deviceType = getDeviceType(port);
  const portActive = masterConnected && port.mode === 'io-link';

  const containerMap = { temperature: 'mimic-temperature', photoelectric: 'mimic-photoelectric', capacitive: 'mimic-capacitive', led: 'mimic-led' };
  if (containerMap[deviceType]) setComponentConnected(containerMap[deviceType], portActive);

  if (!portActive) return;

  if (deviceType === 'temperature' && mimicComponents.temperature) {
    _setPortBadge('temp-port-num', 'temp-port-label', port);
    const temp = port.pdin_decoded?.temperature_c ?? 0;
    mimicComponents.temperature.update(temp);
    addToHistory(temperatureHistory, temp);
    if (tempMin === null || temp < tempMin) tempMin = temp;
    if (tempMax === null || temp > tempMax) tempMax = temp;
    tempSum += temp; tempCount++;
    updateTempStats();
    updateChart(charts.temperature, temperatureHistory);
    updatePortPassport('temp', port);

  } else if (deviceType === 'photoelectric' && mimicComponents.photoelectric) {
    _setPortBadge('detection-port-num', 'detection-port-label', port);
    mimicComponents.photoelectric.update(port.pdin_decoded || {});

    const isDetected = port.pdin_decoded?.object_detected || false;
    addToHistory(detectionHistory, isDetected ? 1 : 0);
    if (isDetected && !_lastDetectedState) {
      detectionCycleCount++;
      sessionStorage.setItem('photoDetectionCycles', String(detectionCycleCount));
    }
    _lastDetectedState = isDetected;
    updateChart(charts.detectionHistory, detectionHistory);
    updateCycleCounter(detectionCycleCount);

    const sq = port.pdin_decoded?.signal_quality_percent ?? null;
    if (sq !== null) { addToHistory(signalQualityHistory, sq); updateChart(charts.signalQuality, signalQualityHistory); }
    updatePortPassport('photo', port);

  } else if (deviceType === 'capacitive' && mimicComponents.capacitive) {
    _setPortBadge('cap-port-num', 'cap-port-label', port);
    mimicComponents.capacitive.update(port.pdin_decoded || {});

    const isCapDet = port.pdin_decoded?.object_detected || false;
    addToHistory(capDetectionHistory, isCapDet ? 1 : 0);
    if (isCapDet && !_lastCapDetectedState) {
      capDetectionCycleCount = port.detection_counter != null ? port.detection_counter : capDetectionCycleCount + 1;
      sessionStorage.setItem('capDetectionCycles', String(capDetectionCycleCount));
    } else if (port.detection_counter != null) {
      capDetectionCycleCount = port.detection_counter;
    }
    _lastCapDetectedState = isCapDet;
    updateChart(charts.capDetection, capDetectionHistory);
    updateCapCycleCounter(capDetectionCycleCount);

    const analogue = port.pdin_decoded?.analogue_value ?? null;
    if (analogue !== null) { addToHistory(capAnalogueHistory, analogue); updateChart(charts.capAnalogue, capAnalogueHistory); }
    updatePortPassport('cap', port);

  } else if (deviceType === 'led' && mimicComponents.led) {
    _setPortBadge('led-port-num', 'led-port-label', port);
    mimicComponents.led.update(port.pdout_decoded || {});
    updateLedStatePanel(port.pdout_decoded || {});
    updatePortPassport('led', port);
  }
}

function _setPortBadge(numId, labelId, port) {
  const numEl = document.getElementById(numId);
  const lblEl = document.getElementById(labelId);
  if (numEl) numEl.textContent = `PORT ${port.port}`;
  if (lblEl) lblEl.textContent = port.label || port.name || '';
}

function getDeviceType(port) {
  const t = port.device_type || '';
  if (t === 'photo_electric') return 'photoelectric';
  if (t === 'temperature')    return 'temperature';
  if (t === 'status_led')     return 'led';
  if (t === 'capacitive')     return 'capacitive';

  const n = (port.name || '').toUpperCase();
  if (n.includes('TEMP') || n.includes('TN') || n.includes('TR'))         return 'temperature';
  if (n.includes('PHOTO') || n.includes('O5D') || n.includes('O2D'))      return 'photoelectric';
  if (n.includes('CAPACITIVE') || n.includes('23772'))                     return 'capacitive';
  if (n.includes('LED') || n.includes('CL50') || n.includes('LIGHT'))     return 'led';
  return 'unknown';
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart update helpers
// ─────────────────────────────────────────────────────────────────────────────

function addToHistory(arr, val) {
  arr.push(val);
  if (arr.length > MAX_HISTORY_POINTS) arr.shift();
}

function updateChart(chart, data) {
  if (!chart) return;
  chart.data.labels = data.map((_, i) => `-${data.length - i}s`);
  chart.data.datasets[0].data = data;
  chart.update('none');
}

function updateTempStats() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  if (tempMin !== null) set('temp-stat-min', `${tempMin.toFixed(1)}°C`);
  if (tempMax !== null) set('temp-stat-max', `${tempMax.toFixed(1)}°C`);
  if (tempCount > 0)    set('temp-stat-avg', `${(tempSum / tempCount).toFixed(1)}°C`);
}

function updateCycleCounter(count) {
  const display  = document.getElementById('cycle-count-display');
  const progress = document.getElementById('cycle-progress');
  const alert    = document.getElementById('cycle-service-alert');
  if (display)  display.textContent = count.toLocaleString();
  if (progress) {
    progress.value = count;
    progress.className = `progress w-full ${count > 900000 ? 'progress-error' : count > 750000 ? 'progress-warning' : 'progress-success'}`;
  }
  if (alert) alert.classList.toggle('hidden', count <= 900000);
}

function updateCapCycleCounter(count) {
  const display  = document.getElementById('cap-cycle-count-display');
  const progress = document.getElementById('cap-cycle-progress');
  if (display)  display.textContent = count.toLocaleString();
  if (progress) {
    progress.value = count;
    progress.className = `progress w-full ${count > 900000 ? 'progress-error' : count > 750000 ? 'progress-warning' : 'progress-info'}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LED state panel
// ─────────────────────────────────────────────────────────────────────────────

const LED_COLOR_CSS = {
  green: '#22c55e', red: '#ef4444', orange: '#f97316', amber: '#f59e0b',
  yellow: '#eab308', blue: '#3b82f6', white: '#f8fafc', off: '#374151',
  'lime green': '#84cc16', 'spring green': '#10b981', cyan: '#06b6d4',
  'sky blue': '#38bdf8', violet: '#8b5cf6', magenta: '#ec4899',
};

function ledColorToCss(name) {
  return LED_COLOR_CSS[(name || '').toLowerCase()] || '#6b7280';
}

function updateLedStatePanel(decoded) {
  const color     = decoded.color     || decoded.color1 || '—';
  const animation = decoded.animation || '—';
  const intensity = decoded.intensity || decoded.color1_intensity || '—';

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('led-state-color',     color);
  set('led-state-animation', animation);
  set('led-state-intensity', intensity);

  const dot = document.getElementById('led-color-dot');
  if (dot) dot.style.background = ledColorToCss(color);

  const stateKey = `${color}|${animation}|${intensity}`;
  if (stateKey !== _lastLedState) {
    _lastLedState = stateKey;
    ledStateLog.unshift({ time: new Date().toLocaleTimeString(), color, animation, intensity });
    if (ledStateLog.length > MAX_LED_LOG) ledStateLog.pop();
    renderLedStateLog();
  }
}

function renderLedStateLog() {
  const tbody = document.getElementById('led-state-log-body');
  if (!tbody) return;
  if (!ledStateLog.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center opacity-40 text-xs">No changes yet</td></tr>';
    return;
  }
  tbody.innerHTML = ledStateLog.map(e => {
    const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${ledColorToCss(e.color)};margin-right:4px;vertical-align:middle;"></span>`;
    return `<tr><td class="font-mono text-xs opacity-70">${e.time}</td><td class="font-mono text-xs">${dot}${e.color}</td><td class="font-mono text-xs opacity-70">${e.animation}</td></tr>`;
  }).join('');
}
