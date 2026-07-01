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
        console.log('[Gamification] Streak reset to 0 due to inactivity');
    }
}

/**
 * Начисляет XP и обновляет стрик
 * @param {number} amount Количество опыта (например, 2, 50, 100)
 * @param {string} reason Причина (необязательно)
 * @param {Event|HTMLElement} sourceElement Элемент/событие для привязки всплывающей анимации
 */
window.awardXP = function(amount, reason = '', sourceElement = null) {
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
        console.log(`[Gamification] Streak increased to ${currentStreak}! 🔥`);
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

// Запуск при загрузке документа
document.addEventListener('DOMContentLoaded', initGamification);
