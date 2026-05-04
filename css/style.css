/* ============================================================
   MCM 2026 Training — Design System
   Warm dark mode, single accent, Inter/Outfit/JetBrains Mono
   ============================================================ */

@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

:root {
  /* Surfaces */
  --bg: #0d1117;
  --bg-elev: #161b22;
  --card: #1c2128;
  --card-hover: #262c36;
  --border: #30363d;
  --border-soft: #21262d;

  /* Text — warm, never pure white */
  --text: #f0e9d6;
  --text-dim: #b8b1a3;
  --text-faint: #6e7681;

  /* Accents */
  --accent: #f97316;          /* warm orange — marathon dawn */
  --accent-soft: rgba(249, 115, 22, 0.12);
  --accent-dim: #c2410c;

  /* Semantic */
  --easy: #66bb6a;
  --easy-soft: rgba(102, 187, 106, 0.12);
  --quality: #facc15;
  --quality-soft: rgba(250, 204, 21, 0.12);
  --long: #38bdf8;
  --long-soft: rgba(56, 189, 248, 0.12);
  --strength: #a78bfa;
  --strength-soft: rgba(167, 139, 250, 0.12);
  --rest: #6e7681;
  --rest-soft: rgba(110, 118, 129, 0.12);
  --tune: #ec4899;
  --tune-soft: rgba(236, 72, 153, 0.12);
  --race: #ef4444;
  --race-soft: rgba(239, 68, 68, 0.15);
  --done: #22c55e;
  --warn: #f59e0b;

  /* Typography */
  --font-display: 'Outfit', -apple-system, system-ui, sans-serif;
  --font-body: 'Inter', -apple-system, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Menlo, monospace;

  /* Spacing */
  --space-1: 4px; --space-2: 8px; --space-3: 12px;
  --space-4: 16px; --space-5: 20px; --space-6: 24px;
  --space-8: 32px; --space-10: 40px; --space-12: 48px;

  /* Radius */
  --radius: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  font-feature-settings: 'cv11', 'ss01', 'ss03';
}

body {
  background:
    radial-gradient(ellipse 1000px 500px at top, rgba(249, 115, 22, 0.04), transparent 60%),
    var(--bg);
}

a { color: var(--accent); text-decoration: none; }
a:hover { color: var(--accent-dim); }

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: none;
  color: inherit;
}

/* ===== TOP NAV ===== */
.topnav {
  position: sticky; top: 0; z-index: 50;
  background: rgba(13, 17, 23, 0.85);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-soft);
  padding: 14px 24px;
}
.topnav-inner {
  max-width: 1200px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; flex-wrap: wrap;
}
.brand { display: flex; align-items: center; gap: 12px; }
.brand-mark {
  width: 32px; height: 32px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--accent), #fb923c);
  display: grid; place-items: center;
  font-family: var(--font-display);
  font-weight: 900; font-size: 16px;
  color: #1a0a00;
  letter-spacing: -0.05em;
  box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
}
.brand-text {
  font-family: var(--font-display);
  font-weight: 800; font-size: 17px;
  letter-spacing: -0.02em;
}
.brand-sub {
  display: block;
  font-family: var(--font-body);
  font-weight: 500; font-size: 11px;
  color: var(--text-faint);
  letter-spacing: 0.05em;
  margin-top: -2px;
}

.nav-tabs {
  display: flex; gap: 2px;
  background: var(--bg-elev);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--border-soft);
}
.nav-tab {
  font-family: var(--font-body);
  font-weight: 600; font-size: 13px;
  color: var(--text-dim);
  padding: 7px 14px;
  border-radius: 7px;
  transition: all 0.15s;
  text-decoration: none;
}
.nav-tab:hover { color: var(--text); background: var(--card); }
.nav-tab.active {
  background: var(--card);
  color: var(--text);
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.nav-stats {
  display: flex; gap: 20px;
  font-size: 12px; color: var(--text-dim);
}
.nav-stat { display: flex; flex-direction: column; align-items: flex-end; }
.nav-stat-num {
  font-family: var(--font-mono);
  color: var(--text); font-weight: 700;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
.nav-stat-lbl {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-faint);
  margin-top: 2px;
}

main { max-width: 1200px; margin: 0 auto; padding: 28px 24px 80px; }

/* ===== TYPOGRAPHY ===== */
h1, h2, h3, h4 {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--text);
}
h1 { font-size: 32px; font-weight: 800; }
h2 { font-size: 24px; }
h3 { font-size: 18px; }
h4 { font-size: 15px; font-weight: 600; }

p { color: var(--text-dim); }
strong { color: var(--text); font-weight: 600; }
em { color: var(--text-dim); }

