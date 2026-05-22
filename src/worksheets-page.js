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
      <p class="text-base-content/90 leading-relaxed text-base">Welcome to <strong class="text-base-content">CP0001 — Maintenance on Smart Sensors</strong>. In front of you is a real industrial sensor kit used in factories to monitor machines and spot faults automatically. Your job is to learn how to use it, read it, and fix it.</p>

      <div class="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content">🔍 Find each item on the bench — tick it when you can see it:</p>
        <div class="space-y-2 text-sm">
          <label class="flex items-start gap-3 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm checkbox-primary mt-0.5 flex-shrink-0">
            <span><strong class="text-base-content">IO-Link Master (IFM AL1350)</strong> — the orange box with numbered ports along the side. This is the hub. Everything else plugs into it.</span></label>
          <label class="flex items-start gap-3 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm checkbox-primary mt-0.5 flex-shrink-0">
            <span><strong class="text-base-content">Port 1 — Photoelectric Sensor (Contrinex LTR-M18PA-PMS-603, M18)</strong> — blue barrel sensor pointing outward, red LED on the face. It detects objects between 3 mm and 1200 mm away by bouncing its own light beam off the target — no reflector needed. IP67 rated (dust-tight and waterproof), so it survives a factory floor. This sensor uses IO-Link 1.0, which means it sends live detection data over IO-Link but sensitivity must be adjusted using the physical potentiometer on the sensor body — remote parameter configuration is not supported by this device.</span></label>
          <label class="flex items-start gap-3 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm checkbox-primary mt-0.5 flex-shrink-0">
            <span><strong class="text-base-content">Port 2 — Capacitive Sensor</strong> — usually a short cylinder. Detects materials (liquid, powder, plastic) without needing to touch them.</span></label>
          <label class="flex items-start gap-3 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm checkbox-primary mt-0.5 flex-shrink-0">
            <span><strong class="text-base-content">Port 3 — Temperature Sensor (IFM TV7105)</strong> — sends back a live temperature in °C. Not just an alarm — an actual number.</span></label>
          <label class="flex items-start gap-3 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm checkbox-primary mt-0.5 flex-shrink-0">
            <span><strong class="text-base-content">Port 4 — Light Stack (IFM CL50)</strong> — the tall tower with coloured segments. Shows machine status at a glance from across the factory.</span></label>
          <label class="flex items-start gap-3 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm checkbox-primary mt-0.5 flex-shrink-0">
            <span><strong class="text-base-content">Raspberry Pi</strong> — small green circuit board, usually in a case nearby. Runs the software that talks to the IO-Link master and shows this dashboard.</span></label>
          <label class="flex items-start gap-3 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm checkbox-primary mt-0.5 flex-shrink-0">
            <span><strong class="text-base-content">This screen</strong> — showing the live HMI dashboard. Everything the sensors say ends up here.</span></label>
        </div>
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

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> Look at the live panel above. How many sensors are currently showing as active (coloured dots, not grey)?</p>
      <textarea class="textarea textarea-bordered w-full" rows="1" placeholder="Your answer..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> Put your hand in front of the photoelectric sensor. Which port card changes in the panel above, and how?</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> What temperature is the sensor reading right now? Is that about what you'd expect for a room?</p>
      <textarea class="textarea textarea-bordered w-full" rows="1" placeholder="Your answer..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>Q4.</strong> In your own words — what's the difference between this system and a set of normal sensors wired to a light or a buzzer?</p>
      <textarea class="textarea textarea-bordered w-full" rows="3" placeholder="Your answer..."></textarea>
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
      <p class="text-base-content/90 leading-relaxed">A normal sensor gives you one signal: <strong>on</strong> or <strong>off</strong>. That's it. If it stops working, you have no idea why.</p>
      <p class="text-base-content/90 leading-relaxed mt-2">A <strong class="text-base-content">smart sensor</strong> (IO-Link sensor) uses the same 3-wire cable but it can also send back:</p>
      <ul class="list-disc list-inside space-y-1 text-base-content/90 ml-2 mt-1">
        <li>What it's measuring right now (temperature, distance, object detected, etc.)</li>
        <li>Whether it has a fault — and what kind</li>
        <li>Its own serial number and model</li>
        <li>Settings you can change remotely</li>
      </ul>
      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> A normal sensor stops switching. You can't tell why. With an IO-Link sensor in the same situation, what extra information might you see?</p>
      <textarea class="textarea textarea-bordered w-full" rows="3" placeholder="Your answer..."></textarea>
      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> IO-Link uses:</p>
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q2" value="a" class="radio radio-sm radio-primary"> A completely different cable and connector from a standard sensor</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q2" value="b" class="radio radio-sm radio-primary"> The same 3-wire cable — the master and sensor agree to talk IO-Link automatically</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q2" value="c" class="radio radio-sm radio-primary"> An ethernet cable</label>
      </div>
      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> Look at the Dashboard. How many ports does the IO-Link master have, and what colour are the port cards?</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>
      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="ws1-suggested">Show suggested answers</button>
      <div id="ws1-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: You might see a fault code like "wire break" or "lens dirty" — telling you exactly what to fix instead of guessing. Q2: b — same cable, auto-negotiation. Q3: The AL1350 has 8 ports; connected ports show green, disconnected show grey/red depending on state.</div>
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

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> Watch the waveform above. Wave your hand in front of the sensor — describe what the chart does when an object is detected.</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> What does it mean if the sensor's output is always ON, even when nothing is in front of it?</p>
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q2" value="a" class="radio radio-sm radio-primary"> The sensor is working perfectly</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q2" value="b" class="radio radio-sm radio-primary"> The lens may be dirty, or there's a background object reflecting the beam</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws2-q2" value="c" class="radio radio-sm radio-primary"> The cable is broken</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> Look at the signal quality chart above. What happens to signal quality when you hold your hand very close versus 30 cm away? Write your observation.</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="What you see..."></textarea>

      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="ws2-suggested">Show suggested answers</button>
      <div id="ws2-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: The waveform jumps from 0 to 1 when detected, then back to 0 — like a square pulse. Q2: b — dirty lens or background reflection. Q3: Signal quality is highest at the optimal sensing distance; too close or too far reduces it.</div>
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

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> Watch the counter above as you touch the sensor. What triggers a new count — the moment you touch, or continuously while touching?</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> Name two materials a capacitive sensor can detect that a photoelectric sensor cannot.</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> The capacitive sensor output is always ON even when nothing is near it. What's the most likely cause?</p>
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q3" value="a" class="radio radio-sm radio-secondary"> Sensitivity too high — detecting the container wall or nearby objects</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q3" value="b" class="radio radio-sm radio-secondary"> The sensor needs replacing immediately</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q3" value="c" class="radio radio-sm radio-secondary"> The cable is the wrong colour</label>
      </div>

      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="ws3-suggested">Show suggested answers</button>
      <div id="ws3-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: A new count triggers on the rising edge — the moment detection goes from 0→1. Holding your hand on it counts as one detection, not continuous. Q2: Water/liquid, powder, granules, plastic, cardboard — anything with a different dielectric constant from air. Q3: a — reduce sensitivity so it only reacts to the material, not the vessel wall.</div>
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

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> A standard temperature switch gives you one output — too hot = trip. What can you do with an IO-Link temperature sensor that you can't do with a switch?</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> Move the threshold slider so it's just above the current temperature, then hold the sensor for 30 seconds. Describe what happens to the alarm state indicator.</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="What you see..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> The temperature reading suddenly drops to −40 °C in a room-temperature lab. What's the most likely cause?</p>
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q3" value="a" class="radio radio-sm radio-warning"> The lab is very cold</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q3" value="b" class="radio radio-sm radio-warning"> Broken or disconnected sensor — −40 °C is a common default/error value for temperature sensors</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q3" value="c" class="radio radio-sm radio-warning"> The setpoint has been changed</label>
      </div>

      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="ws4-suggested">Show suggested answers</button>
      <div id="ws4-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: See the actual live temperature, trend it over time, get early warning before the trip point is reached. Q2: Once the live temperature crosses your slider threshold, the alarm state should turn red and say "ABOVE THRESHOLD". Q3: b — sudden jump to −40 °C usually means a disconnected or failed probe.</div>
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

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> Look at the live display above. What colour(s) and animation state is the CL50 currently showing? What would that mean on a real machine?</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> The light stack shows flashing red. What should a maintenance technician do first?</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> Why is it useful that IO-Link tells you which segment is on and whether it's flashing or solid — rather than just triggering a "light is on" alarm?</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>

      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="ws5-suggested">Show suggested answers</button>
      <div id="ws5-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: Depends on current machine state — describe what you see. Q2: Check the machine's fault log or HMI for the cause — don't just reset without knowing why. Q3: Precise state information can be logged and used to diagnose intermittent faults — e.g. knowing it flashed amber 3 times before going red is a clue you'd miss with a simple alarm.</div>
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
      <p class="text-base-content/90 leading-relaxed">For each scenario, write what you would do — then check your answer.</p>
      <div class="space-y-4 mt-2">
        <div class="rounded-lg border border-base-300 bg-base-200 p-4">
          <p class="font-semibold text-base-content">Scenario A — Port 1 (Photoelectric)</p>
          <p class="text-base-content/80 text-sm mt-1">Dashboard shows <strong>Lens contamination warning</strong>. Output stuck ON even when the conveyor is empty.</p>
          <textarea class="textarea textarea-bordered w-full textarea-sm mt-2" rows="2" placeholder="What do you do?"></textarea>
        </div>
        <div class="rounded-lg border border-base-300 bg-base-200 p-4">
          <p class="font-semibold text-base-content">Scenario B — Port 2 (Capacitive)</p>
          <p class="text-base-content/80 text-sm mt-1">Sensor replaced. Output permanently ON even though the tank is empty.</p>
          <textarea class="textarea textarea-bordered w-full textarea-sm mt-2" rows="2" placeholder="What do you do?"></textarea>
        </div>
        <div class="rounded-lg border border-base-300 bg-base-200 p-4">
          <p class="font-semibold text-base-content">Scenario C — Port 3 (Temperature)</p>
          <p class="text-base-content/80 text-sm mt-1">Temperature reading suddenly shows −40 °C in a room-temperature lab.</p>
          <p class="mt-2 font-medium text-sm">Most likely fault?</p>
          <div class="space-y-2 mt-1">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws6-c" value="a" class="radio radio-xs radio-primary"> The lab is too cold</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws6-c" value="b" class="radio radio-xs radio-primary"> Broken/disconnected sensor — −40 °C is a common error default value</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="ws6-c" value="c" class="radio radio-xs radio-primary"> Setpoint changed</label>
          </div>
        </div>
        <div class="rounded-lg border border-base-300 bg-base-200 p-4">
          <p class="font-semibold text-base-content">Scenario D — Port 4 (Light Stack)</p>
          <p class="text-base-content/80 text-sm mt-1">Red segment won't turn off even after operator says the fault was cleared. Two possible causes?</p>
          <textarea class="textarea textarea-bordered w-full textarea-sm mt-2" rows="2" placeholder="Your answer..."></textarea>
        </div>
      </div>
      <div class="alert bg-primary/10 border border-primary/30 rounded-lg text-base-content mt-4">
        <strong>Try it:</strong> Go to <a href="#" data-page="io-link-master" data-scroll="simulate-fault" class="link link-primary">Simulate Fault</a>. Inject a fault on each port. Look at Active Port Details — what does the fault look like for each sensor type?
      </div>
      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="ws6-suggested">Show suggested answers</button>
      <div id="ws6-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">A: Clean the lens. If it recurs, check for reflective surfaces behind the detection zone. B: Reduce sensitivity — the new sensor is detecting the container wall. C: b — sudden −40 °C jump = disconnected/failed probe. D: (1) Fault not actually cleared in the controller; (2) PLC still sending "red on" command because it hasn't received a clear signal.</div>
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
      <p class="text-base-content/90 leading-relaxed font-medium">Tick each task when complete. Write your observations in the boxes.</p>
      <div class="space-y-4 mt-3">
        <div class="rounded-lg border-2 border-primary/20 bg-base-200 p-4 space-y-2">
          <p class="font-bold text-base-content">Section 1 — Photoelectric Sensor (Port 1)</p>
          <label class="flex items-start gap-2 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm mt-0.5"> Trigger the sensor. Confirm output changes on the Dashboard.</label>
          <label class="flex items-start gap-2 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm mt-0.5"> Describe the current output:</label>
          <textarea class="textarea textarea-bordered textarea-sm w-full" rows="1" placeholder="Your observation..."></textarea>
        </div>
        <div class="rounded-lg border-2 border-secondary/20 bg-base-200 p-4 space-y-2">
          <p class="font-bold text-base-content">Section 2 — Capacitive Sensor (Port 2)</p>
          <label class="flex items-start gap-2 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm mt-0.5"> Touch the sensor face and confirm the detection count increments.</label>
          <label class="flex items-start gap-2 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm mt-0.5"> Current detection count:</label>
          <textarea class="textarea textarea-bordered textarea-sm w-full" rows="1" placeholder="Your observation..."></textarea>
        </div>
        <div class="rounded-lg border-2 border-warning/20 bg-base-200 p-4 space-y-2">
          <p class="font-bold text-base-content">Section 3 — Temperature Sensor (Port 3)</p>
          <label class="flex items-start gap-2 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm mt-0.5"> Read the current temperature.</label>
          <textarea class="textarea textarea-bordered textarea-sm w-full" rows="1" placeholder="Temperature reading..."></textarea>
          <label class="flex items-start gap-2 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm mt-0.5"> Hold the sensor for 30 s. Confirm value rises on the chart.</label>
        </div>
        <div class="rounded-lg border-2 border-accent/20 bg-base-200 p-4 space-y-2">
          <p class="font-bold text-base-content">Section 4 — Light Stack (Port 4)</p>
          <label class="flex items-start gap-2 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm mt-0.5"> Read current CL50 state. Which segments are active?</label>
          <textarea class="textarea textarea-bordered textarea-sm w-full" rows="1" placeholder="Your observation..."></textarea>
        </div>
        <div class="rounded-lg border-2 border-error/20 bg-base-200 p-4 space-y-2">
          <p class="font-bold text-base-content">Section 5 — Fault Finding</p>
          <label class="flex items-start gap-2 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm mt-0.5"> Simulate a fault. Write the fault code and your action.</label>
          <textarea class="textarea textarea-bordered textarea-sm w-full" rows="2" placeholder="Port, fault code, action..."></textarea>
          <label class="flex items-start gap-2 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm mt-0.5"> Clear the fault. Confirm port returns to normal.</label>
        </div>
      </div>
      <div class="alert bg-primary/10 border border-primary/30 rounded-lg text-base-content mt-4">
        <a href="#" data-page="io-link-master" class="link link-primary font-bold">IO-Link Master Dashboard</a> — Simulate Fault and Active Port Details.
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
      <header class="relative rounded-2xl bg-gradient-to-r from-primary/20 via-secondary/15 to-accent/20 border-2 border-primary/30 px-4 py-4 shadow-xl">
        <div class="flex items-center gap-3 flex-wrap">
          <div class="rounded-lg bg-primary/25 p-2 border border-primary/40">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-0.5"><span class="badge badge-primary badge-outline font-mono text-xs">CP0001</span></div>
            <h1 class="text-xl font-bold text-base-content tracking-tight">Maintenance on Smart Sensors</h1>
            <p class="text-base-content/80 text-sm">${TOTAL} interactive worksheets — live sensor data, charts, and tasks built in.</p>
          </div>
        </div>
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

