import React, { useState, useEffect } from 'react';
import { Award, Shield, Star, Zap, Target, Heart, Users } from 'lucide-react';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

const Badges: React.FC = () => {
  const { theme } = useTheme();
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserBadges(data.badges || []);
          setUserRole(data.role || 'student');
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, []);

  const badgeDefinitions = [
    { id: 'pioneer', name: 'Early Adopter', icon: Zap, color: 'text-yellow-400', description: 'Joined CollabUp during the beta phase.' },
    { id: 'collaborator', name: 'Top Collaborator', icon: Users, color: 'text-blue-400', description: 'Participated in 5+ successful projects.' },
    { id: 'mentor_star', name: 'Expert Guide', icon: Star, color: 'text-purple-400', description: 'Received a 5-star rating from 10+ mentees.', role: 'mentor' },
    { id: 'innovator', name: 'Product Builder', icon: Target, color: 'text-pink-400', description: 'Launched a project that reached 100+ users.' },
    { id: 'helper', name: 'Community Hero', icon: Heart, color: 'text-red-400', description: 'Answered 50+ questions in the community forum.' },
    { id: 'certified', name: 'Verified Expert', icon: Shield, color: 'text-green-400', description: 'Completed the background verification process.' },
  ];

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen transition-colors duration-500 ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-20 px-6 transition-colors duration-500 ${
      theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-20 animate-fade-in">
          <div className="flex items-center gap-6">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-xl animate-scale-in transition-colors duration-500 ${
              theme === 'dark' ? 'bg-yellow-900/30 shadow-yellow-500/10' : 'bg-yellow-100 shadow-yellow-500/10'
            }`}>
              <Award className="w-10 h-10 text-yellow-600" />
            </div>
            <div>
              <h1 className={`text-5xl font-black tracking-tight transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Your Achievements</h1>
              <p className={`text-xl font-medium mt-2 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Unlock badges by contributing to the community.</p>
            </div>
          </div>
          <div className={`px-8 py-4 rounded-[1.5rem] shadow-sm border animate-fade-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'
          }`} style={{ animationDelay: '200ms' }}>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Badges Earned</div>
            <div className="text-3xl font-black text-blue-600">{userBadges.length} / {badgeDefinitions.length}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-fade-in" style={{ animationDelay: '400ms' }}>
          {badgeDefinitions
            .filter(b => !b.role || b.role === userRole)
            .map((badge, index) => {
              const isEarned = userBadges.includes(badge.id);
              return (
                <div 
                  key={badge.id} 
                  className={`relative p-10 rounded-[2.5rem] border transition-all duration-500 group overflow-hidden animate-scale-in ${
                    isEarned 
                      ? theme === 'dark'
                        ? 'bg-slate-900/50 border-slate-800 shadow-xl shadow-blue-500/10'
                        : 'bg-white border-slate-100 shadow-xl shadow-blue-500/5'
                      : theme === 'dark'
                        ? 'bg-slate-900/20 border-slate-800/50 opacity-40'
                        : 'bg-slate-100/50 border-slate-200 opacity-60'
                  }`}
                  style={{ animationDelay: `${500 + index * 100}ms` }}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-20 transition-all duration-500 group-hover:scale-150 ${isEarned ? 'bg-blue-600' : 'bg-slate-400'}`} />
                  
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 ${
                    isEarned 
                      ? theme === 'dark' ? 'bg-slate-950 shadow-inner' : 'bg-slate-50 shadow-inner'
                      : theme === 'dark' ? 'bg-slate-950' : 'bg-slate-200'
                  }`}>
                    <badge.icon className={`w-8 h-8 ${isEarned ? theme === 'dark' ? badge.color : badge.color.replace('400', '600') : 'text-slate-400'}`} />
                  </div>

                  <h3 className={`text-2xl font-bold mb-4 transition-colors duration-500 ${isEarned ? theme === 'dark' ? 'text-white' : 'text-slate-900' : 'text-slate-500'}`}>{badge.name}</h3>
                  <p className={`text-lg leading-relaxed mb-8 transition-colors duration-500 ${isEarned ? theme === 'dark' ? 'text-slate-400' : 'text-slate-600' : 'text-slate-400'}`}>{badge.description}</p>
                  
                  {isEarned ? (
                    <div className={`flex items-center gap-3 font-bold w-fit px-5 py-2 rounded-full text-sm transition-colors duration-500 ${
                      theme === 'dark' ? 'text-emerald-400 bg-emerald-900/30' : 'text-emerald-600 bg-emerald-50'
                    }`}>
                      <div className={`w-2 h-2 rounded-full animate-pulse ${theme === 'dark' ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
                      Unlocked
                    </div>
                  ) : (
                    <div className={`flex items-center gap-3 font-bold w-fit px-5 py-2 rounded-full text-sm transition-colors duration-500 ${
                      theme === 'dark' ? 'text-slate-500 bg-slate-950/50' : 'text-slate-400 bg-slate-200/50'
                    }`}>
                      Locked
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default Badges;
