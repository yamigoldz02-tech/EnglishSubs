// @ts-check
/// <reference path="./types.js" />
/**
 * @AI-SECTION: GEMINI_AI_ENGINE
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
// Prefetch queue logic → moved to modules/ai-prefetch.js

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

// renderSongMeaningSidebar() → moved to modules/ai-sidebar.js

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
// renderSidebarData() → moved to modules/ai-sidebar.js

// Expose global methods
if (typeof window !== "undefined") {
  window.fetchGeminiAnalysis = fetchGeminiAnalysis;
  window.analyzeSongMeaning = analyzeSongMeaning;
  window.triggerSidebarAnalysis = triggerSidebarAnalysis;
}
