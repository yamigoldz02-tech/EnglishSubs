const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

js = js.replace(/if \(res\.status === 401\) \{/, "if (res.status === 403) { this.clearTokens(); const statusEl = document.getElementById('spotifyStatus'); if(statusEl) statusEl.innerHTML = '<span style=\"color:#ef4444\">Ошибка 403. Подключите Spotify заново.</span>'; return; }\n      if (res.status === 401) {");

fs.writeFileSync('app.js', js, 'utf8');
console.log('Added 403 handler');
