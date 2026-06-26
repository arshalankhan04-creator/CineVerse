# CineVerse Codebase Gap Analysis Report

## Executive Summary
A comprehensive read-only investigation of the CineVerse codebase reveals that while the core layout and pages are fully implemented, there are critical database sync bugs, route protection gaps, API contract mismatches, and missing E2E test files that prevent the application from meeting the requirements specified in `SCOPE.md` and `PRD.md`.

---

## Detailed Milestone Gap Mapping (M2 - M8)

### Milestone M2: Backend Authentication
* **Status**: **Partially Complete**
* **What Exists**:
  - `backend/models/User.js` defines schema fields (`username`, `email`, `password`, `profileTheme`, `favoriteGenres`, `membershipTier`).
  - `backend/routes/authRoutes.js` and `backend/controllers/authController.js` implement standard registration, login, profile fetch (`/api/auth/me`), and genre update (`/api/auth/me/genres`).
* **What is Missing / Broken**:
  1. **Missing Endpoint**: `PUT /api/auth/me` is required to save the user's selected theme preference (`profileTheme`) in the database. Currently, only `/me/genres` is present.
  2. **Interface Contract Mismatch on `GET /api/auth/me`**:
     - `SCOPE.md` Contract: returns `{ data: { id, username, email, profileTheme } }`
     - Backend Implementation: returns `{ success: true, data: user }` where `user` has Mongoose MongoDB structures (e.g. `_id` instead of `id` and internal timestamps/version numbers).
* **How to Implement / Fix**:
  - In `backend/routes/authRoutes.js`, add:
    ```javascript
    router.put('/me', protect, updateProfileTheme);
    ```
  - In `backend/controllers/authController.js`, implement `updateProfileTheme`:
    ```javascript
    exports.updateProfileTheme = async (req, res) => {
      try {
        const { theme } = req.body;
        const user = await User.findByIdAndUpdate(
          req.user.id,
          { profileTheme: theme },
          { new: true, runValidators: true }
        );
        res.status(200).json({
          data: {
            id: user._id,
            username: user.username,
            email: user.email,
            profileTheme: user.profileTheme
          }
        });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    };
    ```
  - Refactor `getMe` to map the response to the correct structure:
    ```javascript
    exports.getMe = async (req, res) => {
      try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
          data: {
            id: user._id,
            username: user.username,
            email: user.email,
            profileTheme: user.profileTheme,
            favoriteGenres: user.favoriteGenres
          }
        });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    };
    ```

---

### Milestone M3: Curation APIs
* **Status**: **Broken / Severe Contract Mismatch**
* **What Exists**:
  - `backend/models/Watchlist.js` and `backend/models/CustomList.js` schemas are properly defined with MongoDB indices for unique constraints.
  - CRUD operations exist in `watchlistController.js` and `listController.js`.
* **What is Missing / Broken**:
  1. **Watchlist DELETE Contract Mismatch**:
     - `SCOPE.md` Contract: `DELETE /api/watchlist/:tmdbId` -> `{ message: "Item removed" }`
     - Backend Implementation: `res.status(200).json({ success: true, data: {} })`
  2. **Custom List DELETE Contract Mismatch**:
     - `SCOPE.md` Contract: `DELETE /api/lists/:id` -> `{ message: "List deleted" }`
     - Backend Implementation: `res.status(200).json({ success: true, data: {} })`
  3. **Custom List PUT Item Update Mismatch (Critical Bug)**:
     - `SCOPE.md` Contract: `PUT /api/lists/:id/items` expects a replacement array of items: Body: `{ items: [...] }` -> `{ data: { id, name, description, items } }`
     - Backend Implementation: expects `{ action: 'add'|'remove', item: {...} }` and pushes/filters in Mongoose.
     - Frontend Implementation (`src/services/api.js` line 145 and pages/modals): sends the full replacement `{ items: [...] }`.
     - **Impact**: All list additions/deletions from the UI fail to write to the database since `action` and `item` are undefined in the controller, causing lists to remain unchanged in the DB.
* **How to Implement / Fix**:
  - Update `removeFromWatchlist` in `backend/controllers/watchlistController.js` to return:
    ```javascript
    res.status(200).json({ message: "Item removed" });
    ```
  - Update `deleteList` in `backend/controllers/listController.js` to return:
    ```javascript
    res.status(200).json({ message: "List deleted" });
    ```
  - Rewrite `updateListItems` in `backend/controllers/listController.js` to accept `{ items }` directly:
    ```javascript
    exports.updateListItems = async (req, res) => {
      try {
        const list = await CustomList.findOne({ _id: req.params.id, user: req.user.id });
        if (!list) {
          return res.status(404).json({ error: 'List not found' });
        }
        const { items } = req.body;
        if (!Array.isArray(items)) {
          return res.status(400).json({ error: 'Items must be an array' });
        }
        list.items = items;
        await list.save();
        res.status(200).json({
          data: {
            id: list._id,
            name: list.name,
            description: list.description,
            items: list.items
          }
        });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    };
    ```

---

### Milestone M4: Trivia APIs
* **Status**: **Partially Complete / Mismatch**
* **What Exists**:
  - Trivia score posting and leaderboard routes.
* **What is Missing / Broken**:
  1. **Score Submission Contract Mismatch**:
     - `SCOPE.md` Contract: `POST /api/trivia/score` -> `{ data: { id, score, category, user: { username } } }`
     - Backend Implementation: returns the raw unpopulated `TriviaScore` document where `user` is just the ObjectID string, not the populated user details object.
