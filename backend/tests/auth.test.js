const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBeTruthy();
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('testuser');
  });

  it('should fail to register with existing email', async () => {
    await User.create({
      username: 'testuser1',
      email: 'test@example.com',
      password: 'Password123!'
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser2',
        email: 'test@example.com',
        password: 'Password123!'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toContain('User already exists');
  });

  it('should login an existing user', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'loginuser',
        email: 'login@example.com',
        password: 'Password123!'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'Password123!'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.token).toBeDefined();
  });

  it('should get current logged in user details (me)', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'meuser',
        email: 'me@example.com',
        password: 'Password123!'
      });

    const token = regRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.username).toBe('meuser');
  });

  it('should get current logged in user details (me) with formatted profile info', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'meuser2',
        email: 'me2@example.com',
        password: 'Password123!'
      });

    const token = regRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.username).toBe('meuser2');
    expect(res.body.data.email).toBe('me2@example.com');
    expect(res.body.data.profileTheme).toBeDefined();
    expect(res.body.data.favoriteGenres).toBeDefined();
    expect(res.body.data.id).toBeDefined();
  });

  it('should update profile theme preference', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'themeuser',
        email: 'theme@example.com',
        password: 'Password123!'
      });

    const token = regRes.body.token;

    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ profileTheme: 'dark' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profileTheme).toBe('dark');
    expect(res.body.data.username).toBe('themeuser');
    expect(res.body.data.email).toBe('theme@example.com');
    expect(res.body.data.id).toBeDefined();
  });
});
