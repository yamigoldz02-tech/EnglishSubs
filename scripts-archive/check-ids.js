const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
console.log('closeRulesBtn count:', html.split('id="closeRulesBtn"').length - 1);
console.log('closeGamificationBtn count:', html.split('id="closeGamificationBtn"').length - 1);
