/*
 * Seeds the `calculator` pricing matrix from srl.ge's public price endpoints.
 *
 * Mechanism (reverse-engineered from https://srl.ge/ka/node/42):
 *   - POST /includes/soreli_function/getSellPoints.php { aucid }      -> locations for an auction
 *   - POST /includes/soreli_function/getPrices.php     { point1 }      -> inland prices location -> ports
 *   - POST /includes/soreli_function/getPrice.php      { point1,point2}-> single price (used for ocean port -> dest)
 *
 * A calculator row is valid only when inland(location,port) > 0 AND ocean(port,destination) > 0.
 *   land_price      = inland (location -> loading port)
 *   container_price = ocean  (loading port -> destination)
 *   total_price     = land_price + container_price
 *
 * Usage:
 *   node server/scripts/seed-calculator-from-srl.js --dry   # scrape + print sample/counts, NO db writes
 *   node server/scripts/seed-calculator-from-srl.js         # scrape + REPLACE all calculator rows
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const DRY = process.argv.includes('--dry');
const BASE = 'https://srl.ge/includes/soreli_function';

const AUCTIONS = [
  { id: 1, name: 'Manheim' },
  { id: 2, name: 'Copart' },
  { id: 3, name: 'IAAI' },
  { id: 10, name: 'Adesa' },
  { id: 14, name: 'Impactauto' },
];
const PORTS = {
  998: 'CA - LOS ANGELES', 999: 'CA - OAKLAND', 1002: 'FL - MIAMI', 997: 'GA - SAVANNAH',
  1140: 'IL - CHICAGO', 994: 'NJ - NEWARK', 995: 'TX - HOUSTON', 1000: 'VA - NORFOLK',
  1125: 'WA - SEATTLE', 1148: 'CANADA - MONTREAL', 1005: 'CANADA - TORONTO', 1144: 'CANADA - VANCOUVER',
};
const DESTS = { 1206: 'AM - Gyumri', 1006: 'GE - Poti / Batumi', 1203: 'GE - Tbilisi 30 Days' };

async function post(endpoint, body) {
  const res = await fetch(`${BASE}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' },
    body: new URLSearchParams(body).toString(),
  });
  return res.text();
}
async function postRetry(endpoint, body, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try { return await post(endpoint, body); }
    catch (e) { if (i === tries - 1) throw e; await new Promise(r => setTimeout(r, 400 * (i + 1))); }
  }
}
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

// "AK - Anchorage" -> { state:'AK', city:'Anchorage' }
function parseLocation(name) {
  const i = name.indexOf(' - ');
  if (i === -1) return { state: null, city: name.trim() };
  return { state: name.slice(0, i).trim(), city: name.slice(i + 3).trim() };
}

// run async tasks with limited concurrency
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let idx = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) { const i = idx++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

async function main() {
  console.log(`srl.ge calculator seed — ${DRY ? 'DRY RUN (no DB writes)' : 'LIVE (will replace calculator rows)'}`);

  // 1) Ocean cache: port -> destination, keep > 0
  console.log('Fetching ocean prices (port -> destination)…');
  const ocean = {}; // `${portId}|${destId}` -> price
  for (const portId of Object.keys(PORTS)) {
    for (const destId of Object.keys(DESTS)) {
      const p = num(await postRetry('getPrice.php', { field: 'price', point1: portId, point2: destId }));
      if (p > 0) ocean[`${portId}|${destId}`] = p;
    }
  }
  console.log(`  ocean routes with price: ${Object.keys(ocean).length}`);

  // 2) Per auction: locations + inland prices -> rows
  const rows = [];
  const perAuction = {};
  for (const auc of AUCTIONS) {
    const spTxt = await postRetry('getSellPoints.php', { aucid: auc.id });
    let locations = [];
    try { locations = JSON.parse(spTxt).result || []; } catch { locations = []; }
    let aucRows = 0;

    await pool(locations, 6, async (loc) => {
      const { state, city } = parseLocation(loc.name_en || '');
      let inlandTxt;
      try { inlandTxt = await postRetry('getPrices.php', { field: 'price', point1: loc.id }); }
      catch { return; }
      let inland = [];
      try { inland = JSON.parse(inlandTxt).result || []; } catch { return; }
      for (const leg of inland) {
        const portId = String(leg.point2);
        const landPrice = num(leg.price);
        if (landPrice <= 0 || !PORTS[portId]) continue;
        for (const destId of Object.keys(DESTS)) {
          const oc = ocean[`${portId}|${destId}`];
          if (!oc) continue;
          rows.push({
            auction: auc.name, city, state,
            port: PORTS[portId], destination: DESTS[destId],
            land_price: landPrice, container_price: oc, total_price: landPrice + oc,
          });
          aucRows++;
        }
      }
    });
    perAuction[auc.name] = { locations: locations.length, rows: aucRows };
    console.log(`  ${auc.name}: ${locations.length} locations -> ${aucRows} priced rows`);
  }

  console.log(`\nTOTAL rows generated: ${rows.length}`);
  console.log('Per auction:', JSON.stringify(perAuction));
  console.log('\nSample rows:');
  for (const r of rows.slice(0, 12)) {
    console.log(`  ${r.auction} | ${r.city}, ${r.state} | ${r.port} -> ${r.destination} | inland ${r.land_price} + ocean ${r.container_price} = ${r.total_price}`);
  }

  if (DRY) { console.log('\nDRY RUN complete — no database changes.'); return; }
  if (rows.length === 0) { console.log('No rows generated; aborting without touching DB.'); return; }

  // 3) Replace calculator contents
  const pgPool = require('../config/db');
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM calculator');
    // batch insert
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const batch = rows.slice(i, i + CHUNK);
      const values = [];
      const params = [];
      let p = 1;
      for (const r of batch) {
        values.push(`($${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++})`);
        params.push(r.auction, r.city, r.state, r.destination, r.land_price, r.container_price, r.total_price, r.port);
      }
      await client.query(
        `INSERT INTO calculator (auction, city, state, destination, land_price, container_price, total_price, port) VALUES ${values.join(',')}`,
        params
      );
    }
    await client.query('COMMIT');
    const count = await client.query('SELECT COUNT(*) FROM calculator');
    console.log(`\nInserted. calculator now has ${count.rows[0].count} rows.`);
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('Insert failed:', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pgPool.end();
  }
}

main().catch(e => { console.error('Seed failed:', e); process.exit(1); });
