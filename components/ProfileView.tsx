
import React, { useMemo, useRef } from 'react';
import { TaskResult, User, Course } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/apiService';

interface ProfileViewProps {
  user: User;
  results: TaskResult[];
  courses: Course[];
  onUpdateUser?: (updatedUser: User) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, results, courses, onUpdateUser }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userResults = results.filter(r => r.userId === user.id);
  
  const stats = useMemo(() => {
    if (userResults.length === 0) return { avg: 0, total: 0, chartData: [] };
    const avg = userResults.reduce((acc, r) => acc + r.grade, 0) / userResults.length;
    const chartData = [...userResults].sort((a, b) => a.timestamp - b.timestamp).slice(-10).map((r, i) => ({
      name: `V${i+1}`, grade: r.grade
    }));
    return { avg, total: userResults.length, chartData };
  }, [userResults]);

  const ranking = useMemo(() => {
    const courseRankings: Record<string, { userName: string, totalScore: number }[]> = {};
    courses.forEach(course => {
      const courseResults = results.filter(r => r.courseId === course.id);
      const userScores: Record<string, number> = {};
      courseResults.forEach(r => {
        userScores[r.userName] = (userScores[r.userName] || 0) + r.grade;
      });
      courseRankings[course.id] = Object.entries(userScores)
        .map(([userName, totalScore]) => ({ userName, totalScore }))
        .sort((a, b) => b.totalScore - a.totalScore);
    });
    return courseRankings;
  }, [results, courses]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const updatedUser = { ...user, avatar: base64 };
        await api.updateUser(updatedUser);
        if (onUpdateUser) onUpdateUser(updatedUser);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
        <div 
          onClick={handleAvatarClick}
          className="relative group cursor-pointer w-24 h-24 shrink-0"
        >
          {user.avatar ? (
            <img src={user.avatar} className="w-24 h-24 rounded-3xl object-cover shadow-xl border-4 border-white" alt="Avatar" />
          ) : (
            <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-xl">
              {user.firstName[0]}
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <i className="fas fa-camera text-white"></i>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>

        <div className="text-center md:text-left flex-grow">
          <h2 className="text-3xl font-black text-slate-800">{user.firstName} {user.lastName}</h2>
          <p className="text-slate-400 font-bold">{user.grade}-sinf • {user.email}</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-6 py-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="text-emerald-600 text-2xl font-black">{stats.avg.toFixed(0)}</div>
            <div className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">O'rtacha Ball</div>
          </div>
          <div className="text-center px-6 py-4 bg-blue-50 rounded-2xl border border-blue-100">
            <div className="text-blue-600 text-2xl font-black">{stats.total}</div>
            <div className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Vazifalar</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
            <i className="fas fa-chart-line text-indigo-600"></i> O'zlashtirish
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" hide />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="grade" stroke="#4F46E5" strokeWidth={4} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
            <i className="fas fa-trophy text-orange-500"></i> Kurslar Reytingi
          </h3>
          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {courses.filter(c => user.enrolledCourses.includes(c.id)).map(course => (
              <div key={course.id} className="space-y-3">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">{course.title}</div>
                <div className="space-y-2">
                  {ranking[course.id]?.slice(0, 5).map((entry, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${entry.userName === `${user.firstName} ${user.lastName}` ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-300 w-4">{idx + 1}</span>
                        <span className="text-sm font-bold text-slate-700">{entry.userName}</span>
                      </div>
                      <span className="text-sm font-black text-indigo-600">{entry.totalScore} <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">Ball</span></span>
                    </div>
                  ))}
                  {!ranking[course.id] && <div className="text-center py-4 text-xs text-slate-300">Hali natijalar yo'q</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
