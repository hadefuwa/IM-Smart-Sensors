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

const MAX_HISTORY_POINTS = 120; // ~60 s at 2 Hz
const MAX_LED_LOG = 20;

let histCharts = {};
let histRefreshTimer = null;
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

function renderPassport(key) {
  return `<div id="pp-${key}-strip" class="hidden flex-wrap gap-1 px-1 pb-1"></div>`;
}

function _outputDotHtml(id, label, title, isError = false) {
  const base = isError
    ? 'w-2.5 h-2.5 rounded-full bg-base-300 transition-colors'
    : 'w-2.5 h-2.5 rounded-full bg-base-300 transition-colors';
  return `<div class="flex items-center gap-1.5" title="${title}">
    <span id="${id}" class="${base}"></span>
    <span class="text-xs font-mono opacity-40">${label}</span>
  </div>`;
}

function updatePortPassport(key, port) {
  initPortMeta(key);
  const m = portMeta[key];
  if (port.mode === 'io-link' && !m.onlineSince) m.onlineSince = new Date();
  recordPortRead(key);

  const hz = getUpdateRateHz(key);
  const chips = [];

  if (port.name && port.name !== port.label)
    chips.push(`<span class="badge badge-ghost badge-xs font-mono" title="Product name">${port.name}</span>`);
  if (port.vendor_id != null)
    chips.push(`<span class="badge badge-outline badge-xs font-mono opacity-60" title="Vendor ID">VID ${fmtId(port.vendor_id)}</span>`);
  if (port.device_id != null)
    chips.push(`<span class="badge badge-outline badge-xs font-mono opacity-60" title="Device ID">DID ${fmtId(port.device_id)}</span>`);
  if (port.serial)
    chips.push(`<span class="badge badge-outline badge-xs font-mono opacity-60" title="Serial">S/N ${port.serial}</span>`);
  if (port.master_cycle_time)
    chips.push(`<span class="badge badge-info badge-xs font-mono" title="IO-Link cycle time">${fmtCycleTime(port.master_cycle_time)}</span>`);
  if (hz)
    chips.push(`<span class="badge badge-success badge-xs font-mono" title="Update rate">${hz} Hz</span>`);
  if (port.source)
    chips.push(`<span class="badge badge-ghost badge-xs font-mono opacity-50" title="Data source">${port.source}</span>`);
  if (m.onlineSince)
    chips.push(`<span class="badge badge-ghost badge-xs opacity-40" title="Online since">since ${m.onlineSince.toLocaleTimeString()}</span>`);
  const pdinHex = port.pdin_hex || port.pdin || '';
  if (pdinHex)
    chips.push(`<span class="badge badge-ghost badge-xs font-mono opacity-30" title="Raw PDin">0x${pdinHex.toUpperCase()}</span>`);

  const strip = document.getElementById(`pp-${key}-strip`);
  if (strip) {
    strip.innerHTML = chips.join('');
    const hasChips = chips.length > 0;
    strip.classList.toggle('hidden', !hasChips);
    strip.classList.toggle('flex', hasChips);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page HTML
// ─────────────────────────────────────────────────────────────────────────────

export function renderHomePage() {
  return `
    <div class="hmi-homepage space-y-4">

      <!-- IO-Link Master Status -->
      <div id="mimic-master" class="mimic-component"></div>

      <!-- Live Sensor Mimics -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div id="mimic-photoelectric" class="mimic-component"></div>
        <div id="mimic-capacitive" class="mimic-component"></div>
        <div id="mimic-temperature" class="mimic-component"></div>
        <div id="mimic-led" class="mimic-component"></div>
      </div>

      <!-- Per-port detail sections -->
      <div class="space-y-5">

        <!-- ── Proximity (OMRON E2E-X16MB1T12) — was Photoelectric (Contrinex LTR-M18PA-PMS-603) ── -->
        <div class="space-y-1.5">
          <div class="flex items-center gap-3 px-1">
            <span class="badge badge-outline font-mono font-bold text-xs" id="detection-port-num">PORT —</span>
            <span class="text-sm font-semibold opacity-60" id="detection-port-label">Proximity Sensor</span>
            <div class="flex-1 h-px bg-base-300"></div>
          </div>
          ${renderPassport('photo')}
          <div class="px-1 text-xs font-mono opacity-30">OMRON E2E-X16MB1T12 · M18 Inductive · 16 mm · IO-Link V1.1</div>
          <div class="flex gap-5 px-1 items-center">
            ${_outputDotHtml('photo-out1-dot', 'OUT1',  'Primary switching output — metal object within sensing range')}
            ${_outputDotHtml('photo-err-dot',  'FAULT', 'Sensor error flag', true)}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body p-3">
                <span class="text-xs font-semibold opacity-50 uppercase tracking-wider">Detection History</span>
                <div class="h-24 mt-1.5"><canvas id="chart-detection-history"></canvas></div>
              </div>
            </div>
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body p-3">
                <span class="text-xs font-semibold opacity-50 uppercase tracking-wider">Cycle Counter</span>
                <div class="mt-2 space-y-2">
                  <div class="flex items-baseline gap-2">
                    <span class="text-2xl font-bold font-mono" id="cycle-count-display">0</span>
                    <span class="text-xs opacity-40">/ 1,000,000</span>
                  </div>
                  <progress id="cycle-progress" class="progress progress-success w-full h-1.5" value="0" max="1000000"></progress>
                  <div id="cycle-service-alert" class="hidden alert alert-warning py-1 px-2 text-xs">Service interval approaching</div>
                </div>
              </div>
            </div>
          </div>
          <div class="card bg-base-200 shadow-xl">
            <div class="card-body p-3 space-y-2">
              <span class="text-xs font-semibold opacity-50 uppercase tracking-wider block">IO-Link Diagnostic Alarms</span>
              <div class="space-y-1">

                <!-- Instability Alarm row -->
                <div>
                  <button type="button" class="w-full flex items-center gap-3 py-1.5 text-left group" onclick="this.nextElementSibling.classList.toggle('hidden'); this.querySelector('.prox-chevron').classList.toggle('rotate-180')">
                    <div id="prox-instab-indicator" class="w-3 h-3 rounded-full flex-shrink-0 bg-base-300 transition-colors duration-300"></div>
                    <span class="text-xs font-semibold flex-1" id="prox-instab-label">Instability Alarm — Off</span>
                    <svg class="prox-chevron w-3.5 h-3.5 opacity-40 flex-shrink-0 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                  <div class="hidden px-6 pb-2">
                    <p class="text-xs opacity-60 leading-relaxed">The target is at the edge of the sensor's sensing range, causing the output to switch on and off rapidly. This usually means the target is too far away or misaligned. Move the target closer to the sensor face, or reposition the sensor bracket.</p>
                  </div>
                </div>

                <div class="divider my-0"></div>

                <!-- Over-Approach Alarm row -->
                <div>
                  <button type="button" class="w-full flex items-center gap-3 py-1.5 text-left group" onclick="this.nextElementSibling.classList.toggle('hidden'); this.querySelector('.prox-chevron').classList.toggle('rotate-180')">
                    <div id="prox-overapproach-indicator" class="w-3 h-3 rounded-full flex-shrink-0 bg-base-300 transition-colors duration-300"></div>
                    <span class="text-xs font-semibold flex-1" id="prox-overapproach-label">Over-Approach Alarm — Off</span>
                    <svg class="prox-chevron w-3.5 h-3.5 opacity-40 flex-shrink-0 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                  <div class="hidden px-6 pb-2">
                    <p class="text-xs opacity-60 leading-relaxed">The target is excessively close to the sensor face — within the threshold set by the Excessive Proximity Distance parameter (default: 20% of nominal sensing distance). In high-vibration environments this risks mechanical contact and sensor damage. Increase the standoff distance between the target and sensor.</p>
                  </div>
                </div>

              </div>
              <div class="text-xs opacity-40 italic pt-1">These alarms require Diagnosis Mode 1, 2, or 3 to be enabled in the sensor configuration below.</div>
            </div>
          </div>
          <div id="signal-quality-section" class="card bg-base-200 shadow-xl hidden">
            <div class="card-body p-3">
              <span class="text-xs font-semibold opacity-50 uppercase tracking-wider">Signal Quality <span class="opacity-40 normal-case">· 1 min</span></span>
              <div class="h-20 mt-1.5"><canvas id="chart-signal-quality"></canvas></div>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body p-3">
                <span class="text-xs font-semibold opacity-50 uppercase tracking-wider">Proximity Detection History <span class="opacity-40 normal-case">· 1 hr</span></span>
                <div class="h-24 mt-1"><canvas id="chart-photo-det-history"></canvas></div>
              </div>
            </div>
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body p-3">
                <span class="text-xs font-semibold opacity-50 uppercase tracking-wider">Instability Alarm History <span class="opacity-40 normal-case">· 1 hr</span></span>
                <div class="h-24 mt-1"><canvas id="chart-photo-sq-history"></canvas></div>
              </div>
            </div>
          </div>
          <div class="card bg-base-200 shadow-xl" id="hmi-photo-isdu-card">
            <div class="card-body p-3">
              <span class="text-xs font-semibold opacity-50 uppercase tracking-wider mb-2 block">Device Identity &amp; Configuration (IO-Link V1.1)</span>
              <div id="hmi-photo-isdu-loading" class="text-xs opacity-30 font-mono">Waiting for sensor connection…</div>
              <div id="hmi-photo-isdu-content" class="hidden space-y-3">
                <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
                  <span class="opacity-50">Vendor ID</span><span class="font-bold" id="hmi-photo-vendor-id">—</span>
                  <span class="opacity-50">Device ID</span><span class="font-bold" id="hmi-photo-device-id">—</span>
                  <span class="opacity-50">IO-Link Rev</span><span class="font-bold" id="hmi-photo-iol-rev">—</span>
                  <span class="opacity-50">Product Name</span><span class="font-bold" id="hmi-photo-product-name">—</span>
                </div>
                <div class="divider my-1 text-xs opacity-40">Configuration</div>
                <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono items-center">
                  <span class="opacity-50">Output Logic (OUT1)</span>
                  <span class="font-bold" id="hmi-prox-output-logic">—</span>
                  <span class="opacity-50">Timer Mode</span>
                  <span class="font-bold" id="hmi-prox-timer-mode">—</span>
                  <span class="opacity-50">Timer Time</span>
                  <span class="font-bold" id="hmi-prox-timer-time">—</span>
                  <span class="opacity-50">Diagnosis Mode</span>
                  <span class="font-bold" id="hmi-prox-diag-mode">—</span>
                  <span class="opacity-50">Operating Hours</span>
                  <span class="font-bold" id="hmi-prox-op-hours">—</span>
                </div>
                <div class="flex gap-2 mt-1">
                  <button id="hmi-prox-isdu-refresh" class="btn btn-xs btn-outline">Refresh</button>
                  <span id="hmi-prox-isdu-status" class="text-xs opacity-50 self-center"></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Capacitive ── -->
        <div class="space-y-1.5">
          <div class="flex items-center gap-3 px-1">
            <span class="badge badge-outline font-mono font-bold text-xs" id="cap-port-num">PORT —</span>
            <span class="text-sm font-semibold opacity-60" id="cap-port-label">Capacitive Sensor</span>
            <div class="flex-1 h-px bg-base-300"></div>
          </div>
          ${renderPassport('cap')}
          <div class="px-1 text-xs font-mono opacity-30">RS PRO M18 capacitive · IP67</div>
          <div class="flex flex-wrap gap-5 px-1 items-center">
            ${_outputDotHtml('cap-so1-dot',  'SO1',  'Primary switching output 1 (main detection threshold)')}
            ${_outputDotHtml('cap-so2-dot',  'SO2',  'Primary switching output 2 (window comparator)')}
            ${_outputDotHtml('cap-ssc1-dot', 'SSC1', 'Secondary switching channel 1')}
            ${_outputDotHtml('cap-ssc2-dot', 'SSC2', 'Secondary switching channel 2')}
            <div class="ml-auto flex items-baseline gap-1 text-xs font-mono opacity-60">
              <span class="opacity-50">Analogue</span>
              <span class="font-bold" id="cap-analogue-live">0</span>
              <span class="opacity-30">/ 65535</span>
            </div>
            <div class="flex items-baseline gap-1 text-xs font-mono opacity-60">
              <span class="opacity-50">Δ</span>
              <span class="font-bold" id="cap-delta-display">0</span>
              <span class="opacity-30">det/poll</span>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body p-3">
                <span class="text-xs font-semibold opacity-50 uppercase tracking-wider">Detection History (SO1 + SO2)</span>
                <div class="h-24 mt-1.5"><canvas id="chart-cap-detection"></canvas></div>
              </div>
            </div>
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body p-3">
                <span class="text-xs font-semibold opacity-50 uppercase tracking-wider">Detection Count</span>
                <div class="mt-2 space-y-2">
                  <span class="text-2xl font-bold font-mono" id="cap-cycle-count-display">0</span>
                  <progress id="cap-cycle-progress" class="progress progress-info w-full h-1.5" value="0" max="1000000"></progress>
                </div>
              </div>
            </div>
          </div>
          <div class="card bg-base-200 shadow-xl">
            <div class="card-body p-3">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-semibold opacity-50 uppercase tracking-wider">Live Dielectric <span class="opacity-40 normal-case">· 1 min</span></span>
                <span class="text-xs opacity-30 font-mono">0–65535 · requires sensor teach-in to show non-zero</span>
              </div>
              <div class="h-20 mt-1"><canvas id="chart-cap-analogue"></canvas></div>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body p-3">
                <span class="text-xs font-semibold opacity-50 uppercase tracking-wider">Detection History <span class="opacity-40 normal-case">· 1 hr</span></span>
                <div class="h-24 mt-1"><canvas id="chart-cap-det-history"></canvas></div>
              </div>
            </div>
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body p-3">
                <span class="text-xs font-semibold opacity-50 uppercase tracking-wider">Dielectric History <span class="opacity-40 normal-case">· 1 hr</span></span>
                <div class="h-24 mt-1"><canvas id="chart-cap-ana-history"></canvas></div>
              </div>
            </div>
          </div>
          <div class="card bg-base-200 shadow-xl" id="hmi-cap-isdu-card">
            <div class="card-body p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold opacity-50 uppercase tracking-wider">Sensor Parameters (IODD)</span>
                <button class="btn btn-xs btn-ghost" id="hmi-cap-isdu-refresh">↻ Refresh</button>
              </div>
              <div id="hmi-cap-isdu-loading" class="text-xs opacity-30 font-mono">Waiting for sensor connection…</div>
              <div id="hmi-cap-isdu-content" class="hidden space-y-3">
                <div>
                  <div class="flex justify-between text-xs mb-1">
                    <span class="font-mono opacity-60">SSC1 SP1 — Sensitivity Threshold</span>
                    <span class="font-mono font-bold" id="hmi-cap-sp1-display">—</span>
                  </div>
                  <input type="range" id="hmi-cap-sp1-slider" class="range range-xs range-primary w-full" min="10" max="10000" step="10" value="1000">
                  <div class="flex justify-between text-xs opacity-30 font-mono mt-0.5">
                    <span>10 (max sensitive)</span><span>10000 (min sensitive)</span>
                  </div>
                  <button class="btn btn-xs btn-primary mt-1.5 w-full" id="hmi-cap-sp1-write">Apply SP1</button>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <div class="flex justify-between text-xs mb-0.5">
                      <span class="font-mono opacity-60">Quality of Teach</span>
                      <span class="font-mono font-bold" id="hmi-cap-qot-val">—</span>
                    </div>
                    <progress class="progress progress-info w-full h-1.5" id="hmi-cap-qot-bar" value="0" max="255"></progress>
                  </div>
                  <div>
                    <div class="flex justify-between text-xs mb-0.5">
                      <span class="font-mono opacity-60">Quality of Run</span>
                      <span class="font-mono font-bold" id="hmi-cap-qor-val">—</span>
                    </div>
                    <progress class="progress progress-success w-full h-1.5" id="hmi-cap-qor-bar" value="0" max="255"></progress>
                  </div>
                </div>
                <div class="flex gap-1.5 flex-wrap">
                  <button class="btn btn-xs btn-warning flex-1" id="hmi-cap-teach-start">▶ Teach Start</button>
                  <button class="btn btn-xs btn-success flex-1" id="hmi-cap-teach-stop">■ Teach Stop</button>
                  <button class="btn btn-xs btn-ghost flex-1" id="hmi-cap-teach-cancel">✕ Cancel</button>
                </div>
                <div class="text-xs font-mono opacity-40" id="hmi-cap-isdu-status"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Temperature ── -->
        <div class="space-y-1.5">
          <div class="flex items-center gap-3 px-1">
            <span class="badge badge-outline font-mono font-bold text-xs" id="temp-port-num">PORT —</span>
            <span class="text-sm font-semibold opacity-60" id="temp-port-label">Temperature Sensor</span>
            <div class="flex-1 h-px bg-base-300"></div>
          </div>
          ${renderPassport('temp')}
          <div class="px-1 text-xs font-mono opacity-30">IFM TV7105 · Pt100 · IP67</div>
          <div class="flex gap-5 px-1 items-center">
            ${_outputDotHtml('temp-out1-dot', 'OUT1', 'Switching output 1 (temperature threshold)')}
            ${_outputDotHtml('temp-out2-dot', 'OUT2', 'Switching output 2 (second threshold)')}
          </div>
          <div class="card bg-base-200 shadow-xl">
            <div class="card-body p-3">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-semibold opacity-50 uppercase tracking-wider">Live Trend <span class="opacity-40 normal-case">· 1 min</span></span>
                <div class="flex gap-3 text-xs font-mono">
                  <span><span class="opacity-40">Min </span><span class="font-bold" id="temp-stat-min">—</span></span>
                  <span><span class="opacity-40">Max </span><span class="font-bold" id="temp-stat-max">—</span></span>
                  <span><span class="opacity-40">Avg </span><span class="font-bold" id="temp-stat-avg">—</span></span>
                </div>
              </div>
              <div class="h-28"><canvas id="chart-temperature-trend"></canvas></div>
            </div>
          </div>
          <div class="card bg-base-200 shadow-xl">
            <div class="card-body p-3">
              <span class="text-xs font-semibold opacity-50 uppercase tracking-wider">History <span class="opacity-40 normal-case">· 1 hr</span></span>
              <div class="h-24 mt-1"><canvas id="chart-temp-history"></canvas></div>
            </div>
          </div>
          <div class="card bg-base-200 shadow-xl" id="hmi-temp-isdu-card">
            <div class="card-body p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold opacity-50 uppercase tracking-wider">Sensor Parameters (IODD)</span>
                <button class="btn btn-xs btn-ghost" id="hmi-temp-isdu-refresh">↻ Refresh</button>
              </div>
              <div id="hmi-temp-isdu-loading" class="text-xs opacity-30 font-mono">Waiting for sensor connection…</div>
              <div id="hmi-temp-isdu-content" class="hidden space-y-3">
                <div>
                  <div class="flex justify-between text-xs mb-1">
                    <span class="font-mono opacity-60">SP1 — Switch Point 1 (OUT1 trigger)</span>
                    <span class="font-mono font-bold" id="hmi-temp-sp1-display">—</span>
                  </div>
                  <input type="range" id="hmi-temp-sp1-slider" class="range range-xs range-error w-full" min="-498" max="1500" step="1" value="600">
                  <div class="flex justify-between text-xs opacity-30 font-mono mt-0.5">
                    <span>-49.8°C</span><span>150°C</span>
                  </div>
                  <button class="btn btn-xs btn-error mt-1.5 w-full" id="hmi-temp-sp1-write">Apply SP1</button>
                </div>
                <div>
                  <div class="flex justify-between text-xs mb-1">
                    <span class="font-mono opacity-60">SP2 — Switch Point 2 (OUT2 trigger)</span>
                    <span class="font-mono font-bold" id="hmi-temp-sp2-display">—</span>
                  </div>
                  <input type="range" id="hmi-temp-sp2-slider" class="range range-xs range-warning w-full" min="-498" max="1500" step="1" value="1200">
                  <div class="flex justify-between text-xs opacity-30 font-mono mt-0.5">
                    <span>-49.8°C</span><span>150°C</span>
                  </div>
                  <button class="btn btn-xs btn-warning mt-1.5 w-full" id="hmi-temp-sp2-write">Apply SP2</button>
                </div>
                <div class="flex items-center justify-between text-xs pt-1 border-t border-base-300">
                  <span class="font-mono opacity-60">Device Status</span>
                  <span class="badge badge-xs font-mono" id="hmi-temp-status-badge">—</span>
                </div>
                <div class="flex gap-1.5">
                  <button class="btn btn-xs btn-outline flex-1" id="hmi-temp-teach-sp1">Teach SP1</button>
                  <button class="btn btn-xs btn-outline flex-1" id="hmi-temp-teach-sp2">Teach SP2</button>
                  <button class="btn btn-xs btn-ghost flex-1" id="hmi-temp-factory-reset">Factory Reset</button>
                </div>
                <div class="text-xs font-mono opacity-40" id="hmi-temp-isdu-status"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Light Stack ── -->
        <div class="space-y-1.5">
          <div class="flex items-center gap-3 px-1">
            <span class="badge badge-outline font-mono font-bold text-xs" id="led-port-num">PORT —</span>
            <span class="text-sm font-semibold opacity-60" id="led-port-label">Light Stack</span>
            <div class="flex-1 h-px bg-base-300"></div>
          </div>
          ${renderPassport('led')}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body p-3">
                <span class="text-xs font-semibold opacity-50 uppercase tracking-wider mb-3 block">Current State</span>
                <div class="flex items-center gap-4">
                  <div id="led-color-dot" class="w-10 h-10 rounded-full border-2 border-base-content/20 flex-shrink-0 shadow-inner" style="background:#374151"></div>
                  <div>
                    <div class="font-bold font-mono text-xl leading-tight" id="led-state-color">—</div>
                    <div class="text-sm opacity-60 font-mono" id="led-state-animation">—</div>
                    <div class="text-xs opacity-40 font-mono" id="led-state-intensity">—</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body p-3">
                <span class="text-xs font-semibold opacity-50 uppercase tracking-wider">State Changes</span>
                <div class="mt-2 overflow-y-auto max-h-24 space-y-1" id="led-state-log-body">
                  <div class="text-xs opacity-40 font-mono">Waiting for data…</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Reset Data -->
      <div class="pt-4 pb-2 flex justify-center">
        <button id="btn-reset-data" class="btn btn-error btn-wide gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          Reset All Data
        </button>
      </div>

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
        <h3 class="font-bold text-lg">Proximity Sensor Configuration</h3>
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
    histCharts.temperature,
    histCharts.photoDetected,
    histCharts.photoSignalQuality,
    histCharts.capDetected,
    histCharts.capAnalogue,
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

  _hmiParamsLoaded.cap = false;
  _hmiParamsLoaded.temp = false;
  _hmiParamsLoaded.photo = false;

  initializeMimicComponents();
  initializeCharts();
  initHistoricalCharts();
  setupConfigModalHandlers();
  initHmiParams();

  if (detectionCycleCount > 0) updateCycleCounter(detectionCycleCount);
  if (capDetectionCycleCount > 0) updateCapCycleCounter(capDetectionCycleCount);

  // Fetch the last hour from the backend immediately, then refresh every 60 s
  fetchAndSeedHistory();
  histRefreshTimer = setInterval(() => { if (isHomePageActive) fetchAndSeedHistory(); }, 60_000);

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

  // Seed charts with any history preserved from before the page was left
  if (temperatureHistory.length)   updateChart(charts.temperature,    temperatureHistory);
  if (detectionHistory.length)     updateChart(charts.detectionHistory, detectionHistory);
  if (signalQualityHistory.length) updateChart(charts.signalQuality,   signalQualityHistory);
  if (capDetectionHistory.length)  updateChart(charts.capDetection,    capDetectionHistory);
  if (capAnalogueHistory.length)   updateChart(charts.capAnalogue,     capAnalogueHistory);
  if (tempCount > 0)               updateTempStats();
}

function makeHistOptions(colors, extraY = {}) {
  const opts = makeLineOptions(colors, extraY);
  opts.animation = false;
  opts.scales.x.ticks.maxTicksLimit = 6;
  return opts;
}

function initHistoricalCharts() {
  const colors = getChartColors();

  const tempHistCtx = document.getElementById('chart-temp-history');
  if (tempHistCtx) {
    histCharts.temperature = new Chart(tempHistCtx, {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Temperature (°C)', data: [], borderColor: colors.borderColor, backgroundColor: colors.backgroundColor, tension: 0.3, fill: true, pointRadius: 0 }] },
      options: makeHistOptions(colors),
    });
  }

  const photoDetHistCtx = document.getElementById('chart-photo-det-history');
  if (photoDetHistCtx) {
    histCharts.photoDetected = new Chart(photoDetHistCtx, {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Detected', data: [], borderColor: colors.borderColor, backgroundColor: colors.backgroundColor, stepped: 'before', fill: true, pointRadius: 0, tension: 0 }] },
      options: makeHistOptions(colors, { min: -0.1, max: 1.2, ticks: { color: colors.tickColor, stepSize: 1, callback: v => v === 1 ? 'ON' : v === 0 ? 'OFF' : '' } }),
    });
  }

  const photoSqHistCtx = document.getElementById('chart-photo-sq-history');
  if (photoSqHistCtx) {
    histCharts.photoSignalQuality = new Chart(photoSqHistCtx, {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Signal Quality (%)', data: [], borderColor: colors.amberBorder, backgroundColor: colors.amberBackground, tension: 0.3, fill: true, pointRadius: 0 }] },
      options: makeHistOptions(colors, { min: 0, max: 100, ticks: { color: colors.tickColor, callback: v => `${v}%` } }),
    });
  }

  const capDetHistCtx = document.getElementById('chart-cap-det-history');
  if (capDetHistCtx) {
    histCharts.capDetected = new Chart(capDetHistCtx, {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Detected', data: [], borderColor: colors.blueBorder, backgroundColor: colors.blueBackground, stepped: 'before', fill: true, pointRadius: 0, tension: 0 }] },
      options: makeHistOptions(colors, { min: -0.1, max: 1.2, ticks: { color: colors.tickColor, stepSize: 1, callback: v => v === 1 ? 'ON' : v === 0 ? 'OFF' : '' } }),
    });
  }

  const capAnaHistCtx = document.getElementById('chart-cap-ana-history');
  if (capAnaHistCtx) {
    histCharts.capAnalogue = new Chart(capAnaHistCtx, {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Dielectric Value', data: [], borderColor: colors.blueBorder, backgroundColor: colors.blueBackground, tension: 0.3, fill: true, pointRadius: 0 }] },
      options: makeHistOptions(colors, { min: 0 }),
    });
  }
}

function seedHistChart(chart, series) {
  if (!chart || !series) return;
  chart.data.labels = series.labels;
  chart.data.datasets[0].data = series.values;
  chart.update('none');
}

async function fetchAndSeedHistory() {
  try {
    const resp = await fetch(`${API_BASE}/api/io-link/history?minutes=60`);
    if (!resp.ok) return;
    const series = await resp.json();
    seedHistChart(histCharts.temperature,        series.temperature);
    seedHistChart(histCharts.photoDetected,       series.photo_detected);
    seedHistChart(histCharts.photoSignalQuality,  series.photo_signal_quality);
    seedHistChart(histCharts.capDetected,         series.cap_detected);
    seedHistChart(histCharts.capAnalogue,         series.cap_analogue);
  } catch (e) {
    console.warn('History fetch failed:', e);
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

  const resetDataBtn = document.getElementById('btn-reset-data');
  if (resetDataBtn) {
    resetDataBtn.addEventListener('click', resetAllData);
  }
}

async function resetAllData() {
  const btn = document.getElementById('btn-reset-data');
  if (btn) { btn.disabled = true; btn.textContent = 'Clearing…'; }

  // Clear backend CSV logs
  try {
    await fetch(`${API_BASE}/api/io-link/history`, { method: 'DELETE' });
  } catch (e) {
    console.warn('History clear failed:', e);
  }

  // Clear in-memory buffers and stats
  temperatureHistory.length = 0;
  tempMin = null; tempMax = null; tempSum = 0; tempCount = 0;
  detectionHistory.length = 0;
  signalQualityHistory.length = 0;
  capDetectionHistory.length = 0;
  capAnalogueHistory.length = 0;
  ledStateLog.length = 0;
  _lastLedState = null;
  portMeta = {};
  detectionCycleCount = 0;
  capDetectionCycleCount = 0;
  sessionStorage.removeItem('photoDetectionCycles');
  sessionStorage.removeItem('capDetectionCycles');

  // Clear all live charts
  [charts.temperature, charts.detectionHistory, charts.signalQuality,
   charts.capDetection, charts.capAnalogue].forEach(c => {
    if (!c) return;
    c.data.labels = [];
    c.data.datasets[0].data = [];
    c.update('none');
  });

  // Clear all history charts
  Object.values(histCharts).forEach(c => {
    if (!c) return;
    c.data.labels = [];
    c.data.datasets[0].data = [];
    c.update('none');
  });

  // Reset stat displays and counters
  updateTempStats();
  updateCycleCounter(0);
  updateCapCycleCounter(0);

  if (btn) { btn.disabled = false; btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> Reset All Data'; }
}

export function destroyHomePage() {
  console.log('Destroying HMI Homepage...');
  isHomePageActive = false;

  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (socket) { socket.close(); socket = null; }
  if (themeObserver) { themeObserver.disconnect(); themeObserver = null; }

  if (histRefreshTimer) { clearInterval(histRefreshTimer); histRefreshTimer = null; }

  Object.values(charts).forEach(c => { if (c) c.destroy(); });
  Object.values(histCharts).forEach(c => { if (c) c.destroy(); });
  charts = {};
  histCharts = {};
  mimicComponents = {};
  _hmiParamsLoaded.cap = false;
  _hmiParamsLoaded.temp = false;
  _hmiParamsLoaded.photo = false;
  // History buffers, stats, and portMeta are intentionally preserved so charts
  // re-populate immediately when the page is re-visited.
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

  const containerMap = { temperature: 'mimic-temperature', proximity: 'mimic-photoelectric', photoelectric: 'mimic-photoelectric', capacitive: 'mimic-capacitive', led: 'mimic-led' };
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
    _setOutputDot('temp-out1-dot', port.pdin_decoded?.out1 ?? null);
    _setOutputDot('temp-out2-dot', port.pdin_decoded?.out2 ?? null);
    updatePortPassport('temp', port);
    if (!_hmiParamsLoaded.temp) {
      _hmiParamsLoaded.temp = true;
      _loadHmiTempParams(port.port);
    }

  } else if (deviceType === 'proximity' && mimicComponents.photoelectric) {
    _setPortBadge('detection-port-num', 'detection-port-label', port);
    mimicComponents.photoelectric.update(port.pdin_decoded || {});

    const isDetected = port.pdin_decoded?.object_present || false;
    addToHistory(detectionHistory, isDetected ? 1 : 0);
    if (isDetected && !_lastDetectedState) {
      detectionCycleCount++;
      sessionStorage.setItem('photoDetectionCycles', String(detectionCycleCount));
    }
    _lastDetectedState = isDetected;
    updateChart(charts.detectionHistory, detectionHistory);
    updateCycleCounter(detectionCycleCount);

    _setOutputDot('photo-out1-dot', port.pdin_decoded?.object_present ?? null);
    _setOutputDot('photo-err-dot',  port.pdin_decoded?.error         ?? null, true);
    _updateProxAlarm('prox-instab-indicator',      'prox-instab-label',
                     port.pdin_decoded?.instability_alarm,   'Instability Alarm');
    _updateProxAlarm('prox-overapproach-indicator', 'prox-overapproach-label',
                     port.pdin_decoded?.over_approach_alarm, 'Over-Approach Alarm');

    updatePortPassport('photo', port);
    if (!_hmiParamsLoaded.photo) {
      _hmiParamsLoaded.photo = true;
      _loadHmiProximityParams(port.port);
    }

  } else if (deviceType === 'photoelectric' && mimicComponents.photoelectric) {
    // PHOTOELECTRIC FALLBACK — kept in case Contrinex LTR-M18PA-PMS-603 is re-fitted on port 1
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

    _setOutputDot('photo-out1-dot', port.pdin_decoded?.object_detected ?? null);
    _setOutputDot('photo-err-dot',  port.pdin_decoded?.error           ?? null, true);
    _updateProxAlarm('prox-instab-indicator',       'prox-instab-label',      false, 'Instability Alarm');
    _updateProxAlarm('prox-overapproach-indicator', 'prox-overapproach-label', false, 'Over-Approach Alarm');

    const sq = port.pdin_decoded?.signal_quality_percent ?? null;
    if (sq !== null) {
      document.getElementById('signal-quality-section')?.classList.remove('hidden');
      addToHistory(signalQualityHistory, sq);
      updateChart(charts.signalQuality, signalQualityHistory);
    }
    updatePortPassport('photo', port);
    if (!_hmiParamsLoaded.photo) {
      _hmiParamsLoaded.photo = true;
      _loadHmiPhotoParams(port.port);
    }

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

    _setOutputDot('cap-so1-dot',  port.pdin_decoded?.so1  ?? null);
    _setOutputDot('cap-so2-dot',  port.pdin_decoded?.so2  ?? null);
    _setOutputDot('cap-ssc1-dot', port.pdin_decoded?.ssc1 ?? null);
    _setOutputDot('cap-ssc2-dot', port.pdin_decoded?.ssc2 ?? null);
    const delta = document.getElementById('cap-delta-display');
    if (delta) delta.textContent = port.detection_counter_delta ?? 0;

    const analogue = port.pdin_decoded?.analogue_value ?? null;
    const analogueLive = document.getElementById('cap-analogue-live');
    if (analogueLive && analogue !== null) analogueLive.textContent = analogue;
    if (analogue !== null) {
      addToHistory(capAnalogueHistory, analogue);
      updateChart(charts.capAnalogue, capAnalogueHistory);
    }
    updatePortPassport('cap', port);
    if (!_hmiParamsLoaded.cap) {
      _hmiParamsLoaded.cap = true;
      _loadHmiCapParams(port.port);
    }

  } else if (deviceType === 'led' && mimicComponents.led) {
    _setPortBadge('led-port-num', 'led-port-label', port);
    mimicComponents.led.update(port.pdout_decoded || {});
    updateLedStatePanel(port.pdout_decoded || {});
    updatePortPassport('led', port);
  }
}

function _updateProxAlarm(indicatorId, labelId, active, alarmName) {
  const dot   = document.getElementById(indicatorId);
  const label = document.getElementById(labelId);
  if (dot)   dot.className   = `mt-0.5 w-3 h-3 rounded-full flex-shrink-0 transition-colors duration-300 ${active ? 'bg-warning animate-pulse' : 'bg-base-300'}`;
  if (label) label.textContent = active ? `${alarmName} — Active` : `${alarmName} — Off`;
}

function _setOutputDot(id, active, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  if (active == null) { el.className = 'w-2.5 h-2.5 rounded-full bg-base-300/50 transition-colors'; return; }
  if (isError)
    el.className = `w-2.5 h-2.5 rounded-full transition-colors ${active ? 'bg-error animate-pulse' : 'bg-base-300'}`;
  else
    el.className = `w-2.5 h-2.5 rounded-full transition-colors ${active ? 'bg-success' : 'bg-base-300'}`;
}

const _sectionPortNum = {}; // badge-id -> actual port number

// ── HMI ISDU param state ──────────────────────────────────────────────────────
const _hmiParamsLoaded = { cap: false, temp: false, photo: false };

async function _hmiIsduRead(portNum, index, subindex, dtype, scale = 1.0) {
  const base = window.IO_LINK_API_BASE || window.location.origin;
  try {
    const r = await fetch(`${base}/api/io-link/port/${portNum}/parameter/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index, subindex, dtype, scale }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j.success ? j.value : null;
  } catch { return null; }
}

