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

// Configure CORS based on environment
const getCorsOrigins = (): string[] => {
  if (process.env.NODE_ENV === 'production') {
    const origins: string[] = [];
    if (process.env.CORS_ORIGIN) origins.push(process.env.CORS_ORIGIN);
    origins.push('https://d34n3c7d9pxc7j.cloudfront.net');
    return origins;
  } else {
    // Development origins
    return [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ];
  }
};

const io = new Server(httpServer, {
  cors: {
    origin: getCorsOrigins(),
    credentials: true,
  },
});

app.use(cors({
  origin: getCorsOrigins(),
  credentials: true
}));
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
    console.log(`[Matching] Match request from ${data.email} (userId: ${data.userId}, socketId: ${socket.id})`);
    console.log(`[Matching] - Requested difficulties: ${data.difficulties.join(', ')}`);
    console.log(`[Matching] - Requested topics: ${data.topics.join(', ')}`);

    // Check if user is already in an active collaboration session
    if (matchingQueue.isUserInActiveSession(data.userId)) {
      const activeRoomId = matchingQueue.getActiveSession(data.userId);
      console.log(`[Matching] ⚠️ User ${data.email} is already in active session (room: ${activeRoomId}), rejecting match request`);
      socket.emit("match_error", {
        message: "You are already in an active collaboration session. Please disconnect first."
      });
      return;
    }

    // Check if user is already in queue
    if (matchingQueue.isUserInQueue(data.userId)) {
      console.log(`[Matching] User ${data.email} is already in queue, removing old entry first`);
      matchingQueue.removeFromQueue(data.userId);
    }

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
      console.log(`[Matching] Match found! Room: ${matchResult.matchedRequest.roomId}`);
      console.log(`[Matching] - User 1: ${matchResult.matchedRequest.user1.email}`);
      console.log(`[Matching] - User 2: ${matchResult.matchedRequest.user2.email}`);
      console.log(`[Matching] - Matched topics: ${matchResult.matchedRequest.topics.join(', ')}`);
      console.log(`[Matching] - Matched difficulties: ${matchResult.matchedRequest.difficulties.join(', ')}`);

      // Track active sessions for both users
      matchingQueue.addActiveSession(matchResult.matchedRequest.user1.userId, matchResult.matchedRequest.roomId);
      matchingQueue.addActiveSession(matchResult.matchedRequest.user2.userId, matchResult.matchedRequest.roomId);
      console.log(`[Matching] Added both users to active sessions tracking`);

      // Notify both users
      socket.emit("match_found", matchResult.matchedRequest);
      io.to(matchResult.match.socketId).emit("match_found", matchResult.matchedRequest);
    } else {
      // No match, add to queue
      matchingQueue.addToQueue(request);
      socket.emit("waiting", { message: "Searching for a match..." });
      console.log(`[Matching] User ${data.email} added to queue. Queue length: ${matchingQueue.getQueueLength()}`);
    }
  });

  // Handle cancel match
  socket.on("cancel_match", (data: { userId: string }) => {
    console.log(`[Matching] Cancel request from userId: ${data.userId}`);
    matchingQueue.removeFromQueue(data.userId);
    socket.emit("match_cancelled", { message: "Match search cancelled" });
    console.log(`[Matching] User ${data.userId} removed from queue. Queue length: ${matchingQueue.getQueueLength()}`);
  });

  // Handle leaving collaboration session
  socket.on("leave_session", (data: { userId: string }, ack) => {
    console.log(`[Matching] Leave session request from userId: ${data.userId}`);
    matchingQueue.removeActiveSession(data.userId);
    console.log(`[Matching] User ${data.userId} removed from active sessions`);

    // Send acknowledgment if callback provided
    if (typeof ack === 'function') {
      ack({ success: true });
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Matching] Client disconnected: ${socket.id}`);
    matchingQueue.removeBySocketId(socket.id);
    console.log(`[Matching] Removed socket ${socket.id} from queue. Queue length: ${matchingQueue.getQueueLength()}`);
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
