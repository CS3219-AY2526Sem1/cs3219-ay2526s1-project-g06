import {Router} from "express";
import {Request, Response} from "express";
import {Question} from "../models/question";

const router = Router();

// create (admin)
// create a qn

// create multiple qns


// read (user + admin)
// read random qn, no topic or difficulty given
router.get("/random",
    async(req:Request, res:Response) => {
      try {
          const matchingQuestions = await Question.aggregate([
              {
                  $sample: {size: 1}    
              }
          ]);
          return res.json(matchingQuestions[0]);
      } catch(error) {
          console.error("Failed to read a random question: ", error);
          return res.status(500).json({ error: "Failed"})
      }
    });

// read random qn based on topic
router.get("/random/topic/:topic",
    async(req:Request, res:Response) => {
      try {
          const {topic} = req.params;
          const matchingQuestions = await Question.aggregate([
              {
                  $match: {
                      topic
                  }
              },
              {
                  $sample: {size: 1}    
              }
          ]);
          return res.json(matchingQuestions[0]);
      } catch(error) {
          console.error("Failed to read a random question based on topic: ", error);
          return res.status(500).json({ error: "Failed"})
      }
    });

// read random qn based on difficulty
router.get("/random/difficulty/:difficulty",
    async(req:Request, res:Response) => {
      try {
          const {difficulty} = req.params;
          const matchingQuestions = await Question.aggregate([
              {
                  $match: {
                      difficulty
                  }
              },
              {
                  $sample: {size: 1}    
              }
          ]);
          return res.json(matchingQuestions[0]);
      } catch(error) {
          console.error("Failed to read a random question based on difficulty: ", error);
          return res.status(500).json({ error: "Failed"})
      }
    });

// read random qn based on topic and difficulty
router.get("/random/topic/:topic/difficulty/:difficulty",
    async(req:Request, res:Response) => {
      try {
          const {topic, difficulty} = req.params;
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
  
  // read all questions

  // read qn topics available based on selected diffculty

  // read qn difficulty available based on selected topic 

  // update (admin)
  // update a qn
  
  // update multiple qns


  // delete (admin)
  // delete a qn based on id

  // delete multiple qns based on ids

export {router as questionRouter};