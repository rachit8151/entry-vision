// ==========================================
// ✅ BACKEND ENTRY POINT (index.js)
// ==========================================
require('dotenv').config();
const connectToMongo = require('./db');
const express = require('express');
const cors = require('cors');
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// ==========================================
// ✅ CONNECT TO MONGODB
// ==========================================
connectToMongo();

const app = express();
const port = process.env.PORT || 3000;

// ==========================================
// ✅ CREATE SERVER + SOCKET.IO
// ==========================================
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Global map for connected HODs
global.connectedHODs = {};

// ==========================================
// ✅ SOCKET.IO HANDLERS
// ==========================================
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("registerHOD", (dId) => {
    if (dId) {
      global.connectedHODs[dId] = socket.id;
      console.log(`✅ HOD ${dId} registered with socket ${socket.id}`);
    }
  });

  socket.on("disconnect", () => {
    for (const [key, value] of Object.entries(global.connectedHODs)) {
      if (value === socket.id) {
        delete global.connectedHODs[key];
        console.log(`🔴 HOD ${key} disconnected (${socket.id})`);
      }
    }
  });
});

app.set("io", io);

// ==========================================
// ✅ MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json({ limit: "20mb" })); 
app.use(express.urlencoded({ extended: true }));

// ==========================================
// ✅ STATIC UPLOADS (VERY IMPORTANT FOR FACE IMAGE DISPLAY)
// ==========================================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==========================================
// ✅ ROUTE MOUNTING (your existing routes)
// ==========================================

// Auth + login system
app.use('/api/auth', require('./routes/auth'));
app.use('/api/changePassword', require('./routes/changePassword'));
app.use('/api/otp', require('./routes/otp'));

// University + departments
app.use('/api/universityAdmin', require('./routes/universityAdmin'));
app.use('/api/departments', require('./routes/departments'));

// Guest management
app.use('/api/guest', require('./routes/guest'));

// HOD management
app.use("/api/hod", require("./routes/hod"));
app.use("/api/location", require("./routes/location"));

// Security guard + general data
app.use("/api/securityGuard", require("./routes/securityGuard"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/states", require("./routes/states"));
app.use("/api/cities", require("./routes/cities"));
app.use("/api/meta", require("./routes/metaData"));
app.use("/api/students", require("./routes/students"));

// Restriction module
app.use("/api/restrict", require("./routes/studentRestrict"));

//YOUR FACE CAPTURE
app.use("/api/faces", require("./routes/faces"));
//ArcFace Verification
app.use("/api/face", require("./routes/faceAuth"));

// Cron Job for auto unrestrict
require("./schedulers/restrictionScheduler");

// ==========================================
// ROOT ROUTE
// ==========================================
app.get('/', (req, res) => {
  res.send('✅ SmartCampusEntry backend running successfully (ArcFace Enabled)');
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ==========================================
// START SERVER WITH SOCKET.IO
// ==========================================
server.listen(port, () => {
  console.log(`✅ Server running with Socket.IO at http://localhost:${port}`);
});
