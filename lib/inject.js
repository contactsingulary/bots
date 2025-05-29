(function(window, document) {
  window.embedApp = window.embedApp || {};
  let initialized = false, container, chatFrame, isOpen = false;
  let searchIcon, closeIcon;
  const origin = 'https://embed.singulary-tech.de';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  function updateIconState() {
    if (!searchIcon || !closeIcon) return;
    
    if (isOpen) {
      searchIcon.style.opacity = '0';
      searchIcon.style.transform = 'scale(0.8) rotate(90deg)';
      searchIcon.style.pointerEvents = 'none';
      closeIcon.style.opacity = '1';
      closeIcon.style.transform = 'scale(1) rotate(0deg)';
      closeIcon.style.pointerEvents = 'auto';
    } else {
      searchIcon.style.opacity = '1';
      searchIcon.style.transform = 'scale(1) rotate(0deg)';
      searchIcon.style.pointerEvents = 'auto';
      closeIcon.style.opacity = '0';
      closeIcon.style.transform = 'scale(0.8) rotate(-90deg)';
      closeIcon.style.pointerEvents = 'none';
    }
  }
  
  function showChat() {
    isOpen = true;
    chatFrame.style.display = 'block';
    if (window.searchBar && window.inputWrap) {
      const width = isMobile ? 'calc(100vw - 40px)' : '350px';
      window.searchBar.style.width = width;
      window.inputWrap.style.width = width;
    }
    updateIconState();
  }
  
  function hideChat() {
    isOpen = false;
    chatFrame.style.display = 'none';
    if (window.searchBar && window.inputWrap) {
      const width = isMobile ? 'calc(100vw - 40px)' : '230px';
      window.searchBar.style.width = width;
      window.inputWrap.style.width = width;
    }
    updateIconState();
  }
  
  window.addEventListener('message', function(event) {
    if (event.origin === origin && event.data?.type === 'chatClose') {
      hideChat();
    }
  });
  
  function createElem(tag, props = {}, styles = '') {
    const el = document.createElement(tag);
    Object.assign(el, props);
    if (styles) el.style.cssText = styles;
    return el;
  }
  
  function renderWidget() {
    if (container) return;
    
    const chatWidth = isMobile ? 'calc(100vw - 40px)' : '350px';
    const chatHeight = isMobile ? 'calc(100vh - 120px)' : '500px';
    const inputWidth = isMobile ? 'calc(100vw - 40px)' : '230px';
    
    chatFrame = createElem('iframe', {
      src: `${origin}/chat`,
      title: 'Chat',
      allow: 'autoplay; clipboard-write; encrypted-media; picture-in-picture;',
      referrerPolicy: 'origin'
    }, `display:none;width:${chatWidth};max-width:calc(100vw - 40px);height:${chatHeight};max-height:80vh;border:none;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);background:#FFF !important;background-color:#FFF !important;margin-bottom:10px;`);
    
    const searchBar = createElem('input', {
      type: 'text',
      placeholder: 'Brauchst du Hilfe?'
    }, `min-width:${inputWidth};max-width:calc(100vw - 40px);width:${inputWidth};height:40px;padding:0 58px 0 14px;font-size:15px;background:#FFF !important;background-color:#FFF !important;color:#333 !important;border:none;border-radius:20px;box-sizing:border-box;outline:none;box-shadow:0 6px 16px rgba(0,0,0,0.7), 0 2px 5px rgba(0,0,0,0.4);transition:width 0.3s ease;-webkit-text-fill-color:#333;`);
    
    const placeholderStyle = document.createElement('style');
    placeholderStyle.innerHTML = `
      #embed-widget input::placeholder {
        color: transparent;
        text-shadow: 0 0 0 #333;
        -webkit-text-fill-color: transparent !important;
      }
      #embed-widget input {
        background-color: #FFF !important;
        background-image: none !important;
        -webkit-appearance: none;
        -webkit-text-fill-color: #333 !important;
        color: #333 !important;
        caret-color: #333 !important;
      }
      #embed-widget input:focus {
        background-color: #FFF !important;
        -webkit-text-fill-color: #333 !important;
        color: #333 !important;
      }
      #embed-widget input:-webkit-autofill,
      #embed-widget input:-webkit-autofill:hover,
      #embed-widget input:-webkit-autofill:focus,
      #embed-widget input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px white inset !important;
        -webkit-text-fill-color: #333 !important;
        background-color: #FFF !important;
        transition: background-color 5000s ease-in-out 0s;
        color: #333 !important;
      }
      #embed-widget iframe {
        background: #FFF !important;
        background-color: #FFF !important;
      }
      /* Force SVG colors */
      #embed-widget svg {
        color: black !important;
      }
      #embed-widget svg circle {
        fill: black !important;
      }
      #embed-widget svg path,
      #embed-widget svg line {
        stroke: white !important;
      }
      /* Mobile specific overrides */
      @media (max-width: 768px) {
        #embed-widget input {
          background-color: #FFF !important;
          -webkit-text-fill-color: #333 !important;
          color: #333 !important;
        }
        #embed-widget svg circle {
          fill: black !important;
        }
        #embed-widget svg path,
        #embed-widget svg line {
          stroke: white !important;
        }
      }
      @media (prefers-color-scheme: dark) {
        #embed-widget input {
          background-color: #FFF !important;
          color: #333 !important;
          -webkit-text-fill-color: #333 !important;
        }
        #embed-widget iframe {
          background: #FFF !important;
          background-color: #FFF !important;
        }
        #embed-widget svg circle {
          fill: black !important;
        }
        #embed-widget svg path,
        #embed-widget svg line {
          stroke: white !important;
        }
      }
      @supports (padding-bottom: env(safe-area-inset-bottom)) {
        #embed-widget {
          padding-bottom: env(safe-area-inset-bottom);
        }
      }
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        #embed-widget input {
          color: #333 !important;
          -webkit-text-fill-color: #333 !important;
        }
      }
      /* Force text color for all input states */
      #embed-widget input:disabled,
      #embed-widget input:read-only,
      #embed-widget input::selection {
        -webkit-text-fill-color: #333 !important;
        color: #333 !important;
      }
      #embed-widget input::-moz-selection {
        color: #333 !important;
        background: rgba(0,0,0,0.1) !important;
      }
    `;
    document.head.appendChild(placeholderStyle);
    
    searchBar.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        if (searchBar.value.trim()) {
          if (!isOpen) showChat();
          chatFrame.contentWindow.postMessage({type:'search', text:searchBar.value}, '*');
          searchBar.value = '';
          toggleIcons();
        } else if (!isOpen) {
          showChat();
        }
      }
    });
    
    const iconsContainer = createElem('div', {}, 'position:absolute;right:8px;top:0;bottom:0;margin:auto;display:flex;align-items:center;gap:4px;height:28px;');
    
    const sendIcon = createElem('div', {}, 'display:flex;align-items:center;justify-content:center;width:20px;height:20px;cursor:pointer;opacity:0;transition:opacity 0.45s cubic-bezier(0.25, 0.1, 0.25, 1);pointer-events:none;');
    sendIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="black"/><path d="M18 6L9.5 12.5M18 6L12.5 17.5L9.5 12.5L5 10L18 6Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    
    const iconWrapper = createElem('div', {}, 'position:relative;width:28px;height:28px;');
    
    searchIcon = createElem('img', {
      src: 'https://images.squarespace-cdn.com/content/641c5981823d0207a111bb74/999685ce-589d-4f5f-9763-4e094070fb4b/64e9502e4159bed6f8f57b071db5ac7e+%281%29.gif',
      width: 28,
      height: 28
    }, 'position:absolute;top:0;left:0;width:28px;height:28px;cursor:pointer;opacity:1;transition:all 0.4s cubic-bezier(0.4, 0, 0.2, 1);transform:scale(1) rotate(0deg);');
    
    closeIcon = createElem('div', {}, 'position:absolute;top:0;left:0;display:flex;align-items:center;justify-content:center;width:28px;height:28px;cursor:pointer;opacity:0;transition:all 0.4s cubic-bezier(0.4, 0, 0.2, 1);pointer-events:none;transform:scale(0.8) rotate(-90deg);');
    closeIcon.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="black"/><line x1="15" y1="9" x2="9" y2="15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    
    iconWrapper.append(searchIcon, closeIcon);
    iconsContainer.append(sendIcon, iconWrapper);
    
    const inputWrap = createElem('div', {}, `position:relative;display:flex;align-items:center;min-width:${inputWidth};max-width:calc(100vw - 40px);width:${inputWidth};height:40px;transition:width 0.3s ease;`);
    inputWrap.append(searchBar, iconsContainer);
    
    const containerStyles = isMobile 
      ? 'position:fixed;bottom:0;right:20px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;gap:0;max-width:100%;padding-bottom:calc(20px + env(safe-area-inset-bottom, 0px));'
      : 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;gap:0;max-width:100%;';
    
    container = createElem('div', {id: 'embed-widget'}, containerStyles);
    container.append(chatFrame, inputWrap);
    document.body.appendChild(container);
    
    const handleSend = () => {
      if (searchBar.value.trim()) {
        if (!isOpen) showChat();
        chatFrame.contentWindow.postMessage({type:'search', text:searchBar.value}, '*');
        searchBar.value = '';
        toggleIcons();
      }
    };
    
    searchIcon.addEventListener('click', () => !isOpen && showChat());
    closeIcon.addEventListener('click', () => isOpen && hideChat());
    sendIcon.addEventListener('click', handleSend);
    
    const toggleIcons = () => {
      const hasText = searchBar.value.trim().length > 0;
      sendIcon.style.opacity = hasText ? '1' : '0';
      sendIcon.style.pointerEvents = hasText ? 'auto' : 'none';
      
      if (isOpen) {
        searchIcon.style.opacity = '0';
        searchIcon.style.pointerEvents = 'none';
        closeIcon.style.opacity = '1';
        closeIcon.style.pointerEvents = 'auto';
      }
    };
    
    searchBar.addEventListener('input', toggleIcons);
    
    searchBar.addEventListener('focus', () => {
      if (!isOpen) {
        const width = isMobile ? 'calc(100vw - 40px)' : '350px';
        searchBar.style.width = width;
        inputWrap.style.width = width;
      }
    });
    
    searchBar.addEventListener('blur', () => {
      if (!isOpen) {
        const width = isMobile ? 'calc(100vw - 40px)' : '230px';
        searchBar.style.width = width;
        inputWrap.style.width = width;
      }
    });
    
    window.searchBar = searchBar;
    window.inputWrap = inputWrap;
    
    // Adjust position on viewport changes (keyboard, orientation)
    if (isMobile) {
      // Initial positioning with viewport units
      container.style.position = 'fixed';
      container.style.bottom = '0';
      container.style.paddingBottom = 'calc(20px + env(safe-area-inset-bottom, 0px))';
      
      // Function to force widget visibility
      const forceVisible = () => {
        const rect = container.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        
        // Check if widget is off screen
        if (rect.bottom > viewportHeight || rect.top < 0) {
          // Reset to safe position
          container.style.position = 'fixed';
          container.style.bottom = '0';
          container.style.top = 'auto';
          container.style.transform = 'translateY(0)';
          
          // Use small viewport units as fallback
          container.style.bottom = '0';
          container.style.maxHeight = '100dvh'; // Dynamic viewport height
        }
      };
      
      // Use visualViewport if available (most accurate)
      if (window.visualViewport) {
        const updatePosition = () => {
          const viewport = window.visualViewport;
          const keyboardHeight = window.innerHeight - viewport.height;
          
          // Always stay at bottom of visual viewport
          container.style.position = 'fixed';
          container.style.bottom = '0';
          
          if (keyboardHeight > 50) {
            // Keyboard is open - use transform to stay visible
            container.style.transform = `translateY(-${keyboardHeight}px)`;
          } else {
            // No keyboard - reset transform
            container.style.transform = 'translateY(0)';
          }
          
          // Double-check visibility
          forceVisible();
        };
        
        window.visualViewport.addEventListener('resize', updatePosition);
        window.visualViewport.addEventListener('scroll', updatePosition);
        updatePosition(); // Initial call
      }
      
      // Continuous position monitoring
      let positionCheckInterval = setInterval(() => {
        if (container && container.parentNode) {
          forceVisible();
        } else {
          clearInterval(positionCheckInterval);
        }
      }, 500);
      
      // Fallback resize handler
      let lastHeight = window.innerHeight;
      let resizeTimer;
      
      const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const currentHeight = window.innerHeight;
          
          // Always ensure widget is visible
          container.style.position = 'fixed';
          container.style.bottom = '0';
          forceVisible();
          
          lastHeight = currentHeight;
        }, 50);
      };
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
      
      // Ultra-aggressive scroll handling
      let isScrolling = false;
      let scrollEndTimer;
      
      const handleScroll = () => {
        if (!isScrolling) {
          isScrolling = true;
          // Start of scroll - lock position
          container.style.position = 'fixed';
          container.style.bottom = '0';
        }
        
        // Clear previous timer
        clearTimeout(scrollEndTimer);
        
        // During scroll - continuously adjust
        requestAnimationFrame(() => {
          container.style.position = 'fixed';
          container.style.bottom = '0';
          forceVisible();
        });
        
        // End of scroll detection
        scrollEndTimer = setTimeout(() => {
          isScrolling = false;
          // Final position check
          forceVisible();
          
          // Force browser to recalculate
          container.style.display = 'none';
          container.offsetHeight; // Trigger reflow
          container.style.display = 'flex';
        }, 100);
      };
      
      // Listen to all possible scroll events
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('touchstart', handleScroll, { passive: true });
      window.addEventListener('touchmove', handleScroll, { passive: true });
      window.addEventListener('touchend', handleScroll, { passive: true });
      document.addEventListener('scroll', handleScroll, { passive: true });
      
      // Mutation Observer to detect DOM changes that might affect position
      if ('MutationObserver' in window) {
        const observer = new MutationObserver(() => {
          forceVisible();
        });
        
        observer.observe(document.body, {
          attributes: true,
          childList: true,
          subtree: true,
          attributeFilter: ['style', 'class']
        });
      }
      
      // Page visibility API - check when tab becomes visible
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          forceVisible();
        }
      });
      
      // Final safety net - Intersection Observer
      if ('IntersectionObserver' in window) {
        const visibilityObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (!entry.isIntersecting || entry.intersectionRatio < 0.9) {
              // Widget is not fully visible - force it back
              requestAnimationFrame(() => {
                container.style.position = 'fixed';
                container.style.bottom = '0';
                forceVisible();
              });
            }
          });
        }, { 
          threshold: [0, 0.5, 0.9, 1],
          rootMargin: '0px'
        });
        
        visibilityObserver.observe(container);
      }
    }
  }
  
  window.embedApp.init = function() {
    if (!initialized) {
      renderWidget();
      initialized = true;
    }
  };
  
  setTimeout(() => window.embedApp.init(), 0);
})(window, document);