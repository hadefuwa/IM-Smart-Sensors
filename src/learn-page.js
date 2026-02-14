/**
 * Learn page – Chapter/level-style interactive experience (Industry 4.0)
 * Two views: chapter map (hub) and chapter view (one chapter at a time).
 * Includes per-chapter games and data/chart simulations.
 */

import Chart from 'chart.js/auto';

const LEARN_STORAGE_KEY = 'learn-progress';
let learnSimTimers = [];
let learnCharts = [];

// Inline SVG icons (24x24) per chapter – Industry 4.0 style
const ICONS = {
  factory: '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>',
  chip: '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>',
  duplicate: '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>',
  lightbulb: '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>',
  sun: '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>',
  thermometer: '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>',
  magnet: '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>'
};

const LEARN_CHAPTERS = [
  {
    id: 1,
    title: 'Industry 4.0 &amp; IoT',
    shortTitle: 'Industry 4.0',
    iconKey: 'factory',
    takeaway: 'Less guessing, more data.',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">Industry 4.0 means connecting machines and sensors to data networks so you can monitor, analyze, and act on real-time information. IoT (Internet of Things) in the factory is about sensors and devices that send data—temperature, presence, counts, faults—so maintenance and production can react before something fails.</p>
      <div class="my-4">
        <button type="button" class="learn-reveal-btn btn btn-outline btn-sm gap-2">Reveal key sensor data types</button>
        <div class="learn-reveal-content hidden mt-2 p-3 rounded-lg bg-primary/10 border border-primary/30 text-base-content/90 text-sm">Current, voltage, event flags, cycle counts — use these to plan repairs and spot problems early.</div>
      </div>
      <p class="text-base-content/90 leading-relaxed">For maintenance, this means: less guessing, more data. Instead of replacing parts on a fixed schedule or only after a breakdown, you can use sensor data to plan repairs and spot problems early.</p>
      <div class="my-4 p-4 rounded-xl border border-base-300 bg-base-300/30">
        <p class="font-medium text-base-content mb-2">Quick check: What does Industry 4.0 mean for maintenance?</p>
        <div class="learn-quiz" data-correct="b">
          <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-base-content/5 learn-quiz-option" data-value="a"><input type="radio" name="ch1-q" value="a"> Replace parts only after they fail</label>
          <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-base-content/5 learn-quiz-option" data-value="b"><input type="radio" name="ch1-q" value="b"> Use data to plan repairs and spot problems early</label>
          <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-base-content/5 learn-quiz-option" data-value="c"><input type="radio" name="ch1-q" value="c"> Guess when to maintain based on experience only</label>
        </div>
        <p class="learn-quiz-feedback hidden mt-2 text-sm font-medium"></p>
      </div>
      <div class="mt-6 p-4 rounded-xl border-2 border-primary/20 bg-base-300/20">
        <h4 class="font-semibold text-base-content mb-2">Game: Match the data to the benefit</h4>
        <p class="text-sm text-base-content/70 mb-2">Click a data type, then click the benefit it gives. Match all three.</p>
        <div class="learn-match-game flex flex-wrap gap-2 mb-2">
          <button type="button" class="learn-match-left btn btn-sm btn-outline" data-id="a">Cycle count</button>
          <button type="button" class="learn-match-left btn btn-sm btn-outline" data-id="b">Event flags</button>
          <button type="button" class="learn-match-left btn btn-sm btn-outline" data-id="c">Voltage/current</button>
        </div>
        <div class="learn-match-game flex flex-wrap gap-2">
          <button type="button" class="learn-match-right btn btn-sm btn-ghost border border-base-300" data-id="x">When to replace</button>
          <button type="button" class="learn-match-right btn btn-sm btn-ghost border border-base-300" data-id="y">Fault cause</button>
          <button type="button" class="learn-match-right btn btn-sm btn-ghost border border-base-300" data-id="z">Sensor health</button>
        </div>
        <p class="learn-match-pairs mt-2 text-sm text-base-content/70">Pairs: 0/3</p>
        <p class="learn-match-result hidden mt-1 font-medium text-success">Correct pairs: a→z, b→y, c→x. Well done!</p>
      </div>
      <div class="mt-4 p-4 rounded-xl border-2 border-primary/20 bg-base-300/20">
        <h4 class="font-semibold text-base-content mb-2">Simulation: Live data stream</h4>
        <p class="text-sm text-base-content/70 mb-2">Simulated sensor data flowing to the dashboard (like Industry 4.0).</p>
        <div class="learn-datastream h-32 overflow-y-auto rounded-lg bg-base-100/80 border border-base-300 font-mono text-xs p-2 space-y-0.5"></div>
      </div>
    `
  },
  {
    id: 2,
    title: 'Smart Sensors &amp; IO-Link',
    shortTitle: 'Smart Sensors',
    iconKey: 'chip',
    takeaway: 'One cable: data, parameters, and diagnostics.',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">A <strong class="text-base-content">smart sensor</strong> does more than switch on or off. It can report its identity (vendor, device ID, serial), process data (measured values), and diagnostics (events, supervision). IO-Link connects these sensors to a master over a single cable.</p>
      <div class="my-4 flex flex-wrap gap-2">
        <button type="button" class="learn-reveal-btn btn btn-outline btn-sm">What is PDin?</button>
        <button type="button" class="learn-reveal-btn btn btn-outline btn-sm">What is PDout?</button>
      </div>
      <div class="learn-reveal-content hidden mt-2 p-3 rounded-lg bg-primary/10 border border-primary/30 text-base-content/90 text-sm">PDin = process data the master <strong>reads</strong> from the device (e.g. measured value, on/off). PDout = data the master <strong>sends</strong> to the device (e.g. setpoint, LED command).</div>
      <p class="text-base-content/90 leading-relaxed mt-4">In this app, the dashboard shows port status, process data, supervision, and decoded values — the same kind of data a technician sees in tools like ifm LineRecorder or Moneo.</p>
      <div class="my-4 p-4 rounded-xl border border-base-300 bg-base-300/30">
        <p class="font-medium text-base-content mb-2">Which of these does a smart sensor report? (Select all that apply — click each.)</p>
        <div class="space-y-2">
          <button type="button" class="learn-multi-btn block w-full text-left p-3 rounded-lg border-2 border-base-300 hover:border-primary/40 transition-colors" data-correct="true">Identity (vendor ID, device ID, serial)</button>
          <button type="button" class="learn-multi-btn block w-full text-left p-3 rounded-lg border-2 border-base-300 hover:border-primary/40 transition-colors" data-correct="true">Process data (measured values)</button>
          <button type="button" class="learn-multi-btn block w-full text-left p-3 rounded-lg border-2 border-base-300 hover:border-primary/40 transition-colors" data-correct="false">Only on/off</button>
          <button type="button" class="learn-multi-btn block w-full text-left p-3 rounded-lg border-2 border-base-300 hover:border-primary/40 transition-colors" data-correct="true">Diagnostics (events, supervision)</button>
        </div>
        <p class="learn-multi-feedback hidden mt-2 text-sm font-medium"></p>
      </div>
      <div class="mt-6 p-4 rounded-xl border-2 border-primary/20 bg-base-300/20">
        <h4 class="font-semibold text-base-content mb-2">Game: PDin or PDout?</h4>
        <p class="text-sm text-base-content/70 mb-2">Click each item, then click the correct column (Master reads = PDin, Master sends = PDout).</p>
        <div class="flex gap-4 flex-wrap">
          <div class="flex-1 min-w-[140px]">
            <p class="text-xs font-semibold text-base-content/70 mb-1">PDin (master reads)</p>
            <div class="learn-sort-pdin min-h-[60px] p-2 rounded-lg border-2 border-dashed border-base-300"></div>
          </div>
          <div class="flex-1 min-w-[140px]">
            <p class="text-xs font-semibold text-base-content/70 mb-1">PDout (master sends)</p>
            <div class="learn-sort-pdout min-h-[60px] p-2 rounded-lg border-2 border-dashed border-base-300"></div>
          </div>
        </div>
        <div class="learn-sort-items mt-2 flex flex-wrap gap-2">
          <button type="button" class="learn-sort-item btn btn-sm btn-outline" data-dest="pdout">LED command</button>
          <button type="button" class="learn-sort-item btn btn-sm btn-outline" data-dest="pdin">Measured value</button>
          <button type="button" class="learn-sort-item btn btn-sm btn-outline" data-dest="pdout">Setpoint</button>
          <button type="button" class="learn-sort-item btn btn-sm btn-outline" data-dest="pdin">Event flags</button>
        </div>
        <p class="learn-sort-feedback mt-2 text-sm font-medium hidden"></p>
      </div>
      <div class="mt-4 p-4 rounded-xl border-2 border-primary/20 bg-base-300/20">
        <h4 class="font-semibold text-base-content mb-2">Simulation: PDin / PDout flow</h4>
        <p class="text-sm text-base-content/70 mb-2">Simulated messages: Master → Device (PDout) and Device → Master (PDin).</p>
        <div class="learn-pd-flow h-28 overflow-y-auto rounded-lg bg-base-100/80 border border-base-300 font-mono text-xs p-2 space-y-0.5"></div>
      </div>
    `
  },
  {
    id: 3,
    title: 'Digital Twin',
    shortTitle: 'Digital Twin',
    iconKey: 'duplicate',
    takeaway: 'Your dashboard is the digital twin of your IO-Link setup.',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">The JSON data from the FastAPI backend—port status, decoded PDin/PDout, supervision, events—is the foundation of a <strong class="text-base-content">Digital Twin</strong>: a digital representation of a physical device.</p>
      <div class="my-4 p-4 rounded-xl border border-base-300 bg-base-300/30">
        <p class="font-medium text-base-content mb-2">What makes up the digital twin in this app? (Click each to reveal.)</p>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="learn-reveal-btn btn btn-sm btn-ghost border border-base-300">Port status</button>
          <button type="button" class="learn-reveal-btn btn btn-sm btn-ghost border border-base-300">PDin / PDout</button>
          <button type="button" class="learn-reveal-btn btn btn-sm btn-ghost border border-base-300">Supervision</button>
          <button type="button" class="learn-reveal-btn btn btn-sm btn-ghost border border-base-300">Events</button>
        </div>
        <div class="learn-reveal-content hidden mt-2 p-3 rounded-lg bg-primary/10 border border-primary/30 text-base-content/90 text-sm">Yes — all of these together form the live "twin" of your IO-Link master and its sensors on the dashboard.</div>
      </div>
      <p class="text-base-content/90 leading-relaxed">This digital representation is used for condition monitoring, predictive maintenance, and training. When you look at the dashboard, you are looking at the digital twin of your IO-Link setup.</p>
      <div class="mt-6 p-4 rounded-xl border-2 border-primary/20 bg-base-300/20">
        <h4 class="font-semibold text-base-content mb-2">Game: Build the twin</h4>
        <p class="text-sm text-base-content/70 mb-2">Select all components that make up the digital twin in this app.</p>
        <div class="space-y-2">
          <label class="flex items-center gap-2 cursor-pointer learn-twin-check" data-correct="true"><input type="checkbox" class="learn-twin-cb"> Port status</label>
          <label class="flex items-center gap-2 cursor-pointer learn-twin-check" data-correct="true"><input type="checkbox" class="learn-twin-cb"> PDin / PDout</label>
          <label class="flex items-center gap-2 cursor-pointer learn-twin-check" data-correct="false"><input type="checkbox" class="learn-twin-cb"> Weather forecast</label>
          <label class="flex items-center gap-2 cursor-pointer learn-twin-check" data-correct="true"><input type="checkbox" class="learn-twin-cb"> Supervision &amp; events</label>
        </div>
        <button type="button" class="learn-twin-submit btn btn-sm btn-primary mt-2">Check</button>
        <p class="learn-twin-feedback mt-2 text-sm font-medium hidden"></p>
      </div>
      <div class="mt-4 p-4 rounded-xl border-2 border-primary/20 bg-base-300/20">
        <h4 class="font-semibold text-base-content mb-2">Simulation: Digital twin preview</h4>
        <p class="text-sm text-base-content/70 mb-2">Simulated live values (like the dashboard).</p>
        <div class="learn-twin-sim grid grid-cols-2 gap-2 text-sm font-mono">
          <div class="p-2 rounded bg-base-100 border border-base-300">Port: <span class="learn-twin-port text-primary">OK</span></div>
          <div class="p-2 rounded bg-base-100 border border-base-300">PDin: <span class="learn-twin-pdin text-primary">0x00</span></div>
          <div class="p-2 rounded bg-base-100 border border-base-300">PDout: <span class="learn-twin-pdout text-primary">0x00</span></div>
          <div class="p-2 rounded bg-base-100 border border-base-300">Temp: <span class="learn-twin-temp text-primary">22 °C</span></div>
        </div>
      </div>
    `
  },
  {
    id: 4,
    title: 'Status LED / Light Stack',
    shortTitle: 'Status LED',
    iconKey: 'lightbulb',
    takeaway: 'State is data: log it, trend it, use it.',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">Status lights (e.g. CL50-style LED stacks) show machine or line state. They are often driven by the PLC via IO-Link (PDout): the master sends bytes that define color, intensity, and animation.</p>
      <div class="my-4 p-4 rounded-xl border border-base-300 bg-base-300/30">
        <p class="font-medium text-base-content mb-2">Click a state to see its meaning:</p>
        <div class="flex flex-wrap gap-3">
          <button type="button" class="learn-led-btn rounded-full w-14 h-14 bg-success border-2 border-success/50 shadow-lg hover:scale-110 transition-transform" data-msg="Running — machine or line operating normally. With IO-Link, this state is data you can log and trend."></button>
          <button type="button" class="learn-led-btn rounded-full w-14 h-14 bg-warning border-2 border-warning/50 shadow-lg hover:scale-110 transition-transform" data-msg="Warning — e.g. attention needed soon. Dashboard can show which device or port reported it."></button>
          <button type="button" class="learn-led-btn rounded-full w-14 h-14 bg-error border-2 border-error/50 shadow-lg hover:scale-110 transition-transform" data-msg="Fault — e.g. short circuit. With IO-Link, the master reports which port/device and what event; no hunting required."></button>
        </div>
        <p class="learn-led-msg mt-3 min-h-[2.5rem] p-2 rounded-lg bg-base-200/80 text-base-content/90 text-sm"></p>
      </div>
      <div class="mt-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-3">Before vs. After</h3>
        <div class="overflow-x-auto rounded-lg border border-base-300">
          <table class="table table-zebra">
            <thead><tr><th class="bg-base-300/50 font-semibold">Traditional</th><th class="bg-base-300/50 font-semibold">IO-Link</th></tr></thead>
            <tbody class="text-sm">
              <tr><td class="text-base-content/70 italic py-3">Operator sees a red light; tech hunts for which device or station caused it.</td><td class="py-3">Event or status is reported by the master; dashboard shows which port/device and what event.</td></tr>
              <tr><td class="text-base-content/70 italic py-3">Lights are "dumb"; no remote visibility of state.</td><td class="py-3">State is data: you can log it, trend it, and use it for diagnostics and training.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="mt-6 p-4 rounded-xl border-2 border-primary/20 bg-base-300/20">
        <h4 class="font-semibold text-base-content mb-2">Game: Pick the right LED</h4>
        <p class="text-sm text-base-content/70 mb-2">Read the scenario and click the LED that matches.</p>
        <p class="learn-led-scenario font-medium text-base-content mb-2">"Machine is running normally."</p>
        <div class="flex gap-3">
          <button type="button" class="learn-led-pick rounded-full w-12 h-12 bg-success border-2 border-base-300" data-correct="true" title="Running"></button>
          <button type="button" class="learn-led-pick rounded-full w-12 h-12 bg-warning border-2 border-base-300" data-correct="false" title="Warning"></button>
          <button type="button" class="learn-led-pick rounded-full w-12 h-12 bg-error border-2 border-base-300" data-correct="false" title="Fault"></button>
        </div>
        <p class="learn-led-pick-feedback mt-2 text-sm font-medium hidden"></p>
      </div>
      <div class="mt-4 p-4 rounded-xl border-2 border-primary/20 bg-base-300/20">
        <h4 class="font-semibold text-base-content mb-2">Simulation: LED state cycle</h4>
        <p class="text-sm text-base-content/70 mb-2">Simulated LED state over time (Running → Warning → Fault → Running).</p>
        <div class="learn-led-cycle flex items-center gap-2">
          <div class="learn-led-cycle-dot w-8 h-8 rounded-full bg-success transition-colors"></div>
          <span class="learn-led-cycle-label text-sm font-medium">Running</span>
        </div>
      </div>
    `
  },
  {
    id: 5,
    title: 'Photo Electric Sensor',
    shortTitle: 'Photo Electric',
    iconKey: 'sun',
    takeaway: 'Signal quality and diagnostics before failure.',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">Photoelectric sensors detect objects using a light beam. PDin typically includes "object detected" (on/off) and often signal quality or intensity (0–100%). A drop in signal quality often means cleaning or adjustment before the sensor fails.</p>
      <div class="my-4 p-4 rounded-xl border border-base-300 bg-base-300/30">
        <p class="font-medium text-base-content mb-2">Signal quality: <span id="learn-signal-value" class="font-bold text-primary">50</span>%</p>
        <input type="range" min="0" max="100" value="50" class="range range-primary range-sm learn-signal-range" />
        <p class="text-xs text-base-content/60 mt-1">Drag the slider. Low signal often means: clean the lens, check alignment, or plan replacement.</p>
        <p class="learn-signal-hint mt-2 p-2 rounded-lg bg-base-200/80 text-sm text-base-content/80 hidden">At this level, consider cleaning the lens and checking alignment. If it keeps dropping, plan replacement.</p>
      </div>
      <div class="my-4 p-4 rounded-xl border border-base-300 bg-base-300/30">
        <p class="font-medium text-base-content mb-2">The sensor reports "Lens dirty." What should you do first?</p>
        <div class="learn-quiz" data-correct="b">
          <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-base-content/5 learn-quiz-option" data-value="a"><input type="radio" name="ch5-q" value="a"> Replace the sensor immediately</label>
          <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-base-content/5 learn-quiz-option" data-value="b"><input type="radio" name="ch5-q" value="b"> Clean the lens and check alignment</label>
          <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-base-content/5 learn-quiz-option" data-value="c"><input type="radio" name="ch5-q" value="c"> Ignore it</label>
        </div>
        <p class="learn-quiz-feedback hidden mt-2 text-sm font-medium"></p>
      </div>
      <div class="mt-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-3">Before vs. After</h3>
        <div class="overflow-x-auto rounded-lg border border-base-300">
          <table class="table table-zebra">
            <thead><tr><th class="bg-base-300/50 font-semibold">Traditional</th><th class="bg-base-300/50 font-semibold">IO-Link</th></tr></thead>
            <tbody class="text-sm">
              <tr><td class="text-base-content/70 italic py-3">Sensor fails → machine stops → tech spends 20 minutes finding the failed unit.</td><td class="py-3">Sensor sends "lens dirty" or low signal quality → tech cleans during a scheduled break → zero unplanned downtime.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="mt-6 p-4 rounded-xl border-2 border-primary/20 bg-base-300/20">
        <h4 class="font-semibold text-base-content mb-2">Game: Match trend to action</h4>
        <p class="text-sm text-base-content/70 mb-2">Click a trend, then the correct action.</p>
        <div class="flex flex-wrap gap-2 mb-2">
          <button type="button" class="learn-trend-left btn btn-sm btn-outline" data-id="1">Signal quality dropping</button>
          <button type="button" class="learn-trend-left btn btn-sm btn-outline" data-id="2">Stable 100%</button>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="learn-trend-right btn btn-sm btn-ghost border border-base-300" data-id="a">Clean lens, check alignment</button>
          <button type="button" class="learn-trend-right btn btn-sm btn-ghost border border-base-300" data-id="b">No action needed</button>
        </div>
        <p class="learn-trend-result mt-2 text-sm font-medium hidden"></p>
      </div>
      <div class="mt-4 p-4 rounded-xl border-2 border-primary/20 bg-base-300/20">
        <h4 class="font-semibold text-base-content mb-2">Simulation: Signal quality over time</h4>
        <p class="text-sm text-base-content/70 mb-2">Simulated signal strength (%).</p>
        <div class="learn-signal-chart-container relative h-40"><canvas class="learn-signal-chart"></canvas></div>
      </div>
    `
  },
  {
    id: 6,
    title: 'Temperature Sensor',
    shortTitle: 'Temperature',
    iconKey: 'thermometer',
    takeaway: 'Live temperature and trends for condition monitoring.',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">IO-Link temperature sensors report temperature (e.g. in °C) as process data. Use trends to spot overheating or cooling issues.</p>
      <div class="my-4 p-4 rounded-xl border border-base-300 bg-base-300/30">
        <p class="font-medium text-base-content mb-2">Scenario: What might this trend mean?</p>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="learn-scenario-btn btn btn-outline btn-sm" data-trend="rising" data-msg="Rising over time — could indicate overheating, poor cooling, or load increase. Check calibration and placement.">Rising over time</button>
          <button type="button" class="learn-scenario-btn btn btn-outline btn-sm" data-trend="stable" data-msg="Stable — normal operation. Keep monitoring for changes.">Stable</button>
          <button type="button" class="learn-scenario-btn btn btn-outline btn-sm" data-trend="spike" data-msg="Sudden spike — possible fault, sensor issue, or process event. Investigate quickly.">Sudden spike</button>
        </div>
        <p class="learn-scenario-msg mt-3 min-h-[2.5rem] p-2 rounded-lg bg-base-200/80 text-base-content/90 text-sm"></p>
      </div>
      <div class="mt-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-3">Before vs. After</h3>
        <div class="overflow-x-auto rounded-lg border border-base-300">
          <table class="table table-zebra">
            <thead><tr><th class="bg-base-300/50 font-semibold">Traditional</th><th class="bg-base-300/50 font-semibold">IO-Link</th></tr></thead>
            <tbody class="text-sm">
              <tr><td class="text-base-content/70 italic py-3">Periodic manual checks; no history.</td><td class="py-3">Live temperature on the dashboard; trend over time supports condition monitoring and alarms.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="mt-6 p-4 rounded-xl border-2 border-primary/20 bg-base-300/20">
        <h4 class="font-semibold text-base-content mb-2">Game: Order the steps</h4>
        <p class="text-sm text-base-content/70 mb-2">Drag or click to put steps in the right order (1 → 4).</p>
        <div class="learn-order-list space-y-1 mb-2"></div>
        <div class="learn-order-buttons flex flex-wrap gap-2">
          <button type="button" class="learn-order-btn btn btn-sm btn-ghost border border-base-300" data-order="1">See trend on dashboard</button>
          <button type="button" class="learn-order-btn btn btn-sm btn-ghost border border-base-300" data-order="2">Identify hotspot or fault</button>
          <button type="button" class="learn-order-btn btn btn-sm btn-ghost border border-base-300" data-order="3">Plan maintenance</button>
          <button type="button" class="learn-order-btn btn btn-sm btn-ghost border border-base-300" data-order="4">Schedule repair</button>
        </div>
        <p class="learn-order-feedback mt-2 text-sm font-medium hidden"></p>
      </div>
      <div class="mt-4 p-4 rounded-xl border-2 border-primary/20 bg-base-300/20">
        <h4 class="font-semibold text-base-content mb-2">Simulation: Temperature over time</h4>
        <p class="text-sm text-base-content/70 mb-2">Simulated temperature (°C) for condition monitoring.</p>
        <div class="learn-temp-chart-container relative h-40"><canvas class="learn-temp-chart"></canvas></div>
      </div>
    `
  },
  {
    id: 7,
    title: 'Proximity Sensor',
    shortTitle: 'Proximity',
    iconKey: 'magnet',
    takeaway: 'Cycle count and MTTF for replace-when-needed planning.',
    contentHtml: `
      <p class="text-base-content/90 leading-relaxed">Proximity sensors detect presence (and sometimes distance). Use event flags (e.g. wire break) and supervision to plan replacement (e.g. MTTF and cycle count).</p>
      <div class="my-4 p-4 rounded-xl border border-base-300 bg-base-300/30">
        <p class="font-medium text-base-content mb-2">When should you replace a proximity sensor?</p>
        <div class="learn-quiz" data-correct="b">
          <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-base-content/5 learn-quiz-option" data-value="a"><input type="radio" name="ch7-q" value="a"> Only on a fixed schedule (e.g. every 12 months)</label>
          <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-base-content/5 learn-quiz-option" data-value="b"><input type="radio" name="ch7-q" value="b"> When cycle count or diagnostics suggest "replace when needed"</label>
          <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-base-content/5 learn-quiz-option" data-value="c"><input type="radio" name="ch7-q" value="c"> Only after it has already failed</label>
        </div>
        <p class="learn-quiz-feedback hidden mt-2 text-sm font-medium"></p>
      </div>
      <div class="my-4">
        <button type="button" class="learn-reveal-btn btn btn-outline btn-sm">What data helps plan replacement?</button>
        <div class="learn-reveal-content hidden mt-2 p-3 rounded-lg bg-primary/10 border border-primary/30 text-base-content/90 text-sm">Cycle count, MTTF (Mean Time To Failure), event history, and signal quality trends. IO-Link provides these so you can plan "replace when needed" instead of fixed schedule or run-to-failure.</div>
      </div>
      <div class="mt-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-3">Before vs. After</h3>
        <div class="overflow-x-auto rounded-lg border border-base-300">
          <table class="table table-zebra">
            <thead><tr><th class="bg-base-300/50 font-semibold">Traditional</th><th class="bg-base-300/50 font-semibold">IO-Link</th></tr></thead>
            <tbody class="text-sm">
              <tr><td class="text-base-content/70 italic py-3">Replace on a fixed schedule or after failure.</td><td class="py-3">Cycle count and diagnostics support "replace when needed" and MTTF-based planning.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="mt-6 p-4 rounded-xl border-2 border-primary/20 bg-base-300/20">
        <h4 class="font-semibold text-base-content mb-2">Game: Replace or Monitor?</h4>
        <p class="text-sm text-base-content/70 mb-2">For each scenario, click Replace or Monitor.</p>
        <div class="space-y-2">
          <p class="text-sm font-medium">Cycle count near MTTF limit, no fault yet.</p>
          <div class="flex gap-2"><button type="button" class="learn-rom btn btn-sm btn-outline" data-scenario="1" data-correct="replace">Replace</button><button type="button" class="learn-rom btn btn-sm btn-outline" data-scenario="1" data-correct="monitor">Monitor</button></div>
          <p class="text-sm font-medium mt-2">Sensor healthy, low cycles.</p>
          <div class="flex gap-2"><button type="button" class="learn-rom btn btn-sm btn-outline" data-scenario="2" data-correct="monitor">Monitor</button><button type="button" class="learn-rom btn btn-sm btn-outline" data-scenario="2" data-correct="replace">Replace</button></div>
        </div>
        <p class="learn-rom-feedback mt-2 text-sm font-medium hidden"></p>
      </div>
      <div class="mt-4 p-4 rounded-xl border-2 border-primary/20 bg-base-300/20">
        <h4 class="font-semibold text-base-content mb-2">Simulation: Cycle count over time</h4>
        <p class="text-sm text-base-content/70 mb-2">Simulated cycle count (replace when near limit).</p>
        <div class="learn-cycle-chart-container relative h-40"><canvas class="learn-cycle-chart"></canvas></div>
      </div>
    `
  }
];

