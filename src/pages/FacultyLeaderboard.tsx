import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { API_BASE_URL } from '../config/apiConfig';
import { useTheme } from '../context/ThemeContext';

const FacultyLeaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/faculty/leaderboard`);
        if (response.ok) {
          const data = await response.json();
          setLeaders(data.leaderboard);
        } else {
          console.error('Failed to fetch leaderboard');
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-500 py-12 px-6 ${
      theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
    }`}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl border transition-all duration-500 ${
            theme === 'dark' 
              ? 'bg-amber-900/30 text-amber-500 shadow-amber-500/10 border-amber-900/50' 
              : 'bg-amber-50 text-amber-500 shadow-amber-500/10 border-amber-100'
          }`}>
            <Trophy className="w-10 h-10" />
          </div>
          <h1 className={`text-5xl font-black mb-4 tracking-tight transition-colors duration-500 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            Faculty Leaderboard
          </h1>
          <p className={`text-lg font-medium max-w-2xl mx-auto transition-colors duration-500 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>Recognizing excellence in academic-industry collaboration and research guidance.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className={`font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Loading rankings...</p>
          </div>
        ) : (
          <div className={`rounded-[2.5rem] border overflow-hidden shadow-xl transition-all duration-500 ${
            theme === 'dark' 
              ? 'bg-slate-900 border-slate-800 shadow-blue-500/10' 
              : 'bg-white border-slate-100 shadow-blue-500/5'
          }`}>
            <div className={`px-10 py-6 border-b flex justify-between items-center transition-colors duration-500 ${
              theme === 'dark' ? 'border-slate-800 bg-slate-900/50' : 'border-slate-50 bg-slate-50/50'
            }`}>
              <span className={`font-black uppercase tracking-widest text-[10px] transition-colors duration-500 ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>Rank & Faculty</span>
              <span className={`font-black uppercase tracking-widest text-[10px] transition-colors duration-500 ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>Collaborations</span>
            </div>
            <div className={`divide-y transition-colors duration-500 ${theme === 'dark' ? 'divide-slate-800' : 'divide-slate-50'}`}>
              {leaders.length > 0 ? leaders.map((faculty, index) => (
                <div key={faculty.id} className={`px-10 py-8 flex items-center justify-between transition-all duration-500 group ${
                  theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                }`}>
                  <div className="flex items-center gap-8">
                    <RankIcon index={index} theme={theme} />
                    <div>
                      <h3 className={`text-xl font-black group-hover:text-blue-600 transition-colors duration-500 ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>{faculty.fullName}</h3>
                      <p className={`font-bold text-sm transition-colors duration-500 ${
                        theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                      }`}>{faculty.institute}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl border transition-all duration-500 ${
                    theme === 'dark'
                      ? 'bg-blue-900/30 border-blue-900/50 group-hover:bg-blue-600 group-hover:border-blue-600'
                      : 'bg-blue-50 border-blue-100 group-hover:bg-blue-600 group-hover:border-blue-600'
                  }`}>
                    <TrendingUp className={`w-5 h-5 transition-colors duration-500 ${
                      theme === 'dark' ? 'text-blue-400 group-hover:text-white' : 'text-blue-600 group-hover:text-white'
                    }`} />
                    <span className={`text-2xl font-black transition-colors duration-500 ${
                      theme === 'dark' ? 'text-blue-400 group-hover:text-white' : 'text-blue-600 group-hover:text-white'
                    }`}>{faculty.collabCount || 0}</span>
                  </div>
                </div>
              )) : (
                <div className="p-20 text-center">
                  <p className={`font-bold text-lg italic transition-colors duration-500 ${
                    theme === 'dark' ? 'text-slate-600' : 'text-slate-400'
                  }`}>No rankings data available yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RankIcon = ({ index, theme }: { index: number; theme: string }) => {
  if (index === 0) return <Medal className="w-10 h-10 text-yellow-400 transition-colors duration-500" />;
  if (index === 1) return <Medal className={`w-8 h-8 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-300'}`} />;
  if (index === 2) return <Medal className="w-8 h-8 text-orange-500 transition-colors duration-500" />;
  return <div className={`w-8 h-8 flex items-center justify-center font-bold text-xl transition-colors duration-500 ${
    theme === 'dark' ? 'text-slate-600' : 'text-slate-500'
  }`}>{index + 1}</div>;
};

export default FacultyLeaderboard;
