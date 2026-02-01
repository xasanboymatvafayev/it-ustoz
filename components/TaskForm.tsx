
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
  }, [activeTask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim() || (timeLeft === 0)) return;

    setLoading(true);
    setError('');
    
    try {
      const result = await checkTask(userName, courseSubject, task, courseTitle);
      onResult({ ...result, taskId: activeTask?.id || 'sovereign' });
    } catch (err: any) {
      setError(err.message || "AI tahlilida xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        {timeLeft !== null && (
          <div className={`absolute top-0 right-0 p-4 font-black text-xl flex items-center gap-2 ${timeLeft > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-600'}`}>
            <i className="fas fa-stopwatch"></i>
            {timeLeft > 0 ? formatTime(timeLeft) : "VAQT TUGADI"}
          </div>
        )}

        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
            <i className="fas fa-terminal"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {activeTask ? `Vazifa: ${activeTask.title}` : "Topshiriqni topshirish"}
            </h2>
            <p className="text-slate-400 text-xs uppercase tracking-widest">{courseSubject}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            disabled={timeLeft === 0}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            rows={10}
            placeholder={timeLeft === 0 ? "Vaqt tugadi, javob yuborib bo'lmaydi." : "Kodingizni yoki javobingizni bu yerga joylashtiring..."}
            className={`w-full p-6 rounded-2xl bg-slate-800 border border-slate-700 focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm font-mono text-indigo-100 ${timeLeft === 0 ? 'opacity-50 grayscale' : ''}`}
          ></textarea>

          {error && (
            <div className="p-4 bg-red-900/20 text-red-400 rounded-2xl text-sm border border-red-900/30">
              <i className="fas fa-exclamation-triangle"></i> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !task.trim() || timeLeft === 0}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition shadow-xl"
          >
            {timeLeft === 0 ? "VAQT TUGADI" : loading ? "AI Mentor tekshirmoqda..." : "Kodni yuborish"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
