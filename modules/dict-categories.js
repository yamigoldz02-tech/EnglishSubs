// @ts-check
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - DICTIONARY CATEGORIES & FOLDERS MANAGER
 * Manages user folders, custom category tags, hidden categories, archive migrations,
 * and selector population across the app.
 * @AI-SECTION: DICT_CATEGORIES_MANAGER
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

export let personalCategories = ['Общее', 'Базовые глаголы', 'Сленг и идиомы', 'Социальные фразы'];
export let personalCustomCategories = ['Сленг', 'Идиомы', 'Грамматика', 'Путешествия'];
export let personalHiddenCategories = [];

// Keep window properties in sync
if (typeof window !== 'undefined') {
  window.personalCategories = personalCategories;
  window.personalCustomCategories = personalCustomCategories;
  window.personalHiddenCategories = personalHiddenCategories;
}

export function loadCategories() {
  try {
    const saved = localStorage.getItem('personal_categories');
    if (saved) {
      personalCategories = JSON.parse(saved);
    } else {
      localStorage.setItem('personal_categories', JSON.stringify(personalCategories));
    }
    
    const savedCustom = localStorage.getItem('personal_custom_categories');
    if (savedCustom) {
      personalCustomCategories = JSON.parse(savedCustom);
    } else {
      localStorage.setItem('personal_custom_categories', JSON.stringify(personalCustomCategories));
    }

    if (typeof window !== 'undefined') {
      window.personalCategories = personalCategories;
      window.personalCustomCategories = personalCustomCategories;
    }
  } catch (e) {
    console.error('Failed to load categories:', e);
  }
}

export function saveCategories() {
  localStorage.setItem('personal_categories', JSON.stringify(personalCategories));
  localStorage.setItem('personal_custom_categories', JSON.stringify(personalCustomCategories));
  localStorage.setItem('personal_hidden_categories', JSON.stringify(personalHiddenCategories));
  if (typeof window !== 'undefined') {
    window.personalCategories = personalCategories;
    window.personalCustomCategories = personalCustomCategories;
    window.personalHiddenCategories = personalHiddenCategories;
  }
}

export function loadHiddenCategories() {
  try {
    const saved = localStorage.getItem('personal_hidden_categories');
    if (saved) {
      personalHiddenCategories = JSON.parse(saved);
    } else {
      localStorage.setItem('personal_hidden_categories', JSON.stringify(personalHiddenCategories));
    }
    if (typeof window !== 'undefined') {
      window.personalHiddenCategories = personalHiddenCategories;
    }
  } catch (e) {
    console.error('Failed to load hidden categories:', e);
  }
}

export function getActiveWordsCount() {
  const dict = window.personalDictionary;
  if (!dict) return 0;
  return dict.filter(w => {
    if (w.categories && w.categories.some(c => personalHiddenCategories.includes(c))) return false;
    return true;
  }).length;
}

export function _doArchiveCurrentDictionary(manual = false) {
  if (!personalCategories.includes('Старые')) {
    personalCategories.push('Старые');
  }
  if (!personalHiddenCategories.includes('Старые')) {
    personalHiddenCategories.push('Старые');
  }
  saveCategories();

  let movedCount = 0;
  const dict = window.personalDictionary;
  if (dict && dict.length > 0) {
    dict.forEach(w => {
      const isOnlyOld = w.categories && w.categories.length === 1 && w.categories[0] === 'Старые';
      if (!isOnlyOld) {
        w.category = 'Старые';
        w.categories = ['Старые'];
        movedCount++;
      }
    });
  }

  if (typeof window.saveDictionaryToStorage === 'function') {
    window.saveDictionaryToStorage();
  }
  if (typeof window.clearStudySession === 'function') {
    window.clearStudySession();
  }

  if (typeof window.renderDictWordsList === 'function') window.renderDictWordsList();
  if (typeof populateCategorySelectors === 'function') populateCategorySelectors();
  if (typeof renderManageFoldersList === 'function') renderManageFoldersList();

  if (manual && window.showToast) {
    window.showToast(`Успешно отложено ${movedCount} слов в архив «Старые». Новый словарь готов! 🚀`, 'success');
  }
}

