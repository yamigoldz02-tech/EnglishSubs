const fs = require('fs');
let html = fs.readFileSync('index.html', 'binary');
html = html.replace(/<span class="toggle-arrow"> <\/span>/g, '<span class="toggle-arrow">&#9660;</span>');
fs.writeFileSync('index.html', html, 'binary');
