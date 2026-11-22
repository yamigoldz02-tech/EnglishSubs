// @ts-check
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - DICTIONARY LIST VIEW & FILTERING MODULE
 * Handles type filters (words/phrases/all), sorting, search queries,
 * and rendering the dictionary word list rows and expansion details.
 * @AI-SECTION: DICT_LIST_VIEW
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

export let dictTypeFilter = 'all'; // 'all', 'words', or 'phrases'
export let dictSortOption = 'default'; // 'default', 'az', 'za', 'newest', 'level_asc', 'level_desc'

if (typeof window !== 'undefined') {
  window.dictTypeFilter = dictTypeFilter;
  window.dictSortOption = dictSortOption;
}

/**
 * Initialize type filter pills (Words, Phrases, All)
 */
export function setupDictTypeFilters() {
  const pillsContainer = document.getElementById('dictTypePills');
  if (!pillsContainer) return;

  const pills = pillsContainer.querySelectorAll('.dict-type-pill');
  
  pills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      const filterType = pill.getAttribute('data-type') || 'all';
      
      dictTypeFilter = filterType;
      if (typeof window !== 'undefined') {
        window.dictTypeFilter = filterType;
      }
      
      pills.forEach(p => {
        p.classList.remove('active');
        /** @type {HTMLElement} */ (p).style.background = 'transparent';
        /** @type {HTMLElement} */ (p).style.color = 'var(--text-sub)';
      });
      
      pill.classList.add('active');
      /** @type {HTMLElement} */ (pill).style.background = 'rgba(255, 255, 255, 0.12)';
      /** @type {HTMLElement} */ (pill).style.color = '#ffffff';
      
      renderDictWordsList();
    });
  });
}

/**
 * Initialize sort filter dropdown
 */
export function setupDictSortFilter() {
  const sortSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById('dictSortSelect'));
  if (!sortSelect) return;
  
  sortSelect.addEventListener('change', (e) => {
    const target = /** @type {HTMLSelectElement} */ (e.target);
    dictSortOption = target.value;
    if (typeof window !== 'undefined') {
      window.dictSortOption = dictSortOption;
    }
    renderDictWordsList();
  });
}

/**
 * Apply sorting to an array of word entries
 * @param {Array<any>} words
 * @returns {Array<any>}
 */
export function applySortToDictWords(words) {
  const sorted = [...words];
  
  switch (dictSortOption) {
    case 'az':
      sorted.sort((a, b) => (a.word || '').localeCompare(b.word || '', 'en'));
      break;
    case 'za':
      sorted.sort((a, b) => (b.word || '').localeCompare(a.word || '', 'en'));
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
    default:
      break;
  }
  
  return sorted;
}

/**
 * Get dictionary words filtered by selected folder, custom category tag, and hidden categories
 * @returns {Array<any>}
 */
export function getFilteredDictionaryWords() {
  const filterSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById('dictCategoryFilter'));
  const activeCategory = filterSelect ? filterSelect.value : 'Все слова';

  const customFilterSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById('dictCustomCategoryFilter'));
  const activeCustomCategory = customFilterSelect ? customFilterSelect.value : 'All Categories';
  
  const personalDict = window.personalDictionary || [];
  const hiddenCats = window.personalHiddenCategories || [];

  let list = [];
  
  if (activeCategory === 'Все слова') {
    list = personalDict.filter(w => {
      if (w.categories && w.categories.some(c => hiddenCats.includes(c))) {
        return false;
      }
      return true;
    });
  } else if (activeCategory.startsWith('«Топ-')) {
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
        const existing = personalDict.find(w => (w.word || '').toLowerCase() === word.toLowerCase());
        if (existing) {
          return existing;
        }
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
    list = personalDict.filter(w => {
      const wordCats = w.categories && Array.isArray(w.categories) && w.categories.length > 0
        ? w.categories
        : [w.category || 'Общее'];
      return wordCats.includes(activeCategory);
    });
  }

  // Filter by custom category tag
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
    const trainingTypeSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById('trainingTypeSelect'));
    if (trainingTypeSelect) {
      const trainingType = trainingTypeSelect.value;
      if (trainingType === 'words') {
        list = list.filter(w => {
          const isPhrase = w.type === 'phrase' || (w.word && w.word.trim().includes(' ')) || (w.word && w.word.trim().split(/\s+/).filter(Boolean).length > 1);
          return !isPhrase;
        });
      } else if (trainingType === 'phrases') {
        list = list.filter(w => {
          const isPhrase = w.type === 'phrase' || (w.word && w.word.trim().includes(' ')) || (w.word && w.word.trim().split(/\s+/).filter(Boolean).length > 1);
          return isPhrase;
        });
      }
    }
  }

  return list;
}

