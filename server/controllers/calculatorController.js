const pool = require('../config/db');

const ALLOWED_SORT_COLUMNS = ['id', 'auction', 'city', 'state', 'destination', 'land_price', 'container_price', 'total_price', 'port'];
const ALLOWED_ORDER = ['asc', 'desc'];

async function getCalculator(req, res) {
  try {
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword || '';
    const sortBy = ALLOWED_SORT_COLUMNS.includes(req.query.sort_by) ? req.query.sort_by : 'id';
    const order = ALLOWED_ORDER.includes(req.query.asc) ? req.query.asc : 'desc';
    const { auction, port } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      conditions.push(`(auction ILIKE $${paramIndex} OR city ILIKE $${paramIndex} OR destination ILIKE $${paramIndex} OR port ILIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (auction) {
      conditions.push(`auction = $${paramIndex}`);
      params.push(auction);
      paramIndex++;
    }

    if (port) {
      conditions.push(`port = $${paramIndex}`);
      params.push(port);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM calculator ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT * FROM calculator ${whereClause} ORDER BY ${sortBy} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ error: 0, success: true, data: dataResult.rows, total });
  } catch (err) {
    console.error('getCalculator error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createCalculator(req, res) {
  try {
    const { auction, city, state, destination, land_price, container_price, total_price, port } = req.body;

    if (!auction) {
      return res.status(400).json({ error: 1, success: false, message: 'Auction is required' });
    }

    const result = await pool.query(
      `INSERT INTO calculator (auction, city, state, destination, land_price, container_price, total_price, port)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [auction, city || null, state || null, destination || null, land_price || 0, container_price || 0, total_price || 0, port || null]
    );

    res.status(201).json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createCalculator error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateCalculator(req, res) {
  try {
    const { id } = req.params;
    const { auction, city, state, destination, land_price, container_price, total_price, port } = req.body;

    const fields = [];
    const params = [];
    let paramIndex = 1;

    const addField = (column, value) => {
      if (value !== undefined) {
        fields.push(`${column} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    };

    addField('auction', auction);
    addField('city', city);
    addField('state', state);
    addField('destination', destination);
    addField('land_price', land_price);
    addField('container_price', container_price);
    addField('total_price', total_price);
    addField('port', port);

    if (fields.length === 0) {
      return res.status(400).json({ error: 1, success: false, message: 'No fields to update' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE calculator SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Calculator entry not found' });
    }

    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateCalculator error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteCalculator(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM calculator WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Calculator entry not found' });
    }

    res.json({ error: 0, success: true, message: 'Calculator entry deleted' });
  } catch (err) {
    console.error('deleteCalculator error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

// ---- Public (no-auth) calculator endpoints for the landing-page calculator ----

// Returns the distinct dropdown options derived from the admin-managed matrix.
async function getPublicOptions(req, res) {
  try {
    const [auctions, locations, ports, destinations] = await Promise.all([
      pool.query(`SELECT DISTINCT auction FROM calculator WHERE auction IS NOT NULL AND auction <> '' ORDER BY auction`),
      pool.query(`SELECT DISTINCT city, state FROM calculator WHERE city IS NOT NULL AND city <> '' ORDER BY city, state`),
      pool.query(`SELECT DISTINCT port FROM calculator WHERE port IS NOT NULL AND port <> '' ORDER BY port`),
      pool.query(`SELECT DISTINCT destination FROM calculator WHERE destination IS NOT NULL AND destination <> '' ORDER BY destination`),
    ]);

    res.json({
      error: 0,
      success: true,
      data: {
        auctions: auctions.rows.map(r => r.auction),
        locations: locations.rows.map(r => ({ city: r.city, state: r.state })),
        ports: ports.rows.map(r => r.port),
        destinations: destinations.rows.map(r => r.destination),
      },
    });
  } catch (err) {
    console.error('getPublicOptions error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

// Returns the price for an exact (auction, city, state, port, destination) combination.
async function getPublicQuote(req, res) {
  try {
    const { auction, city, state, port, destination } = req.query;

    const conditions = [];
    const params = [];
    let i = 1;
    const eq = (col, val) => {
      if (val === undefined || val === null || val === '') {
        conditions.push(`(${col} IS NULL OR ${col} = '')`);
      } else {
        conditions.push(`${col} = $${i}`);
        params.push(val);
        i++;
      }
    };
    eq('auction', auction);
    eq('city', city);
    eq('state', state);
    eq('port', port);
    eq('destination', destination);

    const result = await pool.query(
      `SELECT land_price, container_price, total_price
         FROM calculator
        WHERE ${conditions.join(' AND ')}
        ORDER BY id DESC
        LIMIT 1`,
      params
    );

    if (result.rows.length === 0) {
      return res.json({
        error: 0,
        success: true,
        data: { found: false, land_price: 0, container_price: 0, total_price: 0 },
      });
    }

    const row = result.rows[0];
    res.json({
      error: 0,
      success: true,
      data: {
        found: true,
        land_price: row.land_price,
        container_price: row.container_price,
        total_price: row.total_price,
      },
    });
  } catch (err) {
    console.error('getPublicQuote error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

// Returns the full priced matrix so the public calculator can cascade its
// dropdowns (auction -> location -> port -> destination) like srl.ge and
// compute the price client-side. Only rows with a usable total are returned.
async function getPublicMatrix(req, res) {
  try {
    const result = await pool.query(
      `SELECT auction, city, state, port, destination,
              land_price, container_price, total_price
         FROM calculator
        WHERE auction IS NOT NULL AND auction <> ''
          AND city IS NOT NULL AND city <> ''
          AND port IS NOT NULL AND port <> ''
          AND destination IS NOT NULL AND destination <> ''
        ORDER BY auction, city, state, port, destination`
    );
    res.json({ error: 0, success: true, data: result.rows });
  } catch (err) {
    console.error('getPublicMatrix error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

// Scrape a bid.cars lot, resolve its auction location to our calculator matrix,
// and return the vehicle info plus all priced routes for that location.
const { scrapeLot } = require('../helpers/bidcars');

function pickBestLocation(rows, city) {
  const c = city.toLowerCase();
  // exact city first, then contains either way
  let m = rows.filter((r) => (r.city || '').toLowerCase() === c);
  if (m.length) return m;
  m = rows.filter((r) => {
    const rc = (r.city || '').toLowerCase();
    return rc && (rc.includes(c) || c.includes(rc));
  });
  if (m.length) {
    // prefer the longest common match (most specific single city)
    const best = m.reduce((a, b) => ((b.city || '').length > (a.city || '').length ? b : a)).city;
    return m.filter((r) => r.city === best);
  }
  return rows; // state-only fallback
}

async function getLotQuote(req, res) {
  try {
    const auction = req.query.auction;
    const lot = req.query.lot;
    if (!['Copart', 'IAAI'].includes(auction) || !lot) {
      return res.status(400).json({ error: 1, success: false, message: 'auction (Copart|IAAI) and lot are required' });
    }

    const scraped = await scrapeLot(auction, lot);
    if (!scraped.ok) {
      const msg = scraped.error === 'blocked'
        ? 'Could not load the lot (blocked by the source). Please try again.'
        : scraped.error === 'no-data'
          ? 'No data found for this lot. Check the lot number and auction.'
          : 'Failed to read the lot.';
      return res.status(502).json({ error: 1, success: false, message: msg, detail: scraped.error });
    }

    const { city, state } = scraped.location;
    const all = await pool.query(
      `SELECT city, state, port, destination, land_price, container_price, total_price
         FROM calculator
        WHERE auction = $1 AND state = $2
          AND port IS NOT NULL AND destination IS NOT NULL`,
      [auction, state]
    );
    const matched = pickBestLocation(all.rows, city);

    res.json({
      error: 0,
      success: true,
      data: {
        auction,
        vehicle: scraped.vehicle,
        vin: scraped.vin,
        lot: scraped.lot,
        odometer: scraped.odometer,
        location: scraped.location,
        bidcarsPort: scraped.bidcarsPort,
        lotUrl: scraped.url,
        matchedCity: matched.length ? { city: matched[0].city, state: matched[0].state } : null,
        routes: matched.map((r) => ({
          port: r.port,
          destination: r.destination,
          land_price: r.land_price,
          container_price: r.container_price,
          total_price: r.total_price,
        })),
      },
    });
  } catch (err) {
    console.error('getLotQuote error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

// ---- Vehicle types (admin-managed inland price modifiers) ----
async function getVehicleTypes(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name, price_modifier, sort_order FROM vehicle_types ORDER BY sort_order, id'
    );
    res.json({ error: 0, success: true, data: result.rows });
  } catch (err) {
    console.error('getVehicleTypes error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createVehicleType(req, res) {
  try {
    const { name, price_modifier, sort_order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 1, success: false, message: 'Name is required' });
    }
    const result = await pool.query(
      'INSERT INTO vehicle_types (name, price_modifier, sort_order) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), Number(price_modifier) || 0, Number(sort_order) || 0]
    );
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createVehicleType error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateVehicleType(req, res) {
  try {
    const { id } = req.params;
    const { name, price_modifier, sort_order } = req.body;
    const fields = [];
    const params = [];
    let i = 1;
    if (name !== undefined) { fields.push(`name = $${i++}`); params.push(name); }
    if (price_modifier !== undefined) { fields.push(`price_modifier = $${i++}`); params.push(Number(price_modifier) || 0); }
    if (sort_order !== undefined) { fields.push(`sort_order = $${i++}`); params.push(Number(sort_order) || 0); }
    if (!fields.length) return res.status(400).json({ error: 1, success: false, message: 'Nothing to update' });
    params.push(id);
    const result = await pool.query(`UPDATE vehicle_types SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, params);
    if (!result.rows.length) return res.status(404).json({ error: 1, success: false, message: 'Vehicle type not found' });
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateVehicleType error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteVehicleType(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM vehicle_types WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 1, success: false, message: 'Vehicle type not found' });
    res.json({ error: 0, success: true, message: 'Vehicle type deleted' });
  } catch (err) {
    console.error('deleteVehicleType error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

// ---- Calculator ports (admin-managed loading & destination ports) ----
async function getCalcPorts(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name, kind, lat, lon, sort_order FROM calc_ports ORDER BY kind, sort_order, id'
    );
    res.json({ error: 0, success: true, data: result.rows });
  } catch (err) {
    console.error('getCalcPorts error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createCalcPort(req, res) {
  try {
    const { name, kind, lat, lon, sort_order } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 1, success: false, message: 'Name is required' });
    const k = kind === 'destination' ? 'destination' : 'loading';
    const result = await pool.query(
      'INSERT INTO calc_ports (name, kind, lat, lon, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name.trim(), k, lat === '' || lat == null ? null : Number(lat), lon === '' || lon == null ? null : Number(lon), Number(sort_order) || 0]
    );
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createCalcPort error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateCalcPort(req, res) {
  try {
    const { id } = req.params;
    const { name, kind, lat, lon, sort_order } = req.body;
    const fields = [];
    const params = [];
    let i = 1;
    if (name !== undefined) { fields.push(`name = $${i++}`); params.push(name); }
    if (kind !== undefined) { fields.push(`kind = $${i++}`); params.push(kind === 'destination' ? 'destination' : 'loading'); }
    if (lat !== undefined) { fields.push(`lat = $${i++}`); params.push(lat === '' || lat == null ? null : Number(lat)); }
    if (lon !== undefined) { fields.push(`lon = $${i++}`); params.push(lon === '' || lon == null ? null : Number(lon)); }
    if (sort_order !== undefined) { fields.push(`sort_order = $${i++}`); params.push(Number(sort_order) || 0); }
    if (!fields.length) return res.status(400).json({ error: 1, success: false, message: 'Nothing to update' });
    params.push(id);
    const result = await pool.query(`UPDATE calc_ports SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, params);
    if (!result.rows.length) return res.status(404).json({ error: 1, success: false, message: 'Port not found' });
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateCalcPort error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteCalcPort(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM calc_ports WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 1, success: false, message: 'Port not found' });
    res.json({ error: 0, success: true, message: 'Port deleted' });
  } catch (err) {
    console.error('deleteCalcPort error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = { getCalculator, createCalculator, updateCalculator, deleteCalculator, getPublicOptions, getPublicQuote, getPublicMatrix, getLotQuote, getVehicleTypes, createVehicleType, updateVehicleType, deleteVehicleType, getCalcPorts, createCalcPort, updateCalcPort, deleteCalcPort };
