const express = require('express');
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../controllers/watchlistController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Protect all routes in this file

router.route('/')
  .get(getWatchlist)
  .post(addToWatchlist);

router.route('/:tmdbId')
  .delete(removeFromWatchlist);

module.exports = router;
