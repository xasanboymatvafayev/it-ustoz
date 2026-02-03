
import React, { useState } from 'react';

interface HeroProps {
  onStart: (name: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onStart }) => {
  const [name, setName] = useState('');

  return (
    <div className="relative overflow-hidden bg-[#020617] min-h-screen flex items-center justify-center p-6">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-indigo-600/20 blur-[150px] rounded-full neural-pulse"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-purple-600/20 blur-[150px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center text-center relative z-10">
        <div className="mb-8 px-4 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] animate-fade-in">
          Next-Gen Learning Ecosystem
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-none uppercase">
          Kelajakni <span className="text-gradient">AI Ustoz</span> Bilan Quring
        </h1>
        
        <p className="text-xl text-slate-400 max-w-3xl mb-12 font-medium leading-relaxed italic">
          "Biz shunchaki vazifa tekshirmaymiz, biz sizning intelektual salohiyatingizni dunyo standartlari darajasiga olib chiqamiz."
        </p>
        
        <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl p-2 rounded-[2rem] border border-white/10 flex flex-col sm:flex-row gap-2 shadow-2xl premium-shadow">
          <input 
            type="text" 
            placeholder="Ismingizni kiriting..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-grow px-8 py-5 rounded-[1.5rem] bg-transparent text-white border-none focus:ring-0 outline-none text-lg font-bold placeholder-slate-600"
          />
          <button 
            disabled={!name.trim()}
            onClick={() => onStart(name)}
            className="bg-indigo-600 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xl active:scale-95"
          >
            Boshlash <i className="fas fa-arrow-right ml-2"></i>
          </button>
        </div>

        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-10 w-full max-w-5xl">
          <FeatureCard icon="fa-bolt" title="Tezkor Tahlil" desc="Vazifa yuborilgandan so'ng 5 soniya ichida to'liq AI feedback oling." color="text-indigo-400" />
          <FeatureCard icon="fa-brain" title="Neural Feedback" desc="Xatolar shunchaki ko'rsatilmaydi, balki mantiqiy tushuntiriladi." color="text-purple-400" />
          <FeatureCard icon="fa-chart-line" title="O'sish Indeksi" desc="Sizning global bozordagi qiymatingizni real vaqtda hisoblab boramiz." color="text-emerald-400" />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, color }: any) => (
  <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all group">
    <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl mb-6 shadow-inner ${color} group-hover:scale-110 transition-transform`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <h3 className="font-black text-white text-lg mb-3 uppercase tracking-tight">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default Hero;
