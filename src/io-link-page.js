/**
 * IO-Link Master page for Matrix Template
 * Connects to FastAPI backend via WebSocket for real-time data.
 */

import Chart from 'chart.js/auto';
import { resolveVendorName, resolveDeviceName } from './io-link-vendors.js';

// API/WebSocket base – when using Vite dev server (e.g. 5173), point to FastAPI (8000)
const resolveApiBase = () => {
  if (window.IO_LINK_API_BASE) return window.IO_LINK_API_BASE;
  const { protocol, hostname } = window.location;
  return protocol + '//' + hostname + ':8000';
};
const API_BASE = resolveApiBase();
const WS_BASE = API_BASE.replace(/^http/, 'ws');


const SOURCE_BADGE = {
  mqtt:          'badge-success',
  getdatamulti:  'badge-info',
  fallback:      'badge-warning',
  error:         'badge-error',
  pending:       'badge-ghost',
};

const MODE_COLOR = {
  'io-link':    'border-success',
  'digital_in': 'border-info',
  'digital_out':'border-info',
  'error':      'border-error',
};

function _portCardHtml(n) {
  return `
    <div class="card bg-base-200 shadow-xl border-l-4 border-transparent transition-colors duration-500" id="pc-${n}">
      <div class="card-body p-3 space-y-2">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-3xl font-black font-mono text-base-content/15 leading-none select-none">${n}</span>
            <div class="min-w-0">
              <div class="font-semibold text-sm truncate" id="pc-${n}-label">—</div>
              <span class="badge badge-sm mt-0.5" id="pc-${n}-mode">—</span>
            </div>
          </div>
          <div class="flex flex-col items-end gap-1 flex-shrink-0">
            <span class="badge badge-xs font-mono" id="pc-${n}-source">—</span>
            <span class="text-xs opacity-40 font-mono" id="pc-${n}-fresh"></span>
          </div>
        </div>
        <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs font-mono">
          <span class="opacity-40">Vendor</span><span id="pc-${n}-vendor">—</span>
          <span class="opacity-40">Device</span><span id="pc-${n}-device">—</span>
          <span class="opacity-40">PDin</span><span id="pc-${n}-pdin" class="font-mono truncate">—</span>
        </div>
        <div id="pc-${n}-events" class="flex flex-wrap gap-1"></div>
        <div id="pc-${n}-nodev" class="hidden text-xs text-warning font-medium">⚠ IO-Link mode — no device detected</div>
        <div id="pc-${n}-blurb" class="text-xs opacity-50 leading-relaxed hidden"></div>
        <div id="pc-${n}-action" class="hidden">
          <button type="button" class="btn btn-xs btn-outline btn-warning port-mode-switch-btn" data-port="${n}" data-mode="io-link">
            Switch to IO-Link
          </button>
        </div>
      </div>
    </div>`;
}

