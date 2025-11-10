AI Assistance Disclosure:
Tool: Cursor (model: Claude Sonnet 4.5), date: 2025‑11‑10
Scope: Generated api documentation for question service, after question service was finalised 
Author review: I validated correctness.

# Question Service API Documentation

## Overview
The Question Service provides endpoints for managing coding interview questions. The service supports CRUD operations with role-based access control.

## Authentication & Authorization
- **Read operations**: Accessible to all users
- **Create, Update, Delete operations**: Require admin privileges

---

## Endpoints

### Create Operations (Admin Only)

#### Create a Single Question
**POST** `/create/single`

Create a new question in the database.

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "difficulty": "string (required)",
  "topic": "string (required)"
}
```

**Success Response (200):**
```json
{
  "message": "Single question was created successfully",
  "singleQuestion": {
    "_id": "string",
    "title": "string",
    "description": "string",
    "difficulty": "string",
    "topic": "string"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing one or more required fields
```json
{
  "error": "Missing one or more fields, all fields are compulsory"
}
```
- `409 Conflict`: Question with same title or description already exists
```json
{
  "error": "A question with the same title already exists",
  "existingQuestion": { ... }
}
```
- `500 Internal Server Error`: Server error

---

### Read Operations (User + Admin)

#### Read Random Question
**GET** `/random`

Retrieve a random question without any filters.

**Success Response (200):**
```json
{
  "_id": "string",
  "title": "string",
  "description": "string",
  "difficulty": "string",
  "topic": "string"
}
```

**Error Responses:**
- `404 Not Found`: No questions found in database
- `500 Internal Server Error`: Server error

---

#### Read Random Question by Topic
**GET** `/random/topic/:topic`

Retrieve a random question filtered by topic.

**URL Parameters:**
- `topic` (string): The topic to filter by

**Success Response (200):**
```json
{
  "_id": "string",
  "title": "string",
  "description": "string",
  "difficulty": "string",
  "topic": "string"
}
```

**Error Responses:**
- `404 Not Found`: No questions found with specified topic
- `500 Internal Server Error`: Server error

---

#### Read Random Question by Difficulty
**GET** `/random/difficulty/:difficulty`

Retrieve a random question filtered by difficulty level.

**URL Parameters:**
- `difficulty` (string): The difficulty level (e.g., "Easy", "Medium", "Hard")

**Success Response (200):**
```json
{
  "_id": "string",
  "title": "string",
  "description": "string",
  "difficulty": "string",
  "topic": "string"
}
```

**Error Responses:**
- `404 Not Found`: No questions found with specified difficulty
- `500 Internal Server Error`: Server error

---

#### Read Random Question by Topic and Difficulty
**GET** `/random/topic/:topic/difficulty/:difficulty`

Retrieve a random question filtered by both topic and difficulty.

**URL Parameters:**
- `topic` (string): The topic to filter by
- `difficulty` (string): The difficulty level

**Success Response (200):**
```json
{
  "_id": "string",
  "title": "string",
  "description": "string",
  "difficulty": "string",
  "topic": "string"
}
```

**Error Responses:**
- `404 Not Found`: No questions found matching both criteria
- `500 Internal Server Error`: Server error

---

#### Read Question by ID
**GET** `/id/:id`

Retrieve a specific question by its unique identifier.

**URL Parameters:**
- `id` (string): The question's MongoDB ObjectId

**Success Response (200):**
```json
{
  "_id": "string",
  "title": "string",
  "description": "string",
  "difficulty": "string",
  "topic": "string"
}
```

**Error Responses:**
- `404 Not Found`: No question found with specified ID
- `500 Internal Server Error`: Server error

---

#### Read All Topics
**GET** `/topics`

Retrieve all distinct topics available in the database (alphabetically sorted).

**Success Response (200):**
```json
["Arrays", "Binary Search", "Dynamic Programming", "Graphs", ...]
```

**Error Responses:**
- `404 Not Found`: No topics found
- `500 Internal Server Error`: Server error

---

#### Read All Difficulties
**GET** `/difficulties`

Retrieve all distinct difficulty levels available in the database (sorted: Easy, Medium, Hard).

**Success Response (200):**
```json
["Easy", "Medium", "Hard"]
```

**Error Responses:**
- `404 Not Found`: No difficulties found
- `500 Internal Server Error`: Server error

---

#### Read All Questions
**GET** `/questions`

Retrieve all questions from the database.

**Success Response (200):**
```json
[
  {
    "_id": "string",
    "title": "string",
    "description": "string",
    "difficulty": "string",
    "topic": "string"
  },
  ...
]
```

**Error Responses:**
- `404 Not Found`: No questions found
- `500 Internal Server Error`: Server error

---

#### Read Filtered Topics by Difficulty
**GET** `/filtered/topics/difficulty/:difficulty`

Retrieve all topics available for a specific difficulty level (alphabetically sorted).

**URL Parameters:**
- `difficulty` (string): The difficulty level to filter by

**Success Response (200):**
```json
["Arrays", "Strings", "Trees", ...]
```

**Error Responses:**
- `404 Not Found`: No topics found for specified difficulty
- `500 Internal Server Error`: Server error

---

#### Read Filtered Difficulties by Topic
**GET** `/filtered/difficulties/topic/:topic`

Retrieve all difficulty levels available for a specific topic (sorted: Easy, Medium, Hard).

**URL Parameters:**
- `topic` (string): The topic to filter by

**Success Response (200):**
```json
["Easy", "Medium", "Hard"]
```

**Error Responses:**
- `404 Not Found`: No difficulties found for specified topic
- `500 Internal Server Error`: Server error

---

### Update Operations (Admin Only)

#### Update a Question
**PATCH** `/update/:id`

Update an existing question by its ID. All fields are optional; only provided fields will be updated.

**URL Parameters:**
- `id` (string): The question's MongoDB ObjectId

**Request Body:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "difficulty": "string (optional)",
  "topic": "string (optional)"
}
```

**Success Response (200):**
```json
{
  "message": "Single question was updated successfully",
  "singleUpdatedQuestion": {
    "_id": "string",
    "title": "string",
    "description": "string",
    "difficulty": "string",
    "topic": "string"
  }
}
```

**Error Responses:**
- `404 Not Found`: Question with specified ID not found
- `409 Conflict`: Title or description already exists for another question
```json
{
  "error": "Titles must be unique, there is an existing title which is the same",
  "sameTitle": { ... }
}
```
- `500 Internal Server Error`: Server error

**Notes:**
- Title and description must remain unique across all questions
- Unchanged fields can be omitted from the request body
- Do not send null values; use `JSON.stringify()` on frontend to prevent null values

---

### Delete Operations (Admin Only)

#### Delete a Single Question
**DELETE** `/delete/single/:id`

Delete a specific question by its ID.

**URL Parameters:**
- `id` (string): The question's MongoDB ObjectId

**Success Response (200):**
```json
{
  "message": "Specified question based on ID was deleted",
  "deletedQuestion": {
    "_id": "string",
    "title": "string",
    "description": "string",
    "difficulty": "string",
    "topic": "string"
  }
}
```

**Error Responses:**
- `404 Not Found`: No question found with specified ID
- `500 Internal Server Error`: Server error

---

#### Delete All Questions
**DELETE** `/delete/all`

Delete all questions from the database.

**Success Response (200):**
```json
{
  "message": "All questions were deleted from the db",
  "deletedCount": 42
}
```

**Error Responses:**
- `404 Not Found`: No questions in database to delete
- `500 Internal Server Error`: Server error

**⚠️ Warning:** This operation permanently deletes all questions. Use with extreme caution.

---

## Data Models

### Question Schema
```typescript
{
  _id: ObjectId,           // Auto-generated MongoDB ID
  title: string,           // Unique, required
  description: string,     // Unique, required
  difficulty: string,      // Required (e.g., "Easy", "Medium", "Hard")
  topic: string           // Required (e.g., "Arrays", "Trees", "Graphs")
}
```

---

## Error Handling

All endpoints follow consistent error response format:
```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200 OK`: Successful request
- `400 Bad Request`: Invalid request body or missing required fields
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource (title or description)
- `500 Internal Server Error`: Server-side error

---

## Notes

1. **Validators**: Create operations run validators by default; update operations include `runValidators: true` to ensure data integrity.
2. **Uniqueness**: Question titles and descriptions must be unique across the entire database.
3. **Random Selection**: Random endpoints use MongoDB's `$sample` aggregation for efficient random selection.
4. **Sorting**: 
   - Topics are sorted alphabetically
   - Difficulties follow canonical order: Easy → Medium → Hard

