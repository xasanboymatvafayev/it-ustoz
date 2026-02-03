
/**
 * @file App.tsx
 * @description IT-Ustoz platformasining asosiy kirish nuqtasi.
 * Bu komponent barcha davlatlarni (state), navigatsiyani va autentifikatsiya mantiqini boshqaradi.
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

// Navigatsiya uchun turlar
type ViewState = 'dashboard' | 'courses' | 'tasks' | 'results' | 'profile' | 'admin' | 'settings';

/**
 * Platformaning asosiy komponenti
 */
const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [authStep, setAuthStep] = useState<'auth' | 'verify' | 'app'>('auth');
  const [verificationCode, setVerificationCode] = useState('');
  
  // Ma'lumotlar ombori
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<CourseTask[]>([]);
  const [results, setResults] = useState<TaskResult[]>([]);
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  
  // Interfeys holati
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);

  /**
   * Ma'lumotlarni markaziy serverdan sinxronizatsiya qilish
   */
  const syncData = useCallback(async () => {
    try {
      // Parallel ravishda barcha ma'lumotlarni yuklash
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
      
      // LocalStorage orqali foydalanuvchini qayta tiklash
      const savedUserId = localStorage.getItem('it_academy_current_user_id');
      if (savedUserId && !currentUser) {
        const freshUser = (u || []).find((user: User) => user.id === savedUserId);
        if (freshUser) {
          setCurrentUser(freshUser);
          setAuthStep('app');
        } else {
          // Agar foydalanuvchi bazada topilmasa, sessiyani tozalash
          localStorage.removeItem('it_academy_current_user_id');
        }
      }
    } catch (e) {
      console.error("Global sinxronizatsiya xatosi:", e);
    } finally {
      // Birinchi marta yuklanishni yakunlash
      setTimeout(() => setIsLoading(false), 800);
    }
  }, [currentUser]);

  // Effektlar
  useEffect(() => {
    syncData();
    // Real-time effekt uchun har 10 soniyada yangilash
    const interval = setInterval(syncData, 10000);
    return () => clearInterval(interval);
  }, [syncData]);

  /**
   * Tizimga kirish mantiqi
   */
  const handleLogin = (un: string, pw: string): boolean => {
    const found = users.find(u => u.username === un && u.password === pw);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('it_academy_current_user_id', found.id);
      setAuthStep('app');
      return true;
    }
    return false;
  };

  /**
   * Ro'yxatdan o'tish va verifikatsiya
   */
  const handleRegister = async (newUser: User) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setVerificationCode(code);
    setPendingUser(newUser);
    setAuthStep('verify');
    
    // Email jo'natish (Aether Email Engine)
    try {
      await sendVerificationEmail(newUser.email, code, newUser.firstName);
    } catch (err) {
      console.error("Verifikatsiya email xatosi:", err);
      alert("Email yuborishda xatolik. Iltimos qayta urining.");
    }
  };

  /**
   * Chiqish
   */
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('it_academy_current_user_id');
    setAuthStep('auth');
    setCurrentView('dashboard');
  };

  // Hisoblagichlar (Memoized)
  const stats = useMemo(() => {
    if (!currentUser) return { activeCourses: 0, completedTasks: 0 };
    return {
      activeCourses: currentUser.enrolledCourses?.length || 0,
      completedTasks: results.filter(r => r.userId === currentUser.id).length
    };
  }, [currentUser, results]);

  // Yuklanish holati interfeysi
  if (isLoading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-indigo-600/5 blur-[120px] rounded-full neural-pulse"></div>
      <div className="relative">
        <div className="w-24 h-24 border-8 border-indigo-600/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <i className="fas fa-brain text-white text-2xl animate-pulse"></i>
        </div>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-white font-black text-xl tracking-[0.2em] uppercase">AI Ustoz</h2>
        <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-[0.5em] animate-pulse">Sovereign OS Loading...</p>
      </div>
    </div>
  );

  // Autentifikatsiya bosqichi
  if (authStep === 'auth') return (
    <>
      <Auth 
        users={users} 
        onLogin={handleLogin} 
        onRegister={handleRegister} 
        onAdminClick={() => setShowAdminModal(true)} 
        isLoading={false} 
      />
      {showAdminModal && (
        <AdminLoginModal 
          onCancel={() => setShowAdminModal(false)} 
          onConfirm={(p) => {
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
          }} 
        />
      )}
    </>
  );

  // Verifikatsiya bosqichi
  if (authStep === 'verify') return (
    <Verification 
      email={pendingUser?.email || ''} 
      onVerify={async (c) => {
        if (c === verificationCode && pendingUser) {
          await api.registerUserLocal(pendingUser);
          setCurrentUser(pendingUser);
          localStorage.setItem('it_academy_current_user_id', pendingUser.id);
          setAuthStep('app');
        } else alert("Kod xato!");
      }} 
      onCancel={() => setAuthStep('auth')} 
    />
  );

  const isUserAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#020617] flex font-sans selection:bg-indigo-500/30">
      {/* --- GLOBAL SOVEREIGN SIDEBAR --- */}
      <aside className="w-80 h-screen sticky top-0 bg-[#020617]/80 backdrop-blur-xl border-r border-white/5 flex flex-col py-10 px-8 z-50">
        {/* Brand */}
        <div className="flex items-center gap-4 mb-16 px-2">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40 rotate-3">
            <i className="fas fa-brain text-xl"></i>
          </div>
          <div>
            <span className="text-2xl font-black text-white tracking-tighter uppercase leading-none block">AI Ustoz</span>
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">Sovereign v2.0</span>
          </div>
        </div>

        {/* Global Search Mock */}
        <div className="mb-10 relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
          <input 
            type="text" 
            placeholder="Qidiruv..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Navigation Engine */}
        <nav className="flex-grow space-y-3">
          <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 px-2">Main Menu</h4>
          <SidebarItem icon="fa-house" label="Dashboard" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <SidebarItem icon="fa-layer-group" label="Mening Kurslarim" active={currentView === 'courses'} onClick={() => { setCurrentView('dashboard'); /* Tab toggle logikasi */ }} />
          <SidebarItem icon="fa-chart-pie" label="Analitika" active={currentView === 'profile'} onClick={() => setCurrentView('profile')} />
          <SidebarItem icon="fa-gear" label="Sozlamalar" active={currentView === 'settings'} onClick={() => setCurrentView('profile')} />
          
          {isUserAdmin && (
            <div className="pt-6 space-y-3">
              <h4 className="text-[10px] font-black text-rose-500/50 uppercase tracking-widest mb-4 px-2">Security & Admin</h4>
              <SidebarItem icon="fa-shield-halved" label="Admin Portal" color="text-rose-500" active={currentView === 'admin'} onClick={() => setCurrentView('admin')} />
            </div>
          )}
        </nav>

        {/* User Artifact / Profile Summary */}
        <div className="mt-auto pt-10 border-t border-white/5 space-y-6">
          <div className="p-5 bg-gradient-to-br from-white/5 to-transparent rounded-3xl border border-white/5 flex items-center gap-4 group cursor-pointer hover:border-indigo-500/30 transition-all duration-500">
             <div className="relative">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-lg uppercase shadow-inner">
                  {currentUser?.firstName?.[0] || '?'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#020617] rounded-full"></div>
             </div>
             <div className="overflow-hidden">
                <p className="text-xs font-black text-white truncate group-hover:text-indigo-400 transition-colors">{currentUser?.firstName || 'O\'quvchi'} {currentUser?.lastName?.[0]}.</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{currentUser?.role || 'Guest'}</p>
             </div>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="w-full py-4 text-slate-500 hover:text-rose-500 transition-all text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 bg-white/2 rounded-2xl border border-white/2 hover:bg-rose-500/5 hover:border-rose-500/20"
          >
            <i className="fas fa-power-off text-[10px]"></i> Tizimdan Chiqish
          </button>
        </div>
      </aside>

      {/* --- MAIN STAGE --- */}
      <main className="flex-grow min-h-screen relative">
        {/* Page Background Decors */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 blur-[180px] rounded-full -mr-96 -mt-96 pointer-events-none"></div>
        
        <div className="p-12 max-w-[1600px] mx-auto relative z-10">
          {/* Header Action Bar */}
          <div className="flex justify-between items-center mb-16">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
                {currentView === 'dashboard' && "Sovereign Dashboard"}
                {currentView === 'profile' && "User Artifacts"}
                {currentView === 'admin' && "Neural Command Center"}
              </h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 bg-indigo-500 rounded-full"></span>
                Bugun: {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
               <button className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
                 <i className="fas fa-bell"></i>
               </button>
               <button onClick={() => setCurrentView('profile')} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all">
                 Profilni Ko'rish
               </button>
            </div>
          </div>

          {/* View Controller */}
          <section className="animate-fade-in">
            {currentView === 'dashboard' && currentUser && (
              <UserDashboard 
                user={currentUser} 
                courses={courses} 
                tasks={tasks} 
                results={results}
                requests={requests}
                onEnroll={async (cId) => {
                  const r: EnrollmentRequest = { 
                    id: Math.random().toString(36).substr(2, 9), 
                    userId: currentUser.id, 
                    userName: currentUser.firstName, 
                    courseId: cId, 
                    courseTitle: courses.find(c => c.id === cId)?.title || '', 
                    status: 'pending' 
                  };
                  await api.saveRequest(r);
                  await syncData();
                  alert("A'zolik so'rovi muvaffaqiyatli yuborildi!");
                }}
                onTaskSubmit={async (res) => {
                  await api.saveResult(res);
                  await syncData();
                }}
              />
            )}
            
            {currentView === 'profile' && currentUser && (
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
                onAddCourse={async (c) => { await api.saveCourse(c); await syncData(); }}
                onAddTask={async (t) => { await api.saveTask(t); await syncData(); }}
                onApprove={async (id) => { await api.approveRequest(id); await syncData(); }}
                onGrade={async (id, g) => { await api.updateResult(id, g); await syncData(); }}
                onDeleteUserFromCourse={async (uId, cId) => { await api.deleteUserFromCourse(uId, cId); await syncData(); }}
              />
            )}
          </section>
        </div>
      </main>
      
      {/* Global Toast / Overlay Placeholder */}
      <div id="sovereign-portal"></div>
    </div>
  );
};

/**
 * Sidebar tugmasi uchun yordamchi komponent
 */
const SidebarItem = ({ icon, label, active, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden ${
      active 
        ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' 
        : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
    }`}
  >
    {active && (
      <div className="absolute left-0 top-0 w-1.5 h-full bg-white rounded-r-full"></div>
    )}
    <i className={`fas ${icon} text-lg transition-transform duration-500 group-hover:scale-110 ${color || (active ? 'text-white' : 'text-slate-600 group-hover:text-indigo-400')}`}></i>
    <span className="text-[11px] font-black uppercase tracking-[0.2em]">{label}</span>
    
    {!active && (
      <i className="fas fa-chevron-right ml-auto text-[8px] opacity-0 group-hover:opacity-40 transition-opacity"></i>
    )}
  </button>
);

export default App;