export function archiveCurrentDictionaryToOldWords(manual = false) {
  const dict = window.personalDictionary;
  if (!dict || dict.length === 0) {
    if (manual && window.showToast) window.showToast('В вашем словаре пока нет слов для архивации.', 'info');
    return;
  }

  const activeCount = getActiveWordsCount();

  if (manual) {
    if (activeCount === 0) {
      if (window.showToast) window.showToast('В активном словаре нет слов для архивации. Все слова уже в «Старые»!', 'info');
      return;
    }
    const confirmMsg = `Отложить ${activeCount} активных слов/фраз в скрытую папку «Старые» и создать полностью новый словарь?`;
    if (window.showCustomConfirm) {
      window.showCustomConfirm('Архивация словаря', confirmMsg, { isDestructive: false }).then(confirmed => {
        if (confirmed) _doArchiveCurrentDictionary(true);
      });
      return;
    } else if (!confirm(confirmMsg)) {
      return;
    }
  }

  _doArchiveCurrentDictionary(manual);
}

export function runOldWordsMigration() {
  const migratedFlagV3 = localStorage.getItem('galaxy_migrated_old_words_v3');
  const dict = window.personalDictionary;

  if (!migratedFlagV3 && dict && dict.length > 0) {
    console.log('Running automatic migration v3 to archive active dictionary into "Старые"...');
    _doArchiveCurrentDictionary(false);
    localStorage.setItem('galaxy_migrated_old_words_v1', 'true');
    localStorage.setItem('galaxy_migrated_old_words_v2', 'true');
    localStorage.setItem('galaxy_migrated_old_words_v3', 'true');
  }
}

