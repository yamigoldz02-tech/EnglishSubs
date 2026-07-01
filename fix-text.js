const fs = require('fs');
let html = fs.readFileSync('index.html'); // Read as buffer
let text = html.toString('binary'); // Treat as binary string to preserve single bytes

// Replace the span content.
// <button id="toggleDictFiltersBtn" ...>
//   <span>&#9881; &#1060;&#1080;&#1083;&#1100;&#1090;&#1088;&#1099; &#1080; &#1087;&#1072;&#1087;&#1082;&#1080;</span>
// We know it is between <button id="toggleDictFiltersBtn" ...> and <span class="toggle-arrow">
text = text.replace(/(<button id="toggleDictFiltersBtn"[^>]+>\s*<span>)[^<]+(<\/span>\s*<span class="toggle-arrow">)/, '&#9881; &#1053;&#1072;&#1089;&#1090;&#1088;&#1086;&#1081;&#1082;&#1080; &#1080; &#1089;&#1090;&#1072;&#1090;&#1080;&#1089;&#1090;&#1080;&#1082;&#1072;');

fs.writeFileSync('index.html', text, 'binary');
console.log('Fixed text');
