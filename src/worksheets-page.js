/**
 * Worksheets page – IO-Link Industrial Maintenance (Matrix template style)
 * Same content as frontend/worksheets.html but with DaisyUI/Tailwind.
 */
export function renderWorksheetsPage() {
  return `
    <div class="space-y-4">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Worksheets: IO-Link in Industrial Maintenance</h1>
        <p class="text-base-content/70 mt-1">Learning objectives and 12 practical worksheets. Use the Dashboard to complete tasks where indicated.</p>
      </div>

      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">Learning Objectives</h2>
          <ol class="list-decimal list-inside space-y-2 text-base-content/80">
            <li><strong>Understand IO-Link Fundamentals</strong> – Explain what IO-Link is and how it differs from standard digital/analog signals. Identify key components: IO-Link master, IO-Link devices, standard sensors/actuators.</li>
            <li><strong>Recognize Maintenance Benefits</strong> – Describe how IO-Link enables predictive and preventive maintenance. Understand diagnostic data (e.g., cable break, sensor contamination, temperature warnings).</li>
            <li><strong>Setup and Wiring</strong> – Demonstrate correct wiring of an IO-Link device using standard 3-wire cables. Differentiate between IO-Link, standard I/O, and fieldbus connections.</li>
            <li><strong>Commissioning and Configuration</strong> – Use IO-Device Description files (IODDs) to identify and configure devices. Explain the role of parameter storage and automatic device replacement.</li>
            <li><strong>Fault Finding and Troubleshooting</strong> – Access diagnostic information from an IO-Link device via an HMI or engineering software. Interpret diagnostic codes to identify common faults (cable damage, wrong configuration, device failure). Practice replacing a faulty sensor and restoring parameters automatically.</li>
            <li><strong>Data Handling for Maintenance</strong> – Explain the difference between process data, service data, and event data. Show how maintenance teams can use this data to plan interventions.</li>
            <li><strong>Integration with PLCs / SCADA</strong> – Demonstrate how IO-Link diagnostic data appears in PLC/HMI systems. Explain the value of remote monitoring in reducing downtime.</li>
            <li><strong>Practical Applications in Maintenance</strong> – Replace and configure an IO-Link sensor in a simulated industrial system. Use IO-Link diagnostics to reduce MTTR (Mean Time to Repair). Compare maintenance tasks on a standard sensor vs. an IO-Link sensor.</li>
          </ol>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">Worksheet Index</h2>
          <p class="text-base-content/70 mb-3">Jump to a worksheet:</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <a href="#worksheet-1" class="block p-2 rounded bg-base-300 text-base-content/80 hover:bg-base-content/10">1. Introduction to IO-Link</a>
            <a href="#worksheet-2" class="block p-2 rounded bg-base-300 text-base-content/80 hover:bg-base-content/10">2. Benefits for Maintenance</a>
            <a href="#worksheet-3" class="block p-2 rounded bg-base-300 text-base-content/80 hover:bg-base-content/10">3. Cabling and Connections</a>
            <a href="#worksheet-4" class="block p-2 rounded bg-base-300 text-base-content/80 hover:bg-base-content/10">4. Device Identification (IODD)</a>
            <a href="#worksheet-5" class="block p-2 rounded bg-base-300 text-base-content/80 hover:bg-base-content/10">5. Parameter Configuration</a>
            <a href="#worksheet-6" class="block p-2 rounded bg-base-300 text-base-content/80 hover:bg-base-content/10">6. Diagnostics Overview</a>
            <a href="#worksheet-7" class="block p-2 rounded bg-base-300 text-base-content/80 hover:bg-base-content/10">7. Troubleshooting Scenarios</a>
            <a href="#worksheet-8" class="block p-2 rounded bg-base-300 text-base-content/80 hover:bg-base-content/10">8. Device Replacement</a>
            <a href="#worksheet-9" class="block p-2 rounded bg-base-300 text-base-content/80 hover:bg-base-content/10">9. Maintenance Data Handling</a>
            <a href="#worksheet-10" class="block p-2 rounded bg-base-300 text-base-content/80 hover:bg-base-content/10">10. PLC and HMI Integration</a>
            <a href="#worksheet-11" class="block p-2 rounded bg-base-300 text-base-content/80 hover:bg-base-content/10">11. Case Study – Standard vs IO-Link</a>
            <a href="#worksheet-12" class="block p-2 rounded bg-base-300 text-base-content/80 hover:bg-base-content/10">12. Final Practical Assessment</a>
          </div>
          <div class="mt-3"><button type="button" class="btn btn-sm btn-ghost" onclick="window.print();">Print worksheets</button></div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl" id="worksheet-1">
        <div class="card-body">
          <h2 class="card-title text-base-content">Worksheet 1: Introduction to IO-Link</h2>
          <p class="text-base-content/80">Identify IO-Link components and explain how it differs from standard I/O signals.</p>
          <p class="text-base-content/80"><strong>Key components:</strong> IO-Link master, IO-Link devices (sensors/actuators), standard digital/analog I/O devices.</p>
          <p class="mt-2"><strong>1.</strong> How does IO-Link differ from a standard digital (on/off) sensor signal?</p>
          <textarea class="textarea textarea-bordered w-full mb-3" rows="3" placeholder="Your answer..."></textarea>
          <p class="mt-2"><strong>2.</strong> Name the three main components in an IO-Link system.</p>
          <textarea class="textarea textarea-bordered w-full mb-3" rows="2" placeholder="Your answer..."></textarea>
          <p class="mt-2"><strong>3.</strong> IO-Link, compared to standard I/O, provides:</p>
          <div class="space-y-1 mb-3">
            <label class="flex items-center gap-2"><input type="radio" name="ws1-q3" value="a" class="radio radio-sm"> Only on/off switching</label>
            <label class="flex items-center gap-2"><input type="radio" name="ws1-q3" value="b" class="radio radio-sm"> Process data, parameters, and diagnostics over the same cable</label>
            <label class="flex items-center gap-2"><input type="radio" name="ws1-q3" value="c" class="radio radio-sm"> Only analog values</label>
          </div>
          <button type="button" class="btn btn-sm btn-ghost mb-2 ws-suggested-btn" data-target="ws1-suggested">Show suggested answer</button>
          <div id="ws1-suggested" class="hidden mt-2 p-3 rounded-lg bg-base-300 text-base-content/70 text-sm ws-suggested">1. IO-Link sends process data, parameters, and diagnostics over a single cable; standard digital only sends on/off. 2. IO-Link master, IO-Link devices (sensors/actuators), and (optionally) standard I/O devices. 3. b – Process data, parameters, and diagnostics over the same cable.</div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl" id="worksheet-2">
        <div class="card-body">
          <h2 class="card-title text-base-content">Worksheet 2: Benefits for Maintenance</h2>
          <p class="text-base-content/80">Match the maintenance problem to the IO-Link feature that helps solve it.</p>
          <div class="overflow-x-auto">
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
          <button type="button" class="btn btn-sm btn-primary mt-2" id="ws2-check-btn">Check answers</button>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl" id="worksheet-3">
        <div class="card-body">
          <h2 class="card-title text-base-content">Worksheet 3: Cabling and Connections</h2>
          <p class="text-base-content/80">IO-Link devices use standard 3-wire cables (L+, L-, C/Q) and often M12 connectors. Wiring is the same as for many standard sensors; the master and device negotiate IO-Link communication automatically.</p>
          <p class="mt-2"><strong>1.</strong> What is the typical number of wires in an IO-Link connection?</p>
          <div class="space-y-1 mb-3">
            <label class="flex items-center gap-2"><input type="radio" name="ws3-q1" value="2" class="radio radio-sm"> 2 wires</label>
            <label class="flex items-center gap-2"><input type="radio" name="ws3-q1" value="3" class="radio radio-sm"> 3 wires</label>
            <label class="flex items-center gap-2"><input type="radio" name="ws3-q1" value="4" class="radio radio-sm"> 4 wires</label>
          </div>
          <p class="mt-2"><strong>2.</strong> Draw or describe the correct connection between an IO-Link master port and an IO-Link sensor (which pins/wires go where, if you know them).</p>
          <textarea class="textarea textarea-bordered w-full mb-3" rows="4" placeholder="Your answer..."></textarea>
          <button type="button" class="btn btn-sm btn-ghost mb-2 ws-suggested-btn" data-target="ws3-suggested">Show suggested answer</button>
          <div id="ws3-suggested" class="hidden mt-2 p-3 rounded-lg bg-base-300 text-base-content/70 text-sm ws-suggested">1. 3 wires. 2. Standard 3-wire: L+ (24 V), L- (0 V), C/Q (communication). M12: typically pin 1 = L+, 3 = L-, 4 = C/Q. Master port to device with a single cable; no separate power supply needed for the device.</div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl" id="worksheet-4">
        <div class="card-body">
          <h2 class="card-title text-base-content">Worksheet 4: Device Identification (IODD Files)</h2>
          <p class="text-base-content/80">IODD (IO-Device Description) files describe a device's parameters, process data, and identity. They are used by engineering tools and HMIs to configure and display the device.</p>
          <p class="mt-2"><strong>1.</strong> Where in an IODD would you find the device ID and vendor ID?</p>
          <div class="space-y-1 mb-3">
            <label class="flex items-center gap-2"><input type="radio" name="ws4-q1" value="a" class="radio radio-sm"> In the "DeviceIdentity" or "DeviceId" section</label>
            <label class="flex items-center gap-2"><input type="radio" name="ws4-q1" value="b" class="radio radio-sm"> Only in the manual</label>
            <label class="flex items-center gap-2"><input type="radio" name="ws4-q1" value="c" class="radio radio-sm"> In the process data section only</label>
          </div>
          <div class="alert bg-primary/10 border-l-4 border-primary text-base-content">
            <strong>Do this on the Dashboard:</strong> Open the <a href="#" data-page="io-link-master" class="link link-primary">Dashboard</a>, scroll to <a href="#" data-page="io-link-master" data-scroll="portDetailsSection" class="link link-primary">Active Port Details</a>, and note the <strong>Vendor ID</strong> and <strong>Device ID</strong> for a connected device.
          </div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl" id="worksheet-5">
        <div class="card-body">
          <h2 class="card-title text-base-content">Worksheet 5: Parameter Configuration</h2>
          <p class="text-base-content/80">Parameters (e.g. switching distance, filter time) can be read and written via the master. Many masters support storing parameters so that when a device is replaced, the new device can be configured automatically.</p>
          <p class="mt-2"><strong>1.</strong> Record one parameter you could set on an IO-Link sensor (from the datasheet or IODD), and what values it might have.</p>
          <textarea class="textarea textarea-bordered w-full mb-3" rows="3" placeholder="e.g. Parameter name, possible values..."></textarea>
          <div class="alert bg-primary/10 border-l-4 border-primary text-base-content mb-3">
            <strong>Do this on the Dashboard:</strong> Open the <a href="#" data-page="io-link-master" class="link link-primary">Dashboard</a> and go to <a href="#" data-page="io-link-master" data-scroll="portDetailsSection" class="link link-primary">Active Port Details</a>. Note the current <strong>process data</strong> (PD In / PD Out) for one port.
          </div>
          <button type="button" class="btn btn-sm btn-ghost mb-2 ws-suggested-btn" data-target="ws5-suggested">Show suggested answer</button>
          <div id="ws5-suggested" class="hidden mt-2 p-3 rounded-lg bg-base-300 text-base-content/70 text-sm ws-suggested">Example: Filter time (e.g. 0–255 ms) to reduce noise; or switching distance / hysteresis. Values depend on the device type (see IODD or datasheet).</div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl" id="worksheet-6">
        <div class="card-body">
          <h2 class="card-title text-base-content">Worksheet 6: Diagnostics Overview</h2>
          <p class="text-base-content/80">Classify each item as <strong>Process data</strong>, <strong>Service data</strong>, or <strong>Event data</strong>.</p>
          <div class="overflow-x-auto">
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
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl" id="worksheet-7">
        <div class="card-body">
          <h2 class="card-title text-base-content">Worksheet 7: Troubleshooting Scenarios</h2>
          <p class="text-base-content/80">Interpret fault codes and decide the correct maintenance action.</p>
          <p class="mt-2"><strong>1.</strong> Fault code 0x02 (Short circuit) is reported on a port. What should you do first? <span id="ws7-result-1" class="ws-check-result text-sm"></span></p>
          <div class="space-y-1 mb-3">
            <label class="flex items-center gap-2"><input type="radio" name="ws7-q1" value="a" class="radio radio-sm"> Ignore it and restart the machine</label>
            <label class="flex items-center gap-2"><input type="radio" name="ws7-q1" value="b" class="radio radio-sm"> Check wiring and device for short circuit; isolate and repair or replace</label>
            <label class="flex items-center gap-2"><input type="radio" name="ws7-q1" value="c" class="radio radio-sm"> Only replace the master</label>
          </div>
          <p class="mt-2"><strong>2.</strong> Fault "Lens dirty" (or low signal quality) on a photoelectric sensor suggests: <span id="ws7-result-2" class="ws-check-result text-sm"></span></p>
          <div class="space-y-1 mb-3">
            <label class="flex items-center gap-2"><input type="radio" name="ws7-q2" value="a" class="radio radio-sm"> Replace the sensor immediately</label>
            <label class="flex items-center gap-2"><input type="radio" name="ws7-q2" value="b" class="radio radio-sm"> Clean the lens and check alignment; plan replacement if it recurs</label>
            <label class="flex items-center gap-2"><input type="radio" name="ws7-q2" value="c" class="radio radio-sm"> Ignore it</label>
          </div>
          <button type="button" class="btn btn-sm btn-primary mb-2" id="ws7-check-btn">Check answers</button>
          <div class="alert bg-primary/10 border-l-4 border-primary text-base-content mt-3">
            <strong>Do this on the Dashboard:</strong> Use <a href="#" data-page="io-link-master" data-scroll="simulate-fault" class="link link-primary">Simulate Fault</a> to inject "Short circuit" or "Lens dirty" for a port. See how the fault appears in Active Port Details.
          </div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl" id="worksheet-8">
        <div class="card-body">
          <h2 class="card-title text-base-content">Worksheet 8: Device Replacement</h2>
          <p class="text-base-content/80">You have replaced a faulty IO-Link sensor with a new one. How does IO-Link help?</p>
          <p class="mt-2"><strong>1.</strong> After replacement, the master can:</p>
          <div class="space-y-1 mb-3">
            <label class="flex items-center gap-2"><input type="radio" name="ws8-q1" value="a" class="radio radio-sm"> Do nothing; you must reconfigure manually</label>
            <label class="flex items-center gap-2"><input type="radio" name="ws8-q1" value="b" class="radio radio-sm"> Automatically restore stored parameters to the new device (if supported)</label>
            <label class="flex items-center gap-2"><input type="radio" name="ws8-q1" value="c" class="radio radio-sm"> Only report the new device ID</label>
          </div>
          <p class="mt-2"><strong>2.</strong> In one sentence, why is automatic parameter restoration useful for maintenance?</p>
          <textarea class="textarea textarea-bordered w-full mb-3" rows="2" placeholder="Your answer..."></textarea>
          <div class="alert bg-primary/10 border-l-4 border-primary text-base-content mb-3">
            <strong>Do this on the Dashboard:</strong> Go to <a href="#" data-page="io-link-master" data-scroll="simulate-fault" class="link link-primary">Simulate Fault</a>. Set a fault for a port, then click <strong>Clear fault</strong>. This simulates "replacement" – the event list updates when the fault is cleared.
          </div>
          <button type="button" class="btn btn-sm btn-ghost mb-2 ws-suggested-btn" data-target="ws8-suggested">Show suggested answer</button>
          <div id="ws8-suggested" class="hidden mt-2 p-3 rounded-lg bg-base-300 text-base-content/70 text-sm ws-suggested">1. b. 2. It reduces downtime and human error – the new device works with the same settings without manual re-entry.</div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl" id="worksheet-9">
        <div class="card-body">
          <h2 class="card-title text-base-content">Worksheet 9: Maintenance Data Handling</h2>
          <p class="text-base-content/80">Use IO-Link event logs and diagnostics to plan preventive maintenance.</p>
          <p class="mt-2"><strong>1.</strong> How can event data (e.g. "Lens dirty", "Overheating") help plan maintenance?</p>
          <textarea class="textarea textarea-bordered w-full mb-3" rows="2" placeholder="Your answer..."></textarea>
          <p class="mt-2"><strong>2.</strong> What is one advantage of storing cycle count or signal quality over time?</p>
          <textarea class="textarea textarea-bordered w-full mb-3" rows="2" placeholder="Your answer..."></textarea>
          <div class="alert bg-primary/10 border-l-4 border-primary text-base-content mb-3">
            <strong>Do this on the Dashboard:</strong> Open <a href="#" data-page="io-link-master" class="link link-primary">Dashboard</a>, go to <a href="#" data-page="io-link-master" data-scroll="simulate-fault" class="link link-primary">Simulate Fault</a> and set a fault, then open <a href="#" data-page="io-link-master" data-scroll="portDetailsSection" class="link link-primary">Active Port Details</a>. Describe what you see in the <strong>Events / faults</strong> area for that port.
          </div>
          <textarea class="textarea textarea-bordered w-full mb-2" rows="2" placeholder="What you see in Events area..."></textarea>
          <button type="button" class="btn btn-sm btn-ghost mb-2 ws-suggested-btn" data-target="ws9-suggested">Show suggested answer</button>
          <div id="ws9-suggested" class="hidden mt-2 p-3 rounded-lg bg-base-300 text-base-content/70 text-sm ws-suggested">1. Events indicate degradation or faults before total failure; maintenance can schedule cleaning or replacement during a break. 2. Trend data supports predictive replacement (e.g. nearing MTTF) and reduces unplanned downtime.</div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl" id="worksheet-10">
        <div class="card-body">
          <h2 class="card-title text-base-content">Worksheet 10: PLC and HMI Integration</h2>
          <p class="text-base-content/80"><strong>1.</strong> How does IO-Link diagnostic data typically appear in an HMI or PLC?</p>
          <textarea class="textarea textarea-bordered w-full mb-3" rows="3" placeholder="Your answer..."></textarea>
          <div class="alert bg-primary/10 border-l-4 border-primary text-base-content mb-3">
            <strong>Do this on the Dashboard:</strong> This app's <a href="#" data-page="io-link-master" class="link link-primary">Dashboard</a> is like a simple HMI. Trace where <strong>process data</strong> appears (Port Status, Active Port Details) and where <strong>events/diagnostics</strong> appear (Simulate Fault, then Events in Port Details).
          </div>
          <button type="button" class="btn btn-sm btn-ghost mb-2 ws-suggested-btn" data-target="ws10-suggested">Show suggested answer</button>
          <div id="ws10-suggested" class="hidden mt-2 p-3 rounded-lg bg-base-300 text-base-content/70 text-sm ws-suggested">Process data is mapped to PLC inputs/outputs; diagnostic and event data can be read via the master and displayed on the HMI (e.g. alarms, maintenance messages). Remote monitoring allows technicians to see faults and plan interventions without being at the machine.</div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl" id="worksheet-11">
        <div class="card-body">
          <h2 class="card-title text-base-content">Worksheet 11: Case Study – Standard vs IO-Link Sensor</h2>
          <p class="text-base-content/80">Compare diagnosis and repair times to understand MTTR (Mean Time to Repair).</p>
          <p class="text-base-content/80"><strong>Scenario:</strong> A sensor on a production line stops working. With a <strong>standard sensor</strong>: the line stops, the tech must locate the faulty sensor (e.g. 20 min), replace it and reconfigure (e.g. 15 min). With <strong>IO-Link</strong>: the HMI shows which port and which fault (e.g. wire break); the tech goes directly to the device (e.g. 5 min), replaces it, and parameters are restored automatically (e.g. 5 min).</p>
          <div class="overflow-x-auto">
            <table class="table table-zebra max-w-2xl">
              <thead><tr><th>Step</th><th>Standard (minutes)</th><th>IO-Link (minutes)</th></tr></thead>
              <tbody>
                <tr><td>Time to find fault / locate device</td><td><input type="text" class="input input-bordered input-sm w-24" placeholder="e.g. 20"></td><td><input type="text" class="input input-bordered input-sm w-24" placeholder="e.g. 5"></td></tr>
                <tr><td>Time to replace and reconfigure</td><td><input type="text" class="input input-bordered input-sm w-24" placeholder="e.g. 15"></td><td><input type="text" class="input input-bordered input-sm w-24" placeholder="e.g. 5"></td></tr>
                <tr><td>Total MTTR</td><td><input type="text" class="input input-bordered input-sm w-24" placeholder="sum"></td><td><input type="text" class="input input-bordered input-sm w-24" placeholder="sum"></td></tr>
              </tbody>
            </table>
          </div>
          <button type="button" class="btn btn-sm btn-ghost mb-2 ws-suggested-btn" data-target="ws11-suggested">Show suggested answer</button>
          <div id="ws11-suggested" class="hidden mt-2 p-3 rounded-lg bg-base-300 text-base-content/70 text-sm ws-suggested">Example: Standard 20+15 = 35 min; IO-Link 5+5 = 10 min. IO-Link reduces MTTR by faster fault location and automatic parameter restore.</div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl" id="worksheet-12">
        <div class="card-body">
          <h2 class="card-title text-base-content">Worksheet 12: Final Practical Assessment</h2>
          <p class="text-base-content/80">Checklist: complete these tasks (in the lab or on the Dashboard where indicated).</p>
          <div class="space-y-2">
            <label class="flex items-center gap-2"><input type="checkbox" class="checkbox checkbox-sm"> Wire (or describe) an IO-Link device correctly (3-wire / M12).</label>
            <label class="flex items-center gap-2"><input type="checkbox" class="checkbox checkbox-sm"> Configure (or describe) one parameter you would set on a sensor.</label>
            <p class="mt-1">What did you set? <textarea class="textarea textarea-bordered textarea-sm mt-1 w-full" rows="1" placeholder="Your answer..."></textarea></p>
            <label class="flex items-center gap-2"><input type="checkbox" class="checkbox checkbox-sm"> Trigger a fault (e.g. Simulate Fault on the Dashboard) and interpret the fault code.</label>
            <p class="mt-1">Fault code and your interpretation: <textarea class="textarea textarea-bordered textarea-sm mt-1 w-full" rows="1" placeholder="e.g. 0x02 Short circuit – check wiring"></textarea></p>
            <label class="flex items-center gap-2"><input type="checkbox" class="checkbox checkbox-sm"> Simulate replacing the device (Clear fault on Dashboard) and verify the event list updates.</label>
          </div>
          <div class="alert bg-primary/10 border-l-4 border-primary text-base-content mt-3">
            <strong>Do this on the Dashboard:</strong> Use <a href="#" data-page="io-link-master" data-scroll="simulate-fault" class="link link-primary">Simulate Fault</a> to set then clear a fault; check <a href="#" data-page="io-link-master" data-scroll="portDetailsSection" class="link link-primary">Active Port Details</a> to see Events and decoded process data.
          </div>
          <button type="button" class="btn btn-sm btn-ghost mb-2 ws-suggested-btn" data-target="ws12-suggested">Show suggested answers</button>
          <div id="ws12-suggested" class="hidden mt-2 p-3 rounded-lg bg-base-300 text-base-content/70 text-sm ws-suggested">Answers depend on your lab setup. For the Dashboard: Simulate Fault shows events in the port card (e.g. "0x02 Short circuit"); clearing the fault removes the event. Decoded process data (temperature, object present, etc.) appears in the same card when the device type is recognized.</div>
        </div>
      </div>

      <p class="text-base-content/60"><a href="#" data-page="io-link-master" class="link link-primary">Back to Dashboard</a> | <a href="#" data-page="learn" class="link link-primary">Learn</a></p>
    </div>
  `;
}

