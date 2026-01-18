import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { buildProfileObjectPath, uploadViaSignedUrl, getSignedReadUrl } from '../utils/gcsUpload';
import { v4 as uuidv4 } from 'uuid';
import { User as UserIcon, Upload, Save, ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface UserData {
  fullName?: string;
  startupName?: string;
  founderName?: string;
  instituteName?: string;
  institute?: string;
  email: string;
  skills?: string[];
  researchAreas?: string[];
  expertiseAreas?: string[];
  yearsOfExperience?: number;
  leetCodeUrl?: string;
  codeForcesUrl?: string;
  linkedInUrl?: string;
  gitHubUrl?: string;
  website?: string;
  industry?: string;
  companyDescription?: string;
  profilePicUrl?: string;
  role: string;
}

const EditProfile: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Form fields
  const [fullName, setFullName] = useState('');
  const [instituteName, setInstituteName] = useState('');
  const [skills, setSkills] = useState('');
  const [researchAreas, setResearchAreas] = useState('');
  const [expertiseAreas, setExpertiseAreas] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState<number | ''>('');
  const [leetCodeUrl, setLeetCodeUrl] = useState('');
  const [codeForcesUrl, setCodeForcesUrl] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [gitHubUrl, setGitHubUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            setUserData(data);
            
            // Set form fields based on user role
            setFullName(data.fullName || data.startupName || data.founderName || '');
            setInstituteName(data.instituteName || data.institute || '');
            setSkills(data.skills ? data.skills.join(', ') : '');
            setResearchAreas(data.researchAreas ? data.researchAreas.join(', ') : '');
            setExpertiseAreas(data.expertiseAreas ? data.expertiseAreas.join(', ') : '');
            setYearsOfExperience(data.yearsOfExperience || '');
            setLeetCodeUrl(data.leetCodeUrl || '');
            setCodeForcesUrl(data.codeForcesUrl || '');
            setLinkedInUrl(data.linkedInUrl || '');
            setGitHubUrl(data.gitHubUrl || '');
            setWebsite(data.website || '');
            setIndustry(data.industry || '');
            setCompanyDescription(data.companyDescription || '');
            setPreviewUrl(data.profilePicUrl || null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Failed to load user data');
        }
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        setError('Profile picture must be a PNG or JPEG image.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError('Profile picture size must be less than 2MB.');
        return;
      }
      setProfilePic(file);
      setError(null);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userData) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let profilePicUrl = userData.profilePicUrl || null;
      let profilePicObjectPath = (userData as any).profilePicObjectPath || null;

      // Upload new profile picture via signed URL (GCS) if selected
      if (profilePic) {
        const objectPath = buildProfileObjectPath(userData.role, currentUser.uid, profilePic.name);
        await uploadViaSignedUrl(objectPath, profilePic);
        // Get a short-lived read URL to display; store the objectPath in Firestore
        profilePicUrl = await getSignedReadUrl(objectPath);
        profilePicObjectPath = objectPath;
      }

      // Prepare update data based on user role
      const updateData: any = {
        profilePicUrl,
        profilePicObjectPath,
        updatedAt: new Date().toISOString()
      };

      if (userData.role === 'student') {
        updateData.fullName = fullName;
        updateData.instituteName = instituteName;
        updateData.skills = skills.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        updateData.leetCodeUrl = leetCodeUrl || null;
        updateData.codeForcesUrl = codeForcesUrl || null;
        updateData.linkedInUrl = linkedInUrl || null;
        updateData.gitHubUrl = gitHubUrl || null;
      } else if (userData.role === 'faculty') {
        updateData.fullName = fullName;
        updateData.institute = instituteName;
        updateData.researchAreas = researchAreas.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      } else if (userData.role === 'mentor') {
        updateData.fullName = fullName;
        updateData.expertiseAreas = expertiseAreas.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        updateData.yearsOfExperience = Number(yearsOfExperience);
        updateData.linkedInUrl = linkedInUrl || null;
      } else if (userData.role === 'startup') {
        updateData.startupName = fullName;
        updateData.founderName = fullName;
        updateData.website = website || null;
        updateData.industry = industry;
        updateData.companyDescription = companyDescription;
      }

      await updateDoc(doc(db, 'users', currentUser.uid), updateData);
      setSuccess('Profile updated successfully!');
      
      // Update local state
      setUserData({ ...userData, ...updateData });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen transition-colors duration-500 ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
      }`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className={`font-bold animate-pulse transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !userData) {
    return (
      <div className={`flex items-center justify-center min-h-screen transition-colors duration-500 p-6 ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
      }`}>
        <div className={`rounded-[2.5rem] p-12 text-center shadow-xl border max-w-md w-full animate-scale-in transition-all duration-500 ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-blue-500/10' : 'bg-white border-slate-100 shadow-blue-500/5'
        }`}>
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 transition-colors duration-500 ${
            theme === 'dark' ? 'bg-rose-900/20' : 'bg-rose-50'
          }`}>
            <UserIcon className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className={`text-2xl font-black mb-4 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Access Denied</h2>
          <p className={`font-medium mb-10 leading-relaxed transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Please sign in to view and edit your professional profile.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full px-8 py-4 rounded-2xl font-black transition-all duration-500 shadow-xl uppercase tracking-widest text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 py-12 px-6 animate-fade-in ${
      theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
    }`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 transition-all duration-500 font-black uppercase tracking-widest text-xs group ${
              theme === 'dark' ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'
            }`}
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-500" />
            Back to Dashboard
          </button>
        </div>

        <div className={`rounded-[2.5rem] shadow-2xl p-10 md:p-16 border relative overflow-hidden animate-scale-in transition-all duration-500 ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-blue-500/10' : 'bg-white border-slate-100 shadow-blue-500/5'
        }`}>
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-blue-700" />
          
          <div className="text-center mb-16">
            <h1 className={`text-5xl font-black mb-4 tracking-tight transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Edit Profile</h1>
            <p className={`font-medium text-lg transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Keep your professional information up to date</p>
          </div>

          {error && (
            <div className={`mb-10 p-6 rounded-3xl border flex items-center gap-4 animate-fade-in transition-all duration-500 ${
              theme === 'dark' ? 'bg-rose-900/20 text-rose-400 border-rose-900/50' : 'bg-rose-50 text-rose-600 border-rose-100'
            }`}>
              <div className="w-2 h-2 bg-rose-600 rounded-full animate-pulse" />
              <p className="font-bold">{error}</p>
            </div>
          )}

          {success && (
            <div className={`mb-10 p-6 rounded-3xl border flex items-center gap-4 animate-fade-in transition-all duration-500 ${
              theme === 'dark' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
              <p className="font-bold">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className={`w-40 h-40 rounded-[2.5rem] overflow-hidden flex items-center justify-center border-4 shadow-2xl transition-transform duration-500 group-hover:scale-105 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-white'
                }`}>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className={`w-16 h-16 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`} />
                  )}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-8 h-8 text-white animate-bounce" />
                  </div>
                </div>
                <label className={`absolute -bottom-4 -right-4 bg-blue-600 rounded-2xl p-4 cursor-pointer hover:bg-blue-700 hover:scale-110 transition-all shadow-xl shadow-blue-600/30 border-4 ${
                  theme === 'dark' ? 'border-slate-800' : 'border-white'
                }`}>
                  <Upload className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleProfilePicChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className={`mt-8 text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Update Profile Picture</p>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className={`text-xs font-black uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>
                  {userData.role === 'startup' ? 'Startup Name' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full px-8 py-5 border rounded-2xl outline-none transition-all duration-500 font-bold ${
                    theme === 'dark' 
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900' 
                      : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white'
                  }`}
                  placeholder={userData.role === 'startup' ? 'Enter startup name' : 'Enter your full name'}
                  required
                />
              </div>

              <div className="space-y-3">
                <label className={`text-xs font-black uppercase tracking-widest ml-1 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>
                  {userData.role === 'startup' ? 'Founder Name' : 'Institute/Organization'}
                </label>
                <input
                  type="text"
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  className={`w-full px-8 py-5 border rounded-2xl outline-none transition-all duration-500 font-bold ${
                    theme === 'dark' 
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900' 
                      : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white'
                  }`}
                  placeholder={userData.role === 'startup' ? 'Enter founder name' : 'Enter institute name'}
                  required
                />
              </div>
            </div>

            {/* Role-specific fields */}
            {userData.role === 'student' && (
              <>
                <div className="space-y-3">
                  <label className={`text-xs font-black uppercase tracking-widest ml-1 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className={`w-full px-8 py-5 border rounded-2xl outline-none transition-all duration-500 font-bold ${
                      theme === 'dark' 
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900' 
                        : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white'
                    }`}
                    placeholder="e.g., React, Node.js, Python"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className={`text-xs font-black uppercase tracking-widest ml-1 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>LeetCode Profile URL</label>
                    <input
                      type="url"
                      value={leetCodeUrl}
                      onChange={(e) => setLeetCodeUrl(e.target.value)}
                      className={`w-full px-8 py-5 border rounded-2xl outline-none transition-all duration-500 font-bold ${
                        theme === 'dark' 
                          ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900' 
                          : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white'
                      }`}
                      placeholder="https://leetcode.com/yourusername"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className={`text-xs font-black uppercase tracking-widest ml-1 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>CodeForces Profile URL</label>
                    <input
                      type="url"
                      value={codeForcesUrl}
                      onChange={(e) => setCodeForcesUrl(e.target.value)}
                      className={`w-full px-8 py-5 border rounded-2xl outline-none transition-all duration-500 font-bold ${
                        theme === 'dark' 
                          ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900' 
                          : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white'
                      }`}
                      placeholder="https://codeforces.com/profile/yourusername"
                    />
                  </div>
                </div>
              </>
            )}

            {userData.role === 'faculty' && (
              <div className="space-y-3">
                <label className={`text-xs font-black uppercase tracking-widest ml-1 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>Research Areas (comma-separated)</label>
                <input
                  type="text"
                  value={researchAreas}
                  onChange={(e) => setResearchAreas(e.target.value)}
                  className={`w-full px-8 py-5 border rounded-2xl outline-none transition-all duration-500 font-bold ${
                    theme === 'dark' 
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900' 
                      : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white'
                  }`}
                  placeholder="e.g., Machine Learning, AI, Data Science"
                />
              </div>
            )}

            {userData.role === 'mentor' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className={`text-xs font-black uppercase tracking-widest ml-1 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>Expertise Areas (comma-separated)</label>
                  <input
                    type="text"
                    value={expertiseAreas}
                    onChange={(e) => setExpertiseAreas(e.target.value)}
                    className={`w-full px-8 py-5 border rounded-2xl outline-none transition-all duration-500 font-bold ${
                      theme === 'dark' 
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900' 
                        : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white'
                    }`}
                    placeholder="e.g., Web Development, Machine Learning, UI/UX"
                  />
                </div>
                <div className="space-y-3">
                  <label className={`text-xs font-black uppercase tracking-widest ml-1 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>Years of Experience</label>
                  <input
                    type="number"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value === '' ? '' : Number(e.target.value))}
                    className={`w-full px-8 py-5 border rounded-2xl outline-none transition-all duration-500 font-bold ${
                      theme === 'dark' 
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900' 
                        : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white'
                    }`}
                    placeholder="Enter years of experience"
                    min="0"
                  />
                </div>
              </div>
            )}

            {userData.role === 'startup' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className={`text-xs font-black uppercase tracking-widest ml-1 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>Website</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className={`w-full px-8 py-5 border rounded-2xl outline-none transition-all duration-500 font-bold ${
                        theme === 'dark' 
                          ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900' 
                          : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white'
                      }`}
                      placeholder="https://yourstartup.com"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className={`text-xs font-black uppercase tracking-widest ml-1 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>Industry</label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className={`w-full px-8 py-5 border rounded-2xl outline-none transition-all duration-500 font-bold ${
                        theme === 'dark' 
                          ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900' 
                          : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white'
                      }`}
                      placeholder="e.g., Technology, Healthcare, Finance"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className={`text-xs font-black uppercase tracking-widest ml-1 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>Company Description</label>
                  <textarea
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    className={`w-full px-8 py-5 border rounded-2xl outline-none transition-all duration-500 font-bold h-48 resize-none ${
                      theme === 'dark' 
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900' 
                        : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white'
                    }`}
                    placeholder="Describe your startup and what you do..."
                    required
                  />
                </div>
              </>
            )}

            {/* Social Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className={`text-xs font-black uppercase tracking-widest ml-1 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  className={`w-full px-8 py-5 border rounded-2xl outline-none transition-all duration-500 font-bold ${
                    theme === 'dark' 
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900' 
                      : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white'
                  }`}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div className="space-y-3">
                <label className={`text-xs font-black uppercase tracking-widest ml-1 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>GitHub Profile URL</label>
                <input
                  type="url"
                  value={gitHubUrl}
                  onChange={(e) => setGitHubUrl(e.target.value)}
                  className={`w-full px-8 py-5 border rounded-2xl outline-none transition-all duration-500 font-bold ${
                    theme === 'dark' 
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900' 
                      : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white'
                  }`}
                  placeholder="https://github.com/username"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full font-black py-6 rounded-3xl transition-all duration-500 transform active:scale-[0.98] shadow-2xl flex items-center justify-center gap-4 group uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 hover:shadow-blue-600/30"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Update Profile</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile; 