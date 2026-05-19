"""
FastAPI Backend for IO-Link Master
Real-time WebSocket-based communication with async polling
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
import asyncio
import json
import os
import time
import logging
import logging.handlers
from collections import deque
from typing import Dict, List, Optional, Set
from datetime import datetime
import socket

from decoder import (
    decode_cl50_led,
    parse_hex_to_bytes,
    get_device_type,
    decode_photo_electric_pdin,
    decode_temperature_pdin,
    decode_proximity_pdin,
    decode_capacitive_pdin,
    DEVICE_TYPE_STATUS_LED,
    DEVICE_TYPE_PHOTO_ELECTRIC,
    DEVICE_TYPE_TEMPERATURE,
    DEVICE_TYPE_PROXIMITY,
    DEVICE_TYPE_CAPACITIVE,
)
from al1350_client import AL1350ClientManager, MODE_MAP
from device_parameters import (
    get_device_params, decode_isdu_hex, encode_isdu_value,
    T_UINT8, G_CONFIG, G_DIAGNOSTICS, G_IDENTITY
)
from csv_logger import CSVLogger

try:
    import aiomqtt
    _AIOMQTT_AVAILABLE = True
except ImportError:
    _AIOMQTT_AVAILABLE = False


def _enrich_port(port_data: dict, port_labels: dict = None) -> dict:
    """Add device_type, label, pdin_hex, pdout_hex, pdin_decoded, pdout_decoded to a port dict."""
    vendor_id = port_data.get('vendor_id', '')
    device_id = port_data.get('device_id', '')
    name = port_data.get('name', '')

    dtype = get_device_type(vendor_id, device_id, name)

    # Apply port_labels config: label overrides the raw device name for display;
    # device_type_hint fills in when auto-detection returns unknown.
    port_cfg = (port_labels or {}).get(str(port_data.get('port', '')), {})
    if port_cfg.get('label'):
        port_data['label'] = port_cfg['label']
    if dtype == 'unknown' and port_cfg.get('device_type_hint'):
        dtype = port_cfg['device_type_hint']

    port_data['device_type'] = dtype

    pdin_raw = port_data.get('pdin', '')
    pdin_bytes = parse_hex_to_bytes(pdin_raw) if pdin_raw else []
    port_data['pdin_hex'] = pdin_raw
    port_data['pdin_decoded'] = {}
    if pdin_bytes:
        if dtype == DEVICE_TYPE_PHOTO_ELECTRIC:
            port_data['pdin_decoded'] = decode_photo_electric_pdin(pdin_bytes)
        elif dtype == DEVICE_TYPE_TEMPERATURE:
            port_data['pdin_decoded'] = decode_temperature_pdin(pdin_bytes)
        elif dtype == DEVICE_TYPE_PROXIMITY:
            port_data['pdin_decoded'] = decode_proximity_pdin(pdin_bytes)
        elif dtype == DEVICE_TYPE_CAPACITIVE:
            port_data['pdin_decoded'] = decode_capacitive_pdin(pdin_bytes)

    pdout_raw = port_data.get('pdout', '')
    pdout_bytes = parse_hex_to_bytes(pdout_raw) if pdout_raw else []
    port_data['pdout_hex'] = pdout_raw
    port_data['pdout_decoded'] = {}
    if dtype == DEVICE_TYPE_STATUS_LED and len(pdout_bytes) >= 3:
        port_data['pdout_decoded'] = decode_cl50_led(pdout_bytes)

    return port_data


# ── Logging setup ────────────────────────────────────────────────────────────
_LOG_FORMAT = '%(asctime)s %(levelname)s [%(name)s] %(message)s'
_LOG_DATE_FMT = '%Y-%m-%d %H:%M:%S'

logging.basicConfig(level=logging.INFO, format=_LOG_FORMAT, datefmt=_LOG_DATE_FMT)
logger = logging.getLogger(__name__)

# File handler: rotate at 10 MB, keep 5 files
_LOGS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'logs')
os.makedirs(_LOGS_DIR, exist_ok=True)
_file_handler = logging.handlers.RotatingFileHandler(
    os.path.join(_LOGS_DIR, 'app.log'),
    maxBytes=10 * 1024 * 1024,
    backupCount=5,
    encoding='utf-8',
)
_file_handler.setFormatter(logging.Formatter(_LOG_FORMAT, datefmt=_LOG_DATE_FMT))
logging.getLogger().addHandler(_file_handler)

# In-memory ring buffer for the Diagnostics log viewer (last 500 records)
_app_log_buffer: deque = deque(maxlen=500)

class _MemHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        _app_log_buffer.append({
            'ts': record.created,
            'level': record.levelname,
            'msg': record.getMessage(),
            'name': record.name,
        })

_mem_handler = _MemHandler(level=logging.DEBUG)
logging.getLogger().addHandler(_mem_handler)

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

_BACKEND_START_TS: float = time.time()

csv_logger = CSVLogger()

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
_broadcast_in_progress: bool = False

# Background polling task handle
polling_task: Optional[asyncio.Task] = None
mqtt_task: Optional[asyncio.Task] = None
mqtt_connected: bool = False

# Simulated fault overlay per port (for training: show fault without touching hardware)
# Keys: port number (1-4), Values: list of {"code": "0x02", "label": "Short circuit"} or None to clear
simulated_events_by_port: Dict[int, List[Dict]] = {}

# Connection diagnostics
connection_events: list = []
MAX_CONN_EVENTS = 500
poll_latencies: list = []
MAX_LATENCIES = 200
_prev_success: Optional[bool] = None
_transition_ts: Optional[float] = None
consecutive_failures: int = 0
_prev_circuit_state: Optional[str] = None
_prev_degraded_mode: Optional[bool] = None
# Detection counter tracking per port (capacitive sensor ISDU index 210)
_cap_counter_prev: dict = {}  # port -> last raw counter value

# Configuration
POLL_INTERVAL = 1.0
STATIC_REFRESH_EVERY_CYCLES = 6  # refresh static metadata every N polls




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


# Shared AL1350 client manager (single AsyncClient + retries/circuit/diagnostics)
al1350 = AL1350ClientManager(config_loader=load_config, logger=logger)


def append_supervision_history(supervision_dict):
    """Append processdatamaster supervision snapshot to the history buffer.

    Keys expected (from AL1350 processdatamaster, manual §9.2.9):
      temperature (°C), voltage (V), current (A), supervisionstatus
    """
    if not supervision_dict:
        return
    entry = {
        'ts': time.time(),
        'current': supervision_dict.get('current'),
        'voltage': supervision_dict.get('voltage'),
        'temperature': supervision_dict.get('temperature'),
        'status': supervision_dict.get('supervisionstatus'),
        'sw_version': None,
    }
    supervision_history.append(entry)
    while len(supervision_history) > MAX_HISTORY_SIZE:
        supervision_history.pop(0)




async def poll_io_link_master():
    """Background task that continuously polls the IO-Link Master. Reloads config each loop so IP changes take effect."""
    global system_state, _prev_circuit_state, _prev_degraded_mode

    logger.info("Starting IO-Link Master polling loop")

    cycle_count = 0
    while True:
        config = load_config()
        io_config = config.get('io_link', {})
        include_static = (cycle_count % STATIC_REFRESH_EVERY_CYCLES == 0)
        cycle_count += 1

        poll_start = time.time()
        poll_interval = max(0.5, float(io_config.get('poll_interval_sec', POLL_INTERVAL)))

        try:
            await al1350.on_config_changed()
            circuit_before = al1350._breaker.state
            disconnected_interval = max(poll_interval, float(io_config.get('disconnected_poll_interval_sec', 5.0)))
            ports, device_info, supervision = await al1350.poll_snapshot(
                include_static=include_static,
                connected_interval=poll_interval,
                disconnected_interval=disconnected_interval,
            )

            poll_ms = round((time.time() - poll_start) * 1000)
            poll_latencies.append({'ts': time.time(), 'latency_ms': poll_ms})
            while len(poll_latencies) > MAX_LATENCIES:
                poll_latencies.pop(0)

            circuit_after = al1350._breaker.state

            # Log circuit breaker transitions
            if _prev_circuit_state is not None and circuit_after != _prev_circuit_state:
                if circuit_after == 'open':
                    logger.error(
                        f"CIRCUIT BREAKER OPENED — failures={al1350._breaker.failures} "
                        f"threshold={al1350._breaker.failure_threshold} "
                        f"last_error={al1350.last_error!r} "
                        f"master={al1350._master_ip}:{al1350._master_port} "
                        f"poll_ms={poll_ms}"
                    )
                elif circuit_after == 'closed' and _prev_circuit_state in ('open', 'half-open'):
                    logger.info(
                        f"CIRCUIT BREAKER CLOSED (recovered) — "
                        f"was={_prev_circuit_state} poll_ms={poll_ms}"
                    )
                elif circuit_after == 'half-open':
                    logger.info(
                        f"CIRCUIT BREAKER HALF-OPEN — probing recovery after 15 s "
                        f"master={al1350._master_ip}:{al1350._master_port}"
                    )
            _prev_circuit_state = circuit_after

            # Log degraded mode transitions
            if _prev_degraded_mode is not None and al1350.degraded_mode != _prev_degraded_mode:
                if al1350.degraded_mode:
                    logger.warning(
                        f"DEGRADED MODE: falling back to per-request GETs "
                        f"reason={al1350.degraded_reason!r}"
                    )
                else:
                    logger.info("DEGRADED MODE cleared — getdatamulti working again")
            _prev_degraded_mode = al1350.degraded_mode

            # Preserve static metadata between lightweight poll cycles.
            prev_ports = {p.get('port'): p for p in (system_state.get('ports') or []) if isinstance(p, dict)}
            if isinstance(ports, list):
                for port_data in ports:
                    prev = prev_ports.get(port_data.get('port'))
                    if not prev:
                        continue
                    for key in ('vendor_id', 'device_id', 'name', 'serial'):
                        if not port_data.get(key):
                            port_data[key] = prev.get(key, '')

            # Enrich each port with decoded pdin/pdout and device_type
            port_labels = config.get('port_labels', {})
            if isinstance(ports, list):
                for port_data in ports:
                    _enrich_port(port_data, port_labels=port_labels)

            # Read detection counters for all capacitive ports in parallel
            if isinstance(ports, list):
                cap_ports = [p for p in ports if p.get('device_type') == 'capacitive' and p.get('mode') == 'io-link']
                if cap_ports:
                    counter_tasks = [al1350.read_isdu_int32(p['port'], 210, 0) for p in cap_ports]
                    counter_values = await asyncio.gather(*counter_tasks, return_exceptions=True)
                    for port_data, val in zip(cap_ports, counter_values):
                        if isinstance(val, int):
                            pn = port_data['port']
                            prev = _cap_counter_prev.get(pn)
                            delta = (val - prev) if prev is not None else 0
                            _cap_counter_prev[pn] = val
                            port_data['detection_counter'] = val
                            port_data['detection_counter_delta'] = max(0, delta)

            # Update global state.
            # When MQTT is active it owns real-time pdin/mode updates and broadcasts.
            # The HTTP poll still runs to keep static metadata, supervision history,
            # and ISDU counters fresh — but we only merge those fields rather than
            # overwriting the whole state, and we skip broadcasting so the UI source
            # label doesn't flicker between "mqtt" and "getdatamulti".
            is_connected = al1350._breaker.state != "open"
            if mqtt_connected:
                # Merge only the fields HTTP poll is authoritative for
                system_state['device_name'] = (device_info.get('device_name') or system_state.get('device_name') or 'IO-Link Master')
                system_state['software'] = device_info.get('software') or system_state.get('software', {})
                system_state['device_icon_url'] = device_info.get('device_icon_url') or system_state.get('device_icon_url')
                system_state['degraded_mode'] = al1350.degraded_mode
                system_state['degraded_reason'] = al1350.degraded_reason
                system_state['last_good_data_ts'] = al1350.last_good_data_ts or None
                system_state['success'] = is_connected
                # Merge ISDU counter values into the MQTT-sourced port list
                if isinstance(ports, list):
                    port_map = {p['port']: p for p in ports}
                    for port in system_state.get('ports') or []:
                        pn = port.get('port')
                        if pn in port_map:
                            for key in ('detection_counter', 'detection_counter_delta'):
                                if key in port_map[pn]:
                                    port[key] = port_map[pn][key]
            else:
                system_state = {
                    'device_name': (device_info.get('device_name') or system_state.get('device_name') or 'IO-Link Master'),
                    'ports': ports if isinstance(ports, list) else [],
                    'supervision': supervision,
                    'software': device_info.get('software') or system_state.get('software', {}),
                    'device_icon_url': device_info.get('device_icon_url') or system_state.get('device_icon_url'),
                    'product_image_url': '/api/io-link/product-image',
                    'timestamp': time.time(),
                    'source': 'getdatamulti' if not al1350.degraded_mode else 'fallback',
                    'degraded_mode': al1350.degraded_mode,
                    'degraded_reason': al1350.degraded_reason,
                    'last_good_data_ts': al1350.last_good_data_ts or None,
                    'error': None,
                    'success': is_connected
                }

            if supervision:
                append_supervision_history(supervision)

            # Only broadcast from the HTTP poll when MQTT is not active.
            # When MQTT is connected it broadcasts on every push message instead.
            if not mqtt_connected:
                await broadcast_to_clients(system_state)
                csv_logger.log(system_state)

        except Exception as e:
            logger.error(
                f"Poll loop exception: {e!r} "
                f"circuit={al1350._breaker.state} "
                f"failures={al1350._breaker.failures} "
                f"master={al1350._master_ip}:{al1350._master_port}"
            )
            system_state['success'] = False
            system_state['error'] = str(e)
            al1350.last_error = str(e)
            al1350.degraded_mode = True

        # Track connected/disconnected transitions for diagnostics
        global _prev_success, _transition_ts, consecutive_failures
        _now = time.time()
        _current = system_state.get('success', False)
        if _prev_success is None:
            _transition_ts = _now
        elif _current != _prev_success:
            _dur = round(_now - (_transition_ts or _now), 1)
            _err = None if _current else (system_state.get('error') or al1350.last_error)
            connection_events.append({
                'ts': _now,
                'status': 'connected' if _current else 'disconnected',
                'duration_sec': _dur,
                'error': _err,
                'circuit': al1350._breaker.state,
            })
            while len(connection_events) > MAX_CONN_EVENTS:
                connection_events.pop(0)
            _transition_ts = _now
            if _current:
                logger.info(f"AL1350 STATUS → CONNECTED (was down {_dur}s)")
            else:
                logger.warning(
                    f"AL1350 STATUS → DISCONNECTED (was up {_dur}s) "
                    f"error={_err!r} circuit={al1350._breaker.state}"
                )
        consecutive_failures = 0 if _current else consecutive_failures + 1
        _prev_success = _current

        # Deadline-based sleep: target a fixed cycle time regardless of how long the poll took
        await asyncio.sleep(max(0, poll_interval - (time.time() - poll_start)))


def _parse_mqtt_message(raw: bytes) -> None:
    """Parse an AL1350 MQTT push message and merge pdin/mode/supervision into system_state."""
    global system_state, mqtt_connected, _cap_counter_prev
    try:
        msg = json.loads(raw)
        payload = msg.get("data", {}).get("payload", {})
        if not payload:
            return

        config = load_config()
        port_labels = config.get("port_labels", {})

        # Update each port's pdin and mode from the MQTT payload
        ports = {p["port"]: p for p in (system_state.get("ports") or []) if isinstance(p, dict)}
        for port_num in range(1, 5):
            pdin_val = (payload.get(f"/iolinkmaster/port[{port_num}]/iolinkdevice/pdin") or {})
            mode_val = (payload.get(f"/iolinkmaster/port[{port_num}]/mode") or {})

            port = ports.get(port_num, {"port": port_num, "mode": "inactive", "pdin": "", "pdout": "",
                                        "comm_mode": "", "master_cycle_time": "", "vendor_id": "",
                                        "device_id": "", "name": "", "serial": "", "source": "mqtt"})
            if isinstance(pdin_val, dict) and pdin_val.get("code") == 200:
                port["pdin"] = pdin_val.get("data", "")
                port["source"] = "mqtt"
            if isinstance(mode_val, dict) and mode_val.get("code") == 200:
                raw_mode = mode_val.get("data")
                port["mode"] = MODE_MAP.get(raw_mode, str(raw_mode)) if isinstance(raw_mode, int) else (raw_mode or "inactive")
            _enrich_port(port, port_labels=port_labels)
            ports[port_num] = port

        # Update supervision from MQTT payload
        supervision = dict(system_state.get("supervision") or {})
        for key, path in (("temperature", "/processdatamaster/temperature"),
                          ("voltage", "/processdatamaster/voltage"),
                          ("current", "/processdatamaster/current"),
                          ("supervisionstatus", "/processdatamaster/supervisionstatus")):
            entry = payload.get(path)
            if isinstance(entry, dict) and entry.get("code") == 200:
                supervision[key] = entry.get("data")
        if supervision:
            append_supervision_history(supervision)

        # Detection counter reads for capacitive ports (still via HTTP; updated by poll loop)
        # Merge any existing detection_counter fields from the poll loop cache
        for port_num, port in ports.items():
            if port.get("device_type") == "capacitive" and port_num in _cap_counter_prev:
                port["detection_counter"] = _cap_counter_prev[port_num]

        system_state = {
            **system_state,
            "ports": [ports[i] for i in sorted(ports)],
            "supervision": supervision,
            "timestamp": time.time(),
            "source": "mqtt",
            "success": True,
            "error": None,
        }
        mqtt_connected = True
    except Exception as e:
        logger.debug(f"MQTT message parse error: {e!r}")


async def run_mqtt_listener():
    """Subscribe to the Mosquitto broker and update system_state from AL1350 push messages."""
    global mqtt_connected
    if not _AIOMQTT_AVAILABLE:
        logger.warning("aiomqtt not installed — MQTT listener disabled, falling back to HTTP polling only")
        return

    cfg = load_config().get("mqtt", {})
    broker_host = cfg.get("broker_host", "127.0.0.1")
    broker_port = int(cfg.get("broker_port", 1883))
    interval_ms = int(cfg.get("publish_interval_ms", 500))

    reconnect_delay = 5.0
    while True:
        try:
            logger.info(f"MQTT connecting to {broker_host}:{broker_port}")
            # Register the subscription with the AL1350 (idempotent)
            ok = await al1350.ensure_mqtt_subscription(broker_host, broker_port, interval_ms)
            if not ok:
                logger.warning("MQTT subscription registration failed — retrying in 15s")
                await asyncio.sleep(15)
                continue

            async with aiomqtt.Client(broker_host, port=broker_port) as client:
                await client.subscribe("iolink")
                mqtt_connected = True
                reconnect_delay = 5.0
                logger.info("MQTT listener active — receiving AL1350 push data")
                async for message in client.messages:
                    _parse_mqtt_message(bytes(message.payload))
                    await broadcast_to_clients(system_state)
                    csv_logger.log(system_state)

        except Exception as e:
            mqtt_connected = False
            logger.warning(f"MQTT listener error: {e!r} — reconnecting in {reconnect_delay:.0f}s")
            await asyncio.sleep(reconnect_delay)
            reconnect_delay = min(reconnect_delay * 2, 60.0)


@app.on_event("startup")
async def start_background_polling():
    """Start IO-Link polling loop and MQTT listener when API starts."""
    global polling_task, mqtt_task
    try:
        await al1350.refresh_gettree(force=True)
    except Exception as e:
        logger.warning(f"Initial gettree warmup failed: {e}")
    if polling_task is None or polling_task.done():
        polling_task = asyncio.create_task(poll_io_link_master())
        logger.info("IO-Link HTTP polling task started")

    cfg = load_config().get("mqtt", {})
    if cfg.get("enabled", True) and _AIOMQTT_AVAILABLE:
        if mqtt_task is None or mqtt_task.done():
            mqtt_task = asyncio.create_task(run_mqtt_listener())
            logger.info("MQTT listener task started")


@app.on_event("shutdown")
async def stop_background_polling():
    """Stop IO-Link polling loop when API shuts down."""
    global polling_task
    if polling_task and not polling_task.done():
        polling_task.cancel()
        try:
            await polling_task
        except asyncio.CancelledError:
            pass
        logger.info("IO-Link background polling task stopped")
    await al1350.close()


async def broadcast_to_clients(data: Dict):
    """Send data to all connected WebSocket clients.

    Serialises once, then fans out to all clients in parallel.
    If a previous broadcast is still in flight (slow client or event-loop
    back-pressure), the call returns immediately so the event loop is not
    allowed to build up a queue of stale frames.
    """
    global _broadcast_in_progress
    if not connected_clients:
        return
    if _broadcast_in_progress:
        return

    _broadcast_in_progress = True
    try:
        try:
            message = json.dumps(data, default=str)
        except Exception as e:
            logger.debug(f"Broadcast serialisation error: {e}")
            return

        async def _send_one(client: WebSocket) -> Optional[WebSocket]:
            try:
                await client.send_text(message)
                return None
            except Exception:
                return client

        results = await asyncio.gather(*[_send_one(c) for c in list(connected_clients)], return_exceptions=True)
        for result in results:
            if isinstance(result, WebSocket):
                connected_clients.discard(result)
    finally:
        _broadcast_in_progress = False


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time data push"""
    await websocket.accept()
    connected_clients.add(websocket)
    client_host = websocket.client.host if websocket.client else 'unknown'
    logger.info(f"WS CONNECT from {client_host} — total clients: {len(connected_clients)}")
    
    try:
        # Send current state immediately
        await websocket.send_json(system_state)

        # Hold the connection open — broadcast_to_clients() pushes data every poll cycle
        # (typically 1 s), which is sufficient keepalive.  We must NOT send anything here
        # concurrently with broadcast_to_clients; concurrent sends on the same WebSocket
        # corrupt its state and close the connection.
        await websocket.receive_text()  # blocks until client closes or sends something
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.debug(f"WS closed: {e}")
    finally:
        connected_clients.discard(websocket)
        logger.info(f"WS DISCONNECT from {client_host} — total clients: {len(connected_clients)}")


