// src/firebase.js

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCPzFUxkuYFr3C0epV4pz9zZum5o956HGo",
  authDomain: "disrupt-53691.firebaseapp.com",
  projectId: "disrupt-53691",
  storageBucket: "disrupt-53691.firebasestorage.app",
  messagingSenderId: "353975939726",
  appId: "1:353975939726:web:071e333a4261a89b9f4fdf",
  measurementId: "G-YMS8PD71PW",
};

// Check if a Firebase app has already been initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services and export them
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { app, auth, db, storage, analytics };