export function renderIOLinkMaster() {
  const imgSrc = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL
    ? import.meta.env.BASE_URL + 'assets/img/AL1350.png'
    : '/assets/img/AL1350.png';
  return `
    <div class="space-y-3 io-link-page">

      <!-- ── Master Header ── -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body py-3 px-4 relative overflow-hidden">
          <img id="productImage" src="${imgSrc}" alt="" aria-hidden="true"
            class="absolute right-2 top-1/2 -translate-y-1/2 h-20 w-auto object-contain opacity-10 pointer-events-none select-none"
            onerror="this.style.display='none';" />
          <div class="relative space-y-2">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="font-bold text-lg" id="deviceName">IFM AL1350</h2>
              <span class="badge" id="connectionBadge">Connecting…</span>
              <span class="badge badge-outline badge-sm font-mono" id="sourceBadge">—</span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-0.5 text-xs font-mono">
              <span class="opacity-40">IP Address</span><span id="masterIpDisplay">—</span>
              <span class="opacity-40">Bootloader</span><span id="masterBootloader">—</span>
            </div>
            <div id="degradedAlert" class="hidden alert alert-warning py-1 px-2 text-xs gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <span id="degradedAlertText">Degraded mode active — falling back to per-request HTTP polling</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Connection Health KPIs ── -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div class="card bg-base-200 shadow-sm">
          <div class="card-body p-3 text-center">
            <div class="text-xs opacity-40 uppercase tracking-wider mb-1">Circuit Breaker</div>
            <span class="badge badge-lg font-mono" id="circuitStateBadge">—</span>
            <div class="text-xs opacity-40 mt-1">Failures: <span id="circuitFailures">—</span></div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-sm">
          <div class="card-body p-3 text-center">
            <div class="text-xs opacity-40 uppercase tracking-wider mb-1">Uptime (1 hr)</div>
            <div class="text-2xl font-bold font-mono" id="uptimePct">—</div>
            <div class="text-xs opacity-40 mt-0.5">Drops: <span id="drops1h">—</span></div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-sm">
          <div class="card-body p-3 text-center">
            <div class="text-xs opacity-40 uppercase tracking-wider mb-1">Avg Latency</div>
            <div class="text-2xl font-bold font-mono" id="avgLatency">—</div>
            <div class="text-xs opacity-40 mt-0.5">P95: <span id="p95Latency">—</span></div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-sm">
          <div class="card-body p-3 text-center">
            <div class="text-xs opacity-40 uppercase tracking-wider mb-1">Request Success</div>
            <div class="text-2xl font-bold font-mono" id="requestSuccessRate">—</div>
            <div class="text-xs opacity-40 mt-0.5">MQTT: <span id="mqttState">—</span></div>
          </div>
        </div>
      </div>

      <!-- ── Port Status Cards ── -->
      <div>
        <h2 class="text-xs font-semibold opacity-40 uppercase tracking-wider px-1 mb-2">Port Status</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3" id="portCardsGrid">
          ${[1,2,3,4].map(_portCardHtml).join('')}
        </div>
      </div>

      <!-- ── Power Supervision ── -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body py-3 px-4 space-y-3">
          <h2 class="font-bold text-base">Power Supervision</h2>
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-base-100 rounded-xl p-3 text-center">
              <div class="text-xs opacity-40 uppercase tracking-wider">Voltage</div>
              <div class="text-2xl font-bold font-mono mt-1" id="kpiVoltage">—</div>
              <div class="text-xs opacity-40">V</div>
            </div>
            <div class="bg-base-100 rounded-xl p-3 text-center">
              <div class="text-xs opacity-40 uppercase tracking-wider">Current</div>
              <div class="text-2xl font-bold font-mono mt-1" id="kpiCurrent">—</div>
              <div class="text-xs opacity-40">A</div>
            </div>
            <div class="bg-base-100 rounded-xl p-3 text-center">
              <div class="text-xs opacity-40 uppercase tracking-wider">Temperature</div>
              <div class="text-2xl font-bold font-mono mt-1" id="kpiTemp">—</div>
              <div class="text-xs opacity-40">°C</div>
            </div>
          </div>
          <div id="supervisionStatusRow" class="hidden text-xs font-mono opacity-50">
            Supervision status register: <span id="supervisionStatus">—</span>
            <span class="ml-2 opacity-60">(non-zero indicates master alert condition)</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <p class="text-xs opacity-40 text-center mb-1">Current (A) · history</p>
              <div class="h-28"><canvas id="chartCurrent"></canvas></div>
            </div>
            <div>
              <p class="text-xs opacity-40 text-center mb-1">Voltage (V) · history</p>
              <div class="h-28"><canvas id="chartVoltage"></canvas></div>
            </div>
            <div>
              <p class="text-xs opacity-40 text-center mb-1">Temperature (°C) · history</p>
              <div class="h-28"><canvas id="chartTemp"></canvas></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Active Port Details (IODD parameter panels) ── -->
      <div id="portDetailsSection" class="card bg-base-200 shadow-xl hidden">
        <div class="card-body py-3 px-4">
          <h2 class="font-bold text-base">Device Parameters (IO-Link ISDU)</h2>
          <p class="text-xs opacity-60">Parameters read directly from each sensor over the IO-Link acyclic channel. Writable parameters can be changed here and take effect immediately.</p>
          <div id="portDetailsContainer" class="mt-2"></div>
        </div>
      </div>

      <!-- ── Simulate Fault (Training) ── -->
      <div id="simulate-fault" class="card bg-base-200 shadow-xl">
        <div class="card-body py-3 px-4">
          <h2 class="font-bold text-base">Simulate Fault (Training)</h2>
          <p class="text-xs opacity-60 mb-2">Inject a training fault event onto a port. The fault appears in the Active Port Details panel and the HMI dashboard event log. Clear it when the exercise is complete.</p>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm">Port:</span>
            <select id="simulateFaultPort" class="select select-bordered select-sm touch-fault-port">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
            <span class="text-sm">Fault:</span>
            <select id="simulateFaultEvent" class="select select-bordered select-sm touch-fault-event">
              <option value="">— Select fault —</option>
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
let hasEverConnected = false;
let _diagInterval = null;
const MAX_RECONNECT = 10;
const RECONNECT_DELAY = 5000;

function showConnecting(msg) {
  const badge = document.getElementById('connectionBadge');
  if (badge) { badge.textContent = msg || 'Connecting…'; badge.className = 'badge badge-ghost'; }
}

function showError(msg, clearData) {
  const badge = document.getElementById('connectionBadge');
  if (badge) { badge.textContent = msg; badge.className = 'badge badge-error'; }
  const src = document.getElementById('sourceBadge');
  if (src) src.textContent = '—';
  if (clearData || !lastGoodData) {
    updatePortCards([]);
    updateSupervisionKpis({});
    updateMasterInfo({});
  }
}

function updateUI(data) {
  if (!data || !data.success) {
    if (data && data.error) showError('Error: ' + data.error, false);
    return;
  }
  hasEverConnected = true;
  lastGoodData = data;

  const badge = document.getElementById('connectionBadge');
  if (badge) { badge.textContent = 'Connected'; badge.className = 'badge badge-success'; }

  const src = document.getElementById('sourceBadge');
  if (src) src.textContent = data.source || 'ws';

  const name = document.getElementById('deviceName');
  if (name) name.textContent = data.device_name || 'IO-Link Master';

  const ipEl = document.getElementById('masterIpDisplay');
  if (ipEl) ipEl.textContent = data.master_ip || '—';

  const degradedAlert = document.getElementById('degradedAlert');
  if (degradedAlert) degradedAlert.classList.toggle('hidden', !data.degraded_mode);

  updatePortCards(data.ports || []);
  updateSupervisionKpis(data.supervision || {});
  updateMasterInfo(data.software || {});
  updateSupervisionCharts();
}

function updatePortCards(ports) {
  if (!ports || ports.length === 0) return;
  for (const p of ports) {
    const n = p.port;
    const card = document.getElementById(`pc-${n}`);
    if (!card) continue;

    const mode = (p.mode || 'inactive').toLowerCase();
    const isIOLink = mode === 'io-link';
    const isError  = mode === 'error';

    // Border colour
    card.className = card.className.replace(/border-\S+/g, '').trim();
    card.classList.add(MODE_COLOR[mode] || 'border-transparent');

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; };
    const setHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

    set(`pc-${n}-label`, p.label || p.name || `Port ${n}`);

    // Mode badge
    const modeEl = document.getElementById(`pc-${n}-mode`);
    if (modeEl) {
      const cls = isIOLink ? 'badge-success' : isError ? 'badge-error' : 'badge-ghost';
      modeEl.className = `badge badge-sm mt-0.5 ${cls}`;
      modeEl.textContent = isIOLink ? 'IO-Link' : isError ? 'Error' : (mode.replace('_', ' ') || 'Inactive');
    }

    // Vendor / device — only meaningful in IO-Link mode with an enumerated device
    const hasDevice = isIOLink && !!p.vendor_id;
    set(`pc-${n}-vendor`, hasDevice ? resolveVendorName(p.vendor_id) : '—');
    set(`pc-${n}-device`, hasDevice ? resolveDeviceName(p.vendor_id, p.device_id, p.name) : '—');

    // "No device detected" warning — IO-Link mode configured but nothing enumerated
    const noDevEl = document.getElementById(`pc-${n}-nodev`);
    if (noDevEl) noDevEl.classList.toggle('hidden', !(isIOLink && !p.vendor_id));

    // "Switch to IO-Link" button — show when port is in digital_in / digital_out,
    // but never for the light stack (status_led) which is always IO-Link only.
    const actionEl = document.getElementById(`pc-${n}-action`);
    if (actionEl) {
      const showSwitch = (mode === 'digital_out' || mode === 'digital_in')
        && (p.device_type || '') !== 'status_led';
      actionEl.classList.toggle('hidden', !showSwitch);
    }

    // PDin hex — show up to 10 hex chars (5 bytes)
    const pdinHex = p.pdin_hex || p.pdin || '';
    set(`pc-${n}-pdin`, pdinHex ? (pdinHex.length > 10 ? pdinHex.substring(0, 10) + '…' : pdinHex) : '—');

    // Data source badge
    const srcEl = document.getElementById(`pc-${n}-source`);
    if (srcEl) {
      const src = (p.source || 'pending').toLowerCase();
      srcEl.className = `badge badge-xs font-mono ${SOURCE_BADGE[src] || 'badge-ghost'}`;
      srcEl.textContent = src;
    }

    // Events / faults
    const eventsEl = document.getElementById(`pc-${n}-events`);
    if (eventsEl) {
      if (p.events && p.events.length > 0) {
        eventsEl.innerHTML = p.events.map(ev =>
          `<span class="badge badge-error badge-xs">${escapeHtml(ev.code)} ${escapeHtml(ev.label)}</span>`
        ).join('');
      } else {
        eventsEl.innerHTML = '';
      }
    }

    // Short device blurb (collapsed by default, shown in card footer for inactive ports)
    const blurbEl = document.getElementById(`pc-${n}-blurb`);
    if (blurbEl && !isIOLink) {
      const dtype = p.device_type || 'unknown';
      const blurb = LEARN_BLURBS[dtype];
      if (blurb) {
        blurbEl.textContent = blurb.blurb.split('.')[0] + '.'; // first sentence only
        blurbEl.classList.remove('hidden');
      }
    } else if (blurbEl) {
      blurbEl.classList.add('hidden');
    }
  }
  loadActivePortDetails(ports);
}

async function loadActivePortDetails(ports) {
  const container = document.getElementById('portDetailsContainer');
  const section = document.getElementById('portDetailsSection');
  if (!container) return;
  const active = (ports || []).filter(p => (p.mode || '').toLowerCase().includes('io-link'));
  const inactiveLabelled = (ports || []).filter(p => !(p.mode || '').toLowerCase().includes('io-link') && p.label);
  if (active.length === 0 && inactiveLabelled.length === 0) {
    if (section) section.classList.add('hidden');
    container.innerHTML = '';
    return;
  }
  if (section) section.classList.remove('hidden');
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
  for (const port of inactiveLabelled) {
    html += generateDisconnectedPortHTML(port);
  }
  container.innerHTML = html || '<p class="text-center">No details</p>';
}

const LEARN_BLURBS = {
  status_led: { blurb: 'Status lights show machine or line state (e.g. green = running, red = fault). Check supervision and that the correct state is displayed.', anchor: 'status-led' },
  photo_electric: { blurb: 'Contrinex LTR-M18PA-PMx-603 diffuse photoelectric sensor (M18, Red LED, 5–1000 mm range; sold by RS as 0360240). Output 1 activates on light-on — object present when beam is reflected back. Keep the lens clean; signal quality drops before total failure, giving early warning. Adjust sensitivity via the potentiometer for reliable detection at your target distance.', anchor: 'photo-electric' },
  temperature: { blurb: 'Temperature sensors report °C for process and maintenance. Check supervision current and wiring; use trends to spot overheating.', anchor: 'temperature' },
  proximity: { blurb: 'Omron E2E-X16MB1T12 M18 inductive proximity sensor (IO-Link V1.1, COM3 230.4 kbps). Detects ferrous and non-ferrous metals up to 16 mm (iron). Full ISDU access — read operating hours, configure output logic (NO/NC), timer mode and timer time, and read instability and over-approach diagnostic alarms live. Instability alarm (PDin bit 4) activates when the target sits at the edge of the sensing range; over-approach alarm (bit 5) activates when target is too close. Keep sensing face clear of swarf and mounting bracket interference.', anchor: 'proximity' },
  capacitive: { blurb: 'RS PRO / Carlo Gavazzi M18 capacitive sensor (model 2377240, non-flush, 12 mm range). Detects conductive and non-conductive targets — SO1 activates when an object is present. Also outputs a 16-bit analogue dielectric value useful for level sensing and material identification. Keep the sensing face clean and dry; use the Quality of Run (QoR) value to detect gradual contamination before output failure.', anchor: 'proximity' }
};
function generateDisconnectedPortHTML(port) {
  const dtype = port.device_type || 'unknown';
  const label = port.label || port.name || 'Unknown device';
  const blurb = LEARN_BLURBS[dtype];
  let h = `<div class="port-detail-card rounded-lg border border-warning/40 bg-base-100 p-4 mb-3 opacity-70" data-port="${port.port}">`;
  h += `<h3 class="font-semibold text-warning">Port ${port.port} – ${escapeHtml(label)} <span class="badge badge-warning badge-sm ml-1">Disconnected</span></h3>`;
  if (blurb) {
    h += `<div class="my-2 p-2 rounded bg-warning/10 border-l-4 border-warning"><strong>Expected device:</strong> ${escapeHtml(blurb.blurb)} <a href="${API_BASE}/learn#${blurb.anchor}" target="_blank" class="link link-primary text-sm">Learn more</a></div>`;
  }
  h += `<p class="text-sm opacity-60">No IO-Link device detected on this port. Connect a ${escapeHtml(label)} to activate.</p>`;
  h += '</div>';
  return h;
}

function generatePortDetailsHTML(port) {
  const dtype = port.device_type || 'unknown';
  const hasDecodedPdin = port.pdin && port.pdin.decoded && Object.keys(port.pdin.decoded).length > 0;
  const showDecodedByDefault = hasDecodedPdin;

  let h = `<div class="port-detail-card rounded-lg border border-base-300 bg-base-100 p-4 mb-3" data-port="${port.port}">`;
  h += `<h3 class="font-semibold text-primary">Port ${port.port} – ${escapeHtml(port.label || port.name || 'Unknown')}</h3>`;
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

  if (dtype === 'capacitive' && port.pdin && port.pdin.decoded && port.pdin.decoded.analogue_value != null) {
    const av = port.pdin.decoded.analogue_value;
    const pct = Math.min(100, Math.round((av / 10000) * 100));
    h += `<div class="my-1"><strong>Dielectric value:</strong> <progress class="progress progress-info w-48" value="${pct}" max="100"></progress> ${av} <span class="text-xs opacity-70">(0–10000 · higher = denser/closer target)</span></div>`;
  }
  if (dtype === 'capacitive' && port.detection_counter != null) {
    const total = port.detection_counter.toLocaleString();
    const delta = port.detection_counter_delta ?? 0;
    const deltaHtml = delta > 0 ? ` <span class="badge badge-success badge-sm">+${delta} this cycle</span>` : '';
    h += `<p class="text-xs my-1"><strong>Detection counter (SSC1):</strong> ${total} activations${deltaHtml}. <span class="opacity-70">Onboard counter — increments on every SSC1 state change even if missed by polling. Persisted in sensor every hour.</span></p>`;
  } else if ((dtype === 'photo_electric' || dtype === 'proximity') && port.pdin && port.pdin.decoded) {
    h += `<p class="text-xs my-1 opacity-60">No onboard activation counter available for this sensor type.</p>`;
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
  // Device parameters panel — toggled open by user
  h += `<div class="mt-3 border-t border-base-300 pt-3">
    <button type="button" class="btn btn-xs btn-outline btn-primary params-toggle-btn" data-port="${port.port}">
      Device Parameters (IODD)
    </button>
    <div class="params-panel hidden mt-3" id="params-panel-${port.port}">
      <div class="params-loading text-xs text-base-content/60 italic">Loading parameters…</div>
    </div>
  </div>`;
  h += '</div>';
  return h;
}

// ── Device parameter panel ────────────────────────────────────────────────────
function renderParamValue(p) {
  if (p.value === null || p.value === undefined) return '<span class="text-base-content/30 italic">—</span>';
  if (p.value_label) return `<span class="badge badge-sm badge-outline">${escapeHtml(p.value_label)}</span>`;
  const unit = p.unit ? ` <span class="text-xs text-base-content/50">${escapeHtml(p.unit)}</span>` : '';
  return `<span class="font-mono">${p.value}</span>${unit}`;
}

function renderWriteControl(p, portNum) {
  if (p.access !== 'rw') return '';
  const id = `wparam-${portNum}-${p.index}-${p.subindex}`;
  let ctrl = '';
  if (p.enum) {
    const opts = Object.entries(p.enum).map(([v, l]) => {
      const sel = (p.value !== null && parseInt(v) === p.value) ? ' selected' : '';
      return `<option value="${v}"${sel}>${escapeHtml(l)}</option>`;
    }).join('');
    ctrl = `<select id="${id}" class="select select-xs select-bordered max-w-xs">${opts}</select>`;
  } else if (p.dtype === 'int16' || p.dtype === 'uint16' || p.dtype === 'uint8' || p.dtype === 'int32' || p.dtype === 'uint32') {
    const min = p.min !== undefined ? `min="${p.min}"` : '';
    const max = p.max !== undefined ? `max="${p.max}"` : '';
    const step = p.scale && p.scale !== 1 ? `step="${p.scale}"` : 'step="1"';
    const val  = p.value !== null && p.value !== undefined ? `value="${p.value}"` : '';
    ctrl = `<input type="number" id="${id}" class="input input-xs input-bordered w-24 font-mono" ${min} ${max} ${step} ${val}>`;
  } else if (p.dtype === 'string') {
    const val = p.value !== null ? `value="${escapeHtml(String(p.value))}"` : '';
    ctrl = `<input type="text" id="${id}" class="input input-xs input-bordered w-40" ${val} maxlength="${p.max_len || 64}">`;
  }
  if (!ctrl) return '';
  return `${ctrl} <button type="button" class="btn btn-xs btn-primary param-write-btn ml-1"
    data-port="${portNum}" data-index="${p.index}" data-subindex="${p.subindex}"
    data-dtype="${p.dtype}" data-scale="${p.scale || 1}" data-input-id="${id}">Write</button>
    <span class="param-write-status text-xs ml-1"></span>`;
}

async function loadParamPanel(portNum) {
  const panel = document.getElementById(`params-panel-${portNum}`);
  if (!panel) return;
  panel.querySelector('.params-loading')?.remove();
  panel.innerHTML = '<div class="text-xs text-base-content/60 italic">Fetching from device…</div>';

  let data;
  try {
    const res = await fetch(`${API_BASE}/api/io-link/port/${portNum}/parameters`, { signal: AbortSignal.timeout(15000) });
    data = await res.json();
  } catch (e) {
    panel.innerHTML = `<p class="text-xs text-error">Failed to load: ${e.message}</p>`;
    return;
  }
  if (!data.success) {
    panel.innerHTML = `<p class="text-xs text-base-content/60 italic">${escapeHtml(data.error || 'No parameters available')}</p>`;
    return;
  }

  const groups = { identity: [], config: [], diagnostics: [] };
  (data.parameters || []).forEach(p => {
    const g = p.group || 'identity';
    if (!groups[g]) groups[g] = [];
    groups[g].push(p);
  });

  const groupLabels = { identity: 'Identity', config: 'Configuration', diagnostics: 'Diagnostics' };
  let html = `<p class="text-xs font-bold text-base-content mb-2">${escapeHtml(data.device_label)}</p>`;

  for (const [gKey, gLabel] of Object.entries(groupLabels)) {
    if (!groups[gKey] || groups[gKey].length === 0) continue;
    html += `<p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mt-2 mb-1">${gLabel}</p>`;
    html += '<div class="overflow-x-auto"><table class="table table-xs w-full"><tbody>';
    for (const p of groups[gKey]) {
      const desc = p.desc ? `<span class="text-base-content/40 text-xs block">${escapeHtml(p.desc)}</span>` : '';
      html += `<tr><td class="font-medium text-xs whitespace-nowrap">${escapeHtml(p.name)}${desc}</td>
        <td>${renderParamValue(p)}</td>
        <td>${renderWriteControl(p, portNum)}</td></tr>`;
    }
    html += '</tbody></table></div>';
  }

  // Command buttons
  const cmds = data.commands || {};
  if (Object.keys(cmds).length > 0) {
    html += '<p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mt-3 mb-1">Commands</p>';
    html += '<div class="flex flex-wrap gap-2">';
    for (const [key, cmd] of Object.entries(cmds)) {
      const danger = key.includes('reset') ? 'btn-error' : 'btn-warning';
      html += `<button type="button" class="btn btn-xs ${danger} param-cmd-btn"
        data-port="${portNum}" data-cmd="${key}">${escapeHtml(cmd.label)}</button>`;
    }
    html += '</div>';
  }

  html += `<button type="button" class="btn btn-xs btn-ghost mt-3 params-refresh-btn" data-port="${portNum}">↺ Refresh</button>`;
  panel.innerHTML = html;
}

