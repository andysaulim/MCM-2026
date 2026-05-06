// ============================================================
// MCM 2026 — Settings, integrations (Fitbit, Strava), data I/O
// Loads on every page; injects gear button + modal.
// ============================================================

// Per-deployment OAuth credentials. Fill in after registering apps.
// Strava client_secret is NOT here — it lives in the Cloudflare Worker env.
const MCM_CONFIG = {
  fitbit: {
    clientId: '',                                          // from https://dev.fitbit.com/apps
    redirectUri: location.origin + location.pathname.replace(/[^/]*$/, ''),
    scopes: ['weight', 'sleep', 'profile'],
  },
  strava: {
    clientId: '',                                          // intentionally disabled — see Settings render below
    workerUrl: '',
    scopes: ['read', 'activity:read'],
  },
};

const isFitbitConfigured = () => !!MCM_CONFIG.fitbit.clientId;
const isStravaConfigured = () => !!MCM_CONFIG.strava.clientId && !!MCM_CONFIG.strava.workerUrl;

// ===== CRYPTO HELPERS (PKCE + state) =====
async function sha256(s) {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return new Uint8Array(hash);
}
function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function randomString(n = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(n))).map(b => chars[b % chars.length]).join('');
}

// ===== SETTINGS BUTTON + MODAL INJECTION =====
function injectSettingsChrome() {
  const inner = document.querySelector('.topnav-inner');
  if (inner && !document.getElementById('settings-btn')) {
    const btn = document.createElement('button');
    btn.id = 'settings-btn';
    btn.className = 'settings-btn';
    btn.setAttribute('aria-label', 'Settings');
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>`;
    btn.onclick = openSettings;
    inner.appendChild(btn);
  }

  if (!document.getElementById('settings-modal')) {
    const modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.className = 'modal-bg';
    modal.innerHTML = `
      <div class="modal modal-wide">
        <div class="modal-head">
          <h2>Settings</h2>
          <button class="modal-close" onclick="closeSettings()" aria-label="Close">×</button>
        </div>
        <div class="settings-body" id="settings-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target.id === 'settings-modal') closeSettings(); });
  }
}

function openSettings() {
  renderSettings();
  document.getElementById('settings-modal').classList.add('open');
}
function closeSettings() {
  document.getElementById('settings-modal').classList.remove('open');
}

