const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const PORT = 3001;

// OAuth 2.1: redirect_uri trebuie preinregistrat 
// Vezi RFC OAuth 2.1 / OAuth 2.0 Security BCP: potrivire exacta redirect_uri.
const BASE_URL = `http://localhost:${PORT}`;
const ALLOWED_REDIRECT_PATHS = ['/', '/index.html', '/dashboard.html'];

function isAllowedRedirectUri(uri) {
  if (!uri || typeof uri !== 'string') return false;
  try {
    const u = new URL(uri, BASE_URL);
    if (u.origin !== BASE_URL) return false;  // doar same-origin
    const pathname = u.pathname || '/';
    return ALLOWED_REDIRECT_PATHS.some((p) => pathname === p || pathname === p.replace(/^\//, ''));
  } catch {
    return false;
  }
}

app.use(cors());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Login securizat: afiseaza pagina doar cand redirect_uri este permis
app.get('/login', (req, res) => {
  const nextUrl = req.query.next;

  if (nextUrl && isAllowedRedirectUri(nextUrl)) {
    const safeNext = encodeURIComponent(nextUrl);
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Acme Corp - Sign In (Secure)</title>
        <style>
          :root { --primary: #059669; --bg: #f8fafc; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: var(--bg); display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .login-card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
          .logo { font-weight: 800; font-size: 1.5rem; color: var(--primary); margin-bottom: 1rem; }
          .badge { font-size: 0.7rem; background: #d1fae5; color: #047857; padding: 2px 6px; border-radius: 4px; margin-left: 6px; }
          h1 { font-size: 1.25rem; color: #1e293b; margin-bottom: 0.5rem; }
          p { color: #64748b; font-size: 0.875rem; margin-bottom: 2rem; }
          .btn { display: inline-block; background: var(--primary); color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 600; }
          .btn:hover { background: #047857; }
        </style>
      </head>
      <body>
        <div class="login-card">
          <div class="logo">ACME CORP <span class="badge">OAuth 2.1</span></div>
          <h1>Identity Gateway</h1>
          <p>Sign in with your corporate account to continue.</p>
          <a href="/login/confirm?next=${safeNext}" class="btn">SSO Login</a>
        </div>
      </body>
      </html>
    `);
  } else {
    res.redirect(302, '/dashboard.html?login=true');
  }
});

// Sigur: Redirectioneaza doar catre redirect_uri din white list (URI preinregistrate OAuth 2.1).
app.get('/login/confirm', (req, res) => {
  const nextUrl = req.query.next;
  if (nextUrl && isAllowedRedirectUri(nextUrl)) {
    res.redirect(302, nextUrl);
  } else {
    res.redirect(302, '/dashboard.html');
  }
});

app.listen(PORT, () => {
  console.log(`[Secure App] Running at http://localhost:${PORT}`);
});
