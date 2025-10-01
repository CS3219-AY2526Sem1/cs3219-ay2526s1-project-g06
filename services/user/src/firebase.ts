import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";

let app: admin.app.App | undefined;

export function initAdmin() {
    if (!admin.apps.length) {
      // Uses GOOGLE_APPLICATION_CREDENTIALS or GCP metadata if available
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log(
        "[firebase-admin] initialized with applicationDefault()",
        process.env.GOOGLE_APPLICATION_CREDENTIALS ? "(GOOGLE_APPLICATION_CREDENTIALS set)" : ""
      );
    }
    return admin.app();
  }
  
  export function adminAuth() {
    return admin.auth(initAdmin());
  }
  
  export function verifyIdToken(idToken: string) {
    return adminAuth().verifyIdToken(idToken);
  }