.section-title {
  font-family: var(--font-body);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-faint);
  font-weight: 700;
  margin: 0 0 16px;
  display: flex; align-items: center; justify-content: space-between;
}
.section-title-rt {
  font-size: 12px;
  text-transform: none;
  letter-spacing: 0;
  color: var(--text-faint);
  font-weight: 500;
}

.page-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-soft);
}
.page-kicker {
  font-family: var(--font-body);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--accent);
  font-weight: 700;
  margin-bottom: 8px;
}
.page-title {
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.1;
  margin-bottom: 6px;
}
.page-subtitle {
  font-size: 15px;
  color: var(--text-dim);
  max-width: 600px;
}

/* ===== CARDS ===== */
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
}
.card-hover { transition: all 0.15s; }
.card-hover:hover {
  background: var(--card-hover);
  transform: translateY(-1px);
}

/* ===== BUTTONS ===== */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  transition: all 0.15s;
}
.btn:hover { background: var(--card-hover); border-color: #3a4358; }
.btn-primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #1a0a00;
  font-weight: 700;
}
.btn-primary:hover { background: #ea580c; border-color: #ea580c; }
.btn-done {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
  color: var(--done);
}
.btn-skip { color: var(--text-dim); }

/* ===== TYPE COLORS ===== */
.t-easy     { color: var(--easy);     background: var(--easy-soft); }
.t-quality  { color: var(--quality);  background: var(--quality-soft); }
.t-long     { color: var(--long);     background: var(--long-soft); }
.t-rest     { color: var(--rest);     background: var(--rest-soft); }
.t-strength { color: var(--strength); background: var(--strength-soft); }
.t-tune     { color: var(--tune);     background: var(--tune-soft); }
.t-race     { color: var(--race);     background: var(--race-soft); }

.bar-easy     { background: var(--easy); }
.bar-quality  { background: var(--quality); }
.bar-long     { background: var(--long); }
.bar-rest     { background: var(--rest); }
.bar-strength { background: var(--strength); }
.bar-tune     { background: var(--tune); }
.bar-race     { background: var(--race); }

/* ===== AM/PM PILLS ===== */
.when-pill {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 5px;
  letter-spacing: 0.05em;
}
.when-am   { background: rgba(250, 204, 21, 0.15); color: var(--quality); }
.when-pm   { background: rgba(167, 139, 250, 0.15); color: var(--strength); }
.when-rest { background: rgba(110, 118, 129, 0.12); color: var(--text-faint); }

/* ===== TABLES ===== */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th, td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid var(--border-soft);
  vertical-align: top;
}
th {
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-faint);
  background: var(--bg-elev);
}
td.num {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--text);
}

/* ===== CALLOUTS ===== */
.callout {
  background: var(--bg-elev);
  border-left: 3px solid var(--accent);
  border-radius: 10px;
  padding: 16px 20px;
  margin: 20px 0;
}
.callout-title {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
  margin-bottom: 8px;
}
.callout p { font-size: 14px; margin-bottom: 6px; }
.callout p:last-child { margin-bottom: 0; }
.callout.warn { border-left-color: var(--race); }
.callout.warn .callout-title { color: var(--race); }
.callout.success { border-left-color: var(--done); }
.callout.success .callout-title { color: var(--done); }

/* ===== TOAST ===== */
.toast {
  position: fixed; bottom: 24px; left: 50%;
  transform: translateX(-50%) translateY(120px);
  background: var(--card);
  border: 1px solid var(--border);
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px; font-weight: 600;
  z-index: 200;
  transition: transform 0.3s;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.toast.show { transform: translateX(-50%) translateY(0); }
.toast.success { border-color: rgba(34, 197, 94, 0.4); color: var(--done); }
.toast.warn { border-color: rgba(245, 158, 11, 0.4); color: var(--warn); }

/* ===== FORM INPUTS ===== */
input[type="number"], input[type="text"], textarea {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 11px 14px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 14px;
  width: 100%;
}
input:focus, textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.input-row {
  display: flex; gap: 8px;
  margin-bottom: 16px;
}

/* ===== UTILITY ===== */
.font-mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.text-dim { color: var(--text-dim); }
.text-faint { color: var(--text-faint); }
.text-accent { color: var(--accent); }
.muted { opacity: 0.5; }

/* ===== RESPONSIVE ===== */
@media (max-width: 900px) {
  .topnav { padding: 12px 16px; }
  .nav-stats { display: none; }
  main { padding: 20px 16px 80px; }
  .page-title { font-size: 28px; }
  h1 { font-size: 26px; }
}
@media (max-width: 560px) {
  .nav-tabs { width: 100%; justify-content: space-between; }
  .nav-tab { flex: 1; padding: 7px 8px; font-size: 12px; text-align: center; }
}
