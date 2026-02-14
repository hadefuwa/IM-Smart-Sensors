/**
 * IO-Link Master page for Matrix Template
 * Connects to FastAPI backend via WebSocket for real-time data.
 */

import Chart from 'chart.js/auto';

// API/WebSocket base – when using Vite dev server (e.g. 5173), point to FastAPI (8000)
const API_BASE = window.IO_LINK_API_BASE || 'http://localhost:8000';
const WS_BASE = API_BASE.replace(/^http/, 'ws');

export function renderIOLinkMaster() {
  const learnUrl = `${API_BASE}/learn`;
  return `
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 class="text-2xl font-bold text-base-content">IO-Link Master</h1>
          <p class="text-base-content/70">IFM IO-Link Master – Port status, supervision, and software versions</p>
        </div>
        <a href="${learnUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Learn: Smart Sensors, Industry 4.0 &amp; IoT</a>
      </div>

      <!-- Status card + device image -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body items-center text-center">
            <img id="productImage" src="${typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL ? import.meta.env.BASE_URL + 'assets/img/AL1300.png' : '/assets/img/AL1300.png'}" alt="AL1300 IO-Link Master" class="max-h-48 object-contain" onerror="this.style.display='none'; document.getElementById('productImagePlaceholder')?.classList.remove('hidden');" />
            <div id="productImagePlaceholder" class="hidden text-base-content/60">AL1300 IO-Link Master</div>
          </div>
        </div>
        <div class="lg:col-span-3 card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content" id="deviceName">IO-Link Master</h2>
            <p class="text-sm text-base-content/70">Connection and data source</p>
            <style>
              .connection-glow-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
              .connection-glow-dot.glow-green { background: #22c55e; box-shadow: 0 0 10px #22c55e, 0 0 20px #22c55e; }
              .connection-glow-dot.glow-red { background: #ef4444; box-shadow: 0 0 10px #ef4444, 0 0 20px #ef4444; }
              .connection-glow-dot.glow-checking { background: #eab308; box-shadow: 0 0 8px #eab308; }
            </style>
            <div class="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div class="flex items-center gap-1"><span class="text-base-content/60">Connection:</span> <span id="connectionGlow" class="connection-glow-dot glow-checking" title="Status"></span><span id="connectionStatus" class="font-medium">Checking...</span></div>
              <div><span class="text-base-content/60">Data Source:</span> <span id="dataSource">-</span></div>
              <div><span class="text-base-content/60">Last Update:</span> <span id="lastUpdate">-</span></div>
              <div><span class="text-base-content/60">Poll:</span> <span id="pollInterval">-</span></div>
            </div>
            <div class="flex gap-2 mt-3">
              <button type="button" class="btn btn-primary btn-sm" id="io-link-refresh-btn">Refresh Now</button>
            </div>
            <div class="mt-3 pt-3 border-t border-base-300">
              <p class="text-xs text-base-content/60 mb-2">IO-Link Master address</p>
              <div class="flex flex-wrap items-center gap-2">
                <input type="text" id="masterIpInput" placeholder="192.168.7.4" class="input input-bordered input-sm w-36" />
                <span class="text-base-content/60 text-sm">Port</span>
                <input type="number" id="masterPortInput" placeholder="80" min="1" max="65535" class="input input-bordered input-sm w-20" />
                <button type="button" class="btn btn-primary btn-sm" id="io-link-save-config-btn">Save</button>
                <span id="configMessage" class="text-sm text-success"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Port Status Table -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">Port Status</h2>
          <p class="text-sm text-base-content/70">IO-Link ports and connected devices</p>
          <div class="overflow-x-auto">
            <table class="table table-zebra table-pin-rows">
              <thead>
                <tr>
                  <th>Port</th>
                  <th>Mode</th>
                  <th>Comm. Mode</th>
                  <th>MasterCycle</th>
                  <th>Vendor ID</th>
                  <th>Device ID</th>
                  <th>Name</th>
                  <th>Serial</th>
                  <th>PD In</th>
                  <th>PD Out</th>
                </tr>
              </thead>
              <tbody id="portTableBody">
                <tr><td colspan="10" class="text-center">Loading...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Supervision Trends (charts) -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">Supervision Trends</h2>
          <p class="text-sm text-base-content/70">Current, Voltage, Temperature over time</p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div><p class="text-sm font-semibold text-center">Current (mA)</p><div class="h-48"><canvas id="chartCurrent"></canvas></div></div>
            <div><p class="text-sm font-semibold text-center">Voltage (mV)</p><div class="h-48"><canvas id="chartVoltage"></canvas></div></div>
            <div><p class="text-sm font-semibold text-center">Temperature (°C)</p><div class="h-48"><canvas id="chartTemp"></canvas></div></div>
          </div>
        </div>
      </div>

      <!-- Supervision + Software -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content">Supervision</h2>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody id="supervisionTableBody">
                  <tr><td colspan="2" class="text-center">-</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content">Software Versions</h2>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody id="softwareTableBody">
                  <tr><td colspan="2" class="text-center">-</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Simulate Fault (Training) -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">Simulate Fault (Training)</h2>
          <p class="text-sm text-base-content/70">See how the dashboard reacts to a fault without touching hardware</p>
          <div class="flex flex-wrap items-center gap-3 mt-2">
            <span class="text-sm">Port:</span>
            <select id="simulateFaultPort" class="select select-bordered select-sm w-20">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
            <span class="text-sm">Fault:</span>
            <select id="simulateFaultEvent" class="select select-bordered select-sm w-48">
              <option value="">-- Select fault --</option>
              <option value='{"code":"0x01","label":"Wire break"}'>Wire break</option>
              <option value='{"code":"0x02","label":"Short circuit"}'>Short circuit</option>
              <option value='{"code":"0x08","label":"Lens dirty"}'>Lens dirty</option>
              <option value='{"code":"0x04","label":"Overheating"}'>Overheating</option>
              <option value='{"code":"0x05","label":"Data storage error"}'>Data storage error</option>
            </select>
            <button type="button" class="btn btn-primary btn-sm" id="simulateFaultSetBtn">Set fault</button>
            <button type="button" class="btn btn-ghost btn-sm" id="simulateFaultClearBtn">Clear fault</button>
            <span id="simulateFaultMessage" class="text-sm opacity-70"></span>
          </div>
        </div>
      </div>

      <!-- Active Port Details -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">Active Port Details</h2>
          <p class="text-sm text-base-content/70">Process data and decoded device status</p>
          <div id="portDetailsContainer"><p class="text-center">Loading...</p></div>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  if (text == null) return '-';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

let ioLinkCharts = [];
let lastGoodData = null;
let websocket = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 10;
const RECONNECT_DELAY = 5000;

function showError(msg, clearData) {
  const el = document.getElementById('connectionStatus');
  if (el) {
    el.textContent = msg;
    el.className = 'font-medium text-error';
  }
  const glow = document.getElementById('connectionGlow');
  if (glow) { glow.className = 'connection-glow-dot glow-red'; }
  const ds = document.getElementById('dataSource');
  if (ds) ds.textContent = '-';
  if (clearData || !lastGoodData) {
    updatePortTable([]);
    updateSupervisionTable({});
    updateSoftwareTable({});
  }
}

function updateUI(data) {
  if (!data || !data.success) {
    if (data && data.error) showError('Error: ' + data.error, false);
    return;
  }
  lastGoodData = data;
  const conn = document.getElementById('connectionStatus');
  if (conn) {
    conn.textContent = 'Connected';
    conn.className = 'font-medium text-success';
  }
  const glow = document.getElementById('connectionGlow');
  if (glow) { glow.className = 'connection-glow-dot glow-green'; }
  const ds = document.getElementById('dataSource');
  if (ds) ds.textContent = data.source || 'WebSocket';
  const name = document.getElementById('deviceName');
  if (name) name.textContent = data.device_name || 'IO-Link Master';
  const last = document.getElementById('lastUpdate');
  if (last) last.textContent = new Date().toLocaleTimeString();
  const poll = document.getElementById('pollInterval');
  if (poll) poll.textContent = 'Real-time';

  updatePortTable(data.ports || []);
  updateSupervisionTable(data.supervision || {});
  updateSoftwareTable(data.software || {});
  updateSupervisionCharts();
  const img = document.getElementById('productImage');
  const placeholder = document.getElementById('productImagePlaceholder');
  if (img) {
    img.src = data.device_icon_url || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL ? import.meta.env.BASE_URL + 'assets/img/AL1300.png' : '/assets/img/AL1300.png');
    img.classList.remove('hidden');
    if (placeholder) placeholder.classList.add('hidden');
  }
}

function updatePortTable(ports) {
  const tbody = document.getElementById('portTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!ports || ports.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center">No port data</td></tr>';
    return;
  }
  for (const p of ports) {
    const isActive = (p.mode || '').toLowerCase().includes('io-link');
    const pdin = p.pdin ? (p.pdin.length <= 8 ? p.pdin : p.pdin.substring(0, 8) + '...') : '-';
    const pdout = p.pdout ? (p.pdout.length <= 8 ? p.pdout : p.pdout.substring(0, 8) + '...') : '-';
    const row = document.createElement('tr');
    if (isActive) row.className = 'bg-success/20';
    row.innerHTML = `
      <td>${p.port}</td>
      <td>${escapeHtml(p.mode || '-')}</td>
      <td>${escapeHtml(p.comm_mode || '-')}</td>
      <td>${escapeHtml(p.master_cycle_time || '-')}</td>
      <td>${escapeHtml(p.vendor_id || '-')}</td>
      <td>${escapeHtml(p.device_id || '-')}</td>
      <td>${escapeHtml(p.name || '-')}</td>
      <td>${escapeHtml(p.serial || '-')}</td>
      <td><code class="text-xs">${escapeHtml(pdin)}</code></td>
      <td><code class="text-xs">${escapeHtml(pdout)}</code></td>
    `;
    tbody.appendChild(row);
  }
  loadActivePortDetails(ports);
}

async function loadActivePortDetails(ports) {
  const container = document.getElementById('portDetailsContainer');
  if (!container) return;
  const active = (ports || []).filter(p => (p.mode || '').toLowerCase().includes('io-link'));
  if (active.length === 0) {
    container.innerHTML = '<p class="text-center">No active IO-Link ports</p>';
    return;
  }
  let html = '';
  for (const port of active) {
    try {
      const res = await fetch(`${API_BASE}/api/io-link/port/${port.port}`, { signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      if (data.success && data.port) html += generatePortDetailsHTML(data.port);
      else html += `<div class="alert alert-warning">Port ${port.port}: No data</div>`;
    } catch (e) {
      html += `<div class="alert alert-warning">Port ${port.port}: Error</div>`;
    }
  }
  container.innerHTML = html || '<p class="text-center">No details</p>';
}

const LEARN_BLURBS = {
  status_led: { blurb: 'Status lights show machine or line state (e.g. green = running, red = fault). Check supervision and that the correct state is displayed.', anchor: 'status-led' },
  photo_electric: { blurb: 'Photoelectric sensors detect objects and often report signal quality. Keep the lens clean and watch signal quality; a drop means cleaning or alignment before failure.', anchor: 'photo-electric' },
  temperature: { blurb: 'Temperature sensors report °C for process and maintenance. Check supervision current and wiring; use trends to spot overheating.', anchor: 'temperature' },
  proximity: { blurb: 'Proximity sensors report presence or distance. Check mounting distance and contamination; use event flags and cycle count for MTTF-based replacement.', anchor: 'proximity' }
};
let portCycleCounts = {};

function generatePortDetailsHTML(port) {
  const dtype = port.device_type || 'unknown';
  const hasDecodedPdin = port.pdin && port.pdin.decoded && Object.keys(port.pdin.decoded).length > 0;
  const showDecodedByDefault = hasDecodedPdin;

  let h = `<div class="port-detail-card rounded-lg border border-base-300 bg-base-100 p-4 mb-3" data-port="${port.port}">`;
  h += `<h3 class="font-semibold text-primary">Port ${port.port} – ${escapeHtml(port.name || 'Unknown')}</h3>`;
  if (dtype !== 'unknown' && LEARN_BLURBS[dtype]) {
    const blurb = LEARN_BLURBS[dtype];
    h += `<div class="my-2 p-2 rounded bg-success/10 border-l-4 border-success"><strong>About this sensor:</strong> ${escapeHtml(blurb.blurb)} <a href="${API_BASE}/learn#${blurb.anchor}" target="_blank" class="link link-primary text-sm">Learn more</a></div>`;
  }
  if (port.events && port.events.length > 0) {
    h += '<div class="mb-2"><strong>Events / faults:</strong> ';
    port.events.forEach(ev => {
      h += `<span class="badge badge-error badge-sm mr-1">${escapeHtml(ev.code)} ${escapeHtml(ev.label)}</span>`;
    });
    h += '</div>';
  }
  h += `<p class="text-sm opacity-80">Type: ${escapeHtml(dtype)} | Vendor: ${escapeHtml(port.vendor_id || '-')} | Device: ${escapeHtml(port.device_id || '-')} | Serial: ${escapeHtml(port.serial || '-')}</p>`;

  if ((dtype === 'photo_electric' || dtype === 'proximity') && port.pdin && port.pdin.decoded) {
    portCycleCounts[port.port] = (portCycleCounts[port.port] || 950000) + Math.floor(Math.random() * 50) + 1;
    const count = portCycleCounts[port.port];
    h += `<p class="text-xs my-1"><strong>Total activations (simulated):</strong> ${count.toLocaleString()}. <span class="opacity-70">Parts have a mechanical life cycle (MTTF). Smart sensors can support replacement planning.</span></p>`;
  }
  if (dtype === 'photo_electric' && port.pdin && port.pdin.decoded && port.pdin.decoded.signal_quality_percent != null) {
    const sq = port.pdin.decoded.signal_quality_percent;
    h += `<div class="my-1"><strong>Signal quality:</strong> <progress class="progress progress-success w-48" value="${sq}" max="100"></progress> ${sq}%. <span class="text-xs opacity-70">Dropping → clean lens or check alignment.</span></div>`;
  }

  if (port.pdout && port.pdout.raw) {
    h += `<p class="text-xs mt-2"><strong>PD Out:</strong> <code>${escapeHtml(port.pdout.raw)}</code></p>`;
    if (port.pdout.decoded && port.pdout.decoded.color1) {
      const d = port.pdout.decoded;
      h += `<p class="text-xs">LED: ${escapeHtml(d.color1)} / ${escapeHtml(d.color2)} | ${escapeHtml(d.animation)} | ${escapeHtml(d.pulse_pattern)}</p>`;
    }
  }
  if (port.pdin && port.pdin.raw) {
    h += '<div class="mt-2"><label class="label cursor-pointer justify-start gap-2"><input type="checkbox" class="raw-decoded-toggle checkbox checkbox-sm" data-port="' + port.port + '"/><span class="label-text">Show Raw Hex</span></label>';
    h += '<div class="pdin-decoded ' + (showDecodedByDefault ? '' : 'hidden') + '">';
    h += '<strong>Decoded:</strong> <code>' + (hasDecodedPdin ? escapeHtml(port.pdin.decoded.description || '') : 'No decoded value') + '</code></div>';
    h += '<div class="pdin-raw ' + (!showDecodedByDefault ? '' : 'hidden') + '">';
    h += '<strong>Raw:</strong> <code>' + escapeHtml(port.pdin.raw) + '</code> <strong>Hex:</strong> <code>' + escapeHtml(port.pdin.hex) + '</code> <strong>Bytes:</strong> <code>[' + (port.pdin.bytes || []).join(', ') + ']</code></div></div>';
  }
  h += '</div>';
  return h;
}

function updateSupervisionTable(supervision) {
  const tbody = document.getElementById('supervisionTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const entries = Object.entries(supervision || {});
  if (entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2" class="text-center">No supervision data</td></tr>';
    return;
  }
  for (const [k, v] of entries) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td>`;
    tbody.appendChild(tr);
  }
}

