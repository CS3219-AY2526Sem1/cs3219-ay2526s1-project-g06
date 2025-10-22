import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as dotenv from "dotenv";
import { auth } from "./firebase";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware - Environment-based
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN  // Production URLs
    : true,  // Allow all in development
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Auth service is running" });
});

// ============================================
// VERIFY SESSION - Called by other services
// ============================================
app.post("/auth/verify", async (req, res) => {
  try {
    // Accept session from cookie or body
    const sessionCookie = req.cookies.session || req.body.sessionToken;
    
    if (!sessionCookie) {
      return res.status(401).json({ 
        authenticated: false,
        error: "No session token provided" 
      });
    }

    console.log('🔍 Auth Service: Verifying session token...');

    // Verify the session cookie with Firebase
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    console.log('✅ Auth Service: Token verified for user:', decodedClaims.uid);

    // Return verified user info
    res.json({
        authenticated: true,
        user: {
            uid: decodedClaims.uid,
            email: decodedClaims.email,
            role: decodedClaims.role || 'user',
            // Spread operator adds any additional claims (but uid/email already set above)
            // Filter out uid and email to avoid duplication
            ...(Object.keys(decodedClaims).reduce((acc, key) => {
      if (key !== 'uid' && key !== 'email' && key !== 'role') {
        acc[key] = decodedClaims[key];
      }
      return acc;
    }, {} as Record<string, any>))
  }
});
  } catch (error: any) {
    console.error('❌ Auth Service: Token verification failed:', error.message);
    res.status(401).json({ 
      authenticated: false,
      error: "Invalid or expired session" 
    });
  }
});

// CREATE SESSION
app.post("/auth/session", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      console.error('❌ Auth Service: No idToken in request body');
      return res.status(400).json({ error: "ID token required" });
    }

    console.log('🔍 Auth Service: Creating session from ID token...');

    const decodedToken = await auth.verifyIdToken(idToken);
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    console.log('✅ Auth Service: Session created for user:', decodedToken.uid);

    // ALWAYS fetch full user data from Firebase - don't rely on token claims
    let displayName = null;
    let photoURL = null;
    let email = decodedToken.email;

    try {
      console.log('🔍 Auth Service: Fetching full user record from Firebase...');
      const userRecord = await auth.getUser(decodedToken.uid);
      
      displayName = userRecord.displayName || decodedToken.name || null;
      email = userRecord.email || decodedToken.email;
      photoURL = userRecord.photoURL || decodedToken.picture || null;
      
      // Fix Google photo URL - ensure proper size
      if (photoURL && photoURL.includes('googleusercontent.com')) {
        const baseUrl = photoURL.split('=')[0];
        photoURL = `${baseUrl}=s400-c`;
      }
      
      console.log('✅ Auth Service: User data fetched:', {
        uid: userRecord.uid,
        email: email,
        displayName: displayName,
        photoURL: photoURL ? 'Present' : 'Missing'
      });
    } catch (error: any) {
      console.error('⚠️ Auth Service: Failed to fetch full user data:', error.message);
      // Fallback to token claims if Firebase fetch fails
      displayName = decodedToken.name || null;
      photoURL = decodedToken.picture || null;
      
      if (photoURL && photoURL.includes('googleusercontent.com')) {
        const baseUrl = photoURL.split('=')[0];
        photoURL = `${baseUrl}=s400-c`;
      }
    }

    res.cookie("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({ 
      success: true,
      sessionToken: sessionCookie,
      user: {
        uid: decodedToken.uid,
        email: email,
        displayName: displayName,
        photoURL: photoURL
      }
    });
  } catch (error: any) {
    console.error('❌ Auth Service: Session creation failed:', error.message);
    res.status(401).json({ error: "Invalid ID token", details: error.message });
  }
});

// REVOKE SESSION
app.post("/auth/revoke", async (req, res) => {
  try {
    const sessionCookie = req.cookies.session || req.body.sessionToken;
    
    if (sessionCookie) {
      console.log('🔍 Auth Service: Revoking session...');
      const decodedClaims = await auth.verifySessionCookie(sessionCookie);
      await auth.revokeRefreshTokens(decodedClaims.uid);
      console.log('✅ Auth Service: Session revoked for user:', decodedClaims.uid);
    }

    res.clearCookie("session");
    res.json({ success: true });
  } catch (error: any) {
    console.error('⚠️ Auth Service: Session revocation failed:', error.message);
    res.clearCookie("session");
    res.json({ success: true });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Auth service running on port ${PORT}`);
});