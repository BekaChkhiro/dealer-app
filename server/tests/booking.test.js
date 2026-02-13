const request = require('supertest');
const { app, loginAsAdmin, createTestUser, loginAs, deleteTestUser, closePool } = require('./setup');

let adminAgent;
const createdBookingIds = [];

beforeAll(async () => {
  adminAgent = await loginAsAdmin();
});

afterAll(async () => {
  for (const id of createdBookingIds) {
    await adminAgent.delete(`/api/booking/${id}`).catch(() => {});
  }
  await closePool();
});

describe('Booking CRUD', () => {
  describe('POST /api/booking', () => {
    it('should create a booking', async () => {
      const res = await adminAgent
        .post('/api/booking')
        .send({
          vin: `BK${Date.now()}`,
          buyer_fullname: 'Test Buyer',
          booking_number: `BN-${Date.now()}`,
          line: 'MSC',
          loading_port: 'Savannah',
          delivery_location: 'Poti',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.buyer_fullname).toBe('Test Buyer');
      expect(res.body.data.line).toBe('MSC');
      createdBookingIds.push(res.body.data.id);
    });

    it('should create booking with minimal fields', async () => {
      const res = await adminAgent
        .post('/api/booking')
        .send({ vin: `BKM${Date.now()}` });

      expect(res.status).toBe(201);
      createdBookingIds.push(res.body.data.id);
    });
  });

  describe('GET /api/booking', () => {
    it('should return paginated bookings', async () => {
      const res = await adminAgent.get('/api/booking?limit=5&page=1');

      expect(res.status).toBe(200);
      expect(res.body.error).toBe(0);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.total).toBeDefined();
    });

    it('should support keyword search', async () => {
      const res = await adminAgent.get('/api/booking?keyword=Test Buyer');

      expect(res.status).toBe(200);
    });

    it('should support loading_port filter', async () => {
      const res = await adminAgent.get('/api/booking?loading_port=Savannah');

      expect(res.status).toBe(200);
      res.body.data.forEach(b => {
        expect(b.loading_port).toBe('Savannah');
      });
    });

    it('should support line filter', async () => {
      const res = await adminAgent.get('/api/booking?line=MSC');

      expect(res.status).toBe(200);
      res.body.data.forEach(b => {
        expect(b.line).toBe('MSC');
      });
    });

    it('should support date range filter', async () => {
      const res = await adminAgent.get(
        '/api/booking?start_date=2020-01-01&end_date=2030-12-31'
      );
      expect(res.status).toBe(200);
    });

    it('should support sorting', async () => {
      const res = await adminAgent.get('/api/booking?sort_by=id&asc=asc&limit=10');

      expect(res.status).toBe(200);
      const ids = res.body.data.map(b => b.id);
      for (let i = 1; i < ids.length; i++) {
        expect(ids[i]).toBeGreaterThanOrEqual(ids[i - 1]);
      }
    });
  });

  describe('PUT /api/booking/:id', () => {
    it('should update booking fields', async () => {
      const createRes = await adminAgent
        .post('/api/booking')
        .send({ vin: `BKU${Date.now()}`, line: 'ZIM' });
      const bookingId = createRes.body.data.id;
      createdBookingIds.push(bookingId);

      const res = await adminAgent
        .put(`/api/booking/${bookingId}`)
        .send({ line: 'Evergreen', delivery_location: 'Batumi' });

      expect(res.status).toBe(200);
      expect(res.body.data.line).toBe('Evergreen');
      expect(res.body.data.delivery_location).toBe('Batumi');
    });

    it('should return 404 for non-existent booking', async () => {
      const res = await adminAgent
        .put('/api/booking/999999')
        .send({ line: 'Ghost' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/booking/:id', () => {
    it('should delete a booking', async () => {
      const createRes = await adminAgent
        .post('/api/booking')
        .send({ vin: `BKD${Date.now()}` });
      const bookingId = createRes.body.data.id;

      const res = await adminAgent.delete(`/api/booking/${bookingId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent booking', async () => {
      const res = await adminAgent.delete('/api/booking/999999');
      expect(res.status).toBe(404);
    });
  });
});

describe('Booking - Dropdown Endpoints', () => {
  it('GET /api/vin-codes/booking should return VIN codes', async () => {
    const res = await adminAgent.get('/api/vin-codes/booking');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('GET /api/containers-list/booking should return container list', async () => {
    const res = await adminAgent.get('/api/containers-list/booking');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('should require auth for VIN codes', async () => {
    const res = await request(app).get('/api/vin-codes/booking');
    expect(res.status).toBe(401);
  });

  it('should require auth for containers list', async () => {
    const res = await request(app).get('/api/containers-list/booking');
    expect(res.status).toBe(401);
  });
});

describe('Booking - Role-Based Access', () => {
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

  it('should allow non-admin GET /api/booking', async () => {
    const res = await regularAgent.get('/api/booking');
    expect(res.status).toBe(200);
  });

  it('should deny non-admin POST /api/booking', async () => {
    const res = await regularAgent.post('/api/booking').send({ vin: 'HACK' });
    expect(res.status).toBe(403);
  });

  it('should deny non-admin DELETE /api/booking/:id', async () => {
    const res = await regularAgent.delete('/api/booking/1');
    expect(res.status).toBe(403);
  });
});
