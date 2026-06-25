/**
 * CP3723: Maintenance on Smart Sensors
 * 7 worksheets with embedded live sensor charts, indicators, sliders, and task progress.
 */
import { markVisited } from './progress-page.js';

import Chart from 'chart.js/auto';

// ── Live data infrastructure ──────────────────────────────────────────────────
function getWsBase() {
  const base = window.IO_LINK_API_BASE || window.location.origin;
  return base.replace(/^http/, 'ws');
}

let _wsLive = null;
let _wsCallback = null;
let _wsReconnectTimer = null;
const _activeCharts = {};
let _canvasAnimCancellers = [];
let _ws3FaultCleanup = null; // fires on navigation away if fault was injected but not corrected
let _ws3LightCleanup = null; // restores CL50 to default on navigation away from WS3

function startLiveData(callback) {
  stopLiveData();
  _wsCallback = callback;
  _openSocket();
}

function _openSocket() {
  try {
    _wsLive = new WebSocket(`${getWsBase()}/ws`);
    _wsLive.onmessage = e => {
      try { if (_wsCallback) _wsCallback(JSON.parse(e.data)); } catch {}
    };
    _wsLive.onclose = () => {
      _wsLive = null;
      if (_wsCallback) {
        clearTimeout(_wsReconnectTimer);
        _wsReconnectTimer = setTimeout(_openSocket, 3000);
      }
    };
  } catch {}
}

function stopLiveData() {
  _wsCallback = null;
  clearTimeout(_wsReconnectTimer);
  if (_wsLive) { try { _wsLive.close(); } catch {} _wsLive = null; }
  Object.keys(_activeCharts).forEach(k => {
    try { _activeCharts[k].destroy(); } catch {}
    delete _activeCharts[k];
  });
  if (_ws3FaultCleanup) { _ws3FaultCleanup(); _ws3FaultCleanup = null; }
  if (_ws3LightCleanup) { _ws3LightCleanup(); _ws3LightCleanup = null; }
  if (_ws4FaultCleanup) { _ws4FaultCleanup(); _ws4FaultCleanup = null; }
  if (_ws4LightCleanup) { _ws4LightCleanup(); _ws4LightCleanup = null; }
  if (_ws5LightCleanup) { _ws5LightCleanup(); _ws5LightCleanup = null; }
  if (_ws5CalCleanup) { _ws5CalCleanup(); _ws5CalCleanup = null; }
  if (_ws6AnimCleanup) { _ws6AnimCleanup(); _ws6AnimCleanup = null; }
  if (_ws6MsCleanup) { _ws6MsCleanup(); _ws6MsCleanup = null; }
  if (_ws7MsCleanup) { _ws7MsCleanup(); _ws7MsCleanup = null; }
}

function makeChart(canvasId, type, datasets, yMin, yMax, yLabel) {
  if (_activeCharts[canvasId]) { try { _activeCharts[canvasId].destroy(); } catch {} }
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const chart = new Chart(canvas, {
    type,
    data: { labels: Array(60).fill(''), datasets },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false },
        y: {
          min: yMin, max: yMax,
          ticks: { font: { size: 10 }, color: 'rgba(128,128,128,0.7)',
            callback: v => yLabel ? `${v}${yLabel}` : v },
          grid: { color: 'rgba(128,128,128,0.1)' }
        }
      }
    }
  });
  _activeCharts[canvasId] = chart;
  return chart;
}

function pushToChart(chart, value) {
  if (!chart) return;
  chart.data.labels.shift();
  chart.data.labels.push('');
  chart.data.datasets[0].data.shift();
  chart.data.datasets[0].data.push(value);
  chart.update('none');
}

function setLiveStatus(elId, connected) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = connected ? 'LIVE' : 'OFFLINE';
  el.className = connected
    ? 'badge badge-xs badge-success font-mono'
    : 'badge badge-xs badge-ghost font-mono';
}

function getPort(data, portNum) {
  if (!data || !Array.isArray(data.ports)) return null;
  return data.ports.find(p => p.port === portNum) || null;
}

// ── ISDU parameter helpers ────────────────────────────────────────────────────
function _paramBase() { return window.IO_LINK_API_BASE || window.location.origin; }

async function isduRead(port, index, subindex, dtype, scale) {
  try {
    const r = await fetch(`${_paramBase()}/api/io-link/port/${port}/parameter/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index, subindex, dtype, scale }),
      signal: AbortSignal.timeout(8000)
    });
    const d = await r.json();
    return d.success ? d.value : null;
  } catch { return null; }
}

async function isduWrite(port, index, subindex, value, dtype, scale, statusElId) {
  const el = statusElId ? document.getElementById(statusElId) : null;
  if (el) el.textContent = '…';
  try {
    const r = await fetch(`${_paramBase()}/api/io-link/port/${port}/parameter/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index, subindex, dtype, scale, value }),
      signal: AbortSignal.timeout(8000)
    });
    const d = await r.json();
    if (el) { el.textContent = d.success ? '✓ written' : `✗ ${d.error || 'failed'}`; el.className = `text-xs ${d.success ? 'text-success' : 'text-error'}`; }
    return d.success;
  } catch (e) {
    if (el) { el.textContent = '✗ timeout'; el.className = 'text-xs text-error'; }
    return false;
  }
}

async function isduCommand(port, cmd, statusElId) {
  const el = statusElId ? document.getElementById(statusElId) : null;
  if (el) el.textContent = '…';
  try {
    const r = await fetch(`${_paramBase()}/api/io-link/port/${port}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd }),
      signal: AbortSignal.timeout(8000)
    });
    const d = await r.json();
    if (el) { el.textContent = d.success ? `✓ ${d.label}` : `✗ ${d.error || 'failed'}`; el.className = `text-xs ${d.success ? 'text-success' : 'text-error'}`; }
    return d.success;
  } catch (e) {
    if (el) { el.textContent = '✗ timeout'; el.className = 'text-xs text-error'; }
    return false;
  }
}

// ── Worksheets data ───────────────────────────────────────────────────────────
const WORKSHEETS = [
  {
    id: 1,
    title: 'Meet Your Kit',
    shortDesc: 'What\'s on the bench and how it fits together.',
    estimatedTime: 'About 10 min',
    whyItMatters: 'Before you touch anything, you need to know what you\'re looking at. This sheet helps you name every part, find it on the bench, and see it working live on the screen.',
    relatedDashboard: 'Dashboard: all ports',
    prerequisites: '',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed text-base">In front of you is a real sensor kit used in factories. Your job today is simple — find each part, tick it off, and see it working live on screen.</p>

      <div class="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content">🔍 Find each item on the bench — tick it when you can see it:</p>
        <div class="space-y-2 text-sm" id="kit-checklist">
          <label class="kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0">
            <span class="kit-text"><strong>IO-Link Master (IFM AL1350)</strong> — the orange box with numbered ports along the side. This is the hub. Everything else plugs into it.</span></label>
          <label class="kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0">
            <span class="kit-text"><strong>Port 1 — Proximity Sensor (Omron E2E-X16MB1T12)</strong> — the M18 barrel with a flat sensing face. Creates an electromagnetic field and detects when a metal object enters it — no contact, no light beam needed.</span></label>
          <label class="kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0">
            <span class="kit-text"><strong>Port 2 — Capacitive Sensor</strong> — the larger white M18 cylinder. Detects materials like liquid, powder, or plastic — even through a container wall.</span></label>
          <label class="kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0">
            <span class="kit-text"><strong>Port 3 — Temperature Sensor</strong> — reads the temperature and sends back a live number in °C.</span></label>
          <label class="kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0">
            <span class="kit-text"><strong>Port 4 — Light Stack</strong> — the tall tower with coloured lights. Shows machine status at a glance from across the factory.</span></label>
          <label class="kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0">
            <span class="kit-text"><strong>Edge Device (Raspberry Pi)</strong> — small green circuit board in a case, usually mounted nearby. Collects sensor data, runs the comms, and serves up this dashboard.</span></label>
          <label class="kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0">
            <span class="kit-text"><strong>This screen</strong> — the live dashboard. Everything the sensors say ends up here.</span></label>
        </div>
      </div>

      <!-- Kit diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">How it all connects</p>
        <svg viewBox="0 0 570 205" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">

          <!-- Sensor boxes -->
          <rect x="2"   y="24"  width="124" height="32" rx="5" fill="#3b82f6"/>
          <text x="64"  y="37"  text-anchor="middle" fill="white" font-size="10" font-weight="600">Proximity (E2E)</text>
          <text x="64"  y="49"  text-anchor="middle" fill="#bfdbfe" font-size="8">Port 1 · IO-Link V1.1</text>

          <rect x="2"   y="64"  width="124" height="32" rx="5" fill="#7c3aed"/>
          <text x="64"  y="77"  text-anchor="middle" fill="white" font-size="10" font-weight="600">Capacitive</text>
          <text x="64"  y="89"  text-anchor="middle" fill="#ddd6fe" font-size="8">Port 2 · IO-Link</text>

          <rect x="2"   y="104" width="124" height="32" rx="5" fill="#d97706"/>
          <text x="64"  y="117" text-anchor="middle" fill="white" font-size="10" font-weight="600">Temperature</text>
          <text x="64"  y="129" text-anchor="middle" fill="#fde68a" font-size="8">Port 3 · IO-Link</text>

          <rect x="2"   y="144" width="124" height="32" rx="5" fill="#0d9488"/>
          <text x="64"  y="157" text-anchor="middle" fill="white" font-size="10" font-weight="600">Light Stack</text>
          <text x="64"  y="169" text-anchor="middle" fill="#99f6e4" font-size="8">Port 4 · IO-Link</text>

          <!-- IO-Link cables to master -->
          <line x1="126" y1="40"  x2="152" y2="40"  stroke="#94a3b8" stroke-width="2"/>
          <line x1="126" y1="80"  x2="152" y2="80"  stroke="#94a3b8" stroke-width="2"/>
          <line x1="126" y1="120" x2="152" y2="120" stroke="#94a3b8" stroke-width="2"/>
          <line x1="126" y1="160" x2="152" y2="160" stroke="#94a3b8" stroke-width="2"/>

          <!-- IO-Link Master -->
          <rect x="150" y="10" width="112" height="182" rx="8" fill="#ea580c"/>
          <!-- Port sockets on left edge -->
          <rect x="152" y="33" width="8" height="14" rx="2" fill="#9a3412"/>
          <rect x="152" y="73" width="8" height="14" rx="2" fill="#9a3412"/>
          <rect x="152" y="113" width="8" height="14" rx="2" fill="#9a3412"/>
          <rect x="152" y="153" width="8" height="14" rx="2" fill="#9a3412"/>
          <text x="216" y="90"  text-anchor="middle" fill="white" font-size="12" font-weight="700">IO-Link</text>
          <text x="216" y="106" text-anchor="middle" fill="white" font-size="12" font-weight="700">Master</text>
          <text x="216" y="122" text-anchor="middle" fill="#fed7aa" font-size="8">IFM AL1350</text>

          <!-- Ethernet -->
          <line x1="262" y1="100" x2="320" y2="100" stroke="#64748b" stroke-width="2.5" stroke-dasharray="6,3"/>
          <polygon points="320,96 320,104 328,100" fill="#64748b"/>
          <text x="291" y="92" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">Ethernet</text>

          <!-- Raspberry Pi -->
          <rect x="328" y="62" width="100" height="76" rx="8" fill="#15803d"/>
          <text x="378" y="95"  text-anchor="middle" fill="white" font-size="11" font-weight="700">Raspberry</text>
          <text x="378" y="110" text-anchor="middle" fill="white" font-size="11" font-weight="700">Pi</text>
          <text x="378" y="126" text-anchor="middle" fill="#bbf7d0" font-size="8">Edge Device</text>

          <!-- HDMI -->
          <line x1="428" y1="100" x2="462" y2="100" stroke="#64748b" stroke-width="2.5" stroke-dasharray="6,3"/>
          <polygon points="462,96 462,104 470,100" fill="#64748b"/>
          <text x="445" y="92" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">HDMI</text>

          <!-- Monitor -->
          <rect x="470" y="50"  width="96" height="72" rx="5" fill="#334155"/>
          <rect x="476" y="56"  width="84" height="54" rx="3" fill="#0f172a"/>
          <!-- Mock dashboard lines -->
          <rect x="482" y="63" width="32" height="4"  rx="1" fill="#3b82f6" opacity="0.8"/>
          <rect x="482" y="71" width="56" height="3"  rx="1" fill="#475569"/>
          <rect x="482" y="78" width="44" height="3"  rx="1" fill="#475569"/>
          <rect x="482" y="85" width="50" height="3"  rx="1" fill="#10b981" opacity="0.7"/>
          <rect x="482" y="92" width="38" height="3"  rx="1" fill="#475569"/>
          <!-- Stand -->
          <rect x="509" y="122" width="18" height="5" rx="2" fill="#334155"/>
          <rect x="501" y="127" width="34" height="5" rx="2" fill="#1e293b"/>
          <text x="518" y="145" text-anchor="middle" fill="#94a3b8" font-size="9">HMI Screen</text>

          <!-- Flow label -->
          <text x="285" y="198" text-anchor="middle" fill="#64748b" font-size="8">Data flows left → right: sensors send to master, master sends to Pi, Pi sends to screen</text>
        </svg>
      </div>


      <!-- Live all-port overview -->
      <div class="rounded-xl border-2 border-success/30 bg-success/5 p-4 mt-4 space-y-3" id="ws-intro-panel">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="font-bold text-base-content">Live — All Sensors Right Now</span>
          <span id="ws-intro-badge" class="badge badge-xs badge-ghost font-mono">OFFLINE</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3" id="ws-intro-ports">
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-1 text-center">
            <p class="text-xs text-base-content/50 font-medium">PORT 1</p>
            <div id="intro-p1-dot" class="w-6 h-6 rounded-full bg-base-300 mx-auto transition-all"></div>
            <p class="text-xs font-semibold text-base-content">Proximity</p>
            <p id="intro-p1-val" class="text-xs text-base-content/70">—</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-1 text-center">
            <p class="text-xs text-base-content/50 font-medium">PORT 2</p>
            <div id="intro-p2-dot" class="w-6 h-6 rounded-full bg-base-300 mx-auto transition-all"></div>
            <p class="text-xs font-semibold text-base-content">Capacitive</p>
            <p id="intro-p2-val" class="text-xs text-base-content/70">—</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-1 text-center">
            <p class="text-xs text-base-content/50 font-medium">PORT 3</p>
            <div id="intro-p3-dot" class="w-6 h-6 rounded-full bg-base-300 mx-auto transition-all"></div>
            <p class="text-xs font-semibold text-base-content">Temperature</p>
            <p id="intro-p3-val" class="text-xs text-base-content/70">—</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-1 text-center">
            <p class="text-xs text-base-content/50 font-medium">PORT 4</p>
            <div id="intro-p4-dot" class="w-6 h-6 rounded-full bg-base-300 mx-auto transition-all"></div>
            <p class="text-xs font-semibold text-base-content">Light Stack</p>
            <p id="intro-p4-val" class="text-xs text-base-content/70">—</p>
          </div>
        </div>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> What colour is the IO-Link Master, and what is it sometimes called?</p>
      <div class="space-y-2 mt-1" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q1" value="a" class="radio radio-sm radio-primary"> Orange — it is called the hub</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q1" value="b" class="radio radio-sm radio-primary"> Blue — it is called the controller</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q1" value="c" class="radio radio-sm radio-primary"> Green — it is called the gateway</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> Which sensor on this kit detects metal objects using an electromagnetic field?</p>
      <div class="space-y-2 mt-1" data-correct="c">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q2" value="a" class="radio radio-sm radio-primary"> The capacitive sensor on Port 2</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q2" value="b" class="radio radio-sm radio-primary"> The temperature sensor on Port 3</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q2" value="c" class="radio radio-sm radio-primary"> The proximity sensor on Port 1</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> What can the capacitive sensor detect that the proximity sensor cannot?</p>
      <div class="space-y-2 mt-1" data-correct="b">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q3" value="a" class="radio radio-sm radio-primary"> Objects moving faster than 1 m/s</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q3" value="b" class="radio radio-sm radio-primary"> Materials like liquid or powder — even through a container wall</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q3" value="c" class="radio radio-sm radio-primary"> The exact temperature of an object</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q4.</strong> What is the Raspberry Pi's job in this system?</p>
      <div class="space-y-2 mt-1" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q4" value="a" class="radio radio-sm radio-primary"> It collects the sensor data, runs the comms, and serves up this dashboard</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q4" value="b" class="radio radio-sm radio-primary"> It powers the IO-Link Master via USB</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q4" value="c" class="radio radio-sm radio-primary"> It directly controls the light stack colours</label>
      </div>

      <div class="divider my-2"></div>

      <!-- Challenge -->
      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3" id="ws-challenge-box">
        <p class="font-bold text-base-content text-base">🎯 Challenge</p>
        <p class="text-sm text-base-content/80">Trigger the proximity sensor (Port 1) with a <strong>metal object</strong> (screwdriver, spanner) — but <strong>do not</strong> trigger the capacitive sensor. If the capacitive raw value exceeds the tolerance, you fail and must reset.</p>
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 text-center space-y-1">
            <p class="text-xs text-base-content/50 font-medium uppercase tracking-wide">Port 1 · Proximity</p>
            <div id="ch-p1-dot" class="w-8 h-8 rounded-full bg-base-300 mx-auto transition-all duration-100"></div>
            <p id="ch-p1-val" class="text-xs font-bold text-base-content">—</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 text-center space-y-2">
            <p class="text-xs text-base-content/50 font-medium uppercase tracking-wide">Port 2 · Capacitive</p>
            <div id="ch-p2-dot" class="w-8 h-8 rounded-full bg-base-300 mx-auto transition-all duration-100"></div>
            <p id="ch-p2-val" class="text-xs font-bold text-base-content">—</p>
            <div class="w-full bg-base-300 rounded-full h-3 overflow-hidden">
              <div id="ch-p2-bar" class="h-3 rounded-full bg-purple-500 transition-all duration-100" style="width:0%"></div>
            </div>
            <p id="ch-p2-raw" class="text-xs font-mono text-base-content/50">0 / 65535</p>
          </div>
        </div>
        <div id="ch-result" class="hidden rounded-lg p-3 text-center font-bold text-sm"></div>
        <div class="flex justify-center">
          <button type="button" id="ch-reset-btn" class="btn btn-warning btn-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Reset Challenge
          </button>
        </div>
      </div>

      <div class="rounded-xl border border-base-300 bg-base-200/60 p-4 mt-3 space-y-2">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-base-content">Capacitive tolerance before failure</p>
          <span id="ch-tol-label" class="font-mono text-sm font-bold text-primary">30</span>
        </div>
        <input type="range" id="ch-tol-slider" min="0" max="10000" value="30" class="range range-primary range-sm w-full" />
        <div class="flex justify-between text-xs text-base-content/40">
          <span>0 (any signal fails)</span><span>10 000 (very tolerant)</span>
        </div>
        <p class="text-xs text-base-content/60">Drag to set the raw capacitive threshold. Values above this trigger a fail. Default is 30 — adjust lower for stricter challenges or higher to allow some ambient capacitance.</p>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q5.</strong> During the challenge, what did you notice about the capacitive sensor that a normal on/off sensor wouldn't show you?</p>
      <div class="space-y-2 mt-1" data-correct="c">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q5" value="a" class="radio radio-sm radio-primary"> It only ever shows two states — on or off — same as a normal sensor</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q5" value="b" class="radio radio-sm radio-primary"> It measured the exact distance between your hand and the sensor in millimetres</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q5" value="c" class="radio radio-sm radio-primary"> It showed a live level rising as your hand got close, before it fully triggered</label>
      </div>
    `
  },
  {
    id: 2,
    title: 'What is a Smart Sensor?',
    shortDesc: 'IO-Link basics — one cable, loads of info.',
    estimatedTime: 'About 10 min',
    whyItMatters: 'Before you can fix a smart sensor you need to understand why it\'s different from a normal sensor. One extra wire is all it takes to go from "it\'s broken" to "here\'s exactly what\'s wrong."',
    relatedDashboard: 'Dashboard: Port Status overview',
    prerequisites: '',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed text-base">Sensors come in different types — and it's worth being clear about what each one gives you before we look at what IO-Link adds on top.</p>

      <div class="rounded-xl border-2 border-base-300 bg-base-200 p-4 mt-4 space-y-2">
        <p class="font-bold text-base-content">⚡ Digital (On/Off) Sensor</p>
        <p class="text-sm text-base-content/80">The most common type on a production line. Output is either ON or OFF — a proximity sensor detecting metal, a limit switch confirming a door is closed, a photoelectric beam that's broken. Simple, fast, and reliable. But when it stops working, it just goes silent — you get no clue why.</p>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80 ml-2 mt-1">
          <li>Output: HIGH or LOW (24 V or 0 V on the signal wire)</li>
          <li>No data — just a switching state</li>
          <li>If it fails, you have to go and test it manually</li>
        </ul>
        <canvas id="ws2-anim-digital" style="display:block;width:100%;height:120px;border-radius:8px;margin-top:8px"></canvas>
      </div>

      <div class="rounded-xl border-2 border-base-300 bg-base-200 p-4 mt-3 space-y-2">
        <p class="font-bold text-base-content">〰️ Analogue Sensor</p>
        <p class="text-sm text-base-content/80">An analogue sensor sends a continuously varying signal — typically 4–20 mA or 0–10 V — that represents a measured value. A pressure transmitter outputting 12 mA might mean 6 bar. A temperature sensor at 16 mA might mean 80 °C. You get a real measurement, not just on/off.</p>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80 ml-2 mt-1">
          <li>Output: a live value (e.g. 4–20 mA = 0–100 bar)</li>
          <li>Better than digital — you can see the actual process value</li>
          <li>Still no fault codes, no identity, no remote configuration</li>
          <li>Requires calibration and is sensitive to cable length and interference</li>
        </ul>
        <canvas id="ws2-anim-analogue" style="display:block;width:100%;height:130px;border-radius:8px;margin-top:8px"></canvas>
      </div>

      <div class="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 mt-3 space-y-2">
        <p class="font-bold text-base-content">💡 IO-Link Smart Sensor — digital on/off, but with a superpower</p>
        <p class="text-sm text-base-content/80">An IO-Link sensor starts life as a standard digital sensor — it still has a fast switching output (OUT1) that works exactly like the digital sensors above. But IO-Link adds a communication channel on the same 3-wire cable. That channel lets the master read and write data to the sensor without interrupting the switching output.</p>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80 ml-2 mt-1">
          <li>Switching output still works — the PLC sees ON or OFF as normal</li>
          <li>Process data (PDin) carries the measured value, signal quality, alarm flags</li>
          <li>Fault codes — for example "lens dirty" or "wire break"</li>
          <li>Identity — vendor ID, device ID, serial number read automatically</li>
          <li>Remote parameter write — change setpoints or output logic without touching the sensor</li>
        </ul>
        <canvas id="ws2-anim-iolink" style="display:block;width:100%;height:200px;border-radius:8px;margin-top:8px"></canvas>
      </div>

      <div class="rounded-xl border-2 border-info/30 bg-info/5 p-4 mt-3">
        <p class="font-bold text-base-content mb-1">📦 Same Cable — No Extra Wiring</p>
        <p class="text-sm text-base-content/80">IO-Link uses the standard 3-wire sensor cable. The master (AL1350) and the sensor automatically negotiate to talk IO-Link — you do not need a special cable or extra wiring. Same connector, same installation, all the extra data on top.</p>
      </div>

      <!-- WS2 Live panel -->
      <div class="rounded-xl border-2 border-success/30 bg-success/5 p-4 mt-4 space-y-3" id="ws2-smart-panel">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="font-bold text-base-content">Live — All Ports Right Now</span>
          <span id="ws2s-badge" class="badge badge-xs badge-ghost font-mono">OFFLINE</span>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <div class="rounded-lg bg-base-200 border border-base-300 p-2 text-center space-y-1">
            <p class="text-xs text-base-content/50 font-medium">P1</p>
            <div id="ws2-ch-p1" class="w-5 h-5 rounded-full bg-base-300 mx-auto transition-all"></div>
            <p id="ws2-ch-p1-val" class="text-xs text-base-content/70">—</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-2 text-center space-y-1">
            <p class="text-xs text-base-content/50 font-medium">P2</p>
            <div id="ws2-ch-p2" class="w-5 h-5 rounded-full bg-base-300 mx-auto transition-all"></div>
            <p id="ws2-ch-p2-val" class="text-xs text-base-content/70">—</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-2 text-center space-y-1">
            <p class="text-xs text-base-content/50 font-medium">P3</p>
            <div id="ws2-ch-p3" class="w-5 h-5 rounded-full bg-base-300 mx-auto transition-all"></div>
            <p id="ws2-ch-p3-val" class="text-xs text-base-content/70">—</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-2 text-center space-y-1">
            <p class="text-xs text-base-content/50 font-medium">P4</p>
            <div id="ws2-ch-p4" class="w-5 h-5 rounded-full bg-base-300 mx-auto transition-all"></div>
            <p id="ws2-ch-p4-val" class="text-xs text-base-content/70">—</p>
          </div>
        </div>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> A basic digital (on/off) sensor fails and its output goes silent. What diagnostic information can a technician retrieve from it?</p>
      <div class="space-y-2 mt-1" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q1" value="a" class="radio radio-sm radio-primary"> Nothing — the sensor just goes silent, you have to go and test it manually</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q1" value="b" class="radio radio-sm radio-primary"> The exact fault code and which internal component has failed</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q1" value="c" class="radio radio-sm radio-primary"> The last reading before it failed, stored in its internal log</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> A pressure transmitter outputs 12 mA on a 4–20 mA loop calibrated to 0–100 bar. What is the current pressure reading?</p>
      <div class="space-y-2 mt-1" data-correct="c">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q2" value="a" class="radio radio-sm radio-primary"> 12 bar — the mA value equals the bar reading directly</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q2" value="b" class="radio radio-sm radio-primary"> 0 bar — the sensor is in fault because 12 mA is below the normal 16 mA minimum</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q2" value="c" class="radio radio-sm radio-primary"> 50 bar — 12 mA is the midpoint of the 4–20 mA range, which maps to 50% of 100 bar</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> An IO-Link sensor still has its standard switching output (OUT1) active. What does the IO-Link communication channel add on top of that?</p>
      <div class="space-y-2 mt-1" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q3" value="a" class="radio radio-sm radio-primary"> Process data, fault codes, device identity, and remote parameter writes — all over the same 3-wire cable without interrupting OUT1</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q3" value="b" class="radio radio-sm radio-primary"> It replaces OUT1 entirely — you only get the data stream, not a switching output</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q3" value="c" class="radio radio-sm radio-primary"> A higher voltage signal so the PLC can tell it is an IO-Link device</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q4.</strong> Why might you choose an analogue sensor over a digital sensor for monitoring tank level?</p>
      <div class="space-y-2 mt-1" data-correct="c">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q4" value="a" class="radio radio-sm radio-primary"> Analogue sensors are cheaper and easier to wire than digital sensors</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q4" value="b" class="radio radio-sm radio-primary"> Analogue sensors send fault codes that digital sensors cannot</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q4" value="c" class="radio radio-sm radio-primary"> An analogue signal gives a continuous level reading — you see exactly how full the tank is, not just "full" or "empty"</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q5.</strong> Looking at the IO-Link wire animation above — what does the square wave at the bottom of the cable represent?</p>
      <div class="space-y-2 mt-1" data-correct="b">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q5" value="a" class="radio radio-sm radio-primary"> The IO-Link data packets being encoded onto the wire</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q5" value="b" class="radio radio-sm radio-primary"> The standard switching output (OUT1) — still present and working exactly as a normal digital sensor, while the data stream runs above it</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q5" value="c" class="radio radio-sm radio-primary"> The power supply waveform showing 24V DC to the sensor</label>
      </div>

      <div class="divider my-2"></div>

      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3" id="ws2-challenge-box">
        <p class="font-bold text-base-content text-base">🔧 Maintenance Scenario — Fault Diagnosis</p>
        <div class="rounded-lg bg-base-300/50 p-3 text-sm text-base-content/80 border border-base-300">
          <p><strong>Job ticket:</strong> An alarm has been triggered on the IO-Link system. You have been given access to the backend debug log. Read through the output carefully — most of it is normal traffic, but buried inside are clues that reveal exactly what is wrong. Identify the fault.</p>
          <p class="mt-1 text-xs text-base-content/60">Tip: watch for <span class="text-warning font-mono">[WARN]</span> lines — they stand out from the normal <span class="font-mono text-base-content/40">[INFO]</span> and <span class="font-mono text-base-content/40">[DEBUG]</span> traffic.</p>
        </div>
        <div class="flex justify-center">
          <button type="button" id="ws2-start-btn" class="btn btn-warning btn-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Start Scenario
          </button>
        </div>
        <div id="ws2-console-wrap" class="hidden space-y-1">
          <p class="text-xs font-semibold text-base-content/40 uppercase tracking-wide font-mono">── backend debug log ──────────────────────────</p>
          <div id="ws2-console" class="rounded-lg font-mono text-xs p-3 overflow-y-hidden" style="height:210px;background:#0a0f1a;line-height:1.55"></div>
        </div>
        <div id="ws2-diag-wrap" class="hidden space-y-3">
          <p class="font-medium text-base-content text-sm">Based on the debug log, what is the fault?</p>
          <div id="ws2-diag-options" class="space-y-1"></div>
          <div id="ws2-diag-result" class="hidden rounded-lg p-3 text-center font-bold text-sm"></div>
          <div class="flex gap-2 justify-center flex-wrap">
            <button type="button" id="ws2-submit-btn" class="btn btn-primary btn-sm" disabled>Submit Diagnosis</button>
            <button type="button" id="ws2-new-btn" class="btn btn-ghost btn-sm">Try Another Fault</button>
          </div>
        </div>
      </div>
    `
  },
  /* ── COMMENTED OUT — Photoelectric WS3 (swap back by commenting this block in and commenting out the proximity WS3 below) ──
  {
    id: 3,
    title: 'The Photoelectric Sensor',
    shortDesc: 'Detecting objects with light — Port 1.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'Photoelectric sensors are everywhere on production lines. Knowing what they detect, what their LED means, and what "lens dirty" actually looks like will save you a lot of time.',
    relatedDashboard: 'Dashboard: Port 1 — Photoelectric',
    prerequisites: 'Complete Worksheet 1 first',
    contentHtml: `...photoelectric content preserved — see git history or cp0001 backup...`
  },
  ── END PHOTOELECTRIC WS3 COMMENT ── */

  // ── PROXIMITY SENSOR WS3 (Omron E2E-X16MB1T12) ──
  {
    id: 3,
    title: 'The Proximity Sensor',
    shortDesc: 'Detecting metal without touching — Port 1.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'Inductive proximity sensors are one of the most common sensor types in manufacturing. The Omron E2E runs IO-Link V1.1 which gives you live diagnostic alarms — instability and over-approach — that warn you before the sensor causes production problems.',
    relatedDashboard: 'Dashboard: Port 1 — Proximity',
    prerequisites: 'Complete Worksheet 1 first',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">An inductive proximity sensor generates an oscillating electromagnetic field at its face. When a metal target enters that field it absorbs energy and damps the oscillation — the sensor detects this change and switches its output on. It never touches the target and does not need a light beam.</p>


      <!-- WS3 SVG diagram — electromagnetic field -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">How inductive sensing works</p>
        <svg viewBox="0 0 570 175" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <!-- Sensor body -->
          <rect x="10" y="50" width="90" height="75" rx="8" fill="#1e3a5f"/>
          <text x="55" y="78" text-anchor="middle" fill="white" font-size="10" font-weight="600">Proximity</text>
          <text x="55" y="92" text-anchor="middle" fill="#93c5fd" font-size="8">Omron E2E-X16</text>
          <text x="55" y="106" text-anchor="middle" fill="#93c5fd" font-size="7">M18 inductive</text>
          <text x="55" y="138" text-anchor="middle" fill="#94a3b8" font-size="8">Coil / Oscillator</text>
          <!-- EM field arcs -->
          <path d="M100 87 Q140 60 140 87 Q140 114 100 87" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.5" stroke-dasharray="6,3"/>
          <path d="M100 87 Q162 46 162 87 Q162 128 100 87" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.4" stroke-dasharray="6,3"/>
          <path d="M100 87 Q184 32 184 87 Q184 142 100 87" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.3" stroke-dasharray="6,3"/>
          <text x="200" y="64" text-anchor="middle" fill="#3b82f6" font-size="9" font-weight="600">EM field</text>
          <!-- Metal target -->
          <rect x="310" y="57" width="70" height="60" rx="5" fill="#78716c"/>
          <text x="345" y="84" text-anchor="middle" fill="white" font-size="10" font-weight="600">Metal</text>
          <text x="345" y="98" text-anchor="middle" fill="#d6d3d1" font-size="8">target</text>
          <!-- Field damping -->
          <text x="245" y="50" text-anchor="middle" fill="#ef4444" font-size="8" font-weight="600">field damped →</text>
          <text x="245" y="62" text-anchor="middle" fill="#ef4444" font-size="7">oscillation drops</text>
          <!-- Output box -->
          <rect x="420" y="65" width="140" height="44" rx="5" fill="#16a34a"/>
          <text x="490" y="84" text-anchor="middle" fill="white" font-size="11" font-weight="700">OUTPUT: ON</text>
          <text x="490" y="100" text-anchor="middle" fill="#bbf7d0" font-size="8">metal in range → switches</text>
          <!-- Bottom note -->
          <text x="285" y="158" text-anchor="middle" fill="#64748b" font-size="8">Metal enters EM field → oscillation damped → output ON. Remove metal → field restores → output OFF.</text>
        </svg>
      </div>

      <!-- IO-Link V1.1 diagnostic alarms info box -->
      <div class="rounded-lg border border-info/30 bg-info/5 p-3 mt-3 text-sm space-y-1">
        <p class="font-bold text-base-content">IO-Link V1.1 — what it adds over standard wiring</p>
        <p class="text-base-content/80">The Omron E2E runs IO-Link V1.1 at COM3 (230.4 kbps). On top of the basic switching output, the process data carries two extra diagnostic alarm bits:</p>
        <ul class="list-disc list-inside mt-1 space-y-1 text-base-content/80">
          <li><strong>Instability Alarm (PDin bit 4):</strong> The target is near the edge of the sensing range — detection may be unreliable. Adjust the bracket to bring the target further into the sensing zone.</li>
          <li><strong>Over-Approach Alarm (PDin bit 5):</strong> The target is too close to the sensor face — excessive proximity causes oscillation overload and can damage the sensor over time. Increase the standoff distance.</li>
        </ul>
      </div>

      <!-- Live section -->
      <div class="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 mt-3 space-y-3" id="ws2-live-panel">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="font-semibold text-base-content text-sm">Port 1 — Live Detection</span>
          <span id="ws2-live-badge" class="badge badge-xs badge-ghost font-mono">OFFLINE</span>
        </div>
        <div class="flex items-center gap-4">
          <div id="ws2-dot" class="w-8 h-8 rounded-full bg-base-300 border-2 border-base-300 transition-all duration-150 shadow-md"></div>
          <div>
            <p id="ws2-state-label" class="text-base font-bold text-base-content">—</p>
            <p id="ws2-quality-label" class="text-xs text-base-content/60 mt-0.5">Alarms: —</p>
          </div>
        </div>
        <div class="space-y-1">
          <p class="text-xs text-base-content/60 font-medium uppercase tracking-wide">Detection waveform (last 60 samples)</p>
          <div style="height:80px; position:relative;"><canvas id="ws2-chart"></canvas></div>
        </div>
        <div class="space-y-1">
          <p class="text-xs text-base-content/60 font-medium uppercase tracking-wide">Instability alarm history (last 60 samples — 1 = alarm active)</p>
          <div style="height:60px; position:relative;"><canvas id="ws2-sig-chart"></canvas></div>
        </div>
      </div>

      <!-- Task: bring metal object close 5 times -->
      <div class="rounded-lg border border-success/30 bg-success/5 p-3 mt-3" id="ws2-task-box">
        <p class="font-semibold text-base-content text-sm mb-2">🎯 Task: bring a metal object (screwdriver, spanner) close to the sensor face 5 times</p>
        <div class="flex items-center gap-3">
          <progress id="ws2-wave-progress" class="progress progress-success w-full" value="0" max="5"></progress>
          <span id="ws2-wave-count" class="text-sm font-mono font-bold text-base-content whitespace-nowrap">0 / 5</span>
        </div>
        <p id="ws2-task-done" class="hidden text-success text-sm font-bold mt-1">✓ Task complete!</p>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> Hold a metal object close to the sensor and watch the waveform above. What does the chart do when metal is detected?</p>
      <div class="space-y-2 mt-1" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q1" value="a" class="radio radio-sm radio-primary"> The line jumps from 0 to 1, then drops back to 0 when the metal moves away</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q1" value="b" class="radio radio-sm radio-primary"> The line stays flat at 0 the whole time</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q1" value="c" class="radio radio-sm radio-primary"> The line drops below zero when metal is detected</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> The Instability Alarm fires while the sensor output is ON. What does this tell you about the target position?</p>
      <div class="space-y-2 mt-1" data-correct="c">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q2" value="a" class="radio radio-sm radio-primary"> The sensor has detected two metal objects at the same time</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q2" value="b" class="radio radio-sm radio-primary"> The sensor cable has a loose connection</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q2" value="c" class="radio radio-sm radio-primary"> The target is near the edge of the sensing range — detection may be unreliable</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> The Over-Approach Alarm fires when the metal target is held very close to the sensor face. What is the correct response?</p>
      <div class="space-y-2 mt-1" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q3" value="a" class="radio radio-sm radio-primary"> Increase the standoff distance between the sensor face and the target</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q3" value="b" class="radio radio-sm radio-primary"> Replace the sensor immediately — the over-approach alarm means it has failed</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q3" value="c" class="radio radio-sm radio-primary"> Reduce sensitivity using the teach button</label>
      </div>

      <div class="divider my-2"></div>

      <!-- Steady-hold challenge -->
      <div class="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 space-y-3" id="ws3-stable-ch-box">
        <p class="font-bold text-base-content text-base">⏱ Challenge — Hold Steady for 10 Seconds</p>
        <p class="text-sm text-base-content/80">Hold a metal object at 8–12 mm from the sensor face for 10 continuous seconds <strong>without</strong> triggering the instability alarm. If the alarm fires, the timer resets to zero.</p>
        <div class="flex items-center gap-3 flex-wrap">
          <button type="button" id="ws3-sd-start" class="btn btn-primary btn-sm">Start Challenge</button>
          <span id="ws3-sd-status" class="text-sm text-base-content/60">Press Start to begin</span>
        </div>
        <div id="ws3-sd-body" class="hidden space-y-3">
          <div class="space-y-1">
            <div class="flex items-center justify-between text-xs text-base-content/60">
              <span class="font-semibold uppercase tracking-wide">Stable detection</span>
              <span id="ws3-sd-timer" class="font-mono font-bold text-base-content">0.0 s / 10.0 s</span>
            </div>
            <div class="w-full bg-base-300 rounded-full h-4 overflow-hidden">
              <div id="ws3-sd-bar" class="h-4 rounded-full transition-all duration-300 bg-primary" style="width:0%"></div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div id="ws3-sd-dot" class="w-5 h-5 rounded-full bg-base-300 border-2 border-base-300 flex-shrink-0 transition-all duration-150"></div>
            <span id="ws3-sd-label" class="text-sm font-medium text-base-content/60">Waiting for metal...</span>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-base-content/60 font-medium uppercase tracking-wide">Detection waveform (last 60 samples)</p>
            <div style="height:60px; position:relative;"><canvas id="ws3-sd-det-chart"></canvas></div>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-base-content/60 font-medium uppercase tracking-wide">Instability alarm — must stay 0</p>
            <div style="height:50px; position:relative;"><canvas id="ws3-sd-instab-chart"></canvas></div>
          </div>
          <div id="ws3-sd-result" class="hidden rounded-lg p-3 text-center font-bold text-sm"></div>
        </div>
      </div>

      <div class="divider my-2"></div>

      <div class="space-y-2 mt-4">
        <p class="font-bold text-base-content text-base">🔧 Maintenance Scenario — Parameter Misconfiguration</p>
        <p class="text-sm text-base-content/80">IO-Link sensors store their configuration <em>inside the device</em>, not on the master. When a sensor is removed and refitted during maintenance, an accidental parameter change can leave it behaving incorrectly — even though physically everything looks fine and IO-Link comms are green. Your job is to diagnose the misconfiguration and correct it using IO-Link ISDU acyclic read/write.</p>
      </div>

      <!-- HMI Diagnostic Terminal -->
      <div class="rounded-xl overflow-hidden mt-3 border border-neutral/60" id="ws3-challenge-box">

        <!-- Title bar -->
        <div class="flex items-center justify-between px-3 py-2 bg-neutral border-b border-neutral/40">
          <div class="flex items-center gap-2">
            <div id="ws3-hdr-dot" class="w-2.5 h-2.5 rounded-full bg-error animate-pulse flex-shrink-0"></div>
            <span id="ws3-hdr-status" class="font-mono text-xs font-bold text-error tracking-widest uppercase">Active Fault</span>
          </div>
          <span class="font-mono text-xs text-neutral-content/50 hidden sm:block">LINE 3 — PROXIMITY SENSOR — PORT 1</span>
          <span class="font-mono text-xs text-neutral-content/40">MJT-2247</span>
        </div>

        <!-- Shift handover note -->
        <div class="bg-neutral/60 px-3 py-3 border-b border-neutral/40">
          <p class="font-mono text-xs text-neutral-content/40 uppercase tracking-widest mb-2">Shift Handover — Night Shift to Day Shift</p>
          <div class="rounded-lg border border-neutral/40 bg-black/30 p-3 font-mono text-xs space-y-1.5">
            <p class="text-neutral-content/50">TO: Day Shift Maintenance&nbsp;&nbsp;&nbsp;FROM: Night Shift (T. Okafor)&nbsp;&nbsp;&nbsp;DATE: 09-Jun-26 06:00</p>
            <p class="text-neutral-content/30 border-t border-neutral/20 pt-1.5">LINE 3 — PREVENTIVE MAINTENANCE COMPLETED 02:30–04:45</p>
            <p class="text-neutral-content/80">Port 1 proximity sensor (Omron E2E-X16MB1T12) pulled and cleaned — oil contamination on face from gearbox leak. Refitted and torqued to spec. IO-Link comms re-established, green LED confirmed at 04:52.</p>
            <p class="text-neutral-content/80 mt-1">NOTE: Line 3 has stopped three times between 05:30 and handover. Operator reports the belt sensor is triggering when the belt is empty. I checked the bracket — alignment looks straight. No obvious mechanical damage. Handing to day shift for investigation.</p>
            <p class="text-warning mt-1">⚠ Do not restart line until root cause confirmed. Production supervisor aware.</p>
          </div>
        </div>

        <!-- Alarm log -->
        <div class="bg-neutral px-3 py-2 border-b border-neutral/40">
          <p class="font-mono text-xs text-neutral-content/40 uppercase tracking-widest mb-1.5">Alarm Log — Line 3</p>
          <table class="w-full font-mono text-xs border-collapse">
            <tbody>
              <tr class="border-b border-neutral/20">
                <td class="py-1 pr-3 text-neutral-content/40 whitespace-nowrap">05:47:12</td>
                <td class="pr-3 text-error font-semibold whitespace-nowrap">LINE3-ESTOP</td>
                <td class="text-neutral-content/70">Emergency stop — belt sensor triggered on empty belt</td>
                <td class="pl-2 text-error text-right">✕</td>
              </tr>
              <tr class="border-b border-neutral/20">
                <td class="py-1 pr-3 text-neutral-content/40 whitespace-nowrap">05:44:31</td>
                <td class="pr-3 text-warning font-semibold whitespace-nowrap">PORT1-PROX</td>
                <td class="text-neutral-content/70">Detection ACTIVE — no product confirmed on belt</td>
                <td class="pl-2 text-warning text-right">⚠</td>
              </tr>
              <tr class="border-b border-neutral/20">
                <td class="py-1 pr-3 text-neutral-content/40 whitespace-nowrap">05:31:08</td>
                <td class="pr-3 text-error font-semibold whitespace-nowrap">LINE3-ESTOP</td>
                <td class="text-neutral-content/70">Emergency stop — belt sensor triggered on empty belt</td>
                <td class="pl-2 text-error text-right">✕</td>
              </tr>
              <tr class="border-b border-neutral/20">
                <td class="py-1 pr-3 text-neutral-content/40 whitespace-nowrap">05:28:44</td>
                <td class="pr-3 text-warning font-semibold whitespace-nowrap">PORT1-PROX</td>
                <td class="text-neutral-content/70">Detection ACTIVE — no product confirmed on belt</td>
                <td class="pl-2 text-warning text-right">⚠</td>
              </tr>
              <tr>
                <td class="py-1 pr-3 text-neutral-content/40 whitespace-nowrap">04:52:17</td>
                <td class="pr-3 text-neutral-content/40 whitespace-nowrap">PORT1-PROX</td>
                <td class="text-neutral-content/70">IO-Link comms re-established — post-PM reconnect OK</td>
                <td class="pl-2 text-neutral-content/30 text-right">✓</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Live process values -->
        <div class="bg-neutral px-3 py-2 border-b border-neutral/40">
          <p class="font-mono text-xs text-neutral-content/40 uppercase tracking-widest mb-1.5">Live Process Values — Port 1</p>
          <div class="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs">
            <div class="flex items-center justify-between gap-2">
              <span class="text-neutral-content/40">Detection</span>
              <span id="ws3-hmi-det" class="font-bold text-neutral-content">—</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-neutral-content/40">Instability</span>
              <span id="ws3-hmi-instab" class="font-bold text-neutral-content">—</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-neutral-content/40">Over-Approach</span>
              <span id="ws3-hmi-overapp" class="font-bold text-neutral-content">—</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-neutral-content/40">Monitor Out</span>
              <span id="ws3-hmi-mon" class="font-bold text-neutral-content">—</span>
            </div>
          </div>
        </div>

        <!-- Step 0: Start scenario -->
        <div class="bg-neutral px-3 py-3 border-b border-neutral/40 space-y-3" id="ws3-ms-setup">
          <p class="font-mono text-xs text-neutral-content/40 uppercase tracking-widest">Ready to Investigate</p>
          <p class="text-sm text-neutral-content/80">You have been handed the above job ticket. Click <strong class="text-neutral-content">Start Scenario</strong> to load the fault into the sensor so you can investigate it live.</p>
          <div class="flex items-center gap-3 flex-wrap">
            <button type="button" id="ws3-ms-inject-btn" class="btn btn-warning btn-sm gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Start Scenario
            </button>
            <span id="ws3-ms-inject-status" class="text-xs font-mono text-neutral-content/40"></span>
          </div>
        </div>

        <!-- Step 1: Observe (revealed after inject) -->
        <div id="ws3-ms-observe" class="hidden bg-neutral px-3 py-3 border-b border-neutral/40 space-y-3">
          <p class="font-mono text-xs text-success uppercase tracking-widest">Scenario Active — Step 1: Observe the Anomaly</p>
          <p class="text-sm text-neutral-content/80">The fault is now live. Try holding a metal object close to the sensor face and watch the live values below:</p>
          <div class="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs rounded border border-neutral/40 bg-black/20 px-3 py-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-neutral-content/40">Detection</span>
              <span id="ws3-obs-det" class="font-bold text-neutral-content">—</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-neutral-content/40">Instability</span>
              <span id="ws3-obs-instab" class="font-bold text-neutral-content">—</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-neutral-content/40">Over-Approach</span>
              <span id="ws3-obs-overapp" class="font-bold text-neutral-content">—</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-neutral-content/40">Monitor Out</span>
              <span id="ws3-obs-mon" class="font-bold text-neutral-content">—</span>
            </div>
          </div>
          <p class="text-sm text-neutral-content/80">The alarm log shows the sensor triggering on an empty belt. That pattern — detecting when nothing is there, not detecting when something is — is a classic sign that output polarity has been reversed. When you have observed this, continue.</p>
          <button type="button" id="ws3-ms-observe-next" class="btn btn-primary btn-sm font-mono gap-2">I have observed the anomaly — Continue to Diagnosis →</button>
        </div>

        <!-- Step 2: Diagnose (revealed after observe) -->
        <div id="ws3-ms-diag" class="hidden bg-neutral px-3 py-3 border-b border-neutral/40 space-y-3">
          <p class="font-mono text-xs text-neutral-content/40 uppercase tracking-widest">Step 2 — Diagnosis</p>
          <p class="text-sm text-neutral-content/80">The output is consistently inverted — active with no target, inactive with a target present. The bracket alignment is confirmed correct. IO-Link comms are clean — no errors, stable monitor output.</p>
          <p class="text-sm text-neutral-content/80 font-semibold text-neutral-content">What is the most likely root cause?</p>
          <div class="flex flex-col gap-2">
            <button type="button" data-ans="nc" class="btn btn-sm font-mono text-left justify-start" style="border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.5);background:transparent">Output logic parameter changed from NO to NC — inverts the switching behaviour</button>
            <button type="button" data-ans="hw" class="btn btn-sm font-mono text-left justify-start" style="border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.5);background:transparent">Sensor coil is damaged — mechanical impact during removal reversed the output</button>
            <button type="button" data-ans="cable" class="btn btn-sm font-mono text-left justify-start" style="border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.5);background:transparent">IO-Link cable polarity swapped at the master connector — wiring error</button>
          </div>
          <p id="ws3-ms-diag-fb" class="hidden text-sm font-semibold"></p>
        </div>

        <!-- Step 3: Read parameter (revealed after correct diagnosis) -->
        <div id="ws3-ms-read" class="hidden bg-neutral px-3 py-3 border-b border-neutral/40 space-y-3">
          <p class="font-mono text-xs text-success uppercase tracking-widest">Diagnosis Confirmed ✓ — Step 3: Verify with ISDU Read</p>
          <p class="text-sm text-neutral-content/80">Good call. Now <em>prove</em> it — read the Switchpoint Logic OUT1 parameter directly from sensor memory using IO-Link ISDU acyclic read. This is exactly how a field engineer would verify a suspected parameter change: read the device, confirm the value, document the evidence.</p>
          <div class="rounded border border-neutral/40 bg-black/30 p-2 text-xs font-mono text-neutral-content/50 space-y-0.5">
            <p>ISDU READ — Port 1 — Index 0x3D (61) / Subindex 1 — Switchpoint Logic OUT1</p>
            <p class="text-neutral-content/30">Factory default: 0x00 (NO — Normally Open) · Fault value: 0x01 (NC — Normally Closed)</p>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <button type="button" id="ws3-ms-read-btn" class="btn btn-sm font-mono" style="border:1px solid rgba(59,130,246,0.5);color:#3b82f6;background:transparent">Read Parameter →</button>
            <span id="ws3-ms-read-status" class="text-xs font-mono text-neutral-content/40"></span>
          </div>
          <div id="ws3-ms-read-result" class="hidden rounded border border-neutral/40 bg-black/30 p-3 font-mono text-xs space-y-1.5">
            <p class="text-neutral-content/40 uppercase tracking-widest text-xs">ISDU READ RESPONSE</p>
            <p class="text-neutral-content/50">Port: 1 · Index: 0x3D · Subindex: 1</p>
            <p>Raw hex: <span id="ws3-ms-read-hex" class="text-warning">—</span></p>
            <p>Decoded: <span id="ws3-ms-read-val" class="text-warning font-bold">—</span></p>
            <p id="ws3-ms-read-interp" class="mt-1">—</p>
          </div>
          <button type="button" id="ws3-ms-read-next" class="hidden btn btn-sm font-mono" style="border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.5);background:transparent">Proceed to Write Fix →</button>
        </div>

        <!-- Step 4: Write fix (revealed after read) -->
        <div id="ws3-ms-write" class="hidden bg-neutral px-3 py-3 border-b border-neutral/40 space-y-3">
          <p class="font-mono text-xs text-neutral-content/40 uppercase tracking-widest">Step 4 — Corrective Action: ISDU Write</p>
          <p class="text-sm text-neutral-content/80">Read confirms Switchpoint Logic OUT1 is <strong class="text-error">1 (NC — Normally Closed)</strong>. The factory default is <strong class="text-success">0 (NO — Normally Open)</strong>. Write the correct value back to restore normal output polarity.</p>
          <div class="rounded border border-neutral/40 bg-black/30 p-2 text-xs font-mono text-neutral-content/50 space-y-0.5">
            <p>ISDU WRITE — Port 1 — Index 0x3D (61) / Subindex 1 — Switchpoint Logic OUT1</p>
            <p class="text-success">Target value: 0x00 (NO — Normally Open — object detected → output ON)</p>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <button type="button" id="ws3-ms-write-btn" class="btn btn-sm font-mono" style="border:1px solid rgba(74,222,128,0.5);color:#4ade80;background:transparent">Write NO (0x00) to Sensor →</button>
            <span id="ws3-ms-write-status" class="text-xs font-mono text-neutral-content/40"></span>
          </div>
        </div>

        <!-- Step 5: Verify (revealed after write) -->
        <div id="ws3-ms-verify" class="hidden bg-neutral px-3 py-3 border-b border-neutral/40 space-y-3">
          <p class="font-mono text-xs text-success uppercase tracking-widest">Write Complete ✓ — Step 5: Verify Correct Operation</p>
          <p class="text-sm text-neutral-content/80">Parameter written. Hold a metal object close to the sensor and confirm the output is now correct: metal present → <strong class="text-success">DETECTED</strong>, no metal → <strong class="text-neutral-content">NO OBJECT</strong>. Hold stable for 3 continuous seconds to confirm.</p>
          <div class="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs rounded border border-neutral/40 bg-black/20 px-3 py-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-neutral-content/40">Detection</span>
              <span id="ws3-vfy-det" class="font-bold text-neutral-content">—</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-neutral-content/40">Instability</span>
              <span id="ws3-vfy-instab" class="font-bold text-neutral-content">—</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-neutral-content/40">Over-Approach</span>
              <span id="ws3-vfy-overapp" class="font-bold text-neutral-content">—</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-neutral-content/40">Monitor Out</span>
              <span id="ws3-vfy-mon" class="font-bold text-neutral-content">—</span>
            </div>
          </div>
          <div class="space-y-1.5">
            <div class="flex items-center justify-between font-mono text-xs">
              <span class="text-neutral-content/40">Verification status</span>
              <span id="ws3-ms-vfy-pct" class="text-neutral-content">Waiting for detection…</span>
            </div>
            <div class="w-full rounded-full h-4 overflow-hidden" style="background:rgba(255,255,255,0.08)">
              <div id="ws3-ms-vfy-bar" class="h-4 rounded-full transition-all duration-300" style="width:0%;background:rgba(255,255,255,0.12)"></div>
            </div>
            <div class="flex justify-between font-mono text-xs text-neutral-content/30 px-0.5">
              <span>Not detected</span><span>Hold 3 s →</span><span>✓ Verified</span>
            </div>
          </div>
          <div class="space-y-1">
            <div class="flex items-center justify-between font-mono text-xs">
              <span class="text-neutral-content/40">Stable hold</span>
              <span id="ws3-ms-vfy-timer" class="text-neutral-content">0.0 s / 3.0 s</span>
            </div>
            <div class="w-full rounded-full h-2 overflow-hidden" style="background:rgba(255,255,255,0.08)">
              <div id="ws3-ms-vfy-tbar" class="h-2 rounded-full transition-all duration-300 bg-success" style="width:0%"></div>
            </div>
          </div>
        </div>

        <!-- Sign-off section (revealed after verify) -->
        <div id="ws3-ms-signoff" class="hidden bg-neutral px-3 py-3 border-b border-neutral/40 space-y-3">
          <p class="font-mono text-xs text-success uppercase tracking-widest">Verification Passed ✓ — Close Ticket</p>
          <p class="text-sm text-neutral-content/80">Before closing the ticket, confirm the following:</p>
          <div class="space-y-2">
            <label class="flex items-center gap-3 cursor-pointer font-mono text-xs">
              <input type="checkbox" class="checkbox checkbox-xs checkbox-success" id="ws3-ms-ck1">
              <span class="text-neutral-content/70">Root cause confirmed via ISDU read: Switchpoint Logic OUT1 was NC (0x01) — corrected to NO (0x00) via ISDU write</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer font-mono text-xs">
              <input type="checkbox" class="checkbox checkbox-xs checkbox-success" id="ws3-ms-ck2">
              <span class="text-neutral-content/70">Sensor verified: stable detection with correct output polarity confirmed, no active alarms</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer font-mono text-xs">
              <input type="checkbox" class="checkbox checkbox-xs checkbox-success" id="ws3-ms-ck3">
              <span class="text-neutral-content/70">Corrective action documented: update PM checklist to include ISDU parameter verification after sensor removal/refit</span>
            </label>
          </div>
          <button type="button" id="ws3-ms-close-btn" class="btn btn-xs btn-outline w-full font-mono tracking-wider" style="color:#4ade80;border-color:#4ade80" disabled>CLOSE TICKET — MJT-2247</button>
        </div>

        <!-- Completion banner -->
        <div id="ws3-ch-result" class="hidden px-3 py-2 font-mono text-xs border-t border-success/30 bg-success/10 text-success"></div>

        <!-- Reset -->
        <div class="bg-neutral px-3 py-2 border-t border-neutral/40 flex justify-end">
          <button type="button" id="ws3-ch-reset" class="btn btn-ghost btn-xs gap-1 font-mono text-neutral-content/20 opacity-40 hover:opacity-70">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            RESET
          </button>
        </div>
      </div>
    `
  },
  {
    id: 4,
    title: 'The Capacitive Sensor',
    shortDesc: 'Detecting materials without touching — Port 2.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'Capacitive sensors can detect things a photoelectric can\'t — liquids through a tank wall, powder in a hopper, or plastic behind a panel. But they\'re easy to set too sensitive, which causes false triggers.',
    relatedDashboard: 'Dashboard: Port 2 — Capacitive',
    prerequisites: 'Complete Worksheet 1 first',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">A capacitive sensor creates an electric field in front of it. When material enters that field, the sensor detects the change and switches on. It doesn't need to see it — just feel it.</p>

      <!-- WS4 SVG diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">How it works</p>
        <svg viewBox="0 0 570 185" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <!-- Sensor body -->
          <rect x="10" y="60" width="80" height="65" rx="8" fill="#7c3aed"/>
          <text x="50" y="88" text-anchor="middle" fill="white" font-size="10" font-weight="600">Capacitive</text>
          <text x="50" y="102" text-anchor="middle" fill="#ddd6fe" font-size="8">M18 sensor</text>

          <!-- Electric field arcs (partial ellipses) -->
          <ellipse cx="110" cy="92" rx="30" ry="22" fill="none" stroke="#a78bfa" stroke-width="1.5" opacity="0.9"/>
          <ellipse cx="110" cy="92" rx="55" ry="40" fill="none" stroke="#a78bfa" stroke-width="1.5" opacity="0.7"/>
          <ellipse cx="110" cy="92" rx="80" ry="58" fill="none" stroke="#a78bfa" stroke-width="1.5" opacity="0.5"/>
          <ellipse cx="110" cy="92" rx="105" ry="72" fill="none" stroke="#a78bfa" stroke-width="1.5" opacity="0.3"/>
          <ellipse cx="110" cy="92" rx="130" ry="85" fill="none" stroke="#a78bfa" stroke-width="1.5" opacity="0.2"/>

          <!-- Water object -->
          <rect x="220" y="25" width="60" height="28" rx="4" fill="#3b82f6"/>
          <text x="250" y="43" text-anchor="middle" fill="white" font-size="9" font-weight="600">Water</text>
          <line x1="220" y1="39" x2="150" y2="75" stroke="#a78bfa" stroke-width="1" stroke-dasharray="3,3"/>

          <!-- Powder object -->
          <rect x="235" y="78" width="60" height="28" rx="4" fill="#92400e"/>
          <text x="265" y="96" text-anchor="middle" fill="white" font-size="9" font-weight="600">Powder</text>
          <line x1="235" y1="92" x2="160" y2="92" stroke="#a78bfa" stroke-width="1" stroke-dasharray="3,3"/>

          <!-- Hand object -->
          <rect x="220" y="130" width="60" height="28" rx="4" fill="none" stroke="#22c55e" stroke-width="2"/>
          <text x="250" y="148" text-anchor="middle" fill="#22c55e" font-size="9" font-weight="600">Hand</text>
          <line x1="220" y1="144" x2="150" y2="110" stroke="#a78bfa" stroke-width="1" stroke-dasharray="3,3"/>

          <!-- Bottom label -->
          <text x="285" y="172" text-anchor="middle" fill="#64748b" font-size="8">Anything that changes the electric field triggers detection — even through a container wall</text>
        </svg>
      </div>

      <!-- Live section -->
      <div class="rounded-xl border-2 border-secondary/30 bg-secondary/5 p-4 mt-3 space-y-3" id="ws3-live-panel">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="font-semibold text-base-content text-sm">Port 2 — Live Detection</span>
          <span id="ws3-live-badge" class="badge badge-xs badge-ghost font-mono">OFFLINE</span>
        </div>

        <!-- State + counter row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 flex flex-col items-center gap-1">
            <div id="ws3-dot" class="w-10 h-10 rounded-full bg-base-300 border-2 border-base-300 transition-all duration-150 shadow-md"></div>
            <p id="ws3-state-label" class="text-sm font-bold text-base-content mt-1">—</p>
            <p class="text-xs text-base-content/50">Detection state</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 flex flex-col items-center gap-1">
            <p id="ws3-count-display" class="text-4xl font-black font-mono text-secondary leading-none">0</p>
            <p class="text-xs text-base-content/50 mt-1">Total detections</p>
          </div>
        </div>

        <!-- Chart -->
        <div class="space-y-1">
          <p class="text-xs text-base-content/60 font-medium uppercase tracking-wide">Detection waveform (last 60 samples)</p>
          <div style="height:90px; position:relative;"><canvas id="ws3-chart"></canvas></div>
        </div>
      </div>

      <!-- ISDU Controls: sensitivity + teach -->
      <div class="rounded-xl border-2 border-secondary/30 bg-secondary/5 p-4 mt-3 space-y-3" id="ws3-isdu-panel">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="font-semibold text-base-content text-sm">Sensor Parameters (via IO-Link)</span>
          <span id="ws3-isdu-badge" class="badge badge-xs badge-ghost font-mono">LOADING</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- SSC1 SP1 -->
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-3">
            <p class="text-xs font-semibold text-base-content">Detection Threshold (SSC1 SP1)</p>
            <p class="text-xs text-base-content/80 leading-relaxed">SP1 is the threshold the sensor compares its measured capacitive field against. When the field reading crosses SP1, the output switches ON. Every installation is different — a sensor mounted on a plastic hopper full of wet grain needs a very different SP1 to the same sensor mounted on a dry conveyor belt — so SP1 must always be set for the specific application.</p>
            <div class="space-y-1.5 text-xs text-base-content/70">
              <div class="flex items-start gap-2 rounded bg-error/10 border border-error/20 p-2">
                <span class="text-error font-bold flex-shrink-0">SP1 too high:</span>
                <span>The sensor ignores weak field changes. It won't detect light materials or targets at distance — missed detections, production stops waiting for a signal that never comes.</span>
              </div>
              <div class="flex items-start gap-2 rounded bg-warning/10 border border-warning/20 p-2">
                <span class="text-warning font-bold flex-shrink-0">SP1 too low:</span>
                <span>The sensor reacts to the container wall, humidity, or your hand nearby. Continuous false triggers — production bypasses the sensor and runs unprotected.</span>
              </div>
              <div class="flex items-start gap-2 rounded bg-success/10 border border-success/20 p-2">
                <span class="text-success font-bold flex-shrink-0">SP1 correct:</span>
                <span>Set just above the ambient field reading with nothing present. The best way to achieve this is Teach Mode (below) — the sensor measures the environment and sets SP1 automatically with a known margin.</span>
              </div>
            </div>
            <div class="flex items-center gap-2 pt-1">
              <span class="text-xs text-base-content/50">More sensitive</span>
              <input type="range" id="ws3-sp1-slider" min="10" max="10000" value="1000" step="10" class="range range-secondary range-xs flex-1">
              <span class="text-xs text-base-content/50">Less sensitive</span>
            </div>
            <div class="flex items-center justify-between">
              <span id="ws3-sp1-val" class="font-mono text-sm font-bold text-secondary">—</span>
              <button type="button" id="ws3-sp1-write" class="btn btn-xs btn-secondary">Apply to sensor</button>
            </div>
            <span id="ws3-sp1-status" class="text-xs"></span>
          </div>
          <!-- QoT / QoR -->
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-3">
            <p class="text-xs font-semibold text-base-content">Teach &amp; Run Quality</p>
            <p class="text-xs text-base-content/80 leading-relaxed">These two values are unique to IO-Link — a standard digital or analogue sensor can only tell you <em>on</em> or <em>off</em>. IO-Link lets you read the sensor's internal confidence scores via ISDU:</p>
            <div class="space-y-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-semibold text-info">QoT — Quality of Teach</span>
                  <span id="ws3-qot-val" class="text-xs font-mono font-bold text-info">—</span>
                </div>
                <progress id="ws3-qot-bar" class="progress progress-info w-full" value="0" max="255"></progress>
                <p class="text-xs text-base-content/60 mt-1">How confident the sensor is that the teach procedure captured a clean reference signal. A score above ~150 means the teach went well. A low score (below 80) means the sensor was taught in noisy conditions — you may get inconsistent detection near the setpoint. <strong>Read after teaching</strong> to verify the teach was successful.</p>
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-semibold text-success">QoR — Quality of Run</span>
                  <span id="ws3-qor-val" class="text-xs font-mono font-bold text-success">—</span>
                </div>
                <progress id="ws3-qor-bar" class="progress progress-success w-full" value="0" max="255"></progress>
                <p class="text-xs text-base-content/60 mt-1">The real-time signal margin during normal operation — how far the current field reading is from the SP1 threshold. A high QoR means plenty of headroom; the sensor will reliably switch. A low QoR (near zero) means the sensor is operating close to its limit and is at risk of nuisance trips. <strong>Read during operation</strong> to catch marginal installations before they cause downtime.</p>
              </div>
            </div>
            <div class="flex items-center gap-2 rounded bg-base-300/60 p-2 text-xs text-base-content/70">
              <span class="text-lg">💡</span>
              <span>On a conventional sensor you would have no visibility of these margins at all. IO-Link makes the invisible visible — this is one of its core maintenance benefits.</span>
            </div>
            <button type="button" id="ws3-qot-refresh" class="btn btn-xs btn-ghost">↺ Refresh from sensor</button>
          </div>
        </div>
        <!-- Teach buttons -->
        <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-3">
          <p class="text-xs font-semibold text-base-content">Teach Mode — Auto-set Threshold</p>
          <p class="text-xs text-base-content/80 leading-relaxed">Instead of manually guessing a SP1 value with the slider, <strong>Teach Mode</strong> lets the sensor measure its own environment and set the threshold automatically. This is the correct way to commission a capacitive sensor on a real installation.</p>
          <div class="rounded bg-base-300/60 p-2 space-y-1.5 text-xs text-base-content/70">
            <p class="font-semibold text-base-content mb-1">How to use it:</p>
            <p><span class="font-mono text-warning">1.</span> Place the target material at the exact detection point (e.g. hold your hand where you want the sensor to just trip).</p>
            <p><span class="font-mono text-warning">2.</span> Click <strong>Start Teach</strong> — the sensor enters teach mode and begins sampling the field.</p>
            <p><span class="font-mono text-warning">3.</span> Hold steady for 2–3 seconds, then click <strong>Stop Teach</strong>. The sensor calculates and writes a new SP1 value based on what it measured.</p>
            <p><span class="font-mono text-warning">4.</span> Click <strong>↺ Refresh</strong> above to read back the new SP1 and QoT — a good teach should give QoT &gt; 150.</p>
          </div>
          <p class="text-xs text-base-content/60">Use <strong>Cancel</strong> if you started by mistake or want to abort without changing SP1.</p>
          <div class="flex flex-wrap gap-2">
            <button type="button" id="ws3-teach-start" class="btn btn-xs btn-warning">Start Teach</button>
            <button type="button" id="ws3-teach-stop" class="btn btn-xs btn-success">Stop Teach</button>
            <button type="button" id="ws3-teach-cancel" class="btn btn-xs btn-ghost">Cancel</button>
          </div>
          <span id="ws3-teach-status" class="text-xs"></span>
        </div>
      </div>

      <!-- Task: detect 5 times -->
      <div class="rounded-lg border border-success/30 bg-success/5 p-3 mt-3">
        <p class="font-semibold text-base-content text-sm mb-2">🎯 Task: touch the sensor face 5 times</p>
        <div class="flex items-center gap-3">
          <progress id="ws3-task-progress" class="progress progress-success w-full" value="0" max="5"></progress>
          <span id="ws3-task-count" class="text-sm font-mono font-bold text-base-content whitespace-nowrap">0 / 5</span>
        </div>
        <p id="ws3-task-done" class="hidden text-success text-sm font-bold mt-1">✓ Task complete!</p>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> Watch the detection counter as you touch the sensor. What triggers a new count?</p>
      <div class="space-y-2 mt-1" data-correct="c">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q1" value="a" class="radio radio-sm radio-secondary"> Every second while your hand is touching</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q1" value="b" class="radio radio-sm radio-secondary"> Only when you pull your hand away</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q1" value="c" class="radio radio-sm radio-secondary"> The moment detection goes from off to on — one touch = one count, no matter how long you hold it</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> Which pair of materials can a capacitive sensor detect that a photoelectric sensor cannot?</p>
      <div class="space-y-2 mt-1" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q2" value="a" class="radio radio-sm radio-secondary"> Water and powder — even through a container wall</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q2" value="b" class="radio radio-sm radio-secondary"> Sound and light</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q2" value="c" class="radio radio-sm radio-secondary"> Heat and pressure</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> The capacitive sensor output is always ON even when nothing is near it. What is the most likely cause?</p>
      <div class="space-y-2 mt-1" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q3" value="a" class="radio radio-sm radio-secondary"> Sensitivity too high — it is detecting the container wall or nearby objects</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q3" value="b" class="radio radio-sm radio-secondary"> The sensor needs replacing immediately</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q3" value="c" class="radio radio-sm radio-secondary"> The cable is the wrong colour</label>
      </div>

      <div class="divider my-2"></div>

      <div class="space-y-2 mt-4">
        <p class="font-bold text-base-content text-base">🔧 Commissioning Scenario — Replacement Sensor Not Configured</p>
        <p class="text-sm text-base-content/80">A very common real-world task: a colleague has fitted a new spare sensor, but stores sensors arrive with factory-default parameters and no site-specific calibration. The line cannot restart until the sensor is properly commissioned. Your job is to read the factory state, run a teach procedure at the correct detection point, and sign off the sensor ready for service.</p>
      </div>

      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-3 space-y-3" id="ws4-challenge-box">

        <!-- Title bar -->
        <div class="flex items-center gap-2">
          <div id="ws4-hdr-dot" class="w-3 h-3 rounded-full bg-base-300 flex-shrink-0 transition-all"></div>
          <p class="font-bold text-base-content text-sm">Commissioning Scenario</p>
          <span id="ws4-hdr-status" class="text-xs font-mono ml-auto text-base-content/50"></span>
        </div>

        <!-- Job context -->
        <div class="rounded-lg bg-base-300/50 p-3 text-sm text-base-content/80 border border-base-300 space-y-1">
          <p><strong>Job ticket #WO-4412:</strong> New capacitive sensor fitted on Port 2 by day shift to replace a failed unit. Sensor has factory defaults only — line 3 cannot restart until it is commissioned and signed off. Teach the sensor for this hopper installation.</p>
          <p class="text-xs text-base-content/60 mt-1"><strong>Engineer's note:</strong> Teach with the target material at the detection point — just within sensing range, not pressed against the sensor face. Teaching at full contact (100% dielectric) sets SP1 too low and risks false triggers from the container wall. Teaching too far away (very low dielectric) risks missed detections. A good commission gives QoT above 150 and QoR above 100 during normal detection.</p>
        </div>

        <!-- Always-visible HMI live panel -->
        <div class="rounded-lg bg-base-200 border border-base-300 p-3">
          <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">Port 2 — Live Process Data</p>
          <div class="flex items-center gap-2">
            <span class="text-xs text-base-content/60">Detection:</span>
            <span id="ws4-hmi-det" class="font-bold font-mono text-xs text-base-content/40">—</span>
          </div>
        </div>

        <!-- Step cards — always visible, locked/unlocked by JS -->
        <div class="space-y-2">

          <!-- Step 1: Read factory state -->
          <div id="ws4-ms-step1" class="rounded-lg border border-warning/50 bg-warning/5 p-3 space-y-2 transition-all">
            <div class="flex items-center gap-2">
              <span class="ws4-snum w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-warning text-warning-content">1</span>
              <p class="font-semibold text-sm">Read Factory State</p>
              <span class="ws4-sbadge ml-auto hidden text-xs font-mono text-success font-bold">✓ done</span>
            </div>
            <p class="text-sm text-base-content/70">Before touching anything, document the before-state. Read the current SP1 and QoT values from the sensor — this confirms it arrived from stores uncalibrated (QoT = 0, SP1 at factory default).</p>
            <button type="button" id="ws4-ms-read-btn" class="btn btn-info btn-sm font-mono">📖 Read SP1 &amp; QoT from device</button>
            <div id="ws4-ms-read-result" class="hidden rounded bg-base-200 border border-base-300 p-3 space-y-1 font-mono text-xs">
              <p class="text-base-content/50 uppercase tracking-widest mb-1">ISDU READ — Port 2 · factory state</p>
              <p>SP1 (Index 0x3C / Sub 1): <span id="ws4-ms-read-sp1" class="text-warning font-bold">—</span></p>
              <p>QoT (Index 0x4B / Sub 0): <span id="ws4-ms-read-qot" class="text-warning font-bold">—</span></p>
              <p id="ws4-ms-read-interp" class="text-base-content/60 font-sans mt-1">—</p>
            </div>
            <button type="button" id="ws4-ms-read-next" class="hidden btn btn-primary btn-sm w-full font-mono">Factory state documented — proceed to teach →</button>
          </div>

          <!-- Step 2: Commission — Teach -->
          <div id="ws4-ms-step2" class="rounded-lg border border-base-300 bg-base-200/50 p-3 space-y-2 opacity-50 pointer-events-none transition-all">
            <div class="flex items-center gap-2">
              <span class="ws4-snum w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-base-300 text-base-content/40">2</span>
              <p class="font-semibold text-sm">Commission — Teach the Sensor</p>
              <span class="ws4-sbadge ml-auto hidden text-xs font-mono text-success font-bold">✓ done</span>
            </div>
            <p class="text-sm text-base-content/80">Hold the target material at the correct detection point, then click <strong>Teach Start</strong>. Keep it steady for 2–3 seconds, then click <strong>Teach Stop</strong>. The sensor samples the dielectric field and sets SP1 automatically. Check QoT afterwards — it should be above 150.</p>
            <!-- Live dielectric bar -->
            <div class="rounded bg-base-300/60 p-2">
              <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">Live Dielectric Level</p>
              <div class="relative w-full h-4 rounded-full bg-base-300 overflow-hidden mb-1">
                <div id="ws4-diel-fill" class="absolute top-0 left-0 h-full rounded-full bg-secondary" style="width:0%;transition:width 0.3s"></div>
                <div id="ws4-diel-sp1-line" class="absolute top-0 bottom-0 w-0.5 bg-warning hidden" style="left:50%"></div>
              </div>
              <div class="flex justify-between text-xs font-mono">
                <span class="text-base-content/40">0</span>
                <span class="text-base-content/70">Dielectric: <span id="ws4-diel-val" class="font-bold text-secondary">—</span> &nbsp;·&nbsp; SP1: <span id="ws4-diel-sp1-val" class="font-bold text-warning">—</span></span>
                <span class="text-base-content/40">10000</span>
              </div>
            </div>
            <div class="flex gap-2 flex-wrap">
              <button type="button" id="ws4-teach-start" class="btn btn-warning btn-sm flex-1 font-mono">▶ Teach Start</button>
              <button type="button" id="ws4-teach-stop"  class="btn btn-success btn-sm flex-1 font-mono">■ Teach Stop</button>
              <button type="button" id="ws4-teach-cancel" class="btn btn-ghost btn-sm flex-1 font-mono">✕ Cancel</button>
            </div>
            <div id="ws4-teach-status" class="text-xs font-mono text-base-content/50"></div>
            <div id="ws4-teach-result" class="hidden rounded bg-base-200 border border-base-300 p-3 space-y-1 font-mono text-xs">
              <p class="text-base-content/50 uppercase tracking-widest mb-1">ISDU READ — post-teach</p>
              <p>New SP1: <span id="ws4-teach-sp1-val" class="font-bold">—</span></p>
              <p>QoT: <span id="ws4-teach-qot-val" class="font-bold">—</span></p>
              <p id="ws4-teach-interp" class="text-base-content/60 font-sans mt-1">—</p>
            </div>
            <button type="button" id="ws4-ms-teach-next" class="hidden btn btn-primary btn-sm w-full font-mono">Teach complete — proceed to function test →</button>
          </div>

          <!-- Step 3: Function test -->
          <div id="ws4-ms-step3" class="rounded-lg border border-base-300 bg-base-200/50 p-3 space-y-2 opacity-50 pointer-events-none transition-all">
            <div class="flex items-center gap-2">
              <span class="ws4-snum w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-base-300 text-base-content/40">3</span>
              <p class="font-semibold text-sm">Function Test</p>
              <span class="ws4-sbadge ml-auto hidden text-xs font-mono text-success font-bold">✓ done</span>
            </div>
            <p class="text-sm text-base-content/80">Two-part test: first hold the target at the detection point for 3 seconds to confirm the output triggers, then remove it and hold clear for 3 seconds to confirm it resets.</p>
            <div class="rounded bg-base-300/60 p-2">
              <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1.5">Live output</p>
              <div class="flex items-center gap-2">
                <div id="ws4-vfy-dot" class="w-3 h-3 rounded-full bg-base-300 flex-shrink-0 transition-all"></div>
                <span class="text-xs text-base-content/60">Detection:</span>
                <span id="ws4-vfy-det" class="font-bold font-mono text-xs">—</span>
              </div>
            </div>
            <div class="space-y-1">
              <div class="flex justify-between text-xs text-base-content/60">
                <span id="ws4-ms-vfy-bar-label">Part 1 of 2: bring target to detection point…</span>
                <span id="ws4-ms-vfy-pct">0%</span>
              </div>
              <progress id="ws4-ms-vfy-bar" class="progress progress-success w-full" value="0" max="100"></progress>
              <p class="text-xs font-mono text-base-content/50 text-right"><span id="ws4-ms-vfy-timer">0.0</span>s / 3.0s</p>
            </div>
          </div>

          <!-- Step 4: Sign-off -->
          <div id="ws4-ms-step4" class="rounded-lg border border-base-300 bg-base-200/50 p-3 space-y-2 opacity-50 pointer-events-none transition-all">
            <div class="flex items-center gap-2">
              <span class="ws4-snum w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-base-300 text-base-content/40">4</span>
              <p class="font-semibold text-sm">Sign-Off &amp; Close Job Ticket</p>
            </div>
            <div class="space-y-2">
              <label class="flex items-start gap-2 cursor-pointer text-sm">
                <input type="checkbox" id="ws4-ms-ck1" class="checkbox checkbox-success checkbox-sm mt-0.5 flex-shrink-0">
                <span>Factory state read and documented — SP1 at default, QoT = 0 (no prior teach)</span>
              </label>
              <label class="flex items-start gap-2 cursor-pointer text-sm">
                <input type="checkbox" id="ws4-ms-ck2" class="checkbox checkbox-success checkbox-sm mt-0.5 flex-shrink-0">
                <span>Teach completed with target at detection point — QoT above 150, SP1 set for this installation</span>
              </label>
              <label class="flex items-start gap-2 cursor-pointer text-sm">
                <input type="checkbox" id="ws4-ms-ck3" class="checkbox checkbox-success checkbox-sm mt-0.5 flex-shrink-0">
                <span>Function test passed — output ON for 3 s with target present, output OFF for 3 s when clear</span>
              </label>
            </div>
            <button type="button" id="ws4-ms-close-btn" class="btn btn-success btn-sm w-full font-mono" disabled>✓ Close &amp; Complete — Work Order #WO-4412</button>
          </div>

        </div><!-- end step cards -->

        <!-- Completion message -->
        <div id="ws4-ch-result" class="hidden"></div>

        <!-- Reset -->
        <div class="flex justify-end mt-1">
          <button type="button" id="ws4-ch-reset" class="btn btn-xs btn-ghost text-base-content/40">↺ Reset scenario</button>
        </div>

      </div>
    `
  },
  {
    id: 5,
    title: 'The Temperature Sensor',
    shortDesc: 'Measuring process temperature — Port 3.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'Temperature sensors on IO-Link don\'t just give you an alarm when it\'s too hot — they send back the actual temperature value in real time. That means you can spot a machine heating up before it trips.',
    relatedDashboard: 'Dashboard: Port 3 — IFM TV7105',
    prerequisites: 'Complete Worksheet 1 first',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">The IFM TV7105 is a PT100 temperature sensor. PT100 stands for a platinum sensing element with a resistance of 100 Ω at 0 °C — that resistance changes with temperature, and the sensor converts it into a live °C reading sent through IO-Link every second.</p>

      <!-- Three-way comparison -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-4 mt-3 space-y-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Temperature sensing — three approaches</p>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
          <div class="rounded-lg border border-base-300 bg-base-100 p-3 space-y-1">
            <p class="font-bold text-base-content">Digital switch</p>
            <p class="text-xs text-base-content/60 font-mono">e.g. bimetallic thermostat</p>
            <p class="text-base-content/70 mt-1">One bit — ON or OFF. Tells you when a threshold is crossed, nothing more. No actual temperature value, no remote adjustment.</p>
          </div>
          <div class="rounded-lg border border-base-300 bg-base-100 p-3 space-y-1">
            <p class="font-bold text-base-content">Analogue (4–20 mA)</p>
            <p class="text-xs text-base-content/60 font-mono">e.g. 4–20 mA PT100 transmitter</p>
            <p class="text-base-content/70 mt-1">Sends the actual temperature as a current signal. Better — but one-way only. You can read the value, but you cannot write setpoints, read diagnostics, or identify the sensor remotely.</p>
          </div>
          <div class="rounded-lg border border-success/30 bg-success/5 p-3 space-y-1">
            <p class="font-bold text-base-content">IO-Link (TV7105)</p>
            <p class="text-xs text-success/70 font-mono">bidirectional digital</p>
            <p class="text-base-content/70 mt-1">Sends the actual temperature <em>and</em> lets you read alarm setpoints, write calibration corrections, check device identity, and retrieve diagnostics — all over the same standard 3-wire cable, without wiring changes.</p>
          </div>
        </div>
      </div>

      <!-- WS5 SVG diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">How it works — from resistance to live reading</p>
        <svg viewBox="0 0 580 205" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">

          <!-- Step labels -->
          <text x="57"  y="11" text-anchor="middle" fill="#64748b" font-size="7" font-weight="600">1. PT100 ELEMENT</text>
          <text x="212" y="11" text-anchor="middle" fill="#64748b" font-size="7" font-weight="600">2. INSIDE THE SENSOR</text>
          <text x="390" y="11" text-anchor="middle" fill="#64748b" font-size="7" font-weight="600">3. IO-LINK</text>
          <text x="506" y="11" text-anchor="middle" fill="#64748b" font-size="7" font-weight="600">4. DASHBOARD</text>

          <!-- ── 1. PT100 element ── -->
          <rect x="4" y="16" width="108" height="152" rx="7" fill="#0f172a" stroke="#334155" stroke-width="1.2"/>
          <rect x="14" y="28" width="88" height="30" rx="4" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
          <text x="58" y="42" text-anchor="middle" fill="#93c5fd" font-size="9" font-weight="700">PT100</text>
          <text x="58" y="53" text-anchor="middle" fill="#60a5fa" font-size="6.5">platinum element</text>
          <text x="58" y="75" text-anchor="middle" fill="#475569" font-size="6.5">Temperature → Resistance</text>
          <text x="18" y="89"  fill="#94a3b8" font-size="7.5">  0 °C</text><text x="100" y="89"  fill="#94a3b8" font-size="7.5" text-anchor="end">100.0 Ω</text>
          <text x="18" y="101" fill="#94a3b8" font-size="7.5"> 25 °C</text><text x="100" y="101" fill="#94a3b8" font-size="7.5" text-anchor="end">109.6 Ω</text>
          <text x="18" y="113" fill="#94a3b8" font-size="7.5"> 60 °C</text><text x="100" y="113" fill="#94a3b8" font-size="7.5" text-anchor="end">123.1 Ω</text>
          <text x="18" y="125" fill="#94a3b8" font-size="7.5">100 °C</text><text x="100" y="125" fill="#94a3b8" font-size="7.5" text-anchor="end">138.5 Ω</text>
          <text x="58" y="148" text-anchor="middle" fill="#334155" font-size="6.5">+0.385 Ω per °C</text>
          <!-- Arrow to section 2 -->
          <polygon points="112,84 122,89 112,94" fill="#3b82f6"/>

          <!-- Divider 1 -->
          <line x1="123" y1="13" x2="123" y2="173" stroke="#334155" stroke-width="0.8" stroke-dasharray="3,3"/>

          <!-- ── 2. Inside the sensor ── -->
          <rect x="126" y="16" width="242" height="152" rx="7" fill="#0f172a" stroke="#334155" stroke-width="1.2"/>

          <!-- Sub-box: R → °C conversion -->
          <rect x="134" y="26" width="94" height="34" rx="5" fill="#1e293b" stroke="#7c3aed" stroke-width="1.2"/>
          <text x="181" y="40" text-anchor="middle" fill="#c4b5fd" font-size="8" font-weight="700">R → °C</text>
          <text x="181" y="52" text-anchor="middle" fill="#8b5cf6" font-size="6.5">linearise + convert</text>

          <!-- Mini arrow between sub-boxes -->
          <polygon points="228,40 238,44 228,48" fill="#475569"/>

          <!-- Sub-box: SP alarm check -->
          <rect x="240" y="22" width="118" height="98" rx="5" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
          <text x="299" y="34" text-anchor="middle" fill="#64748b" font-size="6.5">Compare vs SP1 / SP2</text>

          <!-- Compact thermometer -->
          <rect x="248" y="40" width="12" height="68" rx="6" fill="#0f172a" stroke="#475569" stroke-width="1"/>
          <!-- Fill (current temp in normal zone, below SP1) -->
          <rect x="251" y="86" width="6" height="18" rx="3" fill="#f97316"/>
          <circle cx="254" cy="112" r="7" fill="#ef4444"/>
          <!-- SP2 line at boundary of danger/warning -->
          <line x1="247" y1="56" x2="260" y2="56" stroke="#ef4444" stroke-width="0.9" stroke-dasharray="2,2"/>
          <!-- SP1 line at boundary of warning/normal -->
          <line x1="247" y1="74" x2="260" y2="74" stroke="#f59e0b" stroke-width="0.9" stroke-dasharray="2,2"/>
          <!-- Current temp tick -->
          <line x1="247" y1="86" x2="261" y2="86" stroke="white" stroke-width="1.5"/>

          <!-- Zone colour bands -->
          <rect x="262" y="40" width="30" height="16" rx="2" fill="#dc2626" opacity="0.85"/>
          <text x="277" y="50" text-anchor="middle" fill="white" font-size="6" font-weight="700">Danger</text>
          <rect x="262" y="57" width="30" height="17" rx="2" fill="#d97706" opacity="0.85"/>
          <text x="277" y="68" text-anchor="middle" fill="white" font-size="6" font-weight="700">Warning</text>
          <rect x="262" y="75" width="30" height="17" rx="2" fill="#16a34a" opacity="0.85"/>
          <text x="277" y="86" text-anchor="middle" fill="white" font-size="6" font-weight="700">Normal</text>

          <!-- SP labels -->
          <text x="295" y="59" fill="#ef4444" font-size="6.5" font-weight="600">← SP2</text>
          <text x="295" y="77" fill="#f59e0b" font-size="6.5" font-weight="600">← SP1</text>
          <!-- Current value -->
          <text x="295" y="92" fill="#f97316" font-size="7.5" font-weight="700">23.4 °C ✓</text>
          <text x="295" y="103" fill="#4ade80" font-size="6.5">below SP1</text>
          <text x="295" y="113" fill="#4ade80" font-size="6.5">no alarm</text>

          <!-- PDin assembled row -->
          <text x="247" y="134" text-anchor="middle" fill="#475569" font-size="6.5">PDin payload assembled inside sensor:</text>
          <rect x="134" y="138" width="224" height="20" rx="4" fill="#1e3a5f" stroke="#3b82f6" stroke-width="0.8"/>
          <text x="175" y="152" fill="#93c5fd" font-size="9" font-weight="700">23.4 °C</text>
          <text x="252" y="152" fill="#475569" font-size="7"> | OUT1: 0  | OUT2: 0</text>

          <!-- Arrow to IO-Link -->
          <polygon points="368,84 378,89 368,94" fill="#3b82f6"/>

          <!-- Divider 2 -->
          <line x1="370" y1="13" x2="370" y2="173" stroke="#334155" stroke-width="0.8" stroke-dasharray="3,3"/>

          <!-- ── 3. IO-Link cable ── -->
          <line x1="370" y1="83" x2="432" y2="83" stroke="#3b82f6" stroke-width="2.5"/>
          <line x1="370" y1="90" x2="432" y2="90" stroke="#334155" stroke-width="2.5"/>
          <line x1="370" y1="97" x2="432" y2="97" stroke="#dc2626" stroke-width="2.5"/>
          <text x="401" y="78" text-anchor="middle" fill="#475569" font-size="6.5">3-wire M12</text>
          <!-- Data packet -->
          <rect x="374" y="68" width="54" height="19" rx="5" fill="#ea580c"/>
          <text x="401" y="82" text-anchor="middle" fill="white" font-size="9.5" font-weight="800">23.4 °C</text>
          <!-- Arrow to dashboard -->
          <polygon points="422,83 434,90 422,97" fill="#ea580c"/>
          <text x="401" y="112" text-anchor="middle" fill="#f97316" font-size="7" font-weight="600">every second</text>

          <!-- Divider 3 -->
          <line x1="436" y1="13" x2="436" y2="173" stroke="#334155" stroke-width="0.8" stroke-dasharray="3,3"/>

          <!-- ── 4. Dashboard ── -->
          <rect x="439" y="16" width="137" height="152" rx="8" fill="#0f172a" stroke="#1e3a5f" stroke-width="1.5"/>
          <text x="507" y="68" text-anchor="middle" fill="#f97316" font-size="30" font-weight="900">23.4</text>
          <text x="507" y="86" text-anchor="middle" fill="#64748b" font-size="10">°C</text>
          <circle cx="450" cy="106" r="5" fill="#16a34a"/>
          <text x="460" y="110" fill="#4ade80" font-size="8">SP1 — clear</text>
          <circle cx="450" cy="122" r="5" fill="#16a34a"/>
          <text x="460" y="126" fill="#4ade80" font-size="8">SP2 — clear</text>
          <rect x="506" y="100" width="58" height="14" rx="5" fill="#16a34a"/>
          <text x="535" y="111" text-anchor="middle" fill="white" font-size="8" font-weight="700">● LIVE</text>
          <text x="507" y="157" text-anchor="middle" fill="#1e3a5f" font-size="7">IO-Link Master + Dashboard</text>

          <!-- Bottom captions -->
          <text x="57"  y="194" text-anchor="middle" fill="#475569" font-size="7">resistance changes with temp</text>
          <text x="247" y="194" text-anchor="middle" fill="#475569" font-size="7">sensor converts R→°C, checks alarms — all internally</text>
          <text x="401" y="194" text-anchor="middle" fill="#475569" font-size="7">transmits live</text>
          <text x="507" y="194" text-anchor="middle" fill="#475569" font-size="7">shows on dashboard</text>
        </svg>
      </div>

      <!-- TV7105 info box -->
      <div class="rounded-lg border border-info/30 bg-info/5 p-3 mt-3 text-sm space-y-1">
        <p class="font-bold text-base-content">What IO-Link adds to a temperature sensor</p>
        <ul class="list-disc list-inside mt-1 space-y-1 text-base-content/80">
          <li><strong>Live °C value every second</strong> — not just an alarm output. You can see exactly how hot the asset is running.</li>
          <li><strong>Two alarm setpoints (SP1 and SP2)</strong> stored inside the sensor — they stay set even when the power is off or the sensor is unplugged.</li>
          <li><strong>Calibration offset</strong> — if the reading is slightly off compared to a reference thermometer, you can trim it remotely via IO-Link without removing the sensor.</li>
          <li><strong>−40 °C reading at normal temperature</strong> — this means the sensing element is broken or the cable is open. Check the connector before ordering a replacement.</li>
        </ul>
      </div>

      <!-- Live section -->
      <div class="rounded-xl border-2 border-warning/40 bg-warning/5 p-4 mt-3 space-y-3" id="ws4-live-panel">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="font-semibold text-base-content text-sm">Port 3 — Live Temperature</span>
          <span id="ws4-live-badge" class="badge badge-xs badge-ghost font-mono">OFFLINE</span>
        </div>

        <!-- Big temp display + outputs -->
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 flex flex-col items-center gap-1">
            <p id="ws4-temp-display" class="text-4xl font-black font-mono text-warning leading-none">—</p>
            <p class="text-xs text-base-content/50 mt-1">°C</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 flex flex-col gap-2 justify-center">
            <div class="flex items-center gap-2 text-sm">
              <span id="ws4-out1-dot" class="w-3 h-3 rounded-full bg-base-300"></span>
              <span class="text-base-content/70">SP1 output</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <span id="ws4-out2-dot" class="w-3 h-3 rounded-full bg-base-300"></span>
              <span class="text-base-content/70">SP2 output</span>
            </div>
            <p id="ws4-alarm-status" class="text-xs font-semibold text-base-content/60">No alarm</p>
          </div>
        </div>

        <!-- Chart -->
        <div class="space-y-1">
          <p class="text-xs text-base-content/60 font-medium uppercase tracking-wide">Temperature trend (last 60 samples)</p>
          <div style="height:100px; position:relative;"><canvas id="ws4-chart"></canvas></div>
        </div>

        <!-- Hysteresis explainer -->
        <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-2">
          <p class="text-sm font-semibold text-base-content">Switch Points, Reset Points and Hysteresis</p>
          <p class="text-xs text-base-content/70 leading-relaxed">Each output has two values: a <strong>Switch Point (SP)</strong> and a <strong>Reset Point (RP)</strong>. The temperature must rise <em>above</em> SP to turn the output ON. The output then stays ON even as the temperature drops — it won't turn OFF again until the temperature falls <em>below</em> RP.</p>
          <div class="grid grid-cols-3 gap-2 text-xs text-center mt-1">
            <div class="rounded bg-success/10 border border-success/30 p-2">
              <p class="font-bold text-success">Below RP</p>
              <p class="text-base-content/60 mt-1">Output OFF<br>Normal running</p>
            </div>
            <div class="rounded bg-warning/10 border border-warning/30 p-2">
              <p class="font-bold text-warning">RP → SP zone</p>
              <p class="text-base-content/60 mt-1">Output holds its state<br>(hysteresis zone)</p>
            </div>
            <div class="rounded bg-error/10 border border-error/30 p-2">
              <p class="font-bold text-error">Above SP</p>
              <p class="text-base-content/60 mt-1">Output ON<br>Alarm active</p>
            </div>
          </div>
          <p class="text-xs text-base-content/50 leading-relaxed">The gap between RP and SP is called <strong>hysteresis</strong>. It prevents the alarm chattering ON and OFF if the temperature hovers near the setpoint. <strong>SP must always be set above RP</strong> — the sensor will reject any write that violates this rule.</p>
        </div>

        <!-- SP1 / RP1 -->
        <div class="rounded-lg bg-base-200 border border-error/30 p-3 space-y-2">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold text-base-content">OUT1 — Switch Point (SP1)</p>
              <span class="badge badge-error badge-sm font-bold">ALARM</span>
            </div>
            <span id="ws4-slider-val" class="font-mono font-bold text-error text-sm">—</span>
          </div>
          <p class="text-xs text-base-content/50">OUT1 switches ON when temperature rises above SP1. Must be set above RP1.</p>
          <input type="range" id="ws4-alarm-slider" min="-50" max="150" value="80" step="1" class="range range-error range-sm w-full">
          <div class="flex justify-between text-xs text-base-content/40"><span>−50°C</span><span>150°C</span></div>
          <p id="ws4-alarm-state" class="text-sm font-bold text-base-content/60">Set a threshold above, then warm the sensor</p>
          <div class="flex items-center gap-2 mt-1 flex-wrap">
            <button type="button" id="ws4-sp1-write" class="btn btn-xs btn-error">Write SP1</button>
            <span id="ws4-sp1-status" class="text-xs"></span>
          </div>
          <p class="text-xs text-base-content/40 font-mono">Device SP1: <span id="ws4-sp1-actual" class="text-base-content/60">reading…</span></p>

          <div class="divider my-1 text-xs text-base-content/30">Reset Point</div>

          <div class="flex items-center justify-between flex-wrap gap-2">
            <p class="text-xs font-semibold text-base-content/70">RP1 — Reset Point</p>
            <span id="ws4-rp1-slider-val" class="font-mono text-xs text-base-content/60">—</span>
          </div>
          <p class="text-xs text-base-content/50">OUT1 switches OFF when temperature falls back below RP1. Always set below SP1.</p>
          <input type="range" id="ws4-rp1-slider" min="-50" max="150" value="50" step="1" class="range range-sm w-full">
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" id="ws4-rp1-write" class="btn btn-xs btn-outline btn-error">Write RP1</button>
            <span id="ws4-rp1-status" class="text-xs"></span>
          </div>
          <p class="text-xs text-base-content/40 font-mono">Device RP1: <span id="ws4-rp1-actual" class="text-base-content/60">reading…</span></p>
        </div>

        <!-- SP2 / RP2 -->
        <div class="rounded-lg bg-base-200 border border-warning/30 p-3 space-y-2">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold text-base-content">OUT2 — Switch Point (SP2)</p>
              <span class="badge badge-warning badge-sm font-bold">PRE-WARNING</span>
            </div>
            <span id="ws4-sp2-slider-val" class="font-mono font-bold text-warning text-sm">—</span>
          </div>
          <p class="text-xs text-base-content/50">OUT2 switches ON when temperature rises above SP2. Must be set above RP2.</p>
          <input type="range" id="ws4-sp2-slider" min="-50" max="150" value="50" step="1" class="range range-warning range-sm w-full">
          <div class="flex justify-between text-xs text-base-content/40"><span>−50°C</span><span>150°C</span></div>
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" id="ws4-sp2-write" class="btn btn-xs btn-warning">Write SP2</button>
            <span id="ws4-sp2-status" class="text-xs"></span>
          </div>
          <p class="text-xs text-base-content/40 font-mono">Device SP2: <span id="ws4-sp2-actual" class="text-base-content/60">reading…</span></p>

          <div class="divider my-1 text-xs text-base-content/30">Reset Point</div>

          <div class="flex items-center justify-between flex-wrap gap-2">
            <p class="text-xs font-semibold text-base-content/70">RP2 — Reset Point</p>
            <span id="ws4-rp2-slider-val" class="font-mono text-xs text-base-content/60">—</span>
          </div>
          <p class="text-xs text-base-content/50">OUT2 switches OFF when temperature falls back below RP2. Always set below SP2.</p>
          <input type="range" id="ws4-rp2-slider" min="-50" max="150" value="40" step="1" class="range range-sm w-full">
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" id="ws4-rp2-write" class="btn btn-xs btn-outline btn-warning">Write RP2</button>
            <span id="ws4-rp2-status" class="text-xs"></span>
          </div>
          <p class="text-xs text-base-content/40 font-mono">Device RP2: <span id="ws4-rp2-actual" class="text-base-content/60">reading…</span></p>
        </div>
      </div>

      <!-- Task: warm the sensor -->
      <div class="rounded-lg border border-success/30 bg-success/5 p-3 mt-3">
        <p class="font-semibold text-base-content text-sm mb-1">🎯 Task: warm the sensor by 2 °C</p>
        <p class="text-xs text-base-content/60 mb-2">Hold the sensor between your palms. Watch the chart rise above the baseline.</p>
        <div class="flex items-center gap-3">
          <progress id="ws4-warm-progress" class="progress progress-warning w-full" value="0" max="100"></progress>
          <span id="ws4-warm-label" class="text-sm font-mono font-bold text-base-content whitespace-nowrap">+0.0°C</span>
        </div>
        <p id="ws4-warm-done" class="hidden text-success text-sm font-bold mt-1">✓ Task complete — you warmed it by 2°C!</p>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> A basic temperature switch gives you one output — too hot = trip. What extra can you do with an IO-Link temperature sensor?</p>
      <div class="space-y-2 mt-1" data-correct="c">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q1" value="a" class="radio radio-sm radio-warning"> Nothing extra — it works exactly the same as a switch</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q1" value="b" class="radio radio-sm radio-warning"> It only works at high temperatures above 100 °C</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q1" value="c" class="radio radio-sm radio-warning"> See the actual live temperature in °C, trend it over time, and get early warning before the trip point is reached</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> Move the SP1 slider just above the current temperature, then hold the sensor in your hands for 30 seconds. What should happen to the alarm state?</p>
      <div class="space-y-2 mt-1" data-correct="b">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q2" value="a" class="radio radio-sm radio-warning"> Nothing changes — the alarm only activates from the main dashboard</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q2" value="b" class="radio radio-sm radio-warning"> The alarm state turns red and shows "ABOVE THRESHOLD" once the temperature crosses your slider value</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q2" value="c" class="radio radio-sm radio-warning"> The sensor turns itself off to prevent overheating</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> The temperature reading suddenly drops to −40 °C in a room-temperature lab. What is the most likely cause?</p>
      <div class="space-y-2 mt-1" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q3" value="a" class="radio radio-sm radio-warning"> Broken or disconnected sensor — −40 °C is the bottom of the TV7105 measurement range and appears when the sensing element is open-circuit</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q3" value="b" class="radio radio-sm radio-warning"> The lab is very cold</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q3" value="c" class="radio radio-sm radio-warning"> The setpoint has been changed</label>
      </div>

      <div class="divider my-2"></div>

      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3" id="ws5-challenge-box">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <p class="font-bold text-base-content text-base">🎯 Challenge</p>
          <button type="button" id="ws5-ch-start" class="btn btn-warning btn-sm">Start Challenge</button>
        </div>
        <p class="text-sm text-base-content/80">Set the SP1 alarm setpoint to just 1–2°C above the current temperature, write it to the sensor, then warm the sensor in your palms until the SP1 output activates.</p>

        <!-- Challenge body — hidden until Start is clicked -->
        <div id="ws5-ch-body" class="hidden space-y-3">

          <!-- Inline SP1 slider -->
          <div class="rounded-lg bg-base-200 border border-error/30 p-3 space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold text-base-content">SP1 <span class="badge badge-error badge-xs">ALARM</span></p>
              <span id="ws5-ch-sp1-val" class="font-mono font-bold text-error text-sm">—</span>
            </div>
            <input type="range" id="ws5-ch-sp1-slider" min="-50" max="150" value="31" step="1" class="range range-error range-xs w-full">
            <div class="flex justify-between text-xs text-base-content/40"><span>−50°C</span><span>150°C</span></div>
            <div class="flex items-center gap-2 flex-wrap">
              <button type="button" id="ws5-ch-sp1-write" class="btn btn-xs btn-error">Write SP1 to sensor</button>
              <span id="ws5-ch-sp1-status" class="text-xs"></span>
            </div>
          </div>

          <!-- Live readout -->
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg bg-base-200 border border-base-300 p-3 text-center space-y-1">
              <p class="text-xs text-base-content/50 font-medium uppercase tracking-wide">Current Temp</p>
              <p id="ws5-ch-temp" class="text-2xl font-black font-mono text-warning">—</p>
              <p class="text-xs text-base-content/50">°C</p>
            </div>
            <div class="rounded-lg bg-base-200 border border-base-300 p-3 text-center space-y-1">
              <p class="text-xs text-base-content/50 font-medium uppercase tracking-wide">SP1 Output</p>
              <div id="ws5-ch-out-dot" class="w-8 h-8 rounded-full bg-base-300 mx-auto transition-all duration-150 shadow-md"></div>
              <p id="ws5-ch-out-label" class="text-xs font-bold text-base-content/60">inactive</p>
            </div>
          </div>

          <div id="ws5-ch-result" class="hidden rounded-lg p-3 text-center font-bold text-sm"></div>
          <div class="flex justify-center">
            <button type="button" id="ws5-ch-reset" class="btn btn-ghost btn-sm gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Reset Challenge
            </button>
          </div>
        </div>
      </div>

      <div class="divider my-2"></div>

      <!-- Calibration drift scenario -->
      <div class="space-y-2 mt-4">
        <p class="font-bold text-base-content text-base">Maintenance Scenario — Calibration Drift</p>
        <p class="text-sm text-base-content/80">Calibration drift is a real maintenance issue — temperature sensors can shift by a degree or two over years of service, or be installed with a slight offset against the process. IO-Link gives you a calibration offset parameter (Index 681) that lets you fine-trim the sensor reading without removing it from the installation. Your job is to diagnose and correct a miscalibrated sensor using acyclic ISDU read and write.</p>
      </div>

      <div class="rounded-xl overflow-hidden mt-3 border border-neutral/60" id="ws5-cal-box">

        <!-- Title bar -->
        <div class="flex items-center justify-between px-3 py-2 bg-neutral border-b border-neutral/40">
          <div class="flex items-center gap-2">
            <div id="ws5-cal-hdr-dot" class="w-2.5 h-2.5 rounded-full bg-base-300 flex-shrink-0"></div>
            <span id="ws5-cal-hdr-status" class="font-mono text-xs font-bold text-neutral-content/50 tracking-widest uppercase">Ready</span>
          </div>
          <span class="font-mono text-xs text-neutral-content/50 hidden sm:block">MOTOR HOUSING — TEMPERATURE — PORT 3</span>
          <span class="font-mono text-xs text-neutral-content/40">CAL-0189</span>
        </div>

        <!-- Job ticket -->
        <div class="bg-neutral/60 px-3 py-3 border-b border-neutral/40">
          <p class="font-mono text-xs text-neutral-content/40 uppercase tracking-widest mb-2">Calibration Work Order — Engineering Dept</p>
          <div class="rounded-lg border border-neutral/40 bg-black/30 p-3 font-mono text-xs space-y-1.5">
            <p class="text-neutral-content/50">REF: CAL-0189 &nbsp;&nbsp; ASSET: TV7105 Port 3 &nbsp;&nbsp; TYPE: Quarterly verification</p>
            <p class="text-neutral-content/30 border-t border-neutral/20 pt-1.5">CALIBRATION CHECK RESULT — FAIL</p>
            <p class="text-neutral-content/80">Sensor checked against Fluke 561 reference at ambient temperature (stable, no draught). TV7105 reads consistently 3.0 °C above reference across three readings. Max permissible error: ±0.5 °C. Sensor fails acceptance criteria.</p>
            <p class="text-neutral-content/80 mt-1">Sensor cannot be removed — it is potted into the motor housing. Correct via IO-Link calibration offset parameter (Index 681, Sub 0). IFM datasheet confirms offset range: −10 °C to +10 °C. Correction required: −3.0 °C.</p>
            <p class="text-warning mt-1">Record before and after values. Update calibration log on completion.</p>
          </div>
        </div>

        <!-- Calibration history table -->
        <div class="bg-neutral px-3 py-2 border-b border-neutral/40">
          <p class="font-mono text-xs text-neutral-content/40 uppercase tracking-widest mb-1.5">Calibration History — Port 3</p>
          <table class="w-full font-mono text-xs border-collapse">
            <tbody>
              <tr class="border-b border-neutral/20">
                <td class="py-1 pr-3 text-neutral-content/40 whitespace-nowrap">Last quarter</td>
                <td class="pr-3 text-success whitespace-nowrap">CAL-PASS</td>
                <td class="text-neutral-content/70">Offset 0.0 °C — within ±0.5 °C of reference</td>
                <td class="pl-2 text-success text-right">✓</td>
              </tr>
              <tr>
                <td class="py-1 pr-3 text-neutral-content/40 whitespace-nowrap">This quarter</td>
                <td class="pr-3 text-error font-semibold whitespace-nowrap">CAL-FAIL</td>
                <td class="text-neutral-content/70">Reads 3.0 °C above Fluke reference — offset correction required</td>
                <td class="pl-2 text-error text-right">✕</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Live process values — HMI panel -->
        <div class="bg-black/50 px-3 py-3 border-b border-neutral/40">
          <div class="flex items-center justify-between mb-2">
            <p class="font-mono text-xs text-neutral-content/40 uppercase tracking-widest">Live Process — Port 3</p>
            <span class="flex items-center gap-1.5 font-mono text-xs text-success"><span class="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block"></span>LIVE</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg border border-warning/30 bg-warning/5 p-3 text-center">
              <p class="font-mono text-xs text-neutral-content/40 uppercase tracking-wider mb-1">Temperature</p>
              <p id="ws5-cal-live-temp" class="text-3xl font-black font-mono text-warning leading-none">—</p>
              <p class="font-mono text-xs text-neutral-content/30 mt-1">°C</p>
            </div>
            <div class="rounded-lg border border-base-content/10 bg-base-content/5 p-3 text-center" id="ws5-cal-offset-card">
              <p class="font-mono text-xs text-neutral-content/40 uppercase tracking-wider mb-1">Cal Offset</p>
              <p id="ws5-cal-live-offset" class="text-3xl font-black font-mono text-neutral-content/40 leading-none">—</p>
              <p class="font-mono text-xs text-neutral-content/30 mt-1">°C</p>
            </div>
          </div>
        </div>

        <!-- Step 0: Start Scenario -->
        <div class="bg-neutral px-3 py-3 border-b border-neutral/40 space-y-3" id="ws5-cal-setup">
          <p class="font-mono text-xs text-neutral-content/40 uppercase tracking-widest">Ready to Investigate</p>
          <p class="text-sm text-neutral-content/80">You have been assigned work order CAL-0189. Click <strong class="text-neutral-content">Start Scenario</strong> to load the calibration fault into the sensor — the calibration offset will be set to +3.0 °C, replicating the drifted sensor described in the work order.</p>
          <div class="flex items-center gap-3 flex-wrap">
            <button type="button" id="ws5-cal-inject-btn" class="btn btn-warning btn-sm gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Start Scenario
            </button>
            <span id="ws5-cal-inject-status" class="text-xs font-mono text-neutral-content/40"></span>
          </div>
        </div>

        <!-- Step 1: Read offset (revealed after inject) -->
        <div id="ws5-cal-observe" class="hidden bg-neutral px-3 py-3 border-b border-neutral/40 space-y-3">
          <p class="font-mono text-xs text-success uppercase tracking-widest">Scenario Active — Step 1: Read the Calibration Offset</p>
          <p class="text-sm text-neutral-content/80">The fault is now live — watch the Live Process Values panel above. Before making any change, read the calibration offset from the sensor via ISDU acyclic read. This documents the before-state for the work order.</p>
          <div class="rounded border border-neutral/40 bg-black/30 p-2 text-xs font-mono text-neutral-content/50 space-y-0.5">
            <p>ISDU READ — Port 3 — Index 681 (0x2A9) / Subindex 0 — Calibration Offset</p>
            <p class="text-neutral-content/30">Range: −10.0 °C to +10.0 °C &nbsp;·&nbsp; Factory default: 0.0 °C &nbsp;·&nbsp; Scale: ×0.1</p>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <button type="button" id="ws5-cal-read-btn" class="btn btn-sm font-mono" style="border:1px solid rgba(59,130,246,0.5);color:#60a5fa;background:transparent">Read Calibration Offset →</button>
            <span id="ws5-cal-read-status" class="text-xs font-mono text-neutral-content/40"></span>
          </div>
          <div id="ws5-cal-read-result" class="hidden rounded-lg border border-info/40 bg-info/10 p-3 font-mono text-xs space-y-2">
            <p class="text-info font-bold uppercase tracking-widest">ISDU Read Response</p>
            <p class="text-neutral-content/70">Port 3 &nbsp;·&nbsp; Index 0x2A9 &nbsp;·&nbsp; Subindex 0</p>
            <div class="flex items-center justify-between border-t border-white/10 pt-2">
              <span class="text-neutral-content/50">Raw hex</span>
              <span id="ws5-cal-read-hex" class="text-warning font-bold">—</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-neutral-content/50">Calibration Offset</span>
              <span class="text-warning font-bold text-base"><span id="ws5-cal-read-val">—</span> °C</span>
            </div>
            <p id="ws5-cal-read-interp" class="text-neutral-content/80 border-t border-white/10 pt-2 leading-relaxed">—</p>
          </div>
          <button type="button" id="ws5-cal-read-next" class="hidden btn btn-sm font-mono" style="border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.5);background:transparent">Before value documented — proceed to diagnosis →</button>
        </div>

        <!-- Step 2: Diagnose (revealed after read) -->
        <div id="ws5-cal-diag" class="hidden bg-neutral px-3 py-3 border-b border-neutral/40 space-y-3">
          <p class="font-mono text-xs text-neutral-content/40 uppercase tracking-widest">Step 2 — Diagnosis</p>
          <p class="text-sm text-neutral-content/80">ISDU read confirms the calibration offset is <strong class="text-warning">+3.0 °C</strong>. The sensor is reporting 3 degrees higher than the true temperature. The work order requires correction to bring the sensor within ±0.5 °C of reference.</p>
          <p class="text-sm font-semibold text-neutral-content">What value do you write to the calibration offset to correct this sensor?</p>
          <div class="flex flex-col gap-2">
            <button type="button" data-ans="wrong-add" class="ws5-cal-diag-btn btn btn-sm font-mono text-left justify-start" style="border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.5);background:transparent">Write +3.0 °C — add 3 degrees to the existing offset</button>
            <button type="button" data-ans="correct" class="ws5-cal-diag-btn btn btn-sm font-mono text-left justify-start" style="border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.5);background:transparent">Write 0.0 °C — restore factory default (no offset)</button>
            <button type="button" data-ans="wrong-neg" class="ws5-cal-diag-btn btn btn-sm font-mono text-left justify-start" style="border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.5);background:transparent">Write −6.0 °C — apply a negative 6-degree correction</button>
          </div>
          <p id="ws5-cal-diag-fb" class="hidden text-sm font-semibold"></p>
        </div>

        <!-- Step 3: Write fix (revealed after correct diagnosis) -->
        <div id="ws5-cal-write" class="hidden bg-neutral px-3 py-3 border-b border-neutral/40 space-y-3">
          <p class="font-mono text-xs text-success uppercase tracking-widest">Diagnosis Confirmed ✓ — Step 3: Write Correction</p>
          <p class="text-sm text-neutral-content/80">Correct. The offset is <strong class="text-warning">+3.0 °C</strong> — the sensor has a 3-degree positive error. Writing <strong class="text-success">0.0 °C</strong> restores the factory default and removes the offset entirely. The sensor will report the true measured temperature.</p>
          <div class="rounded border border-neutral/40 bg-black/30 p-2 text-xs font-mono text-neutral-content/50 space-y-0.5">
            <p>ISDU WRITE — Port 3 — Index 681 (0x2A9) / Subindex 0 — Calibration Offset</p>
            <p class="text-success">Target value: 0.0 °C (restores factory default)</p>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <button type="button" id="ws5-cal-write-btn" class="btn btn-sm font-mono" style="border:1px solid rgba(74,222,128,0.5);color:#4ade80;background:transparent">Write 0.0 °C to sensor →</button>
            <span id="ws5-cal-write-status" class="text-xs font-mono text-neutral-content/40"></span>
          </div>
        </div>

        <!-- Step 4: Verify (revealed after write) -->
        <div id="ws5-cal-verify" class="hidden bg-neutral px-3 py-3 border-b border-neutral/40 space-y-3">
          <p class="font-mono text-xs text-success uppercase tracking-widest">Write Complete ✓ — Step 4: Verify Corrected Reading</p>
          <p class="text-sm text-neutral-content/80">The offset has been reset to 0.0 °C. The temperature reading should now have dropped by approximately 3 °C back to the true ambient value. Check it looks right, then confirm below.</p>
          <div class="rounded-lg border border-warning/30 bg-warning/5 p-4 text-center">
            <p class="font-mono text-xs text-neutral-content/40 uppercase tracking-wider mb-1">Temperature now</p>
            <p id="ws5-cal-vfy-temp" class="text-4xl font-black font-mono text-warning leading-none">—</p>
            <p class="font-mono text-xs text-neutral-content/40 mt-2">Expected ~<span id="ws5-cal-vfy-expected" class="text-neutral-content/60">—</span></p>
          </div>
          <button type="button" id="ws5-cal-vfy-confirm" class="btn btn-success btn-sm w-full font-mono">Temperature reading looks correct — confirm ✓</button>
        </div>

        <!-- Sign-off (revealed after verify) -->
        <div id="ws5-cal-signoff" class="hidden bg-neutral px-3 py-3 border-b border-neutral/40 space-y-3">
          <p class="font-mono text-xs text-success uppercase tracking-widest">Verification Passed ✓ — Close Work Order</p>
          <p class="text-sm text-neutral-content/80">Before closing the work order, confirm the following:</p>
          <div class="space-y-2">
            <label class="flex items-center gap-3 cursor-pointer font-mono text-xs">
              <input type="checkbox" class="checkbox checkbox-xs checkbox-success" id="ws5-cal-ck1">
              <span class="text-neutral-content/70">Before value confirmed via ISDU read: Calibration Offset was +3.0 °C (positive drift above reference)</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer font-mono text-xs">
              <input type="checkbox" class="checkbox checkbox-xs checkbox-success" id="ws5-cal-ck2">
              <span class="text-neutral-content/70">Correction applied via ISDU write: Offset restored to 0.0 °C — no physical removal required</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer font-mono text-xs">
              <input type="checkbox" class="checkbox checkbox-xs checkbox-success" id="ws5-cal-ck3">
              <span class="text-neutral-content/70">Post-correction reading verified stable for 3 seconds — temperature returned to expected ambient value</span>
            </label>
          </div>
          <button type="button" id="ws5-cal-close-btn" class="btn btn-xs btn-outline w-full font-mono tracking-wider" style="color:#4ade80;border-color:#4ade80" disabled>CLOSE WORK ORDER — CAL-0189</button>
        </div>

        <!-- Completion banner -->
        <div id="ws5-cal-result" class="hidden px-3 py-2 font-mono text-xs border-t border-success/30 bg-success/10 text-success"></div>

        <!-- Reset row -->
        <div class="bg-neutral px-3 py-2 border-t border-neutral/40 flex justify-end">
          <button type="button" id="ws5-cal-reset" class="btn btn-ghost btn-xs gap-1 font-mono text-neutral-content/20 opacity-40 hover:opacity-70">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            RESET
          </button>
        </div>
      </div>
    `
  },
  {
    id: 6,
    title: 'The Light Stack (Status LED)',
    shortDesc: 'Reading machine state from the CL50 — Port 4.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'The light stack is the machine\'s way of shouting its status across the factory floor. IO-Link lets you read and control each colour segment individually — no guessing from 20 metres away.',
    relatedDashboard: 'Dashboard: Port 4 — CL50 Light Stack',
    prerequisites: 'Complete Worksheet 1 first',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">The Banner CL50 Pro RGB is unlike the other sensors in this kit — it is a <strong>PDout-only</strong> device. Instead of sending measurement data <em>to</em> the master, the master sends commands <em>to</em> it. Every colour, animation, intensity, and speed you see on the light is encoded into a single 3-byte hex value that the controller writes out.</p>

      <!-- Try-it-yourself animation demo -->
      <div class="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 mt-3 space-y-3">
        <p class="font-semibold text-base-content">Try it yourself — press a button and watch the light react</p>
        <p class="text-sm text-base-content/80">Each button sends a different PDout command to the physical CL50 on the bench. Try them all — you'll see the light change instantly and the live panel below will update to show exactly what was written.</p>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button type="button" class="ws6-anim-btn btn btn-sm flex-col h-auto py-2" data-action="flash-red"
              style="background:#dc2626;color:white;border-color:#dc2626">
            <span class="font-semibold">Flashing Red</span>
            <span class="text-xs opacity-75">alarm · fault</span>
          </button>
          <button type="button" class="ws6-anim-btn btn btn-sm flex-col h-auto py-2" data-action="flash-orange"
              style="background:#ea580c;color:white;border-color:#ea580c">
            <span class="font-semibold">Flashing Orange</span>
            <span class="text-xs opacity-75">warning · caution</span>
          </button>
          <button type="button" class="ws6-anim-btn btn btn-sm flex-col h-auto py-2" data-action="orange-red-alt"
              style="background:linear-gradient(90deg,#ea580c 50%,#dc2626 50%);color:white;border-color:#dc2626">
            <span class="font-semibold">Orange / Red Alt</span>
            <span class="text-xs opacity-75">critical fault</span>
          </button>
          <button type="button" class="ws6-anim-btn btn btn-sm flex-col h-auto py-2" data-action="green-pulse"
              style="background:#16a34a;color:white;border-color:#16a34a">
            <span class="font-semibold">Green Pulse</span>
            <span class="text-xs opacity-75">running · ok</span>
          </button>
          <button type="button" class="ws6-anim-btn btn btn-sm flex-col h-auto py-2" data-action="rainbow-pulse"
              style="background:linear-gradient(90deg,#dc2626,#f59e0b,#16a34a,#2563eb,#7c3aed);color:white;border:2px solid #7c3aed">
            <span class="font-semibold">Rainbow Pulse</span>
            <span class="text-xs opacity-75">demo · test mode</span>
          </button>
          <button type="button" class="ws6-anim-btn btn btn-sm flex-col h-auto py-2" data-action="gar-loop"
              style="background:linear-gradient(90deg,#16a34a 33%,#f59e0b 66%,#dc2626 100%);color:white;border:2px solid #dc2626">
            <span class="font-semibold">Green → Amber → Red</span>
            <span class="text-xs opacity-75">traffic light loop</span>
          </button>
        </div>
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <p id="ws6-anim-status" class="text-xs font-mono text-base-content/60 min-h-[1rem] flex-1"></p>
          <button type="button" id="ws6-anim-reset" class="btn btn-xs btn-ghost text-base-content/50 shrink-0">↺ Reset to green</button>
        </div>
      </div>

      <!-- Build-your-own PDout hex — dropdowns -->
      <p class="mt-4 text-sm text-base-content/80">Those buttons each send a fixed three-byte hex value to the CL50. Now you can build that hex yourself — change any of the six fields below and watch the PDout value recalculate in real time. When you're ready, press <strong>Write to Light</strong> to send it to the physical light stack.</p>

      <div class="rounded-xl border-2 border-secondary/40 bg-secondary/5 p-4 mt-3 space-y-3">
        <p class="font-semibold text-base-content text-sm">Build your own PDout value</p>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div class="form-control">
            <label class="label py-0.5"><span class="label-text text-xs">Color 1</span></label>
            <select id="ws6-led-color" class="select select-bordered select-sm">
              <option value="0">Green</option><option value="1">Red</option><option value="2">Orange</option>
              <option value="3">Amber</option><option value="4">Yellow</option><option value="5">Lime Green</option>
              <option value="6">Spring Green</option><option value="7">Cyan</option><option value="8">Sky Blue</option>
              <option value="9">Blue</option><option value="10">Violet</option><option value="11">Magenta</option>
              <option value="12">Rose</option><option value="13">White</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label py-0.5"><span class="label-text text-xs">Color 2 (Two Color Flash)</span></label>
            <select id="ws6-led-color2" class="select select-bordered select-sm">
              <option value="0">Green</option><option value="1">Red</option><option value="2">Orange</option>
              <option value="3">Amber</option><option value="4">Yellow</option><option value="5">Lime Green</option>
              <option value="6">Spring Green</option><option value="7">Cyan</option><option value="8">Sky Blue</option>
              <option value="9">Blue</option><option value="10">Violet</option><option value="11">Magenta</option>
              <option value="12">Rose</option><option value="13">White</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label py-0.5"><span class="label-text text-xs">Animation</span></label>
            <select id="ws6-led-animation" class="select select-bordered select-sm">
              <option value="0">Off</option>
              <option value="1" selected>Steady</option>
              <option value="2">Flash</option>
              <option value="3">Two Color Flash</option>
              <option value="4">Intensity Sweep ⚠</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label py-0.5"><span class="label-text text-xs">Pulse Pattern</span></label>
            <select id="ws6-led-pulse" class="select select-bordered select-sm">
              <option value="0">Normal</option>
              <option value="1">Strobe</option>
              <option value="2">Three Pulse</option>
              <option value="3">SOS</option>
              <option value="4">Random</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label py-0.5"><span class="label-text text-xs">C1 Intensity</span></label>
            <select id="ws6-led-intensity" class="select select-bordered select-sm">
              <option value="0">High</option>
              <option value="1">Low</option>
              <option value="2">Medium</option>
              <option value="3">Off</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label py-0.5"><span class="label-text text-xs">Speed</span></label>
            <select id="ws6-led-speed" class="select select-bordered select-sm">
              <option value="0">Medium</option>
              <option value="1">Fast</option>
              <option value="2">Slow</option>
            </select>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-wrap pt-1">
          <span class="text-xs text-base-content/40 font-mono">PDout hex:</span>
          <code class="text-sm font-mono font-bold bg-base-300 px-2 py-0.5 rounded tracking-widest" id="ws6-led-hex-preview">000100</code>
          <button type="button" id="ws6-led-write" class="btn btn-sm btn-primary ml-auto">Write to Light</button>
        </div>
        <p id="ws6-led-status" class="text-xs font-mono text-base-content/60 min-h-[1rem]"></p>
      </div>

      <!-- PDout direction diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">PDout — master commands the light</p>
        <svg viewBox="0 0 580 145" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <!-- PLC box -->
          <rect x="10" y="47" width="100" height="52" rx="6" fill="#1e3a5f"/>
          <text x="60" y="67" text-anchor="middle" fill="white" font-size="9" font-weight="700">PLC / HMI</text>
          <text x="60" y="80" text-anchor="middle" fill="#93c5fd" font-size="8">Controller</text>
          <text x="60" y="93" text-anchor="middle" fill="#93c5fd" font-size="7">"go green"</text>
          <!-- Arrow PLC → Master -->
          <line x1="110" y1="73" x2="149" y2="73" stroke="#64748b" stroke-width="2"/>
          <polygon points="149,69 149,77 157,73" fill="#64748b"/>
          <!-- IO-Link Master box -->
          <rect x="157" y="47" width="112" height="52" rx="6" fill="#ea580c"/>
          <text x="213" y="67" text-anchor="middle" fill="white" font-size="9" font-weight="700">IO-Link Master</text>
          <text x="213" y="80" text-anchor="middle" fill="#fed7aa" font-size="7.5">AL1350 · Port 4</text>
          <text x="213" y="93" text-anchor="middle" fill="#fed7aa" font-size="7">encodes PDout hex</text>
          <!-- Arrow Master → CL50 (green, thicker — PDout) -->
          <line x1="269" y1="73" x2="317" y2="73" stroke="#22c55e" stroke-width="2.5"/>
          <polygon points="317,69 317,77 325,73" fill="#22c55e"/>
          <text x="292" y="63" text-anchor="middle" fill="#22c55e" font-size="7" font-weight="600">PDout</text>
          <text x="292" y="86" text-anchor="middle" fill="#22c55e" font-size="7" font-weight="600">000100</text>
          <!-- CL50 light stack tower -->
          <rect x="325" y="15" width="60" height="115" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
          <rect x="329" y="19" width="52" height="33" rx="4" fill="#dc2626"/>
          <text x="355" y="39" text-anchor="middle" fill="white" font-size="7" font-weight="600">Red</text>
          <rect x="329" y="55" width="52" height="33" rx="4" fill="#f59e0b"/>
          <text x="355" y="75" text-anchor="middle" fill="white" font-size="7" font-weight="600">Amber</text>
          <rect x="329" y="91" width="52" height="33" rx="4" fill="#16a34a"/>
          <text x="355" y="111" text-anchor="middle" fill="white" font-size="7" font-weight="600">Green</text>
          <text x="355" y="140" text-anchor="middle" fill="#22c55e" font-size="7" font-weight="600">CL50 Pro</text>
          <!-- Annotations: no PDin -->
          <text x="420" y="53" fill="#f87171" font-size="7.5" font-weight="600">✗ No PDin</text>
          <text x="420" y="65" fill="#f87171" font-size="7">(no data back to master)</text>
          <text x="420" y="82" fill="#86efac" font-size="7.5" font-weight="600">✓ PDout only</text>
          <text x="420" y="94" fill="#86efac" font-size="7">(master writes to light)</text>
        </svg>
      </div>

      <!-- Animation modes reference -->
      <div class="overflow-x-auto rounded-lg border border-base-300 mt-3">
        <table class="table table-zebra text-sm">
          <thead><tr><th>Animation value</th><th>Name</th><th>What it does</th></tr></thead>
          <tbody>
            <tr><td class="font-mono">0</td><td>Off</td><td>Light is dark — no output</td></tr>
            <tr><td class="font-mono">1</td><td>Steady</td><td>Colour 1 solid on at the set intensity</td></tr>
            <tr><td class="font-mono">2</td><td>Flash</td><td>Colour 1 flashes at the set speed and pattern</td></tr>
            <tr><td class="font-mono">3</td><td>Two Colour Flash</td><td>Colour 1 and Colour 2 alternate at the set speed</td></tr>
            <tr><td class="font-mono">4</td><td>Intensity Sweep</td><td>Colour 1 cycles 0%→100%→0% at the set speed</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Live section — all decoded fields -->
      <div class="rounded-xl border-2 border-accent/30 bg-accent/5 p-4 mt-3 space-y-3" id="ws5-live-panel">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="font-semibold text-base-content text-sm">Port 4 — Live CL50 State (PDout read-back)</span>
          <span id="ws5-live-badge" class="badge badge-xs badge-ghost font-mono">OFFLINE</span>
        </div>

        <div class="flex items-center justify-center gap-8 py-2">
          <div class="flex flex-col items-center gap-2">
            <div id="ws5-c1-circle" class="w-14 h-14 rounded-full bg-base-300 border-4 border-base-300 transition-all duration-300 shadow-md"></div>
            <p class="text-xs text-base-content/60 text-center">Colour 1</p>
            <p id="ws5-c1-label" class="text-xs font-bold text-base-content text-center">—</p>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div id="ws5-c2-circle" class="w-14 h-14 rounded-full bg-base-300 border-4 border-base-300 transition-all duration-300 shadow-md"></div>
            <p class="text-xs text-base-content/60 text-center">Colour 2</p>
            <p id="ws5-c2-label" class="text-xs font-bold text-base-content text-center">—</p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 text-sm">
          <div class="rounded bg-base-200 border border-base-300 p-2">
            <p class="text-base-content/50 text-xs">Animation</p>
            <p id="ws5-animation" class="font-semibold text-base-content">—</p>
          </div>
          <div class="rounded bg-base-200 border border-base-300 p-2">
            <p class="text-base-content/50 text-xs">Speed</p>
            <p id="ws5-speed" class="font-semibold text-base-content">—</p>
          </div>
          <div class="rounded bg-base-200 border border-base-300 p-2">
            <p class="text-base-content/50 text-xs">Pulse Pattern</p>
            <p id="ws5-pattern" class="font-semibold text-base-content">—</p>
          </div>
          <div class="rounded bg-base-200 border border-base-300 p-2">
            <p class="text-base-content/50 text-xs">C1 Intensity</p>
            <p id="ws5-c1-intensity" class="font-semibold text-base-content">—</p>
          </div>
          <div class="rounded bg-base-200 border border-base-300 p-2">
            <p class="text-base-content/50 text-xs">C2 Intensity</p>
            <p id="ws5-c2-intensity" class="font-semibold text-base-content">—</p>
          </div>
          <div class="rounded bg-base-200 border border-base-300 p-2">
            <p class="text-base-content/50 text-xs">Raw PDout hex</p>
            <p id="ws5-raw-hex" class="font-mono font-semibold text-base-content">—</p>
          </div>
        </div>
      </div>

      <!-- Colour meanings table -->
      <div class="overflow-x-auto rounded-lg border border-base-300 mt-4">
        <table class="table table-zebra text-sm">
          <thead><tr><th>Colour</th><th>Typical factory meaning</th><th>Steady hex</th></tr></thead>
          <tbody>
            <tr><td><span class="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>Green</td><td>Machine running OK — normal production</td><td class="font-mono">000100</td></tr>
            <tr><td><span class="inline-block w-3 h-3 rounded-full bg-amber-400 mr-2"></span>Amber</td><td>Warning — attention needed soon</td><td class="font-mono">180103</td></tr>
            <tr><td><span class="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>Red</td><td>Fault — machine stopped or needs repair</td><td class="font-mono">180101</td></tr>
            <tr><td><span class="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>Blue</td><td>Maintenance mode or setup in progress</td><td class="font-mono">180109</td></tr>
          </tbody>
        </table>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> The CL50 is described as a "PDout-only" device. What does that mean?</p>
      <div class="space-y-2 mt-1" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q1" value="a" class="radio radio-sm radio-accent"> The master sends a command value TO the light — no measurement data comes back from the device to the master</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q1" value="b" class="radio radio-sm radio-accent"> It only works with certain IO-Link masters</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q1" value="c" class="radio radio-sm radio-accent"> It uses a separate digital output wire for each colour segment</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> The hex value <code class="font-mono bg-base-300 px-1 rounded text-sm">180101</code> is sent to the CL50. Which colour will it show?</p>
      <div class="space-y-2 mt-1" data-correct="c">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q2" value="a" class="radio radio-sm radio-accent"> Green — Octet2 low nibble = 0x00</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q2" value="b" class="radio radio-sm radio-accent"> Amber — 0x18 in Octet0 indicates Amber</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q2" value="c" class="radio radio-sm radio-accent"> Red — Octet2 low nibble = 0x01 = Red (index 1)</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> The flashing red segment will not turn off even after the operator says the fault is cleared. What is the most likely cause?</p>
      <div class="space-y-2 mt-1" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q3" value="a" class="radio radio-sm radio-accent"> The PLC is still sending a "red on" PDout command — the fault state is held in the controller, not the light itself</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q3" value="b" class="radio radio-sm radio-accent"> The light stack hardware is broken</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q3" value="c" class="radio radio-sm radio-accent"> IO-Link has lost connection to the light stack</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q4.</strong> Why is IO-Link PDout control better than wiring a traditional 3-wire digital light stack (one wire per segment)?</p>
      <div class="space-y-2 mt-1" data-correct="c">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q4" value="a" class="radio radio-sm radio-accent"> It is always cheaper per unit due to IO-Link certification reducing manufacturing costs</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q4" value="b" class="radio radio-sm radio-accent"> The colour cannot be changed once wired — it is safer</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q4" value="c" class="radio radio-sm radio-accent"> Full control of colour, animation, intensity, and speed over a single 3-pin cable — plus the HMI can read back the exact state without a separate feedback wire</label>
      </div>

      <div class="divider my-2"></div>

      <!-- Maintenance scenario: stale PDout / wrong light state -->
      <div class="rounded-xl overflow-hidden border border-neutral/60 mt-4">

        <!-- Header -->
        <div class="bg-neutral/20 border-b border-neutral/40 px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full bg-warning animate-pulse"></div>
            <span class="font-bold text-base-content text-sm">Maintenance Scenario — Work Order LST-0312</span>
          </div>
          <button type="button" id="ws6-ms-reset" class="btn btn-xs btn-ghost gap-1 text-base-content/50">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Reset
          </button>
        </div>

        <!-- Embedded live state panel -->
        <div class="px-4 py-3 bg-base-200/40 border-b border-neutral/30 flex items-center gap-5 flex-wrap">
          <div class="flex items-center gap-2">
            <div id="ws6-ms-c1-circle" class="w-8 h-8 rounded-full bg-base-300 border-2 border-base-300 transition-all duration-300 shadow-md"></div>
            <div>
              <p class="text-xs text-base-content/50">Colour 1</p>
              <p id="ws6-ms-c1-label" class="text-xs font-bold text-base-content">—</p>
            </div>
          </div>
          <div>
            <p class="text-xs text-base-content/50">Animation</p>
            <p id="ws6-ms-animation" class="text-xs font-semibold text-base-content">—</p>
          </div>
          <div>
            <p class="text-xs text-base-content/50">Raw PDout hex</p>
            <p id="ws6-ms-raw-hex" class="text-xs font-mono font-semibold text-base-content">—</p>
          </div>
          <div class="ml-auto">
            <span id="ws6-ms-live-badge" class="badge badge-xs badge-ghost font-mono">OFFLINE</span>
          </div>
        </div>

        <!-- Work order -->
        <div class="p-4 space-y-3 border-b border-neutral/30">
          <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Priority: HIGH · Asset: Port 4 CL50 Pro · Ref: LST-0312</p>
          <p class="text-sm text-base-content/90 leading-relaxed"><strong>Fault reported:</strong> Assembly Line 2 CL50 light stack is stuck showing Flashing Amber after a planned maintenance window. All sensors are healthy and the maintenance sign-off sheet has been completed, but operators are refusing to restart the line while the warning light is active. The controls engineer insists the PLC program is correct.</p>
          <p class="text-sm text-base-content/80">Click <strong>Start Scenario</strong> to inject the fault state into Port 4. The CL50 will begin Flashing Amber — investigate and clear the condition.</p>
          <div class="flex items-center gap-3 flex-wrap">
            <button type="button" id="ws6-ms-start" class="btn btn-warning btn-sm gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Start Scenario
            </button>
            <p id="ws6-ms-inject-status" class="text-xs font-mono text-base-content/50"></p>
          </div>
        </div>

        <!-- Step 1: Observe -->
        <div id="ws6-ms-observe-box" class="hidden p-4 border-b border-neutral/30 space-y-3">
          <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Step 1 — Observe the Fault</p>
          <p class="text-sm text-base-content/80">Look at the physical CL50 on Port 4 and confirm the fault state on the live panel below — the light should be Flashing Amber.</p>
          <div class="rounded-lg bg-base-200 border border-base-300 px-4 py-3 flex items-center gap-5 flex-wrap">
            <div class="flex items-center gap-2">
              <div id="ws6-obs-c1-circle" class="w-8 h-8 rounded-full bg-base-300 border-2 border-base-300 transition-all duration-300 shadow-md"></div>
              <div>
                <p class="text-xs text-base-content/50">Colour 1</p>
                <p id="ws6-obs-c1-label" class="text-xs font-bold text-base-content">—</p>
              </div>
            </div>
            <div>
              <p class="text-xs text-base-content/50">Animation</p>
              <p id="ws6-obs-animation" class="text-xs font-semibold text-base-content">—</p>
            </div>
            <div>
              <p class="text-xs text-base-content/50">Raw PDout hex</p>
              <p id="ws6-obs-raw-hex" class="text-xs font-mono font-semibold text-base-content">—</p>
            </div>
          </div>
          <button type="button" id="ws6-ms-i-observed" class="btn btn-outline btn-warning btn-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            I have observed the fault state
          </button>
        </div>

        <!-- Step 2: Diagnose -->
        <div id="ws6-ms-diag-box" class="hidden p-4 border-b border-neutral/30 space-y-3">
          <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Step 2 — Diagnose the Root Cause</p>
          <p class="text-sm text-base-content/80">The light is Flashing Amber but all sensors and the PLC are healthy. What is the most likely root cause?</p>
          <div class="space-y-2 text-sm">
            <label class="flex items-start gap-2 cursor-pointer">
              <input type="radio" name="ws6-ms-diag" value="a" class="radio radio-sm radio-warning mt-0.5">
              <span>The CL50 hardware is malfunctioning — the amber segment is stuck and cannot be cleared by software</span>
            </label>
            <label class="flex items-start gap-2 cursor-pointer">
              <input type="radio" name="ws6-ms-diag" value="b" class="radio radio-sm radio-warning mt-0.5">
              <span>IO-Link comms to Port 4 have dropped — the light is locked to its last received command and cannot be updated</span>
            </label>
            <label class="flex items-start gap-2 cursor-pointer">
              <input type="radio" name="ws6-ms-diag" value="c" class="radio radio-sm radio-warning mt-0.5">
              <span>The PLC output register is still holding the pre-maintenance fault PDout value (<code class="font-mono bg-base-300 px-1 rounded">184203</code> — Amber Flash). The normal-run value (<code class="font-mono bg-base-300 px-1 rounded">000100</code> — Green Steady) was never sent after the PLC restarted</span>
            </label>
          </div>
          <div class="flex items-center gap-3">
            <button type="button" id="ws6-ms-diag-submit" class="btn btn-warning btn-sm">Submit Diagnosis</button>
          </div>
          <div id="ws6-ms-diag-result" class="hidden rounded-lg p-3 text-sm"></div>
        </div>

        <!-- Step 3: Read PDout state -->
        <div id="ws6-ms-read-box" class="hidden p-4 border-b border-neutral/30 space-y-3">
          <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Step 3 — Read Back the Current PDout</p>
          <p class="text-sm text-base-content/80">Confirm your diagnosis by reading the current PDout state from the master. The AL1350 stores the last value it wrote to the CL50, so you can verify exactly what command the PLC sent.</p>
          <button type="button" id="ws6-ms-read-btn" class="btn btn-outline btn-accent btn-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Read PDout State from Master
          </button>
          <div id="ws6-ms-read-result" class="hidden rounded-lg bg-base-200 border border-base-300 p-3 font-mono text-xs space-y-1"></div>
        </div>

        <!-- Step 4: Write fix -->
        <div id="ws6-ms-fix-box" class="hidden p-4 border-b border-neutral/30 space-y-3">
          <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Step 4 — Apply the Fix</p>
          <p class="text-sm text-base-content/80">Override the stale PLC output by writing the correct normal-run PDout value directly. This returns the light to Green Steady and clears the warning state.</p>
          <div class="rounded-lg bg-base-200 border border-base-300 px-3 py-2 text-sm space-y-1">
            <p>Target PDout: <code class="font-mono bg-success/20 px-2 py-0.5 rounded text-success">000100</code></p>
            <p class="text-xs text-base-content/50">Octet 0 = 0x00 (High) · Octet 1 = 0x01 (Steady) · Octet 2 = 0x00 (Green)</p>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <button type="button" id="ws6-ms-fix-btn" class="btn btn-success btn-sm gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Write Normal Run State (000100)
            </button>
            <p id="ws6-ms-fix-status" class="text-xs font-mono text-base-content/50"></p>
          </div>
        </div>

        <!-- Step 5: Verify -->
        <div id="ws6-ms-vfy-box" class="hidden p-4 border-b border-neutral/30 space-y-3">
          <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Step 5 — Verify</p>
          <p class="text-sm text-base-content/80">Confirm the CL50 is now showing Green Steady and holds stable. Maintain for 5 seconds.</p>
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span id="ws6-ms-vfy-pct" class="text-base-content/60">Waiting for Green Steady…</span>
              <span id="ws6-ms-vfy-timer" class="font-mono text-base-content/60">0 / 5 s</span>
            </div>
            <div class="w-full h-3 bg-base-300 rounded-full overflow-hidden">
              <div id="ws6-ms-vfy-tbar" class="h-full bg-success rounded-full transition-all duration-300" style="width:0%"></div>
            </div>
          </div>
        </div>

        <!-- Sign-off -->
        <div id="ws6-ms-signoff-box" class="hidden p-4 space-y-3">
          <p class="text-xs font-semibold text-success uppercase tracking-wide">✓ Fault Cleared — Sign Off Work Order LST-0312</p>
          <p class="text-sm text-base-content/80">Confirm the following before closing:</p>
          <div class="space-y-2 text-sm">
            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="ws6-ms-ck1" class="checkbox checkbox-sm checkbox-success"> CL50 confirmed Green Steady — verified on physical light and live panel</label>
            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="ws6-ms-ck2" class="checkbox checkbox-sm checkbox-success"> Root cause documented: stale PDout (Amber Flash) held in PLC output register — not cleared during maintenance restart</label>
            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="ws6-ms-ck3" class="checkbox checkbox-sm checkbox-success"> Corrective action raised: PLC startup routine should reset light stack PDout to Green Steady on every power-on</label>
          </div>
          <button type="button" id="ws6-ms-close" class="btn btn-success btn-sm gap-2" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Close Work Order
          </button>
        </div>

      </div>
    `
  },
  {
    id: 7,
    title: 'Fault Finding and Replacement',
    shortDesc: 'Diagnose a live Line 3 fault using the HMI — two devices, one clue.',
    estimatedTime: 'About 20 min',
    whyItMatters: 'IO-Link lets you read every device on the network from your workstation. This worksheet puts you in a real maintenance situation — something is wrong, a colleague swears he didn\'t cause it, and the light stack is the first clue.',
    relatedDashboard: 'IO-Link Master page: Active Port Details, parameter read/write',
    prerequisites: 'Complete Worksheets 1–6',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed text-base">Your manager replaced the capacitive sensor on Port 2 and the temperature sensor on Port 3 during last night's maintenance window. He says both are connected and IO-Link is communicating. This morning Line 3 failed to restart — the machine is in fault mode and the light stack is flashing red.</p>

      <!-- NC/NO recall callout -->
      <div class="rounded-xl border border-base-300 bg-base-200/60 p-4 mt-4 space-y-2">
        <p class="text-sm font-semibold text-base-content">🔁 Recall — Switching Output Logic (ISDU Index 61 / Sub 1)</p>
        <p class="text-sm text-base-content/80">IO-Link sensors can be configured with <strong>Normal Open (NO)</strong> or <strong>Normal Closed (NC)</strong> output logic.</p>
        <div class="grid grid-cols-2 gap-3 text-sm mt-1">
          <div class="rounded-lg bg-success/10 border border-success/30 p-2">
            <p class="font-bold text-success">NO — Normal Open (value 0)</p>
            <p class="text-base-content/70 text-xs mt-0.5">Output is ON when an object is detected. Factory default.</p>
          </div>
          <div class="rounded-lg bg-error/10 border border-error/30 p-2">
            <p class="font-bold text-error">NC — Normal Closed (value 1)</p>
            <p class="text-base-content/70 text-xs mt-0.5">Output is ON when <em>no</em> object is detected — inverted behaviour. Causes a permanent "object present" signal when nothing is in front.</p>
          </div>
        </div>
      </div>

      <!-- Start section — always visible -->
      <div id="ws7-start-row" class="mt-4 flex items-center gap-3 flex-wrap">
        <button type="button" id="ws7-ms-start" class="btn btn-error btn-sm gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Start Investigation
        </button>
        <p id="ws7-ms-inject-status" class="text-xs font-mono text-base-content/50"></p>
      </div>

      <!-- HMI panel — hidden until Start is clicked -->
      <div id="ws7-hmi-wrapper" class="hidden">
      <div class="rounded-xl overflow-hidden mt-4 border border-slate-600/50" style="background:#0f172a;font-family:'Courier New',Courier,monospace;">

        <!-- HMI title bar -->
        <div class="flex items-center justify-between px-4 py-2" style="background:#1e3a5f;border-bottom:2px solid #1d4ed8;">
          <span class="text-xs font-bold tracking-widest" style="color:#60a5fa;letter-spacing:0.12em;">LINE 3 — IO-LINK STATUS MONITOR</span>
          <div class="flex items-center gap-3">
            <span id="ws7-hmi-status" class="text-xs font-bold tracking-wider" style="color:#475569;">● OFFLINE</span>
            <span id="ws7-hmi-badge" class="badge badge-xs font-mono" style="font-size:0.6rem;">OFFLINE</span>
          </div>
        </div>

        <!-- 2×2 port grid -->
        <div class="grid grid-cols-2" style="gap:1px;background:#1e293b;">

          <!-- P1: Inductive Proximity -->
          <div class="p-3 space-y-2" style="background:#0f172a;">
            <span class="text-xs font-bold tracking-wider" style="color:#3b82f6;font-size:0.6rem;letter-spacing:0.1em;">P1 · INDUCTIVE PROXIMITY</span>
            <div class="flex items-center gap-3 mt-1">
              <div id="ws7-hmi-p1-dot" style="width:22px;height:22px;border-radius:50%;background:#1e293b;border:2px solid #334155;flex-shrink:0;transition:all 0.2s;"></div>
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span style="color:#475569;font-size:0.6rem;">OUT1</span>
                  <span id="ws7-hmi-p1-out1" class="font-bold" style="color:#94a3b8;font-size:0.7rem;">—</span>
                </div>
                <div class="flex items-center gap-2">
                  <span style="color:#475569;font-size:0.6rem;">MON</span>
                  <span id="ws7-hmi-p1-mon" style="color:#94a3b8;font-size:0.65rem;">—</span>
                </div>
                <div class="flex items-center gap-2">
                  <span style="color:#475569;font-size:0.6rem;">INSTAB</span>
                  <span id="ws7-hmi-p1-instab" style="color:#94a3b8;font-size:0.65rem;">—</span>
                </div>
                <div class="flex items-center gap-2">
                  <span style="color:#475569;font-size:0.6rem;">OVAPP</span>
                  <span id="ws7-hmi-p1-ovapp" style="color:#94a3b8;font-size:0.65rem;">—</span>
                </div>
              </div>
            </div>
          </div>

          <!-- P2: Capacitive (replaced) -->
          <div class="p-3 space-y-2" style="background:#0f172a;">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold tracking-wider" style="color:#8b5cf6;font-size:0.6rem;letter-spacing:0.1em;">P2 · CAPACITIVE</span>
              <span style="color:#22c55e;font-size:0.55rem;font-weight:700;letter-spacing:0.05em;">★ NEW UNIT</span>
            </div>
            <div class="flex items-center gap-3 mt-1">
              <div id="ws7-hmi-p2-dot" style="width:22px;height:22px;border-radius:50%;background:#1e293b;border:2px solid #334155;flex-shrink:0;transition:all 0.2s;"></div>
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span style="color:#475569;font-size:0.6rem;">LINK</span>
                  <span id="ws7-hmi-p2-link" style="color:#94a3b8;font-size:0.65rem;">—</span>
                </div>
                <div class="flex items-center gap-2">
                  <span style="color:#475569;font-size:0.6rem;">DET</span>
                  <span id="ws7-hmi-p2-status" style="color:#94a3b8;font-size:0.65rem;">—</span>
                </div>
                <div class="flex items-center gap-2">
                  <span style="color:#8b5cf6;font-size:0.6rem;">SP1</span>
                  <span id="ws7-hmi-p2-sp1" style="color:#94a3b8;font-size:0.65rem;">—</span>
                </div>
                <div class="flex items-center gap-2">
                  <span style="color:#a78bfa;font-size:0.6rem;">QoT</span>
                  <span id="ws7-hmi-p2-qot" style="color:#94a3b8;font-size:0.65rem;">—</span>
                </div>
              </div>
            </div>
          </div>

          <!-- P3: Temperature (replaced) -->
          <div class="p-3 space-y-2" style="background:#0f172a;">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold tracking-wider" style="color:#f97316;font-size:0.6rem;letter-spacing:0.1em;">P3 · TEMPERATURE</span>
              <span style="color:#22c55e;font-size:0.55rem;font-weight:700;letter-spacing:0.05em;">★ NEW UNIT</span>
            </div>
            <div class="flex items-center gap-3 mt-1">
              <div id="ws7-hmi-p3-dot" style="width:22px;height:22px;border-radius:50%;background:#1e293b;border:2px solid #334155;flex-shrink:0;transition:all 0.2s;"></div>
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span style="color:#475569;font-size:0.6rem;">TEMP</span>
                  <span id="ws7-hmi-p3-temp" style="color:#94a3b8;font-size:0.65rem;">—</span>
                </div>
                <div class="flex items-center gap-2">
                  <span style="color:#3b82f6;font-size:0.6rem;">SP1</span>
                  <span id="ws7-hmi-p3-sp1" style="color:#94a3b8;font-size:0.65rem;">—</span>
                </div>
                <div class="flex items-center gap-2">
                  <span style="color:#60a5fa;font-size:0.6rem;">RP1</span>
                  <span id="ws7-hmi-p3-rp1" style="color:#94a3b8;font-size:0.65rem;">—</span>
                </div>
                <div class="flex items-center gap-2">
                  <span style="color:#a78bfa;font-size:0.6rem;">SP2</span>
                  <span id="ws7-hmi-p3-sp2" style="color:#94a3b8;font-size:0.65rem;">—</span>
                </div>
                <div class="flex items-center gap-2">
                  <span style="color:#c4b5fd;font-size:0.6rem;">RP2</span>
                  <span id="ws7-hmi-p3-rp2" style="color:#94a3b8;font-size:0.65rem;">—</span>
                </div>
                <div class="flex items-center gap-2">
                  <span style="color:#475569;font-size:0.6rem;">OUT1</span>
                  <span id="ws7-hmi-p3-out1" style="color:#94a3b8;font-size:0.65rem;">—</span>
                </div>
                <div class="flex items-center gap-2">
                  <span style="color:#475569;font-size:0.6rem;">OUT2</span>
                  <span id="ws7-hmi-p3-out2" style="color:#94a3b8;font-size:0.65rem;">—</span>
                </div>
              </div>
            </div>
          </div>

          <!-- P4: Light Stack -->
          <div class="p-3 space-y-2" style="background:#0f172a;">
            <span class="text-xs font-bold tracking-wider" style="color:#22c55e;font-size:0.6rem;letter-spacing:0.1em;">P4 · LIGHT STACK</span>
            <div class="flex items-center gap-3 mt-1">
              <div id="ws7-hmi-p4-swatch" style="width:22px;height:22px;border-radius:4px;background:#1e293b;border:2px solid #334155;flex-shrink:0;transition:all 0.3s;"></div>
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span style="color:#475569;font-size:0.6rem;">COLOR</span>
                  <span id="ws7-hmi-p4-color" style="color:#94a3b8;font-size:0.65rem;">—</span>
                </div>
                <div class="flex items-center gap-2">
                  <span style="color:#475569;font-size:0.6rem;">ANIM</span>
                  <span id="ws7-hmi-p4-anim" style="color:#94a3b8;font-size:0.65rem;">—</span>
                </div>
                <div class="flex items-center gap-2">
                  <span style="color:#475569;font-size:0.6rem;">HEX</span>
                  <span id="ws7-hmi-p4-hex" style="color:#94a3b8;font-size:0.65rem;font-family:'Courier New',monospace;">—</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Alarm bar (hidden until fault injected) -->
        <div id="ws7-hmi-alarm-bar" class="hidden px-4 py-2 flex items-center gap-2" style="background:#450a0a;border-top:1px solid #dc2626;">
          <span style="color:#f87171;font-size:0.75rem;font-weight:900;">⚠</span>
          <span id="ws7-hmi-alarm-msg" style="color:#fca5a5;font-size:0.65rem;font-weight:600;letter-spacing:0.05em;">—</span>
        </div>

      </div>
      </div><!-- /ws7-hmi-wrapper -->

      <!-- Scenario / work order box — hidden until Start is clicked -->
      <div id="ws7-ms-wrapper" class="hidden">
      <div class="rounded-xl overflow-hidden border border-neutral/60 mt-4">

        <!-- Header -->
        <div class="bg-neutral/20 border-b border-neutral/40 px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full bg-error animate-pulse"></div>
            <span class="font-bold text-base-content text-sm">Line 3 Restart Fault — Work Order FND-0001</span>
          </div>
          <button type="button" id="ws7-ms-reset" class="btn btn-xs btn-ghost gap-1 text-base-content/50">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Reset
          </button>
        </div>

        <!-- Briefing -->
        <div class="p-4 border-b border-neutral/30 space-y-2">
          <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Priority: HIGH · Line 3 blocked · Ref: FND-0001</p>
          <p class="text-sm text-base-content/90 leading-relaxed">Your manager replaced the capacitive sensor (Port 2) and the temperature sensor (Port 3) during last night's maintenance window and says IO-Link is communicating on both ports. This morning the operator tried to start Line 3 — the machine went straight into fault mode. The CL50 is flashing red. Your manager insists: <em>"I only touched Ports 2 and 3."</em></p>
          <p class="text-sm text-base-content/80">Use the live HMI monitor above to identify the problem, then work through the steps below.</p>
        </div>

        <!-- Step 1: Observe -->
        <div id="ws7-ms-observe-box" class="hidden p-4 border-b border-neutral/30 space-y-3">
          <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Step 1 — Read the HMI</p>
          <p class="text-sm text-base-content/80">Look at the live HMI above. The light stack (P4) is your first clue — it is showing Flash Red, meaning the machine controller has detected a fault. Now look at each sensor port in turn. Remember: your manager says Ports 2 and 3 are fine.</p>
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 text-sm space-y-1">
            <p class="font-semibold text-base-content">What to look for:</p>
            <ul class="list-disc list-inside space-y-1 text-base-content/80">
              <li>P4 (Light Stack) — what is it indicating about machine state?</li>
              <li>P2 and P3 — recently replaced, marked <strong>NEW UNIT</strong> — are they communicating normally? Check their dots.</li>
              <li>P1 (Inductive) — was not touched. Is OUT1 right for a sensor with nothing in front of it?</li>
            </ul>
          </div>
          <div class="rounded-lg bg-warning/10 border border-warning/30 p-3 text-sm space-y-1">
            <p class="font-semibold text-base-content/80">Tip — NC vs hardware short:</p>
            <p class="text-base-content/70">Both cause OUT1 to appear permanently ON. To distinguish them: place a metal object within 5 mm of the Port 1 sensor face. If OUT1 turns <strong>OFF</strong>, the sensor is responding to targets but with inverted logic — that is NC. If OUT1 stays ON regardless, the sensor has physically failed.</p>
          </div>
          <button type="button" id="ws7-ms-i-observed" class="btn btn-outline btn-error btn-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            I have spotted the anomaly
          </button>
        </div>

        <!-- Step 2: Diagnose -->
        <div id="ws7-ms-diag-box" class="hidden p-4 border-b border-neutral/30 space-y-3">
          <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Step 2 — Identify the Root Cause</p>
          <p class="text-sm text-base-content/80">Port 1 (Inductive) OUT1 is permanently ON with nothing in front of the sensor. The P1 dot in the HMI is still <strong>blue</strong> — IO-Link is communicating normally. Your manager says he didn't touch Port 1. What is the most likely explanation?</p>
          <div class="space-y-2 text-sm">
            <label class="flex items-start gap-2 cursor-pointer">
              <input type="radio" name="ws7-ms-diag" value="a" class="radio radio-sm radio-error mt-0.5">
              <span>IO-Link communication to Port 1 has dropped — the master is frozen on the last reported output state and cannot be updated</span>
            </label>
            <label class="flex items-start gap-2 cursor-pointer">
              <input type="radio" name="ws7-ms-diag" value="b" class="radio radio-sm radio-error mt-0.5">
              <span>The inductive sensor hardware has failed — the output transistor is shorted and permanently conducting regardless of whether an object is present</span>
            </label>
            <label class="flex items-start gap-2 cursor-pointer">
              <input type="radio" name="ws7-ms-diag" value="c" class="radio radio-sm radio-error mt-0.5">
              <span>The sensor output logic is set to <strong>NC (Normal Closed)</strong> — in NC mode OUT1 is ON when nothing is detected and turns OFF when an object is present. This is the inverse of the correct <strong>NO (Normal Open)</strong> setting and causes the controller to see a permanent "object present" signal</span>
            </label>
          </div>
          <button type="button" id="ws7-ms-diag-submit" class="btn btn-error btn-sm">Submit</button>
          <div id="ws7-ms-diag-result" class="hidden rounded-lg p-3 text-sm"></div>
        </div>

        <!-- Step 3: ISDU Read -->
        <div id="ws7-ms-read-box" class="hidden p-4 border-b border-neutral/30 space-y-3">
          <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Step 3 — Confirm via ISDU Read</p>
          <p class="text-sm text-base-content/80">Read the output logic parameter from the sensor over IO-Link to confirm your diagnosis before making any changes.</p>
          <div class="rounded-lg bg-base-200 border border-base-300 px-3 py-2 text-xs font-mono space-y-0.5">
            <p>Port 1 · Index 61 · Sub 1 — Switchpoint Logic OUT1</p>
            <p class="text-base-content/50">Value: 0 = NO (Normal Open)  ·  1 = NC (Normal Closed)</p>
          </div>
          <button type="button" id="ws7-ms-read-btn" class="btn btn-outline btn-accent btn-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Read Output Logic (Index 61, Sub 1)
          </button>
          <div id="ws7-ms-read-result" class="hidden rounded-lg bg-base-200 border border-base-300 p-3 font-mono text-xs space-y-1"></div>
        </div>

        <!-- Step 4: Fix -->
        <div id="ws7-ms-fix-box" class="hidden p-4 border-b border-neutral/30 space-y-3">
          <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Step 4 — Apply the Fix</p>
          <p class="text-sm text-base-content/80">Write <strong>NO (value 0)</strong> to restore correct output behaviour. The light stack will also be reset to Green Steady once the fault is cleared.</p>
          <div class="rounded-lg bg-base-200 border border-base-300 px-3 py-2 text-sm space-y-1">
            <p>Write: Port 1 · Index 61 · Sub 1 = <code class="font-mono bg-success/20 px-1 rounded text-success">0 (NO)</code></p>
            <p class="text-xs text-base-content/50">NO = output ON only when object is present — the correct behaviour for an inductive proximity sensor</p>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <button type="button" id="ws7-ms-fix-btn" class="btn btn-success btn-sm gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Write NO + Restore Light Stack
            </button>
            <p id="ws7-ms-fix-status" class="text-xs font-mono text-base-content/50"></p>
          </div>
        </div>

        <!-- Step 5: Verify -->
        <div id="ws7-ms-vfy-box" class="hidden p-4 border-b border-neutral/30 space-y-3">
          <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Step 5 — Verify</p>
          <p class="text-sm text-base-content/80">With no metal object in front of Port 1, confirm OUT1 is now OFF. Hold stable for 3 seconds.</p>
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span id="ws7-ms-vfy-pct" class="text-base-content/60">Waiting for OUT1 = OFF in free air…</span>
              <span id="ws7-ms-vfy-timer" class="font-mono text-base-content/60">0 / 3 s</span>
            </div>
            <div class="w-full h-3 bg-base-300 rounded-full overflow-hidden">
              <div id="ws7-ms-vfy-tbar" class="h-full bg-success rounded-full transition-all duration-300" style="width:0%"></div>
            </div>
          </div>
        </div>

        <!-- Sign-off -->
        <div id="ws7-ms-signoff-box" class="hidden p-4 space-y-3">
          <p class="text-xs font-semibold text-success uppercase tracking-wide">✓ Fault Cleared — Sign Off Work Order FND-0001</p>
          <p class="text-sm text-base-content/80">Confirm the following before closing:</p>
          <div class="space-y-2 text-sm">
            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="ws7-ms-ck1" class="checkbox checkbox-sm checkbox-success"> Port 1 inductive sensor confirmed NO — OUT1 OFF in free air, switches ON when metal object is present</label>
            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="ws7-ms-ck2" class="checkbox checkbox-sm checkbox-success"> Root cause: output logic left in NC mode from a previous session on this training kit — not caused by the manager's Port 2/3 work</label>
            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="ws7-ms-ck3" class="checkbox checkbox-sm checkbox-success"> Light stack restored to Green Steady — Line 3 cleared to restart</label>
          </div>
          <button type="button" id="ws7-ms-close" class="btn btn-success btn-sm gap-2" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Close Work Order
          </button>
        </div>

      </div>
      </div><!-- /ws7-ms-wrapper -->
    `
  },
  {
    id: 8,
    title: 'Final Practical Assessment',
    shortDesc: 'Live-verified tasks across all four IO-Link devices.',
    estimatedTime: 'About 30 min',
    whyItMatters: 'Sign-off for CP3723 — tasks 1–3 are verified against live sensor data, not just ticked on paper.',
    relatedDashboard: 'Dashboard: all ports',
    prerequisites: 'Complete Worksheets 1–7',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed text-base">Complete all four tasks using the live kit. Tasks 1–3 auto-verify against live sensor data. Task 4 is a knowledge check. Tick all five sign-off boxes when done.</p>

      <!-- Architecture diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">Full system — what you have worked with</p>
        <svg viewBox="0 0 570 165" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <!-- Sensor boxes -->
          <rect x="2"   y="18"  width="90" height="22" rx="4" fill="#3b82f6"/>
          <text x="47"  y="33"  text-anchor="middle" fill="white" font-size="9" font-weight="600">Proximity P1</text>
          <rect x="2"   y="46"  width="90" height="22" rx="4" fill="#7c3aed"/>
          <text x="47"  y="61"  text-anchor="middle" fill="white" font-size="9" font-weight="600">Capacitive P2</text>
          <rect x="2"   y="74"  width="90" height="22" rx="4" fill="#d97706"/>
          <text x="47"  y="89"  text-anchor="middle" fill="white" font-size="9" font-weight="600">Temperature P3</text>
          <rect x="2"   y="102" width="90" height="22" rx="4" fill="#0d9488"/>
          <text x="47"  y="117" text-anchor="middle" fill="white" font-size="9" font-weight="600">Light Stack P4</text>
          <!-- Cables to master -->
          <line x1="92" y1="29"  x2="112" y2="29"  stroke="#94a3b8" stroke-width="1.5"/>
          <line x1="92" y1="57"  x2="112" y2="57"  stroke="#94a3b8" stroke-width="1.5"/>
          <line x1="92" y1="85"  x2="112" y2="85"  stroke="#94a3b8" stroke-width="1.5"/>
          <line x1="92" y1="113" x2="112" y2="113" stroke="#94a3b8" stroke-width="1.5"/>
          <!-- IO-Link Master -->
          <rect x="112" y="10" width="80" height="130" rx="6" fill="#ea580c"/>
          <text x="152" y="70"  text-anchor="middle" fill="white" font-size="10" font-weight="700">IO-Link</text>
          <text x="152" y="84"  text-anchor="middle" fill="white" font-size="10" font-weight="700">Master</text>
          <text x="152" y="98"  text-anchor="middle" fill="#fed7aa" font-size="8">IFM AL1350</text>
          <!-- Ethernet -->
          <line x1="192" y1="75" x2="228" y2="75" stroke="#64748b" stroke-width="2" stroke-dasharray="5,3"/>
          <polygon points="228,71 228,79 236,75" fill="#64748b"/>
          <text x="210" y="68" text-anchor="middle" fill="#94a3b8" font-size="8">Ethernet</text>
          <!-- Pi -->
          <rect x="236" y="50" width="72" height="50" rx="6" fill="#15803d"/>
          <text x="272" y="72"  text-anchor="middle" fill="white" font-size="9" font-weight="700">Raspberry</text>
          <text x="272" y="85"  text-anchor="middle" fill="white" font-size="9" font-weight="700">Pi</text>
          <text x="272" y="96"  text-anchor="middle" fill="#bbf7d0" font-size="7">Edge Device</text>
          <!-- HDMI -->
          <line x1="308" y1="75" x2="340" y2="75" stroke="#64748b" stroke-width="2" stroke-dasharray="5,3"/>
          <polygon points="340,71 340,79 348,75" fill="#64748b"/>
          <text x="324" y="68" text-anchor="middle" fill="#94a3b8" font-size="8">HDMI</text>
          <!-- Screen -->
          <rect x="348" y="42" width="70" height="52" rx="4" fill="#334155"/>
          <rect x="353" y="47" width="60" height="38" rx="3" fill="#0f172a"/>
          <rect x="358" y="52" width="22" height="3" rx="1" fill="#3b82f6" opacity="0.8"/>
          <rect x="358" y="58" width="40" height="2" rx="1" fill="#475569"/>
          <rect x="358" y="63" width="32" height="2" rx="1" fill="#10b981" opacity="0.7"/>
          <rect x="358" y="68" width="36" height="2" rx="1" fill="#475569"/>
          <rect x="358" y="73" width="26" height="2" rx="1" fill="#475569"/>
          <text x="383" y="106" text-anchor="middle" fill="#94a3b8" font-size="8">HMI Screen</text>

          <!-- Bottom label -->
          <text x="285" y="152" text-anchor="middle" fill="#64748b" font-size="7.5">You have now worked with all four sensors and understand how they connect and communicate</text>
        </svg>
      </div>

      <!-- Quick Reference (needed for Tasks 2 and 3) -->
      <details class="rounded-xl border border-base-300 bg-base-200/60 mt-3">
        <summary class="cursor-pointer px-4 py-3 text-sm font-semibold text-base-content select-none">📋 Quick Reference — ISDU Decode Formula &amp; CL50 Colour Table</summary>
        <div class="px-4 pb-4 pt-2 space-y-3 text-sm">
          <div>
            <p class="font-semibold text-base-content mb-1">ISDU Hex Decode</p>
            <p class="text-base-content/80">Convert the raw hex value to decimal, then multiply by the scale factor.</p>
            <p class="font-mono text-xs bg-base-300 rounded px-2 py-1 mt-1 text-base-content">decoded value = raw decimal × scale factor</p>
            <p class="text-xs text-base-content/60 mt-1">Example: <code class="font-mono bg-base-300 px-1 rounded">01 F4</code> hex → 500 decimal → × 0.1 = <strong>50.0 °C</strong></p>
            <p class="text-xs text-base-content/60">int16 values above 32767 are negative (two's complement). Scale factor for TV7105 temperatures: <strong>0.1</strong>.</p>
          </div>
          <div>
            <p class="font-semibold text-base-content mb-1">CL50 Colour Index — Octet2 Low Nibble</p>
            <div class="grid grid-cols-4 gap-1 text-xs font-mono">
              <span class="bg-green-500/20 rounded px-1">0 = Green</span><span class="bg-red-500/20 rounded px-1">1 = Red</span><span class="bg-orange-500/20 rounded px-1">2 = Orange</span><span class="bg-amber-500/20 rounded px-1">3 = Amber</span>
              <span class="bg-yellow-400/20 rounded px-1">4 = Yellow</span><span class="bg-lime-400/20 rounded px-1">5 = Lime</span><span class="bg-emerald-400/20 rounded px-1">6 = Spring</span><span class="bg-cyan-400/20 rounded px-1">7 = Cyan</span>
              <span class="bg-sky-400/20 rounded px-1">8 = Sky Blue</span><span class="bg-blue-500/20 rounded px-1">9 = Blue</span><span class="bg-violet-500/20 rounded px-1">10 = Violet</span><span class="bg-fuchsia-500/20 rounded px-1">11 = Magenta</span>
              <span class="bg-rose-500/20 rounded px-1">12 = Rose</span><span class="bg-gray-200/20 rounded px-1">13 = White</span><span class="rounded px-1 bg-base-300">14 = Custom1</span><span class="rounded px-1 bg-base-300">15 = Custom2</span>
            </div>
          </div>
        </div>
      </details>

      <!-- Live 4-port panel -->
      <div id="ws8-live-panel" class="rounded-xl overflow-hidden border border-slate-600/40 mt-3" style="background:#0f172a;font-family:'Courier New',monospace">
        <div class="flex items-center justify-between px-3 py-2" style="background:#1e293b;border-bottom:1px solid #334155">
          <span style="color:#94a3b8;font-size:0.6rem;font-weight:700;letter-spacing:0.12em">LIVE SYSTEM — CP3723 TRAINING KIT</span>
          <span id="ws8-live-badge" class="badge badge-xs badge-ghost font-mono" style="font-size:0.6rem">OFFLINE</span>
        </div>
        <div class="grid grid-cols-4" style="gap:1px;background:#1e293b">
          <div class="p-2 space-y-1" style="background:#0f172a">
            <div class="flex items-center gap-1.5">
              <div id="ws8-live-p1-dot" style="width:10px;height:10px;border-radius:50%;background:#1e293b;border:1.5px solid #334155;flex-shrink:0"></div>
              <span style="color:#3b82f6;font-size:0.55rem;font-weight:700">P1 INDUCTIVE</span>
            </div>
            <div class="flex items-center gap-1"><span style="color:#475569;font-size:0.52rem">OUT1</span><span id="ws8-live-p1-out1" style="color:#94a3b8;font-size:0.6rem;margin-left:4px">—</span></div>
            <div class="flex items-center gap-1"><span style="color:#475569;font-size:0.52rem">MON</span><span id="ws8-live-p1-mon" style="color:#94a3b8;font-size:0.6rem;margin-left:4px">—</span></div>
          </div>
          <div class="p-2 space-y-1" style="background:#0f172a">
            <div class="flex items-center gap-1.5">
              <div id="ws8-live-p2-dot" style="width:10px;height:10px;border-radius:50%;background:#1e293b;border:1.5px solid #334155;flex-shrink:0"></div>
              <span style="color:#8b5cf6;font-size:0.55rem;font-weight:700">P2 CAPACITIVE</span>
            </div>
            <div class="flex items-center gap-1"><span style="color:#475569;font-size:0.52rem">DET</span><span id="ws8-live-p2-det" style="color:#94a3b8;font-size:0.6rem;margin-left:4px">—</span></div>
            <div class="flex items-center gap-1"><span style="color:#475569;font-size:0.52rem">LINK</span><span id="ws8-live-p2-link" style="color:#94a3b8;font-size:0.6rem;margin-left:4px">—</span></div>
          </div>
          <div class="p-2 space-y-1" style="background:#0f172a">
            <div class="flex items-center gap-1.5">
              <div id="ws8-live-p3-dot" style="width:10px;height:10px;border-radius:50%;background:#1e293b;border:1.5px solid #334155;flex-shrink:0"></div>
              <span style="color:#f97316;font-size:0.55rem;font-weight:700">P3 TEMPERATURE</span>
            </div>
            <div class="flex items-center gap-1"><span style="color:#475569;font-size:0.52rem">TEMP</span><span id="ws8-live-p3-temp" style="color:#94a3b8;font-size:0.6rem;margin-left:4px">—</span></div>
            <div class="flex items-center gap-1"><span style="color:#475569;font-size:0.52rem">OUT1</span><span id="ws8-live-p3-out1" style="color:#94a3b8;font-size:0.6rem;margin-left:4px">—</span></div>
          </div>
          <div class="p-2 space-y-1" style="background:#0f172a">
            <div class="flex items-center gap-1.5">
              <div id="ws8-live-p4-dot" style="width:10px;height:10px;border-radius:4px;background:#1e293b;border:1.5px solid #334155;flex-shrink:0"></div>
              <span style="color:#22c55e;font-size:0.55rem;font-weight:700">P4 LIGHT STACK</span>
            </div>
            <div class="flex items-center gap-1"><span style="color:#475569;font-size:0.52rem">COLOR</span><span id="ws8-live-p4-color" style="color:#94a3b8;font-size:0.6rem;margin-left:4px">—</span></div>
            <div class="flex items-center gap-1"><span style="color:#475569;font-size:0.52rem">HEX</span><span id="ws8-live-p4-hex" style="color:#94a3b8;font-size:0.6rem;margin-left:4px">—</span></div>
          </div>
        </div>
      </div>

      <div class="space-y-4 mt-3">

        <!-- Task 1: Physical Interaction -->
        <div class="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
          <p class="font-bold text-base-content text-sm">Task 1 — Physical Interaction <span class="text-xs font-normal text-base-content/50">(auto-confirms via live data)</span></p>
          <p class="text-sm text-base-content/70">Trigger each sensor physically and watch the live panel above respond.</p>
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <div id="ws8-t1-p1-tick" class="w-7 h-7 rounded-full bg-base-300 border-2 border-base-300 flex items-center justify-center text-xs font-bold text-base-content/40 transition-all flex-shrink-0">1</div>
              <span class="text-sm text-base-content/80">Hold metal near Port 1 until OUT1 shows ON in the live panel</span>
            </div>
            <div class="flex items-center gap-3">
              <div id="ws8-t1-p2-tick" class="w-7 h-7 rounded-full bg-base-300 border-2 border-base-300 flex items-center justify-center text-xs font-bold text-base-content/40 transition-all flex-shrink-0">2</div>
              <span class="text-sm text-base-content/80">Touch Port 2 until DET shows YES in the live panel</span>
            </div>
            <div class="flex items-center gap-3">
              <div id="ws8-t1-p3-tick" class="w-7 h-7 rounded-full bg-base-300 border-2 border-base-300 flex items-center justify-center text-xs font-bold text-base-content/40 transition-all flex-shrink-0">3</div>
              <span class="text-sm text-base-content/80">Confirm a temperature reading is visible for Port 3</span>
            </div>
          </div>
        </div>

        <!-- Task 2: ISDU Read -->
        <div id="ws8-task2-wrap" class="rounded-xl border-2 border-warning/30 bg-warning/5 p-4 space-y-4 transition-opacity duration-300" style="opacity:0.35;pointer-events:none">
          <p class="font-bold text-base-content text-sm">Task 2 — ISDU Acyclic Read</p>
          <p class="text-sm text-base-content/70">IO-Link acyclic reads return raw hex data. You must know the parameter's data type and scale factor to interpret it. Work through Part A first, then read the live sensor.</p>

          <!-- Part A: hex decode -->
          <div class="rounded-xl border border-base-300 bg-base-200/50 p-3 space-y-3">
            <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Part A — Decode a Sample Response</p>
            <p class="text-sm text-base-content/80">A field engineer reads SP1 from a TV7105 on another machine. The IO-Link master returns this raw acyclic response:</p>
            <div class="rounded-lg font-mono text-sm px-4 py-3 flex items-center gap-3 flex-wrap" style="background:#0f172a;border:1px solid #334155">
              <span style="color:#475569">Index 583 · Sub 0</span>
              <span style="color:#334155">→</span>
              <span style="color:#f59e0b;font-weight:700;font-size:1.2em;letter-spacing:0.1em">01 F4</span>
            </div>
            <p class="text-xs text-base-content/60">Parameter registry: dtype = <span class="font-semibold">int16</span> · scale = <span class="font-semibold">×0.1</span> · unit = <span class="font-semibold">°C</span></p>
            <p class="text-sm text-base-content/80">Those two bytes represent the decimal integer <span class="font-mono font-bold text-warning">500</span>. The scale factor converts it to an engineering value.</p>
            <div class="space-y-2.5">
              <p class="text-sm text-base-content/80">Apply the scaling factor to the decimal integer — what temperature reading do you get?</p>
              <div class="flex flex-wrap gap-2">
                <button type="button" class="ws8-pA-opt btn btn-outline btn-sm font-mono" data-val="5.0">5.0 °C</button>
                <button type="button" class="ws8-pA-opt btn btn-outline btn-sm font-mono" data-val="50.0">50.0 °C</button>
                <button type="button" class="ws8-pA-opt btn btn-outline btn-sm font-mono" data-val="500">500 °C</button>
                <button type="button" class="ws8-pA-opt btn btn-outline btn-sm font-mono" data-val="0.5">0.5 °C</button>
              </div>
              <span id="ws8-pA-result" class="text-xs font-mono text-base-content/50"></span>
            </div>
          </div>

          <!-- Part B: live ISDU decode challenge (locked until Part A correct) -->
          <div id="ws8-partB-wrap" class="space-y-3 transition-opacity duration-300" style="opacity:0.35;pointer-events:none">
            <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Part B — Decode a Live Reading</p>
            <p class="text-sm text-base-content/70">Read the raw hex value of SP1 from the live temperature sensor. You will need to decode it.</p>
            <div class="rounded-lg font-mono text-xs px-3 py-2" style="background:#0f172a;color:#94a3b8;border:1px solid #334155">Port 3 · Index 583 · Sub 0 · int16 · ×0.1</div>
            <div class="flex items-center gap-3 flex-wrap">
              <button id="ws8-isdu-btn" type="button" class="btn btn-warning btn-sm gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                Read SP1 Raw Hex
              </button>
              <span id="ws8-isdu-result" class="text-xs font-mono text-base-content/60"></span>
            </div>
            <!-- decode MCQ — shown after raw hex is fetched -->
            <div id="ws8-partB-mcq" class="space-y-2.5" style="display:none">
              <p id="ws8-partB-decimal" class="text-sm text-base-content/80"></p>
              <p class="text-sm text-base-content/80">Apply int16 decoding and scale ×0.1 — what temperature reading do you get?</p>
              <div id="ws8-partB-opts" class="flex flex-wrap gap-2"></div>
              <span id="ws8-partB-result" class="text-xs font-mono text-base-content/50"></span>
            </div>
          </div>
        </div>

        <!-- Task 3: Actuator Control -->
        <div id="ws8-task3-wrap" class="rounded-xl border-2 border-info/30 bg-info/5 p-4 space-y-4 transition-opacity duration-300" style="opacity:0.35;pointer-events:none">
          <p class="font-bold text-base-content text-sm">Task 3 — PDout Actuator Control</p>
          <p class="text-sm text-base-content/70">The CL50 light stack is controlled by writing a 3-byte PDout value over IO-Link. Each byte encodes different fields. Use the table below to decode the value before writing it.</p>

          <!-- PDout field table (from Banner CL50PKQ datasheet) -->
          <div class="overflow-x-auto rounded-lg" style="border:1px solid #334155">
            <table class="w-full text-xs font-mono" style="background:#0f172a;border-collapse:collapse">
              <thead>
                <tr style="border-bottom:1px solid #334155">
                  <th class="px-3 py-2 text-left" style="color:#94a3b8">Field</th>
                  <th class="px-3 py-2 text-left" style="color:#94a3b8">Bits</th>
                  <th class="px-3 py-2 text-left" style="color:#94a3b8">Values</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid #1e293b">
                  <td class="px-3 py-1.5" style="color:#f59e0b">Color 1</td>
                  <td class="px-3 py-1.5" style="color:#64748b">4</td>
                  <td class="px-3 py-1.5" style="color:#cbd5e1">0=Green 1=Red 2=Orange 3=Amber 4=Yellow 5=Lime 6=Spring 7=Cyan 8=Sky Blue <span style="color:#3b82f6;font-weight:700">9=Blue</span> 10=Violet 11=Magenta 12=Rose 13=White</td>
                </tr>
                <tr style="border-bottom:1px solid #1e293b">
                  <td class="px-3 py-1.5" style="color:#f59e0b">Color 2</td>
                  <td class="px-3 py-1.5" style="color:#64748b">4</td>
                  <td class="px-3 py-1.5" style="color:#cbd5e1">Same index as Color 1</td>
                </tr>
                <tr style="border-bottom:1px solid #1e293b">
                  <td class="px-3 py-1.5" style="color:#f59e0b">Animation</td>
                  <td class="px-3 py-1.5" style="color:#64748b">3</td>
                  <td class="px-3 py-1.5" style="color:#cbd5e1">0=Off  1=Steady  2=Flash  3=Two Color Flash  4=Intensity Sweep</td>
                </tr>
                <tr style="border-bottom:1px solid #1e293b">
                  <td class="px-3 py-1.5" style="color:#f59e0b">Pulse Pattern</td>
                  <td class="px-3 py-1.5" style="color:#64748b">3</td>
                  <td class="px-3 py-1.5" style="color:#cbd5e1">0=Normal  1=Strobe  2=Three Pulse  3=SOS  4=Random</td>
                </tr>
                <tr style="border-bottom:1px solid #1e293b">
                  <td class="px-3 py-1.5" style="color:#f59e0b">Speed</td>
                  <td class="px-3 py-1.5" style="color:#64748b">2</td>
                  <td class="px-3 py-1.5" style="color:#cbd5e1">0=Medium  1=Fast  2=Slow</td>
                </tr>
                <tr style="border-bottom:1px solid #1e293b">
                  <td class="px-3 py-1.5" style="color:#f59e0b">Color 1 Intensity</td>
                  <td class="px-3 py-1.5" style="color:#64748b">3</td>
                  <td class="px-3 py-1.5" style="color:#cbd5e1">0=High  1=Low  2=Medium  3=Off  4=Custom</td>
                </tr>
                <tr style="border-bottom:1px solid #1e293b">
                  <td class="px-3 py-1.5" style="color:#f59e0b">Color 2 Intensity</td>
                  <td class="px-3 py-1.5" style="color:#64748b">3</td>
                  <td class="px-3 py-1.5" style="color:#cbd5e1">0=High  1=Low  2=Medium  3=Off  4=Custom</td>
                </tr>
                <tr>
                  <td class="px-3 py-1.5" style="color:#f59e0b">Audible</td>
                  <td class="px-3 py-1.5" style="color:#64748b">2</td>
                  <td class="px-3 py-1.5" style="color:#cbd5e1">0=Off  1=On  2=Pulsed  3=SOS Pulse</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Hex value to decode -->
          <div class="rounded-lg font-mono text-xs px-4 py-3 space-y-1" style="background:#0f172a;border:1px solid #334155">
            <div class="text-base-content/50 text-xs mb-1">PDout value to write →</div>
            <div class="flex items-baseline gap-3 flex-wrap">
              <span style="color:#f59e0b;font-weight:700;font-size:1.2em;letter-spacing:0.15em">00 01 09</span>
              <span style="color:#475569">Octet0=00  Octet1=01  Octet2=09</span>
            </div>
            <div style="color:#64748b">Octet2 low nibble = Color 1 index · Octet1 low 3 bits = Animation · Octet0 low 3 bits = C1 Intensity</div>
          </div>

          <!-- MCQ — what colour? -->
          <div class="space-y-2.5">
            <p class="text-sm text-base-content/80">Using the table above, what colour will the light stack display?</p>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="ws8-t3-mcq btn btn-outline btn-sm" data-val="green">Green</button>
              <button type="button" class="ws8-t3-mcq btn btn-outline btn-sm" data-val="blue">Blue</button>
              <button type="button" class="ws8-t3-mcq btn btn-outline btn-sm" data-val="red">Red</button>
              <button type="button" class="ws8-t3-mcq btn btn-outline btn-sm" data-val="white">White</button>
            </div>
            <span id="ws8-t3-mcq-result" class="text-xs font-mono text-base-content/50"></span>
          </div>

          <!-- Write/Restore (locked until MCQ answered) -->
          <div id="ws8-t3-action-wrap" class="space-y-2 transition-opacity duration-300" style="opacity:0.35;pointer-events:none">
            <p class="text-sm text-base-content/70">Now write the value to the light stack, observe the change, then restore green.</p>
            <div class="flex items-center gap-3 flex-wrap">
              <button id="ws8-pdout-write-btn" type="button" class="btn btn-info btn-sm">Write Blue (000109)</button>
              <button id="ws8-pdout-restore-btn" type="button" class="btn btn-success btn-sm" disabled>Restore Green (000100)</button>
            </div>
            <p id="ws8-pdout-status" class="text-xs font-mono text-base-content/50"></p>
          </div>
        </div>

        <!-- Task 4: Knowledge Check -->
        <div id="ws8-task4-wrap" class="rounded-xl border-2 border-secondary/30 bg-secondary/5 p-4 space-y-5 transition-opacity duration-300" style="opacity:0.35;pointer-events:none">
          <p class="font-bold text-base-content text-sm">Task 4 — Knowledge Check</p>

          <div class="space-y-2">
            <p class="text-sm font-medium text-base-content">Q1 — The Omron E2E instability alarm fires but OUT1 is still switching correctly. What is the right course of action?</p>
            <div class="space-y-1.5 text-sm pl-1">
              <label class="flex items-start gap-2 cursor-pointer"><input type="radio" name="ws8-q1" value="a" class="radio radio-xs radio-secondary mt-0.5 flex-shrink-0"> Ignore it — the output is working so there is no problem</label>
              <label class="flex items-start gap-2 cursor-pointer"><input type="radio" name="ws8-q1" value="b" class="radio radio-xs radio-secondary mt-0.5 flex-shrink-0"> Replace the sensor immediately</label>
              <label class="flex items-start gap-2 cursor-pointer"><input type="radio" name="ws8-q1" value="c" class="radio radio-xs radio-secondary mt-0.5 flex-shrink-0"> Investigate — instability means the target is at the edge of sensing range. Small vibrations will cause intermittent output. Reposition the target or adjust the sensing distance before it causes a fault</label>
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-base-content">Q2 — After replacing the capacitive sensor on Port 2, its output is ON even with nothing near it. Re-teaching did not fix it. What is the most likely cause?</p>
            <div class="space-y-1.5 text-sm pl-1">
              <label class="flex items-start gap-2 cursor-pointer"><input type="radio" name="ws8-q2" value="a" class="radio radio-xs radio-secondary mt-0.5 flex-shrink-0"> Output logic is set to NC — the sensor output is inverted so it is ON when nothing is present. Read the output logic parameter via ISDU to confirm, then write NO (0) to correct it</label>
              <label class="flex items-start gap-2 cursor-pointer"><input type="radio" name="ws8-q2" value="b" class="radio radio-xs radio-secondary mt-0.5 flex-shrink-0"> The IO-Link cable polarity is reversed — swap Pin 2 and Pin 4 at the master connector</label>
              <label class="flex items-start gap-2 cursor-pointer"><input type="radio" name="ws8-q2" value="c" class="radio radio-xs radio-secondary mt-0.5 flex-shrink-0"> SP1 is set correctly — the container wall is triggering the output and this is expected behaviour for a capacitive sensor</label>
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-base-content">Q3 — A temperature sensor reading drifts 3 °C high after months in service. No other system changes were made. What is the correct IO-Link field action?</p>
            <div class="space-y-1.5 text-sm pl-1">
              <label class="flex items-start gap-2 cursor-pointer"><input type="radio" name="ws8-q3" value="a" class="radio radio-xs radio-secondary mt-0.5 flex-shrink-0"> Replace the sensor — drift always indicates a faulty unit</label>
              <label class="flex items-start gap-2 cursor-pointer"><input type="radio" name="ws8-q3" value="b" class="radio radio-xs radio-secondary mt-0.5 flex-shrink-0"> Write a −3.0 °C calibration offset to the sensor via ISDU (index 681) to correct the reading in the field, verified against a reference thermometer</label>
              <label class="flex items-start gap-2 cursor-pointer"><input type="radio" name="ws8-q3" value="c" class="radio radio-xs radio-secondary mt-0.5 flex-shrink-0"> Adjust SP1 down by 3 °C to compensate for the drift</label>
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-base-content">Q4 — What is the key advantage of the IO-Link light stack over a conventionally wired one?</p>
            <div class="space-y-1.5 text-sm pl-1">
              <label class="flex items-start gap-2 cursor-pointer"><input type="radio" name="ws8-q4" value="a" class="radio radio-xs radio-secondary mt-0.5 flex-shrink-0"> IO-Link light stacks use less power</label>
              <label class="flex items-start gap-2 cursor-pointer"><input type="radio" name="ws8-q4" value="b" class="radio radio-xs radio-secondary mt-0.5 flex-shrink-0"> IO-Link light stacks can display more colours than conventional ones</label>
              <label class="flex items-start gap-2 cursor-pointer"><input type="radio" name="ws8-q4" value="c" class="radio radio-xs radio-secondary mt-0.5 flex-shrink-0"> All colours, animation patterns, and intensity levels are set by a single 3-byte PDout value over one standard cable. Conventional wiring needs a separate signal wire per segment</label>
            </div>
          </div>

          <div class="flex items-center gap-3 flex-wrap">
            <button id="ws8-qs-submit" type="button" class="btn btn-secondary btn-sm">Check Answers</button>
            <div id="ws8-qs-result" class="hidden rounded-lg px-3 py-2 text-sm"></div>
          </div>
        </div>

        <!-- Sign-off -->
        <div id="ws8-signoff-wrap" class="rounded-xl border-2 border-success/40 bg-success/5 p-4 space-y-3 transition-opacity duration-300" style="opacity:0.35;pointer-events:none">
          <p class="text-xs font-bold text-success uppercase tracking-wider">CP3723 Sign-Off Declaration</p>
          <div class="space-y-2 text-sm">
            <label class="kit-item flex items-start gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200"><input id="ws8-ck1" type="checkbox" class="checkbox checkbox-sm checkbox-success flex-shrink-0 mt-0.5"><span>I can identify all four IO-Link devices in this kit by port number, sensor type, and model name</span></label>
            <label class="kit-item flex items-start gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200"><input id="ws8-ck2" type="checkbox" class="checkbox checkbox-sm checkbox-success flex-shrink-0 mt-0.5"><span>I have physically triggered each sensor and observed the live response on this page</span></label>
            <label class="kit-item flex items-start gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200"><input id="ws8-ck3" type="checkbox" class="checkbox checkbox-sm checkbox-success flex-shrink-0 mt-0.5"><span>I understand IO-Link ISDU acyclic access and have read a parameter from a live sensor</span></label>
            <label class="kit-item flex items-start gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200"><input id="ws8-ck4" type="checkbox" class="checkbox checkbox-sm checkbox-success flex-shrink-0 mt-0.5"><span>I understand NC/NO output logic and how to diagnose and correct an inverted output using ISDU</span></label>
            <label class="kit-item flex items-start gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200"><input id="ws8-ck5" type="checkbox" class="checkbox checkbox-sm checkbox-success flex-shrink-0 mt-0.5"><span>I understand what IO-Link gives over conventional I/O — live diagnostics, acyclic parameter access, and smart actuation over a single unmodified cable</span></label>
          </div>
          <button id="ws8-complete-btn" type="button" class="btn btn-success btn-sm gap-2 mt-1" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
            Submit — CP3723 Complete
          </button>
          <div id="ws8-complete-msg" class="hidden rounded-lg bg-success/15 border border-success/40 px-4 py-3 text-sm font-semibold text-success text-center">✓ CP3723 signed off. Well done!</div>
        </div>

      </div>
    `
  }
];

const TOTAL = WORKSHEETS.length;

// ── Index HTML ─────────────────────────────────────────────────────────────────
function buildIndexHtml() {
  const cards = WORKSHEETS.map(function (ws, i) {
    const isEven = i % 2 === 0;
    const border = isEven ? 'border-primary/30 hover:border-primary' : 'border-secondary/30 hover:border-secondary';
    const badge  = isEven ? 'badge-primary' : 'badge-secondary';
    return `
      <button type="button" class="ws-index-link w-full text-left rounded-2xl border-2 bg-base-200/95 shadow-lg hover:shadow-xl transition-all duration-200 p-6 min-h-[140px] flex flex-col justify-center ${border}" data-worksheet-index="${i + 1}">
        <span class="badge ${badge} badge-sm w-fit mb-2">${ws.id}</span>
        <h3 class="font-bold text-lg text-base-content leading-tight">${ws.title}</h3>
        <p class="text-sm text-base-content/70 mt-1">${ws.shortDesc || ''}</p>
      </button>`;
  }).join('');
  return `
    <div class="worksheets-index max-w-5xl mx-auto space-y-6 relative min-h-full py-2 rounded-2xl" style="background:linear-gradient(160deg,hsl(var(--b2)) 0%,hsl(var(--b3)) 40%,hsl(var(--p)/0.06) 100%);">
      <header class="flex items-center gap-3 px-4 py-2 rounded-xl bg-primary/10 border border-primary/30">
        <span class="badge badge-primary badge-outline font-mono text-xs shrink-0">CP3723</span>
        <h1 class="text-base font-bold text-base-content tracking-tight truncate">Maintenance on Smart Sensors</h1>
        <span class="text-xs text-base-content/50 ml-auto shrink-0 hidden sm:inline">${TOTAL} worksheets</span>
      </header>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">${cards}</div>
      <footer class="pt-4 border-t-2 border-base-300 flex flex-wrap gap-2 items-center justify-between">
        <a href="#" data-page="io-link-master" class="btn btn-outline btn-sm gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Back to Dashboard
        </a>
        <button type="button" class="btn btn-ghost btn-sm gap-2 ws-print-btn">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
          Print
        </button>
      </footer>
    </div>`;
}



function buildWorksheetViewHtml(worksheetIndex) {
  const ws = WORKSHEETS[worksheetIndex - 1];
  if (!ws) return buildIndexHtml();
  const prev = worksheetIndex === 1 ? TOTAL : worksheetIndex - 1;
  const next = worksheetIndex === TOTAL ? 1 : worksheetIndex + 1;
  return `
    <div class="max-w-4xl mx-auto space-y-6 relative min-h-full py-2 rounded-2xl" style="background:linear-gradient(160deg,hsl(var(--b2)) 0%,hsl(var(--b3)) 45%,hsl(var(--s)/0.06) 100%);">
      <nav class="flex items-center justify-between gap-2 flex-wrap pb-4 border-b-2 border-primary/20 bg-base-200/50 rounded-lg px-3 py-2">
        <div class="flex items-center gap-2 flex-wrap">
          <button type="button" class="btn btn-outline btn-sm gap-2 ws-back-btn border-primary/40">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back
          </button>
          <button type="button" class="btn btn-ghost btn-sm ws-prev-btn">← ${prev}</button>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="btn btn-primary btn-sm ws-next-btn">${next} →</button>
          <button type="button" class="btn btn-ghost btn-sm ws-print-btn">Print</button>
        </div>
      </nav>
      <div class="card bg-base-200 shadow-xl border-2 border-primary/20 rounded-2xl overflow-hidden">
        <div class="card-body gap-4">
          <h2 class="card-title text-xl text-base-content border-b-2 border-primary/30 pb-2 gap-2">
            <span class="badge badge-primary badge-lg">${ws.id}</span>${ws.title}
          </h2>
          ${ws.contentHtml}
        </div>
      </div>
      <footer class="pt-4 border-t-2 border-base-300 flex items-center justify-between gap-2">
        <a href="#" data-page="io-link-master" class="btn btn-outline btn-sm gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Dashboard
        </a>
        <button type="button" class="btn btn-primary btn-sm gap-2 ws-next-btn">
          Next
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </button>
      </footer>
    </div>`;
}

// ── Live interactivity per worksheet ─────────────────────────────────────────
let _lastPhotoState = false;
let _photoWaveCount = 0;

let _lastCapState = false;
let _capTaskCount = 0;

let _chFailed = false;
let _chSucceeded = false;
let _chCapTolerance = 30;

let _tempBaseline = null;
let _alarmThreshold = 40;

// WS2 (smart sensor) challenge
let _ws2ChDone = false;

// WS3 (proximity) challenge — stability confirmation
let _ws3ChDone = false;

// WS4 (capacitive) challenge — commissioning scenario
let _ws4ChDone = false;
let _ws4Step = 0; // 0=read,1=teach,2=vfy-detect,3=vfy-clear,4=signoff,5=complete
let _ws4VerifyStart = null;
let _ws4VerifyDone = false;
let _ws4FaultCleanup = null; // kept for stopLiveData cleanup guard (always null now)
let _ws4LightCleanup = null; // restores CL50 to default on navigation away from WS4
let _ws4CurrentSp1 = null;

// WS5 (temperature) challenge — trigger alarm
let _ws5ChDone    = false;
let _ws5ChSeenOff = false; // must see out1=false before challenge can complete

// WS5 (temperature) calibration scenario
let _ws5CalStep = 0;  // 0=idle,1=injected,2=read,3=fixed,4=signoff
let _ws5CalVerifyStart = null;
let _ws5CalVerifyDone = false;
let _ws5CalCleanup = null;
let _ws5LightCleanup = null; // restores CL50 to default on navigation away from WS5
let _ws5PreInjectTemp = null;

// WS6 animation demo state
let _ws6AnimInterval = null;
let _ws6AnimCleanup = null;

// WS6 maintenance scenario — stale PDout / wrong light state
let _ws6MsStep = 0;
let _ws6MsVerifyStart = null;
let _ws6MsVerifyDone = false;
let _ws6MsCleanup = null;

// WS7 maintenance scenario — NC proximity fault + light stack clue
let _ws7MsStep = 0;
let _ws7MsVerifyStart = null;
let _ws7MsVerifyDone = false;
let _ws7MsCleanup = null;

// WS8 final assessment
let _ws8P1Done = false; let _ws8P2Done = false; let _ws8P3Done = false;
let _ws8IsduDone = false; let _ws8T3McqDone = false; let _ws8PdoutWritten = false; let _ws8PdoutRestored = false; let _ws8QsSubmitted = false;

// colour map for CL50
const CL_COLOUR_MAP = {
  'Green':'#22c55e','Red':'#ef4444','Orange':'#f97316','Amber':'#f59e0b',
  'Yellow':'#eab308','Lime Green':'#84cc16','Spring Green':'#10b981',
  'Cyan':'#06b6d4','Sky Blue':'#38bdf8','Blue':'#3b82f6','Violet':'#8b5cf6',
  'Magenta':'#ec4899','Rose':'#f43f5e','White':'#f8fafc'
};

function initLiveIntro(container) {
  _chFailed = false;
  _chSucceeded = false;
  _chCapTolerance = 30;
  const colours = { photo: '#3b82f6', cap: '#8b5cf6', temp: '#f97316', led: '#22c55e' };

  function setPortCard(dotId, valId, active, value, colour) {
    const dot = container.querySelector(`#${dotId}`);
    const val = container.querySelector(`#${valId}`);
    if (dot) {
      dot.style.backgroundColor = active ? colour : '';
      dot.style.boxShadow = active ? `0 0 8px ${colour}80` : '';
      dot.className = active
        ? 'w-6 h-6 rounded-full mx-auto transition-all'
        : 'w-6 h-6 rounded-full bg-base-300 mx-auto transition-all';
    }
    if (val) val.textContent = value;
  }

  startLiveData(data => {
    const connected = data && data.success;
    setLiveStatus('ws-intro-badge', !!data);

    const p1 = getPort(data, 1);
    const p2 = getPort(data, 2);
    const p3 = getPort(data, 3);
    const p4 = getPort(data, 4);

    const p1Active = connected && p1?.mode === 'io-link';
    const p2Active = connected && p2?.mode === 'io-link';
    const p3Active = connected && p3?.mode === 'io-link';
    const p4Active = connected && p4?.mode === 'io-link';

    const det1  = p1?.pdin_decoded?.object_present || p1?.pdin_decoded?.object_detected;
    const temp3 = p3?.pdin_decoded?.temperature_c;
    const c4    = p4?.pdin_decoded?.color1;
    const cnt2  = p2?.detection_counter ?? 0;

    const det2 = p2?.pdin_decoded?.object_detected;

    setPortCard('intro-p1-dot', 'intro-p1-val', p1Active,
      p1Active ? (det1 ? 'Metal detected ●' : 'No metal ○') : 'Inactive', colours.photo);
    setPortCard('intro-p2-dot', 'intro-p2-val', p2Active,
      p2Active ? (det2 ? 'Detected ●' : 'No object ○') : 'Inactive', colours.cap);
    setPortCard('intro-p3-dot', 'intro-p3-val', p3Active,
      p3Active && temp3 != null ? `${temp3.toFixed(1)} °C` : 'Inactive', colours.temp);
    setPortCard('intro-p4-dot', 'intro-p4-val', p4Active,
      p4Active && c4 ? c4 : 'Inactive', colours.led);

    // ── Challenge logic ──────────────────────────────────────────────────────
    const chP1dot = container.querySelector('#ch-p1-dot');
    const chP1val = container.querySelector('#ch-p1-val');
    const chP2dot = container.querySelector('#ch-p2-dot');
    const chP2val = container.querySelector('#ch-p2-val');
    const chP2bar = container.querySelector('#ch-p2-bar');
    const chP2raw = container.querySelector('#ch-p2-raw');
    const chResult = container.querySelector('#ch-result');
    if (!chP1dot) return;

    // Always update capacitive level bar (even after pass/fail)
    const capRaw = p2?.pdin_decoded?.analogue_value ?? 0;
    const capPct = Math.min(100, (capRaw / 65535) * 100);
    if (chP2bar) chP2bar.style.width = `${capPct.toFixed(1)}%`;
    if (chP2raw) chP2raw.textContent = `${capRaw} / 65535`;
    if (chP2bar) chP2bar.style.backgroundColor = det2 ? '#ef4444' : capPct > 5 ? '#f59e0b' : '#a855f7';

    if (!_chFailed && !_chSucceeded) {
      chP1dot.style.backgroundColor = det1 ? '#3b82f6' : '';
      chP1dot.style.boxShadow = det1 ? '0 0 10px #3b82f680' : '';
      chP1dot.className = det1 ? 'w-8 h-8 rounded-full mx-auto transition-all' : 'w-8 h-8 rounded-full bg-base-300 mx-auto transition-all';
      chP1val.textContent = det1 ? 'Detected ●' : 'No object ○';

      chP2dot.style.backgroundColor = det2 ? '#ef4444' : capPct > 5 ? '#f59e0b' : '';
      chP2dot.style.boxShadow = det2 ? '0 0 10px #ef444480' : '';
      chP2dot.className = (det2 || capPct > 5) ? 'w-8 h-8 rounded-full mx-auto transition-all' : 'w-8 h-8 rounded-full bg-base-300 mx-auto transition-all';
      chP2val.textContent = det2 ? 'Detected ●' : capPct > 0.5 ? `Level: ${capPct.toFixed(0)}%` : 'No object ○';

      if (capRaw > _chCapTolerance) {
        _chFailed = true;
        chResult.className = 'rounded-lg p-3 text-center font-bold text-sm bg-error/20 text-error border border-error/40';
        chResult.textContent = `✗ Failed — capacitive level hit ${capRaw} (tolerance: ${_chCapTolerance}). Reset and try again.`;
        chResult.classList.remove('hidden');
      } else if (det1) {
        _chSucceeded = true;
        chResult.className = 'rounded-lg p-3 text-center font-bold text-base bg-success/20 text-success border border-success/40';
        chResult.textContent = '✓ Challenge complete! Proximity triggered with metal object, capacitive clean.';
        chResult.classList.remove('hidden');
        chP1dot.style.backgroundColor = '#22c55e';
        chP1dot.style.boxShadow = '0 0 12px #22c55e80';
      }
    }
  });

  // Tolerance slider
  const tolSlider = container.querySelector('#ch-tol-slider');
  const tolLabel = container.querySelector('#ch-tol-label');
  if (tolSlider) {
    _chCapTolerance = parseInt(tolSlider.value, 10);
    tolSlider.addEventListener('input', () => {
      _chCapTolerance = parseInt(tolSlider.value, 10);
      if (tolLabel) tolLabel.textContent = _chCapTolerance;
    });
  }

  // Reset button
  const resetBtn = container.querySelector('#ch-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      _chFailed = false;
      _chSucceeded = false;
      const chResult = container.querySelector('#ch-result');
      if (chResult) chResult.classList.add('hidden');
      ['#ch-p1-dot','#ch-p2-dot'].forEach(id => {
        const el = container.querySelector(id);
        if (el) { el.style.backgroundColor = ''; el.style.boxShadow = ''; el.className = 'w-8 h-8 rounded-full bg-base-300 mx-auto transition-all'; }
      });
      ['#ch-p1-val','#ch-p2-val'].forEach(id => {
        const el = container.querySelector(id);
        if (el) el.textContent = '—';
      });
      const bar = container.querySelector('#ch-p2-bar');
      if (bar) { bar.style.width = '0%'; bar.style.backgroundColor = '#a855f7'; }
      const raw = container.querySelector('#ch-p2-raw');
      if (raw) raw.textContent = '0 / 65535';
    });
  }
}

function initSensorTypeAnimations(container) {
  _canvasAnimCancellers.forEach(c => { c.cancelled = true; });
  _canvasAnimCancellers = [];

  if (!container.querySelector('#ws2-anim-digital') && !container.querySelector('#ws2-anim-iolink')) return;

  function makeLoop(drawFn) {
    const token = { cancelled: false };
    _canvasAnimCancellers.push(token);
    function loop(t) {
      if (token.cancelled) return;
      try { drawFn(t); } catch (e) { /* keep looping even if one frame errors */ }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
  }

  function setupCanvas(el, h) {
    const ctx = el.getContext('2d');
    let ready = false, w = 0;
    return {
      ctx,
      init() {
        if (ready) return { w, h };
        const dpr = window.devicePixelRatio || 1;
        w = el.offsetWidth || 300;
        el.width = Math.round(w * dpr); el.height = Math.round(h * dpr);
        ctx.scale(dpr, dpr); ready = true;
        return { w, h };
      }
    };
  }

  // ── 1. Digital ────────────────────────────────────────────────────────────
  const digEl = container.querySelector('#ws2-anim-digital');
  if (digEl) {
    const { ctx, init } = setupCanvas(digEl, 120);
    const PERIOD = 2600, HALF = 1300, WIN = 7000;
    const LED_W = 110; // px reserved for indicator panel on left

    makeLoop(t => {
      const { w, h } = init();
      ctx.clearRect(0, 0, w, h);
      const curV = ((t % PERIOD) + PERIOD) % PERIOD < HALF ? 1 : 0;
      const col   = curV ? '#22c55e' : '#4b5563';
      const glow  = curV ? '#22c55e' : 'transparent';

      // ── LED panel (left) ─────────────────────────────────────────────────
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      rrect(ctx, 0, 0, LED_W - 8, h, 8); ctx.fill();

      // LED circle
      const cx = (LED_W - 8) / 2, cy = h / 2 - 12, r = 22;
      if (curV) {
        ctx.save(); ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34,197,94,0.25)'; ctx.fill(); ctx.restore();
      }
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill();
      ctx.beginPath(); ctx.arc(cx - 6, cy - 6, 6, 0, Math.PI * 2);
      ctx.fillStyle = curV ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.08)'; ctx.fill();

      // State labels
      ctx.textAlign = 'center';
      ctx.font = 'bold 15px system-ui,sans-serif';
      ctx.fillStyle = curV ? '#22c55e' : '#9ca3af';
      ctx.fillText(curV ? 'ON' : 'OFF', cx, cy + r + 16);
      ctx.font = '11px system-ui,sans-serif';
      ctx.fillStyle = curV ? '#86efac' : '#6b7280';
      ctx.fillText(curV ? '24 V' : '0 V', cx, cy + r + 30);
      ctx.textAlign = 'left';

      // ── Square wave (right) ───────────────────────────────────────────────
      const wX = LED_W, wW = w - LED_W, pad = 14;
      const sigH = h - pad * 2;

      // grid rails
      ctx.save(); ctx.strokeStyle = 'rgba(150,150,150,0.2)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(wX, pad);       ctx.lineTo(w, pad);
      ctx.moveTo(wX, h - pad); ctx.lineTo(w, h - pad); ctx.stroke(); ctx.setLineDash([]); ctx.restore();

      // "24V" / "0V" rail labels
      ctx.font = '9px system-ui,sans-serif'; ctx.fillStyle = 'rgba(150,150,150,0.7)';
      ctx.fillText('24V', wX + 4, pad + 10);
      ctx.fillText(' 0V', wX + 4, h - pad - 4);

      // waveform
      ctx.beginPath(); ctx.lineWidth = 2.5;
      let pv = -1;
      for (let x = 0; x <= wW; x++) {
        const ms = t - WIN + (x / wW) * WIN;
        const v  = ((ms % PERIOD) + PERIOD) % PERIOD < HALF ? 1 : 0;
        const px = wX + x, py = pad + (1 - v) * sigH;
        if (x === 0) { ctx.moveTo(px, py); }
        else { if (v !== pv) ctx.lineTo(px, pad + (1 - pv) * sigH); ctx.lineTo(px, py); }
        pv = v;
      }
      ctx.strokeStyle = curV ? '#22c55e' : '#6b7280'; ctx.stroke();

      // live dot at right edge
      ctx.beginPath(); ctx.arc(w - 6, pad + (1 - curV) * sigH, 5, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill();
    });
  }

  // ── 2. Analogue ───────────────────────────────────────────────────────────
  const anaEl = container.querySelector('#ws2-anim-analogue');
  if (anaEl) {
    const { ctx, init } = setupCanvas(anaEl, 130);
    const WIN = 7000;
    const AXIS_W = 38; // Y-axis label area

    function val(ms) { return 0.5 + 0.44 * Math.sin(ms / 2200 * Math.PI * 2); }

    makeLoop(t => {
      const { w, h } = init();
      ctx.clearRect(0, 0, w, h);
      const padT = 8, padB = 18;
      const sigH = h - padT - padB;
      const plotX = AXIS_W, plotW = w - AXIS_W - 6;

      // background
      ctx.fillStyle = 'rgba(245,158,11,0.04)';
      ctx.fillRect(plotX, padT, plotW, sigH);

      // Y-axis grid + labels
      const yTicks = [
        { v: 1.0, label: '20 mA' },
        { v: 0.75, label: '16 mA' },
        { v: 0.5,  label: '12 mA' },
        { v: 0.25, label: ' 8 mA' },
        { v: 0.0,  label: ' 4 mA' },
      ];
      ctx.save();
      ctx.font = '9px system-ui,sans-serif'; ctx.textAlign = 'right';
      yTicks.forEach(({ v, label }) => {
        const y = padT + (1 - v) * sigH;
        ctx.fillStyle = 'rgba(150,150,150,0.8)'; ctx.fillText(label, AXIS_W - 4, y + 3);
        ctx.strokeStyle = v === 0.5 ? 'rgba(245,158,11,0.2)' : 'rgba(150,150,150,0.13)';
        ctx.lineWidth = 1; ctx.setLineDash(v === 0.5 ? [] : [4, 4]);
        ctx.beginPath(); ctx.moveTo(plotX, y); ctx.lineTo(w - 6, y); ctx.stroke();
      });
      ctx.setLineDash([]); ctx.restore();

      // fill under curve
      ctx.beginPath();
      for (let x = 0; x <= plotW; x++) {
        const ms = t - WIN + (x / plotW) * WIN;
        const y  = padT + (1 - val(ms)) * sigH;
        if (x === 0) ctx.moveTo(plotX + x, y); else ctx.lineTo(plotX + x, y);
      }
      ctx.lineTo(plotX + plotW, padT + sigH); ctx.lineTo(plotX, padT + sigH); ctx.closePath();
      ctx.fillStyle = 'rgba(245,158,11,0.15)'; ctx.fill();

      // wave line
      ctx.beginPath();
      for (let x = 0; x <= plotW; x++) {
        const ms = t - WIN + (x / plotW) * WIN;
        const y  = padT + (1 - val(ms)) * sigH;
        if (x === 0) ctx.moveTo(plotX + x, y); else ctx.lineTo(plotX + x, y);
      }
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5; ctx.stroke();

      // live dot
      const cv = val(t);
      const dotY = padT + (1 - cv) * sigH;
      ctx.beginPath(); ctx.arc(plotX + plotW - 5, dotY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b'; ctx.fill();

      // value readout box top-right
      const mA  = (4 + cv * 16).toFixed(1);
      const bar = Math.round(cv * 100);
      const label = `${mA} mA  →  ${bar} bar`;
      ctx.font = 'bold 10px system-ui,sans-serif'; ctx.textAlign = 'right';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(245,158,11,0.15)';
      ctx.fillRect(w - tw - 14, padT + 2, tw + 10, 16);
      ctx.fillStyle = '#f59e0b'; ctx.fillText(label, w - 9, padT + 13);
      ctx.textAlign = 'left';

      // X-axis label
      ctx.font = '9px system-ui,sans-serif'; ctx.fillStyle = 'rgba(150,150,150,0.6)';
      ctx.fillText('time →', plotX + 4, h - 4);
    });
  }

  // ── 3. IO-Link wire visualisation ────────────────────────────────────────
  const iolEl = container.querySelector('#ws2-anim-iolink');
  if (iolEl) {
    const { ctx, init } = setupCanvas(iolEl, 200);

    const DIG_PERIOD = 2600, DIG_HALF = 1300, WIN = 5000;

    const PKT_TYPES = [
      { key: 'OUT1',  label: 'OUT1',       color: '#22c55e' },
      { key: 'Temp',  label: 'Temp',        color: '#f97316' },
      { key: 'Fault', label: 'Fault',       color: '#3b82f6' },
      { key: 'Model', label: 'Model',       color: '#7c3aed' },
      { key: 'SP1',   label: 'SP1',         color: '#ec4899' },
      { key: 'SN',    label: 'S/N',         color: '#0891b2' },
    ];

    const liveVals = {
      OUT1:  { text: 'HIGH',    color: '#22c55e', flash: 0 },
      Temp:  { text: '25.4°C',  color: '#f97316', flash: 0 },
      Fault: { text: 'NONE',    color: '#3b82f6', flash: 0 },
      Model: { text: 'TV7105',  color: '#7c3aed', flash: 0 },
      SP1:   { text: '40°C',    color: '#ec4899', flash: 0 },
      SN:    { text: '00128',   color: '#0891b2', flash: 0 },
    };

    let packets = [], pkIdx = 0, lastSpawn = null, prevT = null, tempV = 25.4, out1 = true;

    makeLoop(t => {
      const { w, h } = init();
      const dt = prevT ? Math.min(t - prevT, 50) : 16;
      prevT = t;
      if (lastSpawn === null) lastSpawn = t;

      ctx.clearRect(0, 0, w, h);

      // ── dark background ───────────────────────────────────────────────
      ctx.fillStyle = '#0f172a';
      rrect(ctx, 0, 0, w, h, 8); ctx.fill();

      // ── layout ────────────────────────────────────────────────────────
      const WY    = 72;           // wire centre Y
      const BOX_W = 62, BOX_H = 44;
      const SEN_CX = BOX_W / 2 + 8;
      const MAS_CX = w - BOX_W / 2 - 8;
      const WX1 = SEN_CX + BOX_W / 2 + 6;
      const WX2 = MAS_CX - BOX_W / 2 - 6;
      const WL  = WX2 - WX1;
      const PKT_SPEED  = WL / 1600;  // px/ms — crosses in 1.6 s
      const SPAWN_INTV = 530;

      const curV = ((t % DIG_PERIOD) + DIG_PERIOD) % DIG_PERIOD < DIG_HALF ? 1 : 0;

      // update live vals
      if ((curV === 1) !== out1) {
        out1 = curV === 1;
        liveVals.OUT1.text = out1 ? 'HIGH' : 'LOW';
      }
      tempV += (Math.random() - 0.5) * 0.06;
      liveVals.Temp.text = tempV.toFixed(1) + '°C';

      // ── sensor box ────────────────────────────────────────────────────
      const senX = SEN_CX - BOX_W / 2, senY = WY - BOX_H / 2;
      rrect(ctx, senX, senY, BOX_W, BOX_H, 7);
      ctx.fillStyle = curV ? 'rgba(34,197,94,0.12)' : 'rgba(30,41,59,0.9)';
      ctx.fill();
      if (curV) {
        ctx.save(); ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 14;
        ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
      } else {
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      // LED
      ctx.beginPath(); ctx.arc(SEN_CX, WY - 10, 5, 0, Math.PI * 2);
      ctx.fillStyle = curV ? '#22c55e' : '#1e293b'; ctx.fill();
      if (curV) {
        ctx.save(); ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 8; ctx.fill(); ctx.restore();
      }
      ctx.textAlign = 'center'; ctx.fillStyle = '#64748b'; ctx.font = '7px system-ui';
      ctx.fillText('IO-Link', SEN_CX, WY + 6);
      ctx.fillText('Sensor', SEN_CX, WY + 15);

      // ── master box ────────────────────────────────────────────────────
      const masX = MAS_CX - BOX_W / 2, masY = WY - BOX_H / 2;
      rrect(ctx, masX, masY, BOX_W, BOX_H, 7);
      ctx.fillStyle = 'rgba(59,130,246,0.12)'; ctx.fill();
      ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(MAS_CX, WY - 10, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6'; ctx.fill();
      ctx.textAlign = 'center'; ctx.fillStyle = '#93c5fd'; ctx.font = '7px system-ui';
      ctx.fillText('AL1350', MAS_CX, WY + 6);
      ctx.fillText('Master', MAS_CX, WY + 15);

      // ── 3-wire cable ──────────────────────────────────────────────────
      // find leading packet for glow
      const lead = packets.find(pk => pk.x > WX1 && pk.x < WX2);
      [{ off: -3, w: 1.5, c: '#1e3a2f' }, { off: 0, w: 3, c: '#334155' }, { off: 3, w: 1.5, c: '#1e2a3a' }]
        .forEach(({ off, w: lw, c }) => {
          ctx.beginPath(); ctx.moveTo(WX1, WY + off); ctx.lineTo(WX2, WY + off);
          ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.stroke();
        });

      // traveling glow along cable
      if (lead) {
        const rel = (lead.x - WX1) / WL;
        const spread = 80;
        const g = ctx.createLinearGradient(lead.x - spread, 0, lead.x + spread, 0);
        g.addColorStop(0, 'transparent');
        g.addColorStop(0.5, lead.color + '55');
        g.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.moveTo(WX1, WY); ctx.lineTo(WX2, WY);
        ctx.strokeStyle = g; ctx.lineWidth = 8; ctx.stroke();
      }

      // ── switching signal wave (below cable) ───────────────────────────
      const sigCY = WY + 26, sigAmp = 9;
      ctx.save(); ctx.beginPath(); ctx.rect(WX1, sigCY - sigAmp - 4, WL, (sigAmp + 4) * 2); ctx.clip();
      ctx.beginPath();
      let pv = -1;
      for (let x = 0; x <= WL; x++) {
        const ms = t - WIN + (x / WL) * WIN;
        const v  = ((ms % DIG_PERIOD) + DIG_PERIOD) % DIG_PERIOD < DIG_HALF ? 1 : 0;
        const px = WX1 + x, py = sigCY + (v ? -sigAmp : sigAmp);
        if (x === 0) ctx.moveTo(px, py);
        else { if (v !== pv) ctx.lineTo(px, pv ? sigCY - sigAmp : sigCY + sigAmp); ctx.lineTo(px, py); }
        pv = v;
      }
      ctx.strokeStyle = curV ? '#22c55e' : '#475569'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      ctx.font = '8px system-ui'; ctx.textAlign = 'left'; ctx.fillStyle = '#334155';
      ctx.fillText('OUT1', WX1 + 2, sigCY - sigAmp - 6);

      // ── spawn packets ─────────────────────────────────────────────────
      if (t - lastSpawn >= SPAWN_INTV) {
        lastSpawn = t;
        const pt = PKT_TYPES[pkIdx % PKT_TYPES.length]; pkIdx++;
        packets.push({ type: pt, x: WX1 + 2, color: pt.color, alpha: 0, arrived: false });
      }

      // ── update + draw packets ─────────────────────────────────────────
      packets = packets.filter(pk => {
        pk.x    += PKT_SPEED * dt;
        pk.alpha = Math.min(1, pk.alpha + 0.07);

        if (!pk.arrived && pk.x >= WX2 - 8) {
          pk.arrived = true;
          if (liveVals[pk.type.key]) liveVals[pk.type.key].flash = t + 450;
        }
        return pk.x < WX2 + 4;
      });

      packets.forEach(pk => {
        const label = pk.type.label + ': ' + (liveVals[pk.type.key]?.text || '');
        ctx.font = 'bold 9px system-ui'; ctx.textAlign = 'center';
        const tw = ctx.measureText(label).width + 14;
        const pillY = WY - 34, pillH = 16;

        ctx.globalAlpha = pk.alpha;
        ctx.save(); ctx.shadowColor = pk.color; ctx.shadowBlur = 10;
        ctx.fillStyle = pk.color;
        rrect(ctx, pk.x - tw / 2, pillY, tw, pillH, 4); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#fff'; ctx.fillText(label, pk.x, pillY + pillH - 4);
        // connector line pill → wire
        ctx.strokeStyle = pk.color + '50'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pk.x, pillY + pillH); ctx.lineTo(pk.x, WY - 2); ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // ── divider ───────────────────────────────────────────────────────
      const divY = WY + BOX_H / 2 + 22;
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(10, divY); ctx.lineTo(w - 10, divY); ctx.stroke();

      // ── received data panel ───────────────────────────────────────────
      const KEYS = ['OUT1', 'Temp', 'Fault', 'Model', 'SP1', 'SN'];
      const cols = 3, cellW = (w - 16) / cols, rowH = 24;
      const panelY = divY + 8;
      ctx.font = '8px system-ui'; ctx.textAlign = 'left';
      KEYS.forEach((key, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const cx = 8 + col * cellW, cy = panelY + row * rowH;
        const val = liveVals[key];
        const hot = t < val.flash;

        if (hot) {
          ctx.fillStyle = val.color + '22';
          rrect(ctx, cx, cy, cellW - 4, rowH - 2, 4); ctx.fill();
        }

        // dot
        ctx.save();
        if (hot) { ctx.shadowColor = val.color; ctx.shadowBlur = 8; }
        ctx.beginPath(); ctx.arc(cx + 8, cy + rowH / 2 - 1, 4, 0, Math.PI * 2);
        ctx.fillStyle = hot ? val.color : val.color + '70'; ctx.fill(); ctx.restore();

        // key label
        ctx.fillStyle = '#475569'; ctx.font = '8px system-ui';
        ctx.fillText(key, cx + 16, cy + 10);
        // value
        ctx.fillStyle = hot ? val.color : '#94a3b8'; ctx.font = 'bold 9px system-ui';
        ctx.fillText(val.text, cx + 16, cy + 22);
      });
    });
  }
}

function initLiveWs2Smart(container) {
  _ws2ChDone = false;
  initSensorTypeAnimations(container);
  const colours = { photo: '#3b82f6', cap: '#8b5cf6', temp: '#f97316', led: '#22c55e' };

  function setSmallDot(dotId, valId, active, value, colour) {
    const dot = container.querySelector(`#${dotId}`);
    const val = container.querySelector(`#${valId}`);
    if (dot) {
      dot.style.backgroundColor = active ? colour : '';
      dot.style.boxShadow = active ? `0 0 6px ${colour}80` : '';
      dot.className = active
        ? 'w-5 h-5 rounded-full mx-auto transition-all'
        : 'w-5 h-5 rounded-full bg-base-300 mx-auto transition-all';
    }
    if (val) val.textContent = value;
  }

  startLiveData(data => {
    setLiveStatus('ws2s-badge', !!data);
    const p1 = getPort(data, 1);
    const p2 = getPort(data, 2);
    const p3 = getPort(data, 3);
    const p4 = getPort(data, 4);

    const det1  = p1?.pdin_decoded?.object_present || p1?.pdin_decoded?.object_detected;
    const det2  = p2?.pdin_decoded?.object_detected;
    const temp3 = p3?.pdin_decoded?.temperature_c;
    const c4    = p4?.pdin_decoded?.color1;

    setSmallDot('ws2-ch-p1', 'ws2-ch-p1-val', !!det1, det1 ? 'Metal' : 'Clear', colours.photo);
    setSmallDot('ws2-ch-p2', 'ws2-ch-p2-val', !!det2, det2 ? 'Detected' : 'Clear', colours.cap);
    setSmallDot('ws2-ch-p3', 'ws2-ch-p3-val', p3?.mode === 'io-link',
      temp3 != null ? `${temp3.toFixed(1)}°C` : '—', colours.temp);
    setSmallDot('ws2-ch-p4', 'ws2-ch-p4-val', p4?.mode === 'io-link',
      c4 || '—', colours.led);

  });

  // ── Maintenance scenario — fault diagnosis ─────────────────────────────
  const FAULTS = [
    {
      name: 'Temperature Sensor Over-Setpoint (Port 3)',
      hints: [
        '[WARN]  ⚠ TV7105 Port[3] — SP1 alarm bit SET in PDin byte 2',
        '[WARN]  ⚠ temperature decode: Port[3] value=67.3°C threshold=40.0°C EXCEEDED',
        '[WARN]  ⚠ pdin_decode: Port[3] flags=0x02 — switching output 2 active (alarm)',
        '[WARN]  ⚠ isdu index=0x0247 SP1 setpoint=400 (40.0°C) — process value above limit',
      ],
      options: [
        { text: 'Temperature sensor on Port 3 is reading above its SP1 setpoint alarm', correct: true },
        { text: 'IO-Link communication lost — Port 3 device not responding', correct: false },
        { text: 'Wrong sensor plugged into Port 3 — identity mismatch detected', correct: false },
        { text: 'Supply voltage too low — master reporting undervoltage', correct: false },
      ],
    },
    {
      name: 'Proximity Sensor Output Stuck HIGH (Port 1)',
      hints: [
        '[WARN]  ⚠ Port[1] OUT1 state unchanged for 52 consecutive poll cycles',
        '[WARN]  ⚠ pdin_decode: Port[1] object_detected=True — no edge transition in 26s',
        '[WARN]  ⚠ switching_counter: Port[1] delta=0 over last 60s — output may be latched',
        '[WARN]  ⚠ Omron E2E-X16 Port[1] — instability alarm NOT set, target appears stationary',
      ],
      options: [
        { text: 'MQTT broker has disconnected — live data is stale', correct: false },
        { text: 'Proximity sensor Port 1 OUT1 output is stuck HIGH — no switching detected in 26 seconds', correct: true },
        { text: 'Temperature alarm triggered on Port 3', correct: false },
        { text: 'Capacitive sensor on Port 2 detecting a continuous object', correct: false },
      ],
    },
    {
      name: 'Wrong Device Connected to Port 2',
      hints: [
        '[WARN]  ⚠ Port[2] identity: vendor_id=310 — expected 1586 (RS Pro / Carlo Gavazzi)',
        '[WARN]  ⚠ device_id mismatch Port[2]: got 733 (ifm TV7105) expected 1052673',
        '[WARN]  ⚠ IODD lookup Port[2]: parameter map unavailable — wrong device type',
        '[WARN]  ⚠ Port[2] resolved as temperature sensor — capacitive parameter reads will fail',
      ],
      options: [
        { text: 'Port 2 switching output is stuck in the ON state', correct: false },
        { text: 'IO-Link master has lost its network connection', correct: false },
        { text: 'Wrong sensor plugged into Port 2 — a temperature sensor is present instead of the capacitive sensor', correct: true },
        { text: 'SP1 alarm active on the capacitive sensor on Port 2', correct: false },
      ],
    },
    {
      name: 'IO-Link Communication Loss (Port 3)',
      hints: [
        '[ERROR] Port[3] iolreadacyclic: timeout after 3000ms — no response from device',
        '[WARN]  ⚠ Port[3] mode transition: io-link → inactive — device offline',
        '[ERROR] pdin_fetch Port[3]: connection refused — PDin data unavailable',
        '[WARN]  ⚠ circuit_breaker Port[3]: consecutive_failures=5 — state=OPEN',
      ],
      options: [
        { text: 'Temperature sensor is reading above its configured setpoint', correct: false },
        { text: 'Port 3 IO-Link communication has been lost — the device is no longer responding', correct: true },
        { text: 'MQTT broker has stopped publishing data to the backend', correct: false },
        { text: 'Capacitive sensor on Port 2 is stuck in detection state', correct: false },
      ],
    },
    {
      name: 'Master Supply Voltage Undervoltage',
      hints: [
        '[WARN]  ⚠ supervision: processdatamaster/voltage = 18.2V — below 20V minimum',
        '[WARN]  ⚠ AL1350 supervisionstatus: voltage_alarm=True current=1.4A',
        '[WARN]  ⚠ supervision poll: supply voltage 18.2V — sensor reliability affected',
        '[WARN]  ⚠ getdatamulti: intermittent timeouts — possible brownout condition',
      ],
      options: [
        { text: 'IO-Link master supply voltage is below the minimum operating level', correct: true },
        { text: 'Temperature sensor calibration offset has drifted out of range', correct: false },
        { text: 'Port 1 proximity sensor cable has a wire break', correct: false },
        { text: 'MQTT publish rate is too high causing the broker to drop messages', correct: false },
      ],
    },
  ];

  const SPAM_POOL = [
    '[INFO]  poll_loop: tick #{n} elapsed {t}ms',
    '[DEBUG] mqtt: publish pdin port[{p}] 0x{hex}',
    '[INFO]  getdatamulti: 4 ports responded OK in 11ms',
    '[DEBUG] circuit_breaker: state=CLOSED consecutive_failures=0',
    '[INFO]  adaptive_poll: port[{p}] mode=io-link next_poll_in=1000ms',
    '[DEBUG] ws_broadcast: {c} client(s) connected',
    '[INFO]  isdu_cache: HIT index=0x{hi} port[{p}] age=12s',
    '[DEBUG] supervision: voltage=24.1V current=1.2A temp=38°C',
    '[INFO]  mqtt: heartbeat broker=192.168.7.2 latency=2ms',
    '[DEBUG] pdin_decode: port[{p}] recv {b} bytes OK',
    '[INFO]  al1350_client: connection pool active_conns=2 limit=3',
    '[DEBUG] device_tree: cache valid age={a}s TTL=300s',
    '[INFO]  getdatamulti: response 14ms ports_ok=4',
    '[DEBUG] port[{p}] vendor_id={vid} device_id={did} cached',
    '[INFO]  websocket: /ws keepalive sent to {c} client(s)',
    '[DEBUG] degraded_mode: False — using getdatamulti path',
    '[INFO]  mqtt: subscribe ack topics=3 qos=0',
    '[DEBUG] al1350: GET /iolinkmaster/port[{p}]/mode 200 OK',
    '[INFO]  poll_loop: tick #{n} elapsed {t}ms',
    '[DEBUG] pdin_history: port[{p}] buffer_fill=48/50',
  ];

  function buildSpamLine(tick) {
    const t = SPAM_POOL[Math.floor(Math.random() * SPAM_POOL.length)];
    return t
      .replace('{n}', String(tick).padStart(5, '0'))
      .replace('{t}', (0.5 + Math.random() * 2.5).toFixed(2))
      .replace('{p}', Math.floor(Math.random() * 4) + 1)
      .replace('{hex}', Math.floor(Math.random() * 65536).toString(16).padStart(4, '0'))
      .replace('{hi}', Math.floor(Math.random() * 256).toString(16).padStart(2, '0'))
      .replace('{b}', Math.floor(Math.random() * 6) + 2)
      .replace('{c}', Math.floor(Math.random() * 3) + 1)
      .replace('{a}', Math.floor(Math.random() * 280) + 10)
      .replace('{vid}', [310, 342, 612, 1586][Math.floor(Math.random() * 4)])
      .replace('{did}', [733, 131090, 1052673, 131842][Math.floor(Math.random() * 4)]);
  }

  function lineColor(line) {
    if (line.startsWith('[ERROR]')) return '#f87171';
    if (line.startsWith('[WARN]'))  return '#fbbf24';
    if (line.startsWith('[DEBUG]')) return '#475569';
    return '#64748b';
  }

  const startBtn    = container.querySelector('#ws2-start-btn');
  const consoleWrap = container.querySelector('#ws2-console-wrap');
  const consoleEl   = container.querySelector('#ws2-console');
  const diagWrap    = container.querySelector('#ws2-diag-wrap');
  const diagOptions = container.querySelector('#ws2-diag-options');
  const diagResult  = container.querySelector('#ws2-diag-result');
  const submitBtn   = container.querySelector('#ws2-submit-btn');
  const newBtn      = container.querySelector('#ws2-new-btn');

  let scenarioFault = null, submitted = false;
  let tick = 1000, linesSinceHint = 0, hintIdx = 0;

  const scenarioToken = { cancelled: false };
  _canvasAnimCancellers.push(scenarioToken);

  function appendConsoleLine(text) {
    if (!consoleEl) return;
    const d = document.createElement('div');
    d.style.color = lineColor(text);
    d.style.whiteSpace = 'nowrap';
    d.style.overflow = 'hidden';
    d.style.textOverflow = 'ellipsis';
    d.textContent = text;
    consoleEl.appendChild(d);
    while (consoleEl.children.length > 80) consoleEl.removeChild(consoleEl.firstChild);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  let scenarioIid = null;

  function stopScenario() {
    if (scenarioIid) { clearInterval(scenarioIid); scenarioIid = null; }
  }

  function startScenario() {
    stopScenario();
    submitted = false;
    tick = 10000 + Math.floor(Math.random() * 5000);
    linesSinceHint = 0; hintIdx = 0;

    // pick random fault
    scenarioFault = FAULTS[Math.floor(Math.random() * FAULTS.length)];

    // show sections
    if (consoleWrap) consoleWrap.classList.remove('hidden');
    if (diagWrap)    diagWrap.classList.remove('hidden');
    if (diagResult)  diagResult.classList.add('hidden');
    if (consoleEl)   consoleEl.innerHTML = '';

    // build shuffled options
    const opts = [...scenarioFault.options].sort(() => Math.random() - 0.5);
    if (diagOptions) {
      diagOptions.innerHTML = opts.map((o, i) =>
        `<label class="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-base-content/5 transition-colors">
          <input type="radio" name="ws2-diag" data-correct="${o.correct}" class="radio radio-sm radio-warning mt-0.5 flex-shrink-0">
          <span class="text-sm text-base-content leading-snug">${o.text}</span>
        </label>`
      ).join('');
      diagOptions.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('change', () => { if (submitBtn) submitBtn.disabled = false; });
      });
    }
    if (submitBtn) submitBtn.disabled = true;

    // pre-fill console with a burst of spam
    for (let i = 0; i < 10; i++) { tick++; appendConsoleLine(buildSpamLine(tick)); }

    // stream new lines
    scenarioIid = setInterval(() => {
      if (scenarioToken.cancelled) { clearInterval(scenarioIid); scenarioIid = null; return; }
      tick++;
      linesSinceHint++;
      // show a hint every 8-10 lines
      const hintDue = linesSinceHint >= 8 + Math.floor(Math.random() * 3);
      if (hintDue) {
        linesSinceHint = 0;
        appendConsoleLine(scenarioFault.hints[hintIdx % scenarioFault.hints.length]);
        hintIdx++;
      } else {
        appendConsoleLine(buildSpamLine(tick));
      }
    }, 300);
  }

  if (startBtn) startBtn.addEventListener('click', startScenario);

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (submitted || !scenarioFault) return;
      const checked = diagOptions ? diagOptions.querySelector('input:checked') : null;
      if (!checked) return;
      submitted = true;
      stopScenario();
      const correct = checked.dataset.correct === 'true';
      if (diagResult) {
        diagResult.className = 'rounded-lg p-3 font-bold text-sm ' +
          (correct
            ? 'bg-success/20 text-success border border-success/40'
            : 'bg-error/20 text-error border border-error/40');
        diagResult.textContent = correct
          ? '✓ Correct — ' + scenarioFault.name + '. You spotted the fault from the debug log.'
          : '✗ Not quite. Re-read the amber [WARN] lines in the console — they contain the clues. Try another scenario.';
        diagResult.classList.remove('hidden');
      }
    });
  }

  if (newBtn) {
    newBtn.addEventListener('click', () => {
      stopScenario();
      if (consoleWrap) consoleWrap.classList.add('hidden');
      if (diagWrap)    diagWrap.classList.add('hidden');
      submitted = false; scenarioFault = null;
    });
  }
}

// WS3 — now drives Omron E2E proximity sensor (was photoelectric)
function initLiveWs2(container) {
  _lastPhotoState = false;
  _photoWaveCount = 0;
  _ws3ChDone = false;

  let chart = null;
  let sigChart = null;
  let _ws3SdActive = false;
  let _ws3SdDone = false;
  let _ws3SdStableStart = null;
  let _ws3SdCelebEnd = 0; // timestamp until which the celebration flash runs
  let ws3SdChart = null;
  let ws3SdSigChart = null;

  // Maintenance scenario state — ISDU misconfiguration scenario
  let _msStep = 0; // 0=idle, 1=injected, 2=observed, 3=diagnosed, 4=read-done, 5=written, 6=verified
  let _msVerifyStart = null;
  let _msVerifyDone = false;

  // ── CL50 light stack control ─────────────────────────────────────────────────
  // Hex values: octet0=intensities, octet1=speed+pulse+anim, octet2=color2|color1
  // Colors: 0=Green 1=Red 3=Amber 4=Yellow 9=Blue  Anim: 1=Steady 2=Flash 3=TwoColorFlash
  const CL50 = {
    STANDBY:     '000109', // Steady Blue    — worksheet loaded, no scenario
    FAULT_ON:    '004201', // Fast Flash Red  — NC fault: output ON with no object
    FAULT_OBJ:   '000103', // Steady Amber    — object present suppresses inverted output
    DIAGNOSING:  '004203', // Fast Flash Amber — investigating fault
    READING:     '000109', // Steady Blue     — ISDU read step
    LIVE_DET:    '000100', // Steady Green    — object detected (step 0, normal mode)
    DETECT_OK:   '004200', // Fast Flash Green — correct detection after fix
    WAIT_DETECT: '000109', // Steady Blue     — fixed, waiting for object
    UNSTABLE:    '004201', // Fast Flash Red   — instability alarm
    SUCCESS:     '004340', // Two-Color Green+Yellow flash — scenario complete!
    DEFAULT:     '000100', // Steady Green    — app default
  };
  let _lastLightHex = null;
  function lightSet(hex) {
    if (hex === _lastLightHex) return;
    const prev = _lastLightHex;
    _lastLightHex = hex;
    const base = window.IO_LINK_API_BASE || '';
    fetch(`${base}/api/io-link/port/4/pdout`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: hex }),
    }).catch(() => { _lastLightHex = prev; }); // reset on failure so next tick retries
  }
  lightSet(CL50.STANDBY);
  _ws3LightCleanup = () => {
    const base = window.IO_LINK_API_BASE || '';
    fetch(`${base}/api/io-link/port/4/pdout`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: CL50.DEFAULT }),
    }).catch(() => {});
  };

  startLiveData(data => {
    if (!chart) chart = makeChart('ws2-chart', 'line',
      [{ data: Array(60).fill(0), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)',
         fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 }], -0.1, 1.2, '');
    if (!sigChart) sigChart = makeChart('ws2-sig-chart', 'line',
      [{ data: Array(60).fill(0), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)',
         fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 }], -0.1, 1.2, '');
    const port = getPort(data, 1);
    setLiveStatus('ws2-live-badge', !!port);
    if (!port || !port.pdin_decoded) return;

    // Omron uses object_present; keep object_detected as fallback
    const det     = port.pdin_decoded.object_present || port.pdin_decoded.object_detected || false;
    const instab  = port.pdin_decoded.instability_alarm   || false;
    const overApp = port.pdin_decoded.over_approach_alarm || false;

    // detection dot
    const dot = container.querySelector('#ws2-dot');
    if (dot) {
      dot.className = det
        ? 'w-8 h-8 rounded-full border-2 shadow-md transition-all duration-150 bg-success border-success shadow-success/40'
        : 'w-8 h-8 rounded-full border-2 shadow-md transition-all duration-150 bg-base-300 border-base-300';
    }
    const lbl = container.querySelector('#ws2-state-label');
    if (lbl) lbl.textContent = det ? 'Metal detected' : 'No metal';
    const qLbl = container.querySelector('#ws2-quality-label');
    if (qLbl) {
      const alarms = [];
      if (instab)  alarms.push('Instability');
      if (overApp) alarms.push('Over-approach');
      qLbl.textContent = alarms.length ? `Alarms: ${alarms.join(', ')}` : 'Alarms: None';
      qLbl.className = alarms.length
        ? 'text-xs text-warning mt-0.5 font-semibold'
        : 'text-xs text-base-content/60 mt-0.5';
    }

    // task: count rising edges
    if (det && !_lastPhotoState) {
      _photoWaveCount = Math.min(_photoWaveCount + 1, 5);
      const prog = container.querySelector('#ws2-wave-progress');
      const cnt  = container.querySelector('#ws2-wave-count');
      if (prog) prog.value = _photoWaveCount;
      if (cnt)  cnt.textContent = `${_photoWaveCount} / 5`;
      if (_photoWaveCount >= 5) {
        container.querySelector('#ws2-task-done')?.classList.remove('hidden');
      }
    }
    _lastPhotoState = det;

    // ── HMI diagnostic terminal: live process values (all panels) ────────────
    const monVal = port.pdin_decoded.monitor_output != null ? String(port.pdin_decoded.monitor_output) : '—';
    [
      ['#ws3-hmi-det',    '#ws3-obs-det',    '#ws3-vfy-det'],
      ['#ws3-hmi-instab', '#ws3-obs-instab', '#ws3-vfy-instab'],
      ['#ws3-hmi-overapp','#ws3-obs-overapp','#ws3-vfy-overapp'],
      ['#ws3-hmi-mon',    '#ws3-obs-mon',    '#ws3-vfy-mon'],
    ].forEach(([...ids], i) => {
      ids.forEach(id => {
        const el = container.querySelector(id);
        if (!el) return;
        if (i === 0) { el.textContent = det ? 'DETECTED' : 'NO OBJECT'; el.className = det ? 'font-bold text-success font-mono text-xs' : 'font-bold text-error font-mono text-xs'; }
        else if (i === 1) { el.textContent = instab ? 'ACTIVE' : 'CLEAR'; el.className = instab ? 'font-bold text-warning font-mono text-xs' : 'font-bold text-neutral-content/60 font-mono text-xs'; }
        else if (i === 2) { el.textContent = overApp ? 'ACTIVE' : 'CLEAR'; el.className = overApp ? 'font-bold text-error font-mono text-xs' : 'font-bold text-neutral-content/60 font-mono text-xs'; }
        else { el.textContent = monVal; }
      });
    });

    // ── Maintenance scenario: verify step (step 5 — after ISDU write) ─────────
    if (_msStep === 5 && !_msVerifyDone) {
      const vfyBar   = container.querySelector('#ws3-ms-vfy-bar');
      const vfyPct   = container.querySelector('#ws3-ms-vfy-pct');
      const vfyTbar  = container.querySelector('#ws3-ms-vfy-tbar');
      const vfyTimer = container.querySelector('#ws3-ms-vfy-timer');
      if (det && !instab) {
        if (!_msVerifyStart) _msVerifyStart = Date.now();
        const elapsed = (Date.now() - _msVerifyStart) / 1000;
        const pct = Math.min(elapsed / 3 * 100, 100);
        if (vfyPct)   { vfyPct.textContent = 'DETECTED — STABLE ✓'; vfyPct.style.color = '#4ade80'; }
        if (vfyBar)   { vfyBar.style.width = '100%'; vfyBar.style.background = '#16a34a'; }
        if (vfyTbar)  vfyTbar.style.width = `${pct}%`;
        if (vfyTimer) vfyTimer.textContent = `${elapsed.toFixed(1)} s / 3.0 s`;
        if (elapsed >= 3) {
          _msVerifyDone = true;
          _msStep = 6;
          _ws3ChDone = true;
          container.querySelector('#ws3-ms-signoff')?.classList.remove('hidden');
        }
      } else {
        _msVerifyStart = null;
        if (vfyPct)  { vfyPct.textContent = !det ? 'Waiting for detection…' : 'DETECTED — UNSTABLE'; vfyPct.style.color = !det ? '' : '#f59e0b'; }
        if (vfyBar)  { vfyBar.style.width = !det ? '0%' : '40%'; vfyBar.style.background = !det ? 'rgba(255,255,255,0.12)' : '#d97706'; }
        if (vfyTbar)  vfyTbar.style.width = '0%';
        if (vfyTimer) vfyTimer.textContent = '0.0 s / 3.0 s';
      }
    }

    // ── Steady-hold challenge ────────────────────────────────────────────────
    if (_ws3SdActive && !_ws3SdDone) {
      const sdDot   = container.querySelector('#ws3-sd-dot');
      const sdLabel = container.querySelector('#ws3-sd-label');
      const sdBar   = container.querySelector('#ws3-sd-bar');
      const sdTimer = container.querySelector('#ws3-sd-timer');

      if (det && !instab) {
        if (!_ws3SdStableStart) _ws3SdStableStart = Date.now();
        const elapsed = (Date.now() - _ws3SdStableStart) / 1000;
        const pct = Math.min(elapsed / 10 * 100, 100);
        if (sdDot)   sdDot.className   = 'w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all duration-150 bg-success border-success shadow-md shadow-success/40';
        if (sdLabel) sdLabel.textContent = `Stable — ${elapsed.toFixed(1)} s`;
        if (sdBar)   { sdBar.style.width = `${pct}%`; sdBar.className = 'h-4 rounded-full transition-all duration-300 bg-success'; }
        if (sdTimer) sdTimer.textContent = `${elapsed.toFixed(1)} s / 10.0 s`;
        if (elapsed >= 10) {
          _ws3SdDone = true;
          _ws3SdCelebEnd = Date.now() + 5000; // 5 seconds of celebration flash
          const sdResult = container.querySelector('#ws3-sd-result');
          if (sdResult) {
            sdResult.className = 'rounded-lg p-3 text-center font-bold text-sm bg-success/20 text-success border border-success/40';
            sdResult.textContent = '✓ Challenge complete — 10 seconds of stable detection with no instability alarm!';
            sdResult.classList.remove('hidden');
          }
          const sdBtn = container.querySelector('#ws3-sd-start');
          if (sdBtn) { sdBtn.disabled = false; sdBtn.textContent = 'Restart Challenge'; }
          const sdStatus = container.querySelector('#ws3-sd-status');
          if (sdStatus) sdStatus.textContent = 'Passed!';
        }
      } else {
        _ws3SdStableStart = null;
        if (sdDot)   sdDot.className = det
          ? 'w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all duration-150 bg-warning border-warning'
          : 'w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all duration-150 bg-base-300 border-base-300';
        if (sdLabel) sdLabel.textContent = !det ? 'No metal detected — bring it closer' : 'Instability alarm — reposition the target';
        if (sdBar)   { sdBar.style.width = '0%'; sdBar.className = 'h-4 rounded-full transition-all duration-300 bg-primary'; }
        if (sdTimer) sdTimer.textContent = '0.0 s / 10.0 s';
      }
      pushToChart(ws3SdChart, det ? 1 : 0);
      pushToChart(ws3SdSigChart, instab ? 1 : 0);
    }

    // ── CL50 light reaction to scenario state ───────────────────────────────────
    if (Date.now() < _ws3SdCelebEnd) {
      lightSet(CL50.SUCCESS); // celebration flash after 10s challenge complete
    } else if (_msStep === 0) {
      lightSet(instab ? CL50.UNSTABLE : (det ? CL50.LIVE_DET : CL50.STANDBY));
    } else if (_msStep === 1) {
      // NC fault active: OUT1 ON when no object (det=true = nothing there in NC mode)
      lightSet(det ? CL50.FAULT_ON : CL50.FAULT_OBJ);
    } else if (_msStep === 2 || _msStep === 3) {
      lightSet(CL50.DIAGNOSING);
    } else if (_msStep === 4) {
      lightSet(CL50.READING);
    } else if (_msStep === 5) {
      lightSet(instab ? CL50.UNSTABLE : (det ? CL50.DETECT_OK : CL50.WAIT_DETECT));
    } else {
      lightSet(CL50.SUCCESS);
    }

    pushToChart(chart, det ? 1 : 0);
    pushToChart(sigChart, instab ? 1 : 0);
  });

  // Steady-hold challenge — Start button
  const sdStartBtn = container.querySelector('#ws3-sd-start');
  if (sdStartBtn) {
    sdStartBtn.addEventListener('click', () => {
      _ws3SdActive = true;
      _ws3SdDone = false;
      _ws3SdStableStart = null;
      sdStartBtn.disabled = true;
      sdStartBtn.textContent = 'Running…';
      const sdStatus = container.querySelector('#ws3-sd-status');
      if (sdStatus) sdStatus.textContent = 'Challenge active — hold steady!';
      const sdBody = container.querySelector('#ws3-sd-body');
      if (sdBody) sdBody.classList.remove('hidden');
      const sdResult = container.querySelector('#ws3-sd-result');
      if (sdResult) sdResult.classList.add('hidden');
      const sdBar = container.querySelector('#ws3-sd-bar');
      if (sdBar) { sdBar.style.width = '0%'; sdBar.className = 'h-4 rounded-full transition-all duration-300 bg-primary'; }
      const sdTimer = container.querySelector('#ws3-sd-timer');
      if (sdTimer) sdTimer.textContent = '0.0 s / 10.0 s';
      const sdLabel = container.querySelector('#ws3-sd-label');
      if (sdLabel) sdLabel.textContent = 'Waiting for metal...';
      const sdDot = container.querySelector('#ws3-sd-dot');
      if (sdDot) sdDot.className = 'w-5 h-5 rounded-full bg-base-300 border-2 border-base-300 flex-shrink-0 transition-all duration-150';
      // init charts after layout settles (canvas was hidden)
      requestAnimationFrame(() => {
        ws3SdChart = makeChart('ws3-sd-det-chart', 'line',
          [{ data: Array(60).fill(0), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)',
             fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 }], -0.1, 1.2, '');
        ws3SdSigChart = makeChart('ws3-sd-instab-chart', 'line',
          [{ data: Array(60).fill(0), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)',
             fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 }], -0.1, 1.2, '');
      });
    });
  }

  // ── HMI scenario: inject fault ───────────────────────────────────────────────
  const injectBtn = container.querySelector('#ws3-ms-inject-btn');
  if (injectBtn) {
    injectBtn.addEventListener('click', async () => {
      injectBtn.disabled = true;
      injectBtn.textContent = 'Injecting…';
      const status = container.querySelector('#ws3-ms-inject-status');
      if (status) { status.textContent = 'Writing NC to sensor via ISDU…'; status.className = 'text-xs font-mono text-neutral-content/60'; }
      const ok = await isduWrite(1, 61, 1, 1, 'uint8', 1, null);
      if (ok) {
        _msStep = 1;
        _ws3FaultCleanup = () => isduWrite(1, 61, 1, 0, 'uint8', 1, null);
        injectBtn.textContent = 'Scenario Active ✓';
        injectBtn.disabled = true;
        injectBtn.style.color = '#4ade80';
        injectBtn.style.borderColor = '#4ade80';
        if (status) { status.textContent = ''; }
        container.querySelector('#ws3-ms-observe')?.classList.remove('hidden');
      } else {
        injectBtn.disabled = false;
        injectBtn.textContent = 'Start Scenario';
        if (status) { status.textContent = '✗ Failed — check IO-Link connection'; status.className = 'text-xs font-mono text-error'; }
      }
    });
  }

  // ── HMI scenario: observe → continue ─────────────────────────────────────────
  const observeNext = container.querySelector('#ws3-ms-observe-next');
  if (observeNext) {
    observeNext.addEventListener('click', () => {
      _msStep = 2;
      container.querySelector('#ws3-ms-diag')?.classList.remove('hidden');
      observeNext.disabled = true;
    });
  }

  // ── HMI scenario: diagnosis chips ───────────────────────────────────────────
  container.querySelectorAll('#ws3-ms-diag [data-ans]').forEach(btn => {
    btn.addEventListener('click', () => {
      const fb = container.querySelector('#ws3-ms-diag-fb');
      if (btn.dataset.ans === 'nc') {
        _msStep = 3;
        container.querySelectorAll('#ws3-ms-diag [data-ans]').forEach(b => { b.disabled = true; b.style.opacity = '0.4'; });
        btn.style.opacity = '1';
        btn.style.color = '#4ade80';
        btn.style.borderColor = '#4ade80';
        if (fb) { fb.textContent = '✓ Correct — the IODD defines a Switchpoint Logic parameter (Index 0x3D / Sub 1) that controls NO vs NC output polarity. Proceed to read it directly from the device and confirm.'; fb.className = 'text-sm font-semibold text-success'; fb.classList.remove('hidden'); }
        container.querySelector('#ws3-ms-read')?.classList.remove('hidden');
      } else if (btn.dataset.ans === 'hw') {
        if (fb) { fb.textContent = 'Not quite — mechanical damage to the coil would show erratic monitor output values or IO-Link comms errors, not a clean inverted signal. The Monitor Out value is stable and comms are healthy. Consistently inverted output with no other alarms points strongly to a configuration issue.'; fb.className = 'text-sm font-semibold text-warning'; fb.classList.remove('hidden'); }
      } else {
        if (fb) { fb.textContent = 'Not quite — swapping IO-Link cable polarity at the master would break the communication entirely; you\'d see no process data at all. The alarm log confirms comms were re-established cleanly at 04:52. Look at what parameter controls the output switching direction on an inductive sensor.'; fb.className = 'text-sm font-semibold text-warning'; fb.classList.remove('hidden'); }
      }
    });
  });

  // ── HMI scenario: read parameter ─────────────────────────────────────────────
  const readBtn = container.querySelector('#ws3-ms-read-btn');
  if (readBtn) {
    readBtn.addEventListener('click', async () => {
      readBtn.disabled = true;
      readBtn.textContent = 'Reading…';
      const status = container.querySelector('#ws3-ms-read-status');
      if (status) { status.textContent = 'ISDU read in progress…'; status.className = 'text-xs font-mono text-neutral-content/60'; }
      const val = await isduRead(1, 61, 1, 'uint8', 1);
      readBtn.textContent = 'Read Parameter →';
      readBtn.disabled = false;
      if (val !== null) {
        const resultDiv = container.querySelector('#ws3-ms-read-result');
        const hexEl     = container.querySelector('#ws3-ms-read-hex');
        const valEl     = container.querySelector('#ws3-ms-read-val');
        const interpEl  = container.querySelector('#ws3-ms-read-interp');
        if (status) { status.textContent = 'Read OK'; status.className = 'text-xs font-mono text-success'; }
        if (hexEl) hexEl.textContent = `0x${val.toString(16).padStart(2, '0').toUpperCase()}`;
        if (valEl) {
          valEl.textContent = val === 1 ? '1 — NC (Normally Closed) ⚠ MISCONFIGURED' : '0 — NO (Normally Open) ✓ CORRECT';
          valEl.style.color = val === 1 ? '#f87171' : '#4ade80';
        }
        if (interpEl) {
          if (val === 1) {
            interpEl.textContent = '⚠ Confirmed: Switchpoint Logic is NC. Output ON = no metal present. This is the root cause of false detections on the empty belt.';
            interpEl.className = 'text-error mt-1';
          } else {
            interpEl.textContent = '✓ Switchpoint Logic is already NO. Sensor is correctly configured — re-read to confirm after any writes.';
            interpEl.className = 'text-success mt-1';
          }
        }
        if (resultDiv) resultDiv.classList.remove('hidden');
        _msStep = Math.max(_msStep, 4);
        const nextBtn = container.querySelector('#ws3-ms-read-next');
        if (nextBtn) nextBtn.classList.remove('hidden');
      } else {
        if (status) { status.textContent = '✗ Read failed — check IO-Link connection'; status.className = 'text-xs font-mono text-error'; }
      }
    });
  }

  // ── HMI scenario: read → write transition ────────────────────────────────────
  const readNext = container.querySelector('#ws3-ms-read-next');
  if (readNext) {
    readNext.addEventListener('click', () => {
      container.querySelector('#ws3-ms-write')?.classList.remove('hidden');
      readNext.disabled = true;
    });
  }

  // ── HMI scenario: write fix ───────────────────────────────────────────────────
  const writeBtn = container.querySelector('#ws3-ms-write-btn');
  if (writeBtn) {
    writeBtn.addEventListener('click', async () => {
      writeBtn.disabled = true;
      writeBtn.textContent = 'Writing…';
      const status = container.querySelector('#ws3-ms-write-status');
      if (status) { status.textContent = 'ISDU write in progress…'; status.className = 'text-xs font-mono text-neutral-content/60'; }
      const ok = await isduWrite(1, 61, 1, 0, 'uint8', 1, null);
      writeBtn.textContent = 'Write NO (0x00) to Sensor →';
      if (ok) {
        _msStep = 5;
        _ws3FaultCleanup = null; // sensor is now correct — no cleanup needed on navigation
        writeBtn.style.color = '#4ade80';
        writeBtn.style.borderColor = '#4ade80';
        if (status) { status.textContent = 'Write OK — Switchpoint Logic restored to NO'; status.className = 'text-xs font-mono text-success'; }
        container.querySelector('#ws3-ms-verify')?.classList.remove('hidden');
      } else {
        writeBtn.disabled = false;
        if (status) { status.textContent = '✗ Write failed — retry'; status.className = 'text-xs font-mono text-error'; }
      }
    });
  }

  // ── HMI scenario: sign-off checkboxes ───────────────────────────────────────
  ['ws3-ms-ck1', 'ws3-ms-ck2', 'ws3-ms-ck3'].forEach(id => {
    container.querySelector(`#${id}`)?.addEventListener('change', () => {
      const all = ['ws3-ms-ck1', 'ws3-ms-ck2', 'ws3-ms-ck3'].every(cid => container.querySelector(`#${cid}`)?.checked);
      const btn = container.querySelector('#ws3-ms-close-btn');
      if (btn) btn.disabled = !all;
    });
  });

  // ── HMI scenario: close ticket ──────────────────────────────────────────────
  const msCloseBtn = container.querySelector('#ws3-ms-close-btn');
  if (msCloseBtn) {
    msCloseBtn.addEventListener('click', () => {
      msCloseBtn.disabled = true;
      msCloseBtn.textContent = 'TICKET CLOSED';
      const dot = container.querySelector('#ws3-hdr-dot');
      if (dot) { dot.classList.remove('animate-pulse', 'bg-error'); dot.classList.add('bg-success'); }
      const faultLbl = container.querySelector('#ws3-hdr-status');
      if (faultLbl) { faultLbl.textContent = 'RESOLVED'; faultLbl.classList.remove('text-error'); faultLbl.classList.add('text-success'); }
      const result = container.querySelector('#ws3-ch-result');
      if (result) {
        result.textContent = '✓ MJT-2247 CLOSED — Root cause confirmed (Switchpoint Logic OUT1 NC → NO), corrected via ISDU write, operation verified. Line 3 cleared for restart.';
        result.classList.remove('hidden');
      }
    });
  }

  // ── HMI scenario: reset ─────────────────────────────────────────────────────
  const ws3Reset = container.querySelector('#ws3-ch-reset');
  if (ws3Reset) {
    ws3Reset.addEventListener('click', () => {
      _ws3ChDone = false;
      _msStep = 0;
      _msVerifyStart = null;
      _msVerifyDone = false;
      if (_ws3FaultCleanup) { _ws3FaultCleanup(); _ws3FaultCleanup = null; }
      _lastLightHex = null; lightSet(CL50.STANDBY); // force re-apply standby blue
      ['ws3-ms-observe', 'ws3-ms-diag', 'ws3-ms-read', 'ws3-ms-write', 'ws3-ms-verify', 'ws3-ms-signoff', 'ws3-ch-result', 'ws3-ms-read-result'].forEach(id => {
        container.querySelector(`#${id}`)?.classList.add('hidden');
      });
      const injectBtn2 = container.querySelector('#ws3-ms-inject-btn');
      if (injectBtn2) { injectBtn2.disabled = false; injectBtn2.textContent = 'Start Scenario'; injectBtn2.style.color = ''; injectBtn2.style.borderColor = ''; }
      const injectStatus = container.querySelector('#ws3-ms-inject-status');
      if (injectStatus) { injectStatus.textContent = ''; injectStatus.className = 'text-xs font-mono text-neutral-content/40'; }
      const observeNext2 = container.querySelector('#ws3-ms-observe-next');
      if (observeNext2) { observeNext2.disabled = false; }
      container.querySelectorAll('#ws3-ms-diag [data-ans]').forEach(b => { b.disabled = false; b.style.opacity = '1'; b.style.color = ''; b.style.borderColor = ''; });
      container.querySelector('#ws3-ms-diag-fb')?.classList.add('hidden');
      const readBtn2 = container.querySelector('#ws3-ms-read-btn');
      if (readBtn2) { readBtn2.disabled = false; readBtn2.textContent = 'Read Parameter →'; }
      const readStatus = container.querySelector('#ws3-ms-read-status');
      if (readStatus) { readStatus.textContent = ''; readStatus.className = 'text-xs font-mono text-neutral-content/40'; }
      const readNext2 = container.querySelector('#ws3-ms-read-next');
      if (readNext2) { readNext2.classList.add('hidden'); readNext2.disabled = false; }
      const writeBtn2 = container.querySelector('#ws3-ms-write-btn');
      if (writeBtn2) { writeBtn2.disabled = false; writeBtn2.textContent = 'Write NO (0x00) to Sensor →'; writeBtn2.style.color = ''; writeBtn2.style.borderColor = ''; }
      const writeStatus = container.querySelector('#ws3-ms-write-status');
      if (writeStatus) { writeStatus.textContent = ''; writeStatus.className = 'text-xs font-mono text-neutral-content/40'; }
      const vfyBar = container.querySelector('#ws3-ms-vfy-bar');
      if (vfyBar) { vfyBar.style.width = '0%'; vfyBar.style.background = 'rgba(255,255,255,0.12)'; }
      const vfyTbar = container.querySelector('#ws3-ms-vfy-tbar');
      if (vfyTbar) vfyTbar.style.width = '0%';
      const vfyPct = container.querySelector('#ws3-ms-vfy-pct');
      if (vfyPct) { vfyPct.textContent = 'Waiting for detection…'; vfyPct.style.color = ''; }
      const vfyTimer = container.querySelector('#ws3-ms-vfy-timer');
      if (vfyTimer) vfyTimer.textContent = '0.0 s / 3.0 s';
      ['ws3-ms-ck1', 'ws3-ms-ck2', 'ws3-ms-ck3'].forEach(id => { const cb = container.querySelector(`#${id}`); if (cb) cb.checked = false; });
      const closeBtn2 = container.querySelector('#ws3-ms-close-btn');
      if (closeBtn2) { closeBtn2.disabled = true; closeBtn2.textContent = 'CLOSE TICKET — MJT-2247'; }
      const dot = container.querySelector('#ws3-hdr-dot');
      if (dot) { dot.classList.remove('bg-success'); dot.classList.add('animate-pulse', 'bg-error'); }
      const faultLbl = container.querySelector('#ws3-hdr-status');
      if (faultLbl) { faultLbl.textContent = 'Active Fault'; faultLbl.classList.remove('text-success'); faultLbl.classList.add('text-error'); }
    });
  }
}

function initLiveWs3(container) {
  _lastCapState = false;
  _capTaskCount = 0;
  _ws4ChDone = false;
  _ws4Step = 0; _ws4VerifyStart = null; _ws4VerifyDone = false; _ws4CurrentSp1 = null;

  let chart = null;

  // ── CL50 light stack control (violet = capacitive sensor theme) ──────────────
  // Colors: 0=Green 1=Red 3=Amber 4=Yellow 9=Blue 10=Violet(A)
  const CL50 = {
    STANDBY:    '000109', // Steady Blue       — worksheet loaded
    CAP_IDLE:   '00010A', // Steady Violet     — commissioning ready / bring target
    CAP_DET:    '00420A', // Flash Violet      — target detected! (teach / fn-test pt1)
    TEACHING:   '004104', // Flash Yellow fast — teach command active, hold target
    WRONG_DET:  '004201', // Flash Red         — should be CLEAR, remove target!
    HOLD_CLEAR: '004200', // Flash Green       — holding clear (fn-test pt2)
    PASSED:     '000100', // Steady Green      — tests passed
    SUCCESS:    '004340', // Two-Color Green+Yellow — scenario complete!
    DEFAULT:    '000100',
  };
  let _lastLightHex = null;
  let _ws4TeachActive = false;
  function lightSet(hex) {
    if (hex === _lastLightHex) return;
    const prev = _lastLightHex;
    _lastLightHex = hex;
    const base = window.IO_LINK_API_BASE || '';
    fetch(`${base}/api/io-link/port/4/pdout`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: hex }),
    }).catch(() => { _lastLightHex = prev; });
  }
  function teachLightStart() {
    const base = window.IO_LINK_API_BASE || '';
    // Yellow intensity sweep (breathing) — signals "learning in progress"
    fetch(`${base}/api/io-link/port/4/pdout/sweep`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color1: 4, speed: 'medium' }), // color1=4=Yellow
    }).catch(() => {});
  }
  function teachLightStop() {
    const base = window.IO_LINK_API_BASE || '';
    fetch(`${base}/api/io-link/port/4/pdout/sweep/stop`, { method: 'POST' }).catch(() => {});
    _lastLightHex = null; // force re-apply on next WS tick
  }

  lightSet(CL50.CAP_IDLE);
  _ws4LightCleanup = () => {
    const base = window.IO_LINK_API_BASE || '';
    // Stop any active sweep before restoring default
    fetch(`${base}/api/io-link/port/4/pdout/sweep/stop`, { method: 'POST' }).catch(() => {});
    fetch(`${base}/api/io-link/port/4/pdout`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: CL50.DEFAULT }),
    }).catch(() => {});
  };

  startLiveData(data => {
    if (!chart) chart = makeChart('ws3-chart', 'line',
      [{ data: Array(60).fill(0), borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.15)',
         fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 }], -0.1, 1.2, '');
    const port = getPort(data, 2);
    setLiveStatus('ws3-live-badge', !!port);
    if (!port || !port.pdin_decoded) return;

    const det   = port.pdin_decoded.object_detected || false;
    const count = port.detection_counter ?? 0;

    // main detection dot
    const dot = container.querySelector('#ws3-dot');
    if (dot) {
      dot.className = det
        ? 'w-10 h-10 rounded-full border-2 shadow-md transition-all duration-150 bg-secondary border-secondary shadow-secondary/40'
        : 'w-10 h-10 rounded-full border-2 shadow-md transition-all duration-150 bg-base-300 border-base-300';
    }
    const lbl = container.querySelector('#ws3-state-label');
    if (lbl) lbl.textContent = det ? 'Detected' : 'Clear';

    const cntEl = container.querySelector('#ws3-count-display');
    if (cntEl) cntEl.textContent = count;

    // task: rising edges
    if (det && !_lastCapState) {
      _capTaskCount = Math.min(_capTaskCount + 1, 5);
      const prog = container.querySelector('#ws3-task-progress');
      const tc   = container.querySelector('#ws3-task-count');
      if (prog) prog.value = _capTaskCount;
      if (tc)   tc.textContent = `${_capTaskCount} / 5`;
      if (_capTaskCount >= 5) container.querySelector('#ws3-task-done')?.classList.remove('hidden');
    }
    _lastCapState = det;

    pushToChart(chart, det ? 1 : 0);

    // ── CL50 light reaction ──────────────────────────────────────────────────
    // While teach sweep is running on the backend, skip lightSet (it would cancel the sweep)
    if (_ws4TeachActive) {
      // sweep running — do nothing
    } else if (_ws4Step === 0) {
      lightSet(det ? CL50.CAP_DET : CL50.CAP_IDLE);
    } else if (_ws4Step === 1) {
      lightSet(det ? CL50.CAP_DET : CL50.CAP_IDLE);
    } else if (_ws4Step === 2) {
      // fn-test part 1: hold detection for 3s
      lightSet(det ? CL50.CAP_DET : CL50.CAP_IDLE);
    } else if (_ws4Step === 3) {
      // fn-test part 2: hold clear for 3s
      lightSet(det ? CL50.WRONG_DET : CL50.HOLD_CLEAR);
    } else if (_ws4Step === 4) {
      lightSet(CL50.PASSED);
    } else {
      lightSet(CL50.SUCCESS);
    }

    // ── WS4 scenario: live value updates ──────────────────────────────────────
    // HMI panel (always visible)
    const hmiDet = container.querySelector('#ws4-hmi-det');
    if (hmiDet) {
      hmiDet.textContent = det ? 'DETECTED' : 'CLEAR';
      hmiDet.className = det ? 'font-bold font-mono text-xs text-error' : 'font-bold font-mono text-xs text-success';
    }
    // Dielectric bar (step 2 — always update so it's live when step unlocks)
    const analogue = port.pdin_decoded.analogue_value;
    if (analogue !== null && analogue !== undefined) {
      const dielFill = container.querySelector('#ws4-diel-fill');
      const dielVal  = container.querySelector('#ws4-diel-val');
      if (dielFill) dielFill.style.width = `${Math.min(analogue / 10000 * 100, 100).toFixed(1)}%`;
      if (dielVal)  dielVal.textContent = analogue;
    }
    if (_ws4CurrentSp1 !== null) {
      const dielSp1Line = container.querySelector('#ws4-diel-sp1-line');
      const dielSp1Val  = container.querySelector('#ws4-diel-sp1-val');
      if (dielSp1Line) { dielSp1Line.style.left = `${Math.min(_ws4CurrentSp1 / 10000 * 100, 100).toFixed(1)}%`; dielSp1Line.classList.remove('hidden'); }
      if (dielSp1Val)  dielSp1Val.textContent = _ws4CurrentSp1;
    }
    // Verify panel (step 3)
    const vfyDot = container.querySelector('#ws4-vfy-dot');
    const vfyDet = container.querySelector('#ws4-vfy-det');
    if (vfyDot) vfyDot.className = det ? 'w-3 h-3 rounded-full bg-error flex-shrink-0 transition-all' : 'w-3 h-3 rounded-full bg-success flex-shrink-0 transition-all';
    if (vfyDet) { vfyDet.textContent = det ? 'DETECTED' : 'CLEAR'; vfyDet.className = det ? 'font-bold font-mono text-xs text-error' : 'font-bold font-mono text-xs text-success'; }

    // Function test — Part 1: detect hold (3s with target present)
    if (_ws4Step === 2 && !_ws4VerifyDone) {
      const bar    = container.querySelector('#ws4-ms-vfy-bar');
      const pctEl  = container.querySelector('#ws4-ms-vfy-pct');
      const timer  = container.querySelector('#ws4-ms-vfy-timer');
      const barLbl = container.querySelector('#ws4-ms-vfy-bar-label');
      if (det) {
        if (!_ws4VerifyStart) _ws4VerifyStart = Date.now();
        const elapsed = (Date.now() - _ws4VerifyStart) / 1000;
        const pct = Math.min(elapsed / 3 * 100, 100);
        if (bar)    bar.value = pct;
        if (pctEl)  pctEl.textContent = `${Math.round(pct)}%`;
        if (timer)  timer.textContent = elapsed.toFixed(1);
        if (barLbl) barLbl.textContent = 'Part 1 of 2: holding DETECTED…';
        if (elapsed >= 3) {
          _ws4VerifyStart = null;
          _ws4Step = 3;
          if (bar)    bar.value = 0;
          if (pctEl)  pctEl.textContent = '0%';
          if (timer)  timer.textContent = '0.0';
          if (barLbl) barLbl.textContent = 'Part 2 of 2: remove target — hold CLEAR…';
        }
      } else {
        _ws4VerifyStart = null;
        if (bar)    bar.value = 0;
        if (pctEl)  pctEl.textContent = '0%';
        if (timer)  timer.textContent = '0.0';
        if (barLbl) barLbl.textContent = 'Part 1 of 2: bring target to detection point…';
      }
    }

    // Function test — Part 2: clear hold (3s with nothing present)
    if (_ws4Step === 3 && !_ws4VerifyDone) {
      const bar    = container.querySelector('#ws4-ms-vfy-bar');
      const pctEl  = container.querySelector('#ws4-ms-vfy-pct');
      const timer  = container.querySelector('#ws4-ms-vfy-timer');
      const barLbl = container.querySelector('#ws4-ms-vfy-bar-label');
      if (!det) {
        if (!_ws4VerifyStart) _ws4VerifyStart = Date.now();
        const elapsed = (Date.now() - _ws4VerifyStart) / 1000;
        const pct = Math.min(elapsed / 3 * 100, 100);
        if (bar)    bar.value = pct;
        if (pctEl)  pctEl.textContent = `${Math.round(pct)}%`;
        if (timer)  timer.textContent = elapsed.toFixed(1);
        if (barLbl) barLbl.textContent = 'Part 2 of 2: holding CLEAR…';
        if (elapsed >= 3) {
          _ws4VerifyDone = true;
          _ws4Step = 4;
          _ws4ChDone = true;
          _ws4ShowStep(4);
          if (bar)    bar.value = 100;
          if (pctEl)  pctEl.textContent = '100%';
          if (timer)  timer.textContent = '3.0';
          if (barLbl) barLbl.textContent = 'Function test passed ✓';
          const hdrDot    = container.querySelector('#ws4-hdr-dot');
          const hdrStatus = container.querySelector('#ws4-hdr-status');
          if (hdrDot)    hdrDot.className = 'w-3 h-3 rounded-full bg-warning flex-shrink-0 transition-all';
          if (hdrStatus) { hdrStatus.textContent = 'Sign-Off Required'; hdrStatus.className = 'text-xs font-mono ml-auto text-warning'; }
        }
      } else {
        _ws4VerifyStart = null;
        if (bar)    bar.value = 0;
        if (pctEl)  pctEl.textContent = '0%';
        if (timer)  timer.textContent = '0.0';
        if (barLbl) barLbl.textContent = 'Part 2 of 2: remove target — hold CLEAR…';
      }
    }
  });

  // ── Step visibility helper ────────────────────────────────────────────────
  function _ws4ShowStep(activeStep) {
    for (let i = 1; i <= 4; i++) {
      const el = container.querySelector(`#ws4-ms-step${i}`);
      if (!el) continue;
      const numEl   = el.querySelector('.ws4-snum');
      const badgeEl = el.querySelector('.ws4-sbadge');
      if (i < activeStep) {
        el.classList.remove('opacity-50', 'pointer-events-none', 'border-warning/50', 'bg-warning/5', 'border-base-300', 'bg-base-200/50');
        el.classList.add('border-success/40', 'bg-success/5');
        if (numEl)   { numEl.textContent = '✓'; numEl.className = 'ws4-snum w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-success text-success-content'; }
        if (badgeEl) badgeEl.classList.remove('hidden');
      } else if (i === activeStep) {
        el.classList.remove('opacity-50', 'pointer-events-none', 'border-base-300', 'bg-base-200/50', 'border-success/40', 'bg-success/5');
        el.classList.add('border-warning/50', 'bg-warning/5');
        if (numEl)   { numEl.textContent = String(i); numEl.className = 'ws4-snum w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-warning text-warning-content'; }
        if (badgeEl) badgeEl.classList.add('hidden');
      } else {
        el.classList.add('opacity-50', 'pointer-events-none');
        el.classList.remove('border-warning/50', 'bg-warning/5', 'border-success/40', 'bg-success/5');
        el.classList.add('border-base-300', 'bg-base-200/50');
        if (numEl)   { numEl.textContent = String(i); numEl.className = 'ws4-snum w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-base-300 text-base-content/40'; }
        if (badgeEl) badgeEl.classList.add('hidden');
      }
    }
  }

  // ── Step 1: Read factory state ────────────────────────────────────────────
  container.querySelector('#ws4-ms-read-btn')?.addEventListener('click', async () => {
    const readBtn = container.querySelector('#ws4-ms-read-btn');
    if (readBtn) { readBtn.disabled = true; readBtn.textContent = 'Reading…'; }
    const [sp1, qot] = await Promise.all([
      isduRead(2, 60, 1, 'int16', 1),
      isduRead(2, 75, 0, 'uint8', 1),
    ]);
    if (readBtn) { readBtn.disabled = false; readBtn.textContent = '📖 Read SP1 & QoT from device'; }
    if (sp1 !== null && qot !== null) {
      _ws4CurrentSp1 = sp1;
      const sp1El  = container.querySelector('#ws4-ms-read-sp1');
      const qotEl  = container.querySelector('#ws4-ms-read-qot');
      const interp = container.querySelector('#ws4-ms-read-interp');
      if (sp1El) sp1El.textContent = sp1;
      if (qotEl) qotEl.textContent = qot;
      const qotDesc = qot === 0 ? 'QoT = 0 — no teach performed (factory default)' :
                      qot <= 80  ? `QoT = ${qot} — poor quality of teach` :
                      qot <= 200 ? `QoT = ${qot} — good quality of teach` :
                                   `QoT = ${qot} — excellent quality of teach`;
      if (interp) interp.textContent = `SP1 = ${sp1} (factory default). ${qotDesc}. Sensor not yet commissioned for this installation.`;
      container.querySelector('#ws4-ms-read-result')?.classList.remove('hidden');
      container.querySelector('#ws4-ms-read-next')?.classList.remove('hidden');
    } else {
      const readResult = container.querySelector('#ws4-ms-read-result');
      if (readResult) { readResult.innerHTML = '<p class="text-error text-xs">Read failed — check IO-Link connection</p>'; readResult.classList.remove('hidden'); }
    }
  });

  container.querySelector('#ws4-ms-read-next')?.addEventListener('click', () => {
    _ws4Step = 1;
    _ws4ShowStep(2);
    const hdrDot    = container.querySelector('#ws4-hdr-dot');
    const hdrStatus = container.querySelector('#ws4-hdr-status');
    if (hdrDot)    hdrDot.className = 'w-3 h-3 rounded-full bg-warning flex-shrink-0 transition-all animate-pulse';
    if (hdrStatus) { hdrStatus.textContent = 'Commissioning'; hdrStatus.className = 'text-xs font-mono ml-auto text-warning'; }
  });

  // ── Step 2: Teach ─────────────────────────────────────────────────────────
  container.querySelector('#ws4-teach-start')?.addEventListener('click', async () => {
    const status = container.querySelector('#ws4-teach-status');
    if (status) { status.textContent = 'Teach started — hold target at detection point…'; status.className = 'text-xs font-mono text-warning'; }
    _ws4TeachActive = true;
    teachLightStart();
    await isduCommand(2, 'teach_sp1_start', null);
  });

  container.querySelector('#ws4-teach-stop')?.addEventListener('click', async () => {
    const status = container.querySelector('#ws4-teach-status');
    if (status) { status.textContent = 'Stopping teach and reading result…'; status.className = 'text-xs font-mono text-base-content/60'; }
    _ws4TeachActive = false;
    teachLightStop();
    const ok = await isduCommand(2, 'teach_sp1_stop', null);
    if (ok) {
      await new Promise(r => setTimeout(r, 800));
      const [sp1, qot] = await Promise.all([
        isduRead(2, 60, 1, 'int16', 1),
        isduRead(2, 75, 0, 'uint8', 1),
      ]);
      if (sp1 !== null) _ws4CurrentSp1 = sp1;
      const sp1El  = container.querySelector('#ws4-teach-sp1-val');
      const qotEl  = container.querySelector('#ws4-teach-qot-val');
      const interp = container.querySelector('#ws4-teach-interp');
      if (sp1El) { sp1El.textContent = sp1 !== null ? sp1 : '—'; sp1El.className = sp1 !== null ? 'font-bold text-success' : 'font-bold text-error'; }
      if (qotEl) {
        qotEl.textContent = qot !== null ? qot : '—';
        qotEl.className = qot !== null && qot > 150 ? 'font-bold text-success' : qot !== null && qot > 80 ? 'font-bold text-warning' : 'font-bold text-error';
      }
      const qotMsg = qot === null ? 'Read failed.' :
                     qot > 150   ? `QoT = ${qot} — good quality of teach. SP1 set to ${sp1}. Ready for function test.` :
                     qot > 80    ? `QoT = ${qot} — marginal. Consider re-teaching with target closer to the detection point.` :
                                   `QoT = ${qot} — poor quality. Re-run teach with target at the correct detection point.`;
      if (interp) { interp.textContent = qotMsg; interp.className = qot !== null && qot > 150 ? 'text-success font-sans mt-1' : 'text-warning font-sans mt-1'; }
      container.querySelector('#ws4-teach-result')?.classList.remove('hidden');
      if (status) { status.textContent = 'Teach complete.'; status.className = 'text-xs font-mono text-success'; }
      if (qot !== null && qot > 80) {
        container.querySelector('#ws4-ms-teach-next')?.classList.remove('hidden');
      }
    } else {
      if (status) { status.textContent = 'Teach stop failed — try again'; status.className = 'text-xs font-mono text-error'; }
    }
  });

  container.querySelector('#ws4-teach-cancel')?.addEventListener('click', async () => {
    const status = container.querySelector('#ws4-teach-status');
    if (status) { status.textContent = 'Teach cancelled.'; status.className = 'text-xs font-mono text-base-content/50'; }
    _ws4TeachActive = false;
    teachLightStop();
    await isduCommand(2, 'teach_cancel', null);
  });

  container.querySelector('#ws4-ms-teach-next')?.addEventListener('click', () => {
    _ws4Step = 2;
    _ws4ShowStep(3);
    const hdrDot    = container.querySelector('#ws4-hdr-dot');
    const hdrStatus = container.querySelector('#ws4-hdr-status');
    if (hdrDot)    hdrDot.className = 'w-3 h-3 rounded-full bg-warning flex-shrink-0 transition-all animate-pulse';
    if (hdrStatus) { hdrStatus.textContent = 'Function Test'; hdrStatus.className = 'text-xs font-mono ml-auto text-warning'; }
  });

  // ── Sign-off checkboxes ───────────────────────────────────────────────────
  ['ws4-ms-ck1', 'ws4-ms-ck2', 'ws4-ms-ck3'].forEach(id => {
    container.querySelector(`#${id}`)?.addEventListener('change', () => {
      const allChecked = ['ws4-ms-ck1', 'ws4-ms-ck2', 'ws4-ms-ck3']
        .every(cid => container.querySelector(`#${cid}`)?.checked);
      const closeBtn = container.querySelector('#ws4-ms-close-btn');
      if (closeBtn) closeBtn.disabled = !allChecked;
    });
  });

  container.querySelector('#ws4-ms-close-btn')?.addEventListener('click', () => {
    _ws4Step = 5;
    _ws4ShowStep(5);
    const r = container.querySelector('#ws4-ch-result');
    if (r) {
      r.className = 'rounded-lg p-3 text-center font-bold text-base bg-success/20 text-success border border-success/40';
      r.textContent = '✓ Scenario complete — factory state documented, teach performed with QoT confirmed, function test passed. Work order #WO-4412 closed.';
      r.classList.remove('hidden');
    }
    const hdrDot    = container.querySelector('#ws4-hdr-dot');
    const hdrStatus = container.querySelector('#ws4-hdr-status');
    if (hdrDot)    hdrDot.className = 'w-3 h-3 rounded-full bg-success flex-shrink-0 transition-all';
    if (hdrStatus) { hdrStatus.textContent = 'Scenario Complete'; hdrStatus.className = 'text-xs font-mono ml-auto text-success'; }
  });

  // ── Reset ─────────────────────────────────────────────────────────────────
  container.querySelector('#ws4-ch-reset')?.addEventListener('click', () => {
    _ws4ChDone = false;
    _ws4Step = 0; _ws4VerifyStart = null; _ws4VerifyDone = false; _ws4CurrentSp1 = null;
    _ws4TeachActive = false;
    _lastLightHex = null; lightSet(CL50.CAP_IDLE);
    _ws4ShowStep(1);
    container.querySelector('#ws4-ch-result')?.classList.add('hidden');
    container.querySelector('#ws4-ms-read-result')?.classList.add('hidden');
    container.querySelector('#ws4-ms-read-next')?.classList.add('hidden');
    container.querySelector('#ws4-teach-result')?.classList.add('hidden');
    container.querySelector('#ws4-ms-teach-next')?.classList.add('hidden');
    const teachStatus = container.querySelector('#ws4-teach-status');
    if (teachStatus) teachStatus.textContent = '';
    const dielSp1Line = container.querySelector('#ws4-diel-sp1-line');
    const dielSp1Val  = container.querySelector('#ws4-diel-sp1-val');
    if (dielSp1Line) dielSp1Line.classList.add('hidden');
    if (dielSp1Val)  dielSp1Val.textContent = '—';
    const bar    = container.querySelector('#ws4-ms-vfy-bar');
    const pctEl  = container.querySelector('#ws4-ms-vfy-pct');
    const timer  = container.querySelector('#ws4-ms-vfy-timer');
    const barLbl = container.querySelector('#ws4-ms-vfy-bar-label');
    if (bar)    bar.value = 0;
    if (pctEl)  pctEl.textContent = '0%';
    if (timer)  timer.textContent = '0.0';
    if (barLbl) barLbl.textContent = 'Part 1 of 2: bring target to detection point…';
    const hdrDot    = container.querySelector('#ws4-hdr-dot');
    const hdrStatus = container.querySelector('#ws4-hdr-status');
    if (hdrDot)    hdrDot.className = 'w-3 h-3 rounded-full bg-base-300 flex-shrink-0 transition-all';
    if (hdrStatus) { hdrStatus.textContent = ''; hdrStatus.className = 'text-xs font-mono ml-auto text-base-content/50'; }
    ['ws4-ms-ck1','ws4-ms-ck2','ws4-ms-ck3'].forEach(id => { const el = container.querySelector(`#${id}`); if (el) el.checked = false; });
    const closeBtn = container.querySelector('#ws4-ms-close-btn');
    if (closeBtn) closeBtn.disabled = true;
  });

  // ── ISDU panel: load SP1, QoT, QoR from device ───────────────────────────
  const badge      = container.querySelector('#ws3-isdu-badge');
  const sp1Slider  = container.querySelector('#ws3-sp1-slider');
  const sp1ValEl   = container.querySelector('#ws3-sp1-val');

  async function loadCapIsdu() {
    if (badge) { badge.textContent = 'READING'; badge.className = 'badge badge-xs badge-warning font-mono'; }
    const [sp1, qot, qor] = await Promise.all([
      isduRead(2, 60, 1, 'int16', 1),
      isduRead(2, 75, 0, 'uint8', 1),
      isduRead(2, 76, 0, 'uint8', 1),
    ]);
    if (sp1 !== null) {
      if (sp1Slider) sp1Slider.value = sp1;
      if (sp1ValEl)  sp1ValEl.textContent = sp1;
    }
    const qotBar = container.querySelector('#ws3-qot-bar');
    const qotVal = container.querySelector('#ws3-qot-val');
    const qorBar = container.querySelector('#ws3-qor-bar');
    const qorVal = container.querySelector('#ws3-qor-val');
    if (qot !== null) { if (qotBar) qotBar.value = qot; if (qotVal) qotVal.textContent = qot; }
    if (qor !== null) { if (qorBar) qorBar.value = qor; if (qorVal) qorVal.textContent = qor; }
    if (badge) { badge.textContent = 'LIVE'; badge.className = 'badge badge-xs badge-success font-mono'; }
  }
  loadCapIsdu();

  if (sp1Slider && sp1ValEl) {
    sp1Slider.addEventListener('input', () => { sp1ValEl.textContent = sp1Slider.value; });
  }
  container.querySelector('#ws3-sp1-write')?.addEventListener('click', async () => {
    const val = parseInt(sp1Slider?.value ?? 1000);
    await isduWrite(2, 60, 1, val, 'int16', 1, 'ws3-sp1-status');
  });
  container.querySelector('#ws3-qot-refresh')?.addEventListener('click', loadCapIsdu);
  container.querySelector('#ws3-teach-start')?.addEventListener('click',  () => isduCommand(2, 'teach_sp1_start',  'ws3-teach-status'));
  container.querySelector('#ws3-teach-stop')?.addEventListener('click',   () => isduCommand(2, 'teach_sp1_stop',   'ws3-teach-status'));
  container.querySelector('#ws3-teach-cancel')?.addEventListener('click', () => isduCommand(2, 'teach_cancel',     'ws3-teach-status'));
}

// SP/RP setpoints are now calculated dynamically from live temperature on first WS reading.

function initLiveWs4(container) {
  _tempBaseline = null;
  _alarmThreshold = 35; // temporary until first live temp reading

  // ── CL50 light stack control (mirrors OUT1/OUT2 + temperature proximity) ────
  // React to temperature gradient: green → amber as temp rises toward SP1
  // Calibration fault (steps 2-4): amber flash override to show "investigating"
  const CL50 = {
    NORMAL:     '000100', // Steady Green   — below both SPs
    WARMING:    '000103', // Steady Amber   — within 2°C of SP1 (or OUT2 active)
    ALARM:      '004201', // Flash Red fast — OUT1 SP1 alarm active!
    DIAGNOSING: '004203', // Flash Amber    — calibration investigation
    SUCCESS:    '004340', // Two-Color Green+Yellow — calibration scenario complete!
    DEFAULT:    '000100',
  };
  let _lastLightHex = null;
  function lightSet(hex) {
    if (hex === _lastLightHex) return;
    const prev = _lastLightHex;
    _lastLightHex = hex;
    const base = window.IO_LINK_API_BASE || '';
    fetch(`${base}/api/io-link/port/4/pdout`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: hex }),
    }).catch(() => { _lastLightHex = prev; });
  }
  lightSet(CL50.NORMAL);
  _ws5LightCleanup = () => {
    const base = window.IO_LINK_API_BASE || '';
    fetch(`${base}/api/io-link/port/4/pdout`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: CL50.DEFAULT }),
    }).catch(() => {});
  };
  _ws5ChDone = false;
  _ws5ChSeenOff = false;
  _ws5CalStep = 0; _ws5CalVerifyStart = null; _ws5CalVerifyDone = false;
  _ws5CalCleanup = null; _ws5PreInjectTemp = null;

  let _spWritten = false; // triggers on first temp reading
  let _spReady   = false; // true only after ISDU writes have completed

  let chart = null;

  // slider
  const slider = container.querySelector('#ws4-alarm-slider');
  const sliderVal = container.querySelector('#ws4-slider-val');
  if (slider) {
    slider.addEventListener('input', () => {
      _alarmThreshold = parseFloat(slider.value);
      if (sliderVal) sliderVal.textContent = `${_alarmThreshold}°C`;
    });
  }

  startLiveData(data => {
    if (!chart) chart = makeChart('ws4-chart', 'line',
      [{ data: Array(60).fill(null), borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.15)',
         fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 }], null, null, '°C');
    const port = getPort(data, 3);
    setLiveStatus('ws4-live-badge', !!port);
    if (!port || !port.pdin_decoded) return;

    const temp = port.pdin_decoded.temperature_c ?? null;
    const out1 = port.pdin_decoded.out1 ?? false;
    const out2 = port.pdin_decoded.out2 ?? false;
    if (temp === null) return;

    // set baseline on first reading
    if (_tempBaseline === null) _tempBaseline = temp;

    // write dynamic SP/RP on first reading: SP1 = ceil(temp)+3, SP2 = ceil(temp)+1
    if (!_spWritten) {
      _spWritten = true;
      const base = Math.ceil(temp);
      const sp1 = base + 3, rp1 = base, sp2 = base + 1, rp2 = temp;
      _alarmThreshold = sp1;
      // write RPs first so the sensor never sees SP < RP
      Promise.all([
        isduWrite(3, 584, 0, rp1, 'int16', 0.1, null),
        isduWrite(3, 594, 0, rp2, 'int16', 0.1, null),
      ]).then(() => Promise.all([
        isduWrite(3, 583, 0, sp1, 'int16', 0.1, null),
        isduWrite(3, 593, 0, sp2, 'int16', 0.1, null),
      ])).then(() => {
        _spReady = true;
        // update slider UI to reflect the written values
        _setSlider(sp1Slider, sp1ValEl, sp1);
        _setSlider(sp2Slider, sp2ValEl, sp2);
        _setSlider(rp1Slider, rp1ValEl, rp1);
        _setSlider(rp2Slider, rp2ValEl, rp2);
        _setSlider(chSp1Slider, chSp1ValEl, sp1);
        const sp1El = container.querySelector('#ws4-sp1-actual');
        const rp1El = container.querySelector('#ws4-rp1-actual');
        const sp2El = container.querySelector('#ws4-sp2-actual');
        const rp2El = container.querySelector('#ws4-rp2-actual');
        if (sp1El) sp1El.textContent = `${sp1} °C`;
        if (rp1El) rp1El.textContent = `${rp1} °C`;
        if (sp2El) sp2El.textContent = `${sp2} °C`;
        if (rp2El) rp2El.textContent = `${rp2} °C`;
      });
    }

    // big display
    const disp = container.querySelector('#ws4-temp-display');
    if (disp) disp.textContent = temp.toFixed(1);

    // output dots
    const d1 = container.querySelector('#ws4-out1-dot');
    const d2 = container.querySelector('#ws4-out2-dot');
    if (d1) d1.className = out1 ? 'w-3 h-3 rounded-full bg-success' : 'w-3 h-3 rounded-full bg-base-300';
    if (d2) d2.className = out2 ? 'w-3 h-3 rounded-full bg-error' : 'w-3 h-3 rounded-full bg-base-300';

    // alarm state vs slider threshold
    const alarmEl = container.querySelector('#ws4-alarm-state');
    if (alarmEl) {
      if (temp > _alarmThreshold) {
        alarmEl.textContent = `⚠ ABOVE THRESHOLD (${_alarmThreshold}°C)`;
        alarmEl.className = 'text-sm font-bold text-error';
      } else {
        alarmEl.textContent = `Below threshold (${_alarmThreshold}°C) — no alarm`;
        alarmEl.className = 'text-sm font-bold text-base-content/60';
      }
    }
    const alarmStatus = container.querySelector('#ws4-alarm-status');
    if (alarmStatus) alarmStatus.textContent = out1 || out2 ? 'SP output active' : 'No alarm';

    // warm task: +2°C from baseline
    const rise = Math.max(0, temp - _tempBaseline);
    const pct  = Math.min(100, (rise / 2) * 100);
    const prog = container.querySelector('#ws4-warm-progress');
    const wlbl = container.querySelector('#ws4-warm-label');
    if (prog) prog.value = pct;
    if (wlbl) wlbl.textContent = `+${rise.toFixed(1)}°C`;
    if (rise >= 2) {
      container.querySelector('#ws4-warm-done')?.classList.remove('hidden');
    }

    pushToChart(chart, temp);

    // ── CL50 light reaction to temperature + calibration scenario ──────────────
    if (!_spReady) {
      lightSet(CL50.NORMAL); // hold green until setpoints are committed to sensor
    } else if (_ws5CalStep >= 6) {
      lightSet(CL50.SUCCESS);
    } else if (_ws5CalStep >= 2 && _ws5CalStep <= 4) {
      lightSet(CL50.DIAGNOSING);
    } else if (out1) {
      lightSet(CL50.ALARM);
    } else if (out2 || temp >= _alarmThreshold - 2) {
      lightSet(CL50.WARMING);
    } else {
      lightSet(CL50.NORMAL);
    }

    // ── WS5 challenge: trigger SP1 alarm ─────────────────────────────────────
    const chTempEl = container.querySelector('#ws5-ch-temp');
    const chOutDot = container.querySelector('#ws5-ch-out-dot');
    const chOutLbl = container.querySelector('#ws5-ch-out-label');
    const ws5Result = container.querySelector('#ws5-ch-result');
    if (chTempEl) chTempEl.textContent = temp.toFixed(1);
    if (chOutDot) {
      chOutDot.className = out1
        ? 'w-8 h-8 rounded-full mx-auto transition-all duration-150 shadow-md bg-error border-error border-2'
        : 'w-8 h-8 rounded-full bg-base-300 mx-auto transition-all duration-150 shadow-md';
    }
    if (chOutLbl) chOutLbl.textContent = out1 ? 'ACTIVE ●' : 'inactive';
    if (!out1) _ws5ChSeenOff = true;
    if (!_ws5ChDone && _ws5ChSeenOff && out1) {
      _ws5ChDone = true;
      if (ws5Result) {
        ws5Result.className = 'rounded-lg p-3 text-center font-bold text-base bg-success/20 text-success border border-success/40';
        ws5Result.textContent = '✓ Challenge complete! SP1 alarm activated — temperature exceeded the setpoint.';
        ws5Result.classList.remove('hidden');
      }
    }

    // ── WS5 calibration scenario: live panel + verify countdown ──────────────
    const calLiveTempEl = container.querySelector('#ws5-cal-live-temp');
    if (calLiveTempEl) calLiveTempEl.textContent = `${temp.toFixed(1)} °C`;

    if (_ws5CalStep === 4) {
      const vfyTempEl   = container.querySelector('#ws5-cal-vfy-temp');
      const vfyExpected = container.querySelector('#ws5-cal-vfy-expected');
      if (vfyTempEl)   vfyTempEl.textContent = `${temp.toFixed(1)}`;
      if (vfyExpected && _ws5PreInjectTemp !== null) {
        vfyExpected.textContent = `${_ws5PreInjectTemp.toFixed(1)} °C ±1.5 °C`;
      }
    }
  });

  // WS5 challenge — Start button reveals the challenge body and arms the check
  const ws5ChStart = container.querySelector('#ws5-ch-start');
  const ws5ChBody  = container.querySelector('#ws5-ch-body');
  if (ws5ChStart && ws5ChBody) {
    ws5ChStart.addEventListener('click', () => {
      _ws5ChDone = false;
      _ws5ChSeenOff = false;
      ws5ChBody.classList.remove('hidden');
      ws5ChStart.classList.add('hidden');
    });
  }

  // WS5 challenge reset
  const ws5Reset = container.querySelector('#ws5-ch-reset');
  if (ws5Reset) {
    ws5Reset.addEventListener('click', () => {
      _ws5ChDone = false;
      _ws5ChSeenOff = false;
      const r = container.querySelector('#ws5-ch-result');
      if (r) r.classList.add('hidden');
      const dot = container.querySelector('#ws5-ch-out-dot');
      if (dot) dot.className = 'w-8 h-8 rounded-full bg-base-300 mx-auto transition-all duration-150 shadow-md';
      const lbl = container.querySelector('#ws5-ch-out-label');
      if (lbl) lbl.textContent = 'inactive';
    });
  }

  // ── ISDU: read SP1/RP1/SP2/RP2, wire sliders and write buttons ───────────
  const sp1Slider   = container.querySelector('#ws4-alarm-slider');
  const sp2Slider   = container.querySelector('#ws4-sp2-slider');
  const rp1Slider   = container.querySelector('#ws4-rp1-slider');
  const rp2Slider   = container.querySelector('#ws4-rp2-slider');
  const sp1ValEl    = container.querySelector('#ws4-slider-val');
  const sp2ValEl    = container.querySelector('#ws4-sp2-slider-val');
  const rp1ValEl    = container.querySelector('#ws4-rp1-slider-val');
  const rp2ValEl    = container.querySelector('#ws4-rp2-slider-val');

  function _setSlider(slider, valEl, v) {
    if (slider) slider.value = Math.min(parseFloat(slider.max), Math.max(parseFloat(slider.min), v));
    if (valEl)  valEl.textContent = `${v}°C`;
  }

  isduRead(3, 583, 0, 'int16', 0.1).then(v => {
    if (v === null) return;
    _setSlider(sp1Slider, sp1ValEl, v);
    _alarmThreshold = v;
    const el = container.querySelector('#ws4-sp1-actual');
    if (el) el.textContent = `${v} °C`;
  });
  isduRead(3, 584, 0, 'int16', 0.1).then(v => {
    if (v === null) return;
    _setSlider(rp1Slider, rp1ValEl, v);
    const el = container.querySelector('#ws4-rp1-actual');
    if (el) el.textContent = `${v} °C`;
  });
  isduRead(3, 593, 0, 'int16', 0.1).then(v => {
    if (v === null) return;
    _setSlider(sp2Slider, sp2ValEl, v);
    const el = container.querySelector('#ws4-sp2-actual');
    if (el) el.textContent = `${v} °C`;
  });
  isduRead(3, 594, 0, 'int16', 0.1).then(v => {
    if (v === null) return;
    _setSlider(rp2Slider, rp2ValEl, v);
    const el = container.querySelector('#ws4-rp2-actual');
    if (el) el.textContent = `${v} °C`;
  });

  // Challenge box mirrored SP1 slider — stays in sync with the main SP1 slider
  const chSp1Slider = container.querySelector('#ws5-ch-sp1-slider');
  const chSp1ValEl  = container.querySelector('#ws5-ch-sp1-val');

  // Sync both sliders from the ISDU read
  isduRead(3, 583, 0, 'int16', 0.1).then(v => {
    if (v === null) return;
    _setSlider(chSp1Slider, chSp1ValEl, v);
  });

  if (sp1Slider && sp1ValEl) sp1Slider.addEventListener('input', () => {
    sp1ValEl.textContent = `${sp1Slider.value}°C`;
    if (chSp1Slider) { chSp1Slider.value = sp1Slider.value; }
    if (chSp1ValEl)  { chSp1ValEl.textContent = `${sp1Slider.value}°C`; }
  });
  if (chSp1Slider) chSp1Slider.addEventListener('input', () => {
    if (chSp1ValEl) chSp1ValEl.textContent = `${chSp1Slider.value}°C`;
    if (sp1Slider)  { sp1Slider.value = chSp1Slider.value; }
    if (sp1ValEl)   { sp1ValEl.textContent = `${chSp1Slider.value}°C`; }
  });

  if (sp2Slider && sp2ValEl) sp2Slider.addEventListener('input', () => { sp2ValEl.textContent = `${sp2Slider.value}°C`; });
  if (rp1Slider && rp1ValEl) rp1Slider.addEventListener('input', () => { rp1ValEl.textContent = `${rp1Slider.value}°C`; });
  if (rp2Slider && rp2ValEl) rp2Slider.addEventListener('input', () => { rp2ValEl.textContent = `${rp2Slider.value}°C`; });

  container.querySelector('#ws5-ch-sp1-write')?.addEventListener('click', async () => {
    const val = parseFloat(chSp1Slider?.value ?? _alarmThreshold);
    const ok = await isduWrite(3, 583, 0, val, 'int16', 0.1, 'ws5-ch-sp1-status');
    if (ok) {
      if (sp1Slider) { sp1Slider.value = val; }
      if (sp1ValEl)  { sp1ValEl.textContent = `${val}°C`; }
      const el = container.querySelector('#ws4-sp1-actual');
      if (el) el.textContent = `${val} °C`;
      _alarmThreshold = val;
    }
  });

  container.querySelector('#ws4-sp1-write')?.addEventListener('click', async () => {
    const val = parseFloat(sp1Slider?.value ?? _alarmThreshold);
    const ok = await isduWrite(3, 583, 0, val, 'int16', 0.1, 'ws4-sp1-status');
    if (ok) { const el = container.querySelector('#ws4-sp1-actual'); if (el) el.textContent = `${val} °C`; }
  });
  container.querySelector('#ws4-rp1-write')?.addEventListener('click', async () => {
    const val = parseFloat(rp1Slider?.value ?? 50);
    const ok = await isduWrite(3, 584, 0, val, 'int16', 0.1, 'ws4-rp1-status');
    if (ok) { const el = container.querySelector('#ws4-rp1-actual'); if (el) el.textContent = `${val} °C`; }
  });
  container.querySelector('#ws4-sp2-write')?.addEventListener('click', async () => {
    const val = parseFloat(sp2Slider?.value ?? 50);
    const ok = await isduWrite(3, 593, 0, val, 'int16', 0.1, 'ws4-sp2-status');
    if (ok) { const el = container.querySelector('#ws4-sp2-actual'); if (el) el.textContent = `${val} °C`; }
  });
  container.querySelector('#ws4-rp2-write')?.addEventListener('click', async () => {
    const val = parseFloat(rp2Slider?.value ?? 40);
    const ok = await isduWrite(3, 594, 0, val, 'int16', 0.1, 'ws4-rp2-status');
    if (ok) { const el = container.querySelector('#ws4-rp2-actual'); if (el) el.textContent = `${val} °C`; }
  });

  // ── Calibration scenario ─────────────────────────────────────────────────
  function _ws5CalReset() {
    _ws5CalStep = 0; _ws5CalVerifyStart = null; _ws5CalVerifyDone = false; _ws5PreInjectTemp = null;
    _lastLightHex = null; // allow light to re-sync to OUT1/OUT2 state on next WS push
    container.querySelector('#ws5-cal-setup')?.classList.remove('hidden');
    ['ws5-cal-observe','ws5-cal-diag','ws5-cal-write','ws5-cal-verify','ws5-cal-signoff','ws5-cal-result'].forEach(id => {
      container.querySelector(`#${id}`)?.classList.add('hidden');
    });
    container.querySelector('#ws5-cal-read-result')?.classList.add('hidden');
    container.querySelector('#ws5-cal-read-next')?.classList.add('hidden');
    container.querySelector('#ws5-cal-diag-fb')?.classList.add('hidden');
    const injectStatus = container.querySelector('#ws5-cal-inject-status');
    if (injectStatus) injectStatus.textContent = '';
    ['ws5-cal-ck1','ws5-cal-ck2','ws5-cal-ck3'].forEach(id => {
      const el = container.querySelector(`#${id}`); if (el) el.checked = false;
    });
    const closeBtn = container.querySelector('#ws5-cal-close-btn');
    if (closeBtn) closeBtn.disabled = true;
    const hdrDot    = container.querySelector('#ws5-cal-hdr-dot');
    const hdrStatus = container.querySelector('#ws5-cal-hdr-status');
    if (hdrDot)    hdrDot.className = 'w-2.5 h-2.5 rounded-full bg-base-300 flex-shrink-0';
    if (hdrStatus) { hdrStatus.textContent = 'Ready'; hdrStatus.className = 'font-mono text-xs font-bold text-neutral-content/50 tracking-widest uppercase'; }
    isduRead(3, 681, 0, 'int16', 0.1).then(v => {
      const el   = container.querySelector('#ws5-cal-live-offset');
      const card = container.querySelector('#ws5-cal-offset-card');
      if (el && v !== null) {
        el.textContent = `${v >= 0 ? '+' : ''}${v.toFixed(1)}`;
        const isZero = Math.abs(v) < 0.05;
        el.className   = `text-3xl font-black font-mono leading-none ${isZero ? 'text-success' : 'text-error'}`;
        if (card) card.className = `rounded-lg border p-3 text-center ${isZero ? 'border-success/30 bg-success/5' : 'border-error/30 bg-error/5'}`;
      }
    });
  }

  container.querySelector('#ws5-cal-inject-btn')?.addEventListener('click', async () => {
    const statusEl = container.querySelector('#ws5-cal-inject-status');
    if (statusEl) statusEl.textContent = 'Injecting…';
    const disp = container.querySelector('#ws4-temp-display');
    if (disp && disp.textContent !== '—') _ws5PreInjectTemp = parseFloat(disp.textContent) || null;
    const ok = await isduWrite(3, 681, 0, 3.0, 'int16', 0.1, null);
    if (ok) {
      _ws5CalCleanup = () => isduWrite(3, 681, 0, 0.0, 'int16', 0.1, null);
      _ws5CalStep = 1;
      if (statusEl) statusEl.textContent = 'Fault injected — offset now +3.0 °C';
      const calLiveOffset = container.querySelector('#ws5-cal-live-offset');
      const calOffsetCard = container.querySelector('#ws5-cal-offset-card');
      if (calLiveOffset) { calLiveOffset.textContent = '+3.0'; calLiveOffset.className = 'text-3xl font-black font-mono leading-none text-error'; }
      if (calOffsetCard) calOffsetCard.className = 'rounded-lg border border-error/30 bg-error/5 p-3 text-center';
      container.querySelector('#ws5-cal-setup')?.classList.add('hidden');
      container.querySelector('#ws5-cal-observe')?.classList.remove('hidden');
      const hdrDot    = container.querySelector('#ws5-cal-hdr-dot');
      const hdrStatus = container.querySelector('#ws5-cal-hdr-status');
      if (hdrDot)    hdrDot.className = 'w-2.5 h-2.5 rounded-full bg-warning flex-shrink-0 animate-pulse';
      if (hdrStatus) { hdrStatus.textContent = 'Scenario Active'; hdrStatus.className = 'font-mono text-xs font-bold text-warning tracking-widest uppercase'; }
    } else {
      if (statusEl) statusEl.textContent = 'Write failed — check connection';
    }
  });

  container.querySelector('#ws5-cal-read-btn')?.addEventListener('click', async () => {
    const statusEl = container.querySelector('#ws5-cal-read-status');
    if (statusEl) statusEl.textContent = 'Reading…';
    const val = await isduRead(3, 681, 0, 'int16', 0.1);
    if (val !== null) {
      const hexRaw = Math.round(val / 0.1) & 0xFFFF;
      const hexStr = hexRaw.toString(16).toUpperCase().padStart(4, '0');
      if (statusEl) statusEl.textContent = '';
      const hexEl    = container.querySelector('#ws5-cal-read-hex');
      const valEl    = container.querySelector('#ws5-cal-read-val');
      const interpEl = container.querySelector('#ws5-cal-read-interp');
      if (hexEl)    hexEl.textContent    = hexStr;
      if (valEl)    valEl.textContent    = val.toFixed(1);
      if (interpEl) interpEl.textContent = val > 0.5
        ? `Positive offset — sensor reading is ${val.toFixed(1)} °C ABOVE true temperature. Matches the +3.0 °C drift described in work order CAL-0189.`
        : `Offset at or near zero — sensor reporting accurately.`;
      container.querySelector('#ws5-cal-read-result')?.classList.remove('hidden');
      container.querySelector('#ws5-cal-read-next')?.classList.remove('hidden');
    } else {
      if (statusEl) statusEl.textContent = 'Read failed — check connection';
    }
  });

  container.querySelector('#ws5-cal-read-next')?.addEventListener('click', () => {
    _ws5CalStep = 2;
    container.querySelector('#ws5-cal-diag')?.classList.remove('hidden');
  });

  container.querySelectorAll('.ws5-cal-diag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ans  = btn.dataset.ans;
      const fbEl = container.querySelector('#ws5-cal-diag-fb');
      if (ans === 'correct') {
        if (fbEl) {
          fbEl.textContent = '✓ Correct. Writing 0.0 °C removes the offset entirely and restores the sensor to its factory-calibrated state.';
          fbEl.className = 'text-sm font-semibold text-success';
          fbEl.classList.remove('hidden');
        }
        _ws5CalStep = 3;
        setTimeout(() => container.querySelector('#ws5-cal-write')?.classList.remove('hidden'), 500);
      } else {
        const msg = ans === 'wrong-add'
          ? '✕ Incorrect. Adding +3.0 °C on top of the existing +3.0 °C offset would produce +6.0 °C total error — twice as wrong. The offset needs to return to zero.'
          : '✕ Incorrect. Writing −6.0 °C would over-correct and cause the sensor to read 6 degrees too low. The goal is 0.0 °C — no offset, no error.';
        if (fbEl) { fbEl.textContent = msg; fbEl.className = 'text-sm font-semibold text-error'; fbEl.classList.remove('hidden'); }
      }
    });
  });

  container.querySelector('#ws5-cal-write-btn')?.addEventListener('click', async () => {
    const statusEl = container.querySelector('#ws5-cal-write-status');
    if (statusEl) statusEl.textContent = 'Writing…';
    const ok = await isduWrite(3, 681, 0, 0.0, 'int16', 0.1, null);
    if (ok) {
      _ws5CalCleanup = null;
      _ws5CalStep = 4;
      if (statusEl) statusEl.textContent = 'Write successful — offset restored to 0.0 °C';
      const calLiveOffset = container.querySelector('#ws5-cal-live-offset');
      const calOffsetCard = container.querySelector('#ws5-cal-offset-card');
      if (calLiveOffset) { calLiveOffset.textContent = '+0.0'; calLiveOffset.className = 'text-3xl font-black font-mono leading-none text-success'; }
      if (calOffsetCard) calOffsetCard.className = 'rounded-lg border border-success/30 bg-success/5 p-3 text-center';
      container.querySelector('#ws5-cal-verify')?.classList.remove('hidden');
      const hdrDot    = container.querySelector('#ws5-cal-hdr-dot');
      const hdrStatus = container.querySelector('#ws5-cal-hdr-status');
      if (hdrDot)    hdrDot.className = 'w-2.5 h-2.5 rounded-full bg-info flex-shrink-0 animate-pulse';
      if (hdrStatus) { hdrStatus.textContent = 'Verifying…'; hdrStatus.className = 'font-mono text-xs font-bold text-info tracking-widest uppercase'; }
    } else {
      if (statusEl) statusEl.textContent = 'Write failed — check connection';
    }
  });

  container.querySelector('#ws5-cal-vfy-confirm')?.addEventListener('click', () => {
    _ws5CalVerifyDone = true;
    _ws5CalStep = 5;
    container.querySelector('#ws5-cal-signoff')?.classList.remove('hidden');
    const calHdrDot    = container.querySelector('#ws5-cal-hdr-dot');
    const calHdrStatus = container.querySelector('#ws5-cal-hdr-status');
    if (calHdrDot)    calHdrDot.className = 'w-2.5 h-2.5 rounded-full bg-success flex-shrink-0';
    if (calHdrStatus) { calHdrStatus.textContent = 'Verified — Sign Off'; calHdrStatus.className = 'font-mono text-xs font-bold text-success tracking-widest uppercase'; }
  });

  ['ws5-cal-ck1','ws5-cal-ck2','ws5-cal-ck3'].forEach(id => {
    container.querySelector(`#${id}`)?.addEventListener('change', () => {
      const allChecked = ['ws5-cal-ck1','ws5-cal-ck2','ws5-cal-ck3']
        .every(cid => container.querySelector(`#${cid}`)?.checked);
      const closeBtn = container.querySelector('#ws5-cal-close-btn');
      if (closeBtn) closeBtn.disabled = !allChecked;
    });
  });

  container.querySelector('#ws5-cal-close-btn')?.addEventListener('click', () => {
    _ws5CalStep = 6;
    const r = container.querySelector('#ws5-cal-result');
    if (r) {
      r.textContent = '✓ Work order CAL-0189 closed — Calibration Offset corrected from +3.0 °C to 0.0 °C via ISDU acyclic write. No physical sensor removal required.';
      r.classList.remove('hidden');
    }
    const hdrDot    = container.querySelector('#ws5-cal-hdr-dot');
    const hdrStatus = container.querySelector('#ws5-cal-hdr-status');
    if (hdrDot)    hdrDot.className = 'w-2.5 h-2.5 rounded-full bg-success flex-shrink-0';
    if (hdrStatus) { hdrStatus.textContent = 'Closed'; hdrStatus.className = 'font-mono text-xs font-bold text-success tracking-widest uppercase'; }
  });

  container.querySelector('#ws5-cal-reset')?.addEventListener('click', () => {
    if (_ws5CalCleanup) { _ws5CalCleanup(); _ws5CalCleanup = null; }
    _ws5CalReset();
  });

  _ws5CalReset();
}

function initLiveWs5(container) {
  _ws6MsStep = 0; _ws6MsVerifyStart = null; _ws6MsVerifyDone = false;
  if (_ws6AnimInterval) { clearInterval(_ws6AnimInterval); _ws6AnimInterval = null; }

  // ── Animation demo buttons ──────────────────────────────────────────────────
  function ws6WriteLight(hex) {
    const base = window.IO_LINK_API_BASE || '';
    fetch(`${base}/api/io-link/port/4/pdout`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: hex }),
    }).catch(() => {});
  }

  function setAnimStatus(msg) {
    const el = container.querySelector('#ws6-anim-status');
    if (el) el.textContent = msg;
  }

  function stopAnimLoop() {
    if (_ws6AnimInterval) { clearInterval(_ws6AnimInterval); _ws6AnimInterval = null; }
    const base = window.IO_LINK_API_BASE || '';
    fetch(`${base}/api/io-link/port/4/pdout/sweep/stop`, { method: 'POST' }).catch(() => {});
  }

  container.querySelectorAll('.ws6-anim-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      stopAnimLoop();
      const RAINBOW = [1, 2, 3, 4, 5, 0, 7, 9, 10, 11, 12];
      const GAR     = [['000100','Green'], ['180103','Amber'], ['180101','Red']];

      if (action === 'flash-red') {
        ws6WriteLight('184201');
        setAnimStatus('▶ Flashing Red  ·  hex: 18 42 01');
      } else if (action === 'flash-orange') {
        ws6WriteLight('184202');
        setAnimStatus('▶ Flashing Orange  ·  hex: 18 42 02');
      } else if (action === 'orange-red-alt') {
        ws6WriteLight('004312');
        setAnimStatus('▶ Orange / Red Two-Colour Flash  ·  hex: 00 43 12');
      } else if (action === 'green-pulse') {
        const base = window.IO_LINK_API_BASE || '';
        fetch(`${base}/api/io-link/port/4/pdout/sweep`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ color1: 0, color2: 0, speed: 'medium' }),
        }).catch(() => {});
        setAnimStatus('▶ Green Pulse  ·  software breathing sweep (firmware 1.0.2 workaround)');
      } else if (action === 'rainbow-pulse') {
        let idx = 0;
        setAnimStatus('▶ Rainbow Pulse  ·  cycling 11 colours via PDout writes');
        const step = () => {
          ws6WriteLight(`1801${RAINBOW[idx % RAINBOW.length].toString(16).padStart(2, '0')}`);
          idx++;
        };
        step();
        _ws6AnimInterval = setInterval(step, 700);
      } else if (action === 'gar-loop') {
        let idx = 0;
        const step = () => {
          ws6WriteLight(GAR[idx % 3][0]);
          setAnimStatus(`▶ Traffic Light  ·  now: ${GAR[idx % 3][1]}`);
          idx++;
        };
        step();
        _ws6AnimInterval = setInterval(step, 2000);
      }

      _ws6AnimCleanup = () => {
        if (_ws6AnimInterval) { clearInterval(_ws6AnimInterval); _ws6AnimInterval = null; }
        const base = window.IO_LINK_API_BASE || '';
        fetch(`${base}/api/io-link/port/4/pdout/sweep/stop`, { method: 'POST' }).catch(() => {});
        fetch(`${base}/api/io-link/port/4/pdout`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: '000100' }),
        }).catch(() => {});
      };
    });
  });

  const animResetBtn = container.querySelector('#ws6-anim-reset');
  if (animResetBtn) {
    animResetBtn.addEventListener('click', () => {
      stopAnimLoop();
      ws6WriteLight('000100');
      _ws6AnimCleanup = null;
      setAnimStatus('↺ Reset — Green Steady');
      setTimeout(() => {
        const el = container.querySelector('#ws6-anim-status');
        if (el && el.textContent.startsWith('↺')) el.textContent = '';
      }, 2500);
    });
  }

  // ── Build-your-own PDout hex dropdowns ──────────────────────────────────────
  function ws6BuildHex() {
    const v = id => parseInt(container.querySelector(`#${id}`)?.value || '0', 10);
    const color1    = v('ws6-led-color');
    const color2    = v('ws6-led-color2');
    const animation = v('ws6-led-animation');
    const pulse     = v('ws6-led-pulse');
    const speed     = v('ws6-led-speed');
    const intensity = v('ws6-led-intensity');
    const octet2 = ((color2 & 0xF) << 4) | (color1 & 0xF);
    const octet1 = ((speed & 0x3) << 6) | ((pulse & 0x7) << 3) | (animation & 0x7);
    const octet0 = ((intensity & 0x7) << 3) | (intensity & 0x7); // C2I = C1I = intensity, audible = 0
    return [octet0, octet1, octet2].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function ws6UpdateHexPreview() {
    const hex = ws6BuildHex();
    const el = container.querySelector('#ws6-led-hex-preview');
    if (el) el.textContent = hex;
    return hex;
  }

  ['ws6-led-color','ws6-led-color2','ws6-led-animation','ws6-led-pulse','ws6-led-intensity','ws6-led-speed']
    .forEach(id => container.querySelector(`#${id}`)?.addEventListener('change', ws6UpdateHexPreview));
  ws6UpdateHexPreview();

  const ws6LedWrite = container.querySelector('#ws6-led-write');
  if (ws6LedWrite) {
    ws6LedWrite.addEventListener('click', async () => {
      const v = id => parseInt(container.querySelector(`#${id}`)?.value || '0', 10);
      // Clear any running animation loop / sweep from the demo buttons
      stopAnimLoop();
      setAnimStatus('');
      _ws6AnimCleanup = null;
      const statusEl = container.querySelector('#ws6-led-status');
      if (statusEl) statusEl.textContent = 'Writing…';
      const base = window.IO_LINK_API_BASE || '';
      try {
        let res;
        if (v('ws6-led-animation') === 4) {
          const speedMap = ['medium','fast','slow'];
          res = await fetch(`${base}/api/io-link/port/4/pdout/sweep`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ color1: v('ws6-led-color'), color2: v('ws6-led-color2'), speed: speedMap[v('ws6-led-speed')] || 'medium' }),
          });
        } else {
          const hex = ws6UpdateHexPreview();
          res = await fetch(`${base}/api/io-link/port/4/pdout`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: hex }),
          });
        }
        const d = await res.json();
        if (statusEl) {
          statusEl.textContent = d.success ? `✓ Written` : '✗ Write failed';
          setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 2500);
        }
      } catch {
        if (statusEl) {
          statusEl.textContent = '✗ Network error — is the backend running?';
          setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
        }
      }
    });
  }

  startLiveData(data => {
    const port = getPort(data, 4);
    const d = port && port.pdout_decoded && port.pdout_decoded.raw_hex ? port.pdout_decoded : null;
    setLiveStatus('ws5-live-badge', !!d);
    setLiveStatus('ws6-ms-live-badge', !!d);
    if (!d) return;
    const c1 = d.color1 || 'off';
    const c2 = d.color2 || 'off';
    const anim = d.animation || 'off';
    const hex  = d.raw_hex || '—';

    const c1El  = container.querySelector('#ws5-c1-circle');
    const c2El  = container.querySelector('#ws5-c2-circle');
    const c1Lbl = container.querySelector('#ws5-c1-label');
    const c2Lbl = container.querySelector('#ws5-c2-label');

    function applyColour(el, colourName) {
      const colour = CL_COLOUR_MAP[colourName];
      if (el) {
        if (colour) {
          el.style.backgroundColor = colour;
          el.style.borderColor = colour;
          el.style.boxShadow = `0 0 12px ${colour}80`;
        } else {
          el.style.backgroundColor = '';
          el.style.borderColor = '';
          el.style.boxShadow = '';
          el.className = 'w-14 h-14 rounded-full bg-base-300 border-4 border-base-300 transition-all duration-300 shadow-md';
        }
      }
    }

    applyColour(c1El, c1);
    applyColour(c2El, c2);
    if (c1Lbl) c1Lbl.textContent = c1;
    if (c2Lbl) c2Lbl.textContent = c2;

    const setText = (id, val) => { const el = container.querySelector(`#${id}`); if (el) el.textContent = val || '—'; };
    setText('ws5-animation', anim);
    setText('ws5-speed', d.speed);
    setText('ws5-pattern', d.pulse_pattern);
    setText('ws5-c1-intensity', d.color1_intensity);
    setText('ws5-c2-intensity', d.color2_intensity);
    setText('ws5-raw-hex', hex);

    // Update embedded scenario panels
    const msC1El = container.querySelector('#ws6-ms-c1-circle');
    applyColour(msC1El, c1);
    setText('ws6-ms-c1-label', c1);
    setText('ws6-ms-animation', anim);
    setText('ws6-ms-raw-hex', hex);
    const obsC1El = container.querySelector('#ws6-obs-c1-circle');
    applyColour(obsC1El, c1);
    setText('ws6-obs-c1-label', c1);
    setText('ws6-obs-animation', anim);
    setText('ws6-obs-raw-hex', hex);

    // ── WS6 maintenance scenario verify step ─────────────────────────────────
    if (_ws6MsStep === 5 && !_ws6MsVerifyDone) {
      const isOK = (c1 === 'Green' || c1 === 'green') && (anim === 'Steady' || anim === 'steady');
      const pctEl   = container.querySelector('#ws6-ms-vfy-pct');
      const timerEl = container.querySelector('#ws6-ms-vfy-timer');
      const barEl   = container.querySelector('#ws6-ms-vfy-tbar');
      if (isOK) {
        if (!_ws6MsVerifyStart) _ws6MsVerifyStart = Date.now();
        const elapsed = (Date.now() - _ws6MsVerifyStart) / 1000;
        const frac = Math.min(elapsed / 5, 1);
        if (barEl) barEl.style.width = (frac * 100).toFixed(1) + '%';
        if (pctEl) pctEl.textContent = 'Green Steady confirmed';
        if (timerEl) timerEl.textContent = `${elapsed.toFixed(1)} / 5 s`;
        if (elapsed >= 5) {
          _ws6MsVerifyDone = true;
          _ws6MsStep = 6;
          if (barEl) barEl.style.width = '100%';
          if (pctEl) pctEl.textContent = '✓ Verified — light is stable';
          if (timerEl) timerEl.textContent = '5 / 5 s';
          const signoff = container.querySelector('#ws6-ms-signoff-box');
          if (signoff) signoff.classList.remove('hidden');
        }
      } else {
        _ws6MsVerifyStart = null;
        if (barEl) barEl.style.width = '0%';
        if (pctEl) pctEl.textContent = 'Waiting for Green Steady…';
        if (timerEl) timerEl.textContent = '0 / 5 s';
      }
    }
  });

  // ── WS6 maintenance scenario ──────────────────────────────────────────────
  function ws6MsShow(id) {
    const el = container.querySelector(`#${id}`);
    if (el) el.classList.remove('hidden');
  }

  function ws6MsResetAll() {
    if (_ws6MsCleanup) { _ws6MsCleanup(); _ws6MsCleanup = null; }
    else { ws6WriteLight('000100'); }
    _ws6MsStep = 0; _ws6MsVerifyStart = null; _ws6MsVerifyDone = false;
    ['ws6-ms-observe-box','ws6-ms-diag-box','ws6-ms-read-box','ws6-ms-fix-box','ws6-ms-vfy-box','ws6-ms-signoff-box']
      .forEach(id => { const el = container.querySelector(`#${id}`); if (el) el.classList.add('hidden'); });
    ['ws6-ms-i-observed','ws6-ms-diag-submit','ws6-ms-read-btn','ws6-ms-fix-btn'].forEach(id => {
      const el = container.querySelector(`#${id}`); if (el) el.disabled = false;
    });
    container.querySelectorAll('input[name="ws6-ms-diag"]').forEach(r => { r.checked = false; });
    ['ws6-ms-diag-result','ws6-ms-read-result'].forEach(id => {
      const el = container.querySelector(`#${id}`); if (el) el.classList.add('hidden');
    });
    ['ws6-ms-ck1','ws6-ms-ck2','ws6-ms-ck3'].forEach(id => {
      const el = container.querySelector(`#${id}`); if (el) el.checked = false;
    });
    const startBtn = container.querySelector('#ws6-ms-start');
    if (startBtn) startBtn.disabled = false;
    const statusEl = container.querySelector('#ws6-ms-inject-status');
    if (statusEl) statusEl.textContent = '';
    const fixStatus = container.querySelector('#ws6-ms-fix-status');
    if (fixStatus) fixStatus.textContent = '';
    const barEl = container.querySelector('#ws6-ms-vfy-tbar');
    if (barEl) barEl.style.width = '0%';
    const pctEl = container.querySelector('#ws6-ms-vfy-pct');
    if (pctEl) pctEl.textContent = 'Waiting for Green Steady…';
    const timerEl = container.querySelector('#ws6-ms-vfy-timer');
    if (timerEl) timerEl.textContent = '0 / 5 s';
    const closeBtn = container.querySelector('#ws6-ms-close');
    if (closeBtn) { closeBtn.disabled = true; closeBtn.className = 'btn btn-success btn-sm gap-2'; closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Close Work Order'; }
  }

  const ws6MsResetBtn = container.querySelector('#ws6-ms-reset');
  if (ws6MsResetBtn) ws6MsResetBtn.addEventListener('click', ws6MsResetAll);

  const ws6MsStartBtn = container.querySelector('#ws6-ms-start');
  if (ws6MsStartBtn) {
    ws6MsStartBtn.addEventListener('click', async () => {
      ws6MsStartBtn.disabled = true;
      const statusEl = container.querySelector('#ws6-ms-inject-status');
      if (statusEl) statusEl.textContent = 'Injecting fault…';
      const base = window.IO_LINK_API_BASE || '';
      try {
        const res = await fetch(`${base}/api/io-link/port/4/pdout`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: '184203' }),
        });
        const d = await res.json();
        if (d.success) {
          _ws6MsCleanup = () => ws6WriteLight('000100');
          _ws6MsStep = 1;
          if (statusEl) statusEl.textContent = '✓ Fault injected — Amber Flash written to Port 4';
          ws6MsShow('ws6-ms-observe-box');
        } else {
          ws6MsStartBtn.disabled = false;
          if (statusEl) { statusEl.textContent = '✗ Injection failed'; setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000); }
        }
      } catch {
        ws6MsStartBtn.disabled = false;
        if (statusEl) { statusEl.textContent = '✗ Network error'; setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000); }
      }
    });
  }

  const ws6MsObserveBtn = container.querySelector('#ws6-ms-i-observed');
  if (ws6MsObserveBtn) {
    ws6MsObserveBtn.addEventListener('click', () => {
      if (_ws6MsStep !== 1) return;
      _ws6MsStep = 2;
      ws6MsObserveBtn.disabled = true;
      ws6MsShow('ws6-ms-diag-box');
    });
  }

  const ws6MsDiagSubmit = container.querySelector('#ws6-ms-diag-submit');
  if (ws6MsDiagSubmit) {
    ws6MsDiagSubmit.addEventListener('click', () => {
      if (_ws6MsStep !== 2) return;
      const sel = container.querySelector('input[name="ws6-ms-diag"]:checked');
      const resultEl = container.querySelector('#ws6-ms-diag-result');
      if (!sel) {
        if (resultEl) { resultEl.className = 'rounded-lg p-3 text-sm bg-warning/10 border border-warning/30 text-warning'; resultEl.textContent = 'Please select an answer first.'; resultEl.classList.remove('hidden'); }
        return;
      }
      if (sel.value === 'c') {
        if (resultEl) {
          resultEl.className = 'rounded-lg p-3 text-sm bg-success/10 border border-success/30 text-success';
          resultEl.textContent = '✓ Correct. The CL50 has no internal state machine — it simply executes the last PDout it received and holds it indefinitely. The PLC output register was not cleared after the maintenance window, so it keeps sending the pre-fault Amber Flash command.';
          resultEl.classList.remove('hidden');
        }
        ws6MsDiagSubmit.disabled = true;
        _ws6MsStep = 3;
        setTimeout(() => ws6MsShow('ws6-ms-read-box'), 400);
      } else {
        if (resultEl) {
          const hint = sel.value === 'a'
            ? 'Not quite — if the hardware were faulty the light would be fully off or show a constant error state, not a specific animation. A stuck hardware fault would not produce a valid, animated PDout response.'
            : 'Partially true — the CL50 does hold its last command when comms drop. But the live panel is still updating (IO-Link is active). The problem is the content of the PDout command, not the communication link.';
          resultEl.className = 'rounded-lg p-3 text-sm bg-error/10 border border-error/30 text-error';
          resultEl.textContent = `✗ ${hint}`;
          resultEl.classList.remove('hidden');
        }
      }
    });
  }

  const ws6MsReadBtn = container.querySelector('#ws6-ms-read-btn');
  if (ws6MsReadBtn) {
    ws6MsReadBtn.addEventListener('click', () => {
      if (_ws6MsStep !== 3) return;
      const rawHex  = container.querySelector('#ws6-ms-raw-hex')?.textContent  || '—';
      const animVal = container.querySelector('#ws6-ms-animation')?.textContent || '—';
      const c1Val   = container.querySelector('#ws6-ms-c1-label')?.textContent  || '—';
      const speedVal = container.querySelector('#ws5-speed')?.textContent   || '—';
      const c1Int   = container.querySelector('#ws5-c1-intensity')?.textContent || '—';
      const resultEl = container.querySelector('#ws6-ms-read-result');
      if (resultEl) {
        const animBad = animVal !== 'Steady' && animVal !== '—';
        resultEl.innerHTML = [
          `<p>Raw PDout hex :  <strong>${rawHex}</strong></p>`,
          `<p>Animation     :  <span class="${animBad ? 'text-error font-bold' : 'text-success'}">${animVal}${animBad ? ' ← FAULT (expected: Steady)' : ''}</span></p>`,
          `<p>Colour 1      :  ${c1Val}</p>`,
          `<p>Speed         :  ${speedVal}</p>`,
          `<p>C1 Intensity  :  ${c1Int}</p>`,
          `<p class="text-success pt-1 border-t border-base-300 mt-1">✓ Confirmed — Octet 1 animation field = 0x02 (Flash) instead of 0x01 (Steady). Write PDout 000100 to restore normal run state.</p>`,
        ].join('');
        resultEl.classList.remove('hidden');
      }
      ws6MsReadBtn.disabled = true;
      _ws6MsStep = 4;
      setTimeout(() => ws6MsShow('ws6-ms-fix-box'), 400);
    });
  }

  const ws6MsFixBtn = container.querySelector('#ws6-ms-fix-btn');
  if (ws6MsFixBtn) {
    ws6MsFixBtn.addEventListener('click', async () => {
      if (_ws6MsStep !== 4) return;
      ws6MsFixBtn.disabled = true;
      const statusEl = container.querySelector('#ws6-ms-fix-status');
      if (statusEl) statusEl.textContent = 'Writing…';
      const base = window.IO_LINK_API_BASE || '';
      try {
        const res = await fetch(`${base}/api/io-link/port/4/pdout`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: '000100' }),
        });
        const d = await res.json();
        if (d.success) {
          _ws6MsCleanup = null;
          _ws6MsStep = 5; _ws6MsVerifyStart = null; _ws6MsVerifyDone = false;
          if (statusEl) statusEl.textContent = '✓ Green Steady written — monitoring…';
          setTimeout(() => ws6MsShow('ws6-ms-vfy-box'), 400);
        } else {
          ws6MsFixBtn.disabled = false;
          if (statusEl) { statusEl.textContent = '✗ Write failed'; setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000); }
        }
      } catch {
        ws6MsFixBtn.disabled = false;
        if (statusEl) { statusEl.textContent = '✗ Network error'; setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000); }
      }
    });
  }

  function ws6MsCheckSignoff() {
    const allChecked = ['ws6-ms-ck1','ws6-ms-ck2','ws6-ms-ck3'].every(id => container.querySelector(`#${id}`)?.checked);
    const closeBtn = container.querySelector('#ws6-ms-close');
    if (closeBtn) closeBtn.disabled = !allChecked;
  }
  ['ws6-ms-ck1','ws6-ms-ck2','ws6-ms-ck3'].forEach(id => {
    container.querySelector(`#${id}`)?.addEventListener('change', ws6MsCheckSignoff);
  });

  const ws6MsCloseBtn = container.querySelector('#ws6-ms-close');
  if (ws6MsCloseBtn) {
    ws6MsCloseBtn.addEventListener('click', () => {
      ws6MsCloseBtn.disabled = true;
      ws6MsCloseBtn.className = 'btn btn-success btn-sm cursor-default';
      ws6MsCloseBtn.innerHTML = '✓ Work Order LST-0312 Closed';
    });
  }
}

function initLiveWs7(container) {
  _ws7MsStep = 0; _ws7MsVerifyStart = null; _ws7MsVerifyDone = false;

  // ── colour name → CSS colour (for HMI swatch) ──────────────────────────────
  const COLOR_CSS = {
    green: '#22c55e', red: '#ef4444', orange: '#f97316', amber: '#f59e0b',
    yellow: '#eab308', lime: '#84cc16', 'spring green': '#10b981', cyan: '#06b6d4',
    'sky blue': '#0ea5e9', blue: '#3b82f6', violet: '#8b5cf6', magenta: '#d946ef',
    rose: '#f43f5e', white: '#f8fafc',
  };
  function applySwatchColor(el, colorName) {
    if (!el) return;
    const css = COLOR_CSS[(colorName || '').toLowerCase()];
    if (css) {
      el.style.background = css;
      el.style.boxShadow = `0 0 8px ${css}60`;
      el.style.border = `2px solid ${css}`;
    } else {
      el.style.background = '#1e293b';
      el.style.boxShadow = '';
      el.style.border = '2px solid #334155';
    }
  }

  // ── HMI port-dot helper ─────────────────────────────────────────────────────
  const PORT_COL = { 1: '#3b82f6', 2: '#8b5cf6', 3: '#f97316', 4: '#22c55e' };
  function setPortDot(n, active) {
    const el = container.querySelector(`#ws7-hmi-p${n}-dot`);
    if (!el) return;
    if (active) {
      el.style.background = PORT_COL[n];
      el.style.boxShadow = `0 0 8px ${PORT_COL[n]}80`;
      el.style.border = `2px solid ${PORT_COL[n]}`;
    } else {
      el.style.background = '#1e293b';
      el.style.boxShadow = '';
      el.style.border = '2px solid #334155';
    }
  }

  // ── write PDout to Port 4 ───────────────────────────────────────────────────
  async function ws7WriteLight(hex) {
    const base = window.IO_LINK_API_BASE || '';
    try {
      await fetch(`${base}/api/io-link/port/4/pdout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: hex }),
      });
    } catch { /* ignore */ }
  }

  // ── show / hide step boxes ──────────────────────────────────────────────────
  function ws7MsShow(id) {
    const el = container.querySelector(`#${id}`);
    if (el) el.classList.remove('hidden');
  }

  // ── full reset ──────────────────────────────────────────────────────────────
  function ws7MsResetAll() {
    if (_ws7MsCleanup) { _ws7MsCleanup(); _ws7MsCleanup = null; }
    else {
      isduWrite(1, 61, 1, 0, 'uint8', 1, null);
      ws7WriteLight('000100');
    }
    _ws7MsStep = 0; _ws7MsVerifyStart = null; _ws7MsVerifyDone = false;
    const hmiWrapper = container.querySelector('#ws7-hmi-wrapper');
    if (hmiWrapper) hmiWrapper.classList.add('hidden');
    const msWrapper = container.querySelector('#ws7-ms-wrapper');
    if (msWrapper) msWrapper.classList.add('hidden');
    ['ws7-ms-observe-box','ws7-ms-diag-box','ws7-ms-read-box','ws7-ms-fix-box','ws7-ms-vfy-box','ws7-ms-signoff-box']
      .forEach(id => { const el = container.querySelector(`#${id}`); if (el) el.classList.add('hidden'); });
    ['ws7-ms-i-observed','ws7-ms-diag-submit','ws7-ms-read-btn','ws7-ms-fix-btn'].forEach(id => {
      const el = container.querySelector(`#${id}`);
      if (el) el.disabled = false;
    });
    const diagResult = container.querySelector('#ws7-ms-diag-result');
    if (diagResult) diagResult.classList.add('hidden');
    const readResult = container.querySelector('#ws7-ms-read-result');
    if (readResult) readResult.classList.add('hidden');
    const startBtn = container.querySelector('#ws7-ms-start');
    if (startBtn) startBtn.disabled = false;
    const alarmBar = container.querySelector('#ws7-hmi-alarm-bar');
    if (alarmBar) alarmBar.classList.add('hidden');
    const statusEl = container.querySelector('#ws7-ms-inject-status');
    if (statusEl) statusEl.textContent = '';
  }

  // ── live WebSocket updates ──────────────────────────────────────────────────
  startLiveData(data => {
    if (!data) {
      // offline
      const status = container.querySelector('#ws7-hmi-status');
      if (status) { status.textContent = '● OFFLINE'; status.style.color = '#475569'; }
      const badge = container.querySelector('#ws7-hmi-badge');
      if (badge) { badge.textContent = 'OFFLINE'; badge.className = 'badge badge-xs badge-ghost font-mono'; badge.style.fontSize = '0.6rem'; }
      return;
    }

    // HMI online indicator
    const status = container.querySelector('#ws7-hmi-status');
    if (status) { status.textContent = '● LIVE'; status.style.color = '#22c55e'; }
    const badge = container.querySelector('#ws7-hmi-badge');
    if (badge) { badge.textContent = 'LIVE'; badge.className = 'badge badge-xs badge-success font-mono'; badge.style.fontSize = '0.6rem'; }

    // P1 — Inductive Proximity (Omron E2E)
    const p1 = getPort(data, 1);
    const p1d = p1?.pdin_decoded || {};
    const p1mode = p1?.mode || 'inactive';
    setPortDot(1, p1mode === 'io-link');
    const p1det = !!(p1d.object_present || p1d.object_detected);
    const p1out1El = container.querySelector('#ws7-hmi-p1-out1');
    if (p1out1El) {
      if (p1mode !== 'io-link') {
        p1out1El.textContent = '—';
        p1out1El.style.color = '#94a3b8';
        p1out1El.style.fontWeight = '400';
      } else if (p1det) {
        p1out1El.textContent = 'ON';
        p1out1El.style.color = '#ef4444';
        p1out1El.style.fontWeight = '700';
      } else {
        p1out1El.textContent = 'OFF';
        p1out1El.style.color = '#22c55e';
        p1out1El.style.fontWeight = '400';
      }
    }
    const p1monEl = container.querySelector('#ws7-hmi-p1-mon');
    if (p1monEl) p1monEl.textContent = p1d.monitor_output != null ? p1d.monitor_output : '—';
    const p1instabEl = container.querySelector('#ws7-hmi-p1-instab');
    if (p1instabEl) {
      const v = p1d.instability_alarm;
      p1instabEl.textContent = v == null ? '—' : v ? 'ACTIVE' : 'CLEAR';
      p1instabEl.style.color = v ? '#f87171' : '#94a3b8';
    }
    const p1ovappEl = container.querySelector('#ws7-hmi-p1-ovapp');
    if (p1ovappEl) {
      const v = p1d.over_approach_alarm;
      p1ovappEl.textContent = v == null ? '—' : v ? 'ACTIVE' : 'CLEAR';
      p1ovappEl.style.color = v ? '#f87171' : '#94a3b8';
    }

    // P2 — Capacitive
    const p2 = getPort(data, 2);
    const p2d = p2?.pdin_decoded || {};
    const p2mode = p2?.mode || 'inactive';
    setPortDot(2, p2mode === 'io-link');
    const p2linkEl = container.querySelector('#ws7-hmi-p2-link');
    if (p2linkEl) {
      p2linkEl.textContent = p2mode === 'io-link' ? 'IO-Link OK' : p2mode || '—';
      p2linkEl.style.color = p2mode === 'io-link' ? '#22c55e' : '#ef4444';
    }
    const p2statusEl = container.querySelector('#ws7-hmi-p2-status');
    if (p2statusEl) p2statusEl.textContent = p2d.object_detected != null ? (p2d.object_detected ? 'DETECTED' : 'CLEAR') : '—';

    // P3 — Temperature (IFM TV7105)
    const p3 = getPort(data, 3);
    const p3d = p3?.pdin_decoded || {};
    const p3mode = p3?.mode || 'inactive';
    setPortDot(3, p3mode === 'io-link');
    const p3tempEl = container.querySelector('#ws7-hmi-p3-temp');
    if (p3tempEl) p3tempEl.textContent = p3d.temperature_c != null ? `${p3d.temperature_c.toFixed(1)} °C` : '—';
    const p3out1El = container.querySelector('#ws7-hmi-p3-out1');
    if (p3out1El) {
      const v = p3d.out1;
      p3out1El.textContent = v == null ? '—' : v ? 'ON' : 'OFF';
      p3out1El.style.color = v ? '#f87171' : '#4ade80';
      p3out1El.style.fontWeight = v ? '700' : '400';
    }
    const p3out2El = container.querySelector('#ws7-hmi-p3-out2');
    if (p3out2El) {
      const v = p3d.out2;
      p3out2El.textContent = v == null ? '—' : v ? 'ON' : 'OFF';
      p3out2El.style.color = v ? '#f87171' : '#4ade80';
      p3out2El.style.fontWeight = v ? '700' : '400';
    }

    // P4 — Light Stack (CL50 PDout-only)
    const p4 = getPort(data, 4);
    const p4dec = p4?.pdout_decoded;
    const p4raw = p4dec?.raw_hex;
    const p4swatchEl = container.querySelector('#ws7-hmi-p4-swatch');
    const p4colorEl  = container.querySelector('#ws7-hmi-p4-color');
    const p4animEl   = container.querySelector('#ws7-hmi-p4-anim');
    const p4hexEl = container.querySelector('#ws7-hmi-p4-hex');
    if (p4raw) {
      const c1 = p4dec.color1 || '—';
      const anim = p4dec.animation || '—';
      applySwatchColor(p4swatchEl, c1);
      if (p4colorEl) p4colorEl.textContent = c1;
      if (p4animEl)  p4animEl.textContent  = anim;
      if (p4hexEl)   p4hexEl.textContent   = p4raw.toUpperCase();
    } else {
      applySwatchColor(p4swatchEl, '');
      if (p4colorEl) p4colorEl.textContent = '—';
      if (p4animEl)  p4animEl.textContent  = '—';
      if (p4hexEl)   p4hexEl.textContent   = '—';
    }

    // ── Verify step (step 4) — OUT1 must be OFF in free air for 3s ─────────
    if (_ws7MsStep === 4 && !_ws7MsVerifyDone) {
      const isOK = p1mode === 'io-link' && !(p1d.object_present || p1d.object_detected);
      const pctEl  = container.querySelector('#ws7-ms-vfy-pct');
      const timerEl = container.querySelector('#ws7-ms-vfy-timer');
      const tbarEl  = container.querySelector('#ws7-ms-vfy-tbar');
      if (isOK) {
        if (!_ws7MsVerifyStart) _ws7MsVerifyStart = Date.now();
        const elapsed = (Date.now() - _ws7MsVerifyStart) / 1000;
        const pct = Math.min(100, (elapsed / 3) * 100);
        if (pctEl)   pctEl.textContent   = 'OUT1 OFF — holding…';
        if (timerEl) timerEl.textContent = `${elapsed.toFixed(1)} / 3 s`;
        if (tbarEl)  tbarEl.style.width  = `${pct}%`;
        if (elapsed >= 3) {
          _ws7MsVerifyDone = true;
          _ws7MsStep = 5;
          if (pctEl)   pctEl.textContent   = '✓ Verified — OUT1 confirmed OFF in free air';
          if (timerEl) timerEl.textContent = '3 / 3 s';
          if (tbarEl)  tbarEl.style.width  = '100%';
          ws7MsShow('ws7-ms-signoff-box');
        }
      } else {
        _ws7MsVerifyStart = null;
        if (pctEl)   pctEl.textContent   = 'OUT1 still ON — ensure no object is in front of Port 1';
        if (timerEl) timerEl.textContent = '0 / 3 s';
        if (tbarEl)  tbarEl.style.width  = '0%';
      }
    }
  });

  // ── One-shot ISDU reads: P2 capacitive SP1/QoT + P3 temperature SP/RP ──────
  ;(async () => {
    const [p3sp1, p3rp1, p3sp2, p3rp2, p2sp1, p2qot] = await Promise.all([
      isduRead(3, 583, 0, 'int16', 0.1),
      isduRead(3, 584, 0, 'int16', 0.1),
      isduRead(3, 593, 0, 'int16', 0.1),
      isduRead(3, 594, 0, 'int16', 0.1),
      isduRead(2, 60, 1, 'int16', 1),
      isduRead(2, 75, 0, 'uint8', 1),
    ]);
    const setTemp = (id, val) => {
      const el = container.querySelector(`#${id}`);
      if (el && val != null) { el.textContent = `${val.toFixed(1)} °C`; el.style.color = '#cbd5e1'; }
    };
    setTemp('ws7-hmi-p3-sp1', p3sp1);
    setTemp('ws7-hmi-p3-rp1', p3rp1);
    setTemp('ws7-hmi-p3-sp2', p3sp2);
    setTemp('ws7-hmi-p3-rp2', p3rp2);
    const sp1El = container.querySelector('#ws7-hmi-p2-sp1');
    if (sp1El && p2sp1 != null) { sp1El.textContent = p2sp1; sp1El.style.color = '#cbd5e1'; }
    const qotEl = container.querySelector('#ws7-hmi-p2-qot');
    if (qotEl && p2qot != null) { qotEl.textContent = `${p2qot}%`; qotEl.style.color = '#cbd5e1'; }
  })();

  // ── Reset button ────────────────────────────────────────────────────────────
  const resetBtn = container.querySelector('#ws7-ms-reset');
  if (resetBtn) resetBtn.addEventListener('click', ws7MsResetAll);

  // ── Start Investigation ─────────────────────────────────────────────────────
  const startBtn = container.querySelector('#ws7-ms-start');
  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      startBtn.disabled = true;
      const statusEl = container.querySelector('#ws7-ms-inject-status');
      if (statusEl) statusEl.textContent = 'Injecting fault…';
      const hmiWrapper = container.querySelector('#ws7-hmi-wrapper');
      if (hmiWrapper) hmiWrapper.classList.remove('hidden');
      const msWrapper = container.querySelector('#ws7-ms-wrapper');
      if (msWrapper) msWrapper.classList.remove('hidden');

      // Parallel: write NC to Port 1 + Flash Red to Port 4
      const base = window.IO_LINK_API_BASE || '';
      const [r1, r4] = await Promise.all([
        isduWrite(1, 61, 1, 1, 'uint8', 1, null),
        fetch(`${base}/api/io-link/port/4/pdout`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: '184201' }),
        }).then(r => r.json()).catch(() => null),
      ]);

      if (r1 !== false && r4?.success) {
        _ws7MsCleanup = async () => {
          await Promise.all([
            isduWrite(1, 61, 1, 0, 'uint8', 1, null),
            ws7WriteLight('000100'),
          ]);
        };
        _ws7MsStep = 1;
        if (statusEl) statusEl.textContent = '✓ Fault active — OUT1 permanently ON, CL50 flashing red';
        const alarmBar = container.querySelector('#ws7-hmi-alarm-bar');
        if (alarmBar) alarmBar.classList.remove('hidden');
        const alarmMsg = container.querySelector('#ws7-hmi-alarm-msg');
        if (alarmMsg) alarmMsg.textContent = 'FAULT ACTIVE — PORT 1 OUT1 PERMANENTLY ON · LINE 3 STOPPED';
        ws7MsShow('ws7-ms-observe-box');
      } else {
        if (statusEl) statusEl.textContent = '✗ Inject failed — check IO-Link connection';
        startBtn.disabled = false;
      }
    });
  }

  // ── Step 1: Observed button ─────────────────────────────────────────────────
  const observedBtn = container.querySelector('#ws7-ms-i-observed');
  if (observedBtn) {
    observedBtn.addEventListener('click', () => {
      if (_ws7MsStep < 1) return;
      _ws7MsStep = 2;
      observedBtn.disabled = true;
      ws7MsShow('ws7-ms-diag-box');
    });
  }

  // ── Step 2: Diagnosis MCQ ───────────────────────────────────────────────────
  const diagSubmit = container.querySelector('#ws7-ms-diag-submit');
  if (diagSubmit) {
    diagSubmit.addEventListener('click', () => {
      const sel = container.querySelector('input[name="ws7-ms-diag"]:checked');
      const resultEl = container.querySelector('#ws7-ms-diag-result');
      if (!sel) { if (resultEl) { resultEl.className = 'rounded-lg p-3 text-sm bg-warning/10 border border-warning/40 text-warning'; resultEl.textContent = 'Select an answer first.'; resultEl.classList.remove('hidden'); } return; }
      if (sel.value === 'c') {
        _ws7MsStep = 3;
        diagSubmit.disabled = true;
        if (resultEl) {
          resultEl.className = 'rounded-lg p-3 text-sm bg-success/10 border border-success/40 text-success';
          resultEl.innerHTML = '<strong>✓ Correct.</strong> The output logic is set to NC — OUT1 is ON when no object is detected and OFF when an object is present. This is the inverse of normal operation and causes the machine controller to see a permanent "object present" signal. Confirm via ISDU read.';
          resultEl.classList.remove('hidden');
        }
        ws7MsShow('ws7-ms-read-box');
      } else if (sel.value === 'a') {
        if (resultEl) {
          resultEl.className = 'rounded-lg p-3 text-sm bg-error/10 border border-error/40 text-error';
          resultEl.innerHTML = '<strong>✗ Not quite.</strong> If IO-Link had dropped, the P1 dot in the HMI would be grey and the port would show as inactive or offline. The P1 dot is still <strong>blue</strong> — IO-Link is communicating and the master is receiving live data from the sensor right now. Something else is wrong.';
          resultEl.classList.remove('hidden');
        }
      } else {
        if (resultEl) {
          resultEl.className = 'rounded-lg p-3 text-sm bg-error/10 border border-error/40 text-error';
          resultEl.innerHTML = '<strong>✗ Not quite.</strong> A shorted transistor and NC logic can look identical on the HMI — both cause OUT1 to appear permanently ON. But the key difference: in NC mode OUT1 will turn <strong>OFF</strong> when metal is placed within sensing range (the sensor IS responding to targets, just inverted). A shorted transistor stays ON regardless. Try placing metal in front of the sensor and watch OUT1. Use the ISDU read in the next step to confirm conclusively.';
          resultEl.classList.remove('hidden');
        }
      }
    });
  }

  // ── Step 3: ISDU Read ───────────────────────────────────────────────────────
  const readBtn = container.querySelector('#ws7-ms-read-btn');
  if (readBtn) {
    readBtn.addEventListener('click', async () => {
      readBtn.disabled = true;
      const resultEl = container.querySelector('#ws7-ms-read-result');
      if (resultEl) { resultEl.classList.remove('hidden'); resultEl.innerHTML = '<span class="text-base-content/50">Reading…</span>'; }
      const val = await isduRead(1, 61, 1, 'uint8', 1);
      if (val === null) {
        if (resultEl) resultEl.innerHTML = '<span class="text-error">✗ Read failed — check IO-Link connection</span>';
        readBtn.disabled = false;
        return;
      }
      _ws7MsStep = 4;
      const label = val === 1 ? 'NC (Normal Closed)' : val === 0 ? 'NO (Normal Open)' : `Unknown (${val})`;
      const nc = val === 1;
      if (resultEl) {
        resultEl.innerHTML = [
          `<p>Port 1 · Index 61 · Sub 1 — Switchpoint Logic OUT1</p>`,
          `<p>Raw value  :  <span class="${nc ? 'text-error font-bold' : 'text-success'}">${val}</span></p>`,
          `<p>Decoded    :  <span class="${nc ? 'text-error font-bold' : 'text-success'}">${label}${nc ? ' ← FAULT — output is inverted' : ''}</span></p>`,
          nc ? `<p class="text-success pt-1 border-t border-base-300 mt-1">✓ Confirmed NC. Write value 0 (NO) to restore normal operation.</p>` : `<p class="text-warning pt-1">Value is already NO — check other parameters or hardware.</p>`,
        ].join('');
      }
      if (nc) ws7MsShow('ws7-ms-fix-box');
    });
  }

  // ── Step 4: Fix ─────────────────────────────────────────────────────────────
  const fixBtn = container.querySelector('#ws7-ms-fix-btn');
  if (fixBtn) {
    fixBtn.addEventListener('click', async () => {
      fixBtn.disabled = true;
      const statusEl = container.querySelector('#ws7-ms-fix-status');
      if (statusEl) statusEl.textContent = 'Writing…';
      const base = window.IO_LINK_API_BASE || '';
      const [r1, r4] = await Promise.all([
        isduWrite(1, 61, 1, 0, 'uint8', 1, null),
        fetch(`${base}/api/io-link/port/4/pdout`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: '000100' }),
        }).then(r => r.json()).catch(() => null),
      ]);
      if (r1 !== false && r4?.success) {
        _ws7MsCleanup = null;
        const alarmBar = container.querySelector('#ws7-hmi-alarm-bar');
        if (alarmBar) alarmBar.classList.add('hidden');
        if (statusEl) statusEl.textContent = '✓ NO written to Port 1, Green Steady written to Port 4';
        _ws7MsVerifyStart = null;
        ws7MsShow('ws7-ms-vfy-box');
      } else {
        if (statusEl) statusEl.textContent = '✗ Write failed — retry';
        fixBtn.disabled = false;
      }
    });
  }

  // ── Sign-off checkboxes ─────────────────────────────────────────────────────
  ['ws7-ms-ck1','ws7-ms-ck2','ws7-ms-ck3'].forEach(id => {
    const el = container.querySelector(`#${id}`);
    if (el) el.addEventListener('change', () => {
      const allTicked = ['ws7-ms-ck1','ws7-ms-ck2','ws7-ms-ck3'].every(k => container.querySelector(`#${k}`)?.checked);
      const closeBtn = container.querySelector('#ws7-ms-close');
      if (closeBtn) closeBtn.disabled = !allTicked;
    });
  });

  const closeBtn = container.querySelector('#ws7-ms-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeBtn.disabled = true;
      closeBtn.textContent = '✓ Work Order FND-0001 Closed';
      closeBtn.className = 'btn btn-success btn-sm gap-2 opacity-70 cursor-default';
    });
  }
}

function initLiveWs8(container) {
  _ws8P1Done = false; _ws8P2Done = false; _ws8P3Done = false;
  _ws8IsduDone = false; _ws8T3McqDone = false; _ws8PdoutWritten = false; _ws8PdoutRestored = false; _ws8QsSubmitted = false;
  let _lastP1Det = false, _lastP2Det = false;

  const C8_CSS = {
    'green':'#22c55e','red':'#ef4444','orange':'#f97316','amber':'#f59e0b',
    'yellow':'#eab308','lime':'#84cc16','spring green':'#10b981','cyan':'#06b6d4',
    'sky blue':'#38bdf8','blue':'#3b82f6','violet':'#8b5cf6','magenta':'#ec4899',
    'rose':'#f43f5e','white':'#e2e8f0'
  };
  const PORT_COL = { 1:'#3b82f6', 2:'#8b5cf6', 3:'#f97316', 4:'#22c55e' };

  function setDot8(id, active, col) {
    const el = container.querySelector('#' + id);
    if (!el) return;
    el.style.background = active ? col : '#1e293b';
    el.style.borderColor = active ? col : '#334155';
  }
  function st8(id, txt, col) {
    const el = container.querySelector('#' + id);
    if (!el) return;
    el.textContent = txt;
    if (col !== undefined) el.style.color = col;
  }
  function autoTick8(id) {
    const el = container.querySelector('#' + id);
    if (!el) return;
    el.className = 'w-7 h-7 rounded-full bg-success border-2 border-success flex items-center justify-center text-xs font-bold text-white transition-all flex-shrink-0';
    el.textContent = '✓';
  }
  function unlock8(id) {
    const el = container.querySelector('#' + id);
    if (el) { el.style.opacity = '1'; el.style.pointerEvents = ''; }
  }
  function checkTaskUnlocks() {
    if (_ws8P1Done && _ws8P2Done && _ws8P3Done) unlock8('ws8-task2-wrap');
    if (_ws8IsduDone)                           unlock8('ws8-task3-wrap');
    if (_ws8PdoutRestored)                      unlock8('ws8-task4-wrap');
    if (_ws8QsSubmitted)                        unlock8('ws8-signoff-wrap');
  }

  // ── Live data ─────────────────────────────────────────────────────────────
  startLiveData(data => {
    const badge = container.querySelector('#ws8-live-badge');
    if (!data) {
      if (badge) { badge.textContent = 'OFFLINE'; badge.className = 'badge badge-xs badge-ghost font-mono'; badge.style.fontSize = '0.6rem'; }
      return;
    }
    if (badge) { badge.textContent = 'LIVE'; badge.className = 'badge badge-xs badge-success font-mono'; badge.style.fontSize = '0.6rem'; }

    // P1
    const p1 = getPort(data, 1);
    const p1d = p1?.pdin_decoded || {};
    const p1mode = p1?.mode || 'inactive';
    const p1det = !!(p1d.object_present || p1d.object_detected);
    setDot8('ws8-live-p1-dot', p1mode === 'io-link', PORT_COL[1]);
    st8('ws8-live-p1-out1', p1mode !== 'io-link' ? '—' : p1det ? 'ON' : 'OFF', p1det ? '#ef4444' : '#4ade80');
    st8('ws8-live-p1-mon', p1d.monitor_output != null ? String(p1d.monitor_output) : '—', '#94a3b8');
    if (p1det && !_lastP1Det && !_ws8P1Done) { _ws8P1Done = true; autoTick8('ws8-t1-p1-tick'); }
    _lastP1Det = p1det;

    // P2
    const p2 = getPort(data, 2);
    const p2d = p2?.pdin_decoded || {};
    const p2mode = p2?.mode || 'inactive';
    const p2det = !!p2d.object_detected;
    setDot8('ws8-live-p2-dot', p2mode === 'io-link', PORT_COL[2]);
    st8('ws8-live-p2-det', p2mode !== 'io-link' ? '—' : p2det ? 'YES' : 'NO', p2det ? '#f59e0b' : '#4ade80');
    st8('ws8-live-p2-link', p2mode === 'io-link' ? 'OK' : (p2mode || '—'), p2mode === 'io-link' ? '#22c55e' : '#94a3b8');
    if (p2det && !_lastP2Det && !_ws8P2Done) { _ws8P2Done = true; autoTick8('ws8-t1-p2-tick'); }
    _lastP2Det = p2det;

    // P3
    const p3 = getPort(data, 3);
    const p3d = p3?.pdin_decoded || {};
    const p3mode = p3?.mode || 'inactive';
    setDot8('ws8-live-p3-dot', p3mode === 'io-link', PORT_COL[3]);
    const tempV = p3d.temperature_c;
    st8('ws8-live-p3-temp', tempV != null ? tempV.toFixed(1) + '°C' : '—', '#94a3b8');
    const p3o1 = p3d.out1;
    st8('ws8-live-p3-out1', p3o1 == null ? '—' : p3o1 ? 'ON' : 'OFF', p3o1 ? '#ef4444' : '#4ade80');
    if (tempV != null && !_ws8P3Done) { _ws8P3Done = true; autoTick8('ws8-t1-p3-tick'); }
    checkTaskUnlocks();

    // P4
    const p4 = getPort(data, 4);
    const p4dec = p4?.pdout_decoded;
    const p4raw = p4dec?.raw_hex;
    const p4c1name = (p4dec?.color1 || '').toLowerCase();
    const p4dot = container.querySelector('#ws8-live-p4-dot');
    if (p4dot) {
      const css = C8_CSS[p4c1name] || '#1e293b';
      p4dot.style.background = css;
      p4dot.style.borderColor = css !== '#1e293b' ? css : '#334155';
    }
    st8('ws8-live-p4-color', p4dec?.color1 || '—', '#94a3b8');
    st8('ws8-live-p4-hex', p4raw ? p4raw.toUpperCase() : '—', '#94a3b8');

    if (_ws8PdoutWritten && !_ws8PdoutRestored && p4raw && p4raw.toLowerCase() === '000100') {
      _ws8PdoutRestored = true;
      checkTaskUnlocks();
      const rb = container.querySelector('#ws8-pdout-restore-btn');
      if (rb) { rb.disabled = true; rb.className = 'btn btn-success btn-sm opacity-70 cursor-default'; rb.textContent = '✓ Restored'; }
      st8('ws8-pdout-status', '✓ Green Steady confirmed via live data', '#4ade80');
    }
  });

  // ── Task 2: Part A — hex decode ───────────────────────────────────────────
  container.querySelectorAll('.ws8-pA-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const correct = Math.abs(parseFloat(btn.dataset.val) - 50.0) < 0.05;
      const res = container.querySelector('#ws8-pA-result');
      if (correct) {
        btn.className = 'ws8-pA-opt btn btn-success btn-sm font-mono';
        container.querySelectorAll('.ws8-pA-opt').forEach(b => { b.disabled = true; });
        if (res) { res.innerHTML = 'Correct &mdash; <span class="font-bold">500 &times; 0.1 = 50.0 &deg;C</span>'; res.style.color = '#4ade80'; }
        const partB = container.querySelector('#ws8-partB-wrap');
        if (partB) { partB.style.opacity = '1'; partB.style.pointerEvents = ''; }
      } else {
        btn.className = 'ws8-pA-opt btn btn-error btn-sm font-mono opacity-50 cursor-default';
        btn.disabled = true;
        if (res) { res.textContent = 'Not quite — try another option.'; res.style.color = '#ef4444'; }
      }
    });
  });

  // ── Task 2: Part B — raw hex fetch + dynamic decode MCQ ──────────────────
  const isduBtn = container.querySelector('#ws8-isdu-btn');
  if (isduBtn) {
    isduBtn.addEventListener('click', async () => {
      isduBtn.disabled = true;
      const resultEl = container.querySelector('#ws8-isdu-result');
      if (resultEl) resultEl.textContent = 'Reading…';
      const base = window.IO_LINK_API_BASE || '';
      let rawHex = null, decodedVal = null;
      try {
        const r = await fetch(base + '/api/io-link/port/3/parameter/read', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ index: 583, subindex: 0, dtype: 'int16', scale: 0.1 }),
        }).then(res => res.json());
        if (r && r.success) { rawHex = r.raw_hex; decodedVal = r.value; }
      } catch (_) {}
      if (rawHex != null && decodedVal != null) {
        // format raw hex as pairs e.g. "013C" → "01 3C"
        const hexDisplay = rawHex.toUpperCase().replace(/(.{2})/g, '$1 ').trim();
        if (resultEl) { resultEl.innerHTML = 'Raw hex: <span class="font-bold text-warning">' + hexDisplay + '</span>'; resultEl.style.color = ''; }
        isduBtn.className = 'btn btn-success btn-sm opacity-70 cursor-default gap-2';
        isduBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Read Complete';
        // decimal integer from the raw hex (unscaled)
        const rawInt = Math.round(decodedVal / 0.1);
        const decimalEl = container.querySelector('#ws8-partB-decimal');
        if (decimalEl) decimalEl.innerHTML = 'Those bytes represent the decimal integer <span class="font-mono font-bold text-warning">' + rawInt + '</span>.';
        // build 4 MCQ options: correct + 3 plausible distractors
        const correct = Math.round(decodedVal * 10) / 10;
        const opts = [correct, correct + 10, correct - 10, correct * 10].map(v => Math.round(v * 10) / 10);
        // shuffle
        for (let i = opts.length - 1; i > 0; i--) {
          const j = Math.floor((i + 1) * 0.37 + 0.5) % (i + 1); // deterministic-ish but varied
          [opts[i], opts[j]] = [opts[j], opts[i]];
        }
        const mcqWrap = container.querySelector('#ws8-partB-mcq');
        const optsEl = container.querySelector('#ws8-partB-opts');
        const resEl = container.querySelector('#ws8-partB-result');
        if (optsEl) {
          optsEl.innerHTML = opts.map(v =>
            `<button type="button" class="ws8-pB-opt btn btn-outline btn-sm font-mono" data-val="${v}">${v.toFixed(1)} °C</button>`
          ).join('');
          optsEl.querySelectorAll('.ws8-pB-opt').forEach(b => {
            b.addEventListener('click', () => {
              const isCorrect = Math.abs(parseFloat(b.dataset.val) - correct) < 0.05;
              if (isCorrect) {
                b.className = 'ws8-pB-opt btn btn-success btn-sm font-mono';
                optsEl.querySelectorAll('.ws8-pB-opt').forEach(x => { x.disabled = true; });
                if (resEl) { resEl.innerHTML = 'Correct &mdash; <span class="font-bold">SP1 = ' + correct.toFixed(1) + ' &deg;C</span>'; resEl.style.color = '#4ade80'; }
                _ws8IsduDone = true;
                checkTaskUnlocks();
              } else {
                b.className = 'ws8-pB-opt btn btn-error btn-sm font-mono opacity-50 cursor-default';
                b.disabled = true;
                if (resEl) { resEl.textContent = 'Not quite — try another option.'; resEl.style.color = '#ef4444'; }
              }
            });
          });
        }
        if (mcqWrap) mcqWrap.style.display = '';
      } else {
        if (resultEl) { resultEl.textContent = 'Read failed — retry'; resultEl.style.color = '#ef4444'; }
        isduBtn.disabled = false;
      }
    });
  }

  // ── Task 3: colour MCQ ────────────────────────────────────────────────────
  container.querySelectorAll('.ws8-t3-mcq').forEach(btn => {
    btn.addEventListener('click', () => {
      const isCorrect = btn.dataset.val === 'blue';
      const resEl = container.querySelector('#ws8-t3-mcq-result');
      if (isCorrect) {
        btn.className = 'ws8-t3-mcq btn btn-success btn-sm';
        container.querySelectorAll('.ws8-t3-mcq').forEach(b => { b.disabled = true; });
        if (resEl) { resEl.innerHTML = 'Correct &mdash; Color 1 index 9 = Blue, Animation 1 = Steady, C1I 0 = High.'; resEl.style.color = '#4ade80'; }
        const actionWrap = container.querySelector('#ws8-t3-action-wrap');
        if (actionWrap) { actionWrap.style.opacity = '1'; actionWrap.style.pointerEvents = ''; }
        _ws8T3McqDone = true;
      } else {
        btn.className = 'ws8-t3-mcq btn btn-error btn-sm opacity-50 cursor-default';
        btn.disabled = true;
        if (resEl) { resEl.textContent = 'Not quite — check the Color 1 field in the table.'; resEl.style.color = '#ef4444'; }
      }
    });
  });

  // ── Task 3: PDout Write ───────────────────────────────────────────────────
  const pdoutWriteBtn = container.querySelector('#ws8-pdout-write-btn');
  if (pdoutWriteBtn) {
    pdoutWriteBtn.addEventListener('click', async () => {
      pdoutWriteBtn.disabled = true;
      st8('ws8-pdout-status', 'Writing…', '#94a3b8');
      const base = window.IO_LINK_API_BASE || '';
      const r = await fetch(base + '/api/io-link/port/4/pdout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: '000109' }),
      }).then(res => res.json()).catch(() => null);
      if (r?.success) {
        _ws8PdoutWritten = true;
        pdoutWriteBtn.className = 'btn btn-info btn-sm opacity-70 cursor-default';
        pdoutWriteBtn.textContent = '✓ Blue Written';
        st8('ws8-pdout-status', 'Observe the blue light, then restore green', '#94a3b8');
        const rb = container.querySelector('#ws8-pdout-restore-btn');
        if (rb) rb.disabled = false;
      } else {
        st8('ws8-pdout-status', '✗ Write failed — retry', '#ef4444');
        pdoutWriteBtn.disabled = false;
      }
    });
  }

  // ── Task 3: PDout Restore ─────────────────────────────────────────────────
  const pdoutRestoreBtn = container.querySelector('#ws8-pdout-restore-btn');
  if (pdoutRestoreBtn) {
    pdoutRestoreBtn.addEventListener('click', async () => {
      pdoutRestoreBtn.disabled = true;
      st8('ws8-pdout-status', 'Restoring…', '#94a3b8');
      const base = window.IO_LINK_API_BASE || '';
      const r = await fetch(base + '/api/io-link/port/4/pdout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: '000100' }),
      }).then(res => res.json()).catch(() => null);
      if (r?.success) {
        _ws8PdoutRestored = true;
        checkTaskUnlocks();
        pdoutRestoreBtn.className = 'btn btn-success btn-sm opacity-70 cursor-default';
        pdoutRestoreBtn.textContent = '✓ Restored';
        st8('ws8-pdout-status', '✓ Green Steady restored', '#4ade80');
      } else {
        st8('ws8-pdout-status', '✗ Restore failed — retry', '#ef4444');
        pdoutRestoreBtn.disabled = false;
      }
    });
  }

  // ── Task 4: Knowledge Check ───────────────────────────────────────────────
  const ANSWERS = { 'ws8-q1': 'c', 'ws8-q2': 'a', 'ws8-q3': 'b', 'ws8-q4': 'c' };
  const qsBtn = container.querySelector('#ws8-qs-submit');
  if (qsBtn) {
    qsBtn.addEventListener('click', () => {
      let correct = 0; let allAnswered = true;
      Object.entries(ANSWERS).forEach(([name, ans]) => {
        const sel = container.querySelector('input[name="' + name + '"]:checked');
        if (!sel) { allAnswered = false; return; }
        if (sel.value === ans) correct++;
      });
      const res = container.querySelector('#ws8-qs-result');
      if (!allAnswered) {
        if (res) { res.className = 'rounded-lg px-3 py-2 text-sm bg-warning/10 border border-warning/40 text-warning'; res.textContent = 'Answer all four questions first.'; res.classList.remove('hidden'); }
        return;
      }
      const pass = correct >= 3;
      if (pass) { _ws8QsSubmitted = true; qsBtn.disabled = true; checkTaskUnlocks(); }
      if (res) {
        res.className = 'rounded-lg px-3 py-2 text-sm ' + (pass ? 'bg-success/10 border border-success/40 text-success' : 'bg-error/10 border border-error/40 text-error');
        res.textContent = correct + '/4 correct' + (pass ? ' — well done!' : ' — review the highlighted questions and try again.');
        res.classList.remove('hidden');
      }
    });
  }

  // ── Sign-off ──────────────────────────────────────────────────────────────
  const CK_IDS = ['ws8-ck1','ws8-ck2','ws8-ck3','ws8-ck4','ws8-ck5'];
  function checkSignoff() {
    const allTicked = CK_IDS.every(k => container.querySelector('#' + k)?.checked);
    const btn = container.querySelector('#ws8-complete-btn');
    if (btn) btn.disabled = !allTicked;
  }
  CK_IDS.forEach(id => {
    const el = container.querySelector('#' + id);
    if (el) el.addEventListener('change', checkSignoff);
  });

  const completeBtn = container.querySelector('#ws8-complete-btn');
  if (completeBtn) {
    completeBtn.addEventListener('click', () => {
      completeBtn.disabled = true;
      completeBtn.className = 'btn btn-success btn-sm gap-2 mt-1 opacity-70 cursor-default';
      const msg = container.querySelector('#ws8-complete-msg');
      if (msg) msg.classList.remove('hidden');
    });
  }
}

function initWorksheetInteractivity(container) {
  if (!container) container = document.getElementById('worksheets-root');
  if (!container) return;

  // Generic instant feedback for radio MCQs that carry data-correct attribute
  container.querySelectorAll('div[data-correct]').forEach(block => {
    const correct = block.dataset.correct;
    const feedbackEl = document.createElement('div');
    feedbackEl.className = 'hidden mt-2 rounded-lg p-2 text-sm';
    block.appendChild(feedbackEl);
    block.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const isCorrect = radio.value === correct;
        feedbackEl.className = `mt-2 rounded-lg p-2 text-sm ${isCorrect ? 'bg-success/10 border border-success/30 text-success' : 'bg-error/10 border border-error/30 text-error'}`;
        feedbackEl.textContent = isCorrect ? '✓ Correct!' : '✗ Not quite — re-read the section above and try again.';
      });
    });
  });

  // green completion styling for any .kit-item checkboxes on the page
  container.querySelectorAll('.kit-item').forEach(label => {
    const cb = label.querySelector('input[type="checkbox"]');
    if (!cb) return;
    const apply = () => {
      const kt = label.querySelector('.kit-text') || label.querySelector('span');
      if (cb.checked) {
        label.classList.add('bg-success/20', 'border-success');
        if (kt) kt.style.opacity = '0.6';
      } else {
        label.classList.remove('bg-success/20', 'border-success');
        if (kt) kt.style.opacity = '';
      }
    };
    cb.addEventListener('change', apply);
  });

  // start live data for the relevant worksheet
  if (container.querySelector('#ws-intro-panel'))        initLiveIntro(container);
  else if (container.querySelector('#ws2-smart-panel'))   initLiveWs2Smart(container);  // WS2 — smart sensor
  else if (container.querySelector('#ws2-chart'))         initLiveWs2(container);        // WS3 — photoelectric
  else if (container.querySelector('#ws3-chart'))         initLiveWs3(container);        // WS4 — capacitive
  else if (container.querySelector('#ws4-chart'))         initLiveWs4(container);        // WS5 — temperature
  else if (container.querySelector('#ws5-live-panel'))    initLiveWs5(container);        // WS6 — light stack
  else if (container.querySelector('#ws7-start-row'))     initLiveWs7(container);        // WS7 — fault finding
  else if (container.querySelector('#ws8-live-panel'))    initLiveWs8(container);        // WS8 — assessment
  else stopLiveData();
}

// ── Navigation ────────────────────────────────────────────────────────────────
let currentWorksheetIndex = 0;

function scrollToTop() {
  document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'instant' });
}

function showIndex() {
  _canvasAnimCancellers.forEach(c => { c.cancelled = true; }); _canvasAnimCancellers = [];
  stopLiveData();
  currentWorksheetIndex = 0;
  const root = document.getElementById('worksheets-root');
  if (root) root.innerHTML = buildIndexHtml();
  scrollToTop();
}

function showWorksheet(n) {
  if (n < 1 || n > TOTAL) return;
  _canvasAnimCancellers.forEach(c => { c.cancelled = true; }); _canvasAnimCancellers = [];
  stopLiveData();
  currentWorksheetIndex = n;
  markVisited('cp0001', n);
  const root = document.getElementById('worksheets-root');
  if (!root) return;
  root.innerHTML = buildWorksheetViewHtml(n);
  scrollToTop();
  initWorksheetInteractivity(root);
}

export function renderWorksheetsPage() {
  return '<div id="worksheets-root" class="worksheets-root">' + buildIndexHtml() + '</div>';
}

export function initWorksheetsPage() {
  const root = document.getElementById('worksheets-root');
  if (!root) return;

  root.addEventListener('click', e => {
    if (e.target.closest('.ws-back-btn'))  { e.preventDefault(); showIndex(); return; }
    if (e.target.closest('.ws-prev-btn'))  { e.preventDefault(); showWorksheet(currentWorksheetIndex === 1 ? TOTAL : currentWorksheetIndex - 1); return; }
    if (e.target.closest('.ws-next-btn'))  { e.preventDefault(); showWorksheet(currentWorksheetIndex === TOTAL ? 1 : currentWorksheetIndex + 1); return; }
    if (e.target.closest('.ws-print-btn')) { e.preventDefault(); window.print(); return; }
    const link = e.target.closest('.ws-index-link');
    if (link) {
      e.preventDefault();
      const n = parseInt(link.getAttribute('data-worksheet-index'), 10);
      if (!isNaN(n) && n >= 1 && n <= TOTAL) showWorksheet(n);
    }
  });

  initWorksheetInteractivity(root);
}

export function destroyWorksheetsPage() {
  stopLiveData();
}
