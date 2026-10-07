const prisma = require('../config/prisma');
const fail = (status, message) => Object.assign(new Error(message), { status });

async function getConversation(taskId, userId) {
  if (typeof taskId !== 'string' || !taskId) throw fail(400, 'Invalid task.');
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { offers: { where: { status: 'ACCEPTED' } } },
  });
  if (!task) throw fail(404, 'Task not found.');
  const taskerId = task.offers[0]?.taskerId;
  if (!taskerId || ![task.posterId, taskerId].includes(userId))
    throw fail(403, 'Only the poster and hired tasker can access this conversation.');
  return { task, receiverId: userId === task.posterId ? taskerId : task.posterId };
}

async function createMessage(taskId, user, content, requestedReceiver) {
  if (typeof content !== 'string' || !content.trim() || content.trim().length > 5000)
    throw fail(400, 'Message must contain 1–5000 characters.');
  const { receiverId } = await getConversation(taskId, user.id);
  if (requestedReceiver && requestedReceiver !== receiverId)
    throw fail(403, 'Invalid conversation recipient.');
  return prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: { taskId, senderId: user.id, receiverId, content: content.trim() },
      include: { sender: { select: { id: true, name: true, avatar: true, isVerified: true } } },
    });
    const notification = await tx.notification.create({
      data: {
        userId: receiverId,
        type: 'MESSAGE',
        title: `New message from ${user.name}`,
        message: content.trim().slice(0, 100),
        link: `/tasks/${taskId}?tab=chat`,
      },
    });
    return { message, notification };
  });
}

function broadcastMessage(io, result) {
  io.to(`task_${result.message.taskId}`).emit('new_message', result.message);
  io.to(`user_${result.notification.userId}`).emit('notification_received', result.notification);
}
module.exports = { getConversation, createMessage, broadcastMessage };
