/**
 * @AI-SECTION: UI_DIALOGS
 * @file modules/ui-dialogs.js
 * @description Custom Glassmorphic UI Dialogs (Prompt, Confirm, Alert, Toast)
 * Replaces native browser blocking prompt(), confirm(), alert() with premium non-blocking async modals.
 */

(function() {
  // Inject modal HTML if not already in DOM
  function ensureDialogDOM() {
    let modal = document.getElementById('customDialogModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'customDialogModal';
      modal.className = 'modal-overlay';
      modal.style.cssText = 'display: none; z-index: 100000; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(8px);';
      modal.innerHTML = `
        <div class="modal-card" style="max-width: 420px; width: 90%; height: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; background: var(--bg-modal, #181818); border: 1px solid var(--border-glass, rgba(255,255,255,0.1)); border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); box-sizing: border-box; animation: modalScaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);">
          <h3 id="customDialogTitle" style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-main, #fff); display: flex; align-items: center; gap: 8px;">✨ Уведомление</h3>
          <p id="customDialogMessage" style="margin: 0; font-size: 0.95rem; color: var(--text-sub, #aaa); line-height: 1.5; white-space: pre-wrap;"></p>
          <input type="text" id="customDialogInput" placeholder="" style="display: none; width: 100%; padding: 12px 14px; background: rgba(0,0,0,0.35); border: 1px solid var(--border-glass, rgba(255,255,255,0.15)); border-radius: 10px; color: var(--text-main, #fff); font-size: 0.95rem; outline: none; box-sizing: border-box; transition: border-color 0.2s;" />
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px;">
            <button id="customDialogCancelBtn" class="modal-btn" style="background: rgba(255,255,255,0.06); color: var(--text-sub, #aaa); border: 1px solid var(--border-glass, rgba(255,255,255,0.1)); padding: 8px 18px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.2s;">Отмена</button>
            <button id="customDialogOkBtn" class="modal-btn primary-btn" style="background: var(--accent-spotify, #1db954); color: #fff; border: none; padding: 8px 22px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.9rem; box-shadow: 0 4px 15px rgba(29, 185, 84, 0.3); transition: all 0.2s;">OK</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Stop propagation from card clicks
      const card = modal.querySelector('.modal-card');
      if (card) card.addEventListener('click', e => e.stopPropagation());
    }
    return modal;
  }

  function setupDialog(title, message, options = {}) {
    const modal = ensureDialogDOM();
    const titleEl = document.getElementById('customDialogTitle');
    const msgEl = document.getElementById('customDialogMessage');
    const inputEl = document.getElementById('customDialogInput');
    const cancelBtn = document.getElementById('customDialogCancelBtn');
    const okBtn = document.getElementById('customDialogOkBtn');

    titleEl.innerHTML = title || '✨ Уведомление';
    msgEl.textContent = message || '';
    
    // Style ok button based on type
    if (options.isDestructive) {
      okBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      okBtn.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
    } else {
      okBtn.style.background = 'var(--accent-spotify, #1db954)';
      okBtn.style.boxShadow = '0 4px 15px rgba(29, 185, 84, 0.3)';
    }
    okBtn.textContent = options.okText || 'OK';
    cancelBtn.textContent = options.cancelText || 'Отмена';

    if (options.showInput) {
      inputEl.style.display = 'block';
      inputEl.placeholder = options.placeholder || '';
      inputEl.value = options.defaultValue || '';
    } else {
      inputEl.style.display = 'none';
    }

    if (options.showCancel === false) {
      cancelBtn.style.display = 'none';
    } else {
      cancelBtn.style.display = 'inline-block';
    }

    // Add scroll lock class if not already open
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    modal.style.display = 'flex';

    if (options.showInput) {
      setTimeout(() => {
        inputEl.focus();
        inputEl.select();
      }, 50);
    } else {
      setTimeout(() => okBtn.focus(), 50);
    }

    return { modal, inputEl, cancelBtn, okBtn };
  }

  function closeDialog(modal) {
    if (modal) modal.style.display = 'none';
    // Remove scroll lock if no other modal is open
    const openModals = document.querySelectorAll('.modal-overlay[style*="display: flex"], .modal-overlay[style*="display: block"], .modal-overlay[style*="display:grid"]');
    if (openModals.length === 0) {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    }
  }

  window.showCustomPrompt = function(title, message, placeholder = "", defaultValue = "") {
    return new Promise((resolve) => {
      const { modal, inputEl, cancelBtn, okBtn } = setupDialog(title, message, {
        showInput: true,
        placeholder,
        defaultValue,
        okText: 'Сохранить',
        cancelText: 'Отмена'
      });

      const onOk = () => {
        cleanup();
        closeDialog(modal);
        resolve(inputEl.value);
      };

      const onCancel = () => {
        cleanup();
        closeDialog(modal);
        resolve(null);
      };

      const onKeyDown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onOk();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      };

      function cleanup() {
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        modal.removeEventListener('click', onCancel);
        inputEl.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keydown', onKeyDown);
      }

      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
      modal.addEventListener('click', onCancel);
      inputEl.addEventListener('keydown', onKeyDown);
      window.addEventListener('keydown', onKeyDown);
    });
  };

  window.showCustomConfirm = function(title, message, options = {}) {
    return new Promise((resolve) => {
      const { modal, cancelBtn, okBtn } = setupDialog(title, message, {
        showInput: false,
        showCancel: true,
        okText: options.okText || 'Да',
        cancelText: options.cancelText || 'Отмена',
        isDestructive: options.isDestructive || false
      });

      const onOk = () => {
        cleanup();
        closeDialog(modal);
        resolve(true);
      };

      const onCancel = () => {
        cleanup();
        closeDialog(modal);
        resolve(false);
      };

      const onKeyDown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onOk();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      };

      function cleanup() {
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        modal.removeEventListener('click', onCancel);
        window.removeEventListener('keydown', onKeyDown);
      }

      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
      modal.addEventListener('click', onCancel);
      window.addEventListener('keydown', onKeyDown);
    });
  };

  window.showCustomAlert = function(title, message, okText = 'Понятно') {
    return new Promise((resolve) => {
      const { modal, cancelBtn, okBtn } = setupDialog(title, message, {
        showInput: false,
        showCancel: false,
        okText
      });

      const onOk = () => {
        cleanup();
        closeDialog(modal);
        resolve();
      };

      const onKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          onOk();
        }
      };

      function cleanup() {
        okBtn.removeEventListener('click', onOk);
        modal.removeEventListener('click', onOk);
        window.removeEventListener('keydown', onKeyDown);
      }

      okBtn.addEventListener('click', onOk);
      modal.addEventListener('click', onOk);
      window.addEventListener('keydown', onKeyDown);
    });
  };

  // Global Toast Helper
  window.showToast = function(msg, type = 'success') {
    let container = document.getElementById('globalToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'globalToastContainer';
      container.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 1000001; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const isError = type === 'error';
    toast.style.cssText = `background: ${isError ? 'rgba(239, 68, 68, 0.95)' : 'rgba(29, 185, 84, 0.95)'}; border: 1px solid rgba(255, 255, 255, 0.18); color: #fff; font-weight: 700; font-size: 0.88rem; padding: 12px 20px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 8px; pointer-events: auto; backdrop-filter: blur(8px); transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); transform: translateY(20px); opacity: 0;`;
    toast.innerHTML = `<span>${isError ? '⚠️' : '✅'}</span> <span>${msg}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.transform = 'translateY(20px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  // Override native browser alert to use our custom modal
  window.alert = function(msg) {
    if (window.showCustomAlert) {
      window.showCustomAlert('✨ Уведомление', String(msg));
    }
  };
})();
