const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

js = js.replace(/const scope = 'user-modify-playback-state user-read-playback-state';/, "const scope = 'user-modify-playback-state user-read-playback-state user-read-currently-playing';");

fs.writeFileSync('app.js', js, 'utf8');
console.log('Fixed spotify scope');
