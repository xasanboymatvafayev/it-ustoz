
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (name: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-blue-700 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl relative z-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg rotate-3">
            <i className="fas fa-graduation-cap text-indigo-600 text-4xl"></i>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">AI Ustoz</h1>
          <p className="text-indigo-100/70">Xush kelibsiz! Platformaga kiring</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-indigo-100 uppercase tracking-wider mb-2 ml-1">Foydalanuvchi ismi</label>
            <div className="relative">
              <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300"></i>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ismingiz..."
                className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-indigo-200/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-indigo-100 uppercase tracking-wider mb-2 ml-1">Parol</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300"></i>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-indigo-200/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-50 transition transform hover:-translate-y-1 active:translate-y-0 shadow-xl"
          >
            Tizimga kirish
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-indigo-100/50 text-sm italic">
            "Bilim - bu kuchdir"
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
