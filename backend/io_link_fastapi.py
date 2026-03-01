"""
FastAPI Backend for IO-Link Master
Real-time WebSocket-based communication with async polling
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
import asyncio
import httpx
import json
import os
import time
import logging
from typing import Dict, List, Optional, Set
from datetime import datetime

from decoder import (
    decode_cl50_led,
    parse_hex_to_bytes,
    get_device_type,
    decode_photo_electric_pdin,
    decode_temperature_pdin,
    decode_proximity_pdin,
    DEVICE_TYPE_STATUS_LED,
    DEVICE_TYPE_PHOTO_ELECTRIC,
    DEVICE_TYPE_TEMPERATURE,
    DEVICE_TYPE_PROXIMITY,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get directory paths
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_FRONTEND_DIR = os.path.normpath(os.path.join(_BACKEND_DIR, '..', 'frontend'))
_DIST_DIR = os.path.normpath(os.path.join(_BACKEND_DIR, '..', 'dist'))
_PUBLIC_DIR = os.path.normpath(os.path.join(_BACKEND_DIR, '..', 'public'))
logger.info(f"Backend directory: {_BACKEND_DIR}")
logger.info(f"Frontend directory: {_FRONTEND_DIR}")
logger.info(f"Dist directory: {_DIST_DIR}")
logger.info(f"Public directory: {_PUBLIC_DIR}")
logger.info(f"Frontend exists: {os.path.exists(_FRONTEND_DIR)}")
if os.path.exists(_FRONTEND_DIR):
    io_link_html = os.path.join(_FRONTEND_DIR, 'io-link.html')
    logger.info(f"io-link.html exists: {os.path.exists(io_link_html)}")
logger.info(f"Dist exists: {os.path.exists(_DIST_DIR)}")


def get_frontend_entry_path() -> Optional[str]:
    """Return the preferred HTML entry file for the UI."""
    candidates = [
        os.path.join(_DIST_DIR, 'index.html'),
        os.path.join(_FRONTEND_DIR, 'index.html'),
        os.path.join(_FRONTEND_DIR, 'io-link.html'),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return None


def get_root_static_file_path(file_name: str) -> Optional[str]:
    """Return absolute path for root-level static files used by the frontend."""
    if not file_name or '/' in file_name or '\\' in file_name:
        return None
    for base_dir in (_DIST_DIR, _PUBLIC_DIR, _FRONTEND_DIR):
        candidate = os.path.join(base_dir, file_name)
        if os.path.isfile(candidate):
            return candidate
    return None

# Create FastAPI app - disable default root
app = FastAPI(
    title="IO-Link Master API", 
    docs_url="/docs", 
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Mount static files FIRST (before routes) - this is important!
assets_dir = None
dist_assets_dir = os.path.join(_DIST_DIR, 'assets')
legacy_assets_dir = os.path.join(_FRONTEND_DIR, 'assets')
if os.path.exists(dist_assets_dir):
    assets_dir = dist_assets_dir
elif os.path.exists(legacy_assets_dir):
    assets_dir = legacy_assets_dir

if assets_dir:
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    logger.info(f"Mounted /assets from {assets_dir}")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
system_state = {
    'device_name': '',
    'ports': [],
    'supervision': {},
    'software': {},
    'device_icon_url': None,
    'product_image_url': '/api/io-link/product-image',
    'timestamp': 0,
    'source': '',
    'success': False
}

# Supervision history buffer
supervision_history = []
MAX_HISTORY_SIZE = 100

# Connected WebSocket clients
connected_clients: Set[WebSocket] = set()

# Simulated fault overlay per port (for training: show fault without touching hardware)
# Keys: port number (1-4), Values: list of {"code": "0x02", "label": "Short circuit"} or None to clear
simulated_events_by_port: Dict[int, List[Dict]] = {}

# Configuration
IFM_MASTER_IP = "192.168.7.4"
IFM_MASTER_PORT = 80
IFM_TIMEOUT = 2.0  # 2 seconds timeout
POLL_INTERVAL = 1.0  # Poll every 1 second


def load_config():
    """Load configuration from config.json"""
    config_path = os.path.join(os.path.dirname(__file__), 'config.json')
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            "io_link": {
                "master_ip": "192.168.7.4",
                "port": 80,
                "timeout_sec": 2.0,
                "use_https": False,
                "poll_interval_sec": 1.0
            }
        }


def save_config(io_link_updates: dict):
    """Update io_link section in config.json and save. Other keys (plc, dobot, etc.) are preserved."""
    config_path = os.path.join(os.path.dirname(__file__), 'config.json')
    config = load_config()
    if 'io_link' not in config:
        config['io_link'] = {}
    for key, value in io_link_updates.items():
        if value is not None:
            config['io_link'][key] = value
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    return config


def parse_supervision_number(val, default=0):
    """Parse supervision value to number. E.g. '251mA'->251, '23758mV'->23.758, '39°C'->39"""
    if val is None or val == '':
        return default
    import re
    s = str(val).strip()
    m = re.match(r'^([-\d.]+)', s)
    if m:
        num = float(m.group(1))
        if 'mV' in s.lower():
            return round(num / 1000, 2)
        if 'mA' in s.lower() or '°c' in s.lower() or 'c' in s.lower():
            return num
        return num
    try:
        return float(s)
    except ValueError:
        return default


def append_supervision_history(supervision_dict):
    """Append parsed supervision to history buffer"""
    if not supervision_dict:
        return
    entry = {
        'ts': time.time(),
        'current': None,
        'voltage': None,
        'temperature': None,
        'status': None,
        'sw_version': None
    }
    for k, v in supervision_dict.items():
        low = k.lower().replace('-', '').replace(' ', '')
        if 'current' in low:
            entry['current'] = parse_supervision_number(v, None)
        elif 'voltage' in low:
            entry['voltage'] = parse_supervision_number(v, None)
        elif 'temp' in low:
            entry['temperature'] = parse_supervision_number(v, None)
        elif 'status' in low and 'version' not in low:
            entry['status'] = parse_supervision_number(v, None)
        elif 'swversion' in low or ('sw' in low and 'version' in low):
            entry['sw_version'] = parse_supervision_number(v, None)
    
    supervision_history.append(entry)
    while len(supervision_history) > MAX_HISTORY_SIZE:
        supervision_history.pop(0)


async def get_ifm_port_data(client: httpx.AsyncClient, base_url: str, port_number: int) -> Optional[str]:
    """
    Fetches Process Data from an ifm IO-Link Master via IoT Core API.
    
    Args:
        client: httpx async client
        base_url: Base URL of the IO-Link Master
        port_number: Port number (1-4)
        
    Returns:
        Hex string value or None if error
    """
    url = f"{base_url}/iolinkmaster/port[{port_number}]/iolinkdevice/pdin/getdata"
    
    try:
        response = await client.get(url, timeout=IFM_TIMEOUT)
        response.raise_for_status()
        
        data = response.json()
        if data.get('code') == 200:
            return data.get('data', {}).get('value')
        return None
    except Exception as e:
        logger.debug(f"Error fetching port {port_number} data: {e}")
        return None


async def get_ifm_port_pdout(client: httpx.AsyncClient, base_url: str, port_number: int) -> Optional[str]:
    """Get Process Data Out for a port"""
    url = f"{base_url}/iolinkmaster/port[{port_number}]/iolinkdevice/pdout/getdata"
    
    try:
        response = await client.get(url, timeout=IFM_TIMEOUT)
        response.raise_for_status()
        
        data = response.json()
        if data.get('code') == 200:
            return data.get('data', {}).get('value')
        return None
    except Exception as e:
        logger.debug(f"Error fetching port {port_number} PDout: {e}")
        return None


async def get_ifm_port_info(client: httpx.AsyncClient, base_url: str, port_number: int) -> Dict:
    """Get all information for a single port"""
    port_data = {
        'port': port_number,
        'mode': 'inactive',
        'comm_mode': '',
        'master_cycle_time': '',
        'vendor_id': '',
        'device_id': '',
        'name': '',
        'serial': '',
        'pdin': '',
        'pdout': ''
    }
    
    # List of endpoints to fetch
    endpoints = [
        (f'/iolinkmaster/port[{port_number}]/mode/getdata', 'mode'),
        (f'/iolinkmaster/port[{port_number}]/comcode/getdata', 'comm_mode'),
        (f'/iolinkmaster/port[{port_number}]/mastercycle/getdata', 'master_cycle_time'),
        (f'/iolinkmaster/port[{port_number}]/iolinkdevice/vendorid/getdata', 'vendor_id'),
        (f'/iolinkmaster/port[{port_number}]/iolinkdevice/deviceid/getdata', 'device_id'),
        (f'/iolinkmaster/port[{port_number}]/iolinkdevice/productname/getdata', 'name'),
        (f'/iolinkmaster/port[{port_number}]/iolinkdevice/serialnumber/getdata', 'serial'),
        (f'/iolinkmaster/port[{port_number}]/iolinkdevice/pdin/getdata', 'pdin'),
        (f'/iolinkmaster/port[{port_number}]/iolinkdevice/pdout/getdata', 'pdout'),
    ]
    
    # Fetch all endpoints in parallel
    tasks = []
    for endpoint, key in endpoints:
        url = f"{base_url}{endpoint}"
        tasks.append(client.get(url, timeout=IFM_TIMEOUT))
    
    responses = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Process responses
    for i, response in enumerate(responses):
        if isinstance(response, Exception):
            continue
            
        try:
            if response.status_code == 200:
                data = response.json()
                if data.get('code') == 200:
                    value = data.get('data', {}).get('value', '')
                    key = endpoints[i][1]
                    port_data[key] = value
        except Exception:
            pass
    
    return port_data


async def poll_all_ports(base_url: str) -> List[Dict]:
    """Fetch data from all ports in parallel"""
    async with httpx.AsyncClient() as client:
        # Create tasks for all ports
        tasks = [get_ifm_port_info(client, base_url, i) for i in range(1, 5)]
        
        # Run all tasks in parallel
        ports = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Convert exceptions to empty port data
        result = []
        for i, port in enumerate(ports):
            if isinstance(port, Exception):
                logger.error(f"Error fetching port {i+1}: {port}")
                result.append({
                    'port': i + 1,
                    'mode': 'error',
                    'comm_mode': '',
                    'master_cycle_time': '',
                    'vendor_id': '',
                    'device_id': '',
                    'name': '',
                    'serial': '',
                    'pdin': '',
                    'pdout': ''
                })
            else:
                result.append(port)
        
        return result


async def get_device_info(base_url: str) -> Dict:
    """Get device name and software info"""
    device_info = {
        'device_name': 'IO-Link Master',
        'software': {},
        'device_icon_url': None
    }
    
    async with httpx.AsyncClient() as client:
        # Get device name
        try:
            response = await client.get(
                f"{base_url}/devicetag/applicationtag/getdata",
                timeout=IFM_TIMEOUT
            )
            if response.status_code == 200:
                data = response.json()
                if data.get('code') == 200:
                    device_info['device_name'] = data.get('data', {}).get('value', 'IO-Link Master')
        except Exception:
            pass
        
        # Get software versions
        software_paths = [
            ('deviceinfo/software/getdata', 'Firmware'),
            ('deviceinfo/bootloaderrevision/getdata', 'Bootloader'),
            ('software/firmware/getdata', 'Firmware'),
            ('software/container/getdata', 'Container'),
            ('software/bootloader/getdata', 'Bootloader'),
            ('software/fieldbusfirmware/getdata', 'Fieldbus Firmware'),
        ]
        
        tasks = []
        for path, key in software_paths:
            url = f"{base_url}/{path}"
            tasks.append(client.get(url, timeout=IFM_TIMEOUT))
        
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        for i, response in enumerate(responses):
            if isinstance(response, Exception):
                continue
            try:
                if response.status_code == 200:
                    data = response.json()
                    if data.get('code') == 200:
                        val = data.get('data', {}).get('value', '')
                        if val:
                            key = software_paths[i][1]
                            if key not in device_info['software']:
                                device_info['software'][key] = val
            except Exception:
                pass
        
        # Get device icon
        try:
            response = await client.get(
                f"{base_url}/deviceinfo/deviceicon/getdata",
                timeout=IFM_TIMEOUT
            )
            if response.status_code == 200:
                data = response.json()
                if data.get('code') == 200:
                    device_info['device_icon_url'] = data.get('data', {}).get('value')
        except Exception:
            pass
    
    return device_info


async def poll_io_link_master():
    """Background task that continuously polls the IO-Link Master. Reloads config each loop so IP changes take effect."""
    global system_state
    
    logger.info("Starting IO-Link Master polling loop")
    
    while True:
        # Load config each time so IP/port changes from the UI take effect without restart
        config = load_config()
        io_config = config.get('io_link', {})
        ip = io_config.get('master_ip', IFM_MASTER_IP)
        port = io_config.get('port', IFM_MASTER_PORT)
        timeout = io_config.get('timeout_sec', IFM_TIMEOUT)
        scheme = 'https' if io_config.get('use_https', False) else 'http'
        default_port = 443 if scheme == 'https' else 80
        base_url = f'{scheme}://{ip}' if port == default_port else f'{scheme}://{ip}:{port}'
        
        try:
            # Fetch all data in parallel
            ports_task = poll_all_ports(base_url)
            device_info_task = get_device_info(base_url)
            
            ports, device_info = await asyncio.gather(ports_task, device_info_task, return_exceptions=True)
            
            if isinstance(ports, Exception):
                logger.error(f"Error polling ports: {ports}")
                ports = []
            if isinstance(device_info, Exception):
                logger.error(f"Error fetching device info: {device_info}")
                device_info = {'device_name': 'IO-Link Master', 'software': {}, 'device_icon_url': None}
            
            # Extract supervision data from ports if available
            supervision = {}
            # Note: Supervision data might come from device info endpoints
            # This is a placeholder - adjust based on your actual IO-Link Master API
            
            # Update global state
            system_state = {
                'device_name': device_info.get('device_name', 'IO-Link Master'),
                'ports': ports if isinstance(ports, list) else [],
                'supervision': supervision,
                'software': device_info.get('software', {}),
                'device_icon_url': device_info.get('device_icon_url'),
                'product_image_url': '/api/io-link/product-image',
                'timestamp': time.time(),
                'source': 'iot_core',
                'success': True
            }
            
            # Append supervision history if available
            if supervision:
                append_supervision_history(supervision)
            
            # Broadcast to all connected WebSocket clients
            await broadcast_to_clients(system_state)
            
        except Exception as e:
            logger.error(f"Error in polling loop: {e}")
            system_state['success'] = False
            system_state['error'] = str(e)
        
        # Wait before next poll (re-reads config each loop so interval changes take effect)
        poll_interval = max(0.5, float(io_config.get('poll_interval_sec', POLL_INTERVAL)))
        await asyncio.sleep(poll_interval)


async def broadcast_to_clients(data: Dict):
    """Send data to all connected WebSocket clients"""
    if not connected_clients:
        return
    
    # Create a list of disconnected clients to remove
    disconnected = []
    
    for client in connected_clients:
        try:
            await client.send_json(data)
        except Exception as e:
            logger.debug(f"Error sending to client: {e}")
            disconnected.append(client)
    
    # Remove disconnected clients
    for client in disconnected:
        connected_clients.discard(client)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time data push"""
    await websocket.accept()
    connected_clients.add(websocket)
    logger.info(f"WebSocket client connected. Total clients: {len(connected_clients)}")
    
    try:
        # Send current state immediately
        await websocket.send_json(system_state)
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for any message (or timeout)
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                # Echo back or handle commands if needed
                logger.debug(f"Received WebSocket message: {data}")
            except asyncio.TimeoutError:
                # Send heartbeat/ping to keep connection alive
                await websocket.send_json({'type': 'ping', 'timestamp': time.time()})
            except WebSocketDisconnect:
                break
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        connected_clients.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(connected_clients)}")


