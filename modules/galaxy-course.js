// @ts-check
/// <reference path="./types.js" />
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
    : `English from Beginner to Advanced. Practical Course with the English Galaxy App. A0. Lesson ${num}`;
  const shortTitle = isEng
    ? `Lesson ${num}: English from Beginner to Advanced`
    : `Lesson ${num}: English Galaxy Practical Course`;
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
    if (saved) {
      galaxyWatchedVideos = JSON.parse(saved);
    } else {
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
      ['floatingResizeHandleTopLeft', 'floatingResizeHandleBottomRight', 'floatingResizeHandleLeft', 'floatingResizeHandleTop', 'floatingResizeHandleRight', 'floatingResizeHandleBottom'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      const pane = modal.querySelector('.player-container-pane');
      if (pane) {
        pane.style.removeProperty('width');
        pane.style.removeProperty('left');
        pane.style.removeProperty('top');
        pane.style.removeProperty('bottom');
        pane.style.removeProperty('right');
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
        ['floatingResizeHandleTopLeft', 'floatingResizeHandleBottomRight', 'floatingResizeHandleLeft', 'floatingResizeHandleTop', 'floatingResizeHandleRight', 'floatingResizeHandleBottom'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.display = 'block';
        });
      } else {
        modal.classList.remove('video-modal-minimized');
        const header = document.getElementById('floatingPlayerHeader');
        if (header) header.style.display = 'none';
        ['floatingResizeHandleTopLeft', 'floatingResizeHandleBottomRight', 'floatingResizeHandleLeft', 'floatingResizeHandleTop', 'floatingResizeHandleRight', 'floatingResizeHandleBottom'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.display = 'none';
        });
        
        modal.style.display = 'none';
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        
        const player = document.getElementById('activeVideoPlayer');
        if (player) {
          player.innerHTML = `
            <div class="player-placeholder">
              <div class="placeholder-vinyl-art">🎬</div>
              <h4>Select a lesson to watch</h4>
              <p>Click a lesson from the list on the left to open the video player</p>
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
    closeFloatingBtn.onclick = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      galaxyActiveVideoId = null;
      hideModal();
    };
  }

  if (expandFloatingBtn) {
    expandFloatingBtn.onclick = () => {
      showModal();
    };
  }

  // --- JS Drag-to-Resize for floating player (with strict screen boundary clamping) ---
  const handleTopLeft = document.getElementById('floatingResizeHandleTopLeft');
  const handleBottomRight = document.getElementById('floatingResizeHandleBottomRight');
  const handleLeft = document.getElementById('floatingResizeHandleLeft');
  const handleTop = document.getElementById('floatingResizeHandleTop');
  const handleRight = document.getElementById('floatingResizeHandleRight');
  const handleBottom = document.getElementById('floatingResizeHandleBottom');

  function initResizeHandle(handle, handleType) {
    if (!handle) return;
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let fixedBottom = 0;
    let fixedRight = 0;
    let fixedTop = 0;
    let fixedLeft = 0;
    let latestMouseX = 0;
    let latestMouseY = 0;
    let isPendingrAF = false;

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const pane = handle.closest('.player-container-pane');
      if (!pane) return;

      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = pane.getBoundingClientRect();
      startWidth = rect.width;

      fixedBottom = window.innerHeight - rect.bottom;
      fixedRight = window.innerWidth - rect.right;
      fixedTop = rect.top;
      fixedLeft = rect.left;

      handle.classList.add('active');
      document.body.classList.add('floating-resizing');

      const iframe = pane.querySelector('iframe');
      if (iframe) iframe.style.setProperty('pointer-events', 'none', 'important');
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      latestMouseX = e.clientX;
      latestMouseY = e.clientY;

      if (!isPendingrAF) {
        isPendingrAF = true;
        requestAnimationFrame(() => {
          isPendingrAF = false;
          if (!isResizing) return;
          const pane = handle.closest('.player-container-pane');
          if (!pane) return;

          let delta = 0;
          let anchorMode = 'bottom-right';

          if (handleType === 'top-left') {
            const dx = startX - latestMouseX;
            const dy = startY - latestMouseY;
            delta = (dx + dy) / 2;
            anchorMode = 'bottom-right';
          } else if (handleType === 'bottom-right') {
            const dx = latestMouseX - startX;
            const dy = latestMouseY - startY;
            delta = (dx + dy) / 2;
            anchorMode = 'top-left';
          } else if (handleType === 'left') {
            delta = startX - latestMouseX;
            anchorMode = 'bottom-right';
          } else if (handleType === 'right') {
            delta = latestMouseX - startX;
            anchorMode = 'top-left';
          } else if (handleType === 'top') {
            delta = (startY - latestMouseY) * 1.77;
            anchorMode = 'bottom-right';
          } else if (handleType === 'bottom') {
            delta = (latestMouseY - startY) * 1.77;
            anchorMode = 'top-left';
          }

          const minWidth = 260;
          let maxAllowedWidth = 1000;

          if (anchorMode === 'bottom-right') {
            // Constrain left edge >= 10px & top edge >= 10px
            const availWFromLeft = window.innerWidth - fixedRight - 10;
            const availHFromTop = window.innerHeight - fixedBottom - 10;
            const availVideoH = Math.max(0, availHFromTop - 35);
            const maxWFromTop = availVideoH * (16 / 9);
            maxAllowedWidth = Math.max(minWidth, Math.min(availWFromLeft, maxWFromTop));
          } else {
            // Constrain right edge <= window.innerWidth - 10 & bottom edge <= window.innerHeight - 10
            const availWFromRight = window.innerWidth - fixedLeft - 10;
            const availHFromBottom = window.innerHeight - fixedTop - 10;
            const availVideoH = Math.max(0, availHFromBottom - 35);
            const maxWFromBottom = availVideoH * (16 / 9);
            maxAllowedWidth = Math.max(minWidth, Math.min(availWFromRight, maxWFromBottom));
          }

          const targetWidth = Math.max(minWidth, Math.min(maxAllowedWidth, startWidth + delta));

          if (anchorMode === 'top-left') {
            pane.style.setProperty('top', Math.max(10, fixedTop) + 'px', 'important');
            pane.style.setProperty('left', Math.max(10, fixedLeft) + 'px', 'important');
            pane.style.setProperty('bottom', 'auto', 'important');
            pane.style.setProperty('right', 'auto', 'important');
            pane.style.setProperty('width', targetWidth + 'px', 'important');
          } else {
            pane.style.setProperty('bottom', Math.max(10, fixedBottom) + 'px', 'important');
            pane.style.setProperty('right', Math.max(10, fixedRight) + 'px', 'important');
            pane.style.setProperty('top', 'auto', 'important');
            pane.style.setProperty('left', 'auto', 'important');
            pane.style.setProperty('width', targetWidth + 'px', 'important');
          }
        });
      }
    });

    const stopResize = () => {
      if (isResizing) {
        isResizing = false;
        handle.classList.remove('active');
        document.body.classList.remove('floating-resizing');

        const pane = handle.closest('.player-container-pane');
        if (pane) {
          const iframe = pane.querySelector('iframe');
          if (iframe) iframe.style.removeProperty('pointer-events');
        }
      }
    };

    document.addEventListener('mouseup', stopResize);
  }

  initResizeHandle(handleTopLeft, 'top-left');
  initResizeHandle(handleBottomRight, 'bottom-right');
  initResizeHandle(handleLeft, 'left');
  initResizeHandle(handleTop, 'top');
  initResizeHandle(handleRight, 'right');
  initResizeHandle(handleBottom, 'bottom');

  // --- JS Drag-to-Move for floating player (grab header) ---
  const floatingHeader = document.getElementById('floatingPlayerHeader');
  if (floatingHeader) {
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let paneStartLeft = 0;
    let paneStartTop = 0;

    floatingHeader.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      e.preventDefault();
      const pane = floatingHeader.closest('.player-container-pane');
      if (!pane) return;

      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;

      const rect = pane.getBoundingClientRect();
      if (!pane.classList.contains('floating-dragged')) {
        pane.style.setProperty('left', rect.left + 'px', 'important');
        pane.style.setProperty('top', rect.top + 'px', 'important');
        pane.classList.add('floating-dragged');
      }

      paneStartLeft = rect.left;
      paneStartTop = rect.top;

      document.body.classList.add('floating-resizing');

      const iframe = pane.querySelector('iframe');
      if (iframe) iframe.style.pointerEvents = 'none';
    });

    let latestDragX = 0;
    let latestDragY = 0;
    let isPendingDragrAF = false;

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      latestDragX = e.clientX;
      latestDragY = e.clientY;

      if (!isPendingDragrAF) {
        isPendingDragrAF = true;
        requestAnimationFrame(() => {
          isPendingDragrAF = false;
          if (!isDragging) return;
          const pane = floatingHeader.closest('.player-container-pane');
          if (!pane) return;

          const dx = latestDragX - dragStartX;
          const dy = latestDragY - dragStartY;

          let newLeft = paneStartLeft + dx;
          let newTop = paneStartTop + dy;

          const rect = pane.getBoundingClientRect();
          newLeft = Math.max(10, Math.min(window.innerWidth - rect.width - 10, newLeft));
          newTop = Math.max(10, Math.min(window.innerHeight - rect.height - 10, newTop));

          pane.style.setProperty('left', newLeft + 'px', 'important');
          pane.style.setProperty('top', newTop + 'px', 'important');
          pane.style.setProperty('bottom', 'auto', 'important');
          pane.style.setProperty('right', 'auto', 'important');
        });
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.classList.remove('floating-resizing');
        const pane = floatingHeader.closest('.player-container-pane');
        if (pane) {
          const iframe = pane.querySelector('iframe');
          if (iframe) iframe.style.pointerEvents = 'auto';
        }
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
    const cardEl = videoCard.querySelector('.video-course-modal-card');
    // Default class
    videoCard.classList.add('active-tab-lessons');
    if (cardEl) cardEl.classList.add('active-tab-lessons');

    videoTabLessonsBtn.onclick = () => {
      videoCard.classList.remove('active-tab-notes');
      videoCard.classList.add('active-tab-lessons');
      if (cardEl) {
        cardEl.classList.remove('active-tab-notes');
        cardEl.classList.add('active-tab-lessons');
      }
      videoTabLessonsBtn.classList.add('active');
      videoTabNotesBtn.classList.remove('active');
    };

    videoTabNotesBtn.onclick = () => {
      videoCard.classList.remove('active-tab-lessons');
      videoCard.classList.add('active-tab-notes');
      if (cardEl) {
        cardEl.classList.remove('active-tab-lessons');
        cardEl.classList.add('active-tab-notes');
      }
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
    empty.textContent = 'No lessons found 🔍';
    fragment.appendChild(empty);
  } else {
    filtered.forEach(v => {
      const isWatched = galaxyWatchedVideos.includes(v.id);
      const isPlaying = galaxyActiveVideoId === v.id;

      const item = document.createElement('div');
      item.className = `video-lesson-item${isWatched ? ' watched' : ''}${isPlaying ? ' playing' : ''}`;
      item.dataset.id = v.id;

      item.innerHTML = `
        <div class="lesson-info-col" style="flex: 1; min-width: 0;">
          <h4 class="lesson-item-title">${escapeHTML(v.shortTitle)}</h4>
          <p class="lesson-item-subtitle">Level A0 • Practice</p>
        </div>
        ${galaxyLessonNotes[v.id] ? '<span class="lesson-note-dot" title="Has notes"></span>' : ''}
        <label class="lesson-watch-checkbox-container" title="Mark as completed" onclick="event.stopPropagation();">
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

  const playerContainer = document.getElementById('activeVideoPlayer');
  if (playerContainer) {
    const savedTimeInit = localStorage.getItem(`galaxy_video_progress_${videoId}`);
    const startTimeInit = savedTimeInit ? parseInt(savedTimeInit, 10) : 0;
    playerContainer.innerHTML = `<div id="ytplayer-container" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:2;"></div>`;
    
    const setupPlayer = () => {
      const savedTime = localStorage.getItem(`galaxy_video_progress_${videoId}`);
      const startTime = savedTime ? parseInt(savedTime, 10) : 0;

      ytPlayer = new YT.Player('ytplayer-container', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        host: 'https://www.youtube.com',
        playerVars: {
          'autoplay': 1,
          'enablejsapi': 1,
          'origin': window.location.origin,
          'widget_referrer': window.location.origin,
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
  if (badge) badge.textContent = `Lesson ${lessonNum}`;
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
      statusEl.textContent = '\ud83d\udcbe Auto-save';
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
      showCourseToast('🎉 Lesson completed! You earned +100 XP.');
    }
    
    // --- GAMIFICATION XP LOGIC ---
    if (window.awardXP) {
      window.awardXP(100, 'video_watched', document.getElementById('galaxyVideoPlayerContainer') || document.querySelector('.galaxy-video-container'));
    }
    // -----------------------------

    // --- DAILY TRACKER (GEMINI SPARKS) ---
    if (typeof window.DailyTracker !== 'undefined' && window.DailyTracker.recordVideoWatched) {
      const lessonObj = GALAXY_COURSE_VIDEOS.find(v => v.id === videoId);
      const lessonTitle = lessonObj ? lessonObj.shortTitle : `Урок видеокурса`;
      const lessonNum = lessonObj ? lessonObj.num : 1;
      window.DailyTracker.recordVideoWatched(videoId, lessonTitle, lessonNum);
    }
    // -------------------------------------
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
