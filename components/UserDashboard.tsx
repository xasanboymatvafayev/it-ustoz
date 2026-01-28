
import React, { useState, useEffect } from 'react';
import { User, Course, EnrollmentRequest, CourseTask, TaskResult } from '../types';
import TaskForm from './TaskForm';
import ResultView from './ResultView';
import CourseChat from './CourseChat';

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
  const [latestResult, setLatestResult] = useState<TaskResult | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'chat'>('tasks');
  const [timeLeft, setTimeLeft] = useState<Record<string, number>>({});

  const isEnrolled = (courseId: string) => user.enrolledCourses.includes(courseId);
  const isPending = (courseId: string) => requests.some(r => r.courseId === courseId && r.userId === user.id && r.status === 'pending');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const newTimeLeft: Record<string, number> = {};
      tasks.forEach(task => {
        if (task.timerEnd && task.timerEnd > now) {
          newTimeLeft[task.id] = Math.max(0, Math.floor((task.timerEnd - now) / 1000));
        }
      });
      setTimeLeft(newTimeLeft);
    }, 1000);
    return () => clearInterval(timer);
  }, [tasks]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {!selectedCourse ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-500 mb-6 group-hover:scale-110 transition-transform">
                <i className="fas fa-code"></i>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">{course.title}</h3>
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">{course.subject}</div>
              <p className="text-slate-500 text-sm mb-6 line-clamp-2">{course.description}</p>
              
              {isEnrolled(course.id) ? (
                <button onClick={() => setSelectedCourse(course)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">Darsxonaga kirish</button>
              ) : isPending(course.id) ? (
                <button disabled className="w-full py-3 bg-slate-100 text-slate-400 rounded-xl font-bold text-sm">A'zolik kutilmoqda...</button>
              ) : (
                <button onClick={() => onEnroll(course.id)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-lg">Kursga yozilish</button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 gap-4 shadow-sm">
            <button onClick={() => { setSelectedCourse(null); setLatestResult(null); }} className="text-slate-400 hover:text-indigo-600 font-bold text-sm flex items-center gap-2"><i className="fas fa-chevron-left"></i> Orqaga</button>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('tasks')} className={`px-6 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'tasks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Topshiriqlar</button>
              <button onClick={() => setActiveTab('chat')} className={`px-6 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'chat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Guruh Chati</button>
            </div>
            <div className="text-right hidden md:block">
              <h2 className="text-lg font-black text-slate-800">{selectedCourse.title}</h2>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">{selectedCourse.subject}</p>
            </div>
          </div>

          {activeTab === 'tasks' ? (
            !latestResult ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Mavjud vazifalar</h3>
                  <div className="space-y-3">
                    {tasks.filter(t => t.courseId === selectedCourse.id).map(task => (
                      <div key={task.id} className={`bg-white p-5 rounded-2xl border transition shadow-sm ${timeLeft[task.id] ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-100'}`}>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            <i className={`fas ${task.isClassTask ? 'fa-stopwatch text-amber-500' : 'fa-file-code text-indigo-400'}`}></i> {task.title}
                          </h4>
                          {timeLeft[task.id] && (
                            <div className="bg-amber-500 text-white px-3 py-1 rounded-lg font-black text-xs animate-pulse">
                              {formatTime(timeLeft[task.id])}
                            </div>
                          )}
                          {task.timerEnd && task.timerEnd < Date.now() && (
                            <div className="bg-rose-100 text-rose-600 px-3 py-1 rounded-lg font-black text-[10px] uppercase">Vaqt tugadi</div>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{task.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <TaskForm 
                    userName={user.firstName} 
                    courseTitle={selectedCourse.title}
                    courseSubject={selectedCourse.subject}
                    onResult={(res) => {
                      // Agar taymer tugagan bo'lsa topshirishni bloklash (bu yerda generic check)
                      const activeClassTask = tasks.find(t => t.courseId === selectedCourse.id && t.isClassTask && t.timerEnd);
                      if (activeClassTask && activeClassTask.timerEnd && activeClassTask.timerEnd < Date.now()) {
                        alert("Kechirasiz, darsdagi vazifa uchun belgilangan vaqt tugadi!");
                        return;
                      }
                      const fullRes = { ...res, courseId: selectedCourse.id, userId: user.id };
                      onTaskSubmit(fullRes);
                      setLatestResult(fullRes);
                    }} 
                  />
                </div>
              </div>
            ) : (
              <ResultView result={latestResult} onReset={() => setLatestResult(null)} />
            )
          ) : (
            <div className="max-w-2xl mx-auto w-full">
              <CourseChat user={user} courseId={selectedCourse.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
