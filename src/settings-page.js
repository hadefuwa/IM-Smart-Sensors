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

/** Apply saved "show connection bar" on app load (called from main.js). */
export function applySavedAppSettings() {
  const showBar = localStorage.getItem(APP_CONNECTION_BAR_KEY);
  if (showBar === '0') {
    const bar = document.getElementById('connection-status-bar');
    if (bar) bar.style.display = 'none';
  }
}
