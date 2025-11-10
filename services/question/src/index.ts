import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import {Question} from "./models/question";
import {sampleQuestions} from "./seed/sampleQuestions";
import {questionMainRouter} from "./routes/questionMainRouter";

dotenv.config();

const questionApp = express();

// Configure CORS based on environment
const corsOptions = {
  credentials: true,
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean | string | string[]) => void) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        process.env.CORS_ORIGIN,
        'https://d34n3c7d9pxc7j.cloudfront.net'
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

questionApp.use(cors(corsOptions));
questionApp.use(cookieParser());
questionApp.use(express.json());

// general health check
questionApp.get("/health", (req, res) => {
    res.json({ status: "ok", service: "question" });
  });

async function connectToMongoDB() {
    try {
        await mongoose.connect(process.env.MONGO_URL as string);
        console.log("Successfully connected to MongoDB");
        const dbCount = await Question.countDocuments();
        if (dbCount === 0) {
            await seedEmptyDb();
        } else {
            console.log(`DB has ${dbCount} questions`)
        }
    } catch (error) {
        console.error("Failed to connect to MongoDB, question service shutting down");
        process.exit(1);
    }
}

// TODO: Proper seeding from open source
async function seedEmptyDb() {
    try {
        console.log("DB is empty, seeding with sample questions...");
        await Question.insertMany(sampleQuestions);
        console.log(`DB was successfully seeded, the DB now has ${sampleQuestions.length} questions`);
    } catch (error) {
        console.error("Failed to seed DB: ", error);
    }
}

connectToMongoDB();

questionApp.use("/api/question_service", questionMainRouter);

const PORT = Number(process.env.PORT) || 4003;
questionApp.listen(PORT, "0.0.0.0", () => {
    console.log(`Question service running on http://localhost:${PORT}`);
  });