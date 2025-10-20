const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);

// Configure CORS based on environment
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

const io = new Server(server, {
  cors: {
    origin: getCorsOrigins(),
    credentials: true,
  },
  path: "/collab/socket.io/",
});

io.on('connection', (socket) => {
  let currRoom;
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  socket.on('codespace change', (text) => {
    console.log(`sending ${currRoom} ${text}`);
    io.to(currRoom).emit('codespace change', text);
  });

  socket.on('join-room', (room) => {
    socket.join(room);
    currRoom = room;
    console.log('user joined ' + room);
    console.log("rooms in: ");
    socket.rooms.forEach(room => {
        if (room !== socket.id) {
          console.log(room);
            }
    });
  });
  socket.on('leave-room', (room) => {
    if (!currRoom) {
      return;
    }
    console.log("rooms in: ");
    socket.rooms.forEach(room => {
        if (room !== socket.id) {
          console.log(room);
              socket.leave(room);
            }
    });
    //socket.leave(room);
    //console.log('user left ' + room);
  });
});

server.listen(4004, () => {
  console.log('server running at http://localhost:4004');
  //console.log(process.env.CORS_ORIGIN);
});
