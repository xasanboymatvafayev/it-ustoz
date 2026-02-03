
import React, { useState } from 'react';
import { User, Course, CourseTask, TaskResult, Subject, SubjectType, EnrollmentRequest } from '../types';

interface AdminPanelProps {
  users: User[];
  courses: Course[];
  tasks: CourseTask[];
  results: TaskResult[];
  requests: EnrollmentRequest[];
  onAddCourse: (c: Course) => Promise<void>;
  onAddTask: (t: CourseTask) => Promise<void>;
  onApprove: (id: string) => Promise<void>;
  onGrade: (id: string, grade: number) => Promise<void>;
  onDeleteUserFromCourse: (uId: string, cId: string) => Promise<void>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, courses, tasks, results, requests, onAddCourse, onAddTask, onApprove, onGrade, onDeleteUserFromCourse }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'users' | 'requests'>('dashboard');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddTask, setShowAddTask] = useState<string | null>(null);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', subject: Subject.FRONTEND });
  const [newTask, setNewTask] = useState({ title: '', description: '', criteria: '' });

  const generateKey = () => Math.random().toString(36).substring(2, 11).toUpperCase() + Math.random().toString(36).substring(2, 11).toUpperCase();

  const handleAddCourse = async () => {
    const course: Course = {
      id: Math.random().toString(36).substr(2, 9),
      title: newCourse.title,
      description: newCourse.description,
      subject: newCourse.subject as SubjectType,
      teacher: "Senior Admin",
      secretKey: generateKey(),
      createdAt: Date.now()
    };
    await onAddCourse(course);
    setShowAddCourse(false);
    alert(`Kurs yaratildi! Secret Key: ${course.secretKey}`);
  };

  const handleAddTask = async (courseId: string) => {
    const task: CourseTask = {
      id: Math.random().toString(36).substr(2, 9),
      courseId,
      title: newTask.title,
      description: newTask.description,
      validationCriteria: newTask.criteria
    };
    await onAddTask(task);
    setShowAddTask(null);
    alert("Vazifa qo'shildi!");
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Admin <span className="text-indigo-500">System</span></h1>
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
          <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Stats</button>
          <button onClick={() => setActiveTab('courses')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase ${activeTab === 'courses' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Courses</button>
          <button onClick={() => setActiveTab('requests')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase ${activeTab === 'requests' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Requests</button>
          <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Users</button>
        </div>
      </div>

      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 gap-4">
          {requests.filter(r => r.status === 'pending').map(req => (
            <div key={req.id} className="bg-white/5 p-6 rounded-2xl border border-white/5 flex justify-between items-center">
              <div>
                <p className="text-white font-bold">{req.userName}</p>
                <p className="text-xs text-slate-500">{req.courseTitle}</p>
              </div>
              <button onClick={() => onApprove(req.id)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase">Approve</button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-8">
          <button onClick={() => setShowAddCourse(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase hover:bg-indigo-700 transition">
            + Yangi Kurs
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {courses.map(c => (
              <div key={c.id} className="aether-card-dark p-8 rounded-[3rem] border border-white/5 relative group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-white">{c.title}</h3>
                    <p className="text-xs text-indigo-400 font-bold font-mono tracking-widest mt-1">Key: {c.secretKey}</p>
                  </div>
                  <button onClick={() => setShowAddTask(c.id)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition"><i className="fas fa-plus"></i></button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Talabalar</h4>
                  {users.filter(u => u.enrolledCourses.includes(c.id)).map(u => (
                    <div key={u.id} className="flex justify-between items-center bg-white/2 p-3 rounded-xl border border-white/5">
                      <span className="text-xs font-bold text-white">{u.firstName} {u.lastName}</span>
                      <button onClick={() => onDeleteUserFromCourse(u.id, c.id)} className="text-rose-500 hover:scale-110 transition"><i className="fas fa-user-minus"></i></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddCourse && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="w-full max-w-xl bg-slate-900 border border-white/10 p-12 rounded-[3.5rem] shadow-2xl">
            <h3 className="text-3xl font-black text-white mb-8">Kurs Qo'shish</h3>
            <div className="space-y-6">
              <input onChange={e => setNewCourse({...newCourse, title: e.target.value})} placeholder="Kurs nomi" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500" />
              <textarea onChange={e => setNewCourse({...newCourse, description: e.target.value})} placeholder="Tavsif" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500" rows={3} />
              <select onChange={e => setNewCourse({...newCourse, subject: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500">
                {Object.values(Subject).map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
              </select>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowAddCourse(false)} className="flex-1 py-4 bg-white/5 text-slate-500 rounded-2xl font-black">Bekor qilish</button>
                <button onClick={handleAddCourse} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black">Yaratish</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="w-full max-w-xl bg-slate-900 border border-white/10 p-12 rounded-[3.5rem] shadow-2xl">
            <h3 className="text-3xl font-black text-white mb-4">Vazifa Yaratish</h3>
            <p className="text-slate-500 text-xs mb-8 italic">Vazifa sharti va kutilayotgan mantiqni belgilang.</p>
            <div className="space-y-6">
              <input onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="Vazifa nomi" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500" />
              <textarea onChange={e => setNewTask({...newTask, description: e.target.value})} placeholder="Vazifa sharti (O'quvchi ko'radigan matn)" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500" rows={3} />
              <textarea onChange={e => setNewTask({...newTask, criteria: e.target.value})} placeholder="Logic: AI qanday tekshirsin? (Masalan: a yuborilganda 12 chiqishi kerak)" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-indigo-300 outline-none focus:border-indigo-500 font-mono text-xs" rows={3} />
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowAddTask(null)} className="flex-1 py-4 bg-white/5 text-slate-500 rounded-2xl font-black">Bekor qilish</button>
                <button onClick={() => handleAddTask(showAddTask)} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black">Saqlash</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