function renderSettings() {
  const body = document.getElementById('settings-body');
  if (!body) return;

  const totals = totalsAcrossPlan();
  const lastSaved = (() => {
    const all = Object.values(mcmState.workouts).map(w => w.loggedAt).filter(Boolean);
    if (!all.length) return 'never';
    const last = new Date(all.sort().pop());
    return last.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  })();

  // Integrations section intentionally hidden — Pixel Watch + Fitbit Web
  // API deprecation made auto-sync infeasible, and Strava's OAuth Worker
  // cost more setup than it saved. Manual logging via the Today page
  // works well. The OAuth code below stays in place if anyone ever wants
  // to re-enable it.

  const prefs = getUserPrefs();
  body.innerHTML = `
    <section class="settings-section">
      <h3 class="settings-h">Reminders &amp; calendar</h3>
      <p class="settings-hint" style="margin-bottom:14px;">Export your full training plan as a calendar file. Google Calendar (Android) and Apple Calendar (iOS) both import it natively and handle the reminders — every workout becomes a calendar event with a 30-min-before alarm, plus a daily morning check-in at your wake time.</p>
      <div class="settings-actions">
        <button class="btn btn-primary" onclick="exportIcs()">Export to calendar (.ics)</button>
      </div>
      <p class="settings-hint" style="margin-top:10px; font-size:11px;">After download: <strong>Android</strong> — open the .ics from Downloads or the notification, choose Google Calendar, tap Save. <strong>iOS</strong> — tap the file and choose "Add All to Calendar." Re-export anytime — events have stable UIDs so re-imports update existing entries instead of duplicating.</p>
    </section>

    <section class="settings-section">
      <h3 class="settings-h">Schedule times</h3>
      <p class="settings-hint" style="margin-bottom:14px;">Customize the daily schedule. Times shown 12-hr; pickers use 24-hr. Pre-run snacks auto-shift 30-45 min before each run.</p>
      <div class="prefs-grid">
        <label class="pref-row"><span class="pref-lbl">Wake</span><input type="time" data-pref="wakeTime" value="${prefs.wakeTime}"></label>
        <label class="pref-row"><span class="pref-lbl">AM run</span><input type="time" data-pref="amRunTime" value="${prefs.amRunTime}"></label>
        <label class="pref-row"><span class="pref-lbl">PM run (Mon/Fri)</span><input type="time" data-pref="pmRunTime" value="${prefs.pmRunTime}"></label>
        <label class="pref-row"><span class="pref-lbl">Coffee cutoff</span><input type="time" data-pref="coffeeCutoff" value="${prefs.coffeeCutoff}"></label>
        <label class="pref-row"><span class="pref-lbl">Sleep</span><input type="time" data-pref="sleepTime" value="${prefs.sleepTime}"></label>
      </div>
      <div class="settings-actions" style="margin-top:14px;">
        <button class="btn btn-primary" onclick="savePrefsFromForm()">Save schedule</button>
        <button class="btn btn-skip" onclick="resetPrefsAndReload()">Reset to defaults</button>
      </div>
    </section>

    <section class="settings-section">
      <h3 class="settings-h">Data</h3>
      <div class="settings-stats">
        <div><span class="ss-num">${Object.keys(mcmState.workouts).length}</span><span class="ss-lbl">workout entries</span></div>
        <div><span class="ss-num">${mcmState.weights.length}</span><span class="ss-lbl">weight logs</span></div>
        <div><span class="ss-num">${mcmState.sleep.length}</span><span class="ss-lbl">sleep logs</span></div>
        <div><span class="ss-num">${totals.totalDone.toFixed(1)}</span><span class="ss-lbl">miles run</span></div>
      </div>
      <div class="settings-meta">Schema v${mcmState.schemaVersion} · last save ${lastSaved}</div>
      <div class="settings-actions">
        <button class="btn btn-primary" onclick="exportData()">Export JSON</button>
        <label class="btn">Import JSON<input type="file" accept="application/json,.json" onchange="importData(event)" style="display:none;"></label>
        <button class="btn btn-skip" onclick="clearAllData()">Clear all data</button>
      </div>
      <p class="settings-hint">Export early, export often. localStorage is fragile — clearing site data, switching browsers, or Safari's "site inactive" purge will wipe 6 months of training in one click. Save the JSON to your phone or email it to yourself.</p>
    </section>
  `;
}

