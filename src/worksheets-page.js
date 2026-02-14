/**
 * Worksheets page – IO-Link Industrial Maintenance (Matrix template style)
 * Index view (2-column large cards) + single-worksheet view (one worksheet per "page") with extra info.
 */

const WORKSHEETS = [
  {
    id: 1,
    title: 'Introduction to IO-Link',
    shortDesc: 'Components, signals, one cable.',
    estimatedTime: 'About 10 min',
    whyItMatters: 'Understanding IO-Link basics is the foundation for all maintenance tasks. It helps you see why one cable can carry data, parameters, and diagnostics instead of just on/off.',
    relatedLearn: 'Learn: Industry 4.0 & IoT',
    relatedDashboard: '',
    prerequisites: '',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">Identify IO-Link components and explain how it differs from standard I/O signals.</p>
      <p class="text-base-content/90 leading-relaxed"><strong class="text-base-content">Key components:</strong> IO-Link master, IO-Link devices (sensors/actuators), standard digital/analog I/O devices.</p>
      <p class="mt-2 font-medium text-base-content"><strong>1.</strong> How does IO-Link differ from a standard digital (on/off) sensor signal?</p>
      <textarea class="textarea textarea-bordered w-full" rows="3" placeholder="Your answer..."></textarea>
      <p class="mt-2 font-medium text-base-content"><strong>2.</strong> Name the three main components in an IO-Link system.</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>
      <p class="mt-2 font-medium text-base-content"><strong>3.</strong> IO-Link, compared to standard I/O, provides:</p>
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q3" value="a" class="radio radio-sm"> Only on/off switching</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q3" value="b" class="radio radio-sm"> Process data, parameters, and diagnostics over the same cable</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws1-q3" value="c" class="radio radio-sm"> Only analog values</label>
      </div>
      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="ws1-suggested">Show suggested answer</button>
      <div id="ws1-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">1. IO-Link sends process data, parameters, and diagnostics over a single cable; standard digital only sends on/off. 2. IO-Link master, IO-Link devices (sensors/actuators), and (optionally) standard I/O devices. 3. b – Process data, parameters, and diagnostics over the same cable.</div>
    `
  },
  {
    id: 2,
    title: 'Benefits for Maintenance',
    shortDesc: 'Match problems to IO-Link features.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'Matching IO-Link features to real maintenance problems shows how diagnostics and parameter storage reduce downtime and guesswork.',
    relatedLearn: 'Learn: Industry 4.0, Smart Sensors',
    relatedDashboard: 'Dashboard: Port status and events',
    prerequisites: 'Complete Worksheet 1 first',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">Match the maintenance problem to the IO-Link feature that helps solve it.</p>
      <div class="overflow-x-auto rounded-lg border border-base-300">
        <table class="table table-zebra">
          <thead><tr><th>Maintenance problem</th><th>IO-Link feature (choose one)</th><th>Check</th></tr></thead>
          <tbody>
            <tr>
              <td>Sensor fails without warning</td>
              <td>
                <select id="ws2-1" class="select select-bordered select-sm w-full max-w-xs">
                  <option value="">-- Select --</option>
                  <option value="events">Diagnostic events (e.g. lens dirty, wire break)</option>
                  <option value="params">Parameter storage</option>
                  <option value="process">Process data only</option>
                </select>
              </td>
              <td><span id="ws2-result-1" class="ws-check-result text-sm"></span></td>
            </tr>
            <tr>
              <td>Replacing a sensor loses configuration</td>
              <td>
                <select id="ws2-2" class="select select-bordered select-sm w-full max-w-xs">
                  <option value="">-- Select --</option>
                  <option value="events">Diagnostic events</option>
                  <option value="params">Parameter storage and automatic device replacement</option>
                  <option value="process">Process data only</option>
                </select>
              </td>
              <td><span id="ws2-result-2" class="ws-check-result text-sm"></span></td>
            </tr>
            <tr>
              <td>Unknown which sensor on the line failed</td>
              <td>
                <select id="ws2-3" class="select select-bordered select-sm w-full max-w-xs">
                  <option value="">-- Select --</option>
                  <option value="events">Device identity and event codes per port</option>
                  <option value="params">Parameter storage</option>
                  <option value="process">Process data only</option>
                </select>
              </td>
              <td><span id="ws2-result-3" class="ws-check-result text-sm"></span></td>
            </tr>
            <tr>
              <td>Planning when to replace a sensor</td>
              <td>
                <select id="ws2-4" class="select select-bordered select-sm w-full max-w-xs">
                  <option value="">-- Select --</option>
                  <option value="events">Cycle count and diagnostic trends</option>
                  <option value="params">Parameter storage</option>
                  <option value="process">Process data only</option>
                </select>
              </td>
              <td><span id="ws2-result-4" class="ws-check-result text-sm"></span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <button type="button" class="btn btn-primary btn-sm" id="ws2-check-btn">Check answers</button>
    `
  },
  {
    id: 3,
    title: 'Cabling and Connections',
    shortDesc: 'Three-wire cables and M12.',
    estimatedTime: 'About 10 min',
    whyItMatters: 'Correct wiring prevents faults and saves time. IO-Link uses the same 3-wire standard you may already know from other sensors.',
    relatedLearn: 'Learn: Smart Sensors',
    relatedDashboard: '',
    prerequisites: 'Complete Worksheet 1 first',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">IO-Link devices use standard 3-wire cables (L+, L-, C/Q) and often M12 connectors. Wiring is the same as for many standard sensors; the master and device negotiate IO-Link communication automatically.</p>
      <p class="mt-2 font-medium text-base-content"><strong>1.</strong> What is the typical number of wires in an IO-Link connection?</p>
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q1" value="2" class="radio radio-sm"> 2 wires</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q1" value="3" class="radio radio-sm"> 3 wires</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws3-q1" value="4" class="radio radio-sm"> 4 wires</label>
      </div>
      <p class="mt-2 font-medium text-base-content"><strong>2.</strong> Draw or describe the correct connection between an IO-Link master port and an IO-Link sensor (which pins/wires go where, if you know them).</p>
      <textarea class="textarea textarea-bordered w-full" rows="4" placeholder="Your answer..."></textarea>
      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="ws3-suggested">Show suggested answer</button>
      <div id="ws3-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">1. 3 wires. 2. Standard 3-wire: L+ (24 V), L- (0 V), C/Q (communication). M12: typically pin 1 = L+, 3 = L-, 4 = C/Q. Master port to device with a single cable; no separate power supply needed for the device.</div>
    `
  },
  {
    id: 4,
    title: 'Device Identification (IODD Files)',
    shortDesc: 'Vendor ID, device ID, IODD.',
    estimatedTime: 'About 10 min',
    whyItMatters: 'IODD files let tools and HMIs show the right parameters and diagnostics. Knowing where Vendor ID and Device ID live helps you commission and troubleshoot.',
    relatedLearn: 'Learn: Digital Twin, Smart Sensors',
    relatedDashboard: 'Dashboard: Active Port Details (Vendor ID, Device ID)',
    prerequisites: 'Complete Worksheets 1–3',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">IODD (IO-Device Description) files describe a device's parameters, process data, and identity. They are used by engineering tools and HMIs to configure and display the device.</p>
      <p class="mt-2 font-medium text-base-content"><strong>1.</strong> Where in an IODD would you find the device ID and vendor ID?</p>
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q1" value="a" class="radio radio-sm"> In the "DeviceIdentity" or "DeviceId" section</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q1" value="b" class="radio radio-sm"> Only in the manual</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws4-q1" value="c" class="radio radio-sm"> In the process data section only</label>
      </div>
      <div class="alert bg-primary/10 border border-primary/30 rounded-lg text-base-content">
        <strong>Do this on the Dashboard:</strong> Open the <a href="#" data-page="io-link-master" class="link link-primary">Dashboard</a>, scroll to <a href="#" data-page="io-link-master" data-scroll="portDetailsSection" class="link link-primary">Active Port Details</a>, and note the <strong>Vendor ID</strong> and <strong>Device ID</strong> for a connected device.
      </div>
    `
  },
  {
    id: 5,
    title: 'Parameter Configuration',
    shortDesc: 'Read and write parameters via master.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'Parameters control sensor behaviour (e.g. filter time, switching distance). Storing them in the master means fast, error-free replacement.',
    relatedLearn: 'Learn: Smart Sensors',
    relatedDashboard: 'Dashboard: Active Port Details (PD In / PD Out)',
    prerequisites: 'Complete Worksheets 1–4',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">Parameters (e.g. switching distance, filter time) can be read and written via the master. Many masters support storing parameters so that when a device is replaced, the new device can be configured automatically.</p>
      <p class="mt-2 font-medium text-base-content"><strong>1.</strong> Record one parameter you could set on an IO-Link sensor (from the datasheet or IODD), and what values it might have.</p>
      <textarea class="textarea textarea-bordered w-full" rows="3" placeholder="e.g. Parameter name, possible values..."></textarea>
      <div class="alert bg-primary/10 border border-primary/30 rounded-lg text-base-content">
        <strong>Do this on the Dashboard:</strong> Open the <a href="#" data-page="io-link-master" class="link link-primary">Dashboard</a> and go to <a href="#" data-page="io-link-master" data-scroll="portDetailsSection" class="link link-primary">Active Port Details</a>. Note the current <strong>process data</strong> (PD In / PD Out) for one port.
      </div>
      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="ws5-suggested">Show suggested answer</button>
      <div id="ws5-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Example: Filter time (e.g. 0–255 ms) to reduce noise; or switching distance / hysteresis. Values depend on the device type (see IODD or datasheet).</div>
    `
  },
  {
    id: 6,
    title: 'Diagnostics Overview',
    shortDesc: 'Process, service, and event data.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'Process, service, and event data are used differently. Knowing the difference helps you find the right data for maintenance decisions.',
    relatedLearn: 'Learn: Smart Sensors, Temperature, Proximity',
    relatedDashboard: 'Dashboard: Port Details, Events',
    prerequisites: 'Complete Worksheets 1–5',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">Classify each item as <strong class="text-base-content">Process data</strong>, <strong class="text-base-content">Service data</strong>, or <strong class="text-base-content">Event data</strong>.</p>
      <div class="overflow-x-auto rounded-lg border border-base-300">
        <table class="table table-zebra">
          <thead><tr><th>Data item</th><th>Your classification</th><th>Check</th></tr></thead>
          <tbody>
            <tr><td>Temperature value (e.g. 23.5 °C)</td><td><select id="ws6-1" class="select select-bordered select-sm"><option value="">-- Select --</option><option value="process">Process</option><option value="service">Service</option><option value="event">Event</option></select></td><td><span id="ws6-result-1" class="ws-check-result text-sm"></span></td></tr>
            <tr><td>Device replacement event</td><td><select id="ws6-2" class="select select-bordered select-sm"><option value="">-- Select --</option><option value="process">Process</option><option value="service">Service</option><option value="event">Event</option></select></td><td><span id="ws6-result-2" class="ws-check-result text-sm"></span></td></tr>
            <tr><td>Parameter read (e.g. filter time)</td><td><select id="ws6-3" class="select select-bordered select-sm"><option value="">-- Select --</option><option value="process">Process</option><option value="service">Service</option><option value="event">Event</option></select></td><td><span id="ws6-result-3" class="ws-check-result text-sm"></span></td></tr>
            <tr><td>Object present (on/off)</td><td><select id="ws6-4" class="select select-bordered select-sm"><option value="">-- Select --</option><option value="process">Process</option><option value="service">Service</option><option value="event">Event</option></select></td><td><span id="ws6-result-4" class="ws-check-result text-sm"></span></td></tr>
            <tr><td>Short circuit fault</td><td><select id="ws6-5" class="select select-bordered select-sm"><option value="">-- Select --</option><option value="process">Process</option><option value="service">Service</option><option value="event">Event</option></select></td><td><span id="ws6-result-5" class="ws-check-result text-sm"></span></td></tr>
          </tbody>
        </table>
      </div>
      <button type="button" class="btn btn-sm btn-primary mt-2" id="ws6-check-btn">Check answers</button>
    `
  },
  {
    id: 7,
    title: 'Troubleshooting Scenarios',
    shortDesc: 'Fault codes and maintenance actions.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'Interpreting fault codes quickly reduces MTTR. Short circuit vs lens dirty lead to different actions; IO-Link tells you which.',
    relatedLearn: 'Learn: Photo Electric, Status LED',
    relatedDashboard: 'Dashboard: Simulate Fault, Active Port Details',
    prerequisites: 'Complete Worksheets 1–6',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">Interpret fault codes and decide the correct maintenance action.</p>
      <p class="mt-2 font-medium text-base-content"><strong>1.</strong> Fault code 0x02 (Short circuit) is reported on a port. What should you do first? <span id="ws7-result-1" class="ws-check-result text-sm"></span></p>
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws7-q1" value="a" class="radio radio-sm"> Ignore it and restart the machine</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws7-q1" value="b" class="radio radio-sm"> Check wiring and device for short circuit; isolate and repair or replace</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws7-q1" value="c" class="radio radio-sm"> Only replace the master</label>
      </div>
      <p class="mt-2 font-medium text-base-content"><strong>2.</strong> Fault "Lens dirty" (or low signal quality) on a photoelectric sensor suggests: <span id="ws7-result-2" class="ws-check-result text-sm"></span></p>
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws7-q2" value="a" class="radio radio-sm"> Replace the sensor immediately</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws7-q2" value="b" class="radio radio-sm"> Clean the lens and check alignment; plan replacement if it recurs</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws7-q2" value="c" class="radio radio-sm"> Ignore it</label>
      </div>
      <button type="button" class="btn btn-primary btn-sm" id="ws7-check-btn">Check answers</button>
      <div class="alert bg-primary/10 border border-primary/30 rounded-lg text-base-content">
        <strong>Do this on the Dashboard:</strong> Use <a href="#" data-page="io-link-master" data-scroll="simulate-fault" class="link link-primary">Simulate Fault</a> to inject "Short circuit" or "Lens dirty" for a port. See how the fault appears in Active Port Details.
      </div>
    `
  },
  {
    id: 8,
    title: 'Device Replacement',
    shortDesc: 'Automatic parameter restore after replacement.',
    estimatedTime: 'About 10 min',
    whyItMatters: 'Automatic parameter restore after replacement cuts downtime and human error. You see this in practice when you clear a fault and the "new" device comes back with the same settings.',
    relatedLearn: 'Learn: Smart Sensors, Proximity',
    relatedDashboard: 'Dashboard: Simulate Fault, Clear fault',
    prerequisites: 'Complete Worksheets 1–7',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">You have replaced a faulty IO-Link sensor with a new one. How does IO-Link help?</p>
      <p class="mt-2 font-medium text-base-content"><strong>1.</strong> After replacement, the master can:</p>
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws8-q1" value="a" class="radio radio-sm"> Do nothing; you must reconfigure manually</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws8-q1" value="b" class="radio radio-sm"> Automatically restore stored parameters to the new device (if supported)</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ws8-q1" value="c" class="radio radio-sm"> Only report the new device ID</label>
      </div>
      <p class="mt-2 font-medium text-base-content"><strong>2.</strong> In one sentence, why is automatic parameter restoration useful for maintenance?</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>
      <div class="alert bg-primary/10 border border-primary/30 rounded-lg text-base-content">
        <strong>Do this on the Dashboard:</strong> Go to <a href="#" data-page="io-link-master" data-scroll="simulate-fault" class="link link-primary">Simulate Fault</a>. Set a fault for a port, then click <strong>Clear fault</strong>. This simulates "replacement" – the event list updates when the fault is cleared.
      </div>
      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="ws8-suggested">Show suggested answer</button>
      <div id="ws8-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">1. b. 2. It reduces downtime and human error – the new device works with the same settings without manual re-entry.</div>
    `
  },
  {
    id: 9,
    title: 'Maintenance Data Handling',
    shortDesc: 'Event logs and preventive planning.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'Event logs and trends turn reactive repairs into planned interventions. You use the same data the Dashboard shows for Events and diagnostics.',
    relatedLearn: 'Learn: Temperature, Proximity, Industry 4.0',
    relatedDashboard: 'Dashboard: Simulate Fault, Active Port Details, Events',
    prerequisites: 'Complete Worksheets 1–8',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">Use IO-Link event logs and diagnostics to plan preventive maintenance.</p>
      <p class="mt-2 font-medium text-base-content"><strong>1.</strong> How can event data (e.g. "Lens dirty", "Overheating") help plan maintenance?</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>
      <p class="mt-2 font-medium text-base-content"><strong>2.</strong> What is one advantage of storing cycle count or signal quality over time?</p>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="Your answer..."></textarea>
      <div class="alert bg-primary/10 border border-primary/30 rounded-lg text-base-content">
        <strong>Do this on the Dashboard:</strong> Open <a href="#" data-page="io-link-master" class="link link-primary">Dashboard</a>, go to <a href="#" data-page="io-link-master" data-scroll="simulate-fault" class="link link-primary">Simulate Fault</a> and set a fault, then open <a href="#" data-page="io-link-master" data-scroll="portDetailsSection" class="link link-primary">Active Port Details</a>. Describe what you see in the <strong>Events / faults</strong> area for that port.
      </div>
      <textarea class="textarea textarea-bordered w-full" rows="2" placeholder="What you see in Events area..."></textarea>
      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="ws9-suggested">Show suggested answer</button>
      <div id="ws9-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">1. Events indicate degradation or faults before total failure; maintenance can schedule cleaning or replacement during a break. 2. Trend data supports predictive replacement (e.g. nearing MTTF) and reduces unplanned downtime.</div>
    `
  },
  {
    id: 10,
    title: 'PLC and HMI Integration',
    shortDesc: 'Diagnostics on HMI and PLC.',
    estimatedTime: 'About 15 min',
    whyItMatters: 'Knowing how diagnostics show up in an HMI or PLC helps you design screens and alarms so maintenance gets the right information remotely.',
    relatedLearn: 'Learn: Digital Twin, Status LED',
    relatedDashboard: 'Dashboard: Port Status, Active Port Details, Simulate Fault',
    prerequisites: 'Complete Worksheets 1–9',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed font-medium"><strong>1.</strong> How does IO-Link diagnostic data typically appear in an HMI or PLC?</p>
      <textarea class="textarea textarea-bordered w-full" rows="3" placeholder="Your answer..."></textarea>
      <div class="alert bg-primary/10 border border-primary/30 rounded-lg text-base-content">
        <strong>Do this on the Dashboard:</strong> This app's <a href="#" data-page="io-link-master" class="link link-primary">Dashboard</a> is like a simple HMI. Trace where <strong>process data</strong> appears (Port Status, Active Port Details) and where <strong>events/diagnostics</strong> appear (Simulate Fault, then Events in Port Details).
      </div>
      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="ws10-suggested">Show suggested answer</button>
      <div id="ws10-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Process data is mapped to PLC inputs/outputs; diagnostic and event data can be read via the master and displayed on the HMI (e.g. alarms, maintenance messages). Remote monitoring allows technicians to see faults and plan interventions without being at the machine.</div>
    `
  },
  {
    id: 11,
    title: 'Case Study – Standard vs IO-Link Sensor',
    shortDesc: 'Compare MTTR and repair times.',
    estimatedTime: 'About 20 min',
    whyItMatters: 'Comparing MTTR for standard vs IO-Link makes the business case clear: less time to find the fault and no manual reconfiguration after replacement.',
    relatedLearn: 'Learn: Photo Electric, Proximity, Industry 4.0',
    relatedDashboard: 'Dashboard: Simulate Fault, Active Port Details',
    prerequisites: 'Complete Worksheets 1–10',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">Compare diagnosis and repair times to understand MTTR (Mean Time to Repair).</p>
      <p class="text-base-content/90 leading-relaxed"><strong class="text-base-content">Scenario:</strong> A sensor on a production line stops working. With a <strong>standard sensor</strong>: the line stops, the tech must locate the faulty sensor (e.g. 20 min), replace it and reconfigure (e.g. 15 min). With <strong>IO-Link</strong>: the HMI shows which port and which fault (e.g. wire break); the tech goes directly to the device (e.g. 5 min), replaces it, and parameters are restored automatically (e.g. 5 min).</p>
      <div class="overflow-x-auto rounded-lg border border-base-300">
        <table class="table table-zebra max-w-2xl">
          <thead><tr><th>Step</th><th>Standard (minutes)</th><th>IO-Link (minutes)</th></tr></thead>
          <tbody>
            <tr><td>Time to find fault / locate device</td><td><input type="text" class="input input-bordered input-sm w-24" placeholder="e.g. 20"></td><td><input type="text" class="input input-bordered input-sm w-24" placeholder="e.g. 5"></td></tr>
            <tr><td>Time to replace and reconfigure</td><td><input type="text" class="input input-bordered input-sm w-24" placeholder="e.g. 15"></td><td><input type="text" class="input input-bordered input-sm w-24" placeholder="e.g. 5"></td></tr>
            <tr><td>Total MTTR</td><td><input type="text" class="input input-bordered input-sm w-24" placeholder="sum"></td><td><input type="text" class="input input-bordered input-sm w-24" placeholder="sum"></td></tr>
          </tbody>
        </table>
      </div>
      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="ws11-suggested">Show suggested answer</button>
      <div id="ws11-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Example: Standard 20+15 = 35 min; IO-Link 5+5 = 10 min. IO-Link reduces MTTR by faster fault location and automatic parameter restore.</div>
    `
  },
  {
    id: 12,
    title: 'Final Practical Assessment',
    shortDesc: 'Checklist: wire, configure, fault, replace.',
    estimatedTime: 'About 30 min',
    whyItMatters: 'This checklist ties everything together: wiring, parameters, fault interpretation, and replacement. Use it as a final check before moving to real equipment.',
    relatedLearn: 'Learn: all chapters',
    relatedDashboard: 'Dashboard: Simulate Fault, Active Port Details',
    prerequisites: 'Complete Worksheets 1–11',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">Checklist: complete these tasks (in the lab or on the Dashboard where indicated).</p>
      <div class="space-y-3">
        <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm"> Wire (or describe) an IO-Link device correctly (3-wire / M12).</label>
        <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm"> Configure (or describe) one parameter you would set on a sensor.</label>
        <p class="mt-1 text-base-content/90">What did you set? <textarea class="textarea textarea-bordered textarea-sm mt-1 w-full" rows="1" placeholder="Your answer..."></textarea></p>
        <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm"> Trigger a fault (e.g. Simulate Fault on the Dashboard) and interpret the fault code.</label>
        <p class="mt-1 text-base-content/90">Fault code and your interpretation: <textarea class="textarea textarea-bordered textarea-sm mt-1 w-full" rows="1" placeholder="e.g. 0x02 Short circuit – check wiring"></textarea></p>
        <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" class="checkbox checkbox-sm"> Simulate replacing the device (Clear fault on Dashboard) and verify the event list updates.</label>
      </div>
      <div class="alert bg-primary/10 border border-primary/30 rounded-lg text-base-content">
        <strong>Do this on the Dashboard:</strong> Use <a href="#" data-page="io-link-master" data-scroll="simulate-fault" class="link link-primary">Simulate Fault</a> to set then clear a fault; check <a href="#" data-page="io-link-master" data-scroll="portDetailsSection" class="link link-primary">Active Port Details</a> to see Events and decoded process data.
      </div>
      <div class="divider my-2"></div>
      <button type="button" class="btn btn-ghost btn-sm ws-suggested-btn" data-target="ws12-suggested">Show suggested answers</button>
      <div id="ws12-suggested" class="hidden p-4 rounded-lg border border-base-300 bg-base-300/50 text-base-content/80 text-sm leading-relaxed ws-suggested">Answers depend on your lab setup. For the Dashboard: Simulate Fault shows events in the port card (e.g. "0x02 Short circuit"); clearing the fault removes the event. Decoded process data (temperature, object present, etc.) appears in the same card when the device type is recognized.</div>
    `
  }
];

