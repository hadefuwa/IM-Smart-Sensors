/**
 * Admin - IO-Link Diagnostics page.
 * Extended observability for AL1350 link health + Pi system telemetry.
 */

import Chart from 'chart.js/auto';
import { TerminalLog } from './components/terminal-log.js';

const API_BASE = window.IO_LINK_API_BASE || window.location.origin;
const WS_BASE = API_BASE.replace(/^http/, 'ws');

export function renderAdminPage() {
  return `
    <div class="space-y-4 admin-diag-page">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 class="text-2xl font-bold text-base-content">IO-Link Diagnostics</h1>
          <p class="text-base-content/70">Connection health, AL1350 transport metrics, and Raspberry Pi runtime stats.</p>
        </div>
        <div class="flex items-center gap-3">
          <button type="button" id="diagRefreshBtn" class="btn btn-outline btn-sm min-h-[44px]">Refresh now</button>
          <span class="text-xs text-base-content/50" id="diagLastRefresh">-</span>
        </div>
      </div>

      <div id="diagDegradedBanner" class="alert alert-warning hidden">
        <span id="diagDegradedText">Degraded mode active.</span>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div class="card bg-base-200 shadow border border-base-300 col-span-2 lg:col-span-1">
          <div class="card-body p-4 text-center">
            <div class="text-2xl font-bold font-mono text-success" id="diagSinceLastDrop">--:--</div>
            <div class="text-xs text-base-content/60 mt-1">Time since last drop</div>
            <div class="text-xs text-base-content/40" id="diagLastDropAt">no drops recorded</div>
          </div>
        </div>
        <div class="card bg-base-200 shadow border border-base-300">
          <div class="card-body p-4 text-center">
            <div class="text-3xl font-bold text-success" id="diagUptime">-</div>
            <div class="text-xs text-base-content/60 mt-1">Uptime % (last hour)</div>
          </div>
        </div>
        <div class="card bg-base-200 shadow border border-base-300">
          <div class="card-body p-4 text-center">
            <div class="text-3xl font-bold text-warning" id="diagDrops">-</div>
            <div class="text-xs text-base-content/60 mt-1">Drops (last hour)</div>
          </div>
        </div>
        <div class="card bg-base-200 shadow border border-base-300">
          <div class="card-body p-4 text-center">
            <div class="text-3xl font-bold text-info" id="diagP95">-</div>
            <div class="text-xs text-base-content/60 mt-1">Request RTT p95 (ms)</div>
          </div>
        </div>
        <div class="card bg-base-200 shadow border border-base-300">
          <div class="card-body p-4 text-center">
            <div class="text-3xl font-bold text-error" id="diagConsecFail">-</div>
            <div class="text-xs text-base-content/60 mt-1">Consecutive failures</div>
          </div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl border border-base-300">
        <div class="card-body">
          <h2 class="card-title text-base-content text-base">Component Health</h2>
          <div class="overflow-x-auto">
            <table class="table table-sm table-zebra">
              <thead>
                <tr><th>Component</th><th>Status</th><th>Last Update</th><th>Detail</th></tr>
              </thead>
              <tbody id="healthTableBody">
                <tr><td colspan="4" class="text-center text-base-content/50">Waiting for data…</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl border border-base-300">
          <div class="card-body">
            <h2 class="card-title text-base-content text-base">Transport + Link</h2>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="p-3 rounded-lg bg-base-100 border border-base-300">
                <div class="text-base-content/60">Success rate</div>
                <div id="diagSuccessRate" class="font-semibold text-lg">-</div>
              </div>
              <div class="p-3 rounded-lg bg-base-100 border border-base-300">
                <div class="text-base-content/60">Circuit state</div>
                <div id="diagCircuitState" class="font-semibold text-lg">-</div>
              </div>
              <div class="p-3 rounded-lg bg-base-100 border border-base-300">
                <div class="text-base-content/60">Reconnect count</div>
                <div id="diagReconnects" class="font-semibold text-lg">-</div>
              </div>
              <div class="p-3 rounded-lg bg-base-100 border border-base-300">
                <div class="text-base-content/60">Last good data</div>
                <div id="diagLastGood" class="font-semibold text-sm">-</div>
              </div>
              <div class="p-3 rounded-lg bg-base-100 border border-base-300 col-span-2">
                <div class="text-base-content/60">Direct Ethernet link</div>
                <div id="diagLinkState" class="font-semibold text-sm">-</div>
              </div>
            </div>
          </div>
        </div>

      <div class="card bg-base-200 shadow-xl border border-base-300">
        <div class="card-body">
          <h2 class="card-title text-base-content text-base">Per-Port Data Freshness</h2>
          <div id="diagPortFreshness" class="grid grid-cols-2 md:grid-cols-4 gap-3"></div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl border border-base-300">
        <div class="card-body">
          <h2 class="card-title text-base-content text-base">Connection Timeline</h2>
          <p class="text-xs text-base-content/60">1 = connected, 0 = disconnected. Each point is a state-change event.</p>
          <div class="h-40 mt-2"><canvas id="diagTimelineChart"></canvas></div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl border border-base-300">
        <div class="card-body">
          <h2 class="card-title text-base-content text-base">Poll Latency (ms)</h2>
          <p class="text-xs text-base-content/60">Round-trip time per poll cycle to the IO-Link master.</p>
          <div class="h-40 mt-2"><canvas id="diagLatencyChart"></canvas></div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl border border-base-300">
        <div class="card-body">
          <h2 class="card-title text-base-content text-base">Recent Events</h2>
          <div class="overflow-x-auto">
            <table class="table table-sm table-zebra">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Event</th>
                  <th>Duration (s)</th>
                  <th>Circuit</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody id="diagEventsBody">
                <tr><td colspan="5" class="text-center text-base-content/50">Loading...</td></tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-base-content/40 mt-2">Auto-refreshes every 2 s. Shows last 200 events.</p>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl border border-base-300">
        <div class="card-body py-3 px-4">
          <div class="flex items-center justify-between gap-2 mb-2">
            <h2 class="card-title text-base-content text-base">Backend Log</h2>
            <div class="flex items-center gap-2">
              <label class="flex items-center gap-1 text-xs cursor-pointer">
                <input type="checkbox" id="logAutoScroll" class="checkbox checkbox-xs" checked />
                Auto-scroll
              </label>
              <select id="logLevelFilter" class="select select-bordered select-xs">
                <option value="ALL">All levels</option>
                <option value="WARNING">Warning+</option>
                <option value="ERROR">Error only</option>
              </select>
            </div>
          </div>
          <div id="logViewer" class="bg-base-300 rounded font-mono text-xs leading-5 overflow-y-auto" style="height:320px;"></div>
          <p class="text-xs text-base-content/40 mt-1">Last 200 entries · saved to <code>logs/app.log</code> on the Pi · auto-refreshes every 2 s.</p>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl border border-base-300">
        <div class="card-body p-0 flex flex-col" style="height:360px;">
          <div id="diag-terminal-container" class="flex-1 min-h-0"></div>
        </div>
      </div>
    </div>
  `;
}

