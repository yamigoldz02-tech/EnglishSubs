/**
 * @AI-SECTION: GALAXY_VIDEO_COURSE
 * @file modules/galaxy-course.js
 * @description Extracted YouTube Video Course Tracker Module (English Galaxy, A0).
 */

/* ==========================================================================
   12. YouTube Video Course Tracker Module (English Galaxy, A0, 50 Lessons)
   ========================================================================== */
const GALAXY_VIDEO_IDS = [
  "HJwTaPns-D0", "dN5KiZOGFyY", "BbmUlE3K6Bg", "xboNpbNMFDQ", "sKIEVln-rKQ",
  "X8X5RCbpV-U", "oLF6u_4huzc", "-VaWSZk0Wzw", "jLguuGR53Fg", "vWVdiJduI-Q",
  "2K30u8hGee4", "1Nwp7mAemxQ", "OGNadrsVLLg", "znXi4zipIMQ", "EWxo4XaViNk",
  "yBF_B4_zAxI", "5Xef7_WDdJ8", "UGA2ukYvNuI", "7ezBCciAI14", "7WPdwbf1FAo",
  "IsjAYF3EYh0", "yuV2y16wqtw", "HGQPaSkEo7E", "zH3I-FyZzc4", "gAfb0bVcvkA",
  "XvpWgwywB-c", "qdjztIX3k0k", "R73gLmDeKhM", "SeH3SpTr1hA", "0v3RTay8lmM",
  "fYDpkVMwtdk", "ta2GAp6qXTA", "hZxPhpW_aF4", "6GbS1q3BkJk", "uGArZwBG1CU",
  "MZM5cQZmHGg", "cwh2d6-atQw", "q1LAzbHl63E", "IQnNkfEAa8M", "kpKzRmLXYko",
  "Nf0YbWQ8n3U", "WkBf9wDMdlE", "sCsbme3dzko", "p9vwgL53mfE", "XpaOD59jFaw",
  "02Vxt0kySSI", "JHm3QFfcdLY", "Rc0ZXJWi4xA", "mI4Kc-t3MLY", "Cy5UFklBfWk"
];

const GALAXY_COURSE_VIDEOS = GALAXY_VIDEO_IDS.map((id, index) => {
  const num = index + 1;
  const isEng = num <= 4;
  const title = isEng 
    ? `English from Beginner to Advanced. A Practical Course Using the English Galaxy App. A0. Lesson ${num}`
    : `Английский язык с нуля до продвинутого. Практический курс по приложению English Galaxy. А0. Урок ${num}`;
  const shortTitle = isEng
    ? `Lesson ${num}: English from Beginner to Advanced`
    : `Урок ${num}: Практический курс English Galaxy`;
  return { id, num, title, shortTitle };
});

let galaxyWatchedVideos = [];
let galaxyActiveVideoId = null;
let galaxyCurrentFilter = 'all';
let galaxySearchQuery = '';

