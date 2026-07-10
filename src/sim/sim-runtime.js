/**
 * GitHub Pages simulation mode — network layer.
 *
 * Patches window.WebSocket and window.fetch so every existing page module's
 * `new WebSocket(...)` / `fetch('/api/io-link/...')` call works unmodified
 * against a fake in-browser IO-Link master when no real backend answers.
 * Real backends are always tried first — this only engages as a fallback.
 *
 * Only ever installed when import.meta.env.VITE_SIM_MODE === 'true', which is
 * set exclusively by .github/workflows/deploy-pages.yml. Local dev and the Pi
 * build never set this flag, so SIM_BUILD is false and installSimBackend() is
 * never called there.
 */

import { tick, getPortDevice, getParametersWithValues, readParameterValue, writePort4Pdout, startPort4Sweep, stopPort4Sweep } from './sim-data.js';

export const SIM_BUILD = import.meta.env.VITE_SIM_MODE === 'true';

const REAL_CONNECT_TIMEOUT_MS = 3000;
const TICK_INTERVAL_MS = 500;

let simConfirmed = false;
let engagedEventFired = false;

function announceEngaged() {
  if (engagedEventFired) return;
  engagedEventFired = true;
  simConfirmed = true;
  window.dispatchEvent(new CustomEvent('sim:engaged'));
}

export function isSimActive() {
  return simConfirmed;
}

// ── Fake WebSocket ────────────────────────────────────────────────────────

class HybridWebSocket extends EventTarget {
  constructor(url) {
    super();
    this.url = url;
    this.readyState = 0; // CONNECTING
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    this._real = null;
    this._simTimer = null;

    if (simConfirmed) {
      this._startSimulated();
    } else {
      this._tryReal();
    }
  }

  _tryReal() {
    const NativeWebSocket = HybridWebSocket._native;
    let settled = false;
    let real;
    try {
      real = new NativeWebSocket(this.url);
    } catch (e) {
      this._startSimulated();
      return;
    }
    this._real = real;

    const guard = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { real.close(); } catch (_) {}
      this._real = null;
      this._startSimulated();
    }, REAL_CONNECT_TIMEOUT_MS);

    real.onopen = (ev) => {
      if (settled) return;
      settled = true;
      clearTimeout(guard);
      simConfirmed = false;
      this.readyState = 1;
      if (this.onopen) this.onopen(ev);
    };
    real.onmessage = (ev) => { if (this.onmessage) this.onmessage(ev); };
    real.onerror = (ev) => {
      if (settled) return;
      if (this.onerror) this.onerror(ev);
    };
    real.onclose = (ev) => {
      if (!settled) {
        settled = true;
        clearTimeout(guard);
        this._real = null;
        this._startSimulated();
        return;
      }
      this.readyState = 3;
      if (this.onclose) this.onclose(ev);
    };
  }

  _startSimulated() {
    announceEngaged();
    this.readyState = 1; // OPEN
    if (this.onopen) this.onopen({ target: this });
    this._simTimer = setInterval(() => {
      if (this.readyState !== 1) return;
      const snapshot = tick();
      if (this.onmessage) this.onmessage({ data: JSON.stringify(snapshot) });
    }, TICK_INTERVAL_MS);
  }

  send() { /* no-op — sim backend is read-only over WS */ }

  close() {
    this.readyState = 3;
    if (this._simTimer) { clearInterval(this._simTimer); this._simTimer = null; }
    if (this._real) { try { this._real.close(); } catch (_) {} this._real = null; }
  }
}

// ── Fake REST endpoints ──────────────────────────────────────────────────

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function notAvailable() {
  return jsonResponse({ success: false, error: 'Not available in GitHub Pages simulation mode' }, 200);
}

async function parseBody(init) {
  if (!init || !init.body) return {};
  try { return JSON.parse(init.body); } catch (_) { return {}; }
}

