import "dotenv/config";
import express, { Request, Response } from "express";
import mongoose from "mongoose"; 
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

import { authRouter } from "./routes/auth";

async function main() {
  // Connect to MongoDB Atlas
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    console.error("❌ MONGO_URL environment variable is required");
    process.exit(1);
  }
  
  try {
    await mongoose.connect(mongoUrl);
    console.log("✅ Connected to MongoDB Atlas");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }

  const app = express();

  app.use(helmet());
  app.use(morgan("dev"));

  // Configure CORS based on environment
  const corsOptions = {
    credentials: true,
    origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean | string | string[]) => void) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);

      // In production, use the configured CORS_ORIGIN
      if (process.env.NODE_ENV === 'production') {
        const allowedOrigins = [
          process.env.CORS_ORIGIN, // CloudFront URL
          'https://d34n3c7d9pxc7j.cloudfront.net' // Hardcoded fallback
        ].filter(Boolean);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`⚠️ CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        // In development, allow common local origins
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:5174',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:5174'
        ];

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`⚠️ CORS blocked origin in dev: ${origin}`);
          callback(null, true); // Be permissive in dev
        }
      }
    }
  };

  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/healthz", (_req: Request, res: Response) =>
    res.json({ ok: true, service: "user" })
  );

  app.use("/auth", authRouter);

  const port = Number(process.env.PORT) || 4001;
  app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 User service v1.0.2 running on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});