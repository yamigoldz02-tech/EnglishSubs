const fs = require('fs');
let html = fs.readFileSync('index.html', 'binary');

html = html.replace(/(<button id="startLearnGameBtn"[^>]+>\s*&#127891; &#1058;&#1077;&#1089;&#1090;)\s*<div id="dictWordsList"/, '\n            </button>\n          </div>\n          \n          <div style="position: relative; flex: 1 1 0; min-height: 0; display: flex; flex-direction: column;">\n            <div id="dictWordsList"');

fs.writeFileSync('index.html', html, 'binary');
console.log('Fixed HTML layout 2');