function initVideoCourse() {
  // Load watched state
  try {
    const saved = localStorage.getItem('galaxy_watched_videos');
    console.log('[VideoCourse] Raw localStorage value:', saved);
    if (saved) {
      galaxyWatchedVideos = JSON.parse(saved);
      console.log('[VideoCourse] Loaded watched videos:', galaxyWatchedVideos.length, galaxyWatchedVideos);
    } else {
      console.log('[VideoCourse] No watched videos in localStorage');
    }
  } catch (e) {
    console.error("Failed to load watched videos from storage:", e);
    galaxyWatchedVideos = [];
  }

  // Setup UI elements and events
  const openBtn = document.getElementById('openVideoCourseBtn');
  const dashCard = document.getElementById('dashGoVideoCourse');
  const modal = document.getElementById('videoCourseModal');
  const closeBtn = document.getElementById('closeVideoCourseModalBtn');
  const activeCheck = document.getElementById('activeVideoCheckbox');
  const searchInput = document.getElementById('videoSearchInput');
  const clearSearchBtn = document.getElementById('clearVideoSearchBtn');

  const showModal = () => {
    if (modal) {
      modal.classList.remove('video-modal-minimized');
      const header = document.getElementById('floatingPlayerHeader');
      if (header) header.style.display = 'none';
      const rhLeft = document.getElementById('floatingResizeHandleLeft');
      const rhRight = document.getElementById('floatingResizeHandleRight');
      if (rhLeft) rhLeft.style.display = 'none';
      if (rhRight) rhRight.style.display = 'none';
      // Reset any inline width/position set by JS resize/drag
      const pane = modal.querySelector('.player-container-pane');
      if (pane) {
        pane.style.removeProperty('width');
        pane.style.removeProperty('left');
        pane.style.removeProperty('top');
        pane.classList.remove('floating-dragged');
      }
      
      openModalEl(modal);
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
      renderVideoLessons();
      updateVideoCourseProgress();
    }
  };

  const hideModal = () => {
    if (modal) {
      if (galaxyActiveVideoId) {
        modal.classList.add('video-modal-minimized');
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        const header = document.getElementById('floatingPlayerHeader');
        if (header) header.style.display = 'flex';
        const rhLeft = document.getElementById('floatingResizeHandleLeft');
        const rhRight = document.getElementById('floatingResizeHandleRight');
        if (rhLeft) rhLeft.style.display = 'block';
        if (rhRight) rhRight.style.display = 'block';
      } else {
        modal.classList.remove('video-modal-minimized');
        const header = document.getElementById('floatingPlayerHeader');
        if (header) header.style.display = 'none';
        const rhLeft = document.getElementById('floatingResizeHandleLeft');
        const rhRight = document.getElementById('floatingResizeHandleRight');
        if (rhLeft) rhLeft.style.display = 'none';
        if (rhRight) rhRight.style.display = 'none';
        
        modal.style.display = 'none';
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        
        const player = document.getElementById('activeVideoPlayer');
        if (player) {
          player.innerHTML = `
            <div class="player-placeholder">
              <div class="placeholder-vinyl-art">🎬</div>
              <h4>Выберите урок для просмотра</h4>
              <p>Кликните по уроку в списке слева, чтобы открыть видео в плеере</p>
            </div>
          `;
        }
        const details = document.getElementById('activeVideoDetails');
        if (details) details.style.display = 'none';
        galaxyActiveVideoId = null;
      }
    }
  };

  // Set up floating player buttons
  const closeFloatingBtn = document.getElementById('closeFloatingVideoBtn');
  const expandFloatingBtn = document.getElementById('expandFloatingVideoBtn');

  if (closeFloatingBtn) {
    closeFloatingBtn.onclick = () => {
      galaxyActiveVideoId = null;
      hideModal();
    };
  }

  if (expandFloatingBtn) {
    expandFloatingBtn.onclick = () => {
      showModal();
    };
  }

  // --- JS Drag-to-Resize for floating player (left & right edges) ---
  const handleLeft = document.getElementById('floatingResizeHandleLeft');
  const handleRight = document.getElementById('floatingResizeHandleRight');
  
  function initResizeHandle(handle, isLeft) {
    if (!handle) return;
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    let startLeft = 0;

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const pane = handle.closest('.player-container-pane');
      if (!pane) return;
      isResizing = true;
      startX = e.clientX;
      startWidth = pane.offsetWidth;
      
      // Convert to absolute left/top positioning if not already done
      if (!pane.classList.contains('floating-dragged')) {
        const rect = pane.getBoundingClientRect();
        pane.style.setProperty('left', rect.left + 'px', 'important');
        pane.style.setProperty('top', rect.top + 'px', 'important');
        pane.classList.add('floating-dragged');
      }
      
      startLeft = pane.getBoundingClientRect().left;
      handle.classList.add('active');
      document.body.classList.add('floating-resizing');
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const pane = handle.closest('.player-container-pane');
      if (!pane) return;
      
      let newWidth;
      if (isLeft) {
        const delta = startX - e.clientX;
        newWidth = Math.max(280, Math.min(window.innerWidth * 0.8, startWidth + delta));
        pane.style.setProperty('width', newWidth + 'px', 'important');
        const newLeft = Math.max(0, startLeft - (newWidth - startWidth));
        pane.style.setProperty('left', newLeft + 'px', 'important');
      } else {
        const delta = e.clientX - startX;
        newWidth = Math.max(280, Math.min(window.innerWidth * 0.8, startWidth + delta));
        pane.style.setProperty('width', newWidth + 'px', 'important');
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        handle.classList.remove('active');
        document.body.classList.remove('floating-resizing');
      }
    });
  }

  initResizeHandle(handleLeft, true);
  initResizeHandle(handleRight, false);

  // --- JS Drag-to-Move for floating player (grab header) ---
  const floatingHeader = document.getElementById('floatingPlayerHeader');
  if (floatingHeader) {
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let paneStartLeft = 0;
    let paneStartTop = 0;

    floatingHeader.addEventListener('mousedown', (e) => {
      // Don't drag if clicking buttons inside the header
      if (e.target.closest('button')) return;
      e.preventDefault();
      const pane = floatingHeader.closest('.player-container-pane');
      if (!pane) return;

      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;

      // If first drag, convert from bottom/right to top/left
      if (!pane.classList.contains('floating-dragged')) {
        const rect = pane.getBoundingClientRect();
        pane.style.setProperty('left', rect.left + 'px', 'important');
        pane.style.setProperty('top', rect.top + 'px', 'important');
        pane.classList.add('floating-dragged');
      }

      paneStartLeft = parseInt(pane.style.left) || 0;
      paneStartTop = parseInt(pane.style.top) || 0;

      document.body.classList.add('floating-resizing'); // reuse to block iframe
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const pane = floatingHeader.closest('.player-container-pane');
      if (!pane) return;

      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      
      let newLeft = paneStartLeft + dx;
      let newTop = paneStartTop + dy;
      
      // Keep within viewport
      const pw = pane.offsetWidth;
      const ph = pane.offsetHeight;
      newLeft = Math.max(0, Math.min(window.innerWidth - pw, newLeft));
      newTop = Math.max(0, Math.min(window.innerHeight - ph, newTop));

      pane.style.setProperty('left', newLeft + 'px', 'important');
      pane.style.setProperty('top', newTop + 'px', 'important');
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.classList.remove('floating-resizing');
      }
    });
  }

  if (openBtn) openBtn.onclick = showModal;
  if (dashCard) dashCard.onclick = showModal;
  if (closeBtn) closeBtn.onclick = hideModal;
  
  // Backdrop click intentionally disabled — use the close button to dismiss

  // Active player watch toggle checkbox
  if (activeCheck) {
    activeCheck.onchange = () => {
      if (galaxyActiveVideoId) {
        toggleWatchedStatus(galaxyActiveVideoId);
      }
    };
  }

  // Search events
  if (searchInput) {
    searchInput.oninput = (e) => {
      galaxySearchQuery = e.target.value;
      if (clearSearchBtn) {
        clearSearchBtn.style.display = galaxySearchQuery ? 'block' : 'none';
      }
      renderVideoLessons();
    };
  }

  if (clearSearchBtn) {
    clearSearchBtn.onclick = () => {
      if (searchInput) searchInput.value = '';
      galaxySearchQuery = '';
      clearSearchBtn.style.display = 'none';
      renderVideoLessons();
    };
  }

  // Filter events
  const filterPills = document.querySelectorAll('.video-course-controls .filter-pill');
  filterPills.forEach(pill => {
    pill.onclick = () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      galaxyCurrentFilter = pill.dataset.filter || 'all';
      renderVideoLessons();
    };
  });

  // Init/sync progress bars
  updateVideoCourseProgress();

  // Mobile Course Tabs Control
  const videoTabLessonsBtn = document.getElementById('videoTabLessonsBtn');
  const videoTabNotesBtn = document.getElementById('videoTabNotesBtn');
  const videoCard = modal; // videoCourseModal

  if (videoTabLessonsBtn && videoTabNotesBtn && videoCard) {
    // Default class
    videoCard.classList.add('active-tab-lessons');

    videoTabLessonsBtn.onclick = () => {
      videoCard.classList.remove('active-tab-notes');
      videoCard.classList.add('active-tab-lessons');
      videoTabLessonsBtn.classList.add('active');
      videoTabNotesBtn.classList.remove('active');
    };

    videoTabNotesBtn.onclick = () => {
      videoCard.classList.remove('active-tab-lessons');
      videoCard.classList.add('active-tab-notes');
      videoTabNotesBtn.classList.add('active');
      videoTabLessonsBtn.classList.remove('active');
    };
  }
}

