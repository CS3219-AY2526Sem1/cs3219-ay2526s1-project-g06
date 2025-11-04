import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const server = express();
server.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
server.use(express.json());

// Set up schema
const questionHistorySchema = new mongoose.Schema({
  userId: String,
  question: String,
  date: Date,
  submittedSolution: String,
  suggestedSolution: String,
});
const QuestionHistory = new mongoose.model("Question", questionHistorySchema);

async function startServer() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/test');
    console.log("connected");
  } catch (err) {
    console.log("can't connect " + err);
  }
  
  server.listen(12345, () => {
    console.log("hi");
  });
  server.post("/", (req, res) => {
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
  
  
  
  const testQuestion = new QuestionHistory({
    userId: "1",
    question: "Two sum",
    date: Date.now(),
    submittedSolution: "idk",
    suggestedSolution: "use a dic",
  });
  
  await testQuestion.save();
  
  const questions = await QuestionHistory.find();
  console.log(questions);

  // remove all
  await QuestionHistory.deleteMany();
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

startServer();
