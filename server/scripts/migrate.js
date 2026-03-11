const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const pool = require('../config/db');

async function migrate() {
  try {
    // Run main schema
    const schemaPath = path.join(__dirname, '..', 'models', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(sql);
    console.log('Main schema migration completed.');

    // Run individual migration files from migrations folder
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      for (const file of files) {
        const filePath = path.join(migrationsDir, file);
        const migrationSql = fs.readFileSync(filePath, 'utf-8');
        try {
          await pool.query(migrationSql);
          console.log(`  Applied: ${file}`);
        } catch (err) {
          // Ignore errors from already-applied migrations (e.g., column already exists)
          if (err.code === '42701') { // duplicate_column
            console.log(`  Skipped (already applied): ${file}`);
          } else if (err.code === '42703' || err.code === '42P01') { // undefined_column or undefined_table
            console.log(`  Skipped (dependency not ready): ${file}`);
          } else {
            console.error(`  Error in ${file}:`, err.message);
            throw err;
          }
        }
      }
    }

    console.log('\nMigration completed successfully.');

    // Verify tables
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log('\nTables in database:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
