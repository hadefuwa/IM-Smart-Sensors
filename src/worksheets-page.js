/**
 * CP0001: Maintenance on Smart Sensors
 * 7 worksheets with embedded live sensor charts, indicators, sliders, and task progress.
 */

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
            <span class="kit-text"><strong>Port 1 — Photoelectric Sensor</strong> — the blue M18 barrel with a red LED on the face. Fires a light beam and detects when something gets in the way.</span></label>
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
          <text x="64"  y="37"  text-anchor="middle" fill="white" font-size="10" font-weight="600">Photoelectric</text>
          <text x="64"  y="49"  text-anchor="middle" fill="#bfdbfe" font-size="8">Port 1 · IO-Link</text>

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
            <p class="text-xs font-semibold text-base-content">Photoelectric</p>
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

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> Which sensor detects objects by firing a beam of light?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q2" value="a" class="radio radio-sm radio-primary"> The capacitive sensor on Port 2</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q2" value="b" class="radio radio-sm radio-primary"> The temperature sensor on Port 3</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws0-q2" value="c" class="radio radio-sm radio-primary"> The photoelectric sensor on Port 1</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> What can the capacitive sensor detect that the photoelectric sensor cannot?</p>
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
        <p class="text-sm text-base-content/80">Trigger the photoelectric sensor with your hand — but <strong>do not</strong> trigger the capacitive sensor. If the capacitive detects anything at all, you fail and must reset.</p>
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 text-center space-y-1">
            <p class="text-xs text-base-content/50 font-medium uppercase tracking-wide">Port 1 · Photoelectric</p>
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
      <p class="text-base-content/90 leading-relaxed text-base">A normal sensor gives you one thing — on or off. A smart sensor uses the same cable but tells you a lot more. Here's the difference.</p>

      <div class="rounded-xl border-2 border-base-300 bg-base-200 p-4 mt-4 space-y-2">
        <p class="font-bold text-base-content">🔌 Normal Sensor</p>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80 ml-2">
          <li>Output: ON or OFF — that's it</li>
          <li>If it stops working, you have no idea why</li>
          <li>You have to test it manually to find the fault</li>
        </ul>
      </div>

      <div class="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 mt-3 space-y-2">
        <p class="font-bold text-base-content">💡 IO-Link Smart Sensor — same cable, more information</p>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80 ml-2">
          <li>What it is measuring right now — temperature in °C, object detected yes/no, distance</li>
          <li>Fault codes — for example "lens dirty" or "wire break"</li>
          <li>Its own model number and serial number</li>
          <li>Settings you can change remotely without touching the sensor</li>
        </ul>
      </div>

      <div class="rounded-xl border-2 border-info/30 bg-info/5 p-4 mt-3">
        <p class="font-bold text-base-content mb-1">📦 Same Cable — No Extra Wiring</p>
        <p class="text-sm text-base-content/80">IO-Link uses the standard 3-wire sensor cable. The master (AL1350) and the sensor automatically agree to talk IO-Link — you do not need a special cable or extra wiring. Same connector you already know, all the extra data.</p>
      </div>

      <!-- WS2 SVG diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">How it works</p>
        <svg viewBox="0 0 570 185" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <!-- Left: Normal Sensor -->
          <rect x="2" y="20" width="120" height="40" rx="5" fill="#6b7280"/>
          <text x="62" y="37" text-anchor="middle" fill="white" font-size="11" font-weight="600">Normal Sensor</text>
          <text x="62" y="52" text-anchor="middle" fill="#d1d5db" font-size="8">standard output</text>
          <!-- 3-wire line -->
          <line x1="122" y1="40" x2="175" y2="40" stroke="#94a3b8" stroke-width="2"/>
          <text x="148" y="34" text-anchor="middle" fill="#94a3b8" font-size="8">3-wire</text>
          <!-- Single output box -->
          <rect x="175" y="20" width="80" height="40" rx="5" fill="#374151"/>
          <text x="215" y="37" text-anchor="middle" fill="white" font-size="10" font-weight="600">ON / OFF</text>
          <text x="215" y="51" text-anchor="middle" fill="#9ca3af" font-size="8">one signal only</text>

          <!-- Right: IO-Link Sensor -->
          <rect x="310" y="20" width="120" height="40" rx="5" fill="#2563eb"/>
          <text x="370" y="37" text-anchor="middle" fill="white" font-size="11" font-weight="600">IO-Link Sensor</text>
          <text x="370" y="52" text-anchor="middle" fill="#bfdbfe" font-size="8">smart output</text>
          <!-- 3-wire line -->
          <line x1="430" y1="40" x2="475" y2="40" stroke="#94a3b8" stroke-width="2"/>
          <text x="452" y="34" text-anchor="middle" fill="#94a3b8" font-size="8">3-wire</text>
          <!-- 4 stacked data boxes -->
          <rect x="475" y="10" width="90" height="18" rx="3" fill="#16a34a"/>
          <text x="520" y="23" text-anchor="middle" fill="white" font-size="9">Object: detected</text>
          <rect x="475" y="31" width="90" height="18" rx="3" fill="#d97706"/>
          <text x="520" y="44" text-anchor="middle" fill="white" font-size="9">Fault: none</text>
          <rect x="475" y="52" width="90" height="18" rx="3" fill="#2563eb"/>
          <text x="520" y="65" text-anchor="middle" fill="white" font-size="9">Model: TV7105</text>
          <rect x="475" y="73" width="90" height="18" rx="3" fill="#7c3aed"/>
          <text x="520" y="86" text-anchor="middle" fill="white" font-size="9">SP1: 40°C</text>

          <!-- Centre label -->
          <text x="285" y="108" text-anchor="middle" fill="#f59e0b" font-size="9" font-weight="700">Same 3-wire cable</text>
          <line x1="200" y1="112" x2="265" y2="112" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,2"/>
          <line x1="305" y1="112" x2="370" y2="112" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,2"/>

          <!-- Bottom label -->
          <text x="285" y="140" text-anchor="middle" fill="#64748b" font-size="8">IO-Link layers live data, fault codes, identity and settings on top of the existing signal</text>
        </svg>
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

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> A sensor stops switching and you don't know why. What extra information might an IO-Link sensor show you that a normal sensor can't?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q1" value="a" class="radio radio-sm radio-primary"> Nothing — IO-Link sensors behave exactly the same as normal sensors when faulty</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q1" value="b" class="radio radio-sm radio-primary"> A fault code such as "lens dirty" or "wire break" — telling you exactly what to fix</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q1" value="c" class="radio radio-sm radio-primary"> The name of the person who installed it</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> IO-Link uses:</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q2" value="a" class="radio radio-sm radio-primary"> A completely different cable and connector from a standard sensor</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q2" value="b" class="radio radio-sm radio-primary"> The same 3-wire cable — the master and sensor agree to talk IO-Link automatically</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q2" value="c" class="radio radio-sm radio-primary"> An ethernet cable with a special connector</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> Go to the Dashboard. How many ports does the IO-Link Master have?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q3" value="a" class="radio radio-sm radio-primary"> 4 ports</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q3" value="b" class="radio radio-sm radio-primary"> 8 ports</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q3" value="c" class="radio radio-sm radio-primary"> 16 ports</label>
      </div>

      <div class="divider my-2"></div>

      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3" id="ws2-challenge-box">
        <p class="font-bold text-base-content text-base">🔧 Maintenance Scenario — Pre-Shift Health Check</p>
        <div class="rounded-lg bg-base-300/50 p-3 text-sm text-base-content/80 border border-base-300">
          <p><strong>Job ticket:</strong> You are starting your shift. Before anything else, verify that all 4 IO-Link sensors are online and communicating. A trainee says "everything is fine" — but has not checked the dashboard.</p>
          <p class="mt-1 text-xs text-base-content/60">Use the live panel above. Each dot should be lit when the sensor is in IO-Link mode. The challenge passes when all 4 ports are confirmed active.</p>
        </div>
        <div id="ws2-ch-result" class="hidden rounded-lg p-3 text-center font-bold text-sm"></div>
        <div class="flex justify-center">
          <button type="button" id="ws2-ch-reset" class="btn btn-warning btn-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Reset Check
          </button>
        </div>
      </div>
    `
  },
  {
    id: 3,
    title: 'The Photoelectric Sensor',
    shortDesc: 'Detecting objects with light — Port 1.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'Photoelectric sensors are everywhere on production lines. Knowing what they detect, what their LED means, and what "lens dirty" actually looks like will save you a lot of time.',
    relatedDashboard: 'Dashboard: Port 1 — Photoelectric',
    prerequisites: 'Complete Worksheet 1 first',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">A photoelectric sensor fires a beam of light and checks whether it bounces back. If something is in the way, the output switches on.</p>

      <!-- M-size explainer -->
      <div class="rounded-lg border border-base-300 bg-base-200 p-3 mt-3 text-sm">
        <p class="font-bold text-base-content mb-1">📏 What does M18 mean?</p>
        <p class="text-base-content/80">The <strong>M number</strong> is the diameter of the sensor body in millimetres — like a bolt size. <strong>M18</strong> = 18 mm across. You'll see M8, M12, M18, and M30 in industry. Bigger number = bigger sensor. Both the photoelectric and capacitive on this kit are M18 — same diameter, but different shapes.</p>
      </div>

      <!-- WS3 SVG diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">How it works</p>
        <svg viewBox="0 0 570 175" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <!-- Sensor body -->
          <rect x="10" y="55" width="90" height="65" rx="8" fill="#1e3a5f"/>
          <circle cx="100" cy="87" r="8" fill="#ef4444" opacity="0.9"/>
          <text x="55" y="82" text-anchor="middle" fill="white" font-size="10" font-weight="600">Photoelectric</text>
          <text x="55" y="96" text-anchor="middle" fill="#93c5fd" font-size="8">M18 sensor</text>
          <text x="55" y="132" text-anchor="middle" fill="#94a3b8" font-size="8">Emitter / Receiver</text>

          <!-- Light beam (dashed red line) -->
          <line x1="108" y1="87" x2="330" y2="87" stroke="#ef4444" stroke-width="2" stroke-dasharray="8,4"/>
          <text x="220" y="78" text-anchor="middle" fill="#ef4444" font-size="9" font-weight="600">light beam</text>

          <!-- Object blocking beam -->
          <rect x="330" y="55" width="60" height="65" rx="5" fill="#6b7280"/>
          <text x="360" y="84" text-anchor="middle" fill="white" font-size="10" font-weight="600">Object</text>
          <text x="360" y="98" text-anchor="middle" fill="#d1d5db" font-size="8">(blocks beam)</text>

          <!-- Arrow showing beam is blocked -->
          <line x1="295" y1="87" x2="328" y2="87" stroke="#ef4444" stroke-width="2" stroke-dasharray="8,4"/>
          <line x1="390" y1="87" x2="430" y2="87" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.4"/>

          <!-- Output box -->
          <rect x="450" y="65" width="110" height="45" rx="5" fill="#16a34a"/>
          <text x="505" y="85" text-anchor="middle" fill="white" font-size="11" font-weight="700">OUTPUT: ON</text>
          <circle cx="480" cy="96" r="5" fill="#86efac"/>
          <text x="505" y="102" text-anchor="middle" fill="#bbf7d0" font-size="8">beam blocked</text>

          <!-- Bottom note -->
          <text x="285" y="155" text-anchor="middle" fill="#64748b" font-size="8">Beam blocked → output switches ON. No beam → output OFF.</text>
        </svg>
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
            <p id="ws2-quality-label" class="text-xs text-base-content/60 mt-0.5">Signal quality: —</p>
          </div>
        </div>
        <div class="space-y-1">
          <p class="text-xs text-base-content/60 font-medium uppercase tracking-wide">Detection waveform (last 60 samples)</p>
          <div style="height:80px; position:relative;"><canvas id="ws2-chart"></canvas></div>
        </div>
        <div class="space-y-1">
          <p class="text-xs text-base-content/60 font-medium uppercase tracking-wide">Signal quality %</p>
          <div style="height:60px; position:relative;"><canvas id="ws2-sig-chart"></canvas></div>
        </div>
      </div>

      <!-- Task: wave 5 times -->
      <div class="rounded-lg border border-success/30 bg-success/5 p-3 mt-3" id="ws2-task-box">
        <p class="font-semibold text-base-content text-sm mb-2">🎯 Task: wave your hand in front of the sensor 5 times</p>
        <div class="flex items-center gap-3">
          <progress id="ws2-wave-progress" class="progress progress-success w-full" value="0" max="5"></progress>
          <span id="ws2-wave-count" class="text-sm font-mono font-bold text-base-content whitespace-nowrap">0 / 5</span>
        </div>
        <p id="ws2-task-done" class="hidden text-success text-sm font-bold mt-1">✓ Task complete!</p>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> Wave your hand in front of the sensor and watch the waveform above. What does the chart do when an object is detected?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q1" value="a" class="radio radio-sm radio-primary"> The line jumps from 0 to 1, then drops back to 0 when your hand moves away</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q1" value="b" class="radio radio-sm radio-primary"> The line stays flat at 0 the whole time</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q1" value="c" class="radio radio-sm radio-primary"> The line drops below zero when something is detected</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> The sensor output is always ON even when nothing is in front of it. What is the most likely cause?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q2" value="a" class="radio radio-sm radio-primary"> The sensor is working perfectly</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q2" value="b" class="radio radio-sm radio-primary"> The lens may be dirty, or a background object is reflecting the beam</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q2" value="c" class="radio radio-sm radio-primary"> The cable is broken</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> Hold your hand very close to the sensor face, then slowly move it 30 cm away. What happens to the signal quality reading?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q3" value="a" class="radio radio-sm radio-primary"> Signal quality stays constant regardless of distance</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q3" value="b" class="radio radio-sm radio-primary"> Signal quality keeps increasing the further away you go</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q3" value="c" class="radio radio-sm radio-primary"> Signal quality is highest at the ideal sensing distance — too close or too far reduces it</label>
      </div>

      <div class="divider my-2"></div>

      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3" id="ws3-challenge-box">
        <p class="font-bold text-base-content text-base">🔧 Maintenance Scenario — Signal Quality Audit</p>
        <div class="rounded-lg bg-base-300/50 p-3 text-sm text-base-content/80 border border-base-300">
          <p><strong>Job ticket:</strong> Port 1 has been flagged for intermittent misses on the production line. Run a signal quality audit using IO-Link diagnostics to determine whether the sensor is healthy, marginal, or needs repositioning.</p>
          <p class="mt-2 text-xs text-base-content/60 font-semibold uppercase tracking-wide">IO-Link rule:</p>
          <div class="flex gap-2 mt-1 flex-wrap">
            <span class="badge badge-sm bg-success/20 text-success border-success/40">&gt;80% — Healthy</span>
            <span class="badge badge-sm bg-warning/20 text-warning border-warning/40">50–80% — Marginal</span>
            <span class="badge badge-sm bg-error/20 text-error border-error/40">&lt;50% — Clean / Reposition</span>
          </div>
          <p class="mt-2 text-xs text-base-content/60">Adjust the sensor position or clean the lens until signal quality reaches <strong>&gt;80%</strong>. The audit passes when a healthy reading is confirmed.</p>
        </div>
        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs text-base-content/60">
            <span class="font-semibold uppercase tracking-wide">Signal Quality</span>
            <span id="ws3-ch-sq-pct" class="font-mono font-bold">—</span>
          </div>
          <div class="w-full bg-base-300 rounded-full h-5 overflow-hidden">
            <div id="ws3-ch-sq-bar" class="h-5 rounded-full transition-all duration-300 bg-error" style="width:0%"></div>
          </div>
          <div class="flex justify-between text-xs text-base-content/40 px-0.5">
            <span>0%</span><span>50%</span><span>80%</span><span>100%</span>
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
          <p class="font-bold text-base-content">🔦 Scenario A — Port 1 (Photoelectric)</p>
          <p class="text-sm text-base-content/80">Dashboard shows <strong>Lens contamination warning</strong>. Output is stuck ON even when the conveyor is empty.</p>
          <p class="font-medium text-sm text-base-content mt-2">What do you do first?</p>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws6-a" value="a" class="radio radio-xs radio-primary"> Replace the sensor immediately</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws6-a" value="b" class="radio radio-xs radio-primary"> Clean the lens — if it keeps happening, check for reflective surfaces behind the detection zone</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws6-a" value="c" class="radio radio-xs radio-primary"> Adjust the setpoint higher</label>
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
          <text x="47"  y="33"  text-anchor="middle" fill="white" font-size="9" font-weight="600">Photoelectric P1</text>
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
          <p class="font-bold text-base-content">🔦 Section 1 — Photoelectric Sensor (Port 1)</p>
          <label class="kit-item flex items-start gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0 mt-0.5">
            <span>Wave your hand in front of the sensor and confirm the output dot changes on the Dashboard.</span>
          </label>
          <label class="kit-item flex items-start gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-success flex-shrink-0 mt-0.5">
            <span>The waveform on the Photoelectric worksheet jumped from 0 to 1 when you triggered it.</span>
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
        <p class="text-sm text-base-content/80">Complete the sequence <strong>in order</strong>: first trigger the photoelectric sensor, then trigger the capacitive sensor, then check the temperature is above 15°C. All three must happen in order.</p>
        <div class="flex justify-center gap-6 py-2">
          <div class="text-center space-y-1">
            <div id="ws8-ch-s1" class="w-10 h-10 rounded-full bg-base-300 border-2 border-base-300 flex items-center justify-center text-xs font-bold text-base-content/50 transition-all mx-auto">1</div>
            <p class="text-xs text-base-content/60">Photoelectric<br>triggered</p>
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
      <footer class="pt-4 border-t-2 border-base-300">
        <a href="#" data-page="io-link-master" class="btn btn-outline btn-sm gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Dashboard
        </a>
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

let _tempBaseline = null;
let _alarmThreshold = 40;

// WS2 (smart sensor) challenge
let _ws2ChDone = false;

// WS3 (photoelectric) challenge — signal quality audit
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

    const det1  = p1?.pdin_decoded?.object_detected;
    const temp3 = p3?.pdin_decoded?.temperature_c;
    const c4    = p4?.pdin_decoded?.color1;
    const cnt2  = p2?.detection_counter ?? 0;

    const det2 = p2?.pdin_decoded?.object_detected;

    setPortCard('intro-p1-dot', 'intro-p1-val', p1Active,
      p1Active ? (det1 ? 'Detected ●' : 'No object ○') : 'Inactive', colours.photo);
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

      if (capRaw > 0) {
        _chFailed = true;
        chResult.className = 'rounded-lg p-3 text-center font-bold text-sm bg-error/20 text-error border border-error/40';
        chResult.textContent = `✗ Failed — capacitive level hit ${capRaw}. Reset and try again.`;
        chResult.classList.remove('hidden');
      } else if (det1) {
        _chSucceeded = true;
        chResult.className = 'rounded-lg p-3 text-center font-bold text-base bg-success/20 text-success border border-success/40';
        chResult.textContent = '✓ Challenge complete! Photoelectric triggered, capacitive clean.';
        chResult.classList.remove('hidden');
        chP1dot.style.backgroundColor = '#22c55e';
        chP1dot.style.boxShadow = '0 0 12px #22c55e80';
      }
    }
  });

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

function initLiveWs2Smart(container) {
  _ws2ChDone = false;
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

    const det1  = p1?.pdin_decoded?.object_detected;
    const det2  = p2?.pdin_decoded?.object_detected;
    const temp3 = p3?.pdin_decoded?.temperature_c;
    const c4    = p4?.pdin_decoded?.color1;

    setSmallDot('ws2-ch-p1', 'ws2-ch-p1-val', !!det1, det1 ? 'Detected' : 'Clear', colours.photo);
    setSmallDot('ws2-ch-p2', 'ws2-ch-p2-val', !!det2, det2 ? 'Detected' : 'Clear', colours.cap);
    setSmallDot('ws2-ch-p3', 'ws2-ch-p3-val', p3?.mode === 'io-link',
      temp3 != null ? `${temp3.toFixed(1)}°C` : '—', colours.temp);
    setSmallDot('ws2-ch-p4', 'ws2-ch-p4-val', p4?.mode === 'io-link',
      c4 || '—', colours.led);

    // pass when all 4 ports confirmed in io-link mode
    const allOnline = [p1, p2, p3, p4].every(p => p?.mode === 'io-link');
    if (!_ws2ChDone && allOnline) {
      _ws2ChDone = true;
      const result = container.querySelector('#ws2-ch-result');
      if (result) {
        result.className = 'rounded-lg p-3 text-center font-bold text-base bg-success/20 text-success border border-success/40';
        result.textContent = '✓ Health check passed — all 4 ports confirmed active in IO-Link mode. System ready for production.';
        result.classList.remove('hidden');
      }
    }
  });

  const resetBtn = container.querySelector('#ws2-ch-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      _ws2ChDone = false;
      const result = container.querySelector('#ws2-ch-result');
      if (result) result.classList.add('hidden');
    });
  }
}

function initLiveWs2(container) {
  _lastPhotoState = false;
  _photoWaveCount = 0;
  _ws3ChDone = false;

  const chart = makeChart('ws2-chart', 'line',
    [{ data: Array(60).fill(0), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)',
       fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 }], -0.1, 1.2, '');
  const sigChart = makeChart('ws2-sig-chart', 'line',
    [{ data: Array(60).fill(null), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)',
       fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 }], 0, 100, '%');

  startLiveData(data => {
    const port = getPort(data, 1);
    setLiveStatus('ws2-live-badge', !!port);
    if (!port || !port.pdin_decoded) return;

    const det = port.pdin_decoded.object_detected || false;
    const sq  = port.pdin_decoded.signal_quality_percent ?? null;

    // dot
    const dot = container.querySelector('#ws2-dot');
    if (dot) {
      dot.className = det
        ? 'w-8 h-8 rounded-full border-2 shadow-md transition-all duration-150 bg-success border-success shadow-success/40'
        : 'w-8 h-8 rounded-full border-2 shadow-md transition-all duration-150 bg-base-300 border-base-300';
    }
    const lbl = container.querySelector('#ws2-state-label');
    if (lbl) lbl.textContent = det ? 'Object detected' : 'No object';
    const qLbl = container.querySelector('#ws2-quality-label');
    if (qLbl) qLbl.textContent = sq !== null ? `Signal quality: ${sq}%` : 'Signal quality: —';

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

    // ── WS3 challenge: signal quality audit ─────────────────────────────────
    if (sq !== null) {
      const sqBar = container.querySelector('#ws3-ch-sq-bar');
      const sqPct = container.querySelector('#ws3-ch-sq-pct');
      if (sqPct) sqPct.textContent = `${sq}%`;
      if (sqBar) {
        sqBar.style.width = `${sq}%`;
        sqBar.className = sq >= 80
          ? 'h-5 rounded-full transition-all duration-300 bg-success'
          : sq >= 50
            ? 'h-5 rounded-full transition-all duration-300 bg-warning'
            : 'h-5 rounded-full transition-all duration-300 bg-error';
      }
      if (!_ws3ChDone && sq >= 80) {
        _ws3ChDone = true;
        const ws3Result = container.querySelector('#ws3-ch-result');
        if (ws3Result) {
          ws3Result.className = 'rounded-lg p-3 text-center font-bold text-base bg-success/20 text-success border border-success/40';
          ws3Result.textContent = `✓ Audit complete — signal quality ${sq}% (healthy). Sensor confirmed serviceable. Log it and move on.`;
          ws3Result.classList.remove('hidden');
        }
      }
    }

    pushToChart(chart, det ? 1 : 0);
    if (sq !== null) pushToChart(sigChart, sq);
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
  stopLiveData();
  currentWorksheetIndex = 0;
  const root = document.getElementById('worksheets-root');
  if (root) root.innerHTML = buildIndexHtml();
  scrollToTop();
}

function showWorksheet(n) {
  if (n < 1 || n > TOTAL) return;
  stopLiveData();
  currentWorksheetIndex = n;
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