async function _hmiIsduWrite(portNum, index, subindex, value, dtype, scale = 1.0, statusId) {
  const base = window.IO_LINK_API_BASE || window.location.origin;
  const statusEl = statusId ? document.getElementById(statusId) : null;
  if (statusEl) statusEl.textContent = 'Writing…';
  try {
    const r = await fetch(`${base}/api/io-link/port/${portNum}/parameter/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index, subindex, value, dtype, scale }),
    });
    const j = await r.json();
    if (statusEl) {
      statusEl.textContent = j.success ? '✓ Written' : `✗ Failed: ${j.detail || 'error'}`;
      setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
    }
    return j.success;
  } catch (e) {
    if (statusEl) { statusEl.textContent = `✗ ${e.message}`; setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000); }
    return false;
  }
}

async function _hmiIsduCommand(portNum, cmd, statusId) {
  const base = window.IO_LINK_API_BASE || window.location.origin;
  const statusEl = statusId ? document.getElementById(statusId) : null;
  if (statusEl) statusEl.textContent = `Sending ${cmd}…`;
  try {
    const r = await fetch(`${base}/api/io-link/port/${portNum}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd }),
    });
    const j = await r.json();
    if (statusEl) {
      statusEl.textContent = j.success ? '✓ Done' : `✗ Failed`;
      setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
    }
    return j.success;
  } catch (e) {
    if (statusEl) { statusEl.textContent = `✗ ${e.message}`; setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000); }
    return false;
  }
}

