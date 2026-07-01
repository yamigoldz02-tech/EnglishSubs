/**
 * ============================================================================
 * AI LYRIC-TRAINER - MAIN CORE CONTROLLER (app.js)
 * ============================================================================
 * TABLE OF CONTENTS (TOC FOR AI & DEVELOPER NAVIGATION):
 * 
 * 00. [Lines ~0001-0174]: Word Editing Modal Helper (openEditWordModal)
 * 01. [Lines ~0175-0629]: Global Modal Helpers & Animation Controllers
 * 02. [Lines ~0630-2138]: Core Application Logic, Player & Subtitles Engine
 * 03. [Lines ~2139-2176]: Speech Synthesis & Auxiliary Functions
 * 04. [Lines ~2177-3290]: Event Listeners & Theme Optimizations
 * 05. [Lines ~3291-7906]: Personal Dictionary & 3D Flashcard Leitner Trainer
 * 06. [Lines ~7907-End ]: Mobile Back Button Support for Modals
 * 
 * EXTERNAL MODULES (In modules/ directory, linked in index.html):
 * - [types.js]: JSDoc @typedef data structure definitions
 * - [gemini-ai.js]: Live AI Integration (Google Gemini 1.5 Flash API)
 * - [shadowing-dictation.js]: Audio Dictation (Shadowing Mode) Engine
 * - [spotify-controller.js]: Spotify Now Playing & Auto-Pause PKCE integration
 * - [grammar-rules.js]: Interactive Grammar Rules Handbook
 * - [notebook-module.js]: Global & Per-Lesson Video Notes Controller
 * - [galaxy-course.js]: YouTube Video Course Tracker (English Galaxy A0)
 * ============================================================================
 */
function openEditWordModal(w, onSaveSuccess) {
  const editModal     = document.getElementById('editWordModal');
  const closeEditBtn  = document.getElementById('closeEditWordModalBtn');
  const engInput      = document.getElementById('editWordEngInput');
  const rusInput      = document.getElementById('editWordRusInput');
  const defInput      = document.getElementById('editWordDefinitionInput');
  const ruleInput     = document.getElementById('editWordRuleInput');
  const catCont       = document.getElementById('editWordCategoryPillsContainer');
  const customCatCont = document.getElementById('editWordCustomCategoryPillsContainer');
  const saveBtn       = document.getElementById('editWordSaveModalBtn');

  if (!editModal) return;

  // ── Populate fields ────────────────────────────────────────────────
  if (engInput)  engInput.value  = w.word        || '';
  if (rusInput)  rusInput.value  = w.translation || '';
  if (defInput)  defInput.value  = w.definition  || '';
  if (ruleInput) ruleInput.value = w.rule        || '';

  const activeCats = w.categories && Array.isArray(w.categories)
    ? w.categories : (w.category ? [w.category] : ['Общее']);
  const activeCustomCats = w.customCategories && Array.isArray(w.customCategories)
    ? w.customCategories : (w.customCategory ? [w.customCategory] : ['Без категории']);

  // ── Populate Folders pills ─────────────────────────────────────────
  if (catCont) {
    catCont.innerHTML = '';
    personalCategories.forEach(cat => {
      const isSelected = activeCats.includes(cat);
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mcat-pill' + (isSelected ? ' selected' : '');
      pill.dataset.cat = cat;
      pill.textContent = `📁 ${cat}`;
      const applyStyle = (sel) => {
        pill.style.cssText = `
          padding: 4px 10px; border-radius: 15px; font-size: 0.72rem; font-weight: 600;
          cursor: pointer; border: 1px solid; transition: all 0.18s; outline: none; white-space: nowrap;
          background: ${sel ? 'rgba(29,185,84,0.2)' : 'rgba(255,255,255,0.04)'};
          color: ${sel ? '#1db954' : 'var(--text-sub)'};
          border-color: ${sel ? 'rgba(29,185,84,0.4)' : 'rgba(255,255,255,0.1)'};
        `;
      };
      applyStyle(isSelected);
      pill.addEventListener('click', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const isOn = pill.classList.contains('selected');
        const allSel = catCont.querySelectorAll('.mcat-pill.selected');
        if (isOn && allSel.length <= 1) return;
        pill.classList.toggle('selected', !isOn);
        applyStyle(!isOn);
      });
      catCont.appendChild(pill);
    });
  }

  // ── Populate Categories pills ──────────────────────────────────────
  if (customCatCont) {
    customCatCont.innerHTML = '';
    const customCatsList = ['Без категории', ...personalCustomCategories];
    customCatsList.forEach(cat => {
      const isSelected = activeCustomCats.includes(cat);
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mcat-pill' + (isSelected ? ' selected' : '');
      pill.dataset.cat = cat;
      pill.textContent = cat === 'Без категории' ? '🏷️ Без категории' : `🏷️ ${cat}`;
      const applyStyle = (sel) => {
        pill.style.cssText = `
          padding: 4px 10px; border-radius: 15px; font-size: 0.72rem; font-weight: 600;
          cursor: pointer; border: 1px solid; transition: all 0.18s; outline: none; white-space: nowrap;
          background: ${sel ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)'};
          color: ${sel ? '#a78bfa' : 'var(--text-sub)'};
          border-color: ${sel ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)'};
        `;
      };
      applyStyle(isSelected);
      pill.addEventListener('click', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const isOn = pill.classList.contains('selected');
        if (cat === 'Без категории') {
          if (!isOn) {
            customCatCont.querySelectorAll('.mcat-pill').forEach(p => {
              p.classList.remove('selected');
              p.style.cssText = 'padding:4px 10px;border-radius:15px;font-size:0.72rem;font-weight:600;cursor:pointer;border:1px solid;transition:all 0.18s;outline:none;white-space:nowrap;background:rgba(255,255,255,0.04);color:var(--text-sub);border-color:rgba(255,255,255,0.1);';
            });
            pill.classList.add('selected'); applyStyle(true);
          }
        } else {
          pill.classList.toggle('selected', !isOn);
          applyStyle(!isOn);
          const nonePill = Array.from(customCatCont.querySelectorAll('.mcat-pill')).find(p => p.dataset.cat === 'Без категории');
          if (!isOn && nonePill) { nonePill.classList.remove('selected'); nonePill.style.cssText = 'padding:4px 10px;border-radius:15px;font-size:0.72rem;font-weight:600;cursor:pointer;border:1px solid;transition:all 0.18s;outline:none;white-space:nowrap;background:rgba(255,255,255,0.04);color:var(--text-sub);border-color:rgba(255,255,255,0.1);'; }
          if (customCatCont.querySelectorAll('.mcat-pill.selected').length === 0 && nonePill) {
            nonePill.classList.add('selected'); applyStyle.call(nonePill, true);
            nonePill.style.cssText = 'padding:4px 10px;border-radius:15px;font-size:0.72rem;font-weight:600;cursor:pointer;border:1px solid;transition:all 0.18s;outline:none;white-space:nowrap;background:rgba(167,139,250,0.2);color:#a78bfa;border-color:rgba(167,139,250,0.4);';
          }
        }
      });
      customCatCont.appendChild(pill);
    });
  }

  // ── Smart input ────────────────────────────────────────────────────
  if (engInput)  engInput.oninput  = () => applyLayoutFix(engInput,  'cyrToLat');
  if (rusInput)  rusInput.oninput  = () => applyLayoutFix(rusInput,  'latToCyr');

  // ── Open modal ─────────────────────────────────────────────────────
  openModalEl(editModal);
  setTimeout(() => { if (engInput) engInput.focus(); }, 120);

  // ── Close handlers ─────────────────────────────────────────────────
  const doClose = () => {
    closeModalEl(editModal);
    if (saveBtn) { saveBtn.textContent = '💾 Сохранить изменения'; saveBtn.style.background = 'linear-gradient(135deg, #a78bfa, #7c3aed)'; saveBtn.disabled = false; }
    if (closeEditBtn) closeEditBtn.onclick = null;
    if (saveBtn) saveBtn.onclick = null;
  };
  if (closeEditBtn) closeEditBtn.onclick = doClose;
  editModal.onclick = (ev) => { if (ev.target === editModal) doClose(); };

  // ── Save handler ───────────────────────────────────────────────────
  if (saveBtn) {
    saveBtn.onclick = () => {
      const rawEng = engInput ? engInput.value.trim() : '';
      const newEng = formatDictionaryWord(rawEng);
      const newRus = rusInput ? rusInput.value.trim() : '';

      const flashField = (el) => {
        el.style.borderColor = '#ef4444';
        el.style.boxShadow = '0 0 0 2px rgba(239,68,68,0.25)';
        setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 1800);
        el.focus();
      };

      if (!newEng) { if (engInput) flashField(engInput); return; }
      if (!newRus) { if (rusInput) flashField(rusInput); return; }

      if (newEng.toLowerCase() !== w.word.toLowerCase()) {
        const isDup = personalDictionary.some(x => x.word.toLowerCase() === newEng.toLowerCase());
        if (isDup) {
          if (engInput) { flashField(engInput); const orig = engInput.placeholder; engInput.placeholder = `⚠ «${newEng}» уже есть в словаре`; setTimeout(() => { engInput.placeholder = orig; }, 2200); }
          return;
        }
      }

      const selectedCats = catCont ? Array.from(catCont.querySelectorAll('.mcat-pill.selected')).map(p => p.dataset.cat) : ['Общее'];
      const cats = selectedCats.length > 0 ? selectedCats : ['Общее'];
      const selectedCustomCats = customCatCont ? Array.from(customCatCont.querySelectorAll('.mcat-pill.selected')).map(p => p.dataset.cat) : ['Без категории'];
      const customCats = selectedCustomCats.length > 0 ? selectedCustomCats : ['Без категории'];

      w.word           = newEng;
      w.translation    = newRus;
      w.definition     = defInput  ? defInput.value.trim()  : (w.definition || '');
      w.rule           = ruleInput ? ruleInput.value.trim() : (w.rule       || '');
      w.categories     = cats;
      w.category       = cats[0];
      w.customCategories = customCats;
      w.customCategory = customCats[0];

      saveDictionaryToStorage();

      saveBtn.textContent = `✅ ${newEng.slice(0, 20)} сохранено!`;
      saveBtn.style.background = 'linear-gradient(135deg, #1db954, #16a34a)';
      saveBtn.disabled = true;

      setTimeout(() => {
        doClose();
        if (onSaveSuccess) onSaveSuccess();
      }, 900);
    };
  }
}
/* ==========================================================================
   AI LYRIC-TRAINER — MODERN INTERACTIVE CONTROLLER (VANILLA JS)
   ========================================================================== */

/* ==========================================================================
   GLOBAL MODAL HELPERS — Flicker-free open/close with CSS animation
   ========================================================================== */

/**
 * Opens a modal element without flicker.
 * Sets display:flex, then triggers .modal-animate-in via double-rAF
 * so the CSS animation always fires exactly once per open.
 */
function openModalEl(el) {
  if (!el) return;
  el.classList.remove('modal-animate-out');
  el.style.display = 'flex';
  el.classList.remove('modal-animate-in');
  void el.offsetWidth; // Force CSS reflow
  el.classList.add('modal-animate-in');
}

/**
 * Closes a modal element and plays animation out.
 */
function closeModalEl(el) {
  if (!el) return;
  if (el.style.display === 'none' || el.classList.contains('modal-animate-out')) return;
  el.classList.remove('modal-animate-in');
  el.classList.add('modal-animate-out');
  setTimeout(() => {
    if (el.classList.contains('modal-animate-out')) {
      el.style.display = 'none';
      el.classList.remove('modal-animate-out');
    }
  }, 200);
}

// 1. Fully detailed Song Dataset (Spotify-ready)
const songsData = {
  scorpions: {
    title: "Wind of Change",
    artist: "Scorpions",
    genre: "Classic Rock",
    art: "SC",
    lines: [
      {
        id: "sc-1",
        text: "I follow the Moskva\nDown to Gorky Park\nListening to the wind of change",
        translation: "Я иду вдоль Москвы-реки\nВниз, к Парку Горького\nВслушиваясь в ветер перемен",
        grammar: [
          { highlight: "I follow", text: "— Настоящее простое время (Present Simple). Выражает регулярное физическое действие." },
          { highlight: "the Moskva", text: "— Определенный артикль 'the' всегда употребляется с названиями рек." },
          { highlight: "Listening to", text: "— Причастие настоящего времени (Participle I). Глагол listen всегда управляется предлогом 'to'." }
        ],
        words: [
          { word: "follow", phonetic: "/ˈfɒl.əʊ/", translation: "следовать, идти", definition: "Идти или следовать за кем-то или чем-то." },
          { word: "Moskva", phonetic: "/mɒskˈvɑː/", translation: "Москва-река", definition: "Река, протекающая через город Москву." },
          { word: "listening", phonetic: "/ˈlɪs.ən.ɪŋ/", translation: "вслушиваясь", definition: "Направлять внимание на звук, внимательно слушать." },
          { word: "change", phonetic: "/tʃeɪndʒ/", translation: "перемены", definition: "Процесс перехода от одного состояния к другому, изменение." }
        ]
      },
      {
        id: "sc-2",
        text: "An august summer night\nSoldiers passing by\nListening to the wind of change",
        translation: "Величественной летней ночью\nСолдаты проходят мимо\nВслушиваясь в ветер перемен",
        grammar: [
          { highlight: "An august", text: "— Прилагательное 'august' (с ударением на второй слог) означает 'величественный, священный'. Не путать с месяцем August!" },
          { highlight: "passing by", text: "— Фразовый глагол 'pass by' означает 'проходить мимо'." }
        ],
        words: [
          { word: "august", phonetic: "/ɔːˈɡʌst/", translation: "величественный", definition: "Величественный, священный, вызывающий глубокое уважение." },
          { word: "summer", phonetic: "/ˈsʌm.ər/", translation: "летний", definition: "Самое теплое время года, лето." },
          { word: "soldiers", phonetic: "/ˈsəʊl.dʒəz/", translation: "солдаты", definition: "Люди, служащие в вооруженных силах (армии)." },
          { word: "passing", phonetic: "/ˈpɑː.sɪŋ/", translation: "проходящие", definition: "Двигаться или перемещаться мимо чего-то." }
        ]
      },
      {
        id: "sc-3",
        text: "The world is closing in, and did you ever think\nThat we could be so close like brothers?",
        translation: "Мир сжимается, и думал ли ты когда-нибудь\nЧто мы сможем быть так близки, как братья?",
        grammar: [
          { highlight: "closing in", text: "— Фразовый глагол 'close in' означает 'сжиматься, окружать, сближаться'." },
          { highlight: "did you ever think", text: "— Вопросительная конструкция в Past Simple для выражения прошедшего опыта." },
          { highlight: "could be", text: "— Модальный глагол 'could' выражает физическую возможность в прошлом или сослагательном наклонении." }
        ],
        words: [
          { word: "world", phonetic: "/wɜːld/", translation: "мир", definition: "Наша планета Земля со всеми её жителями и странами." },
          { word: "think", phonetic: "/θɪŋk/", translation: "думать", definition: "Размышлять, иметь определенное мнение или идею." },
          { word: "close", phonetic: "/kləʊs/", translation: "близкие", definition: "Находящийся на очень малом расстоянии или интимный, душевный." },
          { word: "brothers", phonetic: "/ˈbrʌð.əz/", translation: "братья", definition: "Сыновья одних родителей или очень близкие по духу люди." }
        ]
      },
      {
        id: "sc-4",
        text: "The future's in the air, I can feel it everywhere\nI'm blowing with the wind of change",
        translation: "Будущее витает в воздухе, я чувствую его повсюду\nЯ лечу по направлению ветра перемен",
        grammar: [
          { highlight: "future's", text: "— Сокращение от 'future is' (будущее есть)." },
          { highlight: "in the air", text: "— Идиома, означающая 'ощущаться всеми, витать в воздухе'." },
          { highlight: "I'm blowing", text: "— Глагол в форме Present Continuous от 'to blow', выражает длящееся действие от первого лица." }
        ],
        words: [
          { word: "future", phonetic: "/ˈfjuː.tʃər/", translation: "будущее", definition: "Время, которое наступит после настоящего момента." },
          { word: "feel", phonetic: "/fiːl/", translation: "чувствовать", definition: "Испытывать физическое или эмоциональное ощущение." },
          { word: "everywhere", phonetic: "/ˈev.ri.weər/", translation: "повсюду", definition: "Во всех местах, в любой точке." },
          { word: "blowing", phonetic: "/ˈbləʊ.ɪŋ/", translation: "дующий, летящий", definition: "Создающий поток воздуха, летящий по направлению ветра." }
        ]
      },
      {
        id: "sc-5",
        text: "Take me to the magic of the moment\nOn a glory night\nWhere the children of tomorrow dream away\nIn the wind of change",
        translation: "Перенеси меня в волшебство этого момента\nВ эту славную ночь\nГде дети завтрашнего дня мечтают и улетают в мыслях\nПопутно ветру перемен",
        grammar: [
          { highlight: "Take me to", text: "— Повелительное наклонение (Imperative Mode). Выражает просьбу или команду." },
          { highlight: "dream away", text: "— Фразовый глагол 'dream away' означает 'проводить время в мечтах, витать в облаках'." },
          { highlight: "children of tomorrow", text: "— Поэтическое выражение с предлогом родительного падежа 'of'." }
        ],
        words: [
          { word: "magic", phonetic: "/ˈmædʒ.ɪk/", translation: "волшебство", definition: "Сверхъестественная или завораживающая таинственная сила." },
          { word: "moment", phonetic: "/ˈməʊ.mənt/", translation: "мгновение, момент", definition: "Очень короткий, краткий промежуток времени." },
          { word: "glory", phonetic: "/ˈɡlɔː.ri/", translation: "слава, славный", definition: "Почет, величие, триумф и всеобщее признание." },
          { word: "tomorrow", phonetic: "/təˈmɒr.əʊ/", translation: "завтра", definition: "День, наступающий сразу после сегодняшнего." }
        ]
      },
      {
        id: "sc-6",
        text: "Walking down the street\nAnd distant memories are buried in the past forever",
        translation: "Прогуливаясь по улице\nИ далекие воспоминания погребены в прошлом навсегда",
        grammar: [
          { highlight: "Walking down", text: "— Деепричастие настоящего времени (Present Participle) в роли обстоятельства образа действия." },
          { highlight: "are buried", text: "— Страдательный залог (Present Simple Passive) от глагола bury (хоронить, погребать)." }
        ],
        words: [
          { word: "walking", phonetic: "/ˈwɔː.kɪŋ/", translation: "гуляющий", definition: "Движение пешком, пешая прогулка." },
          { word: "distant", phonetic: "/ˈdɪs.tənt/", translation: "далекий", definition: "Находящийся далеко в пространстве или во времени." },
          { word: "memories", phonetic: "/ˈmem.ər.iz/", translation: "воспоминания", definition: "Мысленные образы прошлых событий." },
          { word: "buried", phonetic: "/ˈber.id/", translation: "погребенный", definition: "Похороненный, скрытый под землей или глубоко в памяти." }
        ]
      },
      {
        id: "sc-7",
        text: "I follow the Moskva\nDown to Gorky Park\nListening to the wind of change",
        translation: "Я иду вдоль Москвы-реки\nВниз, к Парку Горького\nВслушиваясь в ветер перемен",
        grammar: [
          { highlight: "Listening to", text: "— Повторение куплета для усиления атмосферы единения." }
        ],
        words: [
          { word: "follow", phonetic: "/ˈfɒl.əʊ/", translation: "следовать", definition: "Идти вслед за кем-то." },
          { word: "change", phonetic: "/tʃeɪndʒ/", translation: "перемены", definition: "Изменения в жизни." }
        ]
      },
      {
        id: "sc-8",
        text: "Take me to the magic of the moment\nOn a glory night\nWhere the children of tomorrow dream away\nIn the wind of change",
        translation: "Перенеси меня в волшебство этого момента\nВ эту славную ночь\nГде дети завтрашнего дня мечтают и улетают в мыслях\nПопутно ветру перемен",
        grammar: [
          { highlight: "Take me to", text: "— Повторение припева, призывающее к объединению человечества." }
        ],
        words: [
          { word: "magic", phonetic: "/ˈmædʒ.ɪk/", translation: "волшебство", definition: "Сверхъестественная или завораживающая таинственная сила." },
          { word: "glory", phonetic: "/ˈɡlɔː.ri/", translation: "славный", definition: "Почет, величие, триумф и всеобщее признание." }
        ]
      },
      {
        id: "sc-9",
        text: "The wind of change blows straight\nInto the face of time\nLike a stormwind that will ring\nThe freedom bell for peace of mind\nLet your balalaika sing\nWhat my guitar wants to say",
        translation: "Ветер перемен дует прямо\nВ лицо времени\nСловно ураган, который заставит зазвучать\nКолокол свободы ради душевного покоя\nПусть поет твоя балалайка\nТо, о чем хочет сказать моя гитара",
        grammar: [
          { highlight: "freedom bell", text: "— Составное существительное (колокол свободы)." },
          { highlight: "Let your balalaika sing", text: "— Глагол let с инфинитивом без частицы to (bare infinitive)." },
          { highlight: "wants to say", text: "— Глагол want выражает желание с инфинитивом." }
        ],
        words: [
          { word: "straight", phonetic: "/streɪt/", translation: "прямо", definition: "В прямом направлении, без отклонений в сторону." },
          { word: "stormwind", phonetic: "/ˈstɔːm.wɪnd/", translation: "ураган, буря", definition: "Сильный, порывистый разрушительный ветер." },
          { word: "freedom", phonetic: "/ˈfriː.dəm/", translation: "свобода", definition: "Возможность действовать и мыслить по своей воле." },
          { word: "balalaika", phonetic: "/ˌbæl.əˈlaɪ.kə/", translation: "балалайка", definition: "Русский народный струнный музыкальный инструмент треугольной формы." },
          { word: "guitar", phonetic: "/ɡɪˈtɑːr/", translation: "гитара", definition: "Популярный струнный щипковый музыкальный инструмент." }
        ]
      },
      {
        id: "sc-10",
        text: "Take me to the magic of the moment\nOn a glory night\nWhere the children of tomorrow dream away\nIn the wind of change",
        translation: "Перенеси меня в волшебство этого момента\nВ эту славную ночь\nГде дети завтрашнего дня мечтают и улетают в мыслях\nПопутно ветру перемен",
        grammar: [
          { highlight: "Take me to", text: "— Повторение припева перед финальным угасанием звука." }
        ],
        words: [
          { word: "moment", phonetic: "/ˈməʊ.mənt/", translation: "мгновение, момент", definition: "Очень короткий, краткий промежуток времени." },
          { word: "tomorrow", phonetic: "/təˈmɒr.əʊ/", translation: "завтра", definition: "День, наступающий сразу после сегодняшнего." }
        ]
      }
    ]
  },
  rhcp: {
    title: "Californication",
    artist: "Red Hot Chili Peppers",
    genre: "Alternative Rock",
    art: "RH",
    lines: [
      {
        id: "rh-1",
        text: "Psychic spies from China\nTry to steal your mind's elation\nAnd little girls from Sweden\nDream of silver screen quotation\nAnd if you want these kind of dreams\nIt's Californication",
        translation: "Экстрасенсы-шпионы из Китая\nПытаются украсть ликование твоего разума\nИ маленькие девочки из Швеции\nМечтают о цитатах из кинематографа\nИ если ты хочешь подобных снов —\nЭто Калифорникейшн",
        grammar: [
          { highlight: "Psychic spies", text: "— Существительное во множественном числе spies (шпионы) от spy." },
          { highlight: "mind's elation", text: "— Притяжательный падеж (Possessive Case) с окончанием 's для выражения принадлежности." },
          { highlight: "Dream of", text: "— Глагол dream с предлогом of означает грезить или страстно желать чего-то далекого." }
        ],
        words: [
          { word: "psychic", phonetic: "/ˈsaɪ.kɪk/", translation: "экстрасенсорный", definition: "Относящийся к сверхъестественным экстрасенсорным силам." },
          { word: "spies", phonetic: "/spaɪz/", translation: "шпионы", definition: "Агенты, тайно собирающие секретную информацию." },
          { word: "steal", phonetic: "/stiːl/", translation: "украсть", definition: "Тайно брать чужую вещь без разрешения хозяина." },
          { word: "elation", phonetic: "/iˈleɪ.ʃən/", translation: "ликование", definition: "Состояние бурного восторга, душевного подъема и счастья." },
          { word: "Sweden", phonetic: "/ˈswiː.dən/", translation: "Швеция", definition: "Государство на севере Европы, в Скандинавии." }
        ]
      },
      {
        id: "rh-2",
        text: "It's the edge of the world\nAnd all of Western civilization\nThe sun may rise in the East\nAt least it's settled in a final location\nIt's understood that Hollywood\nSells Californication",
        translation: "Это край света\nИ всей западной цивилизации\nСолнце может вставать на востоке\nНо, по крайней мере, оно обосновалось на своем конечном месте\nПринято считать, что Голливуд\nПродает Калифорникейшн",
        grammar: [
          { highlight: "It's", text: "— Сокращение от 'It is', стандартное начало безличного предложения в английском." },
          { highlight: "edge of the world", text: "— Идиоматический оборот, обозначающий край земли или далекие рубежи." },
          { highlight: "may rise", text: "— Модальный глагол 'may' выражает слабую степень вероятности или возможность." }
        ],
        words: [
          { word: "edge", phonetic: "/edʒ/", translation: "край", definition: "Крайняя линия, граница плоскости или обрыва." },
          { word: "civilization", phonetic: "/ˌsɪv.ɪ.laɪˈzeɪ.ʃən/", translation: "цивилизация", definition: "Уровень общественного развития и материальной культуры." },
          { word: "settled", phonetic: "/ˈset.əld/", translation: "обосновалось", definition: "Обосновавшийся, закрепившийся или решившийся." },
          { word: "location", phonetic: "/ləʊˈkeɪ.ʃən/", translation: "местоположение", definition: "Определенное местонахождение или позиция объекта." }
        ]
      },
      {
        id: "rh-3",
        text: "Pay your surgeon very well\nTo break the spell of aging\nCelebrity skin, is this your chin,\nOr is that war you're waging?",
        translation: "Плати своему хирургу очень хорошо\nЧтобы разрушить чары старения\nКожа знаменитости, это твой подбородок\nИли это война, которую ты ведешь?",
        grammar: [
          { highlight: "To break", text: "— Инфинитив цели (Infinitive of Purpose), отвечающий на вопрос 'зачем? для чего?'." },
          { highlight: "you're waging", text: "— Время Present Continuous для выражения текущего или затяжного процесса ведения войны (to wage a war)." }
        ],
        words: [
          { word: "surgeon", phonetic: "/ˈsɜː.dʒən/", translation: "хирург", definition: "Врач-специалист, занимающийся оперативным лечением больных." },
          { word: "spell", phonetic: "/spel/", translation: "чары, заклятие", definition: "Магические чары, приворот или заклинание." },
          { word: "aging", phonetic: "/ˈeɪ.dʒɪŋ/", translation: "старение", definition: "Естественный биологический процесс старения организма." },
          { word: "waging", phonetic: "/ˈweɪ.dʒɪŋ/", translation: "вести (войну)", definition: "Ведение или ведение активных действий (войны, кампании)." }
        ]
      },
      {
        id: "rh-4",
        text: "Firstborn unicorn\nHardcore soft porn\nDream of Californication\nDream of Californication",
        translation: "Первенец-единорог\nТяжелое порно в мягкой обертке\nМечтай о Калифорникейшн\nМечтай о Калифорникейшн",
        grammar: [
          { highlight: "Firstborn", text: "— Сложное слово (Compound Word), состоящее из 'first' (первый) и 'born' (рожденный)." }
        ],
        words: [
          { word: "firstborn", phonetic: "/ˈfɜːst.bɔːn/", translation: "первенец", definition: "Первый родившийся ребенок в семье." },
          { word: "unicorn", phonetic: "/ˈjuː.nɪ.kɔːn/", translation: "единорог", definition: "Сказочное мифическое животное, конь с одним рогом." },
          { word: "hardcore", phonetic: "/ˌhɑːdˈkɔːr/", translation: "жесткий, бескомпромиссный", definition: "Крайне интенсивный, бескомпромиссный или откровенный." }
        ]
      },
      {
        id: "rh-5",
        text: "Marry me, girl, be my fairy to the world\nBe my very own constellation\nA teenage bride with a baby inside\nGetting high on information\nAnd buy me a star on the boulevard\nIt's Californication",
        translation: "Выходи за меня, девочка, стань моей феей для мира\nСтань моим собственным созвездием\nЮная невеста с ребенком внутри\nКайфующая от избытка информации\nИ купи мне звезду на бульваре —\nЭто Калифорникейшн",
        grammar: [
          { highlight: "Marry me", text: "— Призыв к действию, переходный глагол marry не требует после себя предлога to." },
          { highlight: "Getting high", text: "— Идиоматический фразовый глагол, означающий ловить кайф или быть под кайфом." }
        ],
        words: [
          { word: "marry", phonetic: "/ˈmær.i/", translation: "жениться", definition: "Вступать в брак, жениться или выходить замуж." },
          { word: "constellation", phonetic: "/ˌkɒn.stəˈleɪ.ʃən/", translation: "созвездие", definition: "Группа звезд, образующая узнаваемый рисунок на небе." },
          { word: "boulevard", phonetic: "/ˈbuː.lə.vɑːd/", translation: "бульвар", definition: "Широкая городская улица с аллеями по бокам." }
        ]
      },
      {
        id: "rh-6",
        text: "Pay your surgeon very well\nTo break the spell of aging\nSicker than the rest, there is no test,\nBut this is what you're craving",
        translation: "Плати своему хирургу очень хорошо\nЧтобы разрушить чары старения\nБолен сильнее остальных, тестов нет,\nНо это именно то, чего ты так жаждешь",
        grammar: [
          { highlight: "craving", text: "— Сильнейшее непреодолимое желание (Present Continuous от crave)." }
        ],
        words: [
          { word: "craving", phonetic: "/ˈkreɪ.vɪŋ/", translation: "жажда, вожделение", definition: "Сильное, страстное желание чего-либо." },
          { word: "rest", phonetic: "/rest/", translation: "остальные", definition: "Те, кто остался, другие люди." }
        ]
      },
      {
        id: "rh-7",
        text: "Space may be the final frontier, but it's made in a Hollywood basement\nAnd Cobain, can you hear the spheres, singing songs off station to station?\nAnd Alderaan's not far away\nIt's Californication",
        translation: "Космос может быть последним рубежом, но его снимают в подвале в Голливуде\nИ Кобейн, слышишь ли ты, как сферы поют песни от станции к станции?\nИ Альдераан совсем недалеко —\nЭто Калифорникейшн",
        grammar: [
          { highlight: "frontier", text: "— Американский концепт границы изведанного мира (Дикий Запад, Космос)." },
          { highlight: "made in", text: "— Указание места производства (Past Participle в пассивном залоге)." },
          { highlight: "can you hear", text: "— Использование модального глагола 'can' с глаголами чувственного восприятия." },
          { highlight: "not far away", text: "— Отрицательная конструкция места (недалеко)." }
        ],
        words: [
          { word: "frontier", phonetic: "/ˈfrʌn.tɪər/", translation: "рубеж, граница", definition: "Граница освоенных земель, рубеж изведанного мира." },
          { word: "basement", phonetic: "/ˈbeɪs.mənt/", translation: "подвал", definition: "Подвальный этаж здания ниже уровня земли." },
          { word: "spheres", phonetic: "/sfɪəz/", translation: "сферы", definition: "Космические небесные оболочки или геометрические шары." },
          { word: "Alderaan", phonetic: "/ˈæl.də.rɑːn/", translation: "Альдераан", definition: "Вымышленная планета из вселенной Звездных войн." }
        ]
      },
      {
        id: "rh-8",
        text: "Born and raised by those who praise control of population\nWell, everybody's been there, and I don't mean on vacation\nFirstborn unicorn\nHardcore soft-porn\nDream of Californication\nDream of Californication\nDream of Californication\nDream of Californication",
        translation: "Рожденные и выращенные теми, кто восхваляет контроль над населением\nЧто ж, там побывали все, и я не имею в виду отпуск\nПервенец-единорог\nХардкорное мягкое порно\nМечтай о Калифорникейшн\nМечтай о Калифорникейшн\nМечтай о Калифорникейшн\nМечтай о Калифорникейшн",
        grammar: [
          { highlight: "Born and raised", text: "— Парные причастия прошедшего времени (Past Participle) в роли определения к опущенному местоимению." },
          { highlight: "everybody's been", text: "— Сокращение от 'everybody has been'. Время Present Perfect выражает жизненный опыт к настоящему моменту." },
          { highlight: "don't mean", text: "— Настоящее простое время (Present Simple) в отрицательной форме." }
        ],
        words: [
          { word: "population", phonetic: "/ˌpɒp.jəˈleɪ.ʃən/", translation: "население", definition: "Жители страны, города или всей планеты в целом." },
          { word: "vacation", phonetic: "/veɪˈkeɪ.ʃən/", translation: "отпуск", definition: "Период отдыха от работы или учебы, поездка." },
          { word: "firstborn", phonetic: "/ˈfɜːst.bɔːn/", translation: "первенец", definition: "Первый родившийся ребенок в семье." },
          { word: "unicorn", phonetic: "/ˈjuː.nɪ.kɔːn/", translation: "единорог", definition: "Сказочное мифическое конское существо с одним рогом." },
          { word: "hardcore", phonetic: "/ˌhɑːdˈkɔːr/", translation: "жесткий, бескомпромиссный", definition: "Интенсивный, бескомпромиссный или откровенный." }
        ]
      },
      {
        id: "rh-9",
        text: "Destruction leads to a very rough road\nBut it also breeds creation\nAnd earthquakes are to a girl's guitar\nThey're just another good vibration",
        translation: "Разрушение ведет к очень суровой дороге\nНо оно также порождает созидание\nИ землетрясения для гитары девчонки —\nЭто всего лишь очередное хорошее колебание",
        grammar: [
          { highlight: "leads to", text: "— Фразовый глагол «приводить к чему-то»." },
          { highlight: "breeds", text: "— Порождать, выращивать (Present Simple 3rd person singular)." },
          { highlight: "girl's guitar", text: "— Притяжательный падеж существительного." }
        ],
        words: [
          { word: "destruction", phonetic: "/dɪˈstrʌk.ʃən/", translation: "разрушение", definition: "Процесс разрушения, порчи или уничтожения чего-либо." },
          { word: "rough", phonetic: "/rʌf/", translation: "грубый, суровый", definition: "Неровный, шероховатый или тяжелый, тернистый (о пути)." },
          { word: "breeds", phonetic: "/briːdz/", translation: "порождает", definition: "Давать начало, плодить, вызывать появление чего-либо." },
          { word: "earthquakes", phonetic: "/ˈɜːθ.kweɪks/", translation: "землетрясения", definition: "Подземные толчки, колебания и смещения земной коры." }
        ]
      },
      {
        id: "rh-10",
        text: "Show business shows other plans\nAnd sister's going to go to go\nAnd buy her a star on the boulevard\nIt's Californication",
        translation: "Шоу-бизнес показывает другие планы\nИ сестренка собирается поехать\nИ купить себе звезду на бульваре\nЭто Калифорникейшн",
        grammar: [
          { highlight: "is going to go", text: "— Конструкция 'be going to' выражает твердое намерение." },
          { highlight: "buy her a star", text: "— Двойное дополнение." }
        ],
        words: [
          { word: "boulevard", phonetic: "/ˈbuː.lə.vɑːd/", translation: "бульвар", definition: "Широкая городская улица с аллеями по бокам." },
          { word: "star", phonetic: "/stɑːr/", translation: "звезда", definition: "Светящееся небесное тело или знак знаменитости." },
          { word: "plans", phonetic: "/plænz/", translation: "планы", definition: "Замыслы, намерения или намеченный порядок действий." }
        ]
      },
      {
        id: "rh-11",
        text: "Dream of Californication\nDream of Californication\nDream of Californication\nDream of Californication",
        translation: "Мечтай о Калифорникейшн\nМечтай о Калифорникейшн\nМечтай о Калифорникейшн\nМечтай о Калифорникейшн",
        grammar: [
          { highlight: "Dream of", text: "— Повелительное наклонение с предлогом of." }
        ],
        words: [
          { word: "dream", phonetic: "/driːm/", translation: "мечтать", definition: "Предаваться мечтам, сильно желать чего-то." }
        ]
      }
    ]
  }
};

