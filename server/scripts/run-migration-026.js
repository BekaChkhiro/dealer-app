const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const pool = require('../config/db');

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '026_vehicle_geo_columns.sql'), 'utf-8');
    await pool.query(sql);
    const c = await pool.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name IN ('city_id', 'city', 'loading_port_id')
        ORDER BY column_name`
    );
    console.log('Migration 026 applied. vehicles columns present:', c.rows.map(r => r.column_name).join(', '));
  } catch (err) {
    console.error('Migration 026 failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
run();
