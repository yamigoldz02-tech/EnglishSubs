export function openEditWordModal(w, onSaveSuccess) {
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
    if (saveBtn) { saveBtn.textContent = '💾 Save Changes'; saveBtn.style.background = 'linear-gradient(135deg, #a78bfa, #7c3aed)'; saveBtn.disabled = false; }
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
          if (engInput) { flashField(engInput); const orig = engInput.placeholder; engInput.placeholder = `⚠ "${newEng}" is already in the dictionary`; setTimeout(() => { engInput.placeholder = orig; }, 2200); }
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

      saveBtn.textContent = `✅ ${newEng.slice(0, 20)} saved!`;
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
  
  // NOTE: history.pushState is handled by the MutationObserver in initModalHistoryAPI()
  // to avoid double-push causing stray popstate events
  
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');
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
      const anyOpen = Array.from(document.querySelectorAll('.modal-overlay')).some(
        m => m !== el && m.style.display && m.style.display !== 'none'
      );
      if (!anyOpen) {
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        // NOTE: history.back() is handled by the MutationObserver in initModalHistoryAPI()
        // to avoid double-back causing stray popstate events that hide close buttons
      }
    }
  }, 200);
}

// Intercept popstate to close modals if the user swipes back on mobile
window.addEventListener('popstate', (e) => {
  if (!window.location.hash.includes('modal')) {
    // Only target actual modal overlays, NOT inner cards/containers that happen to have "Modal" in their ID
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(m => {
      if (m.style.display !== 'none' && m.style.display !== '') {
        const closeBtn = m.querySelector('.modal-close-btn, .close-modal, .close-btn, .close-lightbox');
        if (closeBtn) closeBtn.click();
        else closeModalEl(m);
      }
    });
  }
});

// 1. Fully detailed Song Dataset (Spotify-ready)

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

// Backward compatibility
window.openEditWordModal = openEditWordModal;