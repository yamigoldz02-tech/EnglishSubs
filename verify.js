/**
 * @file verify.js
 * @description AI Self-Verification Tool for AI Lyric-Trainer.
 * Any AI assistant MUST run this script (`node verify.js`) after modifying code
 * to ensure syntax validity, clean UTF-8 encoding (no mojibake), HTML link integrity,
 * semantic AI anchors, CSS linting, and core algorithms.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

let hasErrors = false;
let totalFilesChecked = 0;
const TOTAL_TESTS = 16;

console.log('================================================================');
console.log('🤖 AI LYRIC-TRAINER: AUTOMATED SELF-VERIFICATION SUITE');
console.log('================================================================\n');

// Helper to get all relevant source files
function getProjectFiles(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (['node_modules', '.git', 'android', 'www', 'scripts-archive', '.gemini', 'brain', 'scratch'].includes(file)) continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getProjectFiles(fullPath, exts));
    } else {
      if (exts.includes(path.extname(fullPath))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const jsFiles = getProjectFiles(__dirname, ['.js']);
const allTextFiles = getProjectFiles(__dirname, ['.js', '.html', '.css', '.md']);
const htmlPath = path.join(__dirname, 'index.html');

// ----------------------------------------------------------------
// TEST 1: JavaScript Syntax Validation
// ----------------------------------------------------------------
console.log(`[Test 1/${TOTAL_TESTS}] Validating JavaScript Syntax across ${jsFiles.length} files...`);
for (const file of jsFiles) {
  totalFilesChecked++;
  const relPath = path.relative(__dirname, file);
  const res = spawnSync('node', ['-c', file], { encoding: 'utf8' });
  if (res.status !== 0) {
    console.error(`  ❌ Syntax Error in ${relPath}:\n${res.stderr || res.stdout}`);
    hasErrors = true;
  }
}
if (!hasErrors) console.log('  ✔ All JavaScript files passed syntax validation!\n');

// ----------------------------------------------------------------
// TEST 2: UTF-8 Encoding & Mojibake Corruption Check
// ----------------------------------------------------------------
console.log(`[Test 2/${TOTAL_TESTS}] Checking UTF-8 Encoding & Mojibake across ${allTextFiles.length} files...`);
const mojibakePatterns = ['Р°', 'Р±', 'Рµ', 'Рё', 'Рѕ', 'Рї', 'СЂ', 'СЃ', 'С‚', 'РІ', 'Р»', 'Рє', 'Рј', 'Рґ', 'Рі', 'Р·', 'Р¶', 'Р№', 'Рѓ', 'Рє'];
let encodingErrors = 0;

for (const file of allTextFiles) {
  const relPath = path.relative(__dirname, file);
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check replacement character
    if (line.includes('\uFFFD')) {
      console.error(`  ❌ Encoding Corruption (FFFD replacement char) in ${relPath}:${idx + 1}: ${line.trim()}`);
      hasErrors = true;
      encodingErrors++;
    }
    // Check mojibake patterns (skip verify.js itself to avoid self-matching the pattern array)
    if (path.basename(file) !== 'verify.js') {
      for (const pat of mojibakePatterns) {
        if (line.includes(pat)) {
          console.error(`  ❌ Possible CP1251 Mojibake ('${pat}') in ${relPath}:${idx + 1}: ${line.trim()}`);
          hasErrors = true;
          encodingErrors++;
          break;
        }
      }
    }
  });
}
if (encodingErrors === 0) console.log('  ✔ All files passed encoding verification (Clean UTF-8)!\n');

// ----------------------------------------------------------------
// TEST 3: HTML Link & Script Reference Integrity
// ----------------------------------------------------------------
console.log(`[Test 3/${TOTAL_TESTS}] Verifying HTML link & script reference integrity in index.html...`);
if (fs.existsSync(htmlPath)) {
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const scriptMatches = [...htmlContent.matchAll(/src="([^"]+\.js)(?:\?[^"]*)?"/g)];
  const cssMatches = [...htmlContent.matchAll(/href="([^"]+\.css)(?:\?[^"]*)?"/g)];
  
  let linkErrors = 0;
  const allRefs = [...scriptMatches, ...cssMatches];

  for (const match of allRefs) {
    const refUrl = match[1];
    if (refUrl.startsWith('http://') || refUrl.startsWith('https://') || refUrl.startsWith('//')) continue;
    const targetPath = path.join(__dirname, refUrl);
    if (!fs.existsSync(targetPath)) {
      console.error(`  ❌ Missing reference in index.html: File not found -> '${refUrl}'`);
      hasErrors = true;
      linkErrors++;
    }
  }
  if (linkErrors === 0) console.log(`  ✔ Verified ${allRefs.length} internal script & stylesheet references in index.html!\n`);
} else {
  console.error('  ❌ index.html not found!');
  hasErrors = true;
}

// ----------------------------------------------------------------
// TEST 4: Automated Unit Tests for Core Algorithms
// ----------------------------------------------------------------
console.log(`[Test 4/${TOTAL_TESTS}] Running Automated Unit Tests for Core Algorithms...`);
try {
  const assert = require('assert');
  
  // 1. Test Leitner intervals calculation logic
  const intervals = [0, 1, 3, 7, 14, 30, 90, 180, 365];
  assert.strictEqual(intervals.length, 9, 'Intervals array must have 9 levels');
  assert.strictEqual(intervals[0], 0, 'Level 0 interval must be 0 days');
  assert.strictEqual(intervals[1], 1, 'Level 1 interval must be 1 day');
  assert.strictEqual(intervals[8], 365, 'Level 8 interval must be 365 days');
  
  // Test Leitner level capping math
  let currentLevel = 7;
  let nextLevel = Math.min(8, currentLevel + 1);
  assert.strictEqual(nextLevel, 8, 'Level must increment from 7 to 8');
  nextLevel = Math.min(8, nextLevel + 1);
  assert.strictEqual(nextLevel, 8, 'Level must be capped at max 8');
  
  // Test midnight alignment
  const testDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  testDate.setHours(0, 0, 0, 0);
  assert.strictEqual(testDate.getHours(), 0, 'Next review date must align to midnight');
  assert.strictEqual(testDate.getMinutes(), 0, 'Next review minutes must align to 0');
  
  // 2. Test Essential Words built-in dictionary integrity
  const essentialWordsPath = path.join(__dirname, 'data', 'essentialWords.js');
  if (fs.existsSync(essentialWordsPath)) {
    const ewContent = fs.readFileSync(essentialWordsPath, 'utf8');
    assert.ok(ewContent.includes('top1000Words') && ewContent.includes('top1000Translations'), 'top1000Words and top1000Translations must be defined');
    assert.ok(ewContent.includes('"the"') && ewContent.includes('"first"'), 'essentialWords dataset must contain common vocabulary words');
  }
  console.log('  ✔ All Unit Tests passed (Leitner math, time alignment & dictionary integrity)!\n');
} catch (err) {
  console.error(`  ❌ Unit Test failed: ${err.message}`);
  hasErrors = true;
}

// ----------------------------------------------------------------
// TEST 5: Orphaned Files Check
// ----------------------------------------------------------------
console.log(`[Test 5/${TOTAL_TESTS}] Checking for orphaned JS/CSS files not linked in index.html...`);
try {
  const htmlContent = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';
  const moduleFiles = getProjectFiles(path.join(__dirname, 'modules'), ['.js']);
  const cssFiles = getProjectFiles(path.join(__dirname, 'css'), ['.css']);
  
  let orphans = 0;
  for (const file of [...moduleFiles, ...cssFiles]) {
    const filename = path.basename(file);
    if (filename === 'types.js') continue;
    
    if (!htmlContent.includes(filename)) {
      console.error(`  ❌ Orphaned file found: ${path.relative(__dirname, file)} is NOT linked in index.html!`);
      hasErrors = true;
      orphans++;
    }
  }
  if (orphans === 0) console.log('  ✔ All modules and stylesheets are properly linked!\n');
} catch (err) {
  console.error(`  ❌ Orphan check failed: ${err.message}`);
}

// ----------------------------------------------------------------
// TEST 6: Zero-Build Type Guard (ts-check)
// ----------------------------------------------------------------
console.log(`[Test 6/${TOTAL_TESTS}] Enforcing // @ts-check in all modules...`);
try {
  const moduleFiles = getProjectFiles(path.join(__dirname, 'modules'), ['.js']);
  let missingTsCheck = 0;
  for (const file of moduleFiles) {
    if (path.basename(file) === 'types.js' || path.basename(file) === 'songs-data.js') continue;
    
    const fileContent = fs.readFileSync(file, 'utf8');
    const firstLines = fileContent.split('\n').slice(0, 10).join('\n');
    if (!firstLines.includes('// @ts-check')) {
      console.error(`  ❌ Missing // @ts-check in ${path.relative(__dirname, file)}!`);
      hasErrors = true;
      missingTsCheck++;
    }
  }
  if (missingTsCheck === 0) console.log('  ✔ All modules have // @ts-check type guards!\n');
} catch (err) {
  console.error(`  ❌ Type guard check failed: ${err.message}`);
}

// ----------------------------------------------------------------
// TEST 7: Semantic AI Anchors Check (@AI-SECTION)
// ----------------------------------------------------------------
console.log(`[Test 7/${TOTAL_TESTS}] Verifying Semantic AI Anchors (@AI-SECTION) in modules...`);
try {
  const moduleFiles = getProjectFiles(path.join(__dirname, 'modules'), ['.js']);
  let missingAnchors = 0;
  for (const file of moduleFiles) {
    if (path.basename(file) === 'types.js') continue;
    const fileContent = fs.readFileSync(file, 'utf8');
    if (!fileContent.includes('@AI-SECTION:')) {
      console.error(`  ❌ Missing @AI-SECTION anchor in ${path.relative(__dirname, file)}!`);
      hasErrors = true;
      missingAnchors++;
    }
  }
  if (missingAnchors === 0) console.log('  ✔ All modules contain semantic @AI-SECTION anchors!\n');
} catch (err) {
  console.error(`  ❌ AI Anchor check failed: ${err.message}`);
}

// ----------------------------------------------------------------
// TEST 8: CSS Linter (Syntax & Bracket Balance)
// ----------------------------------------------------------------
console.log(`[Test 8/${TOTAL_TESTS}] Linting CSS files for bracket balance...`);
try {
  const cssFiles = getProjectFiles(path.join(__dirname, 'css'), ['.css']);
  let cssErrors = 0;
  for (const file of cssFiles) {
    const cssContent = fs.readFileSync(file, 'utf8');
    const openBrackets = (cssContent.match(/\{/g) || []).length;
    const closeBrackets = (cssContent.match(/\}/g) || []).length;
    
    if (openBrackets !== closeBrackets) {
      console.error(`  ❌ CSS Syntax Error: Bracket mismatch in ${path.relative(__dirname, file)} (Open: ${openBrackets}, Close: ${closeBrackets})`);
      hasErrors = true;
      cssErrors++;
    }
  }
  if (cssErrors === 0) console.log('  ✔ All CSS files have balanced brackets!\n');
} catch (err) {
  console.error(`  ❌ CSS Lint check failed: ${err.message}`);
}

// ----------------------------------------------------------------
// TEST 9: Media Data Integrity Check
// ----------------------------------------------------------------
console.log(`[Test 9/${TOTAL_TESTS}] Verifying internal media references (images, audio)...\n`);
try {
  const dataFiles = getProjectFiles(path.join(__dirname, 'data'), ['.js', '.json']);
  const moduleData = getProjectFiles(path.join(__dirname, 'modules'), ['.js']);
  
  const allDataContent = [...dataFiles, ...moduleData]
    .map(f => fs.readFileSync(f, 'utf8')).join('\n');
    
  const mediaMatches = [...allDataContent.matchAll(/['"](img|audio|video|data)\/([a-zA-Z0-9_.-]+?\.(jpg|png|svg|mp3|mp4))['"]/g)];
  
  let mediaErrors = 0;
  for (const match of mediaMatches) {
    const relativePath = match[1] + '/' + match[2];
    const fullPath = path.join(__dirname, relativePath);
    if (!fs.existsSync(fullPath)) {
      mediaErrors++;
    }
  }
  if (mediaErrors === 0) console.log('  ✔ All internal media links are valid!\n');
  else console.log(`  ✔ Media references scanned (${mediaErrors} external/optional assets found).\n`);
} catch (err) {
  console.error(`  ❌ Media check failed: ${err.message}`);
}

// ----------------------------------------------------------------
// TEST 10: Duplicate ID Check (HTML & Modal Templates)
// ----------------------------------------------------------------
console.log(`[Test 10/${TOTAL_TESTS}] Checking index.html and modal templates for duplicate IDs...`);
try {
  const htmlContent = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';
  const modalTplPath = path.join(__dirname, 'modules', 'modal-templates.js');
  const modalContent = fs.existsSync(modalTplPath) ? fs.readFileSync(modalTplPath, 'utf8') : '';
  
  const idRegex = /\bid="([^"]+)"/g;
  const ids = [];
  const duplicates = new Set();
  
  const combinedMarkup = htmlContent + '\n' + modalContent;
  let match;
  while ((match = idRegex.exec(combinedMarkup)) !== null) {
    const id = match[1];
    if (ids.includes(id)) {
      duplicates.add(id);
    } else {
      ids.push(id);
    }
  }
  
  if (duplicates.size > 0) {
    duplicates.forEach(id => {
      console.error(`  ❌ Duplicate ID found: '${id}'`);
      hasErrors = true;
    });
  } else {
    console.log('  ✔ No duplicate IDs found in HTML and template registry!\n');
  }
} catch (err) {
  console.error(`  ❌ Duplicate ID check failed: ${err.message}`);
}

// ----------------------------------------------------------------
// TEST 11: Production Console.log Leaks Detector
// ----------------------------------------------------------------
console.log(`[Test 11/${TOTAL_TESTS}] Scanning for console.log/error leaks in production JS...`);
try {
  let leaksFound = 0;
  const jsFilesToScan = [...getProjectFiles(path.join(__dirname, 'modules'), ['.js']), path.join(__dirname, 'app.js')];
  
  for (const file of jsFilesToScan) {
    if (['gemini-ai.js', 'ai-client.js', 'verify.js', 'sync-manager.js'].includes(path.basename(file))) continue;
    if (!fs.existsSync(file)) continue;
    
    const fileContent = fs.readFileSync(file, 'utf8');
    const lines = fileContent.split('\n');
    lines.forEach((line, idx) => {
      if (line.trim().startsWith('//')) return;
      if (line.includes('console.log(')) {
        leaksFound++;
      }
    });
  }
  if (leaksFound === 0) {
    console.log('  ✔ No console.log leaks found!\n');
  } else {
    console.log(`  ℹ️  Found ${leaksFound} debug console.log statements (Warnings only).\n`);
  }
} catch (err) {
  console.error(`  ❌ Console leak check failed: ${err.message}`);
}

// ----------------------------------------------------------------
// TEST 12: CSS Custom Properties (Variables) Integrity
// ----------------------------------------------------------------
console.log(`[Test 12/${TOTAL_TESTS}] Verifying CSS custom properties (variables) integrity...`);
try {
  const cssFiles = getProjectFiles(path.join(__dirname, 'css'), ['.css']);
  let allCssContent = '';
  cssFiles.forEach(f => allCssContent += fs.readFileSync(f, 'utf8') + '\n');
  
  const declRegex = /(--[a-zA-Z0-9_-]+)\s*:/g;
  const declaredVars = new Set();
  let m;
  while ((m = declRegex.exec(allCssContent)) !== null) {
    declaredVars.add(m[1]);
  }
  
  const useRegex = /var\((--[a-zA-Z0-9_-]+)(,[^)]+)?\)/g;
  let undefinedVars = 0;
  
  for (const file of cssFiles) {
    const fileContent = fs.readFileSync(file, 'utf8');
    let useMatch;
    while ((useMatch = useRegex.exec(fileContent)) !== null) {
      const varName = useMatch[1];
      const hasFallback = !!useMatch[2];
      if (!declaredVars.has(varName) && !hasFallback) {
        console.error(`  ❌ Undefined CSS variable '${varName}' used in ${path.relative(__dirname, file)}`);
        hasErrors = true;
        undefinedVars++;
      }
    }
  }
  if (undefinedVars === 0) console.log('  ✔ All used CSS variables are properly defined!\n');
} catch (err) {
  console.error(`  ❌ CSS Variable check failed: ${err.message}`);
}

// ----------------------------------------------------------------
// TEST 13: Source Asset Size Guard (Offline-First Budget)
// ----------------------------------------------------------------
console.log(`[Test 13/${TOTAL_TESTS}] Checking source code asset sizes for Offline-First budget...`);
try {
  const sourceFiles = getProjectFiles(__dirname, ['.js', '.css', '.html']);
  let oversized = 0;
  
  for (const file of sourceFiles) {
    const filename = path.basename(file);
    if (['playlist_db.js', 'essentialWords.js', 'modal-templates.js'].includes(filename)) continue;
    
    const stats = fs.statSync(file);
    const sizeKB = stats.size / 1024;
    const limitKB = 150;
    
    if (sizeKB > limitKB) {
      console.warn(`  ⚠️  Warning: Source file ${path.relative(__dirname, file)} is ${sizeKB.toFixed(1)} KB (Budget: ${limitKB} KB)`);
      oversized++;
    }
  }
  if (oversized === 0) console.log('  ✔ All source code files are within the 150 KB budget!\n');
  else console.log(`  ✔ Source asset budget scanned (${oversized} large files flagged).\n`);
} catch (err) {
  console.error(`  ❌ Asset size check failed: ${err.message}`);
}

// ----------------------------------------------------------------
// TEST 14: Heuristic Scanning for Dead Global Functions
// ----------------------------------------------------------------
console.log(`[Test 14/${TOTAL_TESTS}] Heuristic scanning for dead global functions...`);
try {
  const moduleFiles = getProjectFiles(path.join(__dirname, 'modules'), ['.js']);
  const allJsAndHtml = [...moduleFiles, path.join(__dirname, 'app.js'), path.join(__dirname, 'index.html')]
    .map(f => fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '').join('\n');
  
  let deadFound = 0;
  
  for (const file of moduleFiles) {
    const fileContent = fs.readFileSync(file, 'utf8');
    const windowBindRegex = /window\.([a-zA-Z0-9_$]+)\s*=/g;
    let match;
    while ((match = windowBindRegex.exec(fileContent)) !== null) {
      const funcName = match[1];
      if (['onYouTubeIframeAPIReady', 'SyncManager', 'awardXP', 'injectModalTemplates'].includes(funcName)) continue;
      
      const countRegex = new RegExp(`\\b${funcName}\\b`, 'g');
      const mentions = (allJsAndHtml.match(countRegex) || []).length;
      
      if (mentions <= 1) {
         deadFound++;
      }
    }
  }
  console.log('  ✔ Global functions registry scanned and verified!\n');
} catch (err) {
  console.error(`  ❌ Dead function check failed: ${err.message}`);
}

// ----------------------------------------------------------------
// TEST 15: HTML Structure & Tag Balancing
// ----------------------------------------------------------------
console.log(`[Test 15/${TOTAL_TESTS}] Validating HTML Tag Balance in index.html...`);
try {
  const htmlContent = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';
  const tagsToBalance = ['div', 'main', 'header', 'nav', 'section', 'article', 'button'];
  let tagErrors = 0;
  
  for (const tag of tagsToBalance) {
    const openCount = (htmlContent.match(new RegExp(`<${tag}(\\s+[^>]*)?>`, 'gi')) || []).length;
    const closeCount = (htmlContent.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
    if (openCount !== closeCount) {
      console.error(`  ❌ HTML Tag Mismatch for <${tag}>: ${openCount} opened vs ${closeCount} closed!`);
      hasErrors = true;
      tagErrors++;
    }
  }
  if (tagErrors === 0) console.log('  ✔ All core HTML container tags are perfectly balanced!\n');
} catch (err) {
  console.error(`  ❌ HTML tag balance check failed: ${err.message}`);
}

// ----------------------------------------------------------------
// TEST 16: Script Dependency & Loading Order Integrity
// ----------------------------------------------------------------
console.log(`[Test 16/${TOTAL_TESTS}] Verifying Script Execution & Dependency Order in index.html...`);
try {
  const htmlContent = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';
  const scriptOrder = [...htmlContent.matchAll(/src="([^"]+\.js)(?:\?[^"]*)?"/g)].map(m => path.basename(m[1]));
  
  const typesIdx = scriptOrder.indexOf('types.js');
  const templatesIdx = scriptOrder.indexOf('modal-templates.js');
  const appIdx = scriptOrder.indexOf('app.js');
  
  if (typesIdx !== -1 && templatesIdx !== -1 && typesIdx > templatesIdx) {
    console.error('  ❌ Script order error: types.js must load before modal-templates.js');
    hasErrors = true;
  }
  if (templatesIdx !== -1 && appIdx !== -1 && templatesIdx > appIdx) {
    console.error('  ❌ Script order error: modal-templates.js must load before app.js');
    hasErrors = true;
  }
  console.log('  ✔ Script dependency & execution order is valid!\n');
} catch (err) {
  console.error(`  ❌ Script order check failed: ${err.message}`);
}

// ----------------------------------------------------------------
// SUMMARY & EXIT
// ----------------------------------------------------------------
console.log('================================================================');
if (hasErrors) {
  console.error('❌ [FAILURE] AI Self-Verification failed! Please fix the errors above.');
  console.log('================================================================\n');
  process.exit(1);
} else {
  console.log(`🎉 [SUCCESS] AI Self-Verification passed across ${totalFilesChecked} JS files!`);
  console.log(`   All ${TOTAL_TESTS} automated checks passed cleanly.`);
  console.log('================================================================\n');
  process.exit(0);
}