export function populateCategorySelectors() {
  const activeTab = window.activeDictTab || 'personal';

  // 1. Populate dictCategoryFilter (Folders) in modal
  const dictFilter = /** @type {HTMLSelectElement|null} */ (document.getElementById('dictCategoryFilter'));
  if (dictFilter) {
    const currentValue = dictFilter.value || '';
    dictFilter.innerHTML = '';
    
    if (activeTab === 'personal') {
      const allOpt = document.createElement('option');
      allOpt.value = 'Все слова';
      allOpt.textContent = 'Все папки';
      dictFilter.appendChild(allOpt);
      
      personalCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        dictFilter.appendChild(option);
      });
      
      if (currentValue === 'Все слова' || personalCategories.includes(currentValue)) {
        dictFilter.value = currentValue;
      } else {
        dictFilter.value = 'Все слова';
      }
    } else {
      const p1 = document.createElement('option');
      p1.value = '«Топ-300 Первых слов»';
      p1.textContent = '«Топ-300 Первых слов»';
      dictFilter.appendChild(p1);
      
      const p2 = document.createElement('option');
      p2.value = '«Топ-600 Базовых слов»';
      p2.textContent = '«Топ-600 Базовых слов»';
      dictFilter.appendChild(p2);
      
      const p3 = document.createElement('option');
      p3.value = '«Топ-1000 Продвинутых слов»';
      p3.textContent = '«Топ-1000 Продвинутых слов»';
      dictFilter.appendChild(p3);
      
      if (currentValue.startsWith('«Топ-')) {
        dictFilter.value = currentValue;
      } else {
        dictFilter.value = '«Топ-300 Первых слов»';
      }
    }
    
    const trainingFolderSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById('trainingFolderSelect'));
    if (trainingFolderSelect) {
      trainingFolderSelect.innerHTML = dictFilter.innerHTML;
      trainingFolderSelect.value = dictFilter.value;
    }
  }

  // 1b. Populate dictCustomCategoryFilter (Categories) in modal
  const dictCustomFilter = /** @type {HTMLSelectElement|null} */ (document.getElementById('dictCustomCategoryFilter'));
  if (dictCustomFilter) {
    const currentValue = dictCustomFilter.value || '';
    dictCustomFilter.innerHTML = '';
    
    const allOpt = document.createElement('option');
    allOpt.value = 'All Categories';
    allOpt.textContent = 'Все категории';
    dictCustomFilter.appendChild(allOpt);
    
    const noneOpt = document.createElement('option');
    noneOpt.value = 'Без категории';
    noneOpt.textContent = 'Без категории';
    dictCustomFilter.appendChild(noneOpt);
    
    personalCustomCategories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      dictCustomFilter.appendChild(option);
    });
    
    if (currentValue === 'All Categories' || currentValue === 'Без категории' || personalCustomCategories.includes(currentValue)) {
      dictCustomFilter.value = currentValue;
    } else {
      dictCustomFilter.value = 'All Categories';
    }
  }

  // 2. Populate wordCategorySelect inside sidebar if it is present
  const wordSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById('wordCategorySelect'));
  if (wordSelect) {
    const currentValue = wordSelect.value || 'Общее';
    wordSelect.innerHTML = '';
    personalCategories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = `📁 ${cat}`;
      wordSelect.appendChild(option);
    });
    if (personalCategories.includes(currentValue)) {
      wordSelect.value = currentValue;
    } else {
      wordSelect.value = 'Общее';
    }
  }

  // 2b. Populate wordCustomCategorySelect inside sidebar if it is present
  const wordCustomSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById('wordCustomCategorySelect'));
  if (wordCustomSelect) {
    const currentValue = wordCustomSelect.value || 'Без категории';
    wordCustomSelect.innerHTML = '';
    
    const noneOpt = document.createElement('option');
    noneOpt.value = 'Без категории';
    noneOpt.textContent = '🏷️ Без категории';
    wordCustomSelect.appendChild(noneOpt);
    
    personalCustomCategories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = `🏷️ ${cat}`;
      wordCustomSelect.appendChild(option);
    });
    if (currentValue === 'Без категории' || personalCustomCategories.includes(currentValue)) {
      wordCustomSelect.value = currentValue;
    } else {
      wordCustomSelect.value = 'Без категории';
    }
  }

  // 3. Populate manualWordCategory multi-pill container in manual add modal
  const multiCatContainer = document.getElementById('manualCategoryPillsContainer');
  if (multiCatContainer) {
    const currentSelected = Array.from(multiCatContainer.querySelectorAll('.mcat-pill.selected'))
      .map(p => /** @type {HTMLElement} */ (p).dataset.cat);
    const preSelected = currentSelected.length > 0 ? currentSelected : ['Общее'];

    multiCatContainer.innerHTML = '';
    personalCategories.forEach(cat => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mcat-pill' + (preSelected.includes(cat) ? ' selected' : '');
      pill.dataset.cat = cat;
      pill.innerHTML = `<svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg><span>${escapeHTML(cat)}</span>`;
      pill.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const isOn = pill.classList.contains('selected');
        const allSelected = multiCatContainer.querySelectorAll('.mcat-pill.selected');
        if (isOn && allSelected.length <= 1) return;
        pill.classList.toggle('selected', !isOn);
      });
      multiCatContainer.appendChild(pill);
    });
  }

  // 3b. Populate manualWordCustomCategory multi-pill container in manual add modal
  const wordCustomCont = document.getElementById('manualWordCustomCategoryPillsContainer');
  if (wordCustomCont) {
    const currentSelected = Array.from(wordCustomCont.querySelectorAll('.mcat-pill.selected'))
      .map(p => /** @type {HTMLElement} */ (p).dataset.cat);
    const preSelected = currentSelected.length > 0 ? currentSelected : ['Без категории'];

    wordCustomCont.innerHTML = '';

    const nonePill = document.createElement('button');
    nonePill.type = 'button';
    nonePill.className = 'mcat-pill' + (preSelected.includes('Без категории') ? ' selected' : '');
    nonePill.dataset.cat = 'Без категории';
    nonePill.innerHTML = `<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg><span>Без категории</span>`;
    nonePill.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const isOn = nonePill.classList.contains('selected');
      if (isOn) {
        const allSelected = wordCustomCont.querySelectorAll('.mcat-pill.selected');
        if (allSelected.length <= 1) return;
        nonePill.classList.remove('selected');
      } else {
        wordCustomCont.querySelectorAll('.mcat-pill.selected').forEach(p => {
          if (/** @type {HTMLElement} */ (p).dataset.cat !== 'Без категории') {
            p.classList.remove('selected');
          }
        });
        nonePill.classList.add('selected');
      }
    });
    wordCustomCont.appendChild(nonePill);

    personalCustomCategories.forEach(cat => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mcat-pill' + (preSelected.includes(cat) ? ' selected' : '');
      pill.dataset.cat = cat;
      pill.innerHTML = `<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg><span>${escapeHTML(cat)}</span>`;
      pill.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const isOn = pill.classList.contains('selected');
        if (isOn) {
          const allSelected = wordCustomCont.querySelectorAll('.mcat-pill.selected');
          if (allSelected.length <= 1) {
            pill.classList.remove('selected');
            nonePill.classList.add('selected');
          } else {
            pill.classList.remove('selected');
          }
        } else {
          nonePill.classList.remove('selected');
          pill.classList.add('selected');
        }
      });
      wordCustomCont.appendChild(pill);
    });
  }

  // 4. Populate manualPhraseCategory multi-pill container in manual add phrase modal
  const phrasePillsContainer = document.getElementById('manualPhraseCategoryPillsContainer');
  if (phrasePillsContainer) {
    const currentSelected = Array.from(phrasePillsContainer.querySelectorAll('.mcat-pill.selected'))
      .map(p => /** @type {HTMLElement} */ (p).dataset.cat);
    const preSelected = currentSelected.length > 0 ? currentSelected : ['Общее'];

    phrasePillsContainer.innerHTML = '';
    personalCategories.forEach(cat => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mcat-pill' + (preSelected.includes(cat) ? ' selected' : '');
      pill.dataset.cat = cat;
      pill.innerHTML = `<svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg><span>${escapeHTML(cat)}</span>`;
      pill.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const isOn = pill.classList.contains('selected');
        const allSelected = phrasePillsContainer.querySelectorAll('.mcat-pill.selected');
        if (isOn && allSelected.length <= 1) return;
        pill.classList.toggle('selected', !isOn);
      });
      phrasePillsContainer.appendChild(pill);
    });
  }

  // 4b. Populate manualPhraseCustomCategory multi-pill container in manual add phrase modal
  const phraseCustomCont = document.getElementById('manualPhraseCustomCategoryPillsContainer');
  if (phraseCustomCont) {
    const currentSelected = Array.from(phraseCustomCont.querySelectorAll('.mcat-pill.selected'))
      .map(p => /** @type {HTMLElement} */ (p).dataset.cat);
    const preSelected = currentSelected.length > 0 ? currentSelected : ['Без категории'];

    phraseCustomCont.innerHTML = '';

    const nonePill = document.createElement('button');
    nonePill.type = 'button';
    nonePill.className = 'mcat-pill' + (preSelected.includes('Без категории') ? ' selected' : '');
    nonePill.dataset.cat = 'Без категории';
    nonePill.innerHTML = `<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg><span>Без категории</span>`;
    nonePill.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const isOn = nonePill.classList.contains('selected');
      if (isOn) {
        const allSelected = phraseCustomCont.querySelectorAll('.mcat-pill.selected');
        if (allSelected.length <= 1) return;
        nonePill.classList.remove('selected');
      } else {
        phraseCustomCont.querySelectorAll('.mcat-pill.selected').forEach(p => {
          if (/** @type {HTMLElement} */ (p).dataset.cat !== 'Без категории') {
            p.classList.remove('selected');
          }
        });
        nonePill.classList.add('selected');
      }
    });
    phraseCustomCont.appendChild(nonePill);

    personalCustomCategories.forEach(cat => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mcat-pill' + (preSelected.includes(cat) ? ' selected' : '');
      pill.dataset.cat = cat;
      pill.innerHTML = `<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg><span>${escapeHTML(cat)}</span>`;
      pill.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const isOn = pill.classList.contains('selected');
        if (isOn) {
          const allSelected = phraseCustomCont.querySelectorAll('.mcat-pill.selected');
          if (allSelected.length <= 1) {
            pill.classList.remove('selected');
            nonePill.classList.add('selected');
          } else {
            pill.classList.remove('selected');
          }
        } else {
          nonePill.classList.remove('selected');
          pill.classList.add('selected');
        }
      });
      phraseCustomCont.appendChild(pill);
    });
  }
}

