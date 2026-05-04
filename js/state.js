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

// ===== WORKOUT PURPOSE (the noob "what am I actually doing here") =====
const WORKOUT_PURPOSE = {
  easy: {
    effort: 'Conversational',
    purpose: 'Builds your aerobic engine. 80% of marathon training is this. Boring is the point.',
    cue: 'If you can\'t speak full sentences, slow down. Easy is a discipline, not a default.',
    talk_test: 'Talk freely · breathe through nose if possible',
  },
  quality: {
    effort: 'Comfortably hard',
    purpose: 'Pushes your lactate threshold up — the speed you can hold for an hour gets faster.',
    cue: 'Short phrases only. Watch your form when you start to fatigue.',
    talk_test: '3-4 word phrases · steady deep breathing',
  },
  long: {
    effort: 'Sustainable / steady',
    purpose: 'Builds endurance and teaches your body to burn fat for fuel. The cornerstone session.',
    cue: 'Start slower than you think. Practice fueling like race day.',
    talk_test: 'Full sentences · slightly heavier breathing',
  },
  strength: {
    effort: 'Form first, weight second',
    purpose: 'Prevents injury and holds posture in the late race miles. Don\'t skip.',
    cue: 'No grinding reps. Stop a rep before form breaks.',
    talk_test: '—',
  },
  rest: {
    effort: 'Actually rest',
    purpose: 'Adaptation happens during rest, not during the run. Resting is training.',
    cue: 'No "easy 3 miles." Walking is fine. Stretch if you want.',
    talk_test: '—',
  },
  tune: {
    effort: 'Race effort',
    purpose: 'Calibration day. Tune-up half is a dress rehearsal — pacing, fueling, and gear.',
    cue: 'Treat as a hard workout, not all-out. Save 5%. Mistakes here are free.',
    talk_test: 'Few-word phrases · race-day rhythm',
  },
  race: {
    effort: 'Race day',
    purpose: 'Why we did all this.',
    cue: 'Negative split. Trust the training.',
    talk_test: '—',
  },
};

// ===== CALORIE / PROTEIN TARGETS BY WEEK =====
function calorieTargetForWeek(weekNum) {
  if (weekNum <= 3)  return { cal: 2300, label: 'Phase 0 · maintenance' };
  if (weekNum <= 14) return { cal: 2100, label: 'Cut · ~500 cal deficit' };
  if (weekNum <= 21) return { cal: 2900, label: 'Peak · eat to recover' };
  return                    { cal: 3000, label: 'Carb load' };
}
function proteinTargetForWeek(weekNum) {
  return weekNum <= 14 ? 140 : 160;
}

// ===== DAILY SCHEDULE (today, from wake to sleep) =====
// Built around the user's real week:
//   Mon + Fri:    day job, off 5:30 PM, home 7:00 PM, NIGHT RUN preferred (7:30 PM)
//   Tue + Wed + Thu: day job + restaurant 6:00 PM – 10:00 PM, home 10:40 PM
//   Sat:          restaurant 5:00 PM – 10:00 PM, home 10:40 PM
//   Sun:          restaurant 3:00 PM – 10:00 PM, home 10:40 PM (longest shift)
//   Sleep:        12:30 AM every night
const RESTAURANT_NIGHTS = {
  Tue: { headOut: '5:30 PM', start: '6:00 PM', end: '10:00 PM', shiftHrs: 4 },
  Wed: { headOut: '5:30 PM', start: '6:00 PM', end: '10:00 PM', shiftHrs: 4 },
  Thu: { headOut: '5:30 PM', start: '6:00 PM', end: '10:00 PM', shiftHrs: 4 },
  Sat: { headOut: '4:30 PM', start: '5:00 PM', end: '10:00 PM', shiftHrs: 5 },
  Sun: { headOut: '2:30 PM', start: '3:00 PM', end: '10:00 PM', shiftHrs: 7 },
};

