const router = require('express').Router();
const prisma = require('../config/prisma');
router.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        isVerified: true,
        ratingAvg: true,
        ratingCount: true,
        createdAt: true,
      },
    });
    if (!user)
      return res.status(404).json({ code: 'NOT_FOUND', message: 'This profile does not exist.' });
    res.json({ user });
  } catch (error) {
    next(error);
  }
});
module.exports = router;
