import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Plus, X, Briefcase, Clock, MapPin, Star, ChevronDown } from 'lucide-react';
import { auth, db } from '../firebase/firebaseConfig';
import { API_BASE_URL } from '../config/apiConfig';
import { useTheme } from '../context/ThemeContext';

const CreateStartupProject: React.FC = () => {
  const [title, setTitle] = useState('');
  const { theme } = useTheme();
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState('');
  const [location, setLocation] = useState('Remote');
  const [duration, setDuration] = useState('');
  const [level, setLevel] = useState('Intermediate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAddSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('You must be logged in to create a project');

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/projects/startup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          domain,
          description,
          skills,
          location,
          duration,
          level,
          company: user.displayName || 'Your Startup' // Or fetch startup name from Firestore
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create project');
      }

      navigate('/startup-dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-12 px-6 transition-colors duration-500 ${
      theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
    }`}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className={`text-5xl font-black mb-4 tracking-tight transition-colors duration-500 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            Launch New Project
          </h1>
          <p className={`text-lg font-medium transition-colors duration-500 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>Create a new opportunity for students to join your startup</p>
        </div>

        <form onSubmit={handleSubmit} className={`space-y-8 p-10 rounded-[2.5rem] shadow-xl border transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-slate-900/50 border-slate-800 shadow-blue-500/10' 
            : 'bg-white border-slate-100 shadow-blue-500/5'
        }`}>
          {error && (
            <div className={`border p-6 rounded-2xl flex items-center gap-3 animate-fade-in transition-all duration-500 ${
              theme === 'dark' ? 'bg-rose-950/30 border-rose-900/30 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-600'
            }`}>
              <div className="w-2 h-2 bg-rose-600 rounded-full animate-pulse" />
              <p className="font-bold">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className={`text-sm font-black uppercase tracking-wider ml-1 transition-colors duration-500 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}>Project Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-6 py-4 border rounded-2xl outline-none transition-all duration-500 font-medium ${
                theme === 'dark' 
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500'
              }`}
              placeholder="e.g., MVP Development for Fintech App"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className={`text-sm font-black uppercase tracking-wider ml-1 transition-colors duration-500 ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>Industry / Domain</label>
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className={`w-full px-6 py-4 border rounded-2xl outline-none transition-all duration-500 font-medium ${
                  theme === 'dark' 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500'
                }`}
                placeholder="e.g., AI, Fintech, E-commerce"
              />
            </div>
            <div className="space-y-2">
              <label className={`text-sm font-black uppercase tracking-wider ml-1 transition-colors duration-500 ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>Experience Level</label>
              <div className="relative">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className={`w-full px-6 py-4 border rounded-2xl outline-none transition-all duration-500 appearance-none cursor-pointer font-bold ${
                    theme === 'dark' 
                      ? 'bg-slate-950 border-slate-800 text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500'
                  }`}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-black uppercase tracking-wider ml-1 transition-colors duration-500 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}>Project Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-6 py-4 border rounded-2xl outline-none transition-all duration-500 font-medium min-h-[160px] resize-none ${
                theme === 'dark' 
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500'
              }`}
              placeholder="Describe your project, goals, and what you're looking for in collaborators..."
            />
          </div>

          <div className="space-y-4">
            <label className={`text-sm font-black uppercase tracking-wider ml-1 transition-colors duration-500 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}>Technical Stack / Skills</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                className={`flex-1 px-6 py-4 border rounded-2xl outline-none transition-all duration-500 font-medium ${
                  theme === 'dark' 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500'
                }`}
                placeholder="Add a skill (e.g., React, Node.js, AWS)"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all duration-500 shadow-xl shadow-blue-600/20 active:scale-95 focus:ring-4 focus:ring-blue-500/50 outline-none"
              >
                <Plus size={24} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => (
                <span key={skill} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm border transition-all duration-500 ${
                  theme === 'dark' 
                    ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' 
                    : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                  {skill}
                  <button type="button" onClick={() => handleRemoveSkill(skill)} className="text-blue-400 hover:text-rose-500 transition-colors duration-500">
                    <X size={16} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className={`text-sm font-black uppercase tracking-wider ml-1 transition-colors duration-500 ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`w-full px-6 py-4 border rounded-2xl outline-none transition-all duration-500 font-medium ${
                  theme === 'dark' 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500'
                }`}
                placeholder="e.g., Remote, San Francisco"
              />
            </div>
            <div className="space-y-2">
              <label className={`text-sm font-black uppercase tracking-wider ml-1 transition-colors duration-500 ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>Project Duration</label>
              <input
                type="text"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={`w-full px-6 py-4 border rounded-2xl outline-none transition-all duration-500 font-medium ${
                  theme === 'dark' 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500'
                }`}
                placeholder="e.g., 2 weeks, 3 months"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all duration-500 shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] focus:ring-4 focus:ring-blue-500/50 outline-none"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Rocket size={24} />
                Launch Project
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateStartupProject;
