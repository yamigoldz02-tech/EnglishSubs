/**
 * @AI-SECTION: GRAMMAR_RULES_ENGINE
 * @file modules/grammar-rules.js
 * @description Extracted Grammar Rules Interactive Handbook Module.
 */

// ========================================================
// --- ЛОГИКА СПРАВОЧНИКА ПРАВИЛ ---
// ========================================================

let grammarRules = [];

function initGrammarRules() {
  try {
    const saved = localStorage.getItem('grammar_rules');
    if (saved) {
      grammarRules = JSON.parse(saved);
    } else {
      // Default initial rules for high-value UX
      grammarRules = [
        {
          id: 1,
          title: "Present Simple (Простое настоящее)",
          content: "Используется для регулярных действий, повторяющихся событий, фактов или расписаний.\n\nФормула образования:\n- Утверждение:\n  I / You / We / They + глагол (V1)\n  He / She / It + глагол + -s/-es\n\n- Отрицание:\n  I / You / We / They + do not (don't) + V1\n  He / She / It + does not (doesn't) + V1\n\n- Вопрос:\n  Do + I / you / we / they + V1?\n  Does + he / she / it + V1?\n\nПримеры:\n- I study English every day. (Я учу английский каждый день.)\n- He plays guitar beautifully. (Он прекрасно играет на гитаре.)\n- She doesn't like cold weather. (Ей не нравится холодная погода.)"
        },
        {
          id: 2,
          title: "Условные предложения (Conditionals: Type 0 & 1)",
          content: "Используются для выражения условий и их следствий.\n\nZero Conditional (Реальные факты, законы природы):\nФормула: If + Present Simple, ... Present Simple\nПример: If you heat water to 100 degrees, it boils. (Если нагреть воду до 100 градусов, она закипает.)\n\nFirst Conditional (Реальные будущие события):\nФормула: If + Present Simple, ... Will + V1\nПример: If it rains tomorrow, we will stay at home. (Если завтра пойдет дождь, мы останемся дома.)"
        }
      ];
      localStorage.setItem('grammar_rules', JSON.stringify(grammarRules));
    }
  } catch (e) {
    grammarRules = [];
  }
}

function saveGrammarRules() {
  try {
    localStorage.setItem('grammar_rules', JSON.stringify(grammarRules));
  } catch (e) {
    console.error("Ошибка сохранения правил:", e);
  }
}

