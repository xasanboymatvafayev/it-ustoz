
/**
 * @file App.tsx
 * @description IT-Ustoz platformasining markaziy interfeysi. 
 * Bu komponent Netlify-da SPA sifatida ishlaydi va Railway-dagi backend bilan sinxronlashadi.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Course, EnrollmentRequest, CourseTask, TaskResult } from './types.ts';
import Auth from './components/Auth.tsx';
import Verification from './components/Verification.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import ProfileView from './components/ProfileView.tsx';
import UserDashboard from './components/UserDashboard.tsx';
import AdminLoginModal from './components/AdminLoginModal.tsx';
import { api } from './services/apiService.ts';
import { sendVerificationEmail } from './services/emailService.ts';

// Navigatsiya holatlari
type ViewState = 'dashboard' | 'courses' | 'analytics' | 'admin' | 'settings' | 'ai-lab';

/**
 * @component App
 */
const App: React.FC = () => {
  // --- STATE LAYER ---
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [authStep, setAuthStep] = useState<'auth' | 'verify' | 'app'>('auth');
  const [verificationCode, setVerificationCode] = useState('');
  
  // Data State
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<CourseTask[]>([]);
  const [results, setResults] = useState<TaskResult[]>([]);
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  
  // UI State
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);

  /**
   * @function syncPlatformData
   * @description Railway backend bilan barcha ma'lumotlarni parallel sinxronizatsiya qiladi.
   */
  const syncPlatformData = useCallback(async () => {
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
      
      // Sessiyani qayta tiklash
      const storedId = localStorage.getItem('it_academy_current_user_id');
      if (storedId && !currentUser) {
        const matchingUser = (u || []).find((user: User) => user.id === storedId);
        if (matchingUser) {
          setCurrentUser(matchingUser);
          setAuthStep('app');
        }
      }
    } catch (err) {
      console.error("[Sync Engine Error]:", err);
    } finally {
      setTimeout(() => setIsDataLoading(false), 600);
    }
  }, [currentUser]);

  // Effektlar: Ma'lumotlarni yuklash va real-time polling
  useEffect(() => {
    syncPlatformData();
    const pollInterval = setInterval(syncPlatformData, 15000); // Har 15 soniyada yangilash
    return () => clearInterval(pollInterval);
  }, [syncPlatformData]);

  // --- HANDLERS ---
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
    
    try {
      await sendVerificationEmail(newUser.email, code, newUser.firstName);
    } catch (e) {
      console.warn("Email service issues. Using console-code fallback.");
      console.log("Verification Code:", code);
    }
  };

  const handleAppLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('it_academy_current_user_id');
    setAuthStep('auth');
    setCurrentView('dashboard');
  };

  // --- RENDER LOGIC ---

  if (isDataLoading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-10">
      <div className="relative">
        <div className="w-24 h-24 border-t-4 border-indigo-600 border-r-4 border-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <i className="fas fa-brain text-white text-2xl"></i>
        </div>
      </div>
      <div className="text-center">
        <p className="text-white font-black text-xl tracking-[0.3em] uppercase mb-2">AI USTOZ</p>
        <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-[0.5em] animate-pulse">Sovereign OS Synchronizing...</p>
      </div>
    </div>
  );

  if (authStep === 'auth') return (
    <>
      <Auth 
        users={users} 
        onLogin={handleAuthLogin} 
        onRegister={handleAuthRegister} 
        onAdminClick={() => setShowAdminModal(true)} 
        isLoading={false} 
      />
      {showAdminModal && (
        <AdminLoginModal 
          onCancel={() => setShowAdminModal(false)} 
          onConfirm={(pass) => {
            if (pass === 'aiustoz') {
              const rootAdmin = users.find(u => u.role === 'admin') || users[0];
              if (rootAdmin) {
                setCurrentUser({...rootAdmin, role: 'admin'});
                localStorage.setItem('it_academy_current_user_id', rootAdmin.id);
                setAuthStep('app');
                setCurrentView('admin');
                setShowAdminModal(false);
              }
            } else alert("Invalid Passkey!");
          }}
        />
      )}
    </>
  );

  if (authStep === 'verify') return (
    <Verification 
      email={pendingUser?.email || ''} 
      onVerify={async (c) => {
        if (c === verificationCode && pendingUser) {
          await api.registerUserLocal(pendingUser);
          setCurrentUser(pendingUser);
          localStorage.setItem('it_academy_current_user_id', pendingUser.id);
          setAuthStep('app');
        } else alert("Muvaffaqiyatsiz verifikatsiya!");
      }} 
      onCancel={() => setAuthStep('auth')} 
    />
  );

  const isUserAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#020617] flex font-sans selection:bg-indigo-500/20">
      
      {/* --- SIDEBAR NAVIGATION (SOVEREIGN STYLE) --- */}
      <aside className={`h-screen sticky top-0 bg-[#020617] border-r border-white/5 flex flex-col transition-all duration-500 z-50 ${isSidebarOpen ? 'w-80 px-8 py-10' : 'w-20 px-4 py-10'}`}>
        
        {/* Branding Area */}
        <div className="flex items-center gap-4 mb-16">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/30 shrink-0">
            <i className="fas fa-brain text-xl"></i>
          </div>
          {isSidebarOpen && (
            <div className="overflow-hidden animate-fade-in">
              <span className="text-2xl font-black text-white tracking-tighter uppercase leading-none block">AI Ustoz</span>
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Digital Mentor v3</span>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-grow space-y-3">
          <SidebarBtn 
            icon="fa-house" label="Dashboard" 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')} 
            collapsed={!isSidebarOpen} 
          />
          <SidebarBtn 
            icon="fa-layer-group" label="My Modules" 
            active={currentView === 'courses'} 
            onClick={() => { setCurrentView('dashboard'); }} 
            collapsed={!isSidebarOpen} 
          />
          <SidebarBtn 
            icon="fa-chart-simple" label="Analytics" 
            active={currentView === 'analytics'} 
            onClick={() => setCurrentView('analytics')} 
            collapsed={!isSidebarOpen} 
          />
          <SidebarBtn 
            icon="fa-flask-vial" label="AI Research" 
            active={currentView === 'ai-lab'} 
            onClick={() => setCurrentView('dashboard')} 
            collapsed={!isSidebarOpen} 
          />
          
          {isUserAdmin && (
            <div className="pt-8 space-y-3">
              <p className={`text-[9px] font-black text-rose-500/50 uppercase tracking-[0.2em] px-2 mb-2 ${!isSidebarOpen && 'hidden'}`}>Authority</p>
              <SidebarBtn 
                icon="fa-shield-halved" label="Admin Portal" 
                color="text-rose-500" 
                active={currentView === 'admin'} 
                onClick={() => setCurrentView('admin')} 
                collapsed={!isSidebarOpen} 
              />
            </div>
          )}
        </nav>

        {/* Bottom Profile / Control */}
        <div className="mt-auto space-y-6">
          {isSidebarOpen ? (
            <div className="p-4 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-4 group cursor-pointer hover:border-indigo-500/30 transition-all">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-lg uppercase shadow-inner">
                {currentUser?.firstName?.[0] || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-white truncate">{currentUser?.firstName || 'User'}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sovereign Tier</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-lg">
                {currentUser?.firstName?.[0] || 'U'}
              </div>
            </div>
          )}

          <button 
            onClick={handleAppLogout} 
            className={`w-full py-4 rounded-2xl transition-all flex items-center gap-4 ${isSidebarOpen ? 'bg-rose-500/5 border border-rose-500/10 text-rose-500 px-6' : 'justify-center text-rose-500'}`}
          >
            <i className="fas fa-power-off text-sm"></i>
            {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest">Chiqish</span>}
          </button>
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full text-slate-600 hover:text-white transition-colors py-2"
          >
            <i className={`fas ${isSidebarOpen ? 'fa-angle-left' : 'fa-angle-right'}`}></i>
          </button>
        </div>
      </aside>

      {/* --- MAIN STAGE --- */}
      <main className="flex-grow p-10 relative overflow-y-auto custom-scrollbar">
        {/* Global Decor Decor */}
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-indigo-600/5 blur-[200px] rounded-full -mr-96 -mt-96 pointer-events-none"></div>

        <div className="max-w-[1600px] mx-auto animate-fade-in">
          {/* Header Action Bar */}
          <header className="flex justify-between items-center mb-16">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
                {currentView === 'dashboard' && 'Control Center'}
                {currentView === 'analytics' && 'Cognitive Artifacts'}
                {currentView === 'admin' && 'Sovereign Command'}
              </h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                Node Status: <span className="text-emerald-500">Synchronized</span>
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                <button className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white transition-all"><i className="fas fa-search"></i></button>
                <button className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white transition-all relative">
                   <i className="fas fa-bell"></i>
                   <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#020617]"></span>
                </button>
              </div>
              <button 
                onClick={() => setCurrentView('analytics')} 
                className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
              >
                Access Profile
              </button>
            </div>
          </header>

          {/* View Controller */}
          <section className="relative z-10">
            {currentView === 'dashboard' && currentUser && (
              <UserDashboard 
                user={currentUser} 
                courses={courses} 
                tasks={tasks} 
                results={results}
                requests={requests}
                onEnroll={async (cId) => {
                  const req: EnrollmentRequest = { 
                    id: `req_${Math.random().toString(36).substr(2, 9)}`, 
                    userId: currentUser.id, 
                    userName: currentUser.firstName, 
                    courseId: cId, 
                    courseTitle: courses.find(c => c.id === cId)?.title || '', 
                    status: 'pending' 
                  };
                  await api.saveRequest(req);
                  await syncPlatformData();
                  alert("Application sent to mentor.");
                }}
                onTaskSubmit={async (res) => {
                  await api.saveResult(res);
                  await syncPlatformData();
                }}
              />
            )}
            
            {currentView === 'analytics' && currentUser && (
              <ProfileView 
                user={currentUser} 
                results={results} 
                courses={courses} 
                onUpdateUser={(u) => setCurrentUser(u)} 
              />
            )}
            
            {currentView === 'admin' && isUserAdmin && (
              <AdminPanel 
                users={users} 
                courses={courses} 
                tasks={tasks} 
                results={results} 
                requests={requests}
                onAddCourse={async (c) => { await api.saveCourse(c); await syncPlatformData(); }}
                onAddTask={async (t) => { await api.saveTask(t); await syncPlatformData(); }}
                onApprove={async (id) => { await api.approveRequest(id); await syncPlatformData(); }}
                onGrade={async (id, g) => { await api.updateResult(id, g); await syncPlatformData(); }}
                onDeleteUserFromCourse={async (uId, cId) => { await api.deleteUserFromCourse(uId, cId); await syncPlatformData(); }}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

/**
 * @component SidebarBtn
 */
const SidebarBtn = ({ icon, label, active, onClick, color, collapsed }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center transition-all duration-300 group relative ${collapsed ? 'justify-center h-14' : 'px-6 py-4 rounded-2xl gap-5'} ${
      active 
        ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' 
        : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
    }`}
  >
    <i className={`fas ${icon} text-lg transition-transform group-hover:scale-110 ${color || (active ? 'text-white' : 'text-slate-600 group-hover:text-indigo-400')}`}></i>
    {!collapsed && (
      <span className="text-[11px] font-black uppercase tracking-[0.2em]">{label}</span>
    )}
    {active && !collapsed && <i className="fas fa-chevron-right ml-auto text-[8px] opacity-40"></i>}
    
    {/* Tooltip for collapsed state */}
    {collapsed && (
      <div className="absolute left-full ml-4 px-3 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100]">
        {label}
      </div>
    )}
  </button>
);

export default App;
