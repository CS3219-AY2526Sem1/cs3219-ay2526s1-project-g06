import { Router } from "express";
import { verifyIdToken } from "../firebase";
import User from "../models/User"; // Add this import

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
    
    // Save/update user in MongoDB on each login
    const user = await User.upsertFromAuth({
      uid: decoded.uid,
      email: decoded.email,
      displayName: decoded.name,
      photoURL: decoded.picture,
    });
    
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
        email: decoded.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        bio: user.bio,
        language: user.language,
        profileCompleted: user.profileCompleted
      } 
    });
  } catch (error) {
    console.error('Session creation failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// NEW ENDPOINT: Update user profile
router.put("/profile", async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing_id_token' });
  }

  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decoded = await verifyIdToken(token);
    const { displayName, bio, language } = req.body;
    
    // Validate input
    if (bio && bio.length > 500) {
      return res.status(400).json({ error: 'Bio must be 500 characters or less' });
    }
    
    const updatedUser = await User.updateProfile(decoded.uid, {
      displayName,
      bio,
      language
    });
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        sub: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        photoURL: updatedUser.photoURL,
        role: updatedUser.role,
        bio: updatedUser.bio,
        language: updatedUser.language,
        profileCompleted: updatedUser.profileCompleted
      }
    });
  } catch (error) {
    console.error('Profile update failed:', error);
    res.status(500).json({ error: 'Profile update failed' });
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