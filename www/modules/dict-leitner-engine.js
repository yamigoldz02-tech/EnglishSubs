// @ts-check
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - LEITNER INTERVAL & DICTIONARY ENGINE
 * Mathematical algorithms for Spaced Repetition (SM-2 / Leitner intervals),
 * dictionary storage persistence, word formatting, and category filtering.
 * @AI-SECTION: DICTIONARY_LEITNER_ENGINE
 * ============================================================================
 */

// ── Level names and interval calculation ──
export const LEITNER_LEVEL_NAMES = ['Новое', 'Уровень 1', 'Уровень 2', 'Уровень 3', 'Уровень 4', 'Уровень 5', 'Уровень 6', 'Уровень 7', 'Мастер'];
export const LEITNER_LEVEL_COLORS = ['#a78bfa','#60a5fa','#34d399','#fbbf24','#f97316','#ef4444','#ec4899','#8b5cf6','#10b981'];

/**
 * Format Russian word forms for days streak/interval (1 день, 2 дня, 5 дней)
 * @param {number} n
 * @returns {string}
 */
export function getStreakWordForm(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'дней';
  if (mod10 === 1) return 'день';
  if (mod10 >= 2 && mod10 <= 4) return 'дня';
  return 'дней';
}

/**
 * Calculate next review interval in days based on Leitner level
 * @param {number} level
 * @returns {number} Days until next review
 */
export function getLeitnerIntervalDays(level) {
  switch (level) {
    case 0: return 0;
    case 1: return 1;
    case 2: return 2;
    case 3: return 4;
    case 4: return 7;
    case 5: return 14;
    case 6: return 30;
    case 7: return 60;
    case 8: return 120;
    default: return Math.max(1, Math.pow(2, level - 1));
  }
}

/**
 * Save active study session progress to localStorage
 */
export function saveStudySession() {
  try {
    const queue = window.sessionWordsQueue || [];
    const current = window.sessionProgressCurrent || 0;
    const total = window.sessionTotalCount || 0;
    const sessionData = {
      queue: queue.map(w => w.word),
      current: current,
      total: total,
      timestamp: Date.now()
    };
    localStorage.setItem('my_saved_study_session', JSON.stringify(sessionData));
  } catch (e) {
    console.warn('[Session] Could not save study session', e);
  }
}

/**
 * Clear saved study session from localStorage
 */
export function clearStudySession() {
  try {
    localStorage.removeItem('my_saved_study_session');
  } catch (e) {
    console.warn('[Session] Could not clear study session', e);
  }
}

/**
 * Get active words count (excluding archived / hidden categories)
 * @returns {number}
 */
export function getActiveWordsCount() {
  const dict = window.personalDictionary || [];
  return dict.filter(w => !w.isArchived).length;
}

/**
 * Format dictionary word safely
 * @param {string} word
 * @returns {string}
 */
export function formatDictionaryWord(word) {
  if (!word || typeof word !== 'string') return '';
  return word.trim();
}

/**
 * Save personal dictionary to localStorage
 */
export function saveDictionaryToStorage() {
  try {
    const dict = window.personalDictionary || [];
    localStorage.setItem('my_personal_dictionary', JSON.stringify(dict));
    if (typeof window.updateSavedWordsCount === 'function') {
      window.updateSavedWordsCount();
    }
  } catch (e) {
    console.error('[DictionaryEngine] Failed to save dictionary to storage', e);
  }
}

// Expose globally for backward compatibility
if (typeof window !== 'undefined') {
  window.getStreakWordForm = getStreakWordForm;
  window.getLeitnerIntervalDays = getLeitnerIntervalDays;
  window.saveStudySession = saveStudySession;
  window.clearStudySession = clearStudySession;
  window.getActiveWordsCount = getActiveWordsCount;
  window.formatDictionaryWord = formatDictionaryWord;
  window.saveDictionaryToStorage = saveDictionaryToStorage;
}
