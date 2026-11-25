// Parses auction purchase invoices (Copart "Sales Receipt/Bill of Sale" and
// IAA "Buyer Receipt") into vehicle fields, so the add-car form can be
// prefilled from the PDF instead of typed by hand.
//
// Two steps, kept separate so the text parsing is testable without PDFs:
//   extractInvoiceText(buffer) -> lines of text, table cells separated by \t
//   parseInvoiceText(text)     -> { auction, vin, lot_number, ... } | null

// pdf-parse's index.js runs a debug self-test when required directly; the lib
// entry point is the plain function.
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;

const COLORS = [
  'BLACK', 'WHITE', 'GRAY', 'GREY', 'SILVER', 'BLUE', 'RED', 'GREEN', 'BROWN', 'BEIGE',
  'GOLD', 'ORANGE', 'YELLOW', 'BURGUNDY', 'MAROON', 'PURPLE', 'TAN', 'CHARCOAL', 'CREAM',
  'TURQUOISE', 'TEAL', 'PINK', 'BRONZE', 'COPPER', 'TWO TONE', 'UNKNOWN',
];

// Makes written as more than one word on auction paperwork.
const MULTI_WORD_MAKES = [
  'LAND ROVER', 'ALFA ROMEO', 'ASTON MARTIN', 'ROLLS ROYCE', 'MERCEDES BENZ',
  'AM GENERAL', 'AMERICAN MOTORS', 'HARLEY DAVIDSON',
];

// Text items closer than this (in PDF points) belong to the same table cell.
const CELL_GAP = 6;
const LINE_TOLERANCE = 3;

// Rebuild lines from positioned text items. pdf-parse's default output glues
// neighbouring table cells together ("FORDRANGERGray52,200..."), which makes
// the IAA vehicle row unparseable — so cells are separated by a tab instead.
async function renderPage(pageData) {
  const content = await pageData.getTextContent({ normalizeWhitespace: true, disableCombineTextItems: true });
  const items = content.items
    .filter((i) => i.str.trim())
    .map((i) => ({ s: i.str.trim(), x: i.transform[4], y: i.transform[5], w: i.width }));
  items.sort((a, b) => (Math.abs(b.y - a.y) > LINE_TOLERANCE ? b.y - a.y : a.x - b.x));

  const lines = [];
  let current = null;
  for (const item of items) {
    if (!current || Math.abs(current.y - item.y) > LINE_TOLERANCE) {
      current = { y: item.y, items: [] };
      lines.push(current);
    }
    current.items.push(item);
  }

  return lines.map((line) => {
    line.items.sort((a, b) => a.x - b.x);
    let out = '';
    let end = null;
    for (const item of line.items) {
      if (end !== null) {
        const gap = item.x - end;
        out += gap > CELL_GAP ? '\t' : gap > 1 ? ' ' : '';
      }
      out += item.s;
      end = item.x + item.w;
    }
    return out;
  }).join('\n');
}

async function extractInvoiceText(buffer) {
  const result = await pdfParse(buffer, { pagerender: renderPage, max: 3 });
  return result.text || '';
}

