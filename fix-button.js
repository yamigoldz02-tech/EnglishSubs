const fs = require('fs');
let html = fs.readFileSync('index.html', 'binary');

html = html.replace(/<div style="display: flex; gap: 8px; align-items: center; width: 100%; flex-shrink: 0;">[\s\S]*?<\/button>\s*<\/div>/, '<div style="display: flex; gap: 8px; align-items: center; width: 100%; flex-shrink: 0;">\n            <button id="toggleDictFiltersBtn" class="filters-toggle-btn" type="button" style="flex-grow: 1; width: auto;">\n              <span>&#9881; &#1053;&#1072;&#1089;&#1090;&#1088;&#1086;&#1081;&#1082;&#1080; &#1080; &#1089;&#1090;&#1072;&#1090;&#1080;&#1089;&#1090;&#1080;&#1082;&#1072;</span>\n              <span class="toggle-arrow">&#9660;</span>\n            </button>\n          </div>');

fs.writeFileSync('index.html', html, 'binary');
console.log('Fixed button');
