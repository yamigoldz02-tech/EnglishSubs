/**
 * @AI-SECTION: DASHBOARD_ENGINE
 * @file modules/dashboard.js
 */

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
