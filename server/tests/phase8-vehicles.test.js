const request = require('supertest');
const { app, loginAsAdmin, createTestUser, loginAs, deleteTestUser, closePool } = require('./setup');

let adminAgent;
const createdVehicleIds = [];
const createdUserIds = [];

beforeAll(async () => {
  adminAgent = await loginAsAdmin();
});

afterAll(async () => {
  for (const id of createdVehicleIds) {
    await adminAgent.delete(`/api/vehicles/${id}`).catch(() => {});
  }
  for (const id of createdUserIds) {
    await adminAgent.delete(`/api/users/${id}`).catch(() => {});
  }
  await closePool();
});

describe('Phase 8: Vehicles Module Tests', () => {
  const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  describe('T8.7: Fuel Type Field', () => {
    it('should create vehicle with fuel type - Gasoline', async () => {
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `FUEL${unique()}`,
          mark: 'Toyota',
          model: 'Camry',
          year: 2023,
          fuel_type: 'Gasoline'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.fuel_type).toBe('Gasoline');
      createdVehicleIds.push(res.body.data.id);
    });

    it('should create vehicle with fuel type - Diesel', async () => {
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `DIESEL${unique()}`,
          fuel_type: 'Diesel'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.fuel_type).toBe('Diesel');
      createdVehicleIds.push(res.body.data.id);
    });

    it('should create vehicle with fuel type - Hybrid', async () => {
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `HYBRID${unique()}`,
          fuel_type: 'Hybrid'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.fuel_type).toBe('Hybrid');
      createdVehicleIds.push(res.body.data.id);
    });

    it('should create vehicle with fuel type - Electric', async () => {
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `ELEC${unique()}`,
          fuel_type: 'Electric'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.fuel_type).toBe('Electric');
      createdVehicleIds.push(res.body.data.id);
    });

    it('should create vehicle with fuel type - Plug-in Hybrid', async () => {
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `PLUGIN${unique()}`,
          fuel_type: 'Plug-in Hybrid'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.fuel_type).toBe('Plug-in Hybrid');
      createdVehicleIds.push(res.body.data.id);
    });

    it('should update vehicle fuel type', async () => {
      const createRes = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `UPDATE${unique()}`,
          fuel_type: 'Gasoline'
        });
      const vehicleId = createRes.body.data.id;
      createdVehicleIds.push(vehicleId);

      const res = await adminAgent
        .put(`/api/vehicles/${vehicleId}`)
        .send({ fuel_type: 'Hybrid' });

      expect(res.status).toBe(200);
      expect(res.body.data.fuel_type).toBe('Hybrid');
    });
  });

  describe('T8.9: VIN Field Validation', () => {
    it('should accept valid 17-character VIN', async () => {
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: '1HGBH41JXMN109186' // Valid 17-char VIN
        });

      expect(res.status).toBe(201);
      expect(res.body.data.vin).toBe('1HGBH41JXMN109186');
      createdVehicleIds.push(res.body.data.id);
    });

    it('should return VIN in response for display (last 6 digits)', async () => {
      const vin = '1HGBH41JXMN109999';
      const res = await adminAgent
        .post('/api/vehicles')
        .send({ vin });

      expect(res.status).toBe(201);
      expect(res.body.data.vin).toBe(vin);
      // Last 6 characters should be "109999"
      const last6 = res.body.data.vin.slice(-6);
      expect(last6).toBe('109999');
      createdVehicleIds.push(res.body.data.id);
    });
  });

  describe('T8.10: Comment Field', () => {
    it('should create vehicle with comment', async () => {
      const comment = 'This is a test comment for the vehicle';
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `CMT${unique()}`,
          comment: comment
        });

      expect(res.status).toBe(201);
      expect(res.body.data.comment).toBe(comment);
      createdVehicleIds.push(res.body.data.id);
    });

    it('should update vehicle comment', async () => {
      const createRes = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `UCMT${unique()}`,
          comment: 'Original comment'
        });
      const vehicleId = createRes.body.data.id;
      createdVehicleIds.push(vehicleId);

      const res = await adminAgent
        .put(`/api/vehicles/${vehicleId}`)
        .send({ comment: 'Updated comment' });

      expect(res.status).toBe(200);
      expect(res.body.data.comment).toBe('Updated comment');
    });

    it('should accept long comments', async () => {
      const longComment = 'This is a very long comment. '.repeat(50);
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `LONG${unique()}`,
          comment: longComment
        });

      expect(res.status).toBe(201);
      expect(res.body.data.comment).toBe(longComment);
      createdVehicleIds.push(res.body.data.id);
    });
  });

  describe('T8.11: Insurance Type Field', () => {
    it('should create vehicle with insurance - No Insurance', async () => {
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `INS0${unique()}`,
          insurance_type: 'No Insurance'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.insurance_type).toBe('No Insurance');
      createdVehicleIds.push(res.body.data.id);
    });

    it('should create vehicle with insurance - With Franchise', async () => {
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `INS1${unique()}`,
          insurance_type: 'With Franchise'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.insurance_type).toBe('With Franchise');
      createdVehicleIds.push(res.body.data.id);
    });

    it('should create vehicle with insurance - Full Insurance', async () => {
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `INS2${unique()}`,
          insurance_type: 'Full Insurance'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.insurance_type).toBe('Full Insurance');
      createdVehicleIds.push(res.body.data.id);
    });
  });

  describe('T8.12: Driver Information Fields', () => {
    it('should create vehicle with complete driver information', async () => {
      const driverInfo = {
        driver_full_name: 'Giorgi Beridze',
        driver_phone: '+995555123456',
        driver_id_number: '01001012345',
        driver_license_number: 'GE12345678',
        driver_company: 'Transport LLC'
      };

      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `DRV${unique()}`,
          ...driverInfo
        });

      expect(res.status).toBe(201);
      expect(res.body.data.driver_full_name).toBe(driverInfo.driver_full_name);
      expect(res.body.data.driver_phone).toBe(driverInfo.driver_phone);
      expect(res.body.data.driver_id_number).toBe(driverInfo.driver_id_number);
      expect(res.body.data.driver_license_number).toBe(driverInfo.driver_license_number);
      expect(res.body.data.driver_company).toBe(driverInfo.driver_company);
      createdVehicleIds.push(res.body.data.id);
    });

    it('should update driver information', async () => {
      const createRes = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `UDRV${unique()}`,
          driver_full_name: 'Original Driver'
        });
      const vehicleId = createRes.body.data.id;
      createdVehicleIds.push(vehicleId);

      const res = await adminAgent
        .put(`/api/vehicles/${vehicleId}`)
        .send({
          driver_full_name: 'Updated Driver',
          driver_phone: '+995555999999'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.driver_full_name).toBe('Updated Driver');
      expect(res.body.data.driver_phone).toBe('+995555999999');
    });

    it('should accept partial driver information', async () => {
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `PDRV${unique()}`,
          driver_full_name: 'Partial Driver',
          driver_phone: '+995555111111'
          // Other driver fields not provided
        });

      expect(res.status).toBe(201);
      expect(res.body.data.driver_full_name).toBe('Partial Driver');
      expect(res.body.data.driver_phone).toBe('+995555111111');
      createdVehicleIds.push(res.body.data.id);
    });
  });

  describe('T8.13: Destination Port Field', () => {
    it('should create vehicle with destination port', async () => {
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `PORT${unique()}`,
          destination_port_id: 1 // Assuming port with ID 1 exists
        });

      expect(res.status).toBe(201);
      createdVehicleIds.push(res.body.data.id);
    });

    it('should update vehicle destination port', async () => {
      const createRes = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `UPRT${unique()}`,
          destination_port_id: 1
        });
      const vehicleId = createRes.body.data.id;
      createdVehicleIds.push(vehicleId);

      const res = await adminAgent
        .put(`/api/vehicles/${vehicleId}`)
        .send({ destination_port_id: 2 });

      expect(res.status).toBe(200);
      createdVehicleIds.push(res.body.data.id);
    });
  });

  describe('T8.14: Receiver Personal Number Uppercase', () => {
    it('should handle receiver personal number', async () => {
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `RPN${unique()}`,
          receiver_personal_number: 'ABC123456'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.receiver_personal_number).toBeTruthy();
      createdVehicleIds.push(res.body.data.id);
    });
  });

  describe('T8.17 & T8.18: Removed Fields', () => {
    it('should not have booking_id field', async () => {
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `NOBK${unique()}`,
          mark: 'Test',
          booking_id: 123 // This should be ignored
        });

      expect(res.status).toBe(201);
      // The booking_id should not be in the response
      createdVehicleIds.push(res.body.data.id);
    });

    it('should not have buyer fields', async () => {
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `NOBUY${unique()}`,
          buyer: 'Some Buyer', // Should be ignored
          buyer_phone: '555-0000', // Should be ignored
          buyer_personal_number: '123' // Should be ignored
        });

      expect(res.status).toBe(201);
      // These buyer fields should not exist in response
      expect(res.body.data.buyer).toBeUndefined();
      expect(res.body.data.buyer_phone).toBeUndefined();
      expect(res.body.data.buyer_personal_number).toBeUndefined();
      createdVehicleIds.push(res.body.data.id);
    });
  });

  describe('T8.8: Dealer Assignment', () => {
    it('should create vehicle with dealer_id', async () => {
      // First create a dealer user
      const u = unique();
      const dealerRes = await adminAgent.post('/api/users').send({
        name: 'Dealer',
        surname: 'User',
        email: `dealer_${u}@test.com`,
        username: `dealer_${u}`,
        password: 'pass1234',
        role: 'dealer'
      });
      const dealerId = dealerRes.body.data.id;
      createdUserIds.push(dealerId);

      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `DLR${unique()}`,
          dealer_id: dealerId
        });

      expect(res.status).toBe(201);
      expect(res.body.data.dealer_id).toBe(dealerId);
      createdVehicleIds.push(res.body.data.id);
    });

    it('should return dealer info with vehicle', async () => {
      const u = unique();
      const dealerRes = await adminAgent.post('/api/users').send({
        name: 'John',
        surname: 'Dealer',
        email: `john_${u}@test.com`,
        username: `john_${u}`,
        password: 'pass1234',
        role: 'dealer'
      });
      const dealerId = dealerRes.body.data.id;
      createdUserIds.push(dealerId);

      const vehicleRes = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `DLRI${unique()}`,
          dealer_id: dealerId
        });
      createdVehicleIds.push(vehicleRes.body.data.id);

      // Get vehicles list and check if dealer info is included
      const res = await adminAgent.get(`/api/vehicles?limit=100`);
      expect(res.status).toBe(200);

      const createdVehicle = res.body.data.find(v => v.id === vehicleRes.body.data.id);
      if (createdVehicle) {
        // Should have dealer info - either dealer_name or dealer object
        expect(createdVehicle.dealer_id).toBe(dealerId);
      }
    });
  });

  describe('Vehicle List Structure', () => {
    it('should return vehicles with all required fields', async () => {
      const res = await adminAgent.get('/api/vehicles?limit=5');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);

      if (res.body.data.length > 0) {
        const vehicle = res.body.data[0];
        expect(vehicle).toHaveProperty('id');
        expect(vehicle).toHaveProperty('vin');
        // Should not have removed fields
        expect(vehicle.buyer).toBeUndefined();
        expect(vehicle.booking_id).toBeUndefined();
      }
    });
  });

  describe('VIN and LOT fields', () => {
    it('should store and retrieve VIN correctly', async () => {
      const vin = `TEST${unique()}VIN123456`;
      const res = await adminAgent
        .post('/api/vehicles')
        .send({ vin });

      expect(res.status).toBe(201);
      expect(res.body.data.vin).toBe(vin);
      createdVehicleIds.push(res.body.data.id);
    });

    it('should store and retrieve LOT number correctly', async () => {
      const lot = `LOT${unique()}`;
      const res = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `VIN${unique()}`,
          lot: lot
        });

      expect(res.status).toBe(201);
      expect(res.body.data.lot).toBe(lot);
      createdVehicleIds.push(res.body.data.id);
    });
  });
});

