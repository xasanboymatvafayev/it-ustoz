
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const msgs = await api.getMessages(courseId);
    setMessages(msgs || []);
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
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
      <div className="p-4 border-b bg-slate-50 rounded-t-3xl">
        <h3 className="font-black text-slate-800 text-sm">Guruh Chati</h3>
      </div>
      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.userId === user.id ? 'flex-row-reverse' : ''}`}>
            <div className={`p-3 rounded-2xl text-sm ${msg.userId === user.id ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
        <input 
          type="text" 
          placeholder="Xabar..." 
          className="flex-grow bg-slate-50 border rounded-xl px-4 py-2"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button type="submit" className="bg-indigo-600 text-white p-2 rounded-xl">
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default CourseChat;
