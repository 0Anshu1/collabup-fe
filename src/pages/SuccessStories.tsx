import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, Rocket, Award, ExternalLink, MessageCircle, Heart } from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../firebase/firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

const SuccessStories = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      try {
        // Fetch all success stories to showcase
        const storiesQuery = query(
          collection(db, 'success_stories'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(storiesQuery);
        const storyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStories(storyData);
      } catch (err) {
        console.error('Error fetching success stories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all duration-500 ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-12 px-6 transition-all duration-500 ${
      theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => navigate('/startup-dashboard')}
          className={`flex items-center gap-2 font-bold mb-8 transition-all duration-500 group focus:ring-4 focus:ring-blue-500/50 outline-none rounded-xl px-2 py-1 ${
            theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-500" />
          Back to Dashboard
        </button>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 animate-fade-in">
          <div>
            <h1 className={`text-4xl font-black mb-2 transition-all duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Success Stories</h1>
            <p className={`font-medium transition-all duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Inspiring milestones and achievements from the community.</p>
          </div>
          <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all duration-500 shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-2 focus:ring-4 focus:ring-blue-500/50 outline-none">
            <Rocket size={20} />
            Share Your Story
          </button>
        </div>

        {stories.length === 0 ? (
          <div className={`rounded-[2.5rem] p-20 text-center border shadow-sm animate-scale-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${
              theme === 'dark' ? 'bg-emerald-900/20 text-emerald-500' : 'bg-emerald-50 text-emerald-300'
            }`}>
              <Award size={40} />
            </div>
            <h2 className={`text-2xl font-bold mb-2 transition-all duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>No success stories yet</h2>
            <p className={`font-medium max-w-sm mx-auto transition-all duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Be the first to share your startup's milestones and inspire others in the community!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            {stories.map((story, index) => (
              <div 
                key={story.id} 
                className={`rounded-[2.5rem] overflow-hidden shadow-sm border group hover:shadow-2xl transition-all duration-500 flex flex-col ${
                  theme === 'dark' 
                    ? 'bg-slate-900/50 border-slate-800 hover:shadow-emerald-500/10' 
                    : 'bg-white border-slate-200 hover:shadow-emerald-500/5'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`h-48 relative overflow-hidden transition-all duration-500 ${
                  theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-100'
                }`}>
                  {story.imageUrl ? (
                    <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br text-emerald-200 transition-all duration-500 ${
                      theme === 'dark' ? 'from-emerald-900/20 to-teal-900/20' : 'from-emerald-50 to-teal-50'
                    }`}>
                      <Rocket size={64} />
                    </div>
                  )}
                  <div className={`absolute top-4 right-4 px-3 py-1 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm transition-all duration-500 ${
                    theme === 'dark' ? 'bg-slate-950 text-slate-300' : 'bg-white/90 text-slate-900'
                  }`}>
                    {story.category || 'Milestone'}
                  </div>
                </div>
                
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border transition-all duration-500 ${
                      theme === 'dark' ? 'bg-slate-900/50 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-400'
                    }`}>
                      {story.startupName?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <h3 className={`font-bold transition-all duration-500 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{story.startupName}</h3>
                      <p className="text-xs text-slate-400 font-medium">{new Date(story.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <h2 className={`text-xl font-black mb-3 leading-tight transition-all duration-500 ${
                    theme === 'dark' ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-600'
                  }`}>
                    {story.title}
                  </h2>
                  
                  <p className={`text-sm leading-relaxed mb-6 line-clamp-3 transition-all duration-500 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {story.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-all duration-500 font-bold text-xs focus:ring-4 focus:ring-rose-500/50 outline-none rounded-lg p-1">
                        <Heart size={16} />
                        {story.likes || 0}
                      </button>
                      <button className="flex items-center gap-1.5 text-slate-400 hover:text-blue-500 transition-all duration-500 font-bold text-xs focus:ring-4 focus:ring-blue-500/50 outline-none rounded-lg p-1">
                        <MessageCircle size={16} />
                        {story.comments?.length || 0}
                      </button>
                    </div>
                    <button className="text-emerald-600 font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:gap-3 transition-all duration-500 focus:ring-4 focus:ring-emerald-500/50 outline-none rounded-lg p-1">
                      Read Full Story
                      <ExternalLink size={14} />
                    </button>
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

export default SuccessStories;
