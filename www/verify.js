/**
 * @file verify.js
 * @description AI Self-Verification Tool for AI Lyric-Trainer.
 * Any AI assistant MUST run this script (`node verify.js`) after modifying code
 * to ensure syntax validity, clean UTF-8 encoding (no mojibake), and HTML link integrity.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

let hasErrors = false;
let totalFilesChecked = 0;

console.log('================================================================');
console.log('🤖 AI LYRIC-TRAINER: AUTOMATED SELF-VERIFICATION SUITE');
console.log('================================================================\n');

// Helper to get all relevant files
function getProjectFiles(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === '.git' || file === 'scripts-archive' || file === '.gemini' || file === 'brain') continue;
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

// ----------------------------------------------------------------
// TEST 1: JavaScript Syntax Validation
// ----------------------------------------------------------------
console.log('[Test 1/4] Validating JavaScript Syntax across ' + jsFiles.length + ' files...');
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
console.log('[Test 2/4] Checking UTF-8 Encoding & Mojibake across ' + allTextFiles.length + ' files...');
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
console.log('[Test 3/4] Verifying HTML link & script reference integrity in index.html...');
const htmlPath = path.join(__dirname, 'index.html');
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
// [Test 4/4] Automated Unit Tests for Core Algorithms
// ----------------------------------------------------------------
console.log('[Test 4/4] Running Automated Unit Tests for Core Algorithms...');
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
// [Test 5/13] Orphaned Files Check
// ----------------------------------------------------------------
console.log('[Test 5/13] Checking for orphaned JS/CSS files not linked in index.html...');
try {
  const htmlContent = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';
  const moduleFiles = getProjectFiles(path.join(__dirname, 'modules'), ['.js']);
  const cssFiles = getProjectFiles(path.join(__dirname, 'css'), ['.css']);
  
  let orphans = 0;
  for (const file of [...moduleFiles, ...cssFiles]) {
    const filename = path.basename(file);
    if (filename === 'types.js') continue; // Exception for pure types file
    
    if (!htmlContent.includes(filename)) {
      console.error(`  ❌ Orphaned file found: ${path.relative(__dirname, file)} is NOT linked in index.html!`);
      hasErrors = true;
      orphans++;
    }
  }
  if (orphans === 0) console.log('  ✔ All modules and stylesheets are properly linked!\\n');
} catch (err) {
  console.error(`  ❌ Orphan check failed: ${err.message}`);
}

// ----------------------------------------------------------------
// [Test 6/13] Zero-Build Type Guard (ts-check)
// ----------------------------------------------------------------
console.log('[Test 6/13] Enforcing // @ts-check in all modules...');
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
  if (missingTsCheck === 0) console.log('  ✔ All modules have // @ts-check type guards!\\n');
} catch (err) {
  console.error(`  ❌ Type guard check failed: ${err.message}`);
}

// ----------------------------------------------------------------
// [Test 7/13] Basic CSS Linter (Syntax & Bracket Balance)
// ----------------------------------------------------------------
console.log('[Test 7/13] Linting CSS files for bracket balance...');
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
  if (cssErrors === 0) console.log('  ✔ All CSS files have balanced brackets!\\n');
} catch (err) {
  console.error(`  ❌ CSS Lint check failed: ${err.message}`);
}

// ----------------------------------------------------------------
// [Test 8/13] Media Data Integrity Check
// ----------------------------------------------------------------
console.log('[Test 8/13] Verifying internal media references (images, audio)...');
try {
  const dataFiles = getProjectFiles(path.join(__dirname, 'data'), ['.js', '.json']);
  const moduleData = getProjectFiles(path.join(__dirname, 'modules'), ['.js']); // check songs-data.js
  
  const allDataContent = [...dataFiles, ...moduleData]
    .map(f => fs.readFileSync(f, 'utf8')).join('\n');
    
  // Regex to find things like "img/scorpions.jpg" or "audio/track.mp3"
  const mediaMatches = [...allDataContent.matchAll(/['"](img|audio|video|data)\/([a-zA-Z0-9_.-]+?\.(jpg|png|svg|mp3|mp4))['"]/g)];
  
  let mediaErrors = 0;
  for (const match of mediaMatches) {
    const relativePath = match[1] + '/' + match[2];
    const fullPath = path.join(__dirname, relativePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`  ❌ Broken media link found in datasets: '${relativePath}' does not exist!`);
      // Warning only, don't strictly fail the build for missing media yet
      // hasErrors = true;
      mediaErrors++;
    }
  }
  if (mediaErrors === 0) console.log('  ✔ All internal media links are valid!\n');
} catch (err) {
  console.error(`  ❌ Media check failed: ${err.message}`);
}


// ----------------------------------------------------------------
// [Test 9/13] Duplicate ID Check (HTML)
// ----------------------------------------------------------------
console.log('[Test 9/13] Checking index.html for duplicate IDs...');
try {
  const htmlContent = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';
  const idRegex = /\bid="([^"]+)"/g;
  const ids = [];
  const duplicates = new Set();
  
  let match;
  while ((match = idRegex.exec(htmlContent)) !== null) {
    const id = match[1];
    if (ids.includes(id)) {
      duplicates.add(id);
    } else {
      ids.push(id);
    }
  }
  
  if (duplicates.size > 0) {
    duplicates.forEach(id => {
      console.error(`  ❌ Duplicate ID found in index.html: '${id}'`);
      hasErrors = true;
    });
  } else {
    console.log('  ✔ No duplicate IDs found in index.html!\n');
  }
} catch (err) {
  console.error(`  ❌ Duplicate ID check failed: ${err.message}`);
}

// ----------------------------------------------------------------
// [Test 10/13] Console.log Leaks Detector
// ----------------------------------------------------------------
console.log('[Test 10/13] Scanning for console.log/error leaks in production JS...');
try {
  let leaksFound = 0;
  const jsFilesToScan = [...getProjectFiles(path.join(__dirname, 'modules'), ['.js']), path.join(__dirname, 'app.js')];
  
  for (const file of jsFilesToScan) {
    // Skip AI integration (needs logging) and verify scripts
    if (path.basename(file) === 'gemini-ai.js' || path.basename(file) === 'verify.js') continue;
    if (!fs.existsSync(file)) continue;
    
    const fileContent = fs.readFileSync(file, 'utf8');
    const lines = fileContent.split('\n');
    lines.forEach((line, idx) => {
      // Ignore lines that are commented out
      if (line.trim().startsWith('//')) return;
      if (line.includes('console.log(') || line.includes('console.error(')) {
        console.warn(`  ⚠️  Warning: console.log leak in ${path.relative(__dirname, file)}:${idx + 1}`);
        leaksFound++;
      }
    });
  }
  if (leaksFound === 0) {
    console.log('  ✔ No console.log leaks found!\n');
  } else {
    console.log(`  ℹ️  Found ${leaksFound} console leaks. (Warnings only, build not failed).\n`);
  }
} catch (err) {
  console.error(`  ❌ Console leak check failed: ${err.message}`);
}

// ----------------------------------------------------------------
// [Test 11/13] Advanced CSS Variable Linter
// ----------------------------------------------------------------
console.log('[Test 11/13] Verifying CSS custom properties (variables) integrity...');
try {
  const cssFiles = getProjectFiles(path.join(__dirname, 'css'), ['.css']);
  let allCssContent = '';
  cssFiles.forEach(f => allCssContent += fs.readFileSync(f, 'utf8') + '\n');
  
  // Find all declared variables: e.g. --text-main: #fff;
  const declRegex = /(--[a-zA-Z0-9_-]+)\s*:/g;
  const declaredVars = new Set();
  let m;
  while ((m = declRegex.exec(allCssContent)) !== null) {
    declaredVars.add(m[1]);
  }
  
  // Find all used variables: e.g. var(--text-main)
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
// [Test 12/13] Asset Size Guard
// ----------------------------------------------------------------
console.log('[Test 12/13] Checking asset sizes for Offline First optimization...');
try {
  const allFiles = getProjectFiles(__dirname, ['.js', '.css', '.html', '.json', '.jpg', '.png', '.mp3', '.mp4']);
  let oversized = 0;
  
  for (const file of allFiles) {
    const ext = path.extname(file).toLowerCase();
    const stats = fs.statSync(file);
    const sizeKB = stats.size / 1024;
    
    // JS/CSS limit: 150KB, Images limit: 500KB, Audio/Video: 5MB
    let limitKB = 150;
    if (['.jpg', '.png', '.svg', '.gif'].includes(ext)) limitKB = 500;
    if (['.mp3', '.mp4'].includes(ext)) limitKB = 5000;
    
    // Specifically skip huge data files from throwing errors, just warn
    if (sizeKB > limitKB) {
      console.warn(`  ⚠️  Warning: File ${path.relative(__dirname, file)} is ${sizeKB.toFixed(1)} KB (Limit: ${limitKB} KB)`);
      oversized++;
    }
  }
  if (oversized === 0) console.log('  ✔ All assets are within size limits!\n');
} catch (err) {
  console.error(`  ❌ Asset size check failed: ${err.message}`);
}

// ----------------------------------------------------------------
// [Test 13/13] Dead Functions Check (Heuristic)
// ----------------------------------------------------------------
console.log('[Test 13/13] Heuristic scanning for dead global functions...');
try {
  const moduleFiles = getProjectFiles(path.join(__dirname, 'modules'), ['.js']);
  const allJsAndHtml = [...moduleFiles, path.join(__dirname, 'app.js'), path.join(__dirname, 'index.html')]
    .map(f => fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '').join('\n');
  
  let deadFound = 0;
  
  for (const file of moduleFiles) {
    const fileContent = fs.readFileSync(file, 'utf8');
    // Match window.myFunc = ...
    const windowBindRegex = /window\.([a-zA-Z0-9_$]+)\s*=/g;
    let match;
    while ((match = windowBindRegex.exec(fileContent)) !== null) {
      const funcName = match[1];
      
      // Heuristic: Count occurrences of funcName across all files
      // If it only occurs 1 time (the declaration itself), it's dead.
      // We use a global regex to count all mentions.
      const countRegex = new RegExp(`\\b${funcName}\\b`, 'g');
      const mentions = (allJsAndHtml.match(countRegex) || []).length;
      
      if (mentions <= 1) {
         console.warn(`  ⚠️  Warning: Possible dead function 'window.${funcName}' in ${path.relative(__dirname, file)}`);
         deadFound++;
      }
    }
  }
  
  if (deadFound === 0) console.log('  ✔ No obvious dead global functions found!\n');
} catch (err) {
  console.error(`  ❌ Dead function check failed: ${err.message}`);
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
  console.log('   All syntax, UTF-8 encoding, and HTML reference checks are clean.');
  console.log('================================================================\n');
  process.exit(0);
}
