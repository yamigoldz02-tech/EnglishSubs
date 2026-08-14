// @ts-check
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - DAILY ACTIVITY & GEMINI SPARKS TRACKER MODULE
 * Logs and manages granular daily learning metrics, goals, and AI-ready reports.
 * @AI-SECTION: DAILY_STUDY_TRACKER
 * ============================================================================
 */

const DAILY_TRACKER_STORAGE_KEY = 'daily_study_tracker';
const DAILY_GOALS_STORAGE_KEY = 'daily_goals_settings';

/**
 * Default daily goals
 */
const DEFAULT_DAILY_GOALS = {
  cardsTarget: 10,
  videosTarget: 1,
  xpTarget: 50
};

/**
 * Returns today's local ISO date string "YYYY-MM-DD"
 * @param {Date} [date]
 * @returns {string}
 */
function getLocalDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns local time string "HH:MM"
 * @param {Date} [date]
 * @returns {string}
 */
function getLocalTimeString(date = new Date()) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Load full tracker store from localStorage
 * @returns {Object<string, any>}
 */
function loadTrackerStore() {
  try {
    const raw = localStorage.getItem(DAILY_TRACKER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('[DailyTracker] Error reading tracker store:', e);
    return {};
  }
}

/**
 * Save full tracker store to localStorage
 * @param {Object<string, any>} store
 */
function saveTrackerStore(store) {
  try {
    localStorage.setItem(DAILY_TRACKER_STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('[DailyTracker] Error saving tracker store:', e);
  }
}

/**
 * Get current configured daily goals
 * @returns {{ cardsTarget: number, videosTarget: number, xpTarget: number }}
 */
function getDailyGoals() {
  try {
    const raw = localStorage.getItem(DAILY_GOALS_STORAGE_KEY);
    if (raw) {
      return Object.assign({}, DEFAULT_DAILY_GOALS, JSON.parse(raw));
    }
  } catch (e) {
    console.error('[DailyTracker] Error reading goals:', e);
  }
  return Object.assign({}, DEFAULT_DAILY_GOALS);
}

/**
 * Set custom daily goals
 * @param {{ cardsTarget?: number, videosTarget?: number, xpTarget?: number }} newGoals
 */
function setDailyGoals(newGoals) {
  const current = getDailyGoals();
  const updated = Object.assign({}, current, newGoals);
  try {
    localStorage.setItem(DAILY_GOALS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('[DailyTracker] Error saving goals:', e);
  }
  return updated;
}

/**
 * Initializes a day record template if not existing
 * @param {string} dateKey "YYYY-MM-DD"
 * @returns {any}
 */
function createDayTemplate(dateKey) {
  const goals = getDailyGoals();
  return {
    date: dateKey,
    summary: {
      cardsReviewed: 0,
      cardsCorrect: 0,
      cardsMastered: 0,
      newWordsAdded: 0,
      videosWatched: 0,
      songsPracticed: 0,
      shadowingPracticed: 0,
      grammarRulesStudied: 0,
      xpGained: 0,
      streak: 0
    },
    goals: {
      cardsTarget: goals.cardsTarget,
      cardsDone: 0,
      videosTarget: goals.videosTarget,
      videosDone: 0,
      xpTarget: goals.xpTarget,
      xpDone: 0,
      allCompleted: false
    },
    events: [],
    wordsReviewedList: [],
    videosWatchedList: [],
    lastUpdated: Date.now()
  };
}

/**
 * Retrieves data for a specific date (defaults to today)
 * @param {string} [dateKey]
 * @returns {any}
 */
function getDayData(dateKey = getLocalDateKey()) {
  const store = loadTrackerStore();
  let dayData = store[dateKey];

  if (!dayData) {
    dayData = createDayTemplate(dateKey);
    // Fill current streak if available
    try {
      const streak = parseInt(localStorage.getItem('lyric_streak_days') || '0', 10);
      dayData.summary.streak = streak;
    } catch (e) {}
  }

  // Ensure default structures exist
  if (!dayData.events) dayData.events = [];
  if (!dayData.wordsReviewedList) dayData.wordsReviewedList = [];
  if (!dayData.videosWatchedList) dayData.videosWatchedList = [];
  if (!dayData.goals) {
    const goals = getDailyGoals();
    dayData.goals = {
      cardsTarget: goals.cardsTarget,
      cardsDone: dayData.summary?.cardsReviewed || 0,
      videosTarget: goals.videosTarget,
      videosDone: dayData.summary?.videosWatched || 0,
      xpTarget: goals.xpTarget,
      xpDone: dayData.summary?.xpGained || 0,
      allCompleted: false
    };
  }

  return dayData;
}

/**
 * Record a flashcard review event
 * @param {any} wordObj
 * @param {'correct' | 'forgot' | 'easy' | 'hard'} result
 * @param {number} [xpAmount=2]
 */
function recordFlashcardReview(wordObj, result = 'correct', xpAmount = 2) {
  if (!wordObj) return;
  const dateKey = getLocalDateKey();
  const store = loadTrackerStore();
  const day = store[dateKey] || createDayTemplate(dateKey);

  const word = typeof wordObj === 'string' ? wordObj : (wordObj.word || '');
  const translation = typeof wordObj === 'object' ? (wordObj.translation || '') : '';
  const level = typeof wordObj === 'object' ? (wordObj.level || 0) : 0;
  const isMastered = level >= 5 || (wordObj && wordObj.interval >= 30);
  const isCorrect = result === 'correct' || result === 'easy';

  day.summary.cardsReviewed = (day.summary.cardsReviewed || 0) + 1;
  if (isCorrect) day.summary.cardsCorrect = (day.summary.cardsCorrect || 0) + 1;
  if (isMastered) day.summary.cardsMastered = (day.summary.cardsMastered || 0) + 1;

  // Add to words reviewed list (avoid duplicates if same word repeated)
  const existingWordIdx = day.wordsReviewedList.findIndex((w) => w.word.toLowerCase() === word.toLowerCase());
  if (existingWordIdx >= 0) {
    day.wordsReviewedList[existingWordIdx].reviewCount = (day.wordsReviewedList[existingWordIdx].reviewCount || 1) + 1;
    day.wordsReviewedList[existingWordIdx].level = level;
    day.wordsReviewedList[existingWordIdx].lastResult = result;
    day.wordsReviewedList[existingWordIdx].lastTime = getLocalTimeString();
  } else {
    day.wordsReviewedList.push({
      word,
      translation,
      level,
      lastResult: result,
      reviewCount: 1,
      firstTime: getLocalTimeString(),
      lastTime: getLocalTimeString()
    });
  }

  // Add event log
  day.events.unshift({
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    time: getLocalTimeString(),
    type: isMastered ? 'flashcard_mastered' : 'flashcard_review',
    icon: isMastered ? '⭐' : (isCorrect ? '🃏' : '🔄'),
    title: isMastered ? `Слово освоено: «${word}»` : `Повторение: «${word}»`,
    details: translation ? `${translation} (Уровень ${level})` : `Уровень ${level}`,
    result,
    xp: xpAmount
  });

  // Keep events capped at 100 per day to avoid huge storage
  if (day.events.length > 100) day.events = day.events.slice(0, 100);

  // Update goals status
  updateGoalsStatus(day);
  day.lastUpdated = Date.now();

  store[dateKey] = day;
  saveTrackerStore(store);

  // Check goal milestone toast
  checkDailyGoalMilestone(day);
}

/**
 * Record a new word added to dictionary
 * @param {any} wordObj
 */
function recordWordAdded(wordObj) {
  if (!wordObj) return;
  const dateKey = getLocalDateKey();
  const store = loadTrackerStore();
  const day = store[dateKey] || createDayTemplate(dateKey);

  const word = typeof wordObj === 'string' ? wordObj : (wordObj.word || '');
  const translation = typeof wordObj === 'object' ? (wordObj.translation || '') : '';

  day.summary.newWordsAdded = (day.summary.newWordsAdded || 0) + 1;

  day.events.unshift({
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    time: getLocalTimeString(),
    type: 'word_added',
    icon: '➕',
    title: `Добавлено новое слово: «${word}»`,
    details: translation || 'Личный словарь',
    xp: 0
  });

  if (day.events.length > 100) day.events = day.events.slice(0, 100);
  day.lastUpdated = Date.now();

  store[dateKey] = day;
  saveTrackerStore(store);
}

/**
 * Record a video lesson completed
 * @param {string} videoId
 * @param {string} title
 * @param {number|string} lessonNum
 */
function recordVideoWatched(videoId, title, lessonNum) {
  const dateKey = getLocalDateKey();
  const store = loadTrackerStore();
  const day = store[dateKey] || createDayTemplate(dateKey);

  day.summary.videosWatched = (day.summary.videosWatched || 0) + 1;

  // Add to watched list
  day.videosWatchedList.push({
    videoId,
    title: title || `Урок ${lessonNum}`,
    lessonNum,
    time: getLocalTimeString()
  });

  // Add event
  day.events.unshift({
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    time: getLocalTimeString(),
    type: 'video_watched',
    icon: '🎬',
    title: `Пройден урок: ${title || `Урок ${lessonNum}`}`,
    details: `English Galaxy #${lessonNum}`,
    xp: 100
  });

  if (day.events.length > 100) day.events = day.events.slice(0, 100);

  updateGoalsStatus(day);
  day.lastUpdated = Date.now();

  store[dateKey] = day;
  saveTrackerStore(store);

  checkDailyGoalMilestone(day);
}

/**
 * Record a shadowing / dictation exercise
 * @param {string} phrase
 * @param {string} songTitle
 * @param {boolean} isCorrect
 */
function recordShadowingPractice(phrase, songTitle, isCorrect = true) {
  const dateKey = getLocalDateKey();
  const store = loadTrackerStore();
  const day = store[dateKey] || createDayTemplate(dateKey);

  day.summary.shadowingPracticed = (day.summary.shadowingPracticed || 0) + 1;

  day.events.unshift({
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    time: getLocalTimeString(),
    type: 'shadowing',
    icon: '🎧',
    title: isCorrect ? `Диктант: «${phrase.slice(0, 30)}${phrase.length > 30 ? '…' : ''}»` : `Тренировка диктанта`,
    details: songTitle ? `Песня: ${songTitle}` : 'Аудирование',
    result: isCorrect ? 'correct' : 'attempt',
    xp: isCorrect ? 10 : 0
  });

  if (day.events.length > 100) day.events = day.events.slice(0, 100);
  day.lastUpdated = Date.now();

  store[dateKey] = day;
  saveTrackerStore(store);
}

/**
 * Record a grammar exercise / rule studied
 * @param {string} ruleTitle
 */
function recordGrammarActivity(ruleTitle) {
  const dateKey = getLocalDateKey();
  const store = loadTrackerStore();
  const day = store[dateKey] || createDayTemplate(dateKey);

  day.summary.grammarRulesStudied = (day.summary.grammarRulesStudied || 0) + 1;

  day.events.unshift({
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    time: getLocalTimeString(),
    type: 'grammar',
    icon: '📐',
    title: `Грамматика: ${ruleTitle}`,
    details: 'Правила и упражнения',
    xp: 5
  });

  if (day.events.length > 100) day.events = day.events.slice(0, 100);
  day.lastUpdated = Date.now();

  store[dateKey] = day;
  saveTrackerStore(store);
}

/**
 * Record XP earned today
 * @param {number} amount
 * @param {string} reason
 */
function recordXPEarned(amount, reason = '') {
  if (!amount || amount <= 0) return;
  const dateKey = getLocalDateKey();
  const store = loadTrackerStore();
  const day = store[dateKey] || createDayTemplate(dateKey);

  day.summary.xpGained = (day.summary.xpGained || 0) + amount;
  try {
    day.summary.streak = parseInt(localStorage.getItem('lyric_streak_days') || '0', 10);
  } catch (e) {}

  updateGoalsStatus(day);
  day.lastUpdated = Date.now();

  store[dateKey] = day;
  saveTrackerStore(store);
}

/**
 * Recalculates goals status for a day
 * @param {any} day
 */
function updateGoalsStatus(day) {
  const goals = getDailyGoals();
  const cardsDone = day.summary?.cardsReviewed || 0;
  const videosDone = day.summary?.videosWatched || 0;
  const xpDone = day.summary?.xpGained || 0;

  day.goals = {
    cardsTarget: goals.cardsTarget,
    cardsDone,
    videosTarget: goals.videosTarget,
    videosDone,
    xpTarget: goals.xpTarget,
    xpDone,
    allCompleted: (cardsDone >= goals.cardsTarget) && (videosDone >= goals.videosTarget) && (xpDone >= goals.xpTarget)
  };
}

/**
 * Shows milestone toast when daily goal is reached
 * @param {any} day
 */
function checkDailyGoalMilestone(day) {
  if (!day || !day.goals) return;
  const goals = day.goals;
  
  if (goals.cardsDone === goals.cardsTarget && goals.cardsTarget > 0) {
    if (typeof showGoalToast === 'function') {
      showGoalToast(`🎯 Дневная цель по карточкам достигнута (${goals.cardsDone}/${goals.cardsTarget})!`);
    }
  }
  if (goals.videosDone === goals.videosTarget && goals.videosTarget > 0) {
    if (typeof showGoalToast === 'function') {
      showGoalToast(`🎬 Дневная цель по видеоурокам выполнена (${goals.videosDone}/${goals.videosTarget})!`);
    }
  }
}

/**
 * Mini toast notification for goals
 * @param {string} msg
 */
function showGoalToast(msg) {
  let container = document.getElementById('dailyGoalToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'dailyGoalToastContainer';
    container.style.cssText = 'position: fixed; top: 24px; right: 24px; z-index: 200500; display: flex; flex-direction: column; gap: 8px; pointer-events: none;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = 'background: rgba(16, 185, 129, 0.95); border: 1.5px solid rgba(255, 255, 255, 0.2); color: #ffffff; font-weight: 700; font-size: 0.85rem; padding: 12px 20px; border-radius: 12px; box-shadow: 0 10px 30px rgba(16,185,129,0.4); display: flex; align-items: center; gap: 10px; animation: slideInGoalToast 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); pointer-events: auto; backdrop-filter: blur(8px);';
  toast.innerHTML = `<span>${msg}</span>`;

  if (!document.getElementById('goalToastAnimationStyles')) {
    const style = document.createElement('style');
    style.id = 'goalToastAnimationStyles';
    style.textContent = `
      @keyframes slideInGoalToast {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes fadeOutGoalToast {
        to { transform: translateY(-20px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOutGoalToast 0.4s ease forwards';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/**
 * Builds a structured JSON payload for Google Gemini Sparks
 * @param {string} [dateKey]
 * @returns {any}
 */
function generateSparksPayload(dateKey = getLocalDateKey()) {
  const day = getDayData(dateKey);
  const totalWords = (typeof personalDictionary !== 'undefined' && Array.isArray(personalDictionary)) ? personalDictionary.length : 0;
  const currentXP = parseInt(localStorage.getItem('lyric_user_xp') || '0', 10);
  const currentStreak = parseInt(localStorage.getItem('lyric_streak_days') || '0', 10);

  return {
    schemaVersion: "1.0",
    appName: "AI Lyric-Trainer",
    reportDate: day.date,
    generatedAt: new Date().toISOString(),
    userProgress: {
      streakDays: currentStreak,
      totalXP: currentXP,
      totalVocabularySize: totalWords,
      dailyGoals: {
        cardsGoal: day.goals.cardsTarget,
        cardsCompleted: day.summary.cardsReviewed,
        videosGoal: day.goals.videosTarget,
        videosCompleted: day.summary.videosWatched,
        xpGoal: day.goals.xpTarget,
        xpEarnedToday: day.summary.xpGained,
        allGoalsMet: day.goals.allCompleted
      },
      todaySummary: {
        flashcardsReviewed: day.summary.cardsReviewed,
        flashcardsCorrect: day.summary.cardsCorrect,
        flashcardsMastered: day.summary.cardsMastered,
        newWordsAdded: day.summary.newWordsAdded,
        videoLessonsWatched: day.summary.videosWatched,
        shadowingExercises: day.summary.shadowingPracticed,
        grammarRulesStudied: day.summary.grammarRulesStudied,
        totalEventsCount: day.events.length
      },
      wordsStudiedToday: day.wordsReviewedList.slice(0, 30),
      videosWatchedToday: day.videosWatchedList,
      recentTimeline: day.events.slice(0, 20)
    }
  };
}

/**
 * Builds a ready-to-copy Markdown summary for Gemini AI chats
 * @param {string} [dateKey]
 * @returns {string}
 */
function generateMarkdownSummary(dateKey = getLocalDateKey()) {
  const payload = generateSparksPayload(dateKey);
  const up = payload.userProgress;
  const ts = up.todaySummary;
  const dg = up.dailyGoals;

  let md = `# 🎓 Дневной отчет обучения English (AI Lyric-Trainer)\n`;
  md += `**Дата:** ${payload.reportDate} | **🔥 Стрик:** ${up.streakDays} дн. | **✨ Опыт:** ${up.totalXP} XP (+${dg.xpEarnedToday} XP сегодня)\n\n`;

  md += `## 🎯 Выполнение дневных целей:\n`;
  md += `- 🃏 **Карточки слов:** ${dg.cardsCompleted} / ${dg.cardsGoal} (${Math.round((dg.cardsCompleted / (dg.cardsGoal || 1)) * 100)}%)\n`;
  md += `- 🎬 **Видеоуроки:** ${dg.videosCompleted} / ${dg.videosGoal} (${Math.round((dg.videosCompleted / (dg.videosGoal || 1)) * 100)}%)\n`;
  md += `- ⭐ **Статус целей:** ${dg.allGoalsMet ? '✅ Все дневные цели выполнены!' : '⏳ В процессе выполнения'}\n\n`;

  md += `## 📊 Активность за день:\n`;
  md += `- Повторено карточек: **${ts.flashcardsReviewed}** (из них правильно: **${ts.flashcardsCorrect}**, уверенно освоено: **${ts.flashcardsMastered}**)\n`;
  md += `- Добавлено новых слов в словарь: **${ts.newWordsAdded}** (всего в словаре: **${up.totalVocabularySize}**)\n`;
  if (ts.videoLessonsWatched > 0) {
    md += `- Просмотрено уроков курсов: **${ts.videoLessonsWatched}**\n`;
  }
  if (ts.shadowingExercises > 0) {
    md += `- Практика аудирования/диктанта: **${ts.shadowingExercises}** раз\n`;
  }
  if (ts.grammarRulesStudied > 0) {
    md += `- Изучено правил грамматики: **${ts.grammarRulesStudied}**\n`;
  }

  if (up.wordsStudiedToday && up.wordsStudiedToday.length > 0) {
    md += `\n## 📚 Выученные / повторенные слова сегодня (${up.wordsStudiedToday.length}):\n`;
    up.wordsStudiedToday.slice(0, 15).forEach((w) => {
      md += `- **${w.word}** — ${w.translation || '—'} *(Ур. ${w.level || 0}, повторений: ${w.reviewCount || 1})*\n`;
    });
    if (up.wordsStudiedToday.length > 15) {
      md += `- *...и еще ${up.wordsStudiedToday.length - 15} слов.*\n`;
    }
  }

  if (up.videosWatchedToday && up.videosWatchedToday.length > 0) {
    md += `\n## 🎬 Видеоуроки за сегодня:\n`;
    up.videosWatchedToday.forEach((v) => {
      md += `- ${v.title} (Урок #${v.lessonNum})\n`;
    });
  }

  md += `\n---\n*Сгенерировано автоматически для Google Gemini Sparks / AI Assistant.*`;
  return md;
}

/**
 * Builds a shareable URL with a compressed JSON snapshot in the URL hash
 * @param {string} [dateKey]
 * @returns {string}
 */
function exportSnapshotUrl(dateKey = getLocalDateKey()) {
  const payload = generateSparksPayload(dateKey);
  const jsonStr = JSON.stringify(payload);
  // Base64 encode UTF-8
  const base64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  }));
  
  const currentUrl = new URL(window.location.href);
  // Point to sparks.html
  let basePath = currentUrl.pathname;
  if (basePath.endsWith('/index.html') || basePath.endsWith('/')) {
    basePath = basePath.replace(/index\.html$/, '') + 'sparks.html';
  } else if (!basePath.endsWith('sparks.html')) {
    basePath = basePath.substring(0, basePath.lastIndexOf('/') + 1) + 'sparks.html';
  }

  return `${currentUrl.origin}${basePath}#snapshot=${base64}`;
}

/**
 * Decodes snapshot from URL hash
 * @param {string} hash
 * @returns {any|null}
 */
function importSnapshotFromHash(hash) {
  if (!hash || !hash.includes('snapshot=')) return null;
  try {
    const raw = hash.split('snapshot=')[1];
    if (!raw) return null;
    const jsonStr = decodeURIComponent(Array.prototype.map.call(atob(raw), (c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('[DailyTracker] Error importing snapshot:', e);
    return null;
  }
}

// Global exports
window.DailyTracker = {
  getLocalDateKey,
  getLocalTimeString,
  getDayData,
  getDailyGoals,
  setDailyGoals,
  recordFlashcardReview,
  recordWordAdded,
  recordVideoWatched,
  recordShadowingPractice,
  recordGrammarActivity,
  recordXPEarned,
  generateSparksPayload,
  generateMarkdownSummary,
  exportSnapshotUrl,
  importSnapshotFromHash
};
