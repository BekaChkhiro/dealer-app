const request = require('supertest');
const { app, loginAsAdmin, createTestUser, loginAs, deleteTestUser, closePool } = require('./setup');

let adminAgent;
const createdUserIds = [];

beforeAll(async () => {
  adminAgent = await loginAsAdmin();
});

afterAll(async () => {
  // Cleanup created test users
  for (const id of createdUserIds) {
    await adminAgent.delete(`/api/users/${id}`).catch(() => {});
  }
  await closePool();
});

describe('Users CRUD', () => {
  const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const u = unique();
      const res = await adminAgent
        .post('/api/users')
        .send({
          name: 'John',
          surname: 'Doe',
          email: `john_${u}@test.com`,
          username: `johndoe_${u}`,
          password: 'pass1234',
          role: 'user',
          phone: '555-0101',
        });

      expect(res.status).toBe(201);
      expect(res.body.error).toBe(0);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('John');
      expect(res.body.data.surname).toBe('Doe');
      expect(res.body.data.role).toBe('user');
      expect(res.body.data.password_hash).toBeUndefined();
      createdUserIds.push(res.body.data.id);
    });

    it('should reject duplicate email', async () => {
      const u = unique();
      const userData = {
        name: 'Dup',
        surname: 'Test',
        email: `dup_${u}@test.com`,
        username: `dup_${u}`,
        password: 'pass1234',
      };

      const res1 = await adminAgent.post('/api/users').send(userData);
      expect(res1.status).toBe(201);
      createdUserIds.push(res1.body.data.id);

      const res2 = await adminAgent.post('/api/users').send({
        ...userData,
        username: `dup2_${u}`,
      });
      expect(res2.status).toBe(409);
    });

    it('should reject missing required fields', async () => {
      const res = await adminAgent
        .post('/api/users')
        .send({ name: 'NoEmail' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/users', () => {
    it('should return paginated users', async () => {
      const res = await adminAgent.get('/api/users?limit=5&page=1');

      expect(res.status).toBe(200);
      expect(res.body.error).toBe(0);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.total).toBeDefined();
      expect(typeof res.body.total).toBe('number');
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should support keyword search', async () => {
      const tag = unique();
      const res1 = await adminAgent.post('/api/users').send({
        name: 'SearchMe',
        surname: 'Unique',
        email: `searchme_${tag}@test.com`,
        username: `searchme_${tag}`,
        password: 'pass1234',
      });
      createdUserIds.push(res1.body.data.id);

      const res = await adminAgent.get(`/api/users?keyword=searchme_${tag}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.some(row => row.username === `searchme_${tag}`)).toBe(true);
    });

    it('should support sorting', async () => {
      const res = await adminAgent.get('/api/users?sort_by=id&asc=asc&limit=5');

      expect(res.status).toBe(200);
      const ids = res.body.data.map(u => u.id);
      for (let i = 1; i < ids.length; i++) {
        expect(ids[i]).toBeGreaterThanOrEqual(ids[i - 1]);
      }
    });

    it('should support role filter', async () => {
      const res = await adminAgent.get('/api/users?role=admin');

      expect(res.status).toBe(200);
      res.body.data.forEach(u => {
        expect(u.role).toBe('admin');
      });
    });

    it('should not expose password_hash', async () => {
      const res = await adminAgent.get('/api/users?limit=3');

      expect(res.status).toBe(200);
      res.body.data.forEach(u => {
        expect(u.password_hash).toBeUndefined();
      });
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user fields', async () => {
      const u = unique();
      const createRes = await adminAgent.post('/api/users').send({
        name: 'Update',
        surname: 'Me',
        email: `update_${u}@test.com`,
        username: `update_${u}`,
        password: 'pass1234',
      });
      const userId = createRes.body.data.id;
      createdUserIds.push(userId);

      const res = await adminAgent
        .put(`/api/users/${userId}`)
        .send({ name: 'Updated', phone: '555-9999' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated');
      expect(res.body.data.phone).toBe('555-9999');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await adminAgent
        .put('/api/users/999999')
        .send({ name: 'Ghost' });

      expect(res.status).toBe(404);
    });

    it('should reject empty update', async () => {
      const u = unique();
      const createRes = await adminAgent.post('/api/users').send({
        name: 'Empty',
        surname: 'Update',
        email: `empty_${u}@test.com`,
        username: `empty_${u}`,
        password: 'pass1234',
      });
      createdUserIds.push(createRes.body.data.id);

      const res = await adminAgent
        .put(`/api/users/${createRes.body.data.id}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      const u = unique();
      const createRes = await adminAgent.post('/api/users').send({
        name: 'Delete',
        surname: 'Me',
        email: `delete_${u}@test.com`,
        username: `delete_${u}`,
        password: 'pass1234',
      });
      const userId = createRes.body.data.id;

      const res = await adminAgent.delete(`/api/users/${userId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify user no longer exists
      const getRes = await adminAgent.get(`/api/users?keyword=delete_${u}`);
      expect(getRes.body.data.some(u => u.id === userId)).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await adminAgent.delete('/api/users/999999');
      expect(res.status).toBe(404);
    });

    it('should prevent self-deletion', async () => {
      // Get admin user ID
      const userRes = await adminAgent.get('/api/user');
      const adminId = userRes.body.data.id;

      const res = await adminAgent.delete(`/api/users/${adminId}`);
      expect(res.status).toBe(400);
    });
  });
});

describe('Users - Role-Based Access', () => {
  let regularUser;
  let regularAgent;

  beforeAll(async () => {
    const created = await createTestUser(adminAgent);
    regularUser = created.user;
    regularAgent = await loginAs(regularUser.username, created.password);
  });

  afterAll(async () => {
    if (regularUser?.id) await deleteTestUser(adminAgent, regularUser.id);
  });

  it('should deny non-admin GET /api/users', async () => {
    const res = await regularAgent.get('/api/users');
    expect(res.status).toBe(403);
  });

  it('should deny non-admin POST /api/users', async () => {
    const res = await regularAgent.post('/api/users').send({
      name: 'Hack',
      email: 'hack@test.com',
      username: 'hacker',
      password: 'hack123',
    });
    expect(res.status).toBe(403);
  });

  it('should deny non-admin PUT /api/users/:id', async () => {
    const res = await regularAgent.put('/api/users/1').send({ name: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('should deny non-admin DELETE /api/users/:id', async () => {
    const res = await regularAgent.delete('/api/users/1');
    expect(res.status).toBe(403);
  });

  it('should deny unauthenticated access', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});