// State Variables
let currentSongKey = 'scorpions';
let lastRenderedSongKey = null;
let activeLineData = null;
let activeOriginalText = '';
let csvSongs = []; // Array of parsed CSV songs: { id, title, artist, spotifyId, art, genre }
let activeDropdownIndex = -1; // Keyboard index for autocomplete navigation

// Favorites State Layer
let favoriteSongs = JSON.parse(localStorage.getItem('favorite_songs')) || [];

function isSongFavorite(songId) {
  return favoriteSongs.includes(songId);
}

function toggleSongFavorite(songId) {
  const index = favoriteSongs.indexOf(songId);
  if (index === -1) {
    favoriteSongs.push(songId);
  } else {
    favoriteSongs.splice(index, 1);
  }
  localStorage.setItem('favorite_songs', JSON.stringify(favoriteSongs));
}

function resolveSongById(songId) {
  // 1. Try songsData
  let song = songsData[songId];
  if (song) {
    return {
      id: songId,
      title: song.title,
      artist: song.artist,
      genre: song.genre || 'Classic Rock',
      art: song.art || 'M'
    };
  }

  // 2. Try hardcoded standard songs
  const hardcoded = [
    { id: 'scorpions', title: 'Wind of Change', artist: 'Scorpions', genre: 'Classic Rock', art: 'SC' },
    { id: 'metallica', title: 'Nothing Else Matters', artist: 'Metallica', genre: 'Heavy Metal', art: 'ME' },
    { id: 'rhcp', title: 'Californication', artist: 'Red Hot Chili Peppers', genre: 'Alternative Rock', art: 'RH' }
  ];
  const foundHardcoded = hardcoded.find(s => s.id === songId);
  if (foundHardcoded) return foundHardcoded;

  // 3. Try csvSongs
  if (csvSongs && csvSongs.length > 0) {
    const foundCsv = csvSongs.find(s => s.id === songId);
    if (foundCsv) return foundCsv;
  }

  // 4. Try persistent song metadata cache
  try {
    const cache = JSON.parse(localStorage.getItem('song_metadata_cache')) || {};
    if (cache[songId]) {
      return cache[songId];
    }
  } catch (e) {}

  return null;
}

// DOM Elements
const lyricsBoard = document.getElementById('lyricsBoard');
const sidebarPanel = document.getElementById('sidebarPanel');
const scrimOverlay = document.getElementById('scrimOverlay');
const closeBtn = document.getElementById('closeBtn');
const performanceToggle = document.getElementById('performanceToggle');
  const speedToggleId = 'videoAutoAccelerateToggle';
  let speedToggle = document.getElementById(speedToggleId);
  if (!speedToggle && performanceToggle) {
    const perfGroup = performanceToggle.closest('.switch').parentElement.parentElement;
    perfGroup.insertAdjacentHTML('beforeend', '<div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05);"><div style="display: flex; flex-direction: column; gap: 4px;"><span style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">Авто-ускорение видео (2x)</span><span style="font-size: 0.68rem; color: var(--text-muted);">Автоматически включать скорость воспроизведения 2x для видеоуроков.</span></div><label class="switch"><input type="checkbox" id="videoAutoAccelerateToggle"><span class="slider"></span></label></div>');
    speedToggle = document.getElementById(speedToggleId);
  }
  const savedSpeed = localStorage.getItem('galaxy_video_2x') !== 'false';
  if (speedToggle) speedToggle.checked = savedSpeed;

const themeToggleBtn = document.getElementById('themeToggleBtn');

// Header elements
const albumArt = document.getElementById('albumArt');
const songBadge = document.getElementById('songBadge');
const songTitle = document.getElementById('songTitle');
const artistName = document.getElementById('artistName');

/* ==========================================================================
   2. Core Application Logic
   ========================================================================== */

// Safe HTML escaping utility to prevent XSS vulnerabilities
function escapeHTML(str) {
  if (typeof str !== 'string') {
    if (str === null || str === undefined) return '';
    return String(str);
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;');
}

// ── Keyboard Layout Auto-Correction ──────────────────────────────────────────
// Maps: Cyrillic characters → their Latin keyboard equivalents (same key positions)
const CYR_TO_LAT_MAP = {
  'й':'q','ц':'w','у':'e','к':'r','е':'t','н':'y','г':'u','ш':'i','щ':'o','з':'p',
  'х':'[','ъ':']','ф':'a','ы':'s','в':'d','а':'f','п':'g','р':'h','о':'j','л':'k',
  'д':'l','ж':';','э':"'",'я':'z','ч':'x','с':'c','м':'v','и':'b','т':'n','ь':'m',
  'б':',','ю':'.','Й':'Q','Ц':'W','У':'E','К':'R','Е':'T','Н':'Y','Г':'U','Ш':'I',
  'Щ':'O','З':'P','Х':'{','Ъ':'}','Ф':'A','Ы':'S','В':'D','А':'F','П':'G','Р':'H',
  'О':'J','Л':'K','Д':'L','Ж':':','Э':'"','Я':'Z','Ч':'X','С':'C','М':'V','И':'B',
  'Т':'N','Ь':'M','Б':'<','Ю':'>'
};

// Maps: Latin characters → their Cyrillic keyboard equivalents (same key positions)
const LAT_TO_CYR_MAP = {
  'q':'й','w':'ц','e':'у','r':'к','t':'е','y':'н','u':'г','i':'ш','o':'щ','p':'з',
  '[':'х',']':'ъ','a':'ф','s':'ы','d':'в','f':'а','g':'п','h':'р','j':'о','k':'л',
  'l':'д',';':'ж',"'":'э','z':'я','x':'ч','c':'с','v':'м','b':'и','n':'т','m':'ь',
  ',':'б','.':'ю','Q':'Й','W':'Ц','E':'У','R':'К','T':'Е','Y':'Н','U':'Г','I':'Ш',
  'O':'Щ','P':'З','{':'Х','}':'Ъ','A':'Ф','S':'Ы','D':'В','F':'А','G':'П','H':'Р',
  'J':'О','K':'Л','L':'Д',':':'Ж','"':'Э','Z':'Я','X':'Ч','C':'С','V':'М','B':'И',
  'N':'Т','M':'Ь','<':'Б','>':'Ю'
};

/**
 * Applies layout fix to an input element.
 * @param {HTMLInputElement} inputEl - the input to fix
 * @param {'cyrToLat'|'latToCyr'} direction - conversion direction
 */
function applyLayoutFix(inputEl, direction) {
  const map = direction === 'cyrToLat' ? CYR_TO_LAT_MAP : LAT_TO_CYR_MAP;
  const origVal = inputEl.value;
  const selStart = inputEl.selectionStart;
  const selEnd = inputEl.selectionEnd;

  // Check if the current value has any characters needing conversion
  const newVal = origVal.split('').map(ch => map[ch] !== undefined ? map[ch] : ch).join('');

  if (newVal !== origVal) {
    inputEl.value = newVal;
    // Restore cursor position
    try {
      inputEl.setSelectionRange(selStart, selEnd);
    } catch(e) {}
    // Flash a subtle yellow border to signal auto-correction
    inputEl.style.borderColor = 'rgba(251, 191, 36, 0.7)';
    inputEl.style.boxShadow = '0 0 8px rgba(251, 191, 36, 0.25)';
    clearTimeout(inputEl._layoutFixTimer);
    inputEl._layoutFixTimer = setTimeout(() => {
      inputEl.style.borderColor = '';
      inputEl.style.boxShadow = '';
    }, 600);
  }
}

// RFC-compliant safe CSV parser
function parseCSV(text) {
  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i+1];
    
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push("");
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      if (row.length > 1 || row[0] !== "") {
        lines.push(row);
      }
      row = [""];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
}

// Convert CSV rows to structured track metadata index
function loadCSVSongs(csvText) {
  try {
    const parsedRows = parseCSV(csvText);
    if (parsedRows.length <= 1) return;
    
    const header = parsedRows[0];
    const songIdx = header.indexOf('Song');
    const artistIdx = header.indexOf('Artist');
    const genresIdx = header.indexOf('Parent Genres') !== -1 ? header.indexOf('Parent Genres') : header.indexOf('Genres');
    const spotifyIdIdx = header.indexOf('Spotify Track Id');
    
    if (songIdx === -1 || artistIdx === -1) {
      console.warn("Invalid CSV structure. Missing Song or Artist columns.");
      return;
    }
    
    csvSongs = [];
    
    for (let i = 1; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      if (row.length < Math.max(songIdx, artistIdx)) continue;
      
      const songTitle = row[songIdx];
      const artistName = row[artistIdx];
      if (!songTitle || !artistName) continue;
      
      const spotifyId = spotifyIdIdx !== -1 ? row[spotifyIdIdx] : '';
      const genre = genresIdx !== -1 ? row[genresIdx] : 'Pop';
      const cleanGenre = genre.split(',')[0].trim() || 'Music';
      
      const id = 'csv-' + i;
      
      let art = 'M';
      if (artistName) {
        const parts = artistName.split(' ');
        art = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
      }
      
      csvSongs.push({
        id,
        title: songTitle,
        artist: artistName,
        spotifyId,
        genre: cleanGenre,
        art
      });
    }
    console.log(`[CSV Loader] Successfully parsed ${csvSongs.length} songs from CSV.`);
  } catch (error) {
    console.error("Error loading CSV songs:", error);
  }
}

// Help clean artist/title to avoid search misses
function cleanQueryTerm(term) {
  return term
    .replace(/\s*-\s*(Remastered|Remaster|Live|Single|Acoustic|Radio Edit|EP Version|Album Version|Bonus Track).*$/i, '')
    .replace(/\s*\(feat\..*?\)/i, '')
    .replace(/\s*\(with\s.*?\)/i, '')
    .replace(/\s*\(Remastered\)/i, '')
    .replace(/\s*\(Live\)/i, '')
    .trim();
}

// Fetch official lyrics dynamically with LRCLIB & Lyrics.ovh fallbacks
// Fetch official lyrics dynamically with multiple fallback providers including Genius & AI
async function fetchLyrics(artist, title) {
  const cleanArtist = cleanQueryTerm(artist);
  const cleanTitle = cleanQueryTerm(title);
  
  console.log(`[Lyrics Fetch] Searching lyrics for: "${cleanArtist} - ${cleanTitle}" (Original: "${artist} - ${title}")`);
  
  // 1. Try LRCLIB exact lookup
  try {
    const url = `https://lrclib.net/api/lookup?artist=${encodeURIComponent(cleanArtist)}&track=${encodeURIComponent(cleanTitle)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data.plainLyrics) {
        console.log("[Lyrics Fetch] Found exact plain lyrics on LRCLIB");
        return data.plainLyrics;
      } else if (data && data.syncedLyrics) {
        console.log("[Lyrics Fetch] Found exact synced lyrics on LRCLIB");
        return data.syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
      }
    }
  } catch (err) {
    console.warn("[Lyrics Fetch] LRCLIB exact lookup failed:", err);
  }
  
  // 2. Try LRCLIB fuzzy search using specific track & artist names
  try {
    const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
    const response = await fetch(url);
    if (response.ok) {
      const results = await response.json();
      if (results && results.length > 0) {
        // Find first item with lyrics
        const bestMatch = results.find(item => item.plainLyrics || item.syncedLyrics);
        if (bestMatch) {
          console.log("[Lyrics Fetch] Found lyrics via LRCLIB fuzzy search (by signature)");
          if (bestMatch.plainLyrics) return bestMatch.plainLyrics;
          return bestMatch.syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
        }
      }
    }
  } catch (err) {
    console.warn("[Lyrics Fetch] LRCLIB fuzzy signature search failed:", err);
  }

  // 3. Try LRCLIB search with a single text query (very robust for typos/slight differences)
  try {
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanArtist + ' ' + cleanTitle)}`;
    const response = await fetch(url);
    if (response.ok) {
      const results = await response.json();
      if (results && results.length > 0) {
        const bestMatch = results.find(item => item.plainLyrics || item.syncedLyrics);
        if (bestMatch) {
          console.log("[Lyrics Fetch] Found lyrics via LRCLIB text search (by q)");
          if (bestMatch.plainLyrics) return bestMatch.plainLyrics;
          return bestMatch.syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
        }
      }
    }
  } catch (err) {
    console.warn("[Lyrics Fetch] LRCLIB fuzzy text search failed:", err);
  }
  
  // 4. Try Lyrics.ovh API
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data.lyrics) {
        console.log("[Lyrics Fetch] Found lyrics on Lyrics.ovh");
        return data.lyrics;
      }
    }
  } catch (err) {
    console.warn("[Lyrics Fetch] Lyrics.ovh lookup failed:", err);
  }

  // 5. Try Genius (via AllOrigins CORS-proxy + DOMParser Scraper)
  try {
    console.log("[Lyrics Fetch] Attempting Genius lookup...");
    const geniusLyrics = await fetchGeniusLyrics(cleanArtist, cleanTitle);
    if (geniusLyrics) {
      console.log("[Lyrics Fetch] Successfully scraped lyrics from Genius!");
      return geniusLyrics;
    }
  } catch (err) {
    console.warn("[Lyrics Fetch] Genius lookup failed:", err);
  }

  // 6. Try Gemini AI Lyrics Searcher (Ultimate Fallback)
  try {
    const currentApiKey = typeof getAPIKey === 'function' ? getAPIKey() : null;
    if (currentApiKey) {
      console.log("[Lyrics Fetch] Attempting AI Lyrics Generator fallback...");
      const aiLyrics = await fetchAILyrics(artist, title);
      if (aiLyrics) {
        return aiLyrics;
      }
    }
  } catch (err) {
    console.warn("[Lyrics Fetch] AI Lyrics Generator failed:", err);
  }
  
  throw new Error("Не удалось найти текст песни ни в открытых базах (LRCLIB, Lyrics.ovh), ни на Genius, ни с помощью ИИ.");
}

// Genius lyrics scraper using AllOrigins CORS proxy
async function fetchGeniusLyrics(artist, title) {
  const searchUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://genius.com/api/search/multi?q=${encodeURIComponent(artist + ' ' + title)}`)}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) throw new Error("Genius search proxy failed");
  const searchData = await searchRes.json();
  const parsedData = JSON.parse(searchData.contents);
  
  // Find the first hit in the "song" section
  const songSection = parsedData.response.sections.find(s => s.type === 'song');
  if (!songSection || !songSection.hits || songSection.hits.length === 0) {
    throw new Error("No Genius matches found");
  }
  
  const hit = songSection.hits[0].result;
  const songPath = hit.path;
  console.log(`[Genius Scraper] Found Genius path: ${songPath}`);
  
  // Fetch HTML from Genius song page
  const lyricUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://genius.com${songPath}`)}`;
  const lyricRes = await fetch(lyricUrl);
  if (!lyricRes.ok) throw new Error("Genius lyrics page proxy failed");
  const lyricData = await lyricRes.json();
  const html = lyricData.contents;
  
  // Parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Scrape lyrics containers
  const containers = doc.querySelectorAll('div[data-lyrics-container="true"]');
  let lyricsText = "";
  
  if (containers.length > 0) {
    containers.forEach(container => {
      // Replace <br> tags with actual newlines to preserve styling safely
      container.querySelectorAll('br').forEach(br => {
        if (br.parentNode) {
          br.parentNode.insertBefore(doc.createTextNode('\n'), br);
          br.parentNode.removeChild(br);
        }
      });
      lyricsText += container.textContent + "\n\n";
    });
  } else {
    // Legacy fallback class
    const oldContainer = doc.querySelector('.lyrics');
    if (oldContainer) {
      lyricsText = oldContainer.textContent;
    }
  }
  
  lyricsText = lyricsText.trim();
  if (lyricsText) {
    // Sanitize extra consecutive empty lines
    lyricsText = lyricsText.replace(/\n{3,}/g, '\n\n');
    return lyricsText;
  }
  throw new Error("Lyrics content not found in Genius page structure");
}

// AI Lyrics Generator (Ultimate Fallback)
async function fetchAILyrics(artist, title) {
  const currentApiKey = typeof getAPIKey === 'function' ? getAPIKey() : null;
  if (!currentApiKey) {
    throw new Error("API key is not configured for AI fallback");
  }
  
  const prompt = `You are a lyrics repository. Retrieve and return ONLY the complete authentic English lyrics of the song "${title}" by artist "${artist}". Do not write any explanations, headers, translations, or notes. Just output the clean lines of the song.`;
  
  let lyricsText = "";
  
  if (currentApiKey.startsWith('sk-or-')) {
    // OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }]
      })
    });
    
    if (response.ok) {
      const resJson = await response.json();
      lyricsText = resJson.choices[0].message.content;
    }
  } else {
    // Google Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentApiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });
    
    if (response.ok) {
      const resJson = await response.json();
      lyricsText = resJson.candidates[0].content.parts[0].text;
    }
  }
  
  lyricsText = lyricsText.trim();
  // Strip Markdown code fences if any
  lyricsText = lyricsText.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
  
  if (lyricsText && lyricsText.length > 100) {
    return lyricsText;
  }
  throw new Error("AI returned empty or invalid text");
}

// Group song lines into semantic 3-4 line stanzas
function segmentLyricsIntoStanzas(rawLyrics) {
  let cleaned = rawLyrics
    .replace(/\r\n/g, '\n')
    .replace(/Paroles de .* par .*/gi, '')
    .replace(/Lyrics by .* published by .*/gi, '')
    .trim();
  
  // Helper to identify structural label lines like [Chorus], (chorus), [Verse 1], etc.
  const isStructuralLabel = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    return /^[\[\(]\s*(chorus|verse|bridge|intro|outro|solo|refrain|pre-chorus|prechorus|instrumental|transition|guitar|куплет|припев|интро|coda|hook|snippet|part\s*\d+|bridge\s*\d+|chorus\s*\d+|verse\s*\d+|куплет\s*\d+|припев\s*\d+)/i.test(trimmed);
  };

  // 1. Split raw text into initial semantic blocks based on double newlines
  let initialBlocks = [];
  if (cleaned.includes('\n\n')) {
    initialBlocks = cleaned.split('\n\n');
  } else {
    initialBlocks = [cleaned];
  }
  
  let blocks = [];
  
  initialBlocks.forEach(block => {
    // Split block into individual lines, strip leading/trailing spaces, and filter structural markers
    const lines = block.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !isStructuralLabel(line));
      
    if (lines.length === 0) return;
    
    // 2. If a single block has more than 5 lines, partition it into standard chunks of 3-4 lines
    if (lines.length > 5) {
      const chunkSize = 4;
      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize).join('\n');
        if (chunk) blocks.push(chunk);
      }
    } else {
      blocks.push(lines.join('\n'));
    }
  });
  
  const finalLines = [];
  let blockIndex = 1;
  
  blocks.forEach(block => {
    const text = block.trim();
    if (!text) return;
    
    finalLines.push({
      id: `dyn-${blockIndex}`,
      text: text,
      translation: "",
      grammar: [],
      words: []
    });
    blockIndex++;
  });
  
  return finalLines;
}

