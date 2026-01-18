import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Rocket, 
  Users, 
  FlaskConical, 
  User, 
  Settings, 
  LogOut, 
  LayoutDashboard,
  Award,
  Briefcase,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { auth, db } from '../firebase/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
  const { theme } = useTheme();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (!currentUser || userData?.role !== 'student') return null;

  const menuItems = [
    { to: '/student-projects', label: 'Student Projects', icon: Users },
    { to: '/startup-proj', label: 'Startup Projects', icon: Rocket },
    { to: '/research-projects', label: 'Research Projects', icon: FlaskConical },
    { to: '/buddy-finder', label: 'Buddy Finder', icon: Briefcase },
    { to: '/mentorship', label: 'Mentorship', icon: Award },
    { to: '/portfolio', label: 'My Portfolio', icon: LayoutDashboard },
  ];

  const SidebarContent = () => (
    <div className={`flex flex-col h-full border-r transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/50' 
        : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'
    }`}>
      {/* Header Section - Only Toggle */}
      <div className="p-6 flex items-center justify-end">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`hidden lg:flex items-center justify-center w-10 h-10 rounded-xl transition-all border ${
            theme === 'dark' 
              ? 'bg-slate-800 text-slate-400 hover:text-blue-400 border-slate-700' 
              : 'bg-slate-50 text-slate-500 hover:text-blue-600 border-slate-200'
          }`}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' 
                  : theme === 'dark'
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              <item.icon size={22} className={`${isActive ? 'text-white' : theme === 'dark' ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-600'} transition-colors`} />
              <span className={`${isCollapsed ? 'hidden' : 'block'}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div className="p-4 mt-auto">
        <div className={`rounded-[2rem] p-4 border transition-all ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border-slate-700/50' 
            : 'bg-slate-50 border-slate-200'
        } ${isCollapsed ? 'items-center' : ''}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-600/20 shrink-0">
              {userData?.fullName?.charAt(0) || <User size={20} />}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className={`font-black truncate ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{userData?.fullName || 'Student'}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{userData?.role}</p>
              </div>
            )}
          </div>
          
          <div className={`flex flex-col gap-1 ${isCollapsed ? 'items-center' : ''}`}>
            <Link 
              to="/edit-profile" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                theme === 'dark'
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-blue-400'
                  : 'text-slate-500 hover:bg-white hover:text-blue-600'
              } ${isCollapsed ? 'justify-center w-full' : ''}`}
              title="Settings"
            >
              <Settings size={18} />
              {!isCollapsed && <span>Settings</span>}
            </Link>
            <button 
              onClick={handleLogout}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-all ${isCollapsed ? 'justify-center w-full' : ''}`}
              title="Logout"
            >
              <LogOut size={18} />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed bottom-8 right-8 z-50 w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center animate-bounce hover:animate-none active:scale-95 transition-all"
      >
        <Menu size={28} />
      </button>

      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:block h-screen sticky top-0 transition-all duration-300 z-40 ${
          isCollapsed ? 'w-24' : 'w-80'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 animate-scale-in origin-left">
            <SidebarContent />
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-8 -right-16 w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-100 shadow-xl border border-slate-700"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;