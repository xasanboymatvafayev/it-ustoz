
import React, { useState, useEffect } from 'react';
import { SubjectType, TaskResult, CourseTask } from '../types.ts';
import { checkTask } from '../services/geminiService.ts';

interface TaskFormProps {
  userName: string;
  courseTitle: string;
  courseSubject: SubjectType;
  onResult: (res: TaskResult) => void;
  activeTask?: CourseTask;
}

const TaskForm: React.FC<TaskFormProps> = ({ userName, courseTitle, courseSubject, onResult, activeTask }) => {
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (activeTask?.timerEnd) {
      const interval = setInterval(() => {
        const diff = activeTask.timerEnd! - Date.now();
        if (diff <= 0) {
          setTimeLeft(0);
          clearInterval(interval);
        } else {
          setTimeLeft(Math.floor(diff / 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
    }
  }, [activeTask?.timerEnd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim() || timeLeft === 0) return;

    setLoading(true);
    setError('');
    
    try {
      const result = await checkTask(userName, courseSubject, task, courseTitle);
      onResult({ ...result, taskId: activeTask?.id || 'sovereign' });
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isBlocked = timeLeft === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={`bg-slate-900 p-8 rounded-[2.5rem] border ${isBlocked ? 'border-rose-500/50' : 'border-slate-800'} shadow-2xl relative overflow-hidden transition-all duration-500`}>
        {timeLeft !== null && (
          <div className={`absolute top-0 right-0 p-6 font-black text-2xl flex items-center gap-3 ${isBlocked ? 'text-rose-500' : 'text-indigo-500 animate-pulse'}`}>
            <i className={`fas ${isBlocked ? 'fa-lock' : 'fa-clock'}`}></i>
            {isBlocked ? "VAQT TUGADI" : formatTime(timeLeft)}
          </div>
        )}

        <div className="flex items-center gap-4 mb-8">
          <div className={`w-14 h-14 ${isBlocked ? 'bg-rose-500/20 text-rose-500' : 'bg-indigo-600 text-white'} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
            <i className="fas fa-terminal"></i>
          </div>
          <div>
            <h2 className="text-xl font-black text-white">{activeTask ? activeTask.title : "Topshiriq yuborish"}</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{courseSubject}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <textarea
            disabled={loading || isBlocked}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            rows={12}
            placeholder={isBlocked ? "Bu vazifa uchun belgilangan vaqt tugadi. Javob yuborib bo'lmaydi." : "Javobingizni yoki kodingizni bu yerga kiriting..."}
            className={`w-full p-6 rounded-2xl bg-slate-800/50 border ${isBlocked ? 'border-rose-500/20 cursor-not-allowed opacity-50' : 'border-slate-700 focus:border-indigo-500'} outline-none transition text-sm font-mono text-indigo-100 placeholder-slate-600`}
          ></textarea>

          {error && <div className="p-4 bg-rose-500/10 text-rose-500 rounded-xl text-xs font-bold border border-rose-500/20"><i className="fas fa-warning mr-2"></i>{error}</div>}

          <button
            type="submit"
            disabled={loading || !task.trim() || isBlocked}
            className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl ${
              isBlocked 
                ? 'bg-rose-900/20 text-rose-500 border border-rose-500/20' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isBlocked ? "MUDDAT TUGADI" : loading ? "AI MENTOR TEKSHIRMOQDA..." : "TOPSHIRIQNI YUBORISH"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