@app.get("/api/io-link/config")
async def get_io_link_config():
    """Get current IO-Link Master config (IP, port, etc.) for the UI"""
    config = load_config()
    return JSONResponse(content={
        "success": True,
        "io_link": config.get("io_link", {
            "master_ip": "192.168.7.4",
            "port": 80,
            "timeout_sec": 4.0,
            "use_https": False
        })
    })


@app.get("/api/io-link/history")
async def get_history(minutes: int = 60):
    """Return downsampled 10-second-bucket time-series for all sensor types."""
    config = load_config()
    port_labels = config.get("port_labels", {})
    series = csv_logger.read_history(minutes=min(minutes, 60), port_labels=port_labels)
    return JSONResponse(content=series)


@app.delete("/api/io-link/history")
async def clear_history():
    """Delete all CSV log files and start a fresh log."""
    csv_logger.clear()
    return JSONResponse(content={"success": True})


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
    await al1350.on_config_changed()
    logger.info(f"Config updated: {updates}")
    return JSONResponse(content={
        "success": True,
        "message": "Config saved",
        "io_link": config.get("io_link", {})
    })


@app.post("/api/io-link/iotsetup/network/setblock")
async def io_link_iot_network_setblock(request: Request):
    """Atomic write of IoT network settings using AL1350 setblock service."""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    result = await al1350.write_iot_network_setblock(
        dhcp=body.get("dhcp"),
        ipaddress_value=body.get("ipaddress"),
        subnetmask=body.get("subnetmask"),
        gateway=body.get("ipdefaultgateway"),
    )
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "setblock failed"))
    return JSONResponse(content=result)


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