function wireParamPanelEvents(root) {
  root.addEventListener('click', async e => {
    const toggleBtn = e.target.closest('.params-toggle-btn');
    if (toggleBtn) {
      const portNum = parseInt(toggleBtn.dataset.port);
      const panel = document.getElementById(`params-panel-${portNum}`);
      if (!panel) return;
      const wasHidden = panel.classList.contains('hidden');
      panel.classList.toggle('hidden');
      if (wasHidden) loadParamPanel(portNum);
      return;
    }

    const refreshBtn = e.target.closest('.params-refresh-btn');
    if (refreshBtn) { loadParamPanel(parseInt(refreshBtn.dataset.port)); return; }

    const writeBtn = e.target.closest('.param-write-btn');
    if (writeBtn) {
      const { port, index, subindex, dtype, scale, inputId } = writeBtn.dataset;
      const input = document.getElementById(inputId);
      if (!input) return;
      const statusEl = writeBtn.nextElementSibling;
      writeBtn.disabled = true;
      if (statusEl) statusEl.textContent = '…';
      try {
        const res = await fetch(`${API_BASE}/api/io-link/port/${port}/parameter/write`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ index: parseInt(index), subindex: parseInt(subindex),
            dtype, scale: parseFloat(scale), value: dtype === 'string' ? input.value : parseFloat(input.value) }),
          signal: AbortSignal.timeout(8000)
        });
        const data = await res.json();
        if (statusEl) {
          statusEl.textContent = data.success ? '✓' : `✗ ${data.error || ''}`;
          statusEl.className = `param-write-status text-xs ml-1 ${data.success ? 'text-success' : 'text-error'}`;
        }
      } catch (err) {
        if (statusEl) { statusEl.textContent = '✗ timeout'; statusEl.className = 'param-write-status text-xs ml-1 text-error'; }
      }
      writeBtn.disabled = false;
      return;
    }

    const cmdBtn = e.target.closest('.param-cmd-btn');
    if (cmdBtn) {
      const { port, cmd } = cmdBtn.dataset;
      cmdBtn.disabled = true;
      cmdBtn.textContent = '…';
      try {
        const res = await fetch(`${API_BASE}/api/io-link/port/${port}/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmd }),
          signal: AbortSignal.timeout(8000)
        });
        const data = await res.json();
        cmdBtn.textContent = data.success ? '✓ Done' : '✗ Failed';
        cmdBtn.className = `btn btn-xs ${data.success ? 'btn-success' : 'btn-error'} param-cmd-btn`;
        setTimeout(() => loadParamPanel(parseInt(port)), 1500);
      } catch { cmdBtn.textContent = '✗ Error'; }
      setTimeout(() => { cmdBtn.disabled = false; }, 2000);
    }
  });
}

function updateSupervisionKpis(supervision) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; };
  set('kpiVoltage', supervision.voltage != null ? Number(supervision.voltage).toFixed(1) : '—');
  set('kpiCurrent', supervision.current != null ? Number(supervision.current).toFixed(2) : '—');
  set('kpiTemp',    supervision.temperature != null ? Number(supervision.temperature).toFixed(1) : '—');
  const statusVal = supervision.status ?? supervision.supervisionstatus;
  const statusRow = document.getElementById('supervisionStatusRow');
  if (statusRow) statusRow.classList.toggle('hidden', statusVal == null);
  set('supervisionStatus', statusVal != null ? statusVal : '—');
}

function updateMasterInfo(software) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; };
  set('masterBootloader', software['Bootloader'] || software.bootloader || software['bootloader version'] || '—');
}

async function fetchDiagnostics() {
  try {
    const res = await fetch(`${API_BASE}/api/io-link/diagnostics`, { signal: AbortSignal.timeout(5000) });
    const resp = await res.json();
    if (!resp) return;
    const d = resp.stats || {};

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; };

    // Circuit breaker
    const circuitBadge = document.getElementById('circuitStateBadge');
    if (circuitBadge) {
      const state = (d.circuit_state || 'unknown').toLowerCase();
      const cls = state === 'closed' ? 'badge-success' : state === 'open' ? 'badge-error' : 'badge-warning';
      circuitBadge.className = `badge badge-lg font-mono ${cls}`;
      circuitBadge.textContent = d.circuit_state || '—';
    }
    set('circuitFailures', d.consecutive_failures ?? '—');

    // Uptime
    const uptime = d.uptime_pct_1h;
    set('uptimePct', uptime != null ? uptime.toFixed(1) + '%' : '—');
    set('drops1h', d.drops_1h ?? '—');

    // Latency
    set('avgLatency',  d.request_rtt_p50_ms != null ? d.request_rtt_p50_ms.toFixed(0) + ' ms' : '—');
    set('p95Latency',  d.request_rtt_p95_ms != null ? d.request_rtt_p95_ms.toFixed(0) + ' ms' : '—');

    // Request success rate
    const sr = d.request_success_rate_pct;
    set('requestSuccessRate', sr != null ? sr.toFixed(1) + '%' : '—');

    // MQTT state
    const mqttEl = document.getElementById('mqttState');
    if (mqttEl) {
      const connected = d.mqtt_connected;
      mqttEl.textContent = connected == null ? '—' : (connected ? 'Connected' : 'Disconnected');
      mqttEl.className = connected ? 'text-success font-mono' : 'text-error font-mono';
    }

    // Port freshness badges
    const freshness = d.port_freshness_age_sec || {};
    for (const [portStr, age] of Object.entries(freshness)) {
      const el = document.getElementById(`pc-${portStr}-fresh`);
      if (el) el.textContent = age != null ? `${Math.round(age)}s ago` : '';
    }
  } catch (_) {
    // diagnostics endpoint may not exist on older backends — silently skip
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
    websocket.onerror = () => {
      if (hasEverConnected) showError('WebSocket error', false);
      else showConnecting('Connecting...');
    };
    websocket.onclose = () => {
      websocket = null;
      if (reconnectAttempts < MAX_RECONNECT) {
        reconnectAttempts++;
        if (hasEverConnected) {
          showError(`Reconnecting (${reconnectAttempts}/${MAX_RECONNECT})...`, false);
        } else {
          showConnecting('Connecting...');
        }
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

export function loadMasterConfig() {
  fetch(`${API_BASE}/api/io-link/config`)
    .then(r => r.json())
    .then(data => {
      if (data.success && data.io_link) {
        const c = data.io_link;
        const ipEl = document.getElementById('masterIpInput');
        if (ipEl) ipEl.value = c.master_ip || '';
        const portEl = document.getElementById('masterPortInput');
        if (portEl) portEl.value = c.port != null ? c.port : '80';
        const timeoutEl = document.getElementById('masterTimeoutInput');
        if (timeoutEl) timeoutEl.value = c.timeout_sec != null ? c.timeout_sec : '2';
        const httpsEl = document.getElementById('masterHttpsInput');
        if (httpsEl) httpsEl.checked = !!c.use_https;
        const pollEl = document.getElementById('masterPollInput');
        if (pollEl) pollEl.value = c.poll_interval_sec != null ? c.poll_interval_sec : '1';
      }
    })
    .catch(() => {});
}

export function saveMasterConfig() {
  const ipEl = document.getElementById('masterIpInput');
  const portEl = document.getElementById('masterPortInput');
  const timeoutEl = document.getElementById('masterTimeoutInput');
  const httpsEl = document.getElementById('masterHttpsInput');
  const pollEl = document.getElementById('masterPollInput');
  const msgEl = document.getElementById('configMessage');

  const ip = ipEl && ipEl.value ? ipEl.value.trim() : '';
  if (!ip) {
    if (msgEl) { msgEl.textContent = 'Enter an IP address'; msgEl.className = 'text-sm text-error'; }
    return;
  }
  let port = portEl && portEl.value ? parseInt(portEl.value, 10) : 80;
  if (isNaN(port) || port < 1 || port > 65535) port = 80;
  let timeout_sec = timeoutEl && timeoutEl.value ? parseFloat(timeoutEl.value) : 2;
  if (isNaN(timeout_sec) || timeout_sec < 0.5) timeout_sec = 2;
  const use_https = httpsEl ? httpsEl.checked : false;
  let poll_interval_sec = pollEl && pollEl.value ? parseFloat(pollEl.value) : 1;
  if (isNaN(poll_interval_sec) || poll_interval_sec < 0.5) poll_interval_sec = 1;
  if (poll_interval_sec > 30) poll_interval_sec = 30;

  if (msgEl) { msgEl.textContent = 'Saving...'; msgEl.className = 'text-sm'; }
  fetch(`${API_BASE}/api/io-link/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ master_ip: ip, port, timeout_sec, use_https, poll_interval_sec })
  })
    .then(r => r.json())
    .then(data => {
      if (msgEl) {
        msgEl.textContent = data.success ? 'Saved.' : (data.detail || 'Error');
        msgEl.className = data.success ? 'text-sm text-success' : 'text-sm text-error';
      }
      setTimeout(() => { if (msgEl) msgEl.textContent = ''; }, 4000);
    })
    .catch(() => {
      if (msgEl) { msgEl.textContent = 'Error saving config'; msgEl.className = 'text-sm text-error'; }
    });
}

