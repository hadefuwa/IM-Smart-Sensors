/**
 * Settings page – App settings (theme, etc.) and IO-Link Master connection config.
 */

import { loadMasterConfig, saveMasterConfig, testConnection } from './io-link-page.js';

const APP_THEME_KEY = 'matrix-theme';
const APP_CONNECTION_BAR_KEY = 'matrix-show-connection-bar';

function getBaseUrl() {
  return (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '';
}

function applyTheme(theme) {
  if (theme !== 'light' && theme !== 'dark') return;
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);
  localStorage.setItem(APP_THEME_KEY, theme);
  const headerSelect = document.getElementById('theme-select');
  if (headerSelect) headerSelect.value = theme;
  const logo = document.getElementById('header-matrix-logo');
  if (logo) logo.src = getBaseUrl() + (theme === 'light' ? 'matrix2.png' : 'matrix.png');
}

function applyConnectionBarVisible(visible) {
  const bar = document.getElementById('connection-status-bar');
  if (bar) bar.style.display = visible ? '' : 'none';
  localStorage.setItem(APP_CONNECTION_BAR_KEY, visible ? '1' : '0');
}

export function renderSettingsPage() {
  return `
    <div class="max-w-2xl mx-auto space-y-6">
      <header class="pb-4 border-b border-base-300">
        <h1 class="text-3xl font-bold text-base-content tracking-tight">Settings</h1>
        <p class="mt-2 text-base-content/80">App appearance and IFM AL1350 IO-Link Master connection.</p>
      </header>

      <div class="card bg-base-200 shadow-xl border border-base-300">
        <div class="card-body gap-4">
          <h2 class="card-title text-lg text-base-content border-b border-base-300 pb-2">App</h2>
          <div class="form-control gap-2">
            <label class="label" for="settings-theme-select">
              <span class="label-text font-medium text-base-content">Default theme</span>
            </label>
            <select id="settings-theme-select" class="select select-bordered select-sm w-full max-w-xs">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <p class="text-xs text-base-content/60">Applies immediately and is saved for next time.</p>
          </div>
          <div class="form-control gap-2">
            <label class="label cursor-pointer gap-2 justify-start">
              <input type="checkbox" id="settings-show-connection-bar" class="checkbox checkbox-sm" checked />
              <span class="label-text font-medium text-base-content">Show connection status bar</span>
            </label>
            <p class="text-xs text-base-content/60">The bar below the header with connection status and Settings link.</p>
          </div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl border border-base-300">
        <div class="card-body gap-4">
          <h2 class="card-title text-lg text-base-content border-b border-base-300 pb-2">IO-Link Master (AL1350)</h2>
          <p class="text-xs text-base-content/60">Configure the connection to your IFM AL1350 IoT IO-Link master. Changes take effect immediately — no restart required.</p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-control gap-1">
              <label class="label py-0" for="masterIpInput">
                <span class="label-text font-medium text-base-content">Host / IP address</span>
              </label>
              <input type="text" id="masterIpInput" placeholder="192.168.7.4" class="input input-bordered input-sm w-full" />
              <p class="text-xs text-base-content/50">IP or hostname of the AL1350</p>
            </div>

            <div class="form-control gap-1">
              <label class="label py-0" for="masterPortInput">
                <span class="label-text font-medium text-base-content">HTTP port</span>
              </label>
              <input type="number" id="masterPortInput" placeholder="80" min="1" max="65535" class="input input-bordered input-sm w-full" />
              <p class="text-xs text-base-content/50">Default is 80 (or 443 for HTTPS)</p>
            </div>

            <div class="form-control gap-1">
              <label class="label py-0" for="masterTimeoutInput">
                <span class="label-text font-medium text-base-content">Request timeout (s)</span>
              </label>
              <input type="number" id="masterTimeoutInput" placeholder="2" min="0.5" max="30" step="0.5" class="input input-bordered input-sm w-full" />
              <p class="text-xs text-base-content/50">Seconds before a request is abandoned (0.5–30)</p>
            </div>

            <div class="form-control gap-1">
              <label class="label py-0" for="masterPollInput">
                <span class="label-text font-medium text-base-content">Poll interval (s)</span>
              </label>
              <input type="number" id="masterPollInput" placeholder="1" min="0.5" max="30" step="0.5" class="input input-bordered input-sm w-full" />
              <p class="text-xs text-base-content/50">How often the backend queries the master (0.5–30)</p>
            </div>
          </div>

          <div class="form-control gap-1">
            <label class="label cursor-pointer gap-2 justify-start py-0">
              <input type="checkbox" id="masterHttpsInput" class="checkbox checkbox-sm" />
              <span class="label-text font-medium text-base-content">Use HTTPS</span>
            </label>
            <p class="text-xs text-base-content/50">Enable if your AL1350 is configured for HTTPS. Ensure the port above matches (typically 443).</p>
          </div>

          <div class="flex flex-wrap items-center gap-3 pt-2 border-t border-base-300">
            <button type="button" class="btn btn-primary btn-sm" id="io-link-save-config-btn">Save</button>
            <button type="button" class="btn btn-outline btn-sm" id="io-link-test-btn">Test connection</button>
            <span id="configMessage" class="text-sm text-success"></span>
            <span id="connectionTestResult" class="badge badge-ghost hidden"></span>
          </div>
        </div>
      </div>
      <div class="card bg-base-200 shadow-xl border border-base-300" id="wifi-card">
        <div class="card-body gap-4">
          <h2 class="card-title text-lg text-base-content border-b border-base-300 pb-2">Wi-Fi</h2>
          <p class="text-xs text-base-content/60">Connect this Raspberry Pi to a wireless network.</p>

          <div id="wifi-status-row" class="flex items-center gap-3 p-3 rounded-lg bg-base-300 text-sm">
            <span class="loading loading-spinner loading-xs"></span>
            <span class="text-base-content/60">Checking status…</span>
          </div>

          <div class="flex gap-2">
            <button type="button" id="wifi-scan-btn" class="btn btn-outline btn-sm gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/></svg>
              Scan for networks
            </button>
            <button type="button" id="wifi-disconnect-btn" class="btn btn-ghost btn-sm hidden">Disconnect</button>
          </div>

          <div id="wifi-networks-list" class="hidden space-y-1 max-h-48 overflow-y-auto pr-1"></div>

          <div id="wifi-connect-form" class="space-y-3 pt-2 border-t border-base-300">
            <div class="form-control gap-1">
              <label class="label py-0" for="wifi-ssid-input">
                <span class="label-text font-medium text-base-content">Network name (SSID)</span>
              </label>
              <input type="text" id="wifi-ssid-input" placeholder="e.g. MySchoolWifi" class="input input-bordered input-sm w-full" autocomplete="off" />
            </div>
            <div class="form-control gap-1">
              <label class="label py-0" for="wifi-password-input">
                <span class="label-text font-medium text-base-content">Password</span>
              </label>
              <input type="password" id="wifi-password-input" placeholder="Leave blank for open networks" class="input input-bordered input-sm w-full" autocomplete="off" />
            </div>
            <div class="flex items-center gap-3">
              <button type="button" id="wifi-connect-btn" class="btn btn-primary btn-sm">Connect</button>
              <span id="wifi-message" class="text-sm"></span>
            </div>
          </div>
        </div>
      </div>

      <footer class="pt-4 border-t border-base-300">
        <a href="#" data-page="io-link-master" class="btn btn-outline btn-sm gap-2">Back to IO-Link Master</a>
      </footer>
    </div>
  `;
}

