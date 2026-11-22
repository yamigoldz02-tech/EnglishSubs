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
// Study session state and persistence → moved to modules/dict-session-manager.js

// Categories, folders, and category selector population → moved to modules/dict-categories.js

function initDictionary() {
  if (typeof window.loadCategories === 'function') window.loadCategories();
  if (typeof window.loadHiddenCategories === 'function') window.loadHiddenCategories();
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
      if (typeof window.runOldWordsMigration === 'function') {
        window.runOldWordsMigration();
      }
    }
  } catch (e) {
    console.error("Failed to load personal dictionary:", e);
  }
  updateSavedWordsCount();
  setupDictionaryUI();
  if (typeof window.populateCategorySelectors === 'function') window.populateCategorySelectors();
  if (typeof window.setupDictTypeFilters === 'function') window.setupDictTypeFilters();
  if (typeof window.renderDictWeekChart === 'function') window.renderDictWeekChart();
  if (typeof window.renderHeatmap === 'function') window.renderHeatmap();
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
  localStorage.setItem('my_personal_dictionary', JSON.stringify(personalDictionary));
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


/**
 * Triggers a sleek particle burst and floating badge on PC when a new word/phrase is added.
 * @param {string} text - The word or phrase text
 * @param {'word'|'phrase'} [type='word'] - Type of item added
 * @param {HTMLElement|{x:number,y:number}|null} [anchor=null] - Anchor element or point
 */
