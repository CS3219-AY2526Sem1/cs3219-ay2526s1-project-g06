import { Router } from "express";
import { verifyIdToken } from "../firebase";
import User from "../models/User"; 
import admin from "firebase-admin";
import { requireSession } from "../mw/requireSession";

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

    console.log('✅ Session created for user:', {
      uid: user.uid,
      email: user.email,
      profileCompleted: user.profileCompleted,
      type: typeof user.profileCompleted
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

router.get("/me", requireSession, (req: any, res) => {
  console.log('GET /auth/me called, user data:', req.user); // Debug log
  res.json({ user: req.user });
});

// Update user profile
router.put("/profile", requireSession, async (req: any, res) => {
  try {
    const { displayName, bio, language } = req.body;
    
    // Validate input
    if (bio && bio.length > 500) {
      return res.status(400).json({ error: 'Bio must be 500 characters or less' });
    }
    
    // Use session user ID instead of token
    const updatedUser = await User.updateProfile(req.user.uid, {
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
router.post("/logout", requireSession, (req, res) => {
  res.clearCookie('session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({ success: true });
});

router.delete("/account", requireSession, async (req: any, res) => {
  try {
    const userId = req.user.uid; // Get from session, not token
    
    // Delete from MongoDB first
    const deletedUser = await User.findOneAndDelete({ uid: userId });
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    // Delete from Firebase Auth
    await admin.auth().deleteUser(userId);

    // Clear session cookie
    res.clearCookie('session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    console.log(`✅ User ${userId} deleted from both Firebase and MongoDB`);
    res.json({ message: 'Account deleted successfully' });
    
  } catch (error: any) {
    console.error('Account deletion failed:', error);

    if (error.code === 'auth/user-not-found') {
      return res.json({ message: 'Account deleted (user not found in Firebase)' });
    }

    res.status(500).json({ error: 'Account deletion failed' });
  }
});

// Internal endpoint for other services to verify sessions
router.post("/verify-session", requireSession, (req: any, res) => {
  console.log('🔍 Session verification called for user:', req.user.uid);
  
  // This endpoint is only called by other backend services
  res.json({ 
    valid: true, 
    user: {
      uid: req.user.uid,
      email: req.user.email,
      displayName: req.user.displayName,
      photoURL: req.user.photoURL,
      role: req.user.role,
      bio: req.user.bio,
      language: req.user.language,
      profileCompleted: req.user.profileCompleted
    }
  });
});

export { router as authRouter };