function buildDailySchedule(day, week) {
  const t = day.type;
  const dow = day.day;
  const isLong = t === 'long' || t === 'race';
  const isQuality = t === 'quality';
  const isRest = t === 'rest';
  const isStrength = t === 'strength';
  const totalMi = day.workout?.total || 0;

  const restaurant = RESTAURANT_NIGHTS[dow] || null;
  const isRestaurantNight = !!restaurant;
  const isMonOrFri = ['Mon', 'Fri'].includes(dow);

  // User preference: night run on Mon + Fri (the only evenings entirely off restaurant).
  // Strength stays AM (Thursday is restaurant night; not relevant on Mon/Fri but keep rule).
  const userPrefersNightRun = isMonOrFri && !isRest && !isStrength;
  const runWhen = userPrefersNightRun ? 'PM' : day.when;
  const runIsAM = runWhen === 'AM' && !isRest;
  const runIsPM = runWhen === 'PM' && !isRest;

  const items = [];

  // ===== MORNING =====
  items.push({ time: '5:30 AM', icon: '☀️', title: 'Wake + 16 oz water', detail: 'Hydrate first thing. Bathroom.' });

  if (runIsAM) {
    if (isLong) {
      items.push({ time: '5:45 AM', icon: '🍌', title: 'Pre-long-run breakfast', detail: 'Banana + 1 slice toast with honey + coffee · ~250 cal · 60 min before.' });
    } else if (isQuality) {
      items.push({ time: '6:00 AM', icon: '🍌', title: 'Light pre-run', detail: 'Banana or 2 dates + small coffee · ~150 cal · 30 min before.' });
    } else if (t === 'easy') {
      items.push({ time: '6:00 AM', icon: '☕', title: 'Coffee + sip water', detail: 'Easy runs are fine fasted · ~50 cal.' });
    } else if (isStrength) {
      items.push({ time: '6:00 AM', icon: '🥚', title: 'Pre-strength snack', detail: 'Greek yogurt + berries · ~200 cal · 20g protein.' });
    }

    items.push({ time: '6:30 AM', icon: isStrength ? '🏋️' : '👟', title: day.title, detail: `${totalMi ? totalMi + ' mi · ' : ''}${day.pace !== '—' ? day.pace : 'Form first'}` });

    if (isLong && totalMi >= 10) {
      const gels = Math.max(1, Math.floor((totalMi - 4) / 4));
      items.push({ time: 'During run', icon: '🍯', title: 'Practice race fuel', detail: `~${gels} gel${gels > 1 ? 's' : ''} (every ~30 min after mile 4) + sip water.` });
    } else if (isLong) {
      items.push({ time: 'During run', icon: '💧', title: 'Sip water', detail: 'No gels needed at this distance — just hydrate.' });
    }

    items.push({
      time: '~30 min after',
      icon: '🥤',
      title: isStrength ? 'Protein recovery' : 'Recovery smoothie',
      detail: isStrength
        ? 'Whey shake or Greek yogurt + berries · 20–25g protein · ~250 cal.'
        : 'Recovery Smoothie (Fuel page) · 30g carb + 20g protein · ~350 cal.',
    });
  } else if (isRest) {
    items.push({ time: '6:30 AM', icon: '☕', title: 'Breakfast', detail: 'Rest day — eat normally · oats + fruit + eggs · ~400 cal.' });
  } else {
    // Run is later (PM or night) — bigger AM meal
    items.push({ time: '6:30 AM', icon: '🍳', title: 'Breakfast', detail: 'Bigger meal since the run is hours away · oats + fruit + eggs · ~400 cal.' });
  }

  // ===== MIDDAY =====
  items.push({ time: '9:00 AM',  icon: '💧', title: '16 oz water', detail: 'Refill bottle. Sip through morning.' });
  items.push({ time: '12:30 PM', icon: '🍽', title: 'Lunch',       detail: 'Vegetarian + balanced · ~600 cal · 30g+ protein.' });
  items.push({ time: '3:00 PM',  icon: '💧', title: '16 oz water', detail: 'Mid-afternoon hydration check.' });
  items.push({ time: '4:00 PM',  icon: '☕', title: 'Last coffee',  detail: 'Cut caffeine by 4 PM to protect tonight\'s sleep.' });

  // ===== EVENING — branch by day pattern =====
  if (isRestaurantNight) {
    const headOutLabel = (dow === 'Sat' || dow === 'Sun') ? 'Head to restaurant' : 'Off day job, head to restaurant';
    items.push({ time: restaurant.headOut, icon: '🚗', title: headOutLabel,                   detail: 'Sip water on the way.' });
    items.push({ time: restaurant.start,   icon: '🍜', title: 'Restaurant shift starts',     detail: `${restaurant.shiftHrs}-hr shift · ~${restaurant.shiftHrs * 175} cal across · smart kitchen-perk eating.` });
    items.push({ time: '8:00 PM',          icon: '💧', title: '16–32 oz water',              detail: 'Kitchen heat dehydrates fast. Keep a bottle within reach.' });
    items.push({ time: restaurant.end,     icon: '🚗', title: 'Off restaurant, head home',   detail: '40-min commute. Sip water.' });
    items.push({ time: '10:40 PM',         icon: '🏠', title: 'Home',                         detail: 'Decompress. Light snack only if hungry · ~150 cal max.' });
  } else if (runIsPM) {
    // Mon / Fri night run — only fits when restaurant is off
    items.push({ time: '5:30 PM', icon: '🚗', title: 'Off work, head home',  detail: 'Commute home. Drink water on the way.' });
    items.push({ time: '7:00 PM', icon: '🍌', title: 'Pre-run snack',         detail: 'Banana or 1 slice toast + PB · ~200 cal · 30 min before run.' });
    items.push({ time: '7:30 PM', icon: '👟', title: day.title,               detail: `${totalMi ? totalMi + ' mi · ' : ''}${day.pace}` });
    items.push({ time: '8:30 PM', icon: '🥤', title: 'Recovery + late dinner', detail: 'Smoothie within 30 min of run, then dinner · ~700 cal total · vegetarian + protein.' });
  } else {
    // Mon / Fri rest day or Sat/Sun without restaurant (shouldn't hit since Sat/Sun are restaurants now)
    items.push({ time: '5:30 PM', icon: '🚗', title: 'Off work, head home', detail: 'Commute home.' });
    items.push({ time: '7:00 PM', icon: '🍽', title: 'Dinner',              detail: 'Vegetarian + protein · ~700 cal · home cooked.' });
  }

  if (!isRestaurantNight) {
    items.push({ time: '8:30 PM', icon: '💧', title: '16 oz water', detail: 'Last big water — taper before bed.' });
  }

  // ===== WIND-DOWN + SLEEP (12:30 AM) =====
  const sleepNote = isRestaurantNight
    ? 'Tonight is restaurant — accept the short night, ~5 hrs.'
    : runIsPM
      ? 'Aim 7+ tonight (no late shift, easier to bank sleep).'
      : 'Aim 7+ tonight.';
  items.push({ time: '11:30 PM', icon: '🌙', title: 'Wind down', detail: 'Magnesium glycinate (300–400 mg) · lights down · phone night mode.' });
  items.push({ time: '12:30 AM', icon: '🛏', title: 'Bed',       detail: `Target 5+ hrs nightly. ${sleepNote}` });

  return items;
}

