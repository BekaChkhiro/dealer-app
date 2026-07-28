// Creates two temporary test accounts so you can log in as each non-admin role.
//   test_dealer / Test1234!   (role: dealer)
//   test_user   / Test1234!   (role: user)
// Safe to re-run: updates the password if the account already exists.
// Delete them later with:  DELETE FROM users WHERE username IN ('test_dealer','test_user');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const PW = 'Test1234!';
const ACCOUNTS = [
  { username: 'test_dealer', role: 'dealer', name: 'Test', surname: 'Dealer', email: 'test_dealer@dealer.ge' },
  { username: 'test_user',   role: 'user',   name: 'Test', surname: 'User',   email: 'test_user@dealer.ge' },
];

async function run() {
  try {
    for (const a of ACCOUNTS) {
      const hash = await bcrypt.hash(PW, 10);
      const existing = await pool.query('SELECT id FROM users WHERE username = $1', [a.username]);
      if (existing.rows.length) {
        await pool.query('UPDATE users SET password_hash = $1, role = $2 WHERE username = $3', [hash, a.role, a.username]);
        console.log(`Updated ${a.username} (${a.role}) — password set to ${PW}`);
      } else {
        await pool.query(
          `INSERT INTO users (name, surname, email, username, password_hash, role, signup_date)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [a.name, a.surname, a.email, a.username, hash, a.role]
        );
        console.log(`Created ${a.username} (${a.role}) — password: ${PW}`);
      }
    }
    console.log('\nDone. Log in with:');
    console.log('  admin       / admin123      (admin)');
    console.log('  test_dealer / Test1234!     (dealer)');
    console.log('  test_user   / Test1234!     (user)');
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
run();
