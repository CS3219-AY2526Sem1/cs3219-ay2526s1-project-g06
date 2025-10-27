require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT) || 4004;

const app = express();
app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));

app.get('/ready', (req, res) => res.json({ status: 'ok' }));

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173'],
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
  io.to(roomId).emit('presence:update', { participants });
}

async function requestQuestion(url) {
  console.log('[Collab] Question fetch →', url);
  const res = await fetch(url);

  // Handle error codes
  if (!res.ok) {
    if (res.status === 404) return null; // Try the next URL in the fallback chain
    const body = await res.text().catch(() => '');
    throw new Error(`Question Service error ${res.status}: ${body}`);
  }

  // Parse and return the JSON body
  return await res.json();
}

async function fetchQuestion({ topic, difficulty }) {
  const baseUrl = process.env.QUESTION_SERVICE_URL || "http://localhost:4003";

  // Try most specific → least specific
  const urls = [];
  if (topic && difficulty) {
    urls.push(`${baseUrl}/api/question_service/random/topic/${enc(topic)}/difficulty/${enc(difficulty)}`);
  }
  if (topic) {
    urls.push(`${baseUrl}/api/question_service/random/topic/${enc(topic)}`);
  }
  if (difficulty) {
    urls.push(`${baseUrl}/api/question_service/random/difficulty/${enc(difficulty)}`);
  }
  urls.push(`${baseUrl}/api/question_service/random`);

  for (const url of urls) {
    try {
      const q = await requestQuestion(url);
      if (q) return q;
      console.log(q)
    } catch (err) {
      console.warn('[Collab] fetch attempt failed:', err?.message || err);
    }
  }
  return null;
}

io.on('connection', (socket) => {
  socket.on('join_room', async (payload = {}, ack) => {
    const { roomId, user, topic, difficulty } = payload;
    if (!roomId) return;

    socket.data.user = user || { userId: socket.id };
    socket.join(roomId);

    const participants = getParticipants(io, roomId);

    const q = await fetchQuestion({ topic, difficulty });
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
    socket.to(roomId).emit('codespace:change', { code, updatedAt: Date.now(), clientTs });
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[Collab] listening on http://localhost:${PORT}`);
});



