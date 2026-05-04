// MCM 2026 — Strava OAuth proxy
// Holds the Strava client_secret server-side so the static site can
// exchange and refresh tokens without exposing it.

const ALLOWED_ORIGIN = 'https://andysaulim.github.io';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
    if (request.method !== 'POST') return cors(new Response('POST only', { status: 405 }));
    if (!env.STRAVA_CLIENT_ID || !env.STRAVA_CLIENT_SECRET) {
      return cors(new Response('Worker not configured', { status: 500 }));
    }

    const url = new URL(request.url);
    let body;
    try { body = await request.json(); } catch { body = {}; }

    if (url.pathname === '/token-exchange' && body.code) {
      return cors(await stravaToken({
        client_id: env.STRAVA_CLIENT_ID,
        client_secret: env.STRAVA_CLIENT_SECRET,
        code: body.code,
        grant_type: 'authorization_code',
      }));
    }
    if (url.pathname === '/token-refresh' && body.refresh_token) {
      return cors(await stravaToken({
        client_id: env.STRAVA_CLIENT_ID,
        client_secret: env.STRAVA_CLIENT_SECRET,
        refresh_token: body.refresh_token,
        grant_type: 'refresh_token',
      }));
    }
    return cors(new Response('Not found', { status: 404 }));
  },
};

async function stravaToken(params) {
  const r = await fetch('https://www.strava.com/api/v3/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  return new Response(await r.text(), {
    status: r.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function cors(resp) {
  const out = new Response(resp.body, resp);
  out.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  out.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  out.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  out.headers.set('Vary', 'Origin');
  return out;
}
