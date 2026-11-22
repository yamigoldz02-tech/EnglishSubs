// @ts-check
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - BACKGROUND AI PREFETCH QUEUE
 * Intelligent queue system to pre-analyze upcoming lyrics in the background.
 * @AI-SECTION: AI_PREFETCH_ENGINE
 * ============================================================================
 */

let prefetchTimeoutId = null;
let activePrefetchSongKey = '';
let prefetchPaused = false;
let currentActivePhraseText = '';

// Initialize the in-memory cache by loading all persistent localStorage items
function initAnalysisCache() {
  try {
    // Cache versioning: clear old corrupted cache!
    const CACHE_VERSION_KEY = 'ai_lyric_cache_version_new';
    const CURRENT_CACHE_VERSION = 'v2.4.2';
    if (localStorage.getItem(CACHE_VERSION_KEY) !== CURRENT_CACHE_VERSION) {
      console.log("[Cache Reset] Purging legacy and potentially corrupted AI analysis cache...");
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('lyric_cache_') || key.startsWith('gemini_') || key.startsWith('analysis_'))) {
          localStorage.removeItem(key);
        }
      }
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);
    }

    // Safely iterate backwards to handle dynamic item deletion correctly
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('lyric_cache_')) {
        const stanzaText = key.replace('lyric_cache_', '');
        const val = localStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            // Self-healing: Purge empty, incomplete, or corrupted cache records automatically
            if (parsed && typeof parsed === 'object' && parsed.translation && parsed.translation.trim().length > 0) {
              analysisCache[stanzaText] = parsed;
            } else {
              console.warn(`[Cache Init] Purging invalid/empty cache entry for: "${stanzaText.substring(0, 30)}..."`);
              localStorage.removeItem(key);
            }
          } catch (err) {
            console.warn(`[Cache Init] Purging corrupted JSON cache entry for: "${stanzaText.substring(0, 30)}..."`);
            localStorage.removeItem(key);
          }
        }
      }
    }
    console.log(`[Cache Init] Loaded ${Object.keys(analysisCache).length} stanzas into in-memory cache.`);
  } catch (e) {
    console.error("Failed to initialize analysisCache from localStorage:", e);
  }
}

// Clear any active background pre-fetching queues (prevents overlapping fetch loops)
function clearPrefetchQueue() {
  if (prefetchTimeoutId) {
    clearTimeout(prefetchTimeoutId);
    prefetchTimeoutId = null;
  }
}

