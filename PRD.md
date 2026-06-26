# Product Requirements Document (PRD)

## 1. Project Overview

* **Product Name:** CineVerse
* **Purpose:** A comprehensive platform for discovering, tracking, comparing, and gamifying the movie and TV show experience.
* **Problem Statement:** Movie and TV enthusiasts lack a centralized, engaging hub to seamlessly discover new content, maintain personal watchlists, compare titles side-by-side, view personal viewing statistics, and engage with cinematic trivia in one unified experience.
* **Vision:** To be the ultimate cinematic companion app that brings the entire universe of movies and TV shows to users' fingertips through rich data, intuitive design, and interactive features.
* **Goals:** 
  - Provide an intuitive UI for discovering movies and TV shows using TMDB data.
  - Offer personalized media tracking through Watchlists and Custom Collections.
  - Gamify the user experience with dynamic trivia quizzes and leaderboards.
  - Provide insightful, personalized user statistics ("Wrapped" style).
* **Target Audience:** Movie buffs, TV show bingers, and general entertainment consumers looking for organized tracking, discovery, and engagement.

## 2. Product Summary

CineVerse is a feature-rich web application that allows users to explore the world of cinema and television. From a user's perspective, the application provides a modern interface to browse trending, upcoming, and top-rated media. Users can search for specific titles or people, view in-depth details (cast, crew, trailers), and utilize a recommendation wizard to find new content based on specific criteria. Registered users can curate a personal Watchlist, create Custom Lists, view personalized viewing statistics based on their saved items, compare two titles side-by-side, keep track of upcoming releases via a calendar, and test their knowledge with an interactive trivia quiz.

## 3. User Roles

### Guest (Unauthenticated User)
* **Permissions:** Read-only access to public endpoints and external API data.
* **Responsibilities:** Can browse the Home page, search for media in Explore, view detailed pages (Movie, TV, Person), use the Compare tool, use the Recommendation wizard, and view the Release Calendar.

### Authenticated User
* **Permissions:** Full access to standard user features.
* **Responsibilities:** All Guest capabilities plus registering an account, logging in, managing a personal Watchlist, creating and editing Custom Lists, playing the Trivia Quiz and submitting scores to the leaderboard, viewing personalized Stats, and customizing their profile theme.

## 4. Core Features

### 4.1 User Authentication
* **Feature Name:** Authentication System
* **Description:** Secure registration and login system using JWT.
* **User Goal:** To create a personalized account to save data securely.
* **Inputs:** Username, Email, Password.
* **Outputs:** JWT token, User profile data.
* **Preconditions:** None.
* **Postconditions:** User session is established via local storage token.
* **Success Criteria:** User can successfully register, log in, and access protected routes.

### 4.2 Explore & Search
* **Feature Name:** Media Discovery
* **Description:** Search functionality for movies, TV shows, and people using TMDB.
* **User Goal:** To find specific cinematic content or browse by categories.
* **Inputs:** Search queries.
* **Outputs:** List of matching media cards.
* **Preconditions:** None.
* **Postconditions:** None.
* **Success Criteria:** Accurate search results are returned and displayed in an intuitive grid.

### 4.3 Detailed Media Views
* **Feature Name:** Details Pages
* **Description:** Comprehensive details for Movies, TV Shows, and Persons.
* **User Goal:** To view synopsis, cast, ratings, trailers, and related recommendations for a specific title.
* **Inputs:** TMDB ID via URL.
* **Outputs:** Detailed media information, backdrop images, cast list.
* **Preconditions:** Valid TMDB ID.
* **Postconditions:** None.
* **Success Criteria:** Data is accurately fetched and displayed without layout breakage.

### 4.4 Watchlist Management
* **Feature Name:** Personal Watchlist
* **Description:** Ability to save movies and TV shows for future viewing.
* **User Goal:** To keep track of media they want to watch.
* **Inputs:** Media item (TMDB ID, title, poster, type).
* **Outputs:** Updated Watchlist UI.
* **Preconditions:** User must be logged in.
* **Postconditions:** Item is saved to the database associated with the user.
* **Success Criteria:** Users can seamlessly add and remove items without duplicates.

