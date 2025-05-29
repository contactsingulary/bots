(function(window, document) {
  window.embedApp = window.embedApp || {};
  
  // State
  let initialized = false, container, chatFrame, isOpen = false;
  let searchIcon, closeIcon, overlay = null, originalViewport = null;
  
  // Constants
  const CONFIG = {
    origin: 'https://embed.singulary-tech.de',
    isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    dimensions: {
      chatWidth: { mobile: 'calc(100vw - 40px)', desktop: '350px' },
      chatHeight: { mobile: 'calc(100vh - 100px)', desktop: '500px' },
      inputWidth: { mobile: 'calc(100vw - 40px)', desktop: '230px' },
      inputWidthExpanded: { mobile: 'calc(100vw - 40px)', desktop: '350px' }
    }
  };
  
  // Helper functions
  const getWidth = (type, expanded = false) => {
    const key = expanded ? 'inputWidthExpanded' : type;
    return CONFIG.dimensions[key][CONFIG.isMobile ? 'mobile' : 'desktop'];
  };
  
  const setWidths = (expanded) => {
    if (!window.searchBar || !window.inputWrap) return;
    const width = getWidth('inputWidth', expanded);
    window.searchBar.style.width = width;
    window.inputWrap.style.width = width;
  };
  
  const createElem = (tag, props = {}, styles = '') => {
    const el = document.createElement(tag);
    Object.assign(el, props);
    if (styles) el.style.cssText = styles;
    return el;
  };
  
  // Icon state management
  function updateIconState() {
    if (!searchIcon || !closeIcon) return;
    const icons = [
      { el: searchIcon, show: !isOpen, transform: 'scale(1) rotate(0deg)', hideTransform: 'scale(0.8) rotate(90deg)' },
      { el: closeIcon, show: isOpen, transform: 'scale(1) rotate(0deg)', hideTransform: 'scale(0.8) rotate(-90deg)' }
    ];
    
    icons.forEach(({ el, show, transform, hideTransform }) => {
      el.style.opacity = show ? '1' : '0';
      el.style.transform = show ? transform : hideTransform;
      el.style.pointerEvents = show ? 'auto' : 'none';
    });
  }
  
  // Mobile-specific functions
  const mobileActions = {
    open: () => {
      if (!CONFIG.isMobile) return;
      
      // Create overlay
      if (!overlay) {
        overlay = createElem('div', { id: 'embed-overlay' }, 
          'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:9998;');
        overlay.addEventListener('click', hideChat);
        document.body.appendChild(overlay);
      }
      overlay.style.display = 'block';
      
      // Prevent scrolling and zooming
      Object.assign(document.body.style, { overflow: 'hidden', position: 'fixed', width: '100%' });
      
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        originalViewport = viewport.getAttribute('content');
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
      } else {
        const newViewport = createElem('meta');
        newViewport.name = 'viewport';
        newViewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
        document.head.appendChild(newViewport);
      }
      
      if (window.forceVisible) setTimeout(window.forceVisible, 50);
    },
    
    close: () => {
      if (!CONFIG.isMobile) return;
      
      if (overlay) overlay.style.display = 'none';
      
      // Restore scrolling
      Object.assign(document.body.style, { overflow: '', position: '', width: '' });
      
      // Restore viewport
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        if (originalViewport) {
          viewport.setAttribute('content', originalViewport);
        } else {
          viewport.remove();
        }
      }
    }
  };
  
  // Chat visibility functions
  function showChat() {
    isOpen = true;
    chatFrame.style.display = 'block';
    setWidths(true);
    updateIconState();
    mobileActions.open();
  }
  
  function hideChat() {
    isOpen = false;
    chatFrame.style.display = 'none';
    setWidths(false);
    updateIconState();
    mobileActions.close();
  }
  
  // Message handling
  window.addEventListener('message', (event) => {
    if (event.origin === CONFIG.origin && event.data?.type === 'chatClose') {
      hideChat();
    }
  });
  
  // Main render function
  function renderWidget() {
    if (container) return;
    
    // Styles
    const styles = createElem('style');
    styles.innerHTML = `
      #embed-widget input {
        background: #FFF !important;
        color: #333 !important;
        -webkit-text-fill-color: #333 !important;
        -webkit-appearance: none;
        caret-color: #333 !important;
      }
      #embed-widget input::placeholder {
        color: transparent;
        text-shadow: 0 0 0 #333;
      }
      #embed-widget input:-webkit-autofill {
        -webkit-box-shadow: 0 0 0 30px white inset !important;
        -webkit-text-fill-color: #333 !important;
      }
      #embed-widget iframe {
        background: #FFF !important;
      }
      
      /* Force SVG colors - desktop and mobile */
      #embed-widget svg circle,
      #embed-widget div svg circle {
        fill: black !important;
        fill-opacity: 1 !important;
      }
      #embed-widget svg path,
      #embed-widget svg line,
      #embed-widget div svg path,
      #embed-widget div svg line {
        stroke: white !important;
        stroke-opacity: 1 !important;
      }
      #embed-widget svg *[fill] {
        fill: black !important;
      }
      #embed-widget svg *[stroke] {
        stroke: white !important;
      }
      
      /* Additional forcing for all states */
      #embed-widget *:not(input) svg circle {
        fill: black !important;
      }
      #embed-widget *:not(input) svg path,
      #embed-widget *:not(input) svg line {
        stroke: white !important;
      }
      
      /* Force on all media */
      @media all {
        #embed-widget svg circle { fill: black !important; }
        #embed-widget svg path, #embed-widget svg line { stroke: white !important; }
      }
      
      ${CONFIG.isMobile ? `
        #embed-widget.mobile-widget {
          position: fixed !important;
          bottom: 0 !important;
          right: 20px !important;
          max-height: 100dvh !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: flex-end !important;
          padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px)) !important;
        }
        #embed-widget.mobile-widget iframe {
          max-height: calc(100dvh - 100px) !important;
          flex-shrink: 1;
        }
        #embed-widget.mobile-widget > div:last-child {
          flex-shrink: 0;
          position: relative;
          z-index: 10000;
        }
      ` : ''}
    `;
    document.head.appendChild(styles);
    
    // Create elements
    chatFrame = createElem('iframe', {
      src: `${CONFIG.origin}/chat`,
      title: 'Chat',
      allow: 'autoplay; clipboard-write; encrypted-media; picture-in-picture;',
      referrerPolicy: 'origin'
    }, `display:none;width:${getWidth('chatWidth')};height:${getWidth('chatHeight')};border:none;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);background:#FFF;margin-bottom:10px;`);
    
    const searchBar = createElem('input', {
      type: 'text',
      placeholder: 'Brauchst du Hilfe?'
    }, `width:${getWidth('inputWidth')};height:40px;padding:0 58px 0 14px;font-size:15px;background:#FFF !important;color:#333 !important;-webkit-text-fill-color:#333 !important;border:none;border-radius:20px;box-sizing:border-box;outline:none;box-shadow:0 6px 16px rgba(0,0,0,0.7), 0 2px 5px rgba(0,0,0,0.4);transition:width 0.3s ease;`);
    
    // Icons
    const iconsContainer = createElem('div', {}, 'position:absolute;right:8px;top:0;bottom:0;margin:auto;display:flex;align-items:center;gap:4px;height:28px;');
    
    const sendIcon = createElem('div', {}, 'display:flex;align-items:center;justify-content:center;width:20px;height:20px;cursor:pointer;opacity:0;transition:opacity 0.45s;pointer-events:none;');
    sendIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="black"/><path d="M18 6L9.5 12.5M18 6L12.5 17.5L9.5 12.5L5 10L18 6Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    
    searchIcon = createElem('img', {
      src: 'https://images.squarespace-cdn.com/content/641c5981823d0207a111bb74/999685ce-589d-4f5f-9763-4e094070fb4b/64e9502e4159bed6f8f57b071db5ac7e+%281%29.gif',
      width: 28,
      height: 28
    }, 'position:absolute;top:0;left:0;width:28px;height:28px;cursor:pointer;opacity:1;transition:all 0.4s;');
    
    closeIcon = createElem('div', {}, 'position:absolute;top:0;left:0;display:flex;align-items:center;justify-content:center;width:28px;height:28px;cursor:pointer;opacity:0;transition:all 0.4s;pointer-events:none;');
    closeIcon.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="black"/><line x1="15" y1="9" x2="9" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>';
    
    const iconWrapper = createElem('div', {}, 'position:relative;width:28px;height:28px;');
    iconWrapper.append(searchIcon, closeIcon);
    iconsContainer.append(sendIcon, iconWrapper);
    
    const inputWrap = createElem('div', {}, `position:relative;display:flex;align-items:center;width:${getWidth('inputWidth')};height:40px;transition:width 0.3s ease;`);
    inputWrap.append(searchBar, iconsContainer);
    
    container = createElem('div', { id: 'embed-widget' }, 
      CONFIG.isMobile 
        ? 'position:fixed;bottom:0;right:20px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;gap:0;padding-bottom:calc(20px + env(safe-area-inset-bottom, 0px));'
        : 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;gap:0;'
    );
    
    if (CONFIG.isMobile) container.classList.add('mobile-widget');
    container.append(chatFrame, inputWrap);
    document.body.appendChild(container);
    
    // Event handlers
    const handleSend = () => {
      const text = searchBar.value.trim();
      if (!text) return;
      
      if (!isOpen) showChat();
      chatFrame.contentWindow.postMessage({ type: 'search', text }, '*');
      searchBar.value = '';
      toggleIcons();
      
      if (CONFIG.isMobile && window.forceVisible) {
        setTimeout(window.forceVisible, 100);
      }
    };
    
    const toggleIcons = () => {
      const hasText = searchBar.value.trim().length > 0;
      sendIcon.style.opacity = hasText ? '1' : '0';
      sendIcon.style.pointerEvents = hasText ? 'auto' : 'none';
    };
    
    // Event listeners
    searchBar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (searchBar.value.trim()) {
          handleSend();
        } else if (!isOpen) {
          showChat();
        }
      }
    });
    
    searchBar.addEventListener('input', toggleIcons);
    searchBar.addEventListener('focus', () => !isOpen && setWidths(true));
    searchBar.addEventListener('blur', () => !isOpen && setWidths(false));
    
    searchIcon.addEventListener('click', () => !isOpen && showChat());
    closeIcon.addEventListener('click', () => isOpen && hideChat());
    sendIcon.addEventListener('click', handleSend);
    
    // Expose globally
    window.searchBar = searchBar;
    window.inputWrap = inputWrap;
    
    // Force SVG colors after render
    const forceSvgColors = () => {
      const svgCircles = container.querySelectorAll('svg circle');
      const svgPaths = container.querySelectorAll('svg path');
      const svgLines = container.querySelectorAll('svg line');
      
      svgCircles.forEach(circle => {
        circle.style.setProperty('fill', 'black', 'important');
        circle.style.setProperty('fill-opacity', '1', 'important');
      });
      
      svgPaths.forEach(path => {
        path.style.setProperty('stroke', 'white', 'important');
        path.style.setProperty('stroke-opacity', '1', 'important');
      });
      
      svgLines.forEach(line => {
        line.style.setProperty('stroke', 'white', 'important');
        line.style.setProperty('stroke-opacity', '1', 'important');
      });
    };
    
    // Apply colors immediately and after a delay
    forceSvgColors();
    setTimeout(forceSvgColors, 100);
    
    // Also force on any icon state change
    const originalUpdateIconState = updateIconState;
    updateIconState = function() {
      originalUpdateIconState.apply(this, arguments);
      setTimeout(forceSvgColors, 10);
    };
    
    // Mobile position management
    if (CONFIG.isMobile) {
      const forceVisible = () => {
        const viewportHeight = window.innerHeight;
        const inputRect = inputWrap?.getBoundingClientRect();
        
        if (inputRect && inputRect.bottom > viewportHeight) {
          const moveUp = inputRect.bottom - viewportHeight + 20;
          container.style.transform = `translateY(-${Math.max(0, moveUp)}px)`;
        }
        
        if (isOpen && chatFrame) {
          const totalHeight = chatFrame.offsetHeight + inputWrap.offsetHeight + 30;
          if (totalHeight > viewportHeight) {
            chatFrame.style.height = `${Math.max(200, viewportHeight - inputWrap.offsetHeight - 60)}px`;
          }
        }
      };
      
      window.forceVisible = forceVisible;
      
      // Viewport handling
      if (window.visualViewport) {
        const updatePosition = () => {
          const keyboardHeight = window.innerHeight - window.visualViewport.height;
          container.style.transform = keyboardHeight > 50 ? `translateY(-${keyboardHeight}px)` : 'translateY(0)';
          forceVisible();
        };
        
        window.visualViewport.addEventListener('resize', updatePosition);
        window.visualViewport.addEventListener('scroll', updatePosition);
      }
      
      // Position monitoring
      setInterval(() => container?.parentNode && forceVisible(), 500);
    }
  }
  
  // Initialize
  window.embedApp.init = () => {
    if (!initialized) {
      renderWidget();
      initialized = true;
    }
  };
  
  setTimeout(window.embedApp.init, 0);
})(window, document);