function buildIndexHtml() {
  const cards = WORKSHEETS.map(function (ws, i) {
    const isEven = i % 2 === 0;
    const borderClass = isEven ? 'border-primary/30 hover:border-primary' : 'border-secondary/30 hover:border-secondary';
    const badgeClass = isEven ? 'badge-primary' : 'badge-secondary';
    const desc = ws.shortDesc || '';
    return `
      <button type="button" class="ws-index-link w-full text-left rounded-2xl border-2 bg-base-200/95 shadow-lg hover:shadow-xl transition-all duration-200 p-6 min-h-[140px] flex flex-col justify-center ${borderClass}" data-worksheet-index="${ws.id}">
        <span class="badge ${badgeClass} badge-sm w-fit mb-2">${ws.id}</span>
        <h3 class="font-bold text-lg text-base-content leading-tight">${ws.title}</h3>
        <p class="text-sm text-base-content/70 mt-1">${desc}</p>
      </button>
    `;
  }).join('');
  return `
    <div class="worksheets-index max-w-5xl mx-auto space-y-6 relative min-h-full py-2 rounded-2xl" style="background: linear-gradient(160deg, hsl(var(--b2)) 0%, hsl(var(--b3)) 40%, hsl(var(--p) / 0.06) 100%);">
      <div class="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 100 100" fill="none" class="text-primary"><path d="M20 20h60v60H20V20z" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M30 35h40M30 50h40M30 65h25" stroke="currentColor" stroke-width="1"/></svg>
      </div>
      <header class="relative rounded-2xl bg-gradient-to-r from-primary/20 via-secondary/15 to-accent/20 border-2 border-primary/30 px-6 py-6 shadow-xl">
        <div class="flex items-start gap-4 flex-wrap">
          <div class="rounded-xl bg-primary/25 p-3 border border-primary/40">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-base-content tracking-tight">Worksheets: IO-Link in Industrial Maintenance</h1>
            <p class="mt-2 text-base-content/80 text-lg leading-relaxed">12 practical worksheets. Use the Dashboard to complete tasks where indicated.</p>
          </div>
        </div>
      </header>
      <div class="relative grid grid-cols-1 sm:grid-cols-2 gap-5">
        ${cards}
      </div>
      <footer class="relative pt-4 border-t-2 border-base-300 flex flex-wrap gap-2 items-center justify-between">
        <a href="#" data-page="io-link-master" class="btn btn-outline btn-sm gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Dashboard
        </a>
        <button type="button" class="btn btn-ghost btn-sm gap-2 ws-print-btn"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5M7 9V3m5 4v10m0 0v4m0-4h4" /></svg>Print</button>
      </footer>
    </div>
  `;
}

