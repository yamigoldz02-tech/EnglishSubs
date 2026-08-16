// @ts-check
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - 3D FLASHCARD CONTROLLER MODULE
 * Manages 3D card flipping, visual rendering, sound effects, audio pronunciation,
 * and touch swipe gesture animations.
 * @AI-SECTION: DICT_FLASHCARD_3D
 * ============================================================================
 */

let isFlipping = false;

/**
 * Reset flashcard to front side without animation
 */
export function resetFlashcard() {
  const card = document.getElementById('flashcard');
  if (!card) return;
  card.classList.remove('flipped');
  isFlipping = false;

  // Center the 1/65 counter and hide side counts until flipped
  const remaining = document.getElementById('sessionCountRemaining');
  const learned = document.getElementById('sessionCountLearned');
  if (remaining) {
    remaining.style.opacity = '0';
    remaining.style.visibility = 'hidden';
  }
  if (learned) {
    learned.style.opacity = '0';
    learned.style.visibility = 'hidden';
  }
}

/**
 * Set the English word text on the front of the trainer card
 * @param {string} word
 */
export function setTrainerCardWord(word) {
  const frontWordEl = document.getElementById('trainerCardWord');
  if (frontWordEl) {
    frontWordEl.textContent = word || '';
  }
}

/**
 * Set the translation text on the back of the trainer card
 * @param {string} text
 */
export function setTrainerCardBackText(text) {
  const backWordEl = document.getElementById('trainerCardBackTranslation');
  if (backWordEl) {
    backWordEl.textContent = text || '';
  }
}

/**
 * Pronounce word using Web Speech API
 * @param {string} text
 * @param {string} lang
 */
export function speakTrainerWord(text, lang = 'en-US') {
  if (!('speechSynthesis' in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

/**
 * Render word content onto the 3D trainer card
 * @param {any} wordObj
 */
export function renderTrainerCard(wordObj) {
  if (!wordObj) return;

  setTrainerCardWord(wordObj.word || '');
  setTrainerCardBackText(wordObj.translation || '');

  const categoryBadge = document.getElementById('trainerCardCategoryBadge');
  if (categoryBadge) {
    categoryBadge.textContent = wordObj.category || 'Из песен';
  }

  const contextEl = document.getElementById('trainerCardContext');
  if (contextEl) {
    contextEl.textContent = wordObj.context || '';
    contextEl.style.display = wordObj.context ? 'block' : 'none';
  }

  const levelBadge = document.getElementById('trainerCardLevelBadge');
  if (levelBadge) {
    const level = wordObj.level || 0;
    levelBadge.textContent = `Lvl ${level}`;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.resetFlashcard = resetFlashcard;
  window.setTrainerCardWord = setTrainerCardWord;
  window.setTrainerCardBackText = setTrainerCardBackText;
  window.speakTrainerWord = speakTrainerWord;
  window.renderTrainerCard = renderTrainerCard;
}
