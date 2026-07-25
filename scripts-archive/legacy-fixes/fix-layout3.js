const fs = require('fs');
let html = fs.readFileSync('index.html', 'binary');

html = html.replace(/(<button id="startLearnGameBtn"[^>]+>)([^<]+)\s*<div id="dictWordsList"/, '\n            </button>\n          </div>\n          \n          <div style="position: relative; flex: 1 1 0; min-height: 0; display: flex; flex-direction: column;">\n            <div id="dictWordsList"');

fs.writeFileSync('index.html', html, 'binary');
console.log('Fixed HTML layout 3');
