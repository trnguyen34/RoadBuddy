// firebase-config.js

// Import the functions you need from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBd4XkPoarNwcdyevtpyKRJfkskyU0duT4",
  authDomain: "roadbuddy-4edc7.firebaseapp.com",
  projectId: "roadbuddy-4edc7",
  storageBucket: "roadbuddy-4edc7.firebasestorage.app",
  messagingSenderId: "217816938704",
  appId: "1:217816938704:web:f8632ee3ed001716c886d5",
  measurementId: "G-KTRN6PKGT9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { app, auth, provider, db };