function getLearnProgress() {
  try {
    const raw = localStorage.getItem(LEARN_STORAGE_KEY);
    if (!raw) return { completed: [], lastIndex: 0 };
    const data = JSON.parse(raw);
    return {
      completed: Array.isArray(data.completed) ? data.completed : [],
      lastIndex: typeof data.lastIndex === 'number' ? Math.max(0, Math.min(data.lastIndex, LEARN_CHAPTERS.length - 1)) : 0
    };
  } catch (e) {
    return { completed: [], lastIndex: 0 };
  }
}

function setLearnProgress(completed, lastIndex) {
  try {
    localStorage.setItem(LEARN_STORAGE_KEY, JSON.stringify({ completed, lastIndex }));
  } catch (e) {}
}

const LEARN_CARD_ACCENTS = ['p', 's', 'a', 'p', 's', 'a', 'p'];

function buildMapHtml(completedSet) {
  const cards = LEARN_CHAPTERS.map(function (ch, i) {
    const num = i + 1;
    const done = completedSet.has(num);
    const icon = ICONS[ch.iconKey] || '';
    const cv = LEARN_CARD_ACCENTS[i % LEARN_CARD_ACCENTS.length];
    const badgeClass = cv === 'p' ? 'badge-primary' : (cv === 's' ? 'badge-secondary' : 'badge-accent');
    return `
      <button type="button" class="learn-chapter-card btn btn-ghost h-auto flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 text-left bg-base-200/95 hover:scale-[1.02] hover:shadow-xl min-h-[150px] shadow-lg" data-chapter-index="${i}" style="border-color: hsl(var(--${cv}) / 0.5); box-shadow: 0 4px 14px hsl(var(--b3) / 0.3);">
        <span class="badge ${badgeClass} badge-sm">${num}</span>
        <span class="learn-chapter-icon rounded-full p-2" style="background-color: hsl(var(--${cv}) / 0.2);">${icon}</span>
        <span class="font-semibold text-base-content text-sm">${ch.shortTitle}</span>
        ${done ? '<span class="text-success text-xs font-medium">Done</span>' : ''}
      </button>
    `;
  }).join('');
  return `
    <div id="learn-chapter-map" class="learn-view">
      <div class="max-w-4xl mx-auto relative">
        <div class="absolute inset-0 overflow-hidden pointer-events-none opacity-30" aria-hidden="true">
          <svg class="absolute -top-20 -right-20 w-80 h-80 text-primary/20" fill="currentColor" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="0.5"/><circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" stroke-width="0.3"/></svg>
          <svg class="absolute bottom-10 left-0 w-60 h-60 text-secondary/20" fill="currentColor" viewBox="0 0 100 100"><circle cx="20" cy="20" r="3"/><circle cx="50" cy="20" r="3"/><circle cx="80" cy="20" r="3"/><circle cx="20" cy="50" r="3"/><circle cx="50" cy="50" r="3"/><circle cx="80" cy="50" r="3"/></svg>
        </div>
        <header class="relative pb-6 mb-6 rounded-2xl bg-gradient-to-r from-primary/15 via-secondary/10 to-accent/15 border border-primary/20 px-6 py-6 shadow-lg">
          <div class="flex items-start gap-4 flex-wrap">
            <div class="rounded-xl bg-primary/20 p-3 border border-primary/30">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-base-content tracking-tight">Learn: Smart Sensors &amp; Industry 4.0</h1>
              <p class="mt-2 text-base-content/80 text-lg leading-relaxed">Complete chapters to master IO-Link and industrial maintenance. Choose a chapter below.</p>
            </div>
          </div>
        </header>
        <div class="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 mt-8">
          ${cards}
        </div>
        <footer class="relative pt-6 border-t border-base-300 mt-8 flex flex-wrap gap-2">
          <a href="#" data-page="io-link-master" class="btn btn-outline btn-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Dashboard
          </a>
        </footer>
      </div>
    </div>
  `;
}