@app.get("/api/io-link/diagnostics")
async def io_link_diagnostics():
    """Return connection diagnostics: events, latencies, uptime stats."""
    _now = time.time()
    one_h = _now - 3600
    recent = [e for e in connection_events if e['ts'] >= one_h]
    drops_1h = sum(1 for e in recent if e['status'] == 'disconnected')
    # 'connected' events carry the duration of the preceding disconnected period
    disc_secs = sum(e['duration_sec'] for e in recent if e['status'] == 'connected')
    uptime_pct = round(max(0.0, (3600 - disc_secs) / 3600 * 100), 1)
    avg_lat = round(sum(p['latency_ms'] for p in poll_latencies) / len(poll_latencies)) if poll_latencies else None
    extra = await al1350.diagnostics_snapshot()
    return JSONResponse({
        'success': True,
        'start_ts': _BACKEND_START_TS,
        'events': connection_events[-200:],
        'latencies': poll_latencies[-100:],
        'stats': {
            'uptime_pct_1h': uptime_pct,
            'drops_1h': drops_1h,
            'consecutive_failures': consecutive_failures,
            'avg_latency_ms': avg_lat,
            'current_connected': system_state.get('success', False),
            'last_error': system_state.get('error'),
            'request_success_rate_pct': extra.get('request_success_rate_pct'),
            'request_rtt_p50_ms': extra.get('request_rtt_p50_ms'),
            'request_rtt_p95_ms': extra.get('request_rtt_p95_ms'),
            'reconnect_count': extra.get('reconnect_count'),
            'circuit_state': extra.get('circuit_state'),
            'degraded_mode': extra.get('degraded_mode'),
            'degraded_reason': extra.get('degraded_reason'),
            'last_good_data_ts': extra.get('last_good_data_ts'),
            'port_freshness_age_sec': extra.get('port_freshness_age_sec'),
            'link': extra.get('link'),
            'mqtt_connected': mqtt_connected,
            'mqtt_enabled': _AIOMQTT_AVAILABLE and load_config().get('mqtt', {}).get('enabled', True),
            'system': extra.get('system'),
            'master_target': extra.get('master_target'),
        }
    })


