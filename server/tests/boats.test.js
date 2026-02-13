const request = require('supertest');
const { app, loginAsAdmin, createTestUser, loginAs, deleteTestUser, closePool } = require('./setup');

let adminAgent;
const createdBoatIds = [];

beforeAll(async () => {
  adminAgent = await loginAsAdmin();
});

afterAll(async () => {
  for (const id of createdBoatIds) {
    await adminAgent.delete(`/api/boats/${id}`).catch(() => {});
  }
  await closePool();
});

describe('Boats CRUD', () => {
  describe('POST /api/boats', () => {
    it('should create a boat', async () => {
      const res = await adminAgent
        .post('/api/boats')
        .send({
          name: 'Test Vessel Alpha',
          identification_code: 'TV-001',
          status: 'us_port',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Vessel Alpha');
      expect(res.body.data.status).toBe('us_port');
      createdBoatIds.push(res.body.data.id);
    });

    it('should default status to us_port', async () => {
      const res = await adminAgent
        .post('/api/boats')
        .send({ name: 'Default Status Boat' });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('us_port');
      createdBoatIds.push(res.body.data.id);
    });

    it('should reject missing name', async () => {
      const res = await adminAgent
        .post('/api/boats')
        .send({ identification_code: 'NO-NAME' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/boats', () => {
    it('should return paginated boats', async () => {
      const res = await adminAgent.get('/api/boats?limit=5&page=1');

      expect(res.status).toBe(200);
      expect(res.body.error).toBe(0);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.total).toBeDefined();
    });

    it('should support keyword search', async () => {
      const res = await adminAgent.get('/api/boats?keyword=Test Vessel Alpha');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should support status filter', async () => {
      const res = await adminAgent.get('/api/boats?status=us_port');

      expect(res.status).toBe(200);
      res.body.data.forEach(b => {
        expect(b.status).toBe('us_port');
      });
    });

    it('should support sorting', async () => {
      const res = await adminAgent.get('/api/boats?sort_by=id&asc=asc&limit=10');

      expect(res.status).toBe(200);
      const ids = res.body.data.map(b => b.id);
      for (let i = 1; i < ids.length; i++) {
        expect(ids[i]).toBeGreaterThanOrEqual(ids[i - 1]);
      }
    });
  });

  describe('PUT /api/boats/:id', () => {
    it('should update boat fields', async () => {
      const createRes = await adminAgent
        .post('/api/boats')
        .send({ name: 'Update Boat' });
      const boatId = createRes.body.data.id;
      createdBoatIds.push(boatId);

      const res = await adminAgent
        .put(`/api/boats/${boatId}`)
        .send({ name: 'Updated Boat', status: 'in_transit' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Boat');
      expect(res.body.data.status).toBe('in_transit');
    });

    it('should return 404 for non-existent boat', async () => {
      const res = await adminAgent
        .put('/api/boats/999999')
        .send({ name: 'Ghost' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/boats/:id', () => {
    it('should delete a boat', async () => {
      const createRes = await adminAgent
        .post('/api/boats')
        .send({ name: 'Delete Boat' });
      const boatId = createRes.body.data.id;

      const res = await adminAgent.delete(`/api/boats/${boatId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent boat', async () => {
      const res = await adminAgent.delete('/api/boats/999999');
      expect(res.status).toBe(404);
    });
  });
});

describe('Boats - Role-Based Access', () => {
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

  it('should allow non-admin GET /api/boats', async () => {
    const res = await regularAgent.get('/api/boats');
    expect(res.status).toBe(200);
  });

  it('should deny non-admin POST /api/boats', async () => {
    const res = await regularAgent.post('/api/boats').send({ name: 'Hack Boat' });
    expect(res.status).toBe(403);
  });

  it('should deny non-admin PUT /api/boats/:id', async () => {
    const res = await regularAgent.put('/api/boats/1').send({ name: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('should deny non-admin DELETE /api/boats/:id', async () => {
    const res = await regularAgent.delete('/api/boats/1');
    expect(res.status).toBe(403);
  });
});
