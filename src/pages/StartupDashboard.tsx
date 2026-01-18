import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog } from '@headlessui/react';
import { Plus, Rocket, Globe, MessageSquare, Users, Star, TrendingUp, X, Mail } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../firebase/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

const StartupDashboard = () => {
  const { theme } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [successStories, setSuccessStories] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<any>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };
  const openEdit = () => {
    setEditProfile({ ...profile });
    setIsEditOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditProfile({ ...editProfile, [e.target.name]: e.target.value });
  };

  const saveProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      await updateDoc(doc(db, 'users', user.uid), {
        startupName: editProfile.startupName,
        founderName: editProfile.founderName,
        industry: editProfile.industry,
        website: editProfile.website,
        bio: editProfile.bio || '',
      });
      setProfile({ ...profile, ...editProfile });
      setIsEditOpen(false);
      showToast('Profile updated!');
    } catch (err) {
      showToast('Failed to update profile.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch startup profile
        const profileSnap = await getDoc(doc(db, 'users', currentUser.uid));
        setProfile(profileSnap.exists() ? profileSnap.data() : null);
        
        // Fetch startup projects
        const projQuery = query(collection(db, 'startupProjects'), where('startupId', '==', currentUser.uid));
        const projSnap = await getDocs(projQuery);
        setProjects(projSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        // Fetch applicants (students who applied to startup projects)
        const appQuery = query(collection(db, 'project_applications'), where('startupId', '==', currentUser.uid), where('status', '==', 'pending'));
        const appSnap = await getDocs(appQuery);
        setApplicants(appSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch success stories (mock or real if collection exists)
        const storyQuery = query(collection(db, 'success_stories'), where('startupId', '==', currentUser.uid));
        const storySnap = await getDocs(storyQuery);
        setSuccessStories(storySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-500 ${
      theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
    }`}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (error) return (
    <div className={`min-h-screen flex items-center justify-center p-8 text-center font-bold transition-colors duration-500 ${
      theme === 'dark' ? 'bg-slate-950 text-rose-400' : 'bg-slate-50 text-rose-600'
    }`}>
      {error}
    </div>
  );

  return (
    <div className={`min-h-screen py-12 px-6 transition-colors duration-500 ${
      theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
    }`}>
      <div className="max-w-6xl mx-auto">
        {currentUser ? (
          <>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 animate-fade-in">
              <div>
                <h1 className={`text-4xl font-black mb-2 transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>Startup Dashboard</h1>
                <p className={`transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Manage your projects, talent, and growth.</p>
              </div>
              <Link 
                to="/create-startup-project" 
                className={`flex items-center gap-2 text-white px-8 py-5 rounded-[2rem] font-bold transition-all duration-500 shadow-xl hover:scale-105 active:scale-95 ${
                  theme === 'dark' 
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                }`}
              >
                <Plus className="w-6 h-6" />
                <span>Launch New Project</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <Link to="/talent-matches" className={`rounded-3xl p-8 shadow-sm border transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 group animate-scale-in ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`} style={{ animationDelay: '100ms' }}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
                  theme === 'dark' 
                    ? 'bg-blue-900/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white' 
                    : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                }`}>
                  <Users className="w-6 h-6" />
                </div>
                <h2 className={`text-xl font-bold mb-3 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Talent Matches</h2>
                <p className={`transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-sm leading-relaxed`}>AI-powered talent recommendations for your startup projects.</p>
              </Link>

              <Link to="/showcase" className={`rounded-3xl p-8 shadow-sm border transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 group animate-scale-in ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`} style={{ animationDelay: '200ms' }}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
                  theme === 'dark' 
                    ? 'bg-blue-900/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white' 
                    : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                }`}>
                  <Rocket className="w-6 h-6" />
                </div>
                <h2 className={`text-xl font-bold mb-3 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Startup Showcase</h2>
                <p className={`transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-sm leading-relaxed`}>Build your startup profile and showcase your achievements.</p>
              </Link>

              <Link to="/success-stories" className={`rounded-3xl p-8 shadow-sm border transition-all duration-500 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 group animate-scale-in ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`} style={{ animationDelay: '300ms' }}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
                  theme === 'dark' 
                    ? 'bg-emerald-900/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white' 
                    : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                }`}>
                  <Star className="w-6 h-6" />
                </div>
                <h2 className={`text-xl font-bold mb-3 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Success Stories</h2>
                <p className={`transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-sm leading-relaxed`}>Share and view startup success stories from the community.</p>
              </Link>

              <Link to="/investor-connect" className={`rounded-3xl p-8 shadow-sm border transition-all duration-500 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 group animate-scale-in ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`} style={{ animationDelay: '400ms' }}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
                  theme === 'dark' 
                    ? 'bg-amber-900/20 text-amber-400 group-hover:bg-amber-600 group-hover:text-white' 
                    : 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'
                }`}>
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h2 className={`text-xl font-bold mb-3 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Investor Connect</h2>
                <p className={`transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-sm leading-relaxed`}>Connect with potential investors and venture capitalists.</p>
              </Link>
            </div>
          </>
        ) : (
          <div className={`flex flex-col items-center justify-center py-32 rounded-[3rem] border shadow-sm animate-fade-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-6 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Please log in to view your dashboard</h2>
            <Link to="/" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all duration-500 shadow-xl shadow-blue-600/20">Go Home</Link>
          </div>
        )}

        {profile && (
          <div className={`mb-16 rounded-[2.5rem] p-10 shadow-sm border relative overflow-hidden animate-fade-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`} style={{ animationDelay: '500ms' }}>
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none transition-all duration-1000 ${
              theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
            }`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Rocket size={24} />
                  </div>
                  <h2 className={`text-2xl font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Startup Profile</h2>
                </div>
                <button 
                  onClick={openEdit} 
                  className={`px-6 py-2 border-2 rounded-xl font-bold transition-all duration-500 active:scale-95 ${
                    theme === 'dark' 
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Edit Profile
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Startup Name</p>
                  <p className={`text-xl font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{profile.startupName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Founder</p>
                  <p className={`text-xl font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{profile.founderName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Industry</p>
                  <p className={`text-xl font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{profile.industry}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bio</p>
                  <p className={`leading-relaxed transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{profile.bio || 'No bio provided.'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Website</p>
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-2 transition-all duration-500">
                    <Globe size={16} />
                    {profile.website?.replace('https://', '').replace('http://', '').replace('www.', '') || 'N/A'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className={`rounded-[2.5rem] p-10 shadow-sm border transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-8 flex items-center gap-3 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <Rocket className="text-blue-600" size={24} />
              Your Projects
            </h2>
            {projects.length === 0 ? (
              <div className={`font-medium py-10 text-center rounded-2xl border border-dashed transition-all duration-500 ${
                theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>No projects launched yet.</div>
            ) : (
              <div className="space-y-4">
                {projects.map(p => (
                  <div key={p.id} className={`p-6 rounded-2xl border flex items-center justify-between group transition-all duration-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:shadow-lg' 
                      : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all duration-500 ${
                        theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {p.title?.charAt(0) || 'P'}
                      </div>
                      <span className={`font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{p.title || p.id}</span>
                    </div>
                    <Link to={`/startup-proj?id=${p.id}`} className="text-blue-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-all duration-500 hover:underline">View Details</Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`rounded-[2.5rem] p-10 shadow-sm border transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-8 flex items-center gap-3 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <Users className="text-blue-600" size={24} />
              Pending Applicants
            </h2>
            {applicants.length === 0 ? (
              <div className={`font-medium py-10 text-center rounded-2xl border border-dashed transition-all duration-500 ${
                theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>No pending applicants.</div>
            ) : (
              <div className="space-y-6">
                {applicants.map(app => (
                  <div key={app.id} className={`p-6 rounded-2xl border group transition-all duration-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:shadow-lg' 
                      : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{app.studentName || 'Student'}</div>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-500 ${
                        theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                      }`}>New Application</span>
                    </div>
                    <p className={`text-sm mb-6 line-clamp-2 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{app.message || 'No message provided.'}</p>
                    <div className="flex gap-4">
                      <button className={`flex-1 text-white py-3 rounded-xl font-bold text-sm transition-all duration-500 shadow-lg ${
                        theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                      }`}>Review</button>
                      <button className={`flex-1 border py-3 rounded-xl font-bold text-sm transition-all duration-500 ${
                        theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} className="fixed z-[100] inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-6">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in transition-all duration-500" aria-hidden="true" />
          <Dialog.Panel className={`p-10 rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10 border animate-scale-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className="flex justify-between items-center mb-8">
              <Dialog.Title className={`text-2xl font-black transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Edit Profile</Dialog.Title>
              <button onClick={() => setIsEditOpen(false)} className={`w-10 h-10 flex items-center justify-center transition-all duration-500 rounded-xl ${
                theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-900/20' : 'bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50'
              }`}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Startup Name</label>
                <input 
                  name="startupName" 
                  value={editProfile.startupName || ''} 
                  onChange={handleEditChange} 
                  className={`w-full px-4 py-4 rounded-xl border outline-none transition-all font-bold ${
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-700 text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                  }`} 
                />
              </div>
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Founder Name</label>
                <input 
                  name="founderName" 
                  value={editProfile.founderName || ''} 
                  onChange={handleEditChange} 
                  className={`w-full px-4 py-4 rounded-xl border outline-none transition-all font-bold ${
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-700 text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                  }`} 
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Industry</label>
                  <input 
                    name="industry" 
                    value={editProfile.industry || ''} 
                    onChange={handleEditChange} 
                    className={`w-full px-4 py-4 rounded-xl border outline-none transition-all font-bold ${
                      theme === 'dark' 
                        ? 'bg-slate-800 border-slate-700 text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                    }`} 
                  />
                </div>
                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Website URL</label>
                  <input 
                    name="website" 
                    value={editProfile.website || ''} 
                    onChange={handleEditChange} 
                    className={`w-full px-4 py-4 rounded-xl border outline-none transition-all font-bold ${
                      theme === 'dark' 
                        ? 'bg-slate-800 border-slate-700 text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                    }`} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Bio</label>
                <textarea 
                  name="bio" 
                  value={editProfile.bio || ''} 
                  onChange={handleEditChange} 
                  className={`w-full px-4 py-4 rounded-xl border outline-none h-32 resize-none transition-all font-bold ${
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-700 text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                  }`} 
                />
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button 
                onClick={saveProfile} 
                className={`flex-1 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${
                  theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20' : 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-900/10'
                }`}
              >
                Save Changes
              </button>
              <button 
                onClick={() => setIsEditOpen(false)} 
                className={`flex-1 py-4 rounded-2xl font-bold transition-all active:scale-95 ${
                  theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                Cancel
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl z-[200] animate-bounce font-bold flex items-center gap-3 border ${
          theme === 'dark' ? 'bg-slate-900 text-white border-slate-800' : 'bg-slate-900 text-white border-slate-800'
        }`}>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          {toast}
        </div>
      )}
    </div>
  );
};

export default StartupDashboard;
