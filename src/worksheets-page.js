/**
 * CP0001: Maintenance on Smart Sensors
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
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q1" value="a" class="radio radio-sm radio-primary"> Green — it is called the gateway</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q1" value="b" class="radio radio-sm radio-primary"> Orange — it is called the hub</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q1" value="c" class="radio radio-sm radio-primary"> Blue — it is called the controller</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> Which sensor on this kit detects metal objects using an electromagnetic field?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q2" value="a" class="radio radio-sm radio-primary"> The capacitive sensor on Port 2</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q2" value="b" class="radio radio-sm radio-primary"> The temperature sensor on Port 3</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q2" value="c" class="radio radio-sm radio-primary"> The proximity sensor on Port 1</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> What can the capacitive sensor detect that the proximity sensor cannot?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q3" value="a" class="radio radio-sm radio-primary"> Objects moving faster than 1 m/s</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q3" value="b" class="radio radio-sm radio-primary"> Materials like liquid or powder — even through a container wall</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q3" value="c" class="radio radio-sm radio-primary"> The exact temperature of an object</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q4.</strong> What is the Raspberry Pi's job in this system?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q4" value="a" class="radio radio-sm radio-primary"> It powers the IO-Link Master via USB</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q4" value="b" class="radio radio-sm radio-primary"> It collects the sensor data, runs the comms, and serves up this dashboard</label>
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
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q5" value="a" class="radio radio-sm radio-primary"> It only ever shows two states — on or off — same as a normal sensor</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q5" value="b" class="radio radio-sm radio-primary"> It showed a live level rising as your hand got close, before it fully triggered</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q5" value="c" class="radio radio-sm radio-primary"> It measured the exact distance between your hand and the sensor in millimetres</label>
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

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> A digital sensor on a conveyor stops switching. What can a maintenance technician find out from a standard digital sensor when this happens?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q1" value="a" class="radio radio-sm radio-primary"> The exact fault code and which internal component has failed</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q1" value="b" class="radio radio-sm radio-primary"> Nothing — the sensor just goes silent, you have to go and test it manually</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q1" value="c" class="radio radio-sm radio-primary"> The last reading before it failed, stored in its internal log</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> A pressure transmitter outputs 12 mA on a 4–20 mA loop calibrated to 0–100 bar. What is the current pressure reading?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q2" value="a" class="radio radio-sm radio-primary"> 12 bar — the mA value equals the bar reading directly</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q2" value="b" class="radio radio-sm radio-primary"> 50 bar — 12 mA is the midpoint of the 4–20 mA range, which maps to 50% of 100 bar</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q2" value="c" class="radio radio-sm radio-primary"> 0 bar — the sensor is in fault because 12 mA is below the normal 16 mA minimum</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> An IO-Link sensor still has its standard switching output (OUT1) active. What does the IO-Link communication channel add on top of that?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q3" value="a" class="radio radio-sm radio-primary"> It replaces OUT1 entirely — you only get the data stream, not a switching output</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q3" value="b" class="radio radio-sm radio-primary"> Process data, fault codes, device identity, and remote parameter writes — all over the same 3-wire cable without interrupting OUT1</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q3" value="c" class="radio radio-sm radio-primary"> A higher voltage signal so the PLC can tell it is an IO-Link device</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q4.</strong> Why might you choose an analogue sensor over a digital sensor for monitoring tank level?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q4" value="a" class="radio radio-sm radio-primary"> Analogue sensors are cheaper and easier to wire than digital sensors</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q4" value="b" class="radio radio-sm radio-primary"> An analogue signal gives a continuous level reading — you see exactly how full the tank is, not just "full" or "empty"</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q4" value="c" class="radio radio-sm radio-primary"> Analogue sensors send fault codes that digital sensors cannot</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q5.</strong> Looking at the IO-Link wire animation above — what does the square wave at the bottom of the cable represent?</p>
      <div class="space-y-2 mt-1">
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

      <!-- M-size explainer -->
      <div class="rounded-lg border border-base-300 bg-base-200 p-3 mt-3 text-sm">
        <p class="font-bold text-base-content mb-1">📏 What does M18 mean?</p>
        <p class="text-base-content/80">The <strong>M number</strong> is the diameter of the sensor body in millimetres — like a bolt size. <strong>M18</strong> = 18 mm across.</p>
      </div>

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
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q1" value="a" class="radio radio-sm radio-primary"> The line jumps from 0 to 1, then drops back to 0 when the metal moves away</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q1" value="b" class="radio radio-sm radio-primary"> The line stays flat at 0 the whole time</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q1" value="c" class="radio radio-sm radio-primary"> The line drops below zero when metal is detected</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> The Instability Alarm fires while the sensor output is ON. What does this tell you about the target position?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q2" value="a" class="radio radio-sm radio-primary"> The sensor has detected two metal objects at the same time</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q2" value="b" class="radio radio-sm radio-primary"> The target is near the edge of the sensing range — detection may be unreliable</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q2" value="c" class="radio radio-sm radio-primary"> The sensor cable has a loose connection</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> The Over-Approach Alarm fires when the metal target is held very close to the sensor face. What is the correct response?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q3" value="a" class="radio radio-sm radio-primary"> Replace the sensor immediately — the over-approach alarm means it has failed</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q3" value="b" class="radio radio-sm radio-primary"> Increase the standoff distance between the sensor face and the target</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q3" value="c" class="radio radio-sm radio-primary"> Reduce sensitivity using the teach button</label>
      </div>

      <div class="divider my-2"></div>

      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3" id="ws3-challenge-box">
        <p class="font-bold text-base-content text-base">🔧 Maintenance Scenario — Stability Confirmation</p>
        <div class="rounded-lg bg-base-300/50 p-3 text-sm text-base-content/80 border border-base-300">
          <p><strong>Job ticket:</strong> Port 1 has been flagged for intermittent detection on the assembly line — the target bracket may have shifted. Bring a metal object (screwdriver) to the ideal sensing distance — approximately 8–12 mm from the face — and confirm the sensor reports stable detection with no instability alarm.</p>
          <p class="mt-2 text-xs text-base-content/60 font-semibold uppercase tracking-wide">IO-Link diagnostic rule:</p>
          <div class="flex gap-2 mt-1 flex-wrap">
            <span class="badge badge-sm bg-success/20 text-success border-success/40">Detected + No Alarm — Stable ✓</span>
            <span class="badge badge-sm bg-warning/20 text-warning border-warning/40">Detected + Instability — Marginal</span>
            <span class="badge badge-sm bg-error/20 text-error border-error/40">Not Detected — Out of range</span>
          </div>
          <p class="mt-2 text-xs text-base-content/60">Position the target until the sensor detects it <strong>without</strong> the instability alarm. The audit passes when stable detection is confirmed.</p>
        </div>
        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs text-base-content/60">
            <span class="font-semibold uppercase tracking-wide">Stability Status</span>
            <span id="ws3-ch-sq-pct" class="font-mono font-bold">—</span>
          </div>
          <div class="w-full bg-base-300 rounded-full h-5 overflow-hidden">
            <div id="ws3-ch-sq-bar" class="h-5 rounded-full transition-all duration-300 bg-base-300" style="width:0%"></div>
          </div>
          <div class="flex justify-between text-xs text-base-content/40 px-0.5">
            <span>Not detected</span><span>Detected (unstable)</span><span>Detected (stable)</span>
          </div>
        </div>
        <div id="ws3-ch-result" class="hidden rounded-lg p-3 text-center font-bold text-sm"></div>
        <div class="flex justify-center">
          <button type="button" id="ws3-ch-reset" class="btn btn-warning btn-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Reset Audit
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
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-2">
            <p class="text-xs font-semibold text-base-content">Detection Threshold (SSC1 SP1)</p>
            <p class="text-xs text-base-content/60">Lower = more sensitive. Range 10–10000. Current value read from sensor.</p>
            <div class="flex items-center gap-2">
              <span class="text-xs text-base-content/50">Sensitive</span>
              <input type="range" id="ws3-sp1-slider" min="10" max="10000" value="1000" step="10" class="range range-secondary range-xs flex-1">
              <span class="text-xs text-base-content/50">Low</span>
            </div>
            <div class="flex items-center justify-between">
              <span id="ws3-sp1-val" class="font-mono text-sm font-bold text-secondary">—</span>
              <button type="button" id="ws3-sp1-write" class="btn btn-xs btn-secondary">Apply to sensor</button>
            </div>
            <span id="ws3-sp1-status" class="text-xs"></span>
          </div>
          <!-- QoT / QoR -->
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-2">
            <p class="text-xs font-semibold text-base-content">Teach &amp; Run Quality</p>
            <p class="text-xs text-base-content/60">QoT = how well the sensor was taught. QoR = signal margin during operation.</p>
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-xs w-8">QoT</span>
                <progress id="ws3-qot-bar" class="progress progress-info flex-1" value="0" max="255"></progress>
                <span id="ws3-qot-val" class="text-xs font-mono w-8 text-right">—</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs w-8">QoR</span>
                <progress id="ws3-qor-bar" class="progress progress-success flex-1" value="0" max="255"></progress>
                <span id="ws3-qor-val" class="text-xs font-mono w-8 text-right">—</span>
              </div>
            </div>
            <button type="button" id="ws3-qot-refresh" class="btn btn-xs btn-ghost">↺ Refresh</button>
          </div>
        </div>
        <!-- Teach buttons -->
        <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-2">
          <p class="text-xs font-semibold text-base-content">Teach Mode — Auto-set Threshold</p>
          <p class="text-xs text-base-content/60">Place target at the trigger point, press Start, wait, then press Stop. The sensor sets SP1 automatically.</p>
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
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q1" value="a" class="radio radio-sm radio-secondary"> Every second while your hand is touching</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q1" value="b" class="radio radio-sm radio-secondary"> The moment detection goes from off to on — one touch = one count, no matter how long you hold it</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q1" value="c" class="radio radio-sm radio-secondary"> Only when you pull your hand away</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> Which pair of materials can a capacitive sensor detect that a photoelectric sensor cannot?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q2" value="a" class="radio radio-sm radio-secondary"> Sound and light</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q2" value="b" class="radio radio-sm radio-secondary"> Water and powder — even through a container wall</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q2" value="c" class="radio radio-sm radio-secondary"> Heat and pressure</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> The capacitive sensor output is always ON even when nothing is near it. What is the most likely cause?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q3" value="a" class="radio radio-sm radio-secondary"> Sensitivity too high — it is detecting the container wall or nearby objects</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q3" value="b" class="radio radio-sm radio-secondary"> The sensor needs replacing immediately</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q3" value="c" class="radio radio-sm radio-secondary"> The cable is the wrong colour</label>
      </div>

      <div class="divider my-2"></div>

      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3" id="ws4-challenge-box">
        <p class="font-bold text-base-content text-base">🔧 Maintenance Scenario — Fix the False Triggers</p>
        <div class="rounded-lg bg-base-300/50 p-3 text-sm text-base-content/80 border border-base-300">
          <p><strong>Job ticket:</strong> A replacement capacitive sensor on Port 2 is causing false detections — the output fires even with nothing near it. Sensitivity is too high. Use IO-Link to diagnose and correct the SP1 threshold.</p>
        </div>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <div id="ws4-ch-s1" class="w-7 h-7 rounded-full bg-base-300 border-2 border-base-300 flex items-center justify-center text-xs font-bold text-base-content/50 transition-all flex-shrink-0">1</div>
            <span class="text-sm text-base-content/80">Read the current SP1 from the ISDU panel above — note the value</span>
          </div>
          <div class="flex items-center gap-2">
            <div id="ws4-ch-s2" class="w-7 h-7 rounded-full bg-base-300 border-2 border-base-300 flex items-center justify-center text-xs font-bold text-base-content/50 transition-all flex-shrink-0">2</div>
            <span class="text-sm text-base-content/80">Reduce SP1 by ~50% using the slider above, then click <strong>Apply to sensor</strong></span>
          </div>
          <div class="flex items-center gap-2">
            <div id="ws4-ch-s3" class="w-7 h-7 rounded-full bg-base-300 border-2 border-base-300 flex items-center justify-center text-xs font-bold text-base-content/50 transition-all flex-shrink-0">3</div>
            <span class="text-sm text-base-content/80">With nothing near the sensor, click <strong>Confirm Fix</strong> — output must be clear</span>
          </div>
        </div>
        <div class="flex items-center gap-3 rounded-lg bg-base-300/40 p-2">
          <div id="ws4-ch-dot" class="w-4 h-4 rounded-full bg-base-300 border border-base-300 transition-all flex-shrink-0"></div>
          <span id="ws4-ch-det-label" class="text-xs font-mono text-base-content/60">waiting for live data…</span>
        </div>
        <div id="ws4-ch-result" class="hidden rounded-lg p-3 text-center font-bold text-sm"></div>
        <div class="flex justify-center gap-2 flex-wrap">
          <button type="button" id="ws4-ch-confirm" class="btn btn-success btn-sm gap-2" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Confirm Fix
          </button>
          <button type="button" id="ws4-ch-reset" class="btn btn-warning btn-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Reset
          </button>
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
      <p class="text-base-content/90 leading-relaxed">The IFM TV7105 sends the actual temperature reading (in °C) back through IO-Link every second — a live number you can graph and trend.</p>

      <!-- WS5 SVG diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">How it works</p>
        <svg viewBox="0 0 570 185" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <!-- Thermometer body -->
          <rect x="420" y="20" width="32" height="140" rx="12" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
          <!-- Temperature fill (gradient orange) -->
          <rect x="424" y="70" width="24" height="86" rx="8" fill="#f97316"/>
          <!-- Bulb -->
          <circle cx="436" cy="155" r="14" fill="#ef4444"/>

          <!-- SP1 line (amber dashed) -->
          <line x1="80" y1="110" x2="420" y2="110" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6,3"/>
          <text x="85" y="106" fill="#f59e0b" font-size="9" font-weight="600">SP1 — first alarm</text>

          <!-- SP2 line (red dashed) -->
          <line x1="80" y1="68" x2="420" y2="68" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="6,3"/>
          <text x="85" y="64" fill="#ef4444" font-size="9" font-weight="600">SP2 — second alarm</text>

          <!-- Current temp pointer -->
          <polygon points="400,130 412,124 412,136" fill="white"/>
          <text x="320" y="134" fill="white" font-size="11" font-weight="700" text-anchor="end">23.4 °C</text>

          <!-- Colour zones -->
          <!-- Green zone (below SP1) -->
          <rect x="30" y="110" width="45" height="50" rx="3" fill="#16a34a" opacity="0.7"/>
          <text x="52" y="140" text-anchor="middle" fill="white" font-size="8" font-weight="600">Normal</text>

          <!-- Amber zone (SP1 to SP2) -->
          <rect x="30" y="68" width="45" height="42" rx="3" fill="#d97706" opacity="0.7"/>
          <text x="52" y="93" text-anchor="middle" fill="white" font-size="8" font-weight="600">Warning</text>

          <!-- Red zone (above SP2) -->
          <rect x="30" y="20" width="45" height="48" rx="3" fill="#dc2626" opacity="0.7"/>
          <text x="52" y="48" text-anchor="middle" fill="white" font-size="8" font-weight="600">Danger</text>

          <!-- Bottom label -->
          <text x="285" y="175" text-anchor="middle" fill="#64748b" font-size="8">IO-Link sends the actual temperature every second — not just an ON/OFF alarm</text>
        </svg>
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

        <!-- Alarm threshold slider (local simulation + real SP1 write) -->
        <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-2">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <p class="text-sm font-semibold text-base-content">SP1 Alarm Setpoint</p>
            <span id="ws4-slider-val" class="font-mono font-bold text-warning text-sm">40°C</span>
          </div>
          <input type="range" id="ws4-alarm-slider" min="15" max="80" value="40" step="1" class="range range-warning range-sm w-full">
          <div class="flex justify-between text-xs text-base-content/40"><span>15°C</span><span>80°C</span></div>
          <p id="ws4-alarm-state" class="text-sm font-bold text-base-content/60">Set a threshold above, then warm the sensor</p>
          <div class="flex items-center gap-2 mt-1 flex-wrap">
            <button type="button" id="ws4-sp1-write" class="btn btn-xs btn-warning">Write SP1 to sensor</button>
            <span id="ws4-sp1-device-val" class="text-xs text-base-content/60">Device SP1: <span class="font-mono" id="ws4-sp1-actual">reading…</span></span>
            <span id="ws4-sp1-status" class="text-xs"></span>
          </div>
          <p class="text-xs text-base-content/40">Write SP1 to persist the alarm point in the sensor — it stays even after power-off.</p>
        </div>
        <!-- SP2 quick set -->
        <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-2">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <p class="text-sm font-semibold text-base-content">SP2 Second Setpoint</p>
            <span id="ws4-sp2-slider-val" class="font-mono font-bold text-base-content/70 text-sm">120°C</span>
          </div>
          <input type="range" id="ws4-sp2-slider" min="15" max="149" value="120" step="1" class="range range-sm w-full">
          <div class="flex justify-between text-xs text-base-content/40"><span>15°C</span><span>149°C</span></div>
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" id="ws4-sp2-write" class="btn btn-xs btn-ghost">Write SP2 to sensor</button>
            <span id="ws4-sp2-status" class="text-xs"></span>
          </div>
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
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q1" value="a" class="radio radio-sm radio-warning"> Nothing extra — it works exactly the same as a switch</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q1" value="b" class="radio radio-sm radio-warning"> See the actual live temperature in °C, trend it over time, and get early warning before the trip point is reached</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q1" value="c" class="radio radio-sm radio-warning"> It only works at high temperatures above 100 °C</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> Move the SP1 slider just above the current temperature, then hold the sensor in your hands for 30 seconds. What should happen to the alarm state?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q2" value="a" class="radio radio-sm radio-warning"> Nothing changes — the alarm only activates from the main dashboard</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q2" value="b" class="radio radio-sm radio-warning"> The alarm state turns red and shows "ABOVE THRESHOLD" once the temperature crosses your slider value</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q2" value="c" class="radio radio-sm radio-warning"> The sensor turns itself off to prevent overheating</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> The temperature reading suddenly drops to −40 °C in a room-temperature lab. What is the most likely cause?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q3" value="a" class="radio radio-sm radio-warning"> The lab is very cold</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q3" value="b" class="radio radio-sm radio-warning"> Broken or disconnected sensor — −40 °C is a common default error value for temperature sensors</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q3" value="c" class="radio radio-sm radio-warning"> The setpoint has been changed</label>
      </div>

      <div class="divider my-2"></div>

      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3" id="ws5-challenge-box">
        <p class="font-bold text-base-content text-base">🎯 Challenge</p>
        <p class="text-sm text-base-content/80">Set the SP1 slider to just 1–2°C above the current temperature, write it to the sensor, then hold the sensor in your palms until the SP1 alarm output activates.</p>
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
          <button type="button" id="ws5-ch-reset" class="btn btn-warning btn-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Reset Challenge
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
      <p class="text-base-content/90 leading-relaxed">The IFM CL50 is a multi-colour status light. Each colour segment can be off, on solid, or flashing. IO-Link tells you exactly which colour is showing and how.</p>

      <!-- WS6 SVG diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">How it works</p>
        <svg viewBox="0 0 570 195" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <!-- CL50 tower -->
          <rect x="230" y="15" width="70" height="155" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
          <!-- Red segment (top) -->
          <rect x="234" y="19" width="62" height="45" rx="5" fill="#dc2626"/>
          <text x="265" y="38" text-anchor="middle" fill="white" font-size="8" font-weight="600">Red</text>
          <text x="265" y="50" text-anchor="middle" fill="#fca5a5" font-size="7">Fault / Stopped</text>
          <!-- Amber segment (middle) -->
          <rect x="234" y="67" width="62" height="45" rx="5" fill="#f59e0b"/>
          <text x="265" y="86" text-anchor="middle" fill="white" font-size="8" font-weight="600">Amber</text>
          <text x="265" y="98" text-anchor="middle" fill="#fde68a" font-size="7">Warning / Attention</text>
          <!-- Green segment (bottom) -->
          <rect x="234" y="115" width="62" height="45" rx="5" fill="#16a34a"/>
          <text x="265" y="134" text-anchor="middle" fill="white" font-size="8" font-weight="600">Green</text>
          <text x="265" y="146" text-anchor="middle" fill="#bbf7d0" font-size="7">Running OK</text>

          <!-- IO-Link master (right) -->
          <rect x="390" y="70" width="80" height="50" rx="6" fill="#ea580c"/>
          <text x="430" y="91" text-anchor="middle" fill="white" font-size="9" font-weight="700">IO-Link</text>
          <text x="430" y="104" text-anchor="middle" fill="#fed7aa" font-size="8">Master</text>

          <!-- Arrow from tower to master -->
          <line x1="300" y1="92" x2="388" y2="92" stroke="#94a3b8" stroke-width="2"/>
          <polygon points="388,88 388,96 396,92" fill="#94a3b8"/>
          <text x="344" y="85" text-anchor="middle" fill="#94a3b8" font-size="8">IO-Link</text>

          <!-- IO-Link data label -->
          <text x="430" y="138" text-anchor="middle" fill="#64748b" font-size="8">colour + flash/solid</text>

          <!-- Bottom label -->
          <text x="285" y="183" text-anchor="middle" fill="#64748b" font-size="8">IO-Link tells you exactly which colour is on, whether it is flashing, and the raw hex value</text>
        </svg>
      </div>

      <!-- Live section -->
      <div class="rounded-xl border-2 border-accent/30 bg-accent/5 p-4 mt-3 space-y-3" id="ws5-live-panel">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="font-semibold text-base-content text-sm">Port 4 — Live CL50 State</span>
          <span id="ws5-live-badge" class="badge badge-xs badge-ghost font-mono">OFFLINE</span>
        </div>

        <!-- Colour display -->
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

        <!-- State details -->
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div class="rounded bg-base-200 border border-base-300 p-2">
            <p class="text-base-content/50 text-xs">Animation</p>
            <p id="ws5-animation" class="font-semibold text-base-content">—</p>
          </div>
          <div class="rounded bg-base-200 border border-base-300 p-2">
            <p class="text-base-content/50 text-xs">Raw hex</p>
            <p id="ws5-raw-hex" class="font-mono font-semibold text-base-content">—</p>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto rounded-lg border border-base-300 mt-4">
        <table class="table table-zebra text-sm">
          <thead><tr><th>Colour</th><th>Typical meaning</th></tr></thead>
          <tbody>
            <tr><td><span class="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>Green</td><td>Machine running OK</td></tr>
            <tr><td><span class="inline-block w-3 h-3 rounded-full bg-amber-400 mr-2"></span>Amber</td><td>Warning — attention needed soon</td></tr>
            <tr><td><span class="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>Red</td><td>Fault — machine stopped or needs repair</td></tr>
          </tbody>
        </table>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> Look at the live display above. The CL50 is showing solid green. What would that mean on a real factory machine?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q1" value="a" class="radio radio-sm radio-accent"> Machine has a fault and has stopped</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q1" value="b" class="radio radio-sm radio-accent"> Machine is running normally — all good</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q1" value="c" class="radio radio-sm radio-accent"> Machine is in standby waiting for an operator</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> The light stack shows flashing red. What should a maintenance technician do first?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q2" value="a" class="radio radio-sm radio-accent"> Immediately restart the machine and see if it goes away</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q2" value="b" class="radio radio-sm radio-accent"> Check the fault log or HMI for the cause — do not reset without knowing why</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q2" value="c" class="radio radio-sm radio-accent"> Replace the light stack — a flashing light means the unit is faulty</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> Why is it useful that IO-Link tells you the exact colour and whether it is flashing or solid — rather than just a "light is on" alarm?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q3" value="a" class="radio radio-sm radio-accent"> It is not useful — a simple alarm is all you need</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q3" value="b" class="radio radio-sm radio-accent"> The exact state can be logged — knowing it flashed amber three times before going red is a clue you would miss with a basic alarm</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws5-q3" value="c" class="radio radio-sm radio-accent"> It looks nicer on the dashboard</label>
      </div>

      <div class="divider my-2"></div>

      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3" id="ws6-challenge-box">
        <p class="font-bold text-base-content text-base">🎯 Challenge</p>
        <p class="text-sm text-base-content/80">WITHOUT looking at the physical light stack — use only the dashboard data above to predict what colour it is currently showing. Make your guess, then turn around and check.</p>
        <div class="grid grid-cols-4 gap-2">
          <button type="button" class="ws6-colour-btn btn btn-sm" data-colour="Green" style="background:#16a34a;color:white;border-color:#16a34a">Green</button>
          <button type="button" class="ws6-colour-btn btn btn-sm" data-colour="Amber" style="background:#f59e0b;color:white;border-color:#f59e0b">Amber</button>
          <button type="button" class="ws6-colour-btn btn btn-sm" data-colour="Red" style="background:#dc2626;color:white;border-color:#dc2626">Red</button>
          <button type="button" class="ws6-colour-btn btn btn-sm" data-colour="Blue" style="background:#2563eb;color:white;border-color:#2563eb">Blue</button>
        </div>
        <p id="ws6-ch-selection" class="text-xs text-base-content/60 text-center">No guess selected</p>
        <div class="flex justify-center">
          <button type="button" id="ws6-ch-submit" class="btn btn-primary btn-sm">Submit Guess</button>
        </div>
        <div id="ws6-ch-result" class="hidden rounded-lg p-3 text-center font-bold text-sm"></div>
        <div class="flex justify-center">
          <button type="button" id="ws6-ch-reset" class="btn btn-warning btn-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Reset Challenge
          </button>
        </div>
      </div>
    `
  },
  {
    id: 7,
    title: 'Fault Finding and Replacement',
    shortDesc: 'Diagnose, swap, confirm — all four sensors.',
    estimatedTime: 'About 20 min',
    whyItMatters: 'IO-Link tells you what\'s wrong and where. This worksheet ties together what you\'ve learned about all four sensors so you can run through a realistic fault-find without guessing.',
    relatedDashboard: 'Dashboard: Simulate Fault, Active Port Details',
    prerequisites: 'Complete Worksheets 1–5',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed text-base">Read each scenario, then pick the best action. These are real faults you will come across on the job.</p>

      <!-- WS7 SVG diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">How it works</p>
        <svg viewBox="0 0 570 195" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <!-- Box 1: Fault detected -->
          <rect x="5" y="55" width="98" height="55" rx="5" fill="#dc2626"/>
          <text x="54" y="75" text-anchor="middle" fill="white" font-size="8" font-weight="600">Fault detected</text>
          <text x="54" y="88" text-anchor="middle" fill="#fca5a5" font-size="7">port offline or</text>
          <text x="54" y="100" text-anchor="middle" fill="#fca5a5" font-size="7">wrong value</text>
          <!-- Arrow 1 -->
          <line x1="103" y1="82" x2="116" y2="82" stroke="#64748b" stroke-width="2"/>
          <polygon points="116,78 116,86 124,82" fill="#64748b"/>

          <!-- Box 2: Check dashboard -->
          <rect x="124" y="55" width="98" height="55" rx="5" fill="#d97706"/>
          <text x="173" y="75" text-anchor="middle" fill="white" font-size="8" font-weight="600">Check Dashboard</text>
          <text x="173" y="88" text-anchor="middle" fill="#fde68a" font-size="7">read the</text>
          <text x="173" y="100" text-anchor="middle" fill="#fde68a" font-size="7">fault code</text>
          <!-- Arrow 2 -->
          <line x1="222" y1="82" x2="235" y2="82" stroke="#64748b" stroke-width="2"/>
          <polygon points="235,78 235,86 243,82" fill="#64748b"/>

          <!-- Box 3: Identify cause -->
          <rect x="243" y="55" width="98" height="55" rx="5" fill="#2563eb"/>
          <text x="292" y="75" text-anchor="middle" fill="white" font-size="8" font-weight="600">Identify cause</text>
          <text x="292" y="88" text-anchor="middle" fill="#bfdbfe" font-size="7">lens / sensitivity</text>
          <text x="292" y="100" text-anchor="middle" fill="#bfdbfe" font-size="7">cable / probe</text>
          <!-- Arrow 3 -->
          <line x1="341" y1="82" x2="354" y2="82" stroke="#64748b" stroke-width="2"/>
          <polygon points="354,78 354,86 362,82" fill="#64748b"/>

          <!-- Box 4: Fix the issue -->
          <rect x="362" y="55" width="98" height="55" rx="5" fill="#7c3aed"/>
          <text x="411" y="75" text-anchor="middle" fill="white" font-size="8" font-weight="600">Fix the issue</text>
          <text x="411" y="88" text-anchor="middle" fill="#ddd6fe" font-size="7">on the bench</text>
          <text x="411" y="100" text-anchor="middle" fill="#ddd6fe" font-size="7">or in place</text>
          <!-- Arrow 4 -->
          <line x1="460" y1="82" x2="473" y2="82" stroke="#64748b" stroke-width="2"/>
          <polygon points="473,78 473,86 481,82" fill="#64748b"/>

          <!-- Box 5: Confirm -->
          <rect x="481" y="55" width="84" height="55" rx="5" fill="#16a34a"/>
          <text x="523" y="75" text-anchor="middle" fill="white" font-size="8" font-weight="600">Confirm</text>
          <text x="523" y="88" text-anchor="middle" fill="#bbf7d0" font-size="7">port returns to</text>
          <text x="523" y="100" text-anchor="middle" fill="#bbf7d0" font-size="7">IO-Link mode</text>

          <!-- Bottom label -->
          <text x="285" y="178" text-anchor="middle" fill="#64748b" font-size="8">IO-Link gives you the fault code — you don't have to guess</text>
        </svg>
      </div>

      <div class="space-y-4 mt-3">

        <div class="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
          <p class="font-bold text-base-content">🔧 Scenario A — Port 1 (Proximity)</p>
          <p class="text-sm text-base-content/80">Dashboard shows <strong>Instability Alarm active</strong>. The output is intermittently switching even though the target appears stationary.</p>
          <p class="font-medium text-sm text-base-content mt-2">What do you do first?</p>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws6-a" value="a" class="radio radio-xs radio-primary"> Replace the sensor immediately</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws6-a" value="b" class="radio radio-xs radio-primary"> Check and adjust the target bracket — the instability alarm means the target is at the edge of the sensing range, so moving it into the nominal zone (8–12 mm) should clear the alarm</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws6-a" value="c" class="radio radio-xs radio-primary"> Adjust the setpoint higher in the sensor parameters</label>
          </div>
        </div>

        <div class="rounded-xl border-2 border-secondary/30 bg-secondary/5 p-4 space-y-3">
          <p class="font-bold text-base-content">🫙 Scenario B — Port 2 (Capacitive)</p>
          <p class="text-sm text-base-content/80">Sensor was just replaced. Output is permanently ON even though the tank is empty.</p>
          <p class="font-medium text-sm text-base-content mt-2">Most likely cause and action?</p>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws6-b" value="a" class="radio radio-xs radio-secondary"> The replacement sensor is faulty — send it back</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws6-b" value="b" class="radio radio-xs radio-secondary"> Sensitivity is set too high — the sensor is detecting the container wall. Reduce sensitivity or re-teach</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws6-b" value="c" class="radio radio-xs radio-secondary"> The cable polarity is reversed</label>
          </div>
        </div>

        <div class="rounded-xl border-2 border-warning/30 bg-warning/5 p-4 space-y-3">
          <p class="font-bold text-base-content">🌡️ Scenario C — Port 3 (Temperature)</p>
          <p class="text-sm text-base-content/80">Temperature reading suddenly shows −40 °C in a room-temperature lab.</p>
          <p class="font-medium text-sm text-base-content mt-2">Most likely fault?</p>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws6-c" value="a" class="radio radio-xs radio-warning"> The lab is too cold</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws6-c" value="b" class="radio radio-xs radio-warning"> Broken or disconnected sensor — −40 °C is a common default error value for temperature sensors</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws6-c" value="c" class="radio radio-xs radio-warning"> The setpoint was changed</label>
          </div>
        </div>

        <div class="rounded-xl border-2 border-accent/30 bg-accent/5 p-4 space-y-3">
          <p class="font-bold text-base-content">🚦 Scenario D — Port 4 (Light Stack)</p>
          <p class="text-sm text-base-content/80">The red segment will not turn off even after the operator says the fault was cleared.</p>
          <p class="font-medium text-sm text-base-content mt-2">Which is the most likely explanation?</p>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws6-d" value="a" class="radio radio-xs radio-accent"> The light stack hardware is broken</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws6-d" value="b" class="radio radio-xs radio-accent"> The fault was not actually cleared in the controller — the PLC is still sending a "red on" command</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws6-d" value="c" class="radio radio-xs radio-accent"> IO-Link has lost connection to the light stack</label>
          </div>
        </div>
      </div>

      <div class="alert bg-primary/10 border border-primary/30 rounded-lg text-base-content mt-4">
        <strong>Try it live:</strong> Go to the <a href="#" data-page="io-link-master" class="link link-primary">IO-Link Master</a> page. Look at Active Port Details for each connected sensor — what information can you see?
      </div>

      <div class="divider my-2"></div>

      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3" id="ws7-challenge-box">
        <p class="font-bold text-base-content text-base">🎯 Challenge</p>
        <p class="text-sm text-base-content/80">Disconnect any one sensor cable from the IO-Link Master. Watch the port go offline in the panel below. Then reconnect it. The challenge passes when the port returns to IO-Link mode.</p>
        <div class="grid grid-cols-4 gap-2">
          <div class="rounded-lg bg-base-200 border border-base-300 p-2 text-center space-y-1">
            <p class="text-xs text-base-content/50 font-medium">P1</p>
            <div id="ws7-ch-p1" class="w-5 h-5 rounded-full bg-base-300 mx-auto transition-all"></div>
            <p id="ws7-ch-p1-val" class="text-xs text-base-content/70">—</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-2 text-center space-y-1">
            <p class="text-xs text-base-content/50 font-medium">P2</p>
            <div id="ws7-ch-p2" class="w-5 h-5 rounded-full bg-base-300 mx-auto transition-all"></div>
            <p id="ws7-ch-p2-val" class="text-xs text-base-content/70">—</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-2 text-center space-y-1">
            <p class="text-xs text-base-content/50 font-medium">P3</p>
            <div id="ws7-ch-p3" class="w-5 h-5 rounded-full bg-base-300 mx-auto transition-all"></div>
            <p id="ws7-ch-p3-val" class="text-xs text-base-content/70">—</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-2 text-center space-y-1">
            <p class="text-xs text-base-content/50 font-medium">P4</p>
            <div id="ws7-ch-p4" class="w-5 h-5 rounded-full bg-base-300 mx-auto transition-all"></div>
            <p id="ws7-ch-p4-val" class="text-xs text-base-content/70">—</p>
          </div>
        </div>
        <p id="ws7-ch-status-msg" class="text-xs text-base-content/60 text-center">Waiting — disconnect a sensor cable to begin</p>
        <div id="ws7-ch-result" class="hidden rounded-lg p-3 text-center font-bold text-sm"></div>
        <div class="flex justify-center">
          <button type="button" id="ws7-ch-reset" class="btn btn-warning btn-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Reset Challenge
          </button>
        </div>
      </div>
    `
  },
  {
    id: 8,
    title: 'Final Practical Assessment',
    shortDesc: 'Checklist across all four sensors.',
    estimatedTime: 'About 30 min',
    whyItMatters: 'This is your sign-off checklist. Complete every task — on real hardware where available, or on the Dashboard where indicated.',
    relatedDashboard: 'Dashboard: all ports, Simulate Fault',
    prerequisites: 'Complete Worksheets 1–6',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed text-base">Work through each section on the real kit. Tick each task when you have done it and answer the check question.</p>

      <!-- WS8 SVG diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">How it all connects</p>
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

      <div class="space-y-4 mt-3">

        <div class="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
          <p class="font-bold text-base-content">🔧 Section 1 — Proximity Sensor (Port 1)</p>
          <label class="kit-item flex items-start gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0 mt-0.5">
            <span>Hold a metal object (screwdriver, spanner) near the sensor face and confirm the output dot changes on the Dashboard.</span>
          </label>
          <label class="kit-item flex items-start gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0 mt-0.5">
            <span>The waveform on the Proximity Sensor worksheet jumped from 0 to 1 when the metal object was in range.</span>
          </label>
          <p class="text-sm font-medium text-base-content mt-1">What is the sensor's current output state on the dashboard?</p>
          <div class="space-y-1">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws7-s1" value="a" class="radio radio-xs radio-primary"> Detected (output ON, dot lit)</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws7-s1" value="b" class="radio radio-xs radio-primary"> No object (output OFF, dot grey)</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws7-s1" value="c" class="radio radio-xs radio-primary"> Port not connected</label>
          </div>
        </div>

        <div class="rounded-xl border-2 border-secondary/30 bg-secondary/5 p-4 space-y-3">
          <p class="font-bold text-base-content">🫙 Section 2 — Capacitive Sensor (Port 2)</p>
          <label class="kit-item flex items-start gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0 mt-0.5">
            <span>Touch the sensor face 5 times and confirm the detection count increments on the Capacitive worksheet.</span>
          </label>
          <label class="kit-item flex items-start gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0 mt-0.5">
            <span>The analogue level bar moves before the output fully switches on.</span>
          </label>
          <p class="text-sm font-medium text-base-content mt-1">What triggers a new count on the capacitive sensor?</p>
          <div class="space-y-1">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws7-s2" value="a" class="radio radio-xs radio-secondary"> Every second while touching</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws7-s2" value="b" class="radio radio-xs radio-secondary"> The moment detection goes from off to on — rising edge</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws7-s2" value="c" class="radio radio-xs radio-secondary"> Only when you pull your hand away</label>
          </div>
        </div>

        <div class="rounded-xl border-2 border-warning/30 bg-warning/5 p-4 space-y-3">
          <p class="font-bold text-base-content">🌡️ Section 3 — Temperature Sensor (Port 3)</p>
          <label class="kit-item flex items-start gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0 mt-0.5">
            <span>Note the current temperature reading from the Temperature worksheet live panel.</span>
          </label>
          <label class="kit-item flex items-start gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0 mt-0.5">
            <span>Hold the sensor between your palms for 30 seconds and confirm the chart rises on screen.</span>
          </label>
          <p class="text-sm font-medium text-base-content mt-1">What would a reading of −40 °C at room temperature most likely mean?</p>
          <div class="space-y-1">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws7-s3" value="a" class="radio radio-xs radio-warning"> The room is very cold</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws7-s3" value="b" class="radio radio-xs radio-warning"> Broken or disconnected sensor — −40 °C is a common error default</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws7-s3" value="c" class="radio radio-xs radio-warning"> SP1 setpoint was changed</label>
          </div>
        </div>

        <div class="rounded-xl border-2 border-accent/30 bg-accent/5 p-4 space-y-3">
          <p class="font-bold text-base-content">🚦 Section 4 — Light Stack (Port 4)</p>
          <label class="kit-item flex items-start gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0 mt-0.5">
            <span>Open the Light Stack worksheet and read the current CL50 colour and animation state.</span>
          </label>
          <p class="text-sm font-medium text-base-content mt-1">What does a flashing red segment typically mean on a production machine?</p>
          <div class="space-y-1">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws7-s4" value="a" class="radio radio-xs radio-accent"> Machine is running normally</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws7-s4" value="b" class="radio radio-xs radio-accent"> Active fault — machine stopped or needs attention</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws7-s4" value="c" class="radio radio-xs radio-accent"> The light stack is in standby mode</label>
          </div>
        </div>

        <div class="rounded-xl border-2 border-error/30 bg-error/5 p-4 space-y-3">
          <p class="font-bold text-base-content">🔧 Section 5 — Pulling It All Together</p>
          <label class="kit-item flex items-start gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0 mt-0.5">
            <span>You can name all four sensors on the bench without looking at any labels.</span>
          </label>
          <label class="kit-item flex items-start gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0 mt-0.5">
            <span>You have triggered each sensor and seen it respond live on the dashboard.</span>
          </label>
          <label class="kit-item flex items-start gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0 mt-0.5">
            <span>You know what IO-Link gives you that a standard sensor does not.</span>
          </label>
          <p class="text-sm font-medium text-base-content mt-1">If a sensor stops working and you cannot tell why from the outside, what is the first advantage IO-Link gives you?</p>
          <div class="space-y-1">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws7-s5" value="a" class="radio radio-xs radio-error"> You have to unplug it and test it on a bench</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws7-s5" value="b" class="radio radio-xs radio-error"> The dashboard shows a fault code telling you exactly what is wrong — no guesswork</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws7-s5" value="c" class="radio radio-xs radio-error"> You need to call the manufacturer</label>
          </div>
        </div>
      </div>

      <div class="alert bg-success/10 border border-success/30 rounded-lg text-base-content mt-4">
        <strong>Well done!</strong> If you have ticked every box and answered each question, you have completed CP0001. Head to <a href="#" data-page="io-link-master" class="link link-primary">the Dashboard</a> to explore the live data further.
      </div>

      <div class="divider my-2"></div>

      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3" id="ws8-challenge-box">
        <p class="font-bold text-base-content text-base">🎯 Challenge</p>
        <p class="text-sm text-base-content/80">Complete the sequence <strong>in order</strong>: first trigger the proximity sensor with a metal object, then trigger the capacitive sensor, then check the temperature is above 15°C. All three must happen in order.</p>
        <div class="flex justify-center gap-6 py-2">
          <div class="text-center space-y-1">
            <div id="ws8-ch-s1" class="w-10 h-10 rounded-full bg-base-300 border-2 border-base-300 flex items-center justify-center text-xs font-bold text-base-content/50 transition-all mx-auto">1</div>
            <p class="text-xs text-base-content/60">Proximity<br>triggered</p>
          </div>
          <div class="text-center space-y-1">
            <div id="ws8-ch-s2" class="w-10 h-10 rounded-full bg-base-300 border-2 border-base-300 flex items-center justify-center text-xs font-bold text-base-content/50 transition-all mx-auto">2</div>
            <p class="text-xs text-base-content/60">Capacitive<br>triggered</p>
          </div>
          <div class="text-center space-y-1">
            <div id="ws8-ch-s3" class="w-10 h-10 rounded-full bg-base-300 border-2 border-base-300 flex items-center justify-center text-xs font-bold text-base-content/50 transition-all mx-auto">3</div>
            <p class="text-xs text-base-content/60">Temperature<br>&gt; 15°C</p>
          </div>
        </div>
        <div id="ws8-ch-result" class="hidden rounded-lg p-3 text-center font-bold text-sm"></div>
        <div class="flex justify-center">
          <button type="button" id="ws8-ch-reset" class="btn btn-warning btn-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Reset Challenge
          </button>
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
        <span class="badge badge-primary badge-outline font-mono text-xs shrink-0">CP0001</span>
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

// WS4 (capacitive) challenge — false trigger fix via ISDU
let _ws4ChDone = false; let _ws4SpWritten = false;

// WS5 (temperature) challenge — trigger alarm
let _ws5ChDone = false;

// WS6 (light stack) challenge — colour prediction
let _ws6ChGuess = null; let _ws6ChSubmitted = false; let _ws6ChColor = null;

// WS7 (fault finding) challenge — port recovery
let _ws7ChPortDropped = false; let _ws7ChRecovered = false; let _ws7ChDroppedPort = null;

// WS8 (assessment) challenge — full sequence
let _ws8ChStep = 0; let _ws8ChDone = false;

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

  const chart = makeChart('ws2-chart', 'line',
    [{ data: Array(60).fill(0), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)',
       fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 }], -0.1, 1.2, '');
  const sigChart = makeChart('ws2-sig-chart', 'line',
    [{ data: Array(60).fill(0), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)',
       fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 }], -0.1, 1.2, '');

  startLiveData(data => {
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

    // ── WS3 challenge: stability confirmation ────────────────────────────────
    const sqBar = container.querySelector('#ws3-ch-sq-bar');
    const sqPct = container.querySelector('#ws3-ch-sq-pct');
    if (sqPct) {
      if (!det) {
        sqPct.textContent = 'Not detected';
      } else if (instab) {
        sqPct.textContent = 'Detected — Unstable';
      } else {
        sqPct.textContent = 'Detected — Stable ✓';
      }
    }
    if (sqBar) {
      const w = !det ? 0 : instab ? 50 : 100;
      sqBar.style.width = `${w}%`;
      sqBar.className = !det
        ? 'h-5 rounded-full transition-all duration-300 bg-error'
        : instab
          ? 'h-5 rounded-full transition-all duration-300 bg-warning'
          : 'h-5 rounded-full transition-all duration-300 bg-success';
    }
    if (!_ws3ChDone && det && !instab) {
      _ws3ChDone = true;
      const ws3Result = container.querySelector('#ws3-ch-result');
      if (ws3Result) {
        ws3Result.className = 'rounded-lg p-3 text-center font-bold text-base bg-success/20 text-success border border-success/40';
        ws3Result.textContent = '✓ Audit complete — stable detection confirmed, no instability alarm. Sensor is correctly positioned. Log it and move on.';
        ws3Result.classList.remove('hidden');
      }
    }

    pushToChart(chart, det ? 1 : 0);
    pushToChart(sigChart, instab ? 1 : 0);
  });

  // WS3 challenge reset
  const ws3Reset = container.querySelector('#ws3-ch-reset');
  if (ws3Reset) {
    ws3Reset.addEventListener('click', () => {
      _ws3ChDone = false;
      const r = container.querySelector('#ws3-ch-result');
      if (r) r.classList.add('hidden');
    });
  }
}

function initLiveWs3(container) {
  _lastCapState = false;
  _capTaskCount = 0;
  _ws4ChDone = false; _ws4SpWritten = false;

  const chart = makeChart('ws3-chart', 'line',
    [{ data: Array(60).fill(0), borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.15)',
       fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 }], -0.1, 1.2, '');

  startLiveData(data => {
    const port = getPort(data, 2);
    setLiveStatus('ws3-live-badge', !!port);
    if (!port || !port.pdin_decoded) return;

    const det   = port.pdin_decoded.object_detected || false;
    const count = port.detection_counter ?? 0;
    const analogueVal = port.pdin_decoded.analogue_value ?? 0;

    // dot
    const dot = container.querySelector('#ws3-dot');
    if (dot) {
      dot.className = det
        ? 'w-10 h-10 rounded-full border-2 shadow-md transition-all duration-150 bg-secondary border-secondary shadow-secondary/40'
        : 'w-10 h-10 rounded-full border-2 shadow-md transition-all duration-150 bg-base-300 border-base-300';
    }
    const lbl = container.querySelector('#ws3-state-label');
    if (lbl) lbl.textContent = det ? 'Detected' : 'Clear';

    // live counter
    const cntEl = container.querySelector('#ws3-count-display');
    if (cntEl) cntEl.textContent = count;

    // task: rising edges
    if (det && !_lastCapState) {
      _capTaskCount = Math.min(_capTaskCount + 1, 5);
      const prog = container.querySelector('#ws3-task-progress');
      const tc   = container.querySelector('#ws3-task-count');
      if (prog) prog.value = _capTaskCount;
      if (tc)   tc.textContent = `${_capTaskCount} / 5`;
      if (_capTaskCount >= 5) {
        container.querySelector('#ws3-task-done')?.classList.remove('hidden');
      }
    }
    _lastCapState = det;

    pushToChart(chart, det ? 1 : 0);

    // ── WS4 challenge: false trigger fix — update live detection dot ─────────
    const chDot   = container.querySelector('#ws4-ch-dot');
    const chLabel = container.querySelector('#ws4-ch-det-label');
    if (chDot) {
      chDot.className = det
        ? 'w-4 h-4 rounded-full bg-error border border-error transition-all flex-shrink-0'
        : 'w-4 h-4 rounded-full bg-success border border-success transition-all flex-shrink-0';
    }
    if (chLabel) chLabel.textContent = det ? 'Output ACTIVE — false trigger present' : 'Output CLEAR — no false trigger';

    // enable confirm button only after SP1 written and output is clear
    const confirmBtn = container.querySelector('#ws4-ch-confirm');
    if (confirmBtn) confirmBtn.disabled = !(_ws4SpWritten && !det);
  });

  // WS4 challenge step 3 — confirm fix
  const ws4Confirm = container.querySelector('#ws4-ch-confirm');
  if (ws4Confirm) {
    ws4Confirm.addEventListener('click', () => {
      if (!_ws4SpWritten) return;
      _ws4ChDone = true;
      const r = container.querySelector('#ws4-ch-result');
      if (r) {
        r.className = 'rounded-lg p-3 text-center font-bold text-base bg-success/20 text-success border border-success/40';
        r.textContent = '✓ Fix confirmed — SP1 adjusted via IO-Link, false triggers eliminated. Ready to return to service.';
        r.classList.remove('hidden');
      }
      // mark steps complete
      ['ws4-ch-s1','ws4-ch-s2','ws4-ch-s3'].forEach(id => {
        const el = container.querySelector(`#${id}`);
        if (el) el.className = 'w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all bg-success border-success text-white flex-shrink-0';
      });
    });
  }

  // WS4 challenge reset
  const ws4Reset = container.querySelector('#ws4-ch-reset');
  if (ws4Reset) {
    ws4Reset.addEventListener('click', () => {
      _ws4ChDone = false; _ws4SpWritten = false;
      const r = container.querySelector('#ws4-ch-result');
      if (r) r.classList.add('hidden');
      ['ws4-ch-s1','ws4-ch-s2','ws4-ch-s3'].forEach(id => {
        const el = container.querySelector(`#${id}`);
        if (el) el.className = 'w-7 h-7 rounded-full bg-base-300 border-2 border-base-300 flex items-center justify-center text-xs font-bold text-base-content/50 transition-all flex-shrink-0';
      });
      const confirmBtn = container.querySelector('#ws4-ch-confirm');
      if (confirmBtn) confirmBtn.disabled = true;
    });
  }

  // ── ISDU: load SP1, QoT, QoR from device ─────────────────────────────────
  const badge = container.querySelector('#ws3-isdu-badge');
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
    // mark challenge step 1 complete once ISDU loads
    const s1 = container.querySelector('#ws4-ch-s1');
    if (s1) s1.className = 'w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all bg-success border-success text-white flex-shrink-0';
  }
  loadCapIsdu();

  if (sp1Slider && sp1ValEl) {
    sp1Slider.addEventListener('input', () => { sp1ValEl.textContent = sp1Slider.value; });
  }
  container.querySelector('#ws3-sp1-write')?.addEventListener('click', async () => {
    const val = parseInt(sp1Slider?.value ?? 1000);
    const ok = await isduWrite(2, 60, 1, val, 'int16', 1, 'ws3-sp1-status');
    if (ok) {
      _ws4SpWritten = true;
      // mark challenge step 2 complete
      const s2 = container.querySelector('#ws4-ch-s2');
      if (s2) s2.className = 'w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all bg-success border-success text-white flex-shrink-0';
    }
  });
  container.querySelector('#ws3-qot-refresh')?.addEventListener('click', loadCapIsdu);
  container.querySelector('#ws3-teach-start')?.addEventListener('click',  () => isduCommand(2, 'teach_sp1_start',  'ws3-teach-status'));
  container.querySelector('#ws3-teach-stop')?.addEventListener('click',   () => isduCommand(2, 'teach_sp1_stop',   'ws3-teach-status'));
  container.querySelector('#ws3-teach-cancel')?.addEventListener('click', () => isduCommand(2, 'teach_cancel',     'ws3-teach-status'));
}

function initLiveWs4(container) {
  _tempBaseline = null;
  _alarmThreshold = 40;
  _ws5ChDone = false;

  const chart = makeChart('ws4-chart', 'line',
    [{ data: Array(60).fill(null), borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.15)',
       fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 }], null, null, '°C');

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
    const port = getPort(data, 3);
    setLiveStatus('ws4-live-badge', !!port);
    if (!port || !port.pdin_decoded) return;

    const temp = port.pdin_decoded.temperature_c ?? null;
    const out1 = port.pdin_decoded.out1 ?? false;
    const out2 = port.pdin_decoded.out2 ?? false;
    if (temp === null) return;

    // set baseline on first reading
    if (_tempBaseline === null) _tempBaseline = temp;

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
    if (!_ws5ChDone && out1) {
      _ws5ChDone = true;
      if (ws5Result) {
        ws5Result.className = 'rounded-lg p-3 text-center font-bold text-base bg-success/20 text-success border border-success/40';
        ws5Result.textContent = '✓ Challenge complete! SP1 alarm activated — temperature exceeded the setpoint.';
        ws5Result.classList.remove('hidden');
      }
    }
  });

  // WS5 challenge reset
  const ws5Reset = container.querySelector('#ws5-ch-reset');
  if (ws5Reset) {
    ws5Reset.addEventListener('click', () => {
      _ws5ChDone = false;
      const r = container.querySelector('#ws5-ch-result');
      if (r) r.classList.add('hidden');
      const dot = container.querySelector('#ws5-ch-out-dot');
      if (dot) dot.className = 'w-8 h-8 rounded-full bg-base-300 mx-auto transition-all duration-150 shadow-md';
      const lbl = container.querySelector('#ws5-ch-out-label');
      if (lbl) lbl.textContent = 'inactive';
    });
  }

  // ── ISDU: read current SP1/SP2 from device, wire write buttons ───────────
  const sp1Slider   = container.querySelector('#ws4-alarm-slider');
  const sp2Slider   = container.querySelector('#ws4-sp2-slider');
  const sp2ValEl    = container.querySelector('#ws4-sp2-slider-val');

  isduRead(3, 583, 0, 'int16', 0.1).then(sp1 => {
    if (sp1 !== null) {
      const actualEl = container.querySelector('#ws4-sp1-actual');
      if (actualEl) actualEl.textContent = `${sp1}°C`;
      if (sp1Slider) { sp1Slider.value = Math.min(80, Math.max(15, sp1)); }
      const sliderVal = container.querySelector('#ws4-slider-val');
      if (sliderVal) sliderVal.textContent = `${sp1Slider?.value ?? sp1}°C`;
      _alarmThreshold = parseFloat(sp1Slider?.value ?? sp1);
    }
  });
  isduRead(3, 593, 0, 'int16', 0.1).then(sp2 => {
    if (sp2 !== null && sp2Slider) {
      sp2Slider.value = Math.min(149, Math.max(15, sp2));
      if (sp2ValEl) sp2ValEl.textContent = `${sp2}°C`;
    }
  });

  if (sp2Slider && sp2ValEl) {
    sp2Slider.addEventListener('input', () => { sp2ValEl.textContent = `${sp2Slider.value}°C`; });
  }

  container.querySelector('#ws4-sp1-write')?.addEventListener('click', async () => {
    const val = parseFloat(sp1Slider?.value ?? _alarmThreshold);
    const ok = await isduWrite(3, 583, 0, val, 'int16', 0.1, 'ws4-sp1-status');
    if (ok) {
      const actualEl = container.querySelector('#ws4-sp1-actual');
      if (actualEl) actualEl.textContent = `${val}°C`;
    }
  });

  container.querySelector('#ws4-sp2-write')?.addEventListener('click', async () => {
    const val = parseFloat(sp2Slider?.value ?? 120);
    await isduWrite(3, 593, 0, val, 'int16', 0.1, 'ws4-sp2-status');
  });
}

function initLiveWs5(container) {
  _ws6ChGuess = null; _ws6ChSubmitted = false; _ws6ChColor = null;

  startLiveData(data => {
    const port = getPort(data, 4);
    setLiveStatus('ws5-live-badge', !!port);
    if (!port || !port.pdin_decoded) return;

    const d = port.pdin_decoded;
    const c1 = d.color1 || 'off';
    const c2 = d.color2 || 'off';
    const anim = d.animation || 'off';
    const hex  = d.raw_hex || '—';

    // Store live colour for challenge
    _ws6ChColor = c1;

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
    const animEl = container.querySelector('#ws5-animation');
    if (animEl) animEl.textContent = anim;
    const hexEl = container.querySelector('#ws5-raw-hex');
    if (hexEl) hexEl.textContent = hex || '—';
  });

  // ── WS6 challenge: colour prediction ─────────────────────────────────────
  container.querySelectorAll('.ws6-colour-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (_ws6ChSubmitted) return;
      _ws6ChGuess = btn.getAttribute('data-colour');
      container.querySelectorAll('.ws6-colour-btn').forEach(b => {
        b.style.outline = b === btn ? '3px solid white' : 'none';
        b.style.transform = b === btn ? 'scale(1.1)' : '';
      });
      const sel = container.querySelector('#ws6-ch-selection');
      if (sel) sel.textContent = `Your guess: ${_ws6ChGuess}`;
    });
  });

  const submitBtn = container.querySelector('#ws6-ch-submit');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (_ws6ChSubmitted) return;
      if (!_ws6ChGuess) {
        const sel = container.querySelector('#ws6-ch-selection');
        if (sel) sel.textContent = 'Please select a colour first!';
        return;
      }
      _ws6ChSubmitted = true;
      const result = container.querySelector('#ws6-ch-result');
      if (result) {
        const live = _ws6ChColor || 'unknown';
        const guessLower = _ws6ChGuess.toLowerCase();
        const liveLower  = live.toLowerCase();
        const pass = guessLower === liveLower || liveLower.includes(guessLower) || guessLower.includes(liveLower);
        if (pass) {
          result.className = 'rounded-lg p-3 text-center font-bold text-base bg-success/20 text-success border border-success/40';
          result.textContent = `✓ Correct! Dashboard showed "${live}" and that matched your guess.`;
        } else {
          result.className = 'rounded-lg p-3 text-center font-bold text-sm bg-error/20 text-error border border-error/40';
          result.textContent = `✗ Not quite — you guessed "${_ws6ChGuess}" but dashboard shows "${live}". Turn around and check, then reset.`;
        }
        result.classList.remove('hidden');
      }
    });
  }

  const ws6Reset = container.querySelector('#ws6-ch-reset');
  if (ws6Reset) {
    ws6Reset.addEventListener('click', () => {
      _ws6ChGuess = null; _ws6ChSubmitted = false;
      const result = container.querySelector('#ws6-ch-result');
      if (result) result.classList.add('hidden');
      const sel = container.querySelector('#ws6-ch-selection');
      if (sel) sel.textContent = 'No guess selected';
      container.querySelectorAll('.ws6-colour-btn').forEach(b => {
        b.style.outline = 'none'; b.style.transform = '';
      });
    });
  }
}

function initLiveWs7(container) {
  _ws7ChPortDropped = false; _ws7ChRecovered = false; _ws7ChDroppedPort = null;
  const portModes = { 1: null, 2: null, 3: null, 4: null };
  const portColours = { 1: '#3b82f6', 2: '#8b5cf6', 3: '#f97316', 4: '#22c55e' };

  function updatePortDots(data) {
    [1, 2, 3, 4].forEach(n => {
      const port = getPort(data, n);
      const mode = port?.mode || 'inactive';
      const dot  = container.querySelector(`#ws7-ch-p${n}`);
      const val  = container.querySelector(`#ws7-ch-p${n}-val`);
      if (dot) {
        const active = mode === 'io-link';
        dot.style.backgroundColor = active ? portColours[n] : '';
        dot.style.boxShadow = active ? `0 0 6px ${portColours[n]}80` : '';
        dot.className = active
          ? 'w-5 h-5 rounded-full mx-auto transition-all'
          : 'w-5 h-5 rounded-full bg-base-300 mx-auto transition-all';
      }
      if (val) val.textContent = mode === 'io-link' ? 'IO-Link' : mode === 'inactive' ? 'off' : mode;

      // challenge logic
      const prevMode = portModes[n];
      if (prevMode !== null && prevMode === 'io-link' && mode !== 'io-link' && !_ws7ChPortDropped && !_ws7ChRecovered) {
        _ws7ChPortDropped = true;
        _ws7ChDroppedPort = n;
        const msg = container.querySelector('#ws7-ch-status-msg');
        if (msg) msg.textContent = `Port ${n} went offline — now reconnect it.`;
      }
      if (_ws7ChPortDropped && !_ws7ChRecovered && n === _ws7ChDroppedPort && prevMode !== 'io-link' && mode === 'io-link') {
        _ws7ChRecovered = true;
        const result = container.querySelector('#ws7-ch-result');
        if (result) {
          result.className = 'rounded-lg p-3 text-center font-bold text-base bg-success/20 text-success border border-success/40';
          result.textContent = `✓ Challenge complete! Port ${_ws7ChDroppedPort} dropped offline and came back to IO-Link mode.`;
          result.classList.remove('hidden');
        }
        const msg = container.querySelector('#ws7-ch-status-msg');
        if (msg) msg.textContent = `Port ${_ws7ChDroppedPort} recovered successfully.`;
      }
      portModes[n] = mode;
    });
  }

  startLiveData(data => {
    updatePortDots(data);
  });

  const ws7Reset = container.querySelector('#ws7-ch-reset');
  if (ws7Reset) {
    ws7Reset.addEventListener('click', () => {
      _ws7ChPortDropped = false; _ws7ChRecovered = false; _ws7ChDroppedPort = null;
      Object.keys(portModes).forEach(k => { portModes[k] = null; });
      const result = container.querySelector('#ws7-ch-result');
      if (result) result.classList.add('hidden');
      const msg = container.querySelector('#ws7-ch-status-msg');
      if (msg) msg.textContent = 'Waiting — disconnect a sensor cable to begin';
    });
  }
}

function initLiveWs8(container) {
  _ws8ChStep = 0; _ws8ChDone = false;
  let _ws8LastPhotoState = false;
  let _ws8LastCapState = false;

  function updateWs8Steps() {
    [1, 2, 3].forEach(i => {
      const dot = container.querySelector(`#ws8-ch-s${i}`);
      if (!dot) return;
      if (i <= _ws8ChStep) {
        dot.className = 'w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all bg-success border-success text-white mx-auto';
      } else {
        dot.className = 'w-10 h-10 rounded-full bg-base-300 border-2 border-base-300 flex items-center justify-center text-xs font-bold text-base-content/50 transition-all mx-auto';
      }
    });
  }

  startLiveData(data => {
    const p1 = getPort(data, 1);
    const p2 = getPort(data, 2);
    const p3 = getPort(data, 3);
    const det1  = p1?.pdin_decoded?.object_detected || false;
    const det2  = p2?.pdin_decoded?.object_detected || false;
    const temp3 = p3?.pdin_decoded?.temperature_c ?? null;

    if (!_ws8ChDone) {
      if (_ws8ChStep === 0 && det1 && !_ws8LastPhotoState) {
        _ws8ChStep = 1;
        updateWs8Steps();
      }
      if (_ws8ChStep === 1 && det2 && !_ws8LastCapState) {
        _ws8ChStep = 2;
        updateWs8Steps();
      }
      if (_ws8ChStep === 2 && temp3 !== null && temp3 > 15) {
        _ws8ChStep = 3;
        _ws8ChDone = true;
        updateWs8Steps();
        const result = container.querySelector('#ws8-ch-result');
        if (result) {
          result.className = 'rounded-lg p-3 text-center font-bold text-base bg-success/20 text-success border border-success/40';
          result.textContent = '✓ Assessment complete! All three steps completed in order. Well done!';
          result.classList.remove('hidden');
        }
      }
    }
    _ws8LastPhotoState = det1;
    _ws8LastCapState = det2;
  });

  const ws8Reset = container.querySelector('#ws8-ch-reset');
  if (ws8Reset) {
    ws8Reset.addEventListener('click', () => {
      _ws8ChStep = 0; _ws8ChDone = false;
      _ws8LastPhotoState = false; _ws8LastCapState = false;
      updateWs8Steps();
      const result = container.querySelector('#ws8-ch-result');
      if (result) result.classList.add('hidden');
    });
  }
}

function initWorksheetInteractivity(container) {
  if (!container) container = document.getElementById('worksheets-root');
  if (!container) return;

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
  else if (container.querySelector('#ws7-ch-p1'))         initLiveWs7(container);        // WS7 — fault finding
  else if (container.querySelector('#ws8-ch-s1'))         initLiveWs8(container);        // WS8 — assessment
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
