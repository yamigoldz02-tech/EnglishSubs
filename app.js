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

// 1. Fully detailed Song Dataset (Spotify-ready)

// State Variables
let currentSongKey = 'scorpions';
let lastRenderedSongKey = null;
let activeLineData = null;
let activeOriginalText = '';
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