/** Test the current connection to the IO-Link master and update the result element. */
export function testConnection() {
  const resultEl = document.getElementById('connectionTestResult');
  if (resultEl) { resultEl.textContent = 'Testing...'; resultEl.className = 'badge badge-ghost'; }
  fetch(`${API_BASE}/api/io-link/status`)
    .then(r => r.json())
    .then(data => {
      if (!resultEl) return;
      if (data.success) {
        resultEl.textContent = `OK – ${data.device_name || 'Device found'}`;
        resultEl.className = 'badge badge-success';
      } else {
        resultEl.textContent = data.error ? `Failed: ${data.error}` : 'Could not connect';
        resultEl.className = 'badge badge-error';
      }
    })
    .catch(err => {
      if (resultEl) { resultEl.textContent = 'Network error'; resultEl.className = 'badge badge-error'; }
    });
}

/** Fetch current status and update UI (used by Settings page Refresh button). */
export function refreshIOLinkData() {
  fetch(`${API_BASE}/api/io-link/status`)
    .then(r => r.json())
    .then(updateUI)
    .catch(() => {});
}

/** Call when leaving the IO-Link page so charts are destroyed. */
export function destroyIOLinkPage() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  if (websocket) {
    websocket.close();
    websocket = null;
  }
  if (_diagInterval) { clearInterval(_diagInterval); _diagInterval = null; }
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

