Moving from Flask to a more robust, industrial-grade backend is a smart move. Flask is great for prototyping, but it is synchronous (handles one task at a time), which isn't ideal for a dashboard that needs to poll hardware frequently while simultaneously serving multiple users.For 2026, the "best" plan for your IO-Link setup is to move to FastAPI. It is essentially the modern successor to Flask—built for speed, high concurrency, and native asynchronous communication.🚀 The 2026 "Pro" Backend Architecture PlanThe key change here is moving from Polling (Client → Server) to Push (Server → Client) using WebSockets. This creates a live "pipe" where your backend pushes data the millisecond it’s ready.1. The Technology StackLanguage: Python 3.12+ (for best asyncio performance).Framework: FastAPI (Handles requests asynchronously).Real-time Layer: WebSockets (Instead of the browser asking every 5s, the server just pushes updates).Task Runner: BackgroundTasks or Asyncio.create_task (To poll the Master device without blocking the web server).Data Validation: Pydantic (Built into FastAPI; ensures the hex data you parse is exactly the right shape).2. High-Level Communication FlowContinuous Polling (Internal): A background loop in FastAPI hits the IO-Link Master (192.168.7.4) every 1–2 seconds.State Management: The backend keeps the "Latest State" in memory.The WebSocket Bridge: When your browser opens, it connects to ws://localhost:8000/ws.Instant Push: Every time the background loop detects a change in the IO-Link data, it broadcasts the new JSON to all connected browsers immediately.3. Why this is "The Best" PlanFeatureFlask (Old)FastAPI (New)ConcurrencyOne request at a time.Hundreds of requests/sensors at once.Data FlowBrowser has to "Ask" (Polling).Backend "Pushes" (WebSockets).ValidationManual checks.Automatic (Pydantic models).DocumentationNone (Manual).Auto-generated Swagger UI at /docs.SpeedModerate.High (Comparable to Node.js/Go).4. Implementation Blueprint (The Code Logic)Instead of a simple "GET" request, your new backend would look like this:Pythonfrom fastapi import FastAPI, WebSocket
import asyncio
import httpx # Newer, faster version of 'requests'

app = FastAPI()
latest_data = {}

# 1. Background task to talk to the Master
async def poll_io_link_master():
    async with httpx.AsyncClient() as client:
        while True:
            # Hit your IO-Link Master IoT Port
            response = await client.get("http://192.168.7.4/get_data")
            # Logic to decode Hex -> JSON goes here
            global latest_data
            latest_data = decode_io_link(response.json()) 
            await asyncio.sleep(1) # Poll every 1 second

# 2. WebSocket endpoint for the Dashboard
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        await websocket.send_json(latest_data)
        await asyncio.sleep(1)

# Start the background task when the app launches
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(poll_io_link_master())
5. Next Level Idea: ifm "IoT-Core"Since you are using an IO-Link Master, check if it supports MQTT. Many modern masters (like ifm or Turck) can push data themselves to an MQTT Broker. This would remove the need for "Scraping" entirely and make your system even more professional.

To transition your frontend from "asking every 5 seconds" to "listening in real-time," you need a WebSocket Listener. This replaces your old setInterval and fetch logic with an event-driven model.1. The Frontend Logic (JavaScript)Instead of the browser driving the timing, the server now pushes data whenever it has it. This makes your dashboard feel much more responsive.JavaScript// Replace your 5-second fetch() with this:
const socket = new WebSocket('ws://localhost:8000/ws');

// 1. Connection opened
socket.onopen = () => {
    console.log("Connected to IO-Link Backend via WebSockets");
};

// 2. Listen for messages (the "Push" from FastAPI)
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    // Update your UI elements here
    document.getElementById('voltage-display').innerText = data.voltage + "V";
    document.getElementById('current-display').innerText = data.current + "mA";
    
    // If you use a chart library (like Chart.js), update it here
    updateChart(data.timestamp, data.voltage);
    
    // Decode LED status visually
    updateLEDStatus(data.pd_out_decoded);
};

