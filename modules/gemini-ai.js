/**
 * @file modules/gemini-ai.js
 * @description Extracted Live AI Integration (Google Gemini 1.5 Flash API & Dynamic Sidebar).
 */

/* ==========================================================================
   3. Live AI Integration (Gemini 1.5 Flash API) & Dynamic Sidebar Render
   ========================================================================== */

// API Configuration (Supports Google Gemini & OpenRouter keys starting with 'sk-or-')
function getAPIKey() {
  const customKey = localStorage.getItem('user_api_key');
  if (customKey && customKey.trim().length > 0) {
    return customKey.trim();
  }
  return '';
}

function hasAPIKey() {
  return getAPIKey().length > 0;
}

function requireAPIKey() {
  if (!hasAPIKey()) {
    throw new Error('API key required. Add your OpenRouter or Gemini key in settings.');
  }
}

// In-Memory cache for lightning-fast lookups (synchronized with persistent localStorage)
const analysisCache = {};
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

// LocalStorage Caching Layer for AI Responses
function getCachedAnalysis(text) {
  const key = 'lyric_cache_' + text;
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    // Robust validation: Ensure translation is non-empty and parsed object has correct structure
    if (parsed && typeof parsed === 'object' && parsed.translation && parsed.translation.trim().length > 0) {
      return parsed;
    } else {
      console.warn(`[Cache Get] Purging invalid/empty cache entry on direct access for key: ${key}`);
      localStorage.removeItem(key);
      return null;
    }
  } catch (e) {
    console.error('Error reading from cache', e);
    localStorage.removeItem(key);
    return null;
  }
}

function setCachedAnalysis(text, data) {
  const key = 'lyric_cache_' + text;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    
    // Evict oldest items if we exceed 200 items in localStorage to prevent QuotaExceededError
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('lyric_cache_')) {
        keys.push(k);
      }
    }
    if (keys.length > 200) {
      console.log(`[Cache Eviction] Lyric cache size (${keys.length}) exceeded limit of 200. Evicting oldest entries...`);
      // Sort keys (arbitrary order or oldest first if we had timestamps, since we don't, evict first few)
      for (let i = 0; i < keys.length - 200; i++) {
        localStorage.removeItem(keys[i]);
      }
    }
  } catch (e) {
    console.error('Error writing to cache', e);
  }
}

// Helper to escape raw control characters like literal newlines or tabs inside JSON string literals
function escapeRawNewlinesInJSON(jsonStr) {
  let insideString = false;
  let escaped = false;
  let result = '';
  
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    
    if (char === '"' && !escaped) {
      insideString = !insideString;
      result += char;
    } else if (char === '\\' && insideString) {
      escaped = !escaped;
      result += char;
    } else {
      if (insideString) {
        if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          result += '\\r';
        } else if (char === '\t') {
          result += '\\t';
        } else {
          result += char;
        }
      } else {
        result += char;
      }
      escaped = false;
    }
  }
  return result;
}

// Clean and Parse JSON safely from any textual response (strips markdown, cuts outer texts)
function cleanAndParseJSON(rawText) {
  console.log("[JSON Parser] Attempting to clean and parse raw AI response...");
  let cleanText = rawText.trim();
  
  // If the model wrapped the response in a markdown code block ```json ... ```
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = cleanText.match(jsonBlockRegex);
  if (match) {
    cleanText = match[1].trim();
  }
  
  // Escape raw unescaped control characters inside string literals before parsing
  cleanText = escapeRawNewlinesInJSON(cleanText);
  
  try {
    const parsed = JSON.parse(cleanText);
    normalizeParsedData(parsed);
    console.log("[JSON Parser] Successfully parsed and normalized translation payload.");
    return parsed;
  } catch (e) {
    console.warn("[JSON Parser] Direct JSON parse failed, trying to extract substring from first brace...", e);
    // If direct parse fails, try to search for the first '{' and the last '}' to extract a JSON block
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const extracted = cleanText.substring(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(extracted);
        normalizeParsedData(parsed);
        console.log("[JSON Parser] Successfully parsed extracted JSON brace-block.");
        return parsed;
      } catch (innerErr) {
        console.error("[JSON Parser] JSON parse failure on extracted block:", cleanText);
        console.error("[JSON Parser] Extracted block was:", cleanText.substring(firstBrace, lastBrace + 1));
        console.error("[JSON Parser] Extraction error details:", innerErr);
        throw innerErr;
      }
    }
    console.error("[JSON Parser] JSON parse failure on cleaned text:", cleanText);
    console.error("[JSON Parser] Direct parsing error details:", e);
    throw e; // rethrow if even extraction fails
  }
}

// Automatically normalize parsed AI responses to be bulletproof
function normalizeParsedData(data) {
  if (!data) return;
  if (data.lines && Array.isArray(data.lines) && data.lines.length > 0) {
    if (!data.translation || data.translation.trim() === "" || data.translation === "Перевод фразы") {
      data.translation = data.lines.map(line => line.russian).join('\n');
    }
  }
}

// Fallback helper to meta-llama/llama-3.3-70b-instruct:free and others when user has $0.00 OpenRouter balance
async function fetchOpenRouterFreeFallback(promptText, apiKey) {
  const fallbackModels = [
    "openrouter/free",
    "qwen/qwen-2.5-coder-32b-instruct:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-2-9b-it:free"
  ];
  
  const url = 'https://openrouter.ai/api/v1/chat/completions';
  let lastError = null;

  for (const modelName of fallbackModels) {
    try {
      console.log(`Initiating Free OpenRouter fallback model: ${modelName}...`);
      
      const payload = {
        model: modelName,
        messages: [
          { role: "user", content: promptText }
        ]
      };

      // Only specify JSON response format for models that are not the generic free router
      if (modelName !== "openrouter/free") {
        payload.response_format = { type: "json_object" };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:63079",
          "X-Title": "AI Lyric Trainer"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Model ${modelName} returned status ${response.status}`);
      }

      const data = await response.json();
      let textResponse = data.choices?.[0]?.message?.content;
      if (!textResponse) {
        throw new Error(`No content returned from ${modelName}`);
      }

      const parsed = cleanAndParseJSON(textResponse);
      console.log(`Successfully completed free fallback using model: ${modelName}!`);
      return parsed;
    } catch (err) {
      console.warn(`Fallback to model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`All free fallback models failed. Last error: ${lastError ? lastError.message : 'Unknown'}`);
}

const songMeaningCache = {};

function getCachedSongMeaning(songTitle, artistName) {
  const key = `song_meaning_${songTitle}_${artistName}`.toLowerCase().replace(/\s+/g, '_');
  if (songMeaningCache[key]) return songMeaningCache[key];
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const data = JSON.parse(cached);
      songMeaningCache[key] = data;
      return data;
    }
  } catch (e) {
    console.error('Error reading meaning from cache', e);
  }
  return null;
}

function setCachedSongMeaning(songTitle, artistName, data) {
  const key = `song_meaning_${songTitle}_${artistName}`.toLowerCase().replace(/\s+/g, '_');
  songMeaningCache[key] = data;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error writing meaning to cache', e);
  }
}

