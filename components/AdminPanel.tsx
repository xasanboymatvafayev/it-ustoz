
import React, { useState } from 'react';
import { User, Course, CourseTask, TaskResult, Subject, SubjectType, EnrollmentRequest } from '../types';
import { translations, Lang } from '../translations';

interface AdminPanelProps {
  lang: Lang;
  users: User[];
  courses: Course[];
  tasks: CourseTask[];
  results: TaskResult[];
  requests: EnrollmentRequest[];
  onAddCourse: (c: Course) => Promise<void>;
  onAddTask: (t: CourseTask) => Promise<void>;
  onApprove: (id: string) => Promise<void>;
  onGrade: (id: string, grade: number) => Promise<void>;
  onDeleteUserFromCourse: (uId: string, cId: string) => Promise<void>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ lang, users, courses, tasks, results, requests, onAddCourse, onAddTask, onApprove, onGrade, onDeleteUserFromCourse }) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'users' | 'requests'>('dashboard');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', subject: Subject.FRONTEND });

  const handleAddCourse = async () => {
    if (!newCourse.title) return alert("Title required!");
    const course: Course = {
      id: `c_${Date.now()}`, title: newCourse.title, description: newCourse.description, subject: newCourse.subject as SubjectType, teacher: "Admin", secretKey: Math.random().toString(36).substring(2, 11).toUpperCase(), createdAt: Date.now()
    };
    await onAddCourse(course);
    setShowAddCourse(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 w-fit">
        <TabBtn active={activeTab === 'dashboard'} label={t.stats} onClick={() => setActiveTab('dashboard')} />
        <TabBtn active={activeTab === 'courses'} label={t.courses} onClick={() => setActiveTab('courses')} />
        <TabBtn active={activeTab === 'requests'} label={t.requests} onClick={() => setActiveTab('requests')} />
        <TabBtn active={activeTab === 'users'} label={t.students} onClick={() => setActiveTab('users')} />
      </div>

      {activeTab === 'dashboard' && (
        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
          <h3 className="text-white font-black text-[10px] uppercase tracking-widest mb-6">{t.recentTasks}</h3>
          <div className="space-y-3">
            {results.map(r => (
              <div key={r.id} className="flex justify-between items-center bg-white/2 p-5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400 font-bold">{r.userName?.[0]}</div>
                  <div><p className="text-white font-bold text-sm">{r.userName}</p></div>
                </div>
                <button onClick={() => {
                  const g = prompt("Grade (0-100):", r.grade.toString());
                  if (g) onGrade(r.id, parseInt(g));
                }} className="text-[9px] font-black uppercase bg-white/5 hover:bg-indigo-600 px-4 py-2 rounded-xl text-slate-400 hover:text-white transition">{t.grade}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-6">
          <button onClick={() => setShowAddCourse(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-indigo-500 transition">+ {t.newCourse}</button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map(c => (
              <div key={c.id} className="bg-white/5 p-8 rounded-3xl border border-white/5">
                <h3 className="text-xl font-black text-white">{c.title}</h3>
                <p className="text-[10px] text-indigo-400 font-mono tracking-widest mt-1">{t.secretKey}: {c.secretKey}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddCourse && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-6">{t.newCourse}</h3>
            <div className="space-y-4">
              <input value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} placeholder={t.newCourseTitle} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
              <textarea value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} placeholder={t.newCourseDesc} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" rows={3} />
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddCourse(false)} className="flex-1 py-3 bg-white/5 text-slate-500 rounded-xl font-black uppercase text-[10px]">{t.cancel}</button>
                <button onClick={handleAddCourse} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px]">{t.create}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TabBtn = ({ active, label, onClick }: any) => (
  <button onClick={onClick} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>{label}</button>
);

export default AdminPanel;
