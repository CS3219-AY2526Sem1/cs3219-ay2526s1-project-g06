import "dotenv/config";
import express, { Request, Response } from "express";
import mongoose from "mongoose"; 
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

import { authRouter } from "./routes/auth";
import { requireSession, AuthedReq } from "./mw/requireSession";

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
  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/healthz", (_req: Request, res: Response) =>
    res.json({ ok: true, service: "user" })
  );

  app.use("/auth", authRouter);

  app.get("/auth/me", requireSession, (req: AuthedReq, res: Response) => {
    res.json({ user: req.user });
  });

  const port = Number(process.env.PORT) || 4001;
  app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 User service running on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});