// Fetch detailed translation and meaning of the song title and entire song theme
async function fetchGeminiSongMeaning(songTitle, artistName) {
  requireAPIKey();
  const currentApiKey = getAPIKey();
  const promptText = `
Ты — профессиональный, эмпатичный репетитор по английскому языку.
Твой ученик разбирает песню "${songTitle}" исполнителя ${artistName}.
Твоя задача — перевести название этой песни и раскрыть ее глобальный смысл, историю создания, посыл автора и интересные культурные/исторические детали.

Верни ответ СТРОГО в формате валидного JSON без markdown-разметки.
Объясняй все на русском языке, простыми и увлекательными словами, вдохновляя ученика!

Структура JSON:
{
  "titleTranslation": "Художественный перевод названия песни на русский язык",
  "titlePronunciation": "Транскрипция названия русскими или латинскими буквами для легкого произношения (например, [Вайлд Хартс] или [waɪld hɑːts])",
  "songMeaning": "Глубокое, интересное объяснение глобального смысла песни, истории ее написания и ключевой темы автора (2-3 емких абзаца)",
  "culturalLore": "Интересные факты о песне, культурном влиянии, скрытых метафорах или историческом контексте (например, о политических событиях, вдохновивших песню, или съемках клипа). Если фактов нет, напиши null.",
  "titleVocabulary": [
    { "word": "Ключевое слово или идиома из названия", "translation": "Перевод", "context": "Как слово переводится и какой оттенок значения приобретает в названии этой песни" }
  ]
}
`;

  if (currentApiKey.startsWith('sk-or-')) {
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:63079",
          "X-Title": "AI Lyric Trainer"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "user", content: promptText }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        console.warn(`Primary song meaning request failed with status ${response.status}. Attempting free fallback...`);
        return await fetchOpenRouterFreeFallback(promptText, currentApiKey);
      }

      const rawData = await response.json();
      const textResponse = rawData.choices[0].message.content;
      return cleanAndParseJSON(textResponse);
    } catch (e) {
      console.warn('Primary OpenRouter request failed for song meaning, trying free fallback...', e);
      return await fetchOpenRouterFreeFallback(promptText, currentApiKey);
    }
  } else {
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
      generationConfig: {
        responseMimeType: "application/json"
      },
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
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      throw new Error("No response from Gemini");
    }

    return cleanAndParseJSON(textResponse);
  }
}

async function triggerSongMeaningAnalysis(songKey) {
  const song = songsData[songKey];
  if (!song) return;
  
  const songTitleText = song.title;
  const artistNameText = song.artist;
  
  // Show scrim and slide in sidebar panel with GPU acceleration
  scrimOverlay.classList.add('visible');
  sidebarPanel.classList.add('open');
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');
  
  // Clean up any other active selections
  const rows = document.querySelectorAll('.lyrics-row-wrapper');
  rows.forEach(r => r.classList.remove('active'));

  // Reset interactive chat elements for song title
  const chatInput = document.getElementById('chatInput');
  const chatResponse = document.getElementById('chatResponse');
  if (chatInput) chatInput.value = '';
  if (chatResponse) {
    chatResponse.style.display = 'none';
    chatResponse.textContent = '';
  }
  
  // Track for custom AI tutor chat context!
  activeOriginalText = `Глобальный смысл и перевод названия песни "${songTitleText}" артиста ${artistNameText}`;
  activeLineData = { text: songTitleText, translation: "" };
  
  // Render loading state in sidebar!
  const contentContainer = sidebarPanel.querySelector('.sidebar-content');
  if (contentContainer) {
    contentContainer.innerHTML = `
      <div class="sidebar-loading-wrapper" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; gap: 1.5rem; animation: fadeIn 0.4s ease-out;">
        <div class="premium-spinner" style="width: 48px; height: 48px; border: 3px solid rgba(139, 92, 246, 0.15); border-top-color: #8b5cf6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <div style="text-align: center;">
          <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--text-main);">ИИ исследует смысл песни...</h3>
          <p style="margin: 0.35rem 0 0 0; font-size: 0.8rem; color: var(--text-sub);">Переводим название и собираем исторический контекст</p>
        </div>
      </div>
    `;
  }
  
  const cached = getCachedSongMeaning(songTitleText, artistNameText);
  if (cached) {
    renderSongMeaningSidebar(songTitleText, artistNameText, cached);
    return;
  }
  
  try {
    const aiData = await fetchGeminiSongMeaning(songTitleText, artistNameText);
    setCachedSongMeaning(songTitleText, artistNameText, aiData);
    renderSongMeaningSidebar(songTitleText, artistNameText, aiData);
  } catch (error) {
    console.error("Failed to fetch song meaning:", error);
    if (contentContainer) {
      contentContainer.innerHTML = `
        <div class="error-state" style="text-align: center; padding: 2rem;">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">❌</div>
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1rem; color: var(--text-main);">Ошибка загрузки разбора</h3>
          <p style="margin: 0; font-size: 0.8rem; color: var(--text-sub);">${escapeHTML(error.message) || 'Не удалось связаться с сервером AI.'}</p>
          <button onclick="triggerSongMeaningAnalysis('${songKey}')" style="margin-top: 1rem; background: var(--accent-spotify); padding: 8px 16px; border-radius: 20px; font-size: 0.8rem; border: none; color: #000; font-weight: 700; cursor: pointer;">Повторить попытку</button>
        </div>
      `;
    }
  }
}