@app.get("/api/logs")
async def get_app_logs(n: int = 200):
    """Return last N in-memory log entries for the Diagnostics log viewer."""
    entries = list(_app_log_buffer)[-n:]
    return JSONResponse({'success': True, 'count': len(entries), 'logs': entries})


@app.get("/api/io-link/port/{port_num}")
async def io_link_port_detail(port_num: int):
    """Get detailed data for a specific IO-Link port including decoded process data"""
    if port_num < 1 or port_num > 4:
        raise HTTPException(status_code=400, detail="Port must be between 1 and 4")
    
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

    await al1350.on_config_changed()
    port_info = await al1350.get_port_info(port_num, include_static=True)
    port_data.update({
        'mode': port_info.get('mode', ''),
        'comm_mode': port_info.get('comm_mode', ''),
        'vendor_id': port_info.get('vendor_id', ''),
        'device_id': port_info.get('device_id', ''),
        'name': port_info.get('name', ''),
        'serial': port_info.get('serial', '')
    })

    # Device type (name-based first, then fallback table, then port_labels hint)
    _pl = load_config().get('port_labels', {})
    _pcfg = _pl.get(str(port_num), {})
    dtype = get_device_type(port_data['vendor_id'], port_data['device_id'], port_data['name'])
    if dtype == 'unknown' and _pcfg.get('device_type_hint'):
        dtype = _pcfg['device_type_hint']
    port_data['device_type'] = dtype
    if _pcfg.get('label'):
        port_data['label'] = _pcfg['label']

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
        elif dtype == DEVICE_TYPE_CAPACITIVE and pdin_bytes:
            port_data['pdin']['decoded'] = decode_capacitive_pdin(pdin_bytes)

    # For capacitive sensors, read the onboard detection counter (ISDU index 210)
    if dtype == DEVICE_TYPE_CAPACITIVE and port_info.get('mode') == 'io-link':
        counter_val = await al1350.read_isdu_int32(port_num, 210, 0)
        if counter_val is not None:
            port_data['detection_counter'] = counter_val
            prev = _cap_counter_prev.get(port_num)
            port_data['detection_counter_delta'] = max(0, counter_val - prev) if prev is not None else 0

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


