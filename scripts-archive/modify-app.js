const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

const title = '\u0410\u0432\u0442\u043E-\u0443\u0441\u043A\u043E\u0440\u0435\u043D\u0438\u0435 \u0432\u0438\u0434\u0435\u043E (2x)';
const desc = '\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0432\u043A\u043B\u044E\u0447\u0430\u0442\u044C \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u044C \u0432\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u044F 2x \u0434\u043B\u044F \u0432\u0438\u0434\u0435\u043E\u0443\u0440\u043E\u043A\u043E\u0432.';

const htmlStr = '<div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05);">' +
  '<div style="display: flex; flex-direction: column; gap: 4px;">' +
    '<span style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">' + title + '</span>' +
    '<span style="font-size: 0.68rem; color: var(--text-muted);">' + desc + '</span>' +
  '</div>' +
  '<label class="switch">' +
    '<input type="checkbox" id="videoAutoAccelerateToggle">' +
    '<span class="slider"></span>' +
  '</label>' +
'</div>';

const jsInject = 
  "const performanceToggle = document.getElementById('performanceToggle');\n" +
  "  const speedToggleId = 'videoAutoAccelerateToggle';\n" +
  "  let speedToggle = document.getElementById(speedToggleId);\n" +
  "  if (!speedToggle && performanceToggle) {\n" +
  "    const perfGroup = performanceToggle.closest('.switch').parentElement.parentElement;\n" +
  "    perfGroup.insertAdjacentHTML('beforeend', '" + htmlStr.replace(/'/g, "\\'") + "');\n" +
  "    speedToggle = document.getElementById(speedToggleId);\n" +
  "  }\n" +
  "  const savedSpeed = localStorage.getItem('galaxy_video_2x') !== 'false';\n" +
  "  if (speedToggle) speedToggle.checked = savedSpeed;\n";

js = js.replace(/const performanceToggle = document.getElementById\('performanceToggle'\);/, jsInject);

const saveLogic = 
  "$&\n      const speedTog = document.getElementById('videoAutoAccelerateToggle');\n" +
  "      if (speedTog) localStorage.setItem('galaxy_video_2x', speedTog.checked ? 'true' : 'false');";

js = js.replace(/if \(performanceToggle\) \{[\s\S]*?localStorage\.setItem\('galaxy_gpu_saving'[\s\S]*?\}/, saveLogic);

js = js.replace(/'onReady': \(event\) => \{ event\.target\.setPlaybackRate\(2\); \}/, "'onReady': (event) => { if (localStorage.getItem('galaxy_video_2x') !== 'false') { event.target.setPlaybackRate(2); } }");

fs.writeFileSync('app.js', js, 'utf8');
console.log('Modified app.js successfully');
