import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { signInWithGoogle } from '../firebase/authService';
import { uploadViaSignedUrl, getSignedReadUrl } from '../utils/gcsUpload';
import { useTheme } from '../context/ThemeContext';

const FacultyForm: React.FC = () => {
  const { theme } = useTheme();
  const [fullName, setFullName] = useState<string>('');
  const [institute, setInstitute] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [facultyIdFile, setFacultyIdFile] = useState<File | null>(null);
  const [researchAreas, setResearchAreas] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Faculty ID must be a PDF file.');
        setFacultyIdFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Faculty ID file size must be less than 5MB.');
        setFacultyIdFile(null);
        return;
      }
      setFacultyIdFile(file);
      setError(null);
    }
    e.target.blur();
  };

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Validate required fields
      if (!fullName || !institute || !email || !password || !facultyIdFile || !researchAreas) {
        throw new Error('Please fill out all required fields and upload a valid faculty ID.');
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address.');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Authenticated user:', user.uid);
      await user.getIdToken(true);
      console.log('Token refreshed');

      // Upload faculty ID via GCS signed URL
      const facultyIdFileName = `${uuidv4()}-${facultyIdFile.name}`;
      const objectPath = `users/faculty/${user.uid}/ids/${facultyIdFileName}`;
      await uploadViaSignedUrl(objectPath, facultyIdFile);
      const facultyIdUrl: string = await getSignedReadUrl(objectPath);

      // Parse research areas into an array
      const researchAreasArray = researchAreas
        .split(',')
        .map(area => area.trim())
        .filter(area => area.length > 0);

      // Store faculty data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        institute,
        email,
        facultyIdUrl,
        facultyIdObjectPath: objectPath,
        researchAreas: researchAreasArray.length > 0 ? researchAreasArray : null,
        role: 'faculty',
        createdAt: new Date().toISOString(),
      });
      console.log('Firestore document saved for user:', user.uid);

  setSuccess('Faculty account created successfully!');
  setTimeout(() => navigate('/faculty-dashboard'), 1000);
      setFullName('');
      setInstitute('');
      setEmail('');
      setFacultyIdFile(null);
      setResearchAreas('');
      setPassword('');
      const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
      fileInputs.forEach(input => (input.value = ''));
    } catch (err: any) {
      let errorMessage = 'An error occurred during signup.';
      if (err.code === 'storage/unauthorized') {
        errorMessage = 'Failed to upload file: Unauthorized access. Please check Firebase Storage rules.';
      } else if (err.code === 'storage/canceled') {
        errorMessage = 'File upload canceled. Please try again.';
      } else if (err.code === 'auth/email-already-in-use') {
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
        role: 'faculty',
        createdAt: new Date().toISOString(),
      }, { merge: true });
  setSuccess('Signed up with Google! Please complete your profile.');
  setTimeout(() => navigate('/faculty-dashboard'), 1000);
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
            <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Institute</label>
            <input
              type="text"
              value={institute}
              onChange={(e) => setInstitute(e.target.value)}
              className={`w-full p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
              placeholder="College/University"
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

        <div>
          <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Research Areas (comma-separated)</label>
          <input
            type="text"
            value={researchAreas}
            onChange={(e) => setResearchAreas(e.target.value)}
            className={`w-full p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
              theme === 'dark' 
                ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
            }`}
            placeholder="e.g., Machine Learning, AI, Data Science"
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-bold mb-4 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Faculty ID Card (PDF, max 5MB)</label>
          <div className="relative group">
            <input
              type="file"
              onChange={handleFileChange}
              accept="application/pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              required
            />
            <div className={`w-full flex flex-col items-center px-6 py-10 rounded-3xl border-2 border-dashed transition-all ${
              theme === 'dark' 
                ? 'bg-slate-800/50 text-slate-400 border-slate-700 group-hover:border-blue-500 group-hover:bg-blue-500/5' 
                : 'bg-slate-50 text-slate-400 border-slate-200 group-hover:border-blue-500 group-hover:bg-blue-50'
            }`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm mb-4 transition-colors ${
                theme === 'dark' ? 'bg-slate-800 text-blue-400' : 'bg-white text-blue-600'
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <span className={`font-bold transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                {facultyIdFile ? facultyIdFile.name : 'Upload Faculty ID PDF'}
              </span>
              <span className="text-sm">Click or drag and drop</span>
            </div>
          </div>
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

export default FacultyForm;