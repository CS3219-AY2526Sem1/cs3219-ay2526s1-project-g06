import {Request, Response, NextFunction} from 'express';
import axios from 'axios';

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

export async function checkAdmin(
    req: Request,
    res: Response, 
    next: NextFunction  
) {
    try {
        // verify user to get role data
        const user = await verifySession(req);

        // check role 
        if (user.role !== 'admin') {
            return res.status(403).json({
                error: "Admin role is needed to access this question service endpoint",
                message: "You must be an admin to create, update or delete data"
            });
        }

        next();
    } catch (error: any) {
        console.error('User auth middleware failed: ', error.message);
        return res.status(401).json({
            error: "Unauthorized user",
            message: error.message
        });
    }
}