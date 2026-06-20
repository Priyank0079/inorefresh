import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase configuration — must match firebase-messaging-sw.js and the backend
// Admin SDK (both use the dhakadsnazzy2 project). Hardcoded values are used as
// the source of truth so a misconfigured server env cannot cause a project mismatch.
const firebaseConfig = {
  apiKey:            'AIzaSyDdzURk5KJykQwmtUdOg-Lbdj4HjUT9G8g',
  authDomain:        'dhakadsnazzy2.firebaseapp.com',
  projectId:         'dhakadsnazzy2',
  storageBucket:     'dhakadsnazzy2.firebasestorage.app',
  messagingSenderId: '88524532800',
  appId:             '1:88524532800:web:347183dc062e619a48c3a5',
  measurementId:     'G-GCPBFW3F1B',
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// Initialize Firebase Cloud Messaging
let messaging: any = null;

if (app) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn("Firebase Messaging not supported in this browser:", error);
  }
}

export { messaging, getToken, onMessage };
export default app;
