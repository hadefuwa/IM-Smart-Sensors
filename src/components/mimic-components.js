/**
 * Mimic Components for Industrial HMI
 * Reusable visual components that mimic real industrial sensors and devices
 */

/**
 * Create a temperature gauge with digital readout and radial progress indicator
 * @param {string} containerId - ID of the container element
 * @param {number} value - Temperature value in Celsius
 * @param {Object} options - Configuration options
 * @returns {Object} Component controller with update method
 */
export function createTemperatureGauge(containerId, value = 0, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Temperature gauge container ${containerId} not found`);
    return null;
  }

  // Default options
  const config = {
    min: 0,
    max: 100,
    warningThreshold: 80,
    criticalThreshold: 90,
    unit: '°C',
    ...options
  };

  // Calculate percentage for radial gauge
  const calculatePercentage = (temp) => {
    return Math.min(100, Math.max(0, ((temp - config.min) / (config.max - config.min)) * 100));
  };

  // Determine color based on thresholds
  const getColor = (temp) => {
    if (temp >= config.criticalThreshold) return 'text-error';
    if (temp >= config.warningThreshold) return 'text-warning';
    return 'text-success';
  };

  // Initial render
  const render = (temp) => {
    const percentage = calculatePercentage(temp);
    const colorClass = getColor(temp);
    
    container.innerHTML = `
      <div class="temp-gauge-wrapper flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-base-300/50 rounded-lg transition-all">
        <div class="relative">
          <div class="radial-progress ${colorClass}" style="--value:${percentage}; --size:8rem; --thickness:0.5rem;" role="progressbar">
            <div class="flex flex-col items-center">
              <span class="text-3xl font-bold">${temp.toFixed(1)}</span>
              <span class="text-sm opacity-70">${config.unit}</span>
            </div>
          </div>
        </div>
        <div class="mt-3 text-center">
          <div class="text-sm font-semibold">Temperature Sensor</div>
          <div class="text-xs opacity-60">PT100</div>
        </div>
      </div>
    `;
  };

  // Initial render
  render(value);

  // Return controller object
  return {
    update: (newValue) => {
      render(newValue);
    },
    setConfig: (newConfig) => {
      Object.assign(config, newConfig);
      render(value);
    }
  };
}

/**
 * Create an LED status indicator that mimics the CL50 LED tower
 * @param {string} containerId - ID of the container element
 * @param {Object} state - LED state object from decoder
 * @returns {Object} Component controller with update method
 */
export function createLEDIndicator(containerId, state = {}, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`LED indicator container ${containerId} not found`);
    return null;
  }

  // Color mapping for CSS
  const colorToCSS = {
    'Green': '#22c55e',
    'Red': '#ef4444',
    'Orange': '#f97316',
    'Amber': '#f59e0b',
    'Yellow': '#eab308',
    'Lime Green': '#84cc16',
    'Spring Green': '#10b981',
    'Cyan': '#06b6d4',
    'Sky Blue': '#0ea5e9',
    'Blue': '#3b82f6',
    'Violet': '#8b5cf6',
    'Magenta': '#d946ef',
    'Rose': '#f43f5e',
    'White': '#ffffff',
    'Off': '#374151'
  };

  // Render the LED indicator
  const render = (ledState) => {
    const color = ledState.color1 || 'Off';
    const cssColor = colorToCSS[color] || '#374151';
    const isOn = ledState.led_on || false;
    const animation = ledState.animation || 'Off';
    
    // Animation class
    let animationClass = '';
    if (isOn && animation === 'Flash') {
      animationClass = 'led-flash';
    } else if (isOn && animation === 'Two Color Flash') {
      animationClass = 'led-pulse';
    }

    container.innerHTML = `
      <div class="led-indicator-wrapper flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-base-300/50 rounded-lg transition-all">
        <div class="relative">
          <!-- LED Stack representation (3 segments) -->
          <div class="flex flex-col gap-1">
            <div class="led-segment w-16 h-16 rounded-full border-4 border-base-content/20 flex items-center justify-center ${animationClass}" style="background-color: ${isOn ? cssColor : '#374151'}; box-shadow: ${isOn ? `0 0 20px ${cssColor}, 0 0 40px ${cssColor}` : 'none'};">
              <div class="w-8 h-8 rounded-full bg-white/30"></div>
            </div>
          </div>
        </div>
        <div class="mt-3 text-center">
          <div class="text-sm font-semibold">Status LED</div>
          <div class="text-xs opacity-60">${color} - ${animation}</div>
        </div>
      </div>
    `;
  };

  // Initial render
  render(state);

  // Return controller object
  return {
    update: (newState) => {
      render(newState);
    }
  };
}

/**
 * Create a counter display for photoelectric sensor
 * @param {string} containerId - ID of the container element
 * @param {Object} state - Sensor state object
 * @returns {Object} Component controller with update method
 */
export function createCounterDisplay(containerId, state = {}, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Counter display container ${containerId} not found`);
    return null;
  }

  // Default options
  const config = {
    maxCount: 1000000,
    ...options
  };

  let currentCount = 0;

  // Render the counter display
  const render = (sensorState) => {
    // Support both proximity (object_present) and legacy photoelectric (object_detected)
    const isDetected = sensorState.object_present || sensorState.object_detected || false;

    if (isDetected && !render.lastDetected) {
      currentCount++;
    }
    render.lastDetected = isDetected;

    container.innerHTML = `
      <div class="counter-display-wrapper flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-base-300/50 rounded-lg transition-all">
        <div class="mb-3">
          <div class="indicator-light w-16 h-16 rounded-full border-4 border-base-content/20 flex items-center justify-center" style="background-color: ${isDetected ? '#22c55e' : '#374151'}; box-shadow: ${isDetected ? '0 0 20px #22c55e' : 'none'};">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 ${isDetected ? 'text-white' : 'text-base-content/30'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div class="text-center mb-2">
          <div class="text-2xl font-bold font-mono">${currentCount.toLocaleString()}</div>
          <div class="text-xs opacity-60">Detection Count</div>
        </div>
        <div class="mt-1 text-center">
          <div class="text-sm font-semibold">Proximity Sensor</div>
          <div class="text-xs opacity-60">${isDetected ? 'Metal Detected' : 'No Object'}</div>
        </div>
      </div>
    `;
  };

  // Initial render
  render(state);

  // Return controller object
  return {
    update: (newState) => {
      render(newState);
    },
    reset: () => {
      currentCount = 0;
      render(state);
    },
    getCount: () => currentCount
  };
}

