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
  header: {display:'flex', justifyContent:'flex-start', padding:'8px', position:'absolute' as const, top:'0', left:'0', zIndex:10},
  expandBtn: {width:'28px', height:'28px', background:'#fff', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 4px rgba(0,0,0,0.1)', transition:'all 0.2s'},
  msgList: {flex:1, paddingTop:'16px', paddingBottom:'16px', paddingLeft:'16px', paddingRight:'16px', overflowY:'auto' as const, overflowX:'hidden' as const, display:'flex', flexDirection:'column' as const, gap:'12px', background:'transparent', WebkitOverflowScrolling:'touch' as const, overscrollBehaviorY:'contain' as const},
  msgListWithButton: {flex:1, paddingTop:'44px', paddingBottom:'16px', paddingLeft:'16px', paddingRight:'16px', overflowY:'auto' as const, overflowX:'hidden' as const, display:'flex', flexDirection:'column' as const, gap:'12px', background:'transparent', WebkitOverflowScrolling:'touch' as const, overscrollBehaviorY:'contain' as const},
  msgWrapper: {display:'flex', alignItems:'flex-end', gap:'8px', maxWidth:'90%'},
  userMsg: {alignSelf:'flex-end', background:'#fff', color:'#000', marginLeft:'auto', padding:'10px 14px', borderRadius:'18px', wordBreak:'break-word' as const, fontSize:'14px', lineHeight:'1.4', maxWidth:'85%', border:'1px solid rgba(0,0,0,0.08)'},
  botMsg: {background:'#fff', color:'#000', border:'1px solid rgba(0,0,0,0.08)', padding:'10px 14px', borderRadius:'18px', wordBreak:'break-word' as const, fontSize:'14px', lineHeight:'1.4', maxWidth:'100%'},
  avatar: {width:'18px', height:'18px', borderRadius:'50%', flexShrink:0},
  avatarPlaceholder: {width:'18px', height:'18px', flexShrink:0},
  timestamp: {fontSize:'11px', color:'#999', marginTop:'4px', textAlign:'center' as const},
  productCarousel: {position:'relative' as const, marginTop:'8px', paddingLeft:'0px', paddingRight:'0px'},
  productScroll: {display:'flex', gap:'8px', overflowX:'auto' as const, scrollBehavior:'smooth' as const, scrollbarWidth:'none' as const, msOverflowStyle:'none' as const, paddingLeft:'0px', paddingRight:'8px', scrollSnapType:'x mandatory' as const},
  productCard: {minWidth:'100px', maxWidth:'100px', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'6px', padding:'6px', background:'#fff', fontSize:'11px', flexShrink:0, scrollSnapAlign:'start' as const, scrollSnapStop:'always' as const, boxShadow:'0 1px 3px rgba(0,0,0,0.1)'},
  productImage: {width:'100%', height:'60px', objectFit:'cover' as const, borderRadius:'3px', marginBottom:'3px'},
  productTitle: {fontWeight:'500', lineHeight:'1.2', marginBottom:'2px', fontSize:'10px'},
  productInfo: {color:'#666', fontSize:'9px'},
  carouselBtn: {position:'absolute' as const, top:'50%', transform:'translateY(-50%)', width:'24px', height:'24px', borderRadius:'50%', background:'rgba(255,255,255,0.9)', border:'1px solid rgba(0,0,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 4px rgba(0,0,0,0.1)', zIndex:1},
  carouselBtnLeft: {left:'0'},
  carouselBtnRight: {right:'0'}

};

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [carouselStates, setCarouselStates] = useState<{[key: number]: {canScrollLeft: boolean, canScrollRight: boolean}}>({});
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const msgListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .msg-list {
        scrollbar-width: thin;
        scrollbar-color: rgba(0,0,0,0.2) transparent;
        scroll-behavior: smooth;
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
      
      .carousel-btn:hover {
        background: rgba(255,255,255,1) !important;
        transform: translateY(-50%) scale(1.1);
      }
      

      

      
      .expand-btn:hover {
        background: #f5f5f5 !important;
        transform: scale(1.05);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useLayoutEffect(() => {
    if (endRef.current) {
      // Always scroll to bottom on new messages
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    
    // Initialize carousel states for new messages with products
    msgs.forEach(msg => {
      if (msg.products && msg.products.length > 0 && !carouselStates[msg.id]) {
        setTimeout(() => updateCarouselState(msg.id), 100);
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
  
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'config') return null;
      if (e.data?.type === 'mobileStatus' && typeof e.data.isMobile === 'boolean') {
        setIsMobile(e.data.isMobile);
      }
      if (e.data?.type === 'search' && typeof e.data.text === 'string') {
        // Add user message
        const userMsg = {id: Date.now(), text: e.data.text, isUser: true};
        setMsgs(m => [...m, userMsg]);
        
        // Call the chat API
        fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: e.data.text,
            search_limit: 50,
            ranked_limit: 10
          })
        })
        .then(response => response.json())
        .then(data => {
          // Add AI response message
          const botMsg = {
            id: Date.now() + 1,
            text: data.success ? data.response : 'Entschuldigung, ich konnte keine Antwort finden.',
            isUser: false
          };
          setMsgs(m => [...m, botMsg]);

          // Add products as separate message if they exist
          const highlightedProducts = data.success && data.search_results?.results 
            ? data.search_results.results
                .filter((product: Product) => data.highlight_ids?.includes(product.id))
                .slice(0, 6)
            : [];

          if (highlightedProducts.length > 0) {
            setTimeout(() => {
              const productsMsg = {
                id: Date.now() + 2,
                text: '',
                isUser: false,
                products: highlightedProducts
              };
              setMsgs(m => [...m, productsMsg]);
            }, 300);
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
    <div ref={containerRef} style={{...s.container, ...(isMobile ? {overflow: 'hidden', touchAction: 'none'} : {})}}>
      {!isMobile && (
        <div style={s.header}>
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
        </div>
      )}
      <div ref={msgListRef} className="msg-list" style={isMobile ? s.msgList : s.msgListWithButton}>
        <div style={{ marginTop: 'auto' }} />
        {msgs.map((m, index) => {
          // Find if this is the last bot message (including product messages)
          const isLastBotMessage = !m.isUser && index === msgs.findLastIndex(msg => !msg.isUser);
          
          return m.isUser ? (
            <div key={m.id} style={s.userMsg}>{m.text}</div>
          ) : (
            <div key={m.id} style={s.msgWrapper}>
              {/* Show avatar for last bot message (text or product carousel) */}
              {isLastBotMessage ? (
                <img 
                  src="https://images.squarespace-cdn.com/content/641c5981823d0207a111bb74/999685ce-589d-4f5f-9763-4e094070fb4b/64e9502e4159bed6f8f57b071db5ac7e+%281%29.gif"
                  alt="Assistant"
                  style={s.avatar}
                />
              ) : (
                <div style={s.avatarPlaceholder} />
              )}
              
              {/* Text message */}
              {m.text && (
                <div style={s.botMsg}>{m.text}</div>
              )}
              
              {/* Products-only message */}
              {m.products && m.products.length > 0 && !m.text && (
                <div style={{...s.botMsg, padding: '4px', overflow: 'hidden', background: 'transparent', border: 'none'}}>
                  <div style={s.productCarousel}>
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
                        ←
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
                        →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
