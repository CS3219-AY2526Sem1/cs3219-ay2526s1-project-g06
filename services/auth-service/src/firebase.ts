import admin from "firebase-admin";
import * as dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin
const serviceAccount = require("../creds/serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const auth = admin.auth();
export default admin;