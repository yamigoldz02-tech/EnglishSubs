const fs = require('fs');
let html = fs.readFileSync('index.html'); // Read as raw Buffer

const injectionStr = 
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

let htmlStr = html.toString('utf8');
htmlStr = htmlStr.replace(/<input type="checkbox" id="performanceToggle">\s*<span class="slider"><\/span>\s*<\/label>\s*<\/div>\s*<\/div>/, '<input type="checkbox" id="performanceToggle">\n                <span class="slider"></span>\n              </label>\n            </div>' + injectionStr);

fs.writeFileSync('index.html', Buffer.from(htmlStr, 'utf8'));
console.log('Success');
