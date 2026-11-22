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
  
  // Trainer State & Engine are managed in modules/irregular-verbs-trainer.js

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
      const customsMap = new Map();

      // 1. Direct saved 'custom_irregular_verbs'
      const saved = localStorage.getItem('custom_irregular_verbs');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            parsed.forEach(c => {
              if (c && c.v1) {
                const key = c.v1.trim().toLowerCase();
                customsMap.set(key, {
                  v1: c.v1.trim(),
                  v2: c.v2 ? c.v2.trim() : '',
                  v3: c.v3 ? c.v3.trim() : '',
                  translation: c.translation ? c.translation.trim() : '',
                  example: c.example ? c.example.trim() : '',
                  group: 'custom',
                  isCustom: true
                });
              }
            });
          }
        } catch(e) {}
      }

      // 2. Recovery from last sync payloads in localStorage
      try {
        const lastSyncKey = Object.keys(localStorage).find(k => k.startsWith('last_sync_payload_'));
        if (lastSyncKey) {
          const lastSyncStr = localStorage.getItem(lastSyncKey);
          if (lastSyncStr) {
            const lastSync = JSON.parse(lastSyncStr);
            if (lastSync && lastSync['custom_irregular_verbs']) {
              const prevCustoms = JSON.parse(lastSync['custom_irregular_verbs']);
              if (Array.isArray(prevCustoms)) {
                prevCustoms.forEach(c => {
                  if (c && c.v1) {
                    const key = c.v1.trim().toLowerCase();
                    if (!customsMap.has(key)) {
                      customsMap.set(key, {
                        v1: c.v1.trim(),
                        v2: c.v2 ? c.v2.trim() : '',
                        v3: c.v3 ? c.v3.trim() : '',
                        translation: c.translation ? c.translation.trim() : '',
                        example: c.example ? c.example.trim() : '',
                        group: 'custom',
                        isCustom: true
                      });
                    }
                  }
                });
              }
            }
          }
        }
      } catch(e) {}

      // 3. Recovery from 'irreg_verb_mastery' (all verbs user trained on)
      try {
        const masteryStr = localStorage.getItem('irreg_verb_mastery');
        if (masteryStr) {
          const mastery = JSON.parse(masteryStr);
          if (mastery && typeof mastery === 'object') {
            Object.keys(mastery).forEach(vKey => {
              const clean = vKey.trim().toLowerCase();
              if (clean && !customsMap.has(clean)) {
                const ref = typeof window.findIrregularVerb === 'function' ? window.findIrregularVerb(clean) : null;
                if (ref) {
                  customsMap.set(clean, {
                    v1: ref.v1,
                    v2: ref.v2,
                    v3: ref.v3,
                    translation: ref.translation,
                    example: ref.example || '',
                    group: 'custom',
                    isCustom: true
                  });
                }
              }
            });
          }
        }
      } catch(e) {}

      // 4. FULL RECOVERY FROM PERSONAL DICTIONARY
      let dict = [];
      if (typeof window.personalDictionary !== 'undefined' && Array.isArray(window.personalDictionary) && window.personalDictionary.length > 0) {
        dict = window.personalDictionary;
      } else {
        const savedDict = localStorage.getItem('personal_dictionary') || localStorage.getItem('my_personal_dictionary');
        if (savedDict) {
          try { dict = JSON.parse(savedDict); } catch(e) {}
        }
      }

      if (Array.isArray(dict) && dict.length > 0) {
        let dictUpdated = false;

        dict.forEach(w => {
          if (!w) return;
          const rawWord = (w.v1 || w.word || '').trim();
          if (!rawWord) return;

          let v1 = '';
          let v2 = '';
          let v3 = '';
          let translation = (w.translation || '').trim();
          let example = (w.example || '').trim();

          // Case A: Entry already has explicit v1, v2, v3
          if (w.v1 && w.v2 && w.v3) {
            v1 = w.v1.trim();
            v2 = w.v2.trim();
            v3 = w.v3.trim();
          }

          // Case B: Word string has 3 forms separated by delimiter
          // e.g. "go, went, gone" or "go - went - gone" or "go / went / gone" or "go went gone"
          if (!v1) {
            const parts = rawWord.split(/[\s,/\-–—]+/).map(s => s.trim()).filter(Boolean);
            if (parts.length === 3) {
              v1 = parts[0];
              v2 = parts[1];
              v3 = parts[2];
            }
          }

          // Case C: Check if rawWord matches ANY known irregular verb in reference dataset
          if (!v1 && typeof window.findIrregularVerb === 'function') {
            const ref = window.findIrregularVerb(rawWord);
            if (ref) {
              v1 = ref.v1;
              v2 = ref.v2;
              v3 = ref.v3;
              if (!translation) translation = ref.translation;
              if (!example) example = ref.example || '';
            }
          }

          // Case D: Explicit irregular flags or categories
          if (!v1) {
            const isFlagged = w.isIrregular ||
              w.category === 'Неправильные глаголы' ||
              w.category === 'Базовые глаголы' ||
              w.customCategory === 'Глаголы' ||
              (Array.isArray(w.categories) && w.categories.includes('Неправильные глаголы'));
            
            if (isFlagged) {
              v1 = rawWord;
              if (w.v2) v2 = w.v2.trim();
              if (w.v3) v3 = w.v3.trim();
              if ((!v2 || !v3) && typeof window.findIrregularVerb === 'function') {
                const ref = window.findIrregularVerb(v1);
                if (ref) {
                  v1 = ref.v1;
                  v2 = ref.v2;
                  v3 = ref.v3;
                  if (!translation) translation = ref.translation;
                }
              }
            }
          }

          // If identified as irregular verb:
          if (v1) {
            const key = v1.toLowerCase();
            if (!customsMap.has(key)) {
              customsMap.set(key, {
                v1: v1,
                v2: v2 || v1,
                v3: v3 || v1,
                translation: translation,
                example: example,
                group: 'custom',
                isCustom: true
              });
            } else {
              const existing = customsMap.get(key);
              if (!existing.v2 && v2) existing.v2 = v2;
              if (!existing.v3 && v3) existing.v3 = v3;
              if (!existing.translation && translation) existing.translation = translation;
            }

            // Sync enriched forms back to personalDictionary entry
            if (!w.isIrregular || !w.v1 || !w.v2 || !w.v3) {
              w.isIrregular = true;
              w.v1 = v1;
              w.v2 = v2 || v1;
              w.v3 = v3 || v1;
              if (!w.translation && translation) w.translation = translation;
              dictUpdated = true;
            }
          }
        });

        if (dictUpdated) {
          if (typeof window.saveDictionaryToStorage === 'function') {
            window.saveDictionaryToStorage();
          } else {
            try {
              localStorage.setItem('personal_dictionary', JSON.stringify(dict));
              localStorage.setItem('my_personal_dictionary', JSON.stringify(dict));
            } catch(e) {}
          }
        }
      }

      const allCustoms = Array.from(customsMap.values());

      // Save back to localStorage so custom_irregular_verbs stays complete
      try {
        localStorage.setItem('custom_irregular_verbs', JSON.stringify(allCustoms));
      } catch(e) {}

      // Populate window.irregularVerbsData
      if (!window.irregularVerbsData) window.irregularVerbsData = [];
      window.irregularVerbsData = window.irregularVerbsData.filter(v => !v.isCustom);
      allCustoms.forEach(c => {
        window.irregularVerbsData.unshift(c);
      });

      console.log(`[IrregularVerbs] Loaded ${allCustoms.length} irregular verbs.`);

      // Update catalog and stats if DOM is ready
      renderCatalog();
      updateHeaderStats();

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
  // TRAINER ENGINE LOGIC → moved to modules/irregular-verbs-trainer.js
  // ──────────────────────────────────────────────────────────────────────────

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
      if (typeof window.startIrregularVerbsTrainer === 'function') {
        window.startIrregularVerbsTrainer();
      }
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
        if (activeTab === 'trainer' && typeof window.isIrregularTrainerActive === 'function' && window.isIrregularTrainerActive()) {
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
        if (typeof window.startIrregularVerbsTrainer === 'function') {
          window.startIrregularVerbsTrainer(undefined, modeSelect.value);
        }
      });
    }

    if (scopeSelect) {
      scopeSelect.addEventListener('change', () => {
        if (typeof window.startIrregularVerbsTrainer === 'function') {
          window.startIrregularVerbsTrainer(scopeSelect.value, undefined);
        }
      });
    }

    // Restart button in completion screen
    const restartBtn = document.getElementById('irregTrainerRestartBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        if (typeof window.startIrregularVerbsTrainer === 'function') {
          window.startIrregularVerbsTrainer();
        }
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

        // Add to personalDictionary or enrich existing entry
        const existingEntry = getDictEntry(v1);
        if (!existingEntry) {
          toggleVerbInDict(newVerb);
        } else {
          existingEntry.isIrregular = true;
          existingEntry.v1 = newVerb.v1;
          existingEntry.v2 = newVerb.v2;
          existingEntry.v3 = newVerb.v3;
          if (!existingEntry.translation && newVerb.translation) existingEntry.translation = newVerb.translation;
          if (!existingEntry.example && newVerb.example) existingEntry.example = newVerb.example;
          if (!existingEntry.categories) existingEntry.categories = [existingEntry.category || 'Общее'];
          if (!existingEntry.categories.includes('Неправильные глаголы')) {
            existingEntry.categories.push('Неправильные глаголы');
          }
          if (typeof window.saveDictionaryToStorage === 'function') window.saveDictionaryToStorage();
          if (typeof window.renderDictWordsList === 'function') window.renderDictWordsList();
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
  window.isVerbLearned = isVerbLearned;
  window.recordVerbCorrect = recordCorrect;
  window.recordVerbIncorrect = recordIncorrect;
  window.getDictEntry = getDictEntry;
  window.MASTERY_THRESHOLD = MASTERY_THRESHOLD;
  window.switchIrregularTab = switchTab;

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
