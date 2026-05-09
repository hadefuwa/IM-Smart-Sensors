import Chart from 'chart.js/auto';

const API_BASE = window.IO_LINK_API_BASE || window.location.origin;
const MAX_POINTS = 50;

let _cpuBuf = [];
let _memBuf = [];
let _charts = [];
let _interval = null;

export function renderEdgeDevicePage() {
  return `
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 class="text-2xl font-bold text-base-content">Edge Device</h1>
          <p class="text-base-content/70">Raspberry Pi runtime health and system diagnostics.</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="badge badge-outline font-mono text-xs" id="edgeHostname"></span>
          <span class="text-xs text-base-content/50" id="edgeLastRefresh">-</span>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="card bg-base-200 shadow border border-base-300">
          <div class="card-body p-4 text-center">
            <div class="text-3xl font-bold" id="edgeCpuPct">-</div>
            <div class="text-xs text-base-content/60 mt-1">CPU usage</div>
          </div>
        </div>
        <div class="card bg-base-200 shadow border border-base-300">
          <div class="card-body p-4 text-center">
            <div class="text-3xl font-bold" id="edgeCpuTemp">-</div>
            <div class="text-xs text-base-content/60 mt-1">CPU temperature</div>
          </div>
        </div>
        <div class="card bg-base-200 shadow border border-base-300">
          <div class="card-body p-4 text-center">
            <div class="text-3xl font-bold" id="edgeMemPct">-</div>
            <div class="text-xs text-base-content/60 mt-1" id="edgeMemLabel">Memory usage</div>
          </div>
        </div>
        <div class="card bg-base-200 shadow border border-base-300">
          <div class="card-body p-4 text-center">
            <div class="text-3xl font-bold" id="edgeLoad1m">-</div>
            <div class="text-xs text-base-content/60 mt-1">Load average (1m)</div>
          </div>
        </div>
      </div>

      <!-- Services + Device Info -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="card bg-base-200 shadow-xl border border-base-300">
          <div class="card-body">
            <h2 class="card-title text-base-content text-base">Services</h2>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="p-3 rounded-lg bg-base-100 border border-base-300">
                <div class="text-base-content/60">Backend API</div>
                <div id="edgeBackendStatus" class="font-semibold text-lg">-</div>
              </div>
              <div class="p-3 rounded-lg bg-base-100 border border-base-300">
                <div class="text-base-content/60">Cursor service</div>
                <div id="edgeUnclutter" class="font-semibold text-lg">-</div>
              </div>
              <div class="p-3 rounded-lg bg-base-100 border border-base-300 col-span-2">
                <div class="text-base-content/60">Chromium processes</div>
                <div id="edgeChromiumCount" class="font-semibold text-lg">-</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-200 shadow-xl border border-base-300">
          <div class="card-body">
            <h2 class="card-title text-base-content text-base">Device Info</h2>
            <div class="grid grid-cols-1 gap-3 text-sm">
              <div class="p-3 rounded-lg bg-base-100 border border-base-300">
                <div class="text-base-content/60">Hostname</div>
                <div id="edgeHostnameCard" class="font-semibold text-xl font-mono">-</div>
              </div>
              <div class="p-3 rounded-lg bg-base-100 border border-base-300">
                <div class="text-base-content/60">Memory used</div>
                <div id="edgeMemUsedMb" class="font-semibold text-xl">-</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CPU chart -->
      <div class="card bg-base-200 shadow-xl border border-base-300">
        <div class="card-body">
          <h2 class="card-title text-base-content text-base">CPU Usage (%)</h2>
          <p class="text-xs text-base-content/60">Sampled every 2 s. Last ${MAX_POINTS} readings.</p>
          <div class="h-40 mt-2"><canvas id="edgeCpuChart"></canvas></div>
        </div>
      </div>

      <!-- Memory chart -->
      <div class="card bg-base-200 shadow-xl border border-base-300">
        <div class="card-body">
          <h2 class="card-title text-base-content text-base">Memory Usage (%)</h2>
          <p class="text-xs text-base-content/60">Sampled every 2 s. Last ${MAX_POINTS} readings.</p>
          <div class="h-40 mt-2"><canvas id="edgeMemChart"></canvas></div>
        </div>
      </div>
    </div>
  `;
}

function _fmtTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function _upperClass(value, warn, crit) {
  if (value == null) return 'text-base-content';
  if (value >= crit) return 'text-error';
  if (value >= warn) return 'text-warning';
  return 'text-success';
}

