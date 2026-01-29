
import React, { useState } from 'react';
import { SubjectType, TaskResult } from '../types.ts';
import { checkTask } from '../services/geminiService.ts';

interface TaskFormProps {
  userName: string;
  courseTitle: string;
  courseSubject: SubjectType;
  onResult: (res: TaskResult) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ userName, courseTitle, courseSubject, onResult }) => {
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const result = await checkTask(userName, courseSubject, task, courseTitle);
      onResult(result);
    } catch (err: any) {
      setError(err.message || "AI tahlilida xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
            <i className="fas fa-terminal"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold">Topshiriqni topshirish</h2>
            <p className="text-slate-400 text-xs uppercase tracking-widest">{courseSubject}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            rows={10}
            placeholder={`Kodingizni yoki javobingizni bu yerga joylashtiring...`}
            className="w-full p-6 rounded-2xl bg-slate-800 border border-slate-700 focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm font-mono text-indigo-100"
          ></textarea>

          {error && (
            <div className="p-4 bg-red-900/20 text-red-400 rounded-2xl text-sm border border-red-900/30">
              <i className="fas fa-exclamation-triangle"></i> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !task.trim()}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "AI Mentor tekshirmoqda..." : "Kodni yuborish"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
