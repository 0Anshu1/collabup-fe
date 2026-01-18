import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ChatButton from './components/ChatButton';
import MentorForm from './components/MentorForm';
import StartupForm from './components/StartupForm';
import FacultyForm from './components/FacultyForm';

import Home from './pages/Home';
import CollegeCommunity from './pages/CollegeCommunity';
import ResearchProjects from './pages/ResearchProjects';
import StudentProjects from './pages/StudentProjects';
import BuddyFinder from './pages/BuddyFinder';
import Mentorship from './pages/Mentorship';
import StartupProj from './pages/StartupProjects';
import EditProfile from './pages/EditProfile';
import ChooseRole from './pages/ChooseRole';
import Dashboard from './pages/Dashboard';
import MentorDashboard from './pages/MentorDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StartupDashboard from './pages/StartupDashboard';
import StudentPortfolio from './pages/StudentPortfolio';
import ImpactAnalytics from './pages/ImpactAnalytics';
import CollabFinder from './pages/CollabFinder';
import FacultyLeaderboard from './pages/FacultyLeaderboard';
import Showcase from './pages/Showcase';
import TalentMatches from './pages/TalentMatches';
import Badges from './pages/Badges';
import CreateResearchProject from './pages/CreateResearchProject';
import CreateStartupProject from './pages/CreateStartupProject';
import Reviews from './pages/Reviews';
import SuccessStories from './pages/SuccessStories';
import InvestorConnect from './pages/InvestorConnect';

import { auth, db } from './firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function AppContent() {
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const { theme } = useTheme();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const showSidebar = userRole === 'student';

  return (
    <div className={`h-screen font-sans flex flex-col overflow-hidden transition-colors duration-300 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="flex flex-1 relative overflow-hidden h-full">
        {showSidebar && <Sidebar />}
        
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/college-community" element={<CollegeCommunity />} />
              <Route path="/research-projects" element={<ResearchProjects />} />
              <Route path="/student-projects" element={<StudentProjects />} />
              <Route path='/buddy-finder' element={<BuddyFinder/>}/>
              <Route path='/mentorship' element={<Mentorship/>}/>
              <Route path='/startup-proj' element={<StartupProj/>}/>
              <Route path='/edit-profile' element={<EditProfile/>}/>
              <Route path="/choose-role" element={<ChooseRole />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/mentor-dashboard" element={<MentorDashboard />} />
              <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
              <Route path="/startup-dashboard" element={<StartupDashboard />} />
              <Route path="/mentor-signup" element={<MentorForm />} />
              <Route path="/startup-signup" element={<StartupForm />} />
              <Route path="/faculty-signup" element={<FacultyForm />} />
              <Route path="/portfolio" element={<StudentPortfolio />} />
              <Route path="/impact-analytics" element={<ImpactAnalytics />} />
              <Route path="/collab-finder" element={<CollabFinder />} />
              <Route path="/faculty-leaderboard" element={<FacultyLeaderboard />} />
              <Route path="/showcase" element={<Showcase />} />
              <Route path="/talent-matches" element={<TalentMatches />} />
              <Route path="/badges" element={<Badges />} />
              <Route path="/mentor-badges" element={<Badges />} />
              <Route path="/create-research" element={<CreateResearchProject />} />
              <Route path="/create-startup-project" element={<CreateStartupProject />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/success-stories" element={<SuccessStories />} />
              <Route path="/investor-connect" element={<InvestorConnect />} />
            </Routes>
            {isHomePage && <Footer />}
          </main>
        </div>
      </div>
      <ChatButton />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;