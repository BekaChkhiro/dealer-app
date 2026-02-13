const request = require('supertest');
const app = require('../index');
const pool = require('../config/db');

// Admin credentials (from seed-admin.js)
const ADMIN_CREDENTIALS = { user: 'admin', password: 'admin123' };

/**
 * Login as admin and return an agent with a persistent session cookie.
 */
async function loginAsAdmin() {
  const agent = request.agent(app);
  const res = await agent
    .post('/api/login')
    .send(ADMIN_CREDENTIALS);

  if (res.status !== 200) {
    throw new Error(`Admin login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return agent;
}

/**
 * Create a test user via API and return { agent, user }.
 * The agent is logged in as admin to create, then a second agent logs in as the new user.
 */
async function createTestUser(adminAgent, overrides = {}) {
  const unique = Date.now() + Math.random().toString(36).slice(2, 8);
  const userData = {
    name: 'Test',
    surname: 'User',
    email: `testuser_${unique}@test.com`,
    username: `testuser_${unique}`,
    password: 'testpass123',
    role: 'user',
    ...overrides,
  };

  const res = await adminAgent
    .post('/api/users')
    .send(userData);

  if (res.status !== 201) {
    throw new Error(`Create test user failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return { user: res.body.data, password: userData.password };
}

/**
 * Login as a specific user and return an agent.
 */
async function loginAs(username, password) {
  const agent = request.agent(app);
  const res = await agent
    .post('/api/login')
    .send({ user: username, password });

  if (res.status !== 200) {
    throw new Error(`Login as ${username} failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return agent;
}

/**
 * Cleanup: delete a user by ID using admin agent.
 */
async function deleteTestUser(adminAgent, userId) {
  await adminAgent.delete(`/api/users/${userId}`);
}

/**
 * Close pool after all tests.
 */
async function closePool() {
  await pool.end();
}

module.exports = {
  app,
  pool,
  ADMIN_CREDENTIALS,
  loginAsAdmin,
  createTestUser,
  loginAs,
  deleteTestUser,
  closePool,
};
