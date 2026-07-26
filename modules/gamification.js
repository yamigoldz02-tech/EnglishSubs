// @ts-check
/// <reference path="./types.js" />
/**
 * @AI-SECTION: GAMIFICATION_ENGINE
 * Управляет Огоньком дня (Daily Streaks) и Опытом (XP)
 */


const XP_STORAGE_KEY = 'lyric_user_xp';
const STREAK_STORAGE_KEY = 'lyric_streak_days';
const LAST_STUDY_DATE_KEY = 'lyric_last_study_date';

// State
let currentXP = 0;
let currentStreak = 0;
let lastStudyDate = null;

/**
 * Инициализация геймификации при загрузке
 */
function initGamification() {
    currentXP = parseInt(localStorage.getItem(XP_STORAGE_KEY)) || 0;
    currentStreak = parseInt(localStorage.getItem(STREAK_STORAGE_KEY)) || 0;
    lastStudyDate = localStorage.getItem(LAST_STUDY_DATE_KEY);

    checkAndUpdateStreak();
    updateGamificationUI();

    const badge = document.getElementById('userProgressBadge');
    if (badge) {
        badge.addEventListener('click', openGamificationModal);
    }
    const closeBtn = document.getElementById('closeGamificationBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeGamificationModal);
    }
    const modal = document.getElementById('gamificationModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeGamificationModal();
        });
    }
}

/**
 * Проверяет, прошел ли день, и обновляет стрик
 */
function checkAndUpdateStreak() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Полночь сегодня

    if (!lastStudyDate) {
        return; // Первый раз зашел
    }

    const lastDate = new Date(lastStudyDate);
    lastDate.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
        // Пропустил больше одного дня - сбрасываем стрик
        currentStreak = 0;
        localStorage.setItem(STREAK_STORAGE_KEY, currentStreak);
        console.debug('[Gamification] Streak reset to 0 due to inactivity');
    }
}

/**
 * Начисляет XP и обновляет стрик
 * @param {number} amount Количество опыта (например, 2, 50, 100)
 * @param {string} reason Причина (необязательно)
 * @param {Event|HTMLElement} sourceElement Элемент/событие для привязки всплывающей анимации
 */
function awardXP(amount, reason = '', sourceElement = null) {
    // 1. Обновляем XP
    currentXP += amount;
    localStorage.setItem(XP_STORAGE_KEY, currentXP);

    // 2. Обновляем стрик (Огонек)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streakIncreased = false;

    if (!lastStudyDate) {
        currentStreak = 1;
        streakIncreased = true;
    } else {
        const lastDate = new Date(lastStudyDate);
        lastDate.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(today - lastDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            // Зашел на следующий день! Растет стрик!
            currentStreak += 1;
            streakIncreased = true;
        } else if (diffDays > 1) {
            // Пропустил дни, стрик начинается заново
            currentStreak = 1;
            streakIncreased = true;
        }
    }

    lastStudyDate = new Date().toISOString();
    localStorage.setItem(LAST_STUDY_DATE_KEY, lastStudyDate);
    localStorage.setItem(STREAK_STORAGE_KEY, currentStreak);

    // 3. Обновляем UI шапки
    updateGamificationUI();

    // 4. Показываем плавающую анимацию XP
    showXPAnimation(amount, reason, sourceElement);

    if (streakIncreased) {
        console.debug(`[Gamification] Streak increased to ${currentStreak}! 🔥`);
    }
};

/**
 * Обновляет счетчики в интерфейсе
 */
function updateGamificationUI() {
    const xpUI = document.getElementById('xpCountUI');
    const streakUI = document.getElementById('streakCountUI');

    if (xpUI) xpUI.textContent = currentXP;
    if (streakUI) streakUI.textContent = currentStreak;
}

/**
 * Плавающая анимация "+10 XP"
 */
function showXPAnimation(amount, reason, sourceElement) {
    const animEl = document.createElement('div');
    animEl.className = 'xp-float-animation';
    animEl.innerHTML = `+${amount} <span class="xp-text">XP</span>`;

    // Позиционируем
    if (sourceElement && sourceElement instanceof HTMLElement) {
        const rect = sourceElement.getBoundingClientRect();
        animEl.style.left = `${rect.left + rect.width / 2}px`;
        animEl.style.top = `${rect.top}px`;
    } else if (sourceElement && sourceElement.clientX) { // MouseEvent
        animEl.style.left = `${sourceElement.clientX}px`;
        animEl.style.top = `${sourceElement.clientY - 20}px`;
    } else {
        // По умолчанию центрируем внизу экрана
        animEl.style.left = '50%';
        animEl.style.bottom = '150px';
        animEl.style.transform = 'translateX(-50%)';
    }

    // Если это бонус за мастерство или видео
    if (amount >= 50) {
        animEl.classList.add('xp-bonus-animation');
        animEl.innerHTML = amount >= 100 ? `🎬 Просмотрено! +${amount} XP` : `⭐ Выучено! +${amount} XP`;
    }

    document.body.appendChild(animEl);

    // Удаляем после завершения анимации
    setTimeout(() => {
        if (animEl.parentNode) {
            animEl.parentNode.removeChild(animEl);
        }
    }, 1800);
}