function _buildRollingChart(canvasId, color, yMax = 100) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const chart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        data: [],
        borderColor: color,
        backgroundColor: color.replace(')', ', 0.1)').replace('rgb', 'rgba'),
        fill: true,
        pointRadius: 2,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxTicksLimit: 8, maxRotation: 0 } },
        y: { min: 0, max: yMax, ticks: { callback: v => `${v}%` } },
      },
    },
  });
  _charts.push(chart);
  return chart;
}

function _pushPoint(buf, chart, label, value) {
  buf.push({ label, value });
  if (buf.length > MAX_POINTS) buf.shift();
  if (!chart) return;
  chart.data.labels = buf.map(p => p.label);
  chart.data.datasets[0].data = buf.map(p => p.value);
  chart.update('none');
}

let _cpuChart = null;
let _memChart = null;

function _fillStats(data) {
  const sys = data.system || {};
  const now = _fmtTime();

  const setText = (id, text, cls) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    if (cls) el.className = `font-semibold text-3xl ${cls}`;
  };

  setText('edgeCpuPct', sys.cpu_pct != null ? `${sys.cpu_pct}%` : '-', _upperClass(sys.cpu_pct, 70, 90));
  setText('edgeCpuTemp', sys.cpu_temp_c != null ? `${sys.cpu_temp_c}°C` : '-', _upperClass(sys.cpu_temp_c, 70, 82));
  setText('edgeMemPct', sys.mem_pct != null ? `${sys.mem_pct}%` : '-', _upperClass(sys.mem_pct, 75, 90));
  setText('edgeLoad1m', sys.load_1m != null ? String(sys.load_1m) : '-', _upperClass(sys.load_1m, 2.5, 4.0));

  const memLabel = document.getElementById('edgeMemLabel');
  if (memLabel && sys.mem_used_mb != null) memLabel.textContent = `Memory (${sys.mem_used_mb} MB used)`;

  const memUsed = document.getElementById('edgeMemUsedMb');
  if (memUsed) memUsed.textContent = sys.mem_used_mb != null ? `${sys.mem_used_mb} MB` : '-';

  const unclutterEl = document.getElementById('edgeUnclutter');
  if (unclutterEl) {
    unclutterEl.textContent = sys.unclutter_running == null ? 'unknown' : (sys.unclutter_running ? 'running' : 'not running');
    unclutterEl.className = `font-semibold text-lg ${sys.unclutter_running ? 'text-success' : 'text-warning'}`;
  }

  const chromiumEl = document.getElementById('edgeChromiumCount');
  if (chromiumEl) {
    const count = sys.chromium_proc_count;
    chromiumEl.textContent = count != null ? `${count} process${count !== 1 ? 'es' : ''}` : '-';
    chromiumEl.className = `font-semibold text-lg ${count > 15 ? 'text-error' : count > 8 ? 'text-warning' : 'text-success'}`;
  }

  const backendEl = document.getElementById('edgeBackendStatus');
  if (backendEl) {
    backendEl.textContent = 'Online';
    backendEl.className = 'font-semibold text-lg text-success';
  }

  const hostnameEl = document.getElementById('edgeHostname');
  const hostnameCard = document.getElementById('edgeHostnameCard');
  if (hostnameEl && data.hostname) hostnameEl.textContent = data.hostname;
  if (hostnameCard && data.hostname) hostnameCard.textContent = data.hostname;

  const lastRefresh = document.getElementById('edgeLastRefresh');
  if (lastRefresh) lastRefresh.textContent = `Last refresh: ${now}`;

  _pushPoint(_cpuBuf, _cpuChart, now, sys.cpu_pct ?? null);
  _pushPoint(_memBuf, _memChart, now, sys.mem_pct ?? null);
}

async function _refresh() {
  try {
    const res = await fetch(`${API_BASE}/api/system/health`);
    const data = await res.json();
    if (data.success) _fillStats(data);
  } catch (_) {
    const backendEl = document.getElementById('edgeBackendStatus');
    if (backendEl) {
      backendEl.textContent = 'Unreachable';
      backendEl.className = 'font-semibold text-lg text-error';
    }
  }
}

export function initEdgeDevicePage() {
  _cpuBuf = [];
  _memBuf = [];
  _cpuChart = _buildRollingChart('edgeCpuChart', 'rgb(251, 146, 60)');
  _memChart = _buildRollingChart('edgeMemChart', 'rgb(56, 189, 248)');
  _refresh();
  _interval = setInterval(_refresh, 2000);
}

export function destroyEdgeDevicePage() {
  if (_interval) { clearInterval(_interval); _interval = null; }
  _charts.forEach(c => { try { c.destroy(); } catch (_) {} });
  _charts = [];
  _cpuChart = null;
  _memChart = null;
  _cpuBuf = [];
  _memBuf = [];
}
