/**
 * @AI-SECTION: NOTEBOOK_NOTES_CONTROLLER
 * @file modules/notebook-module.js
 * @description Extracted Notebook Module (Global & Per-Lesson Video Notes).
 */

/* ==========================================================================
   13. Notebook Module — Global Notes & Per-Lesson Video Notes
   ========================================================================== */

let galaxyLessonNotes = {};
let notebookSaveTimer = null;
let lessonNoteSaveTimer = null;

let customNoteFolders = [];
let currentActiveFolderId = null;
let currentActiveNoteId = null;

function initNotebook() {
  // Load global notes
  try {
    const saved = localStorage.getItem('user_notebook_text');
    const el = document.getElementById('notebookTextarea');
    if (el && saved) el.value = saved;
  } catch (e) { /* ignore */ }

  // Load lesson notes
  try {
    const saved = localStorage.getItem('galaxy_lesson_notes');
    if (saved) galaxyLessonNotes = JSON.parse(saved);
  } catch (e) { galaxyLessonNotes = {}; }

  // Load custom note folders
  try {
    const saved = localStorage.getItem('galaxy_custom_note_folders');
    if (saved) {
      customNoteFolders = JSON.parse(saved);
    } else {
      customNoteFolders = [
        {
          id: 'folder_default',
          name: '📚 My Studies',
          notes: [
            {
              id: 'note_default',
              title: 'First Note',
              content: 'Here you can save your rules, idioms, and any study notes!',
              updatedAt: Date.now()
            }
          ]
        }
      ];
      localStorage.setItem('galaxy_custom_note_folders', JSON.stringify(customNoteFolders));
    }
  } catch (e) {
    customNoteFolders = [];
  }

  const modal      = document.getElementById('notebookModal');
  const openBtn    = document.getElementById('openNotebookBtn');
  const closeBtn   = document.getElementById('closeNotebookBtn');
  const clearBtn   = document.getElementById('notebookClearBtn');
  const textarea   = document.getElementById('notebookTextarea');
  const statusEl   = document.getElementById('notebookSaveStatus');
  const drawerTab  = document.getElementById('notebookDrawerTab');

  if (!modal) return;

  // Mutable ref so closeNotebook (defined earlier) can access functions defined later
  const notebookRefs = { saveCurrentNote: null, customNoteSaveTimer: null };

  const openNotebook = () => {
    openModalEl(modal);
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    setTimeout(() => {
      modal.classList.add('is-open');
      if (drawerTab) drawerTab.classList.add('drawer-open');
    }, 10);
    if (textarea) textarea.focus();
    updateNotebookWordCount();
  };

  const closeNotebook = () => {
    // ── Flush all pending saves immediately before closing ──
    if (notebookSaveTimer) {
      clearTimeout(notebookSaveTimer);
      notebookSaveTimer = null;
      try {
        const ta = document.getElementById('notebookTextarea');
        if (ta) localStorage.setItem('user_notebook_text', ta.value);
      } catch (e) { /* ignore */ }
    }
    if (notebookRefs.customNoteSaveTimer) {
      clearTimeout(notebookRefs.customNoteSaveTimer);
      notebookRefs.customNoteSaveTimer = null;
      if (notebookRefs.saveCurrentNote) notebookRefs.saveCurrentNote();
    }
    if (typeof lessonNoteSaveTimer !== 'undefined' && lessonNoteSaveTimer) {
      clearTimeout(lessonNoteSaveTimer);
      lessonNoteSaveTimer = null;
      const activeLessonTa = document.getElementById('activeLessonNoteTextarea');
      if (activeLessonTa && typeof galaxyActiveVideoId !== 'undefined' && galaxyActiveVideoId) {
        galaxyLessonNotes[galaxyActiveVideoId] = activeLessonTa.value;
        try { localStorage.setItem('galaxy_lesson_notes', JSON.stringify(galaxyLessonNotes)); } catch(e){}
      }
    }

    modal.classList.remove('is-open');
    if (drawerTab) drawerTab.classList.remove('drawer-open');
    setTimeout(() => {
      if (!modal.classList.contains('is-open')) {
        modal.style.display = 'none';
        
        // Disable scroll lock only if no other major modal is open
        const rulesModal = document.getElementById('rulesModal');
        const rulesVisible = rulesModal && rulesModal.style.display === 'flex';
        const videoCourseModal = document.getElementById('videoCourseModal');
        const videoCourseVisible = videoCourseModal && videoCourseModal.style.display === 'flex';
        const dictionaryModal = document.getElementById('dictionaryModal');
        const dictionaryVisible = dictionaryModal && dictionaryModal.style.display === 'flex';
        const addWordModal = document.getElementById('addWordModal');
        const addWordVisible = addWordModal && addWordModal.style.display === 'flex';
        const addPhraseModal = document.getElementById('addPhraseModal');
        const addPhraseVisible = addPhraseModal && addPhraseModal.style.display === 'flex';
        
        if (!rulesVisible && !videoCourseVisible && !dictionaryVisible && !addWordVisible && !addPhraseVisible) {
          document.documentElement.classList.remove('modal-open');
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
        }
      }
    }, 380);
  };

  window.openNotebook = openNotebook;
  window.closeNotebook = closeNotebook;
  window.toggleNotebook = () => {
    if (modal.classList.contains('is-open')) {
      closeNotebook();
    } else {
      openNotebook();
    }
  };

  if (openBtn)  openBtn.onclick  = openNotebook;
  if (closeBtn) closeBtn.onclick = closeNotebook;

  if (drawerTab) {
    drawerTab.onclick = (e) => {
      e.stopPropagation();
      if (modal.classList.contains('is-open')) {
        closeNotebook();
      } else {
        openNotebook();
      }
    };
  }

  // Backdrop click intentionally disabled — use the close/tab button to dismiss



  // Auto-save on typing
  if (textarea) {
    textarea.addEventListener('input', () => {
      updateNotebookWordCount();
      if (statusEl) {
        statusEl.textContent = '\u270f\ufe0f Saving...';
        statusEl.className = 'notebook-status saving';
      }
      clearTimeout(notebookSaveTimer);
      notebookSaveTimer = setTimeout(() => {
        try {
          localStorage.setItem('user_notebook_text', textarea.value);
          if (statusEl) {
            statusEl.textContent = '\u2713 Saved';
            statusEl.className = 'notebook-status';
          }
        } catch (e) { /* ignore */ }
        notebookSaveTimer = null;
      }, 300); // 300ms — faster than 600ms to reduce loss window
    });
  }

  // ── Flush all notebook saves when the page is closed / hidden ──────────
  function flushAllNotebookSaves() {
    // 1. General textarea
    if (notebookSaveTimer) {
      clearTimeout(notebookSaveTimer);
      notebookSaveTimer = null;
      try {
        const ta = document.getElementById('notebookTextarea');
        if (ta) localStorage.setItem('user_notebook_text', ta.value);
      } catch (e) {}
    }
    // 2. Custom note editor
    if (notebookRefs.customNoteSaveTimer) {
      clearTimeout(notebookRefs.customNoteSaveTimer);
      notebookRefs.customNoteSaveTimer = null;
      if (notebookRefs.saveCurrentNote) notebookRefs.saveCurrentNote();
    }
    // 3. Lesson note
    if (lessonNoteSaveTimer) {
      clearTimeout(lessonNoteSaveTimer);
      lessonNoteSaveTimer = null;
      const activeLessonTa = document.getElementById('activeLessonNoteTextarea');
      if (activeLessonTa && typeof galaxyActiveVideoId !== 'undefined' && galaxyActiveVideoId) {
        galaxyLessonNotes[galaxyActiveVideoId] = activeLessonTa.value;
        try { localStorage.setItem('galaxy_lesson_notes', JSON.stringify(galaxyLessonNotes)); } catch(e) {}
      }
    }
  }

  // Fire on tab/window close or page hide (mobile background)
  window.addEventListener('beforeunload', flushAllNotebookSaves);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAllNotebookSaves();
  });
  window.addEventListener('pagehide', flushAllNotebookSaves);

  // Clear button — clears active tab content
  if (clearBtn) {
    clearBtn.onclick = async () => {
      const activeTab = document.querySelector('.notebook-tab.active');
      const isLessons = activeTab && activeTab.dataset.tab === 'lessons';
      if (isLessons) {
        const confirmed = await window.showCustomConfirm(
          '🗑️ Очистка заметок',
          'Удалить все заметки к видеоурокам? Это действие нельзя отменить.',
          { okText: 'Удалить все', cancelText: 'Отмена', isDestructive: true }
        );
        if (!confirmed) return;
        
        galaxyLessonNotes = {};
        localStorage.removeItem('galaxy_lesson_notes');
        renderNotebookLessonsTab();
        renderVideoLessons();
        const ta = document.getElementById('activeLessonNoteTextarea');
        if (ta) ta.value = '';
        if (window.showToast) window.showToast('Все заметки к видео удалены');
      } else {
        if (!textarea || !textarea.value.trim()) return;
        const confirmed = await window.showCustomConfirm(
          '🗑️ Очистка блокнота',
          'Очистить весь блокнот? Это действие нельзя отменить.',
          { okText: 'Очистить', cancelText: 'Отмена', isDestructive: true }
        );
        if (!confirmed) return;
        
        textarea.value = '';
        localStorage.removeItem('user_notebook_text');
        updateNotebookWordCount();
        if (statusEl) { statusEl.textContent = '\u2713 Cleared'; statusEl.className = 'notebook-status'; }
        if (window.showToast) window.showToast('Блокнот очищен');
      }
    };
  }


  // ── General notes transliteration button ──────────────────────────────────
  const generalTranslitBtn = document.getElementById('notebookGeneralTranslitBtn');
  if (generalTranslitBtn && textarea) {
    generalTranslitBtn.addEventListener('click', () => {
      if (!textarea.value) return;

      // Auto-detect: which script dominates?
      const cyrCount = (textarea.value.match(/[\u0430-\u044f\u0451\u0410-\u042f\u0401]/g) || []).length;
      const latCount = (textarea.value.match(/[a-zA-Z]/g) || []).length;
      const direction = cyrCount >= latCount ? 'cyrToLat' : 'latToCyr';
      const rawMap = direction === 'cyrToLat' ? CYR_TO_LAT_MAP : LAT_TO_CYR_MAP;

      // Ambiguous punctuation chars: exist in layout maps (.→ю, ,→б, ;→ж etc.)
      // Convert them ONLY if adjacent to a letter that also needs conversion
      // (= layout error context). Otherwise keep as real punctuation.
      const AMBIG_PUNCT = new Set(['.', ',', ';', "'", '[', ']', '{', '}', '<', '>']);
      const isConvertibleLetter = (ch) => ch && !AMBIG_PUNCT.has(ch) && rawMap[ch] !== undefined;
      const safeConvert = (ch, i, arr) => {
        if (rawMap[ch] === undefined) return ch; // not in map
        if (!AMBIG_PUNCT.has(ch)) return rawMap[ch]; // regular letter — always convert
        // Ambiguous punctuation: convert only if a neighboring char is a convertible letter
        if (isConvertibleLetter(arr[i - 1]) || isConvertibleLetter(arr[i + 1])) return rawMap[ch];
        return ch; // real punctuation — keep
      };

      textarea.value = textarea.value.split('').map(safeConvert).join('');

      // Save immediately
      try { localStorage.setItem('user_notebook_text', textarea.value); } catch(e) {}
      if (statusEl) { statusEl.textContent = '✓ Saved'; statusEl.className = 'notebook-status'; }

      // Visual feedback
      const origHTML = generalTranslitBtn.innerHTML;
      generalTranslitBtn.innerHTML = '✅ Done!';
      generalTranslitBtn.style.background = 'rgba(16,185,129,0.2)';
      generalTranslitBtn.style.borderColor = 'rgba(16,185,129,0.5)';
      generalTranslitBtn.style.color = '#6ee7b7';
      setTimeout(() => {
        generalTranslitBtn.innerHTML = origHTML;
        generalTranslitBtn.style.background = 'rgba(99,102,241,0.15)';
        generalTranslitBtn.style.borderColor = 'rgba(99,102,241,0.35)';
        generalTranslitBtn.style.color = '#a5b4fc';
      }, 1400);
    });
  }

  // Tab switching
  const tabBtns = document.querySelectorAll('.notebook-tab');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      const genEl  = document.getElementById('notebookTabContentGeneral');
      const lesEl  = document.getElementById('notebookTabContentLessons');
      const cusEl  = document.getElementById('notebookTabContentCustom');
      if (genEl) genEl.style.display = tab === 'general'  ? 'flex' : 'none';
      if (lesEl) lesEl.style.display = tab === 'lessons'  ? 'flex' : 'none';
      if (cusEl) cusEl.style.display = tab === 'custom'   ? 'flex' : 'none';
      if (tab === 'lessons') renderNotebookLessonsTab();
      if (tab === 'custom') {
        const inp = document.getElementById('notebookNotesSearchInput');
        if (inp) inp.value = '';
        currentActiveFolderId = null;
        showCustomFoldersView();
      }
    });
  });

  // Init the per-lesson textarea listener
  initLessonNoteTextarea();

  // --- CUSTOM FOLDERS NOTES IMPLEMENTATION ---
  const foldersView = document.getElementById('notebookCustomFoldersView');
  const notesListView = document.getElementById('notebookCustomNotesListView');
  const noteEditorView = document.getElementById('notebookNoteEditorView');
  const searchResultsView = document.getElementById('notebookCustomSearchResultsView');
  const searchResultsListContainer = document.getElementById('notebookSearchResultsListContainer');
  
  const searchContainer = document.getElementById('notebookNotesSearchContainer');
  const searchInput = document.getElementById('notebookNotesSearchInput');
  
  const noteTitleInput = document.getElementById('notebookNoteTitleInput');
  const noteContentInput = document.getElementById('notebookNoteContentInput');

  function showCustomFoldersView() {
    if (searchContainer) searchContainer.style.display = 'flex';
    if (foldersView) foldersView.style.display = 'flex';
    if (notesListView) notesListView.style.display = 'none';
    if (searchResultsView) searchResultsView.style.display = 'none';
    if (noteEditorView) noteEditorView.style.display = 'none';
    
    // Clear search query visually but preserve input if needed
    renderCustomFolders();
  }

  function showCustomNotesListView(folderId) {
    currentActiveFolderId = folderId;
    if (searchContainer) searchContainer.style.display = 'flex';
    if (foldersView) foldersView.style.display = 'none';
    if (notesListView) notesListView.style.display = 'flex';
    if (searchResultsView) searchResultsView.style.display = 'none';
    if (noteEditorView) noteEditorView.style.display = 'none';
    renderCustomNotes(folderId);
  }

  function showNoteEditorView(folderId, noteId) {
    currentActiveFolderId = folderId;
    currentActiveNoteId = noteId;
    if (searchContainer) searchContainer.style.display = 'none';
    if (foldersView) foldersView.style.display = 'none';
    if (notesListView) notesListView.style.display = 'none';
    if (searchResultsView) searchResultsView.style.display = 'none';
    if (noteEditorView) noteEditorView.style.display = 'flex';
    
    // Populate editor fields
    const folder = customNoteFolders.find(f => f.id === folderId);
    if (folder) {
      const note = folder.notes.find(n => n.id === noteId);
      if (note) {
        if (noteTitleInput) noteTitleInput.value = note.title || '';
        if (noteContentInput) noteContentInput.value = note.content || '';
      }
    }
  }

  function renderSearchResults(query) {
    if (!searchResultsListContainer) return;
    searchResultsListContainer.innerHTML = '';

    const searchTerm = query.trim().toLowerCase();
    if (!searchTerm) {
      if (currentActiveFolderId) {
        showCustomNotesListView(currentActiveFolderId);
      } else {
        showCustomFoldersView();
      }
      return;
    }

    const matches = [];
    customNoteFolders.forEach(folder => {
      if (folder.notes) {
        folder.notes.forEach(note => {
          const titleMatch = (note.title || '').toLowerCase().includes(searchTerm);
          const contentMatch = (note.content || '').toLowerCase().includes(searchTerm);
          if (titleMatch || contentMatch) {
            matches.push({
              folderId: folder.id,
              folderName: folder.name,
              note: note
            });
          }
        });
      }
    });

    if (matches.length === 0) {
      searchResultsListContainer.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; color: var(--text-sub);">
          <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">🔍</span>
          <p style="font-size: 0.82rem; font-weight: 600; margin: 0;">Nothing found</p>
          <p style="font-size: 0.72rem; margin: 4px 0 0 0;">Try different words or check for typos.</p>
        </div>
      `;
      return;
    }

    matches.forEach(match => {
      const item = document.createElement('div');
      item.style.cssText = 'display: flex; flex-direction: column; gap: 4px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 12px; padding: 10px 14px; cursor: pointer; transition: all 0.2s; text-align: left;';
      
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(255,255,255,0.06)';
        item.style.borderColor = 'var(--border-glass-hover)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'rgba(255,255,255,0.03)';
        item.style.borderColor = 'var(--border-glass)';
      });

      item.addEventListener('click', () => {
        showNoteEditorView(match.folderId, match.note.id);
      });

      const cleanSnippet = match.note.content ? match.note.content.substring(0, 45) + (match.note.content.length > 45 ? '...' : '') : 'No text';
      const formattedDate = new Date(match.note.updatedAt || Date.now()).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; width: 100%;">
          <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 65%;">${escapeHTML(match.note.title || 'Untitled')}</span>
          <span style="font-size: 0.65rem; color: #fbbf24; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 32%; background: rgba(251,191,36,0.1); padding: 2px 6px; border-radius: 6px; text-align: right;">📁 ${escapeHTML(match.folderName)}</span>
        </div>
        <span style="font-size: 0.75rem; color: var(--text-sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(cleanSnippet)}</span>
        <span style="font-size: 0.65rem; color: var(--text-muted); align-self: flex-end; margin-top: 4px;">${formattedDate}</span>
      `;

      searchResultsListContainer.appendChild(item);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const val = searchInput.value.trim();
      if (val) {
        if (foldersView) foldersView.style.display = 'none';
        if (notesListView) notesListView.style.display = 'none';
        if (searchResultsView) searchResultsView.style.display = 'flex';
        if (noteEditorView) noteEditorView.style.display = 'none';
        renderSearchResults(val);
      } else {
        if (currentActiveFolderId) {
          showCustomNotesListView(currentActiveFolderId);
        } else {
          showCustomFoldersView();
        }
      }
    });
  }

  function saveCurrentNote() {
    if (!currentActiveFolderId || !currentActiveNoteId) return;
    const folder = customNoteFolders.find(f => f.id === currentActiveFolderId);
    if (folder) {
      const note = folder.notes.find(n => n.id === currentActiveNoteId);
      if (note) {
        note.title = noteTitleInput ? noteTitleInput.value.trim() || 'Untitled' : 'Untitled';
        note.content = noteContentInput ? noteContentInput.value : '';
        note.updatedAt = Date.now();
        saveCustomNoteFolders();
      }
    }
  }
  // Register ref so closeNotebook can access it
  notebookRefs.saveCurrentNote = saveCurrentNote;

  let customNoteSaveTimer = null;
  const triggerCustomNoteSave = () => {
    if (statusEl) {
      statusEl.textContent = '✏️ Saving...';
      statusEl.className = 'notebook-status saving';
    }
    clearTimeout(customNoteSaveTimer);
    customNoteSaveTimer = setTimeout(() => {
      saveCurrentNote();
      notebookRefs.customNoteSaveTimer = null;
      if (statusEl) {
        statusEl.textContent = '✓ Saved';
        statusEl.className = 'notebook-status';
      }
    }, 600);
    notebookRefs.customNoteSaveTimer = customNoteSaveTimer;
  };

  if (noteTitleInput) {
    noteTitleInput.addEventListener('input', triggerCustomNoteSave);
  }
  if (noteContentInput) {
    noteContentInput.addEventListener('input', triggerCustomNoteSave);
  }

  const backToFoldersBtn = document.getElementById('notebookBackToFoldersBtn');
  if (backToFoldersBtn) {
    backToFoldersBtn.addEventListener('click', () => {
      saveCurrentNote(); // ← Save before navigating away!
      showCustomFoldersView();
    });
  }

  const backToNotesBtn = document.getElementById('notebookBackToNotesBtn');
  if (backToNotesBtn) {
    backToNotesBtn.addEventListener('click', () => {
      saveCurrentNote();
      const val = searchInput ? searchInput.value.trim() : '';
      if (val) {
        if (searchContainer) searchContainer.style.display = 'flex';
        if (foldersView) foldersView.style.display = 'none';
        if (notesListView) notesListView.style.display = 'none';
        if (searchResultsView) searchResultsView.style.display = 'flex';
        if (noteEditorView) noteEditorView.style.display = 'none';
        renderSearchResults(val);
      } else {
        showCustomNotesListView(currentActiveFolderId);
      }
    });
  }

  const deleteNoteBtn = document.getElementById('notebookDeleteNoteBtn');
  if (deleteNoteBtn) {
    deleteNoteBtn.addEventListener('click', () => {
      if (!currentActiveFolderId || !currentActiveNoteId) return;
      const folder = customNoteFolders.find(f => f.id === currentActiveFolderId);
      if (folder) {
        const note = folder.notes.find(n => n.id === currentActiveNoteId);
        const title = note ? note.title : 'this note';
        if (confirm(`Are you sure you want to delete ${title}?`)) {
          folder.notes = folder.notes.filter(n => n.id !== currentActiveNoteId);
          saveCustomNoteFolders();
          showCustomNotesListView(currentActiveFolderId);
        }
      }
    });
  }


  // ── Folder note transliteration button ────────────────────────────────────
  // Converts the entire note (title + content) between Cyrillic and Latin layouts.
  // Auto-detects direction based on which script dominates the text.
  const notebookTranslitBtn = document.getElementById('notebookTranslitBtn');
  if (notebookTranslitBtn) {
    notebookTranslitBtn.addEventListener('click', () => {
      const titleEl   = document.getElementById('notebookNoteTitleInput');
      const contentEl = document.getElementById('notebookNoteContentInput');

      const combined = (titleEl?.value || '') + ' ' + (contentEl?.value || '');
      if (!combined.trim()) return;

      const cyrCount = (combined.match(/[\u0430-\u044f\u0451\u0410-\u042f\u0401]/g) || []).length;
      const latCount = (combined.match(/[a-zA-Z]/g) || []).length;

      // If more Cyrillic chars → convert Cyr→Lat, otherwise Lat→Cyr
      const direction = cyrCount >= latCount ? 'cyrToLat' : 'latToCyr';
      const rawMap = direction === 'cyrToLat' ? CYR_TO_LAT_MAP : LAT_TO_CYR_MAP;

      // Ambiguous punctuation: convert only if adjacent to a convertible letter
      const AMBIG_PUNCT = new Set(['.', ',', ';', "'", '[', ']', '{', '}', '<', '>']);
      const isConvertibleLetter = (ch) => ch && !AMBIG_PUNCT.has(ch) && rawMap[ch] !== undefined;
      const safeConvert = (ch, i, arr) => {
        if (rawMap[ch] === undefined) return ch;
        if (!AMBIG_PUNCT.has(ch)) return rawMap[ch];
        if (isConvertibleLetter(arr[i - 1]) || isConvertibleLetter(arr[i + 1])) return rawMap[ch];
        return ch;
      };

      const convertText = (text) => text.split('').map(safeConvert).join('');

      if (titleEl && titleEl.value) {
        titleEl.value = convertText(titleEl.value);
      }
      if (contentEl && contentEl.value) {
        contentEl.value = convertText(contentEl.value);
      }

      // Persist immediately
      if (currentActiveFolderId && currentActiveNoteId) {
        const folder = customNoteFolders.find(f => f.id === currentActiveFolderId);
        if (folder) {
          const note = folder.notes.find(n => n.id === currentActiveNoteId);
          if (note) {
            if (titleEl)   note.title   = titleEl.value;
            if (contentEl) note.content = contentEl.value;
            saveCustomNoteFolders();
          }
        }
      }

      // Visual feedback on the button
      const origText = notebookTranslitBtn.innerHTML;
      const origBg   = notebookTranslitBtn.style.background;
      notebookTranslitBtn.innerHTML = '<span style="font-size:0.85rem">✅</span> Done!';
      notebookTranslitBtn.style.background  = 'rgba(16,185,129,0.2)';
      notebookTranslitBtn.style.borderColor = 'rgba(16,185,129,0.5)';
      notebookTranslitBtn.style.color       = '#6ee7b7';
      setTimeout(() => {
        notebookTranslitBtn.innerHTML        = origText;
        notebookTranslitBtn.style.background = origBg;
        notebookTranslitBtn.style.borderColor = 'rgba(99,102,241,0.35)';
        notebookTranslitBtn.style.color      = '#a5b4fc';
      }, 1400);
    });
  }

  const createFolderBtn = document.getElementById('notebookCreateFolderBtn');
  if (createFolderBtn) {
    createFolderBtn.addEventListener('click', async () => {
      const name = await (window.showCustomPrompt ? window.showCustomPrompt('📁 New Notebook Folder', 'Enter a name for the new folder:', 'e.g. Grammar Notes') : prompt('Enter a name for the new folder:'));
      if (name && name.trim()) {
        const newFolder = {
          id: 'folder_' + Date.now(),
          name: name.trim(),
          notes: []
        };
        customNoteFolders.push(newFolder);
        saveCustomNoteFolders();
        renderCustomFolders();
        if (window.showToast) window.showToast(`Folder "${name.trim()}" created!`, "success");
      }
    });
  }

  const createNoteBtn = document.getElementById('notebookCreateNoteBtn');
  if (createNoteBtn) {
    createNoteBtn.addEventListener('click', () => {
      if (!currentActiveFolderId) return;
      const folder = customNoteFolders.find(f => f.id === currentActiveFolderId);
      if (folder) {
        const newNote = {
          id: 'note_' + Date.now(),
          title: 'New Note',
          content: '',
          updatedAt: Date.now()
        };
        folder.notes.unshift(newNote);
        saveCustomNoteFolders();
        showNoteEditorView(currentActiveFolderId, newNote.id);
      }
    });
  }

  function saveCustomNoteFolders() {
    try {
      localStorage.setItem('galaxy_custom_note_folders', JSON.stringify(customNoteFolders));
    } catch (e) {
      console.error(e);
    }
  }

  function renderCustomFolders() {
    const container = document.getElementById('notebookFoldersListContainer');
    if (!container) return;
    container.innerHTML = '';

    if (customNoteFolders.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; color: var(--text-sub);">
          <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">📁</span>
          <p style="font-size: 0.82rem; font-weight: 600; margin: 0;">You have no folders yet</p>
          <p style="font-size: 0.72rem; margin: 4px 0 0 0;">Click "➕ Folder" in the top right!</p>
        </div>
      `;
      return;
    }

    customNoteFolders.forEach(folder => {
      const item = document.createElement('div');
      item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 12px; padding: 10px 14px; cursor: pointer; transition: all 0.2s;';
      
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(255,255,255,0.06)';
        item.style.borderColor = 'var(--border-glass-hover)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'rgba(255,255,255,0.03)';
        item.style.borderColor = 'var(--border-glass)';
      });

      item.addEventListener('click', (e) => {
        if (e.target.closest('.delete-folder-btn')) return;
        showCustomNotesListView(folder.id);
      });

      const noteCount = folder.notes ? folder.notes.length : 0;
      const noteWord = noteCount === 1 ? 'note' : 'notes';

      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; max-width: 80%;">
          <span style="font-size: 1.3rem;">📁</span>
          <div style="display: flex; flex-direction: column; overflow: hidden; text-align: left;">
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(folder.name)}</span>
            <span style="font-size: 0.7rem; color: var(--text-sub);">${noteCount} ${noteWord}</span>
          </div>
        </div>
        <button class="delete-folder-btn" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; font-size: 0.8rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Delete folder">
          🗑️
        </button>
      `;

      const delBtn = item.querySelector('.delete-folder-btn');
      if (delBtn) {
        delBtn.addEventListener('mouseenter', () => delBtn.style.color = '#ef4444');
        delBtn.addEventListener('mouseleave', () => delBtn.style.color = 'var(--text-muted)');
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`Are you sure you want to delete the folder "${folder.name}" and all its notes?`)) {
            customNoteFolders = customNoteFolders.filter(f => f.id !== folder.id);
            saveCustomNoteFolders();
            renderCustomFolders();
          }
        });
      }

      container.appendChild(item);
    });
  }

  function renderCustomNotes(folderId) {
    const container = document.getElementById('notebookNotesListContainer');
    if (!container) return;
    container.innerHTML = '';

    const folder = customNoteFolders.find(f => f.id === folderId);
    if (!folder) return;

    const folderNameEl = document.getElementById('notebookCurrentFolderName');
    if (folderNameEl) folderNameEl.textContent = folder.name;

    if (!folder.notes || folder.notes.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; color: var(--text-sub);">
          <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">📝</span>
          <p style="font-size: 0.82rem; font-weight: 600; margin: 0;">This folder is empty</p>
          <p style="font-size: 0.72rem; margin: 4px 0 0 0;">Click "➕ Note" in the top right!</p>
        </div>
      `;
      return;
    }

    folder.notes.forEach(note => {
      const item = document.createElement('div');
      item.style.cssText = 'display: flex; flex-direction: column; gap: 4px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 12px; padding: 10px 14px; cursor: pointer; transition: all 0.2s; text-align: left;';
      
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(255,255,255,0.06)';
        item.style.borderColor = 'var(--border-glass-hover)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'rgba(255,255,255,0.03)';
        item.style.borderColor = 'var(--border-glass)';
      });

      item.addEventListener('click', () => {
        showNoteEditorView(folderId, note.id);
      });

      const cleanSnippet = note.content ? note.content.substring(0, 45) + (note.content.length > 45 ? '...' : '') : 'No text';
      const formattedDate = new Date(note.updatedAt || Date.now()).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      item.innerHTML = `
        <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(note.title || 'Untitled')}</span>
        <span style="font-size: 0.75rem; color: var(--text-sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(cleanSnippet)}</span>
        <span style="font-size: 0.65rem; color: var(--text-muted); align-self: flex-end; margin-top: 4px;">${formattedDate}</span>
      `;

      container.appendChild(item);
    });
  }

  updateNotebookWordCount();
}

function updateNotebookWordCount() {
  const textarea = document.getElementById('notebookTextarea');
  const el = document.getElementById('notebookWordCount');
  if (!el || !textarea) return;
  el.textContent = `${textarea.value.length} characters`;
}

function renderNotebookLessonsTab() {
  const container = document.getElementById('notebookLessonsList');
  if (!container) return;

  const entries = Object.entries(galaxyLessonNotes).filter(([, text]) => text && text.trim());

  if (entries.length === 0) {
    container.innerHTML = `
      <div class="notebook-empty-state">
        <span>\ud83d\udcdd</span>
        <strong>No lesson notes yet</strong>
        <span>Open the video course, select a lesson, and write a note in the field below the player.</span>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();
  entries.forEach(([videoId, noteText]) => {
    const video = GALAXY_COURSE_VIDEOS.find(v => v.id === videoId);
    if (!video) return;

    const entry = document.createElement('div');
    entry.className = 'notebook-lesson-entry';
    entry.innerHTML = `
      <div class="notebook-lesson-entry-header">
        <span class="notebook-lesson-badge">${video.num <= 4 ? 'Lesson' : 'Lesson'} ${video.num}</span>
        <span class="notebook-lesson-title">${escapeHTML(video.shortTitle)}</span>
        <button class="notebook-lesson-delete-btn" title="Delete note" data-id="${videoId}">\ud83d\uddd1</button>
      </div>
      <textarea class="notebook-lesson-note-textarea" data-id="${videoId}" placeholder="Write a note for this lesson...">${escapeHTML(noteText)}</textarea>
    `;

    const delBtn = entry.querySelector('.notebook-lesson-delete-btn');
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      delete galaxyLessonNotes[videoId];
      saveGalaxyLessonNotes();
      renderNotebookLessonsTab();
      renderVideoLessons();
      if (galaxyActiveVideoId === videoId) {
        const ta = document.getElementById('activeLessonNoteTextarea');
        if (ta) ta.value = '';
      }
    });

    const taInput = entry.querySelector('.notebook-lesson-note-textarea');
    let sidebarSaveTimer = null;
    taInput.addEventListener('input', () => {
      clearTimeout(sidebarSaveTimer);
      sidebarSaveTimer = setTimeout(() => {
        const text = taInput.value;
        if (text.trim()) {
          galaxyLessonNotes[videoId] = text;
        } else {
          delete galaxyLessonNotes[videoId];
        }
        saveGalaxyLessonNotes();
        
        // Sync with player's active note textarea if it is the same video
        const activeTa = document.getElementById('activeLessonNoteTextarea');
        if (activeTa && galaxyActiveVideoId === videoId) {
          activeTa.value = text;
        }
        
        // Refresh note indicators in lesson cards
        renderVideoLessons();
      }, 500);
    });

    taInput.addEventListener('blur', () => {
      if (!taInput.value.trim()) {
        delete galaxyLessonNotes[videoId];
        saveGalaxyLessonNotes();
        renderNotebookLessonsTab();
        renderVideoLessons();
      }
    });

    fragment.appendChild(entry);
  });

  container.innerHTML = '';
  container.appendChild(fragment);
}

