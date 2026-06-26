const request = require('supertest');
const app = require('../backend/server');

describe('Custom Collections E2E Tests (F5)', () => {
  const userA = {
    username: 'collectionuserA',
    email: 'collectionA@example.com',
    password: 'Password123!'
  };
  const userB = {
    username: 'collectionuserB',
    email: 'collectionB@example.com',
    password: 'Password123!'
  };
  let tokenA;
  let tokenB;

  beforeEach(async () => {
    const resA = await request(app).post('/api/auth/register').send(userA);
    tokenA = resA.body.token;

    const resB = await request(app).post('/api/auth/register').send(userB);
    tokenB = resB.body.token;
  });

  // --- Tier 1: Feature Coverage ---
  describe('Tier 1: Feature Coverage', () => {
    it('F5-T1-1: should create a new custom list successfully', async () => {
      const listData = {
        name: 'My Sci-Fi Favorites',
        description: 'The best science fiction movies ever',
        isPublic: true
      };

      const res = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(listData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(listData.name);
      expect(res.body.data.description).toBe(listData.description);
      expect(res.body.data.isPublic).toBe(listData.isPublic);
      expect(res.body.data.items).toEqual([]);
    });

    it('F5-T1-2: should retrieve user\'s custom lists successfully', async () => {
      await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'List 1' });

      await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'List 2' });

      const res = await request(app)
        .get('/api/lists')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].name).toBe('List 2'); // sorted by -createdAt
    });

    it('F5-T1-3: should add an item to a custom list successfully', async () => {
      const createRes = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'My List' });
      const listId = createRes.body.data._id;

      const item = {
        tmdbId: 301,
        mediaType: 'movie',
        title: 'Interstellar',
        posterPath: '/interstellar.jpg'
      };

      const res = await request(app)
        .put(`/api/lists/${listId}/items`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ item, action: 'add' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].tmdbId).toBe(item.tmdbId);
    });

    it('F5-T1-4: should remove an item from a custom list successfully', async () => {
      const createRes = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'My List' });
      const listId = createRes.body.data._id;

      const item = {
        tmdbId: 301,
        mediaType: 'movie',
        title: 'Interstellar'
      };

      // Add item first
      await request(app)
        .put(`/api/lists/${listId}/items`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ item, action: 'add' });

      // Remove item
      const res = await request(app)
        .put(`/api/lists/${listId}/items`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ item, action: 'remove' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(0);
    });

    it('F5-T1-5: should delete a custom list successfully', async () => {
      const createRes = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Temporary List' });
      const listId = createRes.body.data._id;

      const deleteRes = await request(app)
        .delete(`/api/lists/${listId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(deleteRes.statusCode).toEqual(200);
      expect(deleteRes.body.success).toBe(true);

      const getRes = await request(app)
        .get('/api/lists')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(getRes.body.data.length).toBe(0);
    });
  });

  // --- Tier 2: Boundary & Corner Cases ---
  describe('Tier 2: Boundary & Corner Cases', () => {
    it('F5-T2-1: should fail to create a custom list if user is not authenticated', async () => {
      const res = await request(app)
        .post('/api/lists')
        .send({ name: 'Unauth List' });

      expect(res.statusCode).toEqual(401);
    });

    it('F5-T2-2: should fail to create a custom list if name is missing', async () => {
      const res = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ description: 'No name list' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBeDefined();
    });

    it('F5-T2-3: should fail to create a custom list if name is longer than 50 characters', async () => {
      const longName = 'A'.repeat(51);
      const res = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: longName });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBeDefined();
    });

    it('F5-T2-4: should fail to update list items if the list ID is invalid or does not exist', async () => {
      const item = {
        tmdbId: 301,
        mediaType: 'movie',
        title: 'Interstellar'
      };

      const res = await request(app)
        .put('/api/lists/609c12345678901234567890/items')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ item, action: 'add' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toBe('List not found');
    });

    it('F5-T2-5: should fail to update list items if the user is not the owner of the list', async () => {
      const createRes = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'User A\'s List' });
      const listId = createRes.body.data._id;

      const item = {
        tmdbId: 301,
        mediaType: 'movie',
        title: 'Interstellar'
      };

      // Try updating as User B
      const res = await request(app)
        .put(`/api/lists/${listId}/items`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ item, action: 'add' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toBe('List not found');
    });
  });
});
