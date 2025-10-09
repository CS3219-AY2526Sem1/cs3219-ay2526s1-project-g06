import { Request, Response, NextFunction } from "express";
import { verifyIdToken } from "../firebase";

export interface AuthedReq extends Request {
  user?: { uid: string; email?: string | null; emailVerified?: boolean };
}

export async function requireSession(req: any, res: any, next: any) {
  const token = req.cookies?.session;
  if (!token) return res.status(401).json({ error: "no_session" });
  
  try {
    const decoded = await verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    console.log('Token verification failed:', error.message);
    
    // Clear the expired/invalid session cookie
    res.clearCookie('session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return res.status(401).json({ error: "session_expired" });
  }
}