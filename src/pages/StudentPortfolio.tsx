import React from 'react';
import { User, Briefcase, GraduationCap, Award, ExternalLink, Plus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const StudentPortfolio: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen py-12 px-6 transition-colors duration-500 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fade-in">
          <div className="flex items-center gap-6">
            <div className={`w-24 h-24 rounded-[2rem] border shadow-xl flex items-center justify-center text-4xl font-black text-blue-600 transition-all duration-500 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-blue-500/10' : 'bg-white border-slate-100 shadow-blue-500/5'
            }`}>
              <User className="w-12 h-12" />
            </div>
            <div>
              <h1 className={`text-4xl font-black mb-2 transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>My Professional Portfolio</h1>
              <p className={`font-medium transition-colors duration-500 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>Showcase your projects, skills, and achievements to potential collaborators.</p>
            </div>
          </div>
          <button className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all duration-500 hover:scale-105 active:scale-95 uppercase tracking-wider text-sm">
            <Plus className="w-5 h-5" /> Add Project
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8 animate-fade-in">
            {/* Projects Section */}
            <div className={`rounded-[2.5rem] p-10 border shadow-sm transition-all duration-500 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <div className="flex items-center gap-4 mb-8">
                <div className={`p-3 rounded-2xl text-blue-600 transition-colors duration-500 ${
                  theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'
                }`}>
                  <Briefcase className="w-6 h-6" />
                </div>
                <h2 className={`text-2xl font-black transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>Featured Projects</h2>
              </div>
              
              <div className={`flex flex-col items-center justify-center py-20 rounded-[2rem] border-2 border-dashed transition-all duration-500 ${
                theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`p-4 rounded-2xl shadow-sm mb-4 transition-all duration-500 ${
                  theme === 'dark' ? 'bg-slate-900' : 'bg-white'
                }`}>
                  <Plus className={`w-8 h-8 transition-colors duration-500 ${
                    theme === 'dark' ? 'text-slate-600' : 'text-slate-300'
                  }`} />
                </div>
                <p className={`font-bold uppercase tracking-widest text-xs transition-colors duration-500 ${
                  theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                }`}>No projects added yet</p>
                <button className="mt-4 text-blue-600 font-black text-sm hover:underline">Create your first project</button>
              </div>
            </div>

            {/* Experience Section */}
            <div className={`rounded-[2.5rem] p-10 border shadow-sm transition-all duration-500 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <div className="flex items-center gap-4 mb-8">
                <div className={`p-3 rounded-2xl text-blue-600 transition-colors duration-500 ${
                  theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'
                }`}>
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h2 className={`text-2xl font-black transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>Education & Experience</h2>
              </div>
              
              <div className="space-y-6">
                <div className={`p-6 rounded-2xl border flex items-center justify-center transition-all duration-500 ${
                  theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <p className={`font-bold uppercase tracking-widest text-xs transition-colors duration-500 ${
                    theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                  }`}>Experience details will appear here</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
            {/* Skills & Certifications */}
            <div className={`rounded-[2.5rem] p-10 border shadow-sm transition-all duration-500 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <div className="flex items-center gap-4 mb-8">
                <div className={`p-3 rounded-2xl text-blue-600 transition-colors duration-500 ${
                  theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'
                }`}>
                  <Award className="w-6 h-6" />
                </div>
                <h2 className={`text-2xl font-black transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>Skills</h2>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <div className={`px-4 py-2 rounded-xl text-xs font-black border border-dashed transition-all duration-500 ${
                  theme === 'dark' ? 'bg-slate-950/50 text-slate-500 border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-100'
                }`}>
                  Add Skills +
                </div>
              </div>
            </div>

            {/* External Links */}
            <div className={`rounded-[2.5rem] p-10 border shadow-sm transition-all duration-500 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <h3 className={`text-xl font-black mb-6 transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>Connect</h3>
              <div className="space-y-4">
                <div className={`flex items-center justify-between p-4 rounded-2xl border group cursor-pointer transition-all duration-500 ${
                  theme === 'dark' ? 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                }`}>
                  <span className="font-bold text-sm transition-colors duration-500">GitHub Profile</span>
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
                <div className={`flex items-center justify-between p-4 rounded-2xl border group cursor-pointer transition-all duration-500 ${
                  theme === 'dark' ? 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                }`}>
                  <span className="font-bold text-sm transition-colors duration-500">LinkedIn Profile</span>
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPortfolio;