// 3. Handle errors/disconnections
socket.onclose = () => {
    console.warn("WebSocket closed. Attempting to reconnect...");
    // Optional: Add logic here to retry connection after 5 seconds
};
2. How the Data Flows NowThe difference in efficiency is significant. You are no longer wasting network bandwidth on "empty" requests where the data hasn't changed.FeatureYour Old Plan (HTTP Polling)Your New Plan (WebSockets)Network TrafficHigh (Headers sent every 5s).Low (Keep-alive only).LatencyUp to 5 seconds.Near-zero (Instant).Browser LoadHigh (Re-running fetch logic).Low (Passive listener).User Experience"Choppy" updates.Smooth, fluid updates.3. Professional "Edge" Case: Auto-ReconnectionIn an industrial environment, the network can be noisy. If the backend restarts or a cable is bumped, you don't want the user to have to refresh the page.Pro-Tip: Use a small library like reconnecting-websocket or add a simple setTimeout in the onclose function to ensure the dashboard stays alive forever without manual intervention.4. Refining the "IoT-Core" API StrategySince you mentioned using "IoT Core API" (likely ifm or similar), your FastAPI backend should use Asynchronous HTTP (httpx) to talk to the Master. This ensures that if the Master takes 2 seconds to respond, it doesn't freeze your entire dashboard for everyone else.Your New Action Plan:Swap Flask for FastAPI: Install with pip install fastapi uvicorn httpx.Move Decoding Logic: Place your Hex-to-LED and Voltage-to-Float math into a dedicated decoder.py file in the backend.Implement the WebSocket: Use the JS snippet above in your frontend.

To decode the CL50 (Banner Engineering) or similar multi-segment LED towers, you typically deal with 3 bytes of Process Data Out ($PD_{out}$).Since you are moving to FastAPI, we can build a clean, asynchronous decoder. In this model, the backend does the "heavy lifting" so the frontend only receives simple instructions like "color": "green".1. The Python Decoder LogicThis script takes the raw hex string from your IO-Link Master and breaks it down into human-readable states.Python# decoder.py

def decode_cl50_led(hex_pdout: str):
    """
    Decodes 3 bytes of PDout for a CL50 Pro device.
    Example input: "010A00"
    """
    try:
        # Convert hex string to integer bytes
        # Byte 0: Control Mode | Byte 1: Color/Flash | Byte 2: Intensity
        b = bytes.fromhex(hex_pdout)
        
        if len(b) < 3:
            return {"status": "error", "message": "Invalid PDout length"}

        # Mapping logic (Simplified example based on standard CL50 maps)
        color_map = {
            0: "Off",
            1: "Red",
            2: "Green",
            3: "Yellow",
            4: "Blue",
            5: "Magenta",
            6: "Cyan",
            7: "White"
        }

        return {
            "mode": "Manual" if b[0] == 1 else "Auto",
            "color": color_map.get(b[1] & 0x07, "Unknown"),
            "is_flashing": bool(b[1] & 0x08),
            "intensity": f"{(b[2] / 255) * 100:.0f}%", # Convert 0-255 to %
            "raw": hex_pdout
        }
    except Exception as e:
        return {"status": "error", "details": str(e)}
2. Integrating with your FastAPI BackendNow, we plug that decoder into the Background Task we discussed. This ensures that every time your backend polls the Master, it automatically "translates" the hex before sending it to your browser.Pythonfrom fastapi import FastAPI, WebSocket
import asyncio
from decoder import decode_cl50_led

app = FastAPI()
system_state = {}

async def poll_master():
    while True:
        # 1. Get raw data from IO-Link Master (e.g., via IoT Core API)
        # raw_payload = await fetch_from_master() 
        raw_pdout = "0201FF" # Simulated: Green, 100% Intensity
        
        # 2. Decode it immediately
        decoded_led = decode_cl50_led(raw_pdout)
        
        # 3. Update global state
        global system_state
        system_state = {
            "led": decoded_led,
            "timestamp": "2026-02-13T15:18:00Z"
        }
        
        await asyncio.sleep(1) # Poll rate

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        await websocket.send_json(system_state)
        await asyncio.sleep(1)
