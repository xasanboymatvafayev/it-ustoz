import React, { useState, useEffect, useCallback } from 'react';
import { User, Course, EnrollmentRequest, CourseTask, TaskResult } from './types.ts';
import Auth from './components/Auth.tsx';
import Verification from './components/Verification.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import ProfileView from './components/ProfileView.tsx';
import UserDashboard from './components/UserDashboard.tsx';
import AdminLoginModal from './components/AdminLoginModal.tsx';
import { api } from './services/apiService.ts';
import { sendVerificationEmail } from './services/emailService.ts';

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
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile' | 'admin'>('dashboard');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const syncData = useCallback(async () => {
    try {
      const [u, c, t, r, req] = await Promise.all([
        api.getUsers().catch(() => []),
        api.getCourses().catch(() => []),
        api.getTasks().catch(() => []),
        api.getResults().catch(() => []),
        api.getRequests().catch(() => [])
      ]);

      setUsers(u || []);
      setCourses(c || []);
      setTasks(t || []);
      setResults(r || []);
      setRequests(req || []);
      
      const savedUserId = localStorage.getItem('it_academy_current_user_id');
      if (savedUserId && !currentUser) {
        const freshUser = (u || []).find((user: User) => user.id === savedUserId);
        if (freshUser) {
          setCurrentUser(freshUser);
          setAuthStep('app');
        }
      }
    } catch (e) {
      console.error("Sinxronizatsiya xatosi:", e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    syncData();
    const interval = setInterval(syncData, 5000); // Tezkor yangilanish (taymer uchun)
    return () => clearInterval(interval);
  }, [syncData]);

  const handleLogin = (un: string, pw: string) => {
    const found = users.find(u => u.username === un && u.password === pw);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('it_academy_current_user_id', found.id);
      setAuthStep('app');
      return true;
    }
    return false;
  };

  const handleRegister = async (newUser: User) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setVerificationCode(code);
    setPendingUser(newUser);
    setAuthStep('verify');
    await sendVerificationEmail(newUser.email, code, newUser.firstName);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('it_academy_current_user_id');
    setAuthStep('auth');
    setCurrentView('dashboard');
  };

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-white rounded-full animate-spin"></div>
      <p className="text-white font-black text-xs uppercase tracking-[0.5em] animate-pulse">Platforma yuklanmoqda...</p>
    </div>
  );

  if (authStep === 'auth') return (
    <>
      <Auth users={users} onLogin={handleLogin} onRegister={handleRegister} onAdminClick={() => setShowAdminModal(true)} isLoading={false} />
      {showAdminModal && <AdminLoginModal onCancel={() => setShowAdminModal(false)} onConfirm={(p) => {
        if (p === 'aiustoz') {
          const adminUser = users.find(u => u.role === 'admin') || users[0];
          if (adminUser) {
             setCurrentUser({...adminUser, role: 'admin'});
             localStorage.setItem('it_academy_current_user_id', adminUser.id);
             setAuthStep('app');
             setCurrentView('admin');
             setShowAdminModal(false);
          }
        } else alert("Parol xato!");
      }} />}
    </>
  );

  if (authStep === 'verify') return <Verification email={pendingUser?.email || ''} onVerify={async (c) => {
    if (c === verificationCode && pendingUser) {
      await api.registerUserLocal(pendingUser);
      setCurrentUser(pendingUser);
      localStorage.setItem('it_academy_current_user_id', pendingUser.id);
      setAuthStep('app');
    } else {
      alert("Kod xato!");
    }
  }} onCancel={() => setAuthStep('auth')} />;

  const isAdminView = currentView === 'admin' && currentUser?.role === 'admin';

  return (
    <div className={`min-h-screen ${isAdminView ? 'bg-black' : 'bg-[#020617]'} text-slate-300`}>
      <nav className="aether-glass sticky top-0 z-[100] px-8 py-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
          <div className={`w-10 h-10 ${isAdminView ? 'bg-rose-600' : 'bg-indigo-600'} rounded-xl flex items-center justify-center text-white shadow-2xl transition-all`}><i className={`fas ${isAdminView ? 'fa-shield-halved' : 'fa-brain'}`}></i></div>
          <span className="text-xl font-black text-white tracking-tighter">{isAdminView ? 'ADMIN PORTAL' : 'AI USTOZ'}</span>
        </div>
        
        <div className="flex items-center gap-10">
          {!isAdminView ? (
            <>
              <button onClick={() => setCurrentView('dashboard')} className={`text-[11px] font-black uppercase tracking-widest transition ${currentView === 'dashboard' ? 'text-indigo-400' : 'text-slate-500'}`}>Asosiy</button>
              <button onClick={() => setCurrentView('profile')} className={`text-[11px] font-black uppercase tracking-widest transition ${currentView === 'profile' ? 'text-indigo-400' : 'text-slate-500'}`}>Profil</button>
              {currentUser?.role === 'admin' && (
                <button onClick={() => setCurrentView('admin')} className="text-[11px] font-black uppercase tracking-widest text-rose-500">Boshqaruv</button>
              )}
            </>
          ) : (
            <button onClick={() => setCurrentView('dashboard')} className="text-[11px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-2">
              <i className="fas fa-sign-out-alt"></i> O'quvchi rejimiga o'tish
            </button>
          )}
          <div className="w-px h-6 bg-white/10 mx-2"></div>
          <button onClick={handleLogout} className="text-slate-600 hover:text-rose-500 transition text-sm"><i className="fas fa-power-off"></i></button>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12">
        {currentView === 'dashboard' && currentUser && (
          <UserDashboard 
            user={currentUser} courses={courses} tasks={tasks} requests={requests}
            onEnroll={async (cId) => {
              const r: EnrollmentRequest = { id: Math.random().toString(36).substr(2, 9), userId: currentUser.id, userName: currentUser.firstName, courseId: cId, courseTitle: courses.find(c => c.id === cId)?.title || '', status: 'pending' };
              await api.saveRequest(r);
              await syncData();
              alert("So'rov yuborildi.");
            }}
            onTaskSubmit={async (res) => {
              await api.saveResult(res);
              await syncData();
            }}
          />
        )}
        {currentView === 'profile' && currentUser && <ProfileView user={currentUser} results={results} courses={courses} onUpdateUser={(u) => setCurrentUser(u)} />}
        {currentView === 'admin' && currentUser?.role === 'admin' && (
          <AdminPanel 
            users={users} courses={courses} tasks={tasks} results={results} requests={requests}
            onAddCourse={async (c) => { await api.saveCourse(c); await syncData(); }}
            onAddTask={async (t) => { await api.saveTask(t); await syncData(); }}
            onApprove={async (id) => { await api.approveRequest(id); await syncData(); }}
            onGrade={async (id, g) => { await api.updateResult(id, g); await syncData(); }}
            onDeleteUserFromCourse={async (uId, cId) => { await api.deleteUserFromCourse(uId, cId); await syncData(); }}
          />
        )}
      </main>
    </div>
  );
};

export default App;