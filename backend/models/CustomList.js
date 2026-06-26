const mongoose = require('mongoose');

const CustomListSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a list name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  items: [{
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
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CustomList', CustomListSchema);