### 4.5 Custom Collections
* **Feature Name:** Custom Lists
* **Description:** Users can create custom, named collections of media.
* **User Goal:** To group media by personal themes (e.g., "Favorite Sci-Fi", "Halloween Movies").
* **Inputs:** List name, description, media items.
* **Outputs:** A new Custom List.
* **Preconditions:** User must be logged in.
* **Postconditions:** List is saved in the database.
* **Success Criteria:** Users can create, update, and delete custom lists.

### 4.6 Recommendation Wizard
* **Feature Name:** Recommend
* **Description:** A step-by-step wizard to find media based on Type, Genre, Era, and Rating.
* **User Goal:** To find something to watch when undecided.
* **Inputs:** Type (Movie/TV), Genres, Era (Classic, Golden, Modern), Min Rating.
* **Outputs:** Top 8 recommended titles matching the criteria.
* **Preconditions:** None.
* **Postconditions:** None.
* **Success Criteria:** The wizard accurately filters TMDB data and returns highly relevant results.

### 4.7 Release Calendar
* **Feature Name:** Calendar
* **Description:** A timeline of upcoming movie and TV releases.
* **User Goal:** To see what is coming out soon and set local reminders.
* **Inputs:** None (fetches automatically).
* **Outputs:** Chronological list of upcoming media.
* **Preconditions:** None.
* **Postconditions:** Reminders can be saved to local storage.
* **Success Criteria:** Displays accurate future release dates sorted chronologically.

### 4.8 Personalized Stats
* **Feature Name:** User Stats (Wrapped)
* **Description:** An aggregated statistical view based on the user's watchlist.
* **User Goal:** To see insights into their viewing habits (total minutes, top genres, eras, budget totals).
* **Inputs:** User's Watchlist data.
* **Outputs:** Statistical dashboard.
* **Preconditions:** User must have items in their Watchlist.
* **Postconditions:** None.
* **Success Criteria:** Calculates and visualizes accurate aggregations without performance lag.

### 4.9 Media Comparison
* **Feature Name:** Compare Tool
* **Description:** Side-by-side statistical comparison of two movies or TV shows.
* **User Goal:** To compare ratings, budget, revenue, and runtime between two titles.
* **Inputs:** Search query for Slot A and Slot B.
* **Outputs:** Comparative UI highlighting the "winner" in various metrics.
* **Preconditions:** None.
* **Postconditions:** None.
* **Success Criteria:** Users can easily search, select, and view a visual comparison of two entities.

### 4.10 Trivia Quiz
* **Feature Name:** Cinematic Quiz
* **Description:** Dynamically generated trivia questions based on trending movies.
* **User Goal:** To test movie knowledge and compete on a leaderboard.
* **Inputs:** User answers to multiple-choice questions.
* **Outputs:** Score, Leaderboard ranking.
* **Preconditions:** User must be logged in to submit a score.
* **Postconditions:** Score is recorded in the database if logged in.
* **Success Criteria:** Questions are generated logically without errors, and the leaderboard updates correctly.

## 5. Functional Requirements

* **FR-001:** The system shall allow users to register using a username, email, and password.
  * **Priority:** High
  * **Dependencies:** Backend Auth routes, User Model.
* **FR-002:** The system shall authenticate users and issue a JWT valid for subsequent API requests.
  * **Priority:** High
  * **Dependencies:** FR-001.
* **FR-003:** The frontend shall integrate with the TMDB API to fetch trending, popular, and upcoming media.
  * **Priority:** High
  * **Dependencies:** Valid TMDB API Key.
* **FR-004:** The system shall prevent users from adding duplicate media items to their Watchlist.
  * **Priority:** Medium
  * **Dependencies:** Watchlist database schema unique constraints.
* **FR-005:** The Trivia Quiz engine shall dynamically generate questions by comparing TMDB data (e.g., higher rating, older release date) of trending movies.
  * **Priority:** Medium
  * **Dependencies:** TMDB trending endpoint.
