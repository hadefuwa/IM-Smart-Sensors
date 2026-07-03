/**
 * CP7395: Industry 4.0 IO-Link
 * 7 worksheets — engineering level: system brief, architecture, protocol, integration, business case.
 * Audience: engineers, system integrators, HNC/degree students.
 * Prerequisite: CP3723 recommended.
 */
import { markVisited } from './progress-page.js';
import Chart from 'chart.js/auto';
import { resolveVendorName, resolveDeviceName } from './io-link-vendors.js';

// ── MCQ answer key (kept in JS, not in the DOM) ──────────────────────────────
const _CP2_ANSWERS = {
  'cp2-ws0-q1': 'a', 'cp2-ws0-q2': 'b', 'cp2-ws0-q3': 'c', 'cp2-ws0-q4': 'a',
  'cp2-ws1-q1': 'a', 'cp2-ws1-q2': 'c', 'cp2-ws1-q3': 'a', 'cp2-ws1-q4': 'b',
  'cp2-ws2-q1': 'a', 'cp2-ws2-q2': 'c', 'cp2-ws2-q3': 'c', 'cp2-ws2-q4': 'a',
  'cp2-ws4-q1': 'a', 'cp2-ws4-q2': 'a',
  'cp2-ws5-q1': 'c', 'cp2-ws5-q3': 'b', 'cp2-ws5-q4': 'c',
  'cp2-ws6-q1': 'a', 'cp2-ws6-q2': 'c', 'cp2-ws6-q3': 'c', 'cp2-ws6-q4': 'a', 'cp2-ws6-q5': 'b',
  'cp2-ws7-q1': 'a', 'cp2-ws7-q2': 'b', 'cp2-ws7-q3': 'c', 'cp2-ws7-q4': 'a', 'cp2-ws7-q5': 'c', 'cp2-ws7-q6': 'b', 'cp2-ws7-q7': 'b',
};

// ── Live data infrastructure ──────────────────────────────────────────────────
function getWsBase() {
  const base = window.IO_LINK_API_BASE || window.location.origin;
  return base.replace(/^http/, 'ws');
}
let _cp2WsLive = null;
let _cp2WsCallback = null;
let _cp2ReconnectTimer = null;
let _cp2Ws4Cleanup = null;

function startCp2LiveData(callback) {
  stopCp2LiveData();
  _cp2WsCallback = callback;
  _openCp2Socket();
}
function _openCp2Socket() {
  try {
    _cp2WsLive = new WebSocket(`${getWsBase()}/ws`);
    _cp2WsLive.onmessage = e => { try { if (_cp2WsCallback) _cp2WsCallback(JSON.parse(e.data)); } catch {} };
    _cp2WsLive.onclose = () => {
      _cp2WsLive = null;
      if (_cp2WsCallback) { clearTimeout(_cp2ReconnectTimer); _cp2ReconnectTimer = setTimeout(_openCp2Socket, 3000); }
    };
  } catch {}
}
function stopCp2LiveData() {
  _cp2WsCallback = null;
  clearTimeout(_cp2ReconnectTimer);
  if (_cp2WsLive) { try { _cp2WsLive.close(); } catch {} _cp2WsLive = null; }
  if (_cp2Ws4Cleanup) { try { _cp2Ws4Cleanup(); } catch {} _cp2Ws4Cleanup = null; }
}

// ── Embedded diagnostics panels ───────────────────────────────────────────────
let _cp2DiagInterval = null;
let _cp2HealthInterval = null;
let _cp2LatencyChart = null;
let _cp2LatencyBuf = { labels: [], values: [] };
const _CP2_MAX_LAT_POINTS = 20;

function _cp2UpperClass(val, warn, crit) {
  if (val == null) return 'text-base-content';
  if (val >= crit) return 'text-error';
  if (val >= warn) return 'text-warning';
  return 'text-success';
}
function _cp2LowerClass(val, good, warn) {
  if (val == null) return 'text-base-content';
  if (val >= good) return 'text-success';
  if (val >= warn) return 'text-warning';
  return 'text-error';
}
function _cp2SetEl(container, id, text, cls) {
  const el = container.querySelector('#' + id);
  if (!el) return;
  el.textContent = text;
  if (cls) el.className = 'font-bold font-mono text-sm ' + cls;
}

function stopCp2EmbeddedPanels() {
  clearInterval(_cp2DiagInterval);
  clearInterval(_cp2HealthInterval);
  _cp2DiagInterval = null;
  _cp2HealthInterval = null;
  if (_cp2LatencyChart) { _cp2LatencyChart.destroy(); _cp2LatencyChart = null; }
  _cp2LatencyBuf = { labels: [], values: [] };
}

function initCp2EmbeddedPanels(container) {
  stopCp2EmbeddedPanels();
  const API_BASE = window.IO_LINK_API_BASE || window.location.origin;

  function refreshDiag() {
    fetch(API_BASE + '/api/io-link/diagnostics')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        const s = data.stats || {};
        const badge = container.querySelector('#cp2-diag-badge');
        if (badge) { badge.textContent = 'LIVE'; badge.className = 'badge badge-xs badge-success font-mono'; }

        const circuit = (s.circuit_state || 'unknown').toLowerCase();
        _cp2SetEl(container, 'cp2-diag-circuit', circuit.toUpperCase(), circuit === 'closed' ? 'text-success' : 'text-error');
        _cp2SetEl(container, 'cp2-diag-success',
          s.request_success_rate_pct != null ? s.request_success_rate_pct.toFixed(1) + '%' : '—',
          _cp2LowerClass(s.request_success_rate_pct, 99, 95));
        _cp2SetEl(container, 'cp2-diag-mqtt',
          s.mqtt_connected ? 'CONNECTED' : 'OFFLINE',
          s.mqtt_connected ? 'text-success' : 'text-error');

        const p95El = container.querySelector('#cp2-diag-p95');
        if (p95El) p95El.textContent = s.request_rtt_p95_ms != null ? s.request_rtt_p95_ms : '—';

        // Rolling buffer — append the latest reading, cap at _CP2_MAX_LAT_POINTS
        var latArr = data.latencies;
        var latVal = Array.isArray(latArr) && latArr.length
          ? latArr[latArr.length - 1].latency_ms
          : (s.request_rtt_p50_ms != null ? s.request_rtt_p50_ms : null);
        if (latVal != null) {
          var nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          _cp2LatencyBuf.labels.push(nowLabel);
          _cp2LatencyBuf.values.push(latVal);
          if (_cp2LatencyBuf.labels.length > _CP2_MAX_LAT_POINTS) {
            _cp2LatencyBuf.labels.shift();
            _cp2LatencyBuf.values.shift();
          }
          var canvas = container.querySelector('#cp2-diag-latency-chart');
          if (canvas) {
            if (!_cp2LatencyChart) {
              _cp2LatencyChart = new Chart(canvas.getContext('2d'), {
                type: 'line',
                data: {
                  labels: _cp2LatencyBuf.labels.slice(),
                  datasets: [{ data: _cp2LatencyBuf.values.slice(), borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.1)', fill: true, pointRadius: 3, tension: 0.4 }]
                },
                options: {
                  responsive: true, maintainAspectRatio: false,
                  animation: { duration: 400 },
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { ticks: { maxTicksLimit: 5, maxRotation: 0 } },
                    y: { beginAtZero: true, ticks: { callback: function (v) { return v + 'ms'; } } }
                  }
                }
              });
            } else {
              _cp2LatencyChart.data.labels = _cp2LatencyBuf.labels.slice();
              _cp2LatencyChart.data.datasets[0].data = _cp2LatencyBuf.values.slice();
              _cp2LatencyChart.update();
            }
          }
        }
      })
      .catch(function () {
        const badge = container.querySelector('#cp2-diag-badge');
        if (badge) { badge.textContent = 'ERR'; badge.className = 'badge badge-xs badge-error font-mono'; }
      });
  }

  function refreshHealth() {
    fetch(API_BASE + '/api/system/health')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        const sys = data.system || {};
        _cp2SetEl(container, 'cp2-edge-backend', 'Online', 'text-success');
        _cp2SetEl(container, 'cp2-edge-cpu',
          sys.cpu_pct != null ? sys.cpu_pct + '%' : '—',
          _cp2UpperClass(sys.cpu_pct, 70, 90));
        _cp2SetEl(container, 'cp2-edge-cputemp',
          sys.cpu_temp_c != null ? sys.cpu_temp_c + '°C' : '—',
          _cp2UpperClass(sys.cpu_temp_c, 70, 82));
      })
      .catch(function () {
        _cp2SetEl(container, 'cp2-edge-backend', 'Unreachable', 'text-error');
      });
  }

  refreshDiag();
  refreshHealth();
  _cp2DiagInterval = setInterval(refreshDiag, 3000);
  _cp2HealthInterval = setInterval(refreshHealth, 3000);
}

function getPort(data, portNum) {
  if (!data || !Array.isArray(data.ports)) return null;
  return data.ports.find(p => p.port === portNum) || null;
}

function initCp2KitChecklist(container) {
  container.querySelectorAll('.cp2-kit-item').forEach(function (label) {
    const cb = label.querySelector('input[type="checkbox"]');
    if (!cb) return;
    const apply = function () {
      if (cb.checked) {
        label.classList.add('bg-success/20', 'border-success');
        const txt = label.querySelector('.cp2-kit-text');
        if (txt) txt.style.opacity = '0.6';
      } else {
        label.classList.remove('bg-success/20', 'border-success');
        const txt = label.querySelector('.cp2-kit-text');
        if (txt) txt.style.opacity = '';
      }
    };
    cb.addEventListener('change', apply);
  });
}

