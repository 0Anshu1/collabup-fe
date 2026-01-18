import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Filter, BookOpen } from 'lucide-react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

const CollabFinder: React.FC = () => {
  const [researchers, setResearchers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchResearchers = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'faculty'));
        const snap = await getDocs(q);
        setResearchers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching faculty:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResearchers();
  }, []);

  const filteredResearchers = researchers.filter(r => 
    r.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.researchAreas?.some((area: string) => area.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={`min-h-screen transition-colors duration-500 py-12 px-6 ${
      theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
    }`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className={`text-6xl font-black mb-6 tracking-tight transition-colors duration-500 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            Research Collab Finder
          </h1>
          <p className={`text-xl max-w-2xl mx-auto font-medium transition-colors duration-500 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>Connect with faculty members and researchers across institutes</p>
        </div>

        <div className={`rounded-[2.5rem] shadow-xl p-10 mb-16 border transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-slate-900/50 border-slate-800 shadow-blue-500/10' 
            : 'bg-white border-slate-100 shadow-blue-500/5'
        }`}>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 relative">
              <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 transition-colors duration-500 ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`} />
              <input
                type="text"
                placeholder="Search by name or research area..."
                className={`w-full pl-14 pr-6 py-4 border rounded-2xl outline-none transition-all duration-500 text-lg font-bold ${
                  theme === 'dark' 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-slate-900' 
                    : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white'
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className={`font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Loading potential collaborators...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredResearchers.map((researcher) => (
              <div key={researcher.id} className={`rounded-[2.5rem] p-8 border transition-all duration-500 group relative overflow-hidden ${
                theme === 'dark' 
                  ? 'bg-slate-900/50 border-slate-800 hover:shadow-2xl hover:shadow-blue-500/20' 
                  : 'bg-white border-slate-100 hover:shadow-2xl hover:shadow-blue-500/10'
              }`}>
                <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl transition-transform duration-500 group-hover:scale-150 ${
                  theme === 'dark' ? 'bg-blue-600/10' : 'bg-blue-600/5'
                }`} />
                
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-400 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-blue-600/20 group-hover:scale-110 transition-transform duration-500">
                    {researcher.fullName?.charAt(0)}
                  </div>
                  <button className={`p-4 rounded-2xl transition-all duration-500 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-600/20 focus:ring-4 focus:ring-blue-500/50 outline-none ${
                    theme === 'dark' ? 'bg-slate-950 text-slate-500' : 'bg-slate-50 text-slate-400'
                  }`}>
                    <UserPlus className="w-6 h-6" />
                  </button>
                </div>

                <div className="relative z-10">
                  <h3 className={`text-2xl font-black mb-2 group-hover:text-blue-600 transition-colors duration-500 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>{researcher.fullName}</h3>
                  <p className="text-blue-600 font-bold text-sm mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                    {researcher.institute || researcher.instituteName}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-8">
                    {researcher.researchAreas?.map((area: string, idx: number) => (
                      <span key={idx} className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-colors duration-500 ${
                        theme === 'dark' 
                          ? 'bg-slate-950 text-slate-400 border-slate-800' 
                          : 'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        {area}
                      </span>
                    ))}
                  </div>

                  <p className={`text-lg leading-relaxed line-clamp-3 mb-8 font-medium transition-colors duration-500 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>{researcher.bio || "No bio available."}</p>
                  
                  <button className={`w-full py-4 rounded-2xl text-base font-black transition-all duration-500 hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-600/20 flex items-center justify-center gap-3 focus:ring-4 focus:ring-blue-500/50 outline-none ${
                    theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'
                  }`}>
                    <BookOpen className="w-5 h-5" /> View Publications
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollabFinder;