/**
 * Render the list of dictionary words in left side panel
 * @param {string} [filterQuery=""]
 */
export function renderDictWordsList(filterQuery = "") {
  const listEl = document.getElementById('dictWordsList');
  if (!listEl) return;

  listEl.innerHTML = '';
  
  let categoryWords = getFilteredDictionaryWords();

  if (dictTypeFilter === 'words') {
    categoryWords = categoryWords.filter(w => w.type !== 'phrase');
  } else if (dictTypeFilter === 'phrases') {
    categoryWords = categoryWords.filter(w => w.type === 'phrase');
  }

  const filtered = categoryWords.filter(w => {
    const q = filterQuery.toLowerCase();
    return (w.word && w.word.toLowerCase().includes(q)) || (w.translation && w.translation.toLowerCase().includes(q));
  });

  const sorted = applySortToDictWords(filtered);

  if (sorted.length === 0) {
    listEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1.5rem 0;">Слова не найдены</div>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  sorted.forEach(w => {
    const wordRow = document.createElement('div');
    wordRow.className = 'dict-word-row';
    wordRow.style.cssText = "display: flex; flex-direction: column; align-items: stretch; flex-shrink: 0; padding: 10px 14px; cursor: pointer; box-sizing: border-box; margin-bottom: 4px;";
    
    const intervalDays = w.interval || 0;
    const intervalBadge = intervalDays > 0 ? `<span style="font-size: 0.65rem; font-weight: 600; padding: 2px 6px; background: rgba(255,255,255,0.06); color: #a1a1aa; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; margin-left: 6px;">${intervalDays}d</span>` : '';

    const wordCats = (w.categories && Array.isArray(w.categories) && w.categories.length > 0)
      ? w.categories : [w.category || 'Общее'];
    const catBadges = wordCats.map(c =>
      `<span class="dict-cat-badge">${escapeHTML(c)}</span>`
    ).join('');

    const customCats = (w.customCategories && Array.isArray(w.customCategories) && w.customCategories.length > 0)
      ? w.customCategories : [w.customCategory || 'Без категории'];
    const customCatBadges = customCats.filter(c => c !== 'Без категории').map(c =>
      `<span class="dict-cat-badge dict-custom-cat-badge">${escapeHTML(c)}</span>`
    ).join('');

    const headerHTML = `
      <div class="word-row-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div style="text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">
          <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-main); display: flex; align-items: center;">${escapeHTML(w.word)} ${intervalBadge}</div>
          <div style="font-size: 0.8rem; color: #a1a1aa; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span>${escapeHTML(w.translation)}</span>
            ${catBadges}
            ${customCatBadges}
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

    const speakBtn = wordRow.querySelector('.speak-btn');
    if (speakBtn) {
      speakBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof window.speakText === 'function') {
          window.speakText(w.word);
        } else if (typeof window.speakTrainerWord === 'function') {
          window.speakTrainerWord(w.word);
        }
      });
    }

    let isExpanded = false;
    /** @type {HTMLElement|null} */
    let detailEl = null;

    wordRow.addEventListener('click', () => {
      if (isExpanded) {
        if (detailEl) detailEl.remove();
        isExpanded = false;
        wordRow.classList.remove('expanded');
        return;
      }

      const allRows = listEl.querySelectorAll('.dict-word-row');
      allRows.forEach(row => {
        if (row !== wordRow && row.classList.contains('expanded')) {
          /** @type {HTMLElement} */ (row).click();
        }
      });

      isExpanded = true;
      wordRow.classList.add('expanded');

      detailEl = document.createElement('div');
      detailEl.className = 'word-row-detail';
      detailEl.style.cssText = "width: 100%; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 8px; box-sizing: border-box;";

      let examplesHTML = '';
      if (typeof window.findSongExamples === 'function' && typeof window.formatSongExamplesHTML === 'function') {
        const examples = window.findSongExamples(w.word);
        examplesHTML = window.formatSongExamplesHTML(w.word, examples);
      }

      detailEl.innerHTML = `
        <div style="font-size: 0.75rem; color: var(--text-sub); line-height: 1.4; text-align: left;">
          <strong>Контекст:</strong> ${escapeHTML(w.context || 'контекст не указан')}
        </div>
        ${examplesHTML}
        <div class="word-actions-grid">
          <button class="row-copy-btn" title="Копировать в буфер обмена">
            <svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span>Копировать</span>
          </button>
          <button class="row-edit-btn" title="Редактировать">
            <svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <span>Изменить</span>
          </button>
          <button class="row-practice-btn" title="Практика">
            <svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>Практика</span>
          </button>
          <button class="row-reset-btn" title="Сбросить прогресс заучивания">
            <svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            <span>Сбросить</span>
          </button>
          <button class="row-del-btn" title="Удалить из словаря">
            <svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            <span>Удалить</span>
          </button>
        </div>
      `;

      detailEl.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      const copyBtn = detailEl.querySelector('.row-copy-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(w.word).then(() => {
            copyBtn.classList.add('success-copy');
            copyBtn.innerHTML = '<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span>Скопировано!</span>';
            setTimeout(() => {
              copyBtn.classList.remove('success-copy');
              copyBtn.innerHTML = '<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>Копировать</span>';
            }, 1500);
          }).catch(err => {
            console.error('Failed to copy: ', err);
            try {
              const el = document.createElement('textarea');
              el.value = w.word;
              document.body.appendChild(el);
              el.select();
              document.execCommand('copy');
              document.body.removeChild(el);
              copyBtn.classList.add('success-copy');
              copyBtn.innerHTML = '<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span>Скопировано!</span>';
              setTimeout(() => {
                copyBtn.classList.remove('success-copy');
                copyBtn.innerHTML = '<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>Копировать</span>';
              }, 1500);
            } catch (fallbackErr) {
              alert('Не удалось скопировать слово: ' + w.word);
            }
          });
        });
      }

      const editBtn = detailEl.querySelector('.row-edit-btn');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (typeof window.openEditWordModal === 'function') {
            window.openEditWordModal(w, () => {
              const searchInput = /** @type {HTMLInputElement|null} */ (document.getElementById('dictSearchInput'));
              renderDictWordsList(searchInput ? searchInput.value.trim() : '');
            });
          }
        });
      }

      const practiceBtn = detailEl.querySelector('.row-practice-btn');
      if (practiceBtn) {
        practiceBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (typeof window.startRoleplay === 'function') {
            window.startRoleplay(w.word);
          }
        });
      }

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
          if (typeof window.saveDictionaryToStorage === 'function') {
            window.saveDictionaryToStorage();
          }
          const searchInput = /** @type {HTMLInputElement|null} */ (document.getElementById('dictSearchInput'));
          renderDictWordsList(searchInput ? searchInput.value.trim() : "");
          if (typeof window.resetFlashcard === 'function') {
            window.resetFlashcard();
          }
          if (window.showToast) {
            window.showToast(`Прогресс для «${w.word}» обнулен`, 'success');
          } else {
            alert(`Прогресс заучивания для «${w.word}» успешно обнулен.`);
          }
        });
      }

      const delBtn = detailEl.querySelector('.row-del-btn');
      if (delBtn) {
        delBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const confirmed = window.showCustomConfirm
            ? await window.showCustomConfirm('Удаление слова', `Удалить «${w.word}» из словаря?`, { isDestructive: true })
            : confirm(`Удалить «${w.word}» из словаря?`);
          if (!confirmed) return;
          if (Array.isArray(window.personalDictionary)) {
            window.personalDictionary = window.personalDictionary.filter(x => (x.word || '').toLowerCase() !== (w.word || '').toLowerCase());
          }
          if (typeof window.saveDictionaryToStorage === 'function') {
            window.saveDictionaryToStorage();
          }
          const searchInput = /** @type {HTMLInputElement|null} */ (document.getElementById('dictSearchInput'));
          renderDictWordsList(searchInput ? searchInput.value.trim() : "");
          if (typeof window.resetFlashcard === 'function') {
            window.resetFlashcard();
          }
        });
      }

      wordRow.appendChild(detailEl);
      wordRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      const transEl = document.getElementById('cardTranslation');
      const contextEl = document.getElementById('cardContext');

      if (typeof window.setTrainerCardWord === 'function') {
        window.setTrainerCardWord(w.word);
      }
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
      
      window.activeTrainerWordObj = w;

      if (w.translation && (w.translation.includes('нажмите для перевода') || w.translation === 'частотное слово')) {
        if (transEl) transEl.textContent = 'Переводим... 🔍';
        fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(w.word)}&langpair=en|ru`)
          .then(res => res.json())
          .then(json => {
            const tr = json.responseData.translatedText;
            if (tr && tr.toLowerCase() !== w.word.toLowerCase()) {
              const RussianTr = tr.toLowerCase();
              w.translation = RussianTr;
              if (window.activeTrainerWordObj && window.activeTrainerWordObj.word === w.word) {
                if (transEl) transEl.textContent = RussianTr;
              }
              const headerDiv = wordRow.querySelector('.word-row-header div');
              const subLabel = headerDiv && headerDiv.children ? headerDiv.children[1] : null;
              if (subLabel) {
                subLabel.textContent = RussianTr;
              }
              if (Array.isArray(window.personalDictionary)) {
                const pIdx = window.personalDictionary.findIndex(x => (x.word || '').toLowerCase() === (w.word || '').toLowerCase());
                if (pIdx !== -1) {
                  window.personalDictionary[pIdx].translation = RussianTr;
                  if (typeof window.saveDictionaryToStorage === 'function') {
                    window.saveDictionaryToStorage();
                  }
                }
              }
            } else {
              if (transEl) transEl.textContent = 'Частотное слово';
            }
          })
          .catch(() => {
            if (transEl) transEl.textContent = 'Частотное слово';
          });
      }

      const children = listEl.children;
      for (let i = 0; i < children.length; i++) {
        if (children[i] !== wordRow) {
          /** @type {HTMLElement} */ (children[i]).style.background = 'rgba(255,255,255,0.03)';
          /** @type {HTMLElement} */ (children[i]).style.borderColor = 'rgba(255,255,255,0.06)';
          children[i].classList.remove('expanded');
          const childDetail = children[i].querySelector('.word-row-detail');
          if (childDetail) childDetail.remove();
        }
      }
    });

    fragment.appendChild(wordRow);
  });

  listEl.appendChild(fragment);
}

// Global exposure
if (typeof window !== 'undefined') {
  window.dictTypeFilter = dictTypeFilter;
  window.dictSortOption = dictSortOption;
  window.setupDictTypeFilters = setupDictTypeFilters;
  window.setupDictSortFilter = setupDictSortFilter;
  window.applySortToDictWords = applySortToDictWords;
  window.getFilteredDictionaryWords = getFilteredDictionaryWords;
  window.renderDictWordsList = renderDictWordsList;
}
