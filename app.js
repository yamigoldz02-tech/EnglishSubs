// @ts-check
/// <reference path="modules/types.js" />
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
    const activeCount = typeof window.getActiveWordsCount === 'function'
      ? window.getActiveWordsCount()
      : (personalDictionary ? personalDictionary.length : 0);
    dashWordsCount.textContent = activeCount;
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
});


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
    const isMobileApp = !!window.Capacitor || !!window.Cordova || window.location.protocol === 'file:';
    if (isMobileApp) {
      console.debug("History API modal helper disabled on mobile app wrapper.");
      return;
    }

    let programmaticBacks = 0;

    function closeTopmostModal() {
      const modalPriority = [
        'addWordModal',
        'addPhraseModal',
        'wordEditModal',
        'trainingModal',
        'roleplayModal',
        'manageFoldersModal',
        'settingsModal',
        'editLyricsModal',
        'artistSongsModal',
        'gamificationModal',
        'rulesModal',
        'dictionaryModal',
        'videoCourseModal'
      ];

      for (const id of modalPriority) {
        const el = document.getElementById(id);
        if (el && el.style.display !== 'none' && el.style.display !== '') {
          // If video course modal is minimized as a floating player, skip it from modal stack closure
          if (id === 'videoCourseModal' && el.classList.contains('video-modal-minimized')) {
            continue;
          }
          const closeBtn = el.querySelector('#closeAddWordBtn, #closeAddPhraseBtn, #closeDictionaryBtn, #closeTrainingModalBtn, #closeRoleplayModalBtn, #closeSettingsBtn, #closeGamificationBtn, #closeRulesBtn, #closeVideoCourseModalBtn, .modal-close-btn');
          if (closeBtn) {
            closeBtn.click();
          } else if (typeof window.closeModalEl === 'function') {
            window.closeModalEl(el);
          } else {
            el.style.display = 'none';
          }
          return true; // CLOSED EXACTLY ONE TOPMOST MODAL, STOP!
        }
      }

      return false;
    }
    window.closeTopmostModal = closeTopmostModal;

    window.addEventListener('popstate', (e) => {
      if (programmaticBacks > 0) {
        programmaticBacks--;
        return;
      }
      closeTopmostModal();
    });

    // Only observe top-level modals for History API (sub-modals like addWordModal do not pollute history stack)
    const topLevelModalIds = new Set(['dictionaryModal', 'settingsModal', 'gamificationModal', 'rulesModal']);

    const modalObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target;
          if (!topLevelModalIds.has(target.id)) return;
          if (target.classList.contains('video-modal-minimized')) return;

          const display = target.style.display;
          const isVisible = display === 'flex' || display === 'block';
          const wasVisible = mutation.oldValue && (mutation.oldValue.includes('display: flex') || mutation.oldValue.includes('display: block'));

          if (isVisible && !wasVisible) {
            window.history.pushState({ modalOpen: true, modalId: target.id }, '');
          } else if (!isVisible && wasVisible) {
            if (window.history.state && window.history.state.modalOpen) {
              programmaticBacks++;
              window.history.back();
            }
          }
        }
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
      if (topLevelModalIds.has(modal.id)) {
        modalObserver.observe(modal, { attributes: true, attributeFilter: ['style'], attributeOldValue: true });
      }
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
