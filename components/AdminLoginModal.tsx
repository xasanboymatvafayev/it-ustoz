
import React, { useState } from 'react';

interface AdminLoginModalProps {
  onCancel: () => void;
  onConfirm: (password: string) => void;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onCancel, onConfirm }) => {
  const [password, setPassword] = useState('');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-fade-in border border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
            <i className="fas fa-lock"></i>
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">Admin Kirish</h3>
            <p className="text-xs text-slate-400">Parol: aiustoz</p>
          </div>
        </div>

        <input
          type="password"
          autoFocus
          placeholder="Maxfiy parolni kiriting..."
          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 mb-6"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onConfirm(password)}
        />

        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 bg-slate-100 text-slate-500 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition"
          >
            Bekor qilish
          </button>
          <button 
            onClick={() => onConfirm(password)}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition"
          >
            Kirish
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginModal;