function buildExtraInfoHtml(ws) {
  let html = '<div class="rounded-xl border-2 border-primary/25 bg-gradient-to-r from-primary/10 to-secondary/10 p-4 mb-6 space-y-2 text-sm shadow-md">';
  html += '<p class="text-base-content/80"><strong class="text-base-content">Estimated time:</strong> ' + (ws.estimatedTime || '–') + '</p>';
  html += '<p class="text-base-content/80"><strong class="text-base-content">Why this matters:</strong> ' + (ws.whyItMatters || '–') + '</p>';
  if (ws.relatedLearn || ws.relatedDashboard) {
    html += '<p class="text-base-content/80"><strong class="text-base-content">Related:</strong> ';
    if (ws.relatedLearn) html += ws.relatedLearn;
    if (ws.relatedLearn && ws.relatedDashboard) html += '. ';
    if (ws.relatedDashboard) html += ws.relatedDashboard;
    html += '</p>';
  }
  if (ws.prerequisites) {
    html += '<p class="text-base-content/80"><strong class="text-base-content">Prerequisites:</strong> ' + ws.prerequisites + '</p>';
  }
  html += '</div>';
  return html;
}

function buildWorksheetViewHtml(worksheetIndex) {
  const ws = WORKSHEETS[worksheetIndex - 1];
  if (!ws) return buildIndexHtml();
  const prevNum = worksheetIndex === 1 ? 12 : worksheetIndex - 1;
  const nextNum = worksheetIndex === 12 ? 1 : worksheetIndex + 1;
  return `
    <div class="max-w-4xl mx-auto space-y-6 relative min-h-full py-2 rounded-2xl" style="background: linear-gradient(160deg, hsl(var(--b2)) 0%, hsl(var(--b3)) 45%, hsl(var(--s) / 0.06) 100%);">
      <div class="absolute top-0 right-0 w-32 h-32 opacity-15 pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 100 100" fill="none" class="text-accent"><circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="2"/></svg>
      </div>
      <nav class="relative flex items-center justify-between gap-2 flex-wrap pb-4 border-b-2 border-primary/20 bg-base-200/50 rounded-lg px-3 py-2">
        <div class="flex items-center gap-2 flex-wrap">
          <button type="button" class="btn btn-outline btn-sm gap-2 ws-back-btn border-primary/40">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Worksheets
          </button>
          <button type="button" class="btn btn-ghost btn-sm ws-prev-btn">Previous (${prevNum})</button>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="btn btn-primary btn-sm ws-next-btn">Next (${nextNum})</button>
          <button type="button" class="btn btn-ghost btn-sm ws-print-btn">Print</button>
        </div>
      </nav>
      <div class="relative card bg-base-200 shadow-xl border-2 border-primary/20 rounded-2xl overflow-hidden">
        <div class="card-body gap-4">
          ${buildExtraInfoHtml(ws)}
          <h2 class="card-title text-xl text-base-content border-b-2 border-primary/30 pb-2 gap-2">
            <span class="badge badge-primary badge-lg">${ws.id}</span>
            ${ws.title}
          </h2>
          ${ws.contentHtml}
        </div>
      </div>
      <footer class="relative pt-4 border-t-2 border-base-300 flex flex-wrap gap-2">
        <a href="#" data-page="io-link-master" class="btn btn-outline btn-sm gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Dashboard
        </a>
      </footer>
    </div>
  `;
}

