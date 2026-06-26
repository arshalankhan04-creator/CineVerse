const Watched = require('../models/Watched');

// @desc    Get all watched items for a user
// @route   GET /api/watched
// @access  Private
exports.getWatched = async (req, res) => {
  try {
    const watched = await Watched.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: watched
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// @desc    Get watched stats for a user (count and watch time)
// @route   GET /api/watched/stats
// @access  Private
exports.getWatchedStats = async (req, res) => {
  try {
    const stats = await Watched.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          moviesWatchedCount: { $sum: 1 },
          totalWatchTimeMinutes: { $sum: '$runtime' }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          moviesWatchedCount: 0,
          totalWatchTimeMinutes: 0
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        moviesWatchedCount: stats[0].moviesWatchedCount,
        totalWatchTimeMinutes: stats[0].totalWatchTimeMinutes
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// @desc    Add item to watched history
// @route   POST /api/watched
// @access  Private
exports.addToWatched = async (req, res) => {
  try {
    const { tmdbId, mediaType, title, posterPath, runtime } = req.body;

    // Check if already watched
    const existing = await Watched.findOne({ user: req.user.id, tmdbId });
    if (existing) {
      return res.status(400).json({ error: 'Item already marked as watched' });
    }

    const watched = await Watched.create({
      user: req.user.id,
      tmdbId,
      mediaType,
      title,
      posterPath,
      runtime: runtime || 0
    });

    res.status(201).json({
      success: true,
      data: watched
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// @desc    Remove item from watched history
// @route   DELETE /api/watched/:tmdbId
// @access  Private
exports.removeFromWatched = async (req, res) => {
  try {
    const watched = await Watched.findOneAndDelete({ 
      user: req.user.id, 
      tmdbId: req.params.tmdbId 
    });

    if (!watched) {
      return res.status(404).json({ error: 'Watched item not found' });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
