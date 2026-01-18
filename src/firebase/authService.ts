import { auth } from './firebaseConfig';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    // The signed-in user info.
    const user = result.user;
    // You can also access additional user info here if needed
    return user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};
