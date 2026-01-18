// Chatbot API Configuration
export const CHATBOT_CONFIG = {
  // Use Vite's import.meta.env for environment variables
  // If no API URL is provided, the chatbot will use fallback responses
  baseURL: 'https://3t3bpy.buildship.run',
  endpoint: '/chatbot-9b77d1e54578',
  
  // API Headers
  headers: {
    'Content-Type': 'application/json',
    // Add any authentication headers if needed
    // 'Authorization': `Bearer ${import.meta.env.VITE_CHATBOT_API_KEY}`,
    // 'X-API-Key': import.meta.env.VITE_CHATBOT_API_KEY,
  },
  
  // Request timeout in milliseconds
  timeout: 10000,
  
  // Retry configuration
  retries: 2,
  retryDelay: 1000,
  
  // Fallback responses when API is unavailable
  fallbackResponses: {
    'what is collabup': 'CollabUp is a platform designed to help students connect, collaborate, and grow through community-driven project building, hackathons, mentorship, and startup engagements.',
    'help': 'I can help you with questions about: 1) General platform info and signup, 2) Project collaboration and team management, 3) Hackathons and Buddy Finder, 4) Mentorship and becoming a mentor, 5) Startup projects and applications, 6) Account and profile management, 7) Community features and recognition, 8) Troubleshooting and support. What would you like to know?',
    'contact': 'For support, email us at support@collabup.in or use the in-app Help feature.',
    'mentorship': 'Our mentorship feature allows students to connect with experienced professionals. You can search mentors by domain, experience level, and price range. Book sessions directly through the platform.',
    'projects': 'We offer various project opportunities: Student Projects for collaboration, Research Projects with faculty, and Startup Projects for real-world experience.',
    'buddy finder': 'Buddy Finder helps you find compatible teammates for upcoming hackathons based on your skill set, previous participation, and interests.',
    'startup': 'Startup projects provide real-world industry experience. Students can work on projects from various startups and earn certifications.',
    'research': 'Research projects allow students to work with faculty on cutting-edge research. Projects are available across different institutes and domains.',
    'community': 'The College Community feature allows students to join study groups, participate in events, and connect with peers.',
    'default': "I'm sorry, I'm currently in offline mode. Please try again later or contact support for immediate assistance. You can also check our help section for common questions.",
  },
  
  // Error messages
  errorMessages: {
    networkError: 'Sorry, I\'m having trouble connecting to the server. Please check your internet connection and try again.',
    serverError: 'Sorry, I\'m experiencing technical difficulties. Please try again later or contact support if the problem persists.',
    timeoutError: 'Sorry, the request is taking too long. Please try again.',
    unknownError: 'Sorry, something went wrong. Please try again later.',
  },
};

// Helper function to get full API URL with query parameter
export const getChatbotAPIUrl = (query: string): string => {
  if (!CHATBOT_CONFIG.baseURL) {
    throw new Error('No API URL configured');
  }
  const encodedQuery = encodeURIComponent(query);
  return `${CHATBOT_CONFIG.baseURL}${CHATBOT_CONFIG.endpoint}?query=${encodedQuery}`;
};

// Helper function to check if API is configured
export const isApiConfigured = (): boolean => {
  return !!CHATBOT_CONFIG.baseURL;
};

// Helper function to get request payload (not needed for GET requests)
export const getChatbotPayload = (message: string, additionalData?: any) => {
  return {
    message,
    timestamp: new Date().toISOString(),
    // Add any additional parameters your API expects
    // userId: additionalData?.userId,
    // sessionId: additionalData?.sessionId,
    // platform: 'web',
    // version: '1.0.0',
    ...additionalData,
  };
};