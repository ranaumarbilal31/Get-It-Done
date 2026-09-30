const prisma = require('../config/prisma');

const setupSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join a private channel for user notifications
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined user_${userId}`);
      }
    });

    // Join a specific task chat room
    socket.on('join_task', (taskId) => {
      if (taskId) {
        socket.join(`task_${taskId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined task_${taskId}`);
      }
    });

    // Leave a specific task room
    socket.on('leave_task', (taskId) => {
      if (taskId) {
        socket.leave(`task_${taskId}`);
        console.log(`[Socket.IO] Socket ${socket.id} left task_${taskId}`);
      }
    });

    // Handle real-time messaging
    socket.on('send_message', async (data) => {
      try {
        const { taskId, senderId, receiverId, content } = data;

        if (!taskId || !senderId || !receiverId || !content) {
          return socket.emit('error', { message: 'Missing message parameters.' });
        }

        const message = await prisma.message.create({
          data: {
            taskId,
            senderId,
            receiverId,
            content: content.trim(),
          },
          include: {
            sender: {
              select: { id: true, name: true, avatar: true, isVerified: true },
            },
          },
        });

        // Broadcast to everyone in the task room
        io.to(`task_${taskId}`).emit('new_message', message);

        // Also notify receiver on their personal notification channel
        io.to(`user_${receiverId}`).emit('notification_received', {
          type: 'MESSAGE',
          title: `New message from ${message.sender.name}`,
          message: content,
          link: `/tasks/${taskId}?tab=chat`,
        });
      } catch (err) {
        console.error('[Socket.IO send_message error]:', err);
        socket.emit('error', { message: 'Could not send message.' });
      }
    });

    // Typing indicators
    socket.on('typing_start', ({ taskId, userName }) => {
      socket.to(`task_${taskId}`).emit('user_typing', { userName });
    });

    socket.on('typing_stop', ({ taskId }) => {
      socket.to(`task_${taskId}`).emit('user_stopped_typing');
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupSockets;
