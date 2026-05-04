// ============================================================
// MCM 2026 — App logic
// localStorage for persistence (works on GitHub Pages)
// ============================================================

const START_DATE = new Date('2026-05-04T00:00:00');
const RACE_DATE = new Date('2026-10-25T07:55:00');
const STATE_KEY = 'mcm2026_andy';

// ===== STATE MANAGEMENT =====
function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch (e) { return defaultState(); }
}
function defaultState() {
  return { done: {}, skip: {}, notes: {}, weights: [], sleep: [], extras: {} };
}
function saveState(s) {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch (e) {}
}
let state = loadState();
let viewWeek = 1;
let noteContext = null;

// ===== DATE MATH =====
function todayDate() {
  // For testing, can override here:
  return new Date();
}
function getCurrentWeekDay() {
  const today = todayDate();
  today.setHours(0, 0, 0, 0);
  const start = new Date(START_DATE); start.setHours(0, 0, 0, 0);
  const diffMs = today - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { week: 1, dayIdx: 0, beforeStart: true };
  if (diffDays >= 175) return { week: 25, dayIdx: 6, afterEnd: true };
  return {
    week: Math.floor(diffDays / 7) + 1,
    dayIdx: diffDays % 7,
    beforeStart: false,
    afterEnd: false,
  };
}
function daysToRace() {
  const today = todayDate(); today.setHours(0, 0, 0, 0);
  const race = new Date(RACE_DATE); race.setHours(0, 0, 0, 0);
  return Math.floor((race - today) / (1000 * 60 * 60 * 24));
}

// ===== KEY HELPERS =====
function dayKey(week, dayIdx) { return `w${week}d${dayIdx}`; }
function isDone(wk, di) { return !!state.done[dayKey(wk, di)]; }
function isSkipped(wk, di) { return !!state.skip[dayKey(wk, di)]; }
function getExtras(wk, di) { return state.extras[dayKey(wk, di)] || {}; }

// ===== TYPE HELPERS =====
function typeClass(t) {
  return ({ easy:'easy', quality:'quality', long:'long', strength:'strength', rest:'rest', tune:'tune', race:'race' })[t] || 'easy';
}
function typeName(t) {
  return ({ easy:'Easy', quality:'Quality', long:'Long', strength:'Strength', rest:'Rest', tune:'Tune-up', race:'RACE' })[t] || t;
}
function whenClass(w) { return w === 'AM' ? 'when-am' : w === 'PM' ? 'when-pm' : 'when-rest'; }

// ===== TODAY CARD =====
function renderToday() {
  const cur = getCurrentWeekDay();
  const wk = PLAN[cur.week - 1];
  const day = wk.days[cur.dayIdx];
  const t = typeClass(day.type);
  const done = isDone(cur.week, cur.dayIdx);
  const card = document.getElementById('today-card');

  let banner = '';
  if (cur.beforeStart) {
    const today = todayDate(); today.setHours(0,0,0,0);
    const start = new Date(START_DATE); start.setHours(0,0,0,0);
    const daysUntil = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
    const dayWord = daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
    banner = `<div class="callout"><div class="callout-title">Plan starts ${dayWord}</div><p>Training begins Monday May 4. The Mon May 4 workout is shown below — get familiar with the structure before you start.</p></div>`;
  }
  if (cur.afterEnd) banner = `<div class="callout success"><div class="callout-title">Race complete</div><p>You crossed the line. Hope it went well.</p></div>`;

  // Workout structure rows
  let structureHTML = '';
  if (day.workout && day.workout.structure && day.workout.structure.length > 0) {
    const rows = day.workout.structure.map(row => `
      <div class="workout-row">
        <div class="workout-label">${row.label}</div>
        <div class="workout-detail">${row.detail}</div>
        <div class="workout-miles">${row.miles > 0 ? row.miles.toFixed(row.miles % 1 === 0 ? 0 : 2) + ' mi' : ''}</div>
      </div>
    `).join('');
    structureHTML = `
      <div class="workout-structure">
        ${rows}
        <div class="workout-total">
          <span class="workout-total-label">Total</span>
          <span class="workout-total-val">${day.workout.total} mi · ~${day.timeMin} min</span>
        </div>
      </div>
    `;
  }

  card.innerHTML = `
    ${banner}
    <div class="today-meta">
      <span class="today-kicker">Today</span>
      <span class="today-date">${day.day} · ${day.date} · 2026</span>
      <span class="today-week-tag">Week ${cur.week}/25 · ${wk.phase}</span>
    </div>
    <div class="today-type-pill t-${t}">${typeName(day.type)} · ${day.when}</div>
    <h2 class="today-title">${day.title}</h2>
    <p class="today-desc">${day.desc}</p>
    ${structureHTML}
    <div class="today-meta-row">
      <div class="meta-item">
        <span class="meta-lbl">Pace</span>
        <span class="meta-val font-mono">${day.pace}</span>
      </div>
      <div class="meta-item">
        <span class="meta-lbl">Where</span>
        <span class="meta-val">${day.route}</span>
      </div>
    </div>
    <div class="today-actions">
      <button class="btn ${done ? 'btn-done' : 'btn-primary'}" onclick="toggleComplete(${cur.week}, ${cur.dayIdx})">
        ${done ? '✓ Done' : 'Mark done'}
      </button>
      <button class="btn" onclick="toggleSkip(${cur.week}, ${cur.dayIdx})">${isSkipped(cur.week, cur.dayIdx) ? '✓ Skipped' : 'Skip'}</button>
      <button class="btn" onclick="openNoteModal(${cur.week}, ${cur.dayIdx})">+ Note</button>
    </div>
    ${renderChecklist(cur.week, cur.dayIdx, day)}
  `;
}

