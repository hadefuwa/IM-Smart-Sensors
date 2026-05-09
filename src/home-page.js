/**
 * Industrial HMI Homepage
 * Real-time monitoring dashboard for IO-Link Master and connected sensors
 */

import {
  createTemperatureGauge,
  createLEDIndicator,
  createCounterDisplay,
  createCapacitiveIndicator,
  createMasterStatusDisplay
} from './components/mimic-components.js';
import Chart from 'chart.js/auto';

// WebSocket connection
let socket = null;
let reconnectTimer = null;
let isHomePageActive = false;
let mimicComponents = {};
let charts = {};

// Historical data buffers
let temperatureHistory = [];
let detectionHistory = [];
let detectionCycleCount = 0;
let _lastDetectedState = false;
const MAX_HISTORY_POINTS = 50;

// API/WebSocket base
const API_BASE = window.IO_LINK_API_BASE || window.location.origin;
const WS_BASE = API_BASE.replace(/^http/, 'ws');

/**
 * Render the home page HTML
 */
export function renderHomePage() {
  return `
    <div class="hmi-homepage space-y-4">
      <!-- Current State Overview Section -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content mb-4">Current State Overview</h2>

          <!-- Mimic Components Grid -->
          <div class="mimic-grid">
            <div id="mimic-master" class="mimic-component"></div>
            <div id="mimic-temperature" class="mimic-component"></div>
            <div id="mimic-photoelectric" class="mimic-component"></div>
            <div id="mimic-capacitive" class="mimic-component"></div>
            <div id="mimic-led" class="mimic-component"></div>
          </div>
        </div>
      </div>

      <!-- Condition Monitoring -->
      <div class="space-y-4">
        <!-- Temperature Trend -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h3 class="card-title text-base-content text-lg">Temperature Trend</h3>
            <div class="h-48">
              <canvas id="chart-temperature-trend"></canvas>
            </div>
          </div>
        </div>

        <!-- Detection History + Cycle Counter -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="card bg-base-200 shadow-xl">
            <div class="card-body">
              <h3 class="card-title text-base-content text-lg">Detection History</h3>
              <div class="h-32">
                <canvas id="chart-detection-history"></canvas>
              </div>
            </div>
          </div>

          <div class="card bg-base-200 shadow-xl">
            <div class="card-body">
              <h3 class="card-title text-base-content text-lg">Cycle Counter</h3>
              <div class="flex flex-col justify-center h-32">
                <div class="text-center mb-2">
                  <div class="text-3xl font-bold" id="cycle-count-display">0</div>
                  <div class="text-sm opacity-60">/ 1,000,000 cycles</div>
                </div>
                <progress id="cycle-progress" class="progress progress-success w-full" value="0" max="1000000"></progress>
              </div>
              <div id="cycle-service-alert" class="hidden mt-2 alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Service due soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Health & Heartbeat Section -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content mb-4">Health & Heartbeat</h2>

          <div class="overflow-x-auto">
            <table class="table table-zebra touch-stack-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Status</th>
                  <th>Last Update</th>
                  <th>Events</th>
                </tr>
              </thead>
              <tbody id="health-table-body">
                <tr>
                  <td data-label="Component">IO-Link Master</td>
                  <td data-label="Status"><span class="badge badge-ghost">Checking...</span></td>
                  <td data-label="Last Update">-</td>
                  <td data-label="Events">-</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-4">
            <h3 class="text-sm font-semibold mb-2">Recent Events</h3>
            <div id="event-log" class="rounded p-3 font-mono text-xs h-32 overflow-y-auto">
              <div class="terminal-system-msg">[System] Waiting for events...</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Configuration Modals -->
      ${renderConfigModals()}
    </div>
  `;
}

/**
 * Render configuration modals for each component
 */
