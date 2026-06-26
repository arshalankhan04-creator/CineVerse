const Review = require('../models/Review');

// @desc    Add or update user review
// @route   POST /api/reviews
// @access  Private
exports.addOrUpdateReview = async (req, res) => {
  try {
    const { tmdbId, mediaType, rating, reviewText } = req.body;
    const userId = req.user.id;

    if (!tmdbId || !mediaType || !rating) {
      return res.status(400).json({ error: 'Please provide tmdbId, mediaType, and rating' });
    }

    // Find if review already exists
    let review = await Review.findOne({ user: userId, tmdbId });

    if (review) {
      // Update existing review
      review.rating = rating;
      review.reviewText = reviewText;
      review.mediaType = mediaType; // ensure correctness
      await review.save();
    } else {
      // Create new review
      review = await Review.create({
        user: userId,
        tmdbId,
        mediaType,
        rating,
        reviewText
      });
    }

    // Populate user details for immediate client sync
    const populatedReview = await Review.findById(review._id).populate('user', 'username profileTheme');

    res.status(200).json({
      success: true,
      data: populatedReview
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// @desc    Get all reviews for a specific movie/TV show
// @route   GET /api/reviews/:mediaType/:tmdbId
// @access  Public
exports.getReviewsForMedia = async (req, res) => {
  try {
    const { mediaType, tmdbId } = req.params;

    const reviews = await Review.find({ tmdbId, mediaType })
      .populate('user', 'username profileTheme')
      .sort('-createdAt');

    const count = reviews.length;
    const averageRating = count > 0 
      ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
      : 0;

    res.status(200).json({
      success: true,
      count,
      averageRating,
      data: reviews
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Delete user review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Make sure review belongs to user
    if (review.user.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized to delete this review' });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review deleted',
      data: {}
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