async function _loadHmiCapParams(portNum) {
  const loading = document.getElementById('hmi-cap-isdu-loading');
  const content = document.getElementById('hmi-cap-isdu-content');
  if (!loading || !content) return;
  loading.textContent = 'Loading…';

  const [sp1, qot, qor] = await Promise.all([
    _hmiIsduRead(portNum, 60, 1, 'int16'),
    _hmiIsduRead(portNum, 75, 0, 'uint8'),
    _hmiIsduRead(portNum, 76, 0, 'uint8'),
  ]);

  loading.classList.add('hidden');
  content.classList.remove('hidden');

  if (sp1 !== null) {
    const sp1Slider = document.getElementById('hmi-cap-sp1-slider');
    const sp1Disp = document.getElementById('hmi-cap-sp1-display');
    if (sp1Slider) sp1Slider.value = sp1;
    if (sp1Disp) sp1Disp.textContent = sp1;
  }
  if (qot !== null) {
    const bar = document.getElementById('hmi-cap-qot-bar');
    const val = document.getElementById('hmi-cap-qot-val');
    if (bar) bar.value = qot;
    if (val) val.textContent = qot;
  }
  if (qor !== null) {
    const bar = document.getElementById('hmi-cap-qor-bar');
    const val = document.getElementById('hmi-cap-qor-val');
    if (bar) bar.value = qor;
    if (val) val.textContent = qor;
  }
}

