const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

js = js.replace(/events: \{\s*'onStateChange': onPlayerStateChange\s*\}/, "events: {\n          'onStateChange': onPlayerStateChange,\n          'onReady': (event) => { event.target.setPlaybackRate(2); }\n        }");

fs.writeFileSync('app.js', js, 'utf8');
console.log('Fixed playback rate');
