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
    const isDetected = sensorState.object_detected || false;
    const signalQuality = sensorState.signal_quality_percent || 0;
    
    // Increment counter if object is detected (simple logic for demo)
    if (isDetected && !render.lastDetected) {
      currentCount++;
    }
    render.lastDetected = isDetected;

    // Signal quality color
    let qualityColor = 'text-success';
    if (signalQuality < 40) qualityColor = 'text-error';
    else if (signalQuality < 70) qualityColor = 'text-warning';

    container.innerHTML = `
      <div class="counter-display-wrapper flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-base-300/50 rounded-lg transition-all">
        <!-- Part Present Indicator -->
        <div class="mb-3">
          <div class="indicator-light w-16 h-16 rounded-full border-4 border-base-content/20 flex items-center justify-center" style="background-color: ${isDetected ? '#22c55e' : '#374151'}; box-shadow: ${isDetected ? '0 0 20px #22c55e' : 'none'};">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 ${isDetected ? 'text-white' : 'text-base-content/30'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <!-- Counter Display -->
        <div class="text-center mb-2">
          <div class="text-2xl font-bold font-mono">${currentCount.toLocaleString()}</div>
          <div class="text-xs opacity-60">Total Count</div>
        </div>

        <!-- Signal Quality Bar -->
        ${signalQuality > 0 ? `
          <div class="w-full mt-2">
            <div class="text-xs ${qualityColor} mb-1">Signal: ${signalQuality}%</div>
            <progress class="progress ${qualityColor === 'text-success' ? 'progress-success' : qualityColor === 'text-warning' ? 'progress-warning' : 'progress-error'} w-full h-2" value="${signalQuality}" max="100"></progress>
          </div>
        ` : ''}

        <div class="mt-3 text-center">
          <div class="text-sm font-semibold">Photoelectric Sensor</div>
          <div class="text-xs opacity-60">${isDetected ? 'Object Present' : 'No Object'}</div>
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
export function createProximityIndicator(containerId, state = {}, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Proximity indicator container ${containerId} not found`);
    return null;
  }

  // Render the proximity indicator
  const render = (sensorState) => {
    const isPresent = sensorState.object_present || false;
    const distance = sensorState.distance_mm || null;

    container.innerHTML = `
      <div class="proximity-indicator-wrapper flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-base-300/50 rounded-lg transition-all">
        <!-- Target In Range Indicator -->
        <div class="mb-3 relative">
          <div class="indicator-ring w-16 h-16 rounded-full border-4 ${isPresent ? 'border-success' : 'border-base-content/20'} flex items-center justify-center" style="box-shadow: ${isPresent ? '0 0 20px #22c55e' : 'none'};">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 ${isPresent ? 'text-success' : 'text-base-content/30'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          ${isPresent ? '<div class="absolute inset-0 rounded-full border-4 border-success animate-ping opacity-75"></div>' : ''}
        </div>

        <!-- Distance Display -->
        ${distance !== null ? `
          <div class="text-center mb-2">
            <div class="text-2xl font-bold">${distance}</div>
            <div class="text-xs opacity-60">mm</div>
          </div>
        ` : ''}

        <div class="mt-3 text-center">
          <div class="text-sm font-semibold">Proximity Sensor</div>
          <div class="text-xs opacity-60">${isPresent ? 'Target In Range' : 'No Target'}</div>
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
    const deviceName = masterState.device_name || 'IO-Link Master';
    const ports = masterState.ports || [];
    const isConnected = masterState.success || false;

    container.innerHTML = `
      <div class="master-status-wrapper flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-base-300/50 rounded-lg transition-all">
        <!-- Master Device Icon -->
        <div class="mb-3">
          <div class="master-icon w-20 h-20 bg-base-300 rounded-lg border-2 ${isConnected ? 'border-success' : 'border-error'} flex items-center justify-center" style="box-shadow: ${isConnected ? '0 0 20px rgba(34, 197, 94, 0.3)' : '0 0 20px rgba(239, 68, 68, 0.3)'};">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 ${isConnected ? 'text-success' : 'text-error'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
        </div>

        <!-- Device Name -->
        <div class="text-center mb-3">
          <div class="text-sm font-semibold">${deviceName}</div>
          <div class="text-xs opacity-60">${isConnected ? 'Connected' : 'Disconnected'}</div>
        </div>

        <!-- Port Status Indicators -->
        <div class="master-port-grid w-full max-w-[10rem] grid grid-cols-4 gap-1.5">
          ${[1, 2, 3, 4].map(portNum => {
            const port = ports.find(p => p.port === portNum);
            const isActive = port && port.mode && port.mode !== 'DEACTIVATED';
            return `
              <div class="port-indicator w-full aspect-square rounded border-2 ${isActive ? 'border-success bg-success/20' : 'border-base-content/20 bg-base-content/5'} flex items-center justify-center" title="Port ${portNum}">
                <span class="text-xs font-bold ${isActive ? 'text-success' : 'text-base-content/30'}">${portNum}</span>
              </div>
            `;
          }).join('')}
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
