const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const pool = require('../config/db');

async function run() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'migrations', '020_add_vehicle_file_category.sql'),
      'utf-8'
    );
    await pool.query(sql);
    const check = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='vehicle_files' AND column_name='category'"
    );
    console.log('Migration 020 applied. category column present:', check.rows.length > 0);
  } catch (err) {
    console.error('Migration 020 failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
