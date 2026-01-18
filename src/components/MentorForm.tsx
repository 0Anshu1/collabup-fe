import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { signInWithGoogle } from '../firebase/authService';
import { useTheme } from '../context/ThemeContext';

const MentorForm: React.FC = () => {
  const { theme } = useTheme();
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [expertiseAreas, setExpertiseAreas] = useState<string>('');
  const [yearsOfExperience, setYearsOfExperience] = useState<number | ''>('');
  const [linkedInUrl, setLinkedInUrl] = useState<string>('');
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
      if (!fullName || !email || !password || !expertiseAreas || yearsOfExperience === '') {
        throw new Error('Please fill out all required fields.');
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address.');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }
      if (yearsOfExperience < 0) {
        throw new Error('Years of experience cannot be negative.');
      }

      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Authenticated user:', user.uid);
      await user.getIdToken(true);
      console.log('Token refreshed');

      // Parse expertise areas into an array
      const expertiseArray = expertiseAreas
        .split(',')
        .map(area => area.trim())
        .filter(area => area.length > 0);

      // Store mentor data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        email,
        expertiseAreas: expertiseArray.length > 0 ? expertiseArray : null,
        yearsOfExperience: Number(yearsOfExperience),
        linkedInUrl: linkedInUrl || null,
        role: 'mentor',
        createdAt: new Date().toISOString(),
      });
      console.log('Firestore document saved for user:', user.uid);

  setSuccess('Mentor account created successfully!');
  setTimeout(() => navigate('/mentor-dashboard'), 1000);
      setFullName('');
      setEmail('');
      setExpertiseAreas('');
      setYearsOfExperience('');
      setLinkedInUrl('');
      setPassword('');
    } catch (err: any) {
      let errorMessage = 'An error occurred during signup.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use. Please use a different email.';
      } else if (err.code === 'firestore/permission-denied') {
        errorMessage = 'Permission denied: Check Firestore rules.';
      } else if (err.code) {
        errorMessage = `Error: ${err.code} - ${err.message}`;
      }
      setError(errorMessage);
      console.error('Signup error:', err.code, err.message);
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
        fullName: user.displayName || '',
        email: user.email,
        role: 'mentor',
        createdAt: new Date().toISOString(),
      }, { merge: true });
  setSuccess('Signed up with Google! Please complete your profile.');
  setTimeout(() => navigate('/mentor-dashboard'), 1000);
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
            <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`w-full p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
              placeholder="Full Name"
              required
            />
          </div>

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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div>
            <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Years of Experience</label>
            <input
              type="number"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value === '' ? '' : Number(e.target.value))}
              className={`w-full p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
              placeholder="Years"
              min="0"
              required
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Expertise Areas (comma-separated)</label>
          <input
            type="text"
            value={expertiseAreas}
            onChange={(e) => setExpertiseAreas(e.target.value)}
            className={`w-full p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
              theme === 'dark' 
                ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
            }`}
            placeholder="e.g., Web Development, Machine Learning, UI/UX"
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>LinkedIn Profile URL</label>
          <input
            type="url"
            value={linkedInUrl}
            onChange={(e) => setLinkedInUrl(e.target.value)}
            className={`w-full p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
              theme === 'dark' 
                ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
            }`}
            placeholder="https://linkedin.com/in/yourusername"
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

export default MentorForm;