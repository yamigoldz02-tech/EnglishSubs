const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');
js = js.replace(/const weekChart = document\.getElementById\('dictWeekChart'\);\r?\n\s*\}/, '');
fs.writeFileSync('app.js', js, 'utf8');
console.log('Fixed js again');
