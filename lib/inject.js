(function(window, document) {
  window.embedApp = window.embedApp || {};
  
  // State
  let initialized = false, container, chatFrame, isOpen = false;
  let searchIcon, closeIcon, overlay = null, originalViewport = null;
  let isExpanded = false;
  let hasConsent = false, showingConsent = false, sessionId = null;
  let pendingSearchText = ''; // Store pending search text
  
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
      
      // Store current scroll position
      const scrollY = window.scrollY || window.pageYOffset;
      
      // Create overlay
      if (!overlay) {
        overlay = createElem('div', { id: 'embed-overlay' }, 
          'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:9998;touch-action:none;-webkit-overflow-scrolling:none;');
        overlay.addEventListener('click', hideChat);
        // Prevent touch events on overlay
        overlay.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        document.body.appendChild(overlay);
      }
      overlay.style.display = 'block';
      
      // Prevent scrolling and zooming with enhanced approach
      document.documentElement.style.cssText = 'overflow:hidden !important;height:100% !important;touch-action:none !important;';
      Object.assign(document.body.style, { 
        overflow: 'hidden', 
        position: 'fixed', 
        width: '100%',
        top: `-${scrollY}px`,
        touchAction: 'none',
        webkitOverflowScrolling: 'none'
      });
      document.body.dataset.scrollY = scrollY;
      
      // Add class to html for additional CSS control
      document.documentElement.classList.add('chat-open-mobile');
      
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
      
      // Prevent iframe scrolling
      if (chatFrame) {
        chatFrame.style.touchAction = 'none';
        chatFrame.style.webkitOverflowScrolling = 'none';
      }
      
      if (window.forceVisible) setTimeout(window.forceVisible, 50);
    },
    
    close: () => {
      if (!CONFIG.isMobile) return;
      
      if (overlay) overlay.style.display = 'none';
      
      // Restore scrolling
      document.documentElement.style.cssText = '';
      document.documentElement.classList.remove('chat-open-mobile');
      
      // Restore scroll position
      const scrollY = document.body.dataset.scrollY || 0;
      Object.assign(document.body.style, { 
        overflow: '', 
        position: '', 
        width: '', 
        top: '',
        touchAction: '',
        webkitOverflowScrolling: ''
      });
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
        delete document.body.dataset.scrollY;
      }
      
      // Restore iframe scrolling
      if (chatFrame) {
        chatFrame.style.touchAction = '';
        chatFrame.style.webkitOverflowScrolling = '';
      }
      
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
  
  function showChat() {
    isOpen = true;
    chatFrame.style.display = 'block';
    setWidths(true);
    updateIconState();
    mobileActions.open();
    
    // Ensure mobile status is sent properly
    setTimeout(ensureMobileStatus, 50);
    
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
  }
  
  function hideChat() {
    isOpen = false;
    chatFrame.style.display = 'none';
    setWidths(false);
    updateIconState();
    mobileActions.close();
    
    // If consent was showing, reset the state
    if (showingConsent) {
      showingConsent = false;
      
      // Re-enable search input and icon
      if (window.searchBar) {
        window.searchBar.disabled = false;
        window.searchBar.style.opacity = '';
        window.searchBar.style.cursor = '';
      }
      if (window.searchIcon) {
        window.searchIcon.style.pointerEvents = '';
        window.searchIcon.style.opacity = '1';
      }
    }
    
    document.removeEventListener('click', handleClickOutside);
  }
  
  function handleClickOutside(event) {
    if (!isOpen || !container) return;
    
    if (!container.contains(event.target)) {
      hideChat();
    }
  }
  
  function expandChat() {
    if (!chatFrame) return;
    isExpanded = true;
    
    const expandedWidth = CONFIG.isMobile ? 'calc(100vw - 40px)' : '600px';
    const expandedHeight = CONFIG.isMobile ? 'calc(100vh - 120px)' : '700px';
    
    chatFrame.style.width = expandedWidth;
    chatFrame.style.height = expandedHeight;
    chatFrame.style.transition = 'all 0.3s ease';
    
    container.style.transition = 'all 0.3s ease';
  }
  
  function collapseChat() {
    if (!chatFrame) return;
    isExpanded = false;
    
    chatFrame.style.width = getWidth('chatWidth');
    chatFrame.style.height = CONFIG.isMobile ? 'calc(100vh - 100px)' : '500px';
    
  }
  
  // Helper function to generate UUID session ID
  function generateSessionId() {
    // Use crypto.randomUUID() if available, otherwise fallback to manual UUID v4
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    } else {
      // Fallback UUID v4 generation
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  }

  // Consent management functions
  function checkConsent() {
    const consent = localStorage.getItem('singulary_privacy_consent');
    hasConsent = consent === 'accepted';
    
    // Load existing session ID if consent exists
    if (hasConsent) {
      sessionId = localStorage.getItem('singulary_session_id');
      // Generate new session ID if none exists
      if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem('singulary_session_id', sessionId);
      }
    }
    
    return hasConsent;
  }

  function saveConsent(accepted, nonEssential = true) {
    if (accepted) {
      localStorage.setItem('singulary_privacy_consent', 'accepted');
      localStorage.setItem('singulary_non_essential_cookies', nonEssential ? 'accepted' : 'rejected');
      
      // Generate and store session ID
      sessionId = generateSessionId();
      localStorage.setItem('singulary_session_id', sessionId);
      
      hasConsent = true;
      
      console.log('Consent accepted, session ID created:', sessionId);
    } else {
      localStorage.removeItem('singulary_privacy_consent');
      localStorage.removeItem('singulary_non_essential_cookies');
      localStorage.removeItem('singulary_session_id');
      hasConsent = false;
      sessionId = null;
      
      console.log('Consent revoked, session cleared');
    }
    
    // Notify iframe
    if (chatFrame && chatFrame.contentWindow) {
      chatFrame.contentWindow.postMessage({
        type: 'consentUpdate',
        hasConsent: hasConsent,
        sessionId: sessionId
      }, '*');
    }
  }

  function showConsentIfNeeded() {
    if (!hasConsent && !showingConsent) {
      showingConsent = true;
      
      // Hide keyboard and disable search input
      if (window.searchBar) {
        window.searchBar.blur();
        window.searchBar.disabled = true;
        window.searchBar.style.opacity = '0.5';
        window.searchBar.style.cursor = 'not-allowed';
      }
      
      // Also disable and hide the search icon (GIF)
      if (window.searchIcon) {
        window.searchIcon.style.pointerEvents = 'none';
        window.searchIcon.style.opacity = '0';
      }
      
      // First ensure chat is open so user can see the consent modal
      if (!isOpen) {
        showChat();
      }
      
      // Small delay to ensure iframe is ready
      setTimeout(() => {
        if (chatFrame && chatFrame.contentWindow) {
          chatFrame.contentWindow.postMessage({
            type: 'showConsent'
          }, '*');
        }
      }, 100);
    }
  }

  window.addEventListener('message', (event) => {
    if (event.origin === CONFIG.origin) {
      if (event.data?.type === 'chatClose') {
        hideChat();
      } else if (event.data?.type === 'expandChat') {
        if (isExpanded) {
          collapseChat();
        } else {
          expandChat();
        }
      } else if (event.data?.type === 'consentAccepted') {
        saveConsent(true, event.data.nonEssential);
        showingConsent = false;
        
        // Re-enable search input and icon
        if (window.searchBar) {
          window.searchBar.disabled = false;
          window.searchBar.style.opacity = '';
          window.searchBar.style.cursor = '';
        }
        if (window.searchIcon) {
          window.searchIcon.style.pointerEvents = '';
          window.searchIcon.style.opacity = '1';
        }
      } else if (event.data?.type === 'consentRejected') {
        // Check if this is a revocation (had consent before)
        const wasRevocation = hasConsent;
        
        saveConsent(false);
        showingConsent = false;
        
        // Clear any pending search request - reset to beginning state
        pendingSearchText = '';
        
        // Always reset the chat when consent is rejected - complete cleanup
        if (chatFrame && chatFrame.contentWindow) {
          chatFrame.contentWindow.postMessage({
            type: 'resetChat'
          }, '*');
        }
        
        // Close chat when consent is rejected
        hideChat();
        
        // Re-enable search input and icon for future attempts
        if (window.searchBar) {
          window.searchBar.disabled = false;
          window.searchBar.style.opacity = '';
          window.searchBar.style.cursor = '';
          // Clear the input field - reset to beginning state
          window.searchBar.value = '';
          // Update icon state to reflect empty input
          toggleIcons();
        }
        if (window.searchIcon) {
          window.searchIcon.style.pointerEvents = '';
          window.searchIcon.style.opacity = '1';
        }
      } else if (event.data?.type === 'consentRequired') {
        showConsentIfNeeded();
      } else if (event.data?.type === 'requestPendingSearch') {
        // Send stored search text if available
        if (pendingSearchText.trim() && chatFrame && chatFrame.contentWindow) {
          chatFrame.contentWindow.postMessage({
            type: 'search',
            text: pendingSearchText,
            sessionId: sessionId
          }, '*');
          // Clear pending search after sending
          pendingSearchText = '';
          // Clear the input field
          if (window.searchBar) {
            window.searchBar.value = '';
            toggleIcons();
          }
        }
      }
    }
  });
  
  function sendMobileStatus() {
    if (chatFrame && chatFrame.contentWindow) {
      chatFrame.contentWindow.postMessage({
        type: 'mobileStatus',
        isMobile: CONFIG.isMobile
      }, '*');
    }
  }
  
  // Enhanced mobile status sending
  function ensureMobileStatus() {
    sendMobileStatus();
    // Retry a few times to ensure it gets through
    setTimeout(sendMobileStatus, 100);
    setTimeout(sendMobileStatus, 300);
    setTimeout(sendMobileStatus, 500);
  }
  
  function setupIframeLoadHandler() {
    if (chatFrame) {
      chatFrame.addEventListener('load', () => {
        // Ensure mobile status is sent when iframe loads
        setTimeout(ensureMobileStatus, 100);
      });
    }
  }
  
  function renderWidget() {
    if (container) return;
    
    const styles = createElem('style');
    styles.innerHTML = `
      /* Prevent scrolling when chat is open on mobile */
      html.chat-open-mobile,
      html.chat-open-mobile body {
        overflow: hidden !important;
        position: fixed !important;
        width: 100% !important;
        height: 100% !important;
        touch-action: none !important;
        -webkit-overflow-scrolling: none !important;
        overscroll-behavior: none !important;
      }
      
      #embed-widget iframe {
        overscroll-behavior: contain !important;
        -webkit-overflow-scrolling: none !important;
      }
      
      #embed-overlay {
        touch-action: none !important;
        -webkit-overflow-scrolling: none !important;
      }
      
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
      referrerPolicy: 'origin',
      scrolling: 'no'
    }, `display:none;width:${getWidth('chatWidth')};height:${CONFIG.isMobile ? 'calc(100vh - 100px)' : '500px'};border:none;border-radius:20px;box-shadow:0 4px 12px rgba(0,0,0,0.15);background:transparent;margin-bottom:10px;${CONFIG.isMobile ? 'overflow:hidden;touch-action:none;' : ''}`);
    
    const searchBar = createElem('input', {
      type: 'text',
      placeholder: 'Stell uns deine Frage...'
    }, `width:${getWidth('inputWidth')};height:40px;padding:0 58px 0 14px;font-size:15px;background:#FFF !important;color:#333 !important;-webkit-text-fill-color:#333 !important;border:none;border-radius:20px;box-sizing:border-box;outline:none;box-shadow:0 6px 16px rgba(0,0,0,0.7), 0 2px 5px rgba(0,0,0,0.4);transition:width 0.3s ease;`);
    
    // Icons
    const iconsContainer = createElem('div', {}, 'position:absolute;right:8px;top:0;bottom:0;margin:auto;display:flex;align-items:center;gap:4px;height:28px;');
    
    const sendIcon = createElem('div', {}, 'display:flex;align-items:center;justify-content:center;width:20px;height:20px;cursor:pointer;opacity:0;transition:opacity 0.45s;pointer-events:none;');
    sendIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="black"/><path d="M18 6L9.5 12.5M18 6L12.5 17.5L9.5 12.5L5 10L18 6Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    
    searchIcon = createElem('img', {
      src: 'https://images.squarespace-cdn.com/content/641c5981823d0207a111bb74/999685ce-589d-4f5f-9763-4e094070fb4b/64e9502e4159bed6f8f57b071db5ac7e+%281%29.gif',
      width: 28,
      height: 28
    }, 'position:absolute;top:0;left:0;width:28px;height:28px;cursor:pointer;opacity:1;transition:transform 0.4s;');
    
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
    
    // Setup iframe load handler for mobile status
    setupIframeLoadHandler();
    
    // Check consent on initialization
    checkConsent();
    
    // Event handlers
    const handleSend = () => {
      const text = searchBar.value.trim();
      if (!text) return;
      
      // Always re-check consent from localStorage before sending
      const currentConsent = localStorage.getItem('singulary_privacy_consent');
      hasConsent = currentConsent === 'accepted';
      
      // If consent was revoked, store the search text and show consent
      if (!hasConsent) {
        pendingSearchText = text; // Store the search text
        sessionId = null;
        showConsentIfNeeded();
        return;
      }
      
      // Re-check session ID exists
      if (!sessionId) {
        sessionId = localStorage.getItem('singulary_session_id');
        if (!sessionId) {
          // Generate new session if needed
          sessionId = generateSessionId();
          localStorage.setItem('singulary_session_id', sessionId);
        }
      }
      
      if (!isOpen) showChat();
      chatFrame.contentWindow.postMessage({ 
        type: 'search', 
        text,
        sessionId: sessionId 
      }, '*');
      searchBar.value = '';
      toggleIcons();
      
      // Hide keyboard on mobile by blurring the input
      searchBar.blur();
      
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
        // Prevent default to avoid any form submission
        e.preventDefault();
      }
    });
    
    searchBar.addEventListener('input', toggleIcons);
    searchBar.addEventListener('focus', () => !isOpen && setWidths(true));
    searchBar.addEventListener('blur', () => !isOpen && setWidths(false));
    
    searchIcon.addEventListener('click', () => {
      if (!isOpen) {
        showChat();
        // If no consent, immediately show consent modal
        if (!hasConsent) {
          showConsentIfNeeded();
        }
      }
    });
    closeIcon.addEventListener('click', () => isOpen && hideChat());
    sendIcon.addEventListener('click', handleSend);
    
    // Expose globally
    window.searchBar = searchBar;
    window.inputWrap = inputWrap;
    window.searchIcon = searchIcon;
    window.closeIcon = closeIcon;
    
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
      let keyboardActive = false;
      
      const forceVisible = () => {
        const viewportHeight = window.innerHeight;
        const visualViewportHeight = window.visualViewport ? window.visualViewport.height : viewportHeight;
        const inputRect = inputWrap?.getBoundingClientRect();
        
        // Detect if keyboard is active
        keyboardActive = (viewportHeight - visualViewportHeight) > 50;
        
        // Handle input positioning (original working logic)
        if (inputRect && inputRect.bottom > viewportHeight) {
          const moveUp = inputRect.bottom - viewportHeight + 20;
          container.style.transform = `translateY(-${Math.max(0, moveUp)}px)`;
        }
        
        // Handle chat frame height expansion
        if (isOpen && chatFrame) {
          const inputHeight = inputWrap.offsetHeight;
          
          if (keyboardActive) {
            // Keyboard is visible - use visual viewport
            const availableHeight = visualViewportHeight - inputHeight - 40;
            chatFrame.style.height = `${Math.max(200, availableHeight)}px`;
          } else {
            // Keyboard is gone - expand to full height
            const fullHeight = viewportHeight - inputHeight - 80;
            chatFrame.style.height = `${Math.max(200, fullHeight)}px`;
          }
        }
      };
      
      window.forceVisible = forceVisible;
      
      if (window.visualViewport) {
        const updatePosition = () => {
          const keyboardHeight = window.innerHeight - window.visualViewport.height;
          container.style.transform = keyboardHeight > 50 ? `translateY(-${keyboardHeight}px)` : 'translateY(0)';
          forceVisible();
        };
        
        window.visualViewport.addEventListener('resize', updatePosition);
        window.visualViewport.addEventListener('scroll', updatePosition);
      }
      
      setInterval(() => container?.parentNode && forceVisible(), 500);
    }
  }
  
  window.embedApp.init = () => {
    if (!initialized) {
      renderWidget();
      initialized = true;
    }
  };
  
  setTimeout(window.embedApp.init, 0);
})(window, document);