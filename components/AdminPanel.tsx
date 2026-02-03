
import React, { useState } from 'react';
import { User, Course, CourseTask, TaskResult, Subject, SubjectType, EnrollmentRequest } from '../types';

interface AdminPanelProps {
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

const AdminPanel: React.FC<AdminPanelProps> = ({ users, courses, tasks, results, requests, onAddCourse, onAddTask, onApprove, onGrade, onDeleteUserFromCourse }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'users' | 'requests'>('dashboard');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddTask, setShowAddTask] = useState<string | null>(null);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', subject: Subject.FRONTEND });
  const [newTask, setNewTask] = useState({ title: '', description: '', criteria: '', duration: '60' });

  const handleAddCourse = async () => {
    if (!newCourse.title) return alert("Sarlavha kiriting!");
    const course: Course = {
      id: `c_${Date.now()}`,
      title: newCourse.title,
      description: newCourse.description,
      subject: newCourse.subject as SubjectType,
      teacher: "Admin",
      secretKey: Math.random().toString(36).substring(2, 11).toUpperCase(),
      createdAt: Date.now()
    };
    await onAddCourse(course);
    setShowAddCourse(false);
  };

  const handleAddTask = async (courseId: string) => {
    if (!newTask.title) return alert("Vazifa nomini kiriting!");
    const timerEnd = Date.now() + (parseInt(newTask.duration) * 60 * 1000);
    const task: CourseTask = {
      id: `t_${Date.now()}`,
      courseId,
      title: newTask.title,
      description: newTask.description,
      validationCriteria: newTask.criteria,
      timerEnd
    };
    await onAddTask(task);
    setShowAddTask(null);
  };