function renderConfigModals() {
  return `
    <!-- Temperature Sensor Config Modal -->
    <dialog id="modal-temp-config" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Temperature Sensor Configuration</h3>
        <div class="py-4 space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">High Alarm Threshold (°C)</span></label>
            <input type="number" id="temp-high-alarm" class="input input-bordered" value="90" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Low Alarm Threshold (°C)</span></label>
            <input type="number" id="temp-low-alarm" class="input input-bordered" value="10" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Calibration Offset (°C)</span></label>
            <input type="number" id="temp-offset" class="input input-bordered" value="0" step="0.1" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Display Units</span></label>
            <select id="temp-units" class="select select-bordered">
              <option value="C">Celsius (°C)</option>
              <option value="F">Fahrenheit (°F)</option>
            </select>
          </div>
        </div>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm btn-ghost">Cancel</button>
            <button class="btn btn-sm btn-primary">Save</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <!-- Photoelectric Sensor Config Modal -->
    <dialog id="modal-photo-config" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Photoelectric Sensor Configuration</h3>
        <div class="py-4 space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Counter Value</span></label>
            <div class="flex gap-2">
              <input type="number" id="photo-counter" class="input input-bordered flex-1" value="0" readonly />
              <button id="photo-reset-counter" class="btn btn-error">Reset</button>
            </div>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Detection Mode</span></label>
            <select id="photo-mode" class="select select-bordered">
              <option value="light-on">Light-On</option>
              <option value="dark-on">Dark-On</option>
            </select>
          </div>
        </div>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm btn-ghost">Cancel</button>
            <button class="btn btn-sm btn-primary">Save</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <!-- Capacitive Sensor Config Modal -->
    <dialog id="modal-capacitive-config" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Capacitive Sensor Configuration</h3>
        <div class="py-4 space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Sensing Range (mm)</span></label>
            <input type="number" id="cap-range" class="input input-bordered" value="12" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Output Mode</span></label>
            <select id="cap-output" class="select select-bordered">
              <option value="NO">Normally Open (NO)</option>
              <option value="NC">Normally Closed (NC)</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Maintenance Cycle Limit</span></label>
            <input type="number" id="cap-cycle-limit" class="input input-bordered" value="1000000" />
          </div>
        </div>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm btn-ghost">Cancel</button>
            <button class="btn btn-sm btn-primary">Save</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <!-- Status LED Config Modal -->
    <dialog id="modal-led-config" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Status LED Configuration</h3>
        <div class="py-4 space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Color</span></label>
            <select id="led-color" class="select select-bordered">
              <option value="Green">Green</option>
              <option value="Red">Red</option>
              <option value="Orange">Orange</option>
              <option value="Amber">Amber</option>
              <option value="Yellow">Yellow</option>
              <option value="Blue">Blue</option>
              <option value="White">White</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Animation Mode</span></label>
            <select id="led-animation" class="select select-bordered">
              <option value="Steady">Steady</option>
              <option value="Flash">Flash</option>
              <option value="Two Color Flash">Two Color Flash</option>
              <option value="Intensity Sweep">Intensity Sweep</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Intensity</span></label>
            <select id="led-intensity" class="select select-bordered">
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div class="form-control">
            <button id="led-test-mode" class="btn btn-outline btn-sm">Test Mode (Cycle All States)</button>
          </div>
        </div>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm btn-ghost">Cancel</button>
            <button class="btn btn-sm btn-primary">Save</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <!-- IO-Link Master Config Modal -->
    <dialog id="modal-master-config" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">IO-Link Master Configuration</h3>
        <div class="py-4 space-y-4">
          <div class="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>For IP address and port configuration, please visit the Settings page.</span>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Poll Interval (seconds)</span></label>
            <input type="number" id="master-poll-interval" class="input input-bordered" value="1" min="1" max="10" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Timeout (seconds)</span></label>
            <input type="number" id="master-timeout" class="input input-bordered" value="2" min="1" max="10" />
          </div>
        </div>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm btn-ghost">Cancel</button>
            <button class="btn btn-sm btn-primary">Save</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
  `;
}

/**
 * Update chart colors when theme changes
 */
function updateChartColors() {
  const colors = getChartColors();

  if (charts.temperature) {
    charts.temperature.options.scales.y.grid.color = colors.gridColor;
    charts.temperature.options.scales.y.ticks.color = colors.tickColor;
    charts.temperature.options.scales.x.grid.color = colors.gridColor;
    charts.temperature.options.scales.x.ticks.color = colors.tickColor;
    charts.temperature.update('none');
  }

  if (charts.detectionHistory) {
    charts.detectionHistory.options.scales.x.grid.color = colors.gridColor;
    charts.detectionHistory.options.scales.x.ticks.color = colors.tickColor;
    charts.detectionHistory.options.scales.y.grid.color = colors.gridColor;
    charts.detectionHistory.options.scales.y.ticks.color = colors.tickColor;
    charts.detectionHistory.update('none');
  }
}

/**
 * Initialize the home page
 */
export function initHomePage() {
  console.log('Initializing HMI Homepage...');
  isHomePageActive = true;

  // Restore cycle count from sessionStorage
  const saved = sessionStorage.getItem('photoDetectionCycles');
  if (saved) detectionCycleCount = parseInt(saved, 10) || 0;

  initializeMimicComponents();
  initializeCharts();
  setupConfigModalHandlers();

  // Update cycle counter display with restored value
  if (detectionCycleCount > 0) updateCycleCounter(detectionCycleCount);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        updateChartColors();
      }
    });
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  connectWebSocket();
}

/**
 * Initialize all mimic components
 */
