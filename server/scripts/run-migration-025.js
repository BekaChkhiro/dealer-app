const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const pool = require('../config/db');

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '025_geography.sql'), 'utf-8');
    await pool.query(sql);
    const countries = await pool.query('SELECT COUNT(*) FROM countries');
    const states = await pool.query('SELECT COUNT(*) FROM states');
    const cities = await pool.query('SELECT COUNT(*) FROM cities');
    const loadingPorts = await pool.query('SELECT COUNT(*) FROM loading_ports');
    console.log('Migration 025 applied. countries rows:', countries.rows[0].count);
    console.log('Migration 025 applied. states rows:', states.rows[0].count);
    console.log('Migration 025 applied. cities rows:', cities.rows[0].count);
    console.log('Migration 025 applied. loading_ports rows:', loadingPorts.rows[0].count);
  } catch (err) {
    console.error('Migration 025 failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
run();
