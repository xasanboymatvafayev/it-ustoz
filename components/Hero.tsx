
import React, { useState } from 'react';

interface HeroProps {
  onStart: (name: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onStart }) => {
  const [name, setName] = useState('');

  return (
    <div className="relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
          Vazifalaringizni <span className="text-indigo-600">AI Ustoz</span> bilan tekshiring!
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mb-10">
          Matematika, Ingliz tili va Ona tilidan topshiriqlaringizni yuklang. 
          Bir necha soniyada xatolar tushuntirilishi, to'g'ri yechim va bahoni oling.
        </p>
        
        <div className="w-full max-w-md bg-white p-2 rounded-2xl shadow-xl border border-gray-100 flex flex-col sm:flex-row gap-2">
          <input 
            type="text" 
            placeholder="Ismingizni kiriting..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-grow px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
          />
          <button 
            disabled={!name.trim()}
            onClick={() => onStart(name)}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Boshlash
          </button>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-4xl">
          <div className="p-6 bg-indigo-50 rounded-2xl">
            <i className="fas fa-bolt text-indigo-600 text-3xl mb-4"></i>
            <h3 className="font-bold text-lg mb-2">Tezkor Feedback</h3>
            <p className="text-gray-600 text-sm">Vazifa yuborilgandan so'ng darhol natijani oling.</p>
          </div>
          <div className="p-6 bg-green-50 rounded-2xl">
            <i className="fas fa-heart text-green-600 text-3xl mb-4"></i>
            <h3 className="font-bold text-lg mb-2">Muloyim Yondashuv</h3>
            <p className="text-gray-600 text-sm">Hech qanday tanqid yo'q, faqat rag'bat va yordam.</p>
          </div>
          <div className="p-6 bg-orange-50 rounded-2xl">
            <i className="fas fa-wallet text-orange-600 text-3xl mb-4"></i>
            <h3 className="font-bold text-lg mb-2">Bepul va Oson</h3>
            <p className="text-gray-600 text-sm">Repetitorga pul sarflash shart emas.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
