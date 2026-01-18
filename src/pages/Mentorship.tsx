import { useState, useEffect } from 'react';
import { Search, BookOpen, Code, Star, MapPin, MessageCircle, ChevronDown, Calendar, Clock, Video, X, PartyPopper } from 'lucide-react';
import { auth, db } from '../firebase/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { sendCollabEmail } from '../utils/sendCollabEmail';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserRole } from '../utils/getUserRole'; // From previous artifact
import { useTheme } from '../context/ThemeContext';

interface Mentor {
  id: string;
  name: string;
  imageUrl: string;
  domain: string;
  pricing: string;
  experience: number;
  location: string;
  matchScore: number;
  skills: string[];
  email: string;
}

interface BookingDetails {
  date: string;
  timeSlot: string;
  platform: string;
}

const domains = [
  'Full Stack Development', 'Frontend Development', 'Backend Development',
  'Mobile Development', 'DevOps', 'Cloud Computing', 'Data Science',
  'Machine Learning', 'Artificial Intelligence', 'Blockchain', 'Cybersecurity',
  'UI/UX Design',
];

const priceRanges = ['2000-5000', '5000-10000', '10000-15000', '15000-20000', '20000+'];
const experienceYears = [2, 3, '3+'];
const platforms = ['Google Meet', 'Zoom', 'Microsoft Teams', 'Skype'];
const timeSlots = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
  '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM',
];


