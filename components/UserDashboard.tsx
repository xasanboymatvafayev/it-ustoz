
import React, { useState } from 'react';
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

  const myCourses = courses.filter(c => user.enrolledCourses.includes(c.id));
  const pendingRequests = requests.filter(r => r.userId === user.id && r.status === 'pending');

  return (
    <div className="space-y-12 animate-fade-in">
      {!selectedCourse ? (
        <div className="space-y-12">
          {/* Header & Stats */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div>
              <h1 className="text-5xl font-black text-white tracking-tighter mb-3">Xush kelibsiz, {user.firstName}!</h1>
              <p className="text-slate-500 font-medium">Sizda bugun uchun <span className="text-indigo-400 font-black">{tasks.length} ta yangi topshiriq</span> mavjud.</p>
            </div>
            
            <div className="flex gap-4">
               <StatBox label="O'rtacha Ball" val="84" icon="fa-award" color="text-emerald-400" />
               <StatBox label="XP Darajasi" val="1.4k" icon="fa-bolt" color="text-indigo-400" />
               <StatBox label="Kurslar" val={myCourses.length.toString()} icon="fa-book" color="text-purple-400" />
            </div>
          </div>

          {/* Continue Learning Banner */}
          {myCourses.length > 0 && (
            <div className="relative p-10 rounded-[3rem] bg-indigo-600 overflow-hidden shadow-2xl shadow-indigo-600/20 group cursor-pointer" onClick={() => setSelectedCourse(myCourses[0])}>
               <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                 <i className="fas fa-graduation-cap text-[12rem] text-white"></i>
               </div>
               <div className="relative z-10 max-w-xl">
                 <span className="px-3 py-1 bg-white/20 rounded-full text-[9px] font-black text-white uppercase tracking-widest mb-6 inline-block">Davom ettirish</span>
                 <h2 className="text-3xl font-black text-white mb-4">{myCourses[0].title}</h2>
                 <p className="text-indigo-100/70 mb-8 font-medium italic">"Ushbu kursni tamomlashga juda oz qoldi. Kodingizni mukammal darajaga olib chiqing!"</p>
                 <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Darsga Kirish <i className="fas fa-arrow-right ml-2"></i></button>
               </div>
            </div>
          )}

          {/* Courses Grid */}
          <div className="space-y-8">
            <h3 className="text-xl font-black text-white flex items-center gap-3">
              <i className="fas fa-th-large text-indigo-500"></i> Barcha Kurslar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {courses.map(course => {
                const isEnrolled = user.enrolledCourses.includes(course.id);
                const isPending = pendingRequests.some(r => r.courseId === course.id);
                
                return (
                  <div key={course.id} className="aether-card-dark p-8 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/30 transition-all duration-500 group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">{course.subject}</div>
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition">
                        <i className={`fas ${isEnrolled ? 'fa-check' : 'fa-lock'}`}></i>
                      </div>
                    </div>
                    <h4 className="text-xl font-black text-white mb-4 group-hover:text-indigo-400 transition">{course.title}</h4>
                    <p className="text-slate-500 text-sm mb-8 line-clamp-2 leading-relaxed">{course.description}</p>
                    
                    {isEnrolled ? (
                      <button onClick={() => setSelectedCourse(course)} className="w-full py-4 bg-white/5 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition">Darsga Kirish</button>
                    ) : isPending ? (
                      <button disabled className="w-full py-4 bg-slate-800 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed">Kutilmoqda...</button>
                    ) : (
                      <button onClick={() => onEnroll(course.id)} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition">A'zo Bo'lish</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-fade-in">
          <div className="flex items-center justify-between">
            <button onClick={() => { setSelectedCourse(null); setLatestResult(null); }} className="text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition">
              <i className="fas fa-arrow-left"></i> Orqaga
            </button>
            <div className="px-6 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-full text-[9px] font-black text-indigo-400 uppercase tracking-widest">
              Sovereign Session Active
            </div>
          </div>
          
          <div className="aether-card-dark p-12 rounded-[3.5rem] border border-white/5">
             <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">{selectedCourse.title}</h2>
             <p className="text-slate-400 max-w-2xl leading-relaxed italic">"{selectedCourse.description}"</p>
          </div>

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
      )}
    </div>
  );
};

const StatBox = ({ label, val, icon, color }: any) => (
  <div className="aether-card-dark px-8 py-5 rounded-2xl border border-white/5 min-w-[140px]">
    <div className={`text-xl font-black mb-1 flex items-center gap-2 ${color}`}>
      <i className={`fas ${icon} text-xs opacity-50`}></i> {val}
    </div>
    <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{label}</div>
  </div>
);

export default UserDashboard;
