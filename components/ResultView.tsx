
import React, { useEffect, useRef } from 'react';
import { TaskResult } from '../types.ts';
import { translations, Lang } from '../translations';

interface ResultViewProps {
  lang: Lang;
  result: TaskResult;
  onReset: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ lang, result, onReset }) => {
  const t = translations[lang];
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (result.audioData && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Auto-play blocked"));
    }
  }, [result.audioData]);

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-indigo-500';
    if (grade >= 75) return 'text-emerald-500';
    if (grade >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="animate-fade-in space-y-10 max-w-6xl mx-auto pb-24">
      {/* Audio Engine */}
      {result.audioData && <audio ref={audioRef} src={`data:audio/pcm;base64,${result.audioData}`} className="hidden" />}

      {/* Sovereign Scorecard */}
      <div className="aether-card-dark p-12 rounded-[4rem] shadow-2xl border border-white/5 flex flex-col lg:flex-row items-center gap-16 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-600/30 blur-[120px] rounded-full neural-pulse"></div>
        
        <div className="relative shrink-0">
          <div className="w-56 h-56 rounded-full border-[12px] border-slate-800 flex items-center justify-center relative shadow-2xl">
            <svg className="w-full h-full absolute inset-0 transform -rotate-90">
              <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="12" fill="transparent"
                strokeDasharray={628} strokeDashoffset={628 - (628 * result.grade) / 100}
                className={`${getGradeColor(result.grade)} transition-all duration-1000 stroke-linecap-round`}
              />
            </svg>
            <div className="text-center relative z-10">
              <span className={`text-7xl font-black ${getGradeColor(result.grade)} tracking-tighter`}>{result.grade}</span>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">{t.iqIndex}</div>
            </div>
          </div>
          {result.audioData && (
            <button onClick={() => audioRef.current?.play()} className="absolute -bottom-4 -right-4 w-16 h-16 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
              <i className="fas fa-play text-xl ml-1"></i>
            </button>
          )}
        </div>

        <div className="text-center lg:text-left flex-grow space-y-4">
          <div className="flex items-center justify-center lg:justify-start gap-4 mb-2">
            <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">{t.taskVerified}</span>
            <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">{t.seniorAnalysis}</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">{t.mentorInsight}</h2>
          <p className="text-slate-400 text-xl font-medium leading-relaxed italic max-w-3xl">"{result.result}"</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Logic & Error Analysis */}
        <div className="lg:col-span-2 bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl">
           <h3 className="text-rose-500 font-black text-[10px] uppercase tracking-widest mb-8 flex items-center gap-4">
             <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center"><i className="fas fa-shield-virus"></i></div>
             {t.vulnerabilities}
           </h3>
           <p className="text-slate-600 text-lg leading-relaxed mb-8">{result.errors}</p>
           <div className="flex flex-wrap gap-3">
             {result.mistakePatterns?.map((p, i) => (
               <span key={i} className="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest shadow-lg transform hover:-translate-y-1 transition-all"># {p}</span>
             ))}
           </div>
        </div>

        {/* Cognitive Impact Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><i className="fas fa-brain text-[10rem]"></i></div>
           <h3 className="text-indigo-200 font-black text-[10px] uppercase tracking-widest mb-10">{t.growthImpact}</h3>
           <div className="space-y-8">
             <div>
               <div className="flex justify-between text-xs font-black uppercase mb-2"><span>{t.cognitiveGain}</span><span>{result.cognitiveImpact}/10</span></div>
               <div className="w-full h-2 bg-white/10 rounded-full"><div className="h-full bg-emerald-400 rounded-full" style={{width: `${result.cognitiveImpact*10}%`}}></div></div>
             </div>
             <div>
               <div className="flex justify-between text-xs font-black uppercase mb-2"><span>{t.marketBoost}</span><span>+{result.marketabilityBoost}%</span></div>
               <div className="w-full h-2 bg-white/10 rounded-full"><div className="h-full bg-pink-400 rounded-full" style={{width: `${result.marketabilityBoost*20}%`}}></div></div>
             </div>
           </div>
           <p className="mt-10 text-sm font-medium opacity-80 leading-relaxed italic">"Ushbu topshiriq sizni global mehnat bozoridagi raqobatbardoshligingizni sezilarli darajada oshirdi."</p>
        </div>

        {/* Ideal Solution - Dark Code Style */}
        <div className="lg:col-span-3 bg-slate-900 p-12 rounded-[4rem] shadow-2xl text-white border border-white/5">
           <div className="flex items-center justify-between mb-8">
             <h3 className="text-emerald-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-4">
               <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center"><i className="fas fa-code"></i></div>
               {t.optimizedSolution}
             </h3>
             <button className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Copy Artifact</button>
           </div>
           <div className="bg-slate-800/50 p-8 rounded-3xl font-mono text-sm text-indigo-200 overflow-x-auto border border-white/5 custom-scrollbar">
             <pre>{result.solution}</pre>
           </div>
           <div className="mt-10 p-8 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
             <h4 className="text-indigo-300 font-black text-[10px] uppercase tracking-widest mb-4">{t.architectureInsight}</h4>
             <p className="text-indigo-100/70 leading-relaxed text-lg font-medium italic">"{result.explanation}"</p>
           </div>
        </div>
      </div>

      <button onClick={onReset} className="w-full py-10 bg-slate-900 text-white font-black text-3xl rounded-[3rem] hover:bg-indigo-600 transition-all shadow-2xl transform active:scale-95 premium-shadow group">
        {t.unlockNext} <i className="fas fa-arrow-right ml-6 group-hover:translate-x-4 transition-all duration-500"></i>
      </button>
    </div>
  );
};

export default ResultView;
