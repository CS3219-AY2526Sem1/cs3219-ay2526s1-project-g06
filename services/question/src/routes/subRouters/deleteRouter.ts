import {Router} from "express";
import {Request, Response} from "express";
import {Question} from "../../models/question";

const router = Router();

// delete (admin)
// delete a qn based on id
router.delete("/delete/single/:id",
    async(req:Request, res:Response) => {
      try {
        const {id} = req.params;
        const deletedQuestion = await Question.findByIdAndDelete(id);
          // if no question with matching id found
          if (!deletedQuestion) {
            return res.status(404).json({ error: "No question with specified ID was found"});
          }
        return res.json({
          message: "Specified question based on ID was deleted",
          deletedQuestion: deletedQuestion
        });
      } catch(error) {
          console.error("Failed to delete question: ", error);
          return res.status(500).json({ error: "Failed"});
      }
    });
  
  // delete all qns
  router.delete("/delete/all",
    async(req:Request, res:Response) => {
      try {
        // returns acknowledged: boolean, deletedCount: number
        const deleteAllResult = await Question.deleteMany({});
  
          // if no questions are deleted 
          if (deleteAllResult.deletedCount === 0) {
            return res.status(404).json({ error: "No questions were deleted, as there were no questions in the db"});
          }
  
        return res.json({
          message: "All questions were deleted from the db",
          deletedCount: deleteAllResult.deletedCount
        });
      } catch(error) {
          console.error("Failed to delete all questions: ", error);
          return res.status(500).json({ error: "Failed"});
      }
    });

export {router as deleteRouter};