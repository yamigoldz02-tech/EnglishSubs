// @ts-check
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - MODAL TEMPLATES REGISTRY
 * Self-contained HTML templates for all application modals.
 * Injected into DOM synchronously on startup to keep index.html lean while
 * maintaining 100% offline (file:// & Capacitor) compatibility.
 * @AI-SECTION: MODAL_TEMPLATES
 * ============================================================================
 */

export const ALL_MODALS_HTML = `
<!-- API Settings Modal -->
  <div class="modal-overlay" id="settingsModal" style="display: none;">
    <div class="modal-card" style="max-width: 480px; width: 95%;">
      <div class="modal-header">
        <h3 style="display: flex; align-items: center; gap: 8px;"><svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> App Settings</h3>
        <button class="modal-close-btn" id="closeSettingsBtn" >✕</button>
      </div>
      <div class="modal-body" style="display: flex; flex-direction: column; gap: 18px; max-height: 70vh; overflow-y: auto; text-align: left; padding: 20px;">
        
        <!-- Section 1: API Key -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 14px; border-radius: 12px; display: flex; flex-direction: column; gap: 8px;">
          <h4 style="margin: 0 0 4px 0; color: var(--accent-spotify); font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; gap: 6px;">🔑 API Key for AI Analysis</h4>
          <p style="margin: 0; font-size: 0.78rem; color: var(--text-sub); line-height: 1.4;">
            Used for AI analysis via OpenRouter or Gemini API.
          </p>
          <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 4px;">
            <input type="password" id="apiKeyInput" placeholder="Paste sk-or-... or AIzaSy..." autocomplete="off" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 8px 12px; color: var(--text-main); font-size: 0.85rem; outline: none;">
          </div>
          <div class="modal-status" id="apiStatusMessage" style="font-size: 0.75rem; margin-top: 4px; display: none;"></div>
        </div>

        <!-- Section 2: Hotkeys & Shortcuts -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 14px; border-radius: 12px; display: flex; flex-direction: column; gap: 12px;">
          <h4 style="margin: 0 0 2px 0; color: #a78bfa; font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; gap: 6px;">📓 Notebook Shortcut</h4>
          
          <!-- Keyboard Hotkey Configuration -->
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase;"><svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M6 12h.01"/><path d="M10 12h.01"/><path d="M14 12h.01"/><path d="M18 12h.01"/><path d="M7 16h10"/></svg> Keyboard hotkey:</label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button id="notebookHotkeyRecorder" style="flex-grow: 1; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 10px; color: var(--text-main); font-size: 0.85rem; font-weight: 600; cursor: pointer; text-align: center; outline: none; transition: all 0.2s;" title="Click to set a key">
                Press to record...
              </button>
              <button id="notebookHotkeyClear" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; border-radius: 10px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;" title="Reset key">✕</button>
            </div>
            <span style="font-size: 0.68rem; color: var(--text-muted);">Instantly open and close the notebook with a key press (e.g., Alt+N, F4, or N).</span>
          </div>

          <!-- Mouse Trigger Configuration -->
          <div style="display: flex; flex-direction: column; gap: 6px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase;">🖱️ Mouse quick action:</label>
            <select id="notebookMouseTriggerSelect" style="width: 100%; height: 38px; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 0 10px; color: var(--text-main); font-size: 0.85rem; outline: none; box-sizing: border-box; cursor: pointer;">
              <option value="none">❌ Disabled (tab click only)</option>
              <option value="middle">🖱️ Middle mouse button (scroll wheel)</option>
              <option value="dblclick">🖱️ Double-click on page background</option>
            </select>
            <span style="font-size: 0.68rem; color: var(--text-muted);">Mouse quick action to toggle the notebook from anywhere.</span>
          </div>

        </div>

        <!-- Section 3: Spotify Auto-Pause -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 14px; border-radius: 12px; display: flex; flex-direction: column; gap: 8px;">
          <h4 style="margin: 0 0 4px 0; color: #1db954; font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; gap: 6px;">🎧 Spotify Auto-Pause</h4>
          <p style="margin: 0; font-size: 0.78rem; color: var(--text-sub); line-height: 1.4;">
            Automatically pauses Spotify when watching video lessons and resumes it when video is paused.
          </p>
          <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 4px;">
            <input type="text" id="spotifyClientIdInput" placeholder="Enter Spotify Client ID..." autocomplete="off" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 8px 12px; color: var(--text-main); font-size: 0.85rem; outline: none;">
          </div>
          <button id="spotifyConnectBtn" style="background: #1db954; color: #000; border: none; font-weight: 700; border-radius: 20px; padding: 8px 16px; margin-top: 4px; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 6px; box-shadow: 0 4px 10px rgba(29, 185, 84, 0.2); transition: all 0.2s;">
            <span>Connect Spotify</span>
          </button>
          <div id="spotifyStatusMessage" style="font-size: 0.75rem; margin-top: 2px; color: #a78bfa; display: none;"></div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 6px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06);">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">Spotify Auto-Pause</span>
              <span style="font-size: 0.68rem; color: var(--text-muted);">Pause Spotify during video playback and resume when paused.</span>
            </div>
            <label class="switch">
              <input type="checkbox" id="spotifyAutoPauseToggle" checked>
              <span class="slider"></span>
            </label>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 6px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06);">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">Now Playing</span>
              <span style="font-size: 0.68rem; color: var(--text-muted);">Show a widget with the current Spotify track in the corner of the screen.</span>
            </div>
            <label class="switch">
              <input type="checkbox" id="spotifyNowPlayingToggle" checked>
              <span class="slider"></span>
            </label>
          </div>
        </div>
        <!-- Section 4: Dictionary Options -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 14px; border-radius: 12px; display: flex; flex-direction: column; gap: 8px;">
          <h4 style="margin: 0 0 4px 0; color: #fbbf24; font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; gap: 6px;">📚 Dictionary Settings</h4>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">Capitalize first letter</span>
              <span style="font-size: 0.68rem; color: var(--text-muted);">Automatically capitalize the first letter when adding to the dictionary.</span>
            </div>
            <label class="switch">
              <input type="checkbox" id="dictionaryCapitalizeToggle" checked>
              <span class="slider"></span>
            </label>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06);">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">Архивировать словарь</span>
              <span style="font-size: 0.68rem; color: var(--text-muted);">Отложить все текущие слова и фразы в скрытую папку «Старые» и начать новый словарь.</span>
            </div>
            <button id="archiveDictionaryBtn" onclick="window.archiveCurrentDictionaryToOldWords(true)" style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); color: #fbbf24; border-radius: 10px; padding: 6px 12px; font-size: 0.78rem; font-weight: 700; cursor: pointer; white-space: nowrap; outline: none; transition: all 0.2s;">
              📦 В «Старые»
            </button>
          </div>
        </div>

        <!-- Section 5: Notebook Settings -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 14px; border-radius: 12px; display: flex; flex-direction: column; gap: 8px;">
          <h4 style="margin: 0 0 4px 0; color: #3b82f6; font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; gap: 6px;">📝 Notebook Settings</h4>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">Show Line Numbers</span>
              <span style="font-size: 0.68rem; color: var(--text-muted);">Display line numbers on the left side of notes.</span>
            </div>
            <label class="switch">
              <input type="checkbox" id="notebookLineNumbersToggle" checked>
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <!-- Section 6: Performance Options -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 14px; border-radius: 12px; display: flex; flex-direction: column; gap: 8px;">
          <h4 style="margin: 0 0 4px 0; color: #10b981; font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; gap: 6px;">⚡ Performance</h4>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">GPU Saver Mode</span>
              <span style="font-size: 0.68rem; color: var(--text-muted);">Disable background blur to improve performance on weaker GPUs.</span>
            </div>
            <label class="switch">
              <input type="checkbox" id="performanceToggle">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <!-- Section 5: Backup & Restore -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 14px; border-radius: 12px; display: flex; flex-direction: column; gap: 8px;">
          <h4 style="margin: 0 0 4px 0; color: #3b82f6; font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; gap: 6px;">💾 Backup & Transfer</h4>
          <p style="margin: 0; font-size: 0.68rem; color: var(--text-muted); line-height: 1.45;">
            Save a backup of your learning progress to a file or transfer it to another device.
          </p>
          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <button id="exportBackupBtn" class="modal-btn" style="flex-grow: 1; margin: 0; padding: 8px 12px; font-size: 0.78rem; font-weight: 700; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.25); color: #3b82f6; border-radius: 10px; cursor: pointer; transition: all 0.2s; outline: none;">
              📥 Export (Save)
            </button>
            <button id="importBackupBtn" class="modal-btn" style="flex-grow: 1; margin: 0; padding: 8px 12px; font-size: 0.78rem; font-weight: 700; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); color: #10b981; border-radius: 10px; cursor: pointer; transition: all 0.2s; outline: none;">
              📤 Import (Load)
            </button>
          </div>
          <input type="file" id="importBackupFileInput" accept=".json" style="display: none;">
          <div id="backupStatusMessage" class="modal-status" style="font-size: 0.75rem; margin-top: 4px; display: none;"></div>
        </div>

        <!-- Section 6: Cloud Synchronization -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 14px; border-radius: 12px; display: flex; flex-direction: column; gap: 8px;">
          <h4 style="margin: 0 0 4px 0; color: #f43f5e; font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; gap: 6px;">☁️ Cloud Sync (PC & Phone)</h4>
          <p style="margin: 0; font-size: 0.68rem; color: var(--text-muted); line-height: 1.45;">
            Sync progress between your PC and phone. On PC, sign in with Google, then enter the code on your phone.
          </p>
          
          <div id="syncAuthContainer" style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
            <!-- Not logged in state -->
            <div id="syncNotLoggedContainer" style="display: flex; flex-direction: column; gap: 8px;">
              <button id="syncGoogleLoginBtn" class="modal-btn" style="padding: 8px 12px; font-size: 0.78rem; font-weight: 700; background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.25); color: #f43f5e; border-radius: 10px; cursor: pointer; transition: all 0.2s; outline: none; display: flex; align-items: center; justify-content: center; gap: 6px;">
                Sign in with Google (on PC)
              </button>
              <div style="display: flex; gap: 6px; align-items: stretch;">
                <input type="text" id="syncCodeInput" placeholder="Transfer code (for phone)" autocomplete="off" style="flex-grow: 1; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 8px 12px; color: var(--text-main); font-size: 0.8rem; outline: none; min-width: 0;">
                <button id="syncLinkCodeBtn" class="modal-btn" style="padding: 0 14px; font-size: 0.78rem; font-weight: 700; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); color: #10b981; border-radius: 10px; cursor: pointer; outline: none; flex-shrink: 0;">
                  Link
                </button>
              </div>
            </div>
            
            <!-- Logged in state -->
            <div id="syncLoggedInContainer" style="display: none; flex-direction: column; gap: 8px;">
              <div style="font-size: 0.8rem; color: var(--text-main); display: flex; flex-direction: column; gap: 4px;">
                <span>Signed in as: <strong id="syncUserEmail" style="color: #f43f5e;">...</strong></span>
                <span id="syncCodeDisplayContainer" style="display: none;">Your phone code: <strong id="syncUserCode" style="background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px; user-select: all; font-family: monospace; display: inline-block; margin-top: 2px;">...</strong></span>
              </div>
              <button id="syncLogoutBtn" class="modal-btn" style="padding: 6px 12px; font-size: 0.75rem; font-weight: 600; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: var(--text-main); border-radius: 10px; cursor: pointer; transition: all 0.2s; outline: none; align-self: flex-start;">
                Sign Out / Unlink
              </button>
            </div>
          </div>
        </div>

      </div>
      <div class="modal-footer" style="padding: 12px 24px; border-top: 1px solid rgba(255,255,255,0.05);">
        <button class="modal-btn secondary-btn" id="resetApiKeyBtn" style="margin: 0;">Reset All</button>
        <button class="modal-btn primary-btn" id="saveApiKeyBtn" style="margin: 0; background: var(--accent-spotify); color: #000;">Save Settings</button>
      </div>
    </div>
  </div>

  <!-- Edit Lyrics Modal -->
  <div class="modal-overlay" id="editLyricsModal" style="display: none;">
    <div class="modal-card" style="max-width: 600px;">
      <div class="modal-header">
        <h3>📝 Edit Song Lyrics</h3>
        <button class="modal-close-btn" id="closeEditLyricsBtn" >✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.85rem; color: var(--text-sub); margin-bottom: 1.25rem;">
          You can fix typos or paste the correct lyrics from Spotify or Genius.
          Each blank line separates the text into verses (3-4 lines each).
        </p>
        
        <div class="form-group" style="margin-bottom: 0px;">
          <label for="editLyricsTextarea">Song lyrics:</label>
          <textarea id="editLyricsTextarea" placeholder="Enter or paste English song lyrics..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="modal-btn secondary-btn" id="cancelEditLyricsBtn">Cancel</button>
        <button class="modal-btn primary-btn" id="saveEditLyricsBtn">Save изменения</button>
      </div>
    </div>
  </div>

  <!-- [Dictionary & Learning Modals moved to modules/modal-templates-dict.js] -->
  <!-- Artist Songs Modal -->

  <div class="modal-overlay" id="artistSongsModal" style="display: none; z-index: 10090;">
    <div class="modal-card" style="max-width: 480px; width: 90%; height: 500px; display: flex; flex-direction: column; overflow: hidden; padding: 20px; box-sizing: border-box;">
      <div class="modal-header" style="flex-shrink: 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 12px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; width: 100%; box-sizing: border-box;">
        <div>
          <span style="font-size: 0.72rem; font-weight: 700; color: var(--accent-spotify); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px;">Исполнитель</span>
          <h3 id="artistSongsModalTitle" style="margin: 0; font-size: 1.25rem; color: var(--text-main); font-weight: 800; font-family: var(--font-display);">Артист</h3>
        </div>
        <button class="modal-close-btn" id="closeArtistSongsModalBtn"  style="background: none; border: none; color: var(--text-sub); font-size: 1.2rem; cursor: pointer; outline: none; margin: 0; padding: 4px;">✕</button>
      </div>
      
      <!-- Modal Content: Scrollable list of songs -->
      <div class="modal-body" id="artistSongsList" style="flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; width: 100%; box-sizing: border-box; padding-right: 4px;">
        <!-- Dynamically filled with song elements -->
      </div>
    </div>
  </div>

  <!-- AI Roleplay Modal -->
  <div class="modal-overlay" id="roleplayModal" style="display: none; z-index: 10200;">
    <div class="modal-card" style="max-width: 420px; width: 90%; height: 500px; display: flex; flex-direction: column; box-sizing: border-box; padding: 0; overflow: hidden; border-radius: 20px;">
      
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; box-sizing: border-box; padding: 14px 20px; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0;">
        <div style="display: flex; flex-direction: column; text-align: left;">
          <h4 style="margin: 0; font-weight: 700; color: var(--text-main); font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
            💬 AI Roleplay
          </h4>
          <span style="font-size: 0.72rem; color: var(--accent-spotify); margin-top: 1px; font-weight: 600;">Фраза: <strong id="roleplayTargetWord" style="color: var(--text-main);">target phrase</strong></span>
        </div>
        <button class="modal-close-btn" id="closeRoleplayModalBtn"  style="background: none; border: none; color: var(--text-sub); font-size: 1.2rem; cursor: pointer; outline: none; margin: 0; padding: 0;">✕</button>
      </div>

      <!-- Messages Area -->
      <div id="roleplayChatBody" style="flex-grow: 1; overflow-y: auto; padding: 16px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; background: rgba(0,0,0,0.1); scrollbar-width: thin;">
        <!-- Dynamic Telegram/iMessage bubbles -->
      </div>

      <!-- Input controls bar -->
      <div style="display: flex; gap: 8px; align-items: center; width: 100%; box-sizing: border-box; padding: 12px 16px; background: rgba(255,255,255,0.01); border-top: 1px solid rgba(255,255,255,0.08); flex-shrink: 0;">
        <input type="text" id="roleplayChatInput" placeholder="Введите ваш ответ на английском..." style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: var(--text-main); font-size: 0.82rem; outline: none; flex-grow: 1; border-radius: 20px; padding: 8px 16px; height: 38px; box-sizing: border-box;">
        <button id="sendRoleplayMsgBtn" style="background: var(--accent-spotify); border: none; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; outline: none; flex-shrink: 0; box-shadow: 0 4px 10px rgba(29,185,84,0.25);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>

      <!-- Finish active button -->
      <div id="roleplayFinishContainer" style="display: none; justify-content: center; width: 100%; box-sizing: border-box; padding: 10px 16px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.08); flex-shrink: 0;">
        <button id="finishRoleplayBtn" class="modal-btn" style="background: #f59e0b; color: #000000; font-weight: 700; border: none; border-radius: 20px; padding: 6px 20px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(245,158,11,0.25); outline: none; width: 100%;">
          🎉 Завершить практику (+15 очков)
        </button>
      </div>

    </div>
  </div>

  <!-- Video Course Modal -->
  <div class="modal-overlay" id="videoCourseModal" style="display: none; z-index: 10050;">
    <div class="modal-card video-course-modal-card">
      <div class="modal-header">
        <h3 style="margin: 0; font-weight: 700; color: var(--text-main); font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
          🎬 Video Course English Galaxy
        </h3>
        <button class="modal-close-btn" id="closeVideoCourseModalBtn" >✕</button>
      </div>

      <!-- Course Progress Bar inside Modal -->
      <div class="video-course-progress-panel">
        <div class="progress-details">
          <span class="progress-percent">Прогресс курса: <strong id="modalWatchedCount">0</strong> / 50 уроков (<strong id="modalWatchedPercent">0%</strong>)</span>
        </div>
        <div class="progress-track">
          <div id="modalProgressBar" class="progress-bar-fill"></div>
        </div>
      </div>

      <!-- Mobile Course Tabs -->
      <div class="mobile-course-tabs" id="mobileCourseTabs" style="display: none;">
        <button class="course-tab-btn active" id="videoTabLessonsBtn">📋 Список уроков</button>
        <button class="course-tab-btn" id="videoTabNotesBtn">🎬 Видео и заметки</button>
      </div>

      <div class="video-course-body">
        <!-- Left: Lessons List & Attached Search/Filters -->
        <div class="lessons-sidebar">
          <!-- Controls: Filter & Search glued directly to the lessons list -->
          <div class="video-course-controls">
            <div class="filter-pills">
              <button class="filter-pill active" data-filter="all">Все</button>
              <button class="filter-pill" data-filter="unwatched">Непройденные</button>
              <button class="filter-pill" data-filter="watched">Пройденные</button>
            </div>
            <div class="search-box-wrapper">
              <svg class="search-box-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" id="videoSearchInput" placeholder="Поиск урока..." autocomplete="off">
              <button id="clearVideoSearchBtn" class="clear-video-search" style="display: none;">✕</button>
            </div>
          </div>

          <div id="videoLessonsList" class="lessons-list">
            <!-- Dynamic elements will be injected here -->
          </div>
        </div>

        <!-- Right: Player Container -->
        <div class="player-container-pane">
          <!-- Resize handles (only functional when minimized) -->
          <div id="floatingResizeHandleTopLeft" class="floating-resize-handle top-left-handle" style="display: none;" title="Зажмите и тяните для изменения размера"></div>
          <div id="floatingResizeHandleBottomRight" class="floating-resize-handle bottom-right-handle" style="display: none;" title="Зажмите и тяните для изменения размера"></div>
          <div id="floatingResizeHandleLeft" class="floating-resize-handle left-handle" style="display: none;"></div>
          <div id="floatingResizeHandleTop" class="floating-resize-handle top-handle" style="display: none;"></div>
          <div id="floatingResizeHandleRight" class="floating-resize-handle right-handle" style="display: none;"></div>
          <div id="floatingResizeHandleBottom" class="floating-resize-handle bottom-handle" style="display: none;"></div>
          <!-- Floating Header (only visible when minimized) -->
          <div id="floatingPlayerHeader" class="floating-video-header" style="display: none;">
            <span class="floating-video-title">English Galaxy</span>
            <div class="floating-video-controls">
              <button id="expandFloatingVideoBtn" title="Развернуть" style="font-size: 1.2rem;">&#9744;</button>
              <button id="closeFloatingVideoBtn" title="Close" style="font-size: 1.2rem;">&#10005;</button>
            </div>
          </div>
          <div id="activeVideoPlayer" class="video-player-wrapper">
            <!-- Dynamic Iframe or Placeholder goes here -->
            <div class="player-placeholder">
              <div class="placeholder-vinyl-art">🎬</div>
              <h4>Выберите урок для просмотра</h4>
              <p>Кликните по уроку в списке слева, чтобы открыть видео в плеере</p>
            </div>
          </div>
          <div id="activeVideoDetails" class="active-video-details" style="display: none;">
            <div class="details-header-row" style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="active-badge" id="activeLessonBadge">Урок 1</span>
                <a id="activeVideoExternalLink" href="#" target="_blank" class="active-external-link-btn" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 4px; font-size: 0.72rem; font-weight: 700; color: #ef4444; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 8px; padding: 4px 10px; cursor: pointer; transition: all 0.2s; outline: none;">
                  <span>📺</span> YouTube ↗
                </a>
              </div>
              <label class="premium-watched-toggle" style="margin: 0;">
                <input type="checkbox" id="activeVideoCheckbox">
                <span class="toggle-text" style="font-size: 0.72rem;">Отметить как пройденный</span>
              </label>
            </div>
            <h4 id="activeLessonTitle" class="active-lesson-title" style="margin: 3px 0 6px 0; font-size: 0.95rem; font-weight: 700; color: var(--text-main); line-height: 1.35;">Название урока</h4>

            <!-- Per-lesson note area -->
            <div class="lesson-note-section">
              <label class="lesson-note-label">
                <span>📝</span> Заметка к уроку
              </label>
              <div class="editor-container">
                <div class="editor-line-numbers" id="lineNumbers_activeLessonNoteTextarea">1</div>
                <textarea id="activeLessonNoteTextarea" class="lesson-note-textarea editor-textarea" placeholder="Напишите заметку к этому уроку..."></textarea>
              </div>
              <span class="lesson-note-save-status" id="lessonNoteSaveStatus">💾 Автосохранение</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ======================================================== -->
  <!-- Notebook Drawer — slides in from left, always accessible  -->
  <!-- ======================================================== -->

  <!-- Tab toggle — sleek floating icon on left edge -->
  <button id="notebookDrawerTab" class="notebook-drawer-tab" title="Мои заметки (открыть/закрыть)" aria-label="Открыть заметки">
    <svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 2v20"/><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h6"/><path d="M6 10h6"/></svg>
  </button>

  <!-- Drawer wrapper -->
  <div id="notebookModal" class="notebook-modal-overlay">
    <!-- Semi-transparent backdrop — click to close -->
    <div class="notebook-drawer-backdrop" id="notebookBackdrop"></div>

    <div class="notebook-modal-card">
      <!-- Header -->
      <div class="notebook-header" style="flex-direction: column; align-items: stretch; gap: 12px; padding: 16px 18px 12px 18px;">
        <!-- Top Row: Title & Close Button -->
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div class="notebook-header-left">
            <div class="notebook-icon-big" style="display: flex; align-items: center; justify-content: center;">
              <svg class="ui-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 2v20"/><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h6"/><path d="M6 10h6"/></svg>
            </div>
            <div>
              <h3 class="notebook-title">Заметки</h3>
              
            </div>
          </div>
          <button class="notebook-close-btn" id="closeNotebookBtn" title="Закрыть заметки" aria-label="Закрыть заметки">✕</button>
        </div>
        
        <!-- Bottom Row: Word Count & Clear Button -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid var(--border-glass); width: 100%;">
          <span class="notebook-wordcount" id="notebookWordCount">0 символов</span>
          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: nowrap; flex-shrink: 0;">
            <button id="notebookMoveToFolderBtn" class="notebook-action-btn" title="Перенести весь текст из заметок в отдельную папку и очистить поле">
              <svg class="ui-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
              <span>В папку</span>
            </button>
            <button id="notebookGeneralTranslitBtn" class="notebook-action-btn" title="Переключить раскладку (Рус ↔ Eng)">
              <span>Рус ↔ Eng</span>
            </button>
            <button class="notebook-clear-btn" id="notebookClearBtn" title="Очистить всё">
              <svg class="ui-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              <span>Очистить</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="notebook-toolbar">
        <span class="notebook-status" id="notebookSaveStatus">✓ Сохранено</span>
        <div class="notebook-tabs">
          <button class="notebook-tab active" data-tab="general" id="notebookTabGeneral">Общие</button>
          <button class="notebook-tab" data-tab="lessons" id="notebookTabLessons">Уроки</button>
          <button class="notebook-tab" data-tab="custom" id="notebookTabCustom">Папки</button>
        </div>
      </div>

      <!-- Body -->
      <div class="notebook-body">
        <!-- General notes tab -->
        <div class="notebook-tab-content" id="notebookTabContentGeneral">
          <div class="editor-container" style="flex-grow: 1;">
            <div class="editor-line-numbers" id="lineNumbers_notebookTextarea">1</div>
            <textarea id="notebookTextarea" class="notebook-textarea editor-textarea" placeholder="Свободное пространство для ваших мыслей, правил и заметок..."></textarea>
          </div>
        </div>

        <!-- Lesson notes tab -->
        <div class="notebook-tab-content" id="notebookTabContentLessons" style="display: none;">
          <div class="notebook-lessons-list" id="notebookLessonsList">
            <!-- Dynamically rendered lesson notes -->
          </div>
        </div>

        <!-- Custom Folders & Notes tab content -->
        <div class="notebook-tab-content" id="notebookTabContentCustom" style="display: none; flex-direction: column; flex-grow: 1; overflow-y: auto; padding: 14px; box-sizing: border-box; width: 100%;">
          <!-- Search notes input -->
          <div id="notebookNotesSearchContainer" class="notebook-search-container">
            <svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; opacity: 0.6;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="notebookNotesSearchInput" class="notebook-search-input" placeholder="Поиск по названию и тексту...">
          </div>

          <!-- Custom Folders list view -->
          <div id="notebookCustomFoldersView" style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.5px;">Папки заметок</span>
              <button id="notebookCreateFolderBtn" class="notebook-primary-btn">
                <svg class="ui-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>Папка</span>
              </button>
            </div>
            <div id="notebookFoldersListContainer" style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
              <!-- Dynamic folders list -->
            </div>
          </div>

          <!-- Notes inside selected folder view -->
          <div id="notebookCustomNotesListView" style="display: none; flex-direction: column; gap: 10px; width: 100%;">
            <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 4px; width: 100%;">
              <button id="notebookBackToFoldersBtn" class="notebook-back-btn">
                <svg class="ui-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                <span>К папкам</span>
              </button>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; width: 100%;">
                <h4 id="notebookCurrentFolderName" style="margin: 0; font-size: 0.95rem; font-weight: 800; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 65%;">Название папки</h4>
                <button id="notebookCreateNoteBtn" class="notebook-primary-btn">
                  <svg class="ui-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>Заметка</span>
                </button>
              </div>
            </div>
            <div id="notebookNotesListContainer" style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
              <!-- Dynamic notes list inside folder -->
            </div>
          </div>

          <!-- Search Results View -->
          <div id="notebookCustomSearchResultsView" style="display: none; flex-direction: column; gap: 10px; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.5px;">Результаты поиска</span>
            </div>
            <div id="notebookSearchResultsListContainer" style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
              <!-- Dynamic search results list -->
            </div>
          </div>

          <!-- Note Editor view -->
          <div id="notebookNoteEditorView" style="display: none; flex-direction: column; gap: 12px; width: 100%; flex-grow: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <button id="notebookBackToNotesBtn" class="notebook-back-btn">
                <svg class="ui-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                <span>Назад</span>
              </button>
              <button id="notebookTranslitBtn" class="notebook-action-btn" title="Переключить раскладку (Рус ↔ Eng)">
                <span>Рус ↔ Eng</span>
              </button>
              <button id="notebookDeleteNoteBtn" class="notebook-delete-btn">
                <svg class="ui-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                <span>Удалить</span>
              </button>
            </div>
            <input type="text" id="notebookNoteTitleInput" class="notebook-title-input" placeholder="Заголовок заметки...">
            <div class="editor-container" style="flex-grow: 1;">
              <div class="editor-line-numbers" id="lineNumbers_notebookNoteContentInput">1</div>
              <textarea id="notebookNoteContentInput" class="editor-textarea" placeholder="Текст заметки..." style="min-height: 250px;"></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- [Manage Folders Modal moved to modules/modal-templates-dict.js] -->
  <!-- Gamification Modal (Ударный режим и Опыт)                 -->
  <!-- ======================================================== -->
  <div class="modal-overlay" id="gamificationModal" style="display: none; z-index: 200050;">
    <div class="modal-card" style="width: 650px; max-width: 95%; height: 85vh; max-height: 85vh; display: flex; flex-direction: column;">
      <div class="modal-header" style="border-bottom: 1px solid var(--border-glass); padding-bottom: 16px;">
        <h3 style="display: flex; align-items: center; gap: 10px; font-size: 1.2rem; font-weight: 800;">
          <svg class="ui-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H8v2h8v-2h-1c-.55 0-1-.45-1-1v-2.34"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          <span>Моя активность и достижения</span>
        </h3>
        <button class="modal-close-btn" id="closeGamificationBtn"  title="Close">✕</button>
      </div>

      <div class="modal-body" style="flex-grow: 1; flex-shrink: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 24px; display: flex; flex-direction: column; gap: 24px;">
        <!-- Daily Streak Banner -->
        <div style="background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 88, 12, 0.05)); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 20px; box-shadow: var(--shadow-sm);">
          <div style="font-size: 2.5rem; color: #f97316;">
            <svg class="ui-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 1.4rem; font-weight: 800; color: #f97316;">
              Ударный режим: <span id="modalStreakDays">0</span> дн. подряд!
            </div>
            <div style="font-size: 0.85rem; color: var(--text-sub); line-height: 1.4;">
              Заходите каждый день, тренируйте слова и смотрите уроки, чтобы стрик не сбросился.
            </div>
          </div>
        </div>

        <!-- Gemini Sparks Progress Report Banner -->
        <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.08)); border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 16px; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; box-shadow: var(--shadow-sm);">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="color: #c084fc;">
              <svg class="ui-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            </div>
            <div>
              <div style="font-size: 1rem; font-weight: 800; color: #c084fc;">
                Микросайт прогресса для Google Gemini Sparks
              </div>
              <div style="font-size: 0.8rem; color: var(--text-sub); margin-top: 2px;">
                Дневной отчет активности, карточки, видео и ИИ-анализ по прямой ссылке
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <a href="sparks.html" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 20px; background: linear-gradient(135deg, #8b5cf6, #6366f1); border: 1px solid rgba(139,92,246,0.5); color: #ffffff; font-size: 0.85rem; font-weight: 700; text-decoration: none; box-shadow: var(--shadow-sm); transition: transform 0.2s;">
              <span>Открыть Sparks</span>
            </a>
          </div>
        </div>

        <!-- XP & Rank Section -->
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-glass); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <svg class="ui-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              <div>
                <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase;">Накопленный опыт</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: #60a5fa;"><span id="modalTotalXP">0</span> XP</div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase;">Текущий ранг</div>
              <div style="font-size: 1.2rem; font-weight: 800; color: #a855f7;" id="modalRankTitle">Новичок</div>
            </div>
          </div>

          <!-- Rank Progress Bar -->
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-sub);">
              <span id="modalRankCurrent">0 XP</span>
              <span id="modalRankNext">500 XP до следующего ранга</span>
            </div>
            <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden;">
              <div id="modalRankBar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #3b82f6, #a855f7); border-radius: 4px; transition: width 0.5s ease;"></div>
            </div>
          </div>
        </div>

        <!-- Detailed Statistics Grid -->
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 8px;">
            <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span>Аналитика и статистика обучения:</span>
          </h4>
          <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
            
            <div style="background: rgba(59, 130, 246, 0.06); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 14px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; transition: transform 0.2s;">
              <div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border-radius: 12px; flex-shrink: 0;">
                <svg class="ui-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-sub); font-weight: 600; text-transform: uppercase;">Словарный запас</div>
                <div style="font-size: 1.3rem; font-weight: 800; color: #60a5fa;" id="modalStatWordsTotal">0</div>
                <div style="font-size: 0.7rem; color: var(--text-sub);">всего сохранено слов</div>
              </div>
            </div>

            <div style="background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 14px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; transition: transform 0.2s;">
              <div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border-radius: 12px; flex-shrink: 0;">
                <svg class="ui-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-sub); font-weight: 600; text-transform: uppercase;">Мастерство (Ур. 5)</div>
                <div style="font-size: 1.3rem; font-weight: 800; color: #fbbf24;" id="modalStatWordsMastered">0</div>
                <div style="font-size: 0.7rem; color: var(--text-sub);">уверенно в памяти</div>
              </div>
            </div>

            <div style="background: rgba(168, 85, 247, 0.06); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 14px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; transition: transform 0.2s;">
              <div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: rgba(168, 85, 247, 0.15); color: #c084fc; border-radius: 12px; flex-shrink: 0;">
                <svg class="ui-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-sub); font-weight: 600; text-transform: uppercase;">На изучении</div>
                <div style="font-size: 1.3rem; font-weight: 800; color: #c084fc;" id="modalStatWordsLearning">0</div>
                <div style="font-size: 0.7rem; color: var(--text-sub);">уровни Leitner 1–4</div>
              </div>
            </div>

            <div style="background: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 14px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; transition: transform 0.2s;">
              <div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: rgba(239, 68, 68, 0.15); color: #f87171; border-radius: 12px; flex-shrink: 0;">
                <svg class="ui-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-sub); font-weight: 600; text-transform: uppercase;">Ждут повторения</div>
                <div style="font-size: 1.3rem; font-weight: 800; color: #f87171;" id="modalStatWordsDue">0</div>
                <div style="font-size: 0.7rem; color: var(--text-sub);">готовы к тренировке</div>
              </div>
            </div>

            <div style="background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 14px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; transition: transform 0.2s;">
              <div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: rgba(16, 185, 129, 0.15); color: #10b981; border-radius: 12px; flex-shrink: 0;">
                <svg class="ui-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-sub); font-weight: 600; text-transform: uppercase;">Курс English Galaxy</div>
                <div style="font-size: 1.3rem; font-weight: 800; color: #10b981;" id="modalStatVideosWatched">0 / 50</div>
                <div style="font-size: 0.7rem; color: var(--text-sub);">уроков пройдено</div>
              </div>
            </div>

            <div style="background: rgba(236, 72, 153, 0.06); border: 1px solid rgba(236, 72, 153, 0.2); border-radius: 14px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; transition: transform 0.2s;">
              <div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: rgba(236, 72, 153, 0.15); color: #f472b6; border-radius: 12px; flex-shrink: 0;">
                <svg class="ui-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-sub); font-weight: 600; text-transform: uppercase;">Медиатека</div>
                <div style="font-size: 1.3rem; font-weight: 800; color: #f472b6;" id="modalStatSongsCount">0</div>
                <div style="font-size: 0.7rem; color: var(--text-sub);">песен и клипов в базе</div>
              </div>
            </div>

          </div>
        </div>

        <!-- How to earn XP List -->
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 6px;">
            <svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            <span>Как зарабатывать опыт (XP):</span>
          </h4>
          
          <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-glass); border-radius: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <svg class="ui-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>
                <div>
                  <div style="font-size: 0.9rem; font-weight: 600;">Просмотр видеоурока</div>
                  <div style="font-size: 0.75rem; color: var(--text-sub);">Отметка урока в курсе English Galaxy как просмотренного</div>
                </div>
              </div>
              <div style="font-weight: 800; color: #10b981; font-size: 1rem;">+100 XP</div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-glass); border-radius: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <svg class="ui-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <div>
                  <div style="font-size: 0.9rem; font-weight: 600;">Мастерство слова (Уровень 5)</div>
                  <div style="font-size: 0.75rem; color: var(--text-sub);">Слово уверенно усвоено и отложено на 30 дней в Leitner</div>
                </div>
              </div>
              <div style="font-weight: 800; color: #fbbf24; font-size: 1rem;">+50 XP</div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-glass); border-radius: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <svg class="ui-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"/></svg>
                <div>
                  <div style="font-size: 0.9rem; font-weight: 600;">Правильный ответ во флешкартах</div>
                  <div style="font-size: 0.75rem; color: var(--text-sub);">Нажатие кнопок «Помню» или «Easy» в тренировке</div>
                </div>
              </div>
              <div style="font-weight: 800; color: #60a5fa; font-size: 1rem;">+2 XP</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- ======================================================== -->
  <!-- Rules Modal (Grammar Rules Reference)                    -->
  <!-- ======================================================== -->
  <div class="modal-overlay" id="rulesModal" style="display: none; z-index: 200050;">
    <div class="modal-card" id="rulesModalCard" style="width: 700px; max-width: 95%; height: 80vh; display: flex; flex-direction: column;">
      <div class="modal-header">
        <h3 style="display: flex; align-items: center; gap: 8px;">
          <svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          <span>Справочник правил</span>
        </h3>
        <button class="modal-close-btn" id="closeRulesBtn"  title="Close">✕</button>
      </div>
      
      <!-- Sub-header / Tabs -->
      <div class="rules-tabs" style="display: flex; gap: 4px; padding: 10px 24px; border-bottom: 1px solid var(--border-glass); background: rgba(0,0,0,0.15);">
        <button class="rules-tab active" id="rulesTabList" style="background: none; border: none; color: #0ea5e9; border-bottom: 2px solid #0ea5e9; font-size: 0.85rem; font-weight: 700; padding: 6px 12px; cursor: pointer; transition: all 0.2s;">Список правил</button>
        <button class="rules-tab" id="rulesTabAdd" style="background: none; border: none; color: var(--text-sub); border-bottom: 2px solid transparent; font-size: 0.85rem; font-weight: 600; padding: 6px 12px; cursor: pointer; transition: all 0.2s;">Добавить правило</button>
      </div>

      <!-- Rules Search Bar -->
      <div id="rulesSearchContainer" style="padding: 12px 24px 4px 24px; display: flex; box-sizing: border-box; background: rgba(0,0,0,0.1); border-bottom: 1px solid rgba(255,255,255,0.03);">
        <div style="position: relative; width: 100%;">
          <svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); opacity: 0.6; pointer-events: none;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="rulesSearchInput" placeholder="Поиск правил по названию..." style="width: 100%; height: 36px; padding: 8px 12px 8px 36px; background: rgba(0, 0, 0, 0.2); border: 1px solid var(--border-glass); border-radius: 18px; color: var(--text-main); font-size: 0.82rem; outline: none; box-sizing: border-box; transition: all 0.2s;">
        </div>
      </div>

      <!-- Modal Body (Reading / Rules List accordion style) -->
      <div class="modal-body" id="rulesListContainer" style="flex-grow: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 8px;">
        <!-- Dynamic Accordion List will go here -->
      </div>

      <!-- Modal Body (Editing / Add Rule form) -->
      <div class="modal-body" id="rulesAddFormContainer" style="flex-grow: 1; overflow-y: auto; padding: 20px; display: none; flex-direction: column; gap: 14px;">
        <div style="display: flex; flex-direction: column; gap: 6px; width: 100%; box-sizing: border-box;">
          <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase;">Название правила:</label>
          <input type="text" id="ruleTitleInput" placeholder="например, Present Simple" style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-glass); border-radius: 10px; padding: 10px 12px; color: var(--text-main); font-size: 0.9rem; outline: none; width: 100%; box-sizing: border-box; transition: border-color 0.3s, box-shadow 0.3s;">
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 6px; width: 100%; box-sizing: border-box; flex-grow: 1;">
          <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-sub); text-transform: uppercase;">Содержание правила и примеры:</label>
          <textarea id="ruleContentInput" placeholder="Опишите правило, формулы образования и примеры..." style="width: 100%; flex-grow: 1; min-height: 200px; background: rgba(0,0,0,0.25); border: 1px solid var(--border-glass); border-radius: 12px; padding: 16px; color: var(--text-main); font-family: var(--font-body); font-size: 0.9rem; resize: vertical; outline: none; line-height: 1.5; box-sizing: border-box; transition: border-color 0.3s, box-shadow 0.3s;"></textarea>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px;">
          <button id="saveRuleBtn" class="modal-btn primary-btn" style="background: linear-gradient(135deg, #0ea5e9, #0284c7); box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3); border: none; outline: none; border-radius: 10px; padding: 10px 20px; font-weight: 700; font-size: 0.85rem; color: #fff; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px;">
            <svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Сохранить правило</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <!-- IRREGULAR VERBS HUB — Catalog, Dictionary Integration & Trainer   -->
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <div class="modal-overlay" id="irregularVerbsModal" style="display: none; z-index: 200050;">
    <div class="modal-card" style="width: 700px; max-width: 95%; height: 82vh; display: flex; flex-direction: column;">
      <div class="mobile-drag-handle"></div>

      <div class="modal-header" style="flex-shrink: 0;">
        <h3 style="display: flex; align-items: center; gap: 8px;">
          <svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/></svg>
          <span>Неправильные глаголы</span>
        </h3>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span id="irregTotalCountBadge" style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;"></span>
          <span id="irregInDictCountBadge" style="font-size: 0.72rem; color: var(--accent-spotify); font-weight: 700;"></span>
          <button class="modal-close-btn" id="closeIrregularVerbsBtn" title="Закрыть">✕</button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="dict-tabs">
        <button class="dict-tab active" id="irregTabCatalog">Каталог</button>
        <button class="dict-tab" id="irregTabTrainer">Тренировка</button>
      </div>

      <div class="modal-body" style="display: flex; flex-direction: column; gap: 0.5rem; overflow: hidden; padding: 1rem 1.5rem; flex-grow: 1; min-height: 0; box-sizing: border-box;">

        <!-- ════════════ CATALOG VIEW ════════════ -->
        <div id="irregCatalogView" style="display: flex; flex-direction: column; gap: 0.75rem; flex-grow: 1; min-height: 0; overflow: hidden;">

          <!-- Search & Filter Row -->
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; flex-shrink: 0;">
            <div class="premium-search-box" style="flex-grow: 1; display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity: 0.5; color: var(--text-main); flex-shrink: 0;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="irregSearchInput" placeholder="Поиск по формам или переводу..." style="background: transparent; border: none; color: var(--text-main); font-size: 0.85rem; outline: none; width: 100%;">
            </div>
          </div>

          <!-- Filter Pills -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap; flex-shrink: 0;">
            <button class="irreg-filter-pill active" data-filter="all">Все глаголы</button>
            <button class="irreg-filter-pill" data-filter="in_dict">В моём словаре</button>
          </div>

          <!-- Action row -->
          <div style="display: flex; gap: 8px; flex-shrink: 0; align-items: center; justify-content: space-between; flex-wrap: wrap;">
            <button id="irregAddCustomVerbBtn" class="modal-btn secondary-btn" style="font-size: 0.75rem; margin: 0; padding: 6px 14px; border-radius: 10px; display: inline-flex; align-items: center; gap: 5px;">
              <span>+ Добавить свой глагол</span>
            </button>
            <button id="irregLaunchTrainFromCatBtn" class="modal-btn primary-btn" style="font-size: 0.75rem; margin: 0; padding: 6px 16px; border-radius: 10px;">
              <span>Начать тренировку</span>
            </button>
          </div>

          <!-- Form to add custom verb (collapsible) -->
          <div id="irregAddCustomForm" style="display: none; flex-direction: column; gap: 10px; padding: 14px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 14px; flex-shrink: 0; animation: fadeIn 0.2s ease;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-main);">Новый неправильный глагол</span>
              <button id="irregCloseCustomFormBtn" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1rem; line-height: 1;">✕</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
              <input type="text" id="irregCustomV1" class="irreg-text-input" placeholder="V1 (Infinitive), напр: go" style="padding: 7px 10px; font-size: 0.82rem;" autocomplete="off">
              <input type="text" id="irregCustomV2" class="irreg-text-input" placeholder="V2 (Past Simple), напр: went" style="padding: 7px 10px; font-size: 0.82rem;" autocomplete="off">
              <input type="text" id="irregCustomV3" class="irreg-text-input" placeholder="V3 (Participle), напр: gone" style="padding: 7px 10px; font-size: 0.82rem;" autocomplete="off">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <input type="text" id="irregCustomTrans" class="irreg-text-input" placeholder="Перевод (русский), напр: идти" style="padding: 7px 10px; font-size: 0.82rem;" autocomplete="off">
              <input type="text" id="irregCustomExample" class="irreg-text-input" placeholder="Пример предложения (опционально)" style="padding: 7px 10px; font-size: 0.82rem;" autocomplete="off">
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
              <button id="irregCancelCustomBtn" class="modal-btn secondary-btn" style="font-size: 0.75rem; margin: 0; padding: 6px 14px; border-radius: 10px;">Отмена</button>
              <button id="irregSaveCustomBtn" class="modal-btn primary-btn" style="font-size: 0.75rem; margin: 0; padding: 6px 16px; border-radius: 10px;">Сохранить глагол</button>
            </div>
          </div>

          <!-- Verbs List (Scrollable) -->
          <div id="irregCatalogList" style="flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px; min-height: 0;">
            <!-- Dynamically injected verb cards -->
          </div>
        </div>

        <!-- ════════════ TRAINER VIEW ════════════ -->
        <div id="irregTrainerView" style="display: none; flex-direction: column; gap: 0.75rem; flex-grow: 1; min-height: 0; overflow: hidden;">

          <!-- Trainer Settings Row -->
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; flex-shrink: 0;">
            <select id="irregTrainerModeSelect" class="premium-select-filter" style="flex: 1; min-width: 130px;">
              <option value="input">Ввод 3 форм</option>
              <option value="flashcard">Карточки</option>
              <option value="quiz">Тест</option>
            </select>
            <select id="irregTrainerScopeSelect" class="premium-select-filter" style="flex: 1; min-width: 130px;">
              <option value="all">Все мои глаголы</option>
              <option value="my_verbs">Из словаря</option>
            </select>
          </div>

          <!-- Progress Bar -->
          <div style="flex-shrink: 0; display: flex; align-items: center; gap: 10px;">
            <div style="flex-grow: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;">
              <div id="irregTrainerProgressBar" style="height: 100%; width: 0%; background: var(--accent-spotify); border-radius: 3px; transition: width 0.3s ease;"></div>
            </div>
            <span id="irregTrainerProgressText" style="font-size: 0.75rem; font-weight: 700; color: var(--text-sub); white-space: nowrap;">0 / 0</span>
          </div>

          <!-- Card Container (Active Training) -->
          <div id="irregTrainerCardContainer" style="flex-grow: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column;">
            <!-- Dynamically rendered by JS -->
          </div>

          <!-- Completion View -->
          <div id="irregTrainerCompleteView" style="display: none; flex-direction: column; align-items: center; justify-content: center; gap: 16px; flex-grow: 1; min-height: 0; text-align: center; padding: 20px;">
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);">Тренировка завершена</div>
            <div id="irregCompleteStatsText" style="font-size: 0.9rem; color: var(--text-sub);"></div>
            <div id="irregCompleteXPReward" style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);"></div>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
              <button id="irregTrainerRestartBtn" class="modal-btn primary-btn" style="font-size: 0.8rem; padding: 7px 18px; border-radius: 10px;">Повторить</button>
              <button id="irregTrainerReturnCatBtn" class="modal-btn secondary-btn" style="font-size: 0.8rem; padding: 7px 18px; border-radius: 10px;">Каталог</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
`;

/**
 * Synchronously inject all modal templates into the DOM container
 */
export function injectModalTemplates() {
  const container = document.getElementById('modalsContainer') || document.body;
  if (!container) return;
  
  // Prevent duplicate injection
  if (document.getElementById('settingsModal')) return;
  
  const temp = document.createElement('div');
  temp.id = 'injectedModalsWrapper';
  const dictModals = (typeof window !== 'undefined' && window.DICT_MODALS_HTML) ? window.DICT_MODALS_HTML : '';
  temp.innerHTML = ALL_MODALS_HTML + '\n' + dictModals;
  container.appendChild(temp);
}

// Auto-inject immediately
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectModalTemplates);
  } else {
    injectModalTemplates();
  }
}

// Expose globally for backward compatibility
if (typeof window !== 'undefined') {
  window.injectModalTemplates = injectModalTemplates;
}
