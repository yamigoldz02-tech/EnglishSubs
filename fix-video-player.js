const fs = require('fs');
let css = fs.readFileSync('styles-fix.css', 'utf8');

css = css.replace(/\.video-player-wrapper \{/, '.video-player-wrapper {\n  flex-shrink: 0;');

fs.writeFileSync('styles-fix.css', css, 'utf8');
console.log('Fixed video player css');
