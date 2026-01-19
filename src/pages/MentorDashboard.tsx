import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog } from '@headlessui/react';
import { Plus, User as UserIcon, Award, MessageSquare, Calendar, Star, X } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../firebase/firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

const MentorDashboard = () => {
  const { theme } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [mentees, setMentees] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
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
        // Fetch mentor profile
        const profileSnap = await getDoc(doc(db, 'users', currentUser.uid));
        setProfile(profileSnap.exists() ? profileSnap.data() : null);
        // Fetch mentorship requests
        const reqQuery = query(collection(db, 'mentorship_requests'), where('mentorId', '==', currentUser.uid), where('status', '==', 'pending'));
        const reqSnap = await getDocs(reqQuery);
        setRequests(reqSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        // Fetch current mentees
        const menteeQuery = query(collection(db, 'mentorship_requests'), where('mentorId', '==', currentUser.uid), where('status', '==', 'approved'));
        const menteeSnap = await getDocs(menteeQuery);
        setMentees(menteeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        // Fetch bookings (Session Scheduler)
        const bookingQuery = query(collection(db, 'mentorship_bookings'), where('mentorId', '==', currentUser.uid));
        const bookingSnap = await getDocs(bookingQuery);
        setBookings(bookingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
      await updateDoc(doc(db, 'mentorship_requests', id), { status: approve ? 'approved' : 'rejected' });
      setRequests(requests.filter(r => r.id !== id));
      if (approve) {
        const updated = requests.find(r => r.id === id);
        if (updated) setMentees([...mentees, { ...updated, status: 'approved' }]);
        showToast('Request approved!');
      } else {
        showToast('Request rejected.');
      }
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
        expertiseAreas: editProfile.expertiseAreas.split(',').map((s: string) => s.trim()),
        yearsOfExperience: Number(editProfile.yearsOfExperience),
        linkedInUrl: editProfile.linkedInUrl,
        bio: editProfile.bio || '',
      });
      setProfile({ ...profile, ...editProfile, expertiseAreas: editProfile.expertiseAreas.split(',').map((s: string) => s.trim()) });
      setIsEditOpen(false);
      showToast('Profile updated!');
    } catch (err) {
      showToast('Failed to update profile.');
    }
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center transition-all duration-500 ${
      theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
    }`}>
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
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
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 animate-fade-in transition-all duration-500">
              <div>
                <h1 className={`text-4xl font-black mb-2 transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>Mentor Dashboard</h1>
                <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} font-medium transition-colors duration-500`}>Empower the next generation of innovators.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              <Link to="/impact-analytics" className={`rounded-3xl p-8 shadow-sm border transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 group animate-scale-in focus:ring-4 focus:ring-blue-500/50 outline-none ${
                theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
              }`} style={{ animationDelay: '100ms' }}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
                  theme === 'dark' 
                    ? 'bg-blue-900/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white' 
                    : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                }`}>
                  <Star className="w-6 h-6" />
                </div>
                <h2 className={`text-xl font-bold mb-3 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Impact Analytics</h2>
                <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-sm leading-relaxed transition-colors duration-500`}>Track your mentorship hours, ratings, and global impact.</p>
              </Link>

              <Link to="/reviews" className={`rounded-3xl p-8 shadow-sm border transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 group animate-scale-in focus:ring-4 focus:ring-blue-500/50 outline-none ${
                theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
              }`} style={{ animationDelay: '300ms' }}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
                  theme === 'dark' 
                    ? 'bg-blue-900/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white' 
                    : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                }`}>
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h2 className={`text-xl font-bold mb-3 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Ratings & Reviews</h2>
                <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-sm leading-relaxed transition-colors duration-500`}>View detailed feedback and ratings from your mentees.</p>
              </Link>

              <button onClick={() => {
                const element = document.getElementById('upcoming-sessions');
                element?.scrollIntoView({ behavior: 'smooth' });
              }} className={`rounded-3xl p-8 shadow-sm border transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 group animate-scale-in text-left w-full focus:ring-4 focus:ring-blue-500/50 outline-none ${
                theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
              }`} style={{ animationDelay: '400ms' }}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
                  theme === 'dark' 
                    ? 'bg-blue-900/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white' 
                    : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                }`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <h2 className={`text-xl font-bold mb-3 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Session Scheduler</h2>
                <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-sm leading-relaxed transition-colors duration-500`}>Manage your upcoming mentorship sessions and availability.</p>
              </button>
            </div>
          </>
        ) : (
          <div className={`flex flex-col items-center justify-center py-32 rounded-[3rem] border shadow-sm animate-fade-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-6 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Please log in to view your dashboard</h2>
            <Link to="/" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all duration-500 shadow-xl shadow-blue-600/20 focus:ring-4 focus:ring-blue-500/50 outline-none">Go Home</Link>
          </div>
        )}

        {profile && (
          <div className={`mb-16 rounded-[2.5rem] p-10 shadow-sm border relative overflow-hidden animate-fade-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`} style={{ animationDelay: '500ms' }}>
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none transition-colors duration-500 ${
              theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
            }`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-500 ${
                    theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <UserIcon size={24} />
                  </div>
                  <h2 className={`text-2xl font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Mentor Profile</h2>
                </div>
                <button 
                  onClick={openEdit} 
                  className={`px-6 py-2 border-2 rounded-xl font-bold transition-all duration-500 active:scale-95 focus:ring-4 focus:ring-blue-500/50 outline-none ${
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
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Years of Experience</p>
                  <p className={`text-xl font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{profile.yearsOfExperience} Years</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Expertise</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.expertiseAreas?.map((area: string) => (
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
                  <p className={`leading-relaxed transition-colors duration-500 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>{profile.bio || 'No bio provided.'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">LinkedIn</p>
                  <a href={profile.linkedInUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-2 transition-all duration-500">
                    {profile.linkedInUrl?.replace('https://', '').replace('http://', '').replace('www.', '') || 'N/A'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        <div id="upcoming-sessions" className={`mb-16 rounded-[2.5rem] p-10 shadow-sm border animate-fade-in transition-all duration-500 ${
          theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
        }`} style={{ animationDelay: '700ms' }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-500 ${
                theme === 'dark' ? 'bg-emerald-900/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
              }`}>
                <Calendar size={24} />
              </div>
              <h2 className={`text-2xl font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Upcoming Sessions</h2>
            </div>
            <span className={`px-4 py-1.5 text-sm font-bold rounded-full border transition-all duration-500 ${
              theme === 'dark' 
                ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/30' 
                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              {bookings.length} Scheduled
            </span>
          </div>

          {bookings.length === 0 ? (
            <div className={`py-20 text-center rounded-[2rem] border-2 border-dashed transition-all duration-500 ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm transition-colors duration-500 ${
                theme === 'dark' ? 'bg-slate-900/50 text-slate-700' : 'bg-white text-slate-300'
              }`}>
                <Calendar size={32} />
              </div>
              <p className={`font-bold text-lg transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>No upcoming sessions scheduled.</p>
              <p className={`text-sm transition-colors duration-500 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>When students book a session with you, they will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookings.map((booking) => (
                <div key={booking.id} className={`p-6 rounded-2xl border transition-all duration-500 group ${
                  theme === 'dark' 
                    ? 'bg-slate-900/50 border-slate-800 hover:bg-slate-800' 
                    : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-xl'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border transition-colors duration-500 ${
                        theme === 'dark' ? 'bg-slate-900/50 text-slate-500 border-slate-800' : 'bg-white text-slate-400 border-slate-100'
                      }`}>
                        {booking.studentName?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <h4 className={`font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{booking.studentName}</h4>
                        <p className={`text-xs font-medium transition-colors duration-500 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{booking.studentEmail}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border shadow-sm transition-all duration-500 ${
                      theme === 'dark' ? 'bg-slate-900 text-slate-300 border-slate-800' : 'bg-white text-slate-900 border-slate-100'
                    }`}>
                      {booking.platform}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className={`p-3 rounded-xl border transition-colors duration-500 ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                    }`}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date</p>
                      <p className={`text-sm font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{booking.date}</p>
                    </div>
                    <div className={`p-3 rounded-xl border transition-colors duration-500 ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                    }`}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Time Slot</p>
                      <p className={`text-sm font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{booking.timeSlot}</p>
                    </div>
                  </div>
                  <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all duration-500 shadow-lg shadow-blue-600/20 active:scale-95 focus:ring-4 focus:ring-blue-500/50 outline-none">
                    Join Session
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in" style={{ animationDelay: '800ms' }}>
          <div className={`rounded-[2.5rem] p-10 shadow-sm border transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-8 flex items-center gap-3 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <MessageSquare className="text-blue-600" size={24} />
              Pending Requests
            </h2>
            {requests.length === 0 ? (
              <div className={`font-medium py-10 text-center rounded-2xl border border-dashed transition-all duration-500 ${
                theme === 'dark' ? 'bg-slate-950/50 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>No pending mentorship requests.</div>
            ) : (
              <div className="space-y-6">
                {requests.map(req => (
                  <div key={req.id} className={`p-6 rounded-2xl border group transition-all duration-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-950/50 border-slate-800 hover:bg-slate-800' 
                      : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{req.studentName || 'Student'}</div>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-500 ${
                        theme === 'dark' ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                      }`}>Mentorship</span>
                    </div>
                    <p className={`text-sm mb-6 line-clamp-2 transition-colors duration-500 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>{req.message || 'No message provided.'}</p>
                    <div className="flex gap-4">
                      <button onClick={() => handleRequest(req.id, true)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all duration-500 shadow-lg shadow-blue-600/20 active:scale-95 focus:ring-4 focus:ring-blue-500/50 outline-none">Approve</button>
                      <button onClick={() => handleRequest(req.id, false)} className={`flex-1 border py-3 rounded-xl font-bold text-sm transition-all duration-500 active:scale-95 focus:ring-4 focus:ring-blue-500/50 outline-none ${
                        theme === 'dark' ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`rounded-[2.5rem] p-10 shadow-sm border transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-8 flex items-center gap-3 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <UserIcon className="text-blue-600" size={24} />
              Current Mentees
            </h2>
            {mentees.length === 0 ? (
              <div className={`font-medium py-10 text-center rounded-2xl border border-dashed transition-all duration-500 ${
                theme === 'dark' ? 'bg-slate-950/50 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>No mentees yet.</div>
            ) : (
              <div className="space-y-4">
                {mentees.map(m => (
                  <div key={m.id} className={`p-6 rounded-2xl border flex items-center justify-between group transition-all duration-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-950/50 border-slate-800 hover:bg-slate-800' 
                      : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${
                        theme === 'dark' ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {m.studentName?.charAt(0) || 'S'}
                      </div>
                      <span className={`font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{m.studentName || m.studentId}</span>
                    </div>
                    <button className="text-blue-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-all duration-500 hover:underline active:scale-95 focus:ring-4 focus:ring-blue-500/50 outline-none">Send Message</button>
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
          <div className={`fixed inset-0 backdrop-blur-sm animate-fade-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-950/80' : 'bg-slate-900/40'
          }`} aria-hidden="true" />
          <Dialog.Panel className={`p-10 rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10 border animate-scale-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className="flex justify-between items-center mb-8">
              <Dialog.Title className={`text-2xl font-black transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Edit Profile</Dialog.Title>
              <button onClick={() => setIsEditOpen(false)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-900/20' : 'bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50'
              }`}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                <input name="fullName" value={editProfile.fullName || ''} onChange={handleEditChange} className={`w-full px-4 py-4 rounded-xl outline-none transition-all duration-500 font-bold border ${
                  theme === 'dark' ? 'bg-slate-950 text-white border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' : 'bg-slate-50 text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                }`} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Expertise (comma separated)</label>
                <input name="expertiseAreas" value={editProfile.expertiseAreas || ''} onChange={handleEditChange} className={`w-full px-4 py-4 rounded-xl outline-none transition-all duration-500 font-bold border ${
                  theme === 'dark' ? 'bg-slate-950 text-white border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' : 'bg-slate-50 text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                }`} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Experience (Years)</label>
                  <input name="yearsOfExperience" type="number" value={editProfile.yearsOfExperience || ''} onChange={handleEditChange} className={`w-full px-4 py-4 rounded-xl outline-none transition-all duration-500 font-bold border ${
                    theme === 'dark' ? 'bg-slate-950 text-white border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' : 'bg-slate-50 text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">LinkedIn URL</label>
                  <input name="linkedInUrl" value={editProfile.linkedInUrl || ''} onChange={handleEditChange} className={`w-full px-4 py-4 rounded-xl outline-none transition-all duration-500 font-bold border ${
                    theme === 'dark' ? 'bg-slate-950 text-white border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' : 'bg-slate-50 text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Bio</label>
                <textarea name="bio" value={editProfile.bio || ''} onChange={handleEditChange} className={`w-full px-4 py-4 rounded-xl outline-none h-32 resize-none transition-all duration-500 font-bold border ${
                  theme === 'dark' ? 'bg-slate-950 text-white border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' : 'bg-slate-50 text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                }`} />
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={saveProfile} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">Save Changes</button>
              <button onClick={() => setIsEditOpen(false)} className={`flex-1 py-4 rounded-2xl font-bold transition-all duration-500 active:scale-95 ${
                theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}>Cancel</button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-bounce-in">
          <div className={`px-8 py-4 rounded-2xl shadow-2xl font-bold flex items-center gap-3 border transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorDashboard;
