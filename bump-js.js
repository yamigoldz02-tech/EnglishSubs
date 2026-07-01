const fs = require('fs');
let html = fs.readFileSync('index.html', 'binary');
html = html.replace(/app\.js\?v=2\.5\.1/g, 'app.js?v=2.5.2');
fs.writeFileSync('index.html', html, 'binary');