const WORKSHEETS = [
  {
    id: 1,
    title: 'Your System — A Technical Brief',
    shortDesc: 'Hardware, network topology, and live status.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'Every engineering project starts with a system brief. Before writing code or interpreting data you need to know what hardware is on the bench, how it\'s networked, and what each component\'s role is in the overall architecture.',
    relatedDashboard: 'Edge Device page, Admin / Connection Diagnostics',
    prerequisites: 'CP3723 recommended',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed text-base">In front of you is a complete Industry 4.0 sensor stack. Identify each component on the bench, tick it off, then confirm it's live on screen before moving to the questions.</p>

      <!-- Hardware checklist -->
      <div class="rounded-xl border-2 border-secondary/30 bg-secondary/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content">🔍 Locate each component — tick it when identified:</p>
        <div class="space-y-2 text-sm" id="cp2-kit-checklist">
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>IO-Link Master (IFM AL1350)</strong> — the orange box with numbered M12 ports. IP: 192.168.7.4. All sensors connect here. Publishes MQTT every 500 ms and responds to HTTP service calls (ISDU reads/writes).</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>Port 1 — OMRON E2E-X16MB1T12</strong> — M18 inductive proximity. IO-Link V1.1 COM3 (230.4 kbps): full ISDU access. PDin bit 0 = switching output; bits 4–5 = instability / over-approach alarms. Output logic, timer mode, and diagnosis mode configurable remotely.</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>Port 2 — Capacitive Sensor</strong> — M18 cylinder. IO-Link 1.1: full ISDU access — threshold (SSC1 SP1) and teach commands writable remotely. Detects material by dielectric field change.</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>Port 3 — IFM TV7105</strong> — IO-Link temperature sensor, ±0.1 °C. PDin: 4 bytes. Bytes 0–1 = signed int16 (raw ÷ 10 = °C). Bytes 2–3 carry SP1/SP2 switching outputs and alarm flags.</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>Port 4 — IFM CL50</strong> — multi-colour status light stack. PDin encodes three colour channels (red, amber, green) each with on/flash/off state across multiple bit fields — more complex than a single switching output.</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>Edge Gateway (Raspberry Pi)</strong> — runs FastAPI + uvicorn + Mosquitto. eth0: 192.168.7.2 (IO-Link subnet, static); wlan0: building LAN (DHCP). Bridges the two isolated networks — the classic edge gateway pattern.</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>This dashboard</strong> — Vite SPA receiving WebSocket JSON from the Pi's FastAPI backend. Decodes MQTT PDin into live charts. Never communicates directly with the AL1350.</span>
          </label>
        </div>
      </div>

      <!-- Connection diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">System architecture — data flow</p>
        <svg viewBox="0 0 570 205" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <rect x="2"   y="24"  width="124" height="32" rx="5" fill="#3b82f6"/>
          <text x="64"  y="37"  text-anchor="middle" fill="white" font-size="10" font-weight="600">Proximity (E2E)</text>
          <text x="64"  y="49"  text-anchor="middle" fill="#bfdbfe" font-size="8">Port 1 · IO-Link 1.1</text>
          <rect x="2"   y="64"  width="124" height="32" rx="5" fill="#7c3aed"/>
          <text x="64"  y="77"  text-anchor="middle" fill="white" font-size="10" font-weight="600">Capacitive</text>
          <text x="64"  y="89"  text-anchor="middle" fill="#ddd6fe" font-size="8">Port 2 · IO-Link 1.1</text>
          <rect x="2"   y="104" width="124" height="32" rx="5" fill="#d97706"/>
          <text x="64"  y="117" text-anchor="middle" fill="white" font-size="10" font-weight="600">Temperature TV7105</text>
          <text x="64"  y="129" text-anchor="middle" fill="#fde68a" font-size="8">Port 3 · IO-Link 1.1</text>
          <rect x="2"   y="144" width="124" height="32" rx="5" fill="#0d9488"/>
          <text x="64"  y="157" text-anchor="middle" fill="white" font-size="10" font-weight="600">CL50 Light Stack</text>
          <text x="64"  y="169" text-anchor="middle" fill="#99f6e4" font-size="8">Port 4 · IO-Link 1.1</text>
          <line x1="126" y1="40"  x2="152" y2="40"  stroke="#94a3b8" stroke-width="2"/>
          <line x1="126" y1="80"  x2="152" y2="80"  stroke="#94a3b8" stroke-width="2"/>
          <line x1="126" y1="120" x2="152" y2="120" stroke="#94a3b8" stroke-width="2"/>
          <line x1="126" y1="160" x2="152" y2="160" stroke="#94a3b8" stroke-width="2"/>
          <rect x="150" y="10" width="112" height="182" rx="8" fill="#ea580c"/>
          <rect x="152" y="33" width="8" height="14" rx="2" fill="#9a3412"/>
          <rect x="152" y="73" width="8" height="14" rx="2" fill="#9a3412"/>
          <rect x="152" y="113" width="8" height="14" rx="2" fill="#9a3412"/>
          <rect x="152" y="153" width="8" height="14" rx="2" fill="#9a3412"/>
          <text x="216" y="85"  text-anchor="middle" fill="white" font-size="11" font-weight="700">IO-Link</text>
          <text x="216" y="100" text-anchor="middle" fill="white" font-size="11" font-weight="700">Master</text>
          <text x="216" y="114" text-anchor="middle" fill="#fed7aa" font-size="8">IFM AL1350</text>
          <text x="216" y="126" text-anchor="middle" fill="#fed7aa" font-size="7">192.168.7.4</text>
          <line x1="262" y1="100" x2="320" y2="100" stroke="#64748b" stroke-width="2.5" stroke-dasharray="6,3"/>
          <polygon points="320,96 320,104 328,100" fill="#64748b"/>
          <text x="287" y="89" text-anchor="middle" fill="#94a3b8" font-size="8" font-weight="600">MQTT</text>
          <text x="287" y="99" text-anchor="middle" fill="#94a3b8" font-size="7">500 ms push</text>
          <rect x="328" y="55" width="100" height="90" rx="8" fill="#15803d"/>
          <text x="378" y="88"  text-anchor="middle" fill="white" font-size="10" font-weight="700">Raspberry Pi</text>
          <text x="378" y="102" text-anchor="middle" fill="#bbf7d0" font-size="7">FastAPI · Mosquitto</text>
          <text x="378" y="114" text-anchor="middle" fill="#bbf7d0" font-size="7">192.168.7.2 / DHCP</text>
          <text x="378" y="126" text-anchor="middle" fill="#bbf7d0" font-size="7">Edge Gateway</text>
          <line x1="428" y1="100" x2="462" y2="100" stroke="#64748b" stroke-width="2.5" stroke-dasharray="6,3"/>
          <polygon points="462,96 462,104 470,100" fill="#64748b"/>
          <text x="445" y="89" text-anchor="middle" fill="#94a3b8" font-size="8" font-weight="600">WebSocket</text>
          <text x="445" y="99" text-anchor="middle" fill="#94a3b8" font-size="7">/ws JSON</text>
          <rect x="470" y="50"  width="96" height="72" rx="5" fill="#334155"/>
          <rect x="476" y="56"  width="84" height="54" rx="3" fill="#0f172a"/>
          <rect x="482" y="63" width="32" height="4"  rx="1" fill="#3b82f6" opacity="0.8"/>
          <rect x="482" y="71" width="56" height="3"  rx="1" fill="#475569"/>
          <rect x="482" y="78" width="44" height="3"  rx="1" fill="#475569"/>
          <rect x="482" y="85" width="50" height="3"  rx="1" fill="#10b981" opacity="0.7"/>
          <rect x="482" y="92" width="38" height="3"  rx="1" fill="#475569"/>
          <rect x="509" y="122" width="18" height="5" rx="2" fill="#334155"/>
          <rect x="501" y="127" width="34" height="5" rx="2" fill="#1e293b"/>
          <text x="518" y="145" text-anchor="middle" fill="#94a3b8" font-size="9">HMI Screen</text>
          <text x="285" y="198" text-anchor="middle" fill="#64748b" font-size="8">Sensors → IO-Link → MQTT → Edge Gateway → WebSocket → Browser</text>
        </svg>
      </div>

      <!-- Network topology -->
      <div class="rounded-xl border-2 border-base-300 bg-base-200 p-4 mt-3 font-mono text-xs leading-relaxed overflow-x-auto">
        <p class="text-base-content/50 mb-1">// Network topology</p>
        <p><span class="text-warning font-bold">AL1350</span> <span class="text-base-content/50">192.168.7.4</span></p>
        <p class="ml-2">│  IO-Link subnet: 192.168.7.x</p>
        <p class="ml-2">├─ <span class="text-accent">MQTT publish</span> → port 1883 → Mosquitto on Pi (every 500 ms)</p>
        <p class="ml-2">└─ <span class="text-primary">HTTP</span> ← Pi polls for ISDU, device tree, supervision</p>
        <p class="mt-1"><span class="text-warning font-bold">Raspberry Pi</span> <span class="text-base-content/50">192.168.7.2 (eth0)  /  DHCP (wlan0)</span></p>
        <p class="ml-2">│  Runs: FastAPI · uvicorn · Mosquitto · decoder.py</p>
        <p class="ml-2">└─ <span class="text-success">WebSocket /ws</span> → browser (this app) — pushes JSON every tick</p>
        <p class="mt-1"><span class="text-warning font-bold">Browser</span> <span class="text-base-content/50">(this screen)</span></p>
        <p class="ml-2">Receives merged MQTT + HTTP data as JSON over WebSocket</p>
      </div>

      <!-- Live system status -->
      <div class="rounded-xl border-2 border-success/30 bg-success/5 p-4 mt-4 space-y-3" id="cp2-sys-panel">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="font-bold text-base-content text-sm">Live — System Status Right Now</span>
          <span id="cp2-sys-badge" class="badge badge-xs badge-ghost font-mono">OFFLINE</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 text-center space-y-1">
            <p class="text-xs text-base-content/50">AL1350 Master</p>
            <div id="cp2-master-dot" class="w-6 h-6 rounded-full bg-base-300 mx-auto transition-all"></div>
            <p id="cp2-master-label" class="text-xs font-bold text-base-content">—</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 text-center space-y-1">
            <p class="text-xs text-base-content/50">IO-Link ports active</p>
            <p id="cp2-port-count" class="text-3xl font-black font-mono text-secondary leading-none">—</p>
            <p class="text-xs text-base-content/50">of 4</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 text-center space-y-1">
            <p class="text-xs text-base-content/50">WS messages received</p>
            <p id="cp2-msg-count" class="text-3xl font-black font-mono text-secondary leading-none">0</p>
            <p class="text-xs text-base-content/50">this session</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 text-center space-y-1">
            <p class="text-xs text-base-content/50">Last update</p>
            <p id="cp2-last-update" class="text-xs font-mono font-bold text-base-content">—</p>
          </div>
        </div>
      </div>

      <!-- Concept: MQTT & Mosquitto -->
      <div class="rounded-xl border-2 border-info/30 bg-info/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-sm">📡 Concept — MQTT, Mosquitto, and the message rate</p>
        <p class="text-sm text-base-content/80"><strong>MQTT</strong> (Message Queuing Telemetry Transport) is a lightweight publish/subscribe protocol designed for machine-to-machine communication. Instead of polling — where you repeatedly ask "any new data?" — MQTT lets a device <em>push</em> data the moment it's ready. This makes it ideal for fast industrial sensors.</p>
        <p class="text-sm text-base-content/80"><strong>Mosquitto</strong> is an open-source MQTT <em>broker</em> running on the Raspberry Pi. A broker is a central message hub: publishers send data to it, and subscribers receive it. The AL1350 is the publisher; the Pi's FastAPI backend is the subscriber.</p>
        <div class="rounded-lg bg-base-200 border border-base-300 p-3 text-xs font-mono space-y-1">
          <p class="text-base-content/50 mb-1">// Data flow — sensor to screen</p>
          <p><span class="text-warning">AL1350</span> <span class="text-base-content/50">→ publishes PDin to Mosquitto every 500 ms</span></p>
          <p><span class="text-success">Mosquitto</span> <span class="text-base-content/50">→ forwards to FastAPI backend (subscriber)</span></p>
          <p><span class="text-primary">FastAPI</span> <span class="text-base-content/50">→ broadcasts decoded JSON via WebSocket /ws</span></p>
          <p><span class="text-accent">Browser</span> <span class="text-base-content/50">→ receives WebSocket message, updates screen</span></p>
        </div>
        <div class="rounded-lg bg-base-300/50 border border-base-300 p-3 text-sm">
          <p class="font-semibold text-base-content mb-1">Calculating the message rate:</p>
          <p class="text-base-content/80">The AL1350 publishes every <strong>500 ms</strong>. There are 1000 ms in one second.</p>
          <p class="font-mono text-base-content mt-1">1000 ms ÷ 500 ms = <strong class="text-info">2 messages per second</strong></p>
          <p class="text-base-content/60 text-xs mt-1">Each message carries all four ports' process data in one JSON payload — watch the WS counter above increment at approximately this rate.</p>
        </div>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> From the checklist above, what is the IP address of the AL1350 IO-Link Master?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q1" value="a" class="radio radio-sm radio-secondary"> 192.168.7.4</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q1" value="b" class="radio radio-sm radio-secondary"> 192.168.7.2</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q1" value="c" class="radio radio-sm radio-secondary"> 192.168.1.1</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> The AL1350 pushes data to Mosquitto every 500 ms. Approximately how many WebSocket messages should arrive at the browser each second?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q2" value="a" class="radio radio-sm radio-secondary"> 20 messages per second</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q2" value="b" class="radio radio-sm radio-secondary"> 2 messages per second</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q2" value="c" class="radio radio-sm radio-secondary"> 500 messages per second — 500 ms equals 500 per second</label>
      </div>

      <!-- Concept: Two network interfaces -->
      <div class="rounded-xl border-2 border-info/30 bg-info/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-sm">🌐 Concept — Why the Raspberry Pi has two network interfaces</p>
        <p class="text-sm text-base-content/80">The IO-Link subnet (<strong>192.168.7.x</strong>) is a <em>private, isolated</em> industrial network. It is deliberately kept separate from the building LAN for reliability and security — no general office traffic can interfere with sensor polling.</p>
        <p class="text-sm text-base-content/80">Your browser runs on the building LAN. Without a bridge between the two networks, it could never reach the AL1350. The Raspberry Pi solves this by sitting in <em>both</em> networks simultaneously.</p>
        <svg viewBox="0 0 560 110" xmlns="http://www.w3.org/2000/svg" class="w-full mt-1" style="font-family:system-ui,sans-serif">
          <rect x="2"   y="30" width="118" height="50" rx="6" fill="#1d4ed8" opacity="0.9"/>
          <text x="61"  y="52" text-anchor="middle" fill="white" font-size="10" font-weight="700">Building LAN</text>
          <text x="61"  y="65" text-anchor="middle" fill="#bfdbfe" font-size="8">Your browser</text>
          <text x="61"  y="76" text-anchor="middle" fill="#bfdbfe" font-size="8">wlan0 · DHCP</text>
          <line x1="120" y1="55" x2="165" y2="55" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5,3"/>
          <text x="142" y="48" text-anchor="middle" fill="#94a3b8" font-size="7">wlan0</text>
          <rect x="165" y="18" width="118" height="74" rx="8" fill="#15803d"/>
          <text x="224" y="44" text-anchor="middle" fill="white" font-size="10" font-weight="700">Raspberry Pi</text>
          <text x="224" y="57" text-anchor="middle" fill="#bbf7d0" font-size="8">FastAPI · Mosquitto</text>
          <text x="224" y="69" text-anchor="middle" fill="#86efac" font-size="8" font-weight="600">Edge Gateway</text>
          <text x="224" y="82" text-anchor="middle" fill="#bbf7d0" font-size="7">bridges both subnets</text>
          <line x1="283" y1="55" x2="330" y2="55" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5,3"/>
          <text x="306" y="48" text-anchor="middle" fill="#94a3b8" font-size="7">eth0</text>
          <rect x="330" y="30" width="118" height="50" rx="6" fill="#c2410c" opacity="0.9"/>
          <text x="389" y="52" text-anchor="middle" fill="white" font-size="10" font-weight="700">IO-Link Subnet</text>
          <text x="389" y="65" text-anchor="middle" fill="#fed7aa" font-size="8">192.168.7.x — isolated</text>
          <text x="389" y="76" text-anchor="middle" fill="#fed7aa" font-size="8">eth0 · 192.168.7.2</text>
          <line x1="448" y1="55" x2="490" y2="55" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5,3"/>
          <rect x="490" y="30" width="66" height="50" rx="6" fill="#ea580c"/>
          <text x="523" y="52" text-anchor="middle" fill="white" font-size="9" font-weight="700">AL1350</text>
          <text x="523" y="65" text-anchor="middle" fill="#fed7aa" font-size="7">192.168.7.4</text>
          <text x="523" y="76" text-anchor="middle" fill="#fed7aa" font-size="7">IO-Link Master</text>
          <text x="280" y="105" text-anchor="middle" fill="#64748b" font-size="8">Without the Pi bridging both subnets, the browser has no route to the AL1350</text>
        </svg>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="rounded bg-base-200 border border-base-300 p-2">
            <p class="font-semibold text-base-content mb-1">eth0 — IO-Link subnet</p>
            <p class="text-base-content/70">Static IP: 192.168.7.2. Dedicated to industrial traffic only — MQTT subscribe, HTTP polls to AL1350. Never carries building LAN traffic.</p>
          </div>
          <div class="rounded bg-base-200 border border-base-300 p-2">
            <p class="font-semibold text-base-content mb-1">wlan0 — Building LAN</p>
            <p class="text-base-content/70">DHCP address. This is what your browser connects to. FastAPI and the WebSocket endpoint are accessible here. No direct route to 192.168.7.x exists from this interface.</p>
          </div>
        </div>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> The Raspberry Pi has two network interfaces (eth0 and wlan0). Why does this matter for the system architecture?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q3" value="a" class="radio radio-sm radio-secondary"> It allows two IO-Link masters to be connected simultaneously</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q3" value="b" class="radio radio-sm radio-secondary"> It doubles bandwidth by bonding eth0 and wlan0 together for MQTT traffic</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q3" value="c" class="radio radio-sm radio-secondary"> It bridges the isolated IO-Link subnet to the building LAN</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q4.</strong> According to the hardware table, how many IO-Link ports have a sensor connected in this system?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q4" value="a" class="radio radio-sm radio-secondary"> 4 — Ports 1 through 4 each have a sensor</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q4" value="b" class="radio radio-sm radio-secondary"> 8 — every port on the AL1350 is populated</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q4" value="c" class="radio radio-sm radio-secondary"> 2 — only the photoelectric and capacitive sensors</label>
      </div>

      <!-- Verification challenge -->
      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-base">🎯 Verification — confirm the stack is healthy</p>
        <p class="text-sm text-base-content/80">Use the live panels below to verify the stack, then tick each item.</p>

        <!-- Connection Diagnostics embedded panel -->
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Connection Diagnostics</p>
            <span id="cp2-diag-badge" class="badge badge-xs badge-ghost font-mono">—</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">Circuit Breaker</div>
              <div id="cp2-diag-circuit" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">Success Rate</div>
              <div id="cp2-diag-success" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">MQTT</div>
              <div id="cp2-diag-mqtt" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
          </div>
          <div class="h-28"><canvas id="cp2-diag-latency-chart"></canvas></div>
          <p class="text-xs text-base-content/40">RTT p95: <span id="cp2-diag-p95">—</span> ms &nbsp;·&nbsp; poll latency to AL1350 over HTTP</p>
        </div>

        <!-- Edge Device embedded panel -->
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 space-y-2">
          <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Edge Device — Services</p>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">Backend API</div>
              <div id="cp2-edge-backend" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">CPU</div>
              <div id="cp2-edge-cpu" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">CPU Temp</div>
              <div id="cp2-edge-cputemp" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
          </div>
        </div>

        <div class="space-y-2 text-sm" id="cp2-verify-checklist">
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">The circuit breaker shows <strong>CLOSED</strong> (green) in the panel above</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">The latency graph above is showing live readings (not flat-lined)</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">The Backend API shows <strong>Online</strong> in the Edge Device panel above</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">The WS message counter above is incrementing at approximately 2 messages per second</span>
          </label>
        </div>
      </div>

      <div id="cp2-ws0-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: a — 192.168.7.4 (listed on the IO-Link Master checklist item). Q2: b — 500 ms interval = 1000 ÷ 500 = 2 messages per second (not 500 — that would confuse the period in ms with the rate per second). Q3: c — bridges the private 192.168.7.x subnet to the building LAN so browsers do not need to be on the IO-Link subnet. Q4: a — Ports 1–4 are used (proximity, capacitive, temperature, light stack).</div>
    `
  },
  {
    id: 2,
    title: 'How This App Works',
    shortDesc: 'MQTT, HTTP, edge device, WebSocket.',
    estimatedTime: 'About 20 min',
    whyItMatters: 'Understanding the full data path — from IO-Link sensor through the edge device to your browser — is the foundation of any Industry 4.0 integration. The same architecture pattern is used in industrial IoT platforms at scale.',
    relatedLearn: '',
    relatedDashboard: 'Edge Device page, Admin / Connection Diagnostics',
    prerequisites: 'CP3723 recommended',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">This app is a real Industry 4.0 system. Data travels through three distinct software layers before it appears on this screen. Think of it like a post room: the sensor puts a letter in the tray, the post room sorts and translates it, and it arrives on your desk — this app is the desk. Identify each layer below, then work through the concept cards to understand exactly how they interact.</p>

      <!-- Software layer checklist -->
      <div class="rounded-xl border-2 border-secondary/30 bg-secondary/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content">🔍 Identify each software layer — tick it when you understand its role:</p>
        <div class="space-y-2 text-sm" id="cp2-ws1-sw-checklist">
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>Mosquitto MQTT broker</strong> — open-source message broker running on the Pi. The AL1350 connects to it as a <em>publisher</em> and sends sensor readings every 500 ms. The FastAPI backend connects as a <em>subscriber</em> and receives those readings. Mosquitto is the hub that decouples the producer (AL1350) from the consumer (backend).<br><span class="text-xs text-base-content/55 italic">📱 Like a WhatsApp group chat: the AL1350 constantly posts updates to the group; Mosquitto runs the group server; FastAPI has joined and sees every message the moment it arrives — nobody has to keep asking "any news?"</span></span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>FastAPI + uvicorn</strong> — the Python API server running on the Pi. It subscribes to Mosquitto, decodes raw PDin hex into human-readable values, and then broadcasts the result over WebSocket to every connected browser. It also handles REST endpoints for ISDU reads and writes, and polls the AL1350 via HTTP as a fallback when MQTT is unavailable.<br><span class="text-xs text-base-content/55 italic">🏢 Like a bilingual receptionist at a front desk: it receives messages in one language (raw bytes from the sensor), translates them into a language everyone understands (JSON with temperature in °C), then forwards them to whoever needs them.</span></span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>decoder.py</strong> — a Python module called by FastAPI. For each device type it knows the IODD byte layout and extracts the right bits. Temperature sensor: bytes 0–1 = signed int16, divide by 10 for °C. Proximity: byte 1 bit 0 = switching output, bits 4–5 = alarms. Capacitive: uint16 count. CL50: 3 bytes encoding colour, animation, and intensity.<br><span class="text-xs text-base-content/55 italic">🔬 Like a barcode scanner at a supermarket checkout — it takes a string of meaningless numbers (raw hex bytes) and converts them into something useful: "Temp = 23.4 °C" or "Object detected: YES".</span></span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>WebSocket /ws endpoint</strong> — a persistent two-way connection from the browser to FastAPI. Unlike a regular HTTP request (which opens, transfers data, then closes), WebSocket stays open for as long as the page is open. FastAPI pushes a new JSON frame every time a fresh MQTT message arrives — no browser polling required. If the connection drops (e.g. network glitch), the browser auto-reconnects.<br><span class="text-xs text-base-content/55 italic">📞 Like the difference between sending texts and being on a phone call. HTTP is texting — you send a message, wait for a reply, then repeat. WebSocket is a call you leave open: both sides can say something whenever they have news, with no dialling again.</span></span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>This HMI dashboard</strong> — a Vite SPA (single-page application) built with vanilla JavaScript, Chart.js, and Tailwind CSS. It receives the WebSocket JSON and updates port cards, charts, and the event log without reloading the page. It never communicates directly with the AL1350 — all requests go through FastAPI.<br><span class="text-xs text-base-content/55 italic">🖥️ Like the instrument panel in a car — it shows you speed, fuel, temperature. It does not connect to the engine directly; it reads signals that have already been processed and passed through. You are always one step removed from the hardware, which is safer and simpler.</span></span>
          </label>
        </div>
      </div>

      <!-- Data flow diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-4">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">Data flow — sensor to browser</p>
        <svg viewBox="0 0 600 210" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <defs>
            <marker id="ws2-arr-g" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#22c55e"/></marker>
            <marker id="ws2-arr-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#3b82f6"/></marker>
            <marker id="ws2-arr-a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#f59e0b"/></marker>
            <marker id="ws2-arr-r" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8"/></marker>
          </defs>
          <!-- AL1350 -->
          <rect x="6" y="60" width="108" height="80" rx="8" fill="#ea580c"/>
          <text x="60" y="88" text-anchor="middle" fill="white" font-size="10" font-weight="700">IO-Link Master</text>
          <text x="60" y="102" text-anchor="middle" fill="#fed7aa" font-size="8">IFM AL1350</text>
          <text x="60" y="115" text-anchor="middle" fill="#fed7aa" font-size="7">192.168.7.4</text>
          <text x="60" y="128" text-anchor="middle" fill="#fed7aa" font-size="7">4 sensors → PDin</text>
          <!-- MQTT arrow -->
          <line x1="114" y1="82" x2="158" y2="82" stroke="#22c55e" stroke-width="2" marker-end="url(#ws2-arr-g)"/>
          <text x="136" y="75" text-anchor="middle" fill="#22c55e" font-size="7" font-weight="600">MQTT push</text>
          <text x="136" y="85" text-anchor="middle" fill="#22c55e" font-size="6.5">500 ms</text>
          <!-- HTTP arrow -->
          <line x1="158" y1="112" x2="114" y2="112" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4,2" marker-end="url(#ws2-arr-b)"/>
          <text x="136" y="127" text-anchor="middle" fill="#3b82f6" font-size="6.5">HTTP poll / ISDU</text>
          <!-- Pi box -->
          <rect x="160" y="28" width="240" height="144" rx="8" fill="#15803d"/>
          <text x="280" y="52" text-anchor="middle" fill="white" font-size="11" font-weight="700">Raspberry Pi — Edge Gateway</text>
          <!-- Mosquitto sub-box -->
          <rect x="170" y="60" width="100" height="46" rx="5" fill="#166534"/>
          <text x="220" y="80" text-anchor="middle" fill="#86efac" font-size="9" font-weight="600">Mosquitto</text>
          <text x="220" y="93" text-anchor="middle" fill="#bbf7d0" font-size="7">MQTT broker</text>
          <text x="220" y="103" text-anchor="middle" fill="#bbf7d0" font-size="6.5">port 1883</text>
          <!-- FastAPI sub-box -->
          <rect x="290" y="60" width="100" height="46" rx="5" fill="#166534"/>
          <text x="340" y="80" text-anchor="middle" fill="#86efac" font-size="9" font-weight="600">FastAPI</text>
          <text x="340" y="93" text-anchor="middle" fill="#bbf7d0" font-size="7">uvicorn · decoder.py</text>
          <text x="340" y="103" text-anchor="middle" fill="#bbf7d0" font-size="6.5">port 8000</text>
          <!-- Arrow between Mosquitto and FastAPI -->
          <line x1="270" y1="83" x2="290" y2="83" stroke="#86efac" stroke-width="1.5" marker-end="url(#ws2-arr-g)"/>
          <text x="280" y="78" text-anchor="middle" fill="#86efac" font-size="6">sub</text>
          <!-- decoder label -->
          <rect x="170" y="118" width="220" height="44" rx="5" fill="#166534"/>
          <text x="280" y="136" text-anchor="middle" fill="#86efac" font-size="8" font-weight="600">decoder.py — PDin parser</text>
          <text x="280" y="149" text-anchor="middle" fill="#bbf7d0" font-size="6.5">temp int16÷10 · prox bits · cap uint16 · CL50 3-byte</text>
          <text x="280" y="160" text-anchor="middle" fill="#bbf7d0" font-size="6.5">raw hex → JSON fields</text>
          <!-- WebSocket arrow -->
          <line x1="400" y1="100" x2="444" y2="100" stroke="#f59e0b" stroke-width="2" marker-end="url(#ws2-arr-a)"/>
          <text x="422" y="92" text-anchor="middle" fill="#f59e0b" font-size="7" font-weight="600">WebSocket</text>
          <text x="422" y="102" text-anchor="middle" fill="#f59e0b" font-size="6.5">/ws — JSON</text>
          <!-- Browser -->
          <rect x="446" y="52" width="148" height="96" rx="8" fill="#334155"/>
          <rect x="452" y="58" width="136" height="56" rx="4" fill="#0f172a"/>
          <rect x="458" y="64" width="48" height="4" rx="1" fill="#3b82f6" opacity="0.9"/>
          <rect x="458" y="72" width="92" height="3" rx="1" fill="#475569"/>
          <rect x="458" y="79" width="76" height="3" rx="1" fill="#475569"/>
          <rect x="458" y="86" width="88" height="3" rx="1" fill="#10b981" opacity="0.7"/>
          <rect x="458" y="93" width="66" height="3" rx="1" fill="#475569"/>
          <rect x="458" y="100" width="48" height="3" rx="1" fill="#f59e0b" opacity="0.6"/>
          <text x="520" y="126" text-anchor="middle" fill="#94a3b8" font-size="8">HMI Dashboard</text>
          <text x="520" y="138" text-anchor="middle" fill="#64748b" font-size="7">Vite SPA · Chart.js</text>
          <text x="300" y="198" text-anchor="middle" fill="#64748b" font-size="7.5">AL1350 → MQTT → Mosquitto → FastAPI (subscribe + decode) → WebSocket /ws → Browser</text>
        </svg>
      </div>

      <!-- Architecture code block -->
      <div class="rounded-xl border-2 border-base-300 bg-base-200 p-4 mt-3 font-mono text-xs leading-relaxed overflow-x-auto">
        <p class="text-base-content/50 mb-2">// Request flow — step by step</p>
        <p><span class="text-warning font-bold">AL1350</span> <span class="text-base-content/50">192.168.7.4</span></p>
        <p class="ml-3">│  publishes PDin + supervision to Mosquitto every 500 ms</p>
        <p class="ml-3">└─ <span class="text-success">MQTT → port 1883 → Mosquitto</span> on Pi</p>
        <p class="mt-1"><span class="text-success font-bold">Mosquitto</span> <span class="text-base-content/50">MQTT broker · Pi localhost</span></p>
        <p class="ml-3">└─ delivers message to all subscribers → <span class="text-primary">FastAPI backend</span></p>
        <p class="mt-1"><span class="text-primary font-bold">FastAPI + uvicorn</span> <span class="text-base-content/50">127.0.0.1:8000 (proxied via nginx)</span></p>
        <p class="ml-3">│  calls decoder.py → raw hex to typed JSON</p>
        <p class="ml-3">│  merges with HTTP poll data (vendor_id, device_id, mode)</p>
        <p class="ml-3">└─ broadcasts JSON frame to all open <span class="text-accent">WebSocket /ws</span> connections</p>
        <p class="ml-3 text-base-content/50">    also: GET /api/io-link/* REST endpoints for ISDU reads/writes</p>
        <p class="mt-1"><span class="text-accent font-bold">WebSocket /ws</span> <span class="text-base-content/50">browser ↔ FastAPI · persistent TCP connection</span></p>
        <p class="ml-3">└─ browser receives JSON → updates charts, port cards, event log</p>
        <p class="mt-1"><span class="text-base-content/50">parallel HTTP path:</span></p>
        <p class="ml-3">Pi polls <span class="text-warning">AL1350</span> HTTP every 1 s for ISDU data + fallback pdin</p>
        <p class="ml-3">circuit breaker opens after 5 failures → retries after 15 s</p>
      </div>

      <!-- Concept: MQTT publish/subscribe -->
      <div class="rounded-xl border-2 border-info/30 bg-info/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-sm">📨 Concept — MQTT publish/subscribe vs HTTP polling</p>
        <div class="rounded-lg bg-base-300/40 border border-base-300 p-3 text-sm text-base-content/70 italic mb-1">
          🔔 <strong>Simple version:</strong> HTTP polling is like checking your phone every few seconds to see if you have a new text. MQTT is like turning notifications on — your phone tells you the moment a message arrives, without you ever having to check.
        </div>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="rounded-lg bg-base-200 border border-success/30 p-3 space-y-1">
            <p class="font-bold text-success">MQTT (primary path)</p>
            <p class="text-base-content/80">The AL1350 is the <em>publisher</em>. It connects to Mosquitto and sends a message every 500 ms without anyone asking.</p>
            <p class="text-base-content/80">FastAPI is the <em>subscriber</em>. It registered once with Mosquitto at startup — now it just waits.</p>
            <p class="text-base-content/80 font-semibold mt-1">No polling. No wasted requests. Data arrives the instant it is ready.</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-primary/30 p-3 space-y-1">
            <p class="font-bold text-primary">HTTP (fallback + extras)</p>
            <p class="text-base-content/80">FastAPI polls the AL1350 every 1 second for data MQTT doesn't carry: device vendor/model IDs, ISDU parameter reads, and the device tree (/gettree, cached 5 min).</p>
            <p class="text-base-content/80">Also acts as fallback if MQTT is down — the AL1350 HTTP API still returns pdin on request.</p>
          </div>
        </div>
        <div class="rounded-lg bg-base-300/50 border border-base-300 p-3 text-xs">
          <p class="font-semibold text-base-content mb-1">The subscription loss problem</p>
          <p class="text-base-content/70">The AL1350 forgets all MQTT push subscriptions when it power-cycles — a firmware limitation. Think of it like a magazine subscription that cancels every time the publisher restarts their server. If the backend didn't handle this, data would stop flowing silently after every AL1350 reboot.</p>
          <p class="text-base-content/70 mt-1"><strong>Fix:</strong> <code class="font-mono bg-base-200 px-1 rounded">ensure_mqtt_subscription()</code> is called every time the FastAPI backend starts. It re-registers the push subscription unconditionally — so a reboot of either the Pi or the AL1350 automatically restores the data flow within seconds, without anyone needing to intervene.</p>
        </div>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> Why is MQTT better suited than HTTP polling for delivering sensor data every 500 ms?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q1" value="a" class="radio radio-sm radio-secondary"> MQTT uses publish/subscribe so the AL1350 pushes data the moment it is ready, without the Pi having to request each cycle</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q1" value="b" class="radio radio-sm radio-secondary"> HTTP is push-based and uses persistent connections that the broker manages, while MQTT requires a new TCP request each cycle and cannot handle high-frequency data without overloading both devices</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q1" value="c" class="radio radio-sm radio-secondary"> MQTT guarantees delivery of every message in all network conditions by queuing messages until the subscriber acknowledges receipt</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> The AL1350 loses its MQTT subscriptions when it power-cycles. How does the backend handle this?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q2" value="a" class="radio radio-sm radio-secondary"> It waits for the user to manually re-subscribe</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q2" value="b" class="radio radio-sm radio-secondary"> It switches permanently to HTTP polling</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q2" value="c" class="radio radio-sm radio-secondary"> It calls ensure_mqtt_subscription() on every backend startup, re-registering the push subscription automatically</label>
      </div>

      <!-- Concept: WebSocket and what depends on it -->
      <div class="rounded-xl border-2 border-info/30 bg-info/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-sm">🔌 Concept — WebSocket: the last link to the browser</p>
        <div class="rounded-lg bg-base-300/40 border border-base-300 p-3 text-sm text-base-content/70 italic mb-1">
          📞 <strong>Simple version:</strong> A normal web request is like sending a letter — you post it, wait for a reply, then post another. A WebSocket is like leaving a phone call open. Once connected, the server can speak to your browser the moment it has something to say, without hanging up and calling again each time.
        </div>
        <p class="text-sm text-base-content/80">Once the FastAPI backend has decoded the sensor data, it needs to get it to the browser. It uses a <strong>WebSocket</strong> — a persistent, full-duplex TCP connection that stays open for as long as you have the page open.</p>
        <div class="rounded-lg bg-base-200 border border-base-300 p-3 text-xs font-mono space-y-1">
          <p class="text-base-content/50 mb-1">// Compare: HTTP request vs WebSocket</p>
          <p><span class="text-error">HTTP request:</span>  browser opens → request → response → connection closes  (repeat every poll cycle)</p>
          <p><span class="text-success">WebSocket:   </span>  browser opens once → stays open → server pushes whenever data is ready</p>
        </div>
        <p class="text-sm text-base-content/80">The FastAPI backend pushes a new JSON frame through the WebSocket every time a fresh MQTT message arrives from Mosquitto. The browser updates the screen immediately on receipt — no lag from poll intervals.</p>
        <div class="rounded-lg bg-base-300/50 border border-base-300 p-3 text-xs">
          <p class="font-semibold text-base-content mb-1">What breaks if FastAPI goes offline?</p>
          <p class="text-base-content/70">The WebSocket connection is hosted by FastAPI. If the service crashes or is restarted, the connection drops immediately — the browser's WS message counter stops incrementing and live charts go flat. The browser will try to reconnect automatically (exponential backoff), but no data arrives until FastAPI is back up.</p>
          <p class="text-base-content/70 mt-1">The AL1350 is unaffected — it continues publishing MQTT to Mosquitto regardless. As soon as FastAPI restarts and re-subscribes, the data flow resumes.</p>
        </div>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> If the FastAPI backend service on the Pi crashed, what would you expect to observe?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q3" value="a" class="radio radio-sm radio-secondary"> Live data would stop and the WebSocket would disconnect</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q3" value="b" class="radio radio-sm radio-secondary"> The WebSocket message counter on this page would continue to increment at the normal rate</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q3" value="c" class="radio radio-sm radio-secondary"> The AL1350 would automatically restart the backend service via its own built-in watchdog</label>
      </div>

      <!-- Concept: Circuit breaker and latency -->
      <div class="rounded-xl border-2 border-info/30 bg-info/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-sm">⚡ Concept — Circuit breaker pattern and round-trip latency</p>
        <div class="rounded-lg bg-base-300/40 border border-base-300 p-3 text-sm text-base-content/70 italic mb-1">
          🔌 <strong>Simple version:</strong> Like the fuse box in a house. If too many appliances fail at once, the fuse trips to protect everything else from damage. You find the fault, reset the fuse, and power is restored. The circuit breaker in software works the same way — 5 failures in a row trips it, it waits 15 seconds for the fault to clear, then carefully tries one test before fully reopening.
        </div>
        <p class="text-sm text-base-content/80">The backend polls the AL1350 via HTTP once per second as a fallback and for ISDU data. If the AL1350 is unavailable (network fault, power cycle), repeated failing requests would waste resources and slow everything down. The <strong>circuit breaker pattern</strong> prevents this.</p>
        <div class="rounded-lg bg-base-200 border border-base-300 p-3 text-xs space-y-1">
          <p class="font-semibold text-base-content mb-1">Three states:</p>
          <p><span class="text-success font-bold">CLOSED</span> — normal operation. Requests go through. Failures are counted.</p>
          <p><span class="text-error font-bold">OPEN</span> — triggered after 5 consecutive failures. Requests are blocked immediately (no timeout wait). Recovers automatically after 15 s.</p>
          <p><span class="text-warning font-bold">HALF-OPEN</span> — one test request is allowed after the 15 s window. If it succeeds, the breaker closes; if it fails, it opens again.</p>
        </div>
        <div class="rounded-lg bg-base-300/50 border border-base-300 p-3 text-xs">
          <p class="font-semibold text-base-content mb-1">Round-trip latency (RTT)</p>
          <p class="text-base-content/70">RTT is how long it takes to send a request to the AL1350 and get a reply — like timing how long it takes to shout across a room and hear "yes!" back. On the same network switch, this should be fast (20–80 ms). If it climbs above 200 ms consistently, the AL1350 is struggling or the network between the Pi and the master is congested.</p>
          <p class="text-base-content/70 mt-1">Normal latency to the AL1350 on the same subnet: <strong>20–80 ms</strong>. High RTT does not indicate Wi-Fi issues between your laptop and the Pi — that is a completely separate path.</p>
        </div>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q4.</strong> What does a consistently high round-trip latency value on the Connection Diagnostics page indicate?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q4" value="a" class="radio radio-sm radio-secondary"> The browser's chart rendering pipeline cannot keep up with the WebSocket update rate</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q4" value="b" class="radio radio-sm radio-secondary"> The AL1350 is under load or there is congestion on the IO-Link subnet</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q4" value="c" class="radio radio-sm radio-secondary"> The Pi's Wi-Fi interface is saturated by other traffic on the building network</label>
      </div>

      <!-- Verification — trace the live data path -->
      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-4">
        <p class="font-bold text-base-content text-base">🎯 Verification — trace the live data path</p>
        <p class="text-sm text-base-content/80">WS2 explained three links: MQTT (AL1350 → Mosquitto → FastAPI), WebSocket (FastAPI → your browser), and the circuit breaker (HTTP resilience). Complete each step below to prove you can see and interpret each link in real time.</p>

        <!-- Step 1: MQTT rate — id="cp2-sys-panel" triggers initLiveCp2Intro which updates these IDs -->
        <div id="cp2-sys-panel" class="rounded-lg border-2 border-success/30 bg-base-200 p-3 space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-success uppercase tracking-wide">Step 1 — Verify the MQTT → WebSocket rate</p>
            <span id="cp2-sys-badge" class="badge badge-xs badge-ghost font-mono">OFFLINE</span>
          </div>
          <p class="text-xs text-base-content/70">The panel below updates live from the WebSocket. The AL1350 publishes every 500 ms so the message counter should climb at <strong>~2 per second</strong>. Watch it for 10 seconds — it should advance by roughly 20.</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
            <div class="rounded bg-base-100 border border-base-300 p-2 text-center space-y-1">
              <p class="text-xs text-base-content/50">AL1350 master</p>
              <div id="cp2-master-dot" class="w-5 h-5 rounded-full bg-base-300 mx-auto transition-all"></div>
              <p id="cp2-master-label" class="text-xs font-bold text-base-content">—</p>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2 text-center space-y-1">
              <p class="text-xs text-base-content/50">IO-Link ports active</p>
              <p id="cp2-port-count" class="text-2xl font-black font-mono text-secondary leading-none">—</p>
              <p class="text-xs text-base-content/50">of 4</p>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2 text-center space-y-1">
              <p class="text-xs text-base-content/50">WS messages received</p>
              <p id="cp2-msg-count" class="text-2xl font-black font-mono text-secondary leading-none">0</p>
              <p class="text-xs text-base-content/50">this session</p>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2 text-center space-y-1">
              <p class="text-xs text-base-content/50">Last update</p>
              <p id="cp2-last-update" class="text-xs font-mono font-bold text-base-content">—</p>
            </div>
          </div>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text text-sm">The WS message counter is incrementing and the status badge shows <strong>LIVE</strong> — the full MQTT → Mosquitto → FastAPI → WebSocket chain is working</span>
          </label>
        </div>

        <!-- Step 2: Circuit breaker + RTT -->
        <div class="rounded-lg border-2 border-primary/30 bg-base-200 p-3 space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-primary uppercase tracking-wide">Step 2 — Read the circuit breaker and latency</p>
            <span id="cp2-diag-badge" class="badge badge-xs badge-ghost font-mono">—</span>
          </div>
          <p class="text-xs text-base-content/70">The circuit breaker protects the HTTP path to the AL1350. It should be <strong>CLOSED</strong> (normal). The RTT graph shows how long each HTTP poll takes — healthy is 20–80 ms. A spike above 200 ms means the AL1350 is under load, not a Wi-Fi problem.</p>
          <div class="grid grid-cols-4 gap-2 text-center mt-1">
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">Circuit Breaker</div>
              <div id="cp2-diag-circuit" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">Success Rate</div>
              <div id="cp2-diag-success" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">MQTT</div>
              <div id="cp2-diag-mqtt" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">RTT p95</div>
              <div id="cp2-diag-p95" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
          </div>
          <div class="h-28 mt-1"><canvas id="cp2-diag-latency-chart"></canvas></div>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text text-sm">Circuit breaker is <strong>CLOSED</strong> and RTT is below 200 ms — the HTTP path and circuit breaker are working correctly</span>
          </label>
        </div>

        <!-- Step 3: decoder.py calculation — live temperature from WS data -->
        <div class="rounded-lg border-2 border-info/30 bg-base-200 p-3 space-y-2">
          <p class="text-xs font-semibold text-info uppercase tracking-wide">Step 3 — Trace decoder.py on a live value</p>
          <p class="text-xs text-base-content/70">The panel below pulls the live temperature from Port 3 (IFM TV7105) directly from the WebSocket — the same value shown on the HMI dashboard. decoder.py applies this formula on every MQTT tick:</p>
          <div class="rounded bg-base-100 border border-base-300 p-2 font-mono text-xs text-center">
            PDin bytes 0–1 → signed int16 → <strong>÷ 10</strong> → °C
          </div>
          <!-- Live decode display — updated by initLiveCp2Intro -->
          <div class="rounded bg-base-100 border border-info/30 p-3 mt-1">
            <p class="text-xs text-base-content/50 mb-2 font-semibold uppercase tracking-wide">Port 3 — IFM TV7105 — live decode</p>
            <div class="flex flex-wrap items-center justify-around gap-3 text-center">
              <div>
                <div id="cp2-ws2-temp-c" class="text-3xl font-black font-mono text-warning leading-none">—</div>
                <div class="text-xs text-base-content/50 mt-1">temperature °C</div>
              </div>
              <div class="text-xl text-base-content/30 font-mono">× 10 =</div>
              <div>
                <div id="cp2-ws2-temp-raw" class="text-3xl font-black font-mono text-info leading-none">—</div>
                <div class="text-xs text-base-content/50 mt-1">raw int16</div>
              </div>
              <div class="text-xl text-base-content/30 font-mono">= hex</div>
              <div>
                <div id="cp2-ws2-temp-hex" class="text-3xl font-black font-mono text-secondary leading-none">—</div>
                <div class="text-xs text-base-content/50 mt-1">PDin bytes 0–1</div>
              </div>
            </div>
            <p class="text-xs text-base-content/40 mt-2 text-center">Updates every 500 ms from the live WebSocket feed</p>
          </div>
          <div class="rounded bg-warning/10 border border-warning/30 p-2 mt-1 flex items-start gap-2">
            <span class="text-warning text-base leading-none mt-0.5">✋</span>
            <p class="text-xs text-base-content/80"><strong>Try it:</strong> Hold the temperature probe between your fingers and watch the °C, raw int16, and hex all climb together in real time. Let go and watch them fall back. Every change you see is a fresh PDin frame decoded by decoder.py arriving over MQTT.</p>
          </div>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text text-sm">I held the probe, watched the raw int16 and hex change, and can explain that each update is decoder.py converting a fresh PDin payload from the AL1350</span>
          </label>
        </div>

        <!-- Edge Device (kept for context only) -->
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 space-y-2">
          <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Edge device — quick check</p>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">Backend API</div>
              <div id="cp2-edge-backend" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">CPU</div>
              <div id="cp2-edge-cpu" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">CPU Temp</div>
              <div id="cp2-edge-cputemp" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 3,
    title: 'How Each Sensor Works (Protocol Level)',
    shortDesc: 'PDin decoding for all four devices.',
    estimatedTime: 'About 20 min',
    whyItMatters: 'Every IO-Link sensor sends a raw binary process data (PDin) payload. The master delivers it as a hex string; the backend decodes it into human-readable values. Understanding this decode layer is essential for integrating sensors into PLCs, historians, and digital twin platforms.',
    relatedLearn: '',
    relatedDashboard: 'Dashboard: Active Port Details (Raw PDin)',
    prerequisites: 'Complete CP7395 Worksheet 1',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">Every sensor in this kit sends a short coded message every millisecond — called <strong>PDin</strong> (Process Data In). The AL1350 master passes it on without reading it, like a postman delivering an unopened envelope. It's the backend software (<code class="font-mono text-xs bg-base-300 px-1 rounded">decoder.py</code>) that opens the envelope and translates the bytes into values you can read — like <em>24.5 °C</em> or <em>object detected</em>.</p>
      <p class="text-base-content/70 text-sm mt-2">This worksheet looks at how each sensor's PDin is structured, and what each byte means.</p>

      <!-- Overview checklist -->
      <div class="space-y-2 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Quick summary — tick each when you understand it</p>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text text-sm"><strong>Port 1 — OMRON proximity:</strong> Sends 2 bytes. Byte 0 is the signal strength (~80 in free air). Byte 1 holds the status flags — bit 0 = object detected, bit 4 = instability alarm, bit 5 = too close alarm.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text text-sm"><strong>Port 2 — Capacitive sensor:</strong> Sends 4 bytes. The first two bytes give a continuous field-strength reading — it rises as you bring your hand close. Byte 2 holds the switching output (SSC1) that turns ON when the reading crosses the setpoint.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text text-sm"><strong>Port 3 — Temperature sensor:</strong> Sends 4 bytes. The first two encode temperature as a whole number (°C × 10). So 24.5 °C is stored as 245. The decoder divides by 10 to get degrees back. Byte 3 holds the setpoint alarm outputs.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text text-sm"><strong>Port 4 — CL50 light stack:</strong> This device only <em>receives</em> commands — it sends nothing back. Instead of PDin, you write a PDout command telling it what colour and animation to show. Covered in Worksheet 11.</span>
        </label>
      </div>

      <!-- PDin decode pipeline diagram (preserved exactly) -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">PDin decode pipeline — raw hex → human value</p>
        <svg viewBox="0 0 570 210" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <defs>
            <marker id="ws3-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8"/></marker>
          </defs>
          <text x="70" y="18" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">RAW PDin (hex)</text>
          <text x="285" y="18" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">decoder.py</text>
          <text x="490" y="18" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">DECODED VALUE</text>
          <rect x="5" y="26" width="130" height="34" rx="5" fill="#1e3a5f"/>
          <text x="70" y="40" text-anchor="middle" fill="#93c5fd" font-size="9" font-weight="600">Proximity Port 1</text>
          <text x="70" y="52" text-anchor="middle" fill="#bfdbfe" font-size="8" font-style="italic">E2E-X16 (2 bytes, 16-bit)</text>
          <line x1="135" y1="43" x2="200" y2="43" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#ws3-arr)"/>
          <rect x="200" y="26" width="170" height="34" rx="5" fill="#1e293b"/>
          <text x="285" y="40" text-anchor="middle" fill="#e2e8f0" font-size="8">bits 0,4,5 → state + alarms</text>
          <text x="285" y="52" text-anchor="middle" fill="#64748b" font-size="7">IO-Link 1.1 — full ISDU access</text>
          <line x1="370" y1="43" x2="425" y2="43" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#ws3-arr)"/>
          <rect x="425" y="26" width="138" height="34" rx="5" fill="#1e3a5f"/>
          <text x="494" y="40" text-anchor="middle" fill="#93c5fd" font-size="9" font-weight="600">object_present + alarms</text>
          <text x="494" y="52" text-anchor="middle" fill="#bfdbfe" font-size="8">instability / over-approach</text>
          <rect x="5" y="70" width="130" height="34" rx="5" fill="#3b1f6b"/>
          <text x="70" y="84" text-anchor="middle" fill="#ddd6fe" font-size="9" font-weight="600">Capacitive Port 2</text>
          <text x="70" y="96" text-anchor="middle" fill="#c4b5fd" font-size="8" font-style="italic">bit 0 + count bytes</text>
          <line x1="135" y1="87" x2="200" y2="87" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#ws3-arr)"/>
          <rect x="200" y="70" width="170" height="34" rx="5" fill="#1e293b"/>
          <text x="285" y="84" text-anchor="middle" fill="#e2e8f0" font-size="8">bit 0 → state; count → session total</text>
          <text x="285" y="96" text-anchor="middle" fill="#64748b" font-size="7">IO-Link 1.1 — ISDU writable</text>
          <line x1="370" y1="87" x2="425" y2="87" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#ws3-arr)"/>
          <rect x="425" y="70" width="138" height="34" rx="5" fill="#3b1f6b"/>
          <text x="494" y="84" text-anchor="middle" fill="#ddd6fe" font-size="9" font-weight="600">state + detections: 42</text>
          <text x="494" y="96" text-anchor="middle" fill="#c4b5fd" font-size="8">running count</text>
          <rect x="5" y="114" width="130" height="34" rx="5" fill="#78350f"/>
          <text x="70" y="128" text-anchor="middle" fill="#fde68a" font-size="9" font-weight="600">TV7105 Port 3</text>
          <text x="70" y="140" text-anchor="middle" fill="#fcd34d" font-size="8" font-style="italic">0x00F5 … (4 bytes)</text>
          <line x1="135" y1="131" x2="200" y2="131" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#ws3-arr)"/>
          <rect x="200" y="114" width="170" height="34" rx="5" fill="#1e293b"/>
          <text x="285" y="128" text-anchor="middle" fill="#e2e8f0" font-size="8">bytes 0-1 = int16 ÷ 10 → °C</text>
          <text x="285" y="140" text-anchor="middle" fill="#64748b" font-size="7">bytes 2-3 = SP1/SP2 flags</text>
          <line x1="370" y1="131" x2="425" y2="131" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#ws3-arr)"/>
          <rect x="425" y="114" width="138" height="34" rx="5" fill="#78350f"/>
          <text x="494" y="128" text-anchor="middle" fill="#fde68a" font-size="9" font-weight="600">temperature: 24.5 °C</text>
          <text x="494" y="140" text-anchor="middle" fill="#fcd34d" font-size="8">± 0.1 °C resolution</text>
          <rect x="5" y="158" width="130" height="34" rx="5" fill="#134e4a"/>
          <text x="70" y="172" text-anchor="middle" fill="#99f6e4" font-size="9" font-weight="600">CL50 Port 4</text>
          <text x="70" y="184" text-anchor="middle" fill="#6ee7b7" font-size="8" font-style="italic">multi-bit colour fields</text>
          <line x1="135" y1="175" x2="200" y2="175" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#ws3-arr)"/>
          <rect x="200" y="158" width="170" height="34" rx="5" fill="#1e293b"/>
          <text x="285" y="172" text-anchor="middle" fill="#e2e8f0" font-size="8">bit fields → R/A/G × on/flash/off</text>
          <text x="285" y="184" text-anchor="middle" fill="#64748b" font-size="7">complex multi-channel decode</text>
          <line x1="370" y1="175" x2="425" y2="175" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#ws3-arr)"/>
          <rect x="425" y="158" width="138" height="34" rx="5" fill="#134e4a"/>
          <text x="494" y="172" text-anchor="middle" fill="#99f6e4" font-size="9" font-weight="600">&#123;red:'flash',green:'on'&#125;</text>
          <text x="494" y="184" text-anchor="middle" fill="#6ee7b7" font-size="8">state per colour channel</text>
        </svg>
      </div>

      <!-- Concept card: What is PDin and why hex -->
      <div class="rounded-xl border border-info/30 bg-info/5 p-4 mt-4 space-y-2">
        <p class="font-semibold text-base-content text-sm">What is PDin and why does it look like gibberish?</p>
        <p class="text-sm text-base-content/80 leading-relaxed">Each sensor sends its reading as a short sequence of bytes — typically just 2 to 4 bytes. Because computers store numbers in binary, those bytes look like a hex code when you read them raw. For example: <code class="font-mono text-xs bg-base-300 px-1 rounded">5100</code> (proximity sensor in free air) or <code class="font-mono text-xs bg-base-300 px-1 rounded">00F50000</code> (temperature sensor at 24.5 °C).</p>
        <p class="text-sm text-base-content/80 leading-relaxed">The AL1350 master doesn't try to understand those bytes — it just passes them on, like a switch. It's <code class="font-mono text-xs bg-base-300 px-1 rounded">decoder.py</code> in the backend that knows what each byte means for each specific sensor, and converts it into a number your dashboard can display.</p>
      </div>

      <div class="space-y-4 mt-3">

        <!-- Port 1: OMRON E2E concept card + live panel + Q1 -->
        <div class="rounded-xl border border-info/30 bg-info/5 p-4 space-y-3">
          <p class="font-semibold text-base-content text-sm">Port 1 — OMRON Proximity Sensor</p>
          <p class="text-sm text-base-content/80 leading-relaxed">This sensor sends <strong>2 bytes</strong> of data every cycle.</p>
          <p class="text-sm text-base-content/80 leading-relaxed"><strong>Byte 0</strong> is the signal strength — a number around 80 in free air, showing how strongly the sensor is oscillating. It doesn't tell you whether something is there; it tells you how confidently the sensor is working.</p>
          <p class="text-sm text-base-content/80 leading-relaxed"><strong>Byte 1</strong> holds the actual status flags. Bit 0 is the one you care about most — it goes to 1 when a metal object is detected.</p>
          <div class="overflow-x-auto">
            <table class="table table-xs w-full font-mono text-xs">
              <thead>
                <tr class="text-base-content/60">
                  <th>Byte</th>
                  <th>Bits</th>
                  <th>Field</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="text-warning font-bold">Byte 0</td>
                  <td>[7:0]</td>
                  <td>Monitor output (oscillation amplitude)</td>
                  <td class="text-base-content/70">uint8 — typically ~80 in free air. <span class="text-error font-semibold">NOT a status byte.</span></td>
                </tr>
                <tr>
                  <td class="text-info font-bold">Byte 1</td>
                  <td>bit 0</td>
                  <td>OUT1 — object detected</td>
                  <td class="text-base-content/70">1 = metal target within range</td>
                </tr>
                <tr>
                  <td class="text-info font-bold">Byte 1</td>
                  <td>bit 4</td>
                  <td>Instability Detection Alarm</td>
                  <td class="text-base-content/70">Oscillation unstable — sensing margin low</td>
                </tr>
                <tr>
                  <td class="text-info font-bold">Byte 1</td>
                  <td>bit 5</td>
                  <td>Over-Approach Alarm</td>
                  <td class="text-base-content/70">Target too close to sensor face</td>
                </tr>
                <tr>
                  <td class="text-info font-bold">Byte 1</td>
                  <td>bit 6</td>
                  <td>Warning flag</td>
                  <td class="text-base-content/70">General advisory</td>
                </tr>
                <tr>
                  <td class="text-info font-bold">Byte 1</td>
                  <td>bit 7</td>
                  <td>Error flag</td>
                  <td class="text-base-content/70">Hardware fault</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Live PDin panel — Port 1 -->
          <div id="cp2-ws3-panel" class="rounded-lg border-2 border-base-300 bg-base-100 p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Port 1 — Live PDin (hold metal near the sensor)</span>
              <span id="cp2-ws3-badge" class="badge badge-xs badge-ghost font-mono">OFFLINE</span>
            </div>
            <!-- Byte breakdown -->
            <div class="flex flex-wrap items-center justify-center gap-2 font-mono text-center mb-3">
              <div class="rounded-lg bg-warning/15 border border-warning/40 px-4 py-2 min-w-16">
                <div id="cp2-ws3-byte0" class="text-3xl font-black text-warning leading-none">--</div>
                <div class="text-xs text-base-content/50 mt-1">Byte 0</div>
                <div class="text-xs text-base-content/40">monitor amp</div>
              </div>
              <div class="text-base-content/30 font-mono text-lg">·</div>
              <div class="rounded-lg bg-info/15 border border-info/40 px-4 py-2 min-w-16">
                <div id="cp2-ws3-byte1" class="text-3xl font-black text-info leading-none">--</div>
                <div class="text-xs text-base-content/50 mt-1">Byte 1</div>
                <div class="text-xs text-base-content/40">flags</div>
              </div>
              <div class="text-base-content/30 text-sm mx-1">=</div>
              <div class="rounded-lg bg-base-200 border border-base-300 px-4 py-2">
                <div id="cp2-ws3-pdin" class="text-3xl font-black leading-none">----</div>
                <div class="text-xs text-base-content/50 mt-1">raw PDin hex</div>
              </div>
            </div>
            <!-- Status indicators -->
            <div class="grid grid-cols-2 gap-2 text-center text-xs">
              <div class="rounded-lg bg-base-200 border border-base-300 p-2">
                <div id="cp2-ws3-out1-dot" class="w-7 h-7 rounded-full mx-auto mb-1 bg-base-300 transition-all duration-200"></div>
                <div id="cp2-ws3-out1" class="font-bold font-mono text-sm">NO OBJECT</div>
                <div class="text-base-content/50 mt-0.5">OUT1 — byte 1 bit 0</div>
              </div>
              <div class="rounded-lg bg-base-200 border border-base-300 p-2">
                <div id="cp2-ws3-mon" class="text-2xl font-black font-mono">--</div>
                <div class="text-base-content/50 mt-0.5">Monitor amplitude (byte 0)</div>
                <div class="text-base-content/40 text-xs">~80 in free air — stays stable</div>
              </div>
            </div>
            <!-- Alarm row -->
            <div class="grid grid-cols-3 gap-1 mt-2 text-center text-xs">
              <div class="rounded bg-base-200 border border-base-300 p-1">
                <div id="cp2-ws3-instab" class="font-mono font-bold text-base-content/50">CLEAR</div>
                <div class="text-base-content/40">Instability (bit 4)</div>
              </div>
              <div class="rounded bg-base-200 border border-base-300 p-1">
                <div id="cp2-ws3-overapp" class="font-mono font-bold text-base-content/50">CLEAR</div>
                <div class="text-base-content/40">Over-approach (bit 5)</div>
              </div>
              <div class="rounded bg-base-200 border border-base-300 p-1">
                <div id="cp2-ws3-warn" class="font-mono font-bold text-base-content/50">CLEAR</div>
                <div class="text-base-content/40">Warning (bit 6)</div>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-base-300 bg-base-200 p-4">
          <p class="font-semibold text-base-content">Check your understanding — Port 1</p>
          <p class="text-base-content/80 text-sm mt-1">PDin hex <code class="font-mono bg-base-300 px-1 rounded">5101</code> means: byte 0 = <code class="font-mono bg-base-300 px-1 rounded">0x51</code> (signal strength = 81), byte 1 = <code class="font-mono bg-base-300 px-1 rounded">0x01</code> (bit 0 is set).</p>
          <p class="mt-2 font-medium text-base-content text-sm"><strong>Q:</strong> What does a byte 1 value of <code class="font-mono bg-base-300 px-1 rounded">0x01</code> tell you?</p>
          <div class="space-y-1 mt-1">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q1" value="a" class="radio radio-xs radio-secondary"> Object detected (bit 0 = 1)</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q1" value="b" class="radio radio-xs radio-secondary"> No object detected</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q1" value="c" class="radio radio-xs radio-secondary"> Sensor fault</label>
          </div>
        </div>

        <div class="rounded-lg border border-base-300 bg-base-200 p-4 space-y-2">
          <p class="font-semibold text-base-content">Port 2 — Capacitive Sensor (RS Pro M18)</p>
          <p class="text-base-content/80 text-sm mt-1">This sensor sends <strong>4 bytes</strong>. Unlike a simple on/off sensor, it gives you a continuous reading.</p>
          <p class="text-base-content/80 text-sm"><strong>Bytes 0–1</strong> form a single number — the field strength. The closer or denser the object near the sensor face, the higher this number climbs.</p>
          <p class="text-base-content/80 text-sm"><strong>Byte 2 bit 0</strong> is the switching output (SSC1) — it flips ON when the field strength crosses the setpoint you've configured.</p>
          <!-- Live PDin panel — Port 2 -->
          <div class="rounded-lg border-2 border-base-300 bg-base-100 p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Port 2 — Live PDin (hold your hand near the sensor)</span>
              <span id="cp2-ws3-cap-badge" class="badge badge-xs badge-ghost font-mono">OFFLINE</span>
            </div>
            <div class="flex flex-wrap items-center justify-center gap-2 font-mono text-center">
              <div class="rounded-lg bg-purple-500/10 border border-purple-500/30 px-4 py-2">
                <div id="cp2-ws3-cap-pdin" class="text-2xl font-black text-purple-400 leading-none">--------</div>
                <div class="text-xs text-base-content/50 mt-1">raw PDin (4 bytes)</div>
              </div>
              <div class="text-base-content/30 text-sm">→</div>
              <div class="rounded-lg bg-base-200 border border-base-300 px-4 py-2 text-center">
                <div id="cp2-ws3-cap-diel" class="text-2xl font-black leading-none">--</div>
                <div class="text-xs text-base-content/50 mt-1">dielectric (bytes 0–1)</div>
              </div>
              <div class="rounded-lg border border-base-300 px-3 py-2 text-center">
                <div id="cp2-ws3-cap-dot" class="w-6 h-6 rounded-full mx-auto mb-1 bg-base-300 transition-all duration-200"></div>
                <div id="cp2-ws3-cap-ssc1" class="font-bold font-mono text-xs">SO1 OFF</div>
                <div class="text-xs text-base-content/40">output (byte 3 bit 0)</div>
              </div>
            </div>
          </div>
          <p class="mt-2 font-medium text-base-content text-sm"><strong>Q:</strong> Why is a detection count more useful than just the current switching state for a capacitive level sensor on a filling line?</p>
          <div class="space-y-1 mt-1">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q2" value="a" class="radio radio-xs radio-secondary"> It gives a continuous analogue level reading rather than a binary on/off output</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q2" value="b" class="radio radio-xs radio-secondary"> It prevents false positives caused by water or foam near the sensor face</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q2" value="c" class="radio radio-xs radio-secondary"> A running count tracks how many containers have been filled without a separate counter sensor</label>
          </div>
        </div>

        <!-- Port 3: Temperature concept card + live panel + Q3 -->
        <div class="rounded-xl border border-info/30 bg-info/5 p-4 space-y-2">
          <p class="font-semibold text-base-content text-sm">Port 3 — Temperature Sensor (IFM TV7105)</p>
          <p class="text-sm text-base-content/80 leading-relaxed">This sensor uses a simple trick to send decimal temperatures as a whole number: it multiplies the °C value by 10 before sending.</p>
          <p class="text-sm text-base-content/80 leading-relaxed">So 24.5 °C becomes <strong>245</strong>. The decoder divides by 10 to get back to degrees. That's the entire formula.</p>
          <div class="rounded-lg bg-base-300/60 p-3 font-mono text-xs space-y-1">
            <div>24.5 °C &nbsp;→&nbsp; × 10 = <strong>245</strong> &nbsp;→&nbsp; hex: 0x00F5</div>
            <div>75.0 °C &nbsp;→&nbsp; × 10 = <strong>750</strong> &nbsp;→&nbsp; hex: 0x02EE</div>
            <div>-5.0 °C &nbsp;→&nbsp; × 10 = <strong>-50</strong> &nbsp;→&nbsp; hex: 0xFFCE &nbsp;<span class="text-base-content/50">(negative wraps around)</span></div>
          </div>
          <p class="text-xs text-base-content/60">Negative temperatures still use the same formula. The decoder handles the negative number automatically — you don't need to worry about how it works under the hood.</p>
          <!-- Live PDin panel — Port 3 -->
          <div class="rounded-lg border-2 border-base-300 bg-base-100 p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Port 3 — Live PDin (hold the probe to warm it)</span>
              <span id="cp2-ws3-temp-badge" class="badge badge-xs badge-ghost font-mono">OFFLINE</span>
            </div>
            <div class="flex flex-wrap items-center justify-center gap-2 font-mono text-center">
              <div class="rounded-lg bg-base-200 border border-base-300 px-4 py-2">
                <div id="cp2-ws3-temp-pdin" class="text-2xl font-black leading-none">--------</div>
                <div class="text-xs text-base-content/50 mt-1">raw PDin (4 bytes)</div>
              </div>
              <div class="text-base-content/30 text-sm">→ bytes 0–1 →</div>
              <div class="rounded-lg bg-orange-500/10 border border-orange-500/30 px-4 py-2">
                <div id="cp2-ws3-temp-raw" class="text-2xl font-black text-orange-400 leading-none">--</div>
                <div class="text-xs text-base-content/50 mt-1">int16 (÷ 10)</div>
              </div>
              <div class="text-base-content/30 text-sm">=</div>
              <div class="rounded-lg bg-warning/15 border border-warning/40 px-4 py-2">
                <div id="cp2-ws3-temp-c" class="text-2xl font-black text-warning leading-none">--</div>
                <div class="text-xs text-base-content/50 mt-1">°C</div>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-base-300 bg-base-200 p-4">
          <p class="font-semibold text-base-content">Check your understanding — Port 3</p>
          <p class="text-base-content/80 text-sm mt-1">The raw PDin for the temperature sensor is 4 bytes. The first two bytes hold the temperature reading (as °C × 10). The last byte holds the alarm outputs — bit 0 for OUT1 (SP1 exceeded), bit 1 for OUT2 (SP2 exceeded).</p>
          <p class="mt-2 font-medium text-base-content text-sm"><strong>Q:</strong> The live panel above shows a raw PDin of <code class="font-mono bg-base-300 px-1 rounded">0x02EE</code> in bytes 0–1. In decimal that's 750. What temperature does that represent?</p>
          <div class="space-y-1 mt-1">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q3" value="a" class="radio radio-xs radio-secondary"> 7.5 °C</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q3" value="b" class="radio radio-xs radio-secondary"> 750.0 °C</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q3" value="c" class="radio radio-xs radio-secondary"> 75.0 °C</label>
          </div>
        </div>

        <div class="rounded-lg border border-base-300 bg-base-200 p-4 space-y-3">
          <p class="font-semibold text-base-content">Port 4 — CL50 Light Stack (Banner CL50PKQ)</p>
          <p class="text-base-content/80 text-sm">This device works the opposite way to the sensors — it <em>receives</em> commands rather than sending data. There is no PDin coming back from it.</p>
          <p class="text-base-content/80 text-sm">Instead, you send a <strong>PDout</strong> command — a 3-byte hex string that tells the light what colour to show, how to animate it, and how bright to be. Every field is packed into specific bit positions across those 3 bytes.</p>

          <!-- PDout interactive builder -->
          <div id="cp2-ws3-cl50" class="rounded-lg border-2 border-teal-500/30 bg-base-100 p-3 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">PDout builder — control the real light</span>
              <span class="badge badge-xs badge-info font-mono">WRITE-ONLY</span>
            </div>

            <!-- Colour picker -->
            <div>
              <p class="text-xs text-base-content/50 mb-2">Pick a colour:</p>
              <div class="flex flex-wrap gap-2">
                <button data-cl50color="0"  data-cl50css="#22c55e" class="cp2-cl50-color w-8 h-8 rounded-full border-2 border-transparent transition-all" style="background:#22c55e" title="Green"></button>
                <button data-cl50color="1"  data-cl50css="#ef4444" class="cp2-cl50-color w-8 h-8 rounded-full border-2 border-transparent transition-all" style="background:#ef4444" title="Red"></button>
                <button data-cl50color="2"  data-cl50css="#f97316" class="cp2-cl50-color w-8 h-8 rounded-full border-2 border-transparent transition-all" style="background:#f97316" title="Orange"></button>
                <button data-cl50color="3"  data-cl50css="#f59e0b" class="cp2-cl50-color w-8 h-8 rounded-full border-2 border-transparent transition-all" style="background:#f59e0b" title="Amber"></button>
                <button data-cl50color="4"  data-cl50css="#eab308" class="cp2-cl50-color w-8 h-8 rounded-full border-2 border-transparent transition-all" style="background:#eab308" title="Yellow"></button>
                <button data-cl50color="9"  data-cl50css="#3b82f6" class="cp2-cl50-color w-8 h-8 rounded-full border-2 border-transparent transition-all" style="background:#3b82f6" title="Blue"></button>
                <button data-cl50color="11" data-cl50css="#d946ef" class="cp2-cl50-color w-8 h-8 rounded-full border-2 border-transparent transition-all" style="background:#d946ef" title="Magenta"></button>
                <button data-cl50color="13" data-cl50css="#f1f5f9" class="cp2-cl50-color w-8 h-8 rounded-full border-2 border-base-content/20 transition-all" style="background:#f1f5f9" title="White"></button>
              </div>
            </div>

            <!-- Animation picker -->
            <div>
              <p class="text-xs text-base-content/50 mb-2">Animation:</p>
              <div class="flex gap-2">
                <button data-cl50anim="1" class="cp2-cl50-anim btn btn-xs btn-outline btn-active">Steady</button>
                <button data-cl50anim="2" class="cp2-cl50-anim btn btn-xs btn-outline">Flash</button>
                <button data-cl50anim="0" class="cp2-cl50-anim btn btn-xs btn-outline">Off</button>
              </div>
            </div>

            <!-- Live hex breakdown -->
            <div class="rounded-lg bg-base-200 border border-base-300 p-3">
              <p class="text-xs text-base-content/50 mb-2 text-center">PDout — 3 bytes sent to the light</p>
              <div class="flex items-stretch justify-center gap-1 font-mono text-center text-xs mb-2">
                <div class="flex-1 rounded bg-base-300 p-2">
                  <div class="text-base-content/50 mb-1">Byte 0</div>
                  <div id="cp2-ws3-cl50-b0" class="text-xl font-black">00</div>
                  <div class="text-base-content/40 mt-1">intensity</div>
                </div>
                <div class="flex-1 rounded bg-base-300 p-2">
                  <div class="text-base-content/50 mb-1">Byte 1</div>
                  <div id="cp2-ws3-cl50-b1" class="text-xl font-black">01</div>
                  <div class="text-base-content/40 mt-1">animation</div>
                </div>
                <div class="flex-1 rounded bg-base-300 p-2">
                  <div class="text-base-content/50 mb-1">Byte 2</div>
                  <div id="cp2-ws3-cl50-b2" class="text-xl font-black">00</div>
                  <div class="text-base-content/40 mt-1">colour</div>
                </div>
              </div>
              <div class="flex items-center justify-center gap-3">
                <div id="cp2-ws3-cl50-swatch" class="w-8 h-8 rounded-full border-2 border-base-content/20 flex-shrink-0 transition-all" style="background:#22c55e"></div>
                <div id="cp2-ws3-cl50-hex" class="text-3xl font-black font-mono tracking-widest">000100</div>
              </div>
            </div>

            <button id="cp2-ws3-cl50-send" class="btn btn-sm btn-primary w-full">Send to light →</button>
            <p id="cp2-ws3-cl50-status" class="text-xs text-center text-base-content/50 h-4"></p>
          </div>

          <p class="mt-1 font-medium text-base-content text-sm"><strong>Q:</strong> Why does building a PDout command require more care than just reading PDin from a sensor?</p>
          <div class="space-y-1 mt-1">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q4" value="a" class="radio radio-xs radio-secondary"> Multiple fields — colour, animation, intensity, and speed — must be packed into exact bit positions across 3 bytes. One wrong bit changes the entire behaviour</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q4" value="b" class="radio radio-xs radio-secondary"> It uses a completely different IO-Link variant that the standard binary decoder cannot process</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q4" value="c" class="radio radio-xs radio-secondary"> The CL50 PDin arrives as a plain text string rather than binary bytes</label>
          </div>
        </div>
      </div>

      <div id="cp2-ws2-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1 (proximity): a — byte 1 bit 0 = 1 means object present (metal target within sensing range). Byte 0 is the oscillation monitor, not a flag byte. Q2 (capacitive): c — a running count tracks how many containers have been filled. Q3 (temperature): c — 0x02EE = 750 → 750/10 = 75.0 °C. Q4 (CL50): a — multiple fields (colour, animation, intensity, speed) must be packed into specific bit positions across 3 bytes; one wrong bit changes the entire behaviour.</div>
    `
  },
  {
    id: 4,
    title: 'Benefits for Maintenance',
    shortDesc: 'Match problems to IO-Link features.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'Mapping IO-Link features to real maintenance problems is how you make the ROI case for an Industry 4.0 investment — turning raw protocol features into tangible operational outcomes.',
    relatedLearn: '',
    relatedDashboard: 'Dashboard: Port status and events',
    prerequisites: 'Complete CP7395 Worksheets 1–2',
    contentHtml: `
<p class="text-base-content/90 leading-relaxed text-base">IO-Link transforms maintenance from <strong>reactive</strong> (find the fault, fix it, lose production time) to <strong>proactive</strong> (predict problems before they cause downtime). Each feature below maps to a real maintenance scenario — the matching exercise shows exactly which IO-Link capability eliminates which operational pain point.</p>

      <!-- Understand the features checklist -->
      <div class="rounded-xl border-2 border-secondary/30 bg-secondary/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content">🔍 Read and tick each feature when you understand how it helps maintenance:</p>
        <div class="space-y-2 text-sm">
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>Diagnostic events</strong> — IO-Link sensors report health warnings before a complete failure. The OMRON E2E on Port 1 raises an instability alarm when its oscillation amplitude drops — visible on the HMI while the output is still switching normally. You get a heads-up before a shutdown, not after.</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>Device identity (Vendor ID + Device ID)</strong> — every IO-Link sensor broadcasts its manufacturer ID and model number at power-up. Port 1 identifies as Vendor 612 (OMRON), Device 131090 (E2E-X16MB1T12) — visible on the IO-Link Master page. When a sensor fails you already know the port, the exact part to order, and the master can auto-restore parameters after a like-for-like swap.</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>Parameter storage and Automatic Device Replacement (ADR)</strong> — setpoints and output logic are stored in the IO-Link master, not only in the sensor. When a sensor is swapped, the AL1350 checks the Vendor ID and Device ID match, then writes all parameters back within seconds. For the TV7105 on Port 3: SP1, RP1, SP2, RP2, and calibration offset all restore automatically — zero re-commissioning time.</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>Operating hours and cycle count</strong> — IO-Link sensors expose cumulative cycle counters via ISDU. The capacitive sensor on Port 2 shows a running detection count on the Dashboard. Instead of replacing on a fixed calendar schedule, you replace when the count approaches the manufacturer's rated lifetime — planned during a shutdown, not as an emergency callout.</span>
          </label>
        </div>
      </div>

      <!-- Standard vs IO-Link comparison diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">Maintenance response — Standard vs IO-Link</p>
        <svg viewBox="0 0 570 240" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <rect x="10" y="10" width="230" height="210" rx="10" fill="#7f1d1d" opacity="0.15" stroke="#ef4444" stroke-width="1.5"/>
          <text x="125" y="32" text-anchor="middle" fill="#ef4444" font-size="12" font-weight="700">Standard Sensor</text>
          <rect x="20" y="42" width="210" height="32" rx="5" fill="#7f1d1d" opacity="0.6"/>
          <text x="125" y="57" text-anchor="middle" fill="#fca5a5" font-size="9" font-weight="600">1. Walk to machine &amp; inspect</text>
          <text x="125" y="68" text-anchor="middle" fill="#fca5a5" font-size="8">~10 min</text>
          <rect x="20" y="82" width="210" height="32" rx="5" fill="#7f1d1d" opacity="0.6"/>
          <text x="125" y="97" text-anchor="middle" fill="#fca5a5" font-size="9" font-weight="600">2. Identify failed sensor</text>
          <text x="125" y="108" text-anchor="middle" fill="#fca5a5" font-size="8">~8 min</text>
          <rect x="20" y="122" width="210" height="32" rx="5" fill="#7f1d1d" opacity="0.6"/>
          <text x="125" y="137" text-anchor="middle" fill="#fca5a5" font-size="9" font-weight="600">3. Replace &amp; manually reconfigure</text>
          <text x="125" y="148" text-anchor="middle" fill="#fca5a5" font-size="8">~12 min</text>
          <rect x="20" y="162" width="210" height="32" rx="5" fill="#7f1d1d" opacity="0.6"/>
          <text x="125" y="177" text-anchor="middle" fill="#fca5a5" font-size="9" font-weight="600">4. Verify &amp; sign off</text>
          <text x="125" y="188" text-anchor="middle" fill="#fca5a5" font-size="8">~5 min</text>
          <rect x="20" y="200" width="210" height="16" rx="4" fill="#dc2626"/>
          <text x="125" y="212" text-anchor="middle" fill="white" font-size="9" font-weight="700">Total: ~35 minutes</text>
          <rect x="330" y="10" width="230" height="210" rx="10" fill="#14532d" opacity="0.15" stroke="#22c55e" stroke-width="1.5"/>
          <text x="445" y="32" text-anchor="middle" fill="#22c55e" font-size="12" font-weight="700">IO-Link Sensor</text>
          <rect x="340" y="42" width="210" height="32" rx="5" fill="#14532d" opacity="0.6"/>
          <text x="445" y="57" text-anchor="middle" fill="#86efac" font-size="9" font-weight="600">1. HMI alerts: port + fault code</text>
          <text x="445" y="68" text-anchor="middle" fill="#86efac" font-size="8">~1 min</text>
          <rect x="340" y="82" width="210" height="32" rx="5" fill="#14532d" opacity="0.6"/>
          <text x="445" y="97" text-anchor="middle" fill="#86efac" font-size="9" font-weight="600">2. Order part (identity known)</text>
          <text x="445" y="108" text-anchor="middle" fill="#86efac" font-size="8">~2 min</text>
          <rect x="340" y="122" width="210" height="32" rx="5" fill="#14532d" opacity="0.6"/>
          <text x="445" y="137" text-anchor="middle" fill="#86efac" font-size="9" font-weight="600">3. Swap sensor — params auto-restore</text>
          <text x="445" y="148" text-anchor="middle" fill="#86efac" font-size="8">~4 min</text>
          <rect x="340" y="162" width="210" height="32" rx="5" fill="#14532d" opacity="0.6"/>
          <text x="445" y="177" text-anchor="middle" fill="#86efac" font-size="9" font-weight="600">4. HMI confirms port healthy</text>
          <text x="445" y="188" text-anchor="middle" fill="#86efac" font-size="8">~1 min</text>
          <rect x="340" y="200" width="210" height="16" rx="4" fill="#16a34a"/>
          <text x="445" y="212" text-anchor="middle" fill="white" font-size="9" font-weight="700">Total: ~8 minutes</text>
          <rect x="238" y="105" width="94" height="28" rx="14" fill="#854d0e"/>
          <text x="285" y="116" text-anchor="middle" fill="#fde68a" font-size="9" font-weight="700">Saves ~27 min</text>
          <text x="285" y="127" text-anchor="middle" fill="#fcd34d" font-size="8">per fault event</text>
        </svg>
      </div>

      <!-- MTTR concept card -->
      <div class="rounded-xl border-2 border-info/30 bg-info/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-sm">⏱️ Concept — MTTR: Mean Time to Repair</p>
        <p class="text-sm text-base-content/80"><strong>MTTR</strong> (Mean Time to Repair) is the average time taken to restore a failed component to full operation. It is one of the key maintenance KPIs used to benchmark a plant's responsiveness. Lower MTTR means less lost production per incident.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          <div class="rounded-lg bg-base-200 border border-error/40 p-3 space-y-1">
            <p class="text-xs font-bold text-error uppercase tracking-wide">Standard MTTR — ~35 min</p>
            <ul class="text-xs text-base-content/80 space-y-0.5 list-disc list-inside">
              <li>Walk to machine and locate fault — ~10 min</li>
              <li>Identify which sensor failed — ~8 min</li>
              <li>Replace and manually reconfigure — ~12 min</li>
              <li>Verify output and sign off — ~5 min</li>
            </ul>
          </div>
          <div class="rounded-lg bg-base-200 border border-success/40 p-3 space-y-1">
            <p class="text-xs font-bold text-success uppercase tracking-wide">IO-Link MTTR — ~8 min</p>
            <ul class="text-xs text-base-content/80 space-y-0.5 list-disc list-inside">
              <li>HMI alert names the exact port and fault — ~1 min</li>
              <li>Order correct part (identity already known) — ~2 min</li>
              <li>Swap sensor — parameters auto-restore — ~4 min</li>
              <li>HMI confirms port status healthy — ~1 min</li>
            </ul>
          </div>
        </div>
        <div class="rounded-lg bg-base-300/50 border border-base-300 p-3 text-sm space-y-1">
          <p class="font-semibold text-base-content">The business case — time saved at scale:</p>
          <p class="text-base-content/80">Assume a plant with <strong>40 sensors</strong>, each experiencing <strong>1 fault event per year</strong>:</p>
          <p class="font-mono text-base-content mt-1">40 sensors × 1 fault/year × 27 min saved = <strong class="text-info">1,080 min = 18 hours saved per year</strong></p>
          <p class="text-base-content/60 text-xs mt-1">At a fully-loaded maintenance technician cost of £40/hour, that is approximately £720 saved annually — from MTTR reduction alone, before factoring in avoided production downtime.</p>
        </div>
      </div>

      <!-- The four features in this kit -->
      <div class="rounded-xl border-2 border-info/30 bg-info/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-sm">🔧 The four IO-Link maintenance features in this exercise</p>
        <p class="text-sm text-base-content/80">Each feature below is active and observable in this kit right now:</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-1">
            <p class="text-xs font-bold text-warning uppercase tracking-wide">Diagnostic events</p>
            <p class="text-xs text-base-content/80">The OMRON E2E on Port 1 raises an <em>instability alarm</em> (byte 1 bit 4) when its oscillation amplitude degrades — visible on the Dashboard before the switching output fails. A photoelectric sensor with a contaminated lens would send a "lens dirty" event on the same mechanism. The HMI event log captures these warnings with a port reference and timestamp.</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-1">
            <p class="text-xs font-bold text-primary uppercase tracking-wide">Device identity</p>
            <p class="text-xs text-base-content/80">Port 1 reports <strong>Vendor 612 (OMRON)</strong>, Device <strong>131090 (E2E-X16MB1T12)</strong> at power-up via IO-Link system commands. The IO-Link Master page resolves this to a human name using the vendor registry. If this sensor failed, the exact replacement part number is derivable directly from the app — no label, no manual, no guessing.</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-1">
            <p class="text-xs font-bold text-secondary uppercase tracking-wide">Parameter storage (ADR)</p>
            <p class="text-xs text-base-content/80">The IFM TV7105 on Port 3 has SP1 = 31°C stored in the AL1350 master. Open the Port 3 parameter panel on the IO-Link Master page — you can read SP1 (index 583) directly from the app. If you physically swapped the TV7105 for an identical unit, the AL1350 would write SP1, RP1, SP2, RP2 and the calibration offset back automatically within seconds of power-up.</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 space-y-1">
            <p class="text-xs font-bold text-accent uppercase tracking-wide">Cycle count</p>
            <p class="text-xs text-base-content/80">The capacitive sensor on Port 2 exposes a running detection count via ISDU. This is visible on the Dashboard — trigger the sensor repeatedly and watch the count increment. In a production environment this counter feeds a maintenance schedule: when the count exceeds the manufacturer's rated switching cycles, a replacement is planned during a scheduled stop rather than reacting to an unplanned failure.</p>
          </div>
        </div>
      </div>

      <!-- Matching table -->
      <div class="overflow-x-auto rounded-lg border border-base-300 mt-4">
        <table class="table table-zebra">
          <thead><tr><th>Maintenance problem</th><th>IO-Link feature</th><th>Check</th></tr></thead>
          <tbody>
            <tr>
              <td>Sensor fails without warning</td>
              <td>
                <select id="ws2-1" class="select select-bordered select-sm w-full max-w-xs">
                  <option value="">-- Select --</option>
                  <option value="events">Diagnostic events (e.g. lens dirty, wire break)</option>
                  <option value="params">Parameter storage</option>
                  <option value="process">Process data only</option>
                </select>
              </td>
              <td><span id="ws2-result-1" class="ws-check-result text-sm"></span></td>
            </tr>
            <tr>
              <td>Replacing a sensor loses configuration</td>
              <td>
                <select id="ws2-2" class="select select-bordered select-sm w-full max-w-xs">
                  <option value="">-- Select --</option>
                  <option value="events">Diagnostic events</option>
                  <option value="params">Parameter storage and automatic device replacement</option>
                  <option value="process">Process data only</option>
                </select>
              </td>
              <td><span id="ws2-result-2" class="ws-check-result text-sm"></span></td>
            </tr>
            <tr>
              <td>Unknown which sensor on the line failed</td>
              <td>
                <select id="ws2-3" class="select select-bordered select-sm w-full max-w-xs">
                  <option value="">-- Select --</option>
                  <option value="events">Device identity and event codes per port</option>
                  <option value="params">Parameter storage</option>
                  <option value="process">Process data only</option>
                </select>
              </td>
              <td><span id="ws2-result-3" class="ws-check-result text-sm"></span></td>
            </tr>
            <tr>
              <td>Planning when to replace a sensor</td>
              <td>
                <select id="ws2-4" class="select select-bordered select-sm w-full max-w-xs">
                  <option value="">-- Select --</option>
                  <option value="events">Cycle count and diagnostic trends</option>
                  <option value="params">Parameter storage</option>
                  <option value="process">Process data only</option>
                </select>
              </td>
              <td><span id="ws2-result-4" class="ws-check-result text-sm"></span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <button type="button" class="btn btn-primary btn-sm mt-2" id="ws2-check-btn">Check answers</button>

      <!-- Verification challenge — MTTR workflow simulation -->
      <div id="cp2-ws4-verify" class="mt-4 space-y-3">
        <div class="rounded-xl border-2 border-warning/40 bg-warning/5 px-5 py-4">
          <p class="font-bold text-base-content">🎯 Verification — IO-Link repair workflow</p>
          <p class="text-sm text-base-content/70 mt-1">Imagine Port 2 (capacitive sensor) has just failed. Complete each step below without leaving this page. Tick each step when done.</p>
        </div>

        <!-- Step 1 — Alert -->
        <div class="rounded-xl border border-base-300 shadow-sm overflow-hidden">
          <label class="cp2-kit-item flex items-center gap-4 px-5 py-4 cursor-pointer bg-base-100 border-l-4 border-error transition-all duration-200">
            <span class="shrink-0 w-8 h-8 rounded-full bg-error/15 border border-error/40 text-error flex items-center justify-center font-bold text-sm">1</span>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-sm text-base-content">Alert — Set CL50 to Red, Flashing</p>
              <p class="text-xs text-base-content/60 mt-0.5">Build the 3-byte PDout command from the datasheet fields and send it. This visual alert replaces the 10-minute floor walk — first action in any MTTR response.</p>
            </div>
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning shrink-0">
          </label>
          <div class="bg-base-200/40 border-t border-base-300 px-5 py-4">
            <div class="grid grid-cols-2 gap-5">
              <div>
                <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-2">Banner CL50 datasheet fields</p>
                <table class="w-full text-xs">
                  <thead><tr class="text-base-content/40 text-xs"><th class="text-left pb-1.5 pr-2 font-normal">Field</th><th class="text-left pb-1.5 pr-2 font-mono font-normal">Byte·Bits</th><th class="text-left pb-1.5">Value</th></tr></thead>
                  <tbody>
                    <tr class="border-t border-base-300/50"><td class="py-1.5 pr-2 text-base-content/70">Animation</td><td class="py-1.5 pr-2 font-mono text-base-content/40">B1[2:0]</td><td class="py-1.5"><select id="ws4s1-anim" class="select select-xs select-bordered w-full"><option value="0" selected>0 — Off</option><option value="1">1 — Steady</option><option value="2">2 — Flash</option><option value="3">3 — Two Color</option></select></td></tr>
                    <tr class="border-t border-base-300/50"><td class="py-1.5 pr-2 text-base-content/70">Color 1</td><td class="py-1.5 pr-2 font-mono text-base-content/40">B2[3:0]</td><td class="py-1.5"><select id="ws4s1-c1" class="select select-xs select-bordered w-full"><option value="0" selected>0 — Green</option><option value="1">1 — Red</option><option value="2">2 — Orange</option><option value="3">3 — Amber</option><option value="4">4 — Yellow</option><option value="5">5 — Lime</option><option value="6">6 — Spring Green</option><option value="7">7 — Cyan</option><option value="8">8 — Sky Blue</option><option value="9">9 — Blue</option><option value="10">10 — Violet</option><option value="11">11 — Magenta</option><option value="12">12 — Rose</option><option value="13">13 — White</option></select></td></tr>
                    <tr class="border-t border-base-300/50"><td class="py-1.5 pr-2 text-base-content/70">C1 Intensity</td><td class="py-1.5 pr-2 font-mono text-base-content/40">B0[2:0]</td><td class="py-1.5"><select id="ws4s1-c1i" class="select select-xs select-bordered w-full"><option value="0" selected>0 — High</option><option value="1">1 — Low</option><option value="2">2 — Medium</option><option value="3">3 — Off</option><option value="4">4 — Custom</option></select></td></tr>
                    <tr class="border-t border-base-300/50"><td class="py-1.5 pr-2 text-base-content/70">Color 2</td><td class="py-1.5 pr-2 font-mono text-base-content/40">B2[7:4]</td><td class="py-1.5"><select id="ws4s1-c2" class="select select-xs select-bordered w-full"><option value="0" selected>0 — Green</option><option value="1">1 — Red</option><option value="2">2 — Orange</option><option value="3">3 — Amber</option><option value="4">4 — Yellow</option><option value="5">5 — Lime</option><option value="6">6 — Spring Green</option><option value="7">7 — Cyan</option><option value="8">8 — Sky Blue</option><option value="9">9 — Blue</option><option value="10">10 — Violet</option><option value="11">11 — Magenta</option><option value="12">12 — Rose</option><option value="13">13 — White</option></select></td></tr>
                    <tr class="border-t border-base-300/50"><td class="py-1.5 pr-2 text-base-content/70">C2 Intensity</td><td class="py-1.5 pr-2 font-mono text-base-content/40">B0[5:3]</td><td class="py-1.5"><select id="ws4s1-c2i" class="select select-xs select-bordered w-full"><option value="0" selected>0 — High</option><option value="1">1 — Low</option><option value="2">2 — Medium</option><option value="3">3 — Off</option><option value="4">4 — Custom</option></select></td></tr>
                    <tr class="border-t border-base-300/50"><td class="py-1.5 pr-2 text-base-content/70">Speed</td><td class="py-1.5 pr-2 font-mono text-base-content/40">B1[7:6]</td><td class="py-1.5"><select id="ws4s1-speed" class="select select-xs select-bordered w-full"><option value="0" selected>0 — Medium</option><option value="1">1 — Fast</option><option value="2">2 — Slow</option></select></td></tr>
                    <tr class="border-t border-base-300/50"><td class="py-1.5 pr-2 text-base-content/70">Pulse Pattern</td><td class="py-1.5 pr-2 font-mono text-base-content/40">B1[5:3]</td><td class="py-1.5"><select id="ws4s1-pattern" class="select select-xs select-bordered w-full"><option value="0" selected>0 — Normal</option><option value="1">1 — Strobe</option><option value="2">2 — Three Pulse</option><option value="3">3 — SOS</option><option value="4">4 — Random</option></select></td></tr>
                    <tr class="border-t border-base-300/50"><td class="py-1.5 pr-2 text-base-content/70">Audible</td><td class="py-1.5 pr-2 font-mono text-base-content/40">B0[7:6]</td><td class="py-1.5"><select id="ws4s1-audible" class="select select-xs select-bordered w-full"><option value="0" selected>0 — Off</option><option value="1">1 — On</option><option value="2">2 — Pulsed</option><option value="3">3 — SOS</option></select></td></tr>
                  </tbody>
                </table>
              </div>
              <div class="flex flex-col justify-between">
                <div class="rounded-lg border border-base-300 bg-base-100 p-4 flex flex-col items-center justify-center flex-1 mb-4">
                  <p class="text-xs text-base-content/40 font-mono mb-2">PDout</p>
                  <span class="font-mono text-5xl font-bold tracking-widest transition-colors duration-200" id="ws4s1-hex">000000</span>
                  <span id="ws4s1-valid" class="text-sm font-semibold mt-3 text-center"></span>
                </div>
                <div class="flex items-center gap-2">
                  <button id="ws4s1-send" class="btn btn-sm btn-primary flex-1">Send to CL50 →</button>
                  <span id="ws4s1-status" class="text-xs text-base-content/60"></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2 — Identify -->
        <div class="rounded-xl border border-base-300 shadow-sm overflow-hidden">
          <label class="cp2-kit-item flex items-center gap-4 px-5 py-4 cursor-pointer bg-base-100 border-l-4 border-warning transition-all duration-200">
            <span class="shrink-0 w-8 h-8 rounded-full bg-warning/15 border border-warning/40 text-warning flex items-center justify-center font-bold text-sm">2</span>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-sm text-base-content">Identify — Read Port 2 device identity</p>
              <p class="text-xs text-base-content/60 mt-0.5">The AL1350 retains Vendor ID and Device ID even if the sensor is dead. These are the exact references needed to order the replacement — no worn label, no guessing.</p>
            </div>
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning shrink-0">
          </label>
          <div class="bg-base-200/40 border-t border-base-300 px-5 py-4">
            <div class="grid grid-cols-4 gap-3">
              <div class="bg-base-100 rounded-lg border border-base-300 p-3 text-center">
                <p class="text-xs text-base-content/50 mb-2">Vendor ID</p>
                <p class="font-mono font-bold text-xl" id="ws4-p2-vid">—</p>
              </div>
              <div class="bg-base-100 rounded-lg border border-base-300 p-3 text-center">
                <p class="text-xs text-base-content/50 mb-2">Device ID</p>
                <p class="font-mono font-bold text-xl" id="ws4-p2-did">—</p>
              </div>
              <div class="bg-base-100 rounded-lg border border-base-300 p-3 text-center">
                <p class="text-xs text-base-content/50 mb-2">Device Name</p>
                <p class="font-bold text-sm" id="ws4-p2-name">—</p>
              </div>
              <div class="bg-base-100 rounded-lg border border-base-300 p-3 text-center">
                <p class="text-xs text-base-content/50 mb-2">Port Mode</p>
                <p class="font-bold text-sm" id="ws4-p2-mode">—</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3 — ADR -->
        <div class="rounded-xl border border-base-300 shadow-sm overflow-hidden">
          <label class="cp2-kit-item flex items-center gap-4 px-5 py-4 cursor-pointer bg-base-100 border-l-4 border-info transition-all duration-200">
            <span class="shrink-0 w-8 h-8 rounded-full bg-info/15 border border-info/40 text-info flex items-center justify-center font-bold text-sm">3</span>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-sm text-base-content">ADR — Read SP1 stored in the master</p>
              <p class="text-xs text-base-content/60 mt-0.5">SP1 is stored in the AL1350, not the sensor. Plug in a replacement TV7105 and it writes back automatically — this is the ~12 minutes of manual reconfiguration eliminated.</p>
            </div>
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning shrink-0">
          </label>
          <div class="bg-base-200/40 border-t border-base-300 px-5 py-4">
            <div class="flex items-center gap-6">
              <button id="ws4-read-sp1" class="btn btn-sm btn-outline shrink-0">Read SP1 (index 583) →</button>
              <div class="flex items-baseline gap-3">
                <span class="text-sm text-base-content/60">SP1 =</span>
                <span id="ws4-sp1-val" class="font-mono font-bold text-5xl">—</span>
                <span id="ws4-sp1-unit" class="text-xl text-base-content/60 hidden">°C</span>
                <span id="ws4-sp1-hex" class="font-mono text-xs text-base-content/40 self-end pb-1"></span>
              </div>
              <span id="ws4-sp1-status" class="text-sm text-base-content/60"></span>
            </div>
          </div>
        </div>

        <!-- Step 4 — Cycle count -->
        <div class="rounded-xl border border-base-300 shadow-sm overflow-hidden">
          <label class="cp2-kit-item flex items-center gap-4 px-5 py-4 cursor-pointer bg-base-100 border-l-4 border-secondary transition-all duration-200">
            <span class="shrink-0 w-8 h-8 rounded-full bg-secondary/15 border border-secondary/40 text-secondary flex items-center justify-center font-bold text-sm">4</span>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-sm text-base-content">Cycle count — Trigger Port 2 with your hand</p>
              <p class="text-xs text-base-content/60 mt-0.5">Watch the count increment below. In production this counter drives predictive scheduling — replace when approaching rated lifetime, not after an unexpected failure.</p>
            </div>
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning shrink-0">
          </label>
          <div class="bg-base-200/40 border-t border-base-300 px-5 py-4">
            <div class="flex items-center gap-8">
              <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full border-2 border-base-content/20 transition-colors duration-150 shrink-0" id="ws4-cap-led" style="background:#374151"></span>
                <span id="ws4-cap-state" class="font-bold text-sm w-24">—</span>
              </div>
              <div>
                <p class="text-xs text-base-content/50 mb-1">Detections this session</p>
                <span id="ws4-cap-count" class="font-mono font-bold text-5xl">0</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 5 — Sign off -->
        <div class="rounded-xl border border-base-300 shadow-sm overflow-hidden">
          <label class="cp2-kit-item flex items-center gap-4 px-5 py-4 cursor-pointer bg-base-100 border-l-4 border-success transition-all duration-200">
            <span class="shrink-0 w-8 h-8 rounded-full bg-success/15 border border-success/40 text-success flex items-center justify-center font-bold text-sm">5</span>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-sm text-base-content">Sign off — Restore CL50 to Green, Steady</p>
              <p class="text-xs text-base-content/60 mt-0.5">Build the PDout command to return the light stack to normal. This confirms the repair is complete and the MTTR clock has stopped.</p>
            </div>
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning shrink-0">
          </label>
          <div class="bg-base-200/40 border-t border-base-300 px-5 py-4">
            <div class="grid grid-cols-2 gap-5">
              <div>
                <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-2">Banner CL50 datasheet fields</p>
                <table class="w-full text-xs">
                  <thead><tr class="text-base-content/40 text-xs"><th class="text-left pb-1.5 pr-2 font-normal">Field</th><th class="text-left pb-1.5 pr-2 font-mono font-normal">Byte·Bits</th><th class="text-left pb-1.5">Value</th></tr></thead>
                  <tbody>
                    <tr class="border-t border-base-300/50"><td class="py-1.5 pr-2 text-base-content/70">Animation</td><td class="py-1.5 pr-2 font-mono text-base-content/40">B1[2:0]</td><td class="py-1.5"><select id="ws4s5-anim" class="select select-xs select-bordered w-full"><option value="0" selected>0 — Off</option><option value="1">1 — Steady</option><option value="2">2 — Flash</option><option value="3">3 — Two Color</option></select></td></tr>
                    <tr class="border-t border-base-300/50"><td class="py-1.5 pr-2 text-base-content/70">Color 1</td><td class="py-1.5 pr-2 font-mono text-base-content/40">B2[3:0]</td><td class="py-1.5"><select id="ws4s5-c1" class="select select-xs select-bordered w-full"><option value="0" selected>0 — Green</option><option value="1">1 — Red</option><option value="2">2 — Orange</option><option value="3">3 — Amber</option><option value="4">4 — Yellow</option><option value="5">5 — Lime</option><option value="6">6 — Spring Green</option><option value="7">7 — Cyan</option><option value="8">8 — Sky Blue</option><option value="9">9 — Blue</option><option value="10">10 — Violet</option><option value="11">11 — Magenta</option><option value="12">12 — Rose</option><option value="13">13 — White</option></select></td></tr>
                    <tr class="border-t border-base-300/50"><td class="py-1.5 pr-2 text-base-content/70">C1 Intensity</td><td class="py-1.5 pr-2 font-mono text-base-content/40">B0[2:0]</td><td class="py-1.5"><select id="ws4s5-c1i" class="select select-xs select-bordered w-full"><option value="0" selected>0 — High</option><option value="1">1 — Low</option><option value="2">2 — Medium</option><option value="3">3 — Off</option><option value="4">4 — Custom</option></select></td></tr>
                    <tr class="border-t border-base-300/50"><td class="py-1.5 pr-2 text-base-content/70">Color 2</td><td class="py-1.5 pr-2 font-mono text-base-content/40">B2[7:4]</td><td class="py-1.5"><select id="ws4s5-c2" class="select select-xs select-bordered w-full"><option value="0" selected>0 — Green</option><option value="1">1 — Red</option><option value="2">2 — Orange</option><option value="3">3 — Amber</option><option value="4">4 — Yellow</option><option value="5">5 — Lime</option><option value="6">6 — Spring Green</option><option value="7">7 — Cyan</option><option value="8">8 — Sky Blue</option><option value="9">9 — Blue</option><option value="10">10 — Violet</option><option value="11">11 — Magenta</option><option value="12">12 — Rose</option><option value="13">13 — White</option></select></td></tr>
                    <tr class="border-t border-base-300/50"><td class="py-1.5 pr-2 text-base-content/70">C2 Intensity</td><td class="py-1.5 pr-2 font-mono text-base-content/40">B0[5:3]</td><td class="py-1.5"><select id="ws4s5-c2i" class="select select-xs select-bordered w-full"><option value="0" selected>0 — High</option><option value="1">1 — Low</option><option value="2">2 — Medium</option><option value="3">3 — Off</option><option value="4">4 — Custom</option></select></td></tr>
                    <tr class="border-t border-base-300/50"><td class="py-1.5 pr-2 text-base-content/70">Speed</td><td class="py-1.5 pr-2 font-mono text-base-content/40">B1[7:6]</td><td class="py-1.5"><select id="ws4s5-speed" class="select select-xs select-bordered w-full"><option value="0" selected>0 — Medium</option><option value="1">1 — Fast</option><option value="2">2 — Slow</option></select></td></tr>
                    <tr class="border-t border-base-300/50"><td class="py-1.5 pr-2 text-base-content/70">Pulse Pattern</td><td class="py-1.5 pr-2 font-mono text-base-content/40">B1[5:3]</td><td class="py-1.5"><select id="ws4s5-pattern" class="select select-xs select-bordered w-full"><option value="0" selected>0 — Normal</option><option value="1">1 — Strobe</option><option value="2">2 — Three Pulse</option><option value="3">3 — SOS</option><option value="4">4 — Random</option></select></td></tr>
                    <tr class="border-t border-base-300/50"><td class="py-1.5 pr-2 text-base-content/70">Audible</td><td class="py-1.5 pr-2 font-mono text-base-content/40">B0[7:6]</td><td class="py-1.5"><select id="ws4s5-audible" class="select select-xs select-bordered w-full"><option value="0" selected>0 — Off</option><option value="1">1 — On</option><option value="2">2 — Pulsed</option><option value="3">3 — SOS</option></select></td></tr>
                  </tbody>
                </table>
              </div>
              <div class="flex flex-col justify-between">
                <div class="rounded-lg border border-base-300 bg-base-100 p-4 flex flex-col items-center justify-center flex-1 mb-4">
                  <p class="text-xs text-base-content/40 font-mono mb-2">PDout</p>
                  <span class="font-mono text-5xl font-bold tracking-widest transition-colors duration-200" id="ws4s5-hex">000000</span>
                  <span id="ws4s5-valid" class="text-sm font-semibold mt-3 text-center"></span>
                </div>
                <div class="flex items-center gap-2">
                  <button id="ws4s5-send" class="btn btn-sm btn-success flex-1">Send to CL50 →</button>
                  <span id="ws4s5-status" class="text-xs text-base-content/60"></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="text-xs text-base-content/50 px-1">
          <strong>Where the 27 minutes are saved:</strong> Step 1 replaces ~10 min walk-and-find. Step 3 replaces ~12 min manual reconfiguration — 22 of the 27 minutes saved per fault event come from these two steps.
        </div>
      </div>

      <div id="cp2-ws3-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: events — diagnostic events (lens dirty, instability alarm) warn before complete output failure. Q2: params — parameter storage and ADR allow the master to write setpoints back automatically after a sensor swap, losing no configuration. Q3: events — device identity and per-port event codes pinpoint exactly which sensor failed and supply the replacement part number. Q4: events — cycle count and diagnostic trends enable condition-based maintenance: replace when the sensor approaches its rated life, not after it fails.</div>
    `
  },
  {
    id: 5,
    title: 'IODD Files &amp; Decoding IO-Link Data',
    shortDesc: 'Understand what the IODD contains, where to find it, and apply dtype + scale to decode raw hex.',
    estimatedTime: 'About 20 min',
    whyItMatters: 'The IODD is the spec the master uses to decode PDin and the lookup table you need to decode ISDU reads. Without it, raw hex is meaningless. This worksheet builds both the concept and the calculation skill.',
    prerequisites: 'CP7395 Worksheets 1–4',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed text-base">Every IO-Link sensor ships with an <strong>IODD file</strong> — an XML document that is the sensor's digital datasheet. It tells the IO-Link master exactly how to decode PDin bytes and which ISDU parameter addresses are available, what data type each uses, and what scale factor converts the raw integer to an engineering value. Without the IODD, the master cannot interpret a single byte from the sensor. This worksheet explains what the IODD contains, where to find it, and then builds the decode skill you need to use it in practice.</p>

      <!-- Checklist -->
      <div class="space-y-2 mt-4">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">IODD &amp; decode concepts — tick each when understood</p>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text text-sm"><strong>IODD = IO-Link Device Description:</strong> an XML file published by the manufacturer. Contains device identity (Vendor ID, Device ID), the PDin bit layout, every parameter's index/subindex/dtype/scale/range, event codes, and valid operating limits. It is the complete specification for talking to that sensor.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text text-sm"><strong>Where to find IODDs:</strong> <code class="font-mono text-xs bg-base-300 px-1 rounded">ioddfinder.io</code> — the official IO-Link Community repository. Free, searchable by manufacturer, product name, or Vendor ID. Also available from each manufacturer's website. Every IO-Link certified device must have a published IODD.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text text-sm"><strong>How the master uses the IODD:</strong> at power-up, the master reads Vendor ID + Device ID from each connected sensor → loads the matching IODD → learns the PDin layout and parameter map. Without the IODD loaded, the master passes raw bytes upstream but cannot label or scale them. In this app, <code class="font-mono text-xs bg-base-300 px-1 rounded">backend/device_parameters.py</code> is a hard-coded translation of the key IODD entries for all four kit devices.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text text-sm"><strong>IODD parameter entry structure:</strong> each ISDU-accessible parameter has — Index (hex address, e.g. 0x247 = 583 decimal for SP1), Subindex (field within that address, usually 0), Datatype (uint8/uint16/int16/int32), ScaleFactor (multiply raw integer to get engineering units), Name, Min/Max valid values. All of this lives in the IODD XML.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text text-sm"><strong>Hex decode skill:</strong> 16 symbols (0–9, A–F). One byte = two hex digits. F4 = 15×16+4 = 244. Two bytes = four digits; high byte ×256 + low byte. Apply dtype (signed or unsigned) then multiply by scale. This is the universal decode procedure for any IO-Link ISDU response.</span>
        </label>
      </div>

      <!-- IODD concept card -->
      <div class="rounded-xl border-2 border-info/30 bg-info/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-sm">📄 Concept — What the IODD XML contains</p>
        <p class="text-sm text-base-content/80">Here is a simplified extract from the IFM TV7105 IODD showing SP1 (Setpoint 1 for OUT1):</p>
        <div class="rounded-lg p-3 font-mono text-xs overflow-x-auto" style="background:#0f172a;color:#94a3b8">
          <div style="color:#475569">&lt;!-- IODD extract: IFM TV7105, SP1 parameter --&gt;</div>
          <div>&lt;<span style="color:#60a5fa">Parameter</span> <span style="color:#f97316">index</span>=<span style="color:#22c55e">"583"</span> <span style="color:#f97316">subindex</span>=<span style="color:#22c55e">"0"</span>&gt;</div>
          <div class="ml-4">&lt;<span style="color:#60a5fa">Name</span>&gt;<span style="color:#fde68a">SP1 Setpoint OUT1</span>&lt;/Name&gt;</div>
          <div class="ml-4">&lt;<span style="color:#60a5fa">Datatype</span>&gt;<span style="color:#a78bfa">INT16</span>&lt;/Datatype&gt;</div>
          <div class="ml-4">&lt;<span style="color:#60a5fa">ScaleFactor</span>&gt;<span style="color:#4ade80">0.1</span>&lt;/ScaleFactor&gt;</div>
          <div class="ml-4">&lt;<span style="color:#60a5fa">Unit</span>&gt;<span style="color:#fde68a">°C</span>&lt;/Unit&gt;</div>
          <div class="ml-4">&lt;<span style="color:#60a5fa">Min</span>&gt;<span style="color:#f87171">-600</span>&lt;/Min&gt; <span style="color:#475569">&lt;!-- raw: -60.0°C --&gt;</span></div>
          <div class="ml-4">&lt;<span style="color:#60a5fa">Max</span>&gt;<span style="color:#4ade80">1500</span>&lt;/Max&gt; <span style="color:#475569">&lt;!-- raw: 150.0°C --&gt;</span></div>
          <div>&lt;/Parameter&gt;</div>
        </div>
        <p class="text-sm text-base-content/80">The IODD tells you: send a read request to Index 583, Sub 0 → receive 2 bytes → interpret as INT16 → multiply by 0.1 → result in °C. <strong>This is exactly the information in <code class="font-mono text-xs bg-base-100 px-1 rounded">device_parameters.py</code> for this app.</strong></p>
      </div>

      <!-- Three-component grid -->
      <div class="grid grid-cols-3 gap-2 mt-4">
        <div class="rounded-lg p-3 text-center space-y-1" style="background:#0f172a;border:1px solid #334155">
          <p class="text-xs font-bold" style="color:#3b82f6">Raw hex</p>
          <p class="font-mono font-bold text-lg" style="color:#f59e0b">01 F4</p>
          <p class="text-xs" style="color:#475569">Bytes from device</p>
        </div>
        <div class="rounded-lg p-3 text-center space-y-1" style="background:#0f172a;border:1px solid #334155">
          <p class="text-xs font-bold" style="color:#8b5cf6">Data type</p>
          <p class="font-mono font-bold text-lg" style="color:#a78bfa">int16</p>
          <p class="text-xs" style="color:#475569">From IODD</p>
        </div>
        <div class="rounded-lg p-3 text-center space-y-1" style="background:#0f172a;border:1px solid #334155">
          <p class="text-xs font-bold" style="color:#22c55e">Scale factor</p>
          <p class="font-mono font-bold text-lg" style="color:#4ade80">×0.1</p>
          <p class="text-xs" style="color:#475569">From IODD → °C</p>
        </div>
      </div>

      <!-- Part 1 – Hex digits -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-4 mt-4 space-y-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Part 1 — Hex digits (0–F)</p>
        <p class="text-sm text-base-content/80">Hexadecimal counts 0–9, then uses A–F for values 10–15, giving 16 symbols (base 16). One byte = two hex digits:</p>
        <div class="rounded-lg overflow-hidden" style="border:1px solid #334155">
          <table class="w-full text-xs text-center font-mono">
            <tbody>
              <tr style="background:#1e293b">
                <td class="py-1.5 px-1 font-semibold" style="color:#475569">Hex</td>
                <td style="color:#94a3b8">0</td><td style="color:#94a3b8">1</td><td style="color:#94a3b8">2</td><td style="color:#94a3b8">3</td>
                <td style="color:#94a3b8">4</td><td style="color:#94a3b8">5</td><td style="color:#94a3b8">6</td><td style="color:#94a3b8">7</td>
                <td style="color:#94a3b8">8</td><td style="color:#94a3b8">9</td>
                <td style="color:#f59e0b;font-weight:700">A</td><td style="color:#f59e0b;font-weight:700">B</td>
                <td style="color:#f59e0b;font-weight:700">C</td><td style="color:#f59e0b;font-weight:700">D</td>
                <td style="color:#f59e0b;font-weight:700">E</td><td style="color:#f59e0b;font-weight:700">F</td>
              </tr>
              <tr style="background:#0f172a">
                <td class="py-1.5 px-1 font-semibold" style="color:#475569">Dec</td>
                <td style="color:#64748b">0</td><td style="color:#64748b">1</td><td style="color:#64748b">2</td><td style="color:#64748b">3</td>
                <td style="color:#64748b">4</td><td style="color:#64748b">5</td><td style="color:#64748b">6</td><td style="color:#64748b">7</td>
                <td style="color:#64748b">8</td><td style="color:#64748b">9</td>
                <td style="color:#f59e0b;font-weight:700">10</td><td style="color:#f59e0b;font-weight:700">11</td>
                <td style="color:#f59e0b;font-weight:700">12</td><td style="color:#f59e0b;font-weight:700">13</td>
                <td style="color:#f59e0b;font-weight:700">14</td><td style="color:#f59e0b;font-weight:700">15</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-sm text-base-content/80">One byte, two hex digits: <strong>left digit × 16 + right digit</strong>.</p>
        <div class="rounded-lg px-4 py-3 text-sm font-mono" style="background:#0f172a;border:1px solid #334155;color:#94a3b8">
          Example: <span style="color:#f59e0b;font-weight:700">F4</span> → F=15 → 15 × 16 + 4 = 240 + 4 = <span style="color:#22c55e;font-weight:700">244</span>
        </div>
      </div>

      <!-- Part 2 – Two-byte positional -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-4 mt-3 space-y-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Part 2 — Two-byte (16-bit) values</p>
        <p class="text-sm text-base-content/80">Many IODD parameters are int16 or uint16 — two bytes. The first (high) byte is worth 256× the second (low) byte:</p>
        <div class="overflow-x-auto">
          <table class="text-xs font-mono text-center" style="border-collapse:separate;border-spacing:3px;width:100%">
            <thead>
              <tr>
                <td class="text-left text-base-content/50 pr-3 pb-1 text-xs">Position</td>
                <td class="px-3 py-1.5 rounded" style="background:#1e293b;color:#64748b;font-weight:600">×4096</td>
                <td class="px-3 py-1.5 rounded" style="background:#1e293b;color:#64748b;font-weight:600">×256</td>
                <td class="px-3 py-1.5 rounded" style="background:#1e293b;color:#64748b;font-weight:600">×16</td>
                <td class="px-3 py-1.5 rounded" style="background:#1e293b;color:#64748b;font-weight:600">×1</td>
                <td></td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-left text-base-content/50 pr-3 text-xs">Hex: 01 F4</td>
                <td class="px-3 py-1.5 rounded" style="background:#1e293b;color:#94a3b8">0</td>
                <td class="px-3 py-1.5 rounded" style="background:#1e293b;color:#94a3b8">1</td>
                <td class="px-3 py-1.5 rounded" style="background:#1e293b;color:#f59e0b">F (=15)</td>
                <td class="px-3 py-1.5 rounded" style="background:#1e293b;color:#94a3b8">4</td>
                <td></td>
              </tr>
              <tr>
                <td class="text-left text-base-content/50 pr-3 text-xs">Calculation</td>
                <td class="px-2 py-1.5 rounded text-xs" style="background:#0f172a;color:#475569">0×4096=0</td>
                <td class="px-2 py-1.5 rounded text-xs" style="background:#0f172a;color:#94a3b8">1×256=256</td>
                <td class="px-2 py-1.5 rounded text-xs" style="background:#0f172a;color:#22c55e">15×16=240</td>
                <td class="px-2 py-1.5 rounded text-xs" style="background:#0f172a;color:#94a3b8">4×1=4</td>
                <td class="text-left pl-3 font-bold" style="color:#22c55e;font-size:1.1em">= 500</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-sm text-base-content/80">Apply scale: 500 × 0.1 = <span class="font-bold text-success">50.0 °C</span>.</p>
      </div>

      <!-- Signed vs unsigned concept -->
      <div class="rounded-xl border border-warning/30 bg-warning/5 p-4 mt-3 space-y-2">
        <p class="text-xs font-semibold text-warning uppercase tracking-wide">Signed vs unsigned — two's complement for negative values</p>
        <p class="text-sm text-base-content/80">int16 range is −32768 to +32767. Values 0x0000–0x7FFF are positive. Values 0x8000–0xFFFF are negative. To decode: <span class="font-semibold font-mono">signed_value = unsigned_value − 65536</span>.</p>
        <p class="text-sm text-base-content/80">Example: <span class="font-mono font-bold" style="color:#f59e0b">0xFF9C</span> = 65436 unsigned → 65436 − 65536 = −100 → ÷10 = <span class="font-bold text-success">−10.0 °C</span>.</p>
        <p class="text-sm text-base-content/80">Quick check: if the first hex digit of byte 0 is 8–F, the value is negative.</p>
      </div>

      <!-- Part 3 – Data types -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-4 mt-3 space-y-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Part 3 — Data types (from the IODD)</p>
        <p class="text-sm text-base-content/80">The IODD specifies the dtype for every parameter. This tells you how many bytes to read and whether the value can be negative:</p>
        <div class="overflow-x-auto rounded-lg" style="border:1px solid #334155">
          <table class="w-full text-sm" style="border-collapse:collapse">
            <thead>
              <tr class="text-xs" style="background:#1e293b;color:#475569">
                <td class="px-3 py-2 font-semibold">Type</td>
                <td class="px-3 py-2">Bytes</td>
                <td class="px-3 py-2">Range</td>
                <td class="px-3 py-2">Typical use in this kit</td>
              </tr>
            </thead>
            <tbody class="text-xs text-base-content/80" style="font-family:'Courier New',monospace">
              <tr style="border-top:1px solid #1e293b">
                <td class="px-3 py-2 font-bold" style="color:#3b82f6">uint8</td>
                <td class="px-3 py-2">1</td><td class="px-3 py-2">0–255</td>
                <td class="px-3 py-2" style="font-family:inherit">Output logic (NO=0, NC=1), teach commands</td>
              </tr>
              <tr style="border-top:1px solid #1e293b">
                <td class="px-3 py-2 font-bold" style="color:#8b5cf6">uint16</td>
                <td class="px-3 py-2">2</td><td class="px-3 py-2">0–65535</td>
                <td class="px-3 py-2" style="font-family:inherit">Capacitive SP1 (raw count, always positive)</td>
              </tr>
              <tr style="border-top:1px solid #1e293b">
                <td class="px-3 py-2 font-bold" style="color:#f97316">int16</td>
                <td class="px-3 py-2">2</td><td class="px-3 py-2">−32768 to +32767</td>
                <td class="px-3 py-2" style="font-family:inherit">Temperature SP1/RP1 and calibration offset</td>
              </tr>
              <tr style="border-top:1px solid #1e293b">
                <td class="px-3 py-2 font-bold" style="color:#22c55e">int32</td>
                <td class="px-3 py-2">4</td><td class="px-3 py-2">±2 billion</td>
                <td class="px-3 py-2" style="font-family:inherit">Photoelectric SP1 (wide sensing range)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Part 4 – Scale factors -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-4 mt-3 space-y-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Part 4 — Scale factors in this kit</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="rounded-lg p-3 space-y-1.5" style="background:#0f172a;border:1px solid #334155">
            <p class="text-xs font-semibold text-base-content/50">TV7105 — SP1 (Index 583, int16, ×0.1)</p>
            <p class="font-mono text-sm" style="color:#94a3b8">Raw <span style="color:#f59e0b">0118</span> hex = 280 decimal</p>
            <p class="font-mono text-sm font-bold" style="color:#22c55e">280 × 0.1 = 28.0 °C</p>
          </div>
          <div class="rounded-lg p-3 space-y-1.5" style="background:#0f172a;border:1px solid #334155">
            <p class="text-xs font-semibold text-base-content/50">TV7105 — Cal Offset (Index 681, int16, ×0.1)</p>
            <p class="font-mono text-sm" style="color:#94a3b8">Raw <span style="color:#f59e0b">FFD0</span> hex = −48 (signed)</p>
            <p class="font-mono text-sm font-bold" style="color:#22c55e">−48 × 0.1 = −4.8 °C</p>
          </div>
        </div>
      </div>

      <!-- Practice exercises -->
      <div class="rounded-xl border-2 border-secondary/30 bg-secondary/5 p-4 mt-4 space-y-4">
        <p class="text-xs font-semibold text-secondary uppercase tracking-wide">Practice Exercises</p>
        <div class="space-y-1">
          <p class="text-sm font-semibold text-base-content">Q1 — An ISDU read of TV7105 RP1 (Index 584, Sub 0) returns <span class="font-mono font-bold">00 E6</span>. dtype = int16, scale = ×0.1. What is RP1 in °C?</p>
          <p class="text-xs text-base-content/60">Hint: E = 14 in decimal.</p>
          <p class="text-sm mt-1">Answer: <span class="blur-sm hover:blur-none transition-all cursor-pointer select-none text-success font-mono">00 E6 → 0 + 0 + (14×16) + 6 = 224 + 6 = 230 → 230 × 0.1 = 23.0 °C</span> <em class="text-base-content/40">(hover to reveal)</em></p>
        </div>
        <div class="space-y-1">
          <p class="text-sm font-semibold text-base-content">Q2 — A capacitive sensor returns <span class="font-mono font-bold">00 64</span> for SP1 (uint16, no scale). What is the setpoint count?</p>
          <p class="text-xs text-base-content/60">Hint: 6 × 16 + 4 = ?</p>
          <p class="text-sm mt-1">Answer: <span class="blur-sm hover:blur-none transition-all cursor-pointer select-none text-success font-mono">00 64 → 0 + 0 + (6×16) + 4 = 96 + 4 = 100 counts</span> <em class="text-base-content/40">(hover to reveal)</em></p>
        </div>
        <div class="space-y-1">
          <p class="text-sm font-semibold text-base-content">Q3 — The TV7105 SP1 returns <span class="font-mono font-bold">01 F4</span> (int16, ×0.1). Show full working to find the setpoint in °C.</p>
          <p class="text-sm mt-1">Answer: <span class="blur-sm hover:blur-none transition-all cursor-pointer select-none text-success font-mono">01 F4 → (0×4096) + (1×256) + (15×16) + 4 = 0 + 256 + 240 + 4 = 500 → 500 × 0.1 = 50.0 °C</span> <em class="text-base-content/40">(hover to reveal)</em></p>
        </div>
      </div>

      <!-- MCQ Q4 — IODD -->
      <p class="mt-4 font-medium text-base-content"><strong>Q4.</strong> You need the ISDU parameter map for a new IO-Link sensor not in this kit. Where is the correct first place to look?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws4-q1" value="a" class="radio radio-sm radio-secondary"> ioddfinder.io — the IO-Link Community's official IODD repository, searchable by manufacturer and product name</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws4-q1" value="b" class="radio radio-sm radio-secondary"> The AL1350 web interface — it stores IODDs for all connected devices locally</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws4-q1" value="c" class="radio radio-sm radio-secondary"> The Pi filesystem at /var/www — the backend downloads IODDs automatically on first connection</label>
      </div>

      <!-- Verification -->
      <div id="cp2-ws5-verify" class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-4">
        <div>
          <p class="font-bold text-base-content text-base">🎯 Verification — decode three live ISDU reads</p>
          <p class="text-sm text-base-content/80">For each challenge, read the live raw hex from the running sensor, decode it by hand using the dtype and scale shown, then enter your answer and check it against the real value.</p>
        </div>

        <!-- Challenge 1: TV7105 SP1 -->
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 space-y-2">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Challenge 1 — TV7105 SP1 (Port 3, Index 583/Sub 0, int16, ×0.1)</p>
            <button id="ws5-read-1" class="btn btn-xs btn-outline">Read raw hex →</button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm text-base-content/70">Raw hex:</span>
            <span id="ws5-hex-1" class="font-mono font-bold text-lg text-warning">—</span>
            <span class="text-sm text-base-content/70 ml-2">Your answer:</span>
            <input id="ws5-ans-1" type="number" step="0.1" class="input input-bordered input-sm w-24" placeholder="°C">
            <button id="ws5-check-1" class="btn btn-xs btn-primary">Check</button>
            <span id="ws5-result-1" class="text-sm font-semibold"></span>
          </div>
        </div>

        <!-- Challenge 2: Capacitive SP1 -->
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 space-y-2">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Challenge 2 — Capacitive SP1 (Port 2, Index 60/Sub 1, uint16, no scale)</p>
            <button id="ws5-read-2" class="btn btn-xs btn-outline">Read raw hex →</button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm text-base-content/70">Raw hex:</span>
            <span id="ws5-hex-2" class="font-mono font-bold text-lg text-warning">—</span>
            <span class="text-sm text-base-content/70 ml-2">Your answer:</span>
            <input id="ws5-ans-2" type="number" step="1" class="input input-bordered input-sm w-24" placeholder="counts">
            <button id="ws5-check-2" class="btn btn-xs btn-primary">Check</button>
            <span id="ws5-result-2" class="text-sm font-semibold"></span>
          </div>
        </div>

        <!-- Challenge 3: Calibration offset (signed) -->
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 space-y-2">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Challenge 3 — Calibration Offset (Port 3, Index 681/Sub 0, int16, ×0.1 — may be negative)</p>
            <button id="ws5-read-3" class="btn btn-xs btn-outline">Read raw hex →</button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm text-base-content/70">Raw hex:</span>
            <span id="ws5-hex-3" class="font-mono font-bold text-lg text-warning">—</span>
            <span class="text-sm text-base-content/70 ml-2">Your answer:</span>
            <input id="ws5-ans-3" type="number" step="0.1" class="input input-bordered input-sm w-24" placeholder="°C">
            <button id="ws5-check-3" class="btn btn-xs btn-primary">Check</button>
            <span id="ws5-result-3" class="text-sm font-semibold"></span>
          </div>
          <p class="text-xs text-base-content/40">Remember: if the first hex digit of the high byte is 8–F, apply two's complement — subtract 65536 before scaling.</p>
        </div>

        <div class="space-y-2 text-sm">
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">All three decoded values above matched the live sensor reading.</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Each read above completed without error — confirming the ISDU read path from browser → backend → AL1350 → sensor is working end to end.</span>
          </label>
        </div>
      </div>
      <div id="cp2-ws4-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q4: a — ioddfinder.io is the official IO-Link Community repository. The AL1350 does not store IODDs and the Pi backend uses a hard-coded parameter registry, not a runtime IODD parser.</div>
    `
  },
  {
    id: 6,
    title: 'Diagnostics Data &amp; NAMUR NE107 Health States',
    shortDesc: 'Classify process, service, and event data — and map IO-Link events to industry-standard NE107 health symbols.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'The three data channels determine what information goes where in your system. NAMUR NE107 is the industry standard that turns IO-Link event codes into standardised health symbols visible on any plant HMI — knowing it is essential for maintenance engineers.',
    relatedLearn: '',
    relatedDashboard: 'Dashboard: Port Details, Events',
    prerequisites: 'Complete CP7395 Worksheets 1–3',
    contentHtml: `
<p class="text-base-content/90 leading-relaxed">IO-Link defines three distinct data channels. Understanding which data type goes where is fundamental for system integration — wrong routing wastes PLC scan cycles or misses faults entirely.</p>

      <!-- Interactive checklist -->
      <div class="space-y-2 mt-4">
        <p class="text-sm font-semibold text-base-content/70 uppercase tracking-wide mb-2">Tick each item when you can classify the examples below</p>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text"><strong>Process data</strong> — cyclic, every 500 ms, arrives in the PDin payload. Contains live sensor values (temperature, switching output, detection state). Goes to the PLC I/O scan and HMI live display. In this app it arrives via WebSocket every 500 ms.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text"><strong>Service data</strong> — acyclic, on-demand only. ISDU reads and writes of parameters (setpoints, calibration, identity). Never arrives automatically — must be explicitly requested. Goes to commissioning tools and configuration systems.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text"><strong>Event data</strong> — triggered on condition (fault occurs, warning threshold crossed). Carries event code, port, timestamp. Goes to CMMS / alarm systems / maintenance work order systems. In this app, event flags appear in the WebSocket JSON alongside process data.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text"><strong>NAMUR NE107:</strong> international standard defining four health symbols for field devices: Failure (✗ red), Maintenance Required (△ amber), Out of Specification (⊙ yellow), Function Check (∟ blue). IO-Link event codes map to these symbols on modern plant HMIs, enabling vendor-neutral health display across any manufacturer's devices.</span>
        </label>
      </div>

      <!-- Concept card: Process data -->
      <div class="rounded-xl border border-info/30 bg-info/5 p-4 mt-4 space-y-1">
        <p class="font-bold text-base-content">Process data — continuous, fast, lightweight</p>
        <p class="text-sm text-base-content/85 leading-relaxed">Process data is designed to be small enough to fit in a single cyclic PDin frame. The TV7105 temperature sensor sends just 4 bytes — temperature value plus status flags — every 500 ms. The AL1350 maps all four ports into a single process image and publishes it to the Mosquitto broker via MQTT. This is what the WebSocket delivers to the browser on every tick: decoded, current sensor values, ready for the HMI to display without any explicit request.</p>
      </div>

      <!-- Concept card: Service data -->
      <div class="rounded-xl border border-info/30 bg-info/5 p-4 mt-3 space-y-1">
        <p class="font-bold text-base-content">Service data — acyclic ISDU reads and writes</p>
        <p class="text-sm text-base-content/85 leading-relaxed">Service data uses the ISDU (IO-Link Acyclic Service Data Unit) protocol. The master sends a read request to the sensor — specifying an index and subindex — and the sensor responds with raw bytes. This is how SP1, RP1, calibration offset, and device identity strings are accessed. It does NOT arrive automatically; you must explicitly request it. In this app, ISDU reads are triggered by the REST endpoints (<code class="font-mono text-xs">/api/io-link/port/N/parameters</code> or <code class="font-mono text-xs">/api/io-link/port/N/parameter/read</code>). Average latency: 10–200 ms depending on device and AL1350 load.</p>
      </div>

      <!-- Concept card: Event data -->
      <div class="rounded-xl border border-info/30 bg-info/5 p-4 mt-3 space-y-1">
        <p class="font-bold text-base-content">Event data — smart faults and the CMMS link</p>
        <p class="text-sm text-base-content/85 leading-relaxed">An event is a structured fault or warning message with a code, port number, and qualifier (appears / disappears). Examples: lens dirty (Omron E2E proximity), temperature exceeds SP2 (IFM TV7105), instability alarm (E2E). In a full industrial setup, events route to a CMMS (Computerised Maintenance Management System) to automatically generate maintenance work orders — eliminating the need for manual inspection rounds. In this app, event flags appear in the WebSocket JSON frame alongside process data, so the HMI can display them in real time.</p>
      </div>

      <!-- IO-Link data routing SVG (preserved exactly) -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-4">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">IO-Link data types — where each goes</p>
        <svg viewBox="0 0 570 180" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <defs>
            <marker id="ws5-arr-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#3b82f6"/></marker>
            <marker id="ws5-arr-p" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#8b5cf6"/></marker>
            <marker id="ws5-arr-r" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#ef4444"/></marker>
          </defs>
          <!-- Master node -->
          <rect x="185" y="65" width="130" height="50" rx="8" fill="#ea580c"/>
          <text x="250" y="85" text-anchor="middle" fill="white" font-size="10" font-weight="700">IO-Link Master</text>
          <text x="250" y="100" text-anchor="middle" fill="#fed7aa" font-size="8">AL1350 + FastAPI</text>
          <!-- Process data arrow -->
          <line x1="185" y1="80" x2="118" y2="55" stroke="#3b82f6" stroke-width="2" marker-end="url(#ws5-arr-b)"/>
          <text x="142" y="62" text-anchor="middle" fill="#3b82f6" font-size="8" font-weight="600">Process</text>
          <rect x="5" y="25" width="110" height="38" rx="6" fill="#1e3a5f"/>
          <text x="60" y="40" text-anchor="middle" fill="#93c5fd" font-size="9" font-weight="600">PLC / HMI</text>
          <text x="60" y="54" text-anchor="middle" fill="#bfdbfe" font-size="8">live sensor values</text>
          <!-- Service data arrow -->
          <line x1="185" y1="90" x2="118" y2="115" stroke="#8b5cf6" stroke-width="2" marker-end="url(#ws5-arr-p)"/>
          <text x="142" y="110" text-anchor="middle" fill="#8b5cf6" font-size="8" font-weight="600">Service</text>
          <rect x="5" y="98" width="110" height="38" rx="6" fill="#2e1065"/>
          <text x="60" y="113" text-anchor="middle" fill="#ddd6fe" font-size="9" font-weight="600">Commissioning</text>
          <text x="60" y="127" text-anchor="middle" fill="#c4b5fd" font-size="8">param read / write</text>
          <!-- Event data arrow -->
          <line x1="315" y1="80" x2="390" y2="55" stroke="#ef4444" stroke-width="2" marker-end="url(#ws5-arr-r)"/>
          <text x="357" y="62" text-anchor="middle" fill="#ef4444" font-size="8" font-weight="600">Event</text>
          <rect x="392" y="25" width="170" height="38" rx="6" fill="#450a0a"/>
          <text x="477" y="40" text-anchor="middle" fill="#fca5a5" font-size="9" font-weight="600">CMMS / Alarm System</text>
          <text x="477" y="54" text-anchor="middle" fill="#fca5a5" font-size="8">faults, warnings, work orders</text>
          <!-- WebSocket note -->
          <line x1="315" y1="95" x2="390" y2="120" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,3"/>
          <rect x="392" y="105" width="170" height="38" rx="6" fill="#451a03"/>
          <text x="477" y="120" text-anchor="middle" fill="#fde68a" font-size="9" font-weight="600">WebSocket /ws (this app)</text>
          <text x="477" y="134" text-anchor="middle" fill="#fcd34d" font-size="8">process + events merged JSON</text>
          <text x="285" y="170" text-anchor="middle" fill="#64748b" font-size="8">Process data → PLC every scan · Service data → on-demand · Events → CMMS on trigger</text>
        </svg>
      </div>

      <!-- Classification matching table (preserved exactly) -->
      <div class="overflow-x-auto rounded-lg border border-base-300 mt-4">
        <table class="table table-zebra">
          <thead><tr><th>Data item</th><th>Classification</th><th>Check</th></tr></thead>
          <tbody>
            <tr><td>Temperature value (23.5 °C, updated every 500 ms)</td><td><select id="ws6-1" class="select select-bordered select-sm"><option value="">--</option><option value="process">Process</option><option value="service">Service</option><option value="event">Event</option></select></td><td><span id="ws6-result-1" class="ws-check-result text-sm"></span></td></tr>
            <tr><td>Device replacement detected on Port 2</td><td><select id="ws6-2" class="select select-bordered select-sm"><option value="">--</option><option value="process">Process</option><option value="service">Service</option><option value="event">Event</option></select></td><td><span id="ws6-result-2" class="ws-check-result text-sm"></span></td></tr>
            <tr><td>Parameter read — filter time = 10 ms</td><td><select id="ws6-3" class="select select-bordered select-sm"><option value="">--</option><option value="process">Process</option><option value="service">Service</option><option value="event">Event</option></select></td><td><span id="ws6-result-3" class="ws-check-result text-sm"></span></td></tr>
            <tr><td>Object present flag (switching output, 1 or 0)</td><td><select id="ws6-4" class="select select-bordered select-sm"><option value="">--</option><option value="process">Process</option><option value="service">Service</option><option value="event">Event</option></select></td><td><span id="ws6-result-4" class="ws-check-result text-sm"></span></td></tr>
            <tr><td>Short circuit fault reported</td><td><select id="ws6-5" class="select select-bordered select-sm"><option value="">--</option><option value="process">Process</option><option value="service">Service</option><option value="event">Event</option></select></td><td><span id="ws6-result-5" class="ws-check-result text-sm"></span></td></tr>
          </tbody>
        </table>
      </div>
      <button type="button" class="btn btn-sm btn-secondary mt-2" id="ws6-check-btn">Check answers</button>

      <!-- Concept card before Q2 -->
      <div class="rounded-xl border border-info/30 bg-info/5 p-4 mt-4 space-y-1">
        <p class="font-bold text-base-content">The WebSocket stream in this app — what it carries</p>
        <p class="text-sm text-base-content/85 leading-relaxed">The WebSocket delivers one JSON frame per MQTT tick (every ~500 ms). That frame includes: port process data (temperature, switching state, alarms — all PDin-derived), supervision data (master voltage, current, temperature), and any event flags from the last cycle. It does NOT include service data — that is only available by calling the REST API endpoints (<code class="font-mono text-xs">/api/io-link/port/N/parameters</code> etc.) on demand.</p>
      </div>

      <!-- Q2 MCQ (preserved exactly) -->
      <p class="mt-4 font-medium text-base-content"><strong>Q2.</strong> In this app, which data type does the WebSocket stream deliver to the browser on every tick?</p>
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws4-q2" value="a" class="radio radio-sm radio-secondary"> Process data (sensor values) + event data (faults/warnings) merged into a single JSON payload</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws4-q2" value="b" class="radio radio-sm radio-secondary"> Service data only (parameters)</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws4-q2" value="c" class="radio radio-sm radio-secondary"> Raw binary PDin only</label>
      </div>

      <!-- NAMUR NE107 section -->
      <div class="rounded-xl border-2 border-info/30 bg-info/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-sm">🏭 Concept — NAMUR NE107: The four health symbols</p>
        <p class="text-sm text-base-content/80"><strong>NAMUR NE107</strong> is the international standard (published by NAMUR, the process automation user association) that defines four health symbols for field devices. IO-Link event codes map to these symbols on modern plant HMIs — giving any vendor-neutral HMI a standardised way to display sensor health regardless of who made the sensor.</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div class="rounded-lg p-3 space-y-1" style="background:#1e293b;border:2px solid #ef4444">
            <div class="text-2xl font-bold" style="color:#ef4444">✗</div>
            <p class="font-bold" style="color:#ef4444">Failure</p>
            <p class="text-base-content/60">Device has failed — output unreliable</p>
          </div>
          <div class="rounded-lg p-3 space-y-1" style="background:#1e293b;border:2px solid #f59e0b">
            <div class="text-2xl font-bold" style="color:#f59e0b">△</div>
            <p class="font-bold" style="color:#f59e0b">Maintenance Required</p>
            <p class="text-base-content/60">Still working but needs attention soon</p>
          </div>
          <div class="rounded-lg p-3 space-y-1" style="background:#1e293b;border:2px solid #eab308">
            <div class="text-2xl font-bold" style="color:#eab308">⊙</div>
            <p class="font-bold" style="color:#eab308">Out of Specification</p>
            <p class="text-base-content/60">Process or device outside rated limits</p>
          </div>
          <div class="rounded-lg p-3 space-y-1" style="background:#1e293b;border:2px solid #3b82f6">
            <div class="text-2xl font-bold" style="color:#3b82f6">∟</div>
            <p class="font-bold" style="color:#3b82f6">Function Check</p>
            <p class="text-base-content/60">Temporarily unreliable — maintenance in progress</p>
          </div>
        </div>
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mt-2">IO-Link events from this kit mapped to NE107</p>
        <div class="overflow-x-auto rounded-lg" style="border:1px solid #334155">
          <table class="w-full text-xs" style="border-collapse:collapse">
            <thead>
              <tr style="background:#1e293b;color:#475569">
                <td class="px-3 py-2 font-semibold">IO-Link event</td>
                <td class="px-3 py-2">NE107 symbol</td>
                <td class="px-3 py-2">Meaning</td>
              </tr>
            </thead>
            <tbody class="text-base-content/80">
              <tr style="border-top:1px solid #1e293b">
                <td class="px-3 py-2">OMRON E2E instability alarm</td>
                <td class="px-3 py-2 font-bold" style="color:#f59e0b">△ Maintenance Required</td>
                <td class="px-3 py-2">Still detecting but alignment drifting — schedule realignment</td>
              </tr>
              <tr style="border-top:1px solid #1e293b">
                <td class="px-3 py-2">OMRON E2E over-approach alarm</td>
                <td class="px-3 py-2 font-bold" style="color:#eab308">⊙ Out of Specification</td>
                <td class="px-3 py-2">Target too close — outside rated sensing range</td>
              </tr>
              <tr style="border-top:1px solid #1e293b">
                <td class="px-3 py-2">TV7105 SP1 threshold exceeded</td>
                <td class="px-3 py-2 font-bold" style="color:#eab308">⊙ Out of Specification</td>
                <td class="px-3 py-2">Process temperature outside set limit</td>
              </tr>
              <tr style="border-top:1px solid #1e293b">
                <td class="px-3 py-2">Calibration write in progress</td>
                <td class="px-3 py-2 font-bold" style="color:#3b82f6">∟ Function Check</td>
                <td class="px-3 py-2">Sensor temporarily unreliable during parameter write</td>
              </tr>
              <tr style="border-top:1px solid #1e293b">
                <td class="px-3 py-2">IO-Link connection lost (port inactive)</td>
                <td class="px-3 py-2 font-bold" style="color:#ef4444">✗ Failure</td>
                <td class="px-3 py-2">No response from device — check wiring</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q3.</strong> The OMRON E2E proximity sensor reports an instability alarm. Which NAMUR NE107 health symbol should the plant HMI display?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws5-q3" value="a" class="radio radio-sm radio-secondary"> ✗ Failure — the sensor has completely stopped functioning</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws5-q3" value="b" class="radio radio-sm radio-secondary"> △ Maintenance Required — the sensor is still operating but needs attention</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws5-q3" value="c" class="radio radio-sm radio-secondary"> ∟ Function Check — the sensor is being calibrated</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q4.</strong> Why does NAMUR NE107 matter for IO-Link integration?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws5-q4" value="a" class="radio radio-sm radio-secondary"> It defines the 4 wire colours used for IO-Link cabling on Class B ports</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws5-q4" value="b" class="radio radio-sm radio-secondary"> It is the standard that the AL1350 uses to set port modes (inactive/digital/IO-Link)</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws5-q4" value="c" class="radio radio-sm radio-secondary"> It provides a vendor-neutral set of health symbols so any plant HMI can display IO-Link device status consistently, regardless of manufacturer</label>
      </div>

      <!-- Verification section -->
      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-base">🎯 Verification — classify live data flowing through the system</p>

        <!-- Connection Diagnostics embedded panel -->
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Connection Diagnostics</p>
            <span id="cp2-diag-badge" class="badge badge-xs badge-ghost font-mono">—</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">Circuit Breaker</div>
              <div id="cp2-diag-circuit" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">Success Rate</div>
              <div id="cp2-diag-success" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">MQTT</div>
              <div id="cp2-diag-mqtt" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
          </div>
          <div class="rounded bg-base-100 border border-base-300 p-2">
            <div class="text-xs text-base-content/50 mb-1">Latency p50 / p95 (ms)</div>
            <div class="flex items-center gap-2">
              <div id="cp2-diag-latency-chart" class="flex-1 h-8 bg-base-200 rounded overflow-hidden flex items-end gap-px"></div>
              <div id="cp2-diag-p95" class="font-mono text-sm text-base-content w-16 text-right">—</div>
            </div>
          </div>
        </div>

        <!-- Edge Device embedded panel -->
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 space-y-2">
          <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Edge Device — Services</p>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">Backend API</div>
              <div id="cp2-edge-backend" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">CPU</div>
              <div id="cp2-edge-cpu" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">CPU Temp</div>
              <div id="cp2-edge-cputemp" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
          </div>
        </div>

        <p class="text-sm text-base-content/80">Explore the <a href="#" data-page="home" class="link link-warning">Dashboard</a> and <a href="#" data-page="io-link-master" class="link link-warning">IO-Link page</a>. Tick each item when confirmed.</p>
        <div class="space-y-2 text-sm">
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Identify three process data values visible in real time on the Dashboard (e.g. temperature, proximity detected state, detection count) — these arrive via WebSocket every 500 ms</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Navigate to Port 3's parameter panel on the Dashboard and perform an SP1 read — this is a service data request (ISDU read via REST API, not WebSocket)</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Confirm the MQTT status above shows CONNECTED — the process data path is healthy</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Circuit breaker CLOSED above — the service data (HTTP/ISDU) path to the AL1350 is available</span>
          </label>
        </div>
      </div>

      <div id="cp2-ws4-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Classification: Temperature 23.5°C = Process; Device replacement = Event; Filter time parameter = Service; Object present flag = Process; Short circuit fault = Event. Q2: a — WebSocket delivers process data + event data merged into one JSON payload each tick; service data is only read on demand via separate ISDU calls. Q3: b — instability alarm = Maintenance Required (sensor still operates but needs attention). Q4: c — NE107 provides vendor-neutral health symbols for any plant HMI.</div>
    `
  },
  {
    id: 7,
    title: 'PLC, HMI &amp; OPC UA Integration',
    shortDesc: 'Trace IO-Link data from PDin to PLC scan cycle, web HMI, and OPC UA cloud bridge.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'IO-Link data has no value until it reaches a decision-making system. Understanding how it travels — from PDin through fieldbus to PLC, web HMI, and ultimately to OPC UA cloud systems — is what separates an IO-Link installer from an IO-Link systems integrator.',
    relatedLearn: '',
    relatedDashboard: 'Dashboard: Port Status, Simulate Fault',
    prerequisites: 'Complete CP7395 Worksheets 1–4',
    contentHtml: `
<p class="text-base-content/90 leading-relaxed">IO-Link data does not automatically appear in a PLC. It must travel through the master's process image and a fieldbus before the PLC scan cycle can read it. This worksheet maps that journey onto what you already know from this app — the two paths are structurally identical. Every layer in a traditional PROFINET or EtherNet/IP integration has a direct counterpart in the architecture running on this screen.</p>

<div class="space-y-2 mt-4">
  <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
    <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
    <span class="cp2-kit-text"><strong>PLC process image:</strong> the IO-Link master collects PDin from all ports and builds a combined process data block. The PLC reads this block on every scan cycle via the fieldbus. Equivalent in this app: the AL1350 pushes all port PDin via MQTT — FastAPI reads it all at once.</span>
  </label>
  <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
    <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
    <span class="cp2-kit-text"><strong>Fieldbus protocols:</strong> PROFINET and EtherNet/IP are the two dominant fieldbus protocols in industry. They carry the master's process image to the PLC at cyclic intervals (typically 1–10 ms). Equivalent in this app: the WebSocket <code>/ws</code> carries the decoded JSON to the browser every ~500 ms.</span>
  </label>
  <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
    <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
    <span class="cp2-kit-text"><strong>Web HMI advantages:</strong> a web-based HMI (like this app) is accessible from any device on the LAN without installing software. It can show trends over time (historical data), aggregate multiple machines, and support remote diagnosis. A traditional panel HMI requires a site visit.</span>
  </label>
  <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
    <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
    <span class="cp2-kit-text"><strong>Latency interpretation:</strong> high RTT on the Connection Diagnostics page indicates the AL1350 is under load or the 192.168.7.x subnet has congestion — not a Wi-Fi or browser problem. The browser connects to the Pi (building LAN), not the AL1350.</span>
  </label>
  <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
    <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
    <span class="cp2-kit-text"><strong>OPC UA (IEC 62541):</strong> the vendor-neutral standard for moving IO-Link data from PLCs to supervisory systems (SCADA, cloud, historian). Any certified OPC UA client connects to any OPC UA server regardless of manufacturer. The IO-Link OPC UA companion spec maps Vendor ID, Device ID, PDin measurements, and event codes to standardised OPC UA address space nodes.</span>
  </label>
</div>

<!-- PLC vs app architecture comparison diagram -->
<div class="rounded-xl border border-base-300 bg-base-200 p-3 mb-4 mt-4">
  <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">Traditional PLC path vs this app — equivalent layers</p>
  <svg viewBox="0 0 570 200" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
    <defs>
      <marker id="ws6-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8"/></marker>
    </defs>
    <!-- Labels -->
    <text x="5" y="18" fill="#94a3b8" font-size="9" font-weight="600">TRADITIONAL PLC PATH</text>
    <text x="5" y="118" fill="#94a3b8" font-size="9" font-weight="600">THIS APP (EQUIVALENT)</text>
    <!-- Traditional path -->
    <rect x="5" y="25" width="90" height="36" rx="5" fill="#1e3a5f"/>
    <text x="50" y="40" text-anchor="middle" fill="#93c5fd" font-size="8" font-weight="600">IO-Link Sensor</text>
    <text x="50" y="52" text-anchor="middle" fill="#bfdbfe" font-size="7">PDin every cycle</text>
    <line x1="95" y1="43" x2="128" y2="43" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#ws6-arr)"/>
    <rect x="130" y="25" width="90" height="36" rx="5" fill="#ea580c"/>
    <text x="175" y="40" text-anchor="middle" fill="white" font-size="8" font-weight="600">IO-Link Master</text>
    <text x="175" y="52" text-anchor="middle" fill="#fed7aa" font-size="7">process image</text>
    <line x1="220" y1="43" x2="253" y2="43" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#ws6-arr)"/>
    <rect x="255" y="25" width="90" height="36" rx="5" fill="#312e81"/>
    <text x="300" y="40" text-anchor="middle" fill="#a5b4fc" font-size="8" font-weight="600">Fieldbus</text>
    <text x="300" y="52" text-anchor="middle" fill="#c7d2fe" font-size="7">PROFINET / EtherNet/IP</text>
    <line x1="345" y1="43" x2="378" y2="43" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#ws6-arr)"/>
    <rect x="380" y="25" width="90" height="36" rx="5" fill="#134e4a"/>
    <text x="425" y="40" text-anchor="middle" fill="#99f6e4" font-size="8" font-weight="600">PLC</text>
    <text x="425" y="52" text-anchor="middle" fill="#6ee7b7" font-size="7">scan cycle reads I/O</text>
    <line x1="470" y1="43" x2="503" y2="43" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#ws6-arr)"/>
    <rect x="505" y="25" width="58" height="36" rx="5" fill="#1e293b"/>
    <text x="534" y="40" text-anchor="middle" fill="#e2e8f0" font-size="8" font-weight="600">HMI</text>
    <text x="534" y="52" text-anchor="middle" fill="#94a3b8" font-size="7">display</text>
    <!-- This app path -->
    <rect x="5" y="125" width="90" height="36" rx="5" fill="#1e3a5f"/>
    <text x="50" y="140" text-anchor="middle" fill="#93c5fd" font-size="8" font-weight="600">IO-Link Sensor</text>
    <text x="50" y="152" text-anchor="middle" fill="#bfdbfe" font-size="7">PDin via MQTT</text>
    <line x1="95" y1="143" x2="128" y2="143" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#ws6-arr)"/>
    <rect x="130" y="125" width="90" height="36" rx="5" fill="#ea580c"/>
    <text x="175" y="140" text-anchor="middle" fill="white" font-size="8" font-weight="600">AL1350</text>
    <text x="175" y="152" text-anchor="middle" fill="#fed7aa" font-size="7">MQTT 500 ms push</text>
    <line x1="220" y1="143" x2="253" y2="143" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#ws6-arr)"/>
    <rect x="255" y="125" width="90" height="36" rx="5" fill="#15803d"/>
    <text x="300" y="140" text-anchor="middle" fill="#bbf7d0" font-size="8" font-weight="600">FastAPI / Mosquitto</text>
    <text x="300" y="152" text-anchor="middle" fill="#86efac" font-size="7">WebSocket /ws</text>
    <line x1="345" y1="143" x2="378" y2="143" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#ws6-arr)"/>
    <rect x="380" y="125" width="90" height="36" rx="5" fill="#451a03"/>
    <text x="425" y="140" text-anchor="middle" fill="#fde68a" font-size="8" font-weight="600">decoder.py</text>
    <text x="425" y="152" text-anchor="middle" fill="#fcd34d" font-size="7">PDin → values</text>
    <line x1="470" y1="143" x2="503" y2="143" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#ws6-arr)"/>
    <rect x="505" y="125" width="58" height="36" rx="5" fill="#1e293b"/>
    <text x="534" y="140" text-anchor="middle" fill="#e2e8f0" font-size="8" font-weight="600">Browser</text>
    <text x="534" y="152" text-anchor="middle" fill="#94a3b8" font-size="7">this HMI</text>
    <!-- Equivalence annotations -->
    <text x="175" y="108" text-anchor="middle" fill="#f59e0b" font-size="7">&#8801; master maps PDin</text>
    <text x="300" y="108" text-anchor="middle" fill="#f59e0b" font-size="7">&#8801; fieldbus transport</text>
    <text x="425" y="108" text-anchor="middle" fill="#f59e0b" font-size="7">&#8801; PLC scan / decode</text>
    <text x="534" y="108" text-anchor="middle" fill="#f59e0b" font-size="7">&#8801; HMI display</text>
  </svg>
</div>

<!-- Concept card: How PDin reaches the PLC scan cycle -->
<div class="rounded-xl border border-info/30 bg-info/5 p-4 mb-4 space-y-2">
  <p class="font-semibold text-base-content text-sm">How PDin reaches the PLC scan cycle</p>
  <ol class="list-decimal list-inside space-y-1 text-sm text-base-content/85">
    <li>The sensor generates PDin data on each IO-Link cycle — the Omron E2E on Port 1 runs at COM3 (230.4 kbps), producing a new 2-byte PDin on every IO-Link frame.</li>
    <li>The IO-Link master (AL1350) stores PDin from all connected ports in its process data image — a single block combining all port readings.</li>
    <li>The PLC reads the process image via fieldbus on every scan cycle — for PROFINET this is typically every 4 ms. The data appears in the PLC's I/O memory (e.g. IW0.0 for Port 1 word input).</li>
    <li>The PLC program accesses sensor values as I/O memory addresses, the same way it reads a conventional digital or analogue input module.</li>
  </ol>
  <p class="text-sm text-base-content/70 mt-1">In this app: FastAPI subscribes to MQTT and receives the same combined payload every 500 ms — then broadcasts it via WebSocket to the browser. The structure is identical; only the transport protocol and cycle time differ.</p>
</div>

<p class="text-base-content/90 leading-relaxed"><strong>1.</strong> How does IO-Link process data from a sensor reach a PLC I/O scan cycle?</p>
<div class="space-y-2 mt-1">
  <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws5-q1" value="a" class="radio radio-sm radio-secondary"> The sensor connects directly to a PLC input card using its IO-Link cable, with the master acting only as a power supply and forwarding no data to the fieldbus network</label>
  <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws5-q1" value="b" class="radio radio-sm radio-secondary"> The sensor transmits binary frames over Wi-Fi directly to the PLC's memory address</label>
  <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws5-q1" value="c" class="radio radio-sm radio-secondary"> The IO-Link master maps each port's PDin into its process image; the PLC reads this via a fieldbus on every scan cycle</label>
</div>

<p class="mt-3 font-medium text-base-content"><strong>2.</strong> In this app, the backend acts as the "PLC equivalent" — it receives IO-Link data and exposes it to the browser. Which backend component is responsible for:</p>
<div class="overflow-x-auto rounded-lg border border-base-300 mt-2">
  <table class="table table-sm">
    <thead><tr><th>Function</th><th>Backend component</th><th>Check</th></tr></thead>
    <tbody>
      <tr><td>Subscribing to AL1350 MQTT topics</td><td><select id="ws5-comp-1" class="select select-bordered select-sm w-full"><option value="">-- Select --</option><option value="fastapi">io_link_fastapi.py</option><option value="decoder">decoder.py</option><option value="client">al1350_client.py</option></select></td><td><span id="ws5-comp-result-1" class="ws-check-result text-sm"></span></td></tr>
      <tr><td>Decoding raw PDin into °C / object state / CL50 colour</td><td><select id="ws5-comp-2" class="select select-bordered select-sm w-full"><option value="">-- Select --</option><option value="fastapi">io_link_fastapi.py</option><option value="decoder">decoder.py</option><option value="client">al1350_client.py</option></select></td><td><span id="ws5-comp-result-2" class="ws-check-result text-sm"></span></td></tr>
      <tr><td>Pushing decoded data to the browser</td><td><select id="ws5-comp-3" class="select select-bordered select-sm w-full"><option value="">-- Select --</option><option value="fastapi">io_link_fastapi.py</option><option value="decoder">decoder.py</option><option value="client">al1350_client.py</option></select></td><td><span id="ws5-comp-result-3" class="ws-check-result text-sm"></span></td></tr>
    </tbody>
  </table>
</div>
<button type="button" class="btn btn-primary btn-sm mt-2" id="ws5-comp-check-btn">Check answers</button>

<!-- Concept card: Web HMI vs panel HMI -->
<div class="rounded-xl border border-info/30 bg-info/5 p-4 mt-4 mb-2 space-y-2">
  <p class="font-semibold text-base-content text-sm">Web HMI vs panel HMI — what the data enables</p>
  <p class="text-sm text-base-content/85">A traditional Siemens or Rockwell HMI panel shows current values only — whatever the PLC is holding at that instant. This web app adds capabilities that a fixed panel cannot match:</p>
  <ul class="list-disc list-inside space-y-1 text-sm text-base-content/85">
    <li><strong>Historical trend charts</strong> — the last 50 readings are displayed as a scrolling chart per sensor. A panel HMI typically shows a single live value with no trend.</li>
    <li><strong>Multi-sensor simultaneous view</strong> — all four ports are visible on one screen without mode changes or navigation.</li>
    <li><strong>ISDU parameter access from the same interface</strong> — setpoints, calibration offsets, and teach commands are accessible from the Dashboard without a separate commissioning tool.</li>
    <li><strong>Remote access from any browser on the LAN</strong> — no software installation required. A traditional panel HMI is fixed to one physical location and requires a site visit.</li>
  </ul>
  <p class="text-sm text-base-content/70 mt-1">The data path is equivalent to a PLC-fed HMI in every structural sense — only the interface capabilities and deployment model differ.</p>
</div>

<p class="mt-3 font-medium text-base-content"><strong>3.</strong> What is the key advantage of a web HMI like this app over walking to the machine?</p>
<div class="space-y-2 mt-1">
  <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q3" value="a" class="radio radio-sm radio-secondary"> Walking to the machine is always preferred because it provides a physical inspection opportunity that remote tools cannot replicate</label>
  <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q3" value="b" class="radio radio-sm radio-secondary"> A web HMI only functions when the machine has a stable internet connection</label>
  <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q3" value="c" class="radio radio-sm radio-secondary"> Faster fault identification, multi-machine monitoring, and historical trends without a site visit</label>
</div>

<div class="alert bg-secondary/10 border border-secondary/30 rounded-lg text-base-content mt-3">
  <strong>Do this:</strong> Open <a href="#" data-page="admin" class="link link-secondary">Connection Diagnostics</a>. The latency graph shows round-trip time to the AL1350 over HTTP. What does a spike in this graph tell you about the health of the IO-Link network?
</div>
<div class="space-y-2 mt-2">
  <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q4" value="a" class="radio radio-sm radio-secondary"> High latency on the IO-Link subnet or the AL1350 being overloaded</label>
  <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q4" value="b" class="radio radio-sm radio-secondary"> The dashboard browser tab is consuming too much memory and slowing the chart rendering</label>
  <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q4" value="c" class="radio radio-sm radio-secondary"> The Pi's MQTT broker has stopped forwarding messages and is queueing them internally until the buffer limit is reached</label>
</div>

      <!-- OPC UA section -->
      <div class="rounded-xl border-2 border-info/30 bg-info/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-sm">🌐 Concept — OPC UA: the Industry 4.0 data bridge</p>
        <p class="text-sm text-base-content/80"><strong>OPC UA</strong> (IEC 62541) is the vendor-neutral standard for moving data from shop floor systems (PLCs, IO-Link masters) to supervisory systems (SCADA, data historians, cloud platforms). It is the "common language" of Industry 4.0 — any certified OPC UA client can connect to any OPC UA server regardless of manufacturer.</p>
        <div class="rounded-xl border border-base-300 bg-base-200 p-3">
          <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">Extended data path with OPC UA</p>
          <svg viewBox="0 0 570 80" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
            <defs>
              <marker id="opcua-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8"/></marker>
            </defs>
            <rect x="5" y="20" width="75" height="36" rx="5" fill="#1e3a5f"/>
            <text x="42" y="35" text-anchor="middle" fill="#93c5fd" font-size="8" font-weight="600">IO-Link</text>
            <text x="42" y="47" text-anchor="middle" fill="#bfdbfe" font-size="7">Sensor + AL1350</text>
            <line x1="80" y1="38" x2="103" y2="38" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#opcua-arr)"/>
            <rect x="105" y="20" width="75" height="36" rx="5" fill="#312e81"/>
            <text x="142" y="35" text-anchor="middle" fill="#a5b4fc" font-size="8" font-weight="600">PLC</text>
            <text x="142" y="47" text-anchor="middle" fill="#c7d2fe" font-size="7">PROFINET</text>
            <line x1="180" y1="38" x2="203" y2="38" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#opcua-arr)"/>
            <rect x="205" y="20" width="90" height="36" rx="5" fill="#134e4a"/>
            <text x="250" y="35" text-anchor="middle" fill="#99f6e4" font-size="8" font-weight="600">OPC UA Server</text>
            <text x="250" y="47" text-anchor="middle" fill="#6ee7b7" font-size="7">address space</text>
            <line x1="295" y1="38" x2="318" y2="38" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#opcua-arr)"/>
            <rect x="320" y="5" width="80" height="28" rx="4" fill="#1e293b"/>
            <text x="360" y="16" text-anchor="middle" fill="#e2e8f0" font-size="7" font-weight="600">SCADA</text>
            <text x="360" y="26" text-anchor="middle" fill="#94a3b8" font-size="6">plant display</text>
            <rect x="320" y="40" width="80" height="28" rx="4" fill="#1e293b"/>
            <text x="360" y="51" text-anchor="middle" fill="#e2e8f0" font-size="7" font-weight="600">Historian</text>
            <text x="360" y="61" text-anchor="middle" fill="#94a3b8" font-size="6">long-term data</text>
            <line x1="400" y1="19" x2="423" y2="19" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#opcua-arr)"/>
            <line x1="400" y1="54" x2="423" y2="54" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#opcua-arr)"/>
            <rect x="425" y="20" width="80" height="36" rx="5" fill="#1c1917"/>
            <text x="465" y="35" text-anchor="middle" fill="#fde68a" font-size="8" font-weight="600">Cloud / MES</text>
            <text x="465" y="47" text-anchor="middle" fill="#fcd34d" font-size="7">any OPC UA client</text>
          </svg>
        </div>
        <div class="overflow-x-auto rounded-lg" style="border:1px solid #334155">
          <table class="w-full text-xs" style="border-collapse:collapse">
            <thead>
              <tr style="background:#1e293b;color:#475569">
                <td class="px-3 py-2 font-semibold">OPC UA concept</td>
                <td class="px-3 py-2">What it means</td>
              </tr>
            </thead>
            <tbody class="text-base-content/80">
              <tr style="border-top:1px solid #1e293b">
                <td class="px-3 py-2 font-bold text-info">Address space</td>
                <td class="px-3 py-2">All data exposed as nodes in a hierarchical tree — Vendor ID lives at Server/DeviceSet/Port1/VendorID. Any client can browse and subscribe.</td>
              </tr>
              <tr style="border-top:1px solid #1e293b">
                <td class="px-3 py-2 font-bold text-info">Subscriptions</td>
                <td class="px-3 py-2">Client subscribes to nodes; server pushes only when values change. Reduces network load vs polling — similar to MQTT but with a standardised schema.</td>
              </tr>
              <tr style="border-top:1px solid #1e293b">
                <td class="px-3 py-2 font-bold text-info">Security</td>
                <td class="px-3 py-2">Built-in certificates, message signing, encryption, and user authentication. Designed for OT security from the ground up.</td>
              </tr>
              <tr style="border-top:1px solid #1e293b">
                <td class="px-3 py-2 font-bold text-info">IO-Link companion spec</td>
                <td class="px-3 py-2">Maps Vendor ID → ManufacturerName node, Device ID → Model node, PDin bytes → individual measurement nodes, event codes → Condition objects.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="rounded-lg p-3 space-y-2" style="background:#0f172a;border:1px solid #334155">
          <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">This app vs OPC UA path</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div class="rounded p-2 space-y-1" style="background:#1e293b;border:1px solid #334155">
              <p class="text-base-content/40 text-xs">This app</p>
              <p style="color:#94a3b8">AL1350 → MQTT → FastAPI → <span style="color:#38bdf8">WebSocket → Browser</span></p>
            </div>
            <div class="rounded p-2 space-y-1" style="background:#1e293b;border:1px solid #334155">
              <p class="text-base-content/40 text-xs">OPC UA path</p>
              <p style="color:#94a3b8">AL1350 → PLC (PROFINET) → <span style="color:#4ade80">OPC UA Server → Any Client</span></p>
            </div>
          </div>
          <p class="text-xs text-base-content/50">Key difference: WebSocket is proprietary to this app. OPC UA is an international standard — any SCADA on the market can connect without custom code.</p>
        </div>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q5.</strong> In an OPC UA-enabled plant, where does the IO-Link process data from the AL1350 typically end up first?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q5" value="a" class="radio radio-sm radio-secondary"> Directly in the OPC UA server — the AL1350 publishes OPC UA natively over Ethernet</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q5" value="b" class="radio radio-sm radio-secondary"> In the PLC process image via fieldbus (e.g. PROFINET), then in the OPC UA server via the PLC's OPC UA interface</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q5" value="c" class="radio radio-sm radio-secondary"> In the SCADA historian — it bypasses the PLC entirely and writes directly to the cloud database</label>
      </div>

<!-- Verification section -->
<div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3">
  <p class="font-bold text-base-content text-base">🎯 Verification — trace the equivalent layers in this app</p>
  <p class="text-sm text-base-content/80">Use the live panels below and the <a href="#" data-page="home" class="link link-warning">Dashboard</a> to confirm each layer. Tick each item when verified.</p>

  <!-- Connection Diagnostics embedded panel -->
  <div class="rounded-lg border border-base-300 bg-base-200 p-3 space-y-2">
    <div class="flex items-center justify-between">
      <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Connection Diagnostics</p>
      <span id="cp2-diag-badge" class="badge badge-xs badge-ghost font-mono">—</span>
    </div>
    <div class="grid grid-cols-3 gap-2 text-center">
      <div class="rounded bg-base-100 border border-base-300 p-2">
        <div class="text-xs text-base-content/50 mb-1">Circuit Breaker</div>
        <div id="cp2-diag-circuit" class="font-bold font-mono text-sm text-base-content">—</div>
      </div>
      <div class="rounded bg-base-100 border border-base-300 p-2">
        <div class="text-xs text-base-content/50 mb-1">Success Rate</div>
        <div id="cp2-diag-success" class="font-bold font-mono text-sm text-base-content">—</div>
      </div>
      <div class="rounded bg-base-100 border border-base-300 p-2">
        <div class="text-xs text-base-content/50 mb-1">MQTT</div>
        <div id="cp2-diag-mqtt" class="font-bold font-mono text-sm text-base-content">—</div>
      </div>
    </div>
    <div class="h-28"><canvas id="cp2-diag-latency-chart"></canvas></div>
    <p class="text-xs text-base-content/40">RTT p95: <span id="cp2-diag-p95">—</span> ms &nbsp;·&nbsp; HTTP poll latency to AL1350</p>
  </div>

  <!-- Edge Device embedded panel -->
  <div class="rounded-lg border border-base-300 bg-base-200 p-3 space-y-2">
    <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Edge Device — Services</p>
    <div class="grid grid-cols-3 gap-2 text-center">
      <div class="rounded bg-base-100 border border-base-300 p-2">
        <div class="text-xs text-base-content/50 mb-1">Backend API</div>
        <div id="cp2-edge-backend" class="font-bold font-mono text-sm text-base-content">—</div>
      </div>
      <div class="rounded bg-base-100 border border-base-300 p-2">
        <div class="text-xs text-base-content/50 mb-1">CPU</div>
        <div id="cp2-edge-cpu" class="font-bold font-mono text-sm text-base-content">—</div>
      </div>
      <div class="rounded bg-base-100 border border-base-300 p-2">
        <div class="text-xs text-base-content/50 mb-1">CPU Temp</div>
        <div id="cp2-edge-cputemp" class="font-bold font-mono text-sm text-base-content">—</div>
      </div>
    </div>
  </div>

  <div class="space-y-2 text-sm">
    <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
      <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
      <span class="cp2-kit-text">The latency chart above shows HTTP RTT to the AL1350 — this is the equivalent of the <strong>fieldbus cycle time</strong> in a PLC system</span>
    </label>
    <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
      <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
      <span class="cp2-kit-text">Note the current temperature on Port 3 (Dashboard) — this is process data that would appear in the <strong>PLC I/O memory address</strong> in an industrial integration</span>
    </label>
    <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
      <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
      <span class="cp2-kit-text">Backend API shows <strong>Online</strong> above — FastAPI (the "PLC equivalent") is running and receiving IO-Link process data</span>
    </label>
    <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
      <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
      <span class="cp2-kit-text">MQTT status <strong>CONNECTED</strong> above — the primary data path (equivalent to fieldbus) is healthy</span>
    </label>
  </div>
</div>

<div id="cp2-ws5-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: c — the IO-Link master maps PDin into its process image; the PLC reads this via fieldbus each scan cycle. Q2: io_link_fastapi.py (MQTT subscription, rows 1 and 3); decoder.py (PDin decode, row 2). Q3: c — faster fault identification, multi-machine monitoring, and trend history. Latency spike: a — points to IO-Link subnet congestion or AL1350 load. Q5: b — IO-Link data goes into the PLC process image via fieldbus first; the PLC's OPC UA interface then exposes it to any OPC UA client.</div>
    `
  },
  {
    id: 8,
    title: 'Case Study — MTTR, TCO &amp; Predictive Maintenance',
    shortDesc: 'Calculate the business case and understand how IO-Link data enables the shift from reactive to predictive maintenance.',
    estimatedTime: 'About 20 min',
    whyItMatters: 'Reactive maintenance is the most expensive strategy. Predictive maintenance using IO-Link data is the least expensive. This worksheet quantifies both and shows how cycle count, diagnostic event trends, and process data drift enable condition-based replacement decisions.',
    relatedLearn: '',
    relatedDashboard: 'Dashboard: Simulate Fault, Active Port Details',
    prerequisites: 'Complete CP7395 Worksheets 1–5',
    contentHtml: `
<p class="text-base-content/90 leading-relaxed"><strong class="text-base-content">Scenario:</strong> A production line has 40 sensors. On average, each sensor causes one fault per year. With standard sensors, locating and reconfiguring after a fault takes 35 minutes. With IO-Link, the HMI identifies the port and fault type instantly, and parameters are restored automatically — total time: 8 minutes.</p>

      <!-- Understanding checklist -->
      <div class="space-y-2 mt-4 text-sm">
        <p class="font-semibold text-base-content text-sm uppercase tracking-wide text-base-content/60 mb-2">Key concepts — tick each when you understand it</p>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text"><strong>MTTR (Mean Time to Repair):</strong> the average time from fault detection to confirmed repair. Standard sensors: walk to machine → identify faulty port → replace sensor → reconfigure parameters → verify output = ~35 min. IO-Link: HMI alerts with port number and fault type → order confirmed spare → swap sensor → master auto-restores parameters → HMI confirms recovery = ~8 min.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text"><strong>Annual downtime calculation:</strong> MTTR × faults per year × number of sensors ÷ 60 = downtime in hours. Standard: 35 × 1 × 40 ÷ 60 = <strong>23.3 h/year</strong>. IO-Link: 8 × 1 × 40 ÷ 60 = <strong>5.3 h/year</strong>.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text"><strong>Financial impact:</strong> downtime hours × production value per hour. At £5,000/hour: Standard costs <strong>£116,500/year</strong>, IO-Link costs <strong>£26,500/year</strong>. Annual saving: <strong>£90,000</strong>.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text"><strong>TCO (Total Cost of Ownership):</strong> the true cost over the lifetime of the system, including installation, commissioning, spares, downtime, and labour. IO-Link reduces TCO through: automatic parameter restore (no re-commissioning labour), remote diagnostics (no site visit), predictive maintenance (fewer emergency callouts).</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text"><strong>CMMS integration:</strong> event data (fault codes, timestamps, port identifiers) feeds a Computerised Maintenance Management System. This auto-generates work orders without manual data entry — the IO-Link event becomes the maintenance trigger.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text"><strong>Three maintenance strategies:</strong> Reactive (fix after failure, highest MTTR and cost), Planned Preventive (fixed schedule, medium cost, may replace too early), Predictive / condition-based (replace when data indicates wear, lowest cost). IO-Link enables predictive by providing cycle count, event frequency, and process drift data.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text"><strong>Remaining Useful Life (RUL):</strong> calculated from cycle count vs rated lifetime. If a capacitive sensor has done 7.5M of its rated 10M cycles at 1,000 cycles/day, it has ~1,500 days to the 90% threshold. CMMS work order raised now — scheduled replacement in a planned window, not an emergency callout.</span>
        </label>
      </div>

      <!-- MTTR concept card -->
      <div class="rounded-xl border border-info/30 bg-info/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-sm">What is MTTR and how does IO-Link change it?</p>
        <p class="text-sm text-base-content/80">MTTR (Mean Time to Repair) measures maintenance efficiency — the lower it is, the faster your line recovers from faults. IO-Link attacks the two most time-consuming steps: identification and reconfiguration.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="rounded-lg border border-error/30 bg-error/5 p-3 space-y-1">
            <p class="font-bold text-error text-xs uppercase tracking-wide">Standard sensor workflow — 35 min</p>
            <div class="space-y-1 text-base-content/80">
              <div class="flex justify-between"><span>1. Walk to machine, find faulty sensor</span><span class="font-mono text-error">~10 min</span></div>
              <div class="flex justify-between"><span>2. Power down, remove sensor</span><span class="font-mono text-error">~5 min</span></div>
              <div class="flex justify-between"><span>3. Reconfigure parameters manually</span><span class="font-mono text-error">~12 min</span></div>
              <div class="flex justify-between"><span>4. Verify output and sign off</span><span class="font-mono text-error">~8 min</span></div>
              <div class="flex justify-between font-bold border-t border-error/20 pt-1 mt-1"><span>Total</span><span class="text-error">35 min</span></div>
            </div>
          </div>
          <div class="rounded-lg border border-success/30 bg-success/5 p-3 space-y-1">
            <p class="font-bold text-success text-xs uppercase tracking-wide">IO-Link workflow — 8 min</p>
            <div class="space-y-1 text-base-content/80">
              <div class="flex justify-between"><span>1. HMI alerts: Port 3, fault code 0x8C11</span><span class="font-mono text-success">~0 min</span></div>
              <div class="flex justify-between"><span>2. Order confirmed spare by Device ID</span><span class="font-mono text-success">~2 min</span></div>
              <div class="flex justify-between"><span>3. Swap sensor — master auto-restores params</span><span class="font-mono text-success">~4 min</span></div>
              <div class="flex justify-between"><span>4. HMI confirms recovery — sign off</span><span class="font-mono text-success">~2 min</span></div>
              <div class="flex justify-between font-bold border-t border-success/20 pt-1 mt-1"><span>Total</span><span class="text-success">8 min</span></div>
            </div>
          </div>
        </div>
        <p class="text-xs text-base-content/70">The biggest time savings are at <strong>step 1</strong> (identification — instant vs ~10 min walk-and-find) and <strong>step 3</strong> (reconfiguration — automatic vs ~12 min manual). Together these two steps account for 22 of the 27 minutes saved per fault.</p>
        <div class="grid grid-cols-2 gap-3 text-xs mt-2">
          <div class="rounded-lg bg-base-200 p-2 text-center">
            <p class="text-base-content/60 mb-1">Standard annual downtime</p>
            <p class="font-mono font-bold text-error text-base">35 × 40 ÷ 60 = <span class="text-lg">23.3 h</span></p>
          </div>
          <div class="rounded-lg bg-base-200 p-2 text-center">
            <p class="text-base-content/60 mb-1">IO-Link annual downtime</p>
            <p class="font-mono font-bold text-success text-base">8 × 40 ÷ 60 = <span class="text-lg">5.3 h</span></p>
          </div>
        </div>
      </div>

      <!-- Downtime comparison bar chart -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">Annual downtime comparison — 40 sensors, 1 fault/sensor/year</p>
        <svg viewBox="0 0 570 200" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <!-- Per-fault bars (left group) -->
          <text x="140" y="18" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">Per-fault MTTR</text>
          <rect x="60" y="25" width="60" height="105" rx="4" fill="#dc2626"/>
          <text x="90" y="145" text-anchor="middle" fill="#ef4444" font-size="10" font-weight="700">35 min</text>
          <text x="90" y="158" text-anchor="middle" fill="#94a3b8" font-size="8">Standard</text>
          <rect x="160" y="89" width="60" height="41" rx="4" fill="#16a34a"/>
          <text x="190" y="145" text-anchor="middle" fill="#22c55e" font-size="10" font-weight="700">8 min</text>
          <text x="190" y="158" text-anchor="middle" fill="#94a3b8" font-size="8">IO-Link</text>
          <!-- Annual bars (right group) -->
          <text x="420" y="18" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">Annual downtime (hours)</text>
          <rect x="340" y="25" width="60" height="105" rx="4" fill="#dc2626"/>
          <text x="370" y="145" text-anchor="middle" fill="#ef4444" font-size="10" font-weight="700">23.3 h</text>
          <text x="370" y="158" text-anchor="middle" fill="#94a3b8" font-size="8">Standard</text>
          <rect x="440" y="82" width="60" height="48" rx="4" fill="#16a34a"/>
          <text x="470" y="145" text-anchor="middle" fill="#22c55e" font-size="10" font-weight="700">5.3 h</text>
          <text x="470" y="158" text-anchor="middle" fill="#94a3b8" font-size="8">IO-Link</text>
          <!-- Saving annotations -->
          <rect x="238" y="68" width="84" height="24" rx="12" fill="#854d0e"/>
          <text x="280" y="80" text-anchor="middle" fill="#fde68a" font-size="8" font-weight="700">Saves 27 min/fault</text>
          <text x="280" y="91" text-anchor="middle" fill="#fcd34d" font-size="7">= 18 h/year saved</text>
          <rect x="238" y="100" width="84" height="24" rx="12" fill="#14532d"/>
          <text x="280" y="112" text-anchor="middle" fill="#86efac" font-size="8" font-weight="700">£90,000/year</text>
          <text x="280" y="123" text-anchor="middle" fill="#6ee7b7" font-size="7">at £5,000/hour</text>
          <text x="285" y="185" text-anchor="middle" fill="#64748b" font-size="8">Standard: 40 × 35 min = 1,400 min = 23.3 h · IO-Link: 40 × 8 min = 320 min = 5.3 h · Saving: 18 h/year</text>
        </svg>
      </div>

      <div class="overflow-x-auto rounded-lg border border-base-300 mt-3">
        <table class="table table-zebra max-w-3xl">
          <thead><tr><th>Metric</th><th>Standard sensors</th><th>IO-Link sensors</th></tr></thead>
          <tbody>
            <tr><td>MTTR per fault (min)</td><td><input type="text" class="input input-bordered input-sm w-24" value="35"></td><td><input type="text" class="input input-bordered input-sm w-24" value="8"></td></tr>
            <tr><td>Faults per year (40 sensors)</td><td colspan="2"><input type="text" class="input input-bordered input-sm w-24" value="40"></td></tr>
            <tr><td>Total downtime per year (min)</td><td><input type="text" class="input input-bordered input-sm w-24" placeholder="calc"></td><td><input type="text" class="input input-bordered input-sm w-24" placeholder="calc"></td></tr>
            <tr><td>Total downtime per year (hours)</td><td><input type="text" class="input input-bordered input-sm w-24" placeholder="calc"></td><td><input type="text" class="input input-bordered input-sm w-24" placeholder="calc"></td></tr>
          </tbody>
        </table>
      </div>

      <!-- TCO concept card -->
      <div class="rounded-xl border border-info/30 bg-info/5 p-4 mt-4 space-y-2">
        <p class="font-bold text-base-content text-sm">TCO and the hidden cost of traditional sensors</p>
        <p class="text-sm text-base-content/80">The purchase price of a sensor is a fraction of its lifetime cost. A £50 traditional sensor may cost £200 or more in labour over its working life — each time it is swapped, a technician must manually re-enter all parameters, document the change in a spreadsheet, and possibly travel to a remote site just to read a fault code. These costs are invisible on the component budget but very visible on the maintenance budget.</p>
        <p class="text-sm text-base-content/80">IO-Link shifts this balance: the sensor costs more to buy, but total lifetime labour cost drops significantly. The master stores every parameter in its device tree. When a replacement sensor is plugged in, parameters are restored automatically in seconds — no spreadsheet, no site visit, no re-commissioning labour. Remote diagnostics via the HMI eliminate most site visits entirely for fault investigation. Predictive maintenance data (monitor output trends, alarm counters) reduces emergency callouts to planned replacements.</p>
        <div class="grid grid-cols-3 gap-2 mt-2 text-xs text-center">
          <div class="rounded-lg bg-error/10 border border-error/20 p-2">
            <p class="font-bold text-error">Purchase cost</p>
            <p class="text-base-content/70 mt-1">IO-Link sensor ~20–30% more than standard equivalent</p>
          </div>
          <div class="rounded-lg bg-success/10 border border-success/20 p-2">
            <p class="font-bold text-success">Labour saving</p>
            <p class="text-base-content/70 mt-1">Auto parameter restore eliminates ~12 min reconfiguration per swap</p>
          </div>
          <div class="rounded-lg bg-success/10 border border-success/20 p-2">
            <p class="font-bold text-success">Visit saving</p>
            <p class="text-base-content/70 mt-1">Remote fault diagnosis via HMI — engineer stays at desk</p>
          </div>
        </div>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> Using the scenario figures, what is the annual downtime saving when switching to IO-Link? (Standard: 40 × 35 min = 1,400 min = 23.3 h; IO-Link: 40 × 8 min = 320 min = 5.3 h)</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q1" value="a" class="radio radio-sm radio-secondary"> 18 hours per year</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q1" value="b" class="radio radio-sm radio-secondary"> 5.3 hours per year</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q1" value="c" class="radio radio-sm radio-secondary"> 23.3 hours per year</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> If the production line generates £5,000 of value per hour, what is the annual financial saving from IO-Link? (Saving = 18 hours × £5,000)</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q2" value="a" class="radio radio-sm radio-secondary"> £175,000</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q2" value="b" class="radio radio-sm radio-secondary"> £26,500</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q2" value="c" class="radio radio-sm radio-secondary"> £90,000</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> Beyond MTTR, which pair of benefits contributes most to lower total cost of ownership for IO-Link sensors?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q3" value="a" class="radio radio-sm radio-secondary"> Built-in wireless backup channel that activates on master power loss, and automatic IP address provisioning for all sensors</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q3" value="b" class="radio radio-sm radio-secondary"> Automatic parameter restore on sensor swap and remote diagnostics via the HMI</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q3" value="c" class="radio radio-sm radio-secondary"> Lower per-unit sensor cost due to IO-Link certification subsidising manufacturing overheads across the supply chain</label>
      </div>

      <!-- CMMS concept card -->
      <div class="rounded-xl border border-info/30 bg-info/5 p-4 mt-4 space-y-2">
        <p class="font-bold text-base-content text-sm">What is a CMMS and how does IO-Link feed it?</p>
        <p class="text-sm text-base-content/80">A CMMS (Computerised Maintenance Management System) is a software platform for managing maintenance workflows, work orders, spare parts inventory, and service history. Examples include SAP PM, IBM Maximo, and Limble CMMS. Every time a fault occurs, the CMMS opens a work order, assigns a technician, and tracks the repair to completion.</p>
        <p class="text-sm text-base-content/80">Traditionally, this requires manual data entry — a technician phones in the fault details, someone types them into the system, and there is always a risk of transcription error or delay. With IO-Link, event data is machine-readable and structured: port 2, fault code <code class="font-mono bg-base-200 px-1 rounded text-xs">0x8C11</code>, timestamp <code class="font-mono bg-base-200 px-1 rounded text-xs">2026-06-30T14:23:01Z</code>. This can auto-populate a CMMS work order via API integration — no phone call, no typing, no delay.</p>
        <div class="rounded-lg bg-base-200 p-3 mt-2 text-xs">
          <p class="font-semibold text-base-content mb-2">Data flow: IO-Link event → CMMS work order</p>
          <div class="flex items-center gap-2 flex-wrap text-center">
            <div class="rounded bg-base-300 px-2 py-1 font-mono text-base-content/80">Sensor fault<br><span class="text-error">0x8C11</span></div>
            <span class="text-base-content/40">→</span>
            <div class="rounded bg-base-300 px-2 py-1 font-mono text-base-content/80">AL1350<br>event log</div>
            <span class="text-base-content/40">→</span>
            <div class="rounded bg-secondary/20 px-2 py-1 font-mono text-secondary">FastAPI<br>backend</div>
            <span class="text-base-content/40">→</span>
            <div class="rounded bg-info/20 px-2 py-1 font-mono text-info">CMMS API<br>POST /work-orders</div>
            <span class="text-base-content/40">→</span>
            <div class="rounded bg-success/20 px-2 py-1 font-mono text-success">Work order<br>auto-created</div>
          </div>
          <p class="text-base-content/60 mt-2">The FastAPI backend running on the Pi is the bridge between IO-Link events and any CMMS API. It already collects and exposes event data — connecting to a CMMS is a single additional API call.</p>
        </div>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q4.</strong> In this app's architecture, which data would you export to a CMMS (Computerised Maintenance Management System) to automate maintenance work orders?</p>
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q4" value="a" class="radio radio-sm radio-secondary"> Event data (faults and warnings) — these are the triggers for maintenance actions</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q4" value="b" class="radio radio-sm radio-secondary"> Only process data (sensor values)</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q4" value="c" class="radio radio-sm radio-secondary"> Service data only (parameters)</label>
      </div>

      <!-- Three strategies section -->
      <div class="rounded-xl border-2 border-info/30 bg-info/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-sm">🔮 Concept — The three maintenance strategies</p>
        <div class="overflow-x-auto rounded-lg" style="border:1px solid #334155">
          <table class="w-full text-xs" style="border-collapse:collapse">
            <thead>
              <tr style="background:#1e293b;color:#475569">
                <td class="px-3 py-2 font-semibold">Strategy</td>
                <td class="px-3 py-2">Trigger</td>
                <td class="px-3 py-2">MTTR</td>
                <td class="px-3 py-2">Cost per incident</td>
                <td class="px-3 py-2">Risk</td>
              </tr>
            </thead>
            <tbody class="text-base-content/80">
              <tr style="border-top:1px solid #1e293b;background:#1a0000">
                <td class="px-3 py-2 font-bold" style="color:#ef4444">Reactive</td>
                <td class="px-3 py-2">Equipment failure</td>
                <td class="px-3 py-2 font-mono" style="color:#ef4444">35 min</td>
                <td class="px-3 py-2 font-mono" style="color:#ef4444">~£2,917</td>
                <td class="px-3 py-2">High — unplanned</td>
              </tr>
              <tr style="border-top:1px solid #1e293b;background:#0f1a0f">
                <td class="px-3 py-2 font-bold" style="color:#f59e0b">Planned Preventive</td>
                <td class="px-3 py-2">Calendar / hours</td>
                <td class="px-3 py-2 font-mono" style="color:#f59e0b">8 min</td>
                <td class="px-3 py-2 font-mono" style="color:#f59e0b">~£200</td>
                <td class="px-3 py-2">Medium — may replace too early</td>
              </tr>
              <tr style="border-top:1px solid #1e293b;background:#001a0a">
                <td class="px-3 py-2 font-bold" style="color:#22c55e">Predictive (condition)</td>
                <td class="px-3 py-2">Cycle count / trend</td>
                <td class="px-3 py-2 font-mono" style="color:#22c55e">8 min</td>
                <td class="px-3 py-2 font-mono" style="color:#22c55e">~£200</td>
                <td class="px-3 py-2">Low — replace at optimum time</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- RUL calculation -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-4 mt-3 space-y-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Remaining Useful Life (RUL) Calculation</p>
        <p class="text-sm text-base-content/80">IO-Link sensors expose cycle count via ISDU. Combine it with the rated lifetime to calculate RUL and schedule replacement proactively:</p>
        <div class="rounded-lg p-3 space-y-2 font-mono text-xs" style="background:#0f172a;border:1px solid #334155;color:#94a3b8">
          <div><span style="color:#475569">1.</span> Read cycle count (ISDU): <span style="color:#f59e0b">7,500,000</span> operations</div>
          <div><span style="color:#475569">2.</span> Rated lifetime (IODD/datasheet): <span style="color:#94a3b8">10,000,000</span> cycles</div>
          <div><span style="color:#475569">3.</span> % used: 7,500,000 ÷ 10,000,000 = <span style="color:#f59e0b">75%</span></div>
          <div><span style="color:#475569">4.</span> Current rate: <span style="color:#94a3b8">1,000 cycles/day</span> (from trend)</div>
          <div><span style="color:#475569">5.</span> Cycles to 90% threshold: (9,000,000 − 7,500,000) = <span style="color:#94a3b8">1,500,000</span></div>
          <div><span style="color:#475569">6.</span> Days remaining: 1,500,000 ÷ 1,000 = <span style="color:#22c55e;font-weight:700">1,500 days ≈ 4.1 years</span></div>
          <div class="pt-1 border-t" style="border-color:#334155;color:#4ade80">→ Raise CMMS work order: replace Port 2 capacitive sensor in 1,500 days</div>
        </div>
        <div class="grid grid-cols-2 gap-3 text-xs text-center">
          <div class="rounded-lg p-2 space-y-1" style="background:#1a0000;border:1px solid #7f1d1d">
            <p class="font-bold" style="color:#ef4444">Reactive replacement</p>
            <p class="text-base-content/70">35 min unplanned + emergency call-out</p>
            <p class="font-mono font-bold" style="color:#ef4444">~£3,000+</p>
          </div>
          <div class="rounded-lg p-2 space-y-1" style="background:#001a0a;border:1px solid #14532d">
            <p class="font-bold" style="color:#22c55e">Predictive replacement</p>
            <p class="text-base-content/70">15 min planned window labour</p>
            <p class="font-mono font-bold" style="color:#22c55e">~£200</p>
          </div>
        </div>
        <p class="text-sm font-semibold text-success text-center">Saving per replacement: ~£2,800</p>
      </div>

      <p class="text-sm text-base-content/80 mt-3 font-medium">What IO-Link data sources enable predictive maintenance in this kit:</p>
      <ul class="space-y-1.5 mt-2">
        <li class="flex items-start gap-2 text-sm text-base-content/80"><span class="text-info mt-0.5">●</span><span><strong>Cycle count (capacitive via ISDU):</strong> total detections since installation. Compared to rated lifetime → % used → RUL.</span></li>
        <li class="flex items-start gap-2 text-sm text-base-content/80"><span class="text-info mt-0.5">●</span><span><strong>Operating hours (many devices via ISDU):</strong> total powered-on time. Used for lubricant intervals and bearing life.</span></li>
        <li class="flex items-start gap-2 text-sm text-base-content/80"><span class="text-info mt-0.5">●</span><span><strong>Diagnostic event frequency:</strong> CMMS logs each NE107 "Maintenance Required" event. Increasing frequency → accelerating wear → bring forward replacement.</span></li>
        <li class="flex items-start gap-2 text-sm text-base-content/80"><span class="text-info mt-0.5">●</span><span><strong>Calibration offset drift (TV7105 Index 681):</strong> if the correction grows over time, the PT100 element is drifting → plan replacement before it exceeds class B tolerance.</span></li>
      </ul>

      <p class="mt-4 font-medium text-base-content"><strong>Q5.</strong> A capacitive sensor has completed 7.5M of its rated 10M cycles. At 1,000 cycles/day, when should you schedule replacement to reach the 90% threshold (9M cycles)?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q6" value="a" class="radio radio-sm radio-secondary"> Immediately — 75% is already past the safe operating limit</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q6" value="b" class="radio radio-sm radio-secondary"> In approximately 1,500 days (4.1 years) — schedule replacement before reaching 90% (9M cycles)</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q6" value="c" class="radio radio-sm radio-secondary"> Never — cycle count limits are advisory only and the sensor will work indefinitely beyond rated life</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q6.</strong> Which combination of IO-Link data sources best enables a shift from planned preventive to predictive maintenance?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q7" value="a" class="radio radio-sm radio-secondary"> PDin process data and WebSocket update rate — faster updates mean earlier fault detection</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q7" value="b" class="radio radio-sm radio-secondary"> Cycle count, diagnostic event frequency, and process data trend (e.g. calibration offset drift) — these reveal actual condition, not just elapsed time</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q7" value="c" class="radio radio-sm radio-secondary"> Vendor ID and Device ID — knowing the exact model allows the manufacturer to predict failure based on average lifespan data</label>
      </div>

      <!-- Verification section -->
      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-base">🎯 Verification — calculate the business case for this lab kit</p>

        <!-- Connection Diagnostics embedded panel -->
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Connection Diagnostics</p>
            <span id="cp2-diag-badge" class="badge badge-xs badge-ghost font-mono">—</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <div><p class="text-base-content/50 mb-0.5">Circuit breaker</p><div id="cp2-diag-circuit" class="font-bold font-mono text-sm text-base-content">—</div></div>
            <div><p class="text-base-content/50 mb-0.5">Success rate</p><div id="cp2-diag-success" class="font-bold font-mono text-sm text-base-content">—</div></div>
            <div><p class="text-base-content/50 mb-0.5">MQTT</p><div id="cp2-diag-mqtt" class="font-bold font-mono text-sm text-base-content">—</div></div>
          </div>
          <div class="h-28"><canvas id="cp2-diag-latency-chart"></canvas></div>
          <p class="text-xs text-base-content/40">RTT p95: <span id="cp2-diag-p95">—</span> ms &nbsp;·&nbsp; poll latency to AL1350 over HTTP</p>
        </div>

        <!-- Edge Device embedded panel -->
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 space-y-2">
          <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Edge Device — Services</p>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <div><p class="text-base-content/50 mb-0.5">Backend API</p><div id="cp2-edge-backend" class="font-bold font-mono text-sm text-base-content">—</div></div>
            <div><p class="text-base-content/50 mb-0.5">CPU load</p><div id="cp2-edge-cpu" class="font-bold font-mono text-sm text-base-content">—</div></div>
            <div><p class="text-base-content/50 mb-0.5">CPU temp</p><div id="cp2-edge-cputemp" class="font-bold font-mono text-sm text-base-content">—</div></div>
          </div>
        </div>

        <p class="text-sm text-base-content/80">Use the calculation table above and the scenario figures. Tick each item when you have verified the answer.</p>
        <div class="space-y-2 text-sm">
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Fill in the calculation table above — verify: <strong>Standard = 23.3 h/year</strong>, IO-Link = 5.3 h/year, saving = 18 h/year</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Scale the calculation to 200 sensors: 200 × 1 fault × 27 min saving ÷ 60 = <strong>90 h/year saved</strong>. At £5,000/hour = <strong>£450,000/year</strong>.</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Backend API shows <strong>Online</strong> above — this app is the "web HMI" equivalent that would deliver the £90,000/year saving in a real deployment</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Circuit breaker <strong>CLOSED</strong> above — the diagnostic event infrastructure (that enables IO-Link MTTR of 8 min) is active</span>
          </label>
        </div>
      </div>

      <div id="cp2-ws6-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: a — Standard: 40×35=1,400 min=23.3 h. IO-Link: 40×8=320 min=5.3 h. Saving = 18 h/year. Q2: c — 18 × £5,000 = £90,000/year. Q3: b — automatic parameter restore (no re-commissioning cost) and remote diagnostics (no site visit needed). Q4: a — event data (faults and warnings) triggers maintenance work orders. Q5: b — (9,000,000 − 7,500,000) ÷ 1,000 = 1,500 days until 90% threshold. Q6: b — cycle count, event frequency, and calibration drift reveal actual device condition, unlike elapsed time alone.</div>
    `
  },
  {
    id: 9,
    title: 'Device Identity — Vendor ID, Device ID &amp; PDin',
    shortDesc: 'Identify an unknown sensor using IO-Link device identity fields.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'Physical labels wear off. Maintenance records go missing. The Vendor ID and Device ID embedded in every IO-Link sensor mean you can always confirm what is connected, order the exact right spare, and decode PDin correctly — without leaving the dashboard.',
    relatedDashboard: 'IO-Link Master page — Port Status cards',
    prerequisites: 'CP3723 Chapter 8 recommended',
    contentHtml: `
<p class="text-base-content/90 leading-relaxed text-base"><strong class="text-base-content">Scenario:</strong> During a planned shutdown a technician discovers that the physical label on the sensor connected to Port 1 has completely worn away. There is no maintenance record for this port. Before ordering a spare and signing off the job, you must positively identify the device using the app — without touching the physical unit.</p>

      <!-- Understanding checklist -->
      <div class="space-y-2 mt-4">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">Key concepts — tick each when understood</p>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text text-sm"><strong>Vendor ID:</strong> a unique integer assigned to each IO-Link manufacturer by the IO-Link Community. Published in the Vendor_ID_Table.xml. Vendor 310 = ifm electronic, Vendor 342 = Contrinex, Vendor 612 = OMRON, Vendor 1586 = RS Pro. This app resolves Vendor IDs to company names automatically.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text text-sm"><strong>Device ID:</strong> a unique integer assigned by the manufacturer to each product family. Combined with Vendor ID it uniquely identifies the exact model. Device 131090 with Vendor 612 = OMRON E2E-X16MB1T12. This is the "digital nameplate" that never wears off.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text text-sm"><strong>PDin byte layout per device:</strong> once you know the Vendor ID + Device ID, you know how to decode the PDin. Vendor 612, Device 131090 → OMRON E2E → byte 0 = oscillation monitor, byte 1 = output flags. Wrong device identity → wrong PDin decode → wrong display values.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text text-sm"><strong>Automatic parameter restore on swap:</strong> when you replace a sensor, the AL1350 reads the new sensor's Device ID. If it matches what was there before, it automatically writes all stored parameters back (SP1, RP1, output logic, etc.). No re-commissioning needed.</span>
        </label>
        <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
          <span class="cp2-kit-text text-sm"><strong>Using identity for spares ordering:</strong> Vendor 1586 + Device 1052673 = RS Pro M18 capacitive (Carlo Gavazzi OEM, part number 2377240). The app resolves this without opening a catalogue.</span>
        </label>
      </div>

      <!-- Concept card: Vendor ID registry -->
      <div class="rounded-xl border border-info/30 bg-info/5 p-4 mt-4 space-y-3">
        <p class="text-xs font-semibold text-info/80 uppercase tracking-wide">The IO-Link Community Vendor ID registry</p>
        <p class="text-sm text-base-content/80">The IO-Link Community maintains an XML database of all registered manufacturer IDs. This app includes all 260+ entries from <code class="font-mono text-xs bg-base-200 px-1 rounded">Vendor_ID_Table.xml</code> v252 (May 2026). IDs above 1260 are not yet in the official XML and must be added manually. The four vendors in this kit are listed below.</p>
        <div class="overflow-x-auto">
          <table class="table table-zebra table-sm text-xs">
            <thead><tr><th>Vendor ID</th><th>Resolved Name</th><th>Device in this kit</th></tr></thead>
            <tbody>
              <tr><td class="font-mono font-semibold">310</td><td>ifm electronic</td><td>TV7105 temperature sensor (Port 3)</td></tr>
              <tr><td class="font-mono font-semibold">342</td><td>Contrinex</td><td>LTR-M18PA-PMS-603 photoelectric (Port 1 alt)</td></tr>
              <tr><td class="font-mono font-semibold">612</td><td>OMRON Corporation</td><td>E2E-X16MB1T12 proximity (Port 1)</td></tr>
              <tr><td class="font-mono font-semibold">896</td><td>RS Pro (alternate ID)</td><td>—</td></tr>
              <tr><td class="font-mono font-semibold">1586</td><td>RS Pro</td><td>M18 capacitive sensor (Port 2)</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Identity field diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-4">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">What the IO-Link master reads automatically at connection</p>
        <svg viewBox="0 0 560 120" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <rect x="10" y="20" width="100" height="80" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
          <text x="60" y="48" text-anchor="middle" fill="#94a3b8" font-size="8" font-weight="600">IO-Link</text>
          <text x="60" y="60" text-anchor="middle" fill="#94a3b8" font-size="8" font-weight="600">Sensor</text>
          <text x="60" y="75" text-anchor="middle" fill="#64748b" font-size="7">(unknown label)</text>
          <line x1="110" y1="60" x2="145" y2="60" stroke="#475569" stroke-width="1.5" marker-end="url(#arr8)"/>
          <defs><marker id="arr8" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#475569"/></marker></defs>
          <rect x="145" y="20" width="110" height="80" rx="8" fill="#0f172a" stroke="#f97316" stroke-width="1.5"/>
          <text x="200" y="48" text-anchor="middle" fill="#fb923c" font-size="8" font-weight="600">AL1350 Master</text>
          <text x="200" y="62" text-anchor="middle" fill="#94a3b8" font-size="7">reads identity</text>
          <text x="200" y="75" text-anchor="middle" fill="#94a3b8" font-size="7">at power-up</text>
          <line x1="255" y1="38" x2="290" y2="28" stroke="#475569" stroke-width="1.2" marker-end="url(#arr8)"/>
          <line x1="255" y1="60" x2="290" y2="60" stroke="#475569" stroke-width="1.2" marker-end="url(#arr8)"/>
          <line x1="255" y1="82" x2="290" y2="92" stroke="#475569" stroke-width="1.2" marker-end="url(#arr8)"/>
          <rect x="290" y="14" width="250" height="24" rx="6" fill="#1e3a5f"/>
          <text x="302" y="25" fill="#60a5fa" font-size="8" font-weight="700">Vendor ID:</text>
          <text x="360" y="25" fill="#93c5fd" font-size="8">612 → OMRON Corporation</text>
          <rect x="290" y="48" width="250" height="24" rx="6" fill="#14532d"/>
          <text x="302" y="59" fill="#4ade80" font-size="8" font-weight="700">Device ID:</text>
          <text x="355" y="59" fill="#86efac" font-size="8">131090 → E2E-X16MB1T12</text>
          <rect x="290" y="82" width="250" height="24" rx="6" fill="#3b1f6b"/>
          <text x="302" y="93" fill="#c084fc" font-size="8" font-weight="700">PDin hex:</text>
          <text x="350" y="93" fill="#d8b4fe" font-size="8">5000 → decoded process data</text>
        </svg>
      </div>

      <!-- Q1 -->
      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> Open the <a href="#" data-page="io-link-master" class="link link-secondary">IO-Link Master page</a>. What Vendor ID does Port 1 report?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q1" value="a" class="radio radio-sm radio-secondary"> 612</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q1" value="b" class="radio radio-sm radio-secondary"> 310</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q1" value="c" class="radio radio-sm radio-secondary"> 1586</label>
      </div>

      <!-- Q2 -->
      <p class="mt-4 font-medium text-base-content"><strong>Q2.</strong> The IO-Link Master page shows the Vendor ID resolved to a company name. Which manufacturer does Vendor ID 612 identify?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q2" value="a" class="radio radio-sm radio-secondary"> ifm electronic</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q2" value="b" class="radio radio-sm radio-secondary"> OMRON Corporation</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q2" value="c" class="radio radio-sm radio-secondary"> Balluff</label>
      </div>

      <!-- Concept card: Device ID -->
      <div class="rounded-xl border border-info/30 bg-info/5 p-4 mt-4 space-y-3">
        <p class="text-xs font-semibold text-info/80 uppercase tracking-wide">Device ID — the digital nameplate</p>
        <p class="text-sm text-base-content/80">Vendor ID tells you <em>who</em> made the sensor. Device ID tells you <em>which model</em> it is. Together they uniquely identify the sensor and allow:</p>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80 ml-2">
          <li>The master to apply the correct IODD (byte layout specification for PDin/PDout decode)</li>
          <li>The master to restore the right parameters automatically after a swap — SP1, RP1, output logic and more</li>
          <li>The maintenance team to order the exact spare part without a catalogue</li>
        </ul>
        <p class="text-sm text-base-content/80">In this kit: <strong>Vendor 310 + Device 733 = IFM TV7105</strong>. <strong>Vendor 1586 + Device 1052673 = RS Pro capacitive M18</strong> — internally a Carlo Gavazzi OEM sold under multiple brand names with the same Device ID. Vendor 896 is an alternate RS Pro identifier that resolves to the same hardware.</p>
      </div>

      <!-- Q3 -->
      <p class="mt-4 font-medium text-base-content"><strong>Q3.</strong> Port 1 also reports Device ID 131090, which the app resolves to <strong>E2E-X16MB1T12 Proximity</strong>. Why does knowing the Device ID matter when ordering a spare?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q3" value="a" class="radio radio-sm radio-secondary"> The master uses it to set the sensor's IP address on the IO-Link network</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q3" value="b" class="radio radio-sm radio-secondary"> It shows the sensor's remaining service life in hours</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q3" value="c" class="radio radio-sm radio-secondary"> It uniquely identifies the exact model, so you order the right part first time and the master can restore parameters automatically after swap</label>
      </div>

      <!-- Concept card: OMRON E2E byte order trap -->
      <div class="rounded-xl border border-info/30 bg-info/5 p-4 mt-4 space-y-3">
        <p class="text-xs font-semibold text-info/80 uppercase tracking-wide">OMRON E2E PDin — the byte order trap</p>
        <p class="text-sm text-base-content/80">The OMRON E2E PDin is 2 bytes (16-bit). The IODD defines <code class="font-mono text-xs bg-base-200 px-1 rounded">bitOffset</code> counted from the <strong>LSB of the 16-bit record</strong>, transmitted big-endian with byte 0 first. This creates a common mistake: developers assume byte 0 is the status byte because it arrives first. It is not.</p>
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 space-y-2 text-sm">
          <p class="font-semibold text-base-content">In free air, a typical PDin is <code class="font-mono bg-base-100 px-1 rounded">5100</code>:</p>
          <ul class="list-none space-y-1 ml-2">
            <li><code class="font-mono text-xs bg-base-100 px-1 rounded">0x51</code> = byte 0 — <strong>oscillation amplitude ≈ 81</strong> (NOT a flag byte)</li>
            <li><code class="font-mono text-xs bg-base-100 px-1 rounded">0x00</code> = byte 1 — all output flags clear (normal)</li>
          </ul>
          <p class="text-base-content/70 text-xs">Do not be misled by the <code class="font-mono">0x5x</code> value in byte 0 — the amplitude LSB fluctuates between <code class="font-mono">0x50</code> and <code class="font-mono">0x51</code> in free air. Early decoder versions read byte 0 as flags, causing permanent false instability alarms.</p>
        </div>
        <div class="overflow-x-auto">
          <table class="table table-zebra table-sm text-xs">
            <thead><tr><th>Byte</th><th>Bits</th><th>Meaning</th></tr></thead>
            <tbody>
              <tr><td class="font-mono">Byte 0</td><td>[7:0]</td><td>Oscillation monitor output (uint8, ~80 in free air)</td></tr>
              <tr><td class="font-mono">Byte 1 bit 0</td><td>b0</td><td>OUT1 — object detected (1 = detected)</td></tr>
              <tr><td class="font-mono">Byte 1 bit 4</td><td>b4</td><td>Instability Detection Alarm — target at sensing range boundary</td></tr>
              <tr><td class="font-mono">Byte 1 bit 5</td><td>b5</td><td>Over-Approach Alarm — target too close to sensor face</td></tr>
              <tr><td class="font-mono">Byte 1 bit 6</td><td>b6</td><td>Warning flag</td></tr>
              <tr><td class="font-mono">Byte 1 bit 7</td><td>b7</td><td>Error flag</td></tr>
            </tbody>
          </table>
        </div>
        <p class="text-sm text-base-content/80">When byte 1 bit 4 is set (PDin byte 1 = <code class="font-mono text-xs bg-base-200 px-1 rounded">0x10</code> or higher with that bit), the instability alarm is active — the target is at the edge of the sensing range. Adjust sensor alignment before signing off.</p>
      </div>

      <!-- Q4 -->
      <p class="mt-4 font-medium text-base-content"><strong>Q4.</strong> Port 1 currently shows PDin hex <code class="font-mono bg-base-200 px-1 rounded text-sm">5000</code>. The first byte is <code class="font-mono bg-base-200 px-1 rounded text-sm">50</code> (binary 0101 0000). Bit 4 being set indicates the instability alarm is active. What is the correct maintenance response?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q4" value="a" class="radio radio-sm radio-secondary"> Check sensor alignment — the target is likely at the edge of the sensing range</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q4" value="b" class="radio radio-sm radio-secondary"> No action — an instability alarm means the sensor passed its self-test</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q4" value="c" class="radio radio-sm radio-secondary"> Replace the sensor immediately — bit 4 means a permanent hardware fault</label>
      </div>

      <!-- Q5 -->
      <p class="mt-4 font-medium text-base-content"><strong>Q5.</strong> A sensor with a worn label is found on Port 2. The app shows Vendor ID 1586 and Device ID 1052673. Which spare should you order?</p>
      <div class="space-y-2 mt-1">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q5" value="a" class="radio radio-sm radio-secondary"> IFM TV7105 temperature sensor</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q5" value="b" class="radio radio-sm radio-secondary"> OMRON E2E-X16MB1T12 proximity sensor</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q5" value="c" class="radio radio-sm radio-secondary"> RS Pro M18 capacitive sensor (Carlo Gavazzi OEM, product code 2377240)</label>
      </div>

      <!-- PDin reference table -->
      <div class="rounded-xl border-2 border-secondary/30 bg-secondary/5 p-4 mt-4 space-y-2">
        <p class="font-bold text-base-content text-sm">📋 PDin quick reference — sensors in this kit</p>
        <div class="overflow-x-auto">
          <table class="table table-zebra table-sm text-xs">
            <thead><tr><th>Port</th><th>Sensor</th><th>PDin example</th><th>Key bytes</th></tr></thead>
            <tbody>
              <tr><td>1</td><td>OMRON Proximity</td><td class="font-mono">5000</td><td>Byte 0 bit 0 = output; bit 4 = instability alarm; bit 5 = over-approach alarm</td></tr>
              <tr><td>2</td><td>RS Pro Capacitive</td><td class="font-mono">000A0002</td><td>Bytes 0–1 = 16-bit analogue dielectric value; byte 3 bit 1 = SO2 output</td></tr>
              <tr><td>3</td><td>IFM TV7105 Temp</td><td class="font-mono">00FEFF00</td><td>Bytes 0–1 = int16 raw temperature ÷ 10 = °C; bytes 2–3 = SP1/SP2 flags</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Verification section -->
      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-base">🎯 Verification — positively identify all connected sensors</p>
        <p class="text-sm text-base-content/80">Use the live panels below to verify device identity data is being read from the AL1350, then tick each item when confirmed.</p>

        <!-- Connection Diagnostics embedded panel -->
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Connection Diagnostics</p>
            <span id="cp2-diag-badge" class="badge badge-xs badge-ghost font-mono">—</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">Circuit Breaker</div>
              <div id="cp2-diag-circuit" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">Success Rate</div>
              <div id="cp2-diag-success" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">MQTT</div>
              <div id="cp2-diag-mqtt" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
          </div>
          <div class="h-28"><canvas id="cp2-diag-latency-chart"></canvas></div>
          <p class="text-xs text-base-content/40">RTT p95: <span id="cp2-diag-p95">—</span> ms &nbsp;·&nbsp; poll latency to AL1350 over HTTP</p>
        </div>

        <!-- Edge Device embedded panel -->
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 space-y-2">
          <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Edge Device — Services</p>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">Backend API</div>
              <div id="cp2-edge-backend" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">CPU</div>
              <div id="cp2-edge-cpu" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">CPU Temp</div>
              <div id="cp2-edge-cputemp" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
          </div>
        </div>

        <div class="space-y-2 text-sm">
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">On the IO-Link Master page, note the <strong>Vendor ID and resolved company name</strong> for Port 1 (should be 612 → OMRON Corporation)</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Note the <strong>Device ID</strong> for Port 1 — confirm it resolves to E2E-X16MB1T12 Proximity</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Read the live <strong>PDin hex</strong> for Port 3 (temperature sensor) from the IO-Link Master page and decode bytes 0–1 as int16 ÷ 10 = °C</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Check Port 1's live PDin <strong>byte 1</strong> — if bit 4 is set (value 0x10 or higher), investigate sensor alignment before signing off</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Backend API shows <strong>Online</strong> above — device identity data is being read from the AL1350 HTTP API</span>
          </label>
        </div>
      </div>

      <div id="cp2-ws7-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: a — Vendor ID 612 is shown on the Port 1 card on the IO-Link Master page. Q2: b — 612 is registered to OMRON Corporation in the IO-Link Community vendor table. Q3: c — the Device ID uniquely identifies the model; the master can use it to restore IODD parameters automatically after a swap. Q4: a — instability alarm means the target is at the sensing range boundary; adjust alignment before considering replacement. Q5: c — Vendor 1586 (RS Pro) Device 1052673 = the M18 capacitive sensor (Carlo Gavazzi OEM, RS Pro part 2377240).</div>
    `
  },
  {
    id: 10,
    title: 'PT100 Temperature Sensors — From Resistance to Process Data',
    shortDesc: 'Physics, PDin encoding, hex decode calculations, and calibration offset engineering.',
    estimatedTime: 'About 25 min',
    whyItMatters: 'Understanding how the PT100 element works — and how the sensor encodes its reading into IO-Link PDin — lets you decode raw data without a datasheet, calculate expected resistance values to fault-find wiring, and properly engineer calibration offset corrections rather than guessing.',
    relatedDashboard: 'CP3723 Worksheet 5 — Temperature Sensor',
    prerequisites: 'CP3723 Worksheet 5 recommended',
    contentHtml: `
<div class="rounded-xl border-2 border-secondary/30 bg-secondary/5 p-4 mb-4 space-y-3">
        <p class="font-bold text-base-content">🔍 PT100 concepts — tick when you understand each:</p>
        <div class="space-y-2 text-sm">
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>PT100 resistance curve:</strong> resistance = 100 × (1 + 0.00385 × T). At 0 °C = 100 Î©. Every 1 °C increase adds ~0.385 Î©. At 25 °C ≈ 109.6 Î©. Used for fault-finding: open-circuit element reads −40 °C on the IO-Link dashboard (raw PDin bytes 0–1 = <code class="font-mono bg-base-300 px-1 rounded text-xs">FE70</code>), short-circuit reads implausibly high.</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>PDin encoding:</strong> temperature is stored as int16 (signed 16-bit integer), scale ×0.1. Multiply °C by 10 to get the raw integer. Example: 25.4 °C → 254 → <code class="font-mono bg-base-300 px-1 rounded text-xs">0x00FE</code>. These two bytes appear as bytes 0–1 of the 4-byte PDin payload — MSB first (big-endian).</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>Two's complement for negative temperatures:</strong> values below 0 °C use two's complement encoding — the raw int16 is negative. <code class="font-mono bg-base-300 px-1 rounded text-xs">0xFF9C</code> = 65436 unsigned; 65436 − 65536 = −100 raw → ÷10 = −10.0 °C. Any bytes 0–1 starting with <code class="font-mono bg-base-300 px-1 rounded text-xs">0xFF…</code> or high-nibble ≥ 8 indicates a sub-zero reading.</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>Calibration offset (Index 681, Sub 0, int16, ×0.1, range ±10 °C):</strong> applied after the PT100 measurement. Used to compensate for installation self-heating, element tolerance drift, or reference comparison offset. Write <code class="font-mono bg-base-300 px-1 rounded text-xs">0x0000</code> to clear (factory default). Write a negative value to correct a sensor that reads consistently high.</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-md checkbox-secondary flex-shrink-0">
            <span class="cp2-kit-text"><strong>SP1/SP2 switching outputs — stored in sensor EEPROM</strong> (survive power-off and master replacement). SP1 (Index 583) = OUT1 alarm threshold; RP1 (Index 584) = OUT1 reset point (hysteresis). SP must always be above its own RP — the sensor silently rejects any ISDU write that violates SP &gt; RP.</span>
          </label>
        </div>
      </div>
      <p class="text-base-content/90 leading-relaxed text-base">The IFM TV7105 on Port 3 is built around a PT100 resistance temperature detector. The "PT" means platinum, the "100" means its resistance is exactly 100 Ω at 0 °C. Everything the sensor transmits via IO-Link traces back to how that resistance changes with temperature — and how the sensor encodes that number into a compact binary PDin payload.</p>

      <!-- Resistance curve section -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-4 mt-4 space-y-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">The PT100 Resistance Curve</p>
        <p class="text-sm text-base-content/80">Platinum has a very stable and predictable relationship between resistance and temperature, described by the <strong>Callendar–Van Dusen equation</strong>. For the working temperature range of industrial sensors, a simplified linear approximation is accurate enough:</p>
        <div class="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
          <p class="font-mono text-base font-bold text-base-content">R(T) = 100 × (1 + α × T)</p>
          <p class="text-xs text-base-content/60 mt-1">where α = 0.00385 °C⁻¹ &nbsp;(IEC 60751 standard coefficient)</p>
        </div>
        <p class="text-sm text-base-content/80">This means for every 1 °C rise, resistance increases by approximately <strong>0.385 Ω</strong>.</p>
        <div class="overflow-x-auto mt-2">
          <table class="table table-zebra table-sm text-sm w-full">
            <thead><tr><th>Temperature (°C)</th><th>Calculation</th><th>Resistance (Ω)</th></tr></thead>
            <tbody>
              <tr><td>−40 °C</td><td>100 × (1 + 0.00385 × −40)</td><td class="font-mono font-semibold">84.6 Ω</td></tr>
              <tr><td>0 °C</td><td>100 × (1 + 0.00385 × 0)</td><td class="font-mono font-semibold">100.0 Ω</td></tr>
              <tr><td>25 °C</td><td>100 × (1 + 0.00385 × 25)</td><td class="font-mono font-semibold">109.6 Ω</td></tr>
              <tr><td>60 °C</td><td>100 × (1 + 0.00385 × 60)</td><td class="font-mono font-semibold">123.1 Ω</td></tr>
              <tr><td>100 °C</td><td>100 × (1 + 0.00385 × 100)</td><td class="font-mono font-semibold">138.5 Ω</td></tr>
              <tr><td>150 °C</td><td>100 × (1 + 0.00385 × 150)</td><td class="font-mono font-semibold">157.8 Ω</td></tr>
            </tbody>
          </table>
        </div>
        <p class="text-sm text-base-content/80"><strong>Why this matters for fault-finding:</strong> If you suspect a wiring fault rather than a sensor fault, measure the element resistance with a multimeter and use the formula to verify it matches the expected temperature. A reading of 0 Ω is a short; ∞ Ω (open circuit) decodes to −40 °C on the IO-Link dashboard — the classic broken-element diagnostic.</p>
      </div>

      <!-- IEC 60751 accuracy -->
      <div class="rounded-lg border border-secondary/30 bg-secondary/5 p-3 mt-3 text-sm space-y-2">
        <p class="font-bold text-base-content">IEC 60751 Accuracy Classes</p>
        <p class="text-base-content/80">The standard defines tolerance classes for PT100 elements. The TV7105 achieves <strong>Class B</strong> (the most common industrial grade):</p>
        <div class="overflow-x-auto">
          <table class="table table-sm text-xs w-full">
            <thead><tr><th>Class</th><th>Tolerance formula</th><th>At 0 °C</th><th>At 25 °C</th><th>At 100 °C</th></tr></thead>
            <tbody>
              <tr class="text-base-content/50"><td>AA</td><td>±(0.10 + 0.0017·|T|)</td><td>±0.10 °C</td><td>±0.14 °C</td><td>±0.27 °C</td></tr>
              <tr class="text-base-content/50"><td>A</td><td>±(0.15 + 0.0020·|T|)</td><td>±0.15 °C</td><td>±0.20 °C</td><td>±0.35 °C</td></tr>
              <tr class="font-semibold"><td>B ✓</td><td>±(0.30 + 0.0050·|T|)</td><td>±0.30 °C</td><td>±0.43 °C</td><td>±0.80 °C</td></tr>
            </tbody>
          </table>
        </div>
        <p class="text-base-content/70 text-xs">This is the <em>element</em> tolerance — the sensing platinum film. The complete instrument (sensor + electronics) may add further error. A calibration offset (Index 681) can compensate for both element tolerance and installation-induced error.</p>
      </div>

      <!-- PDin encoding section -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-4 mt-4 space-y-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">PDin Encoding — How °C becomes bytes</p>
        <p class="text-sm text-base-content/80">The TV7105 PDin is 4 bytes. The temperature is carried in bytes 0–1 as a <strong>signed 16-bit integer (int16)</strong> with a scale factor of <strong>×0.1</strong>. Bytes 2–3 carry SP1/SP2 switching outputs and error flags.</p>

        <!-- Byte layout visual -->
        <div class="rounded-lg bg-base-300/50 p-3 font-mono text-xs overflow-x-auto">
          <div class="flex gap-1 min-w-max">
            <div class="flex flex-col items-center gap-1">
              <div class="w-20 h-9 rounded flex items-center justify-center bg-primary/20 border border-primary/40 font-bold text-primary text-sm">Byte 0</div>
              <span class="text-base-content/50 text-center leading-tight">temp<br>MSB</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div class="w-20 h-9 rounded flex items-center justify-center bg-primary/20 border border-primary/40 font-bold text-primary text-sm">Byte 1</div>
              <span class="text-base-content/50 text-center leading-tight">temp<br>LSB</span>
            </div>
            <div class="flex flex-col items-center gap-1 ml-2">
              <div class="w-20 h-9 rounded flex items-center justify-center bg-base-300 border border-base-content/20 text-sm">Byte 2</div>
              <span class="text-base-content/40 text-center leading-tight">SP1<br>flags</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div class="w-20 h-9 rounded flex items-center justify-center bg-base-300 border border-base-content/20 text-sm">Byte 3</div>
              <span class="text-base-content/40 text-center leading-tight">SP2<br>flags</span>
            </div>
          </div>
        </div>

        <p class="text-sm text-base-content/80"><strong>Encoding steps:</strong></p>
        <ol class="list-decimal list-inside text-sm text-base-content/80 space-y-1 ml-2">
          <li>Take the temperature in °C, multiply by 10 (to remove the decimal): 25.4 °C → <strong>254</strong></li>
          <li>Store as a 16-bit signed integer (big-endian, MSB first): 254 decimal = <strong>0x00FE</strong></li>
          <li>Bytes 0–1 of PDin = <strong>00 FE</strong></li>
        </ol>
        <p class="text-sm text-base-content/80">For negative temperatures, the int16 wraps into two's complement: −10.0 °C → −100 decimal → <strong>0xFF9C</strong> (since 65536 − 100 = 65436 = 0xFF9C).</p>
      </div>

      <!-- Hex decode exercises -->
<!-- Two's complement concept card -->
      <div class="rounded-xl border border-info/30 bg-info/5 p-4 mt-4 space-y-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Two's complement — decoding negative temperatures</p>
        <p class="text-sm text-base-content/80">Positive temperatures are straightforward: the int16 value is simply the unsigned integer. The range 0x0000 (0) through 0x7FFF (32767) maps directly — 0x7FFF would be 3276.7 °C, well above any industrial sensor range. Once the raw unsigned value reaches 0x8000 (32768), the signed interpretation flips to the most negative value. <strong>Quick rule: if the high nibble of byte 0 is 8 through F, the temperature is below 0 °C.</strong></p>
        <p class="text-sm text-base-content/80"><strong>Decode formula for negative values:</strong> signed_value = unsigned_value − 65536. Then divide by 10 for °C.</p>
        <div class="overflow-x-auto">
          <table class="table table-sm text-sm w-full">
            <thead>
              <tr>
                <th>Bytes 0–1 (hex)</th>
                <th>Unsigned decimal</th>
                <th>Signed int16</th>
                <th>÷ 10 = °C</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-mono">00 F5</td>
                <td class="font-mono">245</td>
                <td class="font-mono text-success">+245</td>
                <td class="font-bold text-success">24.5 °C</td>
                <td class="text-base-content/60 text-xs">Positive — straightforward</td>
              </tr>
              <tr>
                <td class="font-mono">FF 9C</td>
                <td class="font-mono">65436</td>
                <td class="font-mono text-warning">65436 − 65536 = −100</td>
                <td class="font-bold text-warning">−10.0 °C</td>
                <td class="text-base-content/60 text-xs">High nibble = F → sub-zero</td>
              </tr>
              <tr>
                <td class="font-mono">FE 70</td>
                <td class="font-mono">65136</td>
                <td class="font-mono text-error">65136 − 65536 = −400</td>
                <td class="font-bold text-error">−40.0 °C</td>
                <td class="text-base-content/60 text-xs">Open-circuit default — broken element</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="rounded-lg border border-info/20 bg-base-100 p-3 text-xs text-base-content/70 space-y-1">
          <p><strong>Why 65536?</strong> A 16-bit value has 2Â¹â¶ = 65536 possible states. Two's complement wraps the negative range by subtracting 65536 from any unsigned value above 32767 (0x7FFF). The sensor firmware uses the same convention — the value you read via ISDU and the value encoded in PDin are both two's complement int16.</p>
          <p><strong>Shortcut check:</strong> convert byte 0 to decimal. If it is ≥ 128 (0x80), the temperature is negative. No need to look at byte 1 first.</p>
        </div>
      </div>
      <div class="rounded-xl border-2 border-secondary/30 bg-secondary/5 p-4 mt-4 space-y-4">
        <p class="font-bold text-base-content text-base">Hex Decode Exercises — calculate the temperature</p>
        <p class="text-sm text-base-content/80">For each PDin hex value below: extract bytes 0–1, interpret as a signed int16, then divide by 10 to get °C. Use the two's complement rule for values above 0x7FFF.</p>

        <div class="space-y-3">
          <div class="rounded-lg border border-base-300 bg-base-200 p-3 text-sm space-y-2">
            <p><strong>Exercise 1:</strong> PDin = <code class="font-mono bg-base-300 px-1 rounded">01 2C FF 00</code></p>
            <p class="text-base-content/70">Bytes 0–1 = <code class="font-mono">01 2C</code> → 0x012C in decimal = <span class="blur-sm hover:blur-none transition-all cursor-pointer select-none text-success font-mono">300</span> → ÷10 = <span class="blur-sm hover:blur-none transition-all cursor-pointer select-none text-success font-bold">30.0 °C</span> <em class="text-base-content/40">(hover to reveal)</em></p>
          </div>
          <div class="rounded-lg border border-base-300 bg-base-200 p-3 text-sm space-y-2">
            <p><strong>Exercise 2:</strong> PDin = <code class="font-mono bg-base-300 px-1 rounded">01 96 FF 00</code></p>
            <p class="text-base-content/70">Bytes 0–1 = <code class="font-mono">01 96</code> → 0x0196 = <span class="blur-sm hover:blur-none transition-all cursor-pointer select-none text-success font-mono">406</span> → ÷10 = <span class="blur-sm hover:blur-none transition-all cursor-pointer select-none text-success font-bold">40.6 °C</span> <em class="text-base-content/40">(hover to reveal)</em></p>
          </div>
          <div class="rounded-lg border border-base-300 bg-base-200 p-3 text-sm space-y-2">
            <p><strong>Exercise 3:</strong> PDin = <code class="font-mono bg-base-300 px-1 rounded">FF 9C FF 00</code></p>
            <p class="text-base-content/70">Bytes 0–1 = <code class="font-mono">FF 9C</code> → 0xFF9C as signed int16: <span class="blur-sm hover:blur-none transition-all cursor-pointer select-none text-success font-mono">0xFF9C = 65436 unsigned; 65436 − 65536 = −100</span> → ÷10 = <span class="blur-sm hover:blur-none transition-all cursor-pointer select-none text-success font-bold">−10.0 °C</span> <em class="text-base-content/40">(hover to reveal)</em></p>
          </div>
          <div class="rounded-lg border border-base-300 bg-base-200 p-3 text-sm space-y-2">
            <p><strong>Exercise 4:</strong> PDin = <code class="font-mono bg-base-300 px-1 rounded">FE 70 00 00</code> &nbsp;<em class="text-base-content/50 text-xs">(this is the −40 °C disconnection default)</em></p>
            <p class="text-base-content/70">Bytes 0–1 = <code class="font-mono">FE 70</code> → 0xFE70 as signed int16: <span class="blur-sm hover:blur-none transition-all cursor-pointer select-none text-success font-mono">0xFE70 = 65136 unsigned; 65136 − 65536 = −400</span> → ÷10 = <span class="blur-sm hover:blur-none transition-all cursor-pointer select-none text-success font-bold">−40.0 °C — open-circuit default</span> <em class="text-base-content/40">(hover to reveal)</em></p>
          </div>
        </div>
      </div>

      <!-- Live raw PDin panel -->
      <div class="rounded-xl border-2 border-warning/40 bg-warning/5 p-4 mt-4 space-y-3" id="cp2-ws9-live-panel">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="font-semibold text-base-content text-sm">Port 3 — Live PDin Decode</span>
          <span id="cp2-ws9-badge" class="badge badge-xs badge-ghost font-mono">OFFLINE</span>
        </div>
        <p class="text-xs text-base-content/60">The raw PDin hex updates live from the sensor. Watch how the int16 value tracks the temperature.</p>
        <div class="overflow-x-auto">
          <table class="table table-sm text-sm w-full font-mono">
            <tbody>
              <tr>
                <td class="text-base-content/50 w-40">PDin raw (hex)</td>
                <td id="cp2-ws9-pdin-hex" class="font-bold text-base-content">—</td>
              </tr>
              <tr>
                <td class="text-base-content/50">Bytes 0–1</td>
                <td id="cp2-ws9-bytes01" class="font-bold text-primary">—</td>
              </tr>
              <tr>
                <td class="text-base-content/50">int16 value</td>
                <td id="cp2-ws9-int16" class="font-bold text-base-content">—</td>
              </tr>
              <tr>
                <td class="text-base-content/50">÷ 10</td>
                <td id="cp2-ws9-temp-calc" class="font-bold text-warning text-base">—</td>
              </tr>
              <tr>
                <td class="text-base-content/50">Equivalent resistance</td>
                <td id="cp2-ws9-resistance" class="font-bold text-base-content/70">—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs text-base-content/50">Resistance = 100 × (1 + 0.00385 × T) — calculated from live temperature</p>
      </div>

      <!-- Calibration offset engineering -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-4 mt-4 space-y-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Calibration Offset Engineering (Index 681)</p>
        <p class="text-sm text-base-content/80">The calibration offset (ISDU Index 681, Sub 0, int16, ×0.1) is a signed trim value added to the sensor's decoded temperature before it is reported in PDin. Range: −10.0 °C to +10.0 °C. Default: 0.0 °C.</p>
        <p class="text-sm text-base-content/80"><strong>When you need it:</strong></p>
        <ul class="list-disc list-inside text-sm text-base-content/80 space-y-1 ml-2">
          <li><strong>Installation offset:</strong> The sensor is installed in a hot enclosure that causes a +2 °C offset from self-heating. Write −2.0 °C to Index 681 to compensate.</li>
          <li><strong>Comparison against a reference:</strong> Your calibrated Fluke thermometer reads 24.1 °C; the TV7105 reads 24.7 °C. Drift = +0.6 °C. Write −0.6 °C to correct.</li>
          <li><strong>Element tolerance:</strong> A Class B element at 100 °C can be up to ±0.80 °C out. If a reference calibration shows consistent positive error, trim it out at installation.</li>
        </ul>
        <div class="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm space-y-1">
          <p class="font-semibold text-base-content">Worked example — engineering the correction</p>
          <p class="text-base-content/80">Reference reads 50.0 °C. Sensor reads 53.0 °C. Error = +3.0 °C.</p>
          <p class="text-base-content/80">Required offset = <strong>−3.0 °C</strong>. But writing −3.0 °C (factory default 0.0 °C) resets the offset entirely to the correct value.</p>
          <p class="text-base-content/80">ISDU write: Index 681, Sub 0, int16 value = −30 (raw = −3.0 × 10), transmitted as two's complement <code class="font-mono bg-base-100 px-1 rounded text-xs">FFE2</code>.</p>
        </div>
      </div>

      <!-- SP1/SP2 engineering notes -->
      <div class="rounded-lg border border-base-300 bg-base-200 p-3 mt-3 text-sm space-y-2">
        <p class="font-bold text-base-content">SP1 &amp; SP2 — Engineering Notes</p>
        <ul class="list-disc list-inside space-y-1 text-base-content/80 ml-2">
          <li><strong>Stored in sensor EEPROM</strong> (not in the master). Survive power-off, master replacement, and firmware updates. A direct consequence of IO-Link's device-centric architecture.</li>
          <li><strong>SP1 (Index 583) and SP2 (Index 593)</strong> are signed int16, ×0.1. Range −49.8 to 150.0 °C. SP1 is typically the warning threshold; SP2 is the critical/shutdown threshold.</li>
          <li><strong>Hysteresis</strong> (RP1/RP2, Index 584/594) sets the return-to-normal point. Without hysteresis, output would chatter at the setpoint. Rule of thumb: set RP at least 2–3 °C below SP.</li>
          <li><strong>Parameter restore on sensor swap:</strong> The IO-Link master can automatically write SP1, SP2, and calibration offset back to a replacement sensor if the Device ID matches — no manual re-configuration needed.</li>
        </ul>
      </div>

      <div id="cp2-ws9-answers" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">
        <p><strong>Resistance at 25 °C:</strong> 100 × (1 + 0.00385 × 25) = 100 × 1.09625 = 109.625 Ω ≈ 109.6 Ω</p>
        <p class="mt-1"><strong>Exercise 1 (0x012C):</strong> 0x01 = 1, 0x2C = 44 → (1×256)+44 = 300 → 300÷10 = 30.0 °C</p>
        <p class="mt-1"><strong>Exercise 2 (0x0196):</strong> 0x01 = 1, 0x96 = 150 → (1×256)+150 = 406 → 406÷10 = 40.6 °C</p>
        <p class="mt-1"><strong>Exercise 3 (0xFF9C):</strong> 0xFF9C = 65436 unsigned. Since &gt;32767, subtract 65536: 65436−65536 = −100 → −100÷10 = −10.0 °C</p>
        <p class="mt-1"><strong>Exercise 4 (0xFE70):</strong> 0xFE70 = 65136 unsigned → 65136−65536 = −400 → −400÷10 = −40.0 °C — the open-circuit default.</p>
        <p class="mt-1"><strong>Calibration offset raw encode:</strong> −3.0 °C → −3.0×10 = −30 → two's complement 16-bit: 65536−30 = 65506 = 0xFFE2</p>
      </div>
      <!-- Verification section -->
      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-base">🎯 Verification — decode live PT100 data from Port 3</p>
        <p class="text-sm text-base-content/80">The live panel above already shows the decoded temperature. Now verify the decode yourself using the exercises above — calculate the expected hex from the live reading and confirm it matches the raw bytes shown.</p>

        <!-- Connection Diagnostics embedded panel -->
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Connection Diagnostics</p>
            <span id="cp2-diag-badge" class="badge badge-xs badge-ghost font-mono">—</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">Circuit Breaker</div>
              <div id="cp2-diag-circuit" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">Success Rate</div>
              <div id="cp2-diag-success" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">MQTT</div>
              <div id="cp2-diag-mqtt" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
          </div>
          <div class="h-28"><canvas id="cp2-diag-latency-chart"></canvas></div>
          <p class="text-xs text-base-content/40">RTT p95: <span id="cp2-diag-p95">—</span> ms &nbsp;·&nbsp; poll latency to AL1350 over HTTP</p>
        </div>

        <!-- Edge Device embedded panel -->
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 space-y-2">
          <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Edge Device — Services</p>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">Backend API</div>
              <div id="cp2-edge-backend" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">CPU</div>
              <div id="cp2-edge-cpu" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
            <div class="rounded bg-base-100 border border-base-300 p-2">
              <div class="text-xs text-base-content/50 mb-1">CPU Temp</div>
              <div id="cp2-edge-cputemp" class="font-bold font-mono text-sm text-base-content">—</div>
            </div>
          </div>
        </div>

        <div class="space-y-2 text-sm">
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Read the current temperature from the live panel above. Multiply by 10, convert to hex. Verify it matches the raw PDin bytes 0–1 shown in the live panel.</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Calculate the expected PT100 resistance at the current temperature using R = 100 × (1 + 0.00385 × T). Note this value — it is your fault-finding reference for wiring checks on this installation.</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Read the calibration offset (Index 681, Sub 0) from the Dashboard parameter panel for Port 3 — confirm it reads <code class="font-mono bg-base-100 px-1 rounded text-xs">0x0000</code> (0.0 °C) when no calibration has been applied.</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Backend API shows <strong>Online</strong> above and circuit breaker shows <strong>CLOSED</strong> — the live panel data and ISDU reads are working through the full stack.</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">SP1 shown on the Dashboard parameter panel for Port 3 is a value above the current temperature — confirm OUT1 is not currently tripped (this is expected at normal room temperature).</span>
          </label>
        </div>
      </div>
    `
  },
  {
    id: 11,
    title: 'CL50 Pro — PDout Encoding Deep-Dive',
    shortDesc: 'How the 3-byte PDout hex is structured, what every bit field means, and how to decode or build any CL50 command by hand.',
    estimatedTime: 'About 20 min',
    whyItMatters: 'The CL50 exposes all its state in 24 bits. Once you can read and write those bits directly you can control any IO-Link output device — the encoding pattern repeats across all PDout-capable devices. It also prepares you for PLC integration, where you write these values in ladder logic or structured text rather than through a UI.',
    relatedDashboard: 'CP3723 Worksheet 6 — CL50 Light Stack',
    prerequisites: 'CP3723 Worksheet 6 required',
    contentHtml: `
<p class="text-base-content/90 leading-relaxed text-base">The CL50 Pro is unique in this kit — it is a PDout-only device. Unlike the temperature, proximity, and capacitive sensors that send measurement data to the master (PDin), the CL50 only receives commands. Write a hex string to Port 4 and the light changes immediately. Understanding its 24-bit encoding pattern prepares you for PLC integration, where you write these values in ladder logic or structured text rather than through a graphical interface. This worksheet tears that three-byte value apart so you can decode any CL50 state and calculate the correct command for any light configuration by hand.</p>

      <!-- Interactive checklist -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-4 mt-4 space-y-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">Key concepts — tick each when understood</p>
        <label class="cp2-kit-item flex items-start gap-3 cursor-pointer">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary mt-0.5 shrink-0" />
          <span class="text-sm text-base-content/85"><strong>PDout vs PDin direction:</strong> PDin = sensor sends data TO the master (process data input). PDout = master sends data TO the actuator (process data output). The CL50 is pure PDout — write a hex string to Port 4 and the light changes immediately. There is no sensor reading coming back.</span>
        </label>
        <label class="cp2-kit-item flex items-start gap-3 cursor-pointer">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary mt-0.5 shrink-0" />
          <span class="text-sm text-base-content/85"><strong>3-byte (24-bit) structure:</strong> All CL50 state is packed into exactly 3 bytes (6 hex characters). Octet 0 = audible alarm + colour intensities. Octet 1 = speed + pulse pattern + animation mode. Octet 2 = colour 2 index (bits 7–4) + colour 1 index (bits 3–0).</span>
        </label>
        <label class="cp2-kit-item flex items-start gap-3 cursor-pointer">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary mt-0.5 shrink-0" />
          <span class="text-sm text-base-content/85"><strong>Bit field extraction:</strong> Each field occupies specific bits within its octet. To extract a field: apply a bitmask (AND) then shift right. To build a value: shift left to the correct bit position then OR with the other fields in the same byte.</span>
        </label>
        <label class="cp2-kit-item flex items-start gap-3 cursor-pointer">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary mt-0.5 shrink-0" />
          <span class="text-sm text-base-content/85"><strong>Colour indices (4-bit, 0–15):</strong> 0=Green · 1=Red · 2=Orange · 3=Amber · 4=Yellow · 5=Lime · 6=Spring Green · 7=Cyan · 8=Sky Blue · 9=Blue · 10=Violet · 11=Magenta · 12=Rose · 13=White · 14=Custom1 · 15=Custom2.</span>
        </label>
        <label class="cp2-kit-item flex items-start gap-3 cursor-pointer">
          <input type="checkbox" class="checkbox checkbox-md checkbox-secondary mt-0.5 shrink-0" />
          <span class="text-sm text-base-content/85"><strong>Intensity and animation values:</strong> Intensity (3-bit): 0=High · 1=Low · 2=Medium · 3=Off · 4=Custom. Animation modes: 0=Off · 1=Steady · 2=Flash · 3=Two Colour Flash · 4=Intensity Sweep (firmware bug in v1.0.2 — does not execute from PDout; backend works around with a software breathing loop).</span>
        </label>
      </div>

      <!-- Concept card: PDout vs PDin -->
      <div class="rounded-xl border border-info/30 bg-info/5 p-4 mt-4 space-y-2">
        <p class="text-xs font-semibold text-info uppercase tracking-wide">PDout vs PDin — direction matters</p>
        <p class="text-sm text-base-content/85">In IO-Link, <strong>PDin</strong> means process data flowing IN to the master from a sensor — temperature readings, detection flags, signal amplitudes. <strong>PDout</strong> means process data flowing OUT from the master to an actuator — commands, setpoints, control words. Standard digital outputs on a relay module have trivial PDout (one bit: on or off). The CL50 uses 24 bits, making it one of the most complex PDout encodings in this kit. In a PLC, you would write this 3-byte value to the output image address mapped to Port 4. Every 500 ms the AL1350 pushes whatever is in that register to the CL50 over IO-Link. Understanding the bit layout means you can calculate the exact integer or hex value to write without relying on a configuration tool.</p>
      </div>

      <!-- What PDout is (existing content preserved) -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-4 mt-4 space-y-2">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">PDout — one value encodes everything</p>
        <p class="text-sm text-base-content/80">IO-Link process data flows in two directions. <strong>PDin</strong> is data the device sends to the master (sensor readings, status flags). <strong>PDout</strong> is data the master sends to the device (commands and setpoints). The CL50 has no PDin — it is PDout-only. Every 500 ms the AL1350 writes a 3-byte value to Port 4 and the CL50 executes it immediately.</p>
        <p class="text-sm text-base-content/80 mt-1">Those three bytes — 24 bits — carry eight separate fields that together define the complete state of the light: two colour slots, four animation parameters, an intensity control for each colour, and an audible alarm flag. The six-character hex string you see on the dashboard is always laid out as <code class="font-mono bg-base-300 px-1 rounded">Octet0 Octet1 Octet2</code> — the first two characters are Octet 0, the middle two are Octet 1, the last two are Octet 2.</p>
      </div>

      <!-- Full 24-bit field table -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-4 mt-4">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-3">The complete 24-bit PDout map</p>
        <div class="overflow-x-auto">
          <table class="table table-zebra table-sm text-sm w-full">
            <thead><tr><th>Octet</th><th>Bits</th><th>Field</th><th>Values</th></tr></thead>
            <tbody>
              <tr>
                <td class="font-bold text-primary" rowspan="3">0</td>
                <td class="font-mono text-xs">[7:6]</td><td>Audible alarm</td><td class="text-xs">0=Off · 1=On · 2=Pulsed · 3=SOS</td>
              </tr>
              <tr>
                <td class="font-mono text-xs">[5:3]</td><td>Colour 2 intensity (C2I)</td><td class="text-xs">0=High · 1=Low · 2=Med · 3=Off · 4=Custom</td>
              </tr>
              <tr>
                <td class="font-mono text-xs">[2:0]</td><td>Colour 1 intensity (C1I)</td><td class="text-xs">0=High · 1=Low · 2=Med · 3=Off · 4=Custom</td>
              </tr>
              <tr>
                <td class="font-bold text-secondary" rowspan="3">1</td>
                <td class="font-mono text-xs">[7:6]</td><td>Speed</td><td class="text-xs">0=Medium · 1=Fast · 2=Slow</td>
              </tr>
              <tr>
                <td class="font-mono text-xs">[5:3]</td><td>Pulse pattern</td><td class="text-xs">0=Normal · 1=Strobe · 2=Three Pulse · 3=SOS · 4=Random</td>
              </tr>
              <tr>
                <td class="font-mono text-xs">[2:0]</td><td>Animation mode</td><td class="text-xs">0=Off · 1=Steady · 2=Flash · 3=Two Colour · 4=Intensity Sweep</td>
              </tr>
              <tr>
                <td class="font-bold text-accent" rowspan="2">2</td>
                <td class="font-mono text-xs">[7:4]</td><td>Colour 2 index</td><td class="text-xs">4-bit index 0–15 (see colour table)</td>
              </tr>
              <tr>
                <td class="font-mono text-xs">[3:0]</td><td>Colour 1 index</td><td class="text-xs">4-bit index 0–15 (see colour table)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Concept card: bit field extraction -->
      <div class="rounded-xl border border-info/30 bg-info/5 p-4 mt-4 space-y-2">
        <p class="text-xs font-semibold text-info uppercase tracking-wide">Bit field extraction — how to read and build PDout values</p>
        <p class="text-sm text-base-content/85">To <strong>extract</strong> a field, AND the byte with a mask that covers those bits, then shift right by the LSB position. For example, to extract Animation mode from Octet 1: <code class="font-mono bg-base-300 px-1 rounded">(byte1 &amp; 0x07)</code> — bits [2:0], no shift needed. To extract Speed: <code class="font-mono bg-base-300 px-1 rounded">(byte1 &gt;&gt; 6) &amp; 0x03</code>.</p>
        <p class="text-sm text-base-content/85 mt-1">To <strong>build</strong> an octet, shift each field value left to its bit position then OR all fields together. Example — Octet 1 for Speed=Fast(1), Pattern=Normal(0), Animation=Flash(2): <code class="font-mono bg-base-300 px-1 rounded">(1&lt;&lt;6) | (0&lt;&lt;3) | 2 = 64 | 0 | 2 = 66 = 0x42</code>.</p>
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 mt-2 text-xs font-mono space-y-1">
          <p class="text-base-content/60 font-sans text-xs font-semibold mb-1">Worked example: "Green Steady High" = <strong>000100</strong></p>
          <p>Octet 2 = C2=0(Green), C1=0(Green) → (0&lt;&lt;4)|0 = 0x00</p>
          <p>Octet 1 = Speed=0(Med), Pattern=0(Normal), Animation=1(Steady) → (0&lt;&lt;6)|(0&lt;&lt;3)|1 = 0x01</p>
          <p>Octet 0 = Audible=0(Off), C2I=0(High), C1I=0(High) → (0&lt;&lt;6)|(0&lt;&lt;3)|0 = 0x00</p>
          <p class="text-success font-bold mt-1">→ hex string: "00" + "01" + "00" = <strong>000100</strong></p>
        </div>
      </div>

      <!-- Octet-by-octet byte diagrams -->
      <div class="mt-4 space-y-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Octet-by-octet breakdown</p>

        <!-- Octet 0 -->
        <div class="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
          <p class="font-bold text-primary text-sm">Octet 0 — Intensity &amp; Audible</p>
          <div class="rounded bg-base-300/60 p-2 font-mono text-xs overflow-x-auto">
            <div class="flex min-w-max gap-px">
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-warning/30 border border-warning/50 rounded-sm text-warning font-bold">7</div><span class="text-base-content/40 text-center text-xs">aud</span></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-warning/30 border border-warning/50 rounded-sm text-warning font-bold">6</div><span class="text-base-content/40 text-center text-xs">aud</span></div>
              <div class="w-2"></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-secondary/30 border border-secondary/50 rounded-sm text-secondary font-bold">5</div><span class="text-base-content/40 text-center text-xs">C2I</span></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-secondary/30 border border-secondary/50 rounded-sm text-secondary font-bold">4</div><span class="text-base-content/40 text-center text-xs">C2I</span></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-secondary/30 border border-secondary/50 rounded-sm text-secondary font-bold">3</div><span class="text-base-content/40 text-center text-xs">C2I</span></div>
              <div class="w-2"></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-primary/30 border border-primary/50 rounded-sm text-primary font-bold">2</div><span class="text-base-content/40 text-center text-xs">C1I</span></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-primary/30 border border-primary/50 rounded-sm text-primary font-bold">1</div><span class="text-base-content/40 text-center text-xs">C1I</span></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-primary/30 border border-primary/50 rounded-sm text-primary font-bold">0</div><span class="text-base-content/40 text-center text-xs">C1I</span></div>
            </div>
          </div>
          <p class="text-xs text-base-content/70"><strong>Intensity values:</strong> 0 = High · 1 = Low · 2 = Medium · 3 = Off · 4 = Custom<br>
          <strong>Audible alarm:</strong> 0 = Off · 1 = On · 2 = Pulsed · 3 = SOS<br>
          <strong>Extract C1I:</strong> <code class="font-mono bg-base-300 px-1 rounded">Octet0 &amp; 0x07</code> &nbsp; <strong>Extract C2I:</strong> <code class="font-mono bg-base-300 px-1 rounded">(Octet0 &gt;&gt; 3) &amp; 0x07</code> &nbsp; <strong>Extract Audible:</strong> <code class="font-mono bg-base-300 px-1 rounded">(Octet0 &gt;&gt; 6) &amp; 0x03</code></p>
          <p class="text-xs text-base-content/60"><strong>Best practice:</strong> set C2I = 3 (Off) whenever you are not using Two Colour Flash — this prevents the C2 colour from showing if the animation mode changes unexpectedly.</p>
        </div>

        <!-- Octet 1 -->
        <div class="rounded-xl border border-secondary/30 bg-secondary/5 p-3 space-y-2">
          <p class="font-bold text-secondary text-sm">Octet 1 — Speed, Pattern &amp; Animation</p>
          <div class="rounded bg-base-300/60 p-2 font-mono text-xs overflow-x-auto">
            <div class="flex min-w-max gap-px">
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-warning/30 border border-warning/50 rounded-sm text-warning font-bold">7</div><span class="text-base-content/40 text-center text-xs">spd</span></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-warning/30 border border-warning/50 rounded-sm text-warning font-bold">6</div><span class="text-base-content/40 text-center text-xs">spd</span></div>
              <div class="w-2"></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-secondary/30 border border-secondary/50 rounded-sm text-secondary font-bold">5</div><span class="text-base-content/40 text-center text-xs">ptn</span></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-secondary/30 border border-secondary/50 rounded-sm text-secondary font-bold">4</div><span class="text-base-content/40 text-center text-xs">ptn</span></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-secondary/30 border border-secondary/50 rounded-sm text-secondary font-bold">3</div><span class="text-base-content/40 text-center text-xs">ptn</span></div>
              <div class="w-2"></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-primary/30 border border-primary/50 rounded-sm text-primary font-bold">2</div><span class="text-base-content/40 text-center text-xs">anim</span></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-primary/30 border border-primary/50 rounded-sm text-primary font-bold">1</div><span class="text-base-content/40 text-center text-xs">anim</span></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-primary/30 border border-primary/50 rounded-sm text-primary font-bold">0</div><span class="text-base-content/40 text-center text-xs">anim</span></div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2 text-xs text-base-content/70 mt-1">
            <div><strong>Speed [7:6]:</strong><br>0 = Medium<br>1 = Fast<br>2 = Slow</div>
            <div><strong>Pulse pattern [5:3]:</strong><br>0 = Normal<br>1 = Strobe<br>2 = Three Pulse<br>3 = SOS · 4 = Random</div>
            <div><strong>Animation [2:0]:</strong><br>0 = Off<br>1 = Steady<br>2 = Flash<br>3 = Two Colour<br>4 = Intensity Sweep ⚠</div>
          </div>
        </div>

        <!-- Octet 2 -->
        <div class="rounded-xl border border-accent/30 bg-accent/5 p-3 space-y-2">
          <p class="font-bold text-accent text-sm">Octet 2 — Colours</p>
          <div class="rounded bg-base-300/60 p-2 font-mono text-xs overflow-x-auto">
            <div class="flex min-w-max gap-px">
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-secondary/30 border border-secondary/50 rounded-sm text-secondary font-bold">7</div><span class="text-base-content/40 text-center text-xs">C2</span></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-secondary/30 border border-secondary/50 rounded-sm text-secondary font-bold">6</div><span class="text-base-content/40 text-center text-xs">C2</span></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-secondary/30 border border-secondary/50 rounded-sm text-secondary font-bold">5</div><span class="text-base-content/40 text-center text-xs">C2</span></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-secondary/30 border border-secondary/50 rounded-sm text-secondary font-bold">4</div><span class="text-base-content/40 text-center text-xs">C2</span></div>
              <div class="w-2"></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-primary/30 border border-primary/50 rounded-sm text-primary font-bold">3</div><span class="text-base-content/40 text-center text-xs">C1</span></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-primary/30 border border-primary/50 rounded-sm text-primary font-bold">2</div><span class="text-base-content/40 text-center text-xs">C1</span></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-primary/30 border border-primary/50 rounded-sm text-primary font-bold">1</div><span class="text-base-content/40 text-center text-xs">C1</span></div>
              <div class="flex flex-col items-center"><div class="w-8 h-7 flex items-center justify-center bg-primary/30 border border-primary/50 rounded-sm text-primary font-bold">0</div><span class="text-base-content/40 text-center text-xs">C1</span></div>
            </div>
          </div>
          <p class="text-xs text-base-content/70"><strong>Colour 1</strong> = lower nibble <code class="font-mono bg-base-300 px-1 rounded">Octet2 &amp; 0x0F</code> &nbsp;&nbsp; <strong>Colour 2</strong> = upper nibble <code class="font-mono bg-base-300 px-1 rounded">(Octet2 &gt;&gt; 4) &amp; 0x0F</code></p>
          <div class="overflow-x-auto mt-1">
            <table class="table table-sm text-xs w-full">
              <thead><tr><th>Index</th><th>Colour</th><th>Index</th><th>Colour</th><th>Index</th><th>Colour</th><th>Index</th><th>Colour</th></tr></thead>
              <tbody>
                <tr><td class="font-mono">0</td><td><span class="inline-block w-3 h-3 rounded-full bg-green-500 mr-1 align-middle"></span>Green</td><td class="font-mono">4</td><td><span class="inline-block w-3 h-3 rounded-full bg-yellow-400 mr-1 align-middle"></span>Yellow</td><td class="font-mono">8</td><td><span class="inline-block w-3 h-3 rounded-full bg-sky-400 mr-1 align-middle"></span>Sky Blue</td><td class="font-mono">12</td><td><span class="inline-block w-3 h-3 rounded-full bg-rose-400 mr-1 align-middle"></span>Rose</td></tr>
                <tr><td class="font-mono">1</td><td><span class="inline-block w-3 h-3 rounded-full bg-red-500 mr-1 align-middle"></span>Red</td><td class="font-mono">5</td><td><span class="inline-block w-3 h-3 rounded-full bg-lime-400 mr-1 align-middle"></span>Lime Green</td><td class="font-mono">9</td><td><span class="inline-block w-3 h-3 rounded-full bg-blue-600 mr-1 align-middle"></span>Blue</td><td class="font-mono">13</td><td><span class="inline-block w-3 h-3 rounded-full bg-white border mr-1 align-middle"></span>White</td></tr>
                <tr><td class="font-mono">2</td><td><span class="inline-block w-3 h-3 rounded-full bg-orange-500 mr-1 align-middle"></span>Orange</td><td class="font-mono">6</td><td><span class="inline-block w-3 h-3 rounded-full bg-emerald-400 mr-1 align-middle"></span>Spring Green</td><td class="font-mono">10</td><td><span class="inline-block w-3 h-3 rounded-full bg-violet-500 mr-1 align-middle"></span>Violet</td><td class="font-mono">14</td><td>Custom 1</td></tr>
                <tr><td class="font-mono">3</td><td><span class="inline-block w-3 h-3 rounded-full bg-amber-400 mr-1 align-middle"></span>Amber</td><td class="font-mono">7</td><td><span class="inline-block w-3 h-3 rounded-full bg-cyan-400 mr-1 align-middle"></span>Cyan</td><td class="font-mono">11</td><td><span class="inline-block w-3 h-3 rounded-full bg-fuchsia-500 mr-1 align-middle"></span>Magenta</td><td class="font-mono">15</td><td>Custom 2</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Worked decode example -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-4 mt-4 space-y-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Worked example — decoding <code class="font-mono normal-case text-base-content">184203</code></p>
        <p class="text-sm text-base-content/80">Split the six-character string into three octets: <code class="font-mono bg-base-300 px-1 rounded">18</code> · <code class="font-mono bg-base-300 px-1 rounded">42</code> · <code class="font-mono bg-base-300 px-1 rounded">03</code></p>
        <div class="overflow-x-auto">
          <table class="table table-sm text-sm w-full">
            <thead><tr><th>Octet</th><th>Hex</th><th>Binary</th><th>Field extraction</th><th>Result</th></tr></thead>
            <tbody>
              <tr>
                <td class="font-bold text-primary">0</td>
                <td class="font-mono">0x18</td>
                <td class="font-mono">0001 1000</td>
                <td class="text-xs">Audible = bits[7:6] = 00 = 0<br>C2I = bits[5:3] = 011 = 3<br>C1I = bits[2:0] = 000 = 0</td>
                <td class="text-xs">Audible Off<br>C2 Intensity: Off<br>C1 Intensity: High</td>
              </tr>
              <tr>
                <td class="font-bold text-secondary">1</td>
                <td class="font-mono">0x42</td>
                <td class="font-mono">0100 0010</td>
                <td class="text-xs">Speed = bits[7:6] = 01 = 1<br>Pattern = bits[5:3] = 000 = 0<br>Animation = bits[2:0] = 010 = 2</td>
                <td class="text-xs">Speed: Fast<br>Pattern: Normal<br>Animation: Flash</td>
              </tr>
              <tr>
                <td class="font-bold text-accent">2</td>
                <td class="font-mono">0x03</td>
                <td class="font-mono">0000 0011</td>
                <td class="text-xs">C2 = bits[7:4] = 0000 = 0<br>C1 = bits[3:0] = 0011 = 3</td>
                <td class="text-xs">Colour 2: Green (irrelevant — C2I=Off)<br>Colour 1: Amber</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="rounded-lg border border-success/30 bg-success/5 p-2 text-center">
          <p class="text-sm font-semibold text-base-content"><code class="font-mono bg-base-300 px-1 rounded">184203</code> = <strong>Amber Flashing, Fast, High intensity</strong></p>
        </div>
      </div>

      <!-- Decode exercises -->
      <div class="rounded-xl border-2 border-warning/40 bg-warning/5 p-4 mt-4 space-y-4">
        <p class="font-bold text-base-content">Decode exercises — work these out without the UI</p>
        <p class="text-sm text-base-content/80">For each hex value below, extract every field and state what the light will do. Use the tables above. Show your working.</p>

        <div class="space-y-3">
          <div class="rounded-lg border border-base-300 bg-base-100 p-3">
            <p class="font-mono font-bold text-base-content">Exercise 1: <code class="bg-base-300 px-1 rounded">000100</code></p>
            <p class="text-xs text-base-content/60 mt-1">Octet 0 = 0x00 · Octet 1 = 0x01 · Octet 2 = 0x00</p>
          </div>
          <div class="rounded-lg border border-base-300 bg-base-100 p-3">
            <p class="font-mono font-bold text-base-content">Exercise 2: <code class="bg-base-300 px-1 rounded">004312</code></p>
            <p class="text-xs text-base-content/60 mt-1">Octet 0 = 0x00 · Octet 1 = 0x43 · Octet 2 = 0x12</p>
          </div>
          <div class="rounded-lg border border-base-300 bg-base-100 p-3">
            <p class="font-mono font-bold text-base-content">Exercise 3: <code class="bg-base-300 px-1 rounded">198205</code></p>
            <p class="text-xs text-base-content/60 mt-1">Octet 0 = 0x19 · Octet 1 = 0x82 · Octet 2 = 0x05</p>
          </div>
        </div>

<div id="cp2-ws10-decode-answers" class="hidden rounded-lg border border-base-300 bg-base-300/50 p-4 text-sm space-y-3 ws-suggested">
          <p><strong>Exercise 1 — <code class="font-mono">000100</code>:</strong></p>
          <p class="ml-4 text-base-content/80">Octet0 = 0x00 → Audible=0(Off), C2I=0(High), C1I=0(High)<br>Octet1 = 0x01 = 0b00000001 → Speed=0(Med), Pattern=0(Normal), Animation=1(Steady)<br>Octet2 = 0x00 → C2=0(Green), C1=0(Green)<br><strong>Result: Green Steady, Medium speed, High intensity.</strong> This is the AL1350 startup default.</p>
          <p><strong>Exercise 2 — <code class="font-mono">004312</code>:</strong></p>
          <p class="ml-4 text-base-content/80">Octet0 = 0x00 → Audible=0, C2I=0(High), C1I=0(High)<br>Octet1 = 0x43 = 0b01000011 → Speed=01=1(Fast), Pattern=000=0(Normal), Animation=011=3(Two Colour Flash)<br>Octet2 = 0x12 = 0b00010010 → C2=0001=1(Red), C1=0010=2(Orange)<br><strong>Result: Orange/Red Two Colour Flash, Fast, both High intensity.</strong></p>
          <p><strong>Exercise 3 — <code class="font-mono">198205</code>:</strong></p>
          <p class="ml-4 text-base-content/80">Octet0 = 0x19 = 0b00011001 → Audible=00=0(Off), C2I=011=3(Off), C1I=001=1(Low)<br>Octet1 = 0x82 = 0b10000010 → Speed=10=2(Slow), Pattern=000=0(Normal), Animation=010=2(Flash)<br>Octet2 = 0x05 = 0b00000101 → C2=0000=0(Green, irrelevant — C2I=Off), C1=0101=5(Lime Green)<br><strong>Result: Lime Green Flashing, Slow, Low intensity.</strong></p>
        </div>
      </div>

      <!-- Encode exercises -->
      <div class="rounded-xl border-2 border-accent/40 bg-accent/5 p-4 mt-4 space-y-4">
        <p class="font-bold text-base-content">Encode exercises — build the hex from a specification</p>
        <p class="text-sm text-base-content/80">For each specification below, calculate the three octets and write out the six-character hex. Set C2I = Off (3) unless the spec says Two Colour Flash. Set audible = 0.</p>

        <div class="space-y-3">
          <div class="rounded-lg border border-base-300 bg-base-100 p-3">
            <p class="font-semibold text-base-content">Exercise A</p>
            <p class="text-sm text-base-content/80 mt-1">Blue · Steady · Medium speed · High intensity</p>
          </div>
          <div class="rounded-lg border border-base-300 bg-base-100 p-3">
            <p class="font-semibold text-base-content">Exercise B</p>
            <p class="text-sm text-base-content/80 mt-1">Cyan / Magenta · Two Colour Flash · Fast · High intensity for both colours</p>
          </div>
        </div>

<div id="cp2-ws10-encode-answers" class="hidden rounded-lg border border-base-300 bg-base-300/50 p-4 text-sm space-y-3 ws-suggested">
          <p><strong>Exercise A — Blue Steady Medium High:</strong></p>
          <p class="ml-4 text-base-content/80">Octet2: C2=0(n/a), C1=9(Blue) → 0x09<br>Octet1: Speed=0(Med), Pattern=0(Normal), Animation=1(Steady) → (0&lt;&lt;6)|(0&lt;&lt;3)|1 = 0x01<br>Octet0: Audible=0, C2I=3(Off), C1I=0(High) → (0&lt;&lt;6)|(3&lt;&lt;3)|0 = 24 = 0x18<br><strong>Result: <code class="font-mono bg-base-300 px-1 rounded">180109</code></strong></p>
          <p><strong>Exercise B — Cyan/Magenta Two Colour Flash Fast High:</strong></p>
          <p class="ml-4 text-base-content/80">Octet2: C2=11(Magenta), C1=7(Cyan) → (11&lt;&lt;4)|7 = 176+7 = 183 = 0xB7<br>Octet1: Speed=1(Fast), Pattern=0(Normal), Animation=3(Two Colour) → (1&lt;&lt;6)|(0&lt;&lt;3)|3 = 64+3 = 67 = 0x43<br>Octet0: Audible=0, C2I=0(High), C1I=0(High) → 0x00<br><strong>Result: <code class="font-mono bg-base-300 px-1 rounded">0043B7</code></strong></p>
        </div>
      </div>

      <!-- Firmware note -->
      <div class="rounded-lg border border-warning/40 bg-warning/5 p-3 mt-4 text-sm space-y-1">
        <p class="font-bold text-warning">Firmware limitation — Animation mode 4 (Intensity Sweep)</p>
        <p class="text-base-content/80">CL50 firmware v1.0.2 does not execute PDout animation=4. The AL1350 accepts the write without error but the light simply holds steady at the specified C1I intensity — it does not sweep. The HMI works around this by running a software loop in the backend that rapidly steps through intensity values (High → Medium → Low → Medium → High) using animation=1 (Steady). This produces the breathing effect you see when pressing the "Green Pulse" button in CP3723 Worksheet 6. If you calculate a hex with animation=4 (e.g. <code class="font-mono bg-base-300 px-1 rounded">180401</code>) and write it directly to the AL1350, the light will turn on steady — not sweep.</p>
      </div>

      <!-- Verification section -->
      <div class="rounded-xl border-2 border-success/40 bg-success/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-base">Verification — write and decode a CL50 PDout live</p>
        <p class="text-sm text-base-content/80">Use the CL50 control panel on the Dashboard (Port 4 card) to write different colours and animations. Then decode the resulting hex manually using the tables above.</p>
        <div class="space-y-3 mt-2">
          <label class="cp2-kit-item flex items-start gap-3 cursor-pointer">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning mt-0.5 shrink-0" />
            <span class="text-sm text-base-content/85">Write "Red Flash Fast" to Port 4 using the Dashboard quick-colour buttons. Before clicking, calculate what the hex should be: Octet2 = 0x01 (C1=Red=1), Octet1 = (1&lt;&lt;6)|(0&lt;&lt;3)|2 = 0x42, Octet0 = 0x00 → <code class="font-mono bg-base-300 px-1 rounded">004201</code>. Verify it matches what appears in the live hex display on the Port 4 card.</span>
          </label>
          <label class="cp2-kit-item flex items-start gap-3 cursor-pointer">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning mt-0.5 shrink-0" />
            <span class="text-sm text-base-content/85">Confirm your decode for Exercise 1 (<code class="font-mono bg-base-300 px-1 rounded">000100</code>): Green Steady Medium speed High intensity. Observe the physical CL50 at startup — this is the default state written by the backend when it first starts. The light should be solid green.</span>
          </label>
          <label class="cp2-kit-item flex items-start gap-3 cursor-pointer">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning mt-0.5 shrink-0" />
            <span class="text-sm text-base-content/85">Build "Amber Flash Slow High" from scratch: Octet2 = C1=3(Amber) = 0x03, Octet1 = Speed=2(Slow) = (2&lt;&lt;6)|(0&lt;&lt;3)|2 = 128|0|2 = 0x82, Octet0 = C1I=0(High) = 0x00 → <code class="font-mono bg-base-300 px-1 rounded">008203</code>. Write it using the hex input on the LED Config modal and confirm the physical light shows slow amber flashing.</span>
          </label>
          <label class="cp2-kit-item flex items-start gap-3 cursor-pointer">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning mt-0.5 shrink-0" />
            <span class="text-sm text-base-content/85">Navigate to Port 4 on the Dashboard and open the LED Config modal. Set the Animation dropdown to "Two Colour Flash" and change the colour selections. Observe that the live hex preview (<code class="font-mono bg-base-300 px-1 rounded">#led-modal-hex-preview</code>) updates immediately as you change each dropdown — this is the encode logic running in the browser, translating your field selections into the 6-character PDout value.</span>
          </label>
          <label class="cp2-kit-item flex items-start gap-3 cursor-pointer">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning mt-0.5 shrink-0" />
            <span class="text-sm text-base-content/85">Select Animation = "Intensity Sweep" (mode 4) in the LED Config modal and write it to Port 4. Confirm the physical CL50 shows a static light at the selected intensity rather than a sweeping effect — this confirms the firmware v1.0.2 limitation. The backend software breathing loop (Green Pulse button) is a workaround that achieves the visual effect using rapid Steady writes instead.</span>
          </label>
        </div>
      </div>
    `
  }
];

const TOTAL = WORKSHEETS.length;

function buildIndexHtml() {
  const cards = WORKSHEETS.map(function (ws, i) {
    const isEven = i % 2 === 0;
    const borderClass = isEven ? 'border-secondary/30 hover:border-secondary' : 'border-accent/30 hover:border-accent';
    const badgeClass = isEven ? 'badge-secondary' : 'badge-accent';
    return `
      <button type="button" class="cp2-index-link w-full text-left rounded-2xl border-2 bg-base-200/95 shadow-lg hover:shadow-xl transition-all duration-200 p-6 min-h-[140px] flex flex-col justify-center ${borderClass}" data-worksheet-index="${i + 1}">
        <span class="badge ${badgeClass} badge-sm w-fit mb-2">${ws.id}</span>
        <h3 class="font-bold text-lg text-base-content leading-tight">${ws.title}</h3>
        <p class="text-sm text-base-content/70 mt-1">${ws.shortDesc || ''}</p>
      </button>
    `;
  }).join('');
  return `
    <div class="cp2-index max-w-5xl mx-auto space-y-6 relative min-h-full py-2 rounded-2xl" style="background: linear-gradient(160deg, hsl(var(--b2)) 0%, hsl(var(--b3)) 40%, hsl(var(--s) / 0.08) 100%);">
      <div class="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 100 100" fill="none" class="text-secondary"><circle cx="50" cy="50" r="35" stroke="currentColor" stroke-width="1.5"/><path d="M50 15v70M15 50h70M26 26l48 48M74 26L26 74" stroke="currentColor" stroke-width="0.8"/></svg>
      </div>
      <header class="flex items-center gap-3 px-4 py-2 rounded-xl bg-secondary/10 border border-secondary/30">
        <span class="badge badge-secondary badge-outline font-mono text-xs shrink-0">CP7395</span>
        <h1 class="text-base font-bold text-base-content tracking-tight truncate">Industry 4.0 IO-Link</h1>
        <span class="text-xs text-base-content/50 ml-auto shrink-0 hidden sm:inline">${TOTAL} worksheets</span>
      </header>
      <div class="relative grid grid-cols-1 sm:grid-cols-2 gap-5">
        ${cards}
      </div>
      <footer class="relative pt-4 border-t-2 border-base-300 flex flex-wrap gap-2 items-center justify-between">
        <a href="#" data-page="io-link-master" class="btn btn-outline btn-sm gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Dashboard
        </a>
      </footer>
    </div>
  `;
}


function buildWorksheetViewHtml(worksheetIndex) {
  const ws = WORKSHEETS[worksheetIndex - 1];
  if (!ws) return buildIndexHtml();
  const prevNum = worksheetIndex === 1 ? TOTAL : worksheetIndex - 1;
  const nextNum = worksheetIndex === TOTAL ? 1 : worksheetIndex + 1;
  return `
    <div class="max-w-4xl mx-auto space-y-6 relative min-h-full py-2 rounded-2xl" style="background: linear-gradient(160deg, hsl(var(--b2)) 0%, hsl(var(--b3)) 45%, hsl(var(--a) / 0.06) 100%);">
      <div class="absolute top-0 right-0 w-32 h-32 opacity-15 pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 100 100" fill="none" class="text-secondary"><circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="2"/></svg>
      </div>
      <nav class="relative flex items-center justify-between gap-2 flex-wrap pb-4 border-b-2 border-secondary/20 bg-base-200/50 rounded-lg px-3 py-2">
        <div class="flex items-center gap-2 flex-wrap">
          <button type="button" class="btn btn-outline btn-sm gap-2 cp2-back-btn border-secondary/40">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Worksheets
          </button>
          <button type="button" class="btn btn-ghost btn-sm cp2-prev-btn">Previous (${prevNum})</button>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="btn btn-secondary btn-sm cp2-next-btn">Next (${nextNum})</button>
        </div>
      </nav>
      <div class="relative card bg-base-200 shadow-xl border-2 border-secondary/20 rounded-2xl overflow-hidden">
        <div class="card-body gap-4">
          <h2 class="card-title text-xl text-base-content border-b-2 border-secondary/30 pb-2 gap-2">
            <span class="badge badge-secondary badge-lg">${ws.id}</span>
            ${ws.title}
          </h2>
          ${ws.contentHtml}
        </div>
      </div>
      <footer class="relative pt-4 border-t-2 border-base-300 flex flex-wrap gap-2 items-center justify-between">
        ${worksheetIndex > 1
          ? `<button type="button" class="btn btn-outline btn-sm gap-2 cp2-prev-btn">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Previous
            </button>`
          : `<button type="button" class="btn btn-ghost btn-sm gap-2 cp2-back-btn">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              All Worksheets
            </button>`}
        ${worksheetIndex < TOTAL
          ? `<button type="button" class="btn btn-secondary gap-2 cp2-next-btn">
              Next
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>`
          : `<button type="button" class="btn btn-success gap-2 cp2-back-btn">
              All Done ✓
            </button>`}
      </footer>
    </div>
  `;
}

let currentWorksheetIndex = 0;

function scrollToTop() {
  document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'instant' });
}

function showIndex() {
  currentWorksheetIndex = 0;
  stopCp2EmbeddedPanels();
  const root = document.getElementById('cp0002-root');
  if (!root) return;
  root.innerHTML = buildIndexHtml();
  scrollToTop();
}

function showWorksheet(n) {
  if (n < 1 || n > TOTAL) return;
  currentWorksheetIndex = n;
  stopCp2EmbeddedPanels();
  markVisited('cp0002', n);
  const root = document.getElementById('cp0002-root');
  if (!root) return;
  root.innerHTML = buildWorksheetViewHtml(n);
  scrollToTop();
  initWorksheetInteractivity(root);
}

let _cp2MsgCount = 0;

function initLiveCp2Intro(container) {
  _cp2MsgCount = 0;
  startCp2LiveData(data => {
    _cp2MsgCount++;
    const connected = !!(data && data.success);

    const dot = container.querySelector('#cp2-master-dot');
    const lbl = container.querySelector('#cp2-master-label');
    if (dot) {
      dot.className = connected
        ? 'w-5 h-5 rounded-full mx-auto transition-all bg-success'
        : 'w-5 h-5 rounded-full mx-auto transition-all bg-error';
    }
    if (lbl) lbl.textContent = connected ? 'ONLINE' : 'OFFLINE';

    const portCount = Array.isArray(data?.ports)
      ? data.ports.filter(p => p.mode === 'io-link').length : 0;
    const pcEl = container.querySelector('#cp2-port-count');
    if (pcEl) pcEl.textContent = portCount;

    const mcEl = container.querySelector('#cp2-msg-count');
    if (mcEl) mcEl.textContent = _cp2MsgCount;

    const tsEl = container.querySelector('#cp2-last-update');
    if (tsEl) tsEl.textContent = new Date().toLocaleTimeString();

    const badge = container.querySelector('#cp2-sys-badge');
    if (badge) { badge.textContent = 'LIVE'; badge.className = 'badge badge-xs badge-success font-mono'; }

    // Step 3 live temperature decode (WS2 only — elements absent on WS1)
    const port3 = Array.isArray(data?.ports) ? data.ports.find(p => p.port === 3) : null;
    const tempC = port3?.pdin_decoded?.temperature_c;
    const tempCEl = container.querySelector('#cp2-ws2-temp-c');
    const tempRawEl = container.querySelector('#cp2-ws2-temp-raw');
    const tempHexEl = container.querySelector('#cp2-ws2-temp-hex');
    if (tempCEl && tempC != null) {
      const raw = Math.round(tempC * 10);
      tempCEl.textContent = tempC.toFixed(1) + ' °C';
      if (tempRawEl) tempRawEl.textContent = raw;
      if (tempHexEl) tempHexEl.textContent = '0x' + (raw & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    }
  });
}

function initLiveCp2Ws3(container) {
  startCp2LiveData(function(data) {
    // ── Port 1: OMRON E2E proximity ──
    const port1 = Array.isArray(data && data.ports) ? data.ports.find(function(p) { return p.port === 1; }) : null;
    const badge1 = container.querySelector('#cp2-ws3-badge');
    if (badge1) {
      badge1.textContent = port1 ? 'LIVE' : 'OFFLINE';
      badge1.className = port1 ? 'badge badge-xs badge-success font-mono' : 'badge badge-xs badge-ghost font-mono';
    }
    if (port1 && port1.pdin) {
      var pdin1 = port1.pdin.toUpperCase().padStart(4, '0');
      var b0hex = pdin1.slice(0, 2);
      var b1hex = pdin1.slice(2, 4);
      var b1val = parseInt(b1hex, 16);
      var out1 = !!(b1val & 0x01);
      var instab = !!(b1val & 0x10);
      var overapp = !!(b1val & 0x20);
      var warn = !!(b1val & 0x40);
      var mon = parseInt(b0hex, 16);

      var pdEl = container.querySelector('#cp2-ws3-pdin');
      var b0El = container.querySelector('#cp2-ws3-byte0');
      var b1El = container.querySelector('#cp2-ws3-byte1');
      var out1El = container.querySelector('#cp2-ws3-out1');
      var dotEl = container.querySelector('#cp2-ws3-out1-dot');
      var monEl = container.querySelector('#cp2-ws3-mon');
      var instabEl = container.querySelector('#cp2-ws3-instab');
      var overappEl = container.querySelector('#cp2-ws3-overapp');
      var warnEl = container.querySelector('#cp2-ws3-warn');

      if (pdEl) pdEl.textContent = pdin1;
      if (b0El) b0El.textContent = b0hex;
      if (b1El) b1El.textContent = b1hex;
      if (monEl) monEl.textContent = mon;
      if (out1El) {
        out1El.textContent = out1 ? 'OBJECT DETECTED' : 'NO OBJECT';
        out1El.className = out1 ? 'font-bold font-mono text-sm text-success' : 'font-bold font-mono text-sm text-base-content/50';
      }
      if (dotEl) {
        dotEl.className = out1
          ? 'w-7 h-7 rounded-full mx-auto mb-1 bg-success transition-all duration-200 shadow-lg shadow-success/50'
          : 'w-7 h-7 rounded-full mx-auto mb-1 bg-base-300 transition-all duration-200';
      }
      var _flag = function(el, active, label) {
        if (!el) return;
        el.textContent = active ? 'ACTIVE' : 'CLEAR';
        el.className = active ? 'font-mono font-bold text-error' : 'font-mono font-bold text-base-content/50';
      };
      _flag(instabEl, instab);
      _flag(overappEl, overapp);
      _flag(warnEl, warn);
    }

    // ── Port 2: Capacitive ──
    var port2 = Array.isArray(data && data.ports) ? data.ports.find(function(p) { return p.port === 2; }) : null;
    var badge2 = container.querySelector('#cp2-ws3-cap-badge');
    if (badge2) {
      badge2.textContent = port2 ? 'LIVE' : 'OFFLINE';
      badge2.className = port2 ? 'badge badge-xs badge-success font-mono' : 'badge badge-xs badge-ghost font-mono';
    }
    if (port2 && port2.pdin) {
      var pdin2 = port2.pdin.toUpperCase().padStart(8, '0');
      var dec2 = port2.pdin_decoded || {};
      var diel = dec2.analogue_value != null ? dec2.analogue_value : parseInt(pdin2.slice(0, 4), 16);
      var so1 = !!(dec2.object_detected || dec2.so1);

      var capPdinEl = container.querySelector('#cp2-ws3-cap-pdin');
      var capDielEl = container.querySelector('#cp2-ws3-cap-diel');
      var capDotEl = container.querySelector('#cp2-ws3-cap-dot');
      var capSsc1El = container.querySelector('#cp2-ws3-cap-ssc1');

      if (capPdinEl) capPdinEl.textContent = pdin2;
      if (capDielEl) capDielEl.textContent = diel;
      if (capSsc1El) {
        capSsc1El.textContent = so1 ? 'SO1 ON' : 'SO1 OFF';
        capSsc1El.className = so1 ? 'font-bold font-mono text-xs text-success' : 'font-bold font-mono text-xs text-base-content/50';
      }
      if (capDotEl) {
        capDotEl.className = so1
          ? 'w-6 h-6 rounded-full mx-auto mb-1 bg-success transition-all duration-200 shadow-lg shadow-success/50'
          : 'w-6 h-6 rounded-full mx-auto mb-1 bg-base-300 transition-all duration-200';
      }
    }

    // ── Port 3: Temperature ──
    var port3 = Array.isArray(data && data.ports) ? data.ports.find(function(p) { return p.port === 3; }) : null;
    var badge3 = container.querySelector('#cp2-ws3-temp-badge');
    if (badge3) {
      badge3.textContent = port3 ? 'LIVE' : 'OFFLINE';
      badge3.className = port3 ? 'badge badge-xs badge-success font-mono' : 'badge badge-xs badge-ghost font-mono';
    }
    if (port3 && port3.pdin) {
      var pdin3 = port3.pdin.toUpperCase().padStart(8, '0');
      var tempPdinEl = container.querySelector('#cp2-ws3-temp-pdin');
      var tempRawEl = container.querySelector('#cp2-ws3-temp-raw');
      var tempCEl = container.querySelector('#cp2-ws3-temp-c');
      var tempC = port3.pdin_decoded && port3.pdin_decoded.temperature_c != null ? port3.pdin_decoded.temperature_c : null;
      if (tempPdinEl) tempPdinEl.textContent = pdin3;
      if (tempC != null) {
        var raw3 = Math.round(tempC * 10);
        if (tempRawEl) tempRawEl.textContent = raw3;
        if (tempCEl) tempCEl.textContent = tempC.toFixed(1) + ' °C';
      }
    }
  });

  // ── Port 4: CL50 PDout builder ──
  var cl50El = container.querySelector('#cp2-ws3-cl50');
  if (!cl50El) return;

  var _cl50Color = 0;   // Green
  var _cl50Anim  = 1;   // Steady
  var _cl50Css   = '#22c55e';

  function _cl50Hex() {
    var b0 = 0x00;            // C1I = High (0), rest = 0
    var b1 = _cl50Anim & 0x07;
    var b2 = _cl50Color & 0x0F;
    return [b0, b1, b2].map(function(b) { return ('0' + b.toString(16)).slice(-2).toUpperCase(); }).join('');
  }

  function _cl50UpdatePreview() {
    var hex = _cl50Hex();
    var b0El = container.querySelector('#cp2-ws3-cl50-b0');
    var b1El = container.querySelector('#cp2-ws3-cl50-b1');
    var b2El = container.querySelector('#cp2-ws3-cl50-b2');
    var hexEl = container.querySelector('#cp2-ws3-cl50-hex');
    var swEl  = container.querySelector('#cp2-ws3-cl50-swatch');
    if (b0El) b0El.textContent = hex.slice(0, 2);
    if (b1El) b1El.textContent = hex.slice(2, 4);
    if (b2El) b2El.textContent = hex.slice(4, 6);
    if (hexEl) hexEl.textContent = hex;
    if (swEl)  swEl.style.background = _cl50Anim === 0 ? '#374151' : _cl50Css;
  }

  // Colour buttons
  container.querySelectorAll('.cp2-cl50-color').forEach(function(btn) {
    btn.addEventListener('click', function() {
      _cl50Color = parseInt(btn.dataset.cl50color, 10);
      _cl50Css   = btn.dataset.cl50css || '#22c55e';
      container.querySelectorAll('.cp2-cl50-color').forEach(function(b) {
        b.style.boxShadow = '';
        b.style.borderColor = 'transparent';
      });
      btn.style.borderColor = _cl50Css;
      btn.style.boxShadow = '0 0 0 2px ' + _cl50Css + '66';
      _cl50UpdatePreview();
    });
  });

  // Animation buttons
  container.querySelectorAll('.cp2-cl50-anim').forEach(function(btn) {
    btn.addEventListener('click', function() {
      _cl50Anim = parseInt(btn.dataset.cl50anim, 10);
      container.querySelectorAll('.cp2-cl50-anim').forEach(function(b) { b.classList.remove('btn-active'); });
      btn.classList.add('btn-active');
      _cl50UpdatePreview();
    });
  });

  // Send button
  var sendBtn = container.querySelector('#cp2-ws3-cl50-send');
  var statusEl = container.querySelector('#cp2-ws3-cl50-status');
  if (sendBtn) {
    sendBtn.addEventListener('click', function() {
      var hex = _cl50Hex();
      sendBtn.disabled = true;
      if (statusEl) { statusEl.textContent = 'Sending…'; statusEl.className = 'text-xs text-center text-base-content/50 h-4'; }
      var apiBase = window.IO_LINK_API_BASE || window.location.origin;
      fetch(apiBase + '/api/io-link/port/4/pdout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: hex })
      })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (statusEl) {
          statusEl.textContent = d.success ? 'Sent! Watch the light.' : 'Error: ' + (d.detail || 'failed');
          statusEl.className = 'text-xs text-center h-4 ' + (d.success ? 'text-success' : 'text-error');
        }
      })
      .catch(function() {
        if (statusEl) { statusEl.textContent = 'Could not reach backend'; statusEl.className = 'text-xs text-center text-error h-4'; }
      })
      .finally(function() { sendBtn.disabled = false; });
    });
  }

  // Set initial selected state
  var firstColor = container.querySelector('.cp2-cl50-color');
  if (firstColor) { firstColor.style.borderColor = _cl50Css; firstColor.style.boxShadow = '0 0 0 2px ' + _cl50Css + '66'; }
  _cl50UpdatePreview();
}

function initLiveCp2Ws9(container) {
  startCp2LiveData(function (data) {
    const port = data && Array.isArray(data.ports) ? data.ports.find(function (p) { return p.port === 3; }) : null;
    const badge = container.querySelector('#cp2-ws9-badge');
    if (badge) {
      badge.textContent = port ? 'LIVE' : 'OFFLINE';
      badge.className = port ? 'badge badge-xs badge-success font-mono' : 'badge badge-xs badge-ghost font-mono';
    }
    if (!port || !port.pdin_decoded) return;
    var temp = port.pdin_decoded.temperature_c;
    if (temp === null || temp === undefined) return;
    var raw = Math.round(temp * 10);
    var rawHex = (raw & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    var b0 = rawHex.slice(0, 2);
    var b1 = rawHex.slice(2, 4);
    var resistance = (100 * (1 + 0.00385 * temp)).toFixed(2);

    var pdEl   = container.querySelector('#cp2-ws9-pdin-hex');
    var byEl   = container.querySelector('#cp2-ws9-bytes01');
    var i16El  = container.querySelector('#cp2-ws9-int16');
    var tcEl   = container.querySelector('#cp2-ws9-temp-calc');
    var resEl  = container.querySelector('#cp2-ws9-resistance');
    if (pdEl)  pdEl.textContent  = b0 + ' ' + b1 + ' FF 00';
    if (byEl)  byEl.textContent  = b0 + ' ' + b1 + '  (0x' + rawHex + ')';
    if (i16El) i16El.textContent = raw + ' decimal';
    if (tcEl)  tcEl.textContent  = raw + ' ÷ 10 = ' + temp.toFixed(1) + ' °C';
    if (resEl) resEl.textContent = resistance + ' Ω';
  });
}


function initLiveCp2Ws4(container) {
  var API = (window.IO_LINK_API_BASE || '') + '/api/io-link';

  // ── PDout byte builders (Steps 1 & 5) ──────────────────────────────────

  function _toHex2(n) { return ('0' + n.toString(16)).slice(-2).toUpperCase(); }

  function _v(prefix, field) {
    var el = container.querySelector('#' + prefix + field);
    return el ? (parseInt(el.value) || 0) : 0;
  }

  function _computeHex(prefix) {
    var b0 = ((_v(prefix,'audible') & 0x03) << 6) | ((_v(prefix,'c2i') & 0x07) << 3) | (_v(prefix,'c1i') & 0x07);
    var b1 = ((_v(prefix,'speed')   & 0x03) << 6) | ((_v(prefix,'pattern') & 0x07) << 3) | (_v(prefix,'anim') & 0x07);
    var b2 = ((_v(prefix,'c2') & 0x0F) << 4) | (_v(prefix,'c1') & 0x0F);
    return _toHex2(b0) + _toHex2(b1) + _toHex2(b2);
  }

  function _wireBuilder(prefix, sendId, statusId, validId, targetC1, targetAnim, targetLabel) {
    var preview = container.querySelector('#' + prefix + 'hex');
    var validEl = container.querySelector('#' + validId);
    var sendBtn = container.querySelector('#' + sendId);
    var statusEl = container.querySelector('#' + statusId);

    function _update() {
      var hex = _computeHex(prefix);
      var correct = (_v(prefix,'c1') === targetC1 && _v(prefix,'anim') === targetAnim);
      if (preview) { preview.textContent = hex; preview.style.color = correct ? '#22c55e' : ''; }
      if (validEl) { validEl.textContent = correct ? '✓ Correct — ' + targetLabel : ''; validEl.style.color = correct ? '#22c55e' : ''; }
    }

    ['audible','c2i','c1i','speed','pattern','anim','c1','c2'].forEach(function(field) {
      var el = container.querySelector('#' + prefix + field);
      if (el) el.addEventListener('change', _update);
    });
    _update();

    if (sendBtn) {
      sendBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var hex = _computeHex(prefix);
        if (statusEl) statusEl.textContent = 'Sending…';
        fetch(API + '/port/4/pdout', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({value: hex}) })
          .then(function(r) { return r.json(); })
          .then(function(d) { if (statusEl) statusEl.textContent = d.success ? '✓ Sent' : '✗ Failed'; })
          .catch(function() { if (statusEl) statusEl.textContent = '✗ Error'; });
      });
    }
  }

  _wireBuilder('ws4s1-', 'ws4s1-send', 'ws4s1-status', 'ws4s1-valid', 1, 2, 'Red, Flash');
  _wireBuilder('ws4s5-', 'ws4s5-send', 'ws4s5-status', 'ws4s5-valid', 0, 1, 'Green, Steady');

  // ── Step 3: ISDU read SP1 from Port 3 ──────────────────────────────────

  var sp1Btn = container.querySelector('#ws4-read-sp1');
  if (sp1Btn) {
    sp1Btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var statusEl = container.querySelector('#ws4-sp1-status');
      var valEl    = container.querySelector('#ws4-sp1-val');
      var unitEl   = container.querySelector('#ws4-sp1-unit');
      var hexEl    = container.querySelector('#ws4-sp1-hex');
      if (statusEl) statusEl.textContent = 'Reading…';
      fetch(API + '/port/3/parameter/read', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({index: 583, subindex: 0, dtype: 'int16', scale: 0.1})
      }).then(function(r) { return r.json(); })
        .then(function(d) {
          if (d.success) {
            if (valEl) valEl.textContent = d.value;
            if (unitEl) unitEl.classList.remove('hidden');
            if (hexEl)  hexEl.textContent = '(raw: 0x' + (d.raw_hex || '') + ')';
            if (statusEl) statusEl.textContent = '';
          } else {
            if (statusEl) statusEl.textContent = '✗ Read failed';
          }
        })
        .catch(function() { if (statusEl) statusEl.textContent = '✗ Error'; });
    });
  }

  // ── Steps 2 & 4: live WebSocket for device identity + detection counter ─

  var _capPrev = null;
  var _capCount = 0;

  // Ensure Port 2 is in IO-Link mode (may have been left inactive by a previous scenario)
  fetch(API + '/port/2/mode', {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({mode: 'io-link'})
  }).catch(function() {});

  // Pre-populate Step 2 identity immediately without waiting for the HTTP poll cycle
  fetch(API + '/port/2')
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var vidEl  = container.querySelector('#ws4-p2-vid');
      var didEl  = container.querySelector('#ws4-p2-did');
      var nameEl = container.querySelector('#ws4-p2-name');
      var modeEl = container.querySelector('#ws4-p2-mode');
      var _vid = d.vendor_id != null && d.vendor_id !== '' ? d.vendor_id : null;
      var _did = d.device_id != null && d.device_id !== '' ? d.device_id : null;
      if (vidEl)  vidEl.textContent  = _vid != null ? resolveVendorName(_vid) : '—';
      if (didEl)  didEl.textContent  = _did != null ? String(_did) : '—';
      if (nameEl) nameEl.textContent = (_vid != null && _did != null) ? resolveDeviceName(_vid, _did, d.name) : (d.name || '—');
      if (modeEl) modeEl.textContent = d.mode || '—';
    }).catch(function() {});

  // Set cleanup AFTER startCp2LiveData so the stopCp2LiveData() call inside it doesn't fire it immediately
  startCp2LiveData(function(data) {
    if (!data || !Array.isArray(data.ports)) return;
    var p2 = data.ports.find(function(p) { return p.port === 2; });

    // Step 2 — identity
    if (p2) {
      var vidEl   = container.querySelector('#ws4-p2-vid');
      var didEl   = container.querySelector('#ws4-p2-did');
      var nameEl  = container.querySelector('#ws4-p2-name');
      var modeEl  = container.querySelector('#ws4-p2-mode');
      var _vid2 = p2.vendor_id  != null && p2.vendor_id  !== '' ? p2.vendor_id  : null;
      var _did2 = p2.device_id != null && p2.device_id !== '' ? p2.device_id : null;
      if (vidEl)  vidEl.textContent  = _vid2 != null ? resolveVendorName(_vid2) : '—';
      if (didEl)  didEl.textContent  = _did2 != null ? String(_did2) : '—';
      if (nameEl) nameEl.textContent = (_vid2 != null && _did2 != null) ? resolveDeviceName(_vid2, _did2, p2.name) : (p2.name || '—');
      if (modeEl) modeEl.textContent = p2.mode || '—';
    }

    // Step 4 — detection counter
    if (p2 && p2.pdin_decoded) {
      var dec = p2.pdin_decoded;
      var detected = !!(dec.object_detected || dec.so1 || dec.out1);
      var ledEl   = container.querySelector('#ws4-cap-led');
      var stateEl = container.querySelector('#ws4-cap-state');
      var cntEl   = container.querySelector('#ws4-cap-count');
      if (ledEl)   ledEl.style.background   = detected ? '#22c55e' : '#374151';
      if (stateEl) stateEl.textContent       = detected ? 'DETECTED' : 'NO OBJECT';
      if (_capPrev === false && detected === true) { _capCount++; }
      _capPrev = detected;
      if (cntEl) cntEl.textContent = _capCount;
    }
  });

  _cp2Ws4Cleanup = function() {
    fetch((window.IO_LINK_API_BASE || '') + '/api/io-link/port/4/pdout', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({value: '000100'})
    }).catch(function() {});
  };
}

function initLiveCp2Ws5(container) {
  var API = (window.IO_LINK_API_BASE || '') + '/api/io-link';

  function wireChallenge(readId, hexId, ansId, checkId, resultId, port, index, subindex, dtype, scale, unit, tolerance) {
    var readBtn = container.querySelector('#' + readId);
    var hexEl = container.querySelector('#' + hexId);
    var checkBtn = container.querySelector('#' + checkId);
    var resultEl = container.querySelector('#' + resultId);
    var expected = null;

    if (readBtn) {
      readBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (hexEl) hexEl.textContent = 'Reading…';
        if (resultEl) resultEl.textContent = '';
        expected = null;
        fetch(API + '/port/' + port + '/parameter/read', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ index: index, subindex: subindex, dtype: dtype, scale: scale })
        }).then(function (r) { return r.json(); })
          .then(function (d) {
            if (d.success) {
              if (hexEl) hexEl.textContent = (d.raw_hex || '').toUpperCase();
              expected = d.value;
            } else if (hexEl) {
              hexEl.textContent = '✗ read failed';
            }
          }).catch(function () { if (hexEl) hexEl.textContent = '✗ error'; });
      });
    }

    if (checkBtn) {
      checkBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var ansEl = container.querySelector('#' + ansId);
        var val = ansEl ? parseFloat(ansEl.value) : NaN;
        if (expected === null) {
          if (resultEl) { resultEl.textContent = 'Read the hex first'; resultEl.className = 'text-sm font-semibold text-warning'; }
          return;
        }
        if (isNaN(val)) {
          if (resultEl) { resultEl.textContent = 'Enter a number'; resultEl.className = 'text-sm font-semibold text-warning'; }
          return;
        }
        var ok = Math.abs(val - expected) <= tolerance;
        if (resultEl) {
          resultEl.textContent = ok ? ('✓ Correct — ' + expected + ' ' + unit) : ('✗ Expected ' + expected + ' ' + unit);
          resultEl.className = 'text-sm font-semibold ' + (ok ? 'text-success' : 'text-error');
        }
      });
    }
  }

  wireChallenge('ws5-read-1', 'ws5-hex-1', 'ws5-ans-1', 'ws5-check-1', 'ws5-result-1', 3, 583, 0, 'int16', 0.1, '°C', 0.15);
  wireChallenge('ws5-read-2', 'ws5-hex-2', 'ws5-ans-2', 'ws5-check-2', 'ws5-result-2', 2, 60, 1, 'uint16', 1, 'counts', 0.5);
  wireChallenge('ws5-read-3', 'ws5-hex-3', 'ws5-ans-3', 'ws5-check-3', 'ws5-result-3', 3, 681, 0, 'int16', 0.1, '°C', 0.15);
}

function initWorksheetInteractivity(container) {
  if (!container) container = document.getElementById('cp0002-root');
  if (!container) return;
  // MCQ feedback — lock on first answer, answers live in _CP2_ANSWERS not the DOM
  var radioGroups = {};
  container.querySelectorAll('input[type="radio"]').forEach(function (r) {
    if (!_CP2_ANSWERS[r.name]) return;
    if (!radioGroups[r.name]) radioGroups[r.name] = [];
    radioGroups[r.name].push(r);
  });
  Object.keys(radioGroups).forEach(function (name) {
    var radios = radioGroups[name];
    var correct = _CP2_ANSWERS[name];
    radios.forEach(function (radio) {
      radio.addEventListener('change', function () {
        radios.forEach(function (r) { r.disabled = true; });
        radios.forEach(function (r) {
          var label = r.closest('label');
          if (!label) return;
          if (r.value === correct) {
            label.classList.add('bg-success/20', 'border-2', 'border-success', 'rounded-lg', 'px-2', 'py-1');
          } else if (r.value === radio.value) {
            label.classList.add('bg-error/20', 'border-2', 'border-error', 'rounded-lg', 'px-2', 'py-1');
          }
        });
      });
    });
  });

  if (container.querySelector('.cp2-kit-item')) initCp2KitChecklist(container);
  if (container.querySelector('#cp2-sys-panel')) initLiveCp2Intro(container);
  if (container.querySelector('#cp2-ws3-panel')) initLiveCp2Ws3(container);
  if (container.querySelector('#cp2-ws4-verify')) initLiveCp2Ws4(container);
  if (container.querySelector('#cp2-ws5-verify')) initLiveCp2Ws5(container);
  if (container.querySelector('#cp2-ws9-live-panel')) initLiveCp2Ws9(container);
  if (container.querySelector('#cp2-diag-badge')) initCp2EmbeddedPanels(container);

  const ws2Correct = { 'ws2-1': 'events', 'ws2-2': 'params', 'ws2-3': 'events', 'ws2-4': 'events' };
  const ws2Btn = container.querySelector('#ws2-check-btn');
  if (ws2Btn) {
    ws2Btn.addEventListener('click', function () {
      for (let i = 1; i <= 4; i++) {
        const sel = container.querySelector('#ws2-' + i);
        const res = container.querySelector('#ws2-result-' + i);
        if (!sel || !res) continue;
        const val = (sel.value || '').trim();
        const correct = ws2Correct['ws2-' + i];
        res.textContent = val ? (val === correct ? 'Correct' : 'Incorrect') : '';
        res.className = 'ws-check-result text-sm ' + (val === correct ? 'text-success' : (val ? 'text-error' : ''));
      }
    });
  }
  const ws6Correct = { 'ws6-1': 'process', 'ws6-2': 'event', 'ws6-3': 'service', 'ws6-4': 'process', 'ws6-5': 'event' };
  const ws6Btn = container.querySelector('#ws6-check-btn');
  if (ws6Btn) {
    ws6Btn.addEventListener('click', function () {
      for (let i = 1; i <= 5; i++) {
        const sel = container.querySelector('#ws6-' + i);
        const res = container.querySelector('#ws6-result-' + i);
        if (!sel || !res) continue;
        const val = (sel.value || '').trim();
        const correct = ws6Correct['ws6-' + i];
        res.textContent = val ? (val === correct ? 'Correct' : 'Incorrect') : '';
        res.className = 'ws-check-result text-sm ' + (val === correct ? 'text-success' : (val ? 'text-error' : ''));
      }
    });
  }
  const ws5CompCorrect = { 'ws5-comp-1': 'fastapi', 'ws5-comp-2': 'decoder', 'ws5-comp-3': 'fastapi' };
  const ws5CompBtn = container.querySelector('#ws5-comp-check-btn');
  if (ws5CompBtn) {
    ws5CompBtn.addEventListener('click', function () {
      for (let i = 1; i <= 3; i++) {
        const sel = container.querySelector('#ws5-comp-' + i);
        const res = container.querySelector('#ws5-comp-result-' + i);
        if (!sel || !res) continue;
        const val = (sel.value || '').trim();
        const correct = ws5CompCorrect['ws5-comp-' + i];
        res.textContent = val ? (val === correct ? 'Correct' : 'Incorrect') : '';
        res.className = 'ws-check-result text-sm ' + (val === correct ? 'text-success' : (val ? 'text-error' : ''));
      }
    });
  }
}

export function renderCp0002Page() {
  return '<div id="cp0002-root" class="cp0002-root">' + buildIndexHtml() + '</div>';
}

export function destroyCp0002Page() {
  stopCp2LiveData();
  stopCp2EmbeddedPanels();
}

export function initCp0002Page() {
  const root = document.getElementById('cp0002-root');
  if (!root) return;

  root.addEventListener('click', function (e) {
    const backBtn = e.target.closest('.cp2-back-btn');
    if (backBtn) { e.preventDefault(); showIndex(); return; }
    const prevBtn = e.target.closest('.cp2-prev-btn');
    if (prevBtn) {
      e.preventDefault();
      showWorksheet(currentWorksheetIndex === 1 ? TOTAL : currentWorksheetIndex - 1);
      return;
    }
    const nextBtn = e.target.closest('.cp2-next-btn');
    if (nextBtn) {
      e.preventDefault();
      showWorksheet(currentWorksheetIndex === TOTAL ? 1 : currentWorksheetIndex + 1);
      return;
    }
    const indexLink = e.target.closest('.cp2-index-link');
    if (indexLink) {
      e.preventDefault();
      const n = parseInt(indexLink.getAttribute('data-worksheet-index'), 10);
      if (!isNaN(n) && n >= 1 && n <= TOTAL) showWorksheet(n);
      return;
    }
    const printBtn = e.target.closest('.cp2-print-btn');
    if (printBtn) { e.preventDefault(); window.print(); return; }
  });

  initWorksheetInteractivity(root);
}
