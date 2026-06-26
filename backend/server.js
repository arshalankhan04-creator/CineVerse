const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/watchlist', require('./routes/watchlistRoutes'));
app.use('/api/lists', require('./routes/listRoutes'));
app.use('/api/trivia', require('./routes/triviaRoutes'));
app.use('/api/watched', require('./routes/watchedRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.send('CineVerse API is running...');
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app; // export for testing
