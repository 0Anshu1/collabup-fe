import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Code, Star, MapPin, MessageCircle } from 'lucide-react';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { sendCollabEmail } from '../utils/sendCollabEmail';
import { useTheme } from '../context/ThemeContext';

interface BuddyProfile {
  id: number;
  name: string;
  avatar: string;
  domain: string;
  level: string;
  skills: string[];
  location: string;
  matchScore: number;
  hackathons?: string[];
  email: string;
}

const indianHackathons = [
  "Smart India Hackathon",
  "HackVerse",
  "HackBout",
  "InOut Hackathon",
  "HackCBS",
  "HackRush",
  "CodeUtsava",
  "HackIndia",
  "DevsHouse",
];



const BuddyFinder: React.FC = () => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedHackathon, setSelectedHackathon] = useState('all');
  const [userData, setUserData] = useState<{ fullName: string; email: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Fetch logged-in user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              fullName: data.fullName || 'User',
              email: data.email || user.email || 'unknown@example.com',
            });
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      }
    };
    fetchUserData();
  }, []);

  // TODO: Replace with real data fetching logic from backend
  const [filteredProfiles] = useState<BuddyProfile[]>([
    {
      id: 1,
      name: "Arjun Mehta",
      avatar: "https://i.pravatar.cc/150?u=arjun",
      domain: "Web Development",
      level: "Intermediate",
      skills: ["React", "Node.js", "Tailwind"],
      location: "Mumbai, India",
      matchScore: 95,
      hackathons: ["Smart India Hackathon"],
      email: "arjun@example.com"
    },
    {
      id: 2,
      name: "Priya Sharma",
      avatar: "https://i.pravatar.cc/150?u=priya",
      domain: "UX Design",
      level: "Advanced",
      skills: ["Figma", "Adobe XD", "User Research"],
      location: "Bangalore, India",
      matchScore: 88,
      hackathons: ["HackVerse"],
      email: "priya@example.com"
    },
    {
      id: 3,
      name: "Rohan Gupta",
      avatar: "https://i.pravatar.cc/150?u=rohan",
      domain: "Artificial Intelligence",
      level: "Beginner",
      skills: ["Python", "TensorFlow", "Scikit-learn"],
      location: "Delhi, India",
      matchScore: 82,
      hackathons: ["HackCBS"],
      email: "rohan@example.com"
    }
  ]);

  // Only the handleConnect method is changed, rest is same
