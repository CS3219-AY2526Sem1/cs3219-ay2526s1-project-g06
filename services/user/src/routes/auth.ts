import { Router, Request } from "express";
import axios from "axios";
import User from "../models/User";
import { auth as firebaseAuth } from "../firebase";

const router = Router();
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4000';

// Helper function to verify session
async function verifySession(req: Request): Promise<any> {
  try {
    const sessionCookie = req.cookies?.session;
    
    if (!sessionCookie) {
      throw new Error("No session cookie");
    }

    const response = await axios.post(
      `${AUTH_SERVICE_URL}/auth/verify`,
      { sessionToken: sessionCookie }
    );

    if (response.data.authenticated) {
      return response.data.user;
    } else {
      throw new Error("Not authenticated");
    }
  } catch (error) {
    throw new Error("Authentication failed");
  }
}

// Create Session
router.post("/session", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      console.error('User Service: No idToken in request');
      return res.status(400).json({ error: "ID token required" });
    }

    console.log('User Service: Creating session via auth service...');
    console.log('User Service: idToken length:', idToken.length);

    // First, verify the ID token to get the user's UID
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);

    // Check if user exists in MongoDB and sync custom claims BEFORE creating session
    const existingUserCheck = await User.findOne({ uid: decodedToken.uid });
    if (existingUserCheck) {
      console.log('User Service: Syncing profileCompleted to Firebase BEFORE session creation');
      try {
        await firebaseAuth.setCustomUserClaims(decodedToken.uid, {
          profileCompleted: existingUserCheck.profileCompleted,
          bio: existingUserCheck.bio,
          language: existingUserCheck.language
        });
        console.log('User Service: Custom claims synced');
      } catch (error: any) {
        console.error('User Service: Failed to sync custom claims:', error.message);
      }
    }

    // Call auth service to create session
    const authResponse = await axios.post(
      `${AUTH_SERVICE_URL}/auth/session`,
      { idToken },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ User Service: Session created by auth service');

    // Get user data from auth service response
    const decodedUser = authResponse.data.user;
    
    console.log('🔍 User Service: Received user data:', {
      uid: decodedUser.uid,
      email: decodedUser.email,
      displayName: decodedUser.displayName,
      photoURL: decodedUser.photoURL ? 'Present' : 'Missing'
    });

    // Check if user already exists
    const existingUser = await User.findOne({ uid: decodedUser.uid });

    if (existingUser) {
      console.log('User Service: User exists, updating photoURL only');

      const updateData: any = {
        updatedAt: new Date()
      };

      if (decodedUser.photoURL && decodedUser.photoURL !== existingUser.photoURL) {
        updateData.photoURL = decodedUser.photoURL;
        console.log('User Service: Updating photoURL');
      }

      const user = await User.findOneAndUpdate(
        { uid: decodedUser.uid },
        { $set: updateData },
        { new: true }
      );

      console.log('User Service: Existing user session established');

      // Set session cookie
      const sessionToken = authResponse.data.sessionToken;
      res.cookie("session", sessionToken, {
        maxAge: 60 * 60 * 24 * 5 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      return res.json({
        user: {
          sub: user!.uid,
          email: user!.email,
          displayName: user!.displayName, 
          photoURL: user!.photoURL,
          role: user!.role,
          bio: user!.bio,
          language: user!.language,
          profileCompleted: user!.profileCompleted
        }
      });
    }

    // User doesn't exist - create new user with Firebase display name as initial value
    console.log('User Service: Creating new user');
    
    const user = await User.create({
      uid: decodedUser.uid,
      email: decodedUser.email,
      displayName: decodedUser.displayName || null, 
      photoURL: decodedUser.photoURL || null,
      role: 'user',
      profileCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('User Service: New user created');

    // Set session cookie
    const sessionToken = authResponse.data.sessionToken;
    res.cookie("session", sessionToken, {
      maxAge: 60 * 60 * 24 * 5 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({
      user: {
        sub: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        bio: user.bio,
        language: user.language,
        profileCompleted: user.profileCompleted
      }
    });
  } catch (error: any) {
    console.error('User Service: Session creation error:', error.message);
    
    if (error.response) {
      console.error('User Service: Auth service response:', error.response.data);
    }
    
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Get current user
router.get("/me", async (req, res) => {
  try {
    const verifiedUser = await verifySession(req);
    
    const user = await User.findOne({ uid: verifiedUser.uid });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        sub: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        bio: user.bio,
        language: user.language,
        profileCompleted: user.profileCompleted
      }
    });
  } catch (error: any) {
    console.error('Get user error:', error.message);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Update profile
router.put("/profile", async (req, res) => {
  try {
    const verifiedUser = await verifySession(req);
    
    const { displayName, bio, language } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { uid: verifiedUser.uid },
      {
        displayName: displayName?.trim(),
        bio: bio?.trim(),
        language: language?.trim(),
        profileCompleted: true
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    try {
      await firebaseAuth.setCustomUserClaims(verifiedUser.uid, {
        profileCompleted: true,
        bio: updatedUser.bio,
        language: updatedUser.language
      });
      console.log('User Service: Synced profileCompleted to Firebase custom claims');
    } catch (error: any) {
      console.error('User Service: Failed to sync custom claims:', error.message);
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
  } catch (error: any) {
    console.error('Profile update error:', error.message);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    const sessionCookie = req.cookies.session;
    
    await axios.post(
      `${AUTH_SERVICE_URL}/auth/revoke`,
      { sessionToken: sessionCookie }
    );

    res.clearCookie("session");
    res.json({ success: true });
  } catch (error) {
    res.clearCookie("session");
    res.json({ success: true });
  }
});

// Delete account 
router.delete("/account", async (req, res) => {
  try {
    // Verify session with auth service
    const verifiedUser = await verifySession(req);
    
    console.log('User Service: Deleting account for:', verifiedUser.uid);

    // Delete user from MongoDB
    const deletedUser = await User.findOneAndDelete({ uid: verifiedUser.uid });
    
    if (!deletedUser) {
      console.warn('User Service: User not found in database:', verifiedUser.uid);
    } else {
      console.log('User Service: User deleted from database');
    }

    // Delete user from Firebase
    try {
      await firebaseAuth.deleteUser(verifiedUser.uid);
      console.log('User Service: User deleted from Firebase');
    } catch (firebaseError: any) {
      console.error('User Service: Failed to delete from Firebase:', firebaseError.message);
    }

    // Revoke session 
    try {
      const sessionCookie = req.cookies.session;
      await axios.post(
        `${AUTH_SERVICE_URL}/auth/revoke`,
        { sessionToken: sessionCookie },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('User Service: Session revoked');
    } catch (error) {
      console.error('User Service: Failed to revoke session:', error);
    }

    // Clear session cookie
    res.clearCookie("session");
    
    res.json({ 
      message: "Account deleted successfully" 
    });
  } catch (error: any) {
    console.error('User Service: Account deletion error:', error.message);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

export default router;