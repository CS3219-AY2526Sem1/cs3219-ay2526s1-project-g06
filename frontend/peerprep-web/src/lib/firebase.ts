import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
};

let fbApp: FirebaseApp | null = null;
let fbAuth: Auth | null = null;

export function getFirebaseApp() {
  if (!fbApp) {
    fbApp = initializeApp(firebaseConfig);
  }
  return fbApp;
}

export function getFirebaseAuth() {
  if (!fbAuth) {
    fbAuth = getAuth(getFirebaseApp());
  }
  return fbAuth;
}