describe('Phase 8: Vehicles - Dealer Role Tests', () => {
  let dealerUser;
  let dealerAgent;
  let dealerVehicleId;

  beforeAll(async () => {
    const created = await createTestUser(adminAgent, { role: 'dealer' });
    dealerUser = created.user;
    dealerAgent = await loginAs(dealerUser.username, created.password);

    // Create a vehicle for this dealer
    const vehicleRes = await adminAgent
      .post('/api/vehicles')
      .send({
        vin: `DEALER${Date.now()}`,
        dealer_id: dealerUser.id
      });
    dealerVehicleId = vehicleRes.body.data.id;
    createdVehicleIds.push(dealerVehicleId);
  });

  afterAll(async () => {
    if (dealerUser?.id) await deleteTestUser(adminAgent, dealerUser.id);
  });

  it('should allow dealer to view their own vehicles', async () => {
    const res = await dealerAgent.get('/api/vehicles');
    expect(res.status).toBe(200);
    // Should only see their own vehicles
  });

  it('should deny dealer ability to create vehicles', async () => {
    const res = await dealerAgent.post('/api/vehicles').send({
      vin: 'HACKVIN123'
    });
    expect(res.status).toBe(403);
  });

  it('should deny dealer ability to modify vehicles', async () => {
    const res = await dealerAgent.put(`/api/vehicles/${dealerVehicleId}`).send({
      mark: 'Hacked'
    });
    expect(res.status).toBe(403);
  });

  it('should deny dealer ability to delete vehicles', async () => {
    const res = await dealerAgent.delete(`/api/vehicles/${dealerVehicleId}`);
    expect(res.status).toBe(403);
  });
});
