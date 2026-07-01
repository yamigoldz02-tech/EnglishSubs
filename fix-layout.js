const fs = require('fs');
let html = fs.readFileSync('index.html', 'binary');

// Find the section:
//            </button>
//          </div>
//          
//          </div>
//          <div style="position: relative; flex: 1 1 0; min-height: 0; display: flex; flex-direction: column;">
// and remove the extra </div>
html = html.replace(/(<\/button>\s*<\/div>\s*)<\/div>\s*(<div style="position: relative; flex: 1 1 0; min-height: 0; display: flex; flex-direction: column;">)/, '');

fs.writeFileSync('index.html', html, 'binary');
console.log('Fixed HTML layout');
