const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// صفحة اختبار بسيطة
app.get("/", (req, res) => {
  res.send("🔥 Omegle Backend Running Globally 🔥");
});

let rooms = {}; // لتوصيل مستخدمين مع بعض

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("findPartner", () => {
    let roomFound = false;
    for (let room in rooms) {
      if (rooms[room].length === 1) {
        rooms[room].push(socket.id);
        socket.join(room);
        io.to(room).emit("partnerFound", room);
        roomFound = true;
        break;
      }
    }

    if (!roomFound) {
      const roomId = socket.id;
      rooms[roomId] = [socket.id];
      socket.join(roomId);
    }
  });

  socket.on("signal", ({ room, data }) => {
    socket.to(room).emit("signal", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (let room in rooms) {
      rooms[room] = rooms[room].filter(id => id !== socket.id);
      if (rooms[room].length === 0) delete rooms[room];
    }
  });
});

// تشغيل السيرفر على أي بورت تختاره
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
