
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Course, EnrollmentRequest, CourseTask, TaskResult } from './types.ts';
import Auth from './components/Auth.tsx';
import Verification from './components/Verification.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import ProfileView from './components/ProfileView.tsx';
import UserDashboard from './components/UserDashboard.tsx';
import AdminLoginModal from './components/AdminLoginModal.tsx';
import { api } from './services/apiService.ts';
import { sendVerificationEmail } from './services/emailService.ts';

type ViewState = 'dashboard' | 'courses' | 'analytics' | 'admin' | 'settings' | 'ai-lab';

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
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Bir vaqtning o'zida bir nechta sinxronizatsiya bo'lishini oldini olish uchun ref
  const isSyncingRef = useRef(false);

  const syncPlatformData = useCallback(async (isInitial = false) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    
    try {
      const [u, c, t, r, req] = await Promise.all([
        api.getUsers(), api.getCourses(), api.getTasks(), api.getResults(), api.getRequests()
      ]);
      
      if (u) setUsers(u);
      if (c) setCourses(c);
      if (t) setTasks(t);
      if (r) setResults(r);
      if (req) setRequests(req);
      
      if (isInitial) {
        const storedId = localStorage.getItem('it_academy_current_user_id');
        if (storedId) {
          const matchingUser = (u || []).find((user: User) => user.id === storedId);
          if (matchingUser) {
            setCurrentUser(matchingUser);
            setAuthStep('app');
          }
        }
      }
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setIsDataLoading(false);
      isSyncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    syncPlatformData(true);
    // Intervalni 30 soniyaga oshiramiz, bu Railway uyg'onishi uchun so'rovlar yig'ilib qolmasligini ta'minlaydi
    const poll = setInterval(() => syncPlatformData(false), 30000);
    return () => clearInterval(poll);
  }, [syncPlatformData]);

  const handleAuthLogin = (un: string, pw: string): boolean => {
    const found = users.find(u => u.username === un && u.password === pw);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('it_academy_current_user_id', found.id);
      setAuthStep('app');
      return true;
    }
    return false;
  };

  const handleAuthRegister = async (newUser: User) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setVerificationCode(code);
    setPendingUser(newUser);
    setAuthStep('verify');
    await sendVerificationEmail(newUser.email, code, newUser.firstName);
  };

  const handleAppLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('it_academy_current_user_id');
    setAuthStep('auth');
    setCurrentView('dashboard');
  };

  if (isDataLoading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6 text-center px-6">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <div className="space-y-2">
        <p className="text-white font-black text-xs uppercase tracking-[0.4em] animate-pulse">Sinxronizatsiya...</p>
        <p className="text-slate-500 text-[10px] uppercase font-bold max-w-xs">Backend uyg'onmoqda (Railway cold start). Iltimos biroz kuting.</p>
      </div>
    </div>
  );

  if (authStep === 'auth') return (
    <>
      <Auth users={users} onLogin={handleAuthLogin} onRegister={handleAuthRegister} onAdminClick={() => setShowAdminModal(true)} />
      {showAdminModal && (
        <AdminLoginModal onCancel={() => setShowAdminModal(false)} onConfirm={(pass) => {
          if (pass === 'aiustoz') {
            const admin = users.find(u => u.role === 'admin') || users[0];
            if (admin) {
              setCurrentUser({...admin, role: 'admin'});
              setAuthStep('app');
              setCurrentView('admin');
            }
            setShowAdminModal(false);
          } else alert("Parol noto'g'ri!");
        }} />
      )}
    </>
  );

  if (authStep === 'verify') return (
    <Verification email={pendingUser?.email || ''} onVerify={async (c) => {
      if (c === verificationCode && pendingUser) {
        await api.registerUserLocal(pendingUser);
        setCurrentUser(pendingUser);
        localStorage.setItem('it_academy_current_user_id', pendingUser.id);
        setAuthStep('app');
        syncPlatformData();
      } else alert("Kod xato!");
    }} onCancel={() => setAuthStep('auth')} />
  );

  return (
    <div className="min-h-screen bg-[#020617] flex font-sans">
      <aside className={`h-screen sticky top-0 bg-[#020617] border-r border-white/5 flex flex-col transition-all duration-300 z-50 ${isSidebarOpen ? 'w-72 px-6 py-10' : 'w-20 px-4 py-10'}`}>
        <div className="flex items-center gap-4 mb-12">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0"><i className="fas fa-brain"></i></div>
          {isSidebarOpen && <span className="text-xl font-black text-white uppercase tracking-tighter">AI Ustoz</span>}
        </div>

        <nav className="flex-grow space-y-2">
          <SidebarBtn icon="fa-house" label="Asosiy" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} collapsed={!isSidebarOpen} />
          <SidebarBtn icon="fa-layer-group" label="Kurslarim" active={currentView === 'courses'} onClick={() => { setCurrentView('dashboard'); }} collapsed={!isSidebarOpen} />
          <SidebarBtn icon="fa-chart-simple" label="Statistika" active={currentView === 'analytics'} onClick={() => setCurrentView('analytics')} collapsed={!isSidebarOpen} />
          {currentUser?.role === 'admin' && (
            <div className="pt-6">
              <SidebarBtn icon="fa-shield-halved" label="Admin Portal" color="text-rose-500" active={currentView === 'admin'} onClick={() => setCurrentView('admin')} collapsed={!isSidebarOpen} />
            </div>
          )}
        </nav>

        <div className="mt-auto space-y-4">
          <button onClick={handleAppLogout} className={`w-full py-3 rounded-xl flex items-center gap-3 transition-all ${isSidebarOpen ? 'bg-rose-500/10 text-rose-500 px-4' : 'justify-center text-rose-500'}`}>
            <i className="fas fa-power-off"></i>
            {isSidebarOpen && <span className="text-[10px] font-black uppercase">Chiqish</span>}
          </button>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full text-slate-600 hover:text-white transition-colors py-2">
            <i className={`fas ${isSidebarOpen ? 'fa-angle-left' : 'fa-angle-right'}`}></i>
          </button>
        </div>
      </aside>

      <main className="flex-grow p-10 relative overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">
              {currentView === 'dashboard' && 'Boshqaruv Markazi'}
              {currentView === 'analytics' && 'Mening Rivojlanishim'}
              {currentView === 'admin' && 'Admin Boshqaruvi'}
            </h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Status: <span className="text-emerald-500">Sinxronlangan</span></p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-white text-xs font-bold">
              {currentUser?.firstName} {currentUser?.lastName}
            </div>
          </div>
        </header>

        <section>
          {currentView === 'dashboard' && currentUser && (
            <UserDashboard 
              user={currentUser} courses={courses} tasks={tasks} results={results} requests={requests}
              onEnroll={async (cId) => {
                await api.saveRequest({ id: `req_${Date.now()}`, userId: currentUser.id, userName: currentUser.firstName, courseId: cId, courseTitle: courses.find(c => c.id === cId)?.title || '', status: 'pending' });
                syncPlatformData();
              }}
              onTaskSubmit={async (res) => { await api.saveResult(res); syncPlatformData(); }}
            />
          )}
          {currentView === 'analytics' && currentUser && <ProfileView user={currentUser} results={results} courses={courses} onUpdateUser={u => setCurrentUser(u)} />}
          {currentView === 'admin' && currentUser?.role === 'admin' && (
            <AdminPanel 
              users={users} courses={courses} tasks={tasks} results={results} requests={requests}
              onAddCourse={async c => { await api.saveCourse(c); syncPlatformData(); }}
              onAddTask={async t => { await api.saveTask(t); syncPlatformData(); }}
              onApprove={async id => { await api.approveRequest(id); syncPlatformData(); }}
              onGrade={async (id, g) => { await api.updateResult(id, { adminGrade: g, status: 'reviewed' }); syncPlatformData(); }}
              onDeleteUserFromCourse={async (uId, cId) => { await api.deleteUserFromCourse(uId, cId); syncPlatformData(); }}
            />
          )}
        </section>
      </main>
    </div>
  );
};

const SidebarBtn = ({ icon, label, active, onClick, color, collapsed }: any) => (
  <button onClick={onClick} className={`w-full flex items-center transition-all duration-200 group relative ${collapsed ? 'justify-center h-12' : 'px-4 py-3 rounded-xl gap-4'} ${active ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-white/5'}`}>
    <i className={`fas ${icon} text-lg ${color || (active ? 'text-white' : 'text-slate-600 group-hover:text-indigo-400')}`}></i>
    {!collapsed && <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>}
  </button>
);

export default App;