* **FR-006:** The system shall calculate personalized statistics by fetching detailed TMDB data for every item in a user's watchlist.
  * **Priority:** Medium
  * **Dependencies:** Watchlist data, TMDB details endpoints.
* **FR-007:** The Compare tool shall allow users to independently search and select two distinct media entities for side-by-side rendering.
  * **Priority:** Low
  * **Dependencies:** TMDB multi-search endpoint.

## 6. User Journey

**The "Movie Buff" Journey:**
1. **Landing:** User arrives at the Home page, views trending movies and a visually rich hero section.
2. **Discovery:** User navigates to the "Explore" page, searches for "Inception", and clicks to view the Movie Details.
3. **Engagement:** Impressed, the user attempts to add the movie to their Watchlist but is prompted to log in.
4. **Registration:** The user creates an account via the Auth Modal.
5. **Curation:** Once logged in, the user successfully adds "Inception" to the Watchlist and creates a Custom List named "Mind-Bending Sci-Fi".
6. **Gamification:** The user navigates to the Quiz page, plays a 10-question trivia game, and submits their score to the leaderboard.
7. **Insight:** The user visits the Stats page to view their newly generated viewing statistics.

## 7. User Flows

### Registration & Login Flow
1. User clicks "Sign In" on Navbar.
2. Auth Modal opens (Login view).
3. User toggles to "Register".
4. User enters Username, Email, Password.
5. Form is validated client-side.
6. API call made to `/auth/register`.
7. Success response sets JWT in local storage.
8. Modal closes, UI updates to show Profile Avatar.

### Adding to Watchlist Flow
1. User is logged in and viewing a MovieCard.
2. User clicks the "Bookmark/Add" icon.
3. Client makes a POST request to `/api/watchlist` with media details.
4. Server validates no duplicates exist and saves the item.
5. Client receives success response and updates global AuthContext state.
6. Toast notification confirms success.

### Quiz Generation & Play Flow
1. User navigates to `/quiz`.
2. Client fetches Top Trending Movies from TMDB.
3. Quiz engine randomizes 10 questions comparing data points (Ratings, Dates, Descriptions) of these movies.
4. User answers questions one by one.
5. Upon completion, total score is displayed.
6. If logged in, score is POSTed to `/api/trivia/score`.
7. Leaderboard is re-fetched and displayed.

## 8. Business Rules

* **Validation Rules:** Usernames must be unique and max 50 chars. Emails must follow standard regex formatting. Passwords must be at least 6 characters.
* **Authentication Rules:** Protected API routes require a valid Bearer JWT in the Authorization header. If a 401 is received, the client must clear the token.
* **Data Ownership Rules:** Users can only view, edit, or delete their own Watchlist and Custom List items.
* **Uniqueness Rules:** A specific `tmdbId` can only exist once per user in their Watchlist.
* **Quiz Rules:** A quiz requires a minimum pool of 5 trending movies to generate valid comparative questions.
* **Stats Rules:** If a user is not logged in, the Stats page will attempt to read a local storage fallback for the watchlist, otherwise, it requires server data.

## 9. Non-Functional Requirements

* **Performance:** TMDB API calls should be debounced (e.g., 400ms on the Compare search) to prevent rate limiting. The Stats page must utilize `Promise.all` to fetch detailed data concurrently.
* **Security:** Passwords must be hashed using `bcrypt` before database insertion. JWT secrets must be kept secure via environment variables.
* **Scalability:** The backend must be stateless (JWT-based) to allow horizontal scaling.
* **Reliability:** External API failures (TMDB) must be caught gracefully, displaying Error UI components rather than crashing the app.
* **Responsiveness:** The UI must be mobile-first, utilizing Tailwind CSS for fluid grids and responsive typography.

## 10. Data Requirements

### User
* **Purpose:** Core identity for authentication and relationships.
* **Important fields:** `username`, `email`, `password` (hashed), `profileTheme`.
* **Relationships:** One-to-Many with Watchlist, CustomList, TriviaScore.
* **Ownership:** Owned by the system; User manages their own data.

