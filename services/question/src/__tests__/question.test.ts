import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express, { Application } from 'express';
import { questionMainRouter } from '../routes/questionMainRouter';
import { Question } from '../models/question';

let mongoServer: MongoMemoryServer;
let app: Application;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  app = express();
  app.use(express.json());
  app.use('/api/question_service', questionMainRouter);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Question.deleteMany({});
});

describe('Question Service API Tests', () => {
  describe('POST /api/question_service/create/single', () => {
    it('should create a new question with valid data', async () => {
      const newQuestion = {
        title: 'Two Sum',
        description: 'Given an array of integers, return indices of two numbers that add up to target.',
        difficulty: 'Easy',
        topic: 'Arrays'
      };

      const response = await request(app)
        .post('/api/question_service/create/single')
        .send(newQuestion)
        .expect(200);

      expect(response.body.message).toBe('Single question was created successfully');
      expect(response.body.singleQuestion).toMatchObject(newQuestion);
      expect(response.body.singleQuestion._id).toBeDefined();
    });

    it('should return 400 when missing required fields', async () => {
      const incompleteQuestion = {
        title: 'Incomplete Question',
        description: 'Missing difficulty and topic'
      };

      const response = await request(app)
        .post('/api/question_service/create/single')
        .send(incompleteQuestion)
        .expect(400);

      expect(response.body.error).toBe('Missing one or more fields, all fields are compulsory');
    });

    it('should return 409 when title already exists', async () => {
      const question = {
        title: 'Duplicate Title',
        description: 'First description',
        difficulty: 'Medium',
        topic: 'Strings'
      };

      await request(app)
        .post('/api/question_service/create/single')
        .send(question);

      const duplicateQuestion = {
        title: 'Duplicate Title',
        description: 'Different description',
        difficulty: 'Hard',
        topic: 'Trees'
      };

      const response = await request(app)
        .post('/api/question_service/create/single')
        .send(duplicateQuestion)
        .expect(409);

      expect(response.body.error).toBe('A question with the same title already exists');
      expect(response.body.existingQuestion).toBeDefined();
    });

    it('should return 409 when description already exists', async () => {
      const question = {
        title: 'First Title',
        description: 'Duplicate Description',
        difficulty: 'Medium',
        topic: 'Strings'
      };

      await request(app)
        .post('/api/question_service/create/single')
        .send(question);

      const duplicateQuestion = {
        title: 'Different Title',
        description: 'Duplicate Description',
        difficulty: 'Hard',
        topic: 'Trees'
      };

      const response = await request(app)
        .post('/api/question_service/create/single')
        .send(duplicateQuestion)
        .expect(409);

      expect(response.body.error).toBe('A question with the same description already exists');
      expect(response.body.existingQuestion).toBeDefined();
    });
  });

  describe('GET /api/question_service/random', () => {
    it('should return a random question', async () => {
      await Question.create({
        title: 'Test Question 1',
        description: 'Description 1',
        difficulty: 'Easy',
        topic: 'Arrays'
      });

      const response = await request(app)
        .get('/api/question_service/random')
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('difficulty');
      expect(response.body).toHaveProperty('topic');
    });

    it('should return 404 when no questions exist', async () => {
      const response = await request(app)
        .get('/api/question_service/random')
        .expect(404);

      expect(response.body.error).toBe('No questions found');
    });
  });

  describe('GET /api/question_service/random/topic/:topic', () => {
    beforeEach(async () => {
      await Question.create([
        { title: 'Q1', description: 'D1', difficulty: 'Easy', topic: 'Arrays' },
        { title: 'Q2', description: 'D2', difficulty: 'Medium', topic: 'Strings' },
        { title: 'Q3', description: 'D3', difficulty: 'Hard', topic: 'Arrays' }
      ]);
    });

    it('should return a random question with matching topic', async () => {
      const response = await request(app)
        .get('/api/question_service/random/topic/Arrays')
        .expect(200);

      expect(response.body.topic).toBe('Arrays');
      expect(['Q1', 'Q3']).toContain(response.body.title);
    });

    it('should return 404 when topic has no questions', async () => {
      const response = await request(app)
        .get('/api/question_service/random/topic/NonExistentTopic')
        .expect(404);

      expect(response.body.error).toBe('No questions found');
    });
  });

  describe('GET /api/question_service/random/difficulty/:difficulty', () => {
    beforeEach(async () => {
      await Question.create([
        { title: 'Q1', description: 'D1', difficulty: 'Easy', topic: 'Arrays' },
        { title: 'Q2', description: 'D2', difficulty: 'Medium', topic: 'Strings' },
        { title: 'Q3', description: 'D3', difficulty: 'Easy', topic: 'Trees' }
      ]);
    });

    it('should return a random question with matching difficulty', async () => {
      const response = await request(app)
        .get('/api/question_service/random/difficulty/Easy')
        .expect(200);

      expect(response.body.difficulty).toBe('Easy');
      expect(['Q1', 'Q3']).toContain(response.body.title);
    });

    it('should return 404 when difficulty has no questions', async () => {
      const response = await request(app)
        .get('/api/question_service/random/difficulty/Hard')
        .expect(404);

      expect(response.body.error).toBe('No questions found');
    });
  });

  describe('GET /api/question_service/random/topic/:topic/difficulty/:difficulty', () => {
    beforeEach(async () => {
      await Question.create([
        { title: 'Q1', description: 'D1', difficulty: 'Easy', topic: 'Arrays' },
        { title: 'Q2', description: 'D2', difficulty: 'Medium', topic: 'Arrays' },
        { title: 'Q3', description: 'D3', difficulty: 'Easy', topic: 'Strings' }
      ]);
    });

    it('should return a random question matching both topic and difficulty', async () => {
      const response = await request(app)
        .get('/api/question_service/random/topic/Arrays/difficulty/Easy')
        .expect(200);

      expect(response.body.topic).toBe('Arrays');
      expect(response.body.difficulty).toBe('Easy');
      expect(response.body.title).toBe('Q1');
    });

    it('should return 404 when no questions match both filters', async () => {
      const response = await request(app)
        .get('/api/question_service/random/topic/Arrays/difficulty/Hard')
        .expect(404);

      expect(response.body.error).toBe('No questions found');
    });
  });

  describe('GET /api/question_service/id/:id', () => {
    it('should return a question by ID', async () => {
      const created = await Question.create({
        title: 'Test Question',
        description: 'Test Description',
        difficulty: 'Medium',
        topic: 'Graphs'
      });

      const response = await request(app)
        .get(`/api/question_service/id/${created._id}`)
        .expect(200);

      expect(response.body._id).toBe((created._id as any).toString());
      expect(response.body.title).toBe('Test Question');
    });

    it('should return 404 for non-existent ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/question_service/id/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('No such question with the specified ID could be found');
    });

    it('should return 500 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/question_service/id/invalid-id-format')
        .expect(500);

      expect(response.body.error).toBe('Failed');
    });
  });

  describe('GET /api/question_service/topics', () => {
    it('should return all distinct topics in alphabetical order', async () => {
      await Question.create([
        { title: 'Q1', description: 'D1', difficulty: 'Easy', topic: 'Strings' },
        { title: 'Q2', description: 'D2', difficulty: 'Medium', topic: 'Arrays' },
        { title: 'Q3', description: 'D3', difficulty: 'Hard', topic: 'Trees' },
        { title: 'Q4', description: 'D4', difficulty: 'Easy', topic: 'Arrays' }
      ]);

      const response = await request(app)
        .get('/api/question_service/topics')
        .expect(200);

      expect(response.body).toEqual(['Arrays', 'Strings', 'Trees']);
    });

    it('should return 404 when no topics exist', async () => {
      const response = await request(app)
        .get('/api/question_service/topics')
        .expect(404);

      expect(response.body.error).toBe('No topics found');
    });
  });

  describe('GET /api/question_service/difficulties', () => {
    it('should return all difficulties in canonical order', async () => {
      await Question.create([
        { title: 'Q1', description: 'D1', difficulty: 'Hard', topic: 'Arrays' },
        { title: 'Q2', description: 'D2', difficulty: 'Easy', topic: 'Strings' },
        { title: 'Q3', description: 'D3', difficulty: 'Medium', topic: 'Trees' }
      ]);

      const response = await request(app)
        .get('/api/question_service/difficulties')
        .expect(200);

      expect(response.body).toEqual(['Easy', 'Medium', 'Hard']);
    });

    it('should return 404 when no difficulties exist', async () => {
      const response = await request(app)
        .get('/api/question_service/difficulties')
        .expect(404);

      expect(response.body.error).toBe('No difficulty found');
    });
  });

  describe('GET /api/question_service/questions', () => {
    it('should return all questions', async () => {
      await Question.create([
        { title: 'Q1', description: 'D1', difficulty: 'Easy', topic: 'Arrays' },
        { title: 'Q2', description: 'D2', difficulty: 'Medium', topic: 'Strings' }
      ]);

      const response = await request(app)
        .get('/api/question_service/questions')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('_id');
      expect(response.body[1]).toHaveProperty('_id');
    });

    it('should return 404 when no questions exist', async () => {
      const response = await request(app)
        .get('/api/question_service/questions')
        .expect(404);

      expect(response.body.error).toBe('No questions found');
    });
  });

  describe('GET /api/question_service/filtered/topics/difficulty/:difficulty', () => {
    beforeEach(async () => {
      await Question.create([
        { title: 'Q1', description: 'D1', difficulty: 'Easy', topic: 'Arrays' },
        { title: 'Q2', description: 'D2', difficulty: 'Easy', topic: 'Strings' },
        { title: 'Q3', description: 'D3', difficulty: 'Medium', topic: 'Trees' }
      ]);
    });

    it('should return topics filtered by difficulty in alphabetical order', async () => {
      const response = await request(app)
        .get('/api/question_service/filtered/topics/difficulty/Easy')
        .expect(200);

      expect(response.body).toEqual(['Arrays', 'Strings']);
    });

    it('should return 404 when no topics match difficulty', async () => {
      const response = await request(app)
        .get('/api/question_service/filtered/topics/difficulty/Hard')
        .expect(404);

      expect(response.body.error).toBe('No topics found');
    });
  });

  describe('GET /api/question_service/filtered/difficulties/topic/:topic', () => {
    beforeEach(async () => {
      await Question.create([
        { title: 'Q1', description: 'D1', difficulty: 'Easy', topic: 'Arrays' },
        { title: 'Q2', description: 'D2', difficulty: 'Medium', topic: 'Arrays' },
        { title: 'Q3', description: 'D3', difficulty: 'Hard', topic: 'Arrays' },
        { title: 'Q4', description: 'D4', difficulty: 'Easy', topic: 'Strings' }
      ]);
    });

    it('should return difficulties filtered by topic in canonical order', async () => {
      const response = await request(app)
        .get('/api/question_service/filtered/difficulties/topic/Arrays')
        .expect(200);

      expect(response.body).toEqual(['Easy', 'Medium', 'Hard']);
    });

    it('should return 404 when no difficulties match topic', async () => {
      const response = await request(app)
        .get('/api/question_service/filtered/difficulties/topic/NonExistent')
        .expect(404);

      expect(response.body.error).toBe('No difficulty found');
    });
  });

  describe('PATCH /api/question_service/update/:id', () => {
    it('should update a question with valid data', async () => {
      const created = await Question.create({
        title: 'Original Title',
        description: 'Original Description',
        difficulty: 'Easy',
        topic: 'Arrays'
      });

      const updates = {
        title: 'Updated Title',
        difficulty: 'Hard'
      };

      const response = await request(app)
        .patch(`/api/question_service/update/${created._id}`)
        .send(updates)
        .expect(200);

      expect(response.body.message).toBe('Single question was updated successfully');
      expect(response.body.singleUpdatedQuestion.title).toBe('Updated Title');
      expect(response.body.singleUpdatedQuestion.difficulty).toBe('Hard');
      expect(response.body.singleUpdatedQuestion.description).toBe('Original Description');
    });

    it('should return 404 when updating non-existent question', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/question_service/update/${fakeId}`)
        .send({ title: 'New Title' })
        .expect(404);

      expect(response.body.error).toBe('No question with the specified id could be found');
    });

    it('should return 409 when updating to existing title', async () => {
      const q1 = await Question.create({
        title: 'Existing Title',
        description: 'Description 1',
        difficulty: 'Easy',
        topic: 'Arrays'
      });

      const q2 = await Question.create({
        title: 'Other Title',
        description: 'Description 2',
        difficulty: 'Medium',
        topic: 'Strings'
      });

      const response = await request(app)
        .patch(`/api/question_service/update/${q2._id}`)
        .send({ title: 'Existing Title' })
        .expect(409);

      expect(response.body.error).toBe('Titles must be unique, there is an existing title which is the same');
    });

    it('should return 409 when updating to existing description', async () => {
      const q1 = await Question.create({
        title: 'Title 1',
        description: 'Existing Description',
        difficulty: 'Easy',
        topic: 'Arrays'
      });

      const q2 = await Question.create({
        title: 'Title 2',
        description: 'Other Description',
        difficulty: 'Medium',
        topic: 'Strings'
      });

      const response = await request(app)
        .patch(`/api/question_service/update/${q2._id}`)
        .send({ description: 'Existing Description' })
        .expect(409);

      expect(response.body.error).toBe('Description must be unique, there is an existing description which is the same');
    });
  });

  describe('DELETE /api/question_service/delete/single/:id', () => {
    it('should delete a question by ID', async () => {
      const created = await Question.create({
        title: 'To Be Deleted',
        description: 'This will be deleted',
        difficulty: 'Easy',
        topic: 'Arrays'
      });

      const response = await request(app)
        .delete(`/api/question_service/delete/single/${created._id}`)
        .expect(200);

      expect(response.body.message).toBe('Specified question based on ID was deleted');
      expect(response.body.deletedQuestion._id).toBe((created._id as any).toString());

      const found = await Question.findById(created._id);
      expect(found).toBeNull();
    });

    it('should return 404 when deleting non-existent question', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/question_service/delete/single/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('No question with specified ID was found');
    });
  });

  describe('DELETE /api/question_service/delete/all', () => {
    it('should delete all questions', async () => {
      await Question.create([
        { title: 'Q1', description: 'D1', difficulty: 'Easy', topic: 'Arrays' },
        { title: 'Q2', description: 'D2', difficulty: 'Medium', topic: 'Strings' },
        { title: 'Q3', description: 'D3', difficulty: 'Hard', topic: 'Trees' }
      ]);

      const response = await request(app)
        .delete('/api/question_service/delete/all')
        .expect(200);

      expect(response.body.message).toBe('All questions were deleted from the db');
      expect(response.body.deletedCount).toBe(3);

      const count = await Question.countDocuments();
      expect(count).toBe(0);
    });

    it('should return 404 when no questions exist to delete', async () => {
      const response = await request(app)
        .delete('/api/question_service/delete/all')
        .expect(404);

      expect(response.body.error).toBe('No questions were deleted, as there were no questions in the db');
    });
  });

  describe('Integration Tests - Full CRUD Workflow', () => {
    it('should handle complete lifecycle: create, read, update, delete', async () => {
      const newQuestion = {
        title: 'Lifecycle Test',
        description: 'Testing full CRUD operations',
        difficulty: 'Medium',
        topic: 'Dynamic Programming'
      };

      const createRes = await request(app)
        .post('/api/question_service/create/single')
        .send(newQuestion)
        .expect(200);

      const questionId = createRes.body.singleQuestion._id;

      const readRes = await request(app)
        .get(`/api/question_service/id/${questionId}`)
        .expect(200);
      expect(readRes.body.title).toBe('Lifecycle Test');

      const updateRes = await request(app)
        .patch(`/api/question_service/update/${questionId}`)
        .send({ difficulty: 'Hard' })
        .expect(200);
      expect(updateRes.body.singleUpdatedQuestion.difficulty).toBe('Hard');

      await request(app)
        .delete(`/api/question_service/delete/single/${questionId}`)
        .expect(200);

      await request(app)
        .get(`/api/question_service/id/${questionId}`)
        .expect(404);
    });

    it('should handle filtered random queries with aggregation pipelines', async () => {
      await Question.create([
        { title: 'Easy Array 1', description: 'EA1', difficulty: 'Easy', topic: 'Arrays' },
        { title: 'Easy Array 2', description: 'EA2', difficulty: 'Easy', topic: 'Arrays' },
        { title: 'Medium Array', description: 'MA', difficulty: 'Medium', topic: 'Arrays' },
        { title: 'Easy String', description: 'ES', difficulty: 'Easy', topic: 'Strings' }
      ]);

      const response = await request(app)
        .get('/api/question_service/random/topic/Arrays/difficulty/Easy')
        .expect(200);

      expect(response.body.topic).toBe('Arrays');
      expect(response.body.difficulty).toBe('Easy');
      expect(['Easy Array 1', 'Easy Array 2']).toContain(response.body.title);

      const topicsRes = await request(app)
        .get('/api/question_service/filtered/topics/difficulty/Easy')
        .expect(200);
      expect(topicsRes.body).toEqual(['Arrays', 'Strings']);

      const difficultiesRes = await request(app)
        .get('/api/question_service/filtered/difficulties/topic/Arrays')
        .expect(200);
      expect(difficultiesRes.body).toEqual(['Easy', 'Medium']);
    });
  });
});