function Mentorship() {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');
  const [selectedExperience, setSelectedExperience] = useState<string | number>('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [bookingMentor, setBookingMentor] = useState<Mentor | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    date: '',
    timeSlot: '',
    platform: '',
  });
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ email: string; fullName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check authentication status and fetch user role
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const role = await getUserRole();
        setUserRole(role);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({ email: data.email, fullName: data.fullName || data.startupName || data.founderName || '' });
        }
      } else {
      // Non-logged-in users see no mentors (or you can show a message/UI instead)
      setMentors([]);
      setIsLoading(false);
      }
    });

    // Fetch mentors for students or mentors
    const fetchMentors = async () => {
      if (!currentUser || userRole !== 'student') {
        setIsLoading(false);
        return;
      }
      try {
        const mentorsQuery = query(collection(db, 'users'), where('role', '==', 'mentor'));
        const querySnapshot = await getDocs(mentorsQuery);
        const mentorList: Mentor[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.fullName,
            email: data.email,
            imageUrl: data.profilePicUrl || 'https://via.placeholder.com/150',
            domain: data.expertiseAreas?.[0] || 'Unknown',
            pricing: data.pricing || '5000-10000',
            experience: data.yearsOfExperience || 0,
            location: data.institute || 'Unknown',
            matchScore: 0, // Set to 0 or fetch from real data if available
            skills: data.expertiseAreas || [],
          };
        });
        setMentors(mentorList);
      } catch (err) {
        console.error('Error fetching mentors:', err);
        setError('Failed to load mentors.');
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser && userRole === 'student') {
      fetchMentors();
    }
    return () => unsubscribe();
  }, [currentUser, userRole, location.search]);

  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDomain = selectedDomain === '' || mentor.domain === selectedDomain;
    
    const matchesPrice = selectedPrice === '' || (() => {
      if (selectedPrice === '20000+') return parseInt(mentor.pricing) >= 20000;
      const [min, max] = selectedPrice.split('-').map(Number);
      const mentorPrice = parseInt(mentor.pricing);
      return mentorPrice >= min && mentorPrice <= max;
    })();

    const matchesExperience = selectedExperience === '' || (() => {
      if (selectedExperience === '3+') return mentor.experience >= 3;
      return mentor.experience === Number(selectedExperience);
    })();

    return matchesSearch && matchesDomain && matchesPrice && matchesExperience;
  });

  const handleBookSession = (mentor: Mentor) => {
    if (!currentUser) {
      setIsSignInModalOpen(true);
      return;
    }
    setBookingMentor(mentor);
    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!currentUser || !bookingMentor || !userData) return;

    setIsLoading(true);
    setError(null);

    try {
      const bookingData = {
        mentorId: bookingMentor.id,
        mentorName: bookingMentor.name,
        mentorEmail: bookingMentor.email,
        studentId: currentUser.uid,
        studentName: userData.fullName,
        studentEmail: userData.email,
        date: bookingDetails.date,
        timeSlot: bookingDetails.timeSlot,
        platform: bookingDetails.platform,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'mentorship_bookings'), bookingData);

      // Send email notification
      await sendCollabEmail({
        to: bookingMentor.email,
        subject: `New Mentorship Session Booking: ${bookingDetails.date} at ${bookingDetails.timeSlot}`,
        html: `<p>Hello ${bookingMentor.name},</p><p>A student (${userData.fullName}) has booked a mentorship session with you.</p><p><b>Date:</b> ${bookingDetails.date}</p><p><b>Time:</b> ${bookingDetails.timeSlot}</p><p><b>Platform:</b> ${bookingDetails.platform}</p>`
      });

      setIsBookingModalOpen(false);
      setIsConfirmationModalOpen(true);
    } catch (err) {
      console.error('Error booking session:', err);
      setError('Failed to book session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If an ID is present, show only the selected mentor card
  const params = new URLSearchParams(location.search);
  const selectedId = params.get('id');
  let selectedMentor: Mentor | undefined = undefined;
  if (selectedId) {
    selectedMentor = mentors.find(m => String(m.id) === String(selectedId));
  }

  if (selectedId && selectedMentor) {
    return (
      <div className={`min-h-screen py-12 px-6 transition-colors duration-500 ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <button 
              onClick={() => navigate(-1)} 
              className={`flex items-center gap-2 font-bold transition-colors duration-500 group ${
                theme === 'dark' ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border transition-all duration-500 ${
                theme === 'dark' 
                  ? 'bg-slate-900/50 border-slate-800 group-hover:bg-blue-600 group-hover:text-white' 
                  : 'bg-white border-slate-100 group-hover:bg-blue-600 group-hover:text-white'
              }`}>
                &larr;
              </div>
              Back to Mentors
            </button>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className={`rounded-[3rem] shadow-xl overflow-hidden border transition-all duration-500 ${
              theme === 'dark' 
                ? 'bg-slate-900/50 border-slate-800 shadow-blue-900/10' 
                : 'bg-white border-slate-100 shadow-blue-500/5'
            }`}>
              <div className="relative h-48 bg-gradient-to-r from-blue-600 to-blue-400">
                <div className="absolute -bottom-16 left-12">
                  <img
                    src={selectedMentor.imageUrl}
                    alt={selectedMentor.name}
                    className={`w-32 h-32 rounded-[2rem] object-cover border-8 shadow-2xl ${
                      theme === 'dark' ? 'border-slate-950' : 'border-white'
                    }`}
                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')}
                  />
                </div>
                <div className={`absolute top-8 right-8 backdrop-blur-md px-6 py-2 rounded-2xl border ${
                  theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white/20 border-white/30'
                }`}>
                  <div className="flex items-center gap-2">
                    <Star className="text-yellow-400" size={20} fill="currentColor" />
                    <span className="font-black text-white">{selectedMentor.matchScore}% MATCH</span>
                  </div>
                </div>
              </div>

              <div className="pt-24 p-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                  <div>
                    <h3 className={`text-4xl font-black mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>{selectedMentor.name}</h3>
                    <div className="flex items-center gap-3 text-slate-500">
                      <MapPin size={20} className="text-blue-600" />
                      <span className={`text-lg font-medium ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>{selectedMentor.location}</span>
                    </div>
                  </div>
                  <div className={`px-8 py-4 rounded-[1.5rem] border ${
                    theme === 'dark' ? 'bg-blue-900/20 border-blue-900/30' : 'bg-blue-50 border-blue-100'
                  }`}>
                    <p className={`text-xs font-black uppercase tracking-widest mb-1 ${
                      theme === 'dark' ? 'text-blue-400' : 'text-blue-400'
                    }`}>Starting from</p>
                    <span className="text-3xl font-black text-blue-600">₹{selectedMentor.pricing}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Expertise</h4>
                      <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ${
                        theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                      }`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 shadow-sm transition-all duration-500 ${
                          theme === 'dark' ? 'bg-slate-950' : 'bg-white'
                        }`}>
                          <BookOpen size={24} />
                        </div>
                        <span className={`text-xl font-bold transition-colors duration-500 ${
                          theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                        }`}>{selectedMentor.domain}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Experience</h4>
                      <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ${
                        theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                      }`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 shadow-sm transition-all duration-500 ${
                          theme === 'dark' ? 'bg-slate-950' : 'bg-white'
                        }`}>
                          <Code size={24} />
                        </div>
                        <span className={`text-xl font-bold transition-colors duration-500 ${
                          theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                        }`}>{selectedMentor.experience} Years of Industry Experience</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Top Skills</h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedMentor.skills.map((skill, index) => (
                        <span
                          key={index}
                          className={`px-6 py-3 rounded-2xl text-sm font-bold border shadow-sm transition-all duration-500 ${
                            theme === 'dark' 
                              ? 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-blue-500' 
                              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleBookSession(selectedMentor)}
                  className={`w-full flex items-center justify-center gap-4 py-6 rounded-[2rem] text-xl font-black transition-all duration-500 shadow-2xl active:scale-[0.98] focus:ring-4 focus:ring-blue-500/50 outline-none ${
                    theme === 'dark' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20 hover:shadow-blue-600/30' 
                      : 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-900/10 hover:shadow-blue-600/20'
                  }`}
                >
                  <MessageCircle size={28} />
                  Book Mentorship Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedId && !selectedMentor) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-500 ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
        <div className={`rounded-[3rem] p-12 max-w-lg w-full text-center shadow-xl border transition-all duration-500 ${
          theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <X size={40} />
          </div>
          <h2 className={`text-3xl font-black mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>Mentor Not Found</h2>
          <p className={`text-lg font-medium mb-10 leading-relaxed ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>The mentor you're looking for might have updated their profile or is currently unavailable.</p>
          <button 
            onClick={() => navigate(-1)} 
            className={`w-full py-5 rounded-2xl font-bold transition-all ${
              theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            Back to Mentors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-12 px-6 transition-colors duration-500 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h1 className={`text-6xl font-black mb-6 tracking-tight transition-colors duration-500 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>Find Your Perfect Mentor</h1>
          <p className={`text-xl font-medium max-w-2xl mx-auto transition-colors duration-500 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>Accelerate your career with 1-on-1 guidance from top industry experts.</p>
        </div>

        <div className={`rounded-[2.5rem] shadow-sm p-10 mb-16 border transition-all duration-500 ${
          theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
              <input
                type="text"
                placeholder="Search mentors..."
                className={`w-full pl-14 pr-6 py-5 border rounded-2xl outline-none transition-all duration-500 font-medium ${
                  theme === 'dark' 
                    ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500'
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
                    ? 'bg-slate-900/50 border-slate-700 text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500'
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
                    value={selectedPrice}
                    onChange={(e) => setSelectedPrice(e.target.value)}
                    className={`w-full appearance-none pl-6 pr-12 py-5 border rounded-2xl outline-none transition-all duration-500 font-bold cursor-pointer ${
                      theme === 'dark' 
                        ? 'bg-slate-900/50 border-slate-700 text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500'
                    }`}
                  >
                    <option value="">All Prices</option>
                    {priceRanges.map((range) => (
                      <option key={range} value={range}>₹{range}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                </div>

                <div className="relative">
                  <select
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value)}
                    className={`w-full appearance-none pl-6 pr-12 py-5 border rounded-2xl outline-none transition-all duration-500 font-bold cursor-pointer ${
                      theme === 'dark' 
                        ? 'bg-slate-900/50 border-slate-700 text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500'
                    }`}
                  >
                <option value="">All Experience</option>
                {experienceYears.map((year) => (
                  <option key={year} value={year}>{year} {typeof year === 'number' ? 'Years' : 'Years'}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            </div>
          </div>
        </div>

        {error && (
          <div className={`mb-12 p-6 rounded-[1.5rem] border font-bold flex items-center gap-4 ${
            theme === 'dark' ? 'bg-rose-900/20 border-rose-900/30 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-600'
          }`}>
            <div className="w-10 h-10 bg-rose-600 text-white rounded-full flex items-center justify-center shrink-0">!</div>
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-32">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <p className="text-slate-400 text-xl font-bold tracking-tight">Curating your mentor matches...</p>
          </div>
        ) : filteredMentors.length === 0 ? (
          <div className={`text-center py-32 rounded-[3rem] border shadow-sm transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <p className="text-slate-400 text-xl font-bold">No mentors found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredMentors.map((mentor) => (
              <div key={mentor.id} className={`rounded-[2.5rem] p-8 border flex flex-col justify-between shadow-sm group hover:shadow-2xl transition-all duration-500 ${
                theme === 'dark' 
                  ? 'bg-slate-900/50 border-slate-800 hover:shadow-blue-900/20 hover:border-blue-900' 
                  : 'bg-white border-slate-100 hover:shadow-blue-500/10 hover:border-blue-200'
              }`}>
                <div className="relative">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                      <img
                        src={mentor.imageUrl}
                        alt={mentor.name}
                        className={`w-20 h-20 rounded-[1.5rem] object-cover border-2 group-hover:scale-105 transition-transform duration-500 ${
                          theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
                        }`}
                        onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')}
                      />
                      <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xl">
                        {mentor.matchScore}%
                      </div>
                    </div>
                    <div>
                      <h3 className={`text-2xl font-black group-hover:text-blue-600 transition-colors leading-tight ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>{mentor.name}</h3>
                      <div className="flex items-center gap-2 text-slate-400 mt-1">
                        <MapPin size={14} className="text-blue-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">{mentor.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 ${
                      theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <BookOpen size={18} className="text-blue-600" />
                      <span className={`text-sm font-bold transition-colors duration-500 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>{mentor.domain}</span>
                    </div>
                    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 ${
                      theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <Code size={18} className="text-blue-600" />
                      <span className={`text-sm font-bold transition-colors duration-500 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>{mentor.experience} Years Experience</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {mentor.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all duration-500 ${
                          theme === 'dark' 
                            ? 'bg-slate-900/50 border-slate-700 text-slate-400' 
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                    {mentor.skills.length > 3 && (
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all duration-500 ${
                        theme === 'dark' ? 'bg-slate-900/50 text-slate-500' : 'bg-slate-50 text-slate-400'
                      }`}>+{mentor.skills.length - 3}</span>
                    )}
                  </div>

                  <div className={`pt-6 border-t flex items-center justify-between mb-8 ${
                    theme === 'dark' ? 'border-slate-800' : 'border-slate-50'
                  }`}>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultation Fee</span>
                    <span className={`text-xl font-black ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>₹{mentor.pricing}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleBookSession(mentor)}
                  className={`w-full flex items-center justify-center gap-3 font-bold py-5 px-6 rounded-[1.5rem] transition-all duration-500 transform active:scale-[0.98] shadow-xl focus:ring-4 focus:ring-blue-500/50 outline-none ${
                    theme === 'dark' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20 hover:shadow-blue-600/30' 
                      : 'bg-slate-900 hover:bg-blue-600 text-white shadow-slate-900/10 hover:shadow-blue-600/20'
                  }`}
                >
                  <MessageCircle size={20} />
                  Book Session
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {isSignInModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border text-center animate-scale-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 ${
              theme === 'dark' ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}>
              <MessageCircle size={40} />
            </div>
            <h3 className={`text-3xl font-black mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>Sign In Required</h3>
            <p className={`font-medium mb-10 leading-relaxed ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>Join CollabUp to connect with expert mentors and accelerate your growth.</p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  setIsSignInModalOpen(false);
                  navigate('/signin');
                }}
                className={`w-full py-5 rounded-2xl font-bold transition-all duration-500 shadow-xl focus:ring-4 focus:ring-blue-500/50 outline-none ${
                  theme === 'dark' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20 hover:shadow-blue-600/30' 
                    : 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-900/10 hover:shadow-blue-600/20'
                }`}
              >
                Sign In to Continue
              </button>
              <button
                onClick={() => setIsSignInModalOpen(false)}
                className={`w-full py-5 rounded-2xl font-bold transition-all duration-500 focus:ring-4 focus:ring-blue-500/50 outline-none ${
                  theme === 'dark' ? 'bg-slate-900/50 text-slate-400 hover:bg-slate-800' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {isBookingModalOpen && bookingMentor && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className={`rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl border animate-scale-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className={`text-3xl font-black transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>Book Session</h2>
                <p className={`font-bold mt-1 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-400'
                }`}>with {bookingMentor.name}</p>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 focus:ring-4 focus:ring-rose-500/50 outline-none ${
                  theme === 'dark' 
                    ? 'bg-slate-900/50 text-slate-400 hover:text-rose-400 hover:bg-rose-900/20' 
                    : 'bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                }`}
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className={`mb-8 p-5 rounded-2xl border font-bold flex items-center gap-3 ${
                theme === 'dark' ? 'bg-rose-900/20 border-rose-900/30 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-600'
              }`}>
                <div className="w-8 h-8 bg-rose-600 text-white rounded-lg flex items-center justify-center shrink-0">!</div>
                {error}
              </div>
            )}

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Select Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-600" size={20} />
                    <input
                      type="date"
                      value={bookingDetails.date}
                      onChange={(e) => setBookingDetails({ ...bookingDetails, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full pl-14 pr-6 py-4 border rounded-2xl font-bold outline-none transition-all duration-500 ${
                        theme === 'dark' 
                          ? 'bg-slate-900/50 border-slate-700 text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500'
                      }`}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Time Slot</label>
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-600" size={20} />
                    <select
                      value={bookingDetails.timeSlot}
                      onChange={(e) => setBookingDetails({ ...bookingDetails, timeSlot: e.target.value })}
                      className={`w-full appearance-none pl-14 pr-12 py-4 border rounded-2xl font-bold outline-none transition-all duration-500 cursor-pointer ${
                        theme === 'dark' 
                          ? 'bg-slate-900/50 border-slate-700 text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500'
                      }`}
                      required
                    >
                      <option value="">Select slot</option>
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Meeting Platform</label>
                <div className="relative">
                  <Video className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600" size={20} />
                  <select
                    value={bookingDetails.platform}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, platform: e.target.value })}
                    className={`w-full appearance-none pl-14 pr-12 py-4 border rounded-2xl font-bold outline-none transition-all duration-500 cursor-pointer ${
                      theme === 'dark' 
                        ? 'bg-slate-900/50 border-slate-700 text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500'
                    }`}
                    required
                  >
                    <option value="">Select platform</option>
                    {platforms.map((platform) => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                </div>
              </div>

              <button
                onClick={handleConfirmBooking}
                disabled={isLoading || !bookingDetails.date || !bookingDetails.timeSlot || !bookingDetails.platform}
                className={`w-full py-6 rounded-2xl font-black text-lg transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl active:scale-[0.98] mt-4 focus:ring-4 focus:ring-blue-500/50 outline-none ${
                  theme === 'dark' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20' 
                    : 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-900/10 hover:shadow-blue-600/20'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfirmationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`rounded-[3rem] p-12 max-w-md w-full text-center shadow-2xl border transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 transition-all duration-500 ${
              theme === 'dark' ? 'bg-emerald-900/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <PartyPopper size={48} />
            </div>
            <h3 className={`text-4xl font-black mb-4 transition-colors duration-500 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>Success! 🎉</h3>
            <p className={`font-medium mb-10 leading-relaxed transition-colors duration-500 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Your session is booked for <span className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-black`}>{bookingDetails.date}</span> at <span className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-black`}>{bookingDetails.timeSlot}</span>. Check your email for details!
            </p>
            <button
              onClick={() => setIsConfirmationModalOpen(false)}
              className={`w-full py-5 rounded-2xl font-bold transition-all duration-500 shadow-xl focus:ring-4 focus:ring-blue-500/50 outline-none ${
                theme === 'dark' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20' 
                  : 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-900/10 hover:shadow-blue-600/20'
              }`}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Mentorship;