/** Attach suggested-answer toggles and Check buttons for worksheets. */
export function initWorksheetsPage() {
  document.querySelectorAll('.ws-suggested-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = btn.getAttribute('data-target');
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden');
    });
  });

  const ws2Correct = { 'ws2-1': 'events', 'ws2-2': 'params', 'ws2-3': 'events', 'ws2-4': 'events' };
  const ws2Btn = document.getElementById('ws2-check-btn');
  if (ws2Btn) {
    ws2Btn.addEventListener('click', function () {
      for (let i = 1; i <= 4; i++) {
        const sel = document.getElementById('ws2-' + i);
        const res = document.getElementById('ws2-result-' + i);
        if (!sel || !res) continue;
        const val = (sel.value || '').trim();
        const correct = ws2Correct['ws2-' + i];
        res.textContent = val ? (val === correct ? 'Correct' : 'Incorrect') : '';
        res.className = 'ws-check-result text-sm ' + (val === correct ? 'text-success' : (val ? 'text-error' : ''));
      }
    });
  }

  const ws6Correct = { 'ws6-1': 'process', 'ws6-2': 'event', 'ws6-3': 'service', 'ws6-4': 'process', 'ws6-5': 'event' };
  const ws6Btn = document.getElementById('ws6-check-btn');
  if (ws6Btn) {
    ws6Btn.addEventListener('click', function () {
      for (let i = 1; i <= 5; i++) {
        const sel = document.getElementById('ws6-' + i);
        const res = document.getElementById('ws6-result-' + i);
        if (!sel || !res) continue;
        const val = (sel.value || '').trim();
        const correct = ws6Correct['ws6-' + i];
        res.textContent = val ? (val === correct ? 'Correct' : 'Incorrect') : '';
        res.className = 'ws-check-result text-sm ' + (val === correct ? 'text-success' : (val ? 'text-error' : ''));
      }
    });
  }

  const ws7Btn = document.getElementById('ws7-check-btn');
  if (ws7Btn) {
    ws7Btn.addEventListener('click', function () {
      const q1 = document.querySelector('input[name="ws7-q1"]:checked');
      const q2 = document.querySelector('input[name="ws7-q2"]:checked');
      const r1 = document.getElementById('ws7-result-1');
      const r2 = document.getElementById('ws7-result-2');
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
