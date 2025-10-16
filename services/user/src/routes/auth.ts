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
    
    // Set the Firebase token as session cookie
    res.cookie('session', token, {
      httpOnly: true,
      secure: true, // Always use secure for cross-site cookies
      sameSite: 'none', // Required for cross-site cookies
      partitioned: true, // Chrome's new requirement for third-party cookies
      maxAge: 60 * 60 * 1000 // 1 hour
    } as any); // 'as any' because TypeScript types don't have partitioned yet
    
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
    secure: true,
    sameSite: 'none'
  });
  res.json({ success: true });
});

router.delete("/account", async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing_id_token' });
  }

  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decoded = await verifyIdToken(token);
    const userId = decoded.uid;
    
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
      secure: true,
      sameSite: 'none'
    });

    console.log(`✅ User ${userId} deleted from both Firebase and MongoDB`);
    res.json({ message: 'Account deleted successfully' });
    
  } catch (error: any) {
    console.error('Account deletion failed:', error);

    // If Firebase deletion fails but MongoDB succeeded
    if (error.code === 'auth/user-not-found') {
      return res.json({ message: 'Account deleted (user not found in Firebase)' });
    }

    res.status(500).json({ error: 'Account deletion failed' });
  }
});

export { router as authRouter };