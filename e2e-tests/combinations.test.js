const request = require('supertest');
const app = require('../backend/server');

describe('Cross-Feature Combinations & Real-World Scenarios (Tier 3 & Tier 4)', () => {
  // --- Tier 3: Cross-Feature Combinations (6 Tests) ---
  describe('Tier 3: Cross-Feature Combinations', () => {
    it('F-T3-1: Registration, Profile & Watchlist Linkage', async () => {
      // 1. Register user
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'combo1',
          email: 'combo1@example.com',
          password: 'Password123!'
        });
      expect(registerRes.statusCode).toEqual(201);
      const token = registerRes.body.token;

      // 2. Set favorite genres
      const profileRes = await request(app)
        .put('/api/auth/me/genres')
        .set('Authorization', `Bearer ${token}`)
        .send({ genres: ['Sci-Fi', 'Thriller'] });
      expect(profileRes.statusCode).toEqual(200);

      // 3. Add a movie to watchlist matching one of the genres
      const watchlistRes = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tmdbId: 101,
          mediaType: 'movie',
          title: 'Interstellar'
        });
      expect(watchlistRes.statusCode).toEqual(201);
      expect(watchlistRes.body.data.title).toBe('Interstellar');
    });

    it('F-T3-2: Login, Watchlist & Collection Sync', async () => {
      // 1. Register and login
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'combo2',
          email: 'combo2@example.com',
          password: 'Password123!'
        });
      expect(registerRes.statusCode).toEqual(201);
      const token = registerRes.body.token;

      // 2. Add item to watchlist
      const watchlistRes = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tmdbId: 501,
          mediaType: 'movie',
          title: 'Memento'
        });
      expect(watchlistRes.statusCode).toEqual(201);

      // 3. Create custom list
      const listRes = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Christopher Nolan Favorites'
        });
      expect(listRes.statusCode).toEqual(201);
      const listId = listRes.body.data._id;

      // 4. Add the watchlist item to the custom list
      const updateRes = await request(app)
        .put(`/api/lists/${listId}/items`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          item: {
            tmdbId: 501,
            mediaType: 'movie',
            title: 'Memento'
          },
          action: 'add'
        });
      expect(updateRes.statusCode).toEqual(200);
      expect(updateRes.body.data.items[0].title).toBe('Memento');
    });

    it('F-T3-3: Register, Trivia & Profile Leaderboard Integration', async () => {
      // 1. Register user
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'combo3',
          email: 'combo3@example.com',
          password: 'Password123!'
        });
      expect(registerRes.statusCode).toEqual(201);
      const token = registerRes.body.token;

      // 2. Submit trivia score
      const scoreRes = await request(app)
        .post('/api/trivia/score')
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 150 });
      expect(scoreRes.statusCode).toEqual(201);

      // 3. Fetch leaderboard and verify user is present
      const leaderboardRes1 = await request(app)
        .get('/api/trivia/leaderboard');
      expect(leaderboardRes1.statusCode).toEqual(200);
      expect(leaderboardRes1.body.data[0].user.username).toBe('combo3');
      expect(leaderboardRes1.body.data[0].user.profileTheme).toBe('default');

      // Wait, is there an endpoint to update profileTheme? Let's check auth.test.js. 
      // Actually, wait, does update profile details exist? Let's verify how theme is updated. 
      // If we don't have a specific theme route, let's check authRoutes.js to see if there is one.
    });

    it('F-T3-4: Multi-feature Cleanup (Lists & Watchlist deletes)', async () => {
      // 1. Register user
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'combo4',
          email: 'combo4@example.com',
          password: 'Password123!'
        });
      const token = registerRes.body.token;

      // 2. Add watchlist item
      await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ tmdbId: 801, mediaType: 'movie', title: 'The Dark Knight' });

      // 3. Create custom list
      const listRes = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Batman Trilogy' });
      const listId = listRes.body.data._id;

      // 4. Delete watchlist item
      const delWatchlist = await request(app)
        .delete('/api/watchlist/801')
        .set('Authorization', `Bearer ${token}`);
      expect(delWatchlist.statusCode).toEqual(200);

      // 5. Delete custom list
      const delList = await request(app)
        .delete(`/api/lists/${listId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(delList.statusCode).toEqual(200);

      // 6. Verify empty watchlist and lists
      const watchlistGet = await request(app)
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${token}`);
      expect(watchlistGet.body.count).toBe(0);

      const listGet = await request(app)
        .get('/api/lists')
        .set('Authorization', `Bearer ${token}`);
      expect(listGet.body.data.length).toBe(0);
    });

    it('F-T3-5: Private vs Public Custom Lists and Profile Fetching', async () => {
      // 1. Register user
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'combo5',
          email: 'combo5@example.com',
          password: 'Password123!'
        });
      const token = registerRes.body.token;

      // 2. Create public list
      const publicList = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Public Favorites', isPublic: true });
      expect(publicList.statusCode).toEqual(201);

      // 3. Create private list
      const privateList = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Secret Pleasures', isPublic: false });
      expect(privateList.statusCode).toEqual(201);

      // 4. Retrieve lists
      const getLists = await request(app)
        .get('/api/lists')
        .set('Authorization', `Bearer ${token}`);
      expect(getLists.body.data.length).toBe(2);

      // 5. Retrieve profile (F3)
      const profileRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(profileRes.statusCode).toEqual(200);
      expect(profileRes.body.data.username).toBe('combo5');
    });

    it('F-T3-6: Watched History and Watchlist Interaction', async () => {
      // 1. Register user
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'combo6',
          email: 'combo6@example.com',
          password: 'Password123!'
        });
      const token = registerRes.body.token;

      // 2. Add movie to watchlist
      await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ tmdbId: 901, mediaType: 'movie', title: 'The Prestige' });

      // 3. Mark movie as watched (add to watched history)
      const watchRes = await request(app)
        .post('/api/watched')
        .set('Authorization', `Bearer ${token}`)
        .send({ tmdbId: 901, mediaType: 'movie', title: 'The Prestige', runtime: 130 });
      expect(watchRes.statusCode).toEqual(201);

      // 4. Remove from watchlist
      const delWatchlist = await request(app)
        .delete('/api/watchlist/901')
        .set('Authorization', `Bearer ${token}`);
      expect(delWatchlist.statusCode).toEqual(200);

      // 5. Verify it's gone from watchlist but remains in watched history
      const watchlistGet = await request(app)
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${token}`);
      expect(watchlistGet.body.count).toBe(0);

      const watchedGet = await request(app)
        .get('/api/watched')
        .set('Authorization', `Bearer ${token}`);
      expect(watchedGet.body.data.length).toBe(1);
      expect(watchedGet.body.data[0].title).toBe('The Prestige');
    });
  });

  // --- Tier 4: Real-world Application Scenarios (5 Tests) ---
  describe('Tier 4: Real-world Application Scenarios', () => {
    it('Onboarding & Discovery Journey: user signup, profile setup, watchlist, custom lists', async () => {
      // Step 1: User registers
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'journeyuser',
          email: 'journey@example.com',
          password: 'Password123!'
        });
      expect(registerRes.statusCode).toBe(201);
      const token = registerRes.body.token;

      // Step 2: Login to double check session
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'journey@example.com',
          password: 'Password123!'
        });
      expect(loginRes.statusCode).toBe(200);

      // Step 3: Configure profile genres
      const profileRes = await request(app)
        .put('/api/auth/me/genres')
        .set('Authorization', `Bearer ${token}`)
        .send({ genres: ['Action', 'Sci-Fi'] });
      expect(profileRes.statusCode).toBe(200);

      // Step 4: Add trending movie to watchlist
      const watchlistRes = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ tmdbId: 4001, mediaType: 'movie', title: 'The Matrix' });
      expect(watchlistRes.statusCode).toBe(201);

      // Step 5: Create a custom collection
      const createListRes = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Wachowski Masterpieces' });
      expect(createListRes.statusCode).toBe(201);
      const listId = createListRes.body.data._id;

      // Step 6: Add movie to custom list
      const updateListRes = await request(app)
        .put(`/api/lists/${listId}/items`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          item: { tmdbId: 4001, mediaType: 'movie', title: 'The Matrix' },
          action: 'add'
        });
      expect(updateListRes.statusCode).toBe(200);
      expect(updateListRes.body.data.items.length).toBe(1);
    });

    it('Leaderboard Climb: multiple users, various scores, correct sorting/populate', async () => {
      // 1. Register 3 users
      const users = [
        { username: 'climber1', email: 'climber1@example.com', password: 'Password123!', score: 200 },
        { username: 'climber2', email: 'climber2@example.com', password: 'Password123!', score: 350 },
        { username: 'climber3', email: 'climber3@example.com', password: 'Password123!', score: 100 }
      ];

      for (const u of users) {
        const regRes = await request(app).post('/api/auth/register').send(u);
        const token = regRes.body.token;

        // Submit their score
        await request(app)
          .post('/api/trivia/score')
          .set('Authorization', `Bearer ${token}`)
          .send({ score: u.score });
      }

      // 2. Fetch public leaderboard
      const leaderboardRes = await request(app)
        .get('/api/trivia/leaderboard');

      expect(leaderboardRes.statusCode).toBe(200);
      const data = leaderboardRes.body.data;
      expect(data.length).toBe(3);

      // Verify descending order
      expect(data[0].score).toBe(350);
      expect(data[0].user.username).toBe('climber2');

      expect(data[1].score).toBe(200);
      expect(data[1].user.username).toBe('climber1');

      expect(data[2].score).toBe(100);
      expect(data[2].user.username).toBe('climber3');
    });

    it('Dashboard & Stats Sync: watched history entries, profile dashboard stats (count & runtime)', async () => {
      // 1. Register user
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'dashboarduser',
          email: 'dash@example.com',
          password: 'Password123!'
        });
      const token = registerRes.body.token;

      // 2. Query initial stats (should be 0)
      const initStatsRes = await request(app)
        .get('/api/watched/stats')
        .set('Authorization', `Bearer ${token}`);
      expect(initStatsRes.statusCode).toBe(200);
      expect(initStatsRes.body.data.moviesWatchedCount).toBe(0);
      expect(initStatsRes.body.data.totalWatchTimeMinutes).toBe(0);

      // 3. Add multiple movies to watched history
      await request(app)
        .post('/api/watched')
        .set('Authorization', `Bearer ${token}`)
        .send({ tmdbId: 6001, mediaType: 'movie', title: 'Titanic', runtime: 194 });

      await request(app)
        .post('/api/watched')
        .set('Authorization', `Bearer ${token}`)
        .send({ tmdbId: 6002, mediaType: 'movie', title: 'Avatar', runtime: 162 });

      // 4. Query stats again
      const statsRes = await request(app)
        .get('/api/watched/stats')
        .set('Authorization', `Bearer ${token}`);
      expect(statsRes.statusCode).toBe(200);
      expect(statsRes.body.data.moviesWatchedCount).toBe(2);
      expect(statsRes.body.data.totalWatchTimeMinutes).toBe(356); // 194 + 162
    });

    it('Account Isolation: multiple users, concurrent updates, scoping and no data leaks', async () => {
      // 1. Register two different users
      const regUser1 = await request(app).post('/api/auth/register').send({
        username: 'isolated1', email: 'iso1@example.com', password: 'Password123!'
      });
      const token1 = regUser1.body.token;

      const regUser2 = await request(app).post('/api/auth/register').send({
        username: 'isolated2', email: 'iso2@example.com', password: 'Password123!'
      });
      const token2 = regUser2.body.token;

      // 2. User 1 adds item to watchlist
      await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token1}`)
        .send({ tmdbId: 7001, mediaType: 'movie', title: 'Alien' });

      // 3. User 2 adds different item to watchlist
      await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token2}`)
        .send({ tmdbId: 7002, mediaType: 'movie', title: 'Aliens' });

      // 4. Verify User 1's watchlist does NOT contain User 2's movie, and vice versa
      const watchlist1 = await request(app)
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${token1}`);
      expect(watchlist1.body.count).toBe(1);
      expect(watchlist1.body.data[0].tmdbId).toBe(7001);

      const watchlist2 = await request(app)
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${token2}`);
      expect(watchlist2.body.count).toBe(1);
      expect(watchlist2.body.data[0].tmdbId).toBe(7002);

      // 5. User 1 creates custom list
      const listRes1 = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'User 1 Favorites' });
      const listId1 = listRes1.body.data._id;

      // 6. User 2 tries to access or update User 1's list (should fail with 404/not found)
      const tryUpdate = await request(app)
        .put(`/api/lists/${listId1}/items`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          item: { tmdbId: 7002, mediaType: 'movie', title: 'Aliens' },
          action: 'add'
        });
      expect(tryUpdate.statusCode).toBe(404);
    });

    it('Watchlist to Collection Flow: curate watchlist and convert/copy to custom list', async () => {
      // 1. Register user
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'flowuser',
          email: 'flow@example.com',
          password: 'Password123!'
        });
      const token = registerRes.body.token;

      // 2. Add 3 movies to watchlist
      const movies = [
        { tmdbId: 8001, title: 'The Godfather' },
        { tmdbId: 8002, title: 'The Godfather Part II' },
        { tmdbId: 8003, title: 'The Godfather Part III' }
      ];

      for (const m of movies) {
        await request(app)
          .post('/api/watchlist')
          .set('Authorization', `Bearer ${token}`)
          .send({ tmdbId: m.tmdbId, mediaType: 'movie', title: m.title });
      }

      // 3. Fetch watchlist items
      const watchlistRes = await request(app)
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${token}`);
      expect(watchlistRes.body.count).toBe(3);

      // 4. Create custom list
      const listRes = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Godfather Trilogy', isPublic: true });
      expect(listRes.statusCode).toBe(201);
      const listId = listRes.body.data._id;

      // 5. Transfer items from watchlist to the custom list
      for (const item of watchlistRes.body.data) {
        const transferRes = await request(app)
          .put(`/api/lists/${listId}/items`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            item: {
              tmdbId: item.tmdbId,
              mediaType: item.mediaType,
              title: item.title,
              posterPath: item.posterPath
            },
            action: 'add'
          });
        expect(transferRes.statusCode).toBe(200);
      }

      // 6. Verify custom list is fully populated
      const finalListRes = await request(app)
        .get('/api/lists')
        .set('Authorization', `Bearer ${token}`);
      expect(finalListRes.body.data[0].items.length).toBe(3);
    });
  });
});
