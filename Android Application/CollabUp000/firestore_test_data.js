// Firestore Test Data Population Script
// Run this in Firebase Console > Firestore > Functions or use Firebase CLI

const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Sample data matching your structure
const testData = {
  students: [
    {
      user_id: "S123",
      name: "John Doe",
      skills: ["Python", "Machine Learning", "TensorFlow"],
      project: {
        title: "AI Chatbot",
        description: "Intelligent chatbot for customer support using NLP",
        skills: ["Python", "NLP", "TensorFlow"],
        domains: ["AI", "Machine Learning"]
      },
      university: "MIT",
      year: "3rd Year",
      email: "john.doe@mit.edu"
    },
    {
      user_id: "S124",
      name: "Sarah Wilson",
      skills: ["React", "Node.js", "MongoDB"],
      project: {
        title: "E-Learning Platform",
        description: "Interactive learning platform with real-time collaboration",
        skills: ["React", "Node.js", "WebRTC"],
        domains: ["Web Development", "Education"]
      },
      university: "Stanford",
      year: "4th Year",
      email: "sarah.wilson@stanford.edu"
    }
  ],
  
  mentors: [
    {
      user_id: "M456",
      name: "Jane Smith",
      domains: ["AI", "Data Science"],
      skills: ["Python", "TensorFlow", "PyTorch"],
      hackathons: ["HackXYZ", "AI Hackathon 2024", "DataFest"],
      company: "Google",
      experience: "5+ years",
      email: "jane.smith@google.com"
    },
    {
      user_id: "M457",
      name: "David Johnson",
      domains: ["Web Development", "Cloud Computing"],
      skills: ["React", "AWS", "Docker"],
      hackathons: ["WebHack", "CloudFest", "DevCon"],
      company: "Microsoft",
      experience: "7+ years",
      email: "david.johnson@microsoft.com"
    }
  ],
  
  faculty: [
    {
      user_id: "F789",
      name: "Dr. Brown",
      research_areas: ["NLP", "Computational Linguistics"],
      project: {
        title: "Sentiment Analysis Tool",
        description: "Advanced sentiment analysis for social media monitoring",
        skills: ["NLP", "Python", "BERT"],
        domains: ["NLP", "Machine Learning"],
        status: "open"
      },
      department: "Computer Science",
      university: "MIT"
    }
  ],
  
  startups: [
    {
      user_id: "ST101",
      name: "TechCorp",
      project: {
        title: "ML Engineer",
        description: "Build ML models for fintech applications",
        skills: ["ML", "Python", "TensorFlow"],
        domains: ["Fintech", "Machine Learning"],
        type: "full-time"
      },
      industry: "Fintech",
      location: "San Francisco"
    }
  ],
  
  hackathons: [
    {
      id: "H001",
      title: "AI Innovation Hackathon",
      description: "Build AI-powered solutions for real-world problems",
      domains: ["AI", "Machine Learning"],
      skills: ["Python", "Machine Learning", "TensorFlow"],
      prize: "$10,000",
      startDate: "2024-03-15",
      endDate: "2024-03-17",
      participants: 150
    }
  ]
};

// Function to populate Firestore
async function populateFirestore() {
  try {
    // Add students
    for (const student of testData.students) {
      await db.collection('students').doc(student.user_id).set(student);
      console.log(`Added student: ${student.name}`);
    }
    
    // Add mentors
    for (const mentor of testData.mentors) {
      await db.collection('mentors').doc(mentor.user_id).set(mentor);
      console.log(`Added mentor: ${mentor.name}`);
    }
    
    // Add faculty
    for (const faculty of testData.faculty) {
      await db.collection('faculty').doc(faculty.user_id).set(faculty);
      console.log(`Added faculty: ${faculty.name}`);
    }
    
    // Add startups
    for (const startup of testData.startups) {
      await db.collection('startups').doc(startup.user_id).set(startup);
      console.log(`Added startup: ${startup.name}`);
    }
    
    // Add hackathons
    for (const hackathon of testData.hackathons) {
      await db.collection('hackathons').doc(hackathon.id).set(hackathon);
      console.log(`Added hackathon: ${hackathon.title}`);
    }
    
    console.log('Firestore population completed successfully!');
  } catch (error) {
    console.error('Error populating Firestore:', error);
  }
}

// Run the population
populateFirestore(); 