  const handleDeleteStudent = (uId: string, cId: string) => {
    if (window.confirm("Haqiqatan ham bu talabani kursdan o'chirmoqchimisiz?")) {
      onDeleteUserFromCourse(uId, cId);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 w-fit">
        <TabBtn active={activeTab === 'dashboard'} label="Statistika" onClick={() => setActiveTab('dashboard')} />
        <TabBtn active={activeTab === 'courses'} label="Kurslar" onClick={() => setActiveTab('courses')} />
        <TabBtn active={activeTab === 'requests'} label="So'rovlar" onClick={() => setActiveTab('requests')} />
        <TabBtn active={activeTab === 'users'} label="Talabalar" onClick={() => setActiveTab('users')} />
      </div>

      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 gap-3">
          {requests.filter(r => r.status === 'pending').map(req => (
            <div key={req.id} className="bg-white/5 p-6 rounded-2xl border border-white/5 flex justify-between items-center hover:bg-white/10 transition">
              <div>
                <p className="text-white font-bold">{req.userName}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">{req.courseTitle}</p>
              </div>
              <button onClick={() => onApprove(req.id)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-500 transition shadow-lg">Qabul qilish</button>
            </div>
          ))}
          {requests.filter(r => r.status === 'pending').length === 0 && <p className="text-slate-600 italic text-center py-20">Hozircha so'rovlar yo'q.</p>}
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-6">
          <button onClick={() => setShowAddCourse(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-indigo-500 transition">+ Yangi Kurs Yarating</button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map(c => (
              <div key={c.id} className="bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-white/10 transition">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black text-white">{c.title}</h3>
                    <p className="text-[10px] text-indigo-400 font-mono tracking-widest mt-1">Secret Key: {c.secretKey}</p>
                  </div>
                  <button onClick={() => setShowAddTask(c.id)} className="w-10 h-10 bg-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-indigo-600 transition flex items-center justify-center shadow-inner"><i className="fas fa-plus"></i></button>
                </div>
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest border-b border-white/5 pb-1">Ro'yxatdagi Talabalar</p>
                  {users.filter(u => u.enrolledCourses.includes(c.id)).map(u => (
                    <div key={u.id} className="flex justify-between items-center text-xs text-white p-2 hover:bg-white/5 rounded-lg transition">
                      <span className="font-medium">{u.firstName} {u.lastName}</span>
                      <button onClick={() => handleDeleteStudent(u.id, c.id)} className="text-rose-500 opacity-50 hover:opacity-100 transition"><i className="fas fa-trash-alt"></i></button>
                    </div>
                  ))}
                  {users.filter(u => u.enrolledCourses.includes(c.id)).length === 0 && <p className="text-[9px] text-slate-700 italic">Talabalar yo'q</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kurs qo'shish modal */}
      {showAddCourse && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-6">Yangi Kurs</h3>
            <div className="space-y-4">
              <input value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} placeholder="Kurs nomi" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition" />
              <textarea value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} placeholder="Tavsif" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition" rows={3} />
              <select value={newCourse.subject} onChange={e => setNewCourse({...newCourse, subject: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none">
                {Object.values(Subject).map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
              </select>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddCourse(false)} className="flex-1 py-3 bg-white/5 text-slate-500 rounded-xl font-black uppercase text-[10px] hover:text-white transition">Bekor qilish</button>
                <button onClick={handleAddCourse} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] hover:bg-indigo-500 transition shadow-lg">Yaratish</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vazifa qo'shish modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-4">Vazifa Qo'shish</h3>
            <div className="space-y-4">
              <input value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="Vazifa sarlavhasi" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition" />
              <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} placeholder="Vazifa sharti (nima qilish kerak?)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition" rows={3} />
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Vaqt (daqiqalarda)</label>
                <input type="number" value={newTask.duration} onChange={e => setNewTask({...newTask, duration: e.target.value})} placeholder="Masalan: 60" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition" />
              </div>
              <textarea value={newTask.criteria} onChange={e => setNewTask({...newTask, criteria: e.target.value})} placeholder="AI Tekshirish Mantig'i (Kriteriya)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-indigo-300 font-mono text-xs outline-none focus:border-indigo-500" rows={2} />
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddTask(null)} className="flex-1 py-3 bg-white/5 text-slate-500 rounded-xl font-black uppercase text-[10px] hover:text-white transition">Yopish</button>
                <button onClick={() => handleAddTask(showAddTask)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] hover:bg-indigo-500 transition shadow-lg">Vazifani Saqlash</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 gap-6">
           <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
             <h3 className="text-white font-black text-[10px] uppercase tracking-widest mb-6 flex items-center gap-3">
               <i className="fas fa-history text-indigo-400"></i> Yaqinda topshirilgan vazifalar
             </h3>
             <div className="space-y-3">
               {results.slice(0, 10).map(r => (
                 <div key={r.id} className="flex justify-between items-center bg-white/2 p-5 rounded-2xl border border-white/5 hover:bg-white/5 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400 font-bold">
                        {r.userName?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{r.userName}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">{courses.find(c => c.id === r.courseId)?.title || "Kurs topilmadi"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className={`text-sm font-black ${r.adminGrade ? 'text-emerald-400' : 'text-amber-400'}`}>{r.adminGrade || r.grade}%</span>
                        <p className="text-[8px] text-slate-600 uppercase tracking-tighter">Sovereign Score</p>
                      </div>
                      <button onClick={() => {
                        const g = prompt("Ballni kiriting (0-100):", r.adminGrade ? r.adminGrade.toString() : r.grade.toString());
                        if (g !== null) {
                          const val = parseInt(g);
                          if (!isNaN(val) && val >= 0 && val <= 100) onGrade(r.id, val);
                          else alert("0 dan 100 gacha raqam kiriting!");
                        }
                      }} className="text-[9px] font-black uppercase bg-white/5 hover:bg-indigo-600 px-4 py-2 rounded-xl text-slate-400 hover:text-white transition border border-white/5">Baholash</button>
                    </div>
                 </div>
               ))}
               {results.length === 0 && <p className="text-center py-10 text-slate-600 italic">Hali vazifalar topshirilmagan.</p>}
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