export function initSettingsPage() {
  loadMasterConfig();
  const saveBtn = document.getElementById('io-link-save-config-btn');
  if (saveBtn) saveBtn.onclick = saveMasterConfig;
  const testBtn = document.getElementById('io-link-test-btn');
  if (testBtn) testBtn.onclick = () => {
    const resultEl = document.getElementById('connectionTestResult');
    if (resultEl) resultEl.classList.remove('hidden');
    testConnection();
  };

  const themeSelect = document.getElementById('settings-theme-select');
  if (themeSelect) {
    const saved = localStorage.getItem(APP_THEME_KEY);
    themeSelect.value = (saved === 'light' || saved === 'dark') ? saved : 'dark';
    themeSelect.addEventListener('change', function () {
      applyTheme(themeSelect.value);
    });
  }

  // Wi-Fi panel
  loadWifiStatus();
  document.getElementById('wifi-scan-btn')?.addEventListener('click', scanWifi);
  document.getElementById('wifi-connect-btn')?.addEventListener('click', connectWifi);
  document.getElementById('wifi-disconnect-btn')?.addEventListener('click', disconnectWifi);

  // On-screen keyboard for touch kiosk
  mountVirtualKeyboard();
  ['wifi-ssid-input', 'wifi-password-input', 'masterIpInput', 'masterPortInput', 'masterTimeoutInput', 'masterPollInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('focus', () => showVK(el));
  });

  const connectionBarCheck = document.getElementById('settings-show-connection-bar');
  if (connectionBarCheck) {
    const saved = localStorage.getItem(APP_CONNECTION_BAR_KEY);
    connectionBarCheck.checked = saved !== '0';
    applyConnectionBarVisible(connectionBarCheck.checked);
    connectionBarCheck.addEventListener('change', function () {
      applyConnectionBarVisible(connectionBarCheck.checked);
    });
  }
}

