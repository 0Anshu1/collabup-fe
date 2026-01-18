import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebaseConfig'; // Adjust path if needed (e.g., '@/firebase/firebase')
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { signInWithGoogle } from '../firebase/authService';
import { useTheme } from '../context/ThemeContext';

const StartupForm: React.FC = () => {
  const { theme } = useTheme();
  const [startupName, setStartupName] = useState<string>('');
  const [founderName, setFounderName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [industry, setIndustry] = useState<string>('');
  const [companyDescription, setCompanyDescription] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Validate required fields
      if (!startupName || !founderName || !email || !password || !industry || !companyDescription) {
        throw new Error('Please fill out all required fields.');
      }

      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store startup data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        startupName,
        founderName,
        email,
        website: website || null,
        industry,
        companyDescription,
        role: 'startup',
        createdAt: new Date().toISOString(),
      });

  setSuccess('Startup account created successfully!');
  setTimeout(() => navigate('/startup-dashboard'), 1000);
      // Reset form
      setStartupName('');
      setFounderName('');
      setEmail('');
      setWebsite('');
      setIndustry('');
      setCompanyDescription('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup.');
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      const user = await signInWithGoogle();
      await setDoc(doc(db, 'users', user.uid), {
        startupName: user.displayName || '',
        email: user.email,
        role: 'startup',
        createdAt: new Date().toISOString(),
      }, { merge: true });
  setSuccess('Signed up with Google! Please complete your profile.');
  setTimeout(() => navigate('/startup-dashboard'), 1000);
      // Optionally redirect or update UI
    } catch (err: any) {
      setError('Google sign-in failed. ' + (err.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={handleGoogleSignUp}
        className={`w-full flex items-center justify-center gap-3 font-bold py-4 rounded-2xl shadow-sm transition-all border ${
          theme === 'dark' 
            ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700' 
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
        disabled={isLoading}
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
        Sign up with Google
      </button>

      <div className="relative flex items-center gap-4">
        <div className={`flex-grow h-[1px] ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
        <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">or email</span>
        <div className={`flex-grow h-[1px] ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
      </div>
      
      {error && (
        <div className={`p-4 rounded-2xl border font-medium animate-fade-in ${
          theme === 'dark' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          {error}
        </div>
      )}
      
      {success && (
        <div className={`p-4 rounded-2xl border font-medium animate-fade-in ${
          theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
        }`}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Startup Name</label>
            <input
              type="text"
              value={startupName}
              onChange={(e) => setStartupName(e.target.value)}
              className={`w-full p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
              placeholder="Startup Name"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Founder Name</label>
            <input
              type="text"
              value={founderName}
              onChange={(e) => setFounderName(e.target.value)}
              className={`w-full p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
              placeholder="Founder Name"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
              placeholder="Email"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
              placeholder="Password"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className={`w-full p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
              placeholder="https://yourstartup.com"
            />
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className={`w-full p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
              placeholder="e.g., Technology, Healthcare, Finance"
              required
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Company Description</label>
          <textarea
            value={companyDescription}
            onChange={(e) => setCompanyDescription(e.target.value)}
            className={`w-full p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
              theme === 'dark' 
                ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
            }`}
            rows={4}
            placeholder="Describe your startup and what you do..."
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.02] transition-all disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Complete Sign Up'}
        </button>
      </form>
    </div>
  );
};

export default StartupForm;