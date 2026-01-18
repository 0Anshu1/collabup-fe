import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User } from 'lucide-react';
import { CHATBOT_CONFIG, getChatbotAPIUrl, getChatbotPayload, isApiConfigured } from '../config/chatbotConfig';
import { useTheme } from '../context/ThemeContext';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]> ([
    {
      id: '1',
      text: "Hi! I'm CollabUp Assistant. I can help you with questions about our platform, project collaboration, hackathons, mentorship, startup projects, and community features. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to call the chatbot API with retry logic
  const callChatbotAPI = async (userMessage: string, retryCount = 0): Promise<string> => {
    // Check if API is configured
    if (!isApiConfigured()) {
      return getFallbackResponse(userMessage);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CHATBOT_CONFIG.timeout);

      const response = await fetch(getChatbotAPIUrl(userMessage), {
        method: 'GET',
        headers: CHATBOT_CONFIG.headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      // Try to parse as JSON, fallback to text
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textResponse = await response.text();
        data = { response: textResponse };
      }
      
      // Return the response based on the API structure
      return data.response || data.message || data.answer || data.text || data || 'Sorry, I couldn\'t process your request.';
    } catch (error) {
      console.error('Chatbot API Error:', error);
      
      // Retry logic
      if (retryCount < CHATBOT_CONFIG.retries && error instanceof Error && error.name !== 'AbortError') {
        await new Promise(resolve => setTimeout(resolve, CHATBOT_CONFIG.retryDelay));
        return callChatbotAPI(userMessage, retryCount + 1);
      }
      
      // Return appropriate error message based on error type
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return CHATBOT_CONFIG.errorMessages.timeoutError;
        }
        
        if (error instanceof TypeError && error.message.includes('fetch')) {
          return CHATBOT_CONFIG.errorMessages.networkError;
        }
        
        if (error.message.includes('API request failed')) {
          return CHATBOT_CONFIG.errorMessages.serverError;
        }
      }
      
      return CHATBOT_CONFIG.errorMessages.unknownError;
    }
  };

  const getFallbackResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    for (const [key, value] of Object.entries(CHATBOT_CONFIG.fallbackResponses)) {
      if (key !== 'default' && lowerMessage.includes(key.toLowerCase())) {
        return value;
      }
    }
    
    return CHATBOT_CONFIG.fallbackResponses.default;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      // Call the chatbot API (or get fallback response)
      const botResponseText = await callChatbotAPI(inputText);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error getting bot response:', error);
      
      // Use fallback response if API fails
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getFallbackResponse(inputText),
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    'What is CollabUp?',
    'How do I join a project?',
    'What is Buddy Finder?',
    'How do I connect with a mentor?',
    'Are startup projects paid?',
    'How do I report a bug?',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`rounded-xl shadow-2xl border w-96 h-[500px] flex flex-col transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
      }`}>
        {/* Header */}
        <div className="bg-blue-600 rounded-t-xl p-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
            <Bot className="text-white" size={24} />
            <div>
              <h3 className="text-white font-semibold">CollabUp Assistant</h3>
              <p className="text-blue-100 text-sm opacity-90">
                {isApiConfigured() ? 'Ask me anything!' : 'Offline Mode'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/10 p-1 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 ${
                  message.isUser
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/10'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-200 rounded-tl-none'
                      : 'bg-slate-100 text-slate-800 rounded-tl-none'
                }`}
              >
                <div className="flex items-start gap-2">
                  {!message.isUser && (
                    <Bot size={16} className="text-blue-400 mt-1 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <p className={`text-[10px] mt-1 opacity-60 ${message.isUser ? 'text-blue-100' : 'text-slate-500'}`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {message.isUser && (
                    <User size={16} className="text-blue-200 mt-1 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className={`rounded-2xl p-3 max-w-[80%] rounded-tl-none ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-slate-100'
              }`}>
                <div className="flex items-center gap-2">
                  <Bot size={16} className="text-blue-400" />
                  <div className="flex space-x-1">
                    <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-400' : 'bg-slate-400'}`}></div>
                    <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-400' : 'bg-slate-400'}`} style={{ animationDelay: '0.1s' }}></div>
                    <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-400' : 'bg-slate-400'}`} style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${
              theme === 'dark' ? 'text-gray-500' : 'text-slate-400'
            }`}>Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputText(question)}
                  className={`text-xs px-3 py-1.5 rounded-xl transition-all duration-300 border ${
                    theme === 'dark' 
                      ? 'bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-700 hover:border-blue-500/50' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:border-blue-500/50'
                  }`}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className={`p-4 border-t transition-colors duration-300 ${
          theme === 'dark' ? 'border-gray-700' : 'border-slate-100'
        }`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
              className={`flex-1 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-200 border-transparent placeholder-gray-500' 
                  : 'bg-slate-50 text-slate-900 border-slate-200 placeholder-slate-400'
              }`}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot; 