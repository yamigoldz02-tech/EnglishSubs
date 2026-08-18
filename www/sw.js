/**
 * @file sw.js
 * @description PWA Service Worker for AI Lyric-Trainer (Offline-First Cache Engine)
 * Automatically caches HTML, CSS, JavaScript, and datasets for instant offline playback.
 */

const CACHE_NAME = 'ai-lyric-trainer-v3.4.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable.png',
  
  // Stylesheets
  './css/variables.css',
  './css/reset.css',
  './css/app-core.css',
  './css/video-course.css',
  './css/code-editor.css',
  './css/theme-overrides.css',
  './css/dictionary.css',
  './css/modals.css',
  './css/mobile-compact.css',
  './css/notebook.css',
  './css/dashboard.css',
  './css/player.css',
  './css/video-player.css',
  './css/grammar.css',
  './css/gamification.css',
  './css/lyrics-board.css',
  './css/autocomplete.css',
  './css/chat.css',
  './css/sparks.css',
  './css/spotify-widget.css',
  './css/phrase-builder.css',
  './css/animations.css',
  
  // Datasets
  './data/playlist_db.js',
  './data/essentialWords.js',
  
  // Application Modules
  './modules/types.js',
  './modules/modal-templates.js',
  './modules/ui-dialogs.js',
  './modules/songs-data.js',
  './modules/ai-client.js',
  './modules/ai-prefetch.js',
  './modules/ai-sidebar.js',
  './modules/gemini-ai.js',
  './modules/phrase-builder-game.js',
  './modules/lyrics-api.js',
  './modules/modal-helpers.js',
  './modules/shadowing-dictation.js',
  './modules/word-edit-modal.js',
  './modules/events-manager.js',
  './modules/store.js',
  './modules/dict-stats.js',
  './modules/daily-tracker.js',
  './modules/dict-word-card.js',
  './modules/dict-song-examples.js',
  './modules/dict-games.js',
  './modules/dict-modals-manual.js',
  './modules/dict-leitner-engine.js',
  './modules/dict-flashcard-3d.js',
  './modules/dict-session-manager.js',
  './modules/dictionary-trainer.js',
  './modules/spotify-controller.js',
  './modules/grammar-rules.js',
  './modules/notebook-module.js',
  './modules/galaxy-course.js',
  './modules/gamification.js',
  './modules/playlist-manager.js',
  './modules/subtitles-engine.js',
  './sync-manager.js',
  './app-back-button.js',
  './app.js'
];

// Install event: cache all local assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline assets...');
      return cache.addAll(PRECACHE_ASSETS.map(url => new Request(url, { cache: 'reload' }))).catch(err => {
        console.warn('[ServiceWorker] Some non-critical assets failed to precache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event: purge old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache version:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Stale-While-Revalidate with Cache-First for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass cache for external cloud APIs and non-GET requests
  if (
    event.request.method !== 'GET' ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('spotify.com') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('googlevideo.com') ||
    url.hostname.includes('openrouter.ai')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      // Background network refresh (Stale-While-Revalidate)
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline network fallback
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
