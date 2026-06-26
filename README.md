# 🎬 CineVerse

A modern, feature-rich movie & TV show discovery platform built with React, powered by the TMDB API, and backed by a Node.js/MongoDB backend.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)

---

## ✨ Features

- 🔍 **Explore & Search** — Browse popular, trending, and top-rated movies & TV shows
- 🎭 **Detailed Info** — Full movie/TV details with cast, trailers, reviews, and recommendations
- 👤 **Person Profiles** — Actor & crew filmography pages
- 📋 **Watchlist** — Save movies and shows to watch later
- 📂 **Custom Lists** — Create and share curated collections
- ⭐ **Reviews** — Rate and review movies/shows
- 📊 **Stats Dashboard** — Visualize your watching habits
- 🆚 **Compare** — Side-by-side movie/TV show comparison
- 🧠 **Movie Quiz** — Test your cinema knowledge with trivia
- 🎯 **Recommendations** — Get personalized suggestions
- 📅 **Release Calendar** — Track upcoming releases
- 🔐 **Auth System** — JWT-based registration & login
- 📱 **Responsive** — Works great on mobile, tablet, and desktop

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, React Router 7, Vite 8 |
| **Styling** | Tailwind CSS 4 |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose) |
| **Auth** | JWT (JSON Web Tokens) |
| **API** | TMDB (The Movie Database) |
| **Deployment** | Vercel (frontend + serverless API proxy) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [TMDB API Key](https://www.themoviedb.org/settings/api) (free)
- [MongoDB Atlas](https://cloud.mongodb.com/) account (for backend)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/CineVerse.git
cd CineVerse
```

### 2. Setup Frontend

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env` and add your TMDB API key:
```env
VITE_TMDB_KEY=your_tmdb_api_key
REACT_APP_TMDB_KEY=your_tmdb_api_key
```

### 3. Setup Backend

```bash
cd backend
npm install

# Create environment file
cp .env.example .env
```

Edit `backend/.env` with your MongoDB URI and a strong JWT secret:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://your_user:your_password@your_cluster.mongodb.net/cineverse
JWT_SECRET=your_strong_random_secret_here
JWT_EXPIRE=30d
```

> 💡 **Tip:** Generate a strong JWT secret:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4. Run the app

```bash
# Frontend (from root)
npm run dev

# Backend (from /backend)
cd backend
node server.js
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:5000`.

---

## 📁 Project Structure

```
CineVerse/
├── api/                  # Vercel serverless functions (API proxy)
├── backend/              # Express.js backend
│   ├── config/           # Database configuration
│   ├── controllers/      # Route handlers
│   ├── middleware/        # Auth middleware
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   └── tests/            # Backend unit tests
├── public/               # Static assets
├── src/                  # React frontend
│   ├── components/       # Reusable UI components
│   ├── context/          # React Context providers
│   ├── pages/            # Page components
│   └── services/         # TMDB API service layer
├── e2e-tests/            # End-to-end tests
└── .env.example          # Environment template
```

---

## 🔒 Security

- API keys are **never** committed to the repository
- Production TMDB requests are proxied through a serverless function to keep the key server-side
- JWT-based authentication with secure token validation
- MongoDB credentials stored only in local `.env` files
- CORS restricted to configured domains in production

---

## 📄 License

This project is for educational and personal use.

---

## 🙏 Acknowledgements

- [TMDB](https://www.themoviedb.org/) for the movie & TV data API
- [Unsplash](https://unsplash.com/) for fallback imagery
