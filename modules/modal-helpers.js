/* ==========================================================================
   AI LYRIC-TRAINER — MODERN INTERACTIVE CONTROLLER (VANILLA JS)
   ========================================================================== */

/* ==========================================================================
   GLOBAL MODAL HELPERS — Flicker-free open/close with CSS animation
   ========================================================================== */

/**
 * Opens a modal element without flicker.
 * Sets display:flex, then triggers .modal-animate-in via double-rAF
 * so the CSS animation always fires exactly once per open.
 */
function openModalEl(el) {
  if (!el) return;
  
  // NOTE: history.pushState is handled by the MutationObserver in initModalHistoryAPI()
  // to avoid double-push causing stray popstate events
  
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');
  el.classList.remove('modal-animate-out');
  el.style.display = 'flex';
  el.classList.remove('modal-animate-in');
  void el.offsetWidth; // Force CSS reflow
  el.classList.add('modal-animate-in');
}

/**
 * Closes a modal element and plays animation out.
 */
function closeModalEl(el) {
  if (!el) return;
  if (el.style.display === 'none' || el.classList.contains('modal-animate-out')) return;
  
  el.classList.remove('modal-animate-in');
  el.classList.add('modal-animate-out');
  setTimeout(() => {
    if (el.classList.contains('modal-animate-out')) {
      el.style.display = 'none';
      el.classList.remove('modal-animate-out');
      const anyOpen = Array.from(document.querySelectorAll('.modal-overlay')).some(
        m => m !== el && m.style.display && m.style.display !== 'none'
      );
      if (!anyOpen) {
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        // NOTE: history.back() is handled by the MutationObserver in initModalHistoryAPI()
        // to avoid double-back causing stray popstate events that hide close buttons
      }
    }
  }, 200);
}

// Intercept popstate to close top-most modal safely
window.addEventListener('popstate', (e) => {
  if (typeof window.closeTopmostModal === 'function') {
    window.closeTopmostModal();
  }
});

// Backward compatibility
window.openModalEl = openModalEl;
window.closeModalEl = closeModalEl;