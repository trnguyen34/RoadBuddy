import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, 
         GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const db = getFirestore(app);

export { auth, provider, db };