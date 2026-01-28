
import React, { useState } from 'react';
import { User } from '../types';
import { sendPasswordRecoveryEmail } from '../services/emailService';

interface AuthProps {
  users: User[];
  onLogin: (username: string, pass: string) => boolean;
  onRegister: (user: User) => void;
  onAdminClick: () => void;
  isLoading?: boolean;
}

const Auth: React.FC<AuthProps> = ({ users, onLogin, onRegister, onAdminClick, isLoading }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  // Explicitly type the role to avoid 'user' as const restriction
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    grade: 'Junior',
    email: '',
    parentPhone: '',
    role: 'user' as 'user' | 'parent'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      const success = onLogin(formData.username, formData.password);
      if (!success) alert("Login yoki parol xato!");
    } else if (mode === 'register') {
      onRegister({
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        enrolledCourses: []
      });
    } else {
      const user = users.find(u => u.email === formData.email);
      if (user) {
        alert("Ma'lumotlar emailingizga yuborildi!");
        await sendPasswordRecoveryEmail(user.email, user.username, user.password || '****');
        setMode('login');
      } else {
        alert("Bunday email ro'yxatdan o'tmagan!");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-1/2 h-1/2 bg-indigo-600/20 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 relative z-10 border border-white/20 animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl rotate-3">
            <i className="fas fa-terminal text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">IT Ustoz</h1>
          <p className="text-slate-500 font-medium">
            {mode === 'login' ? 'Tizimga kirish' : mode === 'register' ? 'Ro\'yxatdan o\'tish' : 'Parolni tiklash'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
              <button type="button" onClick={() => setFormData({...formData, role: 'user'})} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition ${formData.role === 'user' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>O'quvchi</button>
              <button type="button" onClick={() => setFormData({...formData, role: 'parent'})} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition ${formData.role === 'parent' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Ota-ona</button>
            </div>
          )}

          {mode !== 'forgot' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
              <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-600 outline-none transition" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
            </div>
          )}

          {mode === 'forgot' || mode === 'register' ? (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <input type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-600 outline-none transition" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          ) : null}

          {mode !== 'forgot' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Parol</label>
              <input type="password" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-600 outline-none transition" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          )}

          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Ism" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-600 outline-none" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                <input type="text" placeholder="Familiya" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-600 outline-none" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Telefon (Ota-ona uchun bog'lanish)</label>
                <input type="tel" placeholder="+998" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-600 outline-none" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} />
              </div>
            </>
          )}

          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg mt-4 active:scale-[0.98]">
            {isLoading ? 'Yuklanmoqda...' : (mode === 'login' ? 'Kirish' : mode === 'register' ? 'Ro\'yxatdan o\'tish' : 'Yuborish')}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-sm font-bold text-indigo-600 hover:underline">
            {mode === 'login' ? 'Hisobingiz yo\'qmi? Ro\'yxatdan o\'ting' : 'Hisobingiz bormi? Kiring'}
          </button>
          {mode === 'login' && (
            <button onClick={() => setMode('forgot')} className="text-xs text-slate-400 hover:text-indigo-600 transition">Parolni unutdingizmi?</button>
          )}
        </div>
      </div>
      <button onClick={onAdminClick} className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/10 transition-all z-50">
        <i className="fas fa-shield-halved text-sm"></i>
      </button>
    </div>
  );
};

export default Auth;