export function renderManageFoldersList() {
  const list = document.getElementById('manageFoldersList');
  if (!list) return;
  list.innerHTML = '';
  
  const catsToRender = [...personalCategories];
  if (!catsToRender.includes('Старые')) catsToRender.push('Старые');

  catsToRender.forEach(cat => {
    const isHidden = personalHiddenCategories.includes(cat);
    const row = document.createElement('div');
    row.className = 'manage-folder-row';
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'manage-folder-name';
    nameDiv.innerHTML = `
      <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; opacity: 0.75;"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
      <span>${escapeHTML(cat)}</span>
    `;
    
    const toggleWrapper = document.createElement('label');
    toggleWrapper.className = 'manage-folder-switch';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !isHidden;
    
    const slider = document.createElement('span');
    slider.className = 'manage-folder-slider';
    
    toggleWrapper.appendChild(checkbox);
    toggleWrapper.appendChild(slider);
    
    checkbox.addEventListener('change', () => {
      const checked = checkbox.checked;
      if (checked) {
        personalHiddenCategories = personalHiddenCategories.filter(c => c !== cat);
      } else {
        if (!personalHiddenCategories.includes(cat)) {
          personalHiddenCategories.push(cat);
        }
      }
      saveCategories();
    });
    
    row.appendChild(nameDiv);
    row.appendChild(toggleWrapper);
    list.appendChild(row);
  });
}

