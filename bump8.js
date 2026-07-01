const fs = require('fs');
let html = fs.readFileSync('index.html', 'binary');
html = html.replace(/v=2\.7\.4/g, 'v=2.7.5');
fs.writeFileSync('index.html', html, 'binary');
