import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Briefcase, Microscope } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ChooseRole = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen transition-colors duration-500 p-6 ${
      theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
    }`}>
      <div className="max-w-4xl w-full text-center mb-16 animate-fade-in">
        <h1 className={`text-5xl font-black mb-4 transition-colors duration-500 ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>Select Your Role</h1>
        <p className={`text-xl font-medium transition-colors duration-500 ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>How would you like to contribute to the CollabUp ecosystem?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl animate-fade-in" style={{ animationDelay: '200ms' }}>
        <button
          className={`group p-10 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-2 flex flex-col items-center focus:ring-4 focus:ring-blue-500/50 outline-none ${
            theme === 'dark' 
              ? 'bg-slate-900/50 border-slate-800 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20' 
              : 'bg-white border-slate-100 shadow-xl shadow-blue-500/5 hover:shadow-2xl hover:shadow-blue-500/10'
          }`}
          onClick={() => navigate('/student-projects')}
        >
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 transition-all duration-500 ${
            theme === 'dark' 
              ? 'bg-blue-900/30 text-blue-400 group-hover:bg-blue-600 group-hover:text-white' 
              : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
          }`}>
            <GraduationCap className="w-10 h-10" />
          </div>
          <h2 className={`text-2xl font-black mb-3 transition-colors duration-500 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>Student</h2>
          <p className={`font-medium text-sm text-center transition-colors duration-500 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>Find projects, build your portfolio, and collaborate with peers.</p>
        </button>

        <button
          className={`group p-10 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-2 flex flex-col items-center focus:ring-4 focus:ring-purple-500/50 outline-none ${
            theme === 'dark' 
              ? 'bg-slate-900/50 border-slate-800 shadow-xl shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/20' 
              : 'bg-white border-slate-100 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10'
          }`}
          onClick={() => navigate('/mentorship')}
        >
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 transition-all duration-500 ${
            theme === 'dark' 
              ? 'bg-purple-900/30 text-purple-400 group-hover:bg-purple-600 group-hover:text-white' 
              : 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'
          }`}>
            <Briefcase className="w-10 h-10" />
          </div>
          <h2 className={`text-2xl font-black mb-3 transition-colors duration-500 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>Mentor</h2>
          <p className={`font-medium text-sm text-center transition-colors duration-500 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>Guide students, share expertise, and shape future talent.</p>
        </button>

        <button
          className={`group p-10 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-2 flex flex-col items-center focus:ring-4 focus:ring-emerald-500/50 outline-none ${
            theme === 'dark' 
              ? 'bg-slate-900/50 border-slate-800 shadow-xl shadow-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20' 
              : 'bg-white border-slate-100 shadow-xl shadow-emerald-500/5 hover:shadow-2xl hover:shadow-emerald-500/10'
          }`}
          onClick={() => navigate('/research-projects')}
        >
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 transition-all duration-500 ${
            theme === 'dark' 
              ? 'bg-emerald-900/30 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white' 
              : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
          }`}>
            <Microscope className="w-10 h-10" />
          </div>
          <h2 className={`text-2xl font-black mb-3 transition-colors duration-500 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>Faculty</h2>
          <p className={`font-medium text-sm text-center transition-colors duration-500 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>Lead research, publish papers, and find student researchers.</p>
        </button>
      </div>
    </div>
  );
};

export default ChooseRole;
