const fs = require('fs');
let html = fs.readFileSync('index.html', 'binary');
html = html.replace(/<button id="expandFloatingVideoBtn".*?<\/button>/, '<button id="expandFloatingVideoBtn" title="Развернуть" style="font-size: 1.2rem;">&#9744;</button>');
html = html.replace(/<button id="closeFloatingVideoBtn".*?<\/button>/, '<button id="closeFloatingVideoBtn" title="Закрыть" style="font-size: 1.2rem;">&#10005;</button>');
fs.writeFileSync('index.html', html, 'binary');
