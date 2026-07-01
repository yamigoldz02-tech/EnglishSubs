const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Fix option text
html = html.replace(/<option value="level_desc"><\/option>/, '<option value="level_desc">По уровню ?</option>');

// Fix chart style
html = html.replace(/<div id="dictWeekChart"><\/div>/, '<div id="dictWeekChart" style="flex-shrink: 0; margin-top: 12px; margin-bottom: 8px;"></div>');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Fixed html style and text');
