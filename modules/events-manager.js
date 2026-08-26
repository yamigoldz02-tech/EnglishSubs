// @ts-check
// @AI-SECTION: EVENTS_MANAGER
/// <reference path="./types.js" />
// UI Event Listeners Manager
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

  // Dictionary FAB (+) Direct Open Unified Add Modal
  const dictFabToggleBtn = document.getElementById('dictFabToggleBtn');
  if (dictFabToggleBtn) {
    dictFabToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const addWordModal = document.getElementById('addWordModal');
      if (addWordModal && typeof window.openModalEl === 'function') {
        if (typeof window.populateCategorySelectors === 'function') {
          window.populateCategorySelectors();
        }
        window.openModalEl(addWordModal);
        const inputEngEl = document.getElementById('manualWordEng');
        if (inputEngEl) setTimeout(() => inputEngEl.focus(), 120);
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

  // Dashboard Hero Action buttons
  const heroStartBtn = document.getElementById('heroStartFirstSongBtn');
  if (heroStartBtn) {
    heroStartBtn.addEventListener('click', () => {
      pickSongFromSearch({id: 'scorpions', title: 'Wind of Change', artist: 'Scorpions', genre: 'Classic Rock', art: 'SC'});
    });
  }

  const heroCourseBtn = document.getElementById('heroOpenCourseBtn');
  if (heroCourseBtn) {
    heroCourseBtn.addEventListener('click', () => {
      const openVideoCourseBtn = document.getElementById('openVideoCourseBtn');
      if (openVideoCourseBtn) openVideoCourseBtn.click();
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
        if (typeof window.DailyTracker !== 'undefined' && window.DailyTracker.recordShadowingPractice) {
          window.DailyTracker.recordShadowingPractice(activeDictationOriginal, (typeof currentSongKey !== 'undefined' ? currentSongKey : 'Аудио-фраза'), true);
        }
        feedbackEl.style.display = 'block';
        feedbackEl.style.background = 'rgba(16, 185, 129, 0.15)';
        feedbackEl.style.border = '1px solid rgba(16, 185, 129, 0.3)';
        feedbackEl.style.color = '#10b981';
        feedbackEl.innerHTML = `🎉 Excellent! You heard and wrote the phrase perfectly! It's been added to your activity score.`;
      } else {
        feedbackEl.style.display = 'block';
        feedbackEl.style.background = 'rgba(239, 68, 68, 0.15)';
        feedbackEl.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        feedbackEl.style.color = '#ef4444';
        feedbackEl.innerHTML = `❌ Unfortunately, there are some mistakes. Try again!<br><span style="display:inline-block; margin-top:0.4rem; font-size:0.9rem; opacity:0.85; color:var(--text-main);">Correct answer: <strong style="color:var(--accent-spotify);">${activeDictationOriginal}</strong></span>`;
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
        favoriteToggleBtn.title = 'Remove from favorites';
      } else {
        favoriteToggleBtn.classList.remove('active');
        favoriteToggleBtn.title = 'Add to favorites';
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
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const scrimOverlay = document.getElementById('scrimOverlay');
  if (closeSidebarBtn && typeof closeSidebar === 'function') {
    closeSidebarBtn.addEventListener('click', closeSidebar);
  }
  if (scrimOverlay && typeof closeSidebar === 'function') {
    scrimOverlay.addEventListener('click', closeSidebar);
  }

  // Hierarchical Esc key closure for all modals and drawers
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (typeof window.closeTopmostModal === 'function') {
        const closed = window.closeTopmostModal();
        if (closed) return;
      }

      // Notebook Drawer
      const notebookModal = document.getElementById('notebookModal');
      if (notebookModal && (notebookModal.classList.contains('is-open') || notebookModal.style.display === 'flex')) {
        if (typeof window.closeNotebook === 'function') {
          window.closeNotebook();
        } else {
          const closeBtn = document.getElementById('closeNotebookBtn');
          if (closeBtn) closeBtn.click();
        }
        return;
      }

      // Sidebar Panel
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

  // Four-Theme Switcher logic (Dark -> Light -> Warm -> Gray -> Dark) with localStorage persistence
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      if (document.body.classList.contains('light-theme')) {
        // Light -> Warm
        document.body.classList.remove('light-theme', 'gray-theme');
        document.body.classList.add('warm-theme');
        localStorage.setItem('theme', 'warm');
        updateThemeIcons('warm');
        if (window.showToast) window.showToast("Тема: Теплая бумага (#FDF6E3)", "info");
      } else if (document.body.classList.contains('warm-theme')) {
        // Warm -> Gray
        document.body.classList.remove('light-theme', 'warm-theme');
        document.body.classList.add('gray-theme');
        localStorage.setItem('theme', 'gray');
        updateThemeIcons('gray');
        if (window.showToast) window.showToast("Тема: Графитовая", "info");
      } else if (document.body.classList.contains('gray-theme')) {
        // Gray -> Dark
        document.body.classList.remove('light-theme', 'warm-theme', 'gray-theme');
        localStorage.setItem('theme', 'dark');
        updateThemeIcons('dark');
        if (window.showToast) window.showToast("Тема: Черная (Dark Zinc)", "info");
      } else {
        // Dark -> Light
        document.body.classList.remove('warm-theme', 'gray-theme');
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
        updateThemeIcons('light');
        if (window.showToast) window.showToast("Тема: Светлая (IGOR)", "info");
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

    const savedLineNumbers = localStorage.getItem('galaxy_notebook_line_numbers') !== 'false';
    const notebookLineNumbersToggle = document.getElementById('notebookLineNumbersToggle');
    if (notebookLineNumbersToggle) {
      notebookLineNumbersToggle.checked = savedLineNumbers;
      if (savedLineNumbers) {
        document.body.classList.remove('no-notebook-line-numbers');
      } else {
        document.body.classList.add('no-notebook-line-numbers');
      }
    }

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
      
      if (typeof window.openModalEl === 'function') window.openModalEl(settingsModal);
      else settingsModal.style.display = 'flex';
    });

    // Close modal
    const closeModal = () => {
      if (typeof window.closeModalEl === 'function') window.closeModalEl(settingsModal);
      else settingsModal.style.display = 'none';
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

      // Save Notebook Line Numbers setting
      const notebookLineNumbersToggle = document.getElementById('notebookLineNumbersToggle');
      if (notebookLineNumbersToggle) {
        const isChecked = notebookLineNumbersToggle.checked;
        localStorage.setItem('galaxy_notebook_line_numbers', isChecked ? 'true' : 'false');
        if (isChecked) {
          document.body.classList.remove('no-notebook-line-numbers');
        } else {
          document.body.classList.add('no-notebook-line-numbers');
        }
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
      
      apiStatusMessage.textContent = 'Settings успешно сохранены!';
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

      localStorage.removeItem('galaxy_notebook_line_numbers');
      const notebookLineNumbersToggle = document.getElementById('notebookLineNumbersToggle');
      if (notebookLineNumbersToggle) notebookLineNumbersToggle.checked = true;
      document.body.classList.remove('no-notebook-line-numbers');

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
            backupStatusMessage.textContent = 'Yesнные экспортированы!';
            backupStatusMessage.style.display = 'block';
            backupStatusMessage.className = 'modal-status success';
            setTimeout(() => { backupStatusMessage.style.display = 'none'; }, 3000);
          }
        } catch (err) {
          console.error('Backup export failed:', err);
          if (backupStatusMessage) {
            backupStatusMessage.textContent = 'Error экспорта данных!';
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
              backupStatusMessage.textContent = 'Success! Страница перезагружается...';
              backupStatusMessage.style.display = 'block';
              backupStatusMessage.className = 'modal-status success';
            }

            setTimeout(() => {
              window.location.reload();
            }, 1200);

          } catch (err) {
            console.error('Backup import failed:', err);
            if (backupStatusMessage) {
              backupStatusMessage.textContent = `Error: ${err.message || 'неверный формат JSON'}`;
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
      syncUserEmail.textContent = user.displayName || user.email || 'Linked profile';
      
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
      
      if (typeof window.openModalEl === 'function') window.openModalEl(editLyricsModal);
      else editLyricsModal.style.display = 'flex';
    });

    const closeEditModal = () => {
      if (typeof window.closeModalEl === 'function') window.closeModalEl(editLyricsModal);
      else editLyricsModal.style.display = 'none';
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

  // ── Header Minimalist Menu & Dropdown Controller ──
  const menuBtn = document.getElementById('headerMenuBtn');
  const navDropdown = document.getElementById('headerNavMenu');
  const navBackdrop = document.getElementById('headerNavBackdrop');
  const closeNavBtn = document.getElementById('closeHeaderNavBtn');

  const openHeaderNav = () => {
    if (navDropdown) navDropdown.style.display = 'flex';
    if (navBackdrop) navBackdrop.style.display = 'block';
    if (menuBtn) menuBtn.classList.add('active');
  };

  const closeHeaderNav = () => {
    if (navDropdown) navDropdown.style.display = 'none';
    if (navBackdrop) navBackdrop.style.display = 'none';
    if (menuBtn) menuBtn.classList.remove('active');
  };

  if (menuBtn && navDropdown) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const isVisible = navDropdown.style.display !== 'none';
      if (isVisible) {
        closeHeaderNav();
      } else {
        openHeaderNav();
      }
    });

    if (closeNavBtn) {
      closeNavBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        closeHeaderNav();
      });
    }

    if (navBackdrop) {
      navBackdrop.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        closeHeaderNav();
      });
      navBackdrop.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        closeHeaderNav();
      }, { passive: true });
    }

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (navDropdown.style.display !== 'none' && !navDropdown.contains(/** @type {Node} */ (e.target)) && e.target !== menuBtn) {
        closeHeaderNav();
      }
    });

    // Close dropdown on click of any action inside
    navDropdown.querySelectorAll('.nav-dropdown-item, .nav-dropdown-profile, .nav-dropdown-sparks-link').forEach(item => {
      item.addEventListener('click', () => {
        closeHeaderNav();
      });
    });
  }

  // ── Mobile Search Controller ──
  const searchToggleBtn = document.getElementById('headerSearchToggleBtn');
  const closeMobileSearchBtn = document.getElementById('closeMobileSearchBtn');
  const appNavbar = document.getElementById('appNavbar');
  const songSelectorContainer = document.getElementById('songSelectorContainer');

  if (searchToggleBtn) {
    searchToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (typeof window.toggleMobileSearch === 'function') {
        window.toggleMobileSearch(e);
      }
    });
  }

  if (closeMobileSearchBtn) {
    closeMobileSearchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (typeof window.closeMobileSearch === 'function') {
        window.closeMobileSearch(e);
      }
    });
  }

  // Close mobile search on click outside
  document.addEventListener('click', (e) => {
    if (appNavbar && appNavbar.classList.contains('search-active')) {
      const isInsideSearch = songSelectorContainer && songSelectorContainer.contains(/** @type {Node} */ (e.target));
      const isSearchToggle = searchToggleBtn && searchToggleBtn.contains(/** @type {Node} */ (e.target));
      if (!isInsideSearch && !isSearchToggle) {
        if (typeof window.closeMobileSearch === 'function') {
          window.closeMobileSearch();
        }
      }
    }
  });

  // ESC key closes mobile search or header menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (typeof window.closeMobileSearch === 'function') {
        window.closeMobileSearch();
      }
      if (typeof window.closeHeaderNav === 'function') {
        window.closeHeaderNav();
      }
    }
  });
}


// Backward Compatibility
window.setupEventListeners = setupEventListeners;