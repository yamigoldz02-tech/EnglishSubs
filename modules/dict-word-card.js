// @ts-check
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - WORD CARD POPUP MODULE
 * Floating quick-view widget when clicking highlighted words in subtitles.
 * @AI-SECTION: WORD_CARD_POPUP
 * ============================================================================
 */

/* ── Word Card Popup (shown when clicking highlighted words) ── */
let _wordCardDismissHandler = null;

window.showWordCard = function(event, word) {
  if (event) event.stopPropagation();

  // Remove any existing card
  dismissWordCard();

  const targetSpan = event ? event.currentTarget : null;

  // Look up the word in the personal dictionary
  const entry = personalDictionary.find(w => w.word.toLowerCase() === word.toLowerCase());
  if (!entry) return;

  // ── Build Leitner info ──
  const levelNames = ['Новое', 'Уровень 1', 'Уровень 2', 'Уровень 3', 'Уровень 4', 'Уровень 5', 'Уровень 6', 'Уровень 7', 'Мастер'];
  const levelColors = ['#a78bfa','#60a5fa','#34d399','#fbbf24','#f97316','#ef4444','#ec4899','#8b5cf6','#10b981'];
  const level = entry.level !== undefined ? entry.level : 0;
  const levelLabel = levelNames[Math.min(level, 8)];
  const levelColor = levelColors[Math.min(level, 8)];

  let reviewText = 'Сегодня';
  if (entry.nextReview && entry.nextReview > Date.now()) {
    const diffMs = entry.nextReview - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    reviewText = diffDays === 1 ? 'Завтра' : `Через ${diffDays} ${getStreakWordForm(diffDays)}`;
  }

  const translation = entry.translation || '—';
  const category = entry.category || 'Из песен';
  const typeIcon = (entry.type === 'phrase') ? '🎬' : '📖';

  // ── Create card element ──
  const card = document.createElement('div');
  card.id = 'wordCardPopup';
  card.className = 'word-card-popup';
  card.innerHTML = `
    <div class="wcp-header">
      <div class="wcp-word-row">
        <span class="wcp-word">${escapeHTML(entry.word)}</span>
        <span class="wcp-type-badge">${typeIcon}</span>
      </div>
      <button class="wcp-close-btn" onclick="dismissWordCard()">✕</button>
    </div>
    <div class="wcp-translation">${escapeHTML(translation)}</div>
    <div class="wcp-meta">
      <span class="wcp-level-badge" style="background:${levelColor}22;color:${levelColor};border-color:${levelColor}44;">
        ⚡ ${levelLabel}
      </span>
      <span class="wcp-review-badge">📅 ${reviewText}</span>
      <span class="wcp-category-badge">🏷 ${escapeHTML(category)}</span>
    </div>
    <div class="wcp-actions">
      <button class="wcp-btn wcp-speak-btn" onclick="window._wcpSpeak('${escapeHTML(entry.word).replace(/'/g,"\\'")}')">
        🔊 Произнести
      </button>
      <button class="wcp-btn wcp-practice-btn" onclick="window._wcpPractice('${escapeHTML(entry.word).replace(/'/g,"\\'")}')">
        💬 Практика
      </button>
      <button class="wcp-btn wcp-reset-btn" style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.15); color: #f59e0b;" onclick="window._wcpReset('${escapeHTML(entry.word).replace(/'/g,"\\'")}')" title="Обнулить прогресс">
        🔄 Сброс
      </button>
      <button class="wcp-btn wcp-delete-btn" onclick="window._wcpDelete('${escapeHTML(entry.word).replace(/'/g,"\\'")}')">
        🗑 Delete
      </button>
    </div>
  `;

  document.body.appendChild(card);

  // ── Smart positioning (near the span, but clamped to viewport) ──
  if (targetSpan) {
    const rect = targetSpan.getBoundingClientRect();
    const cardW = 280;
    const cardH = 180;
    let left = rect.left + rect.width / 2 - cardW / 2;
    let top  = rect.bottom + 10 + window.scrollY;

    // Clamp horizontally
    left = Math.max(8, Math.min(left, window.innerWidth - cardW - 8));
    // Flip above if too close to bottom
    if (rect.bottom + cardH + 20 > window.innerHeight) {
      top = rect.top + window.scrollY - cardH - 10;
    }

    card.style.left = `${left}px`;
    card.style.top  = `${top}px`;
  } else {
    card.style.left = '50%';
    card.style.top  = '50%';
    card.style.transform = 'translate(-50%, -50%)';
  }

  // ── Animate speaking pulse on the source span ──
  if (targetSpan) {
    targetSpan.classList.add('speaking');
    setTimeout(() => targetSpan.classList.remove('speaking'), 500);
  }

  // ── Dismiss on outside click — but NOT if clicking the notebook button/modal ──
  setTimeout(() => {
    _wordCardDismissHandler = (e) => {
      const notebookBtn = document.getElementById('openNotebookBtn');
      const notebookModal = document.getElementById('notebookModal');
      // Let notebook button and modal handle their own clicks freely
      if (notebookBtn && (notebookBtn === e.target || notebookBtn.contains(e.target))) return;
      if (notebookModal && notebookModal.contains(e.target)) return;
      if (!card.contains(e.target) && e.target !== targetSpan) {
        dismissWordCard();
      }
    };
    document.addEventListener('click', _wordCardDismissHandler);
  }, 50);
};

window.dismissWordCard = function() {
  const existing = document.getElementById('wordCardPopup');
  if (existing) {
    existing.classList.add('wcp-exit');
    setTimeout(() => existing.remove(), 180);
  }
  if (_wordCardDismissHandler) {
    document.removeEventListener('click', _wordCardDismissHandler);
    _wordCardDismissHandler = null;
  }
};

// Action helpers called from card HTML
window._wcpSpeak = function(word) {
  if (typeof speakText === 'function') speakText(word);
};

window._wcpPractice = function(word) {
  dismissWordCard();
  if (typeof window.startRoleplay === 'function') {
    window.startRoleplay(word);
  }
};

window._wcpDelete = async function(word) {
  const confirmed = window.showCustomConfirm
    ? await window.showCustomConfirm('Удаление слова', `Удалить «${word}» из словаря?`, { isDestructive: true })
    : confirm(`Delete «${word}» из словаря?`);
  if (!confirmed) return;
  
  personalDictionary = personalDictionary.filter(w => w.word.toLowerCase() !== word.toLowerCase());
  saveDictionaryToStorage();
  if (typeof renderDictWordsList === 'function') renderDictWordsList();
  if (typeof currentSongKey !== 'undefined' && currentSongKey && typeof renderSong === 'function') {
    renderSong(currentSongKey);
  }
  dismissWordCard();
};

window._wcpReset = async function(word) {
  const confirmed = window.showCustomConfirm
    ? await window.showCustomConfirm('Сброс прогресса', `Обнулить прогресс заучивания для «${word}»?`, { isDestructive: true })
    : confirm(`Обнулить прогресс заучивания для «${word}»?`);
  if (!confirmed) return;
  const entry = personalDictionary.find(w => w.word.toLowerCase() === word.toLowerCase());
  if (entry) {
    entry.level = 0;
    entry.interval = 0;
    entry.nextReview = Date.now();
    saveDictionaryToStorage();
    if (typeof renderDictWordsList === 'function') renderDictWordsList();
    if (typeof resetFlashcard === 'function') resetFlashcard();
    alert(`Прогресс для «${word}» успешно сброшен на ноль.`);
  }
  dismissWordCard();
};
