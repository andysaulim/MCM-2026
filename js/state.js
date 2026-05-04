// ============================================================
// MCM 2026 — Central state, schema, and helpers
// Loaded by every page so navigation stats, days-to-race, and
// completion counts come from one source of truth.
// ============================================================

const STATE_KEY = 'mcm2026_andy';
const SCHEMA_VERSION = 2;

const START_DATE = new Date('2026-05-04T00:00:00');
const RACE_DATE  = new Date('2026-10-25T07:55:00');

function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    workouts: {},   // { 'w5d2': { status, actualMiles, durationSec, rpe, felt, gels, notes, source, externalId, loggedAt } }
    extras:   {},   // { 'w5d2': { pushups: true, circuit: false } }
    weights:  [],   // [{ date, lbs, source }]
    sleep:    [],   // [{ date, hrs, source }]
    pain:     {},   // { 'w5d2': { area, level, notes } }
    integrations: {
      strava: { connected: false, athleteId: null, accessToken: null, refreshToken: null, expiresAt: null, lastSyncTs: null },
      fitbit: { connected: false, userId: null,    accessToken: null, refreshToken: null, expiresAt: null, lastSyncTs: null },
    },
  };
}

function migrate(raw) {
  if (!raw || typeof raw !== 'object') return defaultState();
  const safe = defaultState();

  // v2 path — copy fields with type guards so a hand-edited or partially-corrupt
  // import doesn't blow up renders.
  if (raw.schemaVersion === SCHEMA_VERSION) {
    if (raw.workouts && typeof raw.workouts === 'object' && !Array.isArray(raw.workouts)) {
      safe.workouts = raw.workouts;
    }
    if (raw.extras && typeof raw.extras === 'object' && !Array.isArray(raw.extras)) {
      safe.extras = raw.extras;
    }
    if (Array.isArray(raw.weights)) {
      safe.weights = raw.weights.filter(w => w && typeof w.lbs === 'number' && w.date);
    }
    if (Array.isArray(raw.sleep)) {
      safe.sleep = raw.sleep.filter(s => s && typeof s.hrs === 'number' && s.date);
    }
    if (raw.pain && typeof raw.pain === 'object' && !Array.isArray(raw.pain)) {
      safe.pain = raw.pain;
    }
    if (raw.integrations && typeof raw.integrations === 'object') {
      safe.integrations.fitbit = { ...safe.integrations.fitbit, ...(raw.integrations.fitbit || {}) };
      safe.integrations.strava = { ...safe.integrations.strava, ...(raw.integrations.strava || {}) };
    }
    return safe;
  }

  // v1 → v2: collapse done/skip/notes into workouts[k]
  if (raw.extras && typeof raw.extras === 'object') safe.extras = raw.extras;
  if (Array.isArray(raw.weights)) {
    safe.weights = raw.weights
      .filter(w => w && typeof w.lbs === 'number' && w.date)
      .map(w => ({ ...w, source: w.source || 'manual' }));
  }
  if (Array.isArray(raw.sleep)) {
    safe.sleep = raw.sleep
      .filter(s => s && typeof s.hrs === 'number' && s.date)
      .map(s => ({ ...s, source: s.source || 'manual' }));
  }
  const keys = new Set([
    ...Object.keys(raw.done  || {}),
    ...Object.keys(raw.skip  || {}),
    ...Object.keys(raw.notes || {}),
  ]);
  for (const k of keys) {
    safe.workouts[k] = {
      status: raw.done?.[k] ? 'done' : (raw.skip?.[k] ? 'skip' : null),
      notes: typeof raw.notes?.[k] === 'string' ? raw.notes[k] : '',
      source: 'manual',
      loggedAt: null,
    };
  }
  return safe;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return defaultState();
    return migrate(JSON.parse(raw));
  } catch (e) { return defaultState(); }
}
function saveState(s) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
  } catch (e) {
    // QuotaExceeded, private mode, etc. — surface it so the user can export.
    console.warn('mcm: state save failed', e);
    showToast('Save failed — Settings → Export now', 'warn');
  }
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Mutable singleton — every page reads/writes the same object.
let mcmState = loadState();

// ===== WORKOUT HELPERS =====
function dayKey(week, dayIdx) { return `w${week}d${dayIdx}`; }
function getWorkout(wk, di) { return mcmState.workouts[dayKey(wk, di)] || {}; }
function isDone(wk, di)     { return getWorkout(wk, di).status === 'done'; }
function isSkipped(wk, di)  { return getWorkout(wk, di).status === 'skip'; }
function getExtras(wk, di)  { return mcmState.extras[dayKey(wk, di)] || {}; }

function ensureWorkout(k) {
  if (!mcmState.workouts[k]) mcmState.workouts[k] = { status: null, source: 'manual', loggedAt: null };
  return mcmState.workouts[k];
}
function setWorkoutStatus(wk, di, status) {
  const k = dayKey(wk, di);
  const w = ensureWorkout(k);
  w.status = w.status === status ? null : status;
  w.loggedAt = new Date().toISOString();
  saveState(mcmState);
  return w.status;
}
function logRun(wk, di, fields) {
  const k = dayKey(wk, di);
  const w = ensureWorkout(k);
  Object.assign(w, fields, { status: 'done', loggedAt: new Date().toISOString() });
  saveState(mcmState);
}
function setNote(wk, di, text) {
  const k = dayKey(wk, di);
  const w = ensureWorkout(k);
  w.notes = (text || '').trim();
  if (!w.status && !w.notes) delete mcmState.workouts[k];
  saveState(mcmState);
}
function toggleExtra(wk, di, ex) {
  const k = dayKey(wk, di);
  if (!mcmState.extras[k]) mcmState.extras[k] = {};
  mcmState.extras[k][ex] = !mcmState.extras[k][ex];
  saveState(mcmState);
}

