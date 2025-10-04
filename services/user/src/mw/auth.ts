import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthedReq extends Request {
  user?: { sub: string; email: string };
}

export function requireAuth(req: AuthedReq, res: Response, next: NextFunction) {
  const token = req.cookies?.pp_at;
  if (!token) return res.status(401).json({ error: "unauthenticated" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as any;
    next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}