
import React, { useState } from 'react';
import { User, Course, CourseTask, TaskResult, EnrollmentRequest } from '../types';
import TaskForm from './TaskForm';
import CourseChat from './CourseChat';
import { checkTask } from '../services/geminiService';

interface UserDashboardProps {
  user: User;
  courses: Course[];
  tasks: CourseTask[];
  results: TaskResult[];
  requests: EnrollmentRequest[];
  onEnroll: (courseId: string) => Promise<void>;
  onTaskSubmit: (result: TaskResult) => Promise<void>;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, courses, tasks, results, requests, onEnroll, onTaskSubmit }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'courses' | 'tasks' | 'profile'>('stats');
  const [joining, setJoining] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [selectedTask, setSelectedTask] = useState<CourseTask | null>(null);
  const [activeChatCourseId, setActiveChatCourseId] = useState<string | null>(null);

  const myCourses = courses.filter(c => user.enrolledCourses.includes(c.id));
  const myTasks = tasks.filter(t => user.enrolledCourses.includes(t.courseId));

  const handleJoinCourse = async () => {
    const course = courses.find(c => c.secretKey === secretKey);
    if (!course) return alert("Secret Key xato!");
    if (user.enrolledCourses.includes(course.id)) return alert("Siz allaqachon bu kursdasiz!");
    
    await onEnroll(course.id);
    setJoining(false);
    setSecretKey('');
  };

  const handleTaskSubmit = async (task: CourseTask, answer: string) => {
    const aiRes = await checkTask(user.firstName, 'Frontend Development', answer, task.title, task.validationCriteria);
    const result: TaskResult = {
      id: Math.random().toString(36).substr(2, 9),
      taskId: task.id,
      userId: user.id,
      userName: user.firstName,
      studentAnswer: answer,
      ...aiRes,
      adminGrade: null,
      timestamp: Date.now(),
      courseId: task.courseId
    };
    await onTaskSubmit(result);
    setSelectedTask(null);
    alert("Vazifa yuborildi!");
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Navigation */}
      <div className="flex bg-white/5 p-2 rounded-2xl border border-white/5 backdrop-blur-md self-start">
        <NavBtn active={activeTab === 'stats'} label="Dashboard" onClick={() => { setActiveTab('stats'); setActiveChatCourseId(null); }} icon="fa-chart-line" />
        <NavBtn active={activeTab === 'courses'} label="Kurslar" onClick={() => setActiveTab('courses')} icon="fa-layer-group" />
        <NavBtn active={activeTab === 'tasks'} label="Vazifalar" onClick={() => { setActiveTab('tasks'); setActiveChatCourseId(null); }} icon="fa-tasks" />
        <NavBtn active={activeTab === 'profile'} label="Profil" onClick={() => { setActiveTab('profile'); setActiveChatCourseId(null); }} icon="fa-user-cog" />
      </div>

      <main className="animate-fade-in">
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Faol Kurslar" val={myCourses.length} icon="fa-book" color="text-indigo-400" />
            <StatCard label="Bajarilgan Vazifalar" val={results.filter(r => r.userId === user.id).length} icon="fa-check-double" color="text-emerald-400" />
            <StatCard label="AI Reytingi" val="B+" icon="fa-brain" color="text-purple-400" />
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-6">
            {!activeChatCourseId ? (
              <>
                <button onClick={() => setJoining(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20">
                  + Kursga qo'shilish
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myCourses.map(c => (
                    <div key={c.id} className="aether-card-dark p-6 rounded-3xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                      <h4 className="text-xl font-bold text-white mb-2">{c.title}</h4>
                      <p className="text-slate-500 text-xs mb-6 italic line-clamp-2">{c.description}</p>
                      <div className="flex flex-col gap-3">
                         <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase mb-2">
                           <span>{c.subject}</span>
                           <span className="text-indigo-400">Key: {c.secretKey.slice(0, 4)}...</span>
                         </div>
                         <button 
                           onClick={() => setActiveChatCourseId(c.id)}
                           className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5"
                         >
                           <i className="fas fa-comments mr-2"></i> Guruh Chati
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <button onClick={() => setActiveChatCourseId(null)} className="text-slate-400 hover:text-white transition text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                  <i className="fas fa-arrow-left"></i> Kurslarga qaytish
                </button>
                <CourseChat 
                  user={user} 
                  courseId={activeChatCourseId} 
                  courseTitle={courses.find(c => c.id === activeChatCourseId)?.title || 'Kurs'} 
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {myTasks.length === 0 ? (
              <div className="text-center py-20 text-slate-600 italic">Hali vazifalar yo'q.</div>
            ) : myTasks.map(t => {
              const res = results.find(r => r.taskId === t.id && r.userId === user.id);
              return (
                <div key={t.id} className="bg-white/5 border border-white/5 p-6 rounded-3xl flex justify-between items-center group hover:bg-white/10 transition">
                  <div>
                    <h5 className="font-bold text-white">{t.title}</h5>
                    <p className="text-xs text-slate-500">{courses.find(c => c.id === t.courseId)?.title}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {res ? (
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase ${res.aiStatus === 'pass' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {res.aiStatus === 'pass' ? 'Bajargan' : 'Xatolar bor'}
                      </span>
                    ) : (
                      <button onClick={() => setSelectedTask(t)} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 transition">Kirish</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-md bg-white/5 border border-white/5 p-8 rounded-[2.5rem]">
            <h3 className="text-xl font-bold text-white mb-6">Profil Sozlamalari</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <input type="email" defaultValue={user.email} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Yangi Parol</label>
                <input type="password" placeholder="••••••••" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none" />
              </div>
              <button className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest mt-4 shadow-xl shadow-indigo-600/20 hover:bg-indigo-700">O'zgarishlarni saqlash</button>
            </div>
          </div>
        )}
      </main>

      {/* Secret Key Modal */}
      {joining && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-slate-900 border border-white/10 p-10 rounded-[3rem] shadow-2xl animate-fade-in">
            <h3 className="text-2xl font-black text-white mb-4">Secret Key</h3>
            <p className="text-slate-500 text-xs mb-6">Kursga ulanish uchun 18 talik maxfiy kodni kiriting.</p>
            <input 
              maxLength={18}
              value={secretKey}
              onChange={e => setSecretKey(e.target.value.toUpperCase())}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white font-mono text-center tracking-widest mb-6 focus:border-indigo-500 outline-none" 
              placeholder="CODE-HERE-123"
            />
            <div className="flex gap-3">
              <button onClick={() => setJoining(false)} className="flex-1 py-4 bg-white/5 text-slate-500 rounded-xl font-bold text-xs">Bekor qilish</button>
              <button onClick={handleJoinCourse} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold text-xs">Qo'shilish</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Submission Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 p-12 rounded-[3.5rem] shadow-2xl animate-fade-in">
            <h3 className="text-3xl font-black text-white mb-2">{selectedTask.title}</h3>
            <p className="text-slate-400 mb-8 italic">"{selectedTask.description}"</p>
            <TaskForm 
              userName={user.firstName}
              courseTitle={selectedTask.title}
              courseSubject={courses.find(c => c.id === selectedTask.courseId)?.subject || 'Frontend Development'}
              onResult={(res) => handleTaskSubmit(selectedTask, res.solution)}
              activeTask={selectedTask}
            />
            <button onClick={() => setSelectedTask(null)} className="mt-6 w-full py-4 bg-white/5 text-slate-500 rounded-2xl font-bold hover:text-white transition-all">Yopish</button>
          </div>
        </div>
      )}
    </div>
  );
};

const NavBtn = ({ active, label, onClick, icon }: any) => (
  <button onClick={onClick} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
    <i className={`fas ${icon}`}></i> {label}
  </button>
);

const StatCard = ({ label, val, icon, color }: any) => (
  <div className="bg-white/5 border border-white/5 p-8 rounded-3xl group hover:border-white/10 transition">
    <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl mb-4 ${color}`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <div className="text-4xl font-black text-white mb-1 tracking-tighter">{val}</div>
    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
  </div>
);

export default UserDashboard;
