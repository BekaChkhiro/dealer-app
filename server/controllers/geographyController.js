const pool = require('../config/db');

// ============================================================
// Countries
// ============================================================
async function getCountries(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name, code, sort_order, created_at FROM countries ORDER BY sort_order, id'
    );
    res.json({ error: 0, success: true, data: result.rows });
  } catch (err) {
    console.error('getCountries error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createCountry(req, res) {
  try {
    const { name, code, sort_order } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 1, success: false, message: 'Name is required' });
    const result = await pool.query(
      'INSERT INTO countries (name, code, sort_order) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), code ? code.trim() : null, Number(sort_order) || 0]
    );
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createCountry error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateCountry(req, res) {
  try {
    const { id } = req.params;
    const { name, code, sort_order } = req.body;
    if (name !== undefined && !name.trim()) return res.status(400).json({ error: 1, success: false, message: 'Name is required' });
    const fields = [];
    const params = [];
    let i = 1;
    if (name !== undefined) { fields.push(`name = $${i++}`); params.push(name.trim()); }
    if (code !== undefined) { fields.push(`code = $${i++}`); params.push(code ? code.trim() : null); }
    if (sort_order !== undefined) { fields.push(`sort_order = $${i++}`); params.push(Number(sort_order) || 0); }
    if (!fields.length) return res.status(400).json({ error: 1, success: false, message: 'Nothing to update' });
    params.push(id);
    const result = await pool.query(`UPDATE countries SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, params);
    if (!result.rows.length) return res.status(404).json({ error: 1, success: false, message: 'Country not found' });
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateCountry error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteCountry(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM countries WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 1, success: false, message: 'Country not found' });
    res.json({ error: 0, success: true, message: 'Country deleted' });
  } catch (err) {
    console.error('deleteCountry error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

// ============================================================
// States
// ============================================================
async function getStates(req, res) {
  try {
    const { country_id } = req.query;
    const params = [];
    let where = '';
    if (country_id) {
      params.push(country_id);
      where = 'WHERE s.country_id = $1';
    }
    const result = await pool.query(
      `SELECT s.id, s.country_id, s.name, s.code, s.sort_order, c.name AS country_name
         FROM states s
         LEFT JOIN countries c ON c.id = s.country_id
         ${where}
        ORDER BY s.sort_order, s.id`,
      params
    );
    res.json({ error: 0, success: true, data: result.rows });
  } catch (err) {
    console.error('getStates error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createState(req, res) {
  try {
    const { country_id, name, code, sort_order } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 1, success: false, message: 'Name is required' });
    const result = await pool.query(
      'INSERT INTO states (country_id, name, code, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [country_id || null, name.trim(), code ? code.trim() : null, Number(sort_order) || 0]
    );
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createState error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateState(req, res) {
  try {
    const { id } = req.params;
    const { country_id, name, code, sort_order } = req.body;
    if (name !== undefined && !name.trim()) return res.status(400).json({ error: 1, success: false, message: 'Name is required' });
    const fields = [];
    const params = [];
    let i = 1;
    if (country_id !== undefined) { fields.push(`country_id = $${i++}`); params.push(country_id || null); }
    if (name !== undefined) { fields.push(`name = $${i++}`); params.push(name.trim()); }
    if (code !== undefined) { fields.push(`code = $${i++}`); params.push(code ? code.trim() : null); }
    if (sort_order !== undefined) { fields.push(`sort_order = $${i++}`); params.push(Number(sort_order) || 0); }
    if (!fields.length) return res.status(400).json({ error: 1, success: false, message: 'Nothing to update' });
    params.push(id);
    const result = await pool.query(`UPDATE states SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, params);
    if (!result.rows.length) return res.status(404).json({ error: 1, success: false, message: 'State not found' });
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateState error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteState(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM states WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 1, success: false, message: 'State not found' });
    res.json({ error: 0, success: true, message: 'State deleted' });
  } catch (err) {
    console.error('deleteState error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

// ============================================================
// Cities
// ============================================================
async function getCities2(req, res) {
  try {
    const { state_id, q } = req.query;
    const conditions = [];
    const params = [];
    let i = 1;
    if (state_id) { conditions.push(`ci.state_id = $${i++}`); params.push(state_id); }
    if (q) { conditions.push(`ci.name ILIKE $${i++}`); params.push(`%${q}%`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT ci.id, ci.state_id, ci.name, ci.sort_order,
              s.name AS state_name, s.code AS state_code,
              s.country_id, co.name AS country_name
         FROM cities ci
         LEFT JOIN states s ON s.id = ci.state_id
         LEFT JOIN countries co ON co.id = s.country_id
         ${where}
        ORDER BY ci.sort_order, ci.id`,
      params
    );
    res.json({ error: 0, success: true, data: result.rows });
  } catch (err) {
    console.error('getCities2 error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createCity(req, res) {
  try {
    const { state_id, name, sort_order } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 1, success: false, message: 'Name is required' });
    const result = await pool.query(
      'INSERT INTO cities (state_id, name, sort_order) VALUES ($1, $2, $3) RETURNING *',
      [state_id || null, name.trim(), Number(sort_order) || 0]
    );
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createCity error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateCity(req, res) {
  try {
    const { id } = req.params;
    const { state_id, name, sort_order } = req.body;
    if (name !== undefined && !name.trim()) return res.status(400).json({ error: 1, success: false, message: 'Name is required' });
    const fields = [];
    const params = [];
    let i = 1;
    if (state_id !== undefined) { fields.push(`state_id = $${i++}`); params.push(state_id || null); }
    if (name !== undefined) { fields.push(`name = $${i++}`); params.push(name.trim()); }
    if (sort_order !== undefined) { fields.push(`sort_order = $${i++}`); params.push(Number(sort_order) || 0); }
    if (!fields.length) return res.status(400).json({ error: 1, success: false, message: 'Nothing to update' });
    params.push(id);
    const result = await pool.query(`UPDATE cities SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, params);
    if (!result.rows.length) return res.status(404).json({ error: 1, success: false, message: 'City not found' });
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateCity error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteCity(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM cities WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 1, success: false, message: 'City not found' });
    res.json({ error: 0, success: true, message: 'City deleted' });
  } catch (err) {
    console.error('deleteCity error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

// ============================================================
// Loading ports
// ============================================================
async function getLoadingPorts(req, res) {
  try {
    const result = await pool.query(
      `SELECT lp.id, lp.name, lp.country_id, lp.code, lp.is_active, lp.sort_order,
              c.name AS country_name
         FROM loading_ports lp
         LEFT JOIN countries c ON c.id = lp.country_id
        ORDER BY lp.sort_order, lp.id`
    );
    res.json({ error: 0, success: true, data: result.rows });
  } catch (err) {
    console.error('getLoadingPorts error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createLoadingPort(req, res) {
  try {
    const { name, country_id, code, is_active, sort_order } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 1, success: false, message: 'Name is required' });
    const result = await pool.query(
      'INSERT INTO loading_ports (name, country_id, code, is_active, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name.trim(), country_id || null, code ? code.trim() : null, is_active === undefined ? true : !!is_active, Number(sort_order) || 0]
    );
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createLoadingPort error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateLoadingPort(req, res) {
  try {
    const { id } = req.params;
    const { name, country_id, code, is_active, sort_order } = req.body;
    if (name !== undefined && !name.trim()) return res.status(400).json({ error: 1, success: false, message: 'Name is required' });
    const fields = [];
    const params = [];
    let i = 1;
    if (name !== undefined) { fields.push(`name = $${i++}`); params.push(name.trim()); }
    if (country_id !== undefined) { fields.push(`country_id = $${i++}`); params.push(country_id || null); }
    if (code !== undefined) { fields.push(`code = $${i++}`); params.push(code ? code.trim() : null); }
    if (is_active !== undefined) { fields.push(`is_active = $${i++}`); params.push(!!is_active); }
    if (sort_order !== undefined) { fields.push(`sort_order = $${i++}`); params.push(Number(sort_order) || 0); }
    if (!fields.length) return res.status(400).json({ error: 1, success: false, message: 'Nothing to update' });
    params.push(id);
    const result = await pool.query(`UPDATE loading_ports SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, params);
    if (!result.rows.length) return res.status(404).json({ error: 1, success: false, message: 'Loading port not found' });
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateLoadingPort error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteLoadingPort(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM loading_ports WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 1, success: false, message: 'Loading port not found' });
    res.json({ error: 0, success: true, message: 'Loading port deleted' });
  } catch (err) {
    console.error('deleteLoadingPort error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = {
  getCountries, createCountry, updateCountry, deleteCountry,
  getStates, createState, updateState, deleteState,
  getCities2, createCity, updateCity, deleteCity,
  getLoadingPorts, createLoadingPort, updateLoadingPort, deleteLoadingPort,
};
