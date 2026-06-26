const request = require('supertest');
const app = require('../backend/server');

describe('Trivia & Leaderboard E2E Tests (F6)', () => {
  const user1 = { username: 'playerone', email: 'one@example.com', password: 'Password123!' };
  const user2 = { username: 'playertwo', email: 'two@example.com', password: 'Password123!' };
  let token1, token2;

  beforeEach(async () => {
    const res1 = await request(app).post('/api/auth/register').send(user1);
    token1 = res1.body.token;

    const res2 = await request(app).post('/api/auth/register').send(user2);
    token2 = res2.body.token;
  });

  // --- Tier 1: Feature Coverage ---
  describe('Tier 1: Feature Coverage', () => {
    it('F6-T1-1: should submit a trivia score successfully for authenticated user', async () => {
      const scoreData = { score: 120, category: 'Sci-Fi' };

      const res = await request(app)
        .post('/api/trivia/score')
        .set('Authorization', `Bearer ${token1}`)
        .send(scoreData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.score).toBe(scoreData.score);
      expect(res.body.data.category).toBe(scoreData.category);
    });

    it('F6-T1-2: should retrieve the leaderboard successfully without authentication', async () => {
      const res = await request(app)
        .get('/api/trivia/leaderboard');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('F6-T1-3: should return leaderboard sorted by score in descending order', async () => {
      // Submit score 50 for user1
      await request(app)
        .post('/api/trivia/score')
        .set('Authorization', `Bearer ${token1}`)
        .send({ score: 50 });

      // Submit score 95 for user2
      await request(app)
        .post('/api/trivia/score')
        .set('Authorization', `Bearer ${token2}`)
        .send({ score: 95 });

      const res = await request(app)
        .get('/api/trivia/leaderboard');

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].score).toBe(95);
      expect(res.body.data[1].score).toBe(50);
    });

    it('F6-T1-4: should limit leaderboard to top 10 scores', async () => {
      // Submit 12 different scores
      for (let i = 1; i <= 12; i++) {
        // Register a temporary user for each score to make it distinct
        const tempUser = { username: `user_${i}`, email: `user_${i}@example.com`, password: 'Password123!' };
        const regRes = await request(app).post('/api/auth/register').send(tempUser);
        const tempToken = regRes.body.token;

        await request(app)
          .post('/api/trivia/score')
          .set('Authorization', `Bearer ${tempToken}`)
          .send({ score: i * 10 });
      }

      const res = await request(app)
        .get('/api/trivia/leaderboard');

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBe(10);
      expect(res.body.data[0].score).toBe(120); // maximum score (12 * 10)
      expect(res.body.data[9].score).toBe(30);  // 10th score
    });

    it('F6-T1-5: should populate user details (username, profileTheme) in leaderboard results', async () => {
      await request(app)
        .post('/api/trivia/score')
        .set('Authorization', `Bearer ${token1}`)
        .send({ score: 85 });

      const res = await request(app)
        .get('/api/trivia/leaderboard');

      expect(res.statusCode).toEqual(200);
      expect(res.body.data[0]).toHaveProperty('user');
      expect(res.body.data[0].user).toHaveProperty('username', user1.username);
      expect(res.body.data[0].user).toHaveProperty('profileTheme');
    });
  });

  // --- Tier 2: Boundary & Corner Cases ---
  describe('Tier 2: Boundary & Corner Cases', () => {
    it('F6-T2-1: should fail to submit score if user is not authenticated', async () => {
      const res = await request(app)
        .post('/api/trivia/score')
        .send({ score: 100 });

      expect(res.statusCode).toEqual(401);
    });

    it('F6-T2-2: should fail to submit score if score field is missing', async () => {
      const res = await request(app)
        .post('/api/trivia/score')
        .set('Authorization', `Bearer ${token1}`)
        .send({ category: 'Sci-Fi' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBeDefined();
    });

    it('F6-T2-3: should default category to general if not provided', async () => {
      const res = await request(app)
        .post('/api/trivia/score')
        .set('Authorization', `Bearer ${token1}`)
        .send({ score: 75 });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.category).toBe('general');
    });

    it('F6-T2-4: should handle submitting multiple scores for same user correctly', async () => {
      // User 1 submits 3 scores
      await request(app)
        .post('/api/trivia/score')
        .set('Authorization', `Bearer ${token1}`)
        .send({ score: 40 });
      await request(app)
        .post('/api/trivia/score')
        .set('Authorization', `Bearer ${token1}`)
        .send({ score: 60 });
      await request(app)
        .post('/api/trivia/score')
        .set('Authorization', `Bearer ${token1}`)
        .send({ score: 50 });

      const res = await request(app)
        .get('/api/trivia/leaderboard');

      // The database retains all entries, leaderboard will return them sorted
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data[0].score).toBe(60);
      expect(res.body.data[1].score).toBe(50);
      expect(res.body.data[2].score).toBe(40);
    });

    it('F6-T2-5: should return empty data list if no scores have been submitted yet', async () => {
      const res = await request(app)
        .get('/api/trivia/leaderboard');

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual([]);
    });
  });
});
