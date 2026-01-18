import React, { useState, useEffect } from 'react';
import { UserCheck, Zap, Mail, ChevronRight, Star } from 'lucide-react';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { API_BASE_URL } from '../config/apiConfig';
import { useTheme } from '../context/ThemeContext';

const TalentMatches: React.FC = () => {
  const { theme } = useTheme();
  const [talents, setTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTalents = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();
        const response = await fetch(`${API_BASE_URL}/api/talent/matches`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTalents(data.matches);
        } else {
          console.error('Failed to fetch talent matches');
        }
      } catch (error) {
        console.error('Error fetching talent matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTalents();
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all duration-500 ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
      }`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          <p className={`font-bold animate-pulse ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Finding your perfect matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-12 px-6 transition-all duration-500 ${
      theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black uppercase tracking-wider mb-6 transition-all duration-500 ${
            theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
          }`}>
            <Zap size={16} />
            AI-Powered Recommendations
          </div>
          <h1 className={`text-6xl font-black mb-6 tracking-tight transition-all duration-500 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            Your Talent <span className="text-blue-600">Matches</span>
          </h1>
          <p className={`text-xl max-w-2xl mx-auto font-medium transition-all duration-500 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>Discover top students whose skills and interests perfectly align with your startup's needs.</p>
        </div>

        {/* Talent Grid */}
        <div className="grid grid-cols-1 gap-8">
          {talents.map((student, index) => (
            <div 
              key={student.id} 
              className={`rounded-[2.5rem] p-8 border transition-all duration-500 group flex flex-col md:flex-row items-center gap-8 relative overflow-hidden ${
                theme === 'dark' 
                  ? 'bg-slate-900/50 border-slate-800 hover:shadow-2xl hover:shadow-blue-500/20' 
                  : 'bg-white border-slate-100 hover:shadow-2xl hover:shadow-blue-500/10'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Match Percentage Badge */}
              <div className="absolute top-6 right-6 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full font-black text-sm shadow-lg shadow-blue-600/20">
                <Zap size={14} className="fill-white" />
                98% Match
              </div>

              {/* Avatar Section */}
              <div className="relative">
                <div className="w-40 h-40 bg-gradient-to-br from-blue-600 to-blue-400 rounded-[2.5rem] flex items-center justify-center text-5xl font-black text-white shadow-2xl shadow-blue-600/20 group-hover:scale-105 transition-transform duration-500">
                  {student.fullName?.charAt(0)}
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                  <h3 className={`text-3xl font-black transition-all duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{student.fullName}</h3>
                </div>

                <p className={`text-lg font-medium leading-relaxed mb-6 max-w-2xl transition-all duration-500 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {student.bio || "Passionate full-stack developer with experience in React and Node.js. Looking for opportunities to contribute to high-growth startups."}
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-8">
                  {student.skills?.slice(0, 5).map((skill: string, idx: number) => (
                    <span key={idx} className={`px-4 py-2 rounded-xl text-xs font-black border uppercase tracking-wider transition-all duration-500 ${
                      theme === 'dark' 
                        ? 'bg-slate-950 text-blue-400 border-blue-900/30' 
                        : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all duration-500 shadow-xl shadow-blue-600/20 active:scale-95 focus:ring-4 focus:ring-blue-500/50 outline-none">
                    <Mail size={20} />
                    Connect Now
                  </button>
                  <button className={`px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition-all duration-500 border focus:ring-4 focus:ring-blue-500/50 outline-none ${
                    theme === 'dark' 
                      ? 'bg-slate-900/50 border-slate-800 text-white hover:bg-slate-800' 
                      : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
                  }`}>
                    View Portfolio
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TalentMatches;
