
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserRole } from '../utils/getUserRole';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const role = await getUserRole();
        if (role === 'student') {
          navigate('/student-projects', { replace: true });
        } else if (role === 'mentor') {
          navigate('/mentor-dashboard', { replace: true });
        } else if (role === 'startup') {
          navigate('/startup-dashboard', { replace: true });
        } else if (role === 'faculty') {
          navigate('/faculty-dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        navigate('/', { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className={`flex items-center justify-center min-h-screen transition-colors duration-500 ${
      theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className={`text-center text-xl font-medium animate-pulse transition-colors duration-500 ${
        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
      }`}>
        Redirecting to your dashboard...
      </div>
    </div>
  );
};

export default Dashboard; 