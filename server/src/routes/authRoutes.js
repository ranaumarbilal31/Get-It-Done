const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validate, authSchemas } = require('../middleware/validate');

router.post('/register', validate(authSchemas.register), authController.register);
router.post('/login', validate(authSchemas.login), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, upload.single('avatar'), validate(authSchemas.updateProfile), authController.updateProfile);
router.post('/verify-id', authenticate, upload.single('idDocument'), validate(authSchemas.verifyId), authController.submitVerification);

module.exports = router;
