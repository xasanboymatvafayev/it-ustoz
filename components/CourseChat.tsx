
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types.ts';
import { api } from '../services/apiService.ts';

interface CourseChatProps {
  user: User;
  courseId: string;
}

const CourseChat: React.FC<CourseChatProps> = ({ user, courseId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const msgs = await api.getMessages(courseId);
    if (JSON.stringify(msgs) !== JSON.stringify(messages)) {
      setMessages(msgs || []);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [courseId, messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      courseId,
      userId: user.id,
      userName: user.firstName,
      userAvatar: user.avatar,
      text: text.trim(),
      timestamp: Date.now()
    };

    try {
      await api.sendMessage(newMessage);
      setText('');
      await fetchMessages();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto aether-card-dark rounded-[3rem] border border-white/5 flex flex-col h-[650px] shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
        <i className="fas fa-comments text-[12rem] text-white"></i>
      </div>

      {/* Chat Header */}
      <div className="p-8 border-b border-white/5 bg-white/5 backdrop-blur-md flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <i className="fas fa-users"></i>
          </div>
          <div>
            <h3 className="font-black text-white text-lg tracking-tight">Guruh Chati</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-vaqtda faol</span>
            </div>
          </div>
        </div>
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
          {messages.length} xabarlar
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-grow overflow-y-auto p-8 space-y-6 custom-scrollbar relative z-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-50">
            <i className="fas fa-comment-slash text-5xl"></i>
            <p className="font-medium italic">Hali xabarlar yo'q. Birinchilardan bo'lib yozing!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.userId === user.id;
            const showAvatar = idx === 0 || messages[idx - 1].userId !== msg.userId;

            return (
              <div key={msg.id} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
                {showAvatar ? (
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {msg.userAvatar ? (
                      <img src={msg.userAvatar} className="w-full h-full object-cover" alt={msg.userName} />
                    ) : (
                      <span className="text-xs font-black text-indigo-400">{msg.userName[0]}</span>
                    )}
                  </div>
                ) : (
                  <div className="w-10 flex-shrink-0"></div>
                )}
                
                <div className={`max-w-[70%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {showAvatar && !isMe && (
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{msg.userName}</span>
                  )}
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white/10 text-slate-200 border border-white/5 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <div className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter opacity-50 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-6 bg-white/5 border-t border-white/5 flex gap-3 relative z-10">
        <input 
          type="text" 
          placeholder="Xabaringizni yozing..." 
          className="flex-grow bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500 transition-all"
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={!text.trim() || loading}
          className="bg-indigo-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <i className="fas fa-paper-plane"></i>
          )}
        </button>
      </form>
    </div>
  );
};

export default CourseChat;
