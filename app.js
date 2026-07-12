/**
 * ============================================================================
 * AI LYRIC-TRAINER - MAIN CORE CONTROLLER (app.js)
 * ============================================================================
 * TABLE OF CONTENTS (TOC FOR AI & DEVELOPER NAVIGATION):
 * 
 * 00. [Lines ~0001-0174]: Word Editing Modal Helper [@AI-SECTION: WORD_EDITING_MODAL]
 * 01. [Lines ~0175-0629]: Global Modal Helpers & Animation Controllers [@AI-SECTION: GLOBAL_MODALS_ANIMATIONS]
 * 02. [Lines ~0630-2138]: Core Application Logic, Player & Subtitles Engine [@AI-SECTION: CORE_PLAYER_ENGINE]
 * 03. [Lines ~2139-2176]: Speech Synthesis & Auxiliary Functions [@AI-SECTION: SPEECH_SYNTHESIS]
 * 04. [Lines ~2177-3290]: Event Listeners & Theme Optimizations [@AI-SECTION: EVENT_LISTENERS_THEMES]
 * 05. [Lines ~3291-End ]: Mobile Back Button Support for Modals [@AI-SECTION: MOBILE_BACK_BUTTON_MODALS]
 * 
 * EXTERNAL MODULES (In modules/ directory, linked in index.html):
 * - [types.js]: JSDoc @typedef definitions [@AI-SECTION: TYPES_JSDOC]
 * - [gemini-ai.js]: Live AI Integration [@AI-SECTION: GEMINI_AI_ENGINE]
 * - [shadowing-dictation.js]: Audio Dictation Engine [@AI-SECTION: SHADOWING_DICTATION_ENGINE]
 * - [dictionary-trainer.js]: Leitner Spaced Repetition & Dictionary [@AI-SECTION: DICTIONARY_LEITNER_TRAINER]
 * - [spotify-controller.js]: Spotify Now Playing & Auto-Pause [@AI-SECTION: SPOTIFY_PKCE_CONTROLLER]
 * - [grammar-rules.js]: Interactive Grammar Rules Handbook [@AI-SECTION: GRAMMAR_RULES_ENGINE]
 * - [notebook-module.js]: Global Notes Controller [@AI-SECTION: NOTEBOOK_NOTES_CONTROLLER]
 * - [galaxy-course.js]: YouTube Video Course Tracker [@AI-SECTION: GALAXY_VIDEO_COURSE]
 * ============================================================================
 */

// Calculate Scrollbar width once and set it as CSS variable to prevent modal shift
document.addEventListener('DOMContentLoaded', () => {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);

  // Apply Notebook Line Numbers setting on load
  const hideLineNumbers = localStorage.getItem('galaxy_notebook_line_numbers') === 'false';
  if (hideLineNumbers) {
    document.body.classList.add('no-notebook-line-numbers');
  }
});

function openEditWordModal(w, onSaveSuccess) {
  const editModal     = document.getElementById('editWordModal');
  const closeEditBtn  = document.getElementById('closeEditWordModalBtn');
  const engInput      = document.getElementById('editWordEngInput');
  const rusInput      = document.getElementById('editWordRusInput');
  const defInput      = document.getElementById('editWordDefinitionInput');
  const ruleInput     = document.getElementById('editWordRuleInput');
  const catCont       = document.getElementById('editWordCategoryPillsContainer');
  const customCatCont = document.getElementById('editWordCustomCategoryPillsContainer');
  const saveBtn       = document.getElementById('editWordSaveModalBtn');

  if (!editModal) return;

  // ── Populate fields ────────────────────────────────────────────────
  if (engInput)  engInput.value  = w.word        || '';
  if (rusInput)  rusInput.value  = w.translation || '';
  if (defInput)  defInput.value  = w.definition  || '';
  if (ruleInput) ruleInput.value = w.rule        || '';

  const activeCats = w.categories && Array.isArray(w.categories)
    ? w.categories : (w.category ? [w.category] : ['Общее']);
  const activeCustomCats = w.customCategories && Array.isArray(w.customCategories)
    ? w.customCategories : (w.customCategory ? [w.customCategory] : ['Без категории']);

  // ── Populate Folders pills ─────────────────────────────────────────
  if (catCont) {
    catCont.innerHTML = '';
    personalCategories.forEach(cat => {
      const isSelected = activeCats.includes(cat);
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mcat-pill' + (isSelected ? ' selected' : '');
      pill.dataset.cat = cat;
      pill.textContent = `📁 ${cat}`;
      const applyStyle = (sel) => {
        pill.style.cssText = `
          padding: 4px 10px; border-radius: 15px; font-size: 0.72rem; font-weight: 600;
          cursor: pointer; border: 1px solid; transition: all 0.18s; outline: none; white-space: nowrap;
          background: ${sel ? 'rgba(29,185,84,0.2)' : 'rgba(255,255,255,0.04)'};
          color: ${sel ? '#1db954' : 'var(--text-sub)'};
          border-color: ${sel ? 'rgba(29,185,84,0.4)' : 'rgba(255,255,255,0.1)'};
        `;
      };
      applyStyle(isSelected);
      pill.addEventListener('click', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const isOn = pill.classList.contains('selected');
        const allSel = catCont.querySelectorAll('.mcat-pill.selected');
        if (isOn && allSel.length <= 1) return;
        pill.classList.toggle('selected', !isOn);
        applyStyle(!isOn);
      });
      catCont.appendChild(pill);
    });
  }

  // ── Populate Categories pills ──────────────────────────────────────
  if (customCatCont) {
    customCatCont.innerHTML = '';
    const customCatsList = ['Без категории', ...personalCustomCategories];
    customCatsList.forEach(cat => {
      const isSelected = activeCustomCats.includes(cat);
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mcat-pill' + (isSelected ? ' selected' : '');
      pill.dataset.cat = cat;
      pill.textContent = cat === 'Без категории' ? '🏷️ Без категории' : `🏷️ ${cat}`;
      const applyStyle = (sel) => {
        pill.style.cssText = `
          padding: 4px 10px; border-radius: 15px; font-size: 0.72rem; font-weight: 600;
          cursor: pointer; border: 1px solid; transition: all 0.18s; outline: none; white-space: nowrap;
          background: ${sel ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)'};
          color: ${sel ? '#a78bfa' : 'var(--text-sub)'};
          border-color: ${sel ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)'};
        `;
      };
      applyStyle(isSelected);
      pill.addEventListener('click', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const isOn = pill.classList.contains('selected');
        if (cat === 'Без категории') {
          if (!isOn) {
            customCatCont.querySelectorAll('.mcat-pill').forEach(p => {
              p.classList.remove('selected');
              p.style.cssText = 'padding:4px 10px;border-radius:15px;font-size:0.72rem;font-weight:600;cursor:pointer;border:1px solid;transition:all 0.18s;outline:none;white-space:nowrap;background:rgba(255,255,255,0.04);color:var(--text-sub);border-color:rgba(255,255,255,0.1);';
            });
            pill.classList.add('selected'); applyStyle(true);
          }
        } else {
          pill.classList.toggle('selected', !isOn);
          applyStyle(!isOn);
          const nonePill = Array.from(customCatCont.querySelectorAll('.mcat-pill')).find(p => p.dataset.cat === 'Без категории');
          if (!isOn && nonePill) { nonePill.classList.remove('selected'); nonePill.style.cssText = 'padding:4px 10px;border-radius:15px;font-size:0.72rem;font-weight:600;cursor:pointer;border:1px solid;transition:all 0.18s;outline:none;white-space:nowrap;background:rgba(255,255,255,0.04);color:var(--text-sub);border-color:rgba(255,255,255,0.1);'; }
          if (customCatCont.querySelectorAll('.mcat-pill.selected').length === 0 && nonePill) {
            nonePill.classList.add('selected'); applyStyle.call(nonePill, true);
            nonePill.style.cssText = 'padding:4px 10px;border-radius:15px;font-size:0.72rem;font-weight:600;cursor:pointer;border:1px solid;transition:all 0.18s;outline:none;white-space:nowrap;background:rgba(167,139,250,0.2);color:#a78bfa;border-color:rgba(167,139,250,0.4);';
          }
        }
      });
      customCatCont.appendChild(pill);
    });
  }

  // ── Smart input ────────────────────────────────────────────────────
  if (engInput)  engInput.oninput  = () => applyLayoutFix(engInput,  'cyrToLat');
  if (rusInput)  rusInput.oninput  = () => applyLayoutFix(rusInput,  'latToCyr');

  // ── Open modal ─────────────────────────────────────────────────────
  openModalEl(editModal);
  setTimeout(() => { if (engInput) engInput.focus(); }, 120);

  // ── Close handlers ─────────────────────────────────────────────────
  const doClose = () => {
    closeModalEl(editModal);
    if (saveBtn) { saveBtn.textContent = '💾 Save Changes'; saveBtn.style.background = 'linear-gradient(135deg, #a78bfa, #7c3aed)'; saveBtn.disabled = false; }
    if (closeEditBtn) closeEditBtn.onclick = null;
    if (saveBtn) saveBtn.onclick = null;
  };
  if (closeEditBtn) closeEditBtn.onclick = doClose;
  editModal.onclick = (ev) => { if (ev.target === editModal) doClose(); };

  // ── Save handler ───────────────────────────────────────────────────
  if (saveBtn) {
    saveBtn.onclick = () => {
      const rawEng = engInput ? engInput.value.trim() : '';
      const newEng = formatDictionaryWord(rawEng);
      const newRus = rusInput ? rusInput.value.trim() : '';

      const flashField = (el) => {
        el.style.borderColor = '#ef4444';
        el.style.boxShadow = '0 0 0 2px rgba(239,68,68,0.25)';
        setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 1800);
        el.focus();
      };

      if (!newEng) { if (engInput) flashField(engInput); return; }
      if (!newRus) { if (rusInput) flashField(rusInput); return; }

      if (newEng.toLowerCase() !== w.word.toLowerCase()) {
        const isDup = personalDictionary.some(x => x.word.toLowerCase() === newEng.toLowerCase());
        if (isDup) {
          if (engInput) { flashField(engInput); const orig = engInput.placeholder; engInput.placeholder = `⚠ "${newEng}" is already in the dictionary`; setTimeout(() => { engInput.placeholder = orig; }, 2200); }
          return;
        }
      }

      const selectedCats = catCont ? Array.from(catCont.querySelectorAll('.mcat-pill.selected')).map(p => p.dataset.cat) : ['Общее'];
      const cats = selectedCats.length > 0 ? selectedCats : ['Общее'];
      const selectedCustomCats = customCatCont ? Array.from(customCatCont.querySelectorAll('.mcat-pill.selected')).map(p => p.dataset.cat) : ['Без категории'];
      const customCats = selectedCustomCats.length > 0 ? selectedCustomCats : ['Без категории'];

      w.word           = newEng;
      w.translation    = newRus;
      w.definition     = defInput  ? defInput.value.trim()  : (w.definition || '');
      w.rule           = ruleInput ? ruleInput.value.trim() : (w.rule       || '');
      w.categories     = cats;
      w.category       = cats[0];
      w.customCategories = customCats;
      w.customCategory = customCats[0];

      saveDictionaryToStorage();

      saveBtn.textContent = `✅ ${newEng.slice(0, 20)} saved!`;
      saveBtn.style.background = 'linear-gradient(135deg, #1db954, #16a34a)';
      saveBtn.disabled = true;

      setTimeout(() => {
        doClose();
        if (onSaveSuccess) onSaveSuccess();
      }, 900);
    };
  }
}
/* ==========================================================================
   AI LYRIC-TRAINER — MODERN INTERACTIVE CONTROLLER (VANILLA JS)
   ========================================================================== */

/* ==========================================================================
   GLOBAL MODAL HELPERS — Flicker-free open/close with CSS animation
   ========================================================================== */

/**
 * Opens a modal element without flicker.
 * Sets display:flex, then triggers .modal-animate-in via double-rAF
 * so the CSS animation always fires exactly once per open.
 */
function openModalEl(el) {
  if (!el) return;
  
  // NOTE: history.pushState is handled by the MutationObserver in initModalHistoryAPI()
  // to avoid double-push causing stray popstate events
  
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');
  el.classList.remove('modal-animate-out');
  el.style.display = 'flex';
  el.classList.remove('modal-animate-in');
  void el.offsetWidth; // Force CSS reflow
  el.classList.add('modal-animate-in');
}

/**
 * Closes a modal element and plays animation out.
 */
function closeModalEl(el) {
  if (!el) return;
  if (el.style.display === 'none' || el.classList.contains('modal-animate-out')) return;
  
  el.classList.remove('modal-animate-in');
  el.classList.add('modal-animate-out');
  setTimeout(() => {
    if (el.classList.contains('modal-animate-out')) {
      el.style.display = 'none';
      el.classList.remove('modal-animate-out');
      const anyOpen = Array.from(document.querySelectorAll('.modal-overlay')).some(
        m => m !== el && m.style.display && m.style.display !== 'none'
      );
      if (!anyOpen) {
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        // NOTE: history.back() is handled by the MutationObserver in initModalHistoryAPI()
        // to avoid double-back causing stray popstate events that hide close buttons
      }
    }
  }, 200);
}

// Intercept popstate to close modals if the user swipes back on mobile
window.addEventListener('popstate', (e) => {
  if (!window.location.hash.includes('modal')) {
    // Only target actual modal overlays, NOT inner cards/containers that happen to have "Modal" in their ID
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(m => {
      if (m.style.display !== 'none' && m.style.display !== '') {
        const closeBtn = m.querySelector('.modal-close-btn, .close-modal, .close-btn, .close-lightbox');
        if (closeBtn) closeBtn.click();
        else closeModalEl(m);
      }
    });
  }
});

// 1. Fully detailed Song Dataset (Spotify-ready)

