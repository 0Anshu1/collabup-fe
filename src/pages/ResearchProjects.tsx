import React, { useState, useEffect, FormEvent } from 'react';
import { Users, Calendar, Trophy, X, Search, ChevronDown } from 'lucide-react';
import { auth, db } from '../firebase/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, addDoc } from 'firebase/firestore';
// UserData interface for user state
interface UserData {
  instituteName: string;
  role: string | null;
  fullName: string;
  email: string;
  researchAreas: string[];
}
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { sendCollabEmail } from '../utils/sendCollabEmail';
import { getUserRole } from '../utils/getUserRole';
import { getResearchProjects, getFaculties } from '../firebase/firebaseService';
// Define the faculty interface locally since it's not exported from firebaseService
interface faculty {
  id: string;
  fullName: string;
  email: string;
  instituteName: string;
  researchAreas: string[];
  spotsAvailable: number;
  startDate: string;
}

interface ResearchProject {
  id: string;
  title: string;
  domain: string;
  description: string;
  facultyId: string;
  skills: string[];
  location: string;
  duration: string;
  level: string;
  certificate: boolean;
}

interface ApplicationFormData {
  projectTitle: string;
  proposal: string;
  currentSemester: string;
  currentCGPA: string;
  resume: File | null;
}

const ResearchProject = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstitute, setSelectedInstitute] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [facultyList, setFacultyList] = useState<faculty[]>([]);
  const [researchProjects, setResearchProjects] = useState<ResearchProject[]>([]);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<faculty | null>(null);
  const [formData, setFormData] = useState<ApplicationFormData>({ projectTitle: '', proposal: '', currentSemester: '', currentCGPA: '', resume: null });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  const institutes = [
    'IIT Delhi', 'IIT Chennai', 'IIT Bombay', 'IIT Kanpur', 'IIT Madras', 
    'IIT Kharagpur', 'IIT Roorkee', 'IIT Guwahati', 'IIT Hyderabad', 'IIT Gandhinagar'
  ];

  const domains = [
    'Quantum Computing', 'Artificial Intelligence', 'Computer Vision', 'Data Science',
    'Blockchain', 'Cybersecurity', 'IoT', 'Robotics', 'Natural Language Processing', 'Biomedical Engineering'
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const role = await getUserRole();
          if (!role) {
            setError('User role not found. Please sign in again.');
            setIsLoading(false);
            return;
          }
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              instituteName: data.instituteName || '',
              role: role || data.role || null, // Use null instead of empty string
              fullName: data.fullName || 'User',
              email: data.email || user.email || '',
              researchAreas: data.researchAreas || [],
            });
            if (!['student', 'faculty'].includes(role)) {
              setError('Only students and faculty can access research projects.');
              setIsLoading(false);
              return;
            }
          } else {
            setError('User data not found. Please complete your profile.');
            setIsLoading(false);
            return;
          }
        } catch (err) {
          setError('Failed to fetch user data.');
          setIsLoading(false);
          console.error('Error fetching user data:', err);
        }
      } else {
  setFacultyList([]);
        // Filter by ID if present in query string
        const params = new URLSearchParams(location.search);
        const id = params.get('id');
        if (id) {
          setResearchProjects([]);
        } else {
          setResearchProjects([]);
        }
        setSelectedInstitute(''); // Show all institutes by default
        setIsLoading(false);
      }
    });

    const fetchData = async () => {
      if (!currentUser || !userData || !userData.role) {
        return;
      }
      try {
        // Fetch research projects
        const projects = await getResearchProjects(userData.role, userData);
  setResearchProjects(projects);

        // Fetch faculties
        const faculties = await getFaculties();
        setFacultyList(
          faculties.map((f: any) => ({
            id: f.id,
            fullName: f.fullName,
            email: f.email,
            instituteName: f.instituteName,
            researchAreas: f.researchAreas || f.researchInterests || [],
            spotsAvailable: f.spotsAvailable ?? 0,
            startDate: f.startDate ?? '',
          }))
        );
      } catch (err) {
        setError('Failed to load data.');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser && userData) {
      fetchData();
      setSelectedInstitute(''); // Show all institutes by default for logged-in users too
    }

    return () => unsubscribeAuth();
  }, [currentUser, userData, location.search]);

  // Fallback: treat missing role as 'student' for demo/testing
  const effectiveRole = userData?.role || (currentUser ? 'student' : null);

  // DEBUG LOGGING
  React.useEffect(() => {
    console.log('DEBUG userData:', userData);
    console.log('DEBUG effectiveRole:', effectiveRole);
    console.log('DEBUG facultyList:', facultyList);
    console.log('DEBUG researchProjects:', researchProjects);
    console.log('DEBUG currentUser:', currentUser);
  }, [userData, effectiveRole, facultyList, researchProjects, currentUser]);

  const handleApply = (faculty: faculty) => {
    if (!currentUser || !userData) {
      setIsSignInModalOpen(true);
      return;
    }
    // Use effectiveRole for fallback
    if (effectiveRole !== 'student') {
      setError('Only students can apply for research projects.');
      return;
    }
    setSelectedFaculty(faculty);
    setIsApplicationModalOpen(true);
  };

  const handleSubmitApplication = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userData || !selectedFaculty) {
      setError('You must be signed in to apply.');
      return;
    }
    if (!formData.projectTitle.trim() || !formData.proposal.trim() || !formData.currentSemester.trim() || !formData.currentCGPA.trim()) {
      setError('Please fill out all required fields.');
      return;
    }

    try {
      await addDoc(collection(db, 'applications'), {
        studentId: currentUser.uid,
        studentName: userData.fullName,
        studentEmail: userData.email,
        studentInstitute: userData.instituteName,
        facultyId: selectedFaculty.id,
        facultyName: selectedFaculty.fullName,
        facultyEmail: selectedFaculty.email,
        projectTitle: formData.projectTitle,
        proposal: formData.proposal,
        currentSemester: formData.currentSemester,
        currentCGPA: formData.currentCGPA,
        resumeUploaded: formData.resume ? true : false,
        timestamp: new Date().toISOString(),
      });

      // Email to faculty with all student details and correct subject
      try {
        await sendCollabEmail({
          to: selectedFaculty.email,
          subject: 'Request for collaboration in your research project',
          text: `A student has requested to collaborate on your research project.\n\nProject Title: ${formData.projectTitle}\nStudent Name: ${userData.fullName}\nStudent Email: ${userData.email}\nStudent Institute: ${userData.instituteName}\nCurrent Semester: ${formData.currentSemester}\nCurrent CGPA: ${formData.currentCGPA}\nProposal: ${formData.proposal}`,
          html: `<p>A student has requested to collaborate on your research project.</p>
          <ul>
            <li><b>Project Title:</b> ${formData.projectTitle}</li>
            <li><b>Student Name:</b> ${userData.fullName}</li>
            <li><b>Student Email:</b> ${userData.email}</li>
            <li><b>Student Institute:</b> ${userData.instituteName}</li>
            <li><b>Current Semester:</b> ${formData.currentSemester}</li>
            <li><b>Current CGPA:</b> ${formData.currentCGPA}</li>
            <li><b>Proposal:</b> ${formData.proposal}</li>
          </ul>`
        });
        alert('Collaboration request email sent successfully!');
      } catch (err) {
        alert('Failed to send collaboration request email. Please try again or contact support.');
      }
      setIsApplicationModalOpen(false);
      setFormData({ projectTitle: '', proposal: '', currentSemester: '', currentCGPA: '', resume: null });
      setError(null);
      setIsSuccessModalOpen(true);
    } catch (err) {
      setError('Failed to submit application or send email.');
      console.error('Error submitting application:', err);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, resume: e.target.files[0] });
    }
  };

  const params = new URLSearchParams(location.search);
  const selectedId = params.get('id');

  const selectedProject = selectedId
    ? researchProjects.find(p => String(p.id) === selectedId)
    : null;

  const filteredProjects = !selectedId
    ? researchProjects.filter(project => {
        const faculty = facultyList.find(f => f.id === project.facultyId);
        const searchMatch = searchTerm === '' ||
          project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
          faculty?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
        const instituteMatch = selectedInstitute === '' || faculty?.instituteName === selectedInstitute;
        const domainMatch = selectedDomain === '' || project.domain === selectedDomain;
        const levelMatch = selectedLevel === '' || project.level === selectedLevel;
        return searchMatch && instituteMatch && domainMatch && levelMatch;
      })
    : [];

  return (
    <div className={`min-h-screen transition-colors duration-500 py-12 px-6 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className={`text-6xl font-black mb-6 tracking-tight transition-colors duration-500 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>Research Projects</h1>
          <p className={`text-xl max-w-2xl mx-auto font-medium transition-colors duration-500 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>Discover research opportunities and connect with faculty members</p>
        </div>

        {error && (
          <div className={`mb-8 p-6 rounded-3xl border flex items-center gap-4 animate-fade-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-rose-900/20 text-rose-400 border-rose-900/50' : 'bg-rose-50 text-rose-600 border-rose-100'
          }`}>
            <div className="w-2 h-2 bg-rose-600 rounded-full animate-pulse" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className={`font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Loading opportunities...</p>
          </div>
        ) : (
          <>
            {/* Search and Filter Section */}
            <div className={`rounded-[2.5rem] shadow-xl p-10 mb-16 border transition-all duration-500 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-blue-500/10' : 'bg-white border-slate-100 shadow-blue-500/5'
            }`}>
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
                  <input
                    type="text"
                    placeholder="Search by project title, description, skills, or faculty name..."
                    className={`w-full pl-14 pr-6 py-4 border rounded-2xl outline-none transition-all duration-500 text-lg font-bold ${
                      theme === 'dark' 
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900' 
                        : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white'
                    }`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="relative">
                    <select
                      className={`appearance-none px-8 py-4 pr-12 border rounded-2xl font-bold outline-none transition-all duration-500 cursor-pointer ${
                        theme === 'dark' 
                          ? 'bg-slate-950 border-slate-800 text-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500' 
                          : 'bg-slate-50 border-slate-100 text-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                      }`}
                      value={selectedInstitute}
                      onChange={(e) => setSelectedInstitute(e.target.value)}
                    >
                      <option value="">All Institutes</option>
                      {institutes.map((institute) => (
                        <option key={institute} value={institute}>{institute}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                  </div>
                  <div className="relative">
                    <select
                      className={`appearance-none px-8 py-4 pr-12 border rounded-2xl font-bold outline-none transition-all duration-500 cursor-pointer ${
                        theme === 'dark' 
                          ? 'bg-slate-950 border-slate-800 text-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500' 
                          : 'bg-slate-50 border-slate-100 text-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                      }`}
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                    >
                      <option value="">All Domains</option>
                      {domains.map((domain) => (
                        <option key={domain} value={domain}>{domain}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
              {[
                { icon: Users, label: 'Faculty Members', value: facultyList.length, color: theme === 'dark' ? 'text-blue-400' : 'text-blue-600', bg: theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50' },
                { icon: Calendar, label: 'Opportunities', value: researchProjects.length, color: theme === 'dark' ? 'text-purple-400' : 'text-purple-600', bg: theme === 'dark' ? 'bg-purple-900/20' : 'bg-purple-50' },
                { icon: Trophy, label: 'Published Papers', value: researchProjects.length * 2 + '+', color: theme === 'dark' ? 'text-amber-400' : 'text-amber-600', bg: theme === 'dark' ? 'bg-amber-900/20' : 'bg-amber-50' },
                { icon: Trophy, label: 'Partner Institutes', value: institutes.length, color: theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600', bg: theme === 'dark' ? 'bg-emerald-900/20' : 'bg-emerald-50' }
              ].map((stat, i) => (
                <div key={i} className={`p-8 rounded-[2rem] shadow-sm border group hover:shadow-xl transition-all duration-500 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800 hover:shadow-blue-500/10' : 'bg-white border-slate-100 hover:shadow-blue-500/5'
                }`}>
                  <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center ${stat.color} mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <stat.icon className="w-7 h-7" />
                  </div>
                  <h3 className={`text-3xl font-black mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stat.value}</h3>
                  <p className={`font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</p>
                </div>
              ))}
            </div>

            <div className={`p-12 rounded-[3rem] shadow-xl border transition-all duration-500 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-blue-500/10' : 'bg-white border-slate-100 shadow-blue-500/5'
            }`}>
              <h2 className={`text-3xl font-black mb-10 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Current Opportunities</h2>
              
              {filteredProjects.length === 0 && !selectedProject && (
                <div className={`text-center py-20 rounded-[2rem] border-2 border-dashed transition-all duration-500 ${
                  theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <p className={`font-bold text-xl transition-colors duration-500 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>No research projects found matching your criteria.</p>
                </div>
              )}

              <div className="space-y-8">
                {selectedProject ? (
                  (() => {
                    const faculty = facultyList.find(f => f.id === selectedProject.facultyId);
                    return (
                      <div key={selectedProject.id} className={`rounded-[2.5rem] p-10 border relative overflow-hidden group transition-all duration-500 ${
                        theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
                      }`}>
                        <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 bg-blue-600/5 rounded-full blur-3xl" />
                        
                        <div className="flex flex-col lg:flex-row justify-between gap-12 relative z-10">
                          <div className="flex-1">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest mb-6 ${
                              theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {selectedProject.domain}
                            </div>
                            <h3 className={`text-3xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedProject.title}</h3>
                            <p className={`text-lg mb-8 leading-relaxed max-w-3xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{selectedProject.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border transition-colors duration-300 ${
                                    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                                  }`}>
                                    <Users className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faculty</p>
                                    <p className={`font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{faculty?.fullName || 'Unknown'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border transition-colors duration-300 ${
                                    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                                  }`}>
                                    <Trophy className="w-5 h-5 text-amber-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Institute</p>
                                    <p className={`font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{faculty?.instituteName || 'Unknown'}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border transition-colors duration-300 ${
                                    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                                  }`}>
                                    <Calendar className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                                    <p className={`font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{selectedProject.duration}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border transition-colors duration-300 ${
                                    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                                  }`}>
                                    <Trophy className="w-5 h-5 text-rose-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Level</p>
                                    <p className={`font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{selectedProject.level}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className={`flex items-center gap-6 p-6 rounded-3xl border w-fit transition-colors duration-300 ${
                              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                            }`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                                  theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
                                }`}>
                                  <Users className="w-4 h-4" />
                                </div>
                                <span className={`font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                  {faculty?.spotsAvailable || 0} Spots Available
                                </span>
                              </div>
                              {faculty?.spotsAvailable === 0 && (
                                <span className="px-4 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-bold uppercase tracking-wider">Full</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col justify-end gap-4">
                            {effectiveRole === 'student' && faculty && faculty.spotsAvailable > 0 ? (
                              <button
                                onClick={() => handleApply(faculty)}
                                className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                              >
                                Apply Now
                              </button>
                            ) : currentUser && effectiveRole !== 'student' && (
                              <div className={`px-6 py-4 rounded-2xl border font-bold text-center transition-all duration-300 ${
                                theme === 'dark' ? 'bg-rose-900/20 text-rose-400 border-rose-900/50' : 'bg-rose-50 text-rose-600 border-rose-100'
                              }`}>
                                Only students can apply
                              </div>
                            )}
                            <button
                              onClick={() => navigate('/research-projects')}
                              className={`px-10 py-5 rounded-[2rem] font-bold text-lg transition-all text-center active:scale-95 ${
                                theme === 'dark' ? 'text-slate-400 hover:bg-slate-900' : 'text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              Back to Projects
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  filteredProjects.map((project) => {
                    const faculty = facultyList.find(f => f.id === project.facultyId);
                    return (
                      <div key={project.id} className={`rounded-[2.5rem] p-8 border transition-all duration-500 group ${
                        theme === 'dark' 
                          ? 'bg-slate-950 border-slate-800 hover:bg-slate-900 hover:shadow-blue-500/10' 
                          : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5'
                      }`}>
                        <div className="flex flex-col lg:flex-row justify-between gap-8">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${
                                theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                              }`}>
                                {project.domain}
                              </span>
                              <span className="text-slate-400 font-bold text-sm">•</span>
                              <span className={`font-bold text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{project.level}</span>
                            </div>
                            <h3 className={`text-2xl font-black mb-4 group-hover:text-blue-600 transition-colors duration-300 ${
                              theme === 'dark' ? 'text-white' : 'text-slate-900'
                            }`}>{project.title}</h3>
                            <p className={`font-medium mb-6 line-clamp-2 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{project.description}</p>
                            
                            <div className="flex flex-wrap items-center gap-6">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                <span className={`text-sm font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{faculty?.fullName || 'Unknown'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-slate-400" />
                                <span className={`text-sm font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{faculty?.instituteName || 'Unknown'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className={`text-sm font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{project.duration}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col justify-center min-w-[200px]">
                            <button
                              onClick={() => navigate(`/research-projects?id=${project.id}`)}
                              className={`border-2 px-8 py-4 rounded-2xl font-black transition-all text-center shadow-lg active:scale-95 ${
                                theme === 'dark'
                                  ? 'bg-slate-900 border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white shadow-blue-500/10'
                                  : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white shadow-blue-600/5'
                              }`}
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {isSignInModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`rounded-[2.5rem] p-12 max-w-md w-full shadow-2xl text-center border animate-scale-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 transition-colors duration-500 ${
              theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
            }`}>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className={`text-3xl font-black mb-4 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Sign In Required</h3>
            <p className={`font-medium mb-10 leading-relaxed transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Please sign in to access research projects and collaborate with faculty members.
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  setIsSignInModalOpen(false);
                  navigate('/login');
                }}
                className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 ${
                  theme === 'dark' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20' 
                    : 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-900/10'
                }`}
              >
                Sign In Now
              </button>
              <button
                onClick={() => setIsSignInModalOpen(false)}
                className={`w-full py-5 rounded-2xl font-bold text-lg transition-all active:scale-95 ${
                  theme === 'dark' ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {isApplicationModalOpen && selectedFaculty && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl border overflow-y-auto max-h-[90vh] animate-scale-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className={`text-3xl font-black transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Research Application</h2>
                <p className={`font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Applying to: {selectedFaculty.fullName}</p>
              </div>
              <button onClick={() => setIsApplicationModalOpen(false)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                theme === 'dark' ? 'bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-rose-900/20' : 'bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50'
              }`}>
                <X size={24} />
              </button>
            </div>
            
            {error && (
              <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 animate-fade-in transition-all duration-500 ${
                theme === 'dark' ? 'bg-rose-900/20 text-rose-400 border-rose-900/50' : 'bg-rose-50 text-rose-600 border-rose-100'
              }`}>
                <div className="w-2 h-2 bg-rose-600 rounded-full animate-pulse" />
                <p className="font-bold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmitApplication} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ml-1 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>Project Title</label>
                  <input
                    type="text"
                    name="projectTitle"
                    value={formData.projectTitle}
                    onChange={handleFormChange}
                    className={`w-full px-6 py-4 border rounded-2xl outline-none transition-all font-bold ${
                      theme === 'dark' 
                        ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                    }`}
                    placeholder="Enter project title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ml-1 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>Current Semester</label>
                  <input
                    type="text"
                    name="currentSemester"
                    value={formData.currentSemester}
                    onChange={handleFormChange}
                    className={`w-full px-6 py-4 border rounded-2xl outline-none transition-all font-bold ${
                      theme === 'dark' 
                        ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                    }`}
                    placeholder="e.g. 5th Semester"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ml-1 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>Current CGPA</label>
                <input
                  type="text"
                  name="currentCGPA"
                  value={formData.currentCGPA}
                  onChange={handleFormChange}
                  className={`w-full px-6 py-4 border rounded-2xl outline-none transition-all font-bold ${
                    theme === 'dark' 
                      ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                  }`}
                  placeholder="e.g. 9.2"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ml-1 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>Research Proposal</label>
                <textarea
                  name="proposal"
                  value={formData.proposal}
                  onChange={handleFormChange}
                  className={`w-full px-6 py-4 border rounded-2xl outline-none transition-all font-bold h-40 resize-none ${
                    theme === 'dark' 
                      ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                  }`}
                  placeholder="Briefly describe your interest and relevant experience..."
                  required
                />
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ml-1 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>Resume / CV (Optional)</label>
                <div className="relative group">
                  <input
                    type="file"
                    onChange={handleResumeChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full px-6 py-8 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all duration-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-900 border-slate-800 group-hover:border-blue-500 group-hover:bg-blue-900/20' 
                      : 'bg-slate-50 border-slate-200 group-hover:border-blue-500 group-hover:bg-blue-50'
                  }`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-colors duration-500 ${
                      theme === 'dark' ? 'bg-slate-800 text-slate-500 group-hover:text-blue-400' : 'bg-white text-slate-400 group-hover:text-blue-600'
                    }`}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </div>
                    <p className={`font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{formData.resume ? formData.resume.name : 'Click to upload resume'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className={`flex-1 py-5 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 ${
                    theme === 'dark' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20' 
                      : 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-900/10'
                  }`}
                >
                  Submit Application
                </button>
                <button
                  type="button"
                  onClick={() => setIsApplicationModalOpen(false)}
                  className={`px-8 rounded-2xl font-bold transition-all active:scale-95 ${
                    theme === 'dark' ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`rounded-[2.5rem] p-12 max-w-md w-full shadow-2xl text-center border animate-scale-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 animate-bounce transition-colors duration-500 ${
              theme === 'dark' ? 'bg-emerald-900/20' : 'bg-emerald-50'
            }`}>
              <Trophy size={48} className="text-emerald-500" />
            </div>
            <h3 className={`text-3xl font-black mb-4 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Application Sent! 🎉</h3>
            <p className={`font-medium mb-10 leading-relaxed transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Your research application has been shared with the faculty. Keep an eye on your email!
            </p>
            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 ${
                theme === 'dark' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20' 
                  : 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-900/10'
              }`}
            >
              Great, thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchProject;