### Watchlist
* **Purpose:** Tracking media the user wants to watch.
* **Important fields:** `user` (Ref), `tmdbId`, `mediaType`, `title`, `posterPath`.
* **Relationships:** Belongs to User.

### CustomList
* **Purpose:** User-defined collections.
* **Important fields:** `user` (Ref), `name`, `description`, `items` (Array of media objects), `isPublic`.
* **Relationships:** Belongs to User.

### TriviaScore
* **Purpose:** Tracking user performance in the quiz.
* **Important fields:** `user` (Ref), `score`, `category`.
* **Relationships:** Belongs to User.

## 11. API Requirements

* **Authentication API:** Endpoints to register, login, and fetch current user profile (`/auth/me`).
* **Watchlist API:** Endpoints to GET user's watchlist, POST a new item, and DELETE an item by TMDB ID.
* **Lists API:** Endpoints to GET user's lists, POST a new list, PUT/update items in a list, and DELETE a list.
* **Trivia API:** Endpoints to POST a new score and GET the top leaderboard scores (sorted descending, limited to top N).

## 12. AI Features (if applicable)

*While there is no explicit LLM integration, the platform utilizes algorithmic features that simulate intelligent behavior:*
* **Recommendation Wizard:** Acts as a pseudo-AI by filtering thousands of TMDB records through user-defined parameters (Era, Genre, Rating thresholds) to output a highly curated list of 8 titles.
* **Quiz Generator:** Procedurally generates logical trivia questions by algorithmically pairing and comparing data points from live API data.

## 13. Error Handling

* **Invalid Input:** Client-side validation prevents form submission. Backend returns 400 Bad Request with specific Mongoose validation error messages.
* **Missing Data:** If TMDB returns incomplete data (e.g., missing poster), fallback images and default text (e.g., "N/A") are rendered.
* **Server/Network Failures:** Intercepted by `try/catch` blocks. The client renders a dedicated `<ErrorDisplay />` component and triggers error Toasts.
* **Authentication Failures:** Returns 401 Unauthorized. Client removes invalid tokens and prompts the user to log in again.

## 14. Assumptions

* **TMDB API:** It is assumed the TMDB API remains stable, free, and does not radically change its JSON response structures (`media_type`, `vote_average`, etc.).
* **Data Persistence:** It is assumed that Guest users are comfortable with features like Calendar reminders or Guest Watchlists being saved strictly to volatile `localStorage`.
* **Content Availability:** It is assumed that all TMDB IDs saved to the database will remain valid indefinitely.

## 15. Constraints

* **Technical:** The Stats page requires making N individual API calls to TMDB for N items in a watchlist to fetch runtime/budget data, which may hit TMDB rate limits for very large watchlists.
* **API:** Dependent on TMDB's terms of service and rate limits (typically ~40 requests per second).
* **Deployment:** Requires a Node.js runtime environment for the backend and a MongoDB instance (e.g., Atlas).

## 16. Future Scope

* Social features: Following other users, commenting on Custom Lists, and sharing lists via unique URLs.
* Advanced AI: Integrating OpenAI/Gemini to provide natural language recommendations (e.g., "Find me a movie like Inception but scarier").
* Streaming Availability: Integrating JustWatch API to tell users exactly *where* to stream their watchlist items.
* Notifications: Push notifications for Calendar reminders instead of just checking local storage on load.

## 17. Success Metrics

* **User Acquisition:** Number of registered users.
* **Engagement:** Average session length, number of quiz plays per user.
* **Retention:** Percentage of users who return to update their Watchlist or check the Calendar weekly.
* **Performance:** API response times (both internal backend and TMDB latency).

## 18. Open Questions

* Should Custom Lists have a public view accessible by a unique URL, allowing unauthenticated users to view a registered user's list?
* How should we handle the TMDB rate limit issue on the Stats page for users with watchlists exceeding 50-100 items?
* Should the Quiz feature include difficulty levels (Easy, Medium, Hard) to cater to different tiers of movie fans?