@app.get("/api/io-link/port/{port_num}/parameters")
async def get_port_parameters(port_num: int):
    """Return the IODD-derived parameter definitions for the device on this port,
    plus live values read from the device for all parameters."""
    if port_num < 1 or port_num > 4:
        raise HTTPException(status_code=400, detail="Port must be 1–4")

    # Resolve vendor/device id from live state
    ports = system_state.get('ports') or []
    port = next((p for p in ports if p.get('port') == port_num), {})
    vendor_id = port.get('vendor_id', '')
    device_id = port.get('device_id', '')

    # Fallback to config hint for device type if IDs unavailable
    registry = get_device_params(vendor_id, device_id)
    if registry is None:
        return JSONResponse({'success': False, 'error': 'No IODD-derived parameters for this device',
                             'vendor_id': vendor_id, 'device_id': device_id})

    # Read all parameters from device (in parallel)
    params_with_values = []
    for p in registry['parameters']:
        hex_val = await al1350.read_isdu(port_num, p['index'], p['subindex'])
        scale = p.get('scale', 1.0)
        value = decode_isdu_hex(hex_val, p['dtype'], scale) if hex_val else None
        entry = dict(p)
        entry['raw_hex'] = hex_val
        entry['value'] = value
        if value is not None and 'enum' in p:
            entry['value_label'] = p['enum'].get(value if isinstance(value, int) else int(value), str(value))
        params_with_values.append(entry)

    return JSONResponse({
        'success': True,
        'port': port_num,
        'device_label': registry['label'],
        'commands': registry['commands'],
        'parameters': params_with_values,
    })


