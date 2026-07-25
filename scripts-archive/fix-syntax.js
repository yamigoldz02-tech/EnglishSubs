const fs=require('fs');
let e = fs.readFileSync('modules/events-manager.js','utf8');
e = e.replace(/\\'/g, "'");
fs.writeFileSync('modules/events-manager.js', e);