let _tempBaseline = null;
let _alarmThreshold = 40;

// colour map for CL50
const CL_COLOUR_MAP = {
  'Green':'#22c55e','Red':'#ef4444','Orange':'#f97316','Amber':'#f59e0b',
  'Yellow':'#eab308','Lime Green':'#84cc16','Spring Green':'#10b981',
  'Cyan':'#06b6d4','Sky Blue':'#38bdf8','Blue':'#3b82f6','Violet':'#8b5cf6',
  'Magenta':'#ec4899','Rose':'#f43f5e','White':'#f8fafc'
};

function initLiveIntro(container) {
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

    setPortCard('intro-p1-dot', 'intro-p1-val', p1Active,
      p1Active ? (det1 ? 'Detected ●' : 'No object ○') : 'Inactive', colours.photo);
    setPortCard('intro-p2-dot', 'intro-p2-val', p2Active,
      p2Active ? `Count: ${cnt2}` : 'Inactive', colours.cap);
    setPortCard('intro-p3-dot', 'intro-p3-val', p3Active,
      p3Active && temp3 != null ? `${temp3.toFixed(1)} °C` : 'Inactive', colours.temp);
    setPortCard('intro-p4-dot', 'intro-p4-val', p4Active,
      p4Active && c4 ? c4 : 'Inactive', colours.led);
  });
}

