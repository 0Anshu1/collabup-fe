import { auth } from '../firebase/firebaseConfig';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

function assertBackendUrl() {
  if (!BACKEND_URL) {
    throw new Error('VITE_BACKEND_URL is not set. Please set it to your Cloud Run backend URL.');
  }
}

export async function uploadViaSignedUrl(objectPath: string, file: File): Promise<void> {
  assertBackendUrl();
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();

  const res = await fetch(`${BACKEND_URL}/signed-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ objectPath, contentType: file.type }),
  });
  if (!res.ok) throw new Error(`Signed URL request failed: ${res.status}`);
  const { url } = await res.json();

  const putRes = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!putRes.ok) throw new Error(`Upload failed: ${putRes.status}`);
}

export async function getSignedReadUrl(objectPath: string): Promise<string> {
  assertBackendUrl();
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();

  const res = await fetch(`${BACKEND_URL}/signed-url-read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ objectPath }),
  });
  if (!res.ok) throw new Error(`Signed read URL request failed: ${res.status}`);
  const { url } = await res.json();
  return url as string;
}

export function buildProfileObjectPath(role: string, uid: string, originalName: string): string {
  const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const ts = Date.now();
  switch (role) {
    case 'student':
      return `users/students/${uid}/profile/${ts}_${safeName}`;
    case 'faculty':
      return `users/faculty/${uid}/profile/${ts}_${safeName}`;
    case 'mentor':
      return `users/mentors/${uid}/profile/${ts}_${safeName}`;
    case 'admin':
      return `users/admins/${uid}/profile/${ts}_${safeName}`;
    default:
      return `users/${uid}/profile/${ts}_${safeName}`;
  }
}