function buildProgressSegments(currentIndex) {
  return LEARN_CHAPTERS.map(function (_, i) {
    const num = i + 1;
    const done = i < currentIndex;
    const current = i === currentIndex;
    let cls = 'w-2 h-2 rounded-full flex-shrink-0 ';
    if (done) cls += 'bg-primary';
    else if (current) cls += 'bg-primary ring-2 ring-primary ring-offset-2 ring-offset-base-100';
    else cls += 'bg-base-300';
    return '<span class="' + cls + '" title="Chapter ' + num + '"></span>';
  }).join('');
}

function buildChapterViewHtml() {
  const progressSegments = buildProgressSegments(0);
  return `
    <div id="learn-chapter-view" class="learn-view hidden">
      <div class="max-w-4xl mx-auto space-y-4 relative">
        <div class="absolute top-0 right-0 w-40 h-40 opacity-20 pointer-events-none" aria-hidden="true">
          <svg viewBox="0 0 100 100" fill="none" class="text-primary"><circle cx="50" cy="50" r="45" stroke="currentColor" stroke-width="1"/><circle cx="50" cy="50" r="30" stroke="currentColor" stroke-width="0.5"/></svg>
        </div>
        <nav class="relative flex items-center justify-between gap-2 flex-wrap pb-4 border-b-2 border-primary/20">
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" class="btn btn-outline btn-sm" id="learn-back-to-map-btn">Back to map</button>
            <button type="button" class="btn btn-ghost btn-sm" id="learn-prev-btn" style="display: none;">Previous</button>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" class="btn btn-primary btn-sm shadow-lg shadow-primary/20" id="learn-next-btn">Next chapter</button>
          </div>
        </nav>
        <div class="relative flex items-center gap-2 flex-wrap">
          ${progressSegments}
          <span class="text-xs text-base-content/60 ml-2" id="learn-progress-label">Chapter 1 of ${LEARN_CHAPTERS.length}</span>
        </div>
        <h2 class="relative text-2xl font-bold text-base-content" id="learn-chapter-title">${LEARN_CHAPTERS[0].title}</h2>
        <div class="relative bg-gradient-to-r from-primary/20 to-secondary/10 border-l-4 border-primary rounded-r-xl py-3 px-5 text-base-content/90 font-medium shadow-md" id="learn-takeaway">${LEARN_CHAPTERS[0].takeaway}</div>
        <div class="relative card bg-base-200/95 shadow-xl border-2 border-primary/20 rounded-2xl overflow-hidden" id="learn-chapter-content">
          <div class="card-body gap-4">
            ${LEARN_CHAPTERS[0].contentHtml}
          </div>
        </div>
        <div class="relative pt-4 border-t border-base-300">
          <a href="#" data-page="io-link-master" class="btn btn-ghost btn-sm">Back to Dashboard</a>
        </div>
      </div>
    </div>
  `;
}

