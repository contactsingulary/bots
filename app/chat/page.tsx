'use client';
import { useState, useRef, useEffect, useLayoutEffect } from 'react';

type Msg = {id: number; text: string; isUser: boolean}

const s = {
  container: {display:'flex', flexDirection:'column' as const, height:'100vh', background:'rgba(255,255,255,0.1)', backdropFilter:'blur(2px)', overflow:'hidden', fontFamily:'system-ui', borderRadius:'20px', position:'relative' as const},
  header: {display:'flex', justifyContent:'flex-start', padding:'8px', position:'absolute' as const, top:'0', left:'0', zIndex:10},
  expandBtn: {width:'28px', height:'28px', background:'#fff', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 4px rgba(0,0,0,0.1)', transition:'all 0.2s'},
  msgList: {flex:1, paddingTop:'16px', paddingBottom:'16px', paddingLeft:'16px', paddingRight:'16px', overflowY:'auto' as const, overflowX:'hidden' as const, display:'flex', flexDirection:'column' as const, gap:'12px', background:'transparent', WebkitOverflowScrolling:'touch' as const, overscrollBehaviorY:'contain' as const},
  msgListWithButton: {flex:1, paddingTop:'44px', paddingBottom:'16px', paddingLeft:'16px', paddingRight:'16px', overflowY:'auto' as const, overflowX:'hidden' as const, display:'flex', flexDirection:'column' as const, gap:'12px', background:'transparent', WebkitOverflowScrolling:'touch' as const, overscrollBehaviorY:'contain' as const},
  msgWrapper: {display:'flex', alignItems:'flex-end', gap:'8px', maxWidth:'85%'},
  userMsg: {alignSelf:'flex-end', background:'#fff', color:'#000', marginLeft:'auto', padding:'10px 14px', borderRadius:'18px', wordBreak:'break-word' as const, fontSize:'14px', lineHeight:'1.4', maxWidth:'85%', border:'1px solid rgba(0,0,0,0.08)'},
  botMsg: {background:'#fff', color:'#000', border:'1px solid rgba(0,0,0,0.08)', padding:'10px 14px', borderRadius:'18px', wordBreak:'break-word' as const, fontSize:'14px', lineHeight:'1.4'},
  avatar: {width:'18px', height:'18px', borderRadius:'50%', flexShrink:0},
  avatarPlaceholder: {width:'18px', height:'18px', flexShrink:0},
  timestamp: {fontSize:'11px', color:'#999', marginTop:'4px', textAlign:'center' as const}
};

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [isMobile, setIsMobile] = useState(false);
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
      
      .expand-btn:hover {
        background: #f5f5f5 !important;
        transform: scale(1.05);
      }
      
      /* Prevent scrolling on mobile */
      @media (max-width: 768px) {
        body, html {
          overflow: hidden !important;
          position: fixed !important;
          width: 100% !important;
          height: 100% !important;
          touch-action: none !important;
          -webkit-overflow-scrolling: none !important;
        }
        
        .mobile-no-scroll {
          overflow: hidden !important;
          touch-action: none !important;
          -webkit-overflow-scrolling: none !important;
          overscroll-behavior: none !important;
        }
        
        /* Allow scrolling in message list on mobile */
        .msg-list {
          overflow-y: auto !important;
          touch-action: pan-y !important;
          -webkit-overflow-scrolling: touch !important;
          overscroll-behavior-y: contain !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useLayoutEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
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
      containerRef.current.style.webkitOverflowScrolling = 'none';
      containerRef.current.style.overscrollBehavior = 'none';
      containerRef.current.style.position = 'fixed';
      containerRef.current.style.width = '100%';
      containerRef.current.style.height = '100%';
    }
    
    // Allow scrolling on the message list
    if (msgListRef.current) {
      msgListRef.current.style.touchAction = 'pan-y';
      msgListRef.current.style.webkitOverflowScrolling = 'touch';
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
        containerRef.current.style.webkitOverflowScrolling = '';
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
        
        // Simulate bot response
        setTimeout(() => {
          const responses = [
            `Ich habe "${e.data.text}" erhalten. Wie kann ich dir dabei helfen?`,
            `Danke für deine Nachricht. Lass mich das für dich überprüfen.`,
            `Interessante Frage zu "${e.data.text}". Hier ist was ich denke...`
          ];
          const botMsg = {
            id: Date.now() + 1, 
            text: responses[Math.floor(Math.random() * responses.length)], 
            isUser: false
          };
          setMsgs(m => [...m, botMsg]);
        }, 800);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleExpand = () => {
    window.parent.postMessage({type: 'expandChat'}, '*');
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
          // Find if this is the last bot message
          const isLastBotMessage = !m.isUser && index === msgs.findLastIndex(msg => !msg.isUser);
          
          return m.isUser ? (
            <div key={m.id} style={s.userMsg}>{m.text}</div>
          ) : (
            <div key={m.id} style={s.msgWrapper}>
              {isLastBotMessage ? (
                <img 
                  src="https://images.squarespace-cdn.com/content/641c5981823d0207a111bb74/999685ce-589d-4f5f-9763-4e094070fb4b/64e9502e4159bed6f8f57b071db5ac7e+%281%29.gif"
                  alt="Assistant"
                  style={s.avatar}
                />
              ) : (
                <div style={s.avatarPlaceholder} />
              )}
              <div style={s.botMsg}>{m.text}</div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
