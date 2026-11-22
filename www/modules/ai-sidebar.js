// @ts-check
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - AI SIDEBAR CONTROLLER
 * Sidebar UI rendering, phrase builder integration, grammar cards, song meaning,
 * and audio speech synchronization.
 * @AI-SECTION: AI_SIDEBAR_CONTROLLER
 * ============================================================================
 */

function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const getSidebarPanel = () => document.getElementById('aiSidebar') || document.querySelector('.ai-sidebar');

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

    if (typeof window.initPhraseBuilder === 'function') {
      window.initPhraseBuilder(activeEngLine, translationText, highlightedHTML);
    }
  }
}



// Global exposure
if (typeof window !== 'undefined') {
  window.renderSongMeaningSidebar = renderSongMeaningSidebar;
  window.renderSidebarData = renderSidebarData;
}
