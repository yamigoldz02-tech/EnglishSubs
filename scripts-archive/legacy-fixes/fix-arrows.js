const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

// The code sets arrow.textContent = ' '; it should be '&#9660;' (¡) when collapsed and '&#9650;' (^) when expanded.
// But we can just leave it alone since CSS handles rotation!
// Wait! .filters-toggle-btn.active .toggle-arrow { transform: rotate(-180deg); }
// So we should NOT change the text content to space! We should just comment out or remove the lines that set textContent to ' '.
js = js.replace(/if \(arrow\) arrow\.textContent = ' ';\s*/g, '');

fs.writeFileSync('app.js', js, 'utf8');
console.log('Fixed arrows');