/**
 * Определяет ранг игрока на основе XP
 */
function getRankInfo(xp) {
    if (xp < 500) return { title: 'Новичок 🌱', min: 0, max: 500 };
    if (xp < 1500) return { title: 'Искатель 🧭', min: 500, max: 1500 };
    if (xp < 3000) return { title: 'Ученик 📚', min: 1500, max: 3000 };
    if (xp < 6000) return { title: 'Знаток 🧠', min: 3000, max: 6000 };
    if (xp < 10000) return { title: 'Эксперт ⚡', min: 6000, max: 10000 };
    return { title: 'Мастер 👑', min: 10000, max: 20000 };
}

/**
 * Открывает модальное окно достижений и активности
 */
function openGamificationModal() {
    const modal = document.getElementById('gamificationModal');
    if (!modal) return;
    
    // Заполняем показатели
    const streakEl = document.getElementById('modalStreakDays');
    const xpEl = document.getElementById('modalTotalXP');
    if (streakEl) streakEl.textContent = currentStreak;
    if (xpEl) xpEl.textContent = currentXP;

    // Рассчитываем и отображаем ранг
    const rank = getRankInfo(currentXP);
    const rankTitle = document.getElementById('modalRankTitle');
    const rankCurrent = document.getElementById('modalRankCurrent');
    const rankNext = document.getElementById('modalRankNext');
    const rankBar = document.getElementById('modalRankBar');

    if (rankTitle) rankTitle.textContent = rank.title;
    if (rankCurrent) rankCurrent.textContent = `${currentXP} XP`;
    if (rankNext) {
        if (rank.max >= 20000) {
            rankNext.textContent = 'Максимальный ранг!';
        } else {
            rankNext.textContent = `${rank.max - currentXP} XP до следующего ранга`;
        }
    }
    if (rankBar) {
        const percent = Math.min(100, Math.max(0, ((currentXP - rank.min) / (rank.max - rank.min)) * 100));
        rankBar.style.width = `${percent}%`;
    }

    // Вычисляем и отображаем подробную статистику обучения
    const dict = (typeof personalDictionary !== 'undefined' && Array.isArray(personalDictionary)) ? personalDictionary : [];
    const totalWords = dict.length;
    const masteredWords = dict.filter(w => (w.level && w.level >= 5) || (w.interval && w.interval >= 30)).length;
    const learningWords = dict.filter(w => w.level && w.level > 0 && w.level < 5).length;
    const now = Date.now();
    const dueWords = dict.filter(w => !w.nextReview || w.nextReview <= now).length;

    let watchedCount = 0;
    try {
        const savedWatched = localStorage.getItem('galaxy_watched_videos');
        if (savedWatched) watchedCount = JSON.parse(savedWatched).length || 0;
    } catch(e) {}

    let songsCount = 0;
    if (typeof songsData !== 'undefined' && songsData) {
        songsCount = Object.keys(songsData).length;
    }

    const statTotalEl = document.getElementById('modalStatWordsTotal');
    const statMasteredEl = document.getElementById('modalStatWordsMastered');
    const statLearningEl = document.getElementById('modalStatWordsLearning');
    const statDueEl = document.getElementById('modalStatWordsDue');
    const statVideosEl = document.getElementById('modalStatVideosWatched');
    const statSongsEl = document.getElementById('modalStatSongsCount');

    if (statTotalEl) statTotalEl.textContent = totalWords;
    if (statMasteredEl) statMasteredEl.textContent = masteredWords;
    if (statLearningEl) statLearningEl.textContent = learningWords;
    if (statDueEl) statDueEl.textContent = dueWords;
    if (statVideosEl) statVideosEl.textContent = `${watchedCount} / 50 (${Math.round((watchedCount / 50) * 100)}%)`;
    if (statSongsEl) statSongsEl.textContent = songsCount;

    openModalEl(modal);
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
}

/**
 * Закрывает модальное окно достижений
 */
function closeGamificationModal() {
    const modal = document.getElementById('gamificationModal');
    if (!modal) return;
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
    closeModalEl(modal);
}

// Экспорт глобальных методов (Backward Compatibility)
window.awardXP = awardXP;
window.openGamificationModal = openGamificationModal;
window.closeGamificationModal = closeGamificationModal;

// Запуск при загрузке документа
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGamification);
} else {
    initGamification();
}
