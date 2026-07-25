const fs = require('fs');
const app = fs.readFileSync('app.js', 'utf8');

const m1 = app.indexOf('function renderDashboardFavorites(');
let end1 = app.indexOf('function renderWelcomeHub(');
const dash1 = app.substring(m1, end1);

const m2 = end1;
let end2 = app.indexOf('// Setup specific active track card in UI');
if(end2 === -1) end2 = app.indexOf('function renderSong(');
const dash2 = app.substring(m2, end2);

const newModule = `/**
 * @AI-SECTION: DASHBOARD_ENGINE
 * @file modules/dashboard.js
 */

` + dash1 + dash2;

fs.writeFileSync('modules/dashboard.js', newModule);

const newApp = app.substring(0, m1) + app.substring(end2);
fs.writeFileSync('app.js', newApp);

console.log("Extracted dashboard to modules/dashboard.js");
