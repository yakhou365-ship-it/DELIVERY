import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDu4Kw0qfhIAWMpaiX_ODO-rxT-2KWOkJ0",
  authDomain: "delivery-app-ae74f.firebaseapp.com",
  projectId: "delivery-app-ae74f",
  storageBucket: "delivery-app-ae74f.firebasestorage.app",
  messagingSenderId: "930540680488",
  appId: "1:930540680488:web:8218c320a3369f25334c1d",
};

let app = null;
let auth = null;
let db = null;
let initError = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  initError = error.message || error.toString();
  console.error('Firebase init error:', initError);
}

// Safe getter - throws a clear error if Firebase failed to initialize
export const requireAuth = () => {
  if (!auth) {
    throw new Error(
      initError
        ? `فشل تهيئة Firebase: ${initError}. تحقق من اتصالك بالإنترنت.`
        : 'Firebase Auth غير متوفر. تحقق من اتصالك بالإنترنت وأعد تشغيل التطبيق.'
    );
  }
  return auth;
};

export const requireDb = () => {
  if (!db) {
    throw new Error(
      initError
        ? `فشل تهيئة Firestore: ${initError}. تحقق من اتصالك بالإنترنت.`
        : 'Firebase Firestore غير متوفر. تحقق من اتصالك بالإنترنت.'
    );
  }
  return db;
};

export { auth, db };
export default app;