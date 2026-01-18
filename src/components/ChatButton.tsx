import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import Chatbot from './Chatbot';
import { useTheme } from '../context/ThemeContext';

const ChatButton: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg shadow-blue-600/20 transition-all duration-300 hover:scale-110 group"
        aria-label="Open chat assistant"
      >
        <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* Chatbot Component */}
      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

export default ChatButton; 