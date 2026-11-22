// @ts-check
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - IRREGULAR VERBS INTERACTIVE TRAINER MODULE
 * Handles interactive training modes: Input typing, 3D Flashcards, and Quiz tests,
 * including keyboard layout auto-conversion, feedback, and XP scoring.
 * @AI-SECTION: IRREGULAR_VERBS_TRAINER
 * ============================================================================
 */

(function() {
  // Helper to escape HTML characters
  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Bridging helpers from irregular-verbs.js
  const isVerbLearned = (v1) => typeof window.isVerbLearned === 'function' ? window.isVerbLearned(v1) : false;
  const getDictEntry = (v1) => typeof window.getDictEntry === 'function' ? window.getDictEntry(v1) : null;
  const recordCorrect = (v1) => typeof window.recordVerbCorrect === 'function' && window.recordVerbCorrect(v1);
  const recordIncorrect = (v1) => typeof window.recordVerbIncorrect === 'function' && window.recordVerbIncorrect(v1);
  const speakForms = (v1, v2, v3) => typeof window.speakIrregularForms === 'function' && window.speakIrregularForms(v1, v2, v3);
  const convertLayout = (el, dir) => typeof window.convertKeyboardLayout === 'function' && window.convertKeyboardLayout(el, dir);
  const MASTERY_THRESHOLD = window.MASTERY_THRESHOLD || 3;

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

  function isTrainerSessionActive() {
    return trainerQueue.length > 0 && trainerCurrentIndex < trainerQueue.length;
  }

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

  // Expose on window
  window.IrregularVerbsTrainer = {
    startTrainer,
    clearTrainerTimer,
    renderTrainerStep,
    isTrainerSessionActive,
    setMode: (m) => { trainerMode = m; },
    setScope: (s) => { trainerScope = s; }
  };
  window.startIrregularVerbsTrainer = startTrainer;
  window.clearIrregularVerbsTrainerTimer = clearTrainerTimer;
  window.isIrregularTrainerActive = isTrainerSessionActive;
})();