@app.post("/api/io-link/port/{port_num}/parameter/read")
async def read_port_parameter(port_num: int, request: Request):
    """Read a single ISDU parameter. Body: {index, subindex, dtype, scale?}"""
    if port_num < 1 or port_num > 4:
        raise HTTPException(status_code=400, detail="Port must be 1–4")
    body = await request.json()
    index    = int(body['index'])
    subindex = int(body.get('subindex', 0))
    dtype    = body.get('dtype', T_UINT8)
    scale    = float(body.get('scale', 1.0))

    hex_val = await al1350.read_isdu(port_num, index, subindex)
    if hex_val is None:
        return JSONResponse({'success': False, 'error': 'ISDU read failed or device not connected'})
    value = decode_isdu_hex(hex_val, dtype, scale)
    return JSONResponse({'success': True, 'raw_hex': hex_val, 'value': value})


@app.post("/api/io-link/port/{port_num}/parameter/write")
async def write_port_parameter(port_num: int, request: Request):
    """Write a single ISDU parameter. Body: {index, subindex, value, dtype, scale?}"""
    if port_num < 1 or port_num > 4:
        raise HTTPException(status_code=400, detail="Port must be 1–4")
    body = await request.json()
    index    = int(body['index'])
    subindex = int(body.get('subindex', 0))
    dtype    = body.get('dtype', T_UINT8)
    scale    = float(body.get('scale', 1.0))
    value    = body['value']

    hex_val = encode_isdu_value(value, dtype, scale)
    ok = await al1350.write_isdu(port_num, index, subindex, hex_val)
    if not ok:
        return JSONResponse({'success': False, 'error': 'ISDU write failed'})
    return JSONResponse({'success': True, 'wrote_hex': hex_val, 'value': value})


