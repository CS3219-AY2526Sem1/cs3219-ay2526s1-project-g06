import { Request, Response, NextFunction } from "express";
import { verifyIdToken } from "../firebase";
import User from "../models/User";

export interface AuthedReq extends Request {
  user?: { uid: string; email?: string | null; emailVerified?: boolean };
}

export async function requireSession(req: any, res: any, next: any) {
  const token = req.cookies?.session;

  // Debug logging for troubleshooting
  console.log('🔍 requireSession - Cookies:', Object.keys(req.cookies || {}));
  console.log('🔍 requireSession - Session cookie exists:', !!token);
  console.log('🔍 requireSession - Request path:', req.path);

  if (!token) return res.status(401).json({ error: "no_session" });
  
  try {
    const decoded = await verifyIdToken(token);
    
    // Get full user data from MongoDB (including displayName, bio, etc.)
    let user = await User.findOne({ uid: decoded.uid });
    
    if (!user) {
      // If user doesn't exist in MongoDB, create them
      console.log(`Creating user in MongoDB: ${decoded.uid}`);
      user = await User.create({
        uid: decoded.uid,
        email: decoded.email || `${decoded.uid}@unknown.com`,
        displayName: decoded.name,
        photoURL: decoded.picture,
        role: 'user',
        profileCompleted: false, // Explicitly set to false
      });
    } 

      req.user = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: user.role,
      bio: user.bio,
      language: user.language,
      profileCompleted: user.profileCompleted ?? false // Ensure it's never undefined
    };
    
    console.log(`✅ Session verified for user: ${req.user.uid}, profileCompleted: ${req.user.profileCompleted}`);
    next();
  } catch (error) {
    res.clearCookie('session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as any,
      path: '/'
    });
    return res.status(401).json({ error: "session_expired" });
  }
}