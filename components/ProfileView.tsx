
import React, { useMemo } from 'react';
import { TaskResult, User, Course } from '../types';
// Fixed: Removed RadarChartProps which is not exported by recharts and was unused.
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

interface ProfileViewProps {
  user: User;
  results: TaskResult[];
  courses: Course[];
  // Added missing onUpdateUser prop to match its usage in App.tsx
  onUpdateUser: (user: User) => void;
}

// Fixed the component signature to include missing props: courses and onUpdateUser
const ProfileView: React.FC<ProfileViewProps> = ({ user, results, courses, onUpdateUser }) => {
  const userResults = results.filter(r => r.userId === user.id);

  const analytics = useMemo(() => {
    const avgScore = userResults.length ? userResults.reduce((a, b) => a + (b.adminGrade || b.grade), 0) / userResults.length : 0;
    const marketBoost = userResults.reduce((a, b) => a + (b.marketabilityBoost || 0), 0);
    
    const careerData = [
      { name: 'Frontend', level: 85 },
      { name: 'System Design', level: 60 },
      { name: 'Soft Skills', level: 75 },
      { name: 'AI Integration', level: 45 },
      { name: 'Logic', level: 90 }
    ];

    const weeklyProgress = [
      { day: 'Dush', val: 30 },
      { day: 'Sesh', val: 55 },
      { day: 'Chor', val: 45 },
      { day: 'Pay', val: 90 },
      { day: 'Jum', val: 100 },
      { day: 'Shan', val: 80 },
      { day: 'Yak', val: 40 }
    ];

    return { avgScore, marketBoost, careerData, weeklyProgress };
  }, [userResults]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-fade-in">
      {/* Sovereign Header */}
      <div className="aether-card-dark rounded-[4rem] p-12 text-white relative overflow-hidden premium-shadow">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 blur-[150px] neural-pulse rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
          <div className="relative group">
            <div className="w-48 h-48 rounded-[3rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1.5 rotate-3 group-hover:rotate-0 transition-all duration-700">
              <div className="w-full h-full rounded-[2.8rem] bg-slate-900 flex items-center justify-center overflow-hidden border-4 border-slate-900">
                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <span className="text-7xl font-black text-gradient">{user.firstName[0]}</span>}
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl">Verified Pro</div>
          </div>

          <div className="text-center lg:text-left space-y-4">
            <h1 className="text-6xl font-black tracking-tighter leading-none mb-4">{user.firstName} <span className="text-indigo-400">{user.lastName}</span></h1>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <span className="px-5 py-2 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2">
                <i className="fas fa-microchip text-indigo-400"></i> AI Knowledge Level: 14
              </span>
              <span className="px-5 py-2 bg-indigo-500/20 text-indigo-300 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                Unicorn Tier Architect
              </span>
            </div>
            <p className="text-slate-400 font-medium max-w-xl text-lg">"Global mehnat bozoridagi qiymatingiz o'tgan haftaga nisbatan <span className="text-emerald-400 font-bold">+{analytics.marketBoost.toFixed(1)}%</span> ga oshdi."</p>
          </div>

          <div className="flex-grow"></div>

          <div className="grid grid-cols-2 gap-6 w-full lg:w-auto">
            <div className="aether-glass p-8 rounded-[2.5rem] border border-white/5 text-center min-w-[160px]">
              <div className="text-5xl font-black text-indigo-400 mb-1">{analytics.avgScore.toFixed(0)}</div>
              <div className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">IQ Index</div>
            </div>
            <div className="aether-glass p-8 rounded-[2.5rem] border border-white/5 text-center min-w-[160px]">
              <div className="text-5xl font-black text-purple-400 mb-1">+{analytics.marketBoost.toFixed(0)}%</div>
              <div className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Value Gain</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Career Prediction Engine */}
        <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-2xl shadow-indigo-100/20">
          <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><i className="fas fa-briefcase"></i></div>
            Career Prediction
          </h3>
          <div className="space-y-6">
            {[
              { role: 'Fullstack Dev', val: 88, salary: '$4.5k' },
              { role: 'AI Engineer', val: 42, salary: '$8.2k' },
              { role: 'UI/UX Lead', val: 76, salary: '$3.2k' }
            ].map((p, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-slate-700">{p.role}</span>
                  <span className="text-xs font-black text-indigo-600">{p.salary} Potential</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000" style={{ width: `${p.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition shadow-xl">Get Full Audit Report</button>
        </div>

        {/* Neural Knowledge Brain (3D Visualization Simulation) */}
        <div className="lg:col-span-2 bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-10 flex items-center gap-4 text-indigo-400">
              <i className="fas fa-project-diagram"></i> Neural Knowledge Graph
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="85%" data={analytics.careerData}>
                  <PolarGrid stroke="#334155" strokeDasharray="5 5" />
                  <PolarAngleAxis dataKey="name" tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 900}} />
                  <Radar name="Expertise" dataKey="level" stroke="#6366f1" strokeWidth={3} fill="#6366f1" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-8 mt-6">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div> <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active Connections</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Growth Nodes</span></div>
            </div>
          </div>
        </div>

        {/* Global Marketability Scorecard */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl">
             <h3 className="text-xl font-black text-slate-800 mb-8">Weekly Cognitive Activity</h3>
             <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.weeklyProgress}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 800, fill: '#94A3B8'}} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="val" fill="#6366f1" radius={[10, 10, 10, 10]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[3.5rem] p-12 text-white shadow-2xl relative">
             <div className="absolute top-10 right-10">
               <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 flex items-center justify-center">
                 <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white"><i className="fas fa-check"></i></div>
               </div>
             </div>
             <h3 className="text-3xl font-black mb-6">Marketability Index</h3>
             <p className="text-slate-400 text-lg leading-relaxed mb-8">Sizning malakangiz hozirda <span className="text-white font-bold">AQSH va Yevropa</span> bozoridagi o'rtacha Senior darajasining 76% qismini qoplaydi.</p>
             <div className="grid grid-cols-2 gap-6">
               <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                 <div className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Global Rank</div>
                 <div className="text-2xl font-black">Top 4%</div>
               </div>
               <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                 <div className="text-xs font-black text-purple-400 uppercase tracking-widest mb-1">Employability</div>
                 <div className="text-2xl font-black">92 / 100</div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