* **How to Implement / Fix**:
  - Update `submitScore` in `backend/controllers/triviaController.js` to map response fields:
    ```javascript
    exports.submitScore = async (req, res) => {
      try {
        req.body.user = req.user.id;
        const score = await TriviaScore.create(req.body);
        res.status(201).json({
          data: {
            id: score._id,
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
    ```

---

### Milestone M5: Frontend Auth & Shell
* **Status**: **Partially Complete / Bugs Present**
* **What Exists**:
  - Auth context and modal are operational. Profile preferences UI (genres) are wired up.
* **What is Missing / Broken**:
  1. **Theme Switcher is Local-Only**:
     - In `Navbar.jsx`, `handleThemeChange` only updates `localStorage`. It does not call any API endpoint to save the theme preference in the database.
     - `api.updateProfileTheme` in `api.js` is not exposed in `AuthContext.jsx` or used anywhere.
  2. **No Route Protection**:
     - In `App.jsx`, all routes are public. Although pages like `/profile` check if the user is authenticated and show warning placeholders, there is no global `ProtectedRoute` to redirect users.
* **How to Implement / Fix**:
  - Expose `updateProfileTheme` in `AuthContext.jsx` and call the API function.
  - Update `handleThemeChange` in `Navbar.jsx` to call `updateProfileTheme(themeId)` from context if `user` is logged in:
    ```javascript
    const handleThemeChange = async (themeId) => {
      setActiveTheme(themeId);
      applyTheme(themeId);
      localStorage.setItem('cineverse_theme', themeId);
      if (user) {
        try {
          await api.updateProfileTheme(themeId);
          setUser(prev => ({ ...prev, profileTheme: themeId }));
        } catch (err) {
          console.error(err);
        }
      }
    };
    ```
  - Create a `ProtectedRoute.jsx` component to wrap restricted routes in `App.jsx`.

---

### Milestone M6: Frontend Discovery & Wizard
* **Status**: **Complete**
* **What Exists**:
  - Direct TMDB client fetching in local development and serverless proxy route `/api/tmdb` in production.
  - Movie detail, TV detail, Home, Explore, Calendar, and Recommendation Wizard are working.

---

### Milestone M7: Frontend Curation & Trivia
* **Status**: **Broken / Severe Watchlist Bugs**
* **What Exists**:
  - Watchlist page, Custom collections lists page, Quiz page, and Leaderboard UI.
* **What is Missing / Broken**:
  1. **Movie/TV Detail Pages Bypass Watchlist API (Critical Bug)**:
     - `MovieDetail.jsx` and `TVDetail.jsx` use a local `toggleWatchlist` function that directly reads/writes to `localStorage` (under the key `cineverse_watchlist`) and dispatches `watchlist_updated`.
     - They **never** call `AuthContext`'s `toggleWatchlist` or the watchlist database endpoint.
     - **Impact**: Even when logged in, adding a movie/show from its detail page saves it **only** to local storage. It is never synced to the database.
  2. **AuthContext lacks event listener for `watchlist_updated`**:
     - `AuthContext.jsx` does not listen to the `'watchlist_updated'` event.
     - **Impact**: For logged-out users, adding an item on a details page updates local storage but does not update `AuthContext` state. If the user navigates to `/watchlist` (without a full page reload), it shows an empty state until they refresh the browser.
* **How to Implement / Fix**:
  - Refactor `MovieDetail.jsx` and `TVDetail.jsx` to import `toggleWatchlist` from `useAuth()` and use it:
    ```javascript
    // In MovieDetail.jsx
    const { watchlist, toggleWatchlist, watchedList, toggleWatched } = useAuth();
    const isSaved = watchlist.some(item => item.tmdbId === movie?.id || item.id === movie?.id);
    ```
  - Add an event listener in `AuthContext.jsx` (or in a shared hook) to synchronize local storage changes to context state:
    ```javascript
    useEffect(() => {
      const handleLocalWatchlistUpdate = () => {
        if (!user) {
          const localList = JSON.parse(localStorage.getItem('cineverse_watchlist') || '[]');
          setWatchlist(localList);
        }
      };
      window.addEventListener('watchlist_updated', handleLocalWatchlistUpdate);
      return () => window.removeEventListener('watchlist_updated', handleLocalWatchlistUpdate);
    }, [user]);
    ```

---

### Milestone M8: Compare Tool
* **Status**: **Complete**
* **What Exists**:
  - `Compare.jsx` implements side-by-side search and metric comparison. No functional gaps found.

---

## Test Suite & Infrastructure Analysis

### 1. Test Runs & Permission Limits
* An attempt to run the backend tests asynchronously using `run_command` timed out because user confirmation was required on Windows Powershell. Therefore, all analysis in this report is based on **complete static verification** of code logic and test files.

### 2. Missing E2E Test Suite Files
* **Observation**: `TEST_INFRA.md` states that the E2E test suite covers 6 core features across 4 tiers of tests (71 total tests) and includes files:
  - `auth.test.js`
  - `watchlist.test.js`
  - `collections.test.js`
  - `trivia.test.js`
  - `combinations.test.js`
* **Real State**: The `e2e-tests/` directory contains **only** `auth.test.js` (40 tests), `jest.config.js`, and `setup.js`.
* **Gaps**: `watchlist.test.js`, `collections.test.js`, `trivia.test.js`, and `combinations.test.js` are **completely missing** from the E2E suite.

### 3. Untested Features
* **Watched History routes** (`/api/watched` and `/api/watched/stats`) have no unit/integration tests in `backend/tests/` and no coverage in the E2E tests, leaving them completely untested.
