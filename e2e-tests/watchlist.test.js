const request = require('supertest');
const app = require('../backend/server');

describe('Watchlist E2E Tests (F4)', () => {
  const userData = {
    username: 'watchlistuser',
    email: 'watchlist@example.com',
    password: 'password123'
  };
  let token;

  beforeEach(async () => {
    // Register a new user and retrieve token
    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);
    token = res.body.token;
  });

  // --- Tier 1: Feature Coverage ---
  describe('Tier 1: Feature Coverage', () => {
    it('F4-T1-1: should add a movie to the watchlist successfully with all required details', async () => {
      const itemData = {
        tmdbId: 101,
        mediaType: 'movie',
        title: 'Inception',
        posterPath: '/inception.jpg',
        rating: 8.8
      };

      const res = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send(itemData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(itemData.title);
      expect(res.body.data.tmdbId).toBe(itemData.tmdbId);
      expect(res.body.data.mediaType).toBe(itemData.mediaType);
    });

    it('F4-T1-2: should add a tv show to the watchlist successfully', async () => {
      const itemData = {
        tmdbId: 201,
        mediaType: 'tv',
        title: 'Breaking Bad',
        posterPath: '/breaking_bad.jpg',
        rating: 9.5
      };

      const res = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send(itemData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mediaType).toBe('tv');
    });

    it('F4-T1-3: should retrieve the user\'s watchlist successfully, ordered by creation time', async () => {
      const item1 = { tmdbId: 101, mediaType: 'movie', title: 'Inception' };
      const item2 = { tmdbId: 102, mediaType: 'movie', title: 'Interstellar' };

      await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send(item1);

      await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send(item2);

      const res = await request(app)
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data[0].tmdbId).toBe(102); // newest first (sort('-createdAt'))
      expect(res.body.data[1].tmdbId).toBe(101);
    });

    it('F4-T1-4: should remove a movie from the watchlist successfully by tmdbId', async () => {
      const item = { tmdbId: 101, mediaType: 'movie', title: 'Inception' };

      await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send(item);

      const deleteRes = await request(app)
        .delete('/api/watchlist/101')
        .set('Authorization', `Bearer ${token}`);

      expect(deleteRes.statusCode).toEqual(200);
      expect(deleteRes.body.success).toBe(true);

      const getRes = await request(app)
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.body.count).toBe(0);
    });

    it('F4-T1-5: should return correct response structure after adding an item to the watchlist', async () => {
      const item = { tmdbId: 101, mediaType: 'movie', title: 'Inception' };

      const res = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send(item);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('tmdbId');
      expect(res.body.data).toHaveProperty('mediaType');
      expect(res.body.data).toHaveProperty('title');
    });
  });

  // --- Tier 2: Boundary & Corner Cases ---
  describe('Tier 2: Boundary & Corner Cases', () => {
    it('F4-T2-1: should fail to add an item to the watchlist if the user is not authenticated', async () => {
      const item = { tmdbId: 101, mediaType: 'movie', title: 'Inception' };

      const res = await request(app)
        .post('/api/watchlist')
        .send(item);

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toBeDefined();
    });

    it('F4-T2-2: should fail to add an item to the watchlist if duplicate tmdbId is added', async () => {
      const item = { tmdbId: 101, mediaType: 'movie', title: 'Inception' };

      await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send(item);

      const res = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send(item);

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBe('Item already in watchlist');
    });

    it('F4-T2-3: should fail to add an item to the watchlist if required fields (tmdbId) are missing', async () => {
      const item = { mediaType: 'movie', title: 'Inception' };

      const res = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send(item);

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBeDefined();
    });

    it('F4-T2-4: should fail to add an item if mediaType is not movie or tv', async () => {
      const item = { tmdbId: 101, mediaType: 'anime', title: 'Inception' };

      const res = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send(item);

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBeDefined();
    });

    it('F4-T2-5: should return 404 when trying to remove an item that does not exist in the watchlist', async () => {
      const res = await request(app)
        .delete('/api/watchlist/999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toBe('Item not found in watchlist');
    });
  });
});