// ===== EXPORT / IMPORT / CLEAR =====
function exportData() {
  const blob = new Blob([JSON.stringify(mcmState, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `mcm2026-andy-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  showToast('Exported · save this file', 'success');
}

function importData(ev) {
  const file = ev.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (typeof parsed !== 'object' || parsed === null) throw new Error('Not a JSON object');
      const migrated = migrate(parsed);
      if (!confirm(`Import ${Object.keys(migrated.workouts).length} workouts, ${migrated.weights.length} weights, ${migrated.sleep.length} sleep logs? This replaces your current data.`)) return;
      mcmState = migrated;
      saveState(mcmState);
      showToast('Imported · reload to apply', 'success');
      setTimeout(() => location.reload(), 1200);
    } catch (e) {
      showToast('Import failed: ' + e.message, 'warn');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (!confirm('Erase all logs, weights, sleep, and integration tokens? This cannot be undone (export first).')) return;
  if (!confirm('Really, really sure? This is irreversible.')) return;
  localStorage.removeItem(STATE_KEY);
  showToast('Data cleared · reloading');
  setTimeout(() => location.reload(), 800);
}

// ===== CALENDAR EXPORT (.ics) =====
// Generates a calendar file the user can import into iOS / Google / Apple
// Calendar. Each scheduled workout becomes an event with a 30-min-before alarm,
// plus one daily morning check-in reminder at the user's wake time. Times are
// written as local with TZID=America/New_York; safe for users actually in ET.
function pad2(n) { return String(n).padStart(2, '0'); }
function icsDate(yr, mo, dy, h, m) { return `${yr}${pad2(mo)}${pad2(dy)}T${pad2(h)}${pad2(m)}00`; }
function icsEscape(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }

function generateIcs() {
  if (typeof PLAN === 'undefined') return '';
  const prefs = getUserPrefs();
  const TZ = 'America/New_York';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MCM 2026 Training//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:MCM 2026 Training',
    'X-WR-TIMEZONE:' + TZ,
    'X-WR-CALDESC:Marathon training plan with 30-min reminders',
  ];

  const startDay = new Date(2026, 4, 4);                                  // May 4 2026 local
  const nowStamp = (() => {
    const d = new Date();
    return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`;
  })();

  const emojiFor = { easy: '🏃', quality: '⚡', long: '🛣️', strength: '🏋️', tune: '🏁', race: '🏆', rest: '💤' };

  PLAN.forEach((wk, wi) => {
    wk.days.forEach((d, di) => {
      if (d.type === 'rest') return;

      const dayDate = new Date(startDay);
      dayDate.setDate(startDay.getDate() + wi * 7 + di);

      const isMonOrFri = ['Mon', 'Fri'].includes(d.day);
      const userPrefersNight = isMonOrFri && d.type !== 'strength';
      let startStr;
      if (userPrefersNight)            startStr = prefs.pmRunTime;
      else if (d.when === 'AM')        startStr = prefs.amRunTime;
      else if (d.when === 'PM')        startStr = prefs.pmRunTime;
      else                              startStr = prefs.amRunTime;
      const [sh, sm] = startStr.split(':').map(Number);

      const durMin = Math.max(30, d.timeMin || 60);
      const totalStart = sh * 60 + sm;
      const totalEnd   = totalStart + durMin;
      const eh = Math.floor(totalEnd / 60) % 24;
      const em = totalEnd % 60;
      const carryDay = totalEnd >= 1440 ? 1 : 0;
      const endDate = new Date(dayDate);
      endDate.setDate(dayDate.getDate() + carryDay);

      const summary = `${emojiFor[d.type] || '🏃'} ${d.title}`;
      const descParts = [d.desc];
      if (d.workout?.total) descParts.push(`${d.workout.total} mi · ${d.pace}`);
      if (d.route && d.route !== '—') descParts.push(`Route: ${d.route}`);

      lines.push(
        'BEGIN:VEVENT',
        `UID:mcm2026-w${wi + 1}d${di}@andysaulim.github.io`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART;TZID=${TZ}:${icsDate(dayDate.getFullYear(), dayDate.getMonth() + 1, dayDate.getDate(), sh, sm)}`,
        `DTEND;TZID=${TZ}:${icsDate(endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate(), eh, em)}`,
        `SUMMARY:${icsEscape(summary)}`,
        `DESCRIPTION:${icsEscape(descParts.join('\n'))}`,
      );
      if (d.route && d.route !== '—') lines.push(`LOCATION:${icsEscape(d.route)}`);
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'TRIGGER:-PT30M',
        `DESCRIPTION:${icsEscape(d.title)} in 30 min`,
        'END:VALARM',
        'END:VEVENT',
      );
    });
  });

  // One recurring daily morning check-in reminder at wake time
  const [wh, wm] = prefs.wakeTime.split(':').map(Number);
  lines.push(
    'BEGIN:VEVENT',
    'UID:mcm2026-daily-checkin@andysaulim.github.io',
    `DTSTAMP:${nowStamp}`,
    `DTSTART;TZID=${TZ}:${icsDate(2026, 5, 4, wh, wm)}`,
    `DTEND;TZID=${TZ}:${icsDate(2026, 5, 4, wh, wm + 5)}`,
    'RRULE:FREQ=DAILY;UNTIL=20261026T000000Z',
    'SUMMARY:📋 Morning check-in',
    'DESCRIPTION:Log weight, sleep, and start the day. Open the app.',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:PT0M',
    'DESCRIPTION:Morning check-in',
    'END:VALARM',
    'END:VEVENT',
  );

  lines.push('END:VCALENDAR');
  return lines.filter(Boolean).join('\r\n');
}

function exportIcs() {
  const ics = generateIcs();
  if (!ics) { showToast('Plan not loaded', 'warn'); return; }
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mcm2026-training.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  showToast('Calendar file ready · open it to import', 'success');
}

// ===== SCHEDULE PREFS HANDLERS =====
function savePrefsFromForm() {
  document.querySelectorAll('[data-pref]').forEach(el => {
    const k = el.getAttribute('data-pref');
    const v = el.value;
    if (v) savePref(k, v); else savePref(k, null);
  });
  showToast('Schedule saved · reloading');
  setTimeout(() => location.reload(), 600);
}
function resetPrefsAndReload() {
  if (!confirm('Reset all schedule times to the original defaults?')) return;
  resetPrefs();
  showToast('Schedule reset · reloading');
  setTimeout(() => location.reload(), 600);
}

// ============================================================
// FITBIT — PKCE OAuth (browser-only, no backend)
// ============================================================
async function connectFitbit() {
  if (!isFitbitConfigured()) { showToast('Fitbit Client ID not configured', 'warn'); return; }
  const verifier = randomString(96);
  const state = randomString(24);
  const challenge = base64url(await sha256(verifier));
  sessionStorage.setItem('fitbit_pkce_verifier', verifier);
  sessionStorage.setItem('fitbit_oauth_state', state);
  const params = new URLSearchParams({
    client_id: MCM_CONFIG.fitbit.clientId,
    response_type: 'code',
    scope: MCM_CONFIG.fitbit.scopes.join(' '),
    redirect_uri: MCM_CONFIG.fitbit.redirectUri,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });
  location.href = `https://www.fitbit.com/oauth2/authorize?${params}`;
}

async function handleFitbitCallback() {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const stateParam = params.get('state');
  const verifier = sessionStorage.getItem('fitbit_pkce_verifier');
  const expectedState = sessionStorage.getItem('fitbit_oauth_state');
  if (!code || !verifier || !expectedState) return false;
  if (stateParam !== expectedState) {
    showToast('Fitbit OAuth state mismatch', 'warn');
    sessionStorage.removeItem('fitbit_pkce_verifier');
    sessionStorage.removeItem('fitbit_oauth_state');
    history.replaceState({}, '', location.pathname);
    return false;
  }
  try {
    const body = new URLSearchParams({
      client_id: MCM_CONFIG.fitbit.clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: MCM_CONFIG.fitbit.redirectUri,
      code_verifier: verifier,
    });
    const resp = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.errors?.[0]?.message || 'Fitbit token exchange failed');
    mcmState.integrations.fitbit = {
      connected: true,
      userId: data.user_id,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      lastSyncTs: null,
    };
    saveState(mcmState);
    sessionStorage.removeItem('fitbit_pkce_verifier');
    sessionStorage.removeItem('fitbit_oauth_state');
    history.replaceState({}, '', location.pathname);
    showToast('Fitbit connected ✓', 'success');
    await syncFitbit();
    return true;
  } catch (e) {
    showToast('Fitbit connect failed: ' + e.message, 'warn');
    return false;
  }
}

async function refreshFitbitToken() {
  const fb = mcmState.integrations.fitbit;
  if (!fb.refreshToken) throw new Error('no Fitbit refresh token');
  const resp = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: MCM_CONFIG.fitbit.clientId,
      grant_type: 'refresh_token',
      refresh_token: fb.refreshToken,
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error('Fitbit refresh failed');
  fb.accessToken = data.access_token;
  fb.refreshToken = data.refresh_token;
  fb.expiresAt = Date.now() + data.expires_in * 1000;
  saveState(mcmState);
}

async function fitbitFetch(path) {
  const fb = mcmState.integrations.fitbit;
  if (Date.now() > fb.expiresAt - 60000) await refreshFitbitToken();
  const resp = await fetch(`https://api.fitbit.com${path}`, {
    headers: { Authorization: `Bearer ${fb.accessToken}` },
  });
  if (resp.status === 401) {
    await refreshFitbitToken();
    return fitbitFetch(path);
  }
  if (!resp.ok) throw new Error(`Fitbit ${resp.status}`);
  return resp.json();
}

async function syncFitbit() {
  if (!mcmState.integrations.fitbit.connected) return;
  try {
    showToast('Syncing Fitbit…');
    const today = new Date().toISOString().slice(0, 10);
    const [weightData, sleepData] = await Promise.all([
      fitbitFetch(`/1/user/-/body/log/weight/date/${today}/30d.json`),
      fitbitFetch(`/1.2/user/-/sleep/date/${today}/30d.json`),
    ]);

    const existingW = new Set(mcmState.weights.filter(w => w.source === 'fitbit').map(w => w.date.slice(0, 10)));
    let nW = 0;
    (weightData.weight || []).forEach(w => {
      if (existingW.has(w.date)) return;
      mcmState.weights.push({ date: w.date + 'T00:00:00Z', lbs: w.weight, source: 'fitbit' });
      nW++;
    });
    mcmState.weights.sort((a, b) => new Date(a.date) - new Date(b.date));

    const existingS = new Set(mcmState.sleep.filter(s => s.source === 'fitbit').map(s => s.date.slice(0, 10)));
    let nS = 0;
    (sleepData.sleep || []).forEach(s => {
      if (existingS.has(s.dateOfSleep)) return;
      mcmState.sleep.push({ date: s.dateOfSleep + 'T00:00:00Z', hrs: +(s.duration / 3600000).toFixed(2), source: 'fitbit' });
      nS++;
    });
    mcmState.sleep.sort((a, b) => new Date(a.date) - new Date(b.date));

    mcmState.integrations.fitbit.lastSyncTs = Date.now();
    saveState(mcmState);
    if (typeof renderAll === 'function') renderAll();
    renderSettings();
    showToast(`Fitbit: +${nW} weights · +${nS} sleep`, 'success');
  } catch (e) {
    showToast('Fitbit sync failed: ' + e.message, 'warn');
  }
}

function disconnectFitbit() {
  mcmState.integrations.fitbit = { connected: false, userId: null, accessToken: null, refreshToken: null, expiresAt: null, lastSyncTs: null };
  saveState(mcmState);
  renderSettings();
  showToast('Fitbit disconnected');
}

// ============================================================
// STRAVA — OAuth via Cloudflare Worker (client_secret server-side)
// ============================================================
async function connectStrava() {
  if (!isStravaConfigured()) { showToast('Strava not configured', 'warn'); return; }
  const state = randomString(24);
  sessionStorage.setItem('strava_oauth_state', state);
  const params = new URLSearchParams({
    client_id: MCM_CONFIG.strava.clientId,
    redirect_uri: location.origin + location.pathname,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: MCM_CONFIG.strava.scopes.join(','),
    state,
  });
  location.href = `https://www.strava.com/oauth/authorize?${params}`;
}

async function handleStravaCallback() {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const stateParam = params.get('state');
  const expectedState = sessionStorage.getItem('strava_oauth_state');
  if (!code || !expectedState) return false;
  if (stateParam !== expectedState) {
    showToast('Strava OAuth state mismatch', 'warn');
    sessionStorage.removeItem('strava_oauth_state');
    history.replaceState({}, '', location.pathname);
    return false;
  }
  try {
    const resp = await fetch(`${MCM_CONFIG.strava.workerUrl}/token-exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.message || 'Strava token exchange failed');
    mcmState.integrations.strava = {
      connected: true,
      athleteId: data.athlete?.id || null,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at * 1000,
      lastSyncTs: null,
    };
    saveState(mcmState);
    sessionStorage.removeItem('strava_oauth_state');
    history.replaceState({}, '', location.pathname);
    showToast('Strava connected ✓', 'success');
    await syncStrava();
    return true;
  } catch (e) {
    showToast('Strava connect failed: ' + e.message, 'warn');
    return false;
  }
}

async function refreshStravaToken() {
  const sv = mcmState.integrations.strava;
  if (!sv.refreshToken) throw new Error('no Strava refresh token');
  const resp = await fetch(`${MCM_CONFIG.strava.workerUrl}/token-refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: sv.refreshToken }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error('Strava refresh failed');
  sv.accessToken = data.access_token;
  sv.refreshToken = data.refresh_token;
  sv.expiresAt = data.expires_at * 1000;
  saveState(mcmState);
}

async function stravaFetch(path) {
  const sv = mcmState.integrations.strava;
  if (Date.now() > sv.expiresAt - 60000) await refreshStravaToken();
  const resp = await fetch(`https://www.strava.com/api/v3${path}`, {
    headers: { Authorization: `Bearer ${sv.accessToken}` },
  });
  if (resp.status === 401) { await refreshStravaToken(); return stravaFetch(path); }
  if (!resp.ok) throw new Error(`Strava ${resp.status}`);
  return resp.json();
}

function weekDayFromDate(date) {
  date = new Date(date); date.setHours(0,0,0,0);
  const start = new Date(START_DATE); start.setHours(0,0,0,0);
  const diffDays = Math.floor((date - start) / 86400000);
  if (diffDays < 0 || diffDays >= 175) return null;
  return { week: Math.floor(diffDays / 7) + 1, dayIdx: diffDays % 7 };
}

async function syncStrava() {
  if (!mcmState.integrations.strava.connected) return;
  try {
    showToast('Syncing Strava…');
    // Pull activities from a week before last sync (or training start) so any backdated logs catch up.
    const since = mcmState.integrations.strava.lastSyncTs
      ? Math.floor(mcmState.integrations.strava.lastSyncTs / 1000) - 86400 * 7
      : Math.floor(START_DATE.getTime() / 1000);
    const acts = await stravaFetch(`/athlete/activities?after=${since}&per_page=100`);
    let matched = 0;
    acts.forEach(a => {
      if (a.type !== 'Run') return;
      const wd = weekDayFromDate(a.start_date_local);
      if (!wd) return;
      const k = dayKey(wd.week, wd.dayIdx);
      const existing = mcmState.workouts[k];
      // Don't overwrite a manual log that already has actualMiles.
      if (existing?.source === 'manual' && existing?.actualMiles) return;
      mcmState.workouts[k] = {
        ...(existing || {}),
        status: 'done',
        actualMiles: +(a.distance / 1609.34).toFixed(2),
        durationSec: a.elapsed_time,
        notes: existing?.notes || a.name,
        source: 'strava',
        externalId: a.id,
        loggedAt: new Date().toISOString(),
      };
      matched++;
    });
    mcmState.integrations.strava.lastSyncTs = Date.now();
    saveState(mcmState);
    if (typeof renderAll === 'function') renderAll();
    renderSettings();
    showToast(`Strava: ${matched} run${matched === 1 ? '' : 's'} matched`, 'success');
  } catch (e) {
    showToast('Strava sync failed: ' + e.message, 'warn');
  }
}

function disconnectStrava() {
  mcmState.integrations.strava = { connected: false, athleteId: null, accessToken: null, refreshToken: null, expiresAt: null, lastSyncTs: null };
  saveState(mcmState);
  renderSettings();
  showToast('Strava disconnected');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  injectSettingsChrome();
  // OAuth callbacks land back on whatever page initiated them. Try both —
  // each handler returns false fast if its state isn't in sessionStorage.
  await handleFitbitCallback();
  await handleStravaCallback();
});
