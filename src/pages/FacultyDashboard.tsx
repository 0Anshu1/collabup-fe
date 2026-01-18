import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog } from '@headlessui/react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../firebase/firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { Plus, X, Award, Shield, Star, Zap, Target, Heart, Users } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const FacultyDashboard = () => {
  const { theme } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
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

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch faculty profile
        const profileSnap = await getDoc(doc(db, 'users', currentUser.uid));
        setProfile(profileSnap.exists() ? profileSnap.data() : null);
        // Fetch research projects
        const projQuery = query(collection(db, 'researchProjects'), where('facultyId', '==', currentUser.uid));
        const projSnap = await getDocs(projQuery);
        setProjects(projSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        // Fetch student collaboration requests
        const reqQuery = query(collection(db, 'collab_requests'), where('facultyId', '==', currentUser.uid), where('status', '==', 'pending'));
        const reqSnap = await getDocs(reqQuery);
        setRequests(reqSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const handleRequest = async (id: string, approve: boolean) => {
    try {
      await updateDoc(doc(db, 'collab_requests', id), { status: approve ? 'approved' : 'rejected' });
      setRequests(requests.filter(r => r.id !== id));
      showToast(approve ? 'Request approved!' : 'Request rejected.');
    } catch (err) {
      showToast('Failed to update request.');
    }
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
        fullName: editProfile.fullName,
        institute: editProfile.institute,
        researchAreas: editProfile.researchAreas.split(',').map((s: string) => s.trim()),
        bio: editProfile.bio || '',
      });
      setProfile({ ...profile, ...editProfile, researchAreas: editProfile.researchAreas.split(',').map((s: string) => s.trim()) });
      setIsEditOpen(false);
      showToast('Profile updated!');
    } catch (err) {
      showToast('Failed to update profile.');
    }
  };

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
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 transition-all duration-500">
              <div>
                <h1 className={`text-4xl font-black mb-2 transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>Faculty Dashboard</h1>
                <p className={`transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Drive innovation through research collaboration.</p>
              </div>
              <Link 
                to="/create-research" 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-500 shadow-xl shadow-blue-600/20 hover:scale-105"
              >
                <Plus className="w-6 h-6" />
                <span>Create Research Project</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <Link to="/collab-finder" className={`rounded-3xl p-8 shadow-sm border transition-all duration-500 hover:shadow-xl hover:shadow-green-500/5 hover:-translate-y-1 group ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
                  theme === 'dark' 
                    ? 'bg-green-900/20 text-green-400 group-hover:bg-green-600 group-hover:text-white' 
                    : 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white'
                }`}>
                  <Plus className="w-6 h-6" />
                </div>
                <h2 className={`text-xl font-bold mb-3 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Collab Finder</h2>
                <p className={`transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-sm leading-relaxed`}>Find research collaborators and partners across departments.</p>
              </Link>

              <Link to="/faculty-leaderboard" className={`rounded-3xl p-8 shadow-sm border transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 group ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
                  theme === 'dark' 
                    ? 'bg-blue-900/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white' 
                    : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                }`}>
                  <Plus className="w-6 h-6" />
                </div>
                <h2 className={`text-xl font-bold mb-3 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Leaderboard</h2>
                <p className={`transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-sm leading-relaxed`}>See top faculty collaborators and platform statistics.</p>
              </Link>

              <div className={`rounded-3xl p-8 shadow-sm border opacity-60 transition-all duration-500 ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-500 ${
                  theme === 'dark' ? 'bg-slate-800 text-slate-500' : 'bg-slate-50 text-slate-400'
                }`}>
                  <Plus className="w-6 h-6" />
                </div>
                <h2 className={`text-xl font-bold mb-3 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Publication Tracking</h2>
                <p className={`transition-colors duration-500 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} text-sm leading-relaxed`}>Coming Soon: Track your publications and research impact.</p>
              </div>

              <div className={`rounded-3xl p-8 shadow-sm border opacity-60 transition-all duration-500 ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-500 ${
                  theme === 'dark' ? 'bg-slate-800 text-slate-500' : 'bg-slate-50 text-slate-400'
                }`}>
                  <Plus className="w-6 h-6" />
                </div>
                <h2 className={`text-xl font-bold mb-3 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Grant Opportunities</h2>
                <p className={`transition-colors duration-500 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} text-sm leading-relaxed`}>Coming Soon: Discover and apply for research grants.</p>
              </div>
            </div>
          </>
        ) : (
          <div className={`flex flex-col items-center justify-center py-32 rounded-[3rem] border shadow-sm transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-6 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Please log in to view your dashboard</h2>
            <Link to="/" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold transition-all duration-500 shadow-xl shadow-blue-600/20 hover:bg-blue-700">Go Home</Link>
          </div>
        )}

        {profile && (
          <div className={`mb-16 rounded-[2.5rem] p-10 shadow-sm border relative overflow-hidden transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none transition-all duration-500 ${
              theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
            }`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                <h2 className={`text-2xl font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Faculty Profile</h2>
                <button 
                  onClick={openEdit} 
                  className={`px-6 py-2 border-2 rounded-xl font-bold transition-all duration-500 ${
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
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</p>
                  <p className={`text-xl font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{profile.fullName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Institute</p>
                  <p className={`text-xl font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{profile.institute}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Research Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.researchAreas?.map((area: string) => (
                      <span key={area} className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all duration-500 ${
                        theme === 'dark' 
                          ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' 
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>{area}</span>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bio</p>
                  <p className={`leading-relaxed transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{profile.bio || 'No bio provided.'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</p>
                  <p className={`font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{profile.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className={`rounded-[2.5rem] p-10 shadow-sm border transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-8 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Research Projects</h2>
            {projects.length === 0 ? (
              <div className="text-slate-400 font-medium py-10 text-center">No projects created yet.</div>
            ) : (
              <div className="space-y-4">
                {projects.map(p => (
                  <div key={p.id} className={`p-6 rounded-2xl border flex items-center justify-between group transition-all duration-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:shadow-lg' 
                      : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg'
                  }`}>
                    <span className={`font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{p.title || p.id}</span>
                    <Link to={`/research-proj?id=${p.id}`} className="text-blue-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-all duration-500">View Details</Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`rounded-[2.5rem] p-10 shadow-sm border transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-8 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Collaboration Requests</h2>
            {requests.length === 0 ? (
              <div className="text-slate-400 font-medium py-10 text-center">No pending requests.</div>
            ) : (
              <div className="space-y-6">
                {requests.map(req => (
                  <div key={req.id} className={`p-6 rounded-2xl border group transition-all duration-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:shadow-lg' 
                      : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{req.studentName || 'Student'}</div>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full transition-colors duration-500 ${
                        theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
                      }`}>Collaboration</span>
                    </div>
                    <p className={`text-sm mb-6 line-clamp-2 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{req.message || 'No message provided.'}</p>
                    <div className="flex gap-4">
                      <button onClick={() => handleRequest(req.id, true)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all duration-500 shadow-lg shadow-blue-600/20">Approve</button>
                      <button onClick={() => handleRequest(req.id, false)} className={`flex-1 border py-3 rounded-xl font-bold text-sm transition-all duration-500 ${
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
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" aria-hidden="true" />
          <Dialog.Panel className={`p-10 rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10 border animate-scale-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className="flex items-center justify-between mb-8">
              <Dialog.Title className={`text-2xl font-black transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Edit Profile</Dialog.Title>
              <button onClick={() => setIsEditOpen(false)} className={`p-2 rounded-xl transition-all duration-500 ${
                theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600'
              }`}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest mb-3 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={editProfile.fullName || ''}
                  onChange={handleEditChange}
                  className={`w-full p-4 rounded-2xl border outline-none transition-all duration-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' 
                      : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest mb-3 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Institute</label>
                <input
                  type="text"
                  name="institute"
                  value={editProfile.institute || ''}
                  onChange={handleEditChange}
                  className={`w-full p-4 rounded-2xl border outline-none transition-all duration-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' 
                      : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest mb-3 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Research Areas (comma-separated)</label>
                <input
                  type="text"
                  name="researchAreas"
                  value={Array.isArray(editProfile.researchAreas) ? editProfile.researchAreas.join(', ') : editProfile.researchAreas || ''}
                  onChange={handleEditChange}
                  className={`w-full p-4 rounded-2xl border outline-none transition-all duration-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' 
                      : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest mb-3 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Bio</label>
                <textarea
                  name="bio"
                  value={editProfile.bio || ''}
                  onChange={handleEditChange}
                  rows={4}
                  className={`w-full p-4 rounded-2xl border outline-none transition-all duration-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' 
                      : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>
              
              <button
                onClick={saveProfile}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all duration-500 shadow-xl shadow-blue-600/20 active:scale-[0.98]"
              >
                Save Changes
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-bounce-in">
          <div className={`px-8 py-4 rounded-2xl shadow-2xl font-bold flex items-center gap-3 border transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <Zap className="w-5 h-5 text-blue-500" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
