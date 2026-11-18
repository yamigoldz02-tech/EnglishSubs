// @ts-check
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - IRREGULAR VERBS MODULE & LEARNING ENGINE
 * Complete Hub for browsing, dictionary integration, and interactive practice
 * of English irregular verb forms (V1 Base, V2 Past Simple, V3 Past Participle).
 * @AI-SECTION: IRREGULAR_VERBS_ENGINE
 * ============================================================================
 */

(function() {
  // State variables
  let activeTab = 'catalog'; // 'catalog' or 'trainer'
  let catalogFilter = 'top30'; // 'top30', 'top60', 'all', 'in_dict'
  let catalogSearch = '';
  
  // Trainer State
  let trainerMode = 'input'; // 'input', 'flashcard', 'quiz'
  let trainerScope = 'top30'; // 'top30', 'top60', 'all', 'my_verbs'
  let trainerQueue = [];
  let trainerCurrentIndex = 0;
  let trainerScore = { correct: 0, total: 0 };
  let isCardFlipped = false;
  let hasUsedHint = false;

  /**
   * Escape HTML entities to prevent XSS
   * @param {string} str
   * @returns {string}
   */
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Check if a verb (by V1) is already in the user's personal dictionary
   * @param {string} v1
   * @returns {any|null}
   */
  function getDictEntry(v1) {
    if (!v1 || typeof window.personalDictionary === 'undefined') return null;
    const q = v1.trim().toLowerCase();
    return window.personalDictionary.find(w => 
      (w.v1 && w.v1.toLowerCase() === q) || 
      (w.word && w.word.toLowerCase() === q)
    ) || null;
  }

  /**
   * Load user-defined custom irregular verbs from localStorage
   */
  function loadCustomVerbs() {
    try {
      const saved = localStorage.getItem('custom_irregular_verbs');
      if (saved) {
        const customs = JSON.parse(saved);
        if (Array.isArray(customs)) {
          if (!window.irregularVerbsData) window.irregularVerbsData = [];
          customs.forEach(c => {
            const exists = window.irregularVerbsData.some(v => v.v1.toLowerCase() === c.v1.toLowerCase());
            if (!exists) {
              window.irregularVerbsData.unshift({
                v1: c.v1,
                v2: c.v2,
                v3: c.v3,
                translation: c.translation,
                example: c.example || '',
                group: 'custom',
                isCustom: true
              });
            }
          });
        }
      }
    } catch(e) {
      console.warn('Failed to load custom irregular verbs:', e);
    }
  }

  /**
   * Delete custom irregular verb
   * @param {string} v1
   */
  function deleteCustomVerb(v1) {
    if (!v1) return;
    try {
      const saved = localStorage.getItem('custom_irregular_verbs');
      if (saved) {
        let customs = JSON.parse(saved);
        if (Array.isArray(customs)) {
          customs = customs.filter(c => c.v1.toLowerCase() !== v1.toLowerCase());
          localStorage.setItem('custom_irregular_verbs', JSON.stringify(customs));
        }
      }
      if (window.irregularVerbsData) {
        window.irregularVerbsData = window.irregularVerbsData.filter(v => !(v.isCustom && v.v1.toLowerCase() === v1.toLowerCase()));
      }
      // Also remove from personal dictionary if present
      if (typeof window.personalDictionary !== 'undefined') {
        const inDict = getDictEntry(v1);
        if (inDict) {
          window.personalDictionary = window.personalDictionary.filter(w => w !== inDict);
          if (typeof window.saveDictionaryToStorage === 'function') window.saveDictionaryToStorage();
          if (typeof window.renderDictWordsList === 'function') window.renderDictWordsList();
        }
      }
      renderCatalog();
      updateHeaderStats();
      if (typeof window.showToast === 'function') {
        window.showToast(`Глагол ${v1} удалён.`);
      }
    } catch(e) {
      console.warn('Failed to delete custom verb:', e);
    }
  }

  /**
   * Toggle irregular verb in Personal Dictionary
   * @param {any} verbObj
   */
  function toggleVerbInDict(verbObj) {
    if (!verbObj || !verbObj.v1) return;
    if (typeof window.personalDictionary === 'undefined') window.personalDictionary = [];

    const existing = getDictEntry(verbObj.v1);
    if (existing) {
      // Remove from dictionary
      window.personalDictionary = window.personalDictionary.filter(w => w !== existing);
      if (typeof window.saveDictionaryToStorage === 'function') window.saveDictionaryToStorage();
      if (typeof window.renderDictWordsList === 'function') window.renderDictWordsList();
      if (typeof window.showToast === 'function') {
        window.showToast(`Глагол ${verbObj.v1} удалён из словаря`);
      }
    } else {
      // Add to dictionary
      // Ensure 'Неправильные глаголы' folder exists in personalCategories
      if (typeof window.personalCategories !== 'undefined' && Array.isArray(window.personalCategories)) {
        if (!window.personalCategories.includes('Неправильные глаголы')) {
          window.personalCategories.push('Неправильные глаголы');
          try {
            localStorage.setItem('personal_categories', JSON.stringify(window.personalCategories));
          } catch(e) {}
        }
      }

      const newEntry = {
        word: verbObj.v1,
        translation: verbObj.translation,
        category: 'Неправильные глаголы',
        categories: ['Неправильные глаголы', 'Общее'],
        customCategory: 'Глаголы',
        customCategories: ['Глаголы'],
        type: 'word',
        isIrregular: true,
        v1: verbObj.v1,
        v2: verbObj.v2,
        v3: verbObj.v3,
        example: verbObj.example || '',
        interval: 0,
        level: 0,
        nextReview: Date.now(),
        addedAt: Date.now()
      };

      window.personalDictionary.unshift(newEntry);
      if (typeof window.saveDictionaryToStorage === 'function') window.saveDictionaryToStorage();
      if (typeof window.renderDictWordsList === 'function') window.renderDictWordsList();
      if (typeof window.showToast === 'function') {
        window.showToast(`⚡ ${verbObj.v1} (${verbObj.v2}, ${verbObj.v3}) добавлен в словарь!`);
      }
    }

    renderCatalog();
    updateHeaderStats();
  }

  /**
   * Bulk add pack of verbs to dictionary
   * @param {'top30'|'top60'|'all'} pack
   */
  function addVerbPackToDict(pack) {
    const all = window.irregularVerbsData || [];
    let toAdd = [];
    if (pack === 'top30') toAdd = all.filter(v => v.group === 'top30');
    else if (pack === 'top60') toAdd = all.filter(v => v.group === 'top30' || v.group === 'top60');
    else toAdd = all;

    let addedCount = 0;
    toAdd.forEach(verbObj => {
      if (!getDictEntry(verbObj.v1)) {
        window.personalDictionary.push({
          word: verbObj.v1,
          translation: verbObj.translation,
          category: 'Неправильные глаголы',
          categories: ['Неправильные глаголы', 'Общее'],
          customCategory: 'Глаголы',
          customCategories: ['Глаголы'],
          type: 'word',
          isIrregular: true,
          v1: verbObj.v1,
          v2: verbObj.v2,
          v3: verbObj.v3,
          example: verbObj.example || '',
          interval: 0,
          level: 0,
          nextReview: Date.now(),
          addedAt: Date.now()
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      if (typeof window.personalCategories !== 'undefined' && Array.isArray(window.personalCategories)) {
        if (!window.personalCategories.includes('Неправильные глаголы')) {
          window.personalCategories.push('Неправильные глаголы');
          try {
            localStorage.setItem('personal_categories', JSON.stringify(window.personalCategories));
          } catch(e) {}
        }
      }
      if (typeof window.saveDictionaryToStorage === 'function') window.saveDictionaryToStorage();
      if (typeof window.renderDictWordsList === 'function') window.renderDictWordsList();
      if (typeof window.showToast === 'function') {
        window.showToast(`Добавлено ${addedCount} неправильных глаголов в ваш словарь!`);
      }
    } else {
      if (typeof window.showToast === 'function') {
        window.showToast('Все глаголы этой группы уже есть в вашем словаре.');
      }
    }

    renderCatalog();
    updateHeaderStats();
  }

  /**
   * Pronounce all 3 verb forms in sequence using SpeechSynthesis
   * @param {string} v1
   * @param {string} v2
   * @param {string} v3
   */
  function speakForms(v1, v2, v3) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Clean up slashes like "was / were" into spoken words
    const cleanV2 = v2 ? v2.replace(/\s*\/\s*/g, ', or ') : '';
    const cleanV3 = v3 ? v3.replace(/\s*\/\s*/g, ', or ') : '';
    const text = `${v1}... ${cleanV2}... ${cleanV3}`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Update header badges and counts
   */
  function updateHeaderStats() {
    const all = window.irregularVerbsData || [];
    const totalCountEl = document.getElementById('irregTotalCountBadge');
    const inDictCountEl = document.getElementById('irregInDictCountBadge');
    
    if (totalCountEl) totalCountEl.textContent = `${all.length} глаголов`;
    if (inDictCountEl) {
      let count = 0;
      all.forEach(v => {
        if (getDictEntry(v.v1)) count++;
      });
      inDictCountEl.textContent = `${count} в словаре`;
    }
  }

  /**
   * Render verbs catalog list
   */
  function renderCatalog() {
    const listEl = document.getElementById('irregCatalogList');
    if (!listEl) return;

    const all = window.irregularVerbsData || [];
    const query = catalogSearch.trim().toLowerCase();

    // Filter by group / category
    let filtered = all.filter(item => {
      if (catalogFilter === 'top30') return item.group === 'top30';
      if (catalogFilter === 'top60') return item.group === 'top30' || item.group === 'top60';
      if (catalogFilter === 'in_dict') return !!getDictEntry(item.v1);
      if (catalogFilter === 'custom') return !!item.isCustom;
      return true; // 'all'
    });

    // Filter by search query
    if (query) {
      filtered = filtered.filter(item => {
        return item.v1.toLowerCase().includes(query) ||
               item.v2.toLowerCase().includes(query) ||
               item.v3.toLowerCase().includes(query) ||
               item.translation.toLowerCase().includes(query);
      });
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); font-size: 0.9rem;">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          Ничего не найдено по вашему запросу.
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach(item => {
      const dictEntry = getDictEntry(item.v1);
      const inDict = !!dictEntry;
      const level = inDict ? (dictEntry.level || 0) : null;

      const card = document.createElement('div');
      card.className = 'irreg-verb-card' + (inDict ? ' in-dict' : '');

      card.innerHTML = `
        <div class="irreg-card-main">
          <div class="irreg-forms-row">
            <div class="irreg-form-item v1">
              <span class="irreg-form-label">V1</span>
              <span class="irreg-form-val">${escapeHTML(item.v1)}</span>
            </div>
            <div class="irreg-arrow">→</div>
            <div class="irreg-form-item v2">
              <span class="irreg-form-label">V2 (Past)</span>
              <span class="irreg-form-val">${escapeHTML(item.v2)}</span>
            </div>
            <div class="irreg-arrow">→</div>
            <div class="irreg-form-item v3">
              <span class="irreg-form-label">V3 (Participle)</span>
              <span class="irreg-form-val">${escapeHTML(item.v3)}</span>
            </div>
          </div>
          <div class="irreg-trans-row">
            <span class="irreg-trans-text">${escapeHTML(item.translation)}</span>
            ${item.example ? `<span class="irreg-example-text">«${escapeHTML(item.example)}»</span>` : ''}
          </div>
        </div>

        <div class="irreg-card-actions">
          ${item.isCustom ? `
            <button class="irreg-btn-del-custom" style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); color: #ef4444; width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; outline: none; flex-shrink: 0;" title="Удалить свой глагол">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          ` : ''}
          <button class="irreg-btn-speak" title="Озвучить 3 формы" aria-label="Озвучить">
            <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          </button>
          <button class="irreg-btn-dict ${inDict ? 'active' : ''}" title="${inDict ? 'В вашем словаре' : 'Добавить в личный словарь'}">
            ${inDict ? `✓ В словаре ${level > 0 ? `(Lvl ${level})` : ''}` : '+ В словарь'}
          </button>
        </div>
      `;

      // Event handlers
      if (item.isCustom) {
        const delBtn = card.querySelector('.irreg-btn-del-custom');
        if (delBtn) {
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCustomVerb(item.v1);
          });
        }
      }

      const speakBtn = card.querySelector('.irreg-btn-speak');
      if (speakBtn) {
        speakBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          speakForms(item.v1, item.v2, item.v3);
        });
      }

      const dictBtn = card.querySelector('.irreg-btn-dict');
      if (dictBtn) {
        dictBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleVerbInDict(item);
        });
      }

      fragment.appendChild(card);
    });

    listEl.innerHTML = '';
    listEl.appendChild(fragment);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TRAINER ENGINE LOGIC
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Start or restart training session
   * @param {'top30'|'top60'|'all'|'my_verbs'} [scope]
   * @param {'input'|'flashcard'|'quiz'} [mode]
   */
  function startTrainer(scope, mode) {
    if (scope) trainerScope = scope;
    if (mode) trainerMode = mode;

    const all = window.irregularVerbsData || [];
    let pool = [];

    if (trainerScope === 'my_verbs') {
      pool = all.filter(v => !!getDictEntry(v.v1));
      if (pool.length === 0) {
        // Fallback to top30 with notice
        pool = all.filter(v => v.group === 'top30');
        if (typeof window.showToast === 'function') {
          window.showToast('В словаре пока нет неправильных глаголов. Запущена тренировка Топ-30.');
        }
      }
    } else if (trainerScope === 'top30') {
      pool = all.filter(v => v.group === 'top30');
    } else if (trainerScope === 'top60') {
      pool = all.filter(v => v.group === 'top30' || v.group === 'top60');
    } else {
      pool = [...all];
    }

    // Shuffle pool (Fisher-Yates)
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    trainerQueue = shuffled.slice(0, Math.min(25, shuffled.length));
    trainerCurrentIndex = 0;
    trainerScore = { correct: 0, total: trainerQueue.length };
    isCardFlipped = false;
    hasUsedHint = false;

    renderTrainerStep();
  }

  /**
   * Render the current step in the trainer view
   */
  function renderTrainerStep() {
    const cardEl = document.getElementById('irregTrainerCardContainer');
    const completeView = document.getElementById('irregTrainerCompleteView');
    const progressText = document.getElementById('irregTrainerProgressText');
    const progressBar = document.getElementById('irregTrainerProgressBar');

    if (!cardEl) return;

    // Check if session finished
    if (trainerCurrentIndex >= trainerQueue.length) {
      cardEl.style.display = 'none';
      if (completeView) {
        completeView.style.display = 'flex';
        renderCompleteStats();
      }
      return;
    }

    if (completeView) completeView.style.display = 'none';
    cardEl.style.display = 'block';

    const currentVerb = trainerQueue[trainerCurrentIndex];
    isCardFlipped = false;
    hasUsedHint = false;

    // Update Progress UI
    const currNum = trainerCurrentIndex + 1;
    const totalNum = trainerQueue.length;
    if (progressText) progressText.textContent = `${currNum} / ${totalNum}`;
    if (progressBar) progressBar.style.width = `${(currNum / totalNum) * 100}%`;

    if (trainerMode === 'input') {
      renderInputTrainerCard(currentVerb);
    } else if (trainerMode === 'flashcard') {
      renderFlashcardTrainerCard(currentVerb);
    } else if (trainerMode === 'quiz') {
      renderQuizTrainerCard(currentVerb);
    }
  }

  /**
   * Render Mode 1: Interactive Input (Fill in all 3 forms V1, V2, V3 given translation)
   * @param {any} verb
   */
  function renderInputTrainerCard(verb) {
    const cardEl = document.getElementById('irregTrainerCardContainer');
    if (!cardEl) return;

    cardEl.innerHTML = `
      <div class="irreg-exercise-box">
        <div class="irreg-ex-header">
          <span class="irreg-ex-type-badge">✏️ Напишите все 3 формы</span>
        </div>

        <div class="irreg-ex-prompt" style="text-align: center; margin: 12px 0;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 6px;">Перевод глагола:</div>
          <div class="irreg-ex-translation" style="font-size: 1.45rem; font-weight: 800; color: #60a5fa;">«${escapeHTML(verb.translation)}»</div>
          ${verb.example ? `<div style="font-size: 0.75rem; color: var(--text-muted); font-style: italic; margin-top: 6px;">Контекст: «${escapeHTML(verb.example)}»</div>` : ''}
        </div>

        <div class="irreg-ex-inputs-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
          <div class="irreg-input-group">
            <label for="irregInputV1" class="irreg-input-label">V1 (Infinitive):</label>
            <input type="text" id="irregInputV1" class="irreg-text-input" placeholder="Форма V1..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
          </div>
          <div class="irreg-input-group">
            <label for="irregInputV2" class="irreg-input-label">V2 (Past Simple):</label>
            <input type="text" id="irregInputV2" class="irreg-text-input" placeholder="Форма V2..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
          </div>
          <div class="irreg-input-group">
            <label for="irregInputV3" class="irreg-input-label">V3 (Past Participle):</label>
            <input type="text" id="irregInputV3" class="irreg-text-input" placeholder="Форма V3..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
          </div>
        </div>

        <div id="irregFeedbackMsg" class="irreg-feedback-msg" style="display: none;"></div>

        <div class="irreg-ex-controls">
          <button id="irregHintBtn" class="irreg-btn-secondary">
            💡 Подсказка
          </button>
          <button id="irregSkipBtn" class="irreg-btn-secondary">
            Показать ответ
          </button>
          <button id="irregCheckBtn" class="irreg-btn-primary">
            Проверить (Enter) ➔
          </button>
        </div>
      </div>
    `;

    const inputV1 = /** @type {HTMLInputElement} */ (document.getElementById('irregInputV1'));
    const inputV2 = /** @type {HTMLInputElement} */ (document.getElementById('irregInputV2'));
    const inputV3 = /** @type {HTMLInputElement} */ (document.getElementById('irregInputV3'));
    const checkBtn = document.getElementById('irregCheckBtn');
    const hintBtn = document.getElementById('irregHintBtn');
    const skipBtn = document.getElementById('irregSkipBtn');

    setTimeout(() => {
      if (inputV1) inputV1.focus();
    }, 80);

    // Enter navigation between inputs
    if (inputV1 && inputV2 && inputV3) {
      inputV1.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (inputV1.value.trim().length > 0) {
            inputV2.focus();
          }
        }
      });

      inputV2.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (inputV2.value.trim().length > 0) {
            inputV3.focus();
          }
        }
      });

      inputV3.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          checkInputAnswer(verb);
        }
      });
    }

    if (checkBtn) {
      checkBtn.addEventListener('click', () => checkInputAnswer(verb));
    }

    if (hintBtn) {
      hintBtn.addEventListener('click', () => {
        hasUsedHint = true;
        if (inputV1 && verb.v1) {
          inputV1.value = verb.v1.slice(0, 2);
        }
        if (inputV2 && verb.v2) {
          inputV2.value = verb.v2.slice(0, 2);
        }
        if (inputV3 && verb.v3) {
          inputV3.value = verb.v3.slice(0, 2);
          inputV3.focus();
        }
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        showInputAnswerAndAdvance(verb, false);
      });
    }
  }

  /**
   * Normalize verb form string to compare with user inputs
   * @param {string} val
   * @returns {Array<string>}
   */
  function parseAcceptedVariants(val) {
    if (!val) return [];
    return val.toLowerCase().split(/\s*\/\s*/).map(s => s.trim()).filter(Boolean);
  }

  /**
   * Check inputs for Mode 1
   * @param {any} verb
   */
  function checkInputAnswer(verb) {
    const inputV1 = /** @type {HTMLInputElement} */ (document.getElementById('irregInputV1'));
    const inputV2 = /** @type {HTMLInputElement} */ (document.getElementById('irregInputV2'));
    const inputV3 = /** @type {HTMLInputElement} */ (document.getElementById('irregInputV3'));
    const feedback = document.getElementById('irregFeedbackMsg');
    const checkBtn = document.getElementById('irregCheckBtn');

    if (!inputV1 || !inputV2 || !inputV3 || !feedback) return;

    const userV1 = inputV1.value.trim().toLowerCase();
    const userV2 = inputV2.value.trim().toLowerCase();
    const userV3 = inputV3.value.trim().toLowerCase();

    if (!userV1 && !userV2 && !userV3) {
      inputV1.focus();
      return;
    }

    const acceptedV1 = parseAcceptedVariants(verb.v1);
    const acceptedV2 = parseAcceptedVariants(verb.v2);
    const acceptedV3 = parseAcceptedVariants(verb.v3);

    const isV1Correct = acceptedV1.includes(userV1);
    const isV2Correct = acceptedV2.includes(userV2);
    const isV3Correct = acceptedV3.includes(userV3);

    if (isV1Correct && isV2Correct && isV3Correct) {
      // Correct!
      inputV1.classList.remove('is-error');
      inputV2.classList.remove('is-error');
      inputV3.classList.remove('is-error');
      inputV1.classList.add('is-correct');
      inputV2.classList.add('is-correct');
      inputV3.classList.add('is-correct');

      feedback.className = 'irreg-feedback-msg is-success';
      feedback.style.display = 'block';
      feedback.innerHTML = `🎉 Верно! <strong>${escapeHTML(verb.v1)}</strong> → <strong>${escapeHTML(verb.v2)}</strong> → <strong>${escapeHTML(verb.v3)}</strong>`;

      if (!hasUsedHint) trainerScore.correct++;

      // Pronounce
      speakForms(verb.v1, verb.v2, verb.v3);

      if (checkBtn) {
        checkBtn.textContent = 'Следующий ➔';
        checkBtn.onclick = () => {
          trainerCurrentIndex++;
          renderTrainerStep();
        };
      }

      setTimeout(() => {
        if (trainerCurrentIndex < trainerQueue.length) {
          trainerCurrentIndex++;
          renderTrainerStep();
        }
      }, 1500);

    } else {
      // Incorrect
      if (!isV1Correct) { inputV1.classList.add('is-error'); inputV1.classList.remove('is-correct'); } else { inputV1.classList.add('is-correct'); inputV1.classList.remove('is-error'); }
      if (!isV2Correct) { inputV2.classList.add('is-error'); inputV2.classList.remove('is-correct'); } else { inputV2.classList.add('is-correct'); inputV2.classList.remove('is-error'); }
      if (!isV3Correct) { inputV3.classList.add('is-error'); inputV3.classList.remove('is-correct'); } else { inputV3.classList.add('is-correct'); inputV3.classList.remove('is-error'); }

      feedback.className = 'irreg-feedback-msg is-error';
      feedback.style.display = 'block';
      feedback.innerHTML = `
        ❌ Не совсем точно.<br>
        Правильно: <strong style="color:#60a5fa;">${escapeHTML(verb.v1)}</strong> → <strong style="color:#eab308;">${escapeHTML(verb.v2)}</strong> → <strong style="color:#22c55e;">${escapeHTML(verb.v3)}</strong>
      `;

      // Re-queue the verb for reinforcement at end of session
      trainerQueue.push(verb);
      trainerScore.total = trainerQueue.length;

      if (checkBtn) {
        checkBtn.textContent = 'Далее ➔';
        checkBtn.onclick = () => {
          trainerCurrentIndex++;
          renderTrainerStep();
        };
      }
    }
  }

  /**
   * Skip input and show answer
   * @param {any} verb
   * @param {boolean} isCorrect
   */
  function showInputAnswerAndAdvance(verb, isCorrect) {
    const inputV1 = /** @type {HTMLInputElement} */ (document.getElementById('irregInputV1'));
    const inputV2 = /** @type {HTMLInputElement} */ (document.getElementById('irregInputV2'));
    const inputV3 = /** @type {HTMLInputElement} */ (document.getElementById('irregInputV3'));
    const feedback = document.getElementById('irregFeedbackMsg');
    const checkBtn = document.getElementById('irregCheckBtn');

    if (inputV1) inputV1.value = verb.v1;
    if (inputV2) inputV2.value = verb.v2;
    if (inputV3) inputV3.value = verb.v3;

    if (feedback) {
      feedback.className = 'irreg-feedback-msg is-info';
      feedback.style.display = 'block';
      feedback.innerHTML = `💡 Ответ: <strong>${escapeHTML(verb.v1)}</strong> → <strong>${escapeHTML(verb.v2)}</strong> → <strong>${escapeHTML(verb.v3)}</strong>`;
    }

    speakForms(verb.v1, verb.v2, verb.v3);

    // Re-queue for reinforcement
    trainerQueue.push(verb);
    trainerScore.total = trainerQueue.length;

    if (checkBtn) {
      checkBtn.textContent = 'Далее ➔';
      checkBtn.onclick = () => {
        trainerCurrentIndex++;
        renderTrainerStep();
      };
      checkBtn.focus();
    }
  }

  /**
   * Render Mode 2: 3D Flashcards
   * @param {any} verb
   */
  function renderFlashcardTrainerCard(verb) {
    const cardEl = document.getElementById('irregTrainerCardContainer');
    if (!cardEl) return;

    cardEl.innerHTML = `
      <div class="irreg-flashcard-wrapper">
        <div class="irreg-flashcard" id="irregFlashcard">
          <!-- FRONT -->
          <div class="irreg-card-face irreg-card-front">
            <span class="irreg-card-badge">Инфинитив (V1)</span>
            <div class="irreg-front-translation">${escapeHTML(verb.translation)}</div>
            <div class="irreg-front-word">${escapeHTML(verb.v1)}</div>
            <div class="irreg-card-hint">Кликните или нажмите Пробел, чтобы увидеть V2 и V3</div>
          </div>
          <!-- BACK -->
          <div class="irreg-card-face irreg-card-back">
            <span class="irreg-card-badge">3 Формы глагола</span>
            <div class="irreg-back-forms">
              <div><strong>V1:</strong> ${escapeHTML(verb.v1)}</div>
              <div><strong>V2:</strong> <span style="color:#eab308;">${escapeHTML(verb.v2)}</span></div>
              <div><strong>V3:</strong> <span style="color:#22c55e;">${escapeHTML(verb.v3)}</span></div>
            </div>
            <div class="irreg-back-translation">${escapeHTML(verb.translation)}</div>
            ${verb.example ? `<div class="irreg-back-example">«${escapeHTML(verb.example)}»</div>` : ''}
          </div>
        </div>

        <!-- Rating controls (shown when flipped) -->
        <div class="irreg-rating-bar" id="irregRatingBar" style="display: none;">
          <button class="irreg-rate-btn rate-again" id="irregRateAgain">❌ Забыл (Снова)</button>
          <button class="irreg-rate-btn rate-hard" id="irregRateHard">⚠️ Трудно</button>
          <button class="irreg-rate-btn rate-good" id="irregRateGood">✅ Помню</button>
          <button class="irreg-rate-btn rate-easy" id="irregRateEasy">⚡ Легко (+XP)</button>
        </div>

        <div class="irreg-flip-trigger-row" id="irregFlipTriggerRow">
          <button class="irreg-btn-primary" id="irregFlipBtn" style="width: 100%;">
            Показать формы (V2 & V3) ➔
          </button>
        </div>
      </div>
    `;

    const card = document.getElementById('irregFlashcard');
    const flipBtn = document.getElementById('irregFlipBtn');
    const ratingBar = document.getElementById('irregRatingBar');
    const triggerRow = document.getElementById('irregFlipTriggerRow');

    const flip = () => {
      if (isCardFlipped) return;
      isCardFlipped = true;
      if (card) card.classList.add('flipped');
      if (ratingBar) ratingBar.style.display = 'flex';
      if (triggerRow) triggerRow.style.display = 'none';
      speakForms(verb.v1, verb.v2, verb.v3);
    };

    if (card) card.addEventListener('click', flip);
    if (flipBtn) flipBtn.addEventListener('click', flip);

    // Rating buttons
    const btnAgain = document.getElementById('irregRateAgain');
    const btnHard = document.getElementById('irregRateHard');
    const btnGood = document.getElementById('irregRateGood');
    const btnEasy = document.getElementById('irregRateEasy');

    const advanceWithScore = (isGood) => {
      if (isGood) {
        trainerScore.correct++;
        // If verb is in personal dictionary, update Leitner level
        const entry = getDictEntry(verb.v1);
        if (entry && typeof entry.level === 'number') {
          entry.level = Math.min(8, entry.level + 1);
          entry.interval = Math.max(1, entry.interval * 2 || 1);
          entry.nextReview = Date.now() + entry.interval * 24 * 60 * 60 * 1000;
          if (typeof window.saveDictionaryToStorage === 'function') window.saveDictionaryToStorage();
        }
      } else {
        trainerQueue.push(verb);
        trainerScore.total = trainerQueue.length;
      }
      trainerCurrentIndex++;
      renderTrainerStep();
    };

    if (btnAgain) btnAgain.addEventListener('click', () => advanceWithScore(false));
    if (btnHard) btnHard.addEventListener('click', () => advanceWithScore(true));
    if (btnGood) btnGood.addEventListener('click', () => advanceWithScore(true));
    if (btnEasy) btnEasy.addEventListener('click', () => advanceWithScore(true));
  }

  /**
   * Render Mode 3: Multiple Choice Quiz
   * @param {any} verb
   */
  function renderQuizTrainerCard(verb) {
    const cardEl = document.getElementById('irregTrainerCardContainer');
    if (!cardEl) return;

    // Randomly choose whether to test V2 or V3
    const testTarget = Math.random() < 0.5 ? 'v2' : 'v3';
    const targetLabel = testTarget === 'v2' ? 'V2 (Past Simple)' : 'V3 (Past Participle)';
    const correctAnswer = testTarget === 'v2' ? verb.v2 : verb.v3;

    // Pick 3 distractors from other irregular verbs
    const all = window.irregularVerbsData || [];
    const others = all.filter(v => v.v1 !== verb.v1);
    const shuffledOthers = [...others].sort(() => 0.5 - Math.random());
    const distractors = [];

    for (let i = 0; i < shuffledOthers.length && distractors.length < 3; i++) {
      const candidate = testTarget === 'v2' ? shuffledOthers[i].v2 : shuffledOthers[i].v3;
      if (candidate && candidate !== correctAnswer && !distractors.includes(candidate)) {
        distractors.push(candidate);
      }
    }

    // Assemble and shuffle options
    const options = [correctAnswer, ...distractors].sort(() => 0.5 - Math.random());

    cardEl.innerHTML = `
      <div class="irreg-exercise-box">
        <div class="irreg-ex-header">
          <span class="irreg-ex-type-badge">⚡ Блиц-тест</span>
        </div>

        <div class="irreg-ex-prompt">
          <div class="irreg-quiz-question">Какая правильная форма <strong>${escapeHTML(targetLabel)}</strong> для глагола:</div>
          <div class="irreg-quiz-target-word">${escapeHTML(verb.v1)}</div>
          <div class="irreg-ex-translation">(${escapeHTML(verb.translation)})</div>
        </div>

        <div class="irreg-quiz-grid" id="irregQuizOptionsGrid">
          ${options.map(opt => `
            <button class="irreg-quiz-btn" data-val="${escapeHTML(opt)}">
              ${escapeHTML(opt)}
            </button>
          `).join('')}
        </div>

        <div id="irregQuizFeedback" class="irreg-feedback-msg" style="display: none;"></div>
      </div>
    `;

    const optionBtns = cardEl.querySelectorAll('.irreg-quiz-btn');
    const feedback = document.getElementById('irregQuizFeedback');

    optionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = /** @type {HTMLButtonElement} */ (e.currentTarget);
        const selected = targetBtn.dataset.val;

        // Disable all buttons
        optionBtns.forEach(b => /** @type {HTMLButtonElement} */ (b).disabled = true);

        const isCorrect = selected === correctAnswer;
        if (isCorrect) {
          targetBtn.classList.add('is-correct');
          trainerScore.correct++;
          if (feedback) {
            feedback.className = 'irreg-feedback-msg is-success';
            feedback.style.display = 'block';
            feedback.innerHTML = `🎉 Верно! <strong>${escapeHTML(verb.v1)}</strong> → <strong>${escapeHTML(verb.v2)}</strong> → <strong>${escapeHTML(verb.v3)}</strong>`;
          }
          speakForms(verb.v1, verb.v2, verb.v3);
        } else {
          targetBtn.classList.add('is-error');
          // Highlight the correct one
          optionBtns.forEach(b => {
            if (/** @type {HTMLButtonElement} */ (b).dataset.val === correctAnswer) {
              b.classList.add('is-correct');
            }
          });
          if (feedback) {
            feedback.className = 'irreg-feedback-msg is-error';
            feedback.style.display = 'block';
            feedback.innerHTML = `❌ Правильный ответ: <strong style="color:#eab308;">${escapeHTML(correctAnswer)}</strong>`;
          }
          trainerQueue.push(verb);
          trainerScore.total = trainerQueue.length;
        }

        setTimeout(() => {
          trainerCurrentIndex++;
          renderTrainerStep();
        }, isCorrect ? 1200 : 2000);
      });
    });
  }

  /**
   * Render completion view stats
   */
  function renderCompleteStats() {
    const statsEl = document.getElementById('irregCompleteStatsText');
    const xpRewardEl = document.getElementById('irregCompleteXPReward');

    const accuracy = trainerScore.total > 0 
      ? Math.round((trainerScore.correct / trainerScore.total) * 100) 
      : 100;

    const earnedXP = trainerScore.correct * 10 + 25;

    if (statsEl) {
      statsEl.innerHTML = `
        <div style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 6px;">
          Правильно: <strong>${trainerScore.correct}</strong> из <strong>${trainerScore.total}</strong> (${accuracy}%)
        </div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">
          ${accuracy >= 80 ? '🔥 Отличный результат! Формы надёжно закреплены.' : '💪 Хорошая практика! Повторите ещё раз для автоматизма.'}
        </div>
      `;
    }

    if (xpRewardEl) {
      xpRewardEl.textContent = `+${earnedXP} XP`;
    }

    // Award XP in Gamification module if available
    if (typeof window.Gamification !== 'undefined' && typeof window.Gamification.addXP === 'function') {
      window.Gamification.addXP(earnedXP, 'Тренировка неправильных глаголов');
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MODAL NAVIGATION & EVENT ATTACHMENT
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Open Irregular Verbs Hub Modal
   * @param {'catalog'|'trainer'} [tab]
   */
  function openModal(tab = 'catalog') {
    let modal = document.getElementById('irregularVerbsModal');
    if (!modal) {
      if (typeof window.injectModalTemplates === 'function') {
        window.injectModalTemplates();
      }
      modal = document.getElementById('irregularVerbsModal');
    }
    if (!modal) {
      console.error('[IrregularVerbs] irregularVerbsModal element not found in DOM.');
      return;
    }

    loadCustomVerbs();
    initListeners();

    if (typeof window.openModalEl === 'function') {
      window.openModalEl(modal);
    } else {
      modal.style.display = 'flex';
    }
    switchTab(tab);
    updateHeaderStats();
  }

  /**
   * Close Irregular Verbs Hub Modal
   */
  function closeModal() {
    const modal = document.getElementById('irregularVerbsModal');
    if (!modal) return;
    if (typeof window.closeModalEl === 'function') {
      window.closeModalEl(modal);
    } else {
      modal.style.display = 'none';
    }
  }

  /**
   * Switch between Catalog and Trainer tabs
   * @param {'catalog'|'trainer'} tab
   */
  function switchTab(tab) {
    activeTab = tab;
    const tabCatBtn = document.getElementById('irregTabCatalog');
    const tabTrainBtn = document.getElementById('irregTabTrainer');
    const viewCatalog = document.getElementById('irregCatalogView');
    const viewTrainer = document.getElementById('irregTrainerView');

    if (tab === 'catalog') {
      if (tabCatBtn) tabCatBtn.classList.add('active');
      if (tabTrainBtn) tabTrainBtn.classList.remove('active');
      if (viewCatalog) viewCatalog.style.display = 'flex';
      if (viewTrainer) viewTrainer.style.display = 'none';
      renderCatalog();
    } else {
      if (tabTrainBtn) tabTrainBtn.classList.add('active');
      if (tabCatBtn) tabCatBtn.classList.remove('active');
      if (viewTrainer) viewTrainer.style.display = 'flex';
      if (viewCatalog) viewCatalog.style.display = 'none';
      startTrainer();
    }
  }

  /**
   * Initialize event listeners
   */
  function initListeners() {
    // Modal Close
    const closeBtn = document.getElementById('closeIrregularVerbsBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    const modal = document.getElementById('irregularVerbsModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    // Tab buttons
    const tabCatBtn = document.getElementById('irregTabCatalog');
    const tabTrainBtn = document.getElementById('irregTabTrainer');
    if (tabCatBtn) tabCatBtn.addEventListener('click', () => switchTab('catalog'));
    if (tabTrainBtn) tabTrainBtn.addEventListener('click', () => switchTab('trainer'));

    // Search input
    const searchInput = /** @type {HTMLInputElement} */ (document.getElementById('irregSearchInput'));
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        catalogSearch = searchInput.value;
        renderCatalog();
      });
    }

    // Filter pills
    const filterPills = document.querySelectorAll('.irreg-filter-pill');
    filterPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        filterPills.forEach(p => p.classList.remove('active'));
        const target = /** @type {HTMLElement} */ (e.currentTarget);
        target.classList.add('active');
        catalogFilter = target.dataset.filter || 'all';
        renderCatalog();
      });
    });

    // Bulk Add Top 30 button
    const bulkAddBtn = document.getElementById('irregBulkAddTop30Btn');
    if (bulkAddBtn) {
      bulkAddBtn.addEventListener('click', () => {
        addVerbPackToDict('top30');
      });
    }

    // Start training button from catalog
    const launchTrainBtn = document.getElementById('irregLaunchTrainFromCatBtn');
    if (launchTrainBtn) {
      launchTrainBtn.addEventListener('click', () => {
        switchTab('trainer');
      });
    }

    // Trainer scope & mode selectors
    const modeSelect = /** @type {HTMLSelectElement} */ (document.getElementById('irregTrainerModeSelect'));
    const scopeSelect = /** @type {HTMLSelectElement} */ (document.getElementById('irregTrainerScopeSelect'));

    if (modeSelect) {
      modeSelect.addEventListener('change', () => {
        trainerMode = modeSelect.value;
        startTrainer();
      });
    }

    if (scopeSelect) {
      scopeSelect.addEventListener('change', () => {
        trainerScope = scopeSelect.value;
        startTrainer();
      });
    }

    // Restart button in completion screen
    const restartBtn = document.getElementById('irregTrainerRestartBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        startTrainer();
      });
    }

    // Custom Verb Form Toggle & Handlers
    const addCustomBtn = document.getElementById('irregAddCustomVerbBtn');
    const customForm = document.getElementById('irregAddCustomForm');
    const closeCustomBtn = document.getElementById('irregCloseCustomFormBtn');
    const cancelCustomBtn = document.getElementById('irregCancelCustomBtn');
    const saveCustomBtn = document.getElementById('irregSaveCustomBtn');

    if (addCustomBtn && customForm) {
      addCustomBtn.addEventListener('click', () => {
        const isHidden = customForm.style.display === 'none' || !customForm.style.display;
        customForm.style.display = isHidden ? 'flex' : 'none';
        if (isHidden) {
          const v1Inp = document.getElementById('irregCustomV1');
          if (v1Inp) v1Inp.focus();
        }
      });
    }

    const hideCustomForm = () => {
      if (customForm) customForm.style.display = 'none';
    };
    if (closeCustomBtn) closeCustomBtn.addEventListener('click', hideCustomForm);
    if (cancelCustomBtn) cancelCustomBtn.addEventListener('click', hideCustomForm);

    if (saveCustomBtn) {
      saveCustomBtn.addEventListener('click', () => {
        const v1Inp = /** @type {HTMLInputElement} */ (document.getElementById('irregCustomV1'));
        const v2Inp = /** @type {HTMLInputElement} */ (document.getElementById('irregCustomV2'));
        const v3Inp = /** @type {HTMLInputElement} */ (document.getElementById('irregCustomV3'));
        const transInp = /** @type {HTMLInputElement} */ (document.getElementById('irregCustomTrans'));
        const exInp = /** @type {HTMLInputElement} */ (document.getElementById('irregCustomExample'));

        const v1 = v1Inp ? v1Inp.value.trim().toLowerCase() : '';
        const v2 = v2Inp ? v2Inp.value.trim().toLowerCase() : '';
        const v3 = v3Inp ? v3Inp.value.trim().toLowerCase() : '';
        const trans = transInp ? transInp.value.trim() : '';
        const ex = exInp ? exInp.value.trim() : '';

        if (!v1 || !v2 || !v3 || !trans) {
          if (typeof window.showToast === 'function') {
            window.showToast('Заполните V1, V2, V3 и перевод глагола!');
          }
          return;
        }

        const newVerb = {
          v1: v1,
          v2: v2,
          v3: v3,
          translation: trans,
          example: ex,
          group: 'custom',
          isCustom: true
        };

        // Save to localStorage
        try {
          const saved = localStorage.getItem('custom_irregular_verbs');
          let customs = saved ? JSON.parse(saved) : [];
          if (!Array.isArray(customs)) customs = [];
          customs = customs.filter(c => c.v1.toLowerCase() !== v1);
          customs.unshift(newVerb);
          localStorage.setItem('custom_irregular_verbs', JSON.stringify(customs));
        } catch(e) {}

        // Add to active dataset
        if (!window.irregularVerbsData) window.irregularVerbsData = [];
        window.irregularVerbsData = window.irregularVerbsData.filter(v => !(v.isCustom && v.v1.toLowerCase() === v1));
        window.irregularVerbsData.unshift(newVerb);

        // Add to personalDictionary
        if (!getDictEntry(v1)) {
          toggleVerbInDict(newVerb);
        }

        // Reset inputs & hide form
        if (v1Inp) v1Inp.value = '';
        if (v2Inp) v2Inp.value = '';
        if (v3Inp) v3Inp.value = '';
        if (transInp) transInp.value = '';
        if (exInp) exInp.value = '';
        hideCustomForm();

        // Switch to custom filter to see the new verb
        catalogFilter = 'custom';
        filterPills.forEach(p => {
          if (/** @type {HTMLElement} */ (p).dataset.filter === 'custom') {
            p.classList.add('active');
          } else {
            p.classList.remove('active');
          }
        });

        renderCatalog();
        updateHeaderStats();
        if (typeof window.showToast === 'function') {
          window.showToast(`⚡ Свой глагол ${v1} успешно добавлен!`);
        }
      });
    }

    // Return to catalog from completion screen
    const returnCatBtn = document.getElementById('irregTrainerReturnCatBtn');
    if (returnCatBtn) {
      returnCatBtn.addEventListener('click', () => {
        switchTab('catalog');
      });
    }

    // Nav button in header
    const navBtn = document.getElementById('openIrregularNavBtn');
    if (navBtn) {
      navBtn.addEventListener('click', () => {
        if (typeof window.closeHeaderNav === 'function') window.closeHeaderNav();
        openModal('catalog');
      });
    }

    // Dictionary Tab button
    const dictTabIrreg = document.getElementById('dictTabIrregular');
    if (dictTabIrreg) {
      dictTabIrreg.addEventListener('click', () => {
        openModal('catalog');
      });
    }
  }

  // Global window exposure
  window.openIrregularVerbsModal = openModal;
  window.closeIrregularVerbsModal = closeModal;
  window.speakIrregularForms = speakForms;
  window.toggleIrregularVerbInDict = toggleVerbInDict;

  // Auto-init on DOM ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        loadCustomVerbs();
        initListeners();
      });
    } else {
      loadCustomVerbs();
      initListeners();
    }
  }
})();
