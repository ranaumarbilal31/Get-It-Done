const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validate, taskSchemas } = require('../middleware/validate');

router.get('/', optionalAuth, taskController.getTasks);
router.get('/:id', optionalAuth, taskController.getTaskById);
router.post('/', authenticate, upload.array('images', 5), validate(taskSchemas.createTask), taskController.createTask);
router.put('/:id', authenticate, validate(taskSchemas.updateTask), taskController.updateTask);
router.patch('/:id/complete', authenticate, taskController.completeTask);
router.delete('/:id', authenticate, taskController.deleteTask);

module.exports = router;
