const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.split('data-en-tooltip="Close"').join('');
fs.writeFileSync('index.html', html, 'utf8');
