// @ts-check
/// <reference path="./types.js" />
/**
 * @file modules/dictionary-trainer.js
 * @description Personal Dictionary & 3D Flashcard Leitner Trainer Module.
 * @AI-SECTION: DICTIONARY_LEITNER_TRAINER
 */

// ==========================================================================
// 5. Personal Dictionary & 3D Flashcard word trainer
// @AI-SECTION: DICTIONARY_LEITNER_TRAINER
// ==========================================================================

let activeDictTab = 'personal'; // 'personal' or 'essential'
let dictTypeFilter = 'all'; // 'all', 'words', or 'phrases'
let dictSortOption = 'default'; // Sort option for the dictionary
// personalDictionary is now managed by window.AppStore
let activeTrainerWordObj = null;

let sessionQueue = [];
let sessionHistory = [];
let sessionTotalInitialCount = 0;
let sessionLearnedCount = 0;
let sessionLearnedWordsList = []; // list of wordObjs successfully finished in this session

function saveStudySession() {
  localStorage.setItem('galaxy_study_session_queue', JSON.stringify(sessionQueue));
  localStorage.setItem('galaxy_study_session_total', sessionTotalInitialCount);
  localStorage.setItem('galaxy_study_session_learned', sessionLearnedCount);
  localStorage.setItem('galaxy_study_session_learned_list', JSON.stringify(sessionLearnedWordsList));
}

function clearStudySession() {
  localStorage.removeItem('galaxy_study_session_queue');
  localStorage.removeItem('galaxy_study_session_total');
  localStorage.removeItem('galaxy_study_session_learned');
  localStorage.removeItem('galaxy_study_session_learned_list');
  sessionHistory = [];
  updateUndoButtonVisibility();
}

let personalCategories = ['Общее', 'Базовые глаголы', 'Сленг и идиомы', 'Социальные фразы'];
let personalCustomCategories = ['Сленг', 'Идиомы', 'Грамматика', 'Путешествия'];

function loadCategories() {
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
  } catch (e) {
    console.error("Failed to load categories:", e);
  }
}

function saveCategories() {
  localStorage.setItem('personal_categories', JSON.stringify(personalCategories));
  localStorage.setItem('personal_custom_categories', JSON.stringify(personalCustomCategories));
  localStorage.setItem('personal_hidden_categories', JSON.stringify(personalHiddenCategories));
  window.personalHiddenCategories = personalHiddenCategories;
}

let personalHiddenCategories = [];

function loadHiddenCategories() {
  try {
    const saved = localStorage.getItem('personal_hidden_categories');
    if (saved) {
      personalHiddenCategories = JSON.parse(saved);
    } else {
      localStorage.setItem('personal_hidden_categories', JSON.stringify(personalHiddenCategories));
    }
    window.personalHiddenCategories = personalHiddenCategories;
  } catch (e) {
    console.error("Failed to load hidden categories:", e);
  }
}

function getActiveWordsCount() {
  if (!personalDictionary) return 0;
  return personalDictionary.filter(w => {
    if (w.categories && w.categories.some(c => personalHiddenCategories.includes(c))) return false;
    return true;
  }).length;
}
window.getActiveWordsCount = getActiveWordsCount;

function _doArchiveCurrentDictionary(manual = false) {
  if (!personalCategories.includes('Старые')) {
    personalCategories.push('Старые');
  }
  if (!personalHiddenCategories.includes('Старые')) {
    personalHiddenCategories.push('Старые');
  }
  saveCategories();

  let movedCount = 0;
  if (personalDictionary && personalDictionary.length > 0) {
    personalDictionary.forEach(w => {
      const isOnlyOld = w.categories && w.categories.length === 1 && w.categories[0] === 'Старые';
      if (!isOnlyOld) {
        w.category = 'Старые';
        w.categories = ['Старые'];
        movedCount++;
      }
    });
  }

  saveDictionaryToStorage();
  clearStudySession();

  if (typeof renderDictWordsList === 'function') renderDictWordsList();
  if (typeof populateCategorySelectors === 'function') populateCategorySelectors();
  if (typeof renderManageFoldersList === 'function') renderManageFoldersList();

  if (manual && window.showToast) {
    window.showToast(`Успешно отложено ${movedCount} слов в архив «Старые». Новый словарь готов! 🚀`, "success");
  }
}

function archiveCurrentDictionaryToOldWords(manual = false) {
  if (!personalDictionary || personalDictionary.length === 0) {
    if (manual && window.showToast) window.showToast("В вашем словаре пока нет слов для архивации.", "info");
    return;
  }

  const activeCount = getActiveWordsCount();

  if (manual) {
    if (activeCount === 0) {
      if (window.showToast) window.showToast("В активном словаре нет слов для архивации. Все слова уже в «Старые»!", "info");
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
window.archiveCurrentDictionaryToOldWords = archiveCurrentDictionaryToOldWords;

function runOldWordsMigration() {
  const migratedFlagV1 = localStorage.getItem('galaxy_migrated_old_words_v1');
  const migratedFlagV2 = localStorage.getItem('galaxy_migrated_old_words_v2');

  if (!migratedFlagV1 && personalDictionary && personalDictionary.length > 0) {
    console.debug('Running one-time migration v1 to move all existing words to "Старые"...');
    _doArchiveCurrentDictionary(false);
    localStorage.setItem('galaxy_migrated_old_words_v1', 'true');
    localStorage.setItem('galaxy_migrated_old_words_v2', 'true');
  } else if (!migratedFlagV2 && personalDictionary && personalDictionary.length > 0) {
    console.debug('Running migration v2 to archive current dictionary into "Старые"...');
    _doArchiveCurrentDictionary(false);
    localStorage.setItem('galaxy_migrated_old_words_v2', 'true');
  }
}

function populateCategorySelectors() {
  // 1. Populate dictCategoryFilter (Folders) in modal
  const dictFilter = document.getElementById('dictCategoryFilter');
  if (dictFilter) {
    const currentValue = dictFilter.value || '';
    dictFilter.innerHTML = '';
    
    if (activeDictTab === 'personal') {
      // Add default "All folders"
      const allOpt = document.createElement('option');
      allOpt.value = 'Все слова';
      allOpt.textContent = '📚 All Folders';
      dictFilter.appendChild(allOpt);
      
      // Add custom folders
      personalCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = `📁 ${cat}`;
        dictFilter.appendChild(option);
      });
      
      if (currentValue === 'Все слова' || personalCategories.includes(currentValue)) {
        dictFilter.value = currentValue;
      } else {
        dictFilter.value = 'Все слова';
      }
    } else {
      // Add 3 preloaded essential packs
      const p1 = document.createElement('option');
      p1.value = '«Топ-300 Первых слов»';
      p1.textContent = '🎓 «Топ-300 Первых слов»';
      dictFilter.appendChild(p1);
      
      const p2 = document.createElement('option');
      p2.value = '«Топ-600 Базовых слов»';
      p2.textContent = '🎓 «Топ-600 Базовых слов»';
      dictFilter.appendChild(p2);
      
      const p3 = document.createElement('option');
      p3.value = '«Топ-1000 Продвинутых слов»';
      p3.textContent = '🎓 «Топ-1000 Продвинутых слов»';
      dictFilter.appendChild(p3);
      
      if (currentValue.startsWith('«Топ-')) {
        dictFilter.value = currentValue;
      } else {
        dictFilter.value = '«Топ-300 Первых слов»';
      }
    }
    
    // NEW: Sync trainingFolderSelect
    const trainingFolderSelect = document.getElementById('trainingFolderSelect');
    if (trainingFolderSelect) {
      trainingFolderSelect.innerHTML = dictFilter.innerHTML;
      trainingFolderSelect.value = dictFilter.value;
    }
  }

  // 1b. Populate dictCustomCategoryFilter (Categories) in modal
  const dictCustomFilter = document.getElementById('dictCustomCategoryFilter');
  if (dictCustomFilter) {
    const currentValue = dictCustomFilter.value || '';
    dictCustomFilter.innerHTML = '';
    
    const allOpt = document.createElement('option');
    allOpt.value = 'All Categories';
    allOpt.textContent = '🏷️ All Categories';
    dictCustomFilter.appendChild(allOpt);
    
    const noneOpt = document.createElement('option');
    noneOpt.value = 'Без категории';
    noneOpt.textContent = '🏷️ Без категории';
    dictCustomFilter.appendChild(noneOpt);
    
    personalCustomCategories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = `🏷️ ${cat}`;
      dictCustomFilter.appendChild(option);
    });
    
    if (currentValue === 'All Categories' || currentValue === 'Без категории' || personalCustomCategories.includes(currentValue)) {
      dictCustomFilter.value = currentValue;
    } else {
      dictCustomFilter.value = 'All Categories';
    }
  }

  // 2. Populate wordCategorySelect inside sidebar if it is present
  const wordSelect = document.getElementById('wordCategorySelect');
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
  const wordCustomSelect = document.getElementById('wordCustomCategorySelect');
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
    // Collect currently selected categories from existing pills
    const currentSelected = Array.from(multiCatContainer.querySelectorAll('.mcat-pill.selected'))
      .map(p => p.dataset.cat);
    const preSelected = currentSelected.length > 0 ? currentSelected : ['Общее'];

    multiCatContainer.innerHTML = '';
    personalCategories.forEach(cat => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mcat-pill' + (preSelected.includes(cat) ? ' selected' : '');
      pill.dataset.cat = cat;
      pill.textContent = `📁 ${cat}`;
      pill.style.cssText = `
        padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
        cursor: pointer; border: 1px solid rgba(255,255,255,0.08); transition: all 0.18s;
        outline: none; white-space: nowrap;
        background: ${preSelected.includes(cat) ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'};
        color: ${preSelected.includes(cat) ? '#ffffff' : 'var(--text-sub)'};
        border-color: ${preSelected.includes(cat) ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'};
      `;
      pill.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const isOn = pill.classList.contains('selected');
        // Require at least one selected
        const allSelected = multiCatContainer.querySelectorAll('.mcat-pill.selected');
        if (isOn && allSelected.length <= 1) return;
        pill.classList.toggle('selected', !isOn);
        pill.style.background = !isOn ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)';
        pill.style.color = !isOn ? '#ffffff' : 'var(--text-sub)';
        pill.style.borderColor = !isOn ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)';
      });
      multiCatContainer.appendChild(pill);
    });
  }

  // 3b. Populate manualWordCustomCategory multi-pill container in manual add modal
  const wordCustomCont = document.getElementById('manualWordCustomCategoryPillsContainer');
  if (wordCustomCont) {
    const currentSelected = Array.from(wordCustomCont.querySelectorAll('.mcat-pill.selected'))
      .map(p => p.dataset.cat);
    const preSelected = currentSelected.length > 0 ? currentSelected : ['Без категории'];

    wordCustomCont.innerHTML = '';
    
    const getPillStyle = (isSelected) => `
      padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
      cursor: pointer; border: 1px solid rgba(255,255,255,0.12); transition: all 0.18s;
      outline: none; white-space: nowrap;
      background: ${isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.04)'};
      color: ${isSelected ? '#a78bfa' : 'var(--text-sub)'};
      border-color: ${isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255,255,255,0.1)'};
    `;
    const setPillActiveStyle = (pill, isSelected) => {
      pill.style.background = isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.04)';
      pill.style.color = isSelected ? '#a78bfa' : 'var(--text-sub)';
      pill.style.borderColor = isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255,255,255,0.1)';
    };

    const nonePill = document.createElement('button');
    nonePill.type = 'button';
    nonePill.className = 'mcat-pill' + (preSelected.includes('Без категории') ? ' selected' : '');
    nonePill.dataset.cat = 'Без категории';
    nonePill.textContent = '🏷️ Без категории';
    nonePill.style.cssText = getPillStyle(preSelected.includes('Без категории'));
    nonePill.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const isOn = nonePill.classList.contains('selected');
      if (isOn) {
        const allSelected = wordCustomCont.querySelectorAll('.mcat-pill.selected');
        if (allSelected.length <= 1) return;
        nonePill.classList.remove('selected');
        setPillActiveStyle(nonePill, false);
      } else {
        wordCustomCont.querySelectorAll('.mcat-pill.selected').forEach(p => {
          if (p.dataset.cat !== 'Без категории') {
            p.classList.remove('selected');
            setPillActiveStyle(p, false);
          }
        });
        nonePill.classList.add('selected');
        setPillActiveStyle(nonePill, true);
      }
    });
    wordCustomCont.appendChild(nonePill);

    personalCustomCategories.forEach(cat => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mcat-pill' + (preSelected.includes(cat) ? ' selected' : '');
      pill.dataset.cat = cat;
      pill.textContent = `🏷️ ${cat}`;
      pill.style.cssText = getPillStyle(preSelected.includes(cat));
      pill.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const isOn = pill.classList.contains('selected');
        if (isOn) {
          const allSelected = wordCustomCont.querySelectorAll('.mcat-pill.selected');
          if (allSelected.length <= 1) {
            pill.classList.remove('selected');
            setPillActiveStyle(pill, false);
            nonePill.classList.add('selected');
            setPillActiveStyle(nonePill, true);
          } else {
            pill.classList.remove('selected');
            setPillActiveStyle(pill, false);
          }
        } else {
          nonePill.classList.remove('selected');
          setPillActiveStyle(nonePill, false);
          pill.classList.add('selected');
          setPillActiveStyle(pill, true);
        }
      });
      wordCustomCont.appendChild(pill);
    });
  }

  // 4. Populate manualPhraseCategory multi-pill container in manual add phrase modal
  const phrasePillsContainer = document.getElementById('manualPhraseCategoryPillsContainer');
  if (phrasePillsContainer) {
    // Collect currently selected categories from existing pills
    const currentSelected = Array.from(phrasePillsContainer.querySelectorAll('.mcat-pill.selected'))
      .map(p => p.dataset.cat);
    const preSelected = currentSelected.length > 0 ? currentSelected : ['Общее'];

    phrasePillsContainer.innerHTML = '';
    personalCategories.forEach(cat => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mcat-pill' + (preSelected.includes(cat) ? ' selected' : '');
      pill.dataset.cat = cat;
      pill.textContent = `📁 ${cat}`;
      pill.style.cssText = `
        padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
        cursor: pointer; border: 1px solid rgba(255,255,255,0.08); transition: all 0.18s;
        outline: none; white-space: nowrap;
        background: ${preSelected.includes(cat) ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'};
        color: ${preSelected.includes(cat) ? '#ffffff' : 'var(--text-sub)'};
        border-color: ${preSelected.includes(cat) ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'};
      `;
      pill.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const isOn = pill.classList.contains('selected');
        // Require at least one selected
        const allSelected = phrasePillsContainer.querySelectorAll('.mcat-pill.selected');
        if (isOn && allSelected.length <= 1) return;
        pill.classList.toggle('selected', !isOn);
        pill.style.background = !isOn ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)';
        pill.style.color = !isOn ? '#ffffff' : 'var(--text-sub)';
        pill.style.borderColor = !isOn ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)';
      });
      phrasePillsContainer.appendChild(pill);
    });
  }

  // 4b. Populate manualPhraseCustomCategory multi-pill container in manual add phrase modal
  const phraseCustomCont = document.getElementById('manualPhraseCustomCategoryPillsContainer');
  if (phraseCustomCont) {
    const currentSelected = Array.from(phraseCustomCont.querySelectorAll('.mcat-pill.selected'))
      .map(p => p.dataset.cat);
    const preSelected = currentSelected.length > 0 ? currentSelected : ['Без категории'];

    phraseCustomCont.innerHTML = '';
    
    const getPillStyle = (isSelected) => `
      padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
      cursor: pointer; border: 1px solid rgba(255,255,255,0.12); transition: all 0.18s;
      outline: none; white-space: nowrap;
      background: ${isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.04)'};
      color: ${isSelected ? '#a78bfa' : 'var(--text-sub)'};
      border-color: ${isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255,255,255,0.1)'};
    `;
    const setPillActiveStyle = (pill, isSelected) => {
      pill.style.background = isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.04)';
      pill.style.color = isSelected ? '#a78bfa' : 'var(--text-sub)';
      pill.style.borderColor = isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255,255,255,0.1)';
    };

    const nonePill = document.createElement('button');
    nonePill.type = 'button';
    nonePill.className = 'mcat-pill' + (preSelected.includes('Без категории') ? ' selected' : '');
    nonePill.dataset.cat = 'Без категории';
    nonePill.textContent = '🏷️ Без категории';
    nonePill.style.cssText = getPillStyle(preSelected.includes('Без категории'));
    nonePill.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const isOn = nonePill.classList.contains('selected');
      if (isOn) {
        const allSelected = phraseCustomCont.querySelectorAll('.mcat-pill.selected');
        if (allSelected.length <= 1) return;
        nonePill.classList.remove('selected');
        setPillActiveStyle(nonePill, false);
      } else {
        phraseCustomCont.querySelectorAll('.mcat-pill.selected').forEach(p => {
          if (p.dataset.cat !== 'Без категории') {
            p.classList.remove('selected');
            setPillActiveStyle(p, false);
          }
        });
        nonePill.classList.add('selected');
        setPillActiveStyle(nonePill, true);
      }
    });
    phraseCustomCont.appendChild(nonePill);

    personalCustomCategories.forEach(cat => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mcat-pill' + (preSelected.includes(cat) ? ' selected' : '');
      pill.dataset.cat = cat;
      pill.textContent = `🏷️ ${cat}`;
      pill.style.cssText = getPillStyle(preSelected.includes(cat));
      pill.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const isOn = pill.classList.contains('selected');
        if (isOn) {
          const allSelected = phraseCustomCont.querySelectorAll('.mcat-pill.selected');
          if (allSelected.length <= 1) {
            pill.classList.remove('selected');
            setPillActiveStyle(pill, false);
            nonePill.classList.add('selected');
            setPillActiveStyle(nonePill, true);
          } else {
            pill.classList.remove('selected');
            setPillActiveStyle(pill, false);
          }
        } else {
          nonePill.classList.remove('selected');
          setPillActiveStyle(nonePill, false);
          pill.classList.add('selected');
          setPillActiveStyle(pill, true);
        }
      });
      phraseCustomCont.appendChild(pill);
    });
  }
}

