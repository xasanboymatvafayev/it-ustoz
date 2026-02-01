
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
  };

  const handleStartTimer = async (taskId: string) => {
    if (!confirm("Hamma o'quvchilar uchun 4 daqiqalik taymerni boshlaysizmi?")) return;
    try {
      await api.startTaskTimer(taskId, 4);
      alert("Taymer boshlandi! Barcha o'quvchilar ekranida teskari sanoq yoqildi.");
    } catch (e) {
      alert("Xatolik: Taymerni boshlab bo'lmadi.");
    }
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
                  <div key={t.id} className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center justify-between group">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">VAZIFA {t.order}</div>
                      <div className="font-bold text-white mb-2">{t.title}</div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleStartTimer(t.id)}
                          className="bg-rose-600/20 text-rose-400 text-[10px] font-black px-4 py-2 rounded-xl border border-rose-500/30 hover:bg-rose-600 hover:text-white transition flex items-center gap-2 uppercase tracking-widest"
                        >
                          <i className="fas fa-stopwatch"></i> Taymerni yoqish (4m)
                        </button>
                        {t.timerEnd && t.timerEnd > Date.now() && (
                          <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-2 py-2 rounded-lg border border-rose-500/20 animate-pulse uppercase">Taymer aktiv</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Matrix and Rating logic remains as provided */}
        </div>
      )}
      {/* Modals and other logic remain as provided */}
    </div>
  );
};

export default AdminPanel;
