import { app } from './firebaseConfig';
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions(app);

interface CollaborationRequest {
  projectTitle: string;
  projectOwnerEmail: string;
  collaboratorEmail: string;
  collaboratorPhone: string;
  collaboratorSkills: string;
}

async function fallbackSendEmail(request: CollaborationRequest) {
  // Fallback: Use EmailJS REST API or a simple mailto link as a last resort
  try {
    // Try EmailJS REST API (replace with your EmailJS service details)
    const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || '';
    const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || '';
    const userId = process.env.REACT_APP_EMAILJS_USER_ID || '';
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: userId,
        template_params: {
          project_title: request.projectTitle,
          project_owner_email: request.projectOwnerEmail,
          collaborator_email: request.collaboratorEmail,
          collaborator_phone: request.collaboratorPhone,
          collaborator_skills: request.collaboratorSkills
        }
      })
    });
    if (!response.ok) throw new Error('EmailJS fallback failed');
    return true;
  } catch (err) {
    // As a last fallback, open a mailto link (user interaction required)
    window.open(
      `mailto:${request.projectOwnerEmail}?subject=Collaboration Request: ${encodeURIComponent(request.projectTitle)}&body=Collaboration request from ${request.collaboratorEmail}. Phone: ${request.collaboratorPhone}. Skills: ${request.collaboratorSkills}`
    );
    return false;
  }
}

export const sendCollaborationEmail = async (request: CollaborationRequest) => {
  try {
    const emailFunction = httpsCallable(functions, 'sendCollaborationEmail');
    await emailFunction(request);
    return true;
  } catch (error) {
    console.error('Error sending collaboration email via Firebase:', error);
    // Fallback to EmailJS REST API or mailto
    return fallbackSendEmail(request);
  }
};