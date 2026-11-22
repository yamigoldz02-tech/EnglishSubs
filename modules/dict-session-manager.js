// @ts-check
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - STUDY SESSION & REVIEW LIFECYCLE MANAGER
 * Orchestrates Leitner flashcard training sessions, queue navigation, rating submission,
 * card text scaling, undo history stack, and completion celebration views.
 * @AI-SECTION: DICT_SESSION_MANAGER
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

// Global bridges
const getPersonalDictionary = () => window.personalDictionary || [];
const saveDictionaryToStorage = () => typeof window.saveDictionaryToStorage === 'function' && window.saveDictionaryToStorage();
const getFilteredDictionaryWords = () => typeof window.getFilteredDictionaryWords === 'function' ? window.getFilteredDictionaryWords() : [];
const recordActivity = (pts) => typeof window.recordActivity === 'function' && window.recordActivity(pts);
const renderHeatmap = () => typeof window.renderHeatmap === 'function' && window.renderHeatmap();
const renderDictWeekChart = () => typeof window.renderDictWeekChart === 'function' && window.renderDictWeekChart();
const speakTrainerWord = (text, lang) => typeof window.speakTrainerWord === 'function' ? window.speakTrainerWord(text, lang) : (typeof window.speakText === 'function' && window.speakText(text));

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

  // Ensure Spaced Repetition control buttons and score pills are hidden initially
  if (pills) {
    pills.style.visibility = 'hidden';
    pills.style.opacity = '0';
  }
  const remainingPill = document.getElementById('sessionCountRemaining');
  if (remainingPill) {
    remainingPill.style.visibility = 'hidden';
    remainingPill.style.opacity = '0';
  }
  const learnedPill = document.getElementById('sessionCountLearned');
  if (learnedPill) {
    learnedPill.style.visibility = 'hidden';
    learnedPill.style.opacity = '0';
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
          summaryListEl.textContent = 'Все слова успешно повторены!';
        }
      }
      
      // Refresh streak & habit tracker heatmap on celebration screen
      if (typeof renderHeatmap === 'function') {
        renderHeatmap();
      }

      // Trigger CSS Confetti particle pop!
      triggerConfettiCelebration();
    }
    return;
  }

  // Ensure card starts from the front face (clear flipped class and style transform)
  flashcardInner.classList.remove('is-flipped');
  flashcardInner.style.transform = '';

  // Ensure Spaced Repetition pills and score badges are hidden initially on front face
  const pills = document.getElementById('spacedRepetitionPills');
  if (pills) {
    pills.style.visibility = 'hidden';
    pills.style.opacity = '0';
  }
  const remainingPill = document.getElementById('sessionCountRemaining');
  if (remainingPill) {
    remainingPill.style.visibility = 'hidden';
    remainingPill.style.opacity = '0';
  }
  const learnedPill = document.getElementById('sessionCountLearned');
  if (learnedPill) {
    learnedPill.style.visibility = 'hidden';
    learnedPill.style.opacity = '0';
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
              <div style="font-size: 0.65rem; font-weight: 700; color: #a78bfa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">💡 Значение</div>
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

// renderDictWordsList() is managed in modules/dict-list-view.js

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
    const isCorrect = (rating === 'know' || rating === 'easy');
    const xpAmt = isCorrect ? (item.level === 5 ? 50 : 2) : 0;
    try {
      window.DailyTracker.recordFlashcardReview(item, isCorrect ? 'correct' : 'forgot', xpAmt);
    } catch (e) {
      console.warn('Failed to record flashcard review in DailyTracker:', e);
    }
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

// getFilteredDictionaryWords() is managed in modules/dict-list-view.js


// Global window exposure
if (typeof window !== 'undefined') {
  window.saveStudySession = saveStudySession;
  window.clearStudySession = clearStudySession;
  window.setTrainerCardWord = setTrainerCardWord;
  window.setTrainerCardBackText = setTrainerCardBackText;
  window.shuffleArray = shuffleArray;
  window.startStudySession = startStudySession;
  window.updateSessionProgressUI = updateSessionProgressUI;
  window.triggerConfettiCelebration = triggerConfettiCelebration;
  window.resetFlashcard = resetFlashcard;
  window.showRandomFlashcard = showRandomFlashcard;
  window.renderTrainerCard = renderTrainerCard;
  window.updateUndoButtonVisibility = updateUndoButtonVisibility;
  window.handleUndoReview = handleUndoReview;
  window.handleWordReview = handleWordReview;
}