function renderSongMeaningSidebar(songTitle, artistName, data) {
  const contentContainer = sidebarPanel.querySelector('.sidebar-content');
  if (!contentContainer) return;
  
  // Format title vocabulary items
  let vocabHTML = '';
  if (data.titleVocabulary && Array.isArray(data.titleVocabulary) && data.titleVocabulary.length > 0) {
    vocabHTML = `
      <div class="lore-section-title" style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">
        <span>📖 Разбор слов из названия</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 1.5rem;">
        ${data.titleVocabulary.map(item => {
          const escWord = item.word.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
          const escTrans = item.translation.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
          return `
            <div style="padding: 10px 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 700; color: var(--accent-spotify); font-size: 0.85rem;">${escapeHTML(item.word)}</span>
                <span style="color: var(--text-main); font-weight: 600; font-size: 0.8rem;">— ${escapeHTML(item.translation)}</span>
              </div>
              <p style="margin: 0; font-size: 0.75rem; color: var(--text-sub); line-height: 1.4;">${escapeHTML(item.context)}</p>
              <div style="display: flex; justify-content: flex-end; margin-top: 2px;">
                <button onclick="event.stopPropagation(); window.addWordToPersonalDictionary('${escWord}', '${escTrans}')" style="background: rgba(29, 185, 84, 0.08); border: 1px solid rgba(29, 185, 84, 0.2); color: var(--accent-spotify); border-radius: 20px; padding: 4px 10px; font-size: 0.7rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;" onmouseover="this.style.background='rgba(29, 185, 84, 0.15)'" onmouseout="this.style.background='rgba(29, 185, 84, 0.08)'">
                  <span>➕ В словарь</span>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  // Format cultural lore if exists
  let loreHTML = '';
  if (data.culturalLore) {
    loreHTML = `
      <div id="lore-container" style="margin-bottom: 1.5rem; padding: 1.2rem; border-radius: 16px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(139, 92, 246, 0.01)); border: 1px solid rgba(139, 92, 246, 0.15); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2), 0 0 12px rgba(139, 92, 246, 0.05); animation: pulseLore 3s infinite ease-in-out; box-sizing: border-box; width: 100%;">
        <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.8rem; color: #a78bfa; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">
          <span>🏛️ Исторический контекст и факты</span>
        </div>
        <p style="margin: 0; font-size: 0.8rem; color: var(--text-sub); line-height: 1.5; font-weight: 500;">
          ${escapeHTML(data.culturalLore)}
        </p>
      </div>
    `;
  }

  // Inject HTML template inside sidebar
  contentContainer.innerHTML = `
    <div style="animation: fadeIn 0.4s ease-out;">
      <!-- Title Translation & Pronunciation Card -->
      <div class="analysis-card" style="margin-bottom: 1.5rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 1.25rem; border-radius: 16px;">
        <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent-spotify); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Оригинальное название</div>
        <h2 style="margin: 0 0 8px 0; font-size: 1.4rem; font-weight: 800; color: var(--text-main); font-family: 'Outfit', sans-serif;">${escapeHTML(songTitle)}</h2>
        
        <div style="display: flex; flex-direction: column; gap: 4px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px; margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.75rem; color: var(--text-sub);">Перевод:</span>
            <span style="font-size: 0.95rem; font-weight: 700; color: var(--text-main);">${escapeHTML(data.titleTranslation)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.75rem; color: var(--text-sub);">Произношение:</span>
            <span style="font-size: 0.85rem; font-style: italic; color: #a78bfa; font-weight: 600;">${escapeHTML(data.titlePronunciation)}</span>
          </div>
        </div>
      </div>

      <!-- Song Meaning Explain Card -->
      <div class="lore-section-title" style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">
        <span>✨ Смысл песни от ИИ</span>
      </div>
      <div style="font-size: 0.85rem; color: var(--text-sub); line-height: 1.6; margin-bottom: 1.5rem; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); padding: 1.2rem; border-radius: 16px; font-family: 'Inter', sans-serif;">
        ${data.songMeaning.split('\n\n').map(p => `<p style="margin: 0 0 1rem 0; text-indent: 0.5rem;">${escapeHTML(p)}</p>`).join('')}
      </div>

      <!-- Cultural Fact Box -->
      ${loreHTML}

      <!-- Vocabulary Analysis -->
      ${vocabHTML}
    </div>
  `;
}

// Fetch live response analysis directly from Gemini or OpenRouter
async function fetchGeminiAnalysis(stanzaText, artistName, songTitle) {
  requireAPIKey();
  const currentApiKey = getAPIKey();
  const promptText = `
Ты — профессиональный, эмпатичный репетитор по английскому языку. Твой ученик начинает изучать язык с абсолютного нуля.
Сейчас вы разбираете песню "${songTitle}" исполнителя ${artistName}.
Твоя задача — проанализировать следующую строфу (группу строк) из этой песни:
"${stanzaText}"
Правила анализа:
Учитывай музыкальный контекст, style артиста и скрытые метафоры.
Грамматику объясняй максимально простым языком, "для чайников", без сложных академических терминов. Сделай акцент на том, какое время здесь используется и почему.
Проанализируй текст на наличие культурных, исторических, географических или кинематографических отсылок, а также скрытых смыслов или сленга конкретной эпохи. Если они есть, верни их в поле JSON: "culturalLore": "текст объяснения". Если отсылок нет, верни null.
Выдели два типа учебных данных:
1. "vocabulary" — список из 3-4 важных отдельных слов из строфы с переводом.
2. "phrases" — список из 1-3 устойчивых выражений, словосочетаний, идиом или фразовых глаголов (лексических чанков) из этой же строфы с их контекстуальным переводом.
Все объяснения, переводы и значения свойств в JSON (таких как 'translation', 'grammar', 'culturalLore', 'context' для каждого элемента 'vocabulary' и 'phrases') должны быть написаны исключительно на русском языке, простыми и дружелюбными словами, понятными для новичка.
Верни ответ СТРОГО в формате валидного JSON без markdown-разметки.
Структура JSON:
{
  "translation": "Художественный перевод строфы на русский язык. Разделяй строки перевода символом новой строки '\\n', чтобы количество строк перевода СТРОГО соответствовало количеству строк оригинального текста на английском языке (1-в-1).",
  "lines": [
    {
      "english": "Оригинальная английская строчка из строфы, в точности как в запросе (например, 'No one knows what it's like')",
      "russian": "Художественный перевод именно этой конкретной строчки на русский язык"
    }
  ],
  "grammar": "Понятное объяснение грамматики и конструкции предложений в этой строфе (2-3 предложения)",
  "culturalLore": "текст объяснения отсылок, сленга или скрытых смыслов, либо null",
  "vocabulary": [
    { "word": "Слово на английском", "translation": "Перевод", "context": "Как и почему оно используется именно в этой песне" }
  ],
  "phrases": [
    { "phrase": "Устойчивое выражение или фразовый глагол на английском", "translation": "Контекстуальный перевод", "context": "Значение фразы в контексте песни и особенности её употребления" }
  ]
}
`;

  // Check if OpenRouter key is provided
  if (currentApiKey.startsWith('sk-or-')) {
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    console.log(`[Gemini API] Requesting OpenRouter translation for stanza: "${stanzaText.substring(0, 40).replace(/\n/g, ' ')}..."`);
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:63079",
          "X-Title": "AI Lyric Trainer"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash", // Replaced deprecated experimental free model with stable Gemini 2.5 Flash
          messages: [
            { role: "user", content: promptText }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[Gemini API] Primary OpenRouter request failed with status ${response.status}: ${errText}. Attempting free fallback...`);
        return await fetchOpenRouterFreeFallback(promptText, currentApiKey);
      }

      const data = await response.json();
      console.log("[Gemini API] Raw OpenRouter Response:", data);
      
      if (data.error) {
        console.error("[Gemini API] OpenRouter returned error payload:", data.error);
        throw new Error(`OpenRouter Error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      const textResponse = data.choices?.[0]?.message?.content;
      if (!textResponse) {
        throw new Error("No response content from OpenRouter");
      }
      return cleanAndParseJSON(textResponse);
    } catch (e) {
      console.warn("[Gemini API] Primary API request failed. Executing free fallback as recovery...", e);
      return await fetchOpenRouterFreeFallback(promptText, currentApiKey);
    }
  } else {
    // Default Google Gemini 2.0 Flash API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentApiKey}`;
    console.log(`[Gemini API] Requesting Google Gemini translation for stanza: "${stanzaText.substring(0, 40).replace(/\n/g, ' ')}..."`);
    
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
      generationConfig: {
        responseMimeType: "application/json"
      },
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
      const errText = await response.text();
      console.error(`[Gemini API] Google Gemini returned error status ${response.status}: ${errText}`);
      throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    console.log("[Gemini API] Raw Google Gemini Response:", data);
    
    if (data.promptFeedback && data.promptFeedback.blockReason) {
      console.error("[Gemini API] Google Gemini blocked the prompt due to:", data.promptFeedback.blockReason);
      throw new Error(`Google Gemini blocked prompt: ${data.promptFeedback.blockReason}`);
    }

    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      if (data.candidates?.[0]?.finishReason) {
        console.error("[Gemini API] Google Gemini failed to generate content. Finish reason:", data.candidates[0].finishReason);
        throw new Error(`Google Gemini finish reason: ${data.candidates[0].finishReason}`);
      }
      throw new Error("No response content from Google Gemini");
    }

    return cleanAndParseJSON(textResponse);
  }
}

