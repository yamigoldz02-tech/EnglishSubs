// @ts-check
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - SONG EXAMPLES ENGINE
 * Searches songsData for lyric lines containing a given word/phrase
 * and formats them as highlighted HTML examples.
 * @AI-SECTION: SONG_EXAMPLES_ENGINE
 * ============================================================================
 */

/**
 * Search all loaded songs for up to 3 lyric lines matching a word.
 * Prioritizes the currently playing song, then diversifies across different songs.
 * @param {string} word - The word or phrase to search for.
 * @returns {Array<{text: string, translation: string, songTitle: string, artist: string}>}
 */
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

/**
 * Format the examples array into a high-fidelity visual HTML block.
 * @param {string} word - The word to highlight in examples.
 * @param {Array<{text: string, translation: string, songTitle: string, artist: string}>} examples
 * @returns {string} HTML string
 */
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
