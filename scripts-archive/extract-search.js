const fs = require('fs');
const app = fs.readFileSync('app.js', 'utf8');

// Find start and end of getSearchResults
const m1 = app.indexOf('function getSearchResults(');
let end1 = app.indexOf('function performGlobalSearch');
if (m1 === -1 || end1 === -1) {
    console.log("getSearchResults not found");
    process.exit(1);
}
const getSearchResultsCode = app.substring(m1, end1);

// Find start and end of performGlobalSearch
const m2 = app.indexOf('function performGlobalSearch(');
let end2 = app.indexOf('// ==========================================', m2);
if(end2 === -1) end2 = app.indexOf('function initApp');
const performGlobalSearchCode = app.substring(m2, end2);

const newModule = `/**
 * @AI-SECTION: GLOBAL_SEARCH_ENGINE
 * @file modules/global-search.js
 */

` + getSearchResultsCode + performGlobalSearchCode;

fs.writeFileSync('modules/global-search.js', newModule);

// Remove from app.js
const newApp = app.substring(0, m1) + app.substring(end2);
fs.writeFileSync('app.js', newApp);

console.log("Extracted global search to modules/global-search.js");
