// @ts-check
// @AI-SECTION: PLAYLIST_MANAGER
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - PLAYLIST MANAGER
 * Handles favorite songs, CSV dataset loading, and autocomplete search.
 * ============================================================================
 */

(function() {
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
    if (typeof window.closeMobileSearch === 'function') {
      window.closeMobileSearch();
    }
    
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

  // Asynchronously download and parse the playlist database using robust dual-path fetch
  async function loadCSVWithFallbacks() {
    // Priority Option: CORS-free local script bundle (ideal for double-clicking index.html directly)
    if (window.PLAYLIST_CSV_DATA) {
      console.debug("[CSV Loader] Successfully loaded database via CORS-free local script variable!");
      loadCSVSongs(window.PLAYLIST_CSV_DATA);
      initAutocomplete();
      if (typeof renderDashboardFavorites === 'function') renderDashboardFavorites();
      return;
    }

    console.debug("[CSV Loader] Local script bundle not present. Falling back to HTTP fetch...");
    let text = null;
    let lastError = null;

    // Path Option 1: Direct Unicode Russian filename
    try {
      const response = await fetch('data/Баня.csv?cb=' + Date.now());
      if (response.ok) {
        text = await response.text();
        console.debug("[CSV Loader] Successfully fetched Баня.csv via unicode path.");
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
        const response = await fetch('data/%D0%91%D0%B0%D0%BD%D1%8F.csv?cb=' + Date.now());
        if (response.ok) {
          text = await response.text();
          console.debug("[CSV Loader] Successfully fetched Баня.csv via URL encoded path (%D0%91%D0%B0%D0%BD%D1%8F.csv).");
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
      if (typeof renderDashboardFavorites === 'function') renderDashboardFavorites();
    } else {
      console.error("[CSV Loader] All paths to load Баня.csv failed. Last error:", lastError);
      initAutocomplete();
      if (typeof renderDashboardFavorites === 'function') renderDashboardFavorites();
    }
  }

  loadCSVWithFallbacks();

  // Bind to window for global access (Capacitor/file:// safe)
  window.currentSongKey = currentSongKey;
  window.lastRenderedSongKey = lastRenderedSongKey;
  window.activeLineData = activeLineData;
  window.activeOriginalText = activeOriginalText;
  window.activeDropdownIndex = activeDropdownIndex;
  
  window.favoriteSongs = favoriteSongs;
  window.isSongFavorite = isSongFavorite;
  window.toggleSongFavorite = toggleSongFavorite;
  window.resolveSongById = resolveSongById;
  window.initAutocomplete = initAutocomplete;
  window.pickSongFromSearch = pickSongFromSearch;
  window.loadCSVWithFallbacks = loadCSVWithFallbacks;

})();
