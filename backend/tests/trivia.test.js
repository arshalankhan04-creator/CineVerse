const request = require('supertest');
const app = require('../server');

describe('Trivia API', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'triviauser',
        email: 'trivia@example.com',
        password: 'Password123!'
      });
    
    token = res.body.token;
  });

  it('should submit a trivia score', async () => {
    const res = await request(app)
      .post('/api/trivia/score')
      .set('Authorization', `Bearer ${token}`)
      .send({
        score: 100,
        category: 'movies'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.score).toBe(100);
    expect(res.body.data.category).toBe('movies');
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.user.username).toBe('triviauser');
  });

  it('should get global leaderboard', async () => {
    await request(app)
      .post('/api/trivia/score')
      .set('Authorization', `Bearer ${token}`)
      .send({
        score: 250,
      });

    const res = await request(app)
      .get('/api/trivia/leaderboard');

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].score).toBe(250);
    expect(res.body.data[0].user.username).toBe('triviauser');
  });
});
