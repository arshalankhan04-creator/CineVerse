const express = require('express');
const { submitScore, getLeaderboard } = require('../controllers/triviaController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/score', protect, submitScore);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
