/**
 * @AI-SECTION: TYPES_JSDOC
 * @file modules/types.js
 * @description Centralized JSDoc type definitions for AI Lyric-Trainer.
 * Inclusion of this script in HTML or importing via IDE provides autocompletion
 * and type checking across Vanilla JavaScript files without TypeScript compilation.
 */

/**
 * @typedef {Object} WordEntry
 * @property {string} word - The English word or phrase.
 * @property {string} translation - Russian translation.
 * @property {string} context - The original song lyric or sentence where the word appeared.
 * @property {string} category - Custom or built-in category (e.g., 'Глаголы', 'Общее', 'Идиомы').
 * @property {'word'|'phrase'} type - Whether the entry is a single word or multi-word phrase.
 * @property {number} interval - Current Spaced Repetition (Leitner/SM-2) interval in days.
 * @property {number} nextReview - Unix timestamp (ms) when the word is next scheduled for review.
 * @property {number} level - Mastery level (0 to 5+).
 * @property {number} [lastReviewed] - Unix timestamp (ms) of last review session.
 */

/**
 * @typedef {Object} SubtitleLine
 * @property {number} start - Start timestamp in seconds (e.g., 12.5).
 * @property {number} end - End timestamp in seconds (e.g., 15.8).
 * @property {string} eng - English subtitle text.
 * @property {string} rus - Russian subtitle text.
 */

/**
 * @typedef {Object} Song
 * @property {string} id - Unique song identifier (e.g., 'scorpions_wind_of_change').
 * @property {string} title - Song track title.
 * @property {string} artist - Artist or band name.
 * @property {string} [audioUrl] - Direct URL or local path to audio file.
 * @property {string} [videoUrl] - Direct URL or local path to video file.
 * @property {string} [youtubeId] - YouTube Video ID for iframe embedded playback.
 * @property {string} [coverUrl] - Cover art image URL.
 * @property {Array<SubtitleLine>} lines - Array of synchronized subtitle timestamps and text.
 */

/**
 * @typedef {Object} GalaxyLesson
 * @property {number} id - Lesson number (1 to 50).
 * @property {string} title - Lesson topic title.
 * @property {string} youtubeId - YouTube Video ID for the lesson.
 * @property {boolean} [completed] - Whether the user has marked this lesson as completed.
 * @property {number} [progress] - Watch progress percentage (0 to 100).
 */

/**
 * @typedef {Object} NoteEntry
 * @property {string} id - Unique note ID (timestamp or UUID).
 * @property {string} title - Note heading or lesson reference.
 * @property {string} content - Markdown or plain text note content.
 * @property {number} updatedAt - Unix timestamp (ms) of last edit.
 * @property {string} [lessonId] - Associated Galaxy lesson ID if applicable.
 */

/**
 * @typedef {Object} SyncPayload
 * @property {Array<WordEntry>} personalDictionary - User vocabulary list.
 * @property {Object<string, string>} settings - User preferences and theme settings.
 * @property {Object<string, NoteEntry>} notes - Saved notebook entries.
 * @property {Array<number>} completedLessons - IDs of completed Galaxy lessons.
 * @property {number} timestamp - Cloud backup creation timestamp.
 */

export default {};
