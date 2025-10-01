import { Request, Response, NextFunction } from "express";
import { verifyIdToken } from "../firebase";

export interface AuthedReq extends Request {
  user?: { uid: string; email?: string | null; emailVerified?: boolean };
}

export async function requireSession(req: any, res: any, next: any) {
    const token = req.cookies?.session;     // must match 'session'
    if (!token) return res.status(401).json({ error: "no_session" });
    try {
      const decoded = await verifyIdToken(token);
      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ error: "invalid_session" });
    }
  }