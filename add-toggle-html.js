const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const injection = 
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05);">
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">Авто-ускорение видео (2x)</span>
                <span style="font-size: 0.68rem; color: var(--text-muted);">Автоматически включать скорость воспроизведения 2x для видеоуроков.</span>
              </div>
              <label class="switch">
                <input type="checkbox" id="videoAutoAccelerateToggle" checked>
                <span class="slider"></span>
              </label>
            </div>
          </div>
;

html = html.replace(/<input type="checkbox" id="performanceToggle">\s*<span class="slider"><\/span>\s*<\/label>\s*<\/div>\s*<\/div>/, '<input type="checkbox" id="performanceToggle">\n                <span class="slider"></span>\n              </label>\n            </div>' + injection);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Added auto accelerate toggle to HTML');
