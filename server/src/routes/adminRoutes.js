const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate, adminSchemas } = require('../middleware/validate');

router.use(authenticate, requireAdmin);

router.get('/health', adminController.getDetailedHealth);
router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/verifications/pending', adminController.getPendingVerifications);
router.get('/verifications/:userId/document', adminController.getVerificationDocument);
router.patch('/verifications/:userId', validate(adminSchemas.updateVerification), adminController.updateVerificationStatus);
router.patch('/users/:userId/role', validate(adminSchemas.toggleRole), adminController.toggleUserRole);

module.exports = router;
