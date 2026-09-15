import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' }
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'social-platform-api' });
});

app.get('/api/posts', (_req, res) => {
  res.json({ items: [], message: 'Connect the Post model and database query here.' });
});

io.on('connection', (socket) => {
  socket.on('join:user', (userId) => socket.join(`user:${userId}`));
  socket.on('chat:join', (conversationId) => socket.join(`conversation:${conversationId}`));
  socket.on('chat:message', (message) => {
    if (!message?.conversationId) return;
    io.to(`conversation:${message.conversationId}`).emit('chat:message', message);
  });
});

const port = Number(process.env.PORT || 5000);

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/social_platform')
  .then(() => httpServer.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
