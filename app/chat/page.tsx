'use client';
import { useState, useRef, useEffect } from 'react';

type Msg = {id: number; text: string; isUser: boolean}

const s = {
  container: {display:'flex', flexDirection:'column' as const, height:'100vh', maxHeight:'500px', background:'white', borderRadius:'8px', overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.1)', fontFamily:'system-ui'},
  header: {display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 15px', background:'#3B82F6', color:'white'},
  title: {margin:0, fontSize:'16px'},
  close: {background:'none', border:'none', color:'white', fontSize:'20px', cursor:'pointer', padding:'0 5px'},
  msgList: {flex:1, padding:'15px', overflowY:'auto' as const, display:'flex', flexDirection:'column' as const, gap:'8px'},
  msg: {maxWidth:'80%', padding:'8px 12px', borderRadius:'16px', wordBreak:'break-word' as const},
  userMsg: {alignSelf:'flex-end', background:'#3B82F6', color:'white', borderBottomRightRadius:'4px'},
  botMsg: {alignSelf:'flex-start', background:'#f1f5f9', color:'#0f172a', borderBottomLeftRadius:'4px'},
  inputArea: {display:'flex', padding:'10px', borderTop:'1px solid #e2e8f0'},
  input: {flex:1, padding:'8px 12px', border:'1px solid #e2e8f0', borderRadius:'4px', outline:'none'},
  send: {marginLeft:'8px', padding:'8px 16px', background:'#3B82F6', color:'white', border:'none', borderRadius:'4px', cursor:'pointer'}
};

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([{id:1, text:'Hello! How can I help you today?', isUser:false}]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({behavior:'smooth'}), [msgs]);
  useEffect(() => {
    const handler = (e: MessageEvent) => e.data?.type === 'config' && null;
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const send = () => {
    if (!input.trim()) return;
    const newMsg = {id: msgs.length + 1, text: input, isUser: true};
    setMsgs(m => [...m, newMsg]);
    setInput('');
    
    setTimeout(() => {
      setMsgs(m => [...m, {id: msgs.length + 2, text: `You said: "${input}"`, isUser: false}]);
    }, 500);
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h3 style={s.title}>Chat Support</h3>
        <button onClick={() => window.parent.postMessage({type:'chatClose'}, '*')} style={s.close}>×</button>
      </div>
      
      <div style={s.msgList}>
        {msgs.map(m => (
          <div key={m.id} style={{...s.msg, ...(m.isUser ? s.userMsg : s.botMsg)}}>{m.text}</div>
        ))}
        <div ref={endRef} />
      </div>
      
      <div style={s.inputArea}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type your message..."
          style={s.input}
        />
        <button onClick={send} style={s.send}>Send</button>
      </div>
    </div>
  );
}