let currentWorksheetIndex = 0;

function showIndex() {
  currentWorksheetIndex = 0;
  const root = document.getElementById('worksheets-root');
  if (!root) return;
  root.innerHTML = buildIndexHtml();
}

function showWorksheet(n) {
  if (n < 1 || n > 12) return;
  currentWorksheetIndex = n;
  const root = document.getElementById('worksheets-root');
  if (!root) return;
  root.innerHTML = buildWorksheetViewHtml(n);
  initWorksheetInteractivity(root);
}

function initWorksheetInteractivity(container) {
  if (!container) container = document.getElementById('worksheets-root');
  if (!container) return;
  container.querySelectorAll('.ws-suggested-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = btn.getAttribute('data-target');
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden');
    });
  });
  const ws2Correct = { 'ws2-1': 'events', 'ws2-2': 'params', 'ws2-3': 'events', 'ws2-4': 'events' };
  const ws2Btn = container.querySelector('#ws2-check-btn');
  if (ws2Btn) {
    ws2Btn.addEventListener('click', function () {
      for (let i = 1; i <= 4; i++) {
        const sel = container.querySelector('#ws2-' + i);
        const res = container.querySelector('#ws2-result-' + i);
        if (!sel || !res) continue;
        const val = (sel.value || '').trim();
        const correct = ws2Correct['ws2-' + i];
        res.textContent = val ? (val === correct ? 'Correct' : 'Incorrect') : '';
        res.className = 'ws-check-result text-sm ' + (val === correct ? 'text-success' : (val ? 'text-error' : ''));
      }
    });
  }
  const ws6Correct = { 'ws6-1': 'process', 'ws6-2': 'event', 'ws6-3': 'service', 'ws6-4': 'process', 'ws6-5': 'event' };
  const ws6Btn = container.querySelector('#ws6-check-btn');
  if (ws6Btn) {
    ws6Btn.addEventListener('click', function () {
      for (let i = 1; i <= 5; i++) {
        const sel = container.querySelector('#ws6-' + i);
        const res = container.querySelector('#ws6-result-' + i);
        if (!sel || !res) continue;
        const val = (sel.value || '').trim();
        const correct = ws6Correct['ws6-' + i];
        res.textContent = val ? (val === correct ? 'Correct' : 'Incorrect') : '';
        res.className = 'ws-check-result text-sm ' + (val === correct ? 'text-success' : (val ? 'text-error' : ''));
      }
    });
  }
  const ws7Btn = container.querySelector('#ws7-check-btn');
  if (ws7Btn) {
    ws7Btn.addEventListener('click', function () {
      const q1 = container.querySelector('input[name="ws7-q1"]:checked');
      const q2 = container.querySelector('input[name="ws7-q2"]:checked');
      const r1 = container.querySelector('#ws7-result-1');
      const r2 = container.querySelector('#ws7-result-2');
      if (r1) {
        r1.textContent = q1 ? (q1.value === 'b' ? 'Correct' : 'Incorrect') : '';
        r1.className = 'ws-check-result text-sm ' + (q1 && q1.value === 'b' ? 'text-success' : (q1 ? 'text-error' : ''));
      }
      if (r2) {
        r2.textContent = q2 ? (q2.value === 'b' ? 'Correct' : 'Incorrect') : '';
        r2.className = 'ws-check-result text-sm ' + (q2 && q2.value === 'b' ? 'text-success' : (q2 ? 'text-error' : ''));
      }
    });
  }
}