export function setupCategoryManagementUI() {
  const categoryFilter = /** @type {HTMLSelectElement|null} */ (document.getElementById('dictCategoryFilter'));
  const customCategoryFilter = /** @type {HTMLSelectElement|null} */ (document.getElementById('dictCustomCategoryFilter'));
  const searchInput = /** @type {HTMLInputElement|null} */ (document.getElementById('dictSearchInput'));

  // Create custom word category / playlist folder
  const addCatBtn = document.getElementById('addCustomCategoryBtn');
  if (addCatBtn) {
    addCatBtn.addEventListener('click', async () => {
      const name = await (window.showCustomPrompt ? window.showCustomPrompt('📁 Новая папка', 'Enter new folder name для слов:', 'Например: Глаголы движения') : prompt('Enter new folder name для слов:'));
      if (name === null) return;
      const cleanName = name.trim();
      if (!cleanName) {
        if (window.showToast) window.showToast('Название папки не может быть пустым!', 'error');
        else alert('Название папки не может быть пустым!');
        return;
      }
      if (cleanName.length > 25) {
        if (window.showToast) window.showToast('Название папки слишком длинное (максимум 25 символов)!', 'error');
        else alert('Название папки слишком длинное (максимум 25 символов)!');
        return;
      }
      
      const exists = personalCategories.some(c => c.toLowerCase() === cleanName.toLowerCase());
      if (exists) {
        if (window.showToast) window.showToast('Папка с таким названием уже существует!', 'error');
        else alert('Папка с таким названием уже существует!');
        return;
      }
      
      personalCategories.push(cleanName);
      saveCategories();
      populateCategorySelectors();
      
      if (categoryFilter) {
        categoryFilter.value = cleanName;
        categoryFilter.dispatchEvent(new Event('change'));
      }
      if (window.showToast) window.showToast(`Папка «${cleanName}» успешно создана!`, 'success');
    });
  }

  // Manage Folders Modal
  const manageFoldersBtn = document.getElementById('manageFoldersBtn');
  const manageFoldersModal = document.getElementById('manageFoldersModal');
  const closeManageFoldersBtn = document.getElementById('closeManageFoldersBtn');

  if (manageFoldersBtn && manageFoldersModal) {
    manageFoldersBtn.addEventListener('click', () => {
      renderManageFoldersList();
      manageFoldersModal.style.display = 'flex';
      document.body.classList.add('modal-open');
    });
    
    if (closeManageFoldersBtn) {
      closeManageFoldersBtn.addEventListener('click', () => {
        manageFoldersModal.style.display = 'none';
        document.body.classList.remove('modal-open');
        populateCategorySelectors();
        if (typeof window.renderDictWordsList === 'function') {
          window.renderDictWordsList(searchInput ? searchInput.value.trim() : '');
        }
      });
    }
  }

  // Create custom word category / tag
  const addCustomCatBtn = document.getElementById('addCustomCustomCategoryBtn');
  if (addCustomCatBtn) {
    addCustomCatBtn.addEventListener('click', async () => {
      const name = await (window.showCustomPrompt ? window.showCustomPrompt('🏷️ Новая категория', 'Введите название новой категории для слов/фраз:', 'Например: Идиомы') : prompt('Введите название новой категории для слов/фраз:'));
      if (name === null) return;
      const cleanName = name.trim();
      if (!cleanName) {
        if (window.showToast) window.showToast('Название категории не может быть пустым!', 'error');
        else alert('Название категории не может быть пустым!');
        return;
      }
      if (cleanName.length > 25) {
        if (window.showToast) window.showToast('Название категории слишком длинное (максимум 25 символов)!', 'error');
        else alert('Название категории слишком длинное (максимум 25 символов)!');
        return;
      }
      
      const exists = personalCustomCategories.some(c => c.toLowerCase() === cleanName.toLowerCase());
      if (exists || cleanName.toLowerCase() === 'без категории' || cleanName.toLowerCase() === 'все категории') {
        if (window.showToast) window.showToast('Категория с таким названием уже существует или зарезервирована!', 'error');
        else alert('Категория с таким названием уже существует или зарезервирована!');
        return;
      }
      
      personalCustomCategories.push(cleanName);
      saveCategories();
      populateCategorySelectors();
      
      if (customCategoryFilter) {
        customCategoryFilter.value = cleanName;
        customCategoryFilter.dispatchEvent(new Event('change'));
      }
      if (window.showToast) window.showToast(`Категория «${cleanName}» успешно создана!`, 'success');
    });
  }
}

// Global exposure
if (typeof window !== 'undefined') {
  window.personalCategories = personalCategories;
  window.personalCustomCategories = personalCustomCategories;
  window.personalHiddenCategories = personalHiddenCategories;
  window.loadCategories = loadCategories;
  window.saveCategories = saveCategories;
  window.loadHiddenCategories = loadHiddenCategories;
  window.getActiveWordsCount = getActiveWordsCount;
  window._doArchiveCurrentDictionary = _doArchiveCurrentDictionary;
  window.archiveCurrentDictionaryToOldWords = archiveCurrentDictionaryToOldWords;
  window.runOldWordsMigration = runOldWordsMigration;
  window.populateCategorySelectors = populateCategorySelectors;
  window.renderManageFoldersList = renderManageFoldersList;
  window.setupCategoryManagementUI = setupCategoryManagementUI;
}
