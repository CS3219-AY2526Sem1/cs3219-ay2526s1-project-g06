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
