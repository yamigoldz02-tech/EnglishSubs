const fs = require('fs');
let html = fs.readFileSync('index.html', 'binary');
html = html.replace(/v=2\.6\.7/g, 'v=2.6.8');
fs.writeFileSync('index.html', html, 'binary');
