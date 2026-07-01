const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');
js = js.replace(/const weekChart = document\.getElementById\('dictWeekChart'\);\);/, "const weekChart = document.getElementById('dictWeekChart');");
fs.writeFileSync('app.js', js, 'utf8');

let html = fs.readFileSync('index.html', 'utf8');
// Fix the missing </select> and correct the placement
// The current bad HTML is:
// <option value="level_desc">По уровню ?</option>
// <!-- Mini 7-day chart -->
// <div id="dictWeekChart" style="flex-shrink: 0; margin-top: 12px; margin-bottom: 8px;"></div>
// </div>

html = html.replace(/<option value="level_desc">([^<]+)<\/option>\s*<!-- Mini 7-day chart -->\s*<div id="dictWeekChart"([^>]+)><\/div>\s*<\/div>/, '<option value="level_desc"></option>\n              </select>\n            </div>\n            <!-- Mini 7-day chart -->\n            <div id="dictWeekChart"></div>\n          </div>');
fs.writeFileSync('index.html', html, 'utf8');
console.log('Fixed');