// ===== DAILY CHECKLIST =====
function renderChecklist(wk, di, day) {
  if (!day.extras || day.extras.length === 0) return '';
  const extras = getExtras(wk, di);
  const items = day.extras.map(ex => {
    const isDone = !!extras[ex];
    const cfg = ({
      pushups: { icon: '💪', label: 'Pushups', detail: `Throughout the day · target ${PLAN[wk-1].pushups || 40} total` },
      circuit: { icon: '🔄', label: 'Core + lower circuit', detail: '8–10 min · squats, bridges, planks, dead bugs' },
      bands:   { icon: '🎗', label: 'Resistance bands', detail: '7 min · monster walks, lateral walks, clamshells' },
    })[ex];
    if (!cfg) return '';
    return `
      <div class="check-item ${isDone ? 'done' : ''}" onclick="toggleExtra(${wk}, ${di}, '${ex}')">
        <div class="check-box">${isDone ? '✓' : ''}</div>
        <div class="check-icon t-${ex === 'pushups' ? 'tune' : ex === 'circuit' ? 'strength' : 'easy'}">${cfg.icon}</div>
        <div class="check-content">
          <div class="check-label">${cfg.label}</div>
          <div class="check-detail">${cfg.detail}</div>
        </div>
      </div>
    `;
  }).join('');
  return `
    <div class="checklist">
      <div class="checklist-title">Daily extras</div>
      <div class="checklist-items">${items}</div>
    </div>
  `;
}

// ===== TOP STATS + COUNTDOWN + PROGRESS =====
function renderTopStats() {
  const days = daysToRace();
  document.getElementById('cd-days').textContent = days >= 0 ? days : '0';
  document.getElementById('ts-days').textContent = days >= 0 ? days : '0';

  // Total miles done
  let totalDone = 0, totalPlanned = 0, completedCount = 0, totalCount = 0;
  PLAN.forEach((wk, i) => {
    wk.days.forEach((d, di) => {
      if (d.type !== 'rest') totalCount++;
      totalPlanned += d.workout?.total || 0;
      if (isDone(i + 1, di)) {
        if (d.type !== 'rest') completedCount++;
        totalDone += d.workout?.total || 0;
      }
    });
  });
  document.getElementById('ts-miles').textContent = Math.round(totalDone);
  document.getElementById('ps-miles').textContent = Math.round(totalDone);
  const completionPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  document.getElementById('ps-completion').textContent = completionPct + '%';
  document.getElementById('ps-bar').style.width = completionPct + '%';

  // Weight delta
  if (state.weights.length > 0) {
    const last = state.weights[state.weights.length - 1].lbs;
    const start = state.weights[0].lbs;
    const lost = (start - last).toFixed(1);
    document.getElementById('ps-weight').textContent = lost > 0 ? '−' + lost : (lost < 0 ? '+' + Math.abs(lost) : '0');
    document.getElementById('last-weight').textContent = `Last: ${last} lbs`;
  } else {
    document.getElementById('ps-weight').textContent = '—';
    document.getElementById('last-weight').textContent = `Start: ${RUNNER.startWeight} lbs`;
  }

  // Sleep avg (last 7)
  if (state.sleep.length > 0) {
    const recent = state.sleep.slice(-7);
    const avg = recent.reduce((s, x) => s + x.hrs, 0) / recent.length;
    document.getElementById('ps-sleep').textContent = avg.toFixed(1);
    const last = state.sleep[state.sleep.length - 1].hrs;
    document.getElementById('last-sleep').textContent = `Last: ${last} hrs`;
  } else {
    document.getElementById('ps-sleep').textContent = '—';
    document.getElementById('last-sleep').textContent = `Target: 6.4 hrs`;
  }
}

