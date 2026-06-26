const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ error: 'User already exists with that email' });
    }
    
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileTheme: user.profileTheme,
        favoriteGenres: user.favoriteGenres,
        membershipTier: user.membershipTier
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileTheme: user.profileTheme,
        favoriteGenres: user.favoriteGenres,
        membershipTier: user.membershipTier
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// @desc    Update user favorite genres
// @route   PUT /api/auth/me/genres
// @access  Private
exports.updateGenres = async (req, res) => {
  try {
    const { genres } = req.body;
    
    if (!Array.isArray(genres)) {
      return res.status(400).json({ error: 'Genres must be an array' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { favoriteGenres: genres },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user.favoriteGenres
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
