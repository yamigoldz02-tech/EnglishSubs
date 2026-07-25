/**
 * @AI-SECTION: GLOBAL_SEARCH_ENGINE
 * @file modules/global-search.js
 */

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

  async /**
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
}