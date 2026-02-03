
/**
 * @file UserDashboard.tsx
 * @description O'quvchining asosiy ish stoli.
 * Kurslar, vazifalar va shaxsiy rivojlanish ko'rsatkichlarini interaktiv boshqaradi.
 */

import React, { useState, useMemo } from 'react';
import { User, Course, CourseTask, TaskResult, EnrollmentRequest, Subject } from '../types';
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
  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'tasks' | 'ranking'>('overview');
  const [isJoiningModalOpen, setIsJoiningModalOpen] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [selectedTask, setSelectedTask] = useState<CourseTask | null>(null);
  const [activeChatCourseId, setActiveChatCourseId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- DATA FILTERING ---
  const myCourses = useMemo(() => 
    courses.filter(c => (user.enrolledCourses || []).includes(c.id)), 
  [courses, user.enrolledCourses]);

  const myTasks = useMemo(() => 
    tasks.filter(t => (user.enrolledCourses || []).includes(t.courseId)),
  [tasks, user.enrolledCourses]);

  const userResults = useMemo(() => 
    results.filter(r => r.userId === user.id),
  [results, user.id]);

  /**
   * Kursga yangi qo'shilish mantiqi
   */
  const handleJoinCourse = async () => {
    if (!secretKey.trim()) return;
    
    const course = courses.find(c => c.secretKey === secretKey.trim());
    if (!course) return alert("Kechirasiz, maxfiy kalit (Secret Key) noto'g'ri!");
    
    if ((user.enrolledCourses || []).includes(course.id)) {
      return alert("Siz allaqachon ushbu kursga a'zo bo'lgansiz.");
    }
    
    const hasPending = requests.find(r => r.userId === user.id && r.courseId === course.id && r.status === 'pending');
    if (hasPending) return alert("Sizning so'rovingiz ko'rib chiqilmoqda...");

    await onEnroll(course.id);
    setIsJoiningModalOpen(false);
    setSecretKey('');
  };

  /**
   * Vazifani AI Mentor tahlili bilan yuborish
   */
  const handleTaskSubmit = async (task: CourseTask, answer: string) => {
    setIsSubmitting(true);
    try {
      // Use Subject.AI_DATA as a fallback to ensure SubjectType consistency
      const subject = courses.find(c => c.id === task.courseId)?.subject || Subject.AI_DATA;
      const aiRes = await checkTask(user.firstName, subject, answer, task.title, task.validationCriteria);
      
      const result: TaskResult = {
        id: `res_${Math.random().toString(36).substr(2, 9)}`,
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
    } catch (err) {
      console.error("Vazifa yuborish xatosi:", err);
      alert("Xatolik yuz berdi. Iltimos qayta urining.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-12 animate-fade-in pb-20">
      
      {/* --- DASHBOARD NAVIGATION --- */}
      <div className="flex items-center justify-between">
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
          <NavBtn active={activeTab === 'overview'} label="Overview" onClick={() => { setActiveTab('overview'); setActiveChatCourseId(null); }} icon="fa-chart-pie" />
          <NavBtn active={activeTab === 'courses'} label="My Academy" onClick={() => setActiveTab('courses')} icon="fa-book-open" />
          <NavBtn active={activeTab === 'tasks'} label="Artifacts" onClick={() => { setActiveTab('tasks'); setActiveChatCourseId(null); }} icon="fa-shield-halved" />
          <NavBtn active={activeTab === 'ranking'} label="Global Rank" onClick={() => { setActiveTab('ranking'); setActiveChatCourseId(null); }} icon="fa-crown" />
        </div>
        
        {activeTab === 'courses' && !activeChatCourseId && (
          <button 
            onClick={() => setIsJoiningModalOpen(true)}
            className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center gap-3"
          >
            <i className="fas fa-plus"></i> Join New Course
          </button>
        )}
      </div>

      {/* --- MAIN CONTENT AREAS --- */}
      <main className="space-y-12">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            {/* Real-time Stat Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard label="Active Modules" val={myCourses.length} icon="fa-cubes" color="text-indigo-400" trend="+2 so'nggi haftada" />
              <StatCard label="Total Artifacts" val={userResults.length} icon="fa-check-double" color="text-emerald-400" trend="100% muvaffaqiyat" />
              <StatCard label="Neural Score" val="2,840" icon="fa-brain" color="text-purple-400" trend="Tier: Gold" />
              <StatCard label="Global Rank" val="#14" icon="fa-globe" color="text-amber-400" trend="O'zbekiston bo'yicha" />
            </div>

            {/* Learning Path Visualizer */}
            <div className="aether-card-dark p-10 rounded-[3.5rem] border border-white/5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                 <i className="fas fa-route text-[15rem] text-white"></i>
               </div>
               <h3 className="text-2xl font-black text-white mb-8 tracking-tighter">Your Sovereign Path</h3>
               <div className="flex items-center gap-6 overflow-x-auto pb-4 custom-scrollbar">
                 {myCourses.map((c, i) => (
                   <div key={c.id} className="min-w-[280px] bg-white/5 p-6 rounded-[2rem] border border-white/10 hover:border-indigo-500/40 transition-all relative">
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-black text-white">{i + 1}</div>
                      <h4 className="font-black text-white mb-2 truncate">{c.title}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">{c.subject}</p>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 animate-pulse" style={{ width: '45%' }}></div>
                      </div>
                   </div>
                 ))}
                 <div className="min-w-[150px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] text-slate-600 hover:text-indigo-400 transition-colors cursor-pointer">
                    <i className="fas fa-plus-circle text-2xl mb-2"></i>
                    <span className="text-[9px] font-black uppercase">Add Module</span>
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY ACADEMY (COURSES) */}
        {activeTab === 'courses' && (
          <div className="space-y-10">
            {!activeChatCourseId ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {myCourses.length === 0 ? (
                  <div className="col-span-full py-32 text-center aether-card-dark rounded-[3.5rem] border border-dashed border-white/10">
                    <i className="fas fa-ghost text-5xl text-slate-700 mb-6"></i>
                    <h3 className="text-xl font-bold text-slate-500">Hali hech qanday kursga a'zo emassiz</h3>
                    <p className="text-slate-600 text-sm mt-2">Boshlash uchun "Join New Course" tugmasini bosing.</p>
                  </div>
                ) : myCourses.map(c => (
                  <div key={c.id} className="aether-card-dark p-10 rounded-[3rem] border border-white/5 group hover:border-indigo-500/30 transition-all duration-500 relative flex flex-col h-full shadow-2xl">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-2xl text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                        <i className={`fas ${c.subject.includes('Frontend') ? 'fa-code' : 'fa-brain'}`}></i>
                      </div>
                      <div className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest border border-white/5">
                        Module ID: {c.id.slice(0, 5)}
                      </div>
                    </div>
                    
                    <h4 className="text-2xl font-black text-white mb-4 group-hover:text-indigo-400 transition-colors">{c.title}</h4>
                    <p className="text-slate-500 text-sm mb-8 italic line-clamp-3 leading-relaxed flex-grow">"{c.description}"</p>
                    
                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-600">Technology</span>
                        <span className="text-indigo-400">{c.subject}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-600">Access Key</span>
                        <span className="text-slate-400 font-mono">{c.secretKey.slice(0, 8)}...</span>
                      </div>
                      
                      <button 
                        onClick={() => setActiveChatCourseId(c.id)}
                        className="w-full py-4 mt-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all border border-indigo-500/20 shadow-xl"
                      >
                        <i className="fas fa-comments mr-2"></i> Open Neural Hub
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="animate-fade-in space-y-6">
                <button 
                  onClick={() => setActiveChatCourseId(null)} 
                  className="group px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-white/5 transition-all"
                >
                  <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Return to Academy
                </button>
                <CourseChat 
                  user={user} 
                  courseId={activeChatCourseId} 
                  courseTitle={courses.find(c => c.id === activeChatCourseId)?.title || 'Neural Module'} 
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ARTIFACTS (TASKS) */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 gap-6">
            {myTasks.length === 0 ? (
              <div className="py-40 text-center text-slate-700 italic font-medium">Siz a'zo bo'lgan kurslarda hali vazifalar mavjud emas.</div>
            ) : myTasks.map(t => {
              const res = userResults.find(r => r.taskId === t.id);
              const course = courses.find(c => c.id === t.courseId);
              
              return (
                <div key={t.id} className="aether-card-dark p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row justify-between items-center group hover:bg-white/[0.03] transition-all duration-500 relative overflow-hidden shadow-xl">
                  {res?.aiStatus === 'pass' && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  )}
                  
                  <div className="flex items-center gap-8 mb-6 md:mb-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-inner ${res ? (res.aiStatus === 'pass' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400') : 'bg-white/5 text-slate-500'}`}>
                      <i className={`fas ${res ? (res.aiStatus === 'pass' ? 'fa-check-circle' : 'fa-circle-exclamation') : 'fa-terminal'}`}></i>
                    </div>
                    <div>
                      <h5 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors">{t.title}</h5>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Module: {course?.title || 'Unknown'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    {res ? (
                      <div className="text-right">
                        <div className={`text-2xl font-black ${res.aiStatus === 'pass' ? 'text-emerald-400' : 'text-rose-400'} tracking-tighter`}>
                          {res.adminGrade ?? res.grade ?? 0}%
                        </div>
                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Sovereign Grade</div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setSelectedTask(t)} 
                        className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        Initiate Task
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* --- SOVEREIGN MODALS --- */}

      {/* Secret Key Modal */}
      {isJoiningModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full"></div>
            
            <h3 className="text-4xl font-black text-white mb-4 tracking-tighter">Neural Access</h3>
            <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium italic">"Ushbu modulga ulanish uchun 18-ta belgidan iborat Sovereign Key ni kiriting."</p>
            
            <input 
              maxLength={18}
              value={secretKey}
              onChange={e => setSecretKey(e.target.value.toUpperCase())}
              className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-2xl text-white font-mono text-center tracking-[0.3em] mb-10 focus:border-indigo-500 focus:bg-white/10 outline-none transition-all shadow-inner" 
              placeholder="••••-••••-••••"
              autoFocus
            />
            
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setIsJoiningModalOpen(false)} className="py-5 bg-white/5 text-slate-400 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={handleJoinCourse} className="py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all">Synchronize</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Initiation Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#0F172A] border border-white/10 p-16 rounded-[4.5rem] shadow-2xl animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none"><i className="fas fa-terminal text-[20rem] text-white"></i></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h3 className="text-5xl font-black text-white mb-4 tracking-tighter">{selectedTask.title}</h3>
                  <div className="flex items-center gap-4">
                    <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-500/30">Primary Objective</span>
                    <span className="text-slate-500 text-xs font-bold font-mono">ID: {selectedTask.id}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedTask(null)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 hover:text-white transition-colors"><i className="fas fa-times"></i></button>
              </div>

              <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/5 mb-12 shadow-inner">
                <p className="text-slate-300 text-xl font-medium leading-relaxed italic">"{selectedTask.description}"</p>
              </div>

              <TaskForm 
                userName={user.firstName}
                courseTitle={selectedTask.title}
                courseSubject={courses.find(c => c.id === selectedTask.courseId)?.subject || Subject.AI_DATA}
                onResult={(res) => handleTaskSubmit(selectedTask, res.studentAnswer)}
                activeTask={selectedTask}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Tab navigatsiya tugmasi
 */
const NavBtn = ({ active, label, onClick, icon }: any) => (
  <button 
    onClick={onClick} 
    className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-500 ${
      active 
        ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40' 
        : 'text-slate-500 hover:text-white'
    }`}
  >
    <i className={`fas ${icon} ${active ? 'animate-pulse' : ''}`}></i> 
    {label}
  </button>
);

/**
 * Statistika kartasi
 */
const StatCard = ({ label, val, icon, color, trend }: any) => (
  <div className="aether-card-dark p-10 rounded-[3rem] border border-white/5 group hover:border-indigo-500/30 transition-all duration-700 relative overflow-hidden shadow-2xl">
    <div className={`absolute top-0 right-0 p-8 opacity-5 text-6xl group-hover:scale-110 group-hover:opacity-10 transition-all duration-700 ${color}`}>
      <i className={`fas ${icon}`}></i>
    </div>
    
    <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl mb-6 shadow-inner ${color}`}>
      <i className={`fas ${icon}`}></i>
    </div>
    
    <div className="text-5xl font-black text-white mb-2 tracking-tighter">{val}</div>
    <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">{label}</div>
    
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
      <span className="text-[9px] font-black text-slate-500 uppercase">{trend}</span>
    </div>
  </div>
);

export default UserDashboard;
