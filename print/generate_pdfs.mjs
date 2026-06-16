/**
 * generate_pdfs.mjs
 *
 * Standalone script — reads worksheet content directly from the app source
 * files without modifying them, renders each worksheet via Puppeteer, and
 * saves four PDFs to print/output/.
 *
 * Usage:
 *   cd print
 *   npm install
 *   node generate_pdfs.mjs
 *
 * Outputs:
 *   output/CP0001.pdf          — student workbook
 *   output/CP0001 Answers.pdf  — trainer answer key
 *   output/CP0002.pdf
 *   output/CP0002 Answers.pdf
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import puppeteer from 'puppeteer';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC   = resolve(__dir, '..', 'src');
const OUT   = resolve(__dir, 'output');
mkdirSync(OUT, { recursive: true });

// ─────────────────────────────────────────────────────────────────────────────
// 1. EXTRACT contentHtml from JS source files
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract the content of a JS template literal starting at position `start`
 * (which should point to the opening backtick).
 * Handles nested ${...} expressions and escaped backticks.
 * Returns [content, endIndex] where endIndex is the closing backtick position.
 */
function extractTemplateLiteral(src, start) {
  let i = start + 1;
  let depth = 0;       // ${ nesting level
  let strChar = null;  // active string delimiter inside ${}
  const out = [];

  while (i < src.length) {
    const c = src[i];

    // Backslash escape — always consume the next char verbatim
    if (c === '\\' && i + 1 < src.length) {
      out.push(src.slice(i, i + 2));
      i += 2;
      continue;
    }

    if (depth === 0) {
      if (c === '`') return [out.join(''), i];  // closing backtick
      if (c === '$' && src[i + 1] === '{') {
        depth++;
        i += 2;
        continue;
      }
      out.push(c);
      i++;
    } else {
      // Inside ${...} — skip until matching }
      if (strChar) {
        if (c === strChar) strChar = null;
        i++;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { strChar = c; i++; continue; }
      if (c === '{') depth++;
      else if (c === '}') { if (--depth === 0) { i++; continue; } }
      i++;
    }
  }
  return [out.join(''), -1];
}

/**
 * Parse a worksheet JS file and extract an array of worksheet objects.
 * Each object has: id, title, shortDesc, estimatedTime, whyItMatters, contentHtml.
 */
function extractWorksheets(jsPath) {
  const src = readFileSync(jsPath, 'utf8');
  const worksheets = [];
  const seen = new Set();

  // Match each worksheet object opening — { id: N,
  const re = /\{\s*\n?\s*id:\s*(\d+)\s*,/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const wsId = parseInt(m[1], 10);
    if (seen.has(wsId)) continue;

    const chunk = src.slice(m.index, m.index + 1200);

    const title     = (chunk.match(/title:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/)  || [])[1] || `WS${wsId}`;
    const shortDesc = (chunk.match(/shortDesc:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/) || [])[1] || '';
    const estTime   = (chunk.match(/estimatedTime:\s*'([^'\\]*)'/) || [])[1] || '';
    const why       = (chunk.match(/whyItMatters:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/) || [])[1] || '';

    const keyPos = src.indexOf('contentHtml:', m.index);
    if (keyPos === -1 || keyPos > m.index + 3000) continue;

    const btPos = src.indexOf('`', keyPos + 'contentHtml:'.length);
    if (btPos === -1) continue;

    const [html] = extractTemplateLiteral(src, btPos);

    seen.add(wsId);
    worksheets.push({
      id:            wsId,
      title:         title.replace(/\\'/g, "'"),
      shortDesc:     shortDesc.replace(/\\'/g, "'"),
      estimatedTime: estTime,
      whyItMatters:  why.replace(/\\'/g, "'"),
      contentHtml:   html,
    });
  }

  return worksheets.sort((a, b) => a.id - b.id);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MCQ DATA  (correct answers + option text for both courses)
// ─────────────────────────────────────────────────────────────────────────────

// Each entry corresponds to worksheet index (1-based).
// Structure: { questions, scenarios, freetext, tables }
// This mirrors the data already used in generate_docx.py — kept here
// so this script is fully self-contained.

const CP0001_MCQ = [
  // WS1
  { questions: [
    { q: 'What colour is the IO-Link Master, and what is it sometimes called?',
      options: [['A','Orange — it is called the hub'],['B','Blue — it is called the controller'],['C','Green — it is called the gateway']], correct: 'A' },
    { q: 'Which sensor detects metal objects using an electromagnetic field?',
      options: [['A','The capacitive sensor on Port 2'],['B','The temperature sensor on Port 3'],['C','The proximity sensor on Port 1']], correct: 'C' },
    { q: 'What can the capacitive sensor detect that the proximity sensor cannot?',
      options: [['A','Objects moving faster than 1 m/s'],['B','Materials like liquid or powder — even through a container wall'],['C','The exact temperature of an object']], correct: 'B' },
    { q: "What is the Raspberry Pi's job in this system?",
      options: [['A','It collects the sensor data, runs the comms, and serves up this dashboard'],['B','It powers the IO-Link Master via USB'],['C','It directly controls the light stack colours']], correct: 'A' },
    { q: 'During the challenge, what did you notice about the capacitive sensor?',
      options: [['A','It only ever shows two states — on or off — same as a normal sensor'],['B','It measured the exact distance between your hand and the sensor in millimetres'],['C','It showed a live level rising as your hand got close, before it fully triggered']], correct: 'C' },
  ]},
  // WS2
  { questions: [
    { q: 'A basic digital (on/off) proximity sensor fails and its output goes silent. What diagnostic information can a technician retrieve from it?',
      options: [['A','Nothing — the sensor just goes silent, you have to go and test it manually'],['B','The exact fault code and which internal component has failed'],['C','The last reading before it failed, stored in its internal log']], correct: 'A' },
    { q: 'A pressure transmitter outputs 12 mA on a 4–20 mA loop calibrated 0–100 bar. What is the pressure?',
      options: [['A','12 bar — the mA value equals the bar reading directly'],['B','0 bar — the sensor is in fault'],['C','50 bar — 12 mA is the midpoint of the 4–20 mA range, mapping to 50% of 100 bar']], correct: 'C' },
    { q: 'An IO-Link sensor still has OUT1 active. What does the IO-Link channel add on top?',
      options: [['A','Process data, fault codes, device identity, and remote parameter writes — all over the same 3-wire cable without interrupting OUT1'],['B','It replaces OUT1 entirely'],['C','A higher voltage signal']], correct: 'A' },
    { q: 'Why choose an analogue sensor over a digital sensor for tank level monitoring?',
      options: [['A','Analogue sensors are cheaper and easier to wire'],['B','Analogue sensors send fault codes that digital sensors cannot'],['C','An analogue signal gives a continuous level reading — you see exactly how full the tank is']], correct: 'C' },
    { q: 'In the IO-Link wire animation, what does the square wave at the bottom of the cable represent?',
      options: [['A','The IO-Link data packets being encoded onto the wire'],['B','The standard switching output (OUT1) — still present while the data stream runs above it'],['C','The power supply waveform']], correct: 'B' },
  ]},
  // WS3 (Photoelectric — no MCQs in MCQ data)
  {},
  // WS4 (Capacitive)
  { questions: [
    { q: 'What triggers a new count?',
      options: [['A','Every second while your hand is touching'],['B','Only when you pull your hand away'],['C','The moment detection goes from off to on — one touch = one count, no matter how long you hold it']], correct: 'C' },
    { q: 'Which materials can a capacitive sensor detect that a proximity sensor cannot?',
      options: [['A','Water and powder — even through a container wall'],['B','Sound and light'],['C','Heat and pressure']], correct: 'A' },
    { q: 'The capacitive sensor output is always ON even when nothing is near it. Most likely cause?',
      options: [['A','Sensitivity too high — it is detecting the container wall or nearby objects'],['B','The sensor needs replacing immediately'],['C','The cable is the wrong colour']], correct: 'A' },
  ]},
  // WS5 (Temperature)
  { questions: [
    { q: 'What extra can you do with an IO-Link temperature sensor vs. a basic switch?',
      options: [['A','Nothing extra — it works exactly the same'],['B','It only works above 100 °C'],['C','See the actual live temperature in °C, trend it over time, and get early warning before the trip point']], correct: 'C' },
    { q: 'Move SP1 just above current temperature and hold the sensor. What should happen?',
      options: [['A','Nothing — alarm only activates from the main dashboard'],['B','The alarm state turns red and shows "ABOVE THRESHOLD" once the temperature crosses your slider value'],['C','The sensor turns itself off']], correct: 'B' },
    { q: 'Temperature reading suddenly drops to −40 °C in a room-temperature lab. Most likely cause?',
      options: [['A','Broken or disconnected sensor — −40 °C is the bottom of the TV7105 measurement range and appears when the sensing element is open-circuit'],['B','The lab is very cold'],['C','The setpoint has been changed']], correct: 'A' },
  ]},
  // WS6 (Light Stack)
  { questions: [
    { q: 'The CL50 is "PDout-only". What does that mean?',
      options: [['A','The master sends a command value TO the light — no measurement data comes back'],['B','It only works with certain IO-Link masters'],['C','It uses a separate digital output wire for each colour segment']], correct: 'A' },
    { q: 'The hex value 180101 is sent to the CL50. Which colour will it show?',
      options: [['A','Green — Octet2 low nibble = 0x00'],['B','Amber — 0x18 in Octet0 indicates Amber'],['C','Red — Octet2 low nibble = 0x01 = Red (index 1)']], correct: 'C' },
    { q: 'Flashing red will not turn off after the fault is cleared. Most likely cause?',
      options: [['A','The PLC is still sending a "red on" PDout command — the fault state is held in the controller, not the light itself'],['B','The light stack hardware is broken'],['C','IO-Link has lost connection']], correct: 'A' },
    { q: 'Why is IO-Link PDout better than a traditional 3-wire digital light stack?',
      options: [['A','Always cheaper per unit'],['B','The colour cannot be changed once wired'],['C','Full control of colour, animation, intensity, and speed over a single 3-pin cable']], correct: 'C' },
  ],
  scenarios: [{ title: 'Maintenance Scenario (LST-0312) — Step 2 Diagnosis',
    intro: 'The light is showing Flashing Amber but all sensors and the PLC are healthy. Select the most likely root cause.',
    options: [['A','The CL50 hardware is malfunctioning — the amber segment is stuck'],['B','IO-Link comms to Port 4 have dropped — light locked to last command'],['C','The PLC output register is still holding the pre-maintenance fault PDout value (184203 — Amber Flash). The normal-run value (000100 — Green Steady) was never sent after the PLC restarted']],
    correct: 'C' }] },
  // WS7 (Fault Finding)
  { scenarios: [{ title: 'Maintenance Scenario — Port 1 OUT1 Permanently ON',
    intro: 'Port 1 OUT1 is permanently ON with nothing in front of the sensor. IO-Link comms are normal. Your manager says he did not touch Port 1. Select the most likely explanation.',
    options: [['A','IO-Link communication to Port 1 has dropped — master frozen on last reported state'],['B','The inductive sensor hardware has failed — output transistor shorted permanently'],['C','The sensor output logic is set to NC (Normal Closed) — OUT1 is ON when nothing is detected and OFF when an object is present. This is the inverse of the correct NO setting']],
    correct: 'C' }] },
  // WS8 (Final Assessment)
  { freetext: [
    { q: 'Task 2A — Hex Decode: Index 583 (SP1) returns 01 F4 (int16, scale ×0.1). What is the setpoint in °C?', answer: '50.0 °C  (0x01F4 = 500; 500 × 0.1 = 50.0)' },
    { q: 'Task 3 — PDout Colour: PDout value 000109 is sent to the CL50. What colour will it show?', answer: 'Blue  (Octet2 = 0x09; low nibble = 9 = Blue)' },
  ],
  questions: [
    { q: 'Task 4 / Q1 — The Omron E2E instability alarm fires but OUT1 is still switching correctly. What is the right course of action?',
      options: [['A','Ignore it — the output is working so there is no problem'],['B','Replace the sensor immediately'],['C','Investigate — instability means the target is at the edge of sensing range. Small vibrations will cause intermittent output. Reposition the target or adjust the sensing distance before it causes a fault']], correct: 'C' },
    { q: 'Task 4 / Q2 — After replacing the capacitive sensor on Port 2, its output is ON even with nothing near it. Re-teaching did not fix it. Most likely cause?',
      options: [['A','Output logic is set to NC — sensor output is inverted so it is ON when nothing is present. Read the output logic parameter via ISDU to confirm, then write NO (0) to correct it'],['B','The IO-Link cable polarity is reversed — swap Pin 2 and Pin 4 at the master connector'],['C','SP1 is set correctly — the container wall is triggering the output and this is expected behaviour for a capacitive sensor']], correct: 'A' },
    { q: 'Task 4 / Q3 — A temperature sensor reading drifts 3 °C high after months in service. Correct IO-Link field action?',
      options: [['A','Replace the sensor — drift always indicates a faulty unit'],['B','Write a −3.0 °C calibration offset to the sensor via ISDU (index 681), verified against a reference thermometer'],['C','Adjust SP1 down by 3 °C to compensate']], correct: 'B' },
    { q: 'Task 4 / Q4 — Key advantage of the IO-Link light stack over a conventionally wired one?',
      options: [['A','IO-Link light stacks use less power'],['B','IO-Link light stacks can display more colours'],['C','All colours, animation patterns, and intensity levels are set by a single 3-byte PDout value over one standard cable. Conventional wiring needs a separate signal wire per segment']], correct: 'C' },
  ]},
];

const CP0002_MCQ = [
  // WS1
  { questions: [
    { q: 'What is the IP address of the AL1350 IO-Link Master?', options: [['A','192.168.7.4'],['B','192.168.7.2'],['C','192.168.1.1']], correct: 'A' },
    { q: 'The AL1350 pushes data every 500 ms. How many WebSocket messages per second does the browser receive?', options: [['A','20 messages per second'],['B','2 messages per second'],['C','500 messages per second — 500 ms equals 500 per second']], correct: 'B' },
    { q: 'The Raspberry Pi has eth0 and wlan0. Why does this matter?', options: [['A','Allows two IO-Link masters simultaneously'],['B','Doubles bandwidth by bonding both interfaces'],['C','Bridges the isolated IO-Link subnet to the building LAN']], correct: 'C' },
    { q: 'How many IO-Link ports have a sensor connected in this kit?', options: [['A','4 — Ports 1 through 4 each have a sensor'],['B','8 — every port is populated'],['C','2 — only photoelectric and capacitive']], correct: 'A' },
  ]},
  // WS2
  { questions: [
    { q: 'Why is MQTT better suited than HTTP polling for 500 ms sensor delivery?', options: [['A','MQTT uses publish/subscribe so the AL1350 pushes data the moment it is ready, without the Pi having to request each cycle'],['B','HTTP is push-based with persistent connections'],['C','MQTT guarantees delivery by queuing until acknowledgement']], correct: 'A' },
    { q: 'The AL1350 loses its MQTT subscriptions on power-cycle. How does the backend handle this?', options: [['A','Waits for manual re-subscribe'],['B','Switches permanently to HTTP polling'],['C','Calls ensure_mqtt_subscription() on every backend startup, re-registering the push subscription automatically']], correct: 'C' },
    { q: 'If the FastAPI backend crashed, what would you observe?', options: [['A','Live data would stop and the WebSocket would disconnect'],['B','WebSocket counter continues at normal rate'],['C','AL1350 automatically restarts the backend']], correct: 'A' },
    { q: 'What does consistently high round-trip latency on Connection Diagnostics indicate?', options: [['A','Browser chart rendering cannot keep up'],['B','The AL1350 is under load or there is congestion on the IO-Link subnet'],['C','Pi Wi-Fi is saturated']], correct: 'B' },
  ]},
  // WS3
  { questions: [
    { q: 'Q1 (Proximity): Raw PDin hex 0x01 — switching output state?', options: [['A','Object detected (bit 0 = 1)'],['B','No object detected'],['C','Sensor fault']], correct: 'A' },
    { q: 'Q2 (Capacitive): Why is a detection count more useful than just the switching state?', options: [['A','Gives a continuous analogue level reading'],['B','Prevents false positives from water or foam'],['C','A running count tracks how many containers have been filled without a separate counter sensor']], correct: 'C' },
    { q: 'Q3 (Temperature): Raw PDin 0x02EE decodes to what temperature?', options: [['A','7.5 °C — wrong scale factor (÷100)'],['B','750.0 °C — no scaling applied'],['C','75.0 °C']], correct: 'C' },
    { q: 'Q4 (CL50): Why does building a PDout command for the CL50 require more care than reading a proximity sensor\'s PDin?', options: [['A','Multiple fields — colour, animation, intensity, and speed — must be packed into specific bit positions across 3 bytes. One wrong bit changes the entire behaviour'],['B','Uses a completely different IO-Link variant'],['C','CL50 PDin arrives as plain text']], correct: 'A' },
  ]},
  // WS4
  { tables: [{ header: 'Matching Exercise — drag each IO-Link feature to the maintenance problem it solves.',
    cols: ['Maintenance Problem','IO-Link Feature'],
    rows: [['Sensor fails without warning','___'],['Replacing a sensor loses its configuration','___'],['Unknown which sensor on the line failed','___'],['Planning when to replace a sensor','___']],
    answers: [['Sensor fails without warning','event data'],['Replacing a sensor loses its configuration','service data (parameter store)'],['Unknown which sensor on the line failed','event data'],['Planning when to replace a sensor','event data (lifecycle counter)']],
  }],
  questions: [
    { q: 'Which data type does the WebSocket push to the browser on every tick?', options: [['A','Process data + event data merged into a single JSON payload'],['B','Service data only'],['C','Raw binary PDin only']], correct: 'A' },
  ]},
  // WS5
  { tables: [{ header: 'Decode each raw PDin hex value to an engineering value.',
    cols: ['Hex Value','Type','Scale','Your Answer'],
    rows: [['00 E6','int16','×0.1','___'],['00 64','uint16','none','___'],['01 F4','int16','×0.1','___']],
    answers: [['00 E6','int16','×0.1','23.0 °C'],['00 64','uint16','none','100 counts'],['01 F4','int16','×0.1','50.0 °C']],
  }]},
  // WS6
  { tables: [{ header: 'Classify each data item as process, event, or service.',
    cols: ['Data Item','Type'],
    rows: [['Temperature 23.5°C every 500ms','___'],['Device replacement detected on Port 2','___'],['Parameter read — filter time 10ms','___'],['Object present flag','___'],['Short circuit fault','___']],
    answers: [['Temperature 23.5°C every 500ms','process'],['Device replacement detected on Port 2','event'],['Parameter read — filter time 10ms','service'],['Object present flag','process'],['Short circuit fault','event']],
  }]},
  // WS7
  { questions: [
    { q: 'How does IO-Link process data reach a PLC I/O scan cycle?', options: [['A','Sensor connects directly to PLC input card; master only provides power'],['B','Sensor transmits binary frames over Wi-Fi directly to PLC memory'],['C','The IO-Link master maps each port\'s PDin into its process image; the PLC reads this via a fieldbus on every scan cycle']], correct: 'C' },
    { q: 'Key advantage of a web HMI over walking to the machine?', options: [['A','Walking is always preferred for physical inspection'],['B','Web HMI only works with stable internet'],['C','Faster fault identification, multi-machine monitoring, and historical trends without a site visit']], correct: 'C' },
    { q: 'What does a spike in Connection Diagnostics latency indicate?', options: [['A','High latency on the IO-Link subnet or the AL1350 being overloaded'],['B','Browser tab consuming too much memory'],['C','Pi MQTT broker stopped forwarding messages']], correct: 'A' },
  ]},
  // WS8
  { questions: [
    { q: 'Annual downtime saving when switching to IO-Link? (Standard: 40×35min=23.3h; IO-Link: 40×8min=5.3h)', options: [['A','18 hours per year'],['B','5.3 hours per year'],['C','23.3 hours per year']], correct: 'A' },
    { q: 'At £5,000/hour production value, annual financial saving?', options: [['A','£175,000'],['B','£26,500'],['C','£90,000']], correct: 'C' },
    { q: 'Which pair of benefits most reduces total cost of ownership beyond MTTR?', options: [['A','Wireless backup and automatic IP provisioning'],['B','Automatic parameter restore on sensor swap and remote diagnostics via HMI'],['C','Lower per-unit cost via IO-Link certification']], correct: 'B' },
    { q: 'Which data type would you export to a CMMS to automate maintenance work orders?', options: [['A','Event data (faults and warnings) — these are the triggers for maintenance actions'],['B','Only process data'],['C','Service data only']], correct: 'A' },
  ]},
  // WS9
  { questions: [
    { q: 'What Vendor ID does Port 1 (Omron proximity) report?', options: [['A','612'],['B','310'],['C','1586']], correct: 'A' },
    { q: 'Which manufacturer does Vendor ID 612 identify?', options: [['A','ifm electronic'],['B','OMRON Corporation'],['C','Balluff']], correct: 'B' },
    { q: 'Why does knowing the Device ID matter when ordering a spare?', options: [['A','Master uses it to set the sensor\'s IP address'],['B','Shows the sensor\'s remaining service life'],['C','Uniquely identifies the exact model so you order the right part first time and the master can restore parameters automatically after swap']], correct: 'C' },
    { q: 'Port 1 shows PDin byte 1 bit 4 set (instability alarm). Correct maintenance response?', options: [['A','Check sensor alignment — target is likely at the edge of the sensing range'],['B','No action — instability means the sensor passed its self-test'],['C','Replace immediately — bit 4 means permanent hardware fault']], correct: 'A' },
    { q: 'Port 2 shows Vendor ID 1586, Device ID 1052673. Which spare to order?', options: [['A','IFM TV7105 temperature sensor'],['B','OMRON E2E-X16MB1T12 proximity sensor'],['C','RS Pro M18 capacitive sensor (Carlo Gavazzi OEM, product code 2377240)']], correct: 'C' },
  ]},
  // WS10 — decode exercises, no radio MCQs
  { tables: [{ header: 'Decode each PT100 PDin hex value to a temperature.',
    cols: ['PDin Hex','Calculation','Answer'],
    rows: [['01 2C FF 00','0x012C = ? ÷ 10','___'],['01 96 FF 00','0x0196 = ? ÷ 10','___'],['FF 9C FF 00','0xFF9C = ? (int16) ÷ 10','___'],['FE 70 00 00','0xFE70 = ? (int16) ÷ 10','___']],
    answers: [['01 2C FF 00','0x012C = 300 ÷ 10','30.0 °C'],['01 96 FF 00','0x0196 = 406 ÷ 10','40.6 °C'],['FF 9C FF 00','0xFF9C = −100 ÷ 10','−10.0 °C'],['FE 70 00 00','0xFE70 = −400 ÷ 10','−40.0 °C (open-circuit)']],
  }]},
  // WS11 — encode/decode, no radio MCQs
  { tables: [
    { header: 'Decode each PDout hex value.',
      cols: ['PDout Hex','Your Interpretation'],
      rows: [['000100','___'],['004312','___'],['198205','___']],
      answers: [['000100','Green · Steady · High intensity — AL1350 startup default'],['004312','Orange/Red · Two Colour Flash · Fast'],['198205','Lime Green · Flashing · Slow · Low intensity']],
    },
    { header: 'Encode: build the PDout hex for each specification.',
      cols: ['Specification','Your Hex'],
      rows: [['Blue · Steady · High intensity','___'],['Cyan/Magenta · Two Colour Flash · Fast','___']],
      answers: [['Blue · Steady · High intensity','180109'],['Cyan/Magenta · Two Colour Flash · Fast','0043B7']],
    },
  ]},
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. MCQ HTML renderer (injected after worksheet content)
// ─────────────────────────────────────────────────────────────────────────────

function renderMcqHtml(mcq, showAnswers) {
  if (!mcq) return '';
  const parts = ['<div class="mcq-section"><h2 class="mcq-title">Knowledge Check</h2>'];

  // Tables
  for (const tbl of mcq.tables || []) {
    parts.push(`<p class="tbl-header"><strong>${tbl.header}</strong></p>`);
    parts.push('<table class="mcq-table"><thead><tr>');
    tbl.cols.forEach(c => parts.push(`<th>${c}</th>`));
    parts.push('</tr></thead><tbody>');
    const rows = showAnswers ? tbl.answers : tbl.rows;
    rows.forEach((row, ri) => {
      parts.push(`<tr class="${ri % 2 ? 'alt' : ''}">`);
      row.forEach((cell, ci) => {
        const isAnswer = showAnswers && ci === row.length - 1;
        parts.push(`<td class="${isAnswer ? 'answer-cell' : ''}">${cell}</td>`);
      });
      parts.push('</tr>');
    });
    parts.push('</tbody></table>');
  }

  // Free-text
  for (const ft of mcq.freetext || []) {
    parts.push(`<div class="freetext-q"><p><strong>${ft.q}</strong></p>`);
    if (showAnswers) {
      parts.push(`<p class="answer-text">Answer: ${ft.answer}</p>`);
    } else {
      parts.push('<div class="answer-blank"></div>');
    }
    parts.push('</div>');
  }

  // MCQs
  let qi = 0;
  for (const q of mcq.questions || []) {
    qi++;
    parts.push(`<div class="mcq-q"><p class="q-text"><strong>Q${qi}.</strong> ${q.q}</p><ul class="options">`);
    for (const [letter, text] of q.options) {
      const correct = letter === q.correct;
      if (showAnswers && correct) {
        parts.push(`<li class="option correct"><span class="tick">✓</span><span class="letter">${letter})</span> ${text}</li>`);
      } else {
        parts.push(`<li class="option${showAnswers ? ' dim' : ''}"><span class="letter">${letter})</span> ${text}</li>`);
      }
    }
    parts.push('</ul></div>');
  }

  // Scenarios
  for (const sc of mcq.scenarios || []) {
    parts.push(`<div class="scenario-q"><p class="scenario-title"><strong>${sc.title}</strong></p>`);
    if (sc.intro) parts.push(`<p class="scenario-intro">${sc.intro}</p>`);
    if (sc.options) {
      parts.push('<ul class="options">');
      for (const [letter, text] of sc.options) {
        const correct = letter === sc.correct;
        if (showAnswers && correct) {
          parts.push(`<li class="option correct"><span class="tick">✓</span><span class="letter">${letter})</span> ${text}</li>`);
        } else {
          parts.push(`<li class="option${showAnswers ? ' dim' : ''}"><span class="letter">${letter})</span> ${text}</li>`);
        }
      }
      parts.push('</ul>');
    }
    parts.push('</div>');
  }

  parts.push('</div>');
  return parts.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. HTML PAGE TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────

function buildPage(ws, mcq, showAnswers, courseTitle) {
  const mcqHtml = renderMcqHtml(mcq, showAnswers);
  const answerBadge = showAnswers
    ? '<div class="answer-key-badge">ANSWER KEY</div>'
    : '';

  return `<!DOCTYPE html>
<html lang="en" data-theme="corporate">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- No CDN — all styles are custom below to avoid network timeouts -->
<style>
  /* ── Page / print setup ── */
  @page { size: A4; margin: 18mm 20mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { font-family: 'Inter', system-ui, sans-serif; font-size: 13px; background: white; color: #1e293b; }

  /* ── Worksheet header ── */
  .ws-header { border-bottom: 3px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 16px; }
  .course-label { font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; }
  .ws-title { font-size: 22px; font-weight: 800; color: #1e3a5f; margin: 4px 0 6px; }
  .ws-meta { display: flex; gap: 16px; font-size: 11px; color: #6b7280; }
  .ws-meta span { display: flex; align-items: center; gap: 4px; }
  .why-box { background: #f0f7ff; border-left: 4px solid #1e3a5f; padding: 8px 12px; border-radius: 4px; margin-top: 10px; font-size: 12px; color: #374151; font-style: italic; }

  /* ── Answer key badge ── */
  .answer-key-badge { display: inline-block; background: #15803d; color: white; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; letter-spacing: 0.05em; margin-top: 4px; }

  /* ── Worksheet body content styling ── */
  .ws-content { margin-top: 12px; }
  .ws-content p  { margin: 6px 0; line-height: 1.55; }
  .ws-content h2 { font-size: 15px; font-weight: 700; color: #1e3a5f; margin: 14px 0 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .ws-content h3, .ws-content h4 { font-size: 13px; font-weight: 700; color: #1e3a5f; margin: 10px 0 4px; }
  .ws-content ul, .ws-content ol { padding-left: 20px; margin: 6px 0; }
  .ws-content li { margin: 3px 0; line-height: 1.5; }
  .ws-content table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
  .ws-content table th { background: #1e3a5f; color: white; padding: 6px 8px; text-align: left; }
  .ws-content table td { border: 1px solid #e2e8f0; padding: 5px 8px; }
  .ws-content table tr:nth-child(even) td { background: #f8fafc; }
  .ws-content code, .ws-content kbd { font-family: 'Courier New', monospace; background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-size: 11px; color: #1d4ed8; }
  .ws-content pre { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; font-size: 11px; overflow: hidden; color: #1d4ed8; }
  .ws-content pre code { background: none; padding: 0; }
  .ws-content svg { max-width: 100%; height: auto; display: block; margin: 10px auto; }

  /* DaisyUI component overrides for print */
  .ws-content .rounded-xl,
  .ws-content .rounded-lg { border-radius: 6px !important; }
  .ws-content .bg-base-200 { background-color: #f8fafc !important; }
  .ws-content .bg-base-300 { background-color: #f1f5f9 !important; }
  .ws-content .bg-primary\/5 { background-color: #eff6ff !important; }
  .ws-content .bg-success\/10 { background-color: #f0fdf4 !important; }
  .ws-content .bg-error\/10 { background-color: #fef2f2 !important; }
  .ws-content .bg-warning\/10 { background-color: #fffbeb !important; }
  .ws-content .bg-neutral { background-color: #1e293b !important; }
  .ws-content .text-neutral-content { color: #f8fafc !important; }
  .ws-content .text-base-content { color: #1e293b !important; }
  .ws-content .text-base-content\/80 { color: #374151 !important; }
  .ws-content .text-base-content\/60 { color: #6b7280 !important; }
  .ws-content .text-success { color: #15803d !important; }
  .ws-content .text-error { color: #dc2626 !important; }
  .ws-content .text-warning { color: #d97706 !important; }
  .ws-content .text-primary { color: #1d4ed8 !important; }
  .ws-content .border-primary\/30 { border-color: #93c5fd !important; }
  .ws-content .border-success\/30 { border-color: #86efac !important; }
  .ws-content .border-error\/30 { border-color: #fca5a5 !important; }
  .ws-content .border-base-300 { border-color: #e2e8f0 !important; }

  /* Hide purely interactive elements */
  .ws-content button:not(.ws-content .btn-ghost),
  .ws-content .range,
  .ws-content .btn-primary,
  .ws-content .btn-secondary,
  .ws-content .btn-warning,
  .ws-content .btn-error,
  .ws-content .btn-accent,
  .ws-content .btn-success,
  .ws-content [id$="-status"],
  .ws-content [id$="-result"],
  .ws-content [id$="-fb"],
  .ws-content .hidden,
  .ws-content #ws3-ms-observe,
  .ws-content #ws5-cal-observe,
  .ws-content [class*="ms-wrapper"],
  .ws-content [class*="hmi-wrapper"],
  .ws-content [id*="-live-panel"],
  .ws-content [id*="-hmi-"],
  .ws-content canvas,
  .ws-content .loading,
  .ws-content [id$="-chart"] { display: none !important; }

  /* Show radio/checkbox inputs as styled boxes */
  .ws-content input[type="radio"],
  .ws-content input[type="checkbox"] { width: 14px; height: 14px; flex-shrink: 0; accent-color: #1e3a5f; }

  /* Keep checkboxes visible in checklists */
  .ws-content .kit-item,
  .ws-content label.flex { display: flex !important; align-items: flex-start; gap: 8px; padding: 4px 6px; }

  /* MCQ radios — hide since we handle them in the MCQ section */
  .ws-content div[data-correct] { display: none !important; }

  /* ── MCQ Section ── */
  .mcq-section { margin-top: 24px; border-top: 2px solid #1e3a5f; padding-top: 16px; page-break-before: auto; }
  .mcq-title { font-size: 15px; font-weight: 700; color: #1e3a5f; margin-bottom: 12px; }
  .tbl-header { margin: 10px 0 4px; font-size: 12px; }
  .mcq-table { width: 100%; border-collapse: collapse; margin: 6px 0 16px; font-size: 12px; }
  .mcq-table th { background: #1e3a5f; color: white; padding: 6px 8px; text-align: left; }
  .mcq-table td { border: 1px solid #e2e8f0; padding: 5px 8px; }
  .mcq-table tr.alt td { background: #f8fafc; }
  .answer-cell { color: #15803d !important; font-weight: 600; }
  .freetext-q { margin: 10px 0 16px; }
  .answer-blank { height: 32px; border-bottom: 1px solid #94a3b8; margin-top: 8px; }
  .answer-text { color: #15803d; font-weight: 600; margin-top: 6px; }
  .mcq-q { margin: 12px 0; }
  .q-text { margin-bottom: 6px; }
  .scenario-q { margin: 12px 0; background: #fff7ed; border-left: 4px solid #ea580c; padding: 8px 12px; border-radius: 4px; }
  .scenario-title { color: #ea580c; margin-bottom: 4px; }
  .scenario-intro { font-style: italic; color: #6b7280; font-size: 12px; margin-bottom: 6px; }
  .options { list-style: none; padding: 0; margin: 4px 0; }
  .options .option { display: flex; align-items: flex-start; gap: 6px; padding: 3px 6px; margin: 2px 0; font-size: 12px; border-radius: 4px; }
  .options .letter { font-weight: 600; color: #6b7280; min-width: 18px; }
  .options .correct { background: #f0fdf4; color: #15803d !important; font-weight: 600; }
  .options .correct .letter { color: #15803d; }
  .options .tick { color: #15803d; font-weight: 700; min-width: 16px; }
  .options .dim { color: #9ca3af; }
</style>
</head>
<body>
<div class="ws-header">
  <div class="course-label">${courseTitle}</div>
  <div class="ws-title">WS${ws.id} — ${ws.title}</div>
  <div class="ws-meta">
    ${ws.estimatedTime ? `<span>⏱ ${ws.estimatedTime}</span>` : ''}
  </div>
  ${answerBadge}
  ${ws.whyItMatters ? `<div class="why-box"><strong>Why it matters:</strong> ${ws.whyItMatters}</div>` : ''}
</div>

<div class="ws-content">
${ws.contentHtml}
</div>

${mcqHtml}

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PUPPETEER PDF GENERATION
// ─────────────────────────────────────────────────────────────────────────────

async function generatePdfs() {
  console.log('Launching Puppeteer…');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const courses = [
    {
      name: 'CP0001',
      title: 'CP0001 — Interactive Worksheets',
      jsFile: join(SRC, 'worksheets-page.js'),
      mcqData: CP0001_MCQ,
    },
    {
      name: 'CP0002',
      title: 'CP0002 — Engineering Worksheets',
      jsFile: join(SRC, 'cp0002-page.js'),
      mcqData: CP0002_MCQ,
    },
  ];

  for (const course of courses) {
    console.log(`\nExtracting: ${course.name}`);
    const worksheets = extractWorksheets(course.jsFile);
    console.log(`  Found ${worksheets.length} worksheets`);

    for (const showAnswers of [false, true]) {
      const label = showAnswers ? `${course.name} Answers` : course.name;
      const outFile = join(OUT, `${label}.pdf`);
      console.log(`  Building ${label}.pdf…`);

      const page = await browser.newPage();
      const buffers = [];

      for (let i = 0; i < worksheets.length; i++) {
        const ws = worksheets[i];
        const mcq = course.mcqData[i] || {};
        const html = buildPage(ws, mcq, showAnswers, course.title);

        process.stdout.write(`    WS${ws.id} ${ws.title.slice(0,40).padEnd(42)}`);

        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });

        // Brief pause for layout engine to settle
        await new Promise(r => setTimeout(r, 300));

        const pdfBuf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '18mm', bottom: '18mm', left: '20mm', right: '20mm' },
          displayHeaderFooter: true,
          headerTemplate: `<div style="font-size:8px;color:#9ca3af;width:100%;text-align:center;font-family:sans-serif;">
            ${course.title}${showAnswers ? ' — Answer Key' : ''}
          </div>`,
          footerTemplate: `<div style="font-size:8px;color:#9ca3af;width:100%;text-align:center;font-family:sans-serif;">
            WS${ws.id} — ${ws.title} &nbsp;|&nbsp; <span class="pageNumber"></span> of <span class="totalPages"></span>
          </div>`,
        });

        buffers.push(pdfBuf);
        console.log(`✓  (${Math.round(pdfBuf.length/1024)} KB)`);
      }

      await page.close();

      // Merge all worksheet PDFs into one using a simple concatenation approach
      // For proper merging we write them individually then merge with pdf-lib or
      // write a single multi-page doc. Since each page.pdf() call already produces
      // a multi-page PDF per worksheet, we merge using pdf-lib.
      const merged = await mergePdfs(buffers);
      writeFileSync(outFile, merged);
      const kb = Math.round(merged.length / 1024);
      console.log(`  Saved: ${outFile}  (${kb} KB)`);
    }
  }

  await browser.close();
  console.log('\nDone.');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. PDF MERGE  (using pdf-lib if available, else write buffers as separate files)
// ─────────────────────────────────────────────────────────────────────────────

async function mergePdfs(buffers) {
  try {
    const { PDFDocument } = await import('pdf-lib');
    const merged = await PDFDocument.create();
    for (const buf of buffers) {
      const src = await PDFDocument.load(buf);
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach(p => merged.addPage(p));
    }
    return Buffer.from(await merged.save());
  } catch {
    // pdf-lib not available — just return the last buffer as fallback
    // (user can install: npm install pdf-lib)
    console.warn('  Note: pdf-lib not found — install it for proper merging: npm install pdf-lib');
    return Buffer.concat(buffers);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
generatePdfs().catch(e => { console.error(e); process.exit(1); });
