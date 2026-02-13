const request = require('supertest');
const { app, loginAsAdmin, createTestUser, loginAs, deleteTestUser, closePool } = require('./setup');

let adminAgent;
const createdTxIds = [];

beforeAll(async () => {
  adminAgent = await loginAsAdmin();
});

afterAll(async () => {
  for (const id of createdTxIds) {
    await adminAgent.delete(`/api/transactions/${id}`).catch(() => {});
  }
  await closePool();
});

describe('Transactions CRUD', () => {
  describe('POST /api/transactions', () => {
    it('should create a transaction', async () => {
      const res = await adminAgent
        .post('/api/transactions')
        .send({
          payer: 'Test Payer',
          vin: `TXVIN${Date.now()}`,
          mark: 'BMW',
          model: 'X5',
          year: 2022,
          personal_number: '12345678901',
          paid_amount: 5000,
          payment_type: 'car_amount',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payer).toBe('Test Payer');
      expect(res.body.data.payment_type).toBe('car_amount');
      createdTxIds.push(res.body.data.id);
    });

    it('should default amounts to 0', async () => {
      const res = await adminAgent
        .post('/api/transactions')
        .send({ payment_type: 'shipping' });

      expect(res.status).toBe(201);
      expect(parseFloat(res.body.data.paid_amount)).toBe(0);
      createdTxIds.push(res.body.data.id);
    });

    it('should reject missing payment_type', async () => {
      const res = await adminAgent
        .post('/api/transactions')
        .send({ payer: 'NoPT' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/transactions', () => {
    it('should return paginated transactions', async () => {
      const res = await adminAgent.get('/api/transactions?limit=5&page=1');

      expect(res.status).toBe(200);
      expect(res.body.error).toBe(0);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.total).toBeDefined();
    });

    it('should support keyword search', async () => {
      const res = await adminAgent.get('/api/transactions?keyword=Test Payer');

      expect(res.status).toBe(200);
    });

    it('should support date range filter', async () => {
      const res = await adminAgent.get(
        '/api/transactions?start_date=2020-01-01&end_date=2030-12-31'
      );
      expect(res.status).toBe(200);
    });

    it('should support sorting', async () => {
      const res = await adminAgent.get('/api/transactions?sort_by=id&asc=asc&limit=10');

      expect(res.status).toBe(200);
      const ids = res.body.data.map(t => t.id);
      for (let i = 1; i < ids.length; i++) {
        expect(ids[i]).toBeGreaterThanOrEqual(ids[i - 1]);
      }
    });
  });

  describe('PUT /api/transactions/:id', () => {
    it('should update transaction fields', async () => {
      const createRes = await adminAgent
        .post('/api/transactions')
        .send({ payment_type: 'balance', paid_amount: 100 });
      const txId = createRes.body.data.id;
      createdTxIds.push(txId);

      const res = await adminAgent
        .put(`/api/transactions/${txId}`)
        .send({ paid_amount: 999, payer: 'Updated Payer' });

      expect(res.status).toBe(200);
      expect(parseFloat(res.body.data.paid_amount)).toBe(999);
      expect(res.body.data.payer).toBe('Updated Payer');
    });

    it('should return 404 for non-existent transaction', async () => {
      const res = await adminAgent
        .put('/api/transactions/999999')
        .send({ paid_amount: 1 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    it('should delete a transaction', async () => {
      const createRes = await adminAgent
        .post('/api/transactions')
        .send({ payment_type: 'customs' });
      const txId = createRes.body.data.id;

      const res = await adminAgent.delete(`/api/transactions/${txId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent transaction', async () => {
      const res = await adminAgent.delete('/api/transactions/999999');
      expect(res.status).toBe(404);
    });
  });
});

describe('Transactions - Role-Based Access', () => {
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

  it('should allow non-admin GET /api/transactions (own data only)', async () => {
    const res = await regularAgent.get('/api/transactions');
    expect(res.status).toBe(200);
  });

  it('should deny non-admin POST /api/transactions', async () => {
    const res = await regularAgent
      .post('/api/transactions')
      .send({ payment_type: 'car_amount' });
    expect(res.status).toBe(403);
  });

  it('should deny non-admin DELETE /api/transactions/:id', async () => {
    const res = await regularAgent.delete('/api/transactions/1');
    expect(res.status).toBe(403);
  });
});
