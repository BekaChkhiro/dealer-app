const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

async function runMigration(migrationFile) {
  try {
    console.log(`Running migration: ${migrationFile}`);

    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(sql);

    console.log(`✅ Migration ${migrationFile} completed successfully`);
  } catch (error) {
    console.error(`❌ Migration ${migrationFile} failed:`, error.message);
    throw error;
  }
}

async function main() {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.error('Usage: node run-migration.js <migration-file>');
    console.error('Example: node run-migration.js 016_add_transport_costs.sql');
    process.exit(1);
  }

  try {
    await runMigration(migrationFile);
    console.log('\n✅ All migrations completed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed');
    process.exit(1);
  }
}

main();
