import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { matchingQueue } from "./matchingQueue";
import type { MatchRequest } from "./types";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: "/matching/socket.io/",
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
});

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", queueLength: matchingQueue.getQueueLength() });
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Handle match request
  socket.on("find_match", (data: { userId: string; email: string; difficulties: string[]; topics: string[] }) => {
    console.log(`Match request from ${data.email}:`, data);

    const request: MatchRequest = {
      userId: data.userId,
      email: data.email,
      difficulties: data.difficulties,
      topics: data.topics,
      socketId: socket.id,
      timestamp: Date.now(),
    };

    // Try to find a match
    const matchResult = matchingQueue.findMatch(request);

    if (matchResult) {
      // Match found!
      console.log(`Match found! Room: ${matchResult.matchedRequest.roomId}`);

      // Notify both users
      socket.emit("match_found", matchResult.matchedRequest);
      io.to(matchResult.match.socketId).emit("match_found", matchResult.matchedRequest);
    } else {
      // No match, add to queue
      matchingQueue.addToQueue(request);
      socket.emit("waiting", { message: "Searching for a match..." });
      console.log(`User ${data.email} added to queue. Queue length: ${matchingQueue.getQueueLength()}`);
    }
  });

  // Handle cancel match
  socket.on("cancel_match", (data: { userId: string }) => {
    matchingQueue.removeFromQueue(data.userId);
    socket.emit("match_cancelled", { message: "Match search cancelled" });
    console.log(`User ${data.userId} cancelled match. Queue length: ${matchingQueue.getQueueLength()}`);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    // Note: We can't remove by socketId easily, could enhance this later
  });
});

// Clean up stale requests every 10 seconds
setInterval(() => {
  matchingQueue.clearStaleRequests(30000); // 30 seconds timeout
}, 10000);

const PORT = Number(process.env.PORT) || 4002;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Matching service running on http://localhost:${PORT}`);
});