@app.get("/api/io-link/config")
async def get_io_link_config():
    """Get current IO-Link Master config (IP, port, etc.) for the UI"""
    config = load_config()
    return JSONResponse(content={
        "success": True,
        "io_link": config.get("io_link", {
            "master_ip": IFM_MASTER_IP,
            "port": IFM_MASTER_PORT,
            "timeout_sec": IFM_TIMEOUT,
            "use_https": False
        })
    })


@app.put("/api/io-link/config")
async def update_io_link_config(request: Request):
    """Update IO-Link Master IP and optional port/timeout. Saves to config.json."""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    master_ip = body.get("master_ip")
    if master_ip is not None:
        master_ip = str(master_ip).strip()
        if not master_ip:
            raise HTTPException(status_code=400, detail="master_ip cannot be empty")
    updates = {}
    if master_ip is not None:
        updates["master_ip"] = master_ip
    if body.get("port") is not None:
        try:
            updates["port"] = int(body["port"])
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="port must be a number")
    if body.get("timeout_sec") is not None:
        try:
            updates["timeout_sec"] = float(body["timeout_sec"])
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="timeout_sec must be a number")
    if body.get("use_https") is not None:
        updates["use_https"] = bool(body["use_https"])
    if body.get("poll_interval_sec") is not None:
        try:
            val = float(body["poll_interval_sec"])
            updates["poll_interval_sec"] = max(0.5, min(30.0, val))
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="poll_interval_sec must be a number")
    if not updates:
        return JSONResponse(content={"success": True, "message": "No changes", "io_link": load_config().get("io_link", {})})
    config = save_config(updates)
    logger.info(f"Config updated: {updates}")
    return JSONResponse(content={
        "success": True,
        "message": "Config saved",
        "io_link": config.get("io_link", {})
    })


