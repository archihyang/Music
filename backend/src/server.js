/**
 * Genesis Music Backend Server
 * 기타 마스터리 시스템 백엔드 서버
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
require('dotenv').config();

// API Routes
const guitarMasteryAPI = require('./api/guitar_mastery_api');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:8080' // For test HTML file
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/static', express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/mastery', guitarMasteryAPI);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Genesis Music Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      mastery: '/api/mastery',
      songs: '/api/mastery/songs',
      modules: '/api/mastery/practice-modules',
      paths: '/api/mastery/learning-paths'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// WebSocket connection for real-time updates
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join room for specific user
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });
  
  // Practice session updates
  socket.on('practice_update', (data) => {
    const { userId, moduleId, progress } = data;
    // Broadcast to user's room
    io.to(`user_${userId}`).emit('practice_progress', {
      moduleId,
      progress,
      timestamp: new Date().toISOString()
    });
  });
  
  // Song progress updates
  socket.on('song_progress', (data) => {
    const { userId, songId, section, accuracy } = data;
    io.to(`user_${userId}`).emit('song_update', {
      songId,
      section,
      accuracy,
      timestamp: new Date().toISOString()
    });
  });
  
  // Transcription progress
  socket.on('transcription_progress', (data) => {
    const { userId, progress, status } = data;
    io.to(`user_${userId}`).emit('transcription_update', {
      progress,
      status,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Server startup
const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     Genesis Music Backend Server       ║
║     Guitar Mastery System v1.0         ║
╠════════════════════════════════════════╣
║  Server running on port ${PORT}           ║
║  WebSocket enabled                     ║
║  CORS enabled for frontend             ║
╚════════════════════════════════════════╝
  `);
  console.log('Available endpoints:');
  console.log('  - GET  /api/mastery/songs/recommendations');
  console.log('  - GET  /api/mastery/songs/by-genre/:genre');
  console.log('  - GET  /api/mastery/songs/by-guitarist/:guitarist');
  console.log('  - GET  /api/mastery/practice-modules');
  console.log('  - GET  /api/mastery/learning-paths');
  console.log('  - GET  /api/mastery/songs/popular');
});

module.exports = { app, server, io };