// Server-side bid.cars lot scraper (Cloudflare-protected -> needs a real browser).
// Copart lots are "1-<lot>", IAAI lots are "0-<lot>".
const { chromium } = require('playwright');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function lotUrl(auction, lot) {
  const prefix = auction === 'Copart' ? '1' : auction === 'IAAI' ? '0' : null;
  if (!prefix) return null;
  const clean = String(lot).trim().replace(/[^0-9]/g, '');
  if (!clean) return null;
  return `https://bid.cars/en/lot/${prefix}-${clean}`;
}

// Scrape a single lot. Returns structured vehicle data or { ok:false }.
async function scrapeLot(auction, lot) {
  const url = lotUrl(auction, lot);
  if (!url) return { ok: false, error: 'invalid auction or lot' };

  let browser;
  try {
    browser = await chromium.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });
    const ctx = await browser.newContext({ userAgent: UA, locale: 'en-US', viewport: { width: 1366, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // Wait out the Cloudflare "Just a moment…" interstitial.
    for (let i = 0; i < 20; i++) {
      const t = await page.title().catch(() => '');
      if (!/just a moment|attention required/i.test(t)) break;
      await page.waitForTimeout(1500);
    }
    await page.waitForTimeout(1500);

    const meta = await page.evaluate(() => {
      const get = (sel) => document.querySelector(sel)?.getAttribute('content') || '';
      const ld = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map((s) => { try { return JSON.parse(s.textContent); } catch { return null; } })
        .filter(Boolean).find((x) => x['@type'] === 'Vehicle') || null;
      return {
        desc: get('meta[property="og:description"]') || get('meta[name="description"]'),
        title: get('meta[property="og:title"]'),
        bodyText: document.body.innerText,
        ld,
      };
    });

    const desc = meta.desc || '';
    const blocked = /just a moment|attention required|cf-chl|cloudflare/i.test(meta.bodyText || '') && !desc;
    if (blocked) return { ok: false, error: 'blocked', url };

    const locM = desc.match(/Location:\s*([A-Za-z .'\-]+?)\s*\(([A-Z]{2})\)/i);
    const vinM = desc.match(/VIN:\s*([A-HJ-NPR-Z0-9]{11,17})/i);
    const lotM = desc.match(/Lot:\s*(\d-\d+)/i);
    const odoM = desc.match(/Odometer:\s*([\d  ,]+mi)/i);
    const titleM = (meta.title || '').match(/^([^|]+?)\s*\|/);
    const shipM = (meta.bodyText || '').match(/Shipping from:\s*([A-Za-z .'\-]+?)\s*\(([A-Z]{2})\)/i);

    if (!desc || !locM) return { ok: false, error: 'no-data', url };

    return {
      ok: true,
      url,
      vehicle: titleM ? titleM[1].trim() : (meta.ld?.name || '').replace(/\s*\|.*/, '').trim(),
      vin: vinM ? vinM[1] : meta.ld?.vehicleIdentificationNumber || null,
      lot: lotM ? lotM[1] : null,
      odometer: odoM ? odoM[1].replace(/\s+/g, ' ').trim() : null,
      location: { city: locM[1].trim(), state: locM[2] },
      bidcarsPort: shipM ? `${shipM[1].trim()} (${shipM[2]})` : null,
    };
  } catch (err) {
    return { ok: false, error: err.message, url };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

module.exports = { scrapeLot, lotUrl };
