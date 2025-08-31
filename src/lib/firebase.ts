import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCmZ0hNd5BzujSIj9bH1xfB0bG-x5xuV4A",
  authDomain: "tiffintrail-c98c2.firebaseapp.com",
  projectId: "tiffintrail-c98c2",
  storageBucket: "tiffintrail-c98c2.firebasestorage.app",
  messagingSenderId: "515247991697",
  appId: "1:515247991697:web:8b84a40ab54d05bc9a4830",
  measurementId: "G-BWD2YNHJHB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
