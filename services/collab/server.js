require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const roomState = new Map(); // roomId -> { question, topic, difficulty }
const roomInitPromise = new Map();
const userActivity = new Map(); // socketId -> lastActivityTimestamp

// Idle timeout configuration (30 minutes)
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 60 * 1000; // Check every minute

const PORT = Number(process.env.PORT) || 4004;

const getCorsOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    const origins = [];
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

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getCorsOrigins();
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.get('/ready', (req, res) => res.json({ status: 'ok' }));

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = getCorsOrigins();
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Blocked by CORS: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

function getParticipants(io, roomId) {
  const room = io.sockets.adapter.rooms.get(roomId);
  if (!room) return [];
  const ids = Array.from(room); // socket ids
  return ids.map((sid) => {
    const s = io.sockets.sockets.get(sid);
    return s?.data?.user || { userId: sid };
  });
}

function broadcastPresence(io, roomId) {
  const participants = getParticipants(io, roomId);
  console.log(`[Collab] broadcastPresence called for room ${roomId} with ${participants.length} participants`);
  io.to(roomId).emit('presence:update', { participants });
}

async function requestQuestion(url) {
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) {
    console.error("Fetch failed: ", res.status, res.statusText);
    const errText = await res.text();
    console.error("Response: ", errText);
    return null;        // treat non-2xx as "no question"
  }
  return await res.json();
}

async function fetchQuestion({ topic, difficulty }) {
  const baseUrl = process.env.QUESTION_SERVICE_URL || "http://localhost:4003";

  const urls = [];
  if (topic && difficulty) {
    urls.push(`${baseUrl}/api/question_service/random/topic/${encodeURIComponent(topic)}/difficulty/${encodeURIComponent(difficulty)}`);
  }
  if (topic) {
    urls.push(`${baseUrl}/api/question_service/random/topic/${encodeURIComponent(topic)}`);
  }
  if (difficulty) {
    urls.push(`${baseUrl}/api/question_service/random/difficulty/${encodeURIComponent(difficulty)}`);
  }
  urls.push(`${baseUrl}/api/question_service/random`);

  for (const url of urls) {
    try {
      const q = await requestQuestion(url);
      if (q) return q;
      console.warn("[Collab] Question Service returned empty for", url);
    } catch (err) {
      console.warn("[Collab] fetch attempt failed:", url, err?.message || err);
    }
  }
  return null;
}

async function ensureRoomQuestion(roomId, topic, difficulty) {
  // If already initialized, return it.
  const existing = roomState.get(roomId);
  if (existing?.question) return existing.question;

  // If someone else is initializing, await the same promise.
  let p = roomInitPromise.get(roomId);
  if (!p) {
    // Make a single initializer promise and store it immediately to avoid races.
    p = (async () => {
      try {
        const q = await fetchQuestion({ topic, difficulty }); // your function
        roomState.set(roomId, {
          question: q, topic, difficulty, initAt: Date.now()
        });
        return q;
      } finally {
        // Always clear the init promise so future re-joins don’t await an old one.
        roomInitPromise.delete(roomId);
      }
    })();

    roomInitPromise.set(roomId, p);
  }

  return p; // all concurrent joiners await this
}

// Periodic check for idle users
setInterval(() => {
  const now = Date.now();
  const socketsToDisconnect = [];

  userActivity.forEach((lastActivity, socketId) => {
    if (now - lastActivity > IDLE_TIMEOUT_MS) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        console.log(`[Collab] Disconnecting idle user: ${socketId}`);
        socketsToDisconnect.push(socket);
      }
      userActivity.delete(socketId);
    }
  });

  // Disconnect idle sockets
  socketsToDisconnect.forEach(socket => {
    socket.emit('idle_disconnect', { message: 'Disconnected due to inactivity' });
    socket.disconnect(true);
  });
}, HEARTBEAT_INTERVAL_MS);

io.on('connection', (socket) => {
  // Track initial connection as activity
  userActivity.set(socket.id, Date.now());
  console.log(`[Collab] User connected: ${socket.id}`);

  // Handle heartbeat/ping from client
  socket.on('ping', () => {
    userActivity.set(socket.id, Date.now());
    socket.emit('pong');
  });

  socket.on('join_room', async (payload = {}, ack) => {
    // Update activity on join
    userActivity.set(socket.id, Date.now());
    const { roomId, user, topic, difficulty } = payload;
    if (!roomId) return;

    console.log(`[Collab] User ${socket.id} joining room ${roomId}, user data:`, user);

    socket.data.user = user || { userId: socket.id };
    socket.join(roomId);

    const participants = getParticipants(io, roomId);
    console.log(`[Collab] Room ${roomId} now has ${participants.length} participants:`, participants);

    const q = await ensureRoomQuestion(roomId, topic, difficulty);
    let normalized = null;

    if (q) {
      normalized = {
        id: q._id || q.id || 'unknown',
        title: q.title || q.name || 'Untitled',
        description: q.description || q.prompt || '',
        topic: q.topic || topic || 'N/A',
        difficulty: q.difficulty || difficulty || 'N/A',
      };
    } else {
      normalized = {
        id: 'placeholder',
        title: 'No matching question found',
        description: `We couldn't find a question for topic="${topic || '-'}" and difficulty="${difficulty || '-'}".`,
        topic: topic || 'N/A',
        difficulty: difficulty || 'N/A',
      };
    }

    // Send the question to the client
    if (typeof ack === 'function') {
      ack({
        question: normalized,
        code: '',
        participants,
      });
    }

    socket.emit('collab:init', { question: normalized, code: '', participants });
    broadcastPresence(io, roomId);
  });

  socket.on('codespace:change', ({ roomId, code, clientTs }) => {
    if (!roomId) return;
    // Update activity on code change
    userActivity.set(socket.id, Date.now());
    socket.to(roomId).emit('codespace:change', { code, updatedAt: Date.now(), clientTs });
  });

  socket.on('disconnect', () => {
    // Clean up activity tracking
    userActivity.delete(socket.id);
    console.log(`[Collab] User disconnected: ${socket.id}`);

    // Find which rooms this socket was in
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    console.log(`[Collab] Disconnected user was in rooms:`, rooms);

    rooms.forEach(roomId => {
      const roomBefore = io.sockets.adapter.rooms.get(roomId);
      console.log(`[Collab] Room ${roomId} state before broadcast - participants: ${roomBefore?.size || 0}`);

      // Broadcast updated presence to remaining participants
      const participants = getParticipants(io, roomId);
      console.log(`[Collab] Broadcasting presence update to room ${roomId}:`, participants);
      broadcastPresence(io, roomId);

      // Check if room is now empty
      const room = io.sockets.adapter.rooms.get(roomId);
      if (!room || room.size === 0) {
        // Room is empty, clean up state
        console.log(`[Collab] Room ${roomId} is empty, cleaning up state`);
        roomState.delete(roomId);
        roomInitPromise.delete(roomId);
      } else {
        console.log(`[Collab] Room ${roomId} still has ${room.size} participant(s)`);
      }
    });
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[Collab] listening on http://localhost:${PORT}`);
});



