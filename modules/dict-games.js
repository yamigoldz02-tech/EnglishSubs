// @ts-check
/// <reference path="./types.js" />
/**
 * @file modules/dict-games.js
 * @description Educational mini-games for vocabulary practice in AI Lyric-Trainer:
 * 1. Match Game (Quizlet-style tile matching)
 * 2. Learn Mode (Multiple-choice 4-option quiz with Leitner progress adjustment)
 * 3. AI Roleplay Simulator (Interactive situational conversation with Gemini/OpenRouter)
 * 
 * @AI-SECTION: DICT_MINI_GAMES
 */

/**
 * Fisher-Yates array shuffler.
 * @template T
 * @param {T[]} array 
 * @returns {T[]}
 */
function shuffleFisherYates(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. MATCH GAME (Quizlet Mode)
// ─────────────────────────────────────────────────────────────────────────────

let matchInterval = null;
let matchStartTime = 0;
let selectedTile = null;
let matchCompletedCount = 0;
let currentMatchTimerValue = 0;

function startMatchGame() {
  const personalDictionary = window.personalDictionary || [];
  if (!personalDictionary || personalDictionary.length < 6) {
    alert('Сохраните больше слов для игры (минимум 6)! 🎮');
    return;
  }

  const dictStandardView = document.getElementById('dictStandardView');
  const dictMatchView = document.getElementById('dictMatchView');
  const matchTimerEl = document.getElementById('matchTimer');
  const matchGrid = document.getElementById('matchGrid');

  // Pick 6 random words
  const shuffledWords = shuffleFisherYates([...personalDictionary]);
  const selected6 = shuffledWords.slice(0, 6);

  // Create 12 tiles
  let tiles = [];
  selected6.forEach((item, idx) => {
    tiles.push({ pairId: idx, text: item.word, type: 'en' });
    tiles.push({ pairId: idx, text: item.translation, type: 'ru' });
  });

  // Shuffle tiles
  shuffleFisherYates(tiles);

  // Render tiles
  if (matchGrid) {
    matchGrid.innerHTML = '';
    tiles.forEach(tileData => {
      const tile = document.createElement('div');
      tile.className = 'match-tile';
      tile.textContent = tileData.text;
      tile.dataset.pairId = String(tileData.pairId);
      tile.dataset.type = tileData.type;

      tile.addEventListener('click', () => handleTileClick(tile));
      matchGrid.appendChild(tile);
    });
  }

  // Switch views
  if (dictStandardView) dictStandardView.style.display = 'none';
  if (dictMatchView) dictMatchView.style.display = 'flex';

  // Start timer
  matchStartTime = Date.now();
  matchCompletedCount = 0;
  selectedTile = null;
  if (matchInterval) clearInterval(matchInterval);

  matchInterval = setInterval(() => {
    const elapsed = (Date.now() - matchStartTime) / 1000;
    if (matchTimerEl) matchTimerEl.textContent = elapsed.toFixed(1) + 's';
    currentMatchTimerValue = elapsed;
  }, 100);
}

function handleTileClick(tile) {
  if (tile.classList.contains('matched') || tile.classList.contains('selected') || tile.classList.contains('wrong')) {
    return;
  }

  if (!selectedTile) {
    tile.classList.add('selected');
    selectedTile = tile;
  } else {
    const first = selectedTile;
    const second = tile;

    if (first === second) return;

    const id1 = first.dataset.pairId;
    const type1 = first.dataset.type;
    const id2 = second.dataset.pairId;
    const type2 = second.dataset.type;

    if (id1 === id2 && type1 !== type2) {
      // MATCH SUCCESS!
      first.classList.remove('selected');
      first.classList.add('matched');
      second.classList.add('matched');
      
      selectedTile = null;
      matchCompletedCount += 2;

      if (matchCompletedCount === 12) {
        if (matchInterval) clearInterval(matchInterval);
        setTimeout(() => {
          alert(`Отлично! Твое время: ${currentMatchTimerValue.toFixed(1)} сек 🏆🎮`);
          stopMatchGame();
        }, 400);
      }
    } else {
      // MATCH WRONG!
      first.classList.remove('selected');
      first.classList.add('wrong', 'shake-anim');
      second.classList.add('wrong', 'shake-anim');
      selectedTile = null;

      setTimeout(() => {
        first.classList.remove('wrong', 'shake-anim');
        second.classList.remove('wrong', 'shake-anim');
      }, 500);
    }
  }
}

function stopMatchGame() {
  if (matchInterval) {
    clearInterval(matchInterval);
    matchInterval = null;
  }
  const dictStandardView = document.getElementById('dictStandardView');
  const dictMatchView = document.getElementById('dictMatchView');
  if (dictStandardView) dictStandardView.style.display = 'flex';
  if (dictMatchView) dictMatchView.style.display = 'none';
  selectedTile = null;
  matchCompletedCount = 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LEARN MODE (Multiple Choice Quiz Mode)
// ─────────────────────────────────────────────────────────────────────────────

let learnQuestionsList = [];
let learnCurrentIndex = 0;
let learnCorrectAnswersCount = 0;
let learnIsProcessingAnswer = false;

function startLearnGame() {
  const personalDictionary = window.personalDictionary || [];
  if (!personalDictionary || personalDictionary.length < 4) {
    alert('Соберите больше слов для старта (минимум 4)! 📝');
    return;
  }

  const dictStandardView = document.getElementById('dictStandardView');
  const dictMatchView = document.getElementById('dictMatchView');
  const dictLearnView = document.getElementById('dictLearnView');
  const learnGameArea = document.getElementById('learnGameArea');
  const learnResultsView = document.getElementById('learnResultsView');

  // Select up to 10 random words
  const shuffledWords = shuffleFisherYates([...personalDictionary]);
  learnQuestionsList = shuffledWords.slice(0, Math.min(10, shuffledWords.length));
  
  learnCurrentIndex = 0;
  learnCorrectAnswersCount = 0;
  learnIsProcessingAnswer = false;

  // Switch views
  if (dictStandardView) dictStandardView.style.display = 'none';
  if (dictMatchView) dictMatchView.style.display = 'none';
  if (dictLearnView) dictLearnView.style.display = 'flex';
  if (learnGameArea) learnGameArea.style.display = 'flex';
  if (learnResultsView) learnResultsView.style.display = 'none';

  loadLearnQuestion();
}

function loadLearnQuestion() {
  const learnGameArea = document.getElementById('learnGameArea');
  const learnResultsView = document.getElementById('learnResultsView');
  const learnResultCorrect = document.getElementById('learnResultCorrect');
  const learnResultPercent = document.getElementById('learnResultPercent');
  const learnQuestionWord = document.getElementById('learnQuestionWord');
  const learnCurrentQuestion = document.getElementById('learnCurrentQuestion');
  const learnProgressBar = document.getElementById('learnProgressBar');
  const learnAccuracy = document.getElementById('learnAccuracy');
  const learnChoicesGrid = document.getElementById('learnChoicesGrid');
  const personalDictionary = window.personalDictionary || [];

  if (learnCurrentIndex >= learnQuestionsList.length) {
    // Game Over: Show results screen
    if (learnGameArea) learnGameArea.style.display = 'none';
    if (learnResultsView) learnResultsView.style.display = 'flex';

    if (learnResultCorrect) learnResultCorrect.textContent = String(learnCorrectAnswersCount);
    if (learnResultPercent) {
      const pct = Math.round((learnCorrectAnswersCount / learnQuestionsList.length) * 100);
      learnResultPercent.textContent = pct + '%';
    }
    return;
  }

  const targetObj = learnQuestionsList[learnCurrentIndex];
  if (!targetObj) return;

  // Card text
  if (learnQuestionWord) {
    learnQuestionWord.textContent = targetObj.word;
    if (targetObj.word.length > 25) {
      learnQuestionWord.style.fontSize = '1.15rem';
    } else if (targetObj.word.length > 15) {
      learnQuestionWord.style.fontSize = '1.3rem';
    } else {
      learnQuestionWord.style.fontSize = '1.55rem';
    }
  }

  // Stats and progress indicators
  if (learnCurrentQuestion) learnCurrentQuestion.textContent = String(learnCurrentIndex + 1);
  if (learnProgressBar) {
    const pct = Math.round((learnCurrentIndex / learnQuestionsList.length) * 100);
    learnProgressBar.style.width = pct + '%';
  }
  if (learnAccuracy) {
    const acc = learnCurrentIndex === 0 
      ? 100 
      : Math.round((learnCorrectAnswersCount / learnCurrentIndex) * 100);
    learnAccuracy.textContent = String(acc);
  }

  // Generate distractors
  const otherOptions = personalDictionary.filter(w => w.translation !== targetObj.translation);
  const shuffledOthers = shuffleFisherYates([...otherOptions]);
  const distractors = shuffledOthers.slice(0, 3).map(w => w.translation);

  // Combine and shuffle correct + distractors
  const choices = [targetObj.translation, ...distractors];
  shuffleFisherYates(choices);

  // Render choice buttons inside grid
  if (learnChoicesGrid) {
    learnChoicesGrid.innerHTML = '';
    choices.forEach(choiceText => {
      const btn = document.createElement('button');
      btn.className = 'learn-choice-btn';
      btn.textContent = choiceText;
      btn.addEventListener('click', () => handleLearnChoiceClick(btn, choiceText, targetObj.translation));
      learnChoicesGrid.appendChild(btn);
    });
  }
}

function handleLearnChoiceClick(btnEl, chosenText, correctText) {
  if (learnIsProcessingAnswer) return;
  learnIsProcessingAnswer = true;

  const isCorrect = (chosenText === correctText);
  let nextDelay = 1000;

  const learnChoicesGrid = document.getElementById('learnChoicesGrid');
  const learnProgressBar = document.getElementById('learnProgressBar');
  const learnAccuracy = document.getElementById('learnAccuracy');
  const personalDictionary = window.personalDictionary || [];

  if (isCorrect) {
    btnEl.classList.add('correct');
    learnCorrectAnswersCount++;
  } else {
    btnEl.classList.add('incorrect', 'shake-anim');
    nextDelay = 2000;

    // Force highlight correct option in green
    if (learnChoicesGrid) {
      const buttons = learnChoicesGrid.querySelectorAll('.learn-choice-btn');
      buttons.forEach(b => {
        if (b.textContent === correctText) {
          b.classList.add('correct');
        }
      });
    }

    // Reset Leitner progress on mistake in Learn Mode
    const targetObj = learnQuestionsList[learnCurrentIndex];
    if (targetObj) {
      const pIdx = personalDictionary.findIndex(w => w.word.toLowerCase() === targetObj.word.toLowerCase());
      if (pIdx !== -1) {
        personalDictionary[pIdx].level = 0;
        personalDictionary[pIdx].interval = 0;
        personalDictionary[pIdx].nextReview = Date.now();
        if (typeof window.saveDictionaryToStorage === 'function') {
          window.saveDictionaryToStorage();
        }
      }
    }
  }

  if (learnCurrentIndex === learnQuestionsList.length - 1 && learnProgressBar) {
    learnProgressBar.style.width = '100%';
  }

  if (learnAccuracy) {
    const acc = Math.round((learnCorrectAnswersCount / (learnCurrentIndex + 1)) * 100);
    learnAccuracy.textContent = String(acc);
  }

  setTimeout(() => {
    learnCurrentIndex++;
    learnIsProcessingAnswer = false;
    loadLearnQuestion();
  }, nextDelay);
}

function stopLearnGame() {
  const dictStandardView = document.getElementById('dictStandardView');
  const dictLearnView = document.getElementById('dictLearnView');
  if (dictStandardView) dictStandardView.style.display = 'flex';
  if (dictLearnView) dictLearnView.style.display = 'none';
  learnQuestionsList = [];
  learnCurrentIndex = 0;
  learnIsProcessingAnswer = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. AI ROLEPLAY SIMULATOR
// ─────────────────────────────────────────────────────────────────────────────

let roleplayPhrase = '';
let roleplayMessages = [];
let roleplayTurnCount = 0;

async function fetchAIChatResponse(messages) {
  if (typeof window.requireAPIKey === 'function') {
    window.requireAPIKey();
  }
  const currentApiKey = typeof window.getAPIKey === 'function' ? window.getAPIKey() : '';

  if (currentApiKey.startsWith('sk-or-')) {
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${currentApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:63079",
        "X-Title": "AI Lyric Trainer"
      },
      body: JSON.stringify({
        model: "z-ai/glm-4.5-air:free",
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter returned status ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content;
  } else {
    // Default Google Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentApiKey}`;
    const requestBody = {
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  }
}

function startRoleplay(word) {
  roleplayPhrase = word;
  roleplayMessages = [];
  roleplayTurnCount = 0;

  const roleplayModal = document.getElementById('roleplayModal');
  const roleplayTargetWord = document.getElementById('roleplayTargetWord');
  const roleplayChatBody = document.getElementById('roleplayChatBody');
  const roleplayChatInput = /** @type {HTMLInputElement|null} */ (document.getElementById('roleplayChatInput'));
  const roleplayFinishContainer = document.getElementById('roleplayFinishContainer');

  if (roleplayTargetWord) roleplayTargetWord.textContent = word;
  if (roleplayChatBody) roleplayChatBody.innerHTML = '';
  if (roleplayChatInput) roleplayChatInput.value = '';
  if (roleplayFinishContainer) roleplayFinishContainer.style.display = 'none';

  if (roleplayModal && typeof window.openModalEl === 'function') {
    window.openModalEl(roleplayModal);
  }

  const systemPrompt = `You are a helpful English teacher and roleplay companion.
We are practicing the target English phrase/word: "${word}".
Please start a realistic situational roleplay/conversation in English where this phrase would be naturally used.
Rule 1: Keep your responses short and natural (1-2 sentences).
Rule 2: Speak entirely in English.
Rule 3: Gently correct any grammar or spelling mistakes the user makes, and then continue the conversation.
Rule 4: Always keep the conversation interactive, ending with a question or prompt that encourages me to reply.
Start the conversation now by introducing the scenario and giving the first greeting.`;

  appendRoleplayTypingIndicator();
  fetchAIChatResponse([{ role: 'user', content: systemPrompt }])
    .then(reply => {
      removeRoleplayTypingIndicator();
      if (!reply) throw new Error("empty reply");
      roleplayMessages.push({ role: 'assistant', content: reply });
      appendRoleplayMessageBubble(reply, 'ai');
    })
    .catch(err => {
      removeRoleplayTypingIndicator();
      appendRoleplayMessageBubble('Error соединения с ИИ: ' + err.message, 'ai');
    });
}

function handleSendRoleplayMessage() {
  const roleplayChatInput = /** @type {HTMLInputElement|null} */ (document.getElementById('roleplayChatInput'));
  if (!roleplayChatInput) return;
  const userText = roleplayChatInput.value.trim();
  if (!userText) return;

  roleplayChatInput.value = '';
  roleplayMessages.push({ role: 'user', content: userText });
  appendRoleplayMessageBubble(userText, 'user');
  
  roleplayTurnCount++;

  const systemPrompt = `You are a helpful English teacher and roleplay companion.
We are practicing the target English phrase/word: "${roleplayPhrase}".
Please continue the situational roleplay/conversation in English where this phrase would be naturally used.
Rule 1: Keep your responses short and natural (1-2 sentences).
Rule 2: Speak entirely in English.
Rule 3: Gently correct any grammar or spelling mistakes the user makes, and then continue the conversation.
Rule 4: Always keep the conversation interactive, ending with a question or prompt that encourages me to reply.`;

  appendRoleplayTypingIndicator();
  
  const apiMessages = [
    { role: 'user', content: systemPrompt },
    ...roleplayMessages
  ];

  fetchAIChatResponse(apiMessages)
    .then(reply => {
      removeRoleplayTypingIndicator();
      if (!reply) throw new Error("empty reply");
      roleplayMessages.push({ role: 'assistant', content: reply });
      appendRoleplayMessageBubble(reply, 'ai');

      const roleplayFinishContainer = document.getElementById('roleplayFinishContainer');
      if (roleplayTurnCount >= 3 && roleplayFinishContainer) {
        roleplayFinishContainer.style.display = 'flex';
      }
    })
    .catch(err => {
      removeRoleplayTypingIndicator();
      appendRoleplayMessageBubble('Error соединения с ИИ: ' + err.message, 'ai');
    });
}

function appendRoleplayMessageBubble(text, sender) {
  const roleplayChatBody = document.getElementById('roleplayChatBody');
  if (!roleplayChatBody) return;

  const bubble = document.createElement('div');
  bubble.className = `roleplay-bubble ${sender}`;
  bubble.textContent = text;
  bubble.style.whiteSpace = 'pre-wrap';

  roleplayChatBody.appendChild(bubble);
  roleplayChatBody.scrollTop = roleplayChatBody.scrollHeight;
}

function appendRoleplayTypingIndicator() {
  const roleplayChatBody = document.getElementById('roleplayChatBody');
  if (!roleplayChatBody) return;
  removeRoleplayTypingIndicator();

  const bubble = document.createElement('div');
  bubble.className = 'roleplay-bubble ai loading';
  bubble.id = 'roleplayTypingIndicator';
  bubble.innerHTML = `
    <span class="roleplay-dot"></span>
    <span class="roleplay-dot"></span>
    <span class="roleplay-dot"></span>
  `;
  roleplayChatBody.appendChild(bubble);
  roleplayChatBody.scrollTop = roleplayChatBody.scrollHeight;
}

function removeRoleplayTypingIndicator() {
  const ind = document.getElementById('roleplayTypingIndicator');
  if (ind) ind.remove();
}

/**
 * Initializes DOM event listeners for games.
 */
function initDictGamesUI() {
  const startMatchBtn = document.getElementById('startMatchGameBtn');
  const exitMatchBtn = document.getElementById('exitMatchGameBtn');
  const startLearnBtn = document.getElementById('startLearnGameBtn');
  const exitLearnBtn = document.getElementById('exitLearnGameBtn');
  const closeLearnResultsBtn = document.getElementById('closeLearnResultsBtn');
  const roleplayModal = document.getElementById('roleplayModal');
  const closeRoleplayModalBtn = document.getElementById('closeRoleplayModalBtn');
  const sendRoleplayMsgBtn = document.getElementById('sendRoleplayMsgBtn');
  const roleplayChatInput = document.getElementById('roleplayChatInput');
  const finishRoleplayBtn = document.getElementById('finishRoleplayBtn');

  if (startMatchBtn) startMatchBtn.addEventListener('click', startMatchGame);
  if (exitMatchBtn) exitMatchBtn.addEventListener('click', stopMatchGame);
  if (startLearnBtn) startLearnBtn.addEventListener('click', startLearnGame);
  if (exitLearnBtn) exitLearnBtn.addEventListener('click', stopLearnGame);
  if (closeLearnResultsBtn) closeLearnResultsBtn.addEventListener('click', stopLearnGame);

  if (closeRoleplayModalBtn) {
    closeRoleplayModalBtn.addEventListener('click', () => {
      if (roleplayModal && typeof window.closeModalEl === 'function') {
        window.closeModalEl(roleplayModal);
      }
    });
  }
  if (sendRoleplayMsgBtn) {
    sendRoleplayMsgBtn.addEventListener('click', handleSendRoleplayMessage);
  }
  if (roleplayChatInput) {
    roleplayChatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSendRoleplayMessage();
      }
    });
  }
  if (finishRoleplayBtn) {
    finishRoleplayBtn.addEventListener('click', () => {
      if (roleplayModal && typeof window.closeModalEl === 'function') {
        window.closeModalEl(roleplayModal);
      }
      if (typeof window.recordActivity === 'function') {
        window.recordActivity(15);
      }
      alert('Практика успешно завершена! Вам начислено +15 очков активности.');
    });
  }
}

// Auto-bind on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDictGamesUI);
} else {
  initDictGamesUI();
}

// Global exposure
window.startMatchGame = startMatchGame;
window.stopMatchGame = stopMatchGame;
window.startLearnGame = startLearnGame;
window.stopLearnGame = stopLearnGame;
window.startRoleplay = startRoleplay;
window.initDictGamesUI = initDictGamesUI;
