const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  tmdbId: {
    type: Number,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['movie', 'tv'],
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  reviewText: {
    type: String,
    trim: true,
    maxlength: [1000, 'Review cannot be more than 1000 characters']
  }
}, {
  timestamps: true
});

// Ensure a user can only review/rate a specific movie/TV show once
ReviewSchema.index({ user: 1, tmdbId: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