export function renderLearnPage() {
  const progress = getLearnProgress();
  const completedSet = new Set(progress.completed);
  const mapHtml = buildMapHtml(completedSet);
  const chapterViewHtml = buildChapterViewHtml();
  return `
    <div class="min-h-full py-6 px-4 relative overflow-hidden" id="learn-root" style="background: linear-gradient(135deg, hsl(var(--b2)) 0%, hsl(var(--b3)) 50%, hsl(var(--p) / 0.08) 100%);">
      <div class="absolute inset-0 opacity-40 pointer-events-none" aria-hidden="true" style="background-image: radial-gradient(circle at 20% 80%, hsl(var(--p) / 0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(var(--s) / 0.06) 0%, transparent 50%);"></div>
      <div class="relative">
        ${mapHtml}
        ${chapterViewHtml}
      </div>
    </div>
  `;
}

let currentChapterIndex = 0;

function showMap() {
  const mapEl = document.getElementById('learn-chapter-map');
  const viewEl = document.getElementById('learn-chapter-view');
  if (mapEl) mapEl.classList.remove('hidden');
  if (viewEl) viewEl.classList.add('hidden');
}

function showChapterView(index) {
  const mapEl = document.getElementById('learn-chapter-map');
  const viewEl = document.getElementById('learn-chapter-view');
  if (mapEl) mapEl.classList.add('hidden');
  if (viewEl) viewEl.classList.remove('hidden');
  currentChapterIndex = index;
  const ch = LEARN_CHAPTERS[index];
  if (!ch) return;
  const titleEl = document.getElementById('learn-chapter-title');
  const takeawayEl = document.getElementById('learn-takeaway');
  const contentEl = document.getElementById('learn-chapter-content');
  const labelEl = document.getElementById('learn-progress-label');
  const progressWrap = viewEl ? viewEl.querySelector('.flex.items-center.gap-2') : null;
  if (titleEl) titleEl.innerHTML = ch.title;
  if (takeawayEl) takeawayEl.textContent = ch.takeaway;
  learnSimTimers.forEach(function (t) { clearInterval(t); });
  learnSimTimers = [];
  learnCharts.forEach(function (c) { try { c.destroy(); } catch (e) {} });
  learnCharts = [];
  if (contentEl) {
    contentEl.innerHTML = '<div class="card-body gap-4">' + ch.contentHtml + '</div>';
    initChapterInteractivity(contentEl);
    initChapterGamesAndSimulations(contentEl, index);
  }
  if (labelEl) labelEl.textContent = 'Chapter ' + (index + 1) + ' of ' + LEARN_CHAPTERS.length;
  if (progressWrap) progressWrap.innerHTML = buildProgressSegments(index) + '<span class="text-xs text-base-content/60 ml-2" id="learn-progress-label">Chapter ' + (index + 1) + ' of ' + LEARN_CHAPTERS.length + '</span>';
  const nextBtn = document.getElementById('learn-next-btn');
  const prevBtn = document.getElementById('learn-prev-btn');
  if (prevBtn) prevBtn.style.display = index === 0 ? 'none' : '';
  if (nextBtn) {
    nextBtn.textContent = index === LEARN_CHAPTERS.length - 1 ? 'Finish' : 'Next chapter';
  }
}

