const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

// 1. Add toggle UI creation inside loadSettings() or similar
// Let's just find the performanceToggle block and append the new toggle initialization
js = js.replace(/const performanceToggle = document.getElementById\('performanceToggle'\);/g, "const performanceToggle = document.getElementById('performanceToggle');\n  const speedToggleId = 'videoAutoAccelerateToggle';\n  let speedToggle = document.getElementById(speedToggleId);\n  if (!speedToggle) {\n    const perfGroup = performanceToggle.closest('.switch').parentElement.parentElement;\n    const html = \<div style=\"display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05);\">\n      <div style=\"display: flex; flex-direction: column; gap: 4px;\">\n        <span style=\"font-size: 0.8rem; font-weight: 600; color: var(--text-main);\">Авто-ускорение видео (2x)</span>\n        <span style=\"font-size: 0.68rem; color: var(--text-muted);\">Автоматически включать скорость воспроизведения 2x для видеоуроков.</span>\n      </div>\n      <label class=\"switch\">\n        <input type=\"checkbox\" id=\"\\">\n        <span class=\"slider\"></span>\n      </label>\n    </div>\;\n    perfGroup.insertAdjacentHTML('beforeend', html);\n    speedToggle = document.getElementById(speedToggleId);\n  }\n  const savedSpeed = localStorage.getItem('galaxy_video_2x') !== 'false';\n  if (speedToggle) speedToggle.checked = savedSpeed;");

// 2. Add save logic in saveSettings()
js = js.replace(/if \(performanceToggle\) \{[\s\S]*?localStorage\.setItem\('galaxy_gpu_saving'[\s\S]*?\}/, "$&\n      const speedTog = document.getElementById('videoAutoAccelerateToggle');\n      if (speedTog) localStorage.setItem('galaxy_video_2x', speedTog.checked ? 'true' : 'false');");

// 3. Apply setting in YT player onReady
js = js.replace(/'onReady': \(event\) => \{ event\.target\.setPlaybackRate\(2\); \}/, "'onReady': (event) => { if (localStorage.getItem('galaxy_video_2x') !== 'false') { event.target.setPlaybackRate(2); } }");

fs.writeFileSync('app.js', js, 'utf8');
console.log('Fixed speed setting');
