import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Code, Star, MapPin, GraduationCap, Clock, ChevronDown, Upload, X, Check } from 'lucide-react';
import { auth } from '../firebase/firebaseConfig';
import { enrollInProject, getProjects } from '../firebase/firebaseService';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface Project {
  id: number;
  title: string;
  imageUrl: string;
  domain: string;
  duration: string;
  level: string;
  skills: string[];
  company: string;
  location: string;
  matchScore: number;
  certificate: boolean;
  offeredBy: string;
  description: string;
}

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

const startDateOptions = [
  'Immediately',
  'Within 1 week',
  'Within 2 weeks',
  'Within 1 month'
];

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

const durations = [
  '1 Month',
  '2 Months',
  '3 Months',
  '6 Months'
];

const levels = [
  'Beginner',
  'Intermediate',
  'Advanced'
];

const skillsList = [
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



const EnrollmentModal: React.FC<EnrollmentModalProps> = ({ isOpen, onClose, project }) => {
  const { theme } = useTheme();
  const [idCard, setIdCard] = useState<File | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [startDate, setStartDate] = useState(startDateOptions[0]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!idCard || !resume) return;
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const idCardUrl = 'placeholder-url';
      const resumeUrl = 'placeholder-url';

      await enrollInProject({
        userId: auth.currentUser.uid,
        projectId: project.id,
        startDate,
        idCardUrl,
        resumeUrl
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        setIdCard(null);
        setResume(null);
        setStartDate(startDateOptions[0]);
      }, 3000);
    } catch (error) {
      console.error('Error enrolling in project:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-fade-in transition-all duration-500">
      <div className={`rounded-[2.5rem] p-8 max-w-md w-full relative shadow-2xl border transform animate-scale-in transition-all duration-500 ${
        theme === 'dark' ? 'bg-slate-900/50 border-slate-800 shadow-blue-500/10' : 'bg-white border-slate-100 shadow-blue-500/5'
      }`}>
        {!showSuccess ? (
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className={`text-3xl font-black transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Enroll Now</h2>
              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-all duration-500 ${
                  theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className={`p-4 rounded-2xl border mb-8 transition-colors duration-500 ${
              theme === 'dark' ? 'bg-blue-900/20 border-blue-900/30' : 'bg-blue-50 border-blue-100'
            }`}>
              <h3 className={`text-sm font-black uppercase tracking-widest mb-1 transition-colors duration-500 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-400'}`}>Project</h3>
              <p className={`text-lg font-bold leading-tight transition-colors duration-500 ${theme === 'dark' ? 'text-blue-100' : 'text-blue-900'}`}>{project.title}</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-bold mb-2 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Upload ID Card</label>
                <div className="relative group">
                  <input
                    type="file"
                    onChange={(e) => setIdCard(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <div className={`w-full flex items-center gap-3 px-4 py-3 border rounded-2xl group-hover:border-blue-500 transition-all duration-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm text-blue-600 transition-colors duration-500 ${
                      theme === 'dark' ? 'bg-slate-900' : 'bg-white'
                    }`}>
                      <Upload size={20} />
                    </div>
                    <span className={`font-medium truncate transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {idCard ? idCard.name : 'Choose ID Card'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-bold mb-2 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Upload Resume</label>
                <div className="relative group">
                  <input
                    type="file"
                    onChange={(e) => setResume(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    accept=".pdf,.doc,.docx"
                  />
                  <div className={`w-full flex items-center gap-3 px-4 py-3 border rounded-2xl group-hover:border-blue-500 transition-all duration-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm text-blue-600 transition-colors duration-500 ${
                      theme === 'dark' ? 'bg-slate-900' : 'bg-white'
                    }`}>
                      <Upload size={20} />
                    </div>
                    <span className={`font-medium truncate transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {resume ? resume.name : 'Choose Resume'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-bold mb-2 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>When can you start?</label>
                <div className="relative">
                  <select
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full px-4 py-4 border rounded-2xl outline-none transition-all duration-500 font-bold appearance-none cursor-pointer ${
                      theme === 'dark' 
                        ? 'bg-slate-950 border-slate-800 text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500'
                    }`}
                  >
                    {startDateOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-bold shadow-xl transition-all duration-500 disabled:opacity-50 ${
                  theme === 'dark' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20 hover:scale-[1.02]' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 hover:scale-[1.02]'
                }`}
              >
                {loading ? 'Enrolling...' : 'Confirm Enrollment'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transition-colors duration-500 ${
              theme === 'dark' ? 'bg-emerald-900/20' : 'bg-emerald-100'
            }`}>
              <Check size={40} className="text-emerald-600" />
            </div>
            <h2 className={`text-3xl font-black mb-2 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Enrolled! 🎉</h2>
            <p className={`text-lg transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>The startup will contact you within the next 12 hours.</p>
          </div>
        )}
      </div>
    </div>
  );
};

function StartupProj() {
  const { theme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedSkills, setSelectedSkills] = useState('');
  const [modalProject, setModalProject] = useState<Project | null>(null); // NEW: track which project to show in modal
  const location = useLocation();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const fetchedProjects = await getProjects();
        const params = new URLSearchParams(location.search);
        const selectedId = params.get('id');
        if (selectedId) {
          const found = fetchedProjects.find(p => String(p.id) === selectedId);
          setProjects(found ? [found] : []);
        } else {
          setProjects(fetchedProjects);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [location.search]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen transition-colors duration-500 ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
      }`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className={`font-bold animate-pulse transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Loading opportunities...</p>
        </div>
      </div>
    );
  }

  // If an ID is present, show only the selected project card
  const params = new URLSearchParams(location.search);
  const selectedId = params.get('id');
  let selectedProject: Project | undefined = undefined;
  if (selectedId) {
    selectedProject = projects.find(p => String(p.id) === String(selectedId));
  }

  if (selectedId && selectedProject) {
    return (
      <div className={`min-h-screen transition-colors duration-500 py-12 px-6 ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <button 
              onClick={() => window.history.back()} 
              className={`flex items-center gap-2 transition-all duration-500 font-black uppercase tracking-widest text-xs group ${
                theme === 'dark' ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'
              }`}
            >
              &larr; Back
            </button>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div className={`rounded-[2.5rem] shadow-xl overflow-hidden border transition-all duration-500 ${
              theme === 'dark' ? 'bg-slate-900/50 border-slate-800 shadow-blue-500/10' : 'bg-white border-slate-100 shadow-blue-500/5'
            }`}>
              <div className="relative">
                <img
                  src={selectedProject.imageUrl}
                  alt={selectedProject.title}
                  className="w-full h-64 object-cover"
                />
                <div className={`absolute top-4 right-4 px-4 py-2 rounded-full shadow-lg border backdrop-blur-md transition-all duration-500 ${
                  theme === 'dark' ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-100'
                }`}>
                  <div className="flex items-center gap-2">
                    <Star className="text-yellow-400" size={18} fill="currentColor" />
                    <span className={`font-black transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedProject.matchScore}% MATCH</span>
                  </div>
                </div>
              </div>
              <div className="p-10">
                <div className="mb-8">
                  <h3 className={`text-3xl font-black mb-4 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedProject.title}</h3>
                  <div className={`flex items-center gap-2 mb-6 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    <MapPin size={18} />
                    <span className="font-bold">{selectedProject.location}</span>
                  </div>
                  <p className={`text-lg font-medium leading-relaxed mb-8 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {selectedProject.description || 'No description available.'}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  {[
                    { icon: BookOpen, label: 'Domain', value: selectedProject.domain },
                    { icon: Clock, label: 'Duration', value: selectedProject.duration },
                    { icon: Code, label: 'Level', value: selectedProject.level },
                    { icon: GraduationCap, label: 'Company', value: selectedProject.company }
                  ].map((info, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border transition-colors duration-500 ${
                      theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center gap-3 mb-1">
                        <info.icon size={18} className="text-blue-500" />
                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{info.label}</span>
                      </div>
                      <p className={`font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{info.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 mb-10">
                  {selectedProject.skills.map((skill, index) => (
                    <span
                      key={index}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all duration-500 ${
                        theme === 'dark' 
                          ? 'bg-blue-900/30 text-blue-400 border-blue-900/50' 
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setModalProject(selectedProject!)}
                  className={`w-full py-5 rounded-2xl font-black text-lg transition-all duration-500 shadow-xl active:scale-95 ${
                    theme === 'dark' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
                  }`}
                >
                  Enroll in Project
                </button>
              </div>
            </div>
            {modalProject && (
              <EnrollmentModal isOpen={true} onClose={() => setModalProject(null)} project={modalProject} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 py-12 px-6 ${
      theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className={`text-6xl font-black mb-6 tracking-tight transition-colors duration-500 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>Startup Projects</h1>
          <p className={`text-xl max-w-2xl mx-auto font-medium transition-colors duration-500 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>Gain real-world experience through industry projects and earn certifications</p>
        </div>

        {/* Search and Filter Section */}
        <div className={`rounded-[2.5rem] shadow-xl p-10 mb-16 border transition-all duration-500 ${
          theme === 'dark' ? 'bg-slate-900/50 border-slate-800 shadow-blue-500/10' : 'bg-white border-slate-100 shadow-blue-500/5'
        }`}>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
              <input
                type="text"
                placeholder="Search by project, company, or skills..."
                className={`w-full pl-14 pr-6 py-4 border rounded-2xl outline-none transition-all duration-500 text-lg font-bold ${
                  theme === 'dark' 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-slate-900' 
                    : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white'
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                { value: selectedDomain, setter: setSelectedDomain, options: domains, label: 'All Domains' },
                { value: selectedDuration, setter: setSelectedDuration, options: durations, label: 'All Durations' },
                { value: selectedLevel, setter: setSelectedLevel, options: levels, label: 'All Levels' },
                { value: selectedSkills, setter: setSelectedSkills, options: skillsList, label: 'All Skills' }
              ].map((filter, idx) => (
                <div key={idx} className="relative">
                  <select
                    value={filter.value}
                    onChange={(e) => filter.setter(e.target.value)}
                    className={`appearance-none px-8 py-4 pr-12 border rounded-2xl font-bold outline-none transition-all duration-500 cursor-pointer ${
                      theme === 'dark' 
                        ? 'bg-slate-950 border-slate-800 text-slate-300 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500' 
                        : 'bg-slate-50 border-slate-100 text-slate-600 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500'
                    }`}
                  >
                    <option value="">{filter.label}</option>
                    {filter.options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {projects.filter(project => {
            const searchMatch = searchTerm === '' ||
              project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              project.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
              project.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
            const domainMatch = selectedDomain === '' || project.domain === selectedDomain;
            const durationMatch = selectedDuration === '' || project.duration === selectedDuration;
            const levelMatch = selectedLevel === '' || project.level === selectedLevel;
            const skillMatch = selectedSkills === '' || project.skills.includes(selectedSkills);
            return searchMatch && domainMatch && durationMatch && levelMatch && skillMatch;
          }).map((project) => (
            <div key={project.id} className={`rounded-[3rem] shadow-xl overflow-hidden border group hover:shadow-2xl transition-all duration-500 ${
              theme === 'dark' ? 'bg-slate-900/50 border-slate-800 hover:shadow-blue-500/10' : 'bg-white border-slate-100 hover:shadow-blue-500/5'
            }`}>
              <div className="relative">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className={`absolute top-4 right-4 px-4 py-2 rounded-full shadow-lg border backdrop-blur-md transition-all duration-500 ${
                  theme === 'dark' ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-100'
                }`}>
                  <div className="flex items-center gap-2">
                    <Star className="text-yellow-400" size={16} fill="currentColor" />
                    <span className={`font-black text-xs transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{project.matchScore}% MATCH</span>
                  </div>
                </div>
              </div>
              <div className="p-10">
                <div className="mb-6">
                  <h3 className={`text-2xl font-black mb-3 group-hover:text-blue-500 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{project.title}</h3>
                  <div className={`flex items-center gap-2 text-sm font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    <MapPin size={16} />
                    <span>{project.location}</span>
                  </div>
                </div>
                
                <p className={`text-sm font-medium leading-relaxed mb-8 line-clamp-2 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {project.description || 'No description available.'}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    { icon: BookOpen, label: project.domain },
                    { icon: Clock, label: project.duration },
                    { icon: GraduationCap, label: project.level },
                    { icon: Code, label: project.offeredBy }
                  ].map((info, idx) => (
                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors duration-500 ${
                      theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <info.icon size={16} className="text-blue-500" />
                      <span className={`text-[10px] font-black uppercase tracking-widest truncate transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{info.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {project.skills.map((skill, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all duration-500 ${
                        theme === 'dark' 
                          ? 'bg-blue-900/30 text-blue-400 border-blue-900/50' 
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className={`flex items-center gap-4 pt-8 border-t transition-colors duration-500 ${
                  theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
                }`}>
                  <button
                    onClick={() => setModalProject(project)}
                    className="flex-1 py-4 rounded-2xl font-black text-sm transition-all duration-500 shadow-xl active:scale-95 bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 focus:ring-4 focus:ring-blue-500/50 outline-none"
                  >
                    Enroll Now
                  </button>
                  {project.certificate && (
                    <div className={`p-4 rounded-2xl border transition-colors duration-500 ${
                      theme === 'dark' ? 'bg-amber-900/20 border-amber-900/30 text-amber-500' : 'bg-amber-50 border-amber-100 text-amber-600'
                    }`} title="Certification Available">
                      <Star size={20} fill="currentColor" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {modalProject && (
        <EnrollmentModal isOpen={true} onClose={() => setModalProject(null)} project={modalProject} />
      )}
    </div>
  );
}
export default StartupProj;