function markCompleted(index) {
  const progress = getLearnProgress();
  const num = index + 1;
  if (!progress.completed.includes(num)) {
    progress.completed.push(num);
    progress.completed.sort(function (a, b) { return a - b; });
    progress.lastIndex = index;
    setLearnProgress(progress.completed, progress.lastIndex);
  }
}

export function initLearnPage() {
  const root = document.getElementById('learn-root');
  if (!root) return;
  currentChapterIndex = getLearnProgress().lastIndex;

  root.querySelectorAll('.learn-chapter-card').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const idx = parseInt(btn.getAttribute('data-chapter-index'), 10);
      if (!isNaN(idx)) showChapterView(idx);
    });
  });

  const prevBtn = document.getElementById('learn-prev-btn');
  const nextBtn = document.getElementById('learn-next-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      if (currentChapterIndex > 0) {
        showChapterView(currentChapterIndex - 1);
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      markCompleted(currentChapterIndex);
      if (currentChapterIndex < LEARN_CHAPTERS.length - 1) {
        showChapterView(currentChapterIndex + 1);
      } else {
        showMap();
        updateMapDoneBadges();
      }
    });
  }

  const backToMapBtn = document.getElementById('learn-back-to-map-btn');
  if (backToMapBtn) {
    backToMapBtn.addEventListener('click', function () {
      setLearnProgress(getLearnProgress().completed, currentChapterIndex);
      showMap();
    });
  }
}

