const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/messageModel');
const { generateConversationId } = require('./controllers/chatController');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const connectDB = require('./config/db');
connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/actions', require('./routes/actionRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// Socket.io connection handling with authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production');
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);

  // Join room for a conversation
  socket.on('join_room', (otherUserId) => {
    const conversationId = generateConversationId(socket.userId, otherUserId);
    socket.join(conversationId);
    console.log(`User ${socket.userId} joined room: ${conversationId}`);
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { receiverId, content } = data;
      const conversationId = generateConversationId(socket.userId, receiverId);

      // Stop typing when sending message
      socket.to(conversationId).emit('user_stopped_typing', { userId: socket.userId });

      // Save message to database
      const message = await Message.create({
        sender: socket.userId,
        receiver: receiverId,
        content,
        conversationId
      });

      // Populate message with sender/receiver details
      await message.populate('sender', 'name profileImageURL');
      await message.populate('receiver', 'name profileImageURL');

      // Emit message to the room
      io.to(conversationId).emit('receive_message', message);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { message: 'Failed to send message' });
    }
  });

  // Typing indicators
  socket.on('start_typing', (data) => {
    const { receiverId } = data;
    const conversationId = generateConversationId(socket.userId, receiverId);
    socket.to(conversationId).emit('user_typing', { userId: socket.userId });
  });

  socket.on('stop_typing', (data) => {
    const { receiverId } = data;
    const conversationId = generateConversationId(socket.userId, receiverId);
    socket.to(conversationId).emit('user_stopped_typing', { userId: socket.userId });
  });

  // Mark messages as read
  socket.on('mark_messages_read', async (data) => {
    try {
      const { senderId } = data;
      const conversationId = generateConversationId(socket.userId, senderId);

      // Update all unread messages in this conversation where receiver is current user
      await Message.updateMany(
        {
          conversationId,
          sender: senderId,
          receiver: socket.userId,
          read: false
        },
        { read: true }
      );

      // Emit read status to the sender
      socket.to(conversationId).emit('messages_read', {
        conversationId,
        readerId: socket.userId
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { io };