// Beautiful UI updater for background AI prefetching (Premium Usability Upgrade)
function updatePrefetchUI(songKey) {
  const container = document.getElementById('prefetchStatusContainer');
  const textEl = document.getElementById('prefetchStatusText');
  const progressEl = document.getElementById('prefetchProgressBar');
  const toggleBtn = document.getElementById('togglePrefetchBtn');
  
  if (!container || !textEl || !progressEl || !toggleBtn) return;
  
  const song = songsData[songKey];
  if (!song || !song.lines || song.lines.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  const hasMeaning = !!getCachedSongMeaning(song.title, song.artist);
  const total = song.lines.length + 1;
  const cached = song.lines.filter(line => analysisCache[line.text]).length + (hasMeaning ? 1 : 0);
  const pct = Math.round((cached / total) * 100);
  
  container.style.display = 'flex';
  progressEl.style.width = `${pct}%`;
  
  if (cached === total) {
    textEl.innerHTML = `✨ Вся песня и смысл названия полностью разобраны ИИ! (100%)`;
    toggleBtn.style.display = 'none';
    
    // Add glowing state to all rows
    const rows = document.querySelectorAll('.lyrics-row-wrapper');
    rows.forEach(r => {
      if (!r.querySelector('.ai-ready-badge')) {
        const lyricText = r.querySelector('.lyric-line');
        if (lyricText) {
          const badge = document.createElement('span');
          badge.className = 'ai-ready-badge';
          badge.innerHTML = '✦';
          badge.title = 'Мгновенный AI разбор готов';
          badge.style.cssText = 'color: #8b5cf6; margin-left: 8px; font-size: 0.8rem; font-weight: 700; opacity: 0.8;';
          lyricText.appendChild(badge);
        }
      }
    });
  } else {
    toggleBtn.style.display = 'block';
    if (prefetchPaused) {
      textEl.innerHTML = `⏳ Авто-разбор ИИ приостановлен (${cached} из ${total})`;
      toggleBtn.textContent = 'Старт';
      toggleBtn.title = 'Запустить фоновый авто-разбор';
      
      const dot = container.querySelector('.pulse-dot-violet');
      if (dot) {
        dot.style.background = '#6b7280';
        dot.style.boxShadow = 'none';
      }
    } else {
      textEl.innerHTML = `✨ ИИ плавно разбирает песню и смысл в фоне: ${cached} из ${total}`;
      toggleBtn.textContent = 'Пауза';
      toggleBtn.title = 'Приостановить фоновый авто-разбор';
      
      const dot = container.querySelector('.pulse-dot-violet');
      if (dot) {
        dot.style.background = '#8b5cf6';
        dot.style.boxShadow = '0 0 8px #8b5cf6';
      }
    }
    
    // Update individual rows
    const rows = document.querySelectorAll('.lyrics-row-wrapper');
    rows.forEach(r => {
      const idx = parseInt(r.dataset.index);
      const line = song.lines[idx];
      if (line) {
        const isCached = !!analysisCache[line.text];
        const existingBadge = r.querySelector('.ai-ready-badge');
        if (isCached) {
          if (!existingBadge) {
            const lyricText = r.querySelector('.lyric-line');
            if (lyricText) {
              const badge = document.createElement('span');
              badge.className = 'ai-ready-badge';
              badge.innerHTML = '✦';
              badge.title = 'Мгновенный AI разбор готов';
              badge.style.cssText = 'color: #8b5cf6; margin-left: 8px; font-size: 0.8rem; font-weight: 700; opacity: 0.8; transition: all 0.3s;';
              lyricText.appendChild(badge);
            }
          }
        } else {
          if (existingBadge) existingBadge.remove();
        }
      }
    });
  }
}

// Background Pre-fetching Queue with 5-second interval and rate limit protection
function startPrefetchingQueue(songKey) {
  if (prefetchPaused) return;
  clearPrefetchQueue(); // Cancel any existing queue
  activePrefetchSongKey = songKey; // Mark the active song key for this queue instance

  const song = songsData[songKey];
  if (!song || !song.lines) return;

  if (!hasAPIKey()) {
    const textEl = document.getElementById('prefetchStatusText');
    const toggleBtn = document.getElementById('togglePrefetchBtn');
    if (textEl) {
      textEl.innerHTML = '🔑 Добавьте API ключ в настройках для фонового AI-разбора';
    }
    if (toggleBtn) {
      toggleBtn.style.display = 'none';
    }
    return;
  }

  const songTitle = song.title;
  const artistName = song.artist;
  
  // Clone the array of stanzas, and prepend a special task for song title meaning analysis
  const queue = [
    { type: 'titleMeaning', songTitle, artistName },
    ...song.lines
  ];

  async function processNextQueueItem() {
    if (prefetchPaused) return;
    
    // If the active prefetching song has changed, terminate this loop!
    if (activePrefetchSongKey !== songKey) {
      console.log(`[Pre-fetch Queue] Terminating obsolete queue loop for: "${songTitle}"`);
      return;
    }

    if (queue.length === 0) {
      console.log(`[Pre-fetch Queue] Completed pre-fetching for: "${songTitle}"`);
      updatePrefetchUI(songKey);
      return;
    }

    const currentItem = queue.shift();

    if (currentItem && currentItem.type === 'titleMeaning') {
      const hasMeaning = !!getCachedSongMeaning(currentItem.songTitle, currentItem.artistName);
      if (hasMeaning) {
        updatePrefetchUI(songKey);
        prefetchTimeoutId = setTimeout(processNextQueueItem, 50);
        return;
      }

      const textEl = document.getElementById('prefetchStatusText');
      if (textEl) {
        textEl.innerHTML = `<span style="animation: pulse 1.5s infinite;">⏳ ИИ переводит и анализирует смысл названия "${currentItem.songTitle}"...</span>`;
      }

      try {
        console.log(`[Pre-fetch Queue] Running background fetch for song meaning: "${currentItem.songTitle}"`);
        const aiData = await fetchGeminiSongMeaning(currentItem.songTitle, currentItem.artistName);
        
        if (activePrefetchSongKey !== songKey) {
          console.log(`[Pre-fetch Queue] Song changed during meaning fetch. Discarding result.`);
          return;
        }

        setCachedSongMeaning(currentItem.songTitle, currentItem.artistName, aiData);
        console.log(`[Pre-fetch Queue] Title meaning cached successfully: "${currentItem.songTitle}"`);
      } catch (error) {
        console.warn(`[Pre-fetch Queue] Failed to fetch title meaning:`, error);
      }

      updatePrefetchUI(songKey);
      if (activePrefetchSongKey === songKey && !prefetchPaused) {
        prefetchTimeoutId = setTimeout(processNextQueueItem, 5000);
      }
      return;
    }

    const currentLine = currentItem;
    const stanzaText = currentLine ? currentLine.text : '';

    // Skip if already in in-memory cache
    if (analysisCache[stanzaText]) {
      updatePrefetchUI(songKey);
      prefetchTimeoutId = setTimeout(processNextQueueItem, 50);
      return;
    }

    // Visually highlight the row currently being translated
    const rows = document.querySelectorAll('.lyrics-row-wrapper');
    const currentIndex = song.lines.indexOf(currentLine);
    if (currentIndex !== -1 && rows[currentIndex]) {
      rows[currentIndex].classList.add('pre-fetching');
    }

    const textEl = document.getElementById('prefetchStatusText');
    if (textEl) {
      textEl.innerHTML = `<span style="animation: pulse 1.5s infinite;">⏳ ИИ переводит строфу ${currentIndex + 1} из ${song.lines.length}...</span>`;
    }

    try {
      console.log(`[Pre-fetch Queue] Running background fetch for: "${stanzaText.substring(0, 30)}..."`);
      const aiData = await fetchGeminiAnalysis(stanzaText, artistName, songTitle);
      
      // If the song changed while we were awaiting the API call, discard the result and terminate!
      if (activePrefetchSongKey !== songKey) {
        console.log(`[Pre-fetch Queue] Song changed during API fetch. Discarding result for: "${songTitle}"`);
        return;
      }

      // Store in both in-memory cache and persistent localStorage
      analysisCache[stanzaText] = aiData;
      setCachedAnalysis(stanzaText, aiData);

      console.log(`[Pre-fetch Queue] Cached successfully: "${stanzaText.substring(0, 30)}..."`);
    } catch (error) {
      console.warn(`[Pre-fetch Queue] Failed to fetch stanza: "${stanzaText.substring(0, 30)}...":`, error);
    }

    // Clean up current pulsing class
    if (currentIndex !== -1 && rows[currentIndex]) {
      rows[currentIndex].classList.remove('pre-fetching');
    }

    updatePrefetchUI(songKey);

    // Double check active song key before scheduling next pre-fetch
    if (activePrefetchSongKey === songKey && !prefetchPaused) {
      prefetchTimeoutId = setTimeout(processNextQueueItem, 5000);
    }
  }

  // Start the background queue 5 seconds after song loading
  prefetchTimeoutId = setTimeout(processNextQueueItem, 5000);
}


// Global exposure
if (typeof window !== 'undefined') {
  window.clearPrefetchQueue = clearPrefetchQueue;
  window.updatePrefetchUI = updatePrefetchUI;
  window.startPrefetchingQueue = startPrefetchingQueue;
}