async function triggerSidebarAnalysis(lineData) {
  activeLineData = lineData;
  const originalText = lineData.text;
  activeOriginalText = originalText; // Track for custom AI tutor chat
  
  // Retrieve current song title and artist name context
  const song = songsData[currentSongKey];
  const songTitle = song ? song.title : "Песня";
  const artistName = song ? song.artist : "Исполнитель";

  // Show scrim and slide in sidebar panel with GPU acceleration
  scrimOverlay.classList.add('visible');
  sidebarPanel.classList.add('open');
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');

  // Reset interactive chat elements for the new active line
  const chatInput = document.getElementById('chatInput');
  const chatResponse = document.getElementById('chatResponse');
  const customChatContainer = document.getElementById('customChatContainer');
  if (chatInput) chatInput.value = '';
  if (chatResponse) {
    chatResponse.style.display = 'none';
    chatResponse.textContent = '';
  }
  if (customChatContainer) {
    customChatContainer.style.display = 'block';
  }

  // Check in-memory analysisCache first for absolute instant render (no Shimmer, 0ms latency!)
  if (analysisCache[originalText]) {
    console.log('Serving lyric analysis from in-memory cache:', originalText);
    renderSidebarData(originalText, analysisCache[originalText]);
    return;
  }

  // Phrase Builder mini-game in sidebar while AI analysis loads
  const contentContainer = sidebarPanel.querySelector('.sidebar-content');
  mountSidebarLoadingPhraseGame(
    contentContainer,
    originalText,
    lineData.translation || 'Загрузка перевода…'
  );

  try {
    // Perform active request to Gemini AI with contextual parameters
    const aiData = await fetchGeminiAnalysis(originalText, artistName, songTitle);
    analysisCache[originalText] = aiData; // Store in in-memory cache
    setCachedAnalysis(originalText, aiData); // Cache the successful result persistently!
    renderSidebarData(originalText, aiData);
  } catch (error) {
    console.warn("Gemini API error, using structured local dataset fallback:", error);
    
    // Check if the song is dynamic (has no hardcoded translation in songsData)
    const isDynamic = !lineData || !lineData.translation || (lineData.id && (lineData.id.startsWith('dyn-') || lineData.id.startsWith('global-')));
    
    if (isDynamic) {
      const is402 = error.message && error.message.includes('402');
      const needsKey = !hasAPIKey() || (error.message && /api key/i.test(error.message));
      const contentContainer = sidebarPanel.querySelector('.sidebar-content');
      if (contentContainer) {
        contentContainer.innerHTML = `
          <div class="analysis-card" style="border: 1px solid rgba(239, 68, 68, 0.25); background: rgba(239, 68, 68, 0.05); text-align: center; padding: 2.5rem 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; border-radius: 16px; margin: 1rem 0;">
            <div style="font-size: 2.5rem; animation: pulse 2s infinite ease-in-out;">🔑</div>
            <div style="font-size: 1.05rem; font-weight: 700; color: #ef4444;">
              ${needsKey ? 'Требуется API ключ' : (is402 ? 'Требуется API ключ (Ошибка 402)' : 'Не удалось связаться с ИИ')}
            </div>
            <p style="font-size: 0.85rem; color: var(--text-sub); line-height: 1.5; margin: 0; max-width: 280px;">
              ${needsKey
                ? 'Для AI-разбора вставьте бесплатный ключ OpenRouter (sk-or-...) или Google Gemini (AIzaSy...) в настройках.'
                : (is402
                  ? 'Лимит запросов исчерпан (402 Payment Required). Вставьте другой API ключ в настройках.'
                  : 'Произошла ошибка при отправке запроса к ИИ. Убедитесь в правильности вашего API ключа или проверьте подключение к сети.')}
            </p>
            <button onclick="document.getElementById('apiSettingsBtn').click()" style="background: var(--accent-gradient); color: white; padding: 8px 20px; border: none; border-radius: 20px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: transform 0.2s; box-shadow: var(--accent-glow); margin-top: 0.5rem; outline: none; user-select: none;">
              ⚙️ Открыть настройки API
            </button>
          </div>
        `;
      }
      return;
    }

    // Offline local fallback so the interface never crashes (for pre-baked static songs)
    const offlineBackup = {
      translation: lineData.translation,
      grammar: lineData.grammar ? lineData.grammar.map(g => `${g.highlight} ${g.text}`).join(' ') : "Грамматический разбор доступен в локальной базе данных.",
      vocabulary: lineData.words ? lineData.words.map(w => ({
        word: w.word,
        translation: w.translation,
        context: `${w.phonetic} — ${w.definition}`
      })) : []
    };
    
    renderSidebarData(originalText, offlineBackup, true);
  }
}