async function _loadHmiTempParams(portNum) {
  const loading = document.getElementById('hmi-temp-isdu-loading');
  const content = document.getElementById('hmi-temp-isdu-content');
  if (!loading || !content) return;
  loading.textContent = 'Loading…';

  const STATUS_ENUM = { 0: 'OK', 1: 'Maintenance', 2: 'Out-of-spec', 3: 'Func check', 4: 'Failure' };

  const [sp1, sp2, status] = await Promise.all([
    _hmiIsduRead(portNum, 583, 0, 'int16', 0.1),
    _hmiIsduRead(portNum, 593, 0, 'int16', 0.1),
    _hmiIsduRead(portNum, 36, 0, 'uint8'),
  ]);

  loading.classList.add('hidden');
  content.classList.remove('hidden');

  if (sp1 !== null) {
    const rawInt = Math.round(sp1 * 10);
    const slider = document.getElementById('hmi-temp-sp1-slider');
    const disp = document.getElementById('hmi-temp-sp1-display');
    if (slider) slider.value = rawInt;
    if (disp) disp.textContent = `${sp1.toFixed(1)} °C`;
  }
  if (sp2 !== null) {
    const rawInt = Math.round(sp2 * 10);
    const slider = document.getElementById('hmi-temp-sp2-slider');
    const disp = document.getElementById('hmi-temp-sp2-display');
    if (slider) slider.value = rawInt;
    if (disp) disp.textContent = `${sp2.toFixed(1)} °C`;
  }
  if (status !== null) {
    const badge = document.getElementById('hmi-temp-status-badge');
    if (badge) {
      badge.textContent = STATUS_ENUM[status] ?? `Code ${status}`;
      badge.className = `badge badge-xs font-mono ${status === 0 ? 'badge-success' : 'badge-error'}`;
    }
  }
}

