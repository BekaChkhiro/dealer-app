const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const pool = require('../config/db');

async function ensureMessagesTable() {
  try {
    // Check if messages table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'messages'
      );
    `);

    if (checkResult.rows[0].exists) {
      console.log('✓ Messages table already exists');
    } else {
      console.log('Creating messages table...');

      // Create messages table
      await pool.query(`
        CREATE TABLE messages (
          id SERIAL PRIMARY KEY,
          from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          subject VARCHAR(500) NOT NULL,
          body TEXT,
          read_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Create indexes
      await pool.query(`
        CREATE INDEX idx_messages_to_user ON messages(to_user_id);
        CREATE INDEX idx_messages_from_user ON messages(from_user_id);
        CREATE INDEX idx_messages_read_at ON messages(read_at);
        CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
      `);

      console.log('✓ Messages table created successfully');
    }

    // Verify the table structure
    const columnsResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'messages'
      ORDER BY ordinal_position;
    `);

    console.log('\nMessages table columns:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n✓ Messages table is ready!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

ensureMessagesTable();