// ===== THIS WEEK STRIP =====
function renderThisWeek() {
  const cur = getCurrentWeekDay();
  const wk = PLAN[cur.week - 1];
  document.getElementById('thisweek-label').textContent = `Week ${cur.week} · ${wk.phase} · ${wk.miles} mi`;
  document.getElementById('week-strip').innerHTML = wk.days.map((d, di) => {
    const isToday = di === cur.dayIdx;
    const done = isDone(cur.week, di);
    const t = typeClass(d.type);
    return `
      <a class="day-pill ${isToday ? 'is-today' : ''} ${done ? 'is-done' : ''}" onclick="jumpToWeek(${cur.week}); event.preventDefault();" href="#week-detail">
        <div class="dp-day">${d.day}</div>
        <div class="dp-date">${d.date.split(' ')[1]}</div>
        <div class="dp-bar bar-${t}"></div>
        <div class="dp-when">${d.when === 'REST' ? '–' : d.when}</div>
      </a>
    `;
  }).join('');
}

// ===== WEEK NAV =====
function renderWeekNav() {
  const cur = getCurrentWeekDay();
  document.getElementById('week-nav').innerHTML = PLAN.map(wk => {
    const isCurrent = wk.week === cur.week;
    const isPhase0 = wk.week <= 3;
    const allDone = wk.days.every((d, di) => d.type === 'rest' || isDone(wk.week, di));
    return `<button class="week-btn ${viewWeek === wk.week ? 'active' : ''} ${isCurrent ? 'is-current' : ''} ${isPhase0 ? 'phase-0' : ''} ${allDone ? 'complete' : ''}" onclick="jumpToWeek(${wk.week})">${wk.week}</button>`;
  }).join('');
}

// ===== WEEK DETAIL =====
function renderWeekDetail() {
  const wk = PLAN[viewWeek - 1];
  const cur = getCurrentWeekDay();
  const detail = document.getElementById('week-detail');
  if (!detail) return;

  const dayRows = wk.days.map((d, di) => {
    const isToday = wk.week === cur.week && di === cur.dayIdx;
    const done = isDone(wk.week, di);
    const skipped = isSkipped(wk.week, di);
    const t = typeClass(d.type);
    const note = state.notes[dayKey(wk.week, di)];
    return `
      <div class="day-row ${isToday ? 'is-today' : ''} ${done ? 'is-done' : ''}">
        <div class="dr-day"><span class="dr-day-name">${d.day}</span><span class="dr-day-date">${d.date}</span></div>
        <div class="dr-when when-pill ${whenClass(d.when)}">${d.when === 'REST' ? '–' : d.when}</div>
        <div class="dr-type">
          <div class="dr-type-bar bar-${t}"></div>
          <div class="dr-type-name t-${t}" style="background:none;">${typeName(d.type)}</div>
        </div>
        <div class="dr-content">
          <div class="dr-title">${d.title}</div>
          <div class="dr-desc">${d.desc}${note ? '<br><em style="color:var(--accent);">📝 ' + note + '</em>' : ''}</div>
        </div>
        <div class="dr-pace">${d.workout?.total ? d.workout.total + ' mi' : ''}<br><span style="color:var(--text-faint);font-size:11px;">${d.pace !== '—' ? d.pace : ''}</span></div>
        <div class="dr-actions">
          <button class="dr-btn done-btn ${done ? 'is-active' : ''}" onclick="toggleComplete(${wk.week}, ${di})" title="Done">✓</button>
          <button class="dr-btn skip-btn ${skipped ? 'is-active' : ''}" onclick="toggleSkip(${wk.week}, ${di})" title="Skip">⊘</button>
          <button class="dr-btn" onclick="openNoteModal(${wk.week}, ${di})" title="Note">✎</button>
        </div>
      </div>
    `;
  }).join('');

  detail.innerHTML = `
    <div class="wd-header">
      <div>
        <div class="wd-title">Week ${wk.week} · ${wk.dates}</div>
        <div class="wd-dates">${wk.focus}</div>
      </div>
      <div class="wd-meta">
        <span class="wd-tag phase">${wk.phase}</span>
        <span class="wd-tag miles">${wk.miles} mi</span>
        <span class="wd-tag pushups">${wk.pushups} pushups/day</span>
      </div>
    </div>
    <div class="day-list">${dayRows}</div>
  `;
}

