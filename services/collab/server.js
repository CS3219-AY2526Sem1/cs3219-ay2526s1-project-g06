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

io.on('connection', (socket) => {
  socket.on('join_room', (payload = {}, ack) => {
    const { roomId, user } = payload;
    if (!roomId) return;

    socket.data.user = user || { userId: socket.id };
    socket.join(roomId);

    // Build current presence
    const participants = getParticipants(io, roomId);

    // ACK back to the joining client immediately
    if (typeof ack === 'function') {
      ack({
        question: { title: 'Test question', prompt: 'Hello world' },
        code: '',
        participants
      });
    }

    // And still emit the normal events (nice to have)
    socket.emit('collab:init', { question: { title: 'Test question', prompt: 'Hello world' }, code: '', participants });
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



