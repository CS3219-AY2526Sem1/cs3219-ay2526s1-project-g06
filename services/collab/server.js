const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);

// Configure CORS based on environment
const getCorsOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    return [
      process.env.CORS_ORIGIN,
      'https://d34n3c7d9pxc7j.cloudfront.net'
    ].filter(Boolean);
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

const io = new Server(server, {
  cors: {
    origin: getCorsOrigins(),
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
  console.log(process.env.CORS_ORIGIN);
});
