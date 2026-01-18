import emailjs from '@emailjs/browser';
import { EMAIL_CONFIG, getEmailEndpoint } from '../config/emailConfig';

// Utility function to send email via EmailJS with backend fallback
interface SendCollabEmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  type?: 'collab' | 'feedback';
}

async function sendViaEmailJS(params: SendCollabEmailParams): Promise<boolean> {
  try {
    // Check if EmailJS is properly configured
    if (!EMAIL_CONFIG.isEmailJSConfigured()) {
      console.log('⚠️ EmailJS not configured, skipping...');
      return false;
    }

    console.log('📧 Attempting to send email via EmailJS...');
    
    const templateParams = {
      to_email: params.to,
      subject: params.subject,
      message: params.text || params.html || '',
      html_content: params.html || params.text || ''
    };

    await emailjs.send(
      EMAIL_CONFIG.emailjs.serviceId,
      EMAIL_CONFIG.emailjs.templateId,
      templateParams,
      EMAIL_CONFIG.emailjs.publicKey
    );

    console.log('✅ Email sent successfully via EmailJS');
    return true;
  } catch (error) {
    console.error('❌ EmailJS failed:', error);
    return false;
  }
}

async function sendViaBackend(params: SendCollabEmailParams): Promise<boolean> {
  try {
    console.log('📧 Attempting to send email via backend...');
    
    const endpoint = getEmailEndpoint(params.type || 'collab');
    
    // Compose request body based on type
    const body = params.type === 'feedback'
      ? JSON.stringify({ 
          name: params.to.split('@')[0], // Extract name from email
          email: params.to, 
          message: params.text || params.html || '' 
        })
      : JSON.stringify({ 
          to: params.to, 
          subject: params.subject, 
          text: params.text, 
          html: params.html 
        });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    const raw = await response.text();
    let responseBody;
    
    try {
      responseBody = JSON.parse(raw);
    } catch (err) {
      console.error("⚠️ Non-JSON response from server:", raw);
      throw new Error(`Server returned non-JSON response: ${raw}`);
    }

    if (!response.ok) {
      console.error("❌ Backend email send failed:", responseBody);
      throw new Error(responseBody.error || 'Failed to send email');
    }

    console.log("✅ Email sent successfully via backend:", responseBody);
    return true;
  } catch (error) {
    console.error('❌ Backend email failed:', error);
    return false;
  }
}

export async function sendCollabEmail(params: SendCollabEmailParams) {
  // Basic validation
  if (!params.to || params.to.trim() === '') {
    console.error("❌ sendCollabEmail failed: 'to' field is empty.");
    throw new Error("Recipient email address cannot be empty.");
  }
  if (!params.subject || params.subject.trim() === '') {
    console.error("❌ sendCollabEmail failed: 'subject' field is empty.");
    throw new Error("Subject cannot be empty.");
  }

  console.log(`📧 Sending ${params.type || 'collab'} email to: ${params.to}, subject: ${params.subject}`);

  // Try EmailJS first, then backend as fallback
  const emailJSSuccess = await sendViaEmailJS(params);
  
  if (emailJSSuccess) {
    return { success: true, method: 'emailjs' };
  }

  console.log('⚠️ EmailJS failed, trying backend fallback...');
  const backendSuccess = await sendViaBackend(params);
  
  if (backendSuccess) {
    return { success: true, method: 'backend' };
  }

  // If both methods fail, throw an error
  throw new Error('Failed to send email via both EmailJS and backend. Please check your configuration.');
}
