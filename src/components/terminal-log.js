/**
 * Terminal Log Component
 * A command-line style terminal that displays live IO-Link datastream with byte data
 */

export class TerminalLog {
  constructor(containerId, maxEntries = 1000) {
    this.containerId = containerId;
    this.maxEntries = maxEntries;
    this.entries = [];
    this.isAutoScroll = true;
    this.filterPort = null; // null means show all ports
    this.container = null;
    this.logContainer = null;
  }

  /**
   * Initialize the terminal log UI
   */
  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`Terminal log container ${this.containerId} not found`);
      return;
    }

    // Create the terminal UI structure
    this.container.innerHTML = `
      <div class="terminal-log-wrapper h-full flex flex-col">
        <!-- Terminal header with controls -->
        <div class="terminal-header bg-base-300 px-3 py-2 flex items-center justify-between border-b border-base-content/20">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-success">●</span>
            <span class="text-sm font-semibold">IO-Link Datastream</span>
          </div>
          <div class="flex items-center gap-2">
            <!-- Filter dropdown -->
            <select id="terminal-filter" class="select select-sm select-bordered">
              <option value="all">All Ports</option>
              <option value="1">Port 1</option>
              <option value="2">Port 2</option>
              <option value="3">Port 3</option>
              <option value="4">Port 4</option>
            </select>
            <!-- Auto-scroll toggle -->
            <button id="terminal-autoscroll" class="btn btn-sm btn-ghost" title="Auto-scroll">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
            <!-- Clear button -->
            <button id="terminal-clear" class="btn btn-sm btn-ghost" title="Clear log">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <!-- Export button -->
            <button id="terminal-export" class="btn btn-sm btn-ghost" title="Export to CSV">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Terminal log content area -->
        <div id="terminal-log-content" class="terminal-log-content flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed">
          <div class="terminal-system-msg">
            [System] Terminal log initialized. Waiting for data...
          </div>
        </div>
      </div>
    `;

    this.logContainer = document.getElementById('terminal-log-content');

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for controls
   */
  setupEventListeners() {
    // Filter dropdown
    const filterSelect = document.getElementById('terminal-filter');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        this.filterPort = value === 'all' ? null : parseInt(value);
        this.redraw();
      });
    }

    // Auto-scroll toggle
    const autoScrollBtn = document.getElementById('terminal-autoscroll');
    if (autoScrollBtn) {
      autoScrollBtn.addEventListener('click', () => {
        this.isAutoScroll = !this.isAutoScroll;
        if (this.isAutoScroll) {
          autoScrollBtn.classList.add('btn-active');
          this.scrollToBottom();
        } else {
          autoScrollBtn.classList.remove('btn-active');
        }
      });
      // Start with auto-scroll enabled
      autoScrollBtn.classList.add('btn-active');
    }

    // Clear button
    const clearBtn = document.getElementById('terminal-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clear();
      });
    }

    // Export button
    const exportBtn = document.getElementById('terminal-export');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportToCSV();
      });
    }
  }

  /**
   * Append a new log entry
   * @param {Object} entry - Log entry object
   * @param {number} entry.port - Port number (1-4)
   * @param {string} entry.portName - Port device name
   * @param {string} entry.pdinHex - PDin hex string
   * @param {string} entry.pdoutHex - PDout hex string
   * @param {string} entry.pdinDecoded - Decoded PDin description
   * @param {string} entry.pdoutDecoded - Decoded PDout description
   * @param {string} entry.level - Log level: 'normal', 'warning', 'error'
   */
  append(entry) {
    // Add timestamp if not present
    if (!entry.timestamp) {
      entry.timestamp = new Date();
    }

    // Add to entries array
    this.entries.push(entry);

    // Keep only the last maxEntries
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    // Check if this entry should be displayed based on filter
    if (this.filterPort !== null && entry.port !== this.filterPort) {
      return; // Skip rendering if filtered out
    }

    // Render the new entry
    this.renderEntry(entry);

    // Auto-scroll if enabled
    if (this.isAutoScroll) {
      this.scrollToBottom();
    }
  }

  /**
   * Render a single log entry to the DOM
   * @param {Object} entry - Log entry object
   */
  renderEntry(entry) {
    if (!this.logContainer) return;

    const timestamp = this.formatTimestamp(entry.timestamp);
    const level = entry.level || 'normal';
    
    // Color classes based on level
    const levelColors = {
      normal: 'text-success',
      warning: 'text-warning',
      error: 'text-error'
    };
    const colorClass = levelColors[level] || 'text-success';

    // Format the log entry
    const entryDiv = document.createElement('div');
    entryDiv.className = 'terminal-entry mb-2';
    
    let html = `<div class="${colorClass}">[${timestamp}] Master → Port ${entry.port}`;
    if (entry.portName) {
      html += ` (${entry.portName})`;
    }
    html += `</div>`;

    // PDin line
    if (entry.pdinHex) {
      const pdinFormatted = this.formatHexBytes(entry.pdinHex);
      html += `<div class="pl-4 text-info">  PDin:  ${pdinFormatted}`;
      if (entry.pdinDecoded) {
        html += ` <span class="text-base-content/70">→ ${entry.pdinDecoded}</span>`;
      }
      html += `</div>`;
    }

    // PDout line
    if (entry.pdoutHex) {
      const pdoutFormatted = this.formatHexBytes(entry.pdoutHex);
      html += `<div class="pl-4 text-warning">  PDout: ${pdoutFormatted}`;
      if (entry.pdoutDecoded) {
        html += ` <span class="text-base-content/70">→ ${entry.pdoutDecoded}</span>`;
      }
      html += `</div>`;
    }

    entryDiv.innerHTML = html;
    this.logContainer.appendChild(entryDiv);
  }

  /**
   * Format timestamp with milliseconds
   * @param {Date} date - Date object
   * @returns {string} Formatted timestamp
   */
  formatTimestamp(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  }

  /**
   * Format hex string to spaced bytes (e.g., "010A00" -> "0x01 0x0A 0x00")
   * @param {string} hexString - Hex string
   * @returns {string} Formatted hex bytes
   */
  formatHexBytes(hexString) {
    if (!hexString || hexString === '00' || hexString === '-') {
      return '0x00            ';
    }
    
    // Clean the hex string
    const cleaned = hexString.replace(/[^0-9A-Fa-f]/g, '');
    
    // Split into pairs and format
    const bytes = [];
    for (let i = 0; i < cleaned.length; i += 2) {
      bytes.push('0x' + cleaned.substr(i, 2).toUpperCase());
    }
    
    // Pad to consistent width (assume max 4 bytes)
    const formatted = bytes.join(' ');
    return formatted.padEnd(20, ' ');
  }

  /**
   * Clear all log entries
   */
  clear() {
    this.entries = [];
    if (this.logContainer) {
      this.logContainer.innerHTML = `
        <div class="terminal-system-msg">
          [System] Terminal log cleared.
        </div>
      `;
    }
  }

  /**
   * Redraw all entries (used when filter changes)
   */
  redraw() {
    if (!this.logContainer) return;

    this.logContainer.innerHTML = '';

    // Filter entries if needed
    const entriesToShow = this.filterPort === null
      ? this.entries
      : this.entries.filter(e => e.port === this.filterPort);

    // Render all filtered entries
    entriesToShow.forEach(entry => {
      this.renderEntry(entry);
    });

    // Scroll to bottom if auto-scroll is enabled
    if (this.isAutoScroll) {
      this.scrollToBottom();
    }
  }

  /**
   * Scroll to the bottom of the log
   */
  scrollToBottom() {
    if (this.logContainer) {
      this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }
  }

  /**
   * Export log entries to CSV file
   */
  exportToCSV() {
    if (this.entries.length === 0) {
      alert('No log entries to export');
      return;
    }

    // Create CSV content
    const headers = ['Timestamp', 'Port', 'Device Name', 'PDin Hex', 'PDin Decoded', 'PDout Hex', 'PDout Decoded', 'Level'];
    const rows = this.entries.map(entry => {
      return [
        entry.timestamp.toISOString(),
        entry.port,
        entry.portName || '',
        entry.pdinHex || '',
        entry.pdinDecoded || '',
        entry.pdoutHex || '',
        entry.pdoutDecoded || '',
        entry.level || 'normal'
      ];
    });

    // Build CSV string
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      // Escape commas and quotes in values
      const escapedRow = row.map(value => {
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return '"' + stringValue.replace(/"/g, '""') + '"';
        }
        return stringValue;
      });
      csvContent += escapedRow.join(',') + '\n';
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const filename = `iolink-log-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Destroy the terminal log and clean up
   */
  destroy() {
    this.entries = [];
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}