function updateMapDoneBadges() {
  const mapEl = document.getElementById('learn-chapter-map');
  if (!mapEl) return;
  const progress = getLearnProgress();
  const completedSet = new Set(progress.completed);
  const cards = mapEl.querySelectorAll('.learn-chapter-card');
  cards.forEach(function (card, i) {
    const num = i + 1;
    const done = completedSet.has(num);
    const doneSpan = card.querySelector('.text-success');
    if (done && !doneSpan) {
      const span = document.createElement('span');
      span.className = 'text-success text-xs';
      span.textContent = 'Done';
      card.appendChild(span);
    }
  });
}

function initChapterInteractivity(container) {
  if (!container) return;

  container.addEventListener('click', function (e) {
    const target = e.target.closest('.learn-reveal-btn');
    if (target) {
      e.preventDefault();
      const parent = target.closest('.card-body') || container;
      const content = parent.querySelector('.learn-reveal-content');
      if (content) content.classList.toggle('hidden');
      return;
    }

    const ledBtn = e.target.closest('.learn-led-btn');
    if (ledBtn) {
      const msg = ledBtn.getAttribute('data-msg');
      const msgEl = container.querySelector('.learn-led-msg');
      if (msgEl && msg) msgEl.textContent = msg;
      return;
    }

    const scenarioBtn = e.target.closest('.learn-scenario-btn');
    if (scenarioBtn) {
      const msg = scenarioBtn.getAttribute('data-msg');
      const msgEl = container.querySelector('.learn-scenario-msg');
      if (msgEl && msg) msgEl.textContent = msg;
      return;
    }

    const quizOption = e.target.closest('.learn-quiz-option');
    if (quizOption) {
      const quiz = quizOption.closest('.learn-quiz');
      if (!quiz) return;
      const correct = quiz.getAttribute('data-correct');
      const value = quizOption.getAttribute('data-value');
      const feedback = quiz.querySelector('.learn-quiz-feedback');
      if (!feedback) return;
      feedback.classList.remove('hidden');
      if (value === correct) {
        feedback.textContent = 'Correct!';
        feedback.className = 'learn-quiz-feedback mt-2 text-sm font-medium text-success';
      } else {
        feedback.textContent = 'Not quite — try again.';
        feedback.className = 'learn-quiz-feedback mt-2 text-sm font-medium text-error';
      }
      return;
    }

    const multiBtn = e.target.closest('.learn-multi-btn');
    if (multiBtn) {
      const correct = multiBtn.getAttribute('data-correct') === 'true';
      multiBtn.classList.toggle('border-primary', !multiBtn.classList.contains('border-primary'));
      multiBtn.classList.toggle('bg-primary/10', multiBtn.classList.contains('border-primary'));
      const feedback = container.querySelector('.learn-multi-feedback');
      if (!feedback) return;
      const allBtns = container.querySelectorAll('.learn-multi-btn');
      let allCorrect = true;
      let anyWrong = false;
      allBtns.forEach(function (btn) {
        const isCorrect = btn.getAttribute('data-correct') === 'true';
        const selected = btn.classList.contains('border-primary');
        if (isCorrect && !selected) allCorrect = false;
        if (!isCorrect && selected) anyWrong = true;
      });
      feedback.classList.remove('hidden');
      if (anyWrong) {
        feedback.textContent = 'One of the selected answers is not something a smart sensor reports. Deselect it.';
        feedback.className = 'learn-multi-feedback mt-2 text-sm font-medium text-error';
      } else if (allCorrect) {
        feedback.textContent = 'Correct! Smart sensors report identity, process data, and diagnostics — not just on/off.';
        feedback.className = 'learn-multi-feedback mt-2 text-sm font-medium text-success';
      } else {
        feedback.textContent = 'Select all that apply. Hint: three of the four are correct.';
        feedback.className = 'learn-multi-feedback mt-2 text-sm font-medium text-base-content/80';
      }
      return;
    }
  });

  const rangeEl = container.querySelector('.learn-signal-range');
  if (rangeEl) {
    const valueEl = container.querySelector('#learn-signal-value');
    const hintEl = container.querySelector('.learn-signal-hint');
    function updateSignal() {
      const v = parseInt(rangeEl.value, 10);
      if (valueEl) valueEl.textContent = v;
      if (hintEl) {
        if (v < 40) {
          hintEl.classList.remove('hidden');
        } else {
          hintEl.classList.add('hidden');
        }
      }
    }
    rangeEl.addEventListener('input', updateSignal);
    updateSignal();
  }
}

// Correct pairs for Ch1 match game: left id -> right id
const CH1_MATCH_PAIRS = { a: 'z', b: 'y', c: 'x' };

