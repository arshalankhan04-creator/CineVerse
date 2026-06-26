# CineVerse E2E Test Suite Ready

The E2E test suite for CineVerse is fully implemented, verified, and ready for execution. It consists of **71 tests** distributed across 4 tiers covering the 6 core features of the application in an opaque-box, offline manner.

## Test Suite Summary

- **Total Tests**: 71
- **Passing Rate**: 100% (71 / 71)
- **Database**: In-memory MongoDB (`mongodb-memory-server`)
- **Execution Mode**: Fully offline, isolated test files, and zero external API dependencies.

### Feature Coverage Breakdown

| Feature / File | Target | Tier 1 (Coverage) | Tier 2 (Boundary/Corner) | Tier 3 & 4 (Integration/Scenario) | Total Tests |
|---|---|---|---|---|---|
| `auth.test.js` | F1 (User Registration)<br>F2 (User Login)<br>F3 (Profile Management) | 15 (5 per feature) | 15 (5 per feature) | - | 30 |
| `watchlist.test.js` | F4 (Watchlist Curation) | 5 | 5 | - | 10 |
| `collections.test.js` | F5 (Custom Collection Management) | 5 | 5 | - | 10 |
| `trivia.test.js` | F6 (Trivia & Leaderboard) | 5 | 5 | - | 10 |
| `combinations.test.js`| Tier 3 (Cross-feature integration)<br>Tier 4 (Real-world scenarios) | - | - | 6 (Tier 3)<br>5 (Tier 4) | 11 |
| **Total** | | **30** | **30** | **11** | **71** |

---

## How to Execute the Tests

The E2E tests are configured to run from the `backend/` directory using Jest, utilizing the custom config file.

### Prerequisites

Ensure you have run `npm install` inside the `backend/` directory to install the test dependencies:
```bash
cd backend
npm install
```

### Option 1: Run via Custom Runner (Recommended)

Run the custom Node runner script, which automatically targets the backend context and starts Jest in sequential/in-band mode for clean database separation:
```bash
node e2e-tests/runner.js
```
*(Can be run from either the project root or the `backend/` directory)*

### Option 2: Run via Jest Command Directly

To execute the test suite using NPX from the `backend/` directory:
```bash
cd backend
npx jest --config ../e2e-tests/jest.config.js
```

### Option 3: Run Specific Test File

To execute a specific feature's test file:
```bash
cd backend
npx jest --config ../e2e-tests/jest.config.js ../e2e-tests/watchlist.test.js
```
