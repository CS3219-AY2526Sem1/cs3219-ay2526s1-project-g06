import { Router } from "express";
import { verifyIdToken } from "../firebase";

const router = Router();

// Create session after Firebase auth
router.post("/session", async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(400).json({ error: 'missing_id_token' });
  }

  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decoded = await verifyIdToken(token);
    
    // Set the Firebase token as session cookie
    res.cookie('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000 // 1 hour
    });
    
    res.json({ 
      user: { 
        sub: decoded.uid, 
        email: decoded.email 
      } 
    });
  } catch (error) {
    console.error('Session creation failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout endpoint
router.post("/logout", (req, res) => {
  res.clearCookie('session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({ success: true });
});

export { router as authRouter };