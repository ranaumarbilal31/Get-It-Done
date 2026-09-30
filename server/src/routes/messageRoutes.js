const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.get('/task/:taskId', authenticate, messageController.getTaskMessages);
router.post('/task/:taskId', authenticate, messageController.sendMessage);

module.exports = router;