// State Variables
let currentSongKey = 'scorpions';
let lastRenderedSongKey = null;
let activeLineData = null;
let activeOriginalText = '';
let csvSongs = []; // Array of parsed CSV songs: { id, title, artist, spotifyId, art, genre }
let activeDropdownIndex = -1; // Keyboard index for autocomplete navigation

// Favorites State Layer
let favoriteSongs = JSON.parse(localStorage.getItem('favorite_songs')) || [];

function isSongFavorite(songId) {
  return favoriteSongs.includes(songId);
}

function toggleSongFavorite(songId) {
  const index = favoriteSongs.indexOf(songId);
  if (index === -1) {
    favoriteSongs.push(songId);
  } else {
    favoriteSongs.splice(index, 1);
  }
  localStorage.setItem('favorite_songs', JSON.stringify(favoriteSongs));
}

function resolveSongById(songId) {
  // 1. Try songsData
  let song = songsData[songId];
  if (song) {
    return {
      id: songId,
      title: song.title,
      artist: song.artist,
      genre: song.genre || 'Classic Rock',
      art: song.art || 'M'
    };
  }

  // 2. Try hardcoded standard songs
  const hardcoded = [
    { id: 'scorpions', title: 'Wind of Change', artist: 'Scorpions', genre: 'Classic Rock', art: 'SC' },
    { id: 'metallica', title: 'Nothing Else Matters', artist: 'Metallica', genre: 'Heavy Metal', art: 'ME' },
    { id: 'rhcp', title: 'Californication', artist: 'Red Hot Chili Peppers', genre: 'Alternative Rock', art: 'RH' }
  ];
  const foundHardcoded = hardcoded.find(s => s.id === songId);
  if (foundHardcoded) return foundHardcoded;

  // 3. Try csvSongs
  if (csvSongs && csvSongs.length > 0) {
    const foundCsv = csvSongs.find(s => s.id === songId);
    if (foundCsv) return foundCsv;
  }

  // 4. Try persistent song metadata cache
  try {
    const cache = JSON.parse(localStorage.getItem('song_metadata_cache')) || {};
    if (cache[songId]) {
      return cache[songId];
    }
  } catch (e) {}

  return null;
}

// DOM Elements
const lyricsBoard = document.getElementById('lyricsBoard');
const sidebarPanel = document.getElementById('sidebarPanel');
const scrimOverlay = document.getElementById('scrimOverlay');
const closeBtn = document.getElementById('closeBtn');
const performanceToggle = document.getElementById('performanceToggle');
  const speedToggleId = 'videoAutoAccelerateToggle';
  let speedToggle = document.getElementById(speedToggleId);
  if (!speedToggle && performanceToggle) {
    const perfGroup = performanceToggle.closest('.switch').parentElement.parentElement;
    perfGroup.insertAdjacentHTML('beforeend', '<div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05);"><div style="display: flex; flex-direction: column; gap: 4px;"><span style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">Auto-Accelerate Video (2x)</span><span style="font-size: 0.68rem; color: var(--text-muted);">Automatically set 2x playback speed for video lessons.</span></div><label class="switch"><input type="checkbox" id="videoAutoAccelerateToggle"><span class="slider"></span></label></div>');
    speedToggle = document.getElementById(speedToggleId);
  }
  const savedSpeed = localStorage.getItem('galaxy_video_2x') !== 'false';
  if (speedToggle) speedToggle.checked = savedSpeed;

const themeToggleBtn = document.getElementById('themeToggleBtn');

// Header elements
const albumArt = document.getElementById('albumArt');
const songBadge = document.getElementById('songBadge');
const songTitle = document.getElementById('songTitle');
const artistName = document.getElementById('artistName');

/* ==========================================================================
   2. Core Application Logic
   ========================================================================== */

// Safe HTML escaping utility to prevent XSS vulnerabilities
function escapeHTML(str) {
  if (typeof str !== 'string') {
    if (str === null || str === undefined) return '';
    return String(str);
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;');
}

// ── Keyboard Layout Auto-Correction ──────────────────────────────────────────
// Maps: Cyrillic characters → their Latin keyboard equivalents (same key positions)
const CYR_TO_LAT_MAP = {
  'й':'q','ц':'w','у':'e','к':'r','е':'t','н':'y','г':'u','ш':'i','щ':'o','з':'p',
  'х':'[','ъ':']','ф':'a','ы':'s','в':'d','а':'f','п':'g','р':'h','о':'j','л':'k',
  'д':'l','ж':';','э':"'",'я':'z','ч':'x','с':'c','м':'v','и':'b','т':'n','ь':'m',
  'б':',','ю':'.','Й':'Q','Ц':'W','У':'E','К':'R','Е':'T','Н':'Y','Г':'U','Ш':'I',
  'Щ':'O','З':'P','Х':'{','Ъ':'}','Ф':'A','Ы':'S','В':'D','А':'F','П':'G','Р':'H',
  'О':'J','Л':'K','Д':'L','Ж':':','Э':'"','Я':'Z','Ч':'X','С':'C','М':'V','И':'B',
  'Т':'N','Ь':'M','Б':'<','Ю':'>'
};

// Maps: Latin characters → their Cyrillic keyboard equivalents (same key positions)
const LAT_TO_CYR_MAP = {
  'q':'й','w':'ц','e':'у','r':'к','t':'е','y':'н','u':'г','i':'ш','o':'щ','p':'з',
  '[':'х',']':'ъ','a':'ф','s':'ы','d':'в','f':'а','g':'п','h':'р','j':'о','k':'л',
  'l':'д',';':'ж',"'":'э','z':'я','x':'ч','c':'с','v':'м','b':'и','n':'т','m':'ь',
  ',':'б','.':'ю','Q':'Й','W':'Ц','E':'У','R':'К','T':'Е','Y':'Н','U':'Г','I':'Ш',
  'O':'Щ','P':'З','{':'Х','}':'Ъ','A':'Ф','S':'Ы','D':'В','F':'А','G':'П','H':'Р',
  'J':'О','K':'Л','L':'Д',':':'Ж','"':'Э','Z':'Я','X':'Ч','C':'С','V':'М','B':'И',
  'N':'Т','M':'Ь','<':'Б','>':'Ю'
};

/**
 * Applies layout fix to an input element.
 * @param {HTMLInputElement} inputEl - the input to fix
 * @param {'cyrToLat'|'latToCyr'} direction - conversion direction
 */
function applyLayoutFix(inputEl, direction) {
  const map = direction === 'cyrToLat' ? CYR_TO_LAT_MAP : LAT_TO_CYR_MAP;
  const origVal = inputEl.value;
  const selStart = inputEl.selectionStart;
  const selEnd = inputEl.selectionEnd;

  // Check if the current value has any characters needing conversion
  const newVal = origVal.split('').map(ch => map[ch] !== undefined ? map[ch] : ch).join('');

  if (newVal !== origVal) {
    inputEl.value = newVal;
    // Restore cursor position
    try {
      inputEl.setSelectionRange(selStart, selEnd);
    } catch(e) {}
    // Flash a subtle yellow border to signal auto-correction
    inputEl.style.borderColor = 'rgba(251, 191, 36, 0.7)';
    inputEl.style.boxShadow = '0 0 8px rgba(251, 191, 36, 0.25)';
    clearTimeout(inputEl._layoutFixTimer);
    inputEl._layoutFixTimer = setTimeout(() => {
      inputEl.style.borderColor = '';
      inputEl.style.boxShadow = '';
    }, 600);
  }
}

// RFC-compliant safe CSV parser
function parseCSV(text) {
  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i+1];
    
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push("");
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      if (row.length > 1 || row[0] !== "") {
        lines.push(row);
      }
      row = [""];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
}

// Convert CSV rows to structured track metadata index
function loadCSVSongs(csvText) {
  try {
    const parsedRows = parseCSV(csvText);
    if (parsedRows.length <= 1) return;
    
    const header = parsedRows[0];
    const songIdx = header.indexOf('Song');
    const artistIdx = header.indexOf('Artist');
    const genresIdx = header.indexOf('Parent Genres') !== -1 ? header.indexOf('Parent Genres') : header.indexOf('Genres');
    const spotifyIdIdx = header.indexOf('Spotify Track Id');
    
    if (songIdx === -1 || artistIdx === -1) {
      console.warn("Invalid CSV structure. Missing Song or Artist columns.");
      return;
    }
    
    csvSongs = [];
    
    for (let i = 1; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      if (row.length < Math.max(songIdx, artistIdx)) continue;
      
      const songTitle = row[songIdx];
      const artistName = row[artistIdx];
      if (!songTitle || !artistName) continue;
      
      const spotifyId = spotifyIdIdx !== -1 ? row[spotifyIdIdx] : '';
      const genre = genresIdx !== -1 ? row[genresIdx] : 'Pop';
      const cleanGenre = genre.split(',')[0].trim() || 'Music';
      
      const id = 'csv-' + i;
      
      let art = 'M';
      if (artistName) {
        const parts = artistName.split(' ');
        art = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
      }
      
      csvSongs.push({
        id,
        title: songTitle,
        artist: artistName,
        spotifyId,
        genre: cleanGenre,
        art
      });
    }
    console.log(`[CSV Loader] Successfully parsed ${csvSongs.length} songs from CSV.`);
  } catch (error) {
    console.error("Error loading CSV songs:", error);
  }
}

// Help clean artist/title to avoid search misses
function cleanQueryTerm(term) {
  return term
    .replace(/\s*-\s*(Remastered|Remaster|Live|Single|Acoustic|Radio Edit|EP Version|Album Version|Bonus Track).*$/i, '')
    .replace(/\s*\(feat\..*?\)/i, '')
    .replace(/\s*\(with\s.*?\)/i, '')
    .replace(/\s*\(Remastered\)/i, '')
    .replace(/\s*\(Live\)/i, '')
    .trim();
}

// Fetch official lyrics dynamically with LRCLIB & Lyrics.ovh fallbacks
// Fetch official lyrics dynamically with multiple fallback providers including Genius & AI
async function fetchLyrics(artist, title) {
  const cleanArtist = cleanQueryTerm(artist);
  const cleanTitle = cleanQueryTerm(title);
  
  console.log(`[Lyrics Fetch] Searching lyrics for: "${cleanArtist} - ${cleanTitle}" (Original: "${artist} - ${title}")`);
  
  // 1. Try LRCLIB exact lookup
  try {
    const url = `https://lrclib.net/api/lookup?artist=${encodeURIComponent(cleanArtist)}&track=${encodeURIComponent(cleanTitle)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data.plainLyrics) {
        console.log("[Lyrics Fetch] Found exact plain lyrics on LRCLIB");
        return data.plainLyrics;
      } else if (data && data.syncedLyrics) {
        console.log("[Lyrics Fetch] Found exact synced lyrics on LRCLIB");
        return data.syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
      }
    }
  } catch (err) {
    console.warn("[Lyrics Fetch] LRCLIB exact lookup failed:", err);
  }
  
  // 2. Try LRCLIB fuzzy search using specific track & artist names
  try {
    const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
    const response = await fetch(url);
    if (response.ok) {
      const results = await response.json();
      if (results && results.length > 0) {
        // Find first item with lyrics
        const bestMatch = results.find(item => item.plainLyrics || item.syncedLyrics);
        if (bestMatch) {
          console.log("[Lyrics Fetch] Found lyrics via LRCLIB fuzzy search (by signature)");
          if (bestMatch.plainLyrics) return bestMatch.plainLyrics;
          return bestMatch.syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
        }
      }
    }
  } catch (err) {
    console.warn("[Lyrics Fetch] LRCLIB fuzzy signature search failed:", err);
  }

  // 3. Try LRCLIB search with a single text query (very robust for typos/slight differences)
  try {
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanArtist + ' ' + cleanTitle)}`;
    const response = await fetch(url);
    if (response.ok) {
      const results = await response.json();
      if (results && results.length > 0) {
        const bestMatch = results.find(item => item.plainLyrics || item.syncedLyrics);
        if (bestMatch) {
          console.log("[Lyrics Fetch] Found lyrics via LRCLIB text search (by q)");
          if (bestMatch.plainLyrics) return bestMatch.plainLyrics;
          return bestMatch.syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
        }
      }
    }
  } catch (err) {
    console.warn("[Lyrics Fetch] LRCLIB fuzzy text search failed:", err);
  }
  
  // 4. Try Lyrics.ovh API
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data.lyrics) {
        console.log("[Lyrics Fetch] Found lyrics on Lyrics.ovh");
        return data.lyrics;
      }
    }
  } catch (err) {
    console.warn("[Lyrics Fetch] Lyrics.ovh lookup failed:", err);
  }

  // 5. Try Genius (via AllOrigins CORS-proxy + DOMParser Scraper)
  try {
    console.log("[Lyrics Fetch] Attempting Genius lookup...");
    const geniusLyrics = await fetchGeniusLyrics(cleanArtist, cleanTitle);
    if (geniusLyrics) {
      console.log("[Lyrics Fetch] Successfully scraped lyrics from Genius!");
      return geniusLyrics;
    }
  } catch (err) {
    console.warn("[Lyrics Fetch] Genius lookup failed:", err);
  }

  // 6. Try Gemini AI Lyrics Searcher (Ultimate Fallback)
  try {
    const currentApiKey = typeof getAPIKey === 'function' ? getAPIKey() : null;
    if (currentApiKey) {
      console.log("[Lyrics Fetch] Attempting AI Lyrics Generator fallback...");
      const aiLyrics = await fetchAILyrics(artist, title);
      if (aiLyrics) {
        return aiLyrics;
      }
    }
  } catch (err) {
    console.warn("[Lyrics Fetch] AI Lyrics Generator failed:", err);
  }
  
  throw new Error("Could not find lyrics in any open database (LRCLIB, Lyrics.ovh), Genius, or via AI.");
}

