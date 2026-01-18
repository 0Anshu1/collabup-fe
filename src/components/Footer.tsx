import React, { useState } from "react";
import { Send, Phone, Mail } from "lucide-react";
import { sendCollabEmail } from '../utils/sendCollabEmail';
import { useTheme } from '../context/ThemeContext';

const Footer = () => {
  const { theme } = useTheme();
  const [feedbackForm, setFeedbackForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Use sendCollabEmail utility with type 'feedback'
      await sendCollabEmail({
        to: feedbackForm.name,
        subject: feedbackForm.email,
        text: feedbackForm.message,
        type: 'feedback'
      });
      alert('Feedback sent successfully!');
      setFeedbackForm({ name: '', email: '', message: '' });
    } catch (error: any) {
      alert('Failed to send feedback. Please try again or contact support.');
      console.error('Error sending feedback:', error);
    }
  };

  return (
    <footer className={`transition-all duration-500 border-t py-24 mt-32 ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div className={`feedback-form p-10 rounded-[2.5rem] border transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800 shadow-blue-500/10' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
          }`}>
            <h3 className={`text-3xl font-black mb-8 transition-colors duration-500 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>Share Your Feedback</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="Your Name"
                  className={`w-full p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-500 font-medium ${
                    theme === 'dark' 
                      ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:bg-slate-800' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                  }`}
                  value={feedbackForm.name}
                  onChange={(e) =>
                    setFeedbackForm({ ...feedbackForm, name: e.target.value })
                  }
                  required
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className={`w-full p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-500 font-medium ${
                    theme === 'dark' 
                      ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:bg-slate-800' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                  }`}
                  value={feedbackForm.email}
                  onChange={(e) =>
                    setFeedbackForm({ ...feedbackForm, email: e.target.value })
                  }
                  required
                />
              </div>
              <textarea
                placeholder="Your Message"
                className={`w-full p-4 rounded-2xl h-40 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-500 font-medium resize-none ${
                  theme === 'dark' 
                    ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:bg-slate-800' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                }`}
                value={feedbackForm.message}
                onChange={(e) =>
                  setFeedbackForm({ ...feedbackForm, message: e.target.value })
                }
                required
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-10 py-4 rounded-2xl flex items-center gap-3 font-black hover:bg-blue-700 hover:scale-105 transition-all duration-500 shadow-xl shadow-blue-600/20 active:scale-95"
              >
                Send Message
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-12">
              <h2 className="text-5xl font-black text-blue-600 mb-6 transition-colors duration-500">CollabUp</h2>
              <p className={`text-xl leading-relaxed max-w-md transition-colors duration-500 font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Building the largest ecosystem for collaboration between students, startups, and academia. Join us in shaping the future.
              </p>
            </div>

            <div className="space-y-8">
              <h3 className={`text-xl font-black transition-colors duration-500 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>Get in Touch</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-5 group">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    theme === 'dark' 
                      ? 'bg-blue-900/30 text-blue-400 group-hover:bg-blue-600 group-hover:text-white' 
                      : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                  }`}>
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold uppercase tracking-wider transition-colors duration-500 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Call Us</p>
                    <p className={`text-lg font-black transition-colors duration-500 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>+91 83066 29224</p>
                  </div>
                </div>
                <div className="flex items-center gap-5 group">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    theme === 'dark' 
                      ? 'bg-blue-900/30 text-blue-400 group-hover:bg-blue-600 group-hover:text-white' 
                      : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                  }`}>
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold uppercase tracking-wider transition-colors duration-500 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Email Us</p>
                    <p className={`text-lg font-black transition-colors duration-500 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>collabup4@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`mt-16 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6 transition-colors duration-500 ${
              theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <p className={`font-bold text-sm transition-colors duration-500 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>© 2026 CollabUp. All rights reserved.</p>
              <div className={`flex gap-8 font-black text-xs uppercase tracking-widest transition-colors duration-500 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                <a href="#" className="hover:text-blue-500 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-blue-500 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-blue-500 transition-colors">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
