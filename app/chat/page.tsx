'use client';
import { useState, useRef, useEffect } from 'react';

type Msg = {id: number; text: string; isUser: boolean}

const s = {
  container: {display:'flex', flexDirection:'column' as const, height:'100vh', maxHeight:'500px', background:'#fff', borderRadius:'12px', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', fontFamily:'system-ui'},
  header: {display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 15px', background:'#fff', color:'#000'},
  title: {margin:0, fontSize:'16px', color:'#000'},
  close: {background:'none', border:'none', color:'#888', fontSize:'20px', cursor:'pointer', padding:'0 5px'},
  msgList: {flex:1, padding:'15px', overflowY:'auto' as const, display:'flex', flexDirection:'column' as const, gap:'8px'},
  msg: {maxWidth:'80%', padding:'8px 12px', borderRadius:'16px', wordBreak:'break-word' as const},
  userMsg: {alignSelf:'flex-end', background:'#000', color:'#fff'},
  botMsg: {alignSelf:'flex-start', background:'#f2f2f7', color:'#000'},
  inputArea: {display:'flex', padding:'10px', borderTop:'1px solid #e0e0e0'},
  input: {flex:1, padding:'8px 12px', border:'1px solid #ccc', borderRadius:'4px', outline:'none', color:'#000'},
  send: {marginLeft:'8px', padding:'8px 16px', background:'#000', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer'}
};

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([{id:1, text:'Hello! How can I help you today?', isUser:false}]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({behavior:'smooth'}), [msgs]);
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'config') return null;
      if (e.data?.type === 'search' && typeof e.data.text === 'string') {
        setInput(e.data.text);
        setTimeout(() => send(e.data.text), 0);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const send = (msg?: string) => {
    const message = typeof msg === 'string' ? msg : input;
    if (!message.trim()) return;
    const newMsg = {id: msgs.length + 1, text: message, isUser: true};
    setMsgs(m => [...m, newMsg]);
    setInput('');
    
    setTimeout(() => {
      setMsgs(m => [...m, {id: m.length + 2, text: `You said: "${message}"`, isUser: false}]);
    }, 500);
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h3 style={s.title}>Chat Support</h3>
        <button onClick={() => window.parent.postMessage({type:'chatClose'}, '*')} style={s.close}>×</button>
      </div>
      
      <div style={s.msgList}>
        {msgs.map((m, idx) => (
          <div key={m.id + '-' + idx} style={{...s.msg, ...(m.isUser ? s.userMsg : s.botMsg)}}>{m.text}</div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