// Genius lyrics scraper using AllOrigins CORS proxy
async function fetchGeniusLyrics(artist, title) {
  const searchUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://genius.com/api/search/multi?q=${encodeURIComponent(artist + ' ' + title)}`)}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) throw new Error("Genius search proxy failed");
  const searchData = await searchRes.json();
  const parsedData = JSON.parse(searchData.contents);
  
  // Find the first hit in the "song" section
  const songSection = parsedData.response.sections.find(s => s.type === 'song');
  if (!songSection || !songSection.hits || songSection.hits.length === 0) {
    throw new Error("No Genius matches found");
  }
  
  const hit = songSection.hits[0].result;
  const songPath = hit.path;
  console.log(`[Genius Scraper] Found Genius path: ${songPath}`);
  
  // Fetch HTML from Genius song page
  const lyricUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://genius.com${songPath}`)}`;
  const lyricRes = await fetch(lyricUrl);
  if (!lyricRes.ok) throw new Error("Genius lyrics page proxy failed");
  const lyricData = await lyricRes.json();
  const html = lyricData.contents;
  
  // Parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Scrape lyrics containers
  const containers = doc.querySelectorAll('div[data-lyrics-container="true"]');
  let lyricsText = "";
  
  if (containers.length > 0) {
    containers.forEach(container => {
      // Replace <br> tags with actual newlines to preserve styling safely
      container.querySelectorAll('br').forEach(br => {
        if (br.parentNode) {
          br.parentNode.insertBefore(doc.createTextNode('\n'), br);
          br.parentNode.removeChild(br);
        }
      });
      lyricsText += container.textContent + "\n\n";
    });
  } else {
    // Legacy fallback class
    const oldContainer = doc.querySelector('.lyrics');
    if (oldContainer) {
      lyricsText = oldContainer.textContent;
    }
  }
  
  lyricsText = lyricsText.trim();
  if (lyricsText) {
    // Sanitize extra consecutive empty lines
    lyricsText = lyricsText.replace(/\n{3,}/g, '\n\n');
    return lyricsText;
  }
  throw new Error("Lyrics content not found in Genius page structure");
}

// AI Lyrics Generator (Ultimate Fallback)
async function fetchAILyrics(artist, title) {
  const currentApiKey = typeof getAPIKey === 'function' ? getAPIKey() : null;
  if (!currentApiKey) {
    throw new Error("API key is not configured for AI fallback");
  }
  
  const prompt = `You are a lyrics repository. Retrieve and return ONLY the complete authentic English lyrics of the song "${title}" by artist "${artist}". Do not write any explanations, headers, translations, or notes. Just output the clean lines of the song.`;
  
  let lyricsText = "";
  
  if (currentApiKey.startsWith('sk-or-')) {
    // OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }]
      })
    });
    
    if (response.ok) {
      const resJson = await response.json();
      lyricsText = resJson.choices[0].message.content;
    }
  } else {
    // Google Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentApiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });
    
    if (response.ok) {
      const resJson = await response.json();
      lyricsText = resJson.candidates[0].content.parts[0].text;
    }
  }
  
  lyricsText = lyricsText.trim();
  // Strip Markdown code fences if any
  lyricsText = lyricsText.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
  
  if (lyricsText && lyricsText.length > 100) {
    return lyricsText;
  }
  throw new Error("AI returned empty or invalid text");
}

// Group song lines into semantic 3-4 line stanzas
function segmentLyricsIntoStanzas(rawLyrics) {
  let cleaned = rawLyrics
    .replace(/\r\n/g, '\n')
    .replace(/Paroles de .* par .*/gi, '')
    .replace(/Lyrics by .* published by .*/gi, '')
    .trim();
  
  // Helper to identify structural label lines like [Chorus], (chorus), [Verse 1], etc.
  const isStructuralLabel = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    return /^[\[\(]\s*(chorus|verse|bridge|intro|outro|solo|refrain|pre-chorus|prechorus|instrumental|transition|guitar|куплет|припев|интро|coda|hook|snippet|part\s*\d+|bridge\s*\d+|chorus\s*\d+|verse\s*\d+|куплет\s*\d+|припев\s*\d+)/i.test(trimmed);
  };

  // 1. Split raw text into initial semantic blocks based on double newlines
  let initialBlocks = [];
  if (cleaned.includes('\n\n')) {
    initialBlocks = cleaned.split('\n\n');
  } else {
    initialBlocks = [cleaned];
  }
  
  let blocks = [];
  
  initialBlocks.forEach(block => {
    // Split block into individual lines, strip leading/trailing spaces, and filter structural markers
    const lines = block.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !isStructuralLabel(line));
      
    if (lines.length === 0) return;
    
    // 2. If a single block has more than 5 lines, partition it into standard chunks of 3-4 lines
    if (lines.length > 5) {
      const chunkSize = 4;
      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize).join('\n');
        if (chunk) blocks.push(chunk);
      }
    } else {
      blocks.push(lines.join('\n'));
    }
  });
  
  const finalLines = [];
  let blockIndex = 1;
  
  blocks.forEach(block => {
    const text = block.trim();
    if (!text) return;
    
    finalLines.push({
      id: `dyn-${blockIndex}`,
      text: text,
      translation: "",
      grammar: [],
      words: []
    });
    blockIndex++;
  });
  
  return finalLines;
}

