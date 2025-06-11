'use client';
import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';

// Type declaration for window.embedApp
declare global {
  interface Window {
    embedApp?: {
      config?: {
        agent_id?: string;
        color?: string;
        variant?: string;
        themeMode?: string;
        fontFamily?: string;
        timestamp?: string;
      };
      init?: () => void;
    };
  }
}

// ===============================================
// === TYPE DEFINITIONS ===
// ===============================================
// Define what a product looks like from the API
type Product = {
  id: string;
  data: {
    Bild: string;
    Titel: string;
    Zoll: string;
    Marke: string;
    URL: string;
    [key: string]: string | number | boolean | null | undefined;
  };
  isHighlighted?: boolean;
  [key: string]: string | number | boolean | object | null | undefined;
}

// Define what a chat message looks like
type Msg = {id: number; text: string; isUser: boolean; products?: Product[]; isLoading?: boolean}

// ===============================================
// === STYLING OBJECT ===
// ===============================================
// All component styles in one place for easy maintenance
const s = {
  // Main container styles
  container: {display:'flex', flexDirection:'column' as const, height:'100vh', background:'rgba(255,255,255,0.28)', backgroundImage:'radial-gradient(circle, rgba(136,136,136,0.35) 0.8px, transparent 0.8px)', backgroundSize:'5px 5px', backdropFilter:'blur(3px)', overflow:'hidden', fontFamily:'system-ui', borderRadius:'20px', position:'relative' as const, boxShadow:'inset 0 0 30px rgba(0,0,0,0.2), inset 0 0 50px rgba(0,0,0,0.12)'},
  
  // Header with buttons (expand/settings)
  header: {display:'flex', flexDirection:'column' as const, gap:'8px', padding:'8px', position:'absolute' as const, top:'0', left:'0', zIndex:10},
  expandBtn: {width:'28px', height:'28px', background:'#fff', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 4px rgba(0,0,0,0.1)', transition:'all 0.2s'},
  settingsBtn: {width:'28px', height:'28px', background:'#fff', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 4px rgba(0,0,0,0.1)', transition:'all 0.2s'},
  
  // Message list container
  msgList: {flex:1, paddingTop:'52px', paddingBottom:'4px', paddingLeft:'16px', paddingRight:'16px', overflowY:'auto' as const, overflowX:'hidden' as const, display:'flex', flexDirection:'column' as const, gap:'12px', background:'transparent', WebkitOverflowScrolling:'touch' as const, overscrollBehaviorY:'contain' as const},
  msgListWithButton: {flex:1, paddingTop:'80px', paddingBottom:'4px', paddingLeft:'16px', paddingRight:'16px', overflowY:'auto' as const, overflowX:'hidden' as const, display:'flex', flexDirection:'column' as const, gap:'12px', background:'transparent', WebkitOverflowScrolling:'touch' as const, overscrollBehaviorY:'contain' as const},
  
  // Message wrappers for different layouts
  msgWrapper: {display:'flex', alignItems:'flex-end', gap:'8px', maxWidth:'90%'},
  msgWrapperProducts: {display:'flex', alignItems:'flex-end', gap:'8px', width:'100%'},
  msgWrapperFullWidth: {display:'flex', flexDirection:'column' as const, gap:'8px', width:'100%'},
  
  // Individual message styles
  userMsg: {alignSelf:'flex-end', background:'#fff', color:'#000', marginLeft:'auto', padding:'10px 14px', borderRadius:'18px', wordBreak:'break-word' as const, fontSize:'14px', lineHeight:'1.4', maxWidth:'85%', border:'1px solid rgba(0,0,0,0.08)', animation:'fadeIn 0.5s ease-out'},
  botMsg: {background:'#fff', color:'#000', border:'1px solid rgba(0,0,0,0.08)', padding:'10px 14px', borderRadius:'18px', wordBreak:'break-word' as const, fontSize:'14px', lineHeight:'1.4', maxWidth:'100%', animation:'fadeIn 0.6s ease-out'},
  
  // Avatar styles and animations
  avatarWrapper: {display:'flex', justifyContent:'center', marginTop:'8px'},
  avatar: {width:'18px', height:'18px', borderRadius:'50%', flexShrink:0, transition:'all 0.3s ease'},
  avatarJump: {width:'18px', height:'18px', borderRadius:'50%', flexShrink:0, animation:'avatarJump 1.2s ease-in-out'},
  avatarPlaceholder: {width:'18px', height:'18px', flexShrink:0},
  timestamp: {fontSize:'11px', color:'#999', marginTop:'4px', textAlign:'center' as const},
  
  // Product carousel styles
  productCarousel: {position:'relative' as const, marginTop:'8px', paddingLeft:'0px', paddingRight:'0px', overflow:'hidden'},
  productScroll: {display:'flex', gap:'8px', overflowX:'auto' as const, scrollBehavior:'smooth' as const, scrollbarWidth:'none' as const, msOverflowStyle:'none' as const, paddingLeft:'0px', paddingRight:'0px', scrollSnapType:'x mandatory' as const, borderRadius:'12px'},
  productCard: {minWidth:'100px', maxWidth:'100px', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'6px', padding:'6px', background:'#fff', fontSize:'11px', flexShrink:0, scrollSnapAlign:'center' as const, scrollSnapStop:'always' as const, boxShadow:'0 1px 3px rgba(0,0,0,0.1)', cursor:'pointer', transition:'transform 0.2s, box-shadow 0.2s'},
  productImage: {width:'100%', height:'60px', objectFit:'cover' as const, borderRadius:'3px', marginBottom:'3px'},
  productTitle: {fontWeight:'500', lineHeight:'1.2', marginBottom:'2px', fontSize:'10px'},
  productInfo: {color:'#666', fontSize:'9px'},
  
  // Carousel navigation buttons
  carouselBtn: {position:'absolute' as const, top:'50%', transform:'translateY(-50%)', width:'22px', height:'22px', borderRadius:'50%', background:'rgba(255,255,255,0.95)', border:'1px solid rgba(0,0,0,0.05)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', zIndex:1, fontSize:'12px', color:'rgba(0,0,0,0.6)', fontWeight:'400', boxSizing:'border-box' as const, flexShrink:0, lineHeight:'1', textAlign:'center' as const},
  carouselBtnLeft: {left:'0'},
  carouselBtnRight: {right:'0'},
  
  // Consent modal styles
  consentOverlay: {position:'fixed' as const, bottom:'16px', left:'16px', right:'16px', zIndex:1000},
  consentModal: {background:'#fff', borderRadius:'16px', padding:'20px', maxWidth:'320px', margin:'0 auto', boxShadow:'0 10px 40px rgba(0,0,0,0.25)', border:'1px solid rgba(0,0,0,0.08)', position:'relative' as const, animation:'consentFadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)'},
  consentTitle: {fontSize:'20px', fontWeight:'700', marginBottom:'8px', color:'#000', textAlign:'left' as const},
  consentSubtitle: {fontSize:'13px', color:'#666', marginBottom:'20px', textAlign:'left' as const, lineHeight:'1.3'},
  
  // Cookie toggle components
  cookieRow: {display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px', padding:'8px 0'},
  cookieLabel: {display:'flex', flexDirection:'column' as const, flex:1},
  cookieTitle: {fontSize:'15px', fontWeight:'500', color:'#000', marginBottom:'2px'},
  cookieDesc: {fontSize:'12px', color:'#666', lineHeight:'1.3'},
  toggle: {width:'44px', height:'26px', borderRadius:'13px', position:'relative' as const, cursor:'pointer', transition:'all 0.3s ease'},
  toggleActive: {background:'#000'},
  toggleInactive: {background:'#e5e7eb'},
  toggleDisabled: {background:'#000', opacity:0.6, cursor:'not-allowed'},
  toggleKnob: {width:'22px', height:'22px', borderRadius:'50%', background:'#fff', position:'absolute' as const, top:'2px', transition:'all 0.3s ease', boxShadow:'0 2px 4px rgba(0,0,0,0.2)'},
  toggleKnobLeft: {left:'2px'},
  toggleKnobRight: {left:'20px'},
  
  // Consent modal footer and buttons
  consentLink: {color:'#000', textDecoration:'underline'},
  consentDetails: {fontSize:'10px', color:'#888', lineHeight:'1.4', marginTop:'16px', marginBottom:'12px'},
  consentFooter: {fontSize:'11px', color:'#999', textAlign:'left' as const, marginTop:'12px', marginBottom:'16px'},
  consentButtons: {display:'flex', gap:'8px'},
  consentButton: {flex:1, padding:'12px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'15px', fontWeight:'500', transition:'all 0.2s'},
  consentReject: {background:'#f5f5f7', color:'#000'},
  consentAccept: {background:'#000', color:'#fff'}
};

// ===============================================
// === MAIN CHAT COMPONENT ===
// ===============================================
export default function Chat() {
  
  // ===============================================
  // === COMPONENT STATE ===
  // ===============================================
  // Core chat functionality
  const [msgs, setMsgs] = useState<Msg[]>([]);                    // All chat messages
  const [isMobile, setIsMobile] = useState(false);                // Device detection
  const [isProcessing, setIsProcessing] = useState(false);        // Message processing state
  
  // Product carousel management
  const [carouselStates, setCarouselStates] = useState<{[key: number]: {canScrollLeft: boolean, canScrollRight: boolean}}>({});
  const [jumpingAvatars, setJumpingAvatars] = useState<{[key: number]: boolean}>({});
  
  // Consent and privacy management
  const [showConsent, setShowConsent] = useState(false);          // Show/hide consent modal
  const [hasConsent, setHasConsent] = useState(false);           // User has given consent
  const [nonEssentialCookies, setNonEssentialCookies] = useState(true); // Cookie preferences
  const [consentKey, setConsentKey] = useState(0);               // Force consent animation restart
  
  // User and session tracking
  const [sessionId, setSessionId] = useState<string | null>(null); // Current session ID
  const [webUserId, setWebUserId] = useState<string | null>(null);     // Persistent web user ID
  
  // History loading state
  const [historyLoaded, setHistoryLoaded] = useState(false);     // Prevent duplicate loading
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // Loading indicator
  
  // Message ID counter for unique keys (using ref for immediate updates)
  const messageIdCounter = useRef(1);
  
  // Loading animation system
  const [loadingMessages, setLoadingMessages] = useState<{[key: number]: {currentPhrase: number, interval: NodeJS.Timeout | null}}>({});
  
  // ===============================================
  // === COMPONENT REFS ===
  // ===============================================
  // DOM element references for scrolling and mobile handling
  const endRef = useRef<HTMLDivElement>(null);           // Auto-scroll target
  const containerRef = useRef<HTMLDivElement>(null);     // Main container
  const msgListRef = useRef<HTMLDivElement>(null);       // Message list container

  // ===============================================
  // === CHAT HISTORY LOADING SYSTEM ===
  // ===============================================
  
  // Load previous conversations from memory API
  const loadChatHistory = useCallback(async (currentSessionId: string, currentWebUserId: string) => {
    if (historyLoaded || isLoadingHistory || !currentSessionId || !currentWebUserId) {
      return;
    }
    
    setIsLoadingHistory(true);
    
    try {
      const response = await fetch(`/api/memory?session_id=${currentSessionId}&web_user_id=${currentWebUserId}`);
      const data = await response.json();

      if (data.success && data.memory && data.memory.length > 0) {
        // Get the last 5 interactions (conversations)
        const recentInteractions = data.memory.slice(-5);
        
        // Convert interactions to chat messages
        const historyMessages: Msg[] = [];
        let currentId = 1; // Start with ID 1, new messages will continue from here
        
        // ✅ SIMPLIFIED: Process only router interactions with nested agent responses
        const routerInteractions = recentInteractions.filter((interaction: {
          labels?: string;
          agent_called?: boolean;
          agent_response?: {
            response?: string;
            search_results?: Product[] | { results?: Product[] };
            highlight_ids?: string[];
          };
        }) => 
          interaction.labels === "router" && 
          interaction.agent_called === true &&
          interaction.agent_response // Only process router interactions with complete agent responses
        );
        
        routerInteractions.forEach((routerInteraction: {
          question?: string;
          agent_response?: {
            response?: string;
            search_results?: Product[] | { results?: Product[] };
            highlight_ids?: string[];
          };
        }) => {
          // ✅ Get user question from router
          const userQuestion = routerInteraction.question || '';
          
          // ✅ Get agent response from nested agent_response
          const agentResponse = routerInteraction.agent_response || {};
          const botResponse = agentResponse.response || '';
          
          // Add user question
          if (userQuestion && userQuestion.trim()) {
            historyMessages.push({
              id: currentId++,
              text: userQuestion,
              isUser: true
            });
          }
          
          // Add bot response  
          if (botResponse && botResponse.trim()) {
            historyMessages.push({
              id: currentId++,
              text: botResponse,
              isUser: false
            });
          }
          
          // ✅ Add products if available from nested agent response
          if (agentResponse.search_results) {
            const searchResults = agentResponse.search_results;
            
            // Handle both direct results array and nested results object
            let productResults: Product[] = [];
            if (Array.isArray(searchResults)) {
              productResults = searchResults;
            } else if (searchResults.results && Array.isArray(searchResults.results)) {
              productResults = searchResults.results;
            }
            
            if (productResults.length > 0) {
              const products = productResults
                .filter((product: Product) => product && product.data && product.data.Bild && product.data.Titel) // ✅ Filter out malformed products
                .map((product: Product) => ({
                  ...product,
                  isHighlighted: (agentResponse.highlight_ids || []).includes(product.id) || false
                }))
                .sort((a: Product & {isHighlighted: boolean}, b: Product & {isHighlighted: boolean}) => 
                  (b.isHighlighted ? 1 : 0) - (a.isHighlighted ? 1 : 0)
                )
                .slice(0, 12); // Limit to 12 products for performance
              
              historyMessages.push({
                id: currentId++,
                text: '',
                isUser: false,
                products: products
              });
            }
          }
        });
        
        // Add history messages to chat and update counter
        setMsgs(historyMessages);
        messageIdCounter.current = currentId; // Set counter to continue from where history ended
        
      } else {
      }
      
    } catch {
    } finally {
      setIsLoadingHistory(false);
      setHistoryLoaded(true);
    }
  }, [historyLoaded, isLoadingHistory]);

  // ===============================================
  // === LOADING ANIMATION SYSTEM ===
  // ===============================================
  // German phrases that cycle during API loading
  const loadingPhrases = useMemo(() => ['ich schaue für Sie nach...', 'Lassen Sie mich überlegen...', 'Ich organisiere...', 'Ich suche für Sie...', 'Einen Moment bitte...'], []);

  // Start the loading animation for a specific message
  const startLoadingAnimation = useCallback((messageId: number) => {
    let currentPhrase = 0;
    
    const interval = setInterval(() => {
      currentPhrase = (currentPhrase + 1) % loadingPhrases.length;
      
      setMsgs(prevMsgs => 
        prevMsgs.map(msg => 
          msg.id === messageId && msg.isLoading 
            ? { ...msg, text: loadingPhrases[currentPhrase] }
            : msg
        )
      );
      
      setLoadingMessages(prev => ({
        ...prev,
        [messageId]: { ...prev[messageId], currentPhrase }
      }));
    }, 800); // Change phrase every 800ms
    
    setLoadingMessages(prev => ({
      ...prev,
      [messageId]: { currentPhrase: 0, interval }
    }));
  }, [loadingPhrases]);

  // Stop the loading animation and clean up
  const stopLoadingAnimation = useCallback((messageId: number) => {
    const loadingState = loadingMessages[messageId];
    if (loadingState?.interval) {
      clearInterval(loadingState.interval);
    }
    
    setLoadingMessages(prev => {
      const newState = { ...prev };
      delete newState[messageId];
      return newState;
    });
  }, [loadingMessages]);

  // ===============================================
  // === EFFECT HOOKS ===
  // ===============================================
  
  // Cleanup loading animations when component unmounts
  useEffect(() => {
    return () => {
      Object.values(loadingMessages).forEach(state => {
        if (state.interval) {
          clearInterval(state.interval);
        }
      });
    };
  }, [loadingMessages]);

  // Listen for messages from parent window (consent updates, reset commands, scroll position)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'consentUpdate') {
        const newSessionId = event.data.sessionId;
        const newWebUserId = event.data.userId;
        const wasConsentChange = sessionId !== newSessionId || webUserId !== newWebUserId;
        
        // ✅ If session IDs changed, we have a fresh start - reset everything
                  if (wasConsentChange && newSessionId && newWebUserId) {
          
          // Clear all existing messages and state
          setMsgs([]);
          setCarouselStates({});
          setJumpingAvatars({});
          setIsProcessing(false); // ✅ RESET PROCESSING STATE
          
          // Stop all loading animations
          Object.values(loadingMessages).forEach(state => {
            if (state.interval) {
              clearInterval(state.interval);
            }
          });
          setLoadingMessages({});
          
          // Reset history loading flags for new session
          setHistoryLoaded(false);
          setIsLoadingHistory(false);
          messageIdCounter.current = 1;
        }
        
        // Update consent and session state
        setHasConsent(event.data.hasConsent);
        setSessionId(newSessionId);
                  setWebUserId(newWebUserId);
      } else if (event.data?.type === 'mobileInputFocus') {
        // On mobile, when input is focused, scroll to show latest messages
        if (isMobile && msgListRef.current) {
          setTimeout(() => {
            if (msgListRef.current) {
              msgListRef.current.scrollTo({
                top: msgListRef.current.scrollHeight,
                behavior: 'smooth'
              });
            }
          }, 300); // Delay to account for keyboard animation
        }
      } else if (event.data?.type === 'showConsent') {
        // ✅ Enhanced consent modal showing with complete state reset
        
        // ✅ SOFORT alle Nachrichten und State löschen, bevor Modal erscheint
        setMsgs([]);
        setCarouselStates({});
        setJumpingAvatars({});
        setIsProcessing(false); // ✅ RESET PROCESSING STATE
        
        // Stop all loading animations
        Object.values(loadingMessages).forEach(state => {
          if (state.interval) {
            clearInterval(state.interval);
          }
        });
        setLoadingMessages({});
        
        // Reset history loading state and message counter
        setHistoryLoaded(false);
        setIsLoadingHistory(false);
        messageIdCounter.current = 1;
        
        // Force clean state before showing consent
        setShowConsent(false);
        setHasConsent(false);  // ✅ Ensure consent state is false
        
        setTimeout(() => {
          setConsentKey(prev => prev + 1);
          setShowConsent(true);
        }, 50);
      } else if (event.data?.type === 'resetChat') {
        // Clear all messages when consent is revoked
        setMsgs([]);
        setCarouselStates({});
        setJumpingAvatars({});
        setIsProcessing(false); // ✅ RESET PROCESSING STATE
        // Stop all loading animations
        Object.values(loadingMessages).forEach(state => {
          if (state.interval) {
            clearInterval(state.interval);
          }
        });
        setLoadingMessages({});
        // Reset consent modal state completely
        setShowConsent(false);
        setHasConsent(false);  // ✅ Explicitly reset consent state
        setConsentKey(prev => prev + 1);  // ✅ Reset consent modal key for clean state
        // Reset history loading state and message counter
        setHistoryLoaded(false);
        setIsLoadingHistory(false);
        messageIdCounter.current = 1;
        // ✅ Clear session IDs to ensure clean state
        setSessionId(null);
        setWebUserId(null);
      } else if (event.data?.type === 'getScrollPosition') {
        // Don't capture scroll position - we'll scroll to bottom instead
        window.parent.postMessage({
          type: 'scrollPosition',
          position: 'bottom'
        }, '*');
      } else if (event.data?.type === 'setScrollPosition') {
        // Always scroll to bottom after expansion/collapse (only on desktop)
        if (!isMobile && msgListRef.current) {
          // Force scroll to bottom immediately, then smooth scroll
          setTimeout(() => {
            if (msgListRef.current) {
              // First scroll immediately to bottom
              msgListRef.current.scrollTop = msgListRef.current.scrollHeight;
              
              // Then do a smooth scroll to ensure it's at the very bottom
              setTimeout(() => {
                if (msgListRef.current) {
                  msgListRef.current.scrollTo({
                    top: msgListRef.current.scrollHeight,
                    behavior: 'smooth'
                  });
                }
              }, 50);
            }
          }, 200); // Longer delay to ensure layout is completely settled
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loadingMessages, isMobile, sessionId, webUserId]);

  // Load chat history when session IDs are available
  useEffect(() => {
    
    // ✅ WICHTIG: Nicht laden wenn Consent-Modal sichtbar ist
    if (hasConsent && sessionId && webUserId && !historyLoaded && !isLoadingHistory && !showConsent) {
      loadChatHistory(sessionId, webUserId);
    } else {
    }
  }, [hasConsent, sessionId, webUserId, historyLoaded, isLoadingHistory, showConsent, loadChatHistory]);

  // Inject CSS styles for animations and responsive design
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .msg-list {
        scrollbar-width: thin;
        scrollbar-color: rgba(0,0,0,0.2) transparent;
        scroll-behavior: smooth;
        scroll-padding-bottom: 20px;
      }
      
      /* Hide scrollbar when not needed */
      .msg-list::-webkit-scrollbar {
        width: 6px;
      }
      
      .msg-list::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .msg-list::-webkit-scrollbar-thumb {
        background-color: rgba(0,0,0,0.2);
        border-radius: 3px;
      }
      
      /* Only show scrollbar on hover when content overflows */
      .msg-list::-webkit-scrollbar-thumb {
        background-color: transparent;
        transition: background-color 0.3s ease;
      }
      
      .msg-list:hover::-webkit-scrollbar-thumb {
        background-color: rgba(0,0,0,0.2);
      }
      
      /* Show scrollbar when actively scrolling */
      .msg-list::-webkit-scrollbar-thumb:hover {
        background-color: rgba(0,0,0,0.4);
      }
      
      /* Hide product carousel scrollbar */
      .product-scroll::-webkit-scrollbar {
        display: none;
      }
      
      /* Add fade effects to carousel edges */
      .product-carousel::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        width: 8px;
        height: 100%;
        background: linear-gradient(to right, rgba(0,0,0,0.15), transparent);
        z-index: 2;
        pointer-events: none;
        border-radius: 12px 0 0 12px;
      }
      
      .product-carousel::after {
        content: '';
        position: absolute;
        right: 0;
        top: 0;
        width: 8px;
        height: 100%;
        background: linear-gradient(to left, rgba(0,0,0,0.15), transparent);
        z-index: 2;
        pointer-events: none;
        border-radius: 0 12px 12px 0;
      }
      
      .carousel-btn:hover {
        background: rgba(255,255,255,1) !important;
        color: rgba(0,0,0,0.8) !important;
        transform: translateY(-50%) scale(1.05);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
      }
      
      /* Ensure perfectly circular carousel buttons on all devices */
      .carousel-btn {
        width: 22px !important;
        height: 22px !important;
        border-radius: 50% !important;
        min-width: 22px !important;
        min-height: 22px !important;
        max-width: 22px !important;
        max-height: 22px !important;
        padding: 0 !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        flex-shrink: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        line-height: 1 !important;
        text-align: center !important;
      }
      
      /* Mobile-specific circular button styling */
      @media (max-width: 768px) {
        .carousel-btn {
          width: 24px !important;
          height: 24px !important;
          min-width: 24px !important;
          min-height: 24px !important;
          max-width: 24px !important;
          max-height: 24px !important;
          border-radius: 50% !important;
          font-size: 12px !important;
          font-weight: bold !important;
          background: rgba(255,255,255,0.98) !important;
          box-shadow: 0 3px 10px rgba(0,0,0,0.15) !important;
          border: 1px solid rgba(0,0,0,0.08) !important;
        }
        
        .carousel-btn:active {
          transform: translateY(-50%) scale(0.95) !important;
          background: rgba(255,255,255,1) !important;
        }
      }
      
      .expand-btn:hover {
        background: #f5f5f5 !important;
        transform: scale(1.05);
      }
      
      .settings-btn:hover {
        background: #f5f5f5 !important;
        transform: scale(1.05);
      }
      
      /* Force settings button styling on all devices */
      .settings-btn {
        width: 28px !important;
        height: 28px !important;
        background: #fff !important;
        border: 1px solid rgba(0,0,0,0.08) !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        transition: all 0.2s !important;
        padding: 0 !important;
        margin: 0 !important;
        font-size: 0 !important;
        line-height: 0 !important;
        flex-shrink: 0 !important;
        box-sizing: border-box !important;
      }
      
      .settings-btn svg {
        width: 16px !important;
        height: 16px !important;
        stroke: #000 !important;
        stroke-width: 2 !important;
        fill: none !important;
        color: #000 !important;
      }
      
      .settings-btn svg path,
      .settings-btn svg circle {
        stroke: #000 !important;
        stroke-width: 2 !important;
        fill: none !important;
      }
      
      .consent-accept:hover {
        background: #333 !important;
      }
      
      .consent-reject:hover {
        background: #e5e7eb !important;
      }
      
      /* Message fade-in animation */
      @keyframes fadeIn {
        0% { 
          opacity: 0;
          transform: translateY(10px);
        }
        100% { 
          opacity: 1;
          transform: translateY(0px);
        }
      }
      
      /* Avatar jumping animation */
      @keyframes avatarJump {
        0% { 
          transform: translateY(0px) scale(1);
          opacity: 0.7;
        }
        15% { 
          transform: translateY(-3px) scale(1.03);
          opacity: 0.9;
        }
        35% { 
          transform: translateY(-6px) scale(1.08);
          opacity: 1;
        }
        55% { 
          transform: translateY(-1px) scale(1.02);
        }
        70% { 
          transform: translateY(-0.5px) scale(1.01);
        }
        85% { 
          transform: translateY(0px) scale(1);
        }
        100% { 
          transform: translateY(0px) scale(1);
          opacity: 1;
        }
      }
      
      /* Consent modal fade-in animation */
      @keyframes consentFadeIn {
        0% { 
          opacity: 0;
          transform: translateY(20px) scale(0.9);
        }
        50% {
          opacity: 0.8;
        }
        100% { 
          opacity: 1;
          transform: translateY(0px) scale(1);
        }
      }
      
      /* Loading text animation */
      @keyframes loadingPulse {
        0% { 
          opacity: 0.6;
          transform: scale(1);
        }
        50% { 
          opacity: 1;
          transform: scale(1.02);
        }
        100% { 
          opacity: 0.6;
          transform: scale(1);
        }
      }
      
      .loading-text {
        animation: loadingPulse 1.2s ease-in-out infinite;
        font-style: italic;
        color: #666 !important;
      }
      
      /* Star shimmer animation */
      @keyframes starShimmer {
        0% { 
          text-shadow: 0 0 2px rgba(255, 215, 0, 0.8);
          transform: scale(1);
        }
        50% { 
          text-shadow: 0 0 8px rgba(255, 215, 0, 1), 0 0 12px rgba(255, 255, 255, 0.6);
          transform: scale(1.05);
        }
        100% { 
          text-shadow: 0 0 2px rgba(255, 215, 0, 0.8);
          transform: scale(1);
        }
      }
      
      /* Chat loading spinner animation */
      @keyframes chatSpin {
        0% { 
          transform: rotate(0deg);
        }
        100% { 
          transform: rotate(360deg);
        }
      }
      
      /* Product card hover effects */
      .product-card:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
      }
      
      .product-card:active {
        transform: translateY(0px) !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
      }
      
      /* Highlighted product styles */
      .product-card-highlighted {
        position: relative !important;
      }
      
      .product-card-highlighted::before {
        content: '★';
        position: absolute;
        bottom: 6px;
        right: 6px;
        background: #000;
        color: #FFD700;
        width: 22px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        z-index: 1;
        font-weight: bold;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        animation: starShimmer 2s ease-in-out infinite;
      }
      
      .product-card-highlighted:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useLayoutEffect(() => {
    const scrollToBottom = () => {
      if (endRef.current) {
        endRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end', 
          inline: 'nearest' 
        });
      }
    };
    
    // Immediate scroll in parallel with message appearance
    setTimeout(scrollToBottom, 50);
    
    // Initialize carousel states for new messages with products
    msgs.forEach(msg => {
      if (msg.products && msg.products.length > 0 && !carouselStates[msg.id]) {
        setTimeout(() => {
          updateCarouselState(msg.id);
          // Extra scroll after carousel initialization
          setTimeout(scrollToBottom, 400);
        }, 100);
      }
    });
  }, [msgs, carouselStates]);
  
  // Handle mobile scrolling behavior - prevent body scroll while allowing message list scroll
  useEffect(() => {
    if (!isMobile) return;
    
    // Prevent default body scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Prevent touch scrolling on the container
    const preventContainerScroll = (e: TouchEvent) => {
      let target = e.target as HTMLElement;
      
      // Walk up the DOM tree to check if we're inside the message list
      while (target && target !== document.body) {
        if (target === msgListRef.current) {
          // We're inside the message list, check if it's scrollable
          const canScroll = target.scrollHeight > target.clientHeight;
          if (canScroll) {
            // Allow scrolling only if not at boundaries
            const isAtTop = target.scrollTop === 0;
            const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight;
            
            if ((isAtTop && e.touches[0].clientY > ((e as TouchEvent & { lastY?: number }).lastY || 0)) || 
                (isAtBottom && e.touches[0].clientY < ((e as TouchEvent & { lastY?: number }).lastY || 0))) {
              e.preventDefault();
            }
            return;
          }
        }
        target = target.parentElement as HTMLElement;
      }
      
      // Not in message list, prevent all scrolling
      e.preventDefault();
      e.stopPropagation();
    };
    
    // Track touch position for boundary detection
    const trackTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        (e as TouchEvent & { lastY?: number }).lastY = e.touches[0].clientY;
      }
    };
    
    // Add event listeners to container specifically
    if (containerRef.current) {
      containerRef.current.addEventListener('touchstart', trackTouch, { passive: false });
      containerRef.current.addEventListener('touchmove', preventContainerScroll, { passive: false });
      
      // Lock container styles
      containerRef.current.style.overflow = 'hidden';
      containerRef.current.style.touchAction = 'none';
      (containerRef.current.style as CSSStyleDeclaration & { webkitOverflowScrolling?: string }).webkitOverflowScrolling = 'none';
      containerRef.current.style.overscrollBehavior = 'none';
      containerRef.current.style.position = 'fixed';
      containerRef.current.style.width = '100%';
      containerRef.current.style.height = '100%';
    }
    
    // Allow scrolling on the message list
    if (msgListRef.current) {
      msgListRef.current.style.touchAction = 'pan-y';
      (msgListRef.current.style as CSSStyleDeclaration & { webkitOverflowScrolling?: string }).webkitOverflowScrolling = 'touch';
      msgListRef.current.style.overscrollBehavior = 'contain';
      msgListRef.current.style.overflowY = 'auto';
      msgListRef.current.style.overflowX = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      // Capture the current container ref value to avoid stale closures
      const currentContainer = containerRef.current;
      if (currentContainer) {
        currentContainer.removeEventListener('touchstart', trackTouch);
        currentContainer.removeEventListener('touchmove', preventContainerScroll);
        currentContainer.style.overflow = '';
        currentContainer.style.touchAction = '';
        (currentContainer.style as CSSStyleDeclaration & { webkitOverflowScrolling?: string }).webkitOverflowScrolling = '';
        currentContainer.style.overscrollBehavior = '';
        currentContainer.style.position = '';
        currentContainer.style.width = '';
        currentContainer.style.height = '';
      }
    };
  }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===============================================
  // === EVENT HANDLERS ===
  // ===============================================
  
  // Handle user accepting consent (save preferences and request pending search)
  const handleConsentAccept = () => {
    setShowConsent(false);
    setConsentKey(prev => prev + 1);
    
    // Notify parent window about consent acceptance
    window.parent.postMessage({
      type: 'consentAccepted', 
      nonEssential: nonEssentialCookies
    }, '*');
    
    // Request any pending search text from parent
    setTimeout(() => {
      window.parent.postMessage({
        type: 'requestPendingSearch'
      }, '*');
    }, 100);
  };

  // Handle user rejecting consent (clear all data and reset chat)
  const handleConsentReject = () => {
    
    // ✅ SOFORT alle Nachrichten und State löschen beim Ablehnen-Klick
    setMsgs([]);
    setCarouselStates({});
    setJumpingAvatars({});
    
    // Stop all loading animations immediately
    Object.values(loadingMessages).forEach(state => {
      if (state.interval) {
        clearInterval(state.interval);
      }
    });
    setLoadingMessages({});
    
    // Reset consent modal and all related state
    setShowConsent(false);
    setHasConsent(false);
    
    // Reset history loading state and message counter
    setHistoryLoaded(false);
    setIsLoadingHistory(false);
    messageIdCounter.current = 1;
    
    // Reset session IDs immediately
    setSessionId(null);
    setWebUserId(null);
    
    // Reset consent key for clean state on next open
    setTimeout(() => {
      setConsentKey(prev => prev + 1);
    }, 100);
    
    // Notify parent window about consent rejection
    window.parent.postMessage({type: 'consentRejected'}, '*');
  };

  // Note: showConsentDialog removed as it was unused

  // Handle chat expand/collapse button click (desktop only)
  const handleExpand = () => {
    if (!isMobile) {
      window.parent.postMessage({type: 'expandChat'}, '*');
    }
  };

  // Handle settings button click (show consent modal)
  const handleSettings = () => {
    setShowConsent(false);
    setTimeout(() => {
      setConsentKey(prev => prev + 1);
      setShowConsent(true);
    }, 50);
  };

  // ===============================================
  // === HELPER FUNCTIONS ===
  // ===============================================
  
  // Update carousel scroll button visibility based on scroll position
  const updateCarouselState = (messageId: number) => {
    const container = document.getElementById(`carousel-${messageId}`);
    if (container) {
      const canScrollLeft = container.scrollLeft > 0;
      const canScrollRight = container.scrollLeft < container.scrollWidth - container.clientWidth;
      setCarouselStates(prev => ({
        ...prev,
        [messageId]: { canScrollLeft, canScrollRight }
      }));
    }
  };

  // ===============================================
  // === API COMMUNICATION HANDLER ===
  // ===============================================
  
  // Listen for search requests from parent window and handle API communication
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'config') return null;
      
      // Handle mobile status updates
      if (e.data?.type === 'mobileStatus' && typeof e.data.isMobile === 'boolean') {
        setIsMobile(e.data.isMobile);
      }
      
      // Handle search requests with loading animation and API call
      if (e.data?.type === 'search' && typeof e.data.text === 'string') {
        // ✅ PREVENT MULTIPLE MESSAGES: Block if already processing
        if (isProcessing) {
          return; // Exit early if already processing a message
        }
        
        const currentSessionId = sessionId || e.data.sessionId;
        const currentWebUserId = webUserId || e.data.userId;
        
        // ✅ SET PROCESSING STATE: Block new messages
        setIsProcessing(true);
        
        // Generate unique message IDs using counter
        const userMsgId = messageIdCounter.current;
        const loadingMsgId = messageIdCounter.current + 1;
        
        // Update counter for next messages
        messageIdCounter.current += 2;
        
        // Add user message immediately
        const userMsg = {id: userMsgId, text: e.data.text, isUser: true};
        setMsgs(m => [...m, userMsg]);
        
        // Add loading message and start animation
        const loadingMsg = {id: loadingMsgId, text: loadingPhrases[0], isUser: false, isLoading: true};
        setMsgs(m => [...m, loadingMsg]);
        startLoadingAnimation(loadingMsgId);
        
        // ✅ START THINKING ANIMATION: Avatar jumps immediately when bot starts thinking
        setTimeout(() => {
          setJumpingAvatars(prev => ({...prev, [loadingMsgId]: true}));
        }, 100); // Small delay to ensure message is rendered
        
        // Wait for config to be available before proceeding
        const waitForConfig = (): Promise<string> => {
          return new Promise((resolve) => {
            const checkConfig = () => {
              const embedApp = (window as Window & { embedApp?: { config?: { agent_id?: string } } }).embedApp;
              const agentId = embedApp?.config?.agent_id;
              
              console.log('🔍 Checking config:', {
                embedApp: !!embedApp,
                config: !!embedApp?.config,
                agent_id: agentId,
                timestamp: new Date().toISOString()
              });
              
              if (agentId && agentId !== 'default') {
                console.log('✅ Config loaded with agent_id:', agentId);
                resolve(agentId);
              } else {
                console.log('⏳ Config not ready, retrying in 50ms...');
                setTimeout(checkConfig, 50);
              }
            };
            
            // Start checking immediately
            checkConfig();
            
            // Fallback after 2 seconds
            setTimeout(() => {
              console.warn('⚠️ Config timeout, using default agent_id');
              resolve('default');
            }, 2000);
          });
        };
        
        // Use the config waiting logic
        waitForConfig().then((agentId) => {
        
        // Call the chat API with session ID, user ID, and agent ID
        fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: e.data.text,
            search_limit: 50,
            ranked_limit: 10,
            session_id: currentSessionId,
            web_user_id: currentWebUserId,
            agent_id: agentId
          })
        })
        .then(response => response.json())
        .then(data => {
          // ✅ CONSENT-CHECK: Blockiere Response wenn kein Consent mehr vorhanden
          if (!hasConsent) {
            stopLoadingAnimation(loadingMsgId);
            setJumpingAvatars(prev => ({...prev, [loadingMsgId]: false})); // Stop thinking animation
            setIsProcessing(false); // ✅ RESET PROCESSING STATE
            return; // Früher Ausstieg - keine weitere Verarbeitung
          }
          
          // Stop loading animation and thinking avatar jump
          stopLoadingAnimation(loadingMsgId);
          setJumpingAvatars(prev => ({...prev, [loadingMsgId]: false})); // Stop thinking animation
          
          // Prepare all products for display with highlight information
          const allProducts = data.success && data.search_results?.results 
            ? data.search_results.results
                .filter((product: Product) => product && product.data && product.data.Bild && product.data.Titel) // ✅ Filter out malformed products
                .map((product: Product) => ({
                  ...product,
                  isHighlighted: data.highlight_ids?.includes(product.id) || false
                }))
                .sort((a: Product & {isHighlighted: boolean}, b: Product & {isHighlighted: boolean}) => (b.isHighlighted ? 1 : 0) - (a.isHighlighted ? 1 : 0)) // Highlighted products first
                .slice(0, 12) // Limit to 12 products for performance
            : [];

          // Replace loading message with AI response
          const botMsg = {
            id: loadingMsgId,
            text: data.success ? data.response : 'Entschuldigung, ich konnte keine Antwort finden.',
            isUser: false,
            isLoading: false
          };
          
          setMsgs(prevMsgs => 
            prevMsgs.map(msg => 
              msg.id === loadingMsgId ? botMsg : msg
            )
          );
          
          // Trigger avatar jump animation after message appears
          setTimeout(() => {
            setJumpingAvatars(prev => ({...prev, [botMsg.id]: true}));
            setTimeout(() => {
              setJumpingAvatars(prev => ({...prev, [botMsg.id]: false}));
            }, 1200);
          }, 200);

          // Add products as separate message if available
          if (allProducts.length > 0) {
            setTimeout(() => {
              // ✅ CONSENT-CHECK: Blockiere Produkt-Message wenn kein Consent mehr vorhanden
              if (!hasConsent) {
                setIsProcessing(false); // ✅ RESET PROCESSING STATE
                return; // Keine Produkte anzeigen
              }
              
              // Generate unique ID for products message
              const productsMsgId = messageIdCounter.current;
              messageIdCounter.current += 1;
              
              const productsMsg = {
                id: productsMsgId,
                text: '',
                isUser: false,
                products: allProducts
              };
              setMsgs(m => [...m, productsMsg]);
              
              // Trigger avatar jump for product message
              setTimeout(() => {
                setJumpingAvatars(prev => ({...prev, [productsMsgId]: true}));
                setTimeout(() => {
                  setJumpingAvatars(prev => ({...prev, [productsMsgId]: false}));
                  // ✅ RESET PROCESSING STATE: Message fully processed
                  setIsProcessing(false);
                }, 1200);
              }, 300);
            }, 1500);
          } else {
            // ✅ RESET PROCESSING STATE: No products, processing done
            setIsProcessing(false);
          }
        })
        .catch(() => {
          
          // ✅ CONSENT-CHECK: Blockiere Error-Response wenn kein Consent mehr vorhanden
          if (!hasConsent) {
            stopLoadingAnimation(loadingMsgId);
            setJumpingAvatars(prev => ({...prev, [loadingMsgId]: false})); // Stop thinking animation
            setIsProcessing(false); // ✅ RESET PROCESSING STATE
            return; // Früher Ausstieg - keine Error-Message anzeigen
          }
          
          // Stop loading animation and thinking avatar jump on error
          stopLoadingAnimation(loadingMsgId);
          setJumpingAvatars(prev => ({...prev, [loadingMsgId]: false})); // Stop thinking animation
          
          // Replace loading message with error message
          const errorMsg = {
            id: loadingMsgId,
            text: 'Entschuldigung, es gab ein technisches Problem. Bitte versuchen Sie es später erneut.',
            isUser: false,
            isLoading: false
          };
          
          setMsgs(prevMsgs => 
            prevMsgs.map(msg => 
              msg.id === loadingMsgId ? errorMsg : msg
            )
          );
          
          // ✅ RESET PROCESSING STATE: Error handled
          setIsProcessing(false);

        });
        }); // Close the waitForConfig().then()
      }
    };
    
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [sessionId, webUserId, loadingPhrases, startLoadingAnimation, stopLoadingAnimation, hasConsent, isProcessing]);

  // ===============================================
  // === COMPONENT RENDER ===
  // ===============================================
  return (
    <>
      {/* ========== CONSENT MODAL ========== */}
      {/* Privacy consent dialog - shown when user needs to accept/reject cookies */}
      {showConsent && (
        <div style={s.consentOverlay}>
          <div key={consentKey} style={s.consentModal}>
            <div style={s.consentTitle}>Datenschutzeinstellungen</div>
            <div style={s.consentSubtitle}>
              Bitte wählen Sie aus, welche Cookies Sie akzeptieren möchten.
            </div>
            
            {/* Essential Cookies - Always On */}
            <div style={s.cookieRow}>
              <div style={s.cookieLabel}>
                <div style={s.cookieTitle}>Essenzielle Cookies</div>
                <div style={s.cookieDesc}>Notwendig für die Grundfunktionen des Chats.</div>
              </div>
              <div style={{...s.toggle, ...s.toggleDisabled}}>
                <div style={{...s.toggleKnob, ...s.toggleKnobRight}} />
              </div>
            </div>
            
            {/* Non-Essential Cookies - Toggleable */}
            <div style={s.cookieRow}>
              <div style={s.cookieLabel}>
                <div style={s.cookieTitle}>Nicht-essenzielle Cookies</div>
                <div style={s.cookieDesc}>Für erweiterte Funktionen und Analysen.</div>
              </div>
              <div 
                style={{...s.toggle, ...(nonEssentialCookies ? s.toggleActive : s.toggleInactive)}}
                onClick={() => setNonEssentialCookies(!nonEssentialCookies)}
              >
                <div style={{...s.toggleKnob, ...(nonEssentialCookies ? s.toggleKnobRight : s.toggleKnobLeft)}} />
              </div>
            </div>
            
            {/* Legal information */}
            <div style={s.consentDetails}>
              <div><strong>Verantwortliche Stelle:</strong> Singulary</div>
              <div><strong>Zweck:</strong> Chat-Funktionalität, Personalisierung</div>
              <div><strong>Speicherdauer:</strong> 12 Monate</div>
              <div><strong>Rechtsgrundlage:</strong> Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)</div>
            </div>
            
            {/* Privacy policy link */}
            <div style={s.consentFooter}>
              Weitere Informationen finden Sie in unserer{' '}
              <a 
                href="https://www.singulary.net/datenschutz" 
                target="_blank" 
                rel="noopener noreferrer"
                style={s.consentLink}
              >
                Datenschutzerklärung
              </a>
            </div>
            
            {/* Accept/Reject buttons */}
            <div style={s.consentButtons}>
              <button 
                className="consent-reject"
                style={{...s.consentButton, ...s.consentReject}}
                onClick={handleConsentReject}
              >
                Ablehnen
              </button>
              <button 
                className="consent-accept"
                style={{...s.consentButton, ...s.consentAccept}}
                onClick={handleConsentAccept}
              >
                Einstellungen speichern
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ========== MAIN CHAT CONTAINER ========== */}
      <div ref={containerRef} style={{...s.container, ...(isMobile ? {overflow: 'hidden', touchAction: 'none'} : {})}}>
        
        {/* ========== HEADER BUTTONS ========== */}
        {/* Expand and settings buttons in top-left corner */}
        <div style={s.header}>
          {/* Expand button - only shown on desktop */}
          {!isMobile && (
            <button 
              className="expand-btn"
              style={s.expandBtn}
              onClick={handleExpand}
              title="Expand Chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          
          {/* Settings button - opens privacy settings */}
          <button 
            className="settings-btn"
            style={s.settingsBtn}
            onClick={handleSettings}
            title="Privacy Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        {/* ========== MESSAGE LIST ========== */}
        {/* Scrollable container for all chat messages */}
        <div ref={msgListRef} className="msg-list" style={isMobile ? s.msgList : s.msgListWithButton}>
          <div style={{ marginTop: 'auto' }} />
          
          {/* Loading history indicator */}
          {isLoadingHistory && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '8px',
              marginBottom: '8px'
            }}>
              <div 
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #f0f0f0',
                  borderTop: '2px solid #666',
                  borderRadius: '50%',
                  animation: 'chatSpin 1s linear infinite'
                }}
              />
            </div>
          )}
          
          {msgs.map((m, index) => {
            // Find the last bot message (including loading) for avatar display
            let lastBotMessageIndex = -1;
            for (let i = msgs.length - 1; i >= 0; i--) {
              if (!msgs[i].isUser && msgs[i].text && msgs[i].text.trim()) {
                lastBotMessageIndex = i;
                break;
              }
            }
            const shouldShowAvatar = !m.isUser && m.text && m.text.trim() && index === lastBotMessageIndex;
            
            return m.isUser ? (
              /* ========== USER MESSAGE ========== */
              <div key={m.id} style={s.userMsg}>{m.text}</div>
            ) : (
              /* ========== BOT MESSAGE ========== */
              <div key={m.id} style={m.products && m.products.length > 0 && !m.text ? s.msgWrapperProducts : s.msgWrapper}>
                
                {/* ========== TEXT MESSAGE WITH AVATAR ========== */}
                {m.text && (
                  <>
                    {/* Show avatar for bot messages */}
                    {shouldShowAvatar ? (
                      <img 
                        src="https://images.squarespace-cdn.com/content/641c5981823d0207a111bb74/999685ce-589d-4f5f-9763-4e094070fb4b/64e9502e4159bed6f8f57b071db5ac7e+%281%29.gif"
                        alt="Assistant"
                        width={18}
                        height={18}
                        style={jumpingAvatars[m.id] ? s.avatarJump : s.avatar}
                      />
                    ) : (
                      <div style={s.avatarPlaceholder} />
                    )}
                    {/* Message text with loading animation if applicable */}
                    <div style={s.botMsg} className={m.isLoading ? 'loading-text' : ''}>
                      {m.isLoading ? m.text : (
                        <ReactMarkdown
                          components={{
                            // Style headers to be smaller and fit chat context
                            h1: ({children}) => <h1 style={{fontSize: '16px', fontWeight: 'bold', margin: '8px 0 4px 0'}}>{children}</h1>,
                            h2: ({children}) => <h2 style={{fontSize: '15px', fontWeight: 'bold', margin: '6px 0 3px 0'}}>{children}</h2>,
                            h3: ({children}) => <h3 style={{fontSize: '14px', fontWeight: 'bold', margin: '4px 0 2px 0'}}>{children}</h3>,
                            // Style lists to be compact
                            ul: ({children}) => <ul style={{margin: '4px 0', paddingLeft: '16px'}}>{children}</ul>,
                            ol: ({children}) => <ol style={{margin: '4px 0', paddingLeft: '16px'}}>{children}</ol>,
                            li: ({children}) => <li style={{margin: '2px 0'}}>{children}</li>,
                            // Style code blocks
                            code: ({children}) => <code style={{backgroundColor: '#f5f5f5', padding: '2px 4px', borderRadius: '3px', fontSize: '13px'}}>{children}</code>,
                            // Style blockquotes
                            blockquote: ({children}) => <blockquote style={{borderLeft: '3px solid #ddd', paddingLeft: '8px', margin: '8px 0', fontStyle: 'italic'}}>{children}</blockquote>,
                            // Style paragraphs to remove default margins
                            p: ({children}) => <p style={{margin: '4px 0'}}>{children}</p>,
                            // Handle links - open in parent website
                            a: ({href, children}) => (
                              <a 
                                href={href}
                                style={{
                                  color: '#007AFF',
                                  textDecoration: 'underline',
                                  cursor: 'pointer'
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (href) {
                                    // Send message to parent window to navigate
                                    window.parent.postMessage({
                                      type: 'navigateToUrl',
                                      url: href
                                    }, '*');
                                  }
                                }}
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {m.text}
                        </ReactMarkdown>
                      )}
                    </div>
                  </>
                )}
                
                {/* ========== PRODUCT CAROUSEL ========== */}
                {/* Products-only message full width */}
                {m.products && m.products.length > 0 && !m.text && (
                  <>
                    {/* Show avatar for bot messages on the left */}
                    {shouldShowAvatar ? (
                      <img 
                        src="https://images.squarespace-cdn.com/content/641c5981823d0207a111bb74/999685ce-589d-4f5f-9763-4e094070fb4b/64e9502e4159bed6f8f57b071db5ac7e+%281%29.gif"
                        alt="Assistant"
                        width={18}
                        height={18}
                        style={jumpingAvatars[m.id] ? s.avatarJump : s.avatar}
                      />
                    ) : (
                      <div style={s.avatarPlaceholder} />
                    )}
                    
                    {/* Product carousel container */}
                    <div style={{width: '100%', overflow: 'hidden', background: 'transparent'}}>
                      <div className="product-carousel" style={s.productCarousel}>
                        
                        {/* Left navigation arrow */}
                        {carouselStates[m.id]?.canScrollLeft && (
                          <button 
                            className="carousel-btn"
                            style={{...s.carouselBtn, ...s.carouselBtnLeft}}
                            onClick={() => {
                              const container = document.getElementById(`carousel-${m.id}`);
                              if (container) {
                                const cardWidth = 100 + 8; // card width + gap
                                container.scrollLeft -= cardWidth;
                              }
                            }}
                          >
                            ‹
                          </button>
                        )}
                        
                        {/* Scrollable product list */}
                        <div 
                          id={`carousel-${m.id}`}
                          className="product-scroll"
                          style={s.productScroll}
                          onScroll={() => updateCarouselState(m.id)}
                          onLoad={() => updateCarouselState(m.id)}
                        >
                          {m.products.map((product: Product) => (
                            /* Individual product card */
                            <div 
                              key={product.id} 
                              className={`product-card${product.isHighlighted ? ' product-card-highlighted' : ''}`}
                              style={s.productCard}
                              onClick={() => {
                                // Send message to parent window to navigate to product URL
                                const decodedUrl = decodeURIComponent(product.data.URL);
                                window.parent.postMessage({
                                  type: 'navigateToProduct',
                                  url: decodedUrl
                                }, '*');
                              }}
                            >
                              <Image 
                                src={product.data.Bild} 
                                alt={product.data.Titel}
                                width={100}
                                height={60}
                                style={s.productImage}
                                unoptimized={true}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <div style={s.productTitle}>{product.data.Titel?.substring(0, 40)}...</div>
                              <div style={s.productInfo}>
                                {product.data.Zoll}&quot; | {product.data.Marke}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Right navigation arrow */}
                        {carouselStates[m.id]?.canScrollRight && (
                          <button 
                            className="carousel-btn"
                            style={{...s.carouselBtn, ...s.carouselBtnRight}}
                            onClick={() => {
                              const container = document.getElementById(`carousel-${m.id}`);
                              if (container) {
                                const cardWidth = 100 + 8; // card width + gap
                                container.scrollLeft += cardWidth;
                              }
                            }}
                          >
                            ›
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {/* Auto-scroll target */}
          <div ref={endRef} />
        </div>
      </div>
    </>
  );
}
