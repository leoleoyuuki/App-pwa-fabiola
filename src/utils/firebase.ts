import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, indexedDBLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCxGXJGatawenCk4SR1SVMrJ7TUzYDR6ew",
  authDomain: "vistoriapro-pericia-2026.firebaseapp.com",
  projectId: "vistoriapro-pericia-2026",
  storageBucket: "vistoriapro-pericia-2026.firebasestorage.app",
  messagingSenderId: "742059668398",
  appId: "1:742059668398:web:89fcee1c3f67dc5c9c8e3f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Enable IndexedDB local persistence explicitly for robust offline-first session caching
setPersistence(auth, indexedDBLocalPersistence).catch((err) => {
  console.error("Error setting Firebase Auth persistence:", err);
});