// ================================================================
// Wi-Fi helpers
// ================================================================

function getApiBase() {
  return window.IO_LINK_API_BASE || '';
}

function setWifiMessage(msg, isError = false) {
  const el = document.getElementById('wifi-message');
  if (!el) return;
  el.textContent = msg;
  el.className = `text-sm ${isError ? 'text-error' : 'text-success'}`;
}

function renderWifiStatus(data) {
  const row = document.getElementById('wifi-status-row');
  const disconnectBtn = document.getElementById('wifi-disconnect-btn');
  if (!row) return;

  if (!data.success) {
    row.innerHTML = `<span class="text-warning">⚠ ${data.error || 'Wi-Fi unavailable on this device.'}</span>`;
    return;
  }

  if (data.state === 'connected') {
    row.innerHTML = `
      <span class="text-success font-bold">●</span>
      <span class="text-base-content">Connected to <strong>${data.ssid}</strong></span>
      ${data.ip ? `<span class="text-base-content/60 text-xs">(${data.ip})</span>` : ''}
    `;
    if (disconnectBtn) disconnectBtn.classList.remove('hidden');
  } else if (data.state === 'unavailable') {
    row.innerHTML = `<span class="text-base-content/60">No Wi-Fi adapter detected.</span>`;
  } else {
    row.innerHTML = `<span class="text-base-content/60">● Not connected</span>`;
    if (disconnectBtn) disconnectBtn.classList.add('hidden');
  }
}

function renderNetworkList(networks) {
  const list = document.getElementById('wifi-networks-list');
  if (!list) return;
  if (!networks.length) {
    list.innerHTML = `<p class="text-sm text-base-content/60 py-2">No networks found. Move closer to your router and scan again.</p>`;
    list.classList.remove('hidden');
    return;
  }

  list.innerHTML = networks.map(n => {
    const bars = n.signal > 66 ? '▂▄▆█' : n.signal > 33 ? '▂▄▆' : n.signal > 10 ? '▂▄' : '▂';
    const lock = n.security && n.security !== '--' ? '🔒 ' : '';
    const active = n.in_use ? ' btn-active' : '';
    return `<button type="button" class="btn btn-ghost btn-sm justify-start gap-3 font-normal${active}" data-ssid="${n.ssid.replace(/"/g, '&quot;')}">
      <span class="text-xs font-mono text-base-content/50 w-8">${bars}</span>
      <span class="flex-1 text-left truncate">${lock}${n.ssid}</span>
      ${n.in_use ? '<span class="badge badge-success badge-xs">connected</span>' : ''}
    </button>`;
  }).join('');
  list.classList.remove('hidden');

  list.querySelectorAll('button[data-ssid]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ssidInput = document.getElementById('wifi-ssid-input');
      if (ssidInput) {
        ssidInput.value = btn.dataset.ssid;
        document.getElementById('wifi-password-input')?.focus();
      }
    });
  });
}

