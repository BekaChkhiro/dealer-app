const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const pool = require('../config/db');

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '028_vehicle_softdelete_booking.sql'), 'utf-8');
    await pool.query(sql);
    const c = await pool.query("SELECT COUNT(*) FROM vehicles WHERE deleted_at IS NOT NULL");
    console.log('Migration 028 applied. Trashed vehicles:', c.rows[0].count);
  } catch (err) {
    console.error('Migration 028 failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
run();