function initializeMimicComponents() {
  mimicComponents.master = createMasterStatusDisplay('mimic-master', {});
  mimicComponents.temperature = createTemperatureGauge('mimic-temperature', 0);
  mimicComponents.photoelectric = createCounterDisplay('mimic-photoelectric', {});
  mimicComponents.capacitive = createCapacitiveIndicator('mimic-capacitive', {});
  mimicComponents.led = createLEDIndicator('mimic-led', {});
}

/**
 * Get chart colors based on current theme
 */
function getChartColors() {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const isDark = theme === 'dark';
  return {
    gridColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    tickColor: isDark ? '#ffffff' : '#000000',
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)'
  };
}

/**
 * Initialize Chart.js charts
 */
function initializeCharts() {
  const colors = getChartColors();

  // Temperature trend chart
  const tempCtx = document.getElementById('chart-temperature-trend');
  if (tempCtx) {
    charts.temperature = new Chart(tempCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Temperature (°C)',
          data: [],
          borderColor: colors.borderColor,
          backgroundColor: colors.backgroundColor,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: colors.gridColor },
            ticks: { color: colors.tickColor }
          },
          x: {
            grid: { color: colors.gridColor },
            ticks: { color: colors.tickColor, maxTicksLimit: 10 }
          }
        }
      }
    });
  }

  // Detection history step chart (replaces signal quality bar)
  const detectionCtx = document.getElementById('chart-detection-history');
  if (detectionCtx) {
    charts.detectionHistory = new Chart(detectionCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Detected',
          data: [],
          borderColor: colors.borderColor,
          backgroundColor: colors.backgroundColor,
          stepped: 'before',
          fill: true,
          pointRadius: 0,
          tension: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            min: -0.1,
            max: 1.2,
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.tickColor,
              stepSize: 1,
              callback: v => v === 1 ? 'ON' : v === 0 ? 'OFF' : ''
            }
          },
          x: {
            grid: { color: colors.gridColor },
            ticks: { color: colors.tickColor, maxTicksLimit: 8 }
          }
        }
      }
    });
  }
}

/**
 * Set up click handlers for configuration modals
 */
function setupConfigModalHandlers() {
  const bindings = [
    ['mimic-temperature',  'modal-temp-config'],
    ['mimic-photoelectric', 'modal-photo-config'],
    ['mimic-capacitive',   'modal-capacitive-config'],
    ['mimic-led',          'modal-led-config'],
    ['mimic-master',       'modal-master-config'],
  ];
  bindings.forEach(([elId, modalId]) => {
    const el = document.getElementById(elId);
    if (el) el.addEventListener('click', () => document.getElementById(modalId)?.showModal());
  });

  const resetBtn = document.getElementById('photo-reset-counter');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      detectionCycleCount = 0;
      _lastDetectedState = false;
      sessionStorage.setItem('photoDetectionCycles', '0');
      updateCycleCounter(0);
    });
  }
}

/**
 * Connect to WebSocket for real-time data
 */
function connectWebSocket() {
  if (!isHomePageActive) return;
  const wsUrl = `${WS_BASE}/ws`;
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    addEventLog('System', 'WebSocket connection established', 'success');
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      updateDashboard(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  socket.onerror = () => {
    addEventLog('System', 'WebSocket connection error', 'error');
  };

  socket.onclose = () => {
    if (!isHomePageActive) return;
    addEventLog('System', 'WebSocket connection closed. Reconnecting...', 'warning');
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connectWebSocket, 5000);
  };
}

/**
 * Update dashboard with new data from WebSocket
 */
function updateDashboard(data) {
  if (mimicComponents.master) mimicComponents.master.update(data);
  updateHealthTable(data);

  if (data.ports && Array.isArray(data.ports)) {
    data.ports.forEach(port => processPortData(port));
  }
}

/**
 * Process data from a single port
 */
function processPortData(port) {
  const deviceType = getDeviceType(port);

  if (deviceType === 'temperature' && mimicComponents.temperature) {
    const temp = port.pdin_decoded?.temperature_c || 0;
    mimicComponents.temperature.update(temp);
    addToHistory(temperatureHistory, temp);
    updateTemperatureChart();
  } else if (deviceType === 'photoelectric' && mimicComponents.photoelectric) {
    mimicComponents.photoelectric.update(port.pdin_decoded || {});

    // Track rising edges (OFF → ON) as detection cycles
    const isDetected = port.pdin_decoded?.object_detected || false;
    addToHistory(detectionHistory, isDetected ? 1 : 0);
    if (isDetected && !_lastDetectedState) {
      detectionCycleCount++;
      sessionStorage.setItem('photoDetectionCycles', String(detectionCycleCount));
    }
    _lastDetectedState = isDetected;
    updateDetectionHistory();
    updateCycleCounter(detectionCycleCount);
  } else if (deviceType === 'capacitive' && mimicComponents.capacitive) {
    mimicComponents.capacitive.update(port.pdin_decoded || {});
  } else if (deviceType === 'led' && mimicComponents.led) {
    mimicComponents.led.update(port.pdout_decoded || {});
  }
}