function money(str) {
  if (str == null) return null;
  const m = String(str).match(/(-?)\s*\$\s*([\d,]+(?:\.\d{1,2})?)/);
  if (!m) return null;
  const value = parseFloat(m[2].replace(/,/g, ''));
  return m[1] ? -value : value;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// "11/9/2026" or "11/09/26" -> "2026-11-09"
function isoDate(str) {
  const m = String(str || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return null;
  const year = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

function cellsOf(line) {
  return line.split('\t').map((c) => c.trim()).filter(Boolean);
}

// "KIA K5 LXS BLACK" -> { mark: 'KIA', model: 'K5 LXS', color: 'BLACK' }
// Copart prints make, model, trim and color as one string; the trim stays in
// `model` here and is narrowed against the known model list by the caller.
function splitVehicleDescription(description) {
  let rest = description.toUpperCase().replace(/\s+/g, ' ').trim();
  let color = null;
  for (const c of COLORS) {
    if (rest.endsWith(` ${c}`)) {
      color = c;
      rest = rest.slice(0, -c.length).trim();
      break;
    }
  }
  const normalized = rest.replace(/-/g, ' ');
  const multi = MULTI_WORD_MAKES.find((m) => normalized.startsWith(`${m} `));
  const mark = multi ? rest.slice(0, multi.length) : rest.split(' ')[0];
  return { mark, model: rest.slice(mark.length).trim(), color };
}

function parseCopart(lines) {
  const text = lines.join('\n');
  const out = { auction: 'Copart' };

  out.lot_number = (text.match(/LOT#:\s*(\d+)/) || [])[1] || null;
  out.vin = (text.match(/VIN:\s*([A-HJ-NPR-Z0-9]{17})\b/) || [])[1] || null;

  const vehicle = text.match(/VEHICLE:\s*((?:19|20)\d{2})\s+([^\t\n]+)/);
  if (vehicle) {
    out.year = vehicle[1];
    Object.assign(out, splitVehicleDescription(vehicle[2]));
  }

  const keys = text.match(/Keys:\s*(YES|NO)\b/i);
  if (keys) out.has_key = keys[1].toUpperCase() === 'YES';

  out.purchase_date = isoDate((text.match(/\bSale:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/) || [])[1]);

  // Yard address: "CITY ST 12345" in its own cell (the seller's address has a
  // comma after the city, the yard's does not).
  const header = lines.slice(0, Math.max(0, lines.findIndex((l) => /LOT#:/.test(l))));
  for (const line of header) {
    for (const cell of cellsOf(line)) {
      const m = cell.match(/^([A-Z][A-Z .'-]*?) ([A-Z]{2}) \d{5}(?:-\d{4})?$/);
      if (m) {
        out.city = m[1].trim();
        out.state = m[2];
      }
    }
  }

  // Charges table: "date \t label \t amount [\t description]"
  const charges = [];
  let paid = 0;
  for (const line of lines) {
    const cells = cellsOf(line);
    if (cells.length < 3 || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cells[0])) continue;
    const amount = money(cells[2]);
    if (amount == null) continue;
    if (/^payment$/i.test(cells[1])) {
      // Payments are negative; a positive "Payment" row is a refund.
      paid -= amount;
      if (amount < 0 && !out.payment_date) out.payment_date = isoDate(cells[0]);
    } else {
      charges.push({ label: cells[1], amount });
      if (/^sale price$/i.test(cells[1])) out.sale_price = amount;
    }
  }
  out.charges = charges;
  if (charges.length) out.total_amount = round2(charges.reduce((sum, c) => sum + c.amount, 0));
  out.paid_amount = round2(paid);
  const netDue = lines.find((l) => /^Net Due/i.test(l));
  out.balance_due = netDue ? money(netDue) : null;

  return out;
}

function parseIaa(lines) {
  const text = lines.join('\n');
  const out = { auction: 'IAAI' };

  // Vehicle row: StockNo | Item # | Year | Make | Model | Color | Mileage | VIN
  const row = lines.map(cellsOf).find((cells) => cells.length >= 5 && cells.some((c) => VIN_RE.test(c)));
  if (row) {
    const vinIdx = row.findIndex((c) => VIN_RE.test(c));
    const yearIdx = row.findIndex((c) => /^(19|20)\d{2}$/.test(c));
    out.vin = row[vinIdx];
    // Stock numbers are printed "000-46020192"; the lot is the part after the prefix.
    const stock = row.find((c) => /^\d{3}-\d{5,}$/.test(c));
    if (stock) out.lot_number = stock.split('-')[1];
    if (yearIdx >= 0) {
      out.year = row[yearIdx];
      const between = row.slice(yearIdx + 1, vinIdx);
      out.mark = (between[0] || '').toUpperCase() || null;
      out.model = (between[1] || '').toUpperCase() || null;
      for (const cell of between.slice(2)) {
        if (/^[\d,]+$/.test(cell)) out.mileage = parseInt(cell.replace(/,/g, ''), 10);
        else out.color = cell.toUpperCase();
      }
    }
  }

  out.purchase_date = isoDate((text.match(/Sale Date\s+(\d{1,2}\/\d{1,2}\/\d{4})/) || [])[1]);

  // "..., San Antonio, TX , 78224." on the USPPI line
  const address = text.match(/,\s*([A-Za-z .'-]+?)\s*,\s*([A-Z]{2})\s*,\s*\d{5}/);
  if (address) {
    out.city = address[1].trim().toUpperCase();
    out.state = address[2];
  }

  const charges = [];
  let inCharges = false;
  for (const line of lines) {
    const cells = cellsOf(line);
    if (cells.includes('Description') && cells.includes('Charges')) { inCharges = true; continue; }
    if (!inCharges) continue;
    if (/^Check #|^Total Payment|^Account Credit/i.test(cells[0] || '')) break;
    const amountIdx = cells.findIndex((c) => /^-?\$[\d,.]+$/.test(c));
    if (amountIdx < 1) continue;
    const label = cells[amountIdx - 1];
    const amount = money(cells[amountIdx]);
    charges.push({ label, amount });
    if (/^bid amount$/i.test(label)) out.sale_price = amount;
  }
  out.charges = charges;

  // "PAID IN FULL | Total | charges | payments | balance"
  const totalLine = lines.map(cellsOf).find((cells) => cells.includes('Total') && cells.filter((c) => /^-?\$/.test(c)).length >= 2);
  if (totalLine) {
    const amounts = totalLine.filter((c) => /^-?\$/.test(c)).map(money);
    out.total_amount = amounts[0];
    out.paid_amount = amounts[1];
    out.balance_due = amounts.length > 2 ? amounts[2] : null;
  } else if (charges.length) {
    out.total_amount = round2(charges.reduce((sum, c) => sum + c.amount, 0));
  }

  const payment = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})[^\n]*-\s*Payment/);
  if (payment) out.payment_date = isoDate(payment[1]);

  return out;
}

function parseInvoiceText(text) {
  const lines = String(text || '').split('\n').map((l) => l.trimEnd()).filter((l) => l.trim());
  const joined = lines.join('\n');

  let result = null;
  if (/Insurance Auto Auctions|IAA Doc:|\bIAAI\b/i.test(joined) && /Buyer Receipt|StockNo/i.test(joined)) {
    result = parseIaa(lines);
  } else if (/copart/i.test(joined) || (/LOT#:/.test(joined) && /Bill of Sale/i.test(joined))) {
    result = parseCopart(lines);
  }

  // Without a VIN there is nothing reliable to build a vehicle from.
  if (!result || !result.vin) return null;
  return result;
}

module.exports = { extractInvoiceText, parseInvoiceText, splitVehicleDescription };
