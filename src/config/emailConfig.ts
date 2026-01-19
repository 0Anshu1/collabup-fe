import { API_BASE_URL } from './apiConfig';

// Email configuration with environment variables and fallbacks
export const EMAIL_CONFIG = {
  // Backend API endpoints
  backendUrl: API_BASE_URL,
  emailEndpoint: import.meta.env.VITE_EMAIL_API_URL || '',
  feedbackEndpoint: import.meta.env.VITE_FEEDBACK_API_URL || '',

  // EmailJS configuration
  emailjs: {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''
  },
  
  // Validation helper
  isEmailJSConfigured: function() {
    return this.emailjs.serviceId && 
           this.emailjs.templateId && 
           this.emailjs.publicKey &&
           this.emailjs.serviceId !== '' &&
           this.emailjs.templateId !== '' &&
           this.emailjs.publicKey !== '';
  }
};

// Helper function to get email endpoint
export const getEmailEndpoint = (type: 'collab' | 'feedback' = 'collab') => {
  if (type === 'feedback') {
    return EMAIL_CONFIG.feedbackEndpoint || `${EMAIL_CONFIG.backendUrl}/send-feedback`;
  }
  return EMAIL_CONFIG.emailEndpoint || `${EMAIL_CONFIG.backendUrl}/api/send-email`;
};