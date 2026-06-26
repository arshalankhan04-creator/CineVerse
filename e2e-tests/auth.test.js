const request = require('supertest');
const app = require('../backend/server');

describe('Auth & Profile E2E Tests (F1, F2, F3)', () => {
  const registerData = {
    username: 'authuser',
    email: 'auth@example.com',
    password: 'Password123!'
  };

  // --- F1: User Registration ---
  describe('F1: User Registration', () => {
    // Tier 1: Feature Coverage
    it('F1-T1-1: should register a new user successfully with valid details', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(registerData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.username).toBe(registerData.username);
      expect(res.body.user.email).toBe(registerData.email);
    });

    it('F1-T1-2: should return default profile theme and basic membership tier on registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'defaultfields',
          email: 'defaults@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.user.profileTheme).toBe('default');
      expect(res.body.user.membershipTier).toBe('Basic');
      expect(res.body.user.favoriteGenres).toEqual([]);
    });

    it('F1-T1-3: should return a valid JWT token on successful registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'tokenuser',
          email: 'token@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe('string');
    });

    it('F1-T1-4: should successfully register another user with a different email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'anotheruser',
          email: 'another@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.user.username).toBe('anotheruser');
    });

    it('F1-T1-5: should return response format including success flag, token, and user info', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'formatuser',
          email: 'format@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('username');
      expect(res.body.user).toHaveProperty('email');
    });

    // Tier 2: Boundary & Corner Cases
    it('F1-T2-1: should fail to register with an already registered email', async () => {
      await request(app).post('/api/auth/register').send(registerData);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'differentname',
          email: registerData.email,
          password: 'Password123!'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBeDefined();
    });

    it('F1-T2-2: should fail to register with an already registered username', async () => {
      await request(app).post('/api/auth/register').send(registerData);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: registerData.username,
          email: 'different@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBeDefined();
    });

    it('F1-T2-3: should fail to register with an invalid email address format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'bademail',
          email: 'bademailformat',
          password: 'Password123!'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBeDefined();
    });

    it('F1-T2-4: should fail to register with a password less than 8 characters long', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'shortpass',
          email: 'shortpass@example.com',
          password: 'Pass12!'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBeDefined();
    });

    it('F1-T2-5: should fail to register if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: '',
          email: 'missing@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBeDefined();
    });
  });

  // --- F2: User Login ---
  describe('F2: User Login', () => {
    beforeEach(async () => {
      // Register the test user before login tests
      await request(app).post('/api/auth/register').send(registerData);
    });

    // Tier 1: Feature Coverage
    it('F2-T1-1: should successfully login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: registerData.email,
          password: registerData.password
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });

    it('F2-T1-2: should return a valid token upon successful login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: registerData.email,
          password: registerData.password
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe('string');
    });

    it('F2-T1-3: should return correct user profile details on successful login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: registerData.email,
          password: registerData.password
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.user.username).toBe(registerData.username);
      expect(res.body.user.email).toBe(registerData.email);
    });

    it('F2-T1-4: should fail login with incorrect password for an existing user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: registerData.email,
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toBeDefined();
    });

    it('F2-T1-5: should fail login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'notfound@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toBeDefined();
    });

    // Tier 2: Boundary & Corner Cases
    it('F2-T2-1: should fail to login if email field is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Password123!'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBeDefined();
    });

    it('F2-T2-2: should fail to login if password field is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: registerData.email
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBeDefined();
    });

    it('F2-T2-3: should fail to login if both email and password fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBeDefined();
    });

    it('F2-T2-4: should fail to login with an invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalidemail',
          password: 'Password123!'
        });

      // The controller attempts User.findOne({ email }), which will return null and yield 401
      expect(res.statusCode).toEqual(401);
    });

    it('F2-T2-5: should fail to login with an empty string password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: registerData.email,
          password: ''
        });

      expect(res.statusCode).toEqual(400);
    });
  });

  // --- F3: User Profile Management ---
  describe('F3: User Profile Management', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send(registerData);
      token = res.body.token;
    });

    // Tier 1: Feature Coverage
    it('F3-T1-1: should fetch current user details (me) with a valid authorization token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe(registerData.username);
    });

    it('F3-T1-2: should fail to fetch current user details without an authorization token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toBeDefined();
    });

    it('F3-T1-3: should update user favorite genres successfully with a valid genres array', async () => {
      const res = await request(app)
        .put('/api/auth/me/genres')
        .set('Authorization', `Bearer ${token}`)
        .send({
          genres: ['Sci-Fi', 'Action', 'Drama']
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(['Sci-Fi', 'Action', 'Drama']);
    });

    it('F3-T1-4: should verify updated genres are persisted when fetching user profile details', async () => {
      await request(app)
        .put('/api/auth/me/genres')
        .set('Authorization', `Bearer ${token}`)
        .send({
          genres: ['Comedy', 'Thriller']
        });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.favoriteGenres).toEqual(['Comedy', 'Thriller']);
    });

    it('F3-T1-5: should allow updating favorite genres to an empty array', async () => {
      const res = await request(app)
        .put('/api/auth/me/genres')
        .set('Authorization', `Bearer ${token}`)
        .send({
          genres: []
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual([]);
    });

    // Tier 2: Boundary & Corner Cases
    it('F3-T2-1: should fail to update favorite genres when genres is not an array', async () => {
      const res = await request(app)
        .put('/api/auth/me/genres')
        .set('Authorization', `Bearer ${token}`)
        .send({
          genres: 'Sci-Fi'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBeDefined();
    });

    it('F3-T2-2: should fail to update favorite genres if request lacks authorization token', async () => {
      const res = await request(app)
        .put('/api/auth/me/genres')
        .send({
          genres: ['Drama']
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toBeDefined();
    });

    it('F3-T2-3: should fail to fetch profile details using an invalid/expired token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer invalidtoken`);

      expect(res.statusCode).toEqual(401);
    });

    it('F3-T2-4: should fail to update favorite genres using an invalid/expired token', async () => {
      const res = await request(app)
        .put('/api/auth/me/genres')
        .set('Authorization', `Bearer invalidtoken`)
        .send({
          genres: ['Sci-Fi']
        });

      expect(res.statusCode).toEqual(401);
    });

    it('F3-T2-5: should fail to fetch profile details using a malformed token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer123`);

      expect(res.statusCode).toEqual(401);
    });
  });
});
