const axios = require("axios");
const express = require("express");
const http = require("http");
const cors = require("cors");
const socketio = require("socket.io");
const {
  addUser,
  removeUser,
  getUser,
  getPatient,
  getDetector,
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

let timeout = null;

app.use(cors());
const fixedDetectorTokens = ["4Xhk8fcNNWeRf11j5gKSt3KIHyT1VMCh"];
io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  let token = socket.handshake.headers.token;
  console.log("token => " + token);
  if (!fixedDetectorTokens.includes(token)) {
    const isValidUser = isValid(token).then((res) => {
      if (!res) {
        //! check if this works with socket.io if not change it to socket.disconnect(socket.id)
        socket.disconnect(true);
      }
    }

    )

  }

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
    const patient = getPatient();
    if (patient) {
      io.to(patient.id).emit("are-you-ok");
    }
    timeout = setTimeout(() => {
      socket.broadcast.emit("faint-alarm");
    }, 5000);
  });
  socket.on("i-am-fine", () => {
    clearTimeout(timeout);
  });
  socket.on("reset", () => {
    socket.broadcast.emit("reset", { message: "reset" });
  });
  socket.on("sos", () => {
    socket.broadcast.emit("sos-activated");
  });
  socket.on("message", () => {
    socket.broadcast.emit("message");
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

//? helper functions
async function isValid(token) {
  const isValid = await axios.post(
    "https://faintbaseapp.herokuapp.com/is_auth",
    {
      UID: token,
    }
  );
  return isValid.data;
}

//get request on / to show the app is working properly
app.get("/", (req, res) => {
  res.send("Server is running");
});

server.listen(process.env.PORT || 5000, () =>
  console.log(`Server has started.`)
);
