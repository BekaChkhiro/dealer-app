const pool = require('../config/db');

async function listBrands(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name FROM car_brands ORDER BY name ASC'
    );
    res.json({ error: 0, success: true, data: result.rows });
  } catch (err) {
    console.error('listBrands error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createBrand(req, res) {
  try {
    const name = (req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 1, success: false, message: 'Brand name is required' });
    }

    const result = await pool.query(
      `INSERT INTO car_brands (name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name`,
      [name]
    );

    res.status(201).json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createBrand error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function listModels(req, res) {
  try {
    const { brand_id, brand } = req.query;

    let result;
    if (brand_id) {
      result = await pool.query(
        `SELECT m.id, m.name, m.brand_id, b.name AS brand_name
         FROM car_models m
         JOIN car_brands b ON b.id = m.brand_id
         WHERE m.brand_id = $1
         ORDER BY m.name ASC`,
        [parseInt(brand_id, 10)]
      );
    } else if (brand) {
      result = await pool.query(
        `SELECT m.id, m.name, m.brand_id, b.name AS brand_name
         FROM car_models m
         JOIN car_brands b ON b.id = m.brand_id
         WHERE LOWER(b.name) = LOWER($1)
         ORDER BY m.name ASC`,
        [String(brand).trim()]
      );
    } else {
      result = await pool.query(
        `SELECT m.id, m.name, m.brand_id, b.name AS brand_name
         FROM car_models m
         JOIN car_brands b ON b.id = m.brand_id
         ORDER BY b.name ASC, m.name ASC`
      );
    }

    res.json({ error: 0, success: true, data: result.rows });
  } catch (err) {
    console.error('listModels error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createModel(req, res) {
  try {
    const name = (req.body.name || '').trim();
    let brandId = req.body.brand_id ? parseInt(req.body.brand_id, 10) : null;
    const brandName = (req.body.brand || '').trim();

    if (!name) {
      return res.status(400).json({ error: 1, success: false, message: 'Model name is required' });
    }

    if (!brandId && !brandName) {
      return res.status(400).json({ error: 1, success: false, message: 'brand_id or brand is required' });
    }

    if (!brandId && brandName) {
      const brandResult = await pool.query(
        `INSERT INTO car_brands (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [brandName]
      );
      brandId = brandResult.rows[0].id;
    }

    const result = await pool.query(
      `INSERT INTO car_models (brand_id, name)
       VALUES ($1, $2)
       ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, brand_id, name`,
      [brandId, name]
    );

    res.status(201).json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createModel error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function upsertBrandAndModel(mark, model) {
  // Store brands/models uppercase so the dropdowns stay consistent.
  const trimmedMark = (mark || '').trim().toUpperCase();
  const trimmedModel = (model || '').trim().toUpperCase();
  if (!trimmedMark) return;

  const brandResult = await pool.query(
    `INSERT INTO car_brands (name)
     VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [trimmedMark]
  );
  const brandId = brandResult.rows[0].id;

  if (trimmedModel) {
    await pool.query(
      `INSERT INTO car_models (brand_id, name)
       VALUES ($1, $2)
       ON CONFLICT (brand_id, name) DO NOTHING`,
      [brandId, trimmedModel]
    );
  }
}

module.exports = {
  listBrands,
  createBrand,
  listModels,
  createModel,
  upsertBrandAndModel,
};
