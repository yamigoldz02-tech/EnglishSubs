// @ts-check
/// <reference path="./types.js" />
/**
 * @file modules/dict-modals-manual.js
 * @description Manual Word and Phrase adding dialogs for Personal Dictionary in AI Lyric-Trainer.
 * Features:
 * - Real-time keyboard layout auto-correction (Cyrillic <-> Latin)
 * - Auto-capitalization settings
 * - Duplicate entry detection with conflict resolution (replace existing / keep both)
 * - Category and custom tag multi-pill selection
 * - Seamless integration with Leitner spaced repetition storage
 * 
 * @AI-SECTION: DICT_MANUAL_ADD_MODALS
 */

const SMART_INPUT_SETTINGS_KEY = 'addWord_smartInput_settings';

/**
 * Escapes unsafe HTML characters in a string.
 * @param {string} str 
 * @returns {string}
 */
function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Smart input settings state.
 */
let smartInputSettings = { autoCapitalize: true, autoLayout: true };
try {
  const saved = localStorage.getItem(SMART_INPUT_SETTINGS_KEY);
  if (saved) smartInputSettings = { ...smartInputSettings, ...JSON.parse(saved) };
} catch (e) {}

function saveSmartInputSettings() {
  localStorage.setItem(SMART_INPUT_SETTINGS_KEY, JSON.stringify(smartInputSettings));
}

function updateSmartInputUI() {
  const capCb = /** @type {HTMLInputElement|null} */ (document.getElementById('settingAutoCapitalize'));
  const layoutCb = /** @type {HTMLInputElement|null} */ (document.getElementById('settingAutoLayout'));
  const engHint = document.getElementById('addWordEngHint');
  const rusHint = document.getElementById('addWordRusHint');

  if (capCb) capCb.checked = smartInputSettings.autoCapitalize;
  if (layoutCb) layoutCb.checked = smartInputSettings.autoLayout;

  if (engHint) engHint.style.display = smartInputSettings.autoLayout ? '' : 'none';
  if (rusHint) rusHint.style.display = smartInputSettings.autoLayout ? '' : 'none';
}

/**
 * Smart input handler: layout fix first, then auto-capitalize.
 * @param {HTMLInputElement|HTMLTextAreaElement} inputEl 
 * @param {'cyrToLat'|'latToCyr'} layoutDirection 
 */
function handleSmartInput(inputEl, layoutDirection) {
  if (!inputEl) return;

  // 1. Auto layout correction first (converts wrong-layout characters)
  if (smartInputSettings.autoLayout && typeof window.applyLayoutFix === 'function') {
    window.applyLayoutFix(inputEl, layoutDirection);
  }

  // 2. Auto-capitalize first character (on already-corrected text)
  if (smartInputSettings.autoCapitalize && inputEl.value.length > 0) {
    const first = inputEl.value[0];
    const capitalized = first.toUpperCase();
    if (first !== capitalized) {
      const cursor = inputEl.selectionStart;
      const cursorEnd = inputEl.selectionEnd;
      inputEl.value = capitalized + inputEl.value.slice(1);
      try { inputEl.setSelectionRange(cursor, cursorEnd); } catch (e) {}
    }
  }
}

/**
 * Show temporary red flash error on an input border.
 * @param {HTMLElement|null} el 
 */
function flashError(el) {
  if (!el) return;
  const orig = el.style.borderColor;
  el.style.borderColor = '#f87171';
  el.focus();
  setTimeout(() => { el.style.borderColor = orig; }, 1800);
}

/**
 * Sets up all listeners and UI behaviors for Manual Word and Phrase Modals.
 */