async function _loadHmiProximityParams(portNum) {
  const loading = document.getElementById('hmi-photo-isdu-loading');
  const content = document.getElementById('hmi-photo-isdu-content');
  if (!loading || !content) return;
  loading.textContent = 'Loading…';

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; };

  const OUTPUT_LOGIC = { 0: 'NO — Normally Open', 1: 'NC — Normally Closed' };
  const TIMER_MODE   = { 0: 'Disabled', 1: 'ON Delay', 2: 'OFF Delay', 3: 'One Shot' };
  const DIAG_MODE    = { 0: 'Disabled', 1: 'Mode 1 — Instab + Over-Approach', 2: 'Mode 2 — Instability', 3: 'Mode 3 — Over-Approach' };

  // Read identity from IO-Link page 0 (standard block)
  const base = window.IO_LINK_API_BASE || window.location.origin;
  try {
    const r = await fetch(`${base}/api/io-link/port/${portNum}/parameter/read`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: 0, subindex: 0, dtype: 'string', scale: 1 }),
    });
    const j = await r.json();
    if (j.success && j.raw_hex) {
      const b = j.raw_hex.match(/.{2}/g).map(h => parseInt(h, 16));
      const vendorId = ((b[6] << 8) | b[7]);
      const deviceId = ((b[8] << 16) | (b[9] << 8) | b[10]);
      const revId = b[3] ? `1.${b[3] & 0x0F}` : '1.0';
      set('hmi-photo-vendor-id', `${vendorId} (0x${vendorId.toString(16).toUpperCase().padStart(4,'0')})`);
      set('hmi-photo-device-id', `${deviceId} (0x${deviceId.toString(16).toUpperCase().padStart(6,'0')})`);
      set('hmi-photo-iol-rev', `V${revId}`);
    }
  } catch { /* identity block failed */ }

  // Product name — ISDU index 18
  const productName = await _hmiIsduRead(portNum, 18, 0, 'string');
  set('hmi-photo-product-name', productName);

  // Output logic — index 61/sub1
  const outLogic = await _hmiIsduRead(portNum, 61, 1, 'uint8');
  set('hmi-prox-output-logic', outLogic != null ? (OUTPUT_LOGIC[outLogic] ?? `${outLogic}`) : null);

  // Timer mode — index 65/sub1
  const timerMode = await _hmiIsduRead(portNum, 65, 1, 'uint8');
  set('hmi-prox-timer-mode', timerMode != null ? (TIMER_MODE[timerMode] ?? `${timerMode}`) : null);

  // Timer time — index 65/sub2
  const timerTime = await _hmiIsduRead(portNum, 65, 2, 'uint16');
  set('hmi-prox-timer-time', timerTime != null ? `${timerTime} ms` : null);

  // Diagnosis mode — index 163
  const diagMode = await _hmiIsduRead(portNum, 163, 0, 'uint8');
  set('hmi-prox-diag-mode', diagMode != null ? (DIAG_MODE[diagMode] ?? `${diagMode}`) : null);

  // Operating hours — index 160/sub1 (24-bit record; read as uint32, upper byte ignored)
  const opHours = await _hmiIsduRead(portNum, 160, 1, 'uint32');
  set('hmi-prox-op-hours', opHours != null ? `${opHours} h` : null);

  loading.classList.add('hidden');
  content.classList.remove('hidden');
}

