
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
      const q = await generateQuiz(subject, "Intermediate");
      setQuestions(q);
      setLoading(false);
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
    <div className="flex flex-col items-center justify-center p-20 bg-white/10 backdrop-blur-xl rounded-[3rem] border border-white/20 animate-pulse">
      <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-indigo-400 font-black uppercase tracking-widest text-xs">AI Quiz generatsiya qilmoqda...</p>
    </div>
  );

  const q = questions[currentIdx];

  return (
    <div className="max-w-3xl mx-auto bg-slate-900/90 backdrop-blur-3xl p-10 rounded-[3.5rem] border border-white/10 shadow-2xl animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5"><i className="fas fa-gamepad text-[10rem] text-white"></i></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-10">
          <button onClick={onClose} className="text-slate-500 hover:text-white transition"><i className="fas fa-times"></i></button>
          <div className="bg-white/5 px-4 py-2 rounded-xl text-xs font-black text-indigo-400 border border-white/5">
            SAVOL {currentIdx + 1} / {questions.length}
          </div>
          <div className="text-emerald-400 font-black">Ball: {score}</div>
        </div>

        <h3 className="text-2xl font-black text-white mb-10 leading-tight">{q.question}</h3>

        <div className="grid grid-cols-1 gap-4 mb-10">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className={`p-6 rounded-2xl text-left font-bold transition-all border-2 ${
                showFeedback 
                  ? i === q.correctAnswer 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                    : i === selected ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-white/5 border-white/5 text-slate-500'
                  : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-indigo-500'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center text-xs">{String.fromCharCode(65 + i)}</span>
                {opt}
              </div>
            </button>
          ))}
        </div>

        {showFeedback && (
          <div className="animate-fade-in">
            <div className="p-6 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-8">
              <p className="text-sm text-indigo-200 leading-relaxed italic">"{q.explanation}"</p>
            </div>
            <button 
              onClick={nextQuestion}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition shadow-2xl shadow-indigo-500/20"
            >
              {currentIdx === questions.length - 1 ? 'Natijani ko\'rish' : 'Keyingi savol'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizArena;
