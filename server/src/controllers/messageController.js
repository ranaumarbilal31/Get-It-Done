const prisma = require('../config/prisma');
const { getConversation, createMessage, broadcastMessage } = require('../services/chatService');
exports.getTaskMessages = async (req, res, next) => {
  try {
    await getConversation(req.params.taskId, req.user.id);
    await prisma.message.updateMany({
      where: { taskId: req.params.taskId, receiverId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    const messages = await prisma.message.findMany({
      where: { taskId: req.params.taskId },
      include: { sender: { select: { id: true, name: true, avatar: true, isVerified: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ messages });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  }
};
exports.sendMessage = async (req, res, next) => {
  try {
    const result = await createMessage(
      req.params.taskId,
      req.user,
      req.body.content,
      req.body.receiverId,
    );
    broadcastMessage(req.app.get('io'), result);
    res.status(201).json({ message: result.message });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  }
};
