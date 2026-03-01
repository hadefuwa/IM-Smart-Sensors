/**
 * Admin – IO-Link Diagnostics page.
 * Shows connection uptime, drop events, and per-poll response latency.
 */

import Chart from 'chart.js/auto';

const API_BASE = window.IO_LINK_API_BASE || window.location.origin;

export function renderAdminPage() {
  return `
    <div class="space-y-4 admin-diag-page">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 class="text-2xl font-bold text-base-content">IO-Link Diagnostics</h1>
          <p class="text-base-content/70">Connection health, drop events and poll latency for the AL1350 master.</p>
        </div>
        <div class="flex items-center gap-3">
          <button type="button" id="diagRefreshBtn" class="btn btn-outline btn-sm">Refresh now</button>
          <span class="text-xs text-base-content/50" id="diagLastRefresh">–</span>
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="card bg-base-200 shadow border border-base-300">
          <div class="card-body p-4 text-center">
            <div class="text-3xl font-bold text-success" id="diagUptime">–</div>
            <div class="text-xs text-base-content/60 mt-1">Uptime % (last hour)</div>
          </div>
        </div>
        <div class="card bg-base-200 shadow border border-base-300">
          <div class="card-body p-4 text-center">
            <div class="text-3xl font-bold text-warning" id="diagDrops">–</div>
            <div class="text-xs text-base-content/60 mt-1">Drops (last hour)</div>
          </div>
        </div>
        <div class="card bg-base-200 shadow border border-base-300">
          <div class="card-body p-4 text-center">
            <div class="text-3xl font-bold text-info" id="diagAvgLat">–</div>
            <div class="text-xs text-base-content/60 mt-1">Avg latency (ms)</div>
          </div>
        </div>
        <div class="card bg-base-200 shadow border border-base-300">
          <div class="card-body p-4 text-center">
            <div class="text-3xl font-bold text-error" id="diagConsecFail">–</div>
            <div class="text-xs text-base-content/60 mt-1">Consecutive failures</div>
          </div>
        </div>
      </div>

      <!-- Connection timeline chart -->
      <div class="card bg-base-200 shadow-xl border border-base-300">
        <div class="card-body">
          <h2 class="card-title text-base-content text-base">Connection Timeline</h2>
          <p class="text-xs text-base-content/60">1 = connected, 0 = disconnected. Each point is a state-change event.</p>
          <div class="h-40 mt-2"><canvas id="diagTimelineChart"></canvas></div>
        </div>
      </div>

      <!-- Latency chart -->
      <div class="card bg-base-200 shadow-xl border border-base-300">
        <div class="card-body">
          <h2 class="card-title text-base-content text-base">Poll Latency (ms)</h2>
          <p class="text-xs text-base-content/60">Round-trip time per poll cycle to the IO-Link master. Dashed line = configured timeout.</p>
          <div class="h-40 mt-2"><canvas id="diagLatencyChart"></canvas></div>
        </div>
      </div>

      <!-- Recent events table -->
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
                  <th>Error</th>
                </tr>
              </thead>
              <tbody id="diagEventsBody">
                <tr><td colspan="4" class="text-center text-base-content/50">Loading…</td></tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-base-content/40 mt-2">Auto-refreshes every 10 s. Shows last 200 events.</p>
        </div>
      </div>
    </div>
  `;
}

let _charts = [];
let _refreshInterval = null;

function destroyCharts() {
  _charts.forEach(c => { try { c.destroy(); } catch (_) {} });
  _charts = [];
}

function buildTimelineChart(events) {
  const canvas = document.getElementById('diagTimelineChart');
  if (!canvas) return;

  // Build a step dataset from events. Each event marks the END of the previous run.
  // We plot two points per event to get a clean step.
  const pts = [];
  let curStatus = events.length > 0 ? (events[0].status === 'connected' ? 0 : 1) : 1;

  for (const ev of events) {
    const ts = ev.ts * 1000;
    const newVal = ev.status === 'connected' ? 1 : 0;
    pts.push({ x: ts - (ev.duration_sec * 1000), y: curStatus });
    pts.push({ x: ts, y: newVal });
    curStatus = newVal;
  }
  // Extend to now
  if (pts.length > 0) pts.push({ x: Date.now(), y: curStatus });

  if (pts.length === 0) {
    pts.push({ x: Date.now() - 60000, y: 1 }, { x: Date.now(), y: 1 });
  }

  const chart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      datasets: [{
        data: pts,
        borderColor: ctx => {
          const v = ctx.raw?.y;
          return v === 1 ? '#22c55e' : '#ef4444';
        },
        segment: {
          borderColor: ctx => ctx.p0.parsed.y === 1 ? '#22c55e' : '#ef4444',
          backgroundColor: ctx => ctx.p0.parsed.y === 1 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
        },
        backgroundColor: 'rgba(34,197,94,0.1)',
        fill: true,
        stepped: true,
        pointRadius: 3,
        tension: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      plugins: { legend: { display: false }, tooltip: {
        callbacks: {
          label: ctx => ctx.raw.y === 1 ? 'Connected' : 'Disconnected',
          title: ctx => new Date(ctx[0].raw.x).toLocaleTimeString(),
        }
      }},
      scales: {
        x: { type: 'time', time: { tooltipFormat: 'HH:mm:ss' }, ticks: { maxTicksLimit: 8 } },
        y: { min: -0.1, max: 1.1, ticks: { stepSize: 1, callback: v => v === 1 ? 'OK' : v === 0 ? 'Down' : '' } }
      }
    }
  });
  _charts.push(chart);
}

