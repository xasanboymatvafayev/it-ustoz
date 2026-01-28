
import React, { useState, useMemo, useEffect } from 'react';
import { User, Course, CourseTask, TaskResult, EnrollmentRequest, Subject } from '../types';
import { api } from '../services/apiService';

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

const AdminPanel: React.FC<AdminPanelProps> = ({ users, courses, tasks, results, requests, onAddCourse, onAddTask, onApprove, onGrade, onDeleteUserFromCourse }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'rating'>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseTab, setCourseTab] = useState<'matrix' | 'tasks' | 'students' | 'requests'>('matrix');
  
  const [newCourse, setNewCourse] = useState({ title: '', description: '', subject: Subject.FRONTEND });
  const [newTask, setNewTask] = useState({ title: '', description: '', isClassTask: false });
  const [reviewModal, setReviewModal] = useState<TaskResult | null>(null);
  const [adminBall, setAdminBall] = useState('');

  const stats = useMemo(() => ({
    students: users.filter(u => u.role === 'user').length,
    courses: courses.length,
    pending: requests.length,
    totalResults: results.length
  }), [users, courses, requests, results]);

  const handleStartTimer = async (taskId: string) => {
    const mins = prompt("Taymer uchun daqiqa kiriting:", "4");
    if (mins) {
      await api.startTaskTimer(taskId, parseInt(mins));
      alert("Taymer barcha o'quvchilar uchun boshlandi!");
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { l: 'O\'quvchilar', v: stats.students, i: 'fa-user-graduate', c: 'indigo' },
          { l: 'Kurslar', v: stats.courses, i: 'fa-book-open', c: 'blue' },
          { l: 'Arizalar', v: stats.pending, i: 'fa-clock', c: 'amber' },
          { l: 'Bajarilganlar', v: stats.totalResults, i: 'fa-check-double', c: 'emerald' },
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl bg-${s.c}-50 text-${s.c}-600 flex items-center justify-center text-2xl`}><i className={`fas ${s.i}`}></i></div>
            <div>
              <div className="text-3xl font-black text-slate-800">{s.v}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.l}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black text-slate-800 mb-6">Barcha Kurslar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(c => (
            <div key={c.id} onClick={() => { setSelectedCourseId(c.id); setActiveTab('courses'); setCourseTab('matrix'); }} className="p-6 rounded-3xl border border-slate-100 hover:border-indigo-500 cursor-pointer transition group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white"><i className="fas fa-terminal"></i></div>
                <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">{c.subject}</span>
              </div>
              <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition">{c.title}</h4>
              <p className="text-xs text-slate-400 mt-2 line-clamp-1">{c.description}</p>
            </div>
          ))}
          <button onClick={() => { setActiveTab('courses'); setSelectedCourseId(null); }} className="p-6 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition flex flex-col items-center justify-center gap-2">
            <i className="fas fa-plus-circle text-2xl"></i>
            <span className="font-bold text-sm">Yangi kurs qo'shish</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderMatrix = (courseId: string) => {
    const courseUsers = users.filter(u => u.enrolledCourses.includes(courseId));
    const courseTasks = tasks.filter(t => t.courseId === courseId);

    return (
      <div className="overflow-x-auto bg-white rounded-3xl border border-slate-100 shadow-sm mt-4">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px] sticky left-0 bg-slate-50">O'quvchi</th>
              {courseTasks.map(t => (
                <th key={t.id} className="px-6 py-4 font-black text-slate-400 uppercase text-[10px] min-w-[120px] text-center">
                  {t.isClassTask && <i className="fas fa-clock text-amber-500 mr-1"></i>} {t.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {courseUsers.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4 sticky left-0 bg-white">
                  <div className="font-bold text-slate-800">{user.firstName} {user.lastName}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">{user.username}</div>
                </td>
                {courseTasks.map(task => {
                  const res = results.find(r => r.taskId === task.id && r.userId === user.id);
                  return (
                    <td key={task.id} className="px-6 py-4 text-center">
                      {res ? (
                        <button 
                          onClick={() => { setReviewModal(res); setAdminBall(res.adminGrade?.toString() || ''); }}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all transform hover:scale-110 ${res.status === 'reviewed' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-amber-500 text-white shadow-lg shadow-amber-100 animate-pulse'}`}
                        >
                          {res.adminGrade ? <span className="font-black text-xs">{res.adminGrade}</span> : <i className="fas fa-check text-xs"></i>}
                        </button>
                      ) : (
                        <div className="text-rose-300 opacity-30"><i className="fas fa-times"></i></div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex gap-4 bg-white p-2 rounded-2xl border border-slate-100 w-fit shadow-sm">
        <button onClick={() => { setActiveTab('dashboard'); setSelectedCourseId(null); }} className={`px-6 py-2 rounded-xl font-bold text-sm transition ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>Dashboard</button>
        <button onClick={() => setActiveTab('courses')} className={`px-6 py-2 rounded-xl font-bold text-sm transition ${activeTab === 'courses' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>Kurslar</button>
        <button onClick={() => setActiveTab('rating')} className={`px-6 py-2 rounded-xl font-bold text-sm transition ${activeTab === 'rating' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>Reyting</button>
      </div>

      {activeTab === 'dashboard' && renderDashboard()}

      {selectedCourseId && activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm gap-4">
            <button onClick={() => setSelectedCourseId(null)} className="text-slate-400 hover:text-indigo-600 font-bold text-sm flex items-center gap-2"><i className="fas fa-chevron-left"></i> Orqaga</button>
            <h2 className="text-lg font-black text-slate-800">{courses.find(c => c.id === selectedCourseId)?.title}</h2>
            <div className="flex gap-2 flex-wrap justify-center">
              <button onClick={() => setCourseTab('matrix')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${courseTab === 'matrix' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Rating Matrix</button>
              <button onClick={() => setCourseTab('tasks')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${courseTab === 'tasks' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Vazifalar</button>
              <button onClick={() => setCourseTab('students')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${courseTab === 'students' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>O'quvchilar</button>
              <button onClick={() => setCourseTab('requests')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${courseTab === 'requests' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Arizalar ({requests.filter(r => r.courseId === selectedCourseId).length})</button>
            </div>
          </div>

          {courseTab === 'matrix' && renderMatrix(selectedCourseId)}

          {courseTab === 'tasks' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-fit">
                <h3 className="text-xl font-black text-slate-800 mb-6">Yangi Vazifa</h3>
                <div className="space-y-4">
                  <input type="text" placeholder="Mavzu nomi" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-600 outline-none" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                  <textarea placeholder="Vazifa sharti..." className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-600 outline-none h-32" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                  
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={newTask.isClassTask} onChange={e => setNewTask({...newTask, isClassTask: e.target.checked})} />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Darsda (Taymer bilan)</span>
                  </label>

                  <button onClick={() => { if(!newTask.title) return; onAddTask({ id: Math.random().toString(36).substr(2, 9), courseId: selectedCourseId, ...newTask, order: tasks.length + 1 }); setNewTask({title:'', description:'', isClassTask: false}); }} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">E'lon qilish</button>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                {tasks.filter(t => t.courseId === selectedCourseId).map(t => (
                  <div key={t.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800">{t.title}</h4>
                        {t.isClassTask && <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">DARSONLINE</span>}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{t.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.isClassTask && (
                        <button 
                          onClick={() => handleStartTimer(t.id)}
                          className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition flex items-center gap-2"
                        >
                          <i className="fas fa-stopwatch"></i> {t.timerEnd ? 'Taymerni yangilash' : 'Taymerni boshlash'}
                        </button>
                      )}
                      <button className="text-slate-200 hover:text-rose-500 transition px-2"><i className="fas fa-trash-alt"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl relative border border-white/20">
            <button onClick={() => setReviewModal(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-800 transition text-3xl"><i className="fas fa-times"></i></button>
            <div className="flex items-center gap-6 mb-12">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl shadow-2xl shadow-indigo-200 rotate-3"><i className="fas fa-robot"></i></div>
              <div>
                <h2 className="text-3xl font-black text-slate-800">IT Mentor Tahlili</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{reviewModal.userName} • AI Score: {reviewModal.grade}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                  <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-4">Kod xatoliklari</h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{reviewModal.errors}</p>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2.5rem]">
                  <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-4">Optimallashtirilgan yechim</h3>
                  <pre className="text-xs text-indigo-100 font-mono overflow-x-auto p-4 bg-slate-800 rounded-2xl border border-slate-700">{reviewModal.solution}</pre>
                </div>
              </div>
              <div className="bg-white p-10 rounded-[2.5rem] border-4 border-indigo-50 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-800 mb-6 underline decoration-indigo-200 decoration-4">Mentor Qarori</h3>
                  <p className="text-sm text-slate-500 italic mb-10 leading-relaxed">"{reviewModal.explanation}"</p>
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Admin Balli (0-100)</label>
                    <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-8 py-6 text-4xl font-black text-indigo-600 focus:border-indigo-600 outline-none transition" value={adminBall} onChange={e => setAdminBall(e.target.value)} />
                  </div>
                </div>
                <button onClick={() => { if(!adminBall) return; onGrade(reviewModal.id, parseInt(adminBall)); setReviewModal(null); }} className="w-full bg-indigo-600 text-white py-6 rounded-[1.5rem] font-black text-xl mt-12 hover:bg-indigo-700 active:scale-95 transition shadow-2xl shadow-indigo-100">Saqlash va Tasdiqlash</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
