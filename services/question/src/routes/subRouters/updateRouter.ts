// AI Assistance Disclosure:
// Tool: Cursor (model: Claude Sonnet 4.5), date: 2025‑10‑13
// Scope: How to to run validtors from mongooese on a findAndUpdate operation and return the new document inserted instead of the old one
// Author review: Was suggested to use {new: true, runValidators: true} in the query, which did what was expected. 

import {Router} from "express";
import {Request, Response} from "express";
import {Question} from "../../models/question";

const router = Router();

// update (admin), update does not run validators by default
// update a qn
router.patch("/update/:id",
    async(req:Request, res:Response) => {
      try {
        const {title, description, difficulty, topic} = req.body;
        const {id} = req.params;
  
        // if targeted question does not exist
        let existingQuestion = await Question.findById(id);
        if (!existingQuestion) {
            return res.status(404).json({
                error: "No question with the specified id could be found"
            });
        }
  
        // if changing title, and it is not unique 
        // if title is same as original allow it and skip check
        if (title && title !== existingQuestion.title) {
            const sameTitle = await Question.findOne({title: title});
            if (sameTitle) {
              return res.status(409).json({
                error: "Titles must be unique, there is an existing title which is the same",
                sameTitle: sameTitle
              });
            }
        }
  
        // if changing description, and it is not unique
        // if description is same as original allow it and skip check 
        if (description && description !== existingQuestion.description) {
          const sameDescription = await Question.findOne({description: description});
          if (sameDescription) {
            return res.status(409).json({
              error: "Description must be unique, there is an existing description which is the same",
              sameDescription: sameDescription
            });
          }
        }
  
        // if any field was not given it will be undefined, which is ignored by mongoose
        // ensure to call stringify on front end to prevent passing in null, frontend should not send null as that will set db to null
        const singleUpdatedQuestion = await Question.findByIdAndUpdate(
          id,
          {title, description, difficulty, topic},
          // return the new updated doc instead of old, and check against mongoose schema is input is valid
          {new: true, runValidators: true}
        );
  
        return res.json({
            message: "Single question was updated successfully",
            singleUpdatedQuestion: singleUpdatedQuestion
        });
      } catch(error) {
          console.error("Failed to update single question: ", error);
          return res.status(500).json({ error: "Failed"});
      }
    });
    
export {router as updateRouter};