const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

// Remove weekChart .collapsed logic
js = js.replace(/\s*\/\/\s*Ensure week chart state is initialized according to localStorage[\s\S]*?if\s*\(weekChart\)\s*\{[\s\S]*?\}\s*\}/, '');

// Remove toggleWeekChartBtn event listener
js = js.replace(/\s*const toggleWeekChartBtn = document\.getElementById\('toggleWeekChartBtn'\);/, '');
js = js.replace(/\s*if\s*\(toggleWeekChartBtn && weekChart\)\s*\{[\s\S]*?\}\s*\}/, '');

fs.writeFileSync('app.js', js, 'utf8');
console.log('Done fix-app');
