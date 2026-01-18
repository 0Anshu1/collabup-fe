import React, { useState, useEffect } from 'react';
import { Award, Star, TrendingUp, Users } from 'lucide-react';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

const ImpactAnalytics: React.FC = () => {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    hoursMentored: 0,
    menteesCount: 0,
    averageRating: 0,
    projectsGuided: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            const impact = data.impactStats || {};
            setStats({
              hoursMentored: impact.totalHours || 0,
              menteesCount: impact.menteesHelped || 0,
              averageRating: impact.rating || 0,
              projectsGuided: impact.projectsGuided || 0
            });
          }
        } catch (err) {
          console.error('Error fetching stats:', err);
        }
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-500 ${
      theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
    }`}>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className={`min-h-screen py-12 px-6 transition-colors duration-500 ${
      theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className={`text-5xl font-black mb-4 tracking-tight transition-colors duration-500 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            Impact Analytics
          </h1>
          <p className={`text-lg font-medium transition-colors duration-500 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>Measuring your contribution to the professional community</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard theme={theme} icon={TrendingUp} label="Hours Mentored" value={stats.hoursMentored} color="text-amber-500" bg={theme === 'dark' ? 'bg-amber-900/30' : 'bg-amber-50'} />
          <StatCard theme={theme} icon={Users} label="Mentees Reached" value={stats.menteesCount} color="text-blue-500" bg={theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50'} />
          <StatCard theme={theme} icon={Star} label="Avg Rating" value={stats.averageRating.toFixed(1)} color="text-emerald-500" bg={theme === 'dark' ? 'bg-emerald-900/30' : 'bg-emerald-50'} />
          <StatCard theme={theme} icon={Award} label="Projects Guided" value={stats.projectsGuided} color="text-blue-500" bg={theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50'} />
        </div>

        <div className={`rounded-[2.5rem] p-10 border shadow-xl transition-all duration-500 ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-blue-500/10' : 'bg-white border-slate-100 shadow-blue-500/5'
        }`}>
          <h2 className={`text-2xl font-black mb-8 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Mentorship Growth</h2>
          <div className={`h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-[2rem] transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <TrendingUp className={`w-12 h-12 mb-4 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-700' : 'text-slate-300'}`} />
            <p className={`font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>Visualization coming soon: Track your impact over time.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, bg, theme }: any) => (
  <div className={`p-8 rounded-[2rem] border transition-all duration-500 group ${
    theme === 'dark' 
      ? 'bg-slate-900 border-slate-800 shadow-sm hover:shadow-xl hover:shadow-blue-500/10' 
      : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5'
  }`}>
    <div className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
      <Icon className="w-7 h-7" />
    </div>
    <div className={`text-3xl font-black mb-1 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{value}</div>
    <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest transition-colors duration-500">{label}</div>
  </div>
);

export default ImpactAnalytics;
