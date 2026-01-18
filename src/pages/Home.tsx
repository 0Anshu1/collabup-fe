import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Lightbulb, Rocket, FlaskConical, UserCircle, Star } from 'lucide-react';
import { auth, db } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { RecommendationService } from '../services/recommendationService';
import AuthModal from '../components/AuthModal';
import { useTheme } from '../context/ThemeContext';

interface FeatureCardProps {
  icon: any;
  title: string;
  description: string;
  cta: string;
  color: string;
  reverse?: boolean;
  onClick: () => void;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, cta, color, reverse, onClick, index }) => {
  const { theme } = useTheme();
  return (
    <div 
      className="sticky top-20 w-full mb-32 group will-change-transform feature-card-container"
      style={{ 
        top: `${100 + index * 40}px`,
        zIndex: index + 10 
      }}
    >
      <div className={`relative border p-8 md:p-12 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center gap-10 max-w-5xl mx-auto w-full min-h-[400px] overflow-hidden backdrop-blur-3xl transition-all duration-700 ease-in-out hover:border-blue-500/40 hover:shadow-blue-500/20 group-hover:scale-[1.01] ${
        theme === 'dark' ? 'bg-slate-900/80 border-slate-800/50' : 'bg-white/80 border-slate-200'
      }`}>
        {/* Dynamic Background Glow */}
        <div className={`absolute -right-16 -top-16 w-80 h-80 rounded-full blur-[120px] opacity-10 transition-all duration-1000 group-hover:opacity-40 group-hover:scale-110 ${color.replace('text-', 'bg-')}`} />
        <div className={`absolute -left-16 -bottom-16 w-80 h-80 rounded-full blur-[120px] opacity-5 transition-all duration-1000 group-hover:opacity-20 group-hover:scale-110 ${color.replace('text-', 'bg-')}`} />

        {/* Decorative Line */}
        <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

        <div className={`flex-shrink-0 w-full md:w-1/3 flex justify-center items-center z-10 ${reverse ? 'md:order-2' : ''}`}>
          <div className={`w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] flex items-center justify-center border shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-1000 relative overflow-hidden backdrop-blur-sm ${
            theme === 'dark' ? 'bg-slate-800/30 border-slate-700/30' : 'bg-slate-100/50 border-slate-200'
          }`}>
            <Icon className={`w-14 h-14 md:w-24 md:h-24 ${color} relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]`} />
            <div className={`absolute inset-0 opacity-10 ${color.replace('text-', 'bg-')} blur-3xl group-hover:opacity-40 transition-opacity duration-1000`} />
            
            {/* Animated rings */}
            <div className="absolute inset-0 border-2 border-white/5 rounded-[2.5rem] scale-90 group-hover:scale-125 group-hover:opacity-0 transition-all duration-1000" />
          </div>
        </div>

        <div className={`flex flex-col justify-center items-center md:items-start w-full md:w-2/3 z-10 ${reverse ? 'md:order-1' : ''}`}>
          <h3 className={`text-4xl md:text-5xl font-black mb-6 tracking-tighter text-center md:text-left leading-[1.1] transition-all duration-500 ${
            theme === 'dark' ? 'text-slate-100 group-hover:text-white' : 'text-slate-900 group-hover:text-blue-600'
          }`}>
            {title}
          </h3>
          <p className={`text-xl md:text-2xl mb-10 text-center md:text-left leading-relaxed max-w-xl font-medium transition-colors ${
            theme === 'dark' ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-600 group-hover:text-slate-700'
          }`}>
            {description}
          </p>
          <button 
            onClick={onClick} 
            className="group/btn relative overflow-hidden bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-2xl shadow-blue-600/40 hover:bg-blue-700 hover:shadow-blue-500/50 transition-all duration-500 text-xl flex items-center gap-4 active:scale-95"
          >
            <span className="relative z-10 uppercase tracking-wider">{cta}</span>
            <Rocket className="w-6 h-6 relative z-10 group-hover/btn:translate-x-2 group-hover/btn:-translate-y-2 transition-transform duration-500 ease-out" />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

const testimonials = [
  {
    name: 'Aarav S.',
    role: 'Student',
    text: 'CollabUp helped me find the perfect team for my hackathon project. The mentorship feature is a game changer!',
    avatar: <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">A</div>,
    stars: 5,
  },
  {
    name: 'Dr. Meera K.',
    role: 'Faculty',
    text: 'I found passionate students for my research project and managed everything in one place. Highly recommended!',
    avatar: <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xl">M</div>,
    stars: 5,
  },
  {
    name: 'Rohit P.',
    role: 'Startup Founder',
    text: 'We hired interns and mentors through CollabUp. The dashboard and notifications are super helpful.',
    avatar: <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xl">R</div>,
    stars: 4,
  },
];

const Home = () => {
  const { theme } = useTheme();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authType, setAuthType] = useState('signup');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role || null);
          setUserName(data.fullName || data.startupName || data.founderName || 'User');
        }
      } else {
        setUserRole(null);
        setUserName('');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser && userRole) {
      RecommendationService.getRecommendations(userRole, 3)
        .then((data) => setRecommendations(data));
    }
  }, [currentUser, userRole]);

  const roleQuickLinks = {
    student: [
      { label: 'My Dashboard', to: '/dashboard', color: 'bg-blue-600' },
      { label: 'Find Projects', to: '/student-projects', color: 'bg-blue-600' },
      { label: 'Mentorship', to: '/mentorship', color: 'bg-violet-600' },
    ],
    mentor: [
      { label: 'Mentor Dashboard', to: '/dashboard', color: 'bg-amber-600' },
      { label: 'View Bookings', to: '/mentorship', color: 'bg-blue-600' },
      { label: 'Student Projects', to: '/student-projects', color: 'bg-blue-600' },
    ],
    startup: [
      { label: 'Startup Dashboard', to: '/startup-dashboard', color: 'bg-emerald-600' },
      { label: 'Post Project', to: '/create-startup-project', color: 'bg-blue-600' },
      { label: 'Find Talent', to: '/talent-matches', color: 'bg-blue-600' },
    ],
    faculty: [
      { label: 'Faculty Dashboard', to: '/faculty-dashboard', color: 'bg-rose-600' },
      { label: 'Research Projects', to: '/research-projects', color: 'bg-blue-600' },
      { label: 'Create Research', to: '/create-research', color: 'bg-blue-600' },
    ],
  };

  const getStartedBtn = !currentUser ? (
    <button
      className="bg-blue-600 px-8 py-3.5 text-lg font-bold rounded-xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-105 transition-all duration-500 text-white focus:ring-4 focus:ring-blue-500/50 outline-none"
      onClick={() => { setAuthType('signup'); setIsAuthOpen(true); }}
    >
      Get Started Now
    </button>
  ) : (
    <button
      className="bg-blue-600 px-8 py-3.5 text-lg font-bold rounded-xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-105 transition-all duration-500 text-white focus:ring-4 focus:ring-blue-500/50 outline-none"
      onClick={() => navigate('/dashboard')}
    >
      Go to My Dashboard
    </button>
  );

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
    }`}>
      {/* Hero Section */}
      <section className="relative pt-32 pb-40 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900 rounded-full blur-[120px] opacity-20" />
          <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${
            theme === 'dark' ? 'bg-blue-900' : 'bg-blue-400'
          }`} />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm mb-8 animate-fade-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-blue-900/30 border border-blue-800 text-blue-400' : 'bg-blue-50 border border-blue-100 text-blue-600'
          }`}>
            <Star className="w-4 h-4 fill-current" />
            <span>Connecting India's Brightest Minds</span>
          </div>
          
          <h1 className={`text-5xl md:text-6xl font-extrabold mb-6 tracking-tight leading-[1.15] transition-all duration-500 ${
            theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
          }`}>
            Build the Future of <br />
            <span className="text-blue-600">Collaboration</span>
          </h1>
          
          <p className={`text-xl mb-10 max-w-2xl mx-auto leading-relaxed font-medium transition-all duration-500 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            The unified platform for Students, Mentors, Startups, and Faculty to innovate, research, and grow together.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            {getStartedBtn}
            <button className={`px-8 py-3.5 text-lg font-bold rounded-xl border-2 transition-all duration-500 active:scale-95 focus:ring-4 focus:ring-blue-500/50 outline-none ${
              theme === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center mb-24">
          <h2 className={`text-4xl md:text-5xl font-extrabold mb-6 tracking-tight transition-all duration-500 ${
            theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
          }`}>
            Explore Our <span className="text-blue-500">Ecosystem</span>
          </h2>
          <p className={`text-lg md:text-xl max-w-xl mx-auto leading-relaxed transition-all duration-500 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Tailored experiences for every member of the innovation community.
          </p>
        </div>

        <div className="max-w-7xl mx-auto relative [perspective:2000px]">
          <FeatureCard
            index={0}
            icon={Users}
            title="Student Hub"
            description="Find project partners, build your professional portfolio, and connect with peer mentors across colleges."
            cta="Find Your Team"
            color="text-blue-500"
            onClick={() => navigate('/student-projects')}
          />

          <FeatureCard
            index={1}
            icon={Rocket}
            title="Startup Zone"
            description="Post projects, find specialized talent, and get mentorship to scale your innovation from idea to product."
            cta="Launch Project"
            color="text-emerald-500"
            reverse
            onClick={() => navigate('/startup-dashboard')}
          />

          <FeatureCard
            index={2}
            icon={Lightbulb}
            title="Mentor Space"
            description="Share your expertise, guide the next generation of builders, and build your personal brand as a thought leader."
            cta="Become a Mentor"
            color="text-amber-500"
            onClick={() => navigate('/mentorship')}
          />

          <FeatureCard
            index={3}
            icon={FlaskConical}
            title="Faculty Research"
            description="Manage research projects, recruit passionate student researchers, and collaborate with industry experts."
            cta="Post Research"
            color="text-rose-500"
            reverse
            onClick={() => navigate('/faculty-dashboard')}
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className={`py-16 transition-all duration-500 border-y ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className={`text-4xl font-bold mb-1 transition-all duration-500 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>5K+</div>
              <div className="text-sm text-slate-500 font-bold uppercase tracking-widest">Active Students</div>
            </div>
            <div>
              <div className={`text-4xl font-bold mb-1 transition-all duration-500 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>200+</div>
              <div className="text-sm text-slate-500 font-bold uppercase tracking-widest">Expert Mentors</div>
            </div>
            <div>
              <div className={`text-4xl font-bold mb-1 transition-all duration-500 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>150+</div>
              <div className="text-sm text-slate-500 font-bold uppercase tracking-widest">Partner Startups</div>
            </div>
            <div>
              <div className={`text-4xl font-bold mb-1 transition-all duration-500 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>50+</div>
              <div className="text-sm text-slate-500 font-bold uppercase tracking-widest">Top Universities</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`py-24 px-6 transition-all duration-500 ${
        theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'
      }`}>
        <div className="max-w-7xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-16 transition-all duration-500 ${
            theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
          }`}>
            Voices of <span className="text-blue-500">Success</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className={`p-8 rounded-[2rem] border hover:border-blue-500/50 transition-all duration-500 group backdrop-blur-sm ${
                theme === 'dark' ? 'bg-slate-900/50 border-slate-800 hover:bg-slate-900' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-xl'
              }`}>
                <div className="flex gap-1 mb-6">
                  {[...Array(t.stars)].map((_, i) => <Star key={i} className="w-4 h-4 fill-blue-500 text-blue-500" />)}
                </div>
                <p className={`text-lg mb-8 italic leading-relaxed transition-all duration-500 ${
                  theme === 'dark' ? 'text-slate-300 group-hover:text-slate-100' : 'text-slate-600 group-hover:text-slate-900'
                }`}>"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="group-hover:scale-110 transition-transform duration-500">
                    {t.avatar}
                  </div>
                  <div>
                    <div className={`font-bold text-lg transition-all duration-500 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{t.name}</div>
                    <div className="text-sm text-slate-500 font-bold uppercase tracking-wider">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        type={authType as 'login' | 'signup'}
      />

      <style>{`
        .feature-card-container {
          view-timeline-name: --card-stack;
          view-timeline-axis: block;
        }

        .feature-card-container > div {
          animation: linear card-stack-animation both;
          animation-timeline: --card-stack;
          animation-range: exit 0% exit 100%;
          transform-origin: center top;
        }

        @keyframes card-stack-animation {
          0% {
            transform: scale(1) translateY(0);
            opacity: 1;
            filter: blur(0px) brightness(1);
          }
          100% {
            transform: scale(0.85) translateY(-60px) rotateX(15deg);
            opacity: 0.3;
            filter: blur(12px) brightness(0.4);
          }
        }
      `}</style>
    </div>
);
};

export default Home;