@app.post("/api/io-link/simulate-fault")
async def simulate_fault(request: Request):
    """
    Set or clear a simulated fault for a port (for training: see dashboard reaction without touching hardware).
    Body: { "port": 1, "event": { "code": "0x02", "label": "Short circuit" } } to set;
    { "port": 1, "event": null } to clear.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    port_num = body.get("port")
    if port_num is None:
        raise HTTPException(status_code=400, detail="port is required")
    try:
        port_num = int(port_num)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="port must be 1-4")
    if port_num < 1 or port_num > 4:
        raise HTTPException(status_code=400, detail="port must be between 1 and 4")
    event = body.get("event")
    if event is None:
        simulated_events_by_port.pop(port_num, None)
        return JSONResponse(content={"success": True, "message": f"Simulated fault cleared for port {port_num}", "port": port_num, "event": None})
    if not isinstance(event, dict) or "label" not in event:
        raise HTTPException(status_code=400, detail="event must be { code, label }")
    simulated_events_by_port[port_num] = [{"code": str(event.get("code", "0x00")), "label": str(event["label"])}]
    return JSONResponse(content={"success": True, "message": f"Simulated fault set for port {port_num}", "port": port_num, "event": simulated_events_by_port[port_num][0]})


@app.get("/api/io-link/status")
async def io_link_status():
    """Get current IO-Link Master status (for HTTP fallback)"""
    return JSONResponse(content=system_state)


@app.get("/api/io-link/supervision-history")
async def io_link_supervision_history():
    """Return supervision data history for graphing"""
    return JSONResponse(content={
        'history': supervision_history,
        'count': len(supervision_history)
    })


@app.get("/api/io-link/port/{port_num}")
async def io_link_port_detail(port_num: int):
    """Get detailed data for a specific IO-Link port including decoded process data"""
    if port_num < 1 or port_num > 4:
        raise HTTPException(status_code=400, detail="Port must be between 1 and 4")
    
    config = load_config()
    io_config = config.get('io_link', {})
    ip = io_config.get('master_ip', IFM_MASTER_IP)
    port = io_config.get('port', IFM_MASTER_PORT)
    timeout = io_config.get('timeout_sec', IFM_TIMEOUT)
    scheme = 'https' if io_config.get('use_https', False) else 'http'
    default_port = 443 if scheme == 'https' else 80
    base_url = f'{scheme}://{ip}' if port == default_port else f'{scheme}://{ip}:{port}'
    
    port_data = {
        'port': port_num,
        'mode': '',
        'comm_mode': '',
        'vendor_id': '',
        'device_id': '',
        'name': '',
        'serial': '',
        'device_type': 'unknown',
        'pdin': {'raw': '', 'hex': '', 'bytes': [], 'decoded': {}},
        'pdout': {'raw': '', 'hex': '', 'bytes': [], 'decoded': {}},
        'parameters': {},
        'events': []
    }
    
    async with httpx.AsyncClient() as client:
        # Get port info
        port_info = await get_ifm_port_info(client, base_url, port_num)
        port_data.update({
            'mode': port_info.get('mode', ''),
            'comm_mode': port_info.get('comm_mode', ''),
            'vendor_id': port_info.get('vendor_id', ''),
            'device_id': port_info.get('device_id', ''),
            'name': port_info.get('name', ''),
            'serial': port_info.get('serial', '')
        })
        
        # Device type (name-based first, then fallback table)
        port_data['device_type'] = get_device_type(
            port_data['vendor_id'],
            port_data['device_id'],
            port_data['name']
        )
        
        # Get PDin
        pdin_raw = port_info.get('pdin', '')
        if pdin_raw:
            pdin_hex = pdin_raw.replace(' ', '').replace('0x', '')
            pdin_bytes = parse_hex_to_bytes(pdin_raw)
            port_data['pdin'] = {
                'raw': pdin_raw,
                'hex': pdin_hex,
                'bytes': pdin_bytes,
                'decoded': {}
            }
            # Decode PDin by device type
            dtype = port_data['device_type']
            if dtype == DEVICE_TYPE_PHOTO_ELECTRIC and pdin_bytes:
                port_data['pdin']['decoded'] = decode_photo_electric_pdin(pdin_bytes)
            elif dtype == DEVICE_TYPE_TEMPERATURE and len(pdin_bytes) >= 2:
                port_data['pdin']['decoded'] = decode_temperature_pdin(pdin_bytes)
            elif dtype == DEVICE_TYPE_PROXIMITY and pdin_bytes:
                port_data['pdin']['decoded'] = decode_proximity_pdin(pdin_bytes)
        
        # Get PDout and decode
        pdout_raw = port_info.get('pdout', '')
        if pdout_raw:
            pdout_hex = pdout_raw.replace(' ', '').replace('0x', '')
            pdout_bytes = parse_hex_to_bytes(pdout_raw)
            port_data['pdout'] = {
                'raw': pdout_raw,
                'hex': pdout_hex,
                'bytes': pdout_bytes,
                'decoded': {}
            }
            if port_data['device_type'] == DEVICE_TYPE_STATUS_LED and len(pdout_bytes) >= 3:
                port_data['pdout']['decoded'] = decode_cl50_led(pdout_bytes)
        
        # Events: overlay simulated faults (real device events would come from a separate Master API if available)
        port_data['events'] = list(simulated_events_by_port.get(port_num) or [])
    
    return JSONResponse(content={
        'success': True,
        'port': port_data,
        'timestamp': time.time()
    })


@app.get("/learn", response_class=HTMLResponse)
async def serve_learn_page():
    """Serve the Learn page; when SPA build exists, route back to root app."""
    if os.path.exists(os.path.join(_DIST_DIR, 'index.html')):
        return RedirectResponse(url="/", status_code=307)
    learn_path = os.path.join(_FRONTEND_DIR, 'learn.html')
    if not os.path.exists(learn_path):
        raise HTTPException(status_code=404, detail="learn.html not found")
    with open(learn_path, 'r', encoding='utf-8') as f:
        return HTMLResponse(content=f.read())


@app.get("/worksheets", response_class=HTMLResponse)
async def serve_worksheets_page():
    """Serve the Worksheets page; when SPA build exists, route back to root app."""
    if os.path.exists(os.path.join(_DIST_DIR, 'index.html')):
        return RedirectResponse(url="/", status_code=307)
    worksheets_path = os.path.join(_FRONTEND_DIR, 'worksheets.html')
    if not os.path.exists(worksheets_path):
        raise HTTPException(status_code=404, detail="worksheets.html not found")
    with open(worksheets_path, 'r', encoding='utf-8') as f:
        return HTMLResponse(content=f.read())


@app.get("/io-link.html", response_class=HTMLResponse)
async def io_link_page():
    """Compatibility route for legacy bookmarks."""
    return await serve_frontend()


@app.get("/test-root")
async def test_root():
    """Test endpoint to verify routes work"""
    return {"test": "This is a test endpoint", "message": "Routes are working"}


# Define root route - MUST be after all other route definitions
@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def serve_frontend():
    """Serve frontend entry at root URL (dist first, then legacy fallback)."""
    index_path = get_frontend_entry_path()
    
    logger.info(f"Root route called - serving: {index_path}")
    
    if not index_path:
        logger.error(f"Frontend file not found: {index_path}")
        return HTMLResponse(
            content="<h1>Frontend Not Found</h1><p>No usable frontend entry file found.</p>",
            status_code=404
        )
    
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        logger.info(f"Serving frontend HTML ({len(html_content)} bytes)")
        return HTMLResponse(content=html_content)
    except Exception as e:
        logger.error(f"Error reading HTML: {e}", exc_info=True)
        return HTMLResponse(
            content=f"<h1>Error</h1><p>{str(e)}</p>",
            status_code=500
        )


@app.get("/favicon.ico")
async def favicon():
    """Serve favicon if present; fallback to 204."""
    icon_path = get_root_static_file_path("favicon.ico")
    if icon_path:
        return FileResponse(icon_path)
    return Response(status_code=204)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "clients": len(connected_clients)}


@app.get("/{file_name}", include_in_schema=False)
async def serve_root_static(file_name: str):
    """Serve root-level frontend static files (e.g., matrix.png, favicon.svg)."""
    static_path = get_root_static_file_path(file_name)
    if static_path:
        return FileResponse(static_path)
    raise HTTPException(status_code=404, detail="Not found")
