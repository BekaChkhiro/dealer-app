const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const pool = require('../config/db');

async function seedAdmin() {
  const username = 'admin';
  const password = 'admin123';
  const SALT_ROUNDS = 10;

  try {
    // Check if admin already exists
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      console.log('Admin user already exists, skipping seed.');
      await pool.end();
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await pool.query(
      `INSERT INTO users (name, surname, email, username, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['Admin', 'User', 'admin@royalmotors.com', username, passwordHash, 'admin']
    );

    console.log(`Admin user seeded: username="${username}", password="${password}"`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedAdmin();
