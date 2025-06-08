// ===============================================
// === CHAT WIDGET EMBED SCRIPT ===
// ===============================================
// This script injects the Singulary chat widget into any website
// Handles consent management, mobile optimization, and API communication

(function(window, document) {
  window.embedApp = window.embedApp || {};
  
  // ===============================================
  // === GLOBAL STATE VARIABLES ===
  // ===============================================
  // Core widget state
  let initialized = false;           // Widget has been rendered
  let container, chatFrame;          // DOM elements
  let isOpen = false;               // Chat window is visible
  let isExpanded = false;           // Chat is in expanded mode
  
  // UI element references
  let searchIcon, closeIcon;        // Button elements
  let overlay = null;              // Mobile overlay background
  let originalViewport = null;     // Stored viewport meta tag
  
  // Privacy and user tracking
  let hasConsent = false;          // User has accepted privacy policy
  let showingConsent = false;      // Consent modal is currently shown
  let sessionId = null;           // Current session identifier
  let userId = null;              // Persistent user identifier
  let pendingSearchText = '';     // Search text waiting for consent
  
  // Scroll position preservation
  let savedScrollPosition = 0;    // Stored scroll position for expand/collapse
  let isTransitioning = false;    // Prevent scroll conflicts during transitions

  // ===============================================
  // === CONFIGURATION CONSTANTS ===
  // ===============================================
  const CONFIG = {
    // API endpoint for chat iframe
    origin: 'https://embed.singulary-tech.de',
    
    // Device detection for mobile optimizations
    isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    
    // Responsive dimensions for different screen sizes
    dimensions: {
      chatWidth: { mobile: 'calc(100vw - 40px)', desktop: '350px' },
      chatHeight: { mobile: 'calc(100vh - 100px)', desktop: '500px' },
      inputWidth: { mobile: 'calc(100vw - 40px)', desktop: '230px' },
      inputWidthExpanded: { mobile: 'calc(100vw - 40px)', desktop: '350px' }
    }
  };

  // ===============================================
  // === UTILITY HELPER FUNCTIONS ===
  // ===============================================
  
  // Get responsive width based on device and expansion state
  const getWidth = (type, expanded = false) => {
    const key = expanded ? 'inputWidthExpanded' : type;
    return CONFIG.dimensions[key][CONFIG.isMobile ? 'mobile' : 'desktop'];
  };

  // Update search bar and input wrapper widths
  const setWidths = (expanded) => {
    if (!window.searchBar || !window.inputWrap) return;
    const width = getWidth('inputWidth', expanded);
    window.searchBar.style.width = width;
    window.inputWrap.style.width = width;
  };

  // Create DOM element with properties and styles
  const createElem = (tag, props = {}, styles = '') => {
    const el = document.createElement(tag);
    Object.assign(el, props);
    if (styles) el.style.cssText = styles;
    return el;
  };
  
  // ===============================================
  // === ICON STATE MANAGEMENT ===
  // ===============================================
  
  // Toggle between search icon (GIF) and close icon with smooth animations
  function updateIconState() {
    if (!searchIcon || !closeIcon) return;
    
    const icons = [
      { 
        el: searchIcon, 
        show: !isOpen, 
        transform: 'scale(1) rotate(0deg)', 
        hideTransform: 'scale(0.8) rotate(90deg)' 
      },
      { 
        el: closeIcon, 
        show: isOpen, 
        transform: 'scale(1) rotate(0deg)', 
        hideTransform: 'scale(0.8) rotate(-90deg)' 
      }
    ];
    
    icons.forEach(({ el, show, transform, hideTransform }) => {
      el.style.opacity = show ? '1' : '0';
      el.style.transform = show ? transform : hideTransform;
      el.style.pointerEvents = show ? 'auto' : 'none';
    });
  }
  
  // ===============================================
  // === MOBILE-SPECIFIC FUNCTIONS ===
  // ===============================================
  // Handle mobile device optimizations for full-screen chat experience
  
  const mobileActions = {
    // Open chat on mobile - prevent body scroll, create overlay, lock viewport
    open: () => {
      if (!CONFIG.isMobile) return;
      
      // Store current scroll position to restore later
      const scrollY = window.scrollY || window.pageYOffset;
      
      // Create dark overlay behind chat to focus attention
      if (!overlay) {
        overlay = createElem('div', { id: 'embed-overlay' }, 
          'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:9998;touch-action:none;-webkit-overflow-scrolling:none;');
        overlay.addEventListener('click', hideChat);
        // Prevent touch events on overlay to avoid unwanted scrolling
        overlay.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        document.body.appendChild(overlay);
      }
      overlay.style.display = 'block';
      
      // Lock page scrolling and zooming for chat focus
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
      
      // Add CSS class for additional mobile styling control
      document.documentElement.classList.add('chat-open-mobile');
      
      // Lock viewport to prevent zooming during chat interaction
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
      
      // Prevent iframe from interfering with touch events
      if (chatFrame) {
        chatFrame.style.touchAction = 'none';
        chatFrame.style.webkitOverflowScrolling = 'none';
      }
      
      // Trigger mobile positioning function if available
      if (window.forceVisible) setTimeout(window.forceVisible, 50);
    },
    
    // Close chat on mobile - restore all original page state
    close: () => {
      if (!CONFIG.isMobile) return;
      
      // Hide overlay
      if (overlay) overlay.style.display = 'none';
      
      // Restore page scrolling and zoom capabilities
      document.documentElement.style.cssText = '';
      document.documentElement.classList.remove('chat-open-mobile');
      
      // Restore original scroll position
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
      
      // Restore iframe touch behavior
      if (chatFrame) {
        chatFrame.style.touchAction = '';
        chatFrame.style.webkitOverflowScrolling = '';
      }
      
      // Restore original viewport settings
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
  
  // ===============================================
  // === CHAT VISIBILITY MANAGEMENT ===
  // ===============================================
  
  // Show chat window with all necessary setup
  function showChat() {
    isOpen = true;
    chatFrame.style.display = 'block';
    setWidths(true);                    // Expand input width
    updateIconState();                  // Switch to close icon
    mobileActions.open();              // Handle mobile optimizations
    
    // Save chat open state to localStorage (desktop only)
    if (!CONFIG.isMobile) {
      localStorage.setItem('singulary_chat_open', 'true');
    }
    
    // Ensure mobile status is communicated to iframe
    setTimeout(ensureMobileStatus, 50);
    
    // Send consent and session info to iframe if available
    setTimeout(() => {
      if (hasConsent && sessionId && userId && chatFrame && chatFrame.contentWindow) {
        chatFrame.contentWindow.postMessage({
          type: 'consentUpdate',
          hasConsent: hasConsent,
          sessionId: sessionId,
          userId: userId
        }, '*');
        console.log('Sent session info to chat iframe:', { sessionId, userId });
      }
    }, 100);
    
    // Add click-outside handler after a small delay
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
  }
  
  // Hide chat window and restore original state
  function hideChat() {
    isOpen = false;
    chatFrame.style.display = 'none';
    setWidths(false);                   // Collapse input width
    updateIconState();                  // Switch to search icon
    mobileActions.close();             // Restore mobile state
    
    // Save chat closed state to localStorage (desktop only)
    if (!CONFIG.isMobile) {
      localStorage.setItem('singulary_chat_open', 'false');
    }
    
    // If consent modal was showing, reset the consent state
    if (showingConsent) {
      showingConsent = false;
      
      // Re-enable search input and icon for future use
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
    
    // Remove click-outside handler
    document.removeEventListener('click', handleClickOutside);
  }
  
  // Close chat when user clicks outside the widget
  function handleClickOutside(event) {
    if (!isOpen || !container) return;
    
    if (!container.contains(event.target)) {
      hideChat();
    }
  }
  
  // Expand chat to larger size (desktop feature)
  function expandChat() {
    if (!chatFrame) return;
    
    // Capture current scroll position before expanding
    captureScrollPosition();
    
    isExpanded = true;
    isTransitioning = true;
    
    const expandedWidth = CONFIG.isMobile ? 'calc(100vw - 40px)' : '600px';
    const expandedHeight = CONFIG.isMobile ? 'calc(100vh - 120px)' : '700px';
    
    chatFrame.style.width = expandedWidth;
    chatFrame.style.height = expandedHeight;
    chatFrame.style.transition = 'all 0.3s ease';
    
    container.style.transition = 'all 0.3s ease';
    
    // Restore scroll position after expansion completes
    setTimeout(() => {
      restoreScrollPosition();
      isTransitioning = false;
    }, 350); // Slightly after transition ends
  }
  
  // Collapse chat back to normal size
  function collapseChat() {
    if (!chatFrame) return;
    
    // Capture current scroll position before collapsing
    captureScrollPosition();
    
    isExpanded = false;
    isTransitioning = true;
    
    chatFrame.style.width = getWidth('chatWidth');
    chatFrame.style.height = CONFIG.isMobile ? 'calc(100vh - 100px)' : '500px';
    chatFrame.style.transition = 'all 0.3s ease';
    
    // Restore scroll position after collapse completes
    setTimeout(() => {
      restoreScrollPosition();
      isTransitioning = false;
    }, 350); // Slightly after transition ends
  }
  
  // ===============================================
  // === SCROLL POSITION PRESERVATION ===
  // ===============================================
  
  // Capture current scroll position from chat iframe (simplified - always go to bottom)
  function captureScrollPosition() {
    if (!chatFrame || !chatFrame.contentWindow) return;
    
    try {
      // Request scroll position from iframe (will return 'bottom')
      chatFrame.contentWindow.postMessage({
        type: 'getScrollPosition'
      }, '*');
    } catch (e) {
      console.warn('Could not capture scroll position:', e);
    }
  }
  
  // Scroll to bottom in chat iframe after expand/collapse
  function restoreScrollPosition() {
    if (!chatFrame || !chatFrame.contentWindow) return;
    
    try {
      // Send command to scroll to bottom
      chatFrame.contentWindow.postMessage({
        type: 'setScrollPosition'
      }, '*');
    } catch (e) {
      console.warn('Could not restore scroll position:', e);
    }
  }
  
  // ===============================================
  // === ID GENERATION FUNCTIONS ===
  // ===============================================
  
  // Generate unique session ID for current chat session
  function generateSessionId() {
    // Use native crypto API if available, otherwise fallback to manual generation
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    } else {
      // Manual UUID v4 generation for older browsers
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  }

  // Generate unique user ID for persistent user identification
  function generateUserId() {
    // Use native crypto API if available, otherwise fallback to manual generation
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    } else {
      // Manual UUID v4 generation for older browsers
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  }

  // ===============================================
  // === CONSENT MANAGEMENT FUNCTIONS ===
  // ===============================================
  
  // Check if user has previously given consent and load stored IDs
  function checkConsent() {
    const consent = localStorage.getItem('singulary_privacy_consent');
    hasConsent = consent === 'accepted';
    
    // Load existing session ID and user ID if consent exists
    if (hasConsent) {
      sessionId = localStorage.getItem('singulary_session_id');
      userId = localStorage.getItem('singulary_user_id');
      
      // Generate new session ID if none exists (session expired)
      if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem('singulary_session_id', sessionId);
      }
      
      // Generate new user ID if none exists (first time user)
      if (!userId) {
        userId = generateUserId();
        localStorage.setItem('singulary_user_id', userId);
      }
    }
    
    return hasConsent;
  }

  // Save user's consent choice and generate/clear tracking IDs accordingly
  function saveConsent(accepted, nonEssential = true) {
    if (accepted) {
      // Store consent preferences in localStorage
      localStorage.setItem('singulary_privacy_consent', 'accepted');
      localStorage.setItem('singulary_non_essential_cookies', nonEssential ? 'accepted' : 'rejected');
      
      // Use existing session and user IDs if available, otherwise generate new ones
      if (!sessionId) {
        sessionId = localStorage.getItem('singulary_session_id') || generateSessionId();
        localStorage.setItem('singulary_session_id', sessionId);
      }
      if (!userId) {
        userId = localStorage.getItem('singulary_user_id') || generateUserId();
        localStorage.setItem('singulary_user_id', userId);
      }
      
      hasConsent = true;
    } else {
      // Remove all stored consent data and IDs
      localStorage.removeItem('singulary_privacy_consent');
      localStorage.removeItem('singulary_non_essential_cookies');
      localStorage.removeItem('singulary_session_id');
      localStorage.removeItem('singulary_user_id');
      // Remove chat open state from localStorage (desktop only)
    if (!CONFIG.isMobile) {
      localStorage.removeItem('singulary_chat_open');
    }
      hasConsent = false;
      sessionId = null;
      userId = null;
    }
    
    // Notify chat iframe about consent status change
    if (chatFrame && chatFrame.contentWindow) {
      chatFrame.contentWindow.postMessage({
        type: 'consentUpdate',
        hasConsent: hasConsent,
        sessionId: sessionId,
        userId: userId
      }, '*');
    }
  }

  // Show consent modal when user needs to accept/reject privacy policy
  function showConsentIfNeeded() {
    if (!hasConsent && !showingConsent) {
      showingConsent = true;
      
      // Disable search input to prevent interaction during consent
      if (window.searchBar) {
        window.searchBar.blur();                          // Hide mobile keyboard
        window.searchBar.disabled = true;
        window.searchBar.style.opacity = '0.5';
        window.searchBar.style.cursor = 'not-allowed';
      }
      
      // Hide search icon (GIF) to indicate disabled state
      if (window.searchIcon) {
        window.searchIcon.style.pointerEvents = 'none';
        window.searchIcon.style.opacity = '0';
      }
      
      // Ensure chat is open so user can see the consent modal
      if (!isOpen) {
        showChat();
      }
      
      // Send message to iframe to display consent modal
      setTimeout(() => {
        if (chatFrame && chatFrame.contentWindow) {
          chatFrame.contentWindow.postMessage({
            type: 'showConsent'
          }, '*');
        }
      }, 100);
    }
  }

  // Restore chat open/closed state from localStorage (desktop only)
  function restoreChatState() {
    // Skip state restoration on mobile devices
    if (CONFIG.isMobile) {
      return;
    }
    
    const savedState = localStorage.getItem('singulary_chat_open');
    
    // If user had chat open previously, restore it
    if (savedState === 'true') {
      setTimeout(() => {
        showChat();
      }, 500); // Small delay to ensure widget is fully initialized
    }
    // If savedState is 'false' or null, chat stays closed (default)
  }

  // ===============================================
  // === MESSAGE HANDLER FOR IFRAME COMMUNICATION ===
  // ===============================================
  // Listen for messages from chat iframe and handle different actions
  
  window.addEventListener('message', (event) => {
    // Only process messages from our trusted chat iframe origin
    if (event.origin === CONFIG.origin) {
      
      // Handle chat close request from iframe
      if (event.data?.type === 'chatClose') {
        hideChat();
        
      // Handle chat expand/collapse toggle from iframe
      } else if (event.data?.type === 'expandChat') {
        if (isExpanded) {
          collapseChat();
        } else {
          expandChat();
        }
        
      // Handle user accepting consent in iframe
      } else if (event.data?.type === 'consentAccepted') {
        saveConsent(true, event.data.nonEssential);
        showingConsent = false;
        
        // Re-enable search input and icon after consent given
        if (window.searchBar) {
          window.searchBar.disabled = false;
          window.searchBar.style.opacity = '';
          window.searchBar.style.cursor = '';
        }
        if (window.searchIcon) {
          window.searchIcon.style.pointerEvents = '';
          window.searchIcon.style.opacity = '1';
        }
        
      // Handle user rejecting consent in iframe
      } else if (event.data?.type === 'consentRejected') {
        saveConsent(false);
        showingConsent = false;
        
        // Clear any pending search request - complete reset
        pendingSearchText = '';
        
        // Reset chat iframe to clean state
        if (chatFrame && chatFrame.contentWindow) {
          chatFrame.contentWindow.postMessage({
            type: 'resetChat'
          }, '*');
        }
        
        // Close chat and return to initial state
        hideChat();
        
        // Re-enable and reset search interface
        if (window.searchBar) {
          window.searchBar.disabled = false;
          window.searchBar.style.opacity = '';
          window.searchBar.style.cursor = '';
          window.searchBar.value = '';           // Clear input field
          toggleIcons();                         // Update send button visibility
        }
        if (window.searchIcon) {
          window.searchIcon.style.pointerEvents = '';
          window.searchIcon.style.opacity = '1';
        }
        
      // Handle consent requirement trigger
      } else if (event.data?.type === 'consentRequired') {
        showConsentIfNeeded();
        
      // Handle request for pending search text after consent accepted
      } else if (event.data?.type === 'requestPendingSearch') {
        // Send stored search text if user had typed something before consent
        if (pendingSearchText.trim() && chatFrame && chatFrame.contentWindow) {
          chatFrame.contentWindow.postMessage({
            type: 'search',
            text: pendingSearchText,
            sessionId: sessionId,
            userId: userId
          }, '*');
          
          // Clear pending search after sending
          pendingSearchText = '';
          
          // Clear the input field to show it was processed
          if (window.searchBar) {
            window.searchBar.value = '';
            toggleIcons();
          }
        }
        
      // Handle product navigation request from chat iframe
      } else if (event.data?.type === 'navigateToProduct') {
        // Navigate parent window to product URL
        if (event.data.url && typeof event.data.url === 'string') {
          window.location.href = event.data.url;
        }
        
      // Handle scroll position response from iframe
      } else if (event.data?.type === 'scrollPosition') {
        // No need to save position - we always scroll to bottom
        savedScrollPosition = 'bottom';
      }
    }
  });
  
  // ===============================================
  // === MOBILE STATUS COMMUNICATION ===
  // ===============================================
  
  // Send mobile device status to iframe for responsive behavior
  function sendMobileStatus() {
    if (chatFrame && chatFrame.contentWindow) {
      chatFrame.contentWindow.postMessage({
        type: 'mobileStatus',
        isMobile: CONFIG.isMobile
      }, '*');
    }
  }
  
  // Ensure mobile status is communicated reliably with retries
  function ensureMobileStatus() {
    sendMobileStatus();
    // Multiple attempts to ensure message gets through during iframe loading
    setTimeout(sendMobileStatus, 100);
    setTimeout(sendMobileStatus, 300);
    setTimeout(sendMobileStatus, 500);
  }
  
  // Setup iframe load event to communicate mobile status when ready
  function setupIframeLoadHandler() {
    if (chatFrame) {
      chatFrame.addEventListener('load', () => {
        // Send mobile status as soon as iframe finishes loading
        setTimeout(ensureMobileStatus, 100);
        
        // Send consent and session info if available
        setTimeout(() => {
          if (hasConsent && sessionId && userId && chatFrame.contentWindow) {
            chatFrame.contentWindow.postMessage({
              type: 'consentUpdate',
              hasConsent: hasConsent,
              sessionId: sessionId,
              userId: userId
            }, '*');
            console.log('Sent session info on iframe load:', { sessionId, userId });
          }
        }, 200);
      });
    }
  }
  
  // ===============================================
  // === MAIN WIDGET RENDERING FUNCTION ===
  // ===============================================
  // Create and inject all widget elements into the page
  
  function renderWidget() {
    // Prevent multiple widget instances
    if (container) return;
    
    // ========== CSS STYLES INJECTION ==========
    // Inject all widget styles into page head
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
    
    // ========== IFRAME CREATION ==========
    // Create chat iframe with proper security and styling
    chatFrame = createElem('iframe', {
      src: `${CONFIG.origin}/chat`,
      title: 'Chat',
      allow: 'autoplay; clipboard-write; encrypted-media; picture-in-picture;',
      referrerPolicy: 'origin',
      scrolling: 'no'
    }, `display:none;width:${getWidth('chatWidth')};height:${CONFIG.isMobile ? 'calc(100vh - 100px)' : '500px'};border:none;border-radius:20px;box-shadow:0 4px 12px rgba(0,0,0,0.15);background:transparent;margin-bottom:10px;${CONFIG.isMobile ? 'overflow:hidden;touch-action:none;' : ''}`);
    
    // ========== SEARCH INPUT CREATION ==========
    // Create search input field with placeholder and styling
    const searchBar = createElem('input', {
      type: 'text',
      placeholder: 'Stell uns deine Frage...'
    }, `width:${getWidth('inputWidth')};height:40px;padding:0 58px 0 14px;font-size:15px;background:#FFF !important;color:#333 !important;-webkit-text-fill-color:#333 !important;border:none;border-radius:20px;box-sizing:border-box;outline:none;box-shadow:0 6px 16px rgba(0,0,0,0.7), 0 2px 5px rgba(0,0,0,0.4);transition:width 0.3s ease;`);
    
    // ========== ICON ELEMENTS CREATION ==========
    // Create send button, search icon (GIF), and close icon with proper positioning
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
    
    // ========== MAIN CONTAINER ASSEMBLY ==========
    // Create main widget container and assemble all elements
    container = createElem('div', { id: 'embed-widget' }, 
      CONFIG.isMobile 
        ? 'position:fixed;bottom:0;right:20px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;gap:0;padding-bottom:calc(20px + env(safe-area-inset-bottom, 0px));'
        : 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;gap:0;'
    );
    
    if (CONFIG.isMobile) container.classList.add('mobile-widget');
    container.append(chatFrame, inputWrap);
    document.body.appendChild(container);
    
    // ========== INITIAL SETUP ==========
    // Setup iframe communication and check user consent status
    setupIframeLoadHandler();       // Enable mobile status communication
    checkConsent();                 // Load any existing consent preferences
    restoreChatState();             // Restore previous chat open/closed state
    
    // ========== EVENT HANDLERS ==========
    // Define all user interaction handlers
    
    // Handle sending search messages to chat iframe
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
      
      // Re-check session ID and user ID exist
      if (!sessionId) {
        sessionId = localStorage.getItem('singulary_session_id');
        if (!sessionId) {
          // Generate new session if needed
          sessionId = generateSessionId();
          localStorage.setItem('singulary_session_id', sessionId);
        }
      }
      
      if (!userId) {
        userId = localStorage.getItem('singulary_user_id');
        if (!userId) {
          // Generate new user ID if needed
          userId = generateUserId();
          localStorage.setItem('singulary_user_id', userId);
        }
      }
      
      if (!isOpen) showChat();
      chatFrame.contentWindow.postMessage({ 
        type: 'search', 
        text,
        sessionId: sessionId,
        userId: userId
      }, '*');
      searchBar.value = '';
      toggleIcons();
      
      // Hide keyboard on mobile by blurring the input
      searchBar.blur();
      
      if (CONFIG.isMobile && window.forceVisible) {
        setTimeout(window.forceVisible, 100);
      }
    };
    
    // Toggle send button visibility based on input content
    const toggleIcons = () => {
      const hasText = searchBar.value.trim().length > 0;
      sendIcon.style.opacity = hasText ? '1' : '0';
      sendIcon.style.pointerEvents = hasText ? 'auto' : 'none';
    };
    
    // ========== EVENT LISTENER ATTACHMENTS ==========
    // Attach all interaction event listeners to elements
    
    // Handle Enter key in search input
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
    searchBar.addEventListener('focus', () => {
      if (!isOpen) {
        setWidths(true);
        
        // Auto-open chat if user has existing session and user IDs
        const storedSessionId = localStorage.getItem('singulary_session_id');
        const storedUserId = localStorage.getItem('singulary_user_id');
        const storedConsent = localStorage.getItem('singulary_privacy_consent');
        
        if (storedConsent === 'accepted' && storedSessionId && storedUserId) {
          // User has previous session - auto-open chat
          setTimeout(() => {
            showChat();
          }, 150); // Small delay for smooth animation
        }
      }
    });
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
    
    // ========== GLOBAL VARIABLE EXPOSURE ==========
    // Make elements accessible globally for external control
    window.searchBar = searchBar;
    window.inputWrap = inputWrap;
    window.searchIcon = searchIcon;
    window.closeIcon = closeIcon;
    
    // ========== SVG COLOR FORCING ==========
    // Ensure SVG icons maintain correct colors across all browsers
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
    
    // ========== MOBILE POSITIONING MANAGEMENT ==========
    // Handle mobile-specific positioning and keyboard interactions
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

  // ===============================================
  // === WIDGET INITIALIZATION ===
  // ===============================================
  
  // Initialize the widget when called (prevents duplicate instances)
  window.embedApp.init = () => {
    if (!initialized) {
      renderWidget();
      initialized = true;
    }
  };
  
  // Auto-initialize widget when script loads
  setTimeout(window.embedApp.init, 0);
  
})(window, document);