async function loadWifiStatus() {
  try {
    const res = await fetch(`${getApiBase()}/api/system/wifi/status`);
    const data = await res.json();
    renderWifiStatus(data);
  } catch {
    const row = document.getElementById('wifi-status-row');
    if (row) row.innerHTML = `<span class="text-base-content/60">Backend not reachable.</span>`;
  }
}

async function scanWifi() {
  const btn = document.getElementById('wifi-scan-btn');
  const list = document.getElementById('wifi-networks-list');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="loading loading-spinner loading-xs"></span> Scanning…'; }
  try {
    const res = await fetch(`${getApiBase()}/api/system/wifi/scan`);
    const data = await res.json();
    if (data.success) {
      renderNetworkList(data.networks);
    } else {
      if (list) { list.innerHTML = `<p class="text-sm text-error py-2">${data.error}</p>`; list.classList.remove('hidden'); }
    }
  } catch {
    if (list) { list.innerHTML = `<p class="text-sm text-error py-2">Scan failed — backend not reachable.</p>`; list.classList.remove('hidden'); }
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/></svg> Scan for networks'; }
  }
}

async function connectWifi() {
  const ssid = document.getElementById('wifi-ssid-input')?.value.trim();
  const password = document.getElementById('wifi-password-input')?.value;
  const btn = document.getElementById('wifi-connect-btn');

  if (!ssid) { setWifiMessage('Enter a network name first.', true); return; }

  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="loading loading-spinner loading-xs"></span> Connecting…'; }
  setWifiMessage('');

  try {
    const res = await fetch(`${getApiBase()}/api/system/wifi/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssid, password }),
    });
    const data = await res.json();
    if (data.success) {
      setWifiMessage(`✓ ${data.message}`);
      document.getElementById('wifi-password-input').value = '';
      setTimeout(loadWifiStatus, 1500);
    } else {
      setWifiMessage(data.error || 'Connection failed.', true);
    }
  } catch {
    setWifiMessage('Backend not reachable.', true);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Connect'; }
  }
}

async function disconnectWifi() {
  const btn = document.getElementById('wifi-disconnect-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Disconnecting…'; }
  try {
    const res = await fetch(`${getApiBase()}/api/system/wifi/disconnect`, { method: 'POST' });
    const data = await res.json();
    setWifiMessage(data.success ? '✓ Disconnected.' : (data.error || 'Failed.'), !data.success);
    setTimeout(loadWifiStatus, 1000);
  } catch {
    setWifiMessage('Backend not reachable.', true);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Disconnect'; }
  }
}

// ================================================================
// Virtual on-screen keyboard (touch kiosk)
// ================================================================

let _vkTarget = null;
let _vkShift  = false;
let _vkNums   = false;

const VK_ALPHA_LOWER = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['⇧','z','x','c','v','b','n','m','⌫'],
  ['123',' ','Done'],
];
const VK_ALPHA_UPPER = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['⇩','Z','X','C','V','B','N','M','⌫'],
  ['123',' ','Done'],
];
const VK_NUMS = [
  ['1','2','3','4','5','6','7','8','9','0'],
  ['-','_','.','@','#','!','&','*','(',')'],
  ['/','\\',':',';','"',"'",'%','+','=','⌫'],
  ['ABC',' ','Done'],
];

function mountVirtualKeyboard() {
  if (document.getElementById('vk-overlay')) return;
  const el = document.createElement('div');
  el.id = 'vk-overlay';
  el.style.cssText = [
    'position:fixed','bottom:0','left:0','right:0',
    'background:#1e1e2e','padding:8px 6px 12px',
    'z-index:9999','display:none',
    'box-shadow:0 -4px 24px rgba(0,0,0,0.6)',
    'border-top:2px solid #7c3aed',
  ].join(';');
  document.body.appendChild(el);
  _renderVKKeys();

  // Hide when tapping outside keyboard and outside an input
  document.addEventListener('mousedown', e => {
    if (!e.target.closest('#vk-overlay') && !e.target.matches('input')) hideVK();
  });
}

function _renderVKKeys() {
  const overlay = document.getElementById('vk-overlay');
  if (!overlay) return;
  const rows = _vkNums ? VK_NUMS : (_vkShift ? VK_ALPHA_UPPER : VK_ALPHA_LOWER);
  const SPECIAL = new Set(['⇧','⇩','⌫','Done','123','ABC']);

  overlay.innerHTML = rows.map(row => {
    const btns = row.map(k => {
      const isSpace   = k === ' ';
      const isSpecial = SPECIAL.has(k);
      const isDone    = k === 'Done';
      const flex      = isSpace ? '4' : isSpecial ? '1.6' : '1';
      const bg        = isDone ? '#7c3aed' : isSpecial ? '#2d2d50' : '#2a2a42';
      return `<button data-vk="${encodeURIComponent(k)}" style="flex:${flex};min-width:28px;padding:12px 4px;background:${bg};color:#fff;border:1px solid #444;border-radius:6px;font-size:15px;cursor:pointer;-webkit-user-select:none;user-select:none">${isSpace ? 'space' : k}</button>`;
    }).join('');
    return `<div style="display:flex;justify-content:center;gap:4px;margin-bottom:4px">${btns}</div>`;
  }).join('');

  overlay.querySelectorAll('button[data-vk]').forEach(btn => {
    btn.addEventListener('mousedown', e => { e.preventDefault(); _handleVKKey(decodeURIComponent(btn.dataset.vk)); });
  });
}

function _handleVKKey(key) {
  if (!_vkTarget) return;
  if (key === 'Done')         { hideVK(); return; }
  if (key === '⇧' || key === '⇩') { _vkShift = !_vkShift; _renderVKKeys(); return; }
  if (key === '123')          { _vkNums = true;  _renderVKKeys(); return; }
  if (key === 'ABC')          { _vkNums = false; _vkShift = false; _renderVKKeys(); return; }
  if (key === '⌫') {
    const s = _vkTarget.selectionStart;
    if (s > 0) { _vkTarget.value = _vkTarget.value.slice(0, s - 1) + _vkTarget.value.slice(s); _vkTarget.setSelectionRange(s - 1, s - 1); }
    return;
  }
  const s = _vkTarget.selectionStart;
  _vkTarget.value = _vkTarget.value.slice(0, s) + key + _vkTarget.value.slice(s);
  _vkTarget.setSelectionRange(s + 1, s + 1);
  if (_vkShift) { _vkShift = false; _renderVKKeys(); }
}

function showVK(input) {
  _vkTarget = input;
  _vkNums   = input.type === 'number';
  _vkShift  = false;
  _renderVKKeys();
  const overlay = document.getElementById('vk-overlay');
  if (overlay) overlay.style.display = 'block';
  // Scroll the input into view above the keyboard
  setTimeout(() => input.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
}

function hideVK() {
  _vkTarget = null;
  const overlay = document.getElementById('vk-overlay');
  if (overlay) overlay.style.display = 'none';
}

/** Apply saved "show connection bar" on app load (called from main.js). */
export function applySavedAppSettings() {
  const showBar = localStorage.getItem(APP_CONNECTION_BAR_KEY);
  if (showBar === '0') {
    const bar = document.getElementById('connection-status-bar');
    if (bar) bar.style.display = 'none';
  }
}
