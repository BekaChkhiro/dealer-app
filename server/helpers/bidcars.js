// Server-side bid.cars lot lookup. bid.cars is Cloudflare-protected and blocks
// datacenter IPs, so we fetch the rendered HTML through a scraping API
// (ScraperAPI free tier) which uses residential IPs + solves the challenge,
// then parse the lot's location/vehicle from the og/JSON-LD structured data.
//
// Requires env SCRAPER_API_KEY. Copart lots are "1-<lot>", IAAI lots are "0-<lot>".

function lotUrl(auction, lot) {
  const prefix = auction === 'Copart' ? '1' : auction === 'IAAI' ? '0' : null;
  if (!prefix) return null;
  const clean = String(lot).trim().replace(/[^0-9]/g, '');
  if (!clean) return null;
  return `https://bid.cars/en/lot/${prefix}-${clean}`;
}

// Pull "content" of a meta tag by property/name from raw HTML.
function metaContent(html, key) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`,
    'i'
  );
  let m = html.match(re);
  if (m) return m[1];
  // attribute order can be reversed (content before property)
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
    'i'
  );
  m = html.match(re2);
  return m ? m[1] : '';
}

function decodeEntities(s) {
  return (s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&#x27;/gi, "'");
}

// Parse the structured data out of a bid.cars lot HTML page.
function parseLotHtml(html) {
  const desc = decodeEntities(metaContent(html, 'og:description') || metaContent(html, 'description'));
  const title = decodeEntities(metaContent(html, 'og:title'));

  const locM = desc.match(/Location:\s*([A-Za-z .'\-]+?)\s*\(([A-Z]{2})\)/i);
  const vinM = desc.match(/VIN:\s*([A-HJ-NPR-Z0-9]{11,17})/i);
  const lotM = desc.match(/Lot:\s*(\d-\d+)/i);
  const odoM = desc.match(/Odometer:\s*([\d  ,]+mi)/i);
  const titleM = title.match(/^([^|]+?)\s*\|/);
  const shipM = decodeEntities(html).match(/Shipping from:\s*([A-Za-z .'\-]+?)\s*\(([A-Z]{2})\)/i);

  if (!desc || !locM) return null;
  return {
    vehicle: titleM ? titleM[1].trim() : '',
    vin: vinM ? vinM[1] : null,
    lot: lotM ? lotM[1] : null,
    odometer: odoM ? odoM[1].replace(/\s+/g, ' ').trim() : null,
    location: { city: locM[1].trim(), state: locM[2] },
    bidcarsPort: shipM ? `${shipM[1].trim()} (${shipM[2]})` : null,
  };
}

async function fetchViaScraperApi(targetUrl) {
  const key = process.env.SCRAPER_API_KEY;
  if (!key) return { ok: false, error: 'no-key' };
  const api = `https://api.scraperapi.com/?api_key=${key}` +
    `&url=${encodeURIComponent(targetUrl)}&render=true&country_code=us`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 70000);
  try {
    const res = await fetch(api, { signal: ctrl.signal });
    if (!res.ok) return { ok: false, error: `scraperapi-${res.status}` };
    const html = await res.text();
    return { ok: true, html };
  } catch (err) {
    return { ok: false, error: err.name === 'AbortError' ? 'timeout' : err.message };
  } finally {
    clearTimeout(timer);
  }
}

// Public: scrape a lot and return structured data or { ok:false, error }.
async function scrapeLot(auction, lot) {
  const url = lotUrl(auction, lot);
  if (!url) return { ok: false, error: 'invalid auction or lot' };

  const fetched = await fetchViaScraperApi(url);
  if (!fetched.ok) return { ok: false, error: fetched.error, url };

  const parsed = parseLotHtml(fetched.html);
  if (!parsed) {
    const blocked = /just a moment|attention required|cf-chl|cloudflare/i.test(fetched.html);
    return { ok: false, error: blocked ? 'blocked' : 'no-data', url };
  }
  return { ok: true, url, ...parsed };
}

module.exports = { scrapeLot, lotUrl, parseLotHtml };
