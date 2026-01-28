
import React, { useState, useEffect } from 'react';

interface VerificationProps {
  email: string;
  onVerify: (code: string) => void;
  onCancel: () => void;
}

const Verification: React.FC<VerificationProps> = ({ email, onVerify, onCancel }) => {
  const [code, setCode] = useState(['', '', '', '']);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Keyingi inputga avtomatik o'tish
    if (value && index < 3) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify(code.join(''));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl text-center border border-slate-100">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <i className="fas fa-envelope-open-text text-indigo-600 text-3xl"></i>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Emailni tasdiqlang</h2>
        <p className="text-slate-500 text-sm mb-10 leading-relaxed">
          Biz <span className="font-bold text-slate-700">{email}</span> manziliga 4 xonali kod yubordik. Kodni kiriting:
        </p>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-4 mb-10">
            {code.map((digit, i) => (
              <input
                key={i}
                id={`code-${i}`}
                type="text"
                maxLength={1}
                className="w-16 h-20 text-3xl font-black text-center bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white focus:outline-none transition"
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={code.some(d => !d)}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition disabled:opacity-50 shadow-xl shadow-indigo-100"
          >
            Tasdiqlash
          </button>
        </form>

        <button 
          onClick={onCancel}
          className="mt-6 text-sm text-slate-400 hover:text-slate-600 transition underline"
        >
          Ma'lumotlarni o'zgartirish
        </button>
      </div>
    </div>
  );
};

export default Verification;
