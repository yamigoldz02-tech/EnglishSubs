const fs = require('fs');
let html = fs.readFileSync('index.html', 'binary');
html = html.replace(/v=2\.6\.9/g, 'v=2.7.0');
fs.writeFileSync('index.html', html, 'binary');
