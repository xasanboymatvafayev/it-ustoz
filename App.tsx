
import React, { useState, useEffect, useCallback } from 'react';
import { User, Course, EnrollmentRequest, CourseTask, TaskResult } from './types';
import Auth from './components/Auth';
import Verification from './components/Verification';
import AdminPanel from './components/AdminPanel';
import ProfileView from './components/ProfileView';
import UserDashboard from './components/UserDashboard';
import ParentDashboard from './components/ParentDashboard';
import AdminLoginModal from './components/AdminLoginModal';
import { api, isLiveDatabase } from './services/apiService';
import { sendVerificationEmail } from './services/emailService';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [authStep, setAuthStep] = useState<'auth' | 'verify' | 'app'>('auth');
  const [verificationCode, setVerificationCode] = useState('');
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<CourseTask[]>([]);
  const [results, setResults] = useState<TaskResult[]>([]);
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile' | 'admin' | 'parent'>('dashboard');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'live' | 'local'>('local');

  const syncData = useCallback(async () => {
    try {
      const [u, c, t, r, req] = await Promise.all([
        api.getUsers(), api.getCourses(), api.getTasks(), api.getResults(), api.getRequests()
      ]);
      setUsers(u); setCourses(c); setTasks(t); setResults(r); setRequests(req);
      setDbStatus(isLiveDatabase ? 'live' : 'local');
      
      const savedUserId = localStorage.getItem('it_academy_current_user_id');
      if (savedUserId && !currentUser) {
        const freshUser = u.find(user => user.id === savedUserId);
        if (freshUser) {
          setCurrentUser(freshUser);
          setAuthStep('app');
          if (freshUser.role === 'parent') setCurrentView('parent');
        }
      } else if (currentUser) {
        const freshUser = u.find(user => user.id === currentUser.id);
        if (freshUser) setCurrentUser(freshUser);
      }
    } catch (e) {
      console.log("Sinxronlashda xatolik.");
    }
  }, [currentUser]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await syncData();
      setIsLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (authStep === 'app') syncData();
    }, 5000);
    return () => clearInterval(interval);
  }, [authStep, syncData]);

  const handleRegister = async (newUser: User) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setVerificationCode(code);
    setPendingUser(newUser);
    setAuthStep('verify');
    await sendVerificationEmail(newUser.email, code, newUser.firstName);
  };

  const handleLogin = (un: string, pw: string) => {
    const found = users.find(u => u.username === un && u.password === pw);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('it_academy_current_user_id', found.id);
      setAuthStep('app');
      if (found.role === 'parent') setCurrentView('parent');
      return true;
    }
    return false;
  };

  const handleVerify = async (code: string) => {
    if (code === verificationCode && pendingUser) {
      await api.registerUserLocal(pendingUser);
      await syncData();
      setCurrentUser(pendingUser);
      localStorage.setItem('it_academy_current_user_id', pendingUser.id);
      setAuthStep('app');
      if (pendingUser.role === 'parent') setCurrentView('parent');
    } else {
      alert("Xato kod!");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('it_academy_current_user_id');
    setAuthStep('auth');
    setCurrentView('dashboard');
  };

  if (isLoading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-white rounded-full animate-spin"></div>
      <div className="text-center">
        <h2 className="text-white font-black text-xl tracking-tighter uppercase">AI Ustoz</h2>
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2 animate-pulse">Ma'lumotlar bazasi tekshirilmoqda...</p>
      </div>
    </div>
  );

  if (authStep === 'auth') return (
    <>
      <Auth users={users} onLogin={handleLogin} onRegister={handleRegister} onAdminClick={() => setShowAdminModal(true)} />
      {showAdminModal && <AdminLoginModal onCancel={() => setShowAdminModal(false)} onConfirm={(p) => {
        if (p === 'aiustoz') {
          if (currentUser) {
            const updated = {...currentUser, role: 'admin' as const};
            setCurrentUser(updated);
            setCurrentView('admin');
            setShowAdminModal(false);
          } else {
            alert("Iltimos, avval tizimga kiring.");
            setShowAdminModal(false);
          }
        } else alert("Parol xato!");
      }} />}
    </>
  );

  if (authStep === 'verify') return <Verification email={pendingUser?.email || ''} onVerify={handleVerify} onCancel={() => setAuthStep('auth')} />;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <nav className="bg-white border-b sticky top-0 z-[60] px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView(currentUser?.role === 'parent' ? 'parent' : 'dashboard')}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg rotate-3"><i className="fas fa-terminal text-sm"></i></div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-slate-800 tracking-tighter leading-none">AI ACADEMY</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-2 h-2 rounded-full ${dbStatus === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`}></div>
              <span className={`text-[8px] font-black uppercase tracking-widest ${dbStatus === 'live' ? 'text-emerald-600' : 'text-blue-600'}`}>
                {dbStatus === 'live' ? 'Cloud Sync On' : 'Local Storage DB'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {currentUser?.role === 'parent' ? (
            <button onClick={() => setCurrentView('parent')} className={`text-sm font-bold transition ${currentView === 'parent' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>Bolalarim</button>
          ) : (
            <>
              <button onClick={() => setCurrentView('dashboard')} className={`text-sm font-bold transition ${currentView === 'dashboard' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>Kurslar</button>
              <button onClick={() => setCurrentView('profile')} className={`text-sm font-bold transition ${currentView === 'profile' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>Profilim</button>
            </>
          )}
          {currentUser?.role === 'admin' && (
            <button onClick={() => setCurrentView('admin')} className={`text-sm font-bold transition ${currentView === 'admin' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>Admin Panel</button>
          )}
          <div className="h-8 w-px bg-slate-100 mx-2"></div>
          <button onClick={handleLogout} className="text-slate-300 hover:text-rose-500 transition"><i className="fas fa-power-off text-sm"></i></button>
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-8">
        {currentView === 'dashboard' && currentUser && (
          <UserDashboard 
            user={currentUser} courses={courses} tasks={tasks} requests={requests}
            onEnroll={async (cId) => {
              const r: EnrollmentRequest = { id: Math.random().toString(36).substr(2, 9), userId: currentUser.id, userName: currentUser.firstName, courseId: cId, courseTitle: courses.find(c => c.id === cId)?.title || '', status: 'pending' };
              await api.saveRequest(r);
              await syncData();
              alert("Kursga kirish so'rovi yuborildi!");
            }}
            onTaskSubmit={async (res) => {
              await api.saveResult(res);
              await syncData();
            }}
          />
        )}
        {currentView === 'profile' && currentUser && <ProfileView user={currentUser} results={results} courses={courses} onUpdateUser={setCurrentUser} />}
        {currentView === 'parent' && currentUser && <ParentDashboard parent={currentUser} students={users} results={results} courses={courses} />}
        {currentView === 'admin' && currentUser?.role === 'admin' && (
          <AdminPanel 
            users={users} courses={courses} tasks={tasks} results={results} requests={requests}
            onAddCourse={async (c) => { await api.saveCourse(c); await syncData(); }}
            onAddTask={async (t) => { await api.saveTask(t); await syncData(); }}
            onApprove={async (id) => { await api.approveRequest(id); await syncData(); }}
            onGrade={async (id, g) => { await api.updateResult(id, g); await syncData(); }}
            onDeleteUserFromCourse={async (uId, cId) => {
              await api.deleteUserFromCourse(uId, cId);
              await syncData();
            }}
          />
        )}
      </main>
    </div>
  );
};

export default App;
