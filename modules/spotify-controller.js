/**
 * @file modules/spotify-controller.js
 * @description Extracted Spotify Auto-Pause & Now Playing Widget integration.
 */

/* ==========================================================================
   Spotify Auto-Pause Integration (Authorization Code + PKCE)
   ========================================================================== */
const SpotifyController = {
  clientId: localStorage.getItem('spotifyClientId') || '',
  accessToken: localStorage.getItem('spotifyAccessToken') || '',
  // Always use 127.0.0.1 for redirect (Spotify requires exact match)
  redirectUri: (window.location.origin + window.location.pathname).replace('localhost', '127.0.0.1'),
  // The user's preferred origin (where their data lives)
  preferredUrl: window.location.origin + window.location.pathname,

  init() {
    this.checkHashForToken();
    this.checkUrlForCode();
    this.setupUI();
  },

  // --- Check hash for token transferred from 127.0.0.1 ---
  checkHashForToken() {
    const hash = window.location.hash;
    if (hash && hash.includes('spotify_access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('spotify_access_token');
      const refreshToken = params.get('spotify_refresh_token');
      if (accessToken) {
        this.accessToken = accessToken;
        localStorage.setItem('spotifyAccessToken', accessToken);
        if (refreshToken) localStorage.setItem('spotifyRefreshToken', refreshToken);
        this.showStatus('✅ Подключено. Токен активен.', '#1db954');
      }
      window.history.replaceState(null, null, window.location.pathname);
    }
  },

  // --- PKCE Helpers ---
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);
    for (let i = 0; i < length; i++) {
      result += chars[arr[i] % chars.length];
    }
    return result;
  },

  async generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  },

  // --- Check URL for authorization code after redirect ---
  async checkUrlForCode() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const stateParam = urlParams.get('state');
    if (code && stateParam) {
      try {
        const state = JSON.parse(atob(stateParam));
        const codeVerifier = state.cv;
        const clientId = state.ci;
        const returnUrl = state.ru; // localhost URL to redirect back to

        if (codeVerifier && clientId) {
          const res = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: this.redirectUri,
              client_id: clientId,
              code_verifier: codeVerifier
            })
          });
          const data = await res.json();
          if (data.access_token) {
            // If we're on 127.0.0.1 but user's data is on localhost, redirect with tokens
            if (returnUrl && window.location.origin !== new URL(returnUrl).origin) {
              const hash = `#spotify_access_token=${data.access_token}&spotify_refresh_token=${data.refresh_token || ''}`;
              window.location.href = returnUrl + hash;
              return;
            }
            // Otherwise save directly
            this.accessToken = data.access_token;
            localStorage.setItem('spotifyAccessToken', data.access_token);
            if (data.refresh_token) localStorage.setItem('spotifyRefreshToken', data.refresh_token);
            this.showStatus('✅ Подключено. Токен активен.', '#1db954');
          } else {
            this.showStatus('Ошибка: ' + (data.error_description || data.error), '#ef4444');
          }
        }
      } catch (err) {
        console.error('Spotify code exchange error:', err);
      }
      window.history.replaceState(null, null, window.location.pathname);
    }
  },

  // --- Exchange code for token ---
  async exchangeCodeForToken(code, codeVerifier) {
    try {
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId || localStorage.getItem('spotifyClientId'),
          code_verifier: codeVerifier
        })
      });
      const data = await res.json();
      if (data.access_token) {
        this.accessToken = data.access_token;
        localStorage.setItem('spotifyAccessToken', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('spotifyRefreshToken', data.refresh_token);
        }
        this.showStatus('✅ Подключено. Токен активен.', '#1db954');
      } else {
        this.showStatus('Ошибка авторизации: ' + (data.error_description || data.error), '#ef4444');
      }
    } catch (err) {
      console.error('Spotify token exchange error:', err);
      this.showStatus('Ошибка сети при обмене токена.', '#ef4444');
    }
  },

  // --- Refresh token ---
  async refreshAccessToken() {
    const refreshToken = localStorage.getItem('spotifyRefreshToken');
    const clientId = this.clientId || localStorage.getItem('spotifyClientId');
    if (!refreshToken || !clientId) return false;
    try {
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId
        })
      });
      const data = await res.json();
      if (data.access_token) {
        this.accessToken = data.access_token;
        localStorage.setItem('spotifyAccessToken', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('spotifyRefreshToken', data.refresh_token);
        }
        return true;
      }
    } catch (err) {
      console.error('Spotify refresh error:', err);
    }
    return false;
  },

  setupUI() {
    const clientIdInput = document.getElementById('spotifyClientIdInput');
    const connectBtn = document.getElementById('spotifyConnectBtn');

    if (clientIdInput) {
      clientIdInput.value = this.clientId;
      clientIdInput.addEventListener('input', (e) => {
        this.clientId = e.target.value.trim();
        localStorage.setItem('spotifyClientId', this.clientId);
      });
    }

    if (connectBtn) {
      connectBtn.addEventListener('click', async () => {
        if (!this.clientId) {
          this.showStatus('Пожалуйста, введите Client ID', '#ef4444');
          return;
        }
        // Generate PKCE verifier + challenge
        const codeVerifier = this.generateRandomString(64);
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);

        // Pack data into state param (127.0.0.1 won't have our localStorage)
        const state = btoa(JSON.stringify({
          cv: codeVerifier,
          ci: this.clientId,
          ru: this.preferredUrl // return URL (localhost)
        }));

        const scope = 'user-modify-playback-state user-read-playback-state user-read-currently-playing';
        const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${encodeURIComponent(this.clientId)}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(this.redirectUri)}&code_challenge_method=S256&code_challenge=${codeChallenge}&state=${encodeURIComponent(state)}`;
        window.location.href = authUrl;
      });
    }

    if (this.accessToken) {
      this.showStatus('✅ Подключено. Токен активен.', '#1db954');
    }
  },

  showStatus(msg, color) {
    const statusMsg = document.getElementById('spotifyStatusMessage');
    if (statusMsg) {
      statusMsg.textContent = msg;
      statusMsg.style.color = color;
      statusMsg.style.display = 'block';
    }
  },

  rateLimitTimer: null,

  handleRateLimit(retryAfter) {
    console.warn(`Spotify rate limited. Retry after ${retryAfter}s`);
    // Pause polling
    if (this.nowPlayingInterval) {
      clearInterval(this.nowPlayingInterval);
      this.nowPlayingInterval = null;
    }
    // Clear any previous rate limit resume timer
    if (this.rateLimitTimer) {
      clearTimeout(this.rateLimitTimer);
      this.rateLimitTimer = null;
    }
    // Show toast
    this.showRateLimitToast(retryAfter);
    // Resume polling after cooldown
    this.rateLimitTimer = setTimeout(() => {
      this.rateLimitTimer = null;
      this.startNowPlayingPolling();
    }, retryAfter * 1000);
  },

  showRateLimitToast(seconds) {
    let toast = document.getElementById('spotifyRateLimitToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'spotifyRateLimitToast';
      toast.style.cssText = `
        position: fixed; bottom: 80px; right: 16px; z-index: 9999;
        background: linear-gradient(135deg, rgba(30,30,38,0.95), rgba(18,18,24,0.98));
        backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(239,68,68,0.3); border-radius: 12px;
        padding: 10px 16px; display: flex; align-items: center; gap: 8px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 16px rgba(239,68,68,0.1);
        font-family: var(--font-body, sans-serif); animation: spotifyNpSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) both;
      `;
      document.body.appendChild(toast);
    }
    toast.innerHTML = `
      <span style="font-size: 1.1rem;">⚠️</span>
      <div style="display:flex;flex-direction:column;gap:1px;">
        <span style="font-size:0.75rem;font-weight:700;color:#ef4444;">Лимит Spotify API</span>
        <span style="font-size:0.68rem;color:#9ca3af;">Пауза на ${seconds} сек. Обновление продолжится автоматически.</span>
      </div>
    `;
    toast.style.display = 'flex';
    // Auto-hide after cooldown
    setTimeout(() => {
      if (toast) {
        toast.style.animation = 'spotifyNpSlideOut 0.35s cubic-bezier(0.55,0,1,0.45) both';
        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 350);
      }
    }, seconds * 1000);
  },

  async setPlaybackState(action) { // 'play' or 'pause'
    if (!this.accessToken) return;
    try {
      const res = await fetch(`https://api.spotify.com/v1/me/player/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      // 429 = rate limited
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '30', 10);
        this.handleRateLimit(retryAfter);
        return;
      }
      // 401 means token expired — try to refresh
      if (res.status === 403) { this.clearTokens(); const statusEl = document.getElementById('spotifyStatus'); if(statusEl) statusEl.innerHTML = '<span style="color:#ef4444">Ошибка 403. Авторизация Spotify отклонена.</span>'; return; }
      if (res.status === 401) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the request with the new token
          await fetch(`https://api.spotify.com/v1/me/player/${action}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          this.accessToken = '';
          localStorage.removeItem('spotifyAccessToken');
          this.showStatus('Токен истек. Переподключите Spotify.', '#ef4444');
        }
      }
    } catch (err) {
      console.error('Spotify API error:', err);
    }
    // Refresh now playing after playback change
    setTimeout(() => this.getNowPlaying(), 500);
  },

  // --- Now Playing ---
  nowPlayingInterval: null,
  lastTrackId: null,

  startNowPlayingPolling() {
    if (!this.accessToken) return;
    if (localStorage.getItem('galaxy_spotify_now_playing') === 'false') return;
    if (window.innerWidth <= 768) return; // Widget hidden on mobile
    // Immediately fetch, then poll every 5 seconds
    this.getNowPlaying();
    if (this.nowPlayingInterval) clearInterval(this.nowPlayingInterval);
    this.nowPlayingInterval = setInterval(() => this.getNowPlaying(), 5000);
  },

  stopNowPlayingPolling() {
    if (this.nowPlayingInterval) {
      clearInterval(this.nowPlayingInterval);
      this.nowPlayingInterval = null;
    }
    // Hide widget
    this.updateNowPlayingUI(null);
  },

  async getNowPlaying() {
    if (!this.accessToken) return;
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });
      // 204 = nothing playing, 200 = playing
      if (res.status === 204 || res.status === 202) {
        this.updateNowPlayingUI(null);
        return;
      }
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '30', 10);
        this.handleRateLimit(retryAfter);
        return;
      }
      if (res.status === 401) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry
          const res2 = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
          });
          if (res2.ok) {
            const data = await res2.json();
            this.updateNowPlayingUI(data);
          }
        }
        return;
      }
      if (res.ok) {
        const data = await res.json();
        this.updateNowPlayingUI(data);
      }
    } catch (err) {
      console.error('Spotify Now Playing error:', err);
    }
  },

  updateNowPlayingUI(data) {
    const widget = document.getElementById('spotifyNowPlaying');
    if (!widget) return;

    // Nothing playing or no track item
    if (!data || !data.item) {
      if (widget.style.display !== 'none') {
        widget.classList.add('hiding');
        setTimeout(() => {
          widget.style.display = 'none';
          widget.classList.remove('hiding');
        }, 350);
      }
      this.lastTrackId = null;
      return;
    }

    const track = data.item;
    const trackName = track.name || '—';
    const artistName = (track.artists || []).map(a => a.name).join(', ') || '—';
    const albumArt = (track.album && track.album.images && track.album.images.length > 0)
      ? (track.album.images.find(i => i.width <= 300) || track.album.images[track.album.images.length - 1]).url
      : '';
    const isPlaying = data.is_playing;

    const trackEl = document.getElementById('spotifyNpTrack');
    const artistEl = document.getElementById('spotifyNpArtist');
    const albumEl = document.getElementById('spotifyNpAlbumArt');

    if (trackEl) trackEl.textContent = trackName;
    if (artistEl) artistEl.textContent = artistName;
    if (albumEl && albumArt) albumEl.src = albumArt;

    // Toggle paused state for bar animation
    if (isPlaying) {
      widget.classList.remove('paused');
    } else {
      widget.classList.add('paused');
    }

    // Show widget
    if (widget.style.display === 'none') {
      widget.classList.remove('hiding');
      this.restoreSavedPosition();
      widget.style.display = 'block';
    }

    this.lastTrackId = track.id;
  },

  // --- Dragging ---
  dragState: null,

  initDrag() {
    if (window.innerWidth <= 768) return;
    const widget = document.getElementById('spotifyNowPlaying');
    if (!widget) return;

    const onStart = (e) => {
      // Ignore if hidden
      if (widget.style.display === 'none') return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = widget.getBoundingClientRect();
      this.dragState = {
        offsetX: clientX - rect.left,
        offsetY: clientY - rect.top,
        moved: false
      };
      widget.classList.add('dragging');
    };

    const onMove = (e) => {
      if (!this.dragState) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      this.dragState.moved = true;

      let left = clientX - this.dragState.offsetX;
      let top = clientY - this.dragState.offsetY;

      // Clamp within viewport
      const w = widget.offsetWidth;
      const h = widget.offsetHeight;
      left = Math.max(0, Math.min(left, window.innerWidth - w));
      top = Math.max(0, Math.min(top, window.innerHeight - h));

      widget.style.left = left + 'px';
      widget.style.top = top + 'px';
      widget.style.right = 'auto';
      widget.style.bottom = 'auto';
    };

    const onEnd = () => {
      if (!this.dragState) return;
      widget.classList.remove('dragging');
      if (this.dragState.moved) {
        // Prevent the slideIn animation from re-firing after drag ends
        widget.style.animation = 'none';
        // Save position
        localStorage.setItem('galaxy_spotify_np_pos', JSON.stringify({
          left: widget.style.left,
          top: widget.style.top
        }));
      }
      this.dragState = null;
    };

    widget.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    widget.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  },

  restoreSavedPosition() {
    const widget = document.getElementById('spotifyNowPlaying');
    if (!widget) return;
    const saved = localStorage.getItem('galaxy_spotify_np_pos');
    if (saved) {
      try {
        const pos = JSON.parse(saved);
        // Validate that position is still on screen
        const left = parseInt(pos.left, 10);
        const top = parseInt(pos.top, 10);
        if (left >= 0 && left < window.innerWidth && top >= 0 && top < window.innerHeight) {
          widget.style.left = pos.left;
          widget.style.top = pos.top;
          widget.style.right = 'auto';
          widget.style.bottom = 'auto';
        }
      } catch (e) { /* ignore */ }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  SpotifyController.init();
  SpotifyController.startNowPlayingPolling();
  SpotifyController.initDrag();
});