// Render error fallback state with interactive manual text input box
function renderLyricsError(title, artist, errorMessage) {
  lyricsBoard.innerHTML = `
    <div style="text-align: center; padding: 3rem 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; max-width: 550px; margin: 0 auto; animation: fadeIn 0.5s ease-out;">
      <div style="font-size: 3.5rem; filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.15));">🎵</div>
      <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-main); line-height: 1.3; margin: 0;">
        Не удалось загрузить текст песни «${escapeHTML(title)}»
      </h2>
      <p style="font-size: 0.88rem; color: var(--text-sub); line-height: 1.5; margin: 0;">
        Открытые музыкальные базы не нашли текст этой композиции. Но наш ИИ готов перевести и разобрать смысл названия для вас!
      </p>
      
      <!-- Premium Glassmorphic AI Translation Card -->
      <div id="lyrics-error-title-analysis" style="width: 100%; padding: 20px; background: rgba(139, 92, 246, 0.04); border: 1px solid rgba(139, 92, 246, 0.15); border-radius: 16px; text-align: left; box-shadow: 0 8px 32px rgba(0,0,0,0.15); display: flex; flex-direction: column; gap: 12px; transition: all 0.3s; backdrop-filter: blur(10px);">
        <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #a78bfa; display: flex; align-items: center; gap: 8px; letter-spacing: 0.5px;">
          <span>✦ AI АВТО-ПЕРЕВОД НАЗВАНИЯ</span>
          <span class="pulse-dot-violet" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #8b5cf6; box-shadow: 0 0 8px #8b5cf6; animation: pulse 1.5s infinite;"></span>
        </div>
        <div id="errorTitleAnalysisContent" style="font-size: 0.88rem; color: var(--text-sub); line-height: 1.6;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="search-loading-spinner" style="position: static; display: inline-block; width: 14px; height: 14px; border-color: #8b5cf6; border-top-color: transparent;"></div>
            <span>ИИ переводит название и анализирует его глубокий смысл...</span>
          </div>
        </div>
      </div>

      <div style="width: 100%; display: flex; flex-direction: column; gap: 10px; margin-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 1.5rem;">
        <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-align: left;">Или вставьте текст песни вручную:</span>
        <textarea id="manualLyricsArea" placeholder="Вставьте сюда текст песни на английском..." rows="4"></textarea>
        <button id="submitManualLyricsBtn" style="background: var(--accent-spotify); color: #000000; font-weight: 700; border: none; padding: 10px 20px; border-radius: 20px; font-size: 0.85rem; cursor: pointer; transition: var(--transition-fast); display: flex; align-items: center; justify-content: center; gap: 8px;">
          🚀 Запустить разбор для вставленного текста
        </button>
      </div>
    </div>
  `;
  
  // Asynchronously request the title analysis from AI
  (async () => {
    const analysisBox = document.getElementById('errorTitleAnalysisContent');
    if (!analysisBox) return;

    try {
      let cached = getCachedSongMeaning(title, artist);
      if (!cached) {
        cached = await fetchGeminiSongMeaning(title, artist);
        setCachedSongMeaning(title, artist, cached);
      }

      if (cached) {
        analysisBox.innerHTML = `
          <div style="margin-bottom: 8px;">
            <strong style="color: var(--accent-spotify); font-size: 1.1rem; display: block; margin-bottom: 4px;">
              ${escapeHTML(cached.titleTranslation || title)} ${cached.titlePronunciation ? `<span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted); font-style: normal; margin-left: 6px;">${escapeHTML(cached.titlePronunciation)}</span>` : ''}
            </strong>
          </div>
          <p style="margin: 0 0 12px 0; color: var(--text-main); font-size: 0.88rem; line-height: 1.55;">
            ${escapeHTML(cached.songMeaning) || 'Смысл трека переводится...'}
          </p>
          ${cached.titleVocabulary && cached.titleVocabulary.length > 0 ? `
            <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; margin-top: 8px;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Разбор слов из названия:</span>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${cached.titleVocabulary.map(item => {
                  const escWord = item.word.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
                  const escTrans = item.translation.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
                  return `
                    <div style="font-size: 0.82rem; line-height: 1.45; display: flex; flex-direction: column; gap: 4px; padding: 8px 10px; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); border-radius: 8px;">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <code style="color: var(--accent-spotify); font-family: monospace; font-weight: 700; background: rgba(29, 185, 84, 0.08); padding: 2px 6px; border-radius: 4px; margin-right: 6px;">${escapeHTML(item.word)}</code>
                          <strong style="color: var(--text-main);">${escapeHTML(item.translation)}</strong>
                        </div>
                        <button onclick="event.stopPropagation(); window.addWordToPersonalDictionary('${escWord}', '${escTrans}')" style="background: rgba(29, 185, 84, 0.08); border: 1px solid rgba(29, 185, 84, 0.2); color: var(--accent-spotify); border-radius: 20px; padding: 2px 8px; font-size: 0.65rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 2px; transition: all 0.2s;" onmouseover="this.style.background='rgba(29, 185, 84, 0.15)'" onmouseout="this.style.background='rgba(29, 185, 84, 0.08)'">
                          <span>➕ В словарь</span>
                        </button>
                      </div>
                      <div style="color: var(--text-sub); font-size: 0.78rem;">${escapeHTML(item.context)}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        `;
      }
    } catch (e) {
      console.error("[Lyrics Error AI Callback] Failed to fetch song title meaning:", e);
      analysisBox.innerHTML = `
        <span style="color: var(--text-muted); font-style: italic;">
          Не удалось получить автоматический перевод от ИИ. Вы все еще можете вставить текст вручную!
        </span>
      `;
    }
  })();

  const area = document.getElementById('manualLyricsArea');
  if (area) {
    area.addEventListener('focus', () => {
      area.style.borderColor = 'var(--accent-spotify)';
    });
    area.addEventListener('blur', () => {
      area.style.borderColor = 'var(--border-glass)';
    });
  }

  const btn = document.getElementById('submitManualLyricsBtn');
  if (btn && area) {
    btn.addEventListener('click', () => {
      const customText = area.value.trim();
      if (!customText) return;
      
      const stanzas = segmentLyricsIntoStanzas(customText);
      if (stanzas.length === 0) {
        alert("Пожалуйста, введите текст песни.");
        return;
      }
      
      songsData[currentSongKey] = {
        title,
        artist,
        genre: "Custom",
        art: artist.substring(0, 2).toUpperCase(),
        lines: stanzas
      };
      
      renderSong(currentSongKey);
    });
  }
}

// Helper to convert Russian keyboard layout to English QWERTY
function convertRuLayoutToEn(text) {
  if (!text) return '';
  const map = {
    'й': 'q', 'ц': 'w', 'у': 'e', 'к': 'r', 'е': 't', 'н': 'y', 'г': 'u', 'ш': 'i', 'щ': 'o', 'з': 'p', 'х': '[', 'ъ': ']',
    'ф': 'a', 'ы': 's', 'в': 'd', 'а': 'f', 'п': 'g', 'р': 'h', 'о': 'j', 'л': 'k', 'д': 'l', 'ж': ';', 'э': "'",
    'я': 'z', 'ч': 'x', 'с': 'c', 'м': 'v', 'и': 'b', 'т': 'n', 'ь': 'm', 'б': ',', 'ю': '.', '.': '/',
    'Й': 'Q', 'Ц': 'W', 'У': 'E', 'К': 'R', 'Е': 'T', 'Н': 'Y', 'Г': 'U', 'Ш': 'I', 'Щ': 'O', 'З': 'P', 'Х': '{', 'Ъ': '}',
    'Ф': 'A', 'Ы': 'S', 'В': 'D', 'А': 'F', 'П': 'G', 'Р': 'H', 'О': 'J', 'Л': 'K', 'Д': 'L', 'Ж': ':', 'Э': '"',
    'Я': 'Z', 'Ч': 'X', 'С': 'C', 'М': 'V', 'И': 'B', 'Т': 'N', 'Ь': 'M', 'Б': '<', 'Ю': '>', '?': '&'
  };
  return text.split('').map(char => map[char] || char).join('');
}

// Controller for Autocomplete Search UI dropdown actions and keyboard navigations
function initAutocomplete() {
  const dropdown = document.getElementById('songSearchDropdown');
  const input = document.getElementById('songSearchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  const wrapper = document.getElementById('autocompleteWrapper');

  if (!input || !dropdown || !clearBtn) return;

  function getSearchList() {
    const list = [
      { id: 'scorpions', title: 'Wind of Change', artist: 'Scorpions', genre: 'Classic Rock', art: 'SC' },
      { id: 'metallica', title: 'Nothing Else Matters', artist: 'Metallica', genre: 'Heavy Metal', art: 'ME' },
      { id: 'rhcp', title: 'Californication', artist: 'Red Hot Chili Peppers', genre: 'Alternative Rock', art: 'RH' }
    ];
    
    csvSongs.forEach(song => {
      list.push(song);
    });
    
    return list;
  }

  function getSearchResults(query) {
    if (!query) return { matchesMeta: getSearchList(), matchesLyrics: [] };

    const queryLower = query.toLowerCase();
    const convertedQuery = convertRuLayoutToEn(query).toLowerCase();
    const allSongs = getSearchList();

    // 1. Metadata matches (by title or artist)
    const matchesMeta = allSongs.filter(song => {
      const title = song.title.toLowerCase();
      const artist = song.artist.toLowerCase();
      return title.includes(queryLower) || 
             artist.includes(queryLower) ||
             (convertedQuery && (title.includes(convertedQuery) || artist.includes(convertedQuery)));
    });

    // 2. Lyrics matches (by text or translation in songsData)
    const matchesLyrics = [];
    const metaMatchIds = new Set(matchesMeta.map(s => s.id));

    Object.keys(songsData).forEach(songId => {
      if (metaMatchIds.has(songId)) return;

      const song = songsData[songId];
      if (!song || !song.lines) return;

      const matchingLine = song.lines.find(line => {
        const text = (line.text || '').toLowerCase();
        const translation = (line.translation || '').toLowerCase();
        return text.includes(queryLower) || 
               translation.includes(queryLower) ||
               (convertedQuery && (text.includes(convertedQuery) || translation.includes(convertedQuery)));
      });

      if (matchingLine) {
        const songMeta = allSongs.find(s => s.id === songId) || {
          id: songId,
          title: song.title,
          artist: song.artist,
          genre: song.genre || 'Classic Rock',
          art: song.art || '🎵'
        };

        // Find the exact sub-line within text or translation that matches
        let foundLineText = '';
        if (matchingLine.text) {
          const subLines = matchingLine.text.split('\n');
          const match = subLines.find(sl => sl.toLowerCase().includes(queryLower) || (convertedQuery && sl.toLowerCase().includes(convertedQuery)));
          if (match) foundLineText = match;
        }
        if (!foundLineText && matchingLine.translation) {
          const subLines = matchingLine.translation.split('\n');
          const match = subLines.find(sl => sl.toLowerCase().includes(queryLower) || (convertedQuery && sl.toLowerCase().includes(convertedQuery)));
          if (match) {
            foundLineText = matchingLine.text.split('\n')[0];
          }
        }
        if (!foundLineText) {
          foundLineText = matchingLine.text.split('\n')[0];
        }

        matchesLyrics.push({
          ...songMeta,
          matchingQuote: foundLineText
        });
      }
    });

    return { matchesMeta, matchesLyrics };
  }

  function renderDropdown(matchesMeta, matchesLyrics = [], query = '') {
    dropdown.innerHTML = '';
    activeDropdownIndex = -1;

    // 💖 Prioritize favorite songs when query is empty!
    if (!query) {
      const allSongs = getSearchList();
      const favoritesList = allSongs.filter(song => isSongFavorite(song.id));
      
      if (favoritesList.length > 0) {
        const favHeader = document.createElement('div');
        favHeader.className = 'autocomplete-section-header';
        favHeader.innerHTML = '💖 Избранные песни';
        dropdown.appendChild(favHeader);

        favoritesList.forEach((song, idx) => {
          const item = document.createElement('div');
          item.className = 'autocomplete-item';
          item.dataset.songId = song.id;
          item.dataset.index = idx;

          item.innerHTML = `
            <div class="autocomplete-item-title">${escapeHTML(song.title)} <span style="color: #ef4444; font-size: 0.8rem;">💖</span></div>
            <div class="autocomplete-item-artist">${escapeHTML(song.artist)}</div>
          `;

          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectSongFromDropdown(song);
          });

          dropdown.appendChild(item);
        });

        // Add section header for other songs
        const generalHeader = document.createElement('div');
        generalHeader.className = 'autocomplete-section-header';
        generalHeader.innerHTML = '🔥 Все песни';
        dropdown.appendChild(generalHeader);
      }

      // Limit list size when favorites are also showing to avoid dropdown clutter
      const displaySongs = matchesMeta.slice(0, 10);
      
      displaySongs.forEach((song, idx) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.dataset.songId = song.id;
        // Adjust keyboard navigation dataset index to match DOM elements index
        const currentItemsCount = dropdown.querySelectorAll('.autocomplete-item').length;
        item.dataset.index = currentItemsCount;

        const isFav = isSongFavorite(song.id);
        const favHeart = isFav ? ' <span style="color: #ef4444; font-size: 0.8rem; margin-left: 4px;">💖</span>' : '';

        item.innerHTML = `
          <div class="autocomplete-item-title">${escapeHTML(song.title)}${favHeart}</div>
          <div class="autocomplete-item-artist">${escapeHTML(song.artist)}</div>
        `;

        // Use mousedown instead of click to prevent focus/blur timing race conditions
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          selectSongFromDropdown(song);
        });

        dropdown.appendChild(item);
      });
      
      dropdown.style.display = 'block';
      return;
    }

    const totalCount = matchesMeta.length + matchesLyrics.length;
    if (totalCount === 0) {
      dropdown.innerHTML = `<div class="autocomplete-no-results">Песни не найдены</div>`;
    } else {
      // 1. Render Metadata Matches Section (Songs and Artists)
      if (matchesMeta.length > 0) {
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'autocomplete-section-header';
        sectionHeader.innerHTML = '🎵 Песни и исполнители';
        dropdown.appendChild(sectionHeader);

        matchesMeta.forEach((song) => {
          const item = document.createElement('div');
          item.className = 'autocomplete-item';
          item.dataset.songId = song.id;
          const currentItemsCount = dropdown.querySelectorAll('.autocomplete-item').length;
          item.dataset.index = currentItemsCount;

          const isFav = isSongFavorite(song.id);
          const favHeart = isFav ? ' <span style="color: #ef4444; font-size: 0.8rem; margin-left: 4px;">💖</span>' : '';

          item.innerHTML = `
            <div class="autocomplete-item-title">${escapeHTML(song.title)}${favHeart}</div>
            <div class="autocomplete-item-artist">${escapeHTML(song.artist)}</div>
          `;

          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectSongFromDropdown(song);
          });

          dropdown.appendChild(item);
        });
      }

      // 2. Render Lyrics Matches Section (Quotes of texts)
      if (matchesLyrics.length > 0) {
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'autocomplete-section-header';
        sectionHeader.innerHTML = '📝 Найденные строки из песен';
        dropdown.appendChild(sectionHeader);

        matchesLyrics.forEach((song) => {
          const item = document.createElement('div');
          item.className = 'autocomplete-item';
          item.dataset.songId = song.id;
          const currentItemsCount = dropdown.querySelectorAll('.autocomplete-item').length;
          item.dataset.index = currentItemsCount;

          const isFav = isSongFavorite(song.id);
          const favHeart = isFav ? ' <span style="color: #ef4444; font-size: 0.8rem; margin-left: 4px;">💖</span>' : '';

          item.innerHTML = `
            <div class="autocomplete-item-title">${escapeHTML(song.title)}${favHeart}</div>
            <div class="autocomplete-item-artist">${escapeHTML(song.artist)}</div>
            <div class="autocomplete-item-quote" style="font-size: 0.76rem; color: #a78bfa; margin-top: 4px; font-style: italic; border-left: 2px solid #a78bfa; padding-left: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              «...${escapeHTML(song.matchingQuote)}...»
            </div>
          `;

          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectSongFromDropdown(song);
          });

          dropdown.appendChild(item);
        });
      }
    }

    dropdown.style.display = 'block';
  }

  async function performGlobalSearch(query) {
    const finalQuery = convertRuLayoutToEn(query);
    dropdown.innerHTML = `
      <div class="autocomplete-no-results" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 16px;">
        <div class="search-loading-spinner" style="position: static; display: inline-block;"></div>
        <span>Ищем по всему миру...</span>
      </div>
    `;
    dropdown.style.display = 'block';
    
    try {
      const url = `https://lrclib.net/api/search?q=${encodeURIComponent(finalQuery)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("API error");
      
      const results = await response.json();
      dropdown.innerHTML = '';
      activeDropdownIndex = -1;
      
      if (!results || results.length === 0) {
        dropdown.innerHTML = `<div class="autocomplete-no-results">Ничего не найдено во всемирной базе</div>`;
        return;
      }
      
      results.slice(0, 15).forEach((song, idx) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        const globalId = 'global-' + song.id;
        item.dataset.songId = globalId;
        item.dataset.index = idx;
        
        item.innerHTML = `
          <div class="autocomplete-item-title">${escapeHTML(song.trackName)}</div>
          <div class="autocomplete-item-artist">${escapeHTML(song.artistName)} ${song.albumName ? `(${escapeHTML(song.albumName)})` : ''}</div>
        `;
        
        // Use mousedown instead of click to prevent focus/blur timing race conditions
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (song.plainLyrics || song.syncedLyrics) {
            const rawLyrics = song.plainLyrics || song.syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
            const segmented = segmentLyricsIntoStanzas(rawLyrics);
            
            songsData[globalId] = {
              title: song.trackName,
              artist: song.artistName,
              genre: 'World',
              art: song.artistName.substring(0, 2).toUpperCase(),
              lines: segmented
            };
            
            input.value = '';
            dropdown.style.display = 'none';
            clearBtn.style.display = 'none';
            currentSongKey = globalId;
            closeSidebar();
            renderSong(globalId);
          } else {
            selectSongFromDropdown({
              id: globalId,
              title: song.trackName,
              artist: song.artistName,
              genre: 'World',
              art: song.artistName.substring(0, 2).toUpperCase()
            });
          }
        });
        
        dropdown.appendChild(item);
      });
    } catch (err) {
      console.error("Global search error:", err);
      dropdown.innerHTML = `<div class="autocomplete-no-results" style="color: #ef4444; padding: 12px;">Ошибка сети при глобальном поиске</div>`;
    }
  }

  async function selectSongFromDropdown(song) {
    input.value = '';
    dropdown.style.display = 'none';
    clearBtn.style.display = 'none';
    
    // Hide welcome dashboard card and show active song card wrappers
    const dashboardCard = document.getElementById('welcomeDashboardCard');
    const songHeader = document.getElementById('songHeaderCard');
    const lyricsCard = document.getElementById('lyricsBoardCard');
    if (dashboardCard) dashboardCard.style.display = 'none';
    if (songHeader) songHeader.style.display = 'flex';
    if (lyricsCard) lyricsCard.style.display = 'block';

    currentSongKey = song.id;
    closeSidebar();

    // Save to song metadata cache for persistent dashboard resolving
    try {
      const cache = JSON.parse(localStorage.getItem('song_metadata_cache')) || {};
      cache[song.id] = {
        id: song.id,
        title: song.title,
        artist: song.artist,
        genre: song.genre || 'Pop',
        art: song.art || 'M'
      };
      localStorage.setItem('song_metadata_cache', JSON.stringify(cache));
    } catch (e) {}

    if (songsData[song.id]) {
      renderSong(song.id);
    } else {
      const phraseBuilderEl = document.getElementById('phrase-builder');
      const lyricsCardEl = document.getElementById('lyricsBoardCard');
      if (phraseBuilderEl) phraseBuilderEl.style.display = 'flex';
      if (lyricsCardEl) lyricsCardEl.style.display = 'block';
      showPhraseGameWhileLyricsLoading(song.id);

      lyricsBoard.innerHTML = `
        <div class="shimmer-wrapper" style="padding: 2rem;">
          <div style="text-align: center; margin-bottom: 1.5rem; color: var(--text-sub); font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <div class="search-loading-spinner" style="position: static; display: inline-block;"></div>
            Скачивание официального текста песни с серверов базы данных...
          </div>
          <p style="text-align: center; font-size: 0.82rem; color: var(--text-muted); margin: 0;">
            Пока ждёте — соберите фразу в тренажёре выше ↑
          </p>
        </div>
      `;

      albumArt.textContent = song.art;
      songBadge.textContent = song.genre;
      songTitle.textContent = song.title;
      artistName.textContent = song.artist;

      try {
        const rawLyrics = await fetchLyrics(song.artist, song.title);
        const segmented = segmentLyricsIntoStanzas(rawLyrics);
        
        if (segmented.length === 0) {
          throw new Error("Текст пустой или не содержит подходящих куплетов.");
        }
        
        songsData[song.id] = {
          title: song.title,
          artist: song.artist,
          genre: song.genre,
          art: song.art,
          lines: segmented
        };
        
        renderSong(song.id);
      } catch (err) {
        console.error(err);
        renderLyricsError(song.title, song.artist, err.message);
      }
    }
  }

  input.addEventListener('input', () => {
    const query = input.value.trim();
    
    if (!query) {
      clearBtn.style.display = 'none';
      dropdown.style.display = 'none';
      return;
    }

    clearBtn.style.display = 'block';
    
    const { matchesMeta, matchesLyrics } = getSearchResults(query);
    renderDropdown(matchesMeta, matchesLyrics, query);
  });

  input.addEventListener('focus', () => {
    const query = input.value.trim();
    if (query) {
      const { matchesMeta, matchesLyrics } = getSearchResults(query);
      renderDropdown(matchesMeta, matchesLyrics, query);
    } else {
      renderDropdown(getSearchList(), [], '');
    }
  });

  input.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.autocomplete-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeDropdownIndex = (activeDropdownIndex + 1) % items.length;
      updateActiveDropdownItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeDropdownIndex = (activeDropdownIndex - 1 + items.length) % items.length;
      updateActiveDropdownItem(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeDropdownIndex >= 0 && activeDropdownIndex < items.length) {
        items[activeDropdownIndex].click();
      }
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
    }
  });

  function updateActiveDropdownItem(items) {
    items.forEach(item => item.classList.remove('active'));
    if (activeDropdownIndex >= 0) {
      const activeItem = items[activeDropdownIndex];
      activeItem.classList.add('active');
      activeItem.scrollIntoView({ block: 'nearest' });
    }
  }

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    dropdown.style.display = 'none';
    input.focus();
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  // Expose autocomplete selection function globally for dashboard and recommendations access
  window.selectSongFromDropdown = selectSongFromDropdown;
}

// Safe entry point for dashboard / favorites (autocomplete may still be loading)
function pickSongFromSearch(song) {
  if (typeof window.selectSongFromDropdown === 'function') {
    return window.selectSongFromDropdown(song);
  }
  console.warn('[App] Поиск песен ещё загружается — попробуйте снова через секунду.');
}

// Global dashboard and favorites hub functions
window.showDashboard = showDashboard;

function showDashboard() {
  // Hide active song elements
  const songHeader = document.getElementById('songHeaderCard');
  const lyricsCard = document.getElementById('lyricsBoardCard');
  const phraseBuilder = document.getElementById('phrase-builder');
  const audioDictation = document.getElementById('audio-dictation');
  
  if (songHeader) songHeader.style.display = 'none';
  if (lyricsCard) lyricsCard.style.display = 'none';
  if (phraseBuilder) phraseBuilder.style.display = 'none';
  if (audioDictation) audioDictation.style.display = 'none';

  // Clear current active selections
  const rows = document.querySelectorAll('.lyrics-row-wrapper');
  rows.forEach(r => r.classList.remove('active'));
  closeSidebar();

  // Show welcome dashboard card
  const dashboardCard = document.getElementById('welcomeDashboardCard');
  if (dashboardCard) {
    dashboardCard.style.display = 'flex';
  }

  // Update Stats counts
  const dashWordsCount = document.getElementById('dashWordsCount');
  if (dashWordsCount) {
    dashWordsCount.textContent = personalDictionary ? personalDictionary.length : 0;
  }

  // Render Dashboard Favorites list
  renderDashboardFavorites();
}

function renderDashboardFavorites() {
  const container = document.getElementById('dashFavoritesContainer');
  if (!container) return;

  container.innerHTML = '';
  
  if (!favoriteSongs || favoriteSongs.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 1.5rem 0; color: var(--text-muted); font-size: 0.85rem; font-style: italic;">
        У вас пока нет избранных песен. Добавьте песню в избранное, кликнув сердечко ❤️ в шапке воспроизведения!
      </div>
    `;
    return;
  }

  favoriteSongs.forEach(songId => {
    // Resolve song meta using our robust multi-source resolver
    let song = resolveSongById(songId);
    if (!song) return;

    const row = document.createElement('div');
    row.className = 'dash-song-recommendation';
    row.style.cssText = 'display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; cursor: pointer; transition: all 0.2s;';
    
    row.innerHTML = `
      <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.15); color: #ef4444; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem;">❤️</div>
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${song.title}</div>
        <div style="font-size: 0.75rem; color: var(--text-sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${song.artist}</div>
      </div>
    `;

    row.addEventListener('click', () => {
      pickSongFromSearch(song);
    });

    container.appendChild(row);
  });
}

// Render high-end premium Welcome Hub instead of default song
function renderWelcomeHub() {
  const songHeaderCard = document.getElementById('songHeaderCard');
  if (songHeaderCard) {
    songHeaderCard.style.display = 'none';
  }
  
  lyricsBoard.innerHTML = `
    <div class="welcome-hub" style="text-align: center; padding: 4rem 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2rem; max-width: 650px; margin: 0 auto; min-height: 50vh; animation: fadeIn 0.8s ease-out;">
      <div style="background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 2.8rem; font-weight: 800; line-height: 1.2; letter-spacing: -1px; text-shadow: var(--accent-glow);">
        Разбирай любимые песни с ИИ 🎵
      </div>
      
      <p style="font-size: 1.1rem; color: var(--text-sub); line-height: 1.6; max-width: 480px; margin: 0;">
        Интерактивный тренажер английского языка. Перевод строф, разбор грамматики и контекстные переводы слов прямо во время чтения.
      </p>

      <!-- Big Interactive Glow Input Trigger -->
      <div style="width: 100%; max-width: 440px; position: relative;" onclick="document.getElementById('songSearchInput').focus()">
        <div style="background: var(--bg-card); border: 2px solid var(--border-glass); padding: 16px 20px; border-radius: 30px; display: flex; align-items: center; gap: 12px; cursor: text; box-shadow: 0 8px 32px rgba(0,0,0,0.2); transition: all 0.3s; text-align: left;" onmouseover="this.style.borderColor='var(--accent-spotify)'; this.style.boxShadow='var(--accent-glow)';" onmouseout="this.style.borderColor='var(--border-glass)'; this.style.boxShadow='none';">
          <span style="font-size: 1.3rem;">🔍</span>
          <span style="color: var(--text-sub); font-size: 1rem;">Введите название песни или исполнителя...</span>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%; max-width: 440px; margin-top: 1rem;">
        <div style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--text-sub); margin-bottom: 0.2rem;">Популярные разборы:</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
          <button onclick="window.selectRecommended('scorpions')" class="recommended-btn" style="background: var(--bg-card); border: 1px solid var(--border-glass); border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; text-align: left; transition: all 0.3s; outline: none;" onmouseover="this.style.borderColor='var(--accent-spotify)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-glass)'; this.style.transform='translateY(0)';">
            <div style="width: 32px; height: 32px; background: rgba(29, 185, 84, 0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--accent-spotify); font-size: 0.85rem;">SC</div>
            <div>
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">Wind of Change</div>
              <div style="font-size: 0.75rem; color: var(--text-sub);">Scorpions</div>
            </div>
          </button>
          
          <button onclick="window.selectRecommended('deftones')" class="recommended-btn" style="background: var(--bg-card); border: 1px solid var(--border-glass); border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; text-align: left; transition: all 0.3s; outline: none;" onmouseover="this.style.borderColor='var(--accent-spotify)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-glass)'; this.style.transform='translateY(0)';">
            <div style="width: 32px; height: 32px; background: rgba(29, 185, 84, 0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--accent-spotify); font-size: 0.85rem;">DE</div>
            <div>
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">Change</div>
              <div style="font-size: 0.75rem; color: var(--text-sub);">Deftones</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Recommended song trigger
window.selectRecommended = (songId) => {
  const song = songsData[songId];
  if (song) {
    const searchInput = document.getElementById('songSearchInput');
    if (searchInput) {
      searchInput.value = `${song.artist} — ${song.title}`;
      const clearBtn = document.getElementById('searchClearBtn');
      if (clearBtn) clearBtn.style.display = 'block';
    }
    currentSongKey = songId;
    renderSong(songId);
  }
};

// Initialize the app and restore theme settings
document.addEventListener('DOMContentLoaded', () => {
  initAnalysisCache(); // Load all persistent localStorage entries into analysisCache
  initDictionary(); // Load the premium personal vocabulary dictionary and trainers
  initVideoCourse(); // Initialize the video course lesson tracker
  initNotebook(); // Initialize the global notebook and per-lesson notes
  initGrammarRules(); // Initialize personal grammar rules handbook
  setupRulesUI(); // Setup event listeners and logic for rules handbook
  
  const searchInput = document.getElementById('songSearchInput');
  if (searchInput) {
    searchInput.value = "";
  }

  showDashboard();
  setupEventListeners();
  restoreSavedTheme();
  // Asynchronously download and parse the playlist database using robust dual-path fetch
  async function loadCSVWithFallbacks() {
    // Priority Option: CORS-free local script bundle (ideal for double-clicking index.html directly)
    if (window.PLAYLIST_CSV_DATA) {
      console.log("[CSV Loader] Successfully loaded database via CORS-free local script variable!");
      loadCSVSongs(window.PLAYLIST_CSV_DATA);
      initAutocomplete();
      renderDashboardFavorites();
      return;
    }

    console.log("[CSV Loader] Local script bundle not present. Falling back to HTTP fetch...");
    let text = null;
    let lastError = null;

    // Path Option 1: Direct Unicode Russian filename
    try {
      const response = await fetch('Баня.csv?cb=' + Date.now());
      if (response.ok) {
        text = await response.text();
        console.log("[CSV Loader] Successfully fetched Баня.csv via unicode path.");
      } else {
        console.warn(`[CSV Loader] Fetching Баня.csv via unicode path returned status: ${response.status}`);
      }
    } catch (err) {
      lastError = err;
      console.warn("[CSV Loader] Unicode path fetch failed:", err);
    }

    // Path Option 2: URL Encoded filename fallback
    if (!text) {
      try {
        const response = await fetch('%D0%91%D0%B0%D0%BD%D1%8F.csv?cb=' + Date.now());
        if (response.ok) {
          text = await response.text();
          console.log("[CSV Loader] Successfully fetched Баня.csv via URL encoded path (%D0%91%D0%B0%D0%BD%D1%8F.csv).");
        } else {
          console.warn(`[CSV Loader] Fetching Баня.csv via URL encoded path returned status: ${response.status}`);
        }
      } catch (err) {
        lastError = err;
        console.warn("[CSV Loader] URL encoded path fetch failed:", err);
      }
    }

    if (text) {
      loadCSVSongs(text);
      initAutocomplete();
      renderDashboardFavorites();
    } else {
      console.error("[CSV Loader] All paths to load Баня.csv failed. Last error:", lastError);
      initAutocomplete();
      renderDashboardFavorites();
    }
  }

  loadCSVWithFallbacks();
});

// Highlight words/phrases matching personalDictionary items in lyrics
function highlightWordsFromDictionary(text) {
  if (!text) return "";
  if (!personalDictionary || personalDictionary.length === 0) {
    return escapeHtml(text);
  }

  // Sort dictionary items by length of the target word/phrase in descending order
  // to prioritize matching longer phrases first and avoid partial substring overlap bugs
  const sortedDict = [...personalDictionary]
    .filter(item => item && item.word && item.word.trim().length > 0)
    .sort((a, b) => b.word.trim().length - a.word.trim().length);

  if (sortedDict.length === 0) {
    return escapeHtml(text);
  }

  const wordMap = {};
  const regexPatterns = [];

  // Helper to escape regex special characters
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  sortedDict.forEach(item => {
    const cleanWord = item.word.trim();
    const lowerWord = cleanWord.toLowerCase();
    if (!wordMap[lowerWord]) {
      wordMap[lowerWord] = item;
      regexPatterns.push(escapeRegex(cleanWord));
    }
  });

  if (regexPatterns.length === 0) {
    return escapeHtml(text);
  }

  // Compile words/phrases into case-insensitive regex pattern with word boundaries
  const patternString = `\\b(${regexPatterns.join('|')})\\b`;
  const regex = new RegExp(patternString, 'gi');

  const safeText = escapeHtml(text);

  return safeText.replace(regex, (matched) => {
    const item = wordMap[matched.toLowerCase()];
    if (!item) return matched;
    const safeMatched = escapeHtml(matched);
    return `<span class="dict-highlighted-word" onclick="window.showWordCard(event, '${safeMatched}')">${matched}</span>`;
  });
}

// Render dynamic lyrics to viewport
function renderSong(songKey) {
  const song = songsData[songKey];
  if (!song) return;

  const isSameSong = (songKey === lastRenderedSongKey);
  lastRenderedSongKey = songKey;

  const songHeaderCard = document.getElementById('songHeaderCard');
  if (songHeaderCard) {
    songHeaderCard.style.display = 'flex';
  }

  // Render header values
  albumArt.textContent = song.art;
  songBadge.textContent = song.genre;
  songTitle.textContent = song.title;
  songTitle.title = "Нажмите, чтобы перевести название и узнать смысл всей песни от ИИ!";
  songTitle.onclick = () => triggerSongMeaningAnalysis(songKey);
  artistName.textContent = song.artist;

  // Update favorite toggle button status in header
  const favoriteToggleBtn = document.getElementById('favoriteToggleBtn');
  if (favoriteToggleBtn) {
    if (isSongFavorite(songKey)) {
      favoriteToggleBtn.classList.add('active');
      favoriteToggleBtn.title = 'Удалить песню из избранного';
    } else {
      favoriteToggleBtn.classList.remove('active');
      favoriteToggleBtn.title = 'Добавить песню в избранное';
    }
  }

  // Save active line index before clearing to prevent losing selection
  const activeRow = lyricsBoard.querySelector('.lyrics-row-wrapper.active');
  const activeIndex = activeRow ? parseInt(activeRow.dataset.index) : null;

  // Clear existing lyrics
  lyricsBoard.innerHTML = '';

  // Inject premium empty state placeholder into the sidebar
  const sidebarContent = sidebarPanel.querySelector('.sidebar-content');
  if (sidebarContent && (!isSameSong || activeIndex === null)) {
    sidebarContent.innerHTML = `
      <div class="analysis-card" style="text-align: center; padding: 3rem 2rem; background: transparent; border: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem;">
        <div style="font-size: 3rem; animation: pulse 2s infinite ease-in-out;">✨</div>
        <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-main);">AI-Разбор Строф</div>
        <p style="font-size: 0.85rem; color: var(--text-sub); line-height: 1.5; margin: 0; max-width: 280px;">
          Нажмите на любую строчку песни слева, чтобы запустить мгновенный грамматический и лексический разбор с помощью ИИ.
        </p>
      </div>
    `;
  }

  // Render line list
  song.lines.forEach((line, index) => {
    const formattedNum = String(index + 1).padStart(2, '0');
    
    // Create rows with modular DOM elements
    const rowWrapper = document.createElement('div');
    rowWrapper.className = 'lyrics-row-wrapper';
    if (activeIndex !== null && index === activeIndex) {
      rowWrapper.classList.add('active');
    }
    rowWrapper.dataset.lineId = line.id;
    rowWrapper.dataset.index = index;

    rowWrapper.innerHTML = `
      <div class="lyric-line">
        <span class="line-number">${formattedNum}</span>
        <span class="line-text">${highlightWordsFromDictionary(line.text)}</span>
      </div>
    `;

    lyricsBoard.appendChild(rowWrapper);
  });

  // Re-bind actions on newly rendered items
  bindLyricClicks();

  // Initialize background pre-fetching UI and queue
  updatePrefetchUI(songKey);
  const toggleBtn = document.getElementById('togglePrefetchBtn');
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      prefetchPaused = !prefetchPaused;
      if (prefetchPaused) {
        clearPrefetchQueue();
      } else {
        startPrefetchingQueue(songKey);
      }
      updatePrefetchUI(songKey);
    };
  }
  
  if (!prefetchPaused) {
    startPrefetchingQueue(songKey);
  }

  // Initialize a random phrase builder game for the entire selected song on the main panel
  generateRandomPhraseGame(songKey);
}

// Bind click event handlers to all lyric lines
function bindLyricClicks() {
  const rows = document.querySelectorAll('.lyrics-row-wrapper');
  
  rows.forEach(row => {
    row.addEventListener('click', () => {
      // Remove active class from all rows
      rows.forEach(r => r.classList.remove('active'));
      
      // Add active state to clicked row
      row.classList.add('active');
      
      // Get data index and update sidebar
      const index = row.dataset.index;
      const activeLine = songsData[currentSongKey].lines[index];
      
      triggerSidebarAnalysis(activeLine);
    });
  });
}

/* ==========================================================================
   4. Speech Synthesis & Auxiliary Functions
   ========================================================================== */

function speakText(text) {
  if ('speechSynthesis' in window) {
    // Cancel any active speech speech synthesis
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    
    // Choose appropriate premium English speaking voice if available
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Natural') || 
      voice.name.includes('Samantha')
    );
    
    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }
    
    utterance.rate = 0.85; // Slightly slower for language learners
    window.speechSynthesis.speak(utterance);

    // Dynamic scale feedback on speak button during audio trigger
    const speakBtn = document.getElementById('speakBtn');
    if (speakBtn) {
      speakBtn.style.transform = 'scale(1.3)';
      setTimeout(() => speakBtn.style.transform = 'scale(1)', 400);
    }
  } else {
    alert("К сожалению, ваш браузер не поддерживает синтез речи.");
  }
}

/* ==========================================================================
   5. Event Listeners & Theme Optimizations
   ========================================================================== */

