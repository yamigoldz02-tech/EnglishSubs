# AI LYRIC-TRAINER: AI & DEVELOPER ARCHITECTURE MAP (AGENTS.md)

This document is the authoritative navigation and architecture map for AI assistants (Gemini, Cursor, Copilot, etc.) and human developers working on **AI Lyric-Trainer**. Always consult this file first before scanning large source code files.

---

## 1. Project Overview & Core Mission
**AI Lyric-Trainer** is a modern, interactive English learning web application that combines music, video subtitles, spaced-repetition vocabulary training, shadowing dictation, and structured grammar/video lessons (English Galaxy).

- **Technology Stack:** Pure Vanilla JavaScript (ES6+), HTML5, and Vanilla CSS. No external bundlers (Webpack/Vite) or CSS frameworks (Tailwind/Bootstrap) are used.
- **Mobile Runtime (Capacitor):** The mobile application (iOS/Android) is built as a hybrid native app wrapped with **Ionic Capacitor**. It executes inside a native WebView. Mobile back-button navigation and hardware events are handled via `app-back-button.js` and responsive mobile viewports (`mobile-compact.css`).
- **Offline & Protocol Compatibility:** Fully supports offline execution via `file://`, `capacitor://`, and `http://localhost` protocols. All network requests (Firebase, Gemini API, YouTube iframe, Spotify PKCE) degrade gracefully without throwing uncaught exceptions when offline.

---

## 2. Directory & File Structure
```text
c:/Users/svato/EnglishSub/
├── index.html               # Main application layout, modals, SVG icons, and container DOM (1580+ lines)
├── styles.css               # Primary design system (Vanilla CSS, 5200+ lines, table of contents at line 1)
├── mobile-compact.css       # Responsive compact rules for mobile viewports
├── app.js                   # Main application core logic (12400+ lines, indexed by TOC at line 1)
├── sync-manager.js          # Offline-first Firebase Firestore cloud backup & localStorage interception
├── app-back-button.js       # Back-button navigation handler for mobile and browser history
├── essentialWords.js        # Built-in vocabulary dataset (Essential Words 3000)
├── playlist_db.js           # Built-in songs and video playlists dataset
├── modules/                 # Modular subsystems and JSDoc type definitions
│   ├── types.js             # JSDoc @typedef annotations for IDE intellisense & AI type checking
│   ├── spotify-controller.js# Spotify Now Playing & Auto-Pause PKCE integration (Extracted from app.js)
│   ├── grammar-rules.js     # Interactive grammar rules & exercises engine (Extracted from app.js)
│   ├── notebook-module.js   # Global notes & video-lesson notes controller (Extracted from app.js)
│   └── galaxy-course.js     # English Galaxy A0 course tracker (50 lessons) (Extracted from app.js)
├── scripts-archive/         # Archive of legacy one-off helper scripts (fix-*.js, bump*.js, etc.)
└── changelog.md / _archive  # Architectural guidelines and project version history
```

---

## 3. Global State Variables & Architecture
The project relies on key global variables accessible on `window` and within standard script scopes:

- `personalDictionary` (Array<WordEntry>): The user's vocabulary list, managed via spaced repetition (Leitner/SM-2 intervals). Persisted in `localStorage` under `my_personal_dictionary`.
- `songsData` (Object<string, Song>): Dictionary of loaded songs, where key is song ID and value contains audio/video URLs and timed subtitle lines.
- `activeEngLine` / `activeRusLine` (string): Current active subtitle text rendered in the player and available for phrase building.
- `currentUser` / `SyncManager`: Firebase auth state and cloud backup engine. Notice: `localStorage.setItem` is globally wrapped in `sync-manager.js` to automatically trigger debounced cloud synchronization (`scheduleCloudSync()`).

---

## 4. Key Subsystems & Event Flow
1. **Video Player & Timestamps:** Supports both HTML5 local video/audio (`#videoPlayer`) and YouTube Iframe API (`#youtubePlayer`). Subtitle synchronization is calculated in real-time via timeupdate listeners.
2. **Vocabulary & Flashcards:** Users click words in subtitles to add them to `personalDictionary`. The 3D Flashcard trainer tests recall using Leitner intervals (`interval`, `nextReview`).
3. **Shadowing Dictation Mode:** Audio dictation engine that compares user spoken/typed input against `activeDictationOriginal`.
4. **AI Integration (Gemini API):** Live AI integration allowing custom prompt generation and grammatical breakdowns of song lyrics using Google Gemini 1.5 Flash models.

---

## 5. Coding & Architectural Rules for AI
When modifying this codebase, AI assistants MUST strictly adhere to the following rules:
1. **No External Frameworks:** Never introduce Tailwind CSS, jQuery, React, or build steps. Use standard Vanilla CSS and native DOM APIs.
2. **Preserve Existing Documentation:** Do not strip inline comments or section headers. They serve as navigation markers for developers.
3. **Non-Blocking Error Handling:** Never use `alert()`, `confirm()`, or `prompt()` for error reporting or network failures. Use `console.warn`/`console.error` and custom UI toast notifications (`showToast`, `showSyncNotice`).
4. **DOM Element Null-Checking:** Always check if a DOM element exists before attaching event listeners or updating `.innerHTML`/`.textContent` (e.g., `const btn = document.getElementById(...); if (btn) { ... }` or use optional chaining `btn?.addEventListener(...)`).
5. **Respect CSS Variables:** Use pre-defined CSS design tokens from `:root` in `styles.css` (e.g., `var(--accent-spotify)`, `var(--text-main)`, `var(--bg-card)`). Avoid hardcoded hex colors unless designing a standalone branded widget.
