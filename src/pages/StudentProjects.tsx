import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../firebase/firebaseConfig';
import { API_BASE_URL } from '../config/apiConfig';
import { Search, ChevronDown, Upload, X, Check } from 'lucide-react';
import { sendCollabEmail } from '../utils/sendCollabEmail';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStudentProjects, addStudentProject } from '../firebase/firebaseService';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

interface Project {
  id: string;
  title: string;
  description: string;
  domain: string;
  level: string;
  technologies: string[];
  duration: string;
  coverUrl: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  location: string;
  matchScore?: number;
}

const domains = [
  'Web Development',
  'Mobile Development',
  'Machine Learning',
  'Data Science',
  'IoT',
  'Blockchain',
  'Cloud Computing',
  'Cybersecurity',
  'DevOps',
  'UI/UX Design'
];

const levels = [
  'Beginner',
  'Intermediate',
  'Advanced'
];

const durations = [
  '1 Month',
  '2 Months',
  '3 Months',
  '6 Months'
];

const technologies = [
  'React',
  'Node.js',
  'Python',
  'Java',
  'Machine Learning',
  'AWS',
  'Docker',
  'Kubernetes',
  'Flutter',
  'UI/UX'
];


// ProjectCard and related modals removed for production cleanup.

const StudentProjects = () => {
  const { theme } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedTechnology, setSelectedTechnology] = useState('');
  const [showThankYou, setShowThankYou] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    domain: '',
    level: '',
    technologies: '',
    duration: '',
    ownerName: '',
    ownerEmail: '',
    location: '',
    coverUrl: '',
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getStudentProjects();
        setProjects(data);
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchUserData = async (user: User) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setForm(prev => ({
            ...prev,
            ownerName: userData.fullName || userData.name || '',
            ownerEmail: userData.email || user.email || '',
          }));
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchUserData(user);
      }
    });
    return () => unsubscribe();
  }, []);
  const [showForm, setShowForm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // If an ID is present, show only the selected project card
  const params = new URLSearchParams(location.search);
  const selectedId = params.get('id');
  let selectedProject: Project | undefined = undefined;
  if (selectedId) {
    selectedProject = projects.find(p => String(p.id) === String(selectedId));
  }


  // Inline ProjectCard component
  const ProjectCard = ({ project, onCollaborate }: { project: Project, onCollaborate: (project: Project) => void }) => (
    <div className={`rounded-[2rem] p-8 border flex flex-col justify-between shadow-sm group hover:shadow-2xl transition-all duration-500 relative overflow-hidden ${
      theme === 'dark' 
        ? 'bg-slate-950 border-slate-800 hover:shadow-blue-900/10' 
        : 'bg-white border-slate-100 hover:shadow-blue-500/10'
    }`}>
      <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative">
        <div className={`relative mb-6 overflow-hidden rounded-2xl border ${
          theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <img 
            src={project.coverUrl || 'https://via.placeholder.com/400x200?text=Project+Cover'} 
            alt={project.title} 
            className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
          />
          {project.matchScore && (
            <div className={`absolute top-4 right-4 backdrop-blur-md text-blue-400 text-xs font-black px-4 py-2 rounded-full shadow-lg border transition-all duration-500 ${
              theme === 'dark' ? 'bg-slate-950 border-blue-500/20' : 'bg-white/90 border-blue-500/20'
            }`}>
              {project.matchScore}% MATCH
            </div>
          )}
        </div>

        <h3 className={`text-2xl font-black mb-3 group-hover:text-blue-400 transition-all duration-500 ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}>{project.title}</h3>
        <p className={`font-medium mb-6 line-clamp-2 leading-relaxed transition-all duration-500 ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>{project.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {project.technologies && project.technologies.map((tech, idx) => (
            <span key={idx} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all duration-500 ${
              theme === 'dark' 
                ? 'bg-blue-900/30 text-blue-400 border-blue-800/50' 
                : 'bg-blue-50 text-blue-600 border-blue-100'
            }`}>
              {tech}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {[project.domain, project.level, project.duration, project.location].map((item, idx) => (
            <div key={idx} className={`p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all duration-500 ${
              theme === 'dark' 
                ? 'bg-slate-900/50 border-slate-700/50 text-slate-500' 
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${theme === 'dark' ? 'bg-slate-600' : 'bg-slate-400'}`} />
              {item}
            </div>
          ))}
        </div>

        <div className={`flex items-center gap-3 mb-8 pt-6 border-t transition-all duration-500 ${
          theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border transition-all duration-500 ${
            theme === 'dark' 
              ? 'bg-blue-900/30 text-blue-400 border-blue-800/50' 
              : 'bg-blue-50 text-blue-600 border-blue-100'
          }`}>
            {project.ownerName?.charAt(0)}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Posted by</p>
            <p className={`text-sm font-bold transition-all duration-500 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{project.ownerName}</p>
          </div>
        </div>
      </div>

      <button 
        onClick={() => onCollaborate(project)}
        className="w-full bg-blue-600 text-white py-4 rounded-xl font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.02] transition-all duration-500 flex items-center justify-center gap-3 focus:ring-4 focus:ring-blue-500/50 outline-none"
      >
        Collaborate
        <Check size={18} />
      </button>
    </div>
  );

  // Collaborate handler
  const handleCollaborate = async (project: Project) => {
    setSubmitting(true);
    setSubmitError('');
    try {
      await sendCollabEmail({
        to: project.ownerEmail,
        subject: `Collaboration Request for ${project.title}`,
        html: `<p>Hello ${project.ownerName},</p><p>A student is interested in collaborating on your project: <b>${project.title}</b>.</p>`
      });
      setShowThankYou(true);
      setTimeout(() => setShowThankYou(false), 3000);
    } catch (err) {
      setSubmitError('Failed to send collaboration request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (selectedId && selectedProject) {
    return (
      <div className={`min-h-screen py-12 px-6 transition-all duration-500 ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <button 
              onClick={() => navigate(-1)} 
              className="text-blue-400 hover:underline mb-4 focus:ring-4 focus:ring-blue-500/50 outline-none transition-all duration-500 rounded-lg px-2"
            >
              &larr; Back
            </button>
          </div>
          <ProjectCard project={selectedProject} onCollaborate={handleCollaborate} />
          {showThankYou && (
            <div className="mt-4 text-green-400 font-semibold animate-fade-in">Collaboration request sent!</div>
          )}
          {submitError && (
            <div className="mt-4 text-red-400 font-semibold animate-fade-in">{submitError}</div>
          )}
        </div>
      </div>
    );
  }

  const filteredProjects = !selectedId
    ? projects.filter(project => {
        const searchMatch = searchTerm === '' || 
          project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.technologies.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));
        const domainMatch = !selectedDomain || project.domain === selectedDomain;
        const levelMatch = !selectedLevel || project.level === selectedLevel;
        const durationMatch = !selectedDuration || project.duration === selectedDuration;
        const technologyMatch = !selectedTechnology || project.technologies.includes(selectedTechnology);
        return searchMatch && domainMatch && levelMatch && durationMatch && technologyMatch;
      })
    : [];

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please log in to submit a project.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const token = await currentUser.getIdToken();
      const projectData = {
        title: form.title,
        description: form.description,
        domain: form.domain,
        level: form.level,
        technologies: form.technologies.split(',').map(t => t.trim()).filter(t => t !== ''),
        duration: form.duration,
        location: form.location,
        coverUrl: form.coverUrl || 'https://via.placeholder.com/400x200?text=Project+Cover',
      };

      const response = await fetch(`${API_BASE_URL}/api/projects/student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit project');
      }
      
      // Also send email notification
      const html = `<h2>New Student Project Submission</h2><ul>${Object.entries(projectData).map(([k,v]) => `<li><b>${k}:</b> ${Array.isArray(v) ? v.join(', ') : v}</li>`).join('')}</ul>`;
      await sendCollabEmail({
        to: 'collabup4@gmail.com',
        subject: '[URGENT]! Project Review',
        text: `New project submitted: ${form.title} by ${form.ownerName} (${form.ownerEmail})`,
        html,
      });

      setShowThankYou(true);
      setShowForm(false);
      setForm({ title: '', description: '', domain: '', level: '', technologies: '', duration: '', ownerName: form.ownerName, ownerEmail: form.ownerEmail, location: '', coverUrl: '' });
      
      // Refresh projects list
      const updatedProjects = await getStudentProjects();
      setProjects(updatedProjects);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit project. Please try again.');
      console.error('Error submitting project:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen transition-colors duration-500 ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
      }`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className={`font-bold animate-pulse transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
  <div className={`min-h-screen py-12 px-6 transition-colors duration-500 ${
    theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
  }`}>
    <div className="max-w-7xl mx-auto">
      {currentUser ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            { title: 'Recommended', color: 'blue', text: 'AI-powered recommendations will appear here based on your interests.' },
            { title: 'My Portfolio', color: 'blue', text: 'Track your joined projects and showcase your achievements here.' },
            { title: 'Earned Badges', color: 'amber', text: 'Your collection of earned badges and certificates will be displayed here.' },
            { title: 'Mentor Suggestions', color: 'emerald', text: 'Connect with recommended mentors who match your project goals.' }
          ].map((item, idx) => (
            <div key={idx} className={`rounded-[2rem] p-8 shadow-sm border transition-all duration-500 group ${
              theme === 'dark' 
                ? `bg-slate-900 border-slate-800 hover:shadow-${item.color}-900/10` 
                : `bg-white border-slate-100 hover:shadow-${item.color}-500/5`
            }`}>
              <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 transition-colors duration-500 ${
                item.color === 'blue' ? 'text-blue-500' : 
                item.color === 'amber' ? 'text-amber-500' : 'text-emerald-500'
              }`}>
                <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                  item.color === 'blue' ? 'bg-blue-500' : 
                  item.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}></div>
                {item.title}
              </h2>
              <p className={`text-sm leading-relaxed transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{item.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className={`rounded-[3rem] p-12 text-center shadow-sm border mb-16 transition-all duration-500 ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <h2 className={`text-3xl font-black mb-4 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Welcome to Student Projects</h2>
          <p className={`text-lg max-w-2xl mx-auto mb-8 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Log in to unlock personalized project recommendations, build your portfolio, and earn achievement badges.</p>
          <button 
            onClick={() => navigate('/login')}
            className={`px-8 py-4 rounded-2xl font-bold transition-all duration-500 shadow-xl active:scale-95 ${
              theme === 'dark' 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
            }`}
          >
            Get Started
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className={`text-5xl font-black mb-4 tracking-tight transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Student Projects</h1>
          <p className={`text-xl font-medium transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Discover and collaborate on innovative student-led initiatives.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className={`flex items-center gap-3 px-10 py-5 rounded-[1.5rem] font-bold shadow-2xl transition-all duration-500 hover:scale-105 active:scale-95 ${
            theme === 'dark' 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
          }`}
        >
          <Upload size={24} /> 
          <span>Upload Project</span>
        </button>
      </div>

      <div className={`rounded-[2.5rem] shadow-sm p-10 mb-16 border transition-all duration-500 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
            <input
              type="text"
              placeholder="Search by title, domain, or tech stack..."
              className={`w-full pl-14 pr-6 py-5 border rounded-2xl outline-none transition-all duration-500 font-medium ${
                theme === 'dark' 
                  ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-slate-900' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white'
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className={`w-full appearance-none pl-6 pr-12 py-5 border rounded-2xl outline-none transition-all duration-500 font-bold cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500/20 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
              }`}
            >
              <option value="">All Domains</option>
              {domains.map((domain) => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
          </div>

          <div className="relative">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className={`w-full appearance-none pl-6 pr-12 py-5 border rounded-2xl outline-none transition-all duration-500 font-bold cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500/20 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
              }`}
            >
              <option value="">All Levels</option>
              {levels.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className={`rounded-[3rem] p-10 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border animate-in fade-in zoom-in duration-300 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <button
              onClick={() => setShowForm(false)}
              className={`absolute top-8 right-8 transition-colors p-2 rounded-xl ${
                theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-400 hover:text-slate-900'
              }`}
            >
              <X size={24} />
            </button>
            <h2 className={`text-3xl font-black mb-8 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Submit Your Project</h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleProjectSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Project Title</label>
                <input name="title" value={form.title} onChange={handleFormChange} required placeholder="e.g. AI Study Assistant" className={`w-full p-4 rounded-2xl border outline-none transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/20 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                }`} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Your Name</label>
                <input name="ownerName" value={form.ownerName} onChange={handleFormChange} required placeholder="Your full name" className={`w-full p-4 rounded-2xl border outline-none transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/20 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                }`} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                <input name="ownerEmail" value={form.ownerEmail} onChange={handleFormChange} required type="email" placeholder="hello@example.com" className={`w-full p-4 rounded-2xl border outline-none transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/20 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                }`} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Location</label>
                <input name="location" value={form.location} onChange={handleFormChange} required placeholder="e.g. Remote, Mumbai" className={`w-full p-4 rounded-2xl border outline-none transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/20 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                }`} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Domain</label>
                <input name="domain" value={form.domain} onChange={handleFormChange} required placeholder="e.g. Web Development" className={`w-full p-4 rounded-2xl border outline-none transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/20 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                }`} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Difficulty Level</label>
                <input name="level" value={form.level} onChange={handleFormChange} required placeholder="Beginner/Intermediate/Advanced" className={`w-full p-4 rounded-2xl border outline-none transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/20 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                }`} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Duration</label>
                <input name="duration" value={form.duration} onChange={handleFormChange} required placeholder="e.g. 3 Months" className={`w-full p-4 rounded-2xl border outline-none transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/20 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                }`} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Cover Image URL</label>
                <input name="coverUrl" value={form.coverUrl} onChange={handleFormChange} placeholder="https://..." className={`w-full p-4 rounded-2xl border outline-none transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/20 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                }`} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Technologies</label>
                <input name="technologies" value={form.technologies} onChange={handleFormChange} required placeholder="React, Node.js, Firebase (comma separated)" className={`w-full p-4 rounded-2xl border outline-none transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/20 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                }`} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Project Description</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} required placeholder="Describe your project, goals, and who you're looking for..." className={`w-full p-4 rounded-2xl border outline-none transition-all min-h-[120px] resize-none ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/20 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                }`} rows={4} />
              </div>
              <div className="md:col-span-2 flex items-center justify-between pt-4">
                <button type="submit" disabled={submitting} className={`px-10 py-4 rounded-2xl font-bold shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${
                  theme === 'dark' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
                }`}>
                  {submitting ? 'Submitting...' : 'Launch Project'}
                </button>
                {submitError && <span className="text-rose-600 font-bold text-sm">{submitError}</span>}
              </div>
            </form>
          </div>
        </div>
      )}

      {showThankYou && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-6">
          <div className={`rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border animate-in fade-in zoom-in duration-300 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 ${
              theme === 'dark' ? 'bg-emerald-900/20 text-emerald-500' : 'bg-emerald-100 text-emerald-600'
            }`}>
              <Check size={40} strokeWidth={3} />
            </div>
            <h3 className={`text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Project Launched! 🎉</h3>
            <p className={`font-medium mb-10 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Your project is now live and ready for collaboration. We'll notify you when someone shows interest.</p>
            <button 
              onClick={() => setShowThankYou(false)} 
              className={`w-full py-5 rounded-2xl font-bold transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-800 text-white hover:bg-slate-700' 
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              Back to Projects
            </button>
          </div>
        </div>
      )}

      {filteredProjects.length === 0 ? (
        <div className={`text-center py-32 rounded-[3rem] border shadow-sm transition-all duration-500 ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <p className={`text-xl font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No projects found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredProjects.map((project) => (
            <div key={project.id} className={`rounded-[2.5rem] p-8 border flex flex-col justify-between shadow-sm group hover:shadow-2xl transition-all duration-500 ${
              theme === 'dark' 
                ? 'bg-slate-900 border-slate-800 hover:shadow-blue-900/10 hover:border-blue-900/50' 
                : 'bg-white border-slate-100 hover:shadow-blue-500/10 hover:border-blue-200'
            }`}>
              <div className="relative">
                <div className={`h-56 w-full mb-8 overflow-hidden rounded-[1.5rem] relative group-hover:scale-[1.02] transition-all duration-500 ${
                  theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
                }`}>
                  <img 
                    src={project.coverUrl || 'https://via.placeholder.com/400x200?text=Project+Cover'} 
                    alt={project.title} 
                    className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity" 
                  />
                  {project.matchScore && (
                    <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-black px-4 py-2 rounded-full shadow-xl shadow-blue-600/20">
                      {project.matchScore}% MATCH
                    </div>
                  )}
                </div>
                
                <h3 className={`text-2xl font-black mb-3 group-hover:text-blue-600 transition-colors duration-500 leading-tight ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>{project.title}</h3>
                <p className={`font-medium mb-6 line-clamp-2 leading-relaxed transition-colors duration-500 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>{project.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.technologies?.slice(0, 3).map((tech, idx) => (
                    <span key={idx} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-500 ${
                      theme === 'dark' 
                        ? 'bg-blue-900/30 text-blue-400 border-blue-800/50' 
                        : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>{tech}</span>
                  ))}
                  {project.technologies?.length > 3 && (
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-500 ${
                      theme === 'dark' ? 'bg-slate-950 text-slate-500' : 'bg-slate-50 text-slate-400'
                    }`}>+{project.technologies.length - 3}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className={`px-4 py-2 rounded-xl border flex flex-col transition-all duration-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Domain</span>
                    <span className={`text-sm font-bold truncate transition-colors duration-500 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{project.domain}</span>
                  </div>
                  <div className={`px-4 py-2 rounded-xl border flex flex-col transition-all duration-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Level</span>
                    <span className={`text-sm font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{project.level}</span>
                  </div>
                </div>

                <div className={`flex items-center justify-between pt-6 border-t transition-colors duration-500 ${
                  theme === 'dark' ? 'border-slate-700' : 'border-slate-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500 ${
                      theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {project.ownerName?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner</p>
                      <p className={`text-sm font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{project.ownerName}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                className={`mt-10 font-bold py-5 px-6 rounded-[1.5rem] transition-all duration-500 transform active:scale-95 shadow-xl ${
                  theme === 'dark' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20' 
                    : 'bg-slate-900 hover:bg-blue-600 text-white shadow-slate-900/10 hover:shadow-blue-600/20'
                }`}
                onClick={() => handleCollaborate(project)}
              >
                Collaborate
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
  );
};

export default StudentProjects;