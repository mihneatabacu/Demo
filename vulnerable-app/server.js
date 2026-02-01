const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// =============================================================================
// VULNERABILITATE: OPEN REDIRECT
// =============================================================================
// Ruta /login/confirm accepta parametrul de query "next" si redirectioneaza
// utilizatorul FARA sa-l valideze. Un atacant poate trimite un link /login?next=...
// astfel incat victima vede o pagina de login reala, da click pe "SSO Login",
// si este apoi redirectionata pe site-ul atacatorului (ex. pagina de phishing
// "Sesiune expirata").
// =============================================================================

// Afiseaza pagina de login cand ?next= este prezent (victima a dat click pe link malitios)
app.get('/login', (req, res) => {
  const nextUrl = req.query.next;

  if (nextUrl) {
    // Servire pagina login cu buton SSO care duce la /login/confirm?next=...
    const safeNext = encodeURIComponent(nextUrl);
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Acme Corp - Sign In</title>
        <style>
          :root { --primary: #2563eb; --bg: #f8fafc; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: var(--bg); display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .login-card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
          .logo { font-weight: 800; font-size: 1.5rem; color: var(--primary); margin-bottom: 1rem; }
          h1 { font-size: 1.25rem; color: #1e293b; margin-bottom: 0.5rem; }
          p { color: #64748b; font-size: 0.875rem; margin-bottom: 2rem; }
          .btn { display: inline-block; background: var(--primary); color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 600; }
          .btn:hover { background: #1d4ed8; }
        </style>
      </head>
      <body>
        <div class="login-card">
          <div class="logo">ACME CORP</div>
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

// VULNERABIL: Redirectioneaza catre ORICE URL din "next" (inclusiv pagina de phishing a atacatorului)
app.get('/login/confirm', (req, res) => {
  const nextUrl = req.query.next;
  if (nextUrl) {
    res.redirect(302, nextUrl);
  } else {
    res.redirect(302, '/dashboard.html');
  }
});

app.listen(PORT, () => {
  console.log(`[Vulnerable App] Running at http://localhost:${PORT}`);
});
