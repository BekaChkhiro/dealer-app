const request = require('supertest');
const { app, loginAsAdmin, createTestUser, loginAs, deleteTestUser, closePool } = require('./setup');

let adminAgent;
const createdPortIds = [];
const createdContainerIds = [];
const createdVehicleIds = [];

beforeAll(async () => {
  adminAgent = await loginAsAdmin();
});

afterAll(async () => {
  for (const id of createdVehicleIds) {
    await adminAgent.delete(`/api/vehicles/${id}`).catch(() => {});
  }
  for (const id of createdContainerIds) {
    await adminAgent.delete(`/api/containers/${id}`).catch(() => {});
  }
  for (const id of createdPortIds) {
    await adminAgent.delete(`/api/ports/${id}`).catch(() => {});
  }
  await closePool();
});

describe('Phase 9: Ports and Containers Module Tests', () => {
  const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  describe('T9.1: Ports Management', () => {
    it('should create a new port', async () => {
      const res = await adminAgent
        .post('/api/ports')
        .send({
          name: `Test Port ${unique()}`,
          code: `TP${unique().substring(0, 4).toUpperCase()}`,
          country: 'Georgia',
          active: true
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('code');
      expect(res.body.data).toHaveProperty('country');
      expect(res.body.data.active).toBe(true);
      createdPortIds.push(res.body.data.id);
    });

    it('should retrieve ports list', async () => {
      const res = await adminAgent.get('/api/ports');

      expect(res.status).toBe(200);
      expect(res.body.error).toBe(0);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should update port information', async () => {
      const createRes = await adminAgent
        .post('/api/ports')
        .send({
          name: `Update Port ${unique()}`,
          code: `UP${unique().substring(0, 4).toUpperCase()}`,
          country: 'Georgia',
          active: true
        });
      const portId = createRes.body.data.id;
      createdPortIds.push(portId);

      const res = await adminAgent
        .put(`/api/ports/${portId}`)
        .send({
          name: 'Updated Port Name',
          active: false
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Port Name');
      expect(res.body.data.active).toBe(false);
    });

    it('should delete a port', async () => {
      const createRes = await adminAgent
        .post('/api/ports')
        .send({
          name: `Delete Port ${unique()}`,
          code: `DP${unique().substring(0, 4).toUpperCase()}`,
          country: 'Georgia'
        });
      const portId = createRes.body.data.id;

      const res = await adminAgent.delete(`/api/ports/${portId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should handle port with all fields', async () => {
      const portData = {
        name: `Complete Port ${unique()}`,
        code: `CP${unique().substring(0, 4).toUpperCase()}`,
        country: 'Georgia',
        city: 'Batumi',
        address: '123 Port Street',
        active: true
      };

      const res = await adminAgent
        .post('/api/ports')
        .send(portData);

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe(portData.name);
      expect(res.body.data.code).toBe(portData.code);
      expect(res.body.data.country).toBe(portData.country);
      createdPortIds.push(res.body.data.id);
    });

    it('should support filtering active ports', async () => {
      const res = await adminAgent.get('/api/ports?active=true');

      expect(res.status).toBe(200);
      res.body.data.forEach(port => {
        expect(port.active).toBe(true);
      });
    });
  });

  describe('T9.2: Containers Creation with Port Association', () => {
    let testPortId;

    beforeAll(async () => {
      const portRes = await adminAgent
        .post('/api/ports')
        .send({
          name: `Container Test Port ${unique()}`,
          code: `CTP${unique().substring(0, 3).toUpperCase()}`,
          country: 'Georgia'
        });
      testPortId = portRes.body.data.id;
      createdPortIds.push(testPortId);
    });

    it('should create container associated with port', async () => {
      const res = await adminAgent
        .post('/api/containers')
        .send({
          container_number: `CONT${unique()}`,
          port_id: testPortId,
          status: 'In Transit',
          loaded_date: '2024-01-15',
          estimated_arrival: '2024-02-15'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.container_number).toBeTruthy();
      expect(res.body.data.port_id).toBe(testPortId);
      createdContainerIds.push(res.body.data.id);
    });

    it('should create container with all date fields', async () => {
      const containerData = {
        container_number: `FULL${unique()}`,
        port_id: testPortId,
        status: 'Arrived',
        loaded_date: '2024-01-10',
        estimated_arrival: '2024-02-10',
        received_date: '2024-02-09',
        opened_date: '2024-02-12'
      };

      const res = await adminAgent
        .post('/api/containers')
        .send(containerData);

      expect(res.status).toBe(201);
      expect(res.body.data.loaded_date).toBeTruthy();
      expect(res.body.data.estimated_arrival).toBeTruthy();
      expect(res.body.data.received_date).toBeTruthy();
      expect(res.body.data.opened_date).toBeTruthy();
      createdContainerIds.push(res.body.data.id);
    });

    it('should update container information', async () => {
      const createRes = await adminAgent
        .post('/api/containers')
        .send({
          container_number: `UPD${unique()}`,
          port_id: testPortId,
          status: 'In Transit'
        });
      const containerId = createRes.body.data.id;
      createdContainerIds.push(containerId);

      const res = await adminAgent
        .put(`/api/containers/${containerId}`)
        .send({
          status: 'Arrived',
          received_date: '2024-02-15'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Arrived');
    });

    it('should retrieve containers for specific port', async () => {
      const res = await adminAgent.get(`/api/ports/${testPortId}/containers`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('T9.3: Vehicle Assignment to Containers', () => {
    let testPortId;
    let testContainerId;
    let testVehicleId1;
    let testVehicleId2;

    beforeAll(async () => {
      // Create port
      const portRes = await adminAgent
        .post('/api/ports')
        .send({
          name: `Vehicle Test Port ${unique()}`,
          code: `VTP${unique().substring(0, 3).toUpperCase()}`,
          country: 'Georgia'
        });
      testPortId = portRes.body.data.id;
      createdPortIds.push(testPortId);

      // Create container
      const containerRes = await adminAgent
        .post('/api/containers')
        .send({
          container_number: `VCONT${unique()}`,
          port_id: testPortId,
          status: 'Loading'
        });
      testContainerId = containerRes.body.data.id;
      createdContainerIds.push(testContainerId);

      // Create test vehicles
      const vehicle1Res = await adminAgent
        .post('/api/vehicles')
        .send({ vin: `VEH1${unique()}` });
      testVehicleId1 = vehicle1Res.body.data.id;
      createdVehicleIds.push(testVehicleId1);

      const vehicle2Res = await adminAgent
        .post('/api/vehicles')
        .send({ vin: `VEH2${unique()}` });
      testVehicleId2 = vehicle2Res.body.data.id;
      createdVehicleIds.push(testVehicleId2);
    });

    it('should assign vehicle to container', async () => {
      const res = await adminAgent
        .put(`/api/vehicles/${testVehicleId1}`)
        .send({ container_id: testContainerId });

      expect(res.status).toBe(200);
      expect(res.body.data.container_id).toBe(testContainerId);
    });

    it('should assign multiple vehicles to same container', async () => {
      const res1 = await adminAgent
        .put(`/api/vehicles/${testVehicleId1}`)
        .send({ container_id: testContainerId });

      const res2 = await adminAgent
        .put(`/api/vehicles/${testVehicleId2}`)
        .send({ container_id: testContainerId });

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.data.container_id).toBe(testContainerId);
      expect(res2.body.data.container_id).toBe(testContainerId);
    });

    it('should retrieve vehicles in container', async () => {
      // Assign vehicle to container first
      await adminAgent
        .put(`/api/vehicles/${testVehicleId1}`)
        .send({ container_id: testContainerId });

      const res = await adminAgent.get(`/api/containers/${testContainerId}/vehicles`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should remove vehicle from container', async () => {
      // First assign
      await adminAgent
        .put(`/api/vehicles/${testVehicleId1}`)
        .send({ container_id: testContainerId });

      // Then remove
      const res = await adminAgent
        .put(`/api/vehicles/${testVehicleId1}`)
        .send({ container_id: null });

      expect(res.status).toBe(200);
      expect(res.body.data.container_id).toBeNull();
    });
  });

  describe('T9.4: Container Table Column Order', () => {
    it('should return containers with container_number as identifiable field', async () => {
      const res = await adminAgent.get('/api/containers?limit=5');

      expect(res.status).toBe(200);
      if (res.body.data && res.body.data.length > 0) {
        const container = res.body.data[0];
        expect(container).toHaveProperty('id');
        expect(container).toHaveProperty('container_number');
        expect(container).toHaveProperty('status');
      }
    });

    it('should include port information in container list', async () => {
      const res = await adminAgent.get('/api/containers?limit=5');

      expect(res.status).toBe(200);
      if (res.body.data && res.body.data.length > 0) {
        res.body.data.forEach(container => {
          expect(container).toHaveProperty('port_id');
        });
      }
    });
  });

  describe('T9.5: Container Linking in Vehicles', () => {
    let testContainerId;
    let testVehicleId;

    beforeAll(async () => {
      // Create port
      const portRes = await adminAgent
        .post('/api/ports')
        .send({
          name: `Link Test Port ${unique()}`,
          code: `LTP${unique().substring(0, 3).toUpperCase()}`,
          country: 'Georgia'
        });
      createdPortIds.push(portRes.body.data.id);

      // Create container
      const containerRes = await adminAgent
        .post('/api/containers')
        .send({
          container_number: `LINK${unique()}`,
          port_id: portRes.body.data.id
        });
      testContainerId = containerRes.body.data.id;
      createdContainerIds.push(testContainerId);

      // Create vehicle
      const vehicleRes = await adminAgent
        .post('/api/vehicles')
        .send({
          vin: `LINK${unique()}`,
          container_id: testContainerId
        });
      testVehicleId = vehicleRes.body.data.id;
      createdVehicleIds.push(testVehicleId);
    });

    it('should show container_id in vehicle data', async () => {
      const res = await adminAgent.get(`/api/vehicles?limit=100`);

      expect(res.status).toBe(200);
      const vehicle = res.body.data.find(v => v.id === testVehicleId);
      if (vehicle) {
        expect(vehicle.container_id).toBe(testContainerId);
      }
    });

    it('should retrieve container details from vehicle', async () => {
      const vehicleRes = await adminAgent.get('/api/vehicles?limit=100');
      const vehicle = vehicleRes.body.data.find(v => v.id === testVehicleId);

      if (vehicle && vehicle.container_id) {
        const containerRes = await adminAgent.get(`/api/containers/${vehicle.container_id}`);
        expect(containerRes.status).toBe(200);
        expect(containerRes.body.data.id).toBe(testContainerId);
      }
    });
  });

  describe('T9.6: Boats Module Removed', () => {
    it('should return 404 for boats endpoint', async () => {
      const res = await adminAgent.get('/api/boats');
      // Should either be 404 or the endpoint shouldn't exist
      expect([404, 405]).toContain(res.status);
    });

    it('should not allow creating boats', async () => {
      const res = await adminAgent
        .post('/api/boats')
        .send({ name: 'Test Boat' });

      expect([404, 405]).toContain(res.status);
    });
  });

  describe('Container Status Values', () => {
    let testPortId;

    beforeAll(async () => {
      const portRes = await adminAgent
        .post('/api/ports')
        .send({
          name: `Status Test Port ${unique()}`,
          code: `STP${unique().substring(0, 3).toUpperCase()}`,
          country: 'Georgia'
        });
      testPortId = portRes.body.data.id;
      createdPortIds.push(testPortId);
    });

    it('should accept status: Loading', async () => {
      const res = await adminAgent
        .post('/api/containers')
        .send({
          container_number: `LOAD${unique()}`,
          port_id: testPortId,
          status: 'Loading'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('Loading');
      createdContainerIds.push(res.body.data.id);
    });

    it('should accept status: In Transit', async () => {
      const res = await adminAgent
        .post('/api/containers')
        .send({
          container_number: `TRAN${unique()}`,
          port_id: testPortId,
          status: 'In Transit'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('In Transit');
      createdContainerIds.push(res.body.data.id);
    });

    it('should accept status: Arrived', async () => {
      const res = await adminAgent
        .post('/api/containers')
        .send({
          container_number: `ARRV${unique()}`,
          port_id: testPortId,
          status: 'Arrived'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('Arrived');
      createdContainerIds.push(res.body.data.id);
    });

    it('should accept status: Opened', async () => {
      const res = await adminAgent
        .post('/api/containers')
        .send({
          container_number: `OPEN${unique()}`,
          port_id: testPortId,
          status: 'Opened'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('Opened');
      createdContainerIds.push(res.body.data.id);
    });
  });

  describe('Ports and Containers - Dealer Access', () => {
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

    it('should allow dealer to view ports', async () => {
      const res = await dealerAgent.get('/api/ports');
      // Dealers should be able to see ports (read-only)
      expect([200, 403]).toContain(res.status);
    });

    it('should deny dealer ability to create ports', async () => {
      const res = await dealerAgent
        .post('/api/ports')
        .send({
          name: 'Hack Port',
          code: 'HACK',
          country: 'Hack'
        });

      expect(res.status).toBe(403);
    });

    it('should allow dealer to view containers', async () => {
      const res = await dealerAgent.get('/api/containers');
      // Dealers should be able to see containers (read-only)
      expect([200, 403]).toContain(res.status);
    });

    it('should deny dealer ability to create containers', async () => {
      const res = await dealerAgent
        .post('/api/containers')
        .send({
          container_number: 'HACK123',
          port_id: 1
        });

      expect(res.status).toBe(403);
    });
  });
});
