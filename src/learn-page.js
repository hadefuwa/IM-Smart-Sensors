/**
 * Learn page – Smart Sensors, Industry 4.0 & IoT (Matrix template style)
 */
export function renderLearnPage() {
  return `
    <div class="space-y-4">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Learn: Smart Sensors, Industry 4.0 &amp; IoT</h1>
        <p class="text-base-content/70 mt-1">Why IO-Link and smart sensors matter for industrial maintenance.</p>
      </div>

      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">Industry 4.0 &amp; IoT</h2>
          <p class="text-base-content/80">Industry 4.0 means connecting machines and sensors to data networks so you can monitor, analyze, and act on real-time information. IoT (Internet of Things) in the factory is about sensors and devices that send data—temperature, presence, counts, faults—so maintenance and production can react before something fails.</p>
          <p class="text-base-content/80">For maintenance, this means: less guessing, more data. Instead of replacing parts on a fixed schedule or only after a breakdown, you can use sensor data (current, voltage, event flags, cycle counts) to plan repairs and spot problems early.</p>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">Smart Sensors &amp; IO-Link</h2>
          <p class="text-base-content/80">A <strong>smart sensor</strong> does more than switch on or off. It can report its identity (vendor, device ID, serial), process data (measured values), and diagnostics (events, supervision). IO-Link is a standard way to connect these sensors to a master (and then to a PLC or your dashboard) over a single cable. The master reads process data (PDin), sends commands (PDout), and can read parameters and events.</p>
          <p class="text-base-content/80">In this app, the dashboard shows the same kind of data a technician would see in tools like ifm LineRecorder or Moneo: port status, process data, supervision (current, voltage, temperature), and decoded values. Learning to read this data is the first step toward condition-based and predictive maintenance.</p>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">Digital Twin</h2>
          <p class="text-base-content/80">The JSON data you see from the FastAPI backend—port status, decoded PDin/PDout, supervision, events—is the foundation of a <strong>Digital Twin</strong>. A Digital Twin is a digital representation of a physical device. Here, the "twin" is the live state of your IO-Link master and its sensors: what each port reports, what each sensor measures, and any faults or events.</p>
          <p class="text-base-content/80">In Industry 4.0, this digital representation is used for condition monitoring (is the sensor healthy?), predictive maintenance (when might it fail?), and training—exactly what this app is for. When you look at the dashboard, you are looking at the digital twin of your IO-Link setup.</p>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">Status LED / Light Stack</h2>
          <p class="text-base-content/80">Status lights (e.g. CL50-style LED stacks) show machine or line state: green = running, red = fault, yellow = warning, and so on. They are often driven by the PLC via IO-Link (PDout): the master sends bytes that define color, intensity, and animation. In maintenance, you check that the correct state is displayed and that supervision (current/voltage) is within spec.</p>
          <h3 class="text-lg font-semibold text-base-content mt-4">Before vs. After</h3>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead><tr><th>Traditional</th><th>IO-Link</th></tr></thead>
              <tbody>
                <tr><td class="text-base-content/70 italic">Operator sees a red light; tech hunts for which device or station caused it.</td><td>Event or status is reported by the master; dashboard shows which port/device and what event (e.g. short circuit).</td></tr>
                <tr><td class="text-base-content/70 italic">Lights are "dumb"; no remote visibility of state.</td><td>State is data: you can log it, trend it, and use it for diagnostics and training.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">Photo Electric Sensor</h2>
          <p class="text-base-content/80">Photoelectric sensors detect objects (or light/dark) using a light beam. PDin typically includes "object detected" (on/off) and often a signal quality or intensity (0–100%). Maintenance focus: keep the lens clean, check alignment, and watch signal quality; a drop often means cleaning or adjustment before the sensor fails.</p>
          <h3 class="text-lg font-semibold text-base-content mt-4">Before vs. After</h3>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead><tr><th>Traditional</th><th>IO-Link</th></tr></thead>
              <tbody>
                <tr><td class="text-base-content/70 italic">Sensor fails → machine stops → tech spends 20 minutes finding the failed unit.</td><td>Sensor sends "lens dirty" or low signal quality → tech cleans during a scheduled break → zero unplanned downtime.</td></tr>
                <tr><td class="text-base-content/70 italic">No visibility into why a sensor stopped working.</td><td>Diagnostics and signal quality show degradation before total failure.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">Temperature Sensor</h2>
          <p class="text-base-content/80">IO-Link temperature sensors report temperature (e.g. in °C) as process data (often 2 bytes, sometimes 0.1 °C resolution). Used for process control and for monitoring motor or cabinet temperature. In maintenance: check calibration, placement, and supervision; use trends to spot overheating or cooling issues.</p>
          <h3 class="text-lg font-semibold text-base-content mt-4">Before vs. After</h3>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead><tr><th>Traditional</th><th>IO-Link</th></tr></thead>
              <tbody>
                <tr><td class="text-base-content/70 italic">Periodic manual checks with a handheld thermometer; no history.</td><td>Live temperature on the dashboard; trend over time supports condition monitoring and alarms.</td></tr>
                <tr><td class="text-base-content/70 italic">Alarms only when a limit is exceeded at the PLC.</td><td>Full temperature data available for logging, analysis, and training without touching the sensor.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">Proximity Sensor</h2>
          <p class="text-base-content/80">Proximity sensors (inductive or capacitive) detect the presence (and sometimes distance) of metal or other materials. PDin is often 1 byte (present/absent) or 2 bytes (distance in mm). Maintenance: check mounting distance, contamination, and wiring; use event flags (e.g. wire break) and supervision to plan replacement (e.g. MTTF and cycle count).</p>
          <h3 class="text-lg font-semibold text-base-content mt-4">Before vs. After</h3>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead><tr><th>Traditional</th><th>IO-Link</th></tr></thead>
              <tbody>
                <tr><td class="text-base-content/70 italic">Trial and error to set switching distance; no diagnostics.</td><td>Distance and signal quality data; events (e.g. short circuit) point to the exact issue.</td></tr>
                <tr><td class="text-base-content/70 italic">Replace on a fixed schedule or after failure.</td><td>Cycle count and diagnostics support "replace when needed" and MTTF-based planning.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p class="text-base-content/60"><a href="#" data-page="io-link-master" class="link link-primary">Back to Dashboard</a></p>
    </div>
  `;
}
