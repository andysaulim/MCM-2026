# MCM 2026 — Marathon Training Tracker

Personal training site for the **51st Marine Corps Marathon · Sunday, October 25, 2026**.

Goal: 4:08 marathon (9:28/mile pace) for Andy Lim. Built as a multi-page web app to live at `andysaulim.github.io/mcm-2026/`.

## What's in here

| Page | Purpose |
|------|---------|
| `index.html` | Daily app — today's workout, week strip, weight & sleep loggers |
| `plan.html` | Full 25-week plan with mileage arc and phase breakdown |
| `exercises.html` | Strength/circuit/band library with embedded form videos |
| `nutrition.html` | Vegetarian fueling — smoothies, restaurant guide, supplements |
| `race.html` | Race-day playbook, course mile-by-mile, gear checklist |

## Tech notes

- Pure HTML/CSS/vanilla JS. No build step. No framework. No npm.
- State persists in `localStorage` (key: `mcm2026_andy`). Schema v2: every workout entry carries actual miles, time, RPE, felt, gels, notes, and source ('manual' / 'strava' / 'fitbit').
- All pages share `js/state.js` (helpers, schema, bottom nav) and `js/integrations.js` (settings, export/import, Fitbit + Strava OAuth).
- Mobile-first design with a fixed bottom tab bar below 700px.
- **Always export from Settings before clearing site data or switching browsers** — localStorage is fragile.

## Integrations (optional)

### Fitbit (auto-fills weight + sleep)
Browser-only OAuth using PKCE — no backend needed.
1. Register a Personal app at https://dev.fitbit.com/apps/new (OAuth 2.0 Application Type: *Client*; Callback URL: your GitHub Pages URL).
2. Paste the Client ID into `MCM_CONFIG.fitbit.clientId` in `js/integrations.js`.
3. Settings → Connect Fitbit.

### Strava (auto-fills runs)
Strava's OAuth requires a server-side secret, so a tiny Cloudflare Worker proxies the token exchange. See `worker/README.md` for setup.

1. Register at https://www.strava.com/settings/api (callback domain: `andysaulim.github.io`).
2. Deploy the Worker (`worker/`) with `STRAVA_CLIENT_ID` + `STRAVA_CLIENT_SECRET` as secrets.
3. Paste the Client ID and Worker URL into `MCM_CONFIG.strava` in `js/integrations.js`.
4. Settings → Connect Strava.

## Deploy to GitHub Pages

1. Create a new repo: `mcm-2026` (under your `andysaulim` account).
2. Drop everything in this folder into the root of that repo.
3. Commit and push:
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/andysaulim/mcm-2026.git
   git push -u origin main
   ```
4. On GitHub: **Settings → Pages → Source: Deploy from branch → main / (root)**.
5. Wait ~1 minute. Site goes live at `https://andysaulim.github.io/mcm-2026/`.
6. On phone: open the URL, **Add to Home Screen**. Looks like a native app.

## Updating

Any change to `js/data.js` (e.g., adjust a workout, swap a route) → push to GitHub → live in ~30 sec.

## State data

`localStorage['mcm2026_andy']` holds:

```json
{
  "done":    { "w5d2": true, ... },
  "skip":    { "w7d1": true, ... },
  "notes":   { "w8d4": "Knee tightness — switched to easy run" },
  "weights": [{ "date": "2026-05-04T...", "lbs": 190.0 }, ...],
  "sleep":   [{ "date": "2026-05-04T...", "hrs": 6.5 }, ...],
  "extras":  { "w5d1": { "pushups": true, "circuit": true } }
}
```

If you switch devices, this state stays on the old device. If that becomes a real annoyance, it's straightforward to swap `localStorage` for a Gist-based sync — but the friction may not be worth it for a 25-week project.

## Plan source

Plan is roughly Hal Higdon Intermediate 1, scaled to 4 runs/week (instead of 5) and peak 36 mpw (instead of ~45) to fit the constraint of also working a restaurant 5 nights per week. Long run peaks at 18 mi (a touch under Higdon's 20). Tune-up half is the DC Half Marathon on Sun Sep 20, 2026.

## License

Personal use. Don't sell.
