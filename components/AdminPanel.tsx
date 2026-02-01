
import React, { useState, useMemo } from 'react';
import { User, Course, CourseTask, TaskResult, EnrollmentRequest, Subject, SubjectType } from '../types.ts';
import { api } from '../services/apiService.ts';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from 'recharts';

interface AdminPanelProps {
  users: User[];
  courses: Course[];
  tasks: CourseTask[];
  results: TaskResult[];
  requests: EnrollmentRequest[];
  onAddCourse: (c: Course) => void;
  onAddTask: (t: CourseTask) => void;
  onApprove: (id: string) => void;
  onGrade: (id: string, grade: number) => void;
  onDeleteUserFromCourse: (userId: string, courseId: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  users, courses, tasks, results, requests, 
  onAddCourse, onAddTask, onApprove, onGrade, onDeleteUserFromCourse 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'users' | 'requests'>('overview');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);

  const stats = useMemo(() => ({
    totalUsers: users.length,
    activeCourses: courses.length,
    totalResults: results.length,
    pendingReq: requests.length,
    avgScore: results.length ? (results.reduce((a,b) => a + (b.adminGrade || b.grade), 0) / results.length).toFixed(1) : '0'
  }), [users, courses, results, requests]);

  const chartData = courses.map(c => ({
    name: c.title.substring(0, 10),
    students: users.filter(u => u.enrolledCourses.includes(c.id)).length
  }));

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Admin Nav */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2">Command Center</h1>
          <p className="text-slate-500">Platforma ekotizimini to'liq nazorat qilish.</p>
        </div>

        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
          <TabBtn active={activeTab === 'overview'} label="Umumiy" onClick={() => setActiveTab('overview')} />
          <TabBtn active={activeTab === 'courses'} label="Kurslar" onClick={() => setActiveTab('courses')} />
          <TabBtn active={activeTab === 'users'} label="Foydalanuvchilar" onClick={() => setActiveTab('users')} />
          <TabBtn active={activeTab === 'requests'} label="Arizalar" onClick={() => setActiveTab('requests')} badge={requests.length} />
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-12">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatBox label="O'quvchilar" val={stats.totalUsers} icon="fa-users" color="bg-indigo-600" />
              <StatBox label="Kurslar" val={stats.activeCourses} icon="fa-layer-group" color="bg-emerald-600" />
              <StatBox label="O'rtacha Ball" val={stats.avgScore} icon="fa-star" color="bg-amber-600" />
              <StatBox label="Arizalar" val={stats.pendingReq} icon="fa-envelope" color="bg-rose-600" />
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="aether-card-dark p-10 rounded-[3rem] border border-white/5">
                 <h3 className="text-xl font-black text-white mb-8">Kurslardagi faollik</h3>
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={chartData}>
                          <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                          <Bar dataKey="students" radius={[10, 10, 0, 0]}>
                             {chartData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? '#6366f1' : '#8b5cf6'} />)}
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="aether-card-dark p-10 rounded-[3rem] border border-white/5">
                 <h3 className="text-xl font-black text-white mb-8">Oxirgi Vazifalar</h3>
                 <div className="space-y-4">
                    {results.slice(0, 5).map(r => (
                      <div key={r.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 font-bold text-xs">{r.userName[0]}</div>
                            <div>
                               <p className="text-xs font-black text-white">{r.userName}</p>
                               <p className="text-[9px] font-bold text-slate-500 uppercase">{new Date(r.timestamp).toLocaleDateString()}</p>
                            </div>
                         </div>
                         <div className="text-xs font-black text-indigo-400">{r.grade} ball</div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="aether-card-dark rounded-[3.5rem] p-10 border border-white/5">
           <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4">
             <i className="fas fa-envelope-open-text text-rose-500"></i> Kiruvchi Arizalar
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-600 font-black uppercase tracking-widest italic opacity-50">Yangi arizalar mavjud emas</div>
              ) : requests.map(req => (
                <div key={req.id} className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 flex flex-col justify-between">
                   <div className="mb-6">
                      <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Kursga a'zo bo'lish</div>
                      <h4 className="text-xl font-black text-white mb-1">{req.userName}</h4>
                      <p className="text-xs text-slate-500 font-medium">Kurs: <span className="text-slate-300">{req.courseTitle}</span></p>
                   </div>
                   <button onClick={() => onApprove(req.id)} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition">Tasdiqlash</button>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Course management and User management can be expanded similarly with high-end cards/tables */}
    </div>
  );
};

const TabBtn = ({ active, label, onClick, badge }: any) => (
  <button 
    onClick={onClick}
    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-white'}`}
  >
    {label} {badge > 0 && <span className="ml-2 bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[8px]">{badge}</span>}
  </button>
);

const StatBox = ({ label, val, icon, color }: any) => (
  <div className="aether-card-dark p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
     <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform ${color.replace('bg-', 'text-')}`}>
        <i className={`fas ${icon} text-8xl`}></i>
     </div>
     <div className="relative z-10">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-black/20`}>
           <i className={`fas ${icon}`}></i>
        </div>
        <div className="text-4xl font-black text-white mb-1 tracking-tighter">{val}</div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
     </div>
  </div>
);

export default AdminPanel;
