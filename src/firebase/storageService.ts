import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from './firebaseConfig';

const storage = getStorage(app);

export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const uploadEnrollmentFiles = async (
  userId: string,
  projectId: number,
  idCard: File,
  resume: File
): Promise<{ idCardUrl: string; resumeUrl: string }> => {
  const timestamp = Date.now();
  const idCardPath = `enrollments/${userId}/${projectId}/idCard_${timestamp}`;
  const resumePath = `enrollments/${userId}/${projectId}/resume_${timestamp}`;

  try {
    const [idCardUrl, resumeUrl] = await Promise.all([
      uploadFile(idCard, idCardPath),
      uploadFile(resume, resumePath)
    ]);

    return { idCardUrl, resumeUrl };
  } catch (error) {
    console.error('Error uploading enrollment files:', error);
    throw error;
  }
};