'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

const styles = {
  chatContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    maxHeight: '500px',
    background: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 15px',
    background: '#3B82F6',
    color: 'white'
  },
  headerTitle: {
    margin: 0,
    fontSize: '16px'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 5px'
  },
  messagesList: {
    flex: 1,
    padding: '15px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  message: {
    maxWidth: '80%',
    padding: '8px 12px',
    borderRadius: '16px',
    wordBreak: 'break-word' as const
  },
  userMessage: {
    alignSelf: 'flex-end',
    background: '#3B82F6',
    color: 'white',
    borderBottomRightRadius: '4px'
  },
  botMessage: {
    alignSelf: 'flex-start',
    background: '#f1f5f9',
    color: '#0f172a',
    borderBottomLeftRadius: '4px'
  },
  inputArea: {
    display: 'flex',
    padding: '10px',
    borderTop: '1px solid #e2e8f0'
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    outline: 'none'
  },
  sendButton: {
    marginLeft: '8px',
    padding: '8px 16px',
    background: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hello! How can I help you today?', isUser: false }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  useEffect(() => {
    const handleParentMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'config') {
      }
    };
    
    window.addEventListener('message', handleParentMessage);
    return () => window.removeEventListener('message', handleParentMessage);
  }, []);

  const closeChat = () => {
    window.parent.postMessage({ type: 'chatClose' }, '*');
  };
  const sendMessage = () => {
    if (!input.trim()) return;
    
    const newMessage: Message = {
      id: messages.length + 1,
      text: input,
      isUser: true
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    
    setTimeout(() => {
      const response: Message = {
        id: messages.length + 2,
        text: `You said: "${input}"`,
        isUser: false
      };
      setMessages(prev => [...prev, response]);
    }, 500);
  };

  return (
    <div style={styles.chatContainer}>
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>Chat Support</h3>
        <button onClick={closeChat} style={styles.closeButton}>×</button>
      </div>
      
      <div style={styles.messagesList}>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            style={{
              ...styles.message,
              ...(msg.isUser ? styles.userMessage : styles.botMessage)
            }}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div style={styles.inputArea}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.sendButton}>Send</button>
      </div>
    </div>
  );
}