// Render error fallback state with interactive manual text input box
function renderLyricsError(title, artist, errorMessage) {
  lyricsBoard.innerHTML = `
    <div style="text-align: center; padding: 3rem 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; max-width: 550px; margin: 0 auto; animation: fadeIn 0.5s ease-out;">
      <div style="font-size: 3.5rem; filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.15));">🎵</div>
      <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-main); line-height: 1.3; margin: 0;">
        Could not load lyrics for "${escapeHTML(title)}"
      </h2>
      <p style="font-size: 0.88rem; color: var(--text-sub); line-height: 1.5; margin: 0;">
        Open music databases couldn't find lyrics for this track. But our AI is ready to translate and break down the title for you!
      </p>
      
      <!-- Premium Glassmorphic AI Translation Card -->
      <div id="lyrics-error-title-analysis" style="width: 100%; padding: 20px; background: rgba(139, 92, 246, 0.04); border: 1px solid rgba(139, 92, 246, 0.15); border-radius: 16px; text-align: left; box-shadow: 0 8px 32px rgba(0,0,0,0.15); display: flex; flex-direction: column; gap: 12px; transition: all 0.3s; backdrop-filter: blur(10px);">
        <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #a78bfa; display: flex; align-items: center; gap: 8px; letter-spacing: 0.5px;">
          <span>✦ AI AUTO-TRANSLATION OF TITLE</span>
          <span class="pulse-dot-violet" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #8b5cf6; box-shadow: 0 0 8px #8b5cf6; animation: pulse 1.5s infinite;"></span>
        </div>
        <div id="errorTitleAnalysisContent" style="font-size: 0.88rem; color: var(--text-sub); line-height: 1.6;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="search-loading-spinner" style="position: static; display: inline-block; width: 14px; height: 14px; border-color: #8b5cf6; border-top-color: transparent;"></div>
            <span>AI is translating the title and analyzing its deeper meaning...</span>
          </div>
        </div>
      </div>

      <div style="width: 100%; display: flex; flex-direction: column; gap: 10px; margin-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 1.5rem;">
        <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-align: left;">Or paste the lyrics manually:</span>
        <textarea id="manualLyricsArea" placeholder="Paste the song lyrics in English here..." rows="4"></textarea>
        <button id="submitManualLyricsBtn" style="background: var(--accent-spotify); color: #000000; font-weight: 700; border: none; padding: 10px 20px; border-radius: 20px; font-size: 0.85rem; cursor: pointer; transition: var(--transition-fast); display: flex; align-items: center; justify-content: center; gap: 8px;">
          🚀 Start analyzing pasted lyrics
        </button>
      </div>
    </div>
  `;
  
  // Asynchronously request the title analysis from AI
  (async () => {
    const analysisBox = document.getElementById('errorTitleAnalysisContent');
    if (!analysisBox) return;

    try {
      let cached = getCachedSongMeaning(title, artist);
      if (!cached) {
        cached = await fetchGeminiSongMeaning(title, artist);
        setCachedSongMeaning(title, artist, cached);
      }

      if (cached) {
        analysisBox.innerHTML = `
          <div style="margin-bottom: 8px;">
            <strong style="color: var(--accent-spotify); font-size: 1.1rem; display: block; margin-bottom: 4px;">
              ${escapeHTML(cached.titleTranslation || title)} ${cached.titlePronunciation ? `<span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted); font-style: normal; margin-left: 6px;">${escapeHTML(cached.titlePronunciation)}</span>` : ''}
            </strong>
          </div>
          <p style="margin: 0 0 12px 0; color: var(--text-main); font-size: 0.88rem; line-height: 1.55;">
            ${escapeHTML(cached.songMeaning) || 'Translating track meaning...'}
          </p>
          ${cached.titleVocabulary && cached.titleVocabulary.length > 0 ? `
            <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; margin-top: 8px;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Vocabulary from the title:</span>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${cached.titleVocabulary.map(item => {
                  const escWord = item.word.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
                  const escTrans = item.translation.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
                  return `
                    <div style="font-size: 0.82rem; line-height: 1.45; display: flex; flex-direction: column; gap: 4px; padding: 8px 10px; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); border-radius: 8px;">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <code style="color: var(--accent-spotify); font-family: monospace; font-weight: 700; background: rgba(29, 185, 84, 0.08); padding: 2px 6px; border-radius: 4px; margin-right: 6px;">${escapeHTML(item.word)}</code>
                          <strong style="color: var(--text-main);">${escapeHTML(item.translation)}</strong>
                        </div>
                        <button onclick="event.stopPropagation(); window.addWordToPersonalDictionary('${escWord}', '${escTrans}')" style="background: rgba(29, 185, 84, 0.08); border: 1px solid rgba(29, 185, 84, 0.2); color: var(--accent-spotify); border-radius: 20px; padding: 2px 8px; font-size: 0.65rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 2px; transition: all 0.2s;" onmouseover="this.style.background='rgba(29, 185, 84, 0.15)'" onmouseout="this.style.background='rgba(29, 185, 84, 0.08)'">
                          <span>➕ Add to dictionary</span>
                        </button>
                      </div>
                      <div style="color: var(--text-sub); font-size: 0.78rem;">${escapeHTML(item.context)}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        `;
      }
    } catch (e) {
      console.error("[Lyrics Error AI Callback] Failed to fetch song title meaning:", e);
      analysisBox.innerHTML = `
        <span style="color: var(--text-muted); font-style: italic;">
          Could not get an automatic translation from AI. You can still paste the lyrics manually!
        </span>
      `;
    }
  })();

  const area = document.getElementById('manualLyricsArea');
  if (area) {
    area.addEventListener('focus', () => {
      area.style.borderColor = 'var(--accent-spotify)';
    });
    area.addEventListener('blur', () => {
      area.style.borderColor = 'var(--border-glass)';
    });
  }

  const btn = document.getElementById('submitManualLyricsBtn');
  if (btn && area) {
    btn.addEventListener('click', () => {
      const customText = area.value.trim();
      if (!customText) return;
      
      const stanzas = segmentLyricsIntoStanzas(customText);
      if (stanzas.length === 0) {
        alert("Please enter the song lyrics.");
        return;
      }
      
      songsData[currentSongKey] = {
        title,
        artist,
        genre: "Custom",
        art: artist.substring(0, 2).toUpperCase(),
        lines: stanzas
      };
      
      renderSong(currentSongKey);
    });
  }
}

// Helper to convert Russian keyboard layout to English QWERTY
function convertRuLayoutToEn(text) {
  if (!text) return '';
  const map = {
    'й': 'q', 'ц': 'w', 'у': 'e', 'к': 'r', 'е': 't', 'н': 'y', 'г': 'u', 'ш': 'i', 'щ': 'o', 'з': 'p', 'х': '[', 'ъ': ']',
    'ф': 'a', 'ы': 's', 'в': 'd', 'а': 'f', 'п': 'g', 'р': 'h', 'о': 'j', 'л': 'k', 'д': 'l', 'ж': ';', 'э': "'",
    'я': 'z', 'ч': 'x', 'с': 'c', 'м': 'v', 'и': 'b', 'т': 'n', 'ь': 'm', 'б': ',', 'ю': '.', '.': '/',
    'Й': 'Q', 'Ц': 'W', 'У': 'E', 'К': 'R', 'Е': 'T', 'Н': 'Y', 'Г': 'U', 'Ш': 'I', 'Щ': 'O', 'З': 'P', 'Х': '{', 'Ъ': '}',
    'Ф': 'A', 'Ы': 'S', 'В': 'D', 'А': 'F', 'П': 'G', 'Р': 'H', 'О': 'J', 'Л': 'K', 'Д': 'L', 'Ж': ':', 'Э': '"',
    'Я': 'Z', 'Ч': 'X', 'С': 'C', 'М': 'V', 'И': 'B', 'Т': 'N', 'Ь': 'M', 'Б': '<', 'Ю': '>', '?': '&'
  };
  return text.split('').map(char => map[char] || char).join('');
}

// Controller for Autocomplete Search UI dropdown actions and keyboard navigations
function initAutocomplete() {
  const dropdown = document.getElementById('songSearchDropdown');
  const input = document.getElementById('songSearchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  const wrapper = document.getElementById('autocompleteWrapper');

  if (!input || !dropdown || !clearBtn) return;

  function getSearchList() {
    const list = [
      { id: 'scorpions', title: 'Wind of Change', artist: 'Scorpions', genre: 'Classic Rock', art: 'SC' },
      { id: 'metallica', title: 'Nothing Else Matters', artist: 'Metallica', genre: 'Heavy Metal', art: 'ME' },
      { id: 'rhcp', title: 'Californication', artist: 'Red Hot Chili Peppers', genre: 'Alternative Rock', art: 'RH' }
    ];
    
    csvSongs.forEach(song => {
      list.push(song);
    });
    
    return list;
  }

  function getSearchResults(query) {
    if (!query) return { matchesMeta: getSearchList(), matchesLyrics: [] };

    const queryLower = query.toLowerCase();
    const convertedQuery = convertRuLayoutToEn(query).toLowerCase();
    const allSongs = getSearchList();

    // 1. Metadata matches (by title or artist)
    const matchesMeta = allSongs.filter(song => {
      const title = song.title.toLowerCase();
      const artist = song.artist.toLowerCase();
      return title.includes(queryLower) || 
             artist.includes(queryLower) ||
             (convertedQuery && (title.includes(convertedQuery) || artist.includes(convertedQuery)));
    });

    // 2. Lyrics matches (by text or translation in songsData)
    const matchesLyrics = [];
    const metaMatchIds = new Set(matchesMeta.map(s => s.id));

    Object.keys(songsData).forEach(songId => {
      if (metaMatchIds.has(songId)) return;

      const song = songsData[songId];
      if (!song || !song.lines) return;

      const matchingLine = song.lines.find(line => {
        const text = (line.text || '').toLowerCase();
        const translation = (line.translation || '').toLowerCase();
        return text.includes(queryLower) || 
               translation.includes(queryLower) ||
               (convertedQuery && (text.includes(convertedQuery) || translation.includes(convertedQuery)));
      });

      if (matchingLine) {
        const songMeta = allSongs.find(s => s.id === songId) || {
          id: songId,
          title: song.title,
          artist: song.artist,
          genre: song.genre || 'Classic Rock',
          art: song.art || '🎵'
        };

        // Find the exact sub-line within text or translation that matches
        let foundLineText = '';
        if (matchingLine.text) {
          const subLines = matchingLine.text.split('\n');
          const match = subLines.find(sl => sl.toLowerCase().includes(queryLower) || (convertedQuery && sl.toLowerCase().includes(convertedQuery)));
          if (match) foundLineText = match;
        }
        if (!foundLineText && matchingLine.translation) {
          const subLines = matchingLine.translation.split('\n');
          const match = subLines.find(sl => sl.toLowerCase().includes(queryLower) || (convertedQuery && sl.toLowerCase().includes(convertedQuery)));
          if (match) {
            foundLineText = matchingLine.text.split('\n')[0];
          }
        }
        if (!foundLineText) {
          foundLineText = matchingLine.text.split('\n')[0];
        }

        matchesLyrics.push({
          ...songMeta,
          matchingQuote: foundLineText
        });
      }
    });

    return { matchesMeta, matchesLyrics };
  }

  function renderDropdown(matchesMeta, matchesLyrics = [], query = '') {
    dropdown.innerHTML = '';
    activeDropdownIndex = -1;

    // 💖 Prioritize favorite songs when query is empty!
    if (!query) {
      const allSongs = getSearchList();
      const favoritesList = allSongs.filter(song => isSongFavorite(song.id));
      
      if (favoritesList.length > 0) {
        const favHeader = document.createElement('div');
        favHeader.className = 'autocomplete-section-header';
        favHeader.innerHTML = '💖 Favorite Songs';
        dropdown.appendChild(favHeader);

        favoritesList.forEach((song, idx) => {
          const item = document.createElement('div');
          item.className = 'autocomplete-item';
          item.dataset.songId = song.id;
          item.dataset.index = idx;

          item.innerHTML = `
            <div class="autocomplete-item-title">${escapeHTML(song.title)} <span style="color: #ef4444; font-size: 0.8rem;">💖</span></div>
            <div class="autocomplete-item-artist">${escapeHTML(song.artist)}</div>
          `;

          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectSongFromDropdown(song);
          });

          dropdown.appendChild(item);
        });

        // Add section header for other songs
        const generalHeader = document.createElement('div');
        generalHeader.className = 'autocomplete-section-header';
        generalHeader.innerHTML = '🔥 All Songs';
        dropdown.appendChild(generalHeader);
      }

      // Limit list size when favorites are also showing to avoid dropdown clutter
      const displaySongs = matchesMeta.slice(0, 10);
      
      displaySongs.forEach((song, idx) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.dataset.songId = song.id;
        // Adjust keyboard navigation dataset index to match DOM elements index
        const currentItemsCount = dropdown.querySelectorAll('.autocomplete-item').length;
        item.dataset.index = currentItemsCount;

        const isFav = isSongFavorite(song.id);
        const favHeart = isFav ? ' <span style="color: #ef4444; font-size: 0.8rem; margin-left: 4px;">💖</span>' : '';

        item.innerHTML = `
          <div class="autocomplete-item-title">${escapeHTML(song.title)}${favHeart}</div>
          <div class="autocomplete-item-artist">${escapeHTML(song.artist)}</div>
        `;

        // Use mousedown instead of click to prevent focus/blur timing race conditions
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          selectSongFromDropdown(song);
        });

        dropdown.appendChild(item);
      });
      
      dropdown.style.display = 'block';
      return;
    }

    const totalCount = matchesMeta.length + matchesLyrics.length;
    if (totalCount === 0) {
      dropdown.innerHTML = `<div class="autocomplete-no-results">No songs found</div>`;
    } else {
      // 1. Render Metadata Matches Section (Songs and Artists)
      if (matchesMeta.length > 0) {
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'autocomplete-section-header';
        sectionHeader.innerHTML = '🎵 Songs & Artists';
        dropdown.appendChild(sectionHeader);

        matchesMeta.forEach((song) => {
          const item = document.createElement('div');
          item.className = 'autocomplete-item';
          item.dataset.songId = song.id;
          const currentItemsCount = dropdown.querySelectorAll('.autocomplete-item').length;
          item.dataset.index = currentItemsCount;

          const isFav = isSongFavorite(song.id);
          const favHeart = isFav ? ' <span style="color: #ef4444; font-size: 0.8rem; margin-left: 4px;">💖</span>' : '';

          item.innerHTML = `
            <div class="autocomplete-item-title">${escapeHTML(song.title)}${favHeart}</div>
            <div class="autocomplete-item-artist">${escapeHTML(song.artist)}</div>
          `;

          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectSongFromDropdown(song);
          });

          dropdown.appendChild(item);
        });
      }

      // 2. Render Lyrics Matches Section (Quotes of texts)
      if (matchesLyrics.length > 0) {
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'autocomplete-section-header';
        sectionHeader.innerHTML = '📝 Matching lyrics found';
        dropdown.appendChild(sectionHeader);

        matchesLyrics.forEach((song) => {
          const item = document.createElement('div');
          item.className = 'autocomplete-item';
          item.dataset.songId = song.id;
          const currentItemsCount = dropdown.querySelectorAll('.autocomplete-item').length;
          item.dataset.index = currentItemsCount;

          const isFav = isSongFavorite(song.id);
          const favHeart = isFav ? ' <span style="color: #ef4444; font-size: 0.8rem; margin-left: 4px;">💖</span>' : '';

          item.innerHTML = `
            <div class="autocomplete-item-title">${escapeHTML(song.title)}${favHeart}</div>
            <div class="autocomplete-item-artist">${escapeHTML(song.artist)}</div>
            <div class="autocomplete-item-quote" style="font-size: 0.76rem; color: #a78bfa; margin-top: 4px; font-style: italic; border-left: 2px solid #a78bfa; padding-left: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              «...${escapeHTML(song.matchingQuote)}...»
            </div>
          `;

          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectSongFromDropdown(song);
          });

          dropdown.appendChild(item);
        });
      }
    }

    dropdown.style.display = 'block';
  }

  async function performGlobalSearch(query) {
    const finalQuery = convertRuLayoutToEn(query);
    dropdown.innerHTML = `
      <div class="autocomplete-no-results" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 16px;">
        <div class="search-loading-spinner" style="position: static; display: inline-block;"></div>
        <span>Searching worldwide...</span>
      </div>
    `;
    dropdown.style.display = 'block';
    
    try {
      const url = `https://lrclib.net/api/search?q=${encodeURIComponent(finalQuery)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("API error");
      
      const results = await response.json();
      dropdown.innerHTML = '';
      activeDropdownIndex = -1;
      
      if (!results || results.length === 0) {
        dropdown.innerHTML = `<div class="autocomplete-no-results">Nothing found in the worldwide database</div>`;
        return;
      }
      
      results.slice(0, 15).forEach((song, idx) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        const globalId = 'global-' + song.id;
        item.dataset.songId = globalId;
        item.dataset.index = idx;
        
        item.innerHTML = `
          <div class="autocomplete-item-title">${escapeHTML(song.trackName)}</div>
          <div class="autocomplete-item-artist">${escapeHTML(song.artistName)} ${song.albumName ? `(${escapeHTML(song.albumName)})` : ''}</div>
        `;
        
        // Use mousedown instead of click to prevent focus/blur timing race conditions
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (song.plainLyrics || song.syncedLyrics) {
            const rawLyrics = song.plainLyrics || song.syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
            const segmented = segmentLyricsIntoStanzas(rawLyrics);
            
            songsData[globalId] = {
              title: song.trackName,
              artist: song.artistName,
              genre: 'World',
              art: song.artistName.substring(0, 2).toUpperCase(),
              lines: segmented
            };
            
            input.value = '';
            dropdown.style.display = 'none';
            clearBtn.style.display = 'none';
            currentSongKey = globalId;
            closeSidebar();
            renderSong(globalId);
          } else {
            selectSongFromDropdown({
              id: globalId,
              title: song.trackName,
              artist: song.artistName,
              genre: 'World',
              art: song.artistName.substring(0, 2).toUpperCase()
            });
          }
        });
        
        dropdown.appendChild(item);
      });
    } catch (err) {
      console.error("Global search error:", err);
      dropdown.innerHTML = `<div class="autocomplete-no-results" style="color: #ef4444; padding: 12px;">Network error during global search</div>`;
    }
  }

  async function selectSongFromDropdown(song) {
    input.value = '';
    dropdown.style.display = 'none';
    clearBtn.style.display = 'none';
    
    // Hide welcome dashboard card and show active song card wrappers
    const dashboardCard = document.getElementById('welcomeDashboardCard');
    const songHeader = document.getElementById('songHeaderCard');
    const lyricsCard = document.getElementById('lyricsBoardCard');
    if (dashboardCard) dashboardCard.style.display = 'none';
    if (songHeader) songHeader.style.display = 'flex';
    if (lyricsCard) lyricsCard.style.display = 'block';

    currentSongKey = song.id;
    closeSidebar();

    // Save to song metadata cache for persistent dashboard resolving
    try {
      const cache = JSON.parse(localStorage.getItem('song_metadata_cache')) || {};
      cache[song.id] = {
        id: song.id,
        title: song.title,
        artist: song.artist,
        genre: song.genre || 'Pop',
        art: song.art || 'M'
      };
      localStorage.setItem('song_metadata_cache', JSON.stringify(cache));
    } catch (e) {}

    if (songsData[song.id]) {
      renderSong(song.id);
    } else {
      const phraseBuilderEl = document.getElementById('phrase-builder');
      const lyricsCardEl = document.getElementById('lyricsBoardCard');
      if (phraseBuilderEl) phraseBuilderEl.style.display = 'flex';
      if (lyricsCardEl) lyricsCardEl.style.display = 'block';
      showPhraseGameWhileLyricsLoading(song.id);

      lyricsBoard.innerHTML = `
        <div class="shimmer-wrapper" style="padding: 2rem;">
          <div style="text-align: center; margin-bottom: 1.5rem; color: var(--text-sub); font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <div class="search-loading-spinner" style="position: static; display: inline-block;"></div>
            Downloading official lyrics from the database servers...
          </div>
          <p style="text-align: center; font-size: 0.82rem; color: var(--text-muted); margin: 0;">
            While you wait — try the phrase builder above ↑
          </p>
        </div>
      `;

      albumArt.textContent = song.art;
      songBadge.textContent = song.genre;
      songTitle.textContent = song.title;
      artistName.textContent = song.artist;

      try {
        const rawLyrics = await fetchLyrics(song.artist, song.title);
        const segmented = segmentLyricsIntoStanzas(rawLyrics);
        
        if (segmented.length === 0) {
          throw new Error("Lyrics are empty or contain no suitable stanzas.");
        }
        
        songsData[song.id] = {
          title: song.title,
          artist: song.artist,
          genre: song.genre,
          art: song.art,
          lines: segmented
        };
        
        renderSong(song.id);
      } catch (err) {
        console.error(err);
        renderLyricsError(song.title, song.artist, err.message);
      }
    }
  }

  input.addEventListener('input', () => {
    const query = input.value.trim();
    
    if (!query) {
      clearBtn.style.display = 'none';
      dropdown.style.display = 'none';
      return;
    }

    clearBtn.style.display = 'block';
    
    const { matchesMeta, matchesLyrics } = getSearchResults(query);
    renderDropdown(matchesMeta, matchesLyrics, query);
  });

  input.addEventListener('focus', () => {
    const query = input.value.trim();
    if (query) {
      const { matchesMeta, matchesLyrics } = getSearchResults(query);
      renderDropdown(matchesMeta, matchesLyrics, query);
    } else {
      renderDropdown(getSearchList(), [], '');
    }
  });

  input.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.autocomplete-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeDropdownIndex = (activeDropdownIndex + 1) % items.length;
      updateActiveDropdownItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeDropdownIndex = (activeDropdownIndex - 1 + items.length) % items.length;
      updateActiveDropdownItem(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeDropdownIndex >= 0 && activeDropdownIndex < items.length) {
        items[activeDropdownIndex].click();
      }
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
    }
  });

  function updateActiveDropdownItem(items) {
    items.forEach(item => item.classList.remove('active'));
    if (activeDropdownIndex >= 0) {
      const activeItem = items[activeDropdownIndex];
      activeItem.classList.add('active');
      activeItem.scrollIntoView({ block: 'nearest' });
    }
  }

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    dropdown.style.display = 'none';
    input.focus();
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  // Expose autocomplete selection function globally for dashboard and recommendations access
  window.selectSongFromDropdown = selectSongFromDropdown;
}

