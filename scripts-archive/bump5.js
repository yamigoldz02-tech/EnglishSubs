const fs = require('fs');
let html = fs.readFileSync('index.html', 'binary');
html = html.replace(/v=2\.7\.1/g, 'v=2.7.2');
fs.writeFileSync('index.html', html, 'binary');