function setupEventListeners() {
  
  // Logo brand click -> go to Dashboard welcome hub
  const logoBrand = document.getElementById('navBrandLogo');
  if (logoBrand) {
    logoBrand.addEventListener('click', () => {
      showDashboard();
    });
  }

  // Dashboard Dictionary card trigger
  const dashGoDict = document.getElementById('dashGoDict');
  if (dashGoDict) {
    dashGoDict.addEventListener('click', () => {
      if (window.openDictionaryModal) {
        window.openDictionaryModal();
      }
    });
  }

  // Dashboard Training card trigger
  const dashGoTrain = document.getElementById('dashGoTrain');
  if (dashGoTrain) {
    dashGoTrain.addEventListener('click', () => {
      if (window.openTrainingModal) {
        window.openTrainingModal();
      }
    });
  }

  // Dashboard Quick-start recommendations
  const dashStartScorpions = document.getElementById('dashStartScorpions');
  if (dashStartScorpions) {
    dashStartScorpions.addEventListener('click', () => {
      pickSongFromSearch({id: 'scorpions', title: 'Wind of Change', artist: 'Scorpions', genre: 'Classic Rock', art: 'SC'});
    });
  }

  const dashStartMetallica = document.getElementById('dashStartMetallica');
  if (dashStartMetallica) {
    dashStartMetallica.addEventListener('click', () => {
      pickSongFromSearch({id: 'metallica', title: 'Nothing Else Matters', artist: 'Metallica', genre: 'Heavy Metal', art: 'ME'});
    });
  }

  const dashStartRHCP = document.getElementById('dashStartRHCP');
  if (dashStartRHCP) {
    dashStartRHCP.addEventListener('click', () => {
      pickSongFromSearch({id: 'rhcp', title: 'Californication', artist: 'Red Hot Chili Peppers', genre: 'Alternative Rock', art: 'RH'});
    });
  }

  // Audio Dictation button handlers
  const dictListenBtn = document.getElementById('dictationListenBtn');
  if (dictListenBtn) {
    dictListenBtn.addEventListener('click', () => {
      playHiddenPhrase(activeDictationOriginal);
    });
  }

  const dictHintBtn = document.getElementById('dictationHintBtn');
  if (dictHintBtn) {
    dictHintBtn.addEventListener('click', () => {
      dictHintBtn.textContent = `💡 ${activeDictationTranslation}`;
      dictHintBtn.disabled = true;
    });
  }

  const dictNewBtn = document.getElementById('dictationNewBtn');
  if (dictNewBtn) {
    dictNewBtn.addEventListener('click', () => {
      generateRandomPhraseGame(currentSongKey);
    });
  }

  const dictInput = document.getElementById('dictationInput');
  const dictCheckBtn = document.getElementById('dictationCheckBtn');
  if (dictInput && dictCheckBtn) {
    dictInput.addEventListener('input', () => {
      const isNotEmpty = dictInput.value.trim().length > 0;
      dictCheckBtn.disabled = !isNotEmpty;
      dictCheckBtn.style.opacity = isNotEmpty ? '1' : '0.5';
    });
  }

  if (dictCheckBtn) {
    dictCheckBtn.addEventListener('click', () => {
      const feedbackEl = document.getElementById('dictationFeedback');
      if (!feedbackEl || !dictInput) return;
      
      const userVal = normalizeTextForComparison(dictInput.value);
      const correctVal = normalizeTextForComparison(activeDictationOriginal);
      
      if (userVal === correctVal) {
        recordActivity();
        feedbackEl.style.display = 'block';
        feedbackEl.style.background = 'rgba(16, 185, 129, 0.15)';
        feedbackEl.style.border = '1px solid rgba(16, 185, 129, 0.3)';
        feedbackEl.style.color = '#10b981';
        feedbackEl.innerHTML = `🎉 Превосходно! Вы абсолютно верно расслышали и записали фразу! Она добавлена в ваши очки активности.`;
      } else {
        feedbackEl.style.display = 'block';
        feedbackEl.style.background = 'rgba(239, 68, 68, 0.15)';
        feedbackEl.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        feedbackEl.style.color = '#ef4444';
        feedbackEl.innerHTML = `❌ К сожалению, есть неточности. Попробуйте еще раз!<br><span style="display:inline-block; margin-top:0.4rem; font-size:0.9rem; opacity:0.85; color:var(--text-main);">Правильный вариант: <strong style="color:var(--accent-spotify);">${activeDictationOriginal}</strong></span>`;
      }
    });
  }

  // Phrase Builder refresh button handler
  const newPhraseBtn = document.getElementById('newPhraseBtn');
  if (newPhraseBtn) {
    newPhraseBtn.addEventListener('click', () => {
      generateRandomPhraseGame(currentSongKey);
    });
  }

  // Favorite Toggle Button Event Listener
  const favoriteToggleBtn = document.getElementById('favoriteToggleBtn');
  if (favoriteToggleBtn) {
    favoriteToggleBtn.addEventListener('click', () => {
      toggleSongFavorite(currentSongKey);
      
      if (isSongFavorite(currentSongKey)) {
        favoriteToggleBtn.classList.add('active');
        favoriteToggleBtn.title = 'Удалить песню из избранного';
      } else {
        favoriteToggleBtn.classList.remove('active');
        favoriteToggleBtn.title = 'Добавить песню в избранное';
      }

      // Auto-cache song metadata on favorite toggle for reliable dashboard rendering
      try {
        let songMeta = songsData[currentSongKey];
        if (!songMeta && csvSongs) {
          songMeta = csvSongs.find(s => s.id === currentSongKey);
        }
        if (!songMeta) {
          const title = document.getElementById('songTitle')?.textContent || '';
          const artist = document.getElementById('artistName')?.textContent || '';
          const genre = document.getElementById('songBadge')?.textContent || 'Pop';
          const art = document.getElementById('albumArt')?.textContent || 'M';
          if (title && artist) {
            songMeta = { id: currentSongKey, title, artist, genre, art };
          }
        }
        if (songMeta) {
          const cache = JSON.parse(localStorage.getItem('song_metadata_cache')) || {};
          cache[currentSongKey] = {
            id: currentSongKey,
            title: songMeta.title,
            artist: songMeta.artist,
            genre: songMeta.genre || 'Pop',
            art: songMeta.art || 'M'
          };
          localStorage.setItem('song_metadata_cache', JSON.stringify(cache));
        }
      } catch (e) {}

      // Keep dashboard in sync
      renderDashboardFavorites();
    });
  }

  // Close sidebar buttons
  closeBtn.addEventListener('click', closeSidebar);
  scrimOverlay.addEventListener('click', closeSidebar);

  // Hierarchical Esc key closure for all modals and drawers
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // 1. Settings Modal
      const settingsModal = document.getElementById('settingsModal');
      if (settingsModal && settingsModal.style.display !== 'none' && settingsModal.style.display !== '') {
        closeModalEl(settingsModal);
        return;
      }

      // 2. Add Word Modal (usually on top of Dictionary Modal)
      const addWordModal = document.getElementById('addWordModal');
      if (addWordModal && addWordModal.style.display !== 'none' && addWordModal.style.display !== '') {
        const closeBtn = document.getElementById('closeAddWordBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 2b. Add Phrase Modal (usually on top of Dictionary Modal)
      const addPhraseModal = document.getElementById('addPhraseModal');
      if (addPhraseModal && addPhraseModal.style.display !== 'none' && addPhraseModal.style.display !== '') {
        const closeBtn = document.getElementById('closeAddPhraseBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 3. Training Modal (usually on top of Dictionary Modal)
      const trainingModal = document.getElementById('trainingModal');
      if (trainingModal && trainingModal.style.display !== 'none' && trainingModal.style.display !== '') {
        const closeBtn = document.getElementById('closeTrainingModalBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 4. Roleplay Modal
      const roleplayModal = document.getElementById('roleplayModal');
      if (roleplayModal && roleplayModal.style.display !== 'none' && roleplayModal.style.display !== '') {
        const closeBtn = document.getElementById('closeRoleplayModalBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 5. Dictionary Modal
      const dictionaryModal = document.getElementById('dictionaryModal');
      if (dictionaryModal && dictionaryModal.style.display !== 'none' && dictionaryModal.style.display !== '') {
        const closeBtn = document.getElementById('closeDictionaryBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 6. Edit Lyrics Modal
      const editLyricsModal = document.getElementById('editLyricsModal');
      if (editLyricsModal && editLyricsModal.style.display !== 'none' && editLyricsModal.style.display !== '') {
        const closeBtn = document.getElementById('closeEditLyricsBtn') || document.getElementById('cancelEditLyricsBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 7. Artist Songs Modal
      const artistSongsModal = document.getElementById('artistSongsModal');
      if (artistSongsModal && artistSongsModal.style.display !== 'none' && artistSongsModal.style.display !== '') {
        const closeBtn = document.getElementById('closeArtistSongsModalBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 8. Video Course Modal
      const videoCourseModal = document.getElementById('videoCourseModal');
      if (videoCourseModal && videoCourseModal.style.display !== 'none' && videoCourseModal.style.display !== '') {
        const closeBtn = document.getElementById('closeVideoCourseModalBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 8b. Rules Modal
      const rulesModal = document.getElementById('rulesModal');
      if (rulesModal && rulesModal.style.display !== 'none' && rulesModal.style.display !== '') {
        const closeBtn = document.getElementById('closeRulesBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 9. Notebook Drawer
      const notebookModal = document.getElementById('notebookModal');
      if (notebookModal && notebookModal.classList.contains('is-open')) {
        const closeBtn = document.getElementById('closeNotebookBtn');
        if (closeBtn) closeBtn.click();
        return;
      }

      // 10. Sidebar Panel (Right details sidebar)
      if (typeof closeSidebar === 'function') {
        const sidebarPanel = document.getElementById('sidebarPanel');
        if (sidebarPanel && sidebarPanel.classList.contains('open')) {
          closeSidebar();
          return;
        }
      }
    }
  });

  // Low performance switch to disable backdrop-filter blur for GPU boost
  const perfToggle = document.getElementById('performanceToggle');
  if (perfToggle) {
    perfToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.classList.add('no-blur-mode');
      } else {
        document.body.classList.remove('no-blur-mode');
      }
    });
  }

  // Three-Theme Switcher logic (Dark -> Light -> Gray -> Dark) with localStorage persistence
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      if (document.body.classList.contains('light-theme')) {
        // Light -> Gray
        document.body.classList.remove('light-theme');
        document.body.classList.add('gray-theme');
        localStorage.setItem('theme', 'gray');
        updateThemeIcons('gray');
      } else if (document.body.classList.contains('gray-theme')) {
        // Gray -> Dark
        document.body.classList.remove('gray-theme');
        localStorage.setItem('theme', 'dark');
        updateThemeIcons('dark');
      } else {
        // Dark -> Light
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
        updateThemeIcons('light');
      }
    });
  }

  // Initialize the custom interactive AI chat panel
  initCustomChat();

  // API Settings Modal Event Listeners
  const apiSettingsBtn = document.getElementById('apiSettingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const resetApiKeyBtn = document.getElementById('resetApiKeyBtn');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const apiStatusMessage = document.getElementById('apiStatusMessage');

  // Application Settings & Hotkeys Manager
  let tempNotebookHotkey = null;
  let isRecordingHotkey = false;

  const hotkeyRecorder = document.getElementById('notebookHotkeyRecorder');
  const hotkeyClear = document.getElementById('notebookHotkeyClear');
  const mouseTriggerSelect = document.getElementById('notebookMouseTriggerSelect');

  // Initialize UI state on page startup
  try {
    const savedHk = localStorage.getItem('galaxy_notebook_hotkey');
    if (savedHk) {
      const hk = JSON.parse(savedHk);
      tempNotebookHotkey = hk;
      if (hotkeyRecorder) hotkeyRecorder.textContent = hk.display;
    } else {
      if (hotkeyRecorder) hotkeyRecorder.textContent = 'Не назначено';
    }
    const savedMouse = localStorage.getItem('galaxy_notebook_mouse_trigger') || 'none';
    if (mouseTriggerSelect) mouseTriggerSelect.value = savedMouse;

    const savedCapitalize = localStorage.getItem('galaxy_dictionary_capitalize') !== 'false';
    const dictionaryCapitalizeToggle = document.getElementById('dictionaryCapitalizeToggle');
    if (dictionaryCapitalizeToggle) dictionaryCapitalizeToggle.checked = savedCapitalize;

    const savedSpotifyAutoPause = localStorage.getItem('galaxy_spotify_auto_pause') !== 'false';
    const spotifyAutoPauseToggle = document.getElementById('spotifyAutoPauseToggle');
    if (spotifyAutoPauseToggle) spotifyAutoPauseToggle.checked = savedSpotifyAutoPause;

    const savedSpotifyNowPlaying = localStorage.getItem('galaxy_spotify_now_playing') !== 'false';
    const spotifyNowPlayingToggle = document.getElementById('spotifyNowPlayingToggle');
    if (spotifyNowPlayingToggle) spotifyNowPlayingToggle.checked = savedSpotifyNowPlaying;

    const savedGPU = localStorage.getItem('galaxy_gpu_saving') === 'true';
    const performanceToggle = document.getElementById('performanceToggle');
    if (performanceToggle) {
      performanceToggle.checked = savedGPU;
      if (savedGPU) {
        document.body.classList.add('no-blur-mode');
      } else {
        document.body.classList.remove('no-blur-mode');
      }
    }
  } catch (e) {
    if (hotkeyRecorder) hotkeyRecorder.textContent = 'Не назначено';
  }

  // Recorder button listener
  if (hotkeyRecorder) {
    hotkeyRecorder.addEventListener('click', (e) => {
      e.preventDefault();
      isRecordingHotkey = true;
      window._isRecordingNotebookHotkey = true;
      hotkeyRecorder.textContent = '🔑 Нажмите клавишу... (Esc для отмены)';
      hotkeyRecorder.style.borderColor = '#fbbf24';
      hotkeyRecorder.style.background = 'rgba(251, 191, 36, 0.08)';
    });

    // Capture the keypress for hotkey recording
    window.addEventListener('keydown', (e) => {
      if (!isRecordingHotkey) return;

      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        isRecordingHotkey = false;
        window._isRecordingNotebookHotkey = false;
        hotkeyRecorder.style.borderColor = '';
        hotkeyRecorder.style.background = '';
        if (tempNotebookHotkey && tempNotebookHotkey.display) {
          hotkeyRecorder.textContent = tempNotebookHotkey.display;
        } else {
          hotkeyRecorder.textContent = 'Не назначено';
        }
        return;
      }

      // We ignore lonely modifiers during recording, wait until a full key is pressed
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const parts = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      
      let keyName = e.key;
      if (e.code.startsWith('Key')) {
        keyName = e.code.replace('Key', '');
      } else if (e.code.startsWith('Digit')) {
        keyName = e.code.replace('Digit', '');
      } else if (e.code.startsWith('Numpad')) {
        keyName = e.code.replace('Numpad', 'Num ');
      }
      
      parts.push(keyName.toUpperCase());

      const display = parts.join(' + ');
      tempNotebookHotkey = {
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        code: e.code,
        key: e.key,
        display: display
      };

      hotkeyRecorder.textContent = display;
      hotkeyRecorder.style.borderColor = '';
      hotkeyRecorder.style.background = '';
      isRecordingHotkey = false;
      window._isRecordingNotebookHotkey = false;
    }, true);
  }

  // Clear button listener
  if (hotkeyClear) {
    hotkeyClear.addEventListener('click', (e) => {
      e.preventDefault();
      tempNotebookHotkey = null;
      if (hotkeyRecorder) hotkeyRecorder.textContent = 'Не назначено';
    });
  }

  // Global keyboard shortcut to open/close Notebook
  window.addEventListener('keydown', (e) => {
    if (window._isRecordingNotebookHotkey) return; // ignore when recording a new hotkey

    try {
      const saved = localStorage.getItem('galaxy_notebook_hotkey');
      if (!saved) return;
      const hotkey = JSON.parse(saved);
      if (!hotkey || !hotkey.code) return;

      if (
        e.ctrlKey === !!hotkey.ctrl &&
        e.altKey === !!hotkey.alt &&
        e.shiftKey === !!hotkey.shift &&
        e.code === hotkey.code
      ) {
        const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
        const isInsideNotebook = e.target.closest('#notebookModal') !== null;
        // If they are actively typing and the shortcut does not require any modifier, ignore it
        // EXCEPT when the focus is inside the notebook itself (so they can toggle it closed).
        if (isTyping && !hotkey.ctrl && !hotkey.alt && !hotkey.shift && !isInsideNotebook) return;

        e.preventDefault();
        e.stopPropagation();
        if (typeof window.toggleNotebook === 'function') {
          window.toggleNotebook();
        }
      }
    } catch (err) {}
  }, true);

  // Global mouse triggers to open/close Notebook
  window.addEventListener('auxclick', (e) => {
    // Middle click is button 1
    if (e.button !== 1) return;

    try {
      const trigger = localStorage.getItem('galaxy_notebook_mouse_trigger') || 'none';
      if (trigger !== 'middle') return;

      const isInteractive = e.target.closest('input, textarea, button, a, select, [role="button"]');
      if (isInteractive) return;

      e.preventDefault();
      e.stopPropagation();
      if (typeof window.toggleNotebook === 'function') {
        window.toggleNotebook();
      }
    } catch (err) {}
  });

  window.addEventListener('dblclick', (e) => {
    try {
      const trigger = localStorage.getItem('galaxy_notebook_mouse_trigger') || 'none';
      if (trigger !== 'dblclick') return;

      const isInteractive = e.target.closest('input, textarea, button, a, select, [role="button"]');
      if (isInteractive) return;

      e.preventDefault();
      e.stopPropagation();
      if (typeof window.toggleNotebook === 'function') {
        window.toggleNotebook();
      }
    } catch (err) {}
  });

  if (apiSettingsBtn && settingsModal && closeSettingsBtn) {
    // Open modal
    apiSettingsBtn.addEventListener('click', () => {
      // Pre-fill with user's saved key if exists
      const savedKey = localStorage.getItem('user_api_key') || '';
      apiKeyInput.value = savedKey;

      // Load settings inside the recorder and select fields
      try {
        const savedHk = localStorage.getItem('galaxy_notebook_hotkey');
        if (savedHk) {
          const hk = JSON.parse(savedHk);
          tempNotebookHotkey = hk;
          if (hotkeyRecorder) hotkeyRecorder.textContent = hk.display;
        } else {
          tempNotebookHotkey = null;
          if (hotkeyRecorder) hotkeyRecorder.textContent = 'Не назначено';
        }
        const savedMouse = localStorage.getItem('galaxy_notebook_mouse_trigger') || 'none';
        if (mouseTriggerSelect) mouseTriggerSelect.value = savedMouse;
      } catch (e) {
        tempNotebookHotkey = null;
        if (hotkeyRecorder) hotkeyRecorder.textContent = 'Не назначено';
      }
      
      // Clear status
      apiStatusMessage.style.display = 'none';
      apiStatusMessage.className = 'modal-status';
      
      openModalEl(settingsModal);
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
    });

    // Close modal
    const closeModal = () => {
      closeModalEl(settingsModal);
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    };
    closeSettingsBtn.addEventListener('click', closeModal);
    
    // Save settings
    saveApiKeyBtn.addEventListener('click', () => {
      const keyVal = apiKeyInput.value.trim();
      if (keyVal) {
        localStorage.setItem('user_api_key', keyVal);
      } else {
        localStorage.removeItem('user_api_key');
      }

      // Save Hotkey
      if (tempNotebookHotkey) {
        localStorage.setItem('galaxy_notebook_hotkey', JSON.stringify(tempNotebookHotkey));
      } else {
        localStorage.removeItem('galaxy_notebook_hotkey');
      }

      // Save Mouse Trigger
      if (mouseTriggerSelect) {
        localStorage.setItem('galaxy_notebook_mouse_trigger', mouseTriggerSelect.value);
      }

      // Save Dictionary Capitalize setting
      const dictionaryCapitalizeToggle = document.getElementById('dictionaryCapitalizeToggle');
      if (dictionaryCapitalizeToggle) {
        localStorage.setItem('galaxy_dictionary_capitalize', dictionaryCapitalizeToggle.checked ? 'true' : 'false');
      }

      // Save Spotify Auto-Pause setting
      const spotifyAutoPauseToggle = document.getElementById('spotifyAutoPauseToggle');
      if (spotifyAutoPauseToggle) {
        localStorage.setItem('galaxy_spotify_auto_pause', spotifyAutoPauseToggle.checked ? 'true' : 'false');
      }

      // Save Spotify Now Playing setting
      const spotifyNowPlayingToggle = document.getElementById('spotifyNowPlayingToggle');
      if (spotifyNowPlayingToggle) {
        localStorage.setItem('galaxy_spotify_now_playing', spotifyNowPlayingToggle.checked ? 'true' : 'false');
        // Immediately start or stop polling
        if (typeof SpotifyController !== 'undefined') {
          if (spotifyNowPlayingToggle.checked) {
            SpotifyController.startNowPlayingPolling();
          } else {
            SpotifyController.stopNowPlayingPolling();
          }
        }
      }

      // Save GPU setting
      const performanceToggle = document.getElementById('performanceToggle');
      if (performanceToggle) {
        localStorage.setItem('galaxy_gpu_saving', performanceToggle.checked ? 'true' : 'false');
      }
      const speedTog = document.getElementById('videoAutoAccelerateToggle');
      if (speedTog) localStorage.setItem('galaxy_video_2x', speedTog.checked ? 'true' : 'false');
      
      apiStatusMessage.textContent = 'Настройки успешно сохранены!';
      apiStatusMessage.style.display = 'block';
      apiStatusMessage.className = 'modal-status success';
      
      setTimeout(closeModal, 1200);
    });

    // Reset settings
    resetApiKeyBtn.addEventListener('click', () => {
      localStorage.removeItem('user_api_key');
      localStorage.removeItem('galaxy_notebook_hotkey');
      localStorage.removeItem('galaxy_notebook_mouse_trigger');

      apiKeyInput.value = '';
      tempNotebookHotkey = null;
      if (hotkeyRecorder) hotkeyRecorder.textContent = 'Не назначено';
      if (mouseTriggerSelect) mouseTriggerSelect.value = 'none';

      localStorage.removeItem('galaxy_dictionary_capitalize');
      const dictionaryCapitalizeToggle = document.getElementById('dictionaryCapitalizeToggle');
      if (dictionaryCapitalizeToggle) dictionaryCapitalizeToggle.checked = true;

      localStorage.removeItem('galaxy_spotify_auto_pause');
      const spotifyAutoPauseToggle = document.getElementById('spotifyAutoPauseToggle');
      if (spotifyAutoPauseToggle) spotifyAutoPauseToggle.checked = true;

      localStorage.removeItem('galaxy_spotify_now_playing');
      const spotifyNowPlayingToggle = document.getElementById('spotifyNowPlayingToggle');
      if (spotifyNowPlayingToggle) spotifyNowPlayingToggle.checked = true;
      if (typeof SpotifyController !== 'undefined') SpotifyController.startNowPlayingPolling();

      localStorage.removeItem('galaxy_gpu_saving');
      const performanceToggle = document.getElementById('performanceToggle');
      if (performanceToggle) {
        performanceToggle.checked = false;
        document.body.classList.remove('no-blur-mode');
      }

      apiStatusMessage.textContent = 'Все настройки сброшены по умолчанию!';
      apiStatusMessage.style.display = 'block';
      apiStatusMessage.className = 'modal-status success';
      
      setTimeout(closeModal, 1200);
    });

    // --- Резервное копирование и Перенос прогресса ---
    const exportBackupBtn = document.getElementById('exportBackupBtn');
    const importBackupBtn = document.getElementById('importBackupBtn');
    const importBackupFileInput = document.getElementById('importBackupFileInput');
    const backupStatusMessage = document.getElementById('backupStatusMessage');

    const backupKeys = [
      'favorite_songs',
      'song_metadata_cache',
      'user_api_key',
      'personal_categories',
      'personal_custom_categories',
      'personal_dictionary',
      'galaxy_dictionary_capitalize',
      'galaxy_notebook_hotkey',
      'galaxy_notebook_mouse_trigger',
      'galaxy_gpu_saving',
      'theme',
      'galaxy_study_session_queue',
      'galaxy_study_session_total',
      'galaxy_study_session_learned',
      'galaxy_study_session_learned_list',
      'dictionary_activity',
      'galaxy_watched_videos',
      'user_notebook_text',
      'galaxy_lesson_notes',
      'galaxy_custom_note_folders',
      'grammar_rules',
      'dict_size_prefs',
      'addWord_smartInput_settings'
    ];

    if (exportBackupBtn) {
      exportBackupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        try {
          const backupData = {};
          backupKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value !== null) {
              backupData[key] = value;
            }
          });

          // Дополнительные метаданные
          backupData['_metadata'] = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            app: 'EnglishSub'
          };

          const dataStr = JSON.stringify(backupData, null, 2);
          const blob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);

          const exportFileDefaultName = `englishsub_backup_${new Date().toISOString().split('T')[0]}.json`;

          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', url);
          linkElement.setAttribute('download', exportFileDefaultName);
          document.body.appendChild(linkElement);
          linkElement.click();
          document.body.removeChild(linkElement);

          // Очистка URL объекта (увеличена задержка для мобильных браузеров)
          setTimeout(() => URL.revokeObjectURL(url), 10000);

          if (backupStatusMessage) {
            backupStatusMessage.textContent = 'Данные экспортированы!';
            backupStatusMessage.style.display = 'block';
            backupStatusMessage.className = 'modal-status success';
            setTimeout(() => { backupStatusMessage.style.display = 'none'; }, 3000);
          }
        } catch (err) {
          console.error('Backup export failed:', err);
          if (backupStatusMessage) {
            backupStatusMessage.textContent = 'Ошибка экспорта данных!';
            backupStatusMessage.style.display = 'block';
            backupStatusMessage.className = 'modal-status error';
          }
        }
      });
    }

    if (importBackupBtn && importBackupFileInput) {
      importBackupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        importBackupFileInput.value = ''; // сброс предыдущего выбора
        importBackupFileInput.click();
      });

      importBackupFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
          try {
            const importedData = JSON.parse(evt.target.result);
            
            if (!importedData || typeof importedData !== 'object') {
              throw new Error('Некорректный формат файла резервной копии.');
            }

            let importCount = 0;
            backupKeys.forEach(key => {
              if (importedData[key] !== undefined && importedData[key] !== null) {
                localStorage.setItem(key, importedData[key]);
                importCount++;
              }
            });

            if (importCount === 0) {
              throw new Error('В файле нет подходящих данных для импорта EnglishSub.');
            }

            if (backupStatusMessage) {
              backupStatusMessage.textContent = 'Успешно! Страница перезагружается...';
              backupStatusMessage.style.display = 'block';
              backupStatusMessage.className = 'modal-status success';
            }

            setTimeout(() => {
              window.location.reload();
            }, 1200);

          } catch (err) {
            console.error('Backup import failed:', err);
            if (backupStatusMessage) {
              backupStatusMessage.textContent = `Ошибка: ${err.message || 'неверный формат JSON'}`;
              backupStatusMessage.style.display = 'block';
              backupStatusMessage.className = 'modal-status error';
            }
          }
        };
        reader.readAsText(file);
      });
    }
  }

  // --- Cloud Sync Event Listeners ---
  const syncGoogleLoginBtn = document.getElementById('syncGoogleLoginBtn');
  const syncLinkCodeBtn = document.getElementById('syncLinkCodeBtn');
  const syncCodeInput = document.getElementById('syncCodeInput');
  const syncLogoutBtn = document.getElementById('syncLogoutBtn');
  
  const syncNotLoggedContainer = document.getElementById('syncNotLoggedContainer');
  const syncLoggedInContainer = document.getElementById('syncLoggedInContainer');
  const syncUserEmail = document.getElementById('syncUserEmail');
  const syncCodeDisplayContainer = document.getElementById('syncCodeDisplayContainer');
  const syncUserCode = document.getElementById('syncUserCode');

  const updateSyncUI = (user) => {
    if (!syncNotLoggedContainer) return;
    if (user) {
      syncNotLoggedContainer.style.display = 'none';
      syncLoggedInContainer.style.display = 'flex';
      syncUserEmail.textContent = user.displayName || user.email || 'Связанный профиль';
      
      // If it's a real Google auth user, show their UID so they can copy it to phone
      if (!user.isOverride && user.uid) {
        syncCodeDisplayContainer.style.display = 'block';
        syncUserCode.textContent = user.uid;
      } else {
        syncCodeDisplayContainer.style.display = 'none';
      }
    } else {
      syncNotLoggedContainer.style.display = 'flex';
      syncLoggedInContainer.style.display = 'none';
    }
  };

  const initSyncSettings = () => {
    if (!window.SyncManager) {
      setTimeout(initSyncSettings, 500);
      return;
    }
    
    // Initial sync UI state
    updateSyncUI(window.SyncManager.getCurrentUser());
    
    // Listen for auth changes
    window.SyncManager.onUserChanged((user) => {
      updateSyncUI(user);
    });

    // Login via Google (for PC)
    if (syncGoogleLoginBtn) {
      syncGoogleLoginBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          const user = await window.SyncManager.signIn();
          updateSyncUI(user);
        } catch (err) {
          console.error(err);
        }
      });
    }

    // Link via Code (for Mobile)
    if (syncLinkCodeBtn) {
      syncLinkCodeBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const code = syncCodeInput.value.trim();
        if (code) {
          await window.SyncManager.linkWithCode(code);
        }
      });
    }

    // Logout / Unlink
    if (syncLogoutBtn) {
      syncLogoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await window.SyncManager.logout();
      });
    }
  };
  
  // Call init to setup polling for SyncManager module
  initSyncSettings();
  // Edit Lyrics Modal Event Listeners
  const editLyricsBtn = document.getElementById('editLyricsBtn');
  const editLyricsModal = document.getElementById('editLyricsModal');
  const closeEditLyricsBtn = document.getElementById('closeEditLyricsBtn');
  const cancelEditLyricsBtn = document.getElementById('cancelEditLyricsBtn');
  const saveEditLyricsBtn = document.getElementById('saveEditLyricsBtn');
  const editLyricsTextarea = document.getElementById('editLyricsTextarea');

  if (editLyricsBtn && editLyricsModal && closeEditLyricsBtn) {
    // Open modal with current lyrics
    editLyricsBtn.addEventListener('click', () => {
      const song = songsData[currentSongKey];
      if (!song) {
        alert("Сначала выберите или найдите песню для редактирования!");
        return;
      }
      
      // Join stanzas by double newlines for natural reading
      const fullText = song.lines.map(line => line.text).join('\n\n');
      editLyricsTextarea.value = fullText;
      
      openModalEl(editLyricsModal);
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
    });

    const closeEditModal = () => {
      closeModalEl(editLyricsModal);
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    };

    closeEditLyricsBtn.addEventListener('click', closeEditModal);
    cancelEditLyricsBtn.addEventListener('click', closeEditModal);
    
    // Backdrop click intentionally disabled — use the close button (✕) to dismiss

    // Save edited lyrics
    saveEditLyricsBtn.addEventListener('click', () => {
      const newText = editLyricsTextarea.value.trim();
      if (!newText) {
        alert("Пожалуйста, введите текст песни!");
        return;
      }

      const segmented = segmentLyricsIntoStanzas(newText);
      if (segmented.length === 0) {
        alert("Не удалось распознать куплеты. Убедитесь, что текст не пустой!");
        return;
      }

      // Update current song lines
      songsData[currentSongKey].lines = segmented;
      
      // Re-render song!
      renderSong(currentSongKey);
      
      closeEditModal();
    });
  }
}

