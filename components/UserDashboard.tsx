
import React, { useState, useMemo } from 'react';
import { User, Course, CourseTask, TaskResult, EnrollmentRequest } from '../types.ts';
import TaskForm from './TaskForm.tsx';
import ResultView from './ResultView.tsx';

interface UserDashboardProps {
  user: User;
  courses: Course[];
  tasks: CourseTask[];
  onEnroll: (id: string) => void;
  onTaskSubmit: (res: TaskResult) => void;
  requests: EnrollmentRequest[];
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, courses, tasks, onEnroll, onTaskSubmit, requests }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [latestResult, setLatestResult] = useState<TaskResult | null>(null);

  const myCourses = useMemo(() => courses.filter(c => (user.enrolledCourses || []).includes(c.id)), [courses, user.enrolledCourses]);
  const pendingRequests = useMemo(() => requests.filter(r => r.userId === user.id && r.status === 'pending'), [requests, user.id]);

  // Handle case where user has no courses yet
  const mainCourse = myCourses.length > 0 ? myCourses[0] : null;

  return (
    <div className="space-y-12 animate-fade-in max-w-7xl mx-auto">
      {!selectedCourse ? (
        <div className="space-y-12">
          {/* Pro Header & Stats */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="space-y-2">
              <h1 className="text-6xl font-black text-white tracking-tighter">
                Salom, <span className="text-indigo-500">{user.firstName}!</span>
              </h1>
              <p className="text-slate-400 font-medium text-lg flex items-center gap-3">
                <i className="fas fa-sparkles text-amber-400"></i>
                Sizda bugun <span className="text-white font-black">{tasks.length} ta topshiriq</span> mavjud.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
               <StatBox label="O'rtacha Ball" val="84" icon="fa-award" color="text-emerald-400" />
               <StatBox label="Tajriba (XP)" val={user.xp?.toString() || "1.2k"} icon="fa-bolt" color="text-indigo-400" />
               <StatBox label="Kurslarim" val={myCourses.length.toString()} icon="fa-book" color="text-purple-400" />
            </div>
          </div>

          {/* Hero Banner for active course */}
          {mainCourse ? (
            <div className="relative p-12 rounded-[3.5rem] bg-indigo-600 overflow-hidden shadow-2xl shadow-indigo-600/30 group cursor-pointer transition-all duration-500 hover:scale-[1.01]" onClick={() => setSelectedCourse(mainCourse)}>
               <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 group-hover:scale-125 transition-transform duration-1000">
                 <i className="fas fa-rocket text-[15rem] text-white"></i>
               </div>
               <div className="relative z-10 max-w-2xl">
                 <div className="flex items-center gap-3 mb-6">
                    <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest">Ayni paytda o'qilmoqda</span>
                    <span className="px-4 py-1.5 bg-black/20 backdrop-blur-md rounded-full text-[10px] font-black text-indigo-100 uppercase tracking-widest">Junior Dev</span>
                 </div>
                 <h2 className="text-4xl font-black text-white mb-4 tracking-tight">{mainCourse.title}</h2>
                 <p className="text-indigo-100/80 mb-10 font-medium text-lg leading-relaxed">
                   "{mainCourse.description.substring(0, 150)}..."
                 </p>
                 <button className="flex items-center gap-4 px-10 py-5 bg-white text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl group-hover:gap-6 transition-all">
                   Darsni davom ettirish <i className="fas fa-arrow-right"></i>
                 </button>
               </div>
            </div>
          ) : (
            <div className="p-12 rounded-[3.5rem] border-4 border-dashed border-white/5 bg-white/2 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-indigo-600/20 rounded-3xl flex items-center justify-center text-indigo-400 text-3xl">
                <i className="fas fa-plus"></i>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white mb-2">Hali kurslarga a'zo emassiz</h3>
                <p className="text-slate-500 max-w-sm">O'zingizga mos yo'nalishni tanlang va bilimingizni AI bilan oshiring.</p>
              </div>
            </div>
          )}

          {/* Courses Grid with modern glass effect */}
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white flex items-center gap-4">
                <i className="fas fa-compass text-indigo-500"></i> Kategoriya: <span className="text-slate-500">Barchasi</span>
              </h3>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white"><i className="fas fa-filter"></i></button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {courses.map(course => {
                const isEnrolled = (user.enrolledCourses || []).includes(course.id);
                const isPending = pendingRequests.some(r => r.courseId === course.id);
                
                return (
                  <div key={course.id} className="aether-card-dark p-8 rounded-[2.8rem] border border-white/5 hover:border-indigo-500/40 transition-all duration-500 group relative flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                      <div className="px-3 py-1 bg-indigo-600/20 rounded-lg text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">{course.subject}</div>
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition">
                        <i className={`fas ${isEnrolled ? 'fa-check-circle text-emerald-500' : isPending ? 'fa-hourglass-half text-amber-500' : 'fa-plus'}`}></i>
                      </div>
                    </div>
                    
                    <h4 className="text-2xl font-black text-white mb-4 group-hover:text-indigo-500 transition-colors">{course.title}</h4>
                    <p className="text-slate-500 text-sm mb-8 flex-grow leading-relaxed italic">"{course.description}"</p>
                    
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-8">
                      <span className="flex items-center gap-1"><i className="fas fa-user-tie"></i> {course.teacher}</span>
                      <span className="flex items-center gap-1"><i className="fas fa-clock"></i> 24 Dars</span>
                    </div>

                    {isEnrolled ? (
                      <button onClick={() => setSelectedCourse(course)} className="w-full py-4 bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-lg">Darsga Kirish</button>
                    ) : isPending ? (
                      <button disabled className="w-full py-4 bg-slate-800 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed">Tasdiqlanishda...</button>
                    ) : (
                      <button onClick={() => onEnroll(course.id)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/10">A'zo bo'lish</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12 animate-fade-in">
          <div className="flex items-center justify-between">
            <button onClick={() => { setSelectedCourse(null); setLatestResult(null); }} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all rounded-2xl border border-white/5">
              <i className="fas fa-arrow-left"></i> Kurslar ro'yxati
            </button>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Sovereign AI Active</span>
            </div>
          </div>
          
          <div className="aether-card-dark p-12 rounded-[3.5rem] border border-white/5 bg-gradient-to-br from-indigo-900/10 to-transparent">
             <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
               <div>
                 <h2 className="text-5xl font-black text-white mb-4 tracking-tighter">{selectedCourse.title}</h2>
                 <p className="text-slate-400 max-w-2xl leading-relaxed text-lg italic">"{selectedCourse.description}"</p>
               </div>
               <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex flex-col items-center justify-center text-white shadow-2xl">
                 <span className="text-3xl font-black">2%</span>
                 <span className="text-[8px] font-black uppercase">Progress</span>
               </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-3">
              {!latestResult ? (
                <TaskForm 
                  userName={user.firstName} 
                  courseTitle={selectedCourse.title} 
                  courseSubject={selectedCourse.subject} 
                  onResult={(res) => {
                    const fullRes = { ...res, userId: user.id, courseId: selectedCourse.id };
                    onTaskSubmit(fullRes);
                    setLatestResult(fullRes);
                  }}
                />
              ) : (
                <ResultView result={latestResult} onReset={() => setLatestResult(null)} />
              )}
            </div>

            <div className="space-y-8">
              <div className="aether-card-dark p-8 rounded-[2.5rem] border border-white/5">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6">Mavzular</h4>
                <div className="space-y-4">
                  {tasks.filter(t => t.courseId === selectedCourse.id).map((t, i) => (
                    <div key={t.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 opacity-50 cursor-not-allowed">
                       <span className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center text-[10px] font-bold">{i+1}</span>
                       <span className="text-xs font-bold text-slate-300 truncate">{t.title}</span>
                    </div>
                  ))}
                  <div className="p-4 rounded-xl bg-indigo-600 text-white flex items-center gap-4 shadow-xl">
                    <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-[10px] font-black">AI</span>
                    <span className="text-xs font-black uppercase">Erkin Mashq</span>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-2xl">
                 <i className="fas fa-lightbulb text-3xl mb-4 text-amber-300"></i>
                 <h5 className="font-black text-sm uppercase tracking-widest mb-2">Mentor Maslahati</h5>
                 <p className="text-xs text-indigo-100/80 leading-relaxed italic">"Har kuni kamida bitta topshiriqni AI bilan tahlil qiling. Bu sizning mantiqiy fikrlashingizni 2 barobar tezlashtiradi."</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatBox = ({ label, val, icon, color }: any) => (
  <div className="aether-card-dark px-10 py-6 rounded-3xl border border-white/5 min-w-[160px] flex items-center gap-6 group transition-all duration-300 hover:border-white/10">
    <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl transition-all duration-300 group-hover:scale-110 ${color}`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <div>
      <div className={`text-3xl font-black mb-0.5 tracking-tighter ${color}`}>{val}</div>
      <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{label}</div>
    </div>
  </div>
);

export default UserDashboard;
