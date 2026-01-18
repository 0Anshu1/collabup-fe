import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowLeft, Search, Filter, Briefcase, Globe, Mail, Linkedin, ExternalLink, ShieldCheck } from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../firebase/firebaseConfig';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

const InvestorConnect = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [investors, setInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchInvestors = async () => {
      setLoading(true);
      try {
        const investorsQuery = query(
          collection(db, 'investors'),
          orderBy('name', 'asc')
        );
        const snapshot = await getDocs(investorsQuery);
        const investorData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInvestors(investorData);
      } catch (err) {
        console.error('Error fetching investors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestors();
  }, []);

  const filteredInvestors = investors.filter(investor => 
    investor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    investor.focus?.some((f: string) => f.toLowerCase().includes(searchTerm.toLowerCase())) ||
    investor.firm?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-500 ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-12 px-6 transition-colors duration-500 ${
      theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate('/startup-dashboard')}
          className={`flex items-center gap-2 font-bold mb-8 transition-all duration-500 group ${
            theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-12 gap-8 animate-fade-in transition-all duration-500">
          <div>
            <h1 className={`text-4xl font-black mb-2 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Investor Connect</h1>
            <p className={`font-medium transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Connect with top venture capitalists and angel investors.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search by name, firm, or focus..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-500 font-medium ${
                  theme === 'dark' 
                    ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' 
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
            <button className={`p-4 rounded-2xl border transition-all duration-500 active:scale-95 ${
              theme === 'dark' 
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
              <Filter size={24} />
            </button>
          </div>
        </div>

        {filteredInvestors.length === 0 ? (
          <div className={`rounded-[3rem] p-20 text-center border shadow-sm animate-scale-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 transition-colors duration-500 ${
              theme === 'dark' ? 'bg-amber-900/20 text-amber-500' : 'bg-amber-50 text-amber-300'
            }`}>
              <TrendingUp size={48} />
            </div>
            <h2 className={`text-3xl font-black mb-4 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>No investors found</h2>
            <p className={`font-medium max-w-md mx-auto mb-10 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>We couldn't find any investors matching your search. Try adjusting your keywords or browse all investors.</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all duration-500 shadow-xl shadow-blue-600/20 active:scale-95"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in transition-all duration-500">
            {filteredInvestors.map((investor, index) => (
              <div 
                key={investor.id} 
                className={`rounded-[2.5rem] p-8 shadow-sm border group transition-all duration-500 relative overflow-hidden ${
                  theme === 'dark' 
                    ? 'bg-slate-900 border-slate-800 hover:shadow-2xl hover:shadow-blue-500/10' 
                    : 'bg-white border-slate-200 hover:shadow-2xl hover:shadow-blue-500/5'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-all duration-500 pointer-events-none ${
                  theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
                }`} />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-8">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl border overflow-hidden transition-all duration-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-600' : 'bg-slate-50 border-slate-100 text-slate-300'
                    }`}>
                      {investor.avatarUrl ? (
                        <img src={investor.avatarUrl} alt={investor.name} className="w-full h-full object-cover" />
                      ) : (
                        investor.name?.charAt(0)
                      )}
                    </div>
                    {investor.verified && (
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all duration-500 ${
                        theme === 'dark' 
                          ? 'bg-blue-900/30 text-blue-400 border-blue-900/50' 
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        <ShieldCheck size={12} />
                        Verified
                      </div>
                    )}
                  </div>

                  <h3 className={`text-2xl font-black mb-1 leading-tight transition-colors duration-500 ${
                    theme === 'dark' ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'
                  }`}>
                    {investor.name}
                  </h3>
                  <p className={`font-bold text-sm mb-6 flex items-center gap-2 transition-colors duration-500 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <Briefcase size={14} />
                    {investor.role} at <span className={`transition-colors duration-500 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{investor.firm}</span>
                  </p>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {investor.focus?.map((f: string) => (
                      <span key={f} className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all duration-500 ${
                        theme === 'dark' 
                          ? 'bg-slate-950 text-slate-400 border-slate-800' 
                          : 'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        {f}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className={`p-3 rounded-xl border text-center transition-all duration-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Check Size</p>
                      <p className={`text-xs font-black transition-colors duration-500 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{investor.checkSize || 'N/A'}</p>
                    </div>
                    <div className={`p-3 rounded-xl border text-center transition-all duration-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Stage</p>
                      <p className={`text-xs font-black transition-colors duration-500 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{investor.stage || 'Seed+'}</p>
                    </div>
                    <div className={`p-3 rounded-xl border text-center transition-all duration-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Portfolio</p>
                      <p className={`text-xs font-black transition-colors duration-500 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{investor.portfolioCount || '20+'}</p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-3 pt-6 border-t transition-colors duration-500 ${
                    theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
                  }`}>
                    <button className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all duration-500 shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2">
                      <Mail size={16} />
                      Pitch Deck
                    </button>
                    <div className="flex gap-2">
                      <a href={investor.linkedin} target="_blank" rel="noopener noreferrer" className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 border ${
                        theme === 'dark' 
                          ? 'bg-slate-950 text-slate-500 hover:text-blue-400 hover:bg-blue-900/30 border-slate-800' 
                          : 'bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border-slate-100'
                      }`}>
                        <Linkedin size={20} />
                      </a>
                      <a href={investor.website} target="_blank" rel="noopener noreferrer" className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 border ${
                        theme === 'dark' 
                          ? 'bg-slate-950 text-slate-500 hover:text-white hover:bg-slate-800 border-slate-800' 
                          : 'bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 border-slate-100'
                      }`}>
                        <Globe size={20} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestorConnect;
