[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/QUdQy4ix)
# CS3219 Project (PeerPrep) - AY2526S1
## Group: Gxx

## Project Overview

PeerPrep is a collaborative coding platform that matches users to solve coding questions together in real-time.

### Core Features

1. **User Authentication**
   - Users register and log in via Firebase Authentication
   - Session management through backend user service

2. **Question Filtering**
   - Filter coding questions by difficulty level
   - Filter by topics of interest

3. **Matchmaking System**
   - Users click "Find Match" to enter matchmaking queue
   - Server matches users with similar preferences who are currently searching
   - Real-time matching algorithm

4. **Collaborative Coding Room**
   - Once matched, users enter a shared coding environment
   - Similar to LeetCode/online coding interview platforms
   - Real-time collaborative code editing
   - Shared workspace for solving problems together

### Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend Services**: Microservices architecture
  - User Service: Authentication and user management
  - (More services to be added: Matching, Question, Collaboration)
- **Database**: MongoDB Atlas
- **Authentication**: Firebase

### Note:
- You are required to develop individual microservices within separate folders within this repository.
- The teaching team should be given access to the repositories as we may require viewing the history of the repository in case of any disputes or disagreements. 

### Question Database
- The question service uses data from TACO the license details and links are shown below:
- License: apache-2.0
- Dataset: https://huggingface.co/datasets/BAAI/TACO
- Copyright: Beijing Academy of Artificial Intelligence (BAAI)