// _loadHmiPhotoParams — COMMENTED OUT: was used for Contrinex LTR-M18PA-PMS-603 (IO-Link 1.0).
// Re-enable if the photoelectric sensor is re-fitted on port 1 and restore the call in processPortData.
/*
async function _loadHmiPhotoParams(portNum) {
  const loading = document.getElementById('hmi-photo-isdu-loading');
  const content = document.getElementById('hmi-photo-isdu-content');
  if (!loading || !content) return;
  loading.textContent = 'Loading…';
  loading.classList.add('hidden');
  content.classList.remove('hidden');
  const base = window.IO_LINK_API_BASE || window.location.origin;
  try {
    const r = await fetch(`${base}/api/io-link/port/${portNum}/parameter/read`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: 0, subindex: 0, dtype: 'string', scale: 1 }),
    });
    const j = await r.json();
    if (j.success && j.raw_hex) {
      const b = j.raw_hex.match(/.{2}/g).map(h => parseInt(h, 16));
      const vendorId = ((b[6] << 8) | b[7]);
      const deviceId = ((b[8] << 16) | (b[9] << 8) | b[10]);
      const revId = b[3] ? `1.${b[3] & 0x0F}` : '1.0';
      const pdinLen = b[4];
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set('hmi-photo-vendor-id', `${vendorId} (0x${vendorId.toString(16).toUpperCase().padStart(4,'0')})`);
      set('hmi-photo-device-id', `${deviceId} (0x${deviceId.toString(16).toUpperCase().padStart(6,'0')})`);
      set('hmi-photo-iol-rev', revId);
      set('hmi-photo-pdin-len', `${pdinLen} bytes`);
    }
  } catch { }
}
*/

