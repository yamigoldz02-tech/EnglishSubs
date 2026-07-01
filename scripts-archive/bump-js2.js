const fs = require('fs');
let html = fs.readFileSync('index.html', 'binary');
html = html.replace(/app\.js\?v=2\.5\.2/g, 'app.js?v=2.5.3');
fs.writeFileSync('index.html', html, 'binary');
