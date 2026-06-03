/**
 * Progress page — tracks student progress across CP0001, CP0002, and Further Study.
 * Visits are stored in sessionStorage (reset on tab close).
 * Completed chapters from the learn page are read from localStorage (persisted).
 * Students can save the full session report to a JSON file.
 */

// ── Storage keys ──────────────────────────────────────────────────────────────
export const PROGRESS_KEYS = {
  cp0001: 'progress_cp0001_visited',   // JSON array of visited WS indices (1-based)
  cp0002: 'progress_cp0002_visited',   // JSON array of visited WS indices (1-based)
  sessionStart: 'progress_session_start',
};

// ── CP metadata (mirrors the pages, so the progress page is self-contained) ───
const CP0001_TITLES = [
  'Meet Your Kit',
  'What is a Smart Sensor?',
  'The Proximity Sensor',
  'The Capacitive Sensor',
  'The Temperature Sensor',
  'The Light Stack (Status LED)',
  'Fault Finding and Replacement',
  'Final Practical Assessment',
];

const CP0002_TITLES = [
  'Your System — A Technical Brief',
  'How This App Works',
  'How Each Sensor Works (Protocol Level)',
  'Benefits for Maintenance',
  'Diagnostics: Process, Service, and Event Data',
  'PLC and HMI Integration',
  'Case Study — Standard vs IO-Link: The Numbers',
  'Device Identity — Vendor ID, Device ID & PDin',
];


// ── Session helpers ───────────────────────────────────────────────────────────
function ensureSessionStart() {
  if (!sessionStorage.getItem(PROGRESS_KEYS.sessionStart)) {
    sessionStorage.setItem(PROGRESS_KEYS.sessionStart, new Date().toISOString());
  }
}

export function markVisited(courseKey, index) {
  ensureSessionStart();
  const raw = sessionStorage.getItem(PROGRESS_KEYS[courseKey]);
  const visited = raw ? JSON.parse(raw) : [];
  if (!visited.includes(index)) {
    visited.push(index);
    sessionStorage.setItem(PROGRESS_KEYS[courseKey], JSON.stringify(visited));
  }
}

function getVisited(courseKey) {
  const raw = sessionStorage.getItem(PROGRESS_KEYS[courseKey]);
  return raw ? new Set(JSON.parse(raw)) : new Set();
}

function resetSession() {
  sessionStorage.removeItem(PROGRESS_KEYS.cp0001);
  sessionStorage.removeItem(PROGRESS_KEYS.cp0002);
  sessionStorage.removeItem(PROGRESS_KEYS.sessionStart);
}

function buildSnapshot() {
  const cp0001 = getVisited('cp0001');
  const cp0002 = getVisited('cp0002');
  return {
    sessionStart: sessionStorage.getItem(PROGRESS_KEYS.sessionStart) || null,
    exportedAt: new Date().toISOString(),
    cp0001: {
      title: 'Maintenance on Smart Sensors',
      totalWorksheets: CP0001_TITLES.length,
      visited: CP0001_TITLES.map((t, i) => ({
        worksheet: i + 1,
        title: t,
        visited: cp0001.has(i + 1),
      })),
    },
    cp0002: {
      title: 'Industry 4.0 IO-Link',
      totalWorksheets: CP0002_TITLES.length,
      visited: CP0002_TITLES.map((t, i) => ({
        worksheet: i + 1,
        title: t,
        visited: cp0002.has(i + 1),
      })),
    },
  };
}

// ── Render helpers ────────────────────────────────────────────────────────────
function pct(done, total) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function ringColour(p) {
  if (p === 100) return 'text-success';
  if (p >= 50)  return 'text-warning';
  return 'text-error';
}

function buildCourseGrid(titles, visitedSet, label) {
  return titles.map((title, i) => {
    const num = i + 1;
    const done = visitedSet.has(num);
    return `
      <div class="flex items-center gap-3 rounded-xl border-2 p-3 transition-all ${done ? 'border-success/50 bg-success/5' : 'border-base-300 bg-base-200/40'}">
        <div class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-success text-success-content' : 'bg-base-300 text-base-content/40'}">
          ${done ? '✓' : num}
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">${label} ${num}</p>
          <p class="text-sm font-medium text-base-content truncate">${title}</p>
        </div>
      </div>`;
  }).join('');
}

function buildSummaryRing(label, code, done, total) {
  const p = pct(done, total);
  const colour = ringColour(p);
  return `
    <div class="flex flex-col items-center gap-1 p-4 rounded-xl bg-base-200/60 border border-base-300 min-w-[100px]">
      <div class="relative w-16 h-16">
        <svg viewBox="0 0 36 36" class="w-16 h-16 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" stroke-width="2.5" class="text-base-300"/>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-dasharray="${p} ${100 - p}" stroke-dashoffset="0" stroke-linecap="round"
            class="${colour}" style="transition:stroke-dasharray 0.6s ease"/>
        </svg>
        <span class="absolute inset-0 flex items-center justify-center text-sm font-bold text-base-content">${p}%</span>
      </div>
      <p class="font-mono text-xs font-bold text-base-content/60">${code}</p>
      <p class="text-xs text-base-content/80 text-center leading-tight">${done}/${total} ${label}</p>
    </div>`;
}