function closeSidebar() {
  scrimOverlay.classList.remove('visible');
  sidebarPanel.classList.remove('open');
  document.documentElement.classList.remove('modal-open');
  document.body.classList.remove('modal-open');
  
  // Remove selection outline from lines on close
  const rows = document.querySelectorAll('.lyrics-row-wrapper');
  rows.forEach(r => r.classList.remove('active'));
}

// Restore active theme setting on boot
function restoreSavedTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    updateThemeIcons('light');
  } else if (savedTheme === 'gray') {
    document.body.classList.add('gray-theme');
    updateThemeIcons('gray');
  } else {
    updateThemeIcons('dark');
  }
}

// Keep button icons strictly synchronized with theme states
function updateThemeIcons(theme) {
  if (!themeToggleBtn) return;
  const sunIcon = themeToggleBtn.querySelector('.sun-icon');
  const grayIcon = themeToggleBtn.querySelector('.gray-icon');
  const moonIcon = themeToggleBtn.querySelector('.moon-icon');

  if (theme === 'light') {
    sunIcon.style.display = 'none';
    grayIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  } else if (theme === 'gray') {
    sunIcon.style.display = 'none';
    grayIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  } else {
    sunIcon.style.display = 'block';
    grayIcon.style.display = 'none';
    moonIcon.style.display = 'none';
  }
}

// Warm up Speech Synthesis voices collection for Chrome/Safari compatibility
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
}

// Ask custom AI question via Gemini or OpenRouter
async function askAICustomQuestion(questionText) {
  requireAPIKey();
  const currentApiKey = getAPIKey();
  const promptText = `Ты преподаватель английского. Помоги ученику. Мы разбираем строку из песни: "${activeOriginalText}". Ученик задал вопрос по этой строке: "${questionText}". Ответь ему понятно, развернуто и дружелюбно на русском языке. Ответ должен быть кратким (до 3-4 предложений).`;

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
        messages: [
          { role: "user", content: promptText }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter returned status ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content;
  } else {
    // Default Google Gemini 2.0 Flash API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentApiKey}`;
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: promptText
            }
          ]
        }
      ],
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

// Setup Interactive Custom AI Chat
function initCustomChat() {
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const chatResponse = document.getElementById('chatResponse');

  if (!chatSendBtn || !chatInput || !chatResponse) return;

  chatSendBtn.addEventListener('click', async () => {
    const questionText = chatInput.value.trim();
    if (!questionText) return;

    // Show shimmering loading state
    chatResponse.style.display = 'block';
    chatResponse.innerHTML = `
      <div class="chat-response-shimmer">
        <div class="shimmer-row"></div>
        <div class="shimmer-row"></div>
        <div class="shimmer-row"></div>
      </div>
    `;

    // Clear input
    chatInput.value = '';

    try {
      const response = await askAICustomQuestion(questionText);
      if (response) {
        chatResponse.textContent = response.trim();
      } else {
        chatResponse.textContent = 'Ошибка: Получен пустой ответ от ИИ-преподавателя.';
      }
    } catch (error) {
      console.error(error);
      chatResponse.textContent = 'Не удалось получить ответ от ИИ. Пожалуйста, попробуйте еще раз.';
    }
  });

  // Support hitting Enter to submit (without holding shift)
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatSendBtn.click();
    }
  });
}

// ==========================================================================
// 5. Personal Dictionary & 3D Flashcard word trainer
// ==========================================================================

let activeDictTab = 'personal'; // 'personal' or 'essential'
let dictTypeFilter = 'all'; // 'all', 'words', or 'phrases'
let dictSortOption = 'default'; // Sort option for the dictionary
let personalDictionary = [];
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

let personalCategories = ['Общее', 'Базовые глаголы', 'Сленг и идиомы', 'Социальные фразы'];
let personalCustomCategories = ['Сленг', 'Идиомы', 'Грамматика', 'Путешествия'];

function loadCategories() {
  try {
    const saved = localStorage.getItem('personal_categories');
    if (saved) {
      personalCategories = JSON.parse(saved);
    } else {
      localStorage.setItem('personal_categories', JSON.stringify(personalCategories));
    }
    
    const savedCustom = localStorage.getItem('personal_custom_categories');
    if (savedCustom) {
      personalCustomCategories = JSON.parse(savedCustom);
    } else {
      localStorage.setItem('personal_custom_categories', JSON.stringify(personalCustomCategories));
    }
  } catch (e) {
    console.error("Failed to load categories:", e);
  }
}

function saveCategories() {
  localStorage.setItem('personal_categories', JSON.stringify(personalCategories));
  localStorage.setItem('personal_custom_categories', JSON.stringify(personalCustomCategories));
}

function populateCategorySelectors() {
  // 1. Populate dictCategoryFilter (Folders) in modal
  const dictFilter = document.getElementById('dictCategoryFilter');
  if (dictFilter) {
    const currentValue = dictFilter.value || '';
    dictFilter.innerHTML = '';
    
    if (activeDictTab === 'personal') {
      // Add default "All folders"
      const allOpt = document.createElement('option');
      allOpt.value = 'Все слова';
      allOpt.textContent = '📚 Все папки';
      dictFilter.appendChild(allOpt);
      
      // Add custom folders
      personalCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = `📁 ${cat}`;
        dictFilter.appendChild(option);
      });
      
      if (currentValue === 'Все слова' || personalCategories.includes(currentValue)) {
        dictFilter.value = currentValue;
      } else {
        dictFilter.value = 'Все слова';
      }
    } else {
      // Add 3 preloaded essential packs
      const p1 = document.createElement('option');
      p1.value = '«Топ-300 Первых слов»';
      p1.textContent = '🎓 «Топ-300 Первых слов»';
      dictFilter.appendChild(p1);
      
      const p2 = document.createElement('option');
      p2.value = '«Топ-600 Базовых слов»';
      p2.textContent = '🎓 «Топ-600 Базовых слов»';
      dictFilter.appendChild(p2);
      
      const p3 = document.createElement('option');
      p3.value = '«Топ-1000 Продвинутых слов»';
      p3.textContent = '🎓 «Топ-1000 Продвинутых слов»';
      dictFilter.appendChild(p3);
      
      if (currentValue.startsWith('«Топ-')) {
        dictFilter.value = currentValue;
      } else {
        dictFilter.value = '«Топ-300 Первых слов»';
      }
    }
  }

  // 1b. Populate dictCustomCategoryFilter (Categories) in modal
  const dictCustomFilter = document.getElementById('dictCustomCategoryFilter');
  if (dictCustomFilter) {
    const currentValue = dictCustomFilter.value || '';
    dictCustomFilter.innerHTML = '';
    
    const allOpt = document.createElement('option');
    allOpt.value = 'Все категории';
    allOpt.textContent = '🏷️ Все категории';
    dictCustomFilter.appendChild(allOpt);
    
    const noneOpt = document.createElement('option');
    noneOpt.value = 'Без категории';
    noneOpt.textContent = '🏷️ Без категории';
    dictCustomFilter.appendChild(noneOpt);
    
    personalCustomCategories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = `🏷️ ${cat}`;
      dictCustomFilter.appendChild(option);
    });
    
    if (currentValue === 'Все категории' || currentValue === 'Без категории' || personalCustomCategories.includes(currentValue)) {
      dictCustomFilter.value = currentValue;
    } else {
      dictCustomFilter.value = 'Все категории';
    }
  }

  // 2. Populate wordCategorySelect inside sidebar if it is present
  const wordSelect = document.getElementById('wordCategorySelect');
  if (wordSelect) {
    const currentValue = wordSelect.value || 'Общее';
    wordSelect.innerHTML = '';
    personalCategories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = `📁 ${cat}`;
      wordSelect.appendChild(option);
    });
    if (personalCategories.includes(currentValue)) {
      wordSelect.value = currentValue;
    } else {
      wordSelect.value = 'Общее';
    }
  }

  // 2b. Populate wordCustomCategorySelect inside sidebar if it is present
  const wordCustomSelect = document.getElementById('wordCustomCategorySelect');
  if (wordCustomSelect) {
    const currentValue = wordCustomSelect.value || 'Без категории';
    wordCustomSelect.innerHTML = '';
    
    const noneOpt = document.createElement('option');
    noneOpt.value = 'Без категории';
    noneOpt.textContent = '🏷️ Без категории';
    wordCustomSelect.appendChild(noneOpt);
    
    personalCustomCategories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = `🏷️ ${cat}`;
      wordCustomSelect.appendChild(option);
    });
    if (currentValue === 'Без категории' || personalCustomCategories.includes(currentValue)) {
      wordCustomSelect.value = currentValue;
    } else {
      wordCustomSelect.value = 'Без категории';
    }
  }

  // 3. Populate manualWordCategory multi-pill container in manual add modal
  const multiCatContainer = document.getElementById('manualCategoryPillsContainer');
  if (multiCatContainer) {
    // Collect currently selected categories from existing pills
    const currentSelected = Array.from(multiCatContainer.querySelectorAll('.mcat-pill.selected'))
      .map(p => p.dataset.cat);
    const preSelected = currentSelected.length > 0 ? currentSelected : ['Общее'];

    multiCatContainer.innerHTML = '';
    personalCategories.forEach(cat => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mcat-pill' + (preSelected.includes(cat) ? ' selected' : '');
      pill.dataset.cat = cat;
      pill.textContent = `📁 ${cat}`;
      pill.style.cssText = `
        padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
        cursor: pointer; border: 1px solid rgba(255,255,255,0.12); transition: all 0.18s;
        outline: none; white-space: nowrap;
        background: ${preSelected.includes(cat) ? 'rgba(29,185,84,0.2)' : 'rgba(255,255,255,0.04)'};
        color: ${preSelected.includes(cat) ? '#1db954' : 'var(--text-sub)'};
        border-color: ${preSelected.includes(cat) ? 'rgba(29,185,84,0.4)' : 'rgba(255,255,255,0.1)'};
      `;
      pill.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const isOn = pill.classList.contains('selected');
        // Require at least one selected
        const allSelected = multiCatContainer.querySelectorAll('.mcat-pill.selected');
        if (isOn && allSelected.length <= 1) return;
        pill.classList.toggle('selected', !isOn);
        pill.style.background = !isOn ? 'rgba(29,185,84,0.2)' : 'rgba(255,255,255,0.04)';
        pill.style.color = !isOn ? '#1db954' : 'var(--text-sub)';
        pill.style.borderColor = !isOn ? 'rgba(29,185,84,0.4)' : 'rgba(255,255,255,0.1)';
      });
      multiCatContainer.appendChild(pill);
    });
  }

  // 3b. Populate manualWordCustomCategory multi-pill container in manual add modal
  const wordCustomCont = document.getElementById('manualWordCustomCategoryPillsContainer');
  if (wordCustomCont) {
    const currentSelected = Array.from(wordCustomCont.querySelectorAll('.mcat-pill.selected'))
      .map(p => p.dataset.cat);
    const preSelected = currentSelected.length > 0 ? currentSelected : ['Без категории'];

    wordCustomCont.innerHTML = '';
    
    const getPillStyle = (isSelected) => `
      padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
      cursor: pointer; border: 1px solid rgba(255,255,255,0.12); transition: all 0.18s;
      outline: none; white-space: nowrap;
      background: ${isSelected ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)'};
      color: ${isSelected ? '#a78bfa' : 'var(--text-sub)'};
      border-color: ${isSelected ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)'};
    `;
    const setPillActiveStyle = (pill, isSelected) => {
      pill.style.background = isSelected ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)';
      pill.style.color = isSelected ? '#a78bfa' : 'var(--text-sub)';
      pill.style.borderColor = isSelected ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)';
    };

    const nonePill = document.createElement('button');
    nonePill.type = 'button';
    nonePill.className = 'mcat-pill' + (preSelected.includes('Без категории') ? ' selected' : '');
    nonePill.dataset.cat = 'Без категории';
    nonePill.textContent = '🏷️ Без категории';
    nonePill.style.cssText = getPillStyle(preSelected.includes('Без категории'));
    nonePill.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const isOn = nonePill.classList.contains('selected');
      if (isOn) {
        const allSelected = wordCustomCont.querySelectorAll('.mcat-pill.selected');
        if (allSelected.length <= 1) return;
        nonePill.classList.remove('selected');
        setPillActiveStyle(nonePill, false);
      } else {
        wordCustomCont.querySelectorAll('.mcat-pill.selected').forEach(p => {
          if (p.dataset.cat !== 'Без категории') {
            p.classList.remove('selected');
            setPillActiveStyle(p, false);
          }
        });
        nonePill.classList.add('selected');
        setPillActiveStyle(nonePill, true);
      }
    });
    wordCustomCont.appendChild(nonePill);

    personalCustomCategories.forEach(cat => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mcat-pill' + (preSelected.includes(cat) ? ' selected' : '');
      pill.dataset.cat = cat;
      pill.textContent = `🏷️ ${cat}`;
      pill.style.cssText = getPillStyle(preSelected.includes(cat));
      pill.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const isOn = pill.classList.contains('selected');
        if (isOn) {
          const allSelected = wordCustomCont.querySelectorAll('.mcat-pill.selected');
          if (allSelected.length <= 1) {
            pill.classList.remove('selected');
            setPillActiveStyle(pill, false);
            nonePill.classList.add('selected');
            setPillActiveStyle(nonePill, true);
          } else {
            pill.classList.remove('selected');
            setPillActiveStyle(pill, false);
          }
        } else {
          nonePill.classList.remove('selected');
          setPillActiveStyle(nonePill, false);
          pill.classList.add('selected');
          setPillActiveStyle(pill, true);
        }
      });
      wordCustomCont.appendChild(pill);
    });
  }

  // 4. Populate manualPhraseCategory multi-pill container in manual add phrase modal
  const phrasePillsContainer = document.getElementById('manualPhraseCategoryPillsContainer');
  if (phrasePillsContainer) {
    // Collect currently selected categories from existing pills
    const currentSelected = Array.from(phrasePillsContainer.querySelectorAll('.mcat-pill.selected'))
      .map(p => p.dataset.cat);
    const preSelected = currentSelected.length > 0 ? currentSelected : ['Общее'];

    phrasePillsContainer.innerHTML = '';
    personalCategories.forEach(cat => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mcat-pill' + (preSelected.includes(cat) ? ' selected' : '');
      pill.dataset.cat = cat;
      pill.textContent = `📁 ${cat}`;
      pill.style.cssText = `
        padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
        cursor: pointer; border: 1px solid rgba(255,255,255,0.12); transition: all 0.18s;
        outline: none; white-space: nowrap;
        background: ${preSelected.includes(cat) ? 'rgba(29,185,84,0.2)' : 'rgba(255,255,255,0.04)'};
        color: ${preSelected.includes(cat) ? '#1db954' : 'var(--text-sub)'};
        border-color: ${preSelected.includes(cat) ? 'rgba(29,185,84,0.4)' : 'rgba(255,255,255,0.1)'};
      `;
      pill.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const isOn = pill.classList.contains('selected');
        // Require at least one selected
        const allSelected = phrasePillsContainer.querySelectorAll('.mcat-pill.selected');
        if (isOn && allSelected.length <= 1) return;
        pill.classList.toggle('selected', !isOn);
        pill.style.background = !isOn ? 'rgba(29,185,84,0.2)' : 'rgba(255,255,255,0.04)';
        pill.style.color = !isOn ? '#1db954' : 'var(--text-sub)';
        pill.style.borderColor = !isOn ? 'rgba(29,185,84,0.4)' : 'rgba(255,255,255,0.1)';
      });
      phrasePillsContainer.appendChild(pill);
    });
  }

  // 4b. Populate manualPhraseCustomCategory multi-pill container in manual add phrase modal
  const phraseCustomCont = document.getElementById('manualPhraseCustomCategoryPillsContainer');
  if (phraseCustomCont) {
    const currentSelected = Array.from(phraseCustomCont.querySelectorAll('.mcat-pill.selected'))
      .map(p => p.dataset.cat);
    const preSelected = currentSelected.length > 0 ? currentSelected : ['Без категории'];

    phraseCustomCont.innerHTML = '';
    
    const getPillStyle = (isSelected) => `
      padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
      cursor: pointer; border: 1px solid rgba(255,255,255,0.12); transition: all 0.18s;
      outline: none; white-space: nowrap;
      background: ${isSelected ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)'};
      color: ${isSelected ? '#a78bfa' : 'var(--text-sub)'};
      border-color: ${isSelected ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)'};
    `;
    const setPillActiveStyle = (pill, isSelected) => {
      pill.style.background = isSelected ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)';
      pill.style.color = isSelected ? '#a78bfa' : 'var(--text-sub)';
      pill.style.borderColor = isSelected ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)';
    };

    const nonePill = document.createElement('button');
    nonePill.type = 'button';
    nonePill.className = 'mcat-pill' + (preSelected.includes('Без категории') ? ' selected' : '');
    nonePill.dataset.cat = 'Без категории';
    nonePill.textContent = '🏷️ Без категории';
    nonePill.style.cssText = getPillStyle(preSelected.includes('Без категории'));
    nonePill.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const isOn = nonePill.classList.contains('selected');
      if (isOn) {
        const allSelected = phraseCustomCont.querySelectorAll('.mcat-pill.selected');
        if (allSelected.length <= 1) return;
        nonePill.classList.remove('selected');
        setPillActiveStyle(nonePill, false);
      } else {
        phraseCustomCont.querySelectorAll('.mcat-pill.selected').forEach(p => {
          if (p.dataset.cat !== 'Без категории') {
            p.classList.remove('selected');
            setPillActiveStyle(p, false);
          }
        });
        nonePill.classList.add('selected');
        setPillActiveStyle(nonePill, true);
      }
    });
    phraseCustomCont.appendChild(nonePill);

    personalCustomCategories.forEach(cat => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'mcat-pill' + (preSelected.includes(cat) ? ' selected' : '');
      pill.dataset.cat = cat;
      pill.textContent = `🏷️ ${cat}`;
      pill.style.cssText = getPillStyle(preSelected.includes(cat));
      pill.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const isOn = pill.classList.contains('selected');
        if (isOn) {
          const allSelected = phraseCustomCont.querySelectorAll('.mcat-pill.selected');
          if (allSelected.length <= 1) {
            pill.classList.remove('selected');
            setPillActiveStyle(pill, false);
            nonePill.classList.add('selected');
            setPillActiveStyle(nonePill, true);
          } else {
            pill.classList.remove('selected');
            setPillActiveStyle(pill, false);
          }
        } else {
          nonePill.classList.remove('selected');
          setPillActiveStyle(nonePill, false);
          pill.classList.add('selected');
          setPillActiveStyle(pill, true);
        }
      });
      phraseCustomCont.appendChild(pill);
    });
  }
}

function initDictionary() {
  loadCategories();
  try {
    const saved = localStorage.getItem('personal_dictionary');
    if (saved) {
      personalDictionary = JSON.parse(saved);
      let migrated = false;
      personalDictionary.forEach(w => {
        if (w.category === undefined) { w.category = 'Общее'; migrated = true; }
        if (w.customCategory === undefined) { w.customCategory = 'Без категории'; migrated = true; }
        if (w.definition === undefined) { w.definition = ''; migrated = true; }
        if (w.rule === undefined) { w.rule = ''; migrated = true; } // NEW: grammar rule field
        if (w.interval === undefined) { w.interval = 0; migrated = true; }
        if (w.nextReview === undefined) { w.nextReview = Date.now(); migrated = true; }
        if (w.addedAt === undefined) { w.addedAt = Date.now(); migrated = true; }
        if (w.level === undefined) { w.level = 0; migrated = true; }
        if (w.type === undefined) { w.type = 'word'; migrated = true; }
        if (w.type !== 'phrase') {
          const wordCount = w.word.trim().split(/\s+/).filter(Boolean).length;
          if (wordCount >= 3) {
            w.type = 'phrase';
            migrated = true;
          }
        }
        // NEW: migrate single category string → categories array
        if (!w.categories || !Array.isArray(w.categories) || w.categories.length === 0) {
          w.categories = [w.category || 'Общее'];
          migrated = true;
        }
        // NEW: migrate single customCategory string → customCategories array
        if (!w.customCategories || !Array.isArray(w.customCategories) || w.customCategories.length === 0) {
          w.customCategories = [w.customCategory || 'Без категории'];
          migrated = true;
        }
      });
      if (migrated) {
        saveDictionaryToStorage();
      }
    }
  } catch (e) {
    console.error("Failed to load personal dictionary:", e);
  }
  updateSavedWordsCount();
  setupDictionaryUI();
  populateCategorySelectors();
  setupDictTypeFilters(); // Initialize type filter buttons
  renderDictWeekChart();
  renderHeatmap();
  updateEssentialProgress();
}

function updateEssentialProgress() {
  const progressText = document.getElementById('essentialProgressText');
  const progressBar = document.getElementById('essentialProgressBar');
  if (!progressText || !progressBar) return;

  if (!window.top1000Words) return;

  // Count words in top1000Words that exist in personalDictionary with level > 3
  let masteredCount = 0;
  personalDictionary.forEach(w => {
    const isEssentialWord = window.top1000Words.includes(w.word.toLowerCase());
    if (isEssentialWord && w.level > 3) {
      masteredCount++;
    }
  });

  const total = window.top1000Words.length;
  const pct = ((masteredCount / total) * 100).toFixed(1);

  progressText.textContent = `${masteredCount} / ${total} (${pct}%)`;
  progressBar.style.width = `${pct}%`;
}

function updateSavedWordsCount() {
  const countEl = document.getElementById('savedWordsCount');
  if (countEl) {
    countEl.textContent = personalDictionary.length;
  }
}

function saveDictionaryToStorage() {
  localStorage.setItem('personal_dictionary', JSON.stringify(personalDictionary));
  updateSavedWordsCount();
  updateEssentialProgress();
  renderDictWeekChart();
  if (typeof currentSongKey !== 'undefined' && currentSongKey) {
    try {
      renderSong(currentSongKey);
    } catch (e) {
      console.warn('Failed to re-render song after dictionary update:', e);
    }
  }
}

function renderDictWeekChart() {
  const chartContainer = document.getElementById('dictWeekChart');
  if (!chartContainer) return;
  // Clear previous content
  chartContainer.innerHTML = '';
  // Header
  const header = document.createElement('div');
  header.className = 'dwc-header';
  const title = document.createElement('span');
  title.className = 'dwc-title';
  title.textContent = 'Добавлено за 7 дней';
  header.appendChild(title);
  chartContainer.appendChild(header);
  // Calculate counts for last 7 days
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const counts = Array(7).fill(0);
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = now - i * dayMs;
    const dayEnd = dayStart + dayMs;
    labels.push(new Date(dayStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    counts[6 - i] = personalDictionary.filter(w => w.addedAt && w.addedAt >= dayStart && w.addedAt < dayEnd).length;
  }
  // Bars wrapper
  const barWrapper = document.createElement('div');
  barWrapper.style.display = 'flex';
  barWrapper.style.alignItems = 'flex-end';
  barWrapper.style.height = '44px';
  barWrapper.style.gap = '4px';
  const maxCount = Math.max(...counts, 1);
  counts.forEach((cnt, idx) => {
    const bar = document.createElement('div');
    const heightPct = (cnt / maxCount) * 100;
    bar.style.width = '12px';
    bar.style.height = `${heightPct}%`;
    bar.style.background = 'linear-gradient(180deg, #1db954, #0a7d3e)';
    bar.title = `${labels[idx]}: ${cnt} слово${cnt !== 1 ? 'а' : ''}`;
    barWrapper.appendChild(bar);
  });
  chartContainer.appendChild(barWrapper);
  // Labels
  const labelWrapper = document.createElement('div');
  labelWrapper.style.display = 'flex';
  labelWrapper.style.justifyContent = 'space-between';
  labelWrapper.style.marginTop = '4px';
  labels.forEach(lbl => {
    const span = document.createElement('span');
    span.style.fontSize = '10px';
    span.style.color = '#666';
    span.textContent = lbl;
    labelWrapper.appendChild(span);
  });
  chartContainer.appendChild(labelWrapper);
}

window.addWordToPersonalDictionary = addWordToPersonalDictionary;
window.toggleDictionaryItem = toggleDictionaryItem;

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
        🗑 Удалить
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

window._wcpDelete = function(word) {
  if (!confirm(`Удалить «${word}» из словаря?`)) return;
  personalDictionary = personalDictionary.filter(w => w.word.toLowerCase() !== word.toLowerCase());
  saveDictionaryToStorage();
  if (typeof renderDictWordsList === 'function') renderDictWordsList();
  if (typeof currentSongKey !== 'undefined' && currentSongKey && typeof renderSong === 'function') {
    renderSong(currentSongKey);
  }
  dismissWordCard();
};

window._wcpReset = function(word) {
  if (!confirm(`Обнулить прогресс заучивания для «${word}»?`)) return;
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


function formatDictionaryWord(word) {
  const shouldCapitalize = localStorage.getItem('galaxy_dictionary_capitalize') !== 'false';
  if (!shouldCapitalize || !word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function toggleDictionaryItem(buttonElement, word, translation, category = 'Из песен', type = 'word') {
  const rawEng = word.trim();
  const eng = formatDictionaryWord(rawEng);
  const rus = translation.trim();
  if (!eng || !rus) return;

  const existingIndex = personalDictionary.findIndex(w => w.word.toLowerCase() === eng.toLowerCase());

  if (existingIndex !== -1) {
    // Remove it!
    personalDictionary.splice(existingIndex, 1);
    saveDictionaryToStorage();
    
    // Update button style to inactive
    buttonElement.innerHTML = `➕ В словарь`;
    buttonElement.style.color = 'var(--accent-spotify)';
    buttonElement.style.background = 'rgba(29, 185, 84, 0.1)';
    buttonElement.style.borderColor = 'rgba(29, 185, 84, 0.2)';
  } else {
    // Add it!
    let actualType = type;
    if (actualType === 'word') {
      const wordCount = eng.split(/\s+/).filter(Boolean).length;
      if (wordCount >= 3) {
        actualType = 'phrase';
      }
    }
    const newWord = {
      word: eng,
      translation: rus,
      category: category,
      customCategory: 'Без категории',
      type: actualType, // 'word' or 'phrase'
      level: 0,
      interval: 0,
      nextReview: Date.now()
    };
    personalDictionary.push(newWord);
    saveDictionaryToStorage();

    // Update button style to active
    buttonElement.innerHTML = `✓ В словаре`;
    buttonElement.style.color = '#1db954';
    buttonElement.style.background = 'rgba(29, 185, 84, 0.15)';
    buttonElement.style.borderColor = 'rgba(29, 185, 84, 0.3)';
  }

  // Update counts
  const dashWordsCount = document.getElementById('dashWordsCount');
  if (dashWordsCount) {
    dashWordsCount.textContent = personalDictionary.length;
  }
  if (typeof renderDictWordsList === 'function') {
    renderDictWordsList();
  }
}

function addWordToPersonalDictionary(word, translation, category = 'Из песен', type = 'word') {
  const rawEng = word.trim();
  const eng = formatDictionaryWord(rawEng);
  const rus = translation.trim();
  if (!eng || !rus) return;

  const isDup = personalDictionary.some(w => w.word.toLowerCase() === eng.toLowerCase());
  if (isDup) {
    alert(`"${eng}" уже есть в вашем словаре!`);
    return;
  }

  let actualType = type;
  if (actualType === 'word') {
    const wordCount = eng.split(/\s+/).filter(Boolean).length;
    if (wordCount >= 3) {
      actualType = 'phrase';
    }
  }

  const newWord = {
    word: eng,
    translation: rus,
    category: category,
    customCategory: 'Без категории',
    type: actualType,
    level: 0,
    interval: 0,
    nextReview: Date.now(),
    addedAt: Date.now()
  };

  personalDictionary.push(newWord);
  saveDictionaryToStorage();

  // If the dashboard count element exists, keep it in sync
  const dashWordsCount = document.getElementById('dashWordsCount');
  if (dashWordsCount) {
    dashWordsCount.textContent = personalDictionary.length;
  }

  // Refresh dictionary lists if they are currently drawn
  if (typeof renderDictWordsList === 'function') {
    renderDictWordsList();
  }

  // Highlight successfully added state
  alert(`"${eng}" успешно добавлено в ваш словарь! 🎓`);
}

// Initialize dictionary type filter buttons (Words/Phrases/All)
function setupDictTypeFilters() {
  const pillsContainer = document.getElementById('dictTypePills');
  if (!pillsContainer) return;

  const pills = pillsContainer.querySelectorAll('.dict-type-pill');
  
  pills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      const filterType = pill.getAttribute('data-type');
      
      // Update global filter state
      dictTypeFilter = filterType;
      
      // Update visual state of pills
      pills.forEach(p => {
        p.classList.remove('active');
        p.style.background = 'transparent';
        p.style.color = 'var(--text-sub)';
      });
      
      pill.classList.add('active');
      pill.style.background = 'rgba(29,185,84,0.18)';
      pill.style.color = '#1db954';
      
      // Re-render the word list with new filter
      renderDictWordsList();
    });
  });
}

// Initialize sort filter
function setupDictSortFilter() {
  const sortSelect = document.getElementById('dictSortSelect');
  if (!sortSelect) return;
  
  sortSelect.addEventListener('change', (e) => {
    dictSortOption = e.target.value;
    renderDictWordsList();
  });
}

// Apply sorting to word list
function applySortToDictWords(words) {
  const sorted = [...words];
  
  switch(dictSortOption) {
    case 'az':
      sorted.sort((a, b) => a.word.localeCompare(b.word, 'en'));
      break;
    case 'za':
      sorted.sort((a, b) => b.word.localeCompare(a.word, 'en'));
      break;
    case 'newest':
      sorted.reverse(); // Most recently added first
      break;
    case 'level_asc':
      sorted.sort((a, b) => (a.level || 0) - (b.level || 0));
      break;
    case 'level_desc':
      sorted.sort((a, b) => (b.level || 0) - (a.level || 0));
      break;
    default: // 'default'
      // Keep original order
      break;
  }
  
  return sorted;
}