function setupRulesUI() {
  let activeEditingRuleId = null;

  const openRulesBtn = document.getElementById('openRulesBtn');
  const closeRulesBtn = document.getElementById('closeRulesBtn');
  const rulesModal = document.getElementById('rulesModal');
  const rulesTabList = document.getElementById('rulesTabList');
  const rulesTabAdd = document.getElementById('rulesTabAdd');
  const rulesListContainer = document.getElementById('rulesListContainer');
  const rulesAddFormContainer = document.getElementById('rulesAddFormContainer');
  const saveRuleBtn = document.getElementById('saveRuleBtn');
  const ruleTitleInput = document.getElementById('ruleTitleInput');
  const ruleContentInput = document.getElementById('ruleContentInput');
  const rulesSearchContainer = document.getElementById('rulesSearchContainer');
  const rulesSearchInput = document.getElementById('rulesSearchInput');

  if (!openRulesBtn || !rulesModal) return;

  // Open modal
  openRulesBtn.addEventListener('click', () => {
    openModalEl(rulesModal);
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden'; // lock scrolling
    if (rulesSearchInput) rulesSearchInput.value = '';
    // Switch to List tab by default
    switchRulesTab('list');
    renderRulesList();
  });

  // Close modal
  const closeModal = () => {
    closeModalEl(rulesModal);
    
    // Disable scroll lock only if no other major modal is open
    const notebookModal = document.getElementById('notebookModal');
    const notebookVisible = notebookModal && notebookModal.classList.contains('is-open');
    const videoCourseModal = document.getElementById('videoCourseModal');
    const videoCourseVisible = videoCourseModal && videoCourseModal.style.display === 'flex';
    const dictionaryModal = document.getElementById('dictionaryModal');
    const dictionaryVisible = dictionaryModal && dictionaryModal.style.display === 'flex';
    const addWordModal = document.getElementById('addWordModal');
    const addWordVisible = addWordModal && addWordModal.style.display === 'flex';
    const addPhraseModal = document.getElementById('addPhraseModal');
    const addPhraseVisible = addPhraseModal && addPhraseModal.style.display === 'flex';
    
    if (!notebookVisible && !videoCourseVisible && !dictionaryVisible && !addWordVisible && !addPhraseVisible) {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
      document.body.style.overflow = ''; // unlock scrolling
    }
  };

  if (closeRulesBtn) {
    closeRulesBtn.addEventListener('click', closeModal);
  }

  // Backdrop click intentionally disabled — use the close button to dismiss

  // Tabs clicking
  if (rulesTabList) {
    rulesTabList.addEventListener('click', () => switchRulesTab('list'));
  }
  if (rulesTabAdd) {
    rulesTabAdd.addEventListener('click', () => {
      activeEditingRuleId = null;
      if (ruleTitleInput) ruleTitleInput.value = '';
      if (ruleContentInput) ruleContentInput.value = '';
      rulesTabAdd.innerHTML = '➕ Добавить правило';
      if (saveRuleBtn) saveRuleBtn.textContent = 'Сохранить правило';
      switchRulesTab('add');
    });
  }

  if (rulesSearchInput) {
    rulesSearchInput.addEventListener('input', () => {
      renderRulesList();
    });
  }

  function switchRulesTab(tab) {
    if (tab === 'list') {
      if (rulesTabList) {
        rulesTabList.classList.add('active');
        rulesTabList.style.color = '#0ea5e9';
        rulesTabList.style.borderBottomColor = '#0ea5e9';
      }
      if (rulesTabAdd) {
        rulesTabAdd.classList.remove('active');
        rulesTabAdd.style.color = 'var(--text-sub)';
        rulesTabAdd.style.borderBottomColor = 'transparent';
        rulesTabAdd.innerHTML = '➕ Добавить правило';
      }
      if (saveRuleBtn) {
        saveRuleBtn.textContent = 'Сохранить правило';
      }
      if (rulesSearchContainer) rulesSearchContainer.style.display = 'flex';
      if (rulesSearchInput) rulesSearchInput.value = '';
      if (rulesListContainer) rulesListContainer.style.display = 'flex';
      if (rulesAddFormContainer) rulesAddFormContainer.style.display = 'none';
      renderRulesList();
    } else {
      if (rulesTabAdd) {
        rulesTabAdd.classList.add('active');
        rulesTabAdd.style.color = '#0ea5e9';
        rulesTabAdd.style.borderBottomColor = '#0ea5e9';
      }
      if (rulesTabList) {
        rulesTabList.classList.remove('active');
        rulesTabList.style.color = 'var(--text-sub)';
        rulesTabList.style.borderBottomColor = 'transparent';
      }
      if (rulesSearchContainer) rulesSearchContainer.style.display = 'none';
      if (rulesListContainer) rulesListContainer.style.display = 'none';
      if (rulesAddFormContainer) rulesAddFormContainer.style.display = 'flex';
      if (ruleTitleInput) ruleTitleInput.focus();
    }
  }

  // Save new rule
  if (saveRuleBtn) {
    saveRuleBtn.addEventListener('click', () => {
      const title = ruleTitleInput.value.trim();
      const content = ruleContentInput.value.trim();

      if (!title || !content) {
        alert("Пожалуйста, заполните оба поля: заголовок правила и текст!");
        return;
      }

      const isEditing = activeEditingRuleId !== null;

      if (isEditing) {
        const existingRule = grammarRules.find(r => r.id === activeEditingRuleId);
        if (existingRule) {
          existingRule.title = title;
          existingRule.content = content;
        }
        activeEditingRuleId = null;
      } else {
        const newRule = {
          id: Date.now(),
          title: title,
          content: content
        };
        grammarRules.push(newRule);
      }

      saveGrammarRules();

      // Clear fields
      ruleTitleInput.value = '';
      ruleContentInput.value = '';

      // Reward activity!
      if (typeof recordActivity === 'function') {
        recordActivity(5); // +5 activity points for creating a grammar rule
      }

      // Briefly animate button to success state
      const origText = isEditing ? 'Сохранить изменения' : 'Сохранить правило';
      const origBg = saveRuleBtn.style.background;
      saveRuleBtn.textContent = isEditing ? `✓ Изменения сохранены!` : `✓ Правило сохранено!`;
      saveRuleBtn.style.background = 'linear-gradient(135deg, #1db954, #16a34a)';
      saveRuleBtn.disabled = true;

      setTimeout(() => {
        saveRuleBtn.textContent = origText;
        saveRuleBtn.style.background = origBg;
        saveRuleBtn.disabled = false;
        // Go back to list tab
        switchRulesTab('list');
      }, 1000);
    });
  }

  // Render Rules List (Accordion)
  function renderRulesList() {
    if (!rulesListContainer) return;
    rulesListContainer.innerHTML = '';

    const searchTerm = rulesSearchInput ? rulesSearchInput.value.trim().toLowerCase() : '';
    const filteredRules = grammarRules.filter(rule => 
      rule.title.toLowerCase().includes(searchTerm)
    );

    if (filteredRules.length === 0) {
      if (searchTerm) {
        rulesListContainer.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; color: var(--text-sub);">
            <span style="font-size: 2.5rem; display: block; margin-bottom: 12px;">🔍</span>
            <p style="font-size: 0.95rem; font-weight: 600; margin: 0 0 6px 0;">Правил с таким названием не найдено.</p>
            <p style="font-size: 0.8rem; margin: 0;">Попробуйте изменить поисковый запрос.</p>
          </div>
        `;
      } else {
        rulesListContainer.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; color: var(--text-sub);">
            <span style="font-size: 3rem; display: block; margin-bottom: 12px;">📐</span>
            <p style="font-size: 0.95rem; font-weight: 600; margin: 0 0 6px 0;">Ваш справочник правил пока пуст.</p>
            <p style="font-size: 0.8rem; margin: 0 0 16px 0;">Добавьте свои первые грамматические правила или заметки во вкладке сверху!</p>
            <button id="rulesEmptyAddBtn" style="background: linear-gradient(135deg, #0ea5e9, #0284c7); border: none; border-radius: 20px; padding: 8px 16px; color: #fff; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">➕ Создать правило</button>
          </div>
        `;
        const emptyAddBtn = document.getElementById('rulesEmptyAddBtn');
        if (emptyAddBtn) {
          emptyAddBtn.addEventListener('click', () => switchRulesTab('add'));
        }
      }
      return;
    }

    filteredRules.forEach(rule => {
      const item = document.createElement('div');
      item.className = 'rules-accordion-item';
      item.dataset.id = rule.id;

      item.innerHTML = `
        <div class="rules-accordion-header">
          <span class="rules-accordion-title">${escapeHTML(rule.title)}</span>
          <span class="rules-accordion-chevron">▼</span>
        </div>
        <div class="rules-accordion-content">
          <div class="rules-accordion-body" style="display: flex; flex-direction: column; width: 100%; box-sizing: border-box;">
            <div style="white-space: pre-wrap; word-break: break-word; color: var(--text-main); font-size: 0.88rem; line-height: 1.5; text-align: left;">${escapeHTML(rule.content)}</div>
            <div style="display: flex; gap: 8px; justify-content: flex-end; width: 100%;">
              <button class="rules-edit-btn" data-id="${rule.id}">
                <span>✏️</span> Изменить
              </button>
              <button class="rules-delete-btn" data-id="${rule.id}">
                <span>🗑️</span> Удалить
              </button>
            </div>
          </div>
        </div>
      `;

      // Accordion click toggle
      const header = item.querySelector('.rules-accordion-header');
      const content = item.querySelector('.rules-accordion-content');

      header.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all other accordion items (optional, but looks highly premium)
        document.querySelectorAll('.rules-accordion-item').forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherContent = otherItem.querySelector('.rules-accordion-content');
            if (otherContent) otherContent.style.maxHeight = '0px';
          }
        });

        if (isActive) {
          item.classList.remove('active');
          content.style.maxHeight = '0px';
        } else {
          item.classList.add('active');
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      });

      // Edit rule click
      const editBtn = item.querySelector('.rules-edit-btn');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // prevent accordion toggle
          activeEditingRuleId = rule.id;
          
          if (ruleTitleInput) ruleTitleInput.value = rule.title;
          if (ruleContentInput) ruleContentInput.value = rule.content;
          
          if (rulesTabAdd) {
            rulesTabAdd.innerHTML = '✏️ Редактирование';
          }
          if (saveRuleBtn) {
            saveRuleBtn.textContent = 'Сохранить изменения';
          }
          
          switchRulesTab('add');
        });
      }

      // Delete rule click
      const deleteBtn = item.querySelector('.rules-delete-btn');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent accordion toggle
        const confirmDelete = confirm(`Вы уверены, что хотите удалить правило "${rule.title}"?`);
        if (confirmDelete) {
          grammarRules = grammarRules.filter(r => r.id !== rule.id);
          saveGrammarRules();
          renderRulesList();
        }
      });

      rulesListContainer.appendChild(item);
    });
  }
}