function setupPortModeSwitch() {
  document.addEventListener('click', async e => {
    const btn = e.target.closest('.port-mode-switch-btn');
    if (!btn) return;
    const port = parseInt(btn.dataset.port, 10);
    const mode = btn.dataset.mode;
    btn.disabled = true;
    btn.textContent = 'Switching…';
    try {
      const res = await fetch(`${API_BASE}/api/io-link/port/${port}/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
        signal: AbortSignal.timeout(6000)
      });
      const data = await res.json();
      if (data.success) {
        btn.textContent = '✓ Done';
        btn.classList.replace('btn-warning', 'btn-success');
      } else {
        btn.textContent = `✗ ${data.error || 'Failed'}`;
        btn.classList.replace('btn-warning', 'btn-error');
        btn.disabled = false;
      }
    } catch {
      btn.textContent = '✗ Timeout';
      btn.classList.replace('btn-warning', 'btn-error');
      btn.disabled = false;
    }
  });
}

export function initIOLinkPage() {
  ioLinkCharts.forEach(c => c.destroy());
  ioLinkCharts = [];
  hasEverConnected = false;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (_diagInterval) { clearInterval(_diagInterval); _diagInterval = null; }
  connectWebSocket();
  setupRawDecodedToggle();
  setupSimulateFault();
  setupPortModeSwitch();
  const portDetailsSection = document.getElementById('portDetailsSection');
  if (portDetailsSection) wireParamPanelEvents(portDetailsSection);
  // Fetch diagnostics KPIs immediately then every 15 s
  fetchDiagnostics();
  _diagInterval = setInterval(fetchDiagnostics, 15000);
}
