// @ts-check
// @AI-SECTION: MODAL_HELPERS
/// <reference path="./types.js" />
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
  // Clean up any previous animation classes
  el.classList.remove('modal-animate-out');
  
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');
  
  el.classList.add('modal-animate-in');
  el.style.display = 'flex';
}

/**
 * Closes a modal element and plays animation out.
 */
function closeModalEl(el) {
  if (!el) return;
  if (el.style.display === 'none' || !el.style.display) return;
  if (el.classList.contains('modal-animate-out')) return;
  
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
      }
    }
  }, 180);
}

// Backward compatibility
window.openModalEl = openModalEl;
window.closeModalEl = closeModalEl;
// Prevent background scrolling when dragging on modal backdrop overlay
if (typeof document !== 'undefined') {
  document.addEventListener('touchmove', function(e) {
    if (document.body.classList.contains('modal-open')) {
      const target = /** @type {HTMLElement} */ (e.target);
      // If touch target is the backdrop overlay itself, prevent background scroll
      if (target && target.classList && target.classList.contains('modal-overlay')) {
        e.preventDefault();
      }
    }
  }, { passive: false });
}