function triggerWordAddedPCAnimation(text, type = 'word', anchor = null) {
  // Strict desktop / PC check (>= 900px and fine pointer/mouse)
  const isPC = window.innerWidth >= 900 && (!('ontouchstart' in window) || window.matchMedia('(pointer: fine)').matches);
  if (!isPC) return;

  try {
    const isPhrase = type === 'phrase' || (typeof text === 'string' && text.trim().split(/\s+/).length >= 3);
    const badgeText = '+1 Добавлено';
    const displayWord = typeof text === 'string' ? text.trim() : '';

    // 1. Floating Capsule Toast
    const toast = document.createElement('div');
    toast.className = 'pc-word-added-toast';
    toast.innerHTML = `
      <div class="toast-icon">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <span class="toast-badge">${badgeText}</span>
      <span class="toast-word">«${escapeHTML(displayWord)}»</span>
    `;

    document.body.appendChild(toast);

    // 2. Particle Sparks Burst
    const colors = ['#F4A261', '#E9C46A', '#2A9D8F', '#E76F51', '#38BDF8', '#A78BFA'];
    let originX = window.innerWidth / 2;
    let originY = 60;

    if (anchor && typeof anchor.getBoundingClientRect === 'function') {
      const rect = anchor.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    } else if (anchor && typeof anchor.x === 'number' && typeof anchor.y === 'number') {
      originX = anchor.x;
      originY = anchor.y;
    }

    const particleCount = 18;
    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'pc-spark-particle';
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const distance = 40 + Math.random() * 70;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 18;
      const rot = (Math.random() * 360 - 180) + 'deg';
      const size = 4 + Math.random() * 4;
      const color = colors[Math.floor(Math.random() * colors.length)];

      p.style.cssText = `
        left: ${originX}px;
        top: ${originY}px;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        --dx: ${dx}px;
        --dy: ${dy}px;
        --rot: ${rot};
        box-shadow: 0 0 8px ${color};
      `;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 2100);
  } catch (err) {
    console.warn('[PC Animation] Notice:', err);
  }
}
window.triggerWordAddedPCAnimation = triggerWordAddedPCAnimation;

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
  triggerWordAddedPCAnimation(eng, actualType);

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
// Type filter pills, sort options, and sort algorithms → moved to modules/dict-list-view.js

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
  const dictFabContainer = document.getElementById('dictFabContainer');
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
        if (dictFabContainer) dictFabContainer.style.display = 'flex';
        if (progressBarContainer) /** @type {HTMLElement} */ (progressBarContainer).style.display = 'none';
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
        if (dictFabContainer) dictFabContainer.style.display = 'none';
        if (progressBarContainer) /** @type {HTMLElement} */ (progressBarContainer).style.display = 'flex';
      }
      
      // Refresh options and list
      populateCategorySelectors();
      renderDictWordsList();
      resetFlashcard();
    };
    
    tabPersonal.addEventListener('click', () => switchTab('personal'));
    tabEssential.addEventListener('click', () => switchTab('essential'));
  }

  // 2. Manual Word & Phrase Adding Dialogs → moved to modules/dict-modals-manual.js

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
        openEditWordModal(activeTrainerWordObj, (res) => {
          if (res && res.deleted) {
            resetFlashcard();
          } else {
            renderTrainerCard(activeTrainerWordObj);
          }
        });
      }
    });
  }

  const cardEditBtnBack = document.getElementById('cardEditBtnBack');
  if (cardEditBtnBack) {
    cardEditBtnBack.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeTrainerWordObj) {
        openEditWordModal(activeTrainerWordObj, (res) => {
          if (res && res.deleted) {
            resetFlashcard();
          } else {
            renderTrainerCard(activeTrainerWordObj);
          }
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
    if (trainingModal && trainingModal.style.display && trainingModal.style.display !== 'none') {
      closeModalEl(trainingModal);
    }
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
    
    // Populate DOM first while invisible so animation runs at full 60fps
    populateCategorySelectors();
    renderDictWordsList();
    resetFlashcard();
    renderHeatmap();

    // Now trigger the clean sheet animation
    openModalEl(modal);
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
    if (modal && modal.style.display && modal.style.display !== 'none') {
      closeModalEl(modal); // Close dictionary if open
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

    if (trainingModal) {
      openModalEl(trainingModal);
    }
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
        
        // Also show Spaced Repetition control buttons and side score pills when flipped to back side
        const pills = document.getElementById('spacedRepetitionPills');
        const remainingPill = document.getElementById('sessionCountRemaining');
        const learnedPill = document.getElementById('sessionCountLearned');

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

        if (remainingPill) {
          remainingPill.style.visibility = isFlipped ? 'visible' : 'hidden';
          remainingPill.style.opacity = isFlipped ? '1' : '0';
        }
        if (learnedPill) {
          learnedPill.style.visibility = isFlipped ? 'visible' : 'hidden';
          learnedPill.style.opacity = isFlipped ? '1' : '0';
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
        clearPersonalDictionary();
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

  // Category & folder management UI is initialized from modules/dict-categories.js
  if (typeof window.setupCategoryManagementUI === 'function') {
    window.setupCategoryManagementUI();
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


  // Mini-Games (Match Game, Learn Mode, AI Roleplay) → moved to modules/dict-games.js
}


// Flashcard trainer & Leitner scheduling algorithms → moved to modules/dict-session-manager.js

function clearPersonalDictionary() {
  personalDictionary = [];
  saveDictionaryToStorage();
  if (typeof clearStudySession === 'function') clearStudySession();
  renderDictWordsList();
  resetFlashcard();
  if (typeof showToast === 'function') showToast('Словарь полностью обнулён');
}

// Global window exposure for modular interoperability
window.clearPersonalDictionary = clearPersonalDictionary;
window.clearDictionary = clearPersonalDictionary;
window.resetDictionary = clearPersonalDictionary;
window.saveDictionaryToStorage = saveDictionaryToStorage;
window.renderDictWordsList = renderDictWordsList;
window.resetFlashcard = resetFlashcard;
window.populateCategorySelectors = populateCategorySelectors;
window.updateSavedWordsCount = updateSavedWordsCount;
window.formatDictionaryWord = formatDictionaryWord;
window.getFilteredDictionaryWords = getFilteredDictionaryWords;
window.startStudySession = startStudySession;
window.initDictionary = initDictionary;

