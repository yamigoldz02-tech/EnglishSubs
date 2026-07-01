const fs = require('fs');
let css = fs.readFileSync('mobile-compact.css', 'utf8');

// Replace:
//  .dashboard-nav-card p, .dashboard-nav-card > div:last-child {
//    display: none !important;
//  }
// with:
//  .dashboard-nav-card p, .dashboard-nav-card > div:not(:first-child) {
//    display: none !important;
//  }
//  #dashGoVideoCourse {
//    grid-column: 1 / -1 !important;
//  }

css = css.replace(/\.dashboard-nav-card p, \.dashboard-nav-card > div:last-child \{\s*display: none !important;\s*\}/, '.dashboard-nav-card p, .dashboard-nav-card > div:not(:first-child) {\n    display: none !important;\n  }\n  #dashGoVideoCourse {\n    grid-column: 1 / -1 !important;\n  }');

fs.writeFileSync('mobile-compact.css', css, 'utf8');
console.log('Fixed mobile CSS');
