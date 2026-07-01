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
console.log('[Test 1/3] Validating JavaScript Syntax across ' + jsFiles.length + ' files...');
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
console.log('[Test 2/3] Checking UTF-8 Encoding & Mojibake across ' + allTextFiles.length + ' files...');
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
console.log('[Test 3/3] Verifying HTML link & script reference integrity in index.html...');
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
