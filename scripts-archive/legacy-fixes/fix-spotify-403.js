const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

js = js.replace(/if \(res\.status === 401\) \{[\s\S]*?this\.clearTokens\(\);[\s\S]*?\}/, "if (res.status === 401 || res.status === 403) { console.error('Spotify API 401/403. Clearing tokens.'); this.clearTokens(); document.getElementById('spotifyStatus').innerHTML = '<span style=\"color:#ef4444\">Ошибка доступа (403). Пожалуйста, подключите Spotify заново.</span>'; }");

fs.writeFileSync('app.js', js, 'utf8');
console.log('Fixed spotify 403 handler');