let _charts = [];
let _refreshInterval = null;
let _tickInterval = null;
let _lastDropTs = null;
let _backendStartTs = null;
let _terminalLog = null;
let _diagSocket = null;
let _diagReconnectTimer = null;
let _diagPageActive = false;

function formatUptimeDuration(seconds) {
  if (seconds < 0) seconds = 0;
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function tickUptimeCounter() {
  const el = document.getElementById('diagSinceLastDrop');
  if (!el) return;
  if (_lastDropTs !== null) {
    // Time since the last real drop
    const secs = Math.floor(Date.now() / 1000 - _lastDropTs);
    el.textContent = formatUptimeDuration(secs);
    el.className = `text-2xl font-bold font-mono ${secs < 120 ? 'text-error' : secs < 600 ? 'text-warning' : 'text-success'}`;
  } else if (_backendStartTs !== null) {
    // No drops recorded — show continuous uptime since backend started
    const secs = Math.floor(Date.now() / 1000 - _backendStartTs);
    el.textContent = formatUptimeDuration(secs);
    el.className = 'text-2xl font-bold font-mono text-success';
    const labelEl = document.getElementById('diagLastDropAt');
    if (labelEl) labelEl.textContent = 'no drops recorded';
  } else {
    el.textContent = '—';
  }
}

function destroyCharts() {
  _charts.forEach(c => {
    try { c.destroy(); } catch (_) {}
  });
  _charts = [];
}

function getClassForValue(value, warningMin, criticalMin = null) {
  if (value == null) return 'text-base-content';
  if (criticalMin != null && value < criticalMin) return 'text-error';
  if (value < warningMin) return 'text-warning';
  return 'text-success';
}

function getClassForUpperBound(value, warningMax, criticalMax = null) {
  if (value == null) return 'text-base-content';
  if (criticalMax != null && value >= criticalMax) return 'text-error';
  if (value >= warningMax) return 'text-warning';
  return 'text-success';
}

function _fmtTime(tsSeconds) {
  return new Date(tsSeconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function buildTimelineChart(events) {
  const canvas = document.getElementById('diagTimelineChart');
  if (!canvas) return;

  // Build label/value arrays from events (no time-scale adapter needed)
  const labels = [];
  const values = [];
  if (events.length === 0) {
    labels.push(_fmtTime(Date.now() / 1000 - 60), _fmtTime(Date.now() / 1000));
    values.push(1, 1);
  } else {
    let cur = events[0].status === 'connected' ? 0 : 1;
    for (const ev of events) {
      const prevTs = ev.ts - (ev.duration_sec || 0);
      labels.push(_fmtTime(prevTs));
      values.push(cur);
      cur = ev.status === 'connected' ? 1 : 0;
      labels.push(_fmtTime(ev.ts));
      values.push(cur);
    }
    labels.push(_fmtTime(Date.now() / 1000));
    values.push(cur);
  }

  const chart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{ data: values, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, stepped: true, pointRadius: 2, tension: 0 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxTicksLimit: 8, maxRotation: 0 } },
        y: { min: -0.1, max: 1.1, ticks: { stepSize: 1, callback: v => (v === 1 ? 'OK' : v === 0 ? 'Down' : '') } }
      }
    }
  });
  _charts.push(chart);
}

