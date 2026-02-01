
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
  // Added requests to match the props passed in App.tsx
  requests: EnrollmentRequest[];
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, courses, tasks, onEnroll, onTaskSubmit, requests }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [latestResult, setLatestResult] = useState<TaskResult | null>(null);

  const myCourses = courses.filter(c => user.enrolledCourses.includes(c.id));

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      {!selectedCourse ? (
        <div className="space-y-10">
          <header className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Salom, {user.firstName}!</h2>
              <p className="text-slate-500 italic">Bugun qaysi cho'qqini zabt etamiz?</p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map(course => {
              const enrolled = user.enrolledCourses.includes(course.id);
              return (
                <div key={course.id} className="aether-card-dark p-8 rounded-[2.5rem] group hover:border-indigo-500/40 transition-all duration-500">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">{course.subject}</div>
                  <h3 className="text-2xl font-black text-white mb-6 group-hover:text-indigo-400 transition">{course.title}</h3>
                  {enrolled ? (
                    <button onClick={() => setSelectedCourse(course)} className="w-full py-4 bg-white/5 text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-white/5 hover:bg-indigo-600 transition">Darsga Kirish</button>
                  ) : (
                    <button onClick={() => onEnroll(course.id)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition">A'zo Bo'lish</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <button onClick={() => { setSelectedCourse(null); setLatestResult(null); }} className="text-slate-500 hover:text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 transition">
            <i className="fas fa-arrow-left"></i> Kurslarga Qaytish
          </button>
          
          <div className="bg-indigo-600/10 p-10 rounded-[3rem] border border-indigo-500/20">
            <h1 className="text-3xl font-black text-white mb-2">{selectedCourse.title}</h1>
            <p className="text-indigo-300/70 text-sm">{selectedCourse.description}</p>
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

export default UserDashboard;