/**
 * Create a proximity sensor indicator
 * @param {string} containerId - ID of the container element
 * @param {Object} state - Sensor state object
 * @returns {Object} Component controller with update method
 */
export function createCapacitiveIndicator(containerId, state = {}, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Capacitive indicator container ${containerId} not found`);
    return null;
  }

  const render = (sensorState) => {
    const isDetected = sensorState.object_detected || false;
    const analogue = sensorState.analogue_value != null ? sensorState.analogue_value : null;
    const pct = analogue != null ? Math.min(100, Math.round((analogue / 10000) * 100)) : null;

    container.innerHTML = `
      <div class="capacitive-indicator-wrapper flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-base-300/50 rounded-lg transition-all">
        <div class="mb-3 relative">
          <div class="indicator-ring w-16 h-16 rounded-full border-4 ${isDetected ? 'border-success' : 'border-base-content/20'} flex items-center justify-center" style="box-shadow: ${isDetected ? '0 0 20px #22c55e' : 'none'};">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 ${isDetected ? 'text-success' : 'text-base-content/30'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
            </svg>
          </div>
          ${isDetected ? '<div class="absolute inset-0 rounded-full border-4 border-success animate-ping opacity-75"></div>' : ''}
        </div>

        ${pct !== null ? `
          <div class="w-full px-2 mb-1">
            <div class="w-full bg-base-content/10 rounded-full h-3 overflow-hidden">
              <div class="h-3 rounded-full transition-all duration-300" style="width: ${pct}%; background: ${pct >= 80 ? '#f97316' : '#06b6d4'};"></div>
            </div>
            <div class="text-xs text-center opacity-60 mt-1 tabular-nums" title="${analogue} / 10000">${pct}% <span class="opacity-70">dielectric</span></div>
          </div>
        ` : ''}

        <div class="mt-2 text-center">
          <div class="text-sm font-semibold">Capacitive Sensor</div>
          <div class="text-xs opacity-60 whitespace-nowrap">${isDetected ? 'Object Detected' : 'No Object'}</div>
        </div>
      </div>
    `;
  };

  render(state);

  return {
    update: (newState) => {
      render(newState);
    }
  };
}

/**
 * Create an IO-Link Master status display
 * @param {string} containerId - ID of the container element
 * @param {Object} state - Master state object
 * @returns {Object} Component controller with update method
 */
export function createMasterStatusDisplay(containerId, state = {}, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Master status container ${containerId} not found`);
    return null;
  }

  // Render the master status
  const render = (masterState) => {
    const deviceName = masterState.device_name || 'IO-Link Master AL1350';
    const ports = masterState.ports || [];
    const isConnected = masterState.success || false;

    const portCards = [1, 2, 3, 4].map(portNum => {
      const port = ports.find(p => p.port === portNum);
      const mode = String(port && port.mode ? port.mode : '').toLowerCase();
      const isIoLink = mode.includes('io-link');
      const isDigital = mode.includes('digital_in') || mode.includes('digital_out');
      const modeLabel = isIoLink ? 'IO-Link' : isDigital ? (mode.includes('digital_in') ? 'DI' : 'DO') : 'Inactive';
      const portName = (port && (port.label || port.name)) || `Port ${portNum}`;

      const dotStyle = isIoLink
        ? 'background:#22c55e;box-shadow:0 0 4px #22c55e'
        : isDigital
          ? 'background:#f59e0b'
          : 'background:rgba(255,255,255,0.2)';
      const borderClass = isIoLink
        ? 'border-success/40 bg-success/5'
        : isDigital
          ? 'border-warning/40 bg-warning/5'
          : 'border-base-content/10 bg-base-content/5';
      const labelClass = isIoLink ? 'text-success' : isDigital ? 'text-warning' : 'text-base-content/40';

      return `
        <div class="flex-1 flex items-center gap-1.5 px-1.5 py-1 rounded border ${borderClass}" style="min-width:0">
          <div class="w-1.5 h-1.5 rounded-full shrink-0" style="${dotStyle}"></div>
          <div class="min-w-0 leading-tight">
            <div style="font-size:10px;font-weight:600" class="${labelClass}">P${portNum} <span style="font-weight:400;opacity:0.6">${modeLabel}</span></div>
            <div style="font-size:9px;opacity:0.45" class="truncate" title="${portName}">${portName}</div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="master-status-wrapper w-full flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-base-300/50 rounded-lg transition-all">
        <!-- Device icon + status dot — always visible -->
        <div class="flex items-center gap-1.5 shrink-0">
          <div class="w-6 h-6 bg-base-300 rounded border ${isConnected ? 'border-success' : 'border-error'} flex items-center justify-center shrink-0" style="box-shadow:${isConnected ? '0 0 6px rgba(34,197,94,0.3)' : '0 0 6px rgba(239,68,68,0.3)'}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ${isConnected ? 'text-success' : 'text-error'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
          <!-- Device name — hidden on narrow screens -->
          <div class="leading-tight hidden lg:block">
            <div style="font-size:10px;font-weight:600" class="whitespace-nowrap">AL1350</div>
            <div style="font-size:9px" class="${isConnected ? 'text-success' : 'text-error'}">${isConnected ? 'Online' : 'Offline'}</div>
          </div>
        </div>

        <!-- Divider -->
        <div class="w-px self-stretch bg-base-content/10 shrink-0"></div>

        <!-- Port cards -->
        <div class="flex gap-1.5 flex-1 min-w-0">
          ${portCards}
        </div>
      </div>
    `;
  };

  // Initial render
  render(state);

  // Return controller object
  return {
    update: (newState) => {
      render(newState);
    }
  };
}
