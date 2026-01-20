# CollabUp - Student Collaboration Platform

A comprehensive platform designed to help students connect, collaborate, and grow through community-driven project building, hackathons, mentorship, and startup engagements.

## 🚀 Platform Overview

CollabUp is a full-stack web application that facilitates student collaboration across various domains:

### Core Features

- **Student Projects**: Upload and collaborate on academic projects
- **Startup Projects**: Enroll in industry projects and earn certifications
- **Mentorship**: Connect with experienced mentors for guidance
- **Research Projects**: Work with faculty on cutting-edge research
- **Buddy Finder**: Find study and project partners
- **College Community**: Connect with students from your institution
- **AI-Powered Search**: Intelligent recommendation system for finding relevant opportunities
- **Chatbot Assistant**: Get instant help with platform features

### Technology Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI (Python) + Firebase Admin SDK
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Email Service**: EmailJS
- **AI/ML**: Sentence Transformers for recommendation system

## 📋 Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**
- **Firebase account** with Firestore database
- **EmailJS account** for email functionality

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CollabUp
```

### 2. Frontend Setup

#### Install Dependencies
```bash
npm install
```

#### Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# EmailJS Configuration
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id

# Recommendation API
VITE_RECOMMENDATION_API_URL=http://localhost:8000
```

#### Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Download your `serviceAccountKey.json` and place it in the root directory
5. Update the Firebase configuration in `src/firebase/firebaseConfig.ts`

#### EmailJS Setup
1. Create an account at [EmailJS](https://www.emailjs.com/)
2. Create email templates for:
   - Mentorship booking confirmation
   - Project collaboration requests
   - Welcome emails
3. Update the EmailJS configuration in the environment variables

### 3. Backend Setup

#### Navigate to Backend Directory
```bash
cd backend
```

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### Required Python Packages
The backend requires the following packages:
- `fastapi`
- `uvicorn`
- `firebase-admin`
- `sentence-transformers`
- `python-multipart`
- `python-dotenv`

#### Firebase Service Account
1. Copy your `serviceAccountKey.json` from the main directory to the `backend/` directory
2. Ensure the service account has read access to your Firestore collections

#### Start the Backend Server
```bash
# Option 1: Using the provided script
chmod +x start.sh
./start.sh

# Option 2: Manual start
uvicorn recommendation_backend:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at `http://localhost:8000`

### 4. Data Generation (Optional)

To populate your database with sample data:

```bash
cd scripts
npm install
node generateAndUploadData.js
```

This will generate realistic mock data for:
- Students
- Faculty
- Mentors
- Startups
- Projects
- Hackathons

### 5. Start the Frontend

```bash
# From the root directory
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
CollabUp/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── firebase/           # Firebase configuration and services
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   └── config/             # Configuration files
├── backend/
│   ├── recommendation_backend.py  # FastAPI backend
│   ├── requirements.txt           # Python dependencies
│   └── start.sh                   # Backend startup script
├── scripts/
│   ├── generateAndUploadData.js   # Data generation script
│   └── extended-data/             # Generated data files
└── public/                 # Static assets
```

## 🔧 Configuration

### Firebase Collections

The platform uses the following Firestore collections:

- `users` - User profiles (students, faculty, mentors, startups)
- `studentProjects` - Student-created projects
- `startups` - Startup company profiles
- `mentors` - Mentor profiles and availability
- `researchProjects` - Faculty research projects
- `mentorshipBookings` - Mentorship session bookings
- `hackathons` - Hackathon events

### Environment Variables

Key environment variables for customization:

- `VITE_RECOMMENDATION_API_URL` - Backend API URL
- `VITE_EMAILJS_*` - Email service configuration
- `VITE_FIREBASE_*` - Firebase configuration

## 🚀 Running the Application

### Development Mode

1. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   uvicorn recommendation_backend:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   npm run dev
   ```

3. **Access the Application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Production Build

```bash
npm run build
npm run preview
```

## 🔍 API Endpoints

### Recommendation System

- `GET /recommendations` - Get personalized recommendations
- `GET /health` - Health check endpoint
- `GET /debug` - Debug search queries

### Example API Usage

```bash
# Get recommendations for a query
curl "http://localhost:8000/recommendations?query=machine%20learning&limit=5"

# Health check
curl "http://localhost:8000/health"
```

## 🎯 Platform Features

### 1. Student Projects
- Upload and showcase academic projects
- Find collaborators for existing projects
- Filter by domain, technology, and difficulty level
- Real-time collaboration requests

### 2. Startup Projects
- Enroll in industry-sponsored projects
- Earn certifications and real-world experience
- Connect with startup companies
- Project-based learning opportunities

### 3. Mentorship
- Book sessions with experienced mentors
- Filter by expertise and availability
- Automated email confirmations
- Session scheduling and management

### 4. Research Projects
- Connect with faculty researchers
- Participate in academic research
- Filter by research area and institution
- Publication opportunities

### 5. Buddy Finder
- Find study partners and collaborators
- Match based on skills and interests
- Real-time messaging capabilities
- Project team formation

### 6. College Community
- Institution-specific communities
- Event announcements and participation
- Student networking opportunities
- Local collaboration hubs

### 7. AI-Powered Search
- Intelligent recommendation system
- Semantic search across all content
- Personalized results based on user profile
- Real-time search suggestions

### 8. Chatbot Assistant
- Platform-specific help and guidance
- Quick answers to common questions
- Feature explanations and tutorials
- 24/7 automated support

## 🔐 Authentication & Security

- Firebase Authentication for user management
- Role-based access control (Student, Faculty, Mentor, Startup)
- Secure API endpoints with proper validation
- Environment variable protection for sensitive data

## 📧 Email Integration

The platform uses EmailJS for automated email communications:

- Mentorship booking confirmations
- Project collaboration requests
- Welcome emails for new users
- Session reminders and updates

## 🤖 AI Recommendation System

The backend uses advanced NLP techniques to provide intelligent recommendations:

- **Semantic Search**: Uses sentence transformers for understanding query intent
- **Fuzzy Matching**: Handles typos and variations in search terms
- **Weighted Scoring**: Prioritizes results based on relevance and user preferences
- **Multi-collection Search**: Searches across all platform content simultaneously

## 🐛 Troubleshooting

### Common Issues

1. **Backend Connection Error**:
   - Ensure the backend is running on port 8000
   - Check if `serviceAccountKey.json` is in the backend directory
   - Verify Python dependencies are installed

2. **Firebase Authentication Issues**:
   - Verify Firebase configuration in environment variables
   - Check if Authentication is enabled in Firebase Console
   - Ensure proper Firestore rules are set

3. **Email Service Errors**:
   - Verify EmailJS configuration
   - Check email template IDs and service IDs
   - Ensure EmailJS account is active

4. **Frontend Build Errors**:
   - Clear node_modules and reinstall dependencies
   - Check for TypeScript compilation errors
   - Verify all environment variables are set

### Debug Mode

Enable debug logging by setting:
```bash
export DEBUG=true
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: collabup4@gmail.com
- Use the in-app chatbot for instant help
- Check the API documentation at `/docs` when backend is running

## 🔄 Updates and Maintenance

- Regularly update dependencies for security patches
- Monitor Firebase usage and costs
- Backup Firestore data regularly
- Update EmailJS templates as needed

---


**CollabUp** - Empowering students to connect, collaborate, and grow together! 🚀
=======
**CollabUp** - Empowering students to connect, collaborate, and grow together! 🚀 
