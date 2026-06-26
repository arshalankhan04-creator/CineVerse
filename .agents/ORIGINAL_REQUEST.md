# Original User Request

## Initial Request — 2026-06-26T17:48:33+05:30

# Teamwork Project Prompt

Build CineVerse, a full-stack premium cinematic discovery platform. Users can browse TMDB media, create accounts (JWT auth), manage watchlists/collections, view personal stats, compare media, and play trivia.

Working directory: c:\Users\ArsalaanKhan\teamwork_projects\cineverse
Integrity mode: development

## Requirements

### R1. Full-Stack Foundation
Implement a Next.js frontend and a Node.js backend with MongoDB, utilizing JWT for user registration, login, and session management.

### R2. Media Discovery & TMDB Integration
Integrate with the TMDB API to populate the Home, Explore, Details, and Release Calendar pages with real movies, TV shows, and people. Include a Recommendation Wizard.

### R3. User-Specific Curation & Engagement
Enable authenticated users to manage a personal Watchlist, create Custom Collections, view personalized Stats calculated from their saved items, and play an interactive Trivia Quiz that records scores on a leaderboard.

### R4. Public Access (Guest Mode)
Ensure all discovery features, the Compare tool, the Recommendation Wizard, and the Trivia Quiz are accessible to unauthenticated guest users, prompting for login only for data-saving actions.

## Acceptance Criteria

### Authentication Flow
- [ ] An automated test or manual check confirms that a user can register, log in, and receive a valid JWT.
- [ ] Attempting to access protected routes (e.g., adding to Watchlist) without a JWT returns a 401 Unauthorized error.

### Media & Integration
- [ ] The application successfully fetches and displays trending movies from the TMDB API on the frontend.
- [ ] The Compare tool successfully renders side-by-side metrics for two searched titles.

### Curation & Gamification
- [ ] A logged-in user can add an item to their Watchlist, and it successfully persists in the MongoDB database.
- [ ] The Trivia Quiz generates 10 questions, and a logged-in user's final score is successfully posted to the backend leaderboard.