// ===== FIND LAST SIMILAR WORKOUTS (for "compare to past" panel) =====
function findLastSimilarWorkouts(currentDay, currentWk, currentDi, limit = 3) {
  const result = [];
  let wk = currentWk, di = currentDi - 1;
  if (di < 0) { wk--; di = 6; }
  while (wk >= 1 && result.length < limit) {
    const d = PLAN[wk - 1].days[di];
    const w = getWorkout(wk, di);
    if (d.type === currentDay.type && w.status === 'done' && w.actualMiles) {
      result.push({ week: wk, dayIdx: di, day: d, workout: w });
    }
    di--;
    if (di < 0) { wk--; di = 6; }
  }
  return result;
}

// ===== TRAINING LOAD (acute / chronic) =====
function trainingLoad() {
  // Sum miles done in last 7 days vs last 28 days. Ratio > 1.5 = high injury risk.
  const today = todayDate(); today.setHours(0,0,0,0);
  const sevenAgo = new Date(today); sevenAgo.setDate(today.getDate() - 7);
  const twentyEightAgo = new Date(today); twentyEightAgo.setDate(today.getDate() - 28);

  let acute = 0, chronic = 0;
  if (typeof PLAN === 'undefined') return { acute, chronic, ratio: null, status: 'low' };

  const start = new Date(START_DATE); start.setHours(0,0,0,0);
  PLAN.forEach((wk, i) => {
    wk.days.forEach((d, di) => {
      const dayDate = new Date(start); dayDate.setDate(start.getDate() + i * 7 + di);
      const w = getWorkout(i + 1, di);
      if (w.status !== 'done' || !w.actualMiles) return;
      if (dayDate >= sevenAgo && dayDate <= today) acute += w.actualMiles;
      if (dayDate >= twentyEightAgo && dayDate <= today) chronic += w.actualMiles;
    });
  });

  const acuteAvg = acute / 7;
  const chronicAvg = chronic / 28;
  const ratio = chronicAvg > 0 ? acuteAvg / chronicAvg : null;
  let status = 'building';
  if (ratio == null) status = 'baseline';
  else if (ratio < 0.8) status = 'detraining';
  else if (ratio <= 1.3) status = 'sweet spot';
  else if (ratio <= 1.5) status = 'pushing';
  else status = 'high risk';
  return { acute, chronic, acuteAvg, chronicAvg, ratio, status };
}

// ===== TODAY'S GEAR HINT =====
function buildDailyGear(day) {
  const t = day.type;
  const totalMi = day.workout?.total || 0;
  if (t === 'rest') return null;
  if (t === 'strength') return ['Lifting shoes (or flat-soled)', 'Towel', 'Resistance bands', 'Water bottle'];
  const gear = ['Running shoes', 'GPS watch (charged)', 'Shorts + breathable top'];
  if (totalMi >= 6) gear.push('Body Glide (nipples + inner thighs)');
  if (totalMi >= 8) gear.push('Handheld water bottle or fuel belt');
  if (totalMi >= 10) {
    const gels = Math.max(1, Math.floor((totalMi - 4) / 4));
    gear.push(`${gels} gel${gels > 1 ? 's' : ''}`);
  }
  if (totalMi >= 14) gear.push('Salt tabs (if hot)');
  return gear;
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
