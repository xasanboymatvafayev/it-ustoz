
import React from 'react';
import { TaskResult } from '../types';

interface ResultViewProps {
  result: TaskResult;
  onReset: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ result, onReset }) => {
  const getGradeColor = (grade: number) => {
    if (grade >= 80) return 'text-emerald-500';
    if (grade >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64" cy="64" r="58"
              stroke="#F1F5F9" strokeWidth="10" fill="transparent"
            />
            <circle
              cx="64" cy="64" r="58"
              stroke="currentColor" strokeWidth="10" fill="transparent"
              strokeDasharray={364}
              strokeDashoffset={364 - (364 * result.grade) / 100}
              className={`${getGradeColor(result.grade)} transition-all duration-1000`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className={`text-3xl font-black ${getGradeColor(result.grade)}`}>{result.grade}</span>
            <span className="text-[10px] font-bold text-slate-300 uppercase">Score</span>
          </div>
        </div>
        
        <div className="text-center md:text-left flex-grow">
          <h2 className="text-2xl font-black text-slate-800 mb-2">Mentor Tahlili</h2>
          <p className="text-slate-500 leading-relaxed">{result.result}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-rose-500 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
            <i className="fas fa-bug"></i> Kamchiliklar & Xatolar
          </h3>
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{result.errors}</p>
        </section>

        <section className="bg-slate-900 p-6 rounded-3xl shadow-xl">
          <h3 className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
            <i className="fas fa-code"></i> Tavsiya etilgan yechim
          </h3>
          <div className="bg-slate-800 p-4 rounded-xl font-mono text-xs text-indigo-200 overflow-x-auto border border-slate-700">
            <pre>{result.solution}</pre>
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2">
          <h3 className="text-indigo-600 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
            <i className="fas fa-quote-left"></i> Mentor maslahati
          </h3>
          <p className="text-slate-700 text-sm leading-relaxed italic">"{result.explanation}"</p>
        </section>
      </div>

      <button
        onClick={onReset}
        className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
      >
        Navbatdagi topshiriq
      </button>
    </div>
  );
};

export default ResultView;
