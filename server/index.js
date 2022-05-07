const express = require("express");
const http = require("http");
const cors = require("cors");
const socketio = require("socket.io");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  users,
} = require("./users");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
  },
});
app.use(cors());

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  socket.on("join", ({ name, type, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, type, room });
    console.log(users);
    if (error) return callback(error);

    // Emit will send message to the user
    // who had joined
    socket.emit("message", {
      user: "admin",
      text: `${user.name},
			welcome to room ${user.room}.`,
    });

    // Broadcast will send message to everyone
    // in the room except the joined user
    socket.broadcast.to(user.room).emit("message", {
      user: "admin",
      text: `${user.name}, has joined`,
    });

    socket.join(user.room);

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback && callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit("message", { user: user.name, text: message });

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback && callback();
  });

  socket.on("faint-detected", () => {
    // send the faint-detected message to one user and see if they reply in 30 seconds
    const user = getUser(socket.id);
    io.to(user.room).emit("faint-detected", { user: user.name });
  });
  socket.on("sos", () => {
    socket.broadcast.emit("sos-activated");
  });
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} had left`,
      });
    }
  });
});

server.listen(process.env.PORT || 5000, () =>
  console.log(`Server has started.`)
);
