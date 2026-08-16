// @ts-check
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - STUDY SESSION & REVIEW LIFECYCLE MANAGER
 * Orchestrates flashcard training sessions, queue navigation, rating submission,
 * undo history stack, and completion celebration views.
 * @AI-SECTION: DICT_SESSION_MANAGER
 * ============================================================================
 */

/**
 * Shuffle an array in-place (Fisher-Yates)
 * @param {Array<any>} array
 * @returns {Array<any>}
 */
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Update the study session progress text and indicators (e.g. 1 / 65)
 */
export function updateSessionProgressUI() {
  const current = window.sessionProgressCurrent || 0;
  const total = window.sessionTotalCount || 0;
  const counterEl = document.getElementById('sessionProgressCounterText');
  if (counterEl) {
    counterEl.textContent = total > 0 ? `${current} / ${total}` : '0 / 0';
  }
}

/**
 * Show victory celebration view on session completion
 */
export function triggerConfettiCelebration() {
  const successView = document.getElementById('sessionSuccessView');
  const trainingModalCard = document.querySelector('.training-modal-card');
  if (successView) {
    successView.style.display = 'flex';
  }
  
  // Render heatmap on completion
  if (typeof window.renderHeatmap === 'function') {
    window.renderHeatmap();
  }

  // Clear persisted session
  if (typeof window.clearStudySession === 'function') {
    window.clearStudySession();
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.shuffleArray = shuffleArray;
  window.updateSessionProgressUI = updateSessionProgressUI;
  window.triggerConfettiCelebration = triggerConfettiCelebration;
}