function buildLatencyChart(latencies) {
  const canvas = document.getElementById('diagLatencyChart');
  if (!canvas) return;

  const step = Math.max(1, Math.floor(latencies.length / 50));
  const filtered = latencies.filter((_, i) => i % step === 0 || i === latencies.length - 1);
  const labels = filtered.map(p => _fmtTime(p.ts));
  const values = filtered.map(p => p.latency_ms);

  const chart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{ data: values, borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.1)', fill: true, pointRadius: 2, tension: 0.3 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxTicksLimit: 8, maxRotation: 0 } },
        y: { beginAtZero: true, ticks: { callback: v => `${v} ms` } }
      }
    }
  });
  _charts.push(chart);
}

function fillEventsTable(events) {
  const tbody = document.getElementById('diagEventsBody');
  if (!tbody) return;

  // Find the most recent disconnect to drive the uptime counter
  const lastDrop = [...events].reverse().find(e => e.status === 'disconnected');
  _lastDropTs = lastDrop ? lastDrop.ts : null;
  const labelEl = document.getElementById('diagLastDropAt');
  if (labelEl) {
    labelEl.textContent = lastDrop
      ? `last drop: ${new Date(lastDrop.ts * 1000).toLocaleTimeString()}`
      : 'no drops recorded';
  }
  tickUptimeCounter();

  const reversed = [...events].reverse();
  if (reversed.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-base-content/50">No events recorded yet.</td></tr>';
    return;
  }
  tbody.innerHTML = reversed.map(ev => {
    const t = new Date(ev.ts * 1000).toLocaleTimeString();
    const badge = ev.status === 'connected'
      ? '<span class="badge badge-success badge-sm">Connected</span>'
      : '<span class="badge badge-error badge-sm">Disconnected</span>';
    const dur = ev.duration_sec != null ? `${ev.duration_sec} s` : '-';
    const circuit = ev.circuit ? `<code class="text-xs">${ev.circuit}</code>` : '<span class="text-base-content/30">-</span>';
    const err = ev.error ? `<span class="text-error text-xs">${ev.error}</span>` : '<span class="text-base-content/30">-</span>';
    return `<tr><td class="text-xs">${t}</td><td>${badge}</td><td>${dur}</td><td>${circuit}</td><td>${err}</td></tr>`;
  }).join('');
}

