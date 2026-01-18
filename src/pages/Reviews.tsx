import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Star, ArrowLeft, User, Calendar, Quote } from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../firebase/firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

interface Review {
  id: string;
  mentorId: string;
  studentId: string;
  studentName: string;
  rating: number;
  comment: string;
  recommended: boolean;
  sessionType: string;
  createdAt: any;
}

const Reviews = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    recommendationRate: 0
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const reviewsQuery = query(
          collection(db, 'mentor_reviews'),
          where('mentorId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(reviewsQuery);
        const reviewData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Review[];
        
        setReviews(reviewData);

        if (reviewData.length > 0) {
          const total = reviewData.reduce((acc, rev) => acc + rev.rating, 0);
          const avg = total / reviewData.length;
          const recommended = reviewData.filter(rev => rev.recommended).length;
          
          setStats({
            averageRating: Number(avg.toFixed(1)),
            totalReviews: reviewData.length,
            recommendationRate: Math.round((recommended / reviewData.length) * 100)
          });
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [currentUser]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all duration-500 ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-12 px-6 transition-all duration-500 ${
      theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
    }`}>
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/mentor-dashboard')}
          className={`flex items-center gap-2 font-bold mb-8 transition-all duration-500 group focus:ring-4 focus:ring-blue-500/50 outline-none rounded-lg ${
            theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 animate-fade-in transition-all duration-500">
          <div>
            <h1 className={`text-4xl font-black mb-2 transition-all duration-500 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>Ratings & Reviews</h1>
            <p className={`font-medium transition-all duration-500 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>Feedback and testimonials from your mentees.</p>
          </div>
          <div className="flex gap-4">
            <div className={`px-6 py-4 rounded-2xl shadow-sm border text-center transition-all duration-500 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <p className={`text-2xl font-black transition-all duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.averageRating}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Rating</p>
            </div>
            <div className={`px-6 py-4 rounded-2xl shadow-sm border text-center transition-all duration-500 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <p className={`text-2xl font-black transition-all duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.recommendationRate}%</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rec. Rate</p>
            </div>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className={`rounded-[2.5rem] p-20 text-center border shadow-sm animate-scale-in transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${
              theme === 'dark' ? 'bg-slate-950 text-slate-700' : 'bg-slate-50 text-slate-300'
            }`}>
              <MessageSquare size={40} />
            </div>
            <h2 className={`text-2xl font-bold mb-2 transition-all duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>No reviews yet</h2>
            <p className={`font-medium max-w-sm mx-auto transition-all duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Reviews from your mentees will appear here once you've completed some mentorship sessions.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
            {reviews.map((review, index) => (
              <div 
                key={review.id} 
                className={`rounded-[2rem] p-8 shadow-sm border relative overflow-hidden group transition-all duration-500 ${
                  theme === 'dark' 
                    ? 'bg-slate-900 border-slate-800 hover:shadow-blue-500/10' 
                    : 'bg-white border-slate-200 hover:shadow-xl hover:shadow-blue-500/5'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-50'
                }`}>
                  <Quote size={120} />
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold border transition-all duration-500 ${
                      theme === 'dark' ? 'bg-slate-950 text-slate-500 border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      {review.studentName?.charAt(0) || <User size={20} />}
                    </div>
                    <div>
                      <h3 className={`font-bold transition-all duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{review.studentName}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <Calendar size={12} />
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border transition-all duration-500 ${
                    theme === 'dark' ? 'bg-amber-900/20 border-amber-900/30' : 'bg-amber-50 border-amber-100'
                  }`}>
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className={`text-sm font-black transition-all duration-500 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`}>{review.rating}.0</span>
                  </div>
                </div>

                <p className={`leading-relaxed font-medium mb-6 relative z-10 transition-all duration-500 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  "{review.comment}"
                </p>

                <div className="flex items-center gap-4 relative z-10">
                  {review.recommended && (
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all duration-500 ${
                      theme === 'dark' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/30' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      Recommended
                    </span>
                  )}
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all duration-500 ${
                    theme === 'dark' ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {review.sessionType || 'Mentorship'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
