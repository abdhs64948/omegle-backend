const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Port عالمي للعمل على Cloud Hosting
const PORT = process.env.PORT || 3000;

// Serve static files (HTML, CSS, JS)
app.use(express.static("public"));

// رسالة افتراضية عند زيارة الرابط الرئيسي
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// إعداد Socket.IO
const io = new Server(server);

let waitingUser = null;

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // إذا في مستخدم ينتظر، نربطه مع هذا المستخدم
  if (waitingUser) {
    const partner = waitingUser;
    waitingUser = null;

    // إنشاء روم خاص بالمستخدمين الاثنين
    const room = `${socket.id}#${partner.id}`;
    socket.join(room);
    partner.join(room);

    socket.emit("connected", { room, partnerId: partner.id });
    partner.emit("connected", { room, partnerId: socket.id });

    console.log(`🔗 Connected ${socket.id} with ${partner.id} in room ${room}`);
  } else {
    // إذا ما في حدا ينتظر، نخلي هذا المستخدم ينتظر
    waitingUser = socket;
    socket.emit("waiting");
    console.log(`⏳ User ${socket.id} is waiting for a partner`);
  }

  // استقبال الرسائل أو الفيديو/SDP
  socket.on("signal", ({ room, data }) => {
    socket.to(room).emit("signal", { data, from: socket.id });
  });

  // عند انفصال المستخدم
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);

    // إذا المستخدم كان ينتظر
    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    } else {
      // إخطار الشريك عند الانفصال
      socket.rooms.forEach((room) => {
        socket.to(room).emit("partnerDisconnected");
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`🔥 Omegle backend is running on port ${PORT}`);
});
