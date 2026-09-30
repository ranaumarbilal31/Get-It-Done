const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');
const { validate, reviewSchemas } = require('../middleware/validate');

router.post('/task/:taskId', authenticate, validate(reviewSchemas.createReview), reviewController.createReview);
router.get('/user/:userId', reviewController.getUserReviews);

module.exports = router;