// Safe entry point for dashboard / favorites (autocomplete may still be loading)
function pickSongFromSearch(song) {
  if (typeof window.selectSongFromDropdown === 'function') {
    return window.selectSongFromDropdown(song);
  }
  console.warn('[App] Search песен ещё загружается — попробуйте снова через секунду.');
}

// Global dashboard and favorites hub functions
window.showDashboard = showDashboard;

function showDashboard() {
  // Hide active song elements
  const songHeader = document.getElementById('songHeaderCard');
  const lyricsCard = document.getElementById('lyricsBoardCard');
  const phraseBuilder = document.getElementById('phrase-builder');
  const audioDictation = document.getElementById('audio-dictation');
  
  if (songHeader) songHeader.style.display = 'none';
  if (lyricsCard) lyricsCard.style.display = 'none';
  if (phraseBuilder) phraseBuilder.style.display = 'none';
  if (audioDictation) audioDictation.style.display = 'none';

  // Clear current active selections
  const rows = document.querySelectorAll('.lyrics-row-wrapper');
  rows.forEach(r => r.classList.remove('active'));
  closeSidebar();

  // Show welcome dashboard card
  const dashboardCard = document.getElementById('welcomeDashboardCard');
  if (dashboardCard) {
    dashboardCard.style.display = 'flex';
  }

  // Update Stats counts
  const dashWordsCount = document.getElementById('dashWordsCount');
  if (dashWordsCount) {
    dashWordsCount.textContent = personalDictionary ? personalDictionary.length : 0;
  }

  // Render Dashboard Favorites list
  renderDashboardFavorites();
}

function renderDashboardFavorites() {
  const container = document.getElementById('dashFavoritesContainer');
  if (!container) return;

  container.innerHTML = '';
  
  if (!favoriteSongs || favoriteSongs.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 1.5rem 0; color: var(--text-muted); font-size: 0.85rem; font-style: italic;">
        You don't have any favorite songs yet. Add a song to favorites by clicking the heart ❤️ in the player header!
      </div>
    `;
    return;
  }

  favoriteSongs.forEach(songId => {
    // Resolve song meta using our robust multi-source resolver
    let song = resolveSongById(songId);
    if (!song) return;

    const row = document.createElement('div');
    row.className = 'dash-song-recommendation';
    row.style.cssText = 'display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; cursor: pointer; transition: all 0.2s;';
    
    row.innerHTML = `
      <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.15); color: #ef4444; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem;">❤️</div>
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${song.title}</div>
        <div style="font-size: 0.75rem; color: var(--text-sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${song.artist}</div>
      </div>
    `;

    row.addEventListener('click', () => {
      pickSongFromSearch(song);
    });

    container.appendChild(row);
  });
}

// Render high-end premium Welcome Hub instead of default song
function renderWelcomeHub() {
  const songHeaderCard = document.getElementById('songHeaderCard');
  if (songHeaderCard) {
    songHeaderCard.style.display = 'none';
  }
  
  lyricsBoard.innerHTML = `
    <div class="welcome-hub" style="text-align: center; padding: 4rem 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2rem; max-width: 650px; margin: 0 auto; min-height: 50vh; animation: fadeIn 0.8s ease-out;">
      <div style="background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 2.8rem; font-weight: 800; line-height: 1.2; letter-spacing: -1px; text-shadow: var(--accent-glow);">
        Learn English with your favorite songs 🎵
      </div>
      
      <p style="font-size: 1.1rem; color: var(--text-sub); line-height: 1.6; max-width: 480px; margin: 0;">
        Interactive English trainer. Stanza translations, grammar breakdowns, and contextual word definitions — all while reading lyrics.
      </p>

      <!-- Big Interactive Glow Input Trigger -->
      <div style="width: 100%; max-width: 440px; position: relative;" onclick="document.getElementById('songSearchInput').focus()">
        <div style="background: var(--bg-card); border: 2px solid var(--border-glass); padding: 16px 20px; border-radius: 30px; display: flex; align-items: center; gap: 12px; cursor: text; box-shadow: 0 8px 32px rgba(0,0,0,0.2); transition: all 0.3s; text-align: left;" onmouseover="this.style.borderColor='var(--accent-spotify)'; this.style.boxShadow='var(--accent-glow)';" onmouseout="this.style.borderColor='var(--border-glass)'; this.style.boxShadow='none';">
          <span style="font-size: 1.3rem;">🔍</span>
          <span style="color: var(--text-sub); font-size: 1rem;">Type a song name or artist...</span>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%; max-width: 440px; margin-top: 1rem;">
        <div style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--text-sub); margin-bottom: 0.2rem;">Popular Breakdowns:</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
          <button onclick="window.selectRecommended('scorpions')" class="recommended-btn" style="background: var(--bg-card); border: 1px solid var(--border-glass); border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; text-align: left; transition: all 0.3s; outline: none;" onmouseover="this.style.borderColor='var(--accent-spotify)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-glass)'; this.style.transform='translateY(0)';">
            <div style="width: 32px; height: 32px; background: rgba(29, 185, 84, 0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--accent-spotify); font-size: 0.85rem;">SC</div>
            <div>
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">Wind of Change</div>
              <div style="font-size: 0.75rem; color: var(--text-sub);">Scorpions</div>
            </div>
          </button>
          
          <button onclick="window.selectRecommended('deftones')" class="recommended-btn" style="background: var(--bg-card); border: 1px solid var(--border-glass); border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; text-align: left; transition: all 0.3s; outline: none;" onmouseover="this.style.borderColor='var(--accent-spotify)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-glass)'; this.style.transform='translateY(0)';">
            <div style="width: 32px; height: 32px; background: rgba(29, 185, 84, 0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--accent-spotify); font-size: 0.85rem;">DE</div>
            <div>
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">Change</div>
              <div style="font-size: 0.75rem; color: var(--text-sub);">Deftones</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Recommended song trigger
window.selectRecommended = (songId) => {
  const song = songsData[songId];
  if (song) {
    const searchInput = document.getElementById('songSearchInput');
    if (searchInput) {
      searchInput.value = `${song.artist} — ${song.title}`;
      const clearBtn = document.getElementById('searchClearBtn');
      if (clearBtn) clearBtn.style.display = 'block';
    }
    currentSongKey = songId;
    renderSong(songId);
  }
};

// Initialize the app and restore theme settings
document.addEventListener('DOMContentLoaded', () => {
  initAnalysisCache(); // Load all persistent localStorage entries into analysisCache
  initDictionary(); // Load the premium personal vocabulary dictionary and trainers
  initVideoCourse(); // Initialize the video course lesson tracker
  initNotebook(); // Initialize the global notebook and per-lesson notes
  initGrammarRules(); // Initialize personal grammar rules handbook
  setupRulesUI(); // Setup event listeners and logic for rules handbook
  
  const searchInput = document.getElementById('songSearchInput');
  if (searchInput) {
    searchInput.value = "";
  }

  showDashboard();
  setupEventListeners();
  restoreSavedTheme();
  // Asynchronously download and parse the playlist database using robust dual-path fetch
  async function loadCSVWithFallbacks() {
    // Priority Option: CORS-free local script bundle (ideal for double-clicking index.html directly)
    if (window.PLAYLIST_CSV_DATA) {
      console.log("[CSV Loader] Successfully loaded database via CORS-free local script variable!");
      loadCSVSongs(window.PLAYLIST_CSV_DATA);
      initAutocomplete();
      renderDashboardFavorites();
      return;
    }

    console.log("[CSV Loader] Local script bundle not present. Falling back to HTTP fetch...");
    let text = null;
    let lastError = null;

    // Path Option 1: Direct Unicode Russian filename
    try {
      const response = await fetch('Баня.csv?cb=' + Date.now());
      if (response.ok) {
        text = await response.text();
        console.log("[CSV Loader] Successfully fetched Баня.csv via unicode path.");
      } else {
        console.warn(`[CSV Loader] Fetching Баня.csv via unicode path returned status: ${response.status}`);
      }
    } catch (err) {
      lastError = err;
      console.warn("[CSV Loader] Unicode path fetch failed:", err);
    }

    // Path Option 2: URL Encoded filename fallback
    if (!text) {
      try {
        const response = await fetch('%D0%91%D0%B0%D0%BD%D1%8F.csv?cb=' + Date.now());
        if (response.ok) {
          text = await response.text();
          console.log("[CSV Loader] Successfully fetched Баня.csv via URL encoded path (%D0%91%D0%B0%D0%BD%D1%8F.csv).");
        } else {
          console.warn(`[CSV Loader] Fetching Баня.csv via URL encoded path returned status: ${response.status}`);
        }
      } catch (err) {
        lastError = err;
        console.warn("[CSV Loader] URL encoded path fetch failed:", err);
      }
    }

    if (text) {
      loadCSVSongs(text);
      initAutocomplete();
      renderDashboardFavorites();
    } else {
      console.error("[CSV Loader] All paths to load Баня.csv failed. Last error:", lastError);
      initAutocomplete();
      renderDashboardFavorites();
    }
  }

  loadCSVWithFallbacks();
});

// Highlight words/phrases matching personalDictionary items in lyrics
function highlightWordsFromDictionary(text) {
  if (!text) return "";
  if (!personalDictionary || personalDictionary.length === 0) {
    return escapeHtml(text);
  }

  // Sort dictionary items by length of the target word/phrase in descending order
  // to prioritize matching longer phrases first and avoid partial substring overlap bugs
  const sortedDict = [...personalDictionary]
    .filter(item => item && item.word && item.word.trim().length > 0)
    .sort((a, b) => b.word.trim().length - a.word.trim().length);

  if (sortedDict.length === 0) {
    return escapeHtml(text);
  }

  const wordMap = {};
  const regexPatterns = [];

  // Helper to escape regex special characters
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  sortedDict.forEach(item => {
    const cleanWord = item.word.trim();
    const lowerWord = cleanWord.toLowerCase();
    if (!wordMap[lowerWord]) {
      wordMap[lowerWord] = item;
      regexPatterns.push(escapeRegex(cleanWord));
    }
  });

  if (regexPatterns.length === 0) {
    return escapeHtml(text);
  }

  // Compile words/phrases into case-insensitive regex pattern with word boundaries
  const patternString = `\\b(${regexPatterns.join('|')})\\b`;
  const regex = new RegExp(patternString, 'gi');

  const safeText = escapeHtml(text);

  return safeText.replace(regex, (matched) => {
    const item = wordMap[matched.toLowerCase()];
    if (!item) return matched;
    const safeMatched = escapeHtml(matched);
    return `<span class="dict-highlighted-word" onclick="window.showWordCard(event, '${safeMatched}')">${matched}</span>`;
  });
}

// Render dynamic lyrics to viewport
function renderSong(songKey) {
  const song = songsData[songKey];
  if (!song) return;

  const isSameSong = (songKey === lastRenderedSongKey);
  lastRenderedSongKey = songKey;

  const songHeaderCard = document.getElementById('songHeaderCard');
  if (songHeaderCard) {
    songHeaderCard.style.display = 'flex';
  }

  // Render header values
  albumArt.textContent = song.art;
  songBadge.textContent = song.genre;
  songTitle.textContent = song.title;
  songTitle.title = "Click to translate the title and discover the song's meaning with AI!";
  songTitle.onclick = () => triggerSongMeaningAnalysis(songKey);
  artistName.textContent = song.artist;

  // Update favorite toggle button status in header
  const favoriteToggleBtn = document.getElementById('favoriteToggleBtn');
  if (favoriteToggleBtn) {
    if (isSongFavorite(songKey)) {
      favoriteToggleBtn.classList.add('active');
      favoriteToggleBtn.title = 'Remove from favorites';
    } else {
      favoriteToggleBtn.classList.remove('active');
      favoriteToggleBtn.title = 'Add to favorites';
    }
  }

  // Save active line index before clearing to prevent losing selection
  const activeRow = lyricsBoard.querySelector('.lyrics-row-wrapper.active');
  const activeIndex = activeRow ? parseInt(activeRow.dataset.index) : null;

  // Clear existing lyrics
  lyricsBoard.innerHTML = '';

  // Inject premium empty state placeholder into the sidebar
  const sidebarContent = sidebarPanel.querySelector('.sidebar-content');
  if (sidebarContent && (!isSameSong || activeIndex === null)) {
    sidebarContent.innerHTML = `
      <div class="analysis-card" style="text-align: center; padding: 3rem 2rem; background: transparent; border: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem;">
        <div style="font-size: 3rem; animation: pulse 2s infinite ease-in-out;">✨</div>
        <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-main);">AI Stanza Breakdown</div>
        <p style="font-size: 0.85rem; color: var(--text-sub); line-height: 1.5; margin: 0; max-width: 280px;">
          Click on any line of the lyrics to get an instant grammar and vocabulary breakdown powered by AI.
        </p>
      </div>
    `;
  }

  // Render line list
  song.lines.forEach((line, index) => {
    const formattedNum = String(index + 1).padStart(2, '0');
    
    // Create rows with modular DOM elements
    const rowWrapper = document.createElement('div');
    rowWrapper.className = 'lyrics-row-wrapper';
    if (activeIndex !== null && index === activeIndex) {
      rowWrapper.classList.add('active');
    }
    rowWrapper.dataset.lineId = line.id;
    rowWrapper.dataset.index = index;

    rowWrapper.innerHTML = `
      <div class="lyric-line">
        <span class="line-number">${formattedNum}</span>
        <span class="line-text">${highlightWordsFromDictionary(line.text)}</span>
      </div>
    `;

    lyricsBoard.appendChild(rowWrapper);
  });

  // Re-bind actions on newly rendered items
  bindLyricClicks();

  // Initialize background pre-fetching UI and queue
  updatePrefetchUI(songKey);
  const toggleBtn = document.getElementById('togglePrefetchBtn');
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      prefetchPaused = !prefetchPaused;
      if (prefetchPaused) {
        clearPrefetchQueue();
      } else {
        startPrefetchingQueue(songKey);
      }
      updatePrefetchUI(songKey);
    };
  }
  
  if (!prefetchPaused) {
    startPrefetchingQueue(songKey);
  }

  // Initialize a random phrase builder game for the entire selected song on the main panel
  generateRandomPhraseGame(songKey);
}

