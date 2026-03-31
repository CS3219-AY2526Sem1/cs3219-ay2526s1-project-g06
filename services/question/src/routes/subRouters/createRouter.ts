import {Router} from "express";
import {Request, Response} from "express";
import {Question} from "../../models/question";

const router = Router();

// create (admin), create runs validators by default
// create a qn
router.post("/create/single",
    async(req:Request, res:Response) => {
      try {
        const {title, description, difficulty, topic} = req.body;
        // if any field is missing 
        if (!title || !description || !difficulty || !topic) {
            return res.status(400).json({
                error: "Missing one or more fields, all fields are compulsory"
            });
        }

        // if title is not unique 
        let existingQuestion = await Question.findOne({title: title});
        if (existingQuestion) {
            return res.status(409).json({
                error: "A question with the same title already exists",
                existingQuestion: existingQuestion
            });
        }

        // if description is not unique 
        existingQuestion = await Question.findOne({description: description});
        if (existingQuestion) {
            return res.status(409).json({
                error: "A question with the same description already exists",
                existingQuestion: existingQuestion
            });
        }

        const singleQuestion = await Question.create({
            title, 
            description,
            difficulty,
            topic
        });

        return res.json({
            message: "Single question was created successfully",
            singleQuestion: singleQuestion
        });
      } catch(error) {
          console.error("Failed to create single question: ", error);
          return res.status(500).json({ error: "Failed"});
      }
    });


export {router as createRouter};