# Question Service Test Suite

## Overview
Comprehensive test suite for the Question Service REST API using Jest and Supertest with an in-memory MongoDB instance.

## Test Coverage
- **35 test cases** covering all CRUD operations
- **66% statement coverage**, **78% branch coverage**
- **Integration tests** validating full request-response lifecycle

## Test Categories

### Create Operations (4 tests)
- ✅ Create question with valid data
- ✅ Validation: missing required fields (400)
- ✅ Uniqueness: duplicate title (409)
- ✅ Uniqueness: duplicate description (409)

### Read Operations (19 tests)
- ✅ Random question retrieval (unfiltered)
- ✅ Random by topic
- ✅ Random by difficulty
- ✅ Random by topic + difficulty (MongoDB aggregation: `$match` + `$sample`)
- ✅ Question by ID
- ✅ All topics (alphabetically sorted)
- ✅ All difficulties (canonically sorted: Easy → Medium → Hard)
- ✅ All questions
- ✅ Filtered topics by difficulty
- ✅ Filtered difficulties by topic
- ✅ 404 handling for all endpoints when no data exists

### Update Operations (4 tests)
- ✅ Update question with valid data
- ✅ 404 for non-existent question
- ✅ 409 for duplicate title
- ✅ 409 for duplicate description

### Delete Operations (4 tests)
- ✅ Delete single question by ID
- ✅ Delete all questions
- ✅ 404 handling for non-existent questions

### Integration Tests (2 tests)
- ✅ Full CRUD lifecycle: create → read → update → delete
- ✅ Aggregation pipeline workflow: filtered random queries + metadata endpoints

## Running Tests

```bash
npm test              # Run all tests with coverage
npm run test:watch    # Run tests in watch mode
```

## Key Testing Features
- **In-memory MongoDB**: Tests run against `mongodb-memory-server` for isolation
- **Dependency chaining**: Tests properly sequence operations that require IDs from previous API calls
- **Aggregation validation**: Verifies MongoDB `$match` and `$sample` pipeline correctness
- **Error scenarios**: Comprehensive validation of 400, 404, 409, and 500 responses