// Bind click event handlers to all lyric lines
function bindLyricClicks() {
  const rows = document.querySelectorAll('.lyrics-row-wrapper');
  
  rows.forEach(row => {
    row.addEventListener('click', () => {
      // Remove active class from all rows
      rows.forEach(r => r.classList.remove('active'));
      
      // Add active state to clicked row
      row.classList.add('active');
      
      // Get data index and update sidebar
      const index = row.dataset.index;
      const activeLine = songsData[currentSongKey].lines[index];
      
      triggerSidebarAnalysis(activeLine);
    });
  });
}

/* ==========================================================================
   4. Speech Synthesis & Auxiliary Functions
// @AI-SECTION: SPEECH_SYNTHESIS
   ========================================================================== */

function speakText(text) {
  if ('speechSynthesis' in window) {
    // Cancel any active speech speech synthesis
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    
    // Choose appropriate premium English speaking voice if available
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Natural') || 
      voice.name.includes('Samantha')
    );
    
    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }
    
    utterance.rate = 0.85; // Slightly slower for language learners
    window.speechSynthesis.speak(utterance);

    // Dynamic scale feedback on speak button during audio trigger
    const speakBtn = document.getElementById('speakBtn');
    if (speakBtn) {
      speakBtn.style.transform = 'scale(1.3)';
      setTimeout(() => speakBtn.style.transform = 'scale(1)', 400);
    }
  } else {
    alert("Unfortunately, your browser does not support speech synthesis.");
  }
}

/* ==========================================================================
   5. Event Listeners & Theme Optimizations
// @AI-SECTION: EVENT_LISTENERS_THEMES
   ========================================================================== */