/**
 * Determine device type from port data
 */
function getDeviceType(port) {
  const backendType = port.device_type || '';
  if (backendType === 'photo_electric') return 'photoelectric';
  if (backendType === 'temperature') return 'temperature';
  if (backendType === 'status_led') return 'led';
  if (backendType === 'capacitive') return 'capacitive';

  const name = (port.name || '').toUpperCase();
  if (name.includes('TEMP') || name.includes('TN') || name.includes('TR')) return 'temperature';
  if (name.includes('PHOTO') || name.includes('O5D') || name.includes('O2D')) return 'photoelectric';
  if (name.includes('CAPACITIVE') || name.includes('23772') || name.includes('KI') || name.includes('KQ')) return 'capacitive';
  if (name.includes('LED') || name.includes('CL50') || name.includes('LIGHT')) return 'led';

  return 'unknown';
}

function addToHistory(historyArray, value) {
  historyArray.push(value);
  if (historyArray.length > MAX_HISTORY_POINTS) historyArray.shift();
}

function updateTemperatureChart() {
  if (!charts.temperature) return;
  const labels = temperatureHistory.map((_, i) => `-${MAX_HISTORY_POINTS - i}s`);
  charts.temperature.data.labels = labels;
  charts.temperature.data.datasets[0].data = temperatureHistory;
  charts.temperature.update('none');
}

function updateDetectionHistory() {
  if (!charts.detectionHistory) return;
  const labels = detectionHistory.map((_, i) => `-${detectionHistory.length - i}s`);
  charts.detectionHistory.data.labels = labels;
  charts.detectionHistory.data.datasets[0].data = detectionHistory;
  charts.detectionHistory.update('none');
}

function updateCycleCounter(count) {
  const display = document.getElementById('cycle-count-display');
  const progress = document.getElementById('cycle-progress');
  const alert = document.getElementById('cycle-service-alert');

  if (display) display.textContent = count.toLocaleString();

  if (progress) {
    progress.value = count;
    progress.className = count > 900000
      ? 'progress progress-error w-full'
      : count > 750000
        ? 'progress progress-warning w-full'
        : 'progress progress-success w-full';
  }

  if (alert) {
    if (count > 900000) alert.classList.remove('hidden');
    else alert.classList.add('hidden');
  }
}

function updateHealthTable(data) {
  const tbody = document.getElementById('health-table-body');
  if (!tbody) return;

  const isConnected = data.success || false;
  const lastUpdate = new Date().toLocaleTimeString();
  const activePortsCount = data.ports ? data.ports.filter(p => p.mode && p.mode !== 'DEACTIVATED').length : 0;

  tbody.innerHTML = `
    <tr>
      <td data-label="Component">IO-Link Master</td>
      <td data-label="Status"><span class="badge ${isConnected ? 'badge-success' : 'badge-error'}">${isConnected ? 'Connected' : 'Disconnected'}</span></td>
      <td data-label="Last Update">${lastUpdate}</td>
      <td data-label="Events">${activePortsCount} active ports</td>
    </tr>
    <tr>
      <td data-label="Component">All Sensors</td>
      <td data-label="Status"><span class="badge badge-success">Online</span></td>
      <td data-label="Last Update">${lastUpdate}</td>
      <td data-label="Events">No faults</td>
    </tr>
  `;
}

function addEventLog(component, message, level = 'info') {
  const eventLog = document.getElementById('event-log');
  if (!eventLog) return;

  const timestamp = new Date().toLocaleTimeString();
  const colorClass = level === 'error' ? 'text-error' : level === 'warning' ? 'text-warning' : 'text-success';

  const entry = document.createElement('div');
  entry.className = colorClass;
  entry.textContent = `[${timestamp}] ${component}: ${message}`;
  eventLog.appendChild(entry);

  while (eventLog.children.length > 20) eventLog.removeChild(eventLog.firstChild);
  eventLog.scrollTop = eventLog.scrollHeight;
}

/**
 * Destroy the home page and clean up
 */
export function destroyHomePage() {
  console.log('Destroying HMI Homepage...');
  isHomePageActive = false;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (socket) {
    socket.close();
    socket = null;
  }

  Object.values(charts).forEach(chart => { if (chart) chart.destroy(); });
  charts = {};
  mimicComponents = {};

  temperatureHistory = [];
  detectionHistory = [];
}
