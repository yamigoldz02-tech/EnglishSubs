// Обработка кнопки "Назад" на Android для Capacitor (ProgectX Multiverse Hub)

(function() {
  let lastBackTime = 0;

  function handleBackButton() {
    const now = Date.now();
    if (now - lastBackTime < 200) {
      return;
    }
    lastBackTime = now;

    const path = window.location.pathname;
    
    const isSubProject = 
      path.includes('/EnglishSub/') || 
      path.includes('/Historia/') || 
      path.includes('/bestdog/') || 
      path.includes('/SpotifyAnalyzer/') ||
      path.includes('/Randomaizer/') ||
      path.includes('/Tir List/') ||
      path.includes('/Tir%20List/');

    // 1. Ищем ЛЮБОЕ открытое модальное окно на странице (любой элемент, растянутый на весь экран, либо с классом modal)
    // Проверяем элементы, у которых display: flex или block, и которые похожи на модалки
    const modals = document.querySelectorAll('.modal-overlay, .modal, .lightbox, .sidebar-panel, [id*="Modal"], [id*="modal"]');
    
    let activeModal = null;
    for (let i = 0; i < modals.length; i++) {
      const style = window.getComputedStyle(modals[i]);
      if (style.display !== 'none' && modals[i].style.display !== 'none') {
         // Проверяем, действительно ли это полноэкранная модалка (обычно они имеют fixed или absolute)
         if (style.position === 'fixed' || style.position === 'absolute' || modals[i].classList.contains('modal-overlay')) {
           activeModal = modals[i];
           // Ищем именно ту, что выше всех (z-index)
         }
      }
    }

    if (activeModal) {
      console.log('App Back Button: Found active modal, trying to close...', activeModal);
      const closeBtn = activeModal.querySelector('.modal-close-btn, .close-modal, .close-btn, .close-lightbox, [class*="close"], [id*="close"], [id*="Close"]');
      if (closeBtn) {
        closeBtn.click();
        return;
      } else {
        // Fallback: безопасное гашение
        activeModal.classList.remove('active', 'open', 'is-open');
        activeModal.style.display = 'none';
        
        document.body.style.overflow = '';
        document.body.classList.remove('no-scroll', 'modal-active', 'modal-open');
        document.documentElement.classList.remove('modal-open');
        
        const scrim = document.getElementById('scrimOverlay');
        if (scrim) {
          scrim.classList.remove('active');
          scrim.style.display = 'none';
        }
        return;
      }
    }

    // 2. Если нет активных модалок
    const isHubHome = (
      path === '/' ||
      path === '' ||
      (path.endsWith('/index.html') && !isSubProject) ||
      (path.endsWith('/www/index.html') && !isSubProject)
    );

    if (isHubHome) {
      console.log('App Back Button: On main Hub page, exiting application.');
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.exitApp();
      } else {
        window.close();
      }
    } else {
      const isSubProjectHome = 
        path.endsWith('/bestdog/index.html') ||
        path.endsWith('/bestdog/') ||
        path.endsWith('/Historia/index.html') ||
        path.endsWith('/Historia/') ||
        path.endsWith('/EnglishSub/index.html') ||
        path.endsWith('/EnglishSub/') ||
        path.endsWith('/SpotifyAnalyzer/spotify_analysis.html') ||
        path.endsWith('/Randomaizer/index.html') ||
        path.endsWith('/Randomaizer/') ||
        path.endsWith('/Tir List/index.html') ||
        path.endsWith('/Tir List/') ||
        path.endsWith('/Tir%20List/index.html') ||
        path.endsWith('/Tir%20List/');

      if (isSubProjectHome) {
        console.log('App Back Button: On sub-project home, returning to Hub Portal.');
        window.location.href = '../index.html';
      } else {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          if (isSubProject) {
            window.location.href = '../index.html';
          } else {
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
              window.Capacitor.Plugins.App.exitApp();
            } else {
              window.close();
            }
          }
        }
      }
    }
  }

  document.addEventListener('backbutton', (e) => {
    e.preventDefault();
    handleBackButton();
  });

  function registerCapacitorListener() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      const App = window.Capacitor.Plugins.App;
      App.addListener('backButton', () => {
        handleBackButton();
      });
    } else if (window.Capacitor) {
      setTimeout(registerCapacitorListener, 100);
    }
  }

  registerCapacitorListener();
})();
