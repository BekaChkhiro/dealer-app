const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const pool = require('../config/db');

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '029_announcements.sql'), 'utf-8');
    await pool.query(sql);
    const c = await pool.query('SELECT COUNT(*) FROM announcements');
    console.log('Migration 029 applied. announcements rows:', c.rows[0].count);
  } catch (err) {
    console.error('Migration 029 failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
run();
