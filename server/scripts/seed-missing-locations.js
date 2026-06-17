// Adds the 4 auction locations that have no inland route (so the seed skipped
// them) — Manheim: Tuscaloosa/AL, Caribbean Subasta De Autos/PR, Casper (TRA)/WY;
// Adesa: Richmond/Сanada. Inserted as placeholder rows (prices 0) so they appear
// in the location dropdown. Idempotent.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const pool = require('../config/db');

const ROWS = [
  ['Manheim', 'Tuscaloosa', 'AL'],
  ['Manheim', 'Caribbean Subasta De Autos', 'PR'],
  ['Manheim', 'Casper (TRA)', 'WY'],
  ['Adesa', 'Richmond', 'Сanada'],
];
const PORT = 'CA - LOS ANGELES';
const DEST = 'GE - Poti / Batumi';

async function run() {
  try {
    let added = 0;
    for (const [auction, city, state] of ROWS) {
      const exists = await pool.query(
        'SELECT 1 FROM calculator WHERE auction=$1 AND city=$2 LIMIT 1',
        [auction, city]
      );
      if (exists.rows.length) continue;
      await pool.query(
        `INSERT INTO calculator (auction, city, state, port, destination, land_price, container_price, total_price)
         VALUES ($1,$2,$3,$4,$5,0,0,0)`,
        [auction, city, state, PORT, DEST]
      );
      added++;
      console.log('  added:', auction, '/', city, '(', state, ')');
    }
    console.log(`Done. Added ${added} location(s).`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
run();