async function routeSimRequest(pathname, method, init) {
  let m;

  if ((m = pathname.match(/^\/api\/io-link\/port\/(\d)\/parameters$/)) && method === 'GET') {
    const portNum = Number(m[1]);
    const result = getParametersWithValues(portNum);
    if (!result) return jsonResponse({ success: false, error: 'No IODD-derived parameters for this device' });
    return jsonResponse({ success: true, port: portNum, device_label: result.label, commands: result.commands, parameters: result.parameters });
  }

  if ((m = pathname.match(/^\/api\/io-link\/port\/(\d)\/parameter\/read$/)) && method === 'POST') {
    const portNum = Number(m[1]);
    const body = await parseBody(init);
    const value = readParameterValue(portNum, Number(body.index), Number(body.subindex || 0), body.dtype, Number(body.scale || 1.0));
    return jsonResponse({ success: true, raw_hex: '', value });
  }

  if ((m = pathname.match(/^\/api\/io-link\/port\/(\d)\/parameter\/write$/)) && method === 'POST') {
    const body = await parseBody(init);
    // Read-only in sim mode: accept the write, don't persist it.
    return jsonResponse({ success: true, wrote_hex: '', value: body.value });
  }

  if ((m = pathname.match(/^\/api\/io-link\/port\/(\d)\/command$/)) && method === 'POST') {
    const body = await parseBody(init);
    return jsonResponse({ success: true, command: body.command, label: body.command });
  }

  if ((m = pathname.match(/^\/api\/io-link\/port\/(\d)\/pdout\/sweep\/stop$/)) && method === 'POST') {
    return jsonResponse(stopPort4Sweep());
  }
  if ((m = pathname.match(/^\/api\/io-link\/port\/(\d)\/pdout\/sweep$/)) && method === 'POST') {
    const body = await parseBody(init);
    return jsonResponse(startPort4Sweep(body.color1, body.color2, body.speed));
  }
  if ((m = pathname.match(/^\/api\/io-link\/port\/(\d)\/pdout$/)) && method === 'POST') {
    const body = await parseBody(init);
    return jsonResponse(writePort4Pdout(body.value || '000100'));
  }

  if ((m = pathname.match(/^\/api\/io-link\/port\/(\d)\/mode$/)) && method === 'POST') {
    const portNum = Number(m[1]);
    const body = await parseBody(init);
    return jsonResponse({ success: true, port: portNum, mode: body.mode });
  }

  if ((m = pathname.match(/^\/api\/io-link\/port\/(\d)$/)) && method === 'GET') {
    const portNum = Number(m[1]);
    const snapshot = tick();
    const port = snapshot.ports.find(pp => pp.port === portNum);
    return jsonResponse({ success: !!port, port });
  }

  if (pathname === '/api/io-link/diagnostics' && method === 'GET') {
    return jsonResponse({
      success: true,
      stats: {
        circuit_state: 'closed', consecutive_failures: 0, uptime_pct_1h: 100,
        drops_1h: 0, request_rtt_p50_ms: 12, request_rtt_p95_ms: 28,
        request_success_rate_pct: 100, mqtt_connected: true,
        port_freshness_age_sec: { 1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5 },
      },
    });
  }

  if (pathname === '/api/io-link/supervision-history' && method === 'GET') {
    const now = Math.floor(Date.now() / 1000);
    const history = Array.from({ length: 40 }, (_, i) => ({
      ts: now - (40 - i) * 15,
      voltage: Math.round((24000 + (Math.random() - 0.5) * 400)),
      current: Math.round((150 + (Math.random() - 0.5) * 60)),
      temperature: Math.round((35 + (Math.random() - 0.5) * 4) * 10) / 10,
    }));
    return jsonResponse({ success: true, history });
  }

  if (pathname === '/api/io-link/status' && method === 'GET') {
    return jsonResponse(tick());
  }

  if (pathname === '/api/io-link/config' && method === 'GET') {
    return jsonResponse({ success: true, io_link: { master_ip: '192.168.7.4 (SIM)', port: 80, timeout_sec: 3, use_https: false, poll_interval_sec: 1 } });
  }
  if (pathname === '/api/io-link/config' && (method === 'PUT' || method === 'POST')) {
    return jsonResponse({ success: true });
  }

  if (pathname === '/api/io-link/history' && method === 'GET') {
    const empty = { labels: [], values: [] };
    return jsonResponse({ temperature: empty, photo_detected: empty, photo_signal_quality: empty, cap_detected: empty, cap_analogue: empty });
  }
  if (pathname === '/api/io-link/history' && method === 'DELETE') {
    return jsonResponse({ success: true });
  }

  if (pathname === '/api/io-link/alarms' && method === 'GET') {
    return jsonResponse({ success: true, alarms: [] });
  }
  if (pathname === '/api/io-link/alarms/export') {
    return jsonResponse({ success: false, error: 'Not available in GitHub Pages simulation mode' });
  }

  if (pathname === '/api/io-link/simulate-fault' && method === 'POST') {
    return jsonResponse({ success: true });
  }

  if (pathname === '/api/system/health' && method === 'GET') {
    return jsonResponse({ success: false, error: 'System health is not available in GitHub Pages simulation mode' });
  }

  if (pathname === '/api/logs' && method === 'GET') {
    return jsonResponse({ success: true, logs: [] });
  }

  return notAvailable();
}

// ── Install ───────────────────────────────────────────────────────────────

export function installSimBackend() {
  if (!SIM_BUILD) return;

  HybridWebSocket._native = window.WebSocket;
  window.WebSocket = HybridWebSocket;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : input.url;
    let pathname;
    try { pathname = new URL(url, window.location.href).pathname; } catch (_) { pathname = ''; }

    if (!pathname.startsWith('/api/')) {
      return nativeFetch(input, init);
    }

    if (!simConfirmed) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REAL_CONNECT_TIMEOUT_MS);
        const mergedInit = { ...init, signal: init && init.signal ? init.signal : controller.signal };
        const res = await nativeFetch(input, mergedInit);
        clearTimeout(timer);
        if (res.ok) return res;
      } catch (_) { /* fall through to simulated response */ }
    }

    announceEngaged();
    const method = (init && init.method) || 'GET';
    return routeSimRequest(pathname, method.toUpperCase(), init);
  };
}
