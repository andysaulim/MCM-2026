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
- State persists in `localStorage` (key: `mcm2026_andy`). Survives browser closes. Lives on the device.
- Centralized data in `js/data.js` — change one place, all pages update.
- Mobile-first design. Looks good pre-dawn on a phone.

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
