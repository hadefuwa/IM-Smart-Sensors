/**
 * IO-Link Master page for Matrix Template
 * Connects to FastAPI backend via WebSocket for real-time data.
 */

import Chart from 'chart.js/auto';

// API/WebSocket base – when using Vite dev server (e.g. 5173), point to FastAPI (8000)
const API_BASE = window.IO_LINK_API_BASE || 'http://localhost:8000';
const WS_BASE = API_BASE.replace(/^http/, 'ws');

export function renderIOLinkMaster() {
  return `
    <div class="space-y-4">
      <h1 class="text-2xl font-bold text-base-content">IO-Link Master</h1>
      <p class="text-base-content/70">IFM IO-Link Master – Port status, supervision, and software versions</p>

      <!-- Status card + device image -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body items-center text-center">
            <img id="productImage" src="/assets/img/AL1300.png" alt="AL1300 IO-Link Master" class="max-h-48 object-contain" onerror="this.style.display='none'; document.getElementById('productImagePlaceholder')?.classList.remove('hidden');" />
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
    img.src = data.device_icon_url || '/assets/img/AL1300.png';
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

function generatePortDetailsHTML(port) {
  let h = `<div class="rounded-lg border border-base-300 bg-base-100 p-4 mb-3">`;
  h += `<h3 class="font-semibold text-primary">Port ${port.port} – ${escapeHtml(port.name || 'Unknown')}</h3>`;
  h += `<p class="text-sm opacity-80">Vendor: ${escapeHtml(port.vendor_id || '-')} | Device: ${escapeHtml(port.device_id || '-')} | Serial: ${escapeHtml(port.serial || '-')}</p>`;
  if (port.pdout && port.pdout.raw) {
    h += `<p class="text-xs mt-2"><strong>PD Out:</strong> <code>${escapeHtml(port.pdout.raw)}</code></p>`;
    if (port.pdout.decoded && port.pdout.decoded.color1) {
      const d = port.pdout.decoded;
      h += `<p class="text-xs">LED: ${d.color1} / ${d.color2} | ${d.animation} | ${d.pulse_pattern}</p>`;
    }
  }
  if (port.pdin && port.pdin.raw) {
    h += `<p class="text-xs"><strong>PD In:</strong> <code>${escapeHtml(port.pdin.raw)}</code></p>`;
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

export function initIOLinkPage() {
  ioLinkCharts.forEach(c => c.destroy());
  ioLinkCharts = [];
  if (reconnectTimer) clearTimeout(reconnectTimer);
  connectWebSocket();
  const btn = document.getElementById('io-link-refresh-btn');
  if (btn) {
    btn.onclick = () => {
      if (!websocket || websocket.readyState !== WebSocket.OPEN)
        fetch(`${API_BASE}/api/io-link/status`).then(r => r.json()).then(updateUI).catch(() => {});
    };
  }
}