// ===== INTERACTIONS =====
function toggleComplete(wk, di) {
  const k = dayKey(wk, di);
  if (state.done[k]) delete state.done[k]; else { state.done[k] = true; delete state.skip[k]; }
  saveState(state);
  renderAll();
  showToast(state.done[k] ? '✓ Marked done' : 'Done removed', 'success');
}
function toggleSkip(wk, di) {
  const k = dayKey(wk, di);
  if (state.skip[k]) delete state.skip[k]; else { state.skip[k] = true; delete state.done[k]; }
  saveState(state);
  renderAll();
  showToast(state.skip[k] ? 'Marked skipped' : 'Skip removed');
}
function toggleExtra(wk, di, ex) {
  const k = dayKey(wk, di);
  if (!state.extras[k]) state.extras[k] = {};
  state.extras[k][ex] = !state.extras[k][ex];
  saveState(state);
  renderToday();
}
function jumpToWeek(n) {
  viewWeek = n;
  renderWeekNav();
  renderWeekDetail();
  const target = document.getElementById('week-detail');
  if (target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function openNoteModal(wk, di) {
  noteContext = { wk, di };
  const day = PLAN[wk - 1].days[di];
  document.getElementById('note-context').textContent = `${day.day}, ${day.date} · ${day.title}`;
  document.getElementById('note-text').value = state.notes[dayKey(wk, di)] || '';
  document.getElementById('note-modal').classList.add('open');
}
function closeNoteModal() {
  document.getElementById('note-modal').classList.remove('open');
  noteContext = null;
}
function saveNote() {
  if (!noteContext) return;
  const text = document.getElementById('note-text').value.trim();
  const k = dayKey(noteContext.wk, noteContext.di);
  if (text) state.notes[k] = text; else delete state.notes[k];
  saveState(state);
  closeNoteModal();
  renderAll();
  showToast('Note saved', 'success');
}
function logWeight() {
  const inp = document.getElementById('weight-input');
  const val = parseFloat(inp.value);
  if (!val || val < 100 || val > 300) { showToast('Enter a valid weight', 'warn'); return; }
  state.weights.push({ date: new Date().toISOString(), lbs: val });
  saveState(state);
  inp.value = '';
  renderTopStats();
  showToast(`Logged ${val} lbs`, 'success');
}
function logSleep() {
  const inp = document.getElementById('sleep-input');
  const val = parseFloat(inp.value);
  if (!val || val < 1 || val > 14) { showToast('Enter hours (1–14)', 'warn'); return; }
  state.sleep.push({ date: new Date().toISOString(), hrs: val });
  saveState(state);
  inp.value = '';
  renderTopStats();
  showToast(`Logged ${val} hrs`, 'success');
}
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => t.className = 'toast', 2400);
}

// ===== INIT =====
function renderAll() {
  renderToday();
  renderTopStats();
  renderThisWeek();
  renderWeekNav();
  renderWeekDetail();
}
document.addEventListener('DOMContentLoaded', () => {
  viewWeek = getCurrentWeekDay().week;
  renderAll();
});
// Modal close on background click
document.addEventListener('click', e => {
  if (e.target.id === 'note-modal') closeNoteModal();
});
