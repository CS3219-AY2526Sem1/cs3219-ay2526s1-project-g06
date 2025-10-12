import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";

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
    } catch (error) {
        console.error("Failed to connect to MongoDB, user service shutting down");
        process.exit(1);
    }
}

connectToMongoDB();

const PORT = Number(process.env.PORT) || 4003;
questionApp.listen(PORT, "0.0.0.0", () => {
    console.log(`Question service running on http://localhost:${PORT}`);
  });

// create

// read

// update

// delete 