function updateSoftwareTable(software) {
  const tbody = document.getElementById('softwareTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const entries = Object.entries(software || {});
  if (entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2" class="text-center">No software data</td></tr>';
    return;
  }
  for (const [k, v] of entries) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td>`;
    tbody.appendChild(tr);
  }
}

function updateSupervisionCharts() {
  fetch(`${API_BASE}/api/io-link/supervision-history`, { signal: AbortSignal.timeout(5000) })
    .then(r => r.json())
    .then(data => {
      const history = data.history || [];
      if (history.length < 2) return;
      const labels = history.map((h, i) => (i % Math.max(1, Math.floor(history.length / 8)) === 0 || i === history.length - 1) ? new Date(h.ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
      const currentSer = history.map(h => h.current);
      const voltageSer = history.map(h => h.voltage);
      const tempSer = history.map(h => h.temperature);

      ioLinkCharts.forEach(c => c.destroy());
      ioLinkCharts = [];

      const opts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: true }, y: { beginAtZero: true } } };
      const ctxCur = document.getElementById('chartCurrent');
      const ctxVol = document.getElementById('chartVoltage');
      const ctxTemp = document.getElementById('chartTemp');
      if (ctxCur) ioLinkCharts.push(new Chart(ctxCur.getContext('2d'), { type: 'line', data: { labels, datasets: [{ label: 'Current', data: currentSer, borderColor: '#4caf50', fill: true, tension: 0.3 }] }, options: opts }));
      if (ctxVol) ioLinkCharts.push(new Chart(ctxVol.getContext('2d'), { type: 'line', data: { labels, datasets: [{ label: 'Voltage', data: voltageSer, borderColor: '#ff9800', fill: true, tension: 0.3 }] }, options: opts }));
      if (ctxTemp) ioLinkCharts.push(new Chart(ctxTemp.getContext('2d'), { type: 'line', data: { labels, datasets: [{ label: 'Temp', data: tempSer, borderColor: '#f44336', fill: true, tension: 0.3 }] }, options: opts }));
    })
    .catch(() => {});
}

function connectWebSocket() {
  if (websocket) {
    websocket.close();
    websocket = null;
  }
  try {
    const wsUrl = `${WS_BASE}/ws`;
    websocket = new WebSocket(wsUrl);
    websocket.onopen = () => {
      reconnectAttempts = 0;
      const conn = document.getElementById('connectionStatus');
      if (conn) conn.textContent = 'Connecting...';
      const glow = document.getElementById('connectionGlow');
      if (glow) glow.className = 'connection-glow-dot glow-checking';
    };
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ping') return;
        updateUI(data);
      } catch (e) {}
    };
    websocket.onerror = () => showError('WebSocket error', false);
    websocket.onclose = () => {
      websocket = null;
      if (reconnectAttempts < MAX_RECONNECT) {
        reconnectAttempts++;
        showError(`Reconnecting (${reconnectAttempts}/${MAX_RECONNECT})...`, false);
        reconnectTimer = setTimeout(connectWebSocket, RECONNECT_DELAY);
      } else {
        showError('Connection lost. Refresh the page.', false);
      }
    };
  } catch (e) {
    showError('WebSocket failed', false);
    setTimeout(() => {
      const pollEl = document.getElementById('pollInterval');
      if (pollEl) pollEl.textContent = '5s (HTTP)';
      const poll = () => fetch(`${API_BASE}/api/io-link/status`).then(r => r.json()).then(updateUI).catch(() => {});
      poll();
      setInterval(poll, 5000);
    }, 2000);
  }
}

function loadMasterConfig() {
  fetch(`${API_BASE}/api/io-link/config`)
    .then(r => r.json())
    .then(data => {
      if (data.success && data.io_link) {
        const ipEl = document.getElementById('masterIpInput');
        if (ipEl) ipEl.value = data.io_link.master_ip || '';
        const portEl = document.getElementById('masterPortInput');
        if (portEl) portEl.value = data.io_link.port != null ? data.io_link.port : '80';
      }
    })
    .catch(() => {});
}

function saveMasterConfig() {
  const ipEl = document.getElementById('masterIpInput');
  const portEl = document.getElementById('masterPortInput');
  const msgEl = document.getElementById('configMessage');
  const ip = ipEl && ipEl.value ? ipEl.value.trim() : '';
  if (!ip) {
    if (msgEl) { msgEl.textContent = 'Enter an IP address'; msgEl.className = 'text-sm text-error'; }
    return;
  }
  let port = portEl && portEl.value ? parseInt(portEl.value, 10) : 80;
  if (isNaN(port) || port < 1 || port > 65535) port = 80;
  if (msgEl) { msgEl.textContent = 'Saving...'; msgEl.className = 'text-sm'; }
  fetch(`${API_BASE}/api/io-link/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ master_ip: ip, port })
  })
    .then(r => r.json())
    .then(data => {
      if (msgEl) {
        msgEl.textContent = data.success ? 'Saved.' : (data.detail || 'Error');
        msgEl.className = data.success ? 'text-sm text-success' : 'text-sm text-error';
      }
      setTimeout(() => { if (msgEl) msgEl.textContent = ''; }, 4000);
    })
    .catch(err => {
      if (msgEl) { msgEl.textContent = 'Error'; msgEl.className = 'text-sm text-error'; }
    });
}

