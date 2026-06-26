# CineVerse E2E Test Infrastructure

## Test Philosophy
The CineVerse End-to-End (E2E) testing suite is designed around the following core principles:
1. **Opaque-Box Testing**: Tests communicate solely through the public API endpoints using HTTP requests (`supertest`). They have no direct import of Mongoose models or internal code logic, treating the application as a black box.
2. **Requirement-Driven**: All test cases are directly derived from the core requirements of CineVerse features, verifying correct HTTP status codes, payload structures, and database states exposed via APIs.
3. **Mock/In-Memory Database**: Tests run using `mongodb-memory-server` to spin up a clean database instance for every test file. This ensures test reliability, database isolation, and prevents pollution of production data.
4. **No External Network Calls**: All external service interactions are stubbed or mocked internally, ensuring the test suite can run fully offline and deterministically.

---

## Feature Inventory & Test Coverage Matrix

The E2E test suite covers 6 core features across 4 tiers of tests:

| Feature | Description | Tier 1 (Coverage) | Tier 2 (Boundary/Corner) | Tier 3 (Cross-Feature) | Total Tests |
|---------|-------------|-------------------|--------------------------|------------------------|-------------|
| **F1**  | User Registration | 5 | 5 | Combined (in Tier 3 & 4) | 10 |
| **F2**  | User Login | 5 | 5 | Combined (in Tier 3 & 4) | 10 |
| **F3**  | User Profile Management | 5 | 5 | Combined (in Tier 3 & 4) | 10 |
| **F4**  | Watchlist Curation | 5 | 5 | Combined (in Tier 3 & 4) | 10 |
| **F5**  | Custom Collection Management | 5 | 5 | Combined (in Tier 3 & 4) | 10 |
| **F6**  | Trivia & Leaderboard | 5 | 5 | Combined (in Tier 3 & 4) | 10 |
| **Cross**| Combinations (Tier 3) | - | - | 6 | 6 |
| **Scenarios**| Real-world Scenarios (Tier 4)| - | - | 5 (Tier 4) | 5 |
| **Total**| | **30** | **30** | **11** | **71** |

---

## Test Architecture

### Directory Layout
```
e2e-tests/
├── jest.config.js       # Test runner configuration
├── setup.js             # MongoMemoryServer setup & DB teardown
├── auth.test.js         # F1, F2, F3 E2E tests (Registration, Login, Profile)
├── watchlist.test.js    # F4 E2E tests (Watchlist curation)
├── collections.test.js  # F5 E2E tests (Custom lists/collections)
├── trivia.test.js       # F6 E2E tests (Trivia and global leaderboard)
└── combinations.test.js # Tier 3 and Tier 4 integration & scenario tests
```

### Test Runner Command
The E2E test suite is executed using Jest from the `backend/` directory:
```bash
npx jest --config ../e2e-tests/jest.config.js
```

---

## Real-World Application Scenarios (Tier 4)

| Scenario | Description | Features Covered | Complexity |
|----------|-------------|------------------|------------|
| **Onboarding & Discovery Journey** | A new user signs up, logs in, configures their favorite genres, searches/adds trending movies to their watchlist, creates a custom collection, and populates items. | F1, F2, F3, F4, F5 | High |
| **Leaderboard Climb** | Multiple users register and submit varied trivia scores to verify the ranking, ordering, and user details on the global leaderboard. | F1, F6 | Medium |
| **Dashboard & Stats Sync** | User records watched history entries and retrieves automated statistics (total watch count and runtime) on their profile dashboard. | F1, F2, F3 | High |
| **Account Isolation** | Multiple users perform concurrent updates on watchlists and custom collections to guarantee strict scoping and prevent data leakage. | F1, F4, F5 | High |
| **Watchlist to Collection Flow** | A user curates a watchlist and converts it into a public/private custom list for community sharing. | F1, F4, F5 | Medium |

---

## Coverage Thresholds
To ensure the CineVerse backend is fully robust and conforms to all functional criteria, the E2E test suite enforces:
- **Minimum Test Count**: **71 tests** must be executed and pass successfully.
- **Failures Allowed**: **0 failures**.
- **Coverage Types**: Features coverage, Boundary/Corner cases, Cross-Feature integration, and Real-world scenarios.
