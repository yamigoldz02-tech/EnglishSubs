// @ts-check
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - GEMINI AI CLIENT & CACHE ENGINE
 * Core API network requests to Google Gemini 1.5 Flash, robust JSON parsing,
 * cache versioning, and response normalization.
 * @AI-SECTION: AI_CLIENT_ENGINE
 * ============================================================================
 */

export function getAPIKey() {
  const customKey = localStorage.getItem('user_api_key');
  if (customKey && customKey.trim().length > 0) {
    return customKey.trim();
  }
  return '';
}

export function hasAPIKey() {
  return getAPIKey().length > 0;
}

export function requireAPIKey() {
  if (!hasAPIKey()) {
    throw new Error('API key required. Add your OpenRouter or Gemini key in settings.');
  }
}

// In-Memory cache for lightning-fast lookups (synchronized with persistent localStorage)
export const analysisCache = {};
export const songMeaningCache = {};

export function initAnalysisCache() {
  try {
    const CACHE_VERSION_KEY = 'ai_lyric_cache_version_new';
    const CURRENT_CACHE_VERSION = 'v2.4.2';
    if (localStorage.getItem(CACHE_VERSION_KEY) !== CURRENT_CACHE_VERSION) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('lyric_cache_') || key.startsWith('gemini_') || key.startsWith('analysis_'))) {
          localStorage.removeItem(key);
        }
      }
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);
    }

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('lyric_cache_')) {
        const stanzaText = key.replace('lyric_cache_', '');
        const val = localStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (parsed && typeof parsed === 'object' && parsed.translation && parsed.translation.trim().length > 0) {
              analysisCache[stanzaText] = parsed;
            } else {
              localStorage.removeItem(key);
            }
          } catch (err) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  } catch (e) {
    console.error("[AIClient] Failed to initialize analysisCache:", e);
  }
}

export function getCachedAnalysis(text) {
  if (analysisCache[text]) return analysisCache[text];
  try {
    const val = localStorage.getItem('lyric_cache_' + text);
    if (val) {
      const parsed = JSON.parse(val);
      analysisCache[text] = parsed;
      return parsed;
    }
  } catch (e) {}
  return null;
}

export function setCachedAnalysis(text, data) {
  analysisCache[text] = data;
  try {
    localStorage.setItem('lyric_cache_' + text, JSON.stringify(data));
  } catch (e) {}
}

export function getCachedSongMeaning(songTitle, artistName) {
  const key = `song_meaning_${artistName}_${songTitle}`.toLowerCase();
  if (songMeaningCache[key]) return songMeaningCache[key];
  try {
    const val = localStorage.getItem(key);
    if (val) {
      const parsed = JSON.parse(val);
      songMeaningCache[key] = parsed;
      return parsed;
    }
  } catch (e) {}
  return null;
}

export function setCachedSongMeaning(songTitle, artistName, data) {
  const key = `song_meaning_${artistName}_${songTitle}`.toLowerCase();
  songMeaningCache[key] = data;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getAPIKey = getAPIKey;
  window.hasAPIKey = hasAPIKey;
  window.requireAPIKey = requireAPIKey;
  window.initAnalysisCache = initAnalysisCache;
  window.getCachedAnalysis = getCachedAnalysis;
  window.setCachedAnalysis = setCachedAnalysis;
  window.getCachedSongMeaning = getCachedSongMeaning;
  window.setCachedSongMeaning = setCachedSongMeaning;
}