@app.post("/api/io-link/port/{port_num}/command")
async def execute_port_command(port_num: int, request: Request):
    """Execute a named system command on the device. Body: {command} e.g. 'teach_sp1'"""
    if port_num < 1 or port_num > 4:
        raise HTTPException(status_code=400, detail="Port must be 1–4")
    body = await request.json()
    cmd_key = body.get('command', '')

    ports = system_state.get('ports') or []
    port  = next((p for p in ports if p.get('port') == port_num), {})
    registry = get_device_params(port.get('vendor_id', ''), port.get('device_id', ''))
    if registry is None:
        return JSONResponse({'success': False, 'error': 'Unknown device on this port'})

    cmd = registry['commands'].get(cmd_key)
    if cmd is None:
        return JSONResponse({'success': False, 'error': f'Unknown command: {cmd_key}'})

    # System commands are written to index 2 / subindex 0 as uint8
    hex_val = encode_isdu_value(cmd['value'], T_UINT8)
    ok = await al1350.write_isdu(port_num, 2, 0, hex_val)
    if not ok:
        return JSONResponse({'success': False, 'error': 'Command write failed'})
    return JSONResponse({'success': True, 'command': cmd_key, 'label': cmd['label']})


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
        return HTMLResponse(
            content=html_content,
            headers={
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )
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


def _get_local_ip() -> Optional[str]:
    """Return all non-loopback IPs on this host, comma-separated.
    Uses 'hostname -I' (Linux) as the primary method — works without internet access.
    Falls back to UDP connect probes against known local targets."""
    import subprocess as _sp
    # hostname -I lists all interface IPs space-separated, no DNS needed
    try:
        result = _sp.run(["hostname", "-I"], capture_output=True, text=True, timeout=2)
        ips = [ip for ip in result.stdout.strip().split() if not ip.startswith("127.")]
        if ips:
            return ", ".join(ips)
    except Exception:
        pass
    # Fallback: UDP connect trick against known local targets (no packets sent)
    for target in ("192.168.7.4", "192.168.0.1", "10.0.0.1"):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.settimeout(0.1)
            s.connect((target, 80))
            ip = s.getsockname()[0]
            s.close()
            if ip and not ip.startswith("127."):
                return ip
        except Exception:
            continue
    try:
        return socket.gethostbyname(socket.gethostname())
    except Exception:
        return None


@app.get("/api/system/health")
async def system_health():
    """System health for admin observability."""
    diag = await al1350.diagnostics_snapshot()
    return JSONResponse(
        {
            "success": True,
            "timestamp": time.time(),
            "hostname": socket.gethostname(),
            "ip_address": _get_local_ip(),
            "io_link_connected": bool(system_state.get("success")),
            "degraded_mode": bool(diag.get("degraded_mode")),
            "system": diag.get("system", {}),
            "link": diag.get("link", {}),
            "master_target": diag.get("master_target", {}),
        }
    )


# ================================================================
# Debug telemetry — collects frontend events so we can diagnose
# touch/scroll behaviour without needing physical screen access.
# ================================================================

_debug_log: deque = deque(maxlen=200)

@app.post("/api/debug/event")
async def debug_event(request: Request):
    try:
        body = await request.json()
        _debug_log.append({"t": round(time.time() * 1000), **body})
    except Exception:
        pass
    return Response(status_code=204)

@app.get("/api/debug/events")
async def debug_events():
    return JSONResponse({"events": list(_debug_log)})

@app.delete("/api/debug/events")
async def debug_clear():
    _debug_log.clear()
    return Response(status_code=204)


# ================================================================
# Wi-Fi configuration endpoints (uses nmcli / NetworkManager)
# ================================================================

async def _run(cmd: list) -> tuple:
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    return proc.returncode, stdout.decode().strip(), stderr.decode().strip()


@app.get("/api/system/wifi/status")
async def wifi_status():
    code, out, err = await _run(["nmcli", "-t", "-f", "DEVICE,TYPE,STATE,CONNECTION,CON-PATH", "dev", "status"])
    if code != 0:
        return JSONResponse({"success": False, "error": "nmcli not available — NetworkManager may not be installed."})

    wifi_device = None
    for line in out.splitlines():
        parts = line.split(":")
        if len(parts) >= 4 and parts[1] == "wifi":
            wifi_device = {"device": parts[0], "state": parts[2], "connection": parts[3]}
            break

    if not wifi_device:
        return JSONResponse({"success": True, "state": "unavailable", "device": None, "ssid": None, "ip": None})

    ip = None
    if wifi_device["state"] == "connected":
        _, ip_out, _ = await _run(["nmcli", "-t", "-f", "IP4.ADDRESS", "dev", "show", wifi_device["device"]])
        for line in ip_out.splitlines():
            if line.startswith("IP4.ADDRESS"):
                ip = line.split(":")[-1].split("/")[0]
                break

    return JSONResponse({
        "success": True,
        "device": wifi_device["device"],
        "state": wifi_device["state"],
        "ssid": wifi_device["connection"] if wifi_device["state"] == "connected" else None,
        "ip": ip,
    })


@app.get("/api/system/wifi/scan")
async def wifi_scan():
    # Trigger a fresh scan then list results
    await _run(["nmcli", "dev", "wifi", "rescan"])
    code, out, err = await _run([
        "nmcli", "--terse", "--fields", "IN-USE,SSID,SIGNAL,SECURITY", "dev", "wifi", "list"
    ])
    if code != 0:
        return JSONResponse({"success": False, "error": "nmcli not available."})

    networks = []
    seen = set()
    for line in out.splitlines():
        parts = line.split(":")
        if len(parts) < 4:
            continue
        in_use = parts[0].strip() == "*"
        ssid = parts[1].strip()
        if not ssid or ssid in seen:
            continue
        seen.add(ssid)
        try:
            signal = int(parts[2].strip())
        except ValueError:
            signal = 0
        security = parts[3].strip()
        networks.append({"ssid": ssid, "signal": signal, "security": security, "in_use": in_use})

    networks.sort(key=lambda n: (-n["in_use"], -n["signal"]))
    return JSONResponse({"success": True, "networks": networks})


@app.post("/api/system/wifi/connect")
async def wifi_connect(request: Request):
    body = await request.json()
    ssid = (body.get("ssid") or "").strip()
    password = (body.get("password") or "").strip()

    if not ssid:
        return JSONResponse({"success": False, "error": "SSID is required."}, status_code=400)

    # Try connecting to an existing saved connection first
    code, out, err = await _run(["nmcli", "con", "up", ssid])
    if code == 0:
        return JSONResponse({"success": True, "message": f"Connected to {ssid}"})

    # New connection — password required for secured networks
    if password:
        cmd = ["nmcli", "dev", "wifi", "connect", ssid, "password", password]
    else:
        cmd = ["nmcli", "dev", "wifi", "connect", ssid]

    code, out, err = await _run(cmd)
    if code == 0:
        return JSONResponse({"success": True, "message": f"Connected to {ssid}"})

    error_msg = err or out or "Connection failed."
    # Simplify common nmcli error messages for the UI
    if "Secrets were required" in error_msg or "password" in error_msg.lower():
        error_msg = "Wrong password or no password provided."
    elif "not found" in error_msg.lower():
        error_msg = f'Network "{ssid}" not found. Try scanning again.'
    return JSONResponse({"success": False, "error": error_msg}, status_code=400)


@app.post("/api/system/wifi/disconnect")
async def wifi_disconnect():
    # Find the active wifi device and disconnect it
    _, out, _ = await _run(["nmcli", "-t", "-f", "DEVICE,TYPE,STATE", "dev", "status"])
    device = None
    for line in out.splitlines():
        parts = line.split(":")
        if len(parts) >= 3 and parts[1] == "wifi" and parts[2] == "connected":
            device = parts[0]
            break
    if not device:
        return JSONResponse({"success": False, "error": "No active Wi-Fi connection."})
    code, _, err = await _run(["nmcli", "dev", "disconnect", device])
    if code == 0:
        return JSONResponse({"success": True, "message": "Disconnected."})
    return JSONResponse({"success": False, "error": err or "Disconnect failed."}, status_code=400)


@app.get("/{file_name}", include_in_schema=False)
async def serve_root_static(file_name: str):
    """Serve root-level frontend static files (e.g., matrix.png, favicon.svg)."""
    static_path = get_root_static_file_path(file_name)
    if static_path:
        return FileResponse(static_path)
    raise HTTPException(status_code=404, detail="Not found")
