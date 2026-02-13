const request = require('supertest');
const { app, loginAsAdmin, createTestUser, loginAs, deleteTestUser, closePool } = require('./setup');

let adminAgent;
const createdCalcIds = [];

beforeAll(async () => {
  adminAgent = await loginAsAdmin();
});

afterAll(async () => {
  for (const id of createdCalcIds) {
    await adminAgent.delete(`/api/calculator/${id}`).catch(() => {});
  }
  await closePool();
});

describe('Calculator CRUD', () => {
  describe('POST /api/calculator', () => {
    it('should create a calculator entry', async () => {
      const res = await adminAgent
        .post('/api/calculator')
        .send({
          auction: 'TestAuction',
          city: 'TestCity',
          destination: 'TestDest',
          land_price: 500,
          container_price: 300,
          total_price: 800,
          port: 'TestPort',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.auction).toBe('TestAuction');
      expect(parseFloat(res.body.data.total_price)).toBe(800);
      createdCalcIds.push(res.body.data.id);
    });

    it('should default prices to 0', async () => {
      const res = await adminAgent
        .post('/api/calculator')
        .send({ auction: 'ZeroPriceTest' });

      expect(res.status).toBe(201);
      expect(parseFloat(res.body.data.land_price)).toBe(0);
      expect(parseFloat(res.body.data.container_price)).toBe(0);
      expect(parseFloat(res.body.data.total_price)).toBe(0);
      createdCalcIds.push(res.body.data.id);
    });

    it('should reject missing auction field', async () => {
      const res = await adminAgent
        .post('/api/calculator')
        .send({ city: 'NoAuction' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/calculator', () => {
    it('should return paginated results', async () => {
      const res = await adminAgent.get('/api/calculator?limit=5&page=1');

      expect(res.status).toBe(200);
      expect(res.body.error).toBe(0);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.total).toBeDefined();
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should support keyword search', async () => {
      const res = await adminAgent.get('/api/calculator?keyword=TestAuction');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should support auction filter', async () => {
      const res = await adminAgent.get('/api/calculator?auction=TestAuction');

      expect(res.status).toBe(200);
      res.body.data.forEach(c => {
        expect(c.auction).toBe('TestAuction');
      });
    });

    it('should support port filter', async () => {
      const res = await adminAgent.get('/api/calculator?port=TestPort');

      expect(res.status).toBe(200);
      res.body.data.forEach(c => {
        expect(c.port).toBe('TestPort');
      });
    });

    it('should support sorting', async () => {
      const res = await adminAgent.get('/api/calculator?sort_by=id&asc=desc&limit=10');

      expect(res.status).toBe(200);
      const ids = res.body.data.map(c => c.id);
      for (let i = 1; i < ids.length; i++) {
        expect(ids[i]).toBeLessThanOrEqual(ids[i - 1]);
      }
    });

    it('should handle pagination page 2', async () => {
      const page1 = await adminAgent.get('/api/calculator?limit=2&page=1');
      const page2 = await adminAgent.get('/api/calculator?limit=2&page=2');

      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);

      if (page1.body.total > 2) {
        const ids1 = page1.body.data.map(c => c.id);
        const ids2 = page2.body.data.map(c => c.id);
        const overlap = ids1.filter(id => ids2.includes(id));
        expect(overlap.length).toBe(0);
      }
    });
  });

  describe('PUT /api/calculator/:id', () => {
    it('should update calculator entry', async () => {
      const createRes = await adminAgent
        .post('/api/calculator')
        .send({ auction: 'UpdateCalc', land_price: 100 });
      const calcId = createRes.body.data.id;
      createdCalcIds.push(calcId);

      const res = await adminAgent
        .put(`/api/calculator/${calcId}`)
        .send({ land_price: 999, city: 'UpdatedCity' });

      expect(res.status).toBe(200);
      expect(parseFloat(res.body.data.land_price)).toBe(999);
      expect(res.body.data.city).toBe('UpdatedCity');
    });

    it('should return 404 for non-existent entry', async () => {
      const res = await adminAgent
        .put('/api/calculator/999999')
        .send({ land_price: 1 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/calculator/:id', () => {
    it('should delete a calculator entry', async () => {
      const createRes = await adminAgent
        .post('/api/calculator')
        .send({ auction: 'DeleteCalc' });
      const calcId = createRes.body.data.id;

      const res = await adminAgent.delete(`/api/calculator/${calcId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent entry', async () => {
      const res = await adminAgent.delete('/api/calculator/999999');
      expect(res.status).toBe(404);
    });
  });
});

describe('Calculator - Role-Based Access', () => {
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

  it('should allow non-admin GET /api/calculator', async () => {
    const res = await regularAgent.get('/api/calculator');
    expect(res.status).toBe(200);
  });

  it('should deny non-admin POST /api/calculator', async () => {
    const res = await regularAgent
      .post('/api/calculator')
      .send({ auction: 'Hack' });
    expect(res.status).toBe(403);
  });

  it('should deny non-admin DELETE /api/calculator/:id', async () => {
    const res = await regularAgent.delete('/api/calculator/1');
    expect(res.status).toBe(403);
  });
});
