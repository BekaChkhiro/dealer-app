const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const pool = require('../config/db');

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '023_add_calc_ports.sql'), 'utf-8');
    await pool.query(sql);
    const c = await pool.query('SELECT COUNT(*) FROM calc_ports');
    console.log('Migration 023 applied. calc_ports rows:', c.rows[0].count);
  } catch (err) {
    console.error('Migration 023 failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
run();
