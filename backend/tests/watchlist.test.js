const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Watchlist = require('../models/Watchlist');

describe('Watchlist API', () => {
  let token;
  let user;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'watchlistuser',
        email: 'watchlist@example.com',
        password: 'password123'
      });
    
    token = res.body.token;
    user = res.body.user;
  });

  it('should get an empty watchlist initially', async () => {
    const res = await request(app)
      .get('/api/watchlist')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.count).toBe(0);
    expect(res.body.data).toEqual([]);
  });

  it('should add an item to the watchlist', async () => {
    const res = await request(app)
      .post('/api/watchlist')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tmdbId: 12345,
        mediaType: 'movie',
        title: 'Test Movie',
        posterPath: '/path.jpg',
        rating: 8.5
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.data.tmdbId).toBe(12345);
  });

  it('should not add duplicate item', async () => {
    await request(app)
      .post('/api/watchlist')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tmdbId: 12345,
        mediaType: 'movie',
        title: 'Test Movie'
      });

    const res = await request(app)
      .post('/api/watchlist')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tmdbId: 12345,
        mediaType: 'movie',
        title: 'Test Movie'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBeDefined();
  });

  it('should delete an item from the watchlist', async () => {
    await request(app)
      .post('/api/watchlist')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tmdbId: 12345,
        mediaType: 'movie',
        title: 'Test Movie'
      });

    const res = await request(app)
      .delete('/api/watchlist/12345')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Item removed');
    expect(res.body.data).toEqual({});

    const getRes = await request(app)
      .get('/api/watchlist')
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.body.count).toBe(0);
  });
});
