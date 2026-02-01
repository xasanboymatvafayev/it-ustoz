
import React, { useState, useMemo } from 'react';
import { User, Course, CourseTask, TaskResult, EnrollmentRequest, Subject, SubjectType } from '../types.ts';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Cell, PieChart, Pie } from 'recharts';

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
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState<Partial<Course>>({ subject: 'Frontend Development' as SubjectType });

  const stats = useMemo(() => {
    const totalResults = results.length;
    const avgScore = totalResults ? (results.reduce((a,b) => a + (b.adminGrade || b.grade), 0) / totalResults).toFixed(1) : '0';
    return {
      totalUsers: users.length,
      activeCourses: courses.length,
      totalResults,
      pendingReq: requests.length,
      avgScore
    };
  }, [users, courses, results, requests]);

  const chartData = useMemo(() => courses.map(c => ({
    name: c.title.length > 15 ? c.title.substring(0, 12) + '...' : c.title,
    students: users.filter(u => (u.enrolledCourses || []).includes(c.id)).length
  })), [courses, users]);

  const subjectDist = useMemo(() => {
    const dist: any = {};
    courses.forEach(c => { dist[c.subject] = (dist[c.subject] || 0) + 1; });
    return Object.keys(dist).map(k => ({ name: k, value: dist[k] }));
  }, [courses]);

  const handleAddCourse = () => {
    if (!newCourse.title || !newCourse.description) return;
    onAddCourse({
      id: Math.random().toString(36).substr(2, 9),
      title: newCourse.title!,
      description: newCourse.description!,
      subject: newCourse.subject! as SubjectType,
      teacher: "Admin",
      createdAt: Date.now()
    });
    setShowAddCourse(false);
    setNewCourse({ subject: 'Frontend Development' as SubjectType });
  };

  return (
    <div className="space-y-12 animate-fade-in max-w-7xl mx-auto pb-32">
      {/* Admin Nav */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
        <div className="space-y-2">
          <h1 className="text-6xl font-black text-white tracking-tighter">Command <span className="text-indigo-500">Center</span></h1>
          <p className="text-slate-500 font-medium text-lg">Platformaning barcha tizimlarini real-vaqtda boshqarish.</p>
        </div>

        <div className="flex flex-wrap bg-white/5 p-2 rounded-3xl border border-white/5 backdrop-blur-xl">
          <TabBtn active={activeTab === 'overview'} icon="fa-chart-network" label="Tizim" onClick={() => setActiveTab('overview')} />
          <TabBtn active={activeTab === 'courses'} icon="fa-layer-group" label="Kurslar" onClick={() => setActiveTab('courses')} />
          <TabBtn active={activeTab === 'users'} icon="fa-users" label="Talabalar" onClick={() => setActiveTab('users')} />
          <TabBtn active={activeTab === 'requests'} icon="fa-envelope" label="Arizalar" onClick={() => setActiveTab('requests')} badge={requests.length} />
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-12">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <BigStat label="O'quvchilar" val={stats.totalUsers} icon="fa-users" color="bg-indigo-600" />
              <BigStat label="Kurslar" val={stats.activeCourses} icon="fa-layer-group" color="bg-emerald-600" />
              <BigStat label="Tizim Balli" val={stats.avgScore} icon="fa-star" color="bg-amber-500" />
              <BigStat label="Arizalar" val={stats.pendingReq} icon="fa-bell" color="bg-rose-600" />
           </div>

           <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
              <div className="xl:col-span-2 aether-card-dark p-12 rounded-[3.5rem] border border-white/5">
                 <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black text-white">Kurslar Faolligi</h3>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">O'quvchilar soni</div>
                 </div>
                 <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={chartData}>
                          <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                          <Bar dataKey="students" radius={[12, 12, 0, 0]}>
                             {chartData.map((_, i) => <Cell key={i} fill={['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][i % 5]} />)}
                          </Bar>
                          <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '12px'}} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="aether-card-dark p-10 rounded-[3.5rem] border border-white/5 space-y-8">
                 <h3 className="text-xl font-black text-white mb-4">Oxirgi Tekshiruvlar</h3>
                 <div className="space-y-4">
                    {results.slice(0, 5).map(r => (
                      <div key={r.id} className="p-5 bg-white/2 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400 font-black text-xs uppercase">{r.userName[0]}</div>
                            <div>
                               <p className="text-xs font-black text-white">{r.userName}</p>
                               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{new Date(r.timestamp).toLocaleDateString()}</p>
                            </div>
                         </div>
                         <div className="px-3 py-1 bg-black/20 rounded-lg text-xs font-black text-indigo-400 border border-white/5">{r.grade}</div>
                      </div>
                    ))}
                 </div>
                 <button className="w-full py-4 text-[10px] font-black uppercase text-slate-500 hover:text-white transition">Barcha Natijalar <i className="fas fa-arrow-right ml-2"></i></button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-10">
          <div className="flex justify-between items-center">
            <h3 className="text-3xl font-black text-white tracking-tight">Akademiya Kurslari</h3>
            <button onClick={() => setShowAddCourse(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-600/20">
              <i className="fas fa-plus mr-2"></i> Yangi Kurs
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {courses.map(course => (
              <div key={course.id} className="aether-card-dark p-10 rounded-[3rem] border border-white/5 hover:border-indigo-500/30 transition-all duration-500 group relative overflow-hidden">
                <div className="absolute -top-10 -right-10 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                  <i className="fas fa-layer-group text-[10rem] text-white"></i>
                </div>
                <div className="relative z-10">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">{course.subject}</div>
                  <h4 className="text-2xl font-black text-white mb-4">{course.title}</h4>
                  <p className="text-slate-500 text-sm mb-10 leading-relaxed italic">"{course.description}"</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                       <i className="fas fa-users text-slate-600"></i>
                       <span className="text-xs font-black text-slate-400">{users.filter(u => (u.enrolledCourses || []).includes(course.id)).length} Talaba</span>
                    </div>
                    <button className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition"><i className="fas fa-ellipsis-v"></i></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="aether-card-dark rounded-[3.5rem] overflow-hidden border border-white/5">
           <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/2">
             <h3 className="text-2xl font-black text-white">Talabalar Ro'yxati</h3>
             <div className="flex gap-4">
               <input type="text" placeholder="Qidiruv..." className="bg-slate-900 border border-white/10 rounded-xl px-6 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-all" />
             </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                   <th className="px-10 py-6">Talaba</th>
                   <th className="px-10 py-6">Email</th>
                   <th className="px-10 py-6">Rol</th>
                   <th className="px-10 py-6">Kurslar</th>
                   <th className="px-10 py-6">Amallar</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {users.map(u => (
                   <tr key={u.id} className="group hover:bg-white/2 transition-all">
                     <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400 font-black uppercase text-xs">{u.firstName[0]}</div>
                           <div className="font-bold text-white text-sm">{u.firstName} {u.lastName}</div>
                        </div>
                     </td>
                     <td className="px-10 py-6 text-slate-400 text-xs font-medium">{u.email}</td>
                     <td className="px-10 py-6">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>{u.role}</span>
                     </td>
                     <td className="px-10 py-6 text-slate-500 font-black text-xs">{(u.enrolledCourses || []).length} Ta</td>
                     <td className="px-10 py-6">
                        <div className="flex gap-2">
                           <button className="p-2 hover:bg-white/5 rounded-lg text-slate-600 hover:text-indigo-400 transition"><i className="fas fa-edit"></i></button>
                           <button className="p-2 hover:bg-white/5 rounded-lg text-slate-600 hover:text-rose-500 transition"><i className="fas fa-trash"></i></button>
                        </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="aether-card-dark rounded-[3.5rem] p-12 border border-white/5 bg-gradient-to-br from-indigo-900/5 to-transparent">
           <h3 className="text-3xl font-black text-white mb-10 flex items-center gap-6">
             <i className="fas fa-paper-plane text-rose-500"></i> Kiruvchi Arizalar
             <span className="px-4 py-1.5 bg-rose-500/20 text-rose-500 rounded-2xl text-xs">{requests.length}</span>
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {requests.length === 0 ? (
                <div className="col-span-full py-32 text-center text-slate-600 font-black uppercase tracking-[0.4em] italic opacity-30">Yangi arizalar mavjud emas</div>
              ) : requests.map(req => (
                <div key={req.id} className="p-10 bg-white/5 rounded-[3rem] border border-white/5 flex flex-col justify-between group hover:border-indigo-500/30 transition-all duration-500 shadow-2xl">
                   <div className="mb-10">
                      <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400 text-xl mb-6 group-hover:scale-110 transition-transform"><i className="fas fa-user-plus"></i></div>
                      <h4 className="text-2xl font-black text-white mb-2">{req.userName}</h4>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Kurs: <span className="text-indigo-400">{req.courseTitle}</span></p>
                   </div>
                   <div className="flex gap-3">
                      <button onClick={() => onApprove(req.id)} className="flex-grow py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-600/10">Tasdiqlash</button>
                      <button className="w-14 h-14 bg-white/5 text-slate-500 rounded-2xl flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition border border-white/5"><i className="fas fa-times"></i></button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Modern Add Course Modal */}
      {showAddCourse && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-[3.5rem] p-12 shadow-2xl animate-fade-in">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black text-white">Yangi Kurs</h3>
                <button onClick={() => setShowAddCourse(false)} className="text-slate-500 hover:text-white transition"><i className="fas fa-times text-xl"></i></button>
             </div>
             <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 mb-2 block">Sarlavha</label>
                   <input type="text" placeholder="Kurs nomini kiriting..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-all" onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 mb-2 block">Tavsif</label>
                   <textarea rows={4} placeholder="Kurs haqida batafsil..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-all" onChange={e => setNewCourse({...newCourse, description: e.target.value})}></textarea>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 mb-2 block">Yo'nalish</label>
                   <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-all" onChange={e => setNewCourse({...newCourse, subject: e.target.value as SubjectType})}>
                      {Object.values(Subject).map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                   </select>
                </div>
                <button onClick={handleAddCourse} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-700 transition shadow-xl mt-6">Kursni Yaratish</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TabBtn = ({ active, label, onClick, badge, icon }: any) => (
  <button 
    onClick={onClick}
    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 ${active ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
  >
    <i className={`fas ${icon} ${active ? 'text-white' : 'text-slate-600'}`}></i>
    {label} 
    {badge > 0 && <span className="ml-1 bg-rose-500 text-white px-2 py-0.5 rounded-full text-[8px] animate-pulse">{badge}</span>}
  </button>
);

const BigStat = ({ label, val, icon, color }: any) => (
  <div className="aether-card-dark p-10 rounded-[3.2rem] border border-white/5 relative overflow-hidden group transition-all duration-500 hover:border-white/10">
     <div className={`absolute -top-10 -right-10 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700 ${color.replace('bg-', 'text-')}`}>
        <i className={`fas ${icon} text-[12rem]`}></i>
     </div>
     <div className="relative z-10">
        <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-2xl shadow-black/40`}>
           <i className={`fas ${icon} text-xl`}></i>
        </div>
        <div className="text-5xl font-black text-white mb-2 tracking-tighter">{val}</div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{label}</div>
     </div>
  </div>
);

export default AdminPanel;
