// server/index.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const path = require('path');

const socketHandlers = require('./socket');
const uploadRoute = require('./routes/upload');

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload routes
app.use('/api/upload', uploadRoute);

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ✅ CONNECT TO MONGODB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: ['http://localhost:5173'], methods: ['GET', 'POST'] },
  pingTimeout: 60000
});

// Socket handlers
socketHandlers(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