function updateVideoCourseProgress() {
  const count = galaxyWatchedVideos.length;
  const percent = count > 0 ? Math.round((count / 50) * 100) : 0;

  // Sync navbar button count
  const navCount = document.getElementById('navWatchedCount');
  if (navCount) navCount.textContent = count;

  // Sync welcome card metrics
  const dashCount = document.getElementById('dashWatchedCount');
  const dashPercent = document.getElementById('dashWatchedPercent');
  const dashBar = document.getElementById('dashWatchedProgressBar');
  if (dashCount) dashCount.textContent = count;
  if (dashPercent) dashPercent.textContent = percent;
  if (dashBar) dashBar.style.width = `${percent}%`;

  // Sync modal progress panel
  const modalCount = document.getElementById('modalWatchedCount');
  const modalPercent = document.getElementById('modalWatchedPercent');
  const modalBar = document.getElementById('modalProgressBar');
  if (modalCount) modalCount.textContent = count;
  if (modalPercent) modalPercent.textContent = `${percent}%`;
  if (modalBar) modalBar.style.width = `${percent}%`;
}

function renderVideoLessons() {
  const container = document.getElementById('videoLessonsList');
  if (!container) return;

  const q = galaxySearchQuery.toLowerCase().trim();
  const filtered = GALAXY_COURSE_VIDEOS.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(q) || 
                          v.shortTitle.toLowerCase().includes(q) || 
                          `урок ${v.num}`.includes(q) || 
                          `lesson ${v.num}`.includes(q);
    const isWatched = galaxyWatchedVideos.includes(v.id);
    
    if (galaxyCurrentFilter === 'watched') return matchesSearch && isWatched;
    if (galaxyCurrentFilter === 'unwatched') return matchesSearch && !isWatched;
    return matchesSearch;
  });

  const fragment = document.createDocumentFragment();

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'text-align: center; padding: 2rem 1rem; color: var(--text-sub); font-size: 0.82rem; font-style: italic;';
    empty.textContent = 'Уроки не найдены 🔍';
    fragment.appendChild(empty);
  } else {
    filtered.forEach(v => {
      const isWatched = galaxyWatchedVideos.includes(v.id);
      const isPlaying = galaxyActiveVideoId === v.id;

      const item = document.createElement('div');
      item.className = `video-lesson-item${isWatched ? ' watched' : ''}${isPlaying ? ' playing' : ''}`;
      item.dataset.id = v.id;

      item.innerHTML = `
        <span class="lesson-badge">${v.num <= 4 ? 'Lesson' : 'Урок'} ${v.num}</span>
        <div class="lesson-info-col">
          <h4 class="lesson-item-title">${escapeHTML(v.shortTitle)}</h4>
          <p class="lesson-item-subtitle">${v.num <= 4 ? 'Level A0 • Intro Course' : 'Уровень А0 • Практика'}</p>
        </div>
        ${galaxyLessonNotes[v.id] ? '<span class="lesson-note-dot" title="Есть заметка"></span>' : ''}
        <label class="lesson-watch-checkbox-container" title="Отметить как пройденный" onclick="event.stopPropagation();">
          <input type="checkbox" class="lesson-item-check" data-id="${v.id}" ${isWatched ? 'checked' : ''}>
          <span class="lesson-custom-checkmark"></span>
        </label>
      `;

      // Click launches the player
      item.addEventListener('click', () => {
        playGalaxyVideo(v.id, v.shortTitle, v.num);
      });

      // Checkbox toggles watched status
      const check = item.querySelector('.lesson-item-check');
      if (check) {
        check.addEventListener('change', (e) => {
          toggleWatchedStatus(v.id);
        });
      }

      fragment.appendChild(item);
    });
  }

  container.innerHTML = '';
  container.appendChild(fragment);
}

