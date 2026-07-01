const fs = require('fs');
let css = fs.readFileSync('styles-fix.css', 'utf8');

css = css.replace(/\.video-modal-minimized \{/, '.video-modal-minimized {\n  z-index: 10500 !important;');

fs.writeFileSync('styles-fix.css', css, 'utf8');
console.log('Fixed z-index for floating video player.');
