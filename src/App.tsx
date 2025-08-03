import React, { useState, useRef, useEffect } from 'react';
import {
  Send, MessageCircle, Loader2,
  ChevronLeft, ChevronRight, Trash2, Menu
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [greeting, setGreeting] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatId, chats]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good morning! 🌅');
    else if (hour >= 12 && hour < 17) setGreeting('Good afternoon! ☀️');
    else if (hour >= 17 && hour < 21) setGreeting('Good evening! 🌇');
    else setGreeting('Good night! 🌙');
  }, []);

  useEffect(() => { checkBackendHealth(); }, []);

  const checkBackendHealth = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/health');
      const data = await res.ok ? await res.json() : null;
      setBackendStatus(data?.api_ready ? 'ready' : 'error');
    } catch { setBackendStatus('error'); }
  };

  const sendToWatson = async (msg: string): Promise<string> => {
    const res = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg }),
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Request failed');
    return (await res.json()).response;
  };

  useEffect(() => {
    if (chats.length === 0) {
      const id = Date.now().toString();
      const newChat: Chat = { id, title: 'Chat', messages: [], createdAt: new Date() };
      setChats([newChat]);
      setActiveChatId(id);
    }
  }, [chats]);

  const handleSend = async () => {
    if (!message.trim() || loading || !activeChatId) return;
    const id = Date.now().toString();
    const newMsg: Message = { id, text: message.trim(), sender: 'user', timestamp: new Date() };

    setChats(prev => prev.map(chat =>
      chat.id === activeChatId ? { ...chat, messages: [...chat.messages, newMsg] } : chat
    ));
    setMessage('');
    setLoading(true);
    setError(null);

    try {
      const reply = await sendToWatson(message.trim());
      const botMsg: Message = { id: id + '_bot', text: reply, sender: 'bot', timestamp: new Date() };
      setChats(prev => prev.map(chat =>
        chat.id === activeChatId ? { ...chat, messages: [...chat.messages, botMsg] } : chat
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error';
      setError(msg);
      const errMsg: Message = { id: id + '_err', text: `⚠️ ${msg}`, sender: 'bot', timestamp: new Date() };
      setChats(prev => prev.map(chat =>
        chat.id === activeChatId ? { ...chat, messages: [...chat.messages, errMsg] } : chat
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClearChat = () => {
    if (!activeChatId) return;
    setChats(prev => prev.map(chat =>
      chat.id === activeChatId ? { ...chat, messages: [] } : chat
    ));
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDateTime = (d: Date) =>
    d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="flex h-screen font-sans text-gray-100 bg-gradient-to-br from-[#1a1f24] via-[#12161b] to-black">
      
      {/* Desktop toggle button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="hidden sm:block fixed top-4 left-4 z-50 p-1 bg-gray-800/70 hover:bg-gray-800 rounded-full transition"
      >
        {isSidebarOpen ? <ChevronLeft className="w-5 h-5 text-white" /> : <ChevronRight className="w-5 h-5 text-white" />}
      </button>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        sm:relative sm:w-64 bg-gray-900 border-gray-700 border-r flex flex-col justify-between p-4`}>

        <div>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-400 hover:text-cyan-400 transition"
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center mb-3">
            <div className="bg-gradient-to-r from-cyan-500 to-teal-500 p-2 rounded-full shadow-md">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="ml-3 text-lg font-semibold tracking-wide">AI Travel Agent</h1>
          </div>

          <p className="text-xs text-cyan-300 mb-4">{greeting}</p>

          <div className="space-y-2 mb-4 overflow-y-auto max-h-[40vh]">
            {chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => { setActiveChatId(chat.id); setIsSidebarOpen(false); }}
                className={`w-full text-left px-2 py-1 rounded text-xs ${
                  chat.id === activeChatId
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'hover:bg-gray-700/30'
                }`}>
                <div className="truncate">{chat.title}</div>
                <div className="text-[10px] text-gray-400">{formatDateTime(chat.createdAt)}</div>
              </button>
            ))}
          </div>

          <div className={`flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            backendStatus === 'ready'
              ? 'bg-green-500/20 text-green-300'
              : backendStatus === 'error'
              ? 'bg-red-500/20 text-red-300'
              : 'bg-yellow-500/20 text-yellow-300'
          }`}>
            <span className={`w-2 h-2 mr-2 rounded-full ${
              backendStatus === 'ready' ? 'bg-green-300' : backendStatus === 'error' ? 'bg-red-300' : 'bg-yellow-300'
            }`} />
            {backendStatus === 'ready' ? 'Online' : backendStatus === 'error' ? 'Error' : 'Checking'}
          </div>

          <p className="mt-4 text-xs text-gray-400 leading-relaxed">
            Curious about where to go, where to stay, or how to get there? Just ask! Your travel plans, smarter with IBM Watsonx.
          </p>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-500 mt-4">
          {/* <p><MessageCircle className="w-5 h-5 text-white" /> <span className="text-cyan-300">IBM Watsonx</span></p> */}
          <p className="flex items-center space-x-2 text-sm font-medium text-cyan-300">
  <MessageCircle className="w-4 h-4 text-white" />
  <span>IBM Watsonx</span>
</p>

          {activeChat && (
            <button onClick={handleClearChat} className="text-red-400 hover:text-red-500 transition">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between p-2 sm:hidden">
          <button onClick={() => setIsSidebarOpen(true)} className="text-cyan-400">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-base font-semibold text-gray-100">AI Travel Planner</h1>
          <button></button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
          {activeChat?.messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%] px-3 py-2 rounded-2xl text-sm shadow-md bg-gradient-to-br from-cyan-500 to-teal-500 text-white">
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <p className="text-[10px] mt-1 font-mono opacity-50">{formatTime(msg.timestamp)}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-teal-500/20 px-3 py-1.5 rounded-xl flex items-center space-x-2 text-xs text-gray-300">
                <Loader2 className="w-3 h-3 animate-spin text-cyan-400" /> <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 sm:p-4 border-t border-gray-700 bg-[#101418]/90 flex items-center space-x-2 sm:space-x-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={1}
            disabled={!activeChat || loading}
            className="flex-1 resize-none bg-gray-900 border border-gray-700 rounded-md px-2 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || loading || !activeChat}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 px-3 py-2 rounded-md text-white shadow-md transition disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
