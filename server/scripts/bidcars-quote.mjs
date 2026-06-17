/*
 * Proof of concept: scrape a bid.cars lot page (Copart "1-<lot>" / IAAI "0-<lot>"),
 * read the auction LOCATION, then look up our calculator matrix to find the
 * cheapest shipping cost to Poti (and the other destinations).
 *
 * Usage:
 *   node server/scripts/bidcars-quote.mjs https://bid.cars/en/lot/1-53069776
 *   node server/scripts/bidcars-quote.mjs 1-53069776
 */
import { chromium } from 'playwright';

const MATRIX_URL = 'https://dealer-app-production-44ff.up.railway.app/api/public/calculator/matrix';
const POTI = 'GE - Poti / Batumi';

function normalizeUrl(arg) {
  if (!arg) return null;
  if (arg.startsWith('http')) return arg;
  return `https://bid.cars/en/lot/${arg}`;
}
function auctionFromUrl(url) {
  const m = url.match(/\/lot\/(\d)-/);
  if (!m) return null;
  return m[1] === '1' ? 'Copart' : m[1] === '0' ? 'IAAI' : null;
}

async function scrapeLot(url) {
  const b = await chromium.launch({ args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await b.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US', viewport: { width: 1366, height: 900 },
  });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // wait out Cloudflare "Just a moment…"
    for (let i = 0; i < 20; i++) {
      const t = await page.title().catch(() => '');
      if (!/just a moment|attention required/i.test(t)) break;
      await page.waitForTimeout(1500);
    }
    await page.waitForTimeout(2000);

    // Authoritative structured data: og:description / meta description carry
    //   "... Location: <City (ST)>, USA | Odometer: <n> mi"
    // and og:title carries "<Year> <Make> <Model> | <VIN> | BidCars".
    const meta = await page.evaluate(() => {
      const get = (sel) => document.querySelector(sel)?.getAttribute('content') || '';
      const ld = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map(s => { try { return JSON.parse(s.textContent); } catch { return null; } })
        .filter(Boolean).find(x => x['@type'] === 'Vehicle') || null;
      return {
        desc: get('meta[property="og:description"]') || get('meta[name="description"]'),
        title: get('meta[property="og:title"]'),
        bodyText: document.body.innerText,
        ld,
      };
    });

    const desc = meta.desc || '';
    const locM = desc.match(/Location:\s*([A-Za-z .'\-]+?)\s*\(([A-Z]{2})\)/i);
    const vinM = desc.match(/VIN:\s*([A-HJ-NPR-Z0-9]{11,17})/i);
    const lotM = desc.match(/Lot:\s*(\d-\d+)/i);
    const odoM = desc.match(/Odometer:\s*([\d  ,]+mi)/i);
    const titleM = (meta.title || '').match(/^([^|]+?)\s*\|/);
    // bid.cars's own suggested loading port: "Shipping from: <City (ST)>"
    const shipM = (meta.bodyText || '').match(/Shipping from:\s*([A-Za-z .'\-]+?)\s*\(([A-Z]{2})\)/i);

    return {
      vehicle: titleM ? titleM[1].trim() : (meta.ld?.name || '').replace(/\s*\|.*/, '').trim(),
      location: locM ? { city: locM[1].trim(), state: locM[2] } : null,
      vin: vinM ? vinM[1] : (meta.ld?.vehicleIdentificationNumber || null),
      lot: lotM ? lotM[1] : null,
      odometer: odoM ? odoM[1].replace(/\s+/g, ' ').trim() : null,
      bidcarsPort: shipM ? `${shipM[1].trim()} (${shipM[2]})` : null,
      ok: !!desc,
    };
  } finally {
    await b.close();
  }
}

function matchLocation(rows, auction, loc) {
  const cands = rows.filter(r => r.auction === auction);
  const city = loc.city.toLowerCase();
  // exact city+state
  let m = cands.filter(r => (r.city || '').toLowerCase() === city && (r.state || '') === loc.state);
  if (m.length) return { rows: m, how: 'exact' };
  // same state, city contains / contained
  m = cands.filter(r => (r.state || '') === loc.state &&
    ((r.city || '').toLowerCase().includes(city) || city.includes((r.city || '').toLowerCase())));
  if (m.length) return { rows: m, how: 'fuzzy(state+city~)' };
  // same state only
  m = cands.filter(r => (r.state || '') === loc.state);
  if (m.length) return { rows: m, how: 'state-only' };
  return { rows: [], how: 'none' };
}

async function main() {
  const url = normalizeUrl(process.argv[2]);
  if (!url) { console.error('Pass a bid.cars lot URL or "1-<lot>".'); process.exit(1); }
  const auction = auctionFromUrl(url);
  console.log(`URL: ${url}\nAuction (from prefix): ${auction || 'unknown'}`);

  console.log('Scraping bid.cars (bypassing Cloudflare)…');
  const lot = await scrapeLot(url);
  if (!lot.ok || !lot.location) {
    console.log('Could not read lot data (Cloudflare block or layout change).');
    console.log('Parsed:', JSON.stringify(lot));
    process.exit(2);
  }
  console.log(`\nVehicle:`);
  console.log(`  Vehicle:   ${lot.vehicle || '-'}`);
  console.log(`  Lot:       ${lot.lot}`);
  console.log(`  VIN:       ${lot.vin}`);
  console.log(`  Location:  ${lot.location.city} (${lot.location.state})`);
  console.log(`  Odometer:  ${lot.odometer || '-'}`);
  if (lot.bidcarsPort) console.log(`  bid.cars suggested port: ${lot.bidcarsPort}`);

  const res = await fetch(MATRIX_URL);
  const rows = (await res.json()).data || [];
  const { rows: matched, how } = matchLocation(rows, auction, lot.location);
  if (!matched.length) {
    console.log(`\nNo calculator match for ${auction} / ${lot.location.city}, ${lot.location.state}.`);
    process.exit(0);
  }
  // Real shippable routes to Poti only have an ocean leg (container_price > 0).
  const toPoti = matched.filter(r => r.destination === POTI && parseFloat(r.container_price) > 0)
    .map(r => ({ port: r.port, total: parseFloat(r.total_price), inland: parseFloat(r.land_price), ocean: parseFloat(r.container_price) }))
    .sort((a, b) => a.total - b.total);

  console.log(`\nCalculator match (${how}) — ${auction} / ${matched[0].city}, ${matched[0].state}`);
  if (!toPoti.length) {
    console.log('No shippable ocean route to Poti from this location in the calculator.');
    process.exit(0);
  }
  console.log(`Shipping cost to Poti (real ocean routes):`);
  for (const p of toPoti) console.log(`  ${p.port.padEnd(20)} $${p.total.toLocaleString('en-US')}  (inland $${p.inland} + ocean $${p.ocean})`);
  const best = toPoti[0];
  console.log(`\n==> CHEAPEST TO POTI: ${best.port}  =  $${best.total.toLocaleString('en-US')}`);
}

main().catch(e => { console.error('Failed:', e.message); process.exit(1); });
