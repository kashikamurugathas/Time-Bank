import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send, User, Clock, Search, CheckCheck, Sparkles } from 'lucide-react';
import { api } from '../../services/api.ts';
import { getSocket } from '../../services/socket.ts';
import { Conversation, Message } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: string;
  targetUserName?: string;
  targetUserPhoto?: string;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetUserName,
  targetUserPhoto
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const convs = await api.getConversations();
      setConversations(convs || []);

      // If targeted user is passed, find or create active conversation
      if (targetUserId) {
        const found = convs.find((c: any) => c.partner_id === targetUserId);
        if (found) {
          selectConversation(found);
        } else {
          // Placeholder pseudo conversation
          setActiveConv({
            id: 'NEW',
            user1_id: user.id,
            user2_id: targetUserId,
            partner_id: targetUserId,
            partner_name: targetUserName || 'Member',
            partner_photo: targetUserPhoto,
            last_message_at: new Date().toISOString(),
            unread_count: 0
          });
          setMessages([]);
        }
      } else if (!activeConv && convs.length > 0) {
        selectConversation(convs[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const selectConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    try {
      const msgs = await api.getMessages(conv.id);
      setMessages(msgs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen, targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket.IO real-time incoming messages listener
  useEffect(() => {
    const s = getSocket();

    const handleNewMessage = (payload: { conversationId: string; message: Message }) => {
      if (activeConv && (payload.conversationId === activeConv.id || payload.message.sender_id === activeConv.partner_id)) {
        setMessages(prev => [...prev, payload.message]);
      }
      // Refresh conversations list
      fetchConversations();
    };

    s.on('new_message', handleNewMessage);
    return () => {
      s.off('new_message', handleNewMessage);
    };
  }, [activeConv]);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConv || !user) return;

    const content = messageInput.trim();
    setMessageInput('');

    try {
      const res = await api.sendMessage({
        recipientId: activeConv.partner_id,
        content
      });

      if (res.message) {
        setMessages(prev => [...prev, res.message]);
        if (activeConv.id === 'NEW') {
          setActiveConv({ ...activeConv, id: res.conversationId });
        }
      }
      fetchConversations();
    } catch (err: any) {
      console.error('Failed to send message:', err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] shadow-2xl border border-[#EAE7F6] overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Conversations List */}
        <div className="w-full md:w-80 border-r border-gray-100 flex flex-col bg-gray-50/60">
          <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#6C3FC5]" />
              <h3 className="font-display font-bold text-sm text-[#452080]">Messages</h3>
            </div>
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {conversations.length === 0 && !targetUserId ? (
              <div className="p-8 text-center text-xs text-gray-400">
                No active conversations yet. Reach out to a nearby helper or respond to a help request!
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = activeConv?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => selectConversation(c)}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-white border-l-4 border-[#6C3FC5] shadow-xs' : 'hover:bg-white/80'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={c.partner_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                        alt={c.partner_name}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-100"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-xs text-gray-900 truncate">
                          {c.partner_name}
                        </span>
                        {c.unread_count > 0 && (
                          <span className="w-4 h-4 bg-[#6C3FC5] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {c.last_message_preview || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Chat View */}
        <div className="flex-1 flex flex-col bg-white">
          {activeConv ? (
            <>
              {/* Chat Top Bar */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shadow-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={activeConv.partner_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                    alt={activeConv.partner_name}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-[#6C3FC5]/30"
                  />
                  <div>
                    <h4 className="font-display font-bold text-sm text-gray-900">{activeConv.partner_name}</h4>
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Time Bank Member &bull; Online</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F7F7FB]">
                {messages.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#F2ECFF] text-[#6C3FC5] flex items-center justify-center mx-auto">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-gray-600">Start the conversation with {activeConv.partner_name}!</p>
                    <p className="text-[10px] text-gray-400 max-w-xs mx-auto">
                      Coordinate service details, time, and exchange expectations.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <img
                            src={m.sender_photo || activeConv.partner_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                            alt=""
                            className="w-7 h-7 rounded-lg object-cover ring-1 ring-purple-200 mt-1"
                          />
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-[#6C3FC5] text-white rounded-br-none'
                              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                          }`}
                        >
                          <p>{m.content}</p>
                          <div className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                            <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && <CheckCheck className="w-3 h-3 text-white/80" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message ${activeConv.partner_name}...`}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-2.5 rounded-xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white disabled:opacity-40 transition-colors shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <MessageSquare className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-sm font-semibold">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
