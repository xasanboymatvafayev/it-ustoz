
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { api } from '../services/apiService';

interface CourseChatProps {
  user: User;
  courseId: string;
}

const CourseChat: React.FC<CourseChatProps> = ({ user, courseId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const msgs = await api.getMessages(courseId);
    setMessages(msgs);
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [courseId]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      courseId,
      userId: user.id,
      userName: user.firstName,
      userAvatar: user.avatar,
      text: text.trim(),
      timestamp: Date.now()
    };

    await api.sendMessage(newMessage);
    setText('');
    fetchMessages();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[500px]">
      <div className="p-4 border-b bg-slate-50 rounded-t-3xl flex items-center justify-between">
        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
          <i className="fas fa-comments text-indigo-600"></i> Kurs Guruhi
        </h3>
        <span className="text-[10px] text-slate-400 font-bold uppercase">{messages.length} xabarlar</span>
      </div>

      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.userId === user.id ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 shrink-0">
              {msg.userAvatar ? (
                <img src={msg.userAvatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
              ) : (
                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold">
                  {msg.userName[0]}
                </div>
              )}
            </div>
            <div className={`max-w-[70%] ${msg.userId === user.id ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className="text-[10px] font-bold text-slate-400 mb-1 px-1">{msg.userName}</div>
              <div className={`p-3 rounded-2xl text-sm ${msg.userId === user.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'}`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 italic text-sm gap-2">
            <i className="fas fa-ghost text-2xl"></i>
            Hali xabarlar yo'q. Birinchi bo'lib yozing!
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
        <input 
          type="text" 
          placeholder="Xabar yozing..." 
          className="flex-grow bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-600 transition"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button type="submit" className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition">
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default CourseChat;
