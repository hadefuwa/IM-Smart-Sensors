# How IO-Link Communication Works in Your App

## Overview

Your application communicates with the IO-Link Master device (AL1300) through a **3-layer architecture**:

```
Browser (Frontend) → Flask Backend → IO-Link Master Device
```

---

## Step-by-Step Communication Flow

### 1. **Frontend (Browser) → Backend**

**Location:** `frontend/io-link.html`

**What happens:**
- Your web page runs JavaScript that **automatically polls** the backend every 5 seconds (configurable: 3s, 5s, or 10s)
- It sends an HTTP GET request to: `http://localhost:8080/api/io-link/status`
- Uses JavaScript's `fetch()` function with a 15-second timeout

**Code example:**
```javascript
// Every 5 seconds, this function runs:
async function fetchIoLinkStatus() {
  const response = await fetch('http://localhost:8080/api/io-link/status');
  const data = await response.json();
  // Update the webpage with the data
}
```

**Why:** The browser **cannot directly** access `http://192.168.7.4` due to CORS (Cross-Origin Resource Sharing) security restrictions. The backend acts as a **proxy** to fetch data from the IO-Link Master.

---

### 2. **Backend (Flask) → IO-Link Master**

**Location:** `backend/app.py`

**What happens:**
The backend tries **TWO methods** to get data from the IO-Link Master:

#### **Method 1: Web Scraping (Primary - Lighter Load)**
- Makes **1 HTTP request** to: `http://192.168.7.4/`
- Downloads the HTML webpage that the IO-Link Master shows
- Uses **BeautifulSoup** library to parse the HTML and extract:
  - Port information (from tables)
  - Supervision data (Current, Voltage, Temperature)
  - Software versions
- **Advantage:** Only 1 request, less load on the device
- **Disadvantage:** Limited data (no PDin/PDout process data)

#### **Method 2: IoT Core API (Fallback - More Data)**
- Makes **many HTTP requests** to specific API endpoints:
  - `http://192.168.7.4/devicetag/applicationtag/getdata` - Device name
  - `http://192.168.7.4/iolinkmaster/port[1]/mode/getdata` - Port 1 mode
  - `http://192.168.7.4/iolinkmaster/port[1]/iolinkdevice/deviceid/getdata` - Port 1 device ID
  - `http://192.168.7.4/iolinkmaster/port[1]/iolinkdevice/pdin/getdata` - Process Data In
  - `http://192.168.7.4/iolinkmaster/port[1]/iolinkdevice/pdout/getdata` - Process Data Out
  - ... and many more for each port and data point
- **Advantage:** Gets detailed process data (PDin/PDout)
- **Disadvantage:** Many requests can overwhelm the device if polled too often

**Code example:**
```python
# Try web scraping first
result = _fetch_io_link_via_web_scrape('http://192.168.7.4', timeout=3)
if result is None:
    # Fallback to IoT Core API
    result = _fetch_io_link_via_iot_core('http://192.168.7.4', timeout=3)
```

---

### 3. **Backend Processes the Data**

**What happens:**
- Backend receives raw data from the IO-Link Master
- **Converts** hex strings to byte arrays (for process data)
- **Decodes** LED status from PDout bytes (for CL50 devices)
- **Stores** supervision history (for graphing)
- **Formats** everything into a JSON response

**Example - LED Decoder:**
```python
# If PDout bytes exist and are 3 bytes long:
if port_data['pdout']['bytes'] and len(port_data['pdout']['bytes']) >= 3:
    # Decode the LED status
    port_data['pdout']['decoded'] = _decode_cl50_led(port_data['pdout']['bytes'])
    # Result: {color1: "White", intensity: "High", animation: "Steady", ...}
```

---

### 4. **Backend → Frontend (Response)**

**What happens:**
- Backend sends a JSON response back to the browser:
```json
{
  "success": true,
  "device_name": "IO-Link Master",
  "ports": [
    {
      "port": 1,
      "mode": "IO-Link",
      "name": "CL50 PRO SELECT",
      "pdin": {"bytes": [], "hex": ""},
      "pdout": {
        "bytes": [0, 1, 13],
        "hex": "00010D",
        "decoded": {
          "led_on": true,
          "color1": "White",
          "color1_intensity": "High",
          "animation": "Steady"
        }
      }
    }
  ],
  "supervision": {
    "Current": "251mA",
    "Voltage": "23758mV",
    "Temperature": "39°C"
  }
}
```

---

### 5. **Frontend Updates the Webpage**

**What happens:**
- JavaScript receives the JSON data
- **Updates** the port status table
- **Updates** supervision values
- **Updates** the charts (Current, Voltage, Temperature graphs)
- **Fetches** detailed port information for active ports (separate API call)

