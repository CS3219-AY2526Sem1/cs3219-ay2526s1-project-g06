import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import {Question} from "./models/question";
import {sampleQuestions} from "./seed/sampleQuestions";
import {questionMainRouter} from "./routes/questionMainRouter";

dotenv.config();

const questionApp = express();

questionApp.use(cors({ 
    origin: process.env.CORS_ORIGIN || "http://localhost:5173", 
    credentials: true,
}));

questionApp.use(express.json());

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