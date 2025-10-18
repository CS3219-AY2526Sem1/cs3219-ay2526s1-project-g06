const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
  path: "/collab/socket.io/",
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  socket.on('codespace change', (text) => {
    console.log(text);
    io.emit('codespace change', text);
  });
});

server.listen(4004, () => {
  console.log('server running at http://localhost:4004');
});