const _LEVEL_COLOUR = { ERROR: 'text-error', WARNING: 'text-warning', INFO: 'text-info', DEBUG: 'text-base-content/50' };
const _LEVEL_ORDER = { DEBUG: 0, INFO: 1, WARNING: 2, ERROR: 3 };

function fillLogViewer(logs) {
  const viewer = document.getElementById('logViewer');
  if (!viewer) return;
  const filterEl = document.getElementById('logLevelFilter');
  const minLevel = _LEVEL_ORDER[filterEl ? filterEl.value : 'ALL'] ?? -1;
  const autoScroll = document.getElementById('logAutoScroll');
  const shouldScroll = !autoScroll || autoScroll.checked;

  const lines = [...logs].reverse().filter(e => (_LEVEL_ORDER[e.level] ?? 1) >= minLevel);
  if (lines.length === 0) {
    viewer.innerHTML = '<div class="p-2 text-base-content/40">No log entries match the filter.</div>';
    return;
  }
  viewer.innerHTML = lines.map(e => {
    const t = new Date(e.ts * 1000).toLocaleTimeString();
    const cls = _LEVEL_COLOUR[e.level] || 'text-base-content';
    const lvl = e.level.padEnd(7);
    const msg = e.msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<div class="px-2 py-px hover:bg-base-100"><span class="text-base-content/40">${t}</span> <span class="${cls} font-bold">${lvl}</span> <span class="text-base-content/80">${msg}</span></div>`;
  }).join('');
  if (shouldScroll) viewer.scrollTop = 0;
}

function fillPortFreshness(stats) {
  const wrapper = document.getElementById('diagPortFreshness');
  if (!wrapper) return;
  const freshness = stats.port_freshness_age_sec || {};
  const cards = [];
  for (const portId of ['1', '2', '3', '4']) {
    const age = freshness[portId];
    const ageClass = age == null ? 'text-base-content' : getClassForUpperBound(age, 10, 30);
    cards.push(`
      <div class="p-3 rounded-lg bg-base-100 border border-base-300">
        <div class="text-xs text-base-content/60">Port ${portId}</div>
        <div class="text-lg font-semibold ${ageClass}">${age == null ? '-' : `${age}s`}</div>
      </div>
    `);
  }
  wrapper.innerHTML = cards.join('');
}

function fillStats(stats) {
  const setText = (id, value, cls = '') => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
    if (cls) el.className = `font-semibold ${cls}`;
  };

  const uptime = document.getElementById('diagUptime');
  if (uptime) {
    const u = stats.uptime_pct_1h;
    uptime.textContent = u != null ? `${u}%` : '-';
    uptime.className = `text-3xl font-bold ${getClassForValue(u, 99, 90)}`;
  }
  const drops = document.getElementById('diagDrops');
  if (drops) {
    const d = stats.drops_1h;
    drops.textContent = d != null ? d : '-';
    drops.className = `text-3xl font-bold ${getClassForUpperBound(d, 1, 3)}`;
  }
  const p95 = document.getElementById('diagP95');
  if (p95) {
    const r = stats.request_rtt_p95_ms;
    p95.textContent = r != null ? `${r} ms` : '-';
    p95.className = `text-3xl font-bold ${getClassForUpperBound(r, 800, 2000)}`;
  }
  const cf = document.getElementById('diagConsecFail');
  if (cf) {
    const c = stats.consecutive_failures;
    cf.textContent = c != null ? c : '-';
    cf.className = `text-3xl font-bold ${c > 0 ? 'text-error' : 'text-success'}`;
  }

  const sr = stats.request_success_rate_pct;
  setText('diagSuccessRate', sr != null ? `${sr}%` : '-', getClassForValue(sr, 99.0, 95.0));
  setText('diagCircuitState', stats.circuit_state || '-', stats.circuit_state === 'open' ? 'text-error' : 'text-success');
  setText('diagReconnects', stats.reconnect_count ?? '-', (stats.reconnect_count || 0) > 0 ? 'text-warning' : 'text-success');
  setText('diagLastGood', stats.last_good_data_ts ? new Date(stats.last_good_data_ts * 1000).toLocaleTimeString() : '-', '');

  const link = stats.link || {};
  const iface = link.iface || 'none';
  const carrier = link.carrier_up === true ? 'carrier up' : (link.carrier_up === false ? 'carrier down' : 'carrier unknown');
  const route = link.has_route_to_master === true ? 'route ok' : (link.has_route_to_master === false ? 'no route' : 'route unknown');
  const linkEl = document.getElementById('diagLinkState');
  if (linkEl) {
    linkEl.textContent = `${iface} | ${carrier} | ${route}`;
    linkEl.className = `font-semibold text-sm ${link.has_route_to_master && link.carrier_up ? 'text-success' : 'text-warning'}`;
  }

  fillPortFreshness(stats);
}

function fillHealthTable(data) {
  const tbody = document.getElementById('healthTableBody');
  if (!tbody) return;
  const isConnected = data.success || false;
  const lastUpdate = new Date().toLocaleTimeString();
  const ports = Array.isArray(data.ports) ? data.ports : [];
  const activePorts = ports.filter(p => p.mode === 'io-link' || p.mode === 'digital_in' || p.mode === 'digital_out');
  const rows = [];
  rows.push(`<tr>
    <td class="font-medium">IO-Link Master</td>
    <td><span class="badge badge-sm ${isConnected ? 'badge-success' : 'badge-error'}">${isConnected ? 'Connected' : 'Disconnected'}</span></td>
    <td class="text-xs">${lastUpdate}</td>
    <td class="text-xs">${activePorts.length} active port${activePorts.length !== 1 ? 's' : ''} · ${data.source || '-'}</td>
  </tr>`);
  ports.forEach(port => {
    const active = port.mode === 'io-link';
    const modeClass = active ? 'badge-success' : (port.mode === 'error' ? 'badge-error' : 'badge-ghost');
    const label = port.label || port.name || `Port ${port.port}`;
    const detail = port.pdin_decoded?.description || port.device_type || port.mode || '-';
    rows.push(`<tr>
      <td>Port ${port.port} <span class="opacity-60">— ${label}</span></td>
      <td><span class="badge badge-sm ${modeClass}">${port.mode || 'inactive'}</span></td>
      <td class="text-xs">${lastUpdate}</td>
      <td class="text-xs">${detail}</td>
    </tr>`);
  });
  tbody.innerHTML = rows.join('');
}

function fillDegradedBanner(stats) {
  const banner = document.getElementById('diagDegradedBanner');
  const text = document.getElementById('diagDegradedText');
  if (!banner || !text) return;
  if (stats.degraded_mode) {
    banner.classList.remove('hidden');
    text.textContent = `Degraded mode active: ${stats.degraded_reason || 'using fallback polling'}`;
  } else {
    banner.classList.add('hidden');
    text.textContent = '';
  }
}

async function refreshDiagnostics() {
  try {
    const [diagRes, cfgRes, logsRes] = await Promise.all([
      fetch(`${API_BASE}/api/io-link/diagnostics`),
      fetch(`${API_BASE}/api/io-link/config`),
      fetch(`${API_BASE}/api/logs?n=200`),
    ]);
    const data = await diagRes.json();
    const cfg = await cfgRes.json();
    const logsData = await logsRes.json().catch(() => ({ logs: [] }));
    if (!data.success) return;
    if (data.start_ts) _backendStartTs = data.start_ts;

    // Populate text/table content first so a chart error never blocks it
    fillStats(data.stats || {});
    fillDegradedBanner(data.stats || {});
    fillEventsTable(data.events || []);
    fillLogViewer(logsData.logs || []);
    // Charts last — errors here don't affect the tables above
    destroyCharts();
    buildTimelineChart(data.events || []);
    buildLatencyChart(data.latencies || []);

    const masterTarget = data.stats?.master_target || {};
    const lastEl = document.getElementById('diagLastRefresh');
    if (lastEl) {
      const timeout = cfg.io_link ? (cfg.io_link.timeout_sec || 2) : 2;
      const target = masterTarget.ip ? ` | Master: ${masterTarget.ip}:${masterTarget.port}` : '';
      lastEl.textContent = `Last refresh: ${new Date().toLocaleTimeString()} | Timeout: ${timeout}s${target}`;
    }
  } catch (_) {
    // Keep the page stable if diagnostics are temporarily unavailable.
  }
}

function connectDiagSocket() {
  if (!_diagPageActive) return;
  _diagSocket = new WebSocket(`${WS_BASE}/ws`);

  _diagSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      fillHealthTable(data);
      if (_terminalLog && data.ports && Array.isArray(data.ports)) {
        data.ports.forEach(port => {
          _terminalLog.append({
            port: port.port,
            portName: port.name || `Port ${port.port}`,
            pdinHex: port.pdin_hex || '00',
            pdoutHex: port.pdout_hex || '00',
            pdinDecoded: port.pdin_decoded?.description || '',
            pdoutDecoded: port.pdout_decoded?.description || '',
            level: 'normal'
          });
        });
      }
    } catch (_) {}
  };

  _diagSocket.onclose = () => {
    if (!_diagPageActive) return;
    if (_diagReconnectTimer) clearTimeout(_diagReconnectTimer);
    _diagReconnectTimer = setTimeout(connectDiagSocket, 5000);
  };
}

export function initAdminPage() {
  _diagPageActive = true;
  refreshDiagnostics();
  _refreshInterval = setInterval(refreshDiagnostics, 2000);
  _tickInterval = setInterval(tickUptimeCounter, 1000);
  const btn = document.getElementById('diagRefreshBtn');
  if (btn) btn.onclick = refreshDiagnostics;
  document.addEventListener('change', e => {
    if (e.target && e.target.id === 'logLevelFilter') refreshDiagnostics();
  });

  _terminalLog = new TerminalLog('diag-terminal-container');
  _terminalLog.init();
  connectDiagSocket();
}

export function destroyAdminPage() {
  _diagPageActive = false;
  if (_refreshInterval) { clearInterval(_refreshInterval); _refreshInterval = null; }
  if (_tickInterval) { clearInterval(_tickInterval); _tickInterval = null; }
  if (_diagReconnectTimer) { clearTimeout(_diagReconnectTimer); _diagReconnectTimer = null; }
  if (_diagSocket) { _diagSocket.close(); _diagSocket = null; }
  if (_terminalLog) { _terminalLog.destroy(); _terminalLog = null; }
  _lastDropTs = null;
  _backendStartTs = null;
  destroyCharts();
}
