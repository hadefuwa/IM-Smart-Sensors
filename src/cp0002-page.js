/**
 * CP0002: Industry 4.0 IO-Link
 * 7 worksheets — engineering level: system brief, architecture, protocol, integration, business case.
 * Audience: engineers, system integrators, HNC/degree students.
 * Prerequisite: CP0001 recommended.
 */
import { markVisited } from './progress-page.js';

// ── Live data infrastructure ──────────────────────────────────────────────────
function getWsBase() {
  const base = window.IO_LINK_API_BASE || window.location.origin;
  return base.replace(/^http/, 'ws');
}
let _cp2WsLive = null;
let _cp2WsCallback = null;
let _cp2ReconnectTimer = null;

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
    prerequisites: 'CP0001 recommended',
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
            <p class="text-xs text-base-content/50">of 8</p>
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

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> From the checklist above, what is the IP address of the AL1350 IO-Link Master?</p>
      <div class="space-y-2 mt-1" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q1" value="a" class="radio radio-sm radio-secondary"> 192.168.7.4</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q1" value="b" class="radio radio-sm radio-secondary"> 192.168.7.2</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q1" value="c" class="radio radio-sm radio-secondary"> 192.168.1.1</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> The AL1350 pushes data to Mosquitto every 500 ms. Approximately how many WebSocket messages should arrive at the browser each second?</p>
      <div class="space-y-2 mt-1" data-correct="b">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q2" value="a" class="radio radio-sm radio-secondary"> 20 messages per second</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q2" value="b" class="radio radio-sm radio-secondary"> 2 messages per second</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q2" value="c" class="radio radio-sm radio-secondary"> 500 messages per second — 500 ms equals 500 per second</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> The Raspberry Pi has two network interfaces (eth0 and wlan0). Why does this matter for the system architecture?</p>
      <div class="space-y-2 mt-1" data-correct="c">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q3" value="a" class="radio radio-sm radio-secondary"> It allows two IO-Link masters to be connected simultaneously</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q3" value="b" class="radio radio-sm radio-secondary"> It doubles bandwidth by bonding eth0 and wlan0 together for MQTT traffic</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q3" value="c" class="radio radio-sm radio-secondary"> It bridges the isolated IO-Link subnet to the building LAN</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q4.</strong> According to the hardware table, how many IO-Link ports have a sensor connected in this system?</p>
      <div class="space-y-2 mt-1" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q4" value="a" class="radio radio-sm radio-secondary"> 4 — Ports 1 through 4 each have a sensor</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q4" value="b" class="radio radio-sm radio-secondary"> 8 — every port on the AL1350 is populated</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws0-q4" value="c" class="radio radio-sm radio-secondary"> 2 — only the photoelectric and capacitive sensors</label>
      </div>

      <!-- Verification challenge -->
      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-base">🎯 Verification — confirm the stack is healthy</p>
        <p class="text-sm text-base-content/80">Open <a href="#" data-page="admin" class="link link-warning">Connection Diagnostics</a> and <a href="#" data-page="edge-device" class="link link-warning">Edge Device</a>. Tick each item when confirmed.</p>
        <div class="space-y-2 text-sm" id="cp2-verify-checklist">
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">The circuit breaker on Connection Diagnostics is <strong>closed</strong> (healthy)</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">The latency graph on Connection Diagnostics is showing live readings (not flat-lined)</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">The backend service is showing as <strong>active</strong> on the Edge Device page</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">The WS message counter above is incrementing at approximately 2 messages per second</span>
          </label>
        </div>
      </div>

      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="cp2-ws0-suggested">Show answers</button>
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
    prerequisites: 'CP0001 recommended',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">This app is a real Industry 4.0 system running on a Raspberry Pi edge device. Three layers talk to each other in real time:</p>

      <!-- Data flow diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">Data flow — sensor to browser</p>
        <svg viewBox="0 0 570 175" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <defs>
            <marker id="ws2-arr-g" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#22c55e"/></marker>
            <marker id="ws2-arr-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#3b82f6"/></marker>
            <marker id="ws2-arr-a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#f59e0b"/></marker>
          </defs>
          <rect x="10" y="55" width="130" height="65" rx="8" fill="#ea580c"/>
          <text x="75" y="80" text-anchor="middle" fill="white" font-size="11" font-weight="700">IO-Link Master</text>
          <text x="75" y="94" text-anchor="middle" fill="#fed7aa" font-size="8">IFM AL1350</text>
          <text x="75" y="107" text-anchor="middle" fill="#fed7aa" font-size="7">192.168.7.4</text>
          <line x1="140" y1="74" x2="213" y2="74" stroke="#22c55e" stroke-width="2" marker-end="url(#ws2-arr-g)"/>
          <text x="177" y="68" text-anchor="middle" fill="#22c55e" font-size="8" font-weight="600">MQTT push</text>
          <text x="177" y="78" text-anchor="middle" fill="#22c55e" font-size="7">500 ms</text>
          <line x1="213" y1="100" x2="140" y2="100" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="5,3" marker-end="url(#ws2-arr-b)"/>
          <text x="177" y="114" text-anchor="middle" fill="#3b82f6" font-size="7">HTTP poll (fallback + ISDU)</text>
          <rect x="215" y="42" width="140" height="91" rx="8" fill="#15803d"/>
          <text x="285" y="72" text-anchor="middle" fill="white" font-size="11" font-weight="700">Raspberry Pi</text>
          <text x="285" y="86" text-anchor="middle" fill="#bbf7d0" font-size="8">FastAPI · Mosquitto</text>
          <text x="285" y="99" text-anchor="middle" fill="#bbf7d0" font-size="8">decoder.py</text>
          <text x="285" y="112" text-anchor="middle" fill="#bbf7d0" font-size="7">192.168.7.2 (eth0)</text>
          <text x="285" y="124" text-anchor="middle" fill="#bbf7d0" font-size="7">Edge Gateway</text>
          <line x1="355" y1="88" x2="418" y2="88" stroke="#f59e0b" stroke-width="2" marker-end="url(#ws2-arr-a)"/>
          <text x="387" y="81" text-anchor="middle" fill="#f59e0b" font-size="8" font-weight="600">WebSocket /ws</text>
          <text x="387" y="92" text-anchor="middle" fill="#f59e0b" font-size="7">JSON push</text>
          <rect x="420" y="55" width="130" height="65" rx="8" fill="#334155"/>
          <rect x="426" y="61" width="118" height="47" rx="4" fill="#0f172a"/>
          <rect x="432" y="67" width="40" height="4" rx="1" fill="#3b82f6" opacity="0.9"/>
          <rect x="432" y="75" width="80" height="3" rx="1" fill="#475569"/>
          <rect x="432" y="82" width="65" height="3" rx="1" fill="#475569"/>
          <rect x="432" y="89" width="75" height="3" rx="1" fill="#10b981" opacity="0.7"/>
          <rect x="432" y="96" width="55" height="3" rx="1" fill="#475569"/>
          <text x="485" y="137" text-anchor="middle" fill="#94a3b8" font-size="9">HMI Dashboard</text>
          <text x="285" y="165" text-anchor="middle" fill="#64748b" font-size="8">AL1350 → MQTT → Pi (FastAPI/Mosquitto) → WebSocket → Browser</text>
        </svg>
      </div>

      <div class="rounded-xl border-2 border-base-300 bg-base-200 p-4 mt-3 font-mono text-sm space-y-0 leading-relaxed overflow-x-auto">
        <p class="text-base-content/60 text-xs mb-2">// System architecture</p>
        <p><span class="text-primary font-bold">[AL1350 IO-Link Master]</span></p>
        <p class="ml-4 text-base-content/70">IP: 192.168.7.4  (IO-Link subnet)</p>
        <p class="ml-4">│</p>
        <p class="ml-4">├─ <span class="text-warning">MQTT publish</span>  → every 500 ms  → Mosquitto broker on Pi</p>
        <p class="ml-4">│    Topics: pdin (sensor data) + supervision (voltage/current/temp)</p>
        <p class="ml-4">│</p>
        <p class="ml-4">└─ <span class="text-accent">HTTP poll</span>  ← Pi polls AL1350  (fallback + ISDU reads)</p>
        <p class="ml-8 text-base-content/70">GET /datapoint/getdata  |  POST / (service calls)</p>
        <p class="ml-4">│</p>
        <p><span class="text-primary font-bold">[Raspberry Pi — Edge Device]</span></p>
        <p class="ml-4 text-base-content/70">IP: 192.168.7.2  |  FastAPI + uvicorn  |  Mosquitto MQTT broker</p>
        <p class="ml-4">│</p>
        <p class="ml-4">├─ Subscribes to AL1350 MQTT topics</p>
        <p class="ml-4">├─ Decodes sensor PDin (temperature, proximity state + alarms, capacitive count, CL50 LED)</p>
        <p class="ml-4">├─ Merges MQTT data + HTTP fallback data</p>
        <p class="ml-4">│</p>
        <p class="ml-4">└─ <span class="text-success">WebSocket /ws</span>  → pushes JSON to all connected browsers</p>
        <p class="ml-4">│</p>
        <p><span class="text-primary font-bold">[Browser — This HMI Dashboard]</span></p>
        <p class="ml-4 text-base-content/70">Vite + vanilla JS  |  Chart.js  |  Tailwind CSS + DaisyUI</p>
        <p class="ml-4">Receives JSON → updates port cards, charts, event log in real time</p>
      </div>

      <div class="mt-4 space-y-3">
        <div class="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
          <p class="font-semibold text-base-content">Why two comms protocols (MQTT + HTTP)?</p>
          <p class="text-base-content/80 mt-1"><strong>MQTT (primary):</strong> The AL1350 pushes data every 500 ms to the Mosquitto broker without being asked. This is low-latency and efficient — ideal for real-time sensor values. The Pi registers a subscription on every startup because the AL1350 loses its subscriptions on power cycle.</p>
          <p class="text-base-content/80 mt-1"><strong>HTTP (fallback + extras):</strong> HTTP polling runs in parallel for data that MQTT doesn't cover — ISDU parameter reads, device tree info (/gettree, cached 5 min), and as a fallback if MQTT is unavailable. The client implements a circuit breaker: if 5 consecutive HTTP requests fail, it stops trying for 15 s before retrying.</p>
        </div>

        <div class="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">
          <p class="font-semibold text-base-content">Why a Raspberry Pi edge device?</p>
          <p class="text-base-content/80 mt-1">The AL1350 IO-Link master lives on a private 192.168.7.x subnet isolated from the main LAN. The Pi bridges the two networks — it has eth0 on the IO-Link subnet and wlan0 on the building network. The browser never talks directly to the AL1350; it only talks to the Pi's FastAPI backend. This is a classic <strong>edge gateway</strong> pattern used across industrial IoT.</p>
        </div>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> Why is MQTT better suited than HTTP polling for delivering sensor data every 500 ms?</p>
      <div class="space-y-2 mt-1" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q1" value="a" class="radio radio-sm radio-secondary"> MQTT uses publish/subscribe so the AL1350 pushes data the moment it is ready, without the Pi having to request each cycle</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q1" value="b" class="radio radio-sm radio-secondary"> HTTP is push-based and uses persistent connections that the broker manages, while MQTT requires a new TCP request each cycle and cannot handle high-frequency data without overloading both devices</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q1" value="c" class="radio radio-sm radio-secondary"> MQTT guarantees delivery of every message in all network conditions by queuing messages until the subscriber acknowledges receipt</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> The AL1350 loses its MQTT subscriptions when it power-cycles. How does the backend handle this?</p>
      <div class="space-y-2" data-correct="c">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q2" value="a" class="radio radio-sm radio-secondary"> It waits for the user to manually re-subscribe</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q2" value="b" class="radio radio-sm radio-secondary"> It switches permanently to HTTP polling</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q2" value="c" class="radio radio-sm radio-secondary"> It calls ensure_mqtt_subscription() on every backend startup, re-registering the push subscription automatically</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> If the FastAPI backend service on the Pi crashed, what would you expect to observe?</p>
      <div class="space-y-2 mt-1" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q3" value="a" class="radio radio-sm radio-secondary"> Live data would stop and the WebSocket would disconnect</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q3" value="b" class="radio radio-sm radio-secondary"> The WebSocket message counter on this page would continue to increment at the normal rate</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q3" value="c" class="radio radio-sm radio-secondary"> The AL1350 would automatically restart the backend service via its own built-in watchdog</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q4.</strong> What does a consistently high round-trip latency value on the Connection Diagnostics page indicate?</p>
      <div class="space-y-2 mt-1" data-correct="b">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q4" value="a" class="radio radio-sm radio-secondary"> The browser's chart rendering pipeline cannot keep up with the WebSocket update rate</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q4" value="b" class="radio radio-sm radio-secondary"> The AL1350 is under load or there is congestion on the IO-Link subnet</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q4" value="c" class="radio radio-sm radio-secondary"> The Pi's Wi-Fi interface is saturated by other traffic on the building network</label>
      </div>

      <!-- Challenge -->
      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-base">🎯 Challenge — verify the data path is live</p>
        <p class="text-sm text-base-content/80">Open <a href="#" data-page="edge-device" class="link link-warning">Edge Device</a> and <a href="#" data-page="admin" class="link link-warning">Connection Diagnostics</a>. Tick each item when confirmed.</p>
        <div class="space-y-2 text-sm">
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">The WS message counter on Worksheet 1 increments at approximately <strong>2 messages per second</strong></span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text"><strong>Mosquitto</strong> is shown as active on the Edge Device page</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">The circuit breaker on Connection Diagnostics is <strong>closed</strong> (green)</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Round-trip latency is below <strong>200 ms</strong> on the Connection Diagnostics latency graph</span>
          </label>
        </div>
      </div>

      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="cp2-ws1-suggested">Show suggested answers</button>
      <div id="cp2-ws1-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: a — MQTT push/subscribe means the AL1350 sends data immediately without the Pi polling each cycle; HTTP adds per-request overhead. Q2: c — ensure_mqtt_subscription() registers the push subscription on every backend startup. Q3: a — live data stops when the backend crashes and the WebSocket disconnects. Q4: b — high latency points to AL1350 load or subnet congestion.</div>
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
    prerequisites: 'Complete CP0002 Worksheet 1',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">Process data (PDin) arrives as a raw byte string from the AL1350. The backend's <code class="font-mono text-xs bg-base-300 px-1 rounded">decoder.py</code> parses each device type differently based on its IODD specification.</p>

      <!-- PDin decode pipeline diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">PDin decode pipeline — raw hex → human value</p>
        <svg viewBox="0 0 570 210" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <defs>
            <marker id="ws3-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8"/></marker>
          </defs>
          <text x="70" y="18" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">RAW PDin (hex)</text>
          <text x="285" y="18" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">decoder.py</text>
          <text x="490" y="18" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">DECODED VALUE</text>
          <!-- Row 1: Proximity -->
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
          <!-- Row 2: Capacitive -->
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
          <!-- Row 3: Temperature -->
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
          <!-- Row 4: CL50 -->
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

      <div class="space-y-4 mt-3">

        <div class="rounded-lg border border-base-300 bg-base-200 p-4">
          <p class="font-semibold text-base-content">Port 1 — Proximity Sensor (OMRON E2E-X16MB1T12, IO-Link V1.1)</p>
          <p class="text-base-content/80 text-sm mt-1">PDin is 2 bytes (16-bit). Bit 0 of byte 0 = switching output (object present: 1, absent: 0). Bit 4 = instability alarm. Bit 5 = over-approach alarm (target too close). Byte 1 = monitor output. Full ISDU access — output logic, timer mode, and diagnosis mode are all writable over IO-Link.</p>
          <p class="mt-2 font-medium text-base-content text-sm"><strong>Q:</strong> If the raw PDin hex is <code class="font-mono bg-base-300 px-1 rounded">0x01</code>, what is the switching output state?</p>
          <div class="space-y-1 mt-1" data-correct="a">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q1" value="a" class="radio radio-xs radio-secondary"> Object detected (bit 0 = 1)</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q1" value="b" class="radio radio-xs radio-secondary"> No object detected</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q1" value="c" class="radio radio-xs radio-secondary"> Sensor fault</label>
          </div>
        </div>

        <div class="rounded-lg border border-base-300 bg-base-200 p-4">
          <p class="font-semibold text-base-content">Port 2 — Capacitive Sensor</p>
          <p class="text-base-content/80 text-sm mt-1">PDin carries the switching output (bit 0) and optionally a detection count (increments on each rising edge). The backend accumulates the count in a session counter displayed on the Dashboard.</p>
          <p class="mt-2 font-medium text-base-content text-sm"><strong>Q:</strong> Why is a detection count more useful than just the current switching state for a capacitive level sensor on a filling line?</p>
          <div class="space-y-1 mt-1" data-correct="c">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q2" value="a" class="radio radio-xs radio-secondary"> It gives a continuous analogue level reading rather than a binary on/off output</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q2" value="b" class="radio radio-xs radio-secondary"> It prevents false positives caused by water or foam near the sensor face</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q2" value="c" class="radio radio-xs radio-secondary"> A running count tracks how many containers have been filled without a separate counter sensor</label>
          </div>
        </div>

        <div class="rounded-lg border border-base-300 bg-base-200 p-4">
          <p class="font-semibold text-base-content">Port 3 — Temperature Sensor (IFM TV7105)</p>
          <p class="text-base-content/80 text-sm mt-1">PDin is 4 bytes. Bytes 0–1 = temperature as a signed 16-bit integer in units of 0.1 °C. Bytes 2–3 carry status bits (SP1, SP2 switching outputs, alarm flags). Decoder divides by 10 to get °C.</p>
          <div class="font-mono text-xs bg-base-300 rounded p-2 mt-2">
            raw = 0x00F5  → 245 → 245 / 10 = <strong>24.5 °C</strong>
          </div>
          <p class="mt-2 font-medium text-base-content text-sm"><strong>Q:</strong> A raw PDin of <code class="font-mono bg-base-300 px-1 rounded">0x02EE</code> decodes to what temperature in °C? (0x02EE = 750 decimal; temperature = raw ÷ 10)</p>
          <div class="space-y-1 mt-1" data-correct="c">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q3" value="a" class="radio radio-xs radio-secondary"> 7.5 °C</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q3" value="b" class="radio radio-xs radio-secondary"> 750.0 °C</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q3" value="c" class="radio radio-xs radio-secondary"> 75.0 °C</label>
          </div>
        </div>

        <div class="rounded-lg border border-base-300 bg-base-200 p-4">
          <p class="font-semibold text-base-content">Port 4 — CL50 Light Stack</p>
          <p class="text-base-content/80 text-sm mt-1">The CL50 is a PDout-only device — it receives commands rather than sending sensor data. A 3-byte PDout payload controls colour, animation, intensity, and speed, with each field packed into specific bit positions. One incorrect bit changes the entire visual output.</p>
          <p class="mt-2 font-medium text-base-content text-sm"><strong>Q:</strong> Why does building a PDout command for the CL50 require more care than reading the proximity sensor's PDin?</p>
          <div class="space-y-1 mt-1" data-correct="a">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q4" value="a" class="radio radio-xs radio-secondary"> Multiple fields — colour, animation, intensity, and speed — must be packed into specific bit positions across 3 bytes. One wrong bit changes the entire behaviour</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q4" value="b" class="radio radio-xs radio-secondary"> It uses a completely different IO-Link variant that the standard binary decoder cannot process</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q4" value="c" class="radio radio-xs radio-secondary"> The CL50 PDin arrives as a plain text string rather than binary bytes</label>
          </div>
        </div>
      </div>

      <!-- Challenge -->
      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-base">🎯 Challenge — read live PDin from the Dashboard</p>
        <p class="text-sm text-base-content/80">Open the <a href="#" data-page="home" class="link link-warning">Dashboard</a> and expand the Active Port Details for each sensor. Tick each item when confirmed.</p>
        <div class="space-y-2 text-sm">
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Note the live temperature on Port 3 and manually calculate the equivalent raw hex (temp × 10 → decimal → hex)</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Hold a <strong>metal object</strong> (screwdriver, spanner) near the <strong>proximity sensor</strong> (Port 1) and confirm the switching state (OUT1) flips on the Dashboard — inductive sensors only detect metal</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Trigger the <strong>capacitive sensor</strong> (Port 2) and confirm the detection count increments in the Dashboard</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Identify the current <strong>CL50 colour state</strong> (Port 4) from the Dashboard and match it to what you can physically see on the light stack</span>
          </label>
        </div>
      </div>

      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="cp2-ws2-suggested">Show suggested answers</button>
      <div id="cp2-ws2-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1 (proximity): a — bit 0 = 1 means object present (metal target within sensing range). Q2 (capacitive): c — a running count tracks how many containers have been filled. Q3 (temperature): c — 0x02EE = 750 → 750/10 = 75.0 °C. Q4 (CL50): a — multiple fields (colour, animation, intensity, speed) must be packed into specific bit positions across 3 bytes; one wrong bit changes the entire behaviour.</div>
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
    prerequisites: 'Complete CP0002 Worksheets 1–2',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">Match the maintenance problem to the IO-Link feature that addresses it.</p>

      <!-- Standard vs IO-Link comparison diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">Maintenance response — Standard vs IO-Link</p>
        <svg viewBox="0 0 570 240" xmlns="http://www.w3.org/2000/svg" class="w-full" style="font-family:system-ui,sans-serif">
          <!-- Standard column -->
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
          <!-- IO-Link column -->
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
          <!-- Saves badge -->
          <rect x="238" y="105" width="94" height="28" rx="14" fill="#854d0e"/>
          <text x="285" y="116" text-anchor="middle" fill="#fde68a" font-size="9" font-weight="700">Saves ~27 min</text>
          <text x="285" y="127" text-anchor="middle" fill="#fcd34d" font-size="8">per fault event</text>
        </svg>
      </div>

      <div class="overflow-x-auto rounded-lg border border-base-300">
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

      <!-- Challenge -->
      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-base">🎯 Challenge — spot IO-Link features on the live system</p>
        <p class="text-sm text-base-content/80">Use the <a href="#" data-page="home" class="link link-warning">Dashboard</a> and <a href="#" data-page="io-link-master" class="link link-warning">IO-Link page</a>. Tick each item when confirmed.</p>
        <div class="space-y-2 text-sm">
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Find the <strong>device identity</strong> (vendor, product name) for Port 3 on the IO-Link page</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Locate where <strong>process data</strong> (live sensor values) appears on the Dashboard</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Find where <strong>event / diagnostic data</strong> would appear on the IO-Link page if a fault occurred</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Navigate to the <strong>parameter read/write panel</strong> for a Port 1.1 sensor and identify a writable parameter</span>
          </label>
        </div>
      </div>

      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="cp2-ws3-suggested">Show suggested answers</button>
      <div id="cp2-ws3-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: events — diagnostic events (lens dirty, wire break) warn before complete failure. Q2: params — parameter storage allows automatic re-configuration after sensor swap. Q3: events — device identity and per-port event codes pinpoint which sensor failed. Q4: events — cycle count and diagnostic trends enable predictive maintenance planning.</div>
    `
  },
  {
    id: 5,
    title: 'Decoding IO-Link Data',
    shortDesc: 'Read raw hex bytes, apply data types and scale factors.',
    estimatedTime: 'About 20 min',
    whyItMatters: 'Every ISDU read returns raw hex. Without knowing the data type and scale, the number is meaningless. This is the skill that makes parameter access useful rather than just possible.',
    prerequisites: 'CP0002 Worksheets 1–4',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed text-base">When you read a parameter via IO-Link acyclic access (ISDU), the device returns raw bytes in hexadecimal. This worksheet explains how to interpret those bytes — from hex digits to decimal to an engineering value with units.</p>

      <!-- Three components -->
      <div class="grid grid-cols-3 gap-2 mt-3">
        <div class="rounded-lg p-3 text-center space-y-1" style="background:#0f172a;border:1px solid #334155">
          <p class="text-xs font-bold" style="color:#3b82f6">Raw hex</p>
          <p class="font-mono font-bold text-lg" style="color:#f59e0b">01 F4</p>
          <p class="text-xs" style="color:#475569">Bytes from device</p>
        </div>
        <div class="rounded-lg p-3 text-center space-y-1" style="background:#0f172a;border:1px solid #334155">
          <p class="text-xs font-bold" style="color:#8b5cf6">Data type</p>
          <p class="font-mono font-bold text-lg" style="color:#a78bfa">int16</p>
          <p class="text-xs" style="color:#475569">How to interpret</p>
        </div>
        <div class="rounded-lg p-3 text-center space-y-1" style="background:#0f172a;border:1px solid #334155">
          <p class="text-xs font-bold" style="color:#22c55e">Scale factor</p>
          <p class="font-mono font-bold text-lg" style="color:#4ade80">×0.1</p>
          <p class="text-xs" style="color:#475569">Converts to °C</p>
        </div>
      </div>

      <!-- Hex digits -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-4 mt-4 space-y-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Part 1 — Hex digits (0–F)</p>
        <p class="text-sm text-base-content/80">Decimal counts 0–9 before rolling over. Hexadecimal counts 0–9, then uses the letters A–F for values 10–15, giving 16 symbols total (base 16):</p>
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
        <p class="text-sm text-base-content/80">A single byte is two hex digits. To convert one byte: <span class="font-semibold">left digit × 16 + right digit</span>.</p>
        <div class="rounded-lg px-4 py-3 text-sm font-mono" style="background:#0f172a;border:1px solid #334155;color:#94a3b8">
          Example: <span style="color:#f59e0b;font-weight:700">F4</span> → F=15, so  15 × 16 + 4 = 240 + 4 = <span style="color:#22c55e;font-weight:700">244</span>
        </div>
      </div>

      <!-- Two-byte values -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-4 mt-3 space-y-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Part 2 — Two-byte (16-bit) values</p>
        <p class="text-sm text-base-content/80">Many parameters return two bytes. The first (high) byte is worth 256× the second (low) byte. Write all four hex digits together and apply positional values:</p>
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
        <p class="text-sm text-base-content/80">Then apply the scale: 500 × 0.1 = <span class="font-bold text-success">50.0 °C</span>.</p>
      </div>

      <!-- Data types -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-4 mt-3 space-y-3">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Part 3 — Data types</p>
        <p class="text-sm text-base-content/80">The IODD file specifies the dtype for each parameter. This tells you how many bytes to read and whether the value can be negative:</p>
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
                <td class="px-3 py-2">1</td>
                <td class="px-3 py-2">0–255</td>
                <td class="px-3 py-2" style="font-family:inherit">Output logic (NO=0, NC=1), teach commands</td>
              </tr>
              <tr style="border-top:1px solid #1e293b">
                <td class="px-3 py-2 font-bold" style="color:#8b5cf6">uint16</td>
                <td class="px-3 py-2">2</td>
                <td class="px-3 py-2">0–65535</td>
                <td class="px-3 py-2" style="font-family:inherit">Capacitive SP1 (raw count, always positive)</td>
              </tr>
              <tr style="border-top:1px solid #1e293b">
                <td class="px-3 py-2 font-bold" style="color:#f97316">int16</td>
                <td class="px-3 py-2">2</td>
                <td class="px-3 py-2">−32768 to +32767</td>
                <td class="px-3 py-2" style="font-family:inherit">Temperature SP1/RP1 and calibration offset</td>
              </tr>
              <tr style="border-top:1px solid #1e293b">
                <td class="px-3 py-2 font-bold" style="color:#22c55e">int32</td>
                <td class="px-3 py-2">4</td>
                <td class="px-3 py-2">±2 billion</td>
                <td class="px-3 py-2" style="font-family:inherit">Photoelectric SP1 (wide sensing range)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-sm text-base-content/80">Negative int16 values use two's complement encoding — covered in detail in Worksheet 10 alongside the PT100 sensor.</p>
      </div>

      <!-- Scale factors -->
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

      <!-- Practice -->
      <div class="rounded-xl border-2 border-secondary/30 bg-secondary/5 p-4 mt-3 space-y-4">
        <p class="text-xs font-semibold text-secondary uppercase tracking-wide">Practice Exercises</p>
        <div class="space-y-1">
          <p class="text-sm font-semibold text-base-content">Q1 — An ISDU read of TV7105 RP1 (Index 584, Sub 0) returns <span class="font-mono font-bold">00 E6</span>. dtype = int16, scale = ×0.1. What is RP1 in °C?</p>
          <p class="text-xs text-base-content/60">Hint: E = 14 in decimal.</p>
        </div>
        <div class="space-y-1">
          <p class="text-sm font-semibold text-base-content">Q2 — A capacitive sensor returns <span class="font-mono font-bold">00 64</span> for SP1 (uint16, no scale). What is the setpoint count?</p>
          <p class="text-xs text-base-content/60">Hint: 6 × 16 + 4 = ?</p>
        </div>
        <div class="space-y-1">
          <p class="text-sm font-semibold text-base-content">Q3 — The TV7105 SP1 returns <span class="font-mono font-bold">01 F4</span> (int16, ×0.1). Show your full working to find the setpoint in °C.</p>
        </div>
        <div class="divider my-2"></div>
        <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="cp2-decode-suggested">Show suggested answers</button>
        <div id="cp2-decode-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">
          Q1: 00 E6 → 0 + 0 + (14×16) + 6 = 224 + 6 = 230. Then 230 × 0.1 = 23.0 °C.<br><br>
          Q2: 00 64 → 0 + 0 + (6×16) + 4 = 96 + 4 = 100. Scale = ×1 so SP1 = 100 counts.<br><br>
          Q3: 01 F4 → (0×4096) + (1×256) + (15×16) + 4 = 0 + 256 + 240 + 4 = 500. Then 500 × 0.1 = 50.0 °C.
        </div>
      </div>
    `
  },
  {
    id: 6,
    title: 'Diagnostics: Process, Service, and Event Data',
    shortDesc: 'Classify IO-Link data types and where they go.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'Routing the right data to the right destination — PLC scan cycle, historian, CMMS — is a core system integration task. Misclassifying data types leads to missed faults or overloaded controllers.',
    relatedLearn: '',
    relatedDashboard: 'Dashboard: Port Details, Events',
    prerequisites: 'Complete CP0002 Worksheets 1–3',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">Classify each item below, then answer the routing question.</p>

      <!-- IO-Link data types and routing diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mt-3">
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

      <div class="overflow-x-auto rounded-lg border border-base-300">
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

      <p class="mt-4 font-medium text-base-content"><strong>Q2.</strong> In this app, which data type does the WebSocket stream deliver to the browser on every tick?</p>
      <div class="space-y-2" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws4-q2" value="a" class="radio radio-sm radio-secondary"> Process data (sensor values) + event data (faults/warnings) merged into a single JSON payload</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws4-q2" value="b" class="radio radio-sm radio-secondary"> Service data only (parameters)</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws4-q2" value="c" class="radio radio-sm radio-secondary"> Raw binary PDin only</label>
      </div>

      <!-- Challenge -->
      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-base">🎯 Challenge — classify live data from the system</p>
        <p class="text-sm text-base-content/80">Explore the <a href="#" data-page="home" class="link link-warning">Dashboard</a> and <a href="#" data-page="io-link-master" class="link link-warning">IO-Link page</a>. Tick each item when confirmed.</p>
        <div class="space-y-2 text-sm">
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Name <strong>three process data values</strong> visible on the Dashboard (e.g. temperature, detected state, detection count)</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Identify which page in this app provides access to <strong>service data</strong> (parameter read/write)</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Locate where <strong>event data</strong> (faults and warnings) would appear in the IO-Link page</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Confirm the WebSocket stream on Worksheet 1 is delivering <strong>merged process + event data</strong> (not service data) on every tick</span>
          </label>
        </div>
      </div>

      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="cp2-ws4-suggested">Show suggested answers</button>
      <div id="cp2-ws4-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Classification: Temperature 23.5°C = Process; Device replacement = Event; Filter time parameter = Service; Object present flag = Process; Short circuit fault = Event. Q2: a — WebSocket delivers process data + event data merged into one JSON payload each tick; service data is only read on demand via separate ISDU calls.</div>
    `
  },
  {
    id: 7,
    title: 'PLC and HMI Integration',
    shortDesc: 'Mapping IO-Link data into control systems.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'IO-Link data doesn\'t automatically appear in a PLC — it must be mapped through the master\'s process data image. Understanding this mapping is essential for commissioning and for designing HMI alarm screens.',
    relatedLearn: '',
    relatedDashboard: 'Dashboard: Port Status, Simulate Fault',
    prerequisites: 'Complete CP0002 Worksheets 1–4',
    contentHtml: `
      <!-- PLC vs app architecture comparison diagram -->
      <div class="rounded-xl border border-base-300 bg-base-200 p-3 mb-4">
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
          <text x="175" y="108" text-anchor="middle" fill="#f59e0b" font-size="7">≡ master maps PDin</text>
          <text x="300" y="108" text-anchor="middle" fill="#f59e0b" font-size="7">≡ fieldbus transport</text>
          <text x="425" y="108" text-anchor="middle" fill="#f59e0b" font-size="7">≡ PLC scan / decode</text>
          <text x="534" y="108" text-anchor="middle" fill="#f59e0b" font-size="7">≡ HMI display</text>
        </svg>
      </div>

      <p class="text-base-content/90 leading-relaxed"><strong>1.</strong> How does IO-Link process data from a sensor reach a PLC I/O scan cycle?</p>
      <div class="space-y-2 mt-1" data-correct="c">
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

      <p class="mt-3 font-medium text-base-content"><strong>3.</strong> What is the key advantage of a web HMI like this app over walking to the machine?</p>
      <div class="space-y-2 mt-1" data-correct="c">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws5-q3" value="a" class="radio radio-sm radio-secondary"> Walking to the machine is always preferred because it provides a physical inspection opportunity that remote tools cannot replicate</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws5-q3" value="b" class="radio radio-sm radio-secondary"> A web HMI only functions when the machine has a stable internet connection</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws5-q3" value="c" class="radio radio-sm radio-secondary"> Faster fault identification, multi-machine monitoring, and historical trends without a site visit</label>
      </div>

      <div class="alert bg-secondary/10 border border-secondary/30 rounded-lg text-base-content mt-3">
        <strong>Do this:</strong> Open <a href="#" data-page="admin" class="link link-secondary">Connection Diagnostics</a>. The latency graph shows round-trip time to the AL1350 over HTTP. What does a spike in this graph tell you about the health of the IO-Link network?
      </div>
      <div class="space-y-2 mt-2" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws5-q4" value="a" class="radio radio-sm radio-secondary"> High latency on the IO-Link subnet or the AL1350 being overloaded</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws5-q4" value="b" class="radio radio-sm radio-secondary"> The dashboard browser tab is consuming too much memory and slowing the chart rendering</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws5-q4" value="c" class="radio radio-sm radio-secondary"> The Pi's MQTT broker has stopped forwarding messages and is queueing them internally until the buffer limit is reached</label>
      </div>

      <!-- Challenge -->
      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-base">🎯 Challenge — trace the data path end to end</p>
        <p class="text-sm text-base-content/80">Use the <a href="#" data-page="home" class="link link-warning">Dashboard</a>, <a href="#" data-page="admin" class="link link-warning">Connection Diagnostics</a> and <a href="#" data-page="edge-device" class="link link-warning">Edge Device</a> pages. Tick each item when confirmed.</p>
        <div class="space-y-2 text-sm">
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Note the current <strong>temperature reading</strong> on Port 3 from the Dashboard</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Confirm the data path: <strong>AL1350 → Mosquitto → FastAPI → decoder.py → WebSocket → Browser</strong> — each layer is visible in this app</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Confirm the <strong>HTTP fallback path</strong> is also visible on the Connection Diagnostics latency graph</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">On the Edge Device page, confirm <strong>FastAPI</strong> and <strong>Mosquitto</strong> are both shown as active services</span>
          </label>
        </div>
      </div>

      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="cp2-ws5-suggested">Show suggested answers</button>
      <div id="cp2-ws5-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: c — the IO-Link master maps PDin into its process image; the PLC reads this via fieldbus each scan cycle. Q2: io_link_fastapi.py (MQTT subscription, rows 1 and 3); decoder.py (PDin decode, row 2). Q3: c — faster fault identification, multi-machine monitoring, and trend history. Latency spike: a — points to IO-Link subnet congestion or AL1350 load.</div>
    `
  },
  {
    id: 8,
    title: 'Case Study — Standard vs IO-Link: The Numbers',
    shortDesc: 'MTTR calculation and business case.',
    estimatedTime: 'About 20 min',
    whyItMatters: 'Quantifying the MTTR reduction and uptime gain is how you justify IO-Link investment to management. This worksheet walks through a realistic calculation.',
    relatedLearn: '',
    relatedDashboard: 'Dashboard: Simulate Fault, Active Port Details',
    prerequisites: 'Complete CP0002 Worksheets 1–5',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed"><strong class="text-base-content">Scenario:</strong> A production line has 40 sensors. On average, each sensor causes one fault per year. With standard sensors, locating and reconfiguring after a fault takes 35 minutes. With IO-Link, the HMI identifies the port and fault type instantly, and parameters are restored automatically — total time: 8 minutes.</p>

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

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> Using the scenario figures, what is the annual downtime saving when switching to IO-Link? (Standard: 40 × 35 min = 1,400 min = 23.3 h; IO-Link: 40 × 8 min = 320 min = 5.3 h)</p>
      <div class="space-y-2 mt-1" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q1" value="a" class="radio radio-sm radio-secondary"> 18 hours per year</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q1" value="b" class="radio radio-sm radio-secondary"> 5.3 hours per year</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q1" value="c" class="radio radio-sm radio-secondary"> 23.3 hours per year</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> If the production line generates £5,000 of value per hour, what is the annual financial saving from IO-Link? (Saving = 18 hours × £5,000)</p>
      <div class="space-y-2 mt-1" data-correct="c">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q2" value="a" class="radio radio-sm radio-secondary"> £175,000</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q2" value="b" class="radio radio-sm radio-secondary"> £26,500</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q2" value="c" class="radio radio-sm radio-secondary"> £90,000</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> Beyond MTTR, which pair of benefits contributes most to lower total cost of ownership for IO-Link sensors?</p>
      <div class="space-y-2 mt-1" data-correct="b">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q3" value="a" class="radio radio-sm radio-secondary"> Built-in wireless backup channel that activates on master power loss, and automatic IP address provisioning for all sensors</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q3" value="b" class="radio radio-sm radio-secondary"> Automatic parameter restore on sensor swap and remote diagnostics via the HMI</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q3" value="c" class="radio radio-sm radio-secondary"> Lower per-unit sensor cost due to IO-Link certification subsidising manufacturing overheads across the supply chain</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q4.</strong> In this app's architecture, which data would you export to a CMMS (Computerised Maintenance Management System) to automate maintenance work orders?</p>
      <div class="space-y-2" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q4" value="a" class="radio radio-sm radio-secondary"> Event data (faults and warnings) — these are the triggers for maintenance actions</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q4" value="b" class="radio radio-sm radio-secondary"> Only process data (sensor values)</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q4" value="c" class="radio radio-sm radio-secondary"> Service data only (parameters)</label>
      </div>

      <!-- Challenge -->
      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-base">🎯 Challenge — complete the business case calculation</p>
        <p class="text-sm text-base-content/80">Use the calculation table above and the scenario figures. Tick each item when you have verified the answer.</p>
        <div class="space-y-2 text-sm">
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Fill in the calculation table above — verify: <strong>Standard = 23.3 h/year</strong>, IO-Link = 5.3 h/year</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Confirm the annual saving is <strong>18 hours</strong> (23.3 h − 5.3 h = 18 h) and that this matches the bar chart above</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Scale to 200 sensors: calculate annual downtime hours saved (200 sensors × 1 fault × 27 min saving ÷ 60 = <strong>90 h/year</strong>)</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Calculate the financial saving for 200 sensors at £5,000/hour production value: 90 h × £5,000 = <strong>£450,000/year</strong></span>
          </label>
        </div>
      </div>

      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="cp2-ws6-suggested">Show suggested answers</button>
      <div id="cp2-ws6-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: a — Standard: 40×35=1,400 min=23.3 h. IO-Link: 40×8=320 min=5.3 h. Saving = 18 h/year. Q2: c — 18 × £5,000 = £90,000/year. Q3: b — automatic parameter restore (no re-commissioning cost) and remote diagnostics (no site visit needed). Q4: a — event data (faults and warnings) triggers maintenance work orders.</div>
    `
  },
  {
    id: 9,
    title: 'Device Identity — Vendor ID, Device ID &amp; PDin',
    shortDesc: 'Identify an unknown sensor using IO-Link device identity fields.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'Physical labels wear off. Maintenance records go missing. The Vendor ID and Device ID embedded in every IO-Link sensor mean you can always confirm what is connected, order the exact right spare, and decode PDin correctly — without leaving the dashboard.',
    relatedDashboard: 'IO-Link Master page — Port Status cards',
    prerequisites: 'CP0001 Chapter 8 recommended',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed text-base"><strong class="text-base-content">Scenario:</strong> During a planned shutdown a technician discovers that the physical label on the sensor connected to Port 1 has completely worn away. There is no maintenance record for this port. Before ordering a spare and signing off the job, you must positively identify the device using the app — without touching the physical unit.</p>

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

      <!-- Questions -->
      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> Open the <a href="#" data-page="io-link-master" class="link link-secondary">IO-Link Master page</a>. What Vendor ID does Port 1 report?</p>
      <div class="space-y-2 mt-1" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q1" value="a" class="radio radio-sm radio-secondary"> 612</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q1" value="b" class="radio radio-sm radio-secondary"> 310</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q1" value="c" class="radio radio-sm radio-secondary"> 1586</label>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q2.</strong> The IO-Link Master page shows the Vendor ID resolved to a company name. Which manufacturer does Vendor ID 612 identify?</p>
      <div class="space-y-2 mt-1" data-correct="b">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q2" value="a" class="radio radio-sm radio-secondary"> ifm electronic</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q2" value="b" class="radio radio-sm radio-secondary"> OMRON Corporation</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q2" value="c" class="radio radio-sm radio-secondary"> Balluff</label>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q3.</strong> Port 1 also reports Device ID 131090, which the app resolves to <strong>E2E-X16MB1T12 Proximity</strong>. Why does knowing the Device ID matter when ordering a spare?</p>
      <div class="space-y-2 mt-1" data-correct="c">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q3" value="a" class="radio radio-sm radio-secondary"> The master uses it to set the sensor's IP address on the IO-Link network</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q3" value="b" class="radio radio-sm radio-secondary"> It shows the sensor's remaining service life in hours</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q3" value="c" class="radio radio-sm radio-secondary"> It uniquely identifies the exact model, so you order the right part first time and the master can restore parameters automatically after swap</label>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q4.</strong> Port 1 currently shows PDin hex <code class="font-mono bg-base-200 px-1 rounded text-sm">5000</code>. The first byte is <code class="font-mono bg-base-200 px-1 rounded text-sm">50</code> (binary 0101 0000). Bit 4 being set indicates the instability alarm is active. What is the correct maintenance response?</p>
      <div class="space-y-2 mt-1" data-correct="a">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q4" value="a" class="radio radio-sm radio-secondary"> Check sensor alignment — the target is likely at the edge of the sensing range</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q4" value="b" class="radio radio-sm radio-secondary"> No action — an instability alarm means the sensor passed its self-test</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws7-q4" value="c" class="radio radio-sm radio-secondary"> Replace the sensor immediately — bit 4 means a permanent hardware fault</label>
      </div>

      <p class="mt-4 font-medium text-base-content"><strong>Q5.</strong> A sensor with a worn label is found on Port 2. The app shows Vendor ID 1586 and Device ID 1052673. Which spare should you order?</p>
      <div class="space-y-2 mt-1" data-correct="c">
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

      <!-- Challenge -->
      <div class="rounded-xl border-2 border-warning/50 bg-warning/5 p-4 mt-4 space-y-3">
        <p class="font-bold text-base-content text-base">🎯 Challenge — positively identify all connected sensors</p>
        <p class="text-sm text-base-content/80">Using the <a href="#" data-page="io-link-master" class="link link-warning">IO-Link Master page</a>, complete the identification task for every active port and record the findings. Tick each item when confirmed.</p>
        <div class="space-y-2 text-sm">
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">On the IO-Link Master page, note the <strong>Vendor ID and resolved company name</strong> for Port 1, Port 2, and Port 3</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Confirm the <strong>Device ID and model name</strong> for each port — verify they match the hardware on the bench</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Read the live <strong>PDin hex</strong> for Port 3 (temperature sensor) and decode the first two bytes into a °C value using the formula: int16 ÷ 10</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Check Port 1's PDin first byte — if bit 4 is set, <strong>investigate sensor alignment</strong> before signing off the job</span>
          </label>
          <label class="cp2-kit-item flex items-center gap-3 cursor-pointer rounded-xl border-2 border-transparent px-3 py-2 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-warning flex-shrink-0">
            <span class="cp2-kit-text">Record the Vendor ID, Device ID, and current PDin for each port in a maintenance log entry — this is the IO-Link equivalent of a physical inspection report</span>
          </label>
        </div>
      </div>

      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="cp2-ws7-suggested">Show suggested answers</button>
      <div id="cp2-ws7-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: a — Vendor ID 612 is shown on the Port 1 card on the IO-Link Master page. Q2: b — 612 is registered to OMRON Corporation in the IO-Link Community vendor table. Q3: c — the Device ID uniquely identifies the model; the master can use it to restore IODD parameters automatically after a swap. Q4: a — instability alarm means the target is at the sensing range boundary; adjust alignment before considering replacement. Q5: c — Vendor 1586 (RS Pro) Device 1052673 = the M18 capacitive sensor (Carlo Gavazzi OEM, RS Pro part 2377240).</div>
    `
  },
  {
    id: 10,
    title: 'PT100 Temperature Sensors — From Resistance to Process Data',
    shortDesc: 'Physics, PDin encoding, hex decode calculations, and calibration offset engineering.',
    estimatedTime: 'About 25 min',
    whyItMatters: 'Understanding how the PT100 element works — and how the sensor encodes its reading into IO-Link PDin — lets you decode raw data without a datasheet, calculate expected resistance values to fault-find wiring, and properly engineer calibration offset corrections rather than guessing.',
    relatedDashboard: 'CP0001 Worksheet 5 — Temperature Sensor',
    prerequisites: 'CP0001 Worksheet 5 recommended',
    contentHtml: `
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

      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="cp2-ws9-answers">Show calculation reference</button>
      <div id="cp2-ws9-answers" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">
        <p><strong>Resistance at 25 °C:</strong> 100 × (1 + 0.00385 × 25) = 100 × 1.09625 = 109.625 Ω ≈ 109.6 Ω</p>
        <p class="mt-1"><strong>Exercise 1 (0x012C):</strong> 0x01 = 1, 0x2C = 44 → (1×256)+44 = 300 → 300÷10 = 30.0 °C</p>
        <p class="mt-1"><strong>Exercise 2 (0x0196):</strong> 0x01 = 1, 0x96 = 150 → (1×256)+150 = 406 → 406÷10 = 40.6 °C</p>
        <p class="mt-1"><strong>Exercise 3 (0xFF9C):</strong> 0xFF9C = 65436 unsigned. Since &gt;32767, subtract 65536: 65436−65536 = −100 → −100÷10 = −10.0 °C</p>
        <p class="mt-1"><strong>Exercise 4 (0xFE70):</strong> 0xFE70 = 65136 unsigned → 65136−65536 = −400 → −400÷10 = −40.0 °C — the open-circuit default.</p>
        <p class="mt-1"><strong>Calibration offset raw encode:</strong> −3.0 °C → −3.0×10 = −30 → two's complement 16-bit: 65536−30 = 65506 = 0xFFE2</p>
      </div>
    `
  },
  {
    id: 11,
    title: 'CL50 Pro — PDout Encoding Deep-Dive',
    shortDesc: 'How the 3-byte PDout hex is structured, what every bit field means, and how to decode or build any CL50 command by hand.',
    estimatedTime: 'About 20 min',
    whyItMatters: 'The CL50 exposes all its state in 24 bits. Once you can read and write those bits directly you can control any IO-Link output device — the encoding pattern repeats across all PDout-capable devices. It also prepares you for PLC integration, where you write these values in ladder logic or structured text rather than through a UI.',
    relatedDashboard: 'CP0001 Worksheet 6 — CL50 Light Stack',
    prerequisites: 'CP0001 Worksheet 6 required',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed text-base">In CP0001 Worksheet 6 the dropdown menus and preset buttons built the PDout hex for you. This worksheet tears that three-byte value apart — bit by bit — so you can decode any CL50 state you see on the dashboard and calculate the correct command for any light configuration by hand.</p>

      <!-- What PDout is -->
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

        <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="cp2-ws10-decode-answers">Show decode answers</button>
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

        <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="cp2-ws10-encode-answers">Show encode answers</button>
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
        <p class="text-base-content/80">CL50 firmware v1.0.2 does not execute PDout animation=4. The AL1350 accepts the write without error but the light simply holds steady at the specified C1I intensity — it does not sweep. The HMI works around this by running a software loop in the backend that rapidly steps through intensity values (High → Medium → Low → Medium → High) using animation=1 (Steady). This produces the breathing effect you see when pressing the "Green Pulse" button in CP0001 Worksheet 6. If you calculate a hex with animation=4 (e.g. <code class="font-mono bg-base-300 px-1 rounded">180401</code>) and write it directly to the AL1350, the light will turn on steady — not sweep.</p>
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
        <span class="badge badge-secondary badge-outline font-mono text-xs shrink-0">CP0002</span>
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
      <footer class="relative pt-4 border-t-2 border-base-300 flex flex-wrap gap-2">
        <a href="#" data-page="io-link-master" class="btn btn-outline btn-sm gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Dashboard
        </a>
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
  const root = document.getElementById('cp0002-root');
  if (!root) return;
  root.innerHTML = buildIndexHtml();
  scrollToTop();
}

function showWorksheet(n) {
  if (n < 1 || n > TOTAL) return;
  currentWorksheetIndex = n;
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
  });
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

function initWorksheetInteractivity(container) {
  if (!container) container = document.getElementById('cp0002-root');
  if (!container) return;
  container.querySelectorAll('.ws-suggested-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = btn.getAttribute('data-target');
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden');
    });
  });
  if (container.querySelector('.cp2-kit-item')) initCp2KitChecklist(container);
  if (container.querySelector('#cp2-sys-panel')) initLiveCp2Intro(container);
  if (container.querySelector('#cp2-ws9-live-panel')) initLiveCp2Ws9(container);

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
