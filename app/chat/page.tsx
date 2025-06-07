'use client';
import { useState, useRef, useEffect, useLayoutEffect } from 'react';

type Product = {
  id: string;
  data: {
    Bild: string;
    Titel: string;
    Zoll: string;
    Marke: string;
    [key: string]: any;
  };
  [key: string]: any;
}

type Msg = {id: number; text: string; isUser: boolean; products?: Product[]}

const s = {
  container: {display:'flex', flexDirection:'column' as const, height:'100vh', background:'rgba(255,255,255,0.1)', backdropFilter:'blur(2px)', overflow:'hidden', fontFamily:'system-ui', borderRadius:'20px', position:'relative' as const},
  header: {display:'flex', flexDirection:'column' as const, gap:'8px', padding:'8px', position:'absolute' as const, top:'0', left:'0', zIndex:10},
  expandBtn: {width:'28px', height:'28px', background:'#fff', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 4px rgba(0,0,0,0.1)', transition:'all 0.2s'},
  settingsBtn: {width:'28px', height:'28px', background:'#fff', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 4px rgba(0,0,0,0.1)', transition:'all 0.2s'},
  msgList: {flex:1, paddingTop:'52px', paddingBottom:'4px', paddingLeft:'16px', paddingRight:'16px', overflowY:'auto' as const, overflowX:'hidden' as const, display:'flex', flexDirection:'column' as const, gap:'12px', background:'transparent', WebkitOverflowScrolling:'touch' as const, overscrollBehaviorY:'contain' as const},
  msgListWithButton: {flex:1, paddingTop:'80px', paddingBottom:'4px', paddingLeft:'16px', paddingRight:'16px', overflowY:'auto' as const, overflowX:'hidden' as const, display:'flex', flexDirection:'column' as const, gap:'12px', background:'transparent', WebkitOverflowScrolling:'touch' as const, overscrollBehaviorY:'contain' as const},
  msgWrapper: {display:'flex', alignItems:'flex-end', gap:'8px', maxWidth:'90%'},
  msgWrapperProducts: {display:'flex', alignItems:'flex-end', gap:'8px', width:'100%'},
  msgWrapperFullWidth: {display:'flex', flexDirection:'column' as const, gap:'8px', width:'100%'},
  userMsg: {alignSelf:'flex-end', background:'#fff', color:'#000', marginLeft:'auto', padding:'10px 14px', borderRadius:'18px', wordBreak:'break-word' as const, fontSize:'14px', lineHeight:'1.4', maxWidth:'85%', border:'1px solid rgba(0,0,0,0.08)', animation:'fadeIn 0.5s ease-out'},
  botMsg: {background:'#fff', color:'#000', border:'1px solid rgba(0,0,0,0.08)', padding:'10px 14px', borderRadius:'18px', wordBreak:'break-word' as const, fontSize:'14px', lineHeight:'1.4', maxWidth:'100%', animation:'fadeIn 0.6s ease-out'},
  avatarWrapper: {display:'flex', justifyContent:'center', marginTop:'8px'},
  avatar: {width:'18px', height:'18px', borderRadius:'50%', flexShrink:0, transition:'all 0.3s ease'},
  avatarJump: {width:'18px', height:'18px', borderRadius:'50%', flexShrink:0, animation:'avatarJump 1.2s ease-in-out'},
  avatarPlaceholder: {width:'18px', height:'18px', flexShrink:0},
  timestamp: {fontSize:'11px', color:'#999', marginTop:'4px', textAlign:'center' as const},
  productCarousel: {position:'relative' as const, marginTop:'8px', paddingLeft:'0px', paddingRight:'0px', overflow:'hidden'},
  productScroll: {display:'flex', gap:'8px', overflowX:'auto' as const, scrollBehavior:'smooth' as const, scrollbarWidth:'none' as const, msOverflowStyle:'none' as const, paddingLeft:'0px', paddingRight:'0px', scrollSnapType:'x mandatory' as const, borderRadius:'12px'},
  productCard: {minWidth:'100px', maxWidth:'100px', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'6px', padding:'6px', background:'#fff', fontSize:'11px', flexShrink:0, scrollSnapAlign:'center' as const, scrollSnapStop:'always' as const, boxShadow:'0 1px 3px rgba(0,0,0,0.1)'},
  productImage: {width:'100%', height:'60px', objectFit:'cover' as const, borderRadius:'3px', marginBottom:'3px'},
  productTitle: {fontWeight:'500', lineHeight:'1.2', marginBottom:'2px', fontSize:'10px'},
  productInfo: {color:'#666', fontSize:'9px'},
  carouselBtn: {position:'absolute' as const, top:'50%', transform:'translateY(-50%)', width:'20px', height:'20px', borderRadius:'50%', background:'rgba(255,255,255,0.95)', border:'1px solid rgba(0,0,0,0.05)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', zIndex:1, fontSize:'12px', color:'rgba(0,0,0,0.6)', fontWeight:'400'},
  carouselBtnLeft: {left:'0'},
  carouselBtnRight: {right:'0'},
  consentOverlay: {position:'fixed' as const, bottom:'16px', left:'16px', right:'16px', zIndex:1000},
  consentModal: {background:'#fff', borderRadius:'16px', padding:'20px', maxWidth:'320px', margin:'0 auto', boxShadow:'0 10px 40px rgba(0,0,0,0.25)', border:'1px solid rgba(0,0,0,0.08)', position:'relative' as const, animation:'consentFadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)'},
  consentTitle: {fontSize:'20px', fontWeight:'700', marginBottom:'8px', color:'#000', textAlign:'left' as const},
  consentSubtitle: {fontSize:'13px', color:'#666', marginBottom:'20px', textAlign:'left' as const, lineHeight:'1.3'},
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
  consentLink: {color:'#000', textDecoration:'underline'},
  consentDetails: {fontSize:'10px', color:'#888', lineHeight:'1.4', marginTop:'16px', marginBottom:'12px'},
  consentFooter: {fontSize:'11px', color:'#999', textAlign:'left' as const, marginTop:'12px', marginBottom:'16px'},
  consentButtons: {display:'flex', gap:'8px'},
  consentButton: {flex:1, padding:'12px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'15px', fontWeight:'500', transition:'all 0.2s'},
  consentReject: {background:'#f5f5f7', color:'#000'},
  consentAccept: {background:'#000', color:'#fff'}

};

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [carouselStates, setCarouselStates] = useState<{[key: number]: {canScrollLeft: boolean, canScrollRight: boolean}}>({});
  const [jumpingAvatars, setJumpingAvatars] = useState<{[key: number]: boolean}>({});
  const [showConsent, setShowConsent] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [nonEssentialCookies, setNonEssentialCookies] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const msgListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen for consent status from parent window
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'consentUpdate') {
        setHasConsent(event.data.hasConsent);
        setSessionId(event.data.sessionId);
        setShowConsent(false);
        console.log('Received consent update with session ID:', event.data.sessionId);
      } else if (event.data?.type === 'showConsent') {
        setShowConsent(true);
      } else if (event.data?.type === 'resetChat') {
        // Clear all messages when consent is revoked
        setMsgs([]);
        setCarouselStates({});
        setJumpingAvatars({});
        console.log('Chat reset due to consent revocation');
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useLayoutEffect(() => {
    // Gentle scroll to bottom 
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
  }, [msgs]);
  
  // Prevent scrolling on mobile (except message list)
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
            
            if ((isAtTop && e.touches[0].clientY > (e as any).lastY) || 
                (isAtBottom && e.touches[0].clientY < (e as any).lastY)) {
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
        (e as any).lastY = e.touches[0].clientY;
      }
    };
    
    // Add event listeners to container specifically
    if (containerRef.current) {
      containerRef.current.addEventListener('touchstart', trackTouch, { passive: false });
      containerRef.current.addEventListener('touchmove', preventContainerScroll, { passive: false });
      
      // Lock container styles
      containerRef.current.style.overflow = 'hidden';
      containerRef.current.style.touchAction = 'none';
      (containerRef.current.style as any).webkitOverflowScrolling = 'none';
      containerRef.current.style.overscrollBehavior = 'none';
      containerRef.current.style.position = 'fixed';
      containerRef.current.style.width = '100%';
      containerRef.current.style.height = '100%';
    }
    
    // Allow scrolling on the message list
    if (msgListRef.current) {
      msgListRef.current.style.touchAction = 'pan-y';
      (msgListRef.current.style as any).webkitOverflowScrolling = 'touch';
      msgListRef.current.style.overscrollBehavior = 'contain';
      msgListRef.current.style.overflowY = 'auto';
      msgListRef.current.style.overflowX = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      if (containerRef.current) {
        containerRef.current.removeEventListener('touchstart', trackTouch);
        containerRef.current.removeEventListener('touchmove', preventContainerScroll);
        containerRef.current.style.overflow = '';
        containerRef.current.style.touchAction = '';
        (containerRef.current.style as any).webkitOverflowScrolling = '';
        containerRef.current.style.overscrollBehavior = '';
        containerRef.current.style.position = '';
        containerRef.current.style.width = '';
        containerRef.current.style.height = '';
      }
    };
  }, [isMobile]);
  
  const handleConsentAccept = () => {
    // Notify parent window about consent acceptance
    window.parent.postMessage({
      type: 'consentAccepted', 
      nonEssential: nonEssentialCookies
    }, '*');
  };

  const handleConsentReject = () => {
    // Notify parent window about consent rejection
    window.parent.postMessage({type: 'consentRejected'}, '*');
  };

  const showConsentDialog = () => {
    if (!hasConsent) {
      setShowConsent(true);
    }
  };

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'config') return null;
      if (e.data?.type === 'mobileStatus' && typeof e.data.isMobile === 'boolean') {
        setIsMobile(e.data.isMobile);
      }
      if (e.data?.type === 'search' && typeof e.data.text === 'string') {
        // Consent check is now handled by parent window
        const currentSessionId = e.data.sessionId || sessionId;
        
        // Add user message
        const userMsg = {id: Date.now(), text: e.data.text, isUser: true};
        setMsgs(m => [...m, userMsg]);
        
        // Call the chat API with session ID
        fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: e.data.text,
            search_limit: 50,
            ranked_limit: 10,
            session_id: currentSessionId
          })
        })
        .then(response => response.json())
        .then(data => {
          // Prepare products immediately to avoid rendering delay
          const highlightedProducts = data.success && data.search_results?.results 
            ? data.search_results.results
                .filter((product: Product) => data.highlight_ids?.includes(product.id))
                .slice(0, 6)
            : [];

          // Add AI response message
          const botMsg = {
            id: Date.now() + 1,
            text: data.success ? data.response : 'Entschuldigung, ich konnte keine Antwort finden.',
            isUser: false
          };
          setMsgs(m => [...m, botMsg]);
          
          // Trigger avatar jump after message fade-in completes
          setTimeout(() => {
            setJumpingAvatars(prev => ({...prev, [botMsg.id]: true}));
            setTimeout(() => {
              setJumpingAvatars(prev => ({...prev, [botMsg.id]: false}));
            }, 1200);
          }, 700);

          // Add products as separate message (products already processed)
          if (highlightedProducts.length > 0) {
            setTimeout(() => {
              const productsMsg = {
                id: Date.now() + 2,
                text: '',
                isUser: false,
                products: highlightedProducts
              };
              setMsgs(m => [...m, productsMsg]);
              
              // Trigger avatar jump for product message (delayed)
              setTimeout(() => {
                setJumpingAvatars(prev => ({...prev, [productsMsg.id]: true}));
                setTimeout(() => {
                  setJumpingAvatars(prev => ({...prev, [productsMsg.id]: false}));
                }, 1200);
              }, 300);
            }, 1800);
          }
        })
        .catch(error => {
          console.error('Chat API error:', error);
          const errorMsg = {
            id: Date.now() + 1,
            text: 'Entschuldigung, es gab ein technisches Problem. Bitte versuchen Sie es später erneut.',
            isUser: false
          };
          setMsgs(m => [...m, errorMsg]);
        });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleExpand = () => {
    window.parent.postMessage({type: 'expandChat'}, '*');
  };

  const handleSettings = () => {
    setShowConsent(true);
  };

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

  return (
    <>
      {showConsent && (
        <div style={s.consentOverlay}>
          <div style={s.consentModal}>
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
            
            <div style={s.consentDetails}>
              <div><strong>Verantwortliche Stelle:</strong> Singulary</div>
              <div><strong>Zweck:</strong> Chat-Funktionalität, Personalisierung</div>
              <div><strong>Speicherdauer:</strong> 12 Monate</div>
              <div><strong>Rechtsgrundlage:</strong> Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)</div>
            </div>
            
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
      
      <div ref={containerRef} style={{...s.container, ...(isMobile ? {overflow: 'hidden', touchAction: 'none'} : {})}}>
        <div style={s.header}>
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
      <div ref={msgListRef} className="msg-list" style={isMobile ? s.msgList : s.msgListWithButton}>
        <div style={{ marginTop: 'auto' }} />
        {msgs.map((m, index) => {
          // Avatar only shows on the very last bot message (moves from text to products)
          const isLastBotMessage = !m.isUser && index === msgs.findLastIndex(msg => !msg.isUser);
          
          return m.isUser ? (
            <div key={m.id} style={s.userMsg}>{m.text}</div>
          ) : (
            <div key={m.id} style={m.products && m.products.length > 0 && !m.text ? s.msgWrapperProducts : s.msgWrapper}>
              {/* Text message with side avatar */}
              {m.text && (
                <>
                                     {/* Show avatar for last bot message */}
                   {isLastBotMessage ? (
                     <img 
                       src="https://images.squarespace-cdn.com/content/641c5981823d0207a111bb74/999685ce-589d-4f5f-9763-4e094070fb4b/64e9502e4159bed6f8f57b071db5ac7e+%281%29.gif"
                       alt="Assistant"
                       style={jumpingAvatars[m.id] ? s.avatarJump : s.avatar}
                     />
                   ) : (
                     <div style={s.avatarPlaceholder} />
                   )}
                  <div style={s.botMsg}>{m.text}</div>
                </>
              )}
              
              {/* Products-only message full width */}
              {m.products && m.products.length > 0 && !m.text && (
                <>
                  {/* Show avatar for last bot message on the left */}
                  {isLastBotMessage ? (
                    <img 
                      src="https://images.squarespace-cdn.com/content/641c5981823d0207a111bb74/999685ce-589d-4f5f-9763-4e094070fb4b/64e9502e4159bed6f8f57b071db5ac7e+%281%29.gif"
                      alt="Assistant"
                      style={jumpingAvatars[m.id] ? s.avatarJump : s.avatar}
                    />
                  ) : (
                    <div style={s.avatarPlaceholder} />
                  )}
                  <div style={{width: '100%', overflow: 'hidden', background: 'transparent'}}>
                    <div className="product-carousel" style={s.productCarousel}>
                    {/* Left arrow */}
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
                    
                    {/* Scrollable products */}
                    <div 
                      id={`carousel-${m.id}`}
                      className="product-scroll"
                      style={s.productScroll}
                      onScroll={() => updateCarouselState(m.id)}
                      onLoad={() => updateCarouselState(m.id)}
                    >
                      {m.products.map((product: Product) => (
                        <div key={product.id} style={s.productCard}>
                          <img 
                            src={product.data.Bild} 
                            alt={product.data.Titel}
                            style={s.productImage}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div style={s.productTitle}>{product.data.Titel?.substring(0, 40)}...</div>
                          <div style={s.productInfo}>
                            {product.data.Zoll}" | {product.data.Marke}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Right arrow */}
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
        <div ref={endRef} />
      </div>
    </div>
    </>
  );
}
