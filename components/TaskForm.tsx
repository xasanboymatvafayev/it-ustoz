
import React, { useState, useEffect } from 'react';
import { SubjectType, TaskResult, CourseTask } from '../types.ts';
import { checkTask } from '../services/geminiService.ts';
import { translations, Lang } from '../translations';

interface TaskFormProps {
  lang: Lang;
  userName: string;
  courseTitle: string;
  courseSubject: SubjectType;
  onResult: (res: TaskResult) => void;
  activeTask?: CourseTask;
}

const TaskForm: React.FC<TaskFormProps> = ({ lang, userName, courseTitle, courseSubject, onResult, activeTask }) => {
  const t = translations[lang];
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (activeTask?.timerEnd) {
      const updateTimer = () => {
        const diff = activeTask.timerEnd! - Date.now();
        if (diff <= 0) { setTimeLeft(0); return false; }
        setTimeLeft(Math.floor(diff / 1000));
        return true;
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [activeTask?.timerEnd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim() || timeLeft === 0) return;
    setLoading(true);
    try {
      const result = await checkTask(userName, courseSubject, task, courseTitle);
      onResult({ ...result, taskId: activeTask?.id || 'sovereign' });
    } finally {
      setLoading(false);
    }
  };

  const isExpired = timeLeft === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={`bg-slate-900 p-8 rounded-[2.5rem] border ${isExpired ? 'border-rose-500/50' : 'border-slate-800'} relative overflow-hidden`}>
        {timeLeft !== null && (
          <div className={`absolute top-0 right-0 p-6 font-black text-2xl ${isExpired ? 'text-rose-500' : 'text-indigo-500 animate-pulse'}`}>
            <i className={`fas ${isExpired ? 'fa-lock' : 'fa-clock'}`}></i> {isExpired ? t.timeExpired : t.timeRemaining}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <textarea
            disabled={loading || isExpired}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            rows={12}
            className="w-full p-6 rounded-2xl bg-slate-800/50 border border-slate-700 outline-none text-indigo-100 font-mono"
            placeholder={isExpired ? t.timeExpired : "Type code or text here..."}
          ></textarea>
          <button type="submit" disabled={loading || !task.trim() || isExpired} className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isExpired ? 'bg-rose-900/20 text-rose-500' : 'bg-indigo-600 text-white'}`}>
            {loading ? t.analyzing : t.submitTask}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
