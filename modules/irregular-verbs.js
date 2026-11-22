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
  // Immediate global fallback to prevent any premature call errors
  window.openIrregularVerbsModal = function(tab) {
    if (typeof openModal === 'function') openModal(tab);
  };

  // State variables
  let activeTab = 'catalog'; // 'catalog' or 'trainer'
  let catalogFilter = 'all'; // 'top30', 'top60', 'all', 'in_dict'
  let catalogSearch = '';
  
  // Trainer State
  let trainerMode = 'input'; // 'input', 'flashcard', 'quiz'
  let trainerScope = 'not_learned'; // 'not_learned', 'all', 'my_verbs'
  let trainerQueue = [];
  let trainerCurrentIndex = 0;
  let trainerScore = { correct: 0, total: 0 };
  let isCardFlipped = false;
  let hasUsedHint = false;
  /** @type {any} */
  let trainerAutoAdvanceTimer = null;

  function clearTrainerTimer() {
    if (trainerAutoAdvanceTimer) {
      clearTimeout(trainerAutoAdvanceTimer);
      trainerAutoAdvanceTimer = null;
    }
  }

  function advanceToNextTrainerStep() {
    clearTrainerTimer();
    trainerCurrentIndex++;
    renderTrainerStep();
  }

  /**
   * Escape HTML entities to prevent XSS
   * @param {string} str
   * @returns {string}
   */
  
  // ── Keyboard Layout Auto-Correction Maps ──────────────────────────────────
  const CYR_TO_LAT_MAP = {
    'й':'q','ц':'w','у':'e','к':'r','е':'t','н':'y','г':'u','ш':'i','щ':'o','з':'p',
    'х':'[','ъ':']','ф':'a','ы':'s','в':'d','а':'f','п':'g','р':'h','о':'j','л':'k',
    'д':'l','ж':';','э':"'",'я':'z','ч':'x','с':'c','м':'v','и':'b','т':'n','ь':'m',
    'б':',','ю':'.','ё':'`',
    'Й':'Q','Ц':'W','У':'E','К':'R','Е':'T','Н':'Y','Г':'U','Ш':'I','Щ':'O','З':'P',
    'Х':'{','Ъ':'}','Ф':'A','Ы':'S','В':'D','А':'F','П':'G','Р':'H','О':'J','Л':'K',
    'Д':'L','Ж':':','Э':'"','Я':'Z','Ч':'X','С':'C','М':'V','И':'B','Т':'N','Ь':'M',
    'Б':'<','Ю':'>','Ё':'~'
  };

  const LAT_TO_CYR_MAP = {
    'q':'й','w':'ц','e':'у','r':'к','t':'е','y':'н','u':'г','i':'ш','o':'щ','p':'з',
    '[':'х',']':'ъ','a':'ф','s':'ы','d':'в','f':'а','g':'п','h':'р','j':'о','k':'л',
    'l':'д',';':'ж',"'":'э','z':'я','x':'ч','c':'с','v':'м','b':'и','n':'т','m':'ь',
    ',':'б','.':'ю','`':'ё',
    'Q':'Й','W':'Ц','E':'У','R':'К','T':'Е','Y':'Н','U':'Г','I':'Ш','O':'Щ','P':'З',
    '{':'Х','}':'Ъ','A':'Ф','S':'Ы','D':'В','F':'А','G':'П','H':'Р','J':'О','K':'Л',
    'L':'Д',':':'Ж','"':'Э','Z':'Я','X':'Ч','C':'С','V':'М','B':'И','N':'Т','M':'Ь',
    '<':'Б','>':'Ю','~':'Ё'
  };

  /**
   * Real-time keyboard layout auto-correction (Cyrillic <-> Latin)
   * @param {HTMLInputElement|null} inputEl
   * @param {'cyrToLat'|'latToCyr'} direction
   */
  function convertLayout(inputEl, direction) {
    if (!inputEl) return;
    const map = direction === 'cyrToLat' ? CYR_TO_LAT_MAP : LAT_TO_CYR_MAP;
    const origVal = inputEl.value;
    if (!origVal) return;

    let hasMatch = false;
    for (let i = 0; i < origVal.length; i++) {
      if (map[origVal[i]] !== undefined) {
        hasMatch = true;
        break;
      }
    }
    if (!hasMatch) return;

    const selStart = inputEl.selectionStart;
    const selEnd = inputEl.selectionEnd;
    const newVal = origVal.split('').map(ch => map[ch] !== undefined ? map[ch] : ch).join('');

    if (newVal !== origVal) {
      inputEl.value = newVal;
      try {
        inputEl.setSelectionRange(selStart, selEnd);
      } catch(e) {}
    }
  }

  // ── Mastery Tracking System ─────────────────────────────────────────────
  // Tracks consecutive correct answers per verb. 3+ correct in a row = "learned".
  const MASTERY_KEY = 'irreg_verb_mastery';
  const MASTERY_THRESHOLD = 3;

  function loadMastery() {
    try {
      const saved = localStorage.getItem(MASTERY_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch(e) { return {}; }
  }

  function saveMastery(data) {
    try {
      localStorage.setItem(MASTERY_KEY, JSON.stringify(data));
    } catch(e) {}
  }

  /**
   * Record a correct answer for a verb (increment streak).
   * @param {string} v1
   */
  function recordCorrect(v1) {
    if (!v1) return;
    const m = loadMastery();
    const key = v1.toLowerCase();
    if (!m[key]) m[key] = { streak: 0, lastCorrect: 0 };
    m[key].streak++;
    m[key].lastCorrect = Date.now();
    saveMastery(m);
  }

  /**
   * Record an incorrect answer for a verb (reset streak).
   * @param {string} v1
   */
  function recordIncorrect(v1) {
    if (!v1) return;
    const m = loadMastery();
    const key = v1.toLowerCase();
    if (!m[key]) m[key] = { streak: 0, lastCorrect: 0 };
    m[key].streak = 0;
    saveMastery(m);
  }

  /**
   * Check if a verb is considered "learned" (streak >= threshold).
   * @param {string} v1
   * @returns {boolean}
   */
  function isVerbLearned(v1) {
    if (!v1) return false;
    const m = loadMastery();
    const entry = m[v1.toLowerCase()];
    return entry ? entry.streak >= MASTERY_THRESHOLD : false;
  }

  /**
   * Get mastery streak count for a verb.
   * @param {string} v1
   * @returns {number}
   */
  function getVerbStreak(v1) {
    if (!v1) return 0;
    const m = loadMastery();
    const entry = m[v1.toLowerCase()];
    return entry ? entry.streak : 0;
  }

  /**
   * Reset mastery for a verb (mark as "not learned").
   * @param {string} v1
   */
  function resetVerbMastery(v1) {
    if (!v1) return;
    const m = loadMastery();
    delete m[v1.toLowerCase()];
    saveMastery(m);
  }

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
    let listenersBound = false;

  const IRREGULAR_VERBS_MODAL_HTML = `
<div class="modal-overlay" id="irregularVerbsModal" style="display: none; z-index: 200050;">
    <div class="modal-card" style="width: 700px; max-width: 95%; height: 82vh; display: flex; flex-direction: column;">
      <div class="mobile-drag-handle"></div>

      <div class="modal-header" style="flex-shrink: 0;">
        <h3 style="display: flex; align-items: center; gap: 8px;">
          <svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/></svg>
          <span>Неправильные глаголы</span>
        </h3>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span id="irregTotalCountBadge" style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;"></span>
          <span id="irregInDictCountBadge" style="font-size: 0.72rem; color: var(--accent-spotify); font-weight: 700;"></span>
          <button class="modal-close-btn" id="closeIrregularVerbsBtn" title="Закрыть">✕</button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="dict-tabs">
        <button class="dict-tab active" id="irregTabCatalog">Каталог</button>
        <button class="dict-tab" id="irregTabTrainer">Тренировка</button>
      </div>

      <div class="modal-body" style="display: flex; flex-direction: column; gap: 0.5rem; overflow: hidden; padding: 1rem 1.5rem; flex-grow: 1; min-height: 0; box-sizing: border-box;">

        <!-- ════════════ CATALOG VIEW ════════════ -->
        <div id="irregCatalogView" style="display: flex; flex-direction: column; gap: 0.75rem; flex-grow: 1; min-height: 0; overflow: hidden;">

          <!-- Search & Filter Row -->
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; flex-shrink: 0;">
            <div class="premium-search-box" style="flex-grow: 1; display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity: 0.5; color: var(--text-main); flex-shrink: 0;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="irregSearchInput" placeholder="Поиск по формам или переводу..." style="background: transparent; border: none; color: var(--text-main); font-size: 0.85rem; outline: none; width: 100%;">
            </div>
          </div>

          <!-- Filter Pills -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap; flex-shrink: 0;">
            <button class="irreg-filter-pill active" data-filter="all">Все глаголы</button>
            <button class="irreg-filter-pill" data-filter="not_learned">Неизученные</button>
            <button class="irreg-filter-pill" data-filter="in_dict">В моём словаре</button>
          </div>

          <!-- Action row -->
          <div style="display: flex; gap: 8px; flex-shrink: 0; align-items: center; justify-content: space-between; flex-wrap: wrap;">
            <button id="irregAddCustomVerbBtn" class="modal-btn secondary-btn" style="font-size: 0.75rem; margin: 0; padding: 6px 14px; border-radius: 10px; display: inline-flex; align-items: center; gap: 5px;">
              <span>+ Добавить свой глагол</span>
            </button>
            <button id="irregLaunchTrainFromCatBtn" class="modal-btn primary-btn" style="font-size: 0.75rem; margin: 0; padding: 6px 16px; border-radius: 10px;">
              <span>Начать тренировку</span>
            </button>
          </div>

          <!-- Form to add custom verb (collapsible) -->
          <div id="irregAddCustomForm" style="display: none; flex-direction: column; gap: 10px; padding: 14px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 14px; flex-shrink: 0; animation: fadeIn 0.2s ease;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-main);">Новый неправильный глагол</span>
              <button id="irregCloseCustomFormBtn" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1rem; line-height: 1;">✕</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
              <input type="text" id="irregCustomV1" class="irreg-text-input" placeholder="V1 (Infinitive), напр: go" style="padding: 7px 10px; font-size: 0.82rem;" autocomplete="off">
              <input type="text" id="irregCustomV2" class="irreg-text-input" placeholder="V2 (Past Simple), напр: went" style="padding: 7px 10px; font-size: 0.82rem;" autocomplete="off">
              <input type="text" id="irregCustomV3" class="irreg-text-input" placeholder="V3 (Participle), напр: gone" style="padding: 7px 10px; font-size: 0.82rem;" autocomplete="off">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <input type="text" id="irregCustomTrans" class="irreg-text-input" placeholder="Перевод (русский), напр: идти" style="padding: 7px 10px; font-size: 0.82rem;" autocomplete="off">
              <input type="text" id="irregCustomExample" class="irreg-text-input" placeholder="Пример предложения (опционально)" style="padding: 7px 10px; font-size: 0.82rem;" autocomplete="off">
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
              <button id="irregCancelCustomBtn" class="modal-btn secondary-btn" style="font-size: 0.75rem; margin: 0; padding: 6px 14px; border-radius: 10px;">Отмена</button>
              <button id="irregSaveCustomBtn" class="modal-btn primary-btn" style="font-size: 0.75rem; margin: 0; padding: 6px 16px; border-radius: 10px;">Сохранить глагол</button>
            </div>
          </div>

          <!-- Verbs List (Scrollable) -->
          <div id="irregCatalogList" style="flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px; min-height: 0;">
            <!-- Dynamically injected verb cards -->
          </div>
        </div>

        <!-- ════════════ TRAINER VIEW ════════════ -->
        <div id="irregTrainerView" style="display: none; flex-direction: column; gap: 0.75rem; flex-grow: 1; min-height: 0; overflow: hidden;">

          <!-- Trainer Settings Row -->
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; flex-shrink: 0;">
            <select id="irregTrainerModeSelect" class="premium-select-filter" style="flex: 1; min-width: 130px;">
              <option value="input">Ввод 3 форм</option>
              <option value="flashcard">Карточки</option>
              <option value="quiz">Тест</option>
            </select>
            <select id="irregTrainerScopeSelect" class="premium-select-filter" style="flex: 1; min-width: 130px;">
              <option value="not_learned">Неизученные</option>
              <option value="all">Все глаголы</option>
              <option value="my_verbs">Из словаря</option>
            </select>
          </div>

          <!-- Progress Bar -->
          <div style="flex-shrink: 0; display: flex; align-items: center; gap: 10px;">
            <div style="flex-grow: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;">
              <div id="irregTrainerProgressBar" style="height: 100%; width: 0%; background: var(--accent-spotify); border-radius: 3px; transition: width 0.3s ease;"></div>
            </div>
            <span id="irregTrainerProgressText" style="font-size: 0.75rem; font-weight: 700; color: var(--text-sub); white-space: nowrap;">0 / 0</span>
          </div>

          <!-- Card Container (Active Training) -->
          <div id="irregTrainerCardContainer" style="flex-grow: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column;">
            <!-- Dynamically rendered by JS -->
          </div>

          <!-- Completion View -->
          <div id="irregTrainerCompleteView" style="display: none; flex-direction: column; align-items: center; justify-content: center; gap: 16px; flex-grow: 1; min-height: 0; text-align: center; padding: 20px;">
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);">Тренировка завершена</div>
            <div id="irregCompleteStatsText" style="font-size: 0.9rem; color: var(--text-sub);"></div>
            <div id="irregCompleteXPReward" style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);"></div>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
              <button id="irregTrainerRestartBtn" class="modal-btn primary-btn" style="font-size: 0.8rem; padding: 7px 18px; border-radius: 10px;">Повторить</button>
              <button id="irregTrainerReturnCatBtn" class="modal-btn secondary-btn" style="font-size: 0.8rem; padding: 7px 18px; border-radius: 10px;">Каталог</button>
            </div>
          </div>
        </div>

      </div>
`;

  /**
   * Ensure irregularVerbsModal is injected in DOM
   * @returns {HTMLElement|null}
   */
  function ensureModalExists() {
    let modal = document.getElementById('irregularVerbsModal');
    if (modal) return modal;

    const container = document.getElementById('modalsContainer') || document.body;
    if (!container) return null;

    const temp = document.createElement('div');
    temp.innerHTML = IRREGULAR_VERBS_MODAL_HTML.trim();
    modal = /** @type {HTMLElement} */ (temp.firstElementChild);
    if (modal) {
      container.appendChild(modal);
    }
    return modal;
  }

  function loadCustomVerbs() {
    try {
      const saved = localStorage.getItem('custom_irregular_verbs');
      if (saved) {
        const customs = JSON.parse(saved);
        if (Array.isArray(customs)) {
          if (!window.irregularVerbsData) window.irregularVerbsData = [];
          // Remove old custom entries to avoid stale data or duplication
          window.irregularVerbsData = window.irregularVerbsData.filter(v => !v.isCustom);
          customs.forEach(c => {
            if (!c || !c.v1) return;
            window.irregularVerbsData.unshift({
              v1: c.v1,
              v2: c.v2,
              v3: c.v3,
              translation: c.translation,
              example: c.example || '',
              group: 'custom',
              isCustom: true
            });
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
        window.showToast(`Глагол ${verbObj.v1} (${verbObj.v2}, ${verbObj.v3}) добавлен в словарь`);
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
    
    let learnedCount = 0;
    let dictCount = 0;
    all.forEach(v => {
      if (isVerbLearned(v.v1)) learnedCount++;
      if (getDictEntry(v.v1)) dictCount++;
    });

    if (totalCountEl) {
      totalCountEl.textContent = `${all.length} глаголов • ${learnedCount} выучено`;
    }
    if (inDictCountEl) {
      inDictCountEl.textContent = `${dictCount} в словаре`;
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
      if (catalogFilter === 'not_learned') return !isVerbLearned(item.v1);
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
          <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Список пуст</div>
          <div style="font-size: 0.82rem;">${query ? 'Ничего не найдено по вашему запросу.' : 'У вас пока нет добавленных неправильных глаголов. Нажмите «+ Добавить свой глагол», чтобы добавить слова.'}</div>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach(item => {
      const dictEntry = getDictEntry(item.v1);
      const inDict = !!dictEntry;
      const level = inDict ? (dictEntry.level || 0) : null;

      const streak = getVerbStreak(item.v1);
      const learned = streak >= MASTERY_THRESHOLD;

      const card = document.createElement('div');
      card.className = 'irreg-verb-card' + (inDict ? ' in-dict' : '') + (learned ? ' is-learned' : '');

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
            ${inDict ? `В словаре ${level > 0 ? `(Lvl ${level})` : ''}` : '+ В словарь'}
          </button>
          <button class="irreg-btn-mastery ${learned ? 'is-learned' : ''}" title="${learned ? 'Выучено (нажмите, чтобы вернуть в тренировку)' : (streak > 0 ? `Серия: ${streak}/${MASTERY_THRESHOLD} (нажмите, чтобы отметить выученным)` : 'Нажмите, чтобы отметить выученным')}">
            ${learned ? '✓ Выучено' : (streak > 0 ? `✓ ${streak}/${MASTERY_THRESHOLD}` : 'Выучить')}
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

      const masteryBtn = card.querySelector('.irreg-btn-mastery');
      if (masteryBtn) {
        masteryBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (learned) {
            resetVerbMastery(item.v1);
            if (typeof window.showToast === 'function') {
              window.showToast(`Глагол ${item.v1} возвращён в тренировку`);
            }
          } else {
            const m = loadMastery();
            const key = item.v1.toLowerCase();
            m[key] = { streak: MASTERY_THRESHOLD, lastCorrect: Date.now() };
            saveMastery(m);
            if (typeof window.showToast === 'function') {
              window.showToast(`Глагол ${item.v1} отмечен как выученный`);
            }
          }
          renderCatalog();
          updateHeaderStats();
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
    clearTrainerTimer();
    if (scope) trainerScope = scope;
    if (mode) trainerMode = mode;

    const scopeSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById('irregTrainerScopeSelect'));
    if (scopeSelect && scopeSelect.value !== trainerScope) {
      scopeSelect.value = trainerScope;
    }

    const all = window.irregularVerbsData || [];
    let pool = [];

    if (trainerScope === 'not_learned') {
      pool = all.filter(v => !isVerbLearned(v.v1));
      if (pool.length === 0) {
        // All verbs are learned! Show congratulatory message instead.
        trainerQueue = [];
        trainerCurrentIndex = 0;
        trainerScore = { correct: 0, total: 0 };
        const cardEl = document.getElementById('irregTrainerCardContainer');
        const completeView = document.getElementById('irregTrainerCompleteView');
        const progressText = document.getElementById('irregTrainerProgressText');
        const progressBar = document.getElementById('irregTrainerProgressBar');
        if (progressText) progressText.textContent = '0 / 0';
        if (progressBar) progressBar.style.width = '100%';
        if (completeView) completeView.style.display = 'none';
        if (cardEl) {
          cardEl.style.display = 'block';
          cardEl.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); font-size: 0.9rem;">
              <div style="font-size: 1.2rem; font-weight: 800; color: var(--accent-spotify); margin-bottom: 10px;">Все глаголы выучены!</div>
              <div style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 8px;">Вы правильно ответили минимум ${MASTERY_THRESHOLD} раза подряд на каждый глагол.</div>
              <div style="font-size: 0.82rem;">Добавьте новые глаголы в каталоге или выберите «Все глаголы» для повторения.</div>
            </div>
          `;
        }
        return;
      }
    } else if (trainerScope === 'my_verbs') {
      pool = all.filter(v => !!getDictEntry(v.v1));
      if (pool.length === 0) {
        pool = [...all];
      }
    } else {
      pool = [...all];
    }

    // Shuffle pool (Fisher-Yates)
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    if (shuffled.length === 0) {
      trainerQueue = [];
      trainerCurrentIndex = 0;
      trainerScore = { correct: 0, total: 0 };
      const cardEl = document.getElementById('irregTrainerCardContainer');
      const completeView = document.getElementById('irregTrainerCompleteView');
      const progressText = document.getElementById('irregTrainerProgressText');
      const progressBar = document.getElementById('irregTrainerProgressBar');
      if (progressText) progressText.textContent = '0 / 0';
      if (progressBar) progressBar.style.width = '0%';
      if (completeView) completeView.style.display = 'none';
      if (cardEl) {
        cardEl.style.display = 'block';
        cardEl.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); font-size: 0.9rem;">
            <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Нет глаголов для тренировки</div>
            <div style="font-size: 0.82rem;">Сначала добавьте свои неправильные глаголы во вкладке «Каталог».</div>
          </div>
        `;
      }
      return;
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
    clearTrainerTimer();
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

    let isChecked = false;
    let canAdvance = false;

    cardEl.innerHTML = `
      <div class="irreg-exercise-box">
        <div class="irreg-ex-header">
          <span class="irreg-ex-type-badge">Напишите все 3 формы</span>
        </div>

        <div class="irreg-ex-prompt" style="text-align: center; margin: 12px 0;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 6px;">Перевод глагола:</div>
          <div class="irreg-ex-translation" style="font-size: 1.45rem; font-weight: 800; color: var(--text-main);">«${escapeHTML(verb.translation)}»</div>
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
            Подсказка
          </button>
          <button id="irregSkipBtn" class="irreg-btn-secondary">
            Показать ответ
          </button>
          <button id="irregCheckBtn" class="irreg-btn-primary">
            Проверить (Enter)
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

    // Real-time layout auto-correction (Cyrillic -> Latin for English forms)
    if (inputV1) inputV1.addEventListener('input', () => convertLayout(inputV1, 'cyrToLat'));
    if (inputV2) inputV2.addEventListener('input', () => convertLayout(inputV2, 'cyrToLat'));
    if (inputV3) inputV3.addEventListener('input', () => convertLayout(inputV3, 'cyrToLat'));

    const handleAdvance = () => {
      if (!canAdvance) return;
      advanceToNextTrainerStep();
    };

    // Enter navigation between inputs
    if (inputV1 && inputV2 && inputV3) {
      inputV1.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (isChecked) {
            handleAdvance();
          } else if (inputV1.value.trim().length > 0) {
            inputV2.focus();
          }
        }
      });

      inputV2.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (isChecked) {
            handleAdvance();
          } else if (inputV2.value.trim().length > 0) {
            inputV3.focus();
          }
        }
      });

      inputV3.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (isChecked) {
            handleAdvance();
          } else {
            doCheck();
          }
        }
      });
    }

    if (checkBtn) {
      checkBtn.onclick = () => {
        if (isChecked) {
          handleAdvance();
        } else {
          doCheck();
        }
      };
    }

    // Card-level Enter key handler when checked (so user can press Enter from anywhere on card)
    cardEl.onkeydown = (e) => {
      if (e.key === 'Enter' && isChecked) {
        e.preventDefault();
        handleAdvance();
      }
    };

    function doCheck() {
      if (isChecked) return;

      if (!inputV1 || !inputV2 || !inputV3) return;
      convertLayout(inputV1, 'cyrToLat');
      convertLayout(inputV2, 'cyrToLat');
      convertLayout(inputV3, 'cyrToLat');

      const userV1 = inputV1.value.trim().toLowerCase();
      const userV2 = inputV2.value.trim().toLowerCase();
      const userV3 = inputV3.value.trim().toLowerCase();

      if (!userV1 && !userV2 && !userV3) {
        inputV1.focus();
        return;
      }

      const feedback = document.getElementById('irregFeedbackMsg');
      if (!feedback) return;

      const acceptedV1 = parseAcceptedVariants(verb.v1);
      const acceptedV2 = parseAcceptedVariants(verb.v2);
      const acceptedV3 = parseAcceptedVariants(verb.v3);

      const isV1Correct = acceptedV1.includes(userV1);
      const isV2Correct = acceptedV2.includes(userV2);
      const isV3Correct = acceptedV3.includes(userV3);

      isChecked = true;

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
        feedback.innerHTML = `Верно! <strong>${escapeHTML(verb.v1)}</strong> → <strong>${escapeHTML(verb.v2)}</strong> → <strong>${escapeHTML(verb.v3)}</strong>`;

        if (!hasUsedHint) {
          trainerScore.correct++;
          recordCorrect(verb.v1);
        }

        // Pronounce
        speakForms(verb.v1, verb.v2, verb.v3);

        if (checkBtn) {
          checkBtn.textContent = 'Следующий (Enter)';
        }

        // NO auto-advance timer! User advances strictly on Enter or click.
        clearTrainerTimer();

        // Enable advance after current Enter keydown event has completely finished
        setTimeout(() => {
          canAdvance = true;
          if (checkBtn) checkBtn.focus();
        }, 120);

      } else {
        // Incorrect
        if (!isV1Correct) { inputV1.classList.add('is-error'); inputV1.classList.remove('is-correct'); } else { inputV1.classList.add('is-correct'); inputV1.classList.remove('is-error'); }
        if (!isV2Correct) { inputV2.classList.add('is-error'); inputV2.classList.remove('is-correct'); } else { inputV2.classList.add('is-correct'); inputV2.classList.remove('is-error'); }
        if (!isV3Correct) { inputV3.classList.add('is-error'); inputV3.classList.remove('is-correct'); } else { inputV3.classList.add('is-correct'); inputV3.classList.remove('is-error'); }

        feedback.className = 'irreg-feedback-msg is-error';
        feedback.style.display = 'block';
        feedback.innerHTML = `
          Неверно.<br>
          Правильно: <strong>${escapeHTML(verb.v1)}</strong> → <strong>${escapeHTML(verb.v2)}</strong> → <strong>${escapeHTML(verb.v3)}</strong>
        `;

        // Reset mastery streak on error
        recordIncorrect(verb.v1);

        // Pronounce correct forms so the user hears how they sound
        speakForms(verb.v1, verb.v2, verb.v3);

        // Re-queue the verb for reinforcement at end of session
        trainerQueue.push(verb);
        trainerScore.total = trainerQueue.length;

        clearTrainerTimer();
        if (checkBtn) {
          checkBtn.textContent = 'Далее (Enter)';
        }

        setTimeout(() => {
          canAdvance = true;
          if (checkBtn) checkBtn.focus();
        }, 120);
      }
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
        if (isChecked) return;
        isChecked = true;

        if (inputV1) inputV1.value = verb.v1;
        if (inputV2) inputV2.value = verb.v2;
        if (inputV3) inputV3.value = verb.v3;

        const feedback = document.getElementById('irregFeedbackMsg');
        if (feedback) {
          feedback.className = 'irreg-feedback-msg is-info';
          feedback.style.display = 'block';
          feedback.innerHTML = `Ответ: <strong>${escapeHTML(verb.v1)}</strong> → <strong>${escapeHTML(verb.v2)}</strong> → <strong>${escapeHTML(verb.v3)}</strong>`;
        }

        speakForms(verb.v1, verb.v2, verb.v3);

        // Reset mastery on skip
        recordIncorrect(verb.v1);

        // Re-queue for reinforcement
        trainerQueue.push(verb);
        trainerScore.total = trainerQueue.length;

        clearTrainerTimer();
        if (checkBtn) {
          checkBtn.textContent = 'Далее (Enter)';
        }

        setTimeout(() => {
          canAdvance = true;
          if (checkBtn) checkBtn.focus();
        }, 120);
      });
    }
  }

  /**
   * Normalize verb form string to compare with user inputs (accepts both single form and combined variants)
   * @param {string} val
   * @returns {Array<string>}
   */
  function parseAcceptedVariants(val) {
    if (!val) return [];
    const raw = val.toLowerCase().trim();
    const parts = raw.split(/\s*[\/,]\s*/).map(s => s.trim()).filter(Boolean);
    const set = new Set(parts);
    set.add(raw);
    set.add(parts.join(' / '));
    set.add(parts.join('/'));
    set.add(parts.join(', '));
    set.add(parts.join(' '));
    return Array.from(set);
  }

  function renderFlashcardTrainerCard(verb) {
    const cardEl = document.getElementById('irregTrainerCardContainer');
    if (!cardEl) return;

    cardEl.innerHTML = `
      <div class="irreg-flashcard-wrapper">
        <div class="irreg-flashcard" id="irregFlashcard">
          <!-- FRONT -->
          <div class="irreg-card-face irreg-card-front">
            <span class="irreg-card-badge">Перевод</span>
            <div class="irreg-front-word">${escapeHTML(verb.translation)}</div>
            <div class="irreg-card-hint">Вспомните все 3 формы (V1, V2, V3)</div>
          </div>
          <!-- BACK -->
          <div class="irreg-card-face irreg-card-back">
            <span class="irreg-card-badge">3 Формы глагола</span>
            <div class="irreg-back-forms">
              <div><strong>V1:</strong> <span>${escapeHTML(verb.v1)}</span></div>
              <div><strong>V2:</strong> <span>${escapeHTML(verb.v2)}</span></div>
              <div><strong>V3:</strong> <span>${escapeHTML(verb.v3)}</span></div>
            </div>
            <div class="irreg-back-translation">${escapeHTML(verb.translation)}</div>
            ${verb.example ? `<div class="irreg-back-example">«${escapeHTML(verb.example)}»</div>` : ''}
          </div>
        </div>

        <!-- Rating controls (shown when flipped) -->
        <div class="irreg-rating-bar" id="irregRatingBar" style="display: none;">
          <button class="irreg-rate-btn rate-again" id="irregRateAgain">Снова</button>
          <button class="irreg-rate-btn rate-hard" id="irregRateHard">Трудно</button>
          <button class="irreg-rate-btn rate-good" id="irregRateGood">Хорошо</button>
          <button class="irreg-rate-btn rate-easy" id="irregRateEasy">Легко</button>
        </div>

        <div class="irreg-flip-trigger-row" id="irregFlipTriggerRow">
          <button class="irreg-btn-primary" id="irregFlipBtn" style="width: 100%;">
            Показать формы (V2 и V3)
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
        recordCorrect(verb.v1);
        // If verb is in personal dictionary, update Leitner level
        const entry = getDictEntry(verb.v1);
        if (entry && typeof entry.level === 'number') {
          entry.level = Math.min(8, entry.level + 1);
          entry.interval = Math.max(1, entry.interval * 2 || 1);
          entry.nextReview = Date.now() + entry.interval * 24 * 60 * 60 * 1000;
          if (typeof window.saveDictionaryToStorage === 'function') window.saveDictionaryToStorage();
        }
      } else {
        recordIncorrect(verb.v1);
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
          <span class="irreg-ex-type-badge">Тест</span>
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
            feedback.innerHTML = `Верно! <strong>${escapeHTML(verb.v1)}</strong> → <strong>${escapeHTML(verb.v2)}</strong> → <strong>${escapeHTML(verb.v3)}</strong>`;
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
            feedback.innerHTML = `Правильный ответ: <strong>${escapeHTML(correctAnswer)}</strong>`;
          }
          trainerQueue.push(verb);
          trainerScore.total = trainerQueue.length;
          recordIncorrect(verb.v1);
        }

        clearTrainerTimer();
        trainerAutoAdvanceTimer = setTimeout(() => {
          trainerAutoAdvanceTimer = null;
          advanceToNextTrainerStep();
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
          ${accuracy >= 80 ? 'Отличный результат! Формы закреплены.' : 'Хорошая практика! Повторите ещё раз для автоматизма.'}
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
  let lastModalOpenTime = 0;
  function openModal(tab = 'catalog') {
    const now = Date.now();
    if (now - lastModalOpenTime < 250) {
      switchTab(tab);
      return;
    }
    lastModalOpenTime = now;

    const modal = ensureModalExists();
    if (!modal) {
      console.error('[IrregularVerbs] irregularVerbsModal element not found or created.');
      return;
    }

    loadCustomVerbs();
    initListeners();

    if (typeof window.openModalEl === 'function') {
      window.openModalEl(modal);
    } else {
      modal.classList.remove('modal-animate-out');
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
      modal.classList.add('modal-animate-in');
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
    if (listenersBound) return;
    const modal = document.getElementById('irregularVerbsModal');
    if (!modal) return;
    listenersBound = true;

    // Modal Close
    const closeBtn = document.getElementById('closeIrregularVerbsBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Modal backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        // If user is actively in a trainer session, do NOT close on accidental backdrop tap
        if (activeTab === 'trainer' && trainerQueue.length > 0 && trainerCurrentIndex < trainerQueue.length) {
          return;
        }
        closeModal();
      }
    });

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

    // Real-time layout conversion for Custom Verb form
    const customV1El = /** @type {HTMLInputElement|null} */ (document.getElementById('irregCustomV1'));
    const customV2El = /** @type {HTMLInputElement|null} */ (document.getElementById('irregCustomV2'));
    const customV3El = /** @type {HTMLInputElement|null} */ (document.getElementById('irregCustomV3'));
    const customTransEl = /** @type {HTMLInputElement|null} */ (document.getElementById('irregCustomTrans'));
    const customExEl = /** @type {HTMLInputElement|null} */ (document.getElementById('irregCustomExample'));

    if (customV1El) customV1El.addEventListener('input', () => convertLayout(customV1El, 'cyrToLat'));
    if (customV2El) customV2El.addEventListener('input', () => convertLayout(customV2El, 'cyrToLat'));
    if (customV3El) customV3El.addEventListener('input', () => convertLayout(customV3El, 'cyrToLat'));
    if (customTransEl) customTransEl.addEventListener('input', () => convertLayout(customTransEl, 'latToCyr'));
    if (customExEl) customExEl.addEventListener('input', () => convertLayout(customExEl, 'cyrToLat'));

    if (saveCustomBtn) {
      saveCustomBtn.addEventListener('click', () => {
        const v1Inp = /** @type {HTMLInputElement} */ (document.getElementById('irregCustomV1'));
        const v2Inp = /** @type {HTMLInputElement} */ (document.getElementById('irregCustomV2'));
        const v3Inp = /** @type {HTMLInputElement} */ (document.getElementById('irregCustomV3'));
        const transInp = /** @type {HTMLInputElement} */ (document.getElementById('irregCustomTrans'));
        const exInp = /** @type {HTMLInputElement} */ (document.getElementById('irregCustomExample'));

        if (v1Inp) convertLayout(v1Inp, 'cyrToLat');
        if (v2Inp) convertLayout(v2Inp, 'cyrToLat');
        if (v3Inp) convertLayout(v3Inp, 'cyrToLat');
        if (transInp) convertLayout(transInp, 'latToCyr');
        if (exInp) convertLayout(exInp, 'cyrToLat');

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

        // Switch to 'all' filter and highlight 'all'
        catalogFilter = 'all';
        filterPills.forEach(p => {
          if (/** @type {HTMLElement} */ (p).dataset.filter === 'all') {
            p.classList.add('active');
          } else {
            p.classList.remove('active');
          }
        });

        renderCatalog();
        updateHeaderStats();
        if (typeof window.showToast === 'function') {
          window.showToast(`Глагол ${v1} успешно добавлен`);
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
  window.convertKeyboardLayout = convertLayout;
  window.loadCustomVerbs = loadCustomVerbs;
  window.renderIrregularCatalog = renderCatalog;
  window.updateIrregularStats = updateHeaderStats;

  // Auto-init on DOM ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        ensureModalExists();
        loadCustomVerbs();
        initListeners();
      });
    } else {
      ensureModalExists();
      loadCustomVerbs();
      initListeners();
    }
  }
})();