**For Port Details:**
- When a port is active (IO-Link mode), the frontend makes **another** API call:
  - `GET /api/io-link/port/1` - Gets detailed process data for port 1
  - This uses the IoT Core API to get PDin/PDout bytes
  - Displays decoded LED status at the bottom of the page

---

## Complete Flow Diagram

```
┌─────────────────┐
│   Browser       │
│  (io-link.html) │
└────────┬────────┘
         │
         │ 1. Every 5 seconds: GET /api/io-link/status
         │
         ▼
┌─────────────────┐
│  Flask Backend   │
│   (app.py)      │
└────────┬────────┘
         │
         │ 2. Try Method 1: GET http://192.168.7.4/
         │    Parse HTML with BeautifulSoup
         │
         │    OR (if Method 1 fails)
         │
         │ 3. Try Method 2: Multiple GET requests to:
         │    - /iolinkmaster/port[1]/mode/getdata
         │    - /iolinkmaster/port[1]/iolinkdevice/pdin/getdata
         │    - /iolinkmaster/port[1]/iolinkdevice/pdout/getdata
         │    - ... (many more)
         │
         ▼
┌─────────────────┐
│ IO-Link Master  │
│  (192.168.7.4)  │
│   AL1300        │
└────────┬────────┘
         │
         │ 4. Returns HTML page OR JSON API responses
         │
         ▼
┌─────────────────┐
│  Flask Backend   │
│   (app.py)      │
└────────┬────────┘
         │
         │ 5. Process data:
         │    - Parse HTML or JSON
         │    - Convert hex to bytes
         │    - Decode LED status
         │    - Store supervision history
         │
         │ 6. Return JSON response
         │
         ▼
┌─────────────────┐
│   Browser       │
│  (io-link.html) │
└─────────────────┘
         │
         │ 7. Update webpage:
         │    - Port table
         │    - Supervision values
         │    - Charts
         │    - Port details (separate API call)
```

---

## Key Concepts

### **Process Data (PDin/PDout)**
- **PDin (Process Data In):** Data flowing **FROM** the IO-Link device **TO** the PLC
  - Example: Sensor readings, status bits
- **PDout (Process Data Out):** Data flowing **FROM** the PLC **TO** the IO-Link device
  - Example: LED commands, control signals
- Format: Usually hex strings like `"00010D"` which converts to bytes `[0, 1, 13]`

### **Supervision Data**
- Operational parameters of the IO-Link Master itself:
  - **Current:** Power consumption (mA)
  - **Voltage:** Supply voltage (mV)
  - **Temperature:** Device temperature (°C)
- Stored in history for graphing (last 120 data points)

### **LED Decoder**
- Specifically for **CL50 PRO SELECT** LED devices
- Takes 3 bytes from PDout and decodes:
  - Color (White, Green, Red, Blue, etc.)
  - Intensity (Off, Low, Medium, High)
  - Animation (Off, Steady, Blink, Pulse, etc.)
  - Speed, Pattern, Audible state

---

## Configuration

**File:** `backend/config.json`

```json
{
  "io_link": {
    "master_ip": "192.168.7.4",      // IO-Link Master IP address
    "port": 80,                       // HTTP port (usually 80)
    "poll_interval_sec": 5,           // How often backend polls (not used - frontend controls)
    "timeout_sec": 3                  // Request timeout in seconds
  }
}
```

---

## Why This Architecture?

1. **CORS Protection:** Browsers block direct access to `192.168.7.4` from `localhost:8080`
2. **Data Processing:** Backend can decode, format, and store data
3. **Error Handling:** Backend can retry, cache, and handle failures gracefully
4. **Security:** Backend acts as a controlled gateway

---

## Troubleshooting

### **Connection Issues**
- Check IO-Link Master is powered on: `ping 192.168.7.4`
- Check IP address in `config.json` matches your device
- Check network connectivity

### **Slow Responses**
- IO-Link Master can be slow (especially with IoT Core API)
- Frontend timeout is 15 seconds for status, 30 seconds for port details
- Reduce polling frequency if device is overwhelmed

### **Empty Data**
- IO-Link Master sometimes doesn't respond (intermittent issue)
- Backend will retry automatically
- Check device web interface directly: `http://192.168.7.4`

---

## Summary

**Simple Version:**
1. Browser asks backend for IO-Link data every 5 seconds
2. Backend asks IO-Link Master for data (via web scraping or API)
3. IO-Link Master responds with data
4. Backend processes and formats the data
5. Backend sends formatted data back to browser
6. Browser displays the data on the webpage

**The backend is like a translator** between your browser and the IO-Link Master device!