function setupDictionaryUI() {
  let manualAddType = 'word';
  const openBtn = document.getElementById('openDictionaryBtn');
  const closeBtn = document.getElementById('closeDictionaryBtn');
  const modal = document.getElementById('dictionaryModal');
  const clearBtn = document.getElementById('clearDictBtn');
  const searchInput = document.getElementById('dictSearchInput');
  const flashcard = document.getElementById('dictFlashcard');
  const flashcardInner = document.getElementById('flashcardInner');
  const emptyState = document.getElementById('dictEmptyState');
  const controls = document.getElementById('cardControls');
  const categoryFilter = document.getElementById('dictCategoryFilter');
  
  // Training Modal Elements
  const trainingModal = document.getElementById('trainingModal');
  const openTrainingBtn = document.getElementById('openTrainingBtn');
  const closeTrainingModalBtn = document.getElementById('closeTrainingModalBtn');
  const startTrainingFromDictBtn = document.getElementById('startTrainingFromDictBtn');
  const trainingCategoryLabel = document.getElementById('trainingCategoryLabel');
  const trainingLimitSelect = document.getElementById('trainingLimitSelect');
  
  if (!modal || !openBtn) return;

  // ── Dictionary Resize Buttons ──────────────────────────────────────────────
  const dictCard = document.getElementById('dictionaryModalCard');
  const dictWidthBtn = document.getElementById('dictExpandWidthBtn');
  const dictHeightBtn = document.getElementById('dictExpandHeightBtn');
  const DICT_SIZE_KEY = 'dict_size_prefs';

  let dictSizeState = { wide: false, tall: false };
  try {
    const saved = localStorage.getItem(DICT_SIZE_KEY);
    if (saved) dictSizeState = { ...dictSizeState, ...JSON.parse(saved) };
  } catch(e) {}

  function applyDictSize() {
    if (!dictCard) return;
    dictCard.classList.toggle('dict-wide', dictSizeState.wide);
    dictCard.classList.toggle('dict-tall', dictSizeState.tall);

    if (dictWidthBtn) {
      dictWidthBtn.classList.toggle('dict-expand-btn-active', dictSizeState.wide);
      dictWidthBtn.title = dictSizeState.wide ? 'Сжать по ширине' : 'Расширить по ширине';
    }
    if (dictHeightBtn) {
      dictHeightBtn.classList.toggle('dict-expand-btn-active', dictSizeState.tall);
      dictHeightBtn.title = dictSizeState.tall ? 'Сжать по высоте' : 'Расширить по высоте';
    }

    localStorage.setItem(DICT_SIZE_KEY, JSON.stringify(dictSizeState));
  }

  if (dictWidthBtn) {
    dictWidthBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dictSizeState.wide = !dictSizeState.wide;
      applyDictSize();
    });
  }
  if (dictHeightBtn) {
    dictHeightBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dictSizeState.tall = !dictSizeState.tall;
      applyDictSize();
    });
  }

  // Apply saved size immediately when modal opens
  openBtn.addEventListener('click', applyDictSize, { once: false });
  applyDictSize();
  // ──────────────────────────────────────────────────────────────────────────

  // ── Training Resize Buttons ────────────────────────────────────────────────
  const trainingCard = document.getElementById('trainingModalCard');
  const trainingWidthBtn = document.getElementById('trainingExpandWidthBtn');
  const TRAINING_SIZE_KEY = 'training_size_prefs';

  let trainingSizeState = { wide: false };
  try {
    const saved = localStorage.getItem(TRAINING_SIZE_KEY);
    if (saved) trainingSizeState = { ...trainingSizeState, ...JSON.parse(saved) };
  } catch(e) {}

  // Force tall mode state off for training card
  trainingSizeState.tall = false;

  function applyTrainingSize() {
    if (!trainingCard) return;
    trainingCard.classList.toggle('dict-wide', trainingSizeState.wide);
    trainingCard.classList.remove('dict-tall'); // Never tall

    if (trainingWidthBtn) {
      trainingWidthBtn.classList.toggle('dict-expand-btn-active', trainingSizeState.wide);
      trainingWidthBtn.title = trainingSizeState.wide ? 'Сжать по ширине' : 'Расширить по ширине';
    }

    localStorage.setItem(TRAINING_SIZE_KEY, JSON.stringify(trainingSizeState));
  }

  if (trainingWidthBtn) {
    trainingWidthBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      trainingSizeState.wide = !trainingSizeState.wide;
      applyTrainingSize();
    });
  }

  // Apply saved size immediately when training modal is loaded/opened
  const openTrainingBtnEl = document.getElementById('openTrainingBtn');
  if (openTrainingBtnEl) {
    openTrainingBtnEl.addEventListener('click', applyTrainingSize, { once: false });
  }
  applyTrainingSize();
  // ──────────────────────────────────────────────────────────────────────────

  // 1. Tab Switching Event Listeners
  const tabPersonal = document.getElementById('dictTabPersonal');
  const tabEssential = document.getElementById('dictTabEssential');
  const addCategoryBtn = document.getElementById('addCustomCategoryBtn');
  const addWordBtn = document.getElementById('addManualWordBtn');
  const progressBarContainer = document.querySelector('.essential-progress-container');
  
  if (tabPersonal && tabEssential) {
    const switchTab = (tab) => {
      activeDictTab = tab;
      
      // Update UI classes
      if (tab === 'personal') {
        tabPersonal.classList.add('active');
        tabPersonal.style.color = 'var(--accent-spotify)';
        tabPersonal.style.borderBottomColor = 'var(--accent-spotify)';
        tabPersonal.style.fontWeight = '700';
        
        tabEssential.classList.remove('active');
        tabEssential.style.color = 'var(--text-muted)';
        tabEssential.style.borderBottomColor = 'transparent';
        tabEssential.style.fontWeight = '600';
        
        // Show/Hide controls
        if (addCategoryBtn) addCategoryBtn.style.display = 'flex';
        if (addWordBtn) addWordBtn.style.display = 'flex';
        if (progressBarContainer) progressBarContainer.style.display = 'none'; // Only show in frequency tab
      } else {
        tabEssential.classList.add('active');
        tabEssential.style.color = 'var(--accent-spotify)';
        tabEssential.style.borderBottomColor = 'var(--accent-spotify)';
        tabEssential.style.fontWeight = '700';
        
        tabPersonal.classList.remove('active');
        tabPersonal.style.color = 'var(--text-muted)';
        tabPersonal.style.borderBottomColor = 'transparent';
        tabPersonal.style.fontWeight = '600';
        
        // Show/Hide controls
        if (addCategoryBtn) addCategoryBtn.style.display = 'none';
        if (addWordBtn) addWordBtn.style.display = 'none';
        if (progressBarContainer) progressBarContainer.style.display = 'flex';
      }
      
      // Refresh options and list
      populateCategorySelectors();
      renderDictWordsList();
      resetFlashcard();
    };
    
    tabPersonal.addEventListener('click', () => switchTab('personal'));
    tabEssential.addEventListener('click', () => switchTab('essential'));
  }

  // 2. Manual Word Adding Dialog listeners
  const addWordModal = document.getElementById('addWordModal');
  const closeAddWordBtn = document.getElementById('closeAddWordBtn');
  const saveManualWordBtn = document.getElementById('saveManualWordBtn');
  
  if (addWordBtn && addWordModal) {
    addWordBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      manualAddType = 'word';
      
      const titleEl = document.getElementById('manualWordTitle');
      const labelEngEl = document.getElementById('manualWordEngLabel');
      const labelRusEl = document.getElementById('manualWordRusLabel');
      const inputEngEl = document.getElementById('manualWordEng');
      const inputRusEl = document.getElementById('manualWordRus');
      const saveBtnEl = document.getElementById('saveManualWordBtn');
      
      if (titleEl) titleEl.textContent = '➕ Добавить слово вручную';
      if (labelEngEl) labelEngEl.textContent = 'Слово на английском:';
      if (labelRusEl) labelRusEl.textContent = 'Перевод на русский:';
      if (inputEngEl) {
        inputEngEl.value = '';
        inputEngEl.placeholder = 'например, apple';
      }
      if (inputRusEl) {
        inputRusEl.value = '';
        inputRusEl.placeholder = 'например, яблоко';
      }
      if (saveBtnEl) saveBtnEl.textContent = 'Сохранить слово';
      
      // Populate category list inside popup
      populateCategorySelectors();
      
      // Show modal
      openModalEl(addWordModal);

      // Sync settings checkboxes to current state
      updateSmartInputUI();
    });
  }

  // 2b. Manual Phrase Adding Dialog listeners
  const addManualPhraseBtn = document.getElementById('addManualPhraseBtn');
  const addPhraseModal = document.getElementById('addPhraseModal');
  const closeAddPhraseBtn = document.getElementById('closeAddPhraseBtn');
  const saveManualPhraseBtn = document.getElementById('saveManualPhraseBtn');
  
  if (addManualPhraseBtn && addPhraseModal) {
    addManualPhraseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      manualAddType = 'phrase';
      
      const engInput = document.getElementById('manualPhraseEng');
      const rusInput = document.getElementById('manualPhraseRus');
      const defInput = document.getElementById('manualPhraseDefinition');
      const ruleInput = document.getElementById('manualPhraseRule');
      
      if (engInput) engInput.value = '';
      if (rusInput) rusInput.value = '';
      if (defInput) defInput.value = '';
      if (ruleInput) ruleInput.value = '';
      
      populateCategorySelectors();
      
      openModalEl(addPhraseModal);
      if (engInput) setTimeout(() => engInput.focus(), 120);
    });
  }
  
  if (closeAddPhraseBtn && addPhraseModal) {
    closeAddPhraseBtn.addEventListener('click', () => {
      closeModalEl(addPhraseModal);
    });
  }
  
  const phraseEngInput = document.getElementById('manualPhraseEng');
  const phraseRusInput = document.getElementById('manualPhraseRus');

  if (phraseEngInput) {
    phraseEngInput.addEventListener('input', () => handleSmartInput(phraseEngInput, 'cyrToLat'));
  }
  if (phraseRusInput) {
    phraseRusInput.addEventListener('input', () => handleSmartInput(phraseRusInput, 'latToCyr'));
  }

  // Show input border error (red flash)
  const flashError = (el) => {
    if (!el) return;
    const orig = el.style.borderColor;
    el.style.borderColor = '#f87171';
    el.focus();
    setTimeout(() => { el.style.borderColor = orig; }, 1800);
  };

  if (saveManualPhraseBtn && addPhraseModal) {
    saveManualPhraseBtn.addEventListener('click', () => {
      const engEl = document.getElementById('manualPhraseEng');
      const rusEl = document.getElementById('manualPhraseRus');
      const definitionEl = document.getElementById('manualPhraseDefinition');
      const ruleEl = document.getElementById('manualPhraseRule');
      
      if (!engEl || !rusEl) return;
      
      const eng = engEl.value.trim();
      const rus = rusEl.value.trim();
      
      // Read selected categories from multi-pill container
      const pillsCont = document.getElementById('manualPhraseCategoryPillsContainer');
      const selectedCats = pillsCont
        ? Array.from(pillsCont.querySelectorAll('.mcat-pill.selected')).map(p => p.dataset.cat)
        : ['Общее'];
      const cats = selectedCats.length > 0 ? selectedCats : ['Общее'];
      const cat = cats[0]; 
      
      // Read selected custom categories from multi-pill container
      const customCont = document.getElementById('manualPhraseCustomCategoryPillsContainer');
      const selectedCustomCats = customCont
        ? Array.from(customCont.querySelectorAll('.mcat-pill.selected')).map(p => p.dataset.cat)
        : ['Без категории'];
      const customCats = selectedCustomCats.length > 0 ? selectedCustomCats : ['Без категории'];
      const customCat = customCats[0];
      
      const definition = definitionEl ? definitionEl.value.trim() : '';
      const rule = ruleEl ? ruleEl.value.trim() : '';
      
      // Validate: not empty and minimum 3 words
      if (eng === "") {
        flashError(engEl);
        const origPlaceholder = engEl.placeholder;
        engEl.placeholder = '⚠ Введите фразу!';
        setTimeout(() => { engEl.placeholder = origPlaceholder; }, 2200);
        return;
      }
      
      const wordsCount = eng.split(/\s+/).filter(Boolean).length;
      if (wordsCount < 3) {
        flashError(engEl);
        const origPlaceholder = engEl.placeholder;
        engEl.value = '';
        engEl.placeholder = '⚠ Введите фразу от 3 слов!';
        setTimeout(() => { engEl.placeholder = origPlaceholder; }, 2200);
        return;
      }
      
      if (rus === "") {
        flashError(rusEl);
        const origPlaceholder = rusEl.placeholder;
        rusEl.placeholder = '⚠ Укажите перевод!';
        setTimeout(() => { rusEl.placeholder = origPlaceholder; }, 2200);
        return;
      }
      
      // Check duplicate
      const dupIndex = personalDictionary.findIndex(w => w.word.toLowerCase() === eng.toLowerCase());
      if (dupIndex !== -1) {
        const existingConflict = document.getElementById('dupPhraseConflictBanner');
        if (existingConflict) existingConflict.remove();

        const conflictBanner = document.createElement('div');
        conflictBanner.id = 'dupPhraseConflictBanner';
        conflictBanner.style.cssText = `
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.35);
          border-radius: 12px;
          padding: 12px 14px;
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: fadeIn 0.2s ease;
          box-sizing: border-box;
          width: 100%;
        `;

        const old = personalDictionary[dupIndex];
        conflictBanner.innerHTML = `
          <div style="font-size: 0.78rem; color: #f59e0b; font-weight: 700; display: flex; align-items: center; gap: 6px;">
            ⚠️ «${escapeHTML(eng)}» уже есть в словаре
          </div>
          <div style="font-size: 0.73rem; color: var(--text-sub); line-height: 1.4;">
            Текущий перевод: <strong style="color: var(--text-main);">${escapeHTML(old.translation)}</strong>
            ${old.definition ? `<br>Значение: <em>${escapeHTML(old.definition)}</em>` : ''}
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button id="dupPhraseReplaceBtn" style="
              background: linear-gradient(135deg, #f59e0b, #d97706);
              color: #000;
              border: none;
              border-radius: 10px;
              padding: 7px 14px;
              font-size: 0.78rem;
              font-weight: 700;
              cursor: pointer;
              flex: 1;
              transition: opacity 0.2s;
              outline: none;
            ">🔄 Заменить старое</button>
            <button id="dupPhraseKeepBothBtn" style="
              background: rgba(255,255,255,0.07);
              color: var(--text-main);
              border: 1px solid rgba(255,255,255,0.15);
              border-radius: 10px;
              padding: 7px 14px;
              font-size: 0.78rem;
              font-weight: 600;
              cursor: pointer;
              flex: 1;
              transition: opacity 0.2s;
              outline: none;
            ">➕ Добавить ещё раз</button>
            <button id="dupPhraseCancelBtn" style="
              background: transparent;
              color: var(--text-sub);
              border: none;
              border-radius: 10px;
              padding: 7px 10px;
              font-size: 0.78rem;
              cursor: pointer;
              transition: opacity 0.2s;
              outline: none;
            ">✕</button>
          </div>
        `;

        saveManualPhraseBtn.parentNode.insertBefore(conflictBanner, saveManualPhraseBtn);

        const buildNewPhrase = () => ({
          word: eng,
          translation: rus,
          categories: cats,
          category: cat,
          customCategory: customCat,
          customCategories: customCats,
          definition: definition,
          rule: rule,
          type: 'phrase',
          level: 0,
          interval: 0,
          nextReview: Date.now()
        });

        const finishPhraseSave = () => {
          conflictBanner.remove();
          engEl.value = '';
          rusEl.value = '';
          if (definitionEl) definitionEl.value = '';
          if (ruleEl) ruleEl.value = '';
          
          if (customCont) {
            customCont.querySelectorAll('.mcat-pill').forEach(p => {
              const isNone = p.dataset.cat === 'Без категории';
              p.classList.toggle('selected', isNone);
              p.style.background = isNone ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)';
              p.style.color = isNone ? '#a78bfa' : 'var(--text-sub)';
              p.style.borderColor = isNone ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)';
            });
          }
          
          dictTypeFilter = 'all';
          const catF = document.getElementById('dictCategoryFilter');
          const cusF = document.getElementById('dictCustomCategoryFilter');
          if (catF) catF.value = 'Все слова';
          if (cusF) cusF.value = 'Все категории';
          
          const pillsC = document.getElementById('dictTypePills');
          if (pillsC) {
            pillsC.querySelectorAll('.dict-type-pill').forEach(p => {
              p.classList.remove('active');
              p.style.background = 'transparent';
              p.style.color = 'var(--text-sub)';
            });
            const allP = pillsC.querySelector('[data-type="all"]');
            if (allP) { allP.classList.add('active'); allP.style.background = 'rgba(29,185,84,0.18)'; allP.style.color = '#1db954'; }
          }
          renderDictWordsList();
          resetFlashcard();
          recordActivity();
          updateSavedWordsCount();
          
          const sb = document.getElementById('saveManualPhraseBtn');
          if (sb) {
            const ot = sb.textContent;
            sb.textContent = `✓ «${eng.slice(0, 18)}${eng.length > 18 ? '…' : ''}» сохранено!`;
            sb.style.background = 'linear-gradient(135deg, #1db954, #16a34a)';
            sb.disabled = true;
            setTimeout(() => { sb.textContent = ot; sb.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)'; sb.disabled = false; engEl.focus(); }, 1400);
          }
        };

        document.getElementById('dupPhraseReplaceBtn').addEventListener('click', (e) => {
          e.stopPropagation();
          personalDictionary[dupIndex] = Object.assign({}, old, buildNewPhrase(), { level: old.level, interval: old.interval, nextReview: old.nextReview });
          saveDictionaryToStorage();
          finishPhraseSave();
        });

        document.getElementById('dupPhraseKeepBothBtn').addEventListener('click', (e) => {
          e.stopPropagation();
          personalDictionary.push(buildNewPhrase());
          saveDictionaryToStorage();
          finishPhraseSave();
        });

        document.getElementById('dupPhraseCancelBtn').addEventListener('click', (e) => {
          e.stopPropagation();
          conflictBanner.remove();
        });

        return;
      }
      
      // Save new phrase
      const newPhrase = {
        word: eng,
        translation: rus,
        categories: cats,
        category: cat,
        customCategory: customCat,
        customCategories: customCats,
        definition: definition,
        rule: rule,
        type: 'phrase',
        level: 0,
        interval: 0,
        nextReview: Date.now()
      };
      
      personalDictionary.push(newPhrase);
      saveDictionaryToStorage();
      
      engEl.value = '';
      rusEl.value = '';
      if (definitionEl) definitionEl.value = '';
      if (ruleEl) ruleEl.value = '';
      
      if (pillsCont) {
        pillsCont.querySelectorAll('.mcat-pill').forEach(p => {
          const isObe = p.dataset.cat === 'Общее';
          p.classList.toggle('selected', isObe);
          p.style.background = isObe ? 'rgba(29,185,84,0.2)' : 'rgba(255,255,255,0.04)';
          p.style.color = isObe ? '#1db954' : 'var(--text-sub)';
          p.style.borderColor = isObe ? 'rgba(29,185,84,0.4)' : 'rgba(255,255,255,0.1)';
        });
      }
      if (customCont) {
        customCont.querySelectorAll('.mcat-pill').forEach(p => {
          const isNone = p.dataset.cat === 'Без категории';
          p.classList.toggle('selected', isNone);
          p.style.background = isNone ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)';
          p.style.color = isNone ? '#a78bfa' : 'var(--text-sub)';
          p.style.borderColor = isNone ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)';
        });
      }
      
      dictTypeFilter = 'all';
      const catF = document.getElementById('dictCategoryFilter');
      const cusF = document.getElementById('dictCustomCategoryFilter');
      if (catF) catF.value = 'Все слова';
      if (cusF) cusF.value = 'Все категории';
      
      const pillsC = document.getElementById('dictTypePills');
      if (pillsC) {
        pillsC.querySelectorAll('.dict-type-pill').forEach(p => {
          p.classList.remove('active');
          p.style.background = 'transparent';
          p.style.color = 'var(--text-sub)';
        });
        const allP = pillsC.querySelector('[data-type="all"]');
        if (allP) { allP.classList.add('active'); allP.style.background = 'rgba(29,185,84,0.18)'; allP.style.color = '#1db954'; }
      }
      
      renderDictWordsList();
      resetFlashcard();
      recordActivity();
      updateSavedWordsCount();
      
      const origText = saveManualPhraseBtn.textContent;
      saveManualPhraseBtn.textContent = `✓ «${eng.slice(0, 18)}${eng.length > 18 ? '…' : ''}» сохранено!`;
      saveManualPhraseBtn.style.background = 'linear-gradient(135deg, #1db954, #16a34a)';
      saveManualPhraseBtn.disabled = true;
      setTimeout(() => {
        saveManualPhraseBtn.textContent = origText;
        saveManualPhraseBtn.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
        saveManualPhraseBtn.disabled = false;
        engEl.focus();
      }, 1400);
    });
  }

  // Allow pressing Enter in translation field of phrase modal to save
  const phraseRusEl = document.getElementById('manualPhraseRus');
  if (phraseRusEl && saveManualPhraseBtn) {
    phraseRusEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); saveManualPhraseBtn.click(); }
    });
  }

  if (closeAddWordBtn && addWordModal) {
    closeAddWordBtn.addEventListener('click', () => {
      closeModalEl(addWordModal);
    });
  }
  
  // Backdrop click intentionally disabled — use the close button (✕) to dismiss
  
  // Backdrop click intentionally disabled — use the close button (✕) to dismiss
  // if (addWordModal) { addWordModal.addEventListener('click', ...) }

  // 2b. Smart Input Settings — load from localStorage
  const SMART_INPUT_SETTINGS_KEY = 'addWord_smartInput_settings';
  let smartInputSettings = { autoCapitalize: true, autoLayout: true };
  try {
    const saved = localStorage.getItem(SMART_INPUT_SETTINGS_KEY);
    if (saved) smartInputSettings = { ...smartInputSettings, ...JSON.parse(saved) };
  } catch(e) {}

  function saveSmartInputSettings() {
    localStorage.setItem(SMART_INPUT_SETTINGS_KEY, JSON.stringify(smartInputSettings));
  }

  function updateSmartInputUI() {
    const capCb = document.getElementById('settingAutoCapitalize');
    const layoutCb = document.getElementById('settingAutoLayout');
    const engHint = document.getElementById('addWordEngHint');
    const rusHint = document.getElementById('addWordRusHint');

    if (capCb) capCb.checked = smartInputSettings.autoCapitalize;
    if (layoutCb) layoutCb.checked = smartInputSettings.autoLayout;

    const layoutHintStyle = smartInputSettings.autoLayout ? '' : 'display:none';
    if (engHint) engHint.style.display = smartInputSettings.autoLayout ? '' : 'none';
    if (rusHint) rusHint.style.display = smartInputSettings.autoLayout ? '' : 'none';
  }

  // Settings accordion toggle
  const settingsToggleBtn = document.getElementById('addWordSettingsToggle');
  const settingsPanel = document.getElementById('addWordSettingsPanel');
  const settingsChevron = document.getElementById('addWordSettingsChevron');
  if (settingsToggleBtn && settingsPanel) {
    settingsToggleBtn.addEventListener('click', () => {
      const isOpen = settingsPanel.style.display === 'flex';
      settingsPanel.style.display = isOpen ? 'none' : 'flex';
      if (settingsChevron) settingsChevron.style.transform = isOpen ? '' : 'rotate(180deg)';
    });
  }

  // Settings checkboxes
  const capCb = document.getElementById('settingAutoCapitalize');
  const layoutCb = document.getElementById('settingAutoLayout');
  if (capCb) {
    capCb.addEventListener('change', () => {
      smartInputSettings.autoCapitalize = capCb.checked;
      saveSmartInputSettings();
      updateSmartInputUI();
    });
  }
  if (layoutCb) {
    layoutCb.addEventListener('change', () => {
      smartInputSettings.autoLayout = layoutCb.checked;
      saveSmartInputSettings();
      updateSmartInputUI();
    });
  }

  // Apply settings UI on open
  updateSmartInputUI();

  // Smart input handler: layout fix first, then auto-capitalize
  function handleSmartInput(inputEl, layoutDirection) {
    // 1. Auto layout correction first (converts wrong-layout chars)
    if (smartInputSettings.autoLayout) {
      applyLayoutFix(inputEl, layoutDirection);
    }
    // 2. Auto-capitalize first character (on already-corrected text)
    if (smartInputSettings.autoCapitalize && inputEl.value.length > 0) {
      const first = inputEl.value[0];
      const capitalized = first.toUpperCase();
      if (first !== capitalized) {
        const cursor = inputEl.selectionStart;
        const cursorEnd = inputEl.selectionEnd;
        inputEl.value = capitalized + inputEl.value.slice(1);
        try { inputEl.setSelectionRange(cursor, cursorEnd); } catch(e) {}
      }
    }
  }

  const wordEngInput = document.getElementById('manualWordEng');
  const wordRusInput = document.getElementById('manualWordRus');

  if (wordEngInput) {
    wordEngInput.addEventListener('input', () => handleSmartInput(wordEngInput, 'cyrToLat'));
  }
  if (wordRusInput) {
    wordRusInput.addEventListener('input', () => handleSmartInput(wordRusInput, 'latToCyr'));
  }

  if (saveManualWordBtn && addWordModal) {
    saveManualWordBtn.addEventListener('click', () => {
      const wordEngEl = document.getElementById('manualWordEng');
      const wordRusEl = document.getElementById('manualWordRus');
      const definitionEl = document.getElementById('manualWordDefinition');
      const ruleEl = document.getElementById('manualWordRule');
      
      if (!wordEngEl || !wordRusEl) return;
      
      const rawEng = wordEngEl.value.trim();
      const eng = formatDictionaryWord(rawEng);
      const rus = wordRusEl.value.trim();
      // Read selected categories from multi-pill container
      const pillsCont = document.getElementById('manualCategoryPillsContainer');
      const selectedCats = pillsCont
        ? Array.from(pillsCont.querySelectorAll('.mcat-pill.selected')).map(p => p.dataset.cat)
        : ['Общее'];
      const cats = selectedCats.length > 0 ? selectedCats : ['Общее'];
      const cat = cats[0]; // primary category for backward compat
      
      // Read selected custom categories from multi-pill container
      const customCont = document.getElementById('manualWordCustomCategoryPillsContainer');
      const selectedCustomCats = customCont
        ? Array.from(customCont.querySelectorAll('.mcat-pill.selected')).map(p => p.dataset.cat)
        : ['Без категории'];
      const customCats = selectedCustomCats.length > 0 ? selectedCustomCats : ['Без категории'];
      const customCat = customCats[0];
      
      const definition = definitionEl ? definitionEl.value.trim() : '';
      const rule = ruleEl ? ruleEl.value.trim() : '';
      
      if (eng === "" || rus === "") {
        alert(manualAddType === 'phrase' ? "Пожалуйста, заполните оба поля: английская фраза и перевод!" : "Пожалуйста, заполните оба поля: английское слово и перевод!");
        return;
      }
      
      // Check for duplicates in personalDictionary
      const dupIndex = personalDictionary.findIndex(w => w.word.toLowerCase() === eng.toLowerCase());
      if (dupIndex !== -1) {
        // Show inline duplicate conflict UI instead of a browser alert
        const existingModal = document.getElementById('addWordModal');
        const existingConflict = document.getElementById('dupConflictBanner');
        if (existingConflict) existingConflict.remove(); // remove previous banner if any

        const conflictBanner = document.createElement('div');
        conflictBanner.id = 'dupConflictBanner';
        conflictBanner.style.cssText = `
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.35);
          border-radius: 12px;
          padding: 12px 14px;
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: fadeIn 0.2s ease;
          box-sizing: border-box;
          width: 100%;
        `;

        const old = personalDictionary[dupIndex];
        conflictBanner.innerHTML = `
          <div style="font-size: 0.78rem; color: #f59e0b; font-weight: 700; display: flex; align-items: center; gap: 6px;">
            ⚠️ «${escapeHTML(eng)}» уже есть в словаре
          </div>
          <div style="font-size: 0.73rem; color: var(--text-sub); line-height: 1.4;">
            Текущий перевод: <strong style="color: var(--text-main);">${escapeHTML(old.translation)}</strong>
            ${old.definition ? `<br>Значение: <em>${escapeHTML(old.definition)}</em>` : ''}
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button id="dupReplaceBtn" style="
              background: linear-gradient(135deg, #f59e0b, #d97706);
              color: #000;
              border: none;
              border-radius: 10px;
              padding: 7px 14px;
              font-size: 0.78rem;
              font-weight: 700;
              cursor: pointer;
              flex: 1;
              transition: opacity 0.2s;
              outline: none;
            ">🔄 Заменить старое</button>
            <button id="dupKeepBothBtn" style="
              background: rgba(255,255,255,0.07);
              color: var(--text-main);
              border: 1px solid rgba(255,255,255,0.15);
              border-radius: 10px;
              padding: 7px 14px;
              font-size: 0.78rem;
              font-weight: 600;
              cursor: pointer;
              flex: 1;
              transition: opacity 0.2s;
              outline: none;
            ">➕ Добавить ещё раз</button>
            <button id="dupCancelBtn" style="
              background: transparent;
              color: var(--text-sub);
              border: none;
              border-radius: 10px;
              padding: 7px 10px;
              font-size: 0.78rem;
              cursor: pointer;
              transition: opacity 0.2s;
              outline: none;
            ">✕</button>
          </div>
        `;

        // Insert banner before save button
        const saveBtn = document.getElementById('saveManualWordBtn');
        if (saveBtn && saveBtn.parentNode) {
          saveBtn.parentNode.insertBefore(conflictBanner, saveBtn);
        }

        // Helper to build the new word object from current field values
        const buildNewWord = () => {
          let actualType = manualAddType;
          if (actualType === 'word') {
            const wordCount = eng.split(/\s+/).filter(Boolean).length;
            if (wordCount >= 3) {
              actualType = 'phrase';
            }
          }
          return {
            word: eng,
            translation: rus,
            categories: cats,
            category: cat,
            customCategory: customCat,
            customCategories: customCats,
            definition: definition,
            rule: rule,
            type: actualType,
            level: 0,
            interval: 0,
            nextReview: Date.now()
          };
        };

        // Helper: reset fields and close banner
        const finishSave = () => {
          conflictBanner.remove();
          wordEngEl.value = '';
          wordRusEl.value = '';
          if (definitionEl) definitionEl.value = '';
          if (ruleEl) ruleEl.value = '';
          
          if (customCont) {
            customCont.querySelectorAll('.mcat-pill').forEach(p => {
              const isNone = p.dataset.cat === 'Без категории';
              p.classList.toggle('selected', isNone);
              p.style.background = isNone ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)';
              p.style.color = isNone ? '#a78bfa' : 'var(--text-sub)';
              p.style.borderColor = isNone ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)';
            });
          }
          
          // Reset filters so new entry is always visible
          dictTypeFilter = 'all';
          const catF = document.getElementById('dictCategoryFilter');
          const cusF = document.getElementById('dictCustomCategoryFilter');
          if (catF) catF.value = 'Все слова';
          if (cusF) cusF.value = 'Все категории';
          const pillsC = document.getElementById('dictTypePills');
          if (pillsC) {
            pillsC.querySelectorAll('.dict-type-pill').forEach(p => {
              p.classList.remove('active');
              p.style.background = 'transparent';
              p.style.color = 'var(--text-sub)';
            });
            const allP = pillsC.querySelector('[data-type="all"]');
            if (allP) { allP.classList.add('active'); allP.style.background = 'rgba(29,185,84,0.18)'; allP.style.color = '#1db954'; }
          }
          renderDictWordsList();
          resetFlashcard();
          recordActivity();
          // Brief success toast on save button
          const sb = document.getElementById('saveManualWordBtn');
          if (sb) {
            const ot = sb.textContent; const ob = sb.style.background;
            sb.textContent = `✓ «${eng}» сохранено!`;
            sb.style.background = 'linear-gradient(135deg, #1db954, #16a34a)';
            sb.disabled = true;
            setTimeout(() => { sb.textContent = ot; sb.style.background = ob; sb.disabled = false; wordEngEl.focus(); }, 1400);
          }
        };

        document.getElementById('dupReplaceBtn').addEventListener('click', (e) => {
          e.stopPropagation();
          // Replace old entry in-place, preserving its spaced repetition progress
          personalDictionary[dupIndex] = Object.assign({}, old, buildNewWord(), { level: old.level, interval: old.interval, nextReview: old.nextReview });
          saveDictionaryToStorage();
          finishSave();
        });

        document.getElementById('dupKeepBothBtn').addEventListener('click', (e) => {
          e.stopPropagation();
          // Add as a separate entry (allows duplicates by user's choice)
          personalDictionary.push(buildNewWord());
          saveDictionaryToStorage();
          finishSave();
        });

        document.getElementById('dupCancelBtn').addEventListener('click', (e) => {
          e.stopPropagation();
          conflictBanner.remove();
        });

        return; // Stop normal save flow until user picks an option
      }
      
      // Add custom word/phrase with memory parameters
      let actualType = manualAddType;
      if (actualType === 'word') {
        const wordCount = eng.split(/\s+/).filter(Boolean).length;
        if (wordCount >= 3) {
          actualType = 'phrase';
        }
      }
      const newWord = {
        word: eng,
        translation: rus,
        categories: cats,
        category: cat,
        customCategory: customCat,
        customCategories: customCats,
        definition: definition,
        rule: rule,
        type: actualType,
        level: 0,
        interval: 0,
        nextReview: Date.now(),
        addedAt: Date.now()
      };
      
      personalDictionary.push(newWord);
      saveDictionaryToStorage();
      
      // Keep modal open — clear fields for next entry
      wordEngEl.value = '';
      wordRusEl.value = '';
      if (definitionEl) definitionEl.value = '';
      if (ruleEl) ruleEl.value = '';
      // Reset category pills to default 'Общее'
      if (pillsCont) {
        pillsCont.querySelectorAll('.mcat-pill').forEach(p => {
          const isObe = p.dataset.cat === 'Общее';
          p.classList.toggle('selected', isObe);
          p.style.background = isObe ? 'rgba(29,185,84,0.2)' : 'rgba(255,255,255,0.04)';
          p.style.color = isObe ? '#1db954' : 'var(--text-sub)';
          p.style.borderColor = isObe ? 'rgba(29,185,84,0.4)' : 'rgba(255,255,255,0.1)';
        });
      }
      if (customCont) {
        customCont.querySelectorAll('.mcat-pill').forEach(p => {
          const isNone = p.dataset.cat === 'Без категории';
          p.classList.toggle('selected', isNone);
          p.style.background = isNone ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)';
          p.style.color = isNone ? '#a78bfa' : 'var(--text-sub)';
          p.style.borderColor = isNone ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)';
        });
      }

      // Reset filters to 'Все слова' so the newly added word is always visible
      const customFilterSelect = document.getElementById('dictCustomCategoryFilter');
      if (categoryFilter) {
        categoryFilter.value = 'Все слова';
      }
      if (customFilterSelect) {
        customFilterSelect.value = 'Все категории';
      }
      // Also reset type filter pills to 'all' so new entry is visible
      dictTypeFilter = 'all';
      const pillsContainerSave = document.getElementById('dictTypePills');
      if (pillsContainerSave) {
        pillsContainerSave.querySelectorAll('.dict-type-pill').forEach(p => {
          p.classList.remove('active');
          p.style.background = 'transparent';
          p.style.color = 'var(--text-sub)';
        });
        const allPillSave = pillsContainerSave.querySelector('[data-type="all"]');
        if (allPillSave) {
          allPillSave.classList.add('active');
          allPillSave.style.background = 'rgba(29,185,84,0.18)';
          allPillSave.style.color = '#1db954';
        }
      }

      renderDictWordsList();
      resetFlashcard();
      
      // Record activity in heatmap!
      recordActivity();

      // Show a brief in-modal success toast
      const saveBtn = document.getElementById('saveManualWordBtn');
      if (saveBtn) {
        const origText = saveBtn.textContent;
        const origBg = saveBtn.style.background;
        saveBtn.textContent = `✓ «${eng}» сохранено!`;
        saveBtn.style.background = 'linear-gradient(135deg, #1db954, #16a34a)';
        saveBtn.disabled = true;
        setTimeout(() => {
          saveBtn.textContent = origText;
          saveBtn.style.background = origBg;
          saveBtn.disabled = false;
          // Focus back on English field for next word/phrase
          wordEngEl.focus();
        }, 1400);
      }
    });
  }

  // 3. Card Speaker TTS Button listener
  const cardSpeakBtn = document.getElementById('cardSpeakBtn');
  if (cardSpeakBtn) {
    cardSpeakBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // VERY IMPORTANT! Prevent flipping card!
      if (activeTrainerWordObj && activeTrainerWordObj.word) {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(activeTrainerWordObj.word);
          const voices = window.speechSynthesis.getVoices();
          const enVoice = voices.find(v => v.lang.startsWith('en'));
          if (enVoice) utterance.voice = enVoice;
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      }
    });
  }

  // 3b. Card Practice Button listener
  const cardPracticeBtn = document.getElementById('cardPracticeBtn');
  if (cardPracticeBtn) {
    cardPracticeBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // VERY IMPORTANT! Prevent flipping card!
      if (activeTrainerWordObj && activeTrainerWordObj.word) {
        startRoleplay(activeTrainerWordObj.word);
      }
    });
  }

  // 3c. Card Speaker TTS Button listener (Back Side)
  const cardSpeakBtnBack = document.getElementById('cardSpeakBtnBack');
  if (cardSpeakBtnBack) {
    cardSpeakBtnBack.addEventListener('click', (e) => {
      e.stopPropagation(); // VERY IMPORTANT! Prevent flipping card!
      if (activeTrainerWordObj && activeTrainerWordObj.word) {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(activeTrainerWordObj.word);
          const voices = window.speechSynthesis.getVoices();
          const enVoice = voices.find(v => v.lang.startsWith('en'));
          if (enVoice) utterance.voice = enVoice;
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      }
    });
  }

  // 3d. Card Practice Button listener (Back Side)
  const cardPracticeBtnBack = document.getElementById('cardPracticeBtnBack');
  if (cardPracticeBtnBack) {
    cardPracticeBtnBack.addEventListener('click', (e) => {
      e.stopPropagation(); // VERY IMPORTANT! Prevent flipping card!
      if (activeTrainerWordObj && activeTrainerWordObj.word) {
        startRoleplay(activeTrainerWordObj.word);
      }
    });
  }

  // ✏️ Edit Word on Trainer Card Front/Back Side
  const cardEditBtnFront = document.getElementById('cardEditBtnFront');
  if (cardEditBtnFront) {
    cardEditBtnFront.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeTrainerWordObj) {
        openEditWordModal(activeTrainerWordObj, () => {
          renderTrainerCard(activeTrainerWordObj);
        });
      }
    });
  }

  const cardEditBtnBack = document.getElementById('cardEditBtnBack');
  if (cardEditBtnBack) {
    cardEditBtnBack.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeTrainerWordObj) {
        openEditWordModal(activeTrainerWordObj, () => {
          renderTrainerCard(activeTrainerWordObj);
        });
      }
    });
  }


  // 3e. Training Mode Select listener
  const trainingModeSelect = document.getElementById('trainingModeSelect');
  if (trainingModeSelect) {
    trainingModeSelect.addEventListener('change', () => {
      if (activeTrainerWordObj) {
        // Ensure card starts from the front face (clear flipped class and style transform)
        const flashcardInner = document.getElementById('flashcardInner');
        if (flashcardInner) {
          flashcardInner.classList.remove('is-flipped');
          flashcardInner.style.transform = '';
        }
        // Ensure Spaced Repetition pills are hidden initially
        const pills = document.getElementById('spacedRepetitionPills');
        if (pills) {
          pills.style.visibility = 'hidden';
          pills.style.opacity = '0';
        }
        renderTrainerCard(activeTrainerWordObj);
      }
    });
  }

  // 3f. Training Type Select listener (Words, Phrases, or All)
  const trainingTypeSelect = document.getElementById('trainingTypeSelect');
  if (trainingTypeSelect) {
    trainingTypeSelect.addEventListener('change', () => {
      // Force study list recalculation and pick a new appropriate word matching the selected type
      clearStudySession();
      startStudySession();
      resetFlashcard();
    });
  }

  // 3g. Training Limit Select listener (20, 40, or All)
  if (trainingLimitSelect) {
    const savedLimit = localStorage.getItem('galaxy_training_limit') || '20';
    trainingLimitSelect.value = savedLimit;

    trainingLimitSelect.addEventListener('change', () => {
      localStorage.setItem('galaxy_training_limit', trainingLimitSelect.value);
      clearStudySession();
      startStudySession();
      resetFlashcard();
    });
  }

  // 3h. Training Order Select listener (Shuffle or Ordered)
  const trainingOrderSelect = document.getElementById('trainingOrderSelect');
  if (trainingOrderSelect) {
    const savedOrder = localStorage.getItem('galaxy_training_order') || 'shuffle';
    trainingOrderSelect.value = savedOrder;

    trainingOrderSelect.addEventListener('change', () => {
      localStorage.setItem('galaxy_training_order', trainingOrderSelect.value);
      clearStudySession();
      startStudySession();
      resetFlashcard();
    });
  }

  // Open dictionary modal
  const openDictionaryModal = () => {
    window.dictForceStudyAll = false; // Reset force-study on new modal session
    if (trainingModal) closeModalEl(trainingModal); // Close training if open
    const dictListEl = document.getElementById('dictWordsList');
    if (dictListEl) {
      dictListEl.style.flex = '1 1 0';
      dictListEl.style.minHeight = '0';
    }
    const dictModalBody = modal.querySelector('.modal-body');
    if (dictModalBody) {
      dictModalBody.style.minHeight = '0';
    }
    
    // Ensure collapsible filters are collapsed on open
    const filtersCollapse = document.getElementById('dictFiltersCollapse');
    const toggleFiltersBtn = document.getElementById('toggleDictFiltersBtn');
    if (filtersCollapse) {
      filtersCollapse.classList.remove('expanded');
    }
    if (toggleFiltersBtn) {
      toggleFiltersBtn.classList.remove('active');
      const arrow = toggleFiltersBtn.querySelector('.toggle-arrow');
      if (arrow) arrow.textContent = '▼';
    }

    openModalEl(modal);
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    
    // Reset type filter to 'all' when opening
    dictTypeFilter = 'all';
    dictSortOption = 'default';
    
    // Update type filter buttons to show 'all' as active
    const pillsContainer = document.getElementById('dictTypePills');
    if (pillsContainer) {
      const pills = pillsContainer.querySelectorAll('.dict-type-pill');
      pills.forEach(p => {
        p.classList.remove('active');
        p.style.background = 'transparent';
        p.style.color = 'var(--text-sub)';
      });
      const allPill = pillsContainer.querySelector('[data-type="all"]');
      if (allPill) {
        allPill.classList.add('active');
        allPill.style.background = 'rgba(29,185,84,0.18)';
        allPill.style.color = '#1db954';
      }
    }
    
    // Reset sort to default
    const sortSelect = document.getElementById('dictSortSelect');
    if (sortSelect) {
      sortSelect.value = 'default';
    }
    
    // Default to Personal tab
    activeDictTab = 'personal';
    if (tabPersonal) {
      tabPersonal.classList.add('active');
      tabPersonal.style.color = 'var(--accent-spotify)';
      tabPersonal.style.borderBottomColor = 'var(--accent-spotify)';
      tabPersonal.style.fontWeight = '700';
    }
    if (tabEssential) {
      tabEssential.classList.remove('active');
      tabEssential.style.color = 'var(--text-muted)';
      tabEssential.style.borderBottomColor = 'transparent';
      tabEssential.style.fontWeight = '600';
    }
    if (addCategoryBtn) addCategoryBtn.style.display = 'flex';
    if (addWordBtn) addWordBtn.style.display = 'flex';
    if (progressBarContainer) progressBarContainer.style.display = 'none';
    
    populateCategorySelectors();
    renderDictWordsList();
    resetFlashcard();
    renderHeatmap();
  };
  window.openDictionaryModal = openDictionaryModal;

  openBtn.addEventListener('click', openDictionaryModal);

  // Close dictionary modal helper
  const closeDictModal = () => {
    stopMatchGame();
    stopLearnGame();
    modal.style.display = 'none';
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', closeDictModal);
  }

  // Backdrop click intentionally disabled — use the close button to dismiss

  // Open training modal helper
  const openTrainingModal = () => {
    window.dictForceStudyAll = false;
    closeModalEl(modal); // Close dictionary if open
    if (trainingModal) {
      openModalEl(trainingModal);
    }
    
    // Ensure training settings are collapsed on open
    const trainSettings = document.getElementById('trainingSettingsBar');
    const toggleTrainSettingsBtn = document.getElementById('toggleTrainingSettingsBtn');
    if (trainSettings) {
      trainSettings.classList.remove('expanded');
    }
    if (toggleTrainSettingsBtn) {
      toggleTrainSettingsBtn.classList.remove('active');
      const arrow = toggleTrainSettingsBtn.querySelector('.toggle-arrow');
      if (arrow) arrow.textContent = '▼';
    }

    // Ensure training heatmap state is initialized according to localStorage (default is collapsed)
    const trainHeatmap = trainingModal ? trainingModal.querySelector('.dict-heatmap-container') : null;
    const isTrainHeatmapCollapsed = localStorage.getItem('training_heatmap_collapsed') !== 'false';
    if (trainHeatmap) {
      if (isTrainHeatmapCollapsed) {
        trainHeatmap.classList.add('collapsed');
      } else {
        trainHeatmap.classList.remove('collapsed');
      }
    }
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    
    // Sync category label
    if (trainingCategoryLabel && categoryFilter) {
      trainingCategoryLabel.textContent = categoryFilter.value;
    }
    
    // Sync progress bar display state
    if (progressBarContainer) {
      progressBarContainer.style.display = (activeDictTab === 'essential') ? 'flex' : 'none';
    }
    
    // Start Quizlet-style study session!
    startStudySession();
    
    resetFlashcard();
    renderHeatmap();
    updateEssentialProgress();
  };
  window.openTrainingModal = openTrainingModal;

  if (openTrainingBtn) {
    openTrainingBtn.addEventListener('click', openTrainingModal);
  }
  if (startTrainingFromDictBtn) {
    startTrainingFromDictBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openTrainingModal();
    });
  }

  // Close training modal helper
  const closeTrainingModal = () => {
    closeModalEl(trainingModal);
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  };

  if (closeTrainingModalBtn) {
    closeTrainingModalBtn.addEventListener('click', closeTrainingModal);
  }
  const closeSessionSuccessBtn = document.getElementById('closeSessionSuccessBtn');
  if (closeSessionSuccessBtn) {
    closeSessionSuccessBtn.addEventListener('click', closeTrainingModal);
  }
  // Backdrop click intentionally disabled — use the close button to dismiss

  // Flip Flashcard on click
  if (flashcard) {
    flashcard.addEventListener('click', () => {
      if (flashcardInner) {
        const isFlipped = flashcardInner.classList.toggle('is-flipped');
        
        // Also show Spaced Repetition control buttons when flipped to back side
        const pills = document.getElementById('spacedRepetitionPills');
        if (pills) {
          if (isFlipped) {
            pills.style.visibility = 'visible';
            pills.style.opacity = '1';
            pills.style.transition = 'opacity 0.25s ease';
          } else {
            pills.style.visibility = 'hidden';
            pills.style.opacity = '0';
          }
        }
        
        // If flipped to back and is essential word with placeholder translation, trigger load!
        if (isFlipped && activeTrainerWordObj) {
          const w = activeTrainerWordObj;
          const transEl = document.getElementById('cardTranslation');
          if (w.translation.includes('нажмите для перевода') || w.translation === 'частотное слово') {
            if (transEl) transEl.textContent = 'Переводим... 🔍';
            fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(w.word)}&langpair=en|ru`)
              .then(res => res.json())
              .then(json => {
                const tr = json.responseData.translatedText;
                if (tr && tr.toLowerCase() !== w.word.toLowerCase()) {
                  const RussianTr = tr.toLowerCase();
                  w.translation = RussianTr;
                  if (activeTrainerWordObj && activeTrainerWordObj.word === w.word) {
                    if (transEl) transEl.textContent = RussianTr;
                  }
                  
                  // Update visual list label
                  const listEl = document.getElementById('dictWordsList');
                  if (listEl) {
                    const rows = listEl.children;
                    for (let i = 0; i < rows.length; i++) {
                      const titleEl = rows[i].querySelector('div div');
                      if (titleEl && titleEl.textContent.trim().toLowerCase().startsWith(w.word.toLowerCase())) {
                        const subLabel = rows[i].querySelector('div').children[1];
                        if (subLabel) subLabel.textContent = RussianTr;
                        break;
                      }
                    }
                  }
                  
                  // Save translation in storage if promoted
                  const pIdx = personalDictionary.findIndex(x => x.word.toLowerCase() === w.word.toLowerCase());
                  if (pIdx !== -1) {
                    personalDictionary[pIdx].translation = RussianTr;
                    saveDictionaryToStorage();
                  }
                } else {
                  if (transEl) transEl.textContent = 'Частотное слово';
                }
              })
              .catch(() => {
                if (transEl) transEl.textContent = 'Частотное слово';
              });
          }
        }
      }
    });
  }

  // Clear all dictionary words
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const activeCat = categoryFilter ? categoryFilter.value : 'Все слова';
      if (activeDictTab === 'essential' || activeCat.startsWith('«Топ-')) {
        alert("Встроенные частотные коллекции нельзя очистить. Переключитесь на вкладку «Мой словарь».");
        return;
      }
      if (personalDictionary.length === 0) return;

      // Remove any existing confirmation banner
      const existing = document.getElementById('clearDictConfirmBanner');
      if (existing) { existing.remove(); return; }

      const banner = document.createElement('div');
      banner.id = 'clearDictConfirmBanner';
      banner.style.cssText = `
        background: rgba(239,68,68,0.08);
        border: 1px solid rgba(239,68,68,0.35);
        border-radius: 14px;
        padding: 14px 16px;
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        animation: fadeIn 0.2s ease;
        box-sizing: border-box;
        width: 100%;
      `;
      banner.innerHTML = `
        <div style="font-size: 0.82rem; color: #ef4444; font-weight: 700; display: flex; align-items: center; gap: 6px;">
          ☠️ Это действие необратимо!
        </div>
        <div style="font-size: 0.75rem; color: var(--text-sub); line-height: 1.5;">
          Будет удалено <strong style="color: var(--text-main);">${personalDictionary.length} ${(() => { const n = personalDictionary.length; return n % 100 >= 11 && n % 100 <= 19 ? 'слов' : n % 10 === 1 ? 'слово' : n % 10 >= 2 && n % 10 <= 4 ? 'слова' : 'слов'; })()}</strong> из вашего словаря без возможности восстановления.<br>
          Чтобы подтвердить, введите слово <strong style="color: #ef4444; letter-spacing: 0.05em;">УДАЛИТЬ</strong>:
        </div>
        <input id="clearDictConfirmInput" type="text" autocomplete="off" placeholder="Введите УДАЛИТЬ" style="
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 10px;
          padding: 8px 12px;
          color: var(--text-main);
          font-size: 0.82rem;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          font-family: var(--font-body, sans-serif);
          transition: border-color 0.2s;
        " />
        <div style="display: flex; gap: 8px;">
          <button id="clearDictConfirmBtn" style="
            background: linear-gradient(135deg, #ef4444, #b91c1c);
            color: #fff;
            border: none;
            border-radius: 10px;
            padding: 8px 16px;
            font-size: 0.8rem;
            font-weight: 700;
            cursor: pointer;
            flex: 1;
            opacity: 0.4;
            transition: opacity 0.2s;
            outline: none;
          " disabled>☠️ Удалить всё</button>
          <button id="clearDictCancelBtn" style="
            background: transparent;
            color: var(--text-sub);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 8px 14px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: opacity 0.2s;
            outline: none;
          ">Отмена</button>
        </div>
      `;

      // Insert banner below the clear button
      const bottomControls = clearBtn.closest('.dict-bottom-controls') || clearBtn.parentNode;
      bottomControls.insertAdjacentElement('afterend', banner);

      const confirmInput = document.getElementById('clearDictConfirmInput');
      const confirmBtn = document.getElementById('clearDictConfirmBtn');
      const cancelBtn = document.getElementById('clearDictCancelBtn');

      setTimeout(() => confirmInput && confirmInput.focus(), 80);

      confirmInput.addEventListener('input', () => {
        const match = confirmInput.value.trim().toUpperCase() === 'УДАЛИТЬ';
        confirmBtn.disabled = !match;
        confirmBtn.style.opacity = match ? '1' : '0.4';
        confirmInput.style.borderColor = match ? 'rgba(239,68,68,0.7)' : 'rgba(239,68,68,0.3)';
      });

      confirmInput.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' && !confirmBtn.disabled) confirmBtn.click();
        if (ev.key === 'Escape') cancelBtn.click();
      });

      confirmBtn.addEventListener('click', () => {
        personalDictionary = [];
        saveDictionaryToStorage();
        renderDictWordsList();
        resetFlashcard();
        banner.remove();
      });

      cancelBtn.addEventListener('click', () => banner.remove());
    });
  }

  // ── Scroll-to-top button for word list ──────────────────────────────────
  const dictList = document.getElementById('dictWordsList');
  const scrollTopBtn = document.getElementById('dictScrollTopBtn');
  if (dictList && scrollTopBtn) {
    dictList.addEventListener('scroll', () => {
      if (dictList.scrollTop > 80) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    scrollTopBtn.addEventListener('click', () => {
      dictList.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  // ─────────────────────────────────────────────────────────────────────────


  const toggleFiltersBtn = document.getElementById('toggleDictFiltersBtn');
  const filtersCollapse = document.getElementById('dictFiltersCollapse');
  if (toggleFiltersBtn && filtersCollapse) {
    toggleFiltersBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = filtersCollapse.classList.contains('expanded');
      if (isExpanded) {
        filtersCollapse.classList.remove('expanded');
        toggleFiltersBtn.classList.remove('active');
        const arrow = toggleFiltersBtn.querySelector('.toggle-arrow');
        if (arrow) arrow.textContent = '▼';
      } else {
        filtersCollapse.classList.add('expanded');
        toggleFiltersBtn.classList.add('active');
        const arrow = toggleFiltersBtn.querySelector('.toggle-arrow');
        if (arrow) arrow.textContent = '▲';
      }
    });
  }

  const toggleTrainingSettingsBtn = document.getElementById('toggleTrainingSettingsBtn');
  const trainingSettingsBar = document.getElementById('trainingSettingsBar');
  if (toggleTrainingSettingsBtn && trainingSettingsBar) {
    toggleTrainingSettingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = trainingSettingsBar.classList.contains('expanded');
      if (isExpanded) {
        trainingSettingsBar.classList.remove('expanded');
        toggleTrainingSettingsBtn.classList.remove('active');
        const arrow = toggleTrainingSettingsBtn.querySelector('.toggle-arrow');
        if (arrow) arrow.textContent = '▼';
      } else {
        trainingSettingsBar.classList.add('expanded');
        toggleTrainingSettingsBtn.classList.add('active');
        const arrow = toggleTrainingSettingsBtn.querySelector('.toggle-arrow');
        if (arrow) arrow.textContent = '▲';
      }
    });
  }

  const toggleTrainingHeatmapBtn = document.getElementById('toggleTrainingHeatmapBtn');
  if (toggleTrainingHeatmapBtn && trainingModal) {
    toggleTrainingHeatmapBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const trainHeatmap = trainingModal.querySelector('.dict-heatmap-container');
      if (trainHeatmap) {
        const isCollapsed = trainHeatmap.classList.contains('collapsed');
        if (isCollapsed) {
          trainHeatmap.classList.remove('collapsed');
          localStorage.setItem('training_heatmap_collapsed', 'false');
        } else {
          trainHeatmap.classList.add('collapsed');
          localStorage.setItem('training_heatmap_collapsed', 'true');
        }
      }
    });
  }
  

  // Search words in dictionary
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderDictWordsList(searchInput.value.trim());
    });
  }

  // Category filter select trigger
  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      window.dictForceStudyAll = false; // Reset force-study
      renderDictWordsList(searchInput ? searchInput.value.trim() : "");
      resetFlashcard();
    });
  }

  // Custom Category filter select trigger
  const customCategoryFilter = document.getElementById('dictCustomCategoryFilter');
  if (customCategoryFilter) {
    customCategoryFilter.addEventListener('change', () => {
      window.dictForceStudyAll = false; // Reset force-study
      renderDictWordsList(searchInput ? searchInput.value.trim() : "");
      resetFlashcard();
    });
  }

  // Initialize type filter buttons (Words/Phrases/All)
  setupDictTypeFilters();

  // Initialize sort filter
  setupDictSortFilter();

  // Create custom word category / playlist folder
  const addCatBtn = document.getElementById('addCustomCategoryBtn');
  if (addCatBtn) {
    addCatBtn.addEventListener('click', () => {
      const name = prompt("Введите название новой папки для слов:");
      if (name === null) return; // Cancelled
      const cleanName = name.trim();
      if (!cleanName) {
        alert("Название папки не может быть пустым!");
        return;
      }
      if (cleanName.length > 25) {
        alert("Название папки слишком длинное (максимум 25 символов)!");
        return;
      }
      
      // Case-insensitive duplicate check
      const exists = personalCategories.some(c => c.toLowerCase() === cleanName.toLowerCase());
      if (exists) {
        alert("Папка с таким названием уже существует!");
        return;
      }
      
      personalCategories.push(cleanName);
      saveCategories();
      
      // Dynamic refresh
      populateCategorySelectors();
      
      // Switch active view directly to the newly created folder
      if (categoryFilter) {
        categoryFilter.value = cleanName;
        categoryFilter.dispatchEvent(new Event('change'));
      }
    });
  }

  // Create custom word category / tag
  const addCustomCatBtn = document.getElementById('addCustomCustomCategoryBtn');
  if (addCustomCatBtn) {
    addCustomCatBtn.addEventListener('click', () => {
      const name = prompt("Введите название новой категории для слов/фраз:");
      if (name === null) return; // Cancelled
      const cleanName = name.trim();
      if (!cleanName) {
        alert("Название категории не может быть пустым!");
        return;
      }
      if (cleanName.length > 25) {
        alert("Название категории слишком длинное (максимум 25 символов)!");
        return;
      }
      
      // Case-insensitive duplicate check
      const exists = personalCustomCategories.some(c => c.toLowerCase() === cleanName.toLowerCase());
      if (exists || cleanName.toLowerCase() === 'без категории' || cleanName.toLowerCase() === 'все категории') {
        alert("Категория с таким названием уже существует или зарезервирована!");
        return;
      }
      
      personalCustomCategories.push(cleanName);
      saveCategories();
      
      // Dynamic refresh
      populateCategorySelectors();
      
      // Switch active view directly to the newly created category
      if (customCategoryFilter) {
        customCategoryFilter.value = cleanName;
        customCategoryFilter.dispatchEvent(new Event('change'));
      }
    });
  }

  // Bind Spaced Repetition pill buttons with snappy mobile touch response (0ms delay)
  const forgotBtn = document.getElementById('cardForgotBtn');
  const hardBtn = document.getElementById('cardHardBtn');
  const easyBtn = document.getElementById('cardEasyBtn');

  const bindSnappyInteraction = (btn, callback) => {
    if (!btn) return;

    let isTouching = false;

    btn.addEventListener('touchstart', (e) => {
      isTouching = true;
      e.stopPropagation();
      // Prevent synthetic click that hits the shifted Undo button on mobile
      e.preventDefault(); 
      
      // Manually trigger active state since we prevented default
      btn.style.transform = 'scale(0.92)';
      btn.style.opacity = '0.8';
      setTimeout(() => {
        btn.style.transform = '';
        btn.style.opacity = '';
      }, 150);

      callback();
    }, { passive: false });

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!isTouching) {
        callback();
      }
      // Reset after a short delay so next click/touch works cleanly
      setTimeout(() => { isTouching = false; }, 300);
    });
  };
  
  if (forgotBtn) {
    bindSnappyInteraction(forgotBtn, () => handleWordReview('forgot'));
  }
  if (hardBtn) {
    bindSnappyInteraction(hardBtn, () => handleWordReview('hard'));
  }
  if (easyBtn) {
    bindSnappyInteraction(easyBtn, () => handleWordReview('easy'));
  }

  const undoBtn = document.getElementById('cardUndoBtn');
  if (undoBtn) {
    undoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleUndoReview();
    });
  }

  // Delete active flashcard word
  const deleteBtn = document.getElementById('cardDeleteBtn');
  if (deleteBtn) {
    bindSnappyInteraction(deleteBtn, () => {
      const activeWord = document.getElementById('cardWord')?.textContent;
      if (!activeWord) return;
      personalDictionary = personalDictionary.filter(w => w.word !== activeWord);
      saveDictionaryToStorage();
      sessionQueue = sessionQueue.filter(w => w.word !== activeWord);
      saveStudySession();
      renderDictWordsList(searchInput ? searchInput.value.trim() : "");
      resetFlashcard();
    });
  }


  // Match Game Mode inspired by Quizlet
  let matchInterval = null;
  let matchStartTime = 0;
  let selectedTile = null;
  let matchCompletedCount = 0;
  let currentMatchTimerValue = 0;

  const startMatchBtn = document.getElementById('startMatchGameBtn');
  const exitMatchBtn = document.getElementById('exitMatchGameBtn');
  const dictStandardView = document.getElementById('dictStandardView');
  const dictMatchView = document.getElementById('dictMatchView');
  const matchTimerEl = document.getElementById('matchTimer');
  const matchGrid = document.getElementById('matchGrid');

  function shuffleFisherYates(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function startMatchGame() {
    // We fetch from personalDictionary
    if (!personalDictionary || personalDictionary.length < 6) {
      alert('Сохраните больше слов для игры (минимум 6)! 🎮');
      return;
    }

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
        tile.dataset.pairId = tileData.pairId;
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
      // Select first tile
      tile.classList.add('selected');
      selectedTile = tile;
    } else {
      // Compare with second tile
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
          clearInterval(matchInterval);
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
    if (dictStandardView) dictStandardView.style.display = 'flex';
    if (dictMatchView) dictMatchView.style.display = 'none';
    selectedTile = null;
    matchCompletedCount = 0;
  }

  if (startMatchBtn) {
    startMatchBtn.addEventListener('click', startMatchGame);
  }
  if (exitMatchBtn) {
    exitMatchBtn.addEventListener('click', stopMatchGame);
  }

  // Learn Mode (Multiple Choice Quiz Mode)
  let learnQuestionsList = [];
  let learnCurrentIndex = 0;
  let learnCorrectAnswersCount = 0;
  let learnIsProcessingAnswer = false;

  const startLearnBtn = document.getElementById('startLearnGameBtn');
  const exitLearnBtn = document.getElementById('exitLearnGameBtn');
  const dictLearnView = document.getElementById('dictLearnView');
  const learnGameArea = document.getElementById('learnGameArea');
  const learnResultsView = document.getElementById('learnResultsView');
  const learnChoicesGrid = document.getElementById('learnChoicesGrid');
  const learnQuestionWord = document.getElementById('learnQuestionWord');
  const learnCurrentQuestion = document.getElementById('learnCurrentQuestion');
  const learnAccuracy = document.getElementById('learnAccuracy');
  const learnProgressBar = document.getElementById('learnProgressBar');
  const closeLearnResultsBtn = document.getElementById('closeLearnResultsBtn');
  const learnResultCorrect = document.getElementById('learnResultCorrect');
  const learnResultPercent = document.getElementById('learnResultPercent');

  function startLearnGame() {
    if (!personalDictionary || personalDictionary.length < 4) {
      alert('Соберите больше слов для старта (минимум 4)! 📝');
      return;
    }

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
    if (learnCurrentIndex >= learnQuestionsList.length) {
      // Game Over: Show results screen
      if (learnGameArea) learnGameArea.style.display = 'none';
      if (learnResultsView) learnResultsView.style.display = 'flex';

      if (learnResultCorrect) learnResultCorrect.textContent = learnCorrectAnswersCount;
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
      // Responsive scale
      if (targetObj.word.length > 25) {
        learnQuestionWord.style.fontSize = '1.15rem';
      } else if (targetObj.word.length > 15) {
        learnQuestionWord.style.fontSize = '1.3rem';
      } else {
        learnQuestionWord.style.fontSize = '1.55rem';
      }
    }

    // Stats and progress indicators
    if (learnCurrentQuestion) learnCurrentQuestion.textContent = (learnCurrentIndex + 1);
    if (learnProgressBar) {
      const pct = Math.round((learnCurrentIndex / learnQuestionsList.length) * 100);
      learnProgressBar.style.width = pct + '%';
    }
    if (learnAccuracy) {
      const acc = learnCurrentIndex === 0 
        ? 100 
        : Math.round((learnCorrectAnswersCount / learnCurrentIndex) * 100);
      learnAccuracy.textContent = acc;
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
          saveDictionaryToStorage();
        }
      }
    }

    // Update progress bar to final 100% on the last question during feedback
    if (learnCurrentIndex === learnQuestionsList.length - 1 && learnProgressBar) {
      learnProgressBar.style.width = '100%';
    }

    // Update real-time accuracy stat after the answer
    if (learnAccuracy) {
      const acc = Math.round((learnCorrectAnswersCount / (learnCurrentIndex + 1)) * 100);
      learnAccuracy.textContent = acc;
    }

    setTimeout(() => {
      learnCurrentIndex++;
      learnIsProcessingAnswer = false;
      loadLearnQuestion();
    }, nextDelay);
  }

  function stopLearnGame() {
    if (dictStandardView) dictStandardView.style.display = 'flex';
    if (dictLearnView) dictLearnView.style.display = 'none';
    learnQuestionsList = [];
    learnCurrentIndex = 0;
    learnIsProcessingAnswer = false;
  }

  if (startLearnBtn) {
    startLearnBtn.addEventListener('click', startLearnGame);
  }
  if (exitLearnBtn) {
    exitLearnBtn.addEventListener('click', stopLearnGame);
  }
  if (closeLearnResultsBtn) {
    closeLearnResultsBtn.addEventListener('click', stopLearnGame);
  }

  // AI Roleplay (Conversation Simulator)
  let roleplayPhrase = '';
  let roleplayMessages = [];
  let roleplayTurnCount = 0;

  const roleplayModal = document.getElementById('roleplayModal');
  const closeRoleplayModalBtn = document.getElementById('closeRoleplayModalBtn');
  const roleplayTargetWord = document.getElementById('roleplayTargetWord');
  const roleplayChatBody = document.getElementById('roleplayChatBody');
  const roleplayChatInput = document.getElementById('roleplayChatInput');
  const sendRoleplayMsgBtn = document.getElementById('sendRoleplayMsgBtn');
  const roleplayFinishContainer = document.getElementById('roleplayFinishContainer');
  const finishRoleplayBtn = document.getElementById('finishRoleplayBtn');

  async function fetchAIChatResponse(messages) {
    requireAPIKey();
    const currentApiKey = getAPIKey();

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
      // Default Google Gemini 2.0 Flash API
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

    if (roleplayTargetWord) roleplayTargetWord.textContent = word;
    if (roleplayChatBody) roleplayChatBody.innerHTML = '';
    if (roleplayChatInput) roleplayChatInput.value = '';
    if (roleplayFinishContainer) roleplayFinishContainer.style.display = 'none';

    if (roleplayModal) openModalEl(roleplayModal);

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
        appendRoleplayMessageBubble('Ошибка соединения с ИИ: ' + err.message, 'ai');
      });
  }

  function handleSendRoleplayMessage() {
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

        if (roleplayTurnCount >= 3) {
          if (roleplayFinishContainer) roleplayFinishContainer.style.display = 'flex';
        }
      })
      .catch(err => {
        removeRoleplayTypingIndicator();
        appendRoleplayMessageBubble('Ошибка соединения с ИИ: ' + err.message, 'ai');
      });
  }

  function appendRoleplayMessageBubble(text, sender) {
    if (!roleplayChatBody) return;

    const bubble = document.createElement('div');
    bubble.className = `roleplay-bubble ${sender}`;
    bubble.textContent = text;
    bubble.style.whiteSpace = 'pre-wrap';

    roleplayChatBody.appendChild(bubble);
    roleplayChatBody.scrollTop = roleplayChatBody.scrollHeight;
  }

  function appendRoleplayTypingIndicator() {
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

  // Setup events
  if (closeRoleplayModalBtn) {
    closeRoleplayModalBtn.addEventListener('click', () => {
      if (roleplayModal) closeModalEl(roleplayModal);
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
      if (roleplayModal) closeModalEl(roleplayModal);
      recordActivity(15);
      alert('Практика успешно завершена! Вам начислено +15 очков активности.');
    });
  }

  window.startRoleplay = startRoleplay;
}

function setTrainerCardWord(word) {
  const wordEl = document.getElementById('cardWord');
  if (!wordEl) return;
  
  wordEl.textContent = word;
  
  const parentContainer = document.getElementById('cardWordContainer');
  if (!parentContainer) return;
  
  const textLen = word.length;
  if (textLen > 100) {
    parentContainer.style.fontSize = '0.85rem';
    parentContainer.style.lineHeight = '1.3';
  } else if (textLen > 50) {
    parentContainer.style.fontSize = '1.0rem';
    parentContainer.style.lineHeight = '1.3';
  } else if (textLen > 25) {
    parentContainer.style.fontSize = '1.2rem';
    parentContainer.style.lineHeight = '1.3';
  } else if (textLen > 15) {
    parentContainer.style.fontSize = '1.45rem';
    parentContainer.style.lineHeight = '1.3';
  } else {
    parentContainer.style.fontSize = '2rem';
    parentContainer.style.lineHeight = '';
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
  let dueWords = filteredWords.filter(w => !w.nextReview || w.nextReview <= now);
  
  // Filter new words (level === 0)
  let newWords = filteredWords.filter(w => !w.level || w.level === 0);

  // Combine them: Priority is due words first, then new words
  let pool = [...dueWords];
  
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
  
  // Supplement with new words if pool is below limit
  if (pool.length < limit) {
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
          ${nextReviewText ? `<span style="display:inline-block;margin-top:8px;padding:6px 14px;background:rgba(29,185,84,0.1);border:1px solid rgba(29,185,84,0.2);border-radius:12px;font-weight:600;color:#1db954;">📅 ${nextReviewText}</span>` : ''}
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

  // Ensure Spaced Repetition control buttons are hidden initially
  if (pills) {
    pills.style.visibility = 'hidden';
    pills.style.opacity = '0';
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
      if (emptyTitle) emptyTitle.textContent = "Словарь пуст 📂";
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
          summaryListEl.textContent = 'Нет изученных слов.';
        }
      }
      
      // Trigger CSS Confetti particle pop!
      triggerConfettiCelebration();
    }
    return;
  }

  // Ensure card starts from the front face (clear flipped class and style transform)
  flashcardInner.classList.remove('is-flipped');
  flashcardInner.style.transform = '';

  // Ensure Spaced Repetition pills are hidden initially
  const pills = document.getElementById('spacedRepetitionPills');
  if (pills) {
    pills.style.visibility = 'hidden';
    pills.style.opacity = '0';
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
    if (transEl) {
      transEl.textContent = wordObj.word;
      transEl.classList.remove('russian-font');
    }
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
  } else if (mode === 'def_to_en') {
    // Definition on Front, English on Back
    const frontText = (wordObj.definition && wordObj.definition.trim()) || (wordObj.context ? 'Контекст: ' + wordObj.context : wordObj.translation);
    setTrainerCardWord(frontText);
    if (cardWordEl) cardWordEl.classList.add('russian-font');
    if (transEl) {
      transEl.textContent = wordObj.word;
      transEl.classList.remove('russian-font');
    }
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
    if (transEl) {
      transEl.textContent = backText;
      transEl.classList.add('russian-font');
    }
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
    if (transEl) {
      transEl.textContent = wordObj.translation;
      transEl.classList.add('russian-font');
    }
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
function findSongExamples(word) {
  if (!word) return [];
  const normalizedWord = word.trim().toLowerCase();
  const seenLines = new Set();

  const escapedWord = normalizedWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`\\b${escapedWord}\\w*\\b`, 'i');

  const songIdentity = (song) => `${song.title}::${song.artist}`.toLowerCase();

  const collectMatchesForSong = (song) => {
    if (!song || !song.lines) return [];
    const matches = [];

    for (const line of song.lines) {
      if (!line.text) continue;

      const sublines = line.text.split('\n');
      const translations = line.translation ? line.translation.split('\n') : [];

      for (let i = 0; i < sublines.length; i++) {
        const textLine = sublines[i].trim();
        const translationLine = translations[i] ? translations[i].trim() : '';

        if (!textLine || !regex.test(textLine)) continue;

        const uniqueKey = textLine.toLowerCase();
        if (seenLines.has(uniqueKey)) continue;

        seenLines.add(uniqueKey);
        matches.push({
          text: textLine,
          translation: translationLine,
          songTitle: song.title,
          artist: song.artist
        });
      }
    }

    return matches;
  };

  const allSongKeys = Object.keys(songsData);
  const orderedKeys = [
    ...(currentSongKey && songsData[currentSongKey] ? [currentSongKey] : []),
    ...allSongKeys.filter(key => key !== currentSongKey)
  ];

  const examples = [];
  const usedSongIds = new Set();

  // Phase 1: at most one example per song — prioritize different sources
  for (const key of orderedKeys) {
    if (examples.length >= 3) break;

    const song = songsData[key];
    if (!song) continue;

    const songId = songIdentity(song);
    if (usedSongIds.has(songId)) continue;

    const matches = collectMatchesForSong(song);
    if (matches.length === 0) continue;

    examples.push(matches[0]);
    usedSongIds.add(songId);
  }

  // Phase 2: If still no examples found in lyrics, check song titles
  if (examples.length === 0) {
    for (const key of orderedKeys) {
      if (examples.length >= 3) break;

      const song = songsData[key];
      if (!song) continue;

      if (song.title && regex.test(song.title)) {
        examples.push({
          text: `[Упоминание в названии] ${song.title}`,
          translation: `Песня исполнителя ${song.artist}`,
          songTitle: song.title,
          artist: song.artist
        });
      }
    }
  }

  return examples;
}

// Format the examples array into a high-fidelity visual HTML block
function formatSongExamplesHTML(word, examples) {
  if (!examples || examples.length === 0) {
    return `
      <div style="font-size: 0.7rem; color: var(--text-muted); font-style: italic; margin-top: 6px; text-align: center;">
        Примеры употребления в песнях не найдены.
      </div>
    `;
  }
  
  const normalizedWord = word.trim().toLowerCase();
  const escapedWord = normalizedWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`\\b(${escapedWord}\\w*)\\b`, 'gi');

  let html = `
    <div class="song-examples-wrapper" style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px; width: 100%; box-sizing: border-box;">
      <div style="font-size: 0.65rem; font-weight: 700; color: var(--accent-spotify); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; text-align: left; display: flex; align-items: center; gap: 4px;">
        🎵 Примеры из песен:
      </div>
  `;

  examples.forEach(ex => {
    const escapedText = escapeHTML(ex.text);
    const highlightedText = escapedText.replace(regex, `<strong style="color: var(--accent-spotify); text-shadow: 0 0 8px rgba(29,185,84,0.3);">$1</strong>`);
    html += `
      <div class="song-example-item" style="border-left: 2px solid var(--accent-spotify); padding: 4px 0 4px 8px; font-size: 0.72rem; line-height: 1.3; text-align: left; background: rgba(255,255,255,0.01); border-radius: 0 8px 8px 0; box-sizing: border-box;">
        <div style="color: var(--text-main); font-weight: 600;">${highlightedText}</div>
        ${ex.translation ? `<div style="color: var(--text-muted); font-size: 0.68rem; margin-top: 1px;">${escapeHTML(ex.translation)}</div>` : ''}
        <div style="color: var(--accent-spotify); opacity: 0.6; font-size: 0.6rem; font-style: italic; margin-top: 2px; text-align: right; padding-right: 4px;">
          — ${escapeHTML(ex.songTitle)} (${escapeHTML(ex.artist)})
        </div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

// Render the list of dictionary words in left side panel
function renderDictWordsList(filterQuery = "") {
  const listEl = document.getElementById('dictWordsList');
  if (!listEl) return;

  listEl.innerHTML = '';
  
  // Filter by category first
  let categoryWords = getFilteredDictionaryWords();

  // Apply type filter (words/phrases/all)
  if (dictTypeFilter === 'words') {
    categoryWords = categoryWords.filter(w => w.type !== 'phrase');
  } else if (dictTypeFilter === 'phrases') {
    categoryWords = categoryWords.filter(w => w.type === 'phrase');
  }
  // 'all' shows everything

  // Apply text search filter
  const filtered = categoryWords.filter(w => {
    const q = filterQuery.toLowerCase();
    return w.word.toLowerCase().includes(q) || w.translation.toLowerCase().includes(q);
  });

  // Apply sorting
  const sorted = applySortToDictWords(filtered);

  if (sorted.length === 0) {
    listEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1.5rem 0;">Слова не найдены</div>`;
    return;
  }

  // Create a single DocumentFragment to prevent multiple reflows
  const fragment = document.createDocumentFragment();

  sorted.forEach(w => {
    const wordRow = document.createElement('div');
    wordRow.className = 'dict-word-row';
    wordRow.style.cssText = "display: flex; flex-direction: column; align-items: stretch; flex-shrink: 0; padding: 10px 14px; cursor: pointer; box-sizing: border-box; margin-bottom: 4px;";
    
    // Add small tag showing active interval
    const intervalDays = w.interval || 0;
    const intervalBadge = intervalDays > 0 ? `<span style="font-size: 0.65rem; padding: 2px 6px; background: rgba(29,185,84,0.1); color: var(--accent-spotify); border-radius: 8px; margin-left: 6px;">${intervalDays}d</span>` : '';

    // Build multi-category badges
    const wordCats = (w.categories && Array.isArray(w.categories) && w.categories.length > 0)
      ? w.categories : [w.category || 'Общее'];
    const catBadges = wordCats.map(c =>
      `<span class="dict-cat-badge" style="font-size: 0.65rem; color: var(--text-muted); background: rgba(255,255,255,0.06); padding: 1px 6px; border-radius: 6px; display: inline-flex; align-items: center; gap: 3px;">📁 ${escapeHTML(c)}</span>`
    ).join('');

    // Safely escape word and translation to prevent XSS vulnerabilities
    const headerHTML = `
      <div class="word-row-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div style="text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">
          <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-main); display: flex; align-items: center;">${escapeHTML(w.word)} ${intervalBadge}</div>
          <div style="font-size: 0.8rem; color: var(--accent-spotify); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span>${escapeHTML(w.translation)}</span>
            ${catBadges}
            ${(() => {
              const customCats = (w.customCategories && Array.isArray(w.customCategories) && w.customCategories.length > 0)
                ? w.customCategories : [w.customCategory || 'Без категории'];
              return customCats.filter(c => c !== 'Без категории').map(c =>
                `<span style="font-size: 0.65rem; color: #a78bfa; background: rgba(167,139,250,0.1); border: 1px solid rgba(167,139,250,0.2); padding: 1px 6px; border-radius: 6px; display: inline-flex; align-items: center; gap: 3px;">🏷️ ${escapeHTML(c)}</span>`
              ).join('');
            })()}
          </div>
        </div>
        <button class="speak-btn" style="padding: 6px; opacity: 0.6; transition: opacity 0.2s; background: none; border: none; color: var(--text-main); cursor: pointer;" title="Прослушать">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        </button>
      </div>
      ${w.definition ? `
      <div class="word-definition-block" style="font-size: 0.76rem; color: var(--text-sub); margin-top: 6px; font-style: italic; border-left: 2px solid rgba(167, 139, 250, 0.4); padding-left: 8px; white-space: normal; text-align: left; line-height: 1.3;">
        ${escapeHTML(w.definition)}
      </div>
      ` : ''}
      ${w.rule ? `
      <div class="word-rule-block" style="font-size: 0.74rem; color: #60a5fa; margin-top: 5px; border-left: 2px solid rgba(96,165,250,0.4); padding-left: 8px; white-space: normal; text-align: left; line-height: 1.3; display: flex; align-items: flex-start; gap: 4px;">
        <span style="opacity:0.7; flex-shrink:0;">📐</span><span>${escapeHTML(w.rule)}</span>
      </div>
      ` : ''}
    `;
    wordRow.innerHTML = headerHTML;

    // Speak button
    const speakBtn = wordRow.querySelector('.speak-btn');
    if (speakBtn) {
      speakBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speakText(w.word);
      });
    }

    // Hover effect (only if not expanded)
    let isExpanded = false;
    let detailEl = null;

    // Hover handled by CSS :hover selector

    // Click handler for expand/collapse and sync with trainer card
    wordRow.addEventListener('click', () => {
      if (isExpanded) {
        // Collapse
        if (detailEl) detailEl.remove();
        isExpanded = false;
        wordRow.isExpanded = false;
        wordRow.classList.remove('expanded');
        return;
      }

      // Collapse all other expanded rows first
      const allRows = listEl.querySelectorAll('.dict-word-row');
      allRows.forEach(row => {
        if (row !== wordRow && row.isExpanded) {
          row.click(); // Trigger collapse
        }
      });

      // Expand this one
      isExpanded = true;
      wordRow.isExpanded = true; // Mark custom state on DOM element
      wordRow.classList.add('expanded');

      // Create detail container
      detailEl = document.createElement('div');
      detailEl.className = 'word-row-detail';
      detailEl.style.cssText = "width: 100%; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 8px; box-sizing: border-box;";

      // Locate song examples and format
      const examples = findSongExamples(w.word);
      const examplesHTML = formatSongExamplesHTML(w.word, examples);

      // Safe HTML construction to protect against XSS
      detailEl.innerHTML = `
        <div style="font-size: 0.75rem; color: var(--text-sub); line-height: 1.4; text-align: left;">
          <strong>Контекст:</strong> ${escapeHTML(w.context || 'контекст не указан')}
        </div>
        ${examplesHTML}
        <div class="word-actions-grid">
          <button class="row-copy-btn" style="background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.25); color: #60a5fa;" title="Копировать слово в буфер обмена">📋 Копировать</button>
          <button class="row-edit-btn" style="background: rgba(167, 139, 250, 0.12); border: 1px solid rgba(167, 139, 250, 0.25); color: #a78bfa;">✏️ Править</button>
          <button class="row-practice-btn" style="background: rgba(29, 185, 84, 0.12); border: 1px solid rgba(29, 185, 84, 0.25); color: var(--accent-spotify);">💬 Практика</button>
          <button class="row-reset-btn" style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.25); color: #f59e0b;" title="Сбросить прогресс заучивания">🔄 Сбросить</button>
          <button class="row-del-btn" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.25); color: #ef4444;">🗑️ Удалить</button>
        </div>
      `;

      // Prevent parent click propagation when clicking inside detail panel
      detailEl.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // Copy to clipboard action button inside detail panel
      const copyBtn = detailEl.querySelector('.row-copy-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(w.word).then(() => {
            copyBtn.classList.add('success-copy');
            copyBtn.innerHTML = '✓ Скопировано!';
            setTimeout(() => {
              copyBtn.classList.remove('success-copy');
              copyBtn.innerHTML = '📋 Копировать';
            }, 1500);
          }).catch(err => {
            console.error('Failed to copy via navigator.clipboard: ', err);
            // Fallback for restricted settings or frames
            try {
              const el = document.createElement('textarea');
              el.value = w.word;
              document.body.appendChild(el);
              el.select();
              document.execCommand('copy');
              document.body.removeChild(el);
              copyBtn.classList.add('success-copy');
              copyBtn.innerHTML = '✓ Скопировано!';
              setTimeout(() => {
                copyBtn.classList.remove('success-copy');
                copyBtn.innerHTML = '📋 Копировать';
              }, 1500);
            } catch (fallbackErr) {
              alert('Не удалось скопировать слово: ' + w.word);
            }
          });
        });
      }

      // Edit button — open proper edit modal
      const editBtn = detailEl.querySelector('.row-edit-btn');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openEditWordModal(w, () => {
            const searchInput = document.getElementById('dictSearchInput');
            renderDictWordsList(searchInput ? searchInput.value.trim() : '');
          });
        });
      }
            // Practice action button inside detail panel
      const practiceBtn = detailEl.querySelector('.row-practice-btn');
      if (practiceBtn) {
        practiceBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          startRoleplay(w.word);
        });
      }

      // Reset progress action button inside detail panel
      const resetBtn = detailEl.querySelector('.row-reset-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!confirm(`Вы действительно хотите полностью обнулить прогресс заучивания для «${w.word}»?`)) return;
          w.level = 0;
          w.interval = 0;
          w.nextReview = Date.now();
          saveDictionaryToStorage();
          const searchInput = document.getElementById('dictSearchInput');
          renderDictWordsList(searchInput ? searchInput.value.trim() : "");
          resetFlashcard();
          alert(`Прогресс заучивания для «${w.word}» успешно обнулен.`);
        });
      }

      // Delete action button inside detail panel
      const delBtn = detailEl.querySelector('.row-del-btn');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          personalDictionary = personalDictionary.filter(x => x.word.toLowerCase() !== w.word.toLowerCase());
          saveDictionaryToStorage();
          const searchInput = document.getElementById('dictSearchInput');
          renderDictWordsList(searchInput ? searchInput.value.trim() : "");
          resetFlashcard();
        });
      }

      wordRow.appendChild(detailEl);
      wordRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // Synchronize hidden flashcard elements
      const transEl = document.getElementById('cardTranslation');
      const contextEl = document.getElementById('cardContext');

      setTrainerCardWord(w.word);
      const cardWordEl = document.getElementById('cardWord');
      if (cardWordEl) cardWordEl.classList.remove('russian-font');
      if (transEl) {
        transEl.textContent = w.translation;
        transEl.classList.add('russian-font');
      }
      if (contextEl) {
        contextEl.innerHTML = `
          <div style="margin-bottom: 8px; font-weight: 500;">${escapeHTML(w.context || "Контекст не указан.")}</div>
          ${examplesHTML}
        `;
      }
      
      activeTrainerWordObj = w;

      // Dynamic translation on demand for top-1000 words without a preloaded translation!
      if (w.translation.includes('нажмите для перевода') || w.translation === 'частотное слово') {
        if (transEl) transEl.textContent = 'Переводим... 🔍';
        fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(w.word)}&langpair=en|ru`)
          .then(res => res.json())
          .then(json => {
            const tr = json.responseData.translatedText;
            if (tr && tr.toLowerCase() !== w.word.toLowerCase()) {
              const RussianTr = tr.toLowerCase();
              w.translation = RussianTr;
              if (activeTrainerWordObj && activeTrainerWordObj.word === w.word) {
                if (transEl) transEl.textContent = RussianTr;
              }
              // Update label inside wordRow
              const subLabel = wordRow.querySelector('.word-row-header div').children[1];
              if (subLabel) {
                subLabel.textContent = RussianTr;
              }
              // If it exists in personalDictionary, save the translation
              const pIdx = personalDictionary.findIndex(x => x.word.toLowerCase() === w.word.toLowerCase());
              if (pIdx !== -1) {
                personalDictionary[pIdx].translation = RussianTr;
                saveDictionaryToStorage();
              }
            } else {
              if (transEl) transEl.textContent = 'Частотное слово';
            }
          })
          .catch(() => {
            if (transEl) transEl.textContent = 'Частотное слово';
          });
      }

      // Highlight active row visually
      const children = listEl.children;
      for (let i = 0; i < children.length; i++) {
        if (children[i] !== wordRow) {
          children[i].style.background = 'rgba(255,255,255,0.03)';
          children[i].style.borderColor = 'rgba(255,255,255,0.06)';
          children[i].isExpanded = false;
          const childDetail = children[i].querySelector('.word-row-detail');
          if (childDetail) childDetail.remove();
        }
      }
    });

    fragment.appendChild(wordRow);
  });

  // Perform a single reflow by appending the entire fragment to listEl
  listEl.appendChild(fragment);
}


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

// Record an activity log entry for the heatmap
function recordActivity(points = 1) {
  try {
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    const activityStr = localStorage.getItem('dictionary_activity') || '{}';
    const activityObj = JSON.parse(activityStr);
    activityObj[today] = (activityObj[today] || 0) + points;
    localStorage.setItem('dictionary_activity', JSON.stringify(activityObj));
    renderHeatmap();
  } catch (e) {
    console.error("Failed to record heatmap activity:", e);
  }
}

// Calculate daily consecutive study streak count
function getDailyStreak() {
  try {
    const activityStr = localStorage.getItem('dictionary_activity') || '{}';
    const activityObj = JSON.parse(activityStr);
    
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (activityObj[dateStr] && activityObj[dateStr] > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (streak === 0) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          if (activityObj[yesterdayStr] && activityObj[yesterdayStr] > 0) {
            checkDate = yesterday;
            continue;
          }
        }
        break;
      }
    }
    return streak;
  } catch (e) {
    return 0;
  }
}

// Render dynamic 28-day Activity Grid Heatmap
function renderHeatmap() {
  const gridEl = document.getElementById('dictHeatmapGrid');
  const streakEl = document.getElementById('dictStreakInfo');
  if (!gridEl) return;

  gridEl.innerHTML = '';
  
  const streakCount = getDailyStreak();
  if (streakEl) {
    streakEl.textContent = `Дней подряд: ${streakCount} ${getStreakWordForm(streakCount)}`;
  }
  
  const activityStr = localStorage.getItem('dictionary_activity') || '{}';
  const activityObj = JSON.parse(activityStr);
  
  const dates = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  
  dates.forEach(date => {
    const dateStr = date.toISOString().split('T')[0];
    const count = activityObj[dateStr] || 0;
    
    let intensity = 0;
    if (count > 0) {
      if (count <= 2) intensity = 1;
      else if (count <= 5) intensity = 2;
      else intensity = 3;
    }
    
    const cell = document.createElement('div');
    cell.className = `heatmap-cell intensity-${intensity}`;
    
    const readableDate = formatDateRu(date);
    cell.setAttribute('data-tooltip', `${readableDate}: ${count} ${getReviewWordForm(count)}`);
    
    gridEl.appendChild(cell);
  });
}

function formatDateRu(date) {
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

function getStreakWordForm(count) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'дней';
  if (lastDigit === 1) return 'день';
  if (lastDigit >= 2 && lastDigit <= 4) return 'дня';
  return 'дней';
}

function getReviewWordForm(count) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'повторений';
  if (lastDigit === 1) return 'повторение';
  if (lastDigit >= 2 && lastDigit <= 4) return 'повторения';
  return 'повторений';
}

function getFilteredDictionaryWords() {
  const filterSelect = document.getElementById('dictCategoryFilter');
  const activeCategory = filterSelect ? filterSelect.value : 'Все слова';

  const customFilterSelect = document.getElementById('dictCustomCategoryFilter');
  const activeCustomCategory = customFilterSelect ? customFilterSelect.value : 'Все категории';
  
  let list = [];
  
  if (activeCategory === 'Все слова') {
    list = personalDictionary;
  } else if (activeCategory.startsWith('«Топ-')) {
    // Essential preloaded packs handling
    let startIdx = 0;
    let endIdx = 0;
    if (activeCategory === '«Топ-300 Первых слов»') {
      startIdx = 0; endIdx = 300;
    } else if (activeCategory === '«Топ-600 Базовых слов»') {
      startIdx = 300; endIdx = 600;
    } else if (activeCategory === '«Топ-1000 Продвинутых слов»') {
      startIdx = 600; endIdx = 1000;
    }
    
    if (window.top1000Words) {
      const slice = window.top1000Words.slice(startIdx, endIdx);
      list = slice.map(word => {
        // Check if user has active Leitner progress for this word
        const existing = personalDictionary.find(w => w.word.toLowerCase() === word.toLowerCase());
        if (existing) {
          return existing;
        }
        // Return default word object with essential flag
        return {
          word: word,
          translation: (window.top1000Translations && window.top1000Translations[word]) || 'Частотное слово (нажмите для перевода)',
          category: activeCategory,
          customCategory: 'Без категории',
          level: 0,
          interval: 0,
          nextReview: Date.now(),
          isEssential: true
        };
      });
    }
  } else {
    // Multi-category support: check if word belongs to the selected folder
    list = personalDictionary.filter(w => {
      const wordCats = w.categories && Array.isArray(w.categories) && w.categories.length > 0
        ? w.categories
        : [w.category || 'Общее'];
      return wordCats.includes(activeCategory);
    });
  }

  // Filter by custom category
  if (activeCustomCategory !== 'Все категории') {
    list = list.filter(w => {
      const wordCustomCats = w.customCategories && Array.isArray(w.customCategories) && w.customCategories.length > 0
        ? w.customCategories
        : [w.customCategory || 'Без категории'];
      return wordCustomCats.includes(activeCustomCategory);
    });
  }

  // Filter by training type when in the Leitner practice session
  const trainingModal = document.getElementById('trainingModal');
  const trainingModalVisible = trainingModal && trainingModal.style.display !== 'none';
  if (trainingModalVisible) {
    const trainingTypeSelect = document.getElementById('trainingTypeSelect');
    if (trainingTypeSelect) {
      const trainingType = trainingTypeSelect.value;
      if (trainingType === 'words') {
        list = list.filter(w => {
          const isPhrase = w.type === 'phrase' || w.word.trim().includes(' ') || w.word.trim().split(/\s+/).filter(Boolean).length > 1;
          return !isPhrase;
        });
      } else if (trainingType === 'phrases') {
        list = list.filter(w => {
          const isPhrase = w.type === 'phrase' || w.word.trim().includes(' ') || w.word.trim().split(/\s+/).filter(Boolean).length > 1;
          return isPhrase;
        });
      }
    }
  }

  return list;
}

// --- Mobile Back Button Support for Modals ---
(function initModalHistoryAPI() {
  document.addEventListener('DOMContentLoaded', () => {
    // Disable in Capacitor/Cordova app to avoid history conflicts with main app router
    // Must check after DOM load so Capacitor bridge is fully injected
    const isMobileApp = !!window.Capacitor || !!window.Cordova || window.location.protocol === 'file:';
    if (isMobileApp) {
      console.log("History API modal helper disabled on mobile app wrapper.");
      return;
    }

    let programmaticBacks = 0;

    window.addEventListener('popstate', (e) => {
      if (programmaticBacks > 0) {
        programmaticBacks--;
        return;
      }
      // Dispatch Escape key to trigger existing hierarchical close logic
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    const modalObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const display = mutation.target.style.display;
          const isVisible = display === 'flex' || display === 'block';
          const wasVisible = mutation.oldValue && (mutation.oldValue.includes('display: flex') || mutation.oldValue.includes('display: block'));
          
          if (isVisible && !wasVisible) {
            // Modal opened
            window.history.pushState({ modalOpen: true, modalId: mutation.target.id }, '');
          } else if (!isVisible && wasVisible) {
            // Modal closed (by direct click, not by popstate)
            if (window.history.state && window.history.state.modalOpen) {
              programmaticBacks++;
              window.history.back();
            }
          }
        }
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modalObserver.observe(modal, { attributes: true, attributeFilter: ['style'], attributeOldValue: true });
    });
  });
})();