function initChapterGamesAndSimulations(container, chapterIndex) {
  if (!container) return;
  const idx = chapterIndex;

  // ---- Chapter 1: Match game + data stream ----
  if (idx === 0) {
    let selectedLeft = null;
    const pairs = {};
    const leftBtns = container.querySelectorAll('.learn-match-left');
    const rightBtns = container.querySelectorAll('.learn-match-right');
    const pairsEl = container.querySelector('.learn-match-pairs');
    const resultEl = container.querySelector('.learn-match-result');
    function updatePairs() {
      const count = Object.keys(pairs).length;
      if (pairsEl) pairsEl.textContent = 'Pairs: ' + count + '/3';
      if (count === 3) {
        let ok = true;
        Object.keys(CH1_MATCH_PAIRS).forEach(function (k) { if (pairs[k] !== CH1_MATCH_PAIRS[k]) ok = false; });
        if (ok && resultEl) { resultEl.classList.remove('hidden'); resultEl.textContent = 'Correct pairs: cycle count→sensor health, event flags→fault cause, voltage/current→when to replace. Well done!'; }
      }
    }
    leftBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        leftBtns.forEach(function (b) { b.classList.remove('ring-2', 'ring-primary'); });
        if (pairs[btn.getAttribute('data-id')]) return;
        btn.classList.add('ring-2', 'ring-primary');
        selectedLeft = btn.getAttribute('data-id');
      });
    });
    rightBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (selectedLeft === null) return;
        const rightId = btn.getAttribute('data-id');
        pairs[selectedLeft] = rightId;
        leftBtns.forEach(function (b) { b.classList.remove('ring-2', 'ring-primary'); });
        selectedLeft = null;
        updatePairs();
      });
    });

    const streamEl = container.querySelector('.learn-datastream');
    if (streamEl) {
      const lines = [];
      function addLine(text) {
        lines.push(text);
        if (lines.length > 20) lines.shift();
        streamEl.innerHTML = lines.map(function (l) { return '<div>' + l + '</div>'; }).join('');
        streamEl.scrollTop = streamEl.scrollHeight;
      }
      const labels = ['Temp', 'Count', 'Event', 'V', 'I', 'Status'];
      const t = setInterval(function () {
        const label = labels[Math.floor(Math.random() * labels.length)];
        const val = Math.floor(Math.random() * 1000);
        addLine('[' + new Date().toLocaleTimeString() + '] ' + label + ' = ' + val);
      }, 800);
      learnSimTimers.push(t);
    }
  }

  // ---- Chapter 2: Sort PDin/PDout + PD flow ----
  if (idx === 1) {
    const pdinEl = container.querySelector('.learn-sort-pdin');
    const pdoutEl = container.querySelector('.learn-sort-pdout');
    const items = container.querySelectorAll('.learn-sort-item');
    const feedbackEl = container.querySelector('.learn-sort-feedback');
    let selectedItem = null;
    const placed = {};
    function placeItem(text, dest, btnEl) {
      placed[text] = dest;
      if (dest === 'pdin' && pdinEl) { const d = document.createElement('span'); d.className = 'badge badge-sm mr-1 mb-1'; d.textContent = text; pdinEl.appendChild(d); }
      if (dest === 'pdout' && pdoutEl) { const d = document.createElement('span'); d.className = 'badge badge-sm mr-1 mb-1'; d.textContent = text; pdoutEl.appendChild(d); }
      if (btnEl) btnEl.classList.add('opacity-50', 'pointer-events-none');
      if (Object.keys(placed).length === 4 && feedbackEl) {
        const correct = placed['LED command'] === 'pdout' && placed['Measured value'] === 'pdin' && placed['Setpoint'] === 'pdout' && placed['Event flags'] === 'pdin';
        feedbackEl.classList.remove('hidden');
        feedbackEl.textContent = correct ? 'Correct! PDin = master reads, PDout = master sends.' : 'Check which direction each goes.';
        feedbackEl.className = 'learn-sort-feedback mt-2 text-sm font-medium ' + (correct ? 'text-success' : 'text-warning');
      }
    }
    items.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (placed[btn.textContent]) return;
        items.forEach(function (b) { b.classList.remove('ring-2', 'ring-primary'); });
        selectedItem = { text: btn.textContent.trim(), dest: btn.getAttribute('data-dest'), el: btn };
        btn.classList.add('ring-2', 'ring-primary');
      });
    });
    if (pdinEl) {
      pdinEl.addEventListener('click', function () {
        if (!selectedItem) return;
        if (selectedItem.dest === 'pdin') placeItem(selectedItem.text, 'pdin', selectedItem.el);
        selectedItem = null;
        items.forEach(function (b) { b.classList.remove('ring-2', 'ring-primary'); });
      });
    }
    if (pdoutEl) {
      pdoutEl.addEventListener('click', function () {
        if (!selectedItem) return;
        if (selectedItem.dest === 'pdout') placeItem(selectedItem.text, 'pdout', selectedItem.el);
        selectedItem = null;
        items.forEach(function (b) { b.classList.remove('ring-2', 'ring-primary'); });
      });
    }

    const flowEl = container.querySelector('.learn-pd-flow');
    if (flowEl) {
      const lines = [];
      function addFlow(dir, msg) {
        lines.push('<span class="' + (dir === 'out' ? 'text-primary' : 'text-secondary') + '">' + msg + '</span>');
        if (lines.length > 15) lines.shift();
        flowEl.innerHTML = lines.map(function (l) { return '<div>' + l + '</div>'; }).join('');
        flowEl.scrollTop = flowEl.scrollHeight;
      }
      const t = setInterval(function () {
        if (Math.random() > 0.5) addFlow('out', 'PDout → 0x' + Math.floor(Math.random() * 256).toString(16));
        else addFlow('in', 'PDin ← 0x' + Math.floor(Math.random() * 256).toString(16));
      }, 1000);
      learnSimTimers.push(t);
    }
  }

  // ---- Chapter 3: Build the twin + twin sim ----
  if (idx === 2) {
    const submitBtn = container.querySelector('.learn-twin-submit');
    const feedbackEl = container.querySelector('.learn-twin-feedback');
    if (submitBtn && feedbackEl) {
      submitBtn.addEventListener('click', function () {
        const checks = container.querySelectorAll('.learn-twin-cb');
        let allCorrect = true;
        checks.forEach(function (cb) {
          const label = cb.closest('label');
          const correct = label && label.getAttribute('data-correct') === 'true';
          if (cb.checked !== correct) allCorrect = false;
        });
        feedbackEl.classList.remove('hidden');
        feedbackEl.textContent = allCorrect ? 'Correct! Port status, PDin/PDout, and supervision & events make up the digital twin.' : 'Uncheck "Weather forecast" and ensure the three twin components are checked.';
        feedbackEl.className = 'learn-twin-feedback mt-2 text-sm font-medium ' + (allCorrect ? 'text-success' : 'text-warning');
      });
    }
    const portEl = container.querySelector('.learn-twin-port');
    const pdinEl = container.querySelector('.learn-twin-pdin');
    const pdoutEl = container.querySelector('.learn-twin-pdout');
    const tempEl = container.querySelector('.learn-twin-temp');
    if (portEl || pdinEl || pdoutEl || tempEl) {
      const t = setInterval(function () {
        if (portEl) portEl.textContent = Math.random() > 0.1 ? 'OK' : 'Error';
        if (pdinEl) pdinEl.textContent = '0x' + Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
        if (pdoutEl) pdoutEl.textContent = '0x' + Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
        if (tempEl) tempEl.textContent = (20 + Math.floor(Math.random() * 10)) + ' °C';
      }, 1500);
      learnSimTimers.push(t);
    }
  }

  // ---- Chapter 4: Pick the LED + LED cycle ----
  if (idx === 3) {
    const scenarioEl = container.querySelector('.learn-led-scenario');
    const pickBtns = container.querySelectorAll('.learn-led-pick');
    const feedbackEl = container.querySelector('.learn-led-pick-feedback');
    const scenarios = [
      { text: '"Machine is running normally."', correctIndex: 0 },
      { text: '"Attention needed soon."', correctIndex: 1 },
      { text: '"Fault — short circuit."', correctIndex: 2 }
    ];
    let scenarioIdx = 0;
    function setScenario() {
      const s = scenarios[scenarioIdx % 3];
      if (scenarioEl) scenarioEl.textContent = s.text;
      scenarioIdx++;
    }
    setScenario();
    pickBtns.forEach(function (btn, index) {
      btn.addEventListener('click', function () {
        const s = scenarios[(scenarioIdx - 1) % 3];
        const correct = s && index === s.correctIndex;
        if (feedbackEl) { feedbackEl.classList.remove('hidden'); feedbackEl.textContent = correct ? 'Correct!' : 'Try again.'; feedbackEl.className = 'learn-led-pick-feedback mt-2 text-sm font-medium ' + (correct ? 'text-success' : 'text-error'); }
        if (correct) setTimeout(setScenario, 600);
      });
    });

    const dotEl = container.querySelector('.learn-led-cycle-dot');
    const labelEl = container.querySelector('.learn-led-cycle-label');
    if (dotEl && labelEl) {
      const states = [{ c: 'bg-success', l: 'Running' }, { c: 'bg-warning', l: 'Warning' }, { c: 'bg-error', l: 'Fault' }];
      let si = 0;
      const t = setInterval(function () {
        si = (si + 1) % 3;
        dotEl.className = 'learn-led-cycle-dot w-8 h-8 rounded-full transition-colors ' + states[si].c;
        labelEl.textContent = states[si].l;
      }, 2000);
      learnSimTimers.push(t);
    }
  }

  // ---- Chapter 5: Trend match + signal chart ----
  if (idx === 4) {
    let selectedTrend = null;
    const leftBtns = container.querySelectorAll('.learn-trend-left');
    const rightBtns = container.querySelectorAll('.learn-trend-right');
    const resultEl = container.querySelector('.learn-trend-result');
    const correctPairs = { '1': 'a', '2': 'b' };
    leftBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        leftBtns.forEach(function (b) { b.classList.remove('ring-2', 'ring-primary'); });
        btn.classList.add('ring-2', 'ring-primary');
        selectedTrend = btn.getAttribute('data-id');
      });
    });
    rightBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (selectedTrend === null) return;
        const rightId = btn.getAttribute('data-id');
        const ok = correctPairs[selectedTrend] === rightId;
        if (resultEl) { resultEl.classList.remove('hidden'); resultEl.textContent = ok ? 'Correct! Dropping signal → clean lens; stable 100% → no action.' : 'Not quite. Signal dropping → clean lens; stable → no action.'; resultEl.className = 'learn-trend-result mt-2 text-sm font-medium ' + (ok ? 'text-success' : 'text-warning'); }
      });
    });

    const canvas = container.querySelector('.learn-signal-chart');
    if (canvas) {
      const data = [];
      for (let i = 0; i < 20; i++) data.push(70 + Math.random() * 30);
      const chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: data.map(function (_, i) { return i; }),
          datasets: [{ label: 'Signal %', data: data, borderColor: 'hsl(var(--p))', backgroundColor: 'rgba(0,0,0,0)', fill: false, tension: 0.3 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } }, plugins: { legend: { display: false } } }
      });
      learnCharts.push(chart);
      const t = setInterval(function () {
        data.push(60 + Math.random() * 40);
        if (data.length > 30) data.shift();
        chart.data.labels = data.map(function (_, i) { return i; });
        chart.data.datasets[0].data = data;
        chart.update('none');
      }, 1500);
      learnSimTimers.push(t);
    }
  }

  // ---- Chapter 6: Order steps + temp chart ----
  if (idx === 5) {
    const orderList = container.querySelector('.learn-order-list');
    const orderBtns = container.querySelectorAll('.learn-order-btn');
    const feedbackEl = container.querySelector('.learn-order-feedback');
    const sequence = [];
    function renderOrder() {
      if (!orderList) return;
      orderList.innerHTML = sequence.map(function (o, i) { return (i + 1) + '. ' + o.text; }).join('');
      if (sequence.length === 4) {
        const correct = sequence[0].order === '1' && sequence[1].order === '2' && sequence[2].order === '3' && sequence[3].order === '4';
        if (feedbackEl) { feedbackEl.classList.remove('hidden'); feedbackEl.textContent = correct ? 'Correct order!' : 'Correct order: 1→See trend, 2→Identify hotspot, 3→Plan maintenance, 4→Schedule repair.'; feedbackEl.className = 'learn-order-feedback mt-2 text-sm font-medium ' + (correct ? 'text-success' : 'text-warning'); }
      }
    }
    orderBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (sequence.length >= 4) return;
        if (sequence.some(function (s) { return s.order === btn.getAttribute('data-order'); })) return;
        sequence.push({ order: btn.getAttribute('data-order'), text: btn.textContent });
        renderOrder();
      });
    });

    const canvas = container.querySelector('.learn-temp-chart');
    if (canvas) {
      const data = [];
      for (let i = 0; i < 20; i++) data.push(20 + Math.random() * 8);
      const chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: data.map(function (_, i) { return i; }),
          datasets: [{ label: '°C', data: data, borderColor: 'hsl(var(--er))', backgroundColor: 'rgba(0,0,0,0)', fill: false, tension: 0.3 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 15, max: 35 } }, plugins: { legend: { display: false } } }
      });
      learnCharts.push(chart);
      const t = setInterval(function () {
        data.push(20 + Math.random() * 10);
        if (data.length > 30) data.shift();
        chart.data.labels = data.map(function (_, i) { return i; });
        chart.data.datasets[0].data = data;
        chart.update('none');
      }, 1500);
      learnSimTimers.push(t);
    }
  }

  // ---- Chapter 7: Replace or Monitor + cycle chart ----
  if (idx === 6) {
    const romBtns = container.querySelectorAll('.learn-rom');
    const feedbackEl = container.querySelector('.learn-rom-feedback');
    const scenarioDone = {};
    romBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const scenario = btn.getAttribute('data-scenario');
        const correct = btn.getAttribute('data-correct');
        const isReplace = btn.textContent.trim().toLowerCase() === 'replace';
        const ok = (scenario === '1' && isReplace) || (scenario === '2' && !isReplace);
        scenarioDone[scenario] = ok;
        if (feedbackEl) {
          feedbackEl.classList.remove('hidden');
          const both = scenarioDone['1'] && scenarioDone['2'];
          feedbackEl.textContent = both ? 'Correct! Near MTTF → replace; healthy low cycles → monitor.' : (ok ? 'Good. Now do the other scenario.' : 'Think: cycle near limit → replace; healthy → monitor.');
          feedbackEl.className = 'learn-rom-feedback mt-2 text-sm font-medium ' + (both ? 'text-success' : ok ? 'text-base-content/80' : 'text-warning');
        }
      });
    });

    const canvas = container.querySelector('.learn-cycle-chart');
    if (canvas) {
      const data = [];
      for (let i = 0; i < 20; i++) data.push(1000 + i * 200 + Math.random() * 100);
      const chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: data.map(function (_, i) { return i; }),
          datasets: [{ label: 'Cycles', data: data, borderColor: 'hsl(var(--in))', backgroundColor: 'rgba(0,0,0,0)', fill: false, tension: 0.3 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0 } }, plugins: { legend: { display: false } } }
      });
      learnCharts.push(chart);
      const t = setInterval(function () {
        const last = data[data.length - 1] || 0;
        data.push(last + 50 + Math.random() * 100);
        if (data.length > 30) data.shift();
        chart.data.labels = data.map(function (_, i) { return i; });
        chart.data.datasets[0].data = data;
        chart.update('none');
      }, 1200);
      learnSimTimers.push(t);
    }
  }
}