/** Call when leaving the IO-Link page so charts are destroyed. */
export function destroyIOLinkPage() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  if (websocket) {
    websocket.close();
    websocket = null;
  }
  ioLinkCharts.forEach(c => c.destroy());
  ioLinkCharts = [];
}

function setupRawDecodedToggle() {
  document.addEventListener('change', (e) => {
    if (!e.target || !e.target.classList || !e.target.classList.contains('raw-decoded-toggle')) return;
    const card = e.target.closest('.port-detail-card');
    if (!card) return;
    const rawDiv = card.querySelector('.pdin-raw');
    const decDiv = card.querySelector('.pdin-decoded');
    if (!rawDiv || !decDiv) return;
    if (e.target.checked) {
      rawDiv.classList.remove('hidden');
      decDiv.classList.add('hidden');
    } else {
      rawDiv.classList.add('hidden');
      decDiv.classList.remove('hidden');
    }
  });
}

function setupSimulateFault() {
  const setBtn = document.getElementById('simulateFaultSetBtn');
  const clearBtn = document.getElementById('simulateFaultClearBtn');
  const msgEl = document.getElementById('simulateFaultMessage');
  if (setBtn) {
    setBtn.onclick = () => {
      const portSelect = document.getElementById('simulateFaultPort');
      const eventSelect = document.getElementById('simulateFaultEvent');
      const port = parseInt(portSelect?.value || '1', 10);
      const eventVal = eventSelect?.value;
      if (!eventVal) {
        if (msgEl) { msgEl.textContent = 'Select a fault first'; msgEl.className = 'text-sm text-error'; }
        return;
      }
      let eventObj;
      try { eventObj = JSON.parse(eventVal); } catch (err) { if (msgEl) msgEl.textContent = 'Invalid fault'; return; }
      fetch(`${API_BASE}/api/io-link/simulate-fault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port, event: eventObj })
      })
        .then(r => r.json())
        .then(data => {
          if (msgEl) { msgEl.textContent = data.success ? 'Fault set. Port details will update.' : (data.detail || 'Error'); msgEl.className = data.success ? 'text-sm text-success' : 'text-sm text-error'; }
          if (data.success && lastGoodData && lastGoodData.ports) {
            const active = lastGoodData.ports.filter(p => (p.mode || '').toLowerCase().includes('io-link'));
            loadActivePortDetails(active);
          }
          setTimeout(() => { if (msgEl) msgEl.textContent = ''; }, 4000);
        })
        .catch(err => { if (msgEl) { msgEl.textContent = 'Error: ' + (err.message || 'Request failed'); msgEl.className = 'text-sm text-error'; } });
    };
  }
  if (clearBtn) {
    clearBtn.onclick = () => {
      const portSelect = document.getElementById('simulateFaultPort');
      const port = parseInt(portSelect?.value || '1', 10);
      fetch(`${API_BASE}/api/io-link/simulate-fault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port, event: null })
      })
        .then(r => r.json())
        .then(data => {
          if (msgEl) { msgEl.textContent = data.success ? 'Fault cleared.' : (data.detail || 'Error'); msgEl.className = data.success ? 'text-sm text-success' : 'text-sm text-error'; }
          if (data.success && lastGoodData && lastGoodData.ports) {
            const active = lastGoodData.ports.filter(p => (p.mode || '').toLowerCase().includes('io-link'));
            loadActivePortDetails(active);
          }
          setTimeout(() => { if (msgEl) msgEl.textContent = ''; }, 4000);
        })
        .catch(err => { if (msgEl) { msgEl.textContent = 'Error'; msgEl.className = 'text-sm text-error'; } });
    };
  }
}

export function initIOLinkPage() {
  const learnLink = document.getElementById('sidebar-learn-link');
  if (learnLink) learnLink.href = `${API_BASE}/learn`;
  const worksheetsLink = document.getElementById('sidebar-worksheets-link');
  if (worksheetsLink) worksheetsLink.href = `${API_BASE}/worksheets`;
  ioLinkCharts.forEach(c => c.destroy());
  ioLinkCharts = [];
  if (reconnectTimer) clearTimeout(reconnectTimer);
  loadMasterConfig();
  connectWebSocket();
  setupRawDecodedToggle();
  setupSimulateFault();
  const btn = document.getElementById('io-link-refresh-btn');
  if (btn) {
    btn.onclick = () => {
      if (!websocket || websocket.readyState !== WebSocket.OPEN)
        fetch(`${API_BASE}/api/io-link/status`).then(r => r.json()).then(updateUI).catch(() => {});
    };
  }
  const saveBtn = document.getElementById('io-link-save-config-btn');
  if (saveBtn) saveBtn.onclick = saveMasterConfig;
}
