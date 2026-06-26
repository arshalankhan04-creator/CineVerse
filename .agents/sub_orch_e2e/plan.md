# E2E Test Suite Implementation Plan

This plan outlines the design, implementation, and execution of the comprehensive opaque-box E2E test suite for CineVerse.

## Test Directory Structure
All test files, configurations, and runners will reside in `e2e-tests/` at the project root to remain separate from the codebase.
- `e2e-tests/jest.config.js` — Jest configuration file for E2E tests.
- `e2e-tests/setup.js` — Database and environment setup using MongoMemoryServer.
- `e2e-tests/auth.test.js` — Tier 1 & Tier 2 tests for Registration, Login, and Profile APIs.
- `e2e-tests/watchlist.test.js` — Tier 1 & Tier 2 tests for Watchlist APIs.
- `e2e-tests/collections.test.js` — Tier 1 & Tier 2 tests for Custom Collections APIs.
- `e2e-tests/trivia.test.js` — Tier 1 & Tier 2 tests for Trivia Leaderboard APIs.
- `e2e-tests/combinations.test.js` — Tier 3 (Cross-feature) and Tier 4 (Real-world scenario) tests.
- `e2e-tests/runner.js` — Custom runner script if needed, or we can use a Jest command line script.

## 4-Tier Test Cases Design
We will define and implement 71 test cases in total based on 6 core features:
1. User Registration (`POST /api/auth/register`)
2. User Login (`POST /api/auth/login`)
3. User Profile (`GET /api/auth/me`, `PUT /api/auth/me/genres`)
4. Watchlist (`GET /api/watchlist`, `POST /api/watchlist`, `DELETE /api/watchlist/:tmdbId`)
5. Custom Collections (`GET /api/lists`, `POST /api/lists`, `PUT /api/lists/:id/items`, `DELETE /api/lists/:id`)
6. Trivia Leaderboard (`POST /api/trivia/score`, `GET /api/trivia/leaderboard`)

### Tier 1 - Feature Coverage (30 tests, 5 per feature)
- Success and failure cases for all API routes.
- Basic functionality validation (creating, reading, updating, deleting).

### Tier 2 - Boundary & Corner Cases (30 tests, 5 per feature)
- Validation constraints (empty, min/max length, duplicate fields).
- Case insensitivity, invalid/expired tokens, negative/large numeric inputs.

### Tier 3 - Cross-Feature Combinations (6 tests)
- Auth + Watchlist persistence and access block.
- Watchlist + Custom Lists + Stats integration.
- Isolation tests (User A vs User B data).
- Leaderboard + Username updates.

### Tier 4 - Real-World Application Scenarios (5 tests)
- Full User Onboarding and Curation cycle.
- Trivia Leaderboard climbing scenario.
- Guest to Member conversion flow.
- Ultimate Curation cleanup of watchlists and collections.

## Execution and Verification
The worker will:
1. Write the E2E test infra documentation `TEST_INFRA.md` in the project root.
2. Implement the tests in `e2e-tests/`.
3. Run the E2E tests using `jest` or a custom test runner script and verify they all pass.
4. Generate and publish `TEST_READY.md` containing the test runner instructions and results summary.