// Inject detailed Awwwards metadata blocks to sidebar
function renderSidebarData(originalText, data, isFallback = false) {
  // Dynamically inject the Russian translation directly into the active row on the main lyrics board
  const activeRow = document.querySelector('.lyrics-row-wrapper.active');
  if (activeRow) {
    const lyricLine = activeRow.querySelector('.lyric-line');
    if (lyricLine) {
      let translationBlock = lyricLine.querySelector('.line-translation-live');
      if (!translationBlock) {
        translationBlock = document.createElement('div');
        translationBlock.className = 'line-translation-live';
        lyricLine.appendChild(translationBlock);
      }
      translationBlock.textContent = data.translation;
      // Trigger a browser reflow/frame render to animate the translation block smoothly
      requestAnimationFrame(() => {
        translationBlock.classList.add('visible');
      });
    }
  }

  const contentContainer = sidebarPanel.querySelector('.sidebar-content');
  
  // Generate HTML blocks for Grammar
  let grammarHTML = '';
  if (data.grammar) {
    grammarHTML = `
      <div class="analysis-card">
        <div class="card-label">Грамматика для новичков</div>
        <p style="font-size: 0.9rem; line-height: 1.5; color: var(--text-sub);">${escapeHTML(data.grammar)}</p>
      </div>
    `;
  }

  // Generate HTML blocks for Cultural Lore
  let loreHTML = '';
  if (data.culturalLore) {
    loreHTML = `
      <div class="analysis-card lore-card" id="lore-container" style="
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(139, 92, 246, 0.04));
        border: 1px solid rgba(139, 92, 246, 0.3);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2), 0 0 15px rgba(139, 92, 246, 0.15);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border-radius: 16px;
        padding: 1.25rem;
        margin-top: 1rem;
        animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-sizing: border-box;
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #a78bfa;
          text-transform: uppercase;
          letter-spacing: 1px;
        ">
          <span>🏛️</span>
          <span>Культурный код</span>
        </div>
        <p style="
          font-size: 0.88rem;
          line-height: 1.5;
          color: var(--text-main);
          margin: 0;
          opacity: 0.95;
        ">${escapeHTML(data.culturalLore)}</p>
      </div>
    `;
  }

  // Generate HTML blocks for Vocabulary (single words)
  let vocabularyHTML = '';
  if (data.vocabulary && data.vocabulary.length > 0) {
    const itemsHTML = data.vocabulary.map(item => {
      const isSaved = personalDictionary.some(w => w.word.toLowerCase() === item.word.toLowerCase());
      const btnText = isSaved ? '✓ В словаре' : '➕ В словарь';
      const btnStyle = isSaved 
        ? 'color: #1db954; background: rgba(29, 185, 84, 0.15); border: 1px solid rgba(29, 185, 84, 0.3);'
        : 'color: var(--accent-spotify); background: rgba(29, 185, 84, 0.1); border: 1px solid rgba(29, 185, 84, 0.2);';

      const escWord = item.word.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
      const escTrans = item.translation.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');

      return `
        <div style="background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 6px; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <div style="display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;">
              <span style="font-weight: 800; color: var(--text-main); font-size: 0.95rem;">${escapeHTML(item.word)}</span>
              <span style="color: #a78bfa; font-weight: 700; font-size: 0.82rem; text-transform: uppercase;">— ${escapeHTML(item.translation)}</span>
            </div>
            <button onclick="event.stopPropagation(); window.toggleDictionaryItem(this, '${escWord}', '${escTrans}', 'Из песен', 'word')" class="premium-micro-btn" style="${btnStyle} font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 20px; cursor: pointer; transition: all 0.2s; white-space: nowrap; outline: none;">
              ${btnText}
            </button>
          </div>
          ${item.context ? `<p style="margin: 0; font-size: 0.8rem; line-height: 1.4; color: var(--text-sub);">${escapeHTML(item.context)}</p>` : ''}
        </div>
      `;
    }).join('');

    vocabularyHTML = `
      <div class="analysis-card" style="display: flex; flex-direction: column; gap: 12px;">
        <div class="card-label" style="display: flex; align-items: center; gap: 6px;">
          <span>📌</span>
          <span>Важные слова</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${itemsHTML}
        </div>
      </div>
    `;
  } else {
    vocabularyHTML = `
      <div class="analysis-card">
        <div class="card-label">📌 Важные слова</div>
        <div style="text-align: center; padding: 1rem; color: var(--text-muted); font-style: italic; font-size: 0.85rem;">
          Нет слов для изучения в этой строчке.
        </div>
      </div>
    `;
  }

  // Generate HTML blocks for Phrases (chunks/collocations)
  let phrasesHTML = '';
  const phraseList = data.phrases || data.expressions || [];
  if (phraseList && phraseList.length > 0) {
    const itemsHTML = phraseList.map(item => {
      const phraseText = item.phrase || item.word;
      if (!phraseText) return '';
      
      const isSaved = personalDictionary.some(w => w.word.toLowerCase() === phraseText.toLowerCase());
      const btnText = isSaved ? '✓ В словаре' : '➕ В словарь';
      const btnStyle = isSaved 
        ? 'color: #1db954; background: rgba(29, 185, 84, 0.15); border: 1px solid rgba(29, 185, 84, 0.3);'
        : 'color: var(--accent-spotify); background: rgba(29, 185, 84, 0.1); border: 1px solid rgba(29, 185, 84, 0.2);';

      const escWord = phraseText.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
      const escTrans = item.translation.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');

      return `
        <div style="background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 6px; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <div style="display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;">
              <span style="font-weight: 800; color: var(--text-main); font-size: 0.95rem;">${escapeHTML(phraseText)}</span>
              <span style="color: #34d399; font-weight: 700; font-size: 0.82rem; text-transform: uppercase;">— ${escapeHTML(item.translation)}</span>
            </div>
            <button onclick="window.toggleDictionaryItem(this, '${escWord}', '${escTrans}', 'Из песен', 'phrase')" class="premium-micro-btn" style="${btnStyle} font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 20px; cursor: pointer; transition: all 0.2s; white-space: nowrap; outline: none;">
              ${btnText}
            </button>
          </div>
          ${item.context ? `<p style="margin: 0; font-size: 0.8rem; line-height: 1.4; color: var(--text-sub);">${escapeHTML(item.context)}</p>` : ''}
        </div>
      `;
    }).join('');

    phrasesHTML = `
      <div class="analysis-card" style="display: flex; flex-direction: column; gap: 12px;">
        <div class="card-label" style="display: flex; align-items: center; gap: 6px;">
          <span>🎬</span>
          <span>Полезные выражения</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${itemsHTML}
        </div>
      </div>
    `;
  } else {
    phrasesHTML = `
      <div class="analysis-card">
        <div class="card-label">🎬 Полезные выражения</div>
        <div style="text-align: center; padding: 1rem; color: var(--text-muted); font-style: italic; font-size: 0.85rem;">
          Нет устойчивых выражений для изучения в этой строчке.
        </div>
      </div>
    `;
  }

  const alertHTML = isFallback ? `
    <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.15); padding: 0.8rem 1rem; border-radius: 12px; font-size: 0.8rem; color: #f87171; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      Локальный режим (офлайн-копия разбора)
    </div>
  ` : '';

  // Inject full template inside sidebar
  contentContainer.innerHTML = `
    ${alertHTML}

    <!-- Block 1: Original Phrase with Speech Synthesis -->
    <div class="analysis-card">
      <div class="card-label">
        Оригинальная фраза 
        <button class="speak-btn" id="speakBtn" title="Прослушать произношение">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        </button>
      </div>
      <div class="card-title">${escapeHTML(originalText)}</div>
    </div>

    <!-- Block 2: Premium Professional Translation -->
    <div class="analysis-card">
      <div class="card-label" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <span>Перевод от ИИ</span>
        <button id="retranslateStanzaBtn" class="premium-micro-btn" style="background: rgba(29, 185, 84, 0.1); border: 1px solid rgba(29, 185, 84, 0.2); color: var(--accent-spotify); font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 20px; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;" title="Сбросить кэш и получить свежий точный перевод от Gemini">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transform: scaleX(-1);">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          Перевести заново
        </button>
      </div>
      <div class="translation-text">${escapeHTML(data.translation)}</div>
    </div>

    <!-- Block 3: AI Grammar Analysis -->
    ${grammarHTML}

    <!-- Block 3.5: Cultural Lore -->
    ${loreHTML}

    <!-- Block 4: Vocabulary & Lexical Approach Analysis -->
    ${vocabularyHTML}
    ${phrasesHTML}
  `;

  // Bind Web Speech Audio synthesiser
  const speakButton = document.getElementById('speakBtn');
  if (speakButton) {
    speakButton.addEventListener('click', () => {
      speakText(originalText);
    });
  }

  // Bind Re-translate Button (clears cache and runs live translation)
  const retranslateBtn = document.getElementById('retranslateStanzaBtn');
  if (retranslateBtn) {
    retranslateBtn.addEventListener('mouseenter', () => {
      retranslateBtn.style.background = 'rgba(29, 185, 84, 0.2)';
      retranslateBtn.style.boxShadow = '0 0 12px rgba(29, 185, 84, 0.2)';
    });
    retranslateBtn.addEventListener('mouseleave', () => {
      retranslateBtn.style.background = 'rgba(29, 185, 84, 0.1)';
      retranslateBtn.style.boxShadow = 'none';
    });
    retranslateBtn.addEventListener('click', async () => {
      // Clear in-memory and persistent local cache for this specific stanza
      delete analysisCache[originalText];
      localStorage.removeItem('lyric_cache_' + originalText);
      
      const contentContainer = sidebarPanel.querySelector('.sidebar-content');
      const cachedTranslation = analysisCache[originalText]?.translation || activeLineData?.translation || 'Загрузка перевода…';
      mountSidebarLoadingPhraseGame(contentContainer, originalText, cachedTranslation);
      
      try {
        const song = songsData[currentSongKey];
        const songTitle = song ? song.title : "Песня";
        const artistName = song ? song.artist : "Исполнитель";
        
        // Fetch fresh correct translation with updated AI prompts
        const aiData = await fetchGeminiAnalysis(originalText, artistName, songTitle);
        
        analysisCache[originalText] = aiData;
        setCachedAnalysis(originalText, aiData);
        
        // Re-render sidebar and automatically update the Phrase Builder!
        renderSidebarData(originalText, aiData);
      } catch (err) {
        console.error("Retranslate failed:", err);
        alert("Не удалось перевести заново: " + err.message);
      }
    });
  }



  // Automatically load the clicked line into the Phrase Builder game for instant practice!
  const englishLines = originalText.split('\n').map(x => x.trim()).filter(x => x.length > 0);
  const translationText = data.translation || "Перевод фразы";
  
  if (englishLines.length > 0) {
    const lineIdx = 0;
    const activeEngLine = englishLines[lineIdx];
    
    let highlightedHTML = null;
    
    if (data.lines && Array.isArray(data.lines) && data.lines.length > 0) {
      // Premium Line-by-Line Match!
      highlightedHTML = data.lines.map((lineObj) => {
        const isTarget = lineObj.english.trim().toLowerCase() === activeEngLine.toLowerCase();
        if (isTarget) {
          return `<div style="color: var(--accent-spotify); font-weight: 700; text-decoration: underline; text-underline-offset: 4px; display: block; margin: 2px 0;">${lineObj.russian}</div>`;
        }
        return `<div style="opacity: 0.4; display: block; margin: 2px 0;">${lineObj.russian}</div>`;
      }).join('');
    } else {
      // Legacy Fallback Split by Newline
      const fallbackRussianLines = translationText.split('\n').map(x => x.trim()).filter(x => x.length > 0);
      const targetPartIdx = Math.min(lineIdx, fallbackRussianLines.length - 1);
      
      if (fallbackRussianLines.length > 0) {
        highlightedHTML = fallbackRussianLines.map((part, pIdx) => {
          if (pIdx === targetPartIdx) {
            return `<div style="color: var(--accent-spotify); font-weight: 700; text-decoration: underline; text-underline-offset: 4px; display: block; margin: 2px 0;">${part}</div>`;
          }
          return `<div style="opacity: 0.4; display: block; margin: 2px 0;">${part}</div>`;
        }).join('');
      } else {
        highlightedHTML = `<div style="color: var(--accent-spotify); font-weight: 700; text-decoration: underline; text-underline-offset: 4px;">${translationText}</div>`;
      }
    }

    initPhraseBuilder(activeEngLine, translationText, highlightedHTML);
  }
}



