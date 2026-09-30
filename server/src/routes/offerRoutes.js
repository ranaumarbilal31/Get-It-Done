const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { authenticate } = require('../middleware/auth');
const { validate, offerSchemas } = require('../middleware/validate');

router.post('/task/:taskId', authenticate, validate(offerSchemas.createOffer), offerController.createOffer);
router.get('/task/:taskId', authenticate, offerController.getTaskOffers);
router.post('/:id/accept', authenticate, offerController.acceptOffer);
router.post('/:id/withdraw', authenticate, offerController.withdrawOffer);

module.exports = router;
