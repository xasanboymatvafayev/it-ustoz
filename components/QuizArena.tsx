
import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '../types';
import { generateQuiz } from '../services/geminiService';

interface QuizArenaProps {
  subject: string;
  onComplete: (score: number) => void;
  onClose: () => void;
}

const QuizArena: React.FC<QuizArenaProps> = ({ subject, onComplete, onClose }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const q = await generateQuiz(subject, "Advanced");
        setQuestions(q);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [subject]);

  const handleAnswer = (idx: number) => {
    if (showFeedback) return;
    setSelected(idx);
    setShowFeedback(true);
    if (idx === questions[currentIdx].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(c => c + 1);
      setSelected(null);
      setShowFeedback(false);
    } else {
      onComplete(score);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 bg-white/5 rounded-[4rem] border border-white/5">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Neural Questions Generating...</p>
    </div>
  );

  if (questions.length === 0) return (
    <div className="text-center p-20 text-white">
       <p>Xatolik yuz berdi. Iltimos qayta urining.</p>
       <button onClick={onClose} className="mt-4 text-indigo-400 underline">Yopish</button>
    </div>
  );

  const q = questions[currentIdx];

  return (
    <div className="max-w-3xl mx-auto bg-slate-900/90 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/10 shadow-2xl animate-fade-in relative">
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-12">
          <div className="px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
            Brain Battle: {currentIdx + 1} / {questions.length}
          </div>
          <div className="text-emerald-400 font-black text-xl tracking-tighter">SCORE: {score}</div>
        </div>

        <h3 className="text-3xl font-black text-white mb-10 leading-tight">{q.question}</h3>

        <div className="grid grid-cols-1 gap-4 mb-10">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className={`p-6 rounded-2xl text-left font-bold transition-all border-2 ${
                showFeedback 
                  ? i === q.correctAnswer 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                    : i === selected ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-white/5 border-white/5 text-slate-600 opacity-50'
                  : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-indigo-500'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-xs font-black">{String.fromCharCode(65 + i)}</span>
                {opt}
              </div>
            </button>
          ))}
        </div>

        {showFeedback && (
          <div className="animate-fade-in space-y-6">
            <div className="p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
              <p className="text-sm text-indigo-200/70 italic leading-relaxed">"{q.explanation}"</p>
            </div>
            <button 
              onClick={nextQuestion}
              className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-lg hover:bg-indigo-700 transition shadow-2xl shadow-indigo-600/30 uppercase tracking-widest"
            >
              {currentIdx === questions.length - 1 ? 'Finish Match' : 'Next Battle'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizArena;
