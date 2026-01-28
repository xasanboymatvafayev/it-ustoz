
import React, { useMemo } from 'react';
import { User, TaskResult, Course } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ParentDashboardProps {
  parent: User;
  students: User[];
  results: TaskResult[];
  courses: Course[];
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ parent, students, results, courses }) => {
  // Ota-ona telefon raqami orqali bog'langan bolalarni topish
  const myChildren = useMemo(() => 
    students.filter(s => s.parentPhone === parent.parentPhone && s.role === 'user'),
    [students, parent.parentPhone]
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-10 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2">Ota-ona kabineti</h2>
          <p className="text-indigo-100 opacity-80">Farzandingizning IT sohasidagi o'sishini kuzatib boring.</p>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <i className="fas fa-user-shield text-9xl"></i>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {myChildren.length === 0 ? (
          <div className="col-span-full bg-white p-20 text-center rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400">
            <i className="fas fa-child text-5xl mb-4 block"></i>
            <p className="font-bold">Bog'langan farzandlar topilmadi.</p>
            <p className="text-xs mt-2">Profil sozlamalarida telefon raqamingiz to'g'ri ekanligini tekshiring.</p>
          </div>
        ) : myChildren.map(child => {
          const childResults = results.filter(r => r.userId === child.id);
          const avg = childResults.length > 0 ? (childResults.reduce((acc, r) => acc + (r.adminGrade || r.grade), 0) / childResults.length) : 0;
          const chartData = [...childResults].sort((a, b) => a.timestamp - b.timestamp).slice(-10).map((r, i) => ({
            name: `V${i+1}`, score: r.adminGrade || r.grade
          }));

          return (
            <div key={child.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-4 border-b pb-6">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl font-black">
                  {child.avatar ? <img src={child.avatar} className="w-full h-full rounded-2xl object-cover" alt=""/> : child.firstName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">{child.firstName} {child.lastName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md uppercase">O'rtacha Ball: {avg.toFixed(0)}</span>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md uppercase">{child.enrolledCourses.length} ta Kurs</span>
                  </div>
                </div>
              </div>

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={4} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Oxirgi faollik</h4>
                <div className="space-y-2">
                  {childResults.slice(0, 3).map(r => (
                    <div key={r.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-700">{courses.find(c => c.id === r.courseId)?.title}</div>
                      <div className="text-xs font-black text-indigo-600">{r.adminGrade || r.grade} Ball</div>
                    </div>
                  ))}
                  {childResults.length === 0 && <div className="text-center py-4 text-xs text-slate-300 italic">Hali natijalar yo'q</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ParentDashboard;
