// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC96rT4-pmnJYBUY91fKcgctbtR0hxXgSU",
  authDomain: "authflow-ncba4.firebaseapp.com",
  projectId: "authflow-ncba4",
  storageBucket: "authflow-ncba4.firebasestorage.app",
  messagingSenderId: "482607285137",
  appId: "1:482607285137:web:c7b5497e775d4c13fd9030"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
