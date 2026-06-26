const mongoose = require('mongoose');

const WatchedSchema = new mongoose.Schema({
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
  runtime: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure a user cannot mark the same movie/tv show multiple times as watched
WatchedSchema.index({ user: 1, tmdbId: 1 }, { unique: true });

module.exports = mongoose.model('Watched', WatchedSchema);