function initHmiParams() {
  // Cap SP1 slider live display
  const capSlider = document.getElementById('hmi-cap-sp1-slider');
  if (capSlider) {
    capSlider.addEventListener('input', () => {
      const disp = document.getElementById('hmi-cap-sp1-display');
      if (disp) disp.textContent = capSlider.value;
    });
  }

  // Temp SP1/SP2 slider live display
  const tempSp1Slider = document.getElementById('hmi-temp-sp1-slider');
  if (tempSp1Slider) {
    tempSp1Slider.addEventListener('input', () => {
      const disp = document.getElementById('hmi-temp-sp1-display');
      if (disp) disp.textContent = `${(+tempSp1Slider.value / 10).toFixed(1)} °C`;
    });
  }
  const tempSp2Slider = document.getElementById('hmi-temp-sp2-slider');
  if (tempSp2Slider) {
    tempSp2Slider.addEventListener('input', () => {
      const disp = document.getElementById('hmi-temp-sp2-display');
      if (disp) disp.textContent = `${(+tempSp2Slider.value / 10).toFixed(1)} °C`;
    });
  }

  // Proximity refresh
  document.getElementById('hmi-prox-isdu-refresh')?.addEventListener('click', () => {
    const p = _sectionPortNum['detection-port-num'];
    if (p) _loadHmiProximityParams(p);
  });

  // Cap refresh
  document.getElementById('hmi-cap-isdu-refresh')?.addEventListener('click', () => {
    const p = _sectionPortNum['cap-port-num'];
    if (p) _loadHmiCapParams(p);
  });

  // Cap SP1 write
  document.getElementById('hmi-cap-sp1-write')?.addEventListener('click', async () => {
    const p = _sectionPortNum['cap-port-num'];
    if (!p) return;
    const val = parseInt(document.getElementById('hmi-cap-sp1-slider')?.value ?? '1000', 10);
    await _hmiIsduWrite(p, 60, 1, val, 'int16', 1.0, 'hmi-cap-isdu-status');
  });

  // Cap teach buttons
  document.getElementById('hmi-cap-teach-start')?.addEventListener('click', async () => {
    const p = _sectionPortNum['cap-port-num'];
    if (p) await _hmiIsduCommand(p, 'teach_sp1_start', 'hmi-cap-isdu-status');
  });
  document.getElementById('hmi-cap-teach-stop')?.addEventListener('click', async () => {
    const p = _sectionPortNum['cap-port-num'];
    if (p) {
      await _hmiIsduCommand(p, 'teach_sp1_stop', 'hmi-cap-isdu-status');
      setTimeout(() => _loadHmiCapParams(p), 1500);
    }
  });
  document.getElementById('hmi-cap-teach-cancel')?.addEventListener('click', async () => {
    const p = _sectionPortNum['cap-port-num'];
    if (p) await _hmiIsduCommand(p, 'teach_cancel', 'hmi-cap-isdu-status');
  });

  // Temp refresh
  document.getElementById('hmi-temp-isdu-refresh')?.addEventListener('click', () => {
    const p = _sectionPortNum['temp-port-num'];
    if (p) _loadHmiTempParams(p);
  });

  // Temp SP1 write
  document.getElementById('hmi-temp-sp1-write')?.addEventListener('click', async () => {
    const p = _sectionPortNum['temp-port-num'];
    if (!p) return;
    const rawInt = parseInt(document.getElementById('hmi-temp-sp1-slider')?.value ?? '600', 10);
    const degC = rawInt / 10;
    await _hmiIsduWrite(p, 583, 0, degC, 'int16', 0.1, 'hmi-temp-isdu-status');
  });

  // Temp SP2 write
  document.getElementById('hmi-temp-sp2-write')?.addEventListener('click', async () => {
    const p = _sectionPortNum['temp-port-num'];
    if (!p) return;
    const rawInt = parseInt(document.getElementById('hmi-temp-sp2-slider')?.value ?? '1200', 10);
    const degC = rawInt / 10;
    await _hmiIsduWrite(p, 593, 0, degC, 'int16', 0.1, 'hmi-temp-isdu-status');
  });

  // Temp teach / factory reset commands
  document.getElementById('hmi-temp-teach-sp1')?.addEventListener('click', async () => {
    const p = _sectionPortNum['temp-port-num'];
    if (p) { await _hmiIsduCommand(p, 'teach_sp1', 'hmi-temp-isdu-status'); setTimeout(() => _loadHmiTempParams(p), 1500); }
  });
  document.getElementById('hmi-temp-teach-sp2')?.addEventListener('click', async () => {
    const p = _sectionPortNum['temp-port-num'];
    if (p) { await _hmiIsduCommand(p, 'teach_sp2', 'hmi-temp-isdu-status'); setTimeout(() => _loadHmiTempParams(p), 1500); }
  });
  document.getElementById('hmi-temp-factory-reset')?.addEventListener('click', async () => {
    const p = _sectionPortNum['temp-port-num'];
    if (p && confirm('Factory reset the TV7105? This restores all defaults.')) {
      await _hmiIsduCommand(p, 'factory_reset', 'hmi-temp-isdu-status');
    }
  });

  // Photo — identity-only panel, no write controls needed
}