function setupEventListeners() {
  
  // Logo brand click -> go to Dashboard welcome hub
  const logoBrand = document.getElementById('navBrandLogo');
  if (logoBrand) {
    logoBrand.addEventListener('click', () => {
      showDashboard();
    });
  }

  // Dashboard Dictionary card trigger
  const dashGoDict = document.getElementById('dashGoDict');
  if (dashGoDict) {
    dashGoDict.addEventListener('click', () => {
      if (window.openDictionaryModal) {
        window.openDictionaryModal();
      }
    });
  }

  // Dashboard Training card trigger
  const dashGoTrain = document.getElementById('dashGoTrain');
  if (dashGoTrain) {
    dashGoTrain.addEventListener('click', () => {
      if (window.openTrainingModal) {
        window.openTrainingModal();
      }
    });
  }

  // Dashboard Quick-start recommendations
  const dashStartScorpions = document.getElementById('dashStartScorpions');
  if (dashStartScorpions) {
    dashStartScorpions.addEventListener('click', () => {
      pickSongFromSearch({id: 'scorpions', title: 'Wind of Change', artist: 'Scorpions', genre: 'Classic Rock', art: 'SC'});
    });
  }

  const dashStartMetallica = document.getElementById('dashStartMetallica');
  if (dashStartMetallica) {
    dashStartMetallica.addEventListener('click', () => {
      pickSongFromSearch({id: 'metallica', title: 'Nothing Else Matters', artist: 'Metallica', genre: 'Heavy Metal', art: 'ME'});
    });
  }

  const dashStartRHCP = document.getElementById('dashStartRHCP');
  if (dashStartRHCP) {
    dashStartRHCP.addEventListener('click', () => {
      pickSongFromSearch({id: 'rhcp', title: 'Californication', artist: 'Red Hot Chili Peppers', genre: 'Alternative Rock', art: 'RH'});
    });
  }

  // Audio Dictation button handlers
  const dictListenBtn = document.getElementById('dictationListenBtn');
  if (dictListenBtn) {
    dictListenBtn.addEventListener('click', () => {
      playHiddenPhrase(activeDictationOriginal);
    });
  }

  const dictHintBtn = document.getElementById('dictationHintBtn');
  if (dictHintBtn) {
    dictHintBtn.addEventListener('click', () => {
      dictHintBtn.textContent = `💡 ${activeDictationTranslation}`;
      dictHintBtn.disabled = true;
    });
  }

  const dictNewBtn = document.getElementById('dictationNewBtn');
  if (dictNewBtn) {
    dictNewBtn.addEventListener('click', () => {
      generateRandomPhraseGame(currentSongKey);
    });
  }

  const dictInput = document.getElementById('dictationInput');
  const dictCheckBtn = document.getElementById('dictationCheckBtn');
  if (dictInput && dictCheckBtn) {
    dictInput.addEventListener('input', () => {
      const isNotEmpty = dictInput.value.trim().length > 0;
      dictCheckBtn.disabled = !isNotEmpty;
      dictCheckBtn.style.opacity = isNotEmpty ? '1' : '0.5';
    });
  }

  if (dictCheckBtn) {
    dictCheckBtn.addEventListener('click', () => {
      const feedbackEl = document.getElementById('dictationFeedback');
      if (!feedbackEl || !dictInput) return;
      
      const userVal = normalizeTextForComparison(dictInput.value);
      const correctVal = normalizeTextForComparison(activeDictationOriginal);
      
      if (userVal === correctVal) {
        recordActivity();
        feedbackEl.style.display = 'block';
        feedbackEl.style.background = 'rgba(16, 185, 129, 0.15)';
        feedbackEl.style.border = '1px solid rgba(16, 185, 129, 0.3)';
        feedbackEl.style.color = '#10b981';
        feedbackEl.innerHTML = `🎉 Excellent! You heard and wrote the phrase perfectly! It's been added to your activity score.`;
      } else {
        feedbackEl.style.display = 'block';
        feedbackEl.style.background = 'rgba(239, 68, 68, 0.15)';
        feedbackEl.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        feedbackEl.style.color = '#ef4444';
        feedbackEl.innerHTML = `❌ Unfortunately, there are some mistakes. Try again!<br><span style="display:inline-block; margin-top:0.4rem; font-size:0.9rem; opacity:0.85; color:var(--text-main);">Correct answer: <strong style="color:var(--accent-spotify);">${activeDictationOriginal}</strong></span>`;
      }
    });
  }

  // Phrase Builder refresh button handler
  const newPhraseBtn = document.getElementById('newPhraseBtn');
  if (newPhraseBtn) {
    newPhraseBtn.addEventListener('click', () => {
      generateRandomPhraseGame(currentSongKey);
    });
  }

  // Favorite Toggle Button Event Listener
  const favoriteToggleBtn = document.getElementById('favoriteToggleBtn');
  if (favoriteToggleBtn) {
    favoriteToggleBtn.addEventListener('click', () => {
      toggleSongFavorite(currentSongKey);
      
      if (isSongFavorite(currentSongKey)) {
        favoriteToggleBtn.classList.add('active');
        favoriteToggleBtn.title = 'Remove from favorites';
      } else {
        favoriteToggleBtn.classList.remove('active');
        favoriteToggleBtn.title = 'Add to favorites';
      }

      // Auto-cache song metadata on favorite toggle for reliable dashboard rendering
      try {
        let songMeta = songsData[currentSongKey];
        if (!songMeta && csvSongs) {
          songMeta = csvSongs.find(s => s.id === currentSongKey);
        }
        if (!songMeta) {
          const title = document.getElementById('songTitle')?.textContent || '';
          const artist = document.getElementById('artistName')?.textContent || '';
          const genre = document.getElementById('songBadge')?.textContent || 'Pop';
          const art = document.getElementById('albumArt')?.textContent || 'M';
          if (title && artist) {
            songMeta = { id: currentSongKey, title, artist, genre, art };
          }
        }
        if (songMeta) {
          const cache = JSON.parse(localStorage.getItem('song_metadata_cache')) || {};
          cache[currentSongKey] = {
            id: currentSongKey,
            title: songMeta.title,
            artist: songMeta.artist,
            genre: songMeta.genre || 'Pop',
            art: songMeta.art || 'M'
          };
          localStorage.setItem('song_metadata_cache', JSON.stringify(cache));
        }
      } catch (e) {}

      // Keep dashboard in sync
      renderDashboardFavorites();
    });
  }

  // Close sidebar buttons
  closeBtn.addEventListener('click', closeSidebar);
  scrimOverlay.addEventListener('click', closeSidebar);

  // Hierarchical Esc key closure for all modals and drawers
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // 1. Settings Modal
      const settingsModal = document.getElementById('settingsModal');
      if (settingsModal && settingsModal.style.display !== 'none' && settingsModal.style.display !== '') {
        closeModalEl(settingsModal);
        return;
      }

      // 2. Add Word Modal (usually on top of Dictionary Modal)
      const addWordModal = document.getElementById('addWordModal');
      if (addWordModal && addWordModal.style.display !== 'none' && addWordModal.style.display !== '') {
        const closeBtn = document.getElementById('closeAddWordBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 2b. Add Phrase Modal (usually on top of Dictionary Modal)
      const addPhraseModal = document.getElementById('addPhraseModal');
      if (addPhraseModal && addPhraseModal.style.display !== 'none' && addPhraseModal.style.display !== '') {
        const closeBtn = document.getElementById('closeAddPhraseBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 3. Training Modal (usually on top of Dictionary Modal)
      const trainingModal = document.getElementById('trainingModal');
      if (trainingModal && trainingModal.style.display !== 'none' && trainingModal.style.display !== '') {
        const closeBtn = document.getElementById('closeTrainingModalBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 4. Roleplay Modal
      const roleplayModal = document.getElementById('roleplayModal');
      if (roleplayModal && roleplayModal.style.display !== 'none' && roleplayModal.style.display !== '') {
        const closeBtn = document.getElementById('closeRoleplayModalBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 5. Dictionary Modal
      const dictionaryModal = document.getElementById('dictionaryModal');
      if (dictionaryModal && dictionaryModal.style.display !== 'none' && dictionaryModal.style.display !== '') {
        const closeBtn = document.getElementById('closeDictionaryBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 6. Edit Lyrics Modal
      const editLyricsModal = document.getElementById('editLyricsModal');
      if (editLyricsModal && editLyricsModal.style.display !== 'none' && editLyricsModal.style.display !== '') {
        const closeBtn = document.getElementById('closeEditLyricsBtn') || document.getElementById('cancelEditLyricsBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 7. Artist Songs Modal
      const artistSongsModal = document.getElementById('artistSongsModal');
      if (artistSongsModal && artistSongsModal.style.display !== 'none' && artistSongsModal.style.display !== '') {
        const closeBtn = document.getElementById('closeArtistSongsModalBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 8. Video Course Modal
      const videoCourseModal = document.getElementById('videoCourseModal');
      if (videoCourseModal && videoCourseModal.style.display !== 'none' && videoCourseModal.style.display !== '') {
        const closeBtn = document.getElementById('closeVideoCourseModalBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 8b. Rules Modal
      const rulesModal = document.getElementById('rulesModal');
      if (rulesModal && rulesModal.style.display !== 'none' && rulesModal.style.display !== '') {
        const closeBtn = document.getElementById('closeRulesBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 9. Notebook Drawer
      const notebookModal = document.getElementById('notebookModal');
      if (notebookModal && notebookModal.classList.contains('is-open')) {
        const closeBtn = document.getElementById('closeNotebookBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 10. Sidebar Panel (Right details sidebar)
      if (typeof closeSidebar === 'function') {
        const sidebarPanel = document.getElementById('sidebarPanel');
        if (sidebarPanel && sidebarPanel.classList.contains('open')) {
          closeSidebar();
          return;
        }
      }
    }
  });

  // Low performance switch to disable backdrop-filter blur for GPU boost
  const perfToggle = document.getElementById('performanceToggle');
  if (perfToggle) {
    perfToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.classList.add('no-blur-mode');
      } else {
        document.body.classList.remove('no-blur-mode');
      }
    });
  }

  // Three-Theme Switcher logic (Dark -> Light -> Gray -> Dark) with localStorage persistence
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      if (document.body.classList.contains('light-theme')) {
        // Light -> Gray
        document.body.classList.remove('light-theme');
        document.body.classList.add('gray-theme');
        localStorage.setItem('theme', 'gray');
        updateThemeIcons('gray');
      } else if (document.body.classList.contains('gray-theme')) {
        // Gray -> Dark
        document.body.classList.remove('gray-theme');
        localStorage.setItem('theme', 'dark');
        updateThemeIcons('dark');
      } else {
        // Dark -> Light
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
        updateThemeIcons('light');
      }
    });
  }

  // Initialize the custom interactive AI chat panel
  initCustomChat();

  // API Settings Modal Event Listeners
  const apiSettingsBtn = document.getElementById('apiSettingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const resetApiKeyBtn = document.getElementById('resetApiKeyBtn');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const apiStatusMessage = document.getElementById('apiStatusMessage');

  // Application Settings & Hotkeys Manager
  let tempNotebookHotkey = null;
  let isRecordingHotkey = false;

  const hotkeyRecorder = document.getElementById('notebookHotkeyRecorder');
  const hotkeyClear = document.getElementById('notebookHotkeyClear');
  const mouseTriggerSelect = document.getElementById('notebookMouseTriggerSelect');

  // Initialize UI state on page startup
  try {
    const savedHk = localStorage.getItem('galaxy_notebook_hotkey');
    if (savedHk) {
      const hk = JSON.parse(savedHk);
      tempNotebookHotkey = hk;
      if (hotkeyRecorder) hotkeyRecorder.textContent = hk.display;
    } else {
      if (hotkeyRecorder) hotkeyRecorder.textContent = 'Не назначено';
    }
    const savedMouse = localStorage.getItem('galaxy_notebook_mouse_trigger') || 'none';
    if (mouseTriggerSelect) mouseTriggerSelect.value = savedMouse;

    const savedCapitalize = localStorage.getItem('galaxy_dictionary_capitalize') !== 'false';
    const dictionaryCapitalizeToggle = document.getElementById('dictionaryCapitalizeToggle');
    if (dictionaryCapitalizeToggle) dictionaryCapitalizeToggle.checked = savedCapitalize;

    const savedLineNumbers = localStorage.getItem('galaxy_notebook_line_numbers') !== 'false';
    const notebookLineNumbersToggle = document.getElementById('notebookLineNumbersToggle');
    if (notebookLineNumbersToggle) {
      notebookLineNumbersToggle.checked = savedLineNumbers;
      if (savedLineNumbers) {
        document.body.classList.remove('no-notebook-line-numbers');
      } else {
        document.body.classList.add('no-notebook-line-numbers');
      }
    }

    const savedSpotifyAutoPause = localStorage.getItem('galaxy_spotify_auto_pause') !== 'false';
    const spotifyAutoPauseToggle = document.getElementById('spotifyAutoPauseToggle');
    if (spotifyAutoPauseToggle) spotifyAutoPauseToggle.checked = savedSpotifyAutoPause;

    const savedSpotifyNowPlaying = localStorage.getItem('galaxy_spotify_now_playing') !== 'false';
    const spotifyNowPlayingToggle = document.getElementById('spotifyNowPlayingToggle');
    if (spotifyNowPlayingToggle) spotifyNowPlayingToggle.checked = savedSpotifyNowPlaying;

    const savedGPU = localStorage.getItem('galaxy_gpu_saving') === 'true';
    const performanceToggle = document.getElementById('performanceToggle');
    if (performanceToggle) {
      performanceToggle.checked = savedGPU;
      if (savedGPU) {
        document.body.classList.add('no-blur-mode');
      } else {
        document.body.classList.remove('no-blur-mode');
      }
    }
  } catch (e) {
    if (hotkeyRecorder) hotkeyRecorder.textContent = 'Не назначено';
  }

  // Recorder button listener
  if (hotkeyRecorder) {
    hotkeyRecorder.addEventListener('click', (e) => {
      e.preventDefault();
      isRecordingHotkey = true;
      window._isRecordingNotebookHotkey = true;
      hotkeyRecorder.textContent = '🔑 Нажмите клавишу... (Esc для отмены)';
      hotkeyRecorder.style.borderColor = '#fbbf24';
      hotkeyRecorder.style.background = 'rgba(251, 191, 36, 0.08)';
    });

    // Capture the keypress for hotkey recording
    window.addEventListener('keydown', (e) => {
      if (!isRecordingHotkey) return;

      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        isRecordingHotkey = false;
        window._isRecordingNotebookHotkey = false;
        hotkeyRecorder.style.borderColor = '';
        hotkeyRecorder.style.background = '';
        if (tempNotebookHotkey && tempNotebookHotkey.display) {
          hotkeyRecorder.textContent = tempNotebookHotkey.display;
        } else {
          hotkeyRecorder.textContent = 'Не назначено';
        }
        return;
      }

      // We ignore lonely modifiers during recording, wait until a full key is pressed
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const parts = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      
      let keyName = e.key;
      if (e.code.startsWith('Key')) {
        keyName = e.code.replace('Key', '');
      } else if (e.code.startsWith('Digit')) {
        keyName = e.code.replace('Digit', '');
      } else if (e.code.startsWith('Numpad')) {
        keyName = e.code.replace('Numpad', 'Num ');
      }
      
      parts.push(keyName.toUpperCase());

      const display = parts.join(' + ');
      tempNotebookHotkey = {
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        code: e.code,
        key: e.key,
        display: display
      };

      hotkeyRecorder.textContent = display;
      hotkeyRecorder.style.borderColor = '';
      hotkeyRecorder.style.background = '';
      isRecordingHotkey = false;
      window._isRecordingNotebookHotkey = false;
    }, true);
  }

  // Clear button listener
  if (hotkeyClear) {
    hotkeyClear.addEventListener('click', (e) => {
      e.preventDefault();
      tempNotebookHotkey = null;
      if (hotkeyRecorder) hotkeyRecorder.textContent = 'Не назначено';
    });
  }

  // Global keyboard shortcut to open/close Notebook
  window.addEventListener('keydown', (e) => {
    if (window._isRecordingNotebookHotkey) return; // ignore when recording a new hotkey

    try {
      const saved = localStorage.getItem('galaxy_notebook_hotkey');
      if (!saved) return;
      const hotkey = JSON.parse(saved);
      if (!hotkey || !hotkey.code) return;

      if (
        e.ctrlKey === !!hotkey.ctrl &&
        e.altKey === !!hotkey.alt &&
        e.shiftKey === !!hotkey.shift &&
        e.code === hotkey.code
      ) {
        const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
        const isInsideNotebook = e.target.closest('#notebookModal') !== null;
        // If they are actively typing and the shortcut does not require any modifier, ignore it
        // EXCEPT when the focus is inside the notebook itself (so they can toggle it closed).
        if (isTyping && !hotkey.ctrl && !hotkey.alt && !hotkey.shift && !isInsideNotebook) return;

        e.preventDefault();
        e.stopPropagation();
        if (typeof window.toggleNotebook === 'function') {
          window.toggleNotebook();
        }
      }
    } catch (err) {}
  }, true);

  // Global mouse triggers to open/close Notebook
  window.addEventListener('auxclick', (e) => {
    // Middle click is button 1
    if (e.button !== 1) return;

    try {
      const trigger = localStorage.getItem('galaxy_notebook_mouse_trigger') || 'none';
      if (trigger !== 'middle') return;

      const isInteractive = e.target.closest('input, textarea, button, a, select, [role="button"]');
      if (isInteractive) return;

      e.preventDefault();
      e.stopPropagation();
      if (typeof window.toggleNotebook === 'function') {
        window.toggleNotebook();
      }
    } catch (err) {}
  });

  window.addEventListener('dblclick', (e) => {
    try {
      const trigger = localStorage.getItem('galaxy_notebook_mouse_trigger') || 'none';
      if (trigger !== 'dblclick') return;

      const isInteractive = e.target.closest('input, textarea, button, a, select, [role="button"]');
      if (isInteractive) return;

      e.preventDefault();
      e.stopPropagation();
      if (typeof window.toggleNotebook === 'function') {
        window.toggleNotebook();
      }
    } catch (err) {}
  });

  if (apiSettingsBtn && settingsModal && closeSettingsBtn) {
    // Open modal
    apiSettingsBtn.addEventListener('click', () => {
      // Pre-fill with user's saved key if exists
      const savedKey = localStorage.getItem('user_api_key') || '';
      apiKeyInput.value = savedKey;

      // Load settings inside the recorder and select fields
      try {
        const savedHk = localStorage.getItem('galaxy_notebook_hotkey');
        if (savedHk) {
          const hk = JSON.parse(savedHk);
          tempNotebookHotkey = hk;
          if (hotkeyRecorder) hotkeyRecorder.textContent = hk.display;
        } else {
          tempNotebookHotkey = null;
          if (hotkeyRecorder) hotkeyRecorder.textContent = 'Не назначено';
        }
        const savedMouse = localStorage.getItem('galaxy_notebook_mouse_trigger') || 'none';
        if (mouseTriggerSelect) mouseTriggerSelect.value = savedMouse;
      } catch (e) {
        tempNotebookHotkey = null;
        if (hotkeyRecorder) hotkeyRecorder.textContent = 'Не назначено';
      }
      
      // Clear status
      apiStatusMessage.style.display = 'none';
      apiStatusMessage.className = 'modal-status';
      
      openModalEl(settingsModal);
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
    });

    // Close modal
    const closeModal = () => {
      closeModalEl(settingsModal);
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    };
    closeSettingsBtn.addEventListener('click', closeModal);
    
    // Save settings
    saveApiKeyBtn.addEventListener('click', () => {
      const keyVal = apiKeyInput.value.trim();
      if (keyVal) {
        localStorage.setItem('user_api_key', keyVal);
      } else {
        localStorage.removeItem('user_api_key');
      }

      // Save Hotkey
      if (tempNotebookHotkey) {
        localStorage.setItem('galaxy_notebook_hotkey', JSON.stringify(tempNotebookHotkey));
      } else {
        localStorage.removeItem('galaxy_notebook_hotkey');
      }

      // Save Mouse Trigger
      if (mouseTriggerSelect) {
        localStorage.setItem('galaxy_notebook_mouse_trigger', mouseTriggerSelect.value);
      }

      // Save Dictionary Capitalize setting
      const dictionaryCapitalizeToggle = document.getElementById('dictionaryCapitalizeToggle');
      if (dictionaryCapitalizeToggle) {
        localStorage.setItem('galaxy_dictionary_capitalize', dictionaryCapitalizeToggle.checked ? 'true' : 'false');
      }

      // Save Notebook Line Numbers setting
      const notebookLineNumbersToggle = document.getElementById('notebookLineNumbersToggle');
      if (notebookLineNumbersToggle) {
        const isChecked = notebookLineNumbersToggle.checked;
        localStorage.setItem('galaxy_notebook_line_numbers', isChecked ? 'true' : 'false');
        if (isChecked) {
          document.body.classList.remove('no-notebook-line-numbers');
        } else {
          document.body.classList.add('no-notebook-line-numbers');
        }
      }

      // Save Spotify Auto-Pause setting
      const spotifyAutoPauseToggle = document.getElementById('spotifyAutoPauseToggle');
      if (spotifyAutoPauseToggle) {
        localStorage.setItem('galaxy_spotify_auto_pause', spotifyAutoPauseToggle.checked ? 'true' : 'false');
      }

      // Save Spotify Now Playing setting
      const spotifyNowPlayingToggle = document.getElementById('spotifyNowPlayingToggle');
      if (spotifyNowPlayingToggle) {
        localStorage.setItem('galaxy_spotify_now_playing', spotifyNowPlayingToggle.checked ? 'true' : 'false');
        // Immediately start or stop polling
        if (typeof SpotifyController !== 'undefined') {
          if (spotifyNowPlayingToggle.checked) {
            SpotifyController.startNowPlayingPolling();
          } else {
            SpotifyController.stopNowPlayingPolling();
          }
        }
      }

      // Save GPU setting
      const performanceToggle = document.getElementById('performanceToggle');
      if (performanceToggle) {
        localStorage.setItem('galaxy_gpu_saving', performanceToggle.checked ? 'true' : 'false');
      }
      const speedTog = document.getElementById('videoAutoAccelerateToggle');
      if (speedTog) localStorage.setItem('galaxy_video_2x', speedTog.checked ? 'true' : 'false');
      
      apiStatusMessage.textContent = 'Settings успешно сохранены!';
      apiStatusMessage.style.display = 'block';
      apiStatusMessage.className = 'modal-status success';
      
      setTimeout(closeModal, 1200);
    });

    // Reset settings
    resetApiKeyBtn.addEventListener('click', () => {
      localStorage.removeItem('user_api_key');
      localStorage.removeItem('galaxy_notebook_hotkey');
      localStorage.removeItem('galaxy_notebook_mouse_trigger');

      apiKeyInput.value = '';
      tempNotebookHotkey = null;
      if (hotkeyRecorder) hotkeyRecorder.textContent = 'Не назначено';
      if (mouseTriggerSelect) mouseTriggerSelect.value = 'none';

      localStorage.removeItem('galaxy_dictionary_capitalize');
      const dictionaryCapitalizeToggle = document.getElementById('dictionaryCapitalizeToggle');
      if (dictionaryCapitalizeToggle) dictionaryCapitalizeToggle.checked = true;

      localStorage.removeItem('galaxy_notebook_line_numbers');
      const notebookLineNumbersToggle = document.getElementById('notebookLineNumbersToggle');
      if (notebookLineNumbersToggle) notebookLineNumbersToggle.checked = true;
      document.body.classList.remove('no-notebook-line-numbers');

      localStorage.removeItem('galaxy_spotify_auto_pause');
      const spotifyAutoPauseToggle = document.getElementById('spotifyAutoPauseToggle');
      if (spotifyAutoPauseToggle) spotifyAutoPauseToggle.checked = true;

      localStorage.removeItem('galaxy_spotify_now_playing');
      const spotifyNowPlayingToggle = document.getElementById('spotifyNowPlayingToggle');
      if (spotifyNowPlayingToggle) spotifyNowPlayingToggle.checked = true;
      if (typeof SpotifyController !== 'undefined') SpotifyController.startNowPlayingPolling();

      localStorage.removeItem('galaxy_gpu_saving');
      const performanceToggle = document.getElementById('performanceToggle');
      if (performanceToggle) {
        performanceToggle.checked = false;
        document.body.classList.remove('no-blur-mode');
      }

      apiStatusMessage.textContent = 'Все настройки сброшены по умолчанию!';
      apiStatusMessage.style.display = 'block';
      apiStatusMessage.className = 'modal-status success';
      
      setTimeout(closeModal, 1200);
    });

    // --- Резервное копирование и Перенос прогресса ---
    const exportBackupBtn = document.getElementById('exportBackupBtn');
    const importBackupBtn = document.getElementById('importBackupBtn');
    const importBackupFileInput = document.getElementById('importBackupFileInput');
    const backupStatusMessage = document.getElementById('backupStatusMessage');

    const backupKeys = [
      'favorite_songs',
      'song_metadata_cache',
      'user_api_key',
      'personal_categories',
      'personal_custom_categories',
      'personal_dictionary',
      'galaxy_dictionary_capitalize',
      'galaxy_notebook_hotkey',
      'galaxy_notebook_mouse_trigger',
      'galaxy_gpu_saving',
      'theme',
      'galaxy_study_session_queue',
      'galaxy_study_session_total',
      'galaxy_study_session_learned',
      'galaxy_study_session_learned_list',
      'dictionary_activity',
      'galaxy_watched_videos',
      'user_notebook_text',
      'galaxy_lesson_notes',
      'galaxy_custom_note_folders',
      'grammar_rules',
      'dict_size_prefs',
      'addWord_smartInput_settings'
    ];

    if (exportBackupBtn) {
      exportBackupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        try {
          const backupData = {};
          backupKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value !== null) {
              backupData[key] = value;
            }
          });

          // Дополнительные метаданные
          backupData['_metadata'] = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            app: 'EnglishSub'
          };

          const dataStr = JSON.stringify(backupData, null, 2);
          const blob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);

          const exportFileDefaultName = `englishsub_backup_${new Date().toISOString().split('T')[0]}.json`;

          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', url);
          linkElement.setAttribute('download', exportFileDefaultName);
          document.body.appendChild(linkElement);
          linkElement.click();
          document.body.removeChild(linkElement);

          // Очистка URL объекта (увеличена задержка для мобильных браузеров)
          setTimeout(() => URL.revokeObjectURL(url), 10000);

          if (backupStatusMessage) {
            backupStatusMessage.textContent = 'Yesнные экспортированы!';
            backupStatusMessage.style.display = 'block';
            backupStatusMessage.className = 'modal-status success';
            setTimeout(() => { backupStatusMessage.style.display = 'none'; }, 3000);
          }
        } catch (err) {
          console.error('Backup export failed:', err);
          if (backupStatusMessage) {
            backupStatusMessage.textContent = 'Error экспорта данных!';
            backupStatusMessage.style.display = 'block';
            backupStatusMessage.className = 'modal-status error';
          }
        }
      });
    }

    if (importBackupBtn && importBackupFileInput) {
      importBackupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        importBackupFileInput.value = ''; // сброс предыдущего выбора
        importBackupFileInput.click();
      });

      importBackupFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
          try {
            const importedData = JSON.parse(evt.target.result);
            
            if (!importedData || typeof importedData !== 'object') {
              throw new Error('Некорректный формат файла резервной копии.');
            }

            let importCount = 0;
            backupKeys.forEach(key => {
              if (importedData[key] !== undefined && importedData[key] !== null) {
                localStorage.setItem(key, importedData[key]);
                importCount++;
              }
            });

            if (importCount === 0) {
              throw new Error('В файле нет подходящих данных для импорта EnglishSub.');
            }

            if (backupStatusMessage) {
              backupStatusMessage.textContent = 'Success! Страница перезагружается...';
              backupStatusMessage.style.display = 'block';
              backupStatusMessage.className = 'modal-status success';
            }

            setTimeout(() => {
              window.location.reload();
            }, 1200);

          } catch (err) {
            console.error('Backup import failed:', err);
            if (backupStatusMessage) {
              backupStatusMessage.textContent = `Error: ${err.message || 'неверный формат JSON'}`;
              backupStatusMessage.style.display = 'block';
              backupStatusMessage.className = 'modal-status error';
            }
          }
        };
        reader.readAsText(file);
      });
    }
  }

  // --- Cloud Sync Event Listeners ---
  const syncGoogleLoginBtn = document.getElementById('syncGoogleLoginBtn');
  const syncLinkCodeBtn = document.getElementById('syncLinkCodeBtn');
  const syncCodeInput = document.getElementById('syncCodeInput');
  const syncLogoutBtn = document.getElementById('syncLogoutBtn');
  
  const syncNotLoggedContainer = document.getElementById('syncNotLoggedContainer');
  const syncLoggedInContainer = document.getElementById('syncLoggedInContainer');
  const syncUserEmail = document.getElementById('syncUserEmail');
  const syncCodeDisplayContainer = document.getElementById('syncCodeDisplayContainer');
  const syncUserCode = document.getElementById('syncUserCode');

  const updateSyncUI = (user) => {
    if (!syncNotLoggedContainer) return;
    if (user) {
      syncNotLoggedContainer.style.display = 'none';
      syncLoggedInContainer.style.display = 'flex';
      syncUserEmail.textContent = user.displayName || user.email || 'Linked profile';
      
      // If it's a real Google auth user, show their UID so they can copy it to phone
      if (!user.isOverride && user.uid) {
        syncCodeDisplayContainer.style.display = 'block';
        syncUserCode.textContent = user.uid;
      } else {
        syncCodeDisplayContainer.style.display = 'none';
      }
    } else {
      syncNotLoggedContainer.style.display = 'flex';
      syncLoggedInContainer.style.display = 'none';
    }
  };

  const initSyncSettings = () => {
    if (!window.SyncManager) {
      setTimeout(initSyncSettings, 500);
      return;
    }
    
    // Initial sync UI state
    updateSyncUI(window.SyncManager.getCurrentUser());
    
    // Listen for auth changes
    window.SyncManager.onUserChanged((user) => {
      updateSyncUI(user);
    });

    // Login via Google (for PC)
    if (syncGoogleLoginBtn) {
      syncGoogleLoginBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          const user = await window.SyncManager.signIn();
          updateSyncUI(user);
        } catch (err) {
          console.error(err);
        }
      });
    }

    // Link via Code (for Mobile)
    if (syncLinkCodeBtn) {
      syncLinkCodeBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const code = syncCodeInput.value.trim();
        if (code) {
          await window.SyncManager.linkWithCode(code);
        }
      });
    }

    // Logout / Unlink
    if (syncLogoutBtn) {
      syncLogoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await window.SyncManager.logout();
      });
    }
  };
  
  // Call init to setup polling for SyncManager module
  initSyncSettings();
  // Edit Lyrics Modal Event Listeners
  const editLyricsBtn = document.getElementById('editLyricsBtn');
  const editLyricsModal = document.getElementById('editLyricsModal');
  const closeEditLyricsBtn = document.getElementById('closeEditLyricsBtn');
  const cancelEditLyricsBtn = document.getElementById('cancelEditLyricsBtn');
  const saveEditLyricsBtn = document.getElementById('saveEditLyricsBtn');
  const editLyricsTextarea = document.getElementById('editLyricsTextarea');

  if (editLyricsBtn && editLyricsModal && closeEditLyricsBtn) {
    // Open modal with current lyrics
    editLyricsBtn.addEventListener('click', () => {
      const song = songsData[currentSongKey];
      if (!song) {
        alert("Сначала выберите или найдите песню для редактирования!");
        return;
      }
      
      // Join stanzas by double newlines for natural reading
      const fullText = song.lines.map(line => line.text).join('\n\n');
      editLyricsTextarea.value = fullText;
      
      openModalEl(editLyricsModal);
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
    });

    const closeEditModal = () => {
      closeModalEl(editLyricsModal);
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    };

    closeEditLyricsBtn.addEventListener('click', closeEditModal);
    cancelEditLyricsBtn.addEventListener('click', closeEditModal);
    
    // Backdrop click intentionally disabled — use the close button (✕) to dismiss

    // Save edited lyrics
    saveEditLyricsBtn.addEventListener('click', () => {
      const newText = editLyricsTextarea.value.trim();
      if (!newText) {
        alert("Пожалуйста, введите текст песни!");
        return;
      }

      const segmented = segmentLyricsIntoStanzas(newText);
      if (segmented.length === 0) {
        alert("Не удалось распознать куплеты. Убедитесь, что текст не пустой!");
        return;
      }

      // Update current song lines
      songsData[currentSongKey].lines = segmented;
      
      // Re-render song!
      renderSong(currentSongKey);
      
      closeEditModal();
    });
  }
}