// ── Page render ───────────────────────────────────────────────────────────────
export function renderProgressPage() {
  return `<div id="progress-root" class="max-w-4xl mx-auto space-y-6 py-4 px-2"></div>`;
}

export function initProgressPage() {
  const root = document.getElementById('progress-root');
  if (!root) return;
  renderProgress(root);

  root.addEventListener('click', e => {
    if (e.target.closest('#prog-save-btn')) {
      const snap = buildSnapshot();
      const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const ts   = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
      a.href     = url;
      a.download = `progress_${ts}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    if (e.target.closest('#prog-reset-btn')) {
      if (confirm('Reset all progress for this session? This will clear visited worksheets and learn-page chapter history.')) {
        resetSession();
        renderProgress(root);
      }
    }
  });
}

function renderProgress(root) {
  const cp0001Visited = getVisited('cp0001');
  const cp0002Visited = getVisited('cp0002');

  const cp0001Done = CP0001_TITLES.filter((_, i) => cp0001Visited.has(i + 1)).length;
  const cp0002Done = CP0002_TITLES.filter((_, i) => cp0002Visited.has(i + 1)).length;

  const sessionStart = sessionStorage.getItem(PROGRESS_KEYS.sessionStart);
  const sessionLabel = sessionStart
    ? 'Session started ' + new Date(sessionStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'No activity yet this session';

  root.innerHTML = `
    <div class="rounded-2xl border-2 border-primary/20 bg-base-200/95 shadow-xl overflow-hidden"
         style="background:linear-gradient(160deg,hsl(var(--b2)) 0%,hsl(var(--b3)) 45%,hsl(var(--p)/0.06) 100%)">

      <!-- Header -->
      <div class="px-6 py-4 border-b-2 border-primary/20 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-base-content flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Student Progress
          </h1>
          <p class="text-xs text-base-content/50 mt-0.5">${sessionLabel}</p>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button id="prog-save-btn" class="btn btn-primary btn-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Save to JSON
          </button>
          <button id="prog-reset-btn" class="btn btn-warning btn-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Reset Session
          </button>
        </div>
      </div>

      <!-- Summary rings -->
      <div class="px-6 py-4 border-b border-base-300">
        <p class="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-3">Overall Progress</p>
        <div class="flex flex-wrap gap-4">
          ${buildSummaryRing('worksheets', 'CP0001', cp0001Done, CP0001_TITLES.length)}
          ${buildSummaryRing('worksheets', 'CP0002', cp0002Done, CP0002_TITLES.length)}
        </div>
      </div>

      <!-- CP0001 -->
      <div class="px-6 py-4 border-b border-base-300">
        <div class="flex items-center justify-between mb-3">
          <div>
            <span class="font-mono text-xs font-bold text-primary">CP0001</span>
            <span class="ml-2 text-sm font-semibold text-base-content">Maintenance on Smart Sensors</span>
          </div>
          <span class="badge badge-sm ${cp0001Done === CP0001_TITLES.length ? 'badge-success' : 'badge-ghost'}">${cp0001Done}/${CP0001_TITLES.length}</span>
        </div>
        <div class="w-full bg-base-300 rounded-full h-1.5 mb-3 overflow-hidden">
          <div class="h-1.5 rounded-full bg-primary transition-all duration-500" style="width:${pct(cp0001Done, CP0001_TITLES.length)}%"></div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${buildCourseGrid(CP0001_TITLES, cp0001Visited, 'WS')}
        </div>
        <a href="#" data-page="worksheets" class="btn btn-outline btn-xs mt-3 gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          Open CP0001
        </a>
      </div>

      <!-- CP0002 -->
      <div class="px-6 py-4 border-b border-base-300">
        <div class="flex items-center justify-between mb-3">
          <div>
            <span class="font-mono text-xs font-bold text-secondary">CP0002</span>
            <span class="ml-2 text-sm font-semibold text-base-content">Industry 4.0 IO-Link</span>
          </div>
          <span class="badge badge-sm ${cp0002Done === CP0002_TITLES.length ? 'badge-success' : 'badge-ghost'}">${cp0002Done}/${CP0002_TITLES.length}</span>
        </div>
        <div class="w-full bg-base-300 rounded-full h-1.5 mb-3 overflow-hidden">
          <div class="h-1.5 rounded-full bg-secondary transition-all duration-500" style="width:${pct(cp0002Done, CP0002_TITLES.length)}%"></div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${buildCourseGrid(CP0002_TITLES, cp0002Visited, 'WS')}
        </div>
        <a href="#" data-page="cp0002" class="btn btn-outline btn-xs mt-3 gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          Open CP0002
        </a>
      </div>

      <!-- Footer note -->
      <div class="px-6 pb-4 text-xs text-base-content/40">
        Visits reset when the browser tab is closed. "Save to JSON" downloads a snapshot you can keep or share with your tutor.
      </div>
    </div>`;
}