3. Why this matters for your Supervision DataBy decoding on the backend:The Frontend is "Dumb": Your JavaScript doesn't need to know what 0x02 means. It just sees color: "Green" and changes the CSS.History is Accurate: When you store "Supervision History" (Current/Voltage) for your graphs, you are storing the calculated values, not the raw hex. This makes your SQL queries or CSV exports much more useful.4. Comparison of Data PayloadsOld way (Flask + Raw Hex):{"port1": "010A00", "port2": "00FF21"} — Browser has to figure out what this means.New way (FastAPI + Decoded):{"port1": {"color": "Red", "state": "Fault"}, "port2": {"color": "Green", "state": "Running"}} — Browser just renders the text.Final Technical Tip: The 15-second TimeoutIn your original plan, you had a 15-second timeout. With FastAPI and httpx, you should lower this significantly.Target: 2-second timeout.Why: In industrial IoT, if a device doesn't respond in 2 seconds, it’s effectively "offline." Waiting 15 seconds will just lag your entire dashboard and frustrate the user.

Since you are using an ifm IO-Link Master (like the AL13xx or AL19xx series), we should move away from web scraping entirely. ifm provides a very structured IoT Core API that uses JSON-RPC over HTTP. It is much faster and more reliable than parsing HTML.Here is the professional "Method 2" implementation using httpx (the modern, async version of requests) to get your $PD_{in}$ and $PD_{out}$ data.1. The "IoT Core" Request Structureifm masters respond to a POST request containing a JSON body. To get the data for a specific port (e.g., Port 1), you ask the master for the "data" object.2. The Python Async ImplementationThis function lives inside your FastAPI background task. It reaches out to the Master and pulls the raw hex strings for you to decode.Pythonimport httpx
import asyncio

# The IP of your ifm Master
IFM_MASTER_IP = "192.168.7.4"

async def get_ifm_port_data(port_number: int):
    """
    Fetches Process Data from an ifm IO-Link Master via IoT Core API.
    """
    url = f"http://{IFM_MASTER_IP}/"
    
    # ifm JSON-RPC payload to get Process Data (iolinkmaster/port[x]/iolinkdevice/pdin)
    payload = {
        "code": "request",
        "cid": 47,
        "adr": f"/iolinkmaster/port[{port_number}]/iolinkdevice/pdin/getdata"
    }

    async with httpx.AsyncClient() as client:
        try:
            # 2-second timeout is plenty for a local network industrial device
            response = await client.post(url, json=payload, timeout=2.0)
            response.raise_for_status()
            
            data = response.json()
            # ifm returns hex in the 'data' -> 'value' field
            return data.get("data", {}).get("value")
            
        except httpx.RequestError as exc:
            print(f"An error occurred while requesting {exc.request.url!r}.")
            return None
3. Handling Multiple Ports at OnceThe "Best Backend Plan" involves fetching all 4 or 8 ports simultaneously. Because you are using asyncio, you can fire off all requests at the exact same time rather than waiting for Port 1 to finish before asking for Port 2.Pythonasync def poll_all_ports():
    # Create a list of tasks for all 8 ports
    tasks = [get_ifm_port_data(i) for i in range(1, 9)]
    
    # Run them all in parallel!
    all_port_hex = await asyncio.gather(*tasks)
    
    # Now decode them
    results = {}
    for i, hex_str in enumerate(all_port_hex):
        if hex_str:
            results[f"port_{i+1}"] = decode_cl50_led(hex_str)
            
    return results
4. Why this is superior to Web ScrapingPrecision: You get exactly the bytes you need without 50kb of useless HTML overhead.Stability: If ifm updates their firmware and changes the look of their web-page, your scraping code will break. The IoT Core API is a standard; it won't change.Speed: A JSON-RPC call usually takes ~20ms, whereas downloading and parsing a full webpage can take 300ms–1000ms.5. Final Architecture RefinementIn your "Supervision History" (Current/Voltage), the ifm master stores these under different addresses:Voltage: /iolinkmaster/getidentity (for system voltage)Current per port: /iolinkmaster/port[x]/iolinkdevice/status