function initLiveWs2(container) {
  // reset task state
  _lastPhotoState = false;
  _photoWaveCount = 0;

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

    pushToChart(chart, det ? 1 : 0);
    if (sq !== null) pushToChart(sigChart, sq);
  });
}

function initLiveWs3(container) {
  _lastCapState = false;
  _capTaskCount = 0;

  const chart = makeChart('ws3-chart', 'line',
    [{ data: Array(60).fill(0), borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.15)',
       fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 }], -0.1, 1.2, '');

  startLiveData(data => {
    const port = getPort(data, 2);
    setLiveStatus('ws3-live-badge', !!port);
    if (!port || !port.pdin_decoded) return;

    const det   = port.pdin_decoded.object_detected || false;
    const count = port.detection_counter ?? 0;

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
  });

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

function initLiveWs4(container) {
  _tempBaseline = null;
  _alarmThreshold = 40;

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
  });

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
  startLiveData(data => {
    const port = getPort(data, 4);
    setLiveStatus('ws5-live-badge', !!port);
    if (!port || !port.pdin_decoded) return;

    const d = port.pdin_decoded;
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
    const animEl = container.querySelector('#ws5-animation');
    if (animEl) animEl.textContent = anim;
    const hexEl = container.querySelector('#ws5-raw-hex');
    if (hexEl) hexEl.textContent = hex || '—';
  });
}

function initWorksheetInteractivity(container) {
  if (!container) container = document.getElementById('worksheets-root');
  if (!container) return;

  // suggested answer toggles
  container.querySelectorAll('.ws-suggested-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = document.getElementById(btn.getAttribute('data-target'));
      if (el) el.classList.toggle('hidden');
    });
  });

  // start live data for the relevant worksheet
  if (container.querySelector('#ws-intro-panel'))  initLiveIntro(container);
  else if (container.querySelector('#ws2-chart'))    initLiveWs2(container);
  else if (container.querySelector('#ws3-chart')) initLiveWs3(container);
  else if (container.querySelector('#ws4-chart')) initLiveWs4(container);
  else if (container.querySelector('#ws5-live-panel')) initLiveWs5(container);
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
