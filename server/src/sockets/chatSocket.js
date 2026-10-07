const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { getConversation, createMessage, broadcastMessage } = require('../services/chatService');
module.exports = function setupSockets(io) {
  io.use(async (socket, next) => {
    try {
      const decoded = jwt.verify(
        socket.handshake.auth?.token || '',
        process.env.JWT_SECRET || 'getitdone_dev_secret_key_change_in_production_998877',
        { algorithms: ['HS256'] },
      );
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, sessionVersion: true, isEmailVerified: true },
      });
      if (!user || !user.isEmailVerified || user.sessionVersion !== (decoded.sessionVersion || 0))
        throw new Error('Session invalid');
      socket.data.user = user;
      socket.data.expiresAt = decoded.exp * 1000;
      next();
    } catch {
      next(new Error('Authentication required.'));
    }
  });
  io.on('connection', (socket) => {
    const user = socket.data.user;
    socket.join('user_' + user.id);
    const expiryTimer = setTimeout(
      () => socket.disconnect(true),
      Math.min(socket.data.expiresAt - Date.now(), 2147483647),
    );
    const guard =
      (handler) =>
      async (...args) => {
        const ack = typeof args[args.length - 1] === 'function' ? args.pop() : null;
        try {
          if (Date.now() >= socket.data.expiresAt) throw new Error('Session expired.');
          const current = await prisma.user.findUnique({
            where: { id: user.id },
            select: { sessionVersion: true, isEmailVerified: true },
          });
          if (!current?.isEmailVerified || current.sessionVersion !== user.sessionVersion) {
            socket.disconnect(true);
            throw new Error('Session invalid');
          }
          const result = await handler(...args);
          ack?.({ ok: true, ...result });
        } catch (error) {
          const response = {
            ok: false,
            message: error.status ? error.message : 'Conversation action failed.',
          };
          if (ack) ack(response);
          else socket.emit('chat_error', response);
        }
      };
    socket.on(
      'join_user',
      guard(async (id) => {
        if (id !== user.id)
          throw Object.assign(new Error('Cannot join another user channel.'), { status: 403 });
        socket.join('user_' + user.id);
      }),
    );
    socket.on(
      'join_task',
      guard(async (taskId) => {
        await getConversation(taskId, user.id);
        await socket.join('task_' + taskId);
      }),
    );
    socket.on('leave_task', (id) => typeof id === 'string' && socket.leave('task_' + id));
    socket.on(
      'send_message',
      guard(async (data = {}) => {
        const now = Date.now();
        if (now - (socket.data.lastMessage || 0) < 500)
          throw Object.assign(new Error('Please wait before sending another message.'), {
            status: 429,
          });
        socket.data.lastMessage = now;
        const result = await createMessage(data.taskId, user, data.content, data.receiverId);
        broadcastMessage(io, result);
        return { message: result.message };
      }),
    );
    socket.on(
      'typing_start',
      guard(async ({ taskId } = {}) => {
        await getConversation(taskId, user.id);
        socket.to('task_' + taskId).emit('user_typing', { userName: user.name });
      }),
    );
    socket.on(
      'typing_stop',
      guard(async ({ taskId } = {}) => {
        await getConversation(taskId, user.id);
        socket.to('task_' + taskId).emit('user_stopped_typing');
      }),
    );
    socket.on('disconnect', () => clearTimeout(expiryTimer));
  });
};
