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
    clientId: '',                                          // from https://www.strava.com/settings/api
    workerUrl: '',                                         // your Cloudflare Worker URL, e.g. https://mcm-strava.<account>.workers.dev
    scopes: ['read', 'activity:read'],
  },
};

const isFitbitConfigured = () => !!MCM_CONFIG.fitbit.clientId;
const isStravaConfigured = () => !!MCM_CONFIG.strava.clientId && !!MCM_CONFIG.strava.workerUrl;

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

  const fitbit = mcmState.integrations.fitbit;
  const strava = mcmState.integrations.strava;

  body.innerHTML = `
    <section class="settings-section">
      <h3 class="settings-h">Integrations</h3>

      <div class="integ-row">
        <div class="integ-info">
          <div class="integ-name">Fitbit</div>
          <div class="integ-detail">${fitbit.connected
            ? `Connected · last sync ${fitbit.lastSyncTs ? new Date(fitbit.lastSyncTs).toLocaleString() : '—'}`
            : 'Auto-fills weight and sleep from your tracker.'}</div>
        </div>
        <div class="integ-actions">
          ${fitbit.connected
            ? `<button class="btn" onclick="syncFitbit()">Sync now</button>
               <button class="btn btn-skip" onclick="disconnectFitbit()">Disconnect</button>`
            : isFitbitConfigured()
              ? `<button class="btn btn-primary" onclick="connectFitbit()">Connect</button>`
              : `<span class="integ-warn">Add <code>MCM_CONFIG.fitbit.clientId</code> in <code>js/integrations.js</code> to enable.</span>`
          }
        </div>
      </div>

      <div class="integ-row">
        <div class="integ-info">
          <div class="integ-name">Strava</div>
          <div class="integ-detail">${strava.connected
            ? `Connected · last sync ${strava.lastSyncTs ? new Date(strava.lastSyncTs).toLocaleString() : '—'}`
            : 'Auto-fills run distance, time, pace from your activities.'}</div>
        </div>
        <div class="integ-actions">
          ${strava.connected
            ? `<button class="btn" onclick="syncStrava()">Sync now</button>
               <button class="btn btn-skip" onclick="disconnectStrava()">Disconnect</button>`
            : isStravaConfigured()
              ? `<button class="btn btn-primary" onclick="connectStrava()">Connect</button>`
              : `<span class="integ-warn">Add <code>MCM_CONFIG.strava.clientId</code> + <code>workerUrl</code> in <code>js/integrations.js</code>, and deploy the Worker in <code>worker/</code>.</span>`
          }
        </div>
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
  if (!confirm('Really, really sure? Type-OK irreversible.')) return;
  localStorage.removeItem(STATE_KEY);
  showToast('Data cleared · reloading');
  setTimeout(() => location.reload(), 800);
}

// ===== INTEGRATION STUBS (filled in Passes 8/9) =====
function connectFitbit()    { showToast('Fitbit OAuth not wired yet', 'warn'); }
function syncFitbit()       { showToast('Fitbit sync not wired yet', 'warn'); }
function disconnectFitbit() {
  mcmState.integrations.fitbit = { connected: false, userId: null, accessToken: null, refreshToken: null, expiresAt: null, lastSyncTs: null };
  saveState(mcmState);
  renderSettings();
}
function connectStrava()    { showToast('Strava OAuth not wired yet', 'warn'); }
function syncStrava()       { showToast('Strava sync not wired yet', 'warn'); }
function disconnectStrava() {
  mcmState.integrations.strava = { connected: false, athleteId: null, accessToken: null, refreshToken: null, expiresAt: null, lastSyncTs: null };
  saveState(mcmState);
  renderSettings();
}

document.addEventListener('DOMContentLoaded', injectSettingsChrome);