function saveGalaxyLessonNotes() {
  try {
    localStorage.setItem('galaxy_lesson_notes', JSON.stringify(galaxyLessonNotes));
  } catch (e) { /* ignore */ }
}

function initLessonNoteTextarea() {
  const ta = document.getElementById('activeLessonNoteTextarea');
  const statusEl = document.getElementById('lessonNoteSaveStatus');
  if (!ta) return;

  ta.addEventListener('input', () => {
    if (statusEl) {
      statusEl.textContent = '\u270f\ufe0f Saving...';
      statusEl.className = 'lesson-note-save-status';
    }
    clearTimeout(lessonNoteSaveTimer);
    lessonNoteSaveTimer = setTimeout(() => {
      if (!galaxyActiveVideoId) return;
      const text = ta.value.trim();
      if (text) {
        galaxyLessonNotes[galaxyActiveVideoId] = ta.value;
      } else {
        delete galaxyLessonNotes[galaxyActiveVideoId];
      }
      saveGalaxyLessonNotes();
      renderVideoLessons(); // refresh note dots
      if (statusEl) {
        statusEl.textContent = '\ud83d\udcbe Saved';
        statusEl.className = 'lesson-note-save-status saved';
        setTimeout(() => {
          if (statusEl) {
            statusEl.textContent = '\ud83d\udcbe Auto-save';
            statusEl.className = 'lesson-note-save-status';
          }
        }, 2000);
      }
    }, 700);
  });
}


// --- ЛОГИКА ДОБАВЛЕНИЯ НОВЫХ ФРАЗ ---
// (Теперь обработка добавления фраз вынесена в setupDictionaryUI() для корректной интеграции с модальным окном)

/* ==========================================================================
   Line Numbers for Editors
   ========================================================================== */
function setupEditorLineNumbers() {
    const textareas = document.querySelectorAll('.editor-textarea');
    textareas.forEach(ta => {
        const lineNumbersDiv = document.getElementById('lineNumbers_' + ta.id);
        if (!lineNumbersDiv) return;

        function updateLineNumbers() {
            const lines = ta.value.split('\n').length;
            let numbersHtml = '';
            for (let i = 1; i <= lines; i++) {
                numbersHtml += i + '<br>';
            }
            lineNumbersDiv.innerHTML = numbersHtml;
        }

        // Sync scrolling
        ta.addEventListener('scroll', () => {
            lineNumbersDiv.scrollTop = ta.scrollTop;
        });

        // Update on input
        ta.addEventListener('input', updateLineNumbers);

        // Initial update
        updateLineNumbers();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure everything is rendered
    setTimeout(setupEditorLineNumbers, 300);
});
