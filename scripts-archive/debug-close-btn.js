// Debug script to trace close button disappearance
// Run this in the browser console to diagnose the issue

(function() {
  const btn = document.getElementById('closeTrainingModalBtn');
  if (!btn) {
    console.error('Close button not found in DOM!');
    return;
  }

  console.log('=== Close Button Debug Monitor Active ===');
  console.log('Initial state:', {
    display: getComputedStyle(btn).display,
    visibility: getComputedStyle(btn).visibility,
    opacity: getComputedStyle(btn).opacity,
    width: getComputedStyle(btn).width,
    height: getComputedStyle(btn).height,
    overflow: getComputedStyle(btn).overflow,
    position: getComputedStyle(btn).position,
    textContent: btn.textContent,
    parentElement: btn.parentElement?.tagName + '#' + btn.parentElement?.id,
    isConnected: btn.isConnected
  });

  // Watch for style changes on the button
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      console.warn('MUTATION on closeTrainingModalBtn:', m.type, m.attributeName, {
        display: getComputedStyle(btn).display,
        visibility: getComputedStyle(btn).visibility,
        opacity: getComputedStyle(btn).opacity,
        width: getComputedStyle(btn).width,
        height: getComputedStyle(btn).height,
        textContent: btn.textContent,
        isConnected: btn.isConnected
      });
    });
  });

  observer.observe(btn, {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true
  });

  // Also watch the parent container
  const parent = btn.parentElement;
  if (parent) {
    const parentObserver = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        if (m.type === 'childList') {
          console.warn('PARENT childList change:', {
            addedNodes: m.addedNodes.length,
            removedNodes: m.removedNodes.length,
            removedNodesList: Array.from(m.removedNodes).map(n => n.id || n.tagName || n.textContent?.slice(0, 20))
          });
          // Check if our button was removed
          if (!document.getElementById('closeTrainingModalBtn')) {
            console.error('!!! CLOSE BUTTON WAS REMOVED FROM DOM !!!');
          }
        }
      });
    });
    parentObserver.observe(parent, { childList: true, attributes: true, subtree: false });
  }

  // Periodically check the button state
  let checkCount = 0;
  const interval = setInterval(() => {
    checkCount++;
    const el = document.getElementById('closeTrainingModalBtn');
    if (!el) {
      console.error(`[Check #${checkCount}] CLOSE BUTTON IS GONE FROM DOM!`);
      clearInterval(interval);
      return;
    }
    const computed = getComputedStyle(el);
    const isHidden = computed.display === 'none' || computed.visibility === 'hidden' || 
                     computed.opacity === '0' || parseFloat(computed.width) === 0 || 
                     parseFloat(computed.height) === 0;
    if (isHidden) {
      console.error(`[Check #${checkCount}] CLOSE BUTTON IS HIDDEN!`, {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        width: computed.width,
        height: computed.height,
        clip: computed.clip,
        clipPath: computed.clipPath,
        overflow: computed.overflow
      });
    }
  }, 500);

  // Stop after 5 minutes
  setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
  
  console.log('Monitor started - will check every 500ms for 5 minutes');
})();
