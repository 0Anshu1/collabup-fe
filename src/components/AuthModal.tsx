import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Dialog } from '@headlessui/react';
import { X, ArrowLeft } from 'lucide-react';
import { auth } from '../firebase/firebaseConfig'; // Adjust path if needed (e.g., '@/firebase/firebase')
import { signInWithEmailAndPassword } from 'firebase/auth';
import StudentForm from './StudentForm';
import FacultyForm from './FacultyForm';
import StartupForm from './StartupForm';
import MentorForm from './MentorForm';
import { useTheme } from '../context/ThemeContext';

type Role = 'student' | 'faculty' | 'startup' | 'mentor';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, type }: AuthModalProps) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please fill out all required fields.');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let role = userDoc.exists() ? userDoc.data().role : null;
      setSuccess('Logged in successfully!');
      setEmail('');
      setPassword('');
      setTimeout(() => {
        onClose();
        if (role === 'mentor') navigate('/mentor-dashboard');
        else if (role === 'faculty') navigate('/faculty-dashboard');
        else if (role === 'startup') navigate('/startup-dashboard');
        else if (role === 'student') navigate('/dashboard');
        else navigate('/');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => {
    if (type === 'login') {
      return (
        <form className="space-y-6" onSubmit={handleLoginSubmit}>
          <div>
            <label className={`block text-sm font-bold mb-2 text-left ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className={`w-full p-4 rounded-2xl outline-none transition-all border ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={`block text-sm font-bold mb-2 text-left ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className={`w-full p-4 rounded-2xl outline-none transition-all border ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
              }`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-rose-500 text-sm font-medium">{error}</p>}
          {success && <p className="text-emerald-500 text-sm font-medium">{success}</p>}
          <button
            type="submit"
            className={`w-full py-4 rounded-2xl font-bold shadow-xl transition-all ${
              theme === 'dark' 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20 hover:scale-[1.02]' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 hover:scale-[1.02]'
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
      );
    }

    if (!selectedRole) {
      return (
        <div className="space-y-6">
          <h3 className={`text-xl font-bold text-center ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>Choose your role to get started</h3>
          <div className="grid grid-cols-2 gap-4">
            {(['student', 'faculty', 'startup', 'mentor'] as Role[]).map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`p-6 rounded-2xl transition-all duration-300 border group ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:shadow-xl hover:shadow-blue-900/10' 
                    : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-blue-500/10'
                }`}
              >
                <div className={`capitalize font-bold text-lg group-hover:text-blue-600 transition-colors ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>{role}</div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    const FormComponent = {
      student: StudentForm,
      faculty: FacultyForm,
      startup: StartupForm,
      mentor: MentorForm,
    }[selectedRole];

    return (
      <div className="animate-fade-in">
        <button
          onClick={() => setSelectedRole(null)}
          className={`flex items-center mb-6 group font-bold transition-colors ${
            theme === 'dark' ? 'text-slate-500 hover:text-blue-400' : 'text-slate-400 hover:text-blue-600'
          }`}
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to roles
        </button>
        <div className={theme === 'dark' ? 'dark-form-container' : 'light-form-container'}>
          <FormComponent />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className={`w-full max-w-lg transform overflow-hidden rounded-[2.5rem] p-8 text-left align-middle shadow-2xl transition-all border ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="flex justify-between items-center mb-8">
            <Dialog.Title className={`text-3xl font-black ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {type === 'login' ? 'Welcome Back' : 'Join CollabUp'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all ${
                theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {renderForm()}
          </div>
          {type === 'login' && (
            <p className={`mt-8 text-sm text-center font-medium ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Don't have an account?{' '}
              <button onClick={() => onClose()} className="text-blue-600 hover:underline font-bold">
                Sign up
              </button>
            </p>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}