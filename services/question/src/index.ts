import dotenv from "dotenv";
import express, {Request, Response} from "express";
import cors from "cors";
import mongoose from "mongoose";
import {Question} from "./models/question";
import {sampleQuestions} from "./seed/sampleQuestions";

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
        // seed mongoDB if empty 
        if (dbCount === 0) {
            await seedEmptyDb();
        } else {
            console.log(`DB has ${dbCount} questions`)
        }
    } catch (error) {
        console.error("Failed to connect to MongoDB, user service shutting down");
        process.exit(1);
    }
}

// to do proper seeding in the future from codeforces
async function seedEmptyDb() {
    try {
        console.log("DB is empty, seeding with sample questions...");
        await Question.insertMany(sampleQuestions);
        console.log(`DB was successfully seeded, the DB now has has ${sampleQuestions.length} questions`);
    } catch (error) {
        console.error("Failed to seed DB: ", error);
    }
}

connectToMongoDB();

const PORT = Number(process.env.PORT) || 4003;
questionApp.listen(PORT, "0.0.0.0", () => {
    console.log(`Question service running on http://localhost:${PORT}`);
  });

// create (admin)

// read (user + admin)
// read random qn (no topic or difficulty given)

// read random qn based on topic

// read random qn based on difficulty

// read random qn based on topic and difficulty
questionApp.get("/api/question_service/random/topic/:topic/difficulty/:difficulty",
  async(req:Request, res:Response) => {
    try {
        const {topic, difficulty} = req.params;
        // aggregate returns an array, so must index 0 even if its just one value
        // can use aggregate as mongoDB inbuilt randomizer 
        //https://stackoverflow.com/questions/2824157/how-can-i-get-a-random-record-from-mongodb
        const matchingQuestions = await Question.aggregate([
            {
                $match: {
                    topic,
                    difficulty
                }
            },
            {
                $sample: {size: 1}    
            }
        ]);
        return res.json(matchingQuestions[0]);
    } catch(error) {
        console.error("Failed to read a random question based on difficulty and topic: ", error);
        return res.status(500).json({ error: "Failed"})
    }
  });
// read all topics

// update (admin)

// delete (admin)

