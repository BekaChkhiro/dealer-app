const request = require('supertest');
const { app, loginAsAdmin, createTestUser, deleteTestUser, closePool } = require('./setup');

let adminAgent;
let testUser;

beforeAll(async () => {
  adminAgent = await loginAsAdmin();
  const created = await createTestUser(adminAgent);
  testUser = { ...created.user, password: created.password };
});

afterAll(async () => {
  if (testUser?.id) await deleteTestUser(adminAgent, testUser.id);
  await closePool();
});

describe('Authentication', () => {
  describe('POST /api/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ user: 'admin', password: 'admin123' });

      expect(res.status).toBe(200);
      expect(res.body.error).toBe(0);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.username).toBe('admin');
      expect(res.body.data.password_hash).toBeUndefined();
    });

    it('should login with email', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ user: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ user: 'admin', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe(1);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ user: 'nouser_xyz', password: 'whatever' });

      expect(res.status).toBe(401);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ user: 'admin' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/user (session persistence)', () => {
    it('should return user data when authenticated', async () => {
      const res = await adminAgent.get('/api/user');

      expect(res.status).toBe(200);
      expect(res.body.error).toBe(0);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.username).toBe('admin');
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/user');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/logout', () => {
    it('should destroy session and log out', async () => {
      // Create a fresh session to test logout
      const agent = request.agent(app);
      await agent.post('/api/login').send({ user: 'admin', password: 'admin123' });

      // Verify logged in
      let res = await agent.get('/api/user');
      expect(res.status).toBe(200);

      // Logout
      res = await agent.post('/api/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify session destroyed
      res = await agent.get('/api/user');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/change-password', () => {
    it('should change password with valid old password', async () => {
      // Login as test user
      const agent = request.agent(app);
      await agent.post('/api/login').send({ user: testUser.username, password: testUser.password });

      // Change password
      let res = await agent
        .post('/api/change-password')
        .send({ old_password: testUser.password, new_password: 'newpass456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Login with new password
      res = await request(app)
        .post('/api/login')
        .send({ user: testUser.username, password: 'newpass456' });
      expect(res.status).toBe(200);

      // Restore original password
      const agent2 = request.agent(app);
      await agent2.post('/api/login').send({ user: testUser.username, password: 'newpass456' });
      await agent2
        .post('/api/change-password')
        .send({ old_password: 'newpass456', new_password: testUser.password });
    });

    it('should reject wrong old password', async () => {
      const agent = request.agent(app);
      await agent.post('/api/login').send({ user: testUser.username, password: testUser.password });

      const res = await agent
        .post('/api/change-password')
        .send({ old_password: 'wrongold', new_password: 'newpass456' });

      expect(res.status).toBe(401);
    });

    it('should reject short new password', async () => {
      const agent = request.agent(app);
      await agent.post('/api/login').send({ user: testUser.username, password: testUser.password });

      const res = await agent
        .post('/api/change-password')
        .send({ old_password: testUser.password, new_password: 'ab' });

      expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/change-password')
        .send({ old_password: 'x', new_password: 'y' });

      expect(res.status).toBe(401);
    });
  });
});

describe('Health Check', () => {
  it('GET /api/health should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
