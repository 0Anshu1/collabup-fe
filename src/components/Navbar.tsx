import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Settings, Sun, Moon } from 'lucide-react';
import AuthModal from './AuthModal';
import { auth } from '../firebase/firebaseConfig';
import { RecommendationService } from '../services/recommendationService';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authType, setAuthType] = useState<'login' | 'signup'>('login');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [recommendations, setRecommendations] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserName(data.fullName || data.startupName || data.founderName || 'User');
          setUserRole(data.role || null);
        } else {
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const openAuth = (type: 'login' | 'signup') => {
    setAuthType(type);
    setIsAuthOpen(true);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsProfileDropdownOpen(false);
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length > 2) {
      try {
        const data = await RecommendationService.getRecommendations(value, 5);
        setRecommendations(data);
        setShowDropdown(true);
      } catch (err) {
        setRecommendations(null);
        setShowDropdown(false);
      }
    } else {
      setRecommendations(null);
      setShowDropdown(false);
    }
  };

  // Role-based navigation config
  const navConfig = {
    student: [
      { to: '/buddy-finder', label: 'Buddy Finder' },
      { to: '/mentorship', label: 'Mentorship' },
      { to: '/portfolio', label: 'My Portfolio', feature: 'portfolio' },
      { to: '/badges', label: 'Badges', feature: 'badges' },
    ],
    mentor: [
      { to: '/mentor-dashboard', label: 'Mentor Dashboard' },
      { to: '/impact-analytics', label: 'Impact Analytics', feature: 'analytics' },
    ],
    faculty: [
      { to: '/faculty-dashboard', label: 'Faculty Dashboard' },
      { to: '/collab-finder', label: 'Collab Finder', feature: 'collab' },
      { to: '/faculty-leaderboard', label: 'Leaderboard', feature: 'leaderboard' },
    ],
    startup: [
      { to: '/startup-dashboard', label: 'Startup Dashboard' },
      { to: '/showcase', label: 'Showcase', feature: 'showcase' },
      { to: '/talent-matches', label: 'Talent Matches', feature: 'talent' },
    ],
    guest: [],
  };

  const getNavLinks = () => {
    if (!userRole) return navConfig.guest;
    return navConfig[userRole as keyof typeof navConfig] || [];
  };

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'
      } backdrop-blur-md border-b`}>
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link to="/" className={`text-3xl font-black tracking-tighter hover:scale-105 transition-all ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Collab<span className="text-blue-600">Up</span>
            </Link>
            <div className="relative hidden lg:block">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`} />
              <input
                type="text"
                placeholder="Search projects, mentors..."
                className={`pl-12 pr-6 py-3 rounded-2xl w-80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 border transition-all placeholder:text-slate-500 ${
                  theme === 'dark' 
                    ? 'bg-slate-900 text-slate-100 border-slate-800' 
                    : 'bg-slate-50 text-slate-900 border-slate-200'
                }`}
                value={searchTerm}
                onChange={handleSearch}
                onFocus={() => { if (recommendations) setShowDropdown(true); }}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              />
              {showDropdown && recommendations && (
                <div className={`absolute left-0 mt-3 w-[450px] rounded-3xl shadow-2xl max-h-[500px] overflow-y-auto z-50 border p-4 animate-fade-in ring-1 ${
                  theme === 'dark' 
                    ? 'bg-slate-900 text-slate-100 border-slate-800 ring-slate-800' 
                    : 'bg-white text-slate-900 border-slate-200 ring-slate-200'
                }`}>
                  {/* ... recommendations content ... */}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {(!currentUser || userRole !== 'student') && (
              <>
                <div className="hidden md:flex items-center gap-6">
                  {getNavLinks().map((link: { to: string; label: string; feature?: string }) => (
                    <Link 
                      key={link.to} 
                      to={link.to} 
                      className={`font-bold uppercase tracking-wider transition-colors relative group py-2 text-sm ${
                        theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {link.label}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300"></span>
                    </Link>
                  ))}
                </div>

                <div className={`h-8 w-[1px] hidden md:block ${
                  theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
                }`}></div>
              </>
            )}

            {!currentUser ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => openAuth('login')}
                  className={`font-bold transition-colors px-4 py-2 ${
                    theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Log In
                </button>
                <button
                  onClick={() => openAuth('signup')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              /* Profile part only shown if NOT student (students have it in sidebar) */
              userRole !== 'student' && (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className={`flex items-center gap-3 p-1 rounded-full transition-colors ${
                      theme === 'dark' ? 'hover:bg-slate-900' : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <span className={`font-bold hidden sm:block ${
                      theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                    }`}>{userName}</span>
                  </button>
                  
                  {isProfileDropdownOpen && (
                    <div className={`absolute right-0 mt-3 w-56 rounded-2xl shadow-2xl py-3 border z-50 ring-1 animate-fade-in ${
                      theme === 'dark' 
                        ? 'bg-slate-950 border-slate-800 ring-slate-800' 
                        : 'bg-white border-slate-200 ring-slate-200'
                    }`}>
                      <div className={`px-5 py-3 border-b mb-2 ${
                        theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
                      }`}>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logged in as</p>
                        <p className={`font-bold truncate ${
                          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                        }`}>{userName}</p>
                      </div>
                      <Link
                        to="/edit-profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className={`flex items-center gap-3 px-5 py-3 transition-colors font-medium ${
                          theme === 'dark' ? 'text-slate-400 hover:bg-slate-900 hover:text-blue-400' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                        }`}
                      >
                        <Settings className="w-5 h-5" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-5 py-3 transition-colors font-medium ${
                          theme === 'dark' ? 'text-slate-400 hover:bg-slate-900 hover:text-red-400' : 'text-slate-600 hover:bg-slate-50 hover:text-red-600'
                        }`}
                      >
                        <LogOut className="w-5 h-5" />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        type={authType}
      />
    </>
  );
};

export default Navbar;