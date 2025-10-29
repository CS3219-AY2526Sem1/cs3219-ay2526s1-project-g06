import admin from "firebase-admin";
import * as dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  // Production: Use environment variable
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log('🔥 Firebase: Using credentials from environment variable');
  } catch (error) {
    console.error('❌ Firebase: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', error);
    throw error;
  }
} else {
  // Development: Use local file
  try {
    serviceAccount = require("../creds/serviceAccount.json");
    console.log('🔥 Firebase: Using credentials from local file');
  } catch (error) {
    console.error('❌ Firebase: Failed to load serviceAccount.json file:', error);
    throw error;
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log('✅ Firebase Admin initialized successfully');

export const auth = admin.auth();
export default admin;