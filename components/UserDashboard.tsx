
import React, { useState } from 'react';
import { User, Course, EnrollmentRequest, CourseTask, TaskResult } from '../types.ts';
import TaskForm from './TaskForm.tsx';
import ResultView from './ResultView.tsx';
import QuizArena from './QuizArena.tsx';
import CourseChat from './CourseChat.tsx';

interface UserDashboardProps {
  user: User;
  courses: Course[];
  requests: EnrollmentRequest[];
  tasks: CourseTask[];
  onEnroll: (id: string) => void;
  onTaskSubmit: (res: TaskResult) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, courses, requests, tasks, onEnroll, onTaskSubmit }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<TaskResult | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'ranking' | 'quiz'>('courses');
  const [courseSection, setCourseSection] = useState<'tasks' | 'chat'>('tasks');
  const [showQuiz, setShowQuiz] = useState(false);

  const isEnrolled = (courseId: string) => user.enrolledCourses.includes(courseId);
  const courseTasks = tasks.filter(t => t.courseId === selectedCourse?.id);
  const currentTask = courseTasks.find(t => t.id === activeTaskId) || courseTasks[0];

  return (
    <div className="space-y-12 animate-fade-in">
      {!selectedCourse ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Salom, {user.firstName}! 👋</h2>
              <p className="text-slate-500 font-medium italic">Bugun yangi marralarni zabt etish vaqti keldi.</p>
            </div>
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
              <button onClick={() => setActiveTab('courses')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'courses' ? 'bg-white text-slate-900' : 'hover:text-white'}`}>Kurslar</button>
              <button onClick={() => setActiveTab('ranking')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'ranking' ? 'bg-white text-slate-900' : 'hover:text-white'}`}>Reyting</button>
              <button onClick={() => setActiveTab('quiz')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'quiz' ? 'bg-white text-slate-900' : 'hover:text-white'}`}>Quiz Arena</button>
            </div>
          </div>

          {activeTab === 'courses' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map(course => (
                <div key={course.id} className="aether-card-dark p-8 rounded-[2.5rem] group hover:border-indigo-500/40 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><i className="fas fa-laptop-code text-8xl"></i></div>
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 mb-8 border border-white/5"><i className="fas fa-terminal"></i></div>
                  <h3 className="text-2xl font-black text-white mb-3 group-hover:text-indigo-400 transition">{course.title}</h3>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">{course.subject}</div>
                  {isEnrolled(course.id) ? (
                    <button onClick={() => { setSelectedCourse(course); setCourseSection('tasks'); }} className="w-full py-4 bg-white/5 text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-white/5 hover:bg-indigo-600 transition shadow-xl">Kursga Kirish</button>
                  ) : (
                    <button onClick={() => onEnroll(course.id)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-2xl">A'zo bo'lish</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ranking' && (
            <div className="max-w-3xl mx-auto space-y-4">
               <h3 className="text-2xl font-black text-white text-center mb-8">Talabalar Reytingi</h3>
               <div className="bg-white/5 p-4 rounded-[2.5rem] border border-white/5 text-center text-slate-500 py-10">
                 Reyting tez kunda yangilanadi...
               </div>
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="flex flex-col items-center justify-center py-20 bg-indigo-600/10 rounded-[4rem] border border-indigo-500/20 text-center">
              <i className="fas fa-brain text-6xl text-indigo-500 mb-8"></i>
              <h3 className="text-3xl font-black text-white mb-4">Quiz Arena</h3>
              <p className="text-slate-400 max-w-md mb-10">AI tomonidan yaratilgan testlar orqali o'z bilimlaringizni sinab ko'ring va XP to'plang!</p>
              <button onClick={() => setShowQuiz(true)} className="bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl shadow-indigo-600/20 hover:scale-105 transition">Testni Boshlash</button>
              {showQuiz && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
                   <QuizArena subject="Fullstack Development" onComplete={(s) => { alert(`Siz ${s} ta to'g'ri javob berdingiz!`); setShowQuiz(false); }} onClose={() => setShowQuiz(false)} />
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <button onClick={() => { setSelectedCourse(null); setLatestResult(null); setActiveTaskId(null); }} className="text-slate-500 hover:text-white font-black text-xs uppercase tracking-widest flex items-center gap-3 transition">
              <i className="fas fa-arrow-left"></i> Kurslarga Qaytish
            </button>
            
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
              <button onClick={() => setCourseSection('tasks')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${courseSection === 'tasks' ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-white'}`}>Darslar</button>
              <button onClick={() => setCourseSection('chat')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${courseSection === 'chat' ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-white'}`}>Guruh Chati</button>
            </div>

            <div className="text-right hidden md:block">
              <h2 className="text-2xl font-black text-white leading-none mb-1">{selectedCourse.title}</h2>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{selectedCourse.subject}</span>
            </div>
          </div>

          {courseSection === 'tasks' ? (
            !latestResult ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Vazifalar Ro'yxati</h3>
                  <div className="space-y-4">
                    {courseTasks.map(task => {
                      const isActive = activeTaskId === task.id;
                      const hasTimer = task.timerEnd && task.timerEnd > Date.now();
                      return (
                        <div 
                          key={task.id} 
                          onClick={() => setActiveTaskId(task.id)}
                          className={`bg-white/5 p-6 rounded-3xl border transition cursor-pointer group ${isActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/5 hover:border-indigo-500/30'}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-white uppercase text-xs tracking-wider">Vazifa {task.order}: {task.title}</h4>
                            {hasTimer && <span className="text-[9px] font-black bg-rose-500 text-white px-2 py-0.5 rounded animate-pulse">LIVE</span>}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">{task.description}</p>
                        </div>
                      );
                    })}
                    {courseTasks.length === 0 && (
                      <div className="p-10 text-center bg-white/5 rounded-3xl border-2 border-dashed border-white/5 text-slate-600 italic">Hali ushbu kurs uchun vazifalar belgilanmagan.</div>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <div className="sticky top-24">
                    <TaskForm 
                      userName={user.firstName} 
                      courseTitle={selectedCourse.title}
                      courseSubject={selectedCourse.subject}
                      activeTask={currentTask}
                      onResult={(res) => {
                        const fullRes = { ...res, courseId: selectedCourse.id, userId: user.id };
                        onTaskSubmit(fullRes);
                        setLatestResult(fullRes);
                      }} 
                    />
                  </div>
                </div>
              </div>
            ) : (
              <ResultView result={latestResult} onReset={() => setLatestResult(null)} />
            )
          ) : (
            <CourseChat user={user} courseId={selectedCourse.id} />
          )}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
