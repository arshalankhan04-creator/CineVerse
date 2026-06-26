const mongoose = require('mongoose');

const TriviaScoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true,
    default: 0
  },
  category: {
    type: String,
    default: 'general'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TriviaScore', TriviaScoreSchema);
