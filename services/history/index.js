import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const server = express();
const PORT = process.env.PORT || 4005;
const MONGO_URL = process.env.MONGO_URL ? process.env.MONGO_URL : 'mongodb://127.0.0.1:27017/test';

const getCorsOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    const origins = [];
    if (process.env.CORS_ORIGIN) origins.push(process.env.CORS_ORIGIN);
    origins.push('https://d34n3c7d9pxc7j.cloudfront.net');
    return origins;
  } else {
    // Development origins
    return [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ];
  }
};
server.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getCorsOrigins();
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
server.use(express.json());

// Set up schema
const questionHistorySchema = new mongoose.Schema({
  userId: String,
  title: String,
  topic: String,
  difficulty: String,
  description: String,
  submittedSolution: String,
  date: Date,
});
const QuestionHistory = new mongoose.model("Question", questionHistorySchema);

async function startServer() {
  try {
    console.log("attempting to connect");
    console.log(MONGO_URL);
    await mongoose.connect(MONGO_URL);
    console.log("connected to ", mongoose.connection.host);
    console.log("db name ", mongoose.connection.name);
  } catch (err) {
    console.log("can't connect " + err);
  }
  
  server.listen(PORT, () => {
    console.log("hi");
  });
  server.post("/question-history/add-question", (req, res) => {
    console.log("post request");
    addQuestion(req.body);
    res.json("success");
  });

  server.post("/question-history/get-questions", (req, res) => {
    console.log(req.body);
    const { userId } = req.body;
    console.log(`get request from ${userId}`);
    getQuestions(req.body).then((questions) => {
    res.json(questions);
    console.log("sent response");
    });
  })

  server.post("/question-history/delete-question", (req, res) => {
    console.log("post request");
    deleteQuestion(req.body);
    res.json("success");
  });
  
  const questions = await QuestionHistory.find();
  console.log(questions);
  console.log("hi");

  // remove all
//  await QuestionHistory.deleteMany();
}

async function addQuestion(question) {
  question.date = Date.now();
  const toBeAddedQuestion = new QuestionHistory(question);
  await toBeAddedQuestion.save();
  console.log("added question");
  const questions = await QuestionHistory.find();
  console.log(questions);
}

async function getQuestions(req) {
  console.log("getting question");
  const questions = await QuestionHistory.find(req);
  console.log(questions);
  return questions;
}

async function deleteQuestion(question) {
  await QuestionHistory.deleteOne(question);
  console.log("deleted question");
  const questions = await QuestionHistory.find();
  console.log(questions);
}

startServer();
