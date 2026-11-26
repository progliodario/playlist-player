// @ts-check
/**
 * Google sign-in for the Windows app.
 *
 * Google blocks sign-in inside embedded browsers such as Electron windows, so the app
 * opens the user's default browser and receives the answer on a local address:
 *   1. a tiny HTTP server listens on http://127.0.0.1:<SIGN_IN_PORT> (this computer only);
 *   2. the browser opens Google's consent page (OAuth 2.0 implicit flow, read-only scope,
 *      same Web client id as the site, no secret);
 *   3. Google redirects to http://127.0.0.1:<port>/callback#access_token=...; that page
 *      sends the fragment back to the server and the token goes to the web app.
 * The redirect URI must be listed in the Google Cloud OAuth client
 * (docs/sviluppo/account-google.md).
 */
const { randomUUID } = require('node:crypto');
const http = require('node:http');
const { shell } = require('electron');
const { SIGN_IN_PORT } = require('./config.cjs');

const TIMEOUT_MS = 5 * 60 * 1000;
const REDIRECT_URI = `http://127.0.0.1:${SIGN_IN_PORT}/callback`;

const CALLBACK_PAGE = `<!doctype html><html lang="it"><head><meta charset="utf-8">
<title>Playlist Player</title>
<style>body{font-family:system-ui,sans-serif;background:#0d0a1f;color:#f8f4ff;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center}</style>
</head><body><main><h1 id="m">Accesso in corso…</h1></main><script>
fetch('/token', { method: 'POST', body: location.hash.slice(1) })
  .then((r) => r.text())
  .then((t) => { document.getElementById('m').textContent = t; });
</script></body></html>`;

/** @type {Promise<{ accessToken: string, expiresIn: number }> | null} */
let inProgress = null;

/**
 * @param {{ clientId: string, scope: string, prompt: string }} options
 * @param {() => void} onDone  brings the app window back to the front
 * @returns {Promise<{ accessToken: string, expiresIn: number }>}
 */
function signInWithBrowser(options, onDone) {
  inProgress ??= run(options).finally(() => {
    inProgress = null;
    onDone();
  });
  return inProgress;
}

/** @param {{ clientId: string, scope: string, prompt: string }} options */
function run({ clientId, scope, prompt }) {
  const state = randomUUID();
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      if (request.method === 'GET' && request.url?.startsWith('/callback')) {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(CALLBACK_PAGE);
        return;
      }
      if (request.method === 'POST' && request.url === '/token') {
        let body = '';
        request.on('data', (chunk) => {
          body += chunk;
          if (body.length > 10_000) request.destroy();
        });
        request.on('end', () => {
          const params = new URLSearchParams(body);
          const token = params.get('access_token');
          const ok = params.get('state') === state && token;
          response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          response.end(
            ok
              ? 'Accesso completato: puoi chiudere questa scheda e tornare all’app.'
              : 'Accesso non riuscito: torna all’app e riprova.',
          );
          finish(
            ok
              ? null
              : new Error(params.get('error_description') ?? params.get('error') ?? 'No token'),
            ok ? { accessToken: token, expiresIn: Number(params.get('expires_in') ?? 3600) } : null,
          );
        });
        return;
      }
      response.writeHead(404).end();
    });

    const timer = setTimeout(() => finish(new Error('Sign-in timed out'), null), TIMEOUT_MS);

    /**
     * @param {Error | null} error
     * @param {{ accessToken: string, expiresIn: number } | null} result
     */
    function finish(error, result) {
      clearTimeout(timer);
      server.close();
      if (result) resolve(result);
      else reject(error ?? new Error('Sign-in failed'));
    }

    server.on('error', (error) => finish(error, null));
    server.listen(SIGN_IN_PORT, '127.0.0.1', () => {
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('redirect_uri', REDIRECT_URI);
      url.searchParams.set('response_type', 'token');
      url.searchParams.set('scope', scope);
      url.searchParams.set('state', state);
      url.searchParams.set('include_granted_scopes', 'true');
      if (prompt) url.searchParams.set('prompt', prompt);
      void shell.openExternal(url.toString());
    });
  });
}

module.exports = { signInWithBrowser, REDIRECT_URI };
