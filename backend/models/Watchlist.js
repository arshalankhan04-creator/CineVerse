const mongoose = require('mongoose');

const WatchlistSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true
  },
  posterPath: {
    type: String
  },
  rating: {
    type: Number
  }
}, {
  timestamps: true
});

// Ensure a user cannot add the same movie/tv show multiple times
WatchlistSchema.index({ user: 1, tmdbId: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', WatchlistSchema);
