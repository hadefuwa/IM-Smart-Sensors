/**
 * CP0002: Industry 4.0 IO-Link
 * 7 worksheets — engineering level: system brief, architecture, protocol, integration, business case.
 * Audience: engineers, system integrators, HNC/degree students.
 * Prerequisite: CP0001 recommended.
 */

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
      <p class="text-base-content/90 leading-relaxed">The system in front of you is a complete Industry 4.0 sensor stack. Read the technical brief below, then complete the questions using the live data panel.</p>

      <!-- Hardware table -->
      <div class="overflow-x-auto rounded-lg border border-base-300 mt-4">
        <table class="table table-zebra text-sm">
          <thead><tr><th>Component</th><th>Model / Role</th><th>IP Address</th><th>Interface</th></tr></thead>
          <tbody>
            <tr><td class="font-semibold">IO-Link Master</td><td>IFM AL1350 — reads sensors, publishes MQTT</td><td class="font-mono">192.168.7.4</td><td>HTTP REST + MQTT publish</td></tr>
            <tr><td class="font-semibold">Edge Gateway</td><td>Raspberry Pi — MQTT broker + FastAPI + WebSocket server</td><td class="font-mono">192.168.7.2</td><td>Ethernet (IO-Link subnet) + Wi-Fi (LAN)</td></tr>
            <tr><td class="font-semibold">This Dashboard</td><td>Vite SPA — receives WebSocket JSON, renders live UI</td><td class="font-mono">—</td><td>WebSocket /ws</td></tr>
            <tr><td class="font-semibold">Port 1 Sensor</td><td>Contrinex LTR-M18PA-PMS-603 — diffuse photoelectric, IO-Link 1.0 (identity only via ISDU)</td><td class="font-mono">—</td><td>IO-Link (3-wire, M12)</td></tr>
            <tr><td class="font-semibold">Port 2 Sensor</td><td>Capacitive — detects material by dielectric change</td><td class="font-mono">—</td><td>IO-Link (3-wire, M12)</td></tr>
            <tr><td class="font-semibold">Port 3 Sensor</td><td>IFM TV7105 — temperature, ±0.1 °C IO-Link PDin</td><td class="font-mono">—</td><td>IO-Link (3-wire, M12)</td></tr>
            <tr><td class="font-semibold">Port 4 Sensor</td><td>IFM CL50 — multi-colour status light stack</td><td class="font-mono">—</td><td>IO-Link (3-wire, M12)</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Network topology -->
      <div class="rounded-xl border-2 border-base-300 bg-base-200 p-4 mt-4 font-mono text-xs leading-relaxed overflow-x-auto">
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
      <div class="rounded-xl border-2 border-secondary/30 bg-secondary/5 p-4 mt-4 space-y-3" id="cp2-sys-panel">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="font-bold text-base-content text-sm">Live System Status</span>
          <span id="cp2-sys-badge" class="badge badge-xs badge-ghost font-mono">OFFLINE</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 text-center space-y-1">
            <p class="text-xs text-base-content/50">AL1350</p>
            <div id="cp2-master-dot" class="w-5 h-5 rounded-full bg-base-300 mx-auto transition-all"></div>
            <p id="cp2-master-label" class="text-xs font-bold text-base-content">—</p>
          </div>
          <div class="rounded-lg bg-base-200 border border-base-300 p-3 text-center space-y-1">
            <p class="text-xs text-base-content/50">Active IO-Link ports</p>
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

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> From the hardware table, what is the IP address of the AL1350 IO-Link Master?</p>
      <textarea class="textarea textarea-bordered w-full" rows="1" placeholder="Your answer..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> The live panel shows a WebSocket message counter. Watch it for 10 seconds — roughly how many messages arrive per second? What does this tell you about the MQTT publish rate?</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> The Raspberry Pi has two network interfaces (eth0 and wlan0). Why does this matter for the system architecture?</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>Q4.</strong> How many IO-Link ports are currently showing as active? Open the <a href="#" data-page="admin" class="link link-secondary">Connection Diagnostics</a> page. Is the circuit breaker closed (healthy)?</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>
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
        <p class="ml-4">├─ Decodes sensor PDin (temperature, photoelectric state, capacitive count, CL50 LED)</p>
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
      <textarea class="textarea textarea-bordered w-full" rows="3" placeholder="Your answer..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> The AL1350 loses its MQTT subscriptions when it power-cycles. How does the backend handle this?</p>
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q2" value="a" class="radio radio-sm radio-secondary"> It waits for the user to manually re-subscribe</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q2" value="b" class="radio radio-sm radio-secondary"> It calls ensure_mqtt_subscription() on every backend startup, re-registering the push subscription automatically</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws1-q2" value="c" class="radio radio-sm radio-secondary"> It switches permanently to HTTP polling</label>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> Look at the <a href="#" data-page="edge-device" class="link link-secondary">Edge Device page</a>. What is the current CPU usage of the Pi, and is the backend service showing as active?</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your observation..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>Q4.</strong> Open <a href="#" data-page="admin" class="link link-secondary">Connection Diagnostics</a>. What is the current round-trip latency to the AL1350, and what does the circuit breaker status show?</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your observation..."></textarea>

      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="cp2-ws1-suggested">Show suggested answers</button>
      <div id="cp2-ws1-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: MQTT is publish/subscribe — the AL1350 pushes data as soon as it's ready without the client polling. HTTP polling adds overhead (one request per cycle), introduces latency, and can overload a constrained device like the AL1350 if poll rates are too high. Q2: b — ensure_mqtt_subscription() registers the subscription on every backend startup. Q3/Q4: live values depend on your hardware.</div>
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

      <div class="space-y-4 mt-3">

        <div class="rounded-lg border border-base-300 bg-base-200 p-4">
          <p class="font-semibold text-base-content">Port 1 — Photoelectric Sensor (Contrinex LTR-M18PA-PMS-603)</p>
          <p class="text-base-content/80 text-sm mt-1">PDin is 2 bytes. Bit 0 of byte 0 = switching output (object detected: 1, not detected: 0). Additional bits carry signal quality. Note: this sensor uses IO-Link 1.0 — only identity data (index 0) is accessible via ISDU; sensitivity is adjusted via the physical potentiometer on the sensor body.</p>
          <p class="mt-2 font-medium text-base-content text-sm"><strong>Q:</strong> If the raw PDin hex is <code class="font-mono bg-base-300 px-1 rounded">0x01</code>, what is the switching output state?</p>
          <div class="space-y-1 mt-1">
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q1" value="a" class="radio radio-xs radio-secondary"> No object detected</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q1" value="b" class="radio radio-xs radio-secondary"> Object detected (bit 0 = 1)</label>
            <label class="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="cp2-ws2-q1" value="c" class="radio radio-xs radio-secondary"> Sensor fault</label>
          </div>
        </div>

        <div class="rounded-lg border border-base-300 bg-base-200 p-4">
          <p class="font-semibold text-base-content">Port 2 — Capacitive Sensor</p>
          <p class="text-base-content/80 text-sm mt-1">PDin carries the switching output (bit 0) and optionally a detection count (increments on each rising edge). The backend accumulates the count in a session counter displayed on the Dashboard.</p>
          <p class="mt-2 font-medium text-base-content text-sm"><strong>Q:</strong> Why is a detection count more useful than just the current switching state for a capacitive level sensor on a filling line?</p>
          <textarea class="textarea textarea-bordered w-full textarea-sm" rows="2" placeholder="Your answer..."></textarea>
        </div>

        <div class="rounded-lg border border-base-300 bg-base-200 p-4">
          <p class="font-semibold text-base-content">Port 3 — Temperature Sensor (IFM TV7105)</p>
          <p class="text-base-content/80 text-sm mt-1">PDin is 4 bytes. Bytes 0–1 = temperature as a signed 16-bit integer in units of 0.1 °C. Bytes 2–3 carry status bits (SP1, SP2 switching outputs, alarm flags). Decoder divides by 10 to get °C.</p>
          <div class="font-mono text-xs bg-base-300 rounded p-2 mt-2">
            raw = 0x00F5  → 245 → 245 / 10 = <strong>24.5 °C</strong>
          </div>
          <p class="mt-2 font-medium text-base-content text-sm"><strong>Q:</strong> A raw PDin of <code class="font-mono bg-base-300 px-1 rounded">0x02EE</code> decodes to what temperature in °C?</p>
          <textarea class="textarea textarea-bordered w-full textarea-sm" rows="1" placeholder="Show your working..."></textarea>
        </div>

        <div class="rounded-lg border border-base-300 bg-base-200 p-4">
          <p class="font-semibold text-base-content">Port 4 — CL50 Light Stack</p>
          <p class="text-base-content/80 text-sm mt-1">The CL50 PDin encodes each colour segment's state (off / on / flash) across multiple bits. The backend's CL50 decoder maps bit fields to a human-readable state object: <code class="font-mono text-xs bg-base-300 px-1 rounded">&#123; red: 'flash', amber: 'off', green: 'on' &#125;</code>.</p>
          <p class="mt-2 font-medium text-base-content text-sm"><strong>Q:</strong> Why does the CL50 need a more complex decode than the photoelectric sensor?</p>
          <textarea class="textarea textarea-bordered w-full textarea-sm" rows="2" placeholder="Your answer..."></textarea>
        </div>
      </div>

      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="cp2-ws2-suggested">Show suggested answers</button>
      <div id="cp2-ws2-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: b — bit 0 = 1 means object detected. Capacitive count: you can track how many containers have been filled without a separate counter sensor. TV7105: 0x02EE = 750 decimal → 750/10 = 75.0 °C. CL50: it has multiple independent output channels (red, amber, green, each with on/flash/off states) so the PDin must encode several independent values rather than a single bit.</div>
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
    `
  },
  {
    id: 5,
    title: 'Diagnostics: Process, Service, and Event Data',
    shortDesc: 'Classify IO-Link data types and where they go.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'Routing the right data to the right destination — PLC scan cycle, historian, CMMS — is a core system integration task. Misclassifying data types leads to missed faults or overloaded controllers.',
    relatedLearn: '',
    relatedDashboard: 'Dashboard: Port Details, Events',
    prerequisites: 'Complete CP0002 Worksheets 1–3',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">Classify each item below, then answer the routing question.</p>
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
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws4-q2" value="a" class="radio radio-sm radio-secondary"> Service data only (parameters)</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws4-q2" value="b" class="radio radio-sm radio-secondary"> Process data (sensor values) + event data (faults/warnings) merged into a single JSON payload</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws4-q2" value="c" class="radio radio-sm radio-secondary"> Raw binary PDin only</label>
      </div>
    `
  },
  {
    id: 6,
    title: 'PLC and HMI Integration',
    shortDesc: 'Mapping IO-Link data into control systems.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'IO-Link data doesn\'t automatically appear in a PLC — it must be mapped through the master\'s process data image. Understanding this mapping is essential for commissioning and for designing HMI alarm screens.',
    relatedLearn: '',
    relatedDashboard: 'Dashboard: Port Status, Simulate Fault',
    prerequisites: 'Complete CP0002 Worksheets 1–4',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed"><strong>1.</strong> Describe how IO-Link process data from a sensor reaches a PLC I/O scan cycle.</p>
      <textarea class="textarea textarea-bordered w-full" rows="3" placeholder="Your answer..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>2.</strong> In this app, the backend acts as the "PLC equivalent" — it receives IO-Link data and exposes it to the browser. Which backend component is responsible for:</p>
      <div class="overflow-x-auto rounded-lg border border-base-300 mt-2">
        <table class="table table-sm">
          <thead><tr><th>Function</th><th>Backend component</th></tr></thead>
          <tbody>
            <tr><td>Subscribing to AL1350 MQTT topics</td><td><input class="input input-bordered input-sm w-full" placeholder="filename or function name..."></td></tr>
            <tr><td>Decoding raw PDin into °C / object state / CL50 colour</td><td><input class="input input-bordered input-sm w-full" placeholder="filename or function name..."></td></tr>
            <tr><td>Pushing decoded data to the browser</td><td><input class="input input-bordered input-sm w-full" placeholder="filename or function name..."></td></tr>
          </tbody>
        </table>
      </div>

      <p class="mt-3 font-medium text-base-content"><strong>3.</strong> What is the value of remote monitoring via a web HMI (like this app) compared to walking to the machine?</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>

      <div class="alert bg-secondary/10 border border-secondary/30 rounded-lg text-base-content mt-3">
        <strong>Do this:</strong> Open <a href="#" data-page="admin" class="link link-secondary">Connection Diagnostics</a>. The latency graph shows round-trip time to the AL1350 over HTTP. What does a spike in this graph tell you about the health of the IO-Link network?
      </div>
      <textarea class="textarea textarea-bordered w-full mt-2" rows="2" placeholder="Your observation..."></textarea>

      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="cp2-ws5-suggested">Show suggested answers</button>
      <div id="cp2-ws5-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: The IO-Link master maps each port's PDin into its process data image, which is then read by the PLC on each scan cycle (typically via PROFINET, EtherNet/IP, or EtherCAT). Q2: io_link_fastapi.py (MQTT subscription + WebSocket push); decoder.py (PDin decode). Q3: Faster fault identification, no need to travel to the machine, historical trend data, and the ability to monitor multiple machines from one screen.</div>
    `
  },
  {
    id: 7,
    title: 'Case Study — Standard vs IO-Link: The Numbers',
    shortDesc: 'MTTR calculation and business case.',
    estimatedTime: 'About 20 min',
    whyItMatters: 'Quantifying the MTTR reduction and uptime gain is how you justify IO-Link investment to management. This worksheet walks through a realistic calculation.',
    relatedLearn: '',
    relatedDashboard: 'Dashboard: Simulate Fault, Active Port Details',
    prerequisites: 'Complete CP0002 Worksheets 1–5',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed"><strong class="text-base-content">Scenario:</strong> A production line has 40 sensors. On average, each sensor causes one fault per year. With standard sensors, locating and reconfiguring after a fault takes 35 minutes. With IO-Link, the HMI identifies the port and fault type instantly, and parameters are restored automatically — total time: 8 minutes.</p>

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

      <p class="mt-4 font-medium text-base-content"><strong>Q1.</strong> Complete the table above. What is the annual downtime saving in hours?</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your working and answer..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>Q2.</strong> If the production line generates £5,000 of value per hour, what is the annual financial saving from IO-Link?</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>Q3.</strong> Beyond MTTR, name two other benefits of IO-Link that contribute to lower total cost of ownership (TCO).</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>

      <p class="mt-3 font-medium text-base-content"><strong>Q4.</strong> In this app's architecture, which data would you export to a CMMS (Computerised Maintenance Management System) to automate maintenance work orders?</p>
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q4" value="a" class="radio radio-sm radio-secondary"> Only process data (sensor values)</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q4" value="b" class="radio radio-sm radio-secondary"> Event data (faults and warnings) — these are the triggers for maintenance actions</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cp2-ws6-q4" value="c" class="radio radio-sm radio-secondary"> Service data only (parameters)</label>
      </div>

      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="cp2-ws6-suggested">Show suggested answers</button>
      <div id="cp2-ws6-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Q1: Standard: 40×35 = 1,400 min = 23.3 h. IO-Link: 40×8 = 320 min = 5.3 h. Saving: 18 hours/year. Q2: 18 × £5,000 = £90,000/year. Q3: Automatic parameter restore (no re-commissioning cost), predictive maintenance from trend data (avoids catastrophic failure), standardised wiring (reduced stock of cable types), remote diagnostics (no site visit needed). Q4: b — event data triggers work orders; process data trends support predictive scheduling.</div>
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
      <header class="relative rounded-2xl bg-gradient-to-r from-secondary/20 via-accent/15 to-primary/20 border-2 border-secondary/30 px-4 py-4 shadow-xl">
        <div class="flex items-center gap-3 flex-wrap">
          <div class="rounded-lg bg-secondary/25 p-2 border border-secondary/40">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-0.5">
              <span class="badge badge-secondary badge-outline font-mono text-xs">CP0002</span>
            </div>
            <h1 class="text-xl font-bold text-base-content tracking-tight">Industry 4.0 IO-Link</h1>
            <p class="text-base-content/80 text-sm">${TOTAL} engineering-level worksheets — architecture, protocol decoding, system integration, and business case.</p>
          </div>
        </div>
      </header>
      <div class="relative grid grid-cols-1 sm:grid-cols-2 gap-5">
        ${cards}
      </div>
      <footer class="relative pt-4 border-t-2 border-base-300 flex flex-wrap gap-2 items-center justify-between">
        <a href="#" data-page="io-link-master" class="btn btn-outline btn-sm gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Dashboard
        </a>
        <button type="button" class="btn btn-ghost btn-sm gap-2 cp2-print-btn">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Print
        </button>
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
          <button type="button" class="btn btn-ghost btn-sm cp2-print-btn">Print</button>
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
  if (container.querySelector('#cp2-sys-panel')) initLiveCp2Intro(container);

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
