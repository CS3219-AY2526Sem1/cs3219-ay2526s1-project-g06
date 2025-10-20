import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";

let app: admin.app.App | undefined;

export function initAdmin() {
    if (!admin.apps.length) {
      // Try to use inline JSON credentials first, fallback to applicationDefault
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

      if (serviceAccountJson) {
        try {
          const serviceAccount = JSON.parse(serviceAccountJson);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          console.log("[firebase-admin] initialized with inline service account JSON");
        } catch (error) {
          console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", error);
          throw error;
        }
      } else {
        // Uses GOOGLE_APPLICATION_CREDENTIALS or GCP metadata if available
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
        console.log(
          "[firebase-admin] initialized with applicationDefault()",
          process.env.GOOGLE_APPLICATION_CREDENTIALS ? "(GOOGLE_APPLICATION_CREDENTIALS set)" : ""
        );
      }
    }
    return admin.app();
  }
  
  export function adminAuth() {
    return admin.auth(initAdmin());
  }
  
  export function verifyIdToken(idToken: string) {
    return adminAuth().verifyIdToken(idToken);
  }