// ── Mobile Bottom Navigation Bar Sync Controller ──────────────────────────
(function initMobileBottomNav() {
  const homeBtn = document.getElementById('mobileNavHomeBtn');
  const dictBtn = document.getElementById('mobileNavDictBtn');
  const trainBtn = document.getElementById('mobileNavTrainBtn');
  const videoBtn = document.getElementById('mobileNavVideoBtn');
  const notesBtn = document.getElementById('mobileNavNotesBtn');
  const rulesBtn = document.getElementById('mobileNavRulesBtn');

  const openDictEl = document.getElementById('openDictionaryBtn');
  const openTrainEl = document.getElementById('openTrainingBtn');
  const openVideoEl = document.getElementById('openVideoCourseBtn');
  const openNotebookEl = document.getElementById('openNotebookBtn');
  const openRulesEl = document.getElementById('openRulesBtn');

  // Modals overlays mapping
  const dictionaryModal = document.getElementById('dictionaryModal');
  const trainingModal = document.getElementById('trainingModal');
  const videoCourseModal = document.getElementById('videoCourseModal');
  const notebookModal = document.getElementById('notebookModal');
  const rulesModal = document.getElementById('rulesModal');

  const navItems = [homeBtn, dictBtn, rulesBtn, trainBtn, videoBtn, notesBtn];

  function setActiveTab(activeBtn) {
    navItems.forEach(btn => {
      if (btn) btn.classList.toggle('active', btn === activeBtn);
    });
  }

  function closeAllModals() {
    [dictionaryModal, rulesModal, trainingModal, videoCourseModal, notebookModal].forEach(m => {
      if (m) {
        closeModalEl(m);
        m.classList.remove('open');
      }
    });
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
  }

  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      closeAllModals();
      setActiveTab(homeBtn);
    });
  }

  if (dictBtn && openDictEl) {
    dictBtn.addEventListener('click', () => { if (dictionaryModal && dictionaryModal.style.display !== 'none') return;
      closeAllModals();
      openDictEl.click();
      setActiveTab(dictBtn);
    });
  }

  if (trainBtn && openTrainEl) {
    trainBtn.addEventListener('click', () => { if (trainingModal && trainingModal.style.display !== 'none') return;
      closeAllModals();
      openTrainEl.click();
      setActiveTab(trainBtn);
    });
  }

  if (videoBtn && openVideoEl) {
    videoBtn.addEventListener('click', () => { if (videoCourseModal && videoCourseModal.style.display !== 'none') return;
      closeAllModals();
      openVideoEl.click();
      setActiveTab(videoBtn);
    });
  }

  if (notesBtn && openNotebookEl) {
    notesBtn.addEventListener('click', () => { if (notebookModal && notebookModal.style.display !== 'none') return;
      closeAllModals();
      openNotebookEl.click();
      setActiveTab(notesBtn);
    });
  }

  if (rulesBtn && openRulesEl) {
    rulesBtn.addEventListener('click', () => { if (rulesModal && rulesModal.style.display !== 'none') return;
      closeAllModals();
      openRulesEl.click();
      setActiveTab(rulesBtn);
    });
  }

  // Auto-synchronize tab highlighted state when modals are opened or closed via other means (e.g. desktop clicks, inline buttons)
  const observerConfig = { attributes: true, attributeFilter: ['style', 'class'] };

  function syncActiveNavState() {
    if (dictionaryModal && dictionaryModal.style.display !== 'none') {
      setActiveTab(dictBtn);
    } else if (rulesModal && rulesModal.style.display !== 'none') {
      setActiveTab(rulesBtn);
    } else if (trainingModal && trainingModal.style.display !== 'none') {
      setActiveTab(trainBtn);
    } else if (videoCourseModal && videoCourseModal.style.display !== 'none') {
      setActiveTab(videoBtn);
    } else if (notebookModal && (notebookModal.style.display !== 'none' || notebookModal.classList.contains('notebook-drawer-open') || notebookModal.classList.contains('open'))) {
      setActiveTab(notesBtn);
    } else {
      setActiveTab(homeBtn);
    }
  }

  // Observe modals to keep bottom navigation in sync
  [dictionaryModal, rulesModal, trainingModal, videoCourseModal, notebookModal].forEach(modal => {
    if (modal) {
      const observer = new MutationObserver(syncActiveNavState);
      observer.observe(modal, observerConfig);
    }
  });

  // Also listen to close triggers inside notebook
  const notebookClose = document.getElementById('closeNotebookBtn');
  if (notebookClose) {
    notebookClose.addEventListener('click', () => {
      setTimeout(syncActiveNavState, 50);
    });
  }
})();
