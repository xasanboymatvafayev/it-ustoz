import React, { useState, useMemo } from 'react';
import { User, Course, CourseTask, TaskResult, EnrollmentRequest, Subject, SubjectType } from '../types.ts';
import { api } from '../services/apiService.ts';

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
  const [activeSection, setActiveSection] = useState<'courses' | 'requests' | 'users'>('courses');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseViewTab, setCourseViewTab] = useState<'matrix' | 'rating' | 'tasks'>('matrix');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [reviewResult, setReviewResult] = useState<TaskResult | null>(null);

  const [taskForm, setTaskForm] = useState({ title: '', description: '' });
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    subject: Subject.FRONTEND as SubjectType,
    teacher: ''
  });

  const selectedCourse = useMemo(() => courses.find(c => c.id === selectedCourseId), [courses, selectedCourseId]);
  const courseTasks = useMemo(() => tasks.filter(t => t.courseId === selectedCourseId).sort((a,b) => a.order - b.order), [tasks, selectedCourseId]);
  const enrolledStudents = useMemo(() => users.filter(u => u.enrolledCourses.includes(selectedCourseId || '')), [users, selectedCourseId]);

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const newCourse: Course = {
      id: Math.random().toString(36).substr(2, 9),
      ...courseForm,
      createdAt: Date.now()
    };
    onAddCourse(newCourse);
    setShowAddCourse(false);
    setCourseForm({ title: '', description: '', subject: Subject.FRONTEND, teacher: '' });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    const newTask: CourseTask = {
      id: Math.random().toString(36).substr(2, 9),
      courseId: selectedCourseId,
      title: taskForm.title,
      description: taskForm.description,
      order: courseTasks.length + 1
    };
    onAddTask(newTask);
    setTaskForm({ title: '', description: '' });
    alert("Vazifa muvaffaqiyatli qo'shildi!");
  };

  const handleStartTimer = async (taskId: string) => {
    if (!confirm("Hamma o'quvchilar uchun 4 daqiqalik taymerni boshlaysizmi?")) return;
    await api.startTaskTimer(taskId, 4);
    alert("Taymer boshlandi!");
  };

  return (
    <div className="min-h-screen animate-fade-in text-slate-300">
      <div className="flex items-center gap-6 mb-12 bg-white/5 p-2 rounded-[2rem] w-fit border border-white/5">
        <button onClick={() => { setActiveSection('courses'); setSelectedCourseId(null); }} className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition ${activeSection === 'courses' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'hover:text-white'}`}>Kurslar</button>
        <button onClick={() => setActiveSection('requests')} className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition ${activeSection === 'requests' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'hover:text-white'}`}>
          Arizalar {requests.length > 0 && <span className="ml-2 bg-rose-500 text-white px-2 py-0.5 rounded-full text-[9px]">{requests.length}</span>}
        </button>
        <button onClick={() => setActiveSection('users')} className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition ${activeSection === 'users' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'hover:text-white'}`}>Foydalanuvchilar</button>
      </div>

      {activeSection === 'courses' && !selectedCourseId && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black text-white tracking-tighter">Kurslar Arxivi</h2>
            <button onClick={() => setShowAddCourse(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-2xl shadow-emerald-500/20">
              <i className="fas fa-plus mr-2"></i> Yangi Kurs
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map(c => (
              <div key={c.id} onClick={() => setSelectedCourseId(c.id)} className="bg-slate-900/50 p-10 rounded-[3rem] border border-white/5 hover:border-indigo-500/40 transition-all cursor-pointer group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><i className="fas fa-layer-group text-8xl"></i></div>
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">{c.subject}</div>
                <h3 className="text-2xl font-black text-white mb-2 group-hover:text-indigo-400 transition">{c.title}</h3>
                <p className="text-slate-500 text-sm mb-8 line-clamp-2">{c.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-600 uppercase">Boshqarish <i className="fas fa-arrow-right ml-2"></i></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedCourseId && selectedCourse && (
        <div className="space-y-10 animate-fade-in">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <button onClick={() => setSelectedCourseId(null)} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition"><i className="fas fa-arrow-left"></i></button>
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter">{selectedCourse.title}</h2>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{selectedCourse.subject}</span>
              </div>
            </div>

            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
              <button onClick={() => setCourseViewTab('matrix')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${courseViewTab === 'matrix' ? 'bg-white text-slate-900' : 'hover:text-white'}`}>Jadval (Matrix)</button>
              <button onClick={() => setCourseViewTab('rating')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${courseViewTab === 'rating' ? 'bg-white text-slate-900' : 'hover:text-white'}`}>Reyting</button>
              <button onClick={() => setCourseViewTab('tasks')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${courseViewTab === 'tasks' ? 'bg-white text-slate-900' : 'hover:text-white'}`}>Vazifalar</button>
            </div>
          </div>

          {courseViewTab === 'matrix' && (
            <div className="bg-slate-900/80 rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-900">O'quvchi</th>
                      {courseTasks.map(task => (
                        <th key={task.id} className="px-6 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center min-w-[150px]">Vazifa {task.order}</th>
                      ))}
                      <th className="px-10 py-8 text-[10px] font-black text-indigo-400 uppercase tracking-widest text-right">Ball</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {enrolledStudents.map(student => {
                      const studentResults = results.filter(r => r.userId === student.id && r.courseId === selectedCourseId);
                      const totalScore = studentResults.reduce((acc, r) => acc + (r.adminGrade || r.grade), 0);
                      return (
                        <tr key={student.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-10 py-6 sticky left-0 bg-slate-900 group-hover:bg-slate-800 transition-colors font-bold text-white">{student.firstName} {student.lastName}</td>
                          {courseTasks.map(task => {
                            const result = studentResults.find(r => r.taskId === task.id);
                            return (
                              <td key={task.id} className="px-6 py-6 text-center">
                                {result ? (
                                  <button onClick={() => setReviewResult(result)} className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:scale-110 transition flex items-center justify-center mx-auto">
                                    <i className="fas fa-check"></i>
                                  </button>
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500/20 flex items-center justify-center mx-auto"><i className="fas fa-times"></i></div>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-10 py-6 text-right font-black text-indigo-400">{totalScore}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {courseViewTab === 'tasks' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5">
                <h3 className="text-xl font-black mb-8 text-white">Yangi Vazifa Qo'shish</h3>
                <form onSubmit={handleCreateTask} className="space-y-6">
                  <input required value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-2xl px-6 py-4 outline-none" placeholder="Vazifa Sarlavhasi" />
                  <textarea required value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-2xl px-6 py-4 outline-none h-32" placeholder="Vazifa Tavsifi..." />
                  <button type="submit" className="w-full py-4 bg-indigo-600 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-500/20">Vazifani Qo'shish</button>
                </form>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-black mb-4 text-white">Kursdagi Vazifalar ({courseTasks.length})</h3>
                {courseTasks.map(t => (
                  <div key={t.id} className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500">VAZIFA {t.order}</div>
                      <div className="font-bold text-white mb-2">{t.title}</div>
                      <button 
                        onClick={() => handleStartTimer(t.id)}
                        className="bg-rose-600/20 text-rose-400 text-[9px] font-black px-3 py-1.5 rounded-lg border border-rose-600/30 hover:bg-rose-600 transition uppercase tracking-tighter"
                      >
                        <i className="fas fa-stopwatch mr-1"></i> Taymer (4m)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showAddCourse && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 w-full max-w-2xl p-12 rounded-[3.5rem] border border-white/10 shadow-2xl">
            <h3 className="text-3xl font-black text-white mb-8 text-center">Yangi Kurs Yaratish</h3>
            <form onSubmit={handleCreateCourse} className="space-y-6">
              <input required value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500" placeholder="Kurs Nomi" />
              <select value={courseForm.subject} onChange={e => setCourseForm({...courseForm, subject: e.target.value as SubjectType})} className="w-full bg-slate-800 border border-white/10 rounded-2xl px-6 py-4 outline-none">
                {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input required value={courseForm.teacher} onChange={e => setCourseForm({...courseForm, teacher: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500" placeholder="O'qituvchi Ismi" />
              <textarea required value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none h-32" placeholder="Kurs haqida batafsil..." />
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowAddCourse(false)} className="flex-1 py-4 rounded-xl font-bold bg-white/5">Bekor qilish</button>
                <button type="submit" className="flex-1 py-4 rounded-xl font-bold bg-indigo-600">Kursni Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reviewResult && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-5xl p-12 rounded-[4rem] border border-white/10 shadow-2xl space-y-8 my-10">
             <div className="flex justify-between items-center border-b border-white/10 pb-8">
                <h3 className="text-3xl font-black text-white">O'quvchi Natijasi Tahlili</h3>
                <button onClick={() => setReviewResult(null)} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition"><i className="fas fa-times"></i></button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-500">O'quvchi Javobi</h4>
                  <div className="bg-slate-800 p-6 rounded-3xl border border-white/5 font-mono text-sm text-indigo-300 h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{reviewResult.solution}</pre>
                  </div>
               </div>
               <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-500">AI Mentor Tahlili</h4>
                  <div className="bg-indigo-900/20 p-6 rounded-3xl border border-indigo-500/20 italic text-indigo-200">"{reviewResult.result}"</div>
                  <div className="bg-rose-900/10 p-6 rounded-3xl border border-rose-500/10 text-rose-300 text-sm">{reviewResult.errors}</div>
               </div>
             </div>
             <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex gap-10 text-center">
                  <div>
                    <div className="text-4xl font-black text-indigo-400">{reviewResult.grade}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-600">AI Ball</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-emerald-400">{reviewResult.adminGrade || '--'}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-600">Admin Ball</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <input type="number" placeholder="Ball..." className="w-32 bg-slate-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600" id="grade-input" />
                  <button onClick={() => {
                    const val = parseInt((document.getElementById('grade-input') as HTMLInputElement).value);
                    if(!isNaN(val)) { onGrade(reviewResult.id, val); setReviewResult(null); }
                  }} className="bg-indigo-600 px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition">Baholash</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;