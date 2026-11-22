// @ts-check
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - DICTIONARY & FLASHCARD MODAL TEMPLATES
 * Self-contained HTML templates for vocabulary, 3D Leitner training, word editing,
 * manual word creation, and folder management modals.
 * @AI-SECTION: MODAL_TEMPLATES_DICT
 * ============================================================================
 */

export const DICT_MODALS_HTML = `
  <!-- Dictionary Modal -->
  <div class="modal-overlay" id="dictionaryModal" style="display: none; z-index: 10000;">
    <div class="modal-card" id="dictionaryModalCard" style="max-width: 480px; width: 90%; height: 68vh; min-height: 480px; max-height: 72vh; display: flex; flex-direction: column;">
      <!-- Drag handle for mobile bottom sheet -->
      <div class="mobile-drag-handle"></div>
      
      <div class="modal-header" style="flex-shrink: 0;">
        <h3 style="display: flex; align-items: center; gap: 6px;">
          <svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
          <span>Мой словарь</span>
        </h3>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button id="dictExpandWidthBtn" class="modal-expand-btn" title="Расширить по ширине" style="background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); color: var(--text-sub); border-radius: 8px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.8rem; transition: all 0.2s; outline: none;">
            <svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          </button>
          <button id="dictExpandHeightBtn" class="modal-expand-btn" title="Расширить по высоте" style="background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); color: var(--text-sub); border-radius: 8px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.8rem; transition: all 0.2s; outline: none;">
            <svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 3 12 3 16 3"/><polyline points="8 21 12 21 16 21"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
          </button>
          <button class="modal-close-btn" id="closeDictionaryBtn" title="Закрыть">✕</button>
        </div>
      </div>

      <!-- Premium Dictionary Tabs -->
      <div class="dict-tabs">
        <button class="dict-tab active" id="dictTabPersonal">Мой словарь</button>
        <button class="dict-tab" id="dictTabEssential">Частотный Топ-1000</button>
      </div>

      <div class="modal-body" style="display: flex; flex-direction: column; gap: 0.75rem; overflow: hidden; padding: 1.5rem; flex-grow: 1; min-height: 0; box-sizing: border-box;">
        
        <!-- Standard view wrapper -->
        <div id="dictStandardView" style="display: flex; flex-direction: column; gap: 0.75rem; flex-grow: 1; min-height: 0; overflow: hidden; width: 100%;">
          
          <!-- Collapsible Filters Trigger Button and Stats Toggle -->
          <div style="display: flex; gap: 8px; align-items: center; width: 100%; flex-shrink: 0;">
            <button id="toggleDictFiltersBtn" class="filters-toggle-btn" type="button" style="flex-grow: 1; width: auto; display: flex; align-items: center; justify-content: space-between;">
              <span style="display: inline-flex; align-items: center; gap: 6px;">
                <svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Настройки и статистика
              </span>
              <span class="toggle-arrow">▼</span>
            </button>
          </div>

          <!-- Collapsible filters container -->
          <div id="dictFiltersCollapse" class="dict-filters-collapse">
            <!-- Row 1: Folder filter & Category filter -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-shrink: 0; width: 100%; flex-wrap: wrap;">
              <!-- Folder filter -->
              <div style="display: flex; align-items: center; gap: 4px; flex-grow: 1; min-width: 140px;">
                <span style="font-size: 0.75rem; color: var(--text-sub); white-space: nowrap;">Папка:</span>
                <select id="dictCategoryFilter" class="premium-select-filter" style="width: 100%; min-width: 0;">
                  <option value="Все слова">Все папки</option>
                  <option value="Общее">Общее</option>
                  <option value="Базовые глаголы">Базовые глаголы</option>
                  <option value="Сленг и идиомы">Сленг и идиомы</option>
                  <option value="Социальные фразы">Социальные фразы</option>
                </select>
                <button id="addCustomCategoryBtn" title="Создать свою папку" style="background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-glass); color: #ffffff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; outline: none; flex-shrink: 0;">
                  <svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <button id="manageFoldersBtn" title="Управление папками" style="background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-glass); color: #fff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; outline: none; flex-shrink: 0;">
                  <svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </button>
              </div>
              <!-- Category filter -->
              <div style="display: flex; align-items: center; gap: 4px; flex-grow: 1; min-width: 140px;">
                <span style="font-size: 0.75rem; color: var(--text-sub); white-space: nowrap;">Категория:</span>
                <select id="dictCustomCategoryFilter" class="premium-select-filter" style="width: 100%; min-width: 0;">
                  <option value="All Categories">Все категории</option>
                  <option value="Без категории">Без категории</option>
                </select>
                <button id="addCustomCustomCategoryBtn" title="Создать свою категорию" style="background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-glass); color: #ffffff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; outline: none; flex-shrink: 0;">
                  <svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
            </div>

            <!-- Row 2: Sort dropdown -->
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-shrink: 0; width: 100%;">
              <select id="dictSortSelect" class="premium-select-filter" style="height: 32px; font-size: 0.75rem; padding: 0 10px; width: 100%;">
                <option value="default">Порядок добавления</option>
                <option value="az">А → Я</option>
                <option value="za">Я → А</option>
                <option value="newest">Новые первые</option>
                <option value="level_asc">Уровень (по возрастанию)</option>
                <option value="level_desc">Уровень (по убыванию)</option>
              </select>
            </div>
            <!-- Mini 7-day chart -->
            <div id="dictWeekChart" style="flex-shrink: 0; margin-top: 12px; margin-bottom: 8px;"></div>

            <!-- Danger Zone: Clear Dictionary (Safely hidden inside Settings & Stats) -->
            <div class="dict-danger-zone" style="display: flex; justify-content: flex-end; align-items: center; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); margin-top: 6px;">
              <button class="modal-btn secondary-btn" id="clearDictBtn" style="font-size: 0.75rem; padding: 5px 12px; border-radius: 10px; outline: none; margin: 0; display: inline-flex; align-items: center; gap: 5px; color: #ef4444; border-color: rgba(239, 68, 68, 0.25); background: rgba(239, 68, 68, 0.06); cursor: pointer;">
                <svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                <span>Очистить словарь</span>
              </button>
            </div>
          </div>

        
          <div style="display: flex; width: 100%; flex-shrink: 0;">
            <div class="premium-search-box" style="flex-grow: 1; width: 100%; margin: 0; display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass);">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity: 0.6; color: var(--text-main); flex-shrink: 0;">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" id="dictSearchInput" placeholder="Поиск в словаре..." style="background: transparent; border: none; color: var(--text-main); font-size: 0.88rem; outline: none; width: 100%;">
            </div>
          </div>
          
          <div style="position: relative; flex: 1 1 0; min-height: 0; display: flex; flex-direction: column;">
            <div id="dictWordsList" style="flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; padding-right: 4px;">
              <!-- Words dynamically injected here -->
            </div>

            <!-- Floating Add Button (Direct Click) -->
            <div class="dict-fab-container" id="dictFabContainer">
              <button class="dict-fab-btn" id="dictFabToggleBtn" title="Добавить в словарь" aria-label="Добавить в словарь">
                <svg class="dict-fab-plus-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>

            <button id="dictScrollTopBtn" title="Наверх" aria-label="Прокрутить наверх">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
          </div>

          <!-- Full-width Bottom Training Action Bar -->
          <div class="dict-bottom-actions" style="margin-top: auto; flex-shrink: 0; width: 100%; padding-top: 6px;">
            <button class="modal-btn" id="startTrainingFromDictBtn">
              <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              <span>Начать тренировку (Training)</span>
            </button>
          </div>
        </div>

        <!-- Match Game view wrapper -->
        <div id="dictMatchView" style="display: none; flex-direction: column; gap: 0.85rem; flex-grow: 1; min-height: 0; width: 100%; height: 100%; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; width: 100%;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-spotify)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span id="matchTimer" style="font-family: monospace; font-size: 1.25rem; font-weight: 700; color: var(--text-main); letter-spacing: 1px;">0.0s</span>
            </div>
            <button id="exitMatchGameBtn" class="modal-btn secondary-btn" style="font-size: 0.75rem; padding: 6px 14px; border-radius: 20px; outline: none; margin: 0; flex-shrink: 0; cursor: pointer;">✕ Выйти из игры</button>
          </div>

          <!-- 12-tile Game Grid -->
          <div id="matchGrid" style="display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(4, 1fr); gap: 10px; flex-grow: 1; min-height: 0; width: 100%; box-sizing: border-box; padding: 4px 0;">
            <!-- 12 Tiles injected dynamically -->
          </div>
        </div>

        <!-- Learn Game view wrapper -->
        <div id="dictLearnView" style="display: none; flex-direction: column; gap: 0.85rem; flex-grow: 1; min-height: 0; width: 100%; height: 100%; box-sizing: border-box;">
          <!-- Top bar -->
          <div style="display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; width: 100%;">
            <div style="display: flex; flex-direction: column; gap: 4px; flex-grow: 1; margin-right: 15px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">
                <span>Вопрос <span id="learnCurrentQuestion">1</span> из 10</span>
                <span>Точность: <span id="learnAccuracy">100</span>%</span>
              </div>
              <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                <div id="learnProgressBar" style="width: 10%; height: 100%; background: var(--accent-spotify); border-radius: 3px; transition: width 0.3s ease;"></div>
              </div>
            </div>
            <button id="exitLearnGameBtn" class="modal-btn secondary-btn" style="font-size: 0.72rem; padding: 5px 12px; border-radius: 20px; outline: none; margin: 0; flex-shrink: 0; cursor: pointer;">✕ Log Out</button>
          </div>

          <!-- Question Area -->
          <div id="learnGameArea" style="display: flex; flex-direction: column; gap: 0.85rem; flex-grow: 1; width: 100%;">
            <!-- Card -->
            <div style="display: flex; align-items: center; justify-content: center; text-align: center; flex-grow: 1; width: 100%; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px; box-sizing: border-box; min-height: 120px; box-shadow: inset 0 0 20px rgba(255,255,255,0.01); flex-shrink: 0;">
              <span id="learnQuestionWord" style="font-size: 1.45rem; font-weight: 700; color: var(--text-main); max-width: 100%; line-height: 1.35;">target word</span>
            </div>
            
            <!-- Choices Grid -->
            <div id="learnChoicesGrid" style="display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 10px; width: 100%; box-sizing: border-box; padding-top: 5px; flex-shrink: 0;">
              <!-- Choice buttons dynamically injected -->
            </div>
          </div>

          <!-- Results Area -->
          <div id="learnResultsView" style="display: none; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; flex-grow: 1; text-align: center; width: 100%; box-sizing: border-box; padding: 2rem 1rem;">
            <div style="font-size: 2.5rem; color: #f59e0b; margin-bottom: 5px;">
              <svg class="ui-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H8v2h8v-2h-1c-.55 0-1-.45-1-1v-2.34"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            </div>
            <h3 style="color: var(--text-main); font-weight: 700; margin: 0; font-size: 1.4rem;">Тест завершен!</h3>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <span style="font-size: 0.9rem; color: var(--text-muted);">Правильных ответов: <strong id="learnResultCorrect" style="color: var(--accent-spotify);">8</strong> из 10</span>
              <span style="font-size: 0.9rem; color: var(--text-muted);">Точность: <strong id="learnResultPercent" style="color: #f59e0b;">80%</strong></span>
            </div>
            <button id="closeLearnResultsBtn" class="modal-btn" style="background: var(--accent-spotify); color: #ffffff; font-weight: 700; border: none; border-radius: 20px; padding: 8px 24px; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; box-shadow: var(--shadow-sm); outline: none;">
              Вернуться в словарь
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- Training Modal -->
  <div class="modal-overlay" id="trainingModal" style="display: none; z-index: 10050;">
    <div class="modal-card" id="trainingModalCard" style="max-width: 480px; width: 90%; height: 75vh; min-height: 600px; max-height: 85vh; display: flex; flex-direction: column; box-sizing: border-box;">
      <div class="modal-header" style="flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; width: 100%; box-sizing: border-box; padding-bottom: 8px; gap: 10px; border-bottom: none !important;">
        <h3 style="margin: 0; font-weight: 700; color: var(--text-main); font-size: 1.05rem; display: flex; align-items: center; gap: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1 1 auto; min-width: 0; padding-right: 12px;">
          <svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          <span>Training (<span id="trainingCategoryLabel" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;">Все слова</span>)</span>
        </h3>
        <div style="display: flex; align-items: center; flex-shrink: 0; gap: 8px; min-width: max-content;">
          <button id="trainingExpandWidthBtn" title="Расширить по ширине" style="background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); color: var(--text-sub); border-radius: 8px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.8rem; transition: all 0.2s; outline: none; flex-shrink: 0;">
            <svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          </button>
          <button class="modal-close-btn" id="closeTrainingModalBtn" style="background: none; border: none; color: var(--text-sub); font-size: 1.2rem; cursor: pointer; outline: none; flex-shrink: 0; padding: 4px; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px;">✕</button>
        </div>
      </div>

      <!-- Collapsible Training Settings Trigger Button -->
      <div style="display: flex; width: 100%; flex-shrink: 0; padding: 4px 1.5rem 8px 1.5rem; box-sizing: border-box;">
        <button id="toggleTrainingSettingsBtn" class="filters-toggle-btn" type="button" style="width: 100%; display: flex; align-items: center; justify-content: space-between;">
          <span style="display: inline-flex; align-items: center; gap: 6px;">
            <svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Параметры тренировки
          </span>
          <span class="toggle-arrow">▼</span>
        </button>
      </div>

      <!-- Training Settings Bar -->
      <div id="trainingSettingsBar" class="training-settings-collapse" style="flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 8px; box-sizing: border-box; flex-wrap: wrap;">
        <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.5px;">Параметры:</span>
        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <select id="trainingFolderSelect" class="premium-micro-select" style="font-size: 0.72rem; padding: 3px 8px; border-radius: 12px; height: 26px; border: 1px solid var(--border-glass); outline: none;" title="Папка для тренировки">
            <option value="Все слова">All Folders</option>
          </select>
          <select id="trainingTypeSelect" class="premium-micro-select" style="font-size: 0.72rem; padding: 3px 8px; border-radius: 12px; height: 26px; border: 1px solid var(--border-glass); outline: none;">
            <option value="all">Всё подряд</option>
            <option value="words">Только слова</option>
            <option value="phrases">Только фразы</option>
          </select>
          <select id="trainingModeSelect" class="premium-micro-select" style="font-size: 0.72rem; padding: 3px 8px; border-radius: 12px; height: 26px; border: 1px solid var(--border-glass); outline: none;">
            <option value="direct">EN ➔ RU</option>
            <option value="reverse" selected>RU ➔ EN</option>
            <option value="def_to_en">Значение ➔ EN</option>
            <option value="en_to_def">EN ➔ Значение</option>
          </select>
          <select id="trainingLimitSelect" class="premium-micro-select" style="font-size: 0.72rem; padding: 3px 8px; border-radius: 12px; height: 26px; border: 1px solid var(--border-glass); outline: none;" title="Размер сессии тренировки">
            <option value="20">20</option>
            <option value="40">40</option>
            <option value="all">Всё</option>
          </select>
          <select id="trainingOrderSelect" class="premium-micro-select" style="font-size: 0.72rem; padding: 3px 8px; border-radius: 12px; height: 26px; border: 1px solid var(--border-glass); outline: none;" title="Порядок показа слов">
            <option value="shuffle">Случайно</option>
            <option value="ordered">По порядку</option>
          </select>
          <label style="display: flex; align-items: center; gap: 4px; font-size: 0.72rem; color: var(--text-sub); margin-left: 4px; cursor: pointer; height: 26px;" title="Если включено, будут добавлены все слова выбранной папки, игнорируя интервалы повторений">
            <input type="checkbox" id="trainingForceAllCheckbox" style="accent-color: var(--accent-spotify); margin: 0; width: 14px; height: 14px; cursor: pointer;">
            Учить всё
          </label>
        </div>
      </div>

      <!-- Main training container -->
      <div class="modal-body" style="display: flex; flex-direction: column; justify-content: flex-start; align-items: center; padding: 1.5rem; flex-grow: 1; min-height: 0; overflow-y: auto; box-sizing: border-box; gap: 1.25rem; width: 100%;">
        
        <!-- Session Progress Bar Container -->
        <div id="sessionProgressContainer" style="width: 100%; max-width: 340px; display: none; flex-direction: column; gap: 8px; margin-bottom: 5px; flex-shrink: 0; box-sizing: border-box;">
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; position: relative; min-height: 24px;">
            <!-- Missed/Remaining pill (hidden on front, revealed after flip) -->
            <div id="sessionCountRemaining" class="session-pill remaining" title="Осталось выучить" style="opacity: 0; visibility: hidden; transition: opacity 0.25s ease;">0</div>
            <!-- Centered Progress text -->
            <span id="sessionProgressCounterText" style="font-size: 0.82rem; font-weight: 700; color: var(--text-main); font-family: monospace; position: absolute; left: 50%; transform: translateX(-50%); white-space: nowrap;">0 / 0</span>
            <!-- Learned pill (hidden on front, revealed after flip) -->
            <div id="sessionCountLearned" class="session-pill learned" title="Выучено в этой сессии" style="opacity: 0; visibility: hidden; transition: opacity 0.25s ease;">0</div>
          </div>
          <!-- Progress line track -->
          <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; border: 1px solid rgba(255,255,255,0.02);">
            <div id="sessionProgressBarFill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #f59e0b, #10b981); border-radius: 3px; transition: width 0.3s ease;"></div>
          </div>
        </div>

        <!-- Interactive 3D Flip Card -->
        <div class="flashcard-container" id="dictFlashcard" style="display: none; width: 100%; max-width: 320px; height: 420px; margin: 0 auto;">
          <div class="flashcard-inner" id="flashcardInner">
            
            <!-- Front Side -->
            <div class="flashcard-front">
              <div id="cardFrontLabel" style="flex-shrink: 0; font-size: 0.65rem; letter-spacing: 1px; color: var(--accent-spotify); font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">СЛОВО НА АНГЛИЙСКОМ</div>
              <div id="cardWordContainer" style="flex: 1 1 auto; display: flex; align-items: center; gap: 8px; justify-content: center; width: 100%; padding: 4px 0; box-sizing: border-box;">
                <span id="cardWord" style="text-align: center;">word</span>
                <button id="cardSpeakBtn" title="Прослушать слово" style="background: rgba(255,255,255,0.08); border: 1px solid var(--border-glass); color: var(--text-main); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; outline: none; flex-shrink: 0; box-shadow: var(--shadow-sm);">
                  <svg class="ui-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                </button>
                <button id="cardPracticeBtn" title="Практика в диалоге" style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); color: var(--accent-spotify); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; outline: none; flex-shrink: 0; box-shadow: var(--shadow-sm);">
                  <svg class="ui-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                </button>
                <button id="cardEditBtnFront" title="Edit слово/фразу" style="background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.25); color: #818cf8; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; outline: none; flex-shrink: 0; box-shadow: var(--shadow-sm);">
                  <svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
              </div>
              <div style="flex-shrink: 0; margin-top: 4px; font-size: 0.7rem; color: var(--text-sub); display: flex; align-items: center; gap: 4px;">
                <svg class="ui-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                <span>Кликните, чтобы перевернуть</span>
              </div>
            </div>

            <!-- Back Side -->
            <div class="flashcard-back">
              <div id="cardBackLabel" style="flex-shrink: 0; font-size: 0.65rem; letter-spacing: 1px; color: var(--text-sub); font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">ПЕРЕВОД</div>
              <div style="flex: 1 1 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; gap: 6px; padding: 4px 0; box-sizing: border-box;">
                <div style="display: flex; align-items: center; gap: 8px; justify-content: center; width: 100%;">
                  <span id="cardTranslation" style="font-size: 1.3rem; font-weight: 700; color: var(--accent-spotify); text-align: center;">перевод</span>
                  <button id="cardSpeakBtnBack" title="Прослушать слово" style="display: none; background: rgba(255,255,255,0.08); border: 1px solid var(--border-glass); color: var(--text-main); border-radius: 50%; width: 32px; height: 32px; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; outline: none; flex-shrink: 0; box-shadow: var(--shadow-sm);">
                    <svg class="ui-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                  </button>
                  <button id="cardPracticeBtnBack" title="Практика в диалоге" style="display: none; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); color: var(--accent-spotify); border-radius: 50%; width: 32px; height: 32px; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; outline: none; flex-shrink: 0; box-shadow: var(--shadow-sm);">
                    <svg class="ui-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                  </button>
                  <button id="cardEditBtnBack" title="Edit слово/фразу" style="background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.25); color: #818cf8; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; outline: none; flex-shrink: 0; box-shadow: var(--shadow-sm);">
                    <svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </button>
                </div>
                <div id="cardContext" style="font-size: 0.75rem; color: var(--text-sub); line-height: 1.4; text-align: center; width: 100%; box-sizing: border-box; opacity: 0.9;">Контекст слова...</div>
              </div>
            </div>

          </div>
        </div>

        <!-- Empty State -->
        <div id="dictEmptyState" style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; max-width: 320px; padding: 1.5rem; box-sizing: border-box;">
          <div style="font-size: 2.5rem; color: var(--accent-spotify);">
            <svg class="ui-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          </div>
          <div style="font-size: 1rem; font-weight: 600; color: var(--text-main);" id="emptyStateTitle">Все слова повторены!</div>
          <p style="font-size: 0.75rem; color: var(--text-sub); line-height: 1.5; margin: 0;" id="emptyStateText">
            Вы отлично справляетесь! В этой коллекции нет слов для повторения на сегодня.
          </p>
        </div>

        <!-- Session Success Celebration View -->
        <div id="sessionSuccessView" style="display: none; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 1.25rem; padding: 1.5rem 1rem; flex-grow: 1; width: 100%; max-width: 340px; box-sizing: border-box; position: relative; overflow: hidden;">
          <!-- Confetti Particles Container -->
          <div id="successConfettiContainer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;"></div>
          
          <div style="font-size: 3rem; color: #f59e0b; margin-bottom: 2px; z-index: 20; display: inline-block;">
            <svg class="ui-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H8v2h8v-2h-1c-.55 0-1-.45-1-1v-2.34"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          </div>
          <h2 style="color: var(--text-main); font-weight: 800; font-size: 1.3rem; margin: 0; z-index: 20;">Сессия завершена!</h2>
          <p style="font-size: 0.78rem; color: var(--text-sub); line-height: 1.45; margin: 0; z-index: 20;">
            Все карточки сессии успешно выучены и отправлены в долговременную память.
          </p>
          
          <!-- Spaced Repetition Activity Heatmap & Streak (Results Screen) -->
          <div class="dict-heatmap-container" style="width: 100%; padding: 12px 14px; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-glass); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; z-index: 20;">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
              <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.5px;">🔥 Стрик и активность</span>
              <span style="font-size: 0.78rem; color: var(--accent-spotify); font-weight: 700;" id="dictStreakInfo">Дней подряд: 0 дней</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
              <span style="font-size: 0.65rem; color: var(--text-muted);">Меньше</span>
              <div class="heatmap-grid" id="dictHeatmapGrid" style="display: grid; grid-template-columns: repeat(28, 1fr); gap: 3px; flex-grow: 1;">
                <!-- 28 days injected dynamically -->
              </div>
              <span style="font-size: 0.65rem; color: var(--text-muted);">Больше</span>
            </div>
          </div>

          <!-- Summary of Words studied -->
          <div style="width: 100%; background: rgba(255,255,255,0.02); border: 1px solid var(--border-glass); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; gap: 6px; box-sizing: border-box; max-height: 110px; overflow-y: auto; text-align: left; z-index: 20;">
            <div style="font-size: 0.65rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">Выучено за сессию:</div>
            <div id="sessionSummaryList" style="display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.75rem; color: var(--text-main);">
              <!-- List of words injected here -->
            </div>
          </div>

          <button id="closeSessionSuccessBtn" class="modal-btn" style="background: var(--accent-spotify); color: #ffffff; font-weight: 700; border: none; border-radius: var(--radius-pill); padding: 8px 24px; font-size: 0.82rem; cursor: pointer; transition: all 0.2s; box-shadow: var(--shadow-sm); outline: none; z-index: 20; margin-top: 4px;">
            Вернуться в словарь
          </button>
        </div>

        <!-- Active Card Controls -->
        <div id="cardControls" style="display: none; flex-direction: column; align-items: center; gap: 12px; width: 100%;">
          
          <!-- Three Spaced Repetition pills (shown under flipped state) -->
          <div id="spacedRepetitionPills" style="display: flex; align-items: center; gap: 8px; justify-content: center; width: 100%;">
            <button class="modal-btn" id="cardForgotBtn" style="background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.3); color: #f43f5e; font-size: 0.8rem; padding: 8px 16px; border-radius: 20px; font-weight: 600; cursor: pointer; transition: all 0.2s; outline: none; display: inline-flex; align-items: center; gap: 5px;">
              <svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              <span>Забыл</span>
            </button>
            <button class="modal-btn" id="cardHardBtn" style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); color: #f59e0b; font-size: 0.8rem; padding: 8px 16px; border-radius: 20px; font-weight: 600; cursor: pointer; transition: all 0.2s; outline: none; display: inline-flex; align-items: center; gap: 5px;">
              <svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              <span>С трудом</span>
            </button>
            <button class="modal-btn" id="cardEasyBtn" style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; font-size: 0.8rem; padding: 8px 16px; border-radius: 20px; font-weight: 600; cursor: pointer; transition: all 0.2s; outline: none; display: inline-flex; align-items: center; gap: 5px;">
              <svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Easy</span>
            </button>
          </div>

          <!-- Card utility controls -->
          <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap;">
            <button class="modal-btn secondary-btn" id="cardUndoBtn" style="font-size: 0.75rem; padding: 6px 14px; border-radius: 20px; color: #818cf8; border-color: rgba(99, 102, 241, 0.2); background: rgba(99, 102, 241, 0.05); margin-top: 4px; display: none; align-items: center; gap: 4px;">
              <svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
              <span>Назад</span>
            </button>
          </div>
          
        </div>

      </div>
    </div>
  </div>

  <!-- Manual Add Word / Phrase Modal (Unified) -->
  <div class="modal-overlay" id="addWordModal" style="display: none; z-index: 10100;">
    <div class="modal-card" style="max-width: 400px; width: 95%; height: auto; max-height: 80vh; overflow-y: auto; padding: 2rem; box-sizing: border-box;">
      <div class="modal-header" style="border-bottom: 1px solid var(--border-glass); padding-bottom: 12px; margin-bottom: 20px; box-sizing: border-box; width: 100%;">
        <h3 id="manualWordTitle" style="margin: 0; font-size: 1.1rem; color: var(--text-main); font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Добавить в словарь</span>
        </h3>
        <button class="modal-close-btn" id="closeAddWordBtn" style="background: none; border: none; color: var(--text-sub); font-size: 1.2rem; cursor: pointer; outline: none;">✕</button>
      </div>
      
      <div id="manualWordFormBody" style="display: flex; flex-direction: column; gap: 15px; width: 100%; box-sizing: border-box; transition: opacity 0.16s ease, transform 0.16s ease;">
        <div style="display: flex; flex-direction: column; gap: 6px; width: 100%; box-sizing: border-box;">
          <label id="manualWordEngLabel" style="font-size: 0.75rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase;">Слово или фраза (EN):</label>
          <input type="text" id="manualWordEng" lang="en" placeholder="например, apple или break the ice" autocorrect="off" autocapitalize="off" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 10px 12px; color: var(--text-main); font-size: 0.9rem; outline: none; box-sizing: border-box; width: 100%; transition: border-color 0.3s, box-shadow 0.3s;">
          <span id="addWordEngHint" style="font-size: 0.68rem; color: var(--text-muted); margin-top: 1px;"><svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M6 12h.01"/><path d="M10 12h.01"/><path d="M14 12h.01"/><path d="M18 12h.01"/><path d="M7 16h10"/></svg>Если вы наберёте кириллицу — раскладка исправится автоматически</span>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 6px; width: 100%; box-sizing: border-box;">
          <label id="manualWordRusLabel" style="font-size: 0.75rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase;">Перевод (RU):</label>
          <input type="text" id="manualWordRus" lang="ru" placeholder="например, яблоко или растопить лёд" autocorrect="off" autocapitalize="off" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 10px 12px; color: var(--text-main); font-size: 0.9rem; outline: none; box-sizing: border-box; width: 100%; transition: border-color 0.3s, box-shadow 0.3s;">
          <span id="addWordRusHint" style="font-size: 0.68rem; color: var(--text-muted); margin-top: 1px;"><svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M6 12h.01"/><path d="M10 12h.01"/><path d="M14 12h.01"/><path d="M18 12h.01"/><path d="M7 16h10"/></svg>Если вы наберёте латиницу — раскладка исправится автоматически</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px; width: 100%; box-sizing: border-box;">
          <label id="manualWordDefinitionLabel" style="font-size: 0.75rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase;">Значение / Толкование (опционально):</label>
          <textarea id="manualWordDefinition" placeholder="например, Значение или контекст употребления..." style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 10px 12px; color: var(--text-main); font-size: 0.9rem; outline: none; box-sizing: border-box; width: 100%; min-height: 60px; max-height: 120px; resize: vertical; transition: border-color 0.3s, box-shadow 0.3s; font-family: inherit;"></textarea>
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px; width: 100%; box-sizing: border-box;">
          <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase;"><svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg><span>Правило / Грамматика (опционально):</span></label>
          <textarea id="manualWordRule" placeholder="например, Грамматическая заметка или пример фразы..." style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 10px 12px; color: var(--text-main); font-size: 0.9rem; outline: none; box-sizing: border-box; width: 100%; min-height: 55px; max-height: 110px; resize: vertical; transition: border-color 0.3s, box-shadow 0.3s; font-family: inherit;"></textarea>
        </div>
        
        <!-- Collapsible Folders & Categories Spoiler -->
        <div class="modal-accordion-wrapper" style="border: 1px solid var(--border-glass, rgba(255,255,255,0.08)); border-radius: 12px; overflow: hidden; width: 100%; box-sizing: border-box;">
          <button id="addWordFoldersToggle" type="button" class="modal-accordion-toggle" style="width: 100%; background: rgba(255,255,255,0.03); border: none; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; outline: none; color: var(--text-sub); font-size: 0.76rem; font-weight: 700; text-transform: uppercase; transition: background 0.2s;">
            <span style="display: flex; align-items: center; gap: 6px;"><svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg><span>Папки и категории</span></span>
            <span id="addWordFoldersChevron" style="font-size: 0.65rem; transition: transform 0.25s;">▼</span>
          </button>
          <div id="addWordFoldersPanel" style="display: none; padding: 10px 12px 12px; flex-direction: column; gap: 10px; box-sizing: border-box;">
            <div style="display: flex; flex-direction: column; gap: 4px; width: 100%; box-sizing: border-box;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase;">Папки (выберите одну или несколько):</label>
              <div id="manualCategoryPillsContainer" style="display: flex; flex-wrap: wrap; gap: 6px; padding: 8px; border-radius: 10px; min-height: 38px; box-sizing: border-box;"></div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; width: 100%; box-sizing: border-box;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase;">Категории (выберите одну или несколько):</label>
              <div id="manualWordCustomCategoryPillsContainer" style="display: flex; flex-wrap: wrap; gap: 6px; padding: 8px; border-radius: 10px; min-height: 38px; box-sizing: border-box;"></div>
            </div>
          </div>
        </div>
        
        <!-- Smart Input Settings -->
        <div style="border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; overflow: hidden;">
          <button id="addWordSettingsToggle" style="width: 100%; background: rgba(255,255,255,0.03); border: none; padding: 9px 14px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; outline: none; color: var(--text-sub); font-size: 0.75rem; font-weight: 600; transition: background 0.2s;">
            <span style="display: flex; align-items: center; gap: 6px;"><svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span>Settings умного ввода</span></span>
            <span id="addWordSettingsChevron" style="font-size: 0.65rem; transition: transform 0.25s;">▼</span>
          </button>
          <div id="addWordSettingsPanel" style="display: none; padding: 10px 14px 12px; background: rgba(0,0,0,0.15); flex-direction: column; gap: 10px;">
            <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; gap: 10px;">
              <span style="font-size: 0.8rem; color: var(--text-main);">Авто-заглавная первая буква</span>
              <input type="checkbox" id="settingAutoCapitalize" style="width: 16px; height: 16px; accent-color: #a78bfa; cursor: pointer;">
            </label>
            <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; gap: 10px;">
              <span style="font-size: 0.8rem; color: var(--text-main);">Авто-исправление раскладки</span>
              <input type="checkbox" id="settingAutoLayout" style="width: 16px; height: 16px; accent-color: #a78bfa; cursor: pointer;">
            </label>
          </div>
        </div>

        <button id="saveManualWordBtn" style="background: var(--accent-spotify); color: #000000; font-weight: 700; font-size: 0.9rem; border: none; border-radius: 20px; padding: 12px 0; margin-top: 10px; cursor: pointer; transition: all 0.2s; outline: none; box-shadow: 0 4px 15px rgba(29,185,84,0.3); width: 100%;">
          Сохранить
        </button>
      </div>
    </div>
  </div>

  <!-- Edit Word / Phrase Modal -->
  <div class="modal-overlay" id="editWordModal" style="display: none; z-index: 10200;">
    <div class="modal-card" style="max-width: 420px; width: 95%; height: auto; max-height: 85vh; overflow-y: auto; padding: 2rem; box-sizing: border-box;">
      <div class="modal-header" style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; margin-bottom: 20px; box-sizing: border-box; width: 100%; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-main); font-weight: 700; display: flex; align-items: center;"><svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 6px;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg><span>Редактировать</span></h3>
        <button id="closeEditWordModalBtn" style="background: none; border: none; color: var(--text-sub); font-size: 1.2rem; cursor: pointer; outline: none;">✕</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 15px; width: 100%; box-sizing: border-box;">

        <div style="display: flex; flex-direction: column; gap: 6px; width: 100%; box-sizing: border-box;">
          <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase;">Слово или фраза (EN):</label>
          <input type="text" id="editWordEngInput" lang="en" autocorrect="off" autocapitalize="off"
            style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 10px 12px; color: var(--text-main); font-size: 0.9rem; outline: none; box-sizing: border-box; width: 100%; transition: border-color 0.3s, box-shadow 0.3s;">
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px; width: 100%; box-sizing: border-box;">
          <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase;">Перевод (RU):</label>
          <input type="text" id="editWordRusInput" lang="ru" autocorrect="off" autocapitalize="off"
            style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 10px 12px; color: var(--text-main); font-size: 0.9rem; outline: none; box-sizing: border-box; width: 100%; transition: border-color 0.3s, box-shadow 0.3s;">
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px; width: 100%; box-sizing: border-box;">
          <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase;">Значение / Толкование (необязательно):</label>
          <textarea id="editWordDefinitionInput" placeholder="Толкование или контекстное значение..."
            style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 10px 12px; color: var(--text-main); font-size: 0.9rem; outline: none; box-sizing: border-box; width: 100%; min-height: 60px; max-height: 120px; resize: vertical; transition: border-color 0.3s, box-shadow 0.3s; font-family: inherit;"></textarea>
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px; width: 100%; box-sizing: border-box;">
          <label style="font-size: 0.75rem; font-weight: 700; color: #60a5fa; text-transform: uppercase;"><svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg> Правило / Грамматика (необязательно):</label>
          <textarea id="editWordRuleInput" placeholder="Грамматическое правило или заметка..."
            style="background: rgba(0,0,0,0.25); border: 1px solid rgba(96,165,250,0.2); border-radius: 10px; padding: 10px 12px; color: var(--text-main); font-size: 0.9rem; outline: none; box-sizing: border-box; width: 100%; min-height: 55px; max-height: 110px; resize: vertical; transition: border-color 0.3s, box-shadow 0.3s; font-family: inherit;"></textarea>
        </div>

        <!-- Collapsible Folders & Categories Spoiler -->
        <div class="modal-accordion-wrapper" style="border: 1px solid var(--border-glass, rgba(255,255,255,0.08)); border-radius: 12px; overflow: hidden; width: 100%; box-sizing: border-box;">
          <button id="editWordFoldersToggle" type="button" class="modal-accordion-toggle" style="width: 100%; background: rgba(255,255,255,0.03); border: none; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; outline: none; color: var(--text-sub); font-size: 0.76rem; font-weight: 700; text-transform: uppercase; transition: background 0.2s;">
            <span style="display: flex; align-items: center; gap: 6px;"><svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg><span>Папки и категории</span></span>
            <span id="editWordFoldersChevron" style="font-size: 0.65rem; transition: transform 0.25s;">▼</span>
          </button>
          <div id="editWordFoldersPanel" style="display: none; padding: 10px 12px 12px; flex-direction: column; gap: 10px; box-sizing: border-box;">
            <div style="display: flex; flex-direction: column; gap: 4px; width: 100%; box-sizing: border-box;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase;">Папки (выберите одну или несколько):</label>
              <div id="editWordCategoryPillsContainer" style="display: flex; flex-wrap: wrap; gap: 6px; padding: 8px; border-radius: 10px; min-height: 38px; box-sizing: border-box;"></div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; width: 100%; box-sizing: border-box;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase;">Категории (выберите одну или несколько):</label>
              <div id="editWordCustomCategoryPillsContainer" style="display: flex; flex-wrap: wrap; gap: 6px; padding: 8px; border-radius: 10px; min-height: 38px; box-sizing: border-box;"></div>
            </div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; width: 100%; margin-top: 6px;">
          <button id="editWordSaveModalBtn" style="background: linear-gradient(135deg, #a78bfa, #7c3aed); color: #ffffff; font-weight: 700; font-size: 0.9rem; border: none; border-radius: 14px; padding: 12px 0; cursor: pointer; transition: all 0.2s; outline: none; box-shadow: 0 4px 15px rgba(167,139,250,0.3); width: 100%;">
            <svg class="ui-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 6px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><span>Сохранить изменения</span>
          </button>
          <button id="editWordDeleteModalBtn" type="button" style="background: rgba(244, 63, 94, 0.08); border: 1px solid rgba(244, 63, 94, 0.25); color: #f43f5e; font-weight: 700; font-size: 0.85rem; border-radius: 14px; padding: 10px 0; cursor: pointer; transition: all 0.2s; outline: none; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            <span>Удалить слово из словаря</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Manage Folders Modal -->
  <div class="modal-overlay" id="manageFoldersModal" style="display: none; z-index: 10060;">
    <div class="modal-card" style="max-width: 400px; display: flex; flex-direction: column; overflow: hidden; height: 75vh; max-height: 600px;">
      <div class="modal-header">
        <h3 style="display: flex; align-items: center; gap: 8px;">
          <svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span>Управление папками</span>
        </h3>
        <button class="modal-close-btn" id="closeManageFoldersBtn" >✕</button>
      </div>
      <div class="modal-body" style="flex-grow: 1; overflow-y: auto; padding: 16px; background: rgba(0,0,0,0.1);">
        <p style="font-size: 0.8rem; margin-bottom: 16px; color: var(--text-sub);">
          Отключите папки, которые вы хотите временно скрыть. Слова из скрытых папок не будут появляться в словаре и тренировках, пока вы их не включите снова.
        </p>
        <div id="manageFoldersList" style="display: flex; flex-direction: column; gap: 8px;">
          <!-- Folder items injected via JS -->
        </div>
      </div>
    </div>
  </div>

  <!-- ======================================================== -->
`;

if (typeof window !== 'undefined') {
  window.DICT_MODALS_HTML = DICT_MODALS_HTML;
}
