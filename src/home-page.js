/**
 * Industrial HMI Homepage
 * Real-time monitoring dashboard for IO-Link Master and connected sensors
 */

import { TerminalLog } from './components/terminal-log.js';
import {
  createTemperatureGauge,
  createLEDIndicator,
  createCounterDisplay,
  createProximityIndicator,
  createMasterStatusDisplay
} from './components/mimic-components.js';
import Chart from 'chart.js/auto';

// WebSocket connection
let socket = null;
let reconnectTimer = null;
let isHomePageActive = false;
let terminalLog = null;
let mimicComponents = {};
let charts = {};

// Historical data buffers
let temperatureHistory = [];
let signalQualityHistory = [];
let cycleCountHistory = [];
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
      <!-- Page Header -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 class="text-2xl font-bold text-base-content">HMI Dashboard</h1>
          <p class="text-base-content/70">Real-time IO-Link Master monitoring and control</p>
        </div>
      </div>

      <!-- Current State Overview Section -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content mb-4">Current State Overview</h2>
          
          <!-- Mimic Components Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
            <!-- IO-Link Master Status -->
            <div id="mimic-master" class="mimic-component"></div>
            
            <!-- Temperature Sensor -->
            <div id="mimic-temperature" class="mimic-component"></div>
            
            <!-- Photoelectric Sensor -->
            <div id="mimic-photoelectric" class="mimic-component"></div>
            
            <!-- Proximity Sensor -->
            <div id="mimic-proximity" class="mimic-component"></div>
            
            <!-- Status LED -->
            <div id="mimic-led" class="mimic-component"></div>
          </div>
        </div>
      </div>

      <!-- Main Content: Condition Monitoring + Terminal Log -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <!-- Condition Monitoring Zone (Left 2 columns) -->
        <div class="xl:col-span-2 space-y-4">
          <!-- Temperature Trend -->
          <div class="card bg-base-200 shadow-xl">
            <div class="card-body">
              <h3 class="card-title text-base-content text-lg">Temperature Trend (24h)</h3>
              <div class="h-48">
                <canvas id="chart-temperature-trend"></canvas>
              </div>
            </div>
          </div>

          <!-- Signal Quality and Cycle Counter -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Signal Quality Bar -->
            <div class="card bg-base-200 shadow-xl">
              <div class="card-body">
                <h3 class="card-title text-base-content text-lg">Signal Quality</h3>
                <div class="h-32">
                  <canvas id="chart-signal-quality"></canvas>
                </div>
                <div id="signal-quality-alert" class="hidden mt-2 alert alert-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Clean lens recommended</span>
                </div>
              </div>
            </div>

            <!-- Cycle Counter Progress -->
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

        <!-- Terminal Log (Right column) -->
        <div class="lg:col-span-1">
          <div class="card bg-base-200 shadow-xl h-full">
            <div class="card-body p-0 flex flex-col terminal-panel-body">
              <div id="terminal-log-container" class="flex-1"></div>
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

          <!-- Event Log -->
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
            <label class="label"><span class="label-text">Signal Quality Threshold (%)</span></label>
            <input type="number" id="photo-quality-threshold" class="input input-bordered" value="20" />
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

    <!-- Proximity Sensor Config Modal -->
    <dialog id="modal-prox-config" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Proximity Sensor Configuration</h3>
        <div class="py-4 space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Detection Range (mm)</span></label>
            <input type="number" id="prox-range" class="input input-bordered" value="50" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Switching Point (mm)</span></label>
            <input type="number" id="prox-switching" class="input input-bordered" value="25" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Output Mode</span></label>
            <select id="prox-output" class="select select-bordered">
              <option value="NO">Normally Open (NO)</option>
              <option value="NC">Normally Closed (NC)</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Maintenance Cycle Limit</span></label>
            <input type="number" id="prox-cycle-limit" class="input input-bordered" value="1000000" />
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
          <div class="form-control">
            <label class="label"><span class="label-text">Data Source</span></label>
            <select id="master-data-source" class="select select-bordered">
              <option value="real">Real Data (Hardware)</option>
              <option value="simulated">Simulated Data (Demo)</option>
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
  `;
}

/**
 * Update chart colors when theme changes
 */
function updateChartColors() {
  const colors = getChartColors();
  
  // Update temperature chart
  if (charts.temperature) {
    charts.temperature.options.scales.y.grid.color = colors.gridColor;
    charts.temperature.options.scales.y.ticks.color = colors.tickColor;
    charts.temperature.options.scales.x.grid.color = colors.gridColor;
    charts.temperature.options.scales.x.ticks.color = colors.tickColor;
    charts.temperature.update('none');
  }
  
  // Update signal quality chart
  if (charts.signalQuality) {
    charts.signalQuality.options.scales.x.grid.color = colors.gridColor;
    charts.signalQuality.options.scales.x.ticks.color = colors.tickColor;
    charts.signalQuality.options.scales.y.ticks.color = colors.tickColor;
    charts.signalQuality.update('none');
  }
}

/**
 * Initialize the home page
 */
export function initHomePage() {
  console.log('Initializing HMI Homepage...');
  isHomePageActive = true;

  // Initialize terminal log
  terminalLog = new TerminalLog('terminal-log-container');
  terminalLog.init();

  // Initialize mimic components
  initializeMimicComponents();

  // Initialize charts
  initializeCharts();

  // Set up click handlers for mimic components to open config modals
  setupConfigModalHandlers();

  // Listen for theme changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        updateChartColors();
      }
    });
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  // Connect to WebSocket
  connectWebSocket();
}

/**
 * Initialize all mimic components
 */
function initializeMimicComponents() {
  mimicComponents.master = createMasterStatusDisplay('mimic-master', {});
  mimicComponents.temperature = createTemperatureGauge('mimic-temperature', 0);
  mimicComponents.photoelectric = createCounterDisplay('mimic-photoelectric', {});
  mimicComponents.proximity = createProximityIndicator('mimic-proximity', {});
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
        plugins: {
          legend: { display: false }
        },
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

  // Signal quality chart
  const signalCtx = document.getElementById('chart-signal-quality');
  if (signalCtx) {
    charts.signalQuality = new Chart(signalCtx, {
      type: 'bar',
      data: {
        labels: ['Signal Quality'],
        datasets: [{
          label: 'Quality (%)',
          data: [0],
          backgroundColor: colors.borderColor
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            grid: { color: colors.gridColor },
            ticks: { color: colors.tickColor }
          },
          y: {
            grid: { display: false },
            ticks: { color: colors.tickColor }
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
  // Temperature sensor
  const tempMimic = document.getElementById('mimic-temperature');
  if (tempMimic) {
    tempMimic.addEventListener('click', () => {
      document.getElementById('modal-temp-config').showModal();
    });
  }

  // Photoelectric sensor
  const photoMimic = document.getElementById('mimic-photoelectric');
  if (photoMimic) {
    photoMimic.addEventListener('click', () => {
      document.getElementById('modal-photo-config').showModal();
    });
  }

  // Proximity sensor
  const proxMimic = document.getElementById('mimic-proximity');
  if (proxMimic) {
    proxMimic.addEventListener('click', () => {
      document.getElementById('modal-prox-config').showModal();
    });
  }

  // Status LED
  const ledMimic = document.getElementById('mimic-led');
  if (ledMimic) {
    ledMimic.addEventListener('click', () => {
      document.getElementById('modal-led-config').showModal();
    });
  }

  // IO-Link Master
  const masterMimic = document.getElementById('mimic-master');
  if (masterMimic) {
    masterMimic.addEventListener('click', () => {
      document.getElementById('modal-master-config').showModal();
    });
  }

  // Counter reset button
  const resetBtn = document.getElementById('photo-reset-counter');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (mimicComponents.photoelectric && mimicComponents.photoelectric.reset) {
        mimicComponents.photoelectric.reset();
      }
    });
  }
}

/**
 * Connect to WebSocket for real-time data
 */
function connectWebSocket() {
  if (!isHomePageActive) return;
  const wsUrl = `${WS_BASE}/ws`;
  console.log(`Connecting to WebSocket: ${wsUrl}`);

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('WebSocket connected');
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

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    addEventLog('System', 'WebSocket connection error', 'error');
  };

  socket.onclose = () => {
    if (!isHomePageActive) return;
    console.log('WebSocket closed. Attempting to reconnect in 5 seconds...');
    addEventLog('System', 'WebSocket connection closed. Reconnecting...', 'warning');
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connectWebSocket, 5000);
  };
}

/**
 * Update dashboard with new data from WebSocket
 */
function updateDashboard(data) {
  // Update master status
  if (mimicComponents.master) {
    mimicComponents.master.update(data);
  }

  // Update health table
  updateHealthTable(data);

  // Process each port
  if (data.ports && Array.isArray(data.ports)) {
    data.ports.forEach(port => {
      processPortData(port);
    });
  }

  // Update supervision data
  if (data.supervision) {
    updateSupervisionData(data.supervision);
  }
}

/**
 * Process data from a single port
 */
function processPortData(port) {
  const portNum = port.port;
  const deviceType = getDeviceType(port);

  // Add to terminal log
  if (terminalLog) {
    terminalLog.append({
      port: portNum,
      portName: port.name || `Port ${portNum}`,
      pdinHex: port.pdin_hex || '00',
      pdoutHex: port.pdout_hex || '00',
      pdinDecoded: port.pdin_decoded?.description || '',
      pdoutDecoded: port.pdout_decoded?.description || '',
      level: 'normal'
    });
  }

  // Update appropriate mimic component based on device type
  if (deviceType === 'temperature' && mimicComponents.temperature) {
    const temp = port.pdin_decoded?.temperature_c || 0;
    mimicComponents.temperature.update(temp);
    
    // Add to temperature history
    addToHistory(temperatureHistory, temp);
    updateTemperatureChart();
  } else if (deviceType === 'photoelectric' && mimicComponents.photoelectric) {
    mimicComponents.photoelectric.update(port.pdin_decoded || {});
    
    // Update signal quality
    const quality = port.pdin_decoded?.signal_quality_percent || 0;
    updateSignalQuality(quality);
    
    // Update cycle counter display
    if (mimicComponents.photoelectric.getCount) {
      const count = mimicComponents.photoelectric.getCount();
      updateCycleCounter(count);
    }
  } else if (deviceType === 'proximity' && mimicComponents.proximity) {
    mimicComponents.proximity.update(port.pdin_decoded || {});
  } else if (deviceType === 'led' && mimicComponents.led) {
    mimicComponents.led.update(port.pdout_decoded || {});
  }
}

/**
 * Determine device type from port data
 */
function getDeviceType(port) {
  const name = (port.name || '').toUpperCase();
  
  if (name.includes('TEMP') || name.includes('TN') || name.includes('TR')) {
    return 'temperature';
  } else if (name.includes('PHOTO') || name.includes('O5D') || name.includes('O2D')) {
    return 'photoelectric';
  } else if (name.includes('PROX') || name.includes('INDUCTIVE')) {
    return 'proximity';
  } else if (name.includes('LED') || name.includes('CL50') || name.includes('LIGHT')) {
    return 'led';
  }
  
  return 'unknown';
}

/**
 * Add value to history buffer
 */
function addToHistory(historyArray, value) {
  historyArray.push(value);
  if (historyArray.length > MAX_HISTORY_POINTS) {
    historyArray.shift();
  }
}

/**
 * Update temperature chart
 */
function updateTemperatureChart() {
  if (!charts.temperature) return;

  const labels = temperatureHistory.map((_, i) => `-${MAX_HISTORY_POINTS - i}s`);
  charts.temperature.data.labels = labels;
  charts.temperature.data.datasets[0].data = temperatureHistory;
  charts.temperature.update('none'); // 'none' mode for better performance
}

/**
 * Update signal quality display
 */
function updateSignalQuality(quality) {
  if (!charts.signalQuality) return;

  // Update chart
  charts.signalQuality.data.datasets[0].data = [quality];
  
  // Change color based on quality
  if (quality < 40) {
    charts.signalQuality.data.datasets[0].backgroundColor = '#ef4444';
  } else if (quality < 70) {
    charts.signalQuality.data.datasets[0].backgroundColor = '#eab308';
  } else {
    charts.signalQuality.data.datasets[0].backgroundColor = '#22c55e';
  }
  
  charts.signalQuality.update('none');

  // Show/hide alert
  const alert = document.getElementById('signal-quality-alert');
  if (alert) {
    if (quality < 20) {
      alert.classList.remove('hidden');
    } else {
      alert.classList.add('hidden');
    }
  }
}

/**
 * Update cycle counter display
 */
function updateCycleCounter(count) {
  const display = document.getElementById('cycle-count-display');
  const progress = document.getElementById('cycle-progress');
  const alert = document.getElementById('cycle-service-alert');

  if (display) {
    display.textContent = count.toLocaleString();
  }

  if (progress) {
    progress.value = count;
    
    // Change color based on percentage
    if (count > 900000) {
      progress.className = 'progress progress-error w-full';
    } else if (count > 750000) {
      progress.className = 'progress progress-warning w-full';
    } else {
      progress.className = 'progress progress-success w-full';
    }
  }

  if (alert) {
    if (count > 900000) {
      alert.classList.remove('hidden');
    } else {
      alert.classList.add('hidden');
    }
  }
}

/**
 * Update health table
 */
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

/**
 * Update supervision data (voltage, current, etc.)
 */
function updateSupervisionData(supervision) {
  // This could be expanded to show master voltage/current/temperature
  // For now, just log it
  console.log('Supervision data:', supervision);
}

/**
 * Add event to event log
 */
function addEventLog(component, message, level = 'info') {
  const eventLog = document.getElementById('event-log');
  if (!eventLog) return;

  const timestamp = new Date().toLocaleTimeString();
  const colorClass = level === 'error' ? 'text-error' : level === 'warning' ? 'text-warning' : 'text-success';
  
  const entry = document.createElement('div');
  entry.className = colorClass;
  entry.textContent = `[${timestamp}] ${component}: ${message}`;
  
  eventLog.appendChild(entry);
  
  // Keep only last 20 entries
  while (eventLog.children.length > 20) {
    eventLog.removeChild(eventLog.firstChild);
  }
  
  // Auto-scroll
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

  // Close WebSocket
  if (socket) {
    socket.close();
    socket = null;
  }

  // Destroy terminal log
  if (terminalLog) {
    terminalLog.destroy();
    terminalLog = null;
  }

  // Destroy charts
  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy();
  });
  charts = {};

  // Clear mimic components
  mimicComponents = {};

  // Clear history
  temperatureHistory = [];
  signalQualityHistory = [];
  cycleCountHistory = [];
}
