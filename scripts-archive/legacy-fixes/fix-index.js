const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Rename toggle button
html = html.replace('<span>? Фильтры и папки</span>', '<span>? Настройки и статистика</span>');

// 2. Remove week chart toggle button
html = html.replace(/<button id="toggleWeekChartBtn"[\s\S]*?<\/button>/, '');

// 3. Remove dictWeekChart from outside
html = html.replace(/<!-- Mini 7-day chart -->\s*<div id="dictWeekChart" style="flex-shrink: 0;"><\/div>/, '');

// 4. Move dictWeekChart inside dictFiltersCollapse (before its closing tag)
html = html.replace(/(<\/select>\s*<\/div>\s*<\/div>\s*<\/div>\s*)(<!-- Row 3)/, '  <div id="dictWeekChart" style="flex-shrink: 0; margin-top: 12px; margin-bottom: 8px;"></div>\n            ');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Done');
