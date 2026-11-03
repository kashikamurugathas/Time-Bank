import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, Clock, ChevronRight, HelpCircle, MapPin } from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AiAssistant: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: "Hello! I'm your **Time Bank AI Assistant**.\n\nI can help you search our verified community helpers, discover high-demand skills, guide your learning journey, or draft a help request. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    const userMsg: MessageItem = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const userLoc = user?.latitude && user?.longitude ? {
        lat: user.latitude,
        lng: user.longitude,
        city: user.city || 'Jaffna'
      } : {
        lat: 9.6749,
        lng: 80.0292,
        city: 'Jaffna'
      };

      const res = await api.chatWithAi({
        prompt: queryText,
        conversationId: conversationId || undefined,
        userLocation: userLoc,
        userId: user?.id
      });

      if (res.conversationId) {
        setConversationId(res.conversationId);
      }

      const botMsg: MessageItem = {
        id: 'bot_' + Date.now(),
        sender: 'assistant',
        content: res.reply || 'I am here to assist your community time exchange.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'assistant',
          content: 'Sorry, I encountered a temporary connection issue. Please try asking again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'Find a computer teacher near Jaffna',
    'How does 1 hour = 1 time credit work?',
    'What skills can I learn as a beginner?',
    'How do I create a help request?'
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 ${
            isOpen
              ? 'bg-gray-900 text-white'
              : 'bg-gradient-to-r from-[#6C3FC5] via-[#7B4BD9] to-[#452080] text-white ring-4 ring-[#6C3FC5]/20 animate-pulse-subtle'
          }`}
          title="Time Bank AI Assistant"
        >
          {isOpen ? (
            <>
              <X className="w-5 h-5" />
              <span className="text-xs font-bold">Close Assistant</span>
            </>
          ) : (
            <>
              <div className="relative">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white" />
              </div>
              <span className="text-xs font-bold font-display tracking-wide">Time Bank AI</span>
            </>
          )}
        </button>
      </div>

      {/* Floating Drawer Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[94vw] sm:w-[420px] max-h-[640px] h-[82vh] bg-white rounded-3xl shadow-2xl border border-[#EAE7F6] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#6C3FC5] to-[#452080] p-4 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-sm tracking-tight">Time Bank AI Assistant</h3>
                  <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-400 text-emerald-950">Active</span>
                </div>
                <p className="text-[11px] text-[#C4B5FD]">Powered by Gemini &bull; Real Database Grounded</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="bg-[#F2ECFF]/60 px-3 py-2 border-b border-[#EAE7F6] overflow-x-auto whitespace-nowrap flex gap-1.5 no-scrollbar">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="text-[11px] font-medium bg-white hover:bg-[#6C3FC5] hover:text-white text-[#452080] px-2.5 py-1 rounded-full border border-[#6C3FC5]/20 shrink-0 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages Flow */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6C3FC5] to-[#452080] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-[#6C3FC5] text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none whitespace-pre-line'
                  }`}
                >
                  {m.content}
                  <div className={`text-[9px] mt-1 text-right ${m.sender === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                    {m.timestamp}
                  </div>
                </div>
                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-[#452080] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-white p-3 rounded-2xl border border-gray-100 w-fit">
                <Sparkles className="w-4 h-4 text-[#6C3FC5] animate-spin" />
                <span>Searching verified members &amp; database...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-gray-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about skills, nearby helpers, credits..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">
              Time Bank AI verifies real available members in SQLite.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
