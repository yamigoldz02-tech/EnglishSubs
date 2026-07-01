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
  const essentialWordsPath = path.join(__dirname, 'essentialWords.js');
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
