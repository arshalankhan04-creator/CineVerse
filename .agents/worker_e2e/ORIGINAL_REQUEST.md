## 2026-06-26T12:23:04Z
You are the E2E Testing Worker.
Your working directory is: c:\Users\ArsalaanKhan\OneDrive\Desktop\CineVerse\.agents\worker_e2e
Your task is to:
1. Write the E2E test infrastructure document `c:\Users\ArsalaanKhan\OneDrive\Desktop\CineVerse\TEST_INFRA.md` following the template provided below.
2. Implement a comprehensive opaque-box E2E test suite in the folder `c:\Users\ArsalaanKhan\OneDrive\Desktop\CineVerse\e2e-tests/`.
3. Set up the E2E test runner configuration in `c:\Users\ArsalaanKhan\OneDrive\Desktop\CineVerse\e2e-tests/jest.config.js`.
4. Run the full test suite and verify that all 71 tests pass successfully.
5. Create and publish `c:\Users\ArsalaanKhan\OneDrive\Desktop\CineVerse\TEST_READY.md` to signify that the test suite is ready, listing the coverage and instructions to run.

### MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

---

### E2E Test Suite Design details:
You need to create a total of 71 tests across 4 tiers for the 6 core features:
Features:
- F1: User Registration
- F2: User Login
- F3: User Profile management (genres/theme updates)
- F4: Watchlist curation (add, view, remove)
- F5: Custom collection management (create, view, update items, delete)
- F6: Trivia & Leaderboard (submit scores, fetch leaderboard)

Tiers:
- Tier 1: Feature Coverage (5 tests per feature, total 30)
- Tier 2: Boundary & Corner Cases (5 tests per feature, total 30)
- Tier 3: Cross-Feature Combinations (6 tests)
- Tier 4: Real-world Application Scenarios (5 tests)

#### File Structure to Create:
- `e2e-tests/jest.config.js`:
  ```javascript
  module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./setup.js'],
    testTimeout: 20000,
    testMatch: ['**/*.test.js']
  };
  ```
- `e2e-tests/setup.js`:
  Set up MongoMemoryServer, connect Mongoose, clear collections after each test, and disconnect/stop server after all tests. Do NOT export models. Ensure that `process.env.JWT_SECRET` is set to a test secret.
- `e2e-tests/auth.test.js`:
  - Tier 1 and Tier 2 tests for Registration, Login, Profile.
  - Make HTTP requests using `supertest(app)` against the Express application (requiring the app from `../backend/server`).
  - Verify success and failure status codes (200, 201, 400, 401).
- `e2e-tests/watchlist.test.js`:
  - Tier 1 and Tier 2 tests for Watchlist management.
  - Verify duplicate items return 400, adding without auth returns 401, getting watchlist returns added items.
- `e2e-tests/collections.test.js`:
  - Tier 1 and Tier 2 tests for Custom collections.
  - Verify creating list, editing items list, deleting list, error conditions.
- `e2e-tests/trivia.test.js`:
  - Tier 1 and Tier 2 tests for Trivia leaderboard.
  - Verify posting score with JWT, getting leaderboard without JWT, correct ordering of scores.
- `e2e-tests/combinations.test.js`:
  - Tier 3 (6 tests) and Tier 4 (5 tests) covering combinations and real-world onboarding, leaderboards climbing, stats, and conversion scenarios.

---

### Step 1: Write TEST_INFRA.md
Write the file `c:\Users\ArsalaanKhan\OneDrive\Desktop\CineVerse\TEST_INFRA.md` detailing:
- Test Philosophy (Opaque-box, requirement-driven, mock databases, no external network calls)
- Feature Inventory (table with Features and counts for Tiers 1-3)
- Test Architecture (test runner command: `npx jest --config ../e2e-tests/jest.config.js` run from `backend/` directory)
- Real-World Application Scenarios (table with description, features, complexity)
- Coverage Thresholds (minimum test count of 71)

### Step 2: Implement Tests in e2e-tests/
Implement all files in `e2e-tests/` as specified. Make sure that they contain clean, standard JavaScript.
Use only `supertest` for requests and `jest` asserts. Do NOT import mongoose models directly in the tests (tests must be strictly opaque-box and communicate only through API requests).

### Step 3: Run the Tests
Run the E2E tests using the command `npx jest --config ../e2e-tests/jest.config.js` from the `backend/` directory. Ensure all 71 tests pass. Document the command output.

### Step 4: Write TEST_READY.md
Write the file `c:\Users\ArsalaanKhan\OneDrive\Desktop\CineVerse\TEST_READY.md` detailing how to run the E2E tests, the coverage summary, and confirmation that all tests pass.

Provide your handoff report in `handoff.md` within your working directory once done.
