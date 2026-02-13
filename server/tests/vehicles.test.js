const request = require('supertest');
const { app, loginAsAdmin, createTestUser, loginAs, deleteTestUser, closePool } = require('./setup');

let adminAgent;
const createdVehicleIds = [];

beforeAll(async () => {
  adminAgent = await loginAsAdmin();
});

afterAll(async () => {
  for (const id of createdVehicleIds) {
    await adminAgent.delete(`/api/vehicles/${id}`).catch(() => {});
  }
  await closePool();
});

describe('Vehicles CRUD', () => {
  describe('POST /api/vehicles', () => {
    it('should create a vehicle', async () => {
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          buyer: 'Test Buyer',
          mark: 'Toyota',
          model: 'Camry',
          year: 2023,
          vin: `TEST${Date.now()}`,
          auction: 'Copart',
          vehicle_price: 15000,
          total_price: 18000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mark).toBe('Toyota');
      expect(res.body.data.model).toBe('Camry');
      createdVehicleIds.push(res.body.data.id);
    });

    it('should create a vehicle with minimal fields', async () => {
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `MIN${Date.now()}`,
        });

      expect(res.status).toBe(201);
      createdVehicleIds.push(res.body.data.id);
    });
  });

  describe('GET /api/vehicles', () => {
    it('should return paginated vehicles', async () => {
      const res = await adminAgent.get('/api/vehicles?limit=5&page=1');

      expect(res.status).toBe(200);
      expect(res.body.error).toBe(0);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.total).toBeDefined();
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should support keyword search', async () => {
      const res = await adminAgent.get('/api/vehicles?keyword=Toyota');

      expect(res.status).toBe(200);
      // Should find our test vehicle or existing Toyota vehicles
    });

    it('should support auction filter', async () => {
      const res = await adminAgent.get('/api/vehicles?auction=Copart');

      expect(res.status).toBe(200);
      res.body.data.forEach(v => {
        expect(v.auction.toLowerCase()).toContain('copart');
      });
    });

    it('should support sorting by id ascending', async () => {
      const res = await adminAgent.get('/api/vehicles?sort_by=id&asc=asc&limit=10');

      expect(res.status).toBe(200);
      const ids = res.body.data.map(v => v.id);
      for (let i = 1; i < ids.length; i++) {
        expect(ids[i]).toBeGreaterThanOrEqual(ids[i - 1]);
      }
    });

    it('should support sorting by id descending', async () => {
      const res = await adminAgent.get('/api/vehicles?sort_by=id&asc=desc&limit=10');

      expect(res.status).toBe(200);
      const ids = res.body.data.map(v => v.id);
      for (let i = 1; i < ids.length; i++) {
        expect(ids[i]).toBeLessThanOrEqual(ids[i - 1]);
      }
    });

    it('should support date range filter', async () => {
      const res = await adminAgent.get(
        '/api/vehicles?start_date=2020-01-01&end_date=2030-12-31'
      );

      expect(res.status).toBe(200);
    });

    it('should handle pagination correctly', async () => {
      const page1 = await adminAgent.get('/api/vehicles?limit=2&page=1');
      const page2 = await adminAgent.get('/api/vehicles?limit=2&page=2');

      if (page1.body.total > 2) {
        const ids1 = page1.body.data.map(v => v.id);
        const ids2 = page2.body.data.map(v => v.id);
        const overlap = ids1.filter(id => ids2.includes(id));
        expect(overlap.length).toBe(0);
      }
    });
  });

  describe('PUT /api/vehicles/:id', () => {
    it('should update vehicle fields', async () => {
      const createRes = await adminAgent
        .post('/api/vehicles')
        .send({ vin: `UPD${Date.now()}`, mark: 'Honda', model: 'Civic' });
      const vehicleId = createRes.body.data.id;
      createdVehicleIds.push(vehicleId);

      const res = await adminAgent
        .put(`/api/vehicles/${vehicleId}`)
        .send({ model: 'Accord', year: 2024 });

      expect(res.status).toBe(200);
      expect(res.body.data.model).toBe('Accord');
      expect(res.body.data.year).toBe(2024);
    });

    it('should return 404 for non-existent vehicle', async () => {
      const res = await adminAgent
        .put('/api/vehicles/999999')
        .send({ mark: 'Ghost' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/vehicles/:id', () => {
    it('should delete a vehicle', async () => {
      const createRes = await adminAgent
        .post('/api/vehicles')
        .send({ vin: `DEL${Date.now()}` });
      const vehicleId = createRes.body.data.id;

      const res = await adminAgent.delete(`/api/vehicles/${vehicleId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent vehicle', async () => {
      const res = await adminAgent.delete('/api/vehicles/999999');
      expect(res.status).toBe(404);
    });
  });
});

describe('Vehicles - Role-Based Access', () => {
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

  it('should allow non-admin GET /api/vehicles (own vehicles only)', async () => {
    const res = await regularAgent.get('/api/vehicles');
    expect(res.status).toBe(200);
    // Non-admin should see filtered results (only their vehicles)
  });

  it('should deny non-admin POST /api/vehicles', async () => {
    const res = await regularAgent.post('/api/vehicles').send({ vin: 'HACK123' });
    expect(res.status).toBe(403);
  });

  it('should deny non-admin PUT /api/vehicles/:id', async () => {
    const res = await regularAgent.put('/api/vehicles/1').send({ mark: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('should deny non-admin DELETE /api/vehicles/:id', async () => {
    const res = await regularAgent.delete('/api/vehicles/1');
    expect(res.status).toBe(403);
  });
});

describe('Vehicles - Cities endpoint', () => {
  it('should return cities for authenticated users', async () => {
    const res = await adminAgent.get('/api/cities');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('should require authentication for cities', async () => {
    const res = await request(app).get('/api/cities');
    expect(res.status).toBe(401);
  });
});
