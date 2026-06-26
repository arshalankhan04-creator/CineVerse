const express = require('express');
const { getWatched, getWatchedStats, addToWatched, removeFromWatched } = require('../controllers/watchedController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All watched routes are protected

router.route('/')
  .get(getWatched)
  .post(addToWatched);

router.get('/stats', getWatchedStats);

router.delete('/:tmdbId', removeFromWatched);

module.exports = router;
