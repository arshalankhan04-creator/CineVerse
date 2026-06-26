const express = require('express');
const { addOrUpdateReview, getReviewsForMedia, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/:mediaType/:tmdbId', getReviewsForMedia);

// Protected routes
router.use(protect);
router.post('/', addOrUpdateReview);
router.delete('/:id', deleteReview);

module.exports = router;