export function renderWorksheetsPage() {
  return '<div id="worksheets-root" class="worksheets-root">' + buildIndexHtml() + '</div>';
}

export function initWorksheetsPage() {
  const root = document.getElementById('worksheets-root');
  if (!root) return;

  root.addEventListener('click', function (e) {
    const backBtn = e.target.closest('.ws-back-btn');
    if (backBtn) {
      e.preventDefault();
      showIndex();
      return;
    }
    const prevBtn = e.target.closest('.ws-prev-btn');
    if (prevBtn) {
      e.preventDefault();
      const n = currentWorksheetIndex === 1 ? 12 : currentWorksheetIndex - 1;
      showWorksheet(n);
      return;
    }
    const nextBtn = e.target.closest('.ws-next-btn');
    if (nextBtn) {
      e.preventDefault();
      const n = currentWorksheetIndex === 12 ? 1 : currentWorksheetIndex + 1;
      showWorksheet(n);
      return;
    }
    const indexLink = e.target.closest('.ws-index-link');
    if (indexLink) {
      e.preventDefault();
      const n = parseInt(indexLink.getAttribute('data-worksheet-index'), 10);
      if (!isNaN(n) && n >= 1 && n <= 12) showWorksheet(n);
      return;
    }
    const printBtn = e.target.closest('.ws-print-btn');
    if (printBtn) {
      e.preventDefault();
      window.print();
      return;
    }
  });

  initWorksheetInteractivity(root);
}
