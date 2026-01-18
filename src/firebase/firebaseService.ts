import { db } from './firebaseConfig';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

interface Project {
  id: number;
  title: string;
  imageUrl: string;
  domain: string;
  duration: string;
  level: string;
  skills: string[];
  company: string;
  location: string;
  matchScore: number;
  certificate: boolean;
  offeredBy: string;
  description: string; // <-- Add description here
}

interface ResearchProject {
  id: string;
  title: string;
  domain: string;
  description: string;
  facultyId: string;
  skills: string[];
  location: string;
  duration: string;
  level: string;
  certificate: boolean;
}

interface StudentProject {
  id: string;
  title: string;
  description: string;
  domain: string;
  level: string;
  technologies: string[];
  duration: string;
  coverUrl: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  location: string;
}

interface Faculty {
  id: string;
  fullName: string;
  email: string;
  instituteName: string;
  researchAreas: string[];
  spotsAvailable: number; // <-- Add spotsAvailable here
  startDate: string; // <-- Add startDate here
}

export const enrollInProject = async (enrollmentData: {
  userId: string;
  projectId: number;
  startDate: string;
  idCardUrl: string;
  resumeUrl: string;
}) => {
  try {
    await addDoc(collection(db, 'enrollments'), {
      ...enrollmentData,
      enrolledAt: new Date(),
      status: 'pending'
    });
  } catch (error) {
    console.error('Error enrolling in project:', error);
    throw error;
  }
};

export const getProjects = async (
  userRole?: string | null,
  userData?: { expertiseAreas?: string[]; researchAreas?: string[] } | null
): Promise<Project[]> => {
  try {
    let projectsQuery = query(collection(db, 'startupProjects'));
    if (userRole === 'mentor' && userData?.expertiseAreas) {
      projectsQuery = query(collection(db, 'startupProjects'), where('domain', 'in', userData.expertiseAreas));
    } else if (userRole === 'faculty' && userData?.researchAreas) {
      projectsQuery = query(collection(db, 'startupProjects'), where('domain', 'in', userData.researchAreas));
    }
    const querySnapshot = await getDocs(projectsQuery);
    return querySnapshot.docs.map((doc, index) => ({
      id: index + 1, // Convert to number as expected by component
      title: doc.data().title || '',
      imageUrl: doc.data().imageUrl || 'https://via.placeholder.com/256',
      domain: doc.data().domain || '',
      duration: doc.data().duration || '',
      level: doc.data().level || '',
      skills: doc.data().skills || [],
      company: doc.data().company || '',
      location: doc.data().location || '',
      matchScore: doc.data().matchScore || Math.floor(Math.random() * 20) + 80,
      certificate: doc.data().certificate || false,
      offeredBy: doc.data().offeredBy || '',
      description: doc.data().description || '', // <-- Add this line
    } as Project));
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

export const getResearchProjects = async (
  userRole: string | null,
  userData: { researchAreas?: string[] } | null
): Promise<ResearchProject[]> => {
  try {
    let projectsQuery = query(collection(db, 'researchProjects'));
    if (userRole === 'faculty' && userData?.researchAreas) {
      projectsQuery = query(collection(db, 'researchProjects'), where('domain', 'in', userData.researchAreas));
    }
    const querySnapshot = await getDocs(projectsQuery);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().title || '',
      domain: doc.data().domain || '',
      description: doc.data().description || '',
      facultyId: doc.data().facultyId || '',
      skills: doc.data().skills || [],
      location: doc.data().location || '',
      duration: doc.data().duration || '',
      level: doc.data().level || '',
      certificate: doc.data().certificate || false,
    } as ResearchProject));
  } catch (error) {
    console.error('Error fetching research projects:', error);
    throw error;
  }
};

export const getFaculties = async (): Promise<Faculty[]> => {
  try {
    // Fetch from 'users' collection where role is 'faculty'
    const facultyQuery = query(collection(db, 'users'), where('role', '==', 'faculty'));
    const querySnapshot = await getDocs(facultyQuery);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      fullName: doc.data().fullName || doc.data().name || 'Unknown',
      email: doc.data().email || '',
      instituteName: doc.data().instituteName || doc.data().institute || '',
      researchAreas: doc.data().researchAreas || doc.data().researchInterests || [],
      spotsAvailable: doc.data().spotsAvailable ?? 0,
      startDate: doc.data().startDate ?? '',
    } as Faculty));
  } catch (error) {
    console.error('Error fetching faculties:', error);
    throw error;
  }
};

export const getStudentProjects = async (): Promise<StudentProject[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'studentProjects'));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().title || '',
      description: doc.data().description || '',
      domain: doc.data().domain || '',
      level: doc.data().level || '',
      technologies: doc.data().technologies || [],
      duration: doc.data().duration || '',
      coverUrl: doc.data().coverUrl || '',
      ownerId: doc.data().ownerId || '',
      ownerEmail: doc.data().ownerEmail || '',
      ownerName: doc.data().ownerName || doc.data().fullName || '',
      location: doc.data().location || '',
    } as StudentProject));
  } catch (error) {
    console.error('Error fetching student projects:', error);
    throw error;
  }
};

export const addStudentProject = async (projectData: Omit<StudentProject, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'studentProjects'), {
      ...projectData,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding student project:', error);
    throw error;
  }
};
