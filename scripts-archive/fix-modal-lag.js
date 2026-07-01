const fs = require('fs');
let css = fs.readFileSync('styles-fix.css', 'utf8');

css = css.replace(/background: var\(--bg-main\);/g, 'background: var(--bg-surface, #121216);');
css = css.replace(/\.video-modal-minimized \.player-container-pane\.floating-dragged \{[\s\S]*?\}/, '.video-modal-minimized .player-container-pane.floating-dragged {\n  transition: none !important;\n  cursor: grabbing !important;\n  bottom: auto !important;\n  right: auto !important;\n}');

fs.writeFileSync('styles-fix.css', css, 'utf8');
console.log('Fixed modal dragging lag and transparent wall.');