let ytPlayer = null;
let youtubeApiReady = false;

// Global callback for YT Iframe API
window.onYouTubeIframeAPIReady = function() {
  youtubeApiReady = true;
};

// Inject YT Iframe API script
const initYouTubeAPI = () => {
  if (!document.getElementById('youtube-api-script')) {
    const tag = document.createElement('script');
    tag.id = 'youtube-api-script';
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }
  }
};
initYouTubeAPI();

let videoProgressInterval = null;

function saveVideoProgress() {
  if (typeof ytPlayer !== 'undefined' && ytPlayer && ytPlayer.getCurrentTime && galaxyActiveVideoId) {
    const time = Math.floor(ytPlayer.getCurrentTime());
    if (time > 0) {
      localStorage.setItem(`galaxy_video_progress_${galaxyActiveVideoId}`, time);
    }
  }
}

function onPlayerStateChange(event) {
  // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
  if (event.data === 1) { // PLAYING
    if (typeof SpotifyController !== 'undefined' && localStorage.getItem('galaxy_spotify_auto_pause') !== 'false') SpotifyController.setPlaybackState('pause');
    if (!videoProgressInterval) {
      videoProgressInterval = setInterval(saveVideoProgress, 5000);
    }
  } else if (event.data === 2 || event.data === 0) { // PAUSED or ENDED
    if (typeof SpotifyController !== 'undefined' && localStorage.getItem('galaxy_spotify_auto_pause') !== 'false') SpotifyController.setPlaybackState('play');
    if (videoProgressInterval) {
      clearInterval(videoProgressInterval);
      videoProgressInterval = null;
    }
    saveVideoProgress();
  }
}

