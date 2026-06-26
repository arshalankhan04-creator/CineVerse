const TriviaScore = require('../models/TriviaScore');

// @desc    Submit new score
// @route   POST /api/trivia/score
// @access  Private
exports.submitScore = async (req, res) => {
  try {
    req.body.user = req.user.id;
    const score = await TriviaScore.create(req.body);
    res.status(201).json({
      success: true,
      data: {
        id: score._id,
        _id: score._id,
        score: score.score,
        category: score.category,
        user: {
          username: req.user.username
        }
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// @desc    Get top 10 leaderboard
// @route   GET /api/trivia/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await TriviaScore.find()
      .populate('user', 'username profileTheme')
      .sort({ score: -1 })
      .limit(10);
      
    res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
