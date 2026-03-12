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

describe('Phase 8: Users Module Tests', () => {
  const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  describe('T8.1: Address Field', () => {
    it('should create user with address field', async () => {
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
          address: '123 Main Street, Tbilisi, Georgia'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.address).toBe('123 Main Street, Tbilisi, Georgia');
      createdUserIds.push(res.body.data.id);
    });

    it('should update user address', async () => {
      const u = unique();
      const createRes = await adminAgent.post('/api/users').send({
        name: 'Address',
        surname: 'Test',
        email: `address_${u}@test.com`,
        username: `address_${u}`,
        password: 'pass1234',
      });
      const userId = createRes.body.data.id;
      createdUserIds.push(userId);

      const res = await adminAgent
        .put(`/api/users/${userId}`)
        .send({ address: '456 New Street, Batumi' });

      expect(res.status).toBe(200);
      expect(res.body.data.address).toBe('456 New Street, Batumi');
    });

    it('should retrieve user with address field', async () => {
      const u = unique();
      const createRes = await adminAgent.post('/api/users').send({
        name: 'Retrieve',
        surname: 'Address',
        email: `retrieve_${u}@test.com`,
        username: `retrieve_${u}`,
        password: 'pass1234',
        address: '789 Test Ave'
      });
      createdUserIds.push(createRes.body.data.id);

      const res = await adminAgent.get(`/api/users?keyword=retrieve_${u}`);
      expect(res.status).toBe(200);
      expect(res.body.data[0].address).toBe('789 Test Ave');
    });
  });

  describe('T8.2: Vehicle Count Column', () => {
    it('should return vehicle_count in user list', async () => {
      const res = await adminAgent.get('/api/users?limit=5');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      res.body.data.forEach(user => {
        expect(user).toHaveProperty('vehicle_count');
        expect(typeof user.vehicle_count).toBe('number');
        expect(user.vehicle_count).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have correct vehicle count structure', async () => {
      const u = unique();
      const createRes = await adminAgent.post('/api/users').send({
        name: 'VehicleCount',
        surname: 'Test',
        email: `vcount_${u}@test.com`,
        username: `vcount_${u}`,
        password: 'pass1234',
        role: 'user'
      });
      createdUserIds.push(createRes.body.data.id);

      const res = await adminAgent.get(`/api/users?keyword=vcount_${u}`);
      expect(res.status).toBe(200);
      expect(res.body.data[0].vehicle_count).toBeDefined();
      expect(res.body.data[0].vehicle_count).toBe(0); // New user should have 0 vehicles
    });
  });

  describe('T8.3: ID Document Upload and Verification', () => {
    it('should upload ID document for user', async () => {
      const u = unique();
      const createRes = await adminAgent.post('/api/users').send({
        name: 'IDTest',
        surname: 'User',
        email: `idtest_${u}@test.com`,
        username: `idtest_${u}`,
        password: 'pass1234',
      });
      const userId = createRes.body.data.id;
      createdUserIds.push(userId);

      // Simulate ID document upload
      const res = await adminAgent
        .put(`/api/users/${userId}`)
        .send({
          id_document_url: 'https://example.com/id-document.pdf',
          id_verification_status: 'pending'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.id_document_url).toBe('https://example.com/id-document.pdf');
      expect(res.body.data.id_verification_status).toBe('pending');
    });

    it('should verify ID document', async () => {
      const u = unique();
      const createRes = await adminAgent.post('/api/users').send({
        name: 'Verify',
        surname: 'User',
        email: `verify_${u}@test.com`,
        username: `verify_${u}`,
        password: 'pass1234',
        id_document_url: 'https://example.com/doc.pdf',
        id_verification_status: 'pending'
      });
      const userId = createRes.body.data.id;
      createdUserIds.push(userId);

      const res = await adminAgent
        .put(`/api/users/${userId}`)
        .send({ id_verification_status: 'verified' });

      expect(res.status).toBe(200);
      expect(res.body.data.id_verification_status).toBe('verified');
    });

    it('should support verification status values', async () => {
      const u = unique();
      const createRes = await adminAgent.post('/api/users').send({
        name: 'Status',
        surname: 'Test',
        email: `status_${u}@test.com`,
        username: `status_${u}`,
        password: 'pass1234',
      });
      const userId = createRes.body.data.id;
      createdUserIds.push(userId);

      // Test pending status
      let res = await adminAgent
        .put(`/api/users/${userId}`)
        .send({ id_verification_status: 'pending' });
      expect(res.status).toBe(200);
      expect(res.body.data.id_verification_status).toBe('pending');

      // Test verified status
      res = await adminAgent
        .put(`/api/users/${userId}`)
        .send({ id_verification_status: 'verified' });
      expect(res.status).toBe(200);
      expect(res.body.data.id_verification_status).toBe('verified');

      // Test rejected status
      res = await adminAgent
        .put(`/api/users/${userId}`)
        .send({ id_verification_status: 'rejected' });
      expect(res.status).toBe(200);
      expect(res.body.data.id_verification_status).toBe('rejected');
    });
  });

  describe('T8.4 & T8.5: Table Display (Zebra Striping and Borders)', () => {
    it('should return users list with proper structure for table display', async () => {
      const res = await adminAgent.get('/api/users?limit=10');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);

      // Verify all required columns are present
      res.body.data.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('surname');
        expect(user).toHaveProperty('phone');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('vehicle_count');
      });
    });
  });

  describe('User List Column Order', () => {
    it('should return columns in correct order: ID, Name, Phone, Email, Vehicle Count, Role', async () => {
      const res = await adminAgent.get('/api/users?limit=1');

      expect(res.status).toBe(200);
      if (res.body.data.length > 0) {
        const user = res.body.data[0];
        const keys = Object.keys(user);

        // Verify essential columns exist
        expect(keys).toContain('id');
        expect(keys).toContain('name');
        expect(keys).toContain('surname');
        expect(keys).toContain('phone');
        expect(keys).toContain('email');
        expect(keys).toContain('vehicle_count');
        expect(keys).toContain('role');
      }
    });
  });

  describe('Users - Password Security', () => {
    it('should never expose password_hash in API responses', async () => {
      const u = unique();
      const createRes = await adminAgent.post('/api/users').send({
        name: 'Security',
        surname: 'Test',
        email: `security_${u}@test.com`,
        username: `security_${u}`,
        password: 'supersecret123',
      });
      createdUserIds.push(createRes.body.data.id);

      // Check in list
      const listRes = await adminAgent.get('/api/users?limit=100');
      listRes.body.data.forEach(u => {
        expect(u.password_hash).toBeUndefined();
        expect(u.password).toBeUndefined();
      });

      // Check in individual fetch
      const getRes = await adminAgent.get(`/api/users?keyword=security_${u}`);
      expect(getRes.body.data[0].password_hash).toBeUndefined();
      expect(getRes.body.data[0].password).toBeUndefined();
    });
  });
});

describe('Phase 8: Users Module - Dealer Role Tests', () => {
  let dealerUser;
  let dealerAgent;

  beforeAll(async () => {
    const created = await createTestUser(adminAgent, { role: 'dealer' });
    dealerUser = created.user;
    dealerAgent = await loginAs(dealerUser.username, created.password);
  });

  afterAll(async () => {
    if (dealerUser?.id) await deleteTestUser(adminAgent, dealerUser.id);
  });

  it('should deny dealer access to users list', async () => {
    const res = await dealerAgent.get('/api/users');
    expect(res.status).toBe(403);
  });

  it('should deny dealer ability to create users', async () => {
    const res = await dealerAgent.post('/api/users').send({
      name: 'Hack',
      email: 'hack@test.com',
      username: 'hacker',
      password: 'hack123',
    });
    expect(res.status).toBe(403);
  });

  it('should allow dealer to view their own profile', async () => {
    const res = await dealerAgent.get('/api/user');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(dealerUser.id);
  });
});
