
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

type ViewState = 'dashboard' | 'courses' | 'tasks' | 'results' | 'profile' | 'admin' | 'chat';

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
  
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
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
    const interval = setInterval(syncData, 5000);
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
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-white rounded-full animate-spin"></div>
      <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.5em] animate-pulse">Sovereign Engine Loading...</p>
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
    } else alert("Kod xato!");
  }} onCancel={() => setAuthStep('auth')} />;

  const isUserAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#020617] flex font-sans">
      {/* Modern Sidebar Nav */}
      <aside className="w-72 h-screen sticky top-0 bg-[#020617] border-r border-white/5 flex flex-col py-8 px-6 z-50">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <i className="fas fa-brain"></i>
          </div>
          <span className="text-xl font-black text-white tracking-tighter uppercase">AI Ustoz</span>
        </div>

        <nav className="flex-grow space-y-2">
          <SidebarItem icon="fa-home" label="Dashboard" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <SidebarItem icon="fa-layer-group" label="Kurslarim" active={currentView === 'courses'} onClick={() => setCurrentView('dashboard')} />
          <SidebarItem icon="fa-chart-pie" label="Analitika" active={currentView === 'profile'} onClick={() => setCurrentView('profile')} />
          {isUserAdmin && <SidebarItem icon="fa-shield-halved" label="Admin Portal" color="text-rose-500" active={currentView === 'admin'} onClick={() => setCurrentView('admin')} />}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 font-bold uppercase">
               {currentUser?.firstName?.[0] || '?'}
             </div>
             <div className="overflow-hidden">
                <p className="text-xs font-black text-white truncate">{currentUser?.firstName || 'User'}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{currentUser?.role}</p>
             </div>
          </div>
          <button onClick={handleLogout} className="w-full py-4 text-slate-600 hover:text-rose-500 transition text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3">
            <i className="fas fa-power-off"></i> Chiqish
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-10 overflow-y-auto">
        {currentView === 'dashboard' && currentUser && (
          <UserDashboard 
            user={currentUser} 
            courses={courses} 
            tasks={tasks} 
            results={results}
            requests={requests}
            onEnroll={async (cId) => {
              const r: EnrollmentRequest = { id: Math.random().toString(36).substr(2, 9), userId: currentUser.id, userName: currentUser.firstName, courseId: cId, courseTitle: courses.find(c => c.id === cId)?.title || '', status: 'pending' };
              await api.saveRequest(r);
              await syncData();
              alert("A'zolik so'rovi yuborildi!");
            }}
            onTaskSubmit={async (res) => {
              await api.saveResult(res);
              await syncData();
            }}
          />
        )}
        {currentView === 'profile' && currentUser && <ProfileView user={currentUser} results={results} courses={courses} onUpdateUser={(u) => setCurrentUser(u)} />}
        {currentView === 'admin' && isUserAdmin && (
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

const SidebarItem = ({ icon, label, active, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
  >
    <i className={`fas ${icon} text-lg ${color || (active ? 'text-white' : 'text-slate-600 group-hover:text-indigo-400')}`}></i>
    <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