function setupManualAddModals() {
  let manualAddType = 'word';

  const addWordBtn = document.getElementById('addWordBtn');
  const addWordModal = document.getElementById('addWordModal');
  const closeAddWordBtn = document.getElementById('closeAddWordBtn');
  const saveManualWordBtn = document.getElementById('saveManualWordBtn');

  const addManualPhraseBtn = document.getElementById('addManualPhraseBtn');
  const addPhraseModal = document.getElementById('addPhraseModal');
  const closeAddPhraseBtn = document.getElementById('closeAddPhraseBtn');
  const saveManualPhraseBtn = document.getElementById('saveManualPhraseBtn');

  // ── 1. Manual Word Modal Opening ─────────────────────────────────────────
  if (addWordBtn && addWordModal) {
    addWordBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      manualAddType = 'word';
      
      const titleEl = document.getElementById('manualWordTitle');
      const labelEngEl = document.getElementById('manualWordEngLabel');
      const labelRusEl = document.getElementById('manualWordRusLabel');
      const inputEngEl = /** @type {HTMLInputElement|null} */ (document.getElementById('manualWordEng'));
      const inputRusEl = /** @type {HTMLInputElement|null} */ (document.getElementById('manualWordRus'));
      const saveBtnEl = document.getElementById('saveManualWordBtn');
      
      if (titleEl) titleEl.textContent = '➕ Add word manually';
      if (labelEngEl) labelEngEl.textContent = 'English Word:';
      if (labelRusEl) labelRusEl.textContent = 'Russian Translation:';
      if (inputEngEl) {
        inputEngEl.value = '';
        inputEngEl.placeholder = 'например, apple';
      }
      if (inputRusEl) {
        inputRusEl.value = '';
        inputRusEl.placeholder = 'например, яблоко';
      }
      if (saveBtnEl) saveBtnEl.textContent = 'Save слово';
      
      if (typeof window.populateCategorySelectors === 'function') {
        window.populateCategorySelectors();
      }
      
      if (typeof window.openModalEl === 'function') {
        window.openModalEl(addWordModal);
      }

      updateSmartInputUI();
      if (inputEngEl) setTimeout(() => inputEngEl.focus(), 120);
    });
  }

  if (closeAddWordBtn && addWordModal) {
    closeAddWordBtn.addEventListener('click', () => {
      if (typeof window.closeModalEl === 'function') {
        window.closeModalEl(addWordModal);
      }
    });
  }

  // ── 2. Manual Phrase Modal Opening ───────────────────────────────────────
  if (addManualPhraseBtn && addPhraseModal) {
    addManualPhraseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      manualAddType = 'phrase';
      
      const engInput = /** @type {HTMLInputElement|null} */ (document.getElementById('manualPhraseEng'));
      const rusInput = /** @type {HTMLInputElement|null} */ (document.getElementById('manualPhraseRus'));
      const defInput = /** @type {HTMLInputElement|null} */ (document.getElementById('manualPhraseDefinition'));
      const ruleInput = /** @type {HTMLInputElement|null} */ (document.getElementById('manualPhraseRule'));
      
      if (engInput) engInput.value = '';
      if (rusInput) rusInput.value = '';
      if (defInput) defInput.value = '';
      if (ruleInput) ruleInput.value = '';
      
      if (typeof window.populateCategorySelectors === 'function') {
        window.populateCategorySelectors();
      }
      
      if (typeof window.openModalEl === 'function') {
        window.openModalEl(addPhraseModal);
      }
      if (engInput) setTimeout(() => engInput.focus(), 120);
    });
  }
  
  if (closeAddPhraseBtn && addPhraseModal) {
    closeAddPhraseBtn.addEventListener('click', () => {
      if (typeof window.closeModalEl === 'function') {
        window.closeModalEl(addPhraseModal);
      }
    });
  }

  // ── 3. Smart Input Bindings ──────────────────────────────────────────────
  const phraseEngInput = /** @type {HTMLInputElement|null} */ (document.getElementById('manualPhraseEng'));
  const phraseRusInput = /** @type {HTMLInputElement|null} */ (document.getElementById('manualPhraseRus'));
  const wordEngInput = /** @type {HTMLInputElement|null} */ (document.getElementById('manualWordEng'));
  const wordRusInput = /** @type {HTMLInputElement|null} */ (document.getElementById('manualWordRus'));

  if (phraseEngInput) phraseEngInput.addEventListener('input', () => handleSmartInput(phraseEngInput, 'cyrToLat'));
  if (phraseRusInput) phraseRusInput.addEventListener('input', () => handleSmartInput(phraseRusInput, 'latToCyr'));
  if (wordEngInput) wordEngInput.addEventListener('input', () => handleSmartInput(wordEngInput, 'cyrToLat'));
  if (wordRusInput) wordRusInput.addEventListener('input', () => handleSmartInput(wordRusInput, 'latToCyr'));

  // ── 4. Smart Input Settings Panel ────────────────────────────────────────
  
  // ── Folders & Categories Accordion Toggles ──
  const setupAccordionToggle = (toggleId, panelId, chevronId) => {
    const toggleBtn = document.getElementById(toggleId);
    const panel = document.getElementById(panelId);
    const chevron = document.getElementById(chevronId);
    if (toggleBtn && panel) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const isOpen = panel.style.display === 'flex';
        panel.style.display = isOpen ? 'none' : 'flex';
        if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
      });
    }
  };

  setupAccordionToggle('addWordFoldersToggle', 'addWordFoldersPanel', 'addWordFoldersChevron');
  setupAccordionToggle('addPhraseFoldersToggle', 'addPhraseFoldersPanel', 'addPhraseFoldersChevron');
  setupAccordionToggle('editWordFoldersToggle', 'editWordFoldersPanel', 'editWordFoldersChevron');

  const settingsToggleBtn = document.getElementById('addWordSettingsToggle');
  const settingsPanel = document.getElementById('addWordSettingsPanel');
  const settingsChevron = document.getElementById('addWordSettingsChevron');
  if (settingsToggleBtn && settingsPanel) {
    settingsToggleBtn.addEventListener('click', () => {
      const isOpen = settingsPanel.style.display === 'flex';
      settingsPanel.style.display = isOpen ? 'none' : 'flex';
      if (settingsChevron) settingsChevron.style.transform = isOpen ? '' : 'rotate(180deg)';
    });
  }

  const capCb = /** @type {HTMLInputElement|null} */ (document.getElementById('settingAutoCapitalize'));
  const layoutCb = /** @type {HTMLInputElement|null} */ (document.getElementById('settingAutoLayout'));
  if (capCb) {
    capCb.addEventListener('change', () => {
      smartInputSettings.autoCapitalize = capCb.checked;
      saveSmartInputSettings();
      updateSmartInputUI();
    });
  }
  if (layoutCb) {
    layoutCb.addEventListener('change', () => {
      smartInputSettings.autoLayout = layoutCb.checked;
      saveSmartInputSettings();
      updateSmartInputUI();
    });
  }

  // ── 5. Save Manual Phrase Handler ────────────────────────────────────────
  if (saveManualPhraseBtn && addPhraseModal) {
    saveManualPhraseBtn.addEventListener('click', () => {
      const engEl = /** @type {HTMLInputElement|null} */ (document.getElementById('manualPhraseEng'));
      const rusEl = /** @type {HTMLInputElement|null} */ (document.getElementById('manualPhraseRus'));
      const definitionEl = /** @type {HTMLInputElement|null} */ (document.getElementById('manualPhraseDefinition'));
      const ruleEl = /** @type {HTMLInputElement|null} */ (document.getElementById('manualPhraseRule'));
      
      if (!engEl || !rusEl) return;
      
      const eng = engEl.value.trim();
      const rus = rusEl.value.trim();
      
      const pillsCont = document.getElementById('manualPhraseCategoryPillsContainer');
      const selectedCats = pillsCont
        ? Array.from(pillsCont.querySelectorAll('.mcat-pill.selected')).map(p => /** @type {HTMLElement} */ (p).dataset.cat || 'Общее')
        : ['Общее'];
      const cats = selectedCats.length > 0 ? selectedCats : ['Общее'];
      const cat = cats[0]; 
      
      const customCont = document.getElementById('manualPhraseCustomCategoryPillsContainer');
      const selectedCustomCats = customCont
        ? Array.from(customCont.querySelectorAll('.mcat-pill.selected')).map(p => /** @type {HTMLElement} */ (p).dataset.cat || 'Без категории')
        : ['Без категории'];
      const customCats = selectedCustomCats.length > 0 ? selectedCustomCats : ['Без категории'];
      const customCat = customCats[0];
      
      const definition = definitionEl ? definitionEl.value.trim() : '';
      const rule = ruleEl ? ruleEl.value.trim() : '';
      
      if (eng === "") {
        flashError(engEl);
        const origPlaceholder = engEl.placeholder;
        engEl.placeholder = '⚠ Введите фразу!';
        setTimeout(() => { engEl.placeholder = origPlaceholder; }, 2200);
        return;
      }
      
      const wordsCount = eng.split(/\s+/).filter(Boolean).length;
      if (wordsCount < 3) {
        flashError(engEl);
        const origPlaceholder = engEl.placeholder;
        engEl.value = '';
        engEl.placeholder = '⚠ Введите фразу от 3 слов!';
        setTimeout(() => { engEl.placeholder = origPlaceholder; }, 2200);
        return;
      }
      
      if (rus === "") {
        flashError(rusEl);
        const origPlaceholder = rusEl.placeholder;
        rusEl.placeholder = '⚠ Укажите перевод!';
        setTimeout(() => { rusEl.placeholder = origPlaceholder; }, 2200);
        return;
      }
      
      const personalDict = window.personalDictionary || [];
      const dupIndex = personalDict.findIndex(w => w.word.toLowerCase() === eng.toLowerCase());
      
      if (dupIndex !== -1) {
        const existingConflict = document.getElementById('dupPhraseConflictBanner');
        if (existingConflict) existingConflict.remove();

        const conflictBanner = document.createElement('div');
        conflictBanner.id = 'dupPhraseConflictBanner';
        conflictBanner.style.cssText = `
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.35);
          border-radius: 12px;
          padding: 12px 14px;
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: fadeIn 0.2s ease;
          box-sizing: border-box;
          width: 100%;
        `;

        const old = personalDict[dupIndex];
        conflictBanner.innerHTML = `
          <div style="font-size: 0.78rem; color: #f59e0b; font-weight: 700; display: flex; align-items: center; gap: 6px;">
            ⚠️ «${escapeHTML(eng)}» уже есть в словаре
          </div>
          <div style="font-size: 0.73rem; color: var(--text-sub); line-height: 1.4;">
            Текущий перевод: <strong style="color: var(--text-main);">${escapeHTML(old.translation)}</strong>
            ${old.definition ? `<br>Значение: <em>${escapeHTML(old.definition)}</em>` : ''}
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button id="dupPhraseReplaceBtn" style="
              background: linear-gradient(135deg, #f59e0b, #d97706);
              color: #000;
              border: none;
              border-radius: 10px;
              padding: 7px 14px;
              font-size: 0.78rem;
              font-weight: 700;
              cursor: pointer;
              flex: 1;
              transition: opacity 0.2s;
              outline: none;
            ">🔄 Заменить старое</button>
            <button id="dupPhraseKeepBothBtn" style="
              background: rgba(255,255,255,0.07);
              color: var(--text-main);
              border: 1px solid rgba(255,255,255,0.15);
              border-radius: 10px;
              padding: 7px 14px;
              font-size: 0.78rem;
              font-weight: 600;
              cursor: pointer;
              flex: 1;
              transition: opacity 0.2s;
              outline: none;
            ">➕ Добавить ещё раз</button>
            <button id="dupPhraseCancelBtn" style="
              background: transparent;
              color: var(--text-sub);
              border: none;
              border-radius: 10px;
              padding: 7px 10px;
              font-size: 0.78rem;
              cursor: pointer;
              transition: opacity 0.2s;
              outline: none;
            ">✕</button>
          </div>
        `;

        if (saveManualPhraseBtn.parentNode) {
          saveManualPhraseBtn.parentNode.insertBefore(conflictBanner, saveManualPhraseBtn);
        }

        const buildNewPhrase = () => ({
          word: eng,
          translation: rus,
          categories: cats,
          category: cat,
          customCategory: customCat,
          customCategories: customCats,
          definition: definition,
          rule: rule,
          type: 'phrase',
          level: 0,
          interval: 0,
          nextReview: Date.now()
        });

        const finishPhraseSave = () => {
          conflictBanner.remove();
          engEl.value = '';
          rusEl.value = '';
          if (definitionEl) definitionEl.value = '';
          if (ruleEl) ruleEl.value = '';
          
          if (customCont) {
            customCont.querySelectorAll('.mcat-pill').forEach(p => {
              const el = /** @type {HTMLElement} */ (p);
              const isNone = el.dataset.cat === 'Без категории';
              el.classList.toggle('selected', isNone);
              el.style.background = isNone ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.04)';
              el.style.color = isNone ? '#ffffff' : 'var(--text-sub)';
              el.style.borderColor = isNone ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255,255,255,0.1)';
            });
          }
          
          if (typeof window.renderDictWordsList === 'function') window.renderDictWordsList();
          if (typeof window.resetFlashcard === 'function') window.resetFlashcard();
          if (typeof window.recordActivity === 'function') window.recordActivity();
          if (typeof window.updateSavedWordsCount === 'function') window.updateSavedWordsCount();
          
          const sb = document.getElementById('saveManualPhraseBtn');
          if (sb) {
            const ot = sb.textContent;
            sb.textContent = `✓ «${eng.slice(0, 18)}${eng.length > 18 ? '…' : ''}» сохранено!`;
            sb.style.background = 'linear-gradient(135deg, #1db954, #16a34a)';
            /** @type {HTMLButtonElement} */ (sb).disabled = true;
            setTimeout(() => { 
              sb.textContent = ot; 
              sb.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)'; 
              /** @type {HTMLButtonElement} */ (sb).disabled = false; 
              engEl.focus(); 
            }, 1400);
          }
        };

        const repBtn = document.getElementById('dupPhraseReplaceBtn');
        const keepBtn = document.getElementById('dupPhraseKeepBothBtn');
        const canBtn = document.getElementById('dupPhraseCancelBtn');

        if (repBtn) {
          repBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            personalDict[dupIndex] = Object.assign({}, old, buildNewPhrase(), { level: old.level, interval: old.interval, nextReview: old.nextReview });
            if (typeof window.saveDictionaryToStorage === 'function') window.saveDictionaryToStorage();
            finishPhraseSave();
          });
        }

        if (keepBtn) {
          keepBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            personalDict.push(buildNewPhrase());
            if (typeof window.saveDictionaryToStorage === 'function') window.saveDictionaryToStorage();
            finishPhraseSave();
          });
        }

        if (canBtn) {
          canBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            conflictBanner.remove();
          });
        }

        return;
      }
      
      // Save new phrase
      const newPhrase = {
        word: eng,
        translation: rus,
        categories: cats,
        category: cat,
        customCategory: customCat,
        customCategories: customCats,
        definition: definition,
        rule: rule,
        type: 'phrase',
        level: 0,
        interval: 0,
        nextReview: Date.now()
      };
      
      personalDict.push(newPhrase);
      if (typeof window.saveDictionaryToStorage === 'function') window.saveDictionaryToStorage();
      if (typeof window.triggerWordAddedPCAnimation === 'function') window.triggerWordAddedPCAnimation(eng, 'phrase', saveManualPhraseBtn);
      
      engEl.value = '';
      rusEl.value = '';
      if (definitionEl) definitionEl.value = '';
      if (ruleEl) ruleEl.value = '';
      
      if (pillsCont) {
        pillsCont.querySelectorAll('.mcat-pill').forEach(p => {
          const el = /** @type {HTMLElement} */ (p);
          const isObe = el.dataset.cat === 'Общее';
          el.classList.toggle('selected', isObe);
          el.style.background = isObe ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.04)';
          el.style.color = isObe ? '#ffffff' : 'var(--text-sub)';
          el.style.borderColor = isObe ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255,255,255,0.1)';
        });
      }
      if (customCont) {
        customCont.querySelectorAll('.mcat-pill').forEach(p => {
          const el = /** @type {HTMLElement} */ (p);
          const isNone = el.dataset.cat === 'Без категории';
          el.classList.toggle('selected', isNone);
          el.style.background = isNone ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.04)';
          el.style.color = isNone ? '#ffffff' : 'var(--text-sub)';
          el.style.borderColor = isNone ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255,255,255,0.1)';
        });
      }
      
      if (typeof window.renderDictWordsList === 'function') window.renderDictWordsList();
      if (typeof window.resetFlashcard === 'function') window.resetFlashcard();
      if (typeof window.recordActivity === 'function') window.recordActivity();
      if (typeof window.updateSavedWordsCount === 'function') window.updateSavedWordsCount();
      
      const origText = saveManualPhraseBtn.textContent;
      saveManualPhraseBtn.textContent = `✓ «${eng.slice(0, 18)}${eng.length > 18 ? '…' : ''}» сохранено!`;
      saveManualPhraseBtn.style.background = 'linear-gradient(135deg, #1db954, #16a34a)';
      saveManualPhraseBtn.disabled = true;
      setTimeout(() => {
        saveManualPhraseBtn.textContent = origText;
        saveManualPhraseBtn.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
        saveManualPhraseBtn.disabled = false;
        engEl.focus();
      }, 1400);
    });
  }

  const phraseRusEl = document.getElementById('manualPhraseRus');
  if (phraseRusEl && saveManualPhraseBtn) {
    phraseRusEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); saveManualPhraseBtn.click(); }
    });
  }

  // ── 6. Save Manual Word Handler ──────────────────────────────────────────
  if (saveManualWordBtn && addWordModal) {
    saveManualWordBtn.addEventListener('click', () => {
      const wordEngEl = /** @type {HTMLInputElement|null} */ (document.getElementById('manualWordEng'));
      const wordRusEl = /** @type {HTMLInputElement|null} */ (document.getElementById('manualWordRus'));
      const definitionEl = /** @type {HTMLInputElement|null} */ (document.getElementById('manualWordDefinition'));
      const ruleEl = /** @type {HTMLInputElement|null} */ (document.getElementById('manualWordRule'));
      
      if (!wordEngEl || !wordRusEl) return;
      
      const rawEng = wordEngEl.value.trim();
      const eng = typeof window.formatDictionaryWord === 'function' ? window.formatDictionaryWord(rawEng) : rawEng;
      const rus = wordRusEl.value.trim();
      
      const pillsCont = document.getElementById('manualCategoryPillsContainer');
      const selectedCats = pillsCont
        ? Array.from(pillsCont.querySelectorAll('.mcat-pill.selected')).map(p => /** @type {HTMLElement} */ (p).dataset.cat || 'Общее')
        : ['Общее'];
      const cats = selectedCats.length > 0 ? selectedCats : ['Общее'];
      const cat = cats[0];
      
      const customCont = document.getElementById('manualWordCustomCategoryPillsContainer');
      const selectedCustomCats = customCont
        ? Array.from(customCont.querySelectorAll('.mcat-pill.selected')).map(p => /** @type {HTMLElement} */ (p).dataset.cat || 'Без категории')
        : ['Без категории'];
      const customCats = selectedCustomCats.length > 0 ? selectedCustomCats : ['Без категории'];
      const customCat = customCats[0];
      
      const definition = definitionEl ? definitionEl.value.trim() : '';
      const rule = ruleEl ? ruleEl.value.trim() : '';
      
      if (eng === "" || rus === "") {
        alert(manualAddType === 'phrase' ? "Пожалуйста, заполните оба поля: английская фраза и перевод!" : "Пожалуйста, заполните оба поля: английское слово и перевод!");
        return;
      }
      
      const personalDict = window.personalDictionary || [];
      const dupIndex = personalDict.findIndex(w => w.word.toLowerCase() === eng.toLowerCase());
      
      if (dupIndex !== -1) {
        const existingConflict = document.getElementById('dupConflictBanner');
        if (existingConflict) existingConflict.remove();

        const conflictBanner = document.createElement('div');
        conflictBanner.id = 'dupConflictBanner';
        conflictBanner.style.cssText = `
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.35);
          border-radius: 12px;
          padding: 12px 14px;
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: fadeIn 0.2s ease;
          box-sizing: border-box;
          width: 100%;
        `;

        const old = personalDict[dupIndex];
        conflictBanner.innerHTML = `
          <div style="font-size: 0.78rem; color: #f59e0b; font-weight: 700; display: flex; align-items: center; gap: 6px;">
            ⚠️ «${escapeHTML(eng)}» уже есть в словаре
          </div>
          <div style="font-size: 0.73rem; color: var(--text-sub); line-height: 1.4;">
            Текущий перевод: <strong style="color: var(--text-main);">${escapeHTML(old.translation)}</strong>
            ${old.definition ? `<br>Значение: <em>${escapeHTML(old.definition)}</em>` : ''}
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button id="dupReplaceBtn" style="
              background: linear-gradient(135deg, #f59e0b, #d97706);
              color: #000;
              border: none;
              border-radius: 10px;
              padding: 7px 14px;
              font-size: 0.78rem;
              font-weight: 700;
              cursor: pointer;
              flex: 1;
              transition: opacity 0.2s;
              outline: none;
            ">🔄 Заменить старое</button>
            <button id="dupKeepBothBtn" style="
              background: rgba(255,255,255,0.07);
              color: var(--text-main);
              border: 1px solid rgba(255,255,255,0.15);
              border-radius: 10px;
              padding: 7px 14px;
              font-size: 0.78rem;
              font-weight: 600;
              cursor: pointer;
              flex: 1;
              transition: opacity 0.2s;
              outline: none;
            ">➕ Добавить ещё раз</button>
            <button id="dupCancelBtn" style="
              background: transparent;
              color: var(--text-sub);
              border: none;
              border-radius: 10px;
              padding: 7px 10px;
              font-size: 0.78rem;
              cursor: pointer;
              transition: opacity 0.2s;
              outline: none;
            ">✕</button>
          </div>
        `;

        if (saveManualWordBtn.parentNode) {
          saveManualWordBtn.parentNode.insertBefore(conflictBanner, saveManualWordBtn);
        }

        const buildNewWord = () => {
          let actualType = manualAddType;
          if (actualType === 'word') {
            const wordCount = eng.split(/\s+/).filter(Boolean).length;
            if (wordCount >= 3) {
              actualType = 'phrase';
            }
          }
          return {
            word: eng,
            translation: rus,
            categories: cats,
            category: cat,
            customCategory: customCat,
            customCategories: customCats,
            definition: definition,
            rule: rule,
            type: actualType,
            level: 0,
            interval: 0,
            nextReview: Date.now()
          };
        };

        const finishSave = () => {
          conflictBanner.remove();
          wordEngEl.value = '';
          wordRusEl.value = '';
          if (definitionEl) definitionEl.value = '';
          if (ruleEl) ruleEl.value = '';
          
          if (customCont) {
            customCont.querySelectorAll('.mcat-pill').forEach(p => {
              const el = /** @type {HTMLElement} */ (p);
              const isNone = el.dataset.cat === 'Без категории';
              el.classList.toggle('selected', isNone);
              el.style.background = isNone ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.04)';
              el.style.color = isNone ? '#ffffff' : 'var(--text-sub)';
              el.style.borderColor = isNone ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255,255,255,0.1)';
            });
          }
          
          if (typeof window.renderDictWordsList === 'function') window.renderDictWordsList();
          if (typeof window.resetFlashcard === 'function') window.resetFlashcard();
          if (typeof window.recordActivity === 'function') window.recordActivity();
          
          const sb = document.getElementById('saveManualWordBtn');
          if (sb) {
            const ot = sb.textContent; 
            const ob = sb.style.background;
            sb.textContent = `✓ «${eng}» сохранено!`;
            sb.style.background = 'linear-gradient(135deg, #1db954, #16a34a)';
            /** @type {HTMLButtonElement} */ (sb).disabled = true;
            setTimeout(() => { 
              sb.textContent = ot; 
              sb.style.background = ob; 
              /** @type {HTMLButtonElement} */ (sb).disabled = false; 
              wordEngEl.focus(); 
            }, 1400);
          }
        };

        const repBtn = document.getElementById('dupReplaceBtn');
        const keepBtn = document.getElementById('dupKeepBothBtn');
        const canBtn = document.getElementById('dupCancelBtn');

        if (repBtn) {
          repBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            personalDict[dupIndex] = Object.assign({}, old, buildNewWord(), { level: old.level, interval: old.interval, nextReview: old.nextReview });
            if (typeof window.saveDictionaryToStorage === 'function') window.saveDictionaryToStorage();
            finishSave();
          });
        }

        if (keepBtn) {
          keepBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            personalDict.push(buildNewWord());
            if (typeof window.saveDictionaryToStorage === 'function') window.saveDictionaryToStorage();
            finishSave();
          });
        }

        if (canBtn) {
          canBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            conflictBanner.remove();
          });
        }

        return;
      }
      
      let actualType = manualAddType;
      if (actualType === 'word') {
        const wordCount = eng.split(/\s+/).filter(Boolean).length;
        if (wordCount >= 3) {
          actualType = 'phrase';
        }
      }
      const newWord = {
        word: eng,
        translation: rus,
        categories: cats,
        category: cat,
        customCategory: customCat,
        customCategories: customCats,
        definition: definition,
        rule: rule,
        type: actualType,
        level: 0,
        interval: 0,
        nextReview: Date.now(),
        addedAt: Date.now()
      };
      
      personalDict.push(newWord);
      if (typeof window.saveDictionaryToStorage === 'function') window.saveDictionaryToStorage();
      if (typeof window.triggerWordAddedPCAnimation === 'function') window.triggerWordAddedPCAnimation(eng, actualType, saveManualWordBtn);
      
      wordEngEl.value = '';
      wordRusEl.value = '';
      if (definitionEl) definitionEl.value = '';
      if (ruleEl) ruleEl.value = '';
      
      if (pillsCont) {
        pillsCont.querySelectorAll('.mcat-pill').forEach(p => {
          const el = /** @type {HTMLElement} */ (p);
          const isObe = el.dataset.cat === 'Общее';
          el.classList.toggle('selected', isObe);
          el.style.background = isObe ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.04)';
          el.style.color = isObe ? '#ffffff' : 'var(--text-sub)';
          el.style.borderColor = isObe ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255,255,255,0.1)';
        });
      }
      if (customCont) {
        customCont.querySelectorAll('.mcat-pill').forEach(p => {
          const el = /** @type {HTMLElement} */ (p);
          const isNone = el.dataset.cat === 'Без категории';
          el.classList.toggle('selected', isNone);
          el.style.background = isNone ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.04)';
          el.style.color = isNone ? '#ffffff' : 'var(--text-sub)';
          el.style.borderColor = isNone ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255,255,255,0.1)';
        });
      }

      if (typeof window.renderDictWordsList === 'function') window.renderDictWordsList();
      if (typeof window.resetFlashcard === 'function') window.resetFlashcard();
      if (typeof window.recordActivity === 'function') window.recordActivity();

      const saveBtn = document.getElementById('saveManualWordBtn');
      if (saveBtn) {
        const origText = saveBtn.textContent;
        const origBg = saveBtn.style.background;
        saveBtn.textContent = `✓ «${eng}» сохранено!`;
        saveBtn.style.background = 'linear-gradient(135deg, #1db954, #16a34a)';
        saveBtn.disabled = true;
        setTimeout(() => {
          saveBtn.textContent = origText;
          saveBtn.style.background = origBg;
          saveBtn.disabled = false;
          wordEngEl.focus();
        }, 1400);
      }
    });
  }
}

// Auto-bind on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupManualAddModals);
} else {
  setupManualAddModals();
}

// Global exposure
window.handleSmartInput = handleSmartInput;
window.updateSmartInputUI = updateSmartInputUI;
window.setupManualAddModals = setupManualAddModals;
