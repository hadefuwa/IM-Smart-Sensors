# FastAPI Migration Guide

This document explains how to use the new FastAPI backend for IO-Link Master communication.

## What Changed?

### Old System (Flask)
- **Polling**: Browser asks server every 5 seconds
- **Synchronous**: One request at a time
- **Slower**: Up to 5 seconds delay for updates

### New System (FastAPI)
- **WebSocket Push**: Server pushes data instantly when ready
- **Asynchronous**: Handles multiple connections simultaneously
- **Faster**: Near-zero latency updates

## Files Created

1. **`backend/decoder.py`** - CL50 LED decoder module
2. **`backend/io_link_fastapi.py`** - FastAPI backend with WebSocket support
3. **`backend/run_io_link_fastapi.py`** - Startup script

## Installation

1. Install the new dependencies:
```bash
cd backend
pip install -r requirements.txt
```

The new dependencies are:
- `fastapi>=0.104.0` - Modern async web framework
- `uvicorn[standard]>=0.24.0` - ASGI server
- `httpx>=0.25.0` - Async HTTP client
- `websockets>=12.0` - WebSocket support

## Running the FastAPI Backend

### Option 1: Using the startup script
```bash
cd backend
python run_io_link_fastapi.py
```

### Option 2: Using uvicorn directly
```bash
cd backend
uvicorn io_link_fastapi:app --host 0.0.0.0 --port 8000
```

The server will start on `http://localhost:8000`

## API Endpoints

### WebSocket (Real-time)
- **URL**: `ws://localhost:8000/ws`
- **Purpose**: Real-time data push from server to browser
- **Usage**: Automatically used by the frontend

### HTTP Endpoints (Fallback)
- **GET** `/api/io-link/status` - Get current status
- **GET** `/api/io-link/supervision-history` - Get supervision history
- **GET** `/api/io-link/port/{port_num}` - Get detailed port information
- **GET** `/health` - Health check
- **GET** `/docs` - Interactive API documentation (Swagger UI)

## Frontend Changes

The frontend (`frontend/io-link.html`) has been updated to:
1. Connect to WebSocket on page load
2. Receive real-time updates automatically
3. Fall back to HTTP polling if WebSocket fails
4. Auto-reconnect if connection is lost

## Configuration

The FastAPI backend reads configuration from `backend/config.json`:

```json
{
  "io_link": {
    "master_ip": "192.168.7.4",
    "port": 80,
    "timeout_sec": 2.0,
    "use_https": false
  }
}
```

## How It Works

1. **Background Polling**: FastAPI runs a background task that polls the IO-Link Master every 1 second
2. **State Management**: Latest data is stored in memory
3. **WebSocket Broadcast**: When new data arrives, it's pushed to all connected browsers instantly
4. **Parallel Requests**: All port data is fetched in parallel using async/await

## Benefits

- ✅ **Real-time updates**: No more waiting up to 5 seconds
- ✅ **Better performance**: Handles multiple users simultaneously
- ✅ **Lower network usage**: Only sends data when it changes
- ✅ **Auto-reconnection**: Frontend automatically reconnects if connection is lost
- ✅ **Backward compatible**: HTTP endpoints still work for fallback

## Troubleshooting

### WebSocket connection fails
- Check that the FastAPI server is running on port 8000
- Check browser console for errors
- The frontend will automatically fall back to HTTP polling

### No data received
- Check that the IO-Link Master IP is correct in `config.json`
- Check server logs for connection errors
- Verify network connectivity to the IO-Link Master

### Port conflicts
- If port 8000 is already in use, change it in `run_io_link_fastapi.py`
- Update the frontend WebSocket URL accordingly

## Integration with Existing Flask App

If you want to keep using the Flask app for other features, you can:

1. Run both servers on different ports:
   - Flask: Port 8080 (existing)
   - FastAPI: Port 8000 (new)

2. Update the frontend to use the FastAPI server for IO-Link data:
   - Change `WS_BASE` in `io-link.html` to point to port 8000

3. Or integrate FastAPI into the Flask app using ASGI mounting (advanced)

## Next Steps

- Test the WebSocket connection
- Monitor server logs for any errors
- Adjust polling interval if needed (currently 1 second)
- Consider adding authentication if needed
