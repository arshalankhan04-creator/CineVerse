# Scope: Implementation Orchestrator

## Architecture
CineVerse is a full-stack cinematic discovery application with the following components:
1. **Frontend**: Next.js/React SPA using React Router for navigation and Tailwind CSS for styling. Interacts with the backend API for user curation/gamification, and communicates with TMDB via a serverless proxy function (`/api/tmdb`) or direct client calls (in dev mode) for media discovery.
2. **Backend**: Node.js Express server connected to MongoDB. Exposes REST endpoints for JWT authentication, Watchlists, Custom Collections, and Trivia Leaderboards.
3. **Database**: MongoDB storing User profiles, Watchlist items, Custom Collections, and Trivia Scores.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M2 | Backend Authentication | Ensure JWT registration, login, profile endpoints work & pass tests | None | PLANNED |
| M3 | Curation APIs | Implement watchlist & custom list API endpoints and unique constraints | M2 | PLANNED |
| M4 | Trivia APIs | Implement score posting & leaderboard sorting API endpoints | M2 | PLANNED |
| M5 | Frontend Auth & Shell | Wire up AuthModal, AuthContext, route protection, profile | M2 | PLANNED |
| M6 | Frontend Discovery & Wizard | Integrate TMDB API proxy on home, explore, detail, calendar, recommendation wizard | None | PLANNED |
| M7 | Frontend Curation & Trivia | Add UI watchlist/list management, show stats, quiz game integration | M3, M4, M5, M6 | PLANNED |
| M8 | Compare Tool | Implement side-by-side search and metric comparison | M6 | PLANNED |

## Interface Contracts
### Frontend ↔ Backend (Authentication)
- `POST /api/auth/register`: `{ username, email, password }` -> `{ token, user: { id, username, email } }` (201 Created)
- `POST /api/auth/login`: `{ email, password }` -> `{ token, user: { id, username, email } }` (200 OK)
- `GET /api/auth/me`: Headers: `Authorization: Bearer <JWT>` -> `{ data: { id, username, email, profileTheme } }` (200 OK)
- `PUT /api/auth/me`: Headers: `Authorization: Bearer <JWT>`, Body: `{ theme }` -> `{ data: { id, username, email, profileTheme } }` (200 OK)

### Frontend ↔ Backend (Watchlist)
- `GET /api/watchlist`: Headers: `Authorization: Bearer <JWT>` -> `{ data: [{ id, tmdbId, mediaType, title, posterPath }] }` (200 OK)
- `POST /api/watchlist`: Headers: `Authorization: Bearer <JWT>`, Body: `{ tmdbId, mediaType, title, posterPath }` -> `{ data: { id, tmdbId, mediaType, title, posterPath } }` (201 Created)
- `DELETE /api/watchlist/:tmdbId`: Headers: `Authorization: Bearer <JWT>` -> `{ message: "Item removed" }` (200 OK)

### Frontend ↔ Backend (Custom Lists)
- `GET /api/lists`: Headers: `Authorization: Bearer <JWT>` -> `{ data: [{ id, name, description, items: [...] }] }` (200 OK)
- `POST /api/lists`: Headers: `Authorization: Bearer <JWT>`, Body: `{ name, description, items }` -> `{ data: { id, name, description, items } }` (201 Created)
- `PUT /api/lists/:id/items`: Headers: `Authorization: Bearer <JWT>`, Body: `{ items: [...] }` -> `{ data: { id, name, description, items } }` (200 OK)
- `DELETE /api/lists/:id`: Headers: `Authorization: Bearer <JWT>` -> `{ message: "List deleted" }` (200 OK)

### Frontend ↔ Backend (Trivia)
- `POST /api/trivia/score`: Headers: `Authorization: Bearer <JWT>`, Body: `{ score, category }` -> `{ data: { id, score, category, user: { username } } }` (201 Created)
- `GET /api/trivia/leaderboard`: -> `{ data: [{ score, category, user: { username } }] }` (200 OK)