function initDictionary() {
  loadCategories();
  loadHiddenCategories();
  try {
    const saved = localStorage.getItem('personal_dictionary');
    if (saved) {
      personalDictionary = JSON.parse(saved);
      let migrated = false;
      personalDictionary.forEach(w => {
        if (w.category === undefined) { w.category = 'Общее'; migrated = true; }
        if (w.customCategory === undefined) { w.customCategory = 'Без категории'; migrated = true; }
        if (w.definition === undefined) { w.definition = ''; migrated = true; }
        if (w.rule === undefined) { w.rule = ''; migrated = true; } // NEW: grammar rule field
        if (w.interval === undefined) { w.interval = 0; migrated = true; }
        if (w.nextReview === undefined) { w.nextReview = Date.now(); migrated = true; }
        if (w.addedAt === undefined) { w.addedAt = Date.now(); migrated = true; }
        if (w.level === undefined) { w.level = 0; migrated = true; }
        if (w.type === undefined) { w.type = 'word'; migrated = true; }
        if (w.type !== 'phrase') {
          const wordCount = w.word.trim().split(/\s+/).filter(Boolean).length;
          if (wordCount >= 3) {
            w.type = 'phrase';
            migrated = true;
          }
        }
        // NEW: migrate single category string → categories array
        if (!w.categories || !Array.isArray(w.categories) || w.categories.length === 0) {
          w.categories = [w.category || 'Общее'];
          migrated = true;
        }
        // NEW: migrate single customCategory string → customCategories array
        if (!w.customCategories || !Array.isArray(w.customCategories) || w.customCategories.length === 0) {
          w.customCategories = [w.customCategory || 'Без категории'];
          migrated = true;
        }
      });
      if (migrated) {
        saveDictionaryToStorage();
      }
      runOldWordsMigration();
    }
  } catch (e) {
    console.error("Failed to load personal dictionary:", e);
  }
  updateSavedWordsCount();
  setupDictionaryUI();
  populateCategorySelectors();
  setupDictTypeFilters(); // Initialize type filter buttons
  renderDictWeekChart();
  renderHeatmap();
  updateEssentialProgress();
}

function updateEssentialProgress() {
  const progressText = document.getElementById('essentialProgressText');
  const progressBar = document.getElementById('essentialProgressBar');
  if (!progressText || !progressBar) return;

  if (!window.top1000Words) return;

  // Count words in top1000Words that exist in personalDictionary with level > 3
  let masteredCount = 0;
  personalDictionary.forEach(w => {
    const isEssentialWord = window.top1000Words.includes(w.word.toLowerCase());
    if (isEssentialWord && w.level > 3) {
      masteredCount++;
    }
  });

  const total = window.top1000Words.length;
  const pct = ((masteredCount / total) * 100).toFixed(1);

  progressText.textContent = `${masteredCount} / ${total} (${pct}%)`;
  progressBar.style.width = `${pct}%`;
}

function updateSavedWordsCount() {
  const activeCount = getActiveWordsCount();
  const countEl = document.getElementById('savedWordsCount');
  if (countEl) {
    countEl.textContent = activeCount;
  }
  const dashWordsCount = document.getElementById('dashWordsCount');
  if (dashWordsCount) {
    dashWordsCount.textContent = activeCount;
  }
}

function saveDictionaryToStorage() {
  localStorage.setItem('personal_dictionary', JSON.stringify(personalDictionary));
  updateSavedWordsCount();
  updateEssentialProgress();
  renderDictWeekChart();
  if (typeof currentSongKey !== 'undefined' && currentSongKey) {
    try {
      renderSong(currentSongKey);
    } catch (e) {
      console.warn('Failed to re-render song after dictionary update:', e);
    }
  }
}

// renderDictWeekChart() → moved to dict-stats.js

window.addWordToPersonalDictionary = addWordToPersonalDictionary;
window.toggleDictionaryItem = toggleDictionaryItem;

// Word Card Popup → moved to dict-word-card.js


function formatDictionaryWord(word) {
  const shouldCapitalize = localStorage.getItem('galaxy_dictionary_capitalize') !== 'false';
  if (!shouldCapitalize || !word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function toggleDictionaryItem(buttonElement, word, translation, category = 'Из песен', type = 'word') {
  const rawEng = word.trim();
  const eng = formatDictionaryWord(rawEng);
  const rus = translation.trim();
  if (!eng || !rus) return;

  const existingIndex = personalDictionary.findIndex(w => w.word.toLowerCase() === eng.toLowerCase());

  if (existingIndex !== -1) {
    // Remove it!
    personalDictionary.splice(existingIndex, 1);
    saveDictionaryToStorage();
    
    // Update button style to inactive
    buttonElement.innerHTML = `➕ В словарь`;
    buttonElement.style.color = 'var(--accent-spotify)';
    buttonElement.style.background = 'rgba(29, 185, 84, 0.1)';
    buttonElement.style.borderColor = 'rgba(255, 255, 255, 0.12)';
  } else {
    // Add it!
    let actualType = type;
    if (actualType === 'word') {
      const wordCount = eng.split(/\s+/).filter(Boolean).length;
      if (wordCount >= 3) {
        actualType = 'phrase';
      }
    }
    const newWord = {
      word: eng,
      translation: rus,
      category: category,
      customCategory: 'Без категории',
      type: actualType, // 'word' or 'phrase'
      level: 0,
      interval: 0,
      nextReview: Date.now()
    };
    personalDictionary.push(newWord);
    saveDictionaryToStorage();

    // Update button style to active
    buttonElement.innerHTML = `✓ В словаре`;
    buttonElement.style.color = '#1db954';
    buttonElement.style.background = 'rgba(29, 185, 84, 0.15)';
    buttonElement.style.borderColor = 'rgba(29, 185, 84, 0.3)';
  }

  // Update counts
  const dashWordsCount = document.getElementById('dashWordsCount');
  if (dashWordsCount) {
    dashWordsCount.textContent = personalDictionary.length;
  }
  if (typeof renderDictWordsList === 'function') {
    renderDictWordsList();
  }
}

function addWordToPersonalDictionary(word, translation, category = 'Из песен', type = 'word') {
  const rawEng = word.trim();
  const eng = formatDictionaryWord(rawEng);
  const rus = translation.trim();
  if (!eng || !rus) return;

  const isDup = personalDictionary.some(w => w.word.toLowerCase() === eng.toLowerCase());
  if (isDup) {
    alert(`"${eng}" уже есть в вашем словаре!`);
    return;
  }

  let actualType = type;
  if (actualType === 'word') {
    const wordCount = eng.split(/\s+/).filter(Boolean).length;
    if (wordCount >= 3) {
      actualType = 'phrase';
    }
  }

  const newWord = {
    word: eng,
    translation: rus,
    category: category,
    customCategory: 'Без категории',
    type: actualType,
    level: 0,
    interval: 0,
    nextReview: Date.now(),
    addedAt: Date.now()
  };

  personalDictionary.push(newWord);
  saveDictionaryToStorage();

  if (typeof window.DailyTracker !== 'undefined' && window.DailyTracker.recordWordAdded) {
    window.DailyTracker.recordWordAdded(newWord);
  }

  // If the dashboard count element exists, keep it in sync
  const dashWordsCount = document.getElementById('dashWordsCount');
  if (dashWordsCount) {
    dashWordsCount.textContent = personalDictionary.length;
  }

  // Refresh dictionary lists if they are currently drawn
  if (typeof renderDictWordsList === 'function') {
    renderDictWordsList();
  }

  // Highlight successfully added state
  alert(`"${eng}" успешно добавлено в ваш словарь! 🎓`);
}

// Initialize dictionary type filter buttons (Words/Phrases/All)
function setupDictTypeFilters() {
  const pillsContainer = document.getElementById('dictTypePills');
  if (!pillsContainer) return;

  const pills = pillsContainer.querySelectorAll('.dict-type-pill');
  
  pills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      const filterType = pill.getAttribute('data-type');
      
      // Update global filter state
      dictTypeFilter = filterType;
      
      // Update visual state of pills
      pills.forEach(p => {
        p.classList.remove('active');
        p.style.background = 'transparent';
        p.style.color = 'var(--text-sub)';
      });
      
      pill.classList.add('active');
      pill.style.background = 'rgba(255, 255, 255, 0.12)';
      pill.style.color = '#ffffff';
      
      // Re-render the word list with new filter
      renderDictWordsList();
    });
  });
}

// Initialize sort filter
function setupDictSortFilter() {
  const sortSelect = document.getElementById('dictSortSelect');
  if (!sortSelect) return;
  
  sortSelect.addEventListener('change', (e) => {
    dictSortOption = e.target.value;
    renderDictWordsList();
  });
}

// Apply sorting to word list
function applySortToDictWords(words) {
  const sorted = [...words];
  
  switch(dictSortOption) {
    case 'az':
      sorted.sort((a, b) => a.word.localeCompare(b.word, 'en'));
      break;
    case 'za':
      sorted.sort((a, b) => b.word.localeCompare(a.word, 'en'));
      break;
    case 'newest':
      sorted.reverse(); // Most recently added first
      break;
    case 'level_asc':
      sorted.sort((a, b) => (a.level || 0) - (b.level || 0));
      break;
    case 'level_desc':
      sorted.sort((a, b) => (b.level || 0) - (a.level || 0));
      break;
    default: // 'default'
      // Keep original order
      break;
  }
  
  return sorted;
}

