const prisma = require('../config/prisma');

const getTaskMessages = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        offers: {
          where: { status: 'ACCEPTED' },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Mark messages as read for this user
    await prisma.message.updateMany({
      where: {
        taskId,
        receiverId: req.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    const messages = await prisma.message.findMany({
      where: { taskId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content, receiverId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content cannot be empty.' });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        offers: { where: { status: 'ACCEPTED' } },
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    let targetReceiverId = receiverId;
    if (!targetReceiverId) {
      // Auto-determine receiver
      if (req.user.id === task.posterId) {
        // If poster is sending, send to accepted tasker
        if (task.offers.length > 0) {
          targetReceiverId = task.offers[0].taskerId;
        } else {
          return res.status(400).json({ message: 'No recipient specified for this task message.' });
        }
      } else {
        // If tasker is sending, recipient is the poster
        targetReceiverId = task.posterId;
      }
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        taskId,
        senderId: req.user.id,
        receiverId: targetReceiverId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
    });

    // Create Notification for receiver
    await prisma.notification.create({
      data: {
        userId: targetReceiverId,
        type: 'MESSAGE',
        title: `New message from ${req.user.name}`,
        message: content.length > 50 ? `${content.substring(0, 50)}...` : content,
        link: `/tasks/${taskId}?tab=chat`,
      },
    });

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTaskMessages,
  sendMessage,
};