// ===== DATE / WEEK =====
function todayDate() { return new Date(); }
function getCurrentWeekDay() {
  const today = todayDate(); today.setHours(0,0,0,0);
  const start = new Date(START_DATE); start.setHours(0,0,0,0);
  const diffDays = Math.floor((today - start) / 86400000);
  if (diffDays < 0)    return { week: 1, dayIdx: 0, beforeStart: true,  afterEnd: false };
  if (diffDays >= 175) return { week: 25, dayIdx: 6, beforeStart: false, afterEnd: true };
  return { week: Math.floor(diffDays / 7) + 1, dayIdx: diffDays % 7, beforeStart: false, afterEnd: false };
}
function daysToRace() {
  const today = todayDate(); today.setHours(0,0,0,0);
  const race = new Date(RACE_DATE); race.setHours(0,0,0,0);
  return Math.max(0, Math.floor((race - today) / 86400000));
}
function isRaceWeek() { return daysToRace() <= 7; }

// ===== TIME / PACE FORMATTING =====
function secToHms(sec) {
  if (!sec || sec < 0) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
               : `${m}:${String(s).padStart(2,'0')}`;
}
function hmsToSec(str) {
  if (!str) return 0;
  const s = String(str).trim().toLowerCase();
  if (!s) return 0;

  // "1h 30m 15s" / "1h 30m" / "30m" / "1h" — pick out h/m/s tokens.
  if (/[hms]/.test(s)) {
    const h = +(s.match(/(\d+(?:\.\d+)?)\s*h/) || [, 0])[1];
    const m = +(s.match(/(\d+(?:\.\d+)?)\s*m/) || [, 0])[1];
    const sec = +(s.match(/(\d+(?:\.\d+)?)\s*s/) || [, 0])[1];
    return Math.round(h * 3600 + m * 60 + sec);
  }

  // "1:30:00" / "30:00" / "90"  (bare number = minutes)
  const parts = s.split(':').map(p => parseFloat(p));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 1) return Math.round(parts[0] * 60);
  if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
  return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
}
function paceFromMilesAndSec(miles, sec) {
  if (!miles || !sec) return '';
  const ppm = sec / miles;
  return `${Math.floor(ppm / 60)}:${String(Math.floor(ppm % 60)).padStart(2,'0')}/mi`;
}

// ===== TYPE / WHEN HELPERS =====
function typeClass(t)  { return ({ easy:'easy', quality:'quality', long:'long', strength:'strength', rest:'rest', tune:'tune', race:'race' })[t] || 'easy'; }
function typeName(t)   { return ({ easy:'Easy', quality:'Quality', long:'Long', strength:'Strength', rest:'Rest',   tune:'Tune-up', race:'RACE' })[t] || t; }
function whenClass(w)  { return w === 'AM' ? 'when-am' : w === 'PM' ? 'when-pm' : 'when-rest'; }

// ===== TOAST =====
function showToast(msg, type) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => t.className = 'toast', 2400);
}

// ===== AGGREGATE STATS (used by topnav on every page) =====
function totalsAcrossPlan() {
  let totalDone = 0, completedCount = 0, totalCount = 0, totalPlanned = 0;
  if (typeof PLAN === 'undefined') return { totalDone, completedCount, totalCount, totalPlanned };
  PLAN.forEach((wk, i) => {
    wk.days.forEach((d, di) => {
      if (d.type !== 'rest') totalCount++;
      totalPlanned += d.workout?.total || 0;
      const w = getWorkout(i + 1, di);
      if (w.status === 'done') {
        if (d.type !== 'rest') completedCount++;
        totalDone += w.actualMiles || d.workout?.total || 0;
      }
    });
  });
  return { totalDone, completedCount, totalCount, totalPlanned };
}

// ===== TOPNAV BINDER (every page calls this) =====
function bindTopnavStats() {
  const days = daysToRace();
  const tsDays = document.getElementById('ts-days');
  if (tsDays) tsDays.textContent = days;
  const tsMiles = document.getElementById('ts-miles');
  if (tsMiles) tsMiles.textContent = Math.round(totalsAcrossPlan().totalDone);
}

// ===== BOTTOM NAV (mobile) =====
const NAV_TABS = [
  { href: 'index.html',     label: 'Today' },
  { href: 'history.html',   label: 'History' },
  { href: 'plan.html',      label: 'Plan' },
  { href: 'exercises.html', label: 'Strength' },
  { href: 'nutrition.html', label: 'Fuel' },
  { href: 'race.html',      label: 'Race' },
];
function renderBottomNav() {
  const mount = document.getElementById('bottomnav-mount');
  if (!mount) return;
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  mount.innerHTML = NAV_TABS.map(t =>
    `<a href="${t.href}" class="bn-tab${t.href === path ? ' is-active' : ''}">${t.label}</a>`
  ).join('');
}
document.addEventListener('DOMContentLoaded', renderBottomNav);
