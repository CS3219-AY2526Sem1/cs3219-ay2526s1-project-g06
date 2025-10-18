import { Request, Response, NextFunction } from "express";
import { verifyIdToken } from "../firebase";
import User from "../models/User";

export interface AuthedReq extends Request {
  user?: { uid: string; email?: string | null; emailVerified?: boolean };
}

export async function requireSession(req: any, res: any, next: any) {
  const token = req.cookies?.session;
  
  if (!token) return res.status(401).json({ error: "no_session" });
  
  try {
    const decoded = await verifyIdToken(token);
    
    // Get full user data from MongoDB (including displayName, bio, etc.)
    const user = await User.findOne({ uid: decoded.uid });
    
    if (user) {
      // Attach complete user data to request
      req.user = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        bio: user.bio,
        language: user.language,
        profileCompleted: user.profileCompleted
      };
    } else {
      // Fallback to Firebase data if no MongoDB user found
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        displayName: decoded.name
      };
    }
    
    next();
  } catch (error) {
    res.clearCookie('session');
    return res.status(401).json({ error: "session_expired" });
  }
}