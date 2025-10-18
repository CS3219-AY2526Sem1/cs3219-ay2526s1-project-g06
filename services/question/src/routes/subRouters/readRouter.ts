import {Router} from "express";
import {Request, Response} from "express";
import {Question} from "../../models/question";

const router = Router();

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
          // if no questions found 
          if (matchingQuestions.length === 0) {
            return res.status(404).json({ error: "No questions found"});
          }
          return res.json(matchingQuestions[0]);
      } catch(error) {
          console.error("Failed to read a random question: ", error);
          return res.status(500).json({ error: "Failed"});
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
          // if no questions found 
          if (matchingQuestions.length === 0) {
            return res.status(404).json({ error: "No questions found"});
          }
          return res.json(matchingQuestions[0]);
      } catch(error) {
          console.error("Failed to read a random question based on topic: ", error);
          return res.status(500).json({ error: "Failed"});
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
          // if no questions found 
          if (matchingQuestions.length === 0) {
            return res.status(404).json({ error: "No questions found"});
          }
          return res.json(matchingQuestions[0]);
      } catch(error) {
          console.error("Failed to read a random question based on difficulty: ", error);
          return res.status(500).json({ error: "Failed"});
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
          // if no questions found 
          if (matchingQuestions.length === 0) {
            return res.status(404).json({ error: "No questions found"});
          }
          return res.json(matchingQuestions[0]);
      } catch(error) {
          console.error("Failed to read a random question based on difficulty and topic: ", error);
          return res.status(500).json({ error: "Failed"});
      }
    });

// read qn based on qn id
router.get("/id/:id",
    async(req:Request, res:Response) => {
      try {
        const {id} = req.params;
        const specificQuestion = await Question.findById(id);
        // if no matching question 
        if(!specificQuestion) {
            return res.status(404).json({ error: "No such question with the specified ID could be found"});
        }
        return res.json(specificQuestion);
      } catch(error) {
          console.error("Failed to read question by ID: ", error);
          return res.status(500).json({ error: "Failed"});
      }
    });

// read all topics
router.get("/topics",
    async(req:Request, res:Response) => {
      try {
        // alphabetical sort
        const distinctTopics = (await Question.distinct("topic")).sort();
          // if no topics found 
          if (distinctTopics.length === 0) {
            return res.status(404).json({ error: "No topics found"});
          }
        return res.json(distinctTopics);
      } catch(error) {
          console.error("Failed to read question topics: ", error);
          return res.status(500).json({ error: "Failed"});
      }
    });

// read all questions
router.get("/questions",
    async(req:Request, res:Response) => {
      try {
        const questions = await Question.find();
          // if no questions found 
          if (questions.length === 0) {
            return res.status(404).json({ error: "No questions found"});
          }
        return res.json(questions);
      } catch(error) {
          console.error("Failed to read questions: ", error);
          return res.status(500).json({ error: "Failed"});
      }
    });

// read qn topics available based on selected diffculty
router.get("/filtered/topics/difficulty/:difficulty",
    async(req:Request, res:Response) => {
      try {
        const {difficulty} = req.params;
        // get filtered topics available based on selected difficulty, sort alphabetical 
        const filteredTopics = (await Question.distinct("topic", {difficulty: difficulty})).sort(); 
          // if no topics found 
          if (filteredTopics.length === 0) {
            return res.status(404).json({ error: "No topics found"});
          }
        return res.json(filteredTopics);
      } catch(error) {
          console.error("Failed to read filtered topics available based on question difficulty: ", error);
          return res.status(500).json({ error: "Failed"});
      }
    });

// read qn difficulties available based on selected topic 
router.get("/filtered/difficulties/topic/:topic",
    async(req:Request, res:Response) => {
      try {
        const {topic} = req.params;
        // get filtered difficulties available based on selected topic, sort alphabetical 
        const filteredDifficulties = (await Question.distinct("difficulty", {topic: topic})).sort(); 
          // if no difficulty found 
          if (filteredDifficulties.length === 0) {
            return res.status(404).json({ error: "No difficulty found"});
          }
        return res.json(filteredDifficulties);
      } catch(error) {
          console.error("Failed to read filtered difficulties available based on question topic: ", error);
          return res.status(500).json({ error: "Failed"});
      }
    });
    
export {router as readRouter};