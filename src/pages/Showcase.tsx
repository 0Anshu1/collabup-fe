import React, { useState, useEffect } from 'react';
import { Rocket, ExternalLink, Globe, Users, Target } from 'lucide-react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

const Showcase: React.FC = () => {
  const { theme } = useTheme();
  const [startups, setStartups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStartups = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'startup'));
        const snap = await getDocs(q);
        setStartups(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching startups:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStartups();
  }, []);

  return (
    <div className={`min-h-screen py-12 px-6 transition-colors duration-500 ${
      theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className={`text-6xl font-black mb-6 tracking-tight transition-colors duration-500 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            Startup Showcase
          </h1>
          <p className={`text-xl max-w-2xl mx-auto font-medium transition-colors duration-500 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>Discover the next generation of innovators building the future.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className={`font-bold text-xl transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Loading innovators...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {startups.map((startup) => (
              <div key={startup.id} className={`group rounded-[2.5rem] border overflow-hidden transition-all duration-500 flex flex-col relative ${
                theme === 'dark' 
                  ? 'bg-slate-900 border-slate-800 hover:shadow-2xl hover:shadow-blue-500/10' 
                  : 'bg-white border-slate-100 hover:shadow-2xl hover:shadow-blue-500/5'
              }`}>
                <div className={`h-48 relative p-8 flex items-end overflow-hidden transition-colors duration-500 ${
                  theme === 'dark' ? 'bg-slate-950/50' : 'bg-slate-50'
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className={`absolute top-6 right-6 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider z-10 border shadow-sm transition-all duration-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-900 text-blue-400 border-slate-800' 
                      : 'bg-white text-blue-600 border-slate-100'
                  }`}>
                    {startup.industry}
                  </div>
                  <div className={`w-20 h-20 rounded-2xl shadow-xl shadow-blue-500/10 flex items-center justify-center text-4xl group-hover:scale-110 transition-all duration-500 relative z-10 border ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'
                  }`}>
                    <Rocket className="w-10 h-10 text-blue-600" />
                  </div>
                </div>
                
                <div className="p-8 flex-grow">
                  <h3 className={`text-2xl font-black mb-3 transition-colors duration-500 ${
                    theme === 'dark' ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'
                  }`}>{startup.startupName}</h3>
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-bold mb-6">
                    <Users className="w-4 h-4" />
                    <span className="uppercase tracking-wider">Founded by {startup.founderName}</span>
                  </div>
                  <p className={`mb-8 line-clamp-3 leading-relaxed font-medium transition-colors duration-500 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {startup.bio || "This startup is currently revolutionizing their industry. Stay tuned for more updates."}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className={`p-4 rounded-2xl border transition-colors duration-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <Target className="w-5 h-5 text-blue-500 mb-2" />
                      <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Stage</div>
                      <div className={`text-sm font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Seed</div>
                    </div>
                    <div className={`p-4 rounded-2xl border transition-colors duration-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <Globe className="w-5 h-5 text-blue-500 mb-2" />
                      <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Location</div>
                      <div className={`text-sm font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Remote</div>
                    </div>
                  </div>
                </div>

                <div className="p-8 pt-0">
                  <a 
                    href={startup.website?.startsWith('http') ? startup.website : `https://${startup.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-center font-black flex items-center justify-center gap-2 transition-all duration-500 shadow-xl shadow-blue-600/20 group-hover:scale-[1.02]"
                  >
                    <span>Visit Website</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Showcase;
