/**
 * @AI-SECTION: SHADOWING_DICTATION_ENGINE
 * @file modules/shadowing-dictation.js
 * @description Extracted Audio Dictation (Shadowing Mode) Engine & Utilities.
 */

/* ==========================================================================
   6. Audio Dictation (Shadowing Mode) Engine & Utilities
   ========================================================================== */

export let activeDictationOriginal = '';
export let activeDictationTranslation = '';

export function playHiddenPhrase(text) {
  if (!window.speechSynthesis) {
    console.error("SpeechSynthesis API is not supported in this browser.");
    return;
  }
  // Stop current speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Find a suitable English voice
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find(v => v.lang.startsWith('en-US') || v.lang.startsWith('en-GB') || v.lang.startsWith('en'));
  if (enVoice) {
    utterance.voice = enVoice;
  }
  
  utterance.rate = 0.95; // Natural speed, highly clear
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

export function initAudioDictation(originalText, translation) {
  const container = document.getElementById('audio-dictation');
  if (!container) return;
  
  if (!originalText || originalText === "No valid lines" || originalText.trim() === "") {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  
  activeDictationOriginal = originalText;
  activeDictationTranslation = translation || 'English phrase from the song';
  // Expose to window for app.js backwards compatibility
  window.activeDictationOriginal = activeDictationOriginal;
  window.activeDictationTranslation = activeDictationTranslation;
  
  const inputEl = document.getElementById('dictationInput');
  const checkBtn = document.getElementById('dictationCheckBtn');
  const feedbackEl = document.getElementById('dictationFeedback');
  const hintBtn = document.getElementById('dictationHintBtn');
  
  if (inputEl) {
    inputEl.value = '';
    inputEl.style.borderColor = 'rgba(255,255,255,0.12)';
  }
  if (checkBtn) {
    checkBtn.disabled = true;
    checkBtn.style.opacity = '0.5';
  }
  if (feedbackEl) {
    feedbackEl.style.display = 'none';
    feedbackEl.innerHTML = '';
  }
  if (hintBtn) {
    hintBtn.textContent = '💡 Hint';
    hintBtn.disabled = false;
  }
}

export function normalizeTextForComparison(text) {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"’]/g, "") // strip all punctuation
    .replace(/\s+/g, " ")                           // collapse multiple spaces
    .trim();
}

export function showArtistSongsModal(artistNameText) {
  const modal = document.getElementById('artistSongsModal');
  const modalTitle = document.getElementById('artistSongsModalTitle');
  const songsListContainer = document.getElementById('artistSongsList');
  const closeBtn = document.getElementById('closeArtistSongsModalBtn');

  if (!modal || !modalTitle || !songsListContainer) return;

  const cleanArtist = artistNameText.trim();
  modalTitle.textContent = cleanArtist;
  songsListContainer.innerHTML = '';

  // Get all songs (both hardcoded standard songs and dynamically loaded CSV banya songs)
  const hardcoded = [
    { id: 'scorpions', title: 'Wind of Change', artist: 'Scorpions', genre: 'Classic Rock', art: 'SC' },
    { id: 'metallica', title: 'Nothing Else Matters', artist: 'Metallica', genre: 'Heavy Metal', art: 'ME' },
    { id: 'rhcp', title: 'Californication', artist: 'Red Hot Chili Peppers', genre: 'Alternative Rock', art: 'RH' }
  ];
  
  const combined = [...hardcoded, ...(csvSongs || [])];
  const allSongs = [];
  const seenTitles = new Set();
  
  combined.forEach(song => {
    const titleKey = song.title.toLowerCase().trim();
    if (!seenTitles.has(titleKey)) {
      seenTitles.add(titleKey);
      allSongs.push(song);
    }
  });
  
  // Filter songs by artist (case-insensitive)
  const artistSongs = allSongs.filter(song => 
    song.artist && song.artist.toLowerCase() === cleanArtist.toLowerCase()
  );

  if (artistSongs.length === 0) {
    songsListContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-style: italic;">
        No other songs by this artist are currently loaded. You can load a song manually via the search!
      </div>
    `;
  } else {
    artistSongs.forEach(song => {
      // Build a premium card for each song
      const card = document.createElement('div');
      card.className = 'artist-song-item';
      
      const titleSpan = `<span style="font-weight: 700; color: var(--text-main); font-size: 0.9rem; display: block;">${song.title}</span>`;
      const genreSpan = `<span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">${song.genre || 'Music'}</span>`;
      const actionArrow = `<span style="color: var(--accent-spotify); font-weight: 800; font-size: 1rem;">→</span>`;

      card.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px;">
          ${titleSpan}
          ${genreSpan}
        </div>
        ${actionArrow}
      `;

      // Onclick loads the song and closes the modal
      card.onclick = () => {
        modal.style.display = 'none';
        
        if (typeof window.selectSongFromDropdown === 'function') {
          window.selectSongFromDropdown(song);
        } else if (typeof loadSongByKey === 'function') {
          loadSongByKey(song.id);
        }
      };

      songsListContainer.appendChild(card);
    });
  }

  // Open modal overlay
  openModalEl(modal);

  // Wire close actions
  const hideModal = () => {
    modal.style.display = 'none';
  };

  closeBtn.onclick = hideModal;
  // Backdrop click intentionally disabled — use the close button (✕) to dismiss
}

// Expose globally for backward compatibility with app.js and HTML inline handlers
window.playHiddenPhrase = playHiddenPhrase;
window.initAudioDictation = initAudioDictation;
window.normalizeTextForComparison = normalizeTextForComparison;
window.showArtistSongsModal = showArtistSongsModal;
