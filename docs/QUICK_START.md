# Quick Start Guide - Industrial HMI Homepage

## Get Started in 3 Steps

### Step 1: Start the Backend

Open a terminal and run:

```bash
cd backend
python run_io_link_fastapi.py
```

You should see:
```
Starting IO-Link Master FastAPI Backend...
WebSocket endpoint: ws://localhost:8000/ws
API documentation: http://localhost:8000/docs
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 2: Start the Frontend

Open another terminal and run:

```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 3: Open Your Browser

Navigate to: **http://localhost:5173**

The HMI Dashboard will load automatically!

## What You'll See

### Main Dashboard Components

1. **Top Section - Current State Overview**
   - 5 mimic components showing real-time sensor status
   - Click any component to configure it

2. **Middle Section - Condition Monitoring**
   - Temperature trend chart (24-hour history)
   - Signal quality bar chart
   - Cycle counter progress bar

3. **Right Section - Terminal Log**
   - Live datastream showing raw bytes and decoded values
   - Filter by port, export to CSV, clear log

4. **Bottom Section - Health & Heartbeat**
   - System status table
   - Recent events log

### Connection Status Bar

At the top of the page, you'll see:
- 🟢 Green dot = Connected to backend
- 🔴 Red dot = Disconnected
- Data source and last update time

## Quick Actions

### View Real-Time Data
- Data updates automatically every 1 second
- Watch the terminal log scroll with new entries
- See charts update with new data points

### Configure a Sensor
1. Click on any mimic component (Temperature, LED, etc.)
2. Modal opens with configuration options
3. Adjust settings and click "Save"

### Filter Terminal Log
1. Click the port filter dropdown (top of terminal)
2. Select "Port 1", "Port 2", etc., or "All Ports"
3. Log updates to show only selected port

### Export Log Data
1. Click the download icon (top of terminal)
2. CSV file downloads automatically
3. Open in Excel or any spreadsheet program

### Clear Terminal Log
1. Click the trash icon (top of terminal)
2. Log clears immediately
3. New entries continue to appear

## Navigation

Use the sidebar menu to switch between pages:
- **HMI Dashboard** - The new homepage (default)
- **IO-Link Master** - Detailed port status and configuration
- **Worksheets** - Training exercises
- **Further Study** - Learning resources
- **Settings** - App configuration

## Troubleshooting

### Problem: "WebSocket connection error"

**Solution:**
1. Make sure backend is running (Step 1)
2. Check that you see "Uvicorn running on http://0.0.0.0:8000"
3. Refresh the browser page

### Problem: "No data in terminal log"

**Solution:**
1. Check connection status (should be green)
2. If no IO-Link Master hardware, backend uses simulated data
3. Check browser console (F12) for errors

### Problem: "Components not updating"

**Solution:**
1. Verify WebSocket is connected (check console)
2. Look for JavaScript errors in browser console (F12)
3. Restart both backend and frontend

### Problem: "Charts not showing"

**Solution:**
1. Wait a few seconds for data to accumulate
2. Check that Chart.js loaded (no console errors)
3. Refresh the page

## Testing with Hardware

If you have an IFM IO-Link Master:

1. **Configure IP Address**
   - Go to Settings page
   - Set Master IP (default: 192.168.7.4)
   - Set Port (default: 80)
   - Click Save

2. **Connect Sensors**
   - Port 1: Temperature sensor (e.g., TN2505)
   - Port 2: Photoelectric sensor (e.g., O5D)
   - Port 3: Status LED (e.g., CL50)
   - Port 4: Proximity sensor

3. **Watch Real Data**
   - Dashboard updates with real sensor values
   - Terminal log shows actual byte data
   - Charts display real trends

## Testing without Hardware

The backend automatically provides simulated data if no hardware is connected:

- Temperature: Random values 20-30°C
- Photoelectric: Random object detection
- LED: Cycling through colors
- Proximity: Random distance values

This lets you test all features without physical sensors!

## Next Steps

Once everything is working:

1. **Read the Full Documentation**
   - `IMPLEMENTATION_SUMMARY.md` - Complete feature list
   - `TESTING.md` - Comprehensive test scenarios
   - Plan document - Architecture and design details

2. **Customize for Your Needs**
   - Adjust alarm thresholds in configuration modals
   - Modify colors in `src/style.css`
   - Add more sensor types in `src/home-page.js`

3. **Extend Functionality**
   - Add data logging to database
   - Implement email/SMS alerts
   - Create historical reports
   - Add user authentication

## Keyboard Shortcuts

- **F12** - Open browser developer console
- **Ctrl+R** - Refresh page
- **Ctrl+Shift+R** - Hard refresh (clear cache)
- **Ctrl+Plus** - Zoom in
- **Ctrl+Minus** - Zoom out

## Support Resources

- **Browser Console**: Press F12 to see errors and logs
- **Backend Logs**: Check terminal where backend is running
- **API Documentation**: http://localhost:8000/docs
- **Network Tab**: F12 → Network → WS to see WebSocket messages

## Tips for Best Experience

1. **Use Chrome or Edge** for best compatibility
2. **Keep browser window large** for optimal layout
3. **Enable hardware acceleration** in browser settings
4. **Use dark theme** for reduced eye strain
5. **Monitor WebSocket messages** in Network tab to debug issues

## Common Questions

**Q: Can I run this on a different port?**
A: Yes, modify the port in `backend/run_io_link_fastapi.py` and update `API_BASE` in `src/home-page.js`

**Q: Can I connect to multiple IO-Link Masters?**
A: Currently supports one master. Can be extended to support multiple.

**Q: How do I change the poll interval?**
A: Click on the Master mimic component and adjust "Poll Interval" setting

**Q: Can I save configuration changes?**
A: Currently frontend-only. Backend persistence can be added.

**Q: Does it work offline?**
A: Requires backend connection. Can be packaged as Electron app for offline use.

## Enjoy Your Industrial HMI Dashboard!

You now have a professional industrial monitoring system with:
- ✅ Real-time sensor monitoring
- ✅ Live datastream logging
- ✅ Trend analysis charts
- ✅ Configuration management
- ✅ Alert notifications
- ✅ Export capabilities

Happy monitoring! 🎉
