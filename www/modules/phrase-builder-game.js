// @ts-check
/**
 * @file phrase-builder-game.js
 * @description Interactive Word-Order Phrase Builder Mini-Game for AI Lyric-Trainer.
 * Allows users to practice English word order, grammar, and sentence structure
 * by reconstructing song stanzas either in the dedicated panel or inside the AI sidebar.
 * 
 * @AI-SECTION: PHRASE_BUILDER_GAME
 */

const LOADING_PHRASE_FALLBACK = {
  text: "Listening to the wind of change",
  translation: "Вслушиваясь в ветер перемен"
};

/**
 * Escapes unsafe HTML characters in a string.
 * @param {string} str 
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Picks a playable phrase from any already-loaded song (used for instant loading screens).
 * @param {string|null} [excludeSongId=null]
 * @returns {{ text: string, translation: string } | null}
 */
function pickRandomPhraseFromLoadedSongs(excludeSongId = null) {
  const pool = [];
  const songsData = window.songsData || {};
  const analysisCache = window.analysisCache || {};

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

/**
 * Extracts the first playable line (3-18 words) from a multi-line stanza.
 * @param {string} stanzaText 
 * @returns {string}
 */
function getFirstPlayableLineFromStanza(stanzaText) {
  if (!stanzaText) return '';
  const lines = stanzaText.split('\n').map(x => x.trim()).filter(x => x.length > 0);
  for (const line of lines) {
    const wordsCount = line.split(/\s+/).filter(w => w.trim().length > 0).length;
    if (wordsCount >= 3 && wordsCount <= 18) return line;
  }
  return lines[0] || stanzaText.replace(/\n/g, ' ').trim();
}

/**
 * Displays a lightweight phrase builder game while lyrics or audio are still loading.
 * @param {string} [excludeSongId]
 */
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

/**
 * Mounts an interactive phrase ordering game inside the AI sidebar while Gemini is analyzing.
 * @param {HTMLElement} container 
 * @param {string} originalText 
 * @param {string} translation 
 * @param {string|null} [highlightedHTML=null] 
 */
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

/**
 * Initializes and mounts the interactive Phrase Builder game.
 * @param {string} originalText 
 * @param {string} translation 
 * @param {string|null} [highlightedHTML=null] 
 * @param {object} [opts={}] 
 */
function initPhraseBuilder(originalText, translation, highlightedHTML = null, opts = {}) {
  const isSidebarMount = !!opts.mountRoot;
  const container = opts.mountRoot || document.getElementById('phrase-builder');
  if (!container) return;

  if (!isSidebarMount) {
    window.currentActivePhraseText = originalText;
    if (!opts.skipAudio && typeof window.initAudioDictation === 'function') {
      window.initAudioDictation(originalText, translation);
    }
    container.style.display = 'flex';

    const cardLabel = container.querySelector('.card-label');
    if (cardLabel && !opts.loadingPrefix) {
      cardLabel.textContent = '🏆 Phrase Builder — Тренажер порядка слов';
    } else if (cardLabel && opts.loadingPrefix) {
      cardLabel.textContent = '⏳ Phrase Builder — пока загружается текст';
    }
  } else {
    window.currentActivePhraseText = originalText;
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

  // Prepare and clean target phrase words cleanly
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
    const newCheckBtn = checkBtn.cloneNode(true);
    checkBtn.parentNode.replaceChild(newCheckBtn, checkBtn);
    
    const btnSpan = newCheckBtn.querySelector('span');
    if (btnSpan) btnSpan.textContent = 'Ответить';
    if (!btnSpan && !isSidebarMount) newCheckBtn.textContent = 'Ответить';
    if (!btnSpan && isSidebarMount) newCheckBtn.textContent = 'Ответить';
    delete newCheckBtn.dataset.state;
    
    newCheckBtn.addEventListener('click', () => {
      if (newCheckBtn.dataset.state === 'correct') {
        if (!isSidebarMount) {
          generateRandomPhraseGame(window.currentSongKey);
        }
        return;
      }

      const builtPills = buildZone.querySelectorAll('.word-pill');
      buildZone.classList.remove('success-glow', 'error-glow');
      void buildZone.offsetWidth; // trigger reflow to restart CSS animation
      
      if (builtPills.length === 0) {
        if (feedbackMsg) {
          feedbackMsg.textContent = "⚠️ Сначала выберите слова!";
          feedbackMsg.style.color = "#f59e0b";
        }
        buildZone.classList.add('error-glow');
        return;
      }
      
      const isCorrect = builtPills.length === targetWords.length && Array.from(builtPills).every((pill, index) => {
        return pill.textContent === targetWords[index];
      });
      
      if (isCorrect) {
        buildZone.classList.add('success-glow');
        if (feedbackMsg) {
          feedbackMsg.textContent = "🎉 Превосходно! Абсолютно верно!";
          feedbackMsg.style.color = "#10b981";
        }
        
        if (btnSpan) btnSpan.textContent = 'Следующая фраза';
        newCheckBtn.dataset.state = 'correct';
      } else {
        buildZone.classList.add('error-glow');
        if (feedbackMsg) {
          const correctAnswer = targetWords.join(' ');
          feedbackMsg.innerHTML = `❌ Неправильно. Попробуйте другой порядок!<br><span style="display:inline-block; margin-top:0.4rem; font-size:0.9rem; opacity:0.85; color:var(--text-main);">Правильный ответ: <strong style="color:var(--accent-spotify); text-shadow:0 0 8px rgba(29,185,84,0.15);">${correctAnswer}</strong></span>`;
          feedbackMsg.style.color = "#ef4444";
        }
      }
    });
  }
}

/**
 * Generates a random phrase builder game from any line of the selected song.
 * @param {string} songKey 
 */
function generateRandomPhraseGame(songKey) {
  if (typeof window.hasAPIKey === 'function' && !window.hasAPIKey()) return;
  
  const songsData = window.songsData || {};
  const analysisCache = window.analysisCache || {};
  const currentActivePhraseText = window.currentActivePhraseText || '';

  const song = songsData[songKey];
  if (!song || !song.lines) return;

  const pool = [];

  song.lines.forEach(stanza => {
    const englishLines = stanza.text.split('\n').map(x => x.trim()).filter(x => x.length > 0);
    
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
          highlightedHTML = stanzaData.lines.map((lineObj) => {
            const isTarget = lineObj.english.trim().toLowerCase() === engLine.toLowerCase();
            if (isTarget) {
              return `<div style="color: var(--accent-spotify); font-weight: 700; text-decoration: underline; text-underline-offset: 4px; display: block; margin: 2px 0;">${lineObj.russian}</div>`;
            }
            return `<div style="opacity: 0.4; display: block; margin: 2px 0;">${lineObj.russian}</div>`;
          }).join('');
        } else {
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
          translation: translationText,
          highlightedHTML: highlightedHTML,
          parentStanzaText: stanza.text
        });
      }
    });
  });

  let selected = null;
  const filteredPool = pool.filter(item => item.text.trim().toLowerCase() !== currentActivePhraseText.trim().toLowerCase());
  
  if (filteredPool.length > 0) {
    selected = filteredPool[Math.floor(Math.random() * filteredPool.length)];
  } else if (pool.length > 0) {
    selected = pool[Math.floor(Math.random() * pool.length)];
  } else {
    selected = { text: "No valid lines", translation: "" };
  }

  initPhraseBuilder(selected.text, selected.translation, selected.highlightedHTML);

  // If the selected stanza doesn't have an AI translation yet, trigger an automatic fetch
  if (selected.parentStanzaText && !analysisCache[selected.parentStanzaText] && typeof window.fetchGeminiAnalysis === 'function') {
    const hintElement = document.getElementById('phrase-builder-hint');
    if (hintElement) {
      hintElement.innerHTML = `<span style="opacity: 0.6; font-style: italic; animation: pulse 1.5s infinite;">⏳ ИИ переводит строфу в реальном времени...</span>`;
    }

    window.fetchGeminiAnalysis(selected.parentStanzaText, song.artist, song.title)
      .then(aiData => {
        analysisCache[selected.parentStanzaText] = aiData;
        if (typeof window.setCachedAnalysis === 'function') {
          window.setCachedAnalysis(selected.parentStanzaText, aiData);
        }

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
              if (pIdx === 0) {
                return `<div style="color: var(--accent-spotify); font-weight: 700; text-decoration: underline; text-underline-offset: 4px; display: block; margin: 2px 0;">${part}</div>`;
              }
              return `<div style="opacity: 0.4; display: block; margin: 2px 0;">${part}</div>`;
            }).join('');
          } else {
            highlightedHTML = `<div style="color: var(--accent-spotify); font-weight: 700; text-decoration: underline; text-underline-offset: 4px;">${aiData.translation}</div>`;
          }
        }

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

// Global window exposure for modular interoperability
window.pickRandomPhraseFromLoadedSongs = pickRandomPhraseFromLoadedSongs;
window.getFirstPlayableLineFromStanza = getFirstPlayableLineFromStanza;
window.showPhraseGameWhileLyricsLoading = showPhraseGameWhileLyricsLoading;
window.mountSidebarLoadingPhraseGame = mountSidebarLoadingPhraseGame;
window.initPhraseBuilder = initPhraseBuilder;
window.generateRandomPhraseGame = generateRandomPhraseGame;
