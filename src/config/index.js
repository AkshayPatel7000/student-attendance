// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBNWzujSvKlxIYchNObDWYnlW_hidN5Ois",
  authDomain: "student-attendance-7eca8.firebaseapp.com",
  projectId: "student-attendance-7eca8",
  storageBucket: "student-attendance-7eca8.firebasestorage.app",
  messagingSenderId: "474887289472",
  appId: "1:474887289472:web:76a69809fb2b21653b4465",
  measurementId: "G-WPTW34SVF5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export { app, auth, db, provider };
export default firebaseConfig;
