const express = require('express');
const { register, login, getMe, updateGenres, updateProfileTheme } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me/genres', protect, updateGenres);
router.put('/me', protect, updateProfileTheme);

module.exports = router;
