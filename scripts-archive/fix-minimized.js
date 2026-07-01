const fs = require('fs');
let css = fs.readFileSync('styles-fix.css', 'utf8');

css = css.replace(/\.video-modal-minimized \.active-video-details \{/, '.video-modal-minimized .active-video-details,\n.video-modal-minimized .video-course-controls,\n.video-modal-minimized .mobile-course-tabs {');

fs.writeFileSync('styles-fix.css', css, 'utf8');
console.log('Fixed minimized CSS');
