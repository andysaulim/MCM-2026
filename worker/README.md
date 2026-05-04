# Strava OAuth Worker

Tiny Cloudflare Worker that holds the Strava `client_secret` server-side so the static site at `andysaulim.github.io/MCM-2026/` can exchange and refresh OAuth tokens without leaking the secret.

It does two things, nothing more:
- `POST /token-exchange  { code }`           → exchange auth code for access + refresh tokens
- `POST /token-refresh   { refresh_token }`  → refresh tokens

Activity reads happen directly from the browser using the access token; the secret is only needed for token endpoints.

## One-time setup

1. Install Wrangler (Cloudflare's CLI):
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. Register a Strava app at https://www.strava.com/settings/api with:
   - Authorization Callback Domain: `andysaulim.github.io`
   - (You'll get a Client ID and Client Secret.)

3. From this directory, set the secrets:
   ```bash
   cd worker
   wrangler secret put STRAVA_CLIENT_ID
   wrangler secret put STRAVA_CLIENT_SECRET
   ```

4. Deploy:
   ```bash
   wrangler deploy
   ```
   Wrangler will print a URL like `https://mcm-strava.<your-subdomain>.workers.dev`.

5. Paste that URL into `js/integrations.js`:
   ```js
   const MCM_CONFIG = {
     strava: {
       clientId: '12345',                                   // public Strava Client ID
       workerUrl: 'https://mcm-strava.<your-subdomain>.workers.dev',
       ...
     },
   };
   ```
   Commit and push. The "Connect Strava" button in Settings will start working.

## Tightening CORS

`ALLOWED_ORIGIN` in `src/index.js` is hardcoded to `https://andysaulim.github.io`. If you deploy under a different origin, update it.

## Free tier

Cloudflare Workers free tier gives 100k requests/day. One person syncing every few minutes will use roughly 0% of that.