const handleConnect = async (buddy: BuddyProfile) => {
  if (!userData || !userData.email || userData.email.trim() === '') {
    setModalMessage('Please sign in to connect with a buddy.');
    setShowModal(true);
    return;
  }


  // No buddyEmailMap fallback, just use buddy.email
  const buddyEmail = buddy.email && buddy.email.trim() ? buddy.email : '';


  // Validate emails
  if (!buddyEmail || buddyEmail.trim() === '') {
    setModalMessage('Could not find a valid email for the selected buddy.');
    setShowModal(true);
    return;
  }

  if (!userData.email || userData.email.trim() === '') {
    setModalMessage('Your email is missing. Please update your profile.');
    setShowModal(true);
    return;
  }

  try {
    await sendCollabEmail({
      to: userData.email,
      subject: `Buddy Connection Request: ${buddy.name}`,
      text: `You have requested to connect with ${buddy.name} (${buddyEmail}).`,
      html: `<p>You have requested to connect with <b>${buddy.name}</b> (${buddyEmail}).</p>`,
    });

    await sendCollabEmail({
      to: buddyEmail,
      subject: `Buddy Connection Request from ${userData.fullName}`,
      text: `${userData.fullName} (${userData.email}) wants to connect with you via CollabUp Buddy Finder!`,
      html: `<p><b>${userData.fullName}</b> (${userData.email}) wants to connect with you via CollabUp Buddy Finder!</p>`,
    });

    setModalMessage('Connection emails sent successfully! You can reach out to the buddy with the credentials shared via mail.');
    setShowModal(true);
  } catch (err: any) {
    console.error('Email sending error:', err);
    setModalMessage(`Failed to send connection emails: ${err.message}. Please try again or contact support.`);
    setShowModal(true);
  }
};


  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
  };

  return (
    <div className={`min-h-screen py-20 px-6 transition-colors duration-500 ${
      theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-6 transition-all duration-500">
            <div className={`rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border transform animate-scale-in transition-all duration-500 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-blue-500/10' : 'bg-white border-slate-100 shadow-blue-500/5'
            }`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-500 ${
                theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50'
              }`}>
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className={`text-2xl font-black mb-4 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Notification</h3>
              <p className={`text-lg mb-8 leading-relaxed transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{modalMessage}</p>
              <button
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all duration-500 shadow-xl shadow-blue-600/20 active:scale-95"
                onClick={closeModal}
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-20">
          <h1 className={`text-6xl font-black mb-6 tracking-tight transition-colors duration-500 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>Buddy Finder</h1>
          <p className={`text-xl max-w-2xl mx-auto font-medium transition-colors duration-500 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Find the perfect study partner based on your interests and skill level
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className={`rounded-[2.5rem] shadow-xl p-10 mb-16 border transition-all duration-500 ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-blue-500/10' : 'bg-white border-slate-100 shadow-blue-500/5'
        }`}>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
              <input
                type="text"
                placeholder="Search by name, skills, or location..."
                className={`w-full pl-14 pr-6 py-4 rounded-2xl outline-none transition-all duration-500 text-lg border ${
                  theme === 'dark' 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900' 
                    : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white'
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <select
                className={`px-6 py-4 rounded-2xl font-bold outline-none transition-all duration-500 cursor-pointer border ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                    : 'bg-slate-50 border-slate-100 text-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                }`}
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
              >
                <option value="all">All Domains</option>
                <option value="web development">Web Development</option>
                <option value="ux design">UX Design</option>
                <option value="artificial intelligence">AI / ML</option>
                <option value="blockchain">Blockchain</option>
                <option value="cyber security">Cyber Security</option>
              </select>
              
              <select
                className={`px-6 py-4 rounded-2xl font-bold outline-none transition-all duration-500 cursor-pointer border ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                    : 'bg-slate-50 border-slate-100 text-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                }`}
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              <select
                className={`px-6 py-4 rounded-2xl font-bold outline-none transition-all duration-500 cursor-pointer border ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                    : 'bg-slate-50 border-slate-100 text-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                }`}
                value={selectedHackathon}
                onChange={(e) => setSelectedHackathon(e.target.value)}
              >
                <option value="all">All Hackathons</option>
                {indianHackathons.map((hackathon) => (
                  <option key={hackathon} value={hackathon}>{hackathon}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Buddy Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredProfiles.map((profile) => (
            <div key={profile.id} className={`group rounded-[3rem] shadow-xl overflow-hidden border transition-all duration-500 ${
              theme === 'dark' 
                ? 'bg-slate-900 border-slate-800 shadow-blue-500/10 hover:shadow-blue-500/20' 
                : 'bg-white border-slate-100 shadow-blue-500/5 hover:shadow-blue-500/10'
            }`}>
              <div className="relative h-32 bg-gradient-to-r from-blue-600 to-blue-400">
                <div className="absolute -bottom-12 left-8">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className={`w-24 h-24 rounded-[2rem] object-cover border-4 shadow-xl group-hover:scale-105 transition-transform duration-500 ${
                      theme === 'dark' ? 'border-slate-900' : 'border-white'
                    }`}
                  />
                </div>
                <div className="absolute top-4 right-6 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 transition-all duration-500">
                  <div className="flex items-center gap-2">
                    <Star className="text-yellow-400 w-4 h-4 fill-current" />
                    <span className="font-bold text-white text-sm">{profile.matchScore}% Match</span>
                  </div>
                </div>
              </div>

              <div className="p-10 pt-16">
                <div className="mb-8">
                  <h3 className={`text-2xl font-black mb-2 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{profile.name}</h3>
                  <div className={`flex items-center gap-2 font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="text-sm uppercase tracking-wider">{profile.location}</span>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500 ${
                      theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Domain</p>
                      <p className={`font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{profile.domain}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500 ${
                      theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <Code className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skill Level</p>
                      <p className={`font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{profile.level}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-500 ${
                      theme === 'dark'
                        ? 'bg-slate-950 text-slate-400 border-slate-800 group-hover:bg-blue-900/30 group-hover:text-blue-400'
                        : 'bg-slate-50 text-slate-600 border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600'
                    }`}>
                      {skill}
                    </span>
                  ))}
                </div>

                {profile.hackathons && profile.hackathons.length > 0 && (
                  <div className={`mb-10 p-4 rounded-2xl border transition-colors duration-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Hackathons</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.hackathons.map((hackathon, index) => (
                        <span key={index} className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm border transition-all duration-500 ${
                          theme === 'dark'
                            ? 'bg-blue-900/30 text-blue-400 border-blue-900/50'
                            : 'bg-white text-blue-600 border-blue-100'
                        }`}>
                          {hackathon}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-blue-600/20 active:scale-95"
                  onClick={() => handleConnect(profile)}
                >
                  <MessageCircle className="w-6 h-6" />
                  Connect Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuddyFinder;