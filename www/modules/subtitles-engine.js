// @ts-check
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - SUBTITLES ENGINE
 * Handles rendering, DOM manipulation, and highlighting of lyrics.
 * ============================================================================
 */

(function() {

// Highlight words/phrases matching personalDictionary items in lyrics
function highlightWordsFromDictionary(text) {
  if (!text) return "";
  if (!personalDictionary || personalDictionary.length === 0) {
    return escapeHtml(text);
  }

  // Sort dictionary items by length of the target word/phrase in descending order
  // to prioritize matching longer phrases first and avoid partial substring overlap bugs
  const sortedDict = [...personalDictionary]
    .filter(item => {
      if (!item || !item.word || item.word.trim().length === 0) return false;
      if (item.categories && item.categories.some(c => window.personalHiddenCategories && window.personalHiddenCategories.includes(c))) {
        return false;
      }
      return true;
    })
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
  if (!isSameSong) {
    generateRandomPhraseGame(songKey);
  }
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

  // Bind to window for global access
  window.highlightWordsFromDictionary = highlightWordsFromDictionary;
  window.renderSong = renderSong;
  window.bindLyricClicks = bindLyricClicks;

})();
