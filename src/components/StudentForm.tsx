import React, { useState, FormEvent } from 'react';
import { auth, db } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { sendCollabEmail } from '../utils/sendCollabEmail';
import { uploadViaSignedUrl, getSignedReadUrl } from '../utils/gcsUpload';
import { signInWithGoogle } from '../firebase/authService';
import { useTheme } from '../context/ThemeContext';

const StudentForm: React.FC = () => {
  const { theme } = useTheme();
  const [fullName, setFullName] = useState<string>('');
  const [instituteName, setInstituteName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [collegeIdFile, setCollegeIdFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<string>('');
  const [leetCodeUrl, setLeetCodeUrl] = useState<string>('');
  const [codeForcesUrl, setCodeForcesUrl] = useState<string>('');
  const [linkedInUrl, setLinkedInUrl] = useState<string>('');
  const [gitHubUrl, setGitHubUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('College ID must be a PDF file.');
        setCollegeIdFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('College ID file size must be less than 5MB.');
        setCollegeIdFile(null);
        return;
      }
      setCollegeIdFile(file);
      setError(null);
    }
    e.target.blur();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (!fullName || !instituteName || !email || !password || !collegeIdFile) {
        throw new Error('Please fill out all required fields and upload a valid college ID.');
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address.');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      // Create user and refresh token
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Authenticated user:', user.uid);
      await user.getIdToken(true);
      console.log('Token refreshed');

      // Upload college ID via GCS signed URL
      let collegeIdUrl: string | null = null;
      const collegeIdFileName = `${uuidv4()}-${collegeIdFile.name}`;
      const objectPath = `users/students/${user.uid}/ids/${collegeIdFileName}`;
      await uploadViaSignedUrl(objectPath, collegeIdFile);
      collegeIdUrl = await getSignedReadUrl(objectPath);

      // Parse skills
      const skillsArray = skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      // Save to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        instituteName,
        email,
        collegeIdUrl,
        skills: skillsArray.length > 0 ? skillsArray : null,
        leetCodeUrl: leetCodeUrl || null,
        codeForcesUrl: codeForcesUrl || null,
        linkedInUrl: linkedInUrl || null,
        gitHubUrl: gitHubUrl || null,
        collegeIdObjectPath: objectPath,
        role: 'student',
        createdAt: new Date().toISOString(),
      });
      console.log('Firestore document saved for user:', user.uid);

      // Send confirmation email (tries EmailJS, falls back to backend) [[memory:2579410]]
      try {
        await sendCollabEmail({
          to: email,
          subject: 'Welcome to CollabUp! 🎉',
          text: `Hi ${fullName}, your student account has been created successfully.`,
        });
        console.log('Confirmation email sent to:', email);
      } catch (_) {
        console.warn('Confirmation email could not be sent, continuing.');
      }

      setSuccess('Account created, please sign in.');
      setFullName('');
      setInstituteName('');
      setEmail('');
      setPassword('');
      setCollegeIdFile(null);
      setSkills('');
      setLeetCodeUrl('');
      setCodeForcesUrl('');
      setLinkedInUrl('');
      setGitHubUrl('');
      const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
      fileInputs.forEach(input => (input.value = ''));

      navigate('/signin');
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
      } else if (err.message.includes('EmailJS')) {
        errorMessage = 'Failed to send confirmation email. Account created, but please check email configuration.';
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
      // Save user to Firestore if new
      await setDoc(doc(db, 'users', user.uid), {
        fullName: user.displayName || '',
        email: user.email,
        role: 'student',
        createdAt: new Date().toISOString(),
        // Add other default fields as needed
      }, { merge: true });
      setSuccess('Signed up with Google! Please complete your profile.');
      navigate('/dashboard');
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
            ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:shadow-md' 
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-md'
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
          theme === 'dark' ? 'bg-rose-900/20 border-rose-900/30 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-600'
        }`}>
          {error}
        </div>
      )}
      
      {success && (
        <div className={`p-4 rounded-2xl border font-medium animate-fade-in ${
          theme === 'dark' ? 'bg-emerald-900/20 border-emerald-900/30 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
        }`}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-bold mb-2 text-left ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`w-full p-4 rounded-2xl outline-none transition-all border ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
              }`}
              placeholder="Full Name"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 text-left ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>Institute Name</label>
            <input
              type="text"
              value={instituteName}
              onChange={(e) => setInstituteName(e.target.value)}
              className={`w-full p-4 rounded-2xl outline-none transition-all border ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
              }`}
              placeholder="College/University"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-bold mb-2 text-left ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full p-4 rounded-2xl outline-none transition-all border ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
              }`}
              placeholder="Email"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 text-left ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-4 rounded-2xl outline-none transition-all border ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
              }`}
              placeholder="Password"
              required
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-bold mb-2 text-left ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
          }`}>Skills (comma-separated)</label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className={`w-full p-4 rounded-2xl outline-none transition-all border ${
              theme === 'dark' 
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
            placeholder="e.g., React, Node.js, Python"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-bold mb-2 text-left ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>LinkedIn URL</label>
            <input
              type="url"
              value={linkedInUrl}
              onChange={(e) => setLinkedInUrl(e.target.value)}
              className={`w-full p-4 rounded-2xl outline-none transition-all border ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
              }`}
              placeholder="https://linkedin.com/in/..."
            />
          </div>
          <div>
            <label className={`block text-sm font-bold mb-2 text-left ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>GitHub URL</label>
            <input
              type="url"
              value={gitHubUrl}
              onChange={(e) => setGitHubUrl(e.target.value)}
              className={`w-full p-4 rounded-2xl outline-none transition-all border ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
              }`}
              placeholder="https://github.com/..."
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-bold mb-4 text-left ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
          }`}>College ID Card (PDF, max 5MB)</label>
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
                ? 'bg-slate-800 border-slate-700 text-slate-400 group-hover:border-blue-500 group-hover:bg-blue-900/10' 
                : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:border-blue-500 group-hover:bg-blue-50'
            }`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm mb-4 text-blue-600 ${
                theme === 'dark' ? 'bg-slate-900' : 'bg-white'
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <span className={`font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{collegeIdFile ? collegeIdFile.name : 'Upload College ID PDF'}</span>
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

export default StudentForm;