## 2026-06-26T13:34:53Z
You are worker_frontend (Frontend Developer). Your working directory is c:\Users\ArsalaanKhan\OneDrive\Desktop\CineVerse\.agents\worker_frontend.

Your mission is to implement all frontend fixes matching Milestones M5 and M7, and verify correctness.

Mandatory Integrity Warning:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please do the following:
1. In `src/context/AuthContext.jsx`:
   - Expose `updateProfileTheme` in `AuthContext` value. Implement it to call `api.updateProfileTheme(themeId)` and update local `user` state's `profileTheme`.
   - Add a `useEffect` event listener for `'watchlist_updated'` event. If the user is NOT logged in, fetch the offline watchlist from local storage (`cineverse_watchlist`) and update the `watchlist` state.

2. In `src/components/Navbar.jsx`, modify `handleThemeChange`:
   - If `user` is logged in, call `updateProfileTheme(themeId)` from `useAuth()` to save theme preference in the cloud database.

3. In `src/pages/MovieDetail.jsx` and `src/pages/TVDetail.jsx`:
   - Import `watchlist` and `toggleWatchlist` from `useAuth()`.
   - Compute `isSaved` reactively using `watchlist.some(item => (item.tmdbId || item.id) === (movie?.id || show?.id || parseInt(id)))`.
   - Remove the local state `isSaved`, the local storage `WATCHLIST_KEY` logic, the local storage check in `useEffect`, and the local `toggleWatchlist` implementation.
   - Wire `onClick` of the watchlist button to call the `toggleWatchlist` function from `useAuth()`.

4. In `src/pages/Lists.jsx`:
   - Check if `user` is undefined/null. If so, return a clean sign-in prompt UI (matching the theme and design of `Profile.jsx`'s guest page) prompting the user to sign in to manage collections.

5. Propose and run the frontend build (`npm run build` at workspace root) to verify that there are no syntax or import errors.

6. When complete, save a handoff report at `c:\Users\ArsalaanKhan\OneDrive\Desktop\CineVerse\worker_frontend\handoff.md` (Note: wait, prompt says "at c:\Users\ArsalaanKhan\OneDrive\Desktop\CineVerse\.agents\worker_frontend\handoff.md") and send a message to your parent/caller (Recipient: d39b6cb3-4a84-4fd6-9672-5ce921564e80) informing them of completion.
