const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  try {
    await pool.query(`
      ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS receiver_id_document_url VARCHAR(500);
    `);
    await pool.query(`
      ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS receiver_id_uploaded_at TIMESTAMP;
    `);
    console.log('✅ Migration 015 completed: receiver_id_document fields added');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();
