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

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error('Firebase init error:', error.message || error);
}

export { auth, db };
export default app;
