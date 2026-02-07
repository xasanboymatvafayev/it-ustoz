
import React, { useState, useMemo } from 'react';
import { User, Course, CourseTask, TaskResult, EnrollmentRequest, Subject } from '../types';
import TaskForm from './TaskForm';
import CourseChat from './CourseChat';
import { checkTask } from '../services/geminiService';
import { translations, Lang } from '../translations';

interface UserDashboardProps {
  lang: Lang;
  user: User;
  courses: Course[];
  tasks: CourseTask[];
  results: TaskResult[];
  requests: EnrollmentRequest[];
  onEnroll: (courseId: string) => Promise<void>;
  onTaskSubmit: (result: TaskResult) => Promise<void>;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ lang, user, courses, tasks, results, requests, onEnroll, onTaskSubmit }) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'tasks' | 'ranking'>('overview');
  const [isJoiningModalOpen, setIsJoiningModalOpen] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [selectedTask, setSelectedTask] = useState<CourseTask | null>(null);
  const [activeChatCourseId, setActiveChatCourseId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myCourses = useMemo(() => courses.filter(c => (user.enrolledCourses || []).includes(c.id)), [courses, user.enrolledCourses]);
  const myTasks = useMemo(() => tasks.filter(t => (user.enrolledCourses || []).includes(t.courseId)), [tasks, user.enrolledCourses]);
  const userResults = useMemo(() => results.filter(r => r.userId === user.id), [results, user.id]);

  const handleJoinCourse = async () => {
    if (!secretKey.trim()) return;
    const course = courses.find(c => c.secretKey === secretKey.trim());
    if (!course) return alert("Secret Key invalid!");
    await onEnroll(course.id);
    setIsJoiningModalOpen(false);
    setSecretKey('');
  };

  const handleTaskSubmit = async (task: CourseTask, answer: string) => {
    setIsSubmitting(true);
    try {
      const subject = courses.find(c => c.id === task.courseId)?.subject || Subject.AI_DATA;
      const aiRes = await checkTask(user.firstName, subject, answer, task.title, task.validationCriteria);
      const result: TaskResult = {
        id: `res_${Date.now()}`, taskId: task.id, userId: user.id, userName: user.firstName, studentAnswer: answer, ...aiRes, adminGrade: null, timestamp: Date.now(), courseId: task.courseId
      };
      await onTaskSubmit(result);
      setSelectedTask(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-12 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
          <NavBtn active={activeTab === 'overview'} label={t.overview} onClick={() => setActiveTab('overview')} icon="fa-chart-pie" />
          <NavBtn active={activeTab === 'courses'} label={t.myAcademy} onClick={() => setActiveTab('courses')} icon="fa-book-open" />
          <NavBtn active={activeTab === 'tasks'} label={t.artifacts} onClick={() => setActiveTab('tasks')} icon="fa-shield-halved" />
          <NavBtn active={activeTab === 'ranking'} label={t.globalRankTab} onClick={() => setActiveTab('ranking')} icon="fa-crown" />
        </div>
        {activeTab === 'courses' && (
          <button onClick={() => setIsJoiningModalOpen(true)} className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3">
            <i className="fas fa-plus"></i> {t.joinCourse}
          </button>
        )}
      </div>

      <main className="space-y-12">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard label={t.activeModules} val={myCourses.length} icon="fa-cubes" color="text-indigo-400" />
            <StatCard label={t.totalArtifacts} val={userResults.length} icon="fa-check-double" color="text-emerald-400" />
            <StatCard label={t.neuralScore} val="2,840" icon="fa-brain" color="text-purple-400" />
            <StatCard label={t.globalRank} val="#14" icon="fa-globe" color="text-amber-400" />
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {myCourses.length === 0 ? (
              <div className="col-span-full py-32 text-center aether-card-dark rounded-[3.5rem] border border-dashed border-white/10">
                <i className="fas fa-ghost text-5xl text-slate-700 mb-6"></i>
                <h3 className="text-xl font-bold text-slate-500">{t.noCourses}</h3>
                <p className="text-slate-600 text-sm mt-2">{t.joinInstructions}</p>
              </div>
            ) : myCourses.map(c => (
              <div key={c.id} className="aether-card-dark p-10 rounded-[3rem] border border-white/5 group hover:border-indigo-500/30 transition-all relative flex flex-col h-full shadow-2xl">
                <h4 className="text-2xl font-black text-white mb-4 group-hover:text-indigo-400">{c.title}</h4>
                <p className="text-slate-500 text-sm mb-8 italic line-clamp-3 flex-grow">{c.description}</p>
                <div className="pt-6 border-t border-white/5 space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-slate-600">{t.techStack}</span><span className="text-indigo-400">{c.subject}</span></div>
                  <button onClick={() => setActiveChatCourseId(c.id)} className="w-full py-4 mt-4 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                    {t.openHub}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 gap-6">
            {myTasks.map(t_task => {
              const res = userResults.find(r => r.taskId === t_task.id);
              return (
                <div key={t_task.id} className="aether-card-dark p-8 rounded-[2.5rem] border border-white/5 flex justify-between items-center group">
                  <h5 className="text-xl font-black text-white group-hover:text-indigo-400">{t_task.title}</h5>
                  {res ? <span className="text-emerald-400 font-black">{res.grade}%</span> : <button onClick={() => setSelectedTask(t_task)} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">{t.initiateTask}</button>}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {isJoiningModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 p-12 rounded-[4rem] shadow-2xl">
            <h3 className="text-4xl font-black text-white mb-10 tracking-tighter">{t.joinCourse}</h3>
            <input maxLength={18} value={secretKey} onChange={e => setSecretKey(e.target.value.toUpperCase())} className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-2xl text-white font-mono text-center tracking-widest mb-10 outline-none" placeholder="••••-••••-••••" />
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setIsJoiningModalOpen(false)} className="py-5 bg-white/5 text-slate-400 rounded-xl font-black text-[10px] uppercase">{t.cancel}</button>
              <button onClick={handleJoinCourse} className="py-5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase shadow-xl">{t.dashboard}</button>
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#0F172A] border border-white/10 p-16 rounded-[4.5rem] shadow-2xl">
            <div className="flex justify-between items-start mb-12">
              <h3 className="text-5xl font-black text-white tracking-tighter">{selectedTask.title}</h3>
              <button onClick={() => setSelectedTask(null)} className="w-12 h-12 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-colors"><i className="fas fa-times"></i></button>
            </div>
            <TaskForm lang={lang} userName={user.firstName} courseTitle={selectedTask.title} courseSubject={courses.find(c => c.id === selectedTask.courseId)?.subject || Subject.AI_DATA} onResult={(res) => handleTaskSubmit(selectedTask, res.studentAnswer)} activeTask={selectedTask} />
          </div>
        </div>
      )}
    </div>
  );
};

const NavBtn = ({ active, label, onClick, icon }: any) => (
  <button onClick={onClick} className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${active ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>
    <i className={`fas ${icon}`}></i> {label}
  </button>
);

const StatCard = ({ label, val, icon, color }: any) => (
  <div className="aether-card-dark p-10 rounded-[3rem] border border-white/5 group relative overflow-hidden shadow-2xl">
    <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl mb-6 ${color}`}><i className={`fas ${icon}`}></i></div>
    <div className="text-5xl font-black text-white mb-2 tracking-tighter">{val}</div>
    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</div>
  </div>
);

export default UserDashboard;
