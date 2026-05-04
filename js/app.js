// ============================================================
// MCM 2026 — Today page renderer (uses js/state.js helpers)
// ============================================================

let viewWeek = 1;
let noteContext = null;

// ===== TODAY CARD =====
function renderToday() {
  const cur = getCurrentWeekDay();
  const wk = PLAN[cur.week - 1];
  const day = wk.days[cur.dayIdx];
  const t = typeClass(day.type);
  const w = getWorkout(cur.week, cur.dayIdx);
  const done = w.status === 'done';
  const skipped = w.status === 'skip';
  const card = document.getElementById('today-card');
  if (!card) return;

  let banner = '';
  if (cur.beforeStart) {
    const today = todayDate(); today.setHours(0,0,0,0);
    const start = new Date(START_DATE); start.setHours(0,0,0,0);
    const daysUntil = Math.ceil((start - today) / 86400000);
    banner = `<div class="callout"><div class="callout-title">Plan starts ${daysUntil === 1 ? 'tomorrow' : 'in ' + daysUntil + ' days'}</div><p>Training begins Monday May 4. The Mon May 4 workout is shown below — get familiar with the structure before you start.</p></div>`;
  } else if (cur.afterEnd) {
    banner = `<div class="callout success"><div class="callout-title">Race complete</div><p>You crossed the line. Hope it went well.</p></div>`;
  } else if (isRaceWeek()) {
    const d = daysToRace();
    banner = `
      <div class="callout race-week">
        <div class="callout-title">🏁 Race week — ${d === 0 ? 'today' : d + ' day' + (d === 1 ? '' : 's') + ' to go'}</div>
        <p>Keep it boring. Sleep, hydrate, carb-load. Quick links:
          <a href="race.html#fuel-protocol">food protocol</a> ·
          <a href="race.html#timeline">timeline</a> ·
          <a href="race.html#gear">gear checklist</a> ·
          <a href="race.html#mental">mental scripts</a>
        </p>
      </div>`;
  }

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

  // "Why this workout" — purpose + effort + cue, especially helpful for noobs
  const phil = WORKOUT_PURPOSE[day.type];
  const purposeHTML = phil ? `
    <div class="workout-purpose">
      <div class="wp-row"><span class="wp-lbl">Effort</span><span class="wp-val">${escapeHtml(phil.effort)}</span></div>
      <div class="wp-row"><span class="wp-lbl">Why</span><span class="wp-val">${escapeHtml(phil.purpose)}</span></div>
      <div class="wp-row"><span class="wp-lbl">Cue</span><span class="wp-val">${escapeHtml(phil.cue)}</span></div>
      ${phil.talk_test !== '—' ? `<div class="wp-row"><span class="wp-lbl">Talk test</span><span class="wp-val">${escapeHtml(phil.talk_test)}</span></div>` : ''}
    </div>
  ` : '';

  // Strength day: surface the lift list inline (saves a tab-switch to Strength)
  let strengthHTML = '';
  if (day.type === 'strength' && typeof EXERCISES !== 'undefined') {
    const lifts = EXERCISES.strength || [];
    const circuit = day.extras?.includes('circuit') ? (EXERCISES.circuit || []) : [];
    const bands = day.extras?.includes('bands') ? (EXERCISES.bands || []) : [];
    strengthHTML = `
      <div class="strength-detail">
        <div class="sd-section">
          <div class="sd-head"><span class="sd-h-title">Strength A</span><span class="sd-h-meta">${lifts.length} lifts · ~30 min</span></div>
          <ol class="sd-list">
            ${lifts.map(ex => `<li><span class="sd-name">${escapeHtml(ex.name)}</span><span class="sd-sets">${escapeHtml(ex.sets)}</span></li>`).join('')}
          </ol>
        </div>
        ${circuit.length ? `
          <div class="sd-section">
            <div class="sd-head"><span class="sd-h-title">Core circuit</span><span class="sd-h-meta">${circuit.length} moves · 8–10 min</span></div>
            <ol class="sd-list">
              ${circuit.map(ex => `<li><span class="sd-name">${escapeHtml(ex.name)}</span><span class="sd-sets">${escapeHtml(ex.sets)}</span></li>`).join('')}
            </ol>
          </div>
        ` : ''}
        ${bands.length ? `
          <div class="sd-section">
            <div class="sd-head"><span class="sd-h-title">Resistance bands</span><span class="sd-h-meta">${bands.length} moves · 7 min</span></div>
            <ol class="sd-list">
              ${bands.map(ex => `<li><span class="sd-name">${escapeHtml(ex.name)}</span><span class="sd-sets">${escapeHtml(ex.sets)}</span></li>`).join('')}
            </ol>
          </div>
        ` : ''}
        <div class="sd-link"><a href="exercises.html">Form videos on the Strength page →</a></div>
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
    ${purposeHTML}
    ${strengthHTML}
    ${renderRunLog(cur.week, cur.dayIdx, day, w, done, skipped)}
  `;
}

// ===== TODAY'S SCHEDULE (wake → workout → meals → bed) =====
function renderSchedule() {
  const root = document.getElementById('today-schedule');
  if (!root) return;
  const cur = getCurrentWeekDay();
  const wk = PLAN[cur.week - 1];
  const day = wk.days[cur.dayIdx];
  const items = buildDailySchedule(day, wk);
  const gear = buildDailyGear(day);

  const target = calorieTargetForWeek(cur.week);
  const protein = proteinTargetForWeek(cur.week);
  const dow = day.day;
  const isRestaurantNight = ['Tue', 'Wed', 'Thu'].includes(dow);
  const waterOz = isRestaurantNight ? 120 : 100;       // restaurant nights run hot

  root.innerHTML = `
    <h2 class="section-title">
      <span>Today's schedule</span>
      <span class="section-title-rt">${day.day} · ${day.date} · ${isRestaurantNight ? 'restaurant night' : ['Mon','Fri'].includes(dow) ? 'work day, no restaurant' : 'weekend'}</span>
    </h2>
    <div class="schedule-card">
      <div class="schedule-targets">
        <div class="st-cell"><span class="st-num">${target.cal.toLocaleString()}</span><span class="st-lbl">cal · ${escapeHtml(target.label)}</span></div>
        <div class="st-cell"><span class="st-num">${protein}g</span><span class="st-lbl">protein</span></div>
        <div class="st-cell"><span class="st-num">${waterOz} oz</span><span class="st-lbl">water</span></div>
      </div>
      <div class="schedule-list">
        ${items.map(it => `
          <div class="sched-row">
            <div class="sched-time">${escapeHtml(it.time)}</div>
            <div class="sched-icon">${it.icon}</div>
            <div class="sched-body">
              <div class="sched-title">${escapeHtml(it.title)}</div>
              <div class="sched-detail">${escapeHtml(it.detail)}</div>
            </div>
          </div>
        `).join('')}
      </div>
      ${gear ? `
        <div class="schedule-gear">
          <div class="sg-title">Gear for today</div>
          <ul class="sg-list">
            ${gear.map(g => `<li>${escapeHtml(g)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
}

// ===== POST-RUN LOG =====
function renderRunLog(wk, di, day, w, done, skipped) {
  const isRest = day.type === 'rest';
  if (isRest) {
    return `
      <div class="run-log-rest">
        <div class="today-actions">
          <button class="btn ${done ? 'btn-done' : 'btn-primary'}" onclick="toggleStatus(${wk}, ${di}, 'done')">${done ? '✓ Marked done' : 'Mark rest done'}</button>
          <button class="btn" onclick="openNoteModal(${wk}, ${di})">${w.notes ? '✎ Edit note' : '+ Note'}</button>
        </div>
        ${w.notes ? `<div class="run-log-note">📝 ${escapeHtml(w.notes)}</div>` : ''}
      </div>
    `;
  }

  const plannedMiles = day.workout?.total || '';
  const plannedMin = day.timeMin || '';
  const plannedTimeStr = plannedMin ? `${Math.floor(plannedMin / 60) || ''}${plannedMin >= 60 ? ':' : ''}${String(plannedMin % 60).padStart(plannedMin >= 60 ? 2 : 1, '0')}:00` : '';

  const actualMiles = w.actualMiles ?? '';
  const dur = w.durationSec ? secToHms(w.durationSec) : '';
  const rpe = w.rpe ?? '';
  const felt = w.felt || '';
  const gels = w.gels ?? '';
  const notes = w.notes || '';
  const sourceTag = w.source && w.source !== 'manual' ? `<span class="run-log-source">via ${w.source}</span>` : '';

  return `
    <div class="run-log ${done ? 'is-done' : ''} ${skipped ? 'is-skipped' : ''}" data-wk="${wk}" data-di="${di}">
      <div class="run-log-header">
        <span class="run-log-title">${done ? '✓ Run logged' : skipped ? 'Skipped' : 'Log this run'}</span>
        ${sourceTag}
        ${done && w.actualMiles ? `<span class="run-log-summary">${w.actualMiles} mi · ${dur || '—'} · RPE ${rpe || '—'}</span>` : ''}
      </div>
      <div class="run-log-grid">
        <label class="rl-field">
          <span class="rl-lbl">Actual miles</span>
          <input class="rl-input rl-miles" type="number" step="0.01" placeholder="${plannedMiles}" value="${actualMiles}" inputmode="decimal">
        </label>
        <label class="rl-field">
          <span class="rl-lbl">Time</span>
          <input class="rl-input rl-time" type="text" placeholder="${plannedTimeStr || '1h 30m'}" value="${dur}" inputmode="text" autocapitalize="none">
        </label>
        <label class="rl-field">
          <span class="rl-lbl">RPE 1–10</span>
          <input class="rl-input rl-rpe" type="number" min="1" max="10" placeholder="6" value="${rpe}" inputmode="numeric">
        </label>
        <label class="rl-field">
          <span class="rl-lbl">Felt</span>
          <select class="rl-input rl-felt">
            <option value="">—</option>
            <option value="easy"      ${felt === 'easy'      ? 'selected' : ''}>Easy</option>
            <option value="moderate"  ${felt === 'moderate'  ? 'selected' : ''}>Moderate</option>
            <option value="hard"      ${felt === 'hard'      ? 'selected' : ''}>Hard</option>
            <option value="shattered" ${felt === 'shattered' ? 'selected' : ''}>Shattered</option>
          </select>
        </label>
        <label class="rl-field">
          <span class="rl-lbl">Gels</span>
          <input class="rl-input rl-gels" type="number" min="0" max="12" placeholder="0" value="${gels}" inputmode="numeric">
        </label>
        <label class="rl-field rl-field-wide">
          <span class="rl-lbl">Notes (knee, fuel, weather…)</span>
          <input class="rl-input rl-notes" type="text" value="${escapeHtml(notes)}" placeholder="How did it go?">
        </label>
      </div>
      <div class="run-log-actions">
        <button class="btn btn-primary" onclick="saveRunLog(${wk}, ${di})">${done ? 'Update run' : 'Save run'}</button>
        <button class="btn ${skipped ? 'btn-done' : ''}" onclick="toggleStatus(${wk}, ${di}, 'skip')">${skipped ? '✓ Skipped' : 'Skip'}</button>
        ${done ? `<button class="btn btn-skip" onclick="clearRunLog(${wk}, ${di})">Clear</button>` : ''}
      </div>
    </div>
  `;
}

// ===== MORNING CHECK-IN (weight + sleep + extras unified) =====
function renderCheckIn() {
  const root = document.getElementById('morning-checkin');
  if (!root) return;
  const cur = getCurrentWeekDay();
  const day = PLAN[cur.week - 1].days[cur.dayIdx];
  const extras = getExtras(cur.week, cur.dayIdx);

  const lastWeight = mcmState.weights.length ? mcmState.weights[mcmState.weights.length - 1].lbs : null;
  const startWeight = mcmState.weights.length ? mcmState.weights[0].lbs : (typeof RUNNER !== 'undefined' ? RUNNER.startWeight : 190);
  const goalWeight = typeof RUNNER !== 'undefined' ? RUNNER.goalWeight : 173;
  const lostLbs = lastWeight != null ? (startWeight - lastWeight) : null;

  const lastSleep = mcmState.sleep.length ? mcmState.sleep[mcmState.sleep.length - 1].hrs : null;
  const sleep7 = (() => {
    const recent = mcmState.sleep.slice(-7);
    if (!recent.length) return null;
    return recent.reduce((s, x) => s + x.hrs, 0) / recent.length;
  })();

  const extraConfigs = {
    pushups: { icon: '💪', label: 'Pushups',          detail: `${PLAN[cur.week - 1].pushups || 40} total · spread through the day` },
    circuit: { icon: '🔄', label: 'Core circuit',     detail: '8–10 min · squats, bridges, planks, dead bugs' },
    bands:   { icon: '🎗', label: 'Resistance bands', detail: '7 min · monster walks, lateral walks, clamshells' },
  };
  const extrasHTML = (day.extras || []).map(ex => {
    const cfg = extraConfigs[ex];
    if (!cfg) return '';
    const isDone = !!extras[ex];
    return `
      <div class="check-item ${isDone ? 'done' : ''}" onclick="handleToggleExtra(${cur.week}, ${cur.dayIdx}, '${ex}')">
        <div class="check-box">${isDone ? '✓' : ''}</div>
        <div class="check-icon">${cfg.icon}</div>
        <div class="check-content">
          <div class="check-label">${cfg.label}</div>
          <div class="check-detail">${cfg.detail}</div>
        </div>
      </div>
    `;
  }).join('');

  root.innerHTML = `
    <div class="checkin-header">
      <h3>Morning check-in</h3>
      <span class="checkin-date">${day.day} · ${day.date}</span>
    </div>
    <div class="checkin-row">
      <div class="checkin-label">
        <span class="checkin-lbl-main">Weight</span>
        <span class="checkin-lbl-sub">${lastWeight != null
            ? `${lastWeight} lbs · ${lostLbs > 0 ? '−' + lostLbs.toFixed(1) : lostLbs < 0 ? '+' + Math.abs(lostLbs).toFixed(1) : '0'} since start · goal ${goalWeight}`
            : `start ${startWeight} → goal ${goalWeight}`}</span>
      </div>
      <div class="checkin-input-row">
        <input type="number" id="weight-input" placeholder="${lastWeight ?? startWeight}" step="0.1" inputmode="decimal" />
        <button class="btn btn-primary" onclick="logWeight()">Log</button>
      </div>
    </div>
    <div class="checkin-row">
      <div class="checkin-label">
        <span class="checkin-lbl-main">Sleep</span>
        <span class="checkin-lbl-sub">${lastSleep != null
            ? `last night ${lastSleep} hrs${sleep7 != null ? ` · 7-day avg ${sleep7.toFixed(1)}` : ''} · target 6.4`
            : 'target 6.4 hrs'}</span>
      </div>
      <div class="checkin-input-row">
        <input type="number" id="sleep-input" placeholder="${lastSleep ?? '6.5'}" step="0.1" inputmode="decimal" />
        <button class="btn btn-primary" onclick="logSleep()">Log</button>
      </div>
    </div>
    ${extrasHTML ? `
      <div class="checkin-row checkin-extras">
        <div class="checkin-label">
          <span class="checkin-lbl-main">Today's extras</span>
          <span class="checkin-lbl-sub">${(day.extras || []).length} items</span>
        </div>
        <div class="checklist-items">${extrasHTML}</div>
      </div>
    ` : ''}
  `;
}

// ===== TOP STATS + COUNTDOWN + PROGRESS =====
function renderTopStats() {
  const days = daysToRace();
  const cdEl = document.getElementById('cd-days');
  if (cdEl) cdEl.textContent = days >= 0 ? days : '0';

  const totals = totalsAcrossPlan();
  bindTopnavStats();

  const psMiles = document.getElementById('ps-miles');
  if (psMiles) psMiles.textContent = Math.round(totals.totalDone);

  const completionPct = totals.totalCount === 0 ? 0 : Math.round((totals.completedCount / totals.totalCount) * 100);
  const psComp = document.getElementById('ps-completion');
  if (psComp) psComp.textContent = completionPct + '%';
  const psBar = document.getElementById('ps-bar');
  if (psBar) psBar.style.width = completionPct + '%';

  // Weight delta
  const psWeight = document.getElementById('ps-weight');
  if (psWeight) {
    if (mcmState.weights.length > 0) {
      const last = mcmState.weights[mcmState.weights.length - 1].lbs;
      const start = mcmState.weights[0].lbs;
      const lost = (start - last).toFixed(1);
      psWeight.textContent = lost > 0 ? '−' + lost : (lost < 0 ? '+' + Math.abs(lost) : '0');
    } else {
      psWeight.textContent = '—';
    }
  }

  // Sleep avg (last 7)
  const psSleep = document.getElementById('ps-sleep');
  if (psSleep) {
    if (mcmState.sleep.length > 0) {
      const recent = mcmState.sleep.slice(-7);
      const avg = recent.reduce((s, x) => s + x.hrs, 0) / recent.length;
      psSleep.textContent = avg.toFixed(1);
    } else {
      psSleep.textContent = '—';
    }
  }

  // Streak: consecutive days back from today where status is done OR rest was respected (rest day passed)
  const psStreak = document.getElementById('ps-streak');
  if (psStreak) psStreak.textContent = computeStreak();
}

function computeStreak() {
  const cur = getCurrentWeekDay();
  if (cur.beforeStart) return 0;
  let streak = 0;
  let wk = cur.week, di = cur.dayIdx;
  // Walk backwards from yesterday (today doesn't break the streak if not yet done)
  di--;
  if (di < 0) { wk--; di = 6; }
  while (wk >= 1) {
    const day = PLAN[wk - 1].days[di];
    const w = getWorkout(wk, di);
    // Skips don't maintain a streak — only completed runs and scheduled rest days do.
    const counted = day.type === 'rest' || w.status === 'done';
    if (!counted) break;
    streak++;
    di--;
    if (di < 0) { wk--; di = 6; }
  }
  return streak;
}

// ===== THIS WEEK STRIP =====
function renderThisWeek() {
  const cur = getCurrentWeekDay();
  const wk = PLAN[cur.week - 1];
  const lbl = document.getElementById('thisweek-label');
  if (lbl) lbl.textContent = `Week ${cur.week} · ${wk.phase} · ${wk.miles} mi`;
  const strip = document.getElementById('week-strip');
  if (!strip) return;
  strip.innerHTML = wk.days.map((d, di) => {
    const isToday = di === cur.dayIdx;
    const w = getWorkout(cur.week, di);
    const done = w.status === 'done';
    const t = typeClass(d.type);
    const status = done ? 'completed' : isToday ? 'today, not yet done' : 'pending';
    return `
      <a class="day-pill ${isToday ? 'is-today' : ''} ${done ? 'is-done' : ''}"
         aria-label="${d.day} ${d.date}, ${typeName(d.type)}, ${status}"
         onclick="jumpToWeek(${cur.week}); event.preventDefault();" href="#week-detail">
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
  const nav = document.getElementById('week-nav');
  if (!nav) return;
  nav.innerHTML = PLAN.map(wk => {
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
    const w = getWorkout(wk.week, di);
    const done = w.status === 'done';
    const skipped = w.status === 'skip';
    const t = typeClass(d.type);
    const note = w.notes;
    const actualSummary = (done && w.actualMiles)
      ? `<div class="dr-actual">${w.actualMiles} mi${w.durationSec ? ` · ${secToHms(w.durationSec)}` : ''}${w.rpe ? ` · RPE ${w.rpe}` : ''}${w.felt ? ` · ${w.felt}` : ''}</div>`
      : '';
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
          <div class="dr-desc">${d.desc}${note ? '<br><em style="color:var(--accent);">📝 ' + escapeHtml(note) + '</em>' : ''}</div>
          ${actualSummary}
        </div>
        <div class="dr-pace">${d.workout?.total ? d.workout.total + ' mi' : ''}<br><span style="color:var(--text-faint);font-size:11px;">${d.pace !== '—' ? d.pace : ''}</span></div>
        <div class="dr-actions">
          <button class="dr-btn done-btn ${done ? 'is-active' : ''}" onclick="toggleStatus(${wk.week}, ${di}, 'done')" title="Done">✓</button>
          <button class="dr-btn skip-btn ${skipped ? 'is-active' : ''}" onclick="toggleStatus(${wk.week}, ${di}, 'skip')" title="Skip">⊘</button>
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
function toggleStatus(wk, di, status) {
  const result = setWorkoutStatus(wk, di, status);
  renderAll();
  showToast(result === 'done' ? '✓ Marked done' : result === 'skip' ? 'Marked skipped' : 'Status cleared', result ? 'success' : '');
}
function saveRunLog(wk, di) {
  const root = document.querySelector(`.run-log[data-wk="${wk}"][data-di="${di}"]`);
  if (!root) return;
  const miles = parseFloat(root.querySelector('.rl-miles').value) || null;
  const dur = hmsToSec(root.querySelector('.rl-time').value);
  const rpe = parseInt(root.querySelector('.rl-rpe').value, 10) || null;
  const felt = root.querySelector('.rl-felt').value || null;
  const gels = parseInt(root.querySelector('.rl-gels').value, 10) || 0;
  const notes = root.querySelector('.rl-notes').value.trim();

  if (rpe != null && (rpe < 1 || rpe > 10)) { showToast('RPE must be 1–10', 'warn'); return; }

  logRun(wk, di, {
    actualMiles: miles,
    durationSec: dur || null,
    rpe, felt, gels, notes,
    source: 'manual',
  });
  renderAll();
  showToast('Run saved ✓', 'success');
}
function clearRunLog(wk, di) {
  const k = dayKey(wk, di);
  delete mcmState.workouts[k];
  saveState(mcmState);
  renderAll();
  showToast('Run cleared');
}
function handleToggleExtra(wk, di, ex) {
  toggleExtra(wk, di, ex);
  renderCheckIn();
  renderTopStats();
}
function jumpToWeek(n) {
  viewWeek = n;
  renderWeekNav();
  renderWeekDetail();
  const target = document.getElementById('week-detail');
  if (target?.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function openNoteModal(wk, di) {
  noteContext = { wk, di };
  const day = PLAN[wk - 1].days[di];
  const w = getWorkout(wk, di);
  document.getElementById('note-context').textContent = `${day.day}, ${day.date} · ${day.title}`;
  document.getElementById('note-text').value = w.notes || '';
  document.getElementById('note-modal').classList.add('open');
}
function closeNoteModal() {
  document.getElementById('note-modal').classList.remove('open');
  noteContext = null;
}
function saveNote() {
  if (!noteContext) return;
  const text = document.getElementById('note-text').value;
  setNote(noteContext.wk, noteContext.di, text);
  closeNoteModal();
  renderAll();
  showToast('Note saved', 'success');
}
function logWeight() {
  const inp = document.getElementById('weight-input');
  const val = parseFloat(inp.value);
  if (!val || val < 100 || val > 300) { showToast('Enter a valid weight (100–300)', 'warn'); return; }
  mcmState.weights.push({ date: new Date().toISOString(), lbs: val, source: 'manual' });
  saveState(mcmState);
  inp.value = '';
  renderCheckIn();
  renderTopStats();
  showToast(`Logged ${val} lbs`, 'success');
}
function logSleep() {
  const inp = document.getElementById('sleep-input');
  const val = parseFloat(inp.value);
  if (!val || val < 1 || val > 14) { showToast('Enter hours (1–14)', 'warn'); return; }
  mcmState.sleep.push({ date: new Date().toISOString(), hrs: val, source: 'manual' });
  saveState(mcmState);
  inp.value = '';
  renderCheckIn();
  renderTopStats();
  showToast(`Logged ${val} hrs`, 'success');
}

// ===== INIT =====
function renderAll() {
  renderToday();
  renderCheckIn();
  renderSchedule();
  renderTopStats();
  renderThisWeek();
  renderWeekNav();
  renderWeekDetail();
}
document.addEventListener('DOMContentLoaded', () => {
  viewWeek = getCurrentWeekDay().week;
  renderAll();
});
document.addEventListener('click', e => {
  if (e.target.id === 'note-modal') closeNoteModal();
});
