# Testing the Industrial HMI Homepage

This document provides instructions for testing the new HMI homepage with real or simulated data.

## Prerequisites

1. **Backend Running**: Make sure the FastAPI backend is running
   ```bash
   cd backend
   python run_io_link_fastapi.py
   ```
   The backend should start on `http://localhost:8000`

2. **Frontend Development Server**: Start the Vite development server
   ```bash
   npm run dev
   ```
   The frontend should start on `http://localhost:5173`

## Test Scenarios

### Test 1: Basic Page Load

**Steps:**
1. Open the app in your browser: `http://localhost:5173`
2. The HMI Dashboard should load as the default page
3. Verify you see:
   - 5 mimic components (Master, Temperature, Photoelectric, Proximity, LED)
   - Terminal log on the right side
   - Temperature trend chart
   - Signal quality chart
   - Cycle counter progress bar
   - Health & Heartbeat table

**Expected Result:** All components render without errors

### Test 2: WebSocket Connection

**Steps:**
1. Open browser developer console (F12)
2. Look for console messages:
   - "Initializing HMI Homepage..."
   - "Connecting to WebSocket: ws://localhost:8000/ws"
   - "WebSocket connected"

**Expected Result:** 
- Connection status shows "Connected" with green indicator
- Terminal log shows "[System] WebSocket connection established"

### Test 3: Real-Time Data Updates (With Hardware)

**Prerequisites:** IO-Link Master connected at 192.168.7.4

**Steps:**
1. Ensure IO-Link Master is powered on and accessible
2. Connect sensors to ports:
   - Port 1: Temperature sensor (e.g., TN2505)
   - Port 2: Photoelectric sensor (e.g., O5D)
   - Port 3: Status LED (e.g., CL50)
   - Port 4: Proximity sensor
3. Watch the dashboard update every 1 second

**Expected Result:**
- Temperature gauge shows real temperature value
- Photoelectric sensor shows object detection state
- LED indicator matches physical LED color/animation
- Proximity sensor shows target detection
- Terminal log shows live byte data with timestamps
- Charts update with new data points

### Test 4: Simulated Data (Without Hardware)

**Steps:**
1. Backend automatically falls back to simulated data if hardware is not available
2. Watch for simulated updates in the terminal log
3. Mimic components should show changing values

**Expected Result:**
- Dashboard updates with simulated sensor data
- No connection errors in console
- Terminal log shows data entries

### Test 5: Configuration Modals

**Steps:**
1. Click on the **Temperature Gauge** mimic component
2. Modal should open with configuration options:
   - High/Low alarm thresholds
   - Calibration offset
   - Display units (°C/°F)
3. Try clicking on each mimic component:
   - Temperature → Temperature config
   - Photoelectric → Counter reset, signal threshold
   - Proximity → Detection range, switching point
   - LED → Color, animation, intensity
   - Master → Poll interval, timeout, data source

**Expected Result:** Each modal opens with appropriate configuration options

### Test 6: Terminal Log Features

**Steps:**
1. **Auto-scroll**: Verify terminal auto-scrolls as new entries appear
2. **Pause scroll**: Click the auto-scroll button to pause
3. **Filter**: Use the port filter dropdown to show only Port 1 data
4. **Clear**: Click the clear button to empty the log
5. **Export**: Click export button to download CSV file

**Expected Result:**
- Auto-scroll works correctly
- Filter shows only selected port data
- Clear empties the log
- CSV file downloads with proper formatting

### Test 7: Condition Monitoring Alerts

**Steps:**
1. **Temperature Warning**: If temperature > 80°C, gauge turns yellow
2. **Temperature Critical**: If temperature > 90°C, gauge turns red
3. **Signal Quality Low**: If photoelectric signal < 20%, "Clean Lens" alert appears
4. **Cycle Counter High**: If proximity cycles > 900,000, "Service Due" alert appears

**Expected Result:** Alerts appear when thresholds are crossed

### Test 8: Responsive Design

**Steps:**
1. Resize browser window to different sizes:
   - Desktop (>1024px): 3-column layout
   - Tablet (768-1024px): 2-column layout
   - Mobile (<768px): Single column
2. Verify all components remain visible and functional

**Expected Result:** Layout adapts smoothly to different screen sizes

### Test 9: Navigation

**Steps:**
1. Click on "IO-Link Master" in sidebar
2. Page should switch to IO-Link Master page
3. Click on "HMI Dashboard" in sidebar
4. Should return to home page
5. WebSocket should reconnect automatically

**Expected Result:** 
- Navigation works smoothly
- Home page reinitializes correctly
- No memory leaks (check browser task manager)

### Test 10: Multiple Tabs/Windows

**Steps:**
1. Open the app in two browser tabs
2. Both should connect to the same WebSocket
3. Both should receive the same data updates

**Expected Result:** Multiple clients can connect simultaneously

## Common Issues and Solutions

### Issue: WebSocket Connection Failed

**Symptoms:** Red connection indicator, "WebSocket connection error" in console

**Solutions:**
1. Verify backend is running: `http://localhost:8000/docs`
2. Check CORS settings in `backend/io_link_fastapi.py`
3. Verify WebSocket URL in `src/home-page.js` (should be `ws://localhost:8000/ws`)

### Issue: No Data in Terminal Log

**Symptoms:** Terminal log shows "Waiting for data..." but nothing appears

**Solutions:**
1. Check if WebSocket is connected (console messages)
2. Verify backend is polling the IO-Link Master
3. Check backend logs for errors
4. Try simulated data mode

### Issue: Mimic Components Not Updating

**Symptoms:** Components show initial state but don't change

**Solutions:**
1. Check browser console for JavaScript errors
2. Verify WebSocket messages are being received (Network tab → WS)
3. Check `updateDashboard()` function in `src/home-page.js`
4. Verify device type detection in `getDeviceType()` function

### Issue: Charts Not Rendering

**Symptoms:** Empty chart areas or "undefined" errors

**Solutions:**
1. Verify Chart.js is imported correctly
2. Check canvas element IDs match in HTML and JS
3. Ensure `initializeCharts()` is called after DOM is ready
4. Check browser console for Chart.js errors

### Issue: Modals Not Opening

**Symptoms:** Clicking mimic components does nothing

**Solutions:**
1. Verify modal HTML is rendered in `renderConfigModals()`
2. Check event listeners in `setupConfigModalHandlers()`
3. Ensure modal IDs match between HTML and JS
4. Check for JavaScript errors in console

## Performance Testing

### Metrics to Monitor

1. **WebSocket Message Rate**: Should be ~1 message per second
2. **Memory Usage**: Should remain stable (no memory leaks)
3. **CPU Usage**: Should be low (<5% on modern hardware)
4. **Network Traffic**: ~1-2 KB per second

### Tools

- **Chrome DevTools**: Performance tab, Memory profiler
- **Network Tab**: Monitor WebSocket messages
- **Task Manager**: Check overall resource usage

## Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge (Chromium) 90+
- ✅ Firefox 88+
- ✅ Safari 14+

## Next Steps After Testing

Once all tests pass:

1. **Document any issues** found during testing
2. **Adjust thresholds** based on real sensor ranges
3. **Customize colors** to match your branding
4. **Add more sensors** if needed (expand port detection logic)
5. **Implement data logging** for historical analysis
6. **Set up alerts** (email/SMS) for critical events

## Support

If you encounter issues not covered here:

1. Check browser console for errors
2. Check backend logs for server-side errors
3. Verify network connectivity to IO-Link Master
4. Review the plan document for architecture details
