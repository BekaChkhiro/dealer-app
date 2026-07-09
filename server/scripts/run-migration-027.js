const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const pool = require('../config/db');

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '027_warehouses.sql'), 'utf-8');
    await pool.query(sql);
    const c = await pool.query('SELECT COUNT(*) FROM warehouses');
    console.log('Migration 027 applied. warehouses rows:', c.rows[0].count);
  } catch (err) {
    console.error('Migration 027 failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
run();
