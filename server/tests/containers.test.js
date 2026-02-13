const request = require('supertest');
const { app, loginAsAdmin, createTestUser, loginAs, deleteTestUser, closePool } = require('./setup');

let adminAgent;
const createdContainerIds = [];

beforeAll(async () => {
  adminAgent = await loginAsAdmin();
});

afterAll(async () => {
  for (const id of createdContainerIds) {
    await adminAgent.delete(`/api/containers/${id}`).catch(() => {});
  }
  await closePool();
});

describe('Containers CRUD', () => {
  describe('POST /api/containers', () => {
    it('should create a container', async () => {
      const res = await adminAgent
        .post('/api/containers')
        .send({
          container_number: `CNT-${Date.now()}`,
          vin: `CVIN${Date.now()}`,
          buyer_name: 'Container Buyer',
          delivery_location: 'Poti',
          line: 'MSC',
          loading_port: 'Newark',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.buyer_name).toBe('Container Buyer');
      expect(res.body.data.status).toBe('booked');
      createdContainerIds.push(res.body.data.id);
    });

    it('should default status to booked', async () => {
      const res = await adminAgent
        .post('/api/containers')
        .send({ container_number: `CNT2-${Date.now()}` });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('booked');
      createdContainerIds.push(res.body.data.id);
    });
  });

  describe('GET /api/containers', () => {
    it('should return paginated containers', async () => {
      const res = await adminAgent.get('/api/containers?limit=5&page=1');

      expect(res.status).toBe(200);
      expect(res.body.error).toBe(0);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.total).toBeDefined();
    });

    it('should support keyword search', async () => {
      const res = await adminAgent.get('/api/containers?keyword=Container Buyer');

      expect(res.status).toBe(200);
    });

    it('should support status filter', async () => {
      const res = await adminAgent.get('/api/containers?status=booked');

      expect(res.status).toBe(200);
      res.body.data.forEach(c => {
        expect(c.status).toBe('booked');
      });
    });

    it('should support date range filter', async () => {
      const res = await adminAgent.get(
        '/api/containers?start_date=2020-01-01&end_date=2030-12-31'
      );
      expect(res.status).toBe(200);
    });

    it('should support sorting', async () => {
      const res = await adminAgent.get('/api/containers?sort_by=id&asc=asc&limit=10');

      expect(res.status).toBe(200);
      const ids = res.body.data.map(c => c.id);
      for (let i = 1; i < ids.length; i++) {
        expect(ids[i]).toBeGreaterThanOrEqual(ids[i - 1]);
      }
    });
  });

  describe('PUT /api/containers/:id', () => {
    it('should update container fields', async () => {
      const createRes = await adminAgent
        .post('/api/containers')
        .send({ container_number: `CNTU-${Date.now()}` });
      const containerId = createRes.body.data.id;
      createdContainerIds.push(containerId);

      const res = await adminAgent
        .put(`/api/containers/${containerId}`)
        .send({ status: 'loaded', delivery_location: 'Batumi' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('loaded');
      expect(res.body.data.delivery_location).toBe('Batumi');
    });

    it('should return 404 for non-existent container', async () => {
      const res = await adminAgent
        .put('/api/containers/999999')
        .send({ status: 'loaded' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/containers/:id', () => {
    it('should delete a container', async () => {
      const createRes = await adminAgent
        .post('/api/containers')
        .send({ container_number: `CNTD-${Date.now()}` });
      const containerId = createRes.body.data.id;

      const res = await adminAgent.delete(`/api/containers/${containerId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent container', async () => {
      const res = await adminAgent.delete('/api/containers/999999');
      expect(res.status).toBe(404);
    });
  });
});

describe('Containers - Role-Based Access', () => {
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

  it('should allow non-admin GET /api/containers (own data only)', async () => {
    const res = await regularAgent.get('/api/containers');
    expect(res.status).toBe(200);
  });

  it('should deny non-admin POST /api/containers', async () => {
    const res = await regularAgent
      .post('/api/containers')
      .send({ container_number: 'HACK' });
    expect(res.status).toBe(403);
  });

  it('should deny non-admin PUT /api/containers/:id', async () => {
    const res = await regularAgent
      .put('/api/containers/1')
      .send({ status: 'hacked' });
    expect(res.status).toBe(403);
  });

  it('should deny non-admin DELETE /api/containers/:id', async () => {
    const res = await regularAgent.delete('/api/containers/1');
    expect(res.status).toBe(403);
  });
});
