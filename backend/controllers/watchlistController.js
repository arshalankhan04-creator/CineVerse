const Watchlist = require('../models/Watchlist');

// @desc    Get user watchlist
// @route   GET /api/watchlist
// @access  Private
exports.getWatchlist = async (req, res) => {
  try {
    const watchlist = await Watchlist.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({
      success: true,
      count: watchlist.length,
      data: watchlist
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Add to watchlist
// @route   POST /api/watchlist
// @access  Private
exports.addToWatchlist = async (req, res) => {
  try {
    req.body.user = req.user.id;

    // Check if already exists
    const existing = await Watchlist.findOne({ user: req.user.id, tmdbId: req.body.tmdbId });
    if (existing) {
      return res.status(400).json({ error: 'Item already in watchlist' });
    }

    const item = await Watchlist.create(req.body);

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// @desc    Remove from watchlist
// @route   DELETE /api/watchlist/:tmdbId
// @access  Private
exports.removeFromWatchlist = async (req, res) => {
  try {
    const item = await Watchlist.findOneAndDelete({ 
      user: req.user.id, 
      tmdbId: req.params.tmdbId 
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found in watchlist' });
    }

    res.status(200).json({ success: true, message: "Item removed", data: {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
