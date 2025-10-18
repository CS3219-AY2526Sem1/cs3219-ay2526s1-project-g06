import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";

export interface AuthedReq extends Request {
  user?: { 
    uid: string; 
    email?: string; 
    displayName?: string;
    role?: string;
    bio?: string;
    language?: string;
    profileCompleted?: boolean;
  };
}

// Initialize Firebase Admin (if not already done)
function initFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      const serviceAccount = JSON.parse(process.env.FB_SERVICE_ACCOUNT_JSON!);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin:', error);
      throw error;
    }
  }
  return admin.auth();
}

export async function requireSession(req: any, res: any, next: any) {
  const token = req.cookies?.session;
  
  if (!token) {
    return res.status(401).json({ error: "no_session" });
  }
  
  try {
    const auth = initFirebaseAdmin();
    const decoded = await auth.verifyIdToken(token);
    
    // Basic user info from Firebase token
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      displayName: decoded.name,
      role: decoded.role || 'user',
      // Add other fields from token custom claims if available
      bio: decoded.bio,
      language: decoded.language,
      profileCompleted: decoded.profileCompleted
    };
    
    console.log(`✅ Session verified for user: ${req.user.uid}`);
    next();
  } catch (error) {
    console.error('❌ Session verification failed:', error);
    res.clearCookie('session');
    return res.status(401).json({ error: "session_expired" });
  }
}