// Pick a playable phrase from any already-loaded song (for loading screens)
function pickRandomPhraseFromLoadedSongs(excludeSongId = null) {
  const pool = [];

  Object.keys(songsData).forEach(key => {
    if (excludeSongId && key === excludeSongId) return;
    const song = songsData[key];
    if (!song || !song.lines) return;

    song.lines.forEach(stanza => {
      const englishLines = stanza.text.split('\n').map(x => x.trim()).filter(x => x.length > 0);
      let translationText = stanza.translation || 'Перевод фразы';
      const stanzaData = analysisCache[stanza.text];
      if (stanzaData && stanzaData.translation) {
        translationText = stanzaData.translation;
      }

      englishLines.forEach(engLine => {
        const wordsCount = engLine.split(/\s+/).filter(w => w.trim().length > 0).length;
        if (wordsCount >= 3 && wordsCount <= 18) {
          pool.push({ text: engLine, translation: translationText });
        }
      });
    });
  });

  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

const LOADING_PHRASE_FALLBACK = {
  text: "Listening to the wind of change",
  translation: "Вслушиваясь в ветер перемен"
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getFirstPlayableLineFromStanza(stanzaText) {
  if (!stanzaText) return '';
  const lines = stanzaText.split('\n').map(x => x.trim()).filter(x => x.length > 0);
  for (const line of lines) {
    const wordsCount = line.split(/\s+/).filter(w => w.trim().length > 0).length;
    if (wordsCount >= 3 && wordsCount <= 18) return line;
  }
  return lines[0] || stanzaText.replace(/\n/g, ' ').trim();
}

function showPhraseGameWhileLyricsLoading(excludeSongId) {
  const phraseBuilder = document.getElementById('phrase-builder');
  const audioDictation = document.getElementById('audio-dictation');
  if (audioDictation) audioDictation.style.display = 'none';

  const candidate = pickRandomPhraseFromLoadedSongs(excludeSongId) || LOADING_PHRASE_FALLBACK;
  const cardLabel = phraseBuilder ? phraseBuilder.querySelector('.card-label') : null;
  if (cardLabel) {
    cardLabel.textContent = '⏳ Phrase Builder — пока загружается текст';
  }

  initPhraseBuilder(candidate.text, candidate.translation, null, {
    skipAudio: true,
    loadingPrefix: 'Пока загружается текст песни — соберите фразу: '
  });
}

function mountSidebarLoadingPhraseGame(container, originalText, translation, highlightedHTML = null) {
  if (!container) return;

  const playableLine = getFirstPlayableLineFromStanza(originalText);
  const cleanTranslation = (translation || 'Загрузка перевода…').replace(/\s+/g, ' ').trim();

  let hintHTML = `Соберите строку: "<span style="color: var(--accent-spotify); font-weight: 700;">${escapeHtml(cleanTranslation)}</span>"`;
  if (!cleanTranslation || cleanTranslation.includes('Загрузка перевода') || cleanTranslation.includes('…') || cleanTranslation.includes('...')) {
    hintHTML = `Соберите английское предложение по порядку слов (перевод ИИ загружается...):`;
  } else if (highlightedHTML) {
    hintHTML = `Соберите строку по смыслу: ${highlightedHTML}`;
  }

  container.innerHTML = `
    <div class="analysis-card sidebar-phrase-game" style="padding: 1.1rem 1.2rem; display: flex; flex-direction: column; gap: 10px;">
      <div style="font-size: 0.72rem; font-weight: 700; color: #8b5cf6; text-transform: uppercase; letter-spacing: 0.6px; display: flex; align-items: center; gap: 8px;">
        <span class="pulse-dot-violet" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#8b5cf6;box-shadow:0 0 8px #8b5cf6;"></span>
        ИИ готовит разбор…
      </div>
      <p class="phrase-builder-hint" style="font-size: 0.82rem; color: var(--text-sub); margin: 0; font-style: italic; line-height: 1.45;">${hintHTML}</p>
      <div class="build-zone" style="min-height: 48px;"></div>
      <div class="pool-zone" style="min-height: 48px;"></div>
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 2px;">
        <button type="button" class="check-phrase-btn" style="background: var(--accent-spotify); padding: 7px 16px; border-radius: 20px; font-size: 0.78rem; border: none; color: #000; font-weight: 700; cursor: pointer;">Ответить</button>
        <div class="phrase-feedback" style="font-size: 0.8rem; font-weight: 600;"></div>
      </div>
    </div>
  `;

  const mountRoot = container.querySelector('.sidebar-phrase-game');
  initPhraseBuilder(playableLine, translation, highlightedHTML, {
    mountRoot,
    skipAudio: true
  });
}

// Phrase Builder Mini-Game: word order trainer for grammar mastery
function initPhraseBuilder(originalText, translation, highlightedHTML = null, opts = {}) {
  const isSidebarMount = !!opts.mountRoot;
  const container = opts.mountRoot || document.getElementById('phrase-builder');
  if (!container) return;

  if (!isSidebarMount) {
    currentActivePhraseText = originalText;
    if (!opts.skipAudio) {
      initAudioDictation(originalText, translation);
    }
    container.style.display = 'flex';

    const cardLabel = container.querySelector('.card-label');
    if (cardLabel && !opts.loadingPrefix) {
      cardLabel.textContent = '🏆 Phrase Builder — Тренажер порядка слов';
    } else if (cardLabel && opts.loadingPrefix) {
      cardLabel.textContent = '⏳ Phrase Builder — пока загружается текст';
    }
  } else {
    currentActivePhraseText = originalText;
  }

  const buildZone = container.querySelector('.build-zone');
  const poolZone = container.querySelector('.pool-zone');
  if (!buildZone || !poolZone) return;

  // Update dynamic Russian hint text
  const hintEl = container.querySelector('.phrase-builder-hint') || document.getElementById('phrase-builder-hint');
  if (hintEl && !isSidebarMount) {
    const prefix = opts.loadingPrefix || '';
    if (highlightedHTML) {
      hintEl.innerHTML = `${prefix}Собирайте предложение по смыслу: ${highlightedHTML}`;
    } else {
      const cleanTranslation = (translation || '').replace(/\s+/g, ' ').trim();
      if (!cleanTranslation || cleanTranslation.includes('Загрузка перевода') || cleanTranslation.includes('…') || cleanTranslation.includes('...')) {
        hintEl.innerHTML = `${prefix}Соберите английское предложение по порядку слов (перевод ИИ загружается...):`;
      } else {
        hintEl.innerHTML = `${prefix}Собирайте предложение по смыслу: "<span style="color: var(--accent-spotify); font-weight: 700; text-decoration: underline; text-underline-offset: 4px;">${escapeHtml(cleanTranslation)}</span>"`;
      }
    }
  }

  // Clear existing items and reset states
  buildZone.innerHTML = '';
  poolZone.innerHTML = '';
  buildZone.classList.remove('success-glow', 'error-glow');
  
  const feedbackMsg = container.querySelector('.phrase-feedback') || document.getElementById('phraseFeedbackMsg');
  if (feedbackMsg) {
    feedbackMsg.textContent = '';
    feedbackMsg.style.color = '';
  }

  // Prepare and clean the target phrase words cleanly (cross-browser robust stripping)
  const targetWords = originalText
    .split(/\s+/)
    .map(word => word.replace(/^[^a-zA-Z0-9'-]+|[^a-zA-Z0-9'-]+$/g, "").toLowerCase())
    .filter(word => word.length > 0);

  if (targetWords.length === 0) return;

  // Shuffle target words using Fisher-Yates algorithm
  const shuffledWords = [...targetWords];
  for (let i = shuffledWords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledWords[i], shuffledWords[j]] = [shuffledWords[j], shuffledWords[i]];
  }

  // Render shuffled word pills into pool-zone
  shuffledWords.forEach(word => {
    const wordPill = document.createElement('div');
    wordPill.className = 'word-pill';
    wordPill.textContent = word;
    
    // Direct click-to-move toggler between build-zone and pool-zone
    wordPill.addEventListener('click', () => {
      // Clear visual feedback on user interaction to let them try again fresh
      buildZone.classList.remove('success-glow', 'error-glow');
      if (feedbackMsg) {
        feedbackMsg.textContent = '';
        feedbackMsg.style.color = '';
      }

      if (wordPill.parentElement === poolZone) {
        buildZone.appendChild(wordPill);
      } else {
        poolZone.appendChild(wordPill);
      }
    });

    poolZone.appendChild(wordPill);
  });

  // Handle explicit check button click
  const checkBtn = container.querySelector('#checkPhraseBtn') || container.querySelector('.check-phrase-btn');
  if (checkBtn) {
    // Clone and replace to clean previous event listeners
    const newCheckBtn = checkBtn.cloneNode(true);
    checkBtn.parentNode.replaceChild(newCheckBtn, checkBtn);
    
    // Reset button label on fresh phrase load
    const btnSpan = newCheckBtn.querySelector('span');
    if (btnSpan) btnSpan.textContent = 'Ответить';
    if (!btnSpan && !isSidebarMount) newCheckBtn.textContent = 'Ответить';
    if (!btnSpan && isSidebarMount) newCheckBtn.textContent = 'Ответить';
    delete newCheckBtn.dataset.state;
    
    newCheckBtn.addEventListener('click', () => {
      // If already correct, next click loads a new phrase (main panel only)
      if (newCheckBtn.dataset.state === 'correct') {
        if (!isSidebarMount) {
          generateRandomPhraseGame(currentSongKey);
        }
        return;
      }

      const builtPills = buildZone.querySelectorAll('.word-pill');
      
      // Reset animations/feedback before evaluation
      buildZone.classList.remove('success-glow', 'error-glow');
      void buildZone.offsetWidth; // trigger browser reflow to reset CSS keyframe animation
      
      if (builtPills.length === 0) {
        if (feedbackMsg) {
          feedbackMsg.textContent = "⚠️ Сначала выберите слова!";
          feedbackMsg.style.color = "#f59e0b"; // warning yellow
        }
        buildZone.classList.add('error-glow');
        return;
      }
      
      // Verify correctness (all words must be placed and match order)
      const isCorrect = builtPills.length === targetWords.length && Array.from(builtPills).every((pill, index) => {
        return pill.textContent === targetWords[index];
      });
      
      if (isCorrect) {
        buildZone.classList.add('success-glow');
        if (feedbackMsg) {
          feedbackMsg.textContent = "🎉 Превосходно! Абсолютно верно!";
          feedbackMsg.style.color = "#10b981"; // success green
        }
        
        // Transition button state to Next Phrase
        if (btnSpan) btnSpan.textContent = 'Следующая фраза';
        newCheckBtn.dataset.state = 'correct';
      } else {
        buildZone.classList.add('error-glow');
        if (feedbackMsg) {
          const correctAnswer = targetWords.join(' ');
          feedbackMsg.innerHTML = `❌ Неправильно. Попробуйте другой порядок!<br><span style="display:inline-block; margin-top:0.4rem; font-size:0.9rem; opacity:0.85; color:var(--text-main);">Правильный ответ: <strong style="color:var(--accent-spotify); text-shadow:0 0 8px rgba(29,185,84,0.15);">${correctAnswer}</strong></span>`;
          feedbackMsg.style.color = "#ef4444"; // error red
        }
      }
    });
  }
}

// Generates a random phrase builder game from any line of the selected song
function generateRandomPhraseGame(songKey) {
  const song = songsData[songKey];
  if (!song || !song.lines) return;

  const pool = [];

  song.lines.forEach(stanza => {
    const englishLines = stanza.text.split('\n').map(x => x.trim()).filter(x => x.length > 0);
    
    // Retrieve translation (check local cache first if dynamic)
    let translationText = stanza.translation;
    const stanzaData = analysisCache[stanza.text];
    if ((!translationText || translationText === "Перевод фразы") && stanzaData) {
      translationText = stanzaData.translation;
    }
    
    if (!translationText) translationText = "Перевод фразы";

    englishLines.forEach((engLine, idx) => {
      const wordsCount = engLine.split(/\s+/).filter(w => w.trim().length > 0).length;
      if (wordsCount >= 3 && wordsCount <= 18) {
        let highlightedHTML = null;
        
        if (stanzaData && stanzaData.lines && Array.isArray(stanzaData.lines) && stanzaData.lines.length > 0) {
          // Premium Line-by-Line Match!
          highlightedHTML = stanzaData.lines.map((lineObj) => {
            const isTarget = lineObj.english.trim().toLowerCase() === engLine.toLowerCase();
            if (isTarget) {
              return `<div style="color: var(--accent-spotify); font-weight: 700; text-decoration: underline; text-underline-offset: 4px; display: block; margin: 2px 0;">${lineObj.russian}</div>`;
            }
            return `<div style="opacity: 0.4; display: block; margin: 2px 0;">${lineObj.russian}</div>`;
          }).join('');
        } else {
          // Legacy Fallback Split by Newline
          const fallbackRussianLines = translationText.split('\n').map(x => x.trim()).filter(x => x.length > 0);
          const targetPartIdx = Math.min(idx, fallbackRussianLines.length - 1);
          
          if (fallbackRussianLines.length > 0) {
            highlightedHTML = fallbackRussianLines.map((part, pIdx) => {
              if (pIdx === targetPartIdx) {
                return `<div style="color: var(--accent-spotify); font-weight: 700; text-decoration: underline; text-underline-offset: 4px; display: block; margin: 2px 0;">${part}</div>`;
              }
              return `<div style="opacity: 0.4; display: block; margin: 2px 0;">${part}</div>`;
            }).join('');
          } else {
            highlightedHTML = `<div style="color: var(--accent-spotify); font-weight: 700; text-decoration: underline; text-underline-offset: 4px;">${translationText}</div>`;
          }
        }

        pool.push({
          text: engLine,
          translation: translationText, // Always show the FULL stanza translation!
          highlightedHTML: highlightedHTML,
          parentStanzaText: stanza.text // Store parent stanza text for real-time fetch if cache missing!
        });
      }
    });
  });

  let selected = null;
  const filteredPool = pool.filter(item => item.text.trim().toLowerCase() !== currentActivePhraseText.trim().toLowerCase());
  
  if (filteredPool.length > 0) {
    selected = filteredPool[Math.floor(Math.random() * filteredPool.length)];
  } else if (pool.length > 0) {
    selected = pool[Math.floor(Math.random() * pool.length)]; // Fallback if song has only 1 line
  } else {
    selected = { text: "No valid lines", translation: "" };
  }

  initPhraseBuilder(selected.text, selected.translation, selected.highlightedHTML);

  // If the selected stanza doesn't have an AI translation yet, trigger an automatic silent fetch!
  if (selected.parentStanzaText && !analysisCache[selected.parentStanzaText]) {
    console.log(`[Game Auto-Fetch] Stanza not cached. Fetching: "${selected.parentStanzaText.substring(0, 30)}..."`);
    
    // Show a beautiful pulsing shimmer placeholder in the hint zone
    const hintElement = document.getElementById('phrase-builder-hint');
    if (hintElement) {
      hintElement.innerHTML = `<span style="opacity: 0.6; font-style: italic; animation: pulse 1.5s infinite;">⏳ ИИ переводит строфу в реальном времени...</span>`;
    }

    fetchGeminiAnalysis(selected.parentStanzaText, song.artist, song.title)
      .then(aiData => {
        // Cache it!
        analysisCache[selected.parentStanzaText] = aiData;
        setCachedAnalysis(selected.parentStanzaText, aiData);

        // Regenerate the highlight HTML!
        const activeEngLine = selected.text;
        let highlightedHTML = null;
        if (aiData.lines && Array.isArray(aiData.lines) && aiData.lines.length > 0) {
          highlightedHTML = aiData.lines.map((lineObj) => {
            const isTarget = lineObj.english.trim().toLowerCase() === activeEngLine.toLowerCase();
            if (isTarget) {
              return `<div style="color: var(--accent-spotify); font-weight: 700; text-decoration: underline; text-underline-offset: 4px; display: block; margin: 2px 0;">${lineObj.russian}</div>`;
            }
            return `<div style="opacity: 0.4; display: block; margin: 2px 0;">${lineObj.russian}</div>`;
          }).join('');
        } else {
          const fallbackRussianLines = (aiData.translation || "").split('\n').map(x => x.trim()).filter(x => x.length > 0);
          if (fallbackRussianLines.length > 0) {
            highlightedHTML = fallbackRussianLines.map((part, pIdx) => {
              if (pIdx === 0) { // First line target fallback
                return `<div style="color: var(--accent-spotify); font-weight: 700; text-decoration: underline; text-underline-offset: 4px; display: block; margin: 2px 0;">${part}</div>`;
              }
              return `<div style="opacity: 0.4; display: block; margin: 2px 0;">${part}</div>`;
            }).join('');
          } else {
            highlightedHTML = `<div style="color: var(--accent-spotify); font-weight: 700; text-decoration: underline; text-underline-offset: 4px;">${aiData.translation}</div>`;
          }
        }

        // Dynamically update the hint zone!
        if (hintElement) {
          hintElement.innerHTML = highlightedHTML;
        }
      })
      .catch(err => {
        console.warn("[Game Auto-Fetch] Failed:", err);
        if (hintElement) {
          hintElement.innerHTML = `<span style="color: #ef4444; font-size: 0.85rem;">⚠️ Не удалось загрузить перевод ИИ. Нажмите на строчку слева для ручного запроса.</span>`;
        }
      });
  }
}
