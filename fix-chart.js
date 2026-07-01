const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Insert dictWeekChart at the end of dictFiltersCollapse
html = html.replace(/(<\/select>\s*<\/div>\s*<\/div>\s*)(<!-- Row 3: Search \+ game buttons -->)/, '  <!-- Mini 7-day chart -->\n          <div id="dictWeekChart" style="flex-shrink: 0; margin-top: 12px; margin-bottom: 8px;"></div>\n        </div>\n\n        ');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Done fix-chart');