function setupDictionaryUI() {
  let manualAddType = 'word';
  const openBtn = document.getElementById('openDictionaryBtn');
  const closeBtn = document.getElementById('closeDictionaryBtn');
  const modal = document.getElementById('dictionaryModal');
  const clearBtn = document.getElementById('clearDictBtn');
  const searchInput = document.getElementById('dictSearchInput');
  const flashcard = document.getElementById('dictFlashcard');
  const flashcardInner = document.getElementById('flashcardInner');
  const emptyState = document.getElementById('dictEmptyState');
  const controls = document.getElementById('cardControls');
  const categoryFilter = document.getElementById('dictCategoryFilter');
  
  // Training Modal Elements
  const trainingModal = document.getElementById('trainingModal');
  const openTrainingBtn = document.getElementById('openTrainingBtn');
  const closeTrainingModalBtn = document.getElementById('closeTrainingModalBtn');
  const startTrainingFromDictBtn = document.getElementById('startTrainingFromDictBtn');
  const trainingCategoryLabel = document.getElementById('trainingCategoryLabel');
  const trainingLimitSelect = document.getElementById('trainingLimitSelect');
  
  if (!modal || !openBtn) return;

  // ── Dictionary Resize Buttons ──────────────────────────────────────────────
  const dictCard = document.getElementById('dictionaryModalCard');
  const dictWidthBtn = document.getElementById('dictExpandWidthBtn');
  const dictHeightBtn = document.getElementById('dictExpandHeightBtn');
  const DICT_SIZE_KEY = 'dict_size_prefs';

  let dictSizeState = { wide: false, tall: false };
  try {
    const saved = localStorage.getItem(DICT_SIZE_KEY);
    if (saved) dictSizeState = { ...dictSizeState, ...JSON.parse(saved) };
  } catch(e) {}

  function applyDictSize() {
    if (!dictCard) return;
    dictCard.classList.toggle('dict-wide', dictSizeState.wide);
    dictCard.classList.toggle('dict-tall', dictSizeState.tall);

    if (dictWidthBtn) {
      dictWidthBtn.classList.toggle('dict-expand-btn-active', dictSizeState.wide);
      dictWidthBtn.title = dictSizeState.wide ? 'Сжать по ширине' : 'Расширить по ширине';
    }
    if (dictHeightBtn) {
      dictHeightBtn.classList.toggle('dict-expand-btn-active', dictSizeState.tall);
      dictHeightBtn.title = dictSizeState.tall ? 'Сжать по высоте' : 'Расширить по высоте';
    }

    localStorage.setItem(DICT_SIZE_KEY, JSON.stringify(dictSizeState));
  }

  if (dictWidthBtn) {
    dictWidthBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dictSizeState.wide = !dictSizeState.wide;
      applyDictSize();
    });
  }
  if (dictHeightBtn) {
    dictHeightBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dictSizeState.tall = !dictSizeState.tall;
      applyDictSize();
    });
  }

  // Apply saved size immediately when modal opens
  openBtn.addEventListener('click', applyDictSize, { once: false });
  applyDictSize();
  // ──────────────────────────────────────────────────────────────────────────

  // ── Training Resize Buttons ────────────────────────────────────────────────
  const trainingCard = document.getElementById('trainingModalCard');
  const trainingWidthBtn = document.getElementById('trainingExpandWidthBtn');
  const TRAINING_SIZE_KEY = 'training_size_prefs';

  let trainingSizeState = { wide: false };
  try {
    const saved = localStorage.getItem(TRAINING_SIZE_KEY);
    if (saved) trainingSizeState = { ...trainingSizeState, ...JSON.parse(saved) };
  } catch(e) {}

  // Force tall mode state off for training card
  trainingSizeState.tall = false;

  function applyTrainingSize() {
    if (!trainingCard) return;
    trainingCard.classList.toggle('dict-wide', trainingSizeState.wide);
    trainingCard.classList.remove('dict-tall'); // Never tall

    if (trainingWidthBtn) {
      trainingWidthBtn.classList.toggle('dict-expand-btn-active', trainingSizeState.wide);
      trainingWidthBtn.title = trainingSizeState.wide ? 'Сжать по ширине' : 'Расширить по ширине';
    }

    localStorage.setItem(TRAINING_SIZE_KEY, JSON.stringify(trainingSizeState));
  }

  if (trainingWidthBtn) {
    trainingWidthBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      trainingSizeState.wide = !trainingSizeState.wide;
      applyTrainingSize();
    });
  }

  // Apply saved size immediately when training modal is loaded/opened
  const openTrainingBtnEl = document.getElementById('openTrainingBtn');
  if (openTrainingBtnEl) {
    openTrainingBtnEl.addEventListener('click', applyTrainingSize, { once: false });
  }
  applyTrainingSize();
  // ──────────────────────────────────────────────────────────────────────────

  // 1. Tab Switching Event Listeners
  const tabPersonal = document.getElementById('dictTabPersonal');
  const tabEssential = document.getElementById('dictTabEssential');
  const addCategoryBtn = document.getElementById('addCustomCategoryBtn');
  const addWordBtn = document.getElementById('addManualWordBtn');
  const progressBarContainer = document.querySelector('.essential-progress-container');
  
  if (tabPersonal && tabEssential) {
    const switchTab = (tab) => {
      activeDictTab = tab;
      
      // Update UI classes
      if (tab === 'personal') {
        tabPersonal.classList.add('active');
        tabPersonal.style.color = '';
        tabPersonal.style.borderBottomColor = '';
        tabEssential.classList.remove('active');
        tabEssential.style.color = '';
        tabEssential.style.borderBottomColor = '';
        
        // Show/Hide controls
        if (addCategoryBtn) addCategoryBtn.style.display = 'flex';
        if (addWordBtn) addWordBtn.style.display = 'flex';
        if (progressBarContainer) progressBarContainer.style.display = 'none'; // Only show in frequency tab
      } else {
        tabEssential.classList.add('active');
        tabEssential.style.color = '';
        tabEssential.style.borderBottomColor = '';
        tabPersonal.classList.remove('active');
        tabPersonal.style.color = '';
        tabPersonal.style.borderBottomColor = '';
        
        // Show/Hide controls
        if (addCategoryBtn) addCategoryBtn.style.display = 'none';
        if (addWordBtn) addWordBtn.style.display = 'none';
        if (progressBarContainer) progressBarContainer.style.display = 'flex';
      }
      
      // Refresh options and list
      populateCategorySelectors();
      renderDictWordsList();
      resetFlashcard();
    };
    
    tabPersonal.addEventListener('click', () => switchTab('personal'));
    tabEssential.addEventListener('click', () => switchTab('essential'));
  }

  // 2. Manual Word Adding Dialog listeners
  const addWordModal = document.getElementById('addWordModal');
  const closeAddWordBtn = document.getElementById('closeAddWordBtn');
  const saveManualWordBtn = document.getElementById('saveManualWordBtn');
  
  if (addWordBtn && addWordModal) {
    addWordBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      manualAddType = 'word';
      
      const titleEl = document.getElementById('manualWordTitle');
      const labelEngEl = document.getElementById('manualWordEngLabel');
      const labelRusEl = document.getElementById('manualWordRusLabel');
      const inputEngEl = document.getElementById('manualWordEng');
      const inputRusEl = document.getElementById('manualWordRus');
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
      
      // Populate category list inside popup
      populateCategorySelectors();
      
      // Show modal
      openModalEl(addWordModal);

      // Sync settings checkboxes to current state
      updateSmartInputUI();
    });
  }

  // 2b. Manual Phrase Adding Dialog listeners
  const addManualPhraseBtn = document.getElementById('addManualPhraseBtn');
  const addPhraseModal = document.getElementById('addPhraseModal');
  const closeAddPhraseBtn = document.getElementById('closeAddPhraseBtn');
  const saveManualPhraseBtn = document.getElementById('saveManualPhraseBtn');
  
  if (addManualPhraseBtn && addPhraseModal) {
    addManualPhraseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      manualAddType = 'phrase';
      
      const engInput = document.getElementById('manualPhraseEng');
      const rusInput = document.getElementById('manualPhraseRus');
      const defInput = document.getElementById('manualPhraseDefinition');
      const ruleInput = document.getElementById('manualPhraseRule');
      
      if (engInput) engInput.value = '';
      if (rusInput) rusInput.value = '';
      if (defInput) defInput.value = '';
      if (ruleInput) ruleInput.value = '';
      
      populateCategorySelectors();
      
      openModalEl(addPhraseModal);
      if (engInput) setTimeout(() => engInput.focus(), 120);
    });
  }
  
  if (closeAddPhraseBtn && addPhraseModal) {
    closeAddPhraseBtn.addEventListener('click', () => {
      closeModalEl(addPhraseModal);
    });
  }
  
  const phraseEngInput = document.getElementById('manualPhraseEng');
  const phraseRusInput = document.getElementById('manualPhraseRus');

  if (phraseEngInput) {
    phraseEngInput.addEventListener('input', () => handleSmartInput(phraseEngInput, 'cyrToLat'));
  }
  if (phraseRusInput) {
    phraseRusInput.addEventListener('input', () => handleSmartInput(phraseRusInput, 'latToCyr'));
  }

  // Show input border error (red flash)
  const flashError = (el) => {
    if (!el) return;
    const orig = el.style.borderColor;
    el.style.borderColor = '#f87171';
    el.focus();
    setTimeout(() => { el.style.borderColor = orig; }, 1800);
  };

  if (saveManualPhraseBtn && addPhraseModal) {
    saveManualPhraseBtn.addEventListener('click', () => {
      const engEl = document.getElementById('manualPhraseEng');
      const rusEl = document.getElementById('manualPhraseRus');
      const definitionEl = document.getElementById('manualPhraseDefinition');
      const ruleEl = document.getElementById('manualPhraseRule');
      
      if (!engEl || !rusEl) return;
      
      const eng = engEl.value.trim();
      const rus = rusEl.value.trim();
      
      // Read selected categories from multi-pill container
      const pillsCont = document.getElementById('manualPhraseCategoryPillsContainer');
      const selectedCats = pillsCont
        ? Array.from(pillsCont.querySelectorAll('.mcat-pill.selected')).map(p => p.dataset.cat)
        : ['Общее'];
      const cats = selectedCats.length > 0 ? selectedCats : ['Общее'];
      const cat = cats[0]; 
      
      // Read selected custom categories from multi-pill container
      const customCont = document.getElementById('manualPhraseCustomCategoryPillsContainer');
      const selectedCustomCats = customCont
        ? Array.from(customCont.querySelectorAll('.mcat-pill.selected')).map(p => p.dataset.cat)
        : ['Без категории'];
      const customCats = selectedCustomCats.length > 0 ? selectedCustomCats : ['Без категории'];
      const customCat = customCats[0];
      
      const definition = definitionEl ? definitionEl.value.trim() : '';
      const rule = ruleEl ? ruleEl.value.trim() : '';
      
      // Validate: not empty and minimum 3 words
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
      
      // Check duplicate
      const dupIndex = personalDictionary.findIndex(w => w.word.toLowerCase() === eng.toLowerCase());
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

        const old = personalDictionary[dupIndex];
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

        saveManualPhraseBtn.parentNode.insertBefore(conflictBanner, saveManualPhraseBtn);

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
              const isNone = p.dataset.cat === 'Без категории';
              p.classList.toggle('selected', isNone);
              p.style.background = isNone ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.04)';
              p.style.color = isNone ? '#ffffff' : 'var(--text-sub)';
              p.style.borderColor = isNone ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255,255,255,0.1)';
            });
          }
          
          dictTypeFilter = 'all';
          const catF = document.getElementById('dictCategoryFilter');
          const cusF = document.getElementById('dictCustomCategoryFilter');
          if (catF) catF.value = 'Все слова';
          if (cusF) cusF.value = 'All Categories';
          
          const pillsC = document.getElementById('dictTypePills');
          if (pillsC) {
            pillsC.querySelectorAll('.dict-type-pill').forEach(p => {
              p.classList.remove('active');
              p.style.background = 'transparent';
              p.style.color = 'var(--text-sub)';
            });
            const allP = pillsC.querySelector('[data-type="all"]');
            if (allP) { allP.classList.add('active'); allP.style.background = 'rgba(255, 255, 255, 0.12)'; allP.style.color = '#ffffff'; }
          }
          renderDictWordsList();
          resetFlashcard();
          recordActivity();
          updateSavedWordsCount();
          
          const sb = document.getElementById('saveManualPhraseBtn');
          if (sb) {
            const ot = sb.textContent;
            sb.textContent = `✓ «${eng.slice(0, 18)}${eng.length > 18 ? '…' : ''}» сохранено!`;
            sb.style.background = 'linear-gradient(135deg, #1db954, #16a34a)';
            sb.disabled = true;
            setTimeout(() => { sb.textContent = ot; sb.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)'; sb.disabled = false; engEl.focus(); }, 1400);
          }
        };

        document.getElementById('dupPhraseReplaceBtn').addEventListener('click', (e) => {
          e.stopPropagation();
          personalDictionary[dupIndex] = Object.assign({}, old, buildNewPhrase(), { level: old.level, interval: old.interval, nextReview: old.nextReview });
          saveDictionaryToStorage();
          finishPhraseSave();
        });

        document.getElementById('dupPhraseKeepBothBtn').addEventListener('click', (e) => {
          e.stopPropagation();
          personalDictionary.push(buildNewPhrase());
          saveDictionaryToStorage();
          finishPhraseSave();
        });

        document.getElementById('dupPhraseCancelBtn').addEventListener('click', (e) => {
          e.stopPropagation();
          conflictBanner.remove();
        });

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
      
      personalDictionary.push(newPhrase);
      saveDictionaryToStorage();
      
      engEl.value = '';
      rusEl.value = '';
      if (definitionEl) definitionEl.value = '';
      if (ruleEl) ruleEl.value = '';
      
      if (pillsCont) {
        pillsCont.querySelectorAll('.mcat-pill').forEach(p => {
          const isObe = p.dataset.cat === 'Общее';
          p.classList.toggle('selected', isObe);
          p.style.background = isObe ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.04)';
          p.style.color = isObe ? '#ffffff' : 'var(--text-sub)';
          p.style.borderColor = isObe ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255,255,255,0.1)';
        });
      }
      if (customCont) {
        customCont.querySelectorAll('.mcat-pill').forEach(p => {
          const isNone = p.dataset.cat === 'Без категории';
          p.classList.toggle('selected', isNone);
          p.style.background = isNone ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.04)';
          p.style.color = isNone ? '#ffffff' : 'var(--text-sub)';
          p.style.borderColor = isNone ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255,255,255,0.1)';
        });
      }
      
      dictTypeFilter = 'all';
      const catF = document.getElementById('dictCategoryFilter');
      const cusF = document.getElementById('dictCustomCategoryFilter');
      if (catF) catF.value = 'Все слова';
      if (cusF) cusF.value = 'All Categories';
      
      const pillsC = document.getElementById('dictTypePills');
      if (pillsC) {
        pillsC.querySelectorAll('.dict-type-pill').forEach(p => {
          p.classList.remove('active');
          p.style.background = 'transparent';
          p.style.color = 'var(--text-sub)';
        });
        const allP = pillsC.querySelector('[data-type="all"]');
        if (allP) { allP.classList.add('active'); allP.style.background = 'rgba(255, 255, 255, 0.12)'; allP.style.color = '#ffffff'; }
      }
      
      renderDictWordsList();
      resetFlashcard();
      recordActivity();
      updateSavedWordsCount();
      
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

  // Allow pressing Enter in translation field of phrase modal to save
  const phraseRusEl = document.getElementById('manualPhraseRus');
  if (phraseRusEl && saveManualPhraseBtn) {
    phraseRusEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); saveManualPhraseBtn.click(); }
    });
  }

  if (closeAddWordBtn && addWordModal) {
    closeAddWordBtn.addEventListener('click', () => {
      closeModalEl(addWordModal);
    });
  }
  
  // Backdrop click intentionally disabled — use the close button (✕) to dismiss
  
  // Backdrop click intentionally disabled — use the close button (✕) to dismiss
  // if (addWordModal) { addWordModal.addEventListener('click', ...) }

  // 2b. Smart Input Settings — load from localStorage
  const SMART_INPUT_SETTINGS_KEY = 'addWord_smartInput_settings';
  let smartInputSettings = { autoCapitalize: true, autoLayout: true };
  try {
    const saved = localStorage.getItem(SMART_INPUT_SETTINGS_KEY);
    if (saved) smartInputSettings = { ...smartInputSettings, ...JSON.parse(saved) };
  } catch(e) {}

  function saveSmartInputSettings() {
    localStorage.setItem(SMART_INPUT_SETTINGS_KEY, JSON.stringify(smartInputSettings));
  }

  function updateSmartInputUI() {
    const capCb = document.getElementById('settingAutoCapitalize');
    const layoutCb = document.getElementById('settingAutoLayout');
    const engHint = document.getElementById('addWordEngHint');
    const rusHint = document.getElementById('addWordRusHint');

    if (capCb) capCb.checked = smartInputSettings.autoCapitalize;
    if (layoutCb) layoutCb.checked = smartInputSettings.autoLayout;

    const layoutHintStyle = smartInputSettings.autoLayout ? '' : 'display:none';
    if (engHint) engHint.style.display = smartInputSettings.autoLayout ? '' : 'none';
    if (rusHint) rusHint.style.display = smartInputSettings.autoLayout ? '' : 'none';
  }

  // Settings accordion toggle
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

  // Settings checkboxes
  const capCb = document.getElementById('settingAutoCapitalize');
  const layoutCb = document.getElementById('settingAutoLayout');
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

  // Apply settings UI on open
  updateSmartInputUI();

  // Smart input handler: layout fix first, then auto-capitalize
  function handleSmartInput(inputEl, layoutDirection) {
    // 1. Auto layout correction first (converts wrong-layout chars)
    if (smartInputSettings.autoLayout) {
      applyLayoutFix(inputEl, layoutDirection);
    }
    // 2. Auto-capitalize first character (on already-corrected text)
    if (smartInputSettings.autoCapitalize && inputEl.value.length > 0) {
      const first = inputEl.value[0];
      const capitalized = first.toUpperCase();
      if (first !== capitalized) {
        const cursor = inputEl.selectionStart;
        const cursorEnd = inputEl.selectionEnd;
        inputEl.value = capitalized + inputEl.value.slice(1);
        try { inputEl.setSelectionRange(cursor, cursorEnd); } catch(e) {}
      }
    }
  }

  const wordEngInput = document.getElementById('manualWordEng');
  const wordRusInput = document.getElementById('manualWordRus');

  if (wordEngInput) {
    wordEngInput.addEventListener('input', () => handleSmartInput(wordEngInput, 'cyrToLat'));
  }
  if (wordRusInput) {
    wordRusInput.addEventListener('input', () => handleSmartInput(wordRusInput, 'latToCyr'));
  }

  if (saveManualWordBtn && addWordModal) {
    saveManualWordBtn.addEventListener('click', () => {
      const wordEngEl = document.getElementById('manualWordEng');
      const wordRusEl = document.getElementById('manualWordRus');
      const definitionEl = document.getElementById('manualWordDefinition');
      const ruleEl = document.getElementById('manualWordRule');
      
      if (!wordEngEl || !wordRusEl) return;
      
      const rawEng = wordEngEl.value.trim();
      const eng = formatDictionaryWord(rawEng);
      const rus = wordRusEl.value.trim();
      // Read selected categories from multi-pill container
      const pillsCont = document.getElementById('manualCategoryPillsContainer');
      const selectedCats = pillsCont
        ? Array.from(pillsCont.querySelectorAll('.mcat-pill.selected')).map(p => p.dataset.cat)
        : ['Общее'];
      const cats = selectedCats.length > 0 ? selectedCats : ['Общее'];
      const cat = cats[0]; // primary category for backward compat
      
      // Read selected custom categories from multi-pill container
      const customCont = document.getElementById('manualWordCustomCategoryPillsContainer');
      const selectedCustomCats = customCont
        ? Array.from(customCont.querySelectorAll('.mcat-pill.selected')).map(p => p.dataset.cat)
        : ['Без категории'];
      const customCats = selectedCustomCats.length > 0 ? selectedCustomCats : ['Без категории'];
      const customCat = customCats[0];
      
      const definition = definitionEl ? definitionEl.value.trim() : '';
      const rule = ruleEl ? ruleEl.value.trim() : '';
      
      if (eng === "" || rus === "") {
        alert(manualAddType === 'phrase' ? "Пожалуйста, заполните оба поля: английская фраза и перевод!" : "Пожалуйста, заполните оба поля: английское слово и перевод!");
        return;
      }
      
      // Check for duplicates in personalDictionary
      const dupIndex = personalDictionary.findIndex(w => w.word.toLowerCase() === eng.toLowerCase());
      if (dupIndex !== -1) {
        // Show inline duplicate conflict UI instead of a browser alert
        const existingModal = document.getElementById('addWordModal');
        const existingConflict = document.getElementById('dupConflictBanner');
        if (existingConflict) existingConflict.remove(); // remove previous banner if any

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

        const old = personalDictionary[dupIndex];
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

        // Insert banner before save button
        const saveBtn = document.getElementById('saveManualWordBtn');
        if (saveBtn && saveBtn.parentNode) {
          saveBtn.parentNode.insertBefore(conflictBanner, saveBtn);
        }

        // Helper to build the new word object from current field values
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

        // Helper: reset fields and close banner
        const finishSave = () => {
          conflictBanner.remove();
          wordEngEl.value = '';
          wordRusEl.value = '';
          if (definitionEl) definitionEl.value = '';
          if (ruleEl) ruleEl.value = '';
          
          if (customCont) {
            customCont.querySelectorAll('.mcat-pill').forEach(p => {
              const isNone = p.dataset.cat === 'Без категории';
              p.classList.toggle('selected', isNone);
              p.style.background = isNone ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.04)';
              p.style.color = isNone ? '#ffffff' : 'var(--text-sub)';
              p.style.borderColor = isNone ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255,255,255,0.1)';
            });
          }
          
          // Reset filters so new entry is always visible
          dictTypeFilter = 'all';
          const catF = document.getElementById('dictCategoryFilter');
          const cusF = document.getElementById('dictCustomCategoryFilter');
          if (catF) catF.value = 'Все слова';
          if (cusF) cusF.value = 'All Categories';
          const pillsC = document.getElementById('dictTypePills');
          if (pillsC) {
            pillsC.querySelectorAll('.dict-type-pill').forEach(p => {
              p.classList.remove('active');
              p.style.background = 'transparent';
              p.style.color = 'var(--text-sub)';
            });
            const allP = pillsC.querySelector('[data-type="all"]');
            if (allP) { allP.classList.add('active'); allP.style.background = 'rgba(255, 255, 255, 0.12)'; allP.style.color = '#ffffff'; }
          }
          renderDictWordsList();
          resetFlashcard();
          recordActivity();
          // Brief success toast on save button
          const sb = document.getElementById('saveManualWordBtn');
          if (sb) {
            const ot = sb.textContent; const ob = sb.style.background;
            sb.textContent = `✓ «${eng}» сохранено!`;
            sb.style.background = 'linear-gradient(135deg, #1db954, #16a34a)';
            sb.disabled = true;
            setTimeout(() => { sb.textContent = ot; sb.style.background = ob; sb.disabled = false; wordEngEl.focus(); }, 1400);
          }
        };

        document.getElementById('dupReplaceBtn').addEventListener('click', (e) => {
          e.stopPropagation();
          // Replace old entry in-place, preserving its spaced repetition progress
          personalDictionary[dupIndex] = Object.assign({}, old, buildNewWord(), { level: old.level, interval: old.interval, nextReview: old.nextReview });
          saveDictionaryToStorage();
          finishSave();
        });

        document.getElementById('dupKeepBothBtn').addEventListener('click', (e) => {
          e.stopPropagation();
          // Add as a separate entry (allows duplicates by user's choice)
          personalDictionary.push(buildNewWord());
          saveDictionaryToStorage();
          finishSave();
        });

        document.getElementById('dupCancelBtn').addEventListener('click', (e) => {
          e.stopPropagation();
          conflictBanner.remove();
        });

        return; // Stop normal save flow until user picks an option
      }
      
      // Add custom word/phrase with memory parameters
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
      
      personalDictionary.push(newWord);
      saveDictionaryToStorage();
      
      // Keep modal open — clear fields for next entry
      wordEngEl.value = '';
      wordRusEl.value = '';
      if (definitionEl) definitionEl.value = '';
      if (ruleEl) ruleEl.value = '';
      // Reset category pills to default 'Общее'
      if (pillsCont) {
        pillsCont.querySelectorAll('.mcat-pill').forEach(p => {
          const isObe = p.dataset.cat === 'Общее';
          p.classList.toggle('selected', isObe);
          p.style.background = isObe ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.04)';
          p.style.color = isObe ? '#ffffff' : 'var(--text-sub)';
          p.style.borderColor = isObe ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255,255,255,0.1)';
        });
      }
      if (customCont) {
        customCont.querySelectorAll('.mcat-pill').forEach(p => {
          const isNone = p.dataset.cat === 'Без категории';
          p.classList.toggle('selected', isNone);
          p.style.background = isNone ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.04)';
          p.style.color = isNone ? '#ffffff' : 'var(--text-sub)';
          p.style.borderColor = isNone ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255,255,255,0.1)';
        });
      }

      // Reset filters to 'Все слова' so the newly added word is always visible
      const customFilterSelect = document.getElementById('dictCustomCategoryFilter');
      if (categoryFilter) {
        categoryFilter.value = 'Все слова';
      }
      if (customFilterSelect) {
        customFilterSelect.value = 'All Categories';
      }
      // Also reset type filter pills to 'all' so new entry is visible
      dictTypeFilter = 'all';
      const pillsContainerSave = document.getElementById('dictTypePills');
      if (pillsContainerSave) {
        pillsContainerSave.querySelectorAll('.dict-type-pill').forEach(p => {
          p.classList.remove('active');
          p.style.background = 'transparent';
          p.style.color = 'var(--text-sub)';
        });
        const allPillSave = pillsContainerSave.querySelector('[data-type="all"]');
        if (allPillSave) {
          allPillSave.classList.add('active');
          allPillSave.style.background = 'rgba(255, 255, 255, 0.12)';
          allPillSave.style.color = '#ffffff';
        }
      }

      renderDictWordsList();
      resetFlashcard();
      
      // Record activity in heatmap!
      recordActivity();

      // Show a brief in-modal success toast
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
          // Focus back on English field for next word/phrase
          wordEngEl.focus();
        }, 1400);
      }
    });
  }

  // 3. Card Speaker TTS Button listener
  const cardSpeakBtn = document.getElementById('cardSpeakBtn');
  if (cardSpeakBtn) {
    cardSpeakBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // VERY IMPORTANT! Prevent flipping card!
      if (activeTrainerWordObj && activeTrainerWordObj.word) {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(activeTrainerWordObj.word);
          const voices = window.speechSynthesis.getVoices();
          const enVoice = voices.find(v => v.lang.startsWith('en'));
          if (enVoice) utterance.voice = enVoice;
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      }
    });
  }

  // 3b. Card Practice Button listener
  const cardPracticeBtn = document.getElementById('cardPracticeBtn');
  if (cardPracticeBtn) {
    cardPracticeBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // VERY IMPORTANT! Prevent flipping card!
      if (activeTrainerWordObj && activeTrainerWordObj.word) {
        startRoleplay(activeTrainerWordObj.word);
      }
    });
  }

  // 3c. Card Speaker TTS Button listener (Back Side)
  const cardSpeakBtnBack = document.getElementById('cardSpeakBtnBack');
  if (cardSpeakBtnBack) {
    cardSpeakBtnBack.addEventListener('click', (e) => {
      e.stopPropagation(); // VERY IMPORTANT! Prevent flipping card!
      if (activeTrainerWordObj && activeTrainerWordObj.word) {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(activeTrainerWordObj.word);
          const voices = window.speechSynthesis.getVoices();
          const enVoice = voices.find(v => v.lang.startsWith('en'));
          if (enVoice) utterance.voice = enVoice;
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      }
    });
  }

  // 3d. Card Practice Button listener (Back Side)
  const cardPracticeBtnBack = document.getElementById('cardPracticeBtnBack');
  if (cardPracticeBtnBack) {
    cardPracticeBtnBack.addEventListener('click', (e) => {
      e.stopPropagation(); // VERY IMPORTANT! Prevent flipping card!
      if (activeTrainerWordObj && activeTrainerWordObj.word) {
        startRoleplay(activeTrainerWordObj.word);
      }
    });
  }

  // ✏️ Edit Word on Trainer Card Front/Back Side
  const cardEditBtnFront = document.getElementById('cardEditBtnFront');
  if (cardEditBtnFront) {
    cardEditBtnFront.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeTrainerWordObj) {
        openEditWordModal(activeTrainerWordObj, () => {
          renderTrainerCard(activeTrainerWordObj);
        });
      }
    });
  }

  const cardEditBtnBack = document.getElementById('cardEditBtnBack');
  if (cardEditBtnBack) {
    cardEditBtnBack.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeTrainerWordObj) {
        openEditWordModal(activeTrainerWordObj, () => {
          renderTrainerCard(activeTrainerWordObj);
        });
      }
    });
  }


  // 3e. Training Mode Select listener
  const trainingModeSelect = document.getElementById('trainingModeSelect');
  if (trainingModeSelect) {
    trainingModeSelect.addEventListener('change', () => {
      if (activeTrainerWordObj) {
        // Ensure card starts from the front face (clear flipped class and style transform)
        const flashcardInner = document.getElementById('flashcardInner');
        if (flashcardInner) {
          flashcardInner.classList.remove('is-flipped');
          flashcardInner.style.transform = '';
        }
        // Ensure Spaced Repetition pills are hidden initially
        const pills = document.getElementById('spacedRepetitionPills');
        if (pills) {
          pills.style.visibility = 'hidden';
          pills.style.opacity = '0';
        }
        renderTrainerCard(activeTrainerWordObj);
      }
    });
  }

  // 3f. Training Type Select listener (Words, Phrases, or All)
  const trainingTypeSelect = document.getElementById('trainingTypeSelect');
  if (trainingTypeSelect) {
    trainingTypeSelect.addEventListener('change', () => {
      // Force study list recalculation and pick a new appropriate word matching the selected type
      clearStudySession();
      startStudySession();
      resetFlashcard();
    });
  }

  // 3g. Training Limit Select listener (20, 40, or All)
  if (trainingLimitSelect) {
    const savedLimit = localStorage.getItem('galaxy_training_limit') || '20';
    trainingLimitSelect.value = savedLimit;

    trainingLimitSelect.addEventListener('change', () => {
      localStorage.setItem('galaxy_training_limit', trainingLimitSelect.value);
      clearStudySession();
      startStudySession();
      resetFlashcard();
    });
  }

  // 3h. Training Order Select listener (Shuffle or Ordered)
  const trainingOrderSelect = document.getElementById('trainingOrderSelect');
  if (trainingOrderSelect) {
    const savedOrder = localStorage.getItem('galaxy_training_order') || 'shuffle';
    trainingOrderSelect.value = savedOrder;

    trainingOrderSelect.addEventListener('change', () => {
      localStorage.setItem('galaxy_training_order', trainingOrderSelect.value);
      clearStudySession();
      startStudySession();
      resetFlashcard();
    });
  }

  // 3i. Training Force All Checkbox listener (Ignore Intervals)
  const trainingForceAllCheckbox = document.getElementById('trainingForceAllCheckbox');
  if (trainingForceAllCheckbox) {
    const savedForceAll = localStorage.getItem('galaxy_training_force_all') === 'true';
    trainingForceAllCheckbox.checked = savedForceAll;

    trainingForceAllCheckbox.addEventListener('change', () => {
      localStorage.setItem('galaxy_training_force_all', trainingForceAllCheckbox.checked);
      clearStudySession();
      startStudySession();
      resetFlashcard();
    });
  }

  // 3j. Training Folder Select listener
  const trainingFolderSelect = document.getElementById('trainingFolderSelect');
  if (trainingFolderSelect) {
    trainingFolderSelect.addEventListener('change', () => {
      const dictFilter = document.getElementById('dictCategoryFilter');
      if (dictFilter) {
        dictFilter.value = trainingFolderSelect.value;
      }
      
      const trainingCategoryLabel = document.getElementById('trainingCategoryLabel');
      if (trainingCategoryLabel) {
        trainingCategoryLabel.textContent = trainingFolderSelect.value;
      }
      
      clearStudySession();
      startStudySession();
      resetFlashcard();
      
      // Update dictionary view behind the scenes if it's open or will be opened later
      renderDictionary();
    });
  }

  // Open dictionary modal
  const openDictionaryModal = () => {
    window.dictForceStudyAll = false; // Reset force-study on new modal session
    if (trainingModal) closeModalEl(trainingModal); // Close training if open
    const dictListEl = document.getElementById('dictWordsList');
    if (dictListEl) {
      dictListEl.style.flex = '1 1 0';
      dictListEl.style.minHeight = '0';
    }
    const dictModalBody = modal.querySelector('.modal-body');
    if (dictModalBody) {
      dictModalBody.style.minHeight = '0';
    }
    
    // Ensure collapsible filters are collapsed on open
    const filtersCollapse = document.getElementById('dictFiltersCollapse');
    const toggleFiltersBtn = document.getElementById('toggleDictFiltersBtn');
    if (filtersCollapse) {
      filtersCollapse.classList.remove('expanded');
    }
    if (toggleFiltersBtn) {
      toggleFiltersBtn.classList.remove('active');
      const arrow = toggleFiltersBtn.querySelector('.toggle-arrow');
      if (arrow) arrow.textContent = '▼';
    }

    openModalEl(modal);
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    
    // Reset type filter to 'all' when opening
    dictTypeFilter = 'all';
    dictSortOption = 'default';
    
    // Update type filter buttons to show 'all' as active
    const pillsContainer = document.getElementById('dictTypePills');
    if (pillsContainer) {
      const pills = pillsContainer.querySelectorAll('.dict-type-pill');
      pills.forEach(p => {
        p.classList.remove('active');
        p.style.background = 'transparent';
        p.style.color = 'var(--text-sub)';
      });
      const allPill = pillsContainer.querySelector('[data-type="all"]');
      if (allPill) {
        allPill.classList.add('active');
        allPill.style.background = 'rgba(255, 255, 255, 0.12)';
        allPill.style.color = '#ffffff';
      }
    }
    
    // Reset sort to default
    const sortSelect = document.getElementById('dictSortSelect');
    if (sortSelect) {
      sortSelect.value = 'default';
    }
    
    // Default to Personal tab
    activeDictTab = 'personal';
    if (tabPersonal) {
      tabPersonal.classList.add('active');
      tabPersonal.style.color = 'var(--accent-spotify)';
      tabPersonal.style.borderBottomColor = 'var(--accent-spotify)';
      tabPersonal.style.fontWeight = '700';
    }
    if (tabEssential) {
      tabEssential.classList.remove('active');
      tabEssential.style.color = 'var(--text-muted)';
      tabEssential.style.borderBottomColor = 'transparent';
      tabEssential.style.fontWeight = '600';
    }
    if (addCategoryBtn) addCategoryBtn.style.display = 'flex';
    if (addWordBtn) addWordBtn.style.display = 'flex';
    if (progressBarContainer) progressBarContainer.style.display = 'none';
    
    populateCategorySelectors();
    renderDictWordsList();
    resetFlashcard();
    renderHeatmap();
  };
  window.openDictionaryModal = openDictionaryModal;

  openBtn.addEventListener('click', openDictionaryModal);

  // Close dictionary modal helper
  const closeDictModal = () => {
    stopMatchGame();
    stopLearnGame();
    if (typeof closeModalEl === 'function') {
      closeModalEl(modal);
    } else {
      modal.style.display = 'none';
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    }
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', closeDictModal);
  }

  // Backdrop click intentionally disabled — use the close button to dismiss

  // Open training modal helper
  const openTrainingModal = () => {
    window.dictForceStudyAll = false;
    closeModalEl(modal); // Close dictionary if open
    if (trainingModal) {
      openModalEl(trainingModal);
    }
    
    // Ensure training settings are collapsed on open
    const trainSettings = document.getElementById('trainingSettingsBar');
    const toggleTrainSettingsBtn = document.getElementById('toggleTrainingSettingsBtn');
    if (trainSettings) {
      trainSettings.classList.remove('expanded');
    }
    if (toggleTrainSettingsBtn) {
      toggleTrainSettingsBtn.classList.remove('active');
      const arrow = toggleTrainSettingsBtn.querySelector('.toggle-arrow');
      if (arrow) arrow.textContent = '▼';
    }

    // Ensure training heatmap state is initialized according to localStorage (default is collapsed)
    const trainHeatmap = trainingModal ? trainingModal.querySelector('.dict-heatmap-container') : null;
    const isTrainHeatmapCollapsed = localStorage.getItem('training_heatmap_collapsed') !== 'false';
    if (trainHeatmap) {
      if (isTrainHeatmapCollapsed) {
        trainHeatmap.classList.add('collapsed');
      } else {
        trainHeatmap.classList.remove('collapsed');
      }
    }
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    
    // Sync category label and selector
    if (categoryFilter) {
      if (trainingCategoryLabel) trainingCategoryLabel.textContent = categoryFilter.value;
      const trainingFolderSelect = document.getElementById('trainingFolderSelect');
      if (trainingFolderSelect) {
        trainingFolderSelect.value = categoryFilter.value;
      }
    }

    // Defensive self-healing: Ensure close button exists
    if (!document.getElementById('closeTrainingModalBtn')) {
      const headerDiv = trainingModal ? trainingModal.querySelector('.modal-header > div:last-child') : null;
      if (headerDiv) {
        headerDiv.insertAdjacentHTML('beforeend', '<button class="modal-close-btn" id="closeTrainingModalBtn" style="background: none; border: none; color: var(--text-sub); font-size: 1.2rem; cursor: pointer; outline: none; flex-shrink: 0; padding: 4px; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px;">✕</button>');
        document.getElementById('closeTrainingModalBtn').addEventListener('click', closeTrainingModal);
      }
    }
    
    // Sync progress bar display state
    if (progressBarContainer) {
      progressBarContainer.style.display = (activeDictTab === 'essential') ? 'flex' : 'none';
    }
    
    // Start Quizlet-style study session!
    startStudySession();
    
    resetFlashcard();
    renderHeatmap();
    updateEssentialProgress();
  };
  window.openTrainingModal = openTrainingModal;

  if (openTrainingBtn) {
    openTrainingBtn.addEventListener('click', openTrainingModal);
  }
  if (startTrainingFromDictBtn) {
    startTrainingFromDictBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openTrainingModal();
    });
  }

  // Close training modal helper
  const closeTrainingModal = () => {
    closeModalEl(trainingModal);
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  };

  if (closeTrainingModalBtn) {
    closeTrainingModalBtn.addEventListener('click', closeTrainingModal);
  }
  const closeSessionSuccessBtn = document.getElementById('closeSessionSuccessBtn');
  if (closeSessionSuccessBtn) {
    closeSessionSuccessBtn.addEventListener('click', closeTrainingModal);
  }
  // Backdrop click intentionally disabled — use the close button to dismiss

  // Flip Flashcard on click
  if (flashcard) {
    flashcard.addEventListener('click', () => {
      if (flashcardInner) {
        const isFlipped = flashcardInner.classList.toggle('is-flipped');
        
        // Also show Spaced Repetition control buttons when flipped to back side
        const pills = document.getElementById('spacedRepetitionPills');
        if (pills) {
          if (isFlipped) {
            pills.style.visibility = 'visible';
            pills.style.opacity = '1';
            pills.style.transition = 'opacity 0.25s ease';
          } else {
            pills.style.visibility = 'hidden';
            pills.style.opacity = '0';
          }
        }
        
        // If flipped to back and is essential word with placeholder translation, trigger load!
        if (isFlipped && activeTrainerWordObj) {
          const w = activeTrainerWordObj;
          const transEl = document.getElementById('cardTranslation');
          if (w.translation.includes('нажмите для перевода') || w.translation === 'частотное слово') {
            if (transEl) transEl.textContent = 'Переводим... 🔍';
            fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(w.word)}&langpair=en|ru`)
              .then(res => res.json())
              .then(json => {
                const tr = json.responseData.translatedText;
                if (tr && tr.toLowerCase() !== w.word.toLowerCase()) {
                  const RussianTr = tr.toLowerCase();
                  w.translation = RussianTr;
                  if (activeTrainerWordObj && activeTrainerWordObj.word === w.word) {
                    if (transEl) transEl.textContent = RussianTr;
                  }
                  
                  // Update visual list label
                  const listEl = document.getElementById('dictWordsList');
                  if (listEl) {
                    const rows = listEl.children;
                    for (let i = 0; i < rows.length; i++) {
                      const titleEl = rows[i].querySelector('div div');
                      if (titleEl && titleEl.textContent.trim().toLowerCase().startsWith(w.word.toLowerCase())) {
                        const subLabel = rows[i].querySelector('div').children[1];
                        if (subLabel) subLabel.textContent = RussianTr;
                        break;
                      }
                    }
                  }
                  
                  // Save translation in storage if promoted
                  const pIdx = personalDictionary.findIndex(x => x.word.toLowerCase() === w.word.toLowerCase());
                  if (pIdx !== -1) {
                    personalDictionary[pIdx].translation = RussianTr;
                    saveDictionaryToStorage();
                  }
                } else {
                  if (transEl) transEl.textContent = 'Частотное слово';
                }
              })
              .catch(() => {
                if (transEl) transEl.textContent = 'Частотное слово';
              });
          }
        }
      }
    });
  }

  // Clear all dictionary words
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const activeCat = categoryFilter ? categoryFilter.value : 'Все слова';
      if (activeDictTab === 'essential' || activeCat.startsWith('«Топ-')) {
        alert("Встроенные частотные коллекции нельзя очистить. Переключитесь на вкладку «My Dictionary».");
        return;
      }
      if (personalDictionary.length === 0) return;

      // Remove any existing confirmation banner
      const existing = document.getElementById('clearDictConfirmBanner');
      if (existing) { existing.remove(); return; }

      const banner = document.createElement('div');
      banner.id = 'clearDictConfirmBanner';
      banner.style.cssText = `
        background: rgba(239,68,68,0.08);
        border: 1px solid rgba(239,68,68,0.35);
        border-radius: 14px;
        padding: 14px 16px;
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        animation: fadeIn 0.2s ease;
        box-sizing: border-box;
        width: 100%;
      `;
      banner.innerHTML = `
        <div style="font-size: 0.82rem; color: #ef4444; font-weight: 700; display: flex; align-items: center; gap: 6px;">
          ☠️ Это действие необратимо!
        </div>
        <div style="font-size: 0.75rem; color: var(--text-sub); line-height: 1.5;">
          Будет удалено <strong style="color: var(--text-main);">${personalDictionary.length} ${(() => { const n = personalDictionary.length; return n % 100 >= 11 && n % 100 <= 19 ? 'слов' : n % 10 === 1 ? 'слово' : n % 10 >= 2 && n % 10 <= 4 ? 'слова' : 'слов'; })()}</strong> из вашего словаря без возможности восстановления.<br>
          Чтобы подтвердить, введите слово <strong style="color: #ef4444; letter-spacing: 0.05em;">УДАЛИТЬ</strong>:
        </div>
        <input id="clearDictConfirmInput" type="text" autocomplete="off" placeholder="Введите УДАЛИТЬ" style="
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 10px;
          padding: 8px 12px;
          color: var(--text-main);
          font-size: 0.82rem;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          font-family: var(--font-body, sans-serif);
          transition: border-color 0.2s;
        " />
        <div style="display: flex; gap: 8px;">
          <button id="clearDictConfirmBtn" style="
            background: linear-gradient(135deg, #ef4444, #b91c1c);
            color: #fff;
            border: none;
            border-radius: 10px;
            padding: 8px 16px;
            font-size: 0.8rem;
            font-weight: 700;
            cursor: pointer;
            flex: 1;
            opacity: 0.4;
            transition: opacity 0.2s;
            outline: none;
          " disabled>☠️ Delete всё</button>
          <button id="clearDictCancelBtn" style="
            background: transparent;
            color: var(--text-sub);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 8px 14px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: opacity 0.2s;
            outline: none;
          ">Cancel</button>
        </div>
      `;

      // Insert banner below the clear button
      const bottomControls = clearBtn.closest('.dict-bottom-controls') || clearBtn.parentNode;
      bottomControls.insertAdjacentElement('afterend', banner);

      const confirmInput = document.getElementById('clearDictConfirmInput');
      const confirmBtn = document.getElementById('clearDictConfirmBtn');
      const cancelBtn = document.getElementById('clearDictCancelBtn');

      setTimeout(() => confirmInput && confirmInput.focus(), 80);

      confirmInput.addEventListener('input', () => {
        const match = confirmInput.value.trim().toUpperCase() === 'УДАЛИТЬ';
        confirmBtn.disabled = !match;
        confirmBtn.style.opacity = match ? '1' : '0.4';
        confirmInput.style.borderColor = match ? 'rgba(239,68,68,0.7)' : 'rgba(239,68,68,0.3)';
      });

      confirmInput.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' && !confirmBtn.disabled) confirmBtn.click();
        if (ev.key === 'Escape') cancelBtn.click();
      });

      confirmBtn.addEventListener('click', () => {
        personalDictionary = [];
        saveDictionaryToStorage();
        renderDictWordsList();
        resetFlashcard();
        banner.remove();
      });

      cancelBtn.addEventListener('click', () => banner.remove());
    });
  }

  // ── Scroll-to-top button for word list ──────────────────────────────────
  const dictList = document.getElementById('dictWordsList');
  const scrollTopBtn = document.getElementById('dictScrollTopBtn');
  if (dictList && scrollTopBtn) {
    dictList.addEventListener('scroll', () => {
      if (dictList.scrollTop > 80) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    scrollTopBtn.addEventListener('click', () => {
      dictList.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  // ─────────────────────────────────────────────────────────────────────────


  const toggleFiltersBtn = document.getElementById('toggleDictFiltersBtn');
  const filtersCollapse = document.getElementById('dictFiltersCollapse');
  if (toggleFiltersBtn && filtersCollapse) {
    toggleFiltersBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = filtersCollapse.classList.contains('expanded');
      if (isExpanded) {
        filtersCollapse.classList.remove('expanded');
        toggleFiltersBtn.classList.remove('active');
        const arrow = toggleFiltersBtn.querySelector('.toggle-arrow');
        if (arrow) arrow.textContent = '▼';
      } else {
        filtersCollapse.classList.add('expanded');
        toggleFiltersBtn.classList.add('active');
        const arrow = toggleFiltersBtn.querySelector('.toggle-arrow');
        if (arrow) arrow.textContent = '▲';
      }
    });
  }

  const toggleTrainingSettingsBtn = document.getElementById('toggleTrainingSettingsBtn');
  const trainingSettingsBar = document.getElementById('trainingSettingsBar');
  if (toggleTrainingSettingsBtn && trainingSettingsBar) {
    toggleTrainingSettingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = trainingSettingsBar.classList.contains('expanded');
      if (isExpanded) {
        trainingSettingsBar.classList.remove('expanded');
        toggleTrainingSettingsBtn.classList.remove('active');
        const arrow = toggleTrainingSettingsBtn.querySelector('.toggle-arrow');
        if (arrow) arrow.textContent = '▼';
      } else {
        trainingSettingsBar.classList.add('expanded');
        toggleTrainingSettingsBtn.classList.add('active');
        const arrow = toggleTrainingSettingsBtn.querySelector('.toggle-arrow');
        if (arrow) arrow.textContent = '▲';
      }
    });
  }

  const toggleTrainingHeatmapBtn = document.getElementById('toggleTrainingHeatmapBtn');
  if (toggleTrainingHeatmapBtn && trainingModal) {
    toggleTrainingHeatmapBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const trainHeatmap = trainingModal.querySelector('.dict-heatmap-container');
      if (trainHeatmap) {
        const isCollapsed = trainHeatmap.classList.contains('collapsed');
        if (isCollapsed) {
          trainHeatmap.classList.remove('collapsed');
          localStorage.setItem('training_heatmap_collapsed', 'false');
        } else {
          trainHeatmap.classList.add('collapsed');
          localStorage.setItem('training_heatmap_collapsed', 'true');
        }
      }
    });
  }
  

  // Search words in dictionary
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderDictWordsList(searchInput.value.trim());
    });
  }

  // Category filter select trigger
  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      window.dictForceStudyAll = false; // Reset force-study
      renderDictWordsList(searchInput ? searchInput.value.trim() : "");
      resetFlashcard();
    });
  }

  // Custom Category filter select trigger
  const customCategoryFilter = document.getElementById('dictCustomCategoryFilter');
  if (customCategoryFilter) {
    customCategoryFilter.addEventListener('change', () => {
      window.dictForceStudyAll = false; // Reset force-study
      renderDictWordsList(searchInput ? searchInput.value.trim() : "");
      resetFlashcard();
    });
  }

  // Initialize type filter buttons (Words/Phrases/All)
  setupDictTypeFilters();

  // Initialize sort filter
  setupDictSortFilter();

  // Create custom word category / playlist folder
  const addCatBtn = document.getElementById('addCustomCategoryBtn');
  if (addCatBtn) {
    addCatBtn.addEventListener('click', async () => {
      const name = await (window.showCustomPrompt ? window.showCustomPrompt("📁 Новая папка", "Enter new folder name для слов:", "Например: Глаголы движения") : prompt("Enter new folder name для слов:"));
      if (name === null) return; // Cancelled
      const cleanName = name.trim();
      if (!cleanName) {
        if (window.showToast) window.showToast("Название папки не может быть пустым!", "error");
        else alert("Название папки не может быть пустым!");
        return;
      }
      if (cleanName.length > 25) {
        if (window.showToast) window.showToast("Название папки слишком длинное (максимум 25 символов)!", "error");
        else alert("Название папки слишком длинное (максимум 25 символов)!");
        return;
      }
      
      // Case-insensitive duplicate check
      const exists = personalCategories.some(c => c.toLowerCase() === cleanName.toLowerCase());
      if (exists) {
        if (window.showToast) window.showToast("Папка с таким названием уже существует!", "error");
        else alert("Папка с таким названием уже существует!");
        return;
      }
      
      personalCategories.push(cleanName);
      saveCategories();
      
      // Dynamic refresh
      populateCategorySelectors();
      
      // Switch active view directly to the newly created folder
      if (categoryFilter) {
        categoryFilter.value = cleanName;
        categoryFilter.dispatchEvent(new Event('change'));
      }
      if (window.showToast) window.showToast(`Папка «${cleanName}» успешно создана!`, "success");
    });
  }

  // Manage Folders Modal
  const manageFoldersBtn = document.getElementById('manageFoldersBtn');
  const manageFoldersModal = document.getElementById('manageFoldersModal');
  const closeManageFoldersBtn = document.getElementById('closeManageFoldersBtn');

  function renderManageFoldersList() {
    const list = document.getElementById('manageFoldersList');
    if (!list) return;
    list.innerHTML = '';
    
    // Ensure "Старые" exists so user can toggle it even if it's the only one
    const catsToRender = [...personalCategories];
    if (!catsToRender.includes('Старые')) catsToRender.push('Старые');

    catsToRender.forEach(cat => {
      const isHidden = personalHiddenCategories.includes(cat);
      const row = document.createElement('div');
      row.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(255,255,255,0.05); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);`;
      
      const nameSpan = document.createElement('span');
      nameSpan.style.cssText = `color: #fff; font-size: 0.9rem; font-weight: 600; flex-grow: 1;`;
      nameSpan.textContent = '📁 ' + cat;
      
      const toggleWrapper = document.createElement('label');
      toggleWrapper.style.cssText = `position: relative; display: inline-block; width: 44px; height: 24px;`;
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !isHidden; // checked = active, unchecked = hidden
      checkbox.style.cssText = `opacity: 0; width: 0; height: 0; position: absolute;`;
      
      const slider = document.createElement('span');
      slider.className = 'toggle-slider'; // assuming toggle-slider CSS exists, otherwise fallback
      slider.style.cssText = `position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${checkbox.checked ? '#1db954' : '#4b5563'}; transition: .4s; border-radius: 24px;`;
      
      const knob = document.createElement('span');
      knob.style.cssText = `position: absolute; content: ""; height: 18px; width: 18px; left: ${checkbox.checked ? '22px' : '3px'}; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%;`;
      
      slider.appendChild(knob);
      toggleWrapper.appendChild(checkbox);
      toggleWrapper.appendChild(slider);
      
      checkbox.addEventListener('change', () => {
        const checked = checkbox.checked;
        slider.style.backgroundColor = checked ? '#1db954' : '#4b5563';
        knob.style.left = checked ? '22px' : '3px';
        
        if (checked) {
          // Remove from hidden
          personalHiddenCategories = personalHiddenCategories.filter(c => c !== cat);
        } else {
          // Add to hidden
          if (!personalHiddenCategories.includes(cat)) {
            personalHiddenCategories.push(cat);
          }
        }
        saveCategories();
      });
      
      row.appendChild(nameSpan);
      row.appendChild(toggleWrapper);
      list.appendChild(row);
    });
  }

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
        // Re-render dictionary to apply any hidden folder changes
        populateCategorySelectors();
        renderDictWordsList(searchInput ? searchInput.value.trim() : "");
      });
    }
  }

  // Create custom word category / tag
  const addCustomCatBtn = document.getElementById('addCustomCustomCategoryBtn');
  if (addCustomCatBtn) {
    addCustomCatBtn.addEventListener('click', async () => {
      const name = await (window.showCustomPrompt ? window.showCustomPrompt("🏷️ Новая категория", "Введите название новой категории для слов/фраз:", "Например: Идиомы") : prompt("Введите название новой категории для слов/фраз:"));
      if (name === null) return; // Cancelled
      const cleanName = name.trim();
      if (!cleanName) {
        if (window.showToast) window.showToast("Название категории не может быть пустым!", "error");
        else alert("Название категории не может быть пустым!");
        return;
      }
      if (cleanName.length > 25) {
        if (window.showToast) window.showToast("Название категории слишком длинное (максимум 25 символов)!", "error");
        else alert("Название категории слишком длинное (максимум 25 символов)!");
        return;
      }
      
      // Case-insensitive duplicate check
      const exists = personalCustomCategories.some(c => c.toLowerCase() === cleanName.toLowerCase());
      if (exists || cleanName.toLowerCase() === 'без категории' || cleanName.toLowerCase() === 'все категории') {
        if (window.showToast) window.showToast("Категория с таким названием уже существует или зарезервирована!", "error");
        else alert("Категория с таким названием уже существует или зарезервирована!");
        return;
      }
      
      personalCustomCategories.push(cleanName);
      saveCategories();
      
      // Dynamic refresh
      populateCategorySelectors();
      
      // Switch active view directly to the newly created category
      if (customCategoryFilter) {
        customCategoryFilter.value = cleanName;
        customCategoryFilter.dispatchEvent(new Event('change'));
      }
      if (window.showToast) window.showToast(`Категория «${cleanName}» успешно создана!`, "success");
    });
  }

  // Bind Spaced Repetition pill buttons with snappy mobile touch response (0ms delay)
  const forgotBtn = document.getElementById('cardForgotBtn');
  const hardBtn = document.getElementById('cardHardBtn');
  const easyBtn = document.getElementById('cardEasyBtn');

  const bindSnappyInteraction = (btn, callback) => {
    if (!btn) return;

    let isTouching = false;

    btn.addEventListener('touchstart', (e) => {
      isTouching = true;
      e.stopPropagation();
      // Prevent synthetic click that hits the shifted Undo button on mobile
      e.preventDefault(); 
      
      // Manually trigger active state since we prevented default
      btn.style.transform = 'scale(0.92)';
      btn.style.opacity = '0.8';
      setTimeout(() => {
        btn.style.transform = '';
        btn.style.opacity = '';
      }, 150);

      callback();
    }, { passive: false });

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!isTouching) {
        callback();
      }
      // Reset after a short delay so next click/touch works cleanly
      setTimeout(() => { isTouching = false; }, 300);
    });
  };
  
  if (forgotBtn) {
    bindSnappyInteraction(forgotBtn, () => handleWordReview('forgot'));
  }
  if (hardBtn) {
    bindSnappyInteraction(hardBtn, () => handleWordReview('hard'));
  }
  if (easyBtn) {
    bindSnappyInteraction(easyBtn, () => handleWordReview('easy'));
  }

  const undoBtn = document.getElementById('cardUndoBtn');
  if (undoBtn) {
    undoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleUndoReview();
    });
  }

  // Delete active flashcard word
  const deleteBtn = document.getElementById('cardDeleteBtn');
  if (deleteBtn) {
    bindSnappyInteraction(deleteBtn, async () => {
      const activeWord = activeTrainerWordObj ? activeTrainerWordObj.word : document.getElementById('cardWord')?.textContent;
      if (!activeWord) return;
      
      const confirmed = await window.showCustomConfirm(
        '🗑️ Удаление слова',
        `Вы уверены, что хотите удалить слово "${activeWord}" из словаря? Это действие нельзя отменить.`,
        { okText: 'Удалить', cancelText: 'Отмена', isDestructive: true }
      );
      if (!confirmed) return;
      
      personalDictionary = personalDictionary.filter(w => w.word !== activeWord);
      saveDictionaryToStorage();
      
      const wasInQueue = sessionQueue.some(w => w.word === activeWord);
      sessionQueue = sessionQueue.filter(w => w.word !== activeWord);
      if (wasInQueue) {
        sessionTotalInitialCount = Math.max(0, sessionTotalInitialCount - 1);
      }
      
      saveStudySession();
      renderDictWordsList(searchInput ? searchInput.value.trim() : "");
      resetFlashcard();
      
      if (window.showToast) window.showToast(`Слово "${activeWord}" удалено`);
    });
  }


  // Match Game Mode inspired by Quizlet
  let matchInterval = null;
  let matchStartTime = 0;
  let selectedTile = null;
  let matchCompletedCount = 0;
  let currentMatchTimerValue = 0;

  const startMatchBtn = document.getElementById('startMatchGameBtn');
  const exitMatchBtn = document.getElementById('exitMatchGameBtn');
  const dictStandardView = document.getElementById('dictStandardView');
  const dictMatchView = document.getElementById('dictMatchView');
  const matchTimerEl = document.getElementById('matchTimer');
  const matchGrid = document.getElementById('matchGrid');

  function shuffleFisherYates(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function startMatchGame() {
    // We fetch from personalDictionary
    if (!personalDictionary || personalDictionary.length < 6) {
      alert('Сохраните больше слов для игры (минимум 6)! 🎮');
      return;
    }

    // Pick 6 random words
    const shuffledWords = shuffleFisherYates([...personalDictionary]);
    const selected6 = shuffledWords.slice(0, 6);

    // Create 12 tiles
    let tiles = [];
    selected6.forEach((item, idx) => {
      tiles.push({ pairId: idx, text: item.word, type: 'en' });
      tiles.push({ pairId: idx, text: item.translation, type: 'ru' });
    });

    // Shuffle tiles
    shuffleFisherYates(tiles);

    // Render tiles
    if (matchGrid) {
      matchGrid.innerHTML = '';
      tiles.forEach(tileData => {
        const tile = document.createElement('div');
        tile.className = 'match-tile';
        tile.textContent = tileData.text;
        tile.dataset.pairId = tileData.pairId;
        tile.dataset.type = tileData.type;

        tile.addEventListener('click', () => handleTileClick(tile));
        matchGrid.appendChild(tile);
      });
    }

    // Switch views
    if (dictStandardView) dictStandardView.style.display = 'none';
    if (dictMatchView) dictMatchView.style.display = 'flex';

    // Start timer
    matchStartTime = Date.now();
    matchCompletedCount = 0;
    selectedTile = null;
    if (matchInterval) clearInterval(matchInterval);

    matchInterval = setInterval(() => {
      const elapsed = (Date.now() - matchStartTime) / 1000;
      if (matchTimerEl) matchTimerEl.textContent = elapsed.toFixed(1) + 's';
      currentMatchTimerValue = elapsed;
    }, 100);
  }

  function handleTileClick(tile) {
    if (tile.classList.contains('matched') || tile.classList.contains('selected') || tile.classList.contains('wrong')) {
      return;
    }

    if (!selectedTile) {
      // Select first tile
      tile.classList.add('selected');
      selectedTile = tile;
    } else {
      // Compare with second tile
      const first = selectedTile;
      const second = tile;

      if (first === second) return;

      const id1 = first.dataset.pairId;
      const type1 = first.dataset.type;
      const id2 = second.dataset.pairId;
      const type2 = second.dataset.type;

      if (id1 === id2 && type1 !== type2) {
        // MATCH SUCCESS!
        first.classList.remove('selected');
        first.classList.add('matched');
        second.classList.add('matched');
        
        selectedTile = null;
        matchCompletedCount += 2;

        if (matchCompletedCount === 12) {
          clearInterval(matchInterval);
          setTimeout(() => {
            alert(`Отлично! Твое время: ${currentMatchTimerValue.toFixed(1)} сек 🏆🎮`);
            stopMatchGame();
          }, 400);
        }
      } else {
        // MATCH WRONG!
        first.classList.remove('selected');
        first.classList.add('wrong', 'shake-anim');
        second.classList.add('wrong', 'shake-anim');
        selectedTile = null;

        setTimeout(() => {
          first.classList.remove('wrong', 'shake-anim');
          second.classList.remove('wrong', 'shake-anim');
        }, 500);
      }
    }
  }

  function stopMatchGame() {
    if (matchInterval) {
      clearInterval(matchInterval);
      matchInterval = null;
    }
    if (dictStandardView) dictStandardView.style.display = 'flex';
    if (dictMatchView) dictMatchView.style.display = 'none';
    selectedTile = null;
    matchCompletedCount = 0;
  }

  if (startMatchBtn) {
    startMatchBtn.addEventListener('click', startMatchGame);
  }
  if (exitMatchBtn) {
    exitMatchBtn.addEventListener('click', stopMatchGame);
  }

  // Learn Mode (Multiple Choice Quiz Mode)
  let learnQuestionsList = [];
  let learnCurrentIndex = 0;
  let learnCorrectAnswersCount = 0;
  let learnIsProcessingAnswer = false;

  const startLearnBtn = document.getElementById('startLearnGameBtn');
  const exitLearnBtn = document.getElementById('exitLearnGameBtn');
  const dictLearnView = document.getElementById('dictLearnView');
  const learnGameArea = document.getElementById('learnGameArea');
  const learnResultsView = document.getElementById('learnResultsView');
  const learnChoicesGrid = document.getElementById('learnChoicesGrid');
  const learnQuestionWord = document.getElementById('learnQuestionWord');
  const learnCurrentQuestion = document.getElementById('learnCurrentQuestion');
  const learnAccuracy = document.getElementById('learnAccuracy');
  const learnProgressBar = document.getElementById('learnProgressBar');
  const closeLearnResultsBtn = document.getElementById('closeLearnResultsBtn');
  const learnResultCorrect = document.getElementById('learnResultCorrect');
  const learnResultPercent = document.getElementById('learnResultPercent');

  function startLearnGame() {
    if (!personalDictionary || personalDictionary.length < 4) {
      alert('Соберите больше слов для старта (минимум 4)! 📝');
      return;
    }

    // Select up to 10 random words
    const shuffledWords = shuffleFisherYates([...personalDictionary]);
    learnQuestionsList = shuffledWords.slice(0, Math.min(10, shuffledWords.length));
    
    learnCurrentIndex = 0;
    learnCorrectAnswersCount = 0;
    learnIsProcessingAnswer = false;

    // Switch views
    if (dictStandardView) dictStandardView.style.display = 'none';
    if (dictMatchView) dictMatchView.style.display = 'none';
    if (dictLearnView) dictLearnView.style.display = 'flex';
    if (learnGameArea) learnGameArea.style.display = 'flex';
    if (learnResultsView) learnResultsView.style.display = 'none';

    loadLearnQuestion();
  }

  function loadLearnQuestion() {
    if (learnCurrentIndex >= learnQuestionsList.length) {
      // Game Over: Show results screen
      if (learnGameArea) learnGameArea.style.display = 'none';
      if (learnResultsView) learnResultsView.style.display = 'flex';

      if (learnResultCorrect) learnResultCorrect.textContent = learnCorrectAnswersCount;
      if (learnResultPercent) {
        const pct = Math.round((learnCorrectAnswersCount / learnQuestionsList.length) * 100);
        learnResultPercent.textContent = pct + '%';
      }
      return;
    }

    const targetObj = learnQuestionsList[learnCurrentIndex];
    if (!targetObj) return;

    // Card text
    if (learnQuestionWord) {
      learnQuestionWord.textContent = targetObj.word;
      // Responsive scale
      if (targetObj.word.length > 25) {
        learnQuestionWord.style.fontSize = '1.15rem';
      } else if (targetObj.word.length > 15) {
        learnQuestionWord.style.fontSize = '1.3rem';
      } else {
        learnQuestionWord.style.fontSize = '1.55rem';
      }
    }

    // Stats and progress indicators
    if (learnCurrentQuestion) learnCurrentQuestion.textContent = (learnCurrentIndex + 1);
    if (learnProgressBar) {
      const pct = Math.round((learnCurrentIndex / learnQuestionsList.length) * 100);
      learnProgressBar.style.width = pct + '%';
    }
    if (learnAccuracy) {
      const acc = learnCurrentIndex === 0 
        ? 100 
        : Math.round((learnCorrectAnswersCount / learnCurrentIndex) * 100);
      learnAccuracy.textContent = acc;
    }

    // Generate distractors
    const otherOptions = personalDictionary.filter(w => w.translation !== targetObj.translation);
    const shuffledOthers = shuffleFisherYates([...otherOptions]);
    const distractors = shuffledOthers.slice(0, 3).map(w => w.translation);

    // Combine and shuffle correct + distractors
    const choices = [targetObj.translation, ...distractors];
    shuffleFisherYates(choices);

    // Render choice buttons inside grid
    if (learnChoicesGrid) {
      learnChoicesGrid.innerHTML = '';
      choices.forEach(choiceText => {
        const btn = document.createElement('button');
        btn.className = 'learn-choice-btn';
        btn.textContent = choiceText;
        btn.addEventListener('click', () => handleLearnChoiceClick(btn, choiceText, targetObj.translation));
        learnChoicesGrid.appendChild(btn);
      });
    }
  }

  function handleLearnChoiceClick(btnEl, chosenText, correctText) {
    if (learnIsProcessingAnswer) return;
    learnIsProcessingAnswer = true;

    const isCorrect = (chosenText === correctText);
    let nextDelay = 1000;

    if (isCorrect) {
      btnEl.classList.add('correct');
      learnCorrectAnswersCount++;
    } else {
      btnEl.classList.add('incorrect', 'shake-anim');
      nextDelay = 2000;

      // Force highlight correct option in green
      if (learnChoicesGrid) {
        const buttons = learnChoicesGrid.querySelectorAll('.learn-choice-btn');
        buttons.forEach(b => {
          if (b.textContent === correctText) {
            b.classList.add('correct');
          }
        });
      }

      // Reset Leitner progress on mistake in Learn Mode
      const targetObj = learnQuestionsList[learnCurrentIndex];
      if (targetObj) {
        const pIdx = personalDictionary.findIndex(w => w.word.toLowerCase() === targetObj.word.toLowerCase());
        if (pIdx !== -1) {
          personalDictionary[pIdx].level = 0;
          personalDictionary[pIdx].interval = 0;
          personalDictionary[pIdx].nextReview = Date.now();
          saveDictionaryToStorage();
        }
      }
    }

    // Update progress bar to final 100% on the last question during feedback
    if (learnCurrentIndex === learnQuestionsList.length - 1 && learnProgressBar) {
      learnProgressBar.style.width = '100%';
    }

    // Update real-time accuracy stat after the answer
    if (learnAccuracy) {
      const acc = Math.round((learnCorrectAnswersCount / (learnCurrentIndex + 1)) * 100);
      learnAccuracy.textContent = acc;
    }

    setTimeout(() => {
      learnCurrentIndex++;
      learnIsProcessingAnswer = false;
      loadLearnQuestion();
    }, nextDelay);
  }

  function stopLearnGame() {
    if (dictStandardView) dictStandardView.style.display = 'flex';
    if (dictLearnView) dictLearnView.style.display = 'none';
    learnQuestionsList = [];
    learnCurrentIndex = 0;
    learnIsProcessingAnswer = false;
  }

  if (startLearnBtn) {
    startLearnBtn.addEventListener('click', startLearnGame);
  }
  if (exitLearnBtn) {
    exitLearnBtn.addEventListener('click', stopLearnGame);
  }
  if (closeLearnResultsBtn) {
    closeLearnResultsBtn.addEventListener('click', stopLearnGame);
  }

  // AI Roleplay (Conversation Simulator)
  let roleplayPhrase = '';
  let roleplayMessages = [];
  let roleplayTurnCount = 0;

  const roleplayModal = document.getElementById('roleplayModal');
  const closeRoleplayModalBtn = document.getElementById('closeRoleplayModalBtn');
  const roleplayTargetWord = document.getElementById('roleplayTargetWord');
  const roleplayChatBody = document.getElementById('roleplayChatBody');
  const roleplayChatInput = document.getElementById('roleplayChatInput');
  const sendRoleplayMsgBtn = document.getElementById('sendRoleplayMsgBtn');
  const roleplayFinishContainer = document.getElementById('roleplayFinishContainer');
  const finishRoleplayBtn = document.getElementById('finishRoleplayBtn');

  async function fetchAIChatResponse(messages) {
    requireAPIKey();
    const currentApiKey = getAPIKey();

    if (currentApiKey.startsWith('sk-or-')) {
      const url = 'https://openrouter.ai/api/v1/chat/completions';
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:63079",
          "X-Title": "AI Lyric Trainer"
        },
        body: JSON.stringify({
          model: "z-ai/glm-4.5-air:free",
          messages: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter returned status ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content;
    } else {
      // Default Google Gemini 2.0 Flash API
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentApiKey}`;
      const requestBody = {
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
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
      return data.candidates?.[0]?.content?.parts?.[0]?.text;
    }
  }

  function startRoleplay(word) {
    roleplayPhrase = word;
    roleplayMessages = [];
    roleplayTurnCount = 0;

    if (roleplayTargetWord) roleplayTargetWord.textContent = word;
    if (roleplayChatBody) roleplayChatBody.innerHTML = '';
    if (roleplayChatInput) roleplayChatInput.value = '';
    if (roleplayFinishContainer) roleplayFinishContainer.style.display = 'none';

    if (roleplayModal) openModalEl(roleplayModal);

    const systemPrompt = `You are a helpful English teacher and roleplay companion.
We are practicing the target English phrase/word: "${word}".
Please start a realistic situational roleplay/conversation in English where this phrase would be naturally used.
Rule 1: Keep your responses short and natural (1-2 sentences).
Rule 2: Speak entirely in English.
Rule 3: Gently correct any grammar or spelling mistakes the user makes, and then continue the conversation.
Rule 4: Always keep the conversation interactive, ending with a question or prompt that encourages me to reply.
Start the conversation now by introducing the scenario and giving the first greeting.`;

    appendRoleplayTypingIndicator();
    fetchAIChatResponse([{ role: 'user', content: systemPrompt }])
      .then(reply => {
        removeRoleplayTypingIndicator();
        if (!reply) throw new Error("empty reply");
        roleplayMessages.push({ role: 'assistant', content: reply });
        appendRoleplayMessageBubble(reply, 'ai');
      })
      .catch(err => {
        removeRoleplayTypingIndicator();
        appendRoleplayMessageBubble('Error соединения с ИИ: ' + err.message, 'ai');
      });
  }

  function handleSendRoleplayMessage() {
    if (!roleplayChatInput) return;
    const userText = roleplayChatInput.value.trim();
    if (!userText) return;

    roleplayChatInput.value = '';
    roleplayMessages.push({ role: 'user', content: userText });
    appendRoleplayMessageBubble(userText, 'user');
    
    roleplayTurnCount++;

    const systemPrompt = `You are a helpful English teacher and roleplay companion.
We are practicing the target English phrase/word: "${roleplayPhrase}".
Please continue the situational roleplay/conversation in English where this phrase would be naturally used.
Rule 1: Keep your responses short and natural (1-2 sentences).
Rule 2: Speak entirely in English.
Rule 3: Gently correct any grammar or spelling mistakes the user makes, and then continue the conversation.
Rule 4: Always keep the conversation interactive, ending with a question or prompt that encourages me to reply.`;

    appendRoleplayTypingIndicator();
    
    const apiMessages = [
      { role: 'user', content: systemPrompt },
      ...roleplayMessages
    ];

    fetchAIChatResponse(apiMessages)
      .then(reply => {
        removeRoleplayTypingIndicator();
        if (!reply) throw new Error("empty reply");
        roleplayMessages.push({ role: 'assistant', content: reply });
        appendRoleplayMessageBubble(reply, 'ai');

        if (roleplayTurnCount >= 3) {
          if (roleplayFinishContainer) roleplayFinishContainer.style.display = 'flex';
        }
      })
      .catch(err => {
        removeRoleplayTypingIndicator();
        appendRoleplayMessageBubble('Error соединения с ИИ: ' + err.message, 'ai');
      });
  }

  function appendRoleplayMessageBubble(text, sender) {
    if (!roleplayChatBody) return;

    const bubble = document.createElement('div');
    bubble.className = `roleplay-bubble ${sender}`;
    bubble.textContent = text;
    bubble.style.whiteSpace = 'pre-wrap';

    roleplayChatBody.appendChild(bubble);
    roleplayChatBody.scrollTop = roleplayChatBody.scrollHeight;
  }

  function appendRoleplayTypingIndicator() {
    if (!roleplayChatBody) return;
    removeRoleplayTypingIndicator();

    const bubble = document.createElement('div');
    bubble.className = 'roleplay-bubble ai loading';
    bubble.id = 'roleplayTypingIndicator';
    bubble.innerHTML = `
      <span class="roleplay-dot"></span>
      <span class="roleplay-dot"></span>
      <span class="roleplay-dot"></span>
    `;
    roleplayChatBody.appendChild(bubble);
    roleplayChatBody.scrollTop = roleplayChatBody.scrollHeight;
  }

  function removeRoleplayTypingIndicator() {
    const ind = document.getElementById('roleplayTypingIndicator');
    if (ind) ind.remove();
  }

  // Setup events
  if (closeRoleplayModalBtn) {
    closeRoleplayModalBtn.addEventListener('click', () => {
      if (roleplayModal) closeModalEl(roleplayModal);
    });
  }
  if (sendRoleplayMsgBtn) {
    sendRoleplayMsgBtn.addEventListener('click', handleSendRoleplayMessage);
  }
  if (roleplayChatInput) {
    roleplayChatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSendRoleplayMessage();
      }
    });
  }
  if (finishRoleplayBtn) {
    finishRoleplayBtn.addEventListener('click', () => {
      if (roleplayModal) closeModalEl(roleplayModal);
      recordActivity(15);
      alert('Практика успешно завершена! Вам начислено +15 очков активности.');
    });
  }

  window.startRoleplay = startRoleplay;
}

function setTrainerCardWord(word) {
  const wordEl = document.getElementById('cardWord');
  if (!wordEl) return;
  
  wordEl.textContent = word;
  
  const parentContainer = document.getElementById('cardWordContainer');
  if (!parentContainer) return;
  
  const textLen = word ? word.length : 0;
  if (textLen > 80) {
    parentContainer.style.fontSize = '0.8rem';
    parentContainer.style.lineHeight = '1.3';
  } else if (textLen > 50) {
    parentContainer.style.fontSize = '0.92rem';
    parentContainer.style.lineHeight = '1.3';
  } else if (textLen > 30) {
    parentContainer.style.fontSize = '1.05rem';
    parentContainer.style.lineHeight = '1.3';
  } else if (textLen > 18) {
    parentContainer.style.fontSize = '1.25rem';
    parentContainer.style.lineHeight = '1.3';
  } else {
    parentContainer.style.fontSize = '1.85rem';
    parentContainer.style.lineHeight = '1.2';
  }
}

function setTrainerCardBackText(text) {
  const transEl = document.getElementById('cardTranslation');
  if (!transEl) return;
  transEl.textContent = text;
  const textLen = text ? text.length : 0;
  if (textLen > 80) {
    transEl.style.fontSize = '0.8rem';
    transEl.style.lineHeight = '1.3';
  } else if (textLen > 50) {
    transEl.style.fontSize = '0.92rem';
    transEl.style.lineHeight = '1.3';
  } else if (textLen > 30) {
    transEl.style.fontSize = '1.05rem';
    transEl.style.lineHeight = '1.3';
  } else if (textLen > 18) {
    transEl.style.fontSize = '1.2rem';
    transEl.style.lineHeight = '1.3';
  } else {
    transEl.style.fontSize = '1.35rem';
    transEl.style.lineHeight = '1.2';
  }
}

// Fisher-Yates Shuffle Algorithm for randomizing training session cards
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Initialize and build a Quizlet-style vocabulary study session
function startStudySession() {
  const filteredWords = getFilteredDictionaryWords();
  
  if (filteredWords.length === 0) {
    sessionQueue = [];
    sessionTotalInitialCount = 0;
    sessionLearnedCount = 0;
    sessionLearnedWordsList = [];
    clearStudySession();
    return;
  }

  // Check if we have an ongoing, saved session!
  const savedQueueStr = localStorage.getItem('galaxy_study_session_queue');
  if (savedQueueStr) {
    try {
      const parsedQueue = JSON.parse(savedQueueStr);
      if (Array.isArray(parsedQueue) && parsedQueue.length > 0) {
        // Yes! We have an ongoing session. Let's restore it.
        sessionQueue = parsedQueue;
        sessionTotalInitialCount = parseInt(localStorage.getItem('galaxy_study_session_total') || parsedQueue.length, 10);
        sessionLearnedCount = parseInt(localStorage.getItem('galaxy_study_session_learned') || '0', 10);
        
        const savedListStr = localStorage.getItem('galaxy_study_session_learned_list');
        sessionLearnedWordsList = savedListStr ? JSON.parse(savedListStr) : [];
        
        // Hide the success view if active
        const successView = document.getElementById('sessionSuccessView');
        if (successView) successView.style.display = 'none';

        // Update session progress UI initially
        updateSessionProgressUI();
        return;
      }
    } catch (e) {
      console.error("Failed to restore saved study session", e);
    }
  }

  // Filter words that are due for review (nextReview <= now)
  const now = Date.now();
  let pool = [];

  const forceAllCheckbox = document.getElementById('trainingForceAllCheckbox');
  const isForceAll = forceAllCheckbox ? forceAllCheckbox.checked : false;

  if (isForceAll) {
    pool = [...filteredWords];
  } else {
    let dueWords = filteredWords.filter(w => !w.nextReview || w.nextReview <= now);
    let newWords = filteredWords.filter(w => !w.level || w.level === 0);
    pool = [...dueWords];
  }
  
  // Determine training session word limit (20, 40, or all)
  let limit = 20;
  const limitSelect = document.getElementById('trainingLimitSelect');
  if (limitSelect) {
    const val = limitSelect.value;
    if (val === 'all') {
      limit = filteredWords.length;
    } else {
      limit = parseInt(val, 10) || 20;
    }
  } else {
    const savedLimit = localStorage.getItem('galaxy_training_limit');
    if (savedLimit === 'all') {
      limit = filteredWords.length;
    } else {
      limit = parseInt(savedLimit || '20', 10) || 20;
    }
  }
  
  // Supplement with new words if pool is below limit (only if not forcing all)
  if (!isForceAll && pool.length < limit) {
    // newWords is only defined if not isForceAll, wait, I need to define newWords in a wider scope or check isForceAll
    let newWords = filteredWords.filter(w => !w.level || w.level === 0);
    newWords.forEach(w => {
      if (!pool.some(item => item.word.toLowerCase() === w.word.toLowerCase())) {
        pool.push(w);
      }
    });
  }
  
  // Enforce strict Leitner spaced repetition: do NOT supplement the training pool with already learned, non-due words!
  // If the pool of due/new words is smaller than the limit, the session size will simply be smaller.

  // Max cap of words per session based on selected limit
  pool = pool.slice(0, limit);

  // If pool is empty, all words have been reviewed and none are due yet — show "all reviewed" state
  if (pool.length === 0) {
    sessionQueue = [];
    sessionTotalInitialCount = 0;
    sessionLearnedCount = 0;
    sessionLearnedWordsList = [];
    clearStudySession();

    // Find the nearest upcoming review date across all filtered words
    const futureReviews = filteredWords
      .filter(w => w.nextReview && w.nextReview > now)
      .map(w => w.nextReview);
    const nearestReview = futureReviews.length > 0 ? Math.min(...futureReviews) : null;

    let nextReviewText = '';
    if (nearestReview) {
      const diffMs = nearestReview - now;
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffHours < 1) {
        nextReviewText = 'Ближайший повтор: менее чем через час';
      } else if (diffHours < 24) {
        nextReviewText = `Ближайший повтор: через ${diffHours} ч.`;
      } else {
        nextReviewText = `Ближайший повтор: через ${diffDays} ${getStreakWordForm(diffDays)}`;
      }
    }

    // Show the empty state with "all reviewed" message
    const flashcard = document.getElementById('dictFlashcard');
    const controls = document.getElementById('cardControls');
    const emptyState = document.getElementById('dictEmptyState');
    const successView = document.getElementById('sessionSuccessView');
    const progressContainer = document.getElementById('sessionProgressContainer');

    if (flashcard) flashcard.style.display = 'none';
    if (controls) controls.style.display = 'none';
    if (successView) successView.style.display = 'none';
    if (progressContainer) progressContainer.style.display = 'none';

    if (emptyState) {
      emptyState.style.display = 'flex';
      const emptyTitle = document.getElementById('emptyStateTitle');
      const emptyText = document.getElementById('emptyStateText');
      if (emptyTitle) emptyTitle.textContent = 'Все слова повторены! ✅';
      if (emptyText) {
        emptyText.innerHTML = `
          На сегодня новых слов для повторения нет — вы молодец! 🎉<br>
          ${nextReviewText ? `<span style="display:inline-block;margin-top:8px;padding:6px 14px;background:rgba(29,185,84,0.1);border:1px solid rgba(255, 255, 255, 0.12);border-radius:12px;font-weight:600;color:#1db954;">📅 ${nextReviewText}</span>` : ''}
        `;
      }
    }
    return;
  }

  // Randomize words order if Shuffle mode is enabled
  const orderSelect = document.getElementById('trainingOrderSelect');
  const isShuffle = orderSelect ? orderSelect.value === 'shuffle' : true;
  if (isShuffle) {
    shuffleArray(pool);
  }

  // Set active session queue state
  sessionQueue = pool;
  sessionHistory = [];
  sessionTotalInitialCount = pool.length;
  sessionLearnedCount = 0;
  sessionLearnedWordsList = [];

  updateUndoButtonVisibility();
  saveStudySession();

  // Hide the success view if active
  const successView = document.getElementById('sessionSuccessView');
  if (successView) successView.style.display = 'none';

  // Update session progress UI initially
  updateSessionProgressUI();
}

// Update the visual status indicators and progress bar
function updateSessionProgressUI() {
  const container = document.getElementById('sessionProgressContainer');
  const countRemainingEl = document.getElementById('sessionCountRemaining');
  const countLearnedEl = document.getElementById('sessionCountLearned');
  const progressTextEl = document.getElementById('sessionProgressCounterText');
  const progressFillEl = document.getElementById('sessionProgressBarFill');

  if (sessionTotalInitialCount > 0 && sessionQueue.length > 0) {
    if (container) container.style.display = 'flex';
    if (countRemainingEl) countRemainingEl.textContent = sessionQueue.length;
    if (countLearnedEl) countLearnedEl.textContent = sessionLearnedCount;
    if (progressTextEl) {
      progressTextEl.textContent = `${sessionLearnedCount + 1} / ${sessionTotalInitialCount}`;
    }
    if (progressFillEl) {
      const percentage = (sessionLearnedCount / sessionTotalInitialCount) * 100;
      progressFillEl.style.width = `${percentage}%`;
    }
  } else {
    if (container) container.style.display = 'none';
  }
}

// Dynamic CSS Confetti particle pop builder
function triggerConfettiCelebration() {
  const container = document.getElementById('successConfettiContainer');
  if (!container) return;
  container.innerHTML = '';

  const colors = ['#1db954', '#1ed760', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#a78bfa'];
  const particleCount = 60;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';
    
    // Random placement, color, shape, and drift variables
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomLeft = Math.random() * 100; // in %
    const randomDriftX = (Math.random() * 80) - 40; // drift between -40px and 40px
    const randomDriftEndX = randomDriftX + (Math.random() * 60) - 30; // further drift
    const randomDelay = Math.random() * 0.5; // up to 0.5s delay
    const isCircle = Math.random() > 0.5;

    particle.style.backgroundColor = randomColor;
    particle.style.left = `${randomLeft}%`;
    particle.style.setProperty('--drift-x', `${randomDriftX}px`);
    particle.style.setProperty('--drift-end-x', `${randomDriftEndX}px`);
    particle.style.animationDelay = `${randomDelay}s`;
    
    if (isCircle) {
      particle.style.borderRadius = '50%';
    } else {
      particle.style.borderRadius = '2px';
    }

    container.appendChild(particle);
  }
}

// Reset/Orchestrate the Spaced Repetition flashcard trainer state
function resetFlashcard() {
  const flashcard = document.getElementById('dictFlashcard');
  const emptyState = document.getElementById('dictEmptyState');
  const controls = document.getElementById('cardControls');
  const flashcardInner = document.getElementById('flashcardInner');
  const pills = document.getElementById('spacedRepetitionPills');
  const successView = document.getElementById('sessionSuccessView');

  // Reset card styles and properties
  if (flashcardInner) {
    flashcardInner.classList.remove('is-flipped');
    flashcardInner.style.transform = '';
  }

  // Ensure Spaced Repetition control buttons are hidden initially
  if (pills) {
    pills.style.visibility = 'hidden';
    pills.style.opacity = '0';
  }

  // Safely grab filtered dictionary words
  const filteredWords = getFilteredDictionaryWords();

  if (filteredWords.length === 0) {
    // Show descriptive empty state
    if (flashcard) flashcard.style.display = 'none';
    if (controls) controls.style.display = 'none';
    if (successView) successView.style.display = 'none';
    
    const progressContainer = document.getElementById('sessionProgressContainer');
    if (progressContainer) progressContainer.style.display = 'none';

    if (emptyState) {
      emptyState.style.display = 'flex';
      const emptyTitle = document.getElementById('emptyStateTitle');
      const emptyText = document.getElementById('emptyStateText');
      if (emptyTitle) emptyTitle.textContent = "Dictionary пуст 📂";
      if (emptyText) {
        emptyText.innerHTML = `
          Добавьте слова из песен во время прослушивания или просмотра субтитров, чтобы начать интервальные тренировки Leitner!
        `;
      }
    }
    return;
  }

  // Show normal trainer layout
  if (emptyState) emptyState.style.display = 'none';
  if (successView) successView.style.display = 'none';

  // Load next word
  showRandomFlashcard();
}

// Show the active session card
function showRandomFlashcard() {
  const flashcardInner = document.getElementById('flashcardInner');
  if (!flashcardInner) return;

  const flashcard = document.getElementById('dictFlashcard');
  const emptyState = document.getElementById('dictEmptyState');
  const controls = document.getElementById('cardControls');
  const successView = document.getElementById('sessionSuccessView');
  const progressContainer = document.getElementById('sessionProgressContainer');

  const filteredWords = getFilteredDictionaryWords();
  if (filteredWords.length === 0) {
    resetFlashcard();
    return;
  }

  // Check if active session queue is empty
  if (sessionQueue.length === 0) {
    clearStudySession();
    // Session completed successfully! Show celebration view
    if (flashcard) flashcard.style.display = 'none';
    if (controls) controls.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (progressContainer) progressContainer.style.display = 'none';
    
    // Update and show success celebration view
    if (successView) {
      successView.style.display = 'flex';
      
      // Populate word summary
      const summaryListEl = document.getElementById('sessionSummaryList');
      if (summaryListEl) {
        summaryListEl.innerHTML = '';
        if (sessionLearnedWordsList.length > 0) {
          sessionLearnedWordsList.forEach(w => {
            const tag = document.createElement('span');
            tag.style.background = 'rgba(16, 185, 129, 0.12)';
            tag.style.border = '1px solid rgba(16, 185, 129, 0.25)';
            tag.style.color = '#10b981';
            tag.style.padding = '4px 10px';
            tag.style.borderRadius = '15px';
            tag.style.fontSize = '0.72rem';
            tag.style.display = 'inline-block';
            tag.textContent = w.word;
            summaryListEl.appendChild(tag);
          });
        } else {
          summaryListEl.textContent = 'No изученных слов.';
        }
      }
      
      // Trigger CSS Confetti particle pop!
      triggerConfettiCelebration();
    }
    return;
  }

  // Ensure card starts from the front face (clear flipped class and style transform)
  flashcardInner.classList.remove('is-flipped');
  flashcardInner.style.transform = '';

  // Ensure Spaced Repetition pills are hidden initially
  const pills = document.getElementById('spacedRepetitionPills');
  if (pills) {
    pills.style.visibility = 'hidden';
    pills.style.opacity = '0';
  }
  
  if (flashcard) flashcard.style.display = 'block';
  if (controls) controls.style.display = 'flex';
  if (emptyState) emptyState.style.display = 'none';
  if (successView) successView.style.display = 'none';

  // Update status bar UI
  updateSessionProgressUI();

  // Load the first word in the active queue
  const wordObj = sessionQueue[0];
  activeTrainerWordObj = wordObj;

  renderTrainerCard(wordObj);
}

function renderTrainerCard(wordObj) {
  if (!wordObj) return;

  const transEl = document.getElementById('cardTranslation');
  const contextEl = document.getElementById('cardContext');
  const frontLabelEl = document.getElementById('cardFrontLabel');
  const backLabelEl = document.getElementById('cardBackLabel');

  const speakBtn = document.getElementById('cardSpeakBtn');
  const practiceBtn = document.getElementById('cardPracticeBtn');
  const speakBtnBack = document.getElementById('cardSpeakBtnBack');
  const practiceBtnBack = document.getElementById('cardPracticeBtnBack');

  const modeSelect = document.getElementById('trainingModeSelect');
  const mode = modeSelect ? modeSelect.value : 'reverse';

  const cardWordEl = document.getElementById('cardWord');

  if (mode === 'reverse') {
    // Reverse: Russian on Front, English on Back
    setTrainerCardWord(wordObj.translation);
    if (cardWordEl) cardWordEl.classList.add('russian-font');
    setTrainerCardBackText(wordObj.word);
    if (transEl) transEl.classList.remove('russian-font');
    if (frontLabelEl) frontLabelEl.textContent = 'ПЕРЕВОД (НА РУССКОМ)';
    if (backLabelEl) backLabelEl.textContent = 'СЛОВО НА АНГЛИЙСКОМ';

    if (speakBtn) speakBtn.style.display = 'none';
    if (practiceBtn) practiceBtn.style.display = 'none';
    if (speakBtnBack) speakBtnBack.style.display = 'flex';
    if (practiceBtnBack) practiceBtnBack.style.display = 'flex';

    if (contextEl) {
      const hasDefinition = wordObj.definition && wordObj.definition.trim();
      const hasRule = wordObj.rule && wordObj.rule.trim();

      if (hasDefinition || hasRule) {
        let parts = '';
        if (hasDefinition) {
          parts += `
            <div style="margin-top: 4px; padding: 8px 12px; background: rgba(167,139,250,0.08); border-left: 2px solid rgba(167,139,250,0.5); border-radius: 0 8px 8px 0; text-align: left; box-sizing: border-box; width: 100%;">
              <div style="font-size: 0.65rem; font-weight: 700; color: #a78bfa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">💡 ${wordObj.type === 'phrase' ? 'Идиома / Значение' : 'Значение'}</div>
              <div style="font-size: 0.82rem; color: var(--text-sub); line-height: 1.45; font-style: italic;">${escapeHTML(wordObj.definition)}</div>
            </div>
          `;
        }
        if (hasRule) {
          parts += `
            <div style="margin-top: 6px; padding: 8px 12px; background: rgba(96,165,250,0.07); border-left: 2px solid rgba(96,165,250,0.5); border-radius: 0 8px 8px 0; text-align: left; box-sizing: border-box; width: 100%;">
              <div style="font-size: 0.65rem; font-weight: 700; color: #60a5fa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">📐 Правило / Грамматика</div>
              <div style="font-size: 0.82rem; color: var(--text-sub); line-height: 1.45;">${escapeHTML(wordObj.rule)}</div>
            </div>
          `;
        }
        contextEl.innerHTML = parts;
      } else {
        const examples = findSongExamples(wordObj.word);
        const examplesHTML = formatSongExamplesHTML(wordObj.word, examples);
        contextEl.innerHTML = `
          <div style="margin-bottom: 8px; font-weight: 500;">${wordObj.context || ''}</div>
          ${examplesHTML}
        `;
      }
    }
  } else if (mode === 'def_to_en') {
    // Definition on Front, English on Back
    const frontText = (wordObj.definition && wordObj.definition.trim()) || (wordObj.context ? 'Контекст: ' + wordObj.context : wordObj.translation);
    setTrainerCardWord(frontText);
    if (cardWordEl) cardWordEl.classList.add('russian-font');
    setTrainerCardBackText(wordObj.word);
    if (transEl) transEl.classList.remove('russian-font');
    if (frontLabelEl) frontLabelEl.textContent = 'ЗНАЧЕНИЕ / ТОЛКОВАНИЕ';
    if (backLabelEl) backLabelEl.textContent = 'СЛОВО НА АНГЛИЙСКОМ';

    if (speakBtn) speakBtn.style.display = 'none';
    if (practiceBtn) practiceBtn.style.display = 'none';
    if (speakBtnBack) speakBtnBack.style.display = 'flex';
    if (practiceBtnBack) practiceBtnBack.style.display = 'flex';

    if (contextEl) {
      let parts = `<div style="margin-bottom: 8px; font-weight: 700; color: var(--accent-spotify); font-size: 0.95rem;">🇷🇺 Перевод: ${escapeHTML(wordObj.translation)}</div>`;
      const hasRule = wordObj.rule && wordObj.rule.trim();

      if (hasRule) {
        parts += `
          <div style="margin-top: 6px; padding: 8px 12px; background: rgba(96,165,250,0.07); border-left: 2px solid rgba(96,165,250,0.5); border-radius: 0 8px 8px 0; text-align: left; box-sizing: border-box; width: 100%;">
            <div style="font-size: 0.65rem; font-weight: 700; color: #60a5fa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">📐 Правило / Грамматика</div>
            <div style="font-size: 0.82rem; color: var(--text-sub); line-height: 1.45;">${escapeHTML(wordObj.rule)}</div>
          </div>
        `;
      } else {
        const examples = findSongExamples(wordObj.word);
        const examplesHTML = formatSongExamplesHTML(wordObj.word, examples);
        parts += `
          <div style="margin-bottom: 8px; font-weight: 500;">${wordObj.context || ''}</div>
          ${examplesHTML}
        `;
      }
      contextEl.innerHTML = parts;
    }
  } else if (mode === 'en_to_def') {
    // English on Front, Definition on Back
    setTrainerCardWord(wordObj.word);
    if (cardWordEl) cardWordEl.classList.remove('russian-font');
    const backText = (wordObj.definition && wordObj.definition.trim()) || (wordObj.context ? 'Контекст: ' + wordObj.context : wordObj.translation);
    setTrainerCardBackText(backText);
    if (transEl) transEl.classList.add('russian-font');
    if (frontLabelEl) frontLabelEl.textContent = 'СЛОВО НА АНГЛИЙСКОМ';
    if (backLabelEl) backLabelEl.textContent = 'ЗНАЧЕНИЕ / ТОЛКОВАНИЕ';

    if (speakBtn) speakBtn.style.display = 'flex';
    if (practiceBtn) practiceBtn.style.display = 'flex';
    if (speakBtnBack) speakBtnBack.style.display = 'none';
    if (practiceBtnBack) practiceBtnBack.style.display = 'none';

    if (contextEl) {
      let parts = `<div style="margin-bottom: 8px; font-weight: 700; color: var(--accent-spotify); font-size: 0.95rem;">🇷🇺 Перевод: ${escapeHTML(wordObj.translation)}</div>`;
      const hasRule = wordObj.rule && wordObj.rule.trim();

      if (hasRule) {
        parts += `
          <div style="margin-top: 6px; padding: 8px 12px; background: rgba(96,165,250,0.07); border-left: 2px solid rgba(96,165,250,0.5); border-radius: 0 8px 8px 0; text-align: left; box-sizing: border-box; width: 100%;">
            <div style="font-size: 0.65rem; font-weight: 700; color: #60a5fa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">📐 Правило / Грамматика</div>
            <div style="font-size: 0.82rem; color: var(--text-sub); line-height: 1.45;">${escapeHTML(wordObj.rule)}</div>
          </div>
        `;
      } else {
        const examples = findSongExamples(wordObj.word);
        const examplesHTML = formatSongExamplesHTML(wordObj.word, examples);
        parts += `
          <div style="margin-bottom: 8px; font-weight: 500;">${wordObj.context || ''}</div>
          ${examplesHTML}
        `;
      }
      contextEl.innerHTML = parts;
    }
  } else {
    // Direct: English on Front, Russian on Back
    setTrainerCardWord(wordObj.word);
    if (cardWordEl) cardWordEl.classList.remove('russian-font');
    setTrainerCardBackText(wordObj.translation);
    if (transEl) transEl.classList.add('russian-font');
    if (frontLabelEl) frontLabelEl.textContent = 'СЛОВО НА АНГЛИЙСКОМ';
    if (backLabelEl) backLabelEl.textContent = 'ПЕРЕВОД';

    if (speakBtn) speakBtn.style.display = 'flex';
    if (practiceBtn) practiceBtn.style.display = 'flex';
    if (speakBtnBack) speakBtnBack.style.display = 'none';
    if (practiceBtnBack) practiceBtnBack.style.display = 'none';

    if (contextEl) {
      const hasDefinition = wordObj.definition && wordObj.definition.trim();
      const hasRule = wordObj.rule && wordObj.rule.trim();

      if (hasDefinition || hasRule) {
        let parts = '';
        if (hasDefinition) {
          parts += `
            <div style="margin-top: 4px; padding: 8px 12px; background: rgba(167,139,250,0.08); border-left: 2px solid rgba(167,139,250,0.5); border-radius: 0 8px 8px 0; text-align: left; box-sizing: border-box; width: 100%;">
              <div style="font-size: 0.65rem; font-weight: 700; color: #a78bfa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">💡 ${wordObj.type === 'phrase' ? 'Идиома / Значение' : 'Значение'}</div>
              <div style="font-size: 0.82rem; color: var(--text-sub); line-height: 1.45; font-style: italic;">${escapeHTML(wordObj.definition)}</div>
            </div>
          `;
        }
        if (hasRule) {
          parts += `
            <div style="margin-top: 6px; padding: 8px 12px; background: rgba(96,165,250,0.07); border-left: 2px solid rgba(96,165,250,0.5); border-radius: 0 8px 8px 0; text-align: left; box-sizing: border-box; width: 100%;">
              <div style="font-size: 0.65rem; font-weight: 700; color: #60a5fa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">📐 Правило / Грамматика</div>
              <div style="font-size: 0.82rem; color: var(--text-sub); line-height: 1.45;">${escapeHTML(wordObj.rule)}</div>
            </div>
          `;
        }
        contextEl.innerHTML = parts;
      } else {
        const examples = findSongExamples(wordObj.word);
        const examplesHTML = formatSongExamplesHTML(wordObj.word, examples);
        contextEl.innerHTML = `
          <div style="margin-bottom: 8px; font-weight: 500;">${wordObj.context || ''}</div>
          ${examplesHTML}
        `;
      }
    }
  }
}

// Search through all loaded songs — up to 3 examples from 3 different songs when possible
// findSongExamples() + formatSongExamplesHTML() → moved to dict-song-examples.js

// Render the list of dictionary words in left side panel
function renderDictWordsList(filterQuery = "") {
  const listEl = document.getElementById('dictWordsList');
  if (!listEl) return;

  listEl.innerHTML = '';
  
  // Filter by category first
  let categoryWords = getFilteredDictionaryWords();

  // Apply type filter (words/phrases/all)
  if (dictTypeFilter === 'words') {
    categoryWords = categoryWords.filter(w => w.type !== 'phrase');
  } else if (dictTypeFilter === 'phrases') {
    categoryWords = categoryWords.filter(w => w.type === 'phrase');
  }
  // 'all' shows everything

  // Apply text search filter
  const filtered = categoryWords.filter(w => {
    const q = filterQuery.toLowerCase();
    return w.word.toLowerCase().includes(q) || w.translation.toLowerCase().includes(q);
  });

  // Apply sorting
  const sorted = applySortToDictWords(filtered);

  if (sorted.length === 0) {
    listEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1.5rem 0;">Слова не найдены</div>`;
    return;
  }

  // Create a single DocumentFragment to prevent multiple reflows
  const fragment = document.createDocumentFragment();

  sorted.forEach(w => {
    const wordRow = document.createElement('div');
    wordRow.className = 'dict-word-row';
    wordRow.style.cssText = "display: flex; flex-direction: column; align-items: stretch; flex-shrink: 0; padding: 10px 14px; cursor: pointer; box-sizing: border-box; margin-bottom: 4px;";
    
    // Add small tag showing active interval
    const intervalDays = w.interval || 0;
    const intervalBadge = intervalDays > 0 ? `<span style="font-size: 0.65rem; font-weight: 600; padding: 2px 6px; background: rgba(255,255,255,0.06); color: #a1a1aa; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; margin-left: 6px;">${intervalDays}d</span>` : '';

    // Build multi-category badges
    const wordCats = (w.categories && Array.isArray(w.categories) && w.categories.length > 0)
      ? w.categories : [w.category || 'Общее'];
    const catBadges = wordCats.map(c =>
      `<span class="dict-cat-badge" style="font-size: 0.65rem; color: var(--text-muted); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); padding: 1px 6px; border-radius: 6px; display: inline-flex; align-items: center; gap: 3px;">${escapeHTML(c)}</span>`
    ).join('');

    // Safely escape word and translation to prevent XSS vulnerabilities
    const headerHTML = `
      <div class="word-row-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div style="text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">
          <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-main); display: flex; align-items: center;">${escapeHTML(w.word)} ${intervalBadge}</div>
          <div style="font-size: 0.8rem; color: #a1a1aa; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span>${escapeHTML(w.translation)}</span>
            ${catBadges}
            ${(() => {
              const customCats = (w.customCategories && Array.isArray(w.customCategories) && w.customCategories.length > 0)
                ? w.customCategories : [w.customCategory || 'Без категории'];
              return customCats.filter(c => c !== 'Без категории').map(c =>
                `<span style="font-size: 0.65rem; color: #a1a1aa; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); padding: 1px 6px; border-radius: 6px; display: inline-flex; align-items: center; gap: 3px;">${escapeHTML(c)}</span>`
              ).join('');
            })()}
          </div>
        </div>
        <button class="speak-btn" style="padding: 6px; opacity: 0.6; transition: opacity 0.2s; background: none; border: none; color: var(--text-main); cursor: pointer;" title="Прослушать">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        </button>
      </div>
      ${w.definition ? `
      <div class="word-definition-block" style="font-size: 0.76rem; color: var(--text-sub); margin-top: 6px; font-style: italic; border-left: 2px solid rgba(255, 255, 255, 0.15); padding-left: 8px; white-space: normal; text-align: left; line-height: 1.3;">
        ${escapeHTML(w.definition)}
      </div>
      ` : ''}
      ${w.rule ? `
      <div class="word-rule-block" style="font-size: 0.74rem; color: var(--text-muted); margin-top: 5px; border-left: 2px solid rgba(255, 255, 255, 0.15); padding-left: 8px; white-space: normal; text-align: left; line-height: 1.3; display: flex; align-items: flex-start; gap: 4px;">
        <span style="opacity:0.7; flex-shrink:0;">📐</span><span>${escapeHTML(w.rule)}</span>
      </div>
      ` : ''}
    `;
    wordRow.innerHTML = headerHTML;

    // Speak button
    const speakBtn = wordRow.querySelector('.speak-btn');
    if (speakBtn) {
      speakBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speakText(w.word);
      });
    }

    // Hover effect (only if not expanded)
    let isExpanded = false;
    let detailEl = null;

    // Hover handled by CSS :hover selector

    // Click handler for expand/collapse and sync with trainer card
    wordRow.addEventListener('click', () => {
      if (isExpanded) {
        // Collapse
        if (detailEl) detailEl.remove();
        isExpanded = false;
        wordRow.isExpanded = false;
        wordRow.classList.remove('expanded');
        return;
      }

      // Collapse all other expanded rows first
      const allRows = listEl.querySelectorAll('.dict-word-row');
      allRows.forEach(row => {
        if (row !== wordRow && row.isExpanded) {
          row.click(); // Trigger collapse
        }
      });

      // Expand this one
      isExpanded = true;
      wordRow.isExpanded = true; // Mark custom state on DOM element
      wordRow.classList.add('expanded');

      // Create detail container
      detailEl = document.createElement('div');
      detailEl.className = 'word-row-detail';
      detailEl.style.cssText = "width: 100%; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 8px; box-sizing: border-box;";

      // Locate song examples and format
      const examples = findSongExamples(w.word);
      const examplesHTML = formatSongExamplesHTML(w.word, examples);

      // Safe HTML construction to protect against XSS
      detailEl.innerHTML = `
        <div style="font-size: 0.75rem; color: var(--text-sub); line-height: 1.4; text-align: left;">
          <strong>Контекст:</strong> ${escapeHTML(w.context || 'контекст не указан')}
        </div>
        ${examplesHTML}
        <div class="word-actions-grid">
          <button class="row-copy-btn" style="background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.25); color: #60a5fa;" title="Копировать слово в буфер обмена">📋 Копировать</button>
          <button class="row-edit-btn" style="background: rgba(167, 139, 250, 0.12); border: 1px solid rgba(167, 139, 250, 0.25); color: #a78bfa;">✏️ Править</button>
          <button class="row-practice-btn" style="background: rgba(29, 185, 84, 0.12); border: 1px solid rgba(29, 185, 84, 0.25); color: var(--accent-spotify);">💬 Практика</button>
          <button class="row-reset-btn" style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.25); color: #f59e0b;" title="Сбросить прогресс заучивания">🔄 Сбросить</button>
          <button class="row-del-btn" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.25); color: #ef4444;">🗑️ Delete</button>
        </div>
      `;

      // Prevent parent click propagation when clicking inside detail panel
      detailEl.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // Copy to clipboard action button inside detail panel
      const copyBtn = detailEl.querySelector('.row-copy-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(w.word).then(() => {
            copyBtn.classList.add('success-copy');
            copyBtn.innerHTML = '✓ Скопировано!';
            setTimeout(() => {
              copyBtn.classList.remove('success-copy');
              copyBtn.innerHTML = '📋 Копировать';
            }, 1500);
          }).catch(err => {
            console.error('Failed to copy via navigator.clipboard: ', err);
            // Fallback for restricted settings or frames
            try {
              const el = document.createElement('textarea');
              el.value = w.word;
              document.body.appendChild(el);
              el.select();
              document.execCommand('copy');
              document.body.removeChild(el);
              copyBtn.classList.add('success-copy');
              copyBtn.innerHTML = '✓ Скопировано!';
              setTimeout(() => {
                copyBtn.classList.remove('success-copy');
                copyBtn.innerHTML = '📋 Копировать';
              }, 1500);
            } catch (fallbackErr) {
              alert('Не удалось скопировать слово: ' + w.word);
            }
          });
        });
      }

      // Edit button — open proper edit modal
      const editBtn = detailEl.querySelector('.row-edit-btn');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openEditWordModal(w, () => {
            const searchInput = document.getElementById('dictSearchInput');
            renderDictWordsList(searchInput ? searchInput.value.trim() : '');
          });
        });
      }
            // Practice action button inside detail panel
      const practiceBtn = detailEl.querySelector('.row-practice-btn');
      if (practiceBtn) {
        practiceBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          startRoleplay(w.word);
        });
      }

      // Reset progress action button inside detail panel
      const resetBtn = detailEl.querySelector('.row-reset-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const confirmed = window.showCustomConfirm
            ? await window.showCustomConfirm('Сброс прогресса', `Вы действительно хотите полностью обнулить прогресс заучивания для «${w.word}»?`, { isDestructive: true })
            : confirm(`Вы действительно хотите полностью обнулить прогресс заучивания для «${w.word}»?`);
          if (!confirmed) return;
          w.level = 0;
          w.interval = 0;
          w.nextReview = Date.now();
          saveDictionaryToStorage();
          const searchInput = document.getElementById('dictSearchInput');
          renderDictWordsList(searchInput ? searchInput.value.trim() : "");
          resetFlashcard();
          if (window.showToast) {
            window.showToast(`Прогресс для «${w.word}» обнулен`, 'success');
          } else {
            alert(`Прогресс заучивания для «${w.word}» успешно обнулен.`);
          }
        });
      }

      // Delete action button inside detail panel
      const delBtn = detailEl.querySelector('.row-del-btn');
      if (delBtn) {
        delBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const confirmed = window.showCustomConfirm
            ? await window.showCustomConfirm('Удаление слова', `Удалить «${w.word}» из словаря?`, { isDestructive: true })
            : confirm(`Удалить «${w.word}» из словаря?`);
          if (!confirmed) return;
          personalDictionary = personalDictionary.filter(x => x.word.toLowerCase() !== w.word.toLowerCase());
          saveDictionaryToStorage();
          const searchInput = document.getElementById('dictSearchInput');
          renderDictWordsList(searchInput ? searchInput.value.trim() : "");
          resetFlashcard();
        });
      }

      wordRow.appendChild(detailEl);
      wordRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // Synchronize hidden flashcard elements
      const transEl = document.getElementById('cardTranslation');
      const contextEl = document.getElementById('cardContext');

      setTrainerCardWord(w.word);
      const cardWordEl = document.getElementById('cardWord');
      if (cardWordEl) cardWordEl.classList.remove('russian-font');
      if (transEl) {
        transEl.textContent = w.translation;
        transEl.classList.add('russian-font');
      }
      if (contextEl) {
        contextEl.innerHTML = `
          <div style="margin-bottom: 8px; font-weight: 500;">${escapeHTML(w.context || "Контекст не указан.")}</div>
          ${examplesHTML}
        `;
      }
      
      activeTrainerWordObj = w;

      // Dynamic translation on demand for top-1000 words without a preloaded translation!
      if (w.translation.includes('нажмите для перевода') || w.translation === 'частотное слово') {
        if (transEl) transEl.textContent = 'Переводим... 🔍';
        fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(w.word)}&langpair=en|ru`)
          .then(res => res.json())
          .then(json => {
            const tr = json.responseData.translatedText;
            if (tr && tr.toLowerCase() !== w.word.toLowerCase()) {
              const RussianTr = tr.toLowerCase();
              w.translation = RussianTr;
              if (activeTrainerWordObj && activeTrainerWordObj.word === w.word) {
                if (transEl) transEl.textContent = RussianTr;
              }
              // Update label inside wordRow
              const subLabel = wordRow.querySelector('.word-row-header div').children[1];
              if (subLabel) {
                subLabel.textContent = RussianTr;
              }
              // If it exists in personalDictionary, save the translation
              const pIdx = personalDictionary.findIndex(x => x.word.toLowerCase() === w.word.toLowerCase());
              if (pIdx !== -1) {
                personalDictionary[pIdx].translation = RussianTr;
                saveDictionaryToStorage();
              }
            } else {
              if (transEl) transEl.textContent = 'Частотное слово';
            }
          })
          .catch(() => {
            if (transEl) transEl.textContent = 'Частотное слово';
          });
      }

      // Highlight active row visually
      const children = listEl.children;
      for (let i = 0; i < children.length; i++) {
        if (children[i] !== wordRow) {
          children[i].style.background = 'rgba(255,255,255,0.03)';
          children[i].style.borderColor = 'rgba(255,255,255,0.06)';
          children[i].isExpanded = false;
          const childDetail = children[i].querySelector('.word-row-detail');
          if (childDetail) childDetail.remove();
        }
      }
    });

    fragment.appendChild(wordRow);
  });

  // Perform a single reflow by appending the entire fragment to listEl
  listEl.appendChild(fragment);
}


function updateUndoButtonVisibility() {
  const undoBtn = document.getElementById('cardUndoBtn');
  if (undoBtn) {
    undoBtn.style.display = (sessionHistory && sessionHistory.length > 0) ? 'inline-block' : 'none';
  }
}

function handleUndoReview() {
  if (!sessionHistory || sessionHistory.length === 0) return;
  const lastAction = sessionHistory.pop();
  
  if (lastAction.dictItem) {
    const idx = personalDictionary.findIndex(w => w.word.toLowerCase() === lastAction.dictItem.word.toLowerCase());
    if (idx !== -1) {
      personalDictionary[idx] = lastAction.dictItem;
    }
  } else {
    const idx = personalDictionary.findIndex(w => w.word.toLowerCase() === lastAction.wordObj.word.toLowerCase());
    if (idx !== -1) {
      personalDictionary.splice(idx, 1);
    }
  }
  saveDictionaryToStorage();

  if (lastAction.rating === 'easy') {
    sessionLearnedCount = Math.max(0, sessionLearnedCount - 1);
    if (sessionLearnedWordsList.length > 0) {
      if (sessionLearnedWordsList[sessionLearnedWordsList.length - 1].word === lastAction.wordObj.word) {
        sessionLearnedWordsList.pop();
      } else {
        sessionLearnedWordsList = sessionLearnedWordsList.filter(w => w.word !== lastAction.wordObj.word);
      }
    }
  } else {
    if (sessionQueue.length > 0 && sessionQueue[sessionQueue.length - 1].word === lastAction.wordObj.word) {
      sessionQueue.pop();
    } else {
      sessionQueue = sessionQueue.filter(w => w.word !== lastAction.wordObj.word);
    }
  }

  sessionQueue.unshift(lastAction.wordObj);
  saveStudySession();
  updateUndoButtonVisibility();
  
  // Record negative points to correct the heatmap count
  recordActivity(-1);

  // Re-render
  const flashcard = document.getElementById('dictFlashcard');
  if (flashcard) {
    flashcard.classList.add('card-feedback-scale-down');
    setTimeout(() => {
      flashcard.classList.remove('card-feedback-scale-down');
      flashcard.classList.add('card-feedback-scale-up');
      resetFlashcard();
      setTimeout(() => {
        flashcard.classList.remove('card-feedback-scale-up');
      }, 200);
    }, 200);
  } else {
    resetFlashcard();
  }
}

// Spaced Repetition Scheduling Calculations (Leitner System Specs)
function handleWordReview(rating) {
  if (!activeTrainerWordObj) return;

  const word = activeTrainerWordObj.word;
  let idx = personalDictionary.findIndex(w => w.word.toLowerCase() === word.toLowerCase());
  
  let prevDictItem = null;
  if (idx !== -1) {
    prevDictItem = JSON.parse(JSON.stringify(personalDictionary[idx]));
  }

  sessionHistory.push({
    wordObj: JSON.parse(JSON.stringify(activeTrainerWordObj)),
    dictItem: prevDictItem,
    rating: rating
  });
  updateUndoButtonVisibility();

  let item;
  if (idx === -1) {
    const wordCount = activeTrainerWordObj.word.trim().split(/\s+/).filter(Boolean).length;
    const entryType = wordCount >= 3 ? 'phrase' : 'word';
    item = {
      word: activeTrainerWordObj.word,
      translation: activeTrainerWordObj.translation || 'Частотное слово',
      category: activeTrainerWordObj.category || '«Топ-300 Первых слов»',
      customCategory: 'Без категории',
      type: entryType,
      level: 0,
      interval: 0,
      nextReview: Date.now()
    };
    personalDictionary.push(item);
    idx = personalDictionary.length - 1;
  } else {
    item = personalDictionary[idx];
  }
  
  // Pre-load default level
  let currentLevel = item.level !== undefined ? item.level : 0;
  const intervals = [0, 1, 3, 7, 14, 30, 90, 180, 365];

  if (rating === 'easy') {
    // 1. Remove from active session queue and push to finished list
    const finishedWord = sessionQueue.shift();
    if (finishedWord) {
      sessionLearnedWordsList.push(finishedWord);
    }
    
    // 2. Increment learned count
    sessionLearnedCount++;

    // 3. Leitner level increment & schedule forward
    item.level = Math.min(8, currentLevel + 1);
    
    // --- GAMIFICATION XP LOGIC ---
    if (window.awardXP) {
      if (item.level === 5 && currentLevel < 5) {
        window.awardXP(50, 'mastery', document.querySelector('.dict-training-controls'));
      } else {
        window.awardXP(2, 'correct', document.querySelector('.dict-training-controls'));
      }
    }
    
    const days = intervals[item.level];
    const nextDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    nextDate.setHours(0, 0, 0, 0); // Align to midnight precision
    item.nextReview = nextDate.getTime();
    item.interval = days;
  } else {
    // 'forgot' or 'hard' -> Keep card in active study session queue (shift to back)
    // 1. Move to the back of the queue
    const missedWord = sessionQueue.shift();
    if (missedWord) {
      sessionQueue.push(missedWord);
    }

    // 2. Reset Leitner level/progress to level 0
    item.level = 0;
    item.nextReview = Date.now();
    item.interval = intervals[0];
  }

  personalDictionary[idx] = item;
  saveDictionaryToStorage();
  saveStudySession();

  // Heatmap tracking
  recordActivity();

  // Daily Tracker (Gemini Sparks)
  if (typeof window.DailyTracker !== 'undefined' && window.DailyTracker.recordFlashcardReview) {
    const isCorrect = (result === 'know' || result === 'easy');
    const xpAmt = isCorrect ? (item.level === 5 ? 50 : 2) : 0;
    window.DailyTracker.recordFlashcardReview(item, isCorrect ? 'correct' : 'forgot', xpAmt);
  }

  // Snappy visual transformation feedback via premium CSS transitions
  const flashcard = document.getElementById('dictFlashcard');
  if (flashcard) {
    flashcard.classList.add('card-feedback-scale-down');
    setTimeout(() => {
      flashcard.classList.remove('card-feedback-scale-down');
      flashcard.classList.add('card-feedback-scale-up');
      resetFlashcard();
      setTimeout(() => {
        flashcard.classList.remove('card-feedback-scale-up');
      }, 200);
    }, 200);
  } else {
    resetFlashcard();
  }
}

// Statistics functions (getLocalISODate, recordActivity, getDailyStreak, renderHeatmap, etc.) → moved to dict-stats.js

function getFilteredDictionaryWords() {
  const filterSelect = document.getElementById('dictCategoryFilter');
  const activeCategory = filterSelect ? filterSelect.value : 'Все слова';

  const customFilterSelect = document.getElementById('dictCustomCategoryFilter');
  const activeCustomCategory = customFilterSelect ? customFilterSelect.value : 'All Categories';
  
  let list = [];
  
  if (activeCategory === 'Все слова') {
    list = personalDictionary.filter(w => {
      // If the word belongs to any hidden category, filter it out
      if (w.categories && w.categories.some(c => personalHiddenCategories.includes(c))) {
        return false;
      }
      return true;
    });
  } else if (activeCategory.startsWith('«Топ-')) {
    // Essential preloaded packs handling
    let startIdx = 0;
    let endIdx = 0;
    if (activeCategory === '«Топ-300 Первых слов»') {
      startIdx = 0; endIdx = 300;
    } else if (activeCategory === '«Топ-600 Базовых слов»') {
      startIdx = 300; endIdx = 600;
    } else if (activeCategory === '«Топ-1000 Продвинутых слов»') {
      startIdx = 600; endIdx = 1000;
    }
    
    if (window.top1000Words) {
      const slice = window.top1000Words.slice(startIdx, endIdx);
      list = slice.map(word => {
        // Check if user has active Leitner progress for this word
        const existing = personalDictionary.find(w => w.word.toLowerCase() === word.toLowerCase());
        if (existing) {
          return existing;
        }
        // Return default word object with essential flag
        return {
          word: word,
          translation: (window.top1000Translations && window.top1000Translations[word]) || 'Частотное слово (нажмите для перевода)',
          category: activeCategory,
          customCategory: 'Без категории',
          level: 0,
          interval: 0,
          nextReview: Date.now(),
          isEssential: true
        };
      });
    }
  } else {
    // Multi-category support: check if word belongs to the selected folder
    list = personalDictionary.filter(w => {
      const wordCats = w.categories && Array.isArray(w.categories) && w.categories.length > 0
        ? w.categories
        : [w.category || 'Общее'];
      return wordCats.includes(activeCategory);
    });
  }

  // Filter by custom category
  if (activeCustomCategory !== 'All Categories') {
    list = list.filter(w => {
      const wordCustomCats = w.customCategories && Array.isArray(w.customCategories) && w.customCategories.length > 0
        ? w.customCategories
        : [w.customCategory || 'Без категории'];
      return wordCustomCats.includes(activeCustomCategory);
    });
  }

  // Filter by training type when in the Leitner practice session
  const trainingModal = document.getElementById('trainingModal');
  const trainingModalVisible = trainingModal && trainingModal.style.display !== 'none';
  if (trainingModalVisible) {
    const trainingTypeSelect = document.getElementById('trainingTypeSelect');
    if (trainingTypeSelect) {
      const trainingType = trainingTypeSelect.value;
      if (trainingType === 'words') {
        list = list.filter(w => {
          const isPhrase = w.type === 'phrase' || w.word.trim().includes(' ') || w.word.trim().split(/\s+/).filter(Boolean).length > 1;
          return !isPhrase;
        });
      } else if (trainingType === 'phrases') {
        list = list.filter(w => {
          const isPhrase = w.type === 'phrase' || w.word.trim().includes(' ') || w.word.trim().split(/\s+/).filter(Boolean).length > 1;
          return isPhrase;
        });
      }
    }
  }

  return list;
}
