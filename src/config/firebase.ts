import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCsv0OIZJSoodJSGZFkK3eTlW6x8gJZTcM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "email-threat-analysis.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "email-threat-analysis",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "email-threat-analysis.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "859748199655",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:859748199655:web:7d9078c874c8c0d8d18642",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-Y5ZZDHE8MS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (only in production)
export const analytics = typeof window !== 'undefined' && import.meta.env.PROD 
  ? getAnalytics(app) 
  : null;

// Connect to emulators in development (disabled for phone auth)
// Note: Phone authentication requires real Firebase services, not emulators
if (import.meta.env.DEV && false) { // Disabled for phone auth
  try {
    // Only connect if not already connected
    if (!auth.emulatorConfig) {
      connectAuthEmulator(auth, "http://localhost:9099");
    }
    if (!(db as any)._delegate._settings?.host?.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
  } catch (error) {
    console.warn('Firebase emulators not available:', error);
  }
}

export default app;
