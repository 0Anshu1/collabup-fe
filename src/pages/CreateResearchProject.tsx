import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebaseConfig';
import { API_BASE_URL } from '../config/apiConfig';
import { Rocket, Plus, X, BookOpen, Clock, MapPin, GraduationCap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const CreateResearchProject: React.FC = () => {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState('');
  const [location, setLocation] = useState('Remote');
  const [duration, setDuration] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [certificate, setCertificate] = useState(false);
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
      const response = await fetch(`${API_BASE_URL}/api/projects/research`, {
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
          certificate
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create project');
      }

      navigate('/faculty-dashboard');
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
            Create Research Project
          </h1>
          <p className={`text-lg font-medium transition-colors duration-500 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>Publish a new research opportunity for students</p>
        </div>

        <form onSubmit={handleSubmit} className={`space-y-8 p-10 rounded-[2.5rem] shadow-xl border transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-slate-900 border-slate-800 shadow-blue-500/10' 
            : 'bg-white border-slate-100 shadow-blue-500/5'
        }`}>
          {error && (
            <div className={`mb-8 p-6 rounded-3xl border flex items-center gap-4 animate-fade-in transition-all duration-500 ${
              theme === 'dark' ? 'bg-rose-900/20 text-rose-400 border-rose-900/50' : 'bg-rose-50 text-rose-600 border-rose-100'
            }`}>
              <div className="w-2 h-2 bg-rose-600 rounded-full animate-pulse" />
              <p className="font-bold">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className={`text-sm font-black uppercase tracking-wider ml-1 transition-colors duration-500 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-900'
            }`}>Project Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-6 py-4 border rounded-2xl outline-none transition-all duration-500 font-medium ${
                theme === 'dark' 
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
              }`}
              placeholder="e.g., AI-Driven Drug Discovery"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className={`text-sm font-black uppercase tracking-wider ml-1 transition-colors duration-500 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-900'
              }`}>Research Domain</label>
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className={`w-full px-6 py-4 border rounded-2xl outline-none transition-all duration-500 font-medium ${
                  theme === 'dark' 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                }`}
                placeholder="e.g., Biotechnology, ML"
              />
            </div>
            <div className="space-y-2">
              <label className={`text-sm font-black uppercase tracking-wider ml-1 transition-colors duration-500 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-900'
              }`}>Target Students</label>
              <div className="relative">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className={`w-full px-6 py-4 border rounded-2xl outline-none transition-all duration-500 appearance-none cursor-pointer font-bold ${
                    theme === 'dark' 
                      ? 'bg-slate-950 border-slate-800 text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                  }`}
                >
                  <option>Undergraduate</option>
                  <option>Graduate</option>
                  <option>Post-Graduate</option>
                  <option>Open to All</option>
                </select>
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-black uppercase tracking-wider ml-1 transition-colors duration-500 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-900'
            }`}>Abstract / Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-6 py-4 border rounded-2xl outline-none transition-all duration-500 font-medium h-40 resize-none ${
                theme === 'dark' 
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
              }`}
              placeholder="Detail the research goals, methodology, and expected outcomes..."
            />
          </div>

          <div className="space-y-4">
            <label className={`text-sm font-black uppercase tracking-wider ml-1 transition-colors duration-500 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-900'
            }`}>Required Skills</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                className={`flex-1 px-6 py-4 border rounded-2xl outline-none transition-all duration-500 font-medium ${
                  theme === 'dark' 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                }`}
                placeholder="Add a skill (e.g., Python, LaTeX)"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all duration-500 shadow-lg shadow-blue-600/20"
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
                theme === 'dark' ? 'text-slate-400' : 'text-slate-900'
              }`}>Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`w-full px-6 py-4 border rounded-2xl outline-none transition-all duration-500 font-medium ${
                  theme === 'dark' 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                }`}
                placeholder="e.g., Remote, On-campus"
              />
            </div>
            <div className="space-y-2">
              <label className={`text-sm font-black uppercase tracking-wider ml-1 transition-colors duration-500 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-900'
              }`}>Duration</label>
              <input
                type="text"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={`w-full px-6 py-4 border rounded-2xl outline-none transition-all duration-500 font-medium ${
                  theme === 'dark' 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                }`}
                placeholder="e.g., 3 months, 6 months"
              />
            </div>
          </div>

          <div className={`flex items-center gap-4 p-6 rounded-[2rem] border transition-all duration-500 ${
            theme === 'dark' 
              ? 'bg-slate-950/50 border-slate-800' 
              : 'bg-slate-50 border-slate-100'
          }`}>
            <div className="relative inline-block w-12 h-6 transition duration-500 ease-in-out rounded-full">
              <input
                type="checkbox"
                id="certificate"
                checked={certificate}
                onChange={(e) => setCertificate(e.target.checked)}
                className={`absolute w-6 h-6 border-2 rounded-full appearance-none cursor-pointer checked:right-0 checked:bg-blue-600 checked:border-blue-600 right-6 transition-all duration-500 ${
                  theme === 'dark' ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'
                }`}
              />
              <label htmlFor="certificate" className={`block h-6 overflow-hidden rounded-full cursor-pointer transition-colors duration-500 ${
                theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
              }`}></label>
            </div>
            <label htmlFor="certificate" className={`text-sm font-bold cursor-pointer transition-colors duration-500 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Certificate of Completion Offered
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all duration-500 shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Rocket size="24" />
                  Publish Research Project
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/faculty-dashboard')}
              className={`px-10 rounded-2xl font-bold transition-all duration-500 ${
                theme === 'dark' 
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateResearchProject;