function playGalaxyVideo(videoId, title, lessonNum) {
  galaxyActiveVideoId = videoId;

  // Render iframe inside player container using YT.Player
  const playerContainer = document.getElementById('activeVideoPlayer');
  if (playerContainer) {
    playerContainer.innerHTML = '<div id="ytplayer-container" style="width:100%; height:100%;"></div>';
    
    const setupPlayer = () => {
      const savedTime = localStorage.getItem(`galaxy_video_progress_${videoId}`);
      const startTime = savedTime ? parseInt(savedTime, 10) : 0;

      ytPlayer = new YT.Player('ytplayer-container', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          'autoplay': 1,
          'enablejsapi': 1,
          'rel': 0,
          'start': startTime
        },
        events: {
          'onStateChange': onPlayerStateChange,
          'onReady': (event) => { if (localStorage.getItem('galaxy_video_2x') !== 'false') { event.target.setPlaybackRate(2); } }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      setupPlayer();
    } else {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          setupPlayer();
        }
      }, 100);
    }
  }

  // Update active lesson card details
  const details = document.getElementById('activeVideoDetails');
  const badge = document.getElementById('activeLessonBadge');
  const titleEl = document.getElementById('activeLessonTitle');
  const activeCheck = document.getElementById('activeVideoCheckbox');

  if (details) details.style.display = 'flex';
  if (badge) badge.textContent = `${lessonNum <= 4 ? 'Lesson' : 'Урок'} ${lessonNum}`;
  if (titleEl) titleEl.textContent = title;
  if (activeCheck) activeCheck.checked = galaxyWatchedVideos.includes(videoId);

  const extLink = document.getElementById('activeVideoExternalLink');
  if (extLink) {
    extLink.href = `https://www.youtube.com/watch?v=${videoId}`;
  }

  // Load per-lesson note into textarea
  const noteTa = document.getElementById('activeLessonNoteTextarea');
  if (noteTa) {
    noteTa.value = galaxyLessonNotes[videoId] || '';
    const statusEl = document.getElementById('lessonNoteSaveStatus');
    if (statusEl) {
      statusEl.textContent = '\ud83d\udcbe Автосохранение';
      statusEl.className = 'lesson-note-save-status';
    }
  }

  // Refresh items class names so playing card is highlighted
  renderVideoLessons();

  // Auto-switch to Notes/Details tab on mobile when a video starts playing
  const videoTabNotesBtn = document.getElementById('videoTabNotesBtn');
  if (videoTabNotesBtn && window.innerWidth <= 768) {
    videoTabNotesBtn.click();
  }
}

function toggleWatchedStatus(videoId) {
  const isWatched = galaxyWatchedVideos.includes(videoId);
  
  if (isWatched) {
    galaxyWatchedVideos = galaxyWatchedVideos.filter(id => id !== videoId);
  } else {
    galaxyWatchedVideos.push(videoId);
    // Award 10 activity points in Heatmap!
    if (typeof recordActivity === 'function') {
      recordActivity(10);
      showCourseToast('🎉 Урок пройден! Вам начислено +100 XP.');
    }
    
    // --- GAMIFICATION XP LOGIC ---
    if (window.awardXP) {
      window.awardXP(100, 'video_watched', document.getElementById('galaxyVideoPlayerContainer') || document.querySelector('.galaxy-video-container'));
    }
    // -----------------------------
  }

  // Save to storage
  localStorage.setItem('galaxy_watched_videos', JSON.stringify(galaxyWatchedVideos));

  // Sync metrics and bars
  updateVideoCourseProgress();

  // Sync player check if it matches the playing video
  const activeCheck = document.getElementById('activeVideoCheckbox');
  if (activeCheck && galaxyActiveVideoId === videoId) {
    activeCheck.checked = !isWatched;
  }

  // Refresh lessons UI list
  renderVideoLessons();
}

function showCourseToast(msg) {
  let container = document.getElementById('courseToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'courseToastContainer';
    container.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 1100; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = 'background: rgba(167, 139, 250, 0.95); border: 1.5px solid rgba(255, 255, 255, 0.18); color: #000000; font-weight: 700; font-size: 0.85rem; padding: 12px 20px; border-radius: 12px; box-shadow: 0 10px 25px rgba(167,139,250,0.4); display: flex; align-items: center; gap: 8px; animation: slideInToast 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); pointer-events: auto; backdrop-filter: blur(8px);';
  toast.innerHTML = `<span>${msg}</span>`;

  if (!document.getElementById('toastAnimationStyles')) {
    const styles = document.createElement('style');
    styles.id = 'toastAnimationStyles';
    styles.textContent = `
      @keyframes slideInToast {
        from { transform: translateX(120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeOutToast {
        to { transform: translateY(10px); opacity: 0; }
      }
    `;
    document.head.appendChild(styles);
  }

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOutToast 0.4s ease forwards';
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 3500);
}