function buildLatencyChart(latencies, timeoutMs) {
  const canvas = document.getElementById('diagLatencyChart');
  if (!canvas) return;

  const pts = latencies.map(p => ({ x: p.ts * 1000, y: p.latency_ms }));

  const annotations = {};
  if (timeoutMs) {
    annotations.timeoutLine = {
      type: 'line',
      yMin: timeoutMs,
      yMax: timeoutMs,
      borderColor: 'rgba(239,68,68,0.6)',
      borderWidth: 1,
      borderDash: [6, 3],
      label: { display: true, content: `Timeout ${timeoutMs}ms`, position: 'end', color: 'rgba(239,68,68,0.8)', font: { size: 10 } }
    };
  }

  const chart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      datasets: [{
        data: pts,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56,189,248,0.1)',
        fill: true,
        pointRadius: 2,
        tension: 0.3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: ctx => new Date(ctx[0].raw.x).toLocaleTimeString(),
            label: ctx => `${ctx.raw.y} ms`,
          }
        }
      },
      scales: {
        x: { type: 'time', time: { tooltipFormat: 'HH:mm:ss' }, ticks: { maxTicksLimit: 8 } },
        y: { beginAtZero: true, ticks: { callback: v => v + ' ms' } }
      }
    }
  });
  _charts.push(chart);
}

function fillStats(stats) {
  const uptime = document.getElementById('diagUptime');
  const drops = document.getElementById('diagDrops');
  const lat = document.getElementById('diagAvgLat');
  const fail = document.getElementById('diagConsecFail');

  if (uptime) {
    uptime.textContent = stats.uptime_pct_1h != null ? stats.uptime_pct_1h + '%' : '–';
    uptime.className = 'text-3xl font-bold ' + (stats.uptime_pct_1h >= 99 ? 'text-success' : stats.uptime_pct_1h >= 90 ? 'text-warning' : 'text-error');
  }
  if (drops) drops.textContent = stats.drops_1h != null ? stats.drops_1h : '–';
  if (lat) lat.textContent = stats.avg_latency_ms != null ? stats.avg_latency_ms + ' ms' : '–';
  if (fail) {
    fail.textContent = stats.consecutive_failures != null ? stats.consecutive_failures : '–';
    fail.className = 'text-3xl font-bold ' + (stats.consecutive_failures > 0 ? 'text-error' : 'text-success');
  }
}

function fillEventsTable(events) {
  const tbody = document.getElementById('diagEventsBody');
  if (!tbody) return;
  const reversed = [...events].reverse();
  if (reversed.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-base-content/50">No events recorded yet.</td></tr>';
    return;
  }
  tbody.innerHTML = reversed.map(ev => {
    const t = new Date(ev.ts * 1000).toLocaleTimeString();
    const badge = ev.status === 'connected'
      ? '<span class="badge badge-success badge-sm">Connected</span>'
      : '<span class="badge badge-error badge-sm">Disconnected</span>';
    const dur = ev.duration_sec != null ? ev.duration_sec + ' s' : '–';
    const err = ev.error ? `<span class="text-error text-xs">${ev.error}</span>` : '<span class="text-base-content/30">–</span>';
    return `<tr><td class="text-xs">${t}</td><td>${badge}</td><td>${dur}</td><td>${err}</td></tr>`;
  }).join('');
}

async function refreshDiagnostics() {
  try {
    const [diagRes, cfgRes] = await Promise.all([
      fetch(`${API_BASE}/api/io-link/diagnostics`),
      fetch(`${API_BASE}/api/io-link/config`),
    ]);
    const data = await diagRes.json();
    const cfg = await cfgRes.json();

    if (!data.success) return;

    const timeoutMs = cfg.io_link ? (cfg.io_link.timeout_sec || 2) * 1000 : 2000;

    destroyCharts();
    fillStats(data.stats || {});
    buildTimelineChart(data.events || []);
    buildLatencyChart(data.latencies || [], timeoutMs);
    fillEventsTable(data.events || []);

    const lastEl = document.getElementById('diagLastRefresh');
    if (lastEl) lastEl.textContent = 'Last refresh: ' + new Date().toLocaleTimeString();
  } catch (_) {}
}

export function initAdminPage() {
  refreshDiagnostics();
  _refreshInterval = setInterval(refreshDiagnostics, 10000);

  const btn = document.getElementById('diagRefreshBtn');
  if (btn) btn.onclick = refreshDiagnostics;
}

export function destroyAdminPage() {
  if (_refreshInterval) { clearInterval(_refreshInterval); _refreshInterval = null; }
  destroyCharts();
}