function _setPortBadge(numId, labelId, port) {
  const numEl = document.getElementById(numId);
  const lblEl = document.getElementById(labelId);
  if (numEl) numEl.textContent = `PORT ${port.port}`;
  if (lblEl) lblEl.textContent = port.label || port.name || '';

  if (_sectionPortNum[numId] !== port.port) {
    _sectionPortNum[numId] = port.port;
    _sortSectionsByPort();
  }
}

function _sortSectionsByPort() {
  const container = document.querySelector('.hmi-homepage .space-y-5');
  if (!container) return;
  const badgeIds = ['temp-port-num', 'cap-port-num', 'detection-port-num', 'led-port-num'];
  const sections = Array.from(container.children).map(el => {
    const badge = badgeIds.find(id => el.querySelector(`#${id}`));
    return { el, port: badge ? (_sectionPortNum[badge] ?? 99) : 99 };
  });
  sections.sort((a, b) => a.port - b.port);
  sections.forEach(({ el }) => container.appendChild(el));
}

function getDeviceType(port) {
  const t = port.device_type || '';
  if (t === 'proximity')      return 'proximity';
  if (t === 'photo_electric') return 'photoelectric';   // kept for fallback if sensor is swapped back
  if (t === 'temperature')    return 'temperature';
  if (t === 'status_led')     return 'led';
  if (t === 'capacitive')     return 'capacitive';

  const n = (port.name || '').toUpperCase();
  if (n.includes('TEMP') || n.includes('TN') || n.includes('TR'))          return 'temperature';
  if (n.startsWith('E2E') || n.includes('PROX') || n.includes('INDUCTIVE')) return 'proximity';
  if (n.includes('PHOTO') || n.includes('O5D') || n.includes('O2D'))       return 'photoelectric';
  if (n.includes('CAPACITIVE') || n.includes('23772'))                      return 'capacitive';
  if (n.includes('LED') || n.includes('CL50') || n.includes('LIGHT'))      return 'led';
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
  const body = document.getElementById('led-state-log-body');
  if (!body) return;
  if (!ledStateLog.length) {
    body.innerHTML = '<div class="text-xs opacity-40 font-mono">No changes yet</div>';
    return;
  }
  body.innerHTML = ledStateLog.map(e => {
    const dotStyle = `display:inline-block;width:7px;height:7px;border-radius:50%;background:${ledColorToCss(e.color)};flex-shrink:0;`;
    return `<div class="flex items-center gap-1.5 text-xs font-mono">
      <span style="${dotStyle}"></span>
      <span class="opacity-40">${e.time}</span>
      <span class="font-semibold">${e.color}</span>
      <span class="opacity-30">·</span>
      <span class="opacity-70">${e.animation}</span>
    </div>`;
  }).join('');
}