function closeSidebar() {
  scrimOverlay.classList.remove('visible');
  sidebarPanel.classList.remove('open');
  document.documentElement.classList.remove('modal-open');
  document.body.classList.remove('modal-open');
  
  // Remove selection outline from lines on close
  const rows = document.querySelectorAll('.lyrics-row-wrapper');
  rows.forEach(r => r.classList.remove('active'));
}

// Restore active theme setting on boot
function restoreSavedTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    updateThemeIcons('light');
  } else if (savedTheme === 'gray') {
    document.body.classList.add('gray-theme');
    updateThemeIcons('gray');
  } else {
    updateThemeIcons('dark');
  }
}

// Keep button icons strictly synchronized with theme states
function updateThemeIcons(theme) {
  if (!themeToggleBtn) return;
  const sunIcon = themeToggleBtn.querySelector('.sun-icon');
  const grayIcon = themeToggleBtn.querySelector('.gray-icon');
  const moonIcon = themeToggleBtn.querySelector('.moon-icon');

  if (theme === 'light') {
    sunIcon.style.display = 'none';
    grayIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  } else if (theme === 'gray') {
    sunIcon.style.display = 'none';
    grayIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  } else {
    sunIcon.style.display = 'block';
    grayIcon.style.display = 'none';
    moonIcon.style.display = 'none';
  }
}

// Warm up Speech Synthesis voices collection for Chrome/Safari compatibility
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
}

// Ask custom AI question via Gemini or OpenRouter
async function askAICustomQuestion(questionText) {
  requireAPIKey();
  const currentApiKey = getAPIKey();
  const promptText = `Ты преподаватель английского. Помоги ученику. Мы разбираем строку из песни: "${activeOriginalText}". Ученик задал вопрос по этой строке: "${questionText}". Ответь ему понятно, развернуто и дружелюбно на русском языке. Ответ должен быть кратким (до 3-4 предложений).`;

  if (currentApiKey.startsWith('sk-or-')) {
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${currentApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:63079",
        "X-Title": "AI Lyric Trainer"
      },
      body: JSON.stringify({
        model: "z-ai/glm-4.5-air:free",
        messages: [
          { role: "user", content: promptText }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter returned status ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content;
  } else {
    // Default Google Gemini 2.0 Flash API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentApiKey}`;
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: promptText
            }
          ]
        }
      ],
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  }
}

// Setup Interactive Custom AI Chat
function initCustomChat() {
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const chatResponse = document.getElementById('chatResponse');

  if (!chatSendBtn || !chatInput || !chatResponse) return;

  chatSendBtn.addEventListener('click', async () => {
    const questionText = chatInput.value.trim();
    if (!questionText) return;

    // Show shimmering loading state
    chatResponse.style.display = 'block';
    chatResponse.innerHTML = `
      <div class="chat-response-shimmer">
        <div class="shimmer-row"></div>
        <div class="shimmer-row"></div>
        <div class="shimmer-row"></div>
      </div>
    `;

    // Clear input
    chatInput.value = '';

    try {
      const response = await askAICustomQuestion(questionText);
      if (response) {
        chatResponse.textContent = response.trim();
      } else {
        chatResponse.textContent = 'Error: Получен пустой ответ от ИИ-преподавателя.';
      }
    } catch (error) {
      console.error(error);
      chatResponse.textContent = 'Не удалось получить ответ от ИИ. Пожалуйста, попробуйте еще раз.';
    }
  });

  // Support hitting Enter to submit (without holding shift)
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatSendBtn.click();
    }
  });
}

// --- Mobile Back Button Support for Modals ---
// @AI-SECTION: MOBILE_BACK_BUTTON_MODALS
(function initModalHistoryAPI() {
  document.addEventListener('DOMContentLoaded', () => {
    // Disable in Capacitor/Cordova app to avoid history conflicts with main app router
    // Must check after DOM load so Capacitor bridge is fully injected
    const isMobileApp = !!window.Capacitor || !!window.Cordova || window.location.protocol === 'file:';
    if (isMobileApp) {
      console.log("History API modal helper disabled on mobile app wrapper.");
      return;
    }

    let programmaticBacks = 0;

    window.addEventListener('popstate', (e) => {
      if (programmaticBacks > 0) {
        programmaticBacks--;
        return;
      }
      // Dispatch Escape key to trigger existing hierarchical close logic
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    const modalObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const display = mutation.target.style.display;
          const isVisible = display === 'flex' || display === 'block';
          const wasVisible = mutation.oldValue && (mutation.oldValue.includes('display: flex') || mutation.oldValue.includes('display: block'));
          
          if (isVisible && !wasVisible) {
            // Modal opened
            window.history.pushState({ modalOpen: true, modalId: mutation.target.id }, '');
          } else if (!isVisible && wasVisible) {
            // Modal closed (by direct click, not by popstate)
            if (window.history.state && window.history.state.modalOpen) {
              programmaticBacks++;
              window.history.back();
            }
          }
        }
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modalObserver.observe(modal, { attributes: true, attributeFilter: ['style'], attributeOldValue: true });
    });
  });
})();

// --- Global Custom JS Tooltip ---
// @AI-SECTION: GLOBAL_JS_TOOLTIP
document.addEventListener('DOMContentLoaded', () => {
  const tooltip = document.createElement('div');
  tooltip.id = 'global-js-tooltip';
  tooltip.style.cssText = 'position: fixed; background: rgba(0,0,0,0.85); color: #1db954; padding: 6px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; white-space: nowrap; pointer-events: none; opacity: 0; visibility: hidden; transition: opacity 0.05s ease-out; z-index: 99999;';
  document.body.appendChild(tooltip);

  let tooltipTimeout;

  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('[data-en-tooltip]');
    if (target) {
      // Only show on non-touch devices
      if (window.matchMedia('(hover: none)').matches) return;
      clearTimeout(tooltipTimeout);
      const text = target.getAttribute('data-en-tooltip');
      tooltip.textContent = text;
      const rect = target.getBoundingClientRect();
      tooltip.style.left = (rect.left + rect.width / 2) + 'px';
      tooltip.style.top = (rect.top - 35) + 'px';
      tooltip.style.transform = 'translateX(-50%)';
      tooltip.style.visibility = 'visible';
      tooltip.style.opacity = '1';
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('[data-en-tooltip]');
    if (target) {
      tooltip.style.opacity = '0';
      tooltipTimeout = setTimeout(() => {
        tooltip.style.visibility = 'hidden';
      }, 50);
    }
  });
});
