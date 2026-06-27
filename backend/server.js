const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const matchRoutes = require('./routes/match');
const chatRoutes = require('./routes/chat');
const communityRoutes = require('./routes/community');
const Message = require('./models/Message');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

app.use('/auth', authRoutes);
app.use('/match', matchRoutes);
app.use('/chat', chatRoutes);
app.use('/community', communityRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'SkillBarter API is running' });
});

const PORT = process.env.PORT || 4000;
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    socket.userId = payload.id;
    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  socket.join(String(socket.userId));

  socket.on('chat:send', async (payload, callback) => {
    try {
      const { recipientId, text, attachment, meetingUrl } = payload || {};
      if (!recipientId || (!text && !attachment && !meetingUrl)) {
        throw new Error('Message content is required');
      }

      const message = await Message.create({
        sender: socket.userId,
        recipient: recipientId,
        text,
        attachment: attachment || null,
        meetingUrl,
      });
      await message.populate([
        { path: 'sender', select: 'username email bio skills teachSkills learnSkills credits ratings' },
        { path: 'recipient', select: 'username email bio skills teachSkills learnSkills credits ratings' },
      ]);

      io.to(String(socket.userId)).to(String(recipientId)).emit('chat:message', message);
      if (callback) callback({ ok: true, message });
    } catch (error) {
      if (callback) callback({ ok: false, message: error.message });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
